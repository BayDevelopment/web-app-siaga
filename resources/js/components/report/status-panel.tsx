import { useForm } from '@inertiajs/react';
import { BadgeCheck, LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';

import { StatusBadge } from '@/components/report/badges';
import { ALL_STATUSES, STATUS_META } from '@/lib/report';

type Props = {
    reportId: number;
    status: string;
};

const inputClass =
    'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20';

/**
 * Card verifikasi / ubah status laporan. Hanya untuk admin dan petugas.
 * Form-nya terpisah dari form isi laporan, jadi foto dan isi laporan
 * tidak ikut terkirim ulang.
 */
export default function StatusPanel({ reportId, status }: Props) {
    const form = useForm({
        status,
        note: '',
        is_public: true,
    });

    const isReject = form.data.status === 'rejected';
    const unchanged = form.data.status === status && !form.data.note.trim();

    function submit(event: FormEvent) {
        event.preventDefault();

        form.patch(`/laporan/${reportId}/status`, {
            preserveScroll: true,
            onSuccess: () => form.reset('note'),
        });
    }

    return (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="h-6 w-1 shrink-0 rounded-full bg-linear-to-b from-sun-400 via-forest-500 to-navy-500" />
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Verifikasi & status laporan
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Hanya terlihat oleh admin dan petugas.
                        </p>
                    </div>
                </div>

                <StatusBadge status={status} />
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label
                        htmlFor="status"
                        className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                        Status baru
                    </label>
                    <select
                        id="status"
                        value={form.data.status}
                        onChange={(e) => form.setData('status', e.target.value)}
                        className={inputClass}
                    >
                        {ALL_STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {STATUS_META[value].label}
                            </option>
                        ))}
                    </select>
                    {form.errors.status && (
                        <p role="alert" className="mt-1 text-xs text-red-600">
                            {form.errors.status}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="status_note"
                        className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                        Catatan{' '}
                        <span className="font-normal text-muted-foreground">
                            {isReject ? '(wajib untuk penolakan)' : '(opsional)'}
                        </span>
                    </label>
                    <textarea
                        id="status_note"
                        rows={3}
                        maxLength={1000}
                        value={form.data.note}
                        onChange={(e) => form.setData('note', e.target.value)}
                        placeholder={
                            isReject
                                ? 'Jelaskan alasan laporan ditolak'
                                : 'Contoh: Tim sudah menuju lokasi'
                        }
                        className={`${inputClass} resize-y`}
                    />
                    {form.errors.note && (
                        <p role="alert" className="mt-1 text-xs text-red-600">
                            {form.errors.note}
                        </p>
                    )}
                </div>

                <label className="flex items-start gap-2 text-sm text-foreground">
                    <input
                        type="checkbox"
                        checked={form.data.is_public}
                        onChange={(e) =>
                            form.setData('is_public', e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-border"
                    />
                    <span>
                        Tampilkan catatan ke publik
                        <span className="block text-xs text-muted-foreground">
                            Pelapor bisa melihatnya di halaman Cek status
                            laporan. Matikan untuk catatan internal.
                        </span>
                    </span>
                </label>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing || unchanged}
                        className="inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {form.processing ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <BadgeCheck className="h-4 w-4" />
                        )}
                        Simpan status
                    </button>
                </div>
            </form>
        </section>
    );
}