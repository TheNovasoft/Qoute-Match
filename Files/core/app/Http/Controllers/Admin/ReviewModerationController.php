<?php

namespace App\Http\Controllers\Admin;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Lib\AdminResource;
use App\Lib\StructuredReviewService;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewModerationController extends Controller
{
    public function index()
    {
        return $this->listByStatus(request()->get('status', 'pending'));
    }

    public function pending()
    {
        return $this->listByStatus('pending');
    }

    public function approved()
    {
        return $this->listByStatus('approved');
    }

    public function hidden()
    {
        return $this->listByStatus('hidden');
    }

    public function verified()
    {
        return $this->listByStatus('verified');
    }

    public function disputed()
    {
        return $this->listByStatus('disputed');
    }

    protected function listByStatus(string $status)
    {
        $pageTitle = 'Review Moderation';

        $reviews = Review::query()
            ->with(['user', 'buyer', 'project.job'])
            ->when($status === 'pending', fn ($query) => $query->where('status', Status::REVIEW_PENDING))
            ->when($status === 'approved', fn ($query) => $query->where('status', Status::REVIEW_APPROVED))
            ->when($status === 'hidden', fn ($query) => $query->where('status', Status::REVIEW_HIDDEN))
            ->when($status === 'verified', fn ($query) => $query->where('is_verified', Status::YES))
            ->when($status === 'disputed', fn ($query) => $query->whereIn('investigation_status', [
                Status::REVIEW_INVESTIGATION_OPEN,
                Status::REVIEW_INVESTIGATION_ACTIVE,
            ]))
            ->when(request()->filled('user_id'), fn ($query) => $query->where('user_id', request()->integer('user_id')))
            ->latest('id')
            ->paginate(getPaginate());

        return Inertia::render('Admin/Reviews/Index', [
            'pageTitle' => $pageTitle,
            'reviews' => AdminResource::reviews($reviews, $status),
        ]);
    }

    public function detail($id)
    {
        $pageTitle = 'Review Detail';
        $review = Review::with(['user', 'buyer', 'project.job'])->findOrFail($id);

        return Inertia::render('Admin/Reviews/Detail', [
            'pageTitle' => $pageTitle,
            'review' => AdminResource::reviewDetail($review),
        ]);
    }

    public function approve($id)
    {
        $review = Review::with('user')->findOrFail($id);

        if ((int) $review->status === Status::REVIEW_APPROVED) {
            $notify[] = ['error', 'This review is already approved.'];
            return back()->withNotify($notify);
        }

        StructuredReviewService::approve($review);

        $notify[] = ['success', 'Review approved and published on the provider profile.'];
        return back()->withNotify($notify);
    }

    public function hide(Request $request, $id)
    {
        $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $review = Review::with('user')->findOrFail($id);

        if ((int) $review->status === Status::REVIEW_HIDDEN) {
            $notify[] = ['error', 'This review is already hidden.'];
            return back()->withNotify($notify);
        }

        StructuredReviewService::hide($review, $request->admin_note);

        $notify[] = ['success', 'Abusive / unwanted review hidden from public profiles.'];
        return back()->withNotify($notify);
    }

    public function verify($id)
    {
        $review = Review::with('user')->findOrFail($id);
        $makeVerified = ! (bool) $review->is_verified;

        StructuredReviewService::markVerified($review, $makeVerified);

        $notify[] = ['success', $makeVerified
            ? 'Review marked as verified.'
            : 'Verified badge removed from this review.'];

        return back()->withNotify($notify);
    }

    public function investigate(Request $request, $id)
    {
        $request->validate([
            'investigation_status' => 'required|integer|in:0,1,2,3',
            'provider_complaint' => 'nullable|string|max:2000',
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $review = Review::with('user')->findOrFail($id);

        StructuredReviewService::updateInvestigation(
            $review,
            (int) $request->investigation_status,
            $request->provider_complaint,
            $request->admin_note
        );

        $notify[] = ['success', 'Dispute / investigation status updated.'];
        return back()->withNotify($notify);
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'admin_reply' => 'required|string|max:2000',
        ]);

        $review = Review::with('user')->findOrFail($id);

        StructuredReviewService::replyToProvider($review, $request->admin_reply);

        $notify[] = ['success', 'Reply saved and sent to the provider.'];
        return back()->withNotify($notify);
    }
}
