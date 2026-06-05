<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/feedback-repository.php';

try {
    $pdo = cms_pdo();
    cms_require_permission($pdo, 'backup');
    $body = cms_read_json();
    $records = $body['records'] ?? $body['pageFeedback']['records'] ?? [];

    cms_replace_page_feedback_export($pdo, $records);

    cms_json_response([
        'success' => true,
        'data' => cms_fetch_page_feedback_stats($pdo, 40),
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => false,
        'message' => 'Unable to import feedback.',
    ], 500);
}
