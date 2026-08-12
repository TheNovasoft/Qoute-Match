<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Lib\InvoiceResource;
use App\Models\Invoice;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index()
    {
        $pageTitle = 'Invoices';
        $user = auth()->user();
        $invoices = InvoiceResource::scopeForRole(Invoice::query(), 'freelancer', $user->id)
            ->with(['job'])
            ->orderByDesc('id')
            ->paginate(getPaginate());

        return Inertia::render('User/Account/Invoices', [
            'pageTitle' => $pageTitle,
            'invoices' => InvoiceResource::index($invoices, 'freelancer'),
            'indexUrl' => route('user.invoices.index'),
        ]);
    }

    public function show($id)
    {
        $pageTitle = 'Invoice Details';
        $user = auth()->user();
        $invoice = InvoiceResource::scopeForRole(Invoice::query(), 'freelancer', $user->id)
            ->with(['job', 'project', 'buyer', 'user'])
            ->findOrFail($id);

        return Inertia::render('User/Account/InvoiceDetail', [
            'pageTitle' => $pageTitle,
            'invoice' => InvoiceResource::detail($invoice, 'freelancer'),
        ]);
    }
}
