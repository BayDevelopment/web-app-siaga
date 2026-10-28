import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Info, Save } from 'lucide-react';
import {
    useEffect,
    useState,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from 'react';

import { StatusBadge } from '@/components/report/badges';
import ReportForm, {
    type ReportFormData,
} from '@/components/report/report-form';
import type {
    AreaOption,
    DisasterType,
    ReportPhoto,
} from '@/lib/report';

type Report = {
    id: number;
    code: string;
    disaster_type_id: number;
    area_id: number | null;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    severity: string;
    status: string;
    occurred_at: string | null; // sudah berformat datetime-local dari server
    photos: ReportPhoto[];
};

type Props = {
    report: Report;
    types: DisasterType[];
    areas: AreaOption[];
};

/* ---------- Helper animasi & skeleton ---------- */

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

function useFakeLoading(ms = 500) {
    // State form tetap ada di useForm milik halaman ini,
    // jadi aman jika ReportForm baru ditampilkan setelah skeleton.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), ms);
        return () => clearTimeout(t);
    }, [ms]);

    return loading;
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="skeleton h-5 w-44" />

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-11 w-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-11 w-full" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="skeleton h-3.5 w-28" />
                    <div className="skeleton h-11 w-full" />
                </div>

                <div className="space-y-2">
                    <div className="skeleton h-3.5 w-20" />
                    <div className="skeleton h-28 w-full" />
                </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-48 w-full" />
            </div>

            <div className="flex justify-end gap-3">
                <div className="skeleton h-11 w-24" />
                <div className="skeleton h-11 w-40" />
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function Edit({ report, types, areas }: Props) {
    const loading = useFakeLoading(500);

    const form = useForm<ReportFormData>({
        disaster_type_id: String(report.disaster_type_id),
        area_id: report.area_id ? String(report.area_id) : '',
        title: report.title ?? '',
        description: report.description ?? '',
        latitude: String(report.latitude),
        longitude: String(report.longitude),
        address: report.address ?? '',
        severity: report.severity ?? '',
        occurred_at: report.occurred_at ?? '',
        photos: [],
        delete_photo_ids: [],
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        // PUT dengan file tidak terbaca PHP, jadi dikirim sebagai POST
        // dengan _method=put (route-nya tetap Route::put).
        form.transform((data) => ({ ...data, _method: 'put' }));

        form.post(`/laporan/${report.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={`Edit laporan ${report.code}`} />

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

                <div className="relative mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex animate-fade-in flex-wrap items-center gap-2 text-sm text-muted-foreground"
                    >
                        <Link
                            href="/laporan"
                            className="group inline-flex items-center gap-1.5 transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Laporan
                        </Link>
                        <span aria-hidden="true">/</span>
                        <Link
                            href={`/laporan/${report.id}`}
                            className="transition hover:text-foreground"
                        >
                            {report.code}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className="font-medium text-foreground">
                            Edit
                        </span>
                    </nav>

                    {/* Header */}
                    <header className="relative animate-fade-in overflow-hidden rounded-3xl bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 p-5 text-white shadow-xl shadow-navy-900/20 md:p-6">
                        <div className="blob -top-16 -right-12 h-56 w-56 animate-blob bg-sun-400/30" />
                        <div className="blob -bottom-20 left-1/3 h-56 w-56 animate-blob-slow bg-sea-400/25" />
                        <div className="blob -bottom-12 -left-8 h-44 w-44 animate-blob bg-forest-500/25" />

                        <div className="relative flex flex-wrap items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                                Edit laporan
                            </h1>
                            <StatusBadge status={report.status} />
                            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-navy-50 backdrop-blur">
                                {report.code}
                            </span>
                        </div>
                    </header>

                    {report.status !== 'pending' && (
                        <Reveal delay={60}>
                            <div className="flex gap-3 rounded-2xl border border-sun-300/60 bg-sun-50 p-4 text-sun-600 dark:border-sun-500/20 dark:bg-sun-500/10 dark:text-sun-300">
                                <Info className="mt-0.5 h-5 w-5 shrink-0" />
                                <p className="text-sm leading-6">
                                    Laporan ini sudah diverifikasi. Perubahan
                                    yang Anda simpan langsung tampil di halaman
                                    publik.
                                </p>
                            </div>
                        </Reveal>
                    )}

                    {loading ? (
                        <FormSkeleton />
                    ) : (
                        <Reveal delay={120}>
                            <ReportForm
                                form={form}
                                types={types}
                                areas={areas}
                                existingPhotos={report.photos}
                                onSubmit={submit}
                                cancelHref={`/laporan/${report.id}`}
                                submitLabel="Simpan perubahan"
                                submitIcon={<Save className="h-4 w-4" />}
                            />
                        </Reveal>
                    )}
                </div>
            </div>
        </>
    );
}