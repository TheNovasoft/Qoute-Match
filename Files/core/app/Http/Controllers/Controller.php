<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Validation\ValidatesRequests;

abstract class Controller
{
    use ValidatesRequests;

    public function __construct()
    {
        //
    }

    public static function middleware()
    {
        return [];
    }
}
