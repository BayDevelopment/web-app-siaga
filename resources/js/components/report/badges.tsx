import { severityMeta, statusMeta } from '@/lib/report';

const base =
    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset';

export function StatusBadge({ status }: { status: string }) {
    const meta = statusMeta(status);

    return <span className={`${base} ${meta.badge}`}>{meta.label}</span>;
}

export function SeverityBadge({ severity }: { severity: string }) {
    const meta = severityMeta(severity);

    return <span className={`${base} ${meta.badge}`}>{meta.label}</span>;
}