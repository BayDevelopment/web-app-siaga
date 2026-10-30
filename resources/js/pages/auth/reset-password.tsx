import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthBrandLayout from '@/layouts/auth-brand-layout';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <AuthBrandLayout
            title="Atur ulang password"
            description="Masukkan password baru untuk akun lu di bawah ini."
        >
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="block w-full bg-muted/60"
                                readOnly
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password baru</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="block w-full"
                                autoFocus
                                placeholder="Password baru"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Konfirmasi password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="block w-full"
                                placeholder="Ulangi password baru"
                                passwordrules={passwordRules}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-1 w-full bg-linear-to-r from-navy-600 to-navy-500 shadow-lg shadow-navy-600/25 transition hover:brightness-110"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Atur ulang password
                        </Button>
                    </div>
                )}
            </Form>
        </AuthBrandLayout>
    );
}

// Layout sudah dibungkus AuthBrandLayout di dalam halaman.
ResetPassword.layout = (page: React.ReactNode) => page;