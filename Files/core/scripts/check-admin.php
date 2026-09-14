<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$admins = DB::table('admins')->select('id', 'username', 'email')->get();
echo "Admins in database:\n";
foreach ($admins as $admin) {
    echo "  id={$admin->id} username={$admin->username} email={$admin->email}\n";
}

$admin = DB::table('admins')->where('username', 'admin')->first();
if ($admin) {
    echo "\nPassword check for username 'admin':\n";
    echo "  Hash matches 'admin': " . (Hash::check('admin', $admin->password) ? 'YES' : 'NO') . "\n";
} else {
    echo "\nNo admin with username 'admin' found.\n";
}

$byEmail = DB::table('admins')->where('email', 'admin@site.com')->first();
if ($byEmail) {
    echo "\nFound by email admin@site.com — username is: {$byEmail->username}\n";
    echo "  Hash matches 'admin': " . (Hash::check('admin', $byEmail->password) ? 'YES' : 'NO') . "\n";
}

echo "\nRotate weak credentials:\n";
echo "  php artisan security:rotate-weak-passwords        # dry run\n";
echo "  php artisan security:rotate-weak-passwords --force  # apply\n";
