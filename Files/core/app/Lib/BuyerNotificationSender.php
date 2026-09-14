<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\NotificationTemplate;
use App\Models\Buyer;

/**
 * Class BuyerNotificationSender
 * 
 * This class handles the sending of notifications to buyers based on specified criteria.
 * It supports multiple notification channels (e.g., email, push notifications) and manages
 * session data to track the notification sending process.
 */
class BuyerNotificationSender
{

    private $isSingleNotification = false;
    /**
     * Send notifications to all or selected buyers based on the request parameters.
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function notificationToAll($request)
    {
        if (!$this->isTemplateEnabled($request->via)) {
            return $this->redirectWithNotify('warning', 'Default notification template is not enabled');
        }

        $handleSelectedBuyer = $this->handleSelectedBuyers($request);
        if (!$handleSelectedBuyer) {
            return $this->redirectWithNotify('error', "Ensure that the buyer field is populated when sending an email to the designated buyer group");
        }

        $BuyerQuery      = $this->getBuyerQuery($request);
        $totalBuyerCount = $this->getTotalBuyerCount($BuyerQuery, $request);

        if ($totalBuyerCount <= 0) {
            return $this->redirectWithNotify('error', "Notification recipients were not found among the selected buyer base.");
        }

        $imageUrl = $this->handlePushNotificationImage($request);
        $buyers    = $this->getBuyers($BuyerQuery, $request->start, $request->batch);

        $this->sendNotifications($buyers, $request, $imageUrl);

        return $this->manageSessionForNotification($totalBuyerCount, $request);
    }

    /**
     * Send a notification to a single buyer.
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $BuyerId
     * @return \Illuminate\Http\RedirectResponse
     */
    public function notificationToSingle($request, $BuyerId)
    {
        if (!$this->isTemplateEnabled($request->via)) {
            return $this->redirectWithNotify('warning', 'Default notification template is not enabled');
        }
        $this->isSingleNotification = true;
        $imageUrl = $this->handlePushNotificationImage($request);
        $buyer     = Buyer::findOrFail($BuyerId);

        $this->sendNotifications($buyer, $request, $imageUrl, true);

        if ((int) session()->pull('bulk_notify_failures', 0) > 0 && $request->via === 'email') {
            $detail = session()->pull('mail_error');

            return $this->redirectWithNotify('error', $detail ?: 'Email could not be sent. Check SMTP / Mailpit settings.');
        }

        return $this->redirectWithNotify('success', 'Notification sent successfully');
    }
    /**
     * Check if the notification template is enabled for the specified channel.
     * 
     * @param string $via
     * @return bool
     */
    private function isTemplateEnabled($via)
    {
        return NotificationTemplate::where('act', 'DEFAULT')->where($via . '_status', Status::ENABLE)->exists();
    }

    /**
     * Redirect with a notification message.
     * 
     * @param string $type
     * @param string $message
     * @return \Illuminate\Http\RedirectResponse
     */
    private function redirectWithNotify($type, $message)
    {
        $notify[] = [$type, $message];
        return back()->withNotify($notify);
    }

    /**
     * Handle selected buyers logic, merging buyer data from session if necessary.
     * 
     * @param \Illuminate\Http\Request $request
     * @return bol
     */
    private function handleSelectedBuyers($request)
    {
        if ($request->being_sent_to == 'selectedBuyers') {
            if (session()->has("SEND_NOTIFICATION")) {
                $request->merge(['buyer' => session()->get('SEND_NOTIFICATION')['buyer']]);
            } elseif (!$request->buyer || !is_array($request->buyer) || empty($request->buyer)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get buyer query based on the scope.
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function getBuyerQuery($request)
    {
        $scope = $request->being_sent_to;
        return Buyer::oldest()->active()->$scope();
    }

    /**
     * Get the total buyer count for notification.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $BuyerQuery
     * @param \Illuminate\Http\Request $request
     * @return int
     */
    private function getTotalBuyerCount($BuyerQuery, $request)
    {
        if (session()->has("SEND_NOTIFICATION")) {
            $totalBuyerCount = session('SEND_NOTIFICATION')['total_Buyer'];
        } else {
            $totalBuyerCount = (clone $BuyerQuery)->count() - ($request->start - 1);
        }
        return $totalBuyerCount;
    }

    /**
     * Handle image upload for push notifications.
     * 
     * @param \Illuminate\Http\Request $request
     * @return string|null
     */
    private function handlePushNotificationImage($request)
    {
        if ($request->via == 'push') {
            if ($request->hasFile('image')) {
                $imageUrl = fileUploader($request->image, getFilePath('push'));
                session()->put('PUSH_IMAGE_URL', $imageUrl);
                return $imageUrl;
            }
            return $this->isSingleNotification ? null : session()->get('PUSH_IMAGE_URL');
        }
        return null;
    }

    /**
     * Get buyers for notification based on pagination.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $BuyerQuery
     * @param int $start
     * @param int $batch
     * @return \Illuminate\Support\Collection
     */
    private function getBuyers($BuyerQuery, $start, $batch)
    {
        return (clone $BuyerQuery)->skip($start - 1)->limit($batch)->get();
    }

    /**
     * Send notifications to buyers.
     * 
     * @param \Illuminate\Support\Collection $buyers
     * @param \Illuminate\Http\Request $request
     * @param string|null $imageUrl
     * @param bol $isSingleNotification
     * @return void
     */
    private function sendNotifications($buyers, $request, $imageUrl, $isSingleNotification = false)
    {
        NotificationSendTracker::reset();

        if (!$isSingleNotification) {
            foreach ($buyers as $buyer) {
                if (! notify($buyer, 'DEFAULT', [
                    'subject' => $request->subject,
                    'message' => $request->message,
                ], [$request->via], pushImage: $imageUrl)) {
                    NotificationSendTracker::recordFailure(session('mail_error'));
                }
            }
        } else {
            if (! notify($buyers, 'DEFAULT', [
                'subject' => $request->subject,
                'message' => $request->message,
            ], [$request->via], pushImage: $imageUrl)) {
                NotificationSendTracker::recordFailure(session('mail_error'));
            }
        }

        NotificationSendTracker::flushToSession();
    }

    /**
     * Manage session data for notification sending process.
     * 
     * @param int $totalBuyerCount
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    private function manageSessionForNotification($totalBuyerCount, $request)
    {
        if (session()->has('SEND_NOTIFICATION')) {
            $sessionData                = session("SEND_NOTIFICATION");
            $sessionData['total_sent'] += $sessionData['batch'];
        } else {
            $sessionData               = $request->except('_token', 'image');
            $sessionData['total_sent'] = $request->batch;
            $sessionData['total_Buyer'] = $totalBuyerCount;
        }

        $sessionData['start'] = $sessionData['total_sent'] + 1;

        if ($sessionData['total_sent'] >= $totalBuyerCount) {
            session()->forget("SEND_NOTIFICATION");
            $message = ucfirst($request->via) . " notifications were sent successfully";
            $url     = route("admin.buyers.notification.all");
        } else {
            session()->put('SEND_NOTIFICATION', $sessionData);
            $message = $sessionData['total_sent'] . " " . $sessionData['via'] . "  notifications were sent successfully";
            $url     = route("admin.buyers.notification.all") . "?email_sent=yes";
        }

        $notify = $this->buildBulkSendFlash($request, $message);

        return redirect($url)->withNotify($notify);
    }

    /**
     * @return list<array{0: string, 1: string}>
     */
    private function buildBulkSendFlash($request, string $successMessage): array
    {
        $failures = (int) session()->pull('bulk_notify_failures', 0);
        $notify = [];

        if ($failures > 0 && $request->via === 'email') {
            $detail = session()->pull('mail_error');
            $notify[] = ['error', "Email could not be delivered for {$failures} buyer(s). Configure SMTP under Admin → Notification → Email Setting, or start Laragon Mailpit (inbox: http://127.0.0.1:8025)."];
            if ($detail) {
                $notify[] = ['error', $detail];
            }
            if ((gs('mail_config')->name ?? '') === 'log') {
                $notify[] = ['info', 'Local mode: outgoing messages are saved to storage/logs/outgoing-mail.log until SMTP is configured.'];
            }
        } else {
            $notify[] = ['success', $successMessage];
        }

        return $notify;
    }
}
