<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AdminResource;
use App\Models\bid;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Validation\ValidationException;
use App\Models\Project;
use App\Models\Transaction;
use Carbon\Carbon;
use App\Rules\FileTypeValidate;
use Illuminate\Http\Request;
use App\Events\LiveChat;
use App\Models\BuyerReview;
use App\Models\Charge;
use App\Models\Review;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ProjectManagerController extends Controller
{
    public function index()
    {
        return $this->renderProjectList('All Projects', $this->projectData(), 'all');
    }
    public function reported()
    {
        return $this->renderProjectList('Reported Projects', $this->projectData('reported'), 'reported');
    }
    public function running()
    {
        return $this->renderProjectList('Running Projects', $this->projectData('running'), 'running');
    }
    public function reviewing()
    {
        return $this->renderProjectList('Reviewing Projects', $this->projectData('reviewing'), 'reviewing');
    }
    public function rejected()
    {
        return $this->renderProjectList('Rejected Projects', $this->projectData('rejected'), 'rejected');
    }

    public function completed()
    {
        return $this->renderProjectList('Completed Projects', $this->projectData('completed'), 'completed');
    }
    
    public function partialCompleted()
    {
        return $this->renderProjectList('Partial Completed Projects', $this->projectData('partial'), 'partial');
    }

    protected function renderProjectList(string $pageTitle, $projects, string $scope = 'all')
    {
        $projects->load(['job', 'user', 'buyer', 'bid']);

        return Inertia::render('Admin/Projects/Index', [
            'pageTitle' => $pageTitle,
            'projects' => AdminResource::projects($projects, $scope),
        ]);
    }

    protected function projectData($scope = null)
    {
        if ($scope) {
            $projects = Project::$scope();
        } else {
            $projects = Project::query();
        }

        $projects = $projects->searchable(['job:title', 'user:username', 'buyer:username'])->with('job', 'user', 'buyer')->orderBy('id', 'DESC');
        if (request()->date) {
            try {
                $date      = explode('-', request()->date);
                $startDate = Carbon::parse(trim($date[0]))->format('Y-m-d');
                $endDate = @$date[1] ? Carbon::parse(trim(@$date[1]))->format('Y-m-d') : $startDate;
            } catch (\Exception $e) {
                throw ValidationException::withMessages(['error' => 'Unauthorized action']);
            }
            request()->merge(['start_date' => $startDate, 'end_date' => $endDate]);
            $projects =  $projects->whereHas('bid', function ($query) use ($startDate, $endDate) {
                $query->whereDate('deadline', '>=', $startDate)->whereDate('deadline', '<=', $endDate);
            });
        }
        return $projects->paginate(getPaginate());
    }

    public function details($id)
    {
        $pageTitle = "Project Details";
        $project   = Project::with('job.bids', 'bid', 'buyer', 'user')->findOrFail($id);
        $convId    =  Conversation::where('user_id', $project->user_id)->where('buyer_id', $project->buyer_id)->first();

        return Inertia::render('Admin/Projects/Detail', [
            'pageTitle' => $pageTitle,
            'project' => AdminResource::projectDetail($project, $convId),
        ]);
    }
    public function downloadFile($id, $file)
    {
        $project = Project::where('id', $id)->with('job')->first();
        if (!$project) {
            $notify[] = ['error', 'Project not found!'];
            return back()->withNotify($notify);
        }
        $path = getFilePath('projectFile');
        $file = decrypt($file);

        $full_path = $path . '/' . $file;
        $title = slug(substr($project->job->title, 0, 20));
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimetype = mime_content_type($full_path);
        header('Content-Disposition: attachment; filename="' . $title . '.' . $ext . '";');
        header("Content-Type: " . $mimetype);
        return readfile($full_path);
    }


    public function rejectProject($id)
    {
        $project = Project::reported()->where('id', $id)->first();
        if (!$project) {
            $notify[] = ['error', 'Project not found'];
            return back()->withNotify($notify);
        }
        $buyer  = $project->buyer;
        $freelancer   = $project->user;

        $project->status = Status::PROJECT_REJECTED;
        $project->save();

        $job =  $project->job;
        $job->is_approved = Status::JOB_REJECTED;
        $job->status = Status::JOB_FINISHED;
        $job->save();

        if ($project->escrow_amount) {
            $buyer->balance += $project->escrow_amount;
            $buyer->save();

            $targetedTrx  = Transaction::where('buyer_id', $buyer->id)->where('project_id', $project->id)->first()->trx;
            $transaction               = new Transaction();
            $transaction->buyer_id    = $buyer->id;
            $transaction->project_id   = $project->id;
            $transaction->amount       = $project->escrow_amount;
            $transaction->post_balance = $buyer->balance;
            $transaction->trx_type     = '+';
            $transaction->details      = 'Reported project rejected, job ' . $job->title;
            $transaction->trx          = @$targetedTrx;
            $transaction->remark       = 'hold_amount_released';
            $transaction->save();
        }

        $notificationData = [
            'freelancer' => $freelancer->fullname,
            'buyer' => $buyer->fullname,
            'job' => $project->job->title,
            'escrow_amount' => $project->escrow_amount ? showAmount($project->escrow_amount) : 'N/A',
        ];
        notify($buyer, 'REPORTED_PROJECT_REJECTED', $notificationData);
        notify($freelancer, 'REPORTED_PROJECT_REJECTED', $notificationData);


        $notify[] = ['success', 'Project rejected successfully'];
        return back()->withNotify($notify);
    }

    public function completeProject($id)
    {

        $project = Project::reported()->with('user', 'buyer')->where('id', $id)->first();
        if (!$project) {
            $notify[] = ['error', 'Project not found'];
            return back()->withNotify($notify);
        }
        $freelancer   = $project->user;
        $buyer  = $project->buyer;

        $bid   = Bid::accepted()->where('project_id', $project->id)->with('job')->first();
        if (!$bid) {
            $notify[] = ['error', 'Bid not found of this project'];
            return back()->withNotify($notify);
        }
        $bidAmount =  $bid->bid_amount;

        //if author already used escrow! 
        if (!$project->escrow_amount && $buyer->balance <  $bidAmount) {
            $notify[] = ['error', 'Insufficient balance for this completed project!'];
            return back()->withNotify($notify);
        }

        //if author not used escrow! 
        if (!$project->escrow_amount) {
            $buyer->balance -= $bidAmount;
            $buyer->save();
        }

        $project->status = Status::PROJECT_COMPLETED;
        $project->save();

        $bid->status = Status::BID_COMPLETED;
        $bid->save();

        $job = $bid->job;
        $job->status = Status::JOB_COMPLETED;
        $job->save();

        // Manage Charge Percent;
        $charges = Charge::orderBy('amount', 'asc')->get();
        $freelancerEarning = $freelancer->earning;
        $percentCharge = 0;
        $fixedCharge = gs('fixed_service_charge');
        if (gs('percent_service_charge')) {
            $applied = false;
            foreach ($charges as $charge) {
                if (!is_null($charge->amount) && !is_null($charge->percent)) {
                    if ($freelancerEarning <= $charge->amount) {
                        $percentCharge = $charge->percent;
                        $applied = true;
                        break;
                    }
                }
            }
            if (!$applied) {
                $percentCharge = 0;
            }
        }

        if ($percentCharge > 0) {
            $calculatedChargeAmount = ($bidAmount * $percentCharge) / 100;
            $chargeAmount =   $calculatedChargeAmount + $fixedCharge;
        } else {
            $chargeAmount = $fixedCharge;
        }

        $freelancer->balance += $bidAmount;
        $freelancer->save();


        $trx = getTrx();
        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $bidAmount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '+';
        $transaction->details      = 'Reported project completed, job ' . $job->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'completed_project';
        $transaction->save();

        $finalIncome  =  $bidAmount - $chargeAmount;
        $freelancer->earning += $bidAmount;
        $freelancer->balance -= $chargeAmount;
        $freelancer->save();

        $freelancer->updateBadge();

        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $chargeAmount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '-';
        $transaction->details      = 'Project completed commission for ' . $job->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'commission';
        $transaction->save();



        $conversation = Conversation::where('buyer_id', $buyer->id)
            ->where('user_id', $freelancer->id)
            ->first();

        if (!$conversation) {
            $conversation = new Conversation();
            $conversation->job_id = $project->job_id;
            $conversation->user_id = $project->user_id;
            $conversation->buyer_id = $project->buyer_id;
            $conversation->user_id = $freelancer->id;
            $conversation->save();
        }

        $message          = new Message();
        $message->message = 'COMPLETED:: Reported project completed';
        $message->conversation_id = $conversation->id;
        $message->admin_id = auth()->guard('admin')->id();
        $message->save();

        notify($freelancer, 'REPORTED_PROJECT_COMPLETED', [
            'job'      => $job->title,
            'income'   => showAmount($finalIncome),
            'charge'   => showAmount($chargeAmount),
            'buyer'   => $buyer->fullname
        ]);


        $notify[] = ['success', 'Project completed successfully'];
        return back()->withNotify($notify);
    }

    public function partialCompleteProject(Request $request, $id)
    {
        $request->validate([
            'freelancer_amount' => 'required|numeric|min:0|max:100',
            'buyer_amount'      => 'required|numeric|min:0|max:100',
            'reason'            => 'required|string',
        ]);

        if (($request->freelancer_amount + $request->buyer_amount) != 100) {
            $notify[] = ['error', 'Total percentage must be 100'];
            return back()->withNotify($notify);
        }

        $project = Project::reported()->with('user', 'buyer')->where('id', $id)->first();
        if (!$project) {
            $notify[] = ['error', 'Project not found'];
            return back()->withNotify($notify);
        }

        $freelancer = $project->user;
        $buyer      = $project->buyer;

        $bid = Bid::accepted()->where('project_id', $project->id)->with('job')->first();
        if (!$bid) {
            $notify[] = ['error', 'Bid not found of this project'];
            return back()->withNotify($notify);
        }

        $job       = $bid->job;
        $bidAmount = $bid->bid_amount;

        $freelancerPay = ($bidAmount * $request->freelancer_amount) / 100;
        $buyerRefund   = ($bidAmount * $request->buyer_amount) / 100;

        if (!$project->escrow_amount && $buyer->balance < $bidAmount) {
            $notify[] = ['error', 'Insufficient balance'];
            return back()->withNotify($notify);
        }

        if (!$project->escrow_amount) {
            $buyer->balance -= $bidAmount;
            $buyer->save();
        }

        if ($buyerRefund > 0) {
            $buyer->balance += $buyerRefund;
            $buyer->save();

            $transaction               = new Transaction();
            $transaction->buyer_id     = $buyer->id;
            $transaction->project_id   = $project->id;
            $transaction->amount       = $buyerRefund;
            $transaction->post_balance = $buyer->balance;
            $transaction->trx_type     = '+';
            $transaction->details      = 'Partial project refund for job ' . $job->title;
            $transaction->trx          = getTrx();
            $transaction->remark       = 'partial_refund';
            $transaction->save();
        }

        $charges = Charge::orderBy('amount', 'asc')->get();
        $percentCharge = 0;
        $fixedCharge   = gs('fixed_service_charge');

        if (gs('percent_service_charge')) {
            foreach ($charges as $charge) {
                if ($freelancer->earning <= $charge->amount) {
                    $percentCharge = $charge->percent;
                    break;
                }
            }
        }

        $chargeAmount = $percentCharge > 0
            ? (($freelancerPay * $percentCharge) / 100) + $fixedCharge
            : $fixedCharge;

        $freelancer->balance += $freelancerPay;
        $freelancer->earning += $freelancerPay;
        $freelancer->save();

        $trx = getTrx();

        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $freelancerPay;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '+';
        $transaction->details      = 'Partial project completed for job ' . $job->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'partial_complete';
        $transaction->save();

        $freelancer->balance -= $chargeAmount;
        $freelancer->save();

    
        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $chargeAmount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '-';
        $transaction->details      = 'Partial project commission for job ' . $job->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'commission';
        $transaction->save();

        $freelancer->updateBadge();

        $project->status = Status::PROJECT_PARTIAL_COMPLETED;
        $project->partial_approve_reason = $request->reason;
        $project->save();

        $bid->status = Status::BID_COMPLETED;
        $bid->save();

        $job->status = Status::JOB_COMPLETED;
        $job->is_approved = Status::JOB_APPROVED;
        $job->save();

        notify($freelancer, 'REPORTED_PROJECT_PARTIAL_COMPLETED', [
            'job'        => $job->title,
            'income'     => showAmount($freelancerPay - $chargeAmount),
            'buyer'      => $buyer->fullname,
            'percent'    => $request->freelancer_amount,
        ]);

        notify($buyer, 'REPORTED_PROJECT_PARTIAL_REFUND', [
            'job'        => $job->title,
            'refund'     => showAmount($buyerRefund),
            'freelancer' => $freelancer->fullname,
            'percent'    => $request->buyer_amount,
        ]);

        $notify[] = ['success', 'Project partially completed successfully'];
        return back()->withNotify($notify);
    }


    public function conversation($id, $projectId)
    {
        $pageTitle = 'Conversation';
        $project = Project::with('bid', 'job', 'user', 'buyer')->findOrFail($projectId);
        $conversation = Conversation::findOrFail($id);
        $messages = Message::where('conversation_id', $conversation->id)->with(['user', 'buyer'])->orderBy('created_at', 'ASC')->get();

        $id = $id;
        return \App\Lib\InertiaBridge::admin('admin.project.conversation', compact('pageTitle', 'conversation', 'messages', 'project', 'id'));
    }

    public function conversationStore(Request $request, $id)
    {
        $validation  = Validator::make($request->all(), [
            'message' => 'nullable',
            'message_files'    => ['nullable', 'array', 'max:10'],
            'message_files.*'  => ['nullable', 'max:2048', new FileTypeValidate(['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG', 'pdf', 'PDF', 'docx', 'DOCX', 'doc', 'DOC'])],
        ]);

        if ($validation->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validation->errors()->all(),
            ]);
        }

        if (!($request->message_files) && !($request->message)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Message field is required',
            ]);
        }
        $conversation = Conversation::find($id);

        if (!$conversation) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid conversation!',
            ]);
        }

        $data = initializePusher();

        if (!$data) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pusher connection is required'
            ]);
        }

        if ($request->message_files) {
            foreach ($request->message_files as $message_file) {
                try {
                    $message_files[] = fileUploader($message_file, getFilePath('message'));
                } catch (\Exception $exp) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Couldn\'t upload your files'
                    ]);
                }
            }
        }

        $message = new Message();
        $message->message = $request->message;
        $message->files = $message_files ?? [];
        $message->conversation_id = $id;
        $message->admin_id = auth()->guard('admin')->id();
        $message->save();

        event(new LiveChat($message));

        return response()->json([
            'status' => 'success',
            'message' => 'Message send successfully'
        ]);
    }

    public function removeBuyerReview($id)
    {

        $review = BuyerReview::with('buyer')->findOrFail($id);
        $project =  $review->project;
        $buyer = $review->buyer;
        $review->delete();
        $buyer->avg_rating = $buyer->buyerReviews->count() > 0 ? $buyer->buyerReviews->avg('rating') : 0;
        $buyer->save();
        $project->blocked_review =  Status::YES;
        $project->save();

        $notify[] = ['success', 'Review deleted successfully'];
        return back()->withNotify($notify);
    }
    public function removeFreelancerReview($id)
    {
        $review = Review::with('user')->findOrFail($id);
        $project =  $review->project;
        $freelancer = $review->user;
        $review->delete();
        if ($freelancer) {
            \App\Lib\StructuredReviewService::recalculateUserAverage($freelancer);
        }
        $project->blocked_review =  Status::YES;
        $project->save();

        $notify[] = ['success', 'Review deleted successfully'];
        return back()->withNotify($notify);
    }
}
