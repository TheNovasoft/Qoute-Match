<?php

namespace App\Http\Controllers\Buyer;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\FriendlyNotify;
use App\Models\AdminNotification;
use App\Models\Bid;
use App\Models\Charge;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\Message;
use App\Models\Job;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Lib\MilestoneService;
use App\Models\Review;
use Illuminate\Support\Str;
use App\Models\Transaction;
use App\Lib\DashboardResource;
use App\Lib\StructuredReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $pageTitle = 'My Projects';
        $buyer = auth()->guard('buyer')->user();
        $projects = Project::searchable(['job:title', 'user:username'])->filter(['status'])->dateFilter()->orderBy('id', 'desc')->where('buyer_id',  $buyer->id)->with(['bid.job', 'user.providerVerifications', 'buyer', 'review', 'buyerReview'])->paginate(getPaginate());
        return Inertia::render('Buyer/Projects/Index', [
            'pageTitle' => $pageTitle,
            'projects' => DashboardResource::projects($projects, 'buyer'),
            'filters' => request()->only(['search', 'status', 'date']),
            'statusOptions' => DashboardResource::projectStatusOptions(),
        ]);
    }

    public function detail($id)
    {
        $pageTitle = 'Project Details';
        $buyer = auth()->guard('buyer')->user();
        $project = Project::where('status', '!=', Status::PROJECT_REJECTED)
            ->with(['job', 'bid', 'user.providerVerifications', 'buyer', 'review', 'buyerReview', 'milestones'])
            ->where('buyer_id', $buyer->id)
            ->where('id', $id)
            ->firstOrFail();

        $dispute = Dispute::where('project_id', $project->id)->latest('id')->first();
        $canReport = !$dispute?->isActive() && (int) $project->status === Status::PROJECT_BUYER_REVIEW;
        $disputeDetailRoute = $dispute ? route('buyer.disputes.detail', $dispute->id) : null;

        return Inertia::render('Buyer/Projects/Detail', [
            'pageTitle' => $pageTitle,
            'project' => DashboardResource::projectDetail($project, 'buyer', [
                'milestones' => MilestoneService::resourceCollection($project),
                'milestoneStoreUrl' => route('buyer.project.milestones.store', $project->id),
                'milestoneApproveUrl' => route('buyer.project.milestones.approve', [$project->id, '__ID__']),
            ]),
            'canReport' => $canReport,
            'dispute' => $dispute ? ['id' => $dispute->id, 'subject' => $dispute->subject] : null,
            'disputeDetailRoute' => $disputeDetailRoute,
            'reviewDimensions' => DashboardResource::reviewDimensions(),
            'disputeTypes' => DashboardResource::disputeTypes(),
        ]);
    }

    public function storeMilestones(Request $request, $id)
    {
        $request->validate([
            'milestones' => 'required|array|min:1|max:5',
            'milestones.*.title' => 'required|string|max:190',
            'milestones.*.amount' => 'required|numeric|min:0',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $project = Project::where('buyer_id', $buyer->id)
            ->where('status', Status::PROJECT_RUNNING)
            ->findOrFail($id);

        if ($project->milestones()->exists()) {
            $notify[] = ['error', 'Milestones are already set for this project.'];
            return back()->withNotify($notify);
        }

        MilestoneService::createForProject($project, $request->milestones);
        $notify[] = ['success', 'Payment milestones saved.'];

        return back()->withNotify($notify);
    }

    public function approveMilestone($projectId, $milestoneId)
    {
        $buyer = auth()->guard('buyer')->user();
        $project = Project::where('buyer_id', $buyer->id)->findOrFail($projectId);
        $milestone = ProjectMilestone::where('project_id', $project->id)->findOrFail($milestoneId);

        try {
            MilestoneService::approve($milestone);
        } catch (\InvalidArgumentException $e) {
            $notify[] = ['error', $e->getMessage()];
            return back()->withNotify($notify);
        }

        $notify[] = ['success', 'Milestone approved.'];
        return back()->withNotify($notify);
    }

    public function rehire($id)
    {
        $buyer = auth()->guard('buyer')->user();
        $project = Project::where('buyer_id', $buyer->id)
            ->where('status', Status::PROJECT_COMPLETED)
            ->with(['job.skills', 'user'])
            ->findOrFail($id);

        $source = $project->job;
        $job = new Job();
        $job->buyer_id = $buyer->id;
        $job->title = $source->title;
        $job->slug = Str::slug($source->title) . '-' . Str::lower(Str::random(6));
        $job->category_id = $source->category_id;
        $job->subcategory_id = $source->subcategory_id;
        $job->description = $source->description;
        $job->request_data = $source->request_data;
        $job->project_scope = $source->project_scope;
        $job->job_longevity = $source->job_longevity;
        $job->skill_level = $source->skill_level;
        $job->budget = $source->budget;
        $job->custom_budget = $source->custom_budget;
        $job->questions = $source->questions;
        $job->status = Status::JOB_DRAFT;
        $job->is_approved = Status::JOB_PENDING;
        $job->save();

        if ($source->relationLoaded('skills') && $source->skills->isNotEmpty()) {
            $job->skills()->sync($source->skills->pluck('id'));
        }

        session([
            'rehire_provider_id' => $project->user_id,
            'rehire_provider_name' => $project->user->fullname,
        ]);

        $notify[] = ['success', 'Job copied from your completed project. Review and publish it, then invite ' . $project->user->fullname . ' again.'];

        return redirect()->route('buyer.job.post.details', $job->id)->withNotify($notify);
    }

    public function downloadFile($id, $file)
    {
        $buyer = auth()->guard('buyer')->user();
        $project = Project::where('id', $id)->where('buyer_id', $buyer->id)->with('job')->first();

        if (!$project) {
            $notify[] = ['error', 'Project not found!'];
            return back()->withNotify($notify);
        }
        $path = getFilePath('projectFile');
        $file = decrypt($file);
        $fullPath = $path . '/' . $file;
        if (!file_exists($fullPath)) {
            abort(404, 'File not found');
        }
        $title = slug(substr($project->job->title, 0, 20));
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimetype = mime_content_type($fullPath);
        header('Content-Disposition: attachment; filename="' . $title . '.' . $ext . '";');
        header("Content-Type: " . $mimetype);
        return readfile($fullPath);
    }
    public function complete(Request $request, $id)
    {
        $request->validate(StructuredReviewService::validationRules());

        $scores = StructuredReviewService::normalizeScores($request->input('scores', []));
        $buyer = auth()->guard('buyer')->user();
        $project = Project::reviewing()->where('buyer_id',  $buyer->id)->find($id);
        if (!$project) {
            $notify[] = ['error', 'Project not found'];
            return back()->withNotify($notify);
        }
        $bid   = Bid::accepted()->where('project_id', $project->id)->with('job')->first();
        
        if (!$bid) {
            $notify[] = ['error', 'Bid not found of this project'];
            return back()->withNotify($notify);
        }

        $freelancer = $project->user;
        $bidAmount =  $bid->bid_amount;


        //if author already used escrow!
        if (!$bid->project->escrow_amount && $buyer->balance <  $bidAmount) {
            $notify[] = ['error', FriendlyNotify::insufficientBalance(0, 'project')];
            return back()->withNotify($notify);
        }

        //if author not used escrow!
        if (!$bid->project->escrow_amount) {
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

        if ($percentCharge) {
            $calculatedChargeAmount = ($bidAmount * $percentCharge) / 100;
            $chargeAmount =   $calculatedChargeAmount + $fixedCharge;
        } else {
            $chargeAmount = $fixedCharge;
        }

        $review = new Review();
        $review->user_id    = $freelancer->id;
        $review->buyer_id  = $buyer->id;
        $review->project_id = $project->id;
        StructuredReviewService::applyToReview($review, $scores, $request->review);
        StructuredReviewService::notifyAdminPending($review);

        if ((int) $review->status === Status::REVIEW_APPROVED) {
            StructuredReviewService::recalculateUserAverage($freelancer);
        }

        $finalIncome  =  $bidAmount - $chargeAmount;
        $freelancer->balance += $bidAmount;
        $freelancer->save();

        $trx = GetTrx();
        $transaction               = new Transaction();
        $transaction->user_id      = $freelancer->id;
        $transaction->amount       = $bidAmount;
        $transaction->post_balance = $freelancer->balance;
        $transaction->trx_type     = '+';
        $transaction->details      = 'Project completed for job ' . $job->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'completed_project';
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
        $transaction->details      = 'Project completed commission for ' . $job->title;
        $transaction->trx          = $trx;
        $transaction->remark       = 'commission';
        $transaction->save();

        $trxData = Transaction::where('project_id', $project->id)->first();
        $transaction = $trxData ? $trxData : new Transaction();
        $transaction->buyer_id = $buyer->id;
        $transaction->amount = $bidAmount;
        $transaction->post_balance = $buyer->balance;
        $transaction->trx_type = '-';
        $transaction->remark = 'completed_project';
        $transaction->details = 'Project completed for job ' . $job->title;
        $transaction->trx = $trxData ? $trxData->trx : null;
        $transaction->save();

        $escrowHeld = (float) ($project->escrow_amount ?? 0);
        \App\Lib\InvoiceService::forProjectCompleted(
            $project,
            $bid,
            (float) $bidAmount,
            (float) $chargeAmount,
            $trx,
            \App\Models\Invoice::TYPE_PROJECT_COMPLETED,
            $escrowHeld > 0 ? ['escrow_amount' => showAmount($escrowHeld)] : []
        );

        if ($escrowHeld > 0) {
            $project->escrow_amount = 0;
            $project->save();
        }

        notify($freelancer, 'PROJECT_COMPLETED', [
            'job'      => $job->title,
            'income'   => showAmount($finalIncome),
            'charge'   => showAmount($chargeAmount),
            'buyer'   => $buyer->fullname,
            'rating'   => $review->rating,
            'review'   => $request->review,
        ]);

        $notify[] = ['success', StructuredReviewService::moderationEnabled()
            ? 'Project completed. Your review is pending admin approval.'
            : 'Project completed successfully'];
        return back()->withNotify($notify);
    }

    public function report(Request $request, $id)
    {
        $request->validate([
            'report_reason' => 'required|string',
            'dispute_type'  => 'nullable|string|in:quality_issue,payment_issue,communication,scope_mismatch,no_delivery,other',
        ]);

        $buyer = auth()->guard('buyer')->user();
        $project = Project::reviewing()->with('buyer')->where('buyer_id',  $buyer->id)->find($id);
        if (!$project) {
            $notify[] = ['error', 'Project not found'];
            return back()->withNotify($notify);
        }
        $bid   = Bid::accepted()->where('project_id', $project->id)->with('job')->first();
        if (!$bid) {
            $notify[] = ['error', 'Bid not found of this project'];
            return back()->withNotify($notify);
        }

        $project->status = Status::PROJECT_REPORTED;
        $project->report_reason =  $request->report_reason;
        $project->save();

        $freelancer = $project->user;

        $conversation = Conversation::where('buyer_id', $buyer->id)
            ->where('user_id', $freelancer->id)
            ->first();

        if (!$conversation) {
            $conversation = new Conversation();
            $conversation->user_id = $project->user_id;
            $conversation->buyer_id = $project->buyer_id;
            $conversation->save();
        }

        $message          = new Message();
        $message->message = 'REPORTED:: ' . $request->report_reason;
        $message->conversation_id = $conversation->id;
        $message->buyer_id = $conversation->buyer_id;
        $message->buyer_read_at = now();
        $message->save();

        notify($freelancer, 'PROJECT_REPORTED', [
            'job'  => $project->job->title,
            'buyer'  => $buyer->fullname,
            'reason' => $project->report_reason,
        ]);

        $adminNotification            = new AdminNotification();
        $adminNotification->buyer_id   = $project->buyer_id;
        $adminNotification->title     = 'A new report has been submitted by ' . $project->buyer->fullname;
        $adminNotification->click_url = urlPath('admin.project.details', $project->id);
        $adminNotification->save();

        \App\Lib\DisputeService::createFromProjectReport(
            $project,
            $bid,
            'buyer',
            $request->report_reason,
            $request->input('dispute_type', 'other')
        );

        $notify[] = ['success', 'Project reported successfully'];
        return back()->withNotify($notify);
    }


    public function updateReviewRating(Request $request, $id)
    {
        $request->validate(StructuredReviewService::validationRules());

        $scores = StructuredReviewService::normalizeScores($request->input('scores', []));

        $buyer =  auth()->guard('buyer')->user();
        $project = Project::completed()->where('buyer_id', $buyer->id)->findOrFail($id);

        $freelancer =  $project->user;
        $conversation = Conversation::where('user_id', $freelancer->id)->where('buyer_id', $buyer->id)->first();

        $mainQuery = Review::query();
        $review = (clone $mainQuery)->where('project_id', $id)->first();

        if (!$review) {
            $notify[] = ['error', 'Review not existing!'];
            return back()->withNotify($notify);
        }
        $previousRating = $review->rating;
        $previousReview = $review->review;
        StructuredReviewService::applyToReview($review, $scores, $request->review);
        StructuredReviewService::notifyAdminPending($review);

        if ((int) $review->status === Status::REVIEW_APPROVED) {
            StructuredReviewService::recalculateUserAverage($freelancer);
        }

        if ($conversation) {
            $message = new Message();
            $message->conversation_id = $conversation->id;
            $message->buyer_id    = $buyer->id;
            $message->message    = 'UPDATED: rating- ' . $review->rating . '/(' . $previousRating . ') & review - (' . $request->review . '/' . $previousReview . ')';
            $message->save();
        }

        $notify[] = ['success', StructuredReviewService::moderationEnabled()
            ? 'Review updated and sent for moderation.'
            : 'Review & Rating updated successfully!'];
        return back()->withNotify($notify);
    }
}
