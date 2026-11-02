<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    public function rules(): array
    {
        return $this->profileRules($this->user()->id);
    }

    public function messages(): array
    {
        return $this->phoneMessages();
    }
}
