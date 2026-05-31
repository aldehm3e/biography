<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/site-repository.php';

try {
    $pdo = cms_pdo();
    $user = cms_require_admin($pdo);
    $body = cms_read_json();
    if ($body === []) {
        cms_json_response([
            'success' => false,
            'message' => 'Site data payload is required.',
        ], 400);
    }
    $payload = is_array($body['data'] ?? null) ? $body['data'] : $body;
    $rootKeys = ['settings', 'navigation', 'texts', 'home', 'footer', 'projects', 'pages', 'integrations', 'notifications'];
    if (array_intersect($rootKeys, array_keys($payload)) === []) {
        cms_json_response([
            'success' => false,
            'message' => 'Site data payload is not valid.',
        ], 422);
    }
    $data = cms_save_site_data_for_admin($pdo, $payload, $user);

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
