# Biography CMS

Author: Eng. Abdulrahman alsaedi

Biography CMS is an Arabic-first personal website and lightweight content management system. It follows the local NDS vanilla design references and uses HTML, CSS, and JavaScript for the public interface, with PHP 8+ and MySQL/MariaDB for saved content, login, uploads, and installation.

This file is the main project handoff. Read it before changing code.

## Current Shape

- Public website entry: `index.html`
- Admin panel: `admin.html`
- Installer: `install/`
- Backend API: `api/`
- Runtime uploads: `uploads/`
- Main styling: `css/custom.css`
- Public behavior: `js/app.js`
- Admin behavior: `js/admin.js`
- Default empty data: `js/default-data.js`
- Database repository: `api/content/site-repository.php`

The database is the source of truth after installation. `localStorage` is only a fallback/cache and migration helper.

## Local URLs

With Laragon and the project copied to `C:\laragon\www\Biography`:

```text
http://localhost/Biography/index.html
http://localhost/Biography/admin.html
http://localhost/Biography/install/
```

## Main Features

- Arabic RTL interface.
- Database-backed settings, home content, projects, pages, footer, notifications, integrations, and users.
- Admin login with PHP sessions, hashed passwords, and CAPTCHA.
- User permissions for admin sections.
- Page and subpage management from `الصفحات`.
- Card collection pages from `البطاقات`, with optional detail/external links and header visibility.
- Public page feedback management from `إدارة تقييم الصفحات`; the widget stays hidden on the home page, admin dashboards show yes/no totals and page rankings, and full records export as JSON.
- One safe subpage level only.
- Pages can use plain text or trusted admin HTML.
- Pages and projects can have image/video media.
- Hero slides support desktop and mobile media.
- Home number/statistic cards support editable titles, values, icons, visibility, and slider display.
- NDS-inspired header, menus, modals, buttons, cards, breadcrumbs, and share controls.
- Uploads for images, video, logos, and icons.

## Important Rules

- Do not hard-code the owner name or personal content in public HTML.
- Do not add fake biography, fake projects, fake achievements, fake experience, or fake contact accounts.
- Keep public pages clean until content is saved from the admin panel.
- Do not edit `api/config.php` into Git. It contains real database credentials.
- Do not overwrite production `api/config.php`, `install/install.lock`, or `uploads/` during updates.
- Do not modify the original NDS reference repo/folder. Use the local vendor copy only when needed.
- Keep page/subpage management inside `الصفحات`; do not bring back a separate site-structure admin section.
- Keep subpages out of the main header as independent items. They belong under their parent page menu.
- Test desktop and mobile after header, dropdown, page, upload, or admin editor changes.

## Documentation Files

- `README.md`: project overview and future handoff rules.
- `README_INSTALL_BEGINNER.md`: simple installation guide for beginners.
- `README_DATABASE.md`: database, schema, deployment, backup, restore, and QA details.

## Developer Workflow

1. Read the README files first.
2. Check the current dirty worktree before editing:

```powershell
git status --short
```

3. Make focused changes only.
4. For code edits, keep existing vanilla PHP/JS/CSS patterns.
5. Run syntax checks before handoff.
6. If testing against Laragon, sync tested files to:

```text
C:\laragon\www\Biography
```

## QA Checklist

Run these before handing off a meaningful change.

JavaScript syntax:

```powershell
Get-ChildItem -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\(vendor|node_modules|backup|backups)\\' } |
  ForEach-Object { node --check $_.FullName }
```

PHP syntax with Laragon PHP:

```powershell
$php = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"
Get-ChildItem -Recurse -Filter *.php |
  Where-Object { $_.FullName -notmatch '\\(vendor|node_modules|backup|backups)\\' } |
  ForEach-Object { & $php -l $_.FullName }
```

Database install smoke:

```powershell
mysql -u root -e "CREATE DATABASE biography_qa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root biography_qa < install/schema.sql
mysql -u root -e "DROP DATABASE biography_qa;"
```

Also test `api/install/schema.sql` if it changed.

Browser QA:

- `index.html` loads.
- `admin.html` loads.
- Login works.
- Saving settings persists after refresh.
- Adding/editing/deleting projects works.
- Adding/editing/deleting pages works.
- Page text/HTML mode works.
- Page image/video fields save and render.
- Subpage reorder does not make subpages appear as main header items.
- Header search, notifications, admin menu, subpage menus, and hamburger menus do not stay open together.
- Share menu opens on every click and does not auto-open on refresh.
- Mobile and desktop both remain usable.

## Content Editing Notes

Use the admin panel for normal content:

- `الإعدادات`: brand, logo, language, labels, verification text, interface text.
- `الرئيسية`: owner content, biography, hero slides, `في أرقام`, skills, experience, achievements.
- `المشاريع`: project cards and project media.
- `البطاقات`: card collection pages, card titles/subtitles, optional detail links, and header visibility.
- `الصفحات`: pages, subpages, text/HTML content, page media, header/footer visibility.
- `التذييل`: footer columns, icons, bottom links, logos, legal text.
- `إدارة تقييم الصفحات`: public feedback form settings, yes/no dashboards, page ranking summaries, and feedback JSON export.
- `النسخ الاحتياطي والاستعادة`: JSON export/import, localStorage migration, and reset.
- `الصلاحيات`: admin users and permissions.

HTML page content is trusted local-admin content. Do not treat it as public-user input without server-side sanitization.

Backup, restore, JSON import, localStorage migration, and reset are controlled by the `backup` permission. Grant it only to trusted admins because it can replace site content and page feedback records.

## Installation

Use the beginner guide for normal setup:

```text
README_INSTALL_BEGINNER.md
```

Use the database guide for schema, deployment, backup, restore, and troubleshooting:

```text
README_DATABASE.md
```
