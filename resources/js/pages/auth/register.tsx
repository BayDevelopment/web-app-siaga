import { Form, Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthBrandLayout from '@/layouts/auth-brand-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

type FormFieldProps = {
    id: string;
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
};

const PASSWORD_FIELDS = ['password', 'password_confirmation'];

// 08xxxxxxxxxx, 628xxxxxxxxxx, atau +628xxxxxxxxxx
const PHONE_PATTERN = '^(\\+?62|0)8[0-9]{8,12}$';

function FormField({ id, label, error, hint, children }: FormFieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

export default function Register({ passwordRules }: Props) {
    return (
        <AuthBrandLayout
            title="Buat Akun"
            description="Daftarkan diri untuk melaporkan kejadian dan membantu menjaga keamanan lingkungan."
        >
            <Head title="Buat Akun" />

            <Form
                {...store.form()}
                resetOnSuccess={PASSWORD_FIELDS}
                resetOnError={PASSWORD_FIELDS}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <FormField id="name" label="Nama Lengkap" error={errors.name}>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Masukkan nama lengkap"
                                    required
                                    autoFocus
                                />
                            </FormField>

                            <FormField id="email" label="Alamat Email" error={errors.email}>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    required
                                />
                            </FormField>

                            <FormField
                                id="phone"
                                label="Nomor WhatsApp"
                                hint="Gunakan nomor yang aktif dan dapat dihubungi."
                                error={errors.phone}
                            >
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="08xxxxxxxxxx"
                                    pattern={PHONE_PATTERN}
                                    title="Contoh: 081234567890"
                                    required
                                />
                            </FormField>

                            <FormField id="password" label="Kata Sandi" error={errors.password}>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder="Buat kata sandi"
                                    passwordrules={passwordRules}
                                    required
                                />
                            </FormField>

                            <FormField
                                id="password_confirmation"
                                label="Konfirmasi Kata Sandi"
                                error={errors.password_confirmation}
                            >
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="Ulangi kata sandi"
                                    passwordrules={passwordRules}
                                    required
                                />
                            </FormField>

                            <Button
                                type="submit"
                                className="mt-1 w-full bg-linear-to-r from-navy-600 to-navy-500 shadow-lg shadow-navy-600/25 transition hover:brightness-110"
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {processing ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Sudah memiliki akun?{' '}
                            <TextLink href={login()}>Masuk</TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthBrandLayout>
    );
}

Register.layout = (page: ReactNode) => page;