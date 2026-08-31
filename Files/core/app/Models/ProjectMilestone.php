<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectMilestone extends Model
{
    public const STATUS_PENDING = 0;
    public const STATUS_SUBMITTED = 1;
    public const STATUS_APPROVED = 2;
    public const STATUS_PAID = 3;

    protected $fillable = [
        'project_id',
        'title',
        'amount',
        'status',
        'sort_order',
        'notes',
        'approved_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'approved_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
