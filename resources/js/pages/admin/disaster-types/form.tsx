import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Loader2, Palette, Save, Tags } from 'lucide-react';
import type { FormEvent } from 'react';

/* ---------- Tipe ---------- */

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

/* ---------- Konstanta ---------- */

const FOCUS_RING =
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

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

const FIELD_CLASS =
    'h-11 w-full rounded-xl border bg-background px-4 text-sm text-foreground transition outline-none placeholder:text-muted-foreground/60 hover:border-muted-foreground/40 focus:ring-2';

const FIELD_OK =
    'border-border focus:border-navy-500 focus:ring-navy-500/20 dark:focus:ring-navy-400/30';

const FIELD_ERROR =
    'border-red-400 focus:border-red-500 focus:ring-red-500/20';

/* ---------- Komponen kecil (di luar halaman agar tidak di-remount) ---------- */

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {message}
        </p>
    );
}

function ActiveBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                active
                    ? 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400'
                    : 'bg-muted text-muted-foreground'
            }`}
        >
            <span
                className={`size-1.5 rounded-full ${
                    active ? 'bg-forest-500' : 'bg-muted-foreground/50'
                }`}
            />
            {active ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

/* ---------- Halaman ---------- */

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

    const title = isEdit ? 'Edit Jenis Bencana' : 'Tambah Jenis Bencana';

    return (
        <>
            <Head title={title} />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 -left-24 size-72 rounded-full bg-navy-400/5 blur-3xl dark:bg-navy-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-sea-400/5 blur-3xl dark:bg-sea-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-forest-400/5 blur-3xl dark:bg-forest-500/10"
                />

                <div className="relative mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
                        <div className="blob -top-16 -right-10 size-64 animate-blob bg-sea-400/20 dark:bg-sea-500/10" />
                        <div className="blob -bottom-20 left-1/3 size-56 animate-blob-slow bg-sun-400/15 dark:bg-sun-500/10" />
                        <div className="blob top-1/2 right-1/4 size-40 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />

                        <div className="relative flex items-start gap-4">
                            <Link
                                href="/admin/disaster-types"
                                aria-label="Kembali ke daftar jenis bencana"
                                className={`group flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-navy-200 hover:bg-navy-50 hover:shadow-md dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 ${FOCUS_RING}`}
                            >
                                <ArrowLeft className="size-6 text-navy-600 transition-transform group-hover:-translate-x-0.5 dark:text-navy-400" />
                            </Link>

                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-semibold tracking-wider text-navy-600 uppercase dark:text-navy-400">
                                    Master Data
                                </p>
                                <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                    {title}
                                </h1>
                                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                    {isEdit
                                        ? `Ubah detail jenis "${type.name}".`
                                        : 'Tambahkan jenis kejadian baru untuk laporan.'}
                                </p>
                            </div>

                            <span className="ml-auto hidden size-14 shrink-0 animate-float items-center justify-center rounded-2xl bg-navy-100 text-navy-600 ring-1 ring-navy-200 sm:flex dark:bg-navy-500/15 dark:text-navy-400 dark:ring-navy-500/30">
                                <Tags className="size-7" />
                            </span>
                        </div>
                    </section>

                    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_16rem]">
                        {/* =================================================
                            FORM
                        ================================================== */}
                        <form
                            onSubmit={submit}
                            className="animate-fade-in-up space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm [animation-delay:100ms] md:p-6"
                        >
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Informasi Jenis
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Nama dan warna tampil di laporan serta
                                        peta.
                                    </p>
                                </div>
                            </div>

                            {/* Nama */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="text-sm font-semibold text-foreground"
                                >
                                    Nama{' '}
                                    <span className="text-red-600 dark:text-red-400">
                                        *
                                    </span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: Banjir"
                                    className={`${FIELD_CLASS} ${
                                        form.errors.name
                                            ? FIELD_ERROR
                                            : FIELD_OK
                                    }`}
                                />
                                <FieldError message={form.errors.name} />
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
                                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
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
                                                className={`flex size-9 items-center justify-center rounded-xl text-white shadow-sm ring-offset-2 ring-offset-card transition hover:scale-110 ${FOCUS_RING} ${
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
                                            form.setData(
                                                'color',
                                                e.target.value,
                                            )
                                        }
                                        aria-label="Pilih warna kustom"
                                        className={`size-11 shrink-0 cursor-pointer rounded-xl border border-border bg-background p-1 ${FOCUS_RING}`}
                                    />
                                    <input
                                        id="color"
                                        type="text"
                                        value={form.data.color}
                                        onChange={(e) =>
                                            form.setData(
                                                'color',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="#2563eb"
                                        className={`${FIELD_CLASS} font-mono ${
                                            form.errors.color
                                                ? FIELD_ERROR
                                                : FIELD_OK
                                        }`}
                                    />
                                </div>
                                <FieldError message={form.errors.color} />
                            </div>

                            {/* Status */}
                            <label
                                className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${
                                    form.data.is_active
                                        ? 'border-forest-400/50 bg-forest-50 dark:border-forest-500/30 dark:bg-forest-500/10'
                                        : 'border-border bg-muted/40'
                                }`}
                            >
                                <span className="text-sm font-semibold text-foreground">
                                    {form.data.is_active ? 'Aktif' : 'Nonaktif'}
                                    <span className="block text-xs font-normal text-muted-foreground">
                                        Jenis nonaktif tidak muncul di form
                                        laporan dan peta.
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
                            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                                <Link
                                    href="/admin/disaster-types"
                                    className={`inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-muted ${FOCUS_RING}`}
                                >
                                    Batal
                                </Link>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-navy-500 px-6 text-sm font-semibold text-white shadow-lg shadow-navy-600/25 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60 ${FOCUS_RING}`}
                                >
                                    {form.processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            {isEdit
                                                ? 'Simpan Perubahan'
                                                : 'Tambah Jenis'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* =================================================
                            PRATINJAU
                        ================================================== */}
                        <aside className="h-fit animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm [animation-delay:180ms] md:sticky md:top-6">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-6 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <h2 className="text-sm font-semibold text-foreground">
                                    Pratinjau
                                </h2>
                            </div>

                            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                                <span
                                    aria-hidden
                                    className="size-10 shrink-0 rounded-xl shadow-sm ring-2 ring-card transition-colors"
                                    style={{ backgroundColor: validColor }}
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {form.data.name || 'Nama jenis'}
                                    </p>
                                    <div className="mt-1">
                                        <ActiveBadge
                                            active={form.data.is_active}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <span
                                    aria-hidden
                                    className="size-3 rounded-full ring-2 ring-card"
                                    style={{ backgroundColor: validColor }}
                                />
                                Begini penanda tampil di peta.
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

DisasterTypeForm.layout = {
    breadcrumbs: [{ title: 'Jenis Bencana', href: '/admin/disaster-types' }],
};