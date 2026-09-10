<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('jobs')) {
            Schema::table('jobs', function (Blueprint $table) {
                if (! Schema::hasColumn('jobs', 'view_count')) {
                    $table->unsignedInteger('view_count')->default(0)->after('status');
                }
                if (! Schema::hasColumn('jobs', 'quote_validity_days')) {
                    $table->unsignedSmallInteger('quote_validity_days')->nullable()->after('deadline');
                }
            });
        }

        if (Schema::hasTable('bids')) {
            Schema::table('bids', function (Blueprint $table) {
                if (! Schema::hasColumn('bids', 'expires_at')) {
                    $table->timestamp('expires_at')->nullable()->after('status');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'last_seen_at')) {
                    $table->timestamp('last_seen_at')->nullable()->after('updated_at');
                }
                if (! Schema::hasColumn('users', 'availability_status')) {
                    $table->unsignedTinyInteger('availability_status')->default(1)->after('last_seen_at');
                }
            });
        }

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
        } else {
            Schema::table('provider_services', function (Blueprint $table) {
                if (! Schema::hasColumn('provider_services', 'sort_order')) {
                    $table->unsignedSmallInteger('sort_order')->default(0)->after('status');
                }
                if (! Schema::hasColumn('provider_services', 'delivery_days')) {
                    $table->unsignedSmallInteger('delivery_days')->default(7)->after('price');
                }
            });
        }

        if (! Schema::hasTable('buyer_saved_payment_methods')) {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('buyer_saved_payment_methods');
        Schema::dropIfExists('provider_services');

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'availability_status')) {
                    $table->dropColumn('availability_status');
                }
                if (Schema::hasColumn('users', 'last_seen_at')) {
                    $table->dropColumn('last_seen_at');
                }
            });
        }

        if (Schema::hasTable('bids')) {
            Schema::table('bids', function (Blueprint $table) {
                if (Schema::hasColumn('bids', 'expires_at')) {
                    $table->dropColumn('expires_at');
                }
            });
        }

        if (Schema::hasTable('jobs')) {
            Schema::table('jobs', function (Blueprint $table) {
                if (Schema::hasColumn('jobs', 'quote_validity_days')) {
                    $table->dropColumn('quote_validity_days');
                }
                if (Schema::hasColumn('jobs', 'view_count')) {
                    $table->dropColumn('view_count');
                }
            });
        }
    }
};
