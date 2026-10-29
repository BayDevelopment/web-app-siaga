import { Head, Link, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    Info,
    MapPin,
    Save,
    TriangleAlert,
} from "lucide-react";
import { useMemo, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { getMapIcon } from "@/components/map/map-icons";
import PointPicker, { type PointGeo } from "@/components/point-picker-area-map";

/* ---------- Tipe ---------- */

type DisasterType = {
    id: number;
    name: string;
    slug: string;
    color: string;
    icon?: string | null;
};

type Area = {
    id: number;
    name: string;
    type: string;
    parent_id: number | null;
    center_lat?: number | string | null;
    center_lng?: number | string | null;
    boundary_geojson?: unknown;
};

type ZoneData = {
    id: number;
    disaster_type_id: number | null;
    area_id: number | null;
    name: string;
    level: "low" | "medium" | "high";
    description: string | null;
    radius_m: number | null;
    geojson: { type: string; coordinates: unknown } | null;
};

type Props = {
    zone: ZoneData;
    types: DisasterType[];
    areas: Area[];
};

type Level = "low" | "medium" | "high";

type FormData = {
    disaster_type_id: string;
    area_id: string;
    name: string;
    level: Level;
    description: string;
    geojson: string;
    radius_m: string;
};

/* ---------- Konstanta ---------- */

const LEVELS: {
    key: Level;
    label: string;
    hint: string;
    active: string;
    dot: string;
}[] = [
    {
        key: "low",
        label: "Rendah",
        hint: "Jarang terjadi",
        active: "border-forest-500 bg-forest-50 dark:bg-forest-500/10",
        dot: "bg-forest-500",
    },
    {
        key: "medium",
        label: "Sedang",
        hint: "Kadang terjadi",
        active: "border-sun-500 bg-sun-50 dark:bg-sun-500/10",
        dot: "bg-sun-500",
    },
    {
        key: "high",
        label: "Tinggi",
        hint: "Sering terjadi",
        active: "border-red-500 bg-red-50 dark:bg-red-500/10",
        dot: "bg-red-500",
    },
];

const RADIUS_PRESETS = [50, 100, 250, 500, 1000];

const FALLBACK_COLOR = "#64748b";

const inputClass =
    "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-sea-400 focus:ring-2 focus:ring-sea-500/15 dark:focus:border-sea-500 dark:focus:ring-sea-400/20";

/* ---------- Komponen UI ---------- */

function Field({
    label,
    htmlFor,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={htmlFor} className="text-sm font-semibold">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function SectionTitle({
    title,
    subtitle,
}: {
    title: string;
    subtitle: string;
}) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
            <div>
                <h2 className="text-sm font-bold">{title}</h2>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function HazardZoneEdit({ zone, types, areas }: Props) {
    const isLegacyShape = !!zone.geojson && zone.geojson.type !== "Point";

    const { data, setData, put, processing, errors } = useForm<FormData>({
        disaster_type_id: zone.disaster_type_id
            ? String(zone.disaster_type_id)
            : "",
        area_id: zone.area_id ? String(zone.area_id) : "",
        name: zone.name,
        level: zone.level,
        description: zone.description ?? "",
        geojson:
            zone.geojson?.type === "Point"
                ? JSON.stringify(zone.geojson)
                : "",
        radius_m: zone.radius_m ? String(zone.radius_m) : "",
    });

    const areaOptions = useMemo(
        () =>
            areas.map((area) => ({
                ...area,
                label:
                    area.type === "rw"
                        ? `RW — ${area.name}`
                        : area.type === "rt"
                          ? `RT — ${area.name}`
                          : area.name,
            })),
        [areas],
    );

    const selectedType = useMemo(
        () => types.find((type) => String(type.id) === data.disaster_type_id),
        [types, data.disaster_type_id],
    );

    const markerColor = selectedType?.color ?? FALLBACK_COLOR;
    const PreviewIcon = getMapIcon(selectedType?.icon);

    const point: PointGeo | null = useMemo(() => {
        if (!data.geojson) return null;

        try {
            const parsed = JSON.parse(data.geojson) as PointGeo;
            return parsed.type === "Point" ? parsed : null;
        } catch {
            return null;
        }
    }, [data.geojson]);

    const latitude = point?.coordinates?.[1] ?? "";
    const longitude = point?.coordinates?.[0] ?? "";

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!data.name.trim()) {
            toast.error("Nama zona wajib diisi.");
            return;
        }

        if (!data.disaster_type_id) {
            toast.error("Silakan pilih jenis bencana.");
            return;
        }

        if (!point) {
            toast.warning(
                "Tentukan titik lokasi pada peta terlebih dahulu.",
            );
            return;
        }

        put(`/admin/hazard-zones/${zone.id}`, {
            onSuccess: () => toast.success("Zona rawan berhasil diperbarui."),
            onError: () =>
                toast.error(
                    "Zona rawan gagal diperbarui. Periksa data yang diisi.",
                ),
        });
    };

    return (
        <>
            <Head title="Edit Zona Rawan" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6">
                {/* =====================================================
                    HERO
                ====================================================== */}
                <div className="animate-fade-in relative overflow-hidden rounded-3xl border border-border bg-card p-5 text-foreground shadow-sm md:p-6">
                    <div className="blob -top-16 -right-10 size-48 animate-blob bg-sea-400/10 dark:bg-sea-500/10" />
                    <div className="blob -bottom-20 left-1/3 size-44 animate-blob-slow bg-sun-400/10 dark:bg-sun-500/10" />

                    <div className="relative flex items-center gap-4">
                        <Link
                            href="/admin/hazard-zones"
                            aria-label="Kembali"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>

                        <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-sun-100 text-sun-600 ring-1 ring-sun-200 dark:bg-sun-500/10 dark:text-sun-400 dark:ring-sun-500/20 sm:flex">
                            <TriangleAlert className="size-6" />
                        </span>

                        <div className="min-w-0">
                            <h1 className="text-lg font-bold md:text-xl">
                                Edit Zona Rawan
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Perbarui data titik rawan &quot;{zone.name}
                                &quot;.
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid min-w-0 gap-6 lg:grid-cols-3"
                >
                    {/* =================================================
                        KOLOM UTAMA
                    ================================================== */}
                    <div className="min-w-0 space-y-6 lg:col-span-2">
                        {/* INFORMASI ZONA */}
                        <section className="animate-fade-in-up min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
                            <SectionTitle
                                title="Informasi Zona"
                                subtitle="Data dasar titik rawan."
                            />

                            <div className="space-y-5">
                                <Field
                                    label="Nama zona"
                                    htmlFor="name"
                                    required
                                    error={errors.name}
                                >
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        placeholder="Contoh: Titik Rawan Banjir Jembatan Kali"
                                        className={inputClass}
                                    />
                                </Field>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field
                                        label="Jenis bencana"
                                        htmlFor="disaster_type_id"
                                        required
                                        error={errors.disaster_type_id}
                                    >
                                        <select
                                            id="disaster_type_id"
                                            value={data.disaster_type_id}
                                            onChange={(e) =>
                                                setData(
                                                    "disaster_type_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="">
                                                Pilih jenis bencana
                                            </option>
                                            {types.map((type) => (
                                                <option
                                                    key={type.id}
                                                    value={type.id}
                                                >
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field
                                        label="Wilayah"
                                        htmlFor="area_id"
                                        hint="Kosongkan jika berlaku umum."
                                        error={errors.area_id}
                                    >
                                        <select
                                            id="area_id"
                                            value={data.area_id}
                                            onChange={(e) =>
                                                setData(
                                                    "area_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="">
                                                Zona umum / semua wilayah
                                            </option>
                                            {areaOptions.map((area) => (
                                                <option
                                                    key={area.id}
                                                    value={area.id}
                                                >
                                                    {area.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                <Field
                                    label="Tingkat risiko"
                                    error={errors.level}
                                >
                                    <div className="grid grid-cols-3 gap-3">
                                        {LEVELS.map((level) => {
                                            const selected =
                                                data.level === level.key;

                                            return (
                                                <button
                                                    key={level.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            "level",
                                                            level.key,
                                                        )
                                                    }
                                                    aria-pressed={selected}
                                                    className={`rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 ${
                                                        selected
                                                            ? level.active
                                                            : "border-border bg-background hover:border-navy-200 hover:bg-muted/50 dark:hover:border-navy-500/30"
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                                        <span
                                                            className={`size-2.5 rounded-full ${level.dot}`}
                                                        />
                                                        {level.label}
                                                    </span>
                                                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                        {level.hint}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Field>

                                <Field
                                    label="Deskripsi"
                                    htmlFor="description"
                                    error={errors.description}
                                >
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Jelaskan kondisi atau karakteristik titik rawan..."
                                        className={`${inputClass} resize-none`}
                                    />
                                </Field>
                            </div>
                        </section>

                        {/* LOKASI DI PETA — satu card, parent yang bungkus */}
                        <section className="animate-fade-in-up min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 [animation-delay:100ms] hover:shadow-md md:p-6">
                            <SectionTitle
                                title="Lokasi di Peta"
                                subtitle="Klik peta atau gunakan lokasi saya."
                            />

                            {isLegacyShape && !point && (
                                <div className="mb-4 rounded-xl border border-sun-400/50 bg-sun-50 p-3 text-xs text-sun-600 dark:border-sun-500/30 dark:bg-sun-500/10 dark:text-sun-300">
                                    Zona ini masih berbentuk polygon (data
                                    lama). Tentukan satu titik baru pada peta
                                    untuk menggantinya.
                                </div>
                            )}

                            <PointPicker
                                areas={areaOptions}
                                areaId={data.area_id}
                                latitude={latitude}
                                longitude={longitude}
                                onChange={(geo) =>
                                    setData(
                                        "geojson",
                                        geo ? JSON.stringify(geo) : "",
                                    )
                                }
                                error={errors.geojson}
                            />

                            <div className="mt-5 space-y-3 border-t border-border pt-5">
                                <Field
                                    label="Radius area terdampak (meter)"
                                    htmlFor="radius_m"
                                    hint="Opsional. Tampil sebagai lingkaran di sekitar titik pada peta kejadian."
                                    error={errors.radius_m}
                                >
                                    <input
                                        id="radius_m"
                                        type="number"
                                        min={10}
                                        max={50000}
                                        value={data.radius_m}
                                        onChange={(e) =>
                                            setData(
                                                "radius_m",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: 250"
                                        className={inputClass}
                                    />
                                </Field>

                                <div className="flex flex-wrap gap-2">
                                    {RADIUS_PRESETS.map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "radius_m",
                                                    String(value),
                                                )
                                            }
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                                data.radius_m === String(value)
                                                    ? "bg-navy-600 text-white shadow-sm dark:bg-navy-400 dark:text-navy-950"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                            }`}
                                        >
                                            {value >= 1000
                                                ? `${value / 1000} km`
                                                : `${value} m`}
                                        </button>
                                    ))}

                                    {data.radius_m && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData("radius_m", "")
                                            }
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground underline"
                                        >
                                            Tanpa radius
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* =================================================
                        SIDEBAR
                    ================================================== */}
                    <div className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
                        <aside className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 [animation-delay:150ms] hover:shadow-md">
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Tampilan di peta
                            </p>

                            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3">
                                <span
                                    className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-background text-white shadow-sm transition-colors"
                                    style={{ backgroundColor: markerColor }}
                                >
                                    <PreviewIcon className="size-5" />
                                </span>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {data.name || "Nama zona"}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {selectedType?.name ??
                                            "Pilih jenis bencana"}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-muted-foreground">
                                Warna dan ikon mengikuti jenis bencana yang
                                dipilih.
                            </p>

                            <div className="mt-5 space-y-3 border-t border-border pt-5">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sun-500 px-4 py-3 text-sm font-semibold text-navy-950 shadow-sm shadow-sun-500/20 transition hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-sun-500 disabled:hover:shadow-sm dark:bg-sun-400 dark:hover:bg-sun-300"
                                >
                                    <Save className="size-4" />
                                    {processing
                                        ? "Menyimpan..."
                                        : "Simpan Perubahan"}
                                </button>

                                <Link
                                    href="/admin/hazard-zones"
                                    className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted dark:hover:bg-muted/80"
                                >
                                    Batal
                                </Link>
                            </div>
                        </aside>

                        <div className="animate-fade-in-up rounded-2xl border border-sea-200 bg-sea-50 p-5 [animation-delay:200ms] dark:border-sea-500/30 dark:bg-sea-500/10">
                            <div className="flex gap-3">
                                <Info className="mt-0.5 size-5 shrink-0 text-sea-600 dark:text-sea-400" />
                                <div>
                                    <h3 className="text-sm font-semibold text-sea-800 dark:text-sea-200">
                                        Titik, bukan polygon
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-sea-800/80 dark:text-sea-200/80">
                                        Cukup satu titik. Tambahkan radius bila
                                        area terdampak perlu terlihat sebagai
                                        lingkaran. Batas wilayah tetap memakai
                                        polygon di menu Wilayah.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
                            <MapPin className="size-3.5" />
                            Format tersimpan: GeoJSON Point [lng, lat]
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

HazardZoneEdit.layout = {
    breadcrumbs: [
        { title: "Zona Rawan", href: "/admin/hazard-zones" },
    ],
};