import { Head, Link, useForm } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import type {
    Center,
    PolygonGeo,
} from '@/components/map/boundary-editor';

// Leaflet membutuhkan `window`, jadi dimuat setelah component mount.
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

const input =
    'w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const disabledInput =
    'w-full cursor-not-allowed rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground opacity-70';

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

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
    } = useForm<FormData>({
        name: area?.name ?? '',
        type: area?.type ?? 'rw',
        parent_id: area?.parent_id ?? null,
        is_active: area?.is_active ?? true,
        center_lat: area?.center_lat ?? null,
        center_lng: area?.center_lng ?? null,
        boundary_geojson: area?.boundary_geojson ?? null,
    });

    /*
     * Menentukan jenis parent berdasarkan jenis wilayah.
     *
     * Kelurahan -> tidak memiliki parent
     * RW        -> parent berupa Kelurahan
     * RT        -> parent berupa RW
     */
    const parentType: 'kelurahan' | 'rw' | null =
        data.type === 'rw'
            ? 'kelurahan'
            : data.type === 'rt'
              ? 'rw'
              : null;

    /*
     * Hanya tampilkan parent yang sesuai dengan jenis wilayah.
     */
    const parentOptions = useMemo(() => {
        if (!parentType) {
            return [];
        }

        return parents.filter(
            (parent) => parent.type === parentType,
        );
    }, [parents, parentType]);

    /*
     * Label field parent.
     */
    const parentLabel =
        data.type === 'rw'
            ? 'Kelurahan Induk'
            : data.type === 'rt'
              ? 'RW Induk'
              : '';

    /*
     * Placeholder dropdown parent.
     */
    const parentPlaceholder =
        data.type === 'rw'
            ? 'Pilih kelurahan'
            : data.type === 'rt'
              ? 'Pilih RW'
              : 'Pilih...';

    /*
     * Pesan ketika belum ada parent.
     */
    const parentEmptyMessage =
        data.type === 'rw'
            ? 'Belum ada kelurahan. Tambahkan kelurahan terlebih dahulu.'
            : data.type === 'rt'
              ? 'Belum ada RW. Tambahkan RW terlebih dahulu.'
              : '';

    /*
     * Ambil label parent dari controller.
     *
     * Untuk RW:
     *   RW 07 — Warnasari
     *
     * Untuk Kelurahan:
     *   Warnasari
     *
     * Fallback ke name agar tetap kompatibel.
     */
    const getParentLabel = (parent: Parent) => {
        return parent.label ?? parent.name;
    };

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

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (area) {
            put(`/admin/areas/${area.id}`);
        } else {
            post('/admin/areas');
        }
    };

    /*
     * Menangkap semua error yang berhubungan dengan boundary.
     */
    const boundaryError = Object.entries(errors).find(
        ([key]) => key.startsWith('boundary_geojson'),
    )?.[1];

    /*
     * Apakah dropdown parent tersedia?
     */
    const hasParentOptions = parentOptions.length > 0;

    /*
     * Untuk RW/RT, parent wajib dipilih.
     */
    const parentRequired = data.type !== 'kelurahan';

    /*
     * Tombol simpan dapat dinonaktifkan jika:
     * - sedang processing
     * - RW/RT tetapi parent belum tersedia
     * - RW/RT tetapi parent belum dipilih
     */
    const submitDisabled =
        processing ||
        (parentRequired &&
            (!hasParentOptions || !data.parent_id));

    return (
        <>
            <Head
                title={
                    area
                        ? `Ubah ${area.name}`
                        : 'Tambah wilayah'
                }
            />

            <form
                onSubmit={submit}
                className="space-y-6 p-4"
            >
                {/* HEADER */}
                <div>
                    <h1 className="text-xl font-semibold">
                        {area
                            ? `Ubah ${area.name}`
                            : 'Tambah wilayah'}
                    </h1>

                    {area?.slug && (
                        <p className="text-sm text-muted-foreground">
                            Link peta: /wilayah/{area.slug}
                        </p>
                    )}
                </div>

                {/* INFO HIERARKI */}
                <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm font-medium">
                        Struktur wilayah
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelurahan → RW → RT
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* FORM KIRI */}
                    <div className="space-y-4">
                        {/* NAMA */}
                        <div className="space-y-1">
                            <label
                                htmlFor="name"
                                className="text-sm font-medium"
                            >
                                Nama wilayah
                            </label>

                            <input
                                id="name"
                                className={input}
                                value={data.name}
                                placeholder={
                                    data.type === 'kelurahan'
                                        ? 'Contoh: Warnasari'
                                        : data.type === 'rw'
                                          ? 'Contoh: RW 07'
                                          : 'Contoh: RT 01'
                                }
                                onChange={(event) =>
                                    setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                            />

                            {errors.name && (
                                <p className="text-sm text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* JENIS */}
                        <div className="space-y-1">
                            <label
                                htmlFor="type"
                                className="text-sm font-medium"
                            >
                                Jenis
                            </label>

                            <select
                                id="type"
                                className={input}
                                value={data.type}
                                onChange={(event) => {
                                    const type =
                                        event.target
                                            .value as AreaType;

                                    /*
                                     * Saat jenis berubah,
                                     * parent harus dikosongkan
                                     * agar tidak membawa parent
                                     * dari jenis sebelumnya.
                                     */
                                    setData((current) => ({
                                        ...current,
                                        type,
                                        parent_id: null,
                                    }));
                                }}
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

                            {errors.type && (
                                <p className="text-sm text-red-600">
                                    {errors.type}
                                </p>
                            )}
                        </div>

                        {/* PARENT */}
                        {parentType && (
                            <div className="space-y-1">
                                <label
                                    htmlFor="parent"
                                    className="text-sm font-medium"
                                >
                                    {parentLabel}
                                </label>

                                <select
                                    id="parent"
                                    className={
                                        hasParentOptions
                                            ? input
                                            : disabledInput
                                    }
                                    value={
                                        data.parent_id ?? ''
                                    }
                                    disabled={
                                        !hasParentOptions
                                    }
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
                                >
                                    <option value="">
                                        {!hasParentOptions
                                            ? parentEmptyMessage
                                            : parentPlaceholder}
                                    </option>

                                    {parentOptions.map(
                                        (parent) => (
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

                                {/* BELUM ADA PARENT */}
                                {!hasParentOptions && (
                                    <p className="text-sm text-amber-600">
                                        {parentEmptyMessage}
                                    </p>
                                )}

                                {/* INFO WAJIB PILIH */}
                                {hasParentOptions &&
                                    !data.parent_id &&
                                    !errors.parent_id && (
                                        <p className="text-sm text-muted-foreground">
                                            {data.type ===
                                            'rw'
                                                ? 'Pilih kelurahan tempat RW ini berada.'
                                                : 'Pilih RW tempat RT ini berada.'}
                                        </p>
                                    )}

                                {errors.parent_id && (
                                    <p className="text-sm text-red-600">
                                        {
                                            errors.parent_id
                                        }
                                    </p>
                                )}
                            </div>
                        )}

                        {/* INFO UNTUK KELURAHAN */}
                        {data.type === 'kelurahan' && (
                            <div className="rounded-md border bg-muted/30 p-3">
                                <p className="text-sm text-muted-foreground">
                                    Kelurahan merupakan wilayah
                                    tingkat atas sehingga tidak
                                    memiliki wilayah induk.
                                </p>
                            </div>
                        )}

                        {/* STATUS */}
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) =>
                                    setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                            />

                            Aktif (tampil di peta publik)
                        </label>
                    </div>

                    {/* BOUNDARY KANAN */}
                    <div className="space-y-2">
                        <div>
                            <h2 className="text-sm font-medium">
                                Batas wilayah
                            </h2>

                            <p className="text-xs text-muted-foreground">
                                Gambarkan batas wilayah pada
                                peta untuk menentukan area
                                cakupan.
                            </p>
                        </div>

                        {mounted ? (
                            <Suspense
                                fallback={
                                    <div className="flex h-[460px] items-center justify-center rounded-lg border bg-muted/30">
                                        <p className="text-sm text-muted-foreground">
                                            Memuat peta...
                                        </p>
                                    </div>
                                }
                            >
                                <BoundaryEditor
                                    value={
                                        data.boundary_geojson
                                    }
                                    onChange={onBoundary}
                                />
                            </Suspense>
                        ) : (
                            <div className="flex h-[460px] items-center justify-center rounded-lg border bg-muted/30">
                                <p className="text-sm text-muted-foreground">
                                    Memuat peta...
                                </p>
                            </div>
                        )}

                        {boundaryError && (
                            <p className="text-sm text-red-600">
                                {boundaryError}
                            </p>
                        )}
                    </div>
                </div>

                {/* ACTION */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={submitDisabled}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? 'Menyimpan...'
                            : area
                              ? 'Simpan perubahan'
                              : 'Simpan wilayah'}
                    </button>

                    <Link
                        href="/admin/areas"
                        className="text-sm underline"
                    >
                        Batal
                    </Link>
                </div>
            </form>
        </>
    );
}