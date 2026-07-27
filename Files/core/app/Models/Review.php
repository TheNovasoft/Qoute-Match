<?php

namespace App\Models;

use App\Constants\ReviewDimension;
use App\Constants\Status;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $casts = [
        'scores' => 'array',
        'moderated_at' => 'datetime',
        'is_verified' => 'integer',
        'investigation_status' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', Status::REVIEW_APPROVED);
    }

    public function scopePending($query)
    {
        return $query->where('status', Status::REVIEW_PENDING);
    }

    public function scopeHidden($query)
    {
        return $query->where('status', Status::REVIEW_HIDDEN);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', Status::YES);
    }

    public function scopeDisputed($query)
    {
        return $query->whereIn('investigation_status', [
            Status::REVIEW_INVESTIGATION_OPEN,
            Status::REVIEW_INVESTIGATION_ACTIVE,
        ]);
    }

    public function statusLabel(): string
    {
        return match ((int) $this->status) {
            Status::REVIEW_APPROVED => 'Approved',
            Status::REVIEW_HIDDEN => 'Hidden',
            default => 'Pending',
        };
    }

    public function investigationLabel(): string
    {
        return \App\Lib\StructuredReviewService::investigationLabel((int) $this->investigation_status);
    }

    public function dimensionScores(): array
    {
        $scores = is_array($this->scores) ? $this->scores : [];

        return collect(ReviewDimension::all())->mapWithKeys(function ($label, $key) use ($scores) {
            return [$key => [
                'label' => $label,
                'score' => (int) ($scores[$key] ?? 0),
            ]];
        })->all();
    }
}
