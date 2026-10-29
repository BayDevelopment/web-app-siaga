import { Head, Link, router } from "@inertiajs/react";

import { ArrowLeft, Building2, LoaderCircle, MapPin, Save } from "lucide-react";

import {
    useEffect,
    useState,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from "react";

type Area = {
    id: number;
    name: string;
    type: string;
};

type Facility = {
    id: number;
    area_id: number | null;
    name: string;
    type: string;
    latitude: number | string;
    longitude: number | string;
    address: string | null;
    capacity: number | null;
    contact_phone: string | null;
    is_active: boolean;
};

type Props = {
    facility: Facility;
    areas: Area[];
};

const facilityTypes = [
    {
        value: "evacuation_point",
        label: "Titik Evakuasi",
    },
    {
        value: "posko",
        label: "Posko",
    },
    {
        value: "hydrant",
        label: "Hidran",
    },
    {
        value: "fire_post",
        label: "Pos Damkar",
    },
    {
        value: "clinic",
        label: "Klinik",
    },
];

/* ---------- Helper animasi & skeleton ---------- */

function Reveal({
    children,
    delay = 0,
    className = "",
    fill = true,
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
    fill?: boolean;
}) {
    return (
        <div
            className={`${fill ? "h-full" : ""} animate-fade-in-up ${className}`}
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

function useFakeLoading(ms = 650) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoading(false);
        }, ms);

        return () => window.clearTimeout(timer);
    }, [ms]);

    return loading;
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
                <div className="flex items-center gap-3">
                    <div className="skeleton size-11 rounded-xl" />

                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-5 w-40" />
                        <div className="skeleton h-3.5 w-64 max-w-full" />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
                {Array.from({ length: rows }).map((_, index) => (
                    <div
                        key={index}
                        className={
                            index === 0 || index === 3
                                ? "space-y-2 md:col-span-2"
                                : "space-y-2"
                        }
                    >
                        <div className="skeleton h-3.5 w-28" />
                        <div className="skeleton h-11 w-full" />

                        {index === 2 && <div className="skeleton h-3 w-40" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={4} />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-6">
                    <div className="skeleton h-5 w-44" />
                    <div className="mt-2 skeleton h-3.5 w-64 max-w-full" />
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-20" />
                        <div className="skeleton h-11 w-full" />
                        <div className="skeleton h-3 w-40" />
                    </div>

                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-28" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="md:col-span-2">
                        <div className="skeleton h-11 w-full" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <div className="skeleton h-11 w-full sm:w-28" />
                <div className="skeleton h-11 w-full sm:w-40" />
            </div>
        </div>
    );
}

/* ---------- UI helper ---------- */

const inputBaseClass =
    "w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-4";

const inputNormalClass =
    "border-border focus:border-navy-500 focus:ring-navy-500/10";

const inputErrorClass =
    "border-red-400 focus:border-red-500 focus:ring-red-500/10";

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            {message}
        </p>
    );
}

export default function FacilityEdit({ facility, areas }: Props) {
    const [form, setForm] = useState({
        area_id: facility.area_id ? String(facility.area_id) : "",
        name: facility.name,
        type: facility.type,
        latitude: String(facility.latitude),
        longitude: String(facility.longitude),
        address: facility.address ?? "",
        capacity: facility.capacity !== null ? String(facility.capacity) : "",
        contact_phone: facility.contact_phone ?? "",
        is_active: facility.is_active,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const loading = useFakeLoading(650);

    const updateField = (field: keyof typeof form, value: string | boolean) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setErrors({});
        setProcessing(true);

        router.put(
            `/admin/facilities/${facility.id}`,
            {
                area_id: form.area_id || null,
                name: form.name,
                type: form.type,
                latitude: form.latitude,
                longitude: form.longitude,
                address: form.address || null,
                capacity: form.capacity || null,
                contact_phone: form.contact_phone || null,
                is_active: form.is_active,
            },
            {
                onError: (validationErrors) => {
                    setErrors(validationErrors as Record<string, string>);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const inputClass = (field: string) =>
        `${inputBaseClass} ${
            errors[field] ? inputErrorClass : inputNormalClass
        }`;

    return (
        <>
            <Head title="Edit Fasilitas Darurat" />

            <div className="relative min-h-full overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/15" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/15" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/10" />
                </div>

                <div className="relative flex flex-col gap-6 p-4 md:p-6">
                    {/* HEADER */}
                    <Reveal delay={0}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Link
                                href="/admin/facilities"
                                aria-label="Kembali ke fasilitas darurat"
                                className="group flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-x-0.5 hover:border-navy-300 hover:bg-navy-50 hover:text-navy-600 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 dark:hover:text-navy-300"
                            >
                                <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                            </Link>

                            <div className="min-w-0">
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 dark:border-navy-500/20 dark:bg-navy-500/10 dark:text-navy-300">
                                    <Building2 className="size-3.5" />
                                    Manajemen Fasilitas
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                    Edit Fasilitas Darurat
                                </h1>

                                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                    Perbarui informasi fasilitas{" "}
                                    <span className="font-semibold text-foreground">
                                        {facility.name}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>
                    </Reveal>

                    {/* FORM / SKELETON */}
                    {loading ? (
                        <FormSkeleton />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* INFORMASI UTAMA */}
                            <Reveal delay={100}>
                                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
                                    <div className="border-b border-border p-5 md:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300">
                                                <Building2 className="size-5" />
                                            </div>

                                            <div>
                                                <h2 className="font-semibold text-foreground">
                                                    Informasi Fasilitas
                                                </h2>

                                                <p className="text-sm text-muted-foreground">
                                                    Perbarui informasi dasar
                                                    fasilitas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 p-5 md:p-6 md:grid-cols-2">
                                        {/* NAMA */}
                                        <div className="md:col-span-2">
                                            <label
                                                htmlFor="name"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Nama Fasilitas{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="name"
                                                type="text"
                                                value={form.name}
                                                onChange={(event) =>
                                                    updateField(
                                                        "name",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Posko Evakuasi Kelurahan Jombang"
                                                className={inputClass("name")}
                                                autoComplete="off"
                                            />

                                            <FieldError message={errors.name} />
                                        </div>

                                        {/* JENIS */}
                                        <div>
                                            <label
                                                htmlFor="type"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Jenis Fasilitas{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                id="type"
                                                value={form.type}
                                                onChange={(event) =>
                                                    updateField(
                                                        "type",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass("type")}
                                            >
                                                {facilityTypes.map(
                                                    (facilityType) => (
                                                        <option
                                                            key={
                                                                facilityType.value
                                                            }
                                                            value={
                                                                facilityType.value
                                                            }
                                                        >
                                                            {facilityType.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <FieldError message={errors.type} />
                                        </div>

                                        {/* WILAYAH */}
                                        <div>
                                            <label
                                                htmlFor="area_id"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Wilayah
                                            </label>

                                            <select
                                                id="area_id"
                                                value={form.area_id}
                                                onChange={(event) =>
                                                    updateField(
                                                        "area_id",
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass(
                                                    "area_id",
                                                )}
                                            >
                                                <option value="">
                                                    Semua Wilayah
                                                </option>

                                                {areas.map((area) => (
                                                    <option
                                                        key={area.id}
                                                        value={area.id}
                                                    >
                                                        {area.name} ({area.type}
                                                        )
                                                    </option>
                                                ))}
                                            </select>

                                            <FieldError
                                                message={errors.area_id}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </Reveal>

                            {/* LOKASI */}
                            <Reveal delay={180}>
                                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
                                    <div className="border-b border-border p-5 md:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sea-300/30 text-sea-600 dark:bg-sea-500/15 dark:text-sea-300">
                                                <MapPin className="size-5" />
                                            </div>

                                            <div>
                                                <h2 className="font-semibold text-foreground">
                                                    Lokasi Fasilitas
                                                </h2>

                                                <p className="text-sm text-muted-foreground">
                                                    Perbarui koordinat dan
                                                    alamat fasilitas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 p-5 md:p-6 md:grid-cols-2">
                                        {/* LATITUDE */}
                                        <div>
                                            <label
                                                htmlFor="latitude"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Latitude{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="latitude"
                                                type="number"
                                                step="any"
                                                value={form.latitude}
                                                onChange={(event) =>
                                                    updateField(
                                                        "latitude",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="-6.0170000"
                                                className={inputClass(
                                                    "latitude",
                                                )}
                                            />

                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Rentang: -90 sampai 90
                                            </p>

                                            <FieldError
                                                message={errors.latitude}
                                            />
                                        </div>

                                        {/* LONGITUDE */}
                                        <div>
                                            <label
                                                htmlFor="longitude"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Longitude{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="longitude"
                                                type="number"
                                                step="any"
                                                value={form.longitude}
                                                onChange={(event) =>
                                                    updateField(
                                                        "longitude",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="106.0530000"
                                                className={inputClass(
                                                    "longitude",
                                                )}
                                            />

                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Rentang: -180 sampai 180
                                            </p>

                                            <FieldError
                                                message={errors.longitude}
                                            />
                                        </div>

                                        {/* ALAMAT */}
                                        <div className="md:col-span-2">
                                            <label
                                                htmlFor="address"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Alamat
                                            </label>

                                            <textarea
                                                id="address"
                                                rows={4}
                                                value={form.address}
                                                onChange={(event) =>
                                                    updateField(
                                                        "address",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Masukkan alamat lengkap fasilitas..."
                                                className={`${inputClass(
                                                    "address",
                                                )} resize-none`}
                                            />

                                            <FieldError
                                                message={errors.address}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </Reveal>

                            {/* INFORMASI TAMBAHAN */}
                            <Reveal delay={260}>
                                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
                                    <div className="border-b border-border p-5 md:p-6">
                                        <h2 className="font-semibold text-foreground">
                                            Informasi Tambahan
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Perbarui informasi tambahan
                                            fasilitas.
                                        </p>
                                    </div>

                                    <div className="grid gap-6 p-5 md:p-6 md:grid-cols-2">
                                        {/* KAPASITAS */}
                                        <div>
                                            <label
                                                htmlFor="capacity"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Kapasitas
                                            </label>

                                            <input
                                                id="capacity"
                                                type="number"
                                                min="0"
                                                value={form.capacity}
                                                onChange={(event) =>
                                                    updateField(
                                                        "capacity",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: 100"
                                                className={inputClass(
                                                    "capacity",
                                                )}
                                            />

                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Jumlah orang yang dapat
                                                ditampung.
                                            </p>

                                            <FieldError
                                                message={errors.capacity}
                                            />
                                        </div>

                                        {/* NOMOR TELEPON */}
                                        <div>
                                            <label
                                                htmlFor="contact_phone"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Nomor Telepon
                                            </label>

                                            <input
                                                id="contact_phone"
                                                type="text"
                                                value={form.contact_phone}
                                                onChange={(event) =>
                                                    updateField(
                                                        "contact_phone",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: 081234567890"
                                                className={inputClass(
                                                    "contact_phone",
                                                )}
                                                autoComplete="tel"
                                            />

                                            <FieldError
                                                message={errors.contact_phone}
                                            />
                                        </div>

                                        {/* STATUS */}
                                        <div className="md:col-span-2">
                                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 p-4 transition-colors hover:bg-navy-50 dark:hover:bg-navy-500/5">
                                                <input
                                                    type="checkbox"
                                                    checked={form.is_active}
                                                    onChange={(event) =>
                                                        updateField(
                                                            "is_active",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="mt-0.5 size-4 rounded border-border bg-background text-navy-600 focus:ring-navy-500 dark:text-navy-400"
                                                />

                                                <span>
                                                    <span className="block text-sm font-semibold text-foreground">
                                                        Fasilitas Aktif
                                                    </span>

                                                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                                                        Jika aktif, fasilitas
                                                        akan ditampilkan pada
                                                        peta kejadian.
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </section>
                            </Reveal>

                            {/* ACTION */}
                            <Reveal delay={340} fill={false}>
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <Link
                                        href="/admin/facilities"
                                        className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:shadow-md"
                                    >
                                        Batal
                                    </Link>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-navy-700 hover:to-sea-600 hover:shadow-xl hover:shadow-navy-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <Save className="size-4" />
                                        )}

                                        {processing
                                            ? "Menyimpan..."
                                            : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </Reveal>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
