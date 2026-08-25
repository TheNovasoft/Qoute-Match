<?php

namespace App\Models;

use App\Constants\Status;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Dispute extends Model
{
    public const TYPES = [
        'quality_issue'   => 'Quality / workmanship',
        'payment_issue'   => 'Payment issue',
        'communication'   => 'Communication problem',
        'scope_mismatch'  => 'Scope mismatch',
        'no_delivery'     => 'No delivery / no-show',
        'other'           => 'Other',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function bid()
    {
        return $this->belongsTo(Bid::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(DisputeMessage::class)->orderBy('id');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', Status::DISPUTE_OPEN);
    }

    public function scopeInReview($query)
    {
        return $query->where('status', Status::DISPUTE_IN_REVIEW);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [Status::DISPUTE_OPEN, Status::DISPUTE_IN_REVIEW]);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', Status::DISPUTE_RESOLVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', Status::DISPUTE_REJECTED);
    }

    public function isActive(): bool
    {
        return in_array((int) $this->status, [Status::DISPUTE_OPEN, Status::DISPUTE_IN_REVIEW], true);
    }

    public function typeLabel(): Attribute
    {
        return new Attribute(fn () => self::TYPES[$this->type] ?? ucfirst(str_replace('_', ' ', $this->type)));
    }

    public function statusBadge(): Attribute
    {
        return new Attribute(function () {
            return match ((int) $this->status) {
                Status::DISPUTE_IN_REVIEW => '<span class="badge badge--primary">' . trans('In Review') . '</span>',
                Status::DISPUTE_RESOLVED  => '<span class="badge badge--success">' . trans('Resolved') . '</span>',
                Status::DISPUTE_REJECTED  => '<span class="badge badge--dark">' . trans('Rejected') . '</span>',
                default                   => '<span class="badge badge--warning">' . trans('Open') . '</span>',
            };
        });
    }
}
