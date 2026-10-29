import { Head, Link, router } from "@inertiajs/react";
import {
    Edit,
    Map as MapIcon,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
    X,
    type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ---------- Tipe ---------- */

type DisasterType = {
    id: number;
    name: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    type: string;
};

type Level = "low" | "medium" | "high";

type HazardZone = {
    id: number;
    name: string;
    level: Level;
    description: string | null;
    geojson: {
        type: string;
        coordinates: unknown;
    } | null;
    disaster_type: DisasterType | null;
    area: Area | null;
    created_at: string | null;
};

type Props = {
    zones?: HazardZone[] | null;
};

type LevelFilter = "all" | Level;

/* ---------- Konstanta ---------- */

const EMPTY_ZONES: HazardZone[] = [];

const FOCUS_RING =
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const levelConfig: Record<
    Level,
    { label: string; badge: string; dot: string; stat: string; bar: string }
> = {
    low: {
        label: "Rendah",
        badge: "bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-300",
        dot: "bg-forest-500",
        stat: "bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-300",
        bar: "bg-forest-500",
    },
    medium: {
        label: "Sedang",
        badge: "bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300",
        dot: "bg-sun-500",
        stat: "bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300",
        bar: "bg-sun-500",
    },
    high: {
        label: "Tinggi",
        badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        dot: "bg-red-500",
        stat: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
        bar: "bg-red-500",
    },
};

const FILTERS: { key: LevelFilter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "high", label: "Tinggi" },
    { key: "medium", label: "Sedang" },
    { key: "low", label: "Rendah" },
];

/* ---------- Komponen kecil (di luar komponen halaman agar tidak di-remount) ---------- */

function StatCard({
    label,
    value,
    description,
    icon: Icon,
    toneClass,
    valueClass,
    delay,
}: {
    label: string;
    value: number;
    description: string;
    icon: LucideIcon;
    toneClass: string;
    valueClass?: string;
    delay: number;
}) {
    return (
        <div
            className="group h-full animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-500/10 dark:hover:border-navy-500/40"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={`mt-1 text-3xl font-bold tracking-tight ${valueClass ?? "text-foreground"}`}
                    >
                        {value}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${toneClass}`}
                >
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

function LevelBadge({ level }: { level: Level }) {
    const config = levelConfig[level];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
        >
            <span className={`size-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}

function DisasterCell({ zone }: { zone: HazardZone }) {
    if (!zone.disaster_type) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <div className="flex items-center gap-2">
            <span
                className="size-3 shrink-0 rounded-full ring-2 ring-card"
                style={{ backgroundColor: zone.disaster_type.color }}
            />
            <span>{zone.disaster_type.name}</span>
        </div>
    );
}

function ShapeBadge({ zone }: { zone: HazardZone }) {
    if (!zone.geojson?.type) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
            <MapIcon className="size-3.5" />
            {zone.geojson.type}
        </span>
    );
}

function ActionButtons({
    zone,
    onDelete,
}: {
    zone: HazardZone;
    onDelete: (zone: HazardZone) => void;
}) {
    return (
        <div className="flex justify-end gap-2">
            <Link
                href={`/admin/hazard-zones/${zone.id}/edit`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-300 ${FOCUS_RING}`}
            >
                <Edit className="size-3.5" />
                Edit
            </Link>

            <button
                type="button"
                onClick={() => onDelete(zone)}
                aria-label={`Hapus ${zone.name}`}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-300 ${FOCUS_RING}`}
            >
                <Trash2 className="size-3.5" />
                Hapus
            </button>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function HazardZonesIndex({ zones: zonesProp }: Props) {
    // Inertia bisa mengirim null / tidak mengirim prop sama sekali.
    const zones = zonesProp ?? EMPTY_ZONES;

    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

    const counts = useMemo(
        () => ({
            total: zones.length,
            high: zones.filter((zone) => zone.level === "high").length,
            medium: zones.filter((zone) => zone.level === "medium").length,
            low: zones.filter((zone) => zone.level === "low").length,
        }),
        [zones],
    );

    const filteredZones = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return zones.filter((zone) => {
            if (levelFilter !== "all" && zone.level !== levelFilter) {
                return false;
            }
            if (!keyword) return true;

            return (
                zone.name.toLowerCase().includes(keyword) ||
                zone.disaster_type?.name.toLowerCase().includes(keyword) ||
                zone.area?.name.toLowerCase().includes(keyword) ||
                levelConfig[zone.level].label.toLowerCase().includes(keyword)
            );
        });
    }, [zones, search, levelFilter]);

    const handleDelete = (zone: HazardZone) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus zona rawan "${zone.name}"?`,
        );
        if (!confirmed) return;

        router.delete(`/admin/hazard-zones/${zone.id}`, {
            preserveScroll: true,
        });
    };

    const isFiltering = search.trim() !== "" || levelFilter !== "all";

    return (
        <>
            <Head title="Zona Rawan" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 -left-24 size-72 rounded-full bg-navy-400/5 blur-3xl dark:bg-navy-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-sea-400/5 blur-3xl dark:bg-sea-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-forest-400/5 blur-3xl dark:bg-forest-500/10"
                />

                <div className="relative mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-8">
                    {/* =====================================================
                        HERO
                    ====================================================== */}
                    <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
                        <div className="blob -top-16 -right-10 size-64 animate-blob bg-sea-400/20 dark:bg-sea-500/10" />
                        <div className="blob -bottom-20 left-1/3 size-56 animate-blob-slow bg-sun-400/15 dark:bg-sun-500/10" />
                        <div className="blob top-1/2 right-1/4 size-40 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="flex size-14 shrink-0 animate-float items-center justify-center rounded-2xl bg-navy-100 text-navy-600 ring-1 ring-navy-200 dark:bg-navy-500/15 dark:text-navy-300 dark:ring-navy-500/30">
                                    <TriangleAlert className="size-7" />
                                </span>

                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-navy-600 uppercase dark:text-navy-400">
                                        Manajemen Kebencanaan
                                    </p>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                        Zona Rawan
                                    </h1>
                                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                        Kelola wilayah yang memiliki potensi
                                        risiko bencana dan pantau tingkat
                                        kerawanannya.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/admin/hazard-zones/create"
                                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md dark:bg-sun-400 dark:hover:bg-sun-300 ${FOCUS_RING}`}
                            >
                                <Plus className="size-4" />
                                Tambah Zona
                            </Link>
                        </div>
                    </section>

                    {/* =====================================================
                        STATISTIK
                    ====================================================== */}
                    <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Total Zona"
                            value={counts.total}
                            description="Zona terdaftar"
                            icon={MapIcon}
                            toneClass="bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400"
                            delay={0}
                        />
                        <StatCard
                            label="Risiko Tinggi"
                            value={counts.high}
                            description="Prioritas tinggi"
                            icon={TriangleAlert}
                            toneClass="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                            valueClass="text-red-600 dark:text-red-400"
                            delay={70}
                        />
                        <StatCard
                            label="Risiko Sedang"
                            value={counts.medium}
                            description="Prioritas sedang"
                            icon={TriangleAlert}
                            toneClass="bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300"
                            valueClass="text-sun-600 dark:text-sun-400"
                            delay={140}
                        />
                        <StatCard
                            label="Risiko Rendah"
                            value={counts.low}
                            description="Prioritas rendah"
                            icon={TriangleAlert}
                            toneClass="bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-300"
                            valueClass="text-forest-600 dark:text-forest-400"
                            delay={210}
                        />
                    </section>

                    {/* =====================================================
                        DAFTAR ZONA
                    ====================================================== */}
                    <section className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:260ms]">
                        {/* Toolbar */}
                        <div className="flex flex-col gap-4 border-b border-border p-4 md:p-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Daftar Zona Rawan
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Menampilkan {filteredZones.length} dari{" "}
                                        {zones.length} zona
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                                <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Cari zona, bencana, wilayah..."
                                        aria-label="Cari zona rawan"
                                        className="h-10 w-full rounded-xl border border-border bg-background pr-9 pl-9 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 dark:focus:ring-navy-400/30"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch("")}
                                            aria-label="Hapus pencarian"
                                            className={`absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground ${FOCUS_RING}`}
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div
                                    role="tablist"
                                    aria-label="Filter tingkat risiko"
                                    className="flex overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
                                >
                                    {FILTERS.map((filter) => {
                                        const active =
                                            levelFilter === filter.key;
                                        return (
                                            <button
                                                key={filter.key}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() =>
                                                    setLevelFilter(filter.key)
                                                }
                                                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${FOCUS_RING} ${
                                                    active
                                                        ? "bg-card text-navy-600 shadow-sm dark:text-navy-300"
                                                        : "text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                {filter.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Konten */}
                        {filteredZones.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="flex size-16 animate-float items-center justify-center rounded-2xl bg-sun-100 text-sun-600 ring-1 ring-sun-200 dark:bg-sun-500/15 dark:text-sun-300 dark:ring-sun-500/20">
                                    <TriangleAlert className="size-8" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-foreground">
                                    {isFiltering
                                        ? "Zona tidak ditemukan"
                                        : "Belum ada zona rawan"}
                                </h3>
                                <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                                    {isFiltering
                                        ? "Coba ubah kata kunci atau filter tingkat risiko."
                                        : "Tambahkan zona rawan untuk menampilkannya pada peta kejadian."}
                                </p>
                                {!isFiltering && (
                                    <Link
                                        href="/admin/hazard-zones/create"
                                        className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${FOCUS_RING}`}
                                    >
                                        <Plus className="size-4" />
                                        Tambah Zona
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobile: kartu */}
                                <ul className="divide-y divide-border lg:hidden">
                                    {filteredZones.map((zone) => (
                                        <li
                                            key={zone.id}
                                            className="group p-4 transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-500/10"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {zone.name}
                                                    </p>
                                                    {zone.description && (
                                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                            {zone.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <LevelBadge
                                                    level={zone.level}
                                                />
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <DisasterCell zone={zone} />
                                                <span>
                                                    {zone.area
                                                        ? `${zone.area.name} (${zone.area.type.toUpperCase()})`
                                                        : "Global"}
                                                </span>
                                                <ShapeBadge zone={zone} />
                                            </div>

                                            <div className="mt-3">
                                                <ActionButtons
                                                    zone={zone}
                                                    onDelete={handleDelete}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto lg:block">
                                    <table
                                        className="w-full text-left text-sm"
                                        aria-label="Daftar zona rawan"
                                    >
                                        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Zona
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Jenis Bencana
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Wilayah
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Tingkat Risiko
                                                </th>
                                                <th className="px-5 py-3.5 font-semibold">
                                                    Bentuk
                                                </th>
                                                <th className="px-5 py-3.5 text-right font-semibold">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-border">
                                            {filteredZones.map((zone) => (
                                                <tr
                                                    key={zone.id}
                                                    className="group transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-500/10"
                                                >
                                                    <td className="relative px-5 py-4">
                                                        <span
                                                            aria-hidden
                                                            className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${levelConfig[zone.level].bar}`}
                                                        />
                                                        <p className="font-semibold text-foreground">
                                                            {zone.name}
                                                        </p>
                                                        {zone.description && (
                                                            <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                                                {
                                                                    zone.description
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <DisasterCell
                                                            zone={zone}
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {zone.area ? (
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {
                                                                        zone.area
                                                                            .name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground uppercase">
                                                                    {
                                                                        zone.area
                                                                            .type
                                                                    }
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                                Global
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <LevelBadge
                                                            level={zone.level}
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <ShapeBadge
                                                            zone={zone}
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <ActionButtons
                                                            zone={zone}
                                                            onDelete={
                                                                handleDelete
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}