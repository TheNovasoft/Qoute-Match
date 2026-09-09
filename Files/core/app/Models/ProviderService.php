<?php

namespace App\Models;

use App\Constants\Status;
use Illuminate\Database\Eloquent\Model;

class ProviderService extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'price',
        'delivery_days',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'float',
        'status' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', Status::ENABLE);
    }
}
