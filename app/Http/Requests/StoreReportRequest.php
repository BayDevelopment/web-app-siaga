<?php

namespace App\Http\Requests;

use App\Models\Report;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    /**
     * Warga (guest) boleh melapor tanpa login.
     * Spam dibatasi throttle:laporan di route dan honeypot di controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Data pelapor tanpa akun (diabaikan jika sudah login).
            'reporter_name'  => ['nullable', 'string', 'max:100'],
            'reporter_phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],

            'disaster_type_id' => [
                'required', 'integer',
                Rule::exists('disaster_types', 'id')->where('is_active', true),
            ],
            'area_id' => [
                'required', 'integer',
                Rule::exists('areas', 'id')->where('is_active', true),
            ],

            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],

            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'address'   => ['nullable', 'string', 'max:1000'],

            'severity'    => ['required', Rule::in(Report::SEVERITIES)],
            'occurred_at' => ['required', 'date', 'before_or_equal:now'],

            'photos'   => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }

    public function attributes(): array
    {
        return [
            'reporter_name'    => 'nama pelapor',
            'reporter_phone'   => 'nomor HP',
            'disaster_type_id' => 'jenis kejadian',
            'area_id'          => 'wilayah',
            'title'            => 'judul',
            'description'      => 'deskripsi',
            'address'          => 'alamat',
            'severity'         => 'tingkat keparahan',
            'occurred_at'      => 'waktu kejadian',
            'photos'           => 'foto',
            'photos.*'         => 'foto',
        ];
    }

    public function messages(): array
    {
        return [
            'reporter_phone.regex'        => 'Nomor HP hanya boleh berisi angka, spasi, dan tanda + - ( ).',
            'occurred_at.before_or_equal' => 'Waktu kejadian tidak boleh di masa depan.',
            'photos.max'                  => 'Maksimal 5 foto per laporan.',
            'photos.*.max'                => 'Ukuran tiap foto maksimal 4 MB.',
            'photos.*.image'              => 'File harus berupa gambar.',
            'photos.*.mimes'              => 'Format foto harus jpg, jpeg, png, atau webp.',
        ];
    }
}