import { Head, Link, router, usePage } from '@inertiajs/react';

type Row = {
    id: number;
    name: string;
    type: 'kelurahan' | 'rw' | 'rt';
    slug: string | null;
    parent: string | null;
    is_active: boolean;
    has_boundary: boolean;
    reports_count: number;
};

const TYPE_LABEL: Record<Row['type'], string> = { kelurahan: 'Kelurahan', rw: 'RW', rt: 'RT' };

export default function AreasIndex({ areas }: { areas: Row[] }) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;

    const remove = (a: Row) => {
        if (confirm(`Hapus wilayah "${a.name}"?`)) {
            router.delete(`/admin/areas/${a.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Kelola wilayah" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Wilayah</h1>
                        <p className="text-sm text-muted-foreground">
                            Daftarkan kelurahan, RW, atau RT, lalu gambar batasnya di peta.
                        </p>
                    </div>
                    <Link
                        href="/admin/areas/create"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        Tambah wilayah
                    </Link>
                </div>

                {errors.delete && (
                    <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                        {errors.delete}
                    </p>
                )}

                {areas.length === 0 ? (
                    <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                        Belum ada wilayah. Mulai dengan menambahkan kelurahan, lalu RW di bawahnya.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Nama</th>
                                    <th className="px-3 py-2 font-medium">Jenis</th>
                                    <th className="px-3 py-2 font-medium">Induk</th>
                                    <th className="px-3 py-2 font-medium">Batas</th>
                                    <th className="px-3 py-2 font-medium">Laporan</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {areas.map((a) => (
                                    <tr key={a.id} className="border-b last:border-0">
                                        <td className="px-3 py-2 font-medium">{a.name}</td>
                                        <td className="px-3 py-2">{TYPE_LABEL[a.type]}</td>
                                        <td className="px-3 py-2">{a.parent ?? '-'}</td>
                                        <td className="px-3 py-2">{a.has_boundary ? 'Sudah digambar' : 'Belum ada'}</td>
                                        <td className="px-3 py-2 tabular-nums">{a.reports_count}</td>
                                        <td className="px-3 py-2">{a.is_active ? 'Aktif' : 'Nonaktif'}</td>
                                        <td className="space-x-3 whitespace-nowrap px-3 py-2 text-right">
                                            {a.slug && a.is_active && (
                                                <a
                                                    href={`/wilayah/${a.slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="underline"
                                                >
                                                    Lihat peta
                                                </a>
                                            )}
                                            <Link href={`/admin/areas/${a.id}/edit`} className="underline">
                                                Ubah
                                            </Link>
                                            <button type="button" onClick={() => remove(a)} className="text-red-600 underline">
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
