import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import { useEffect, useState } from 'react';
import {
    MapContainer,
    Marker,
    Polygon,
    Polyline,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';

export type PolygonGeo = {
    type: 'Polygon';
    coordinates: number[][][];
};

export type Center = {
    lat: number;
    lng: number;
};

type Props = {
    value: PolygonGeo | null;
    onChange: (geo: PolygonGeo | null, center: Center | null) => void;
};

const DEFAULT_VIEW: LatLngTuple = [-6.12, 106.15];

const vertexIcon = L.divIcon({
    className: '',
    html: `
        <div
            style="
                width:14px;
                height:14px;
                border-radius:9999px;
                background:#0ea5e9;
                border:2px solid #fff;
                box-shadow:0 0 0 1px #0369a1;
            "
        ></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const sameLatLng = (a: LatLngTuple, b: LatLngTuple) =>
    a[0] === b[0] && a[1] === b[1];

function fromGeo(value: PolygonGeo | null): LatLngTuple[] {
    const ring = value?.coordinates?.[0] ?? [];

    const points = ring.map(
        ([lng, lat]) => [lat, lng] as LatLngTuple,
    );

    if (
        points.length > 1 &&
        sameLatLng(points[0], points[points.length - 1])
    ) {
        points.pop();
    }

    return points;
}

function ClickToAdd({
    onAdd,
}: {
    onAdd: (point: LatLngTuple) => void;
}) {
    useMapEvents({
        click(event) {
            onAdd([
                event.latlng.lat,
                event.latlng.lng,
            ]);
        },
    });

    return null;
}

function FitTo({
    points,
    token,
}: {
    points: LatLngTuple[];
    token: number;
}) {
    const map = useMap();

    useEffect(() => {
        if (token > 0 && points.length >= 2) {
            map.fitBounds(L.latLngBounds(points), {
                padding: [24, 24],
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return null;
}

export default function BoundaryEditor({
    value,
    onChange,
}: Props) {
    const [initial] = useState(() => fromGeo(value));

    const [points, setPoints] =
        useState<LatLngTuple[]>(initial);

    const [fitToken, setFitToken] = useState(0);

    const emit = (next: LatLngTuple[]) => {
        setPoints(next);

        if (next.length >= 3) {
            const ring = [
                ...next,
                next[0],
            ].map(([lat, lng]) => [lng, lat]);

            const lats = next.map((point) => point[0]);
            const lngs = next.map((point) => point[1]);

            onChange(
                {
                    type: 'Polygon',
                    coordinates: [ring],
                },
                {
                    lat:
                        (Math.min(...lats) +
                            Math.max(...lats)) /
                        2,
                    lng:
                        (Math.min(...lngs) +
                            Math.max(...lngs)) /
                        2,
                },
            );
        } else {
            onChange(null, null);
        }
    };

    const addPoint = (point: LatLngTuple) => {
        emit([...points, point]);
    };

    const removeLastPoint = () => {
        if (!points.length) return;

        emit(points.slice(0, -1));
    };

    const clearPoints = () => {
        emit([]);
    };

    return (
        <div className="space-y-3">
            {/* MAP */}
            <div className="h-[460px] overflow-hidden rounded-lg border">
                <MapContainer
                    center={
                        initial.length
                            ? initial[0]
                            : DEFAULT_VIEW
                    }
                    zoom={
                        initial.length
                            ? 16
                            : 11
                    }
                    bounds={
                        initial.length >= 2
                            ? L.latLngBounds(initial)
                            : undefined
                    }
                    boundsOptions={{
                        padding: [24, 24],
                    }}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <ClickToAdd
                        onAdd={addPoint}
                    />

                    <FitTo
                        points={points}
                        token={fitToken}
                    />

                    {/* GARIS / POLYGON */}
                    {points.length >= 3 ? (
                        <Polygon
                            positions={points}
                            pathOptions={{
                                color: '#0ea5e9',
                                weight: 3,
                                fillOpacity: 0.15,
                                interactive: false,
                            }}
                        />
                    ) : points.length === 2 ? (
                        <Polyline
                            positions={points}
                            pathOptions={{
                                color: '#0ea5e9',
                                weight: 3,
                                interactive: false,
                            }}
                        />
                    ) : null}

                    {/* TITIK */}
                    {points.map((point, index) => (
                        <Marker
                            key={`${index}-${point[0]}-${point[1]}`}
                            position={point}
                            icon={vertexIcon}
                            draggable
                            eventHandlers={{
                                dragend(event) {
                                    const marker =
                                        event.target as L.Marker;

                                    const latLng =
                                        marker.getLatLng();

                                    emit(
                                        points.map(
                                            (
                                                current,
                                                currentIndex,
                                            ) =>
                                                currentIndex ===
                                                index
                                                    ? [
                                                          latLng.lat,
                                                          latLng.lng,
                                                      ]
                                                    : current,
                                        ),
                                    );
                                },

                                contextmenu() {
                                    emit(
                                        points.filter(
                                            (_, currentIndex) =>
                                                currentIndex !==
                                                index,
                                        ),
                                    );
                                },
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* PETUNJUK */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">
                    Cara menggambar zona
                </p>

                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-blue-800">
                    <li>
                        Klik beberapa titik pada peta
                        mengikuti batas wilayah zona.
                    </li>
                    <li>
                        Minimal gunakan 3 titik untuk
                        membentuk zona.
                    </li>
                    <li>
                        Seret titik biru untuk
                        memperbaiki posisi.
                    </li>
                    <li>
                        Klik kanan pada titik untuk
                        menghapus titik tersebut.
                    </li>
                </ol>
            </div>

            {/* BUTTON */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={!points.length}
                    onClick={removeLastPoint}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    ↶ Urungkan Titik
                </button>

                <button
                    type="button"
                    disabled={!points.length}
                    onClick={clearPoints}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Hapus Semua Titik
                </button>

                {points.length >= 2 && (
                    <button
                        type="button"
                        onClick={() =>
                            setFitToken(
                                (token) => token + 1,
                            )
                        }
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Fokus ke Zona
                    </button>
                )}
            </div>

            {/* STATUS */}
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
                {points.length < 3 ? (
                    <p className="text-slate-500">
                        Belum membentuk zona. Tambahkan{' '}
                        <span className="font-semibold">
                            minimal 3 titik
                        </span>{' '}
                        pada peta.
                    </p>
                ) : (
                    <p className="font-medium text-green-700">
                        ✓ Zona berhasil dibuat dengan{' '}
                        {points.length} titik.
                    </p>
                )}
            </div>
        </div>
    );
}