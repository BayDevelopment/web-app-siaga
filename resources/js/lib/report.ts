export const MAX_PHOTOS = 5;
 
export type ReportStatus =
    | 'pending'
    | 'verified'
    | 'handling'
    | 'resolved'
    | 'rejected';
 
export type Severity = 'low' | 'medium' | 'high' | 'critical';
 
export type DisasterType = {
    id: number;
    name: string;
    slug: string;
    color: string;
};
 
export type AreaOption = {
    id: number;
    name: string;
    slug: string;
    type: string;
    parent_id: number | null;
    parent_name: string | null;
};
 
export type ReportPhoto = {
    id: number;
    url: string;
    caption: string | null;
};
 
export type ReportUpdateItem = {
    id: number;
    status: string;
    note: string | null;
    created_at: string | null;
};
 
export const STATUS_META: Record<
    ReportStatus,
    { label: string; badge: string }
> = {
    pending: {
        label: 'Menunggu verifikasi',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    verified: {
        label: 'Terverifikasi',
        badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    },
    handling: {
        label: 'Sedang ditangani',
        badge: 'bg-red-50 text-red-700 ring-red-200',
    },
    resolved: {
        label: 'Selesai',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    rejected: {
        label: 'Ditolak',
        badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    },
};
 
export const SEVERITY_META: Record<
    Severity,
    { label: string; badge: string; description: string }
> = {
    low: {
        label: 'Rendah',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        description: 'Dampak ringan, bisa ditangani secara mandiri.',
    },
    medium: {
        label: 'Sedang',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
        description: 'Perlu penanganan dan perhatian lebih lanjut.',
    },
    high: {
        label: 'Tinggi',
        badge: 'bg-orange-50 text-orange-700 ring-orange-200',
        description: 'Dampak cukup besar bagi masyarakat.',
    },
    critical: {
        label: 'Kritis',
        badge: 'bg-red-50 text-red-700 ring-red-200',
        description: 'Dampak serius, butuh penanganan segera.',
    },
};
 
export const SEVERITY_ORDER: Severity[] = ['low', 'medium', 'high', 'critical'];
 
/** Status yang boleh dilihat publik. */
export const PUBLIC_STATUSES: ReportStatus[] = ['verified', 'handling'];
 
export const ALL_STATUSES: ReportStatus[] = [
    'pending',
    'verified',
    'handling',
    'resolved',
    'rejected',
];
 
const FALLBACK_BADGE = 'bg-slate-100 text-slate-600 ring-slate-200';
 
export function statusMeta(status: string) {
    return (
        STATUS_META[status as ReportStatus] ?? {
            label: status,
            badge: FALLBACK_BADGE,
        }
    );
}
 
export function severityMeta(severity: string) {
    return (
        SEVERITY_META[severity as Severity] ?? {
            label: severity,
            badge: FALLBACK_BADGE,
            description: '',
        }
    );
}
 
export function formatDateTime(date: string | null | undefined): string {
    if (!date) {
        return '-';
    }
 
    const parsed = new Date(date);
 
    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }
 
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(parsed);
}
 
/** Nilai awal untuk <input type="datetime-local"> (waktu lokal browser). */
export function nowForDateTimeLocal(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
 
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}