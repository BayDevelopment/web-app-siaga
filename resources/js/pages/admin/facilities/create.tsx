import { Head, Link, router } from '@inertiajs/react';

import {
    ArrowLeft,
    Building2,
    LoaderCircle,
    MapPin,
    Save,
} from 'lucide-react';

import {
    useEffect,
    useState,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from 'react';

import LocationPicker from '@/components/report/location-picker';

type Area = {
    id: number;
    name: string;
    type: string;
    parent_name?: string | null;
    center_lat?: number | null;
    center_lng?: number | null;
    boundary_geojson?: unknown;
};

type Props = {
    areas: Area[];
};

/**
 * `capacityHint` hanya ada pada jenis yang menampung orang.
 * Jenis tanpa `capacityHint` (Hidran, Pos Damkar) tidak menampilkan
 * kolom Kapasitas, dan nilainya dikirim kosong.
 */
const facilityTypes: {
    value: string;
    label: string;
    capacityHint?: string;
}[] = [
    {
        value: 'evacuation_point',
        label: 'Titik Evakuasi',
        capacityHint: 'Jumlah orang yang dapat ditampung.',
    },
    {
        value: 'posko',
        label: 'Posko',
        capacityHint: 'Jumlah orang yang dapat ditampung.',
    },
    {
        value: 'hydrant',
        label: 'Hidran',
    },
    {
        value: 'fire_post',
        label: 'Pos Damkar',
    },
    {
        value: 'clinic',
        label: 'Klinik',
        capacityHint: 'Jumlah pasien atau tempat tidur.',
    },
];

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

function useFakeLoading(ms = 700) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoading(false);
        }, ms);

        return () => window.clearTimeout(timer);
    }, [ms]);

    return loading;
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="skeleton size-11 rounded-xl" />

                        <div className="space-y-2">
                            <div className="skeleton h-5 w-40" />
                            <div className="skeleton h-3.5 w-64" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <div className="skeleton h-3.5 w-28" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-20" />
                        <div className="skeleton h-11 w-full" />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="skeleton size-11 rounded-xl" />

                        <div className="space-y-2">
                            <div className="skeleton h-5 w-36" />
                            <div className="skeleton h-3.5 w-48" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-20" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <div className="skeleton h-3.5 w-16" />
                        <div className="skeleton h-28 w-full" />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-6">
                    <div className="skeleton h-5 w-40" />
                    <div className="mt-2 skeleton h-3.5 w-60" />
                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-20" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-28" />
                        <div className="skeleton h-11 w-full" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <div className="skeleton h-4 w-64" />
                        <div className="skeleton h-3 w-80 max-w-full" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <div className="skeleton h-11 w-24" />
                <div className="skeleton h-11 w-40" />
            </div>
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <span
                aria-hidden
                className="mt-1 size-1.5 shrink-0 rounded-full bg-current"
            />
            <span>{message}</span>
        </p>
    );
}

export default function FacilityCreate({ areas }: Props) {
    const [form, setForm] = useState({
        area_id: '',
        name: '',
        type: 'evacuation_point',
        latitude: '',
        longitude: '',
        address: '',
        capacity: '',
        contact_phone: '',
        is_active: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const loading = useFakeLoading(700);

    const capacityHint = facilityTypes.find(
        (item) => item.value === form.type,
    )?.capacityHint;
    const hasCapacity = Boolean(capacityHint);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        setErrors({});
        setProcessing(true);

        router.post(
            '/admin/facilities',
            {
                area_id: form.area_id || null,
                name: form.name,
                type: form.type,
                latitude: form.latitude,
                longitude: form.longitude,
                address: form.address || null,
                capacity: hasCapacity ? form.capacity || null : null,
                contact_phone: form.contact_phone || null,
                is_active: form.is_active,
            },
            {
                onError: (validationErrors) => {
                    setErrors(
                        validationErrors as Record<string, string>,
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const updateField = (
        field: keyof typeof form,
        value: string | boolean,
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const inputBase =
        'w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

    const inputClass = (field: string) =>
        `${inputBase} ${
            errors[field]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/40'
                : 'border-border focus:border-navy-500 focus:ring-navy-500/20'
        }`;

    return (
        <>
            <Head title="Tambah Fasilitas Darurat" />

            <div className="relative min-h-full overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-28 -left-24 h-80 w-80 animate-blob bg-navy-400/15 dark:bg-navy-400/10" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/15 dark:bg-sun-400/10" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />
                </div>

                <div className="relative flex flex-col gap-6 p-4 md:p-6">
                    {/* HEADER */}
                    <Reveal>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Link
                                href="/admin/facilities"
                                aria-label="Kembali ke fasilitas"
                                className="group flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 hover:shadow-md dark:hover:border-navy-500/30 dark:hover:bg-navy-500/10 dark:hover:text-navy-300"
                            >
                                <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                            </Link>

                            <div>
                                <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700 dark:border-navy-500/20 dark:bg-navy-500/10 dark:text-navy-300">
                                    <Building2 className="size-3.5" />
                                    Master Fasilitas
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                    Tambah Fasilitas Darurat
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Tambahkan fasilitas yang dapat digunakan
                                    dalam kondisi darurat dan ditampilkan pada
                                    sistem SIAGA-W.
                                </p>
                            </div>
                        </div>
                    </Reveal>

                    {loading ? (
                        <Reveal delay={100}>
                            <FormSkeleton />
                        </Reveal>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            {/* INFORMASI UTAMA */}
                            <Reveal delay={100}>
                                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
                                    <div className="border-b border-border bg-linear-to-r from-navy-50/80 via-card to-card p-6 dark:from-navy-500/5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-xl bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300">
                                                <Building2 className="size-5" />
                                            </div>

                                            <div>
                                                <h2 className="font-semibold text-foreground">
                                                    Informasi Fasilitas
                                                </h2>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    Masukkan informasi dasar
                                                    fasilitas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 p-6 md:grid-cols-2">
                                        {/* NAMA */}
                                        <div className="md:col-span-2">
                                            <label
                                                htmlFor="name"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Nama Fasilitas
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="name"
                                                type="text"
                                                value={form.name}
                                                onChange={(event) =>
                                                    updateField(
                                                        'name',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Posko Evakuasi Kelurahan Jombang"
                                                className={inputClass('name')}
                                            />

                                            <FieldError
                                                message={errors.name}
                                            />
                                        </div>

                                        {/* JENIS */}
                                        <div>
                                            <label
                                                htmlFor="type"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Jenis Fasilitas
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                id="type"
                                                value={form.type}
                                                onChange={(event) => {
                                                    const nextType =
                                                        event.target.value;

                                                    // Ganti ke jenis tanpa kapasitas: kosongkan nilai lama.
                                                    setForm((current) => ({
                                                        ...current,
                                                        type: nextType,
                                                        capacity: facilityTypes.find(
                                                            (item) =>
                                                                item.value ===
                                                                nextType,
                                                        )?.capacityHint
                                                            ? current.capacity
                                                            : '',
                                                    }));
                                                }}
                                                className={inputClass('type')}
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
                                                            {
                                                                facilityType.label
                                                            }
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <FieldError
                                                message={errors.type}
                                            />
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
                                                        'area_id',
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass(
                                                    'area_id',
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
                                                        {area.name} (
                                                        {area.type})
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

                            {/* PETA (Leaflet): ikut wilayah, klik peta mengisi koordinat */}
                            <Reveal delay={140}>
                                <LocationPicker
                                    areas={areas}
                                    areaId={form.area_id}
                                    latitude={form.latitude}
                                    longitude={form.longitude}
                                    onChange={(lat, lng) =>
                                        setForm((current) => ({
                                            ...current,
                                            latitude: lat.toFixed(7),
                                            longitude: lng.toFixed(7),
                                        }))
                                    }
                                />
                            </Reveal>

                            {/* LOKASI */}
                            <Reveal delay={180}>
                                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
                                    <div className="border-b border-border bg-linear-to-r from-forest-50/70 via-card to-card p-6 dark:from-forest-500/5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-xl bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-300">
                                                <MapPin className="size-5" />
                                            </div>

                                            <div>
                                                <h2 className="font-semibold text-foreground">
                                                    Lokasi Fasilitas
                                                </h2>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    Terisi otomatis dari peta di
                                                    atas, atau isi koordinat
                                                    secara manual.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 p-6 md:grid-cols-2">
                                        {/* LATITUDE */}
                                        <div>
                                            <label
                                                htmlFor="latitude"
                                                className="mb-2 block text-sm font-semibold text-foreground"
                                            >
                                                Latitude
                                                <span className="ml-1 text-red-500">
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
                                                        'latitude',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="-6.0170000"
                                                className={inputClass(
                                                    'latitude',
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
                                                Longitude
                                                <span className="ml-1 text-red-500">
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
                                                        'longitude',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="106.0530000"
                                                className={inputClass(
                                                    'longitude',
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
                                                rows={3}
                                                value={form.address}
                                                onChange={(event) =>
                                                    updateField(
                                                        'address',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Masukkan alamat lengkap fasilitas..."
                                                className={`${inputClass(
                                                    'address',
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
                                    <div className="border-b border-border bg-linear-to-r from-sun-50/80 via-card to-card p-6 dark:from-sun-500/5">
                                        <h2 className="font-semibold text-foreground">
                                            Informasi Tambahan
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Informasi tambahan mengenai
                                            fasilitas.
                                        </p>
                                    </div>

                                    <div className="grid gap-5 p-6 md:grid-cols-2">
                                        {/* KAPASITAS: hanya untuk jenis yang menampung orang */}
                                        {hasCapacity && (
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
                                                        'capacity',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: 100"
                                                className={inputClass(
                                                    'capacity',
                                                )}
                                            />

                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                {capacityHint}
                                            </p>

                                            <FieldError
                                                message={errors.capacity}
                                            />
                                        </div>
                                        )}

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
                                                        'contact_phone',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: 081234567890"
                                                className={inputClass(
                                                    'contact_phone',
                                                )}
                                            />

                                            <FieldError
                                                message={
                                                    errors.contact_phone
                                                }
                                            />
                                        </div>

                                        {/* STATUS */}
                                        <div className="md:col-span-2">
                                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition hover:border-forest-300 hover:bg-forest-50/50 dark:hover:border-forest-500/30 dark:hover:bg-forest-500/5">
                                                <input
                                                    type="checkbox"
                                                    checked={form.is_active}
                                                    onChange={(event) =>
                                                        updateField(
                                                            'is_active',
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="mt-0.5 size-4 rounded border-border accent-forest-600"
                                                />

                                                <span>
                                                    <span className="block text-sm font-semibold text-foreground">
                                                        Fasilitas Aktif
                                                    </span>

                                                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                                                        Fasilitas aktif akan
                                                        ditampilkan pada peta
                                                        kejadian.
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </section>
                            </Reveal>

                            {/* ACTION */}
                            <Reveal delay={340}>
                                <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:justify-end">
                                    <Link
                                        href="/admin/facilities"
                                        className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted"
                                    >
                                        Batal
                                    </Link>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <Save className="size-4" />
                                        )}

                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Simpan Fasilitas'}
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