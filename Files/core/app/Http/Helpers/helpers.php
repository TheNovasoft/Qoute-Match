<?php

use App\Constants\Status;
use App\Lib\Captcha;
use App\Lib\ClientInfo;
use App\Lib\CurlRequest;
use App\Lib\FileManager;
use App\Lib\GoogleAuthenticator;
use App\Models\Extension;
use App\Models\Frontend;
use App\Models\GeneralSetting;
use App\Models\Language;
use App\Notify\Notify;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

function systemDetails() {
    $system['name']          = 'olance';
    $system['version']       = '2.0';
    $system['build_version'] = '6.0.9';
    return $system;
}

function slug($string) {
    return Str::slug($string);
}

function verificationCode($length) {
    if ($length == 0) {
        return 0;
    }

    $min = pow(10, $length - 1);
    $max = (int) ($min - 1) . '9';
    return random_int($min, $max);
}

function getNumber($length = 8) {
    $characters       = '1234567890';
    $charactersLength = strlen($characters);
    $randomString     = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function activeTemplate($asset = false) {
    $template = session('template') ?? gs('active_template');
    if ($asset) {
        return 'assets/templates/' . $template . '/';
    }

    return 'templates.' . $template . '.';
}

function activeTemplateName() {
    $template = session('template') ?? gs('active_template');
    return $template;
}

function siteLogo($type = null) {
    $base = getFilePath('logoIcon');

    if ($type === 'dark') {
        $whiteLogo = getImage($base . '/logo_white.svg');
        if (!str_ends_with($whiteLogo, 'default.png')) {
            return $whiteLogo;
        }
    }

    $name = $type ? "/logo_$type.png" : '/logo.png';

    return getImage($base . $name);
}
function siteFavicon() {
    return getImage(getFilePath('logoIcon') . '/favicon.png');
}

function loadReCaptcha() {
    return Captcha::reCaptcha();
}

function loadCustomCaptcha($width = '100%', $height = 46, $bgColor = '#003') {
    return Captcha::customCaptcha($width, $height, $bgColor);
}

function verifyCaptcha() {
    return Captcha::verify();
}

function loadExtension($key) {
    $extension = Extension::where('act', $key)->where('status', Status::ENABLE)->first();
    return $extension ? $extension->generateScript() : '';
}

function getTrx($length = 12) {
    $characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    $charactersLength = strlen($characters);
    $randomString     = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function getAmount($amount, $length = 2) {
    $amount = round($amount ?? 0, $length);
    return $amount + 0;
}

function showAmount($amount, $decimal = 2, $separate = true, $exceptZeros = false, $currencyFormat = true) {
    $separator = '';
    if ($separate) {
        $separator = ',';
    }
    $printAmount = number_format($amount, $decimal, '.', $separator);
    if ($exceptZeros) {
        $exp = explode('.', $printAmount);
        if ($exp[1] * 1 == 0) {
            $printAmount = $exp[0];
        } else {
            $printAmount = rtrim($printAmount, '0');
        }
    }
    if ($currencyFormat) {
        if (gs('currency_format') == Status::CUR_BOTH) {
            return gs('cur_sym') . $printAmount . ' ' . __(gs('cur_text'));
        } else if (gs('currency_format') == Status::CUR_TEXT) {
            return $printAmount . ' ' . __(gs('cur_text'));
        } else {
            return gs('cur_sym') . $printAmount;
        }
    }
    return $printAmount;
}

function removeElement($array, $value) {
    return array_diff($array, (is_array($value) ? $value : array($value)));
}

function cryptoQR($wallet) {
    return "https://api.qrserver.com/v1/create-qr-code/?data=$wallet&size=300x300&ecc=m";
}

function keyToTitle($text) {
    return ucfirst(preg_replace("/[^A-Za-z0-9 ]/", ' ', $text));
}

function titleToKey($text) {
    return strtolower(str_replace(' ', '_', $text));
}

function strLimit($title = null, $length = 10) {
    return Str::limit($title, $length);
}

/**
 * Convert HTML notification content to readable plain text.
 * Prevents CSS/JS from email templates leaking into SMS, in-app, push, WhatsApp.
 */
function notificationPlainText(?string $content): string
{
    if ($content === null || $content === '') {
        return '';
    }

    $text = preg_replace('#<(style|script|head|title|meta|link)[^>]*>.*?</\1>#is', ' ', $content) ?? $content;
    $text = preg_replace('#<(style|script|meta|link)[^>]*/?>#is', ' ', $text) ?? $text;
    $text = preg_replace('#<!--.*?-->#s', ' ', $text) ?? $text;
    $text = preg_replace('#<(br\s*/?|/p|/div|/li|/tr|/h[1-6])[^>]*>#i', "\n", $text) ?? $text;
    $text = strip_tags($text);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[ \t\f\v]+/', ' ', $text) ?? $text;
    $text = preg_replace("/\n[ \t]+/", "\n", $text) ?? $text;
    $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

    return trim($text);
}

function getIpInfo() {
    $ipInfo = ClientInfo::ipInfo();
    return $ipInfo;
}

function osBrowser() {
    $osBrowser = ClientInfo::osBrowser();
    return $osBrowser;
}

function getTemplates() {
    return null;
}

function getPageSections($arr = false) {
    $jsonUrl  = resource_path('views/') . str_replace('.', '/', activeTemplate()) . 'sections.json';
    $sections = json_decode(file_get_contents($jsonUrl));
    if ($arr) {
        $sections = json_decode(file_get_contents($jsonUrl), true);
        ksort($sections);
    }
    return $sections;
}

function getImage($image, $size = null, $avatar = false) {

    $clean = '';
    $paths = [$image];

    if (!preg_match('#^(?:[A-Za-z]:[\\\\/]|/)#', $image)) {
        $paths[] = base_path('../' . ltrim($image, '/'));
    }

    foreach ($paths as $path) {
        if (file_exists($path) && is_file($path)) {
            return asset($image) . $clean;
        }
    }

    if ($avatar) {
        return asset('assets/images/user/avatar.png');
    }
    if ($size) {
        return route('placeholder.image', $size);
    }
    return asset('assets/images/default.png');
}

function notify($user, $templateName, $shortCodes = null, $sendVia = null, $createLog = true, $pushImage = null) {
    $logoUrl = siteLogo();
    if ($logoUrl && ! str_starts_with($logoUrl, 'http')) {
        $logoUrl = url($logoUrl);
    }

    $globalShortCodes = [
        'site_name'       => gs('site_name'),
        'site_currency'   => gs('cur_text'),
        'currency_symbol' => gs('cur_sym'),
        'site_url'        => url('/'),
        'site_logo'       => $logoUrl,
    ];

    if (gettype($user) == 'array') {
        $user = (object) $user;
    }

    $shortCodes = array_merge($shortCodes ?? [], $globalShortCodes);

    $notify               = new Notify($sendVia);
    $notify->templateName = $templateName;
    $notify->shortCodes   = $shortCodes;
    $notify->user         = $user;
    $notify->createLog    = $createLog;
    $notify->pushImage    = $pushImage;
    $notify->userColumn   = isset($user->id) ? $user->getForeignKey() : 'user_id';
    $notify->send();
}

function getPaginate($paginate = null) {
    if (!$paginate) {
        $paginate = gs('paginate_number');
    }
    return $paginate;
}

function paginateLinks($data, $view = null) {
    return $data->appends(request()->all())->links($view);
}

function menuActive($routeName, $type = null, $param = null) {
    if ($type == 3) $class = 'side-menu--open';
    elseif ($type == 2) $class = 'sidebar-submenu__open';
    else $class = 'active';
    if (is_array($routeName)) {
        foreach ($routeName as $key => $value) {
            if (request()->routeIs($value)) return $class;
        }
    } elseif (request()->routeIs($routeName)) {
        if (!$param) return $class;

        $routeParam = array_values(isset(request()->route()->parameters)
            ? request()->route()->parameters : []);

        $firstParam = $routeParam[0] ?? null;
        if (is_string($firstParam) && is_string($param) && strcasecmp($firstParam, $param) === 0) {
            return $class;
        }
    }
}

function fileUploader($file, $location, $size = null, $old = null, $thumb = null, $filename = null) {

    $fileManager           = new FileManager($file);
    $fileManager->path     = $location;
    $fileManager->size     = $size;
    $fileManager->old      = $old;
    $fileManager->thumb    = $thumb;
    $fileManager->filename = $filename;
    $fileManager->upload();
    return $fileManager->filename;
}

function fileManager() {
    return new FileManager();
}

function getFilePath($key) {
    return fileManager()->$key()->path;
}

function getFileSize($key) {
    return fileManager()->$key()->size;
}

function getFileExt($key) {
    return fileManager()->$key()->extensions;
}

function diffForHumans($date) {
    $lang = session()->get('lang');
    if (!$lang) {
        $lang = getDefaultLang();
    }

    Carbon::setlocale($lang);
    return Carbon::parse($date)->diffForHumans();
}

function showDateTime($date, $format = 'Y-m-d h:i A') {
    if (!$date) {
        return '-';
    }
    $lang = session()->get('lang');
    if (!$lang) {
        $lang = getDefaultLang();
    }

    Carbon::setlocale($lang);
    return Carbon::parse($date)->translatedFormat($format);
}

function getDefaultLang() {
    return Language::where('is_default', Status::YES)->first()->code ?? 'en';
}

function getContent($dataKeys, $singleQuery = false, $limit = null, $orderById = false) {

    $templateName = activeTemplateName();
    if ($singleQuery) {
        $content = Frontend::where('tempname', $templateName)->where('data_keys', $dataKeys)->orderBy('id', 'desc')->first();
    } else {
        $article = Frontend::where('tempname', $templateName);
        $article->when($limit != null, function ($q) use ($limit) {
            return $q->limit($limit);
        });
        if ($orderById) {
            $content = $article->where('data_keys', $dataKeys)->orderBy('id')->get();
        } else {
            $content = $article->where('data_keys', $dataKeys)->orderBy('id', 'desc')->get();
        }
    }
    return $content;
}

function verifyG2fa($user, $code, $secret = null) {
    $authenticator = new GoogleAuthenticator();
    if (!$secret) {
        $secret = $user->tsc;
    }
    $oneCode  = $authenticator->getCode($secret);
    $userCode = $code;
    if ($oneCode == $userCode) {
        $user->tv = Status::YES;
        $user->save();
        return true;
    } else {
        return false;
    }
}

function urlPath($routeName, $routeParam = null) {
    if ($routeParam == null) {
        $url = route($routeName);
    } else {
        $url = route($routeName, $routeParam);
    }
    $basePath = route('home');
    $path     = str_replace($basePath, '', $url);
    return $path;
}

function showMobileNumber($number) {
    $length = strlen($number);
    return substr_replace($number, '***', 2, $length - 4);
}

function showEmailAddress($email) {
    $endPosition = strpos($email, '@') - 1;
    return substr_replace($email, '***', 1, $endPosition);
}

function getRealIP() {
    $ip = $_SERVER["REMOTE_ADDR"];
    //Deep detect ip
    if (filter_var(@$_SERVER['HTTP_FORWARDED'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_FORWARDED'];
    }
    if (filter_var(@$_SERVER['HTTP_FORWARDED_FOR'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_FORWARDED_FOR'];
    }
    if (filter_var(@$_SERVER['HTTP_X_FORWARDED_FOR'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    if (filter_var(@$_SERVER['HTTP_CLIENT_IP'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    if (filter_var(@$_SERVER['HTTP_X_REAL_IP'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    }
    if (filter_var(@$_SERVER['HTTP_CF_CONNECTING_IP'], FILTER_VALIDATE_IP)) {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if ($ip == '::1') {
        $ip = '127.0.0.1';
    }

    return $ip;
}

function appendQuery($key, $value) {
    return request()->fullUrlWithQuery([$key => $value]);
}

function dateSort($a, $b) {
    return strtotime($a) - strtotime($b);
}

function dateSorting($arr) {
    usort($arr, "dateSort");
    return $arr;
}

function gs($key = null) {
    $general = Cache::get('GeneralSetting');
    if (!$general) {
        $general = GeneralSetting::first();
        Cache::put('GeneralSetting', $general);
    }
    if ($key) {
        return @$general->$key;
    }

    return $general;
}
function isImage($string) {
    $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif');
    $fileExtension     = pathinfo($string, PATHINFO_EXTENSION);
    if (in_array($fileExtension, $allowedExtensions)) {
        return true;
    } else {
        return false;
    }
}

function isHtml($string) {
    if (preg_match('/<.*?>/', $string)) {
        return true;
    } else {
        return false;
    }
}

function convertToReadableSize($size) {
    preg_match('/^(\d+)([KMG])$/', $size, $matches);
    $size = (int) $matches[1];
    $unit = $matches[2];

    if ($unit == 'G') {
        return $size . 'GB';
    }

    if ($unit == 'M') {
        return $size . 'MB';
    }

    if ($unit == 'K') {
        return $size . 'KB';
    }

    return $size . $unit;
}

function frontendImage($sectionName, $image, $size = null, $seo = false) {
    if ($seo) {
        return getImage('assets/images/frontend/' . $sectionName . '/seo/' . $image, $size);
    }
    return getImage('assets/images/frontend/' . $sectionName . '/' . $image, $size);
}

function buildResponse($remark, $status, $notify, $data = null) {
    $response = [
        'remark' => $remark,
        'status' => $status,
    ];
    $message = [];
    if ($notify instanceof \Illuminate\Support\MessageBag) {
        $message['error'] = collect($notify)->map(function ($item) {
            return $item[0];
        })->values()->toArray();
    } else {
        $message = [$status => collect($notify)->map(function ($item) {
            if (is_string($item)) {
                return $item;
            }
            if (count($item) > 1) {
                return $item[1];
            }
            return $item[0];
        })->toArray()];
    }
    $response['message'] = $message;
    if ($data) {
        $response['data'] = $data;
    }
    return response()->json($response);
}

function responseSuccess($remark, $notify, $data = null) {
    return buildResponse($remark, 'success', $notify, $data);
}

function responseError($remark, $notify, $data = null) {
    return buildResponse($remark, 'error', $notify, $data);
}

function getJobTimeDifference($createdAt, $deadline) {
    $createdAt = Carbon::parse($createdAt);
    $deadline  = Carbon::parse($deadline);
    $postedAgo = $createdAt->diffForHumans(null, true, false);
    $endsIn    = $deadline->diffForHumans(null, true, false);
    return "Posted {$postedAgo}, Ends in {$endsIn}";
}

function initializePusher() {
    $general = gs();
    Config::set('broadcasting.connections.pusher.driver', 'pusher');
    Config::set('broadcasting.connections.pusher.key', $general->pusher_config->app_key);
    Config::set('broadcasting.connections.pusher.secret', $general->pusher_config->app_secret_key);
    Config::set('broadcasting.connections.pusher.app_id', $general->pusher_config->app_id);
    Config::set('broadcasting.connections.pusher.options.cluster', $general->pusher_config->cluster);
    $pusherConfig = config('broadcasting.connections.pusher');
    if (
        $pusherConfig['driver'] === 'pusher' &&
        $pusherConfig['key'] === $general->pusher_config->app_key &&
        $pusherConfig['secret'] === $general->pusher_config->app_secret_key &&
        $pusherConfig['app_id'] === $general->pusher_config->app_id &&
        $pusherConfig['options']['cluster'] === $general->pusher_config->cluster
    ) {
        return true;
    } else {
        return false;
    }
}

function formatNumber($amount, $decimals = 2) {
    if ($amount >= 1000000000) {
        return number_format($amount / 1000000000, $decimals) . 'B';
    } else if ($amount >= 1000000) {
        return number_format($amount / 1000000, $decimals) . 'M';
    } else if ($amount >= 1000) {
        return number_format($amount / 1000, $decimals) . 'K';
    } else {
        return number_format($amount, $decimals);
    }
}

function fileSizeInB($filePath) {
    if (!file_exists($filePath)) {
        return;
    }
    $fileSizeBytes = filesize($filePath);
    if ($fileSizeBytes >= 1048576) {
        $fileSize = number_format($fileSizeBytes / 1048576, 2) . ' MB';
    } else if ($fileSizeBytes >= 1024) {
        $fileSize = number_format($fileSizeBytes / 1024, 2) . ' KB';
    } else {
        $fileSize = $fileSizeBytes . ' bytes';
    }
    return $fileSize;
}

function getFileIcon($extension) {
    $iconMap = [
        'jpg'  => 'fa-file-image',
        'jpeg' => 'fa-file-image',
        'png'  => 'fa-file-image',
        'gif'  => 'fa-file-image',
        'svg'  => 'fa-file-image',
        'zip'  => 'fa-file-archive',
        'rar'  => 'fa-file-archive',
        'pdf'  => 'fa-file-pdf',
        '7zip' => 'fa-file-archive',
    ];

    return $iconMap[$extension] ?? 'fa-file';
}

function avgRating($avgRating) {
    $star = '';
    if ($avgRating) {
        $fullStars   = floor($avgRating);
        $decimalPart = $avgRating - $fullStars;

        for ($i = 0; $i < 5; $i++) {
            if ($fullStars > 0) {
                $star .= '<li class="rating-list__item"><i class="las la-star fa-lg"></i></li>';
                $fullStars--;
            } else if ($decimalPart >= 0.5) {
                $star .= '<li class="rating-list__item"><i class="fas fa-star-half-alt"></i></li>';
                $decimalPart = 0;
            } else {
                $star .= '<li class="rating-list__item"><i class="lar la-star fa-lg"></i></li>';
            }
        }
    } else {
        for ($i = 0; $i < 5; $i++) {
            $star .= '<i class="lar la-star fa-lg"></i>';
        }
    }
    return $star;
}
function
reviewRating($avgRating) {
    $star = '';
    if ($avgRating) {
        $fullStars   = floor($avgRating);
        $decimalPart = $avgRating -
            $fullStars;
        for ($i = 0; $i < 5; $i++) {
            if ($fullStars > 0) {
                $star .= '<li class="review-rating-list__item"><i class="las la-star"></i></li>';
                $fullStars--;
            } else if ($decimalPart >= 0.5) {
                $star .= '<li class="review-rating-list__item"><i class="las la-star-half-alt"></i></li>';
                $decimalPart = 0;
            } else {
                $star .= '<li class="review-rating-list__item"><i class="lar la-star"></i></li>';
            }
        }
    } else {
        for ($i = 0; $i < 5; $i++) {
            $star .= '<li class="review-rating-list__item"><i class="lar la-star"></i></li>';
        }
    }
    return $star;
}
function formatTimeDiff($createdAt, $uploadedAt) {
    $created  = \Carbon\Carbon::parse($createdAt);
    $uploaded = \Carbon\Carbon::parse($uploadedAt);
    $diff     = $created->diff($uploaded);

    $timeUnits = [
        'y' => 'year',
        'm' => 'month',
        'd' => 'day',
        'h' => 'hour',
        'i' => 'minute',
        's' => 'second',
    ];

    $components = array_filter(array_map(function ($unit, $label) use ($diff) {
        $value = $diff->$unit;
        return $value > 0 ? sprintf('%d %s%s', $value, $label, $value > 1 ? 's' : '') : null;
    }, array_keys($timeUnits), $timeUnits));

    return implode(', ', $components);
}

function calculateProfileCompletion($user) {
    $weights = [
        'skills'    => $user->skills->count() >= 3 ? 20 : ($user->skills->count() > 0 ? 10 : 0),
        'settings'  => ($user->image ? 10 : 0) + ($user->bio ? 5 : 0) + ($user->language ? 5 : 0),
        'education' => $user->educations->count() >= 2 ? 20 : ($user->educations->count() > 0 ? 10 : 0),
        'portfolio' => $user->portfolios->count() >= 2 ? 20 : ($user->portfolios->count() > 0 ? 10 : 0),
        'kyc'       => $user->kv ? 10 : 0,
        'tv'        => $user->tv ? 10 : 0,
    ];

    return round(array_sum($weights), 2);
}

function determineBadge($completionPercentage) {
    if ($completionPercentage <= 50) {
        return 'Poor';
    } else if (
        $completionPercentage > 50 &&
        $completionPercentage < 80
    ) {
        return 'Average';
    } else {
        return 'Excellent';
    }
}

function getProfileCompletionBadge($user) {
    $completionPercentage = calculateProfileCompletion($user);
    return determineBadge($completionPercentage);
}

function matchSkill($job, $user = null) {
    $user = $user ?? auth()->user();

    if (!$user) {
        return null;
    }

    $jobSkillIds = $job->skills->pluck('id');
    if ($jobSkillIds->isEmpty()) {
        return 0;
    }

    $userSkillIds = $user->skills->pluck('id');

    $matched = $jobSkillIds->intersect($userSkillIds)->count();

    return round(($matched / $jobSkillIds->count()) * 100);
}

function suggestUsername(string $email, ?int $ignoreUserId = null, ?int $ignoreBuyerId = null): string
{
    $local = strtolower(trim(explode('@', $email)[0] ?? 'user'));
    $base = preg_replace('/[^a-z0-9_]/', '', str_replace(['.', '-', '+'], '_', $local));
    $base = trim($base, '_');

    if ($base === '' || strlen($base) < 3) {
        $base = 'user_' . substr(md5($email), 0, 6);
    }

    if (strlen($base) < 6) {
        $base = str_pad($base, 6, '0');
    }

    $base = substr($base, 0, 35);
    $username = $base;
    $suffix = 0;

    while (usernameIsTaken($username, $ignoreUserId, $ignoreBuyerId)) {
        $suffix++;
        $username = substr($base, 0, max(1, 40 - strlen((string) $suffix))) . $suffix;
    }

    return $username;
}

function usernameIsTaken(string $username, ?int $ignoreUserId = null, ?int $ignoreBuyerId = null): bool
{
    $userQuery = \App\Models\User::query()->where('username', $username);
    if ($ignoreUserId) {
        $userQuery->where('id', '!=', $ignoreUserId);
    }

    $buyerQuery = \App\Models\Buyer::query()->where('username', $username);
    if ($ignoreBuyerId) {
        $buyerQuery->where('id', '!=', $ignoreBuyerId);
    }

    return $userQuery->exists() || $buyerQuery->exists();
}
