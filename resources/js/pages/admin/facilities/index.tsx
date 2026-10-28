import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Edit,
    MapPin,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

type Facility = {
    id: number;
    name: string;
    type: string;
    latitude: number | string;
    longitude: number | string;
    address: string | null;
    capacity: number | null;
    contact_phone: string | null;
    is_active: boolean;
    area: {
        id: number;
        name: string;
        type: string;
    } | null;
    created_at: string | null;
};

type Props = {
    facilities: Facility[];
};

const facilityTypeLabels: Record<string, string> = {
    evacuation_point: 'Titik Evakuasi',
    posko: 'Posko',
    hydrant: 'Hidran',
    fire_post: 'Pos Damkar',
    clinic: 'Klinik',
};

export default function FacilityIndex({
    facilities,
}: Props) {
    const [search, setSearch] = useState('');

    const filteredFacilities = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) {
            return facilities;
        }

        return facilities.filter((facility) => {
            return (
                facility.name.toLowerCase().includes(keyword) ||
                facility.type.toLowerCase().includes(keyword) ||
                facility.address
                    ?.toLowerCase()
                    .includes(keyword) ||
                facility.area?.name
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [facilities, search]);

    const handleDelete = (facility: Facility) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus fasilitas "${facility.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(
            `/admin/facilities/${facility.id}`,
        );
    };

    return (
        <>
            <Head title="Fasilitas Darurat" />

            <div className="flex flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Fasilitas Darurat
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Kelola fasilitas yang dapat digunakan
                            dalam penanganan keadaan darurat.
                        </p>
                    </div>

                    <Link
                        href="/admin/facilities/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Fasilitas
                    </Link>
                </div>

                {/* SUMMARY */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    Total Fasilitas
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {facilities.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Titik Evakuasi
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {
                                facilities.filter(
                                    (facility) =>
                                        facility.type ===
                                        'evacuation_point',
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Posko
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {
                                facilities.filter(
                                    (facility) =>
                                        facility.type ===
                                        'posko',
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Pos Damkar
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {
                                facilities.filter(
                                    (facility) =>
                                        facility.type ===
                                        'fire_post',
                                ).length
                            }
                        </p>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Cari nama fasilitas, jenis, wilayah, atau alamat..."
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                        Fasilitas
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                        Jenis
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                        Wilayah
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                        Lokasi
                                    </th>

                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-right font-semibold text-slate-700">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredFacilities.length > 0 ? (
                                    filteredFacilities.map(
                                        (facility) => (
                                            <tr
                                                key={facility.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                {/* FASILITAS */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                                            <Building2 className="h-5 w-5 text-blue-600" />
                                                        </div>

                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {
                                                                    facility.name
                                                                }
                                                            </p>

                                                            {facility.address && (
                                                                <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                                                                    {
                                                                        facility.address
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* JENIS */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                        {facilityTypeLabels[
                                                            facility.type
                                                        ] ??
                                                            facility.type}
                                                    </span>
                                                </td>

                                                {/* WILAYAH */}
                                                <td className="px-6 py-4">
                                                    {facility.area ? (
                                                        <div>
                                                            <p className="font-medium text-slate-800">
                                                                {
                                                                    facility
                                                                        .area
                                                                        .name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                {
                                                                    facility
                                                                        .area
                                                                        .type
                                                                }
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            Semua wilayah
                                                        </span>
                                                    )}
                                                </td>

                                                {/* LOKASI */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="h-4 w-4 shrink-0" />

                                                        <div>
                                                            <p>
                                                                {Number(
                                                                    facility.latitude,
                                                                ).toFixed(
                                                                    6,
                                                                )}
                                                            </p>

                                                            <p>
                                                                {Number(
                                                                    facility.longitude,
                                                                ).toFixed(
                                                                    6,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-6 py-4">
                                                    {facility.is_active ? (
                                                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                            Tidak Aktif
                                                        </span>
                                                    )}
                                                </td>

                                                {/* AKSI */}
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/admin/facilities/${facility.id}/edit`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            Edit
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    facility,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                                    <Building2 className="h-7 w-7 text-slate-400" />
                                                </div>

                                                <h3 className="mt-4 font-medium text-slate-900">
                                                    Tidak ada fasilitas
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {search
                                                        ? 'Tidak ditemukan fasilitas yang sesuai dengan pencarian.'
                                                        : 'Belum ada fasilitas darurat yang ditambahkan.'}
                                                </p>

                                                {!search && (
                                                    <Link
                                                        href="/admin/facilities/create"
                                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Tambah Fasilitas
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}