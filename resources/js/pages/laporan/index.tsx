import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    ClipboardList,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    Siren,
    User,
} from 'lucide-react';
import {
    useEffect,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';

import FlashMessage from '@/components/flash-message';
import { SeverityBadge, StatusBadge } from '@/components/report/badges';
import {
    ALL_STATUSES,
    PUBLIC_STATUSES,
    SEVERITY_META,
    SEVERITY_ORDER,
    STATUS_META,
    formatDateTime,
    type DisasterType,
} from '@/lib/report';

type Tone = 'navy' | 'sea' | 'sun' | 'forest';

type ReportItem = {
    id: number;
    code: string;
    title: string;
    description: string | null;
    location: { lat: number; lng: number; address: string | null };
    severity: string;
    status: string;
    occurred_at: string | null;
    is_mine: boolean;
    type: DisasterType | null;
    area: { id: number; name: string; slug: string } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Paginated<T> = {
    data: T[];
    total: number;
    last_page: number;
    links: PaginationLink[];
};

type Filters = {
    search: string;
    type: string;
    area: string;
    status: string;
    severity: string;
    mine: boolean;
};

type AreaOption = {
    id: number;
    name: string;
    slug: string;
    label: string;
};

type Contact = {
    id: number;
    name: string;
    role: string | null;
    phone: string;
};

type Props = {
    reports: Paginated<ReportItem>;
    filters: Filters;
    stats: { total: number; verified: number; handling: number };
    types: DisasterType[];
    areas?: AreaOption[];
    contacts?: Contact[];
    can: { create: boolean; mine: boolean; see_all: boolean };
};

/* Warna ikon mengikuti palet logo */
const toneClass: Record<Tone, string> = {
    navy: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
    sea: 'bg-sea-300/30 text-sea-500 dark:bg-sea-500/15 dark:text-sea-300',
    sun: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
    forest: 'bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400',
};

const controlClass =
    'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20';

/* ---------- Helper animasi & skeleton ---------- */

function Reveal({
    children,
    delay = 0,
    className = '',
    fill = true,
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
    fill?: boolean;
}) {
    return (
        <div
            className={`${fill ? 'h-full' : ''} animate-fade-in-up ${className}`}
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

/** Skeleton tampil sebentar saat halaman dibuka, dan setiap kali Inertia berpindah/filter. */
function useLoading(initialMs = 600) {
    const [initial, setInitial] = useState(true);
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setInitial(false), initialMs);
        const offStart = router.on('start', () => setNavigating(true));
        const offFinish = router.on('finish', () => setNavigating(false));

        return () => {
            clearTimeout(t);
            offStart();
            offFinish();
        };
    }, [initialMs]);

    return initial || navigating;
}

function SummarySkeleton() {
    return (
        <div className="h-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-7 w-12" />
                </div>
                <div className="skeleton hidden size-10 rounded-xl sm:block" />
            </div>
        </div>
    );
}

function ReportCardSkeleton() {
    return (
        <div className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="skeleton h-1.5 w-full rounded-none" />

            <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-5 w-3/4" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-5 w-20 rounded-full" />
                        <div className="skeleton h-5 w-16 rounded-full" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                    <div className="skeleton h-3.5 w-2/3" />
                    <div className="skeleton h-3.5 w-1/3" />
                </div>
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function Index({
    reports,
    filters,
    stats,
    types,
    areas = [],
    contacts = [],
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const loading = useLoading(600);

    // Pencarian ditunda 300ms supaya tidak request di setiap ketikan.
    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timer = setTimeout(() => visit({ search }), 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function visit(patch: Partial<Filters>) {
        const next = { ...filters, ...patch };
        const query: Record<string, string> = {};

        if (next.search) query.search = next.search;
        if (next.type) query.type = next.type;
        if (next.area) query.area = next.area;
        if (next.status) query.status = next.status;
        if (next.severity) query.severity = next.severity;
        if (next.mine) query.mine = '1';

        router.get('/laporan', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function reset() {
        setSearch('');
        router.get('/laporan', {}, { preserveScroll: true, replace: true });
    }

    const hasFilter = Boolean(
        filters.search ||
            filters.type ||
            filters.area ||
            filters.status ||
            filters.severity ||
            filters.mine,
    );

    // Pengunjung umum hanya melihat laporan publik; staf atau "laporan saya"
    // bisa memfilter semua status.
    const statusOptions =
        can.see_all || filters.mine ? ALL_STATUSES : PUBLIC_STATUSES;

    return (
        <>
            <Head title="Laporan kejadian" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/20" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/20" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/15" />
                </div>

                <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
                    {/* HEADER */}
                    <header className="relative animate-fade-in overflow-hidden rounded-3xl bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 p-6 text-white shadow-xl shadow-navy-900/20 md:p-8">
                        <div className="blob -top-20 -right-16 h-64 w-64 animate-blob bg-sun-400/30" />
                        <div className="blob -bottom-24 left-1/3 h-64 w-64 animate-blob-slow bg-sea-400/25" />
                        <div className="blob -bottom-14 -left-10 h-48 w-48 animate-blob bg-forest-500/25" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <Link
                                    href="/"
                                    className="group mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy-200 transition hover:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    Kembali ke peta
                                </Link>

                                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                    Laporan kejadian
                                </h1>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-navy-100/80">
                                    Lihat kejadian yang dilaporkan warga di
                                    sekitar Anda. Menemukan kejadian? Laporkan
                                    tanpa perlu membuat akun.
                                </p>
                            </div>

                            {/* Warga dan guest sama-sama bisa melapor tanpa login */}
                            <div className="flex shrink-0 flex-col gap-2">
                                <Link
                                    href="/laporan/create"
                                    className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-sun-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sun-500/40"
                                >
                                    <Siren className="h-4 w-4" />
                                    Laporkan kejadian
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>

                                <Link
                                    href="/laporan/lacak"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
                                >
                                    <Search className="h-4 w-4" />
                                    Cek status laporan
                                </Link>
                            </div>
                        </div>
                    </header>

                    <FlashMessage />

                    {/* Kontak darurat */}
                    {contacts.length > 0 && (
                        <section
                            aria-label="Kontak darurat"
                            className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
                        >
                            <span className="mr-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                                    <Phone className="h-3.5 w-3.5" />
                                </span>
                                Keadaan darurat?
                            </span>

                            {contacts.map((contact) => (
                                <a
                                    key={contact.id}
                                    href={`tel:${contact.phone}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-navy-200 hover:bg-navy-50 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10"
                                >
                                    <span className="font-medium text-foreground">
                                        {contact.name}
                                    </span>
                                    <span className="font-semibold text-navy-600 dark:text-navy-400">
                                        {contact.phone}
                                    </span>
                                </a>
                            ))}
                        </section>
                    )}

                    {/* Ringkasan (dihitung server sesuai hak akses) */}
                    <section className="grid grid-cols-3 gap-2 sm:gap-3">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <SummarySkeleton key={i} />
                            ))
                        ) : (
                            <>
                                <Reveal delay={0}>
                                    <SummaryCard
                                        label="Total laporan"
                                        value={stats.total}
                                        icon={
                                            <ClipboardList className="h-4 w-4" />
                                        }
                                        tone="navy"
                                    />
                                </Reveal>
                                <Reveal delay={80}>
                                    <SummaryCard
                                        label="Sedang ditangani"
                                        value={stats.handling}
                                        icon={<Siren className="h-4 w-4" />}
                                        tone="sun"
                                    />
                                </Reveal>
                                <Reveal delay={160}>
                                    <SummaryCard
                                        label="Terverifikasi"
                                        value={stats.verified}
                                        icon={
                                            <ShieldCheck className="h-4 w-4" />
                                        }
                                        tone="forest"
                                    />
                                </Reveal>
                            </>
                        )}
                    </section>

                    {/* Filter */}
                    <Reveal delay={100} fill={false}>
                        <section
                            aria-label="Filter laporan"
                            className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                        >
                            <div className="relative">
                                <label htmlFor="search" className="sr-only">
                                    Cari laporan
                                </label>

                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    id="search"
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari judul, kode, atau alamat"
                                    className={`${controlClass} pl-10`}
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <select
                                    aria-label="Jenis kejadian"
                                    value={filters.type}
                                    onChange={(e) =>
                                        visit({ type: e.target.value })
                                    }
                                    disabled={types.length === 0}
                                    className={`${controlClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                    <option value="">
                                        {types.length === 0
                                            ? 'Belum ada jenis'
                                            : 'Semua jenis'}
                                    </option>
                                    {types.map((type) => (
                                        <option key={type.id} value={type.slug}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    aria-label="Wilayah"
                                    value={filters.area}
                                    onChange={(e) =>
                                        visit({ area: e.target.value })
                                    }
                                    disabled={areas.length === 0}
                                    className={`${controlClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                    <option value="">Semua wilayah</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.slug}>
                                            {area.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    aria-label="Status"
                                    value={filters.status}
                                    onChange={(e) =>
                                        visit({ status: e.target.value })
                                    }
                                    className={controlClass}
                                >
                                    <option value="">Semua status</option>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {STATUS_META[status].label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    aria-label="Tingkat keparahan"
                                    value={filters.severity}
                                    onChange={(e) =>
                                        visit({ severity: e.target.value })
                                    }
                                    className={controlClass}
                                >
                                    <option value="">Semua tingkat</option>
                                    {SEVERITY_ORDER.map((severity) => (
                                        <option key={severity} value={severity}>
                                            {SEVERITY_META[severity].label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {can.mine && (
                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={filters.mine}
                                        onChange={(e) =>
                                            visit({ mine: e.target.checked })
                                        }
                                        className="h-4 w-4 rounded accent-primary"
                                    />
                                    Hanya laporan saya
                                </label>
                            )}
                        </section>
                    </Reveal>

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {reports.total} laporan ditemukan
                        </p>

                        {hasFilter && (
                            <button
                                type="button"
                                onClick={reset}
                                className="text-sm font-semibold text-navy-600 transition hover:text-navy-800 hover:underline dark:text-navy-400 dark:hover:text-navy-200"
                            >
                                Reset filter
                            </button>
                        )}
                    </div>

                    {/* Daftar laporan: kartu dalam satu baris sama tinggi */}
                    {loading ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <ReportCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : reports.data.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {reports.data.map((report, index) => (
                                <Reveal
                                    key={report.id}
                                    delay={Math.min(index, 8) * 60}
                                >
                                    <ReportCard report={report} />
                                </Reveal>
                            ))}
                        </div>
                    ) : (
                        <EmptyState hasFilter={hasFilter} onReset={reset} />
                    )}

                    {reports.last_page > 1 && (
                        <nav
                            aria-label="Halaman"
                            className="flex flex-wrap items-center justify-center gap-2 pt-2"
                        >
                            {reports.links.map((link, index) => {
                                const text = pageLabel(link.label);

                                if (!link.url) {
                                    return (
                                        <span
                                            key={index}
                                            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                                        >
                                            {text}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        aria-current={
                                            link.active ? 'page' : undefined
                                        }
                                        className={[
                                            'rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200',
                                            link.active
                                                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-navy-500/20'
                                                : 'border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-800 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-200',
                                        ].join(' ')}
                                    >
                                        {text}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>
            </div>
        </>
    );
}

/** Label pagination Laravel (Inggris + entitas HTML) jadi teks Indonesia. */
function pageLabel(label: string): string {
    const text = label.replace(/&laquo;|&raquo;/g, '').trim();

    if (/previous/i.test(text)) return '‹ Sebelumnya';
    if (/next/i.test(text)) return 'Berikutnya ›';

    return text;
}

function SummaryCard({
    label,
    value,
    icon,
    tone = 'navy',
}: {
    label: string;
    value: number;
    icon: ReactNode;
    tone?: Tone;
}) {
    return (
        <div className="group h-full rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 sm:p-4 dark:hover:border-navy-500/40">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                </div>

                <div
                    className={`hidden size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 sm:flex ${toneClass[tone]}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ReportCard({ report }: { report: ReportItem }) {
    const color = report.type?.color ?? '#64748b';

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 dark:hover:border-navy-500/40">
            <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p
                            className="text-sm font-semibold"
                            style={{ color }}
                        >
                            {report.type?.name ?? 'Jenis tidak diketahui'}
                        </p>

                        <h3 className="mt-0.5 line-clamp-2 font-semibold text-foreground">
                            <Link
                                href={`/laporan/${report.id}`}
                                className="hover:underline"
                            >
                                {report.title}
                            </Link>
                        </h3>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={report.status} />
                        <SeverityBadge severity={report.severity} />
                    </div>
                </div>

                {report.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {report.description}
                    </p>
                )}

                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun-500" />
                        <span className="line-clamp-2">
                            {report.location.address ??
                                report.area?.name ??
                                'Lokasi tidak tersedia'}
                        </span>
                    </li>

                    <li className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-navy-500" />
                        {formatDateTime(report.occurred_at)}
                    </li>

                    {report.is_mine && (
                        <li className="flex items-center gap-2 text-foreground">
                            <User className="h-4 w-4 shrink-0 text-forest-500" />
                            Laporan saya
                        </li>
                    )}
                </ul>

                {/* mt-auto: footer selalu menempel di bawah kartu */}
                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">
                        {report.code}
                    </span>

                    <Link
                        href={`/laporan/${report.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 transition hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200"
                    >
                        Lihat detail
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

function EmptyState({
    hasFilter,
    onReset,
}: {
    hasFilter: boolean;
    onReset: () => void;
}) {
    return (
        <div className="animate-fade-in rounded-2xl border border-dashed border-navy-200 bg-card px-6 py-16 text-center dark:border-navy-500/30">
            <div className="mx-auto flex size-14 animate-float items-center justify-center rounded-2xl bg-navy-100 text-navy-500 dark:bg-navy-500/15">
                {hasFilter ? (
                    <Search className="h-6 w-6" />
                ) : (
                    <ClipboardList className="h-6 w-6" />
                )}
            </div>

            <h3 className="mt-4 font-semibold text-foreground">
                {hasFilter ? 'Laporan tidak ditemukan' : 'Belum ada laporan'}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {hasFilter
                    ? 'Coba kata kunci lain, ganti wilayah, atau reset filter untuk melihat semua laporan.'
                    : 'Belum ada kejadian yang dilaporkan. Jika Anda melihat kejadian di sekitar Anda, laporkan agar petugas bisa menindaklanjuti.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {hasFilter && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-navy-200 hover:bg-navy-50 dark:hover:bg-navy-500/10"
                    >
                        Reset filter
                    </button>
                )}

                <Link
                    href="/laporan/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-4 py-2 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5"
                >
                    <Siren className="h-4 w-4" />
                    Laporkan kejadian
                </Link>
            </div>
        </div>
    );
}