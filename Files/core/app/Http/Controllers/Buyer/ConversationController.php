<?php

namespace App\Http\Controllers\Buyer;

use App\Events\LiveChat;
use App\Http\Controllers\Controller;
use App\Lib\DashboardResource;
use App\Lib\MessageSanitizer;
use App\Lib\QuoteMessagingService;
use App\Models\Bid;
use App\Models\Conversation;
use App\Models\Message;
use App\Rules\FileTypeValidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function index()
    {
        $pageTitle     = "Conversations";
        $buyer         = auth()->guard('buyer')->user();
        $conversation  = null;
        $freelancer    = null;
        $messages      = null;
        $conversations = Conversation::where('buyer_id', $buyer->id)
            ->visibleToBuyer()
            ->whereHas('messages')
            ->with(['user.providerVerifications', 'messages', 'buyer'])
            ->distinct()
            ->orderBy('created_at', 'DESC')
            ->get();
        return Inertia::render('Buyer/Conversation', array_merge(
            ['pageTitle' => $pageTitle],
            DashboardResource::conversationProps($conversations, 'buyer', null, null, null, null)
        ));
    }

    public function bidChat($id)
    {
        $pageTitle = "Conversation";
        $buyer     = auth()->guard('buyer')->user();

        $bid = Bid::with(['job', 'user.providerVerifications'])->where('buyer_id', $buyer->id)->findOrFail($id);

        if (!QuoteMessagingService::buyerCanMessageBid($buyer, $bid)) {
            $notify[] = ['error', 'Messaging is available after a provider submits a quote on your request.'];
            return to_route('buyer.job.post.bids', $bid->job_id)->withNotify($notify);
        }

        $conversation = QuoteMessagingService::findOrCreateForBid($bid);
        $conversation->revealForBuyer();
        $freelancer   = $bid->user;
        $conversation->load(['messages.user', 'messages.buyer', 'messages.admin']);
        $messages     = $this->presentMessages($conversation);

        $conversations = Conversation::where('buyer_id', $buyer->id)
            ->visibleToBuyer()
            ->with(['user.providerVerifications', 'messages', 'buyer'])
            ->orderBy('updated_at', 'desc')
            ->distinct()
            ->get();

        $id = $conversation->id;

        return Inertia::render('Buyer/Conversation', array_merge(
            ['pageTitle' => $pageTitle],
            DashboardResource::conversationProps($conversations, 'buyer', $conversation->id, $conversation, $messages, $freelancer)
        ));
    }

    public function conversation($id)
    {
        $pageTitle    = "Conversation";
        $buyer        = auth()->guard('buyer')->user();
        $conversation = Conversation::where('id', $id)->where('buyer_id', $buyer->id)->with(['user.providerVerifications', 'buyer', 'messages.user', 'messages.buyer', 'messages.admin'])->firstOrFail();
        $conversation->revealForBuyer();
        $bid          = QuoteMessagingService::conversationBid($conversation);

        if ($bid && !QuoteMessagingService::buyerCanMessageBid($buyer, $bid)) {
            $notify[] = ['error', 'This conversation is no longer available for this quote.'];
            return to_route('buyer.conversation.index')->withNotify($notify);
        }

        $freelancer = @$conversation->user;

        Message::where('conversation_id', $conversation->id)->whereNull('buyer_read_at')->where(function ($query) use ($freelancer) {
            $query->where('user_id', $freelancer->id);
        })->update(['buyer_read_at' => now()]);

        $messages = $this->presentMessages($conversation, $bid);

        $conversations = Conversation::where('buyer_id', $buyer->id)
            ->visibleToBuyer()
            ->whereHas('messages')
            ->with([
                'user.providerVerifications',
                'buyer',
                'messages',
            ])
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('messages.conversation_id', 'conversations.id')
                    ->latest()
                    ->take(1)
            )
            ->get();

        $id = $conversation->id;
        return Inertia::render('Buyer/Conversation', array_merge(
            ['pageTitle' => $pageTitle],
            DashboardResource::conversationProps($conversations, 'buyer', $conversation->id, $conversation, $messages, $freelancer)
        ));
    }

    public function conversationStore(Request $request, $id)
    {
        $validation = Validator::make($request->all(), [
            'message'         => 'required',
            'message_files'   => ['nullable', 'array', 'max:10'],
            'message_files.*' => ['nullable', 'max:2048', new FileTypeValidate(['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG', 'pdf', 'PDF', 'docx', 'DOCX', 'doc', 'DOC'])],
        ]);

        if ($validation->fails()) {
            return responseError('validation_error', $validation->errors()->all());
        }

        $conversation = Conversation::unblock()->where('id', $id)->where('buyer_id', auth()->guard('buyer')->id())->firstOrFail();
        $bid          = QuoteMessagingService::conversationBid($conversation);
        $buyer        = auth()->guard('buyer')->user();

        if ($bid && !QuoteMessagingService::buyerCanMessageBid($buyer, $bid)) {
            return responseError('validation_error', ['Messaging is not available for this quote.']);
        }

        if (!($request->message_files) && !($request->message)) {
            $notify[] = 'Message field is required';
            return responseError('validation_required', $notify);
        }

        if ($request->message_files) {
            foreach ($request->message_files as $messageFile) {
                try {
                    $message_files[] = fileUploader($messageFile, getFilePath('message'));
                } catch (\Exception $exp) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'Couldn\'t upload your files',
                    ]);
                }
            }
        }

        $revealContacts = $bid ? MessageSanitizer::shouldRevealContacts($bid->status) : false;

        $message                  = new Message();
        $message->message         = MessageSanitizer::sanitize($request->message, $revealContacts);
        $message->files           = @$message_files;
        $message->conversation_id = $id;
        $message->buyer_id        = $conversation->buyer_id;
        $message->buyer_read_at   = now();
        $message->save();

        $conversation->revealForUser();

        try {
            if (initializePusher()) {
                event(new LiveChat($message));
            }
        } catch (\Throwable $e) {
            report($e);
        }

        if ($bid?->user) {
            notify($bid->user, 'NEW_CHAT_MESSAGE', [
                'title' => $bid->job?->title ?? 'Your request',
                'sender' => $buyer->fullname,
                'preview' => strLimit(strip_tags($message->message), 120),
            ]);
        }

        $notify[] = 'Successfully sent message';

        return responseSuccess('sent_message', $notify, [
            'message' => QuoteMessagingService::formatMessageForChat($message->loadMissing(['user', 'buyer', 'admin']), 'buyer'),
        ]);
    }

    public function messagesJson($id)
    {
        $buyer = auth()->guard('buyer')->user();
        $conversation = Conversation::where('id', $id)->where('buyer_id', $buyer->id)->firstOrFail();
        $conversation->load(['messages' => fn ($query) => $query->orderBy('id'), 'messages.user', 'messages.buyer', 'messages.admin']);

        Message::where('conversation_id', $conversation->id)
            ->whereNull('buyer_read_at')
            ->whereNotNull('user_id')
            ->update(['buyer_read_at' => now()]);

        $messages = $this->presentMessages($conversation);

        return response()->json([
            'status' => 'success',
            'data' => [
                'messages' => $messages->map(
                    fn (Message $message) => QuoteMessagingService::formatMessageForChat($message, 'buyer')
                )->values(),
            ],
        ]);
    }

    public function download($filename)
    {
        $filePath = public_path(getFilePath('message') . $filename);
        if (file_exists($filePath)) {
            return response()->download($filePath);
        }
        abort(404, 'File not found.');
    }

    public function blockStatus($id)
    {
        $buyer = auth()->guard('buyer')->user();
        $conversation = Conversation::where('id', $id)->where('buyer_id', $buyer->id)->firstOrFail();
        $conversation->status = (int) $conversation->status === \App\Constants\Status::BLOCK
            ? \App\Constants\Status::UNBLOCK
            : \App\Constants\Status::BLOCK;
        $conversation->save();

        $notify[] = ['success', (int) $conversation->status === \App\Constants\Status::BLOCK
            ? 'Provider blocked successfully.'
            : 'Provider unblocked successfully.'];
        return back()->withNotify($notify);
    }

    public function deleteChat($id)
    {
        $buyer = auth()->guard('buyer')->user();
        $conversation = Conversation::where('id', $id)->where('buyer_id', $buyer->id)->firstOrFail();
        $conversation->hideForBuyer();

        $notify[] = ['success', 'Chat removed from your inbox.'];
        return to_route('buyer.conversation.index')->withNotify($notify);
    }

    public function unreadSummary()
    {
        $buyer = auth()->guard('buyer')->user();

        return response()->json([
            'status' => 'success',
            'data' => QuoteMessagingService::unreadSummaryForBuyer($buyer),
        ]);
    }

    protected function presentMessages(Conversation $conversation, ?Bid $bid = null)
    {
        $bid ??= QuoteMessagingService::conversationBid($conversation);
        $revealContacts = $bid ? MessageSanitizer::shouldRevealContacts($bid->status) : false;

        return $conversation->messages->map(function (Message $message) use ($revealContacts) {
            $message->message = MessageSanitizer::sanitize($message->message, $revealContacts);

            return $message;
        });
    }
}
