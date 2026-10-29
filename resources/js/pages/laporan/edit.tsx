import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Info, Save } from "lucide-react";
import {
    useEffect,
    useState,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from "react";

import { StatusBadge } from "@/components/report/badges";
import ReportForm, {
    type ReportFormData,
} from "@/components/report/report-form";
import StatusPanel from "@/components/report/status-panel";
import type { AreaOption, DisasterType, ReportPhoto } from "@/lib/report";

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
    occurred_at: string | null;
    photos: ReportPhoto[];
};

type Props = {
    report: Report;
    types: DisasterType[];
    areas: AreaOption[];
    can?: { update_status?: boolean };
};

function Reveal({
    children,
    delay = 0,
    className = "",
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), ms);
        return () => clearTimeout(t);
    }, [ms]);

    return loading;
}

function FormSkeleton() {
    return (
        <div className="space-y-5">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
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

            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
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

export default function Edit({ report, types, areas, can }: Props) {
    const loading = useFakeLoading(500);

    const form = useForm<ReportFormData>({
        disaster_type_id: String(report.disaster_type_id),
        area_id: report.area_id ? String(report.area_id) : "",
        title: report.title ?? "",
        description: report.description ?? "",
        latitude: String(report.latitude),
        longitude: String(report.longitude),
        address: report.address ?? "",
        severity: report.severity ?? "",
        occurred_at: report.occurred_at ?? "",
        photos: [],
        delete_photo_ids: [],
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        form.transform((data) => ({ ...data, _method: "put" }));

        form.post(`/laporan/${report.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={`Edit laporan ${report.code}`} />

            <div className="relative min-h-screen overflow-hidden bg-background">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-72 w-72 animate-blob bg-navy-400/10" />
                    <div className="blob top-1/3 -right-32 h-80 w-80 animate-blob-slow bg-sun-300/10" />
                    <div className="blob -bottom-32 left-1/4 h-72 w-72 animate-blob bg-forest-400/10" />
                </div>

                <div className="relative mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex animate-fade-in flex-wrap items-center gap-2 text-sm text-muted-foreground"
                    >
                        <Link
                            href="/laporan"
                            className="group inline-flex items-center gap-1.5 transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
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

                    <header className="relative animate-fade-in overflow-hidden rounded-2xl border border-border bg-card p-5 text-foreground shadow-sm md:p-6">
                        <div className="blob -top-16 -right-12 h-48 w-48 animate-blob bg-sun-400/10" />
                        <div className="blob -bottom-20 left-1/3 h-48 w-48 animate-blob-slow bg-sea-400/10" />

                        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Manajemen laporan
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                    Edit laporan
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Perbarui informasi kejadian dan simpan perubahan laporan.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={report.status} />
                                <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                                    {report.code}
                                </span>
                            </div>
                        </div>
                    </header>

                    {report.status !== "pending" && (
                        <Reveal delay={60}>
                            <div className="flex items-start gap-3 rounded-2xl border border-sun-300/60 bg-sun-50/80 p-4 text-sun-700 shadow-sm dark:border-sun-500/20 dark:bg-sun-500/10 dark:text-sun-300">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-300">
                                    <Info className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold">Laporan sudah diverifikasi</p>
                                    <p className="mt-0.5 text-sm leading-6">
                                        Perubahan yang Anda simpan akan langsung tampil
                                        di halaman publik.
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    )}

                    {can?.update_status && (
                        <Reveal delay={90}>
                            <div className="rounded-2xl border border-border bg-card shadow-sm">
                                <StatusPanel
                                    reportId={report.id}
                                    status={report.status}
                                />
                            </div>
                        </Reveal>
                    )}

                    {loading ? (
                        <FormSkeleton />
                    ) : (
                        <Reveal delay={120} className="min-w-0">
                            <div className="min-w-0">
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
                            </div>
                        </Reveal>
                    )}
                </div>
            </div>
        </>
    );
}
