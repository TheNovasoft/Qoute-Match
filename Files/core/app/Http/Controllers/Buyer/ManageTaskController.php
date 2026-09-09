<?php

namespace App\Http\Controllers\Buyer;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\FriendlyNotify;
use App\Lib\TaskResource;
use App\Models\AdminNotification;
use App\Models\Bid;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Models\TrialTask;
use Inertia\Inertia;

class ManageTaskController extends Controller
{
    public function index()
    {
        abort_if(!gs('trial_task'), 404);

        $pageTitle = "Trial Task List";
        $buyer = auth()->guard('buyer')->user();
        $tasks = TrialTask::searchable(['title'])->filter(['status'])->where('buyer_id', $buyer->id)->with(['job'])->dateFilter()->orderByDesc('id')->paginate(getPaginate());

        return Inertia::render('Buyer/Task/Index', [
            'pageTitle' => $pageTitle,
            'tasks' => TaskResource::buyerTasks($tasks),
        ]);
    }

    public function trialTaskForm($bidId, $taskId = null)
    {
        abort_if(!gs('trial_task'), 404);

        $buyer = auth()->guard('buyer')->user();
        $bid = Bid::where('buyer_id', $buyer->id)->findOrFail($bidId);

        if ($bid->status != 0) {
            $notify[] = ['error', 'You cannot assign trial task for an approved bid.'];
            return back()->withNotify($notify);
        }

        $task = null;
        $pageTitle = 'Assign Trial Task';

        if ($taskId) {
            $task = TrialTask::where('buyer_id', $buyer->id)->where('id', $taskId)->firstOrFail();
            $pageTitle = 'Edit Trial Task';
        }

        return Inertia::render('Buyer/Task/Form', [
            'pageTitle' => $pageTitle,
            'formData' => TaskResource::buyerForm($task, $bid),
        ]);
    }


    public function trialTaskStore(Request $request, $bidId, $taskId = null)
    {
        abort_if(!gs('trial_task'), 404);

        $request->validate([
            'title'       => 'required|string|max:255',
            'amount'      => 'required|numeric|gt:0',
            'description' => 'required|string',
            'deadline'    => 'required|date|after_or_equal:today',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $bid   = Bid::where('buyer_id', $buyer->id)->findOrFail($bidId);

        $task = $taskId
            ? TrialTask::where('buyer_id', $buyer->id)->findOrFail($taskId)
            : new TrialTask();

        if (!$taskId && $buyer->balance < $request->amount) {
            $notify[] = ['error', FriendlyNotify::insufficientBalance(0, 'project')];
            return back()->withNotify($notify);
        }

        if (!$taskId) {
            $task->amount  = $request->amount;
        }

        $task->buyer_id    = $buyer->id;
        $task->user_id     = $bid->user_id;
        $task->job_id      = $bid->job_id;
        $task->bid_id      = $bid->id;
        $task->title       = $request->title;
        $task->description = $request->description;
        $task->deadline    = $request->deadline;
        $task->save();

        if (!$taskId && gs('escrow_payment')) {

            $buyer->balance -= $task->amount;
            $buyer->save();

            $transaction               = new Transaction();
            $transaction->buyer_id     = $buyer->id;
            $transaction->task_id      = $task->id;
            $transaction->project_id   = 0;
            $transaction->amount       = $task->amount;
            $transaction->post_balance = $buyer->balance;
            $transaction->trx_type     = '-';
            $transaction->details      = 'Trial task hold amount: ' . $task->title;
            $transaction->trx          = getTrx();
            $transaction->remark       = 'trial_task_hold';
            $transaction->save();

            $task->escrow_amount  = $task->amount;
            $task->save();
        }

        notify($task->user, 'TRIAL_TASK_ASSIGN', [
            'buyer'  => $buyer->username,
            'title'  => $task->title,
            'deadline'  => showDateTime($task->deadline, 'd M, Y'),
            'amount' => showAmount($task->amount, currencyFormat: false),
        ]);

        $notify[] = ['success', 'Trial task saved successfully.'];
        return to_route('buyer.trial.task.index')->withNotify($notify);
    }

    public function fileDetail($id)
    {
        $pageTitle = 'Project Details';
        $task = TrialTask::with(['user', 'buyer'])->where('id', $id)->firstOrFail();
        return Inertia::render('Buyer/Task/Detail', [
            'pageTitle' => $pageTitle,
            'task' => TaskResource::buyerDetail($task),
        ]);
    }

    public function downloadFile($id, $file)
    {
        $buyer = auth()->guard('buyer')->user();
        $task = TrialTask::where('id', $id)->where('buyer_id', $buyer->id)->first();

        if (!$task) {
            $notify[] = ['error', 'Task not found!'];
            return back()->withNotify($notify);
        }
        $path = getFilePath('taskFile');
        $file = decrypt($file);
        $fullPath = $path . '/' . $file;
        if (!file_exists($fullPath)) {
            abort(404, 'File not found');
        }
        $title = slug(substr($task->title, 0, 20));
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimetype = mime_content_type($fullPath);
        header('Content-Disposition: attachment; filename="' . $title . '.' . $ext . '";');
        header("Content-Type: " . $mimetype);
        return readfile($fullPath);
    }

    public function complete(Request $request, $id)
    {
        $buyer = auth()->guard('buyer')->user();
        $task = TrialTask::where('buyer_id',  $buyer->id)->where('status', Status::TASK_COMPLETED)->find($id);
        if (!$task) {
            $notify[] = ['error', 'Task not found'];
            return back()->withNotify($notify);
        }

        $freelancer = $task->user;
        $amount =  $task->amount;

        if ($task->escrow_amount == 0 && $buyer->balance <  $amount) {
            $notify[] = ['error', FriendlyNotify::insufficientBalance(0, 'project')];
            return back()->withNotify($notify);
        }

        //if author not used escrow!
        if ($task->escrow_amount == 0) {
            $buyer->balance -= $amount;
            $buyer->save();

            $transaction = new Transaction();
            $transaction->buyer_id = $buyer->id;
            $transaction->amount = $amount;
            $transaction->post_balance = $buyer->balance;
            $transaction->trx_type = '-';
            $transaction->remark = 'completed_task';
            $transaction->details = 'Amount deduct for task: ' . $task->title;
            $transaction->trx = getTrx();
            $transaction->save();
        } else {
            $trxData = Transaction::where('task_id', $task->id)->first();
            $transaction = $trxData ? $trxData : new Transaction();
            $transaction->remark = 'completed_task';
            $transaction->details = 'Escrow amount release for task: ' . $task->title;
            $transaction->trx = $trxData ? $trxData->trx : null;
            $transaction->save();

            $task->escrow_amount = 0;
        }

        $task->status = Status::TASK_FINISHED;
        $task->save();

        // Manage Charge Percent;
        $chargeAmount = gs('fixed_trial_task_charge');

        $finalIncome  =  $amount - $chargeAmount;
        $freelancer->balance += $amount;
        $freelancer->save();

        $trx = GetTrx();
        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $amount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '+';
        $transaction->details      = 'Trial Task completed for ' . $task->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'completed_task';
        $transaction->save();


        $freelancer->balance -= $chargeAmount;
        $freelancer->earning += $finalIncome;
        $freelancer->save();

        $freelancer->updateBadge();

        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $chargeAmount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '-';
        $transaction->details      = 'Trial Task completed commission for ' . $task->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'commission';
        $transaction->save();

        notify($freelancer, 'TRIAL_TASK_FINISHED', [
            'freelancer' => $freelancer->fullname,
            'job'      => $task->title,
            'income'   => showAmount($finalIncome, currencyFormat: false),
            'charge'   => showAmount($chargeAmount, currencyFormat: false),
            'buyer'    => $buyer->fullname,
        ]);

        $notify[] = ['success', 'Project completed successfully'];
        return to_route('buyer.trial.task.index')->withNotify($notify);
    }

    public function report(Request $request, $id)
    {
        $request->validate([
            'report_reason' => 'required|string',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $task = TrialTask::submitted()->with('user')->where('buyer_id',  $buyer->id)->find($id);
        if (!$task) {
            $notify[] = ['error', 'Task not found'];
            return back()->withNotify($notify);
        }

        $task->status = Status::TASK_REPORTED;
        $task->report_reason =  $request->report_reason;
        $task->save();

        $freelancer = $task->user;

        $conversation = Conversation::where('buyer_id', $buyer->id)
            ->where('user_id', $freelancer->id)
            ->first();

        if (!$conversation) {
            $conversation = new Conversation();
            $conversation->user_id = $task->user_id;
            $conversation->buyer_id = $task->buyer_id;
            $conversation->save();
        }

        $message          = new Message();
        $message->message = 'REPORTED:: ' . $request->report_reason;
        $message->conversation_id = $conversation->id;
        $message->buyer_id = $conversation->buyer_id;
        $message->buyer_read_at = now();
        $message->save();

        notify($freelancer, 'TRIAL_TASK_REPORTED', [
            'job'  => $task->title,
            'buyer'  => $buyer->fullname,
            'reason' => $task->report_reason,
        ]);

        $adminNotification            = new AdminNotification();
        $adminNotification->buyer_id  = $task->buyer_id;
        $adminNotification->title     = 'A new report has been submitted by ' . $task->buyer->fullname;
        $adminNotification->click_url = urlPath('admin.trial.task.details', $task->id);
        $adminNotification->save();

        $notify[] = ['success', 'Project reported successfully'];
        return to_route('buyer.trial.task.index')->withNotify($notify);
    }

    public function cancel(Request $request, $id)
    {
        $request->validate([
            'cancel_reason' => 'required|string',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $task = TrialTask::pending()->with('user')->where('buyer_id',  $buyer->id)->find($id);
        if (!$task) {
            $notify[] = ['error', 'Task not found'];
            return back()->withNotify($notify);
        }

        if ($task->escrow_amount > 0) {
            $buyer->balance += $task->escrow_amount;
            $buyer->save();

            $transaction = new Transaction();
            $transaction->buyer_id = $buyer->id;
            $transaction->amount = $task->escrow_amount;
            $transaction->post_balance = $buyer->balance;
            $transaction->trx_type = '+';
            $transaction->remark = 'cancel_task';
            $transaction->details = 'Amount rebate for cancel task: ' . $task->title;
            $transaction->trx = getTrx();
            $transaction->save();

            $task->escrow_amount = 0;
        }

        $task->status = Status::TASK_CANCELED;
        $task->cancel_reason =  $request->cancel_reason;
        $task->save();

        $freelancer = $task->user;

        notify($freelancer, 'TRIAL_TASK_CANCELED', [
            'job'  => $task->title,
            'buyer'  => $buyer->fullname,
            'reason' => $task->report_reason,
        ]);

        $notify[] = ['success', 'Project cancel successfully'];
        return to_route('buyer.trial.task.index')->withNotify($notify);
    }
}
