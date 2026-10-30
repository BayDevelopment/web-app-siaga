import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Building2,
    ChevronDown,
    ChevronRight,
    Edit3,
    FolderTree,
    Map as MapIcon,
    MapPin,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

/* ---------- Tipe ---------- */

type AreaType = 'kelurahan' | 'rw' | 'rt';
type TypeFilter = 'all' | AreaType;
type StatusFilter = 'all' | 'active' | 'inactive';

type Area = {
    id: number;
    name: string;
    type: AreaType;
    slug: string | null;
    parent_id: number | null;
    parent: string | null;
    is_active: boolean;
    has_boundary: boolean;
    reports_count: number;
    children_count: number;
};

type Props = {
    areas: Area[];
};

/* ---------- Konstanta ---------- */

const FOCUS_RING =
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

const TYPE_CONFIG: Record<
    AreaType,
    {
        label: string;
        icon: LucideIcon;
        badge: string;
        iconBox: string;
    }
> = {
    kelurahan: {
        label: 'Kelurahan',
        icon: Building2,
        badge: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
        iconBox:
            'bg-linear-to-br from-navy-500 to-navy-600 text-white shadow-navy-500/30',
    },
    rw: {
        label: 'RW',
        icon: Users,
        badge: 'bg-sea-300/30 text-navy-600 dark:bg-sea-400/15 dark:text-sea-300',
        iconBox:
            'bg-linear-to-br from-sea-400 to-sea-500 text-white shadow-sea-500/30',
    },
    rt: {
        label: 'RT',
        icon: MapPin,
        badge: 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400',
        iconBox:
            'bg-linear-to-br from-forest-400 to-forest-600 text-white shadow-forest-500/30',
    },
};

const DEPTH: Record<AreaType, number> = {
    kelurahan: 0,
    rw: 1,
    rt: 2,
};

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'kelurahan', label: 'Kelurahan' },
    { key: 'rw', label: 'RW' },
    { key: 'rt', label: 'RT' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua status' },
    { key: 'active', label: 'Aktif' },
    { key: 'inactive', label: 'Nonaktif' },
];

function getChildType(type: AreaType): AreaType | null {
    if (type === 'kelurahan') {
        return 'rw';
    }

    if (type === 'rw') {
        return 'rt';
    }

    return null;
}

/* ---------- Komponen kecil (di luar halaman agar tidak di-remount) ---------- */

function StatCard({
    label,
    value,
    description,
    icon: Icon,
    toneClass,
    valueClass,
    delay,
}: {
    label: string;
    value: number;
    description: string;
    icon: LucideIcon;
    toneClass: string;
    valueClass?: string;
    delay: number;
}) {
    return (
        <div
            className="group h-full animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 dark:hover:border-navy-500/40"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={`mt-1 text-3xl font-bold tracking-tight ${valueClass ?? 'text-foreground'}`}
                    >
                        {value}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${toneClass}`}
                >
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

function TypeBadge({ type }: { type: AreaType }) {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
        >
            <Icon className="size-3.5" />
            {config.label}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                active
                    ? 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400'
                    : 'bg-muted text-muted-foreground'
            }`}
        >
            <span
                className={`size-1.5 rounded-full ${
                    active ? 'bg-forest-500' : 'bg-muted-foreground/50'
                }`}
            />
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function Segmented<T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: { key: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={label}
            className="flex overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
        >
            {options.map((option) => {
                const active = value === option.key;

                return (
                    <button
                        key={option.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${FOCUS_RING} ${
                            active
                                ? 'bg-card text-navy-600 shadow-sm dark:text-navy-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function AreaNode({
    area,
    childrenMap,
    expanded,
    onToggle,
    onDelete,
}: {
    area: Area;
    childrenMap: Map<number, Area[]>;
    expanded: Set<number>;
    onToggle: (id: number) => void;
    onDelete: (area: Area) => void;
}) {
    const children = childrenMap.get(area.id) ?? [];
    const hasChildren = children.length > 0;
    const childType = getChildType(area.type);
    const depth = DEPTH[area.type];
    const config = TYPE_CONFIG[area.type];
    const Icon = config.icon;

    const childLabel =
        childType === 'rw'
            ? 'Tambah RW'
            : childType === 'rt'
              ? 'Tambah RT'
              : null;

    const childHref = childType
        ? `/admin/areas/create?type=${childType}&parent_id=${area.id}`
        : null;

    return (
        <div>
            <div
                className={`group relative border-b border-border transition-colors last:border-b-0 hover:bg-navy-50/60 dark:hover:bg-navy-500/10 ${
                    depth === 0 ? 'bg-card' : 'bg-muted/20'
                }`}
            >
                {/* garis hierarki */}
                {depth > 0 && (
                    <span
                        aria-hidden
                        className="absolute inset-y-0 w-px bg-border"
                        style={{ left: `${depth * 1.5 + 1.25}rem` }}
                    />
                )}

                <div
                    className="flex flex-col gap-3 py-4 pr-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
                >
                    <div className="flex min-w-0 items-start gap-3">
                        <button
                            type="button"
                            disabled={!hasChildren}
                            onClick={() => onToggle(area.id)}
                            aria-label={
                                expanded.has(area.id)
                                    ? 'Tutup wilayah'
                                    : 'Buka wilayah'
                            }
                            aria-expanded={expanded.has(area.id)}
                            className={`relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition ${FOCUS_RING} ${
                                hasChildren
                                    ? 'hover:bg-navy-100 dark:hover:bg-navy-500/20'
                                    : 'pointer-events-none opacity-0'
                            }`}
                        >
                            {expanded.has(area.id) ? (
                                <ChevronDown className="size-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="size-4 text-muted-foreground" />
                            )}
                        </button>

                        <div className="flex min-w-0 items-start gap-3">
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-md ${config.iconBox}`}
                            >
                                <Icon className="size-4" />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate font-semibold text-foreground">
                                        {area.name}
                                    </h3>

                                    <TypeBadge type={area.type} />

                                    <StatusBadge active={area.is_active} />
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    {area.parent && (
                                        <span>Induk: {area.parent}</span>
                                    )}

                                    {area.type !== 'rt' && (
                                        <span>
                                            {area.children_count}{' '}
                                            {area.type === 'kelurahan'
                                                ? 'RW'
                                                : 'RT'}
                                        </span>
                                    )}

                                    <span>{area.reports_count} laporan</span>

                                    <span
                                        className={
                                            area.has_boundary
                                                ? 'font-medium text-forest-600 dark:text-forest-400'
                                                : 'text-sun-600 dark:text-sun-400'
                                        }
                                    >
                                        {area.has_boundary
                                            ? 'Batas tersedia'
                                            : 'Belum ada batas'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
                        {childHref && (
                            <Link
                                href={childHref}
                                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-400 ${FOCUS_RING}`}
                            >
                                <Plus className="size-3.5" />
                                {childLabel}
                            </Link>
                        )}

                        {area.slug && (
                            <Link
                                href={`/peta/${area.slug}`}
                                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-sea-300 hover:bg-sea-300/20 hover:text-navy-600 dark:hover:text-sea-300 ${FOCUS_RING}`}
                            >
                                <MapIcon className="size-3.5" />
                                <span className="hidden md:inline">Peta</span>
                            </Link>
                        )}

                        <Link
                            href={`/admin/areas/${area.id}/edit`}
                            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-400 ${FOCUS_RING}`}
                        >
                            <Edit3 className="size-3.5" />
                            <span className="hidden md:inline">Edit</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => onDelete(area)}
                            className={`inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300 ${FOCUS_RING}`}
                            title="Hapus"
                            aria-label={`Hapus ${area.name}`}
                        >
                            <Trash2 className="size-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {hasChildren && expanded.has(area.id) && (
                <div>
                    {children.map((child) => (
                        <AreaNode
                            key={child.id}
                            area={child}
                            childrenMap={childrenMap}
                            expanded={expanded}
                            onToggle={onToggle}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function AreasIndex({ areas }: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const areaById = useMemo(
        () =>
            new globalThis.Map<number, Area>(
                areas.map((area) => [area.id, area] as [number, Area]),
            ),
        [areas],
    );

    const childrenMap = useMemo(() => {
        const map = new globalThis.Map<number, Area[]>();

        for (const area of areas) {
            if (area.parent_id === null) {
                continue;
            }

            const current = map.get(area.parent_id) ?? [];

            current.push(area);

            map.set(area.parent_id, current);
        }

        return map;
    }, [areas]);

    const matchesFilter = (area: Area) => {
        const keyword = search.trim().toLowerCase();

        const matchesSearch =
            !keyword ||
            area.name.toLowerCase().includes(keyword) ||
            area.parent?.toLowerCase().includes(keyword);

        const matchesType = typeFilter === 'all' || area.type === typeFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' ? area.is_active : !area.is_active);

        return matchesSearch && matchesType && matchesStatus;
    };

    const visibleIds = useMemo(() => {
        const ids = new globalThis.Set<number>();

        for (const area of areas) {
            if (!matchesFilter(area)) {
                continue;
            }

            let current: Area | undefined = area;

            while (current) {
                ids.add(current.id);

                if (current.parent_id === null) {
                    break;
                }

                current = areaById.get(current.parent_id);
            }
        }

        return ids;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areas, areaById, search, typeFilter, statusFilter]);

    const visibleChildrenMap = useMemo(() => {
        const map = new globalThis.Map<number, Area[]>();

        for (const area of areas) {
            if (area.parent_id !== null && visibleIds.has(area.id)) {
                const current = map.get(area.parent_id) ?? [];

                current.push(area);

                map.set(area.parent_id, current);
            }
        }

        return map;
    }, [areas, visibleIds]);

    const rootAreas = useMemo(
        () =>
            areas.filter(
                (area) => area.parent_id === null && visibleIds.has(area.id),
            ),
        [areas, visibleIds],
    );

    const [expanded, setExpanded] = useState<Set<number>>(() => {
        const initial = new globalThis.Set<number>();

        for (const area of areas) {
            if ((childrenMap.get(area.id) ?? []).length > 0) {
                initial.add(area.id);
            }
        }

        return initial;
    });

    const stats = {
        total: areas.length,
        kelurahan: areas.filter((area) => area.type === 'kelurahan').length,
        rw: areas.filter((area) => area.type === 'rw').length,
        rt: areas.filter((area) => area.type === 'rt').length,
        active: areas.filter((area) => area.is_active).length,
        boundaries: areas.filter((area) => area.has_boundary).length,
    };

    const boundaryPercent =
        stats.total > 0
            ? Math.round((stats.boundaries / stats.total) * 100)
            : 0;

    const toggle = (id: number) => {
        setExpanded((current) => {
            const next = new globalThis.Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const expandAll = () => {
        const ids = new globalThis.Set<number>();

        for (const area of areas) {
            if ((childrenMap.get(area.id) ?? []).length > 0) {
                ids.add(area.id);
            }
        }

        setExpanded(ids);
    };

    const collapseAll = () => {
        setExpanded(new globalThis.Set<number>());
    };

    const resetFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setStatusFilter('all');
    };

    const handleDelete = (area: Area) => {
        const confirmed = window.confirm(
            `Hapus wilayah "${area.name}"?\n\nWilayah yang memiliki data turunan atau laporan terkait tidak dapat dihapus.`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/admin/areas/${area.id}`, {
            preserveScroll: true,

            onSuccess: () => {
                toast.success(`Wilayah "${area.name}" berhasil dihapus.`);
            },

            onError: (errors) => {
                const message =
                    typeof errors.delete === 'string'
                        ? errors.delete
                        : 'Wilayah tidak dapat dihapus.';

                toast.error(message);
            },
        });
    };

    const hasFilter =
        search.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

    return (
        <>
            <Head title="Manajemen Wilayah" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 -left-24 size-72 rounded-full bg-navy-400/5 blur-3xl dark:bg-navy-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-sea-400/5 blur-3xl dark:bg-sea-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-forest-400/5 blur-3xl dark:bg-forest-500/10"
                />

                <div className="relative mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-8">
                    {/* =====================================================
                        HERO
                    ====================================================== */}
                    <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
                        <div className="blob -top-16 -right-10 size-64 animate-blob bg-sea-400/20 dark:bg-sea-500/10" />
                        <div className="blob -bottom-20 left-1/3 size-56 animate-blob-slow bg-sun-400/15 dark:bg-sun-500/10" />
                        <div className="blob top-1/2 right-1/4 size-40 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />

                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="flex size-14 shrink-0 animate-float items-center justify-center rounded-2xl bg-navy-100 text-navy-600 ring-1 ring-navy-200 dark:bg-navy-500/15 dark:text-navy-400 dark:ring-navy-500/30">
                                    <FolderTree className="size-7" />
                                </span>

                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-navy-600 uppercase dark:text-navy-400">
                                        Master Wilayah
                                    </p>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                        Manajemen Wilayah
                                    </h1>
                                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                        Kelola Kelurahan, RW, dan RT dalam satu
                                        struktur wilayah.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/admin/areas/create?type=kelurahan"
                                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md dark:bg-sun-400 dark:hover:bg-sun-300 ${FOCUS_RING}`}
                                >
                                    <Plus className="size-4" />
                                    Tambah Kelurahan
                                </Link>

                                <Link
                                    href="/admin/areas/create?type=rw"
                                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-400 ${FOCUS_RING}`}
                                >
                                    <Plus className="size-4" />
                                    Tambah RW
                                </Link>

                                <Link
                                    href="/admin/areas/create?type=rt"
                                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-400 ${FOCUS_RING}`}
                                >
                                    <Plus className="size-4" />
                                    Tambah RT
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        STATISTIK
                    ====================================================== */}
                    <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Kelurahan"
                            value={stats.kelurahan}
                            description="Wilayah tingkat atas"
                            icon={Building2}
                            toneClass="bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400"
                            delay={0}
                        />
                        <StatCard
                            label="RW"
                            value={stats.rw}
                            description="Rukun Warga"
                            icon={Users}
                            toneClass="bg-sea-300/30 text-sea-500 dark:bg-sea-500/15 dark:text-sea-300"
                            valueClass="text-sea-500 dark:text-sea-300"
                            delay={70}
                        />
                        <StatCard
                            label="RT"
                            value={stats.rt}
                            description="Rukun Tetangga"
                            icon={MapPin}
                            toneClass="bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400"
                            valueClass="text-forest-600 dark:text-forest-400"
                            delay={140}
                        />
                        <StatCard
                            label="Batas Wilayah"
                            value={stats.boundaries}
                            description={`${boundaryPercent}% dari ${stats.total} wilayah`}
                            icon={MapIcon}
                            toneClass="bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300"
                            valueClass="text-sun-600 dark:text-sun-400"
                            delay={210}
                        />
                    </section>

                    {/* =====================================================
                        STRUKTUR WILAYAH
                    ====================================================== */}
                    <section className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:260ms]">
                        {/* Toolbar */}
                        <div className="space-y-4 border-b border-border p-4 md:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                    <div>
                                        <h2 className="font-semibold text-foreground">
                                            Struktur Wilayah
                                        </h2>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Kelurahan → RW → RT
                                        </p>
                                    </div>
                                </div>

                                <span className="rounded-full bg-forest-100 px-3 py-1.5 text-xs font-semibold text-forest-800 dark:bg-forest-500/15 dark:text-forest-400">
                                    {stats.active} dari {stats.total} aktif
                                </span>
                            </div>

                            <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Cari wilayah atau wilayah induk..."
                                        aria-label="Cari wilayah"
                                        className="h-10 w-full rounded-xl border border-border bg-background pr-9 pl-9 text-sm text-foreground transition outline-none placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 dark:focus:ring-navy-400/30"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            aria-label="Hapus pencarian"
                                            className={`absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground ${FOCUS_RING}`}
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <Segmented
                                    label="Filter jenis wilayah"
                                    options={TYPE_FILTERS}
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                />

                                <Segmented
                                    label="Filter status wilayah"
                                    options={STATUS_FILTERS}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                />

                                {hasFilter && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition hover:bg-muted ${FOCUS_RING}`}
                                    >
                                        <RefreshCcw className="size-3.5" />
                                        Reset
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">
                                    {visibleIds.size} wilayah terkait dengan
                                    hasil pencarian
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={expandAll}
                                        className={`rounded text-xs font-semibold text-navy-600 hover:underline dark:text-navy-400 ${FOCUS_RING}`}
                                    >
                                        Buka semua
                                    </button>

                                    <span className="text-muted-foreground">
                                        /
                                    </span>

                                    <button
                                        type="button"
                                        onClick={collapseAll}
                                        className={`rounded text-xs font-semibold text-navy-600 hover:underline dark:text-navy-400 ${FOCUS_RING}`}
                                    >
                                        Tutup semua
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Konten */}
                        {rootAreas.length > 0 ? (
                            <div>
                                {rootAreas.map((area) => (
                                    <AreaNode
                                        key={area.id}
                                        area={area}
                                        childrenMap={visibleChildrenMap}
                                        expanded={expanded}
                                        onToggle={toggle}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex animate-fade-in flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="flex size-16 animate-float items-center justify-center rounded-2xl bg-sun-100 text-sun-600 ring-1 ring-sun-300/50 dark:bg-sun-500/15 dark:text-sun-300 dark:ring-sun-500/20">
                                    <FolderTree className="size-8" />
                                </div>

                                <h3 className="mt-4 text-sm font-semibold text-foreground">
                                    {hasFilter
                                        ? 'Wilayah tidak ditemukan'
                                        : 'Belum ada wilayah'}
                                </h3>

                                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                                    {areas.length === 0
                                        ? 'Mulai dengan menambahkan Kelurahan pertama.'
                                        : 'Coba ubah kata kunci atau filter yang digunakan.'}
                                </p>

                                {hasFilter ? (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className={`mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted ${FOCUS_RING}`}
                                    >
                                        <RefreshCcw className="size-4" />
                                        Reset filter
                                    </button>
                                ) : (
                                    <Link
                                        href="/admin/areas/create?type=kelurahan"
                                        className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${FOCUS_RING}`}
                                    >
                                        <Plus className="size-4" />
                                        Tambah Kelurahan
                                    </Link>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}