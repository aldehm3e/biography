<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    $user = cms_require_admin($pdo);
    $body = cms_read_json();
    $current = (string) ($body['currentPassword'] ?? $body['current_password'] ?? '');
    $new = (string) ($body['newPassword'] ?? $body['new_password'] ?? '');
    $confirm = (string) ($body['confirmPassword'] ?? $body['confirm_password'] ?? '');

    if ($current === '' || $new === '' || $confirm === '') {
        cms_json_response(['success' => false, 'message' => 'All password fields are required.'], 422);
    }
    if (strlen($new) < 8) {
        cms_json_response(['success' => false, 'message' => 'New password must be at least 8 characters.'], 422);
    }
    if ($new !== $confirm) {
        cms_json_response(['success' => false, 'message' => 'New password confirmation does not match.'], 422);
    }

    $stmt = $pdo->prepare('SELECT password_hash FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int) $user['id']]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($current, (string) $row['password_hash'])) {
        cms_json_response(['success' => false, 'message' => 'Current password is incorrect.'], 401);
    }

    $update = $pdo->prepare('UPDATE admin_users SET password_hash = :hash WHERE id = :id');
    $update->execute([
        'hash' => password_hash($new, PASSWORD_DEFAULT),
        'id' => (int) $user['id'],
    ]);

    cms_json_response(['success' => true]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to change password.'], 500);
}
