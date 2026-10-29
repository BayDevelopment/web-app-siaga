import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Edit,
    LoaderCircle,
    MapPin,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Facility = {
    id: number;
    name: string;
    type: string;
    latitude: number | string;
    longitude: number | string;
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
    facilities: Facility[];
};

const facilityTypeLabels: Record<string, string> = {
    evacuation_point: 'Titik Evakuasi',
    posko: 'Posko',
    hydrant: 'Hidran',
    fire_post: 'Pos Damkar',
    clinic: 'Klinik',
};

/** Animasi masuk yang mengikuti pola dashboard SIAGA-W. */
function Reveal({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <div
            className={`animate-fade-in-up ${className}`}
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

/**
 * Data halaman sudah berasal dari controller.
 * Loading ini dipakai untuk memberi transisi skeleton yang konsisten dengan dashboard.
 */
function useFakeLoading(ms = 650) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), ms);

        return () => window.clearTimeout(timer);
    }, [ms]);

    return loading;
}

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

function FacilityTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="grid min-w-[1000px] grid-cols-[2fr_1.2fr_1.3fr_1.4fr_0.9fr_1.3fr] items-center gap-4 px-6 py-4"
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
                    <div className="flex items-center gap-2">
                        <div className="skeleton size-4 rounded-full" />
                        <div className="space-y-2">
                            <div className="skeleton h-3 w-24" />
                            <div className="skeleton h-3 w-24" />
                        </div>
                    </div>
                    <div className="skeleton h-6 w-16 rounded-full" />
                    <div className="flex justify-end gap-2">
                        <div className="skeleton h-9 w-16 rounded-lg" />
                        <div className="skeleton h-9 w-20 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ search }: { search: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
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
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-500/25"
                >
                    <Plus className="size-4" />
                    Tambah Fasilitas
                </Link>
            )}
        </div>
    );
}

export default function FacilityIndex({ facilities }: Props) {
    const [search, setSearch] = useState('');
    const loading = useFakeLoading(650);

    const filteredFacilities = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) {
            return facilities;
        }

        return facilities.filter((facility) => {
            return (
                facility.name.toLowerCase().includes(keyword) ||
                facility.type.toLowerCase().includes(keyword) ||
                facilityTypeLabels[facility.type]?.toLowerCase().includes(keyword) ||
                facility.address?.toLowerCase().includes(keyword) ||
                facility.area?.name.toLowerCase().includes(keyword)
            );
        });
    }, [facilities, search]);

    const totalEvacuationPoints = facilities.filter(
        (facility) => facility.type === 'evacuation_point',
    ).length;

    const totalPosts = facilities.filter(
        (facility) => facility.type === 'posko',
    ).length;

    const totalFirePosts = facilities.filter(
        (facility) => facility.type === 'fire_post',
    ).length;

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

    return (
        <>
            <Head title="Fasilitas Darurat" />

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
                {/* Dekorasi latar mengikuti dashboard SIAGA-W */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-72 w-72 animate-blob bg-navy-400/15" />
                    <div className="blob top-1/3 -right-28 h-80 w-80 animate-blob-slow bg-sun-300/15" />
                    <div className="blob -bottom-28 left-1/3 h-72 w-72 animate-blob bg-forest-400/10" />
                </div>

                <Reveal>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 dark:border-navy-500/20 dark:bg-navy-500/10 dark:text-navy-300">
                                <Building2 className="size-3.5" />
                                Master Data
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-gradient-brand md:text-3xl">
                                Fasilitas Darurat
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Kelola titik fasilitas yang dapat digunakan untuk
                                mendukung penanganan keadaan darurat di wilayah.
                            </p>
                        </div>

                        <Link
                            href="/admin/facilities/create"
                            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-500/25"
                        >
                            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                            Tambah Fasilitas
                        </Link>
                    </div>
                </Reveal>

                {/* SUMMARY */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="animate-fade-in-up"
                                style={{
                                    animationDelay: `${index * 70}ms`,
                                } as CSSProperties}
                            >
                                <StatCardSkeleton />
                            </div>
                        ))
                    ) : (
                        <>
                            <Reveal delay={0}>
                                <div className="group h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy-500/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Total Fasilitas
                                            </p>
                                            <p className="mt-1 text-3xl font-bold text-foreground">
                                                {facilities.length}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Semua data fasilitas
                                            </p>
                                        </div>
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-navy-100 text-navy-600 transition-transform duration-300 group-hover:scale-110 dark:bg-navy-500/15 dark:text-navy-300">
                                            <Building2 className="size-5" />
                                        </div>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={70}>
                                <div className="group h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sea-500/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Titik Evakuasi
                                            </p>
                                            <p className="mt-1 text-3xl font-bold text-foreground">
                                                {totalEvacuationPoints}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Lokasi evakuasi tersedia
                                            </p>
                                        </div>
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-sea-300/30 text-sea-600 transition-transform duration-300 group-hover:scale-110 dark:bg-sea-500/15 dark:text-sea-300">
                                            <MapPin className="size-5" />
                                        </div>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={140}>
                                <div className="group h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sun-500/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Posko
                                            </p>
                                            <p className="mt-1 text-3xl font-bold text-foreground">
                                                {totalPosts}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Posko penanganan darurat
                                            </p>
                                        </div>
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-sun-100 text-sun-600 transition-transform duration-300 group-hover:scale-110 dark:bg-sun-500/15 dark:text-sun-300">
                                            <Building2 className="size-5" />
                                        </div>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={210}>
                                <div className="group h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-forest-500/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Pos Damkar
                                            </p>
                                            <p className="mt-1 text-3xl font-bold text-foreground">
                                                {totalFirePosts}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Titik pemadam kebakaran
                                            </p>
                                        </div>
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-forest-100 text-forest-600 transition-transform duration-300 group-hover:scale-110 dark:bg-forest-500/15 dark:text-forest-300">
                                            <Building2 className="size-5" />
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        </>
                    )}
                </div>

                {/* SEARCH */}
                <Reveal delay={260}>
                    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Daftar Fasilitas
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Cari berdasarkan nama, jenis, wilayah, atau alamat.
                                </p>
                            </div>

                            <div className="relative w-full sm:max-w-md">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari fasilitas..."
                                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                                />
                            </div>
                        </div>
                    </section>
                </Reveal>

                {/* TABLE */}
                <Reveal delay={320}>
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-4 py-4 md:px-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Data Fasilitas
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {loading
                                            ? 'Memuat data fasilitas...'
                                            : `${filteredFacilities.length} fasilitas ditampilkan`}
                                    </p>
                                </div>

                                {!loading && search.trim() && (
                                    <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700 dark:bg-navy-500/15 dark:text-navy-300">
                                        Filter: {search}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <FacilityTableSkeleton rows={5} />
                            ) : (
                                <table className="w-full min-w-[1000px] text-sm">
                                    <thead className="border-b border-border bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground">
                                                Fasilitas
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground">
                                                Jenis
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground">
                                                Wilayah
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground">
                                                Lokasi
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right font-semibold text-foreground">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border">
                                        {filteredFacilities.length > 0 ? (
                                            filteredFacilities.map((facility, index) => (
                                                <tr
                                                    key={facility.id}
                                                    className="animate-fade-in-up transition-colors hover:bg-navy-50/70 dark:hover:bg-navy-500/5"
                                                    style={{
                                                        animationDelay: `${index * 45}ms`,
                                                    } as CSSProperties}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300">
                                                                <Building2 className="size-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold text-foreground">
                                                                    {facility.name}
                                                                </p>
                                                                {facility.address && (
                                                                    <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                                                                        {facility.address}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700 dark:bg-navy-500/15 dark:text-navy-300">
                                                            {facilityTypeLabels[facility.type] ??
                                                                facility.type}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {facility.area ? (
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {facility.area.name}
                                                                </p>
                                                                <p className="text-xs capitalize text-muted-foreground">
                                                                    {facility.area.type}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Semua wilayah
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <MapPin className="size-4 shrink-0 text-sea-500" />
                                                            <div className="tabular-nums text-xs leading-5">
                                                                <p>
                                                                    {Number(facility.latitude).toFixed(6)}
                                                                </p>
                                                                <p>
                                                                    {Number(facility.longitude).toFixed(6)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {facility.is_active ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-600 dark:bg-forest-500/15 dark:text-forest-300">
                                                                <span className="size-1.5 rounded-full bg-forest-500" />
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                                                <span className="size-1.5 rounded-full bg-muted-foreground" />
                                                                Tidak Aktif
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={`/admin/facilities/${facility.id}/edit`}
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-accent"
                                                            >
                                                                <Edit className="size-3.5" />
                                                                Edit
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(facility)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-background px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6}>
                                                    <EmptyState search={search.trim()} />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
                        <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            <TriangleAlert className="size-6" />
                        </div>

                        <DialogTitle>Hapus fasilitas?</DialogTitle>

                        <DialogDescription>
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            {deleteTarget &&
                                ` (${
                                    facilityTypeLabels[deleteTarget.type] ??
                                    deleteTarget.type
                                })`}{' '}
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