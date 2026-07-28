<?php

/**
 * Update global email shell + support reply body to QuoteMatch Apple design.
 * Run: php scripts/update-apple-email-template.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$emailTemplate = <<<'HTML'
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{site_name}}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background: #f5f5f7; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; border-spacing: 0; }
    img { border: 0; display: block; max-width: 100%; }
    a { color: #0071e3; text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #d2d2d7;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 12px 32px;border-bottom:1px solid #d2d2d7;">
              <a href="{{site_url}}" style="display:inline-block;">
                <img src="{{site_logo}}" alt="{{site_name}}" height="36" style="height:36px;width:auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.25;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">
                Hello {{fullname}}
              </h1>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.4;color:#6e6e73;">@{{username}}</p>
              <div style="font-size:16px;line-height:1.55;color:#1d1d1f;">
                {{message}}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f5f5f7;border-top:1px solid #d2d2d7;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#6e6e73;text-align:center;">
                &copy; {{site_name}}. This is an automated message — please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

// Keep {{username}} as a shortcode — above used @{{username}} to avoid blade; strip the escape for DB
$emailTemplate = str_replace('@{{username}}', '{{username}}', $emailTemplate);

$supportBody = <<<'HTML'
<p style="margin:0 0 16px 0;color:#6e6e73;">We replied to your support ticket.</p>
<p style="margin:0 0 8px 0;"><strong style="color:#1d1d1f;">Ticket:</strong> #{{ticket_id}}</p>
<p style="margin:0 0 16px 0;"><strong style="color:#1d1d1f;">Subject:</strong> {{ticket_subject}}</p>
<div style="margin:0 0 24px 0;padding:16px 18px;background:#f5f5f7;border:1px solid #d2d2d7;border-radius:14px;color:#1d1d1f;white-space:pre-wrap;">{{reply}}</div>
<p style="margin:0;">
  <a href="{{link}}" style="display:inline-block;padding:12px 22px;background:#0071e3;color:#ffffff;border-radius:980px;font-size:14px;font-weight:500;text-decoration:none;">
    View Ticket
  </a>
</p>
HTML;

DB::table('general_settings')->where('id', 1)->update([
    'email_template' => $emailTemplate,
]);

$updated = DB::table('notification_templates')
    ->where('act', 'ADMIN_SUPPORT_REPLY')
    ->update([
        'email_body' => $supportBody,
        'subject' => 'Re: {{ticket_subject}} — Ticket #{{ticket_id}}',
        'email_sent_from_name' => '{{site_name}} Support',
    ]);

Cache::forget('GeneralSetting');
echo "Global email template updated.\n";
echo "ADMIN_SUPPORT_REPLY updated rows: {$updated}\n";
echo "has_0071e3=" . (str_contains((string) DB::table('general_settings')->where('id', 1)->value('email_template'), '#0071e3') ? 'yes' : 'no') . "\n";
