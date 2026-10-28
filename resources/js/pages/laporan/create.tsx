import { FormEvent, useMemo, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Crosshair,
    FileText,
    Info,
    LoaderCircle,
    MapPin,
    Navigation,
    ShieldCheck,
} from 'lucide-react';

type DisasterType = {
    id: number;
    name: string;
    slug: string;
    color: string;
};

type Area = {
    id: number;
    name: string;
    slug: string;
    type: string;
    parent_id: number | null;
};

type Props = {
    types: DisasterType[];
    areas: Area[];
};

type FormData = {
    disaster_type_id: string;
    area_id: string;
    title: string;
    description: string;
    latitude: string;
    longitude: string;
    address: string;
    severity: string;
    occurred_at: string;
};

type PageProps = {
    auth: {
        user?: {
            id?: number;
            name?: string;
            role?: string;
        };
    };
};

function getCurrentDateTime(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function Create({ types, areas }: Props) {
    const { auth } = usePage<PageProps>().props;

    const isAdmin = auth?.user?.role === 'admin';

    const [locationLoading, setLocationLoading] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');
    const [selectedType, setSelectedType] = useState<DisasterType | null>(
        null,
    );

    const { data, setData, post, processing, errors } =
        useForm<FormData>({
            disaster_type_id: '',
            area_id: '',
            title: '',
            description: '',
            latitude: '',
            longitude: '',
            address: '',
            severity: '',
            occurred_at: getCurrentDateTime(),
        });

    const selectedDisasterType = useMemo(() => {
        return (
            types.find(
                (type) => String(type.id) === data.disaster_type_id,
            ) ?? selectedType
        );
    }, [types, data.disaster_type_id, selectedType]);

    function submit(event: FormEvent) {
        event.preventDefault();

        post('/laporan');
    }

    function useCurrentLocation() {
        if (!navigator.geolocation) {
            setLocationMessage(
                'Browser Anda tidak mendukung fitur lokasi.',
            );
            return;
        }

        setLocationLoading(true);
        setLocationMessage('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData('latitude', position.coords.latitude.toFixed(7));
                setData('longitude', position.coords.longitude.toFixed(7));

                setLocationLoading(false);
                setLocationMessage(
                    'Lokasi berhasil diperoleh dari perangkat Anda.',
                );
            },
            () => {
                setLocationLoading(false);
                setLocationMessage(
                    'Lokasi tidak dapat diperoleh. Pastikan izin lokasi telah diberikan.',
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    }

    const isFormIncomplete =
        !data.disaster_type_id ||
        !data.area_id ||
        !data.title.trim() ||
        !data.latitude ||
        !data.longitude ||
        !data.severity ||
        !data.occurred_at;

    const submitDisabled =
        processing ||
        isFormIncomplete ||
        types.length === 0 ||
        areas.length === 0;

    return (
        <>
            <Head title="Buat Laporan Kejadian" />

            <div className="min-h-screen bg-slate-50">
                {/* HEADER */}
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/laporan"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>

                            <div>
                                <h1 className="text-lg font-bold text-slate-900">
                                    Buat Laporan Kejadian
                                </h1>

                                <p className="text-sm text-slate-500">
                                    Laporkan kejadian bencana di wilayah Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                    {/* ADMIN NOTICE */}
                    {isAdmin && (
                        <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-emerald-900">
                                    Mode Administrator
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-emerald-800">
                                    Laporan yang dibuat oleh administrator
                                    akan langsung diverifikasi dan dapat
                                    ditampilkan pada peta kejadian.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* GENERAL NOTICE */}
                    {!isAdmin && (
                        <div className="mb-6 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <Info className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-blue-900">
                                    Informasi Laporan
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-blue-800">
                                    Laporan yang Anda kirim akan diperiksa
                                    terlebih dahulu oleh administrator sebelum
                                    ditampilkan sebagai kejadian terverifikasi.
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* SECTION 01 */}
                        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <SectionHeader
                                number="01"
                                icon={<FileText className="h-5 w-5" />}
                                title="Informasi Kejadian"
                                description="Lengkapi informasi dasar mengenai kejadian yang dilaporkan."
                            />

                            <div className="space-y-5 p-5 sm:p-6">
                                {/* JENIS */}
                                <div>
                                    <Label
                                        htmlFor="disaster_type_id"
                                        required
                                    >
                                        Jenis Kejadian
                                    </Label>

                                    <select
                                        id="disaster_type_id"
                                        value={data.disaster_type_id}
                                        onChange={(event) => {
                                            setData(
                                                'disaster_type_id',
                                                event.target.value,
                                            );

                                            const type = types.find(
                                                (item) =>
                                                    String(item.id) ===
                                                    event.target.value,
                                            );

                                            setSelectedType(type ?? null);
                                        }}
                                        disabled={types.length === 0}
                                        className={inputClass(
                                            !data.disaster_type_id ||
                                                !!errors.disaster_type_id,
                                            false,
                                            types.length === 0,
                                        )}
                                    >
                                        <option value="">
                                            {types.length === 0
                                                ? 'Jenis kejadian belum tersedia'
                                                : 'Pilih jenis kejadian'}
                                        </option>

                                        {types.map((type) => (
                                            <option
                                                key={type.id}
                                                value={type.id}
                                            >
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>

                                    {types.length === 0 ? (
                                        <p className="mt-1.5 text-xs font-medium text-amber-600">
                                            Pilihan jenis kejadian belum
                                            tersedia. Silakan hubungi
                                            administrator.
                                        </p>
                                    ) : !data.disaster_type_id &&
                                      !errors.disaster_type_id ? (
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Jenis kejadian harus diisi.
                                        </p>
                                    ) : null}

                                    <ErrorMessage
                                        message={errors.disaster_type_id}
                                    />

                                    {selectedDisasterType && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                                            <span
                                                className="h-3 w-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        selectedDisasterType.color,
                                                }}
                                            />

                                            <span>
                                                {selectedDisasterType.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* WILAYAH */}
                                <div>
                                    <Label
                                        htmlFor="area_id"
                                        required
                                    >
                                        Wilayah Kejadian
                                    </Label>

                                    <select
                                        id="area_id"
                                        value={data.area_id}
                                        onChange={(event) =>
                                            setData(
                                                'area_id',
                                                event.target.value,
                                            )
                                        }
                                        disabled={areas.length === 0}
                                        className={inputClass(
                                            !data.area_id ||
                                                !!errors.area_id,
                                            false,
                                            areas.length === 0,
                                        )}
                                    >
                                        <option value="">
                                            {areas.length === 0
                                                ? 'Wilayah belum tersedia'
                                                : 'Pilih wilayah'}
                                        </option>

                                        {areas.map((area) => (
                                            <option
                                                key={area.id}
                                                value={area.id}
                                            >
                                                {area.name}
                                            </option>
                                        ))}
                                    </select>

                                    {areas.length === 0 ? (
                                        <p className="mt-1.5 text-xs font-medium text-amber-600">
                                            Pilihan wilayah belum tersedia.
                                            Silakan hubungi administrator.
                                        </p>
                                    ) : !data.area_id &&
                                      !errors.area_id ? (
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Wilayah kejadian harus diisi.
                                        </p>
                                    ) : null}

                                    <ErrorMessage
                                        message={errors.area_id}
                                    />
                                </div>

                                {/* JUDUL */}
                                <div>
                                    <Label htmlFor="title" required>
                                        Judul Laporan
                                    </Label>

                                    <input
                                        id="title"
                                        type="text"
                                        value={data.title}
                                        onChange={(event) =>
                                            setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Banjir merendam beberapa rumah warga"
                                        className={inputClass(
                                            !data.title.trim() ||
                                                !!errors.title,
                                        )}
                                    />

                                    <p className="mt-1.5 text-xs text-slate-500">
                                        Buat judul yang singkat dan
                                        menggambarkan kejadian.
                                    </p>

                                    <ErrorMessage
                                        message={errors.title}
                                    />
                                </div>

                                {/* DESKRIPSI */}
                                <div>
                                    <Label htmlFor="description">
                                        Deskripsi Kejadian
                                    </Label>

                                    <textarea
                                        id="description"
                                        rows={5}
                                        value={data.description}
                                        onChange={(event) =>
                                            setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Jelaskan kondisi kejadian, dampak, jumlah warga terdampak, atau informasi penting lainnya."
                                        className={inputClass(
                                            !!errors.description,
                                            true,
                                        )}
                                    />

                                    <p className="mt-1.5 text-xs text-slate-500">
                                        Jelaskan kondisi kejadian secara jelas
                                        dan faktual.
                                    </p>

                                    <ErrorMessage
                                        message={errors.description}
                                    />
                                </div>

                                {/* WAKTU */}
                                <div>
                                    <Label htmlFor="occurred_at" required>
                                        Waktu Kejadian
                                    </Label>

                                    <input
                                        id="occurred_at"
                                        type="datetime-local"
                                        value={data.occurred_at}
                                        onChange={(event) =>
                                            setData(
                                                'occurred_at',
                                                event.target.value,
                                            )
                                        }
                                        className={inputClass(
                                            !data.occurred_at ||
                                                !!errors.occurred_at,
                                        )}
                                    />

                                    <ErrorMessage
                                        message={errors.occurred_at}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* SECTION 02 */}
                        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <SectionHeader
                                number="02"
                                icon={<MapPin className="h-5 w-5" />}
                                title="Lokasi Kejadian"
                                description="Tentukan lokasi kejadian secara akurat."
                            />

                            <div className="space-y-5 p-5 sm:p-6">
                                {/* LOCATION BUTTON */}
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                                                <Navigation className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    Gunakan lokasi saat ini
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Gunakan GPS perangkat untuk
                                                    mengisi koordinat secara
                                                    otomatis.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={useCurrentLocation}
                                            disabled={locationLoading}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {locationLoading ? (
                                                <>
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    Mengambil Lokasi...
                                                </>
                                            ) : (
                                                <>
                                                    <Crosshair className="h-4 w-4" />
                                                    Gunakan GPS
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {locationMessage && (
                                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs text-slate-600">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                                            <span>{locationMessage}</span>
                                        </div>
                                    )}
                                </div>

                                {/* MAP PLACEHOLDER */}
                                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
                                    <div className="text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                                            <MapPin className="h-6 w-6" />
                                        </div>

                                        <p className="mt-3 font-medium text-slate-700">
                                            Peta Lokasi
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Peta interaktif dapat digunakan
                                            untuk menentukan titik lokasi.
                                        </p>
                                    </div>
                                </div>

                                {/* LAT LNG */}
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <Label
                                            htmlFor="latitude"
                                            required
                                        >
                                            Latitude
                                        </Label>

                                        <input
                                            id="latitude"
                                            type="text"
                                            value={data.latitude}
                                            onChange={(event) =>
                                                setData(
                                                    'latitude',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="-6.1234567"
                                            className={inputClass(
                                                !data.latitude ||
                                                    !!errors.latitude,
                                            )}
                                        />

                                        <ErrorMessage
                                            message={errors.latitude}
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="longitude"
                                            required
                                        >
                                            Longitude
                                        </Label>

                                        <input
                                            id="longitude"
                                            type="text"
                                            value={data.longitude}
                                            onChange={(event) =>
                                                setData(
                                                    'longitude',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="106.1234567"
                                            className={inputClass(
                                                !data.longitude ||
                                                    !!errors.longitude,
                                            )}
                                        />

                                        <ErrorMessage
                                            message={errors.longitude}
                                        />
                                    </div>
                                </div>

                                {/* ADDRESS */}
                                <div>
                                    <Label htmlFor="address">
                                        Alamat / Keterangan Lokasi
                                    </Label>

                                    <textarea
                                        id="address"
                                        rows={3}
                                        value={data.address}
                                        onChange={(event) =>
                                            setData(
                                                'address',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Jl. Raya Cilegon, Kelurahan ..., Kecamatan ..."
                                        className={inputClass(
                                            !!errors.address,
                                            true,
                                        )}
                                    />

                                    <ErrorMessage
                                        message={errors.address}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* SECTION 03 */}
                        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <SectionHeader
                                number="03"
                                icon={<AlertCircle className="h-5 w-5" />}
                                title="Tingkat Keparahan"
                                description="Tentukan tingkat dampak dari kejadian yang dilaporkan."
                            />

                            <div className="p-5 sm:p-6">
                                <Label required>Tingkat Keparahan</Label>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        {
                                            value: 'low',
                                            label: 'Rendah',
                                            description:
                                                'Dampak ringan dan dapat ditangani secara mandiri.',
                                        },
                                        {
                                            value: 'medium',
                                            label: 'Sedang',
                                            description:
                                                'Membutuhkan penanganan dan perhatian lebih lanjut.',
                                        },
                                        {
                                            value: 'high',
                                            label: 'Tinggi',
                                            description:
                                                'Menimbulkan dampak cukup besar bagi masyarakat.',
                                        },
                                        {
                                            value: 'critical',
                                            label: 'Kritis',
                                            description:
                                                'Dampak serius dan membutuhkan penanganan segera.',
                                        },
                                    ].map((severity) => {
                                        const selected =
                                            data.severity ===
                                            severity.value;

                                        return (
                                            <button
                                                key={severity.value}
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'severity',
                                                        severity.value,
                                                    )
                                                }
                                                className={severityCardClass(
                                                    selected,
                                                )}
                                            >
                                                <div className="text-left">
                                                    <p className="font-semibold">
                                                        {severity.label}
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 opacity-75">
                                                        {
                                                            severity.description
                                                        }
                                                    </p>
                                                </div>

                                                {selected && (
                                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <ErrorMessage
                                    message={errors.severity}
                                />
                            </div>
                        </section>

                        {/* FINAL NOTICE */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex gap-3">
                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                                <div className="text-sm leading-6 text-slate-600">
                                    {isAdmin ? (
                                        <p>
                                            Sebagai administrator, laporan
                                            yang Anda buat akan disimpan sebagai
                                            laporan terverifikasi.
                                        </p>
                                    ) : (
                                        <p>
                                            Pastikan seluruh informasi yang
                                            dimasukkan sudah benar. Laporan
                                            akan berstatus{' '}
                                            <strong className="font-semibold text-slate-800">
                                                menunggu verifikasi
                                            </strong>{' '}
                                            setelah dikirim.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href="/laporan"
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={submitDisabled}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : isAdmin ? (
                                    <>
                                        <ShieldCheck className="h-4 w-4" />
                                        Simpan & Verifikasi
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        Kirim Laporan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionHeader({
    number,
    icon,
    title,
    description,
}: {
    number: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider text-slate-400">
                        {number}
                    </span>

                    <h2 className="font-bold text-slate-900">
                        {title}
                    </h2>
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function Label({
    htmlFor,
    required = false,
    children,
}: {
    htmlFor?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="mb-2 block text-sm font-semibold text-slate-700"
        >
            {children}

            {required && (
                <span className="ml-1 text-red-500">*</span>
            )}
        </label>
    );
}

function ErrorMessage({
    message,
}: {
    message?: string;
}) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 text-xs font-medium text-red-600">
            {message}
        </p>
    );
}

function inputClass(
    hasError = false,
    textarea = false,
    disabled = false,
) {
    return [
        'w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition',
        'placeholder:text-slate-400',
        'focus:bg-white focus:ring-2',
        textarea ? 'resize-y' : '',
        disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : '',
        !disabled && hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
            : '',
        !disabled && !hasError
            ? 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
            : '',
    ].join(' ');
}

function severityCardClass(selected: boolean) {
    return [
        'flex min-h-[120px] items-start justify-between gap-3 rounded-2xl border p-4 text-left transition',
        selected
            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    ].join(' ');
}