import { Head, Link, router, usePage } from '@inertiajs/react';

import {
    ChevronDown,
    ClipboardList,
    LoaderCircle,
    MapPin,
    Phone,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Siren,
    TriangleAlert,
    WifiOff,
    X,
    Info,
    type LucideIcon,
} from 'lucide-react';

import Swal from 'sweetalert2';

import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import type {
    MapBoundary,
    MapFacility,
    MapReport,
    MapType,
    MapZone,
} from '@/components/map/disaster-map';

// Leaflet membutuhkan window, jadi dimuat setelah browser melakukan mount.
const DisasterMap = lazy(() => import('@/components/map/disaster-map'));

/* ============================================================
   TIPE
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

/**
 * Data wilayah yang dikirim oleh MapController.
 *
 * Contoh:
 * RW 07 — Warnasari
 */
type Area = {
    id: number;
    name: string;
    type: 'kelurahan' | 'rw' | 'rt' | string;
    slug: string;
    parent_name: string | null;
    label: string;
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

    /**
     * Daftar wilayah dari MapController.
     */
    areas?: Area[];
};

type SharedProps = {
    auth?: {
        user?: unknown | null;
    };
};

/* ============================================================
   KONFIGURASI
============================================================ */

const REFRESH_MS = 60_000;

const LEVELS: Record<
    Level,
    {
        label: string;
        rank: number;
        className: string;
        icon: LucideIcon;
    }
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

/**
 * Nama tipe wilayah agar lebih mudah dibaca pengguna.
 */
function areaTypeLabel(type: string): string {
    switch (type) {
        case 'kelurahan':
            return 'Kelurahan';

        case 'rw':
            return 'RW';

        case 'rt':
            return 'RT';

        default:
            return type;
    }
}

/* ============================================================
   HALAMAN
============================================================ */

export default function Home({
    canRegister = false,
    regionName = 'Semua Wilayah',
    center,
    zoom = 15,
    boundary = null,
    reports = [],
    types = [],
    zones = [],
    facilities = [],
    contacts = [],
    announcements = [],
    areas = [],
}: Props) {
    const { auth } = usePage<SharedProps>().props;

    const isLoggedIn = Boolean(auth?.user);

    const [mounted, setMounted] = useState(false);

    const [activeTypeIds, setActiveTypeIds] = useState<number[]>(() =>
        types.map((type) => type.id),
    );

    const [showZones, setShowZones] = useState(true);

    const [showFacilities, setShowFacilities] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    /* ========================================================
       REFRESH DATA
    ======================================================== */

    const [refreshing, setRefreshing] = useState(false);

    const [updatedAt, setUpdatedAt] = useState(() => new Date());

    const lastRefresh = useRef(Date.now());

    const refresh = useCallback(() => {
        router.reload({
            only: ['reports', 'announcements'],

            onStart: () => {
                setRefreshing(true);
            },

            onSuccess: () => {
                lastRefresh.current = Date.now();
                setUpdatedAt(new Date());
            },

            onFinish: () => {
                setRefreshing(false);
            },
        });
    }, []);

    useEffect(() => {
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

    /* ========================================================
       STATUS ONLINE / OFFLINE
    ======================================================== */

    const [online, setOnline] = useState(true);

    useEffect(() => {
        const sync = () => {
            setOnline(navigator.onLine);
        };

        sync();

        window.addEventListener('online', sync);
        window.addEventListener('offline', sync);

        return () => {
            window.removeEventListener('online', sync);
            window.removeEventListener('offline', sync);
        };
    }, []);

    /* ========================================================
       FILTER BENCANA
    ======================================================== */

    const countByType = useMemo(() => {
        const counts = new Map<number, number>();

        for (const report of reports) {
            counts.set(
                report.type_id,
                (counts.get(report.type_id) ?? 0) + 1,
            );
        }

        return counts;
    }, [reports]);

    const visibleCount = useMemo(
        () =>
            reports.filter((report) =>
                activeTypeIds.includes(report.type_id),
            ).length,
        [reports, activeTypeIds],
    );

    function toggleType(id: number) {
        setActiveTypeIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    }

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <>
            <Head title={`Peta kejadian ${regionName}`} />

            <div className="relative h-svh w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                {/* =================================================
                    PETA
                ================================================= */}

                <div className="absolute inset-0">
                    {mounted && center ? (
                        <Suspense
                            fallback={
                                <MapPlaceholder
                                    text="Memuat peta"
                                    loading
                                />
                            }
                        >
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

                {/* =================================================
                    LAPISAN UI
                ================================================= */}

                <div className="pointer-events-none absolute inset-0 z-[1100] flex flex-col">
                    <header className="flex flex-col gap-2 p-3 sm:p-4">
                        <TopBar
                            regionName={regionName}
                            isLoggedIn={isLoggedIn}
                            canRegister={canRegister}
                            areas={areas}
                        />

                        <Announcements items={announcements} />

                        <StatusLine
                            count={visibleCount}
                            online={online}
                            refreshing={refreshing}
                            updatedAt={updatedAt}
                            onRefresh={refresh}
                        />

                        {/* =================================================
                            FILTER PETA
                        ================================================= */}

                        <div
                            role="group"
                            aria-label="Filter peta"
                            className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0"
                        >
                            {types.map((type) => (
                                <Chip
                                    key={type.id}
                                    active={activeTypeIds.includes(type.id)}
                                    onClick={() =>
                                        toggleType(type.id)
                                    }
                                    swatch={type.color}
                                    count={
                                        countByType.get(type.id) ?? 0
                                    }
                                >
                                    {type.name}
                                </Chip>
                            ))}

                            <Chip
                                active={showZones}
                                onClick={() =>
                                    setShowZones((value) => !value)
                                }
                            >
                                Zona rawan
                            </Chip>

                            <Chip
                                active={showFacilities}
                                onClick={() =>
                                    setShowFacilities((value) => !value)
                                }
                            >
                                Titik kumpul dan posko
                            </Chip>
                        </div>
                    </header>

                    {/* =================================================
                        EMPTY STATE
                    ================================================= */}

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

                {/* =================================================
                    AKSI UTAMA
                ================================================= */}

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
   TOP BAR + SEARCH WILAYAH
============================================================ */

function TopBar({
    regionName,
    isLoggedIn,
    canRegister,
    areas,
}: {
    regionName: string;
    isLoggedIn: boolean;
    canRegister: boolean;
    areas: Area[];
}) {
    const linkClass =
        'rounded-md px-3 py-1.5 text-sm transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary';

    const [query, setQuery] = useState('');

    const [open, setOpen] = useState(false);

    const searchWrapper = useRef<HTMLDivElement>(null);

    /**
     * Hasil pencarian wilayah.
     *
     * Mencocokkan:
     * - name
     * - label
     * - parent_name
     * - type
     * - slug
     */
    const filteredAreas = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        if (!keyword) {
            return areas.slice(0, 8);
        }

        return areas
            .filter((area) => {
                const searchableText = [
                    area.name,
                    area.label,
                    area.parent_name ?? '',
                    area.type,
                    area.slug,
                ]
                    .join(' ')
                    .toLowerCase();

                return searchableText.includes(keyword);
            })
            .slice(0, 8);
    }, [areas, query]);

    /**
     * Klik wilayah.
     */
    function selectArea(area: Area) {
        setQuery('');

        setOpen(false);

        router.get(`/wilayah/${encodeURIComponent(area.slug)}`);
    }

    /**
     * Submit pencarian.
     */
    function handleSearchSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const keyword = query.trim();

        if (!keyword) {
            Swal.fire({
                icon: 'info',
                title: 'Cari Wilayah',
                text: 'Silakan masukkan nama wilayah yang ingin dicari.',
                confirmButtonText: 'Mengerti',
            });

            return;
        }

        if (filteredAreas.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Wilayah Tidak Ditemukan',
                text: `Wilayah "${keyword}" tidak tersedia dalam sistem SIAGA-W.`,
                confirmButtonText: 'OK',
            });

            return;
        }

        /**
         * Jika hasil hanya satu,
         * langsung buka wilayah tersebut.
         */
        if (filteredAreas.length === 1) {
            selectArea(filteredAreas[0]);
            return;
        }

        /**
         * Jika lebih dari satu hasil,
         * dropdown tetap dibuka agar pengguna memilih.
         */
        setOpen(true);
    }

    /**
     * Tutup dropdown dengan Escape dan klik di luar.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        const onPointerDown = (event: PointerEvent) => {
            if (
                !searchWrapper.current?.contains(
                    event.target as Node,
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener(
                'pointerdown',
                onPointerDown,
            );
        };
    }, [open]);

    return (
        <div className="pointer-events-auto flex flex-col gap-3 rounded-xl border bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
            {/* =====================================================
                BARIS UTAMA
            ===================================================== */}

            <div className="flex items-center justify-between gap-3">
                {/* LOGO / IDENTITAS */}
                <div className="flex min-w-0 shrink-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Siren className="size-5" />
                    </span>

                    <div className="min-w-0">
                        <h1 className="text-base font-semibold leading-tight">
                            SIAGA-W
                        </h1>

                        <p className="max-w-[180px] truncate text-xs text-muted-foreground sm:max-w-[260px]">
                            {regionName}
                        </p>
                    </div>
                </div>

                {/* NAVIGASI */}
                <nav
                    aria-label="Navigasi utama"
                    className="flex shrink-0 items-center gap-1"
                >
                    <Link
                        href="/laporan"
                        className={`${linkClass} inline-flex items-center gap-1.5`}
                    >
                        <ClipboardList className="size-4" />

                        <span className="hidden sm:inline">
                            Laporan
                        </span>
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
                            <Link
                                href="/login"
                                className={linkClass}
                            >
                                Masuk
                            </Link>

                            {canRegister && (
                                <Link
                                    href="/register"
                                    className={`${linkClass} hidden border sm:inline-flex`}
                                >
                                    Daftar
                                </Link>
                            )}
                        </>
                    )}
                </nav>
            </div>

            {/* =====================================================
                SEARCH WILAYAH
            ===================================================== */}

            <div
                ref={searchWrapper}
                className="relative w-full"
            >
                <form
                    onSubmit={handleSearchSubmit}
                    role="search"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                            type="search"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                            placeholder="Cari wilayah, RW, RT, atau kelurahan..."
                            aria-label="Cari wilayah"
                            aria-expanded={open}
                            aria-autocomplete="list"
                            className="h-10 w-full rounded-lg border bg-background pl-9 pr-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />

                        {query && (
                            <button
                                type="button"
                                aria-label="Hapus pencarian"
                                onClick={() => {
                                    setQuery('');
                                    setOpen(false);
                                }}
                                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </form>

                {/* =================================================
                    HASIL PENCARIAN
                ================================================= */}

                {open && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[1200] overflow-hidden rounded-xl border bg-background/95 shadow-xl backdrop-blur">
                        {query.trim() && filteredAreas.length === 0 ? (
                            <div className="px-4 py-5 text-center">
                                <MapPin className="mx-auto mb-2 size-6 text-muted-foreground" />

                                <p className="text-sm font-medium">
                                    Wilayah tidak ditemukan
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Coba gunakan nama RW, RT, atau
                                    kelurahan yang berbeda.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        Swal.fire({
                                            icon: 'warning',
                                            title: 'Wilayah Tidak Ditemukan',
                                            text: `Wilayah "${query.trim()}" tidak tersedia dalam sistem SIAGA-W.`,
                                            confirmButtonText: 'OK',
                                        });
                                    }}
                                    className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                                >
                                    Lihat pemberitahuan
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="border-b px-4 py-2.5">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {query.trim()
                                            ? `${filteredAreas.length} wilayah ditemukan`
                                            : 'Pilih wilayah'}
                                    </p>
                                </div>

                                <div className="max-h-72 overflow-y-auto p-1.5">
                                    {filteredAreas.map((area) => (
                                        <button
                                            key={area.id}
                                            type="button"
                                            onClick={() =>
                                                selectArea(area)
                                            }
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                                        >
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <MapPin className="size-4" />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">
                                                    {area.label ||
                                                        area.name}
                                                </span>

                                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                                    {areaTypeLabel(
                                                        area.type,
                                                    )}

                                                    {area.parent_name
                                                        ? ` • ${area.parent_name}`
                                                        : ''}
                                                </span>
                                            </span>

                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                Lihat
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   PENGUMUMAN
============================================================ */

function Announcements({
    items,
}: {
    items: Announcement[];
}) {
    const [dismissed, setDismissed] = useState<number[]>([]);

    const [expanded, setExpanded] = useState(false);

    const visible = useMemo(
        () =>
            items
                .filter((item) => !dismissed.includes(item.id))
                .sort(
                    (a, b) =>
                        levelOf(b.level).rank -
                        levelOf(a.level).rank,
                ),
        [items, dismissed],
    );

    if (visible.length === 0) {
        return null;
    }

    const shown = expanded
        ? visible
        : visible.slice(0, 1);

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
                                className={`mt-0.5 opacity-95 ${
                                    expanded
                                        ? ''
                                        : 'line-clamp-2'
                                }`}
                            >
                                {item.body}
                            </p>
                        </div>

                        {/* Pengumuman Awas tidak dapat ditutup */}
                        {item.level !== 'awas' && (
                            <button
                                type="button"
                                aria-label={`Tutup pengumuman ${item.title}`}
                                onClick={() =>
                                    setDismissed((current) => [
                                        ...current,
                                        item.id,
                                    ])
                                }
                                className="rounded-md p-1 opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-current"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                );
            })}

            {(hiddenCount > 0 || expanded) &&
                visible.length > 1 && (
                    <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() =>
                            setExpanded((value) => !value)
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur transition hover:bg-accent"
                    >
                        <ChevronDown
                            className={`size-3.5 transition-transform ${
                                expanded ? 'rotate-180' : ''
                            }`}
                        />

                        {expanded
                            ? 'Ringkas pengumuman'
                            : `${hiddenCount} pengumuman lain`}
                    </button>
                )}
        </div>
    );
}

/* ============================================================
   STATUS LINE
============================================================ */

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
                <strong className="font-semibold">
                    {count}
                </strong>{' '}
                kejadian aktif

                <span className="text-muted-foreground">
                    {online
                        ? ` · diperbarui ${formatClock(
                              updatedAt,
                          )}`
                        : ` · offline, data terakhir ${formatClock(
                              updatedAt,
                          )}`}
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
                    className={`size-3.5 ${
                        refreshing
                            ? 'motion-safe:animate-spin'
                            : ''
                    }`}
                />
            </button>
        </div>
    );
}

/* ============================================================
   CHIP FILTER
============================================================ */

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
    children: ReactNode;
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
                    style={{
                        backgroundColor: swatch,
                        opacity: active ? 1 : 0.4,
                    }}
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

/* ============================================================
   KONTAK DARURAT
============================================================ */

function ContactsMenu({
    contacts,
}: {
    contacts: Contact[];
}) {
    const [open, setOpen] = useState(false);

    const wrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        const onPointer = (event: PointerEvent) => {
            if (
                !wrapper.current?.contains(
                    event.target as Node,
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener(
            'pointerdown',
            onPointer,
        );

        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener(
                'pointerdown',
                onPointer,
            );
        };
    }, [open]);

    return (
        <div
            ref={wrapper}
            className="flex flex-col items-end gap-2"
        >
            {open && (
                <section
                    aria-label="Nomor darurat"
                    className="w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"
                >
                    <h2 className="mb-2 text-sm font-semibold">
                        Nomor darurat
                    </h2>

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
                onClick={() =>
                    setOpen((value) => !value)
                }
                className="inline-flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <Phone className="size-4" />

                Nomor darurat
            </button>
        </div>
    );
}

/* ============================================================
   MAP PLACEHOLDER
============================================================ */

function MapPlaceholder({
    text,
    loading = false,
}: {
    text: string;
    loading?: boolean;
}) {
    return (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            {loading && (
                <LoaderCircle className="size-4 motion-safe:animate-spin" />
            )}

            {text}
        </div>
    );
}