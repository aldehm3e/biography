<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

function cms_admin_user_role(mixed $role): string
{
    $clean = strtolower(trim((string) $role));
    return in_array($clean, ['owner', 'admin', 'employee'], true) ? $clean : 'employee';
}

function cms_admin_user_avatar_path(mixed $value): string
{
    $path = cms_string($value, 500);
    if ($path === '' || preg_match('/(^|\/)\.\.(\/|$)/', str_replace('\\', '/', $path))) {
        return '';
    }
    return ltrim(str_replace('\\', '/', $path), '/');
}

try {
    $pdo = cms_pdo();
    $currentUser = cms_require_permission($pdo, 'users');
    $body = cms_read_json();

    $id = (int) ($body['id'] ?? 0);
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $displayName = cms_string($body['displayName'] ?? $body['display_name'] ?? '', 255);
    $phone = cms_string($body['phone'] ?? '', 50);
    $avatarPath = cms_admin_user_avatar_path($body['avatar'] ?? $body['avatarPath'] ?? $body['avatar_path'] ?? '');
    $role = cms_admin_user_role($body['role'] ?? 'employee');
    $active = cms_bool($body['active'] ?? true, true);
    $password = (string) ($body['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        cms_json_response(['success' => false, 'message' => 'A valid email is required.'], 422);
    }

    if ($role === 'owner' && strtolower((string) ($currentUser['role'] ?? '')) !== 'owner') {
        cms_json_response(['success' => false, 'message' => 'Only the owner can create another owner account.'], 403);
    }

    $permissions = $role === 'owner'
        ? ['*']
        : cms_normalize_admin_permissions($body['permissions'] ?? []);
    $permissionsJson = json_encode($permissions, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    cms_ensure_admin_user_columns($pdo);

    if ($id > 0) {
        $stmt = $pdo->prepare('SELECT id, role, active FROM admin_users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            cms_json_response(['success' => false, 'message' => 'Admin user was not found.'], 404);
        }

        if ((int) $currentUser['id'] === $id) {
            $role = (string) ($existing['role'] ?? $currentUser['role']);
            $active = true;
            $permissions = $role === 'owner' ? ['*'] : cms_normalize_admin_permissions($currentUser['permissions'] ?? []);
            $permissionsJson = json_encode($permissions, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        if (($existing['role'] ?? '') === 'owner' && ($role !== 'owner' || !$active)) {
            cms_json_response(['success' => false, 'message' => 'Owner accounts cannot be disabled or downgraded.'], 422);
        }

        if ($password !== '' && strlen($password) < 8) {
            cms_json_response(['success' => false, 'message' => 'Password must be at least 8 characters.'], 422);
        }

        if ($password !== '') {
            $update = $pdo->prepare(
                'UPDATE admin_users
                 SET email = :email, display_name = :display_name, phone = :phone, avatar_path = :avatar_path, role = :role,
                     permissions_json = :permissions_json, active = :active, password_hash = :password_hash
                 WHERE id = :id'
            );
            $update->execute([
                'email' => $email,
                'display_name' => $displayName,
                'phone' => $phone,
                'avatar_path' => $avatarPath,
                'role' => $role,
                'permissions_json' => $permissionsJson,
                'active' => $active ? 1 : 0,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'id' => $id,
            ]);
        } else {
            $update = $pdo->prepare(
                'UPDATE admin_users
                 SET email = :email, display_name = :display_name, phone = :phone, avatar_path = :avatar_path, role = :role,
                     permissions_json = :permissions_json, active = :active
                 WHERE id = :id'
            );
            $update->execute([
                'email' => $email,
                'display_name' => $displayName,
                'phone' => $phone,
                'avatar_path' => $avatarPath,
                'role' => $role,
                'permissions_json' => $permissionsJson,
                'active' => $active ? 1 : 0,
                'id' => $id,
            ]);
        }
    } else {
        if (strlen($password) < 8) {
            cms_json_response(['success' => false, 'message' => 'Password is required and must be at least 8 characters.'], 422);
        }

        $insert = $pdo->prepare(
            'INSERT INTO admin_users (email, password_hash, display_name, phone, avatar_path, role, permissions_json, active)
             VALUES (:email, :password_hash, :display_name, :phone, :avatar_path, :role, :permissions_json, :active)'
        );
        $insert->execute([
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'display_name' => $displayName,
            'phone' => $phone,
            'avatar_path' => $avatarPath,
            'role' => $role,
            'permissions_json' => $permissionsJson,
            'active' => $active ? 1 : 0,
        ]);
    }

    cms_json_response([
        'success' => true,
        'user' => cms_current_admin($pdo),
        'users' => cms_fetch_admin_users($pdo),
    ]);
} catch (PDOException $error) {
    $message = $error->getCode() === '23000' ? 'This email is already used by another admin.' : 'Unable to save admin user.';
    cms_json_response(['success' => false, 'message' => $message], 422);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to save admin user.'], 500);
}
