import { Link, usePage } from '@inertiajs/react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type Props = {
    showLink?: boolean;
    showWhenComplete?: boolean;
};

export function useMissingProfileFields() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const missing: string[] = [];

    if (!auth.user.phone) {
        missing.push('Nomor WhatsApp');
    }

    // Tambahkan pengecekan lain di sini nanti (alamat, RT/RW, dll.)

    return missing;
}

export default function ProfileStatus({
    showLink = true,
    showWhenComplete = true,
}: Props) {
    const missing = useMissingProfileFields();

    if (missing.length === 0) {
        if (!showWhenComplete) {
            return null;
        }

        return (
            <Alert className="border-green-300 bg-green-50 text-green-900 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200">
                <CircleCheck className="size-4" />
                <AlertTitle>Akun Anda sudah lengkap</AlertTitle>
                <AlertDescription>
                    Semua data yang dibutuhkan sudah terisi.
                </AlertDescription>
            </Alert>
        );
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