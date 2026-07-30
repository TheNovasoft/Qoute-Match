<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AdminResource;
use App\Lib\RequestFormService;
use App\Models\Job;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManageJobController extends Controller
{

    public function allJobs($catId = 0)
    {
        return $this->renderJobList('All Jobs', null, (int) $catId);
    }

    public function approvedJobs()
    {
        return $this->renderJobList('Approved Jobs', 'approved');
    }


    public function pendingJobs()
    {
        return $this->renderJobList('Pending Jobs', 'pending');
    }

    public function rejectedJobs()
    {
        return $this->renderJobList('Rejected|Unverified Jobs', 'rejected');
    }



    public function publishedJobs()
    {
        return $this->renderJobList('Published|Verified jobs', 'published');
    }


    public function draftedJobs()
    {
        return $this->renderJobList('Drafted Jobs', 'drafted');
    }
    public function processingJobs()
    {
        return $this->renderJobList('Processing Jobs', 'processing');
    }
    public function completedJobs()
    {
        return $this->renderJobList('Completed Jobs', 'completed');
    }


    protected function renderJobList(string $pageTitle, ?string $scope = null, int $catId = 0)
    {
        $jobs = $this->jobData($scope, $catId);
        $jobs->load(['buyer', 'category', 'subcategory']);

        return Inertia::render('Admin/Jobs/Index', [
            'pageTitle' => $pageTitle,
            'jobs' => AdminResource::jobs($jobs, $scope ?? 'all'),
        ]);
    }

    protected function jobData($scope = null, $catId = 0)
    {
        $jobs = Job::query();
        if ($scope) {
            $jobs = Job::$scope();
            if ($scope == "pending") {
                $jobs->where('status', Status::JOB_PUBLISH);
            }
        }
        if ($catId) {
            $jobs =  $jobs->where('category_id', $catId);
        }
        return $jobs->searchable(['buyer:username', 'title', 'budget', 'category:name', 'subcategory:name'])->orderBy('id', 'desc')->paginate(getPaginate());
    }


    public function detail($id)
    {
        $job = Job::with(['skills', 'buyer', 'category', 'subcategory'])->findOrFail($id);
        $pageTitle = 'Job Detail' . ($job->buyer?->fullname ? ' — ' . $job->buyer->fullname : '');

        $widget['total_bid'] = (clone $job)->bids()->count();
        $widget['total_interview'] = (clone $job)->interviews;

        $project = (clone $job)->project;
        if ($project) {
            $assignFreelancer = $project->where('status', Status::PROJECT_RUNNING)->with('user', 'buyer')->first();
            $widget['assign_freelancer'] = $assignFreelancer->user ?? '';
        }
        $widget['assign_freelancer'] = '';
        $requestFields = RequestFormService::displayValues($job->request_data, 'admin.download.attachment');

        return Inertia::render('Admin/Jobs/Detail', [
            'pageTitle' => $pageTitle,
            'job' => AdminResource::jobDetail($job, $widget, $requestFields),
        ]);
    }

    public function jobApprove($id)
    {
        $job = Job::with('buyer')->findOrFail($id);

        if ((int) $job->status === Status::JOB_DRAFT) {
            $job->status = Status::JOB_PUBLISH;
        }

        $job->is_approved = Status::JOB_APPROVED;
        $job->save();

        \App\Lib\JobPostNotificationService::notifyApproved($job);

        $notify[] = ['success', 'Job approved successfully. The poster has been emailed and the request is now live on Find Jobs.'];
        return to_route('admin.jobs.approved')->withNotify($notify);
    }

    public function jobReject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required'
        ]);
        $job = Job::with('buyer')->findOrFail($id);
        $job->is_approved = Status::JOB_REJECTED;
        $job->status = Status::JOB_FINISHED;
        $job->rejection_reason = $request->reason;
        $job->save();

        \App\Lib\JobPostNotificationService::notifyRejected($job, $request->reason);

        $notify[] = ['success', 'Job rejected successfully'];
        return to_route('admin.jobs.rejected')->withNotify($notify);
    }

    public function jobDelete($id)
    {
        $job = Job::with(['project', 'bids'])->findOrFail($id);

        if ($job->project && in_array((int) $job->project->status, [Status::PROJECT_RUNNING, Status::PROJECT_BUYER_REVIEW], true)) {
            $notify[] = ['error', 'Cannot delete a request with an active project in progress.'];
            return back()->withNotify($notify);
        }

        if ($job->bids()->where('status', Status::BID_ACCEPTED)->exists()) {
            $notify[] = ['error', 'Cannot delete a request after a provider has been hired.'];
            return back()->withNotify($notify);
        }

        foreach ($job->bids as $bid) {
            $bid->delete();
        }

        foreach ($job->conversations()->get() as $conversation) {
            $conversation->messages()->delete();
            $conversation->delete();
        }

        if ($job->project) {
            $job->project->delete();
        }

        $job->skills()->detach();
        $job->delete();

        $notify[] = ['success', 'Request deleted successfully.'];

        $fallback = route('admin.jobs.approved');
        $previous = url()->previous();
        if ($previous && ! str_contains($previous, '/admin/jobs/details/')) {
            return redirect()->to($previous)->withNotify($notify);
        }

        return redirect()->to($fallback)->withNotify($notify);
    }
}
