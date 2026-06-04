<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    cms_require_permission($pdo, 'uploads');

    cms_ensure_media_uploads_table($pdo);
    $limit = max(1, min(500, (int) ($_GET['limit'] ?? 200)));
    $stmt = $pdo->prepare(
        'SELECT id, original_name, stored_name, path, mime_type, file_size, media_type, created_at
         FROM media_uploads
         ORDER BY id DESC
         LIMIT :limit'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $items = array_map(static function (array $row): array {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'originalName' => (string) ($row['original_name'] ?? ''),
            'storedName' => (string) ($row['stored_name'] ?? ''),
            'path' => (string) ($row['path'] ?? ''),
            'mimeType' => (string) ($row['mime_type'] ?? ''),
            'fileSize' => (int) ($row['file_size'] ?? 0),
            'mediaType' => (string) ($row['media_type'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll());

    cms_json_response([
        'success' => true,
        'items' => $items,
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to load media uploads.'], 500);
}
