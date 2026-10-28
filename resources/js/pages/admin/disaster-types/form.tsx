import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent } from 'react';

type DisasterTypeData = {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_active: boolean;
};

type Props = {
    type: DisasterTypeData | null;
};

export default function DisasterTypeForm({ type }: Props) {
    const isEdit = type !== null;

    const form = useForm({
        name: type?.name ?? '',
        color: type?.color ?? '#2563eb',
        is_active: type?.is_active ?? true,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isEdit) {
            form.put(`/admin/disaster-types/${type.id}`);
        } else {
            form.post('/admin/disaster-types');
        }
    };

    const inputClass =
        'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20';

    return (
        <>
            <Head title={isEdit ? 'Edit Jenis Bencana' : 'Tambah Jenis Bencana'} />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/disaster-types"
                        aria-label="Kembali"
                        className="flex size-10 items-center justify-center rounded-xl border border-border transition hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>

                    <h1 className="text-lg font-bold text-foreground">
                        {isEdit ? 'Edit Jenis Bencana' : 'Tambah Jenis Bencana'}
                    </h1>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Nama
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="Contoh: Banjir"
                            className={inputClass}
                        />
                        {form.errors.name && (
                            <p className="text-xs text-red-600">{form.errors.name}</p>
                        )}
                        {isEdit && (
                            <p className="text-xs text-muted-foreground">
                                Slug: <span className="font-medium">{type.slug}</span>{' '}
                                (tidak berubah agar ikon tetap sesuai).
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="color" className="text-sm font-medium">
                            Warna penanda
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.data.color}
                                onChange={(e) => form.setData('color', e.target.value)}
                                aria-label="Pilih warna"
                                className="size-11 shrink-0 cursor-pointer rounded-xl border border-border bg-background p-1"
                            />
                            <input
                                id="color"
                                type="text"
                                value={form.data.color}
                                onChange={(e) => form.setData('color', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        {form.errors.color && (
                            <p className="text-xs text-red-600">{form.errors.color}</p>
                        )}
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-3 py-2.5">
                        <span className="text-sm font-medium">
                            Aktif
                            <span className="block text-xs font-normal text-muted-foreground">
                                Jenis nonaktif tidak muncul di form laporan dan peta.
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                            className="size-4 accent-primary"
                        />
                    </label>

                    <div className="flex justify-end gap-3">
                        <Link
                            href="/admin/disaster-types"
                            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5 disabled:opacity-60"
                        >
                            <Save className="size-4" />
                            {isEdit ? 'Simpan perubahan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

DisasterTypeForm.layout = {
    breadcrumbs: [
        { title: 'Jenis Bencana', href: '/admin/disaster-types' },
    ],
};