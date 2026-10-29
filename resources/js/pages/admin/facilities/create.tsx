import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Building2, LoaderCircle, MapPin, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';

import LocationPicker from '@/components/report/location-picker';
import type { PointGeo } from '@/components/report/location-picker';

/* ---------- Tipe ---------- */

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
    areas?: Area[] | null;
};

type FormState = {
    area_id: string;
    name: string;
    type: string;
    latitude: string;
    longitude: string;
    address: string;
    capacity: string;
    contact_phone: string;
    is_active: boolean;
};

type Tone = 'navy' | 'forest' | 'sun';

/* ---------- Konstanta ---------- */

const EMPTY_AREAS: Area[] = [];

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
    { value: 'hydrant', label: 'Hidran' },
    { value: 'fire_post', label: 'Pos Damkar' },
    {
        value: 'clinic',
        label: 'Klinik',
        capacityHint: 'Jumlah pasien atau tempat tidur.',
    },
];

const INITIAL_FORM: FormState = {
    area_id: '',
    name: '',
    type: 'evacuation_point',
    latitude: '',
    longitude: '',
    address: '',
    capacity: '',
    contact_phone: '',
    is_active: true,
};

const FOCUS_RING =
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

// Kelas ditulis utuh (bukan disusun dinamis) agar terbaca oleh Tailwind.
const TONES: Record<Tone, { header: string; icon: string }> = {
    navy: {
        header: 'from-navy-50/80 dark:from-navy-500/5',
        icon: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300',
    },
    forest: {
        header: 'from-forest-50/70 dark:from-forest-500/5',
        icon: 'bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-300',
    },
    sun: {
        header: 'from-sun-50/80 dark:from-sun-500/5',
        icon: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
    },
};

const INPUT_BASE =
    'w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

const INPUT_NORMAL =
    'border-border focus:border-navy-500 focus:ring-navy-500/20';

// Merah memakai token destructive-foreground (terang di dark mode).
const INPUT_ERROR =
    'border-destructive-foreground/50 focus:border-destructive-foreground focus:ring-destructive-foreground/20';

/* ---------- Helper animasi & loading ---------- */

function Reveal({
    children,
    delay = 0,
}: {
    children: ReactNode;
    delay?: number;
}) {
    return (
        <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

function useFakeLoading(ms = 700) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), ms);

        return () => window.clearTimeout(timer);
    }, [ms]);

    return loading;
}

/* ---------- Skeleton ---------- */

function FieldSkeleton({
    wide = false,
    tall = false,
}: {
    wide?: boolean;
    tall?: boolean;
}) {
    return (
        <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}>
            <div className="skeleton h-3.5 w-24" />
            <div className={`skeleton w-full ${tall ? 'h-28' : 'h-11'}`} />
        </div>
    );
}

function SectionSkeleton({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
                <div className="flex items-center gap-3">
                    <div className="skeleton size-11 rounded-xl" />

                    <div className="space-y-2">
                        <div className="skeleton h-5 w-40" />
                        <div className="skeleton h-3.5 w-64 max-w-full" />
                    </div>
                </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">{children}</div>
        </div>
    );
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            <SectionSkeleton>
                <FieldSkeleton wide />
                <FieldSkeleton />
                <FieldSkeleton />
            </SectionSkeleton>

            <div className="skeleton h-80 w-full rounded-2xl sm:h-[420px]" />

            <SectionSkeleton>
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton wide tall />
            </SectionSkeleton>

            <SectionSkeleton>
                <FieldSkeleton />
                <FieldSkeleton />
            </SectionSkeleton>

            <div className="flex justify-end gap-3">
                <div className="skeleton h-11 w-24" />
                <div className="skeleton h-11 w-40" />
            </div>
        </div>
    );
}

/* ---------- Komponen form ---------- */

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive-foreground"
        >
            <span
                aria-hidden
                className="mt-1 size-1.5 shrink-0 rounded-full bg-current"
            />
            <span>{message}</span>
        </p>
    );
}

function Field({
    id,
    label,
    required = false,
    hint,
    error,
    className = '',
    children,
}: {
    id: string;
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={className}>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold text-foreground"
            >
                {label}
                {required && (
                    <span className="ml-1 text-destructive-foreground">*</span>
                )}
            </label>

            {children}

            {hint && (
                <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
            )}

            <FieldError message={error} />
        </div>
    );
}

function FormSection({
    tone,
    icon: Icon,
    title,
    description,
    children,
}: {
    tone: Tone;
    icon?: LucideIcon;
    title: string;
    description: string;
    children: ReactNode;
}) {
    const styles = TONES[tone];

    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div
                className={`border-b border-border bg-linear-to-r via-card to-card p-6 ${styles.header}`}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div
                            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                        >
                            <Icon className="size-5" />
                        </div>
                    )}

                    <div>
                        <h2 className="font-semibold text-foreground">
                            {title}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">{children}</div>
        </section>
    );
}

/* ---------- Halaman ---------- */

export default function FacilityCreate({ areas: areasProp }: Props) {
    const areas = areasProp ?? EMPTY_AREAS;

    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const loading = useFakeLoading(700);

    const capacityHint = facilityTypes.find(
        (item) => item.value === form.type,
    )?.capacityHint;
    const hasCapacity = Boolean(capacityHint);

    const clearError = (field: string) => {
        setErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });
    };

    const updateField = <K extends keyof FormState>(
        field: K,
        value: FormState[K],
    ) => {
        setForm((current) => ({ ...current, [field]: value }));
        clearError(field);
    };

    const handleTypeChange = (nextType: string) => {
        const nextHasCapacity = Boolean(
            facilityTypes.find((item) => item.value === nextType)
                ?.capacityHint,
        );

        // Jenis tanpa kapasitas: kosongkan nilai lama.
        setForm((current) => ({
            ...current,
            type: nextType,
            capacity: nextHasCapacity ? current.capacity : '',
        }));
        clearError('type');
        clearError('capacity');
    };

    // Picker mengirim satu objek GeoJSON Point: [longitude, latitude].
    const handlePointChange = (geo: PointGeo | null) => {
        setForm((current) => ({
            ...current,
            latitude: geo ? geo.coordinates[1].toFixed(7) : '',
            longitude: geo ? geo.coordinates[0].toFixed(7) : '',
        }));
        clearError('latitude');
        clearError('longitude');
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
                    setErrors(validationErrors as Record<string, string>);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const inputClass = (field: string) =>
        `${INPUT_BASE} ${errors[field] ? INPUT_ERROR : INPUT_NORMAL}`;

    return (
        <>
            <Head title="Tambah Fasilitas Darurat" />

            <div className="relative isolate min-h-full overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
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
                                className={`group flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 hover:shadow-md dark:hover:border-navy-500/30 dark:hover:bg-navy-500/10 dark:hover:text-navy-300 ${FOCUS_RING}`}
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
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* INFORMASI UTAMA */}
                            <Reveal delay={100}>
                                <FormSection
                                    tone="navy"
                                    icon={Building2}
                                    title="Informasi Fasilitas"
                                    description="Masukkan informasi dasar fasilitas."
                                >
                                    <Field
                                        id="name"
                                        label="Nama Fasilitas"
                                        required
                                        error={errors.name}
                                        className="md:col-span-2"
                                    >
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
                                            autoComplete="off"
                                        />
                                    </Field>

                                    <Field
                                        id="type"
                                        label="Jenis Fasilitas"
                                        required
                                        error={errors.type}
                                    >
                                        <select
                                            id="type"
                                            value={form.type}
                                            onChange={(event) =>
                                                handleTypeChange(
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass('type')}
                                        >
                                            {facilityTypes.map((item) => (
                                                <option
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field
                                        id="area_id"
                                        label="Wilayah"
                                        error={errors.area_id}
                                    >
                                        <select
                                            id="area_id"
                                            value={form.area_id}
                                            onChange={(event) =>
                                                updateField(
                                                    'area_id',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass('area_id')}
                                        >
                                            <option value="">
                                                Semua Wilayah
                                            </option>

                                            {areas.map((area) => (
                                                <option
                                                    key={area.id}
                                                    value={area.id}
                                                >
                                                    {area.name} ({area.type})
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </FormSection>
                            </Reveal>

                            {/* PETA: ikut wilayah, klik peta mengisi koordinat */}
                            <Reveal delay={140}>
                                <LocationPicker
                                    areas={areas}
                                    areaId={form.area_id}
                                    latitude={form.latitude}
                                    longitude={form.longitude}
                                    onChange={handlePointChange}
                                    error={errors.latitude ?? errors.longitude}
                                />
                            </Reveal>

                            {/* LOKASI */}
                            <Reveal delay={180}>
                                <FormSection
                                    tone="forest"
                                    icon={MapPin}
                                    title="Lokasi Fasilitas"
                                    description="Terisi otomatis dari peta di atas, atau isi koordinat secara manual."
                                >
                                    <Field
                                        id="latitude"
                                        label="Latitude"
                                        required
                                        hint="Rentang: -90 sampai 90"
                                        error={errors.latitude}
                                    >
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
                                            className={inputClass('latitude')}
                                        />
                                    </Field>

                                    <Field
                                        id="longitude"
                                        label="Longitude"
                                        required
                                        hint="Rentang: -180 sampai 180"
                                        error={errors.longitude}
                                    >
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
                                            className={inputClass('longitude')}
                                        />
                                    </Field>

                                    <Field
                                        id="address"
                                        label="Alamat"
                                        error={errors.address}
                                        className="md:col-span-2"
                                    >
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
                                            className={`${inputClass('address')} resize-none`}
                                        />
                                    </Field>
                                </FormSection>
                            </Reveal>

                            {/* INFORMASI TAMBAHAN */}
                            <Reveal delay={260}>
                                <FormSection
                                    tone="sun"
                                    title="Informasi Tambahan"
                                    description="Informasi tambahan mengenai fasilitas."
                                >
                                    {/* Kapasitas hanya untuk jenis yang menampung orang */}
                                    {hasCapacity && (
                                        <Field
                                            id="capacity"
                                            label="Kapasitas"
                                            hint={capacityHint}
                                            error={errors.capacity}
                                        >
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
                                        </Field>
                                    )}

                                    <Field
                                        id="contact_phone"
                                        label="Nomor Telepon"
                                        error={errors.contact_phone}
                                    >
                                        <input
                                            id="contact_phone"
                                            type="tel"
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
                                            autoComplete="tel"
                                        />
                                    </Field>

                                    <div className="md:col-span-2">
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition hover:border-forest-300 hover:bg-forest-50/50 dark:hover:border-forest-500/30 dark:hover:bg-forest-500/5">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(event) =>
                                                    updateField(
                                                        'is_active',
                                                        event.target.checked,
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
                                </FormSection>
                            </Reveal>

                            {/* ACTION */}
                            <Reveal delay={340}>
                                <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:justify-end">
                                    <Link
                                        href="/admin/facilities"
                                        className={`inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted ${FOCUS_RING}`}
                                    >
                                        Batal
                                    </Link>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-sea-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${FOCUS_RING}`}
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