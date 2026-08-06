<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedSearch extends Model
{
    protected $fillable = [
        'buyer_id',
        'type',
        'name',
        'filters',
    ];

    protected $casts = [
        'filters' => 'array',
    ];

    public function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }

    public function targetUrl(): string
    {
        $filters = array_filter((array) $this->filters, fn ($value) => $value !== null && $value !== '');

        if ($this->type === 'jobs') {
            return route('freelance.jobs', $filters);
        }

        return route('all.freelancers', $filters);
    }
}
