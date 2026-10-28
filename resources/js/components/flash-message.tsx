import { usePage } from '@inertiajs/react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Flash = { success?: string | null; error?: string | null };

/**
 * Menampilkan flash message dari controller.
 * Butuh share `flash` di HandleInertiaRequests (lihat catatan).
 */
export default function FlashMessage() {
    const flash = usePage<{ flash?: Flash }>().props.flash;

    const message = flash?.success ?? flash?.error ?? null;
    const isError = !flash?.success && !!flash?.error;

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!message) {
            setVisible(false);
            return;
        }

        setVisible(true);

        const timer = setTimeout(() => setVisible(false), 6000);

        return () => clearTimeout(timer);
    }, [message]);

    if (!message || !visible) {
        return null;
    }

    return (
        <div
            role="status"
            className={[
                'mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm',
                isError
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800',
            ].join(' ')}
        >
            {isError ? (
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="flex-1 leading-6">{message}</p>

            <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Tutup pesan"
                className="rounded-lg p-1 opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}