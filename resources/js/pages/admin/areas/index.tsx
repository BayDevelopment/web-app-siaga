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
        className: string;
    }
> = {
    kelurahan: {
        label: 'Kelurahan',
        icon: Building2,
        className:
            'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    },
    rw: {
        label: 'RW',
        icon: Users,
        className:
            'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    },
    rt: {
        label: 'RT',
        icon: MapPin,
        className:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
};

function TypeBadge({ type }: { type: AreaType }) {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;

    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                config.className,
            ].join(' ')}
        >
            <Icon className="h-3.5 w-3.5" />
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
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground',
            ].join(' ')}
        >
            <span
                className={[
                    'h-1.5 w-1.5 rounded-full',
                    active ? 'bg-emerald-500' : 'bg-muted-foreground',
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
}: {
    label: string;
    value: number;
    description: string;
    icon: typeof Building2;
}) {
    return (
        <div className="rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
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

    const depth =
        area.type === 'kelurahan'
            ? 0
            : area.type === 'rw'
              ? 1
              : 2;

    const paddingLeft =
        depth === 0
            ? 'pl-4'
            : depth === 1
              ? 'pl-10'
              : 'pl-16';

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
                    'group border-b last:border-b-0',
                    depth === 0
                        ? 'bg-background'
                        : 'bg-muted/10',
                ].join(' ')}
            >
                <div
                    className={[
                        'flex flex-col gap-3 py-4 pr-4 sm:flex-row sm:items-center sm:justify-between',
                        paddingLeft,
                    ].join(' ')}
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
                                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                                hasChildren
                                    ? 'hover:bg-accent'
                                    : 'cursor-default opacity-0',
                            ].join(' ')}
                        >
                            {expanded.has(area.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>

                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {area.type === 'kelurahan' ? (
                                    <Building2 className="h-4 w-4" />
                                ) : area.type === 'rw' ? (
                                    <Users className="h-4 w-4" />
                                ) : (
                                    <MapPin className="h-4 w-4" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate font-semibold">
                                        {area.name}
                                    </h3>

                                    <TypeBadge type={area.type} />

                                    <StatusBadge
                                        active={area.is_active}
                                    />
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    {area.parent && (
                                        <span>
                                            Induk: {area.parent}
                                        </span>
                                    )}

                                    {area.type !== 'rt' && (
                                        <span>
                                            {area.children_count}{' '}
                                            {area.type === 'kelurahan'
                                                ? 'RW'
                                                : 'RT'}
                                        </span>
                                    )}

                                    <span>
                                        {area.reports_count} laporan
                                    </span>

                                    <span>
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
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {childLabel}
                            </Link>
                        )}

                        {area.slug && (
                            <Link
                                href={`/peta/${area.slug}`}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-accent"
                            >
                                <MapIcon className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">
                                    Peta
                                </span>
                            </Link>
                        )}

                        <Link
                            href={`/admin/areas/${area.id}/edit`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-accent"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">
                                Edit
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => onDelete(area)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/20 bg-background text-destructive transition hover:bg-destructive/5"
                            title="Hapus"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
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

    const [typeFilter, setTypeFilter] = useState<
        'all' | AreaType
    >('all');

    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >('all');

    const areaById = useMemo(
        () =>
            new globalThis.Map<number, Area>(
                areas.map(
                    (area) =>
                        [area.id, area] as [number, Area],
                ),
            ),
        [areas],
    );

    const childrenMap = useMemo(() => {
        const map =
            new globalThis.Map<number, Area[]>();

        for (const area of areas) {
            if (area.parent_id === null) {
                continue;
            }

            const current =
                map.get(area.parent_id) ?? [];

            current.push(area);

            map.set(area.parent_id, current);
        }

        return map;
    }, [areas]);

    const matchesFilter = (area: Area) => {
        const keyword = search
            .trim()
            .toLowerCase();

        const matchesSearch =
            !keyword ||
            area.name
                .toLowerCase()
                .includes(keyword) ||
            area.parent
                ?.toLowerCase()
                .includes(keyword);

        const matchesType =
            typeFilter === 'all' ||
            area.type === typeFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'
                ? area.is_active
                : !area.is_active);

        return (
            matchesSearch &&
            matchesType &&
            matchesStatus
        );
    };

    const visibleIds = useMemo(() => {
        const ids =
            new globalThis.Set<number>();

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

                current = areaById.get(
                    current.parent_id,
                );
            }
        }

        return ids;
    }, [
        areas,
        areaById,
        search,
        typeFilter,
        statusFilter,
    ]);

    const visibleChildrenMap = useMemo(() => {
        const map =
            new globalThis.Map<number, Area[]>();

        for (const area of areas) {
            if (
                area.parent_id !== null &&
                visibleIds.has(area.id)
            ) {
                const current =
                    map.get(area.parent_id) ?? [];

                current.push(area);

                map.set(
                    area.parent_id,
                    current,
                );
            }
        }

        return map;
    }, [areas, visibleIds]);

    const rootAreas = useMemo(
        () =>
            areas.filter(
                (area) =>
                    area.parent_id === null &&
                    visibleIds.has(area.id),
            ),
        [areas, visibleIds],
    );

    const [expanded, setExpanded] = useState<
        Set<number>
    >(() => {
        const initial =
            new globalThis.Set<number>();

        for (const area of areas) {
            if (
                (
                    childrenMap.get(area.id) ?? []
                ).length > 0
            ) {
                initial.add(area.id);
            }
        }

        return initial;
    });

    const stats = {
        total: areas.length,

        kelurahan: areas.filter(
            (area) => area.type === 'kelurahan',
        ).length,

        rw: areas.filter(
            (area) => area.type === 'rw',
        ).length,

        rt: areas.filter(
            (area) => area.type === 'rt',
        ).length,

        active: areas.filter(
            (area) => area.is_active,
        ).length,

        boundaries: areas.filter(
            (area) => area.has_boundary,
        ).length,
    };

    const toggle = (id: number) => {
        setExpanded((current) => {
            const next =
                new globalThis.Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const expandAll = () => {
        const ids =
            new globalThis.Set<number>();

        for (const area of areas) {
            if (
                (
                    childrenMap.get(area.id) ?? []
                ).length > 0
            ) {
                ids.add(area.id);
            }
        }

        setExpanded(ids);
    };

    const collapseAll = () => {
        setExpanded(
            new globalThis.Set<number>(),
        );
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

        router.delete(
            `/admin/areas/${area.id}`,
            {
                preserveScroll: true,

                onSuccess: () => {
                    toast.success(
                        `Wilayah "${area.name}" berhasil dihapus.`,
                    );
                },

                onError: (errors) => {
                    const message =
                        typeof errors.delete ===
                        'string'
                            ? errors.delete
                            : 'Wilayah tidak dapat dihapus.';

                    toast.error(message);
                },
            },
        );
    };

    const hasFilter =
        search.trim() !== '' ||
        typeFilter !== 'all' ||
        statusFilter !== 'all';

    return (
        <>
            <Head title="Manajemen Wilayah" />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
                    {/* HEADER */}
                    <section className="rounded-2xl border bg-background shadow-sm">
                        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <FolderTree className="h-6 w-6" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                        Manajemen Wilayah
                                    </h1>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Kelola Kelurahan, RW, dan RT dalam satu struktur wilayah.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/admin/areas/create?type=kelurahan"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Kelurahan
                                </Link>

                                <Link
                                    href="/admin/areas/create?type=rw"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold transition hover:bg-accent"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah RW
                                </Link>

                                <Link
                                    href="/admin/areas/create?type=rt"
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold transition hover:bg-accent"
                                >
                                    <Plus className="h-4 w-4" />
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
                        />

                        <StatCard
                            label="RW"
                            value={stats.rw}
                            description="Rukun Warga"
                            icon={Users}
                        />

                        <StatCard
                            label="RT"
                            value={stats.rt}
                            description="Rukun Tetangga"
                            icon={MapPin}
                        />

                        <StatCard
                            label="Batas Wilayah"
                            value={stats.boundaries}
                            description={`Dari ${stats.total} wilayah`}
                            icon={MapIcon}
                        />
                    </div>

                    {/* FILTER */}
                    <section className="rounded-2xl border bg-background p-4 shadow-sm">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Cari wilayah atau wilayah induk..."
                                    className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(
                                        event.target.value as
                                            | 'all'
                                            | AreaType,
                                    )
                                }
                                className="h-11 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                            >
                                <option value="all">
                                    Semua jenis
                                </option>

                                <option value="kelurahan">
                                    Kelurahan
                                </option>

                                <option value="rw">
                                    RW
                                </option>

                                <option value="rt">
                                    RT
                                </option>
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
                                className="h-11 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                            >
                                <option value="all">
                                    Semua status
                                </option>

                                <option value="active">
                                    Aktif
                                </option>

                                <option value="inactive">
                                    Nonaktif
                                </option>
                            </select>

                            {hasFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition hover:bg-accent"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                                {visibleIds.size} wilayah terkait
                                dengan hasil pencarian
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={expandAll}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Buka semua
                                </button>

                                <span className="text-muted-foreground">
                                    /
                                </span>

                                <button
                                    type="button"
                                    onClick={collapseAll}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Tutup semua
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* TREE */}
                    <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                        <div className="border-b bg-muted/20 px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold">
                                        Struktur Wilayah
                                    </h2>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Kelurahan → RW → RT
                                    </p>
                                </div>

                                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                    {stats.active} aktif
                                </span>
                            </div>
                        </div>

                        {rootAreas.length > 0 ? (
                            <div>
                                {rootAreas.map((area) => (
                                    <AreaNode
                                        key={area.id}
                                        area={area}
                                        childrenMap={
                                            visibleChildrenMap
                                        }
                                        expanded={expanded}
                                        onToggle={toggle}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                    <FolderTree className="h-6 w-6" />
                                </div>

                                <h3 className="mt-4 font-semibold">
                                    Tidak ada wilayah
                                </h3>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    Belum ada wilayah yang sesuai dengan filter saat ini.
                                </p>

                                {hasFilter && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-accent"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                        Reset filter
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    {/* SUMMARY */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                                Total Wilayah
                            </p>

                            <p className="mt-1 text-xl font-bold">
                                {stats.total}
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                                Wilayah Aktif
                            </p>

                            <p className="mt-1 text-xl font-bold text-emerald-600">
                                {stats.active}
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                                Wilayah dengan Batas
                            </p>

                            <p className="mt-1 text-xl font-bold text-primary">
                                {stats.boundaries}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}