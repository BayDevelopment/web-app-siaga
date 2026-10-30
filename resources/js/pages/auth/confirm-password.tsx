import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthBrandLayout from '@/layouts/auth-brand-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthBrandLayout
            title="Konfirmasi password"
            description="Ini area yang aman. Konfirmasi password lu dulu sebelum melanjutkan."
        >
            <Head title="Konfirmasi password" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={errors.password} />
                        </div>

                        <Button
                            className="mt-1 w-full bg-linear-to-r from-navy-600 to-navy-500 shadow-lg shadow-navy-600/25 transition hover:brightness-110"
                            disabled={processing}
                            data-test="confirm-password-button"
                        >
                            {processing && <Spinner />}
                            Konfirmasi password
                        </Button>
                    </div>
                )}
            </Form>
        </AuthBrandLayout>
    );
}

// Layout sudah dibungkus AuthBrandLayout di dalam halaman.
ConfirmPassword.layout = (page: React.ReactNode) => page;