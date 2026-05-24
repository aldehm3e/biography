<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    $user = cms_current_admin($pdo);
    cms_json_response([
        'success' => true,
        'authenticated' => (bool) $user,
        'user' => $user,
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => true,
        'authenticated' => false,
        'user' => null,
    ]);
}
