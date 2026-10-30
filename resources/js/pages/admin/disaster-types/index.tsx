import { Head, Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    CheckCircle2,
    CircleSlash,
    FileText,
    Layers,
    Pencil,
    Plus,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

/* ---------- Tipe ---------- */

type DisasterTypeRow = {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_active: boolean;
    reports_count: number;
};

type Props = {
    types: DisasterTypeRow[];
};

type SharedProps = {
    errors?: Record<string, string>;
    flash?: { success?: string };
};

type StatusFilter = 'all' | 'active' | 'inactive';

/* ---------- Konstanta ---------- */

const FOCUS_RING =
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'inactive', label: 'Nonaktif' },
];

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

function ReportsBadge({ count, long }: { count: number; long?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
            <FileText className="size-3.5" />
            {count}
            {long ? ' laporan' : ''}
        </span>
    );
}

function ColorSwatch({ color, size }: { color: string; size: string }) {
    return (
        <span
            aria-hidden
            className={`${size} shrink-0 rounded-xl shadow-sm ring-2 ring-card`}
            style={{ backgroundColor: color }}
        />
    );
}

function ActionButtons({
    type,
    onDelete,
}: {
    type: DisasterTypeRow;
    onDelete: (type: DisasterTypeRow) => void;
}) {
    return (
        <div className="flex justify-end gap-2">
            <Link
                href={`/admin/disaster-types/${type.id}/edit`}
                aria-label={`Edit ${type.name}`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-400 ${FOCUS_RING}`}
            >
                <Pencil className="size-3.5" />
                Edit
            </Link>

            <button
                type="button"
                onClick={() => onDelete(type)}
                aria-label={`Hapus ${type.name}`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300 ${FOCUS_RING}`}
            >
                <Trash2 className="size-3.5" />
                Hapus
            </button>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function DisasterTypeIndex({ types }: Props) {
    const { errors, flash } = usePage<SharedProps>().props;

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<StatusFilter>('all');

    const stats = useMemo(() => {
        const active = types.filter((t) => t.is_active).length;

        return {
            total: types.length,
            active,
            inactive: types.length - active,
            reports: types.reduce((sum, t) => sum + t.reports_count, 0),
        };
    }, [types]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return types.filter((t) => {
            if (filter === 'active' && !t.is_active) {
                return false;
            }

            if (filter === 'inactive' && t.is_active) {
                return false;
            }

            return (
                q === '' ||
                t.name.toLowerCase().includes(q) ||
                t.slug.toLowerCase().includes(q)
            );
        });
    }, [types, search, filter]);

    const remove = (type: DisasterTypeRow) => {
        if (!confirm(`Hapus jenis bencana "${type.name}"?`)) {
            return;
        }

        router.delete(`/admin/disaster-types/${type.id}`, {
            preserveScroll: true,
        });
    };

    const isFiltering = search.trim() !== '' || filter !== 'all';

    return (
        <>
            <Head title="Jenis Bencana" />

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
                                    <Tags className="size-7" />
                                </span>

                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-navy-600 uppercase dark:text-navy-400">
                                        Master Data
                                    </p>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                        Jenis Bencana
                                    </h1>
                                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                        Kelola jenis kejadian yang bisa dipilih
                                        warga dan petugas saat membuat laporan.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/admin/disaster-types/create"
                                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md dark:bg-sun-400 dark:hover:bg-sun-300 ${FOCUS_RING}`}
                            >
                                <Plus className="size-4" />
                                Tambah Jenis
                            </Link>
                        </div>
                    </section>

                    {/* =====================================================
                        NOTIFIKASI
                    ====================================================== */}
                    {flash?.success && (
                        <div
                            role="status"
                            className="flex animate-fade-in-up items-center gap-3 rounded-2xl border border-forest-400/40 bg-forest-50 p-4 text-sm text-forest-800 dark:border-forest-500/20 dark:bg-forest-500/10 dark:text-forest-400"
                        >
                            <CheckCircle2 className="size-5 shrink-0" />
                            {flash.success}
                        </div>
                    )}

                    {errors?.delete && (
                        <div
                            role="alert"
                            className="flex animate-fade-in-up items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                        >
                            <CircleSlash className="size-5 shrink-0" />
                            {errors.delete}
                        </div>
                    )}

                    {/* =====================================================
                        STATISTIK
                    ====================================================== */}
                    <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Total Jenis"
                            value={stats.total}
                            description="Jenis terdaftar"
                            icon={Layers}
                            toneClass="bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400"
                            delay={0}
                        />
                        <StatCard
                            label="Aktif"
                            value={stats.active}
                            description="Bisa dipilih pada laporan"
                            icon={CheckCircle2}
                            toneClass="bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400"
                            valueClass="text-forest-600 dark:text-forest-400"
                            delay={70}
                        />
                        <StatCard
                            label="Nonaktif"
                            value={stats.inactive}
                            description="Disembunyikan dari pilihan"
                            icon={CircleSlash}
                            toneClass="bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300"
                            valueClass="text-sun-600 dark:text-sun-400"
                            delay={140}
                        />
                        <StatCard
                            label="Total Laporan"
                            value={stats.reports}
                            description="Seluruh jenis bencana"
                            icon={FileText}
                            toneClass="bg-sea-300/30 text-sea-500 dark:bg-sea-500/15 dark:text-sea-300"
                            valueClass="text-sea-500 dark:text-sea-300"
                            delay={210}
                        />
                    </section>

                    {/* =====================================================
                        DAFTAR JENIS
                    ====================================================== */}
                    <section className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:260ms]">
                        {/* Toolbar */}
                        <div className="flex flex-col gap-4 border-b border-border p-4 md:p-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Daftar Jenis
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Menampilkan {filtered.length} dari{' '}
                                        {types.length} jenis
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                                <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari nama atau slug..."
                                        aria-label="Cari jenis bencana"
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
                                    aria-label="Filter status jenis bencana"
                                    className="flex overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
                                >
                                    {FILTERS.map((f) => {
                                        const active = filter === f.key;

                                        return (
                                            <button
                                                key={f.key}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() => setFilter(f.key)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${FOCUS_RING} ${
                                                    active
                                                        ? 'bg-card text-navy-600 shadow-sm dark:text-navy-400'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Konten */}
                        {filtered.length === 0 ? (
                            <div className="flex animate-fade-in flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="flex size-16 animate-float items-center justify-center rounded-2xl bg-sun-100 text-sun-600 ring-1 ring-sun-300/50 dark:bg-sun-500/15 dark:text-sun-300 dark:ring-sun-500/20">
                                    <Tags className="size-8" />
                                </div>

                                <h3 className="mt-4 text-sm font-semibold text-foreground">
                                    {isFiltering
                                        ? 'Jenis tidak ditemukan'
                                        : 'Belum ada jenis bencana'}
                                </h3>

                                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                                    {isFiltering
                                        ? 'Coba ubah kata kunci atau filter status.'
                                        : 'Tambahkan jenis pertama agar bisa dipilih pada laporan.'}
                                </p>

                                {!isFiltering && (
                                    <Link
                                        href="/admin/disaster-types/create"
                                        className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${FOCUS_RING}`}
                                    >
                                        <Plus className="size-4" />
                                        Tambah Jenis
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobile: kartu */}
                                <ul className="divide-y divide-border md:hidden">
                                    {filtered.map((type) => (
                                        <li
                                            key={type.id}
                                            className="group p-4 transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-500/10"
                                        >
                                            <div className="flex items-start gap-3">
                                                <ColorSwatch
                                                    color={type.color}
                                                    size="size-10"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {type.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {type.slug}
                                                    </p>
                                                </div>

                                                <StatusBadge
                                                    active={type.is_active}
                                                />
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <ReportsBadge
                                                    count={type.reports_count}
                                                    long
                                                />
                                                <span className="font-mono uppercase">
                                                    {type.color}
                                                </span>
                                            </div>

                                            <div className="mt-3">
                                                <ActionButtons
                                                    type={type}
                                                    onDelete={remove}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table
                                        className="w-full text-left text-sm"
                                        aria-label="Daftar jenis bencana"
                                    >
                                        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Jenis
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Slug
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Laporan
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
                                            {filtered.map((type) => (
                                                <tr
                                                    key={type.id}
                                                    className="group transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-500/10"
                                                >
                                                    <td className="relative px-5 py-4">
                                                        <span
                                                            aria-hidden
                                                            className="absolute inset-y-2 left-0 w-1 rounded-r-full"
                                                            style={{
                                                                backgroundColor:
                                                                    type.color,
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-3">
                                                            <ColorSwatch
                                                                color={
                                                                    type.color
                                                                }
                                                                size="size-9"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-foreground">
                                                                    {type.name}
                                                                </p>
                                                                <p className="font-mono text-[11px] text-muted-foreground uppercase">
                                                                    {type.color}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                            {type.slug}
                                                        </code>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <ReportsBadge
                                                            count={
                                                                type.reports_count
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            active={
                                                                type.is_active
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <ActionButtons
                                                            type={type}
                                                            onDelete={remove}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

DisasterTypeIndex.layout = {
    breadcrumbs: [{ title: 'Jenis Bencana', href: '/admin/disaster-types' }],
};