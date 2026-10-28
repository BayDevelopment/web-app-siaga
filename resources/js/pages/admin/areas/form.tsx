import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    Loader2,
    Map,
    MapPin,
    Save,
    Users,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { toast } from 'sonner';

import type {
    Center,
    PolygonGeo,
} from '@/components/map/boundary-editor';

const BoundaryEditor = lazy(
    () => import('@/components/map/boundary-editor'),
);

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

const typeInfo: Record<
    AreaType,
    {
        label: string;
        description: string;
        icon: typeof Building2;
    }
> = {
    kelurahan: {
        label: 'Kelurahan',
        description:
            'Wilayah administratif tingkat kelurahan sebagai induk RW.',
        icon: Building2,
    },

    rw: {
        label: 'RW',
        description:
            'Rukun Warga yang berada di dalam satu kelurahan.',
        icon: Users,
    },

    rt: {
        label: 'RT',
        description:
            'Rukun Tetangga yang berada di dalam satu RW.',
        icon: MapPin,
    },
};

function MapSkeleton() {
    return (
        <div className="h-full min-h-[560px] w-full overflow-hidden bg-muted/40">
            <div className="relative h-full w-full animate-pulse">
                <div className="absolute inset-0 bg-muted/50" />

                <div className="absolute left-4 top-4 space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-background/70" />
                    <div className="h-10 w-10 rounded-lg bg-background/70" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />

                        <span className="text-sm font-medium">
                            Memuat peta...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

    const parsedParentId = queryParentId
        ? Number(queryParentId)
        : null;

    const initialParentId =
        parsedParentId !== null &&
        Number.isFinite(parsedParentId)
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
        (queryType === 'kelurahan' ||
        queryType === 'rw' ||
        queryType === 'rt'
            ? queryType
            : 'rw');

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
    } = useForm<FormData>({
        name: area?.name ?? '',

        type: initialType,

        /*
         * Kalau datang dari tombol:
         * Tambah RW / Tambah RT,
         * parent langsung terisi.
         */
        parent_id:
            area?.parent_id ??
            initialParentId,

        is_active: area?.is_active ?? true,

        center_lat: area?.center_lat ?? null,

        center_lng: area?.center_lng ?? null,

        boundary_geojson:
            area?.boundary_geojson ?? null,
    });

    /*
     * Parent yang dibutuhkan:
     *
     * RW -> Kelurahan
     * RT -> RW
     */
    const parentType: 'kelurahan' | 'rw' | null =
        data.type === 'rw'
            ? 'kelurahan'
            : data.type === 'rt'
              ? 'rw'
              : null;

    const parentOptions = useMemo(() => {
        if (!parentType) {
            return [];
        }

        return parents.filter(
            (parent) => parent.type === parentType,
        );
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

    const getParentLabel = (parent: Parent) =>
        parent.label ?? parent.name;

    /*
     * Saat polygon berubah,
     * simpan GeoJSON + center ke form.
     */
    const onBoundary = (
        geo: PolygonGeo | null,
        center: Center | null,
    ) => {
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
            toast.error(
                'Nama wilayah wajib diisi.',
            );

            return;
        }

        if (
            data.type !== 'kelurahan' &&
            !data.parent_id
        ) {
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
                    toast.success(
                        'Wilayah berhasil diperbarui.',
                    );
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
                toast.success(
                    'Wilayah berhasil ditambahkan.',
                );
            },

            onError: () => {
                toast.error(
                    'Wilayah gagal ditambahkan. Periksa kembali data yang diisi.',
                );
            },
        });
    };

    const boundaryError =
        Object.entries(errors).find(
            ([key]) =>
                key.startsWith(
                    'boundary_geojson',
                ),
        )?.[1];

    const hasParentOptions =
        parentOptions.length > 0;

    const parentRequired =
        data.type !== 'kelurahan';

    const submitDisabled =
        processing ||
        (parentRequired &&
            (!hasParentOptions ||
                !data.parent_id));

    const TypeIcon =
        typeInfo[data.type].icon;

    return (
        <>
            <Head
                title={
                    area
                        ? `Ubah ${area.name}`
                        : `Tambah ${typeInfo[data.type].label}`
                }
            />

            <div className="min-h-full bg-muted/20">
                <form
                    onSubmit={submit}
                    className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8"
                >
                    {/* =====================================================
                        HEADER
                    ====================================================== */}
                    <section className="rounded-2xl border bg-background shadow-sm">
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div className="flex items-start gap-3">
                                <Link
                                    href="/admin/areas"
                                    className="group mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm transition-all duration-200 hover:-translate-x-1 hover:bg-accent hover:shadow-md"
                                >
                                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                                </Link>

                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                        {area
                                            ? `Ubah ${area.name}`
                                            : `Tambah ${typeInfo[data.type].label}`}
                                    </h1>

                                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                        Kelola informasi wilayah
                                        dan tentukan batas
                                        geografisnya.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="rounded-full border bg-background px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                                    Administrator
                                </span>

                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary">
                                    <TypeIcon className="h-3.5 w-3.5" />

                                    {typeInfo[data.type].label}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        HIERARCHY
                    ====================================================== */}
                    <section className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                                    Struktur Wilayah
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kelurahan → RW → RT
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <div
                                    className={[
                                        'rounded-full px-4 py-2 font-semibold',
                                        data.type ===
                                        'kelurahan'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted text-muted-foreground',
                                    ].join(' ')}
                                >
                                    Kelurahan
                                </div>

                                <span className="text-muted-foreground">
                                    →
                                </span>

                                <div
                                    className={[
                                        'rounded-full px-4 py-2 font-semibold',
                                        data.type === 'rw'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted text-muted-foreground',
                                    ].join(' ')}
                                >
                                    RW
                                </div>

                                <span className="text-muted-foreground">
                                    →
                                </span>

                                <div
                                    className={[
                                        'rounded-full px-4 py-2 font-semibold',
                                        data.type === 'rt'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted text-muted-foreground',
                                    ].join(' ')}
                                >
                                    RT
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        MAIN CONTENT
                    ====================================================== */}
                    <div className="grid items-stretch gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                        {/* =================================================
                            INFORMASI WILAYAH
                        ================================================== */}
                        <section className="flex h-full flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
                            <div className="border-b bg-gradient-to-r from-primary/[0.04] to-transparent px-5 py-5 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <TypeIcon className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-foreground">
                                            Informasi Wilayah
                                        </h2>

                                        <p className="text-xs text-muted-foreground">
                                            Data dasar wilayah
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col space-y-5 p-5 sm:p-6">
                                {/* NAMA */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="name"
                                        className="text-sm font-semibold"
                                    >
                                        Nama wilayah

                                        <span className="ml-1 text-destructive">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        placeholder={
                                            data.type ===
                                            'kelurahan'
                                                ? 'Contoh: Warnasari'
                                                : data.type ===
                                                    'rw'
                                                  ? 'Contoh: RW 07'
                                                  : 'Contoh: RT 01'
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'name',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border bg-background px-4 text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground/60 hover:border-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    />

                                    {errors.name && (
                                        <p className="text-xs font-medium text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* JENIS */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="type"
                                        className="text-sm font-semibold"
                                    >
                                        Jenis wilayah
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(event) => {
                                                const type =
                                                    event.target
                                                        .value as AreaType;

                                                setData(
                                                    (
                                                        current,
                                                    ) => ({
                                                        ...current,
                                                        type,
                                                        parent_id:
                                                            null,
                                                    }),
                                                );
                                            }}
                                            className="h-11 w-full appearance-none rounded-xl border bg-background px-4 pr-10 text-sm shadow-sm outline-none transition-all hover:border-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        >
                                            <option value="kelurahan">
                                                Kelurahan
                                            </option>

                                            <option value="rw">
                                                RW
                                            </option>

                                            <option value="rt">
                                                RT
                                            </option>
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>

                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {
                                            typeInfo[
                                                data.type
                                            ].description
                                        }
                                    </p>

                                    {errors.type && (
                                        <p className="text-xs font-medium text-destructive">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* PARENT */}
                                {parentType && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <label
                                                htmlFor="parent"
                                                className="text-sm font-semibold"
                                            >
                                                {parentLabel}

                                                <span className="ml-1 text-destructive">
                                                    *
                                                </span>
                                            </label>

                                            {hasParentOptions && (
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    {
                                                        parentOptions.length
                                                    }{' '}
                                                    tersedia
                                                </span>
                                            )}
                                        </div>

                                        {hasParentOptions ? (
                                            <div className="relative">
                                                <select
                                                    id="parent"
                                                    value={
                                                        data.parent_id ??
                                                        ''
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setData(
                                                            'parent_id',
                                                            event
                                                                .target
                                                                .value
                                                                ? Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  )
                                                                : null,
                                                        )
                                                    }
                                                    className="h-11 w-full appearance-none rounded-xl border bg-background px-4 pr-10 text-sm shadow-sm outline-none transition-all hover:border-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                                >
                                                    <option value="">
                                                        {
                                                            parentPlaceholder
                                                        }
                                                    </option>

                                                    {parentOptions.map(
                                                        (
                                                            parent,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    parent.id
                                                                }
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

                                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                        <MapPin className="h-4 w-4" />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                                            Belum
                                                            ada{' '}
                                                            {data.type ===
                                                            'rw'
                                                                ? 'kelurahan'
                                                                : 'RW'}
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-400/80">
                                                            {
                                                                parentEmptyMessage
                                                            }
                                                        </p>

                                                        {data.type ===
                                                            'rw' && (
                                                            <Link
                                                                href="/admin/areas/create?type=kelurahan"
                                                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                                                            >
                                                                <Building2 className="h-3.5 w-3.5" />

                                                                Tambah
                                                                Kelurahan
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
                                                    {data.type ===
                                                    'rw'
                                                        ? 'Pilih kelurahan tempat RW ini berada.'
                                                        : 'Pilih RW tempat RT ini berada.'}
                                                </p>
                                            )}

                                        {errors.parent_id && (
                                            <p className="text-xs font-medium text-destructive">
                                                {errors.parent_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* INFO KELURAHAN */}
                                {data.type ===
                                    'kelurahan' && (
                                    <div className="rounded-xl border bg-muted/30 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Building2 className="h-4 w-4" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Wilayah tingkat
                                                    atas
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Kelurahan tidak
                                                    memiliki wilayah
                                                    induk dan menjadi
                                                    parent untuk RW.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STATUS */}
                                <div className="mt-auto pt-2">
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-4 transition hover:border-primary/30 hover:bg-primary/5">
                                        <input
                                            type="checkbox"
                                            checked={
                                                data.is_active
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setData(
                                                    'is_active',
                                                    event
                                                        .target
                                                        .checked,
                                                )
                                            }
                                            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                        />

                                        <div>
                                            <p className="text-sm font-semibold">
                                                Wilayah aktif
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                Tampilkan wilayah ini
                                                pada sistem dan peta
                                                publik.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* =================================================
                            BATAS WILAYAH
                        ================================================== */}
                        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
                            <div className="border-b bg-gradient-to-r from-emerald-500/[0.04] to-transparent px-5 py-5 sm:px-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <Map className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h2 className="font-semibold">
                                                Batas Wilayah
                                            </h2>

                                            <p className="text-xs text-muted-foreground">
                                                Gambarkan area cakupan
                                                wilayah pada peta
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={[
                                            'inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                                            data.boundary_geojson
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-muted text-muted-foreground',
                                        ].join(' ')}
                                    >
                                        {data.boundary_geojson ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                Batas sudah dibuat
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="h-3.5 w-3.5" />
                                                Belum dibuat
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 p-4 sm:p-5">
                                <div className="h-[600px] w-full overflow-hidden rounded-2xl border bg-muted sm:h-[640px]">
                                    {mounted ? (
                                        <Suspense
                                            fallback={
                                                <MapSkeleton />
                                            }
                                        >
                                            <div className="h-full w-full">
                                                <BoundaryEditor
                                                    value={
                                                        data.boundary_geojson
                                                    }
                                                    onChange={
                                                        onBoundary
                                                    }
                                                />
                                            </div>
                                        </Suspense>
                                    ) : (
                                        <MapSkeleton />
                                    )}
                                </div>

                                {boundaryError && (
                                    <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                                        <p className="text-sm font-medium text-destructive">
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
                    <section className="rounded-2xl border bg-background shadow-sm">
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />

                                    <p className="text-sm font-semibold">
                                        {area
                                            ? 'Perbarui data wilayah'
                                            : 'Simpan wilayah baru'}
                                    </p>
                                </div>

                                <p className="mt-1 text-xs text-muted-foreground sm:ml-4">
                                    Pastikan informasi wilayah
                                    dan batas geografis sudah
                                    sesuai.
                                </p>
                            </div>

                            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                                <Link
                                    href="/admin/areas"
                                    className="inline-flex h-11 items-center justify-center rounded-xl border bg-background px-6 text-sm font-medium transition hover:bg-accent"
                                >
                                    Batal
                                </Link>

                                <button
                                    type="submit"
                                    disabled={submitDisabled}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />

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