import { Head, Link, usePage } from '@inertiajs/react';
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
} from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { dashboard } from '@/routes';

type UserRole = 'admin' | 'petugas' | 'warga';
type Tone = 'ocean' | 'sun' | 'forest' | 'navy' | 'sea' | 'danger';

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
        label: 'Administrator',
        greeting: 'Selamat datang kembali,',
        description:
            'Pantau kondisi kebencanaan, laporan masyarakat, dan aktivitas sistem SIAGA-W.',
        icon: ShieldCheck,
        badge: 'Akses Penuh',
    },
    petugas: {
        label: 'Petugas Lapangan',
        greeting: 'Selamat bertugas,',
        description:
            'Pantau kejadian aktif dan prioritaskan laporan yang membutuhkan penanganan.',
        icon: Siren,
        badge: 'Petugas',
    },
    warga: {
        label: 'Warga',
        greeting: 'Selamat datang,',
        description:
            'Pantau kondisi wilayah Anda dan laporkan kejadian darurat di sekitar.',
        icon: MapPin,
        badge: 'Masyarakat',
    },
};

const TYPE_ICON: Record<string, typeof Flame> = {
    banjir: Waves,
    kebakaran: Flame,
    karhutla: Flame,
    'pohon-tumbang': TreePine,
};

const SEVERITY = {
    critical: { label: 'KRITIS', tone: 'danger' },
    high: { label: 'TINGGI', tone: 'ocean' },
    medium: { label: 'SEDANG', tone: 'sun' },
    low: { label: 'RINGAN', tone: 'sun' },
} as const;

/* Warna ikon mengikuti palet logo */
const toneClass: Record<Tone, string> = {
    ocean: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
    navy: 'bg-navy-200/70 text-navy-800 dark:bg-navy-800/50 dark:text-navy-200',
    sea: 'bg-sea-300/30 text-sea-500 dark:bg-sea-500/15 dark:text-sea-300',
    sun: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
    forest: 'bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400',
    danger: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

/** Format angka dari props, aman kalau undefined. */
const num = (value?: number) => String(value ?? 0);

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
            className={`h-full animate-fade-in-up ${className}`}
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

function useFakeLoading(ms = 800) {
    // Data sudah dikirim controller; ini hanya untuk animasi masuk.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), ms);
        return () => clearTimeout(t);
    }, [ms]);

    return loading;
}

function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="skeleton h-3.5 w-24" />
                    <div className="skeleton h-8 w-16" />
                    <div className="skeleton h-3 w-32" />
                </div>
                <div className="skeleton h-11 w-11 rounded-xl" />
            </div>
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
        </div>
    );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <RowSkeleton key={i} />
            ))}
        </div>
    );
}

/* ---------- Komponen UI ---------- */

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    tone = 'ocean',
}: {
    title: string;
    value: string;
    description: string;
    icon: typeof FileText;
    tone?: Tone;
}) {
    return (
        <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 dark:hover:border-navy-500/40">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${toneClass[tone]}`}
                >
                    <Icon className="h-5 w-5" />
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
            className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:shadow-md dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-navy-800 transition-colors group-hover:bg-navy-500 group-hover:text-white dark:text-navy-200">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {description}
                </p>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-navy-500" />
        </Link>
    );
}

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-4 flex items-start gap-3">
            <span className="mt-1 h-9 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
            <div>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
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
    tone: 'danger' | 'sun' | 'ocean';
}) {
    const styles = {
        danger: {
            box: 'border-red-200 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/5',
            icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
            badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        },
        sun: {
            box: 'border-sun-300/60 bg-sun-50 dark:border-sun-500/20 dark:bg-sun-500/5',
            icon: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
            badge: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
        },
        ocean: {
            box: 'border-navy-200 bg-navy-50 dark:border-navy-500/20 dark:bg-navy-500/5',
            icon: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
            badge: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300',
        },
    }[tone];

    return (
        <div
            className={`flex items-center gap-4 rounded-2xl border p-4 transition-transform duration-300 hover:translate-x-1 ${styles.box}`}
        >
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
            >
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                    {title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {description}
                </p>
            </div>

            <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
            >
                {label}
            </span>
        </div>
    );
}

/* ---------- Dashboard per role ---------- */

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
                    Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
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
                        <Reveal delay={80}>
                            <StatCard
                                title="Laporan Aktif"
                                value={num(stats.active_reports)}
                                description="Sedang dipantau sistem"
                                icon={AlertCircle}
                                tone="sun"
                            />
                        </Reveal>
                        <Reveal delay={160}>
                            <StatCard
                                title="Wilayah"
                                value={num(stats.total_areas)}
                                description="Wilayah terdaftar"
                                icon={MapPin}
                                tone="forest"
                            />
                        </Reveal>
                        <Reveal delay={240}>
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

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <SectionTitle
                        title="Monitoring Kebencanaan"
                        description="Ringkasan kondisi laporan yang masuk ke SIAGA-W."
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <StatCardSkeleton key={i} />
                            ))
                        ) : (
                            <>
                                <Reveal delay={100}>
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
                                <Reveal delay={260}>
                                    <StatCard
                                        title="Prioritas Tinggi"
                                        value={num(stats.high_priority)}
                                        description="Kejadian dengan urgensi tinggi"
                                        icon={AlertTriangle}
                                        tone="danger"
                                    />
                                </Reveal>
                                <Reveal delay={340}>
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
                        title="Status Sistem"
                        description="Kondisi layanan SIAGA-W saat ini."
                    />

                    {loading ? (
                        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="skeleton h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-40" />
                                    <div className="skeleton h-3 w-28" />
                                </div>
                            </div>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="skeleton h-4 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Reveal delay={200}>
                            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 animate-pulse-ring items-center justify-center rounded-full bg-forest-100 dark:bg-forest-500/15">
                                        <CheckCircle2 className="h-5 w-5 text-forest-600 dark:text-forest-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            Semua Sistem Normal
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Layanan berjalan dengan baik
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    {[
                                        ['Database', 'Online'],
                                        ['Peta', 'Aktif'],
                                        ['Layanan Laporan', 'Aktif'],
                                    ].map(([name, status]) => (
                                        <div
                                            key={name}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-muted-foreground">
                                                {name}
                                            </span>
                                            <span className="inline-flex items-center gap-2 font-medium text-forest-600 dark:text-forest-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
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
                    title="Akses Cepat"
                    description="Kelola sistem dan pantau kondisi wilayah."
                />

                <div className="grid gap-4 md:grid-cols-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <RowSkeleton key={i} />
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
                            <Reveal delay={100}>
                                <QuickAction
                                    title="Kelola Wilayah"
                                    description="Kelola Kelurahan, RW, dan RT."
                                    href="/admin/areas"
                                    icon={MapPin}
                                />
                            </Reveal>
                            <Reveal delay={200}>
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
                    Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
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
                        <Reveal delay={80}>
                            <StatCard
                                title="Sedang Ditangani"
                                value={num(stats.handling_reports)}
                                description="Dalam proses penanganan"
                                icon={Siren}
                                tone="sun"
                            />
                        </Reveal>
                        <Reveal delay={160}>
                            <StatCard
                                title="Prioritas Tinggi"
                                value={num(stats.high_priority)}
                                description="Memerlukan respons segera"
                                icon={AlertTriangle}
                                tone="danger"
                            />
                        </Reveal>
                        <Reveal delay={240}>
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

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SectionTitle
                        title="Prioritas Penanganan"
                        description="Kejadian yang membutuhkan perhatian petugas."
                    />

                    {loading ? (
                        <PanelSkeleton />
                    ) : priorities.length === 0 ? (
                        <Reveal delay={100}>
                            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400">
                                    <CheckCircle2 className="h-7 w-7" />
                                </div>
                                <p className="mt-3 text-sm font-medium text-foreground">
                                    Belum ada kejadian yang perlu ditangani
                                </p>
                            </div>
                        </Reveal>
                    ) : (
                        <div className="space-y-3">
                            {priorities.map((item, i) => {
                                const severity =
                                    SEVERITY[
                                        item.severity as keyof typeof SEVERITY
                                    ] ?? SEVERITY.low;

                                return (
                                    <Reveal key={item.id} delay={100 + i * 80}>
                                        <Link href={`/laporan/${item.id}`}>
                                            <PriorityItem
                                                icon={
                                                    TYPE_ICON[
                                                        item.type_slug ?? ''
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
                        title="Aksi Petugas"
                        description="Akses cepat untuk operasional."
                    />

                    {loading ? (
                        <PanelSkeleton rows={2} />
                    ) : (
                        <div className="space-y-3">
                            <Reveal delay={150}>
                                <QuickAction
                                    title="Buka Peta"
                                    description="Pantau lokasi kejadian aktif."
                                    href="/peta"
                                    icon={Map}
                                />
                            </Reveal>
                            <Reveal delay={230}>
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
                    Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
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
                        <Reveal delay={80}>
                            <StatCard
                                title="Diproses"
                                value={num(stats.my_handling)}
                                description="Laporan sedang ditangani"
                                icon={Clock3}
                                tone="sun"
                            />
                        </Reveal>
                        <Reveal delay={160}>
                            <StatCard
                                title="Terverifikasi"
                                value={num(stats.my_verified)}
                                description="Laporan berhasil diverifikasi"
                                icon={CheckCircle2}
                                tone="forest"
                            />
                        </Reveal>
                        <Reveal delay={240}>
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

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SectionTitle
                        title="Kondisi Wilayah"
                        description="Informasi kejadian yang sedang berlangsung di sekitar Anda."
                    />

                    {loading ? (
                        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
                            <div className="flex gap-4">
                                <div className="skeleton h-12 w-12 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3 w-24" />
                                    <div className="skeleton h-6 w-48" />
                                    <div className="skeleton h-3 w-full" />
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="skeleton h-20 rounded-xl"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Reveal delay={100}>
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Wilayah Anda
                                        </p>
                                        <h3 className="mt-1 text-xl font-bold text-foreground">
                                            {areaInfo?.name ??
                                                'Belum ada wilayah'}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Pantau laporan kejadian dan kondisi
                                            kebencanaan di sekitar wilayah
                                            tempat tinggal Anda.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl bg-red-50 p-4 dark:bg-red-500/10">
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                            Kritis
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
                                            {num(areaInfo?.critical)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-sun-50 p-4 dark:bg-sun-500/10">
                                        <p className="text-xs text-sun-600 dark:text-sun-300">
                                            Tinggi
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-sun-600 dark:text-sun-300">
                                            {num(areaInfo?.high)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-navy-50 p-4 dark:bg-navy-500/10">
                                        <p className="text-xs text-navy-600 dark:text-navy-400">
                                            Sedang
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-navy-800 dark:text-navy-200">
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
                        title="Aksi Cepat"
                        description="Laporkan dan pantau kejadian."
                    />

                    {loading ? (
                        <PanelSkeleton />
                    ) : (
                        <div className="space-y-3">
                            <Reveal delay={150}>
                                <Link
                                    href="/laporan/create"
                                    className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-linear-to-br from-sun-400 to-sun-600 p-5 text-white shadow-md shadow-sun-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sun-500/40"
                                >
                                    <div>
                                        <p className="font-bold">
                                            Laporkan Kejadian
                                        </p>
                                        <p className="mt-1 text-xs text-white/90">
                                            Sampaikan kejadian darurat di
                                            sekitar Anda.
                                        </p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Reveal>
                            <Reveal delay={230}>
                                <QuickAction
                                    title="Peta Kejadian"
                                    description="Lihat kondisi wilayah."
                                    href="/peta"
                                    icon={Map}
                                />
                            </Reveal>
                            <Reveal delay={310}>
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

/* ---------- Halaman utama ---------- */

export default function Dashboard() {
    const { auth, stats, priorities, areaInfo } = usePage<PageProps>().props;
    const loading = useFakeLoading(800);

    const user = auth.user;
    const role = user.role;
    const config = roleConfig[role];
    const RoleIcon = config.icon;

    return (
        <>
            <Head title="Dashboard" />

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/20" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/20" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/15" />
                </div>

                {/* Hero */}
                <section className="relative animate-fade-in overflow-hidden rounded-3xl bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 p-6 text-white shadow-xl shadow-navy-900/20 md:p-8">
                    <div className="blob -top-20 -right-16 h-72 w-72 animate-blob bg-sun-400/30" />
                    <div className="blob -bottom-24 left-1/3 h-72 w-72 animate-blob-slow bg-sea-400/25" />
                    <div className="blob -bottom-16 -left-10 h-56 w-56 animate-blob bg-forest-500/25" />

                    <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="max-w-3xl">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-navy-50 backdrop-blur">
                                    <RoleIcon className="h-3.5 w-3.5" />
                                    {config.label}
                                </span>

                                <span className="rounded-full bg-forest-400/15 px-3 py-1.5 text-xs font-medium text-forest-400">
                                    {config.badge}
                                </span>
                            </div>

                            <p className="text-sm text-navy-200">
                                {config.greeting}
                            </p>

                            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                                {user.name}
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-100/80">
                                {config.description}
                            </p>

                            {user.area?.name && (
                                <div className="mt-5 inline-flex items-center gap-2 text-xs text-navy-200">
                                    <MapPin className="h-4 w-4 text-sun-300" />
                                    Wilayah: {user.area.name}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/peta"
                            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-sun-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sun-500/40"
                        >
                            <Map className="h-4 w-4" />
                            Buka Peta Kejadian
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </section>

                {role === 'admin' && (
                    <AdminDashboard loading={loading} stats={stats ?? {}} />
                )}
                {role === 'petugas' && (
                    <PetugasDashboard
                        loading={loading}
                        stats={stats ?? {}}
                        priorities={priorities ?? []}
                    />
                )}
                {role === 'warga' && (
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
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};