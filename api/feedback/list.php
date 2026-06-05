<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/feedback-repository.php';

try {
    $pdo = cms_pdo();
    cms_require_permission($pdo, 'page_feedback');
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 40;

    cms_json_response([
        'success' => true,
        'data' => cms_fetch_page_feedback_stats($pdo, $limit),
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => false,
        'message' => 'Unable to load feedback.',
    ], 500);
}
