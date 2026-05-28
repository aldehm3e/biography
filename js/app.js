(function () {
  "use strict";

  var HERO_SLIDE_DURATION = 8500;
  var SITE_DATA_KEY = "websiteDemo:siteData";
  var LEGACY_NOTIFICATIONS_KEY = "websiteDemo:notifications";
  var NOTIFICATION_STATE_KEY = "websiteDemo:notificationState";
  var NOTIFICATIONS_KEEP_OPEN_KEY = "websiteDemo:notificationsKeepOpen";
  var NOTIFICATION_READ_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;
  var AUTH_LOADING_MIN_MS = 1200;
  var notificationSaveQueue = Promise.resolve();

  var appState = {
    data: null,
    projectFilter: "all",
    heroIndex: 0,
    heroTimer: null,
    clockTimer: null
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, Math.max(0, ms || 0));
    });
  }

  function setText(selector, value, root) {
    qsa(selector, root).forEach(function (element) {
      element.textContent = value || "";
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function hasText(value) {
    return Boolean(String(value || "").trim());
  }

  function asArray(items) {
    if (Array.isArray(items)) return items;
    if (items && typeof items === "object") {
      return Object.keys(items).map(function (key) { return items[key]; });
    }
    return [];
  }

  function visibleItems(items) {
    return asArray(items).filter(function (item) { return item && item.visible !== false; });
  }

  function visibleHeroSlides(home) {
    var slides = visibleItems(home.heroSlides || []).filter(function (slide) {
      return hasText(slide.image) || hasText(slide.mobileImage) || hasText(slide.video) || hasText(slide.mobileVideo);
    });
    if (!slides.length && (hasText(home.heroImage) || hasText(home.heroVideo))) {
      slides.push({
        title: home.heroTitle || "",
        subtitle: home.heroSubtitle || "",
        intro: home.heroIntro || "",
        image: home.heroImage || "",
        video: home.heroVideo || "",
        alt: home.heroTitle || home.ownerName || ""
      });
    }
    return slides;
  }

  function hasHomeHeroContent(home) {
    return visibleHeroSlides(home).length > 0;
  }

  function hasHomeBodyContent(home) {
    return [home.ownerName, home.title, home.intro, home.avatar, home.biography].some(hasText)
      || visibleItems(home.experience || []).length
      || visibleItems(home.achievements || []).length
      || visibleItems(home.skills || []).length;
  }

  function hasHomeContent(home) {
    return hasHomeHeroContent(home) || hasHomeBodyContent(home);
  }

  function applyDocumentSettings(data) {
    document.documentElement.lang = data.settings.language || "ar";
    document.documentElement.dir = data.settings.direction || "rtl";
    if (!document.documentElement.classList.contains("theme-transitioning")) {
      applyTheme(data.settings.theme || localStorage.getItem("websiteDemo:theme") || "light", false);
    }
  }

  function siteTitle(data) {
    data = data || {};
    data.settings = data.settings || {};
    data.home = data.home || {};
    return data.settings.siteName || data.home.ownerName || document.title || "Biography";
  }

  function readCachedSiteData() {
    try {
      var raw = localStorage.getItem(SITE_DATA_KEY);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === "object" ? data : null;
    } catch (error) {
      return null;
    }
  }

  function fallbackNavigationLabel(key, fallback) {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.navigation;
    return (defaults && defaults[key]) || fallback;
  }

  function navigationLabel(data, key, fallback) {
    data = data || {};
    data.navigation = data.navigation || {};
    return data.navigation[key] || fallbackNavigationLabel(key, fallback);
  }

  function uiText(data, key, fallback) {
    data = data || appState.data || {};
    data.texts = data.texts || {};
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.texts;
    return data.texts[key] || (defaults && defaults[key]) || fallback || "";
  }

  function brandTitle(data) {
    data = data || {};
    data.settings = data.settings || {};
    return data.settings.brandName || siteTitle(data);
  }

  function imageMimeForPath(path) {
    var normalized = String(path || "").split("?")[0].split("#")[0].toLowerCase();
    if (normalized.endsWith(".png")) return "image/png";
    if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
    if (normalized.endsWith(".webp")) return "image/webp";
    if (normalized.endsWith(".ico")) return "image/x-icon";
    return "image/svg+xml";
  }

  function updateDocumentTitle(data, detailTitle) {
    var baseTitle = brandTitle(data);
    var page = document.body ? document.body.dataset.page : "home";
    var title = detailTitle || baseTitle;
    if (!detailTitle) {
      if (page === "projects") title = navigationLabel(data, "projectsLabel", "مشاريعنا") + " | " + baseTitle;
      if (page === "pages") title = navigationLabel(data, "pagesLabel", "الصفحات") + " | " + baseTitle;
      if (page === "admin") title = navigationLabel(data, "adminLabel", "الإدارة") + " | " + baseTitle;
      if (page === "notifications") title = uiText(data, "notificationsLabel", "الإشعارات") + " | " + baseTitle;
    } else if (detailTitle !== baseTitle) {
      title = detailTitle + " | " + baseTitle;
    }
    document.title = title;
  }

  function applyShellText(data) {
    data = data || {};
    data.settings = data.settings || {};
    data.home = data.home || {};
    data.navigation = data.navigation || {};
    var title = brandTitle(data);
    setText("[data-site-title]", title);
    setText(".nds-brand-slogan", data.settings.brandSlogan || "");
    setText("[data-current-year]", String(new Date().getFullYear()));
    setText("[data-home-page-label]", navigationLabel(data, "homeLabel", "الرئيسية"));
    setText("[data-projects-page-label]", navigationLabel(data, "projectsLabel", "مشاريعنا"));
    setText("[data-pages-page-label]", navigationLabel(data, "pagesLabel", "الصفحات"));
    setText("[data-admin-page-label]", navigationLabel(data, "adminLabel", "الإدارة"));
    setText("[data-shell-topbar-text]", data.settings.shellTopbarText || "موقع شخصي قابل للإدارة عبر نظام محتوى محلي.");
    setText("[data-shell-topbar-short-text]", data.settings.shellTopbarShortText || "موقع شخصي قابل للإدارة.");
    setText("[data-shell-verify-label]", data.settings.shellVerifyLabel || "كيف تتحقق؟");
    setText("[data-shell-verify-title]", data.settings.shellVerifyTitle || "تحقق من رابط الموقع قبل إدخال أي بيانات.");
    setText("[data-shell-verify-description]", data.settings.shellVerifyDescription || "استخدم الرابط الرسمي الذي يقدمه مالك الموقع، وتجنب الروابط المختصرة أو غير المعروفة.");
    setText("[data-shell-security-title]", data.settings.shellSecurityTitle || "الاتصال الآمن يستخدم بروتوكول HTTPS.");
    setText("[data-shell-security-description]", data.settings.shellSecurityDescription || "تأكد من ظهور القفل في المتصفح عند استخدام نسخة منشورة على الاستضافة.");
    setText("[data-shell-notice-text]", data.settings.shellNoticeText || "هذا موقع شخصي مستقل وغير تابع لأي جهة حكومية.");
    var brandLogo = data.settings.brandLogo || "assets/vendor/nds/images/palm_swords.svg";
    var siteIcon = data.settings.siteIcon || data.settings.brandLogo || "assets/images/site-mark.svg";
    qsa(".brand-logo").forEach(function (image) {
      image.src = brandLogo;
    });
    qsa("[data-site-mark]").forEach(function (image) {
      image.src = siteIcon;
    });
    qsa("link[rel~='icon'], [data-site-favicon]").forEach(function (link) {
      link.href = siteIcon;
      link.type = imageMimeForPath(siteIcon);
    });
    updateDocumentTitle(data);
  }

  function setInputPlaceholder(selector, value) {
    qsa(selector).forEach(function (input) {
      input.placeholder = value || "";
    });
  }

  function applyInterfaceTexts(data) {
    var pairs = [
      ["[data-home-empty] .nds-card-title", "homeEmptyTitle", "لم تتم إضافة محتوى بعد"],
      ["[data-home-empty] .nds-card-description", "homeEmptyDescription", "يمكنك إضافة المحتوى من لوحة الإدارة."],
      ["[data-home-empty] .nds-btn .nds-label", "homeEmptyButton", "فتح لوحة الإدارة"],
      ["[data-admin-home-panel-title]", "adminHomePanelTitle", "محتوى الصفحة الرئيسية"],
      ["[data-admin-home-panel-description]", "adminHomePanelDescription", "كل الحقول اختيارية، ولن يظهر المحتوى العام إلا بعد حفظ بياناتك."],
      ["[data-admin-home-save-button]", "adminHomeSaveButton", "حفظ الرئيسية"],
      [".biography-section .nds-section-subtitle", "biographySubtitle", "السيرة الذاتية"],
      [".biography-section .nds-section-title", "biographyTitle", "نبذة مختصرة"],
      [".professional-section .nds-section-subtitle", "professionalSubtitle", "المحتوى المهني"],
      [".professional-section .nds-section-title", "professionalTitle", "الخبرات والإنجازات"],
      [".professional-section .content-grid > div:first-child .section-minor-title", "experienceHeading", "الخبرات"],
      [".professional-section .content-grid > div:nth-child(2) .section-minor-title", "achievementsHeading", "الإنجازات"],
      ["[data-skills-section] .nds-section-subtitle", "skillsSubtitle", "المهارات"],
      ["[data-skills-section] .nds-section-title", "skillsTitle", "مجالات الخبرة"],
      [".nds-footer-content .nds-footer-column:first-child .nds-footer-heading", "footerLinksHeading", "روابط سريعة"],
      [".nds-footer-icons .nds-footer-heading", "footerSocialHeading", "وسائل التواصل"],
      ["[data-footer-social-empty]", "footerSocialEmpty", "لم تتم إضافة وسائل تواصل بعد"],
      ["body[data-page='projects'] .nds-hero-section .nds-section-description", "projectsDescription", "تظهر المشاريع هنا بعد إضافتها من لوحة الإدارة، وتبقى منظمة حتى عند زيادة العدد."],
      ["[data-projects-empty] .nds-card-title", "projectsEmptyTitle", "لم تتم إضافة مشاريع بعد"],
      ["[data-projects-empty] .nds-card-description", "projectsEmptyDescription", "يمكنك إضافة المشاريع من لوحة الإدارة."],
      ["[data-projects-empty] .nds-btn .nds-label", "projectsEmptyButton", "إضافة مشروع"],
      ["[data-projects-content] .nds-section-subtitle", "projectsListSubtitle", "قائمة المشاريع"],
      ["[data-projects-content] .nds-section-title", "projectsListTitle", "الأعمال المضافة"],
      ["body[data-page='pages'] .nds-hero-section .nds-section-description", "pagesDescription", "كل صفحة تضيفها من لوحة الإدارة تظهر هنا كبطاقة مستقلة ومنظمة."],
      ["[data-pages-empty] .nds-card-title", "pagesEmptyTitle", "لم تتم إضافة صفحات بعد"],
      ["[data-pages-empty] .nds-card-description", "pagesEmptyDescription", "يمكنك إضافة الصفحات من لوحة الإدارة."],
      ["[data-pages-empty] .nds-btn .nds-label", "pagesEmptyButton", "إضافة صفحة"],
      ["[data-pages-content] .nds-section-subtitle", "pagesListSubtitle", "قائمة الصفحات"],
      ["[data-pages-content] .nds-section-title", "pagesListTitle", "الصفحات المضافة"],
      ["[data-notifications-page-label]", "notificationsLabel", "الإشعارات"],
      ["body[data-page='notifications'] .nds-hero-section .nds-section-description", "notificationsDescription", "كل التحديثات التي تمت من لوحة الإدارة تظهر هنا."],
      ["[data-notifications-empty] .nds-card-title", "notificationsEmptyTitle", "لا توجد إشعارات بعد"],
      ["[data-notifications-empty] .nds-card-description", "notificationsEmptyDescription", "ستظهر هنا تحديثات الصفحة الرئيسية والمشاريع والصفحات بعد حفظها من لوحة الإدارة."]
    ];
    pairs.forEach(function (item) {
      setText(item[0], uiText(data, item[1], item[2]));
    });
    qsa("[data-ui-text]").forEach(function (element) {
      var key = element.dataset.uiText;
      if (key) element.textContent = uiText(data, key, element.dataset.uiTextFallback || element.textContent);
    });
    setInputPlaceholder(".site-search-input, .site-search-box .nds-search-input", uiText(data, "searchPlaceholder", "البحث في الموقع..."));
    setText(".site-header-search .nds-search-btn .nds-label, .site-search-dropdown > .nds-nav-link .nds-label, .site-search-dropdown .nds-search-btn .nds-label", uiText(data, "searchLabel", "بحث"));
    qsa(".site-header-search .nds-search-btn, .site-search-dropdown .nds-search-btn, .site-search-dropdown > .nds-nav-link").forEach(function (button) {
      var label = uiText(data, "searchLabel", "بحث");
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
  }

  function renderShared(data) {
    applyDocumentSettings(data);
    applyShellText(data);
    applyInterfaceTexts(data);
    renderAccountMenu(data);
    renderNavigation(data);
    renderNotifications();
    try {
      renderFooter(data);
    } catch (error) {
      console.error("Footer render failed", error);
    }
    updateClock();
  }

  function oldRenderAdminPersona(data) {
    var config = window.ADMIN_AUTH_CONFIG || {};
    var name = data.home.ownerName || siteTitle(data);
    var role = data.home.title || "Administrator";
    var email = config.email || "";
    var isAuthenticated = isAdminAuthenticated();
    setText("[data-admin-persona-name]", name);
    setText("[data-admin-persona-role]", role);
    setText("[data-admin-persona-desc]", email);
    setText("[data-admin-trigger-label]", isAuthenticated ? name : (data.navigation.adminLabel || "الإدارة"));
    var avatarSrc = ownerAvatarSrc(data);
    qsa("[data-admin-trigger-avatar]").forEach(function (image) {
      if (isAuthenticated && hasText(avatarSrc)) {
        image.src = avatarSrc;
        image.hidden = false;
      } else {
        image.removeAttribute("src");
        image.hidden = true;
      }
    });
    qsa("[data-admin-trigger-icon]").forEach(function (icon) {
      icon.hidden = isAuthenticated && hasText(avatarSrc);
    });
  }

  function currentAuthConfig() {
    var user = window.SiteStore && window.SiteStore.currentUser ? window.SiteStore.currentUser() : null;
    return {
      email: user && user.email ? user.email : "",
      phone: user && user.phone ? user.phone : ""
    };
  }

  function accountDisplayName(data) {
    return data.home.ownerName || siteTitle(data) || "Administrator";
  }

  function accountInitials(name) {
    var parts = String(name || "A").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join("") || "A";
  }

  function ownerAvatarSrc(data) {
    return data && data.home && hasText(data.home.avatar) ? data.home.avatar : "";
  }

  function personaAvatarMarkup(data, name, compact) {
    var avatarSrc = ownerAvatarSrc(data);
    if (hasText(avatarSrc)) {
      return '<span class="nds-avatar ' + (compact ? "nds-sm" : "nds-md") + ' admin-trigger-avatar" aria-hidden="true"><img src="' + escapeHtml(avatarSrc) + '" alt=""></span>';
    }
    return '<span class="nds-avatar ' + (compact ? "nds-sm" : "nds-md") + ' admin-trigger-avatar" aria-hidden="true"><i class="nds-icon nds-icon-avatar nav-admin-icon" aria-hidden="true"></i></span>';
  }

  function accountActionsMarkup(label) {
    var portalLabel = escapeHtml(label || "الإدارة");
    return [
      '<a href="admin.html" class="nds-btn nds-subtle nds-dropdown-item" data-account-action="portal">',
      '<i class="nds-icon nds-hgi-identity-card" aria-hidden="true"></i>',
      '<span class="nds-label">' + portalLabel + '</span>',
      '</a>',
      '<button type="button" class="nds-btn nds-subtle nds-dropdown-item" data-account-action="password">',
      '<i class="nds-icon nds-hgi-lock-password" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "changePasswordLabel", "تغيير كلمة المرور")) + '</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-dropdown-item" data-account-action="email">',
      '<i class="nds-icon nds-hgi-mail-01" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "changeEmailLabel", "تغيير البريد الإلكتروني")) + '</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-dropdown-item" data-account-action="phone">',
      '<i class="nds-icon nds-hgi-smart-phone-01" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "changePhoneLabel", "تغيير رقم الجوال")) + '</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-destructive nds-dropdown-item" data-account-action="logout" data-admin-persona-logout>',
      '<i class="nds-icon nds-hgi-door-01" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "logoutLabel", "تسجيل الخروج")) + '</span>',
      '</button>'
    ].join("");
  }

  function renderAccountMenu(data) {
    renderDesktopAccountMenu(data);
    renderMobileAccountMenu(data);
    updateHeaderActions(data);
    if (document.body && document.body.dataset.authLogoutLoading === "true") {
      setLogoutLoading(null, true);
    }
  }

  function renderDesktopAccountMenu(data) {
    var item = qs(".admin-persona-dropdown");
    if (!item) return;
    var config = currentAuthConfig();
    var isAuthenticated = isAdminAuthenticated();
    var name = accountDisplayName(data);
    var role = data.home.title || "Administrator";
    var portalLabel = uiText(data, "adminPortalLabel", "الإدارة");
    item.className = "nds-nav-item nds-dropdown admin-persona-dropdown account-menu-item";
    item.dataset.accountMenu = "desktop";

    if (!isAuthenticated) {
      item.innerHTML = [
        '<button class="nds-nav-link nds-btn nds-subtle account-login-trigger" type="button" data-login-trigger aria-label="' + escapeHtml(uiText(data, "loginLabel", "تسجيل الدخول")) + '" title="' + escapeHtml(uiText(data, "loginLabel", "تسجيل الدخول")) + '">',
        '<i class="nds-icon nds-icon-avatar" aria-hidden="true"></i>',
        '<span class="nds-label">' + escapeHtml(uiText(data, "loginLabel", "تسجيل الدخول")) + '</span>',
        '</button>'
      ].join("");
      return;
    }

    item.innerHTML = [
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator header-admin-link account-persona-trigger" type="button" aria-haspopup="true" aria-expanded="false">',
      personaAvatarMarkup(data, name, true),
      '</button>',
      '<div class="nds-dropdown-menu nds-fit">',
      '<div class="nds-dropdown-content">',
      '<div class="nds-column">',
      '<div class="nds-persona nds-sm">',
      '<div class="nds-persona-info">',
      '<span class="nds-persona-name">' + escapeHtml(name) + '</span>',
      '<span class="nds-persona-role nds-truncate">' + escapeHtml(role) + '</span>',
      '<span class="nds-persona-desc">' + escapeHtml(config.email) + '</span>',
      '</div>',
      '<hr class="nds-divider">',
      '<div class="nds-persona-action">',
      accountActionsMarkup(portalLabel),
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function renderMobileAccountMenu(data) {
    var actions = qs(".header-actions");
    if (!actions) return;
    var section = qs("[data-mobile-account-section]", actions);
    if (section) section.remove();
  }

  function updateHeaderActions(data) {
    var minimal = qs(".nds-nav-minimal");
    if (!minimal) return;
    var toggler = qs(".nds-mainNav-toggler", minimal);
    dedupeHeaderActions();
    Array.prototype.slice.call(minimal.children).forEach(function (item) {
      if (item === toggler || item.dataset.mobileAdminShortcut || item.dataset.mobileThemeShortcut || item.dataset.mobileNotificationsRoot) return;
      if (item.classList && (item.classList.contains("site-search-dropdown") || item.classList.contains("nds-search"))) return;
      item.remove();
    });
    qsa("[data-mobile-header-date]", minimal).forEach(function (item) { item.remove(); });
    var adminItem = qs("[data-mobile-admin-shortcut]", minimal);
    if (!adminItem) {
      adminItem = document.createElement("li");
      adminItem.dataset.mobileAdminShortcut = "true";
      if (toggler) {
        minimal.insertBefore(adminItem, toggler);
      } else {
        minimal.append(adminItem);
      }
    }
    var portalLabel = uiText(data, "adminPortalLabel", "الإدارة");
    var isAuthenticated = isAdminAuthenticated();
    var accountName = accountDisplayName(data);
    var accountRole = data && data.home ? data.home.title || "Administrator" : "Administrator";
    var accountConfig = currentAuthConfig();
    if (!isAuthenticated) portalLabel = uiText(data, "loginLabel", "تسجيل الدخول");
    adminItem.className = isAuthenticated ? "nds-nav-item nds-dropdown mobile-admin-shortcut mobile-account-dropdown" : "nds-nav-item mobile-admin-shortcut";
    if (toggler) minimal.insertBefore(adminItem, toggler);
    adminItem.innerHTML = isAuthenticated ? [
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator account-persona-trigger mobile-account-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="' + escapeHtml(portalLabel) + '" title="' + escapeHtml(portalLabel) + '">',
      personaAvatarMarkup(data, accountName, true),
      '<span class="nds-label">' + escapeHtml(portalLabel) + '</span>',
      '</button>',
      '<div class="nds-dropdown-menu nds-fit">',
      '<div class="nds-dropdown-content">',
      '<div class="nds-column">',
      '<div class="nds-persona nds-sm mobile-account-persona">',
      '<div class="nds-persona-info">',
      '<span class="nds-persona-name">' + escapeHtml(accountName) + '</span>',
      '<span class="nds-persona-role nds-truncate">' + escapeHtml(accountRole) + '</span>',
      '<span class="nds-persona-desc">' + escapeHtml(accountConfig.email) + '</span>',
      '</div>',
      '<hr class="nds-divider">',
      '<div class="nds-persona-action mobile-account-actions mobile-header-account-actions">',
      accountActionsMarkup(portalLabel),
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join("") : [
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator" type="button" data-login-trigger aria-label="' + escapeHtml(portalLabel) + '" title="' + escapeHtml(portalLabel) + '">',
      '<i class="nds-icon nds-icon-avatar" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(portalLabel) + '</span>',
      '</button>'
    ].join("");

    var themeItem = qs("[data-mobile-theme-shortcut]", minimal);
    if (!themeItem) {
      themeItem = document.createElement("li");
      themeItem.dataset.mobileThemeShortcut = "true";
      if (toggler) {
        minimal.insertBefore(themeItem, toggler);
      } else {
        minimal.append(themeItem);
      }
    }
    themeItem.className = "nds-nav-item mobile-theme-shortcut";
    if (toggler) minimal.insertBefore(themeItem, toggler);
    themeItem.innerHTML = [
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator theme-toggle" type="button" data-theme-toggle>',
      '<i class="nds-icon nds-hgi-moon-02" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(data, "themeToggleLabel", "تبديل الوضع الليلي")) + '</span>',
      '</button>'
    ].join("");

    var notificationItem = qs("[data-mobile-notifications-root]", minimal);
    if (!notificationItem) {
      notificationItem = document.createElement("li");
      notificationItem.dataset.mobileNotificationsRoot = "true";
      if (toggler) {
        minimal.insertBefore(notificationItem, toggler);
      } else {
        minimal.append(notificationItem);
      }
    }
    notificationItem.className = "nds-nav-item nds-dropdown nds-icon-only notification-dropdown mobile-notifications-shortcut";
    if (toggler) minimal.insertBefore(notificationItem, toggler);
    var items = loadNotifications();
    var unreadCount = items.filter(function (item) { return !item.read; }).length;
    var isOpen = (notificationItem.dataset.state || "").indexOf("open") !== -1;
    notificationItem.innerHTML = [
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator notification-trigger" type="button" title="' + escapeHtml(uiText(data, "notificationsLabel", "الإشعارات")) + '" data-state="' + (isOpen ? "active" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" data-notifications-trigger>',
      '<i class="nds-icon nds-hgi-notification-02 nav-notification-icon" aria-hidden="true">' + (unreadCount ? '<span class="nds-badge">' + Math.min(unreadCount, 99) + '</span>' : '') + '</i>',
      '<span class="nds-label">' + escapeHtml(uiText(data, "notificationsLabel", "الإشعارات")) + '</span>',
      '</button>',
      notificationsDropdownMarkup(items, "40vw")
    ].join("");
    refreshNotificationComponents(notificationItem);
    updateHeaderDateTime();
    updateThemeIcon(document.documentElement.dataset.theme || localStorage.getItem("websiteDemo:theme") || "light");
  }

  function dedupeHeaderActions() {
    qsa(".site-header [data-pab-ph]").forEach(function (item) { item.remove(); });
    qsa(".site-header .nds-PAB").forEach(function (item) { item.classList.remove("nds-PAB"); });
    [
      "[data-mobile-admin-shortcut]",
      "[data-mobile-theme-shortcut]",
      "[data-mobile-notifications-root]",
      "[data-notifications-root]",
      ".admin-persona-dropdown"
    ].forEach(function (selector) {
      var seen = false;
      qsa(selector).forEach(function (item) {
        if (!seen) {
          seen = true;
          return;
        }
        item.remove();
      });
    });
  }

  function renderAdminPersona(data) {
    renderAccountMenu(data);
  }

  function revealHeaderShell() {
    var navPanel = qs("[data-nav-panel]");
    if (!navPanel || window.matchMedia("(max-width: 960px)").matches) return;
    navPanel.hidden = false;
    updateHeaderNavScrollState(qs("[data-nav-list]", navPanel));
    window.setTimeout(function () {
      updateHeaderNavScrollState(qs("[data-nav-list]", navPanel));
    }, 120);
  }

  function baseNavigationItems(data) {
    return [
      { label: data.navigation.homeLabel || "الرئيسية", href: "index.html", key: "home" },
      { label: data.navigation.projectsLabel && data.navigation.projectsLabel !== "المشاريع" ? data.navigation.projectsLabel : "مشاريعنا", href: "projects.html", key: "projects" }
    ];
  }

  function pageNavigationItems(data) {
    return publicPageItems(data).filter(function (item) {
      return item.showInNavigation !== false;
    }).map(function (item) {
      return {
        label: item.title || item.slug,
        href: "index.html#/page/" + encodeURIComponent(item.slug),
        key: "page:" + item.slug
      };
    });
  }

  function publicPageItems(data) {
    return visibleItems((data && data.pages) || []).filter(function (item) {
      return hasText(item.title || item.slug);
    });
  }

  function routablePageItems(data) {
    return ((data && data.pages) || []).filter(function (item) {
      return item && (item.visible !== false || item.showInFooter === true) && hasText(item.title || item.slug);
    });
  }

  function footerPageItems(data) {
    return ((data && data.pages) || []).filter(function (item) {
      return item && item.showInFooter === true && hasText(item.title || item.slug);
    }).map(function (item) {
      return {
        label: item.title || item.slug,
        href: "index.html#/page/" + encodeURIComponent(item.slug),
        key: "footer-page:" + item.slug
      };
    });
  }

  function allNavigationItems(data) {
    return baseNavigationItems(data)
      .concat(pageNavigationItems(data));
  }

  function isCurrentNav(item, page, currentSlug) {
    return (page === item.key)
      || (page === "home" && item.key === "home" && !currentSlug)
      || (page === "projects" && item.key === "projects")
      || (page === "pages" && item.key === "pages")
      || (page === "admin" && item.key === "admin")
      || (currentSlug && item.key === "page:" + currentSlug);
  }

  function createNavLink(item, page, currentSlug) {
    var link = el("a", "nds-nav-link nds-btn nds-subtle nds-indicator");
    link.href = item.href;
    link.dataset.navKey = item.key;
    if (isCurrentNav(item, page, currentSlug)) link.dataset.state = "current";
    if (item.key === "admin") {
      link.className += " nds-icon-only nav-admin-link";
      link.title = item.label;
      link.setAttribute("aria-label", item.label);
      link.append(adminNavIcon());
      link.append(el("span", "nds-label nav-icon-label", item.label));
    } else {
      link.append(el("span", "nds-label", item.label));
    }
    return link;
  }

  function renderNavigation(data) {
    var list = qs("[data-nav-list]");
    if (!list) return;

    var page = document.body.dataset.page || "home";
    var currentSlug = getPageSlug();
    var baseItems = baseNavigationItems(data);

    list.innerHTML = "";

    baseItems.forEach(function (item) {
      var li = el("li", "nds-nav-item");
      li.append(createNavLink(item, page, currentSlug));
      list.append(li);
    });

    pageNavigationItems(data).forEach(function (item) {
      var li = el("li", "nds-nav-item");
      li.append(createNavLink(item, page, currentSlug));
      list.append(li);
    });

    setupHeaderNavScroller(list);
  }

  function navScrollButton(direction) {
    var button = el("button", "nds-btn nds-secondary-outline nds-icon-only nav-scroll-btn nav-scroll-" + direction);
    button.type = "button";
    button.dataset.navScroll = direction;
    button.setAttribute("aria-label", direction === "next" ? "تمرير التنقل للأمام" : "تمرير التنقل للخلف");
    var icon = document.createElement("i");
    icon.className = "nds-icon " + (direction === "next" ? "nds-hgi-arrow-left-01" : "nds-hgi-arrow-right-01");
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    return button;
  }

  function setupHeaderNavScroller(list) {
    var panel = list.closest("[data-nav-panel]");
    if (!panel) return;
    if (panel.dataset.navScroller === "ready") {
      updateHeaderNavScrollState(list);
      return;
    }
    var content = list.closest(".nds-collapse-content") || panel;
    panel.dataset.navScroller = "ready";
    content.insertBefore(navScrollButton("prev"), list);
    var showMore = qs(".nds-show-more", content);
    content.insertBefore(navScrollButton("next"), showMore || null);
    list.addEventListener("scroll", function () {
      updateHeaderNavScrollState(list);
    }, { passive: true });
    window.addEventListener("resize", function () {
      updateHeaderNavScrollState(list);
    }, { passive: true });
    updateHeaderNavScrollState(list);
  }

  function updateHeaderNavScrollState(list) {
    if (!list) return;
    var panel = list.closest("[data-nav-panel]");
    if (!panel) return;
    var prev = qs("[data-nav-scroll='prev']", panel);
    var next = qs("[data-nav-scroll='next'].nav-scroll-next", panel);
    if (!prev || !next) return;

    if (window.matchMedia("(max-width: 960px)").matches) {
      prev.hidden = true;
      next.hidden = true;
      updateMobileNavScrollControl(list);
      return;
    }

    var maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    var position = Math.min(maxScroll, Math.abs(list.scrollLeft));
    var hasOverflow = maxScroll > 8;
    var atStart = position <= 8;
    var atEnd = position >= maxScroll - 8;

    prev.hidden = !hasOverflow;
    next.hidden = !hasOverflow;
    prev.disabled = !hasOverflow || atStart;
    next.disabled = !hasOverflow || atEnd;
    list.dataset.state = [
      hasOverflow ? "has-more" : "",
      atStart ? "at-start" : "",
      atEnd && hasOverflow ? "at-end" : ""
    ].filter(Boolean).join(" ");
  }

  function renderFooter(data) {
    renderFooterContent(data);
    renderFooterBottom(data);
  }

  function normalizeFooterLinkUrl(url) {
    var value = String(url || "").trim();
    if (!value || /^(javascript|data):/i.test(value)) return "#";
    if (/^(https?:|mailto:|tel:|sms:|#|\/|\.\/|\.\.\/)/i.test(value)) return value;
    if (/^www\./i.test(value)) return "https://" + value;
    if (/^(?!.*\s)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(value) && !/\.(html?|php|aspx?|jsp)(?:[?#]|$)/i.test(value)) {
      return "https://" + value;
    }
    return value;
  }

  function normalizeFooterLink(item) {
    item = item || {};
    return {
      label: item.label || item.title || item.name || "",
      href: item.href || item.url || "",
      iconType: item.iconType || "",
      iconPath: item.iconPath || "",
      visible: item.visible
    };
  }

  function footerLegacyLinks(data) {
    var customLinks = visibleItems((data.home && data.home.footerLinks) || []).filter(function (item) {
      return hasText(item.label) && hasText(item.url);
    }).map(function (item) {
      return {
        label: item.label,
        href: item.url
      };
    });
    return customLinks;
  }

  function uniqueFooterLinks(links, allowLabelOnly) {
    var seen = {};
    return (links || []).map(normalizeFooterLink).filter(function (item) {
      return item.visible !== false && hasText(item.label) && (allowLabelOnly || hasText(item.href));
    }).filter(function (item) {
      var href = normalizeFooterLinkUrl(item.href);
      var key = (hasText(item.href) ? href : "__text__") + "|" + item.label;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function footerColumns(data) {
    var footer = data.footer || {};
    var columns = [];
    var legacyLinks = uniqueFooterLinks(footerLegacyLinks(data));

    if (legacyLinks.length) {
      columns.push({
        title: uiText(data, "footerLinksHeading", "روابط سريعة"),
        links: legacyLinks
      });
    }

    visibleItems(footer.columns || []).slice(0, 3).forEach(function (column) {
      var links = uniqueFooterLinks(column.links || [], true);
      if (!hasText(column.title) || !links.length) return;
      columns.push({
        title: column.title,
        links: links
      });
    });

    return columns;
  }

  function footerIconGroups(data) {
    var footer = data.footer || {};
    var groups = [];

    visibleItems(footer.iconGroups || []).slice(0, 2).forEach(function (group) {
      var links = footerIconGroupLinks(group.links || [], group.title);
      if (!hasText(group.title) || !links.length) return;
      if (isFooterMobileAppGroup(group)) {
        links = links.map(function (link, index) {
          var appLink = Object.assign({}, link);
          appLink.iconType = footerAppGroupIconType(appLink, index);
          return appLink;
        });
      } else {
        links = links.map(function (link) {
          var socialLink = Object.assign({}, link);
          socialLink.iconType = footerNonAppIconType(socialLink);
          return socialLink;
        });
      }
      groups.push({
        title: group.title,
        links: links
      });
    });

    return groups;
  }

  function footerIconGroupLinks(links, groupTitle) {
    var seen = {};
    return (links || []).map(normalizeFooterLink).filter(function (item) {
      return item.visible !== false
        && (hasText(item.label) || hasText(item.iconType) || hasText(item.iconPath));
    }).map(function (item) {
      if (!hasText(item.href)) item.href = "#";
      if (!hasText(item.label)) {
        item.label = footerIconLabel(item.iconType) || groupTitle || "رابط";
      }
      return item;
    }).filter(function (item) {
      var href = normalizeFooterLinkUrl(item.href);
      var key = href + "|" + item.label + "|" + item.iconType + "|" + item.iconPath;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function applyFooterLinkTarget(link, href) {
    if (/^https?:\/\//i.test(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.classList.add("nds-external");
    }
  }

  function createFooterTextLink(item) {
    if (!hasText(item.href)) {
      var text = el("span", "nds-footer-link");
      if (item.iconPath || item.iconType) text.append(footerIconElement(item));
      text.append(el("span", "nds-label", item.label));
      return text;
    }
    var link = el("a", "nds-link nds-footer-link");
    var href = normalizeContactUrl(normalizeFooterLinkUrl(item.href), item.iconType);
    link.href = href;
    applyFooterLinkTarget(link, href);
    if (item.iconPath || item.iconType) link.append(footerIconElement(item));
    link.append(el("span", "nds-label", item.label));
    return link;
  }

  function createFooterColumn(column) {
    var wrapper = el("div", "nds-footer-column");
    var heading = el("h3", "nds-footer-heading", column.title);
    var list = el("ul", "nds-footer-list");
    wrapper.append(heading);
    column.links.forEach(function (item) {
      var li = el("li");
      li.append(createFooterTextLink(item));
      list.append(li);
    });
    wrapper.append(list);
    return wrapper;
  }

  function isFooterAppIcon(type) {
    return ["appstore", "android", "googleplay", "huawei"].indexOf(String(type || "").toLowerCase()) !== -1;
  }

  function isFooterMobileAppGroup(group) {
    var title = String(group && group.title || "");
    return /\bmobile\b|\bapps?\b|app\s*store|google\s*play/i.test(title)
      || title.indexOf("\u062a\u0637\u0628\u064a\u0642") !== -1
      || title.indexOf("\u0627\u0644\u062c\u0648\u0627\u0644") !== -1;
  }

  function footerAppGroupIconType(link, index) {
    var type = String(link && link.iconType || "").toLowerCase();
    var appTypes = ["appstore", "googleplay", "huawei"];
    if (isFooterAppIcon(type)) return type;
    if (!type || type === "website") return appTypes[index] || appTypes[appTypes.length - 1];
    return type;
  }

  function inferFooterIconType(item) {
    var text = [
      item && (item.label || item.title || item.name),
      item && (item.href || item.url)
    ].filter(Boolean).join(" ").toLowerCase();
    if (/linkedin/.test(text)) return "linkedin";
    if (/facebook|fb\.com/.test(text)) return "facebook";
    if (/instagram/.test(text)) return "instagram";
    if (/youtube|youtu\.be/.test(text)) return "youtube";
    if (/github/.test(text)) return "github";
    if (/(^|\W)x\.com|twitter/.test(text)) return "x";
    if (/mailto:|@/.test(text)) return "email";
    if (/tel:|phone|هاتف|جوال/.test(text)) return "phone";
    if (/maps|map|location|عنوان|موقع/.test(text)) return "location";
    return "";
  }

  function footerNonAppIconType(item) {
    var type = String(item && item.iconType || "").toLowerCase();
    var inferred = inferFooterIconType(item || {});
    if (type === "website" && inferred) return inferred;
    if (type && !isFooterAppIcon(type)) return type;
    return inferred || "website";
  }

  function footerIconLabel(type) {
    var labels = {
      linkedin: "LinkedIn",
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
      github: "GitHub",
      x: "X",
      email: "Email",
      website: "Website",
      phone: "Phone",
      location: "Location",
      appstore: "Apple App Store",
      android: "Google Play",
      googleplay: "Google Play",
      huawei: "Huawei AppGallery"
    };
    return labels[String(type || "").toLowerCase()] || "";
  }

  function footerIconElement(item) {
    if (hasText(item.iconPath)) {
      var image = document.createElement("img");
      image.className = "footer-icon-img";
      image.src = item.iconPath;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      return image;
    }

    if (isFooterAppIcon(item.iconType)) {
      var appIcon = footerAppIcon(item.iconType);
      appIcon.classList.add("contact-icon");
      return appIcon;
    }

    var icon = document.createElement("i");
    icon.className = "contact-icon " + footerIconClass(item.iconType);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function footerIconClass(type) {
    type = String(type || "").toLowerCase();
    var icons = {
      linkedin: "nds-icon nds-hgi-linkedin-02",
      facebook: "nds-icon nds-hgi-facebook-02",
      instagram: "nds-icon nds-hgi-instagram",
      youtube: "nds-icon nds-hgi-youtube",
      github: "nds-icon nds-hgi-github",
      x: "nds-icon nds-hgi-new-twitter",
      email: "nds-icon nds-hgi-mail-01",
      website: "nds-icon nds-hgi-globe",
      phone: "nds-icon nds-hgi-headphones",
      location: "nds-icon nds-hgi-location-01"
    };
    return icons[type] || icons.website;
  }

  function footerSvgIcon(type) {
    var safeType = String(type || "website").toLowerCase().replace(/[^a-z0-9-]/g, "") || "website";
    var icons = {
      linkedin: "<path d='M4.5 9.5H4C3.05719 9.5 2.58579 9.5 2.29289 9.79289C2 10.0858 2 10.5572 2 11.5V20C2 20.9428 2 21.4142 2.29289 21.7071C2.58579 22 3.05719 22 4 22H4.5C5.44281 22 5.91421 22 6.20711 21.7071C6.5 21.4142 6.5 20.9428 6.5 20V11.5C6.5 10.5572 6.5 10.0858 6.20711 9.79289C5.91421 9.5 5.44281 9.5 4.5 9.5Z' stroke='currentColor' stroke-width='1.5'/><path d='M6.5 4.25C6.5 5.49264 5.49264 6.5 4.25 6.5C3.00736 6.5 2 5.49264 2 4.25C2 3.00736 3.00736 2 4.25 2C5.49264 2 6.5 3.00736 6.5 4.25Z' stroke='currentColor' stroke-width='1.5'/><path d='M12.326 9.5H11.5C10.5572 9.5 10.0858 9.5 9.79289 9.79289C9.5 10.0858 9.5 10.5572 9.5 11.5V20C9.5 20.9428 9.5 21.4142 9.79289 21.7071C10.0858 22 10.5572 22 11.5 22H12C12.9428 22 13.4142 22 13.7071 21.7071C14 21.4142 14 20.9428 14 20L14.0001 16.5001C14.0001 14.8433 14.5281 13.5001 16.0879 13.5001C16.8677 13.5001 17.5 14.1717 17.5 15.0001V19.5001C17.5 20.4429 17.5 20.9143 17.7929 21.2072C18.0857 21.5001 18.5572 21.5001 19.5 21.5001H19.9987C20.9413 21.5001 21.4126 21.5001 21.7055 21.2073C21.9984 20.9145 21.9985 20.4432 21.9987 19.5006L22.0001 14.0002C22.0001 11.515 19.6364 9.50024 17.2968 9.50024C15.9649 9.50024 14.7767 10.1531 14.0001 11.174C14 10.5439 14 10.2289 13.8632 9.995C13.7765 9.84686 13.6531 9.72353 13.505 9.63687C13.2711 9.5 12.9561 9.5 12.326 9.5Z' stroke='currentColor' stroke-linejoin='round' stroke-width='1.5'/>",
      facebook: "<path d='M6.18182 10.3333C5.20406 10.3333 5 10.5252 5 11.4444V13.1111C5 14.0304 5.20406 14.2222 6.18182 14.2222H8.54545V20.8889C8.54545 21.8081 8.74951 22 9.72727 22H12.0909C13.0687 22 13.2727 21.8081 13.2727 20.8889V14.2222H15.9267C16.6683 14.2222 16.8594 14.0867 17.0631 13.4164L17.5696 11.7497C17.9185 10.6014 17.7035 10.3333 16.4332 10.3333H13.2727V7.55556C13.2727 6.94191 13.8018 6.44444 14.4545 6.44444H17.8182C18.7959 6.44444 19 6.25259 19 5.33333V3.11111C19 2.19185 18.7959 2 17.8182 2H14.4545C11.191 2 8.54545 4.48731 8.54545 7.55556V10.3333H6.18182Z' stroke='currentColor' fill-rule='evenodd' stroke-linejoin='round' stroke-width='1.5'/>",
      instagram: "<rect x='3' y='3' width='18' height='18' rx='5' stroke='currentColor' stroke-width='1.5'/><circle cx='12' cy='12' r='4' stroke='currentColor' stroke-width='1.5'/><circle cx='17' cy='7' r='1.25' fill='currentColor'/>",
      youtube: "<path d='M12 20.5C13.8097 20.5 15.5451 20.3212 17.1534 19.9934C19.1623 19.5839 20.1668 19.3791 21.0834 18.2006C22 17.0221 22 15.6693 22 12.9635V11.0365C22 8.33073 22 6.97787 21.0834 5.79937C20.1668 4.62088 19.1623 4.41613 17.1534 4.00662C15.5451 3.67877 13.8097 3.5 12 3.5C10.1903 3.5 8.45489 3.67877 6.84656 4.00662C4.83766 4.41613 3.83321 4.62088 2.9166 5.79937C2 6.97787 2 8.33073 2 11.0365V12.9635C2 15.6693 2 17.0221 2.9166 18.2006C3.83321 19.3791 4.83766 19.5839 6.84656 19.9934C8.45489 20.3212 10.1903 20.5 12 20.5Z' stroke='currentColor' stroke-width='1.5'/><path d='M15.9621 12.3129C15.8137 12.9187 15.0241 13.3538 13.4449 14.2241C11.7272 15.1705 10.8684 15.6438 10.1728 15.4615C9.9372 15.3997 9.7202 15.2911 9.53799 15.1438C9 14.7089 9 13.8059 9 12C9 10.1941 9 9.29112 9.53799 8.85618C9.7202 8.70886 9.9372 8.60029 10.1728 8.53854C10.8684 8.35621 11.7272 8.82945 13.4449 9.77593C15.0241 10.6462 15.8137 11.0813 15.9621 11.6871C16.0126 11.8933 16.0126 12.1067 15.9621 12.3129Z' stroke='currentColor' stroke-linejoin='round' stroke-width='1.5'/>",
      github: "<path d='M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.9-4.7 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A9.3 9.3 0 0 0 12 2.8Z' fill='currentColor'/>",
      x: "<path d='M3 21L10.5484 13.4516M21 3L13.4516 10.5484M13.4516 10.5484L8 3H3L10.5484 13.4516M13.4516 10.5484L21 21H16L10.5484 13.4516' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'/>",
      email: "<path d='M4 6.5H20V17.5H4V6.5Z' stroke='currentColor' stroke-linejoin='round' stroke-width='1.5'/><path d='M4.5 7L12 12.25L19.5 7' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'/>",
      website: "<path d='M10 13.229C10.1416 13.4609 10.3097 13.6804 10.5042 13.8828C11.7117 15.1395 13.5522 15.336 14.9576 14.4722C15.218 14.3121 15.4634 14.1157 15.6872 13.8828L18.9266 10.5114C20.3578 9.02184 20.3578 6.60676 18.9266 5.11718C17.4953 3.6276 15.1748 3.62761 13.7435 5.11718L13.03 5.85978' stroke='currentColor' stroke-linecap='round' stroke-width='1.5'/><path d='M10.9703 18.14L10.2565 18.8828C8.82526 20.3724 6.50471 20.3724 5.07345 18.8828C3.64218 17.3932 3.64218 14.9782 5.07345 13.4886L8.31287 10.1172C9.74413 8.62761 12.0647 8.6276 13.4959 10.1172C13.6904 10.3195 13.8584 10.539 14 10.7708' stroke='currentColor' stroke-linecap='round' stroke-width='1.5'/>",
      phone: "<path d='M20.0849 17C20.5849 15.5 21 13.4368 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4368 3.41512 15.5 3.91512 17' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'/><path d='M8.97651 19.6043L7.23857 14.6127C7.05341 14.1466 6.4617 13.9131 5.97493 14.0297C4.46441 14.5333 3.6462 16.1718 4.14742 17.6895L4.58543 19.0158C5.08664 20.5334 6.71747 21.3555 8.22799 20.8519C8.68896 20.6556 9.10449 20.0897 8.97651 19.6043Z' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'/><path d='M15.0235 19.6043L16.7614 14.6127C16.9466 14.1466 17.5383 13.9131 18.0251 14.0297C19.5356 14.5333 20.3538 16.1718 19.8526 17.6895L19.4146 19.0158C18.9134 20.5334 17.2825 21.3555 15.772 20.8519C15.311 20.6556 14.8955 20.0897 15.0235 19.6043Z' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'/>",
      location: "<path d='M12 22C12 22 19 15.5 19 9.8C19 5.95 15.866 3 12 3C8.13401 3 5 5.95 5 9.8C5 15.5 12 22 12 22Z' stroke='currentColor' stroke-linejoin='round' stroke-width='1.5'/><circle cx='12' cy='10' r='2.5' stroke='currentColor' stroke-width='1.5'/>"
    };
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("contact-icon", "footer-icon-svg", "footer-icon-" + safeType);
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = icons[safeType] || icons.website;
    return svg;
  }

  function footerAppIcon(type) {
    var icon = document.createElement("i");
    icon.className = footerAppIconClass(type);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function footerAppIconClass(type) {
    var icons = {
      appstore: "nds-icon nds-icon-apple",
      android: "nds-icon nds-icon-google-play",
      googleplay: "nds-icon nds-icon-google-play",
      huawei: "nds-icon nds-icon-huawei"
    };
    return icons[String(type || "").toLowerCase()] || icons.appstore;
  }

  function footerAppIconSvg(type) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var paths;
    if (type === "appstore") {
      svg.setAttribute("width", "22");
      svg.setAttribute("height", "26");
      svg.setAttribute("viewBox", "0 0 22 26");
      paths = [
        "M18.3067 13.8343C18.3177 12.8377 18.5918 11.8628 19.1072 10.9962C19.6116 10.1296 20.3464 9.4038 21.2236 8.8838C20.6644 8.1147 19.9296 7.4756 19.0743 7.0315C18.2189 6.5874 17.2649 6.3382 16.289 6.3057C14.2054 6.0999 12.1986 7.5081 11.1349 7.5081C10.0713 7.5081 8.42631 6.3274 6.67181 6.3599C5.53131 6.3924 4.42381 6.7174 3.45881 7.2806C2.48281 7.8548 1.68231 8.6564 1.13401 9.6096C-1.25659 13.6068 0.530909 19.478 2.82281 22.7169C3.97421 24.2985 5.31201 26.0642 7.06661 25.9992C8.78821 25.9342 9.42431 24.9484 11.4968 24.9484C13.5694 24.9484 14.1506 25.9992 15.938 25.9667C17.7803 25.9342 18.9427 24.3743 20.0503 22.7819C20.8727 21.6553 21.5087 20.4096 21.9254 19.088C20.8508 18.6547 19.9406 17.9181 19.3046 16.9865C18.6576 16.0549 18.3177 14.9609 18.3177 13.8343H18.3067Z",
        "M14.9292 4.1705C15.9381 3.0114 16.4315 1.5165 16.3109 0C14.7757 0.1517 13.3611 0.8666 12.3412 1.9823C11.8478 2.524 11.464 3.1631 11.2227 3.8564C10.9815 4.5496 10.8828 5.2754 10.9266 6.0012C11.6942 6.0012 12.4509 5.8495 13.1418 5.5354C13.8326 5.2213 14.4467 4.7555 14.9292 4.1813V4.1705Z"
      ];
    } else if (type === "huawei") {
      svg.setAttribute("width", "26");
      svg.setAttribute("height", "26");
      svg.setAttribute("viewBox", "0 0 26 26");
      paths = [
        "M18.27 0H7.15C1.9 0 0 1.97 0 7.31V18.67C0 24.03 1.93 25.98 7.15 25.98H18.27C23.52 25.98 25.42 24.01 25.42 18.67V7.31C25.45 1.97 23.52 0 18.27 0ZM5.03 13.01H5.7V16.4H5.03V15.03H3.5V16.4H2.83V13.01H3.5V14.38H5.03V13.01ZM8.84 14.94C8.84 15.48 8.57 15.79 8.09 15.79C7.61 15.79 7.34 15.49 7.34 14.92V13H6.67V14.95C6.67 15.9 7.18 16.46 8.09 16.46C9 16.46 9.54 15.92 9.54 14.92V13H8.87V14.95H8.84V14.94ZM16.63 15.33L15.88 13H15.32L14.57 15.33L13.85 13H13.13L14.28 16.39H14.84L15.59 14.15L16.34 16.39H16.9L18.05 13H17.35L16.63 15.33ZM19.29 14.94H20.52V14.31H19.29V13.62H21.09V12.99H18.65V16.38H21.17V15.75H19.32V14.93H19.29V14.94ZM21.94 16.4H22.61V13.01H21.94V16.4ZM10.85 15.68L10.56 16.39H9.86L11.31 13H11.9L13.35 16.39H12.65L12.36 15.68H10.85ZM11.09 15.09H12.11L11.6 13.89L11.09 15.09ZM12.72 8.68C10.39 8.68 8.49 6.73 8.49 4.35H9.08C9.08 6.4 10.71 8.07 12.72 8.07C14.73 8.07 16.36 6.4 16.36 4.35H16.95C16.95 6.73 15.05 8.68 12.72 8.68Z"
      ];
    } else {
      svg.setAttribute("width", "23");
      svg.setAttribute("height", "26");
      svg.setAttribute("viewBox", "0 0 23 26");
      paths = [
        "M1.2079 0L13.4575 12.1642L16.8128 8.809L1.9643 0.2318C1.7203 0.0854001 1.4519 0.0122 1.2079 0ZM0.183 0.5612C0.0731996 0.7565 0 0.9883 0 1.2445V24.8775C0 25.0727 0.0366003 25.2435 0.1098 25.39L12.6401 12.9451L0.183 0.5612ZM17.8376 9.3825L14.2506 12.9573L17.8376 16.5077L22.2177 13.9944C22.84 13.6283 22.9254 13.1769 22.9254 12.9329C22.9254 12.5303 22.6692 12.152 22.2299 11.9202C21.8517 11.725 19.0821 10.1023 17.8254 9.3702L17.8376 9.3825ZM13.4575 13.7504L1.1103 26C1.3177 26 1.5373 25.939 1.7447 25.8292C2.2328 25.5486 12.0178 19.8874 12.0178 19.8874L16.8494 17.1178L13.4697 13.7626L13.4575 13.7504Z"
      ];
    }
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    paths.forEach(function (value) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", value);
      path.setAttribute("fill", "currentColor");
      svg.append(path);
    });
    return svg;
  }

  function createFooterIconGroupContainer(groups) {
    var column = el("div", "nds-footer-column nds-footer-icons");
    groups.forEach(function (group) {
      var groupEl = el("div", "nds-footer-icon-group");
      var row = el("div", "nds-footer-icon-row");
      groupEl.append(el("h3", "nds-footer-heading", group.title));
      group.links.forEach(function (item) {
        var href = normalizeContactUrl(normalizeFooterLinkUrl(item.href), item.iconType);
        var isAppIcon = isFooterAppIcon(item.iconType);
        var link = el("a", "nds-btn nds-secondary-outline " + (isAppIcon ? "nds-xl " : "") + "nds-icon-only footer-social-link");
        link.href = href;
        link.setAttribute("aria-label", item.label || group.title);
        applyFooterLinkTarget(link, href);
        link.append(footerIconElement(item));
        row.append(link);
      });
      groupEl.append(row);
      column.append(groupEl);
    });
    return column;
  }

  function renderFooterContent(data) {
    var columns = footerColumns(data);
    var iconGroups = footerIconGroups(data);
    qsa(".nds-footer-content").forEach(function (root) {
      root.innerHTML = "";
      columns.forEach(function (column) {
        root.append(createFooterColumn(column));
      });
      if (iconGroups.length) root.append(createFooterIconGroupContainer(iconGroups));
      if (!columns.length && !iconGroups.length) {
        var fallback = el("div", "nds-footer-column");
        fallback.append(el("h3", "nds-footer-heading", uiText(data, "footerLinksHeading", "روابط سريعة")));
        fallback.append(el("p", "nds-footer-empty", uiText(data, "footerSocialEmpty", "لم تتم إضافة روابط تذييل بعد")));
        root.append(fallback);
      }
    });
  }

  function renderFooterBottom(data) {
    var footer = data.footer || {};
    var bottomLinks = uniqueFooterLinks(footer.bottomLinks || [], true);
    var logos = visibleItems(footer.logos || []).filter(function (logo) {
      return hasText(logo.src || logo.image || logo.logo);
    });
    var siteTitle = data.settings.siteName || data.settings.brandName || "السيرة الذاتية";
    var copyrightText = footer.copyrightText || ("جميع الحقوق محفوظة " + siteTitle + " © " + new Date().getFullYear());
    var legalText = typeof footer.legalText === "string" ? footer.legalText : uiText(data, "footerDisclaimer", "تنويه: هذا الموقع شخصي وغير تابع لأي جهة حكومية، ولا يمثل إلا وجهة نظر صاحبه.");
    var versionText = uiText(data, "footerVersion", "Biography v1.0");

    qsa(".nds-footer-bottom").forEach(function (root) {
      var meta = el("div", "nds-footer-meta");
      var legal = el("div", "nds-footer-legal");
      var copyright = el("div", "nds-footer-copyright");
      var policy = el("div", "nds-footer-policy");
      var logoRoot = el("div", "nds-footer-logos");

      root.innerHTML = "";
      copyright.append(el("span", "", copyrightText));
      legal.append(copyright);

      bottomLinks.forEach(function (item, index) {
        policy.append(createFooterTextLink(item));
        if (index < bottomLinks.length - 1) {
          var separator = el("span", "footer-policy-separator", "-");
          separator.setAttribute("aria-hidden", "true");
          policy.append(separator);
        }
      });
      if (bottomLinks.length) legal.append(policy);

      if (hasText(versionText)) {
        var version = el("span", "footer-version", versionText);
        version.dataset.footerVersion = "true";
        meta.append(version);
      }
      if (hasText(legalText)) legal.append(el("span", "footer-disclaimer", legalText));
      meta.append(legal);

      if (!logos.length) {
        logos = [{
          src: data.settings.brandLogo || "assets/vendor/nds/images/palm_swords.svg",
          alt: siteTitle,
          url: "index.html",
          label: siteTitle
        }];
      }
      logos.forEach(function (logo) {
        var src = logo.src || logo.image || logo.logo;
        var image = document.createElement("img");
        image.className = "nds-oncolor";
        image.src = src;
        image.alt = logo.alt || logo.label || "";
        image.loading = "lazy";
        image.width = Number(logo.width) || 72;
        image.height = Number(logo.height) || 40;
        if (hasText(logo.url)) {
          var link = el("a", "nds-link");
          var href = normalizeFooterLinkUrl(logo.url);
          link.href = href;
          link.setAttribute("aria-label", logo.label || logo.alt || siteTitle);
          applyFooterLinkTarget(link, href);
          link.append(image);
          logoRoot.append(link);
        } else {
          logoRoot.append(image);
        }
      });

      root.append(meta);
      root.append(logoRoot);
    });
  }

  function normalizeContactUrl(url, type) {
    if (!url) return "#";
    if (type === "email" && !/^mailto:/i.test(url) && !/^https?:\/\//i.test(url)) return "mailto:" + url;
    if (type === "phone" && !/^tel:/i.test(url) && !/^https?:\/\//i.test(url)) return "tel:" + url;
    return url;
  }

  function adminNavIcon() {
    var icon = document.createElement("i");
    icon.className = "nds-icon nds-icon-avatar nav-admin-icon";
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function isAdminAuthenticated() {
    return Boolean(window.SiteStore && window.SiteStore.currentUser && window.SiteStore.currentUser());
  }

  function ensureLoginModal() {
    if (qs("#login-modal")) return;
    var modal = document.createElement("div");
    modal.className = "nds-modal nds-card nds-stroke nds-sm";
    modal.id = "login-modal";
    modal.lang = "ar";
    modal.dir = "rtl";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "login-modal-title");
    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
    modal.innerHTML = [
      '<form id="loginForm" class="nds-form auth-loading-surface" data-loading-surface novalidate>',
      '<div class="nds-card-content">',
      '<div class="nds-card-text">',
      '<h3 class="nds-card-title" id="login-modal-title">تسجيل الدخول</h3>',
      '<p class="nds-card-description">سجل الدخول للوصول إلى حسابك</p>',
      '</div>',
      '<div class="nds-form-container" id="login-email-field" data-required>',
      '<div class="nds-form-header">',
      '<label for="login-email">',
      '<span class="nds-label">البريد الإلكتروني</span>',
      '</label>',
      '</div>',
      '<div class="nds-form-control">',
      '<i class="nds-icon nds-hgi-mail-01" aria-hidden="true"></i>',
      '<input type="email" id="login-email" class="nds-input" placeholder="name@example.gov.sa" autocomplete="username" required aria-required="true" dir="ltr">',
      '<div class="nds-form-action">',
      '<button class="nds-btn nds-subtle nds-clear" type="button" aria-label="Clear email" hidden>',
      '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '</div>',
      '<div class="nds-form-footer" data-feedback-target>',
      '<span class="nds-feedback nds-outline nds-sm" data-status="neutral" data-permanent>',
      '<span class="nds-feedback-icon">',
      '<i class="nds-icon" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-feedback-message">أدخل بريد المدير</span>',
      '</span>',
      '</div>',
      '</div>',
      '<div class="nds-form-container" id="login-password-field" data-required>',
      '<div class="nds-form-header">',
      '<label for="login-password">',
      '<span class="nds-label">كلمة المرور</span>',
      '</label>',
      '</div>',
      '<div class="nds-form-control">',
      '<div class="nds-form-action">',
      '<button class="nds-btn nds-subtle nds-toggle-password" type="button" aria-label="Show password">',
      '<i class="nds-icon nds-hgi-view-off" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<input type="password" id="login-password" class="nds-input" placeholder="Enter your password" autocomplete="current-password" data-type="password" required aria-required="true" dir="ltr">',
      '<div class="nds-form-action">',
      '<button class="nds-btn nds-subtle nds-clear" type="button" aria-label="Clear password" hidden>',
      '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '</div>',
      '<div class="nds-form-footer" data-feedback-target>',
      '<span class="nds-feedback nds-outline nds-sm" data-status="neutral" data-permanent>',
      '<span class="nds-feedback-icon">',
      '<i class="nds-icon" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-feedback-message">أدخل كلمة المرور</span>',
      '</span>',
      '</div>',
      '</div>',
      '<div class="nds-form-container login-captcha-field" id="login-captcha-field" data-required>',
      '<div class="nds-form-header">',
      '<label for="login-captcha-answer">',
      '<span class="nds-label">&#1575;&#1604;&#1578;&#1581;&#1602;&#1602; &#1575;&#1604;&#1571;&#1605;&#1606;&#1610;</span>',
      '</label>',
      '</div>',
      '<div class="login-captcha-row">',
      '<div class="login-captcha-question" data-login-captcha-question aria-live="polite">&#1580;&#1575;&#1585;&#1610; &#1578;&#1581;&#1605;&#1610;&#1604; &#1575;&#1604;&#1578;&#1581;&#1602;&#1602;...</div>',
      '<button class="nds-btn nds-subtle login-captcha-refresh" type="button" data-login-captcha-refresh aria-label="&#1578;&#1581;&#1583;&#1610;&#1579; &#1575;&#1604;&#1578;&#1581;&#1602;&#1602;" title="&#1578;&#1581;&#1583;&#1610;&#1579; &#1575;&#1604;&#1578;&#1581;&#1602;&#1602;">',
      '<i class="nds-icon nds-hgi-refresh" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<div class="nds-form-control">',
      '<i class="nds-icon nds-hgi-help-circle" aria-hidden="true"></i>',
      '<input type="text" id="login-captcha-answer" class="nds-input" inputmode="numeric" pattern="[0-9]*" placeholder="&#1575;&#1603;&#1578;&#1576; &#1575;&#1604;&#1606;&#1575;&#1578;&#1580;" autocomplete="off" required aria-required="true" dir="ltr">',
      '</div>',
      '<div class="nds-form-footer" data-feedback-target>',
      '<span class="nds-feedback nds-outline nds-sm" data-status="neutral" data-permanent>',
      '<span class="nds-feedback-icon">',
      '<i class="nds-icon" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-feedback-message">&#1571;&#1583;&#1582;&#1604; &#1606;&#1575;&#1578;&#1580; &#1575;&#1604;&#1593;&#1605;&#1604;&#1610;&#1577;</span>',
      '</span>',
      '</div>',
      '</div>',
      '</div>',
      '<div class="nds-card-actions">',
      '<button type="submit" class="nds-btn nds-primary nds-full" id="loginSubmitBtn">',
      '<span class="nds-label">تسجيل الدخول</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-full nds-modal-close">',
      '<span class="nds-label">إلغاء</span>',
      '</button>',
      '</div>',
      '</form>'
    ].join("");
    document.body.append(modal);
  }

  function initializeNdsLoginPackages() {
    if (!window.NDS) return;
    if (window.NDS.Forms && window.NDS.Forms.init) window.NDS.Forms.init();
    if (window.NDS.Modal && window.NDS.Modal.init) window.NDS.Modal.init();
  }

  function prepareOverlayForLoginModal() {
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
      window.NDS.Mainnav.dismissOverlays();
    } else {
      closeNotificationDropdown();
      closeNavPanel({ instant: true });
    }
    if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.reset) {
      window.NDS.Backdrop.reset();
    }
  }

  function openLoginModal(options) {
    ensureLoginModal();
    initializeNdsLoginPackages();
    var modal = qs("#login-modal");
    if (!modal) return;
    modal.dataset.redirectToAdmin = options && options.redirectToAdmin === false ? "false" : "true";
    if (isLoginModalOpen(modal)) {
      var activeEmailInput = qs("#login-email", modal);
      if (activeEmailInput) activeEmailInput.focus();
      return;
    }
    if (window.NDS && window.NDS.Modal && window.NDS.Modal.open) {
      window.NDS.Modal.open("login-modal");
    } else {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      modal.dataset.state = "open";
    }
    loadLoginCaptcha();
    var emailInput = qs("#login-email", modal);
    if (emailInput) emailInput.focus();
  }

  function isLoginModalOpen(modal) {
    modal = modal || qs("#login-modal");
    if (!modal) return false;
    return modal.hidden === false
      || modal.getAttribute("aria-hidden") === "false"
      || (modal.dataset.state || "").split(/\s+/).indexOf("open") !== -1
      || (modal.dataset.state || "").split(/\s+/).indexOf("opened") !== -1;
  }

  function closeLoginModal() {
    var modal = qs("#login-modal");
    if (!modal) return;
    if (window.NDS && window.NDS.Modal && window.NDS.Modal.close) {
      window.NDS.Modal.close();
    } else {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.dataset.state = "closed";
    }
  }

  function waitForAuthLoading(startedAt) {
    return wait(AUTH_LOADING_MIN_MS - (Date.now() - startedAt));
  }

  function setLoginSubmitLoading(isLoading) {
    var button = qs("#loginForm button[type='submit']");
    if (!button) return;
    if (isLoading) {
      button.dataset.state = "loading";
      button.classList.add("nds-loading", "nds-xs");
      button.setAttribute("aria-busy", "true");
    } else {
      button.removeAttribute("data-state");
      button.classList.remove("nds-loading", "nds-xs");
      button.removeAttribute("aria-busy");
    }
  }

  function setLoginLoading(isLoading) {
    var form = qs("#loginForm");
    if (!form) return;
    qsa("input, button, select, textarea", form).forEach(function (control) {
      if (isLoading) {
        if (!control.disabled) control.dataset.authWasEnabled = "true";
        control.disabled = true;
        control.setAttribute("aria-disabled", "true");
      } else {
        if (control.dataset.authWasEnabled === "true") control.disabled = false;
        delete control.dataset.authWasEnabled;
        control.removeAttribute("aria-disabled");
      }
    });
    if (isLoading) {
      form.setAttribute("aria-busy", "true");
      setLoginSubmitLoading(true);
    } else {
      form.removeAttribute("aria-busy");
      setLoginSubmitLoading(false);
    }
  }

  function showAuthLoading(message) {
    var overlay = qs("[data-auth-loading-overlay]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "auth-loading-overlay";
      overlay.dataset.authLoadingOverlay = "true";
      overlay.setAttribute("role", "status");
      overlay.setAttribute("aria-live", "polite");
      overlay.innerHTML = [
        '<div class="auth-loading-card nds-loading nds-sm" data-loading-surface data-state="loading">',
        '<span class="auth-loading-message"></span>',
        '</div>'
      ].join("");
      document.body.append(overlay);
    }
    var label = qs(".auth-loading-message", overlay);
    if (label) label.textContent = message || "";
    overlay.hidden = false;
  }

  function hideAuthLoading() {
    var overlay = qs("[data-auth-loading-overlay]");
    if (overlay) overlay.hidden = true;
  }

  function resetLoginCaptchaField(modal) {
    var field = qs("#login-captcha-field", modal);
    if (!field) return;
    if (window.NDS && window.NDS.Forms && window.NDS.Forms.clearStatus) {
      window.NDS.Forms.clearStatus(field);
    } else {
      field.removeAttribute("data-status");
      field.removeAttribute("data-message");
      qsa(".nds-feedback:not([data-permanent])", field).forEach(function (feedback) { feedback.remove(); });
      qsa(".nds-feedback[data-permanent]", field).forEach(function (feedback) { feedback.hidden = false; });
    }
    var input = qs("input", field);
    if (input) input.removeAttribute("aria-invalid");
  }

  function loadLoginCaptcha() {
    var modal = qs("#login-modal");
    if (!modal || !window.SiteStore || !window.SiteStore.captcha) return Promise.resolve(null);
    var question = qs("[data-login-captcha-question]", modal);
    var input = qs("#login-captcha-answer", modal);
    var refresh = qs("[data-login-captcha-refresh]", modal);
    if (question) {
      question.textContent = "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u062d\u0642\u0642...";
      question.dataset.state = "loading";
    }
    if (refresh) refresh.dataset.state = "loading";
    return window.SiteStore.captcha().then(function (captcha) {
      if (question) {
        question.textContent = captcha && captcha.question ? captcha.question : "";
        question.removeAttribute("data-state");
      }
      if (input) input.value = "";
      resetLoginCaptchaField(modal);
      return captcha;
    }).catch(function () {
      if (question) {
        question.textContent = "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0623\u0645\u0646\u064a";
        question.dataset.state = "error";
      }
      showToast("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0623\u0645\u0646\u064a", "error");
      return null;
    }).finally(function () {
      if (refresh) refresh.removeAttribute("data-state");
    });
  }

  function accountModalShell(id, title, bodyHtml) {
    var modal = qs("#" + id);
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "nds-modal nds-card nds-stroke nds-sm account-settings-modal";
      modal.id = id;
      modal.lang = "ar";
      modal.dir = "rtl";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-labelledby", id + "-title");
      modal.setAttribute("aria-hidden", "true");
      modal.hidden = true;
      document.body.append(modal);
    }
    modal.innerHTML = [
      '<form class="nds-form" data-account-form="' + id + '" novalidate>',
      '<div class="nds-card-content">',
      '<div class="nds-card-text">',
      '<h3 class="nds-card-title" id="' + id + '-title">' + title + '</h3>',
      '</div>',
      bodyHtml,
      '<div class="account-modal-feedback" data-account-modal-feedback role="alert" aria-live="assertive"></div>',
      '</div>',
      '<div class="nds-card-actions">',
      '<button type="submit" class="nds-btn nds-primary nds-full"><span class="nds-label">حفظ</span></button>',
      '<button type="button" class="nds-btn nds-subtle nds-full nds-modal-close"><span class="nds-label">إلغاء</span></button>',
      '</div>',
      '</form>'
    ].join("");
    initializeNdsLoginPackages();
    return modal;
  }

  function accountFieldHtml(id, label, type, autocomplete) {
    return [
      '<div class="nds-form-container" data-required>',
      '<div class="nds-form-header"><label for="' + id + '"><span class="nds-label">' + label + '</span></label></div>',
      '<div class="nds-form-control">',
      '<input id="' + id + '" class="nds-input" type="' + type + '" autocomplete="' + (autocomplete || "off") + '" required aria-required="true">',
      '</div>',
      '</div>'
    ].join("");
  }

  function showAccountModal(id) {
    prepareOverlayForLoginModal();
    initializeNdsLoginPackages();
    if (window.NDS && window.NDS.Modal && window.NDS.Modal.open) {
      window.NDS.Modal.open(id);
    } else {
      var modal = qs("#" + id);
      if (modal) {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.dataset.state = "open";
      }
    }
    var first = qs("#" + id + " .nds-input");
    if (first) first.focus();
  }

  function accountModalMessage(modal, message) {
    var feedback = qs("[data-account-modal-feedback]", modal);
    if (feedback) feedback.textContent = message || "";
    if (message) showToast(message, "error");
  }

  function openChangePasswordModal() {
    var modal = accountModalShell("change-password-modal", "تغيير كلمة المرور", [
      accountFieldHtml("current-password", "كلمة المرور الحالية", "password", "current-password"),
      accountFieldHtml("new-password", "كلمة المرور الجديدة", "password", "new-password"),
      accountFieldHtml("confirm-password", "تأكيد كلمة المرور الجديدة", "password", "new-password")
    ].join(""));
    showAccountModal("change-password-modal");
    var form = qs("form", modal);
    form.onsubmit = function (event) {
      event.preventDefault();
      var config = currentAuthConfig();
      var current = qs("#current-password", modal).value;
      var next = qs("#new-password", modal).value;
      var confirm = qs("#confirm-password", modal).value;
      if (!current || !next || !confirm) { accountModalMessage(modal, "جميع الحقول مطلوبة."); return; }
      if (next !== confirm) { accountModalMessage(modal, "كلمة المرور الجديدة وتأكيدها غير متطابقين."); return; }
      window.SiteStore.changePassword(current, next, confirm).then(function () {
        closeLoginModal();
        showToast("تم تغيير كلمة المرور بنجاح", "success");
      }).catch(function (error) {
        accountModalMessage(modal, error.message || "تعذر تغيير كلمة المرور.");
      });
      return;
    };
  }

  function openChangeEmailModal() {
    var modal = accountModalShell("change-email-modal", "تغيير البريد الإلكتروني", [
      accountFieldHtml("new-email", "البريد الإلكتروني الجديد", "email", "email"),
      accountFieldHtml("email-password", "تأكيد كلمة المرور الحالية", "password", "current-password")
    ].join(""));
    showAccountModal("change-email-modal");
    var form = qs("form", modal);
    form.onsubmit = function (event) {
      event.preventDefault();
      var config = currentAuthConfig();
      var email = qs("#new-email", modal).value.trim();
      var password = qs("#email-password", modal).value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { accountModalMessage(modal, "أدخل بريدًا إلكترونيًا صحيحًا."); return; }
      window.SiteStore.changeEmail(email, password).then(function () {
        renderAccountMenu(appState.data || window.SiteStore.current());
        closeLoginModal();
        showToast("تم تغيير البريد الإلكتروني بنجاح", "success");
      }).catch(function (error) {
        accountModalMessage(modal, error.message || "تعذر تغيير البريد الإلكتروني.");
      });
      return;
    };
  }

  function openChangePhoneModal() {
    var modal = accountModalShell("change-phone-modal", "تغيير رقم الجوال", [
      accountFieldHtml("new-phone", "رقم الجوال", "tel", "tel"),
      accountFieldHtml("phone-password", "تأكيد كلمة المرور الحالية", "password", "current-password")
    ].join(""));
    showAccountModal("change-phone-modal");
    var form = qs("form", modal);
    form.onsubmit = function (event) {
      event.preventDefault();
      var config = currentAuthConfig();
      var phone = qs("#new-phone", modal).value.trim();
      var password = qs("#phone-password", modal).value;
      if (!phone) { accountModalMessage(modal, "رقم الجوال مطلوب."); return; }
      window.SiteStore.changePhone(phone, password).then(function () {
        return window.SiteStore.load(true);
      }).then(function (loadedData) {
        appState.data = loadedData;
        closeLoginModal();
        renderShared(appState.data);
        showToast("تم تغيير رقم الجوال بنجاح", "success");
      }).catch(function (error) {
        accountModalMessage(modal, error.message || "تعذر تغيير رقم الجوال.");
      });
      return;
    };
  }

  function removeDataStateTokens(element, tokens) {
    if (!element) return;
    var remove = tokens || [];
    var keep = (element.dataset.state || "").split(/\s+/).filter(function (token) {
      return token && remove.indexOf(token) === -1;
    });
    if (keep.length) {
      element.dataset.state = keep.join(" ");
    } else {
      element.removeAttribute("data-state");
    }
  }

  function forceClearBackdrop() {
    if (window.NDS && window.NDS.Backdrop) {
      if (window.NDS.Backdrop.reset) {
        window.NDS.Backdrop.reset();
      } else if (window.NDS.Backdrop.hide) {
        window.NDS.Backdrop.hide();
      }
    }
    qsa("[data-nds-backdrop]").forEach(function (backdrop) {
      backdrop.style.display = "";
      backdrop.removeAttribute("data-state");
    });
    removeDataStateTokens(document.body, ["backdrop"]);
  }

  function closeAccountOverlays() {
    dismissNdsHeaderOverlays();
    qsa(".admin-persona-dropdown, .account-menu-item, .mobile-account-dropdown, [data-mobile-admin-shortcut]").forEach(function (root) {
      root.removeAttribute("data-state");
      qsa(".account-persona-trigger, .mobile-account-trigger, .header-admin-link, .nav-admin-link, .account-login-trigger, [data-login-trigger]", root).forEach(function (trigger) {
        removeDataStateTokens(trigger, ["active", "open", "opened", "opening", "closing"]);
        trigger.setAttribute("aria-expanded", "false");
      });
    });
    hideAuthLoading();
    forceClearBackdrop();
  }

  function logoutButtons(trigger) {
    var buttons = [];
    if (trigger) buttons.push(trigger);
    qsa("[data-account-action='logout'], [data-admin-persona-logout], #logoutBtn, .account-persona-trigger, .mobile-account-trigger, .header-admin-link, .nav-admin-link, .account-login-trigger, .site-header [data-login-trigger], [data-mobile-admin-shortcut] > .nds-btn").forEach(function (button) {
      if (buttons.indexOf(button) === -1) buttons.push(button);
    });
    return buttons;
  }

  function setLogoutLoading(trigger, isLoading) {
    if (document.body) {
      if (isLoading) {
        document.body.dataset.authLogoutLoading = "true";
      } else {
        delete document.body.dataset.authLogoutLoading;
      }
    }
    logoutButtons(trigger).forEach(function (button) {
      if (isLoading) {
        button.dataset.logoutLoading = "true";
        button.dataset.state = "loading";
        button.classList.add("nds-loading", "nds-sm");
        button.setAttribute("aria-busy", "true");
        button.setAttribute("aria-disabled", "true");
        if ("disabled" in button) button.disabled = true;
      } else {
        delete button.dataset.logoutLoading;
        button.removeAttribute("data-state");
        button.classList.remove("nds-loading", "nds-xs", "nds-sm");
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
        if ("disabled" in button) button.disabled = false;
      }
    });
  }

  function logoutUser(trigger) {
    var loadingStartedAt = Date.now();
    setLogoutLoading(trigger, true);
    closeAccountOverlays();
    setLogoutLoading(trigger, true);
    qsa(".account-persona-trigger, .account-menu-item, .mobile-account-section").forEach(function (node) {
      node.removeAttribute("data-status");
      removeDataStateTokens(node, ["active", "open", "opened", "opening", "closing"]);
      node.classList.remove("nds-success", "success", "active", "selected", "is-active");
    });
    window.SiteStore.logout().then(function () {
      return waitForAuthLoading(loadingStartedAt).then(function () {
        renderAccountMenu(appState.data || window.SiteStore.current());
        showToast("تم تسجيل الخروج بنجاح", "error");
        window.dispatchEvent(new CustomEvent("site:admin-logout"));
      });
    }).catch(function (error) {
      return waitForAuthLoading(loadingStartedAt).then(function () {
        showToast(error.message || "تعذر تسجيل الخروج", "error");
      });
    }).finally(function () {
      closeAccountOverlays();
      setLogoutLoading(trigger, false);
    });
  }

  function clearLoginFeedback() {
    ["#login-email-field", "#login-password-field", "#login-captcha-field"].forEach(function (selector) {
      var field = qs(selector);
      if (!field) return;
      if (window.NDS && window.NDS.Forms && window.NDS.Forms.clearStatus) {
        window.NDS.Forms.clearStatus(field);
      } else {
        field.removeAttribute("data-status");
        field.removeAttribute("data-message");
        qsa(".nds-feedback:not([data-permanent])", field).forEach(function (feedback) { feedback.remove(); });
        qsa(".nds-feedback[data-permanent]", field).forEach(function (feedback) { feedback.hidden = false; });
      }
      var input = qs("input", field);
      if (input) input.removeAttribute("aria-invalid");
    });
  }

  function setLoginFieldFeedback(fieldSelector, message) {
    var field = qs(fieldSelector);
    if (!field) return;
    if (window.NDS && window.NDS.Forms && window.NDS.Forms.setStatus) {
      window.NDS.Forms.setStatus({
        element: field,
        status: "error",
        message: message,
        position: "append",
        size: "sm",
        style: "outline"
      });
      return;
    }
    field.setAttribute("data-status", "error");
    field.setAttribute("data-message", message);
    var target = qs("[data-feedback-target]", field) || field;
    qsa(".nds-feedback:not([data-permanent])", target).forEach(function (feedback) { feedback.remove(); });
    qsa(".nds-feedback[data-permanent]", target).forEach(function (feedback) { feedback.hidden = true; });
    var feedback = document.createElement("span");
    feedback.className = "nds-feedback nds-outline nds-sm";
    feedback.setAttribute("data-status", "error");
    feedback.setAttribute("role", "alert");
    feedback.setAttribute("aria-live", "assertive");
    feedback.innerHTML = '<span class="nds-feedback-icon"><i class="nds-icon" aria-hidden="true"></i></span><span class="nds-feedback-message"></span>';
    qs(".nds-feedback-message", feedback).textContent = message;
    target.append(feedback);
    var input = qs("input", field);
    if (input) input.setAttribute("aria-invalid", "true");
  }

  function toastAlertKey(variant, title, description) {
    return [variant || "", title || "", description || ""].join("\u001f");
  }

  function removeMatchingToastAlerts(key) {
    qsa(".nds-alert-placeholder .nds-alert.nds-toast").forEach(function (alert) {
      if (alert.dataset.siteToastKey === key) alert.remove();
    });
  }

  function showToastAlert(variant, title, description) {
    if (!(window.NDS && window.NDS.Alert && window.NDS.Alert.create)) return false;
    var normalizedDescription = description || "";
    var key = toastAlertKey(variant, title, normalizedDescription);
    removeMatchingToastAlerts(key);
    var alert = window.NDS.Alert.create({
      variant: variant,
      title: title,
      description: normalizedDescription,
      display: "toast",
      position: "top",
      duration: 3000,
      shadow: true
    });
    if (alert) alert.dataset.siteToastKey = key;
    return true;
  }

  function showToast(message, type) {
    var variant = type || "info";
    if (variant === "danger") variant = "error";
    if (showToastAlert(variant, message, "")) return true;
    var toastElement = qs("[data-toast]");
    if (!toastElement) return false;
    toastElement.textContent = message;
    toastElement.dataset.status = variant;
    toastElement.hidden = false;
    clearTimeout(toastElement._timer);
    toastElement._timer = setTimeout(function () {
      toastElement.hidden = true;
    }, 2600);
    return true;
  }

  function setupLoginModal() {
    ensureLoginModal();
    initializeNdsLoginPackages();

    document.addEventListener("click", function (event) {
      var loginTrigger = event.target.closest("[data-login-trigger]");
      if (loginTrigger) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        prepareOverlayForLoginModal();
        openLoginModal({ redirectToAdmin: false });
        return;
      }

      var captchaRefresh = event.target.closest("[data-login-captcha-refresh]");
      if (captchaRefresh) {
        event.preventDefault();
        loadLoginCaptcha();
        return;
      }

      var accountAction = event.target.closest("[data-account-action]");
      if (accountAction && accountAction.dataset.accountAction !== "portal") {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (accountAction.dataset.accountAction === "password") openChangePasswordModal();
        if (accountAction.dataset.accountAction === "email") openChangeEmailModal();
        if (accountAction.dataset.accountAction === "phone") openChangePhoneModal();
        if (accountAction.dataset.accountAction === "logout") logoutUser(accountAction);
        return;
      }

      var logoutButton = event.target.closest("[data-admin-persona-logout], #logoutBtn");
      if (logoutButton) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        logoutUser(logoutButton);
        return;
      }

      var adminLink = event.target.closest('a[href="admin.html"], a[href$="/admin.html"]');
      if (!adminLink || isAdminAuthenticated()) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      prepareOverlayForLoginModal();
      openLoginModal({ redirectToAdmin: document.body.dataset.page !== "admin" });
    });

    var loginForm = qs("#loginForm");
    if (!loginForm || loginForm.dataset.loginReady === "true") return;
    loginForm.dataset.loginReady = "true";
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      setLoginSubmitLoading(true);
      var config = currentAuthConfig();
      var validation = window.NDS && window.NDS.Forms && window.NDS.Forms.validateForm
        ? window.NDS.Forms.validateForm(loginForm)
        : { valid: true };
      if (!validation.valid) {
        wait(260).then(function () { setLoginSubmitLoading(false); });
        return;
      }

      var emailInput = qs("#login-email");
      var passInput = qs("#login-password");
      var captchaInput = qs("#login-captcha-answer");
      var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      var pass = passInput ? passInput.value : "";
      var captchaAnswer = captchaInput ? captchaInput.value.trim() : "";
      if (!captchaAnswer) {
        clearLoginFeedback();
        setLoginFieldFeedback("#login-captcha-field", "\u0623\u062f\u062e\u0644 \u0646\u0627\u062a\u062c \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0623\u0645\u0646\u064a.");
        wait(260).then(function () { setLoginSubmitLoading(false); });
        return;
      }
      var loadingStartedAt = Date.now();
      setLoginLoading(true);
      window.SiteStore.login(email, pass, captchaAnswer).then(function () {
        return waitForAuthLoading(loadingStartedAt).then(function () {
          setLoginLoading(false);
          renderAccountMenu(appState.data || window.SiteStore.current());
          closeLoginModal();
          loginForm.reset();
          clearLoginFeedback();
          showToast("\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", "success");
          if (qs("#login-modal") && qs("#login-modal").dataset.redirectToAdmin !== "false") {
            window.location.href = "admin.html";
          } else {
            window.dispatchEvent(new CustomEvent("site:admin-login-success"));
          }
        });
      }).catch(function (error) {
        return waitForAuthLoading(loadingStartedAt).then(function () {
          setLoginLoading(false);
          clearLoginFeedback();
          if (error && error.payload && error.payload.code === "captcha_invalid") {
            setLoginFieldFeedback("#login-captcha-field", "\u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0623\u0645\u0646\u064a \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.");
          } else {
            setLoginFieldFeedback("#login-email-field", "تحقق من بريد المدير.");
            setLoginFieldFeedback("#login-password-field", "تحقق من كلمة المرور.");
          }
          loadLoginCaptcha();
          showToast("\u062a\u0639\u0630\u0631 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", "error");
        });
      });
    });
  }

  function loadNotifications() {
    var data = window.SiteStore && window.SiteStore.current ? window.SiteStore.current() : (appState.data || {});
    var state = readNotificationState();
    var now = Date.now();
    var changed = false;
    var items;
    clearLegacyNotifications();
    items = normalizeNotifications(data.notifications || []).map(function (item) {
      var key = notificationStateKey(item);
      var entry = key ? state[key] : null;
      var output = Object.assign({}, item);
      if (!entry) return output;
      if (entry.dismissed) return null;
      if (entry.read) {
        output.read = true;
        output.readAt = entry.readAt || "";
        output.readExpiresAt = entry.readExpiresAt || "";
        if (notificationReadExpiryTime(output, now) <= now) {
          delete state[key];
          changed = true;
          return null;
        }
      }
      return output;
    }).filter(Boolean).filter(function (item) {
      if (!item.read) return true;
      return notificationReadExpiryTime(item, now) > now;
    }).slice(0, 20).filter(function (item) {
      return Boolean(item);
    });
    if (changed) writeNotificationState(state);
    return items;
  }

  function saveNotifications(items) {
    var current = loadNotifications();
    var state = readNotificationState();
    var nextByKey = {};
    var nowIso = new Date().toISOString();
    (Array.isArray(items) ? items : []).forEach(function (item) {
      var key = notificationStateKey(item);
      if (key) nextByKey[key] = item;
    });
    current.forEach(function (item) {
      var key = notificationStateKey(item);
      var nextItem = key ? nextByKey[key] : null;
      var baseTime;
      if (!key) return;
      if (!nextItem) {
        state[key] = Object.assign({}, state[key] || {}, {
          dismissed: true,
          dismissedAt: nowIso
        });
        return;
      }
      if (nextItem.read) {
        baseTime = notificationTimestamp(item.createdAt) || Date.now();
        state[key] = Object.assign({}, state[key] || {}, {
          read: true,
          readAt: nextItem.readAt || nowIso,
          readExpiresAt: nextItem.readExpiresAt || new Date(baseTime + NOTIFICATION_READ_RETENTION_MS).toISOString()
        });
      }
    });
    writeNotificationState(state);
    window.dispatchEvent(new CustomEvent("site:notificationschange"));
  }

  function normalizeNotifications(items) {
    var seenKeys = {};
    return (Array.isArray(items) ? items : []).map(function (item) {
      return normalizeNotificationItem(item);
    }).filter(function (item) {
      var key;
      if (!item) return false;
      key = notificationDedupeKey(item);
      if (isRetiredNotificationKey(key)) return false;
      if (key && seenKeys[key]) return false;
      if (key) seenKeys[key] = true;
      return true;
    }).slice(0, 20);
  }

  function normalizeNotificationItem(item) {
    var key;
    var createdAt;
    var output;
    if (!item || typeof item !== "object") return null;
    createdAt = String(item.createdAt || item.created_at || "1970-01-01T00:00:00.000Z");
    output = {
      id: String(item.id || ""),
      status: notificationStatus(item.status),
      tag: String(item.tag || "Updated"),
      title: String(item.title || ""),
      description: String(item.description || ""),
      href: String(item.href || "notifications.html"),
      key: String(item.key || item.notificationKey || item.notification_key || "").slice(0, 255),
      createdAt: createdAt
    };
    if (!output.title && !output.description) return null;
    key = notificationDedupeKey(output);
    output.key = key;
    output.id = output.id || notificationIdFromParts(key, createdAt, output.title);
    return output;
  }

  function notificationIdFromParts(key, createdAt, title) {
    return "notification-" + notificationHash([key, createdAt, title].join("\u001f"));
  }

  function notificationHash(value) {
    var hash = 0;
    var text = String(value || "");
    var index;
    for (index = 0; index < text.length; index++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function notificationStateKey(item) {
    return item && (item.id || notificationDedupeKey(item)) || "";
  }

  function readNotificationState() {
    try {
      var state = JSON.parse(localStorage.getItem(NOTIFICATION_STATE_KEY) || "{}");
      return state && typeof state === "object" && !Array.isArray(state) ? state : {};
    } catch (error) {
      return {};
    }
  }

  function writeNotificationState(state) {
    try {
      localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state || {}));
    } catch (error) {}
  }

  function clearLegacyNotifications() {
    try {
      if (localStorage.getItem(LEGACY_NOTIFICATIONS_KEY)) {
        localStorage.removeItem(LEGACY_NOTIFICATIONS_KEY);
      }
    } catch (error) {}
  }

  function notificationDedupeKey(item) {
    if (!item) return "";
    return item.key || [item.status || "", item.tag || "", item.title || "", item.description || "", item.href || ""].join("\u001f");
  }

  function isRetiredNotificationKey(key) {
    return key === "admin:home" || key === "admin:projects" || key === "admin:pages";
  }

  function notificationTimestamp(value) {
    if (!value) return 0;
    var time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function notificationReadExpiryTime(item, fallbackBase) {
    var explicit = notificationTimestamp(item.readExpiresAt);
    if (explicit) return explicit;
    var base = notificationTimestamp(item.createdAt) || notificationTimestamp(item.readAt) || fallbackBase || Date.now();
    return base + NOTIFICATION_READ_RETENTION_MS;
  }

  function markNotificationRead(notification) {
    var baseTime = notificationTimestamp(notification.createdAt) || Date.now();
    notification.read = true;
    notification.readAt = notification.readAt || new Date().toISOString();
    notification.readExpiresAt = notification.readExpiresAt || new Date(baseTime + NOTIFICATION_READ_RETENTION_MS).toISOString();
    return notification;
  }

  function addNotification(options) {
    notificationSaveQueue = notificationSaveQueue.catch(function () {}).then(function () {
      return saveNotificationToSite(options || {});
    }).catch(function (error) {
      console.warn("Unable to save notification.", error);
    });
    return notificationSaveQueue;
  }

  function saveNotificationToSite(options) {
    var data = window.SiteStore && window.SiteStore.current ? window.SiteStore.current() : (appState.data || {});
    var now = new Date().toISOString();
    var notification = normalizeNotificationItem({
      id: "notification-" + notificationHash([(options.key || ""), now, Math.random()].join("\u001f")),
      status: options.status || "info",
      tag: options.tag || "Updated",
      title: options.title || "Content updated",
      description: options.description || "",
      href: options.href || "notifications.html",
      key: options.key || "",
      createdAt: now
    });
    var key = notificationDedupeKey(notification);
    var items;
    if (!notification || !window.SiteStore || !window.SiteStore.save) return Promise.resolve();
    items = normalizeNotifications(data.notifications || []).filter(function (item) {
      return notificationDedupeKey(item) !== key;
    });
    items.unshift(notification);
    data.notifications = normalizeNotifications(items);
    appState.data = data;
    renderNotifications();
    if (document.body.dataset.page === "notifications") renderNotificationsPage();
    return window.SiteStore.save(data).then(function (savedData) {
      appState.data = savedData;
      renderNotifications();
      if (document.body.dataset.page === "notifications") renderNotificationsPage();
      return savedData;
    });
  }

  function notificationIcon(status) {
    if (status === "success") return "nds-hgi-checkmark-circle-01";
    if (status === "warning") return "nds-hgi-alert-circle";
    if (status === "error") return "nds-hgi-cancel-circle";
    return "nds-hgi-notification-02";
  }

  function notificationStatus(status) {
    return ["success", "info", "warning", "error"].indexOf(status) !== -1 ? status : "info";
  }

  function notificationArabicText(value) {
    var translations = {
      "Updated": "تحديث",
      "New": "جديد",
      "Content updated": "تم تحديث المحتوى",
      "Main page updated": "تم تحديث الصفحة الرئيسية",
      "New project added": "تمت إضافة مشروع جديد",
      "Projects updated": "تم تحديث المشاريع",
      "New page added": "تمت إضافة صفحة جديدة",
      "Pages updated": "تم تحديث الصفحات",
      "Home biography, hero, contact, or profile content was saved from the admin dashboard.": "تم حفظ محتوى السيرة أو القسم الرئيسي أو التواصل أو الملف الشخصي من لوحة الإدارة.",
      "A new project was added from the admin dashboard.": "تمت إضافة مشروع جديد من لوحة الإدارة.",
      "Project content was updated from the admin dashboard.": "تم تحديث محتوى المشاريع من لوحة الإدارة.",
      "A new page was added from the admin dashboard.": "تمت إضافة صفحة جديدة من لوحة الإدارة.",
      "Page content or visibility was updated from the admin dashboard.": "تم تحديث محتوى الصفحات أو ظهورها في التنقل من لوحة الإدارة."
    };
    return translations[value] || value || "";
  }

  function notificationItemInnerMarkup(item) {
    var status = notificationStatus(item.status);
    return [
      '<span class="nds-featured-icon nds-sm">',
      '<i class="nds-icon ' + notificationIcon(status) + '" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-drawer-item">',
      '<span class="nds-drawer-item-head">',
      '<span class="nds-tag nds-xs" data-status="' + status + '">',
      '<span class="nds-label">' + escapeHtml(notificationArabicText(item.tag)) + '</span>',
      '</span>',
      '<span class="nds-label nds-truncate">' + escapeHtml(notificationArabicText(item.title)) + '</span>',
      '</span>',
      '<span class="nds-description">' + escapeHtml(notificationArabicText(item.description)) + '</span>',
      '</span>'
    ].join("");
  }

  function notificationActionsMarkup(item) {
    return [
      '<ul>',
      '<li>',
      '<div class="nds-flex nds-row">',
      '<a href="#" class="nds-btn nds-subtle nds-sm" data-notification-read>',
      '<i class="nds-icon nds-hgi-checkmark-circle-01" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationMarkReadLabel", "تحديد كمقروء")) + '</span>',
      '</a>',
      '<a href="' + escapeHtml(item.href || "admin.html") + '" class="nds-btn nds-subtle nds-sm" data-notification-view>',
      '<i class="nds-icon nds-hgi-eye" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationViewLabel", "عرض")) + '</span>',
      '</a>',
      '<a href="#" class="nds-btn nds-destructive nds-sm" data-notification-dismiss>',
      '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationDeleteLabel", "حذف")) + '</span>',
      '</a>',
      '</div>',
      '</li>',
      '</ul>'
    ].join("");
  }

  function notificationMarkup(item, index, expandableIndex) {
    var itemAttribute = ' data-notification-id="' + escapeHtml(item.id) + '"' + (item.read ? ' data-notification-read-state="read"' : '');
    if (!item.read && index === expandableIndex) {
      return [
        '<li' + itemAttribute + '>',
        '<button type="button" class="nds-btn nds-subtle nds-menu-btn nds-indicator" aria-expanded="false">',
        notificationItemInnerMarkup(item),
        '</button>',
        notificationActionsMarkup(item),
        '</li>'
      ].join("");
    }

    return [
      '<li' + itemAttribute + '>',
      '<a href="' + escapeHtml(item.href || "notifications.html") + '" class="nds-btn nds-subtle nds-indicator">',
      notificationItemInnerMarkup(item),
      '</a>',
      '</li>'
    ].join("");
  }

  function notificationsDropdownMarkup(items, drawerMinWidth) {
    var expandableIndex = items.findIndex(function (item) { return !item.read; });
    return [
      '<div class="nds-dropdown-menu nds-fit" data-notifications-menu>',
      '<div class="nds-dropdown-content">',
      '<div class="nds-column">',
      '<nav class="nds-drawer" style="--drawer-max-height: 40svh; min-width: ' + drawerMinWidth + '; max-width: 100%;">',
      '<div class="nds-scroll-more nds-divided">',
      '<ul class="nds-drawer-list nds-scroll-more-content">',
      (items.length ? items.map(function (item, index) { return notificationMarkup(item, index, expandableIndex); }).join("") : emptyNotificationsMarkup()),
      '</ul>',
      '</div>',
      '</nav>',
      '<hr class="nds-divider">',
      '<a href="notifications.html" class="nds-btn nds-subtle nds-full">',
      '<i class="nds-icon nds-hgi-notification-02" aria-hidden="true"></i>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationsViewAllLabel", "عرض كل الإشعارات")) + '</span>',
      '</a>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function refreshNotificationComponents(root) {
    var scope = root || document;
    if (window.NDS && window.NDS.Drawer && window.NDS.Drawer.create) {
      qsa(".nds-drawer", scope).forEach(function (drawer) {
        window.NDS.Drawer.create(drawer);
      });
    }
    if (window.NDS && window.NDS.ScrollMore && window.NDS.ScrollMore.create) {
      qsa(".nds-scroll-more", scope).forEach(function (scrollMore) {
        window.NDS.ScrollMore.create(scrollMore);
      });
    }
  }

  function notificationRootMode(root) {
    return root && root.hasAttribute("data-mobile-notifications-root") ? "mobile" : "desktop";
  }

  function notificationRootForMode(mode) {
    return mode === "mobile" ? qs("[data-mobile-notifications-root]") : qs("[data-notifications-root]");
  }

  function setNotificationDropdownOpen(root) {
    if (!root) return;
    root.dataset.state = "open opened";
    root.setAttribute("data-state", "open opened");
    var trigger = qs("[data-notifications-trigger]", root);
    if (trigger) {
      trigger.dataset.state = "active";
      trigger.setAttribute("data-state", "active");
      trigger.setAttribute("aria-expanded", "true");
    }
    refreshNotificationComponents(root);
    if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.show) {
      window.NDS.Backdrop.show({ zIndex: 999, onClick: closeNotificationDropdown });
    }
  }

  function keepNotificationDropdownOpen(root) {
    var mode = notificationRootMode(root);
    window.requestAnimationFrame(function () {
      setNotificationDropdownOpen(notificationRootForMode(mode));
    });
    window.setTimeout(function () {
      setNotificationDropdownOpen(notificationRootForMode(mode));
    }, 80);
  }

  function rememberNotificationDropdownOpen(root) {
    try {
      window.sessionStorage.setItem(NOTIFICATIONS_KEEP_OPEN_KEY, notificationRootMode(root));
    } catch (error) {}
  }

  function restoreRememberedNotificationDropdown() {
    var mode = "";
    try {
      mode = window.sessionStorage.getItem(NOTIFICATIONS_KEEP_OPEN_KEY) || "";
      if (mode) window.sessionStorage.removeItem(NOTIFICATIONS_KEEP_OPEN_KEY);
    } catch (error) {}
    if (!mode) return;
    window.requestAnimationFrame(function () {
      setNotificationDropdownOpen(notificationRootForMode(mode));
    });
  }

  function emptyNotificationsMarkup() {
    return [
      '<li>',
      '<div class="notification-empty">',
      '<span class="nds-featured-icon nds-sm">',
      '<i class="nds-icon nds-hgi-notification-02" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationsEmptyTitle", "لا توجد إشعارات بعد")) + '</span>',
      '</div>',
      '</li>'
    ].join("");
  }

  function renderNotifications() {
    var actions = qs(".header-actions");
    if (!actions) return;
    if (appState.data) updateHeaderActions(appState.data);

    var existing = qs("[data-notifications-root]");
    if (!existing || existing.tagName !== "LI") {
      var next = document.createElement("li");
      if (existing) existing.replaceWith(next);
      existing = next;
      existing.dataset.notificationsRoot = "true";
      if (!existing.parentElement) actions.insertBefore(existing, actions.firstChild);
    }
    existing.className = "nds-nav-item nds-dropdown nds-icon-only notification-dropdown";

    var items = loadNotifications();
    var unreadCount = items.filter(function (item) { return !item.read; }).length;
    existing.dataset.state = existing.dataset.state || "";
    existing.innerHTML = [
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator notification-trigger" type="button" title="' + escapeHtml(uiText(appState.data, "notificationsLabel", "الإشعارات")) + '" data-state="' + (existing.dataset.state.indexOf("open") !== -1 ? "active" : "") + '" aria-expanded="' + (existing.dataset.state.indexOf("open") !== -1 ? "true" : "false") + '" data-notifications-trigger>',
      '<i class="nds-icon nds-hgi-notification-02 nav-notification-icon" aria-hidden="true">' + (unreadCount ? '<span class="nds-badge">' + Math.min(unreadCount, 99) + '</span>' : '') + '</i>',
      '</button>',
      notificationsDropdownMarkup(items, "min(820px, calc(100vw - 48px))")
    ].join("");
    refreshNotificationComponents(existing);
    restoreRememberedNotificationDropdown();
  }

  function openNotifications() {
    var trigger = qs(".mobile-notifications-shortcut [data-notifications-trigger]") || qs("[data-notifications-root] [data-notifications-trigger]");
    if (trigger) trigger.click();
  }

  function dismissNdsHeaderOverlays() {
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
      window.NDS.Mainnav.dismissOverlays();
      return true;
    }
    return false;
  }

  function hasVisibleManagedOverlay() {
    return Boolean(
      qs(".nds-modal:not([hidden])[aria-hidden='false']")
      || qs(".nds-dropdown[data-state~='open'], .nds-dropdown[data-state~='opening']")
      || qs("[data-nav-panel][data-state~='open'], [data-nav-panel][data-state~='opening']")
    );
  }

  function resetBackdropWhenIdle() {
    window.setTimeout(function () {
      if (hasVisibleManagedOverlay()) return;
      if (window.NDS && window.NDS.Modal && window.NDS.Modal.isOpen && window.NDS.Modal.isOpen()) return;
      if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.isActive && window.NDS.Backdrop.isActive()) {
        if (window.NDS.Backdrop.reset) {
          window.NDS.Backdrop.reset();
        } else {
          window.NDS.Backdrop.hide();
        }
      }
    }, 140);
  }

  function syncNotificationTriggerState(root) {
    if (!root) return;
    var trigger = qs("[data-notifications-trigger]", root);
    if (!trigger) return;
    var isOpen = (root.dataset.state || "").indexOf("open") !== -1;
    trigger.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      trigger.dataset.state = "active";
    } else {
      trigger.dataset.state = "";
      trigger.removeAttribute("data-state");
    }
  }

  function syncAllNotificationTriggerStates() {
    qsa("[data-notifications-root], [data-mobile-notifications-root]").forEach(syncNotificationTriggerState);
  }

  function queueNotificationTriggerStateSync(root) {
    var sync = root ? function () { syncNotificationTriggerState(root); } : syncAllNotificationTriggerStates;
    window.requestAnimationFrame(function () {
      sync();
    });
    window.setTimeout(function () {
      sync();
    }, 360);
  }

  function setupNotifications() {
    document.addEventListener("click", function (event) {
      queueNotificationTriggerStateSync();

      if (event.target.closest("[data-mobile-admin-shortcut], .mobile-account-trigger")) {
        closeNotificationDropdown({ localOnly: true });
      }

      if (event.target.closest("[data-mobile-theme-shortcut], .nds-mainNav-toggler")) {
        closeNotificationDropdown({ localOnly: true });
        closeMobileAccountDropdown({ localOnly: true });
      }

      if (event.target.closest("[data-mobile-notifications-root] [data-notifications-trigger]")) {
        closeMobileAccountDropdown({ localOnly: true });
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        var mobileRoot = event.target.closest("[data-mobile-notifications-root]");
        var mobileTrigger = qs("[data-notifications-trigger]", mobileRoot);
        var willOpen = mobileRoot && (mobileRoot.dataset.state || "").indexOf("open") === -1;
        if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.toggleDropdown) {
          window.NDS.Mainnav.toggleDropdown(event);
        } else {
          if (mobileRoot) mobileRoot.dataset.state = willOpen ? "open opened" : "";
          if (mobileTrigger) mobileTrigger.setAttribute("aria-expanded", String(willOpen));
        }
        syncNotificationTriggerState(mobileRoot);
        queueNotificationTriggerStateSync(mobileRoot);
        return;
      }

      if (event.target.closest("[data-notifications-trigger]")) {
        var notificationTrigger = event.target.closest("[data-notifications-trigger]");
        var notificationRoot = notificationTrigger && notificationTrigger.closest("[data-notifications-root], [data-mobile-notifications-root]");
        queueNotificationTriggerStateSync(notificationRoot);
        closeNavPanel();
      }

      if (event.target.closest(".header-admin-link, .mobile-account-trigger, [data-mobile-admin-shortcut], .nds-mainNav-toggler")) {
        closeNotificationDropdown({ localOnly: true });
      }

      var item = event.target.closest("[data-notification-id]");
      var actionRoot = item && item.closest("[data-notifications-root], [data-mobile-notifications-root]");
      if (event.target.closest("[data-notification-view]") && item && actionRoot) {
        var viewLink = event.target.closest("[data-notification-view]");
        var viewHref = viewLink && viewLink.getAttribute("href") || "notifications.html";
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== item.dataset.notificationId;
        }));
        rememberNotificationDropdownOpen(actionRoot);
        window.location.href = viewHref;
        return;
      }
      if (event.target.closest("[data-notification-read]") && item && actionRoot) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        saveNotifications(loadNotifications().map(function (notification) {
          if (notification.id === item.dataset.notificationId) markNotificationRead(notification);
          return notification;
        }));
        keepNotificationDropdownOpen(actionRoot);
        return;
      }
      if (event.target.closest("[data-notification-dismiss]") && item && actionRoot) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== item.dataset.notificationId;
        }));
        keepNotificationDropdownOpen(actionRoot);
        return;
      }
    });

    window.addEventListener("site:notificationschange", renderNotifications);
    window.addEventListener("resize", renderNotifications);
  }

  function closeNotificationDropdown(options) {
    if (!(options && options.localOnly)) dismissNdsHeaderOverlays();
    qsa("[data-notifications-root], [data-mobile-notifications-root]").forEach(function (root) {
      root.dataset.state = "";
      root.removeAttribute("data-state");
      var trigger = qs("[data-notifications-trigger]", root);
      if (trigger) {
        trigger.dataset.state = "";
        trigger.removeAttribute("data-state");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    resetBackdropWhenIdle();
  }

  function closeMobileAccountDropdown(options) {
    if (!(options && options.localOnly)) dismissNdsHeaderOverlays();
    qsa("[data-mobile-admin-shortcut]").forEach(function (root) {
      root.dataset.state = "";
      root.removeAttribute("data-state");
      var trigger = qs(".mobile-account-trigger", root);
      if (trigger) {
        trigger.dataset.state = "";
        trigger.removeAttribute("data-state");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    resetBackdropWhenIdle();
  }

  function closeNavPanel(options) {
    var nav = qs("[data-nav-panel]");
    var toggler = qs(".nds-mainNav-toggler");
    var button = qs("[data-nav-toggle]");
    if (!nav || (nav.dataset.state || "").split(/\s+/).indexOf("open") === -1) return;

    if (!(options && options.instant) && window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.toggleNavbar) {
      window.NDS.Mainnav.toggleNavbar();
      return;
    }

    nav.dataset.state = "";
    nav.removeAttribute("data-state");
    if (toggler) {
      toggler.dataset.state = "";
      toggler.removeAttribute("data-state");
    }
    if (button) button.setAttribute("aria-expanded", "false");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setupNavToggle() {
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.init) return;
    var button = qs("[data-nav-toggle]");
    var nav = qs("[data-nav-panel]");
    if (!button || !nav) return;

    button.addEventListener("click", function () {
      var open = (nav.dataset.state || "").split(/\s+/).indexOf("open") !== -1;
      var toggler = button.closest(".nds-mainNav-toggler");
      nav.dataset.state = open ? "" : "open opened";
      if (toggler) toggler.dataset.state = open ? "" : "open";
      button.setAttribute("aria-expanded", String(!open));
    });
  }

  function setupDropmenus() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest(".nav-pages-trigger");
      if (trigger) {
        var item = trigger.closest(".nav-pages-item");
        var menu = item ? qs(".nav-pages-menu", item) : null;
        var willOpen = menu && menu.hidden;
        closeNavDropmenus(item);
        if (menu) {
          menu.hidden = !willOpen;
          trigger.setAttribute("aria-expanded", String(willOpen));
          item.dataset.state = willOpen ? "open" : "";
        }
        return;
      }
      if (!event.target.closest(".nav-pages-item")) closeNavDropmenus();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNavDropmenus();
    });
  }

  function normalizeSiteSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[إأآا]/g, "ا")
      .replace(/[ىئ]/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\u0600-\u06FFa-z0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function siteSearchCandidates(data) {
    data = data || {};
    data.home = data.home || {};
    data.settings = data.settings || {};
    var candidates = [];
    allNavigationItems(data).forEach(function (item) {
      candidates.push({ href: item.href, text: item.label + " " + item.key });
    });
    visibleItems(data.projects || []).forEach(function (project, index) {
      candidates.push({
        href: "project.html?id=" + index,
        text: [project.title, project.description, project.category, project.status, project.date].join(" ")
      });
    });
    publicPageItems(data).forEach(function (page) {
      candidates.push({
        href: "index.html#/page/" + encodeURIComponent(page.slug),
        text: [page.title, page.slug, page.content].join(" ")
      });
    });
    candidates.push({
      href: "index.html",
      text: [
        data.settings.siteName,
        data.settings.brandName,
        data.settings.brandSlogan,
        data.home.ownerName,
        data.home.title,
        data.home.intro,
        data.home.biography
      ].join(" ")
    });
    return candidates;
  }

  function setupSiteSearch() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest(".site-search-dropdown > .nds-nav-link");
      if (!trigger) return;
      var root = trigger.closest(".site-search-dropdown");
      window.setTimeout(function () {
        var input = root ? qs(".site-search-input", root) : null;
        if (input && root.dataset.state && root.dataset.state.indexOf("open") !== -1) input.focus();
      }, 180);
    });

    document.addEventListener("submit", function (event) {
      var form = event.target.closest("[data-site-search-form]");
      if (!form) return;
      event.preventDefault();
      var queryInput = qs('[name="q"]', form);
      var query = normalizeSiteSearchText(queryInput ? queryInput.value : "");
      if (!query) {
        showToast("اكتب كلمة للبحث داخل الموقع", "info");
        if (queryInput) queryInput.focus();
        return;
      }
      var terms = query.split(/\s+/).filter(Boolean);
      var data = appState.data || (window.SiteStore && window.SiteStore.current ? window.SiteStore.current() : {});
      var match = siteSearchCandidates(data).find(function (candidate) {
        var haystack = normalizeSiteSearchText(candidate.text);
        return terms.every(function (term) { return haystack.indexOf(term) !== -1; });
      });
      if (match) {
        if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
          window.NDS.Mainnav.dismissOverlays();
        }
        window.location.href = match.href;
      } else {
        showToast("لم يتم العثور على نتيجة مطابقة", "info");
      }
    });
  }

  function setupHeaderNavScrollEvents() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-nav-scroll]");
      if (!button) return;
      var panel = button.closest("[data-nav-panel]");
      var list = panel ? qs("[data-nav-list]", panel) : null;
      if (!list) return;
      if (window.matchMedia("(max-width: 960px)").matches) {
        var verticalAmount = Math.max(180, Math.floor(list.clientHeight * 0.82));
        var atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 8;
        list.scrollTo({ top: atEnd ? 0 : list.scrollTop + verticalAmount, behavior: "smooth" });
        window.setTimeout(function () { updateMobileNavScrollControl(list); }, 260);
        return;
      }
      var amount = Math.max(180, Math.floor(list.clientWidth * 0.72));
      list.scrollBy({ left: button.dataset.navScroll === "next" ? -amount : amount, behavior: "smooth" });
    });

    document.addEventListener("wheel", function (event) {
      var list = event.target.closest("[data-nav-list]");
      if (!list || window.matchMedia("(max-width: 960px)").matches || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      list.scrollLeft += event.deltaY;
    }, { passive: false });

    document.addEventListener("scroll", function (event) {
      var list = event.target && event.target.matches && event.target.matches("[data-nav-list]") ? event.target : null;
      if (list) updateMobileNavScrollControl(list);
    }, true);
  }

  function updateMobileNavScrollControl(list) {
    var panel = list && list.closest("[data-nav-panel]");
    var button = panel ? qs(".nds-show-more [data-nav-scroll]", panel) : null;
    var control = button ? button.closest(".nds-show-more") : null;
    if (!button) return;
    var hasOverflow = list.scrollHeight > list.clientHeight + 8;
    var atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 8;
    if (control) control.hidden = !hasOverflow;
    button.hidden = false;
    button.setAttribute("aria-label", atEnd ? "العودة إلى أعلى التنقل" : "عرض المزيد من روابط التنقل");
    button.title = atEnd ? "أعلى" : "المزيد";
    var icon = qs(".nds-icon", button);
    if (icon) {
      icon.classList.toggle("nds-hgi-arrow-down-01", !atEnd);
      icon.classList.toggle("nds-hgi-arrow-up-01", atEnd);
    }
  }

  function closeNavDropmenus(except) {
    qsa(".nav-pages-item").forEach(function (item) {
      if (item === except) return;
      var trigger = qs(".nav-pages-trigger", item);
      var menu = qs(".nav-pages-menu", item);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menu) menu.hidden = true;
      item.dataset.state = "";
    });
  }

  function setupThemeToggle() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-theme-toggle]");
      if (!button) return;
      toggleTheme(button);
    });
  }

  function toggleTheme(origin) {
    var data = appState.data || window.SiteStore.current();
    var current = data.settings.theme || localStorage.getItem("websiteDemo:theme") || "light";
    var next = current === "dark" ? "light" : "dark";
    data.settings.theme = next;
    appState.data = data;
    applyTheme(next, true, origin);
    if (isAdminAuthenticated()) {
      window.SiteStore.save(data).then(function (savedData) {
        appState.data = savedData;
      }).catch(function () {});
    }
  }

  function applyTheme(theme, announce, origin) {
    var next = theme === "dark" ? "dark" : "light";
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (origin && !reducedMotion) {
      applyThemeWithMotion(next, origin);
    } else {
      commitTheme(next);
    }

    if (announce) return;
  }

  function commitTheme(next) {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("websiteDemo:theme", next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(next) {
    qsa("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", next === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي");
      button.setAttribute("aria-pressed", String(next === "dark"));
      button.dataset.theme = next;
      button.title = next === "dark" ? "الوضع النهاري" : "الوضع الليلي";
      var icon = qs(".nds-icon", button);
      if (icon) {
        icon.classList.toggle("nds-hgi-moon-02", next !== "dark");
        icon.classList.toggle("nds-hgi-sun-03", next === "dark");
      }
    });
  }

  function applyThemeWithMotion(next, origin) {
    var point = themeRevealPoint(origin);

    if (!document.startViewTransition) {
      fallbackThemeReveal(next, point);
      return;
    }

    document.documentElement.classList.add("theme-transitioning");
    document.documentElement.style.setProperty("--theme-reveal-x", point.x + "px");
    document.documentElement.style.setProperty("--theme-reveal-y", point.y + "px");

    var transition;
    try {
      transition = document.startViewTransition(function () {
        commitTheme(next);
      });
    } catch (error) {
      document.documentElement.classList.remove("theme-transitioning");
      fallbackThemeReveal(next, point);
      return;
    }

    transition.ready.then(function () {
      document.documentElement.animate(
        {
          clipPath: [
            "circle(0px at " + point.x + "px " + point.y + "px)",
            "circle(" + point.radius + "px at " + point.x + "px " + point.y + "px)"
          ]
        },
        {
          duration: 720,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    }).catch(function () {});

    transition.finished.finally(function () {
      document.documentElement.classList.remove("theme-transitioning");
      document.documentElement.style.removeProperty("--theme-reveal-x");
      document.documentElement.style.removeProperty("--theme-reveal-y");
    });
  }

  function themeRevealPoint(origin) {
    var rect = origin.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    return {
      x: x,
      y: y,
      radius: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 56
    };
  }

  function fallbackThemeReveal(next, point) {
    document.documentElement.classList.add("theme-transitioning");
    var layer = document.createElement("div");
    layer.className = "theme-reveal-layer";
    layer.style.setProperty("--theme-reveal-x", point.x + "px");
    layer.style.setProperty("--theme-reveal-y", point.y + "px");
    layer.style.setProperty("--theme-reveal-radius", point.radius + "px");
    layer.style.background = next === "dark" ? "#0b1220" : "#f9fafb";
    document.body.append(layer);

    var reveal = layer.animate(
      {
        clipPath: [
          "circle(0px at " + point.x + "px " + point.y + "px)",
          "circle(" + point.radius + "px at " + point.x + "px " + point.y + "px)"
        ]
      },
      {
        duration: 720,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards"
      }
    );

    reveal.onfinish = function () {
      commitTheme(next);
      layer.animate({ opacity: [1, 0] }, { duration: 220, easing: "ease", fill: "forwards" }).onfinish = function () {
        document.documentElement.classList.remove("theme-transitioning");
        layer.remove();
      };
    };
  }

  function setupClock() {
    updateClock();
    clearInterval(appState.clockTimer);
    appState.clockTimer = setInterval(updateClock, 30000);
  }

  function updateClock() {
    updateHeaderDateTime();
  }

  function oldUpdateClock() {
    var nodes = qsa("[data-date-time]");
    if (!nodes.length) return;
    var now = new Date();
    var hijriParts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).formatToParts(now).reduce(function (acc, part) {
      acc[part.type] = part.value;
      return acc;
    }, {});
    var hijriMonth = (hijriParts.month || "").replace("Dhuʻl", "Dhu al").replace("Dhu'l", "Dhu al");
    var dateLabel = [hijriParts.day, hijriMonth, hijriParts.year, hijriParts.era || "AH"].filter(Boolean).join(" ");
    var timeLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(now);
    dateLabel = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "long",
      day: "numeric",
      era: "short",
      numberingSystem: "arab"
    }).format(now);
    timeLabel = new Intl.DateTimeFormat("ar-SA", {
      timeZone: "Asia/Riyadh",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      numberingSystem: "arab"
    }).format(now);
    nodes.forEach(function (node) {
      node.dateTime = now.toISOString();
      node.innerHTML = [
        '<span class="site-datetime-item"><i class="nds-icon nds-hgi-calendar-03" aria-hidden="true"></i><span>' + dateLabel + '</span></span>',
        '<span class="site-datetime-item"><i class="nds-icon nds-hgi-clock-01" aria-hidden="true"></i><span>' + timeLabel + '</span></span>'
      ].join("");
    });
  }

  function updateHeaderDateTime() {
    var nodes = qsa("[data-date-time]");
    var dateNodes = qsa("[data-date-part]");
    var timeNodes = qsa("[data-time-part]");
    if (!nodes.length && !dateNodes.length && !timeNodes.length) return;
    var now = new Date();
    var dateLabel = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "long",
      day: "numeric",
      era: "short",
      numberingSystem: "arab"
    }).format(now);
    var compactDateLabel = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      timeZone: "Asia/Riyadh",
      month: "numeric",
      day: "numeric",
      numberingSystem: "arab"
    }).format(now);
    var timeLabel = new Intl.DateTimeFormat("ar-SA", {
      timeZone: "Asia/Riyadh",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      numberingSystem: "arab"
    }).format(now);
    nodes.forEach(function (node) {
      var compact = node.hasAttribute("data-compact-date-time");
      var displayDate = compact ? compactDateLabel : dateLabel;
      node.dateTime = now.toISOString();
      node.title = dateLabel + " - " + timeLabel;
      node.innerHTML = [
        '<span class="site-datetime-item"><i class="nds-icon nds-hgi-calendar-03" aria-hidden="true"></i><span>' + displayDate + '</span></span>',
        '<span class="site-datetime-item"><i class="nds-icon nds-hgi-clock-01" aria-hidden="true"></i><span>' + timeLabel + '</span></span>'
      ].join("");
    });
    dateNodes.forEach(function (node) {
      node.title = dateLabel;
      node.innerHTML = '<i class="nds-icon nds-hgi-calendar-03" aria-hidden="true"></i><span class="text">' + dateLabel + '</span>';
    });
    timeNodes.forEach(function (node) {
      node.title = timeLabel;
      node.innerHTML = '<i class="nds-icon nds-hgi-clock-01" aria-hidden="true"></i><span class="text">' + timeLabel + '</span>';
    });
  }

  function getPageSlug() {
    var match = location.hash.match(/^#\/page\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function renderHome(data) {
    var homeView = qs("[data-home-view]");
    var pageView = qs("[data-extra-page-view]");
    var slug = getPageSlug();

    if (slug) {
      if (homeView) homeView.hidden = true;
      if (pageView) pageView.hidden = false;
      renderExtraPage(data, slug);
      return;
    }

    if (homeView) homeView.hidden = false;
    if (pageView) pageView.hidden = true;

    var home = data.home || {};
    var hasContent = hasHomeContent(home);
    var hasHero = hasHomeHeroContent(home);
    var hasBody = hasHomeBodyContent(home);
    var empty = qs("[data-home-empty]");
    var content = qs("[data-home-content]");
    var hero = qs("[data-home-hero]");
    var bioSection = qs(".biography-section");
    var professionalSection = qs(".professional-section");
    var skillsSection = qs("[data-skills-section]");
    var visibleExperience = visibleItems(home.experience || []);
    var visibleAchievements = visibleItems(home.achievements || []);
    var visibleSkills = visibleItems(home.skills || []).filter(function (item) {
      return hasText(typeof item === "string" ? item : item.name);
    });

    if (hero) hero.hidden = !hasHero;
    if (empty) empty.hidden = hasContent;
    if (content) content.hidden = !hasBody;
    var avatarSrc = ownerAvatarSrc(data);
    if (bioSection) bioSection.hidden = ![home.ownerName, home.title, home.intro, home.biography, avatarSrc].some(hasText);
    if (professionalSection) professionalSection.hidden = !(visibleExperience.length || visibleAchievements.length);
    if (skillsSection) skillsSection.hidden = !visibleSkills.length;

    setText("[data-owner-name]", home.ownerName);
    setText("[data-owner-title]", home.title);
    setText("[data-owner-intro]", home.intro);
    setText("[data-owner-biography]", home.biography);

    var avatar = qs("[data-owner-avatar]");
    if (avatar) {
      avatar.hidden = !hasText(avatarSrc);
      if (hasText(avatarSrc)) {
        avatar.src = avatarSrc;
      } else {
        avatar.removeAttribute("src");
      }
    }

    renderHeroSlides(home);
    renderListCards("[data-experience-list]", visibleExperience, "الخبرات");
    renderListCards("[data-achievements-list]", visibleAchievements, "الإنجازات");
    renderChips("[data-skills-list]", visibleSkills);
  }

  function renderHeroSlides(home) {
    var root = qs("[data-hero-slides]");
    var controls = qs("[data-hero-controls]");
    var dots = qs("[data-hero-dots]");
    if (!root) return;

    var slides = visibleHeroSlides(home);
    if (!slides.length) slides = [{ image: "", mobileImage: "", video: "", mobileVideo: "", alt: "" }];
    if (appState.heroIndex >= slides.length) appState.heroIndex = 0;

    var signature = heroSlidesSignature(slides);
    if (root.dataset.heroSignature !== signature) {
      root.dataset.heroSignature = signature;
      root.innerHTML = "";
      slides.forEach(function (slide, index) {
        root.append(createHeroSlide(slide, index));
      });
      renderHeroDots(dots, slides.length);
    }

    if (controls) controls.hidden = slides.length <= 1;
    updateHeroState(root, dots, slides.length);
    setupHeroTimer(slides.length);
  }

  function heroSlidesSignature(slides) {
    return JSON.stringify(slides.map(function (slide) {
      return {
        title: slide.title || "",
        subtitle: slide.subtitle || "",
        intro: slide.intro || "",
        image: slide.image || "",
        mobileImage: slide.mobileImage || "",
        video: slide.video || "",
        mobileVideo: slide.mobileVideo || "",
        alt: slide.alt || ""
      };
    }));
  }

  function createHeroSlide(slide, index) {
    var article = el("article", "hero-slide");
    article.dataset.heroSlide = String(index);

    if (hasText(slide.video) || hasText(slide.mobileVideo)) {
      var video = document.createElement("video");
      video.className = "hero-slide-media hero-slide-video";
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = index === 0 ? "auto" : "metadata";
      video.setAttribute("aria-hidden", "true");
      if (hasText(slide.image) || hasText(slide.mobileImage)) video.poster = slide.image || slide.mobileImage;
      if (hasText(slide.mobileVideo)) {
        var mobileVideo = document.createElement("source");
        mobileVideo.media = "(max-width: 768px)";
        mobileVideo.src = slide.mobileVideo;
        mobileVideo.type = videoMimeType(slide.mobileVideo);
        video.append(mobileVideo);
      }
      var desktopVideo = document.createElement("source");
      desktopVideo.src = slide.video || slide.mobileVideo;
      desktopVideo.type = videoMimeType(slide.video || slide.mobileVideo);
      video.append(desktopVideo);
      article.append(video);
      appendHeroSlideCopy(article, slide);
      return article;
    }

    if (hasText(slide.image) || hasText(slide.mobileImage)) {
      var picture = document.createElement("picture");
      if (hasText(slide.mobileImage)) {
        var source = document.createElement("source");
        source.media = "(max-width: 768px)";
        source.srcset = slide.mobileImage;
        picture.append(source);
      }
      var image = document.createElement("img");
      image.className = "hero-slide-media hero-slide-image";
      image.src = slide.image || slide.mobileImage;
      image.alt = slide.alt || "";
      if (!hasText(slide.alt)) image.setAttribute("aria-hidden", "true");
      if (index === 0) image.fetchPriority = "high";
      picture.append(image);
      article.append(picture);
    }

    appendHeroSlideCopy(article, slide);
    return article;
  }

  function appendHeroSlideCopy(article, slide) {
    if (![slide.title, slide.subtitle, slide.intro].some(hasText)) return;
    var copy = el("div", "hero-slide-copy site-container");
    var inner = el("div", "hero-slide-copy-inner");
    if (hasText(slide.subtitle)) {
      var subtitle = el("p", "hero-slide-subtitle", slide.subtitle);
      inner.append(subtitle);
    }
    if (hasText(slide.title)) {
      var title = el("h2", "hero-slide-title", slide.title);
      inner.append(title);
    }
    if (hasText(slide.intro)) {
      var intro = el("p", "hero-slide-description", slide.intro);
      inner.append(intro);
    }
    copy.append(inner);
    article.append(copy);
  }

  function renderHeroDots(dots, count) {
    if (!dots) return;
    dots.innerHTML = "";
    for (var index = 0; index < count; index += 1) {
      var dot = el("button", "hero-dot");
      dot.type = "button";
      dot.dataset.heroDot = String(index);
      dot.setAttribute("aria-label", "عرض الشريحة " + (index + 1));
      dots.append(dot);
    }
  }

  function updateHeroState(root, dots, count) {
    if (!root) return;
    qsa(".hero-slide", root).forEach(function (slide, index) {
      slide.dataset.state = index === appState.heroIndex ? "active" : "";
      slide.setAttribute("aria-hidden", String(index !== appState.heroIndex));
    });
    qsa("[data-hero-dot]", dots || document).forEach(function (dot, index) {
      dot.dataset.state = index === appState.heroIndex ? "active" : "";
      dot.setAttribute("aria-current", index === appState.heroIndex ? "true" : "false");
    });
    syncHeroMedia(root);
  }

  function videoMimeType(path) {
    var cleanPath = String(path || "").split("?")[0].split("#")[0].toLowerCase();
    if (cleanPath.endsWith(".webm")) return "video/webm";
    if (cleanPath.endsWith(".ogv") || cleanPath.endsWith(".ogg")) return "video/ogg";
    return "video/mp4";
  }

  function syncHeroMedia(root) {
    qsa(".hero-slide-video", root).forEach(function (video) {
      var isActive = video.closest(".hero-slide").dataset.state === "active";
      if (isActive) {
        var playAttempt = video.play();
        if (playAttempt && playAttempt.catch) playAttempt.catch(function () {});
      } else {
        video.pause();
      }
    });
  }

  function setHeroIndex(index) {
    var home = (appState.data && appState.data.home) || window.SiteStore.current().home;
    var slides = visibleHeroSlides(home);
    var root = qs("[data-hero-slides]");
    var dots = qs("[data-hero-dots]");
    if (!slides.length || !root) return;
    appState.heroIndex = (index + slides.length) % slides.length;
    updateHeroState(root, dots, slides.length);
    setupHeroTimer(slides.length);
  }

  function setupHeroEvents() {
    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-hero-prev]")) setHeroIndex(appState.heroIndex - 1);
      if (event.target.closest("[data-hero-next]")) setHeroIndex(appState.heroIndex + 1);
      var dot = event.target.closest("[data-hero-dot]");
      if (dot) setHeroIndex(Number(dot.dataset.heroDot));
    });
  }

  function setupHeroTimer(count) {
    clearInterval(appState.heroTimer);
    if (count <= 1) return;
    appState.heroTimer = setInterval(function () {
      setHeroIndex(appState.heroIndex + 1);
    }, HERO_SLIDE_DURATION);
  }

  function renderExtraPage(data, slug) {
    var page = routablePageItems(data).find(function (item) { return item.slug === slug; });
    var titleNodes = qsa("[data-extra-page-title]");
    var body = qs("[data-extra-page-content]");
    if (!titleNodes.length || !body) return;

    body.innerHTML = "";
    if (!page) {
      titleNodes.forEach(function (node) { node.textContent = "الصفحة غير موجودة"; });
      updateDocumentTitle(data, "الصفحة غير موجودة");
      body.append(emptyState(uiText(data, "extraPageNotFoundTitle", "لم يتم العثور على الصفحة المطلوبة"), uiText(data, "extraPageNotFoundDescription", "يمكنك العودة إلى الصفحة الرئيسية أو إنشاء الصفحة من لوحة الإدارة.")));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = page.title || ""; });
    updateDocumentTitle(data, page.title || navigationLabel(data, "pagesLabel", "الصفحات"));
    if (!hasText(page.content)) {
      body.append(emptyState(uiText(data, "extraPageEmptyTitle", "لم تتم إضافة محتوى لهذه الصفحة بعد"), uiText(data, "extraPageEmptyDescription", "يمكن تعديل هذه الصفحة من لوحة الإدارة.")));
      return;
    }

    if ((page.contentMode || "text") === "html") {
      renderHtmlPageContent(body, page.content);
      if (window.NDSLocalComponents) window.NDSLocalComponents.refresh();
      setTimeout(function () {
        if (window.NDSLocalComponents) window.NDSLocalComponents.refresh();
      }, 0);
      return;
    }

    page.content.split(/\n{2,}/).forEach(function (paragraph) {
      if (!hasText(paragraph)) return;
      body.append(el("p", "content-paragraph", paragraph.trim()));
    });
  }

  function renderHtmlPageContent(root, html) {
    var wrapper = el("div", "rich-html-content");
    wrapper.lang = document.documentElement.lang || "ar";
    wrapper.dir = document.documentElement.dir || "rtl";
    var prepared = prepareTrustedHtml(html);
    /* Trusted local-admin HTML only. Do not use this as public-user input without server-side sanitization. */
    wrapper.innerHTML = prepared.html;
    root.append(wrapper);
    runTrustedScripts(wrapper, prepared.scripts).then(function () {
      if (window.NDSLocalComponents) window.NDSLocalComponents.refresh();
      window.dispatchEvent(new CustomEvent("site:trusted-html-ready", { detail: { root: wrapper } }));
    });
  }

  function prepareTrustedHtml(html) {
    var template = document.createElement("template");
    template.innerHTML = normalizeTrustedHtml(String(html || ""));
    var scripts = qsa("script", template.content).map(function (script) {
      var copy = { text: script.textContent || "", attrs: [] };
      Array.prototype.slice.call(script.attributes || []).forEach(function (attr) {
        copy.attrs.push({ name: attr.name, value: attr.value });
      });
      script.remove();
      return copy;
    });
    qsa("*", template.content).forEach(function (node) {
      Array.prototype.slice.call(node.attributes || []).forEach(function (attr) {
        if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
        if ((attr.name === "href" || attr.name === "src") && /^javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
      });
    });
    return { html: template.innerHTML, scripts: scripts };
  }

  function normalizeTrustedHtml(html) {
    if (!/<html[\s>]/i.test(html) && !/<body[\s>]/i.test(html) && !/<head[\s>]/i.test(html)) return html;
    var doc = new DOMParser().parseFromString(html, "text/html");
    var headAssets = qsa("style, link[rel='stylesheet'], script", doc.head).map(function (node) {
      return node.outerHTML;
    }).join("");
    return headAssets + (doc.body ? doc.body.innerHTML : html);
  }

  function runTrustedScripts(root, scripts) {
    var chain = Promise.resolve();
    scripts.forEach(function (item) {
      chain = chain.then(function () {
        return runTrustedScript(root, item);
      });
    });
    return chain;
  }

  function runTrustedScript(root, item) {
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      var hasSrc = false;
      item.attrs.forEach(function (attr) {
        if (/^on/i.test(attr.name)) return;
        script.setAttribute(attr.name, attr.value);
        if (attr.name.toLowerCase() === "src") hasSrc = true;
      });
      script.onload = resolve;
      script.onerror = resolve;
      script.textContent = wrapTrustedScriptText(item.text);
      root.append(script);
      if (!hasSrc) resolve();
    });
  }

  function wrapTrustedScriptText(text) {
    if (!hasText(text)) return "";
    return [
      "(function(){",
      "var originalAddEventListener = document.addEventListener.bind(document);",
      "document.addEventListener = function(type, listener, options) {",
      "if (type === 'DOMContentLoaded' && document.readyState !== 'loading' && typeof listener === 'function') {",
      "setTimeout(function(){ listener.call(document, new Event('DOMContentLoaded')); }, 0);",
      "return;",
      "}",
      "return originalAddEventListener(type, listener, options);",
      "};",
      "try {",
      text,
      "} finally {",
      "document.addEventListener = originalAddEventListener;",
      "}",
      "})();"
    ].join("\n");
  }

  function renderListCards(selector, items, label) {
    var root = qs(selector);
    if (!root) return;
    items = visibleItems(items || []);
    root.innerHTML = "";
    if (!items.length) {
      root.append(emptyState(uiText(appState.data, "homeListEmptyPrefix", "لم تتم إضافة ") + label + uiText(appState.data, "homeListEmptySuffix", " بعد"), uiText(appState.data, "homeListEmptyDescription", "يمكن إضافة العناصر من لوحة الإدارة.")));
      return;
    }
    items.forEach(function (item) {
      if (!item) return;
      var card = el("article", "nds-card nds-stroke nds-full compact-card");
      var content = el("div", "nds-card-content");
      var title = el("h3", "nds-card-title", item.title || "");
      title.dir = "rtl";
      content.append(title);
      if (hasText(item.meta)) {
        var meta = el("p", "nds-card-meta-text", item.meta);
        meta.dir = "rtl";
        content.append(meta);
      }
      if (hasText(item.description)) {
        var description = el("p", "nds-card-description", item.description);
        description.dir = "rtl";
        content.append(description);
      }
      card.append(content);
      root.append(card);
    });
  }

  function renderChips(selector, items) {
    var root = qs(selector);
    if (!root) return;
    items = visibleItems(items || []).map(function (item) {
      return typeof item === "string" ? item : item && item.name;
    }).filter(hasText);
    root.innerHTML = "";
    if (!items.length) {
      root.append(emptyState(uiText(appState.data, "skillsEmptyTitle", "لم تتم إضافة مجالات خبرة بعد"), uiText(appState.data, "skillsEmptyDescription", "يمكن إضافة المهارات من لوحة الإدارة.")));
      return;
    }
    items.forEach(function (item) {
      root.append(el("span", "nds-tag nds-green nds-sm", item));
    });
  }

  function contactIcon(item) {
    if (hasText(item.iconPath)) {
      var image = document.createElement("img");
      image.className = "contact-icon contact-icon-img";
      image.src = item.iconPath;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      return image;
    }

    if (isFooterAppIcon(item.iconType)) {
      var appIcon = footerAppIcon(item.iconType);
      appIcon.classList.add("contact-icon", "contact-icon-" + (item.iconType || "website"));
      appIcon.querySelectorAll("path").forEach(function (path) {
        path.setAttribute("fill", "currentColor");
      });
      return appIcon;
    }

    var icon = document.createElement("i");
    icon.className = "contact-icon contact-icon-" + (item.iconType || "website") + " " + contactIconClass(item.iconType);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function contactLabel(item) {
    if (hasText(item.label)) return item.label;
    var match = (window.CONTACT_ICON_OPTIONS || []).find(function (option) {
      return option.value === item.iconType;
    });
    return match ? match.label : "وسيلة تواصل";
  }

  function contactIconClass(type) {
    var icons = {
      linkedin: "nds-hgi-linkedin-02",
      facebook: "nds-hgi-facebook-02",
      instagram: "nds-hgi-instagram",
      youtube: "nds-hgi-youtube",
      github: "nds-hgi-github",
      x: "nds-hgi-new-twitter",
      email: "nds-hgi-mail-01",
      website: "nds-hgi-globe",
      phone: "nds-hgi-smart-phone-01",
      location: "nds-hgi-location-01"
    };
    var iconClass = icons[type] || icons.website;
    return iconClass.indexOf("hgi ") === 0 ? iconClass : "nds-icon " + iconClass;
  }

  function contactIconSvg(type) {
    var icons = {
      linkedin: '<svg viewBox="0 0 24 24" focusable="false"><path d="M6.9 8.8H3.7v10.5h3.2V8.8ZM5.3 4.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Zm13 9.3c0-3.1-1.7-4.8-4.1-4.8-1.8 0-2.7 1-3.1 1.7V8.8H8v10.5h3.2v-5.7c0-1.5.8-2.4 2-2.4s2 .9 2 2.5v5.6h3.2v-5.9Z"/></svg>',
      github: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.9-4.7 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A9.3 9.3 0 0 0 12 2.8Z"/></svg>',
      x: '<svg viewBox="0 0 24 24" focusable="false"><path d="M15 10.8 21 4h-1.4l-5.2 5.9L10.2 4H5.4l6.3 8.9L5.4 20h1.4l5.5-6.2 4.4 6.2h4.8L15 10.8Zm-1.9 2.1-.6-.9-5.1-6.9h2.1l4.1 5.5.6.9 5.3 7.3h-2.1l-4.3-5.9Z"/></svg>',
      email: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4.8 6h14.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H4.8c-1 0-1.8-.8-1.8-1.8V7.8C3 6.8 3.8 6 4.8 6Zm7.2 6.4 7-4.7H5l7 4.7Zm-7.2 3.8h14.4V9.5l-7.2 4.8-7.2-4.8v6.7Z"/></svg>',
      website: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm6.6 8h-3.1a14 14 0 0 0-1.2-5 7.1 7.1 0 0 1 4.3 5ZM12 5.1c.8 1.1 1.4 3.1 1.6 5.9h-3.2c.2-2.8.8-4.8 1.6-5.9ZM5.1 13h3.3c.1 2 .5 3.8 1.2 5.1A7.1 7.1 0 0 1 5.1 13Zm3.3-2H5.1a7.1 7.1 0 0 1 4.5-5c-.7 1.3-1.1 3-1.2 5Zm3.6 7.9c-.8-1.1-1.4-3.1-1.6-5.9h3.2c-.2 2.8-.8 4.8-1.6 5.9Zm2.3-.8c.7-1.3 1.1-3.1 1.2-5.1h3.4a7.1 7.1 0 0 1-4.6 5.1Zm1.2-7.1c-.1-2-.5-3.7-1.2-5a7.1 7.1 0 0 1 4.5 5h-3.3Z"/></svg>',
      phone: '<svg viewBox="0 0 24 24" focusable="false"><path d="M7.2 4h3l1.4 4.2-2 1.2c.9 1.8 2.3 3.2 4.1 4.1l1.2-2 4.2 1.4v3c0 1.2-1 2.1-2.2 2.1A12.9 12.9 0 0 1 5 6.2C5 5 6 4 7.2 4Z"/></svg>'
    };
    return icons[type] || icons.website;
  }

  function renderProjectsPage(data) {
    var empty = qs("[data-projects-empty]");
    var content = qs("[data-projects-content]");
    var projects = visibleItems(data.projects || []);
    var hasProjects = projects.length > 0;
    if (empty) empty.hidden = hasProjects;
    if (content) content.hidden = !hasProjects;
    if (!hasProjects) return;

    renderProjectFilters(projects);
    var visible = data.projects.map(function (project, index) {
      return { project: project, index: index };
    }).filter(function (entry) {
      return entry.project.visible !== false && (appState.projectFilter === "all" || entry.project.category === appState.projectFilter);
    });
    renderProjects(visible);
  }

  function renderProjectFilters(projects) {
    var root = qs("[data-project-filters]");
    if (!root) return;
    var categories = ["all"].concat(Array.from(new Set(projects.map(function (project) { return project.category || uiText(appState.data, "projectFilterGeneral", "عام"); }))));
    root.innerHTML = "";
    categories.forEach(function (category) {
      var button = el("button", "nds-btn nds-secondary-outline nds-md");
      button.type = "button";
      button.dataset.projectFilter = category;
      button.dataset.state = category === appState.projectFilter ? "selected" : "";
      button.append(el("span", "nds-label", category === "all" ? uiText(appState.data, "projectFilterAll", "الكل") : category));
      root.append(button);
    });
  }

  function renderProjects(entries) {
    var root = qs("[data-project-list]");
    if (!root) return;
    root.innerHTML = "";
    entries.forEach(function (entry) {
      var project = entry.project;
      var card = el("article", "nds-card nds-stroke nds-full project-card compact-card");
      var content = el("div", "nds-card-content");
      if (hasText(project.image)) {
        var imageWrap = el("div", "nds-card-image");
        var image = document.createElement("img");
        image.src = project.image;
        image.alt = project.title || "";
        imageWrap.append(image);
        content.append(imageWrap);
      }
      content.append(el("h2", "nds-card-title", project.title || ""));
      if (hasText(project.description)) content.append(el("p", "nds-card-description", project.description));
      var meta = el("div", "nds-card-tags");
      if (hasText(project.status)) meta.append(el("span", "nds-tag nds-green nds-sm", project.status));
      if (hasText(project.date)) meta.append(el("span", "nds-tag nds-gray nds-sm", project.date));
      if (hasText(project.category)) meta.append(el("span", "nds-tag nds-blue nds-sm", project.category));
      if (meta.children.length) content.append(meta);
      var actions = el("div", "project-actions");
      var details = el("a", "nds-btn nds-primary nds-md");
      details.href = "project.html?id=" + encodeURIComponent(String(entry.index));
      details.append(el("span", "nds-label", uiText(appState.data, "projectDetailsButton", "تفاصيل المشروع")));
      actions.append(details);
      content.append(actions);
      card.append(content);
      root.append(card);
    });
  }

  function renderProjectDetailPage(data) {
    var index = Number(new URLSearchParams(location.search).get("id"));
    var project = Number.isInteger(index) ? data.projects[index] : null;
    if (project && project.visible === false) project = null;
    var titleNodes = qsa("[data-project-detail-title]");
    var body = qs("[data-project-detail-body]");
    if (!body) return;
    body.innerHTML = "";

    if (!project) {
      titleNodes.forEach(function (node) { node.textContent = uiText(data, "projectNotFoundTitle", "المشروع غير موجود"); });
      updateDocumentTitle(data, uiText(data, "projectNotFoundTitle", "المشروع غير موجود"));
      body.append(emptyState(uiText(data, "projectNotFoundEmptyTitle", "لم يتم العثور على المشروع المطلوب"), uiText(data, "projectNotFoundEmptyDescription", "يمكنك العودة إلى صفحة مشاريعنا واختيار مشروع آخر.")));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = project.title || uiText(data, "projectDetailFallbackTitle", "تفاصيل المشروع"); });
    updateDocumentTitle(data, project.title || uiText(data, "projectDetailFallbackTitle", "تفاصيل المشروع"));
    var detail = el("article", "project-detail nds-card nds-stroke");
    var content = el("div", "nds-card-content project-detail-content");
    if (hasText(project.image)) {
      var media = el("div", "project-detail-media");
      var image = document.createElement("img");
      image.src = project.image;
      image.alt = project.title || "";
      media.append(image);
      content.append(media);
    }
    var text = el("div", "project-detail-text");
    text.append(el("h1", "nds-card-title", project.title || uiText(data, "projectDetailFallbackTitle", "تفاصيل المشروع")));
    if (hasText(project.description)) text.append(el("p", "nds-card-description content-paragraph", project.description));
    var facts = el("dl", "project-detail-facts");
    addProjectFact(facts, uiText(data, "projectFactStatus", "الحالة"), project.status);
    addProjectFact(facts, uiText(data, "projectFactDate", "التاريخ"), project.date);
    addProjectFact(facts, uiText(data, "projectFactCategory", "التصنيف"), project.category);
    if (facts.children.length) text.append(facts);
    var actions = el("div", "project-actions");
    var back = el("a", "nds-btn nds-secondary-outline nds-md");
    back.href = "projects.html";
    back.append(el("span", "nds-label", uiText(data, "projectBackButton", "العودة للمشاريع")));
    actions.append(back);
    if (hasText(project.url)) {
      var visit = el("a", "nds-btn nds-primary nds-md");
      visit.href = normalizeExternalUrl(project.url);
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
      visit.append(el("span", "nds-label", uiText(data, "projectVisitButton", "زيارة رابط المشروع")));
      actions.append(visit);
    }
    text.append(actions);
    content.append(text);
    detail.append(content);
    body.append(detail);
  }

  function addProjectFact(root, label, value) {
    if (!hasText(value)) return;
    root.append(el("dt", "", label));
    root.append(el("dd", "", value));
  }

  function normalizeExternalUrl(url) {
    var value = String(url || "").trim();
    if (!value) return "#";
    if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
    return "https://" + value;
  }

  function renderPagesPage(data) {
    var empty = qs("[data-pages-empty]");
    var content = qs("[data-pages-content]");
    var pages = publicPageItems(data);
    var hasPages = pages.length > 0;
    if (empty) empty.hidden = hasPages;
    if (content) content.hidden = !hasPages;
    if (!hasPages) return;
    renderPagesList(pages);
  }

  function renderPagesList(pages) {
    var root = qs("[data-pages-list]");
    if (!root) return;
    root.innerHTML = "";
    pages.forEach(function (page) {
      var card = el("article", "nds-card nds-stroke nds-full page-card compact-card");
      var content = el("div", "nds-card-content");
      content.append(el("h2", "nds-card-title", page.title || page.slug || uiText(appState.data, "pageCardFallbackTitle", "صفحة")));
      if (hasText(page.content)) {
        content.append(el("p", "nds-card-description", textPreview(page.content)));
      }
      var link = el("a", "nds-btn nds-primary nds-md");
      link.href = "index.html#/page/" + encodeURIComponent(page.slug);
      link.append(el("span", "nds-label", uiText(appState.data, "pageOpenButton", "فتح الصفحة")));
      content.append(link);
      card.append(content);
      root.append(card);
    });
  }

  function renderNotificationsPage() {
    var root = qs("[data-notifications-list]");
    var empty = qs("[data-notifications-empty]");
    if (!root) return;
    var items = loadNotifications();
    root.innerHTML = "";
    if (empty) empty.hidden = items.length > 0;
    if (!items.length) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    items.forEach(function (item) {
      var card = el("article", "nds-card nds-stroke notification-page-card");
      card.dataset.notificationId = item.id;
      var content = el("div", "nds-card-content");
      var head = el("div", "notification-page-head");
      var iconWrap = el("span", "nds-featured-icon nds-sm");
      var icon = document.createElement("i");
      icon.className = "nds-icon " + notificationIcon(item.status);
      icon.setAttribute("aria-hidden", "true");
      iconWrap.append(icon);
      var text = el("div", "nds-card-text");
      var meta = el("div", "nds-drawer-item-head");
      var tag = el("span", "nds-tag nds-xs");
      tag.dataset.status = item.status || "info";
      tag.append(el("span", "nds-label", notificationArabicText(item.tag)));
      meta.append(tag);
      meta.append(el("span", "nds-info", formatNotificationDate(item.createdAt)));
      text.append(meta);
      text.append(el("h2", "nds-card-title", notificationArabicText(item.title)));
      text.append(el("p", "nds-card-description", notificationArabicText(item.description)));
      head.append(iconWrap);
      head.append(text);
      content.append(head);
      var actions = el("div", "nds-section-action");
      var read = el("button", "nds-btn nds-subtle nds-sm");
      read.type = "button";
      read.dataset.notificationRead = "true";
      read.disabled = Boolean(item.read);
      read.innerHTML = '<i class="nds-icon nds-hgi-checkmark-circle-01" aria-hidden="true"></i><span class="nds-label">' + escapeHtml(item.read ? uiText(appState.data, "notificationReadLabel", "مقروء") : uiText(appState.data, "notificationMarkReadLabel", "تحديد كمقروء")) + '</span>';
      var view = el("a", "nds-btn nds-subtle nds-sm");
      view.href = item.href || "admin.html";
      view.dataset.notificationView = "true";
      view.innerHTML = '<i class="nds-icon nds-hgi-eye" aria-hidden="true"></i><span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationViewLabel", "عرض")) + '</span>';
      var dismiss = el("button", "nds-btn nds-destructive nds-sm");
      dismiss.type = "button";
      dismiss.dataset.notificationDismiss = "true";
      dismiss.innerHTML = '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i><span class="nds-label">' + escapeHtml(uiText(appState.data, "notificationDeleteLabel", "حذف")) + '</span>';
      actions.append(read, view, dismiss);
      content.append(actions);
      card.append(content);
      root.append(card);
    });
  }

  function formatNotificationDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Riyadh"
      }).format(new Date(value));
    } catch (error) {
      return "";
    }
  }

  function setupNotificationsPageEvents() {
    document.addEventListener("click", function (event) {
      if (document.body.dataset.page !== "notifications") return;
      var card = event.target.closest("[data-notification-id]");
      if (!card) return;
      if (event.target.closest("[data-notification-view]")) {
        var viewLink = event.target.closest("[data-notification-view]");
        var viewHref = viewLink && viewLink.getAttribute("href") || "notifications.html";
        event.preventDefault();
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== card.dataset.notificationId;
        }));
        window.location.href = viewHref;
        return;
      }
      if (event.target.closest("[data-notification-read]")) {
        event.preventDefault();
        saveNotifications(loadNotifications().map(function (notification) {
          if (notification.id === card.dataset.notificationId) markNotificationRead(notification);
          return notification;
        }));
        renderNotificationsPage();
      }
      if (event.target.closest("[data-notification-dismiss]")) {
        event.preventDefault();
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== card.dataset.notificationId;
        }));
        renderNotificationsPage();
      }
    });
  }

  function textPreview(value) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function emptyState(title, description) {
    var card = el("div", "nds-card nds-stroke nds-empty-state");
    var content = el("div", "nds-card-content");
    content.append(el("div", "empty-icon", ""));
    content.append(el("h2", "nds-card-title", title));
    content.append(el("p", "nds-card-description", description));
    card.append(content);
    return card;
  }

  function setupProjectFilterEvents() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-project-filter]");
      if (!button) return;
      appState.projectFilter = button.dataset.projectFilter;
      renderProjectsPage(appState.data);
    });
  }

  function toast(message) {
    showToast(message, "info");
  }

  function setupToastEvents() {
    document.addEventListener("site:save-success", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تم الحفظ بنجاح", "success");
    });
    document.addEventListener("site:save-error", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تعذر الحفظ", "error");
    });
    document.addEventListener("site:upload-success", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تم الرفع بنجاح", "success");
    });
    document.addEventListener("site:upload-error", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تعذر الرفع", "error");
    });
    document.addEventListener("nds:upload:success", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تم الرفع بنجاح", "success");
    });
    document.addEventListener("nds:upload:error", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تعذر الرفع", "error");
    });
    document.addEventListener("nds:upload:validationError", function (event) {
      showToast(event.detail && event.detail.message ? event.detail.message : "تعذر الرفع", "error");
    });
  }

  function render() {
    document.documentElement.dataset.siteLoading = "true";
    return window.SiteStore.load().then(function (loadedData) {
      appState.data = loadedData;
      renderShared(appState.data);
      if (document.body.dataset.page === "home") renderHome(appState.data);
      if (document.body.dataset.page === "projects") renderProjectsPage(appState.data);
      if (document.body.dataset.page === "project-detail") renderProjectDetailPage(appState.data);
      if (document.body.dataset.page === "pages") renderPagesPage(appState.data);
      if (document.body.dataset.page === "notifications") renderNotificationsPage();
      if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.init) window.NDS.Mainnav.init();
      if (window.NDS && window.NDS.Sidemenu && window.NDS.Sidemenu.init) window.NDS.Sidemenu.init();
      updateHeaderActions(appState.data);
      revealHeaderShell();
      document.documentElement.dataset.siteLoading = "false";
    }).catch(function (error) {
      appState.data = window.SiteStore.current();
      renderShared(appState.data);
      showToast(error.message || "تعذر تحميل بيانات الموقع", "error");
      document.documentElement.dataset.siteLoading = "false";
    });
  }

  var appInitialized = false;

  function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    var cachedData = readCachedSiteData();
    if (cachedData) applyShellText(cachedData);
    setupNavToggle();
    setupDropmenus();
    setupSiteSearch();
    setupThemeToggle();
    setupHeaderNavScrollEvents();
    setupClock();
    setupHeroEvents();
    setupProjectFilterEvents();
    setupLoginModal();
    setupNotifications();
    setupNotificationsPageEvents();
    setupToastEvents();
    window.SiteStore.me().then(render).catch(render);
  }

  if (document.body) {
    initApp();
  } else {
    document.addEventListener("DOMContentLoaded", initApp);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("site:datachange", function () {
    render();
  });
  window.addEventListener("site:authchange", function () {
    renderAccountMenu(appState.data || window.SiteStore.current());
  });

  window.SiteApp = {
    render: render,
    emptyState: emptyState,
    toast: toast,
    showToast: showToast,
    openLoginModal: openLoginModal,
    openChangePasswordModal: openChangePasswordModal,
    openChangeEmailModal: openChangeEmailModal,
    openChangePhoneModal: openChangePhoneModal,
    logoutUser: logoutUser,
    updateHeaderActions: updateHeaderActions,
    toggleTheme: toggleTheme,
    updateThemeIcon: updateThemeIcon,
    updateHeaderDateTime: updateHeaderDateTime,
    openNotifications: openNotifications,
    isAdminAuthenticated: isAdminAuthenticated,
    addNotification: addNotification
  };
})();
