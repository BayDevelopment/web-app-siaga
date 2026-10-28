import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type DisasterType = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    slug: string;
    type: string;
    parent_id: number | null;
};

type Report = {
    id: number;
    code: string;
    disaster_type_id: number;
    area_id: number | null;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    severity: string;
    status: string;
    occurred_at: string | null;
};

type Props = {
    report: Report;
    types: DisasterType[];
    areas: Area[];
};

export default function Edit({ report, types, areas }: Props) {
    const formatDateTimeLocal = (date: string | null) => {
        if (!date) return '';

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return date.slice(0, 16);
        }

        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - offset * 60 * 1000);

        return localDate.toISOString().slice(0, 16);
    };

    const { data, setData, put, processing, errors } = useForm({
        disaster_type_id: String(report.disaster_type_id),
        area_id: report.area_id ? String(report.area_id) : '',
        title: report.title ?? '',
        description: report.description ?? '',
        latitude: String(report.latitude),
        longitude: String(report.longitude),
        address: report.address ?? '',
        severity: report.severity ?? 'low',
        occurred_at: formatDateTimeLocal(report.occurred_at),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        put(`/laporan/${report.id}`);
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung fitur lokasi.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData('latitude', position.coords.latitude.toFixed(7));
                setData('longitude', position.coords.longitude.toFixed(7));
            },
            () => {
                alert('Lokasi tidak dapat diperoleh. Pastikan izin lokasi diberikan.');
            },
        );
    };

    return (
        <>
            <Head title={`Edit Laporan ${report.code}`} />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                            <Link
                                href="/laporan"
                                className="transition hover:text-blue-600"
                            >
                                Laporan
                            </Link>

                            <span>/</span>

                            <Link
                                href={`/laporan/${report.id}`}
                                className="transition hover:text-blue-600"
                            >
                                {report.code}
                            </Link>

                            <span>/</span>

                            <span className="text-slate-700">Edit</span>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900">
                            Edit Laporan
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Perbarui informasi laporan kejadian.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">

                        {/* Informasi Kejadian */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Informasi Kejadian
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Informasi utama mengenai kejadian yang dilaporkan.
                                </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">

                                {/* Jenis */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Jenis Kejadian
                                    </label>

                                    <select
                                        value={data.disaster_type_id}
                                        onChange={(e) =>
                                            setData('disaster_type_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Pilih jenis kejadian</option>

                                        {types.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.disaster_type_id && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.disaster_type_id}
                                        </p>
                                    )}
                                </div>

                                {/* Wilayah */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Wilayah
                                    </label>

                                    <select
                                        value={data.area_id}
                                        onChange={(e) =>
                                            setData('area_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Pilih wilayah</option>

                                        {areas.map((area) => (
                                            <option key={area.id} value={area.id}>
                                                {area.name}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.area_id && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.area_id}
                                        </p>
                                    )}
                                </div>

                                {/* Judul */}
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Judul Laporan
                                    </label>

                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder="Contoh: Banjir di Jalan Raya..."
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Deskripsi */}
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Deskripsi
                                    </label>

                                    <textarea
                                        rows={5}
                                        value={data.description}
                                        onChange={(e) =>
                                            setData('description', e.target.value)
                                        }
                                        placeholder="Jelaskan kondisi kejadian secara detail..."
                                        className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lokasi */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Lokasi Kejadian
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Perbarui titik lokasi dan alamat kejadian.
                                </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">

                                {/* Latitude */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Latitude
                                    </label>

                                    <input
                                        type="text"
                                        value={data.latitude}
                                        onChange={(e) =>
                                            setData('latitude', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.latitude && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.latitude}
                                        </p>
                                    )}
                                </div>

                                {/* Longitude */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Longitude
                                    </label>

                                    <input
                                        type="text"
                                        value={data.longitude}
                                        onChange={(e) =>
                                            setData('longitude', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.longitude && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.longitude}
                                        </p>
                                    )}
                                </div>

                                {/* Tombol lokasi */}
                                <div className="md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                    >
                                        📍 Gunakan Lokasi Saat Ini
                                    </button>
                                </div>

                                {/* Alamat */}
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Alamat
                                    </label>

                                    <textarea
                                        rows={3}
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                        placeholder="Masukkan alamat atau lokasi kejadian..."
                                        className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Kondisi */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Kondisi Kejadian
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Perbarui tingkat keparahan dan waktu kejadian.
                                </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">

                                {/* Severity */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Tingkat Keparahan
                                    </label>

                                    <select
                                        value={data.severity}
                                        onChange={(e) =>
                                            setData('severity', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                        <option value="critical">Kritis</option>
                                    </select>

                                    {errors.severity && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.severity}
                                        </p>
                                    )}
                                </div>

                                {/* Waktu */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Waktu Kejadian
                                    </label>

                                    <input
                                        type="datetime-local"
                                        value={data.occurred_at}
                                        onChange={(e) =>
                                            setData('occurred_at', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.occurred_at && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.occurred_at}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center justify-end gap-3">
                            <Link
                                href={`/laporan/${report.id}`}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}