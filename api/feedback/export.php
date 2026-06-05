<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/feedback-repository.php';

try {
    $pdo = cms_pdo();
    $user = cms_require_admin($pdo);
    if (!cms_admin_has_any_permission($user, ['page_feedback', 'backup'])) {
        cms_json_response(['success' => false, 'message' => 'Permission denied.'], 403);
    }
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10000;
    $export = cms_fetch_page_feedback_export($pdo, $limit);

    if (isset($_GET['download'])) {
        $payload = [
            'schema' => 'biography.page-feedback-export',
            'version' => 1,
            'exportedAt' => gmdate('c'),
            'pageFeedback' => $export,
        ];
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        $filename = 'page-feedback-' . gmdate('Ymd-His') . '.json';

        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo $json === false ? '{}' : $json;
        exit;
    }

    cms_json_response([
        'success' => true,
        'data' => $export,
    ]);
} catch (Throwable $error) {
    cms_json_response([
        'success' => false,
        'message' => 'Unable to export feedback.',
    ], 500);
}
