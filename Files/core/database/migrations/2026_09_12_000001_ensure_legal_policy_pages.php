<?php

use App\Models\Frontend;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('frontends')) {
            return;
        }

        $templateName = activeTemplateName();

        foreach ($this->policies() as $policy) {
            $row = Frontend::query()
                ->where('data_keys', 'policy_pages.element')
                ->where('tempname', $templateName)
                ->where('slug', $policy['slug'])
                ->first() ?? new Frontend();

            $row->data_keys = 'policy_pages.element';
            $row->tempname = $templateName;
            $row->slug = $policy['slug'];
            $row->data_values = [
                'title' => $policy['title'],
                'details' => $policy['details'],
            ];

            if (! $row->seo_content) {
                $plain = strip_tags($policy['details']);
                $row->seo_content = [
                    'description' => Str::limit($plain, 160, ''),
                    'keywords' => [],
                    'social_title' => $policy['title'],
                    'social_description' => Str::limit($plain, 160, ''),
                ];
            }

            $row->save();
        }
    }

    public function down(): void
    {
        // Legal content is data, not schema — leave rows in place on rollback.
    }

    /**
     * @return list<array{slug: string, title: string, details: string}>
     */
    private function policies(): array
    {
        return [
            [
                'slug' => 'customer-terms',
                'title' => 'Customer Terms',
                'details' => '<h4>Using QuoteMatch as a customer</h4>
<p>By posting a requirement or accepting a quote on QuoteMatch, you agree to provide accurate information and communicate respectfully with providers.</p>
<h4>Posting requirements</h4>
<p>Customer posting is free during the MVP phase. You are responsible for the accuracy of project details, uploads, and contact information.</p>
<h4>Quotes and acceptance</h4>
<p>Quotes are submitted by independent providers. QuoteMatch facilitates comparison and messaging but does not guarantee provider performance unless expressly stated.</p>
<h4>Reviews and disputes</h4>
<p>Reviews should reflect genuine experiences after accepted work. Report misleading quotes, abuse, or safety concerns through the platform dispute process.</p>',
            ],
            [
                'slug' => 'provider-terms',
                'title' => 'Provider Terms',
                'details' => '<h4>Using QuoteMatch as a provider</h4>
<p>Providers must supply accurate business details, maintain professional communication, and submit honest structured quotes.</p>
<h4>Profile and verification</h4>
<p>You agree to keep your profile, categories, service areas, and verification documents up to date. Admin approval may be required before you receive matching leads.</p>
<h4>Quotes and messaging</h4>
<p>Quotes must clearly state pricing, scope, exclusions, and validity where applicable. Do not share prohibited contact details in messages before platform rules allow it.</p>
<h4>Lead credits and subscriptions</h4>
<p>If monetisation is enabled by the platform operator, paid lead credits or subscriptions will be clearly labelled before purchase.</p>
<h4>Suspension</h4>
<p>QuoteMatch may suspend accounts that submit fraudulent quotes, harass users, or breach these terms.</p>',
            ],
        ];
    }
};
