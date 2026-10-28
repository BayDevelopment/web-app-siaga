import { Head, Link } from '@inertiajs/react';

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

    severity: string;
    status: string;
    occurred_at: string | null;

    type: DisasterType | null;
    area: Area | null;

    created_at?: string | null;
    updated_at?: string | null;
};

type Props = {
    report: Report;
};

const severityConfig: Record<
    string,
    {
        label: string;
        className: string;
    }
> = {
    low: {
        label: 'Rendah',
        className: 'bg-emerald-100 text-emerald-700',
    },
    medium: {
        label: 'Sedang',
        className: 'bg-yellow-100 text-yellow-700',
    },
    high: {
        label: 'Tinggi',
        className: 'bg-orange-100 text-orange-700',
    },
    critical: {
        label: 'Kritis',
        className: 'bg-red-100 text-red-700',
    },
};

const statusConfig: Record<
    string,
    {
        label: string;
        className: string;
    }
> = {
    pending: {
        label: 'Menunggu Verifikasi',
        className: 'bg-yellow-100 text-yellow-700',
    },
    verified: {
        label: 'Terverifikasi',
        className: 'bg-blue-100 text-blue-700',
    },
    active: {
        label: 'Aktif',
        className: 'bg-red-100 text-red-700',
    },
    resolved: {
        label: 'Selesai',
        className: 'bg-emerald-100 text-emerald-700',
    },
    rejected: {
        label: 'Ditolak',
        className: 'bg-slate-100 text-slate-600',
    },
};

export default function Show({ report }: Props) {
    const severity =
        severityConfig[report.severity] ?? {
            label: report.severity,
            className: 'bg-slate-100 text-slate-600',
        };

    const status =
        statusConfig[report.status] ?? {
            label: report.status,
            className: 'bg-slate-100 text-slate-600',
        };

    const formatDate = (date: string | null) => {
        if (!date) return '-';

        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const mapUrl =
        report.location?.lat && report.location?.lng
            ? `https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`
            : '#';

    return (
        <>
            <Head title={`${report.code} - ${report.title}`} />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                        <Link
                            href="/laporan"
                            className="transition hover:text-blue-600"
                        >
                            Laporan
                        </Link>

                        <span>/</span>

                        <span className="text-slate-700">
                            {report.code}
                        </span>
                    </div>

                    {/* Header */}
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                            <div>
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {report.code}
                                    </span>

                                    <span
                                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${status.className}`}
                                    >
                                        {status.label}
                                    </span>

                                    <span
                                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${severity.className}`}
                                    >
                                        {severity.label}
                                    </span>
                                </div>

                                <h1 className="text-2xl font-bold text-slate-900">
                                    {report.title}
                                </h1>

                                <p className="mt-2 text-sm text-slate-500">
                                    Dilaporkan pada {formatDate(report.occurred_at)}
                                </p>
                            </div>

                            <Link
                                href={`/laporan/${report.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                ✏️ Edit Laporan
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* Main */}
                        <div className="space-y-6 lg:col-span-2">

                            {/* Deskripsi */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                    Deskripsi Kejadian
                                </h2>

                                {report.description ? (
                                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                                        {report.description}
                                    </p>
                                ) : (
                                    <p className="text-sm italic text-slate-400">
                                        Tidak ada deskripsi kejadian.
                                    </p>
                                )}
                            </div>

                            {/* Lokasi */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Lokasi Kejadian
                                    </h2>

                                    {report.location?.lat &&
                                        report.location?.lng && (
                                            <a
                                                href={mapUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                Buka di Maps →
                                            </a>
                                        )}
                                </div>

                                <div className="rounded-xl bg-slate-100 p-5">
                                    <div className="mb-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Alamat
                                        </p>

                                        <p className="mt-1 text-sm text-slate-700">
                                            {report.location?.address || '-'}
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Latitude
                                            </p>

                                            <p className="mt-1 font-mono text-sm text-slate-700">
                                                {report.location?.lat ?? '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Longitude
                                            </p>

                                            <p className="mt-1 font-mono text-sm text-slate-700">
                                                {report.location?.lng ?? '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Placeholder map */}
                                <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                                    <div className="text-center">
                                        <div className="mb-2 text-3xl">📍</div>

                                        <p className="text-sm font-medium text-slate-700">
                                            Lokasi Kejadian
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Peta dapat diintegrasikan dengan
                                            Leaflet pada tahap berikutnya.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">

                            {/* Detail */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-5 text-lg font-semibold text-slate-900">
                                    Detail Laporan
                                </h2>

                                <div className="space-y-5">

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Jenis Kejadian
                                        </p>

                                        <div className="mt-2 flex items-center gap-2">
                                            <span
                                                className="h-3 w-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        report.type?.color ??
                                                        '#64748b',
                                                }}
                                            />

                                            <span className="text-sm font-medium text-slate-700">
                                                {report.type?.name ?? '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Wilayah
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {report.area?.name ?? '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Status
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Tingkat Keparahan
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${severity.className}`}
                                        >
                                            {severity.label}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Waktu Kejadian
                                        </p>

                                        <p className="mt-1 text-sm text-slate-700">
                                            {formatDate(report.occurred_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <Link
                                    href="/laporan"
                                    className="flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    ← Kembali ke Laporan
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}