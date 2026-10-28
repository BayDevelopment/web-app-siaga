import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';

type DisasterTypeRow = {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_active: boolean;
    reports_count: number;
};

type Props = {
    types: DisasterTypeRow[];
};

type SharedProps = {
    errors?: Record<string, string>;
    flash?: { success?: string };
};

export default function DisasterTypeIndex({ types }: Props) {
    const { errors } = usePage<SharedProps>().props;

    const remove = (type: DisasterTypeRow) => {
        if (!confirm(`Hapus jenis bencana "${type.name}"?`)) {
            return;
        }

        router.delete(`/admin/disaster-types/${type.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Jenis Bencana" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="mt-1 h-9 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                        <div>
                            <h1 className="text-lg font-bold text-foreground">
                                Jenis Bencana
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Kelola jenis kejadian yang bisa dipilih pada
                                laporan.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/admin/disaster-types/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5"
                    >
                        <Plus className="size-4" />
                        Tambah Jenis
                    </Link>
                </div>

                {errors?.delete && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                        {errors.delete}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {types.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-navy-100 text-navy-500 dark:bg-navy-500/15">
                                <Tags className="size-7" />
                            </div>
                            <p className="mt-3 text-sm font-medium">
                                Belum ada jenis bencana
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Jenis</th>
                                        <th className="px-4 py-3">Slug</th>
                                        <th className="px-4 py-3">Laporan</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {types.map((type) => (
                                        <tr
                                            key={type.id}
                                            className="transition-colors hover:bg-navy-50 dark:hover:bg-navy-500/10"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="size-6 shrink-0 rounded-lg shadow-sm"
                                                        style={{
                                                            backgroundColor:
                                                                type.color,
                                                        }}
                                                    />
                                                    <span className="font-semibold">
                                                        {type.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-muted-foreground">
                                                {type.slug}
                                            </td>

                                            <td className="px-4 py-3">
                                                {type.reports_count}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        type.is_active
                                                            ? 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {type.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/admin/disaster-types/${type.id}/edit`}
                                                        aria-label={`Edit ${type.name}`}
                                                        className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-500/10"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            remove(type)
                                                        }
                                                        aria-label={`Hapus ${type.name}`}
                                                        className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

DisasterTypeIndex.layout = {
    breadcrumbs: [
        { title: 'Jenis Bencana', href: '/admin/disaster-types' },
    ],
};