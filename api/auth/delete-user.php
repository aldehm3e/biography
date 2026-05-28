<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    $currentUser = cms_require_permission($pdo, 'users');
    $body = cms_read_json();
    $id = (int) ($body['id'] ?? 0);

    if ($id <= 0) {
        cms_json_response(['success' => false, 'message' => 'Admin user id is required.'], 422);
    }
    if ((int) $currentUser['id'] === $id) {
        cms_json_response(['success' => false, 'message' => 'You cannot delete your own account.'], 422);
    }

    cms_ensure_admin_user_columns($pdo);
    $stmt = $pdo->prepare('SELECT role FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $user = $stmt->fetch();

    if (!$user) {
        cms_json_response(['success' => false, 'message' => 'Admin user was not found.'], 404);
    }
    if (($user['role'] ?? '') === 'owner') {
        cms_json_response(['success' => false, 'message' => 'Owner accounts cannot be deleted.'], 422);
    }

    $delete = $pdo->prepare('DELETE FROM admin_users WHERE id = :id');
    $delete->execute(['id' => $id]);

    cms_json_response([
        'success' => true,
        'users' => cms_fetch_admin_users($pdo),
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to delete admin user.'], 500);
}
