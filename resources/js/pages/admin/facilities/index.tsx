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
import type { CSSProperties, ReactNode } from 'react';

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

type Tone = 'navy' | 'sea' | 'sun' | 'forest';

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

// Kelas ditulis utuh (bukan disusun dinamis) agar terbaca oleh Tailwind.
const TONES: Record<Tone, { icon: string; glow: string }> = {
    navy: {
        icon: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300',
        glow: 'hover:shadow-navy-500/10',
    },
    sea: {
        icon: 'bg-sea-300/30 text-sea-600 dark:bg-sea-500/15 dark:text-sea-300',
        glow: 'hover:shadow-sea-500/10',
    },
    sun: {
        icon: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
        glow: 'hover:shadow-sun-500/10',
    },
    forest: {
        icon: 'bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-300',
        glow: 'hover:shadow-forest-500/10',
    },
};

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

function Reveal({
    children,
    delay = 0,
}: {
    children: ReactNode;
    delay?: number;
}) {
    return (
        <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
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

function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="skeleton h-3.5 w-28" />
                    <div className="skeleton h-8 w-16" />
                </div>
                <div className="skeleton size-11 rounded-xl" />
            </div>
            <div className="mt-3 skeleton h-3 w-32" />
        </div>
    );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="grid min-w-[900px] grid-cols-[2fr_1.2fr_1.3fr_1.4fr_0.9fr_1.3fr] items-center gap-4 px-6 py-4"
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
    hint,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    hint: string;
    icon: LucideIcon;
    tone: Tone;
}) {
    const styles = TONES[tone];

    return (
        <div
            className={`group h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg dark:hover:border-navy-500/40 ${styles.glow}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-foreground">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {hint}
                    </p>
                </div>

                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${styles.icon}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700 dark:bg-navy-500/15 dark:text-navy-300">
            {typeLabel(type)}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-600 dark:bg-forest-500/15 dark:text-forest-300">
            <span className="size-1.5 rounded-full bg-forest-500" />
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            Tidak Aktif
        </span>
    );
}

function FacilityIcon() {
    return (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300">
            <Building2 className="size-5" />
        </div>
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
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-500/10 ${FOCUS_RING}`}
            >
                <Edit className="size-3.5" />
                Edit
            </Link>

            <button
                type="button"
                onClick={() => onDelete(facility)}
                aria-label={`Hapus ${facility.name}`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive-foreground ${FOCUS_RING}`}
            >
                <Trash2 className="size-3.5" />
                Hapus
            </button>
        </div>
    );
}

function EmptyState({ search }: { search: string }) {
    return (
        <div className="flex animate-fade-in flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-navy-100 text-navy-500 dark:bg-navy-500/15 dark:text-navy-300">
                <Building2 className="size-7" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-foreground">
                Tidak ada fasilitas
            </h3>

            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {search
                    ? 'Tidak ditemukan fasilitas yang sesuai dengan pencarian.'
                    : 'Belum ada fasilitas darurat yang ditambahkan.'}
            </p>

            {!search && (
                <Link
                    href="/admin/facilities/create"
                    className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-500/25 ${FOCUS_RING}`}
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

        if (!keyword) {
            return facilities;
        }

        return facilities.filter(
            (facility) =>
                facility.name.toLowerCase().includes(keyword) ||
                facility.type.toLowerCase().includes(keyword) ||
                typeLabel(facility.type).toLowerCase().includes(keyword) ||
                facility.address?.toLowerCase().includes(keyword) ||
                facility.contact_phone?.toLowerCase().includes(keyword) ||
                facility.area?.name.toLowerCase().includes(keyword),
        );
    }, [facilities, search]);

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

    const keyword = search.trim();

    return (
        <>
            <Head title="Fasilitas Darurat" />

            <div className="relative isolate flex min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
                {/* Dekorasi latar mengikuti dashboard SIAGA-W */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-72 w-72 animate-blob bg-navy-400/15 dark:bg-navy-400/10" />
                    <div className="blob top-1/3 -right-28 h-80 w-80 animate-blob-slow bg-sun-300/15 dark:bg-sun-400/10" />
                    <div className="blob -bottom-28 left-1/3 h-72 w-72 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />
                </div>

                {/* HEADER */}
                <Reveal>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700 dark:border-navy-500/20 dark:bg-navy-500/10 dark:text-navy-300">
                                <Building2 className="size-3.5" />
                                Master Fasilitas
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-gradient-brand md:text-3xl">
                                Fasilitas Darurat
                            </h1>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Kelola titik fasilitas yang dapat digunakan untuk
                                mendukung penanganan keadaan darurat di wilayah.
                            </p>
                        </div>

                        <Link
                            href="/admin/facilities/create"
                            className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-500/25 ${FOCUS_RING}`}
                        >
                            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                            Tambah Fasilitas
                        </Link>
                    </div>
                </Reveal>

                {/* RINGKASAN */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Reveal key={index} delay={index * 70}>
                                <StatCardSkeleton />
                            </Reveal>
                        ))
                    ) : (
                        <>
                            <Reveal delay={0}>
                                <StatCard
                                    label="Total Fasilitas"
                                    value={facilities.length}
                                    hint="Semua data fasilitas"
                                    icon={Building2}
                                    tone="navy"
                                />
                            </Reveal>

                            <Reveal delay={70}>
                                <StatCard
                                    label="Titik Evakuasi"
                                    value={counts.evacuation_point}
                                    hint="Lokasi evakuasi tersedia"
                                    icon={MapPin}
                                    tone="sea"
                                />
                            </Reveal>

                            <Reveal delay={140}>
                                <StatCard
                                    label="Posko"
                                    value={counts.posko}
                                    hint="Posko penanganan darurat"
                                    icon={Building2}
                                    tone="sun"
                                />
                            </Reveal>

                            <Reveal delay={210}>
                                <StatCard
                                    label="Pos Damkar"
                                    value={counts.fire_post}
                                    hint="Titik pemadam kebakaran"
                                    icon={Building2}
                                    tone="forest"
                                />
                            </Reveal>
                        </>
                    )}
                </div>

                {/* DAFTAR */}
                <Reveal delay={260}>
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        {/* Toolbar */}
                        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Daftar Fasilitas
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {loading
                                            ? 'Memuat data fasilitas...'
                                            : `Menampilkan ${filteredFacilities.length} dari ${facilities.length} fasilitas`}
                                    </p>
                                </div>
                            </div>

                            <div className="relative w-full lg:max-w-md">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari nama, jenis, wilayah, atau alamat..."
                                    aria-label="Cari fasilitas"
                                    className="h-10 w-full rounded-xl border border-border bg-background pr-9 pl-10 text-sm text-foreground transition outline-none placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        aria-label="Hapus pencarian"
                                        className={`absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted ${FOCUS_RING}`}
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

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
                            <EmptyState search={keyword} />
                        ) : (
                            <>
                                {/* Mobile: kartu */}
                                <ul className="divide-y divide-border lg:hidden">
                                    {filteredFacilities.map((facility) => (
                                        <li
                                            key={facility.id}
                                            className="space-y-3 p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <FacilityIcon />

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-foreground">
                                                        {facility.name}
                                                    </p>
                                                    {facility.address && (
                                                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                            {facility.address}
                                                        </p>
                                                    )}
                                                </div>

                                                <StatusBadge
                                                    active={facility.is_active}
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <TypeBadge type={facility.type} />

                                                <span>
                                                    {facility.area
                                                        ? `${facility.area.name} (${facility.area.type})`
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

                                            <ActionButtons
                                                facility={facility}
                                                onDelete={handleDelete}
                                            />
                                        </li>
                                    ))}
                                </ul>

                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto lg:block">
                                    <table className="w-full min-w-[900px] text-left text-sm">
                                        <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                                            <tr>
                                                <th className="px-6 py-3.5 font-semibold">
                                                    Fasilitas
                                                </th>
                                                <th className="px-6 py-3.5 font-semibold">
                                                    Jenis
                                                </th>
                                                <th className="px-6 py-3.5 font-semibold">
                                                    Wilayah
                                                </th>
                                                <th className="px-6 py-3.5 font-semibold">
                                                    Lokasi
                                                </th>
                                                <th className="px-6 py-3.5 font-semibold">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3.5 text-right font-semibold">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-border">
                                            {filteredFacilities.map(
                                                (facility) => (
                                                    <tr
                                                        key={facility.id}
                                                        className="transition-colors hover:bg-navy-50/70 dark:hover:bg-navy-500/5"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <FacilityIcon />

                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-foreground">
                                                                        {
                                                                            facility.name
                                                                        }
                                                                    </p>
                                                                    {facility.address && (
                                                                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                                                                            {
                                                                                facility.address
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4">
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

                                                        <td className="px-6 py-4">
                                                            {facility.area ? (
                                                                <div>
                                                                    <p className="font-medium text-foreground">
                                                                        {
                                                                            facility
                                                                                .area
                                                                                .name
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground capitalize">
                                                                        {
                                                                            facility
                                                                                .area
                                                                                .type
                                                                        }
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    Semua
                                                                    wilayah
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-4">
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

                                                        <td className="px-6 py-4">
                                                            <StatusBadge
                                                                active={
                                                                    facility.is_active
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-6 py-4">
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
                </Reveal>
            </div>

            {/* KONFIRMASI HAPUS */}
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
                        <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive-foreground dark:bg-destructive-foreground/15">
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