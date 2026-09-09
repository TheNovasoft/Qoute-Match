<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;
use App\Constants\Status;
use Illuminate\Database\Eloquent\Casts\Attribute;


class Bid extends Model
{
    protected $casts = [
        'quote_data' => 'array',
        'revision_requested_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function task()
    {
        return $this->hasOne(TrialTask::class, 'bid_id');
    }

    public function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }
    public function project()
    {
        return $this->belongsTo(Project::class);
    }


    public function statusBadge(): Attribute
    {
        return new Attribute(function () {
            $html = '';
            if ($this->status == Status::BID_PENDING) {
                $html = '<span class="badge badge--warning">' . trans("Pending") . '</span>';
            } elseif ($this->status == Status::BID_ACCEPTED) {
                $html = '<span class="badge badge--success">' . trans("Hired") . '</span>';
            } elseif ($this->status == Status::BID_REJECTED) {
                $html = '<span class="badge badge--danger">' . trans("Rejected") . '</span>';
            } elseif ($this->status == Status::BID_WITHDRAW) {
                $html = '<span class="badge badge--dark">' . trans("Withdrawn") . '</span>';
            } elseif ($this->status == Status::BID_COMPLETED) {
                $html = '<span class="badge badge--primary">' . trans("Done") . '</span>';
            }
            return $html;
        });
    }


    public function scopePending($query)
    {
        return $query->where('status', Status::BID_PENDING);
    }
    public function scopeAccepted($query)
    {
        return $query->where('status', Status::BID_ACCEPTED);
    }
    public function scopeRejected($query)
    {
        return $query->where('status', Status::BID_REJECTED);
    }
    public function scopeWithdrawn($query)
    {
        return $query->where('status', Status::BID_WITHDRAW);
    }
    public function scopeCompleted($query)
    {
        return $query->where('status', Status::BID_COMPLETED);
    }
}
