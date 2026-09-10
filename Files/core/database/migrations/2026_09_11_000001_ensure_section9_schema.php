<?php

use App\Constants\Status;
use App\Lib\QuoteExpiryService;
use App\Models\Bid;
use App\Models\Job;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Idempotent Section 9 schema repair for any server state (fresh, partial, or already migrated).
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->ensureJobColumns();
        $this->ensureBidColumns();
        $this->ensureUserColumns();
        $this->ensureProviderServicesTable();
        $this->ensureBuyerSavedPaymentMethodsTable();
        $this->backfillPendingBidExpiry();
    }

    public function down(): void
    {
        // Intentionally empty — prior migrations own rollback.
    }

    protected function ensureJobColumns(): void
    {
        if (! Schema::hasTable('jobs')) {
            return;
        }

        Schema::table('jobs', function (Blueprint $table) {
            if (! Schema::hasColumn('jobs', 'view_count')) {
                $table->unsignedInteger('view_count')->default(0);
            }
            if (! Schema::hasColumn('jobs', 'quote_validity_days')) {
                $table->unsignedSmallInteger('quote_validity_days')->nullable()->after('deadline');
            }
        });
    }

    protected function ensureBidColumns(): void
    {
        if (! Schema::hasTable('bids')) {
            return;
        }

        Schema::table('bids', function (Blueprint $table) {
            if (! Schema::hasColumn('bids', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('status');
            }
        });
    }

    protected function ensureUserColumns(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'last_seen_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('last_seen_at')->nullable()->after('updated_at');
            });
        }

        if (! Schema::hasColumn('users', 'availability_status')) {
            Schema::table('users', function (Blueprint $table) {
                $after = Schema::hasColumn('users', 'last_seen_at') ? 'last_seen_at' : 'updated_at';
                $table->unsignedTinyInteger('availability_status')->default(1)->after($after);
            });
        }
    }

    protected function ensureProviderServicesTable(): void
    {
        if (! Schema::hasTable('provider_services')) {
            Schema::create('provider_services', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('title');
                $table->text('description')->nullable();
                $table->decimal('price', 28, 8)->default(0);
                $table->unsignedSmallInteger('delivery_days')->default(7);
                $table->unsignedTinyInteger('status')->default(1);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['user_id', 'status']);
            });

            return;
        }

        if (! Schema::hasColumn('provider_services', 'delivery_days')) {
            Schema::table('provider_services', function (Blueprint $table) {
                $table->unsignedSmallInteger('delivery_days')->default(7)->after('price');
            });
        }

        if (! Schema::hasColumn('provider_services', 'sort_order')) {
            Schema::table('provider_services', function (Blueprint $table) {
                $table->unsignedSmallInteger('sort_order')->default(0)->after('status');
            });
        }
    }

    protected function ensureBuyerSavedPaymentMethodsTable(): void
    {
        if (Schema::hasTable('buyer_saved_payment_methods')) {
            return;
        }

        Schema::create('buyer_saved_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('buyer_id');
            $table->unsignedInteger('method_code');
            $table->string('currency', 40);
            $table->string('label');
            $table->boolean('is_default')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['buyer_id', 'method_code', 'currency'], 'buyer_payment_method_unique');
            $table->index('buyer_id');
        });
    }

    protected function backfillPendingBidExpiry(): void
    {
        if (! Schema::hasTable('bids') || ! Schema::hasColumn('bids', 'expires_at')) {
            return;
        }

        Bid::query()
            ->where('status', Status::BID_PENDING)
            ->whereNull('expires_at')
            ->with('job')
            ->chunkById(100, function ($bids) {
                foreach ($bids as $bid) {
                    $job = $bid->job;
                    if (! $job instanceof Job) {
                        $bid->expires_at = now()->addDays(QuoteExpiryService::DEFAULT_VALIDITY_DAYS);
                    } else {
                        $bid->expires_at = QuoteExpiryService::expiresAtForNewBid($job);
                    }
                    $bid->saveQuietly();
                }
            });
    }
};
