(function () {
  "use strict";

  var HERO_SLIDE_DURATION = 8500;
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
    return visibleItems(home.heroSlides || []).filter(function (slide) {
      return hasText(slide.image) || hasText(slide.mobileImage) || hasText(slide.video) || hasText(slide.mobileVideo);
    });
  }

  function hasHomeHeroContent(home) {
    return visibleHeroSlides(home).length > 0;
  }

  function hasHomeBodyContent(home) {
    return [home.ownerName, home.title, home.intro, home.avatar, home.biography].some(hasText) || home.experience.length || home.achievements.length || home.skills.length;
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
    return data.settings.siteName || data.home.ownerName || "السيرة الذاتية";
  }

  function renderShared(data) {
    applyDocumentSettings(data);
    setText("[data-site-title]", siteTitle(data));
    setText("[data-current-year]", String(new Date().getFullYear()));
    renderNavigation(data);
    renderNotifications();
    renderFooter(data);
    updateClock();
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
    var config = window.ADMIN_AUTH_CONFIG || {};
    return sessionStorage.getItem(config.sessionKey || "websiteDemo:adminSession") === "true";
  }

  function ensureLoginModal() {
    if (qs("#login-modal")) return;
    var modal = document.createElement("div");
    modal.className = "nds-modal nds-card nds-stroke nds-sm";
    modal.id = "login-modal";
    modal.lang = "en";
    modal.dir = "ltr";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "login-modal-title");
    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
    modal.innerHTML = [
      '<form id="loginForm" class="nds-form" novalidate>',
      '<div class="nds-card-content">',
      '<div class="nds-card-text">',
      '<h3 class="nds-card-title" id="login-modal-title">Login</h3>',
      '<p class="nds-card-description">Sign in to access your account</p>',
      '</div>',
      '<div class="nds-form-container" id="login-email-field" data-required>',
      '<div class="nds-form-header">',
      '<label for="login-email">',
      '<span class="nds-label">Email</span>',
      '</label>',
      '</div>',
      '<div class="nds-form-control">',
      '<i class="nds-icon nds-hgi-mail-01" aria-hidden="true"></i>',
      '<input type="email" id="login-email" class="nds-input" placeholder="name@example.gov.sa" autocomplete="username" required aria-required="true">',
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
      '<span class="nds-feedback-message">Use admin@gmail.com</span>',
      '</span>',
      '</div>',
      '</div>',
      '<div class="nds-form-container" id="login-password-field" data-required>',
      '<div class="nds-form-header">',
      '<label for="login-password">',
      '<span class="nds-label">Password</span>',
      '</label>',
      '</div>',
      '<div class="nds-form-control">',
      '<div class="nds-form-action">',
      '<button class="nds-btn nds-subtle nds-toggle-password" type="button" aria-label="Show password">',
      '<i class="nds-icon nds-hgi-view-off" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<input type="password" id="login-password" class="nds-input" placeholder="Enter your password" autocomplete="current-password" data-type="password" required aria-required="true">',
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
      '<span class="nds-feedback-message">Use 1234</span>',
      '</span>',
      '</div>',
      '</div>',
      '</div>',
      '<div class="nds-card-actions">',
      '<button type="submit" class="nds-btn nds-primary nds-full" id="loginSubmitBtn">',
      '<span class="nds-label">Login</span>',
      '</button>',
      '<button type="button" class="nds-btn nds-subtle nds-full nds-modal-close">',
      '<span class="nds-label">Cancel</span>',
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

  function setupLoginModal() {
    ensureLoginModal();
    initializeNdsLoginPackages();

    document.addEventListener("click", function (event) {
      var adminLink = event.target.closest('a[href="admin.html"], a[href$="/admin.html"]');
      if (!adminLink || isAdminAuthenticated()) return;
      event.preventDefault();
      event.stopPropagation();
      closeNotificationDropdown();
      closeNavPanel({ instant: true });
      openLoginModal({ redirectToAdmin: document.body.dataset.page !== "admin" });
    });

    var loginForm = qs("#loginForm");
    if (!loginForm || loginForm.dataset.loginReady === "true") return;
    loginForm.dataset.loginReady = "true";
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var config = window.ADMIN_AUTH_CONFIG || {};
      var validation = window.NDS && window.NDS.Forms && window.NDS.Forms.validateForm
        ? window.NDS.Forms.validateForm(loginForm)
        : { valid: true };
      if (!validation.valid) return;

      var emailInput = qs("#login-email");
      var passInput = qs("#login-password");
      var loginBtn = qs("#loginSubmitBtn");
      var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      var pass = passInput ? passInput.value : "";
      var expectedEmail = String(config.email || "admin@gmail.com").toLowerCase();
      var expectedPass = String(config.passcode || "1234");
      if (email !== expectedEmail || pass !== expectedPass) {
        if (window.NDS && window.NDS.Alert && window.NDS.Alert.create) {
          window.NDS.Alert.create({ variant: "error", title: "Login failed", description: "Use admin@gmail.com and 1234.", display: "toast", position: "top", duration: 3000 });
        } else {
          toast("Use admin@gmail.com and 1234.");
        }
        return;
      }

      if (loginBtn) loginBtn.dataset.state = "loading";
      window.setTimeout(function () {
        if (loginBtn) loginBtn.removeAttribute("data-state");
        sessionStorage.setItem(config.sessionKey || "websiteDemo:adminSession", "true");
        closeLoginModal();
        loginForm.reset();
        if (window.NDS && window.NDS.Alert && window.NDS.Alert.create) {
          window.NDS.Alert.create({ variant: "success", title: "Welcome back!", description: "You have successfully logged in.", display: "toast", position: "top", duration: 3000 });
        } else {
          toast("تم تسجيل الدخول");
        }
        if (qs("#login-modal") && qs("#login-modal").dataset.redirectToAdmin !== "false") {
          window.location.href = "admin.html";
        } else {
          window.dispatchEvent(new CustomEvent("site:admin-login-success"));
        }
      }, 350);
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

    var existing = qs("[data-notifications-root]");
    if (!existing || existing.tagName !== "LI") {
      var next = document.createElement("li");
      if (existing) existing.replaceWith(next);
      existing = next;
      existing.dataset.notificationsRoot = "true";
      if (!existing.parentElement) actions.insertBefore(existing, actions.firstChild);
    }
    existing.className = "nds-nav-item nds-dropdown nds-icon-only nds-PAB notification-dropdown";

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

  function setupNotifications() {
    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-notifications-trigger]")) {
        closeNavPanel();
      }

      if (event.target.closest(".header-admin-link, .nds-mainNav-toggler")) {
        closeNotificationDropdown();
      }

      var root = event.target.closest("[data-notifications-root]");
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

  function closeNotificationDropdown() {
    qsa("[data-notifications-root]").forEach(function (root) {
      root.dataset.state = "";
      root.removeAttribute("data-state");
      var trigger = qs("[data-notifications-trigger]", root);
      if (trigger) {
        trigger.dataset.state = "";
        trigger.removeAttribute("data-state");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
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
      var data = appState.data || window.SiteStore.load();
      var current = data.settings.theme || localStorage.getItem("websiteDemo:theme") || "light";
      var next = current === "dark" ? "light" : "dark";
      data.settings.theme = next;
      appState.data = data;
      applyTheme(next, true, button);
      appState.data = window.SiteStore.save(data);
    });
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
        '<span class="site-datetime-item"><i class="hgi hgi-stroke hgi-calendar-01" aria-hidden="true"></i><span>' + dateLabel + '</span></span>',
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
    if (bioSection) bioSection.hidden = ![home.ownerName, home.title, home.intro, home.biography, home.avatar].some(hasText);

    setText("[data-owner-name]", home.ownerName);
    setText("[data-owner-title]", home.title);
    setText("[data-owner-intro]", home.intro);
    setText("[data-owner-biography]", home.biography);

    var avatar = qs("[data-owner-avatar]");
    if (avatar) {
      avatar.hidden = !hasText(home.avatar);
      if (hasText(home.avatar)) avatar.src = home.avatar;
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

    return article;
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
    var home = (appState.data && appState.data.home) || window.SiteStore.load().home;
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
    var page = data.pages.find(function (item) { return item.slug === slug; });
    var titleNodes = qsa("[data-extra-page-title]");
    var body = qs("[data-extra-page-content]");
    if (!titleNodes.length || !body) return;

    body.innerHTML = "";
    if (!page) {
      titleNodes.forEach(function (node) { node.textContent = "الصفحة غير موجودة"; });
      body.append(emptyState("لم يتم العثور على الصفحة المطلوبة", "يمكنك العودة إلى الصفحة الرئيسية أو إنشاء الصفحة من لوحة الإدارة."));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = page.title || ""; });
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

    var span = el("span", "contact-icon contact-icon-" + (item.iconType || "website"));
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = contactIconSvg(item.iconType);
    return span;
  }

  function contactLabel(item) {
    if (hasText(item.label)) return item.label;
    var match = (window.CONTACT_ICON_OPTIONS || []).find(function (option) {
      return option.value === item.iconType;
    });
    return match ? match.label : "وسيلة تواصل";
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
    var hasProjects = data.projects.length > 0;
    if (empty) empty.hidden = hasProjects;
    if (content) content.hidden = !hasProjects;
    if (!hasProjects) return;

    renderProjectFilters(data.projects);
    var visible = data.projects.map(function (project, index) {
      return { project: project, index: index };
    }).filter(function (entry) {
      return appState.projectFilter === "all" || entry.project.category === appState.projectFilter;
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
    var titleNodes = qsa("[data-project-detail-title]");
    var body = qs("[data-project-detail-body]");
    if (!body) return;
    body.innerHTML = "";

    if (!project) {
      titleNodes.forEach(function (node) { node.textContent = "المشروع غير موجود"; });
      body.append(emptyState("لم يتم العثور على المشروع المطلوب", "يمكنك العودة إلى صفحة مشاريعنا واختيار مشروع آخر."));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = project.title || "تفاصيل المشروع"; });
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
    var toastElement = qs("[data-toast]");
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.hidden = false;
    clearTimeout(toastElement._timer);
    toastElement._timer = setTimeout(function () {
      toastElement.hidden = true;
    }, 2600);
  }

  function render() {
    appState.data = window.SiteStore.load();
    renderShared(appState.data);
    if (document.body.dataset.page === "home") renderHome(appState.data);
    if (document.body.dataset.page === "projects") renderProjectsPage(appState.data);
    if (document.body.dataset.page === "project-detail") renderProjectDetailPage(appState.data);
    if (document.body.dataset.page === "pages") renderPagesPage(appState.data);
    if (document.body.dataset.page === "notifications") renderNotificationsPage();
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.init) window.NDS.Mainnav.init();
  }

  document.addEventListener("DOMContentLoaded", function () {
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
    render();
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("site:datachange", function () {
    render();
  });

  window.SiteApp = {
    render: render,
    emptyState: emptyState,
    toast: toast,
    openLoginModal: openLoginModal,
    isAdminAuthenticated: isAdminAuthenticated,
    addNotification: addNotification
  };
})();
