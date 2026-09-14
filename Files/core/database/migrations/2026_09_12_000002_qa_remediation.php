<?php

use App\Constants\Status;
use App\Models\Charge;
use App\Models\Frontend;
use App\Models\GeneralSetting;
use App\Models\NotificationTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('subcategories') && Schema::hasColumn('subcategories', 'name')) {
            DB::statement('ALTER TABLE `subcategories` MODIFY `name` VARCHAR(191) NOT NULL');
        }

        if (Schema::hasTable('reviews') && Schema::hasColumn('reviews', 'rating')) {
            DB::statement('ALTER TABLE `reviews` MODIFY `rating` DECIMAL(4,2) NOT NULL DEFAULT 0');
        }

        if (Schema::hasTable('charges') && Charge::query()->count() === 0) {
            $tiers = [
                ['level' => 1, 'amount' => 500, 'percent' => 20],
                ['level' => 2, 'amount' => 5000, 'percent' => 15],
                ['level' => 3, 'amount' => 50000, 'percent' => 10],
                ['level' => 4, 'amount' => 999999999, 'percent' => 5],
            ];
            foreach ($tiers as $tier) {
                $charge = new Charge();
                $charge->level = $tier['level'];
                $charge->amount = $tier['amount'];
                $charge->percent = $tier['percent'];
                $charge->save();
            }
        }

        if (Schema::hasTable('general_settings')) {
            $settings = GeneralSetting::first();
            if ($settings && strtoupper((string) $settings->cur_text) === 'USD') {
                $settings->cur_text = 'GBP';
                $settings->cur_sym = '£';
                $settings->save();
            }
        }

        if (Schema::hasTable('notification_templates')) {
            NotificationTemplate::unguard();
            $digest = NotificationTemplate::firstOrNew(['act' => 'DAILY_DIGEST']);
            $digest->name = 'Daily-Digest';
            $digest->subject = 'Your {{site_name}} daily summary';
            $digest->email_status = Status::ENABLE;
            $digest->sms_status = Status::DISABLE;
            $digest->push_status = Status::DISABLE;
            $digest->in_app_status = Status::ENABLE;
            $digest->shortcodes = [
                'name' => 'Recipient name',
                'summary' => 'Digest summary text',
                'dashboard_link' => 'Link to dashboard',
            ];
            $digest->email_body = 'Hi {{name}},<br><br>{{summary}}<br><br><a href="{{dashboard_link}}">Open your dashboard</a><br><br>Thanks,<br>{{site_name}}';
            $digest->in_app_body = '{{summary}}';
            $digest->sms_body = $digest->sms_body ?: '{{summary}}';
            $digest->save();
            NotificationTemplate::reguard();
        }

        if (Schema::hasTable('frontends')) {
            $faqs = [
                [
                    'question' => 'What types of jobs can I post on QuoteMatch?',
                    'answer' => 'You can post local service requests such as building work, repairs, logistics, and professional services. Describe what you need and receive structured quotes from verified providers.',
                ],
                [
                    'question' => 'How do I compare quotes fairly?',
                    'answer' => 'Use Compare Quotes to filter by price, verification badges, and ratings. Check scope, timeline, and exclusions before you accept a provider.',
                ],
                [
                    'question' => 'Is posting a request free?',
                    'answer' => 'Customer posting is free during the MVP phase. You only pay when you accept a quote and fund escrow for the agreed work.',
                ],
                [
                    'question' => 'How are providers verified?',
                    'answer' => 'Providers can submit identity, insurance, company, and trade licence documents. Approved badges appear on their profiles and quotes.',
                ],
                [
                    'question' => 'What if something goes wrong after I hire?',
                    'answer' => 'Use in-platform messaging and milestones first. If you cannot resolve an issue, open a dispute from your project so our team can review.',
                ],
            ];

            $template = activeTemplateName();
            Frontend::query()
                ->where('tempname', $template)
                ->where('data_keys', 'faq.element')
                ->delete();

            foreach ($faqs as $item) {
                $row = new Frontend();
                $row->data_keys = 'faq.element';
                $row->tempname = $template;
                $row->data_values = [
                    'question' => $item['question'],
                    'answer' => $item['answer'],
                ];
                $row->save();
            }
        }
    }

    public function down(): void
    {
        // Data remediation — no rollback.
    }
};
