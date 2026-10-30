import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthBrandLayout from '@/layouts/auth-brand-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthBrandLayout
            title="Lupa password?"
            description="Masukkan email lu, nanti kami kirim tautan untuk mengatur ulang password."
        >
            <Head title="Lupa password" />

            {status && (
                <div className="mb-5 rounded-lg border border-forest-400/40 bg-forest-50 px-4 py-3 text-center text-sm font-medium text-forest-800 dark:bg-forest-800/20 dark:text-forest-100">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()} className="grid gap-5">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <Button
                                className="mt-1 w-full bg-linear-to-r from-navy-600 to-navy-500 shadow-lg shadow-navy-600/25 transition hover:brightness-110"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <Spinner />}
                                Kirim tautan reset password
                            </Button>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Atau kembali ke</span>
                    <TextLink href={login()}>halaman masuk</TextLink>
                </div>
            </div>
        </AuthBrandLayout>
    );
}

// Layout sudah dibungkus AuthBrandLayout di dalam halaman.
ForgotPassword.layout = (page: React.ReactNode) => page;