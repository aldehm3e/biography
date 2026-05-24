<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../content/site-repository.php';

try {
    $pdo = cms_pdo();
    cms_require_admin($pdo);
    cms_save_site_data($pdo, cms_default_site_data());
    cms_json_response(['success' => true, 'message' => 'Default site data seeded.']);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to seed site data.'], 500);
}
