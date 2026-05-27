<?php
declare(strict_types=1);

function cms_default_site_data(): array
{
    return [
        'settings' => [
            'siteName' => '',
            'brandName' => '',
            'brandSlogan' => 'موقع شخصي',
            'brandLogo' => '',
            'language' => 'ar',
            'direction' => 'rtl',
            'theme' => 'light',
            'phoneNumber' => '',
            'email' => '',
        ],
        'navigation' => [
            'homeLabel' => 'الرئيسية',
            'projectsLabel' => 'مشاريعنا',
            'pagesLabel' => 'الصفحات',
            'adminLabel' => 'الإدارة',
            'items' => [],
        ],
        'home' => [
            'ownerName' => '',
            'title' => '',
            'professionalTitle' => '',
            'intro' => '',
            'avatar' => '',
            'biography' => '',
            'heroTitle' => '',
            'heroSubtitle' => '',
            'heroIntro' => '',
            'heroImage' => '',
            'heroVideo' => '',
            'heroSlides' => [],
            'experience' => [],
            'achievements' => [],
            'skills' => [],
            'contacts' => [],
        ],
        'projects' => [],
        'pages' => [],
        'notifications' => [],
    ];
}

function cms_fetch_site_data(PDO $pdo): array
{
    $data = cms_default_site_data();
    cms_ensure_notifications_table($pdo);

    $settings = $pdo->query('SELECT * FROM site_settings WHERE id = 1 LIMIT 1')->fetch();
    if ($settings) {
        $data['settings'] = array_merge($data['settings'], [
            'siteName' => (string) ($settings['site_name'] ?? ''),
            'brandName' => (string) ($settings['brand_name'] ?? ''),
            'brandSlogan' => (string) ($settings['brand_slogan'] ?? ''),
            'brandLogo' => (string) ($settings['brand_logo'] ?? ''),
            'language' => (string) ($settings['language'] ?? 'ar'),
            'direction' => (string) ($settings['direction'] ?? 'rtl'),
            'theme' => (string) ($settings['theme'] ?? 'light'),
            'phoneNumber' => (string) ($settings['phone_number'] ?? ''),
            'email' => (string) ($settings['email'] ?? ''),
        ]);
    }

    $navStmt = $pdo->query('SELECT label, url, item_type, sort_order, visible FROM navigation_items ORDER BY sort_order, id');
    foreach ($navStmt->fetchAll() as $item) {
        $type = (string) ($item['item_type'] ?? '');
        if ($type === 'home') {
            $data['navigation']['homeLabel'] = (string) $item['label'];
        } elseif ($type === 'projects') {
            $data['navigation']['projectsLabel'] = (string) $item['label'];
        } elseif ($type === 'pages') {
            $data['navigation']['pagesLabel'] = (string) $item['label'];
        } elseif ($type === 'admin') {
            $data['navigation']['adminLabel'] = (string) $item['label'];
        }
        $data['navigation']['items'][] = [
            'label' => (string) $item['label'],
            'url' => (string) $item['url'],
            'itemType' => $type,
            'visible' => (bool) $item['visible'],
        ];
    }

    $main = $pdo->query('SELECT * FROM main_page WHERE id = 1 LIMIT 1')->fetch();
    if ($main) {
        $data['home'] = array_merge($data['home'], [
            'ownerName' => (string) ($main['owner_name'] ?? ''),
            'title' => (string) ($main['professional_title'] ?? ''),
            'professionalTitle' => (string) ($main['professional_title'] ?? ''),
            'intro' => (string) ($main['intro'] ?? ''),
            'avatar' => (string) ($main['avatar_path'] ?? ''),
            'biography' => (string) ($main['biography'] ?? ''),
            'heroTitle' => (string) ($main['hero_title'] ?? ''),
            'heroSubtitle' => (string) ($main['hero_subtitle'] ?? ''),
            'heroIntro' => (string) ($main['hero_intro'] ?? ''),
            'heroImage' => (string) ($main['hero_image'] ?? ''),
            'heroVideo' => (string) ($main['hero_video'] ?? ''),
        ]);
    }

    $slides = $pdo->query('SELECT * FROM hero_slides ORDER BY sort_order, id')->fetchAll();
    foreach ($slides as $slide) {
        $data['home']['heroSlides'][] = [
            'title' => (string) ($slide['title'] ?? ''),
            'subtitle' => (string) ($slide['subtitle'] ?? ''),
            'intro' => (string) ($slide['intro'] ?? ''),
            'image' => (string) ($slide['image_path'] ?? ''),
            'mobileImage' => (string) ($slide['mobile_image_path'] ?? ''),
            'video' => (string) ($slide['video_path'] ?? ''),
            'mobileVideo' => (string) ($slide['mobile_video_path'] ?? ''),
            'alt' => (string) ($slide['alt_text'] ?? ''),
            'visible' => (bool) ($slide['visible'] ?? 1),
        ];
    }

    $data['home']['experience'] = cms_fetch_content_rows($pdo, 'experiences');
    $data['home']['achievements'] = cms_fetch_content_rows($pdo, 'achievements');

    $skills = $pdo->query('SELECT name, visible FROM skills ORDER BY sort_order, id')->fetchAll();
    foreach ($skills as $skill) {
        $data['home']['skills'][] = [
            'name' => (string) ($skill['name'] ?? ''),
            'visible' => (bool) ($skill['visible'] ?? 1),
        ];
    }

    $contacts = $pdo->query('SELECT * FROM contacts ORDER BY sort_order, id')->fetchAll();
    foreach ($contacts as $contact) {
        $data['home']['contacts'][] = [
            'label' => (string) ($contact['label'] ?? ''),
            'value' => (string) ($contact['value'] ?? ''),
            'url' => (string) ($contact['url'] ?? ''),
            'iconType' => (string) ($contact['icon_type'] ?? 'website'),
            'iconPath' => (string) ($contact['icon_path'] ?? ''),
            'visible' => (bool) ($contact['visible'] ?? 1),
        ];
    }

    $projects = $pdo->query('SELECT * FROM projects ORDER BY sort_order, id')->fetchAll();
    foreach ($projects as $project) {
        $data['projects'][] = [
            'title' => (string) ($project['title'] ?? ''),
            'slug' => (string) ($project['slug'] ?? ''),
            'description' => (string) ($project['description'] ?? ''),
            'status' => (string) ($project['status'] ?? ''),
            'date' => (string) ($project['project_date'] ?? ''),
            'projectDate' => (string) ($project['project_date'] ?? ''),
            'category' => (string) ($project['category'] ?? ''),
            'image' => (string) ($project['image_path'] ?? ''),
            'imagePath' => (string) ($project['image_path'] ?? ''),
            'url' => (string) ($project['url'] ?? ''),
            'visible' => (bool) ($project['visible'] ?? 1),
        ];
    }

    $pages = $pdo->query('SELECT * FROM pages ORDER BY sort_order, id')->fetchAll();
    foreach ($pages as $page) {
        $data['pages'][] = [
            'title' => (string) ($page['title'] ?? ''),
            'slug' => (string) ($page['slug'] ?? ''),
            'contentMode' => (string) ($page['content_mode'] ?? 'text'),
            'content' => (string) ($page['content'] ?? ''),
            'visible' => (bool) ($page['visible'] ?? 1),
        ];
    }

    $notifications = $pdo->query('SELECT * FROM site_notifications ORDER BY sort_order, created_at DESC')->fetchAll();
    foreach ($notifications as $notification) {
        $data['notifications'][] = [
            'id' => (string) ($notification['id'] ?? ''),
            'key' => (string) ($notification['notification_key'] ?? ''),
            'status' => (string) ($notification['status'] ?? 'info'),
            'tag' => (string) ($notification['tag'] ?? 'Updated'),
            'title' => (string) ($notification['title'] ?? 'Content updated'),
            'description' => (string) ($notification['description'] ?? ''),
            'href' => (string) ($notification['href'] ?? 'notifications.html'),
            'createdAt' => (string) ($notification['created_at'] ?? ''),
        ];
    }

    return $data;
}

function cms_fetch_content_rows(PDO $pdo, string $table): array
{
    $rows = $pdo->query("SELECT title, meta, description, visible FROM {$table} ORDER BY sort_order, id")->fetchAll();
    return array_map(static function (array $row): array {
        return [
            'title' => (string) ($row['title'] ?? ''),
            'meta' => (string) ($row['meta'] ?? ''),
            'description' => (string) ($row['description'] ?? ''),
            'visible' => (bool) ($row['visible'] ?? 1),
        ];
    }, $rows);
}

function cms_ensure_notifications_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS site_notifications (
            id VARCHAR(120) PRIMARY KEY,
            notification_key VARCHAR(255) UNIQUE,
            status VARCHAR(50),
            tag VARCHAR(100),
            title VARCHAR(255),
            description TEXT,
            href VARCHAR(500),
            sort_order INT DEFAULT 0,
            created_at VARCHAR(40)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_save_site_data(PDO $pdo, array $input): array
{
    $data = cms_normalize_site_data($input);
    if (!$pdo->inTransaction()) {
        cms_ensure_notifications_table($pdo);
    }
    $started = !$pdo->inTransaction();
    if ($started) {
        $pdo->beginTransaction();
    }

    try {
        cms_save_settings($pdo, $data);
        cms_save_navigation($pdo, $data);
        cms_save_main_page($pdo, $data);
        cms_replace_hero_slides($pdo, $data['home']['heroSlides']);
        cms_replace_content_rows($pdo, 'experiences', $data['home']['experience']);
        cms_replace_content_rows($pdo, 'achievements', $data['home']['achievements']);
        cms_replace_skills($pdo, $data['home']['skills']);
        cms_replace_projects($pdo, $data['projects']);
        cms_replace_pages($pdo, $data['pages']);
        cms_replace_contacts($pdo, $data['home']['contacts']);
        cms_replace_notifications($pdo, $data['notifications']);

        if ($started) {
            $pdo->commit();
        }
    } catch (Throwable $error) {
        if ($started && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }

    return cms_fetch_site_data($pdo);
}

function cms_normalize_site_data(array $input): array
{
    $default = cms_default_site_data();
    $settings = is_array($input['settings'] ?? null) ? $input['settings'] : [];
    $navigation = is_array($input['navigation'] ?? null) ? $input['navigation'] : [];
    $home = is_array($input['home'] ?? null) ? $input['home'] : [];

    $data = $default;
    $data['settings'] = [
        'siteName' => cms_string($settings['siteName'] ?? $settings['site_name'] ?? '', 255),
        'brandName' => cms_string($settings['brandName'] ?? $settings['brand_name'] ?? '', 255),
        'brandSlogan' => cms_string($settings['brandSlogan'] ?? $settings['brand_slogan'] ?? 'موقع شخصي', 255),
        'brandLogo' => cms_safe_path($settings['brandLogo'] ?? $settings['brand_logo'] ?? ''),
        'language' => cms_string($settings['language'] ?? 'ar', 10) ?: 'ar',
        'direction' => in_array(($settings['direction'] ?? 'rtl'), ['rtl', 'ltr'], true) ? (string) $settings['direction'] : 'rtl',
        'theme' => in_array(($settings['theme'] ?? 'light'), ['light', 'dark'], true) ? (string) $settings['theme'] : 'light',
        'phoneNumber' => cms_string($settings['phoneNumber'] ?? $settings['phone_number'] ?? '', 50),
        'email' => filter_var($settings['email'] ?? '', FILTER_VALIDATE_EMAIL) ? (string) $settings['email'] : cms_string($settings['email'] ?? '', 255),
    ];

    $data['navigation'] = [
        'homeLabel' => cms_string($navigation['homeLabel'] ?? 'الرئيسية', 255) ?: 'الرئيسية',
        'projectsLabel' => cms_string($navigation['projectsLabel'] ?? 'مشاريعنا', 255) ?: 'مشاريعنا',
        'pagesLabel' => cms_string($navigation['pagesLabel'] ?? 'الصفحات', 255) ?: 'الصفحات',
        'adminLabel' => cms_string($navigation['adminLabel'] ?? 'الإدارة', 255) ?: 'الإدارة',
        'items' => [],
    ];

    $data['home'] = [
        'ownerName' => cms_string($home['ownerName'] ?? $home['owner_name'] ?? '', 255),
        'title' => cms_string($home['title'] ?? $home['professionalTitle'] ?? $home['professional_title'] ?? '', 255),
        'professionalTitle' => cms_string($home['professionalTitle'] ?? $home['title'] ?? '', 255),
        'intro' => cms_string($home['intro'] ?? ''),
        'avatar' => cms_safe_path($home['avatar'] ?? $home['avatarPath'] ?? ''),
        'biography' => cms_string($home['biography'] ?? ''),
        'heroTitle' => cms_string($home['heroTitle'] ?? '', 255),
        'heroSubtitle' => cms_string($home['heroSubtitle'] ?? '', 255),
        'heroIntro' => cms_string($home['heroIntro'] ?? ''),
        'heroImage' => cms_safe_path($home['heroImage'] ?? ''),
        'heroVideo' => cms_safe_path($home['heroVideo'] ?? ''),
        'heroSlides' => cms_normalize_hero_slides($home['heroSlides'] ?? []),
        'experience' => cms_normalize_content_rows($home['experience'] ?? []),
        'achievements' => cms_normalize_content_rows($home['achievements'] ?? []),
        'skills' => cms_normalize_skills($home['skills'] ?? []),
        'contacts' => cms_normalize_contacts($home['contacts'] ?? []),
    ];

    $data['projects'] = cms_normalize_projects($input['projects'] ?? []);
    $data['pages'] = cms_normalize_pages($input['pages'] ?? []);
    $data['notifications'] = cms_normalize_notifications($input['notifications'] ?? []);

    return $data;
}

function cms_safe_path(mixed $value): string
{
    $path = cms_string($value, 500);
    if ($path === '' || preg_match('/(^|\/)\.\.(\/|$)/', str_replace('\\', '/', $path))) {
        return '';
    }
    return ltrim(str_replace('\\', '/', $path), '/');
}

function cms_normalize_hero_slides(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $slide = [
            'title' => cms_string($item['title'] ?? '', 255),
            'subtitle' => cms_string($item['subtitle'] ?? '', 255),
            'intro' => cms_string($item['intro'] ?? ''),
            'image' => cms_safe_path($item['image'] ?? $item['imagePath'] ?? ''),
            'mobileImage' => cms_safe_path($item['mobileImage'] ?? $item['mobile_image'] ?? ''),
            'video' => cms_safe_path($item['video'] ?? $item['videoPath'] ?? ''),
            'mobileVideo' => cms_safe_path($item['mobileVideo'] ?? $item['mobile_video'] ?? ''),
            'alt' => cms_string($item['alt'] ?? $item['altText'] ?? '', 255),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if (implode('', array_map('strval', array_diff_key($slide, ['visible' => true]))) !== '') {
            $output[] = $slide;
        }
    }
    return $output;
}

function cms_normalize_content_rows(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $row = [
            'title' => cms_string($item['title'] ?? '', 255),
            'meta' => cms_string($item['meta'] ?? '', 255),
            'description' => cms_string($item['description'] ?? ''),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($row['title'] !== '' || $row['meta'] !== '' || $row['description'] !== '') {
            $output[] = $row;
        }
    }
    return $output;
}

function cms_normalize_skills(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    foreach (array_values($items) as $item) {
        if (is_string($item)) {
            $skill = ['name' => cms_string($item, 255), 'visible' => true];
        } elseif (is_array($item)) {
            $skill = [
                'name' => cms_string($item['name'] ?? $item['title'] ?? '', 255),
                'visible' => cms_bool($item['visible'] ?? true),
            ];
        } else {
            continue;
        }
        if ($skill['name'] !== '') {
            $output[] = $skill;
        }
    }
    return $output;
}

function cms_normalize_projects(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    $used = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $title = cms_string($item['title'] ?? '', 255);
        $project = [
            'title' => $title,
            'slug' => cms_unique_slug($used, $item['slug'] ?? '', $title ?: 'project'),
            'description' => cms_string($item['description'] ?? ''),
            'status' => cms_string($item['status'] ?? '', 100),
            'date' => cms_string($item['date'] ?? $item['projectDate'] ?? '', 100),
            'category' => cms_string($item['category'] ?? '', 100),
            'image' => cms_safe_path($item['image'] ?? $item['imagePath'] ?? ''),
            'url' => cms_string($item['url'] ?? '', 500),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($project['title'] !== '' || $project['description'] !== '' || $project['image'] !== '' || $project['url'] !== '') {
            $output[] = $project;
        }
    }
    return $output;
}

function cms_normalize_pages(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    $used = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $title = cms_string($item['title'] ?? '', 255);
        $mode = ($item['contentMode'] ?? $item['content_mode'] ?? 'text') === 'html' ? 'html' : 'text';
        $page = [
            'title' => $title,
            'slug' => cms_unique_slug($used, $item['slug'] ?? '', $title ?: 'page'),
            'contentMode' => $mode,
            'content' => cms_string($item['content'] ?? ''),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($page['title'] !== '' || $page['content'] !== '') {
            $output[] = $page;
        }
    }
    return $output;
}

function cms_normalize_notifications(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    $usedIds = [];
    $usedKeys = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $key = cms_string($item['key'] ?? $item['notificationKey'] ?? $item['notification_key'] ?? '', 255);
        $title = cms_string($item['title'] ?? '', 255);
        $createdAt = cms_string($item['createdAt'] ?? $item['created_at'] ?? '', 40);
        if ($createdAt === '') {
            $createdAt = gmdate('c');
        }
        $id = cms_string($item['id'] ?? '', 120);
        if ($id === '') {
            $id = 'notification-' . substr(hash('sha256', $key . '|' . $createdAt . '|' . $title), 0, 20);
        }
        if (isset($usedIds[$id]) || ($key !== '' && isset($usedKeys[$key]))) {
            continue;
        }
        $notification = [
            'id' => $id,
            'key' => $key,
            'status' => cms_string($item['status'] ?? 'info', 50) ?: 'info',
            'tag' => cms_string($item['tag'] ?? 'Updated', 100) ?: 'Updated',
            'title' => $title,
            'description' => cms_string($item['description'] ?? ''),
            'href' => cms_string($item['href'] ?? 'notifications.html', 500) ?: 'notifications.html',
            'createdAt' => $createdAt,
        ];
        if ($notification['title'] === '' && $notification['description'] === '') {
            continue;
        }
        $usedIds[$id] = true;
        if ($key !== '') {
            $usedKeys[$key] = true;
        }
        $output[] = $notification;
        if (count($output) >= 20) {
            break;
        }
    }
    return $output;
}

function cms_normalize_contacts(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $contact = [
            'label' => cms_string($item['label'] ?? '', 255),
            'value' => cms_string($item['value'] ?? '', 500),
            'url' => cms_string($item['url'] ?? '', 500),
            'iconType' => cms_string($item['iconType'] ?? $item['icon_type'] ?? 'website', 100) ?: 'website',
            'iconPath' => cms_safe_path($item['iconPath'] ?? $item['icon_path'] ?? ''),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($contact['label'] !== '' || $contact['value'] !== '' || $contact['url'] !== '' || $contact['iconPath'] !== '') {
            $output[] = $contact;
        }
    }
    return $output;
}

function cms_unique_slug(array &$used, mixed $slug, string $fallback): string
{
    $base = cms_slug($slug ?: $fallback);
    if ($base === '') {
        $base = 'item';
    }
    $candidate = $base;
    $suffix = 2;
    while (isset($used[$candidate])) {
        $candidate = $base . '-' . $suffix;
        $suffix++;
    }
    $used[$candidate] = true;
    return $candidate;
}

function cms_slug(mixed $value): string
{
    $slug = strtolower(cms_string($value, 255));
    $slug = preg_replace('/[^\p{Arabic}a-z0-9]+/u', '-', $slug) ?? '';
    return trim($slug, '-');
}

function cms_save_settings(PDO $pdo, array $data): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (id, site_name, brand_name, brand_slogan, brand_logo, language, direction, theme, phone_number, email)
         VALUES (1, :site_name, :brand_name, :brand_slogan, :brand_logo, :language, :direction, :theme, :phone_number, :email)
         ON DUPLICATE KEY UPDATE site_name = VALUES(site_name), brand_name = VALUES(brand_name), brand_slogan = VALUES(brand_slogan),
         brand_logo = VALUES(brand_logo), language = VALUES(language), direction = VALUES(direction), theme = VALUES(theme),
         phone_number = VALUES(phone_number), email = VALUES(email)'
    );
    $stmt->execute([
        'site_name' => $data['settings']['siteName'],
        'brand_name' => $data['settings']['brandName'],
        'brand_slogan' => $data['settings']['brandSlogan'],
        'brand_logo' => $data['settings']['brandLogo'],
        'language' => $data['settings']['language'],
        'direction' => $data['settings']['direction'],
        'theme' => $data['settings']['theme'],
        'phone_number' => $data['settings']['phoneNumber'],
        'email' => $data['settings']['email'],
    ]);
}

function cms_save_navigation(PDO $pdo, array $data): void
{
    $pdo->exec('DELETE FROM navigation_items');
    $stmt = $pdo->prepare('INSERT INTO navigation_items (label, url, item_type, sort_order, visible) VALUES (:label, :url, :item_type, :sort_order, 1)');
    $items = [
        ['label' => $data['navigation']['homeLabel'], 'url' => 'index.html', 'item_type' => 'home'],
        ['label' => $data['navigation']['projectsLabel'], 'url' => 'projects.html', 'item_type' => 'projects'],
        ['label' => $data['navigation']['pagesLabel'], 'url' => 'pages.html', 'item_type' => 'pages'],
        ['label' => $data['navigation']['adminLabel'], 'url' => 'admin.html', 'item_type' => 'admin'],
    ];
    foreach ($items as $index => $item) {
        $item['sort_order'] = $index;
        $stmt->execute($item);
    }
}

function cms_save_main_page(PDO $pdo, array $data): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO main_page (id, owner_name, professional_title, intro, avatar_path, biography, hero_title, hero_subtitle, hero_intro, hero_image, hero_video)
         VALUES (1, :owner_name, :professional_title, :intro, :avatar_path, :biography, :hero_title, :hero_subtitle, :hero_intro, :hero_image, :hero_video)
         ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name), professional_title = VALUES(professional_title), intro = VALUES(intro),
         avatar_path = VALUES(avatar_path), biography = VALUES(biography), hero_title = VALUES(hero_title), hero_subtitle = VALUES(hero_subtitle),
         hero_intro = VALUES(hero_intro), hero_image = VALUES(hero_image), hero_video = VALUES(hero_video)'
    );
    $stmt->execute([
        'owner_name' => $data['home']['ownerName'],
        'professional_title' => $data['home']['title'],
        'intro' => $data['home']['intro'],
        'avatar_path' => $data['home']['avatar'],
        'biography' => $data['home']['biography'],
        'hero_title' => $data['home']['heroTitle'],
        'hero_subtitle' => $data['home']['heroSubtitle'],
        'hero_intro' => $data['home']['heroIntro'],
        'hero_image' => $data['home']['heroImage'],
        'hero_video' => $data['home']['heroVideo'],
    ]);
}

function cms_replace_hero_slides(PDO $pdo, array $slides): void
{
    $pdo->exec('DELETE FROM hero_slides');
    $stmt = $pdo->prepare(
        'INSERT INTO hero_slides (title, subtitle, intro, image_path, mobile_image_path, video_path, mobile_video_path, alt_text, sort_order, visible)
         VALUES (:title, :subtitle, :intro, :image_path, :mobile_image_path, :video_path, :mobile_video_path, :alt_text, :sort_order, :visible)'
    );
    foreach ($slides as $index => $slide) {
        $stmt->execute([
            'title' => $slide['title'],
            'subtitle' => $slide['subtitle'],
            'intro' => $slide['intro'],
            'image_path' => $slide['image'],
            'mobile_image_path' => $slide['mobileImage'],
            'video_path' => $slide['video'],
            'mobile_video_path' => $slide['mobileVideo'],
            'alt_text' => $slide['alt'],
            'sort_order' => $index,
            'visible' => cms_bool_int($slide['visible']),
        ]);
    }
}

function cms_replace_content_rows(PDO $pdo, string $table, array $rows): void
{
    $pdo->exec("DELETE FROM {$table}");
    $stmt = $pdo->prepare("INSERT INTO {$table} (title, meta, description, sort_order, visible) VALUES (:title, :meta, :description, :sort_order, :visible)");
    foreach ($rows as $index => $row) {
        $stmt->execute([
            'title' => $row['title'],
            'meta' => $row['meta'],
            'description' => $row['description'],
            'sort_order' => $index,
            'visible' => cms_bool_int($row['visible']),
        ]);
    }
}

function cms_replace_skills(PDO $pdo, array $skills): void
{
    $pdo->exec('DELETE FROM skills');
    $stmt = $pdo->prepare('INSERT INTO skills (name, sort_order, visible) VALUES (:name, :sort_order, :visible)');
    foreach ($skills as $index => $skill) {
        $stmt->execute([
            'name' => $skill['name'],
            'sort_order' => $index,
            'visible' => cms_bool_int($skill['visible']),
        ]);
    }
}

function cms_replace_projects(PDO $pdo, array $projects): void
{
    $pdo->exec('DELETE FROM projects');
    $stmt = $pdo->prepare(
        'INSERT INTO projects (title, slug, description, status, project_date, category, image_path, url, sort_order, visible)
         VALUES (:title, :slug, :description, :status, :project_date, :category, :image_path, :url, :sort_order, :visible)'
    );
    foreach ($projects as $index => $project) {
        $stmt->execute([
            'title' => $project['title'],
            'slug' => $project['slug'],
            'description' => $project['description'],
            'status' => $project['status'],
            'project_date' => $project['date'],
            'category' => $project['category'],
            'image_path' => $project['image'],
            'url' => $project['url'],
            'sort_order' => $index,
            'visible' => cms_bool_int($project['visible']),
        ]);
    }
}

function cms_replace_pages(PDO $pdo, array $pages): void
{
    $pdo->exec('DELETE FROM pages');
    $stmt = $pdo->prepare(
        'INSERT INTO pages (title, slug, content_mode, content, sort_order, visible)
         VALUES (:title, :slug, :content_mode, :content, :sort_order, :visible)'
    );
    foreach ($pages as $index => $page) {
        $stmt->execute([
            'title' => $page['title'],
            'slug' => $page['slug'],
            'content_mode' => $page['contentMode'],
            'content' => $page['content'],
            'sort_order' => $index,
            'visible' => cms_bool_int($page['visible']),
        ]);
    }
}

function cms_replace_contacts(PDO $pdo, array $contacts): void
{
    $pdo->exec('DELETE FROM contacts');
    $stmt = $pdo->prepare(
        'INSERT INTO contacts (label, value, url, icon_type, icon_path, sort_order, visible)
         VALUES (:label, :value, :url, :icon_type, :icon_path, :sort_order, :visible)'
    );
    foreach ($contacts as $index => $contact) {
        $stmt->execute([
            'label' => $contact['label'],
            'value' => $contact['value'],
            'url' => $contact['url'],
            'icon_type' => $contact['iconType'],
            'icon_path' => $contact['iconPath'],
            'sort_order' => $index,
            'visible' => cms_bool_int($contact['visible']),
        ]);
    }
}

function cms_replace_notifications(PDO $pdo, array $notifications): void
{
    $pdo->exec('DELETE FROM site_notifications');
    $stmt = $pdo->prepare(
        'INSERT INTO site_notifications (id, notification_key, status, tag, title, description, href, sort_order, created_at)
         VALUES (:id, :notification_key, :status, :tag, :title, :description, :href, :sort_order, :created_at)'
    );
    foreach ($notifications as $index => $notification) {
        $stmt->execute([
            'id' => $notification['id'],
            'notification_key' => $notification['key'] !== '' ? $notification['key'] : null,
            'status' => $notification['status'],
            'tag' => $notification['tag'],
            'title' => $notification['title'],
            'description' => $notification['description'],
            'href' => $notification['href'],
            'sort_order' => $index,
            'created_at' => $notification['createdAt'],
        ]);
    }
}
