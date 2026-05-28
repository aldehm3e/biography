<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

function cms_upload_error_message(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Uploaded file is too large.',
        UPLOAD_ERR_PARTIAL => 'Uploaded file was only partially received.',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
        default => 'Unable to upload file.',
    };
}

function cms_upload_folder(string $type, string $extension): string
{
    $type = strtolower($type);
    if (str_contains($type, 'logo')) {
        return 'uploads/logos';
    }
    if (str_contains($type, 'icon')) {
        return 'uploads/icons';
    }
    if (in_array($extension, ['mp4', 'webm'], true) || str_contains($type, 'video')) {
        return 'uploads/video';
    }
    return 'uploads/images';
}

function cms_detect_mime(string $tmpName): string
{
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmpName);
    return is_string($mime) ? $mime : '';
}

function cms_svg_is_safe(string $tmpName): bool
{
    $content = file_get_contents($tmpName);
    if ($content === false) {
        return false;
    }

    $lower = strtolower($content);
    foreach ([
        '<script',
        '<foreignobject',
        '<iframe',
        '<object',
        '<embed',
        'javascript:',
        'data:text/html',
        'onload=',
        'onerror=',
        'onclick=',
        'onmouseover=',
        'onfocus=',
    ] as $needle) {
        if (str_contains($lower, $needle)) {
            return false;
        }
    }

    return true;
}

try {
    $pdo = cms_pdo();
    $user = cms_require_admin($pdo);
    if (!cms_admin_has_permission($user, 'uploads') && !cms_admin_has_any_permission($user, cms_content_permission_keys())) {
        cms_json_response(['success' => false, 'message' => 'Permission denied.'], 403);
    }
    $config = cms_config();
    $maxBytes = (int) ($config['app']['max_upload_bytes'] ?? 52428800);

    if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
        cms_json_response(['success' => false, 'message' => 'No upload file was sent.'], 400);
    }

    $file = $_FILES['file'];
    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        cms_json_response(['success' => false, 'message' => cms_upload_error_message($error)], 400);
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > $maxBytes) {
        cms_json_response(['success' => false, 'message' => 'Uploaded file size is not allowed.'], 422);
    }

    $original = basename((string) ($file['name'] ?? 'upload'));
    $extension = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    $imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'ico'];
    $videoExtensions = ['mp4', 'webm'];
    if (!in_array($extension, array_merge($imageExtensions, $videoExtensions), true)) {
        cms_json_response(['success' => false, 'message' => 'File extension is not allowed.'], 422);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        cms_json_response(['success' => false, 'message' => 'Invalid uploaded file.'], 422);
    }

    $mime = cms_detect_mime($tmpName);
    $imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    $videoMimes = ['video/mp4', 'video/webm'];
    $isImage = in_array($extension, $imageExtensions, true);
    $isVideo = in_array($extension, $videoExtensions, true);
    $validMime = $isImage ? in_array($mime, $imageMimes, true) : in_array($mime, $videoMimes, true);
    if ($extension === 'svg' && !$validMime) {
        $svgHead = strtolower(file_get_contents($tmpName, false, null, 0, 512) ?: '');
        $validMime = str_contains($svgHead, '<svg');
        if ($validMime) {
            $mime = 'image/svg+xml';
        }
    }
    if ($extension === 'svg' && $validMime && !cms_svg_is_safe($tmpName)) {
        cms_json_response(['success' => false, 'message' => 'SVG file contains unsafe content.'], 422);
    }
    if ($extension === 'ico' && !$validMime && $mime === 'application/octet-stream') {
        $validMime = true;
        $mime = 'image/x-icon';
    }
    if (!$validMime || (!$isImage && !$isVideo)) {
        cms_json_response(['success' => false, 'message' => 'File MIME type is not allowed.'], 422);
    }

    $type = cms_string($_POST['type'] ?? 'image', 50);
    $folder = cms_upload_folder($type, $extension);
    $absoluteFolder = cms_public_path($folder);
    if (!is_dir($absoluteFolder) && !mkdir($absoluteFolder, 0755, true)) {
        cms_json_response(['success' => false, 'message' => 'Upload folder is not writable.'], 500);
    }
    if (!is_writable($absoluteFolder)) {
        cms_json_response(['success' => false, 'message' => 'Upload folder is not writable.'], 500);
    }

    $safeBase = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($original, PATHINFO_FILENAME)) ?: 'media';
    $storedName = strtolower(trim($safeBase, '-')) . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
    $storedPath = $folder . '/' . $storedName;
    $absolutePath = $absoluteFolder . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($tmpName, $absolutePath)) {
        cms_json_response(['success' => false, 'message' => 'Unable to store uploaded file.'], 500);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO media_uploads (original_name, stored_name, path, mime_type, file_size, media_type)
         VALUES (:original_name, :stored_name, :path, :mime_type, :file_size, :media_type)'
    );
    $stmt->execute([
        'original_name' => $original,
        'stored_name' => $storedName,
        'path' => $storedPath,
        'mime_type' => $mime,
        'file_size' => $size,
        'media_type' => $isVideo ? 'video' : 'image',
    ]);

    cms_json_response([
        'success' => true,
        'path' => $storedPath,
    ]);
} catch (Throwable $error) {
    cms_json_response(['success' => false, 'message' => 'Unable to upload media.'], 500);
}
