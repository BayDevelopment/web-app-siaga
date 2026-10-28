import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    Flame,
    MapPin,
    Mountain,
    ShieldAlert,
    Siren,
    TreePine,
    Waves,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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

type Contact = {
    id: number;
    name: string;
    role: string | null;
    phone: string;
};

type Announcement = {
    id: number;
    title: string;
    body: string;
    level: string;
    published_at: string | null;
};

type Props = {
    auth: {
        user: User;
    };

    area: Area | null;

    areas: AreaOption[];

    boundary: MapBoundary | null;

    center: [number, number];
    zoom: number;

    reports: MapReport[];
    types: MapType[];
    zones: MapZone[];
    facilities: MapFacility[];

    contacts: Contact[];
    announcements: Announcement[];

    stats: Stats;
};

const SEVERITY_LABEL: Record<string, string> = {
    low: 'Ringan',
    medium: 'Sedang',
    high: 'Berat',
    critical: 'Kritis',
};

const SEVERITY_CLASS: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700',
    medium: 'bg-yellow-50 text-yellow-700',
    high: 'bg-orange-50 text-orange-700',
    critical: 'bg-red-50 text-red-700',
};

const TYPE_ICON = {
    banjir: Waves,
    kebakaran: Flame,
    karhutla: Flame,
    longsor: Mountain,
    'pohon-tumbang': TreePine,
};

function StatCard({
    title,
    value,
    description,
    icon: Icon,
}: {
    title: string;
    value: number | string;
    description: string;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {title}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

export default function PetaIndex({
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
    contacts,
    announcements,
    stats,
}: Props) {
    const role = auth.user.role;

    const [activeTypeIds, setActiveTypeIds] = useState<number[]>(
        types.map((type) => type.id),
    );

    const [showZones, setShowZones] = useState(true);
    const [showFacilities, setShowFacilities] = useState(true);

    const selectedArea = area?.slug ?? '';

    const visibleReports = useMemo(
        () =>
            reports.filter((report) =>
                activeTypeIds.includes(report.type_id),
            ),
        [reports, activeTypeIds],
    );

    const recentReports = useMemo(
        () =>
            [...visibleReports]
                .sort((a, b) => {
                    const aTime = a.occurred_at
                        ? new Date(a.occurred_at).getTime()
                        : 0;

                    const bTime = b.occurred_at
                        ? new Date(b.occurred_at).getTime()
                        : 0;

                    return bTime - aTime;
                })
                .slice(0, 5),
        [visibleReports],
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
            <Head title="Peta Kejadian" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-[1800px] space-y-5 p-4 md:p-6">
                    {/* HEADER */}
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                                    <MapPin className="size-5" />
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold md:text-2xl">
                                        {role === 'admin'
                                            ? 'Monitoring Peta Wilayah'
                                            : role === 'petugas'
                                              ? 'Monitoring Kejadian'
                                              : 'Peta Kejadian Sekitar'}
                                    </h1>

                                    <p className="text-sm text-muted-foreground">
                                        {role === 'admin'
                                            ? 'Pantau kejadian, wilayah, fasilitas, dan kondisi kebencanaan.'
                                            : role === 'petugas'
                                              ? 'Pantau kejadian aktif dan laporan yang membutuhkan penanganan.'
                                              : 'Lihat informasi kejadian dan kondisi kebencanaan di sekitar Anda.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium capitalize text-primary">
                                {role}
                            </span>

                            {area && (
                                <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium">
                                    {area.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ADMIN */}
                    {role === 'admin' && (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title="Total Laporan"
                                value={stats.total_reports}
                                description="Laporan aktif"
                                icon={BarChart3}
                            />

                            <StatCard
                                title="Terverifikasi"
                                value={stats.verified_reports}
                                description="Sudah diverifikasi"
                                icon={CheckCircle2}
                            />

                            <StatCard
                                title="Sedang Ditangani"
                                value={stats.handling_reports}
                                description="Dalam penanganan"
                                icon={Siren}
                            />

                            <StatCard
                                title="Wilayah"
                                value={stats.total_areas}
                                description="Wilayah aktif"
                                icon={Building2}
                            />
                        </div>
                    )}

                    {/* PETUGAS */}
                    {role === 'petugas' && (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title="Kejadian Aktif"
                                value={stats.active_reports}
                                description="Kejadian aktif"
                                icon={AlertTriangle}
                            />

                            <StatCard
                                title="Sedang Ditangani"
                                value={stats.handling_reports}
                                description="Dalam penanganan"
                                icon={Siren}
                            />

                            <StatCard
                                title="Prioritas Tinggi"
                                value={stats.high_reports}
                                description="Severity berat"
                                icon={ShieldAlert}
                            />

                            <StatCard
                                title="Kritis"
                                value={stats.critical_reports}
                                description="Prioritas utama"
                                icon={CircleAlert}
                            />
                        </div>
                    )}

                    {/* WARGA */}
                    {role === 'warga' && (
                        <div className="grid gap-3 sm:grid-cols-3">
                            <StatCard
                                title="Kejadian Aktif"
                                value={stats.active_reports}
                                description="Informasi terkini"
                                icon={AlertTriangle}
                            />

                            <StatCard
                                title="Zona Rawan"
                                value={zones.length}
                                description="Zona pada peta"
                                icon={ShieldAlert}
                            />

                            <StatCard
                                title="Fasilitas"
                                value={stats.total_facilities}
                                description="Fasilitas darurat"
                                icon={Building2}
                            />
                        </div>
                    )}

                    {/* MAIN */}
                    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                        {/* SIDEBAR */}
                        <aside className="space-y-4">
                            {/* WILAYAH */}
                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <h2 className="font-semibold">
                                    Wilayah
                                </h2>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pilih wilayah untuk melihat detail peta.
                                </p>

                                <select
                                    value={selectedArea}
                                    onChange={(event) =>
                                        changeArea(
                                            event.target.value,
                                        )
                                    }
                                    className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
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

                            {/* JENIS BENCANA */}
                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold">
                                            Jenis Bencana
                                        </h2>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Filter kejadian.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="text-xs font-medium text-primary hover:underline"
                                        onClick={() =>
                                            setActiveTypeIds(
                                                activeTypeIds.length ===
                                                    types.length
                                                    ? []
                                                    : types.map(
                                                          (type) =>
                                                              type.id,
                                                      ),
                                            )
                                        }
                                    >
                                        {activeTypeIds.length ===
                                        types.length
                                            ? 'Kosongkan'
                                            : 'Pilih semua'}
                                    </button>
                                </div>

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
                                                className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                                                    active
                                                        ? 'border-primary/30 bg-primary/5'
                                                        : 'opacity-50'
                                                }`}
                                            >
                                                <span
                                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
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

                            {/* LAYER */}
                            <div className="rounded-xl border bg-card p-4 shadow-sm">
                                <h2 className="font-semibold">
                                    Tampilan Peta
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
                                        <span>
                                            Fasilitas darurat
                                        </span>

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

                            {/* ADMIN ACTION */}
                            {role === 'admin' && (
                                <>
                                    <Link
                                        href="/admin/areas"
                                        className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm hover:bg-muted"
                                    >
                                        Kelola Wilayah
                                        <ChevronRight className="size-4" />
                                    </Link>

                                    <Link
                                        href="/laporan"
                                        className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm hover:bg-muted"
                                    >
                                        Kelola Laporan
                                        <ChevronRight className="size-4" />
                                    </Link>
                                </>
                            )}

                            {/* WARGA ACTION */}
                            {role === 'warga' && (
                                <Link
                                    href="/laporan/create"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                                >
                                    <Siren className="size-4" />
                                    Laporkan Kejadian
                                </Link>
                            )}

                            {/* CONTACT */}
                            {contacts.length > 0 && (
                                <div className="rounded-xl border bg-card p-4 shadow-sm">
                                    <h2 className="font-semibold">
                                        Kontak Darurat
                                    </h2>

                                    <div className="mt-3 space-y-2">
                                        {contacts
                                            .slice(0, 4)
                                            .map((contact) => (
                                                <a
                                                    key={
                                                        contact.id
                                                    }
                                                    href={`tel:${contact.phone}`}
                                                    className="block rounded-lg border p-2.5 hover:bg-muted"
                                                >
                                                    <p className="text-sm font-medium">
                                                        {
                                                            contact.name
                                                        }
                                                    </p>

                                                    {contact.role && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                contact.role
                                                            }
                                                        </p>
                                                    )}

                                                    <p className="mt-1 text-sm font-semibold text-primary">
                                                        {
                                                            contact.phone
                                                        }
                                                    </p>
                                                </a>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                        {/* MAP */}
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="h-[620px]">
                                <DisasterMap
                                    center={center}
                                    zoom={zoom}
                                    boundary={boundary}
                                    boundaryName={
                                        area?.name ??
                                        'Wilayah SIAGA-W'
                                    }
                                    reports={reports}
                                    types={types}
                                    zones={zones}
                                    facilities={facilities}
                                    activeTypeIds={
                                        activeTypeIds
                                    }
                                    showZones={showZones}
                                    showFacilities={
                                        showFacilities
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* RECENT REPORT */}
                    {recentReports.length > 0 && (
                        <div className="rounded-xl border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b p-4">
                                <div>
                                    <h2 className="font-semibold">
                                        {role === 'petugas'
                                            ? 'Kejadian yang Perlu Diperhatikan'
                                            : 'Laporan Terbaru'}
                                    </h2>

                                    <p className="text-xs text-muted-foreground">
                                        Informasi kejadian yang tampil pada
                                        peta.
                                    </p>
                                </div>

                                <Link
                                    href="/laporan"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Lihat semua
                                </Link>
                            </div>

                            <div className="divide-y">
                                {recentReports.map((report) => {
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
                                                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
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

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    SEVERITY_CLASS[
                                                        report
                                                            .severity
                                                    ] ??
                                                    'bg-muted'
                                                }`}
                                            >
                                                {SEVERITY_LABEL[
                                                    report.severity
                                                ] ??
                                                    report.severity}
                                            </span>

                                            <ChevronRight className="size-4 text-muted-foreground" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ANNOUNCEMENTS */}
                    {announcements.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-3">
                            {announcements.map(
                                (announcement) => (
                                    <div
                                        key={announcement.id}
                                        className="rounded-xl border bg-card p-4 shadow-sm"
                                    >
                                        <p className="text-xs font-semibold uppercase text-primary">
                                            {announcement.level}
                                        </p>

                                        <h3 className="mt-1 font-semibold">
                                            {
                                                announcement.title
                                            }
                                        </h3>

                                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                                            {
                                                announcement.body
                                            }
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}