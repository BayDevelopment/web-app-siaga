import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthBrandLayout from '@/layouts/auth-brand-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthBrandLayout
            title="Verifikasi email"
            description="Verifikasi alamat email lu dengan mengklik tautan yang baru saja kami kirim."
        >
            <Head title="Verifikasi email" />

            {status === 'verification-link-sent' && (
                <div className="mb-5 rounded-lg border border-forest-400/40 bg-forest-50 px-4 py-3 text-center text-sm font-medium text-forest-800 dark:bg-forest-800/20 dark:text-forest-100">
                    Tautan verifikasi baru sudah dikirim ke alamat email yang lu
                    gunakan saat mendaftar.
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            disabled={processing}
                            className="w-full bg-linear-to-r from-navy-600 to-navy-500 shadow-lg shadow-navy-600/25 transition hover:brightness-110"
                        >
                            {processing && <Spinner />}
                            Kirim ulang email verifikasi
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Keluar
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthBrandLayout>
    );
}

// Layout sudah dibungkus AuthBrandLayout di dalam halaman.
VerifyEmail.layout = (page: React.ReactNode) => page;