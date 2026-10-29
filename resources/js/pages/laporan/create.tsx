import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CircleAlert,
    FileText,
    Info,
    ShieldCheck,
    User,
} from 'lucide-react';
import {
    useEffect,
    useState,
    type ComponentProps,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from 'react';

import ReportForm, {
    type ReportFormData,
} from '@/components/report/report-form';
import {
    nowForDateTimeLocal,
    type AreaOption,
    type DisasterType,
} from '@/lib/report';

type Props = {
    types: DisasterType[];
    areas: AreaOption[];
};

type SharedProps = {
    auth?: { user?: { role?: string } | null };
};

/** Data form ditambah field khusus pelapor tanpa akun dan honeypot anti-bot. */
type CreateFormData = ReportFormData & {
    reporter_name: string;
    reporter_phone: string;
    website: string;
};

const inputClass =
    'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20';

/* ---------- Helper animasi & skeleton ---------- */

function Reveal({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <div
            className={`animate-fade-in-up ${className}`}
            style={{ animationDelay: `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}

function useFakeLoading(ms = 500) {
    // Form tetap menyimpan state di useForm milik halaman ini,
    // jadi aman jika ReportForm baru ditampilkan setelah skeleton.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), ms);
        return () => clearTimeout(t);
    }, [ms]);

    return loading;
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="skeleton h-5 w-44" />

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-11 w-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-11 w-full" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="skeleton h-3.5 w-28" />
                    <div className="skeleton h-11 w-full" />
                </div>

                <div className="space-y-2">
                    <div className="skeleton h-3.5 w-20" />
                    <div className="skeleton h-28 w-full" />
                </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-48 w-full" />
            </div>

            <div className="flex justify-end gap-3">
                <div className="skeleton h-11 w-24" />
                <div className="skeleton h-11 w-36" />
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */

export default function Create({ types, areas }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const loading = useFakeLoading(500);

    const isGuest = !auth?.user;

    // Admin dan petugas langsung terverifikasi (sesuai ReportController@store).
    const isStaff = ['admin', 'petugas'].includes(auth?.user?.role ?? '');

    const form = useForm<CreateFormData>({
        disaster_type_id: '',
        area_id: '',
        title: '',
        description: '',
        latitude: '',
        longitude: '',
        address: '',
        severity: '',
        occurred_at: nowForDateTimeLocal(),
        photos: [],
        delete_photo_ids: [],
        reporter_name: '',
        reporter_phone: '',
        website: '',
    });

    // Error batas pengiriman datang dari RateLimiter "laporan" (bukan field form).
    const errors = form.errors as Record<string, string | undefined>;

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post('/laporan', { forceFormData: true });
    }

    return (
        <>
            <Head title="Buat laporan kejadian" />

            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Blob latar halaman */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="blob -top-24 -left-24 h-80 w-80 animate-blob bg-navy-400/20" />
                    <div className="blob top-1/3 -right-32 h-96 w-96 animate-blob-slow bg-sun-300/20" />
                    <div className="blob -bottom-32 left-1/4 h-80 w-80 animate-blob bg-forest-400/15" />
                </div>

                <div className="relative mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
                    {/* Header */}
                    <header className="relative animate-fade-in overflow-hidden rounded-3xl bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 p-5 text-white shadow-xl shadow-navy-900/20 md:p-6">
                        <div className="blob -top-16 -right-12 h-56 w-56 animate-blob bg-sun-400/30" />
                        <div className="blob -bottom-20 left-1/3 h-56 w-56 animate-blob-slow bg-sea-400/25" />
                        <div className="blob -bottom-12 -left-8 h-44 w-44 animate-blob bg-forest-500/25" />

                        <div className="relative flex items-center gap-4">
                            <Link
                                href="/laporan"
                                aria-label="Kembali ke daftar laporan"
                                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                            </Link>

                            <div className="min-w-0">
                                <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                                    Buat laporan kejadian
                                </h1>
                                <p className="mt-1 text-sm text-navy-100/80">
                                    Laporkan kejadian bencana di wilayah Anda.
                                    Tidak perlu membuat akun.
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Catatan sesuai role */}
                    <Reveal delay={60}>
                        {isStaff ? (
                            <Notice
                                tone="forest"
                                icon={<ShieldCheck className="h-5 w-5" />}
                                title="Mode petugas"
                            >
                                Laporan yang Anda buat langsung terverifikasi
                                dan tampil di peta publik.
                            </Notice>
                        ) : (
                            <Notice
                                tone="navy"
                                icon={<Info className="h-5 w-5" />}
                                title="Laporan akan diperiksa dulu"
                            >
                                Petugas memeriksa laporan Anda sebelum
                                ditampilkan sebagai kejadian terverifikasi.
                                {isGuest
                                    ? ' Setelah terkirim, Anda akan mendapat kode laporan untuk memeriksa statusnya.'
                                    : ' Anda masih bisa mengedit laporan selama statusnya menunggu verifikasi.'}
                            </Notice>
                        )}
                    </Reveal>

                    {/* Batas pengiriman tercapai */}
                    {errors.rate_limit && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{errors.rate_limit}</p>
                        </div>
                    )}

                    {/* Data pelapor (hanya untuk pengunjung tanpa akun) */}
                    {isGuest && (
                        <Reveal delay={90}>
                            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="h-6 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                        <User className="h-4 w-4 text-navy-500" />
                                        Data pelapor
                                    </h2>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="reporter_name"
                                            className="mb-1.5 block text-sm font-medium text-foreground"
                                        >
                                            Nama{' '}
                                            <span className="font-normal text-muted-foreground">
                                                (opsional)
                                            </span>
                                        </label>
                                        <input
                                            id="reporter_name"
                                            type="text"
                                            value={form.data.reporter_name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'reporter_name',
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={100}
                                            autoComplete="name"
                                            placeholder="Nama Anda"
                                            className={inputClass}
                                        />
                                        {errors.reporter_name && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.reporter_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="reporter_phone"
                                            className="mb-1.5 block text-sm font-medium text-foreground"
                                        >
                                            No. HP{' '}
                                            <span className="font-normal text-muted-foreground">
                                                (opsional)
                                            </span>
                                        </label>
                                        <input
                                            id="reporter_phone"
                                            type="tel"
                                            inputMode="tel"
                                            value={form.data.reporter_phone}
                                            onChange={(e) =>
                                                form.setData(
                                                    'reporter_phone',
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={20}
                                            autoComplete="tel"
                                            placeholder="08xxxxxxxxxx"
                                            className={inputClass}
                                        />
                                        {errors.reporter_phone && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.reporter_phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    Nama dan nomor HP hanya dilihat petugas
                                    untuk konfirmasi dan tidak ditampilkan ke
                                    publik. Lokasi kejadian ditampilkan sebagai
                                    perkiraan.
                                </p>
                            </section>
                        </Reveal>
                    )}

                    {/* Honeypot: tidak terlihat oleh warga, hanya diisi bot */}
                    <div
                        aria-hidden="true"
                        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                    >
                        <label htmlFor="website">Website</label>
                        <input
                            id="website"
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={form.data.website}
                            onChange={(e) =>
                                form.setData('website', e.target.value)
                            }
                        />
                    </div>

                    {/* Form */}
                    {loading ? (
                        <FormSkeleton />
                    ) : (
                        <Reveal delay={120}>
                            <ReportForm
                                form={
                                    form as unknown as ComponentProps<
                                        typeof ReportForm
                                    >['form']
                                }
                                types={types}
                                areas={areas}
                                onSubmit={submit}
                                cancelHref="/laporan"
                                submitLabel={
                                    isStaff
                                        ? 'Simpan dan verifikasi'
                                        : 'Kirim laporan'
                                }
                                submitIcon={
                                    isStaff ? (
                                        <ShieldCheck className="h-4 w-4" />
                                    ) : (
                                        <FileText className="h-4 w-4" />
                                    )
                                }
                            />
                        </Reveal>
                    )}
                </div>
            </div>
        </>
    );
}

function Notice({
    tone,
    icon,
    title,
    children,
}: {
    tone: 'forest' | 'navy';
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    const styles =
        tone === 'forest'
            ? 'border-forest-400/40 bg-forest-50 text-forest-800 dark:border-forest-500/20 dark:bg-forest-500/10 dark:text-forest-400 [&_.icon]:bg-forest-100 [&_.icon]:text-forest-600 dark:[&_.icon]:bg-forest-500/15 dark:[&_.icon]:text-forest-400'
            : 'border-navy-200 bg-navy-50 text-navy-800 dark:border-navy-500/20 dark:bg-navy-500/10 dark:text-navy-200 [&_.icon]:bg-navy-100 [&_.icon]:text-navy-600 dark:[&_.icon]:bg-navy-500/15 dark:[&_.icon]:text-navy-400';

    return (
        <div className={`flex gap-3 rounded-2xl border p-4 ${styles}`}>
            <div className="icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                {icon}
            </div>

            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6">{children}</p>
            </div>
        </div>
    );
}