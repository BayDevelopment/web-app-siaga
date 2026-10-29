import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CircleAlert, Search, Siren } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { StatusBadge } from '@/components/report/badges';
import {
    formatDateTime,
    statusMeta,
    type ReportUpdateItem,
} from '@/lib/report';

type TrackResult = {
    code: string;
    status: string;
    created_at: string | null;
    verified_at: string | null;
    updates: ReportUpdateItem[];
};

type Props = {
    code: string;
    searched: boolean;
    result: TrackResult | null;
};

export default function Lacak({ code, searched, result }: Props) {
    const [value, setValue] = useState(code);

    function submit(event: FormEvent) {
        event.preventDefault();

        const trimmed = value.trim();

        if (!trimmed) {
            return;
        }

        router.get(
            '/laporan/lacak',
            { code: trimmed },
            { preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Cek status laporan" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/20" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/20" />
                </div>

                <div className="relative mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
                    <Link
                        href="/laporan"
                        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Kembali ke laporan
                    </Link>

                    <header>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Cek status laporan
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Masukkan kode laporan yang Anda terima setelah
                            mengirim laporan, misalnya LP-20261029-0001.
                        </p>
                    </header>

                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                        <label htmlFor="code" className="sr-only">
                            Kode laporan
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    id="code"
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="LP-20261029-0001"
                                    autoComplete="off"
                                    className="w-full rounded-xl border border-border bg-background py-2.5 pr-4 pl-10 text-sm uppercase outline-none transition placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                                Cek status
                            </button>
                        </div>
                    </form>

                    {searched && !result && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                Laporan dengan kode &quot;{code}&quot; tidak
                                ditemukan. Periksa kembali penulisan kode,
                                termasuk tanda hubung.
                            </p>
                        </div>
                    )}

                    {result && (
                        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Kode laporan
                                    </p>
                                    <p className="font-semibold text-foreground">
                                        {result.code}
                                    </p>
                                </div>

                                <StatusBadge status={result.status} />
                            </div>

                            <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Dikirim
                                    </dt>
                                    <dd className="mt-1 font-medium text-foreground">
                                        {formatDateTime(result.created_at)}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Diverifikasi
                                    </dt>
                                    <dd className="mt-1 font-medium text-foreground">
                                        {result.verified_at
                                            ? formatDateTime(result.verified_at)
                                            : 'Belum diverifikasi'}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-5 border-t border-border pt-5">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Riwayat perkembangan
                                </h2>

                                {result.updates.length === 0 ? (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Belum ada pembaruan dari petugas.
                                    </p>
                                ) : (
                                    <ol className="mt-4 space-y-5 border-l-2 border-navy-100 pl-5 dark:border-navy-500/20">
                                        {result.updates.map((update) => (
                                            <li key={update.id}>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {
                                                            statusMeta(
                                                                update.status,
                                                            ).label
                                                        }
                                                    </span>
                                                    <time
                                                        dateTime={
                                                            update.created_at ??
                                                            undefined
                                                        }
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        {formatDateTime(
                                                            update.created_at,
                                                        )}
                                                    </time>
                                                </div>

                                                {update.note && (
                                                    <p className="mt-1 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                                                        {update.note}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
                        <p>
                            Belum melapor? Laporkan kejadian di sekitar Anda,
                            tanpa perlu akun.
                        </p>

                        <Link
                            href="/laporan/create"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sun-400 to-sun-500 px-4 py-2 text-sm font-semibold text-navy-950 shadow-md shadow-sun-500/30 transition hover:-translate-y-0.5"
                        >
                            <Siren className="h-4 w-4" />
                            Laporkan kejadian
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}