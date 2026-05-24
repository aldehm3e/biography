# Beginner Installation Guide

This guide is for a first-time customer or beginner who wants to install the Biography CMS without touching code.

The website uses:

- HTML, CSS, and JavaScript for the public pages
- PHP 8 or newer for the backend API
- MySQL or MariaDB for the database
- An installer at `install/`
- An admin panel at `admin.html`

## Important Idea

Do not edit `index.html` to change normal website content.

After installation, content is managed from the admin panel and saved in the database:

- brand name
- slogan
- logo
- hero content
- biography
- projects
- pages
- contacts
- skills
- achievements
- experience

Only edit HTML files if you are changing the template, layout, or developer-level structure.

## What You Need

For local testing:

- Laragon or XAMPP
- PHP 8+
- MySQL or MariaDB
- A browser

For hosting:

- A shared hosting account such as Hostinger or cPanel hosting
- PHP 8+
- MySQL database access
- File Manager or FTP

## Local Installation With Laragon

1. Put the project folder here:

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

5. Open the installer in your browser:

```text
http://localhost/Biography/install/
```

6. Fill the database form:

```text
DB host: localhost
DB name: biography_cms
DB user: root
DB password: leave empty unless your Laragon MySQL has a password
```

7. Fill the first admin account:

```text
Display name: your name
Email: your email
Password: at least 8 characters
```

8. Click `Install CMS`.
9. When installation finishes, open:

```text
http://localhost/Biography/admin.html
```

10. Log in with the email and password you created.

## Local Installation With XAMPP

1. Put the project folder here:

```text
C:\xampp\htdocs\Biography
```

2. Start Apache and MySQL from XAMPP.
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

6. Use your XAMPP database username and password.
7. Create the first admin account.
8. Open:

```text
http://localhost/Biography/admin.html
```

## Hostinger Or cPanel Installation

1. Upload the project files to:

```text
public_html
```

or to a subfolder inside `public_html`.

2. In Hostinger or cPanel, create a MySQL database.
3. Create a MySQL user.
4. Give that user full permissions on the database.
5. Open the installer:

```text
https://your-domain.com/install/
```

If the project is in a subfolder:

```text
https://your-domain.com/folder-name/install/
```

6. Fill the database form using the values from hosting.
7. Create the first admin account.
8. After installation, open:

```text
https://your-domain.com/admin.html
```

## Files Created During Installation

The installer creates:

```text
api/config.php
install/install.lock
```

`api/config.php` contains database login details.

`install/install.lock` blocks the installer after setup so someone cannot reinstall the site by accident.

## Do Not Overwrite These Later

When uploading updates to a live site, be careful with:

```text
api/config.php
install/install.lock
uploads/
```

Do not overwrite them unless you intentionally want to reset or replace the live configuration and uploaded media.

## First Admin Test

After installation:

1. Open `admin.html`.
2. Log in.
3. Change the brand name.
4. Change the brand slogan.
5. Save.
6. Refresh the browser.
7. Open the home page.
8. Confirm the brand name and slogan stayed changed.

If the changes stay after refresh, the database is working.

## Upload Test

In the admin panel:

1. Upload a brand logo.
2. Add a hero slide with an image.
3. Add a project image.
4. Save.
5. Refresh.

If the images still show after refresh, uploads are working.

## Reinstalling From Scratch

Only do this when you intentionally want to reinstall.

Remove:

```text
api/config.php
install/install.lock
```

Then open:

```text
http://localhost/Biography/install/
```

or on hosting:

```text
https://your-domain.com/install/
```

If you also want to remove all old content, empty the database or create a new database before reinstalling.

## Backup

Back up both:

```text
MySQL database
uploads/
```

The database stores text and media paths. The `uploads/` folder stores the actual uploaded files.

## Common Problems

If the installer says PDO MySQL is missing:

- Enable the PHP `pdo_mysql` extension.
- In Laragon or XAMPP, use a PHP version that includes MySQL support.

If uploads do not work:

- Make sure these folders are writable:

```text
uploads/images/
uploads/video/
uploads/logos/
uploads/icons/
```

If login does not work:

- Make sure installation completed.
- Make sure you are using the admin email and password created during installation.
- Check that `api/config.php` exists.

If the site opens but content does not save:

- Confirm the database details in `api/config.php`.
- Confirm MySQL is running.
- Confirm you are logged in as admin.

## Normal Daily Use

After installation, use:

```text
admin.html
```

to manage website content.

Use the admin panel for:

- brand settings
- home page content
- hero slides
- biography
- projects
- pages
- contacts
- account password
- admin email
- phone number

That is the safest way to update the website.
