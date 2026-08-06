<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\SavedSearch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SavedSearchController extends Controller
{
    public function index()
    {
        $buyer = auth()->guard('buyer')->user();
        $searches = SavedSearch::where('buyer_id', $buyer->id)
            ->latest('id')
            ->paginate(getPaginate());

        return Inertia::render('Buyer/SavedSearches/Index', [
            'pageTitle' => 'Saved Searches',
            'searches' => [
                'data' => collect($searches->items())->map(fn (SavedSearch $search) => [
                    'id' => $search->id,
                    'name' => $search->name,
                    'type' => $search->type,
                    'typeLabel' => $search->type === 'jobs' ? 'Jobs' : 'Providers',
                    'filters' => $search->filters ?? [],
                    'url' => $search->targetUrl(),
                    'createdAt' => showDateTime($search->created_at),
                    'deleteUrl' => route('buyer.saved.searches.destroy', $search->id),
                ])->values()->all(),
                'links' => $searches->withQueryString()->linkCollection()->toArray(),
                'meta' => [
                    'total' => $searches->total(),
                ],
            ],
            'storeUrl' => route('buyer.saved.searches.store'),
        ]);
    }

    public function store(Request $request)
    {
        $buyer = auth()->guard('buyer')->user();

        $data = $request->validate([
            'type' => 'required|in:providers,jobs',
            'name' => 'nullable|string|max:120',
            'filters' => 'nullable|array',
        ]);

        $filters = collect($data['filters'] ?? [])
            ->only(['rating', 'skill', 'search', 'sort', 'min_budget', 'max_budget', 'category_id', 'subcategory_id', 'project_scope', 'skill_level', 'buyer'])
            ->filter(fn ($value) => $value !== null && $value !== '' && $value !== '0')
            ->all();

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            $name = ($data['type'] === 'jobs' ? 'Jobs' : 'Providers') . ' search ' . now()->format('Y-m-d H:i');
        }

        SavedSearch::create([
            'buyer_id' => $buyer->id,
            'type' => $data['type'],
            'name' => $name,
            'filters' => $filters,
        ]);

        $notify[] = ['success', 'Search saved successfully'];
        return back()->withNotify($notify);
    }

    public function destroy($id)
    {
        $buyer = auth()->guard('buyer')->user();
        $search = SavedSearch::where('buyer_id', $buyer->id)->findOrFail($id);
        $search->delete();

        $notify[] = ['success', 'Saved search removed'];
        return back()->withNotify($notify);
    }
}
