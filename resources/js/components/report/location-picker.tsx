import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleAlert, Crosshair, Info, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Tipe ---------- */

export type PickerArea = {
    id: number | string;
    name: string;
    center_lat?: number | string | null;
    center_lng?: number | string | null;
    boundary_geojson?: unknown;
};

export type PointGeo = {
    type: "Point";
    coordinates: [number, number];
};

type Props = {
    areas?: PickerArea[] | null;
    /** Nilai area_id dari form (string kosong jika belum dipilih). */
    areaId: string | number;
    /** Nilai latitude/longitude dari form (string kosong jika belum dipilih). */
    latitude: string | number;
    longitude: string | number;
    onChange: (geo: PointGeo | null) => void;
    error?: string;
};

type Polygon = number[][][]; // [ring][titik][lng, lat]

/* ---------- Konstanta ---------- */

// Titik awal jika wilayah belum dipilih (sama dengan peta utama).
const DEFAULT_CENTER: [number, number] = [-6.0, 106.03];
const DEFAULT_ZOOM = 15;
const AREA_ZOOM = 16;
const LOCATE_ZOOM = 17;

// Pin memakai warna brand (sun-500) dari app.css; fallback jika variabel
// belum ter-generate oleh Tailwind.
const PIN_ICON = L.divIcon({
    className: "",
    html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:var(--color-sun-500,oklch(0.74 0.17 58));border:3px solid oklch(1 0 0);box-shadow:0 2px 8px oklch(0 0 0 / .45)"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

// Warna garis/isi dikontrol lewat class (mendukung dark mode),
// sehingga atribut `color` hanya berfungsi sebagai fallback.
const BOUNDARY_STYLE: L.PathOptions = {
    color: "oklch(0.47 0.18 259)",
    weight: 2,
    dashArray: "6 4",
    fillColor: "oklch(0.55 0.19 258)",
    fillOpacity: 0.06,
    className: "stroke-navy-600 fill-navy-500 dark:stroke-navy-400",
};

/* ---------- Helper ---------- */

function toNumber(value: unknown): number | null {
    if (value === "" || value === null || value === undefined) {
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
            typeof value === "string" ? JSON.parse(value) : value
        ) as GeoJSON.GeoJsonObject;
    } catch {
        return null;
    }
}

/** Ambil semua polygon dari Feature / FeatureCollection / Geometry apa pun. */
function collectPolygons(geo: GeoJSON.GeoJsonObject | null): Polygon[] {
    if (!geo) {
        return [];
    }

    switch (geo.type) {
        case "Polygon":
            return [(geo as GeoJSON.Polygon).coordinates];
        case "MultiPolygon":
            return (geo as GeoJSON.MultiPolygon).coordinates;
        case "Feature":
            return collectPolygons(
                (geo as GeoJSON.Feature).geometry as GeoJSON.GeoJsonObject | null,
            );
        case "FeatureCollection":
            return (geo as GeoJSON.FeatureCollection).features.flatMap(
                (feature) => collectPolygons(feature),
            );
        case "GeometryCollection":
            return (geo as GeoJSON.GeometryCollection).geometries.flatMap(
                (geometry) => collectPolygons(geometry),
            );
        default:
            return [];
    }
}

/** Ray casting: apakah titik berada di dalam satu ring. */
function inRing(x: number, y: number, ring: number[][]): boolean {
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }

    return inside;
}

function inPolygon(x: number, y: number, polygon: Polygon): boolean {
    const [outer, ...holes] = polygon;

    if (!outer || !inRing(x, y, outer)) {
        return false;
    }

    return !holes.some((hole) => inRing(x, y, hole));
}

/* ---------- Komponen kecil ---------- */

const NOTICE_TONES = {
    warning: {
        box: "border-sun-300/60 bg-sun-50 dark:border-sun-500/20 dark:bg-sun-500/10",
        icon: "text-sun-600 dark:text-sun-400",
    },
    danger: {
        box: "border-destructive/30 bg-destructive/10 dark:border-destructive-foreground/20 dark:bg-destructive/20",
        icon: "text-destructive-foreground",
    },
} as const;

function Notice({
    tone,
    icon: Icon,
    alert = false,
    children,
}: {
    tone: keyof typeof NOTICE_TONES;
    icon: LucideIcon;
    alert?: boolean;
    children: ReactNode;
}) {
    const styles = NOTICE_TONES[tone];

    return (
        <div
            role={alert ? "alert" : undefined}
            className={`flex items-start gap-2 rounded-lg border px-3.5 py-3 text-xs leading-5 text-foreground ${styles.box}`}
        >
            <Icon className={`mt-0.5 size-3.5 shrink-0 ${styles.icon}`} />
            <span>{children}</span>
        </div>
    );
}

/* ---------- Komponen utama ---------- */

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

    useEffect(() => {
        onChangeRef.current = onChange;
    });

    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    // Inertia/Laravel bisa mengirim null; default parameter hanya menangani undefined.
    const area = useMemo(
        () =>
            (Array.isArray(areas) ? areas : []).find(
                (item) => String(item.id) === String(areaId),
            ) ?? null,
        [areas, areaId],
    );

    const boundary = useMemo(
        () => parseGeoJson(area?.boundary_geojson),
        [area],
    );

    const polygons = useMemo(() => collectPolygons(boundary), [boundary]);

    const lat = toNumber(latitude);
    const lng = toNumber(longitude);

    // Dihitung langsung (tanpa state) dan memakai polygon sebenarnya,
    // bukan sekadar kotak pembatas, supaya peringatan akurat.
    const outside =
        lat !== null &&
        lng !== null &&
        polygons.length > 0 &&
        !polygons.some((polygon) => inPolygon(lng, lat, polygon));

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

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        map.on("click", (event: L.LeafletMouseEvent) => {
            onChangeRef.current({
                type: "Point",
                coordinates: [event.latlng.lng, event.latlng.lat],
            });
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

        if (boundary) {
            const layer = L.geoJSON(boundary, {
                style: BOUNDARY_STYLE,
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
        }
    }, [area, boundary]);

    /* Sinkronkan pin dengan nilai form (klik peta, ketik manual, atau GPS) */
    useEffect(() => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        if (lat === null || lng === null) {
            markerRef.current?.remove();
            markerRef.current = null;

            return;
        }

        const position = L.latLng(lat, lng);

        if (markerRef.current) {
            markerRef.current.setLatLng(position);
        } else {
            const marker = L.marker(position, {
                icon: PIN_ICON,
                draggable: true,
                title: "Geser untuk memindahkan titik",
            }).addTo(map);

            marker.on("dragend", () => {
                const point = marker.getLatLng();

                onChangeRef.current({
                    type: "Point",
                    coordinates: [point.lng, point.lat],
                });
            });

            markerRef.current = marker;
        }

        if (!map.getBounds().contains(position)) {
            map.panTo(position);
        }
    }, [lat, lng]);

    // Bukan hook, jadi tidak diawali "use" (menghindari false-positive aturan hooks).
    function handleLocate() {
        setGeoError(null);

        if (!("geolocation" in navigator)) {
            setGeoError("Perangkat Anda tidak mendukung lokasi otomatis.");

            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude: gpsLat, longitude: gpsLng } = position.coords;

                setLocating(false);
                onChange({ type: "Point", coordinates: [gpsLng, gpsLat] });
                mapRef.current?.setView([gpsLat, gpsLng], LOCATE_ZOOM);
            },
            (failure) => {
                setLocating(false);
                setGeoError(
                    failure.code === failure.PERMISSION_DENIED
                        ? "Akses lokasi ditolak. Izinkan akses lokasi di browser, atau klik langsung di peta."
                        : "Lokasi tidak bisa diambil. Coba lagi, atau klik langsung di peta.",
                );
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    return (
        <div className="w-full min-w-0 space-y-4">
            {/* Toolbar: info + tombol GPS */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                        Klik peta untuk memilih titik, lalu geser pin jika perlu.
                        Koordinat akan terisi otomatis.
                    </span>
                </p>

                <button
                    type="button"
                    onClick={handleLocate}
                    disabled={locating}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-sm transition outline-none hover:border-navy-200 hover:bg-navy-50 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10"
                >
                    <Crosshair className="size-4" />
                    {locating ? "Mencari lokasi…" : "Gunakan lokasi saya"}
                </button>
            </div>

            {/* Peta */}
            <div className="relative isolate overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm">
                {/*
                  leaflet.css tidak berada di dalam @layer, jadi untuk menimpanya
                  class di bawah memakai modifier `!` (important).
                */}
                <div
                    ref={containerRef}
                    role="application"
                    aria-label="Peta pemilih lokasi"
                    className={[
                        "z-0 h-80 w-full font-sans! sm:h-[420px]",
                        // Tile sedikit diredam di dark mode agar tidak menyilaukan.
                        "dark:[&_.leaflet-tile-pane]:brightness-[0.8] dark:[&_.leaflet-tile-pane]:contrast-[1.05]",
                        // Kontrol zoom
                        "[&_.leaflet-bar]:border-border! [&_.leaflet-bar]:shadow-md!",
                        "[&_.leaflet-bar_a]:bg-card! [&_.leaflet-bar_a]:text-foreground! [&_.leaflet-bar_a]:border-border!",
                        "[&_.leaflet-bar_a:hover]:bg-accent!",
                        // Atribusi
                        "[&_.leaflet-control-attribution]:bg-card/80! [&_.leaflet-control-attribution]:text-[10px]! [&_.leaflet-control-attribution]:text-muted-foreground!",
                        "[&_.leaflet-control-attribution_a]:text-primary!",
                    ].join(" ")}
                />
            </div>

            {/* Koordinat + nama area */}
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sun-100 text-sun-600 dark:bg-sun-500/10 dark:text-sun-400">
                        <MapPin className="size-3.5" />
                    </span>

                    {lat !== null && lng !== null ? (
                        <span className="font-mono text-foreground">
                            {lat.toFixed(6)}, {lng.toFixed(6)}
                        </span>
                    ) : (
                        <span>Belum ada titik dipilih</span>
                    )}
                </div>

                {area && (
                    <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold text-navy-600 dark:bg-navy-500/10 dark:text-navy-400">
                        {area.name}
                    </span>
                )}
            </div>

            {/* Peringatan & error */}
            {!area && (
                <Notice tone="warning" icon={Info}>
                    Pilih wilayah terlebih dahulu agar peta langsung menuju
                    wilayah tersebut.
                </Notice>
            )}

            {outside && (
                <Notice tone="warning" icon={CircleAlert} alert>
                    Titik ini berada di luar batas wilayah yang dipilih.
                    Pastikan wilayah dan titik lokasi sudah sesuai.
                </Notice>
            )}

            {geoError && (
                <Notice tone="danger" icon={CircleAlert} alert>
                    {geoError}
                </Notice>
            )}

            {error && (
                <p
                    role="alert"
                    className="text-xs font-medium text-destructive-foreground"
                >
                    {error}
                </p>
            )}
        </div>
    );
}