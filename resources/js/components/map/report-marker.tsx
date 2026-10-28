import { CircleMarker, Popup } from 'react-leaflet';

import type {
    MapReport,
    MapType,
} from '@/components/map/disaster-map';

type Props = {
    report: MapReport;
    type?: MapType;
};

const SEVERITY_LABEL: Record<string, string> = {
    low: 'Ringan',
    medium: 'Sedang',
    high: 'Berat',
    critical: 'Kritis',
};

const SEVERITY_RADIUS: Record<string, number> = {
    low: 8,
    medium: 10,
    high: 12,
    critical: 14,
};

const STATUS_LABEL: Record<string, string> = {
    verified: 'Terverifikasi',
    handling: 'Sedang ditangani',
};

function formatTime(iso: string | null): string {
    if (!iso) {
        return '-';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function ReportMarker({ report, type }: Props) {
    const color = type?.color ?? '#64748b';

    return (
        <CircleMarker
            center={[report.lat, report.lng]}
            radius={SEVERITY_RADIUS[report.severity] ?? 10}
            pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9,
            }}
        >
            <Popup>
                <div className="min-w-48 space-y-1 text-sm text-neutral-900">
                    <p className="font-semibold">
                        {report.title}
                    </p>

                    <p className="text-xs">
                        {type?.name ?? 'Jenis bencana'} -{' '}
                        {SEVERITY_LABEL[report.severity] ??
                            report.severity}
                    </p>

                    <p className="text-xs">
                        {STATUS_LABEL[report.status] ??
                            report.status}
                    </p>

                    {report.description && (
                        <p>{report.description}</p>
                    )}

                    {report.address && (
                        <p className="text-xs">
                            {report.address}
                        </p>
                    )}

                    <p className="text-xs text-neutral-600">
                        {formatTime(report.occurred_at)} -{' '}
                        {report.code}
                    </p>
                </div>
            </Popup>
        </CircleMarker>
    );
}