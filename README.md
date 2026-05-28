# MyBiographyWebsite / Biography CMS

Arabic-first biography website built with vanilla HTML, CSS, JavaScript, PHP 8+, and MySQL/MariaDB. The public pages keep the current NDS visual language, while editable content now comes from the database through the PHP API.

This README is the project memory for future work. Read it before changing the site.

## Current Status

- Database-backed CMS build for local Laragon/XAMPP testing and shared hosting deployment.
- Arabic-first UI with `lang="ar"` and `dir="rtl"`.
- Public pages start blank/minimal.
- No fake biography, fake projects, fake achievements, fake experience, or sample person names.
- Owner name is not hard-coded. It is editable from `admin.html`.
- Extra pages are created from the admin and rendered through the existing frontend pages.
- MySQL/MariaDB is the source of truth for website content.
- `localStorage` is only a temporary fallback/cache and a migration source for old browser-local data.
- Admin login uses PHP sessions, `password_hash()`, and `password_verify()`.
- Admin login includes a server-generated math CAPTCHA stored in the PHP session.
- Database credentials live only in `api/config.php`, which is ignored by Git.
- Admin editor items are collapsed by default so long editor lists stay clean.
- Admin media uploads show an NDS-style progress bar with status feedback while the file is uploading.
- Hero slides can display their own overlay title, subtitle, and description on top of each image/video.
- Hero media and extra pages can be reordered by drag-and-drop in the admin editor.
- New hero media and new extra pages are inserted at the top of their editor lists.

## 2026-05-24 Database CMS Update

This section is the current source of truth for storage, login, installation, and deployment. Older README notes about local passcodes, Supabase, or primary localStorage storage are historical and are superseded by this section.

What changed:

- Added a PHP 8+ API under `api/` with PDO, prepared statements, JSON responses, PHP sessions, and protected admin-only save/upload/account endpoints.
- Added normalized MySQL/MariaDB tables for admin users, site settings, navigation, hero slides, main page content, experiences, achievements, skills, projects, pages, contacts, media uploads, and optional backups.
- Added installer flow under `install/` for requirements checks, database connection, schema creation, first admin creation, seeding, `api/config.php` generation, and `install/install.lock`.
- Refactored `js/store.js` so `SiteStore.load()` reads from `api/content/get-site.php` and `SiteStore.save(data)` writes to `api/content/save-site.php`.
- Updated public rendering and admin editing to wait for async database content while keeping vanilla HTML/CSS/JS and the existing NDS design.
- Added authenticated media uploads to `uploads/images/`, `uploads/video/`, `uploads/logos/`, and `uploads/icons/`.
- Added old localStorage migration support in the admin tools panel.
- Added `README_INSTALL_BEGINNER.md` for first-time installers.
- Added `README_DATABASE.md` for detailed Laragon, XAMPP, Hostinger, backup, restore, and admin usage instructions.

Core endpoints:

- `GET api/content/get-site.php`: returns the whole website model.
- `POST api/content/save-site.php`: saves the whole website model, admin only.
- `POST api/auth/login.php`: logs in with email/password.
- `GET api/auth/captcha.php`: creates the login CAPTCHA challenge.
- `POST api/auth/logout.php`: destroys the PHP session.
- `GET api/auth/me.php`: returns the current admin user.
- `POST api/auth/change-password.php`: changes password, admin only.
- `POST api/auth/change-email.php`: changes email, admin only.
- `POST api/auth/change-phone.php`: changes phone number, admin only.
- `POST api/upload/upload-media.php`: uploads images/videos/icons/logos, admin only.

Quick Laragon install:

1. Put the project under Laragon, for example `C:\laragon\www\Biography`.
2. Start Apache and MySQL from Laragon.
3. Create a database named `biography_cms` with collation `utf8mb4_unicode_ci`.
4. Open `http://localhost/Biography/install/`.
5. Use DB host `localhost`, DB user `root`, and the DB password you use in Laragon. A default Laragon install often has an empty MySQL root password.
6. Create the first admin account in the installer.
7. Open `http://localhost/Biography/admin.html`, log in, save a small brand/settings change, refresh, and confirm it remains.

For first-time installation, read `README_INSTALL_BEGINNER.md`. For detailed database and deployment notes, read `README_DATABASE.md`.

## 2026-05-28 Installer Transaction Fix

The installer previously could fail with `There is no active transaction` after creating some database tables. Root cause: the installer opened a transaction and then `cms_save_site_data()` called `cms_ensure_notifications_table()`, which runs `CREATE TABLE IF NOT EXISTS`. MySQL/MariaDB can implicitly end the active transaction around DDL, so the later commit had no active transaction left.

Fix:

- `install/index.php` now ensures the notifications table immediately after schema import and before starting the installer transaction.
- `api/content/site-repository.php` now only runs `cms_ensure_notifications_table()` during save/fetch when no transaction is already active.
- The installer commit is guarded with `inTransaction()` so a future implicit transaction close cannot crash the final installation step.

If this error happened during a fresh install, drop the partially created database, recreate it, and run `install/` again.

## 2026-05-24 NDS Header, Persona, Dark Mode, and QA Sanity

This section is the current source of truth for the header/account behavior and supersedes older historical notes below when they conflict.

- Desktop header account trigger is icon-only. The account name and dropdown arrow are not visible in the closed header.
- Desktop persona dropdown stays compact at about `215px` wide with a max height around `286px`, aligned under the account icon.
- Persona dropdown actions are Arabic, one-line, icon-aligned actions: `الإدارة`, `تغيير كلمة المرور`, `تغيير البريد الإلكتروني`, `تغيير رقم الجوال`, and `تسجيل الخروج`.
- Logged-out account action uses `تسجيل الدخول`.
- Dark mode is restored as an icon button in both desktop and mobile headers. It toggles the theme, updates the icon, and authenticated saves persist the theme through the database.
- Mobile header icon order is: admin, dark mode, notification, hamburger.
- Mobile header icons are icon-only. The admin label is not shown as wide text in the mobile header.
- Logged-out header admin/login uses the NDS avatar icon (`nds-icon nds-icon-avatar`) on desktop and mobile; after login it shows the saved personal image when one exists.
- Biography avatar (`data-owner-avatar`) and logged-in admin/persona avatar both resolve from the same `home.avatar` path.
- Logged-out mobile drawer does not render a separate `تسجيل الدخول` account row; login is handled by the mobile header icon.
- Logged-in mobile header avatar opens the account dropdown from the header; the hamburger drawer does not render a separate `.nds-persona.nds-sm` account block.
- Footer/contact social links render with NDS icon classes such as `nds-icon nds-hgi-new-twitter` instead of custom inline SVG social icons.
- Date/time is inside the hamburger drawer through the existing header-actions drawer area, not in the visible header.
- The hamburger drawer keeps navigation, date/time, and the mobile account/persona section. Dark mode is not duplicated inside the drawer.
- Toasts use `NDS.Alert.create({ display: "toast" })`; browser `alert()` is not used.
- Logout clears the PHP session, immediately renders the logged-out UI, shows `تم تسجيل الخروج بنجاح`, and does not leave green/success styling on the header or account controls.
- Account settings modals are NDS-style, RTL, Arabic-labeled, validated, and call the PHP auth/account endpoints.
- `nds-hgi-smart-phone-01` is the active phone icon class and is present in `css/nds-icons-full.css`.

QA performed for this update:

```powershell
node --check js\default-data.js
node --check js\store.js
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
node --check assets\vendor\nds\components\js\nds-core.js
node --check assets\vendor\nds\components\js\nds-backdrop.js
node --check assets\vendor\nds\components\js\nds-mainnav.js
node --check assets\vendor\nds\components\js\nds-modal.js
node --check assets\vendor\nds\components\js\nds-feedback.js
node --check assets\vendor\nds\components\js\nds-forms.js
node --check assets\vendor\nds\components\js\nds-alert.js
```

Browser QA was run in headless Chrome at `1440`, `1200`, `1024`, `768`, `430`, `390`, and `360` widths.

Verified in browser QA:

- No horizontal scrolling at tested widths.
- No console errors.
- Desktop account name hidden and dropdown arrow absent.
- Desktop dropdown opens at `215px` wide, max `286px` high, with about `1px` gap after the email line before actions.
- Desktop and mobile dark mode toggles work and persist.
- Mobile icon order is `admin, theme, notification, hamburger`.
- Mobile notification opens.
- Mobile notification and mobile admin dropdowns are mutually exclusive: after opening notifications, tapping the mobile admin/avatar icon closes notifications and opens the admin menu.
- Mobile hamburger navigation links do not show persistent current/touch highlight; their background stays neutral and only changes on real hover-capable pointers.
- Hamburger opens and date/time appears in the drawer.
- Drawer dark mode duplicate is hidden.
- Phone icon renders; no `nds-hgi-call-02` remains.
- Login failure toast, login success, logout success toast, change password modal, change email modal, change phone modal, and phone save path work.
- Logout green-state leak was not detected.

## Design Reference Rules

The NDS vanilla folder is a read-only design authority.

- Do not build inside the NDS reference folder.
- Do not modify the NDS reference folder.
- Do not link directly to files inside the NDS reference folder.
- `assets/vendor/nds/` contains the reusable local NDS frontend toolkit copied from the read-only NDS reference.
- If future updates require additional NDS components or assets, add only the specific frontend files required at that time.
- Do not copy `.git`, GitHub workflows, `node_modules`, build caches, package caches, screenshots only used for docs, source-control metadata, or temporary files.
- Keep copied NDS vendor assets lightweight, clean, and maintainable.
- Custom CSS should extend the NDS design language, not replace it.

NDS patterns followed in this project:

- Sticky 72px header/navigation.
- Theme is applied early in each page head to avoid a light/dark flash before `app.js` renders.
- Dark/light mode uses a button-origin circular reveal motion that expands across the full page, with a fallback overlay for browsers without View Transitions.
- Home hero slider keeps slides mounted so transitions move smoothly between current and next slides.
- Admin list ordering uses a simple local drag handle pattern without adding external libraries.
- Shared max-width content container.
- IBM Plex Sans Arabic font usage.
- Saudi/NDS green color family.
- Small radii, mostly 4px to 8px.
- NDS-style buttons: `nds-btn`, `nds-primary`, `nds-secondary-outline`, `nds-subtle`.
- NDS-style cards: `nds-card`, `nds-stroke`, `nds-card-content`.
- NDS-style forms: `nds-form`, `nds-form-container`, `nds-form-header`, `nds-form-control`, `nds-input`.
- RTL-friendly logical properties.
- Responsive navigation and stacked mobile layouts.

## NDS Vendor Toolkit

Copied toolkit location:

```text
assets/vendor/nds/
```

Vendor structure:

- `css/`: NDS stylesheet entry files available from the reference assets.
- `js/`: NDS bundled runtime scripts from the reference assets.
- `fonts/`: NDS font files.
- `icons/`: NDS icon assets.
- `images/`: NDS image/SVG assets used by components or branding.
- `components/scss/`: component Sass source for future local component work.
- `components/js/`: component JavaScript source for future local component work.
- `utilities/scss/`: core token, base, font, reset, grid, icon, utility, and mixin Sass source.
- `utilities/layout/`: NDS layout helper Sass source.

Important:

- The active website still uses `css/custom.css`.
- The vendored toolkit is available for future pages/components.
- Do not modify the original NDS reference folder.
- Do not expose documentation/demo clutter on public pages.

Common local component files now available:

- Accordion: `assets/vendor/nds/components/scss/_accordion.scss`, `assets/vendor/nds/components/js/nds-accordion.js`
- Tabs: `assets/vendor/nds/components/scss/_tabs.scss`, `assets/vendor/nds/components/js/nds-tabs.js`
- Avatar: `assets/vendor/nds/components/scss/_avatar.scss`
- Cards: `assets/vendor/nds/components/scss/_cards.scss`
- Buttons: `assets/vendor/nds/components/scss/_buttons.scss`
- Forms and inputs: `assets/vendor/nds/components/scss/_forms.scss`, `assets/vendor/nds/components/js/nds-forms.js`
- Navigation: `assets/vendor/nds/components/scss/_mainnav.scss`, `assets/vendor/nds/components/js/nds-mainnav.js`
- Persona: `assets/vendor/nds/components/scss/_persona.scss`
- Alert/toast: `assets/vendor/nds/components/scss/_alert.scss`, `assets/vendor/nds/components/js/nds-alert.js`

## Privacy and Content Rules

Keep these rules intact:

- Do not display any external repo owner name in the website UI.
- Do not use any external person name as sample content.
- Do not hard-code the website owner name.
- Do not add fake biography text.
- Do not add fake projects.
- Do not add fake achievements.
- Do not add fake experience.
- Do not add fake contact accounts.
- Do not add visible demo content to public pages.
- Public pages should show only minimal empty states until admin content is saved.

Approved empty-state text currently used:

- `لم تتم إضافة محتوى بعد`
- `يمكنك إضافة المحتوى من لوحة الإدارة.`
- `لم تتم إضافة مشاريع بعد`
- `لم تتم إضافة وسائل تواصل بعد`

## File Map

Root pages:

- `index.html`: Home/biography page and extra-page hash renderer.
- `projects.html`: Projects page. Starts empty until projects are added.
- `pages.html`: Dedicated added-pages listing page.
- `admin.html`: Database CMS admin interface for all editable content.
- `README.md`: Project guide and future handoff notes.
- `README_INSTALL_BEGINNER.md`: Step-by-step installation guide for beginners and customers.
- `README_DATABASE.md`: Installation, deployment, backup, restore, and admin operation guide.

Styles:

- `css/custom.css`: NDS-inspired local stylesheet, shared layout, responsive behavior, cards, buttons, forms, empty states, contact icons, login, and admin layout.
- Contact/social editor controls use an NDS-like accordion motion and an `nds-dropmenu` control for `نوع الأيقونة`.
- Contact/social accordion content is fully clipped when closed so inner form labels/fields do not show through.

Scripts:

- `js/default-data.js`: Empty fallback/seed data object and contact icon options.
- `js/store.js`: API-backed data layer. It uses `api/content/get-site.php` and `api/content/save-site.php`, with localStorage only as fallback/cache/migration input.
- `js/app.js`: Public rendering: navigation, home page, projects page, contact/social icons, extra pages, empty states, theme reveal motion, and hero slider motion.
- `js/admin.js`: Admin login and editing logic: settings, home, contacts, projects, pages, navigation, account, import/export/reset, collapsed editor panels, uploads, first-position inserts, and drag/drop ordering.

Backend:

- `api/config.example.php`: Safe example config committed to Git.
- `api/config.php`: Real database config generated by the installer and ignored by Git.
- `api/db.php`: Shared PDO/session/JSON helpers.
- `api/content/site-repository.php`: Database mapping between normalized tables and the frontend site model.
- `api/content/get-site.php`: Public site data endpoint.
- `api/content/save-site.php`: Admin-only full-site save endpoint.
- `api/auth/`: Login, logout, current user, password/email/phone updates.
- `api/upload/upload-media.php`: Admin-only upload endpoint.
- `install/index.php`: Browser installer.
- `install/schema.sql`: MySQL/MariaDB schema.
- `uploads/`: Runtime media folders; only `.gitkeep` placeholders are committed.

Project assets:

- `assets/images/`: Reserved for future local user images, such as an avatar.

Key vendor assets:

- `assets/vendor/nds/images/favicon.svg`
- `assets/vendor/nds/images/palm_swords.svg`

## Data Model

Default fallback/seed data is defined in `js/default-data.js`. After installation, the normalized database tables are the source of truth and `api/content/get-site.php` returns the frontend model.

```js
window.DEFAULT_SITE_DATA = {
  settings: {
    siteName: "",
    brandName: "",
    brandSlogan: "",
    brandLogo: "",
    language: "ar",
    direction: "rtl",
    theme: "light",
    phoneNumber: "",
    email: ""
  },
  navigation: {
    homeLabel: "الرئيسية",
    projectsLabel: "المشاريع",
    adminLabel: "الإدارة"
  },
  home: {
    ownerName: "",
    title: "",
    intro: "",
    avatar: "",
    biography: "",
    heroTitle: "",
    heroSubtitle: "",
    heroIntro: "",
    heroImage: "",
    heroVideo: "",
    heroSlides: [],
    experience: [],
    achievements: [],
    skills: [],
    contacts: []
  },
  projects: [],
  pages: []
};
```

Contact/social item shape:

```js
{
  id: "",
  label: "",
  url: "",
  iconType: "linkedin",
  iconPath: "",
  visible: true
}
```

Hero slide item shape:

```js
{
  title: "",
  subtitle: "",
  intro: "",
  image: "",
  mobileImage: "",
  video: "",
  mobileVideo: "",
  alt: "",
  visible: true
}
```

Built-in contact icon/logo options:

- LinkedIn
- Facebook
- Instagram
- YouTube
- GitHub
- X / Twitter
- Email
- Website
- Phone

## Admin Access Control

The admin dashboard is hidden until login succeeds.

- Login posts email/password to `api/auth/login.php`.
- PHP sessions keep the authenticated state.
- Passwords are stored only as hashes created by `password_hash()`.
- `api/auth/me.php` is used to restore the current admin state after refresh.
- Save, upload, change-password, change-email, and change-phone endpoints require an authenticated admin session.
- No admin password or database credentials are stored in JavaScript.

## Editable Content

Home content editable from Admin > الرئيسية:

- Owner name
- Professional title
- Hero intro
- Avatar/image path
- Biography text
- Experience items
- Achievement items
- Skills/expertise areas
- Contact/social links
- Contact/social icon type
- Optional custom contact/social icon path
- Contact/social visibility
- The `نوع الأيقونة` field uses a local NDS-style `nds-dropmenu` instead of the browser native select.
- The `نوع الأيقونة` field should visually align with text inputs: same height, same border, same padding rhythm, and an internal arrow.
- Hero media editor cards are collapsed by default. Use the card header to open only the item being edited.
- New hero media is inserted at the top of the list and opens immediately.
- Hero media cards support drag-and-drop ordering. The saved order controls the public hero slider order.

Line formats in admin:

```text
Experience: title | period | description
Achievement: title | date | description
Skill: one skill per line
```

Projects editable from Admin > المشاريع:

- Project title
- Description
- Status
- Date
- Category
- Optional image/icon path

Extra pages editable from Admin > الصفحات:

- Page title
- Slug
- Page content
- Visibility

Extra page editor cards are collapsed by default. New pages are inserted at the top of the list and open immediately. Pages support drag-and-drop ordering; the saved order controls the public header navigation order.

Visible pages appear automatically in navigation. Hidden pages do not appear in navigation.

Extra pages render through:

```text
index.html#/page/page-slug
```

## Storage

Primary storage is MySQL/MariaDB through the PHP API.

The old browser-local storage key is still recognized only for fallback/cache and migration:

```text
websiteDemo:siteData
```

Only `js/store.js` should touch localStorage directly.

Public pages call:

- `SiteStore.load()`

Admin calls:

- `SiteStore.load()`
- `SiteStore.save(data)`
- `SiteStore.reset()`
- `SiteStore.exportJson()`
- `SiteStore.importJson(jsonText)`

This isolation keeps public rendering stable while the backend remains replaceable behind the same store API.

## Supabase Note

Supabase is no longer the active plan. The current supported architecture is PHP 8+ and MySQL/MariaDB for Laragon, XAMPP, Hostinger, cPanel, and similar shared-hosting environments.

## Layout Width Rule

Header, main content, and footer must align.

The shared container is:

```css
.site-container {
  width: min(100% - var(--site-gutter), var(--site-max-width));
  margin-inline: auto;
}
```

Do not let nav links or footer content stretch across the full viewport. The full-width background is allowed, but the inner content must use `.site-container`.

## How to Run Locally

The CMS must be served through PHP. Opening the HTML files directly will not load the database API.

Laragon quick path:

1. Put the project in `C:\laragon\www\Biography`.
2. Start Apache and MySQL.
3. Create the database, for example:

```powershell
mysql -u root -e "CREATE DATABASE biography_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

4. Open `http://localhost/Biography/install/`.
5. Complete the DB connection and first admin account form.
6. Open `http://localhost/Biography/admin.html`.

No build step, Composer, framework, CDN, Bootstrap, Tailwind, React, Vue, or Angular is required.

## Admin Workflow

1. Open `admin.html`.
2. Log in with the admin email and password created by the installer.
3. Fill content in the relevant section.
4. For hero media and extra pages, drag the handle on the card to change order when needed.
5. Save that section.
6. Open `index.html`, `projects.html`, or `pages.html`.
7. Confirm the public page renders saved content in the saved order.

Admin sections:

- الرئيسية
- المشاريع
- الصفحات
- التنقل
- الأدوات
- Account/settings actions from the admin/account UI

## Export, Import, Reset

From Admin > الأدوات:

- `تصدير JSON`: downloads and prints current database content.
- `استيراد JSON`: imports JSON from the textarea and saves it to the database.
- File input: loads a JSON file into the textarea.
- `إعادة التعيين`: resets database content to blank defaults.
- LocalStorage migration: sends old browser-local content to the database when needed.

## Validation Checklist

Before future handoff or deployment, test:

- NDS reference folder remains untouched.
- Website pages reference `assets/vendor/nds/` instead of the NDS reference folder.
- Accordion, tabs, avatars, cards, buttons, and forms source files are available in the copied toolkit.
- Header logo uses `assets/vendor/nds/images/palm_swords.svg`.
- The text `palm_swords` does not appear visibly in the UI.
- No fake person name appears.
- Home page loads.
- Home page starts blank/minimal after reset.
- Projects page loads.
- Projects page starts empty after reset.
- Installer completes and creates `api/config.php` plus `install/install.lock`.
- Admin page requires email/password login.
- Logout works.
- Admin saves home content.
- Saved home content appears on home page.
- Data remains after refresh and in another browser.
- Brand name, slogan, logo upload, hero image upload, hero video upload, project image upload, and contact icon upload work.
- Contact/social logo options exist for LinkedIn, Facebook, Instagram, YouTube, GitHub, X/Twitter, Email, Website, and Phone.
- Contact/social items render only when visible.
- Admin adds a project.
- Project appears on projects page.
- Admin edits and deletes a project.
- Admin creates an extra page.
- Visible extra page appears in navigation.
- Hidden extra page does not appear in navigation.
- Extra page route works: `index.html#/page/page-slug`.
- Hero editor cards are collapsed by default.
- New hero media appears at the top of the hero editor list.
- Dragging hero media changes the saved public hero slider order.
- Page editor cards are collapsed by default.
- New pages appear at the top of the page editor list.
- Dragging pages changes the saved public navigation order.
- Export JSON works.
- Import JSON works.
- Reset content works.
- Change password works.
- Change email works.
- Change phone works.
- Header content aligns with main content.
- Footer content aligns with main content.
- Header admin persona dropdown shows labeled actions on desktop and mobile.
- Admin logout is handled through the header persona dropdown, not a separate dashboard button.
- After logout, the admin trigger returns to the standard admin/avatar icon unless the user is authenticated and has a saved avatar.
- NDS alert/toast messages render with status icons and Arabic text.
- Desktop, tablet, and mobile layouts work.
- RTL layout remains correct.
- Browser console has no errors.

Commands used for basic checks:

```powershell
node --check js\default-data.js
node --check js\store.js
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
node --check assets\vendor\nds\components\js\nds-alert.js
php -l api\config.example.php
php -l api\db.php
php -l api\auth\login.php
php -l api\auth\logout.php
php -l api\auth\me.php
php -l api\auth\change-password.php
php -l api\auth\change-email.php
php -l api\auth\change-phone.php
php -l api\content\get-site.php
php -l api\content\save-site.php
php -l api\content\site-repository.php
php -l api\upload\upload-media.php
php -l install\index.php
```

## 2026-05-24 NDS Persona, Alerts, and Biography Layout QA

- Header brand and footer brand marks use `assets/vendor/nds/images/palm_swords.svg`.
- The brand slogan is `موقع شخصي`.
- The admin action follows the NDS persona/dropdown pattern from `C:\Users\Fluent\Desktop\Projects\NDS-vanilla\_includes\mainnav-user.html`.
- On mobile, the admin persona action is a `.nds-PAB` and is moved by the NDS mainnav runtime into `.nds-nav-minimal`, where it opens as a full-width dropdown panel like the NDS demo.
- Mobile label hiding must be scoped only to the header trigger labels. Do not hide all `.nds-label` descendants inside `.header-actions` or `.nds-nav-minimal`, because that hides the persona dropdown actions.
- Persona dropdown actions are vertical labeled rows:
  - `لوحة الادارة`
  - `تسجيل خروج`
- Logout is owned by the header persona dropdown. The old admin dashboard `[data-logout]` button was removed.
- After logout, `renderAdminPersona()` returns the admin trigger to the standard admin icon. If logout happens on `admin.html`, the admin dashboard is hidden and the user is sent back to `index.html`.
- `NDS.Alert.create({ display: "toast" })` is the toast source of truth. It creates `.nds-alert.nds-card.nds-toast` at runtime.
- Toast copy is Arabic, and alert close labels are Arabic on Arabic pages.
- Alert icons must inherit status from `.nds-alert[data-status]`; do not depend only on `.nds-feedback[data-status]`.
- The biography card keeps `.nds-card-content.bio-layout`, with a large centered image column and the biography text column beside it on desktop. On mobile it stacks cleanly.

Sanity checks for this update:

```powershell
node --check js\default-data.js
node --check js\store.js
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
node --check assets\vendor\nds\components\js\nds-alert.js
rg -n "data-logout" admin.html js
rg -n "admin-trigger-avatar|nds-persona-action|nds-alert\\[data-status|bio-card \\.bio-layout" index.html css js
```

## 2026-05-24 Mobile Header Notification Fix

- Current mobile header target behavior: the closed header should show the website brand/title/slogan, the notification bell, and the hamburger menu button.
- The admin persona and notification bell are persistent action buttons. Both move through NDS `managePABPlacement()` on mobile.
- Dark/light mode stays inside the opened hamburger drawer on mobile.
- Date/time must not appear in the mobile header or mobile drawer.
- The local NDS reference behavior was restored in `assets/vendor/nds/components/js/nds-mainnav.js`: `managePABPlacement()` moves `.nds-PAB` items from `.nds-nav-actions` into `.nds-nav-minimal` on mobile and returns them to their placeholders on desktop.
- This matches the NDS vanilla reference pattern from `C:\Users\Fluent\Desktop\Projects\NDS-vanilla\_js\nds-mainnav.js`.
- The repeated root page header markup keeps `.header-actions.nds-nav-actions` inside `.nds-collapse > .nds-collapse-content`; persistent action placeholders start there and are moved by the NDS runtime.
- `css/custom.css` now makes mobile notification dropdowns use the same guttered panel width as the hamburger drawer.
- `css/custom.css` defines `--radius-lg: 16px` so both hamburger and notification panels get rounded bottom corners.
- Mobile notification dropdowns are viewport-safe, scrollable when content exceeds the available height, and keep the slide-down/slide-up motion.
- Opening the notification dropdown closes the hamburger drawer; opening the hamburger/admin controls closes the notification dropdown so both panels do not stay open together.
- Follow-up fix: header click blocking is now scoped to `body[data-state="backdrop"]:has(.nds-modal:not([hidden])) .site-header` only. Do not put `pointer-events: none` on `body[data-state="backdrop"] .site-header` globally, because the hamburger and notification menus also use the NDS backdrop and must remain scrollable/clickable.
- Modal layering remains above the fixed header: `.nds-backdrop` uses `z-index: 1900`, `.nds-modal` uses `z-index: 1901`, and `assets/vendor/nds/components/js/nds-modal.js` requests a `1900` backdrop z-index.
- QA after the follow-up fix confirmed mobile hamburger scrolling, mobile notification scrolling, desktop notification scrolling, and admin modal header blocking.
- The active root pages load `assets/vendor/nds/components/js/nds-mainnav.js`; keep that source file in sync with any future bundled/minified runtime only if pages are changed to load the bundle.

QA for this update:

```powershell
node --check js\app.js
node -e "const fs=require('fs'); new Function(fs.readFileSync('assets/vendor/nds/components/js/nds-mainnav.js','utf8')); console.log('nds mainnav parse ok')"
node -e "const fs=require('fs'); new Function(fs.readFileSync('assets/vendor/nds/components/js/nds-modal.js','utf8')); console.log('nds modal parse ok')"
```

## 2026-05-22 Login, Notifications, Admin, and Footer Inheritance Update

Use these notes as the current source of truth for the latest shell behavior.

- Login is a popup dialog, not a dedicated login page.
- The login modal uses the NDS structure `nds-modal nds-card nds-stroke nds-sm` with `id="login-modal"` and `role="dialog"`.
- Login form direction is LTR because the email/password fields are English credential inputs.
- Current local test credentials are configured in `js/default-data.js`:
  - Email: `admin@gmail.com`
  - Password/passcode: `1234`
- After a successful login, the user is sent to `admin.html` / لوحة الادارة.
- Logging out from `admin.html` sends the user back to the main page (`index.html`).
- Login state is local/static only and remains for local testing. Replace it with real authentication before production use with multiple users.

Header and notification behavior:

- The header uses the local NDS mainnav runtime and local NDS assets, not the external NDS reference website.
- The notification bell is part of the header action area and should visually feel attached to the header, not like a separate floating box.
- Notification dropdown content is Arabic.
- The dropdown follows the NDS drawer/list structure and has slide-down/slide-up motion.
- Clicking notification actions such as mark as read or dismiss must not close the dropdown.
- Clicking "عرض كل الاشعارات" opens `notifications.html`.
- Public notification items are saved with the site data so admin updates are visible to visitors.
- Each visitor's read/delete state is local under `websiteDemo:notificationState`.
- Saving meaningful public home content, projects, or pages from the admin creates one valid notification per changed item, without repeated counts on unchanged saves.
- Dark/light mode toggle should not create a notification; the motion feedback is enough.

Footer inheritance:

- Do not hard-code footer version/disclaimer text in every HTML page.
- Footer version and disclaimer are inherited from `js/app.js` through `renderFooterMeta()`.
- Any old or new page that includes `.nds-footer-meta` receives:
  - `Biography v1.0`
  - `تنويه: هذا الموقع شخصي وغير تابع لأي جهة حكومية، ولا يمثل إلا وجهة نظر صاحبه.`
- Keep footer metadata centralized in `js/app.js` so future pages inherit it automatically.

Admin layout:

- Admin section navigation should remain reachable while scrolling long forms.
- It should not overlap the footer or header dropdowns.
- Current approach: sticky/sidebar behavior inside the admin layout rather than duplicating page-level controls.

Current local NDS package/runtime requirement:

- Root pages should load the local NDS-compatible CSS and JavaScript needed for modal, forms, mainnav, backdrop, alerts, feedback, icons, and local components.
- Required local files include the local compatibility layers:
  - `css/nds-icons-full.css`
  - `css/nds-hgi-rounded-stroke.css`
  - `css/nds-local-components.css`
  - `js/nds-local-components.js`
- Do not rely on the published NDS demo site at runtime.

Sanity checks for this update:

```powershell
node --check js\default-data.js
node --check js\store.js
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
rg -n "Biography v1.0|غير تابع لأي جهة حكومية|admin@gmail.com|login-modal|websiteDemo:notificationState" README.md js
rg -n "nds-footer-meta|site-footer|data-footer-links|data-footer-social" . -g "*.html"
rg -n "Biography v1.0|غير تابع لأي جهة حكومية" . -g "*.html"
```

Headless browser load check used locally:

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --dump-dom file:///C:/Users/Fluent/Desktop/Projects/website_demo/index.html
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --dump-dom file:///C:/Users/Fluent/Desktop/Projects/website_demo/projects.html
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --dump-dom file:///C:/Users/Fluent/Desktop/Projects/website_demo/admin.html
```

Privacy scan used locally:

```powershell
rg -i "forbidden-name-patterns" index.html projects.html admin.html README.md css js
```

## Last Implementation Notes

Latest completed work:

- Added reusable local NDS frontend toolkit under `assets/vendor/nds/`.
- Kept the public pages clean and minimal.
- Preserved the header logo as a local palm_swords image asset.
- Added contact/social item editor with icon/logo type, custom icon path, and visibility.
- Refined the contact/social editor accordion motion and the `نوع الأيقونة` field so both feel closer to NDS patterns.
- Fixed the contact/social accordion closed state so inner text no longer appears when collapsed.
- Adjusted the `نوع الأيقونة` control to match the textbox layout and use the NDS arrow class/fallback styling.
- Replaced the native contact/social `نوع الأيقونة` select with an NDS-style `nds-dropmenu` control that opens, closes, and aligns like the surrounding textbox fields.
- Changed the contact/social delete action from a boxed text button to a subtle destructive icon-only button.
- Changed the public navigation admin link from visible `الإدارة` text to an icon-only button using the NDS avatar icon token while keeping the admin label editable in the data layer.
- Reworked the footer into an NDS-style green footer with aligned `.site-container` content, quick links generated from navigation, and social icon buttons generated from visible contact/social items.
- The footer intentionally does not copy NDS demo links, external sample accounts, or public placeholder social links.
- Removed the public home contact section; contact/social links now appear only as footer icon buttons.
- Contact/social footer icons no longer require a visible label. A saved visible item with a URL is enough; the label remains optional for accessibility and admin organization.
- Updating contacts alone no longer counts as home biography content, so the public home page can remain blank/minimal while footer social icons are present.
- Reworked the home hero into an NDS-style full-width image hero using local NDS image assets with an overlay. It remains hidden until editable home content exists.
- Moved the biography text into the home hero and removed the separate public `نبذة / السيرة` section to avoid duplicated biography headings.
- Fixed mobile overflow by constraining large section titles and hero text inside the shared container on small screens.
- Fixed medium/desktop hero overflow by giving the hero text a right-aligned content column and switching the hero image to the clearer local `riyadhcenter.webp` asset.
- Added local admin passcode gate and logout.
- Kept localStorage export/import/reset intact.
- Kept NDS reference folder untouched.

Known repo note:

- The current git worktree had unrelated deleted tracked files from an earlier state. Do not revert user changes unless explicitly asked.

## Deployment

Deployment is intentionally not included in this step. Build and test locally first.

## 2026-05-22 Header Date and Theme Motion Update

- Header date/time now formats fully in Arabic for Riyadh time, including Arabic numerals and Arabic AM/PM markers.
- The header calendar icon uses the local HGI/NDS `hgi hgi-stroke hgi-calendar-01` icon.
- Dark/light mode toggling now uses a local View Transitions reveal motion from the toggle button, with a reduced-motion-safe CSS fallback.
- No external NDS reference folder dependency was added. The needed icon and motion behavior live in `css/nds-local-components.css`, `css/custom.css`, and `js/app.js`.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Hero Video Support Update

- Hero slides now support video as well as images.
- Admin hero slide items include optional desktop video and mobile video paths.
- Existing image fields still work, and can also be used as the poster/cover image for video slides.
- Public hero videos render locally with `autoplay`, `muted`, `loop`, and `playsinline` so they work as background hero media after publishing.
- Supported local video paths include files such as `assets/video/hero.webm` or `assets/video/SA_flag.mp4`.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Admin HTML Snippet Compatibility Update

- Admin-created HTML pages now handle pasted full-document snippets more gracefully by extracting useful head assets and body content.
- Trusted inline scripts that register `DOMContentLoaded` callbacks now run after dynamic insertion instead of waiting for an event that already happened.
- External scripts are executed in order, so an inline script pasted after a library waits for that library to load first.
- After trusted HTML scripts finish, the page refreshes local NDS compatibility components and emits `site:trusted-html-ready`.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Local Definition List and Dropmenu Snippet Update

- Added local compatibility styling for pasted `nds-definition-list` snippets and responsive `nds-definition-item` rows.
- Added local dropmenu behavior for `.rich-html-content .nds-dropmenu`, including open/close, outside-click close, Escape close, and basic menu roles.
- Added local fallback masks for snippet icons: `hgi-user-account`, `hgi-building-02`, `hgi-briefcase-02`, `hgi-edit-02`, `hgi-delete-02`, `nds-hgi-menu-01`, `nds-hgi-copy-01`, `nds-hgi-share-01`, and `nds-hgi-location-01`.
- This keeps these pasted NDS snippets working after deployment without requiring the external HGI icon font or full NDS runtime.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Full Local NDS Icon Runtime Update

- Added browser-ready local CSS bundles generated from the vendored NDS sources:
  - `css/nds-icons-full.css`
  - `css/nds-hgi-rounded-stroke.css`
- All root HTML pages now load the full NDS icon token CSS and full HGI rounded stroke icon font locally.
- The HGI font path points to `assets/vendor/nds/fonts/hgi-stroke-rounded.woff2`, so icon rendering works after publishing without the external NDS reference folder.
- Keep `css/nds-local-components.css` as the site compatibility layer for NDS snippets that need local behavior or component-specific layout.
- Do not link the `.scss` files in `assets/vendor/nds/css/` directly; they are Sass/Jekyll source entries, not browser-ready CSS.

QA for this update:

```powershell
node --check js\app.js
node --check js\nds-local-components.js
```

## 2026-05-22 Definition List Visual Alignment Update

- Adjusted local `nds-definition-list` compatibility to match the unboxed NDS default-style snippet: icon and label on one row, description below aligned with the label.
- Removed the previous card-like border/background treatment from `nds-definition-item`.
- Kept full local HGI/NDS icon support in place through `css/nds-icons-full.css` and `css/nds-hgi-rounded-stroke.css`.

## 2026-05-22 Mixed LTR/RTL NDS Component Update

- Dynamic NDS snippets inside admin-created pages now detect component direction from their own content.
- English tab snippets render left-to-right inside the Arabic site, while Arabic tab snippets remain right-to-left.
- Local tab scrolling respects the detected direction, so "show more" moves through tabs in the expected direction.
- The same direction detection is also applied to local swiper and dropmenu snippets.

## 2026-05-22 Admin Editor List Contrast Update

- Admin panel cards now use the normal card background while nested `.editor-list` containers use a subtle neutral band.
- Items inside `.editor-list` use the default card background, border, and a light shadow so they are easier to distinguish from the containing panel.
- Panel headings, compact headings, and form labels were tightened so titles sit closer to their related controls without crowding the layout.

## 2026-05-22 Admin Visual Layering Update

- Increased the visual contrast between admin panel cards, `.editor-list` containers, and repeated editor items.
- Admin panel cards stay on the default card surface, `.editor-list` containers use a stronger neutral band, and nested editor items use a light Saudi green surface with matching borders.
- Removed the boxed background/border around the contact visibility checkbox row so the check mark appears inline and lighter.

## 2026-05-22 Admin Full Usability Styling Update

- Reworked the admin dashboard visual hierarchy for easier scanning: clearer sidebar, stronger active tab state, tighter panel headings, and more consistent form spacing.
- Desktop admin layout now uses a sticky sidebar with vertical section tabs; tablet/mobile keeps the horizontal scrollable tab strip.
- Form controls use a softer neutral field surface with clear focus state and better spacing between field groups.
- Editor lists and nested editor items now use distinct surfaces and borders so repeated content blocks are easier to distinguish.
- Contact, hero, project, and page editor accordion headers use a subtle tinted header and lighter body surface.

## 2026-05-22 Admin Editor List Palette Cleanup

- Adjusted `.editor-list` and nested editor item colors to use a calmer neutral hierarchy instead of mixing strong green and gray backgrounds.
- Green is kept for active/focus accents elsewhere, while repeated editor items now use neutral surfaces for better consistency.

## 2026-05-22 Admin Sticky Sections Navigation Update

- Admin sidebar section navigation now sticks below the fixed header while scrolling through long admin forms.
- The sidebar has a viewport-aware max height and internal scrolling so section navigation remains reachable without returning to the top.
- The sidebar uses fixed positioning on desktop so the section navigation remains visible while moving through long admin forms.
- `.editor-list` containers and nested editor cards now use softer rounded corners.

## 2026-05-22 UI/NDS Update

This update records the latest interface decisions and implementation details.

- Header navigation now renders added pages as independent links in the main horizontal navigation. Pages are no longer grouped under a single "الصفحات" dropdown or grouped header item.
- The header navigation supports horizontal scrolling by mouse wheel while hovering over the nav strip, plus arrow buttons on both sides of the strip.
- The navigation strip was shifted slightly left visually while keeping the site brand close to the links and the admin icon beside the date/time utilities.
- The admin icon is no longer part of the main navigation list. It appears as an icon-only action beside the date/time and theme button.
- Home biography content is organized into one biography card below the hero. The owner name, professional title, intro, biography text, and avatar are treated as biography content rather than hero text.
- The biography card uses a two-column desktop layout: avatar/image on the right and text on the left. It stacks cleanly on smaller screens.
- Project cards now include a project browsing action. Admin > المشاريع includes a new "رابط تصفح المشروع" field saved as `project.url`.
- If a project has a URL, the public project card shows "تصفح المشروع" and opens it in a new tab. If no URL is saved, the card shows a disabled "لا يوجد رابط" button.
- Project and page editor items in the admin are independent collapsible containers. Each project/page can be opened or closed from its card header.
- `pages.html` remains available as a dedicated page listing screen, but header navigation prioritizes each visible added page as its own standalone link.
- HTML pages added from the admin now support inline `<style>` and trusted inline `<script>` blocks. Scripts are re-created after insertion so interactive snippets such as calendars can initialize.
- Extra page content no longer uses an internal fixed-height scroll area. The content container is wider and grows naturally with embedded components to avoid unwanted inner scrollbars.
- No new external asset download was needed in this pass. The local NDS-compatible assets already available under `assets/vendor/nds/` were sufficient.

Files touched in this update:

- `index.html`: biography card structure and header admin utility placement.
- `projects.html`: header admin utility placement.
- `admin.html`: header admin utility placement.
- `pages.html`: dedicated pages listing screen.
- `js/app.js`: standalone page links in navigation, horizontal wheel nav scrolling, project browse buttons, page listing renderer, trusted admin HTML script execution.
- `js/admin.js`: project URL field, project/page collapsible editor containers.
- `css/nds-local-components.css`: NDS-compatible icons, scrollable nav, biography two-column layout, project/page cards, admin editor accordion styling.
- `css/nds-local-components.css`: also removes the fixed-height inner scroll behavior from extra page content and widens the page container for embedded HTML components.

Validation commands for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Hero/Header Arrow QA Update

Latest visual adjustment before GitHub preparation:

- Hero slider arrows now use the same NDS local arrow icon classes used by the header navigation arrows.
- Hero slider arrow buttons are icon-only and visually transparent: no visible boxed border, fill, or button container.
- Header navigation scroll arrows are also transparent icon-only controls with no visible boxed border/fill.
- Hero slide motion now combines opacity transition with a subtle scale motion so changing between hero images feels smoother.
- The hero renderer now applies the active slide state on the next animation frame after DOM insertion, so the fade/scale transition actually runs when moving between images.
- This is implemented in `index.html`, `js/app.js`, and `css/nds-local-components.css`; no new assets were required.

QA performed:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

GitHub preparation note:

- Current branch: `main`
- Remote: `origin https://github.com/aldehm3e/studylab.git`
- Do not push automatically without an explicit user confirmation.
- The worktree still contains older tracked deletions from the previous site state plus the new NDS-based files. Review `git status --short` before staging.

## 2026-05-22 Projects Detail Update

- The `مشاريعنا` page container was widened to give project cards more room.
- Project grid cards no longer use a constrained internal scroll area.
- Project cards now open an internal standalone details page instead of opening the external project URL directly.
- New page: `project.html`.
- Detail links use `project.html?id=<project-index>` and read the selected project from `localStorage`.
- `project.html` displays the full project image, title, description, status, date, category, a back button, and an optional external project link.
- The external project URL is still managed from Admin > المشاريع through `رابط تصفح المشروع`.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Dynamic NDS Snippets Update

- Pasted NDS snippets inside admin-created HTML pages now initialize more reliably after dynamic insertion.
- `js/nds-local-components.js` now watches for dynamically added `.nds-tabs` and `.nds-accordion` elements and initializes them automatically.
- The local tabs compatibility layer reveals `.nds-tabs[hidden]`, activates the selected panel, supports keyboard navigation, and supports the `.nds-show-more` button by horizontally scrolling the tab list.
- `js/app.js` calls `NDSLocalComponents.refresh()` immediately and again on the next task after rendering trusted admin HTML. This helps snippets inserted with inline scripts or delayed DOM writes.
- `css/nds-local-components.css` now includes styling for `.nds-tab-content.nds-card.nds-stroke.nds-shadow` so pasted NDS tab examples render as visible cards.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Swiper and Mixed Text Update

- Pasted `.nds-swiper` snippets now work in admin-created HTML pages through the local `NDSLocalComponents` compatibility layer.
- The local swiper support reveals `.nds-swiper[hidden]`, reads `slides-max`, `slides-mid`, `slides-min`, and `peek`, creates pagination dots, supports previous/next buttons, scroll snapping, touch/trackpad scrolling, and mouse-wheel horizontal scrolling.
- Mouse-wheel scrolling works over the swiper cards themselves and moves between cards/slides without showing an internal scrollbar.
- Swiper arrows use the same local NDS arrow mask used by header and hero arrows, with transparent icon-only styling and no visible boxed background.
- Swiper, tabs, project filters, admin tabs, and header navigation hide their internal scrollbars while keeping scrolling functional.
- Mixed Arabic/English content inside pasted HTML, NDS cards, swiper card titles/descriptions, tab panels, and accordion bodies uses `unicode-bidi: plaintext`, `text-align: start`, and automatic `dir="auto"` assignment for common text blocks so English paragraphs keep the correct text direction inside the RTL site.
- `js/nds-local-components.js` now observes dynamically inserted `.nds-tabs`, `.nds-accordion`, and `.nds-swiper` components and refreshes all three.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Admin Arrow Consistency Update

- Admin accordion arrows, contact/social arrows, custom dropmenu arrows, native select arrows, and the legacy nav caret now use the same local NDS arrow mask instead of mixed hand-drawn borders.
- The shared accordion compatibility style also uses the same arrow mask, so future pasted accordion snippets match the admin and header arrow identity.
- Expanded/open states rotate the same icon rather than switching to a visually different arrow shape.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Admin UX Cleanup Update

- The page `نوع المحتوى` control in Admin > الصفحات now uses the same local NDS-style dropmenu pattern used by the contact/social platform selector.
- Page content mode options show compact TXT/HTML badges instead of a plain browser select, keeping the editor closer to the NDS visual identity.
- Project, page, and hero-slide editor items use a more focused template-card treatment: clear header, NDS arrow, collapsible behavior where applicable, and icon-only delete action.
- This keeps repeated admin templates visually closer to the contact/social cards and reduces distraction when many items are added.
- Closed admin cards now fully hide their inner text and padding so no field labels leak through collapsed cards.
- Admin dashboard cards use a unified light-gray card treatment across sidebar, panels, and repeated editor cards.
- Toggling `إظهار الصفحة في التنقل` now saves the visibility change and refreshes the header/footer navigation immediately.
- Removed the inactive `تسمية قائمة الصفحات` field from Admin > التنقل because added pages now render as independent navigation links rather than under a grouped pages menu.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## 2026-05-22 Admin Tabs and Hero Editor Spacing

- Admin section tabs now scroll the page back to the admin workspace when switching between sections, preventing the page from staying below the footer after moving from a tall section to a shorter one such as projects or pages.
- Hero media editor cards now wrap their fields inside the standard admin template body, giving the text boxes proper inner spacing instead of sitting tight against the editor card edge.

QA for this update:

```powershell
node --check js\admin.js
```

## 2026-05-22 Local Card/Grid Snippet Update

- Added local compatibility styling for pasted NDS card-grid snippets that use `nds-grid`, `nds-gap-4`, `nds-card-header`, `nds-card-featured-icon`, `nds-featured-icon`, `nds-card-text`, and `nds-card-meta`.
- Added `nds-gray` tag styling so gray tags render consistently beside existing green/blue tags.
- Added local fallback masks for the HGI icon classes used in the pasted snippet: `hgi-user`, `hgi-briefcase-01`, `hgi-chart-line-data-01`, `hgi-dashboard-square-01`, `hgi-ai-brain-02`, and `hgi-award-01`.
- This keeps the snippet working after deployment without requiring the external HGI icon font.

QA for this update:

```powershell
node --check js\app.js
node --check js\admin.js
node --check js\nds-local-components.js
```

## تحديثات هذه النسخة

- تمت إضافة زر الوضع الليلي/النهاري في رأس الموقع، ويتم حفظ الاختيار في بيانات الموقع المحلية.
- تمت إضافة التاريخ والوقت في رأس الموقع بتوقيت `Asia/Riyadh`.
- أصبح رأس الموقع ثابتا أعلى الصفحة مع الحفاظ على محاذاة المحتوى.
- أصبح الهيرو يدعم أكثر من صورة عبر سلايدر يمكن إدارته من لوحة الإدارة.
- تم نقل نص السيرة الذاتية إلى قسم مستقل أسفل الهيرو حتى لا يتداخل مع صورة الهيرو.
- تم تنظيم الصفحات والمشاريع داخل حاويات أضيق وأكثر ترتيبا.
- الصفحات الإضافية تدعم الآن نوعين من المحتوى: نص عادي أو HTML منسق. عند استخدام HTML، يتم عرضه داخل حاوية منسقة حتى لا تحتاج إلى إعادة تصميم الصفحة كل مرة.
- تم إصلاح قائمة الصفحات الإضافية لتعمل كقائمة منسدلة بأسلوب قريب من NDS.

> ملاحظة: إدخال HTML في الصفحات مخصص للمدير المحلي فقط. قبل النشر الحقيقي مع مستخدمين متعددين، يجب استخدام مصادقة حقيقية وتنقية HTML من الخادم.

## 2026-05-22 Admin Editor List and Ordering Update

- Admin editor cards now load collapsed by default, including hero media, contact/social items, projects, and extra pages.
- The card header remains the control for opening only the item that needs editing.
- Hero media editor cards now include a drag handle for changing the slider order.
- Extra page editor cards now include a drag handle for changing the navigation order.
- Drag/drop saves the new order to `localStorage` immediately and refreshes shared public shell data.
- New hero media is inserted at the top of the hero editor list instead of the bottom.
- New extra pages are inserted at the top of the page editor list instead of the bottom.
- Newly inserted hero/page cards open immediately because they are the active item to edit; existing cards remain collapsed.

QA for this update:

```powershell
node --check js\default-data.js
node --check js\store.js
node --check js\app.js
node --check js\admin.js
```
