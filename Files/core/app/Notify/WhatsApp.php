<?php

namespace App\Notify;

class WhatsApp extends NotifyProcess implements Notifiable
{
    public $mobile;

    public function __construct()
    {
        $this->statusField = 'whatsapp_status';
        $this->body = 'whatsapp_body';
        $this->globalTemplate = 'whatsapp_template';
        $this->notifyConfig = 'whatsapp_config';
    }

    public function send()
    {
        if (!gs('wn')) {
            return false;
        }

        $message = $this->getMessage();
        if (!$message) {
            return false;
        }

        $config = gs('whatsapp_config');
        $provider = is_object($config) ? ($config->name ?? 'disabled') : 'disabled';

        // Future channel: Meta Cloud API / Twilio WhatsApp will plug in here.
        if ($provider === 'disabled' || !$this->mobile) {
            return false;
        }

        try {
            $gateway = new WhatsAppGateway();
            $gateway->to = $this->mobile;
            $gateway->message = notificationPlainText($message);
            $gateway->config = $config;
            $gateway->send();
            $this->createLog('whatsapp');
        } catch (\Exception $e) {
            $this->createErrorLog('WhatsApp Error: ' . $e->getMessage());
            session()->flash('whatsapp_error', 'API Error: ' . $e->getMessage());
        }

        return true;
    }

    public function prevConfiguration()
    {
        if ($this->user) {
            $this->mobile = $this->user->mobileNumber ?? null;
            $this->receiverName = $this->user->fullname;
        }
        $this->toAddress = $this->mobile;
    }
}
