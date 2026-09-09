<?php

namespace App\Http\Controllers\User;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\Job;
use App\Models\Project;
use App\Models\User;
use App\Lib\DashboardResource;
use App\Lib\JobMatchingService;
use App\Lib\QuoteDeadlineService;
use App\Lib\QuoteExpiryService;
use App\Lib\QuoteAmountService;
use App\Lib\RequestFormService;
use App\Rules\FileTypeValidate;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BidController extends Controller
{
    public const MAX_BID_ATTEMPTS = 2;

    public static function bidAttemptsFor(User $freelancer, Job $job): int
    {
        return (int) $freelancer->bids()->where('job_id', $job->id)->count();
    }

    public static function attemptsRemainingFor(User $freelancer, Job $job): int
    {
        return max(0, self::MAX_BID_ATTEMPTS - self::bidAttemptsFor($freelancer, $job));
    }

    public static function jobDeadlineOpen(Job $job): bool
    {
        $deadline = $job->deadline instanceof Carbon
            ? $job->deadline->copy()->endOfDay()
            : Carbon::parse($job->deadline)->endOfDay();

        return $deadline->isFuture();
    }

    public static function jobAllowsBidUpdates(Job $job): bool
    {
        if ((int) $job->status !== Status::JOB_PUBLISH) {
            return false;
        }

        if ((int) $job->is_approved === Status::JOB_REJECTED) {
            return false;
        }

        return QuoteDeadlineService::isOpenForNewQuotes($job);
    }

    public static function jobAllowsNewBids(Job $job): bool
    {
        return QuoteDeadlineService::isOpenForNewQuotes($job);
    }

    public function editBidPage($jobId)
    {
        $freelancer = auth()->user();
        $bid = Bid::where('user_id', $freelancer->id)
            ->where('job_id', $jobId)
            ->where('status', Status::BID_PENDING)
            ->with('job')
            ->firstOrFail();

        if (!$bid->job) {
            abort(404);
        }

        return redirect()->route('explore.bid.job', [
            'slug' => $bid->job->slug,
            'edit' => 1,
        ]);
    }

    public function index()
    {
        $pageTitle  = 'Bid List';
        $freelancer = auth()->user();
        $visibleBidIds = self::visibleBidIdsFor($freelancer->id);

        $bids = Bid::query()
            ->where('user_id', $freelancer->id)
            ->whereIn('id', $visibleBidIds)
            ->with(['job', 'buyer', 'project'])
            ->searchable(['job:title'])
            ->orderByDesc('id')
            ->paginate(getPaginate());

        return Inertia::render('User/Bids/Index', [
            'pageTitle' => $pageTitle,
            'bids' => DashboardResource::bids($bids),
        ]);
    }

    /**
     * Keep one row per request: the current active quote, not superseded attempts.
     */
    public static function visibleBidIdsFor(int $userId): array
    {
        $activeStatuses = [Status::BID_PENDING, Status::BID_ACCEPTED, Status::BID_COMPLETED];

        return Bid::query()
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->get(['id', 'job_id', 'status'])
            ->groupBy('job_id')
            ->map(function ($jobBids) use ($activeStatuses) {
                $activeBid = $jobBids->first(
                    fn (Bid $bid) => in_array((int) $bid->status, $activeStatuses, true)
                );

                return $activeBid?->id ?? $jobBids->first()->id;
            })
            ->values()
            ->all();
    }

    public function storeBid(Request $request, $id)
    {
        $job = Job::published()->approved()->biddingOpen()->with(['buyer' => function ($q) {
            $q->active();
        }, 'category.quoteForm'])->findOrFail($id);

        $freelancer = auth()->user();
        if (!$freelancer->provider_approved) {
            $notify[] = ['error', 'Your provider account is awaiting admin approval before you can submit quotes.'];
            return back()->withNotify($notify);
        }
        if (!$freelancer->work_profile_complete) {
            $notify[] = ['error', 'Please complete your profile first!'];
            return to_route('user.profile.setting')->withNotify($notify);
        }
        $isJobBidExisting = $freelancer->bids()
            ->where('job_id', $job->id)
            ->whereNotIn('status', [Status::BID_REJECTED, Status::BID_WITHDRAW])
            ->count();
        if ($isJobBidExisting) {
            $notify[] = ['error', 'You already have an active quote on this request. Use Edit Bid to update it.'];
            return back()->withNotify($notify);
        }

        if (self::bidAttemptsFor($freelancer, $job) >= self::MAX_BID_ATTEMPTS) {
            $notify[] = ['error', 'You have used all ' . self::MAX_BID_ATTEMPTS . ' quote attempts for this request.'];
            return back()->withNotify($notify);
        }

        $creditCheck = \App\Lib\LeadCreditService::assertCanSubmitQuote($freelancer);
        if ($creditCheck !== true) {
            return back()->withNotify($creditCheck);
        }

        [$rules, $quoteForm] = self::bidValidationRules($request, $job, false);

        $request->validate($rules, [
            'estimated_time.max' => 'Estimated time text can\'t be more than 40 characters',
        ]);

        $quoteData = $quoteForm
            ? RequestFormService::processSubmission($request, $quoteForm->form_data)
            : null;

        $resolvedAmount = self::resolveBidAmount($request, $job, $quoteData);

        $buyer              = $job->buyer;
        $bid                 = new Bid();
        $bid->job_id         = $job->id;
        $bid->user_id        = $freelancer->id;
        $bid->buyer_id       = $buyer->id;
        $bid->bid_amount     = $resolvedAmount;
        $bid->estimated_time = $request->estimated_time;
        $bid->bid_quote      = $request->bid_quote ?? self::quoteSummary($quoteData);
        $bid->quote_data     = $quoteData;
        $bid->revision_requested_at = null;
        $bid->revision_note = null;
        QuoteExpiryService::applyToBid($bid, $job);
        $bid->save();

        \App\Lib\LeadCreditService::chargeForQuote($freelancer, $bid);

        $bidAmount = $job->custom_budget ? $resolvedAmount : $job->budget;

        notify($buyer, 'BID_PLACED', [
            'title'       => $job->title,
            'freelancer'  => $freelancer->fullname,
            'budget_type' => $job->custom_budget ? 'Customized' : 'Fixed',
            'amount'      => showAmount($bidAmount),
            'estimate'    => $bid->estimated_time,
            'bid_text'    => $bid->bid_quote,
        ]);

        $notify[] = ['success', 'Your bid has been successfully placed for the job!'];
        return to_route('user.bid.index')->withNotify($notify);
    }

    public function updateBid(Request $request, $id)
    {
        $bid = Bid::where('id', $id)
            ->where('user_id', auth()->id())
            ->where('status', Status::BID_PENDING)
            ->with(['job.buyer', 'job.category.quoteForm'])
            ->firstOrFail();

        $job = $bid->job;
        if (!$job || !self::jobAllowsBidUpdates($job)) {
            $notify[] = ['error', 'This job is no longer open for bid updates.'];
            return back()->withNotify($notify);
        }

        $freelancer = auth()->user();
        if (!$freelancer->provider_approved || !$freelancer->work_profile_complete) {
            $notify[] = ['error', 'Complete your provider profile before updating a bid.'];
            return back()->withNotify($notify);
        }

        [$rules, $quoteForm] = self::bidValidationRules($request, $job, true);

        $request->validate($rules, [
            'estimated_time.max' => 'Estimated time text can\'t be more than 40 characters',
        ]);

        $quoteData = $quoteForm
            ? RequestFormService::processSubmission($request, $quoteForm->form_data, $bid->quote_data)
            : $bid->quote_data;

        $resolvedAmount = self::resolveBidAmount($request, $job, $quoteData);

        $bid->bid_amount = $resolvedAmount;
        $bid->estimated_time = $request->estimated_time;
        $bid->bid_quote = $request->bid_quote ?? self::quoteSummary($quoteData);
        $bid->quote_data = $quoteData;
        $bid->revision_requested_at = null;
        $bid->revision_note = null;
        QuoteExpiryService::applyToBid($bid, $job);
        $bid->save();

        notify($bid->buyer, 'BID_PLACED', [
            'title'       => $job->title,
            'freelancer'  => $freelancer->fullname,
            'budget_type' => $job->custom_budget ? 'Customized' : 'Fixed',
            'amount'      => showAmount($bid->bid_amount),
            'estimate'    => $bid->estimated_time,
            'bid_text'    => $bid->bid_quote,
        ]);

        $notify[] = ['success', 'Your bid has been updated successfully.'];
        return to_route('user.bid.index')->withNotify($notify);
    }

    protected static function bidValidationRules(Request $request, Job $job, bool $isUpdate = false): array
    {
        $budgetRule = $job->custom_budget ? 'required' : 'nullable';
        $rules = [
            'bid_amount'     => [$budgetRule, 'numeric', 'gt:0'],
            'estimated_time' => 'required|string|max:40',
            'bid_quote'      => 'nullable|string',
        ];

        $quoteForm = $job->category?->quoteForm;
        if ($quoteForm) {
            foreach (RequestFormService::normalizeFormFields($quoteForm->form_data) as $field) {
                if ($field->is_required === 'required' && !$isUpdate) {
                    if ($field->type === 'file') {
                        $rules[$field->label] = ['required', 'file'];
                    } else {
                        $rules[$field->label] = 'required';
                    }
                } elseif ($field->type === 'file') {
                    $rules[$field->label] = ['nullable', 'file'];
                } elseif ($field->is_required === 'required' && $isUpdate && $field->type !== 'file') {
                    $rules[$field->label] = 'required';
                }
            }
        } else {
            $rules['bid_quote'] = 'required|string';
        }

        return [$rules, $quoteForm];
    }

    protected static function quoteSummary(?array $quoteData): string
    {
        if (!$quoteData) {
            return '';
        }

        return collect($quoteData)
            ->map(fn ($item) => ($item['name'] ?? '') . ': ' . (is_array($item['value'] ?? null) ? implode(', ', $item['value']) : ($item['value'] ?? '')))
            ->filter()
            ->take(6)
            ->implode("\n");
    }

    public function withdrawBid($id)
    {
        $bid = Bid::where('id', $id)->where('status', Status::BID_PENDING)->where('user_id', auth()->id())->with(['job', 'buyer', 'user'])->firstOrFail();
        if ($bid) {
            $bid->status = Status::BID_WITHDRAW;
            $bid->save();

            notify($bid->buyer, 'BID_WITHRAWN', [
                'freelancer' => $bid->user->fullname,
                'job'        => $bid->job->title,
            ]);
            $notify[] = ['success', 'Your bid has been successfully withdrawn.'];
        } else {
            $notify[] = ['error' => 'Invalid bid!'];
        }
        return back()->withNotify($notify);
    }

    public function assignProject($id)
    {
        return redirect()->route('user.project.form', $id);
    }

    protected static function resolveBidAmount(Request $request, Job $job, ?array &$quoteData): float
    {
        return QuoteAmountService::resolveBidAmount($request, $job, $quoteData);
    }
}
