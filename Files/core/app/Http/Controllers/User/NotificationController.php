<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Lib\InertiaResource;
use App\Lib\NotificationInboxService;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $pageTitle = 'Notifications';
        $logs = NotificationInboxService::inboxQuery('user_id', $user->id)
            ->orderByDesc('id')
            ->paginate(getPaginate());

        NotificationInboxService::markAllReadForProvider($user);

        return Inertia::render('User/Notifications', [
            'pageTitle' => $pageTitle,
            'logs' => InertiaResource::notificationLogs($logs),
        ]);
    }

    public function unreadSummary()
    {
        $user = auth()->user();

        return response()->json([
            'status' => 'success',
            'data' => NotificationInboxService::unreadSummaryForProvider($user),
        ]);
    }
}
