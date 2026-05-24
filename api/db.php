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

function cms_current_admin(PDO $pdo = null): ?array
{
    cms_start_session();
    $adminId = $_SESSION['admin_user_id'] ?? null;
    if (!$adminId) {
        return null;
    }

    $pdo = $pdo ?: cms_pdo();
    $stmt = $pdo->prepare('SELECT id, email, display_name, phone, created_at, updated_at FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int) $adminId]);
    $user = $stmt->fetch();

    return is_array($user) ? $user : null;
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

function cms_string(mixed $value, int $max = 0): string
{
    $text = trim((string) ($value ?? ''));
    if ($max > 0 && strlen($text) > $max) {
        $text = substr($text, 0, $max);
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
