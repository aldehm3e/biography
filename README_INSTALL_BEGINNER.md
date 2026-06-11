# Beginner Installation Guide

Author: Eng. Abdulrahman alsaedi

This guide is for installing Biography CMS without touching code.

## What This Website Needs

- PHP 8 or newer
- MySQL or MariaDB
- Apache or another PHP-capable web server
- A browser

For local testing on this machine, XAMPP is the active setup. Laragon also works if the project is copied to Laragon's web root.

## Important Idea

Do not edit `index.html` for normal website content.

After installation, open `admin.html` and manage content from the admin panel:

- brand name
- logo
- home page content
- hero slides
- home numbers/statistics
- Saudi region map
- biography
- projects
- card pages
- pages and subpages
- public page feedback
- page text or HTML
- images and videos
- footer
- notifications
- users and permissions

## Install Locally With Laragon

1. Copy the project folder to:

```text
C:\laragon\www\Biography
```

2. Open Laragon.
3. Click `Start All`.
4. Create a database named:

```text
biography_cms
```

Easy way from Laragon Terminal:

```powershell
mysql -u root -e "CREATE DATABASE biography_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

5. Open the installer:

```text
http://localhost/Biography/install/
```

6. Use these database values:

```text
DB host: localhost
DB name: biography_cms
DB user: root
DB password: leave empty unless you set a MySQL password
```

7. Create the first admin account.
8. Finish the installer.
9. Open the admin panel:

```text
http://localhost/Biography/admin.html
```

10. Log in with the email and password you created.

## Install Locally With XAMPP

1. Copy the project folder to:

```text
C:\xampp\htdocs\Biography
```

2. Start Apache and MySQL.
3. Open phpMyAdmin:

```text
http://localhost/phpmyadmin
```

4. Create a database named:

```text
biography_cms
```

5. Open:

```text
http://localhost/Biography/install/
```

6. Fill the database form.
7. Create the first admin account.
8. Open:

```text
http://localhost/Biography/admin.html
```

## Install On Hosting

1. Upload the project files to `public_html` or the target folder.
2. Create a MySQL database from the hosting control panel.
3. Create a MySQL user.
4. Give the user full permissions on the database.
5. Open:

```text
https://your-domain.com/install/
```

If the project is in a subfolder:

```text
https://your-domain.com/folder-name/install/
```

6. Fill the database form using the hosting database values.
7. Create the first admin account.
8. Open:

```text
https://your-domain.com/admin.html
```

## Files Created By The Installer

The installer creates:

```text
api/config.php
install/install.lock
```

`api/config.php` stores database connection details.

`install/install.lock` prevents accidental reinstall.

## Do Not Overwrite These On A Live Site

When uploading updates later, protect:

```text
api/config.php
install/install.lock
uploads/
```

The `uploads/` folder contains uploaded images, videos, logos, icons, and documents.

## First Test After Installation

1. Open `admin.html`.
2. Log in.
3. Change the brand name.
4. Save.
5. Refresh the page.
6. Open `index.html`.
7. Confirm the change stayed.

If the change stays after refresh, the database is working.

## Upload Test

1. Upload a logo or page image from the admin panel.
2. Save.
3. Refresh.
4. Confirm the media still appears.

If the media stays after refresh, uploads are working.

## Page HTML Test

1. Open `admin.html`.
2. Go to `الصفحات`.
3. Add or open a page.
4. Change `نوع المحتوى` to HTML.
5. Paste simple HTML, for example:

```html
<section>
  <h2>Test HTML</h2>
  <p>This is saved HTML content.</p>
</section>
```

6. Save pages.
7. Open the page from the public site.

## Backup

Back up both:

```text
MySQL database
uploads/
```

The database stores text and paths. The uploaded files live in `uploads/`.

## Reinstall From Scratch

Only do this if you want to reset the installation.

1. Back up anything important.
2. Remove:

```text
api/config.php
install/install.lock
```

3. Drop the old database or create a new empty database.
4. Open the installer again.

Local installer:

```text
http://localhost/Biography/install/
```

Hosting installer:

```text
https://your-domain.com/install/
```

## Common Problems

Cannot open installer:

- Confirm Apache is running.
- Confirm the project folder is in the correct web root.
- Confirm the URL is correct.

Cannot connect to database:

- Confirm MySQL is running.
- Confirm the database exists.
- Check DB name, user, and password.

Login does not work:

- Confirm installation finished.
- Use the admin account created during installation.
- Confirm `api/config.php` exists.

Content does not save:

- Confirm you are logged in.
- Confirm your admin user has permission for that section.
- Confirm MySQL is running.

Uploads do not work:

- Confirm these folders are writable:

```text
uploads/images/
uploads/video/
uploads/logos/
uploads/icons/
uploads/documents/
```
