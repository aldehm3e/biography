# App Structure

Author: Eng. Abdulrahman alsaedi  
Last QA pass: 2026-06-01

## Purpose

Biography CMS is an Arabic-first personal website with a lightweight PHP/MySQL content manager. The public website is static HTML enhanced by JavaScript. The saved content, users, uploads, pages, projects, footer, notifications, and integrations are persisted through PHP APIs and MySQL/MariaDB after installation.

There is no build step. A user should be able to upload/copy the repository to a PHP web root, run `install/`, and then manage content from `admin.html`.

## High-Level Runtime

```text
Browser
  |
  | loads HTML/CSS/JS
  v
Public pages and admin.html
  |
  | js/store.js fetches JSON
  v
api/content/get-site.php  ---->  api/content/site-repository.php  ---->  MySQL
api/content/save-site.php ---->  api/content/site-repository.php  ---->  MySQL
  ^
  |
Admin actions in js/admin.js
```

The database is the source of truth after install. Browser `localStorage` is only used for cached public data, preview data, old-data migration, notification read state, and local admin activity history.

## Main Entry Points

| File | Role |
| --- | --- |
| `index.html` | Public home page. |
| `projects.html` | Public project listing. |
| `project.html` | Public project detail page, resolved by query/hash identifier. |
| `pages.html` | Public page/subpage listing and page rendering. |
| `notifications.html` | Public notification archive. |
| `admin.html` | Admin CMS shell and editors. |
| `install/index.php` | Browser installer that writes `api/config.php` and `install/install.lock`. |

## Frontend Modules

| File | Responsibilities |
| --- | --- |
| `js/default-data.js` | Defines `window.DEFAULT_SITE_DATA`, contact icon options, page content modes, integration types, and admin auth defaults. |
| `js/store.js` | Data access layer. Normalizes data, loads/saves site JSON, manages auth calls, uploads, admin users, preview data, and local cache fallback. |
| `js/app.js` | Public shell rendering. Handles header, footer, pages, projects, project detail, search, login/account modals, notifications, cookie consent, Google Analytics, sharing, and NDS header/dropdown behavior. |
| `js/admin.js` | Admin panel. Handles permissions, editors, drag/reorder, uploads, preview, save flows, users, integrations, footer cookie links, system tools, and admin side menu. |
| `js/nds-local-components.js` | Local helpers that complement the NDS vendor components. |
| `css/custom.css` | Main app theme and layout layer on top of local NDS assets. |

## Backend API

| Endpoint | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `api/content/get-site.php` | GET | Public | Returns full normalized site data. |
| `api/content/save-site.php` | POST JSON | Admin | Saves site data. Empty or invalid payloads are rejected to prevent accidental resets. |
| `api/auth/captcha.php` | GET | Public | Creates a login math CAPTCHA stored in session. |
| `api/auth/login.php` | POST JSON | Public | Verifies CAPTCHA, email, password, active status, then starts the admin session. |
| `api/auth/logout.php` | POST | Admin session optional | Clears the PHP session. |
| `api/auth/me.php` | GET | Public | Returns current authenticated admin user or `authenticated: false`. |
| `api/auth/change-password.php` | POST JSON | Admin | Changes the current admin password after current-password verification. |
| `api/auth/change-email.php` | POST JSON | Admin | Changes the current admin email after password verification and syncs `site_settings.email`. |
| `api/auth/change-phone.php` | POST JSON | Admin | Changes the current admin phone after password verification and syncs `site_settings.phone_number`. |
| `api/auth/list-users.php` | GET | `users` permission | Lists admin users and available permission keys. |
| `api/auth/save-user.php` | POST JSON | `users` permission | Creates or updates admin users, roles, permissions, active state, and password. |
| `api/auth/delete-user.php` | POST JSON | `users` permission | Deletes non-owner admin users, never the current user. |
| `api/upload/upload-media.php` | POST multipart | Admin with upload/content permission | Uploads images, icons, logos, videos, PDFs, and documents to `uploads/`. |
| `api/upload/list-media.php` | GET | `uploads` permission | Lists uploaded file metadata and source paths for the admin media library. |
| `api/upload/delete-media.php` | POST JSON | `uploads` permission | Deletes an unused uploaded file and its `media_uploads` row after checking saved content references. |
| `api/install/seed.php` | POST/GET depending caller | `utilities` permission | Re-seeds default site data. |

## Important PHP Methods

### `api/db.php`

| Method | Purpose |
| --- | --- |
| `cms_is_installed()` | Checks for `api/config.php`. |
| `cms_config()` | Loads `api/config.php` after install, otherwise `api/config.example.php`. Also configures PHP error behavior. |
| `cms_start_session()` | Starts the CMS session with HttpOnly, SameSite=Lax cookies. |
| `cms_json_response()` | Sends JSON and exits. |
| `cms_read_json()` | Reads and validates JSON request bodies. Empty body returns an empty array. Mutation endpoints must validate that explicitly. |
| `cms_pdo()` | Creates the configured PDO connection. |
| `cms_admin_permission_keys()` | Lists all admin permission keys. |
| `cms_content_permission_keys()` | Lists content-save permissions. |
| `cms_normalize_admin_permissions()` | Filters permission arrays/strings to known keys. |
| `cms_current_admin()` | Reads the session user and returns normalized admin payload. |
| `cms_require_admin()` | Requires any authenticated admin. |
| `cms_require_permission()` | Requires one specific permission. |
| `cms_create_login_captcha()` / `cms_verify_login_captcha()` | Login security check. |
| `cms_public_path()` | Converts a public relative path to an absolute filesystem path. |
| `cms_string()` / `cms_bool()` / `cms_bool_int()` | Shared input normalization helpers. |

### `api/content/site-repository.php`

| Method | Purpose |
| --- | --- |
| `cms_default_interface_texts()` | Default UI text labels. |
| `cms_default_site_data()` | Full default site data model. |
| `cms_fetch_site_data()` | Reads all DB tables and returns the frontend JSON model. |
| `cms_ensure_content_schema()` | Adds compatible columns/tables for older installs, outside active transactions. |
| `cms_save_site_data()` | Normalizes and fully replaces content tables inside a transaction. |
| `cms_save_site_data_for_admin()` | Permission-aware save. Full save requires `utilities` or all content permissions; otherwise only permitted sections are merged into current data. |
| `cms_normalize_site_data()` | Normalizes the full incoming JSON model. |
| `cms_safe_path()` | Rejects empty paths and path traversal. |
| `cms_normalize_pages()` | Enforces unique slugs, one-level subpages, valid parent links, and root-only navigation visibility. |
| `cms_normalize_footer()` | Normalizes footer columns, icon groups, bottom links, logos, and cookie settings. |
| `cms_normalize_integrations()` | Normalizes analytics/payment/API/chat/email/custom integrations. |
| `cms_replace_*()` methods | Replace individual DB-backed collections during save. |

## Database Tables

Fresh install creates these tables in both `install/schema.sql` and `api/install/schema.sql`:

| Table | Purpose |
| --- | --- |
| `admin_users` | Admin accounts, password hashes, roles, permissions, active flag. |
| `site_settings` | Brand/settings/shell/interface/footer JSON. |
| `navigation_items` | Core navigation labels. |
| `hero_slides` | Home hero carousel media/content. |
| `main_page` | Main profile fields, intro, biography, avatar. |
| `home_numbers` | Home "في أرقام" statistic cards. |
| `experiences` | Home experience rows. |
| `achievements` | Home achievement rows. |
| `skills` | Home skills. |
| `projects` | Project cards/detail content. |
| `pages` | Pages and one-level subpages. |
| `contacts` | Footer/contact links. |
| `footer_links` | Legacy/simple footer links. |
| `integrations` | Google Analytics and other integration settings. |
| `site_notifications` | Admin-generated content notifications. |
| `media_uploads` | Uploaded media metadata. |
| `site_backups` | Reserved backup table. |

## Data Model Roots

The frontend expects this JSON shape:

```text
settings
navigation
texts
home
  heroSlides
  numbers
    cards
  experience
  achievements
  skills
  contacts
  footerLinks
footer
  columns
  iconGroups
  bottomLinks
  logos
  cookies
projects
pages
integrations
notifications
```

Keep new features inside one of these roots unless a schema/data-model change is truly needed.

## Admin Sections And Permissions

| Permission | Admin Area |
| --- | --- |
| `settings` | Brand, shell/topbar, interface text. |
| `home` | Profile, hero media, biography, numbers, skills, experience, achievements. |
| `footer` | Footer labels, links, social/app icon groups, cookie popup. |
| `projects` | Projects editor. |
| `pages` | Pages and subpages editor. |
| `navigation` | Core navigation labels. |
| `integrations` | Google Analytics and other integration settings. |
| `utilities` | Backup, JSON import/export, reset, migration, system tools. Treat as highly trusted. |
| `uploads` | Direct upload permission. Content permissions also allow uploads for editor workflows. |
| `users` | Admin user management. |

Owner role always receives `*`.

## Install Flow

1. User copies the project to a PHP web root.
2. User creates an empty MySQL/MariaDB database.
3. User opens `install/`.
4. Installer checks PHP, PDO, PDO MySQL, sessions, and writable upload folders.
5. Installer connects to DB and runs `install/schema.sql`.
6. Installer creates the first owner admin user.
7. Installer seeds default site data or optional JSON seed.
8. Installer writes `api/config.php`.
9. Installer writes `install/install.lock`.

Do not commit or overwrite:

```text
api/config.php
install/install.lock
uploads/
```

## Save/Fetch Lifecycle

Public render:

```text
HTML loads
  -> js/default-data.js defines fallback model
  -> js/store.js requests api/content/get-site.php
  -> js/app.js renders shared shell and current page
```

Admin save:

```text
admin.html editor state
  -> js/admin.js collects current section data
  -> js/store.js POSTs { data: ... } to api/content/save-site.php
  -> cms_save_site_data_for_admin() enforces permissions
  -> cms_save_site_data() normalizes and saves in DB transaction
  -> normalized data returns to browser
  -> public shell refresh event fires
```

## Upload Lifecycle

```text
Admin file input
  -> js/admin.js calls SiteStore.uploadMedia(file, type)
  -> api/upload/upload-media.php validates session/permission
  -> extension + MIME + SVG safety checks
  -> file stored in uploads/{images|video|logos|icons|documents}
  -> media_uploads row inserted
  -> relative path returned to editor
```

Allowed extensions:

```text
Images/icons: jpg, jpeg, png, webp, svg, ico
Video: mp4, webm
Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf
```

SVG upload blocks scripts, event handlers, foreignObject, iframe/object/embed, and unsafe URL patterns.

## Pages And Subpages

Pages support text and trusted-admin HTML. Subpages are controlled by `parentSlug`.

Rules enforced by JS and PHP:

- Slugs are unique.
- Only one subpage level is allowed.
- A subpage cannot be a parent.
- Subpages do not appear as independent main navigation items.
- Root pages can appear in header navigation.
- Footer cookie popup links can be selected from pages that have footer-link visibility enabled.

## Cookie Consent And Analytics

Footer cookie settings live at:

```text
footer.cookies
```

Google Analytics settings live in:

```text
integrations[]
```

For GA:

- `type` must be `analytics`.
- `publicKey` must be a valid `G-XXXXXXXXXX` measurement ID.
- `enabled` must not be false.
- Analytics loads only when cookie consent is accepted.
- Decline keeps analytics storage denied.

## Notifications

Notifications are saved in `site_notifications` and surfaced through header actions and `notifications.html`.

Admin saves can add notifications for:

- Home updates
- New/updated projects
- New/updated pages

Read/dismiss state is local browser state so public users do not mutate the database.

## NDS Integration Rules

- Keep NDS classes and component semantics where possible.
- Prefer local NDS vendor assets under `assets/vendor/nds/`.
- Use `css/custom.css` for application-specific composition and fixes.
- Do not edit an external upstream NDS repo.
- Header, drawer, side menu, form controls, cookies, dropmenus, buttons, and cards should follow NDS class naming and interaction expectations.

## Release QA Commands

JavaScript syntax:

```powershell
Get-ChildItem -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\(vendor|node_modules|backup|backups)\\' } |
  ForEach-Object { node --check $_.FullName }
```

PHP syntax:

```powershell
$php = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"
Get-ChildItem -Recurse -Filter *.php |
  Where-Object { $_.FullName -notmatch '\\(vendor|node_modules|backup|backups)\\' } |
  ForEach-Object { & $php -l $_.FullName }
```

Fresh schema import:

```powershell
$mysql = "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe"
& $mysql -u root -e "CREATE DATABASE biography_qa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content -Raw -Encoding UTF8 install\schema.sql | & $mysql -u root biography_qa
& $mysql -u root -e "DROP DATABASE biography_qa;"
```

Also repeat schema import for `api/install/schema.sql`.

Live smoke:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost/Biography/api/content/get-site.php
Invoke-WebRequest -UseBasicParsing http://localhost/Biography/api/auth/me.php
Invoke-WebRequest -UseBasicParsing http://localhost/Biography/install/
```

Browser smoke:

- `index.html` loads header/footer without console errors.
- `admin.html` loads and respects logged-out state.
- `projects.html`, `project.html`, `pages.html`, and `notifications.html` load.
- Admin login opens and validates CAPTCHA.
- Save settings, save pages, save projects, and refresh.
- Upload one image and verify it persists.
- Check desktop and mobile header/drawer/side menu behavior.

## Extension Guidelines

When adding a new content type:

1. Add default shape in `js/default-data.js` and `cms_default_site_data()`.
2. Add schema table or JSON storage.
3. Add repository fetch/normalize/save methods.
4. Add admin editor UI in `admin.html` and behavior in `js/admin.js`.
5. Add public render behavior in `js/app.js`.
6. Add permission key in `cms_admin_permission_keys()` if it needs separate access.
7. Update installer schemas in both `install/schema.sql` and `api/install/schema.sql`.
8. Add QA notes to this file and the README if installation changes.

When adding a new API endpoint:

1. Require `api/db.php`.
2. Use `cms_json_response()`.
3. Validate empty bodies explicitly for mutation endpoints.
4. Use `cms_require_admin()` or `cms_require_permission()` for private endpoints.
5. Use prepared statements for DB access.
6. Return generic production-safe errors, but keep enough client message clarity for admin UX.

## Current Release Notes From QA

- PHP syntax passed for all first-party PHP files.
- JavaScript syntax passed for all first-party JS files.
- `install/schema.sql` and `api/install/schema.sql` are identical and import successfully.
- Repository save/fetch smoke passed with default data, a root page, and a subpage.
- HTML and CSS local asset references were checked.
- Live `get-site.php`, `me.php`, and `install/` smoke checks passed on Laragon.
- Runtime script/cache keys were refreshed so installed users receive the current JS/CSS.
- `save-site.php` now rejects empty or invalid site-data payloads to prevent accidental content resets.
