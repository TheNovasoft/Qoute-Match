<?php

namespace App\Lib;

class CompareQuoteFields
{
    /** @param  array<int, array<string, mixed>>  $fields */
    public static function forComparison(array $fields): array
    {
        $hidden = ['quote expiry date', 'total price'];

        return collect($fields)
            ->reject(function ($field) use ($hidden) {
                $name = strtolower(trim((string) ($field['name'] ?? '')));

                return in_array($name, $hidden, true);
            })
            ->values()
            ->all();
    }
}
