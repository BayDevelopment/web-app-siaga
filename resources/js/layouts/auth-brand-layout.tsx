import { Satellite, SatelliteDish } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    title: string;
    description: string;
    children: ReactNode;
};

const LOGO = '/img-logo-sidebar.png';

const highlights = [
    { dot: 'bg-sea-400', label: 'Pemantauan satelit real-time' },
    { dot: 'bg-sun-400', label: 'Peringatan dini yang cepat & akurat' },
    { dot: 'bg-forest-400', label: 'Kesiapsiagaan wilayah pesisir, gunung & kota' },
];

/**
 * Layout split-screen bertema SIGAP BENCANA untuk halaman auth
 * (register, reset password, dst). Kiri: hero brand. Kanan: form + orbit satelit.
 */
export default function AuthBrandLayout({
    title,
    description,
    children,
}: Props) {
    return (
        <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
            {/* ===== Panel kiri: hero brand ===== */}
            <aside className="relative hidden overflow-hidden bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 text-white lg:flex lg:flex-col lg:justify-between lg:gap-12 lg:px-12 lg:py-14">
                <div className="blob -top-24 -left-24 size-96 animate-blob bg-sea-400/30" />
                <div className="blob top-1/3 -right-28 size-[26rem] animate-blob-slow bg-sun-400/25" />
                <div className="blob -bottom-32 left-1/4 size-96 animate-blob bg-forest-500/25" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="glass flex size-16 shrink-0 animate-fade-in items-center justify-center rounded-2xl p-1.5">
                        <img
                            src={LOGO}
                            alt="Logo SIGAP BENCANA"
                            className="size-full object-contain"
                        />
                    </div>
                    <div className="animate-fade-in-up leading-tight [animation-delay:150ms]">
                        <span className="block text-2xl font-bold tracking-wide">
                            SIGAP BENCANA
                        </span>
                        <span className="mt-1 block text-[0.7rem] font-medium tracking-[0.3em] text-sea-300 uppercase">
                            Siap • Tanggap • Aman • Bersama
                        </span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg py-6">
                    <p className="mb-3 animate-fade-in-up text-sm font-medium tracking-[0.25em] text-sea-300 uppercase">
                        Selamat datang
                    </p>
                    <h1 className="animate-fade-in-up text-4xl leading-tight font-bold [animation-delay:100ms] xl:text-5xl">
                        Siaga hari ini,{' '}
                        <span className="text-gradient-brand">
                            aman esok hari.
                        </span>
                    </h1>
                    <p className="mt-5 animate-fade-in-up text-base leading-relaxed text-navy-100 [animation-delay:200ms]">
                        Dari ombak di pesisir, lereng gunung, hingga permukiman
                        kota — pantau, pahami, dan bertindak lebih cepat bersama
                        data satelit yang terpercaya.
                    </p>

                    <ul className="mt-8 space-y-3">
                        {highlights.map((item, i) => (
                            <li
                                key={item.label}
                                style={{ animationDelay: `${300 + i * 100}ms` }}
                                className="glass flex animate-fade-in-up items-center gap-3 rounded-xl px-4 py-3 text-sm text-white [&]:border-white/10 [&]:bg-white/10"
                            >
                                <span
                                    className={`size-2.5 shrink-0 rounded-full ${item.dot}`}
                                />
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative z-10 animate-fade-in pt-4 [animation-delay:700ms]">
                    <div className="mb-4 flex h-1 w-40 overflow-hidden rounded-full">
                        <span className="flex-1 bg-navy-500" />
                        <span className="flex-1 bg-sea-400" />
                        <span className="flex-1 bg-forest-500" />
                        <span className="flex-1 bg-sun-400" />
                    </div>
                    <p className="text-xs text-navy-200">
                        &copy; {new Date().getFullYear()} SIGAP BENCANA. Siap,
                        Tanggap, Aman, Bersama.
                    </p>
                </div>
            </aside>

            {/* ===== Panel kanan: form + nuansa satelit ===== */}
            <main className="relative flex items-center justify-center overflow-hidden bg-linear-to-b from-navy-50 via-background to-sea-300/10 px-6 py-12 sm:px-10 dark:from-navy-950 dark:via-background dark:to-navy-900">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(var(--color-navy-200)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] dark:opacity-25"
                />

                <div className="blob -top-20 -right-20 size-72 animate-blob bg-sea-300/25" />
                <div className="blob -bottom-24 -left-16 size-72 animate-blob-slow bg-sun-300/25" />

                {/* orbit satelit */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex animate-fade-in items-center justify-center [animation-delay:400ms]"
                >
                    <div className="absolute size-[36rem] rounded-full border border-dashed border-navy-200 dark:border-navy-800" />
                    <div className="absolute size-[36rem] animate-[spin_45s_linear_infinite]">
                        <span className="absolute -top-5 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-card text-navy-500 shadow-lg shadow-navy-600/20 ring-1 ring-navy-100 dark:text-navy-400 dark:ring-navy-800">
                            <Satellite className="size-5 rotate-45" />
                        </span>
                    </div>

                    <div className="absolute size-[26rem] rounded-full border border-navy-100 dark:border-navy-800/70" />
                    <div className="absolute size-[26rem] animate-[spin_30s_linear_infinite_reverse]">
                        <span className="absolute top-1/2 -right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-sun-400 text-white shadow-md shadow-sun-500/40">
                            <Satellite className="size-3.5 -rotate-45" />
                        </span>
                    </div>
                </div>

                {/* status sinyal */}
                <div className="glass absolute top-6 right-6 flex animate-fade-in items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 text-xs font-medium text-foreground shadow-sm">
                    <span className="flex size-8 animate-pulse-ring items-center justify-center rounded-full bg-forest-500 text-white">
                        <SatelliteDish className="size-4" />
                    </span>
                    Terhubung ke satelit
                </div>

                <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
                    <div className="mb-8 text-center lg:hidden">
                        <span className="text-gradient-brand text-2xl font-bold">
                            SIGAP BENCANA
                        </span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground">
                            {title}
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="glass rounded-2xl p-6 shadow-xl shadow-navy-900/10 sm:p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}