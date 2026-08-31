<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Lib\DashboardResource;
use App\Lib\DisputeService;
use App\Models\Dispute;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DisputeController extends Controller
{
    public function index()
    {
        $pageTitle = 'My Disputes';
        $disputes = Dispute::query()
            ->where('user_id', auth()->id())
            ->with(['job', 'buyer', 'project'])
            ->latest('id')
            ->paginate(getPaginate());

        return Inertia::render('User/Disputes/Index', [
            'pageTitle' => $pageTitle,
            'disputes' => DashboardResource::disputes($disputes),
        ]);
    }

    public function detail($id)
    {
        $pageTitle = 'Dispute Details';
        $dispute = Dispute::query()
            ->where('user_id', auth()->id())
            ->with(['job', 'bid', 'project', 'buyer', 'messages'])
            ->findOrFail($id);

        return Inertia::render('User/Disputes/Detail', [
            'pageTitle' => $pageTitle,
            'dispute' => DashboardResource::disputeDetail($dispute, 'freelancer'),
        ]);
    }

    public function open(Request $request, $projectId)
    {
        $request->validate([
            'description' => 'required|string|min:10|max:5000',
            'dispute_type' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:190',
        ]);

        $project = Project::where('user_id', auth()->id())
            ->with('bid')
            ->findOrFail($projectId);

        $existing = Dispute::query()->where('project_id', $project->id)->active()->first();
        if ($existing) {
            return redirect()->route('user.disputes.detail', $existing->id);
        }

        $dispute = DisputeService::openFromUser(
            $project,
            'user',
            $request->description,
            $request->input('dispute_type', 'other'),
            $request->subject
        );

        $notify[] = ['success', 'Dispute opened. Our team will review it shortly.'];
        return redirect()->route('user.disputes.detail', $dispute->id)->withNotify($notify);
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string|min:3|max:5000',
        ]);

        $dispute = Dispute::query()
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        try {
            DisputeService::addReply($dispute, 'user', (int) auth()->id(), $request->message);
        } catch (\InvalidArgumentException $e) {
            $notify[] = ['error', $e->getMessage()];
            return back()->withNotify($notify);
        }

        $notify[] = ['success', 'Reply sent.'];
        return back()->withNotify($notify);
    }
}
