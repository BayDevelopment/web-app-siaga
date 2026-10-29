import { Head, Link, usePage } from "@inertiajs/react";

import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    FileText,
    Flame,
    Map,
    MapPin,
    ShieldCheck,
    Siren,
    TreePine,
    Users,
    Waves,
} from "lucide-react";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { dashboard } from "@/routes";

type UserRole = "admin" | "petugas" | "warga";

type Tone = "ocean" | "sun" | "forest" | "navy" | "sea" | "danger";

type Stats = Record<string, number | undefined>;

type Priority = {
    id: number;
    title: string;
    description: string;
    severity: string;
    type_slug: string | null;
};

type AreaInfo = {
    name: string | null;
    critical: number;
    high: number;
    medium: number;
};

type PageProps = {
    auth: {
        user: {
            name: string;
            role: UserRole;
            area?: { name: string } | null;
        };
    };
    stats?: Stats;
    priorities?: Priority[];
    areaInfo?: AreaInfo;
};

const roleConfig = {
    admin: {
        label: "Administrator",
        greeting: "Selamat datang kembali,",
        description:
            "Pantau kondisi kebencanaan, laporan masyarakat, dan aktivitas sistem SIAGA-W.",
        icon: ShieldCheck,
        badge: "Akses Penuh",
    },
    petugas: {
        label: "Petugas Lapangan",
        greeting: "Selamat bertugas,",
        description:
            "Pantau kejadian aktif dan prioritaskan laporan yang membutuhkan penanganan.",
        icon: Siren,
        badge: "Petugas",
    },
    warga: {
        label: "Warga",
        greeting: "Selamat datang,",
        description:
            "Pantau kondisi wilayah Anda dan laporkan kejadian darurat di sekitar.",
        icon: MapPin,
        badge: "Masyarakat",
    },
};

const TYPE_ICON: Record<string, typeof Flame> = {
    banjir: Waves,
    kebakaran: Flame,
    karhutla: Flame,
    "pohon-tumbang": TreePine,
};

const SEVERITY = {
    critical: { label: "KRITIS", tone: "danger" },
    high: { label: "TINGGI", tone: "ocean" },
    medium: { label: "SEDANG", tone: "sun" },
    low: { label: "RINGAN", tone: "sun" },
} as const;

const toneClass: Record<Tone, string> = {
    ocean: "bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/70 dark:bg-navy-500/10 dark:text-navy-300 dark:ring-navy-500/20",
    navy: "bg-navy-100/80 text-navy-800 ring-1 ring-inset ring-navy-200 dark:bg-navy-800/50 dark:text-navy-200 dark:ring-navy-700/60",
    sea: "bg-sea-300/20 text-sea-600 ring-1 ring-inset ring-sea-400/20 dark:bg-sea-500/10 dark:text-sea-300 dark:ring-sea-400/20",
    sun: "bg-sun-50 text-sun-700 ring-1 ring-inset ring-sun-200 dark:bg-sun-500/10 dark:text-sun-300 dark:ring-sun-500/20",
    forest: "bg-forest-50 text-forest-700 ring-1 ring-inset ring-forest-200 dark:bg-forest-500/10 dark:text-forest-300 dark:ring-forest-500/20",
    danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
};

const num = (value?: number) => String(value ?? 0);

/* ---------- Motion & loading ---------- */

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

function useFakeLoading(ms = 700) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), ms);

        return () => clearTimeout(timer);
    }, [ms]);

    return loading;
}

function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="skeleton h-3.5 w-28" />
                    <div className="skeleton h-9 w-16" />
                    <div className="skeleton h-3 w-32" />
                </div>

                <div className="skeleton size-11 rounded-xl" />
            </div>
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="skeleton size-11 shrink-0 rounded-xl" />

            <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/2" />
            </div>

            <div className="skeleton h-6 w-16 rounded-full" />
        </div>
    );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
                <RowSkeleton key={index} />
            ))}
        </div>
    );
}

/* ---------- Reusable UI ---------- */

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    tone = "ocean",
}: {
    title: string;
    value: string;
    description: string;
    icon: typeof FileText;
    tone?: Tone;
}) {
    return (
        <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md dark:hover:border-navy-500/30">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-navy-400/0 via-navy-400/40 to-sea-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        {value}
                    </p>

                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${toneClass[tone]}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function QuickAction({
    title,
    description,
    href,
    icon: Icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: typeof FileText;
}) {
    return (
        <Link
            href={href}
            className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md dark:hover:border-navy-500/30"
        >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-navy-700 transition-colors group-hover:bg-navy-500 group-hover:text-white dark:bg-navy-500/10 dark:text-navy-300 dark:group-hover:bg-navy-500">
                <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{title}</p>

                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {description}
                </p>
            </div>

            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-navy-500" />
        </Link>
    );
}

function SectionTitle({
    eyebrow,
    title,
    description,
}: {
    eyebrow?: string;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-4">
            {eyebrow && (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-navy-400">
                    {eyebrow}
                </p>
            )}

            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

function PriorityItem({
    icon: Icon,
    title,
    description,
    label,
    tone,
}: {
    icon: typeof Flame;
    title: string;
    description: string;
    label: string;
    tone: "danger" | "sun" | "ocean";
}) {
    const styles = {
        danger: {
            bar: "bg-red-500",
            icon: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
            badge: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
        },
        sun: {
            bar: "bg-sun-500",
            icon: "bg-sun-50 text-sun-700 dark:bg-sun-500/10 dark:text-sun-300",
            badge: "bg-sun-50 text-sun-700 ring-sun-200 dark:bg-sun-500/10 dark:text-sun-300 dark:ring-sun-500/20",
        },
        ocean: {
            bar: "bg-navy-500",
            icon: "bg-navy-50 text-navy-700 dark:bg-navy-500/10 dark:text-navy-300",
            badge: "bg-navy-50 text-navy-700 ring-navy-200 dark:bg-navy-500/10 dark:text-navy-300 dark:ring-navy-500/20",
        },
    }[tone];

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md dark:hover:border-navy-500/30">
            <div
                className={`absolute inset-y-4 left-0 w-0.5 rounded-full ${styles.bar}`}
            />

            <div className="flex items-start gap-4 pl-2">
                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                >
                    <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-5 text-foreground">
                        {title}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {description}
                    </p>
                </div>

                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ring-1 ring-inset ${styles.badge}`}
                >
                    {label}
                </span>
            </div>
        </div>
    );
}

/* ---------- Admin ---------- */

function AdminDashboard({
    loading,
    stats,
}: {
    loading: boolean;
    stats: Stats;
}) {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <StatCardSkeleton key={index} />
                    ))
                ) : (
                    <>
                        <Reveal delay={0}>
                            <StatCard
                                title="Total Laporan"
                                value={num(stats.total_reports)}
                                description="Seluruh laporan kejadian"
                                icon={FileText}
                                tone="ocean"
                            />
                        </Reveal>

                        <Reveal delay={70}>
                            <StatCard
                                title="Laporan Aktif"
                                value={num(stats.active_reports)}
                                description="Sedang dipantau sistem"
                                icon={AlertCircle}
                                tone="sun"
                            />
                        </Reveal>

                        <Reveal delay={140}>
                            <StatCard
                                title="Wilayah"
                                value={num(stats.total_areas)}
                                description="Wilayah terdaftar"
                                icon={MapPin}
                                tone="forest"
                            />
                        </Reveal>

                        <Reveal delay={210}>
                            <StatCard
                                title="Petugas"
                                value={num(stats.total_officers)}
                                description="Petugas terdaftar"
                                icon={Users}
                                tone="navy"
                            />
                        </Reveal>
                    </>
                )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                <div>
                    <SectionTitle
                        eyebrow="Overview"
                        title="Monitoring kebencanaan"
                        description="Ringkasan kondisi laporan yang masuk ke SIAGA-W."
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <StatCardSkeleton key={index} />
                            ))
                        ) : (
                            <>
                                <Reveal delay={110}>
                                    <StatCard
                                        title="Terverifikasi"
                                        value={num(stats.verified_reports)}
                                        description="Laporan telah diverifikasi"
                                        icon={CheckCircle2}
                                        tone="forest"
                                    />
                                </Reveal>

                                <Reveal delay={180}>
                                    <StatCard
                                        title="Sedang Ditangani"
                                        value={num(stats.handling_reports)}
                                        description="Membutuhkan tindak lanjut"
                                        icon={Siren}
                                        tone="sun"
                                    />
                                </Reveal>

                                <Reveal delay={250}>
                                    <StatCard
                                        title="Prioritas Tinggi"
                                        value={num(stats.high_priority)}
                                        description="Kejadian dengan urgensi tinggi"
                                        icon={AlertTriangle}
                                        tone="danger"
                                    />
                                </Reveal>

                                <Reveal delay={320}>
                                    <StatCard
                                        title="Fasilitas"
                                        value={num(stats.total_facilities)}
                                        description="Fasilitas tanggap bencana"
                                        icon={Map}
                                        tone="sea"
                                    />
                                </Reveal>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <SectionTitle
                        eyebrow="Status"
                        title="Kondisi sistem"
                        description="Layanan utama SIAGA-W saat ini."
                    />

                    {loading ? (
                        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="skeleton size-10 rounded-xl" />

                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-40" />
                                    <div className="skeleton h-3 w-28" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="skeleton h-4 w-full"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Reveal delay={160}>
                            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600 dark:bg-forest-500/10 dark:text-forest-300">
                                        <CheckCircle2 className="size-5" />
                                    </div>

                                    <div>
                                        <p className="font-semibold text-foreground">
                                            Semua sistem normal
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Layanan berjalan dengan baik
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 divide-y divide-border">
                                    {[
                                        ["Database", "Online"],
                                        ["Peta", "Aktif"],
                                        ["Layanan laporan", "Aktif"],
                                    ].map(([name, status]) => (
                                        <div
                                            key={name}
                                            className="flex items-center justify-between gap-4 py-3 text-sm"
                                        >
                                            <span className="text-muted-foreground">
                                                {name}
                                            </span>

                                            <span className="inline-flex items-center gap-2 font-medium text-forest-600 dark:text-forest-300">
                                                <span className="size-1.5 rounded-full bg-forest-500" />
                                                {status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    )}
                </div>
            </div>

            <div>
                <SectionTitle
                    eyebrow="Shortcut"
                    title="Akses cepat"
                    description="Navigasi langsung ke area kerja utama."
                />

                <div className="grid gap-4 md:grid-cols-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <RowSkeleton key={index} />
                        ))
                    ) : (
                        <>
                            <Reveal delay={0}>
                                <QuickAction
                                    title="Peta Kejadian"
                                    description="Pantau seluruh kejadian pada peta."
                                    href="/peta"
                                    icon={Map}
                                />
                            </Reveal>

                            <Reveal delay={80}>
                                <QuickAction
                                    title="Kelola Wilayah"
                                    description="Kelola Kelurahan, RW, dan RT."
                                    href="/admin/areas"
                                    icon={MapPin}
                                />
                            </Reveal>

                            <Reveal delay={160}>
                                <QuickAction
                                    title="Lihat Laporan"
                                    description="Tinjau seluruh laporan kejadian."
                                    href="/laporan"
                                    icon={FileText}
                                />
                            </Reveal>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

/* ---------- Petugas ---------- */

function PetugasDashboard({
    loading,
    stats,
    priorities,
}: {
    loading: boolean;
    stats: Stats;
    priorities: Priority[];
}) {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <StatCardSkeleton key={index} />
                    ))
                ) : (
                    <>
                        <Reveal delay={0}>
                            <StatCard
                                title="Laporan Aktif"
                                value={num(stats.active_reports)}
                                description="Kejadian yang perlu dipantau"
                                icon={AlertCircle}
                                tone="ocean"
                            />
                        </Reveal>

                        <Reveal delay={70}>
                            <StatCard
                                title="Sedang Ditangani"
                                value={num(stats.handling_reports)}
                                description="Dalam proses penanganan"
                                icon={Siren}
                                tone="sun"
                            />
                        </Reveal>

                        <Reveal delay={140}>
                            <StatCard
                                title="Prioritas Tinggi"
                                value={num(stats.high_priority)}
                                description="Memerlukan respons segera"
                                icon={AlertTriangle}
                                tone="danger"
                            />
                        </Reveal>

                        <Reveal delay={210}>
                            <StatCard
                                title="Selesai Ditangani"
                                value={num(stats.resolved_reports)}
                                description="Penanganan berhasil diselesaikan"
                                icon={CheckCircle2}
                                tone="forest"
                            />
                        </Reveal>
                    </>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
                <div>
                    <SectionTitle
                        eyebrow="Operational queue"
                        title="Prioritas penanganan"
                        description="Kejadian yang membutuhkan perhatian petugas."
                    />

                    {loading ? (
                        <PanelSkeleton />
                    ) : priorities.length === 0 ? (
                        <Reveal delay={100}>
                            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-600 dark:bg-forest-500/10 dark:text-forest-300">
                                    <CheckCircle2 className="size-7" />
                                </div>

                                <p className="mt-4 font-medium text-foreground">
                                    Belum ada kejadian yang perlu ditangani
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Antrian penanganan sedang kosong.
                                </p>
                            </div>
                        </Reveal>
                    ) : (
                        <div className="space-y-3">
                            {priorities.map((item, index) => {
                                const severity =
                                    SEVERITY[
                                        item.severity as keyof typeof SEVERITY
                                    ] ?? SEVERITY.low;

                                return (
                                    <Reveal
                                        key={item.id}
                                        delay={80 + index * 70}
                                    >
                                        <Link href={`/laporan/${item.id}`}>
                                            <PriorityItem
                                                icon={
                                                    TYPE_ICON[
                                                        item.type_slug ?? ""
                                                    ] ?? AlertTriangle
                                                }
                                                title={item.title}
                                                description={item.description}
                                                label={severity.label}
                                                tone={severity.tone}
                                            />
                                        </Link>
                                    </Reveal>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div>
                    <SectionTitle
                        eyebrow="Shortcuts"
                        title="Aksi petugas"
                        description="Akses cepat untuk operasional."
                    />

                    {loading ? (
                        <PanelSkeleton rows={2} />
                    ) : (
                        <div className="space-y-3">
                            <Reveal delay={140}>
                                <QuickAction
                                    title="Buka Peta"
                                    description="Pantau lokasi kejadian aktif."
                                    href="/peta"
                                    icon={Map}
                                />
                            </Reveal>

                            <Reveal delay={220}>
                                <QuickAction
                                    title="Lihat Laporan"
                                    description="Tinjau laporan masyarakat."
                                    href="/laporan"
                                    icon={FileText}
                                />
                            </Reveal>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ---------- Warga ---------- */

function WargaDashboard({
    loading,
    stats,
    areaInfo,
}: {
    loading: boolean;
    stats: Stats;
    areaInfo?: AreaInfo;
}) {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <StatCardSkeleton key={index} />
                    ))
                ) : (
                    <>
                        <Reveal delay={0}>
                            <StatCard
                                title="Laporan Saya"
                                value={num(stats.my_reports)}
                                description="Total laporan yang dibuat"
                                icon={FileText}
                                tone="ocean"
                            />
                        </Reveal>

                        <Reveal delay={70}>
                            <StatCard
                                title="Diproses"
                                value={num(stats.my_handling)}
                                description="Laporan sedang ditangani"
                                icon={Clock3}
                                tone="sun"
                            />
                        </Reveal>

                        <Reveal delay={140}>
                            <StatCard
                                title="Terverifikasi"
                                value={num(stats.my_verified)}
                                description="Laporan berhasil diverifikasi"
                                icon={CheckCircle2}
                                tone="forest"
                            />
                        </Reveal>

                        <Reveal delay={210}>
                            <StatCard
                                title="Kejadian Aktif"
                                value={num(stats.active_in_area)}
                                description="Di sekitar wilayah Anda"
                                icon={AlertTriangle}
                                tone="danger"
                            />
                        </Reveal>
                    </>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
                <div>
                    <SectionTitle
                        eyebrow="Local overview"
                        title="Kondisi wilayah"
                        description="Informasi kejadian yang sedang berlangsung di sekitar Anda."
                    />

                    {loading ? (
                        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex gap-4">
                                <div className="skeleton size-12 rounded-xl" />

                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3 w-24" />
                                    <div className="skeleton h-6 w-48" />
                                    <div className="skeleton h-3 w-full" />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="skeleton h-20 rounded-xl"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Reveal delay={100}>
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-600 dark:bg-navy-500/10 dark:text-navy-300">
                                        <MapPin className="size-6" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                            Wilayah Anda
                                        </p>

                                        <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                                            {areaInfo?.name ??
                                                "Belum ada wilayah"}
                                        </h3>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                            Pantau laporan kejadian dan kondisi
                                            kebencanaan di sekitar wilayah
                                            tempat tinggal Anda.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-red-200/70 bg-red-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                                        <p className="text-xs font-medium text-red-600 dark:text-red-300">
                                            Kritis
                                        </p>

                                        <p className="mt-1 text-2xl font-semibold tracking-tight text-red-700 dark:text-red-200">
                                            {num(areaInfo?.critical)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-sun-200/70 bg-sun-50/70 p-4 dark:border-sun-500/20 dark:bg-sun-500/5">
                                        <p className="text-xs font-medium text-sun-700 dark:text-sun-300">
                                            Tinggi
                                        </p>

                                        <p className="mt-1 text-2xl font-semibold tracking-tight text-sun-700 dark:text-sun-200">
                                            {num(areaInfo?.high)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-navy-200/70 bg-navy-50/70 p-4 dark:border-navy-500/20 dark:bg-navy-500/5">
                                        <p className="text-xs font-medium text-navy-700 dark:text-navy-300">
                                            Sedang
                                        </p>

                                        <p className="mt-1 text-2xl font-semibold tracking-tight text-navy-800 dark:text-navy-100">
                                            {num(areaInfo?.medium)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    )}
                </div>

                <div>
                    <SectionTitle
                        eyebrow="Actions"
                        title="Aksi cepat"
                        description="Laporkan dan pantau kejadian."
                    />

                    {loading ? (
                        <PanelSkeleton rows={3} />
                    ) : (
                        <div className="space-y-3">
                            <Reveal delay={130}>
                                <Link
                                    href="/laporan/create"
                                    className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-navy-950 p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-navy-900"
                                >
                                    <div className="absolute -right-12 -top-12 size-28 rounded-full bg-sea-400/20 blur-2xl" />

                                    <div className="relative">
                                        <p className="font-semibold">
                                            Laporkan Kejadian
                                        </p>

                                        <p className="mt-1 max-w-[220px] text-xs leading-5 text-navy-100/70">
                                            Sampaikan kejadian darurat di
                                            sekitar Anda.
                                        </p>
                                    </div>

                                    <ArrowRight className="relative size-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Reveal>

                            <Reveal delay={210}>
                                <QuickAction
                                    title="Peta Kejadian"
                                    description="Lihat kondisi wilayah."
                                    href="/peta"
                                    icon={Map}
                                />
                            </Reveal>

                            <Reveal delay={290}>
                                <QuickAction
                                    title="Laporan Saya"
                                    description="Pantau laporan yang dibuat."
                                    href="/laporan"
                                    icon={FileText}
                                />
                            </Reveal>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ---------- Page ---------- */

export default function Dashboard() {
    const { auth, stats, priorities, areaInfo } = usePage<PageProps>().props;

    const loading = useFakeLoading(700);

    const user = auth.user;
    const role = user.role;
    const config = roleConfig[role];
    const RoleIcon = config.icon;

    return (
        <>
            <Head title="Dashboard" />

            <div className="relative flex min-h-full flex-1 flex-col gap-7 overflow-hidden bg-background p-4 md:p-6">
                {/* Subtle ambient blobs: tetap ada, tetapi lebih tenang. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                    <div className="blob -left-36 -top-36 size-80 animate-blob bg-navy-400/10 blur-[90px]" />
                    <div className="blob -right-40 top-1/3 size-96 animate-blob-slow bg-sea-400/8 blur-[100px]" />
                    <div className="blob -bottom-40 left-1/3 size-80 animate-blob bg-forest-400/6 blur-[90px]" />

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.02),transparent_42%)]" />
                </div>

                {/* Hero / command header */}
                <section className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur md:p-7">
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-navy-500 via-sea-400 to-transparent" />

                    <div className="absolute -right-20 -top-24 size-72 rounded-full bg-navy-400/8 blur-3xl" />
                    <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-sea-400/8 blur-3xl" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground">
                                    <RoleIcon className="size-3.5 text-navy-500" />
                                    {config.label}
                                </span>

                                <span className="rounded-full bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 ring-1 ring-inset ring-forest-200 dark:bg-forest-500/10 dark:text-forest-300 dark:ring-forest-500/20">
                                    {config.badge}
                                </span>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {config.greeting}
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                {user.name}
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                                {config.description}
                            </p>

                            {user.area?.name && (
                                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                                    <MapPin className="size-4 text-navy-500" />
                                    Wilayah: {user.area.name}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/peta"
                            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-900 hover:shadow-md dark:bg-navy-100 dark:text-navy-950 dark:hover:bg-white"
                        >
                            <Map className="size-4" />
                            Buka Peta Kejadian
                            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </div>
                </section>

                {role === "admin" && (
                    <AdminDashboard loading={loading} stats={stats ?? {}} />
                )}

                {role === "petugas" && (
                    <PetugasDashboard
                        loading={loading}
                        stats={stats ?? {}}
                        priorities={priorities ?? []}
                    />
                )}

                {role === "warga" && (
                    <WargaDashboard
                        loading={loading}
                        stats={stats ?? {}}
                        areaInfo={areaInfo}
                    />
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
    ],
};
