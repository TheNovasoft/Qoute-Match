<?php

namespace App\Http\Controllers\User;

use App\Constants\Status;
use App\Http\Controllers\Controller;
use App\Models\ProviderService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicePackageController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return Inertia::render('User/Services/Index', [
            'pageTitle' => 'My Service Packages',
            'services' => $user->providerServices()->orderBy('sort_order')->orderByDesc('id')->get()->map(fn (ProviderService $service) => [
                'id' => (int) $service->id,
                'title' => $service->title,
                'description' => $service->description,
                'price' => showAmount($service->price),
                'priceRaw' => (float) $service->price,
                'deliveryDays' => (int) $service->delivery_days,
                'status' => (bool) $service->status,
                'sortOrder' => (int) $service->sort_order,
            ])->values()->all(),
            'storeUrl' => route('user.services.store'),
            'updateUrl' => url('/provider/services'),
            'statusUrl' => url('/provider/services'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $service = new ProviderService();
        $service->user_id = auth()->id();
        $this->fillService($service, $data);
        $service->save();

        $notify[] = ['success', 'Service package added.'];
        return back()->withNotify($notify);
    }

    public function update(Request $request, $id)
    {
        $service = ProviderService::where('user_id', auth()->id())->findOrFail($id);
        $this->fillService($service, $this->validated($request));
        $service->save();

        $notify[] = ['success', 'Service package updated.'];
        return back()->withNotify($notify);
    }

    public function status($id)
    {
        $service = ProviderService::where('user_id', auth()->id())->findOrFail($id);
        $service->status = (int) $service->status === Status::ENABLE ? Status::DISABLE : Status::ENABLE;
        $service->save();

        $notify[] = ['success', 'Service package status updated.'];
        return back()->withNotify($notify);
    }

    public function destroy($id)
    {
        ProviderService::where('user_id', auth()->id())->where('id', $id)->delete();

        $notify[] = ['success', 'Service package removed.'];
        return back()->withNotify($notify);
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:120',
            'description' => 'nullable|string|max:2000',
            'price' => 'required|numeric|gte:0',
            'delivery_days' => 'required|integer|min:1|max:365',
            'sort_order' => 'nullable|integer|min:0|max:999',
        ]);
    }

    protected function fillService(ProviderService $service, array $data): void
    {
        $service->title = $data['title'];
        $service->description = $data['description'] ?? null;
        $service->price = (float) $data['price'];
        $service->delivery_days = (int) $data['delivery_days'];
        $service->sort_order = (int) ($data['sort_order'] ?? 0);
        $service->status = Status::ENABLE;
    }
}
