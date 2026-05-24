<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/site-repository.php';

try {
    $pdo = cms_pdo();
    cms_json_response([
        'success' => true,
        'data' => cms_fetch_site_data($pdo),
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => false,
        'message' => 'Unable to load site content.',
    ], 500);
}
