import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type DisasterType = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    slug: string;
};

type Report = {
    id: number;
    code: string;
    title: string;
    description: string | null;

    location: {
        lat: number;
        lng: number;
        address: string | null;
    };

    severity: 'low' | 'medium' | 'high' | 'critical' | string;
    status: 'pending' | 'verified' | 'active' | 'resolved' | 'rejected' | string;

    occurred_at: string | null;

    type: DisasterType | null;
    area: Area | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedReports = {
    data: Report[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Props = {
    reports: PaginatedReports;
    types: DisasterType[];
};

const statusLabels: Record<string, string> = {
    pending: 'Menunggu Verifikasi',
    verified: 'Terverifikasi',
    active: 'Aktif',
    resolved: 'Selesai',
    rejected: 'Ditolak',
};

const severityLabels: Record<string, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    critical: 'Kritis',
};

const statusClasses: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    verified: 'bg-blue-50 text-blue-700 ring-blue-200',
    active: 'bg-red-50 text-red-700 ring-red-200',
    resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const severityClasses: Record<string, string> = {
    low: 'text-emerald-600',
    medium: 'text-amber-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
};

function formatDate(date: string | null) {
    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

function getStatusLabel(status: string) {
    return statusLabels[status] ?? status;
}

function getSeverityLabel(severity: string) {
    return severityLabels[severity] ?? severity;
}

export default function Index({ reports, types }: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');

    const filteredReports = useMemo(() => {
        return reports.data.filter((report) => {
            const keyword = search.toLowerCase().trim();

            const matchesSearch =
                keyword === '' ||
                report.title.toLowerCase().includes(keyword) ||
                report.code.toLowerCase().includes(keyword) ||
                (report.description ?? '').toLowerCase().includes(keyword) ||
                (report.area?.name ?? '').toLowerCase().includes(keyword) ||
                (report.location.address ?? '').toLowerCase().includes(keyword);

            const matchesType =
                typeFilter === 'all' ||
                report.type?.slug === typeFilter;

            const matchesStatus =
                statusFilter === 'all' ||
                report.status === statusFilter;

            const matchesSeverity =
                severityFilter === 'all' ||
                report.severity === severityFilter;

            return (
                matchesSearch &&
                matchesType &&
                matchesStatus &&
                matchesSeverity
            );
        });
    }, [
        reports.data,
        search,
        typeFilter,
        statusFilter,
        severityFilter,
    ]);

    return (
        <>
            <Head title="Laporan Kejadian" />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <Link
                                    href="/"
                                    className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                >
                                    ← Kembali ke Peta
                                </Link>

                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Laporan Kejadian
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Pantau laporan kejadian dan kondisi darurat
                                    di wilayah SIAGA-W.
                                </p>
                            </div>

                            <Link
                                href="/laporan/create"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <span className="text-lg leading-none">+</span>
                                Buat Laporan
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Summary */}
                    <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <SummaryCard
                            label="Total Laporan"
                            value={reports.total}
                            icon="▣"
                        />

                        <SummaryCard
                            label="Ditampilkan"
                            value={filteredReports.length}
                            icon="◉"
                        />

                        <SummaryCard
                            label="Laporan Aktif"
                            value={
                                reports.data.filter(
                                    (report) => report.status === 'active',
                                ).length
                            }
                            icon="!"
                            danger
                        />

                        <SummaryCard
                            label="Terverifikasi"
                            value={
                                reports.data.filter(
                                    (report) => report.status === 'verified',
                                ).length
                            }
                            icon="✓"
                        />
                    </section>

                    {/* Filter */}
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
                            {/* Search */}
                            <div className="relative">
                                <label
                                    htmlFor="search"
                                    className="sr-only"
                                >
                                    Cari laporan
                                </label>

                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔎
                                </span>

                                <input
                                    id="search"
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari laporan, lokasi, atau kode..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            {/* Type */}
                            <select
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(event.target.value)
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                            >
                                <option value="all">
                                    Semua Jenis Kejadian
                                </option>

                                {types.map((type) => (
                                    <option
                                        key={type.id}
                                        value={type.slug}
                                    >
                                        {type.name}
                                    </option>
                                ))}
                            </select>

                            {/* Status */}
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">
                                    Menunggu Verifikasi
                                </option>
                                <option value="verified">
                                    Terverifikasi
                                </option>
                                <option value="active">Aktif</option>
                                <option value="resolved">Selesai</option>
                                <option value="rejected">Ditolak</option>
                            </select>

                            {/* Severity */}
                            <select
                                value={severityFilter}
                                onChange={(event) =>
                                    setSeverityFilter(event.target.value)
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                            >
                                <option value="all">
                                    Semua Tingkat Keparahan
                                </option>
                                <option value="low">Rendah</option>
                                <option value="medium">Sedang</option>
                                <option value="high">Tinggi</option>
                                <option value="critical">Kritis</option>
                            </select>
                        </div>
                    </section>

                    {/* Result info */}
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Daftar Kejadian
                            </h2>

                            <p className="text-sm text-slate-500">
                                {filteredReports.length} laporan ditemukan
                            </p>
                        </div>

                        {(search ||
                            typeFilter !== 'all' ||
                            statusFilter !== 'all' ||
                            severityFilter !== 'all') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setTypeFilter('all');
                                    setStatusFilter('all');
                                    setSeverityFilter('all');
                                }}
                                className="text-left text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:text-right"
                            >
                                Reset filter
                            </button>
                        )}
                    </div>

                    {/* Reports */}
                    {filteredReports.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {filteredReports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            hasFilter={
                                search !== '' ||
                                typeFilter !== 'all' ||
                                statusFilter !== 'all' ||
                                severityFilter !== 'all'
                            }
                        />
                    )}

                    {/* Pagination */}
                    {reports.last_page > 1 && (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                            {reports.links.map((link, index) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={index}
                                            className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={[
                                            'rounded-lg border px-3 py-2 text-sm font-medium transition',
                                            link.active
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                                        ].join(' ')}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    danger = false,
}: {
    label: string;
    value: number;
    icon: string;
    danger?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {label}
                    </p>

                    <p
                        className={[
                            'mt-1 text-2xl font-bold',
                            danger ? 'text-red-600' : 'text-slate-900',
                        ].join(' ')}
                    >
                        {value}
                    </p>
                </div>

                <div
                    className={[
                        'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold',
                        danger
                            ? 'bg-red-50 text-red-600'
                            : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ReportCard({ report }: { report: Report }) {
    const typeColor = report.type?.color ?? '#64748b';

    const statusClass =
        statusClasses[report.status] ??
        'bg-slate-100 text-slate-600 ring-slate-200';

    const severityClass =
        severityClasses[report.severity] ?? 'text-slate-600';

    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {/* Type indicator */}
            <div
                className="h-1.5 w-full"
                style={{ backgroundColor: typeColor }}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <div
                            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{
                                backgroundColor: typeColor,
                            }}
                        >
                            !
                        </div>

                        <div className="min-w-0">
                            <p
                                className="text-xs font-semibold uppercase tracking-wide"
                                style={{ color: typeColor }}
                            >
                                {report.type?.name ?? 'Tidak diketahui'}
                            </p>

                            <h3 className="mt-0.5 line-clamp-2 font-semibold text-slate-900">
                                {report.title}
                            </h3>
                        </div>
                    </div>

                    <span
                        className={[
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                            statusClass,
                        ].join(' ')}
                    >
                        {getStatusLabel(report.status)}
                    </span>
                </div>

                {/* Description */}
                {report.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                        {report.description}
                    </p>
                )}

                {/* Information */}
                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-5 shrink-0 text-center">📍</span>

                        <span className="line-clamp-2">
                            {report.location.address ??
                                report.area?.name ??
                                'Lokasi tidak tersedia'}
                        </span>
                    </div>

                    {report.area && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-5 shrink-0 text-center">
                                ◉
                            </span>

                            <span>{report.area.name}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="w-5 text-center">◷</span>

                            <span>
                                {formatDate(report.occurred_at)}
                            </span>
                        </div>

                        <span
                            className={[
                                'text-xs font-semibold',
                                severityClass,
                            ].join(' ')}
                        >
                            {getSeverityLabel(report.severity)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                        {report.code}
                    </span>

                    <Link
                        href={`/laporan/${report.id}`}
                        className="text-sm font-semibold text-slate-700 transition group-hover:text-slate-900"
                    >
                        Lihat Detail →
                    </Link>
                </div>
            </div>
        </article>
    );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                {hasFilter ? '🔎' : '📋'}
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
                {hasFilter
                    ? 'Laporan tidak ditemukan'
                    : 'Belum ada laporan'}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                {hasFilter
                    ? 'Coba ubah kata pencarian atau filter yang digunakan.'
                    : 'Belum terdapat laporan kejadian yang dapat ditampilkan.'}
            </p>

            {hasFilter && (
                <p className="mt-4 text-sm text-slate-400">
                    Silakan reset filter untuk melihat seluruh laporan.
                </p>
            )}
        </div>
    );
}