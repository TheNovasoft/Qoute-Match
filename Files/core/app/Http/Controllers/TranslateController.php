<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TranslateController extends Controller
{
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'from' => 'nullable|string|max:10',
            'to' => 'nullable|string|max:10',
        ]);

        $from = $validated['from'] ?: 'auto';
        $to = $validated['to'] ?: 'en';
        $text = trim($validated['text']);

        if ($text === '') {
            return response()->json(['translation' => '']);
        }

        try {
            $response = Http::timeout(10)->get('https://api.mymemory.translated.net/get', [
                'q' => $text,
                'langpair' => "{$from}|{$to}",
            ]);

            if ($response->successful()) {
                $translation = data_get($response->json(), 'responseData.translatedText');
                if (is_string($translation) && $translation !== '') {
                    return response()->json(['translation' => $translation]);
                }
            }
        } catch (\Throwable $exception) {
            report($exception);
        }

        return response()->json([
            'error' => 'Translation is unavailable right now.',
        ], 503);
    }
}
