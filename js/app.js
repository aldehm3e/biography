(function () {
  "use strict";

  var HERO_SLIDE_DURATION = 8500;
  var SITE_DATA_KEY = "websiteDemo:siteData";
  var NOTIFICATIONS_KEY = "websiteDemo:notifications";

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

  function visibleItems(items) {
    return (items || []).filter(function (item) { return item.visible !== false; });
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

  function brandTitle(data) {
    data = data || {};
    data.settings = data.settings || {};
    return data.settings.brandName || siteTitle(data);
  }

  function updateDocumentTitle(data, detailTitle) {
    var baseTitle = brandTitle(data);
    var page = document.body ? document.body.dataset.page : "home";
    var title = detailTitle || baseTitle;
    if (!detailTitle) {
      if (page === "projects") title = navigationLabel(data, "projectsLabel", "مشاريعنا") + " | " + baseTitle;
      if (page === "pages") title = navigationLabel(data, "pagesLabel", "الصفحات") + " | " + baseTitle;
      if (page === "admin") title = navigationLabel(data, "adminLabel", "الإدارة") + " | " + baseTitle;
      if (page === "notifications") title = "الإشعارات | " + baseTitle;
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
    qsa(".brand-logo, .nds-footer-logos img").forEach(function (image) {
      image.src = data.settings.brandLogo || "assets/vendor/nds/images/palm_swords.svg";
    });
    updateDocumentTitle(data);
  }

  function renderShared(data) {
    applyDocumentSettings(data);
    applyShellText(data);
    renderAccountMenu(data);
    renderNavigation(data);
    renderNotifications();
    renderFooter(data);
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
    return '<span class="nds-avatar ' + (compact ? "nds-sm" : "nds-md") + ' admin-trigger-avatar account-initials-avatar" aria-hidden="true">' + escapeHtml(accountInitials(name)) + '</span>';
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
      '<span class="nds-label">تغيير كلمة المرور</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-dropdown-item" data-account-action="email">',
      '<i class="nds-icon nds-hgi-mail-01" aria-hidden="true"></i>',
      '<span class="nds-label">تغيير البريد الإلكتروني</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-dropdown-item" data-account-action="phone">',
      '<i class="nds-icon nds-hgi-smart-phone-01" aria-hidden="true"></i>',
      '<span class="nds-label">تغيير رقم الجوال</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-destructive nds-dropdown-item" data-account-action="logout" data-admin-persona-logout>',
      '<i class="nds-icon nds-hgi-door-01" aria-hidden="true"></i>',
      '<span class="nds-label">تسجيل الخروج</span>',
      '</button>'
    ].join("");
  }

  function renderAccountMenu(data) {
    renderDesktopAccountMenu(data);
    renderMobileAccountMenu(data);
    updateHeaderActions(data);
  }

  function renderDesktopAccountMenu(data) {
    var item = qs(".admin-persona-dropdown");
    if (!item) return;
    var config = currentAuthConfig();
    var isAuthenticated = isAdminAuthenticated();
    var name = accountDisplayName(data);
    var role = data.home.title || "Administrator";
    var portalLabel = "الإدارة";
    item.className = "nds-nav-item nds-dropdown admin-persona-dropdown account-menu-item";
    item.dataset.accountMenu = "desktop";

    if (!isAuthenticated) {
      item.innerHTML = [
        '<button class="nds-nav-link nds-btn nds-subtle account-login-trigger" type="button" data-login-trigger aria-label="تسجيل الدخول" title="تسجيل الدخول">',
        '<i class="nds-icon nds-icon-avatar" aria-hidden="true"></i>',
        '<span class="nds-label">تسجيل الدخول</span>',
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
    var portalLabel = "الإدارة";
    var isAuthenticated = isAdminAuthenticated();
    var accountName = accountDisplayName(data);
    var accountRole = data && data.home ? data.home.title || "Administrator" : "Administrator";
    var accountConfig = currentAuthConfig();
    if (!isAuthenticated) portalLabel = "تسجيل الدخول";
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
      '<span class="nds-label">تبديل الوضع الليلي</span>',
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
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator notification-trigger" type="button" title="الإشعارات" data-state="' + (isOpen ? "active" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" data-notifications-trigger>',
      '<i class="nds-icon nds-hgi-notification-02 nav-notification-icon" aria-hidden="true">' + (unreadCount ? '<span class="nds-badge">' + Math.min(unreadCount, 99) + '</span>' : '') + '</i>',
      '<span class="nds-label">الإشعارات</span>',
      '</button>',
      '<div class="nds-dropdown-menu nds-fit" data-notifications-menu>',
      '<div class="nds-dropdown-content">',
      '<div class="nds-column">',
      '<nav class="nds-drawer" style="--drawer-max-height: 40svh; min-width: 280px; max-width: 100%;">',
      '<div class="nds-scroll-more nds-divided" data-axis="vertical" data-state="' + (items.length > 4 ? "has-more at-end" : "") + '">',
      '<ul class="nds-drawer-list nds-scroll-more-content">',
      (items.length ? items.map(notificationMarkup).join("") : emptyNotificationsMarkup()),
      '</ul>',
      '</div>',
      '</nav>',
      '<hr class="nds-divider">',
      '<a href="notifications.html" class="nds-btn nds-subtle nds-full">',
      '<i class="nds-icon nds-hgi-notification-02" aria-hidden="true"></i>',
      '<span class="nds-label">عرض كل الإشعارات</span>',
      '</a>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
    updateHeaderDateTime();
    updateThemeIcon(document.documentElement.dataset.theme || localStorage.getItem("websiteDemo:theme") || "light");
  }

  function dedupeHeaderActions() {
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
  }

  function baseNavigationItems(data) {
    return [
      { label: data.navigation.homeLabel || "الرئيسية", href: "index.html", key: "home" },
      { label: data.navigation.projectsLabel && data.navigation.projectsLabel !== "المشاريع" ? data.navigation.projectsLabel : "مشاريعنا", href: "projects.html", key: "projects" }
    ];
  }

  function pageNavigationItems(data) {
    return visibleItems(data.pages).map(function (item) {
      return {
        label: item.title || item.slug,
        href: "index.html#/page/" + encodeURIComponent(item.slug),
        key: "page:" + item.slug
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
    var link = el("a", "nds-nav-link nds-btn nds-subtle");
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
    if (!panel || panel.dataset.navScroller === "ready") return;
    var content = list.closest(".nds-collapse-content") || panel;
    panel.dataset.navScroller = "ready";
    content.insertBefore(navScrollButton("prev"), list);
    var showMore = qs(".nds-show-more", content);
    content.insertBefore(navScrollButton("next"), showMore || null);
    updateMobileNavScrollControl(list);
  }

  function renderFooter(data) {
    renderFooterLinks(data);
    renderFooterSocial(data);
    renderFooterMeta();
  }

  function renderFooterMeta() {
    qsa(".nds-footer-meta").forEach(function (meta) {
      if (!qs("[data-footer-version]", meta)) {
        var version = el("span", "footer-version", "Biography v1.0");
        version.dataset.footerVersion = "true";
        meta.append(version);
      }
      if (!qs("[data-footer-disclaimer]", meta)) {
        var disclaimer = el("span", "footer-disclaimer", "تنويه: هذا الموقع شخصي وغير تابع لأي جهة حكومية، ولا يمثل إلا وجهة نظر صاحبه.");
        disclaimer.dataset.footerDisclaimer = "true";
        meta.append(disclaimer);
      }
    });
  }

  function renderFooterLinks(data) {
    var list = qs("[data-footer-links]");
    if (!list) return;
    list.innerHTML = "";
    allNavigationItems(data).slice(0, 4).forEach(function (item) {
      var li = el("li");
      var link = el("a", "nds-link nds-footer-link");
      link.href = item.href;
      link.append(el("span", "nds-label", item.label));
      li.append(link);
      list.append(li);
    });
  }

  function renderFooterSocial(data) {
    var root = qs("[data-footer-social]");
    var empty = qs("[data-footer-social-empty]");
    if (!root) return;
    var contacts = (data.home.contacts || []).filter(function (item) {
      return item.visible !== false && hasText(item.url);
    });
    root.innerHTML = "";
    if (empty) empty.hidden = contacts.length > 0;
    contacts.forEach(function (item) {
      var label = contactLabel(item);
      var link = el("a", "nds-btn nds-secondary-outline nds-icon-only footer-social-link");
      link.href = normalizeContactUrl(item.url, item.iconType);
      link.setAttribute("aria-label", label);
      if (/^https?:\/\//i.test(link.href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      link.append(contactIcon(item));
      root.append(link);
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
      '<form id="loginForm" class="nds-form" novalidate>',
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

  function logoutUser() {
    prepareOverlayForLoginModal();
    qsa("[data-account-action='logout'], .account-persona-trigger, .account-menu-item, .mobile-account-section").forEach(function (node) {
      node.removeAttribute("data-status");
      node.removeAttribute("data-state");
      node.classList.remove("nds-success", "success", "active", "selected", "is-active");
    });
    window.SiteStore.logout().then(function () {
      renderAccountMenu(appState.data || window.SiteStore.current());
      window.dispatchEvent(new CustomEvent("site:admin-logout"));
      showToast("تم تسجيل الخروج بنجاح", "success");
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

  function showToastAlert(variant, title, description) {
    if (!(window.NDS && window.NDS.Alert && window.NDS.Alert.create)) return false;
    window.NDS.Alert.create({
      variant: variant,
      title: title,
      description: description || "",
      display: "toast",
      position: "top",
      duration: 3000
    });
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
        if (accountAction.dataset.accountAction === "logout") logoutUser();
        return;
      }

      var logoutButton = event.target.closest("[data-admin-persona-logout], #logoutBtn");
      if (logoutButton) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        logoutUser();
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
      var config = currentAuthConfig();
      var validation = window.NDS && window.NDS.Forms && window.NDS.Forms.validateForm
        ? window.NDS.Forms.validateForm(loginForm)
        : { valid: true };
      if (!validation.valid) return;

      var emailInput = qs("#login-email");
      var passInput = qs("#login-password");
      var captchaInput = qs("#login-captcha-answer");
      var loginBtn = qs("#loginSubmitBtn");
      var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      var pass = passInput ? passInput.value : "";
      var captchaAnswer = captchaInput ? captchaInput.value.trim() : "";
      if (!captchaAnswer) {
        clearLoginFeedback();
        setLoginFieldFeedback("#login-captcha-field", "\u0623\u062f\u062e\u0644 \u0646\u0627\u062a\u062c \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0623\u0645\u0646\u064a.");
        return;
      }
      if (loginBtn) loginBtn.dataset.state = "loading";
      window.SiteStore.login(email, pass, captchaAnswer).then(function () {
        if (loginBtn) loginBtn.removeAttribute("data-state");
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
      }).catch(function (error) {
        if (loginBtn) loginBtn.removeAttribute("data-state");
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
  }

  function loadNotifications() {
    try {
      return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveNotifications(items) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items.slice(0, 20)));
    window.dispatchEvent(new CustomEvent("site:notificationschange"));
  }

  function addNotification(options) {
    var items = loadNotifications();
    items.unshift({
      id: "notification-" + Date.now(),
      status: options.status || "info",
      tag: options.tag || "Updated",
      title: options.title || "Content updated",
      description: options.description || "",
      href: options.href || "admin.html",
      read: false,
      createdAt: new Date().toISOString()
    });
    saveNotifications(items);
  }

  function notificationIcon(status) {
    if (status === "success") return "nds-hgi-checkmark-circle-01";
    if (status === "warning") return "nds-hgi-alert-circle";
    if (status === "error") return "nds-hgi-cancel-circle";
    return "nds-hgi-notification-02";
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
      "Home biography, hero, contact, or profile content was saved from the admin dashboard.": "تم حفظ محتوى السيرة أو الهيرو أو التواصل أو الملف الشخصي من لوحة الإدارة.",
      "A new project was added from the admin dashboard.": "تمت إضافة مشروع جديد من لوحة الإدارة.",
      "Project content was updated from the admin dashboard.": "تم تحديث محتوى المشاريع من لوحة الإدارة.",
      "A new page was added from the admin dashboard.": "تمت إضافة صفحة جديدة من لوحة الإدارة.",
      "Page content or visibility was updated from the admin dashboard.": "تم تحديث محتوى الصفحات أو ظهورها في التنقل من لوحة الإدارة."
    };
    return translations[value] || value || "";
  }

  function notificationMarkup(item) {
    return [
      '<li data-notification-id="' + item.id + '">',
      '<button type="button" class="nds-btn nds-subtle nds-menu-btn nds-indicator" aria-expanded="false" data-notification-toggle>',
      '<span class="nds-featured-icon nds-sm">',
      '<i class="nds-icon ' + notificationIcon(item.status) + '" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-drawer-item">',
      '<span class="nds-drawer-item-head">',
      '<span class="nds-tag nds-xs" data-status="' + item.status + '">',
      '<span class="nds-label">' + escapeHtml(notificationArabicText(item.tag)) + '</span>',
      '</span>',
      '<span class="nds-label nds-truncate">' + escapeHtml(notificationArabicText(item.title)) + '</span>',
      '</span>',
      '<span class="nds-description">' + escapeHtml(notificationArabicText(item.description)) + '</span>',
      '</span>',
      '</button>',
      '<ul data-notification-actions data-state="closed">',
      '<li>',
      '<div class="nds-flex nds-row">',
      '<button type="button" class="nds-btn nds-subtle nds-sm" data-notification-read>',
      '<i class="nds-icon nds-hgi-checkmark-circle-01" aria-hidden="true"></i>',
      '<span class="nds-label">تحديد كمقروء</span>',
      '</button>',
      '<a href="' + escapeHtml(item.href || "admin.html") + '" class="nds-btn nds-subtle nds-sm">',
      '<i class="nds-icon nds-hgi-eye" aria-hidden="true"></i>',
      '<span class="nds-label">عرض</span>',
      '</a>',
      '<button type="button" class="nds-btn nds-destructive nds-sm" data-notification-dismiss>',
      '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>',
      '<span class="nds-label">حذف</span>',
      '</button>',
      '</div>',
      '</li>',
      '</ul>',
      '</li>'
    ].join("");
  }

  function emptyNotificationsMarkup() {
    return [
      '<li>',
      '<div class="notification-empty">',
      '<span class="nds-featured-icon nds-sm">',
      '<i class="nds-icon nds-hgi-notification-02" aria-hidden="true"></i>',
      '</span>',
      '<span class="nds-label">لا توجد إشعارات بعد</span>',
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
      '<button class="nds-nav-link nds-btn nds-subtle nds-indicator notification-trigger" type="button" title="الإشعارات" data-state="' + (existing.dataset.state.indexOf("open") !== -1 ? "active" : "") + '" aria-expanded="' + (existing.dataset.state.indexOf("open") !== -1 ? "true" : "false") + '" data-notifications-trigger>',
      '<i class="nds-icon nds-hgi-notification-02 nav-notification-icon" aria-hidden="true">' + (unreadCount ? '<span class="nds-badge">' + Math.min(unreadCount, 99) + '</span>' : '') + '</i>',
      '</button>',
      '<div class="nds-dropdown-menu nds-fit" data-notifications-menu>',
      '<div class="nds-dropdown-content">',
      '<div class="nds-column">',
      '<nav class="nds-drawer" style="--drawer-max-height: 40svh; min-width: 40vw; max-width: 100%;">',
      '<div class="nds-scroll-more nds-divided" data-axis="vertical" data-state="' + (items.length > 4 ? "has-more at-end" : "") + '">',
      '<ul class="nds-drawer-list nds-scroll-more-content">',
      (items.length ? items.map(notificationMarkup).join("") : emptyNotificationsMarkup()),
      '</ul>',
      '</div>',
      '</nav>',
      '<hr class="nds-divider">',
      '<a href="notifications.html" class="nds-btn nds-subtle nds-full">',
      '<i class="nds-icon nds-hgi-notification-02" aria-hidden="true"></i>',
      '<span class="nds-label">عرض كل الإشعارات</span>',
      '</a>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
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

  function setupNotifications() {
    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-mobile-admin-shortcut], .mobile-account-trigger")) {
        closeNotificationDropdown();
      }

      if (event.target.closest("[data-mobile-theme-shortcut], .nds-mainNav-toggler")) {
        closeNotificationDropdown();
        closeMobileAccountDropdown();
      }

      if (event.target.closest("[data-mobile-notifications-root] [data-notifications-trigger]")) {
        closeMobileAccountDropdown();
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
        window.setTimeout(function () {
          if (!mobileRoot) return;
          var currentOpen = (mobileRoot.dataset.state || "").indexOf("open") !== -1;
          if (willOpen && !currentOpen) mobileRoot.dataset.state = "open opened";
          if (!willOpen) mobileRoot.dataset.state = "";
          if (mobileTrigger) mobileTrigger.setAttribute("aria-expanded", String(willOpen));
        }, 120);
        return;
      }

      if (event.target.closest("[data-notifications-trigger]")) {
        closeNavPanel();
      }

      if (event.target.closest(".header-admin-link, .mobile-account-trigger, [data-mobile-admin-shortcut], .nds-mainNav-toggler")) {
        closeNotificationDropdown();
      }

      var root = event.target.closest("[data-notifications-root], [data-mobile-notifications-root]");
      var item = event.target.closest("[data-notification-id]");
      if (event.target.closest("[data-notification-toggle]") && item) {
        event.preventDefault();
        var isOpen = (item.dataset.state || "").split(/\s+/).indexOf("open") !== -1;
        qsa("[data-notification-id]", root).forEach(function (notificationItem) {
          var actions = qs("[data-notification-actions]", notificationItem);
          var toggle = qs("[data-notification-toggle]", notificationItem);
          if (notificationItem !== item && actions && (actions.dataset.state || "").indexOf("open") !== -1) {
            animateNotificationActions(notificationItem, toggle, actions, false);
          }
        });
        var itemActions = qs("[data-notification-actions]", item);
        var itemToggle = qs("[data-notification-toggle]", item);
        if (itemActions) animateNotificationActions(item, itemToggle, itemActions, !isOpen);
        return;
      }
      if (event.target.closest("[data-notification-read]") && item) {
        event.preventDefault();
        event.stopPropagation();
        saveNotifications(loadNotifications().map(function (notification) {
          if (notification.id === item.dataset.notificationId) notification.read = true;
          return notification;
        }));
        renderNotifications();
        return;
      }
      if (event.target.closest("[data-notification-dismiss]") && item) {
        event.preventDefault();
        event.stopPropagation();
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== item.dataset.notificationId;
        }));
        renderNotifications();
        return;
      }
    });

    window.addEventListener("site:notificationschange", renderNotifications);
    window.addEventListener("resize", renderNotifications);
  }

  function animateNotificationActions(item, toggle, actions, open) {
    if (!item || !actions) return;
    var duration = 220;
    item.dataset.state = open ? "opening" : "closing";
    actions.dataset.state = open ? "opening" : "closing";
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.dataset.state = open ? "active" : "";
    }

    if (open) {
      actions.style.height = "0px";
      actions.offsetHeight;
      actions.style.height = actions.scrollHeight + "px";
    } else {
      actions.style.height = actions.scrollHeight + "px";
      actions.offsetHeight;
      actions.style.height = "0px";
    }

    window.setTimeout(function () {
      item.dataset.state = open ? "open" : "closed";
      actions.dataset.state = open ? "open" : "closed";
      actions.style.height = "";
      if (toggle && !open) {
        toggle.dataset.state = "";
        toggle.removeAttribute("data-state");
      }
    }, duration + 40);
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
    if (!nodes.length) return;
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

    var home = data.home;
    var hasContent = hasHomeContent(home);
    var hasHero = hasHomeHeroContent(home);
    var hasBody = hasHomeBodyContent(home);
    var empty = qs("[data-home-empty]");
    var content = qs("[data-home-content]");
    var hero = qs("[data-home-hero]");
    var bioSection = qs(".biography-section");

    if (hero) hero.hidden = !hasHero;
    if (empty) empty.hidden = hasContent;
    if (content) content.hidden = !hasBody;
    var avatarSrc = ownerAvatarSrc(data);
    if (bioSection) bioSection.hidden = ![home.ownerName, home.title, home.intro, home.biography, avatarSrc].some(hasText);

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
    renderListCards("[data-experience-list]", home.experience, "الخبرات");
    renderListCards("[data-achievements-list]", home.achievements, "الإنجازات");
    renderChips("[data-skills-list]", home.skills);
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
    var page = visibleItems(data.pages || []).find(function (item) { return item.slug === slug; });
    var titleNodes = qsa("[data-extra-page-title]");
    var body = qs("[data-extra-page-content]");
    if (!titleNodes.length || !body) return;

    body.innerHTML = "";
    if (!page) {
      titleNodes.forEach(function (node) { node.textContent = "الصفحة غير موجودة"; });
      updateDocumentTitle(data, "الصفحة غير موجودة");
      body.append(emptyState("لم يتم العثور على الصفحة المطلوبة", "يمكنك العودة إلى الصفحة الرئيسية أو إنشاء الصفحة من لوحة الإدارة."));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = page.title || ""; });
    updateDocumentTitle(data, page.title || navigationLabel(data, "pagesLabel", "الصفحات"));
    if (!hasText(page.content)) {
      body.append(emptyState("لم تتم إضافة محتوى لهذه الصفحة بعد", "يمكن تعديل هذه الصفحة من لوحة الإدارة."));
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
      root.append(emptyState("لم تتم إضافة " + label + " بعد", "يمكن إضافة العناصر من لوحة الإدارة."));
      return;
    }
    items.forEach(function (item) {
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
      return typeof item === "string" ? item : item.name;
    }).filter(hasText);
    root.innerHTML = "";
    if (!items.length) {
      root.append(emptyState("لم تتم إضافة مجالات خبرة بعد", "يمكن إضافة المهارات من لوحة الإدارة."));
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
      instagram: "hgi hgi-stroke hgi-instagram",
      youtube: "nds-hgi-youtube",
      github: "hgi hgi-stroke hgi-github",
      x: "nds-hgi-new-twitter",
      email: "nds-hgi-mail-01",
      website: "nds-hgi-globe",
      phone: "nds-hgi-smart-phone-01"
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
    var categories = ["all"].concat(Array.from(new Set(projects.map(function (project) { return project.category || "عام"; }))));
    root.innerHTML = "";
    categories.forEach(function (category) {
      var button = el("button", "nds-btn nds-secondary-outline nds-md");
      button.type = "button";
      button.dataset.projectFilter = category;
      button.dataset.state = category === appState.projectFilter ? "selected" : "";
      button.append(el("span", "nds-label", category === "all" ? "الكل" : category));
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
      details.append(el("span", "nds-label", "تفاصيل المشروع"));
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
      titleNodes.forEach(function (node) { node.textContent = "المشروع غير موجود"; });
      updateDocumentTitle(data, "المشروع غير موجود");
      body.append(emptyState("لم يتم العثور على المشروع المطلوب", "يمكنك العودة إلى صفحة مشاريعنا واختيار مشروع آخر."));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = project.title || "تفاصيل المشروع"; });
    updateDocumentTitle(data, project.title || "تفاصيل المشروع");
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
    text.append(el("h1", "nds-card-title", project.title || "تفاصيل المشروع"));
    if (hasText(project.description)) text.append(el("p", "nds-card-description content-paragraph", project.description));
    var facts = el("dl", "project-detail-facts");
    addProjectFact(facts, "الحالة", project.status);
    addProjectFact(facts, "التاريخ", project.date);
    addProjectFact(facts, "التصنيف", project.category);
    if (facts.children.length) text.append(facts);
    var actions = el("div", "project-actions");
    var back = el("a", "nds-btn nds-secondary-outline nds-md");
    back.href = "projects.html";
    back.append(el("span", "nds-label", "العودة للمشاريع"));
    actions.append(back);
    if (hasText(project.url)) {
      var visit = el("a", "nds-btn nds-primary nds-md");
      visit.href = normalizeExternalUrl(project.url);
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
      visit.append(el("span", "nds-label", "زيارة رابط المشروع"));
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
    var pages = visibleItems(data.pages || []);
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
      content.append(el("h2", "nds-card-title", page.title || page.slug || "صفحة"));
      if (hasText(page.content)) {
        content.append(el("p", "nds-card-description", textPreview(page.content)));
      }
      var link = el("a", "nds-btn nds-primary nds-md");
      link.href = "index.html#/page/" + encodeURIComponent(page.slug);
      link.append(el("span", "nds-label", "فتح الصفحة"));
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
      read.innerHTML = '<i class="nds-icon nds-hgi-checkmark-circle-01" aria-hidden="true"></i><span class="nds-label">' + (item.read ? "مقروء" : "تحديد كمقروء") + '</span>';
      var view = el("a", "nds-btn nds-subtle nds-sm");
      view.href = item.href || "admin.html";
      view.innerHTML = '<i class="nds-icon nds-hgi-eye" aria-hidden="true"></i><span class="nds-label">عرض</span>';
      var dismiss = el("button", "nds-btn nds-destructive nds-sm");
      dismiss.type = "button";
      dismiss.dataset.notificationDismiss = "true";
      dismiss.innerHTML = '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i><span class="nds-label">حذف</span>';
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
      if (event.target.closest("[data-notification-read]")) {
        saveNotifications(loadNotifications().map(function (notification) {
          if (notification.id === card.dataset.notificationId) notification.read = true;
          return notification;
        }));
        renderNotificationsPage();
      }
      if (event.target.closest("[data-notification-dismiss]")) {
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
