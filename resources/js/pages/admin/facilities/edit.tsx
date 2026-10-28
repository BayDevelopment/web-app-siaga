import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Save,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';

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
        value: 'evacuation_point',
        label: 'Titik Evakuasi',
    },
    {
        value: 'posko',
        label: 'Posko',
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
    },
];

export default function FacilityEdit({
    facility,
    areas,
}: Props) {
    const [form, setForm] = useState({
        area_id: facility.area_id
            ? String(facility.area_id)
            : '',
        name: facility.name,
        type: facility.type,
        latitude: String(facility.latitude),
        longitude: String(facility.longitude),
        address: facility.address ?? '',
        capacity:
            facility.capacity !== null
                ? String(facility.capacity)
                : '',
        contact_phone:
            facility.contact_phone ?? '',
        is_active: facility.is_active,
    });

    const [errors, setErrors] = useState<
        Record<string, string>
    >({});

    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

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
                contact_phone:
                    form.contact_phone || null,
                is_active: form.is_active,
            },
            {
                onError: (validationErrors) => {
                    setErrors(
                        validationErrors as Record<
                            string,
                            string
                        >,
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

    return (
        <>
            <Head title="Edit Fasilitas Darurat" />

            <div className="flex flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/facilities"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Edit Fasilitas Darurat
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Perbarui informasi fasilitas
                            <span className="font-medium text-slate-700">
                                {' '}
                                {facility.name}
                            </span>
                            .
                        </p>
                    </div>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* INFORMASI UTAMA */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Informasi Fasilitas
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Perbarui informasi dasar
                                        fasilitas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 md:grid-cols-2">
                            {/* NAMA */}
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Nama Fasilitas
                                    <span className="text-red-500">
                                        {' '}
                                        *
                                    </span>
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        updateField(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Posko Evakuasi Kelurahan Jombang"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                                        errors.name
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />

                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* JENIS */}
                            <div>
                                <label
                                    htmlFor="type"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Jenis Fasilitas
                                    <span className="text-red-500">
                                        {' '}
                                        *
                                    </span>
                                </label>

                                <select
                                    id="type"
                                    value={form.type}
                                    onChange={(e) =>
                                        updateField(
                                            'type',
                                            e.target.value,
                                        )
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                                        errors.type
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-slate-300 focus:border-blue-500'
                                    }`}
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

                                {errors.type && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.type}
                                    </p>
                                )}
                            </div>

                            {/* WILAYAH */}
                            <div>
                                <label
                                    htmlFor="area_id"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Wilayah
                                </label>

                                <select
                                    id="area_id"
                                    value={form.area_id}
                                    onChange={(e) =>
                                        updateField(
                                            'area_id',
                                            e.target.value,
                                        )
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                                        errors.area_id
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-slate-300 focus:border-blue-500'
                                    }`}
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

                                {errors.area_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.area_id}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LOKASI */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                    <MapPin className="h-5 w-5 text-green-600" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Lokasi Fasilitas
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Perbarui koordinat dan alamat
                                        fasilitas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 md:grid-cols-2">
                            {/* LATITUDE */}
                            <div>
                                <label
                                    htmlFor="latitude"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Latitude
                                    <span className="text-red-500">
                                        {' '}
                                        *
                                    </span>
                                </label>

                                <input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={form.latitude}
                                    onChange={(e) =>
                                        updateField(
                                            'latitude',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="-6.0170000"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                                        errors.latitude
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    Rentang: -90 sampai 90
                                </p>

                                {errors.latitude && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.latitude}
                                    </p>
                                )}
                            </div>

                            {/* LONGITUDE */}
                            <div>
                                <label
                                    htmlFor="longitude"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Longitude
                                    <span className="text-red-500">
                                        {' '}
                                        *
                                    </span>
                                </label>

                                <input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={form.longitude}
                                    onChange={(e) =>
                                        updateField(
                                            'longitude',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="106.0530000"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                                        errors.longitude
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    Rentang: -180 sampai 180
                                </p>

                                {errors.longitude && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.longitude}
                                    </p>
                                )}
                            </div>

                            {/* ALAMAT */}
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="address"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Alamat
                                </label>

                                <textarea
                                    id="address"
                                    rows={3}
                                    value={form.address}
                                    onChange={(e) =>
                                        updateField(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Masukkan alamat lengkap fasilitas..."
                                    className={`w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                                        errors.address
                                            ? 'border-red-400'
                                            : 'border-slate-300'
                                    }`}
                                />

                                {errors.address && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* INFORMASI TAMBAHAN */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6">
                            <h2 className="font-semibold text-slate-900">
                                Informasi Tambahan
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Perbarui informasi tambahan fasilitas.
                            </p>
                        </div>

                        <div className="grid gap-6 p-6 md:grid-cols-2">
                            {/* KAPASITAS */}
                            <div>
                                <label
                                    htmlFor="capacity"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Kapasitas
                                </label>

                                <input
                                    id="capacity"
                                    type="number"
                                    min="0"
                                    value={form.capacity}
                                    onChange={(e) =>
                                        updateField(
                                            'capacity',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 100"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                                        errors.capacity
                                            ? 'border-red-400'
                                            : 'border-slate-300'
                                    }`}
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    Jumlah orang yang dapat ditampung.
                                </p>

                                {errors.capacity && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.capacity}
                                    </p>
                                )}
                            </div>

                            {/* NOMOR TELEPON */}
                            <div>
                                <label
                                    htmlFor="contact_phone"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Nomor Telepon
                                </label>

                                <input
                                    id="contact_phone"
                                    type="text"
                                    value={form.contact_phone}
                                    onChange={(e) =>
                                        updateField(
                                            'contact_phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 081234567890"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                                        errors.contact_phone
                                            ? 'border-red-400'
                                            : 'border-slate-300'
                                    }`}
                                />

                                {errors.contact_phone && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.contact_phone}
                                    </p>
                                )}
                            </div>

                            {/* STATUS */}
                            <div className="md:col-span-2">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={
                                            form.is_active
                                        }
                                        onChange={(e) =>
                                            updateField(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    <span>
                                        <span className="block text-sm font-medium text-slate-700">
                                            Fasilitas Aktif
                                        </span>

                                        <span className="block text-xs text-slate-500">
                                            Jika aktif, fasilitas akan
                                            ditampilkan pada peta
                                            kejadian.
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ACTION */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href="/admin/facilities"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" />

                            {processing
                                ? 'Menyimpan...'
                                : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}