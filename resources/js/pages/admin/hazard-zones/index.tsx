import { Head, Link, router } from "@inertiajs/react";
import { Edit, Map, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

type DisasterType = {
    id: number;
    name: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    type: string;
};

type HazardZone = {
    id: number;
    name: string;
    level: "low" | "medium" | "high";
    description: string | null;
    geojson: {
        type: string;
        coordinates: unknown;
    };
    disaster_type: DisasterType | null;
    area: Area | null;
    created_at: string | null;
};

type Props = {
    zones: HazardZone[];
};

const levelConfig = {
    low: {
        label: "Rendah",
        className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    },
    medium: {
        label: "Sedang",
        className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    },
    high: {
        label: "Tinggi",
        className: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    },
};

export default function HazardZonesIndex({ zones }: Props) {
    const [search, setSearch] = useState("");

    const filteredZones = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) {
            return zones;
        }

        return zones.filter((zone) => {
            return (
                zone.name.toLowerCase().includes(keyword) ||
                zone.disaster_type?.name.toLowerCase().includes(keyword) ||
                zone.area?.name.toLowerCase().includes(keyword) ||
                zone.level.toLowerCase().includes(keyword)
            );
        });
    }, [zones, search]);

    const handleDelete = (zone: HazardZone) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus zona rawan "${zone.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/admin/hazard-zones/${zone.id}`);
    };

    return (
        <>
            <Head title="Zona Rawan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <TriangleAlert className="h-6 w-6 text-amber-500" />

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Zona Rawan
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Kelola wilayah yang memiliki potensi risiko bencana.
                        </p>
                    </div>

                    <Link
                        href="/admin/hazard-zones/create"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Zona
                    </Link>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Total Zona
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {zones.length}
                                </p>
                            </div>

                            <div className="rounded-lg bg-amber-50 p-2.5">
                                <Map className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Risiko Tinggi
                                </p>

                                <p className="mt-1 text-2xl font-bold text-red-600">
                                    {
                                        zones.filter(
                                            (zone) => zone.level === "high",
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-lg bg-red-50 p-2.5">
                                <TriangleAlert className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Risiko Sedang
                                </p>

                                <p className="mt-1 text-2xl font-bold text-amber-600">
                                    {
                                        zones.filter(
                                            (zone) => zone.level === "medium",
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-lg bg-amber-50 p-2.5">
                                <TriangleAlert className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Risiko Rendah
                                </p>

                                <p className="mt-1 text-2xl font-bold text-emerald-600">
                                    {
                                        zones.filter(
                                            (zone) => zone.level === "low",
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-lg bg-emerald-50 p-2.5">
                                <TriangleAlert className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Daftar Zona Rawan
                            </h2>

                            <p className="text-sm text-slate-500">
                                {filteredZones.length} zona ditampilkan
                            </p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari zona, bencana, wilayah..."
                                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredZones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="rounded-full bg-amber-50 p-4">
                                <TriangleAlert className="h-8 w-8 text-amber-500" />
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-slate-900">
                                {search
                                    ? "Zona tidak ditemukan"
                                    : "Belum ada zona rawan"}
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                {search
                                    ? "Coba gunakan kata kunci pencarian yang berbeda."
                                    : "Tambahkan zona rawan untuk menampilkannya pada peta kejadian."}
                            </p>

                            {!search && (
                                <Link
                                    href="/admin/hazard-zones/create"
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Zona
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">
                                            Zona
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Jenis Bencana
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Wilayah
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Tingkat Risiko
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Bentuk
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredZones.map((zone) => {
                                        const level = levelConfig[zone.level];

                                        return (
                                            <tr
                                                key={zone.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                {/* Zona */}
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {zone.name}
                                                        </p>

                                                        {zone.description && (
                                                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                                                {
                                                                    zone.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Disaster Type */}
                                                <td className="px-6 py-4">
                                                    {zone.disaster_type ? (
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="h-2.5 w-2.5 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        zone
                                                                            .disaster_type
                                                                            .color,
                                                                }}
                                                            />

                                                            <span className="text-slate-700">
                                                                {
                                                                    zone
                                                                        .disaster_type
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Area */}
                                                <td className="px-6 py-4">
                                                    {zone.area ? (
                                                        <div>
                                                            <p className="font-medium text-slate-700">
                                                                {zone.area.name}
                                                            </p>

                                                            <p className="text-xs uppercase text-slate-400">
                                                                {zone.area.type}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            Global
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Level */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${level.className}`}
                                                    >
                                                        {level.label}
                                                    </span>
                                                </td>

                                                {/* GeoJSON */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                        <Map className="h-3.5 w-3.5" />
                                                        {zone.geojson.type}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/admin/hazard-zones/${zone.id}/edit`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            Edit
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    zone,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
