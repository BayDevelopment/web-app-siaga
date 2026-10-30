import { Head, Link, useForm } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    Loader2,
    Map as MapIcon,
    MapPin,
    Plus,
    Save,
    Users,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { toast } from 'sonner';

import type { Center, PolygonGeo } from '@/components/map/boundary-editor';

const BoundaryEditor = lazy(() => import('@/components/map/boundary-editor'));

/* ---------- Tipe ---------- */

type AreaType = 'kelurahan' | 'rw' | 'rt';

type AreaData = {
    id: number;
    name: string;
    type: AreaType;
    slug: string | null;
    parent_id: number | null;
    is_active: boolean;
    center_lat: number | null;
    center_lng: number | null;
    boundary_geojson: PolygonGeo | null;
};

type Parent = {
    id: number;
    type: 'kelurahan' | 'rw';
    name: string;
    parent_name?: string | null;
    label?: string;
};

type FormData = {
    name: string;
    type: AreaType;
    parent_id: number | null;
    is_active: boolean;
    center_lat: number | null;
    center_lng: number | null;
    boundary_geojson: PolygonGeo | null;
};

/* ---------- Konstanta ---------- */

const FOCUS_RING =
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

const FIELD_CLASS =
    'h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground transition outline-none placeholder:text-muted-foreground/60 hover:border-muted-foreground/40 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 dark:focus:ring-navy-400/30';

const typeInfo: Record<
    AreaType,
    {
        label: string;
        description: string;
        icon: LucideIcon;
    }
> = {
    kelurahan: {
        label: 'Kelurahan',
        description: 'Wilayah administratif tingkat kelurahan sebagai induk RW.',
        icon: Building2,
    },
    rw: {
        label: 'RW',
        description: 'Rukun Warga yang berada di dalam satu kelurahan.',
        icon: Users,
    },
    rt: {
        label: 'RT',
        description: 'Rukun Tetangga yang berada di dalam satu RW.',
        icon: MapPin,
    },
};

const STEPS: { key: AreaType; label: string }[] = [
    { key: 'kelurahan', label: 'Kelurahan' },
    { key: 'rw', label: 'RW' },
    { key: 'rt', label: 'RT' },
];

/* ---------- Komponen kecil (di luar halaman agar tidak di-remount) ---------- */

function MapSkeleton() {
    return (
        <div className="h-full min-h-[560px] w-full overflow-hidden bg-muted/40">
            <div className="relative h-full w-full">
                <div className="skeleton absolute inset-0 rounded-none" />

                <div className="absolute top-4 left-4 space-y-2">
                    <div className="size-10 rounded-lg bg-background/70" />
                    <div className="size-10 rounded-lg bg-background/70" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
                        <Loader2 className="size-4 animate-spin text-navy-500" />

                        <span className="text-sm font-medium text-foreground">
                            Memuat peta...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PanelHeader({
    icon: Icon,
    title,
    description,
    iconClass,
    children,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    iconClass: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="border-b border-border px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />

                    <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                    >
                        <Icon className="size-5" />
                    </span>

                    <div>
                        <h2 className="font-semibold text-foreground">
                            {title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

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

/* ---------- Halaman ---------- */

export default function AreasForm({
    area,
    parents,
}: {
    area: AreaData | null;
    parents: Parent[];
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    /*
     * Membaca query:
     *
     * ?type=rw
     * ?type=rt&parent_id=12
     */
    const queryParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;

    const queryType = queryParams?.get('type');

    const queryParentId = queryParams?.get('parent_id');

    const parsedParentId = queryParentId ? Number(queryParentId) : null;

    const initialParentId =
        parsedParentId !== null && Number.isFinite(parsedParentId)
            ? parsedParentId
            : null;

    /*
     * Tentukan jenis wilayah.
     *
     * Prioritas:
     * 1. Data existing ketika edit
     * 2. Query ?type=
     * 3. Default RW
     */
    const initialType: AreaType =
        area?.type ??
        (queryType === 'kelurahan' || queryType === 'rw' || queryType === 'rt'
            ? queryType
            : 'rw');

    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        name: area?.name ?? '',

        type: initialType,

        /*
         * Kalau datang dari tombol:
         * Tambah RW / Tambah RT,
         * parent langsung terisi.
         */
        parent_id: area?.parent_id ?? initialParentId,

        is_active: area?.is_active ?? true,

        center_lat: area?.center_lat ?? null,

        center_lng: area?.center_lng ?? null,

        boundary_geojson: area?.boundary_geojson ?? null,
    });

    /*
     * Parent yang dibutuhkan:
     *
     * RW -> Kelurahan
     * RT -> RW
     */
    const parentType: 'kelurahan' | 'rw' | null =
        data.type === 'rw' ? 'kelurahan' : data.type === 'rt' ? 'rw' : null;

    const parentOptions = useMemo(() => {
        if (!parentType) {
            return [];
        }

        return parents.filter((parent) => parent.type === parentType);
    }, [parents, parentType]);

    const parentLabel =
        data.type === 'rw'
            ? 'Kelurahan Induk'
            : data.type === 'rt'
              ? 'RW Induk'
              : '';

    const parentPlaceholder =
        data.type === 'rw'
            ? 'Pilih kelurahan'
            : data.type === 'rt'
              ? 'Pilih RW'
              : 'Pilih...';

    const parentEmptyMessage =
        data.type === 'rw'
            ? 'Belum ada kelurahan. Tambahkan kelurahan terlebih dahulu.'
            : data.type === 'rt'
              ? 'Belum ada RW. Tambahkan RW terlebih dahulu.'
              : '';

    const getParentLabel = (parent: Parent) => parent.label ?? parent.name;

    /*
     * Saat polygon berubah,
     * simpan GeoJSON + center ke form.
     */
    const onBoundary = (geo: PolygonGeo | null, center: Center | null) => {
        setData((current) => ({
            ...current,

            boundary_geojson: geo,

            center_lat: center?.lat ?? null,

            center_lng: center?.lng ?? null,
        }));
    };

    /*
     * Submit create / update.
     */
    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!data.name.trim()) {
            toast.error('Nama wilayah wajib diisi.');

            return;
        }

        if (data.type !== 'kelurahan' && !data.parent_id) {
            toast.error(
                data.type === 'rw'
                    ? 'Silakan pilih kelurahan induk.'
                    : 'Silakan pilih RW induk.',
            );

            return;
        }

        if (area) {
            put(`/admin/areas/${area.id}`, {
                onSuccess: () => {
                    toast.success('Wilayah berhasil diperbarui.');
                },

                onError: () => {
                    toast.error(
                        'Wilayah gagal diperbarui. Periksa kembali data yang diisi.',
                    );
                },
            });

            return;
        }

        post('/admin/areas', {
            onSuccess: () => {
                toast.success('Wilayah berhasil ditambahkan.');
            },

            onError: () => {
                toast.error(
                    'Wilayah gagal ditambahkan. Periksa kembali data yang diisi.',
                );
            },
        });
    };

    const boundaryError = Object.entries(errors).find(([key]) =>
        key.startsWith('boundary_geojson'),
    )?.[1];

    const hasParentOptions = parentOptions.length > 0;

    const parentRequired = data.type !== 'kelurahan';

    const submitDisabled =
        processing || (parentRequired && (!hasParentOptions || !data.parent_id));

    const TypeIcon = typeInfo[data.type].icon;

    const pageTitle = area
        ? `Ubah ${area.name}`
        : `Tambah ${typeInfo[data.type].label}`;

    return (
        <>
            <Head title={pageTitle} />

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

                <form
                    onSubmit={submit}
                    className="relative mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-8"
                >
                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-7">
                        <div className="blob -top-16 -right-10 size-64 animate-blob bg-sea-400/20 dark:bg-sea-500/10" />
                        <div className="blob -bottom-20 left-1/3 size-56 animate-blob-slow bg-sun-400/15 dark:bg-sun-500/10" />
                        <div className="blob top-1/2 right-1/4 size-40 animate-blob bg-forest-400/10 dark:bg-forest-500/10" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <Link
                                    href="/admin/areas"
                                    aria-label="Kembali ke daftar wilayah"
                                    className={`group flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-navy-200 hover:bg-navy-50 hover:shadow-md dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10 ${FOCUS_RING}`}
                                >
                                    <ArrowLeft className="size-6 text-navy-600 transition-transform group-hover:-translate-x-0.5 dark:text-navy-400" />
                                </Link>

                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-navy-600 uppercase dark:text-navy-400">
                                        Master Wilayah
                                    </p>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                        {pageTitle}
                                    </h1>
                                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                        Kelola informasi wilayah dan tentukan
                                        batas geografisnya.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                                    Administrator
                                </span>

                                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3.5 py-2 text-xs font-semibold text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
                                    <TypeIcon className="size-3.5" />
                                    {typeInfo[data.type].label}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        STRUKTUR WILAYAH
                    ====================================================== */}
                    <section className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm [animation-delay:80ms] sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Struktur Wilayah
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Kelurahan → RW → RT
                                    </p>
                                </div>
                            </div>

                            <ol
                                className="flex flex-wrap items-center gap-2 text-xs"
                                aria-label="Posisi pada struktur wilayah"
                            >
                                {STEPS.map((step, index) => {
                                    const active = data.type === step.key;

                                    return (
                                        <li
                                            key={step.key}
                                            className="flex items-center gap-2"
                                        >
                                            {index > 0 && (
                                                <span
                                                    aria-hidden
                                                    className="text-muted-foreground"
                                                >
                                                    →
                                                </span>
                                            )}

                                            <span
                                                aria-current={
                                                    active ? 'step' : undefined
                                                }
                                                className={`rounded-full px-4 py-2 font-semibold transition ${
                                                    active
                                                        ? 'bg-linear-to-r from-navy-600 to-navy-500 text-white shadow-md shadow-navy-600/25'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {step.label}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </section>

                    {/* =====================================================
                        KONTEN UTAMA
                    ====================================================== */}
                    <div className="grid items-stretch gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                        {/* INFORMASI WILAYAH */}
                        <section className="flex h-full animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:140ms]">
                            <PanelHeader
                                icon={TypeIcon}
                                title="Informasi Wilayah"
                                description="Data dasar wilayah"
                                iconClass="bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400"
                            />

                            <div className="flex flex-1 flex-col space-y-5 p-5 sm:p-6">
                                {/* NAMA */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="name"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Nama wilayah
                                        <span className="ml-1 text-red-600 dark:text-red-400">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        placeholder={
                                            data.type === 'kelurahan'
                                                ? 'Contoh: Warnasari'
                                                : data.type === 'rw'
                                                  ? 'Contoh: RW 07'
                                                  : 'Contoh: RT 01'
                                        }
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        className={FIELD_CLASS}
                                    />

                                    <FieldError message={errors.name} />
                                </div>

                                {/* JENIS */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="type"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Jenis wilayah
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(event) => {
                                                const type = event.target
                                                    .value as AreaType;

                                                setData((current) => ({
                                                    ...current,
                                                    type,
                                                    parent_id: null,
                                                }));
                                            }}
                                            className={`${FIELD_CLASS} appearance-none pr-10`}
                                        >
                                            <option value="kelurahan">
                                                Kelurahan
                                            </option>
                                            <option value="rw">RW</option>
                                            <option value="rt">RT</option>
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>

                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {typeInfo[data.type].description}
                                    </p>

                                    <FieldError message={errors.type} />
                                </div>

                                {/* PARENT */}
                                {parentType && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <label
                                                htmlFor="parent"
                                                className="text-sm font-semibold text-foreground"
                                            >
                                                {parentLabel}
                                                <span className="ml-1 text-red-600 dark:text-red-400">
                                                    *
                                                </span>
                                            </label>

                                            {hasParentOptions && (
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    {parentOptions.length}{' '}
                                                    tersedia
                                                </span>
                                            )}
                                        </div>

                                        {hasParentOptions ? (
                                            <div className="relative">
                                                <select
                                                    id="parent"
                                                    value={data.parent_id ?? ''}
                                                    onChange={(event) =>
                                                        setData(
                                                            'parent_id',
                                                            event.target.value
                                                                ? Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  )
                                                                : null,
                                                        )
                                                    }
                                                    className={`${FIELD_CLASS} appearance-none pr-10`}
                                                >
                                                    <option value="">
                                                        {parentPlaceholder}
                                                    </option>

                                                    {parentOptions.map(
                                                        (parent) => (
                                                            <option
                                                                key={parent.id}
                                                                value={
                                                                    parent.id
                                                                }
                                                            >
                                                                {getParentLabel(
                                                                    parent,
                                                                )}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-sun-300/60 bg-sun-50 p-4 dark:border-sun-500/30 dark:bg-sun-500/10">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sun-100 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300">
                                                        <MapPin className="size-4" />
                                                    </span>

                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            Belum ada{' '}
                                                            {data.type === 'rw'
                                                                ? 'kelurahan'
                                                                : 'RW'}
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                            {parentEmptyMessage}
                                                        </p>

                                                        {data.type === 'rw' && (
                                                            <Link
                                                                href="/admin/areas/create?type=kelurahan"
                                                                className={`mt-3 inline-flex items-center gap-2 rounded-lg bg-sun-500 px-3 py-2 text-xs font-semibold text-navy-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-sun-400 dark:bg-sun-400 dark:hover:bg-sun-300 ${FOCUS_RING}`}
                                                            >
                                                                <Plus className="size-3.5" />
                                                                Tambah Kelurahan
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {hasParentOptions &&
                                            !data.parent_id &&
                                            !errors.parent_id && (
                                                <p className="text-xs text-muted-foreground">
                                                    {data.type === 'rw'
                                                        ? 'Pilih kelurahan tempat RW ini berada.'
                                                        : 'Pilih RW tempat RT ini berada.'}
                                                </p>
                                            )}

                                        <FieldError message={errors.parent_id} />
                                    </div>
                                )}

                                {/* INFO KELURAHAN */}
                                {data.type === 'kelurahan' && (
                                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-600 dark:bg-navy-500/15 dark:text-navy-400">
                                                <Building2 className="size-4" />
                                            </span>

                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    Wilayah tingkat atas
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Kelurahan tidak memiliki
                                                    wilayah induk dan menjadi
                                                    parent untuk RW.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STATUS */}
                                <div className="mt-auto pt-2">
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 transition hover:border-navy-200 hover:bg-navy-50/60 dark:hover:border-navy-500/40 dark:hover:bg-navy-500/10">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(event) =>
                                                setData(
                                                    'is_active',
                                                    event.target.checked,
                                                )
                                            }
                                            className="mt-0.5 size-4 rounded border-input text-primary accent-navy-600 focus:ring-primary"
                                        />

                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                Wilayah aktif
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                Tampilkan wilayah ini pada
                                                sistem dan peta publik.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* BATAS WILAYAH */}
                        <section className="flex min-w-0 animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm [animation-delay:200ms]">
                            <PanelHeader
                                icon={MapIcon}
                                title="Batas Wilayah"
                                description="Gambarkan area cakupan wilayah pada peta"
                                iconClass="bg-forest-100 text-forest-600 dark:bg-forest-500/15 dark:text-forest-400"
                            >
                                <span
                                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                        data.boundary_geojson
                                            ? 'bg-forest-100 text-forest-800 dark:bg-forest-500/15 dark:text-forest-400'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {data.boundary_geojson ? (
                                        <>
                                            <Check className="size-3.5" />
                                            Batas sudah dibuat
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="size-3.5" />
                                            Belum dibuat
                                        </>
                                    )}
                                </span>
                            </PanelHeader>

                            <div className="flex-1 p-4 sm:p-5">
                                <div className="h-[600px] w-full overflow-hidden rounded-2xl border border-border bg-muted sm:h-[640px]">
                                    {mounted ? (
                                        <Suspense fallback={<MapSkeleton />}>
                                            <div className="h-full w-full">
                                                <BoundaryEditor
                                                    value={
                                                        data.boundary_geojson
                                                    }
                                                    onChange={onBoundary}
                                                />
                                            </div>
                                        </Suspense>
                                    ) : (
                                        <MapSkeleton />
                                    )}
                                </div>

                                {boundaryError && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                            {boundaryError}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* =====================================================
                        ACTION BAR
                    ====================================================== */}
                    <section className="animate-fade-in-up rounded-2xl border border-border bg-card shadow-sm [animation-delay:260ms]">
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {area
                                            ? 'Perbarui data wilayah'
                                            : 'Simpan wilayah baru'}
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Pastikan informasi wilayah dan batas
                                        geografis sudah sesuai.
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                                <Link
                                    href="/admin/areas"
                                    className={`inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-muted ${FOCUS_RING}`}
                                >
                                    Batal
                                </Link>

                                <button
                                    type="submit"
                                    disabled={submitDisabled}
                                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-navy-600 to-navy-500 px-6 text-sm font-semibold text-white shadow-lg shadow-navy-600/25 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            {area
                                                ? 'Simpan Perubahan'
                                                : 'Simpan Wilayah'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </>
    );
}