<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AdminResource;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Traits\SupportTicketManager;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    use SupportTicketManager;

    public function __construct()
    {
        $this->userType = 'admin';
        $this->column = 'admin_id';
        $this->user = auth()->guard('admin')->user();
    }

    public function tickets()
    {
        return $this->renderTicketList('Support Tickets', SupportTicket::searchable(['name','subject','ticket'])->orderBy('id','desc')->with('user')->paginate(getPaginate()), 'all');
    }

    public function pendingTicket()
    {
        return $this->renderTicketList('Pending Tickets', SupportTicket::searchable(['name','subject','ticket'])->pending()->orderBy('id','desc')->with('user')->paginate(getPaginate()), 'pending');
    }

    public function closedTicket()
    {
        return $this->renderTicketList('Closed Tickets', SupportTicket::searchable(['name','subject','ticket'])->closed()->orderBy('id','desc')->with('user')->paginate(getPaginate()), 'closed');
    }

    public function answeredTicket()
    {
        return $this->renderTicketList('Answered Tickets', SupportTicket::searchable(['name','subject','ticket'])->orderBy('id','desc')->with('user')->answered()->paginate(getPaginate()), 'answered');
    }

    protected function renderTicketList(string $pageTitle, $items, string $scope = 'all')
    {
        return Inertia::render('Admin/Support/Index', [
            'pageTitle' => $pageTitle,
            'tickets' => AdminResource::supportTickets($items, $scope),
        ]);
    }

    public function ticketReply($id)
    {
        $ticket = SupportTicket::with('user')->where('id', $id)->firstOrFail();
        $pageTitle = 'Reply Ticket';
        $messages = SupportMessage::with('ticket','admin','attachments')->where('support_ticket_id', $ticket->id)->orderBy('id','desc')->get();

        return Inertia::render('Admin/Support/Reply', [
            'pageTitle' => $pageTitle,
            'ticket' => AdminResource::supportTicketDetail($ticket, $messages),
        ]);
    }

    public function ticketDelete($id)
    {
        $message = SupportMessage::findOrFail($id);
        $path = getFilePath('ticket');
        if ($message->attachments()->count() > 0) {
            foreach ($message->attachments as $attachment) {
                fileManager()->removeFile($path.'/'.$attachment->attachment);
                $attachment->delete();
            }
        }
        $message->delete();
        $notify[] = ['success', "Support ticket deleted successfully"];
        return back()->withNotify($notify);

    }

}
