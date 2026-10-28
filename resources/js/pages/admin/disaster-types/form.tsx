import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Palette, Save, Tags } from 'lucide-react';
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

const PRESET_COLORS = [
    '#2563eb',
    '#0ea5e9',
    '#16a34a',
    '#f59e0b',
    '#ea580c',
    '#dc2626',
    '#9333ea',
    '#64748b',
];

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

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

    const validColor = HEX_PATTERN.test(form.data.color)
        ? form.data.color
        : '#94a3b8';

    const inputClass =
        'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-navy-400 focus:ring-4 focus:ring-ring/20';

    const title = isEdit ? 'Edit Jenis Bencana' : 'Tambah Jenis Bencana';

    return (
        <>
            <Head title={title} />

            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ===== Hero ===== */}
                <div className="animate-fade-in relative overflow-hidden rounded-3xl bg-linear-to-br from-navy-900 via-navy-800 to-navy-600 p-5 text-white shadow-lg shadow-navy-900/20 md:p-6">
                    <div className="blob animate-blob -top-14 -right-8 size-52 bg-sea-400/40" />
                    <div className="blob animate-blob-slow -bottom-16 left-1/3 size-44 bg-sun-400/25" />

                    <div className="relative flex items-center gap-4">
                        <Link
                            href="/admin/disaster-types"
                            aria-label="Kembali"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>

                        <span className="animate-float hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur sm:flex">
                            <Tags className="size-6 text-sun-300" />
                        </span>

                        <div className="min-w-0">
                            <h1 className="text-lg font-bold md:text-xl">
                                {title}
                            </h1>
                            <p className="text-sm text-white/70">
                                {isEdit
                                    ? `Ubah detail jenis "${type.name}".`
                                    : 'Tambahkan jenis kejadian baru untuk laporan.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
                    {/* ===== Form ===== */}
                    <form
                        onSubmit={submit}
                        className="animate-fade-in-up space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                            <div>
                                <h2 className="text-sm font-bold">
                                    Informasi jenis
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Nama dan warna tampil di laporan serta peta.
                                </p>
                            </div>
                        </div>

                        {/* Nama */}
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-sm font-semibold"
                            >
                                Nama <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Banjir"
                                className={`${inputClass} ${
                                    form.errors.name
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                        : ''
                                }`}
                            />
                            {form.errors.name && (
                                <p className="text-xs text-red-600">
                                    {form.errors.name}
                                </p>
                            )}
                            {isEdit && (
                                <p className="text-xs text-muted-foreground">
                                    Slug:{' '}
                                    <code className="rounded-md bg-muted px-1.5 py-0.5 font-medium">
                                        {type.slug}
                                    </code>{' '}
                                    (tidak berubah agar ikon tetap sesuai).
                                </p>
                            )}
                        </div>

                        {/* Warna */}
                        <div className="space-y-3">
                            <label
                                htmlFor="color"
                                className="flex items-center gap-2 text-sm font-semibold"
                            >
                                <Palette className="size-4 text-navy-500" />
                                Warna penanda
                            </label>

                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((c) => {
                                    const selected =
                                        form.data.color.toLowerCase() === c;

                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() =>
                                                form.setData('color', c)
                                            }
                                            aria-label={`Pilih warna ${c}`}
                                            aria-pressed={selected}
                                            style={{ backgroundColor: c }}
                                            className={`flex size-9 items-center justify-center rounded-xl text-white shadow-sm ring-offset-2 ring-offset-card transition hover:scale-110 ${
                                                selected
                                                    ? 'ring-2 ring-navy-500'
                                                    : 'ring-1 ring-black/5'
                                            }`}
                                        >
                                            {selected && (
                                                <Check className="size-4" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={validColor}
                                    onChange={(e) =>
                                        form.setData('color', e.target.value)
                                    }
                                    aria-label="Pilih warna kustom"
                                    className="size-11 shrink-0 cursor-pointer rounded-xl border border-border bg-background p-1"
                                />
                                <input
                                    id="color"
                                    type="text"
                                    value={form.data.color}
                                    onChange={(e) =>
                                        form.setData('color', e.target.value)
                                    }
                                    placeholder="#2563eb"
                                    className={`${inputClass} font-mono ${
                                        form.errors.color
                                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                            : ''
                                    }`}
                                />
                            </div>
                            {form.errors.color && (
                                <p className="text-xs text-red-600">
                                    {form.errors.color}
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <label
                            className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${
                                form.data.is_active
                                    ? 'border-forest-400/50 bg-forest-50 dark:border-forest-500/30 dark:bg-forest-500/10'
                                    : 'border-border bg-muted/40'
                            }`}
                        >
                            <span className="text-sm font-semibold">
                                {form.data.is_active ? 'Aktif' : 'Nonaktif'}
                                <span className="block text-xs font-normal text-muted-foreground">
                                    Jenis nonaktif tidak muncul di form laporan
                                    dan peta.
                                </span>
                            </span>

                            <span className="relative shrink-0">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                    className="peer sr-only"
                                />
                                <span className="block h-6 w-11 rounded-full bg-muted-foreground/30 transition peer-checked:bg-forest-500 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/30" />
                                <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                            </span>
                        </label>

                        {/* Aksi */}
                        <div className="flex justify-end gap-3 border-t border-border pt-5">
                            <Link
                                href="/admin/disaster-types"
                                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-5 py-2.5 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                <Save className="size-4" />
                                {form.processing
                                    ? 'Menyimpan...'
                                    : isEdit
                                      ? 'Simpan perubahan'
                                      : 'Tambah'}
                            </button>
                        </div>
                    </form>

                    {/* ===== Pratinjau ===== */}
                    <aside className="animate-fade-in-up h-fit rounded-2xl border border-border bg-card p-5 shadow-sm [animation-delay:120ms] md:sticky md:top-6">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Pratinjau
                        </p>

                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3">
                            <span
                                className="size-10 shrink-0 rounded-xl shadow-sm ring-1 ring-black/5 transition-colors"
                                style={{ backgroundColor: validColor }}
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {form.data.name || 'Nama jenis'}
                                </p>
                                <span
                                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                        form.data.is_active
                                            ? 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    <span
                                        className={`size-1.5 rounded-full ${
                                            form.data.is_active
                                                ? 'bg-forest-500'
                                                : 'bg-muted-foreground/50'
                                        }`}
                                    />
                                    {form.data.is_active
                                        ? 'Aktif'
                                        : 'Nonaktif'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                                className="size-3 rounded-full ring-2 ring-white dark:ring-card"
                                style={{ backgroundColor: validColor }}
                            />
                            Begini penanda tampil di peta.
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

DisasterTypeForm.layout = {
    breadcrumbs: [{ title: 'Jenis Bencana', href: '/admin/disaster-types' }],
};