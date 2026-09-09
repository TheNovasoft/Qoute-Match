<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('quotes:notify-expired-deadlines')->dailyAt('00:30');
Schedule::command('subscriptions:process-expiry')->dailyAt('01:00');
Schedule::command('digest:send-daily')->dailyAt('08:00');
