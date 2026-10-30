<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
            'phone' => $this->phoneRules($userId),
        ];
    }

    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    protected function phoneRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'regex:/^628[0-9]{8,12}$/',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    protected function phoneMessages(): array
    {
        return [
            'phone.regex' => 'Format nomor WhatsApp tidak valid. Contoh: 081234567890.',
            'phone.unique' => 'Nomor WhatsApp ini sudah digunakan.',
        ];
    }
}