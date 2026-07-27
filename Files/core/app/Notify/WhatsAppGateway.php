<?php

namespace App\Notify;

/**
 * Future WhatsApp delivery providers (Meta Cloud API, Twilio WhatsApp, etc.).
 * Wired now so templates/settings can be configured; live send is not enabled yet.
 */
class WhatsAppGateway
{
    public string $to = '';

    public string $message = '';

    public object|array|null $config = null;

    public function send(): void
    {
        $name = is_object($this->config) ? ($this->config->name ?? 'disabled') : 'disabled';

        match ($name) {
            'meta' => $this->meta(),
            'twilio' => $this->twilio(),
            default => throw new \RuntimeException('WhatsApp provider is not configured yet.'),
        };
    }

    protected function meta(): void
    {
        throw new \RuntimeException('Meta WhatsApp Cloud API integration is coming soon.');
    }

    protected function twilio(): void
    {
        throw new \RuntimeException('Twilio WhatsApp integration is coming soon.');
    }
}
