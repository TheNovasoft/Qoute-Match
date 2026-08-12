<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    public const TYPE_JOB_PUBLISHED = 'job_published';
    public const TYPE_PROJECT_ACCEPTED = 'project_accepted';
    public const TYPE_PROJECT_COMPLETED = 'project_completed';
    public const TYPE_PROJECT_PARTIAL = 'project_partial';

    protected $casts = [
        'amount' => 'float',
        'charge_amount' => 'float',
        'net_amount' => 'float',
        'meta' => 'array',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Buyer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
