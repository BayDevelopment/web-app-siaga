import { Head, Link, router, usePage } from "@inertiajs/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import type {
    MapBoundary,
    MapFacility,
    MapReport,
    MapType,
    MapZone,
} from "@/components/map/disaster-map";

// Leaflet butuh `window`, jadi dimuat lazy dan hanya setelah komponen mount di browser.
const DisasterMap = lazy(() => import("@/components/map/disaster-map"));

type Contact = { id: number; name: string; role: string | null; phone: string };

type Announcement = {
    id: number;
    title: string;
    body: string;
    level: "info" | "waspada" | "siaga" | "awas";
    published_at: string | null;
};

type Props = {
    canRegister: boolean;
    center: [number, number];
    zoom: number;
    boundary: MapBoundary | null;
    reports: MapReport[];
    types: MapType[];
    zones: MapZone[];
    facilities: MapFacility[];
    contacts: Contact[];
    announcements: Announcement[];
};

const LEVEL_CLASS: Record<Announcement["level"], string> = {
    info: "bg-sky-600 text-white",
    waspada: "bg-amber-400 text-neutral-900",
    siaga: "bg-orange-600 text-white",
    awas: "bg-red-600 text-white",
};

const LEVEL_LABEL: Record<Announcement["level"], string> = {
    info: "Info",
    waspada: "Waspada",
    siaga: "Siaga",
    awas: "Awas",
};

const REFRESH_MS = 60_000;

export default function Welcome({
    canRegister,
    center,
    zoom,
    boundary,
    reports,
    types,
    zones,
    facilities,
    contacts,
    announcements,
}: Props) {
    const { auth } = usePage<{ auth?: { user?: unknown } }>().props;
    const isLoggedIn = Boolean(auth?.user);

    const [mounted, setMounted] = useState(false);
    const [activeTypeIds, setActiveTypeIds] = useState<number[]>(() =>
        types.map((t) => t.id),
    );
    const [showZones, setShowZones] = useState(true);
    const [showFacilities, setShowFacilities] = useState(true);
    const [showContacts, setShowContacts] = useState(false);

    useEffect(() => setMounted(true), []);

    // Muat ulang data laporan dan pengumuman tiap 1 menit tanpa reload halaman.
    useEffect(() => {
        const id = setInterval(
            () => router.reload({ only: ["reports", "announcements"] }),
            REFRESH_MS,
        );
        return () => clearInterval(id);
    }, []);

    const countByType = useMemo(() => {
        const map = new Map<number, number>();
        reports.forEach((r) =>
            map.set(r.type_id, (map.get(r.type_id) ?? 0) + 1),
        );
        return map;
    }, [reports]);

    const visibleCount = reports.filter((r) =>
        activeTypeIds.includes(r.type_id),
    ).length;

    const toggleType = (id: number) =>
        setActiveTypeIds((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
        );

    const chipBase =
        "pointer-events-auto flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm shadow-sm backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

    return (
        <>
            <Head title="Peta kejadian RW 07 Warnasari" />

            <div className="relative h-svh w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                <div className="absolute inset-0">
                    {mounted && (
                        <Suspense
                            fallback={
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Memuat peta...
                                </div>
                            }
                        >
                            <DisasterMap
                                center={center}
                                zoom={zoom}
                                boundary={boundary}
                                boundaryName="Wilayah aktif"
                                reports={reports}
                                types={types}
                                zones={zones}
                                facilities={facilities}
                                activeTypeIds={activeTypeIds}
                                showZones={showZones}
                                showFacilities={showFacilities}
                            />
                        </Suspense>
                    )}
                </div>

                {/* Header melayang di atas peta */}
                <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-2 p-3 sm:p-4">
                    <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border bg-background/90 px-4 py-2.5 shadow-sm backdrop-blur">
                        <div className="min-w-0">
                            <h1 className="text-base font-semibold leading-tight">
                                SIAGA-W
                            </h1>
                            <p className="truncate text-xs text-muted-foreground">
                                Peta kejadian RW 07, Kelurahan Warnasari
                            </p>
                        </div>
                        <nav className="flex shrink-0 items-center gap-2 text-sm">
                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    className="rounded-md border px-3 py-1.5 hover:bg-accent"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="rounded-md px-3 py-1.5 hover:bg-accent"
                                    >
                                        Masuk
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href="/register"
                                            className="rounded-md border px-3 py-1.5 hover:bg-accent"
                                        >
                                            Daftar
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>

                    {announcements.map((a) => (
                        <div
                            key={a.id}
                            role="alert"
                            className={`pointer-events-auto rounded-xl px-4 py-2.5 text-sm shadow-sm ${LEVEL_CLASS[a.level]}`}
                        >
                            <p className="font-semibold">
                                {LEVEL_LABEL[a.level]}: {a.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 opacity-95">
                                {a.body}
                            </p>
                        </div>
                    ))}

                    {/* Filter jenis bencana dan layer */}
                    <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
                        {types.map((t) => {
                            const active = activeTypeIds.includes(t.id);
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggleType(t.id)}
                                    className={`${chipBase} ${
                                        active
                                            ? "border-foreground/20 bg-background/95"
                                            : "border-transparent bg-background/60 text-muted-foreground"
                                    }`}
                                >
                                    <span
                                        className="size-2.5 rounded-full"
                                        style={{
                                            backgroundColor: t.color,
                                            opacity: active ? 1 : 0.4,
                                        }}
                                    />
                                    {t.name}
                                    <span className="text-xs text-muted-foreground">
                                        {countByType.get(t.id) ?? 0}
                                    </span>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            aria-pressed={showZones}
                            onClick={() => setShowZones((v) => !v)}
                            className={`${chipBase} ${
                                showZones
                                    ? "border-foreground/20 bg-background/95"
                                    : "border-transparent bg-background/60 text-muted-foreground"
                            }`}
                        >
                            Zona rawan
                        </button>
                        <button
                            type="button"
                            aria-pressed={showFacilities}
                            onClick={() => setShowFacilities((v) => !v)}
                            className={`${chipBase} ${
                                showFacilities
                                    ? "border-foreground/20 bg-background/95"
                                    : "border-transparent bg-background/60 text-muted-foreground"
                            }`}
                        >
                            Titik kumpul dan posko
                        </button>
                    </div>
                </header>

                {visibleCount === 0 && (
                    <p className="pointer-events-none absolute inset-x-0 bottom-24 z-[1000] mx-auto w-fit max-w-[90%] rounded-full border bg-background/90 px-4 py-2 text-center text-sm shadow-sm backdrop-blur">
                        Belum ada kejadian aktif yang dilaporkan.
                    </p>
                )}

                {/* Panel nomor darurat */}
                {showContacts && (
                    <section
                        aria-label="Nomor darurat"
                        className="absolute bottom-20 right-3 z-[1000] w-72 max-w-[calc(100%-1.5rem)] rounded-xl border bg-background/95 p-3 shadow-md backdrop-blur sm:right-4"
                    >
                        <h2 className="mb-2 text-sm font-semibold">
                            Nomor darurat
                        </h2>
                        {contacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada nomor yang didaftarkan.
                            </p>
                        ) : (
                            <ul className="space-y-1">
                                {contacts.map((c) => (
                                    <li key={c.id}>
                                        <a
                                            href={`tel:${c.phone}`}
                                            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">
                                                    {c.name}
                                                </span>
                                                {c.role && (
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {c.role}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-xs tabular-nums">
                                                {c.phone}
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {/* Aksi utama */}
                <div className="absolute bottom-4 right-3 z-[1000] flex items-center gap-2 sm:right-4">
                    <button
                        type="button"
                        aria-expanded={showContacts}
                        onClick={() => setShowContacts((v) => !v)}
                        className="rounded-full border bg-background/95 px-4 py-2.5 text-sm font-medium shadow-md backdrop-blur hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Nomor darurat
                    </button>
                    <Link
                        href={isLoggedIn ? "/laporan/create" : "/login"}
                        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Lapor kejadian
                    </Link>
                </div>
            </div>
        </>
    );
}
