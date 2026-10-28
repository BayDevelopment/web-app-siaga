import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Map,
    Save,
    TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';

type DisasterType = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    type: string;
    parent_id: number | null;
};

type GeoJSON = {
    type: 'Polygon' | 'MultiPolygon' | 'Point';
    coordinates: unknown;
};

type HazardZone = {
    id: number;
    disaster_type_id: number;
    area_id: number | null;
    name: string;
    level: 'low' | 'medium' | 'high';
    description: string | null;
    geojson: GeoJSON;
};

type Props = {
    zone: HazardZone;
    types: DisasterType[];
    areas: Area[];
};

export default function HazardZoneEdit({
    zone,
    types,
    areas,
}: Props) {
    const [form, setForm] = useState({
        disaster_type_id: String(zone.disaster_type_id),
        area_id: zone.area_id ? String(zone.area_id) : '',
        name: zone.name,
        level: zone.level,
        description: zone.description ?? '',
        geojson: JSON.stringify(zone.geojson, null, 2),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (
        field: string,
        value: string,
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: '',
        }));
    };

    const handleSubmit = (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        // Pastikan GeoJSON valid sebelum dikirim
        try {
            JSON.parse(form.geojson);
        } catch {
            setErrors({
                geojson:
                    'Format GeoJSON tidak valid. Periksa kembali JSON yang dimasukkan.',
            });

            return;
        }

        setProcessing(true);

        // GeoJSON DIKIRIM SEBAGAI STRING
        router.put(
            `/admin/hazard-zones/${zone.id}`,
            {
                disaster_type_id: form.disaster_type_id,
                area_id: form.area_id || '',
                name: form.name,
                level: form.level,
                description: form.description,
                geojson: form.geojson,
            },
            {
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <>
            <Head title={`Edit Zona - ${zone.name}`} />

            <div className="flex flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/hazard-zones"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Edit Zona Rawan
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Perbarui informasi zona rawan bencana.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="max-w-4xl"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* FORM HEADER */}
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                                    <TriangleAlert className="h-5 w-5 text-amber-600" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Informasi Zona
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Lengkapi data zona rawan bencana.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 p-6">
                            {/* NAMA */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Nama Zona
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        handleChange(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Zona Rawan Banjir Kelurahan Jombang"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* JENIS BENCANA + AREA */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* JENIS BENCANA */}
                                <div>
                                    <label
                                        htmlFor="disaster_type_id"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Jenis Bencana
                                    </label>

                                    <select
                                        id="disaster_type_id"
                                        value={
                                            form.disaster_type_id
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                'disaster_type_id',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                                    {errors.disaster_type_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                errors.disaster_type_id
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* AREA */}
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
                                            handleChange(
                                                'area_id',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Semua wilayah
                                        </option>

                                        {areas.map((area) => (
                                            <option
                                                key={area.id}
                                                value={area.id}
                                            >
                                                {area.type.toUpperCase()} -{' '}
                                                {area.name}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.area_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.area_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* LEVEL */}
                            <div>
                                <label
                                    htmlFor="level"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Tingkat Risiko
                                </label>

                                <select
                                    id="level"
                                    value={form.level}
                                    onChange={(e) =>
                                        handleChange(
                                            'level',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="low">
                                        Rendah
                                    </option>

                                    <option value="medium">
                                        Sedang
                                    </option>

                                    <option value="high">
                                        Tinggi
                                    </option>
                                </select>

                                {errors.level && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.level}
                                    </p>
                                )}
                            </div>

                            {/* DESKRIPSI */}
                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Deskripsi
                                </label>

                                <textarea
                                    id="description"
                                    rows={4}
                                    value={form.description}
                                    onChange={(e) =>
                                        handleChange(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Tambahkan keterangan mengenai zona rawan..."
                                    className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* GEOJSON */}
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <Map className="h-4 w-4 text-slate-500" />

                                    <label
                                        htmlFor="geojson"
                                        className="text-sm font-medium text-slate-700"
                                    >
                                        GeoJSON
                                    </label>
                                </div>

                                <textarea
                                    id="geojson"
                                    rows={14}
                                    value={form.geojson}
                                    onChange={(e) =>
                                        handleChange(
                                            'geojson',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full resize-y rounded-lg border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-xs text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.geojson && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.geojson}
                                    </p>
                                )}

                                <p className="mt-2 text-xs text-slate-500">
                                    Format yang diperbolehkan:
                                    Polygon, MultiPolygon, atau Point.
                                </p>
                            </div>

                            {/* WARNING */}
                            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                                <div>
                                    <p className="text-sm font-medium text-amber-800">
                                        Perhatian
                                    </p>

                                    <p className="mt-1 text-sm text-amber-700">
                                        Pastikan koordinat GeoJSON sudah
                                        benar karena data ini akan
                                        digunakan untuk menampilkan zona
                                        rawan pada peta kejadian.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row sm:justify-end">
                            <Link
                                href="/admin/hazard-zones"
                                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
                    </div>
                </form>
            </div>
        </>
    );
}