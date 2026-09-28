<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CbmCalculatorController extends Controller
{
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lv' => 'required|numeric|min:0',
            'bv' => 'required|numeric|min:0',
            'hv' => 'required|numeric|min:0',
            'qv' => 'nullable|integer|min:1',
            'uom' => 'nullable|in:mm,cm,meter',
            'wv' => 'nullable|numeric|min:0',
            'wu' => 'nullable|in:kg,gm,lb',
        ]);

        $weightUnit = $validated['wu'] ?? 'kg';
        $weightValue = (float) ($validated['wv'] ?? 0);
        if ($weightValue > 0 && $weightUnit === 'lb') {
            $weightValue = round($weightValue / 2.2046226218, 3);
            $weightUnit = 'kg';
        }

        $payload = [
            'lv' => (float) $validated['lv'],
            'lvinch' => 0,
            'bv' => (float) $validated['bv'],
            'bvinch' => 0,
            'hv' => (float) $validated['hv'],
            'hvinch' => 0,
            'qv' => (int) ($validated['qv'] ?? 1),
            'uom' => $validated['uom'] ?? 'cm',
            'wv' => $weightValue,
            'wu' => $weightUnit,
        ];

        try {
            $response = Http::timeout(8)
                ->acceptJson()
                ->post('https://api.cbmcalculator.com/cbm-adv', $payload);

            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Throwable $exception) {
            report($exception);
        }

        return response()->json([
            'error' => 'Unable to calculate CBM right now.',
        ], 503);
    }
}
