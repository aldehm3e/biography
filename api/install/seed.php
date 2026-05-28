<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../content/site-repository.php';

try {
    $pdo = cms_pdo();
    $user = cms_require_permission($pdo, 'utilities');
    cms_save_site_data_for_admin($pdo, cms_default_site_data(), $user);
    cms_json_response(['success' => true, 'message' => 'Default site data seeded.']);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to seed site data.'], 500);
}
