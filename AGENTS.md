# AGENTS.md

Guidance for coding agents working on Biography CMS.

## Project Shape

- Arabic-first PHP/MySQL CMS with static HTML/CSS/JS public pages.
- Project license: GNU GPL v2.0 only. Keep `LICENSE` and `THIRD_PARTY_NOTICES.md` with distributed copies.
- Active local sync target: `C:\xampp\htdocs\Biography`.
- Main local URLs:
  - `http://localhost/Biography/index.html`
  - `http://localhost/Biography/admin.html`
  - `http://localhost/Biography/install/`
- The database is the source of truth after install. Browser `localStorage` is fallback/cache and migration support only.

## Protect Runtime Files

Never overwrite these on an installed site unless the user explicitly asks:

- `api/config.php`
- `install/install.lock`
- `uploads/`

## Editing Rules

- Keep changes focused and follow the existing vanilla PHP, JavaScript, and CSS style.
- Do not hard-code owner biography content, fake projects, fake achievements, fake experience, or fake contact accounts.
- Keep fresh defaults empty unless the field is structural UI text required for the app to work.
- Update both installer schemas when schema changes:
  - `install/schema.sql`
  - `api/install/schema.sql`
- Keep the two schema files identical.
- Use `css/custom.css` for app-specific styling. Do not edit an external NDS upstream repo.

## Saudi Map Notes

- Public geometry lives in `assets/data/saudi-map.svg`.
- Fixed region metadata lives in `js/saudi-map-data.js`.
- Editable map config lives under `home.regionMap`.
- The admin may edit visibility, title, subtitle, metric label, metric icon, and region values.
- Do not make region names, cities, or SVG geometry editable from the admin.
- The SVG should keep all Saudi regions and their associated islands visible as part of the same heat-map region paths.
- If the map data changes, update `THIRD_PARTY_NOTICES.md` with the source and change summary.

## Sanity Checks

Use XAMPP PHP on this machine:

```powershell
$php = "C:\xampp\php\php.exe"
Get-ChildItem -Recurse -Filter *.php |
  Where-Object { $_.FullName -notmatch '\\(vendor|node_modules|backup|backups)\\' } |
  ForEach-Object { & $php -l $_.FullName }
```

JavaScript syntax:

```powershell
Get-ChildItem -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\(vendor|node_modules|backup|backups)\\' } |
  ForEach-Object { node --check $_.FullName }
```

Schema parity:

```powershell
Compare-Object (Get-Content install\schema.sql) (Get-Content api\install\schema.sql)
```

Local smoke:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost/Biography/index.html
Invoke-WebRequest -UseBasicParsing http://localhost/Biography/admin.html
Invoke-WebRequest -UseBasicParsing http://localhost/Biography/api/content/get-site.php
```
