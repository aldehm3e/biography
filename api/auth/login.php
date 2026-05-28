<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

try {
    cms_start_session();
    $body = cms_read_json();
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    $captchaAnswer = $body['captchaAnswer'] ?? $body['captcha_answer'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        cms_json_response(['success' => false, 'message' => 'Invalid email or password.'], 422);
    }

    if (!cms_verify_login_captcha($captchaAnswer)) {
        cms_json_response([
            'success' => false,
            'code' => 'captcha_invalid',
            'message' => 'Security check is incorrect.',
        ], 422);
    }

    $pdo = cms_pdo();
    cms_ensure_admin_user_columns($pdo);
    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !cms_bool($user['active'] ?? true, true) || !password_verify($password, (string) $user['password_hash'])) {
        cms_json_response(['success' => false, 'message' => 'Invalid email or password.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['admin_user_id'] = (int) $user['id'];

    cms_json_response([
        'success' => true,
        'user' => cms_admin_payload($user),
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to log in.'], 500);
}
