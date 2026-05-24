<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    cms_json_response([
        'success' => true,
        'captcha' => cms_create_login_captcha(),
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to create security check.'], 500);
}
