<?php

namespace App\Notify;

class InApp extends NotifyProcess implements Notifiable
{
    public function __construct()
    {
        $this->statusField = 'in_app_status';
        $this->body = 'in_app_body';
        $this->globalTemplate = 'in_app_template';
        $this->notifyConfig = 'mail_config';
    }

    public function send()
    {
        if (!gs('in')) {
            return false;
        }

        $message = $this->getMessage();
        if (!$message) {
            return false;
        }

        $this->finalMessage = notificationPlainText($message);
        $this->createLog('in_app');

        return true;
    }

    public function prevConfiguration()
    {
        if ($this->user) {
            $this->receiverName = $this->user->fullname;
            $this->toAddress = $this->user->username ?? ('user#' . ($this->user->id ?? ''));
        }
    }
}
