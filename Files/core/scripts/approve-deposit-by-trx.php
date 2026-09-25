<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Constants\Status;
use App\Http\Controllers\Gateway\PaymentController;
use App\Models\Deposit;

$trx = $argv[1] ?? 'VU47S89X6QMQ';

$deposit = Deposit::where('trx', $trx)->first();

if (! $deposit) {
    echo "Deposit not found for TRX: {$trx}\n";
    exit(1);
}

echo "ID: {$deposit->id}\n";
echo "TRX: {$deposit->trx}\n";
echo "Amount: {$deposit->amount}\n";
echo "Status: {$deposit->status}\n";
echo "Buyer ID: {$deposit->buyer_id}\n";
echo "User ID: {$deposit->user_id}\n";

if ((int) $deposit->status === Status::PAYMENT_SUCCESS) {
    echo "Already approved/successful.\n";
    exit(0);
}

if ((int) $deposit->status !== Status::PAYMENT_PENDING) {
    echo "Not pending (status {$deposit->status}). Cannot auto-approve.\n";
    exit(1);
}

PaymentController::userDataUpdate($deposit, true);

$deposit->refresh();
$owner = $deposit->buyer ?? $deposit->user;
$balance = $owner ? $owner->balance : null;

echo "Approved. New deposit status: {$deposit->status}\n";
echo "Wallet balance: {$balance}\n";
