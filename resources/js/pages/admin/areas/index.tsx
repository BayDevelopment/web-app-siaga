import { Head, Link, router } from '@inertiajs/react';
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
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type AreaType = 'kelurahan' | 'rw' | 'rt';

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

const TYPE_CONFIG: Record<
    AreaType,
    {
        label: string;
        icon: typeof Building2;
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

function TypeBadge({ type }: { type: AreaType }) {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;

    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                config.badge,
            ].join(' ')}
        >
            <Icon className="size-3.5" />
            {config.label}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                active
                    ? 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400'
                    : 'bg-muted text-muted-foreground',
            ].join(' ')}
        >
            <span
                className={[
                    'size-1.5 rounded-full',
                    active ? 'bg-forest-500' : 'bg-muted-foreground/50',
                ].join(' ')}
            />
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function StatCard({
    label,
    value,
    description,
    icon: Icon,
    tone,
    delay,
}: {
    label: string;
    value: number;
    description: string;
    icon: typeof Building2;
    tone: 'navy' | 'sea' | 'forest' | 'sun';
    delay: number;
}) {
    const tones = {
        navy: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
        sea: 'bg-sea-300/30 text-navy-600 dark:bg-sea-400/15 dark:text-sea-300',
        forest: 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400',
        sun: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-400',
    };

    return (
        <div
            className="animate-fade-in-up group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex size-11 items-center justify-center rounded-xl transition group-hover:scale-110 ${tones[tone]}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function getChildType(type: AreaType): AreaType | null {
    if (type === 'kelurahan') {
        return 'rw';
    }

    if (type === 'rw') {
        return 'rt';
    }

    return null;
}

const DEPTH: Record<AreaType, number> = {
    kelurahan: 0,
    rw: 1,
    rt: 2,
};

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
                className={[
                    'group relative border-b border-border transition-colors last:border-b-0 hover:bg-navy-50 dark:hover:bg-navy-500/10',
                    depth === 0 ? 'bg-card' : 'bg-muted/20',
                ].join(' ')}
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
                            className={[
                                'relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition',
                                hasChildren
                                    ? 'hover:bg-navy-100 dark:hover:bg-navy-500/20'
                                    : 'pointer-events-none opacity-0',
                            ].join(' ')}
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
                                    <h3 className="truncate font-semibold">
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
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-500/10"
                            >
                                <Plus className="size-3.5" />
                                {childLabel}
                            </Link>
                        )}

                        {area.slug && (
                            <Link
                                href={`/peta/${area.slug}`}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-sea-300 hover:bg-sea-300/20 hover:text-navy-600"
                            >
                                <MapIcon className="size-3.5" />
                                <span className="hidden md:inline">Peta</span>
                            </Link>
                        )}

                        <Link
                            href={`/admin/areas/${area.id}/edit`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-500/10"
                        >
                            <Edit3 className="size-3.5" />
                            <span className="hidden md:inline">Edit</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => onDelete(area)}
                            className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
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

export default function AreasIndex({ areas }: Props) {
    const [search, setSearch] = useState('');

    const [typeFilter, setTypeFilter] = useState<'all' | AreaType>('all');

    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >('all');

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
        stats.total > 0 ? Math.round((stats.boundaries / stats.total) * 100) : 0;

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

    const selectClass =
        'h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-navy-400 focus:ring-4 focus:ring-ring/20';

    return (
        <>
            <Head title="Manajemen Wilayah" />

            <div className="min-h-full">
                <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
                    {/* HERO */}
                    <section className="animate-fade-in relative overflow-hidden rounded-3xl bg-linear-to-br from-navy-900 via-navy-800 to-navy-600 p-6 text-white shadow-lg shadow-navy-900/20 md:p-8">
                        <div className="blob animate-blob -top-16 -right-10 size-64 bg-sea-400/40" />
                        <div className="blob animate-blob-slow -bottom-20 left-1/3 size-56 bg-sun-400/25" />
                        <div className="blob animate-blob top-1/2 right-1/4 size-40 bg-forest-400/20" />

                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="animate-float flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                                    <FolderTree className="size-7 text-sun-300" />
                                </span>

                                <div>
                                    <h1 className="text-xl font-bold md:text-2xl">
                                        Manajemen Wilayah
                                    </h1>

                                    <p className="mt-1 max-w-lg text-sm text-white/70">
                                        Kelola Kelurahan, RW, dan RT dalam satu
                                        struktur wilayah.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/admin/areas/create?type=kelurahan"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-4 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    <Plus className="size-4" />
                                    Tambah Kelurahan
                                </Link>

                                <Link
                                    href="/admin/areas/create?type=rw"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
                                >
                                    <Plus className="size-4" />
                                    Tambah RW
                                </Link>

                                <Link
                                    href="/admin/areas/create?type=rt"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
                                >
                                    <Plus className="size-4" />
                                    Tambah RT
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* STATS */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Kelurahan"
                            value={stats.kelurahan}
                            description="Wilayah tingkat atas"
                            icon={Building2}
                            tone="navy"
                            delay={0}
                        />

                        <StatCard
                            label="RW"
                            value={stats.rw}
                            description="Rukun Warga"
                            icon={Users}
                            tone="sea"
                            delay={70}
                        />

                        <StatCard
                            label="RT"
                            value={stats.rt}
                            description="Rukun Tetangga"
                            icon={MapPin}
                            tone="forest"
                            delay={140}
                        />

                        <StatCard
                            label="Batas Wilayah"
                            value={stats.boundaries}
                            description={`${boundaryPercent}% dari ${stats.total} wilayah`}
                            icon={MapIcon}
                            tone="sun"
                            delay={210}
                        />
                    </div>

                    {/* FILTER */}
                    <section className="animate-fade-in-up rounded-2xl border border-border bg-card p-4 shadow-sm [animation-delay:260ms]">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari wilayah atau wilayah induk..."
                                    className="h-11 w-full rounded-xl border border-input bg-background pr-4 pl-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-navy-400 focus:ring-4 focus:ring-ring/20"
                                />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(
                                        event.target.value as 'all' | AreaType,
                                    )
                                }
                                className={selectClass}
                            >
                                <option value="all">Semua jenis</option>
                                <option value="kelurahan">Kelurahan</option>
                                <option value="rw">RW</option>
                                <option value="rt">RT</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as
                                            | 'all'
                                            | 'active'
                                            | 'inactive',
                                    )
                                }
                                className={selectClass}
                            >
                                <option value="all">Semua status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>

                            {hasFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted"
                                >
                                    <RefreshCcw className="size-4" />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                                {visibleIds.size} wilayah terkait dengan hasil
                                pencarian
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={expandAll}
                                    className="text-xs font-semibold text-navy-600 hover:underline dark:text-navy-400"
                                >
                                    Buka semua
                                </button>

                                <span className="text-muted-foreground">/</span>

                                <button
                                    type="button"
                                    onClick={collapseAll}
                                    className="text-xs font-semibold text-navy-600 hover:underline dark:text-navy-400"
                                >
                                    Tutup semua
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* TREE */}
                    <section className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:320ms]">
                        <div className="border-b border-border bg-muted/40 px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                    <div>
                                        <h2 className="text-sm font-bold">
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
                        </div>

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
                            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                <div className="animate-float flex size-16 items-center justify-center rounded-full bg-navy-100 text-navy-500 dark:bg-navy-500/15">
                                    <FolderTree className="size-8" />
                                </div>

                                <h3 className="mt-4 text-sm font-semibold">
                                    Tidak ada wilayah
                                </h3>

                                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                                    {areas.length === 0
                                        ? 'Mulai dengan menambahkan Kelurahan pertama.'
                                        : 'Belum ada wilayah yang sesuai dengan filter saat ini.'}
                                </p>

                                {hasFilter && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
                                    >
                                        <RefreshCcw className="size-4" />
                                        Reset filter
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}