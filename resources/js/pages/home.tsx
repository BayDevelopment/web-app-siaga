import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ClipboardList,
    LoaderCircle,
    Phone,
    Plus,
    RefreshCw,
    ShieldAlert,
    Siren,
    TriangleAlert,
    WifiOff,
    X,
    Info,
    type LucideIcon,
} from 'lucide-react';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import type {
    MapBoundary,
    MapFacility,
    MapReport,
    MapType,
    MapZone,
} from '@/components/map/disaster-map';

// Leaflet butuh `window`, jadi dimuat lazy dan hanya setelah mount di browser.
const DisasterMap = lazy(() => import('@/components/map/disaster-map'));

/* ============================================================
   Tipe
============================================================ */

type Contact = {
    id: number;
    name: string;
    role: string | null;
    phone: string;
};

type Level = 'info' | 'waspada' | 'siaga' | 'awas';

type Announcement = {
    id: number;
    title: string;
    body: string;
    level: Level;
    published_at: string | null;
};

type Props = {
    canRegister?: boolean;
    regionName?: string;

    center?: [number, number];
    zoom?: number;
    boundary?: MapBoundary | null;

    reports?: MapReport[];
    types?: MapType[];
    zones?: MapZone[];
    facilities?: MapFacility[];

    contacts?: Contact[];
    announcements?: Announcement[];
};

type SharedProps = {
    auth?: { user?: unknown | null };
};

/* ============================================================
   Konfigurasi
============================================================ */

const REFRESH_MS = 60_000;

const LEVELS: Record<
    Level,
    { label: string; rank: number; className: string; icon: LucideIcon }
> = {
    info: {
        label: 'Info',
        rank: 0,
        className: 'bg-sky-600 text-white',
        icon: Info,
    },
    waspada: {
        label: 'Waspada',
        rank: 1,
        className: 'bg-amber-400 text-neutral-900',
        icon: TriangleAlert,
    },
    siaga: {
        label: 'Siaga',
        rank: 2,
        className: 'bg-orange-600 text-white',
        icon: ShieldAlert,
    },
    awas: {
        label: 'Awas',
        rank: 3,
        className: 'bg-red-600 text-white',
        icon: Siren,
    },
};

function levelOf(level: string) {
    return LEVELS[level as Level] ?? LEVELS.info;
}

function formatClock(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/* ============================================================
   Halaman
============================================================ */

export default function Home({
    canRegister = false,
    regionName = 'RW 07, Kelurahan Warnasari',
    center,
    zoom = 15,
    boundary = null,
    reports = [],
    types = [],
    zones = [],
    facilities = [],
    contacts = [],
    announcements = [],
}: Props) {
    const { auth } = usePage<SharedProps>().props;
    const isLoggedIn = Boolean(auth?.user);

    const [mounted, setMounted] = useState(false);

    const [activeTypeIds, setActiveTypeIds] = useState<number[]>(() =>
        types.map((type) => type.id),
    );
    const [showZones, setShowZones] = useState(true);
    const [showFacilities, setShowFacilities] = useState(true);

    useEffect(() => setMounted(true), []);

    /* ---------- Muat ulang data berkala ---------- */

    const [refreshing, setRefreshing] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(() => new Date());
    const lastRefresh = useRef(Date.now());

    const refresh = useCallback(() => {
        router.reload({
            only: ['reports', 'announcements'],
            onStart: () => setRefreshing(true),
            onSuccess: () => {
                lastRefresh.current = Date.now();
                setUpdatedAt(new Date());
            },
            onFinish: () => setRefreshing(false),
        });
    }, []);

    useEffect(() => {
        // Tidak memuat ulang saat tab tersembunyi supaya hemat data dan baterai.
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                refresh();
            }
        }, REFRESH_MS);

        const onVisible = () => {
            if (
                document.visibilityState === 'visible' &&
                Date.now() - lastRefresh.current > REFRESH_MS
            ) {
                refresh();
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refresh]);

    /* ---------- Status koneksi (sinyal sering buruk saat darurat) ---------- */

    const [online, setOnline] = useState(true);

    useEffect(() => {
        const sync = () => setOnline(navigator.onLine);

        sync();
        window.addEventListener('online', sync);
        window.addEventListener('offline', sync);

        return () => {
            window.removeEventListener('online', sync);
            window.removeEventListener('offline', sync);
        };
    }, []);

    /* ---------- Turunan data ---------- */

    const countByType = useMemo(() => {
        const counts = new Map<number, number>();

        for (const report of reports) {
            counts.set(report.type_id, (counts.get(report.type_id) ?? 0) + 1);
        }

        return counts;
    }, [reports]);

    const visibleCount = useMemo(
        () =>
            reports.filter((report) => activeTypeIds.includes(report.type_id))
                .length,
        [reports, activeTypeIds],
    );

    function toggleType(id: number) {
        setActiveTypeIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    }

    /* ---------- Render ---------- */

    return (
        <>
            <Head title={`Peta kejadian ${regionName}`} />

            <div className="relative h-svh w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                {/* Peta */}
                <div className="absolute inset-0">
                    {mounted && center ? (
                        <Suspense fallback={<MapPlaceholder text="Memuat peta" loading />}>
                            <DisasterMap
                                center={center}
                                zoom={zoom}
                                boundary={boundary}
                                boundaryName={regionName}
                                reports={reports}
                                types={types}
                                zones={zones}
                                facilities={facilities}
                                activeTypeIds={activeTypeIds}
                                showZones={showZones}
                                showFacilities={showFacilities}
                            />
                        </Suspense>
                    ) : (
                        <MapPlaceholder
                            text={
                                mounted
                                    ? 'Data peta belum tersedia.'
                                    : 'Memuat peta'
                            }
                            loading={!mounted}
                        />
                    )}
                </div>

                {/* Lapisan antarmuka */}
                <div className="pointer-events-none absolute inset-0 z-[1100] flex flex-col">
                    <header className="flex flex-col gap-2 p-3 sm:p-4">
                        <TopBar
                            regionName={regionName}
                            isLoggedIn={isLoggedIn}
                            canRegister={canRegister}
                        />

                        <Announcements items={announcements} />

                        <StatusLine
                            count={visibleCount}
                            online={online}
                            refreshing={refreshing}
                            updatedAt={updatedAt}
                            onRefresh={refresh}
                        />

                        <div
                            role="group"
                            aria-label="Filter peta"
                            className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0"
                        >
                            {types.map((type) => (
                                <Chip
                                    key={type.id}
                                    active={activeTypeIds.includes(type.id)}
                                    onClick={() => toggleType(type.id)}
                                    swatch={type.color}
                                    count={countByType.get(type.id) ?? 0}
                                >
                                    {type.name}
                                </Chip>
                            ))}

                            <Chip
                                active={showZones}
                                onClick={() => setShowZones((v) => !v)}
                            >
                                Zona rawan
                            </Chip>

                            <Chip
                                active={showFacilities}
                                onClick={() => setShowFacilities((v) => !v)}
                            >
                                Titik kumpul dan posko
                            </Chip>
                        </div>
                    </header>

                    {visibleCount === 0 && center && (
                        <p
                            role="status"
                            className="pointer-events-none mx-auto mt-auto mb-28 w-fit max-w-[90%] rounded-full border bg-background/90 px-4 py-2 text-center text-sm shadow-sm backdrop-blur"
                        >
                            {reports.length === 0
                                ? 'Belum ada kejadian aktif yang dilaporkan.'
                                : 'Tidak ada kejadian untuk jenis yang dipilih.'}
                        </p>
                    )}
                </div>

                {/* Aksi utama. Dinaikkan sedikit agar atribusi peta tetap terbaca. */}
                <div className="absolute bottom-7 right-3 z-[1100] flex flex-col items-end gap-2 sm:right-4">
                    <ContactsMenu contacts={contacts} />

                    <Link
                        href="/laporan/create"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        <Plus className="size-4" />
                        Lapor kejadian
                    </Link>
                </div>
            </div>
        </>
    );
}

/* ============================================================
   Bagian-bagian halaman
============================================================ */

function TopBar({
    regionName,
    isLoggedIn,
    canRegister,
}: {
    regionName: string;
    isLoggedIn: boolean;
    canRegister: boolean;
}) {
    const linkClass =
        'rounded-md px-3 py-1.5 text-sm transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary';

    return (
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Siren className="size-5" />
                </span>

                <div className="min-w-0">
                    <h1 className="text-base font-semibold leading-tight">
                        SIAGA-W
                    </h1>
                    <p className="truncate text-xs text-muted-foreground">
                        {regionName}
                    </p>
                </div>
            </div>

            <nav
                aria-label="Navigasi utama"
                className="flex shrink-0 items-center gap-1"
            >
                <Link href="/laporan" className={`${linkClass} inline-flex items-center gap-1.5`}>
                    <ClipboardList className="size-4" />
                    <span className="hidden sm:inline">Laporan</span>
                </Link>

                {isLoggedIn ? (
                    <Link
                        href="/dashboard"
                        className={`${linkClass} border`}
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link href="/login" className={linkClass}>
                            Masuk
                        </Link>

                        {canRegister && (
                            <Link
                                href="/register"
                                className={`${linkClass} border`}
                            >
                                Daftar
                            </Link>
                        )}
                    </>
                )}
            </nav>
        </div>
    );
}

function Announcements({ items }: { items: Announcement[] }) {
    const [dismissed, setDismissed] = useState<number[]>([]);
    const [expanded, setExpanded] = useState(false);

    // Yang paling genting selalu di atas.
    const visible = useMemo(
        () =>
            items
                .filter((item) => !dismissed.includes(item.id))
                .sort((a, b) => levelOf(b.level).rank - levelOf(a.level).rank),
        [items, dismissed],
    );

    if (visible.length === 0) {
        return null;
    }

    const shown = expanded ? visible : visible.slice(0, 1);
    const hiddenCount = visible.length - shown.length;

    return (
        <div className="pointer-events-auto space-y-2">
            {shown.map((item) => {
                const level = levelOf(item.level);
                const Icon = level.icon;

                return (
                    <div
                        key={item.id}
                        role="alert"
                        className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-sm ${level.className}`}
                    >
                        <Icon className="mt-0.5 size-5 shrink-0" />

                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                                {level.label}: {item.title}
                            </p>
                            <p
                                className={`mt-0.5 opacity-95 ${expanded ? '' : 'line-clamp-2'}`}
                            >
                                {item.body}
                            </p>
                        </div>

                        {/* Peringatan level Awas tidak bisa ditutup. */}
                        {item.level !== 'awas' && (
                            <button
                                type="button"
                                aria-label={`Tutup pengumuman ${item.title}`}
                                onClick={() =>
                                    setDismissed((current) => [...current, item.id])
                                }
                                className="rounded-md p-1 opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-current"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                );
            })}

            {(hiddenCount > 0 || expanded) && visible.length > 1 && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur transition hover:bg-accent"
                >
                    <ChevronDown
                        className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                    {expanded
                        ? 'Ringkas pengumuman'
                        : `${hiddenCount} pengumuman lain`}
                </button>
            )}
        </div>
    );
}

function StatusLine({
    count,
    online,
    refreshing,
    updatedAt,
    onRefresh,
}: {
    count: number;
    online: boolean;
    refreshing: boolean;
    updatedAt: Date;
    onRefresh: () => void;
}) {
    return (
        <div className="pointer-events-auto flex w-fit max-w-full items-center gap-3 rounded-full border bg-background/90 py-1 pr-1 pl-3 text-xs shadow-sm backdrop-blur">
            {online ? (
                <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
            ) : (
                <WifiOff className="size-3.5 shrink-0 text-amber-600" />
            )}

            <span className="truncate">
                <strong className="font-semibold">{count}</strong> kejadian aktif
                <span className="text-muted-foreground">
                    {online
                        ? ` · diperbarui ${formatClock(updatedAt)}`
                        : ` · offline, data terakhir ${formatClock(updatedAt)}`}
                </span>
            </span>

            <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing || !online}
                aria-label="Muat ulang data"
                className="flex size-7 shrink-0 items-center justify-center rounded-full transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
            >
                <RefreshCw
                    className={`size-3.5 ${refreshing ? 'motion-safe:animate-spin' : ''}`}
                />
            </button>
        </div>
    );
}

function Chip({
    active,
    onClick,
    swatch,
    count,
    children,
}: {
    active: boolean;
    onClick: () => void;
    swatch?: string;
    count?: number;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={[
                'pointer-events-auto flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm shadow-sm backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                active
                    ? 'border-foreground/20 bg-background/95'
                    : 'border-transparent bg-background/60 text-muted-foreground',
            ].join(' ')}
        >
            {swatch && (
                <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: swatch, opacity: active ? 1 : 0.4 }}
                />
            )}

            {children}

            {count !== undefined && (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {count}
                </span>
            )}
        </button>
    );
}

function ContactsMenu({ contacts }: { contacts: Contact[] }) {
    const [open, setOpen] = useState(false);
    const wrapper = useRef<HTMLDivElement>(null);

    // Tutup saat menekan Escape atau mengklik di luar menu.
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        const onPointer = (event: PointerEvent) => {
            if (!wrapper.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);

        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [open]);

    return (
        <div ref={wrapper} className="flex flex-col items-end gap-2">
            {open && (
                <section
                    aria-label="Nomor darurat"
                    className="w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"
                >
                    <h2 className="mb-2 text-sm font-semibold">Nomor darurat</h2>

                    {contacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Belum ada nomor yang didaftarkan.
                        </p>
                    ) : (
                        <ul className="max-h-72 space-y-1 overflow-y-auto">
                            {contacts.map((contact) => (
                                <li key={contact.id}>
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">
                                                {contact.name}
                                            </span>

                                            {contact.role && (
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {contact.role}
                                                </span>
                                            )}
                                        </span>

                                        <span className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
                                            <Phone className="size-3.5 text-primary" />
                                            {contact.phone}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <Phone className="size-4" />
                Nomor darurat
            </button>
        </div>
    );
}

function MapPlaceholder({
    text,
    loading = false,
}: {
    text: string;
    loading?: boolean;
}) {
    return (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            {loading && <LoaderCircle className="size-4 motion-safe:animate-spin" />}
            {text}
        </div>
    );
}