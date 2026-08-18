<?php

namespace App\Lib;

use Illuminate\Http\Request;

class RequestFormService
{
    /**
     * Form model casts form_data as object (label-keyed stdClass). Normalize to a list of fields.
     */
    public static function normalizeFormFields(mixed $formData): array
    {
        if ($formData === null) {
            return [];
        }

        if (is_array($formData)) {
            return array_values($formData);
        }

        if ($formData instanceof \stdClass) {
            return array_values((array) $formData);
        }

        if ($formData instanceof \Traversable) {
            return iterator_to_array($formData);
        }

        return [];
    }

    public static function fieldsForFrontend(mixed $formData, ?array $saved = null): array
    {
        $savedByLabel = collect($saved ?? [])->keyBy('label');

        return collect(self::normalizeFormFields($formData))->map(function ($field) use ($savedByLabel) {
            $savedValue = $savedByLabel->get($field->label)['value'] ?? null;
            $existingFileUrl = null;

            if ($field->type === 'file' && $savedValue && ! is_array($savedValue)) {
                $existingFileUrl = route('buyer.download.attachment', encrypt(getFilePath('requestDocuments') . '/' . $savedValue));
            }

            $showWhen = null;
            if (! empty($field->show_when)) {
                $condition = is_array($field->show_when) ? (object) $field->show_when : $field->show_when;
                $showWhen = [
                    'field' => $condition->field ?? null,
                    'values' => array_values((array) ($condition->values ?? [])),
                ];
            }

            return [
                'name' => $field->name,
                'label' => $field->label,
                'type' => $field->type,
                'isRequired' => $field->is_required === 'required',
                'instruction' => $field->instruction ?? null,
                'options' => $field->options ?? [],
                'extensions' => $field->extensions ?? '',
                'width' => $field->width ?? '12',
                'showWhen' => $showWhen,
                'locationGroup' => $field->location_group ?? null,
                'dependsOn' => $field->depends_on ?? null,
                'value' => $savedValue,
                'existingFileUrl' => $existingFileUrl,
            ];
        })->values()->all();
    }

    public static function visibleFields(mixed $formData, array $inputValues = []): array
    {
        return collect(self::normalizeFormFields($formData))
            ->filter(fn ($field) => self::fieldIsVisible($field, $inputValues))
            ->values()
            ->all();
    }

    public static function fieldIsVisible(object $field, array $inputValues): bool
    {
        if (empty($field->show_when)) {
            return true;
        }

        $condition = is_array($field->show_when) ? (object) $field->show_when : $field->show_when;
        $dependsOn = $condition->field ?? null;
        $allowedValues = array_values((array) ($condition->values ?? []));

        if (! $dependsOn || $allowedValues === []) {
            return true;
        }

        $currentValue = $inputValues[$dependsOn] ?? null;

        return in_array($currentValue, $allowedValues, true);
    }

    public static function validationRules(mixed $formData, array $inputValues, ?array $existing = null): array
    {
        $formProcessor = new FormProcessor();
        $existingByLabel = collect($existing ?? [])->keyBy('label');
        $rules = [];

        foreach (self::visibleFields($formData, $inputValues) as $field) {
            $fieldRules = $formProcessor->valueValidation([$field->label => $field]);
            $rule = $fieldRules[$field->label] ?? ['nullable'];

            if ($field->type === 'file' && ($existingByLabel->get($field->label)['value'] ?? null)) {
                $rule = ['nullable', new \App\Rules\FileTypeValidate(explode(',', $field->extensions))];
            }

            $rules[$field->label] = $rule;
        }

        return $rules;
    }

    public static function processSubmission(Request $request, mixed $formData, ?array $existing = null): array
    {
        $existingByLabel = collect($existing ?? [])->keyBy('label');
        $requestForm = [];
        $inputValues = $request->except(['_token', '_method']);

        foreach (self::visibleFields($formData, $inputValues) as $data) {
            $label = $data->label;

            if ($data->type === 'file') {
                if ($request->hasFile($label)) {
                    $directory = date('Y/m/d');
                    $path = getFilePath('requestDocuments') . '/' . $directory;
                    $value = $directory . '/' . fileUploader($request->file($label), $path);
                } else {
                    $value = $existingByLabel->get($label)['value'] ?? null;
                }
            } elseif ($data->type === 'checkbox') {
                $value = $request->input($label, []);
            } else {
                $value = $request->input($label);
            }

            $requestForm[] = [
                'name' => $data->name,
                'label' => $label,
                'type' => $data->type,
                'value' => $value,
            ];
        }

        return $requestForm;
    }

    public static function displayValues(?array $requestData, string $downloadRoute = 'buyer.download.attachment'): array
    {
        return collect($requestData ?? [])->map(function ($item) use ($downloadRoute) {
            $value = $item['value'] ?? null;

            if (($item['type'] ?? '') === 'file' && $value) {
                $value = route($downloadRoute, encrypt(getFilePath('requestDocuments') . '/' . $value));
            }

            if (($item['type'] ?? '') === 'checkbox' && is_array($value)) {
                $value = implode(', ', $value);
            }

            return [
                'name' => $item['name'] ?? '',
                'type' => $item['type'] ?? 'text',
                'value' => $value,
                'isFile' => ($item['type'] ?? '') === 'file' && !empty($item['value']),
            ];
        })->filter(fn ($item) => filled($item['value']))->values()->all();
    }
}
