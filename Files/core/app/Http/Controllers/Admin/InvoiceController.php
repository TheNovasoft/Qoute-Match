<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Lib\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $pageTitle = 'Invoices';
        $type = $request->get('type');

        $query = Invoice::query()->with(['job', 'buyer', 'user'])->orderByDesc('id');

        if ($type) {
            $query->where('type', $type);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', '%' . $search . '%')
                    ->orWhere('trx', 'like', '%' . $search . '%')
                    ->orWhere('meta->job_title', 'like', '%' . $search . '%');
            });
        }

        $invoices = $query->paginate(getPaginate());

        return Inertia::render('Admin/Invoices/Index', [
            'pageTitle' => $pageTitle,
            'invoices' => InvoiceResource::index($invoices, 'admin'),
            'filters' => [
                'type' => $type,
                'search' => $search,
            ],
            'typeOptions' => [
                ['value' => '', 'label' => 'All types'],
                ['value' => Invoice::TYPE_JOB_PUBLISHED, 'label' => InvoiceResource::typeLabel(Invoice::TYPE_JOB_PUBLISHED)],
                ['value' => Invoice::TYPE_PROJECT_ACCEPTED, 'label' => InvoiceResource::typeLabel(Invoice::TYPE_PROJECT_ACCEPTED)],
                ['value' => Invoice::TYPE_PROJECT_COMPLETED, 'label' => InvoiceResource::typeLabel(Invoice::TYPE_PROJECT_COMPLETED)],
                ['value' => Invoice::TYPE_PROJECT_PARTIAL, 'label' => InvoiceResource::typeLabel(Invoice::TYPE_PROJECT_PARTIAL)],
            ],
        ]);
    }

    public function show($id)
    {
        $invoice = Invoice::with(['job', 'project', 'buyer', 'user'])->findOrFail($id);

        return Inertia::render('Admin/Invoices/Detail', [
            'pageTitle' => 'Invoice Details',
            'invoice' => InvoiceResource::detail($invoice, 'admin'),
        ]);
    }

    public function delete($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        $notify[] = ['success', 'Invoice deleted successfully'];
        return to_route('admin.invoices.index')->withNotify($notify);
    }
}
