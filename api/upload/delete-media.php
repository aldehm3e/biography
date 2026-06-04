<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../content/site-repository.php';

function cms_collect_path_references(mixed $value, string $path, string $label = 'content'): array
{
    $refs = [];
    if (is_array($value)) {
        foreach ($value as $key => $child) {
            $childLabel = is_int($key) ? $label . ' #' . ($key + 1) : $label . '.' . (string) $key;
            $refs = array_merge($refs, cms_collect_path_references($child, $path, $childLabel));
        }
        return $refs;
    }

    if (is_string($value) && (trim($value) === $path || str_contains($value, $path))) {
        $refs[] = $label;
    }
    return $refs;
}

function cms_upload_delete_absolute_path(string $relativePath): ?string
{
    $clean = ltrim(str_replace('\\', '/', $relativePath), '/');
    if ($clean === '' || !str_starts_with($clean, 'uploads/') || preg_match('/(^|\/)\.\.(\/|$)/', $clean)) {
        return null;
    }

    $uploadRoot = realpath(cms_public_path('uploads'));
    if ($uploadRoot === false) {
        return null;
    }

    $absolute = cms_public_path($clean);
    $parent = realpath(dirname($absolute));
    if ($parent === false) {
        return null;
    }
    $normalizedRoot = rtrim(str_replace('\\', '/', $uploadRoot), '/');
    $normalizedParent = rtrim(str_replace('\\', '/', $parent), '/');
    if ($normalizedParent !== $normalizedRoot && !str_starts_with($normalizedParent . '/', $normalizedRoot . '/')) {
        return null;
    }

    return $absolute;
}

try {
    $pdo = cms_pdo();
    cms_require_permission($pdo, 'uploads');

    cms_ensure_media_uploads_table($pdo);
    $payload = cms_read_json();
    $id = (int) ($payload['id'] ?? 0);
    if ($id <= 0) {
        cms_json_response(['success' => false, 'message' => 'Missing media id.'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM media_uploads WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $media = $stmt->fetch();
    if (!$media) {
        cms_json_response(['success' => false, 'message' => 'Media file was not found.'], 404);
    }

    $path = ltrim(str_replace('\\', '/', (string) ($media['path'] ?? '')), '/');
    $references = cms_collect_path_references(cms_fetch_site_data($pdo), $path, 'site');
    if ($references) {
        cms_json_response([
            'success' => false,
            'message' => 'This file is still used by site content. Remove the path from content first.',
            'references' => array_values(array_slice(array_unique($references), 0, 12)),
        ], 409);
    }

    $absolutePath = cms_upload_delete_absolute_path($path);
    $started = !$pdo->inTransaction();
    if ($started) {
        $pdo->beginTransaction();
    }

    $delete = $pdo->prepare('DELETE FROM media_uploads WHERE id = :id');
    $delete->execute(['id' => $id]);

    if ($absolutePath !== null && is_file($absolutePath) && !unlink($absolutePath)) {
        if ($started && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        cms_json_response(['success' => false, 'message' => 'Unable to delete uploaded file.'], 500);
    }

    if ($started) {
        $pdo->commit();
    }

    cms_json_response([
        'success' => true,
        'id' => $id,
        'path' => $path,
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    cms_json_response(['success' => false, 'message' => 'Unable to delete media file.'], 500);
}
