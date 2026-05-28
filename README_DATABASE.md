# Database CMS Setup

This site is now backed by PHP 8+ and MySQL/MariaDB. The frontend stays vanilla HTML/CSS/JS and keeps the current NDS design, while the database is the main source of truth for editable content.

For a simpler customer-facing walkthrough, read `README_INSTALL_BEGINNER.md`.

## What Changed

- Public pages load content from `api/content/get-site.php`.
- Admin saves content through `api/content/save-site.php`.
- Admin login uses PHP sessions and hashed passwords.
- Admin login also requires a server-generated math CAPTCHA tied to the PHP session.
- Brand settings, home content, hero slides, projects, pages, experience, achievements, skills, contacts, notifications, navigation labels, and media paths are stored in normalized database tables.
- Footer columns, footer icon groups, bottom links, footer logos, interface text overrides, and the footer legal/copyright text are stored in `site_settings.footer_json` and `site_settings.interface_texts_json`.
- Footer icon groups are independent. The admin UI allows up to two groups, and each group can contain many icon links; icon-only links are valid and are not dropped just because their label or URL is blank.
- Media uploads go through `api/upload/upload-media.php`.
- Admin user management uses the `api/auth/list-users.php`, `api/auth/save-user.php`, and `api/auth/delete-user.php` endpoints.
- Old `localStorage` content can be imported from the admin tools panel, but it is no longer primary storage.
- `api/config.php`, `install/install.lock`, and runtime upload files are ignored by Git.

## Laragon Setup

1. Place the project at:

```text
C:\laragon\www\Biography
```

2. Open Laragon and click `Start All`.
3. Create a database named `biography_cms`.

Using Laragon Terminal:

```powershell
mysql -u root -e "CREATE DATABASE biography_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Or use HeidiSQL/phpMyAdmin and create the database with `utf8mb4_unicode_ci`.

4. Open the installer:

```text
http://localhost/Biography/install/
```

5. Use these database values for a normal Laragon install:

```text
DB host: localhost
DB name: biography_cms
DB user: root
DB password: leave empty unless you set one
```

6. Create the first admin account in the installer.
7. After success, open:

```text
http://localhost/Biography/admin.html
```

8. Log in with the admin email/password you created.
9. Save a small setting, refresh the page, and confirm it remains.

If Laragon virtual hosts are enabled, the site may also be available as:

```text
http://biography.test
```

## XAMPP Setup

1. Place the project at:

```text
C:\xampp\htdocs\Biography
```

2. Start Apache and MySQL from XAMPP.
3. Create an empty MySQL database in phpMyAdmin.
4. Open:

```text
http://localhost/Biography/install/
```

5. Complete the database and first-admin form.

## Installer Flow

The installer checks:

- PHP version is at least 8.0.
- PDO is enabled.
- PDO MySQL is enabled.
- PHP sessions are available.
- Upload folders are writable.

Then it creates:

- all CMS tables from `install/schema.sql`
- the first admin user
- initial blank/default site data
- `api/config.php`
- `install/install.lock`

The installer is blocked while `install/install.lock` exists. For an intentional reinstall, remove `install/install.lock` and `api/config.php`, then run the installer again.

## Manual Schema Import

The installer normally imports `install/schema.sql` for you. If you import manually, create the database first and run the SQL file against that database.

After a manual import, still open `install/` once so the app can create `api/config.php`, the first admin account, and `install/install.lock`.

## Hostinger / cPanel Deployment

1. Upload the project contents to `public_html` or to the target subfolder.
2. Create a MySQL database and database user in Hostinger/cPanel.
3. Grant the database user full permissions on that database.
4. Visit:

```text
https://your-domain.com/install/
```

5. Enter the production DB host, DB name, DB user, and DB password from Hostinger/cPanel.
6. Create the first admin account.
7. Confirm these folders are writable:

```text
uploads/images/
uploads/video/
uploads/logos/
uploads/icons/
```

8. Keep `install/install.lock` in place after installation.

## Files To Protect

Do not overwrite these on production during future uploads unless you intentionally want to reset production configuration or media:

- `api/config.php`
- `install/install.lock`
- `uploads/`

Commit this file:

- `api/config.example.php`

Do not commit this file:

- `api/config.php`

## Backup And Restore

Back up both:

- the MySQL database
- the `uploads/` folder

The database stores media paths. The real uploaded files live on disk.

To restore, import the SQL backup into the database, restore the matching `uploads/` folder, and keep a correct `api/config.php`.

## Admin Usage

Open `admin.html`, log in, then use the admin panels:

- Settings: site name, brand name, slogan, logo, phone, email, language, direction, theme
- Home: owner name, title, intro, avatar, biography, hero title, hero subtitle, hero intro, hero image, hero video
- Hero slides: add, edit, upload image/video, reorder, hide/show, delete
- Projects: add, edit, upload image, set slug/status/date/category/URL, reorder, hide/show, delete
- Pages: add text or HTML pages, set slug, reorder, hide/show, delete
- Experience, achievements, skills: add, edit, reorder, hide/show, delete
- Contacts: label, value, URL, icon type, custom icon upload, reorder, hide/show, delete
- Footer: quick links, up to three footer columns, up to two footer icon groups, footer bottom links beside the copyright text, and footer logos
- Integrations: payment, messaging, analytics, automation, custom endpoints, and related configuration
- Users: owner/admin/employee accounts and section permissions
- Tools: export JSON, import JSON, migrate old localStorage data, reset database content
- Account: change password, email, phone, logout

## Local Smoke Test

After installation, test:

1. Log in to `admin.html`.
2. Change brand name and brand slogan.
3. Upload a brand logo.
4. Add a hero slide with an image.
5. Add a hero slide with a video.
6. Add, edit, and delete a project.
7. Add a text page.
8. Add an HTML page.
9. Add a contact.
10. Change phone number.
11. Change password.
12. Change email.
13. Log out.
14. Refresh and confirm data remains.
15. Open the site in another browser and confirm it loads from the database.

## Syntax Checks

JavaScript:

```powershell
node --check js/default-data.js
node --check js/store.js
node --check js/app.js
node --check js/admin.js
node --check js/nds-local-components.js
```

PHP with Laragon PHP:

```powershell
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/config.example.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/db.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/captcha.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/login.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/logout.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/me.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/change-password.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/change-email.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/change-phone.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/list-users.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/save-user.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/auth/delete-user.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/content/get-site.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/content/save-site.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/content/site-repository.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/upload/upload-media.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l api/install/seed.php
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -l install/index.php
```

Adjust the PHP path if your Laragon PHP version folder is different.

## Repository Sanity QA

Before handing off a build, run the syntax checks above and import both schema files into a temporary database:

```powershell
mysql -u root -e "CREATE DATABASE biography_qa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root biography_qa < install/schema.sql
mysql -u root -e "DROP DATABASE biography_qa;"
```

Repeat with `api/install/schema.sql` if that copy changed. For footer changes, also run a small repository-level save/fetch smoke test against a temporary database and confirm two icon groups can each save at least eight icon-only links.
