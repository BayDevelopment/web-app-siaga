import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Building2,
    Edit,
    LoaderCircle,
    MapPin,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

/* ---------- Tipe ---------- */

type Facility = {
    id: number;
    name: string;
    type: string;
    latitude: number | string | null;
    longitude: number | string | null;
    address: string | null;
    capacity: number | null;
    contact_phone: string | null;
    is_active: boolean;
    area: {
        id: number;
        name: string;
        type: string;
    } | null;
    created_at: string | null;
};

type Props = {
    facilities?: Facility[] | null;
};

type TypeFilter = 'all' | string;

/* ---------- Konstanta ---------- */

const EMPTY_FACILITIES: Facility[] = [];

const FOCUS_RING =
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

const facilityTypeLabels: Record<string, string> = {
    evacuation_point: 'Titik Evakuasi',
    posko: 'Posko',
    hydrant: 'Hidran',
    fire_post: 'Pos Damkar',
    clinic: 'Klinik',
};

const FILTERS: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'evacuation_point', label: 'Evakuasi' },
    { key: 'posko', label: 'Posko' },
    { key: 'fire_post', label: 'Damkar' },
    { key: 'hydrant', label: 'Hidran' },
    { key: 'clinic', label: 'Klinik' },
];

/* ---------- Helper ---------- */

function formatCoord(value: number | string | null): string {
    const parsed = Number(value);

    return value === null || value === '' || !Number.isFinite(parsed)
        ? '—'
        : parsed.toFixed(6);
}

function typeLabel(type: string): string {
    return facilityTypeLabels[type] ?? type;
}

/**
 * Data halaman sudah berasal dari controller.
 * Loading ini memberi transisi skeleton yang konsisten dengan halaman lain.
 */
function useFakeLoading(ms = 650) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), ms);

        return () => window.clearTimeout(timer);
    }, [ms]);

    return loading;
}

/* ---------- Skeleton ---------- */

function StatCardSkeleton({ delay }: { delay: number }) {
    return (
        <div
            className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="skeleton h-3.5 w-28" />
                    <div className="skeleton h-8 w-16" />
                    <div className="skeleton h-3 w-32" />
                </div>
                <div className="skeleton size-11 rounded-xl" />
            </div>
        </div>
    );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="grid min-w-[900px] grid-cols-[2fr_1.2fr_1.3fr_1.4fr_0.9fr_1.3fr] items-center gap-4 px-5 py-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="skeleton size-10 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="skeleton h-4 w-40" />
                            <div className="skeleton h-3 w-28" />
                        </div>
                    </div>
                    <div className="skeleton h-6 w-24 rounded-full" />
                    <div className="space-y-2">
                        <div className="skeleton h-4 w-28" />
                        <div className="skeleton h-3 w-16" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-3 w-24" />
                        <div className="skeleton h-3 w-24" />
                    </div>
                    <div className="skeleton h-6 w-16 rounded-full" />
                    <div className="flex justify-end gap-2">
                        <div className="skeleton h-9 w-16 rounded-xl" />
                        <div className="skeleton h-9 w-20 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CardListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                        <div className="skeleton size-10 shrink-0 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="skeleton h-4 w-2/3" />
                            <div className="skeleton h-3 w-1/2" />
                        </div>
                        <div className="skeleton h-6 w-16 rounded-full" />
                    </div>
                    <div className="skeleton h-3 w-3/4" />
                    <div className="flex justify-end gap-2">
                        <div className="skeleton h-9 w-16 rounded-xl" />
                        <div className="skeleton h-9 w-20 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
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

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
            <Building2 className="size-3.5" />
            {typeLabel(type)}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-800 dark:bg-forest-500/15 dark:text-forest-400">
            <span className="size-1.5 rounded-full bg-forest-500" />
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            Tidak Aktif
        </span>
    );
}

function FacilityIcon() {
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
            <Building2 className="size-5" />
        </span>
    );
}

function ActionButtons({
    facility,
    onDelete,
}: {
    facility: Facility;
    onDelete: (facility: Facility) => void;
}) {
    return (
        <div className="flex justify-end gap-2">
            <Link
                href={`/admin/facilities/${facility.id}/edit`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-400 ${FOCUS_RING}`}
            >
                <Edit className="size-3.5" />
                Edit
            </Link>

            <button
                type="button"
                onClick={() => onDelete(facility)}
                aria-label={`Hapus ${facility.name}`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300 ${FOCUS_RING}`}
            >
                <Trash2 className="size-3.5" />
                Hapus
            </button>
        </div>
    );
}

function EmptyState({ isFiltering }: { isFiltering: boolean }) {
    return (
        <div className="flex animate-fade-in flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-16 animate-float items-center justify-center rounded-2xl bg-sun-100 text-sun-600 ring-1 ring-sun-300/50 dark:bg-sun-500/15 dark:text-sun-300 dark:ring-sun-500/20">
                <Building2 className="size-8" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
                {isFiltering
                    ? 'Fasilitas tidak ditemukan'
                    : 'Belum ada fasilitas darurat'}
            </h3>

            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {isFiltering
                    ? 'Coba ubah kata kunci atau filter jenis fasilitas.'
                    : 'Tambahkan fasilitas darurat untuk menampilkannya pada peta kejadian.'}
            </p>

            {!isFiltering && (
                <Link
                    href="/admin/facilities/create"
                    className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${FOCUS_RING}`}
                >
                    <Plus className="size-4" />
                    Tambah Fasilitas
                </Link>
            )}
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function FacilityIndex({ facilities: facilitiesProp }: Props) {
    // Inertia bisa mengirim null / tidak mengirim prop sama sekali.
    const facilities = facilitiesProp ?? EMPTY_FACILITIES;

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const loading = useFakeLoading(650);

    const counts = useMemo(() => {
        const result = { evacuation_point: 0, posko: 0, fire_post: 0 };

        for (const facility of facilities) {
            if (facility.type in result) {
                result[facility.type as keyof typeof result] += 1;
            }
        }

        return result;
    }, [facilities]);

    const filteredFacilities = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return facilities.filter((facility) => {
            if (typeFilter !== 'all' && facility.type !== typeFilter) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return (
                facility.name.toLowerCase().includes(keyword) ||
                facility.type.toLowerCase().includes(keyword) ||
                typeLabel(facility.type).toLowerCase().includes(keyword) ||
                facility.address?.toLowerCase().includes(keyword) ||
                facility.contact_phone?.toLowerCase().includes(keyword) ||
                facility.area?.name.toLowerCase().includes(keyword)
            );
        });
    }, [facilities, search, typeFilter]);

    // Dialog konfirmasi hapus. Target tidak dikosongkan saat dialog ditutup
    // supaya teks tidak hilang selama animasi tutup.
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = (facility: Facility) => {
        setDeleteTarget(facility);
        setDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/admin/facilities/${deleteTarget.id}`, {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
            },
        });
    };

    const isFiltering = search.trim() !== '' || typeFilter !== 'all';

    const stats = [
        {
            label: 'Total Fasilitas',
            value: facilities.length,
            description: 'Semua data fasilitas',
            icon: Building2,
            toneClass:
                'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
        },
        {
            label: 'Titik Evakuasi',
            value: counts.evacuation_point,
            description: 'Lokasi evakuasi tersedia',
            icon: MapPin,
            toneClass:
                'bg-sea-300/30 text-sea-500 dark:bg-sea-500/15 dark:text-sea-300',
            valueClass: 'text-sea-500 dark:text-sea-300',
        },
        {
            label: 'Posko',
            value: counts.posko,
            description: 'Posko penanganan darurat',
            icon: Building2,
            toneClass:
                'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
            valueClass: 'text-sun-600 dark:text-sun-400',
        },
        {
            label: 'Pos Damkar',
            value: counts.fire_post,
            description: 'Titik pemadam kebakaran',
            icon: Building2,
            toneClass:
                'bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400',
            valueClass: 'text-forest-600 dark:text-forest-400',
        },
    ];

    return (
        <>
            <Head title="Fasilitas Darurat" />

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

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="flex size-14 shrink-0 animate-float items-center justify-center rounded-2xl bg-navy-100 text-navy-600 ring-1 ring-navy-200 dark:bg-navy-500/15 dark:text-navy-400 dark:ring-navy-500/30">
                                    <Building2 className="size-7" />
                                </span>

                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-navy-600 uppercase dark:text-navy-400">
                                        Master Fasilitas
                                    </p>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                        Fasilitas Darurat
                                    </h1>
                                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                        Kelola titik fasilitas yang dapat
                                        digunakan untuk mendukung penanganan
                                        keadaan darurat di wilayah.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/admin/facilities/create"
                                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md dark:bg-sun-400 dark:hover:bg-sun-300 ${FOCUS_RING}`}
                            >
                                <Plus className="size-4" />
                                Tambah Fasilitas
                            </Link>
                        </div>
                    </section>

                    {/* =====================================================
                        STATISTIK
                    ====================================================== */}
                    <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {loading
                            ? stats.map((stat, index) => (
                                  <StatCardSkeleton
                                      key={stat.label}
                                      delay={index * 70}
                                  />
                              ))
                            : stats.map((stat, index) => (
                                  <StatCard
                                      key={stat.label}
                                      {...stat}
                                      delay={index * 70}
                                  />
                              ))}
                    </section>

                    {/* =====================================================
                        DAFTAR FASILITAS
                    ====================================================== */}
                    <section className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:260ms]">
                        {/* Toolbar */}
                        <div className="flex flex-col gap-4 border-b border-border p-4 md:p-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Daftar Fasilitas
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {loading
                                            ? 'Memuat data fasilitas...'
                                            : `Menampilkan ${filteredFacilities.length} dari ${facilities.length} fasilitas`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                                <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Cari nama, jenis, wilayah, alamat..."
                                        aria-label="Cari fasilitas"
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

                                <div
                                    role="tablist"
                                    aria-label="Filter jenis fasilitas"
                                    className="flex overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
                                >
                                    {FILTERS.map((filter) => {
                                        const active = typeFilter === filter.key;

                                        return (
                                            <button
                                                key={filter.key}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() =>
                                                    setTypeFilter(filter.key)
                                                }
                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${FOCUS_RING} ${
                                                    active
                                                        ? 'bg-card text-navy-600 shadow-sm dark:text-navy-400'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {filter.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Konten */}
                        {loading ? (
                            <>
                                <div className="lg:hidden">
                                    <CardListSkeleton />
                                </div>
                                <div className="hidden overflow-x-auto lg:block">
                                    <TableSkeleton rows={5} />
                                </div>
                            </>
                        ) : filteredFacilities.length === 0 ? (
                            <EmptyState isFiltering={isFiltering} />
                        ) : (
                            <>
                                {/* Mobile: kartu */}
                                <ul className="divide-y divide-border lg:hidden">
                                    {filteredFacilities.map((facility) => (
                                        <li
                                            key={facility.id}
                                            className="group p-4 transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-500/10"
                                        >
                                            <div className="flex items-start gap-3">
                                                <FacilityIcon />

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {facility.name}
                                                    </p>
                                                    {facility.address && (
                                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                            {facility.address}
                                                        </p>
                                                    )}
                                                </div>

                                                <StatusBadge
                                                    active={facility.is_active}
                                                />
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <TypeBadge type={facility.type} />

                                                <span>
                                                    {facility.area
                                                        ? `${facility.area.name} (${facility.area.type.toUpperCase()})`
                                                        : 'Semua wilayah'}
                                                </span>

                                                {facility.capacity !== null && (
                                                    <span>
                                                        Kapasitas{' '}
                                                        {facility.capacity}
                                                    </span>
                                                )}

                                                <span className="inline-flex items-center gap-1 tabular-nums">
                                                    <MapPin className="size-3.5 text-sea-500" />
                                                    {formatCoord(
                                                        facility.latitude,
                                                    )}
                                                    ,{' '}
                                                    {formatCoord(
                                                        facility.longitude,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="mt-3">
                                                <ActionButtons
                                                    facility={facility}
                                                    onDelete={handleDelete}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto lg:block">
                                    <table
                                        className="w-full min-w-[900px] text-left text-sm"
                                        aria-label="Daftar fasilitas darurat"
                                    >
                                        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Fasilitas
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Jenis
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Wilayah
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Lokasi
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Status
                                                </th>
                                                <th className="px-5 py-3.5 text-right font-semibold">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-border">
                                            {filteredFacilities.map(
                                                (facility) => (
                                                    <tr
                                                        key={facility.id}
                                                        className="group transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-500/10"
                                                    >
                                                        <td className="relative px-5 py-4">
                                                            <span
                                                                aria-hidden
                                                                className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${
                                                                    facility.is_active
                                                                        ? 'bg-forest-500'
                                                                        : 'bg-muted-foreground/40'
                                                                }`}
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <FacilityIcon />

                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-foreground">
                                                                        {
                                                                            facility.name
                                                                        }
                                                                    </p>
                                                                    {facility.address && (
                                                                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                                                            {
                                                                                facility.address
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <TypeBadge
                                                                type={
                                                                    facility.type
                                                                }
                                                            />
                                                            {facility.capacity !==
                                                                null && (
                                                                <p className="mt-1.5 text-xs text-muted-foreground">
                                                                    Kapasitas{' '}
                                                                    {
                                                                        facility.capacity
                                                                    }
                                                                </p>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {facility.area ? (
                                                                <div>
                                                                    <p className="font-medium text-foreground">
                                                                        {
                                                                            facility
                                                                                .area
                                                                                .name
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground uppercase">
                                                                        {
                                                                            facility
                                                                                .area
                                                                                .type
                                                                        }
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                                    Semua
                                                                    wilayah
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <MapPin className="size-4 shrink-0 text-sea-500" />
                                                                <div className="text-xs leading-5 tabular-nums">
                                                                    <p>
                                                                        {formatCoord(
                                                                            facility.latitude,
                                                                        )}
                                                                    </p>
                                                                    <p>
                                                                        {formatCoord(
                                                                            facility.longitude,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge
                                                                active={
                                                                    facility.is_active
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <ActionButtons
                                                                facility={
                                                                    facility
                                                                }
                                                                onDelete={
                                                                    handleDelete
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>

            {/* =====================================================
                KONFIRMASI HAPUS
            ====================================================== */}
            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    if (!open && !deleting) {
                        setDeleteOpen(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            <TriangleAlert className="size-6" />
                        </div>

                        <DialogTitle>Hapus fasilitas?</DialogTitle>

                        <DialogDescription>
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            {deleteTarget &&
                                ` (${typeLabel(deleteTarget.type)})`}{' '}
                            akan dihapus dari daftar dan peta kejadian.
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deleting}
                            onClick={() => setDeleteOpen(false)}
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleting}
                            onClick={confirmDelete}
                        >
                            {deleting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            {deleting ? 'Menghapus...' : 'Ya, hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

FacilityIndex.layout = {
    breadcrumbs: [
        {
            title: 'Fasilitas Darurat',
            href: '/admin/facilities',
        },
    ],
};