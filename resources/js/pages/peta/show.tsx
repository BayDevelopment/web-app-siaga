import { Head, Link, router } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronRight,
    CircleAlert,
    Flame,
    MapPin,
    Mountain,
    ShieldAlert,
    Siren,
    TreePine,
    Waves,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
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
type Tone = "ocean" | "sun" | "forest" | "danger";

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

type Props = {
    auth: {
        user: User;
    };
    area: Area;
    areas: AreaOption[];
    boundary: MapBoundary | null;
    center: [number, number];
    zoom: number;
    reports: MapReport[];
    types: MapType[];
    zones: MapZone[];
    facilities: MapFacility[];
    stats: Stats;
};

/* ---------- Konstanta ---------- */

const TYPE_ICON = {
    banjir: Waves,
    kebakaran: Flame,
    karhutla: Flame,
    longsor: Mountain,
    "pohon-tumbang": TreePine,
} as const;

/* Warna ikon mengikuti palet logo */
const toneClass: Record<Tone, string> = {
    ocean:
        "bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400",
    sun: "bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300",
    forest:
        "bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

const FALLBACK_TYPE_COLOR = "#64748b";

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
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-8 w-14" />
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
                <div key={i} className="flex items-center gap-3 p-4">
                    <div className="skeleton size-10 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- Komponen UI ---------- */

function StatCard({
    title,
    value,
    icon: Icon,
    tone,
}: {
    title: string;
    value: number | string;
    icon: typeof AlertTriangle;
    tone: Tone;
}) {
    return (
        <div className="group h-full rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 dark:hover:border-navy-500/40">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${toneClass[tone]}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function PanelTitle({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
            <div>
                <h2 className="font-semibold text-foreground">{title}</h2>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
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
                className="size-4 accent-primary"
                checked={hasData && checked}
                disabled={!hasData}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}

/* ---------- Halaman ---------- */

export default function PetaShow({
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
    stats,
}: Props) {
    const role = auth.user.role;
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
        setActiveTypeIds(types.map((type) => type.id));
    }, [types]);

    useEffect(() => {
        setShowZones(hasZones);
    }, [hasZones]);

    useEffect(() => {
        setShowFacilities(hasFacilities);
    }, [hasFacilities]);

    const visibleReports = useMemo(
        () =>
            reports.filter((report) => activeTypeIds.includes(report.type_id)),
        [reports, activeTypeIds],
    );

    const toggleType = (id: number) => {
        setActiveTypeIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const changeArea = (slug: string) => {
        if (!slug) {
            router.get("/peta", {}, { preserveScroll: true });
            return;
        }
        router.get(`/peta/${slug}`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Peta ${area.name}`} />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/20 dark:bg-navy-500/10" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/20 dark:bg-sun-500/10" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/15 dark:bg-forest-500/10" />
                </div>

                <div className="relative mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
                        <div className="blob -top-16 -right-12 h-56 w-56 animate-blob bg-sun-400/10 dark:bg-sun-500/10" />
                        <div className="blob -bottom-20 left-1/3 h-56 w-56 animate-blob-slow bg-sea-400/10 dark:bg-sea-500/10" />
                        <div className="blob -bottom-12 -left-8 h-44 w-44 animate-blob bg-forest-500/10 dark:bg-forest-500/10" />

                        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <Link
                                    href="/peta"
                                    className="group mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                                    Kembali ke peta utama
                                </Link>

                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-navy-50 p-2.5 text-navy-600 shadow-sm dark:bg-navy-500/15 dark:text-navy-300">
                                        <MapPin className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
                                            {area.name}
                                        </h1>
                                        <p className="text-sm text-muted-foreground">
                                            Peta kejadian dan kondisi
                                            kebencanaan
                                            {area.parent && ` • ${area.parent}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <span className="w-fit rounded-full border border-forest-200 bg-forest-50 px-3 py-1.5 text-xs font-medium capitalize text-forest-600 dark:border-forest-500/30 dark:bg-forest-500/10 dark:text-forest-300">
                                {role}
                            </span>
                        </div>
                    </section>

                    {/* =====================================================
                        AREA SELECTOR
                    ====================================================== */}
                    <Reveal fill={false}>
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <PanelTitle
                                    title="Pilih Wilayah"
                                    description="Berpindah ke wilayah lain."
                                />

                                <div className="w-full md:w-80">
                                    <select
                                        value={area.slug ?? ""}
                                        onChange={(event) =>
                                            changeArea(event.target.value)
                                        }
                                        disabled={areas.length === 0}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-primary/40"
                                    >
                                        <option value="">
                                            Semua wilayah
                                        </option>
                                        {areas.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.slug}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>

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
                            </div>
                        </div>
                    </Reveal>

                    {/* =====================================================
                        STATS
                    ====================================================== */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                  <StatCardSkeleton key={i} />
                              ))
                            : (
                                  [
                                      {
                                          title: "Kejadian Aktif",
                                          value: stats.active_reports,
                                          icon: AlertTriangle,
                                          tone: "danger" as Tone,
                                      },
                                      {
                                          title: "Sedang Ditangani",
                                          value: stats.handling_reports,
                                          icon: Siren,
                                          tone: "sun" as Tone,
                                      },
                                      {
                                          title: "Zona Rawan",
                                          value: zones.length,
                                          icon: ShieldAlert,
                                          tone: "ocean" as Tone,
                                      },
                                      {
                                          title: "Fasilitas",
                                          value: stats.total_facilities,
                                          icon: Building2,
                                          tone: "forest" as Tone,
                                      },
                                  ]
                              ).map((card, i) => (
                                  <Reveal key={card.title} delay={i * 80}>
                                      <StatCard {...card} />
                                  </Reveal>
                              ))}
                    </div>

                    {/* =====================================================
                        CONTENT
                    ====================================================== */}
                    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                        {/* =================================================
                            SIDEBAR / FILTER
                        ================================================== */}
                        <aside className="space-y-4">
                            {/* FILTER BENCANA */}
                            <Reveal delay={100} fill={false}>
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                                    <PanelTitle title="Filter Bencana" />

                                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                        {types.map((type) => {
                                            const Icon =
                                                TYPE_ICON[
                                                    type.slug as keyof typeof TYPE_ICON
                                                ] ?? AlertTriangle;
                                            const active =
                                                activeTypeIds.includes(
                                                    type.id,
                                                );

                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleType(type.id)
                                                    }
                                                    aria-pressed={active}
                                                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                                                        active
                                                            ? "border-primary/30 bg-primary/5"
                                                            : "border-border opacity-50"
                                                    }`}
                                                >
                                                    <span
                                                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
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
                                                        className={`size-3 rounded-full transition-colors ${
                                                            active
                                                                ? "bg-forest-500"
                                                                : "border border-border"
                                                        }`}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Reveal>

                            {/* LAYER PETA */}
                            <Reveal delay={180} fill={false}>
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                                    <PanelTitle title="Layer Peta" />

                                    <div className="mt-4 space-y-2">
                                        <LayerToggle
                                            label="Zona rawan"
                                            hasData={hasZones}
                                            checked={showZones}
                                            onChange={setShowZones}
                                        />
                                        <LayerToggle
                                            label="Fasilitas"
                                            hasData={hasFacilities}
                                            checked={showFacilities}
                                            onChange={setShowFacilities}
                                        />
                                    </div>
                                </div>
                            </Reveal>

                            {/* DAFTAR KEJADIAN */}
                            <Reveal delay={150} fill={false}>
                                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                    <div className="border-b border-border p-4">
                                        <PanelTitle
                                            title={`Kejadian di ${area.name}`}
                                            description={`${visibleReports.length} kejadian tampil.`}
                                        />
                                    </div>

                                    {loading ? (
                                        <ListSkeleton />
                                    ) : visibleReports.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="mx-auto flex size-14 animate-float items-center justify-center rounded-full bg-navy-100 text-navy-500 dark:bg-navy-500/15 dark:text-navy-300">
                                                <MapPin className="size-7" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium">
                                                Belum ada kejadian
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-h-80 divide-y divide-border overflow-y-auto">
                                            {visibleReports.map(
                                                (report, index) => {
                                                    const type = types.find(
                                                        (item) =>
                                                            item.id ===
                                                            report.type_id,
                                                    );

                                                    return (
                                                        <Link
                                                            key={report.id}
                                                            href={`/laporan/${report.id}`}
                                                            className="group flex animate-fade-in-up items-center gap-3 p-3 transition-colors hover:bg-navy-50 dark:hover:bg-navy-500/10"
                                                            style={
                                                                {
                                                                    animationDelay: `${Math.min(index, 8) * 50}ms`,
                                                                } as CSSProperties
                                                            }
                                                        >
                                                            <span
                                                                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                                                                style={{
                                                                    backgroundColor:
                                                                        type?.color ??
                                                                        FALLBACK_TYPE_COLOR,
                                                                }}
                                                            >
                                                                <AlertTriangle className="size-5" />
                                                            </span>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold">
                                                                    {
                                                                        report.title
                                                                    }
                                                                </p>
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {type?.name ??
                                                                        "Bencana"}{" "}
                                                                    •{" "}
                                                                    {report.address ??
                                                                        "Lokasi tidak tersedia"}
                                                                </p>
                                                            </div>

                                                            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-navy-500" />
                                                        </Link>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Reveal>

                            {/* WARGA ACTION */}
                            {role === "warga" && (
                                <Reveal delay={260} fill={false}>
                                    <Link
                                        href="/laporan/create"
                                        className="group flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-sun-400 to-sun-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sun-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sun-500/40 dark:from-sun-500 dark:to-sun-700 dark:shadow-sun-900/40"
                                    >
                                        <Siren className="size-4" />
                                        Laporkan Kejadian
                                    </Link>
                                </Reveal>
                            )}
                        </aside>

                        {/* =================================================
                            MAP
                        ================================================== */}
                        <Reveal delay={120} fill={false} plain>
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="h-[420px] sm:h-[520px] xl:h-[650px]">
                                    <DisasterMap
                                        center={center}
                                        zoom={zoom}
                                        boundary={boundary}
                                        boundaryName={area.name}
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
                                </div>

                                {/* Skeleton menutupi peta saat memuat */}
                                {loading && (
                                    <div className="absolute inset-0 z-[1000] bg-card p-4">
                                        <div className="skeleton h-full w-full rounded-xl" />
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </div>
            </div>
        </>
    );
}