<?php
declare(strict_types=1);

function cms_ensure_page_feedback_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS page_feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page_key VARCHAR(255) NOT NULL,
            page_title VARCHAR(255),
            page_type VARCHAR(80),
            answer VARCHAR(10) NOT NULL,
            reasons_json LONGTEXT,
            comment TEXT,
            path VARCHAR(500),
            user_agent VARCHAR(255),
            ip_hash CHAR(64),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_page_feedback_page_key (page_key),
            INDEX idx_page_feedback_answer (answer),
            INDEX idx_page_feedback_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function cms_feedback_client_ip_hash(): string
{
    $config = cms_config();
    $salt = (string) ($config['app']['session_name'] ?? 'biography_cms_session');
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return hash('sha256', $salt . '|' . $ip);
}

function cms_normalize_feedback_reasons(mixed $reasons): array
{
    if (!is_array($reasons)) {
        return [];
    }

    $output = [];
    foreach (array_values($reasons) as $reason) {
        $value = cms_string($reason, 255);
        if ($value !== '' && !in_array($value, $output, true)) {
            $output[] = $value;
        }
        if (count($output) >= 8) {
            break;
        }
    }
    return $output;
}

function cms_normalize_feedback_payload(array $payload): array
{
    $answer = strtolower(cms_string($payload['answer'] ?? '', 10));
    if (!in_array($answer, ['yes', 'no'], true)) {
        cms_json_response(['success' => false, 'message' => 'Feedback answer is required.'], 422);
    }

    $pageType = cms_string($payload['pageType'] ?? $payload['page_type'] ?? '', 80);
    $pageKey = cms_string($payload['pageKey'] ?? $payload['page_key'] ?? '', 255);
    if ($pageKey === '' || $pageKey === 'home' || $pageType === 'home') {
        cms_json_response(['success' => false, 'message' => 'Feedback is not available for this page.'], 422);
    }

    return [
        'page_key' => $pageKey,
        'page_title' => cms_string($payload['pageTitle'] ?? $payload['page_title'] ?? '', 255),
        'page_type' => $pageType,
        'answer' => $answer,
        'reasons' => cms_normalize_feedback_reasons($payload['reasons'] ?? []),
        'comment' => cms_string($payload['comment'] ?? '', 2000),
        'path' => cms_string($payload['path'] ?? '', 500),
    ];
}

function cms_save_page_feedback(PDO $pdo, array $payload): array
{
    cms_ensure_page_feedback_table($pdo);
    $feedback = cms_normalize_feedback_payload($payload);
    $reasonsJson = json_encode($feedback['reasons'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare(
        'INSERT INTO page_feedback (page_key, page_title, page_type, answer, reasons_json, comment, path, user_agent, ip_hash)
         VALUES (:page_key, :page_title, :page_type, :answer, :reasons_json, :comment, :path, :user_agent, :ip_hash)'
    );
    $stmt->execute([
        'page_key' => $feedback['page_key'],
        'page_title' => $feedback['page_title'],
        'page_type' => $feedback['page_type'],
        'answer' => $feedback['answer'],
        'reasons_json' => $reasonsJson === false ? '[]' : $reasonsJson,
        'comment' => $feedback['comment'],
        'path' => $feedback['path'],
        'user_agent' => cms_string($_SERVER['HTTP_USER_AGENT'] ?? '', 255),
        'ip_hash' => cms_feedback_client_ip_hash(),
    ]);

    return [
        'id' => (int) $pdo->lastInsertId(),
        'pageKey' => $feedback['page_key'],
        'answer' => $feedback['answer'],
    ];
}

function cms_decode_feedback_reasons(mixed $value): array
{
    $decoded = json_decode((string) ($value ?? ''), true);
    return is_array($decoded) ? array_values(array_filter($decoded, static fn($item): bool => trim((string) $item) !== '')) : [];
}

function cms_feedback_record_from_row(array $row): array
{
    return [
        'id' => (int) ($row['id'] ?? 0),
        'pageKey' => (string) ($row['page_key'] ?? ''),
        'pageTitle' => (string) ($row['page_title'] ?? ''),
        'pageType' => (string) ($row['page_type'] ?? ''),
        'answer' => (string) ($row['answer'] ?? ''),
        'reasons' => cms_decode_feedback_reasons($row['reasons_json'] ?? ''),
        'comment' => (string) ($row['comment'] ?? ''),
        'path' => (string) ($row['path'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
    ];
}

function cms_fetch_page_feedback_stats(PDO $pdo, int $limit = 40, int $recordsPerPage = 4): array
{
    cms_ensure_page_feedback_table($pdo);
    $limit = max(1, min(100, $limit));
    $recordsPerPage = max(1, min(10, $recordsPerPage));
    $summary = $pdo->query(
        "SELECT COUNT(*) AS total,
                COALESCE(SUM(answer = 'yes'), 0) AS yes_count,
                COALESCE(SUM(answer = 'no'), 0) AS no_count,
                COUNT(DISTINCT page_key) AS page_count
         FROM page_feedback"
    )->fetch() ?: [];

    $pageStmt = $pdo->prepare(
        "SELECT page_key,
                MAX(page_title) AS page_title,
                MAX(page_type) AS page_type,
                COUNT(*) AS total,
                COALESCE(SUM(answer = 'yes'), 0) AS yes_count,
                COALESCE(SUM(answer = 'no'), 0) AS no_count,
                MAX(created_at) AS last_feedback_at
         FROM page_feedback
         GROUP BY page_key
         ORDER BY last_feedback_at DESC
         LIMIT :limit_value"
    );
    $pageStmt->bindValue(':limit_value', $limit, PDO::PARAM_INT);
    $pageStmt->execute();
    $pages = $pageStmt->fetchAll() ?: [];

    $recentStmt = $pdo->prepare(
        "SELECT id, page_key, page_title, page_type, answer, reasons_json, comment, path, created_at
         FROM page_feedback
         WHERE page_key = :page_key
         ORDER BY created_at DESC, id DESC
         LIMIT :limit_value"
    );
    $groupedPages = [];
    $recent = [];
    foreach ($pages as $row) {
        $recentStmt->bindValue(':page_key', (string) ($row['page_key'] ?? ''), PDO::PARAM_STR);
        $recentStmt->bindValue(':limit_value', $recordsPerPage, PDO::PARAM_INT);
        $recentStmt->execute();
        $records = array_map('cms_feedback_record_from_row', $recentStmt->fetchAll() ?: []);
        $recent = array_merge($recent, $records);
        $groupedPages[] = [
            'pageKey' => (string) ($row['page_key'] ?? ''),
            'pageTitle' => (string) ($row['page_title'] ?? ''),
            'pageType' => (string) ($row['page_type'] ?? ''),
            'path' => (string) ($records[0]['path'] ?? ''),
            'total' => (int) ($row['total'] ?? 0),
            'yes' => (int) ($row['yes_count'] ?? 0),
            'no' => (int) ($row['no_count'] ?? 0),
            'lastFeedbackAt' => (string) ($row['last_feedback_at'] ?? ''),
            'recent' => $records,
        ];
    }

    return [
        'summary' => [
            'total' => (int) ($summary['total'] ?? 0),
            'yes' => (int) ($summary['yes_count'] ?? 0),
            'no' => (int) ($summary['no_count'] ?? 0),
            'pages' => (int) ($summary['page_count'] ?? 0),
        ],
        'pages' => $groupedPages,
        'recent' => $recent,
    ];
}

function cms_fetch_page_feedback_export(PDO $pdo, int $limit = 10000): array
{
    cms_ensure_page_feedback_table($pdo);
    $limit = max(1, min(50000, $limit));
    $stmt = $pdo->prepare(
        "SELECT page_key, page_title, page_type, answer, reasons_json, comment, path, created_at
         FROM page_feedback
         ORDER BY created_at ASC, id ASC
         LIMIT :limit_value"
    );
    $stmt->bindValue(':limit_value', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $records = [];
    foreach ($stmt->fetchAll() ?: [] as $row) {
        $records[] = [
            'pageKey' => (string) ($row['page_key'] ?? ''),
            'pageTitle' => (string) ($row['page_title'] ?? ''),
            'pageType' => (string) ($row['page_type'] ?? ''),
            'answer' => (string) ($row['answer'] ?? ''),
            'reasons' => cms_decode_feedback_reasons($row['reasons_json'] ?? ''),
            'comment' => (string) ($row['comment'] ?? ''),
            'path' => (string) ($row['path'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }

    return [
        'exportedAt' => gmdate('c'),
        'records' => $records,
    ];
}

function cms_normalize_page_feedback_export_records(mixed $records): array
{
    if (!is_array($records)) {
        return [];
    }

    $output = [];
    foreach (array_values($records) as $record) {
        if (!is_array($record)) {
            continue;
        }
        $answer = strtolower(cms_string($record['answer'] ?? '', 10));
        $pageKey = cms_string($record['pageKey'] ?? $record['page_key'] ?? '', 255);
        if ($pageKey === '' || !in_array($answer, ['yes', 'no'], true)) {
            continue;
        }
        $createdAt = cms_string($record['createdAt'] ?? $record['created_at'] ?? '', 40);
        $createdAtTime = $createdAt !== '' ? strtotime($createdAt) : false;
        $output[] = [
            'page_key' => $pageKey,
            'page_title' => cms_string($record['pageTitle'] ?? $record['page_title'] ?? '', 255),
            'page_type' => cms_string($record['pageType'] ?? $record['page_type'] ?? '', 80),
            'answer' => $answer,
            'reasons' => cms_normalize_feedback_reasons($record['reasons'] ?? []),
            'comment' => cms_string($record['comment'] ?? '', 2000),
            'path' => cms_string($record['path'] ?? '', 500),
            'created_at' => $createdAtTime !== false ? gmdate('Y-m-d H:i:s', $createdAtTime) : gmdate('Y-m-d H:i:s'),
        ];
    }
    return $output;
}

function cms_replace_page_feedback_export(PDO $pdo, mixed $records): void
{
    cms_ensure_page_feedback_table($pdo);
    $items = cms_normalize_page_feedback_export_records($records);
    $pdo->exec('DELETE FROM page_feedback');
    if ($items === []) {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO page_feedback (page_key, page_title, page_type, answer, reasons_json, comment, path, user_agent, ip_hash, created_at)
         VALUES (:page_key, :page_title, :page_type, :answer, :reasons_json, :comment, :path, :user_agent, :ip_hash, :created_at)'
    );
    foreach ($items as $item) {
        $reasonsJson = json_encode($item['reasons'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt->execute([
            'page_key' => $item['page_key'],
            'page_title' => $item['page_title'],
            'page_type' => $item['page_type'],
            'answer' => $item['answer'],
            'reasons_json' => $reasonsJson === false ? '[]' : $reasonsJson,
            'comment' => $item['comment'],
            'path' => $item['path'],
            'user_agent' => '',
            'ip_hash' => null,
            'created_at' => $item['created_at'],
        ]);
    }
}
