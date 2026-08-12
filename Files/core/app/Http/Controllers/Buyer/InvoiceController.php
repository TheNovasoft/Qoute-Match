<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Lib\InvoiceResource;
use App\Models\Invoice;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index()
    {
        $pageTitle = 'Invoices';
        $buyer = auth()->guard('buyer')->user();
        $invoices = InvoiceResource::scopeForRole(Invoice::query(), 'buyer', $buyer->id)
            ->with(['job'])
            ->orderByDesc('id')
            ->paginate(getPaginate());

        return Inertia::render('Buyer/Account/Invoices', [
            'pageTitle' => $pageTitle,
            'invoices' => InvoiceResource::index($invoices, 'buyer'),
            'indexUrl' => route('buyer.invoices.index'),
        ]);
    }

    public function show($id)
    {
        $pageTitle = 'Invoice Details';
        $buyer = auth()->guard('buyer')->user();
        $invoice = InvoiceResource::scopeForRole(Invoice::query(), 'buyer', $buyer->id)
            ->with(['job', 'project', 'buyer', 'user'])
            ->findOrFail($id);

        return Inertia::render('Buyer/Account/InvoiceDetail', [
            'pageTitle' => $pageTitle,
            'invoice' => InvoiceResource::detail($invoice, 'buyer'),
        ]);
    }
}
