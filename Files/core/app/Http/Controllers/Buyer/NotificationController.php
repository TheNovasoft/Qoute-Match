<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Lib\InertiaResource;
use App\Lib\NotificationInboxService;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $buyer = auth()->guard('buyer')->user();
        $pageTitle = 'Notifications';
        $logs = NotificationInboxService::inboxQuery('buyer_id', $buyer->id)
            ->orderByDesc('id')
            ->paginate(getPaginate());

        NotificationInboxService::markAllReadForBuyer($buyer);

        return Inertia::render('Buyer/Notifications', [
            'pageTitle' => $pageTitle,
            'logs' => InertiaResource::notificationLogs($logs),
        ]);
    }

    public function unreadSummary()
    {
        $buyer = auth()->guard('buyer')->user();

        return response()->json([
            'status' => 'success',
            'data' => NotificationInboxService::unreadSummaryForBuyer($buyer),
        ]);
    }
}
