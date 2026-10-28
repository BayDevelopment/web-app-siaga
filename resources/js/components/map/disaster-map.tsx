import 'leaflet/dist/leaflet.css';

import type { GeoJsonObject, Point } from 'geojson';
import L from 'leaflet';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    Circle,
    GeoJSON,
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    ZoomControl,
} from 'react-leaflet';

import { getMapIcon } from '@/components/map/map-icons';
import ReportMarker from '@/components/map/report-marker';

export type MapType = {
    id: number;
    name: string;
    slug: string;
    color: string;
    icon?: string | null;
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
    radius_m?: number | null;
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

/** Warna + ikon tiap jenis fasilitas. Tambah di sini bila ada jenis baru. */
const FACILITY_CONFIG: Record<
    string,
    { label: string; color: string; icon: string }
> = {
    evacuation_point: {
        label: 'Titik kumpul',
        color: '#16a34a',
        icon: 'lifebuoy',
    },
    posko: { label: 'Posko', color: '#2563eb', icon: 'tent' },
    hydrant: { label: 'Hidran', color: '#dc2626', icon: 'droplets' },
    fire_post: { label: 'Pos pemadam', color: '#ea580c', icon: 'flame' },
    clinic: { label: 'Klinik', color: '#0d9488', icon: 'hospital' },
};

const FACILITY_FALLBACK = { label: '', color: '#475569', icon: 'alert' };

const ZONE_LEVEL_LABEL: Record<string, string> = {
    low: 'Rawan rendah',
    medium: 'Rawan sedang',
    high: 'Rawan tinggi',
};

/** Semakin tinggi risiko, semakin besar marker. */
const ZONE_LEVEL_SIZE: Record<string, number> = {
    low: 32,
    medium: 38,
    high: 44,
};

const FALLBACK_COLOR = '#64748b';

/** Cache supaya objek icon tidak dibuat ulang tiap render (mencegah marker berkedip). */
const iconCache = new globalThis.Map<string, L.DivIcon>();

/** Marker bulat/kotak berwarna + ikon (dibangun di sini agar tidak bergantung versi map-icons). */
function buildIcon(
    color: string,
    iconKey: string | null | undefined,
    size: number,
    shape: 'circle' | 'square',
): L.DivIcon {
    const Icon = getMapIcon(iconKey);
    const svg = renderToStaticMarkup(
        <Icon size={Math.round(size * 0.5)} color="#ffffff" strokeWidth={2.2} />,
    );

    return L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);border-radius:${shape === 'square' ? '10px' : '9999px'};display:flex;align-items:center;justify-content:center;">${svg}</div>`,
    });
}

function cachedIcon(
    color: string,
    iconKey: string | null | undefined,
    size: number,
    shape: 'circle' | 'square' = 'circle',
): L.DivIcon {
    const key = `${color}|${iconKey ?? ''}|${size}|${shape}`;
    let icon = iconCache.get(key);

    if (!icon) {
        icon = buildIcon(color, iconKey, size, shape);
        iconCache.set(key, icon);
    }

    return icon;
}

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

/** Kembalikan [lat, lng] bila geojson berupa Point yang valid. */
function asPoint(data: GeoJsonObject | null): [number, number] | null {
    if (!data || data.type !== 'Point') {
        return null;
    }

    const [lng, lat] = (data as Point).coordinates;

    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

/** koordinat kosong di database menjadi 0 setelah (float) null */
function hasValidCoords(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        !(lat === 0 && lng === 0)
    );
}

type LegendItem = {
    key: string;
    label: string;
    color: string;
    icon: string | null | undefined;
};

function LegendRow({
    item,
    shape,
}: {
    item: LegendItem;
    shape: 'circle' | 'square';
}) {
    const Icon = getMapIcon(item.icon);

    return (
        <li className="flex items-center gap-2.5">
            <span
                className={`flex size-6 shrink-0 items-center justify-center text-white shadow ring-2 ring-white ${
                    shape === 'circle' ? 'rounded-full' : 'rounded-md'
                }`}
                style={{ backgroundColor: item.color }}
            >
                <Icon className="size-3.5" />
            </span>
            <span className="truncate text-xs text-neutral-800">
                {item.label}
            </span>
        </li>
    );
}

function Legend({
    zoneItems,
    facilityItems,
}: {
    zoneItems: LegendItem[];
    facilityItems: LegendItem[];
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        if (ref.current) {
            L.DomEvent.disableClickPropagation(ref.current);
            L.DomEvent.disableScrollPropagation(ref.current);
        }
    }, []);

    if (zoneItems.length === 0 && facilityItems.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            className="absolute right-3 bottom-6 z-[1000] w-52 overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-black/10 backdrop-blur"
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
                <span className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                    <Layers className="size-4 text-blue-600" />
                    Legenda
                </span>
                {open ? (
                    <ChevronDown className="size-4 text-neutral-500" />
                ) : (
                    <ChevronUp className="size-4 text-neutral-500" />
                )}
            </button>

            {open && (
                <div className="max-h-64 space-y-3 overflow-y-auto border-t border-neutral-200 px-3 py-3">
                    {zoneItems.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                                Zona rawan
                            </p>
                            <ul className="space-y-1.5">
                                {zoneItems.map((item) => (
                                    <LegendRow
                                        key={item.key}
                                        item={item}
                                        shape="circle"
                                    />
                                ))}
                            </ul>
                            <p className="mt-2 text-[10px] text-neutral-500">
                                Ukuran marker = tingkat risiko.
                            </p>
                        </div>
                    )}

                    {facilityItems.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                                Fasilitas
                            </p>
                            <ul className="space-y-1.5">
                                {facilityItems.map((item) => (
                                    <LegendRow
                                        key={item.key}
                                        item={item}
                                        shape="square"
                                    />
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
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
    const typeById = useMemo(
        () => new globalThis.Map(types.map((t) => [t.id, t] as [number, MapType])),
        [types],
    );

    const visibleZones = useMemo(
        () =>
            showZones
                ? zones.filter(
                      (z) =>
                          z.disaster_type_id == null ||
                          activeTypeIds.includes(z.disaster_type_id),
                  )
                : [],
        [zones, showZones, activeTypeIds],
    );

    const visibleFacilities = useMemo(
        () =>
            showFacilities
                ? facilities.filter((f) => hasValidCoords(f.lat, f.lng))
                : [],
        [facilities, showFacilities],
    );

    // Legenda hanya memuat jenis yang benar-benar tampil di peta saat ini.
    const zoneLegend = useMemo<LegendItem[]>(() => {
        const seen = new globalThis.Map<string, LegendItem>();

        for (const z of visibleZones) {
            const type =
                z.disaster_type_id != null
                    ? typeById.get(z.disaster_type_id)
                    : undefined;
            const key = String(type?.id ?? 'none');

            if (!seen.has(key)) {
                seen.set(key, {
                    key,
                    label: type?.name ?? 'Zona umum',
                    color: type?.color ?? FALLBACK_COLOR,
                    icon: type?.icon,
                });
            }
        }

        return [...seen.values()];
    }, [visibleZones, typeById]);

    const facilityLegend = useMemo<LegendItem[]>(() => {
        const seen = new globalThis.Map<string, LegendItem>();

        for (const f of visibleFacilities) {
            if (!seen.has(f.type)) {
                const config = FACILITY_CONFIG[f.type] ?? FACILITY_FALLBACK;

                seen.set(f.type, {
                    key: f.type,
                    label: config.label || f.type,
                    color: config.color,
                    icon: config.icon,
                });
            }
        }

        return [...seen.values()];
    }, [visibleFacilities]);

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
                                <p className="font-semibold">{boundaryName}</p>

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
                - Point  : marker berikon (+ lingkaran bila ada radius)
                - Polygon: tetap digambar seperti sebelumnya (data lama)
            ========================== */}
            {visibleZones.map((z) => {
                const data = toGeoJson(z.geojson);

                if (!data) {
                    return null;
                }

                const zoneType =
                    z.disaster_type_id != null
                        ? typeById.get(z.disaster_type_id)
                        : undefined;

                const color = zoneType?.color ?? FALLBACK_COLOR;

                const popup = (
                    <Popup>
                        <div className="space-y-1 text-sm text-neutral-900">
                            <p className="font-semibold">{z.name}</p>

                            <p className="text-xs">
                                {zoneType?.name ?? 'Zona'} -{' '}
                                {ZONE_LEVEL_LABEL[z.level] ?? z.level}
                            </p>

                            {z.radius_m ? (
                                <p className="text-xs text-neutral-600">
                                    Radius {z.radius_m} m
                                </p>
                            ) : null}

                            {z.description && <p>{z.description}</p>}
                        </div>
                    </Popup>
                );

                const point = asPoint(data);

                if (point) {
                    return (
                        <Fragment key={`zone-${z.id}`}>
                            {z.radius_m ? (
                                <Circle
                                    center={point}
                                    radius={z.radius_m}
                                    pathOptions={{
                                        interactive: false,
                                        color,
                                        weight: 2,
                                        dashArray: '6 4',
                                        fillColor: color,
                                        fillOpacity: 0.15,
                                    }}
                                />
                            ) : null}

                            <Marker
                                position={point}
                                icon={cachedIcon(
                                    color,
                                    zoneType?.icon,
                                    ZONE_LEVEL_SIZE[z.level] ?? 38,
                                )}
                            >
                                {popup}
                            </Marker>
                        </Fragment>
                    );
                }

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
                        {popup}
                    </GeoJSON>
                );
            })}

            {/* =========================
                FASILITAS DARURAT
            ========================== */}
            {visibleFacilities.map((f) => {
                const config = FACILITY_CONFIG[f.type] ?? FACILITY_FALLBACK;

                return (
                    <Marker
                        key={`fac-${f.id}`}
                        position={[f.lat, f.lng]}
                        icon={cachedIcon(
                            config.color,
                            config.icon,
                            32,
                            'square',
                        )}
                    >
                        <Popup>
                            <div className="space-y-1 text-sm text-neutral-900">
                                <p className="font-semibold">{f.name}</p>

                                <p className="text-xs">
                                    {config.label || f.type}
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
                    </Marker>
                );
            })}

            {/* =========================
                LAPORAN KEJADIAN
            ========================== */}
            {reports
                .filter((report) => activeTypeIds.includes(report.type_id))
                .map((report) => (
                    <ReportMarker
                        key={`report-${report.id}`}
                        report={report}
                        type={typeById.get(report.type_id)}
                    />
                ))}

            {/* =========================
                LEGENDA
            ========================== */}
            <Legend zoneItems={zoneLegend} facilityItems={facilityLegend} />
        </MapContainer>
    );
}