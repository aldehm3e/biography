<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'biography_cms',
        'user' => 'database_user',
        'pass' => 'database_password',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'debug' => false,
        'session_name' => 'biography_cms_session',
        'max_upload_bytes' => 52428800,
    ],
];
