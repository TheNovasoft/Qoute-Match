<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisputeMessage extends Model
{
    protected $fillable = [
        'dispute_id',
        'author_type',
        'author_id',
        'message',
        'attachment',
    ];

    public function dispute()
    {
        return $this->belongsTo(Dispute::class);
    }
}
