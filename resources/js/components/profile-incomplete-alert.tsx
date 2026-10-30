import { Link, usePage } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type Props = {
    showLink?: boolean;
};

export function useMissingProfileFields() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const missing: string[] = [];

    if (!auth.user.phone) {
        missing.push('Nomor WhatsApp');
    }

    // Tambahkan pengecekan lain di sini (RT/RW, alamat, dll.)

    return missing;
}

export default function ProfileIncompleteAlert({ showLink = true }: Props) {
    const missing = useMissingProfileFields();

    if (missing.length === 0) {
        return null;
    }

    return (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <TriangleAlert className="size-4" />
            <AlertTitle>Lengkapi akun Anda</AlertTitle>
            <AlertDescription>
                Data berikut belum diisi: {missing.join(', ')}.{' '}
                {showLink && (
                    <Link
                        href={edit()}
                        className="font-medium underline underline-offset-4"
                    >
                        Lengkapi sekarang
                    </Link>
                )}
            </AlertDescription>
        </Alert>
    );
}