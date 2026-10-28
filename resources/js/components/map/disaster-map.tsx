import 'leaflet/dist/leaflet.css';

import type { GeoJsonObject } from 'geojson';
import {
    CircleMarker,
    GeoJSON,
    MapContainer,
    Popup,
    TileLayer,
    ZoomControl,
} from 'react-leaflet';

export type MapType = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

export type MapReport = {
    id: number;
    code: string;
    type_id: number;
    title: string;
    description: string | null;
    lat: number;
    lng: number;
    address: string | null;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'verified' | 'handling';
    occurred_at: string | null;
};

export type MapZone = {
    id: number;
    disaster_type_id: number;
    name: string;
    level: string;
    description: string | null;
    geojson: GeoJsonObject;
};

export type MapFacility = {
    id: number;
    name: string;
    type: string;
    lat: number;
    lng: number;
    address: string | null;
    contact_phone: string | null;
};

export type MapBoundary = {
    type: 'Polygon';
    coordinates: number[][][];
};

const SEVERITY_LABEL: Record<string, string> = {
    low: 'Ringan',
    medium: 'Sedang',
    high: 'Berat',
    critical: 'Kritis',
};

const SEVERITY_RADIUS: Record<string, number> = {
    low: 8,
    medium: 10,
    high: 12,
    critical: 14,
};

const STATUS_LABEL: Record<string, string> = {
    verified: 'Terverifikasi',
    handling: 'Sedang ditangani',
};

const FACILITY_LABEL: Record<string, string> = {
    evacuation_point: 'Titik kumpul',
    posko: 'Posko',
    hydrant: 'Hidran',
    fire_post: 'Pos pemadam',
    clinic: 'Klinik',
};

const ZONE_LEVEL_LABEL: Record<string, string> = {
    low: 'Rawan rendah',
    medium: 'Rawan sedang',
    high: 'Rawan tinggi',
};

const FALLBACK_COLOR = '#64748b';

function formatTime(iso: string | null): string {
    if (!iso) return '-';

    return new Date(iso).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

type Props = {
    center: [number, number];
    zoom: number;

    reports: MapReport[];
    types: MapType[];
    zones: MapZone[];
    facilities: MapFacility[];

    activeTypeIds: number[];
    showZones: boolean;
    showFacilities: boolean;

    boundary: MapBoundary | null;
    boundaryName?: string | null;
};

export default function DisasterMap({
    center,
    zoom,
    reports,
    types,
    zones,
    facilities,
    activeTypeIds,
    showZones,
    showFacilities,
    boundary,
    boundaryName,
}: Props) {
    const typeById = new Map(types.map((t) => [t.id, t]));

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            zoomControl={false}
            scrollWheelZoom
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ZoomControl position="bottomleft" />

            {/* =========================
                BATAS WILAYAH
            ========================== */}
            {boundary && (
                <GeoJSON
                    key={`boundary-${boundaryName ?? 'area'}`}
                    data={boundary as GeoJsonObject}
                    style={{
                        color: '#2563eb',
                        weight: 3,
                        opacity: 1,
                        fillColor: '#3b82f6',
                        fillOpacity: 0.08,
                    }}
                >
                    {boundaryName && (
                        <Popup>
                            <div className="text-sm text-neutral-900">
                                <p className="font-semibold">
                                    {boundaryName}
                                </p>

                                <p className="text-xs text-neutral-600">
                                    Batas wilayah
                                </p>
                            </div>
                        </Popup>
                    )}
                </GeoJSON>
            )}

            {/* =========================
                ZONA RAWAN
            ========================== */}
            {showZones &&
                zones
                    .filter((z) =>
                        activeTypeIds.includes(z.disaster_type_id),
                    )
                    .map((z) => {
                        const color =
                            typeById.get(z.disaster_type_id)?.color ??
                            FALLBACK_COLOR;

                        return (
                            <GeoJSON
                                key={`zone-${z.id}`}
                                data={z.geojson}
                                style={{
                                    color,
                                    weight: 2,
                                    dashArray: '6 4',
                                    fillColor: color,
                                    fillOpacity: 0.15,
                                }}
                            >
                                <Popup>
                                    <div className="space-y-1 text-sm text-neutral-900">
                                        <p className="font-semibold">
                                            {z.name}
                                        </p>

                                        <p className="text-xs">
                                            {
                                                typeById.get(
                                                    z.disaster_type_id,
                                                )?.name
                                            }{' '}
                                            -{' '}
                                            {ZONE_LEVEL_LABEL[z.level] ??
                                                z.level}
                                        </p>

                                        {z.description && (
                                            <p>{z.description}</p>
                                        )}
                                    </div>
                                </Popup>
                            </GeoJSON>
                        );
                    })}

            {/* =========================
                FASILITAS
            ========================== */}
            {showFacilities &&
                facilities.map((f) => (
                    <CircleMarker
                        key={`fac-${f.id}`}
                        center={[f.lat, f.lng]}
                        radius={6}
                        pathOptions={{
                            color: '#0f172a',
                            weight: 3,
                            fillColor: '#ffffff',
                            fillOpacity: 1,
                        }}
                    >
                        <Popup>
                            <div className="space-y-1 text-sm text-neutral-900">
                                <p className="font-semibold">
                                    {f.name}
                                </p>

                                <p className="text-xs">
                                    {FACILITY_LABEL[f.type] ?? f.type}
                                </p>

                                {f.address && <p>{f.address}</p>}

                                {f.contact_phone && (
                                    <a
                                        className="text-blue-700 underline"
                                        href={`tel:${f.contact_phone}`}
                                    >
                                        {f.contact_phone}
                                    </a>
                                )}
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

            {/* =========================
                LAPORAN KEJADIAN
            ========================== */}
            {reports
                .filter((r) =>
                    activeTypeIds.includes(r.type_id),
                )
                .map((r) => {
                    const type = typeById.get(r.type_id);
                    const color =
                        type?.color ?? FALLBACK_COLOR;

                    return (
                        <CircleMarker
                            key={`rep-${r.id}`}
                            center={[r.lat, r.lng]}
                            radius={
                                SEVERITY_RADIUS[r.severity] ?? 10
                            }
                            pathOptions={{
                                color: '#ffffff',
                                weight: 2,
                                fillColor: color,
                                fillOpacity: 0.9,
                            }}
                        >
                            <Popup>
                                <div className="min-w-48 space-y-1 text-sm text-neutral-900">
                                    <p className="font-semibold">
                                        {r.title}
                                    </p>

                                    <p className="text-xs">
                                        {type?.name} -{' '}
                                        {SEVERITY_LABEL[r.severity]}
                                    </p>

                                    <p className="text-xs">
                                        {STATUS_LABEL[r.status] ??
                                            r.status}
                                    </p>

                                    {r.description && (
                                        <p>{r.description}</p>
                                    )}

                                    {r.address && (
                                        <p className="text-xs">
                                            {r.address}
                                        </p>
                                    )}

                                    <p className="text-xs text-neutral-600">
                                        {formatTime(r.occurred_at)} -{' '}
                                        {r.code}
                                    </p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
        </MapContainer>
    );
}