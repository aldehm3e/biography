<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/feedback-repository.php';

try {
    $pdo = cms_pdo();
    $body = cms_read_json();
    if ($body === []) {
        cms_json_response([
            'success' => false,
            'message' => 'Feedback payload is required.',
        ], 400);
    }

    cms_json_response([
        'success' => true,
        'feedback' => cms_save_page_feedback($pdo, $body),
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => false,
        'message' => 'Unable to save feedback.',
    ], 500);
}
