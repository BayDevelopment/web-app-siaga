import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    FileText,
    Flame,
    Map,
    MapPin,
    ShieldCheck,
    Siren,
    TreePine,
    Users,
    Waves,
} from 'lucide-react';

import { dashboard } from '@/routes';

type UserRole = 'admin' | 'petugas' | 'warga';

type PageProps = {
    auth: {
        user: {
            name: string;
            role: UserRole;
            area?: {
                name: string;
            } | null;
        };
    };
};

const roleConfig = {
    admin: {
        label: 'Administrator',
        greeting: 'Selamat datang kembali,',
        description:
            'Pantau kondisi kebencanaan, laporan masyarakat, dan aktivitas sistem SIAGA-W.',
        icon: ShieldCheck,
        badge: 'Akses Penuh',
    },
    petugas: {
        label: 'Petugas Lapangan',
        greeting: 'Selamat bertugas,',
        description:
            'Pantau kejadian aktif dan prioritaskan laporan yang membutuhkan penanganan.',
        icon: Siren,
        badge: 'Petugas',
    },
    warga: {
        label: 'Warga',
        greeting: 'Selamat datang,',
        description:
            'Pantau kondisi wilayah Anda dan laporkan kejadian darurat di sekitar.',
        icon: MapPin,
        badge: 'Masyarakat',
    },
};

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    iconClass = 'bg-blue-50 text-blue-600',
}: {
    title: string;
    value: string;
    description: string;
    icon: typeof FileText;
    iconClass?: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function QuickAction({
    title,
    description,
    href,
    icon: Icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: typeof FileText;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-400">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                    {title}
                </p>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            </div>

            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
        </Link>
    );
}

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
                {description}
            </p>
        </div>
    );
}

function AdminDashboard() {
    return (
        <>
            {/* Statistik utama */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Laporan"
                    value="128"
                    description="Seluruh laporan kejadian"
                    icon={FileText}
                    iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                />

                <StatCard
                    title="Laporan Aktif"
                    value="24"
                    description="Sedang dipantau sistem"
                    icon={AlertCircle}
                    iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                />

                <StatCard
                    title="Wilayah"
                    value="18"
                    description="Wilayah terdaftar"
                    icon={MapPin}
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                />

                <StatCard
                    title="Petugas"
                    value="32"
                    description="Petugas terdaftar"
                    icon={Users}
                    iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                />
            </div>

            {/* Monitoring */}
            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <SectionTitle
                        title="Monitoring Kebencanaan"
                        description="Ringkasan kondisi laporan yang masuk ke SIAGA-W."
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <StatCard
                            title="Terverifikasi"
                            value="76"
                            description="Laporan telah diverifikasi"
                            icon={CheckCircle2}
                            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        />

                        <StatCard
                            title="Sedang Ditangani"
                            value="18"
                            description="Membutuhkan tindak lanjut"
                            icon={Siren}
                            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                        />

                        <StatCard
                            title="Prioritas Tinggi"
                            value="7"
                            description="Kejadian dengan urgensi tinggi"
                            icon={AlertTriangle}
                            iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                        />

                        <StatCard
                            title="Fasilitas"
                            value="41"
                            description="Fasilitas tanggap bencana"
                            icon={Map}
                            iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400"
                        />
                    </div>
                </div>

                {/* Status sistem */}
                <div>
                    <SectionTitle
                        title="Status Sistem"
                        description="Kondisi layanan SIAGA-W saat ini."
                    />

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    Semua Sistem Normal
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Layanan berjalan dengan baik
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Database
                                </span>
                                <span className="font-medium text-emerald-600">
                                    Online
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Peta
                                </span>
                                <span className="font-medium text-emerald-600">
                                    Aktif
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Layanan Laporan
                                </span>
                                <span className="font-medium text-emerald-600">
                                    Aktif
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Aksi cepat */}
            <div>
                <SectionTitle
                    title="Akses Cepat"
                    description="Kelola sistem dan pantau kondisi wilayah."
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <QuickAction
                        title="Peta Kejadian"
                        description="Pantau seluruh kejadian pada peta."
                        href="/peta"
                        icon={Map}
                    />

                    <QuickAction
                        title="Kelola Wilayah"
                        description="Kelola Kelurahan, RW, dan RT."
                        href="/admin/areas"
                        icon={MapPin}
                    />

                    <QuickAction
                        title="Lihat Laporan"
                        description="Tinjau seluruh laporan kejadian."
                        href="/laporan"
                        icon={FileText}
                    />
                </div>
            </div>
        </>
    );
}

function PetugasDashboard() {
    return (
        <>
            {/* Statistik petugas */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Laporan Aktif"
                    value="24"
                    description="Kejadian yang perlu dipantau"
                    icon={AlertCircle}
                    iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                />

                <StatCard
                    title="Sedang Ditangani"
                    value="12"
                    description="Dalam proses penanganan"
                    icon={Siren}
                    iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                />

                <StatCard
                    title="Prioritas Tinggi"
                    value="5"
                    description="Memerlukan respons segera"
                    icon={AlertTriangle}
                    iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                />

                <StatCard
                    title="Selesai Ditangani"
                    value="38"
                    description="Penanganan berhasil diselesaikan"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                />
            </div>

            {/* Prioritas */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SectionTitle
                        title="Prioritas Penanganan"
                        description="Kejadian yang membutuhkan perhatian petugas."
                    />

                    <div className="space-y-3">
                        <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-950 dark:bg-red-950/20">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                <Flame className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    Kebakaran
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Memerlukan penanganan segera
                                </p>
                            </div>

                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                                KRITIS
                            </span>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <Waves className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    Banjir
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Sedang dalam pemantauan
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                TINGGI
                            </span>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-950 dark:bg-amber-950/20">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                <TreePine className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    Pohon Tumbang
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Menunggu tindak lanjut
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                SEDANG
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <SectionTitle
                        title="Aksi Petugas"
                        description="Akses cepat untuk operasional."
                    />

                    <div className="space-y-3">
                        <QuickAction
                            title="Buka Peta"
                            description="Pantau lokasi kejadian aktif."
                            href="/peta"
                            icon={Map}
                        />

                        <QuickAction
                            title="Lihat Laporan"
                            description="Tinjau laporan masyarakat."
                            href="/laporan"
                            icon={FileText}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

function WargaDashboard() {
    return (
        <>
            {/* Statistik warga */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Laporan Saya"
                    value="8"
                    description="Total laporan yang dibuat"
                    icon={FileText}
                    iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                />

                <StatCard
                    title="Diproses"
                    value="2"
                    description="Laporan sedang ditangani"
                    icon={Clock3}
                    iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                />

                <StatCard
                    title="Terverifikasi"
                    value="5"
                    description="Laporan berhasil diverifikasi"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                />

                <StatCard
                    title="Kejadian Aktif"
                    value="6"
                    description="Di sekitar wilayah Anda"
                    icon={AlertTriangle}
                    iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                />
            </div>

            {/* Kondisi wilayah */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SectionTitle
                        title="Kondisi Wilayah"
                        description="Informasi kejadian yang sedang berlangsung di sekitar Anda."
                    />

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <MapPin className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Wilayah Anda
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                    Wilayah Terdaftar
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Pantau laporan kejadian dan kondisi
                                    kebencanaan di sekitar wilayah tempat
                                    tinggal Anda.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    Kritis
                                </p>
                                <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
                                    1
                                </p>
                            </div>

                            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Tinggi
                                </p>
                                <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
                                    2
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20">
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Sedang
                                </p>
                                <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    3
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <SectionTitle
                        title="Aksi Cepat"
                        description="Laporkan dan pantau kejadian."
                    />

                    <div className="space-y-3">
                        <Link
                            href="/laporan/create"
                            className="flex items-center justify-between rounded-2xl bg-blue-600 p-5 text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                        >
                            <div>
                                <p className="font-bold">
                                    Laporkan Kejadian
                                </p>
                                <p className="mt-1 text-xs text-blue-100">
                                    Sampaikan kejadian darurat di sekitar Anda.
                                </p>
                            </div>

                            <ArrowRight className="h-5 w-5" />
                        </Link>

                        <QuickAction
                            title="Peta Kejadian"
                            description="Lihat kondisi wilayah."
                            href="/peta"
                            icon={Map}
                        />

                        <QuickAction
                            title="Laporan Saya"
                            description="Pantau laporan yang dibuat."
                            href="/laporan"
                            icon={FileText}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;

    const user = auth.user;
    const role = user.role;

    const config = roleConfig[role];
    const RoleIcon = config.icon;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg md:p-8">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

                    <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="max-w-3xl">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
                                    <RoleIcon className="h-3.5 w-3.5" />
                                    {config.label}
                                </span>

                                <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                                    {config.badge}
                                </span>
                            </div>

                            <p className="text-sm text-slate-400">
                                {config.greeting}
                            </p>

                            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                                {user.name}
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                                {config.description}
                            </p>

                            {user.area?.name && (
                                <div className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400">
                                    <MapPin className="h-4 w-4" />
                                    Wilayah: {user.area.name}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/peta"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                        >
                            <Map className="h-4 w-4" />
                            Buka Peta Kejadian
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                {/* Dashboard berdasarkan role */}
                {role === 'admin' && <AdminDashboard />}

                {role === 'petugas' && <PetugasDashboard />}

                {role === 'warga' && <WargaDashboard />}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};