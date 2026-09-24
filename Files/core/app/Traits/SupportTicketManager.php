<?php

namespace App\Traits;

use App\Constants\Status;
use App\Lib\AccountResource;
use App\Models\AdminNotification;
use App\Models\SupportAttachment;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

trait SupportTicketManager
{
    protected $files;
    protected $allowedExtension = ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx'];
    protected $userType;
    protected $user = null;
    protected $layout = null;
    protected $column;
    protected $apiRequest = false;

    public function supportTicket()
    {
        $user = $this->user;
        if (!$user) {
            abort(404);
        }
        $pageTitle = "Support Tickets";
        $supports = SupportTicket::where($this->column, $user->id)->orderBy('id', 'desc')->paginate(getPaginate());
        if ($this->apiRequest) {
            $notify[] = 'Support ticket data';
            return responseSuccess('tickets', $notify, [
                'tickets' => $supports
            ]);
        }
        return Inertia::render($this->accountPage('Support/Index'), [
            'pageTitle' => $pageTitle,
            'tickets' => AccountResource::supportTickets($supports, $this->accountRole()),
            'openUrl' => $this->userType === 'buyer' ? route('buyer.ticket.open') : route('ticket.open'),
        ]);
    }

    public function openSupportTicket()
    {
        $user = $this->user;

        if (!$user) {
            return to_route('home');
        }
        $pageTitle = "Open Ticket";
        return Inertia::render($this->accountPage('Support/Create'), [
            'pageTitle' => $pageTitle,
            'storeUrl' => $this->userType === 'buyer' ? route('buyer.ticket.store') : route('ticket.store'),
            'indexUrl' => $this->userType === 'buyer' ? route('buyer.ticket.index') : route('ticket.index'),
        ]);
    }

    public function storeSupportTicket(Request $request)
    {
        $user = $this->user;

        if (!$user) {
            return to_route('home');
        }
        $ticket  = new SupportTicket();
        $message = new SupportMessage();

        $validationRule = $this->validation($request);
        if ($this->apiRequest) {
            $validator = Validator::make($request->all(), $validationRule);
            if ($validator->fails()) {
                return responseError('validation_error', $validator->errors());
            }
        } else {
            $request->validate($validationRule);
        }

        $column             = $this->column;
        $user               = $this->user;
        $ticket->$column    = $user->id;
        $ticket->ticket     = rand(100000, 999999);
        $ticket->name       = $user->fullname;
        $ticket->email      = $user->email;
        $ticket->subject    = $request->subject;
        $ticket->last_reply = Carbon::now();
        $ticket->status     = Status::TICKET_OPEN;
        $ticket->priority   = $request->priority;
        $ticket->save();


        $message->support_ticket_id   = $ticket->id;
        $message->message             = $request->message;
        $message->save();

        $adminNotification            = new AdminNotification();
        $adminNotification->$column   = $user->id;
        $adminNotification->title     = 'New support ticket has opened';
        $adminNotification->click_url = urlPath('admin.ticket.view', $ticket->id);
        $adminNotification->save();

        if ($request->hasFile('attachments')) {
            $uploadAttachments = $this->storeSupportAttachments($message->id);
            if ($uploadAttachments != 200) {
                if ($this->apiRequest) {
                    $notify[] = 'File could not upload';
                    return responseError('file_upload_error', $notify);
                }

                return back()->withNotify($uploadAttachments);
            }
        }

        if ($this->apiRequest) {
            $notify[] = 'Ticket opened successfully';
            return responseSuccess('ticket_open', $notify, [
                'ticket' => $ticket
            ]);
        }

        $notify[] = ['success', 'Ticket opened successfully!'];

        session()->flash('notify', $notify);

        return Inertia::location(route($this->redirectLink, $ticket->ticket));
    }

    public function viewTicket($ticket)
    {
        $user      = $this->user;
        $column    = $this->column;
        $pageTitle = "View Ticket";
        $userId    = 0;
        $layout    = $this->layout;

        $myTicket = SupportTicket::where('ticket', $ticket)->orderBy('id', 'desc')->first();

        if (!$myTicket) {
            if ($this->apiRequest) {
                $notify[] = 'Ticket not found';
                return responseError('ticket_not_found', $notify);
            }
            abort(404);
        }

        if ($myTicket->$column > 0) {
            if ($user) {
                $userId = $user->id;
            } else {
                if ($this->apiRequest) {
                    $notify[] = 'Unauthorized user';
                    return responseError('unauthorized_user', $notify);
                }
                return to_route($this->userType . '.login');
            }
        }

        $myTicket = SupportTicket::where('ticket', $ticket)->where($this->column, $userId)->orderBy('id', 'desc')->first();
        if (!$myTicket) {
            if ($this->apiRequest) {
                $notify[] = 'Ticket not found';
                return responseError('ticket_not_found', $notify);
            }
            abort(404);
        }
        $messages = SupportMessage::where('support_ticket_id', $myTicket->id)->with('ticket', 'admin', 'attachments')->orderBy('id', 'desc')->get();

        if ($this->apiRequest) {
            $notify[] = 'Support ticket view';
            return responseSuccess('ticket_view', $notify, [
                'my_ticket' => $myTicket,
                'messages'  => $messages,
            ]);
        }

        return Inertia::render($this->accountPage('Support/View'), [
            'pageTitle' => $pageTitle,
            'ticket' => AccountResource::supportTicketDetail($myTicket, $this->accountRole()),
            'messages' => AccountResource::supportMessages($messages, $this->accountRole()),
        ]);
    }


    public function replyTicket(Request $request, $id)
    {
        $user = $this->user;
        $userId = 0;
        if ($user) {
            $userId = $user->id;
        }
        $ticket = SupportTicket::where('id', $id)->first();
        if (!$ticket) {
            if ($this->apiRequest) {
                $notify[] = 'Ticket not found';
                return responseError('ticket_not_found', $notify);
            }
            abort(404);
        }
        if (($this->userType == 'user') && ($userId != $ticket->user_id)) {
            if ($this->apiRequest) {
                $notify[] = 'Unauthorized user';
                return responseError('unauthorized', $notify);
            }
            abort(404);
        }
        if (($this->userType == 'buyer') && ($userId != $ticket->buyer_id)) {
            if ($this->apiRequest) {
                $notify[] = 'Unauthorized user';
                return responseError('unauthorized', $notify);
            }
            abort(404);
        }
        $message = new SupportMessage();

        $request->merge(['ticket_reply' => 1]);

        $validationRule = $this->validation($request);
        if ($this->apiRequest) {
            $validator = Validator::make($request->all(), $validationRule);
            if ($validator->fails()) {
                return responseError('validation_error', $validator->errors());
            }
        } else {
            $request->validate($validationRule);
        }

        $ticket->status = $this->userType != 'admin' ? Status::TICKET_REPLY : Status::TICKET_ANSWER;
        $ticket->last_reply = Carbon::now();
        $ticket->save();
        $message->support_ticket_id = $ticket->id;
        if ($this->userType == 'admin') {
            $message->admin_id = $user->id;
        }

        $message->message = $request->message;
        $message->save();

        if ($request->hasFile('attachments')) {
            $uploadAttachments = $this->storeSupportAttachments($message->id);
            if ($uploadAttachments != 200) {
                if ($this->apiRequest) {
                    $notify[] = 'File could not upload';
                    return responseError('file_upload_error', $notify);
                }
                return back()->withNotify($uploadAttachments);
            }
        }

        if ($this->userType == 'admin') {
            $createLog = false;
            $notifyUser = $ticket;
            $sendVia = ['email', 'sms'];
            $ticketLink = route('ticket.view', $ticket->ticket);

            if ((int) $ticket->user_id !== 0 && $ticket->user) {
                $createLog = true;
                $notifyUser = $ticket->user;
                $sendVia = null;
                $ticketLink = route('ticket.view', $ticket->ticket);
            } elseif ((int) ($ticket->buyer_id ?? 0) !== 0 && $ticket->buyer) {
                $createLog = true;
                $notifyUser = $ticket->buyer;
                $sendVia = null;
                $ticketLink = route('buyer.ticket.view', $ticket->ticket);
            }

            notify($notifyUser, 'ADMIN_SUPPORT_REPLY', [
                'ticket_id' => $ticket->ticket,
                'ticket_subject' => $ticket->subject,
                'reply' => $request->message,
                'link' => $ticketLink,
            ], $sendVia, $createLog);
        }

        $message->load('attachments');

        if ($this->apiRequest) {
            $notify[] = 'Ticket replied successfully';
            return responseSuccess('ticket_replied', $notify, [
                'ticket' => $ticket,
                'message' => $message
            ]);
        }

        $notify[] = ['success', 'Support ticket replied successfully!'];

        return back()->withNotify($notify);
    }

    protected function storeSupportAttachments($messageId)
    {
        $path = getFilePath('ticket');
        $files = $this->files;
        if (!$files) {
            return 200;
        }
        if (!is_array($files)) {
            $files = [$files];
        }

        try {
            foreach ($files as $file) {
                if (!$file) {
                    continue;
                }
                $attachment = new SupportAttachment();
                $attachment->support_message_id = $messageId;
                $attachment->attachment = fileUploader($file, $path);
                $attachment->save();
            }
        } catch (\Exception $exp) {
            $notify[] = ['error', 'File could not upload'];
            return $notify;
        }

        return 200;
    }

    protected function validation($request)
    {
        $files = $request->file('attachments');
        if ($files && !is_array($files)) {
            $files = [$files];
        }
        $this->files = $files ?: [];

        return [
            'attachments' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if (!$this->files || count($this->files) === 0) {
                        return;
                    }
                    foreach ($this->files as $file) {
                        if (!$file) {
                            continue;
                        }
                        $ext = strtolower($file->getClientOriginalExtension());
                        if (!in_array($ext, $this->allowedExtension, true)) {
                            return $fail("Only png, jpg, jpeg, pdf, doc, docx files are allowed");
                        }
                        if ($file->getSize() > 5 * 1024 * 1024) {
                            return $fail("Each attachment must be 5MB or smaller");
                        }
                    }
                    if (count($this->files) > 5) {
                        return $fail("Maximum 5 files can be uploaded");
                    }
                },
            ],
            'subject'   => 'required_without:ticket_reply|max:255',
            'priority'  => 'required_without:ticket_reply|in:1,2,3',
            'message'   => 'required',
        ];
    }

    private function convertToMb($value)
    {
        $unit = strtolower(substr($value, -1));
        $value = substr($value, 0, -1);
        if ($unit == 'k') {
            return $value / 1024;
        }
        if ($unit == 'm') {
            return $value;
        }
        if ($unit == 'g') {
            return $value * 1024;
        }
        return $value;
    }

    public function closeTicket($id)
    {
        $user = $this->user;
        $ticket = SupportTicket::where('id', $id)->first();
        if (!$ticket) {
            if ($this->apiRequest) {
                $notify[] = 'Ticket not found';
                return responseError('ticket_not_found', $notify);
            }
            abort(404);
        }
        if ($this->userType != 'admin') {
            $column = $this->column;
            if ($user->id != $ticket->$column) {
                if ($this->apiRequest) {
                    $notify[] = 'Unauthorized user';
                    return responseError('unauthorized', $notify);
                }
                abort(403);
            }
        }

        $ticket->status = Status::TICKET_CLOSE;
        $ticket->save();

        if ($this->apiRequest) {
            $notify[] = 'Ticket closed successfully';
            return responseSuccess('ticket_closed', $notify);
        }

        $notify[] = ['success', 'Support ticket closed successfully!'];
        return back()->withNotify($notify);
    }

    public function ticketDownload($attachmentId)
    {
        $attachment = SupportAttachment::find(decrypt($attachmentId));
        if (!$attachment) {
            if ($this->apiRequest) {
                $notify[] = 'Attachment not found';
                return responseError('attachment_not_found', $notify);
            }
            abort(404);
        }
        $file = $attachment->attachment;
        $fullPath = public_path(getFilePath('ticket') . '/' . $file);
        if (!is_file($fullPath)) {
            if ($this->apiRequest) {
                $notify[] = 'Attachment not found';
                return responseError('attachment_not_found', $notify);
            }
            $notify[] = ['error', 'Attachment not found'];
            return back()->withNotify($notify);
        }
        $title = slug(optional(optional($attachment->supportMessage)->ticket)->subject ?: 'attachment');
        $ext = pathinfo($file, PATHINFO_EXTENSION);

        return response()->download($fullPath, $title . '.' . $ext);
    }

    protected function accountPage(string $page): string
    {
        return ($this->userType === 'buyer' ? 'Buyer' : 'User') . '/' . $page;
    }

    protected function accountRole(): string
    {
        return $this->userType === 'buyer' ? 'buyer' : 'freelancer';
    }
}