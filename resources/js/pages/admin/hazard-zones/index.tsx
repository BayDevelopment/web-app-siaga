import { Head, Link, router } from '@inertiajs/react';
import {
    Edit,
    Map as MapIcon,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type DisasterType = {
    id: number;
    name: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    type: string;
};

type Level = 'low' | 'medium' | 'high';

type HazardZone = {
    id: number;
    name: string;
    level: Level;
    description: string | null;
    geojson: {
        type: string;
        coordinates: unknown;
    };
    disaster_type: DisasterType | null;
    area: Area | null;
    created_at: string | null;
};

type Props = {
    zones: HazardZone[];
};

type LevelFilter = 'all' | Level;

const levelConfig: Record<
    Level,
    { label: string; badge: string; dot: string; stat: string; bar: string }
> = {
    low: {
        label: 'Rendah',
        badge: 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400',
        dot: 'bg-forest-500',
        stat: 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400',
        bar: 'bg-forest-500',
    },
    medium: {
        label: 'Sedang',
        badge: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-400',
        dot: 'bg-sun-500',
        stat: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-400',
        bar: 'bg-sun-500',
    },
    high: {
        label: 'Tinggi',
        badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        dot: 'bg-red-500',
        stat: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        bar: 'bg-red-500',
    },
};

const FILTERS: { key: LevelFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'high', label: 'Tinggi' },
    { key: 'medium', label: 'Sedang' },
    { key: 'low', label: 'Rendah' },
];

function StatCard({
    label,
    value,
    icon: Icon,
    toneClass,
    valueClass,
    delay,
}: {
    label: string;
    value: number;
    icon: typeof MapIcon;
    toneClass: string;
    valueClass?: string;
    delay: number;
}) {
    return (
        <div
            className="animate-fade-in-up group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={`mt-1 text-3xl font-bold tracking-tight ${valueClass ?? ''}`}
                    >
                        {value}
                    </p>
                </div>

                <span
                    className={`flex size-11 items-center justify-center rounded-xl transition group-hover:scale-110 ${toneClass}`}
                >
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

function LevelBadge({ level }: { level: Level }) {
    const config = levelConfig[level];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
        >
            <span className={`size-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}

export default function HazardZonesIndex({ zones }: Props) {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

    const counts = useMemo(
        () => ({
            total: zones.length,
            high: zones.filter((zone) => zone.level === 'high').length,
            medium: zones.filter((zone) => zone.level === 'medium').length,
            low: zones.filter((zone) => zone.level === 'low').length,
        }),
        [zones],
    );

    const filteredZones = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return zones.filter((zone) => {
            if (levelFilter !== 'all' && zone.level !== levelFilter) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return (
                zone.name.toLowerCase().includes(keyword) ||
                zone.disaster_type?.name.toLowerCase().includes(keyword) ||
                zone.area?.name.toLowerCase().includes(keyword) ||
                zone.level.toLowerCase().includes(keyword) ||
                levelConfig[zone.level].label.toLowerCase().includes(keyword)
            );
        });
    }, [zones, search, levelFilter]);

    const handleDelete = (zone: HazardZone) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus zona rawan "${zone.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/admin/hazard-zones/${zone.id}`, {
            preserveScroll: true,
        });
    };

    const isFiltering = search.trim() !== '' || levelFilter !== 'all';

    const ActionButtons = ({ zone }: { zone: HazardZone }) => (
        <div className="flex justify-end gap-2">
            <Link
                href={`/admin/hazard-zones/${zone.id}/edit`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-500/10"
            >
                <Edit className="size-3.5" />
                Edit
            </Link>

            <button
                type="button"
                onClick={() => handleDelete(zone)}
                aria-label={`Hapus ${zone.name}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
                <Trash2 className="size-3.5" />
                Hapus
            </button>
        </div>
    );

    const DisasterCell = ({ zone }: { zone: HazardZone }) =>
        zone.disaster_type ? (
            <div className="flex items-center gap-2">
                <span
                    className="size-3 shrink-0 rounded-full ring-2 ring-card"
                    style={{ backgroundColor: zone.disaster_type.color }}
                />
                <span>{zone.disaster_type.name}</span>
            </div>
        ) : (
            <span className="text-muted-foreground">—</span>
        );

    return (
        <>
            <Head title="Zona Rawan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ===== Hero ===== */}
                <div className="animate-fade-in relative overflow-hidden rounded-3xl bg-linear-to-br from-navy-900 via-navy-800 to-navy-600 p-6 text-white shadow-lg shadow-navy-900/20 md:p-8">
                    <div className="blob animate-blob -top-16 -right-10 size-64 bg-sea-400/40" />
                    <div className="blob animate-blob-slow -bottom-20 left-1/3 size-56 bg-sun-400/25" />
                    <div className="blob animate-blob top-1/2 right-1/4 size-40 bg-forest-400/20" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="animate-float flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                                <TriangleAlert className="size-7 text-sun-300" />
                            </span>

                            <div>
                                <h1 className="text-xl font-bold md:text-2xl">
                                    Zona Rawan
                                </h1>
                                <p className="mt-1 max-w-md text-sm text-white/70">
                                    Kelola wilayah yang memiliki potensi risiko
                                    bencana.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/admin/hazard-zones/create"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <Plus className="size-4" />
                            Tambah Zona
                        </Link>
                    </div>
                </div>

                {/* ===== Statistik ===== */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Zona"
                        value={counts.total}
                        icon={MapIcon}
                        toneClass="bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400"
                        delay={0}
                    />
                    <StatCard
                        label="Risiko Tinggi"
                        value={counts.high}
                        icon={TriangleAlert}
                        toneClass={levelConfig.high.stat}
                        valueClass="text-red-600 dark:text-red-400"
                        delay={70}
                    />
                    <StatCard
                        label="Risiko Sedang"
                        value={counts.medium}
                        icon={TriangleAlert}
                        toneClass={levelConfig.medium.stat}
                        valueClass="text-sun-600 dark:text-sun-400"
                        delay={140}
                    />
                    <StatCard
                        label="Risiko Rendah"
                        value={counts.low}
                        icon={TriangleAlert}
                        toneClass={levelConfig.low.stat}
                        valueClass="text-forest-600 dark:text-forest-400"
                        delay={210}
                    />
                </div>

                {/* ===== Daftar ===== */}
                <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:260ms]">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                            <div>
                                <h2 className="text-sm font-bold">
                                    Daftar Zona Rawan
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Menampilkan {filteredZones.length} dari{' '}
                                    {zones.length} zona
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari zona, bencana, wilayah..."
                                    className="h-10 w-full rounded-xl border border-input bg-background pr-9 pl-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-navy-400 focus:ring-4 focus:ring-ring/20 sm:w-72"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        aria-label="Hapus pencarian"
                                        className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex rounded-xl bg-muted p-1">
                                {FILTERS.map((filter) => (
                                    <button
                                        key={filter.key}
                                        type="button"
                                        onClick={() =>
                                            setLevelFilter(filter.key)
                                        }
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            levelFilter === filter.key
                                                ? 'bg-card text-navy-600 shadow-sm dark:text-navy-400'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filteredZones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="animate-float flex size-16 items-center justify-center rounded-full bg-sun-100 text-sun-600 dark:bg-sun-500/15">
                                <TriangleAlert className="size-8" />
                            </div>

                            <h3 className="mt-4 text-sm font-semibold">
                                {isFiltering
                                    ? 'Zona tidak ditemukan'
                                    : 'Belum ada zona rawan'}
                            </h3>

                            <p className="mt-1 max-w-md text-xs text-muted-foreground">
                                {isFiltering
                                    ? 'Coba ubah kata kunci atau filter tingkat risiko.'
                                    : 'Tambahkan zona rawan untuk menampilkannya pada peta kejadian.'}
                            </p>

                            {!isFiltering && (
                                <Link
                                    href="/admin/hazard-zones/create"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
                                >
                                    <Plus className="size-4" />
                                    Tambah Zona
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile: kartu */}
                            <ul className="divide-y divide-border lg:hidden">
                                {filteredZones.map((zone) => (
                                    <li key={zone.id} className="space-y-3 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold">
                                                    {zone.name}
                                                </p>
                                                {zone.description && (
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                        {zone.description}
                                                    </p>
                                                )}
                                            </div>
                                            <LevelBadge level={zone.level} />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                            <DisasterCell zone={zone} />
                                            <span>
                                                {zone.area
                                                    ? `${zone.area.name} (${zone.area.type.toUpperCase()})`
                                                    : 'Global'}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <MapIcon className="size-3.5" />
                                                {zone.geojson.type}
                                            </span>
                                        </div>

                                        <ActionButtons zone={zone} />
                                    </li>
                                ))}
                            </ul>

                            {/* Desktop: tabel */}
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-xs tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Zona
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Jenis Bencana
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Wilayah
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Tingkat Risiko
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Bentuk
                                            </th>
                                            <th className="px-6 py-3.5 text-right font-semibold">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border">
                                        {filteredZones.map((zone) => (
                                            <tr
                                                key={zone.id}
                                                className="relative transition-colors hover:bg-navy-50 dark:hover:bg-navy-500/10"
                                            >
                                                <td className="relative px-6 py-4">
                                                    <span
                                                        aria-hidden
                                                        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${levelConfig[zone.level].bar}`}
                                                    />
                                                    <p className="font-semibold">
                                                        {zone.name}
                                                    </p>
                                                    {zone.description && (
                                                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                                            {zone.description}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <DisasterCell zone={zone} />
                                                </td>

                                                <td className="px-6 py-4">
                                                    {zone.area ? (
                                                        <div>
                                                            <p className="font-medium">
                                                                {zone.area.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground uppercase">
                                                                {zone.area.type}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                            Global
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <LevelBadge
                                                        level={zone.level}
                                                    />
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
                                                        <MapIcon className="size-3.5" />
                                                        {zone.geojson.type}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <ActionButtons zone={zone} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}