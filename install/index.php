<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$lockPath = __DIR__ . '/install.lock';
$schemaPath = __DIR__ . '/schema.sql';
$configPath = $root . '/api/config.php';
$uploadFolders = [
    $root . '/uploads/images',
    $root . '/uploads/video',
    $root . '/uploads/logos',
    $root . '/uploads/icons',
    $root . '/uploads/documents',
];

require_once $root . '/api/db.php';
require_once $root . '/api/content/site-repository.php';

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function requirement_rows(array $uploadFolders): array
{
    foreach ($uploadFolders as $folder) {
        if (!is_dir($folder)) {
            @mkdir($folder, 0755, true);
        }
    }

    return [
        ['PHP >= 8.0', version_compare(PHP_VERSION, '8.0.0', '>=')],
        ['PDO enabled', extension_loaded('pdo')],
        ['PDO MySQL enabled', extension_loaded('pdo_mysql')],
        ['Sessions enabled', function_exists('session_start')],
        ['Uploads folders writable', array_reduce($uploadFolders, static fn(bool $ok, string $folder): bool => $ok && is_dir($folder) && is_writable($folder), true)],
    ];
}

function all_requirements_pass(array $rows): bool
{
    foreach ($rows as $row) {
        if (!$row[1]) {
            return false;
        }
    }
    return true;
}

function run_schema(PDO $pdo, string $schemaPath): void
{
    $schema = file_get_contents($schemaPath);
    if ($schema === false) {
        throw new RuntimeException('schema.sql was not found.');
    }

    $statements = array_filter(array_map('trim', preg_split('/;\s*(?:\r?\n|$)/', $schema) ?: []));
    foreach ($statements as $statement) {
        if ($statement !== '') {
            $pdo->exec($statement);
        }
    }
}

function assert_install_targets_writable(string $configPath, string $lockPath): void
{
    $targets = [
        $configPath => 'api/config.php',
        $lockPath => 'install/install.lock',
    ];

    foreach ($targets as $path => $label) {
        $directory = dirname($path);
        if (!is_dir($directory) || !is_writable($directory)) {
            throw new RuntimeException('The folder for ' . $label . ' is not writable.');
        }
        if (is_file($path) && !is_writable($path)) {
            throw new RuntimeException($label . ' already exists but is not writable.');
        }
    }
}

function write_config(string $configPath, array $input): void
{
    $config = [
        'db' => [
            'host' => $input['db_host'],
            'name' => $input['db_name'],
            'user' => $input['db_user'],
            'pass' => $input['db_pass'],
            'charset' => 'utf8mb4',
        ],
        'app' => [
            'debug' => false,
            'session_name' => 'biography_cms_session',
            'max_upload_bytes' => 52428800,
        ],
    ];
    $php = "<?php\n";
    $php .= "declare(strict_types=1);\n\n";
    $php .= 'return ' . var_export($config, true) . ";\n";

    if (file_put_contents($configPath, $php, LOCK_EX) === false) {
        throw new RuntimeException('Unable to write api/config.php.');
    }
}

function install_cms(string $schemaPath, string $configPath, string $lockPath): string
{
    if (is_file($lockPath)) {
        throw new RuntimeException('Installer is locked. Remove install/install.lock manually only if you need to reinstall.');
    }
    if (is_file($configPath)) {
        throw new RuntimeException('api/config.php already exists. Remove both api/config.php and install/install.lock only when intentionally reinstalling.');
    }

    $input = [
        'db_host' => trim((string) ($_POST['db_host'] ?? 'localhost')),
        'db_name' => trim((string) ($_POST['db_name'] ?? '')),
        'db_user' => trim((string) ($_POST['db_user'] ?? '')),
        'db_pass' => (string) ($_POST['db_pass'] ?? ''),
        'display_name' => trim((string) ($_POST['display_name'] ?? '')),
        'email' => strtolower(trim((string) ($_POST['email'] ?? ''))),
        'password' => (string) ($_POST['password'] ?? ''),
        'seed_json' => trim((string) ($_POST['seed_json'] ?? '')),
    ];

    if ($input['db_name'] === '' || $input['db_user'] === '') {
        throw new RuntimeException('Database name and user are required.');
    }
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('A valid admin email is required.');
    }
    if (strlen($input['password']) < 8) {
        throw new RuntimeException('Admin password must be at least 8 characters.');
    }
    assert_install_targets_writable($configPath, $lockPath);

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $input['db_host'], $input['db_name']);
    $pdo = new PDO($dsn, $input['db_user'], $input['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    run_schema($pdo, $schemaPath);
    cms_ensure_admin_user_columns($pdo);
    cms_ensure_notifications_table($pdo);
    cms_ensure_site_settings_columns($pdo);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO admin_users (email, password_hash, display_name, role, permissions_json, active)
             VALUES (:email, :password_hash, :display_name, :role, :permissions_json, 1)'
        );
        $stmt->execute([
            'email' => $input['email'],
            'password_hash' => password_hash($input['password'], PASSWORD_DEFAULT),
            'display_name' => $input['display_name'],
            'role' => 'owner',
            'permissions_json' => json_encode(['*'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        if ($input['seed_json'] !== '') {
            $seed = json_decode($input['seed_json'], true);
            if (!is_array($seed)) {
                throw new RuntimeException('Seed JSON is not valid.');
            }
            cms_save_site_data($pdo, is_array($seed['data'] ?? null) ? $seed['data'] : $seed);
        } else {
            cms_save_site_data($pdo, cms_default_site_data());
        }
        if ($pdo->inTransaction()) {
            $pdo->commit();
        }
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }

    write_config($configPath, $input);
    if (file_put_contents($lockPath, 'Installed at ' . date(DATE_ATOM), LOCK_EX) === false) {
        throw new RuntimeException('Unable to create install.lock.');
    }

    return 'Installation complete. Open admin.html and log in with the admin account you created.';
}

$requirements = requirement_rows($uploadFolders);
$installerLocked = is_file($lockPath);
$existingConfig = is_file($configPath);
$message = '';
$error = '';

if ($installerLocked) {
    $error = $existingConfig
        ? 'Installer is locked. Remove install/install.lock manually only if you need to reinstall.'
        : 'Installer is locked, but api/config.php is missing. Restore api/config.php or remove install/install.lock and run a fresh install.';
} elseif ($existingConfig) {
    $error = 'api/config.php already exists. For safety, the installer will not overwrite it. Remove both api/config.php and install/install.lock only when intentionally reinstalling.';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!all_requirements_pass($requirements)) {
            throw new RuntimeException('Server requirements are not passing yet.');
        }
        $message = install_cms($schemaPath, $configPath, $lockPath);
    } catch (Throwable $caught) {
        $error = $caught->getMessage();
    }
}
?>
<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Biography CMS Installer</title>
  <link rel="icon" href="../assets/images/saudi-tech.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../css/nds-icons-full.css">
  <link rel="stylesheet" href="../css/nds-local-components.css">
  <link rel="stylesheet" href="../css/custom.css">
</head>
<body class="installer-page">
  <main class="nds-content-section">
    <div class="site-container nds-section-wrapper">
      <div class="nds-section-head">
        <h1 class="nds-section-title">Biography CMS Installer</h1>
        <p class="nds-section-description">PHP + MySQL setup for the database-backed content manager.</p>
      </div>

      <?php if ($message !== ''): ?>
        <div class="nds-card nds-stroke"><div class="nds-card-content"><p class="nds-card-description"><?= h($message) ?></p></div></div>
      <?php endif; ?>

      <?php if ($error !== ''): ?>
        <div class="nds-card nds-stroke"><div class="nds-card-content"><p class="nds-card-description"><?= h($error) ?></p></div></div>
      <?php endif; ?>

      <section class="nds-card nds-stroke">
        <div class="nds-card-content">
          <h2 class="nds-card-title">Requirements</h2>
          <ul class="stack">
            <?php foreach ($requirements as $row): ?>
              <li><?= h($row[0]) ?>: <strong><?= $row[1] ? 'OK' : 'Missing' ?></strong></li>
            <?php endforeach; ?>
          </ul>
        </div>
      </section>

      <?php if (!$installerLocked && !$existingConfig): ?>
        <form class="nds-form nds-card nds-stroke" method="post">
          <div class="nds-card-content">
            <h2 class="nds-card-title">Database</h2>
            <div class="form-grid">
              <div class="nds-form-container"><div class="nds-form-header"><label for="db_host"><span class="nds-label">DB host</span></label></div><div class="nds-form-control"><input class="nds-input" id="db_host" name="db_host" value="<?= h($_POST['db_host'] ?? 'localhost') ?>" required></div></div>
              <div class="nds-form-container"><div class="nds-form-header"><label for="db_name"><span class="nds-label">DB name</span></label></div><div class="nds-form-control"><input class="nds-input" id="db_name" name="db_name" value="<?= h($_POST['db_name'] ?? '') ?>" required></div></div>
              <div class="nds-form-container"><div class="nds-form-header"><label for="db_user"><span class="nds-label">DB user</span></label></div><div class="nds-form-control"><input class="nds-input" id="db_user" name="db_user" value="<?= h($_POST['db_user'] ?? '') ?>" required></div></div>
              <div class="nds-form-container"><div class="nds-form-header"><label for="db_pass"><span class="nds-label">DB password</span></label></div><div class="nds-form-control"><input class="nds-input" id="db_pass" name="db_pass" type="password" autocomplete="off"></div></div>
            </div>

            <h2 class="nds-card-title">First Admin</h2>
            <div class="form-grid">
              <div class="nds-form-container"><div class="nds-form-header"><label for="display_name"><span class="nds-label">Display name</span></label></div><div class="nds-form-control"><input class="nds-input" id="display_name" name="display_name" value="<?= h($_POST['display_name'] ?? '') ?>"></div></div>
              <div class="nds-form-container"><div class="nds-form-header"><label for="email"><span class="nds-label">Email</span></label></div><div class="nds-form-control"><input class="nds-input" id="email" name="email" type="email" value="<?= h($_POST['email'] ?? '') ?>" required></div></div>
              <div class="nds-form-container"><div class="nds-form-header"><label for="password"><span class="nds-label">Password</span></label></div><div class="nds-form-control"><input class="nds-input" id="password" name="password" type="password" minlength="8" required></div></div>
            </div>

            <div class="nds-form-container">
              <div class="nds-form-header"><label for="seed_json"><span class="nds-label">Optional seed JSON</span></label></div>
              <div class="nds-form-control textarea-control"><textarea class="nds-input" id="seed_json" name="seed_json" rows="8"></textarea></div>
            </div>

            <div class="nds-card-actions">
              <button class="nds-btn nds-primary" type="submit"><span class="nds-label">Install CMS</span></button>
            </div>
          </div>
        </form>
      <?php endif; ?>
    </div>
  </main>
  <footer class="installer-footer" aria-label="Installer footer">
    <span>Powered by</span>
    <img src="../assets/images/saudi-tech.svg" width="32" height="58" loading="lazy" alt="تقنية سعودية">
  </footer>
</body>
</html>
