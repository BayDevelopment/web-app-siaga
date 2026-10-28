import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleSlash,
    FileText,
    Layers,
    Pencil,
    Plus,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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

type StatusFilter = 'all' | 'active' | 'inactive';

const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'inactive', label: 'Nonaktif' },
];

function StatCard({
    label,
    value,
    icon: Icon,
    tone,
    delay,
}: {
    label: string;
    value: number;
    icon: typeof Layers;
    tone: 'navy' | 'forest' | 'sun' | 'sea';
    delay: number;
}) {
    const tones = {
        navy: 'bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400',
        forest: 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400',
        sun: 'bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-400',
        sea: 'bg-sea-300/30 text-navy-600 dark:bg-sea-400/15 dark:text-sea-300',
    };

    return (
        <div
            className="animate-fade-in-up group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                        {value}
                    </p>
                </div>
                <span
                    className={`flex size-11 items-center justify-center rounded-xl transition group-hover:scale-110 ${tones[tone]}`}
                >
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
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

export default function DisasterTypeIndex({ types }: Props) {
    const { errors, flash } = usePage<SharedProps>().props;

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<StatusFilter>('all');

    const stats = useMemo(() => {
        const active = types.filter((t) => t.is_active).length;

        return {
            total: types.length,
            active,
            inactive: types.length - active,
            reports: types.reduce((sum, t) => sum + t.reports_count, 0),
        };
    }, [types]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return types.filter((t) => {
            if (filter === 'active' && !t.is_active) {
                return false;
            }

            if (filter === 'inactive' && t.is_active) {
                return false;
            }

            return (
                q === '' ||
                t.name.toLowerCase().includes(q) ||
                t.slug.toLowerCase().includes(q)
            );
        });
    }, [types, search, filter]);

    const remove = (type: DisasterTypeRow) => {
        if (!confirm(`Hapus jenis bencana "${type.name}"?`)) {
            return;
        }

        router.delete(`/admin/disaster-types/${type.id}`, {
            preserveScroll: true,
        });
    };

    const ActionButtons = ({ type }: { type: DisasterTypeRow }) => (
        <div className="flex justify-end gap-2">
            <Link
                href={`/admin/disaster-types/${type.id}/edit`}
                aria-label={`Edit ${type.name}`}
                className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-500/10"
            >
                <Pencil className="size-4" />
            </Link>

            <button
                type="button"
                onClick={() => remove(type)}
                aria-label={`Hapus ${type.name}`}
                className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
                <Trash2 className="size-4" />
            </button>
        </div>
    );

    return (
        <>
            <Head title="Jenis Bencana" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ===== Hero ===== */}
                <div className="animate-fade-in relative overflow-hidden rounded-3xl bg-linear-to-br from-navy-900 via-navy-800 to-navy-600 p-6 text-white shadow-lg shadow-navy-900/20 md:p-8">
                    <div className="blob animate-blob -top-16 -right-10 size-64 bg-sea-400/40" />
                    <div className="blob animate-blob-slow -bottom-20 left-1/3 size-56 bg-sun-400/25" />
                    <div className="blob animate-blob right-1/4 top-1/2 size-40 bg-forest-400/20" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="animate-float flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                                <Tags className="size-7 text-sun-300" />
                            </span>
                            <div>
                                <h1 className="text-xl font-bold md:text-2xl">
                                    Jenis Bencana
                                </h1>
                                <p className="mt-1 max-w-md text-sm text-white/70">
                                    Kelola jenis kejadian yang bisa dipilih
                                    warga dan petugas saat membuat laporan.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/admin/disaster-types/create"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <Plus className="size-4" />
                            Tambah Jenis
                        </Link>
                    </div>
                </div>

                {/* ===== Notifikasi ===== */}
                {flash?.success && (
                    <div className="animate-fade-in-up flex items-center gap-3 rounded-2xl border border-forest-400/40 bg-forest-50 p-4 text-sm text-forest-800 dark:border-forest-500/20 dark:bg-forest-500/10 dark:text-forest-400">
                        <CheckCircle2 className="size-5 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {errors?.delete && (
                    <div className="animate-fade-in-up flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                        <CircleSlash className="size-5 shrink-0" />
                        {errors.delete}
                    </div>
                )}

                {/* ===== Statistik ===== */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="Total jenis"
                        value={stats.total}
                        icon={Layers}
                        tone="navy"
                        delay={0}
                    />
                    <StatCard
                        label="Aktif"
                        value={stats.active}
                        icon={CheckCircle2}
                        tone="forest"
                        delay={70}
                    />
                    <StatCard
                        label="Nonaktif"
                        value={stats.inactive}
                        icon={CircleSlash}
                        tone="sun"
                        delay={140}
                    />
                    <StatCard
                        label="Total laporan"
                        value={stats.reports}
                        icon={FileText}
                        tone="sea"
                        delay={210}
                    />
                </div>

                {/* ===== Daftar ===== */}
                <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:280ms]">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                            <div>
                                <h2 className="text-sm font-bold text-foreground">
                                    Daftar jenis
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Menampilkan {filtered.length} dari{' '}
                                    {types.length} jenis
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama atau slug..."
                                    className="h-10 w-full rounded-xl border border-input bg-background pr-9 pl-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-navy-400 focus:ring-4 focus:ring-ring/20 sm:w-64"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        aria-label="Hapus pencarian"
                                        className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex rounded-xl bg-muted p-1">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        type="button"
                                        onClick={() => setFilter(f.key)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            filter === f.key
                                                ? 'bg-card text-navy-600 shadow-sm dark:text-navy-400'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="animate-float mx-auto flex size-16 items-center justify-center rounded-full bg-navy-100 text-navy-500 dark:bg-navy-500/15">
                                <Tags className="size-8" />
                            </div>
                            <p className="mt-4 text-sm font-semibold">
                                {types.length === 0
                                    ? 'Belum ada jenis bencana'
                                    : 'Tidak ada hasil yang cocok'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {types.length === 0
                                    ? 'Tambahkan jenis pertama agar bisa dipilih pada laporan.'
                                    : 'Coba ubah kata kunci atau filter status.'}
                            </p>
                            {types.length === 0 && (
                                <Link
                                    href="/admin/disaster-types/create"
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
                                >
                                    <Plus className="size-4" />
                                    Tambah Jenis
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile: kartu */}
                            <ul className="divide-y divide-border md:hidden">
                                {filtered.map((type) => (
                                    <li key={type.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="mt-0.5 size-10 shrink-0 rounded-xl shadow-sm ring-1 ring-black/5"
                                                style={{
                                                    backgroundColor: type.color,
                                                }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">
                                                    {type.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {type.slug}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <StatusBadge
                                                        active={type.is_active}
                                                    />
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
                                                        <FileText className="size-3" />
                                                        {type.reports_count}{' '}
                                                        laporan
                                                    </span>
                                                </div>
                                            </div>
                                            <ActionButtons type={type} />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Desktop: tabel */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-left text-xs tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-5 py-3">Jenis</th>
                                            <th className="px-5 py-3">Slug</th>
                                            <th className="px-5 py-3">
                                                Laporan
                                            </th>
                                            <th className="px-5 py-3">
                                                Status
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border">
                                        {filtered.map((type) => (
                                            <tr
                                                key={type.id}
                                                className="transition-colors hover:bg-navy-50 dark:hover:bg-navy-500/10"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className="size-9 shrink-0 rounded-xl shadow-sm ring-1 ring-black/5"
                                                            style={{
                                                                backgroundColor:
                                                                    type.color,
                                                            }}
                                                        />
                                                        <div>
                                                            <p className="font-semibold">
                                                                {type.name}
                                                            </p>
                                                            <p className="font-mono text-[11px] text-muted-foreground uppercase">
                                                                {type.color}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                        {type.slug}
                                                    </code>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
                                                        <FileText className="size-3" />
                                                        {type.reports_count}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <StatusBadge
                                                        active={type.is_active}
                                                    />
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <ActionButtons type={type} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

DisasterTypeIndex.layout = {
    breadcrumbs: [{ title: 'Jenis Bencana', href: '/admin/disaster-types' }],
};