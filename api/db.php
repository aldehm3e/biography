<?php
declare(strict_types=1);

const CMS_API_DIR = __DIR__;
const CMS_ROOT_DIR = __DIR__ . '/..';

function cms_is_installed(): bool
{
    return is_file(CMS_API_DIR . '/config.php');
}

function cms_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = cms_is_installed() ? CMS_API_DIR . '/config.php' : CMS_API_DIR . '/config.example.php';
    $loaded = require $path;
    $config = is_array($loaded) ? $loaded : [];

    $debug = !empty($config['app']['debug']);
    error_reporting($debug ? E_ALL : 0);
    ini_set('display_errors', $debug ? '1' : '0');
    ini_set('log_errors', '1');

    return $config;
}

function cms_start_session(): void
{
    $config = cms_config();
    $sessionName = $config['app']['session_name'] ?? 'biography_cms_session';
    if (session_status() === PHP_SESSION_NONE) {
        session_name((string) $sessionName);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function cms_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function cms_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        cms_json_response(['success' => false, 'message' => 'Invalid JSON body.'], 400);
    }

    return $decoded;
}

function cms_pdo(): PDO
{
    if (!cms_is_installed()) {
        throw new RuntimeException('CMS is not installed. Run install/index.php first.');
    }

    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = cms_config();
    $db = $config['db'] ?? [];
    $charset = (string) ($db['charset'] ?? 'utf8mb4');
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        (string) ($db['host'] ?? 'localhost'),
        (string) ($db['name'] ?? ''),
        $charset
    );

    $pdo = new PDO($dsn, (string) ($db['user'] ?? ''), (string) ($db['pass'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function cms_db_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND COLUMN_NAME = :column_name'
    );
    $stmt->execute([
        'table_name' => $table,
        'column_name' => $column,
    ]);
    return (int) $stmt->fetchColumn() > 0;
}

function cms_admin_permission_keys(): array
{
    return [
        'settings',
        'home',
        'footer',
        'projects',
        'cards',
        'pages',
        'navigation',
        'integrations',
        'notifications',
        'page_feedback',
        'backup',
        'utilities',
        'uploads',
        'users',
    ];
}

function cms_content_permission_keys(): array
{
    return [
        'settings',
        'home',
        'footer',
        'projects',
        'cards',
        'pages',
        'navigation',
        'integrations',
    ];
}

function cms_normalize_admin_permissions(mixed $permissions, bool $allowWildcard = false): array
{
    if (is_string($permissions)) {
        $decoded = json_decode($permissions, true);
        $permissions = is_array($decoded) ? $decoded : preg_split('/[\s,;]+/', $permissions);
    }
    if (!is_array($permissions)) {
        return [];
    }

    $allowed = array_flip(cms_admin_permission_keys());
    $clean = [];
    foreach ($permissions as $permission) {
        $key = strtolower(trim((string) $permission));
        if ($key === '') {
            continue;
        }
        if ($key === '*' && $allowWildcard) {
            return ['*'];
        }
        if (isset($allowed[$key])) {
            $clean[$key] = true;
        }
    }

    return array_keys($clean);
}

function cms_ensure_admin_user_columns(PDO $pdo): void
{
    $columns = [
        'role' => "VARCHAR(50) NOT NULL DEFAULT 'employee'",
        'permissions_json' => 'LONGTEXT',
        'active' => 'TINYINT(1) NOT NULL DEFAULT 1',
        'avatar_path' => 'VARCHAR(500)',
    ];

    foreach ($columns as $column => $definition) {
        if (!cms_db_column_exists($pdo, 'admin_users', $column)) {
            $pdo->exec('ALTER TABLE admin_users ADD COLUMN ' . $column . ' ' . $definition);
        }
    }

    $ownerCount = (int) $pdo->query("SELECT COUNT(*) FROM admin_users WHERE role = 'owner'")->fetchColumn();
    if ($ownerCount === 0) {
        $firstId = (int) $pdo->query('SELECT id FROM admin_users ORDER BY id ASC LIMIT 1')->fetchColumn();
        if ($firstId > 0) {
            $stmt = $pdo->prepare("UPDATE admin_users SET role = 'owner', permissions_json = :permissions, active = 1 WHERE id = :id");
            $stmt->execute([
                'permissions' => json_encode(['*'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'id' => $firstId,
            ]);
        }
    }

    $stmt = $pdo->prepare("UPDATE admin_users SET permissions_json = :permissions WHERE role = 'owner' AND (permissions_json IS NULL OR permissions_json = '')");
    $stmt->execute(['permissions' => json_encode(['*'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

function cms_admin_payload(array $user): array
{
    $role = strtolower((string) ($user['role'] ?? 'employee'));
    if (!in_array($role, ['owner', 'admin', 'employee'], true)) {
        $role = 'employee';
    }

    $permissions = $role === 'owner'
        ? ['*']
        : cms_normalize_admin_permissions($user['permissions_json'] ?? $user['permissions'] ?? []);
    $avatarPath = (string) ($user['avatar_path'] ?? $user['avatar'] ?? '');

    return [
        'id' => (int) ($user['id'] ?? 0),
        'email' => (string) ($user['email'] ?? ''),
        'display_name' => (string) ($user['display_name'] ?? ''),
        'phone' => (string) ($user['phone'] ?? ''),
        'avatar' => $avatarPath,
        'avatar_path' => $avatarPath,
        'role' => $role,
        'permissions' => $permissions,
        'active' => cms_bool($user['active'] ?? true, true),
        'created_at' => (string) ($user['created_at'] ?? ''),
        'updated_at' => (string) ($user['updated_at'] ?? ''),
    ];
}

function cms_admin_has_permission(array $user, string $permission): bool
{
    $role = strtolower((string) ($user['role'] ?? ''));
    if ($role === 'owner') {
        return true;
    }

    $permissions = $user['permissions'] ?? [];
    if (!is_array($permissions)) {
        $permissions = cms_normalize_admin_permissions($permissions);
    }

    return in_array('*', $permissions, true) || in_array($permission, $permissions, true);
}

function cms_admin_has_any_permission(array $user, array $permissions): bool
{
    foreach ($permissions as $permission) {
        if (cms_admin_has_permission($user, (string) $permission)) {
            return true;
        }
    }
    return false;
}

function cms_require_permission(PDO $pdo, string $permission): array
{
    $user = cms_require_admin($pdo);
    if (!cms_admin_has_permission($user, $permission)) {
        cms_json_response(['success' => false, 'message' => 'Permission denied.'], 403);
    }
    return $user;
}

function cms_ensure_media_uploads_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS media_uploads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_name VARCHAR(255),
            stored_name VARCHAR(255),
            path VARCHAR(500),
            mime_type VARCHAR(100),
            file_size INT,
            media_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_fetch_admin_users(PDO $pdo): array
{
    cms_ensure_admin_user_columns($pdo);
    $rows = $pdo->query('SELECT id, email, display_name, phone, avatar_path, role, permissions_json, active, created_at, updated_at FROM admin_users ORDER BY id ASC')->fetchAll();
    if (!is_array($rows)) {
        return [];
    }

    return array_map(static fn(array $row): array => cms_admin_payload($row), $rows);
}

function cms_current_admin(PDO $pdo = null): ?array
{
    cms_start_session();
    $adminId = $_SESSION['admin_user_id'] ?? null;
    if (!$adminId) {
        return null;
    }

    $pdo = $pdo ?: cms_pdo();
    cms_ensure_admin_user_columns($pdo);
    $stmt = $pdo->prepare('SELECT id, email, display_name, phone, avatar_path, role, permissions_json, active, created_at, updated_at FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int) $adminId]);
    $user = $stmt->fetch();

    if (!is_array($user) || !cms_bool($user['active'] ?? true, true)) {
        unset($_SESSION['admin_user_id']);
        return null;
    }

    return cms_admin_payload($user);
}

function cms_require_admin(PDO $pdo = null): array
{
    $user = cms_current_admin($pdo);
    if (!$user) {
        cms_json_response(['success' => false, 'message' => 'Authentication required.'], 401);
    }

    return $user;
}

function cms_create_login_captcha(): array
{
    cms_start_session();

    $left = random_int(2, 9);
    $right = random_int(1, 9);
    $_SESSION['login_captcha'] = [
        'answer' => (string) ($left + $right),
        'created' => time(),
    ];

    return [
        'question' => $left . ' + ' . $right . ' =',
        'expires_in' => 600,
    ];
}

function cms_verify_login_captcha(mixed $answer): bool
{
    cms_start_session();

    $captcha = $_SESSION['login_captcha'] ?? null;
    unset($_SESSION['login_captcha']);

    $submitted = trim((string) ($answer ?? ''));
    if (!is_array($captcha) || $submitted === '') {
        return false;
    }

    $created = (int) ($captcha['created'] ?? 0);
    if ($created <= 0 || time() - $created > 600) {
        return false;
    }

    if (!preg_match('/^\d+$/', $submitted)) {
        return false;
    }

    return hash_equals((string) ($captcha['answer'] ?? ''), $submitted);
}

function cms_public_path(string $relativePath): string
{
    $clean = str_replace(['\\', "\0"], ['/', ''], $relativePath);
    $clean = ltrim($clean, '/');
    return realpath(CMS_ROOT_DIR) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $clean);
}

function cms_truncate_utf8(string $text, int $max): string
{
    if ($max <= 0 || strlen($text) <= $max) {
        return $text;
    }

    $truncated = substr($text, 0, $max);
    while ($truncated !== '' && preg_match('//u', $truncated) !== 1) {
        $truncated = substr($truncated, 0, strlen($truncated) - 1);
    }
    return $truncated;
}

function cms_string(mixed $value, int $max = 0): string
{
    $text = trim((string) ($value ?? ''));
    if ($max > 0 && strlen($text) > $max) {
        $text = cms_truncate_utf8($text, $max);
    }
    return $text;
}

function cms_bool(mixed $value, bool $default = true): bool
{
    if ($value === null || $value === '') {
        return $default;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
}

function cms_bool_int(mixed $value, bool $default = true): int
{
    return cms_bool($value, $default) ? 1 : 0;
}
