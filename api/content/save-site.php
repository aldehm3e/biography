<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/site-repository.php';

try {
    $pdo = cms_pdo();
    cms_require_admin($pdo);
    $body = cms_read_json();
    $payload = is_array($body['data'] ?? null) ? $body['data'] : $body;
    $data = cms_save_site_data($pdo, $payload);

    cms_json_response([
        'success' => true,
        'data' => $data,
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => false,
        'message' => 'Unable to save site content.',
    ], 500);
}
