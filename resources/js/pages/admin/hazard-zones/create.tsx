import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Map,
    Save,
    TriangleAlert,
} from 'lucide-react';
import { FormEvent, useMemo } from 'react';

import BoundaryEditor, {
    type PolygonGeo,
} from '@/components/map/boundary-editor';

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

type Props = {
    types: DisasterType[];
    areas: Area[];
};

type FormData = {
    disaster_type_id: string;
    area_id: string;
    name: string;
    level: string;
    description: string;
    geojson: string;
};

export default function HazardZoneCreate({
    types,
    areas,
}: Props) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm<FormData>({
        disaster_type_id: '',
        area_id: '',
        name: '',
        level: 'medium',
        description: '',
        geojson: '',
    });

    const areaOptions = useMemo(() => {
        return areas.map((area) => ({
            ...area,
            label:
                area.type === 'rw'
                    ? `RW — ${area.name}`
                    : area.type === 'rt'
                        ? `RT — ${area.name}`
                        : area.name,
        }));
    }, [areas]);

    const handleGeoChange = (
        geo: PolygonGeo | null,
    ) => {
        setData(
            'geojson',
            geo ? JSON.stringify(geo) : '',
        );
    };

    const handleSubmit = (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!data.name.trim()) {
            toast.error('Nama zona wajib diisi.');
            return;
        }

        if (!data.disaster_type_id) {
            toast.error('Silakan pilih jenis bencana.');
            return;
        }

        if (!data.geojson) {
            toast.warning(
                'Silakan gambar zona terlebih dahulu pada peta.',
            );
            return;
        }

        post('/admin/hazard-zones', {
            onSuccess: () => {
                toast.success(
                    'Zona rawan berhasil ditambahkan.',
                );
            },

            onError: (formErrors) => {
                console.error(
                    'Gagal menyimpan zona rawan:',
                    formErrors,
                );

                toast.error(
                    'Zona rawan gagal ditambahkan. Periksa data yang diisi.',
                );
            },
        });
    };

    const currentGeo: PolygonGeo | null =
        data.geojson
            ? (() => {
                try {
                    return JSON.parse(
                        data.geojson,
                    ) as PolygonGeo;
                } catch {
                    return null;
                }
            })()
            : null;

    return (
        <>
            <Head title="Tambah Zona Rawan" />

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">

                        <Link
                            href="/admin/hazard-zones"
                            className="mt-1 rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>

                        <div>
                            <div className="flex items-center gap-2">
                                <TriangleAlert className="h-6 w-6 text-amber-500" />

                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Tambah Zona Rawan
                                </h1>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                Tambahkan wilayah yang memiliki potensi risiko bencana.
                            </p>
                        </div>

                    </div>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="grid gap-6 lg:grid-cols-3"
                >

                    {/* MAIN */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* INFORMASI ZONA */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="mb-6">
                                <h2 className="font-semibold text-slate-900">
                                    Informasi Zona
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Masukkan informasi dasar zona rawan.
                                </p>
                            </div>

                            <div className="space-y-5">

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
                                        value={data.name}
                                        onChange={(event) =>
                                            setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Zona Rawan Banjir Sungai"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                    />

                                    {errors.name && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

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
                                        value={data.disaster_type_id}
                                        onChange={(event) =>
                                            setData(
                                                'disaster_type_id',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.disaster_type_id}
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
                                        value={data.area_id}
                                        onChange={(event) =>
                                            setData(
                                                'area_id',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Kosongkan jika zona berlaku secara umum.
                                    </p>

                                    {errors.area_id && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.area_id}
                                        </p>
                                    )}
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
                                        value={data.level}
                                        onChange={(event) =>
                                            setData(
                                                'level',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                                        <p className="mt-1.5 text-xs text-red-600">
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
                                        rows={5}
                                        value={data.description}
                                        onChange={(event) =>
                                            setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Jelaskan kondisi atau karakteristik zona rawan..."
                                        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                    />

                                    {errors.description && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* PETA ZONA */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="mb-6">
                                <div className="flex items-center gap-2">
                                    <Map className="h-5 w-5 text-slate-600" />

                                    <h2 className="font-semibold text-slate-900">
                                        Tentukan Wilayah Zona
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Klik titik-titik pada peta untuk menggambar batas zona rawan.
                                </p>
                            </div>

                            <BoundaryEditor
                                value={currentGeo}
                                onChange={(geo) =>
                                    handleGeoChange(geo)
                                }
                            />

                            {errors.geojson && (
                                <p className="mt-3 text-xs text-red-600">
                                    {errors.geojson}
                                </p>
                            )}

                            {!data.geojson && (
                                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    Silakan gambar minimal 3 titik pada peta sebelum menyimpan zona.
                                </div>
                            )}

                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-6">

                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                            <h2 className="font-semibold text-slate-900">
                                Simpan Zona
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Pastikan seluruh informasi dan batas wilayah sudah benar.
                            </p>

                            <div className="mt-5 space-y-3">

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />

                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Zona'}
                                </button>

                                <Link
                                    href="/admin/hazard-zones"
                                    className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Batal
                                </Link>

                            </div>
                        </div>

                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                            <div className="flex gap-3">

                                <Map className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                <div>
                                    <h3 className="text-sm font-semibold text-blue-900">
                                        Cara menentukan zona
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-blue-800">
                                        Klik beberapa titik mengikuti batas wilayah yang ingin ditetapkan sebagai zona rawan. Sistem akan otomatis menyimpan bentuk tersebut sebagai GeoJSON.
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </>
    );
}