<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuyerSavedPaymentMethod extends Model
{
    protected $fillable = [
        'buyer_id',
        'method_code',
        'currency',
        'label',
        'is_default',
        'last_used_at',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    public function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }
}
