import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Clock,
    ExternalLink,
    Info,
    Pencil,
    Trash2,
    TriangleAlert,
} from "lucide-react";
import {
    useEffect,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";

import FlashMessage from "@/components/flash-message";
import { SeverityBadge, StatusBadge } from "@/components/report/badges";
import {
    formatDateTime,
    statusMeta,
    type DisasterType,
    type ReportPhoto,
    type ReportUpdateItem,
} from "@/lib/report";

/* ---------- Tipe ---------- */

type Report = {
    id: number;
    code: string;
    title: string;
    description: string | null;
    location: { lat: number; lng: number; address: string | null };
    severity: string;
    status: string;
    occurred_at: string | null;
    created_at: string | null;
    type: DisasterType | null;
    area: {
        id: number;
        name: string;
        slug: string;
        parent: string | null;
    } | null;
    photos: ReportPhoto[];
    updates: ReportUpdateItem[];
};

type Props = {
    report: Report;
    is_owner: boolean;
    can: { update: boolean; delete: boolean };
};

/* ---------- Konstanta ---------- */

const FALLBACK_TYPE_COLOR = "#64748b";

/* ---------- Helper animasi & skeleton ---------- */

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

function useFakeLoading(ms = 600) {
    // Ganti dengan state asli bila perlu (mis. Inertia deferred props)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), ms);
        return () => clearTimeout(timer);
    }, [ms]);

    return loading;
}

function CardSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="skeleton mb-5 h-5 w-40" />
            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className="skeleton h-3.5"
                        style={{ width: `${100 - i * 12}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

/* ---------- Komponen UI ---------- */

function Card({
    title,
    action,
    children,
    interactive = false,
}: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
    /** true = kartu punya hover lift (untuk kartu yang clickable) */
    interactive?: boolean;
}) {
    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="h-6 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                    <h2 className="text-lg font-semibold text-foreground">
                        {title}
                    </h2>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-foreground">
                {children}
            </dd>
        </div>
    );
}

function Banner({
    tone,
    icon,
    title,
    children,
}: {
    tone: "sun" | "red";
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    const styles =
        tone === "sun"
            ? "border-sun-300/60 bg-sun-50/80 text-sun-700 dark:border-sun-500/20 dark:bg-sun-500/10 dark:text-sun-300"
            : "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";

    return (
        <div
            role="alert"
            className={`mb-6 flex animate-fade-in-up gap-3 rounded-2xl border p-4 ${styles}`}
        >
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6">{children}</p>
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function Show({ report, is_owner, can }: Props) {
    const loading = useFakeLoading(600);

    const hasCoords = report.location.lat != null && report.location.lng != null;
    const mapUrl = hasCoords
        ? `https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`
        : null;

    const typeColor = report.type?.color ?? FALLBACK_TYPE_COLOR;

    function handleDelete() {
        if (!window.confirm("Hapus laporan ini? Laporan tidak akan tampil lagi.")) {
            return;
        }
        router.delete(`/laporan/${report.id}`);
    }

    return (
        <>
            <Head title={`${report.code} - ${report.title}`} />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-72 w-72 animate-blob bg-navy-400/10 dark:bg-navy-500/10" />
                    <div className="blob top-1/3 -right-32 h-80 w-80 animate-blob-slow bg-sun-300/10 dark:bg-sun-500/10" />
                    <div className="blob -bottom-32 left-1/4 h-72 w-72 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />
                </div>

                <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
                    {/* =====================================================
                        BREADCRUMB
                    ====================================================== */}
                    <nav
                        aria-label="Breadcrumb"
                        className="mb-5 flex animate-fade-in items-center gap-2 text-sm text-muted-foreground"
                    >
                        <Link
                            href="/laporan"
                            className="group inline-flex items-center gap-1.5 transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Laporan
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className="font-medium text-foreground">
                            {report.code}
                        </span>
                    </nav>

                    <FlashMessage />

                    {/* =====================================================
                        BANNER UNTUK PEMILIK
                    ====================================================== */}
                    {is_owner && report.status === "pending" && (
                        <Banner
                            tone="sun"
                            icon={<Clock className="h-5 w-5" />}
                            title="Laporan Anda menunggu verifikasi"
                        >
                            Laporan ini baru tampil untuk publik setelah
                            diverifikasi administrator. Selama menunggu, Anda
                            masih bisa mengedit atau menghapusnya.
                        </Banner>
                    )}

                    {is_owner && report.status === "rejected" && (
                        <Banner
                            tone="red"
                            icon={<TriangleAlert className="h-5 w-5" />}
                            title="Laporan Anda ditolak"
                        >
                            Lihat riwayat perkembangan di bawah untuk
                            mengetahui alasannya.
                        </Banner>
                    )}

                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <header className="relative mb-6 animate-fade-in overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm">
                        <div className="blob -top-20 -right-16 h-56 w-56 animate-blob bg-sun-400/10 dark:bg-sun-500/10" />
                        <div className="blob -bottom-24 left-1/3 h-56 w-56 animate-blob-slow bg-sea-400/10 dark:bg-sea-500/10" />
                        <div className="blob -bottom-14 -left-10 h-44 w-44 animate-blob bg-forest-500/10 dark:bg-forest-500/10" />

                        {/* Garis warna jenis kejadian */}
                        <div
                            className="relative h-1.5 w-full"
                            style={{ backgroundColor: typeColor }}
                        />

                        <div className="relative flex flex-col justify-between gap-5 p-6 md:flex-row md:items-start md:p-8">
                            <div className="min-w-0">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
                                        {report.code}
                                    </span>
                                    <StatusBadge status={report.status} />
                                    <SeverityBadge severity={report.severity} />
                                </div>

                                <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                    {report.title}
                                </h1>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Terjadi pada{" "}
                                    {formatDateTime(report.occurred_at)}
                                </p>
                            </div>

                            {(can.update || can.delete) && (
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {can.update && (
                                        <Link
                                            href={`/laporan/${report.id}/edit`}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sun-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md dark:bg-sun-400 dark:hover:bg-sun-300"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Link>
                                    )}
                                    {can.delete && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* =================================================
                            KONTEN UTAMA
                        ================================================== */}
                        <div className="min-w-0 space-y-6 lg:col-span-2">
                            {loading ? (
                                <>
                                    <CardSkeleton lines={4} />
                                    <CardSkeleton lines={3} />
                                    <CardSkeleton lines={3} />
                                </>
                            ) : (
                                <>
                                    {/* DESKRIPSI */}
                                    <Reveal delay={0}>
                                        <Card title="Deskripsi kejadian">
                                            {report.description ? (
                                                <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
                                                    {report.description}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground/70">
                                                    Pelapor tidak menambahkan
                                                    deskripsi.
                                                </p>
                                            )}
                                        </Card>
                                    </Reveal>

                                    {/* FOTO */}
                                    {report.photos.length > 0 && (
                                        <Reveal delay={80}>
                                            <Card
                                                title={`Foto (${report.photos.length})`}
                                            >
                                                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                    {report.photos.map(
                                                        (photo, index) => (
                                                            <li key={photo.id}>
                                                                <a
                                                                    href={
                                                                        photo.url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="group block overflow-hidden rounded-xl border border-border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                                                >
                                                                    <img
                                                                        src={
                                                                            photo.url
                                                                        }
                                                                        alt={
                                                                            photo.caption ??
                                                                            `Foto laporan ${index + 1}`
                                                                        }
                                                                        loading="lazy"
                                                                        className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                                                                    />
                                                                </a>
                                                                {photo.caption && (
                                                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                                                        {
                                                                            photo.caption
                                                                        }
                                                                    </p>
                                                                )}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </Card>
                                        </Reveal>
                                    )}

                                    {/* LOKASI */}
                                    <Reveal delay={160}>
                                        <Card
                                            title="Lokasi kejadian"
                                            action={
                                                mapUrl && (
                                                    <a
                                                        href={mapUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 transition hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200"
                                                    >
                                                        Buka di Maps
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                )
                                            }
                                        >
                                            <dl className="space-y-4 rounded-xl border border-navy-100 bg-navy-50/70 p-5 dark:border-navy-500/20 dark:bg-navy-500/10">
                                                <div>
                                                    <dt className="text-xs font-medium text-muted-foreground">
                                                        Alamat
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-foreground">
                                                        {report.location
                                                            .address || "-"}
                                                    </dd>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Latitude
                                                        </dt>
                                                        <dd className="mt-1 font-mono text-sm text-foreground">
                                                            {report.location.lat.toFixed(
                                                                6,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Longitude
                                                        </dt>
                                                        <dd className="mt-1 font-mono text-sm text-foreground">
                                                            {report.location.lng.toFixed(
                                                                6,
                                                            )}
                                                        </dd>
                                                    </div>
                                                </div>
                                            </dl>
                                        </Card>
                                    </Reveal>

                                    {/* RIWAYAT */}
                                    <Reveal delay={240}>
                                        <Card title="Riwayat perkembangan">
                                            {report.updates.length === 0 ? (
                                                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-500 dark:text-navy-400" />
                                                    Belum ada pembaruan untuk
                                                    laporan ini.
                                                </p>
                                            ) : (
                                                <ol className="relative space-y-6 border-l-2 border-navy-100 pl-6 dark:border-navy-500/20">
                                                    {report.updates.map(
                                                        (update, index) => (
                                                            <li
                                                                key={update.id}
                                                                className="relative"
                                                            >
                                                                <span
                                                                    className={`absolute top-1 -left-[33px] h-3 w-3 rounded-full ring-4 ring-card ${
                                                                        index ===
                                                                        0
                                                                            ? "animate-pulse-ring bg-forest-500"
                                                                            : "bg-navy-500"
                                                                    }`}
                                                                    aria-hidden="true"
                                                                />
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-semibold text-foreground">
                                                                        {
                                                                            statusMeta(
                                                                                update.status,
                                                                            )
                                                                                .label
                                                                        }
                                                                    </span>
                                                                    <time
                                                                        dateTime={
                                                                            update.created_at ??
                                                                            undefined
                                                                        }
                                                                        className="text-xs text-muted-foreground"
                                                                    >
                                                                        {formatDateTime(
                                                                            update.created_at,
                                                                        )}
                                                                    </time>
                                                                </div>
                                                                {update.note && (
                                                                    <p className="mt-1 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                                                                        {
                                                                            update.note
                                                                        }
                                                                    </p>
                                                                )}
                                                            </li>
                                                        ),
                                                    )}
                                                </ol>
                                            )}
                                        </Card>
                                    </Reveal>
                                </>
                            )}
                        </div>

                        {/* =================================================
                            SIDEBAR
                        ================================================== */}
                        <div className="min-w-0 space-y-6">
                            {loading ? (
                                <CardSkeleton lines={6} />
                            ) : (
                                <>
                                    {/* DETAIL */}
                                    <Reveal delay={120}>
                                        <Card title="Detail laporan">
                                            <dl className="space-y-5">
                                                <Detail label="Jenis kejadian">
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="h-3 w-3 rounded-full shadow-sm"
                                                            style={{
                                                                backgroundColor:
                                                                    typeColor,
                                                            }}
                                                        />
                                                        {report.type?.name ??
                                                            "-"}
                                                    </span>
                                                </Detail>

                                                <Detail label="Wilayah">
                                                    {report.area ? (
                                                        <>
                                                            {report.area.name}
                                                            {report.area
                                                                .parent && (
                                                                <span className="block text-xs text-muted-foreground">
                                                                    {
                                                                        report
                                                                            .area
                                                                            .parent
                                                                    }
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </Detail>

                                                <Detail label="Status">
                                                    <StatusBadge
                                                        status={report.status}
                                                    />
                                                </Detail>

                                                <Detail label="Tingkat keparahan">
                                                    <SeverityBadge
                                                        severity={
                                                            report.severity
                                                        }
                                                    />
                                                </Detail>

                                                <Detail label="Waktu kejadian">
                                                    {formatDateTime(
                                                        report.occurred_at,
                                                    )}
                                                </Detail>

                                                <Detail label="Dilaporkan">
                                                    {formatDateTime(
                                                        report.created_at,
                                                    )}
                                                </Detail>
                                            </dl>
                                        </Card>
                                    </Reveal>

                                    {/* KEMBALI */}
                                    <Reveal delay={200}>
                                        <Link
                                            href="/laporan"
                                            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:shadow-md dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10"
                                        >
                                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                            Kembali ke daftar laporan
                                        </Link>
                                    </Reveal>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}