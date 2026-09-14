<?php

namespace App\Http\Controllers\User;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\DashboardResource;
use App\Lib\DisputeService;
use App\Models\AdminNotification;
use App\Models\Bid;
use App\Models\BuyerReview;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Lib\MilestoneService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $pageTitle  = 'My Projects';
        $freelancer = auth()->user();
        $projects   = Project::searchable(['job:title', 'buyer:username'])->filter(['status'])->dateFilter()->orderBy('id', 'desc')->where('user_id', $freelancer->id)->with(['bid.job', 'user', 'buyer', 'review', 'buyerReview'])->paginate(getPaginate());
        return Inertia::render('User/Projects/Index', [
            'pageTitle' => $pageTitle,
            'projects' => DashboardResource::projects($projects, 'freelancer'),
            'filters' => request()->only(['search', 'status', 'date']),
        ]);
    }

    public function detail($id)
    {
        $pageTitle = 'Project Details';
        $project   = Project::with(['job', 'bid', 'user', 'buyer', 'review', 'buyerReview', 'milestones'])
            ->where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $dispute = Dispute::where('project_id', $project->id)->latest('id')->first();
        $canReport = !$dispute?->isActive() && in_array((int) $project->status, [
            Status::PROJECT_RUNNING,
            Status::PROJECT_BUYER_REVIEW,
            Status::PROJECT_PARTIAL_COMPLETED,
        ], true);
        $disputeDetailRoute = $dispute ? route('user.disputes.detail', $dispute->id) : null;

        return Inertia::render('User/Projects/Detail', [
            'pageTitle' => $pageTitle,
            'project' => DashboardResource::projectDetail($project, 'freelancer', [
                'milestones' => MilestoneService::resourceCollection($project),
                'milestoneSubmitUrl' => route('user.project.milestones.submit', [$project->id, '__ID__']),
            ]),
            'canReport' => $canReport,
            'dispute' => $dispute ? ['id' => $dispute->id, 'subject' => $dispute->subject] : null,
            'disputeDetailRoute' => $disputeDetailRoute,
            'disputeTypes' => DashboardResource::disputeTypes(),
        ]);
    }

    public function projectUploadForm($id)
    {
        $pageTitle  = 'Upload Assigned Project';
        $freelancer = auth()->user();
        $mainQuery  = Project::query();
        $project    = (clone $mainQuery)->where('user_id', $freelancer->id)->with('bid')->findOrFail($id);

        //Buyer project assignments
        $buyer                  = $project->buyer;
        $buyerProjectAssignment = (clone $mainQuery)->where('buyer_id', $project->buyer_id);
        $buyerJobs              = $buyerProjectAssignment->count();
        $buyerSuccessJobs       = (clone $buyerProjectAssignment)->where('status', Status::PROJECT_COMPLETED)->count();
        $buyerSuccessJobPercent = ($buyerJobs > 0) ? ($buyerSuccessJobs / $buyerJobs) * 100 : 0;

        return Inertia::render('User/Projects/Upload', [
            'pageTitle' => $pageTitle,
            'project' => DashboardResource::projectDetail($project, 'freelancer'),
            'buyer' => [
                'fullname' => $buyer->fullname,
                'image' => getImage(getFilePath('buyerProfile') . '/' . $buyer->image, avatar: true),
                'country' => $buyer->country_name,
                'address' => $buyer->address,
            ],
            'buyerStats' => [
                'totalJobs' => $buyerJobs,
                'successJobs' => $buyerSuccessJobs,
                'successPercent' => showAmount($buyerSuccessJobPercent, currencyFormat: false),
            ],
        ]);
    }

    public function projectUpload(Request $request, $id)
    {
        $project = Project::where('status','!=', Status::PROJECT_COMPLETED)->find($id);

        if (!$project) {
            $notify[] = ['error', 'The requested project was not found or has already been completed.'];
            return back()->withNotify($notify);
        }

        if (auth()->user()->id !== $project->user_id) {
            $notify[] = ['error', 'You are not authorized to upload files for this project, right now.'];
            return back()->withNotify($notify);
        }
        $allowedExtension = ['zip', 'rar', 'pdf', 'doc', 'docx', 'xls', 'xlsx', '7zip', 'jpg', 'jpeg', 'png', 'webp', 'heic'];
        $request->validate([
            'comments'     => 'nullable|string',
            'project_file' => [
                'required',
                'file',
                function ($attribute, $value, $fail) use ($request, $allowedExtension) {
                    $projectFile = $request->file('project_file');
                    if ($projectFile) {
                        $ext = strtolower($projectFile->getClientOriginalExtension());
                        if (!in_array($ext, $allowedExtension)) {
                            $fail("Only " . implode(', ', $allowedExtension) . " files are allowed.");
                        }
                    } else {
                        $fail("The file is invalid or missing.");
                    }
                },
            ],
        ]);

        if ($request->file('project_file')) {
            try {
                $old                   = basename($project->project_file) ?? '';
                $formProjectFile       = $request->file('project_file');
                $directory             = date("Y") . "/" . date("m") . "/" . date("d");
                $uploadPath            = getFilePath('projectFile') . '/' . $directory;
                $file                  = $directory . '/' . fileUploader($formProjectFile, $uploadPath, null, $old);
                $project->project_file = $file;
            } catch (\Exception $exp) {
                $notify[] = ['error', 'File could not upload'];
                return $notify;
            }
        }

        $project->comments    = @$request->comments;
        $project->status      = Status::PROJECT_BUYER_REVIEW;
        $project->uploaded_at = now();
        $project->uploaded_at = now();
        $project->upload_count += 1;
        $project->save();

        notify($project->buyer, 'PROJECT_BUYER_REVIEW', [
            'freelancer' => $project->user->fullname,
            'job'        => $project->job->title,
            'comments'   => $project->comments,
            'link'       => route('buyer.project.detail', $project->id),
        ]);

        $notify[] = ['success', 'Project file uploaded successfully for buyer review.'];
        return to_route('user.project.index')->withNotify($notify);
    }

    public function downloadFile($id, $file)
    {
        $freelancer = auth()->user();
        $project    = Project::where('id', $id)->where('user_id', $freelancer->id)->with('job')->first();

        if (!$project) {
            $notify[] = ['error', 'Project not found!'];
            return back()->withNotify($notify);
        }
        $path = getFilePath('projectFile');
        $file = decrypt($file);

        $full_path = $path . '/' . $file;
        $title     = slug(substr($project->job->title, 0, 20));
        $ext       = pathinfo($file, PATHINFO_EXTENSION);
        $mimetype  = mime_content_type($full_path);
        header('Content-Disposition: attachment; filename="' . $title . '.' . $ext . '";');
        header("Content-Type: " . $mimetype);
        return readfile($full_path);
    }

    public function storeReviewRating(Request $request, $id)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string',
        ]);

        $freelancer = auth()->user();
        $project    = Project::completed()->where('user_id', $freelancer->id)->findOrFail($id);
        $buyer      = $project->buyer;

        $review = BuyerReview::where('project_id', $id)->where('user_id', $freelancer->id)->first();

        if ($review) {
            $notify[] = ['success', 'Review & rating updated successfully'];
        } else {
            $review             = new BuyerReview();
            $review->buyer_id   = $project->buyer_id;
            $review->user_id    = $freelancer->id;
            $review->project_id = $project->id;
            $notify[]           = ['success', 'Review & rating added successfully'];
        }

        $review->rating = $request->rating;
        $review->review = $request->review;
        $review->save();

        $buyer->avg_rating = BuyerReview::where('buyer_id', $buyer->id)->avg('rating') ?? 0;
        $buyer->save();

        return back()->withNotify($notify);
    }

    public function report(Request $request, $id)
    {
        $request->validate([
            'report_reason' => 'required|string',
            'dispute_type'  => 'nullable|string|in:quality_issue,payment_issue,communication,scope_mismatch,no_delivery,other',
        ]);

        $freelancer = auth()->user();
        $project = Project::where('user_id', $freelancer->id)
            ->whereIn('status', [
                Status::PROJECT_RUNNING,
                Status::PROJECT_BUYER_REVIEW,
                Status::PROJECT_PARTIAL_COMPLETED,
            ])
            ->with('buyer', 'job')
            ->find($id);

        if (!$project) {
            $notify[] = ['error', 'Project not found or cannot be reported in its current state.'];
            return back()->withNotify($notify);
        }

        $bid = Bid::accepted()->where('project_id', $project->id)->with('job')->first();
        if (!$bid) {
            $notify[] = ['error', 'Quote not found for this project.'];
            return back()->withNotify($notify);
        }

        $project->status = Status::PROJECT_REPORTED;
        $project->report_reason = $request->report_reason;
        $project->save();

        $conversation = Conversation::where('buyer_id', $project->buyer_id)
            ->where('user_id', $freelancer->id)
            ->first();

        if ($conversation) {
            $message = new Message();
            $message->message = 'REPORTED:: ' . $request->report_reason;
            $message->conversation_id = $conversation->id;
            $message->user_id = $freelancer->id;
            $message->user_read_at = now();
            $message->save();
        }

        notify($project->buyer, 'PROJECT_REPORTED', [
            'job'    => $project->job->title,
            'buyer'  => $project->buyer->fullname,
            'reason' => $project->report_reason,
        ]);

        $adminNotification = new AdminNotification();
        $adminNotification->user_id = $freelancer->id;
        $adminNotification->buyer_id = $project->buyer_id;
        $adminNotification->title = 'A new report has been submitted by provider ' . $freelancer->fullname;
        $adminNotification->click_url = urlPath('admin.project.details', $project->id);
        $adminNotification->save();

        DisputeService::createFromProjectReport(
            $project,
            $bid,
            'provider',
            $request->report_reason,
            $request->input('dispute_type', 'other')
        );

        $notify[] = ['success', 'Project reported successfully'];
        return back()->withNotify($notify);
    }

    public function submitMilestone(Request $request, $projectId, $milestoneId)
    {
        $request->validate([
            'notes' => 'nullable|string|max:2000',
        ]);

        $project = Project::where('user_id', auth()->id())->findOrFail($projectId);
        $milestone = ProjectMilestone::where('project_id', $project->id)->findOrFail($milestoneId);

        try {
            MilestoneService::submit($milestone, $request->notes);
        } catch (\InvalidArgumentException $e) {
            $notify[] = ['error', $e->getMessage()];
            return back()->withNotify($notify);
        }

        $notify[] = ['success', 'Milestone marked as complete. Waiting for customer approval.'];
        return back()->withNotify($notify);
    }
}
