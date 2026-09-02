<?php

/**
 * Module 4 — Dynamic request forms (Blueprint §5 fields, §11, §24)
 * Seeds builder + freight category request forms and links them to parent categories.
 */
require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Category;
use App\Models\Form;

function upsertRequestForm(string $act, array $fields): Form
{
    $formData = [];

    foreach ($fields as $field) {
        $label = titleToKey($field['name']);
        $formData[$label] = [
            'name' => $field['name'],
            'label' => $label,
            'is_required' => $field['required'] ? 'required' : 'optional',
            'instruction' => $field['instruction'] ?? '',
            'extensions' => $field['extensions'] ?? '',
            'options' => $field['options'] ?? [],
            'type' => $field['type'],
            'width' => $field['width'] ?? '12',
            'show_when' => $field['show_when'] ?? null,
            'location_group' => $field['location_group'] ?? null,
            'depends_on' => $field['depends_on'] ?? null,
        ];
    }

    $form = Form::where('act', $act)->first() ?? new Form();
    $form->act = $act;
    $form->form_data = $formData;
    $form->save();

    echo "Form saved: {$act} (" . count($fields) . " fields)\n";

    return $form;
}

$builderForm = upsertRequestForm('request_builders', [
    ['name' => 'Postcode', 'type' => 'text', 'required' => true, 'width' => '6', 'instruction' => 'Where is the project located?'],
    ['name' => 'Property Type', 'type' => 'select', 'required' => true, 'width' => '6', 'options' => ['House', 'Flat', 'Bungalow', 'Commercial', 'Other']],
    ['name' => 'Project Timeline', 'type' => 'select', 'required' => true, 'width' => '6', 'options' => ['ASAP', 'Within 1 month', '1-3 months', '3-6 months', 'Flexible']],
    ['name' => 'Additional Requirements', 'type' => 'textarea', 'required' => false, 'width' => '12', 'instruction' => 'Access restrictions, materials preferences, or other notes'],
]);

$freightForm = upsertRequestForm('request_freight', [
    ['name' => 'Origin Country', 'type' => 'country', 'required' => true, 'width' => '6', 'location_group' => 'origin'],
    ['name' => 'Origin City', 'type' => 'city', 'required' => true, 'width' => '6', 'location_group' => 'origin', 'depends_on' => 'origin_country'],
    ['name' => 'Destination Country', 'type' => 'country', 'required' => true, 'width' => '6', 'location_group' => 'destination'],
    ['name' => 'Destination City', 'type' => 'city', 'required' => true, 'width' => '6', 'location_group' => 'destination', 'depends_on' => 'destination_country'],
    ['name' => 'HS Code', 'type' => 'text', 'required' => true, 'width' => '6', 'instruction' => 'Harmonized System code for your goods (e.g. 8471.30)'],
    ['name' => 'Gross Weight kg', 'type' => 'number', 'required' => true, 'width' => '6', 'instruction' => 'Approximate total weight in kilograms'],
    ['name' => 'Container Type', 'type' => 'radio', 'required' => true, 'width' => '12', 'options' => ['Full Container', 'LCL'], 'instruction' => 'Full Container (FCL) for a whole container, or LCL for a shared load.'],
    ['name' => 'Dimensions CBM', 'type' => 'cbm', 'required' => false, 'width' => '12', 'instruction' => 'Enter package dimensions to calculate cubic metres (CBM).'],
]);

$links = [
    'builders-home-improvement' => $builderForm->id,
    'freight-forwarding-logistics' => $freightForm->id,
];

foreach ($links as $slug => $formId) {
    $category = Category::where('slug', $slug)->first();
    if (!$category) {
        echo "Category not found: {$slug}\n";
        continue;
    }

    $category->request_form_id = $formId;
    $category->save();
    echo "Linked form to category: {$category->name}\n";
}

Illuminate\Support\Facades\Cache::flush();
echo "Module 4 request forms applied.\n";
