import { Link } from '@inertiajs/react';
import type { InertiaFormProps } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Crosshair,
    FileText,
    ImagePlus,
    LoaderCircle,
    MapPin,
    Trash2,
    Undo2,
    X,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
} from 'react';

import {
    MAX_PHOTOS,
    SEVERITY_META,
    SEVERITY_ORDER,
    type AreaOption,
    type DisasterType,
    type ReportPhoto,
} from '@/lib/report';

export type ReportFormData = {
    disaster_type_id: string;
    area_id: string;
    title: string;
    description: string;
    latitude: string;
    longitude: string;
    address: string;
    severity: string;
    occurred_at: string;
    photos: File[];
    delete_photo_ids: number[];
};

type Props = {
    form: InertiaFormProps<ReportFormData>;
    types: DisasterType[];
    areas: AreaOption[];
    existingPhotos?: ReportPhoto[];
    onSubmit: (event: FormEvent) => void;
    submitLabel: string;
    submitIcon?: ReactNode;
    cancelHref: string;
};

export default function ReportForm({
    form,
    types,
    areas,
    existingPhotos = [],
    onSubmit,
    submitLabel,
    submitIcon,
    cancelHref,
}: Props) {
    const { data, setData, errors, processing } = form;

    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsMessage, setGpsMessage] = useState<{
        ok: boolean;
        text: string;
    } | null>(null);

    /* ---------- Jenis & wilayah ---------- */

    const selectedType = types.find(
        (type) => String(type.id) === data.disaster_type_id,
    );

    const areaGroups = useMemo(() => {
        const groups = new Map<string, AreaOption[]>();

        for (const area of areas) {
            const key = area.parent_name ?? 'Wilayah utama';
            groups.set(key, [...(groups.get(key) ?? []), area]);
        }

        return [...groups.entries()];
    }, [areas]);

    /* ---------- Lokasi ---------- */

    function handleUseGps() {
        if (!navigator.geolocation) {
            setGpsMessage({
                ok: false,
                text: 'Browser Anda tidak mendukung fitur lokasi.',
            });
            return;
        }

        setGpsLoading(true);
        setGpsMessage(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData((current) => ({
                    ...current,
                    latitude: position.coords.latitude.toFixed(7),
                    longitude: position.coords.longitude.toFixed(7),
                }));

                setGpsLoading(false);
                setGpsMessage({
                    ok: true,
                    text: 'Lokasi berhasil diambil dari perangkat Anda.',
                });
            },
            () => {
                setGpsLoading(false);
                setGpsMessage({
                    ok: false,
                    text: 'Lokasi tidak dapat diambil. Pastikan izin lokasi sudah diberikan.',
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    }

    const coordsWarning = useMemo(() => {
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);

        if (!data.latitude || !data.longitude) return null;
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return 'Koordinat harus berupa angka, contoh -6.1234567.';
        }
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return 'Latitude harus antara -90 dan 90, longitude antara -180 dan 180.';
        }
        if (lat < -11.5 || lat > 6.5 || lng < 94.5 || lng > 141.5) {
            return 'Titik ini berada di luar Indonesia. Pastikan latitude dan longitude tidak tertukar.';
        }

        return null;
    }, [data.latitude, data.longitude]);

    /* ---------- Foto ---------- */

    const keptExisting = existingPhotos.filter(
        (photo) => !data.delete_photo_ids.includes(photo.id),
    );

    const slotsLeft = MAX_PHOTOS - keptExisting.length - data.photos.length;

    const previews = useMemo(
        () => data.photos.map((file) => URL.createObjectURL(file)),
        [data.photos],
    );

    useEffect(
        () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
        [previews],
    );

    function handleAddPhotos(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);

        setData(
            'photos',
            [...data.photos, ...files].slice(
                0,
                MAX_PHOTOS - keptExisting.length,
            ),
        );

        event.target.value = '';
    }

    function removeNewPhoto(index: number) {
        setData(
            'photos',
            data.photos.filter((_, i) => i !== index),
        );
    }

    function toggleDeleteExisting(id: number) {
        setData(
            'delete_photo_ids',
            data.delete_photo_ids.includes(id)
                ? data.delete_photo_ids.filter((item) => item !== id)
                : [...data.delete_photo_ids, id],
        );
    }

    const photoErrors = Object.entries(errors)
        .filter(([key]) => key === 'photos' || key.startsWith('photos.'))
        .map(([, message]) => message);

    /* ---------- Submit ---------- */

    const incomplete =
        !data.disaster_type_id ||
        !data.area_id ||
        !data.title.trim() ||
        !data.latitude ||
        !data.longitude ||
        !data.severity ||
        !data.occurred_at;

    const submitDisabled =
        processing || incomplete || types.length === 0 || areas.length === 0;

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* ---------------- Informasi kejadian ---------------- */}
            <Section
                icon={<FileText className="h-5 w-5" />}
                title="Informasi kejadian"
                description="Isi informasi dasar tentang kejadian yang dilaporkan."
            >
                <div className="grid gap-5 md:grid-cols-2">
                    <Field
                        label="Jenis kejadian"
                        htmlFor="disaster_type_id"
                        required
                        error={errors.disaster_type_id}
                        hint={
                            types.length === 0
                                ? 'Jenis kejadian belum tersedia. Hubungi administrator.'
                                : undefined
                        }
                    >
                        <select
                            id="disaster_type_id"
                            value={data.disaster_type_id}
                            onChange={(e) =>
                                setData('disaster_type_id', e.target.value)
                            }
                            disabled={types.length === 0}
                            className={inputClass(!!errors.disaster_type_id)}
                        >
                            <option value="">Pilih jenis kejadian</option>
                            {types.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>

                        {selectedType && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                        backgroundColor: selectedType.color,
                                    }}
                                />
                                {selectedType.name}
                            </p>
                        )}
                    </Field>

                    <Field
                        label="Wilayah"
                        htmlFor="area_id"
                        required
                        error={errors.area_id}
                        hint={
                            areas.length === 0
                                ? 'Wilayah belum tersedia. Hubungi administrator.'
                                : undefined
                        }
                    >
                        <select
                            id="area_id"
                            value={data.area_id}
                            onChange={(e) => setData('area_id', e.target.value)}
                            disabled={areas.length === 0}
                            className={inputClass(!!errors.area_id)}
                        >
                            <option value="">Pilih wilayah</option>
                            {areaGroups.map(([group, items]) => (
                                <optgroup key={group} label={group}>
                                    {items.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </Field>

                    <div className="md:col-span-2">
                        <Field
                            label="Judul laporan"
                            htmlFor="title"
                            required
                            error={errors.title}
                            hint="Singkat dan menggambarkan kejadian."
                        >
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Contoh: Banjir merendam beberapa rumah warga"
                                className={inputClass(!!errors.title)}
                            />
                        </Field>
                    </div>

                    <div className="md:col-span-2">
                        <Field
                            label="Deskripsi"
                            htmlFor="description"
                            error={errors.description}
                            hint="Jelaskan kondisi, dampak, dan jumlah warga terdampak secara faktual."
                        >
                            <textarea
                                id="description"
                                rows={5}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className={inputClass(!!errors.description, true)}
                            />
                        </Field>
                    </div>

                    <Field
                        label="Waktu kejadian"
                        htmlFor="occurred_at"
                        required
                        error={errors.occurred_at}
                    >
                        <input
                            id="occurred_at"
                            type="datetime-local"
                            value={data.occurred_at}
                            onChange={(e) =>
                                setData('occurred_at', e.target.value)
                            }
                            className={inputClass(!!errors.occurred_at)}
                        />
                    </Field>
                </div>
            </Section>

            {/* ---------------- Lokasi ---------------- */}
            <Section
                icon={<MapPin className="h-5 w-5" />}
                title="Lokasi kejadian"
                description="Gunakan GPS agar titik lokasi akurat."
            >
                <div className="space-y-5">
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium text-slate-800">
                                    Gunakan lokasi saat ini
                                </p>
                                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                    Koordinat terisi otomatis dari GPS perangkat.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleUseGps}
                                disabled={gpsLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {gpsLoading ? (
                                    <>
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        Mengambil lokasi
                                    </>
                                ) : (
                                    <>
                                        <Crosshair className="h-4 w-4" />
                                        Gunakan GPS
                                    </>
                                )}
                            </button>
                        </div>

                        {gpsMessage && (
                            <p
                                role="status"
                                className={[
                                    'mt-3 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs',
                                    gpsMessage.ok
                                        ? 'text-slate-600'
                                        : 'text-red-600',
                                ].join(' ')}
                            >
                                {gpsMessage.ok ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                )}
                                {gpsMessage.text}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            label="Latitude"
                            htmlFor="latitude"
                            required
                            error={errors.latitude}
                        >
                            <input
                                id="latitude"
                                type="text"
                                inputMode="decimal"
                                value={data.latitude}
                                onChange={(e) =>
                                    setData('latitude', e.target.value)
                                }
                                placeholder="-6.1234567"
                                className={inputClass(!!errors.latitude)}
                            />
                        </Field>

                        <Field
                            label="Longitude"
                            htmlFor="longitude"
                            required
                            error={errors.longitude}
                        >
                            <input
                                id="longitude"
                                type="text"
                                inputMode="decimal"
                                value={data.longitude}
                                onChange={(e) =>
                                    setData('longitude', e.target.value)
                                }
                                placeholder="106.1234567"
                                className={inputClass(!!errors.longitude)}
                            />
                        </Field>
                    </div>

                    {coordsWarning && (
                        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            {coordsWarning}
                        </p>
                    )}

                    <Field
                        label="Alamat atau keterangan lokasi"
                        htmlFor="address"
                        error={errors.address}
                    >
                        <textarea
                            id="address"
                            rows={3}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="Contoh: Jl. Raya Cilegon, depan masjid, gang sebelah warung"
                            className={inputClass(!!errors.address, true)}
                        />
                    </Field>
                </div>
            </Section>

            {/* ---------------- Keparahan ---------------- */}
            <Section
                icon={<AlertCircle className="h-5 w-5" />}
                title="Tingkat keparahan"
                description="Pilih tingkat dampak dari kejadian ini."
            >
                <div
                    role="radiogroup"
                    aria-label="Tingkat keparahan"
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {SEVERITY_ORDER.map((value) => {
                        const meta = SEVERITY_META[value];
                        const selected = data.severity === value;

                        return (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setData('severity', value)}
                                className={[
                                    'flex min-h-[112px] items-start justify-between gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
                                    selected
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                                ].join(' ')}
                            >
                                <span>
                                    <span className="block font-semibold">
                                        {meta.label}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 opacity-75">
                                        {meta.description}
                                    </span>
                                </span>

                                {selected && (
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <ErrorText message={errors.severity} />
            </Section>

            {/* ---------------- Foto ---------------- */}
            <Section
                icon={<ImagePlus className="h-5 w-5" />}
                title="Foto kejadian"
                description={`Opsional. Maksimal ${MAX_PHOTOS} foto, tiap foto hingga 4 MB (jpg, png, webp).`}
            >
                {(existingPhotos.length > 0 || data.photos.length > 0) && (
                    <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {existingPhotos.map((photo) => {
                            const removed = data.delete_photo_ids.includes(
                                photo.id,
                            );

                            return (
                                <li
                                    key={photo.id}
                                    className="relative overflow-hidden rounded-xl border border-slate-200"
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.caption ?? 'Foto laporan'}
                                        className={[
                                            'aspect-square w-full object-cover transition',
                                            removed ? 'opacity-30 grayscale' : '',
                                        ].join(' ')}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleDeleteExisting(photo.id)
                                        }
                                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-white"
                                    >
                                        {removed ? (
                                            <>
                                                <Undo2 className="h-3.5 w-3.5" />
                                                Batal hapus
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </>
                                        )}
                                    </button>
                                </li>
                            );
                        })}

                        {previews.map((url, index) => (
                            <li
                                key={url}
                                className="relative overflow-hidden rounded-xl border border-blue-200"
                            >
                                <img
                                    src={url}
                                    alt={`Foto baru ${index + 1}`}
                                    className="aspect-square w-full object-cover"
                                />

                                <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">
                                    Baru
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeNewPhoto(index)}
                                    aria-label={`Hapus foto baru ${index + 1}`}
                                    className="absolute right-2 top-2 rounded-lg bg-white/95 p-1 text-slate-700 shadow-sm transition hover:bg-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <label
                    className={[
                        'flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm font-medium transition',
                        slotsLeft > 0
                            ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            : 'cursor-not-allowed border-slate-200 text-slate-400',
                    ].join(' ')}
                >
                    <ImagePlus className="h-4 w-4" />
                    {slotsLeft > 0
                        ? `Tambah foto (${slotsLeft} slot tersisa)`
                        : 'Batas foto tercapai'}

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={slotsLeft <= 0}
                        onChange={handleAddPhotos}
                        className="sr-only"
                    />
                </label>

                {photoErrors.map((message, index) => (
                    <ErrorText key={index} message={message} />
                ))}
            </Section>

            {/* ---------------- Aksi ---------------- */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                    href={cancelHref}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Batal
                </Link>

                <button
                    type="submit"
                    disabled={submitDisabled}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing ? (
                        <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Menyimpan
                        </>
                    ) : (
                        <>
                            {submitIcon}
                            {submitLabel}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

/* ====================== Komponen kecil ====================== */

function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    {icon}
                </div>

                <div className="min-w-0">
                    <h2 className="font-bold text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function Field({
    label,
    htmlFor,
    required = false,
    hint,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-2 block text-sm font-semibold text-slate-700"
            >
                {label}
                {required && (
                    <span className="ml-1 text-red-500" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            {children}

            {hint && !error && (
                <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
            )}

            <ErrorText message={error} />
        </div>
    );
}

function ErrorText({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {message}
        </p>
    );
}

function inputClass(hasError = false, textarea = false) {
    return [
        'w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition',
        'placeholder:text-slate-400 focus:ring-2',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
        textarea ? 'resize-y' : '',
        hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100',
    ].join(' ');
}