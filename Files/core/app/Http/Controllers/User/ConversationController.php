<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Events\LiveChat;
use App\Lib\DashboardResource;
use App\Lib\MessageSanitizer;
use App\Lib\QuoteMessagingService;
use App\Models\Message;
use App\Models\Conversation;
use Illuminate\Http\Request;
use App\Rules\FileTypeValidate;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ConversationController extends Controller
{

    public function index($id = 0)
    {
        $pageTitle = "Conversations";
        $freelancer = auth()->user();
        $conversation = NULL;
        $messages = NULL;
        $buyer = NULL;
        $id = $id;

        if ($id) {
            $conversation = Conversation::unblock()->where('id', $id)->with(['job', 'user', 'buyer', 'messages.user', 'messages.buyer', 'messages.admin'])->first();
            if (!$conversation) {
                $notify[] = ['error', 'You are temporary blocked this conversation'];
                return back()->withNotify($notify);
            }

            $conversation->revealForUser();

            $buyer =  @$conversation?->buyer;
            $id = $conversation?->id;

            // Mark unread messages as read
            Message::whereNull('read_at')
            ->where(function ($query) use ($conversation, $freelancer, $buyer) {
                $query->where('conversation_id', $conversation->id)
                    ->where('buyer_id', $freelancer->id)
                    ->orWhereHas('conversation', fn($q) => $q->where('user_id', $buyer->id));
            })
            ->update(['read_at' => now()]);

            $messages = $this->presentMessages($conversation);
        }

        $conversations = Conversation::where('user_id', $freelancer->id)
            ->visibleToUser()
            ->whereHas('messages')
            ->with([
                'user',
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

        return Inertia::render('User/Conversation', array_merge(
            ['pageTitle' => $pageTitle],
            DashboardResource::conversationProps(
                $conversations,
                'freelancer',
                $conversation?->id,
                $conversation,
                $messages,
                $buyer
            )
        ));
    }

    public function conversationStore(Request $request, $id)
    {
        $validation  = Validator::make($request->all(), [
            'message'                => 'required',
            'message_files'          => ['nullable', 'array', 'max:10'],
            'message_files.*'        => ['nullable', 'max:2048', new FileTypeValidate(['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG', 'pdf', 'PDF', 'docx', 'DOCX', 'doc', 'DOC'])],
        ]);


        if ($validation->fails()) {
            return responseError('validation_error', $validation->errors()->all());
        }

        $conversation = Conversation::unblock()->where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        if (!($conversation)) {
            $notify[] = 'Conversation not found';
            return responseError('conversation_not_found', $notify);
        }

        $bid = QuoteMessagingService::conversationBid($conversation);
        $provider = auth()->user();

        if ($bid && !QuoteMessagingService::providerCanMessageBid($provider, $bid)) {
            return responseError('validation_error', ['Messaging is not available for this quote.']);
        }


        if (!($request->message_files) && !($request->message)) {
            $notify[] = 'Message field is required';
            return responseError('validation_required', $notify);
        }

        if ($request->message_files) {
            foreach ($request->message_files as $message_file) {
                try {
                    $message_files[] = fileUploader($message_file, getFilePath('message'));
                } catch (\Exception $exp) {
                    $notify[] = 'Couldn\'t upload your files: ' . $exp;
                    return responseError('upload_failed', $notify);
                }
            }
        }

        $revealContacts = $bid ? MessageSanitizer::shouldRevealContacts($bid->status) : false;

        $message          = new Message();
        $message->message = MessageSanitizer::sanitize($request->message, $revealContacts);
        $message->files   = @$message_files;
        $message->conversation_id = $id;
        $message->user_id    = $conversation->user_id;
        $message->read_at    = now();
        $message->save();

        $conversation->revealForBuyer();

        try {
            if (initializePusher()) {
                event(new LiveChat($message));
            }
        } catch (\Throwable $e) {
            report($e);
        }

        if ($bid?->buyer) {
            notify($bid->buyer, 'NEW_CHAT_MESSAGE', [
                'title' => $bid->job?->title ?? 'Your request',
                'sender' => $provider->fullname,
                'preview' => strLimit(strip_tags($message->message), 120),
            ]);
        }

        $notify[] = 'Successfully sent message';

        return responseSuccess('sent_message', $notify, [
            'message' => QuoteMessagingService::formatMessageForChat($message->loadMissing(['user', 'buyer', 'admin']), 'freelancer'),
        ]);
    }

    public function messagesJson($id)
    {
        $freelancer = auth()->user();
        $conversation = Conversation::unblock()->where('id', $id)->where('user_id', $freelancer->id)->firstOrFail();
        $conversation->load(['messages' => fn ($query) => $query->orderBy('id'), 'messages.user', 'messages.buyer', 'messages.admin']);

        Message::where('conversation_id', $conversation->id)
            ->whereNull('read_at')
            ->whereNotNull('buyer_id')
            ->update(['read_at' => now()]);

        $messages = $this->presentMessages($conversation);

        return response()->json([
            'status' => 'success',
            'data' => [
                'messages' => $messages->map(
                    fn (Message $message) => QuoteMessagingService::formatMessageForChat($message, 'freelancer')
                )->values(),
            ],
        ]);
    }

    public function unreadSummary()
    {
        return response()->json([
            'status' => 'success',
            'data' => QuoteMessagingService::unreadSummaryForProvider(auth()->user()),
        ]);
    }

    public function deleteChat($id)
    {
        $freelancer = auth()->user();
        $conversation = Conversation::where('id', $id)->where('user_id', $freelancer->id)->firstOrFail();
        $conversation->hideForUser();

        $notify[] = ['success', 'Chat removed from your inbox.'];
        return to_route('user.conversation.index')->withNotify($notify);
    }

    protected function presentMessages(Conversation $conversation)
    {
        $bid = QuoteMessagingService::conversationBid($conversation);
        $revealContacts = $bid ? MessageSanitizer::shouldRevealContacts($bid->status) : false;

        return $conversation->messages->map(function (Message $message) use ($revealContacts) {
            $message->message = MessageSanitizer::sanitize($message->message, $revealContacts);

            return $message;
        });
    }
}
