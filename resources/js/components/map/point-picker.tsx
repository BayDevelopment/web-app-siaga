import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, LoaderCircle, MapPin, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Circle,
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import { toast } from 'sonner';

import { makeMarkerIcon } from '@/components/map/map-icons';

/** GeoJSON Point: urutan koordinat [lng, lat] */
export type PointGeo = {
    type: 'Point';
    coordinates: [number, number];
};

type Props = {
    value: PointGeo | null;
    onChange: (geo: PointGeo | null) => void;
    color?: string;
    iconKey?: string | null;
    /** radius area pengaruh dalam meter (opsional) */
    radius?: number | null;
    /** pusat peta bila belum ada titik, format [lat, lng] */
    center?: [number, number];
};

const DEFAULT_CENTER: [number, number] = [-6.1201, 106.1503];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(event) {
            onPick(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

function LocateButton({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    const map = useMap();
    const wrapper = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (wrapper.current) {
            L.DomEvent.disableClickPropagation(wrapper.current);
        }
    }, []);

    const locate = () => {
        if (!navigator.geolocation) {
            toast.error('Browser tidak mendukung GPS.');
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                onPick(coords.latitude, coords.longitude);
                map.setView(
                    [coords.latitude, coords.longitude],
                    Math.max(map.getZoom(), 16),
                );
                setLoading(false);
            },
            () => {
                setLoading(false);
                toast.error(
                    'Lokasi tidak dapat diakses. Izinkan akses lokasi di browser.',
                );
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    return (
        <div ref={wrapper} className="absolute top-3 right-3 z-[1000]">
            <button
                type="button"
                onClick={locate}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-md ring-1 ring-border transition hover:bg-navy-50 disabled:opacity-60"
            >
                {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <Crosshair className="size-4 text-navy-500" />
                )}
                Lokasi saya
            </button>
        </div>
    );
}

export default function PointPicker({
    value,
    onChange,
    color = '#2563eb',
    iconKey,
    radius,
    center = DEFAULT_CENTER,
}: Props) {
    const position: [number, number] | null = value
        ? [value.coordinates[1], value.coordinates[0]]
        : null;

    const icon = useMemo(() => makeMarkerIcon(color, iconKey), [color, iconKey]);

    const pick = (lat: number, lng: number) => {
        onChange({
            type: 'Point',
            coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
        });
    };

    return (
        <div className="space-y-3">
            <div className="relative isolate z-0 h-[380px] overflow-hidden rounded-2xl border border-border shadow-sm">
                <MapContainer
                    center={position ?? center}
                    zoom={position ? 16 : 14}
                    scrollWheelZoom
                    className="size-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <ClickHandler onPick={pick} />
                    <LocateButton onPick={pick} />

                    {position && (
                        <>
                            <Marker
                                position={position}
                                icon={icon}
                                draggable
                                eventHandlers={{
                                    dragend: (event) => {
                                        const { lat, lng } = (
                                            event.target as L.Marker
                                        ).getLatLng();
                                        pick(lat, lng);
                                    },
                                }}
                            />

                            {radius && radius > 0 ? (
                                <Circle
                                    center={position}
                                    radius={radius}
                                    pathOptions={{
                                        color,
                                        weight: 2,
                                        fillColor: color,
                                        fillOpacity: 0.15,
                                    }}
                                />
                            ) : null}
                        </>
                    )}
                </MapContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {value ? (
                    <>
                        <span className="inline-flex items-center gap-2 rounded-lg bg-forest-100 px-3 py-1.5 font-medium text-forest-800 dark:bg-forest-500/15 dark:text-forest-400">
                            <MapPin className="size-3.5" />
                            Lat {value.coordinates[1]} · Lng {value.coordinates[0]}
                        </span>

                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-semibold text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                            <X className="size-3.5" />
                            Hapus titik
                        </button>
                    </>
                ) : (
                    <span className="text-muted-foreground">
                        Klik peta untuk menaruh titik, lalu geser marker bila
                        perlu.
                    </span>
                )}
            </div>
        </div>
    );
}