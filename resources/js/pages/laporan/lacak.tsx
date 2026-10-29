import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CircleAlert, Search, Siren } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { StatusBadge } from "@/components/report/badges";
import {
    formatDateTime,
    statusMeta,
    type ReportUpdateItem,
} from "@/lib/report";

/* ---------- Tipe ---------- */

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

/* ---------- Halaman ---------- */

export default function Lacak({ code, searched, result }: Props) {
    const [value, setValue] = useState(code);

    // Sinkronkan input saat prop `code` berubah (mis. hasil navigasi / submit).
    useEffect(() => {
        setValue(code);
    }, [code]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const trimmed = value.trim().toUpperCase();

        if (!trimmed) return;

        router.get(
            "/laporan/lacak",
            { code: trimmed },
            { preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Cek status laporan" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/10 dark:bg-navy-500/10" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/10 dark:bg-sun-500/10" />
                </div>

                <div className="relative mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    {/* =====================================================
                        BACK LINK
                    ====================================================== */}
                    <Link
                        href="/laporan"
                        className="group inline-flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-500/10 dark:hover:text-navy-300"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Kembali ke laporan
                    </Link>

                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <header>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Cek status laporan
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Masukkan kode laporan yang Anda terima setelah
                            mengirim laporan, misalnya LP-20261029-0001.
                        </p>
                    </header>

                    {/* =====================================================
                        FORM PENCARIAN
                    ====================================================== */}
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
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
                                    spellCheck={false}
                                    className="w-full rounded-xl border border-border bg-background py-3 pr-4 pl-10 text-sm font-medium uppercase outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 dark:focus:ring-navy-400/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!value.trim()}
                                className="rounded-xl bg-sun-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-sun-500 disabled:hover:shadow-sm dark:bg-sun-400 dark:hover:bg-sun-300"
                            >
                                Cek status
                            </button>
                        </div>
                    </form>

                    {/* =====================================================
                        HASIL TIDAK DITEMUKAN
                    ====================================================== */}
                    {searched && !result && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700 shadow-sm dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-300"
                        >
                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                Laporan dengan kode &quot;{code}&quot; tidak
                                ditemukan. Periksa kembali penulisan kode,
                                termasuk tanda hubung.
                            </p>
                        </div>
                    )}

                    {/* =====================================================
                        HASIL DITEMUKAN
                    ====================================================== */}
                    {result && (
                        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Kode laporan
                                    </p>
                                    <p className="mt-1 font-semibold tracking-wide break-all text-foreground">
                                        {result.code}
                                    </p>
                                </div>
                                <StatusBadge status={result.status} />
                            </div>

                            <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
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
                                            : "Belum diverifikasi"}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-5 border-t border-border pt-5">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Riwayat perkembangan
                                </h2>

                                {result.updates.length === 0 ? (
                                    <p className="mt-2 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground">
                                        Belum ada pembaruan dari petugas.
                                    </p>
                                ) : (
                                    <ol className="relative mt-4 space-y-5 border-l border-border pl-5">
                                        {result.updates.map((update) => (
                                            <li key={update.id} className="relative">
                                                <span
                                                    aria-hidden
                                                    className="absolute top-1.5 -left-[1.58rem] size-2.5 rounded-full border-2 border-card bg-navy-500 ring-1 ring-navy-200 dark:bg-navy-400 dark:ring-navy-500/30"
                                                />
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

                    {/* =====================================================
                        CTA LAPORAN BARU
                    ====================================================== */}
                    <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm md:p-5">
                        <p>
                            Belum melapor? Laporkan kejadian di sekitar Anda,
                            tanpa perlu akun.
                        </p>
                        <Link
                            href="/laporan/create"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sun-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sun-400 hover:shadow-md dark:bg-sun-400 dark:hover:bg-sun-300"
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