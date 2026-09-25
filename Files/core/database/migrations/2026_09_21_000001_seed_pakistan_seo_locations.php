<?php

use App\Constants\Status;
use App\Models\SeoLocation;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('seo_locations')) {
            return;
        }

        SeoLocation::query()->update(['status' => Status::NO]);

        $locations = [
            ['name' => 'Karachi', 'region' => 'Sindh'],
            ['name' => 'Lahore', 'region' => 'Punjab'],
            ['name' => 'Islamabad', 'region' => 'Islamabad Capital Territory'],
            ['name' => 'Rawalpindi', 'region' => 'Punjab'],
            ['name' => 'Faisalabad', 'region' => 'Punjab'],
            ['name' => 'Multan', 'region' => 'Punjab'],
            ['name' => 'Peshawar', 'region' => 'Khyber Pakhtunkhwa'],
            ['name' => 'Quetta', 'region' => 'Balochistan'],
            ['name' => 'Hyderabad', 'region' => 'Sindh'],
            ['name' => 'Sialkot', 'region' => 'Punjab'],
        ];

        foreach ($locations as $item) {
            $slug = Str::slug($item['name']);
            $name = $item['name'];

            $row = SeoLocation::where('slug', $slug)->first() ?? new SeoLocation();
            $row->name = $name;
            $row->slug = $slug;
            $row->region = $item['region'];
            $row->seo_title = "Compare Service Quotes in {$name} | QuoteMatch";
            $row->seo_description = "Find verified builders, tradespeople, and service providers in {$name}, Pakistan. Post free and compare quotes.";
            $row->intro = "Post your requirement in {$name} and compare quotes from verified local providers across Pakistan.";
            $row->is_featured = Status::YES;
            $row->status = Status::YES;
            $row->save();
        }
    }

    public function down(): void
    {
        // Data seed — no rollback.
    }
};
