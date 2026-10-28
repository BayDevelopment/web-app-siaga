<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class UpdateReportRequest extends StoreReportRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('report'));
    }

    public function rules(): array
    {
        return [
            ...parent::rules(),

            'delete_photo_ids'   => ['nullable', 'array'],
            'delete_photo_ids.*' => ['integer'],
        ];
    }

    /** Total foto (lama - dihapus + baru) tidak boleh lebih dari 5. */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $report = $this->route('report');

                $existing = $report->photos()->count();
                $removed  = count($this->input('delete_photo_ids', []));
                $added    = count($this->file('photos', []));

                if ($existing - $removed + $added > 5) {
                    $validator->errors()->add('photos', 'Maksimal 5 foto per laporan.');
                }
            },
        ];
    }
}