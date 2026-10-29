import { Head, Link, router } from "@inertiajs/react";
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    Flame,
    MapPin,
    Mountain,
    ShieldAlert,
    Search,
    Siren,
    TreePine,
    Waves,
    X,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type ElementType,
    type ReactNode,
} from "react";

import DisasterMap, {
    type MapBoundary,
    type MapFacility,
    type MapReport,
    type MapType,
    type MapZone,
} from "@/components/map/disaster-map";

/* ---------- Tipe ---------- */

type Role = "admin" | "petugas" | "warga";
type Tone = "navy" | "sea" | "forest" | "sun" | "danger";

type User = {
    id: number;
    name: string;
    role: Role;
};

type Area = {
    id: number;
    name: string;
    type: string;
    slug: string | null;
    parent: string | null;
};

type AreaOption = {
    id: number;
    name: string;
    type: string;
    slug: string;
    parent_name: string | null;
    label: string;
};

type Stats = {
    total_reports: number;
    active_reports: number;
    verified_reports: number;
    handling_reports: number;
    critical_reports: number;
    high_reports: number;
    total_areas: number;
    total_facilities: number;
};

type Contact = {
    id: number;
    name: string;
    role: string | null;
    phone: string;
};

type Announcement = {
    id: number;
    title: string;
    body: string;
    level: string;
    published_at: string | null;
};

type Props = {
    auth?: {
        user?: User | null;
    };
    area: Area | null;
    areas: AreaOption[];
    boundary: MapBoundary | null;
    center: [number, number];
    zoom: number;
    reports: MapReport[];
    types: MapType[];
    zones: MapZone[];
    facilities: MapFacility[];
    contacts: Contact[];
    announcements: Announcement[];
    stats: Stats;
};

type StatCardData = {
    title: string;
    value: number | string;
    description: string;
    icon: ElementType;
    tone: Tone;
};

/* ---------- Konstanta ---------- */

const SEVERITY_LABEL: Record<string, string> = {
    low: "Ringan",
    medium: "Sedang",
    high: "Berat",
    critical: "Kritis",
};

const SEVERITY_CLASS: Record<string, string> = {
    low: "bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400",
    medium: "bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    critical: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const TYPE_ICON = {
    banjir: Waves,
    kebakaran: Flame,
    karhutla: Flame,
    longsor: Mountain,
    "pohon-tumbang": TreePine,
} as const;

/* Warna ikon mengikuti palet logo */
const toneClass: Record<Tone, string> = {
    navy: "bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400",
    sea: "bg-sea-300/30 text-sea-500 dark:bg-sea-500/15 dark:text-sea-300",
    forest: "bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400",
    sun: "bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300",
    danger: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

const adminLinkClass =
    "group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:shadow-md dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10";

/* ---------- Helper animasi & skeleton ---------- */

function Reveal({
    children,
    delay = 0,
    className = "",
    fill = true,
    plain = false,
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
    /** true = tinggi penuh (untuk kartu dalam grid) */
    fill?: boolean;
    /** true = hanya fade (tanpa translate), aman untuk peta Leaflet */
    plain?: boolean;
}) {
    return (
        <div
            className={`${fill ? "h-full" : ""} ${plain ? "animate-fade-in" : "animate-fade-in-up"} ${className}`}
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

function useFakeLoading(ms = 700) {
    // Ganti dengan state asli bila perlu (mis. router.on('start' / 'finish'))
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), ms);
        return () => clearTimeout(timer);
    }, [ms]);

    return loading;
}

function StatCardSkeleton() {
    return (
        <div className="h-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="skeleton h-3.5 w-24" />
                    <div className="skeleton h-8 w-14" />
                    <div className="skeleton h-3 w-28" />
                </div>
                <div className="skeleton size-10 rounded-xl" />
            </div>
        </div>
    );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-4 md:px-5"
                >
                    <div className="skeleton size-10 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-3 w-1/2" />
                    </div>
                    <div className="skeleton h-6 w-14 rounded-full" />
                </div>
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
    tone = "navy",
}: {
    title: string;
    value: number | string;
    description: string;
    icon: ElementType;
    tone?: Tone;
}) {
    return (
        <div className="group h-full rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 dark:hover:border-navy-500/40">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${toneClass[tone]}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function PanelHeader({
    icon: Icon,
    tone,
    title,
    description,
    action,
}: {
    icon: ElementType;
    tone: Tone;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
                <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneClass[tone]}`}
                >
                    <Icon className="size-4" />
                </div>
                <div>
                    <h2 className="font-semibold text-foreground">{title}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {action}
        </div>
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
        <div className="mb-3 flex items-start gap-3">
            <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
            <div>
                <h2 className="font-semibold text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function LayerToggle({
    label,
    hasData,
    checked,
    onChange,
}: {
    label: string;
    hasData: boolean;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label
            className={`flex items-center justify-between rounded-xl border border-border px-3 py-2.5 transition ${
                hasData
                    ? "cursor-pointer hover:bg-muted/50"
                    : "cursor-not-allowed opacity-60"
            }`}
        >
            <span className="text-sm font-medium">
                {label}
                {!hasData && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        Belum ada data
                    </span>
                )}
            </span>
            <input
                type="checkbox"
                checked={hasData && checked}
                disabled={!hasData}
                onChange={(event) => onChange(event.target.checked)}
                className="size-4 accent-primary"
            />
        </label>
    );
}

/* ---------- Halaman ---------- */

export default function PetaIndex({
    auth,
    area,
    areas,
    boundary,
    center,
    zoom,
    reports,
    types,
    zones,
    facilities,
    contacts,
    announcements,
    stats,
}: Props) {
    // Halaman peta bersifat public, sehingga auth/user bisa null saat guest.
    // Guest menggunakan role warga hanya untuk kebutuhan tampilan UI.
    const role: Role = auth?.user?.role ?? "warga";
    const loading = useFakeLoading(700);

    const [activeTypeIds, setActiveTypeIds] = useState<number[]>(
        types.map((type) => type.id),
    );

    const hasZones = zones.length > 0;
    const hasFacilities = facilities.length > 0;

    const [showZones, setShowZones] = useState(hasZones);
    const [showFacilities, setShowFacilities] = useState(hasFacilities);

    // Sinkronkan saat data berubah (pindah wilayah / reload)
    useEffect(() => {
        setShowZones(hasZones);
    }, [hasZones]);

    useEffect(() => {
        setShowFacilities(hasFacilities);
    }, [hasFacilities]);

    // Pencarian wilayah
    const [query, setQuery] = useState("");
    const trimmedQuery = query.trim();

    const filteredAreas = useMemo(() => {
        const keyword = trimmedQuery.toLowerCase();
        if (!keyword) return [];

        return areas
            .filter((item) =>
                `${item.label} ${item.name} ${item.parent_name ?? ""}`
                    .toLowerCase()
                    .includes(keyword),
            )
            .slice(0, 8);
    }, [areas, trimmedQuery]);

    const areaNotFound = trimmedQuery !== "" && filteredAreas.length === 0;

    const visibleReports = useMemo(
        () => reports.filter((report) => activeTypeIds.includes(report.type_id)),
        [reports, activeTypeIds],
    );

    const recentReports = useMemo(
        () =>
            [...visibleReports]
                .sort((a, b) => {
                    const aTime = a.occurred_at
                        ? new Date(a.occurred_at).getTime()
                        : 0;
                    const bTime = b.occurred_at
                        ? new Date(b.occurred_at).getTime()
                        : 0;
                    return bTime - aTime;
                })
                .slice(0, 5),
        [visibleReports],
    );

    const toggleType = (id: number) => {
        setActiveTypeIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const selectAllTypes = () => {
        setActiveTypeIds(types.map((type) => type.id));
    };

    const clearAllTypes = () => {
        setActiveTypeIds([]);
    };

    const changeArea = (slug: string) => {
        setQuery("");
        if (!slug) {
            router.get("/", {}, { preserveScroll: true });
            return;
        }
        router.get(`/wilayah/${slug}`, {}, { preserveScroll: true });
    };

    const allTypesActive =
        types.length > 0 && activeTypeIds.length === types.length;

    /* Statistik per role */
    const adminStats: StatCardData[] = [
        {
            title: "Total Laporan",
            value: stats.total_reports,
            description: "Laporan aktif",
            icon: BarChart3,
            tone: "navy",
        },
        {
            title: "Terverifikasi",
            value: stats.verified_reports,
            description: "Sudah diverifikasi",
            icon: CheckCircle2,
            tone: "sea",
        },
        {
            title: "Sedang Ditangani",
            value: stats.handling_reports,
            description: "Dalam penanganan",
            icon: Siren,
            tone: "sun",
        },
        {
            title: "Wilayah",
            value: stats.total_areas,
            description: "Wilayah aktif",
            icon: Building2,
            tone: "forest",
        },
    ];

    const petugasStats: StatCardData[] = [
        {
            title: "Kejadian Aktif",
            value: stats.active_reports,
            description: "Kejadian aktif",
            icon: AlertTriangle,
            tone: "navy",
        },
        {
            title: "Sedang Ditangani",
            value: stats.handling_reports,
            description: "Dalam penanganan",
            icon: Siren,
            tone: "sun",
        },
        {
            title: "Prioritas Tinggi",
            value: stats.high_reports,
            description: "Severity berat",
            icon: ShieldAlert,
            tone: "sea",
        },
        {
            title: "Kritis",
            value: stats.critical_reports,
            description: "Prioritas utama",
            icon: CircleAlert,
            tone: "danger",
        },
    ];

    const wargaStats: StatCardData[] = [
        {
            title: "Kejadian Aktif",
            value: stats.active_reports,
            description: "Informasi terkini",
            icon: AlertTriangle,
            tone: "navy",
        },
        {
            title: "Zona Rawan",
            value: zones.length,
            description: hasZones ? "Zona pada peta" : "Belum ada zona",
            icon: ShieldAlert,
            tone: "sun",
        },
        {
            title: "Fasilitas",
            value: stats.total_facilities,
            description:
                stats.total_facilities > 0
                    ? "Fasilitas darurat"
                    : "Belum ada fasilitas",
            icon: Building2,
            tone: "forest",
        },
    ];

    const statCards =
        role === "admin"
            ? adminStats
            : role === "petugas"
              ? petugasStats
              : wargaStats;

    const statGridClass = "flex w-full flex-wrap items-stretch gap-3";

    const pageTitle =
        role === "admin"
            ? "Monitoring Peta Wilayah"
            : role === "petugas"
              ? "Monitoring Kejadian"
              : "Peta Kejadian Sekitar";

    const pageDescription =
        role === "admin"
            ? "Pantau kejadian, wilayah, fasilitas, dan kondisi kebencanaan secara terintegrasi."
            : role === "petugas"
              ? "Pantau kejadian aktif dan laporan yang membutuhkan penanganan."
              : "Lihat informasi kejadian dan kondisi kebencanaan di sekitar Anda.";

    return (
        <>
            <Head title="Peta Kejadian" />

            <div
                dir="ltr"
                className="relative min-h-screen overflow-hidden bg-background"
            >
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/20" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/20" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/15" />
                </div>

                <div className="relative mx-auto max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-border bg-card/90 text-foreground shadow-sm backdrop-blur">
                        <div className="blob -top-20 -right-16 h-64 w-64 animate-blob bg-sun-400/15" />
                        <div className="blob -bottom-24 left-1/3 h-64 w-64 animate-blob-slow bg-sea-400/10" />
                        <div className="blob -bottom-14 -left-10 h-48 w-48 animate-blob bg-forest-500/10" />

                        <div className="relative flex flex-col justify-between gap-5 p-5 md:p-6 lg:flex-row lg:items-center lg:p-7">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-navy-600 to-sea-500 text-white shadow-md shadow-navy-500/20">
                                    <MapPin className="size-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                                        {pageTitle}
                                    </h1>
                                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                        {pageDescription}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-forest-200 bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 capitalize dark:border-forest-500/30 dark:bg-forest-500/10 dark:text-forest-300">
                                    {role}
                                </span>
                                {area && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
                                        <MapPin className="size-3.5 text-sun-500" />
                                        {area.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        STATISTICS
                    ====================================================== */}
                    <div className={statGridClass} dir="ltr">
                        {loading
                            ? statCards.map((card) => (
                                  <div
                                      key={card.title}
                                      className="min-w-0 flex-1 basis-[280px] sm:basis-[300px] xl:basis-0"
                                  >
                                      <StatCardSkeleton />
                                  </div>
                              ))
                            : statCards.map((card, i) => (
                                  <div
                                      key={card.title}
                                      className="min-w-0 flex-1 basis-[280px] animate-fade-in-up sm:basis-[300px] xl:basis-0"
                                      style={
                                          {
                                              animationDelay: `${i * 80}ms`,
                                          } as CSSProperties
                                      }
                                  >
                                      <StatCard {...card} />
                                  </div>
                              ))}
                    </div>

                    {/* =====================================================
                        MAIN CONTENT
                    ====================================================== */}
                    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                        {/* =================================================
                            SIDEBAR
                        ================================================== */}
                        <aside className="space-y-4">
                            {/* WILAYAH */}
                            <Reveal delay={80} fill={false}>
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <PanelHeader
                                        icon={MapPin}
                                        tone="navy"
                                        title="Wilayah"
                                        description="Pilih wilayah untuk melihat detail peta."
                                    />

                                    {area && (
                                        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-navy-200 bg-navy-50 px-3 py-2 text-sm dark:border-navy-500/30 dark:bg-navy-500/10">
                                            <span className="min-w-0 truncate font-medium">
                                                {area.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => changeArea("")}
                                                className="shrink-0 text-xs font-semibold text-navy-600 hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200"
                                            >
                                                Semua wilayah
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative mt-3">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="search"
                                            value={query}
                                            onChange={(event) =>
                                                setQuery(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" &&
                                                    filteredAreas.length > 0
                                                ) {
                                                    event.preventDefault();
                                                    changeArea(
                                                        filteredAreas[0].slug,
                                                    );
                                                }
                                            }}
                                            disabled={areas.length === 0}
                                            placeholder="Cari RW, kelurahan, atau kecamatan"
                                            aria-label="Cari wilayah"
                                            className="h-10 w-full rounded-xl border border-border bg-background pr-9 pl-9 text-sm transition outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                        {query && (
                                            <button
                                                type="button"
                                                onClick={() => setQuery("")}
                                                aria-label="Hapus pencarian"
                                                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {filteredAreas.length > 0 && (
                                        <ul className="mt-2 max-h-56 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                                            {filteredAreas.map((item) => (
                                                <li key={item.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeArea(item.slug)
                                                        }
                                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-navy-50 dark:hover:bg-navy-500/10"
                                                    >
                                                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                                        <span className="min-w-0 flex-1 truncate">
                                                            {item.label}
                                                        </span>
                                                        <span className="shrink-0 text-xs text-muted-foreground uppercase">
                                                            {item.type}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {areaNotFound && (
                                        <div
                                            role="alert"
                                            className="mt-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                        >
                                            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                                            <span>
                                                Wilayah &quot;{trimmedQuery}
                                                &quot; tidak ditemukan. Periksa
                                                ejaan atau coba kata kunci lain.
                                            </span>
                                        </div>
                                    )}

                                    {areas.length === 0 && (
                                        <p className="mt-2 flex items-start gap-1.5 text-xs text-sun-600 dark:text-sun-300">
                                            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                                            <span>
                                                Data wilayah belum tersedia.{" "}
                                                {role === "admin"
                                                    ? "Tambahkan lewat menu Kelola Wilayah."
                                                    : "Hubungi admin untuk menambahkannya."}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </Reveal>

                            {/* JENIS BENCANA */}
                            <Reveal delay={160} fill={false}>
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <PanelHeader
                                        icon={AlertTriangle}
                                        tone="sea"
                                        title="Jenis Bencana"
                                        description="Filter kejadian pada peta."
                                        action={
                                            <button
                                                type="button"
                                                onClick={
                                                    allTypesActive
                                                        ? clearAllTypes
                                                        : selectAllTypes
                                                }
                                                className="shrink-0 text-xs font-semibold text-navy-600 transition hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200"
                                            >
                                                {allTypesActive
                                                    ? "Kosongkan"
                                                    : "Pilih semua"}
                                            </button>
                                        }
                                    />

                                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                        {types.map((type) => {
                                            const Icon =
                                                TYPE_ICON[
                                                    type.slug as keyof typeof TYPE_ICON
                                                ] ?? AlertTriangle;
                                            const active = activeTypeIds.includes(
                                                type.id,
                                            );

                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleType(type.id)
                                                    }
                                                    className={[
                                                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
                                                        active
                                                            ? "border-navy-200 bg-navy-50 dark:border-navy-500/30 dark:bg-navy-500/10"
                                                            : "border-border opacity-50 hover:opacity-80",
                                                    ].join(" ")}
                                                >
                                                    <span
                                                        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                                        style={{
                                                            backgroundColor:
                                                                type.color,
                                                        }}
                                                    >
                                                        <Icon className="size-4" />
                                                    </span>
                                                    <span className="flex-1 text-sm font-medium">
                                                        {type.name}
                                                    </span>
                                                    <span
                                                        className={[
                                                            "flex size-5 items-center justify-center rounded-full border transition",
                                                            active
                                                                ? "border-forest-500 bg-forest-500"
                                                                : "border-muted-foreground/30",
                                                        ].join(" ")}
                                                    >
                                                        {active && (
                                                            <CheckCircle2 className="size-3.5 text-white" />
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Reveal>

                            {/* TAMPILAN PETA */}
                            <Reveal delay={240} fill={false}>
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <PanelHeader
                                        icon={ShieldAlert}
                                        tone="forest"
                                        title="Tampilan Peta"
                                        description="Atur layer yang ingin ditampilkan."
                                    />
                                    <div className="mt-4 space-y-2">
                                        <LayerToggle
                                            label="Zona rawan"
                                            hasData={hasZones}
                                            checked={showZones}
                                            onChange={setShowZones}
                                        />
                                        <LayerToggle
                                            label="Fasilitas darurat"
                                            hasData={hasFacilities}
                                            checked={showFacilities}
                                            onChange={setShowFacilities}
                                        />
                                    </div>
                                </div>
                            </Reveal>

                            {/* ADMIN ACTION */}
                            {role === "admin" && (
                                <Reveal delay={320} fill={false}>
                                    <div className="space-y-2">
                                        <Link
                                            href="/admin/areas"
                                            className={adminLinkClass}
                                        >
                                            <span>Kelola Wilayah</span>
                                            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                        </Link>
                                        <Link
                                            href="/laporan"
                                            className={adminLinkClass}
                                        >
                                            <span>Kelola Laporan</span>
                                            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </div>
                                </Reveal>
                            )}

                            {/* WARGA ACTION */}
                            {role === "warga" && (
                                <Reveal delay={320} fill={false}>
                                    <Link
                                        href="/laporan/create"
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-sun-400 to-sun-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-sun-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sun-500/40"
                                    >
                                        <Siren className="size-4" />
                                        Laporkan Kejadian
                                    </Link>
                                </Reveal>
                            )}

                            {/* KONTAK DARURAT */}
                            {contacts.length > 0 && (
                                <Reveal delay={400} fill={false}>
                                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                        <PanelHeader
                                            icon={Siren}
                                            tone="sun"
                                            title="Kontak Darurat"
                                            description="Hubungi petugas terkait."
                                        />
                                        <div className="mt-4 space-y-2">
                                            {contacts.slice(0, 4).map((contact) => (
                                                <a
                                                    key={contact.id}
                                                    href={`tel:${contact.phone}`}
                                                    className="block rounded-xl border border-border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10"
                                                >
                                                    <p className="text-sm font-semibold">
                                                        {contact.name}
                                                    </p>
                                                    {contact.role && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {contact.role}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-sm font-semibold text-navy-600 dark:text-navy-400">
                                                        {contact.phone}
                                                    </p>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                        </aside>

                        {/* =================================================
                            MAP
                        ================================================== */}
                        <Reveal delay={120} fill={false} plain>
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3.5">
                                    <div>
                                        <h2 className="text-sm font-semibold">
                                            Peta Kejadian
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {visibleReports.length} kejadian
                                            ditampilkan
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 animate-pulse-ring rounded-full bg-forest-500" />
                                        <span className="text-xs text-muted-foreground">
                                            Data aktif
                                        </span>
                                    </div>
                                </div>

                                <div className="relative h-[420px] sm:h-[520px] xl:h-[620px]">
                                    <DisasterMap
                                        center={center}
                                        zoom={zoom}
                                        boundary={boundary}
                                        boundaryName={
                                            area?.name ?? "Wilayah SIAGA-W"
                                        }
                                        reports={reports}
                                        types={types}
                                        zones={zones}
                                        facilities={facilities}
                                        activeTypeIds={activeTypeIds}
                                        showZones={hasZones && showZones}
                                        showFacilities={
                                            hasFacilities && showFacilities
                                        }
                                    />

                                    {/* Skeleton menutupi peta saat memuat */}
                                    {loading && (
                                        <div className="absolute inset-0 z-[1000] bg-card p-4">
                                            <div className="skeleton h-full w-full rounded-xl" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* =====================================================
                        RECENT REPORTS
                    ====================================================== */}
                    {(loading || recentReports.length > 0) && (
                        <Reveal delay={150} fill={false}>
                            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
                                    <SectionTitle
                                        title={
                                            role === "petugas"
                                                ? "Kejadian yang Perlu Diperhatikan"
                                                : "Laporan Terbaru"
                                        }
                                        description="Informasi kejadian yang tampil pada peta."
                                    />
                                    <Link
                                        href="/laporan"
                                        className="shrink-0 text-sm font-semibold text-navy-600 transition hover:text-navy-800 hover:underline dark:text-navy-400"
                                    >
                                        Lihat semua
                                    </Link>
                                </div>

                                {loading ? (
                                    <ListSkeleton />
                                ) : (
                                    <div className="divide-y divide-border">
                                        {recentReports.map((report, index) => {
                                            const type = types.find(
                                                (item) =>
                                                    item.id === report.type_id,
                                            );

                                            return (
                                                <Link
                                                    key={report.id}
                                                    href={`/laporan/${report.id}`}
                                                    className="group flex animate-fade-in-up items-center gap-3 border-l-2 border-transparent px-4 py-4 transition-all hover:border-navy-500 hover:bg-navy-50 md:px-5 dark:hover:border-navy-400 dark:hover:bg-navy-500/10"
                                                    style={
                                                        {
                                                            animationDelay: `${index * 60}ms`,
                                                        } as CSSProperties
                                                    }
                                                >
                                                    <span
                                                        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                                                        style={{
                                                            backgroundColor:
                                                                type?.color ??
                                                                "#64748b",
                                                        }}
                                                    >
                                                        <AlertTriangle className="size-5" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold">
                                                            {report.title}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {type?.name ??
                                                                "Bencana"}{" "}
                                                            •{" "}
                                                            {report.address ??
                                                                "Lokasi tidak tersedia"}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            SEVERITY_CLASS[
                                                                report.severity
                                                            ] ?? "bg-muted"
                                                        }`}
                                                    >
                                                        {SEVERITY_LABEL[
                                                            report.severity
                                                        ] ?? report.severity}
                                                    </span>
                                                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-navy-500" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </Reveal>
                    )}

                    {/* =====================================================
                        ANNOUNCEMENTS
                    ====================================================== */}
                    {announcements.length > 0 && (
                        <section>
                            <SectionTitle
                                title="Informasi & Pengumuman"
                                description="Informasi penting terkait kebencanaan."
                            />
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {loading
                                    ? Array.from({
                                          length: Math.min(
                                              announcements.length,
                                              3,
                                          ),
                                      }).map((_, i) => (
                                          <div
                                              key={i}
                                              className="h-full space-y-3 rounded-2xl border border-border bg-card p-4"
                                          >
                                              <div className="skeleton h-5 w-16 rounded-full" />
                                              <div className="skeleton h-5 w-3/4" />
                                              <div className="skeleton h-3 w-full" />
                                              <div className="skeleton h-3 w-5/6" />
                                          </div>
                                      ))
                                    : announcements.map((announcement, i) => (
                                          <Reveal
                                              key={announcement.id}
                                              delay={i * 80}
                                          >
                                              <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-md hover:shadow-navy-500/10 dark:hover:border-navy-500/40">
                                                  <span className="inline-flex rounded-full bg-navy-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-navy-800 uppercase dark:bg-navy-500/15 dark:text-navy-200">
                                                      {announcement.level}
                                                  </span>
                                                  <h3 className="mt-3 font-semibold">
                                                      {announcement.title}
                                                  </h3>
                                                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                                      {announcement.body}
                                                  </p>
                                              </div>
                                          </Reveal>
                                      ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}