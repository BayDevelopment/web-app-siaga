import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronRight,
    Flame,
    MapPin,
    Mountain,
    ShieldAlert,
    Siren,
    TreePine,
    Waves,
} from 'lucide-react';
import { useState } from 'react';

import DisasterMap, {
    type MapBoundary,
    type MapFacility,
    type MapReport,
    type MapType,
    type MapZone,
} from '@/components/map/disaster-map';

type Role = 'admin' | 'petugas' | 'warga';

type User = {
    id: number;
    name: string;
    role: Role;
};

type Area = {
    id: number;
    name: string;
    type: string;
    slug: string | null;
    parent: string | null;
};

type AreaOption = {
    id: number;
    name: string;
    type: string;
    slug: string;
    parent_name: string | null;
    label: string;
};

type Stats = {
    total_reports: number;
    active_reports: number;
    verified_reports: number;
    handling_reports: number;
    critical_reports: number;
    high_reports: number;
    total_areas: number;
    total_facilities: number;
};

type Props = {
    auth: {
        user: User;
    };

    area: Area;

    areas: AreaOption[];

    boundary: MapBoundary | null;

    center: [number, number];
    zoom: number;

    reports: MapReport[];
    types: MapType[];
    zones: MapZone[];
    facilities: MapFacility[];

    stats: Stats;
};

const TYPE_ICON = {
    banjir: Waves,
    kebakaran: Flame,
    karhutla: Flame,
    longsor: Mountain,
    'pohon-tumbang': TreePine,
};

export default function PetaShow({
    auth,
    area,
    areas,
    boundary,
    center,
    zoom,
    reports,
    types,
    zones,
    facilities,
    stats,
}: Props) {
    const role = auth.user.role;

    const [activeTypeIds, setActiveTypeIds] = useState<number[]>(
        types.map((type) => type.id),
    );

    const [showZones, setShowZones] = useState(true);
    const [showFacilities, setShowFacilities] = useState(true);

    const visibleReports = reports.filter((report) =>
        activeTypeIds.includes(report.type_id),
    );

    const toggleType = (id: number) => {
        setActiveTypeIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const changeArea = (slug: string) => {
        if (!slug) {
            router.get('/peta');
            return;
        }

        router.get(`/peta/${slug}`);
    };

    return (
        <>
            <Head title={`Peta ${area.name}`} />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-[1800px] space-y-5 p-4 md:p-6">
                    {/* HEADER */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <Link
                                href="/peta"
                                className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-4" />
                                Kembali ke peta utama
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                                    <MapPin className="size-5" />
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold md:text-2xl">
                                        {area.name}
                                    </h1>

                                    <p className="text-sm text-muted-foreground">
                                        Peta kejadian dan kondisi kebencanaan
                                        {area.parent &&
                                            ` • ${area.parent}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <span className="w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium capitalize text-primary">
                            {role}
                        </span>
                    </div>

                    {/* AREA SELECTOR */}
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Pilih Wilayah
                                </h2>

                                <p className="text-xs text-muted-foreground">
                                    Berpindah ke wilayah lain.
                                </p>
                            </div>

                            <select
                                value={area.slug ?? ''}
                                onChange={(event) =>
                                    changeArea(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary md:w-80"
                            >
                                <option value="">
                                    Semua wilayah
                                </option>

                                {areas.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.slug}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-xs text-muted-foreground">
                                Kejadian Aktif
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {stats.active_reports}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-xs text-muted-foreground">
                                Sedang Ditangani
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {stats.handling_reports}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-xs text-muted-foreground">
                                Zona Rawan
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {zones.length}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-xs text-muted-foreground">
                                Fasilitas
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {stats.total_facilities}
                            </p>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                        {/* FILTER */}
                        <aside className="space-y-4">
                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <h2 className="font-semibold">
                                    Filter Bencana
                                </h2>

                                <div className="mt-3 space-y-2">
                                    {types.map((type) => {
                                        const Icon =
                                            TYPE_ICON[
                                                type.slug as keyof typeof TYPE_ICON
                                            ] ??
                                            AlertTriangle;

                                        const active =
                                            activeTypeIds.includes(
                                                type.id,
                                            );

                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() =>
                                                    toggleType(
                                                        type.id,
                                                    )
                                                }
                                                className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left ${
                                                    active
                                                        ? 'border-primary/30 bg-primary/5'
                                                        : 'opacity-50'
                                                }`}
                                            >
                                                <span
                                                    className="flex size-9 items-center justify-center rounded-lg text-white"
                                                    style={{
                                                        backgroundColor:
                                                            type.color,
                                                    }}
                                                >
                                                    <Icon className="size-4" />
                                                </span>

                                                <span className="flex-1 text-sm font-medium">
                                                    {type.name}
                                                </span>

                                                <span
                                                    className={`size-3 rounded-full ${
                                                        active
                                                            ? 'bg-primary'
                                                            : 'border'
                                                    }`}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <h2 className="font-semibold">
                                    Layer Peta
                                </h2>

                                <div className="mt-3 space-y-3 text-sm">
                                    <label className="flex items-center justify-between">
                                        <span>Zona rawan</span>

                                        <input
                                            type="checkbox"
                                            checked={showZones}
                                            onChange={(event) =>
                                                setShowZones(
                                                    event.target
                                                        .checked,
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="flex items-center justify-between">
                                        <span>Fasilitas</span>

                                        <input
                                            type="checkbox"
                                            checked={
                                                showFacilities
                                            }
                                            onChange={(event) =>
                                                setShowFacilities(
                                                    event.target
                                                        .checked,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            {role === 'warga' && (
                                <Link
                                    href="/laporan/create"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                >
                                    <Siren className="size-4" />
                                    Laporkan Kejadian
                                </Link>
                            )}
                        </aside>

                        {/* MAP */}
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="h-[650px]">
                                <DisasterMap
                                    center={center}
                                    zoom={zoom}
                                    boundary={boundary}
                                    boundaryName={
                                        area.name
                                    }
                                    reports={reports}
                                    types={types}
                                    zones={zones}
                                    facilities={
                                        facilities
                                    }
                                    activeTypeIds={
                                        activeTypeIds
                                    }
                                    showZones={
                                        showZones
                                    }
                                    showFacilities={
                                        showFacilities
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* REPORT LIST */}
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">
                                Kejadian di {area.name}
                            </h2>

                            <p className="text-xs text-muted-foreground">
                                {visibleReports.length} kejadian tampil.
                            </p>
                        </div>

                        {visibleReports.length === 0 ? (
                            <div className="p-8 text-center">
                                <MapPin className="mx-auto size-8 text-muted-foreground" />

                                <p className="mt-2 text-sm font-medium">
                                    Belum ada kejadian
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {visibleReports.map((report) => {
                                    const type = types.find(
                                        (item) =>
                                            item.id ===
                                            report.type_id,
                                    );

                                    return (
                                        <Link
                                            key={report.id}
                                            href={`/laporan/${report.id}`}
                                            className="flex items-center gap-3 p-4 hover:bg-muted/50"
                                        >
                                            <span
                                                className="flex size-10 items-center justify-center rounded-lg text-white"
                                                style={{
                                                    backgroundColor:
                                                        type?.color ??
                                                        '#64748b',
                                                }}
                                            >
                                                <AlertTriangle className="size-5" />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {
                                                        report.title
                                                    }
                                                </p>

                                                <p className="truncate text-xs text-muted-foreground">
                                                    {type?.name ??
                                                        'Bencana'}{' '}
                                                    •{' '}
                                                    {report.address ??
                                                        'Lokasi tidak tersedia'}
                                                </p>
                                            </div>

                                            <ChevronRight className="size-4 text-muted-foreground" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}