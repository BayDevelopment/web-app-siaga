import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CircleAlert, Crosshair, Info, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type PickerArea = {
    id: number | string;
    name: string;
    /** Nama induk wilayah (mis. kelurahan), dipakai untuk pencarian cadangan. */
    parent_name?: string | null;
    center_lat?: number | string | null;
    center_lng?: number | string | null;
    boundary_geojson?: unknown;
};

type Props = {
    areas: PickerArea[];
    /** Nilai area_id dari form (string kosong jika belum dipilih). */
    areaId: string | number;
    /** Nilai latitude/longitude dari form (string kosong jika belum dipilih). */
    latitude: string | number;
    longitude: string | number;
    onChange: (lat: number, lng: number) => void;
    error?: string;
};

// Titik awal jika wilayah belum dipilih (sama dengan peta utama).
const DEFAULT_CENTER: [number, number] = [-6.0, 106.03];
const DEFAULT_ZOOM = 15;
const AREA_ZOOM = 16;

const PIN_ICON = L.divIcon({
    className: '',
    html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#f59e0b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45)"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

function toNumber(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

function parseGeoJson(value: unknown): GeoJSON.GeoJsonObject | null {
    if (!value) {
        return null;
    }

    try {
        return (
            typeof value === 'string' ? JSON.parse(value) : value
        ) as GeoJSON.GeoJsonObject;
    } catch {
        return null;
    }
}

export default function LocationPicker({
    areas,
    areaId,
    latitude,
    longitude,
    onChange,
    error,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const boundaryRef = useRef<L.GeoJSON | null>(null);

    // Selalu pakai callback terbaru tanpa membuat ulang peta.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [outside, setOutside] = useState(false);
    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [searchingArea, setSearchingArea] = useState(false);
    const [areaNote, setAreaNote] = useState<string | null>(null);

    const area = useMemo(
        () => areas.find((item) => String(item.id) === String(areaId)) ?? null,
        [areas, areaId],
    );

    const lat = toNumber(latitude);
    const lng = toNumber(longitude);

    /* Buat peta satu kali */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return;
        }

        const map = L.map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            scrollWheelZoom: false,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        map.on('click', (event: L.LeafletMouseEvent) => {
            onChangeRef.current(event.latlng.lat, event.latlng.lng);
        });

        mapRef.current = map;

        // Container baru tampil setelah layout selesai.
        const timer = setTimeout(() => map.invalidateSize(), 100);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
            boundaryRef.current = null;
        };
    }, []);

    /* Ikuti wilayah yang dipilih: batas wilayah + zoom ke area */
    useEffect(() => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        boundaryRef.current?.remove();
        boundaryRef.current = null;
        setAreaNote(null);

        const geojson = parseGeoJson(area?.boundary_geojson);

        if (geojson) {
            const layer = L.geoJSON(geojson, {
                style: {
                    color: '#1e40af',
                    weight: 2,
                    dashArray: '6 4',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.06,
                },
                interactive: false,
            }).addTo(map);

            boundaryRef.current = layer;

            const bounds = layer.getBounds();

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [24, 24], maxZoom: 18 });

                return;
            }
        }

        const centerLat = toNumber(area?.center_lat);
        const centerLng = toNumber(area?.center_lng);

        if (centerLat !== null && centerLng !== null) {
            map.setView([centerLat, centerLng], AREA_ZOOM);

            return;
        }

        // Cadangan: data wilayah tidak punya koordinat, cari lewat nama wilayah.
        if (!area) {
            return;
        }

        const controller = new AbortController();
        const query = [area.name, area.parent_name, 'Indonesia']
            .filter(Boolean)
            .join(', ');

        setSearchingArea(true);

        fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&q=${encodeURIComponent(query)}`,
            {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            },
        )
            .then((response) => (response.ok ? response.json() : []))
            .then((results: { lat: string; lon: string }[]) => {
                const first = results[0];

                if (first && mapRef.current === map) {
                    map.setView(
                        [Number(first.lat), Number(first.lon)],
                        AREA_ZOOM,
                    );
                } else if (!first) {
                    setAreaNote(
                        'Peta belum menemukan wilayah ini secara otomatis. Geser peta lalu klik lokasi kejadian.',
                    );
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setAreaNote(
                        'Peta belum menemukan wilayah ini secara otomatis. Geser peta lalu klik lokasi kejadian.',
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSearchingArea(false);
                }
            });

        return () => {
            controller.abort();
            setSearchingArea(false);
        };
    }, [area]);

    /* Sinkronkan pin dengan nilai form (klik peta, ketik manual, atau GPS) */
    useEffect(() => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        if (lat === null || lng === null) {
            markerRef.current?.remove();
            markerRef.current = null;
            setOutside(false);

            return;
        }

        const position = L.latLng(lat, lng);

        if (markerRef.current) {
            markerRef.current.setLatLng(position);
        } else {
            const marker = L.marker(position, {
                icon: PIN_ICON,
                draggable: true,
            }).addTo(map);

            marker.on('dragend', () => {
                const point = marker.getLatLng();

                onChangeRef.current(point.lat, point.lng);
            });

            markerRef.current = marker;
        }

        if (!map.getBounds().contains(position)) {
            map.panTo(position);
        }

        const bounds = boundaryRef.current?.getBounds();

        setOutside(
            Boolean(bounds && bounds.isValid() && !bounds.contains(position)),
        );
    }, [lat, lng, area]);

    function useMyLocation() {
        setGeoError(null);

        if (!('geolocation' in navigator)) {
            setGeoError('Perangkat Anda tidak mendukung lokasi otomatis.');

            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false);
                onChange(position.coords.latitude, position.coords.longitude);

                mapRef.current?.setView(
                    [position.coords.latitude, position.coords.longitude],
                    17,
                );
            },
            () => {
                setLocating(false);
                setGeoError(
                    'Lokasi tidak bisa diambil. Izinkan akses lokasi di browser, atau klik langsung di peta.',
                );
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    return (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="h-6 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Pilih lokasi di peta
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Klik peta atau geser pin. Latitude dan longitude
                            terisi otomatis.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-navy-200 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-navy-500/10"
                >
                    <Crosshair className="h-4 w-4" />
                    {locating ? 'Mencari lokasi…' : 'Gunakan lokasi saya'}
                </button>
            </div>

            {!area && (
                <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Pilih wilayah terlebih dahulu agar peta langsung menuju
                    wilayah tersebut.
                </p>
            )}

            {searchingArea && (
                <p className="mb-3 text-xs text-muted-foreground">
                    Mencari wilayah di peta…
                </p>
            )}

            {areaNote && (
                <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {areaNote}
                </p>
            )}

            <div className="relative isolate overflow-hidden rounded-xl border border-border">
                <div ref={containerRef} className="z-0 h-72 w-full sm:h-96" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-sun-500" />
                    {lat !== null && lng !== null ? (
                        <span className="font-mono text-foreground">
                            {lat.toFixed(6)}, {lng.toFixed(6)}
                        </span>
                    ) : (
                        'Belum ada titik dipilih'
                    )}
                </span>
            </div>

            {outside && (
                <p
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xl border border-sun-300/60 bg-sun-50 p-3 text-xs text-sun-600 dark:border-sun-500/20 dark:bg-sun-500/10 dark:text-sun-300"
                >
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Titik ini berada di luar batas wilayah yang dipilih.
                    Pastikan wilayah dan titik lokasi sudah sesuai.
                </p>
            )}

            {geoError && (
                <p
                    role="alert"
                    className="mt-3 flex items-start gap-2 text-xs text-red-600"
                >
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {geoError}
                </p>
            )}

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </section>
    );
}