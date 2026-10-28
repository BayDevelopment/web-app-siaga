import 'leaflet/dist/leaflet.css';

import type { GeoJsonObject } from 'geojson';
import {
    GeoJSON,
    MapContainer,
    Popup,
    TileLayer,
    ZoomControl,
    CircleMarker,
} from 'react-leaflet';

import ReportMarker from '@/components/map/report-marker';

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
    disaster_type_id: number | null;
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

/** geojson bisa datang sebagai string (jika model belum di-cast array) atau null */
function toGeoJson(value: unknown): GeoJsonObject | null {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as GeoJsonObject;
        } catch {
            return null;
        }
    }

    return value as GeoJsonObject;
}

/** koordinat kosong di database menjadi 0 setelah (float) null */
function hasValidCoords(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        !(lat === 0 && lng === 0)
    );
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
                    .filter(
                        (z) =>
                            z.disaster_type_id == null ||
                            activeTypeIds.includes(z.disaster_type_id),
                    )
                    .map((z) => {
                        const data = toGeoJson(z.geojson);

                        if (!data) {
                            return null;
                        }

                        const zoneType =
                            z.disaster_type_id != null
                                ? typeById.get(z.disaster_type_id)
                                : undefined;

                        const color = zoneType?.color ?? FALLBACK_COLOR;

                        return (
                            <GeoJSON
                                key={`zone-${z.id}`}
                                data={data}
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
                                            {zoneType?.name ?? 'Zona'}{' '}
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
                FASILITAS DARURAT
            ========================== */}
            {showFacilities &&
                facilities
                    .filter((f) => hasValidCoords(f.lat, f.lng))
                    .map((f) => (
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
                .filter((report) =>
                    activeTypeIds.includes(report.type_id),
                )
                .map((report) => (
                    <ReportMarker
                        key={`report-${report.id}`}
                        report={report}
                        type={typeById.get(report.type_id)}
                    />
                ))}
        </MapContainer>
    );
}