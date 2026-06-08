<?php
declare(strict_types=1);

function cms_default_interface_texts(): array
{
    return [
        'searchLabel' => 'بحث',
        'searchPlaceholder' => 'البحث في الموقع...',
        'loginLabel' => 'تسجيل الدخول',
        'logoutLabel' => 'تسجيل الخروج',
        'adminPortalLabel' => 'الإدارة',
        'themeToggleLabel' => 'تبديل الوضع الليلي',
        'changePasswordLabel' => 'تغيير كلمة المرور',
        'changeEmailLabel' => 'تغيير البريد الإلكتروني',
        'changePhoneLabel' => 'تغيير رقم الجوال',
        'sharePageLabel' => 'مشاركة الصفحة',
        'footerLinksHeading' => 'روابط سريعة',
        'footerSocialHeading' => 'وسائل التواصل',
        'footerSocialEmpty' => 'لم تتم إضافة وسائل تواصل بعد',
        'footerVersion' => 'Biography v1.0',
        'footerDisclaimer' => 'تنويه: هذا الموقع شخصي وغير تابع لأي جهة حكومية، ولا يمثل إلا وجهة نظر صاحبه.',
        'homeEmptyTitle' => 'لم تتم إضافة محتوى بعد',
        'homeEmptyDescription' => 'يمكنك إضافة المحتوى من لوحة الإدارة.',
        'homeEmptyButton' => 'فتح لوحة الإدارة',
        'adminHomePanelTitle' => 'محتوى الصفحة الرئيسية',
        'adminHomePanelDescription' => 'كل الحقول اختيارية، ولن يظهر المحتوى العام إلا بعد حفظ بياناتك.',
        'adminHomeSaveButton' => 'حفظ الرئيسية',
        'biographySubtitle' => 'السيرة الذاتية',
        'biographyTitle' => 'نبذة مختصرة',
        'professionalSubtitle' => 'المحتوى المهني',
        'professionalTitle' => 'الخبرات والإنجازات',
        'experienceHeading' => 'الخبرات',
        'achievementsHeading' => 'الإنجازات',
        'skillsSubtitle' => 'المهارات',
        'skillsTitle' => 'مجالات الخبرة',
        'skillsEmptyTitle' => 'لم تتم إضافة مجالات خبرة بعد',
        'skillsEmptyDescription' => 'يمكن إضافة المهارات من لوحة الإدارة.',
        'homeListEmptyPrefix' => 'لم تتم إضافة ',
        'homeListEmptySuffix' => ' بعد',
        'homeListEmptyDescription' => 'يمكن إضافة العناصر من لوحة الإدارة.',
        'projectsDescription' => 'تظهر المشاريع هنا بعد إضافتها من لوحة الإدارة، وتبقى منظمة حتى عند زيادة العدد.',
        'projectsEmptyTitle' => 'لم تتم إضافة مشاريع بعد',
        'projectsEmptyDescription' => 'يمكنك إضافة المشاريع من لوحة الإدارة.',
        'projectsEmptyButton' => 'إضافة مشروع',
        'projectsListSubtitle' => 'قائمة المشاريع',
        'projectsListTitle' => 'الأعمال المضافة',
        'projectDetailsButton' => 'تفاصيل المشروع',
        'projectFilterAll' => 'الكل',
        'projectFilterGeneral' => 'عام',
        'projectNotFoundTitle' => 'المشروع غير موجود',
        'projectNotFoundEmptyTitle' => 'لم يتم العثور على المشروع المطلوب',
        'projectNotFoundEmptyDescription' => 'يمكنك العودة إلى صفحة مشاريعنا واختيار مشروع آخر.',
        'projectDetailFallbackTitle' => 'تفاصيل المشروع',
        'projectFactStatus' => 'الحالة',
        'projectFactDate' => 'التاريخ',
        'projectFactCategory' => 'التصنيف',
        'projectBackButton' => 'العودة للمشاريع',
        'projectVisitButton' => 'زيارة رابط المشروع',
        'pagesDescription' => 'كل صفحة تضيفها من لوحة الإدارة تظهر هنا كبطاقة مستقلة ومنظمة.',
        'pagesEmptyTitle' => 'لم تتم إضافة صفحات بعد',
        'pagesEmptyDescription' => 'يمكنك إضافة الصفحات من لوحة الإدارة.',
        'pagesEmptyButton' => 'إضافة صفحة',
        'pagesListSubtitle' => 'قائمة الصفحات',
        'pagesListTitle' => 'الصفحات المضافة',
        'pageCardFallbackTitle' => 'صفحة',
        'pageOpenButton' => 'فتح الصفحة',
        'extraPageNotFoundTitle' => 'لم يتم العثور على الصفحة المطلوبة',
        'extraPageNotFoundDescription' => 'يمكنك العودة إلى الصفحة الرئيسية أو إنشاء الصفحة من لوحة الإدارة.',
        'extraPageEmptyTitle' => 'لم تتم إضافة محتوى لهذه الصفحة بعد',
        'extraPageEmptyDescription' => 'يمكن تعديل هذه الصفحة من لوحة الإدارة.',
        'notificationsLabel' => 'الإشعارات',
        'notificationsDescription' => 'كل التحديثات التي تمت من لوحة الإدارة تظهر هنا.',
        'notificationsEmptyTitle' => 'لا توجد إشعارات بعد',
        'notificationsEmptyDescription' => 'ستظهر هنا تحديثات الصفحة الرئيسية والمشاريع والصفحات بعد حفظها من لوحة الإدارة.',
        'notificationsViewAllLabel' => 'عرض كل الإشعارات',
        'notificationReadLabel' => 'مقروء',
        'notificationMarkReadLabel' => 'تحديد كمقروء',
        'notificationViewLabel' => 'عرض',
        'notificationDeleteLabel' => 'حذف',
    ];
}

function cms_default_page_feedback_settings(): array
{
    return [
        'enabled' => true,
        'question' => 'هل كانت هذه الصفحة مفيدة؟',
        'yesLabel' => 'نعم',
        'noLabel' => 'لا',
        'yesReasonsLabel' => 'ما الذي أعجبك في الصفحة؟',
        'noReasonsLabel' => 'ما الذي يمكن تحسينه؟',
        'yesOptions' => "المحتوى واضح\nالمعلومات مفيدة\nسهولة الوصول للمعلومة",
        'noOptions' => "المحتوى غير واضح\nالمعلومات غير مكتملة\nواجهت صعوبة في الاستخدام",
        'commentLabel' => 'ملاحظات إضافية',
        'commentPlaceholder' => 'اكتب ملاحظتك هنا',
        'agreementText' => 'تساعدنا ملاحظتك في تحسين محتوى هذه الصفحة.',
        'submitLabel' => 'إرسال التقييم',
        'closeLabel' => 'إغلاق',
        'successMessage' => 'تم استلام ملاحظتك، شكرا لك.',
        'errorMessage' => 'تعذر إرسال الملاحظة، حاول مرة أخرى.',
        'statisticsText' => '',
    ];
}

function cms_default_notification_settings(): array
{
    return [
        'enabled' => true,
        'includeActor' => true,
        'maxItems' => 20,
        'roles' => [
            'owner' => true,
            'admin' => true,
            'employee' => true,
        ],
        'events' => [
            'home' => true,
            'homeItems' => true,
            'projects' => true,
            'pages' => true,
            'cards' => false,
            'footer' => false,
            'settings' => false,
            'navigation' => false,
            'integrations' => false,
        ],
        'pages' => [
            'mode' => 'all',
            'slugs' => [],
        ],
        'popup' => [
            'enabled' => false,
            'audience' => 'public',
            'title' => 'إشعار',
            'subject' => "عزيزي منسوب الجامعة الإسلامية،\n\nنود إحاطتكم باعتماد تطبيق (بيم) كمنصة رسمية للتراسل الفوري الداخلي بالجامعة، وذلك ضمن جهود الجامعة في تعزيز التواصل المؤسسي والتحول الرقمي.\nنأمل من الجميع سرعة تحميل التطبيق وتفعيله واستخدامه في المراسلات الداخلية الرسمية، مع استمرار استخدام البريد الإلكتروني الرسمي للطلبات والمعاملات الرسمية.\n\nلتحميل التطبيق والتسجيل:",
            'linkLabel' => 'منصة بيم',
            'linkUrl' => 'https://beem.sa',
            'dismissLabel' => 'إلغاء',
        ],
    ];
}

function cms_default_site_data(): array
{
    return [
        'settings' => [
            'siteName' => '',
            'brandName' => '',
            'brandSlogan' => 'موقع شخصي',
            'brandLogo' => '',
            'siteIcon' => '',
            'language' => 'ar',
            'direction' => 'rtl',
            'theme' => 'light',
            'phoneNumber' => '',
            'email' => '',
            'shellTopbarText' => 'موقع شخصي قابل للإدارة عبر نظام محتوى محلي.',
            'shellTopbarShortText' => 'موقع شخصي قابل للإدارة.',
            'shellVerifyLabel' => 'كيف تتحقق؟',
            'shellVerifyTitle' => 'تحقق من رابط الموقع قبل إدخال أي بيانات.',
            'shellVerifyDescription' => 'استخدم الرابط الرسمي الذي يقدمه مالك الموقع، وتجنب الروابط المختصرة أو غير المعروفة.',
            'shellSecurityTitle' => 'الاتصال الآمن يستخدم بروتوكول HTTPS.',
            'shellSecurityDescription' => 'تأكد من ظهور القفل في المتصفح عند استخدام نسخة منشورة على الاستضافة.',
            'shellNoticeText' => 'هذا موقع شخصي مستقل وغير تابع لأي جهة حكومية.',
            'pageFeedback' => cms_default_page_feedback_settings(),
            'notificationSettings' => cms_default_notification_settings(),
        ],
        'navigation' => [
            'homeLabel' => 'الرئيسية',
            'projectsLabel' => 'مشاريعنا',
            'pagesLabel' => 'الصفحات',
            'adminLabel' => 'الإدارة',
            'items' => [],
        ],
        'texts' => cms_default_interface_texts(),
        'home' => [
            'ownerName' => '',
            'title' => '',
            'professionalTitle' => '',
            'intro' => '',
            'avatar' => '',
            'biography' => '',
            'heroImage' => '',
            'heroVideo' => '',
            'heroSlides' => [],
            'numbers' => [
                'title' => 'في أرقام',
                'subtitle' => '',
                'cards' => [],
            ],
            'experience' => [],
            'achievements' => [],
            'skills' => [],
            'contacts' => [],
            'footerLinks' => [],
        ],
        'footer' => [
            'columns' => [
                [
                    'id' => 'footer-column-quick',
                    'title' => 'روابط سريعة',
                    'visible' => true,
                    'links' => [],
                ],
            ],
            'iconGroups' => [
                [
                    'id' => 'footer-icons-social',
                    'title' => 'تابعنا',
                    'visible' => true,
                    'links' => [],
                ],
                [
                    'id' => 'footer-icons-app',
                    'title' => 'تطبيق الجوال',
                    'visible' => true,
                    'links' => [],
                ],
            ],
            'bottomLinks' => [],
            'logos' => [],
            'copyrightText' => '',
            'legalText' => '',
            'cookies' => [
                'enabled' => true,
                'title' => 'ملفات تعريف الارتباط',
                'content' => 'يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربة التصفح وتسهيل الاستخدام. بالمتابعة في استخدام الموقع، فإنك توافق على استخدام ملفات الارتباط.',
                'acceptLabel' => 'قبول',
                'declineLabel' => 'رفض',
                'linkPageSlugs' => [],
            ],
        ],
        'projects' => [],
        'cardCollections' => [],
        'pages' => [],
        'integrations' => [],
        'notifications' => [],
    ];
}

function cms_fetch_site_data(PDO $pdo): array
{
    $data = cms_default_site_data();
    cms_ensure_content_schema($pdo);

    $settings = $pdo->query('SELECT * FROM site_settings WHERE id = 1 LIMIT 1')->fetch();
    if ($settings) {
        $data['settings'] = array_merge($data['settings'], [
            'siteName' => (string) ($settings['site_name'] ?? ''),
            'brandName' => (string) ($settings['brand_name'] ?? ''),
            'brandSlogan' => (string) ($settings['brand_slogan'] ?? ''),
            'brandLogo' => (string) ($settings['brand_logo'] ?? ''),
            'siteIcon' => (string) ($settings['site_icon'] ?? ''),
            'language' => (string) ($settings['language'] ?? 'ar'),
            'direction' => (string) ($settings['direction'] ?? 'rtl'),
            'theme' => (string) ($settings['theme'] ?? 'light'),
            'phoneNumber' => (string) ($settings['phone_number'] ?? ''),
            'email' => (string) ($settings['email'] ?? ''),
            'shellTopbarText' => (string) ($settings['shell_topbar_text'] ?? $data['settings']['shellTopbarText']),
            'shellTopbarShortText' => (string) ($settings['shell_topbar_short_text'] ?? $data['settings']['shellTopbarShortText']),
            'shellVerifyLabel' => (string) ($settings['shell_verify_label'] ?? $data['settings']['shellVerifyLabel']),
            'shellVerifyTitle' => (string) ($settings['shell_verify_title'] ?? $data['settings']['shellVerifyTitle']),
            'shellVerifyDescription' => (string) ($settings['shell_verify_description'] ?? $data['settings']['shellVerifyDescription']),
            'shellSecurityTitle' => (string) ($settings['shell_security_title'] ?? $data['settings']['shellSecurityTitle']),
            'shellSecurityDescription' => (string) ($settings['shell_security_description'] ?? $data['settings']['shellSecurityDescription']),
            'shellNoticeText' => (string) ($settings['shell_notice_text'] ?? $data['settings']['shellNoticeText']),
        ]);
        $storedTexts = json_decode((string) ($settings['interface_texts_json'] ?? ''), true);
        if (is_array($storedTexts)) {
            $data['texts'] = array_merge($data['texts'], cms_normalize_interface_texts($storedTexts, $data['texts']));
        }
        $storedFooter = json_decode((string) ($settings['footer_json'] ?? ''), true);
        if (is_array($storedFooter)) {
            $data['footer'] = cms_normalize_footer($storedFooter, $data['footer']);
        }
        $storedPageFeedback = json_decode((string) ($settings['page_feedback_json'] ?? ''), true);
        if (is_array($storedPageFeedback)) {
            $data['settings']['pageFeedback'] = cms_normalize_page_feedback_settings($storedPageFeedback, $data['settings']['pageFeedback']);
        }
        $storedNotificationSettings = json_decode((string) ($settings['notification_settings_json'] ?? ''), true);
        if (is_array($storedNotificationSettings)) {
            $data['settings']['notificationSettings'] = cms_normalize_notification_settings($storedNotificationSettings, $data['settings']['notificationSettings']);
        }
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
            'heroTitle' => '',
            'heroSubtitle' => '',
            'heroIntro' => '',
            'heroImage' => (string) ($main['hero_image'] ?? ''),
            'heroVideo' => (string) ($main['hero_video'] ?? ''),
        ]);
        $data['home']['numbers']['title'] = (string) ($main['numbers_title'] ?? $data['home']['numbers']['title']);
        $data['home']['numbers']['subtitle'] = (string) ($main['numbers_subtitle'] ?? $data['home']['numbers']['subtitle']);
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

    $numbers = $pdo->query('SELECT * FROM home_numbers ORDER BY sort_order, id')->fetchAll();
    foreach ($numbers as $number) {
        $data['home']['numbers']['cards'][] = [
            'title' => (string) ($number['title'] ?? ''),
            'number' => (string) ($number['number_value'] ?? ''),
            'icon' => (string) ($number['icon_class'] ?? 'hgi-chart-up'),
            'visible' => (bool) ($number['visible'] ?? 1),
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

    $footerLinks = $pdo->query('SELECT * FROM footer_links ORDER BY sort_order, id')->fetchAll();
    foreach ($footerLinks as $link) {
        $data['home']['footerLinks'][] = [
            'label' => (string) ($link['label'] ?? ''),
            'url' => (string) ($link['url'] ?? ''),
            'visible' => (bool) ($link['visible'] ?? 1),
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
            'parentSlug' => (string) ($page['parent_slug'] ?? ''),
            'contentMode' => (string) ($page['content_mode'] ?? 'text'),
            'content' => (string) ($page['content'] ?? ''),
            'image' => (string) ($page['image_path'] ?? ''),
            'imagePath' => (string) ($page['image_path'] ?? ''),
            'video' => (string) ($page['video_path'] ?? ''),
            'videoPath' => (string) ($page['video_path'] ?? ''),
            'visible' => (bool) ($page['visible'] ?? 1),
            'showInNavigation' => (bool) ($page['show_in_navigation'] ?? ($page['visible'] ?? 1)),
            'showInFooter' => (bool) ($page['show_in_footer'] ?? 0),
            'createdAt' => (string) ($page['created_at'] ?? ''),
            'updatedAt' => (string) ($page['updated_at'] ?? ($page['created_at'] ?? '')),
        ];
    }

    $collections = $pdo->query('SELECT * FROM card_collections ORDER BY sort_order, id')->fetchAll();
    $cardsByCollection = [];
    $cards = $pdo->query('SELECT * FROM card_items ORDER BY sort_order, id')->fetchAll();
    foreach ($cards as $card) {
        $collectionId = (string) ($card['collection_uid'] ?? '');
        if ($collectionId === '') {
            continue;
        }
        $cardsByCollection[$collectionId][] = [
            'id' => (string) ($card['card_uid'] ?? ''),
            'title' => (string) ($card['title'] ?? ''),
            'subtitle' => (string) ($card['subtitle'] ?? ''),
            'linkType' => (string) ($card['link_type'] ?? 'none'),
            'linkValue' => (string) ($card['link_value'] ?? ''),
            'linkLabel' => (string) ($card['link_label'] ?? ''),
            'visible' => (bool) ($card['visible'] ?? 1),
        ];
    }
    foreach ($collections as $collection) {
        $collectionId = (string) ($collection['collection_uid'] ?? '');
        $data['cardCollections'][] = [
            'id' => $collectionId,
            'title' => (string) ($collection['title'] ?? ''),
            'slug' => (string) ($collection['slug'] ?? ''),
            'description' => (string) ($collection['description'] ?? ''),
            'visible' => (bool) ($collection['visible'] ?? 1),
            'showInNavigation' => (bool) ($collection['show_in_navigation'] ?? ($collection['visible'] ?? 1)),
            'showInFooter' => (bool) ($collection['show_in_footer'] ?? 0),
            'createdAt' => (string) ($collection['created_at'] ?? ''),
            'updatedAt' => (string) ($collection['updated_at'] ?? ($collection['created_at'] ?? '')),
            'cards' => $cardsByCollection[$collectionId] ?? [],
        ];
    }

    $integrations = $pdo->query('SELECT * FROM integrations ORDER BY sort_order, id')->fetchAll();
    foreach ($integrations as $integration) {
        $data['integrations'][] = [
            'type' => (string) ($integration['integration_type'] ?? 'custom'),
            'name' => (string) ($integration['name'] ?? ''),
            'provider' => (string) ($integration['provider'] ?? ''),
            'environment' => (string) ($integration['environment'] ?? 'test'),
            'endpointUrl' => (string) ($integration['endpoint_url'] ?? ''),
            'webhookUrl' => (string) ($integration['webhook_url'] ?? ''),
            'publicKey' => (string) ($integration['public_key'] ?? ''),
            'secretEnvKey' => (string) ($integration['secret_env_key'] ?? ''),
            'configJson' => (string) ($integration['config_json'] ?? ''),
            'enabled' => (bool) ($integration['enabled'] ?? 1),
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

function cms_ensure_footer_links_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS footer_links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            label VARCHAR(255),
            url VARCHAR(500),
            sort_order INT DEFAULT 0,
            visible TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_ensure_integrations_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS integrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            integration_type VARCHAR(80),
            name VARCHAR(255),
            provider VARCHAR(255),
            environment VARCHAR(50),
            endpoint_url VARCHAR(500),
            webhook_url VARCHAR(500),
            public_key VARCHAR(500),
            secret_env_key VARCHAR(255),
            config_json LONGTEXT,
            sort_order INT DEFAULT 0,
            enabled TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_ensure_home_numbers_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS home_numbers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            number_value VARCHAR(100),
            icon_class VARCHAR(120),
            sort_order INT DEFAULT 0,
            visible TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_ensure_card_collections_tables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS card_collections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            collection_uid VARCHAR(120) UNIQUE,
            title VARCHAR(255),
            slug VARCHAR(255) UNIQUE,
            description TEXT,
            sort_order INT DEFAULT 0,
            visible TINYINT(1) DEFAULT 1,
            show_in_navigation TINYINT(1) DEFAULT 1,
            show_in_footer TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS card_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            collection_uid VARCHAR(120),
            card_uid VARCHAR(120),
            title VARCHAR(255),
            subtitle TEXT,
            link_type VARCHAR(20),
            link_value VARCHAR(500),
            link_label VARCHAR(120),
            sort_order INT DEFAULT 0,
            visible TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_card_items_collection_uid (collection_uid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name AND COLUMN_NAME = :column_name'
    );
    $stmt->execute([
        'table_name' => $table,
        'column_name' => $column,
    ]);
    return (int) $stmt->fetchColumn() > 0;
}

function cms_ensure_site_settings_columns(PDO $pdo): void
{
    $columns = [
        'shell_topbar_text' => 'VARCHAR(255)',
        'site_icon' => 'VARCHAR(500)',
        'shell_topbar_short_text' => 'VARCHAR(255)',
        'shell_verify_label' => 'VARCHAR(100)',
        'shell_verify_title' => 'VARCHAR(255)',
        'shell_verify_description' => 'TEXT',
        'shell_security_title' => 'VARCHAR(255)',
        'shell_security_description' => 'TEXT',
        'shell_notice_text' => 'VARCHAR(255)',
        'interface_texts_json' => 'LONGTEXT',
        'footer_json' => 'LONGTEXT',
        'page_feedback_json' => 'LONGTEXT',
        'notification_settings_json' => 'LONGTEXT',
    ];

    foreach ($columns as $column => $definition) {
        if (!cms_column_exists($pdo, 'site_settings', $column)) {
            $pdo->exec('ALTER TABLE site_settings ADD COLUMN ' . $column . ' ' . $definition);
        }
    }
}

function cms_ensure_main_page_columns(PDO $pdo): void
{
    $columns = [
        'numbers_title' => 'VARCHAR(255)',
        'numbers_subtitle' => 'VARCHAR(255)',
    ];

    foreach ($columns as $column => $definition) {
        if (!cms_column_exists($pdo, 'main_page', $column)) {
            $pdo->exec('ALTER TABLE main_page ADD COLUMN ' . $column . ' ' . $definition);
        }
    }
}

function cms_ensure_pages_columns(PDO $pdo): void
{
    $columns = [
        'parent_slug' => 'VARCHAR(255)',
        'image_path' => 'VARCHAR(500)',
        'video_path' => 'VARCHAR(500)',
        'show_in_navigation' => 'TINYINT(1) DEFAULT 1',
        'show_in_footer' => 'TINYINT(1) DEFAULT 0',
        'created_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'updated_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];

    foreach ($columns as $column => $definition) {
        if (!cms_column_exists($pdo, 'pages', $column)) {
            $pdo->exec('ALTER TABLE pages ADD COLUMN ' . $column . ' ' . $definition);
        }
    }
}

function cms_ensure_content_schema(PDO $pdo): void
{
    static $checked = [];
    if ($pdo->inTransaction()) {
        return;
    }

    $key = spl_object_id($pdo);
    if (isset($checked[$key])) {
        return;
    }

    cms_ensure_notifications_table($pdo);
    cms_ensure_footer_links_table($pdo);
    cms_ensure_integrations_table($pdo);
    cms_ensure_home_numbers_table($pdo);
    cms_ensure_card_collections_tables($pdo);
    cms_ensure_site_settings_columns($pdo);
    cms_ensure_main_page_columns($pdo);
    cms_ensure_pages_columns($pdo);
    $checked[$key] = true;
}

function cms_save_site_data(PDO $pdo, array $input): array
{
    $data = cms_normalize_site_data($input);
    cms_ensure_content_schema($pdo);
    $started = !$pdo->inTransaction();
    if ($started) {
        $pdo->beginTransaction();
    }

    try {
        cms_save_settings($pdo, $data);
        cms_save_navigation($pdo, $data);
        cms_save_main_page($pdo, $data);
        cms_replace_hero_slides($pdo, $data['home']['heroSlides']);
        cms_replace_home_numbers($pdo, $data['home']['numbers']['cards']);
        cms_replace_content_rows($pdo, 'experiences', $data['home']['experience']);
        cms_replace_content_rows($pdo, 'achievements', $data['home']['achievements']);
        cms_replace_skills($pdo, $data['home']['skills']);
        cms_replace_projects($pdo, $data['projects']);
        cms_replace_card_collections($pdo, $data['cardCollections']);
        cms_replace_pages($pdo, $data['pages']);
        cms_replace_contacts($pdo, $data['home']['contacts']);
        cms_replace_footer_links($pdo, $data['home']['footerLinks']);
        cms_replace_integrations($pdo, $data['integrations']);
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

function cms_save_site_data_for_admin(PDO $pdo, array $input, array $user): array
{
    if (cms_admin_has_permission($user, 'backup')) {
        return cms_save_site_data($pdo, $input);
    }

    $allowedSections = cms_content_permission_keys();
    if (!cms_admin_has_any_permission($user, array_merge($allowedSections, ['page_feedback', 'notifications']))) {
        cms_json_response(['success' => false, 'message' => 'Permission denied.'], 403);
    }

    $incoming = cms_normalize_site_data($input);
    $current = cms_fetch_site_data($pdo);

    if (cms_admin_has_permission($user, 'settings')) {
        $notificationSettings = $current['settings']['notificationSettings'] ?? cms_default_notification_settings();
        $current['settings'] = $incoming['settings'];
        $current['texts'] = $incoming['texts'];
        if (!cms_admin_has_permission($user, 'notifications')) {
            $current['settings']['notificationSettings'] = $notificationSettings;
        }
    }
    if (cms_admin_has_permission($user, 'page_feedback')) {
        $current['settings']['pageFeedback'] = $incoming['settings']['pageFeedback'];
    }
    if (cms_admin_has_permission($user, 'notifications')) {
        $current['settings']['notificationSettings'] = $incoming['settings']['notificationSettings'];
    }
    if (cms_admin_has_permission($user, 'home')) {
        $current['home'] = $incoming['home'];
    }
    if (cms_admin_has_permission($user, 'footer')) {
        $current['footer'] = $incoming['footer'];
        $current['home']['contacts'] = $incoming['home']['contacts'];
        $current['home']['footerLinks'] = $incoming['home']['footerLinks'];
        $current['texts']['footerLinksHeading'] = $incoming['texts']['footerLinksHeading'];
        $current['texts']['footerSocialHeading'] = $incoming['texts']['footerSocialHeading'];
        $current['texts']['footerSocialEmpty'] = $incoming['texts']['footerSocialEmpty'];
        $current['texts']['footerVersion'] = $incoming['texts']['footerVersion'];
        $current['texts']['footerDisclaimer'] = $incoming['texts']['footerDisclaimer'];
    }
    if (cms_admin_has_permission($user, 'projects')) {
        $current['projects'] = $incoming['projects'];
    }
    if (cms_admin_has_permission($user, 'cards')) {
        $current['cardCollections'] = $incoming['cardCollections'];
    }
    if (cms_admin_has_permission($user, 'pages')) {
        $current['pages'] = $incoming['pages'];
    }
    if (cms_admin_has_permission($user, 'navigation')) {
        $current['navigation'] = $incoming['navigation'];
    }
    if (cms_admin_has_permission($user, 'integrations')) {
        $current['integrations'] = $incoming['integrations'];
    }

    if (cms_admin_has_any_permission($user, $allowedSections)) {
        $current['notifications'] = $incoming['notifications'];
    }

    return cms_save_site_data($pdo, $current);
}

function cms_normalize_site_data(array $input): array
{
    $default = cms_default_site_data();
    $settings = is_array($input['settings'] ?? null) ? $input['settings'] : [];
    $navigation = is_array($input['navigation'] ?? null) ? $input['navigation'] : [];
    $home = is_array($input['home'] ?? null) ? $input['home'] : [];
    $footer = is_array($input['footer'] ?? null) ? $input['footer'] : [];

    $data = $default;
    $direction = (string) ($settings['direction'] ?? 'rtl');
    $theme = (string) ($settings['theme'] ?? 'light');
    $data['settings'] = [
        'siteName' => cms_string($settings['siteName'] ?? $settings['site_name'] ?? '', 255),
        'brandName' => cms_string($settings['brandName'] ?? $settings['brand_name'] ?? '', 255),
        'brandSlogan' => cms_string($settings['brandSlogan'] ?? $settings['brand_slogan'] ?? 'موقع شخصي', 255),
        'brandLogo' => cms_safe_path($settings['brandLogo'] ?? $settings['brand_logo'] ?? ''),
        'siteIcon' => cms_safe_path($settings['siteIcon'] ?? $settings['site_icon'] ?? ''),
        'language' => cms_string($settings['language'] ?? 'ar', 10) ?: 'ar',
        'direction' => in_array($direction, ['rtl', 'ltr'], true) ? $direction : 'rtl',
        'theme' => in_array($theme, ['light', 'dark'], true) ? $theme : 'light',
        'phoneNumber' => cms_string($settings['phoneNumber'] ?? $settings['phone_number'] ?? '', 50),
        'email' => filter_var($settings['email'] ?? '', FILTER_VALIDATE_EMAIL) ? (string) $settings['email'] : cms_string($settings['email'] ?? '', 255),
        'shellTopbarText' => cms_string($settings['shellTopbarText'] ?? $settings['shell_topbar_text'] ?? $default['settings']['shellTopbarText'], 255) ?: $default['settings']['shellTopbarText'],
        'shellTopbarShortText' => cms_string($settings['shellTopbarShortText'] ?? $settings['shell_topbar_short_text'] ?? $default['settings']['shellTopbarShortText'], 255) ?: $default['settings']['shellTopbarShortText'],
        'shellVerifyLabel' => cms_string($settings['shellVerifyLabel'] ?? $settings['shell_verify_label'] ?? $default['settings']['shellVerifyLabel'], 100) ?: $default['settings']['shellVerifyLabel'],
        'shellVerifyTitle' => cms_string($settings['shellVerifyTitle'] ?? $settings['shell_verify_title'] ?? $default['settings']['shellVerifyTitle'], 255) ?: $default['settings']['shellVerifyTitle'],
        'shellVerifyDescription' => cms_string($settings['shellVerifyDescription'] ?? $settings['shell_verify_description'] ?? $default['settings']['shellVerifyDescription']),
        'shellSecurityTitle' => cms_string($settings['shellSecurityTitle'] ?? $settings['shell_security_title'] ?? $default['settings']['shellSecurityTitle'], 255) ?: $default['settings']['shellSecurityTitle'],
        'shellSecurityDescription' => cms_string($settings['shellSecurityDescription'] ?? $settings['shell_security_description'] ?? $default['settings']['shellSecurityDescription']),
        'shellNoticeText' => cms_string($settings['shellNoticeText'] ?? $settings['shell_notice_text'] ?? $default['settings']['shellNoticeText'], 255) ?: $default['settings']['shellNoticeText'],
        'pageFeedback' => cms_normalize_page_feedback_settings($settings['pageFeedback'] ?? $settings['page_feedback'] ?? [], $default['settings']['pageFeedback']),
        'notificationSettings' => cms_normalize_notification_settings($settings['notificationSettings'] ?? $settings['notification_settings'] ?? [], $default['settings']['notificationSettings']),
    ];

    $data['navigation'] = [
        'homeLabel' => cms_string($navigation['homeLabel'] ?? 'الرئيسية', 255) ?: 'الرئيسية',
        'projectsLabel' => cms_string($navigation['projectsLabel'] ?? 'مشاريعنا', 255) ?: 'مشاريعنا',
        'pagesLabel' => cms_string($navigation['pagesLabel'] ?? 'الصفحات', 255) ?: 'الصفحات',
        'adminLabel' => cms_string($navigation['adminLabel'] ?? 'الإدارة', 255) ?: 'الإدارة',
        'items' => [],
    ];
    $data['texts'] = cms_normalize_interface_texts($input['texts'] ?? [], $default['texts']);

    $data['home'] = [
        'ownerName' => cms_string($home['ownerName'] ?? $home['owner_name'] ?? '', 255),
        'title' => cms_string($home['title'] ?? $home['professionalTitle'] ?? $home['professional_title'] ?? '', 255),
        'professionalTitle' => cms_string($home['professionalTitle'] ?? $home['title'] ?? '', 255),
        'intro' => cms_string($home['intro'] ?? ''),
        'avatar' => cms_safe_path($home['avatar'] ?? $home['avatarPath'] ?? ''),
        'biography' => cms_string($home['biography'] ?? ''),
        'heroTitle' => '',
        'heroSubtitle' => '',
        'heroIntro' => '',
        'heroImage' => cms_safe_path($home['heroImage'] ?? ''),
        'heroVideo' => cms_safe_path($home['heroVideo'] ?? ''),
        'heroSlides' => cms_normalize_hero_slides($home['heroSlides'] ?? []),
        'numbers' => cms_normalize_home_numbers($home['numbers'] ?? []),
        'experience' => cms_normalize_content_rows($home['experience'] ?? []),
        'achievements' => cms_normalize_content_rows($home['achievements'] ?? []),
        'skills' => cms_normalize_skills($home['skills'] ?? []),
        'contacts' => cms_normalize_contacts($home['contacts'] ?? []),
        'footerLinks' => cms_normalize_footer_links($home['footerLinks'] ?? $home['footer_links'] ?? []),
    ];

    $data['projects'] = cms_normalize_projects($input['projects'] ?? []);
    $data['cardCollections'] = cms_normalize_card_collections($input['cardCollections'] ?? $input['card_collections'] ?? []);
    $data['pages'] = cms_normalize_pages($input['pages'] ?? []);
    $data['footer'] = cms_normalize_footer($footer, $default['footer']);
    $data['integrations'] = cms_normalize_integrations($input['integrations'] ?? []);
    $data['notifications'] = cms_normalize_notifications($input['notifications'] ?? []);

    return $data;
}

function cms_normalize_interface_texts(mixed $items, array $defaults): array
{
    if (!is_array($items)) {
        return $defaults;
    }
    $output = $defaults;
    foreach ($defaults as $key => $fallback) {
        if (array_key_exists($key, $items)) {
            $value = cms_string($items[$key] ?? '', 1000);
            $output[$key] = $value !== '' ? $value : (string) $fallback;
        }
    }
    return $output;
}

function cms_safe_path(mixed $value): string
{
    $path = cms_string($value, 500);
    if ($path === '' || preg_match('/(^|\/)\.\.(\/|$)/', str_replace('\\', '/', $path))) {
        return '';
    }
    return ltrim(str_replace('\\', '/', $path), '/');
}

function cms_timestamp(mixed $value, ?string $fallback = null): string
{
    $text = trim((string) ($value ?? ''));
    if ($text !== '') {
        try {
            return (new DateTimeImmutable($text))->format('Y-m-d H:i:s');
        } catch (Exception $error) {
            // Fall back to the supplied timestamp or the current time below.
        }
    }

    if ($fallback !== null && trim($fallback) !== '') {
        return $fallback;
    }

    return gmdate('Y-m-d H:i:s');
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

function cms_normalize_hgi_icon(mixed $value): string
{
    $text = cms_string($value, 120);
    if (preg_match('/\bhgi-[a-z0-9-]+\b/i', $text, $matches)) {
        return strtolower($matches[0]);
    }
    return 'hgi-chart-up';
}

function cms_normalize_home_numbers(mixed $input): array
{
    if (!is_array($input)) {
        $input = [];
    }
    $cards = [];
    $items = $input['cards'] ?? $input['items'] ?? [];
    if (is_array($items)) {
        foreach (array_values($items) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $card = [
                'title' => cms_string($item['title'] ?? $item['label'] ?? '', 255),
                'number' => cms_string($item['number'] ?? $item['value'] ?? $item['numberValue'] ?? '', 100),
                'icon' => cms_normalize_hgi_icon($item['icon'] ?? $item['iconClass'] ?? ''),
                'visible' => cms_bool($item['visible'] ?? true),
            ];
            if ($card['title'] !== '' || $card['number'] !== '') {
                $cards[] = $card;
            }
        }
    }

    return [
        'title' => cms_string($input['title'] ?? 'في أرقام', 255) ?: 'في أرقام',
        'subtitle' => cms_string($input['subtitle'] ?? $input['description'] ?? '', 255),
        'cards' => $cards,
    ];
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

function cms_normalize_card_collections(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    $usedSlugs = [];
    $usedIds = [];
    foreach (array_values($items) as $index => $item) {
        if (!is_array($item)) {
            continue;
        }
        $title = cms_string($item['title'] ?? $item['pageTitle'] ?? '', 255);
        $slug = cms_unique_slug($usedSlugs, $item['slug'] ?? '', $title ?: 'cards');
        $id = cms_string($item['id'] ?? $item['collectionId'] ?? $item['collection_uid'] ?? '', 120);
        if ($id === '' || isset($usedIds[$id])) {
            $id = 'cards-' . substr(hash('sha256', $slug . '|' . $title . '|' . $index), 0, 16);
        }
        $usedIds[$id] = true;
        $createdAt = cms_timestamp($item['createdAt'] ?? $item['created_at'] ?? null);
        $updatedAt = cms_timestamp($item['updatedAt'] ?? $item['updated_at'] ?? null, $createdAt);
        $cards = cms_normalize_collection_cards($item['cards'] ?? []);
        $collection = [
            'id' => $id,
            'title' => $title,
            'slug' => $slug,
            'description' => cms_string($item['description'] ?? '', 1000),
            'visible' => cms_bool($item['visible'] ?? true),
            'showInNavigation' => cms_bool($item['showInNavigation'] ?? $item['show_in_navigation'] ?? true),
            'showInFooter' => cms_bool($item['showInFooter'] ?? $item['show_in_footer'] ?? false),
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
            'cards' => $cards,
        ];
        if ($collection['title'] !== '' || $collection['description'] !== '' || count($cards) > 0) {
            $output[] = $collection;
        }
    }
    return $output;
}

function cms_normalize_collection_cards(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    $usedIds = [];
    foreach (array_values($items) as $index => $item) {
        if (!is_array($item)) {
            continue;
        }
        $title = cms_string($item['title'] ?? '', 255);
        $subtitle = cms_string($item['subtitle'] ?? $item['description'] ?? '', 1000);
        $linkType = cms_string($item['linkType'] ?? $item['link_type'] ?? 'none', 20);
        if (!in_array($linkType, ['none', 'page', 'external'], true)) {
            $linkType = 'none';
        }
        $linkValue = cms_string($item['linkValue'] ?? $item['link_value'] ?? $item['url'] ?? '', 500);
        if ($linkType === 'page') {
            $linkValue = cms_slug($linkValue);
        }
        if ($linkValue === '') {
            $linkType = 'none';
        }
        $id = cms_string($item['id'] ?? $item['cardId'] ?? $item['card_uid'] ?? '', 120);
        if ($id === '' || isset($usedIds[$id])) {
            $id = 'card-' . substr(hash('sha256', $title . '|' . $subtitle . '|' . $linkValue . '|' . $index), 0, 16);
        }
        $usedIds[$id] = true;
        $card = [
            'id' => $id,
            'title' => $title,
            'subtitle' => $subtitle,
            'linkType' => $linkType,
            'linkValue' => $linkValue,
            'linkLabel' => cms_string($item['linkLabel'] ?? $item['link_label'] ?? 'عرض التفاصيل', 120) ?: 'عرض التفاصيل',
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($card['title'] !== '' || $card['subtitle'] !== '' || $card['linkValue'] !== '') {
            $output[] = $card;
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
        $createdAt = cms_timestamp($item['createdAt'] ?? $item['created_at'] ?? null);
        $updatedAt = cms_timestamp($item['updatedAt'] ?? $item['updated_at'] ?? null, $createdAt);
        $page = [
            'title' => $title,
            'slug' => cms_unique_slug($used, $item['slug'] ?? '', $title ?: 'page'),
            'parentSlug' => cms_slug($item['parentSlug'] ?? $item['parent_slug'] ?? ''),
            'contentMode' => $mode,
            'content' => cms_string($item['content'] ?? ''),
            'image' => cms_safe_path($item['image'] ?? $item['imagePath'] ?? $item['image_path'] ?? ''),
            'video' => cms_safe_path($item['video'] ?? $item['videoPath'] ?? $item['video_path'] ?? ''),
            'visible' => cms_bool($item['visible'] ?? true),
            'showInNavigation' => cms_bool($item['showInNavigation'] ?? $item['show_in_navigation'] ?? $item['visible'] ?? true),
            'showInFooter' => cms_bool($item['showInFooter'] ?? $item['show_in_footer'] ?? false),
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
        ];
        if ($page['title'] !== '' || $page['content'] !== '' || $page['image'] !== '' || $page['video'] !== '') {
            $output[] = $page;
        }
    }
    $availableSlugs = [];
    foreach ($output as $page) {
        if ($page['slug'] !== '') {
            $availableSlugs[$page['slug']] = true;
        }
    }
    $pagesBySlug = [];
    $parentsWithChildren = [];
    foreach ($output as $page) {
        if ($page['slug'] !== '') {
            $pagesBySlug[$page['slug']] = $page;
        }
        if ($page['parentSlug'] !== '') {
            $parentsWithChildren[$page['parentSlug']] = true;
        }
    }
    foreach ($output as &$page) {
        $hadParent = $page['parentSlug'] !== '';
        $parentSlug = $page['parentSlug'];
        $parent = $pagesBySlug[$parentSlug] ?? null;
        if ($parentSlug === $page['slug']
            || !isset($availableSlugs[$parentSlug])
            || (is_array($parent) && $parent['parentSlug'] !== '')
            || isset($parentsWithChildren[$page['slug']])
        ) {
            $page['parentSlug'] = '';
        }
        if ($hadParent || $page['title'] === 'صفحة فرعية جديدة') {
            $page['showInNavigation'] = false;
        }
    }
    unset($page);
    $rootParentsWithChildren = [];
    foreach ($output as $page) {
        if ($page['parentSlug'] !== '') {
            $rootParentsWithChildren[$page['parentSlug']] = true;
        }
    }
    foreach ($output as &$page) {
        if ($page['parentSlug'] === '' && isset($rootParentsWithChildren[$page['slug']])) {
            $page['contentMode'] = 'text';
            $page['content'] = '';
            $page['image'] = '';
            $page['video'] = '';
            $page['showInFooter'] = false;
        }
    }
    unset($page);
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

function cms_normalize_footer_links(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $link = [
            'label' => cms_string($item['label'] ?? '', 255),
            'url' => cms_string($item['url'] ?? $item['href'] ?? '', 500),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($link['label'] !== '' || $link['url'] !== '') {
            $output[] = $link;
        }
    }
    return $output;
}

function cms_normalize_footer_managed_links(mixed $items, bool $withIcons = false): array
{
    if (!is_array($items)) {
        return [];
    }
    $output = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $link = [
            'label' => cms_string($item['label'] ?? $item['title'] ?? '', 255),
            'url' => cms_string($item['url'] ?? $item['href'] ?? '', 500),
            'visible' => cms_bool($item['visible'] ?? true),
        ];
        if ($withIcons) {
            $link['iconType'] = cms_string($item['iconType'] ?? $item['icon_type'] ?? 'website', 100) ?: 'website';
            $link['iconPath'] = cms_safe_path($item['iconPath'] ?? $item['icon_path'] ?? '');
        }
        if ($link['label'] !== '' || $link['url'] !== '' || ($withIcons && ($link['iconType'] !== '' || $link['iconPath'] !== ''))) {
            $output[] = $link;
        }
    }
    return $output;
}

function cms_normalize_footer_cookies(mixed $cookies, array $defaults): array
{
    $output = $defaults;
    if (!is_array($cookies)) {
        return $output;
    }
    $output['enabled'] = cms_bool($cookies['enabled'] ?? $defaults['enabled'] ?? true);
    $output['title'] = cms_string($cookies['title'] ?? $defaults['title'] ?? '', 255);
    $output['content'] = cms_string($cookies['content'] ?? $defaults['content'] ?? '', 1200);
    $output['acceptLabel'] = cms_string($cookies['acceptLabel'] ?? $cookies['accept_label'] ?? $defaults['acceptLabel'] ?? '', 100);
    $output['declineLabel'] = cms_string($cookies['declineLabel'] ?? $cookies['decline_label'] ?? $defaults['declineLabel'] ?? '', 100);
    $output['linkPageSlugs'] = [];
    $rawSlugs = $cookies['linkPageSlugs'] ?? $cookies['link_page_slugs'] ?? [];
    if (is_array($rawSlugs)) {
        foreach (array_values($rawSlugs) as $slug) {
            $value = cms_string($slug, 180);
            if ($value !== '' && !in_array($value, $output['linkPageSlugs'], true)) {
                $output['linkPageSlugs'][] = $value;
            }
        }
    }
    return $output;
}

function cms_normalize_page_feedback_settings(mixed $settings, array $defaults): array
{
    $output = $defaults ?: cms_default_page_feedback_settings();
    if (!is_array($settings)) {
        return $output;
    }

    $output['enabled'] = cms_bool($settings['enabled'] ?? $output['enabled'] ?? true);
    foreach ([
        'question' => 255,
        'yesLabel' => 80,
        'noLabel' => 80,
        'yesReasonsLabel' => 255,
        'noReasonsLabel' => 255,
        'yesOptions' => 1200,
        'noOptions' => 1200,
        'commentLabel' => 255,
        'commentPlaceholder' => 255,
        'agreementText' => 500,
        'submitLabel' => 120,
        'closeLabel' => 120,
        'successMessage' => 255,
        'errorMessage' => 255,
        'statisticsText' => 255,
    ] as $key => $max) {
        if (array_key_exists($key, $settings)) {
            $value = cms_string($settings[$key] ?? '', $max);
            $output[$key] = $value !== '' ? $value : (string) ($output[$key] ?? '');
        }
    }
    return $output;
}

function cms_normalize_notification_settings(mixed $settings, array $defaults): array
{
    $output = $defaults ?: cms_default_notification_settings();
    if (!is_array($settings)) {
        return $output;
    }

    $output['enabled'] = cms_bool($settings['enabled'] ?? $output['enabled'] ?? true);
    $output['includeActor'] = cms_bool($settings['includeActor'] ?? $settings['include_actor'] ?? $output['includeActor'] ?? true);
    $maxItems = (int) ($settings['maxItems'] ?? $settings['max_items'] ?? $output['maxItems'] ?? 20);
    $output['maxItems'] = max(5, min(20, $maxItems));

    $roles = is_array($settings['roles'] ?? null) ? $settings['roles'] : [];
    foreach (['owner', 'admin', 'employee'] as $role) {
        $output['roles'][$role] = cms_bool($roles[$role] ?? $output['roles'][$role] ?? true);
    }

    $events = is_array($settings['events'] ?? null) ? $settings['events'] : [];
    foreach (['home', 'homeItems', 'projects', 'pages', 'cards', 'footer', 'settings', 'navigation', 'integrations'] as $event) {
        $output['events'][$event] = cms_bool($events[$event] ?? $output['events'][$event] ?? false);
    }

    $pages = is_array($settings['pages'] ?? null) ? $settings['pages'] : [];
    $mode = (string) ($pages['mode'] ?? $output['pages']['mode'] ?? 'all');
    $output['pages']['mode'] = in_array($mode, ['all', 'selected'], true) ? $mode : 'all';
    $output['pages']['slugs'] = [];
    if (is_array($pages['slugs'] ?? null)) {
        foreach ($pages['slugs'] as $slug) {
            $clean = cms_slug($slug);
            if ($clean !== '' && !in_array($clean, $output['pages']['slugs'], true)) {
                $output['pages']['slugs'][] = $clean;
            }
        }
    }

    $popup = is_array($settings['popup'] ?? null) ? $settings['popup'] : [];
    $output['popup']['enabled'] = cms_bool($popup['enabled'] ?? $output['popup']['enabled'] ?? false, false);
    $audience = (string) ($popup['audience'] ?? $output['popup']['audience'] ?? 'public');
    $output['popup']['audience'] = in_array($audience, ['public', 'employees', 'all'], true) ? $audience : 'public';
    $output['popup']['title'] = cms_string($popup['title'] ?? $output['popup']['title'] ?? 'إشعار', 255) ?: 'إشعار';
    $output['popup']['subject'] = cms_string($popup['subject'] ?? $output['popup']['subject'] ?? '', 4000);
    $output['popup']['linkLabel'] = cms_string($popup['linkLabel'] ?? $popup['link_label'] ?? $output['popup']['linkLabel'] ?? '', 255);
    $output['popup']['linkUrl'] = cms_string($popup['linkUrl'] ?? $popup['link_url'] ?? $output['popup']['linkUrl'] ?? '', 500);
    $output['popup']['dismissLabel'] = cms_string($popup['dismissLabel'] ?? $popup['dismiss_label'] ?? $output['popup']['dismissLabel'] ?? 'إلغاء', 100) ?: 'إلغاء';

    return $output;
}

function cms_normalize_footer(mixed $footer, array $defaults): array
{
    if (!is_array($footer)) {
        return $defaults;
    }
    $output = $defaults;
    $output['columns'] = [];
    foreach (array_values($footer['columns'] ?? []) as $column) {
        if (!is_array($column)) {
            continue;
        }
        $normalized = [
            'id' => cms_string($column['id'] ?? '', 120),
            'title' => cms_string($column['title'] ?? '', 255),
            'visible' => cms_bool($column['visible'] ?? true),
            'links' => cms_normalize_footer_managed_links($column['links'] ?? []),
        ];
        if ($normalized['title'] !== '' || $normalized['links'] !== []) {
            $output['columns'][] = $normalized;
        }
    }
    $output['iconGroups'] = [];
    foreach (array_values($footer['iconGroups'] ?? $footer['icon_groups'] ?? []) as $group) {
        if (!is_array($group)) {
            continue;
        }
        $normalized = [
            'id' => cms_string($group['id'] ?? '', 120),
            'title' => cms_string($group['title'] ?? '', 255),
            'visible' => cms_bool($group['visible'] ?? true),
            'links' => cms_normalize_footer_managed_links($group['links'] ?? [], true),
        ];
        if ($normalized['title'] !== '' || $normalized['links'] !== []) {
            $output['iconGroups'][] = $normalized;
        }
    }
    $output['bottomLinks'] = cms_normalize_footer_managed_links($footer['bottomLinks'] ?? $footer['bottom_links'] ?? []);
    $output['logos'] = [];
    foreach (array_values($footer['logos'] ?? []) as $logo) {
        if (!is_array($logo)) {
            continue;
        }
        $normalized = [
            'id' => cms_string($logo['id'] ?? '', 120),
            'label' => cms_string($logo['label'] ?? '', 255),
            'alt' => cms_string($logo['alt'] ?? '', 255),
            'url' => cms_string($logo['url'] ?? '', 500),
            'src' => cms_safe_path($logo['src'] ?? $logo['image'] ?? $logo['logo'] ?? ''),
            'visible' => cms_bool($logo['visible'] ?? true),
        ];
        if ($normalized['label'] !== '' || $normalized['alt'] !== '' || $normalized['url'] !== '' || $normalized['src'] !== '') {
            $output['logos'][] = $normalized;
        }
    }
    $output['copyrightText'] = cms_string($footer['copyrightText'] ?? $footer['copyright_text'] ?? '', 500);
    $output['legalText'] = cms_string($footer['legalText'] ?? $footer['legal_text'] ?? '', 1000);
    $output['cookies'] = cms_normalize_footer_cookies($footer['cookies'] ?? [], $defaults['cookies'] ?? []);
    return $output;
}

function cms_normalize_integrations(mixed $items): array
{
    if (!is_array($items)) {
        return [];
    }
    $allowedTypes = ['payment', 'analytics', 'api', 'chat', 'email', 'custom'];
    $allowedEnvironments = ['test', 'live', 'sandbox'];
    $output = [];
    foreach (array_values($items) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $type = cms_string($item['type'] ?? $item['integration_type'] ?? 'custom', 80) ?: 'custom';
        $environment = cms_string($item['environment'] ?? 'test', 50) ?: 'test';
        $integration = [
            'type' => in_array($type, $allowedTypes, true) ? $type : 'custom',
            'name' => cms_string($item['name'] ?? '', 255),
            'provider' => cms_string($item['provider'] ?? '', 255),
            'environment' => in_array($environment, $allowedEnvironments, true) ? $environment : 'test',
            'endpointUrl' => cms_string($item['endpointUrl'] ?? $item['endpoint_url'] ?? '', 500),
            'webhookUrl' => cms_string($item['webhookUrl'] ?? $item['webhook_url'] ?? '', 500),
            'publicKey' => cms_string($item['publicKey'] ?? $item['public_key'] ?? '', 500),
            'secretEnvKey' => cms_string($item['secretEnvKey'] ?? $item['secret_env_key'] ?? '', 255),
            'configJson' => cms_string($item['configJson'] ?? $item['config_json'] ?? ''),
            'enabled' => cms_bool($item['enabled'] ?? true),
        ];
        if ($integration['name'] !== '' || $integration['provider'] !== '' || $integration['endpointUrl'] !== '' || $integration['webhookUrl'] !== '' || $integration['publicKey'] !== '' || $integration['secretEnvKey'] !== '' || $integration['configJson'] !== '') {
            $output[] = $integration;
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
    $interfaceTextsJson = json_encode($data['texts'] ?? cms_default_interface_texts(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $footerJson = json_encode($data['footer'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $pageFeedbackJson = json_encode($data['settings']['pageFeedback'] ?? cms_default_page_feedback_settings(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $notificationSettingsJson = json_encode($data['settings']['notificationSettings'] ?? cms_default_notification_settings(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (id, site_name, brand_name, brand_slogan, brand_logo, site_icon, language, direction, theme, phone_number, email,
         shell_topbar_text, shell_topbar_short_text, shell_verify_label, shell_verify_title, shell_verify_description,
         shell_security_title, shell_security_description, shell_notice_text, interface_texts_json, footer_json, page_feedback_json, notification_settings_json)
         VALUES (1, :site_name, :brand_name, :brand_slogan, :brand_logo, :site_icon, :language, :direction, :theme, :phone_number, :email,
         :shell_topbar_text, :shell_topbar_short_text, :shell_verify_label, :shell_verify_title, :shell_verify_description,
         :shell_security_title, :shell_security_description, :shell_notice_text, :interface_texts_json, :footer_json, :page_feedback_json, :notification_settings_json)
         ON DUPLICATE KEY UPDATE site_name = VALUES(site_name), brand_name = VALUES(brand_name), brand_slogan = VALUES(brand_slogan),
         brand_logo = VALUES(brand_logo), site_icon = VALUES(site_icon), language = VALUES(language), direction = VALUES(direction), theme = VALUES(theme),
         phone_number = VALUES(phone_number), email = VALUES(email), shell_topbar_text = VALUES(shell_topbar_text),
         shell_topbar_short_text = VALUES(shell_topbar_short_text), shell_verify_label = VALUES(shell_verify_label),
         shell_verify_title = VALUES(shell_verify_title), shell_verify_description = VALUES(shell_verify_description),
         shell_security_title = VALUES(shell_security_title), shell_security_description = VALUES(shell_security_description),
         shell_notice_text = VALUES(shell_notice_text), interface_texts_json = VALUES(interface_texts_json), footer_json = VALUES(footer_json),
         page_feedback_json = VALUES(page_feedback_json), notification_settings_json = VALUES(notification_settings_json)'
    );
    $stmt->execute([
        'site_name' => $data['settings']['siteName'],
        'brand_name' => $data['settings']['brandName'],
        'brand_slogan' => $data['settings']['brandSlogan'],
        'brand_logo' => $data['settings']['brandLogo'],
        'site_icon' => $data['settings']['siteIcon'],
        'language' => $data['settings']['language'],
        'direction' => $data['settings']['direction'],
        'theme' => $data['settings']['theme'],
        'phone_number' => $data['settings']['phoneNumber'],
        'email' => $data['settings']['email'],
        'shell_topbar_text' => $data['settings']['shellTopbarText'],
        'shell_topbar_short_text' => $data['settings']['shellTopbarShortText'],
        'shell_verify_label' => $data['settings']['shellVerifyLabel'],
        'shell_verify_title' => $data['settings']['shellVerifyTitle'],
        'shell_verify_description' => $data['settings']['shellVerifyDescription'],
        'shell_security_title' => $data['settings']['shellSecurityTitle'],
        'shell_security_description' => $data['settings']['shellSecurityDescription'],
        'shell_notice_text' => $data['settings']['shellNoticeText'],
        'interface_texts_json' => $interfaceTextsJson === false ? '{}' : $interfaceTextsJson,
        'footer_json' => $footerJson === false ? '{}' : $footerJson,
        'page_feedback_json' => $pageFeedbackJson === false ? '{}' : $pageFeedbackJson,
        'notification_settings_json' => $notificationSettingsJson === false ? '{}' : $notificationSettingsJson,
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
        'INSERT INTO main_page (id, owner_name, professional_title, intro, avatar_path, biography, hero_title, hero_subtitle, hero_intro, hero_image, hero_video, numbers_title, numbers_subtitle)
         VALUES (1, :owner_name, :professional_title, :intro, :avatar_path, :biography, :hero_title, :hero_subtitle, :hero_intro, :hero_image, :hero_video, :numbers_title, :numbers_subtitle)
         ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name), professional_title = VALUES(professional_title), intro = VALUES(intro),
         avatar_path = VALUES(avatar_path), biography = VALUES(biography), hero_title = VALUES(hero_title), hero_subtitle = VALUES(hero_subtitle),
         hero_intro = VALUES(hero_intro), hero_image = VALUES(hero_image), hero_video = VALUES(hero_video),
         numbers_title = VALUES(numbers_title), numbers_subtitle = VALUES(numbers_subtitle)'
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
        'numbers_title' => $data['home']['numbers']['title'],
        'numbers_subtitle' => $data['home']['numbers']['subtitle'],
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

function cms_replace_home_numbers(PDO $pdo, array $cards): void
{
    $pdo->exec('DELETE FROM home_numbers');
    $stmt = $pdo->prepare('INSERT INTO home_numbers (title, number_value, icon_class, sort_order, visible) VALUES (:title, :number_value, :icon_class, :sort_order, :visible)');
    foreach ($cards as $index => $card) {
        $stmt->execute([
            'title' => $card['title'],
            'number_value' => $card['number'],
            'icon_class' => $card['icon'],
            'sort_order' => $index,
            'visible' => cms_bool_int($card['visible']),
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

function cms_replace_card_collections(PDO $pdo, array $collections): void
{
    $pdo->exec('DELETE FROM card_items');
    $pdo->exec('DELETE FROM card_collections');
    $collectionStmt = $pdo->prepare(
        'INSERT INTO card_collections (collection_uid, title, slug, description, sort_order, visible, show_in_navigation, show_in_footer, created_at, updated_at)
         VALUES (:collection_uid, :title, :slug, :description, :sort_order, :visible, :show_in_navigation, :show_in_footer, :created_at, :updated_at)'
    );
    $cardStmt = $pdo->prepare(
        'INSERT INTO card_items (collection_uid, card_uid, title, subtitle, link_type, link_value, link_label, sort_order, visible)
         VALUES (:collection_uid, :card_uid, :title, :subtitle, :link_type, :link_value, :link_label, :sort_order, :visible)'
    );
    foreach ($collections as $collectionIndex => $collection) {
        $collectionStmt->execute([
            'collection_uid' => $collection['id'],
            'title' => $collection['title'],
            'slug' => $collection['slug'],
            'description' => $collection['description'],
            'sort_order' => $collectionIndex,
            'visible' => cms_bool_int($collection['visible']),
            'show_in_navigation' => cms_bool_int($collection['showInNavigation'] ?? true),
            'show_in_footer' => cms_bool_int($collection['showInFooter'] ?? false),
            'created_at' => $collection['createdAt'] ?? gmdate('Y-m-d H:i:s'),
            'updated_at' => $collection['updatedAt'] ?? ($collection['createdAt'] ?? gmdate('Y-m-d H:i:s')),
        ]);
        foreach (($collection['cards'] ?? []) as $cardIndex => $card) {
            $cardStmt->execute([
                'collection_uid' => $collection['id'],
                'card_uid' => $card['id'],
                'title' => $card['title'],
                'subtitle' => $card['subtitle'],
                'link_type' => $card['linkType'],
                'link_value' => $card['linkValue'],
                'link_label' => $card['linkLabel'],
                'sort_order' => $cardIndex,
                'visible' => cms_bool_int($card['visible']),
            ]);
        }
    }
}

function cms_replace_pages(PDO $pdo, array $pages): void
{
    $pdo->exec('DELETE FROM pages');
    $stmt = $pdo->prepare(
        'INSERT INTO pages (title, slug, parent_slug, content_mode, content, image_path, video_path, sort_order, visible, show_in_navigation, show_in_footer, created_at, updated_at)
         VALUES (:title, :slug, :parent_slug, :content_mode, :content, :image_path, :video_path, :sort_order, :visible, :show_in_navigation, :show_in_footer, :created_at, :updated_at)'
    );
    foreach ($pages as $index => $page) {
        $stmt->execute([
            'title' => $page['title'],
            'slug' => $page['slug'],
            'parent_slug' => $page['parentSlug'] ?? '',
            'content_mode' => $page['contentMode'],
            'content' => $page['content'],
            'image_path' => $page['image'] ?? '',
            'video_path' => $page['video'] ?? '',
            'sort_order' => $index,
            'visible' => cms_bool_int($page['visible']),
            'show_in_navigation' => cms_bool_int($page['showInNavigation'] ?? true),
            'show_in_footer' => cms_bool_int($page['showInFooter']),
            'created_at' => $page['createdAt'] ?? gmdate('Y-m-d H:i:s'),
            'updated_at' => $page['updatedAt'] ?? ($page['createdAt'] ?? gmdate('Y-m-d H:i:s')),
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

function cms_replace_footer_links(PDO $pdo, array $links): void
{
    $pdo->exec('DELETE FROM footer_links');
    $stmt = $pdo->prepare(
        'INSERT INTO footer_links (label, url, sort_order, visible)
         VALUES (:label, :url, :sort_order, :visible)'
    );
    foreach ($links as $index => $link) {
        $stmt->execute([
            'label' => $link['label'],
            'url' => $link['url'],
            'sort_order' => $index,
            'visible' => cms_bool_int($link['visible']),
        ]);
    }
}

function cms_replace_integrations(PDO $pdo, array $integrations): void
{
    $pdo->exec('DELETE FROM integrations');
    $stmt = $pdo->prepare(
        'INSERT INTO integrations (integration_type, name, provider, environment, endpoint_url, webhook_url, public_key, secret_env_key, config_json, sort_order, enabled)
         VALUES (:integration_type, :name, :provider, :environment, :endpoint_url, :webhook_url, :public_key, :secret_env_key, :config_json, :sort_order, :enabled)'
    );
    foreach ($integrations as $index => $integration) {
        $stmt->execute([
            'integration_type' => $integration['type'],
            'name' => $integration['name'],
            'provider' => $integration['provider'],
            'environment' => $integration['environment'],
            'endpoint_url' => $integration['endpointUrl'],
            'webhook_url' => $integration['webhookUrl'],
            'public_key' => $integration['publicKey'],
            'secret_env_key' => $integration['secretEnvKey'],
            'config_json' => $integration['configJson'],
            'sort_order' => $index,
            'enabled' => cms_bool_int($integration['enabled']),
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
