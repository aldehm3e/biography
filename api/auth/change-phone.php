<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    $user = cms_require_admin($pdo);
    $body = cms_read_json();
    $phone = cms_string($body['phone'] ?? $body['newPhone'] ?? $body['new_phone'] ?? '', 50);
    $password = (string) ($body['currentPassword'] ?? $body['current_password'] ?? '');

    if ($phone === '' || $password === '') {
        cms_json_response(['success' => false, 'message' => 'Phone number and current password are required.'], 422);
    }

    $stmt = $pdo->prepare('SELECT password_hash FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int) $user['id']]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, (string) $row['password_hash'])) {
        cms_json_response(['success' => false, 'message' => 'Current password is incorrect.'], 401);
    }

    $update = $pdo->prepare('UPDATE admin_users SET phone = :phone WHERE id = :id');
    $update->execute([
        'phone' => $phone,
        'id' => (int) $user['id'],
    ]);

    $settings = $pdo->prepare('UPDATE site_settings SET phone_number = :phone WHERE id = 1');
    $settings->execute(['phone' => $phone]);

    cms_json_response([
        'success' => true,
        'user' => cms_current_admin($pdo),
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to change phone number.'], 500);
}
