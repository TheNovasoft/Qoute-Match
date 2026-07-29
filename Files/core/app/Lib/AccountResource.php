<?php

namespace App\Lib;

use App\Constants\Status;
use App\Models\Deposit;
use App\Models\Form;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Models\WithdrawMethod;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AccountResource
{
    public static function supportTickets(LengthAwarePaginator $paginator, string $role): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (SupportTicket $ticket) => self::supportTicketRow($ticket, $role))->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function supportTicketRow(SupportTicket $ticket, string $role): array
    {
        return [
            'id' => (int) $ticket->id,
            'ticket' => $ticket->ticket,
            'subject' => __($ticket->subject),
            'status' => self::ticketStatus((int) $ticket->status),
            'priority' => self::ticketPriority((int) $ticket->priority),
            'lastReply' => diffForHumans($ticket->last_reply),
            'viewUrl' => $role === 'buyer'
                ? route('buyer.ticket.view', $ticket->ticket)
                : route('ticket.view', $ticket->ticket),
        ];
    }

    public static function supportTicketDetail(SupportTicket $ticket, string $role): array
    {
        return [
            'id' => (int) $ticket->id,
            'ticket' => $ticket->ticket,
            'subject' => __($ticket->subject),
            'status' => self::ticketStatus((int) $ticket->status),
            'priority' => self::ticketPriority((int) $ticket->priority),
            'createdAt' => showDateTime($ticket->created_at),
            'lastReply' => showDateTime($ticket->last_reply),
            'isClosed' => (int) $ticket->status === Status::TICKET_CLOSE,
            'replyUrl' => $role === 'buyer'
                ? route('buyer.ticket.reply', $ticket->id)
                : route('ticket.reply', $ticket->id),
            'closeUrl' => $role === 'buyer'
                ? route('buyer.ticket.close', $ticket->id)
                : route('ticket.close', $ticket->id),
            'indexUrl' => $role === 'buyer'
                ? route('buyer.ticket.index')
                : route('ticket.index'),
            'openUrl' => $role === 'buyer'
                ? route('buyer.ticket.open')
                : route('ticket.open'),
        ];
    }

    public static function supportMessages(Collection $messages, string $role): array
    {
        return $messages->map(fn (SupportMessage $message) => self::supportMessage($message, $role))->values()->all();
    }

    public static function supportMessage(SupportMessage $message, string $role): array
    {
        $isAdmin = (int) ($message->admin_id ?? 0) > 0;
        $downloadRoute = $role === 'buyer' ? 'buyer.ticket.download' : 'ticket.download';

        if ($isAdmin) {
            $senderName = $message->admin?->name ?? __('Support');
            $senderImage = getImage(getFilePath('adminProfile') . '/' . ($message->admin->image ?? ''), avatar: true);
        } elseif ($role === 'buyer') {
            $senderName = $message->ticket?->buyer?->fullname ?? __('You');
            $senderImage = getImage(getFilePath('buyerProfile') . '/' . ($message->ticket?->buyer?->image ?? ''), avatar: true);
        } else {
            $senderName = $message->ticket?->user?->fullname ?? __('You');
            $senderImage = getImage(getFilePath('userProfile') . '/' . ($message->ticket?->user?->image ?? ''), avatar: true);
        }

        return [
            'id' => (int) $message->id,
            'message' => $message->message,
            'isAdmin' => $isAdmin,
            'senderName' => $senderName,
            'senderImage' => $senderImage,
            'createdAt' => showDateTime($message->created_at),
            'attachments' => collect($message->attachments ?? [])->map(function ($attachment) use ($downloadRoute) {
                $ext = strtolower((string) pathinfo($attachment->attachment, PATHINFO_EXTENSION));
                $isImage = in_array($ext, ['jpg', 'jpeg', 'png'], true);
                $diskPath = public_path(getFilePath('ticket') . '/' . $attachment->attachment);

                return [
                    'id' => (int) $attachment->id,
                    'name' => $attachment->attachment,
                    'downloadUrl' => route($downloadRoute, encrypt($attachment->id)),
                    'previewImage' => getImage(
                        getFilePath('ticket') . '/' . ($isImage ? $attachment->attachment : 'doc_type.png')
                    ),
                    'size' => fileSizeInB($diskPath),
                ];
            })->values()->all(),
        ];
    }

    public static function withdrawMethods(Collection $methods): array
    {
        return $methods->map(fn (WithdrawMethod $method) => self::withdrawMethod($method))->values()->all();
    }

    public static function withdrawMethod(WithdrawMethod $method): array
    {
        return [
            'id' => (int) $method->id,
            'name' => __($method->name),
            'image' => getImage(getFilePath('withdrawMethod') . '/' . $method->image),
            'minLimit' => (float) $method->min_limit,
            'maxLimit' => (float) $method->max_limit,
            'fixedCharge' => (float) $method->fixed_charge,
            'percentCharge' => (float) $method->percent_charge,
            'rate' => (float) $method->rate,
            'currency' => $method->currency,
            'minLimitFormatted' => showAmount($method->min_limit),
            'maxLimitFormatted' => showAmount($method->max_limit),
        ];
    }

    public static function withdrawPreview(Withdrawal $withdraw, string $role): array
    {
        $method = $withdraw->method;
        $form = $method?->form;

        return [
            'amount' => showAmount($withdraw->amount),
            'finalAmount' => showAmount($withdraw->final_amount, currencyFormat: false) . ' ' . $withdraw->currency,
            'description' => $method?->description,
            'fields' => self::formFields($form),
            'submitUrl' => $role === 'buyer'
                ? route('buyer.withdraw.submit')
                : route('user.withdraw.submit'),
            'requires2fa' => $role === 'buyer'
                ? (bool) auth()->guard('buyer')->user()?->ts
                : (bool) auth()->user()?->ts,
        ];
    }

    public static function withdrawals(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Withdrawal $withdraw) => [
                'id' => (int) $withdraw->id,
                'trx' => $withdraw->trx,
                'method' => __($withdraw->method?->name ?? '—'),
                'amount' => showAmount($withdraw->amount),
                'charge' => showAmount($withdraw->charge),
                'finalAmount' => showAmount($withdraw->final_amount, currencyFormat: false) . ' ' . $withdraw->currency,
                'status' => self::paymentStatus((int) $withdraw->status),
                'createdAt' => showDateTime($withdraw->created_at),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function transactions(LengthAwarePaginator $paginator, array $remarks = []): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Transaction $trx) => [
                'trx' => $trx->trx,
                'createdAt' => showDateTime($trx->created_at),
                'createdAtHuman' => diffForHumans($trx->created_at),
                'amount' => showAmount($trx->amount),
                'trxType' => $trx->trx_type,
                'postBalance' => showAmount($trx->post_balance),
                'details' => __($trx->details),
                'remark' => $trx->remark,
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
            'remarks' => collect($remarks)->map(fn ($row) => [
                'value' => is_object($row) ? $row->remark : $row,
                'label' => __(keyToTitle(is_object($row) ? $row->remark : $row)),
            ])->values()->all(),
        ];
    }

    public static function deposits(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())->map(fn (Deposit $deposit) => [
                'trx' => $deposit->trx,
                'gateway' => __($deposit->gateway?->name ?? '—'),
                'amount' => showAmount($deposit->amount),
                'charge' => showAmount($deposit->charge),
                'finalAmount' => showAmount($deposit->final_amount),
                'status' => self::paymentStatus((int) $deposit->status),
                'createdAt' => showDateTime($deposit->created_at),
            ])->values()->all(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => self::paginationMeta($paginator),
        ];
    }

    public static function formFields(?Form $form): array
    {
        if (!$form || empty($form->form_data)) {
            return [];
        }

        return RequestFormService::fieldsForFrontend($form->form_data);
    }

    public static function kycData($user, string $role): array
    {
        $downloadRoute = $role === 'buyer' ? 'buyer.download.attachment' : 'user.download.attachment';

        return collect($user->kyc_data ?? [])->filter(fn ($item) => !empty($item->value))->map(function ($item) use ($downloadRoute) {
            $value = $item->value;
            if ($item->type === 'checkbox' && is_array($value)) {
                $display = implode(', ', $value);
            } elseif ($item->type === 'file') {
                $display = null;
            } else {
                $display = __($value);
            }

            return [
                'name' => __($item->name),
                'type' => $item->type,
                'display' => $display,
                'fileUrl' => $item->type === 'file'
                    ? route($downloadRoute, encrypt(getFilePath('verify') . '/' . $value))
                    : null,
            ];
        })->values()->all();
    }

    public static function buyerProfile($buyer): array
    {
        $languages = $buyer->language;
        if (is_object($languages)) {
            $languages = (array) $languages;
        } elseif (!is_array($languages)) {
            $languages = [];
        }

        return [
            'firstname' => $buyer->firstname,
            'lastname' => $buyer->lastname,
            'email' => $buyer->email,
            'mobile' => $buyer->mobile,
            'countryName' => $buyer->country_name,
            'address' => $buyer->address,
            'city' => $buyer->city,
            'state' => $buyer->state,
            'zip' => $buyer->zip,
            'language' => array_values(array_filter($languages)),
            'fullname' => $buyer->fullname,
            'image' => getImage(getFilePath('buyerProfile') . '/' . $buyer->image, getFileSize('buyerProfile')),
            'submitUrl' => route('buyer.profile.setting'),
        ];
    }

    public static function twoFactor(string $secret, string $qrCodeUrl, bool $enabled, string $role): array
    {
        return [
            'secret' => $secret,
            'qrCodeUrl' => $qrCodeUrl,
            'enabled' => $enabled,
            'enableUrl' => $role === 'buyer' ? route('buyer.twofactor.enable') : route('user.twofactor.enable'),
            'disableUrl' => $role === 'buyer' ? route('buyer.twofactor.disable') : route('user.twofactor.disable'),
        ];
    }

    public static function ticketStatus(int $status): array
    {
        return match ($status) {
            Status::TICKET_ANSWER => ['label' => __('Answered'), 'class' => 'badge--primary'],
            Status::TICKET_REPLY => ['label' => __('Customer Reply'), 'class' => 'badge--warning'],
            Status::TICKET_CLOSE => ['label' => __('Closed'), 'class' => 'badge--dark'],
            default => ['label' => __('Open'), 'class' => 'badge--success'],
        };
    }

    public static function ticketPriority(int $priority): array
    {
        return match ($priority) {
            Status::PRIORITY_MEDIUM => ['label' => __('Medium'), 'class' => 'badge--warning'],
            Status::PRIORITY_HIGH => ['label' => __('High'), 'class' => 'badge--danger'],
            default => ['label' => __('Low'), 'class' => 'badge--dark'],
        };
    }

    public static function paymentStatus(int $status): array
    {
        return match ($status) {
            Status::PAYMENT_SUCCESS => ['label' => __('Successful'), 'class' => 'badge--success'],
            Status::PAYMENT_PENDING => ['label' => __('Pending'), 'class' => 'badge--warning'],
            Status::PAYMENT_REJECT => ['label' => __('Rejected'), 'class' => 'badge--danger'],
            default => ['label' => __('Initiated'), 'class' => 'badge--dark'],
        };
    }

    private static function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
