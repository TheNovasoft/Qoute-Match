<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Lib\AdminResource;
use App\Lib\FormProcessor;
use App\Models\Category;
use App\Models\Form;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarketplaceFormController extends Controller
{
    public function index()
    {
        $pageTitle = 'Request & Quote Forms';
        $type = request()->get('type');

        $forms = Form::query()
            ->marketplace()
            ->when($type === 'request', fn ($query) => $query->requestForms())
            ->when($type === 'quote', fn ($query) => $query->quoteForms())
            ->searchable(['act'])
            ->latest('id')
            ->paginate(getPaginate());

        $formIds = $forms->pluck('id');
        $categoryMap = Category::query()
            ->where(function ($query) use ($formIds) {
                $query->whereIn('request_form_id', $formIds)
                    ->orWhereIn('quote_form_id', $formIds);
            })
            ->get(['id', 'name', 'request_form_id', 'quote_form_id'])
            ->reduce(function (array $carry, Category $category) {
                if ($category->request_form_id) {
                    $carry[$category->request_form_id][] = $category->name;
                }
                if ($category->quote_form_id) {
                    $carry[$category->quote_form_id][] = $category->name;
                }

                return $carry;
            }, []);

        return Inertia::render('Admin/MarketplaceForms/Index', [
            'pageTitle' => $pageTitle,
            'forms' => AdminResource::marketplaceForms($forms, $type ?? '', $categoryMap),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:request,quote',
            'slug' => ['required', 'string', 'max:30', 'regex:/^[a-z0-9_]+$/'],
        ]);

        $act = $request->type . '_' . $request->slug;

        if (Form::where('act', $act)->exists()) {
            $notify[] = ['error', 'A form with this key already exists. Choose another slug (e.g. kitchen_test).'];

            return redirect()
                ->route('admin.marketplace.forms.index', ['type' => $request->type])
                ->withNotify($notify);
        }

        $form = new Form();
        $form->act = $act;
        $form->form_data = (object) [];
        $form->save();

        $notify[] = ['success', 'Form created. Add fields below and save.'];

        return redirect()
            ->route('admin.marketplace.forms.edit', $form->id)
            ->withNotify($notify);
    }

    public function edit($id)
    {
        $pageTitle = 'Edit Form Fields';
        $form = Form::marketplace()->findOrFail($id);

        return view('admin.marketplace_forms.edit', compact('pageTitle', 'form'));
    }

    public function update(Request $request, $id)
    {
        $form = Form::marketplace()->findOrFail($id);

        $formProcessor = new FormProcessor();
        $generatorValidation = $formProcessor->generatorValidation();
        $request->validate($generatorValidation['rules'], $generatorValidation['messages']);

        if (! $request->filled('form_generator.form_label')) {
            $form->form_data = (object) [];
            $form->save();
            $notify[] = ['success', 'All form fields removed.'];

            return redirect()->to($this->formsIndexUrl($form))->withNotify($notify);
        }

        $formProcessor->generate($form->act, true, 'id', $form->id);
        $form->refresh();

        $notify[] = ['success', 'Form fields saved successfully. Field count: ' . $form->fieldCount() . '.'];

        return redirect()->to($this->formsIndexUrl($form))->withNotify($notify);
    }

    public function destroy($id)
    {
        $form = Form::marketplace()->findOrFail($id);

        $linkedCategories = Category::query()
            ->where('request_form_id', $form->id)
            ->orWhere('quote_form_id', $form->id)
            ->pluck('name');

        if ($linkedCategories->isNotEmpty()) {
            $notify[] = [
                'error',
                'This form is linked to categories: ' . $linkedCategories->implode(', ') . '. Unlink them first.',
            ];
            return back()->withNotify($notify);
        }

        $type = $form->isQuoteForm() ? 'quote' : 'request';
        $form->delete();

        $notify[] = ['success', 'Form deleted successfully'];

        return redirect()->route('admin.marketplace.forms.index', ['type' => $type])->withNotify($notify);
    }

    private function formsIndexUrl(Form $form): string
    {
        $type = $form->isQuoteForm() ? 'quote' : 'request';

        return route('admin.marketplace.forms.index', [
            'type' => $type,
            '_' => time(),
        ]);
    }

    public static function validateFormAssignment(?int $formId, string $expectedType): ?string
    {
        if (! $formId) {
            return null;
        }

        $form = Form::find($formId);

        if (! $form) {
            return 'Selected form does not exist.';
        }

        $prefix = $expectedType === 'quote' ? 'quote_' : 'request_';

        if (! str_starts_with($form->act, $prefix)) {
            return 'Selected form must be a ' . $expectedType . ' form.';
        }

        return null;
    }
}
