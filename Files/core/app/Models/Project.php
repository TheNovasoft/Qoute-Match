<?php

namespace App\Models;

use App\Constants\Status;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Project extends Model
{
    protected $fillable = [
        'job_id',
        'user_id',
        'status',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }
    public function bid()
    {
        return $this->belongsTo(Bid::class);
    }


    public function review()
    {
        return $this->hasOne(Review::class);
    }
    public function buyerReview()
    {
        return $this->hasOne(BuyerReview::class);
    }

    public function milestones()
    {
        return $this->hasMany(ProjectMilestone::class)->orderBy('sort_order');
    }

    public function statusBadge(): Attribute
    {
        return new Attribute(function () {
            $html = '';
            if ($this->status == Status::PROJECT_RUNNING) {
                $html = '<span class="badge badge--info">' . trans('Running') . '</span>';
            } elseif ($this->status == Status::PROJECT_COMPLETED) {
                $html = '<span><span class="badge badge--success">' . trans('Completed') . '</span><br>' . diffForHumans($this->updated_at) . '</span>';
            } elseif ($this->status == Status::PROJECT_BUYER_REVIEW) {
                $html = '<span class="badge badge--primary">' . trans('Reviewing') . '</span>';
            } elseif ($this->status == Status::PROJECT_REPORTED) {
                $html = '<span class="badge badge--success">' . trans('Reported') . '</span>';
            } elseif ($this->status == Status::PROJECT_PARTIAL_COMPLETED) {
                $html = '<span class="badge badge--warning">' . trans('Partial') . '</span>';
            } else {
                $html = '<span class="badge badge--danger">' . trans('Rejected') . '</span>';
            }
            return $html;
        });
    }


    public function scopeRunning($query)
    {
        return $query->where('status', Status::PROJECT_RUNNING);
    }
    public function scopeCompleted($query)
    {
        return $query->where('status', Status::PROJECT_COMPLETED);
    }
    public function scopeReviewing($query)
    {
        return $query->where('status', Status::PROJECT_BUYER_REVIEW);
    }
    public function scopeReported($query)
    {
        return $query->where('status', Status::PROJECT_REPORTED);
    }
    public function scopeRejected($query)
    {
        return $query->where('status', Status::PROJECT_REJECTED);
    }
    public function scopePartial($query)
    {
        return $query->where('status', Status::PROJECT_PARTIAL_COMPLETED);
    }
}
