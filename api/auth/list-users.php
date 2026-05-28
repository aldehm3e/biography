<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    cms_require_permission($pdo, 'users');

    cms_json_response([
        'success' => true,
        'users' => cms_fetch_admin_users($pdo),
        'permissions' => cms_admin_permission_keys(),
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to load admin users.'], 500);
}
