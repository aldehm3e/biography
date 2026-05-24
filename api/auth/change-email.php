<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    $pdo = cms_pdo();
    $user = cms_require_admin($pdo);
    $body = cms_read_json();
    $email = strtolower(trim((string) ($body['newEmail'] ?? $body['new_email'] ?? '')));
    $password = (string) ($body['currentPassword'] ?? $body['current_password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        cms_json_response(['success' => false, 'message' => 'Valid email and current password are required.'], 422);
    }

    $stmt = $pdo->prepare('SELECT password_hash FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int) $user['id']]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, (string) $row['password_hash'])) {
        cms_json_response(['success' => false, 'message' => 'Current password is incorrect.'], 401);
    }

    $update = $pdo->prepare('UPDATE admin_users SET email = :email WHERE id = :id');
    $update->execute([
        'email' => $email,
        'id' => (int) $user['id'],
    ]);

    $settings = $pdo->prepare('UPDATE site_settings SET email = :email WHERE id = 1');
    $settings->execute(['email' => $email]);

    cms_json_response([
        'success' => true,
        'user' => cms_current_admin($pdo),
    ]);
} catch (PDOException $error) {
    cms_json_response(['success' => false, 'message' => 'Email is already in use.'], 409);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to change email.'], 500);
}
