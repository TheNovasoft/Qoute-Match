<?php

namespace App\Models;

use App\Constants\Status;
use App\Traits\GlobalStatus;
use App\Traits\UserNotify;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, UserNotify, GlobalStatus;

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'ver_code',
        'balance',
        'kyc_data',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'kyc_data'          => 'object',
        'ver_code_send_at'  => 'datetime',
        'last_seen_at'      => 'datetime',
        'language'          => 'object',
        'skill_ids'         => 'array',
        'subcategory_ids'   => 'array',
        'provider_approved' => 'boolean',
    ];
    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function loginLogs()
    {
        return $this->hasMany(UserLogin::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class)->orderBy('id', 'desc');
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class)->where('status', '!=', Status::PAYMENT_INITIATE);
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class)->where('status', '!=', Status::PAYMENT_INITIATE);
    }

    public function tickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function educations()
    {
        return $this->hasMany(Education::class);
    }
    public function portfolios()
    {
        return $this->hasMany(Portfolio::class);
    }

    public function providerServices()
    {
        return $this->hasMany(ProviderService::class)->orderBy('sort_order');
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'skill_user', 'user_id', 'skill_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->where('status', Status::REVIEW_APPROVED);
    }

    public function fullname(): Attribute
    {
        return new Attribute(
            get: fn() => $this->firstname . ' ' . $this->lastname,
        );
    }

    public function mobileNumber(): Attribute
    {
        return new Attribute(
            get: fn() => $this->dial_code . $this->mobile,
        );
    }

    // SCOPES
    public function scopeActive($query)
    {
        return $query->where('status', Status::USER_ACTIVE)->where('ev', Status::VERIFIED)->where('sv', Status::VERIFIED)->where('work_profile_complete', Status::YES);
    }

    public function scopePublicProfile($query)
    {
        return $query->where('status', Status::USER_ACTIVE)->where('provider_approved', true);
    }
    public function scopeBanned($query)
    {
        return $query->where('status', Status::USER_BAN);
    }
    public function scopeIncompleteProfile($query)
    {
        return $query->where('work_profile_complete', Status::NO);
    }

    public function scopePendingProviderApproval($query)
    {
        return $query->where('provider_approved', false);
    }

    public function scopeEmailUnverified($query)
    {
        return $query->where('ev', Status::UNVERIFIED);
    }

    public function scopeMobileUnverified($query)
    {
        return $query->where('sv', Status::UNVERIFIED);
    }

    public function scopeKycUnverified($query)
    {
        return $query->where('kv', Status::KYC_UNVERIFIED);
    }

    public function scopeKycPending($query)
    {
        return $query->where('kv', Status::KYC_PENDING);
    }

    public function scopeEmailVerified($query)
    {
        return $query->where('ev', Status::VERIFIED);
    }

    public function scopeMobileVerified($query)
    {
        return $query->where('sv', Status::VERIFIED);
    }

    public function scopeWithBalance($query)
    {
        return $query->where('balance', '>', 0);
    }

    public function deviceTokens()
    {
        return $this->hasMany(DeviceToken::class);
    }


    public function updateBadge()
    {
        $badge = BadgeSetting::where('min_amount', '<=', $this->earning)->orderBy('min_amount', 'desc')->first();
        if ($badge && $badge->id != $this->badge_setting_id) {
            $this->badge_setting_id = $badge->id;
            $this->save();
        }
    }
    
    public function badge()
    {
        return $this->belongsTo(BadgeSetting::class, 'badge_setting_id');
    }

    public function providerVerifications()
    {
        return $this->hasMany(ProviderVerification::class);
    }

    public function providerSubscriptions()
    {
        return $this->hasMany(ProviderSubscription::class);
    }

    public function leadCreditLogs()
    {
        return $this->hasMany(LeadCreditLog::class);
    }

}
