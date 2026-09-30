<?php

namespace App\Notify;

use App\Lib\NotificationSendTracker;
use App\Notify\NotifyProcess;
use App\Notify\Notifiable;
use Illuminate\Support\Facades\Log;
use Mailjet\Client;
use Mailjet\Resources;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use SendGrid;
use SendGrid\Mail\Mail;

class Email extends NotifyProcess implements Notifiable{

    /**
    * Email of receiver
    *
    * @var string
    */
	public $email;

    /**
    * Assign value to properties
    *
    * @return void
    */
	public function __construct(){
		$this->statusField = 'email_status';
		$this->body = 'email_body';
		$this->globalTemplate = 'email_template';
		$this->notifyConfig = 'mail_config';
	}

    /**
    * Send notification
    *
    * @return void|bool
    */
	public function send(){

		if (!gs('en')) {
			NotificationSendTracker::recordFailure('Email notifications are disabled in settings.');

			return false;
		}
		//get message from parent
		$message = $this->getMessage();
		if (! $message) {
			NotificationSendTracker::recordFailure('Email template is missing or disabled.');

			return false;
		}

		$config = gs('mail_config');
		$methodName = $config->name ?? 'php';
		$method = $this->mailMethods($methodName);
		if ($method === null) {
			NotificationSendTracker::recordFailure('Unknown mail configuration.');

			return false;
		}

		try {
			$this->$method();
			$this->createLog('email');

			return true;
		} catch (\Exception $e) {
			$this->createErrorLog($e->getMessage());
			session()->flash('mail_error', $e->getMessage());

			return false;
		}
	}

    /**
    * Get the method name
    *
    * @return string
    */
	protected function mailMethods($name){
		$methods = [
			'php'=>'sendPhpMail',
			'smtp'=>'sendSmtpMail',
			'sendgrid'=>'sendSendGridMail',
			'mailjet'=>'sendMailjetMail',
			'log'=>'sendLogMail',
		];

		return $methods[$name] ?? null;
	}

	protected function sendLogMail(): void
	{
		$path = storage_path('logs/outgoing-mail.log');
		$entry = sprintf(
			"[%s] TO: %s <%s>\nSUBJECT: %s\n%s\n---\n",
			now()->toDateTimeString(),
			$this->receiverName,
			$this->email,
			$this->subject,
			strip_tags((string) $this->finalMessage)
		);
		file_put_contents($path, $entry, FILE_APPEND | LOCK_EX);
		Log::info('Email captured locally (no SMTP)', [
			'to' => $this->email,
			'subject' => $this->subject,
		]);
	}

	protected function sendPhpMail(){
        $sentFromName = $this->getEmailFrom()['name'];
        $sentFromEmail = $this->getEmailFrom()['email'];
		$headers = "From: $sentFromName <$sentFromEmail> \r\n";
	    $headers .= "Reply-To: $sentFromName <$sentFromEmail> \r\n";
	    $headers .= "MIME-Version: 1.0\r\n";
	    $headers .= "Content-Type: text/html; charset=utf-8\r\n";
	    @mail($this->email, $this->subject, $this->finalMessage, $headers);
	}

	protected function sendSmtpMail(){
		$mail = new PHPMailer(true);
		$config = gs('mail_config');
        //Server settings
        $mail->isSMTP();
        $mail->Host       = $config->host;
        $mail->SMTPAuth   = !empty($config->username);
        $mail->Username   = $config->username ?? '';
        $mail->Password   = $config->password ?? '';
        if ($config->enc == 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        }elseif ($config->enc == 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPAutoTLS = false;
            $mail->SMTPSecure = false;
        }
        $mail->Port       = $config->port;
        $mail->CharSet = 'UTF-8';
        //Recipients
        $mail->setFrom($this->getEmailFrom()['email'], $this->getEmailFrom()['name']);
        $mail->addAddress($this->email, $this->receiverName);
        $mail->addReplyTo($this->getEmailFrom()['email'], $this->getEmailFrom()['name']);
        // Content
        $mail->isHTML(true);
        $mail->Subject = $this->subject;
        $mail->Body    = $this->finalMessage;
        $mail->send();

        // If we only hit local Mailpit, also mirror to a real inbox (HTTP relay / SMTP).
        $this->relayToExternalSmtpIfNeeded();
	}

    /**
     * When local Mailpit is the active mailer, also deliver to the real recipient inbox.
     * Prefer MAIL_RELAY_URL (Gmail Apps Script / noreply HTTP relay), then MAIL_PASSWORD SMTP.
     */
    protected function relayToExternalSmtpIfNeeded(): void
    {
        $config = gs('mail_config');
        $host = strtolower((string) ($config->host ?? ''));
        if (! in_array($host, ['127.0.0.1', 'localhost'], true)) {
            return;
        }

        if ($this->relayViaHttpMailRelay()) {
            return;
        }

        $username = trim((string) env('MAIL_USERNAME', ''));
        $password = trim((string) env('MAIL_PASSWORD', ''));
        if ($username === '' || $password === '') {
            Log::warning('Guest/system email stayed on local SMTP — set MAIL_RELAY_URL or MAIL_PASSWORD for real inbox delivery', [
                'to' => $this->email,
                'subject' => $this->subject,
            ]);

            return;
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = env('MAIL_HOST', 'smtp.gmail.com');
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $password;
        $encryption = env('MAIL_ENCRYPTION', 'tls');
        if ($encryption === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }
        $mail->Port = (int) env('MAIL_PORT', 587);
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($this->getEmailFrom()['email'], $this->getEmailFrom()['name']);
        $mail->addAddress($this->email, $this->receiverName);
        $mail->addReplyTo($this->getEmailFrom()['email'], $this->getEmailFrom()['name']);
        $mail->isHTML(true);
        $mail->Subject = $this->subject;
        $mail->Body = $this->finalMessage;
        $mail->send();
    }

    /**
     * Free/dummy real-inbox delivery via HTTP mail relay (e.g. Gmail Apps Script web app).
     */
    protected function relayViaHttpMailRelay(): bool
    {
        $relayUrl = trim((string) env('MAIL_RELAY_URL', ''));
        if ($relayUrl === '') {
            return false;
        }

        $from = $this->getEmailFrom();
        $payload = [
            'secret' => (string) env('MAIL_RELAY_SECRET', ''),
            'to' => $this->email,
            'subject' => $this->subject,
            'html' => $this->finalMessage,
            'fromName' => $from['name'] ?: 'QuoteMatch',
            'fromEmail' => $from['email'] ?: 'noreply@quotematch.app',
            'replyTo' => $from['email'] ?: 'noreply@quotematch.app',
        ];

        $ch = curl_init($relayUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 45,
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        $decoded = is_string($body) ? json_decode($body, true) : null;
        $ok = $code >= 200 && $code < 300 && is_array($decoded) && (($decoded['ok'] ?? false) === true);

        if (! $ok) {
            Log::warning('HTTP mail relay failed', [
                'to' => $this->email,
                'subject' => $this->subject,
                'http' => $code,
                'error' => $err,
                'body' => is_string($body) ? substr($body, 0, 500) : null,
            ]);

            return false;
        }

        Log::info('Email delivered via HTTP mail relay (noreply)', [
            'to' => $this->email,
            'subject' => $this->subject,
        ]);

        return true;
    }

	protected function sendSendGridMail(){
		$sendgridMail = new Mail();
	    $sendgridMail->setFrom($this->getEmailFrom()['email'], $this->getEmailFrom()['name']);
	    $sendgridMail->setSubject($this->subject);
	    $sendgridMail->addTo($this->email, $this->receiverName);
	    $sendgridMail->addContent("text/html", $this->finalMessage);
	    $sendgrid = new SendGrid(gs('mail_config')->appkey);
	    $response = $sendgrid->send($sendgridMail);
	    if($response->statusCode() != 202){
	    	throw new Exception(json_decode($response->body())->errors[0]->message);

	    }
	}

	protected function sendMailjetMail()
	{
	    $mj = new Client(gs('mail_config')->public_key, gs('mail_config')->secret_key, true, ['version' => 'v3.1']);
	    $body = [
	        'Messages' => [
	            [
	                'From' => [
	                    'Email' => $this->getEmailFrom()['email'],
	                    'Name' => $this->getEmailFrom()['name'],
	                ],
	                'To' => [
	                    [
	                        'Email' => $this->email,
	                        'Name' => $this->receiverName,
	                    ]
	                ],
	                'Subject' => $this->subject,
	                'TextPart' => "",
	                'HTMLPart' => $this->finalMessage,
	            ]
	        ]
	    ];
	    $response = $mj->post(Resources::$Email, ['body' => $body]);
	}

    /**
    * Configure some properties
    *
    * @return void
    */
	public function prevConfiguration(){
		if ($this->user) {
			$this->email = $this->user->email;
			$this->receiverName = $this->user->fullname;
		}
		$this->toAddress = $this->email;
	}

    private function getEmailFrom(){
        $envFrom = trim((string) env('MAIL_FROM_ADDRESS', ''));
        $envName = trim((string) env('MAIL_FROM_NAME', ''));

        // Prefer explicit noreply branding from env / site settings.
        $candidates = array_filter([
            $envFrom,
            $this->template->email_sent_from_address ?? null,
            gs('email_from'),
            'noreply@quotematch.app',
        ], fn ($v) => is_string($v) && trim($v) !== '');

        $address = 'noreply@quotematch.app';
        foreach ($candidates as $candidate) {
            $candidate = trim($candidate);
            if (str_contains(strtolower($candidate), 'noreply')) {
                $address = $candidate;
                break;
            }
        }

        $name = $envName
            ?: ($this->template->email_sent_from_name ?? null)
            ?: gs('email_from_name')
            ?: gs('site_name')
            ?: 'QuoteMatch';

        $this->sentFrom = $address;

        return [
            'email' => $address,
            'name' => $this->replaceTemplateShortCode($name),
        ];
    }
}
