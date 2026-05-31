(function () {
  "use strict";

  var data;
  var dashboardReady = false;
  var pendingOpenEditor = { hero: null, page: null };
  var openEditorAccordions = new Set();
  var openContactAccordions = new Set();
  var activeDragItem = null;
  var activeSortableRoot = null;
  var lastSavedSignature = "";
  var pendingSaveSignature = "";
  var lastSavedSnapshot = null;
  var adminConfirmResolver = null;
  var adminSidemenuPeekDelayReady = false;
  var adminSidemenuDelayedOpen = false;
  var adminInlineDropmenuTimers = new WeakMap();
  var activeAdminSections = {
    settings: "identity",
    home: "profile",
    footer: "labels"
  };
  var adminUsers = [];
  var adminPermissions = [];
  var adminUsersLoaded = false;
  var ADMIN_ACTIVITY_KEY = "websiteDemo:adminActivityLog";
  var MAX_FOOTER_COLUMNS = 3;
  var MAX_FOOTER_ICON_GROUPS = 2;
  var PAGE_EDITOR_FONTS = [
    { value: "", label: "الخط", family: "" },
    { value: "ibm-plex-arabic", label: "IBM Plex Sans Arabic", family: "'IBM Plex Sans Arabic', sans-serif" },
    { value: "saudi", label: "Saudi", family: "'Saudi', 'IBM Plex Sans Arabic', sans-serif" },
    { value: "maqroo", label: "Maqroo", family: "'Maqroo', 'IBM Plex Sans Arabic', sans-serif" },
    { value: "open-dyslexic", label: "OpenDyslexic", family: "'OpenDyslexic', 'IBM Plex Sans Arabic', sans-serif" }
  ];
  var PAGE_EDITOR_FONT_SIZES = [
    { value: "", label: "حجم الخط" },
    { value: "12px", label: "12" },
    { value: "14px", label: "14" },
    { value: "16px", label: "16" },
    { value: "18px", label: "18" },
    { value: "20px", label: "20" },
    { value: "24px", label: "24" },
    { value: "28px", label: "28" },
    { value: "32px", label: "32" },
    { value: "40px", label: "40" }
  ];
  var ADMIN_PERMISSION_LABELS = {
    settings: "الإعدادات والهوية",
    home: "الرئيسية",
    footer: "التذييل",
    projects: "المشاريع",
    pages: "الصفحات",
    navigation: "التنقل",
    integrations: "التكاملات",
    utilities: "النسخ الاحتياطي",
    uploads: "رفع الملفات",
    users: "إدارة الموظفين"
  };
  var ADMIN_ROLES = [
    { value: "employee", label: "موظف" },
    { value: "admin", label: "مدير محتوى" },
    { value: "owner", label: "مالك" }
  ];
  var INTERFACE_TEXT_FIELDS = [
    ["searchLabel", "تسمية البحث"],
    ["searchPlaceholder", "نص حقل البحث", true],
    ["loginLabel", "تسمية تسجيل الدخول"],
    ["logoutLabel", "تسمية تسجيل الخروج"],
    ["adminPortalLabel", "تسمية الإدارة"],
    ["themeToggleLabel", "تسمية تبديل الثيم"],
    ["sharePageLabel", "تسمية زر مشاركة الصفحة"],
    ["homeEmptyTitle", "عنوان فراغ الرئيسية"],
    ["homeEmptyDescription", "وصف فراغ الرئيسية", true],
    ["homeEmptyButton", "زر فراغ الرئيسية"],
    ["adminHomePanelTitle", "عنوان بطاقة تحرير الرئيسية"],
    ["adminHomePanelDescription", "وصف بطاقة تحرير الرئيسية", true],
    ["adminHomeSaveButton", "زر حفظ الرئيسية"],
    ["biographySubtitle", "عنوان فرعي للسيرة"],
    ["biographyTitle", "عنوان قسم السيرة"],
    ["professionalSubtitle", "عنوان فرعي للخبرات"],
    ["professionalTitle", "عنوان قسم الخبرات والإنجازات"],
    ["experienceHeading", "عنوان الخبرات"],
    ["achievementsHeading", "عنوان الإنجازات"],
    ["skillsSubtitle", "عنوان فرعي للمهارات"],
    ["skillsTitle", "عنوان قسم المهارات"],
    ["skillsEmptyTitle", "عنوان فراغ المهارات"],
    ["skillsEmptyDescription", "وصف فراغ المهارات", true],
    ["projectsDescription", "وصف صفحة المشاريع", true],
    ["projectsEmptyTitle", "عنوان فراغ المشاريع"],
    ["projectsEmptyDescription", "وصف فراغ المشاريع", true],
    ["projectsEmptyButton", "زر إضافة مشروع"],
    ["projectsListSubtitle", "عنوان فرعي لقائمة المشاريع"],
    ["projectsListTitle", "عنوان قائمة المشاريع"],
    ["projectDetailsButton", "زر تفاصيل المشروع"],
    ["projectFilterAll", "فلتر كل المشاريع"],
    ["projectFilterGeneral", "تصنيف المشروع الافتراضي"],
    ["projectNotFoundTitle", "عنوان المشروع غير الموجود"],
    ["projectNotFoundEmptyTitle", "رسالة المشروع غير الموجود"],
    ["projectNotFoundEmptyDescription", "وصف المشروع غير الموجود", true],
    ["projectDetailFallbackTitle", "عنوان تفاصيل المشروع الافتراضي"],
    ["projectFactStatus", "تسمية الحالة"],
    ["projectFactDate", "تسمية التاريخ"],
    ["projectFactCategory", "تسمية التصنيف"],
    ["projectBackButton", "زر العودة للمشاريع"],
    ["projectVisitButton", "زر زيارة رابط المشروع"],
    ["pagesDescription", "وصف صفحة الصفحات", true],
    ["pagesEmptyTitle", "عنوان فراغ الصفحات"],
    ["pagesEmptyDescription", "وصف فراغ الصفحات", true],
    ["pagesEmptyButton", "زر إضافة صفحة"],
    ["pagesListSubtitle", "عنوان فرعي لقائمة الصفحات"],
    ["pagesListTitle", "عنوان قائمة الصفحات"],
    ["pageCardFallbackTitle", "عنوان الصفحة الافتراضي"],
    ["pageOpenButton", "زر فتح الصفحة"],
    ["extraPageNotFoundTitle", "عنوان الصفحة غير الموجودة"],
    ["extraPageNotFoundDescription", "وصف الصفحة غير الموجودة", true],
    ["extraPageEmptyTitle", "عنوان الصفحة الفارغة"],
    ["extraPageEmptyDescription", "وصف الصفحة الفارغة", true],
    ["notificationsLabel", "تسمية الإشعارات"],
    ["notificationsDescription", "وصف صفحة الإشعارات", true],
    ["notificationsEmptyTitle", "عنوان فراغ الإشعارات"],
    ["notificationsEmptyDescription", "وصف فراغ الإشعارات", true],
    ["notificationsViewAllLabel", "زر عرض كل الإشعارات"],
    ["notificationReadLabel", "تسمية مقروء"],
    ["notificationMarkReadLabel", "تسمية تحديد كمقروء"],
    ["notificationViewLabel", "تسمية عرض الإشعار"],
    ["notificationDeleteLabel", "تسمية حذف الإشعار"]
  ];

  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function directChildren(root, selector) {
    return Array.prototype.filter.call(root ? root.children : [], function (child) {
      return !selector || child.matches(selector);
    });
  }
  function field(name) { return qs('[name="' + name + '"]'); }
  function value(name) { var input = field(name); return input ? input.value.trim() : ""; }
  function setValue(name, text) { var input = field(name); if (input) input.value = text || ""; }
  function setChecked(name, checked) { var input = field(name); if (input) input.checked = Boolean(checked); }
  function hasAdminText(value) { return Boolean(String(value || "").trim()); }
  function currentAdminUser() {
    return window.SiteStore && window.SiteStore.currentUser ? window.SiteStore.currentUser() : null;
  }
  function hasPermission(permission) {
    var user = currentAdminUser();
    var permissions = user && Array.isArray(user.permissions) ? user.permissions : [];
    return Boolean(user && (user.role === "owner" || permissions.indexOf("*") !== -1 || permissions.indexOf(permission) !== -1));
  }
  function ensurePermission(permission) {
    if (hasPermission(permission)) return true;
    toast("ليس لديك صلاحية لهذا القسم.", "error");
    return false;
  }
  function firstAllowedTab() {
    var first = qsa("[data-admin-tab]").find(function (button) {
      var permissionNode = button.closest("[data-permission]");
      return (!permissionNode || !permissionNode.hidden) && !button.closest("[hidden]");
    });
    return first ? first.dataset.adminTab : "account";
  }
  function applyAdminPanelSection(target, section) {
    var panelAttr = "data-" + target + "-section-panel";
    var sectionAttr = "data-" + target + "-section";
    var panels = qsa("[" + panelAttr + "]");
    if (!panels.length) return;
    var defaultButton = qs('[data-admin-tab="' + target + '"][' + sectionAttr + "]");
    var activeSection = section || activeAdminSections[target] || (defaultButton && defaultButton.getAttribute(sectionAttr)) || panels[0].getAttribute(panelAttr);
    activeAdminSections[target] = activeSection;
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute(panelAttr) !== activeSection;
    });
  }
  function clearNdsState(element) {
    if (!element) return;
    if (window.NDS && window.NDS.State && window.NDS.State.clear) {
      window.NDS.State.clear(element);
    } else {
      element.removeAttribute("data-state");
    }
  }
  function addNdsState(element) {
    if (!element) return;
    var states = Array.prototype.slice.call(arguments, 1);
    if (window.NDS && window.NDS.State && window.NDS.State.add) {
      window.NDS.State.add.apply(window.NDS.State, [element].concat(states));
      return;
    }
    var current = (element.getAttribute("data-state") || "").split(/\s+/).filter(Boolean);
    states.forEach(function (state) {
      if (current.indexOf(state) === -1) current.push(state);
    });
    if (current.length) element.setAttribute("data-state", current.join(" "));
  }
  function closeAdminSidemenuOverlay() {
    var menu = qs(".admin-sidemenu");
    if (!menu) return;
    var drawer = qs(".admin-sidemenu > .nds-drawer") || qs(".admin-sidemenu .nds-drawer");
    var toggle = qs(".admin-sidemenu .nds-sidemenu-toggle");
    clearNdsState(drawer);
    clearNdsState(menu);
    clearNdsState(toggle);
    if (!menu.classList.contains("nds-top")) menu.classList.add("nds-peek");
    if (toggle && !menu.classList.contains("nds-top")) toggle.classList.add("nds-peek");
    menu.style.removeProperty("z-index");
    menu.style.removeProperty("padding-top");
    if (drawer) drawer.style.removeProperty("--drawer-max-height");
    if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.reset) {
      window.NDS.Backdrop.reset();
    } else {
      clearNdsState(document.body);
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("position");
      document.body.style.removeProperty("top");
      document.body.style.removeProperty("width");
    }
  }
  function setAdminSidemenuOpen(open) {
    var menu = qs(".admin-sidemenu");
    if (!menu) return;
    var drawer = qs(".admin-sidemenu > .nds-drawer") || qs(".admin-sidemenu .nds-drawer");
    var toggle = qs(".admin-sidemenu .nds-sidemenu-toggle");
    if (open) {
      menu.dataset.state = "open";
      if (drawer) drawer.dataset.state = "open";
      if (toggle) {
        toggle.dataset.state = "open";
        toggle.setAttribute("aria-expanded", "true");
      }
      return;
    }
    clearNdsState(menu);
    clearNdsState(drawer);
    clearNdsState(toggle);
    if (!menu.classList.contains("nds-top")) menu.classList.add("nds-peek");
    if (toggle && !menu.classList.contains("nds-top")) toggle.classList.add("nds-peek");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.reset) {
      window.NDS.Backdrop.reset();
    }
    clearNdsState(document.body);
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("top");
    document.body.style.removeProperty("width");
  }
  function syncAdminSidemenuGroups(activeButton) {
    qsa(".admin-tabs li").forEach(function (group) {
      var submenu = qs(":scope > ul", group);
      var groupButton = qs(":scope > .nds-btn", group);
      if (!submenu || !groupButton) return;
      var shouldOpen = Boolean(activeButton && group.contains(activeButton));
      if (shouldOpen) {
        addNdsState(group, "open");
        addNdsState(submenu, "open");
        if (groupButton) {
          groupButton.setAttribute("aria-expanded", "true");
          addNdsState(groupButton, "active");
        }
        return;
      }
      clearNdsState(group);
      clearNdsState(submenu);
      clearNdsState(groupButton);
      if (groupButton) groupButton.setAttribute("aria-expanded", "false");
    });
  }
  function refreshAdminSidemenuComponents() {
    var menu = qs(".admin-sidemenu");
    if (!menu) return;
    if (window.NDS && window.NDS.Drawer && window.NDS.Drawer.create) {
      qsa(".nds-drawer", menu).forEach(function (drawer) {
        window.NDS.Drawer.create(drawer);
      });
    }
    if (window.NDS && window.NDS.ScrollMore && window.NDS.ScrollMore.create) {
      qsa(".nds-scroll-more", menu).forEach(function (scrollMore) {
        window.NDS.ScrollMore.create(scrollMore);
        if (window.NDS.ScrollMore.checkOverflow) {
          window.requestAnimationFrame(function () {
            window.NDS.ScrollMore.checkOverflow(scrollMore);
          });
          window.setTimeout(function () {
            window.NDS.ScrollMore.checkOverflow(scrollMore);
          }, 120);
        }
      });
    }
    if (window.NDS && window.NDS.Sidemenu && window.NDS.Sidemenu.init) window.NDS.Sidemenu.init();
    var selectedTab = qs("[data-admin-tab][data-state~='selected']", menu);
    if (selectedTab) syncAdminSidemenuGroups(selectedTab);
    var toggle = qs(".nds-sidemenu-toggle", menu);
    var isOpen = /\bopen\b/.test(menu.getAttribute("data-state") || "");
    if (!isOpen && !menu.classList.contains("nds-top")) {
      menu.classList.add("nds-peek");
      if (toggle) toggle.classList.add("nds-peek");
    }
  }
  function setupAdminSidemenuPeekDelay() {
    if (adminSidemenuPeekDelayReady) return;
    adminSidemenuPeekDelayReady = true;
    document.addEventListener("click", function (event) {
      var toggle = event.target.closest(".admin-sidemenu .nds-sidemenu-toggle");
      if (!toggle || adminSidemenuDelayedOpen) return;
      var menu = toggle.closest(".admin-sidemenu");
      if (!menu || menu.classList.contains("nds-top")) return;
      if (window.matchMedia && !window.matchMedia("(max-width: 960px)").matches) return;
      var state = menu.getAttribute("data-state") || "";
      if (/\b(open|opening|closing)\b/.test(state)) return;
      if (!menu.classList.contains("nds-peek") && !toggle.classList.contains("nds-peek")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      menu.classList.add("nds-peek");
      toggle.classList.add("nds-peek");
      window.setTimeout(function () {
        if (!toggle.isConnected) return;
        adminSidemenuDelayedOpen = true;
        toggle.click();
        window.setTimeout(function () {
          adminSidemenuDelayedOpen = false;
        }, 0);
      }, 180);
    }, true);
  }
  function activateAdminTab(target, scrollToPanel, sourceButton) {
    var button = sourceButton && sourceButton.dataset && sourceButton.dataset.adminTab === target
      ? sourceButton
      : qs('[data-admin-tab="' + target + '"]');
    var panel = qs('[data-admin-panel="' + target + '"]');
    var adminSection = qs(".admin-content-layout") || qs(".admin-section");
    var header = qs(".site-header");
    var navHeight = header ? header.offsetHeight : (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--site-shell-height"), 10) || 112);
    if (!button || button.hidden || (button.closest("[hidden]"))) return;
    if (!panel || panel.hidden && panel.dataset.adminPanel !== target) return;

    qsa("[data-admin-tab]").forEach(function (item) {
      var itemParent = item.closest("li");
      item.dataset.state = "";
      if (itemParent) itemParent.dataset.state = "";
    });
    qsa("[data-admin-panel]").forEach(function (item) {
      item.hidden = item.dataset.adminPanel !== target;
    });
    button.dataset.state = "selected";
    if (button.closest("li")) button.closest("li").dataset.state = "active";
    applyAdminPanelSection(target, button.getAttribute("data-" + target + "-section"));
    syncAdminSidemenuGroups(button);
    var sidemenuLabel = qs(".admin-sidemenu .nds-sidemenu-toggle .nds-label");
    if (sidemenuLabel) sidemenuLabel.textContent = (button.textContent || "").trim();
    if (target === "users" && hasPermission("users")) loadAdminUsers();
    refreshAdminSidemenuComponents();
    setAdminSidemenuOpen(false);
    if (scrollToPanel && adminSection) {
      window.scrollTo({
        top: Math.max(0, adminSection.getBoundingClientRect().top + window.scrollY - navHeight - 16),
        behavior: "smooth"
      });
    }
  }
  function applyPermissionVisibility() {
    qsa("[data-permission]").forEach(function (item) {
      item.hidden = !hasPermission(item.dataset.permission);
    });
    qsa(".admin-tabs > li[data-admin-group]").forEach(function (group) {
      var tabs = qsa("[data-admin-tab]", group);
      group.hidden = tabs.length > 0 && !tabs.some(function (button) {
        var item = button.closest("li");
        return !button.hidden && !button.closest("[hidden]") && item && !item.hidden;
      });
    });
    var selected = qs("[data-admin-tab][data-state~='selected']");
    var selectedWrap = selected ? selected.closest("[data-permission]") : null;
    var target = selected && (!selectedWrap || !selectedWrap.hidden) ? selected.dataset.adminTab : firstAllowedTab();
    activateAdminTab(target || "account", false);
  }
  function interfaceTextId(key) {
    return "interfaceText" + key.charAt(0).toUpperCase() + key.slice(1);
  }
  function renderInterfaceTextFields() {
    var root = qs("[data-interface-text-fields]");
    if (!root || root.dataset.ready === "true") return;
    INTERFACE_TEXT_FIELDS.forEach(function (config) {
      var key = config[0];
      var label = config[1];
      var isLong = Boolean(config[2]);
      var id = interfaceTextId(key);
      var container = document.createElement("div");
      var header = document.createElement("div");
      var labelNode = document.createElement("label");
      var labelText = document.createElement("span");
      var control = document.createElement("div");
      var input = document.createElement(isLong ? "textarea" : "input");

      container.className = "nds-form-container";
      header.className = "nds-form-header";
      labelNode.setAttribute("for", id);
      labelText.className = "nds-label";
      labelText.textContent = label;
      labelNode.append(labelText);
      header.append(labelNode);
      control.className = isLong ? "nds-form-control textarea-control" : "nds-form-control";
      input.className = "nds-input";
      input.id = id;
      input.name = id;
      input.dataset.interfaceTextKey = key;
      if (isLong) {
        input.rows = 3;
      } else {
        input.type = "text";
      }
      control.append(input);
      container.append(header, control);
      root.append(container);
    });
    root.dataset.ready = "true";
  }
  function fillInterfaceTextFields() {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.texts || {};
    var texts = data && data.texts || {};
    renderInterfaceTextFields();
    qsa("[data-interface-text-key]").forEach(function (input) {
      input.value = texts[input.dataset.interfaceTextKey] || defaults[input.dataset.interfaceTextKey] || "";
    });
  }
  function collectInterfaceTextFields() {
    data.texts = data.texts || {};
    qsa("[data-interface-text-key]").forEach(function (input) {
      data.texts[input.dataset.interfaceTextKey] = input.value.trim();
    });
  }
  function cloneData(value) {
    try {
      return JSON.parse(JSON.stringify(value || {}));
    } catch (error) {
      return {};
    }
  }
  function removeVolatileFields(value) {
    if (Array.isArray(value)) {
      return value.map(removeVolatileFields);
    }
    if (!value || typeof value !== "object") {
      return value;
    }
    var output = {};
    Object.keys(value).forEach(function (key) {
      if (key === "id" || key === "notifications") return;
      output[key] = removeVolatileFields(value[key]);
    });
    return output;
  }
  function dataSignature(value) {
    try {
      return JSON.stringify(removeVolatileFields(value || {}));
    } catch (error) {
      return "";
    }
  }
  function rememberSavedData() {
    lastSavedSignature = dataSignature(data);
    lastSavedSnapshot = cloneData(data);
  }
  function newEntityId(prefix) {
    return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }
  function ensureEntityId(item, prefix) {
    if (!item) return newEntityId(prefix);
    if (!item.id) item.id = newEntityId(prefix);
    return item.id;
  }
  function itemIdSet(items, prefix) {
    var ids = {};
    (items || []).forEach(function (item) {
      if (!item) return;
      ids[ensureEntityId(item, prefix)] = true;
    });
    return ids;
  }
  function addedItems(previousItems, currentItems, prefix) {
    var previousIds = itemIdSet(previousItems, prefix);
    return (currentItems || []).filter(function (item) {
      return item && item.id && !previousIds[item.id];
    });
  }
  function findItemById(items, id) {
    return (items || []).find(function (item) { return item && item.id === id; }) || null;
  }
  function stableText(value) {
    return slugify(value) || String(value || "").trim().toLowerCase();
  }
  function itemStableValues(item) {
    var values = [];
    if (!item) return values;
    [item.slug, item.title, item.name, item.meta].forEach(function (value) {
      var text = stableText(value);
      if (text && values.indexOf(text) === -1) values.push(text);
    });
    return values;
  }
  function findItemByStableValue(items, currentItem) {
    var currentValues = itemStableValues(currentItem);
    if (!currentValues.length) return null;
    return (items || []).find(function (item) {
      return itemStableValues(item).some(function (value) {
        return currentValues.indexOf(value) !== -1;
      });
    }) || null;
  }
  function findPreviousItem(items, currentItem) {
    return findItemById(items, currentItem && currentItem.id) || findItemByStableValue(items, currentItem);
  }
  function notificationEntityKey(type, item, fallback) {
    var key = stableText((item && (item.slug || item.title || item.name || item.meta)) || fallback || type);
    return ("admin:" + type + ":" + (key || "item")).slice(0, 255);
  }
  function homeItemSignature(item, type) {
    if (type === "skills") return [item.name || "", item.visible !== false ? "1" : "0"].join("\u001f");
    return [item.title || "", item.meta || "", item.description || "", item.visible !== false ? "1" : "0"].join("\u001f");
  }
  function addedPublicHomeItems(previousItems, currentItems, type) {
    var previousPublic = (previousItems || []).filter(function (item) {
      return isPublicHomeItem(item, type);
    });
    var previousKeys = {};
    var previousSignatures = {};
    previousPublic.forEach(function (item) {
      itemStableValues(item).forEach(function (key) { previousKeys[key] = true; });
      previousSignatures[homeItemSignature(item, type)] = true;
    });
    return (currentItems || []).filter(function (item, index) {
      var values;
      if (!isPublicHomeItem(item, type)) return false;
      values = itemStableValues(item);
      if (values.some(function (key) { return previousKeys[key]; })) return false;
      if (previousSignatures[homeItemSignature(item, type)]) return false;
      return index >= previousPublic.length;
    });
  }
  function publicTextChanged(previousItem, currentItem, signatureFn) {
    return !previousItem || signatureFn(previousItem) !== signatureFn(currentItem);
  }
  function saveDataIfChanged() {
    var signature = dataSignature(data);
    if (signature === lastSavedSignature || signature === pendingSaveSignature) return null;
    pendingSaveSignature = signature;
    return saveData().then(function (savedData) {
      pendingSaveSignature = "";
      return savedData;
    }).catch(function (error) {
      pendingSaveSignature = "";
      throw error;
    });
  }
  function toast(message, type) {
    if (!window.SiteApp) return;
    var variant = type || (/غير صالح|أولا|فشل|خطأ/.test(message || "") ? "error" : "success");
    if (window.SiteApp.showToast) {
      window.SiteApp.showToast(message, variant);
    } else {
      window.SiteApp.toast(message);
    }
  }

  function refreshPublicShell() {
    window.dispatchEvent(new CustomEvent("site:datachange"));
  }

  function addAdminNotification(options) {
    if (window.SiteApp && window.SiteApp.addNotification) {
      return window.SiteApp.addNotification(options);
    }
    return null;
  }

  function entityLabel(item, fallback) {
    return (item && (item.title || item.name || item.meta)) || fallback || "";
  }

  function isPublicPage(page) {
    return Boolean(page && page.visible === true && page.title && (page.content || page.image || page.video));
  }

  function isPublicProject(project) {
    return Boolean(project && project.visible !== false && project.title && (project.description || project.image || project.url || project.category || project.status || project.date));
  }

  function isPublicHomeItem(item, type) {
    if (!item || item.visible === false) return false;
    if (type === "skills") return Boolean(item.name);
    return Boolean(item.title || item.meta || item.description);
  }

  function pagePublicSignature(page) {
    return [page.title || "", page.slug || "", page.contentMode || "text", page.image || "", page.video || "", page.content || ""].join("\u001f");
  }

  function currentPageTimestamp() {
    var date = new Date();
    var pad = function (value) {
      return String(value).padStart(2, "0");
    };
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-") + " " + [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join(":");
  }

  function normalizePageTimestampValue(value, fallback) {
    var text = String(value || "").trim();
    return text || fallback || currentPageTimestamp();
  }

  function pageTrackingTimestamp(page) {
    return String((page && (page.updatedAt || page.updated_at || page.createdAt || page.created_at)) || "").trim();
  }

  function formatPageTrackingTimestamp(value) {
    var text = String(value || "").trim();
    var normalized;
    var date;
    if (!text) return "";
    normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text) ? text.replace(" ", "T") : text;
    date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return text;
    try {
      return new Intl.DateTimeFormat(document.documentElement.lang || "ar", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  }

  function pageTrackingLabel(page) {
    var timestamp = pageTrackingTimestamp(page);
    return timestamp ? "آخر تحديث: " + formatPageTrackingTimestamp(timestamp) : "";
  }

  function ensurePageTimestamps(page) {
    var now = currentPageTimestamp();
    if (!page) return page;
    page.createdAt = normalizePageTimestampValue(page.createdAt || page.created_at, now);
    page.updatedAt = normalizePageTimestampValue(page.updatedAt || page.updated_at, page.createdAt);
    return page;
  }

  function pageEditorSignature(page) {
    return [
      page.title || "",
      page.slug || "",
      page.parentSlug || "",
      page.visible === false ? "0" : "1",
      page.showInNavigation === false ? "0" : "1",
      page.showInFooter === true ? "1" : "0",
      page.contentMode || "text",
      page.image || "",
      page.video || "",
      page.content || ""
    ].join("\u001f");
  }

  function projectPublicSignature(project) {
    return [project.title || "", project.slug || "", project.status || "", project.date || "", project.category || "", project.image || "", project.url || "", project.description || ""].join("\u001f");
  }

  function notifyPageChange(page, previousPage) {
    var wasPublic = isPublicPage(previousPage);
    return addAdminNotification({
      status: "info",
      key: notificationEntityKey("page", page, "page"),
      tag: wasPublic ? "تحديث" : "جديد",
      title: wasPublic ? "تم تحديث صفحة" : "تمت إضافة صفحة جديدة",
      description: (wasPublic ? "تم تحديث صفحة: " : "تم نشر صفحة جديدة: ") + entityLabel(page, "صفحة جديدة") + ".",
      href: "pages.html"
    });
  }

  function notifyProjectChange(project, previousProject) {
    var wasPublic = isPublicProject(previousProject);
    return addAdminNotification({
      status: "success",
      key: notificationEntityKey("project", project, "project"),
      tag: wasPublic ? "تحديث" : "جديد",
      title: wasPublic ? "تم تحديث مشروع" : "تمت إضافة مشروع جديد",
      description: (wasPublic ? "تم تحديث مشروع: " : "تم نشر مشروع جديد: ") + entityLabel(project, "مشروع جديد") + ".",
      href: "projects.html"
    });
  }

  function notifyHomeItemAdded(type, item) {
    var labels = {
      experience: { title: "تمت إضافة خبرة جديدة", fallback: "خبرة جديدة", status: "success" },
      achievements: { title: "تمت إضافة إنجاز جديد", fallback: "إنجاز جديد", status: "success" },
      skills: { title: "تمت إضافة مهارة جديدة", fallback: "مهارة جديدة", status: "info" }
    };
    var config = labels[type] || labels.experience;
    return addAdminNotification({
      status: config.status,
      key: notificationEntityKey(type, item, config.fallback),
      tag: "جديد",
      title: config.title,
      description: config.title + ": " + entityLabel(item, config.fallback) + ".",
      href: "index.html"
    });
  }

  function notifyHomeUpdated() {
    return addAdminNotification({
      status: "success",
      key: "admin:home:update",
      tag: "تحديث",
      title: "تم تحديث الصفحة الرئيسية",
      description: "تم حفظ محتوى السيرة أو القسم الرئيسي أو التذييل أو الملف الشخصي من لوحة الإدارة.",
      href: "index.html"
    });
  }

  function notifyAddedHomeItems(previousData) {
    var previousHome = previousData && previousData.home || {};
    var addedExperience = addedPublicHomeItems(previousHome.experience, data.home.experience, "experience");
    var addedAchievements = addedPublicHomeItems(previousHome.achievements, data.home.achievements, "achievements");
    var addedSkills = addedPublicHomeItems(previousHome.skills, data.home.skills, "skills");
    addedExperience.forEach(function (item) { notifyHomeItemAdded("experience", item); });
    addedAchievements.forEach(function (item) { notifyHomeItemAdded("achievements", item); });
    addedSkills.forEach(function (item) { notifyHomeItemAdded("skills", item); });
    return addedExperience.length + addedAchievements.length + addedSkills.length;
  }

  function saveData() {
    var currentData = window.SiteStore && window.SiteStore.current ? window.SiteStore.current() : null;
    if (currentData && Array.isArray(currentData.notifications)) {
      data.notifications = currentData.notifications;
    } else if (!Array.isArray(data.notifications)) {
      data.notifications = [];
    }
    return window.SiteStore.save(data).then(function (savedData) {
      data = savedData;
      rememberSavedData();
      renderSystemConsole();
      return data;
    }).catch(function (error) {
      toast(error.message || "تعذر حفظ البيانات", "error");
      throw error;
    });
  }

  function safeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function adminNowIso() {
    return new Date().toISOString();
  }

  function formatAdminDateTime(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch (error) {
      return String(value || "");
    }
  }

  function formatBytes(bytes) {
    var size = Number(bytes) || 0;
    var units = ["B", "KB", "MB", "GB"];
    var index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }
    return (index ? size.toFixed(size >= 10 ? 1 : 2) : Math.round(size)) + " " + units[index];
  }

  function jsonByteSize(text) {
    try {
      return new Blob([String(text || "")]).size;
    } catch (error) {
      return String(text || "").length;
    }
  }

  function readAdminActivityLog() {
    try {
      var parsed = JSON.parse(localStorage.getItem(ADMIN_ACTIVITY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function writeAdminActivityLog(items) {
    try {
      localStorage.setItem(ADMIN_ACTIVITY_KEY, JSON.stringify((items || []).slice(0, 30)));
    } catch (error) {
      return;
    }
  }

  function addAdminActivity(title, description, status) {
    var items = readAdminActivityLog();
    items.unshift({
      title: title || "إجراء إداري",
      description: description || "",
      status: status || "success",
      at: adminNowIso()
    });
    writeAdminActivityLog(items);
    renderAdminActivityLog();
    renderSystemStatus();
  }

  function clearAdminActivityLog() {
    writeAdminActivityLog([]);
    renderAdminActivityLog();
    renderSystemStatus();
  }

  function collectCurrentAdminDrafts() {
    if (!data) return;
    data.settings = data.settings || {};
    data.navigation = data.navigation || {};
    data.home = data.home || {};
    data.texts = data.texts || {};
    try { collectInterfaceTextFields(); } catch (error) { /* Form not mounted yet. */ }
    try { collectHomeDraft(); } catch (error) { /* Form not mounted yet. */ }
    try { collectFooterDraft(); } catch (error) { /* Form not mounted yet. */ }
    try { collectProjects({ keepDrafts: true }); } catch (error) { /* Form not mounted yet. */ }
    try { collectPages(); } catch (error) { /* Form not mounted yet. */ }
    try { collectIntegrations({ keepDrafts: true }); } catch (error) { /* Form not mounted yet. */ }
  }

  function dataJsonSnapshot() {
    collectCurrentAdminDrafts();
    return JSON.stringify(data || {}, null, 2);
  }

  function visibleCount(items) {
    return (items || []).filter(function (item) {
      return item && item.visible !== false;
    }).length;
  }

  function countFooterLinks() {
    var total = 0;
    var visible = 0;
    function count(items) {
      (items || []).forEach(function (item) {
        if (!item) return;
        total += 1;
        if (item.visible !== false) visible += 1;
      });
    }
    count(data && data.home && data.home.footerLinks);
    count(data && data.footer && data.footer.bottomLinks);
    ((data && data.footer && data.footer.columns) || []).forEach(function (column) {
      count(column && column.links);
    });
    return { total: total, visible: visible };
  }

  function enabledIntegrationCount() {
    return ((data && data.integrations) || []).filter(function (integration) {
      return integration && integration.enabled !== false;
    }).length;
  }

  function cookieConsentLabel() {
    var value = "";
    if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.getConsent) {
      value = window.NDS.Cookies.getConsent();
    }
    if (!value) {
      var match = document.cookie.match(/(?:^|;\s*)cookieConsent=([^;]+)/);
      value = match ? decodeURIComponent(match[1]) : "";
    }
    if (value === "accepted") return "مقبولة";
    if (value === "declined") return "مرفوضة";
    return "لم يحدد";
  }

  function systemStatusTagHtml(status, label) {
    if (!label) return "";
    return '<span class="system-status-tag" data-status="' + safeText(status || "info") + '">' + safeText(label) + '</span>';
  }

  function systemStatusItemHtml(title, value, meta, status, label) {
    return [
      '<article class="system-status-item">',
      '<div class="system-status-row">',
      '<span class="system-status-title">' + safeText(title) + '</span>',
      systemStatusTagHtml(status, label),
      '</div>',
      '<strong class="system-status-value">' + safeText(value) + '</strong>',
      '<span class="system-status-meta">' + safeText(meta) + '</span>',
      '</article>'
    ].join("");
  }

  function renderSystemStatus() {
    var root = qs("[data-system-status-grid]");
    var projects;
    var pages;
    var footerLinks;
    var integrations;
    var json;
    var previewKey;
    var previewRaw;
    var cookies;
    var user;
    var activityCount;
    if (!root || !data) return;
    projects = data.projects || [];
    pages = data.pages || [];
    footerLinks = countFooterLinks();
    integrations = data.integrations || [];
    json = JSON.stringify(data || {});
    previewKey = (window.SiteStore && window.SiteStore.previewKey) || "websiteDemo:previewData";
    previewRaw = localStorage.getItem(previewKey);
    cookies = data.footer && data.footer.cookies || {};
    user = currentAdminUser() || {};
    activityCount = readAdminActivityLog().length;
    root.innerHTML = [
      systemStatusItemHtml("حجم المحتوى", formatBytes(jsonByteSize(json)), "حجم JSON الحالي في لوحة الإدارة", "success", "جاهز"),
      systemStatusItemHtml("المشاريع", visibleCount(projects) + " / " + projects.length, "منشورة من إجمالي المشاريع", projects.length ? "success" : "info", projects.length ? "نشط" : "فارغ"),
      systemStatusItemHtml("الصفحات", visibleCount(pages) + " / " + pages.length, "صفحات ظاهرة من إجمالي الصفحات", pages.length ? "success" : "info", pages.length ? "نشط" : "فارغ"),
      systemStatusItemHtml("روابط التذييل", footerLinks.visible + " / " + footerLinks.total, "روابط مفعلة داخل التذييل", footerLinks.total ? "success" : "info", footerLinks.total ? "منظم" : "فارغ"),
      systemStatusItemHtml("التكاملات", enabledIntegrationCount() + " / " + integrations.length, "تكاملات مفعلة من إجمالي التكاملات", enabledIntegrationCount() ? "success" : "info", enabledIntegrationCount() ? "مفعل" : "غير مفعل"),
      systemStatusItemHtml("إشعار الكوكيز", cookies.enabled === false ? "متوقف" : "مفعل", cookieConsentLabel(), cookies.enabled === false ? "error" : "success", cookies.enabled === false ? "متوقف" : "مفعل"),
      systemStatusItemHtml("المعاينة", previewRaw ? formatBytes(jsonByteSize(previewRaw)) : "لا توجد", "بيانات المعاينة المؤقتة في هذا المتصفح", previewRaw ? "info" : "success", previewRaw ? "مؤقت" : "نظيف"),
      systemStatusItemHtml("المستخدم", user.displayName || user.email || "جلسة الإدارة", roleLabel(user.role), user ? "success" : "info", user.role || "admin"),
      systemStatusItemHtml("سجل النشاط", String(activityCount), "آخر إجراءات هذا المتصفح", activityCount ? "info" : "success", activityCount ? "نشط" : "نظيف")
    ].join("");
  }

  function renderAdminActivityLog() {
    var root = qs("[data-system-activity-log]");
    var items;
    if (!root) return;
    items = readAdminActivityLog();
    if (!items.length) {
      root.innerHTML = [
        '<div class="integration-status-card">',
        '<span class="integration-status-dot" aria-hidden="true"></span>',
        '<span class="nds-label">لا توجد إجراءات مسجلة في هذا المتصفح.</span>',
        '</div>'
      ].join("");
      return;
    }
    root.innerHTML = items.slice(0, 8).map(function (item) {
      return [
        '<article class="system-activity-item" data-status="' + safeText(item.status || "info") + '">',
        '<span class="system-activity-dot" aria-hidden="true"></span>',
        '<span class="system-activity-text">',
        '<strong class="system-activity-title">' + safeText(item.title) + '</strong>',
        '<span class="system-activity-desc">' + safeText(item.description) + '</span>',
        '</span>',
        '<time class="system-activity-time" datetime="' + safeText(item.at) + '">' + safeText(formatAdminDateTime(item.at)) + '</time>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderSystemConsole() {
    renderSystemStatus();
    renderAdminActivityLog();
  }

  function setMaintenanceResult(status, message) {
    var box = qs("[data-system-maintenance-result]");
    var label = qs("[data-system-maintenance-message]");
    if (!box || !label) return;
    box.hidden = false;
    box.dataset.status = status || "info";
    label.textContent = message || "";
  }

  function validateAdminUrl(url) {
    var value = String(url || "").trim();
    if (!value) return false;
    if (/^javascript:/i.test(value)) return false;
    if (/\s/.test(value)) return false;
    if (value.charAt(0) === "#") return true;
    try {
      new URL(value, window.location.href);
      return true;
    } catch (error) {
      return false;
    }
  }

  function validateAdminLinks() {
    var issues = [];
    function inspect(label, url, required) {
      var cleanUrl = String(url || "").trim();
      if (!cleanUrl && required) {
        issues.push(label + ": رابط مفقود");
        return;
      }
      if (cleanUrl && !validateAdminUrl(cleanUrl)) {
        issues.push(label + ": رابط غير صالح");
      }
    }
    collectCurrentAdminDrafts();
    ((data.home && data.home.footerLinks) || []).forEach(function (link, index) {
      if (!link || link.visible === false) return;
      inspect(link.label || ("رابط التذييل " + (index + 1)), link.url, true);
    });
    ((data.footer && data.footer.columns) || []).forEach(function (column) {
      ((column && column.links) || []).forEach(function (link, index) {
        if (!link || link.visible === false) return;
        inspect((column.title || "عمود التذييل") + " - " + (link.label || ("رابط " + (index + 1))), link.url, true);
      });
    });
    ((data.footer && data.footer.bottomLinks) || []).forEach(function (link, index) {
      if (!link || link.visible === false) return;
      inspect(link.label || ("رابط سفلي " + (index + 1)), link.url, true);
    });
    ((data.home && data.home.contacts) || []).forEach(function (contact, index) {
      if (!contact || contact.visible === false) return;
      inspect(contact.label || ("وسيلة تواصل " + (index + 1)), contact.url, true);
    });
    ((data.projects) || []).forEach(function (project, index) {
      if (!project || project.visible === false || !project.url) return;
      inspect(project.title || ("مشروع " + (index + 1)), project.url, false);
    });
    return issues;
  }

  function runSystemLinkCheck() {
    var issues = validateAdminLinks();
    if (issues.length) {
      setMaintenanceResult("error", "تم العثور على " + issues.length + " ملاحظة. أول ملاحظة: " + issues[0]);
      addAdminActivity("فحص الروابط", "تم العثور على " + issues.length + " رابط يحتاج مراجعة.", "error");
      return;
    }
    setMaintenanceResult("success", "كل الروابط الإدارية الظاهرة اجتازت الفحص الأساسي.");
    addAdminActivity("فحص الروابط", "لم يتم العثور على روابط مفقودة أو غير صالحة.", "success");
  }

  function clearPreviewCache() {
    localStorage.removeItem((window.SiteStore && window.SiteStore.previewKey) || "websiteDemo:previewData");
    setMaintenanceResult("success", "تم مسح بيانات المعاينة المؤقتة لهذا المتصفح.");
    addAdminActivity("مسح المعاينة المؤقتة", "تم حذف بيانات المعاينة من localStorage.", "success");
  }

  function resetCookieConsent() {
    if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.delete) {
      window.NDS.Cookies.delete("cookieConsent");
    } else {
      document.cookie = "cookieConsent=; Max-Age=0; path=/";
    }
    if (window.SiteApp && window.SiteApp.renderCookieConsent) {
      window.SiteApp.renderCookieConsent(data, { preview: true });
    }
    setMaintenanceResult("success", "تم مسح قرار الكوكيز. سيظهر الإشعار مرة أخرى لهذا المتصفح.");
    addAdminActivity("إعادة طلب موافقة الكوكيز", "تم حذف قرار الكوكيز المحلي وإظهار المعاينة.", "success");
  }

  function systemBackupFilename() {
    return "site-content-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") + ".json";
  }

  function downloadJsonFile(filename, json) {
    var blob = new Blob([json], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  function downloadSystemBackup(filename) {
    var json = dataJsonSnapshot();
    setValue("jsonBox", json);
    downloadJsonFile(filename || systemBackupFilename(), json);
    addAdminActivity("تصدير نسخة احتياطية", "تم تنزيل ملف JSON بحجم " + formatBytes(jsonByteSize(json)) + ".", "success");
    toast("تم تجهيز ملف التصدير");
  }

  function copyJsonSnapshot() {
    var json = dataJsonSnapshot();
    var textarea;
    setValue("jsonBox", json);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () {
        addAdminActivity("نسخ JSON", "تم نسخ نسخة المحتوى إلى الحافظة.", "success");
        toast("تم نسخ JSON");
      }).catch(function () {
        toast("تعذر نسخ JSON", "error");
      });
      return;
    }
    textarea = document.createElement("textarea");
    textarea.value = json;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.inset = "0 auto auto 0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      addAdminActivity("نسخ JSON", "تم نسخ نسخة المحتوى إلى الحافظة.", "success");
      toast("تم نسخ JSON");
    } catch (error) {
      toast("تعذر نسخ JSON", "error");
    }
    textarea.remove();
  }

  function dragHandleHtml(label) {
    return [
      '<span class="editor-drag-handle" draggable="true" role="button" tabindex="0" data-drag-handle aria-label="' + safeText(label || "تغيير الترتيب") + '" title="' + safeText(label || "تغيير الترتيب") + '">',
      '<i class="nds-icon nds-hgi-menu-01" aria-hidden="true"></i>',
      '</span>'
    ].join("");
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function generatedProjectSlug(index) {
    var suffix = Date.now();
    if (Number.isFinite(index)) suffix += "-" + (index + 1);
    return "project-" + suffix;
  }

  function isGeneratedProjectSlug(value) {
    return /^project-\d+(?:-\d+)?$/.test(slugify(value));
  }

  function projectHasDraftContent(project) {
    return Boolean(project && (project.title || project.description || project.category || project.status || project.date || project.image || project.url));
  }

  function ensureUniqueProjectSlugs(projects) {
    var used = {};
    (projects || []).forEach(function (project, index) {
      var seed = slugify(project && (project.slug || project.title)) || generatedProjectSlug(index);
      var candidate = seed;
      var suffix = 2;
      while (used[candidate]) {
        candidate = seed + "-" + suffix;
        suffix += 1;
      }
      if (project) project.slug = candidate;
      used[candidate] = true;
    });
  }

  function parseLines(text, mapper) {
    return String(text || "")
      .split(/\n+/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line) {
        return mapper(line.split("|").map(function (part) { return part.trim(); }));
      })
      .filter(Boolean);
  }

  function formatItems(items) {
    return (items || []).map(function (item) {
      return [item.title, item.meta, item.description].filter(Boolean).join(" | ");
    }).join("\n");
  }

  function fillForms() {
    return window.SiteStore.load().then(function (loadedData) {
      data = loadedData;
      fillLoadedForms();
      return data;
    }).catch(function (error) {
      toast(error.message || "تعذر تحميل بيانات الموقع", "error");
      data = window.SiteStore.current();
      fillLoadedForms();
      return data;
    });
  }

  function fillLoadedForms() {
    data.home = data.home || {};
    migrateLegacyHeroMediaToSlides();
    setValue("siteName", data.settings.siteName);
    setValue("siteNameNav", data.settings.siteName);
    setValue("brandName", data.settings.brandName);
    setValue("brandSlogan", data.settings.brandSlogan);
    setValue("brandLogo", data.settings.brandLogo);
    setValue("siteIcon", data.settings.siteIcon);
    setValue("settingsPhone", data.settings.phoneNumber);
    setValue("settingsEmail", data.settings.email);
    setValue("siteLanguage", data.settings.language);
    setValue("siteDirection", data.settings.direction);
    setValue("siteTheme", data.settings.theme);
    setValue("shellTopbarText", data.settings.shellTopbarText);
    setValue("shellTopbarShortText", data.settings.shellTopbarShortText);
    setValue("shellVerifyLabel", data.settings.shellVerifyLabel);
    setValue("shellVerifyTitle", data.settings.shellVerifyTitle);
    setValue("shellVerifyDescription", data.settings.shellVerifyDescription);
    setValue("shellSecurityTitle", data.settings.shellSecurityTitle);
    setValue("shellSecurityDescription", data.settings.shellSecurityDescription);
    setValue("shellNoticeText", data.settings.shellNoticeText);
    fillInterfaceTextFields();
    setValue("homeLabel", data.navigation.homeLabel);
    setValue("pagesLabel", data.navigation.pagesLabel);
    setValue("projectsLabel", data.navigation.projectsLabel);
    setValue("adminLabel", data.navigation.adminLabel);

    setValue("ownerName", data.home.ownerName);
    setValue("title", data.home.title);
    setValue("intro", data.home.intro);
    setValue("avatar", data.home.avatar);
    setValue("biography", data.home.biography);
    setValue("heroImage", data.home.heroImage);
    setValue("heroVideo", data.home.heroVideo);
    setValue("skills", (data.home.skills || []).map(function (item) { return typeof item === "string" ? item : item.name; }).join("\n"));
    setValue("experience", formatItems(data.home.experience || []));
    setValue("achievements", formatItems(data.home.achievements || []));
    setValue("footerLinksHeading", data.texts.footerLinksHeading);
    setValue("footerSocialHeading", data.texts.footerSocialHeading);
    setValue("footerSocialEmpty", data.texts.footerSocialEmpty);
    setValue("footerVersion", data.texts.footerVersion);
    setValue("footerCopyrightText", data.footer && data.footer.copyrightText);
    setValue("footerLegalText", data.footer && Object.prototype.hasOwnProperty.call(data.footer, "legalText") ? data.footer.legalText : data.texts.footerDisclaimer);
    fillFooterCookieFields();

    renderHeroSlidesEditor();
    renderContentRowsEditor("experience");
    renderContentRowsEditor("achievements");
    renderSkillsEditor();
    renderFooterEditors();
    renderProjectsEditor();
    renderPagesEditor();
    renderFooterCookiePagesList();
    renderIntegrationsEditor();
    renderSystemConsole();
    prepareUploadControls();
    rememberLoadedEditorState();
  }

  function rememberLoadedEditorState() {
    collectHomeDraft();
    collectFooterDraft();
    collectProjects();
    collectPages();
    collectIntegrations();
    rememberSavedData();
  }

  function migrateLegacyHeroMediaToSlides() {
    data.home.heroSlides = data.home.heroSlides || [];
    var legacyImage = data.home.heroImage || "";
    var legacyVideo = data.home.heroVideo || "";
    var hasLegacyMedia = hasAdminText(legacyImage) || hasAdminText(legacyVideo);
    var alreadyInSlides = data.home.heroSlides.some(function (slide) {
      return String(slide.image || "") === String(legacyImage || "")
        && String(slide.video || "") === String(legacyVideo || "");
    });
    if (hasLegacyMedia && !alreadyInSlides) {
      data.home.heroSlides.unshift({
        title: "",
        subtitle: "",
        intro: "",
        image: legacyImage,
        mobileImage: "",
        video: legacyVideo,
        mobileVideo: "",
        alt: "",
        visible: true
      });
    }
    data.home.heroImage = "";
    data.home.heroVideo = "";
    data.home.heroTitle = "";
    data.home.heroSubtitle = "";
    data.home.heroIntro = "";
  }

  function saveSettings(event) {
    event.preventDefault();
    if (!ensurePermission("settings")) return;
    data.settings.siteName = value("siteName");
    data.navigation.pagesLabel = value("pagesLabel") || data.navigation.pagesLabel || "الصفحات";
    data.settings.brandName = value("brandName");
    data.settings.brandSlogan = value("brandSlogan");
    data.settings.brandLogo = value("brandLogo");
    data.settings.siteIcon = value("siteIcon");
    data.settings.phoneNumber = value("settingsPhone");
    data.settings.email = value("settingsEmail");
    data.settings.language = value("siteLanguage") || "ar";
    data.settings.direction = value("siteDirection") || "rtl";
    data.settings.theme = value("siteTheme") || data.settings.theme || "light";
    data.settings.shellTopbarText = value("shellTopbarText");
    data.settings.shellTopbarShortText = value("shellTopbarShortText");
    data.settings.shellVerifyLabel = value("shellVerifyLabel");
    data.settings.shellVerifyTitle = value("shellVerifyTitle");
    data.settings.shellVerifyDescription = value("shellVerifyDescription");
    data.settings.shellSecurityTitle = value("shellSecurityTitle");
    data.settings.shellSecurityDescription = value("shellSecurityDescription");
    data.settings.shellNoticeText = value("shellNoticeText");
    collectInterfaceTextFields();
    saveData().then(function () {
      addAdminActivity("حفظ الإعدادات", "تم تحديث إعدادات الهوية والواجهة.", "success");
      toast("تم حفظ إعدادات الموقع");
    });
  }

  function saveNavigation(event) {
    event.preventDefault();
    if (!ensurePermission("navigation")) return;
    data.settings.siteName = value("siteNameNav") || value("siteName");
    data.navigation.pagesLabel = value("pagesLabel") || data.navigation.pagesLabel || "الصفحات";
    data.navigation.homeLabel = value("homeLabel") || "الرئيسية";
    data.navigation.projectsLabel = value("projectsLabel") || "المشاريع";
    data.navigation.adminLabel = value("adminLabel") || "الإدارة";
    saveData().then(function () {
      addAdminActivity("حفظ التنقل", "تم تحديث تسميات ومسارات التنقل.", "success");
      toast("تم حفظ إعدادات التنقل");
    });
  }

  function collectHomeDraft() {
    data.home.ownerName = value("ownerName");
    data.home.title = value("title");
    data.home.intro = value("intro");
    data.home.avatar = value("avatar");
    data.home.biography = value("biography");
    data.home.heroTitle = "";
    data.home.heroSubtitle = "";
    data.home.heroIntro = "";
    data.home.heroImage = "";
    data.home.heroVideo = "";
    data.home.heroSlides = collectHeroSlides();
    data.home.experience = collectContentRows("experience");
    data.home.achievements = collectContentRows("achievements");
    data.home.skills = collectSkills();
    if (!data.home.experience.length && value("experience")) {
      data.home.experience = parseLines(value("experience"), function (parts) {
        return parts.length ? { id: newEntityId("experience"), title: parts[0] || "", meta: parts[1] || "", description: parts.slice(2).join(" | ") || "", visible: true } : null;
      });
    }
    if (!data.home.achievements.length && value("achievements")) {
      data.home.achievements = parseLines(value("achievements"), function (parts) {
        return parts.length ? { id: newEntityId("achievement"), title: parts[0] || "", meta: parts[1] || "", description: parts.slice(2).join(" | ") || "", visible: true } : null;
      });
    }
    if (!data.home.skills.length && value("skills")) {
      data.home.skills = value("skills").split(/\n+/).map(function (item) {
        return { id: newEntityId("skill"), name: item.trim(), visible: true };
      }).filter(function (item) { return item.name; });
    }
  }

  function collectFooterDraft() {
    ensureFooterData();
    data.texts.footerLinksHeading = value("footerLinksHeading") || data.texts.footerLinksHeading || "روابط سريعة";
    data.texts.footerSocialHeading = value("footerSocialHeading") || data.texts.footerSocialHeading || "وسائل التواصل";
    data.texts.footerSocialEmpty = value("footerSocialEmpty") || data.texts.footerSocialEmpty || "لم تتم إضافة وسائل تواصل بعد";
    data.texts.footerVersion = value("footerVersion") || data.texts.footerVersion || "";
    data.texts.footerDisclaimer = value("footerLegalText");
    data.footer.copyrightText = value("footerCopyrightText");
    data.footer.legalText = value("footerLegalText");
    data.home.contacts = collectContacts();
    data.home.footerLinks = collectFooterLinks();
    data.footer.columns = collectFooterColumns();
    data.footer.iconGroups = collectFooterIconGroups();
    data.footer.bottomLinks = collectFooterBottomLinks();
    data.footer.logos = collectFooterLogos();
    data.footer.cookies = collectFooterCookies();
  }

  function saveFooter(event) {
    event.preventDefault();
    if (!ensurePermission("footer")) return;
    collectFooterDraft();
    saveData().then(function () {
      refreshPublicShell();
      addAdminActivity("حفظ التذييل", "تم تحديث روابط التذييل وإعدادات الكوكيز.", "success");
      toast("تم حفظ التذييل");
    });
  }

  function saveHome(event) {
    event.preventDefault();
    if (!ensurePermission("home")) return;
    var previousData = cloneData(lastSavedSnapshot || data);
    collectHomeDraft();
    var savePromise = saveDataIfChanged();
    if (!savePromise) return;
    savePromise.then(function () {
      if (!notifyAddedHomeItems(previousData)) notifyHomeUpdated();
      addAdminActivity("حفظ الرئيسية", "تم تحديث محتوى الصفحة الرئيسية.", "success");
      toast("تم حفظ محتوى الصفحة الرئيسية");
    });
  }

  function inputHtml(key, label, value, info) {
    var placeholder = info ? ' placeholder="' + safeText(info) + '"' : "";
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-form-control"><input class="nds-input" data-field="' + safeText(key) + '" type="text" value="' + safeText(value) + '"' + placeholder + '></div>',
      '</div>'
    ].join("");
  }

  function passwordHtml(key, label, info) {
    var placeholder = info ? ' placeholder="' + safeText(info) + '"' : "";
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-form-control"><input class="nds-input" data-field="' + safeText(key) + '" type="password" autocomplete="new-password"' + placeholder + '></div>',
      '</div>'
    ].join("");
  }

  function uploadProgressHtml() {
    return [
      '<div class="nds-progress-bar nds-lg admin-upload-progress" data-value="0" data-upload-progress hidden>',
      '<span class="nds-progress-label" data-upload-progress-label></span>',
      '<div class="nds-progress-track">',
      '<div class="nds-progress-fill"></div>',
      '</div>',
      '<span class="nds-feedback nds-sm" data-status="info">',
      '<span class="nds-feedback-icon"><i class="nds-icon" aria-hidden="true"></i></span>',
      '<span class="nds-feedback-message" data-upload-progress-message></span>',
      '</span>',
      '</div>'
    ].join("");
  }

  function uploadButtonLabel(type) {
    var value = String(type || "").toLowerCase();
    if (value.indexOf("video") !== -1) return "رفع فيديو";
    if (value.indexOf("logo") !== -1) return "رفع شعار";
    if (value.indexOf("image") !== -1 || value.indexOf("icon") !== -1) return "رفع صورة";
    return "رفع ملف";
  }

  function uploadAcceptAttribute(type) {
    var value = String(type || "").toLowerCase();
    if (value.indexOf("video") !== -1) return ' accept=".mp4,.webm"';
    if (value.indexOf("image") !== -1 || value.indexOf("icon") !== -1 || value.indexOf("logo") !== -1) {
      return ' accept=".jpg,.jpeg,.png,.webp,.svg"';
    }
    return "";
  }

  function uploadBrowseButtonHtml(label) {
    var safeLabel = safeText(label || "Browse Files");
    return [
      '<div class="nds-form-action">',
      '<button type="button" class="nds-btn nds-neutral nds-md nds-browse-btn" data-upload-browse>',
      '<i class="hgi hgi-stroke hgi-folder-01" aria-hidden="true"></i>',
      '<span class="nds-label" data-upload-button-label>' + safeLabel + '</span>',
      '</button>',
      '</div>'
    ].join("");
  }

  function uploadZoneHtml() {
    return [
      '<div class="nds-upload-zone" aria-hidden="true">',
      '<i class="hgi hgi-stroke hgi-file-upload nds-upload-icon" aria-hidden="true"></i>',
      '<div class="nds-upload-text"><span class="nds-drop-hint">Drag and drop files here to upload</span></div>',
      '<div class="nds-upload-hint">Maximum file size allowed is 2MB, supported file formats include .jpg, .png, and .pdf.</div>',
      '</div>'
    ].join("");
  }

  function uploadFileItemTemplateHtml() {
    return [
      '<div class="nds-file-item-template" style="display: none;">',
      '<div class="nds-file-item">',
      '<span class="nds-feedback"><span class="nds-feedback-icon"><i class="nds-icon" aria-hidden="true"></i></span></span>',
      '<div class="nds-progress-circle" style="--progress-size: 24px; --progress-value: 0;">',
      '<svg width="24" height="24" viewBox="0 0 24 24">',
      '<circle class="nds-progress-bg" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>',
      '<circle class="nds-progress-track" cx="12" cy="12" r="10" fill="none" stroke-width="3" stroke-dasharray="62.83" stroke-dashoffset="62.83" stroke-linecap="round"></circle>',
      '</svg>',
      '<div class="nds-progress-info"><span class="nds-progress-percentage"><span class="nds-progress-number"></span></span></div>',
      '</div>',
      '<div class="nds-file-info"><div class="nds-file-name nds-truncate"></div><div class="nds-file-error"><span class="nds-error-message"></span></div></div>',
      '<div class="nds-file-actions"><button type="button" class="nds-btn nds-subtle nds-sm nds-icon-only nds-remove-file" aria-label="Remove file"><i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i></button></div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function uploadComponentExtrasHtml() {
    return [
      '<div class="nds-file-list"></div>',
      '<div class="nds-form-footer"></div>',
      uploadFileItemTemplateHtml()
    ].join("");
  }

  function uploadFileControlInnerHtml(inputAttributes, label) {
    var safeLabel = safeText(label || uploadButtonLabel(""));
    return [
      '<div class="nds-form-control upload-file-control" data-upload-label="' + safeLabel + '">',
      '<input class="nds-file-input file-input" type="file" ' + inputAttributes + '>',
      uploadZoneHtml(),
      uploadBrowseButtonHtml(label),
      '</div>'
    ].join("");
  }

  function uploadFileComponentHtml(inputAttributes, label, className) {
    return [
      '<div class="nds-form-container nds-file-upload ' + safeText(className || "upload-file-container") + '" data-state="single">',
      uploadFileControlInnerHtml(inputAttributes, label),
      uploadComponentExtrasHtml(),
      '</div>'
    ].join("");
  }

  function uploadControlHtml(targetField, type) {
    var safeType = safeText(type || "image");
    var label = uploadButtonLabel(type);
    var inputAttributes = 'data-media-upload="' + safeType + '" data-upload-target-field="' + safeText(targetField) + '"' + uploadAcceptAttribute(type);
    return [
      '<div class="nds-form-container nds-file-upload upload-inline-control" data-state="single">',
      '<div class="nds-form-header"><label><span class="nds-label">رفع ملف</span></label></div>',
      uploadFileControlInnerHtml(inputAttributes, label),
      uploadComponentExtrasHtml(),
      '</div>'
    ].join("");
  }

  function uploadableInputHtml(key, label, value, type, info) {
    var safeType = safeText(type || "image");
    var uploadLabel = uploadButtonLabel(type);
    var inputAttributes = 'data-media-upload="' + safeType + '" data-upload-target-field="' + safeText(key) + '"' + uploadAcceptAttribute(type);
    var placeholder = info ? ' placeholder="' + safeText(info) + '"' : "";
    return [
      '<div class="nds-form-container uploadable-field">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="uploadable-control-row">',
      '<div class="nds-form-control upload-path-control"><input class="nds-input" data-field="' + safeText(key) + '" type="text" value="' + safeText(value) + '"' + placeholder + '></div>',
      uploadFileComponentHtml(inputAttributes, uploadLabel, "upload-file-container"),
      '</div>',
      uploadProgressHtml(),
      '</div>'
    ].join("");
  }

  function textareaHtml(key, label, value, rows, info, options) {
    var opts = options || {};
    var placeholder = info ? ' placeholder="' + safeText(info) + '"' : "";
    var className = "nds-input" + (opts.className ? " " + safeText(opts.className) : "");
    var attributes = "";
    if (opts.dir) attributes += ' dir="' + safeText(opts.dir) + '"';
    if (opts.spellcheck !== undefined) attributes += ' spellcheck="' + (opts.spellcheck ? "true" : "false") + '"';
    if (opts.contentMode) attributes += ' data-content-editor-mode="' + safeText(opts.contentMode) + '"';
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-form-control textarea-control"><textarea class="' + className + '" data-field="' + safeText(key) + '" rows="' + rows + '"' + placeholder + attributes + '>' + safeText(value) + '</textarea></div>',
      '</div>'
    ].join("");
  }

  function pageEditorToolbarHtml() {
    var fontOptions = PAGE_EDITOR_FONTS.map(function (font) {
      return '<option value="' + safeText(font.value) + '">' + safeText(font.label) + '</option>';
    }).join("");
    var sizeOptions = PAGE_EDITOR_FONT_SIZES.map(function (size) {
      return '<option value="' + safeText(size.value) + '">' + safeText(size.label) + '</option>';
    }).join("");
    return [
      '<div class="page-format-toolbar" data-page-format-toolbar aria-label="تنسيق محتوى الصفحة">',
      '<div class="page-format-buttons" role="group" aria-label="تنسيق النص">',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="bold" title="غامق" aria-label="غامق">',
      '<i class="hgi-stroke hgi-text-bold" aria-hidden="true"></i>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="italic" title="مائل" aria-label="مائل">',
      '<i class="hgi-stroke hgi-text-italic" aria-hidden="true"></i>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="underline" title="تسطير" aria-label="تسطير">',
      '<i class="hgi-stroke hgi-text-underline" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<div class="page-format-buttons" role="group" aria-label="محاذاة النص">',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="right" title="محاذاة لليمين" aria-label="محاذاة لليمين">',
      '<i class="hgi-stroke hgi-text-align-right" aria-hidden="true"></i>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="center" title="توسيط" aria-label="توسيط">',
      '<i class="hgi-stroke hgi-text-align-center" aria-hidden="true"></i>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="left" title="محاذاة لليسار" aria-label="محاذاة لليسار">',
      '<i class="hgi-stroke hgi-text-align-left" aria-hidden="true"></i>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-icon-only page-format-btn" type="button" data-page-format="justify" title="ضبط النص" aria-label="ضبط النص">',
      '<i class="hgi-stroke hgi-text-align-justify-center" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<label class="page-format-select-control page-format-font-control">',
      '<span class="sr-only">اختيار الخط</span>',
      '<select class="nds-input page-format-font-select" data-page-format-font aria-label="اختيار الخط">',
      fontOptions,
      '</select>',
      '</label>',
      '<label class="page-format-select-control page-format-size-control">',
      '<span class="sr-only">اختيار حجم الخط</span>',
      '<select class="nds-input page-format-size-select" data-page-format-size aria-label="اختيار حجم الخط">',
      sizeOptions,
      '</select>',
      '</label>',
      '</div>'
    ].join("");
  }

  function pageContentEditorHtml(page) {
    var info = "اكتب نصا عاديا أو اختر HTML والصق الكود كاملا. سيتم عرضه داخل حاوية منسقة.";
    return [
      '<div class="nds-form-container page-content-editor-container">',
      '<div class="nds-form-header"><label><span class="nds-label">محتوى الصفحة</span></label></div>',
      pageEditorToolbarHtml(),
      '<div class="nds-form-control textarea-control"><textarea class="nds-input" data-field="pageContent" rows="10" placeholder="' + safeText(info) + '">' + safeText(page.content) + '</textarea></div>',
      '</div>'
    ].join("");
  }

  function selectHtml(key, label, value, options) {
    var selected = getOption(value, options || []);
    var items = (options || []).map(function (option) {
      return [
        '<button class="nds-btn nds-subtle nds-dropmenu-item icon-type-option admin-select-option" type="button" data-select-value="' + safeText(option.value) + '" data-state="' + (option.value === selected.value ? "selected" : "") + '">',
        '<span class="nds-label">' + safeText(option.label) + '</span>',
        '</button>'
      ].join("");
    }).join("");
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-dropmenu icon-type-menu admin-select-menu" data-select-menu data-dropmenu-no-click>',
      '<button class="nds-btn nds-secondary-outline nds-dropmenu-trigger icon-type-trigger admin-select-trigger" type="button" data-select-trigger aria-expanded="false">',
      '<span class="nds-label" data-select-label>' + safeText(selected.label) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 icon-type-arrow" aria-hidden="true"></i>',
      '</button>',
      '<input type="hidden" data-field="' + safeText(key) + '" value="' + safeText(selected.value) + '">',
      '<div class="nds-dropmenu-menu icon-type-options admin-select-options" hidden aria-hidden="true">',
      '<div class="nds-dropmenu-scroll">',
      items,
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function optionDropmenuHtml(key, label, value, options) {
    var selected = getOption(value, options);
    var items = (options || []).map(function (option) {
      return [
        '<button class="nds-btn nds-subtle nds-dropmenu-item icon-type-option option-type-option" type="button" data-option-value="' + safeText(option.value) + '" data-state="' + (option.value === selected.value ? "selected" : "") + '">',
        adminOptionIcon(option.value),
        '<span class="nds-label">' + safeText(option.label) + '</span>',
        '</button>'
      ].join("");
    }).join("");
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-dropmenu icon-type-menu option-type-menu" data-option-menu data-dropmenu-no-click>',
      '<button class="nds-btn nds-secondary-outline nds-dropmenu-trigger icon-type-trigger option-type-trigger" type="button" data-option-trigger aria-expanded="false">',
      adminOptionIcon(selected.value),
      '<span class="nds-label" data-option-label>' + safeText(selected.label) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 icon-type-arrow" aria-hidden="true"></i>',
      '</button>',
      '<input type="hidden" data-field="' + safeText(key) + '" value="' + safeText(selected.value) + '">',
      '<div class="nds-dropmenu-menu icon-type-options option-type-options" hidden aria-hidden="true">',
      '<div class="nds-dropmenu-scroll">',
      items,
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function editorAccordionKey(item, prefix, panelId) {
    if (!item) return panelId || prefix || "";
    if (item.dataset.editorAccordionKey) return item.dataset.editorAccordionKey;
    if (item.dataset.footerColumnLinkIndex) {
      var footerColumn = item.closest("[data-footer-column-index]");
      return (prefix || "footer-column-link") + ":" + (footerColumn ? footerColumn.dataset.footerColumnIndex : "") + ":" + item.dataset.footerColumnLinkIndex;
    }
    if (item.dataset.footerIconLinkIndex) {
      var footerIconGroup = item.closest("[data-footer-icon-group-index]");
      return (prefix || "footer-icon-link") + ":" + (footerIconGroup ? footerIconGroup.dataset.footerIconGroupIndex : "") + ":" + item.dataset.footerIconLinkIndex;
    }
    var itemId = item.dataset.contentRowId || item.dataset.skillId || item.dataset.footerColumnId || item.dataset.footerIconGroupId || item.dataset.footerLogoId || item.dataset.projectId || item.dataset.pageId || item.dataset.integrationId || item.dataset.adminUserId || item.dataset.heroSlideIndex || item.dataset.footerLinkIndex || item.dataset.footerColumnLinkIndex || item.dataset.footerIconLinkIndex || item.dataset.footerBottomLinkIndex || item.dataset.contentRowIndex || item.dataset.skillIndex || panelId || "";
    var keyPrefix = prefix || item.dataset.sortableItem || "editor";
    return keyPrefix + ":" + itemId;
  }

  function setEditorAccordionState(button, isOpen) {
    var panel = qs("#" + button.getAttribute("aria-controls"));
    var item = button.closest(".compact-editor-item, [data-hero-slide-index]");
    var key = editorAccordionKey(item, "", button.getAttribute("aria-controls"));
    button.setAttribute("aria-expanded", String(isOpen));
    button.dataset.state = isOpen ? "open" : "";
    if (panel) {
      panel.dataset.state = isOpen ? "open" : "";
      panel.setAttribute("aria-hidden", String(!isOpen));
    }
    if (item) item.dataset.state = isOpen ? "open" : "closed";
    if (key) {
      if (isOpen) openEditorAccordions.add(key);
      else openEditorAccordions.delete(key);
    }
  }

  function captureOpenEditorAccordions(root) {
    qsa("[data-editor-toggle]", root || document).forEach(function (button) {
      var item = button.closest(".compact-editor-item, [data-hero-slide-index]");
      var key = editorAccordionKey(item, "", button.getAttribute("aria-controls"));
      if (key && button.getAttribute("aria-expanded") === "true") openEditorAccordions.add(key);
    });
    qsa("[data-page-children-toggle]", root || document).forEach(function (button) {
      var section = button.closest("[data-page-children-section]");
      var key = section && section.dataset.editorAccordionKey;
      if (key && button.getAttribute("aria-expanded") === "true") openEditorAccordions.add(key);
    });
  }

  function setPageChildrenSectionState(button, isOpen) {
    var panelId = button.getAttribute("aria-controls");
    var panel = panelId ? document.getElementById(panelId) : null;
    var section = button.closest("[data-page-children-section]");
    var key = section && section.dataset.editorAccordionKey;
    button.setAttribute("aria-expanded", String(isOpen));
    button.dataset.state = isOpen ? "open" : "";
    if (panel) {
      panel.dataset.state = isOpen ? "open" : "";
      panel.setAttribute("aria-hidden", String(!isOpen));
    }
    if (section) section.dataset.state = isOpen ? "open" : "closed";
    if (key) {
      if (isOpen) openEditorAccordions.add(key);
      else openEditorAccordions.delete(key);
    }
  }

  function togglePageChildrenSection(button) {
    setPageChildrenSectionState(button, button.getAttribute("aria-expanded") !== "true");
  }

  function confirmAdminDelete(message) {
    var modal = ensureAdminConfirmModal();
    return new Promise(function (resolve) {
      var title = qs("[data-admin-confirm-title]", modal);
      var description = qs("[data-admin-confirm-description]", modal);
      var confirmButton = qs("[data-admin-confirm-action]", modal);
      if (!modal || !confirmButton || !description) {
        resolve(window.confirm(message || "هل تريد حذف هذا العنصر؟"));
        return;
      }
      if (adminConfirmResolver) adminConfirmResolver(false);
      adminConfirmResolver = resolve;
      if (title) title.textContent = "تأكيد الحذف";
      description.textContent = message || "هل تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.";
      if (window.NDS && window.NDS.Modal && window.NDS.Modal.open) {
        window.NDS.Modal.open(modal);
      } else {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        modal.dataset.state = "open";
      }
      window.setTimeout(function () { confirmButton.focus(); }, 80);
    });
  }

  function confirmAdminDeleteThen(message, action) {
    confirmAdminDelete(message).then(function (confirmed) {
      if (confirmed) action();
    });
  }

  function resolveAdminConfirmModal(confirmed) {
    var modal = qs("#admin-confirm-modal");
    var resolver = adminConfirmResolver;
    adminConfirmResolver = null;
    if (modal && window.NDS && window.NDS.Modal && window.NDS.Modal.close) {
      window.NDS.Modal.close();
    } else if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.removeAttribute("data-state");
    }
    if (resolver) resolver(Boolean(confirmed));
  }

  function ensureAdminConfirmModal() {
    var modal = qs("#admin-confirm-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "admin-confirm-modal";
    modal.className = "nds-modal nds-card nds-stroke admin-confirm-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "admin-confirm-title");
    modal.setAttribute("aria-describedby", "admin-confirm-description");
    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
    modal.innerHTML = [
      '<div class="nds-card-header">',
      '<span class="nds-featured-icon nds-circle" data-status="neutral">',
      '<i class="nds-icon nds-hgi-information-circle" aria-hidden="true"></i>',
      '</span>',
      '<button class="nds-close nds-modal-close nds-btn nds-subtle" type="button" aria-label="إغلاق">',
      '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<div class="nds-card-content">',
      '<div class="nds-card-text">',
      '<h3 class="nds-card-title" id="admin-confirm-title" data-admin-confirm-title>تأكيد الحذف</h3>',
      '<p class="nds-card-description" id="admin-confirm-description" data-admin-confirm-description></p>',
      '</div>',
      '</div>',
      '<div class="nds-card-actions">',
      '<button class="nds-btn nds-primary nds-lg" type="button" data-admin-confirm-action>',
      '<span class="nds-label">تأكيد</span>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-lg" type="button" data-admin-confirm-cancel>',
      '<span class="nds-label">إلغاء</span>',
      '</button>',
      '</div>'
    ].join("");
    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-admin-confirm-action]")) {
        resolveAdminConfirmModal(true);
      } else if (event.target.closest("[data-admin-confirm-cancel], .nds-modal-close")) {
        resolveAdminConfirmModal(false);
      }
    });
    modal.addEventListener("nds-modal-closed", function () {
      if (adminConfirmResolver) resolveAdminConfirmModal(false);
    });
    document.body.appendChild(modal);
    return modal;
  }

  function contactAccordionKey(button) {
    var item = button.closest(".contact-editor-item");
    if (!item) return button.getAttribute("aria-controls") || "";
    return "contact:" + (item.dataset.contactId || item.dataset.contactIndex || button.getAttribute("aria-controls"));
  }

  function setContactAccordionState(button, isOpen) {
    var panel = qs("#" + button.getAttribute("aria-controls"));
    var key = contactAccordionKey(button);
    button.setAttribute("aria-expanded", String(isOpen));
    button.dataset.state = isOpen ? "open" : "";
    if (panel) {
      panel.dataset.state = isOpen ? "open" : "";
      panel.setAttribute("aria-hidden", String(!isOpen));
    }
    if (key) {
      if (isOpen) openContactAccordions.add(key);
      else openContactAccordions.delete(key);
    }
  }

  function heroSlideTemplate(slide, index) {
    var panelId = "hero-slide-panel-" + index;
    var title = slide.video || slide.image || slide.alt || "وسائط القسم الرئيسي";
    title = slide.title || title;
    var accordionKey = "hero:" + index;
    var isOpen = pendingOpenEditor.hero === index || openEditorAccordions.has(accordionKey);
    if (isOpen) openEditorAccordions.add(accordionKey);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-accordion nds-md nds-card nds-stroke" data-nds-local-accordion="ready" data-sortable-item="hero" data-editor-accordion-key="' + safeText(accordionKey) + '" data-state="' + (isOpen ? "open" : "closed") + '" data-hero-slide-index="' + index + '">',
      '<div class="nds-accordion-item">',
      '<h3 class="admin-template-header sortable-editor-header nds-accordion-header">',
      dragHandleHtml("اسحب لتغيير ترتيب وسائط القسم الرئيسي"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle nds-menu-btn" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-accordion-title nds-card-title">' + safeText(title) + '</span>',
      '</button>',
      adminDeleteButton("data-delete-hero-slide", index, "حذف وسائط القسم الرئيسي"),
      '</h3>',
      '<div class="admin-template-body editor-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="editor-accordion-content nds-accordion-content">',
      '<div class="compact-editor-body editor-accordion-body nds-accordion-body">',
      '<div class="form-grid">',
      inputHtml("heroSlideTitle", "عنوان الشريحة", slide.title),
      inputHtml("heroSlideSubtitle", "العنوان الفرعي", slide.subtitle),
      '</div>',
      textareaHtml("heroSlideIntro", "وصف الشريحة", slide.intro || "", 3),
      '<div class="form-grid">',
      uploadableInputHtml("heroImage", "مسار الصورة أو غلاف الفيديو", slide.image, "hero-image", "مثال: uploads/images/hero.jpg"),
      uploadableInputHtml("heroMobileImage", "مسار صورة الجوال أو غلاف الجوال اختياري", slide.mobileImage, "hero-image", "اتركه فارغا لاستخدام نفس الصورة"),
      uploadableInputHtml("heroVideo", "مسار الفيديو اختياري", slide.video, "hero-video", "مثال: uploads/video/hero.webm"),
      uploadableInputHtml("heroMobileVideo", "مسار فيديو الجوال اختياري", slide.mobileVideo, "hero-video", "اتركه فارغا لاستخدام نفس الفيديو"),
      '</div>',
      inputHtml("heroAlt", "وصف الصورة اختياري", slide.alt),
      '<label class="check-line"><input class="nds-check" type="checkbox" data-hero-slide-visible ' + (slide.visible === false ? "" : "checked") + '> <span>إظهار هذه الوسائط في السلايدر</span></label>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderHeroSlidesEditor() {
    var root = qs("[data-hero-slides-editor]");
    if (!root) return;
    data.home.heroSlides = data.home.heroSlides || [];
    root.dataset.sortableList = "hero";
    root.innerHTML = data.home.heroSlides.map(heroSlideTemplate).join("");
    pendingOpenEditor.hero = null;
    if (!data.home.heroSlides.length) {
      root.append(window.SiteApp.emptyState("لا توجد وسائط للقسم الرئيسي", "استخدم زر إضافة وسائط لإنشاء السلايدر."));
    }
    prepareUploadControls(root);
  }

  function collectHeroSlides(options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa("[data-hero-slide-index]").map(function (item) {
      return {
        title: qs('[data-field="heroSlideTitle"]', item) ? qs('[data-field="heroSlideTitle"]', item).value.trim() : "",
        subtitle: qs('[data-field="heroSlideSubtitle"]', item) ? qs('[data-field="heroSlideSubtitle"]', item).value.trim() : "",
        intro: qs('[data-field="heroSlideIntro"]', item) ? qs('[data-field="heroSlideIntro"]', item).value.trim() : "",
        image: qs('[data-field="heroImage"]', item).value.trim(),
        mobileImage: qs('[data-field="heroMobileImage"]', item).value.trim(),
        video: qs('[data-field="heroVideo"]', item).value.trim(),
        mobileVideo: qs('[data-field="heroMobileVideo"]', item).value.trim(),
        alt: qs('[data-field="heroAlt"]', item).value.trim(),
        visible: qs("[data-hero-slide-visible]", item).checked
      };
    }).filter(function (slide) {
      return keepDrafts || slide.title || slide.subtitle || slide.intro || slide.image || slide.mobileImage || slide.video || slide.mobileVideo || slide.alt;
    });
  }

  function contentRowsKey(type) {
    return type === "achievements" ? "achievements" : "experience";
  }

  function contentRowIdPrefix(type) {
    return contentRowsKey(type) === "achievements" ? "achievement" : "experience";
  }

  function contentRowTemplate(type, item, index) {
    var rowId = ensureEntityId(item, contentRowIdPrefix(type));
    var title = item.title || (type === "achievements" ? "إنجاز" : "خبرة");
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="' + safeText(type) + '" data-content-row-type="' + safeText(type) + '" data-content-row-index="' + index + '" data-content-row-id="' + safeText(rowId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير الترتيب"),
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      adminDeleteButton("data-delete-content-row", index, "حذف"),
      '</div>',
      '<div class="form-grid">',
      inputHtml("rowTitle", "العنوان", item.title),
      inputHtml("rowMeta", "البيانات المختصرة", item.meta),
      '</div>',
      textareaHtml("rowDescription", "الوصف", item.description, 3),
      '<label class="check-line"><input class="nds-check" type="checkbox" data-row-visible ' + (item.visible === false ? "" : "checked") + '> <span>إظهار العنصر</span></label>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderContentRowsEditor(type) {
    var root = qs('[data-' + contentRowsKey(type) + '-editor]');
    if (!root) return;
    var key = contentRowsKey(type);
    data.home[key] = data.home[key] || [];
    root.dataset.sortableList = key;
    root.innerHTML = data.home[key].map(function (item, index) {
      return contentRowTemplate(key, item, index);
    }).join("");
    applySimpleEditorAccordions(root, key);
    if (!data.home[key].length) {
      root.append(window.SiteApp.emptyState("لا توجد عناصر", "استخدم زر الإضافة لإنشاء عنصر جديد."));
    }
  }

  function collectContentRows(type, options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa('[data-content-row-type="' + contentRowsKey(type) + '"]').map(function (item) {
      return {
        id: item.dataset.contentRowId || newEntityId(contentRowIdPrefix(type)),
        title: qs('[data-field="rowTitle"]', item).value.trim(),
        meta: qs('[data-field="rowMeta"]', item).value.trim(),
        description: qs('[data-field="rowDescription"]', item).value.trim(),
        visible: qs("[data-row-visible]", item).checked
      };
    }).filter(function (row) {
      return keepDrafts || row.title || row.meta || row.description;
    });
  }

  function applySimpleEditorAccordions(root, prefix) {
    if (!root) return;
    qsa(".compact-editor-item", root).forEach(function (item, index) {
      if (qs("[data-editor-toggle]", item)) return;
      var card = qs(".compact-card-content", item);
      var head = card ? qs(".editor-item-head", card) : null;
      var title = head ? qs(".nds-card-title", head) : null;
      if (!card || !head || !title) return;
      var panelId = prefix + "-panel-" + index;
      var key = editorAccordionKey(item, prefix, panelId);
      var isOpen = openEditorAccordions.has(key);
      var body = document.createElement("div");
      var content = document.createElement("div");
      var inner = document.createElement("div");
      var button = document.createElement("button");
      item.classList.add("nds-accordion", "nds-md");
      item.setAttribute("data-nds-local-accordion", "ready");
      card.classList.add("nds-accordion-item");
      head.classList.add("nds-accordion-header");
      title.classList.add("nds-accordion-title");
      item.dataset.editorAccordionKey = key;
      item.dataset.state = isOpen ? "open" : "closed";
      body.className = "editor-accordion-collapse nds-accordion-collapse";
      body.id = panelId;
      body.dataset.state = isOpen ? "open" : "";
      body.setAttribute("aria-hidden", String(!isOpen));
      content.className = "editor-accordion-content nds-accordion-content";
      inner.className = "compact-editor-body editor-accordion-body nds-accordion-body";
      while (head.nextSibling) inner.appendChild(head.nextSibling);
      content.appendChild(inner);
      body.appendChild(content);
      card.appendChild(body);
      button.className = "editor-accordion-btn nds-accordion-btn nds-btn nds-subtle nds-menu-btn";
      button.type = "button";
      button.dataset.editorToggle = "";
      button.dataset.state = isOpen ? "open" : "";
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-controls", panelId);
      button.appendChild(title);
      var deleteButton = qs("[data-delete-content-row], [data-delete-skill], [data-delete-footer-link], [data-delete-footer-column], [data-delete-footer-column-link], [data-delete-footer-icon-group], [data-delete-footer-icon-link], [data-delete-footer-bottom-link], [data-delete-footer-logo], [data-delete-integration], [data-delete-admin-user]", head);
      if (deleteButton) {
        head.insertBefore(button, deleteButton);
      } else {
        head.appendChild(button);
      }
    });
  }

  function skillTemplate(skill, index) {
    var name = typeof skill === "string" ? skill : (skill.name || "");
    var visible = typeof skill === "string" ? true : skill.visible !== false;
    var skillId = typeof skill === "string" ? newEntityId("skill") : ensureEntityId(skill, "skill");
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="skills" data-skill-index="' + index + '" data-skill-id="' + safeText(skillId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب المهارة"),
      '<span class="nds-card-title">' + safeText(name || "مهارة") + '</span>',
      adminDeleteButton("data-delete-skill", index, "حذف المهارة"),
      '</div>',
      inputHtml("skillName", "اسم المهارة", name),
      '<label class="check-line"><input class="nds-check" type="checkbox" data-skill-visible ' + (visible ? "checked" : "") + '> <span>إظهار المهارة</span></label>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderSkillsEditor() {
    var root = qs("[data-skills-editor]");
    if (!root) return;
    data.home.skills = data.home.skills || [];
    root.dataset.sortableList = "skills";
    root.innerHTML = data.home.skills.map(skillTemplate).join("");
    applySimpleEditorAccordions(root, "skills");
    if (!data.home.skills.length) {
      root.append(window.SiteApp.emptyState("لا توجد مهارات", "استخدم زر الإضافة لإضافة مهارة."));
    }
  }

  function collectSkills(options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa("[data-skill-index]").map(function (item) {
      return {
        id: item.dataset.skillId || newEntityId("skill"),
        name: qs('[data-field="skillName"]', item).value.trim(),
        visible: qs("[data-skill-visible]", item).checked
      };
    }).filter(function (skill) {
      return keepDrafts || skill.name;
    });
  }

  function contactTemplate(contact, index) {
    var label = contact.label || "وسيلة تواصل";
    var panelId = "contact-panel-" + index;
    var contactId = ensureEntityId(contact, "contact");
    var accordionKey = "contact:" + contactId;
    var isOpen = openContactAccordions.has(accordionKey);
    return [
      '<article class="editor-item contact-editor-item nds-accordion nds-md nds-card nds-stroke" data-nds-local-accordion="ready" data-sortable-item="contacts" data-contact-index="' + index + '" data-contact-id="' + safeText(contactId) + '">',
      '<div class="nds-accordion-item">',
      '<h3 class="contact-accordion-header sortable-editor-header nds-accordion-header">',
      dragHandleHtml("تغيير ترتيب وسيلة التواصل"),
      '<button class="contact-accordion-btn nds-accordion-btn nds-btn nds-subtle nds-menu-btn" type="button" data-contact-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="contact-accordion-title nds-accordion-title">' + safeText(label) + '</span>',
      '</button>',
      contactDeleteButton(index),
      '</h3>',
      '<div class="contact-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="contact-accordion-content nds-accordion-content">',
      '<div class="contact-accordion-body nds-accordion-body">',
      '<div class="contact-form-grid">',
      inputHtml("contactLabel", "التسمية الاختيارية", contact.label),
      inputHtml("contactUrl", "الرابط", contact.url),
      iconTypeDropmenuHtml("contactIconType", "نوع الأيقونة", contact.iconType || "website"),
      uploadableInputHtml("contactIconPath", "مسار شعار مخصص اختياري", contact.iconPath, "contact-icon"),
      '</div>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-contact-visible ' + (contact.visible === false ? "" : "checked") + '> <span>إظهار وسيلة التواصل</span></label>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderContactsEditor() {
    var root = qs("[data-contacts-editor]");
    if (!root) return;
    data.home.contacts = data.home.contacts || [];
    root.dataset.sortableList = "contacts";
    root.innerHTML = data.home.contacts.map(contactTemplate).join("");
    if (!data.home.contacts.length) {
      root.append(window.SiteApp.emptyState("لا توجد وسائل تواصل", "استخدم زر إضافة وسيلة لإنشاء رابط تواصل."));
    }
    prepareUploadControls(root);
  }

  function projectTemplate(project, index) {
    var projectId = ensureEntityId(project, "project");
    var panelId = "project-panel-" + index;
    var accordionKey = "projects:" + projectId;
    var isOpen = openEditorAccordions.has(accordionKey);
    var title = project.title || "مشروع";
    var projectSlug = slugify(project.slug || project.title) || generatedProjectSlug(index);
    var titleSlug = slugify(project.title || "");
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-accordion nds-md nds-card nds-stroke" data-nds-local-accordion="ready" data-sortable-item="projects" data-editor-accordion-key="' + safeText(accordionKey) + '" data-project-index="' + index + '" data-project-id="' + safeText(projectId) + '" data-project-title-slug="' + safeText(titleSlug) + '" data-state="' + (isOpen ? "open" : "closed") + '">',
      '<div class="nds-card-content compact-card-content nds-accordion-item">',
      '<div class="editor-item-head sortable-editor-header nds-accordion-header">',
      dragHandleHtml("تغيير ترتيب المشروع"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle nds-menu-btn" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-accordion-title nds-card-title">' + safeText(title) + '</span>',
      '</button>',
      adminDeleteButton("data-delete-project", index, "حذف المشروع"),
      '</div>',
      '<div class="editor-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="editor-accordion-content nds-accordion-content">',
      '<div class="compact-editor-body editor-accordion-body nds-accordion-body">',
      '<div class="form-grid">',
      inputHtml("projectTitle", "عنوان المشروع", project.title),
      inputHtml("projectSlug", "الرابط المختصر", projectSlug),
      inputHtml("projectStatus", "الحالة", project.status),
      inputHtml("projectDate", "التاريخ", project.date),
      inputHtml("projectCategory", "التصنيف", project.category),
      '</div>',
      uploadableInputHtml("projectImage", "مسار الصورة أو الأيقونة", project.image, "project-image"),
      inputHtml("projectUrl", "رابط تصفح المشروع", project.url, "مثال: https://example.com"),
      textareaHtml("projectDescription", "الوصف", project.description, 4),
      '<label class="check-line"><input class="nds-check" type="checkbox" data-project-visible ' + (project.visible === false ? "" : "checked") + '> <span>إظهار المشروع</span></label>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderProjectsEditor() {
    var root = qs("[data-projects-editor]");
    if (!root) return;
    data.projects = data.projects || [];
    root.dataset.sortableList = "projects";
    root.innerHTML = data.projects.map(projectTemplate).join("");
    if (!data.projects.length) {
      root.append(window.SiteApp.emptyState("لا توجد مشاريع", "استخدم زر إضافة مشروع لإنشاء بطاقة جديدة."));
    }
    prepareUploadControls(root);
  }

  function pageDisplayTitle(page) {
    return page && (page.title || page.slug) || "صفحة";
  }

  function pageStructurePathLabel(page) {
    var pageSlug = slugify(page && (page.slug || page.title));
    if (!pageSlug) return "بدون-رابط";
    return pageSlug;
  }

  function pageHasChildren(slug, pages) {
    var normalized = slugify(slug);
    return Boolean(normalized) && (pages || data.pages || []).some(function (page) {
      return slugify(page && page.parentSlug) === normalized;
    });
  }

  function pageChildCount(slug, pages) {
    var normalized = slugify(slug);
    if (!normalized) return 0;
    return (pages || data.pages || []).filter(function (page) {
      return slugify(page && page.parentSlug) === normalized;
    }).length;
  }

  function isGeneratedSubpageDraft(page) {
    return String(page && page.title || "").trim() === "\u0635\u0641\u062d\u0629 \u0641\u0631\u0639\u064a\u0629 \u062c\u062f\u064a\u062f\u0629";
  }

  function ensureUniquePageSlugs(pages) {
    var seen = {};
    var fallbackSeed = Date.now();
    (pages || []).forEach(function (page, index) {
      var seed = slugify(page && (page.slug || page.title)) || ("page-" + fallbackSeed + "-" + (index + 1));
      var slug = seed;
      var counter = 2;
      while (seen[slug]) {
        slug = seed + "-" + counter;
        counter += 1;
      }
      page.slug = slug;
      seen[slug] = true;
    });
  }

  function pageSlugMaps(pages) {
    var maps = { bySlug: {}, byOriginalSlug: {} };
    (pages || []).forEach(function (page) {
      var slug = slugify(page && page.slug);
      var originalSlug = slugify(page && page.originalSlug);
      if (slug) maps.bySlug[slug] = page;
      if (originalSlug && !maps.byOriginalSlug[originalSlug]) maps.byOriginalSlug[originalSlug] = page;
    });
    return maps;
  }

  function pageParentOptions(currentSlug) {
    var current = slugify(currentSlug);
    var currentPage = (data.pages || []).find(function (page) {
      return slugify(page && page.slug) === current;
    }) || {};
    var currentParent = slugify(currentPage.parentSlug);
    var baseOption = { value: "", label: "صفحة رئيسية في الهيدر" };
    if (pageHasChildren(current, data.pages)) return [baseOption];
    var rootPages = (data.pages || []).filter(function (page) {
      var pageSlug = slugify(page && page.slug);
      return pageSlug && pageSlug !== current && (!slugify(page.parentSlug) || pageSlug === currentParent);
    });
    return [baseOption].concat(rootPages.map(function (page) {
      return {
        value: slugify(page.slug),
        label: "فرعية تحت: " + pageDisplayTitle(page)
      };
    }));
  }

  function normalizePageParentLinks(pages) {
    var bySlug = {};
    ensureUniquePageSlugs(pages);
    (pages || []).forEach(function (page) {
      ensurePageTimestamps(page);
      page.slug = slugify(page.slug || page.title);
      page.parentSlug = slugify(page.parentSlug);
      if (page.slug) bySlug[page.slug] = page;
    });
    (pages || []).forEach(function (page) {
      var hadParent = Boolean(page.parentSlug);
      var parent = bySlug[page.parentSlug];
      if (!parent || page.parentSlug === page.slug || slugify(parent.parentSlug) || pageHasChildren(page.slug, pages)) {
        page.parentSlug = "";
      }
      if (hadParent || isGeneratedSubpageDraft(page)) page.showInNavigation = false;
    });
    (pages || []).forEach(function (page) {
      if (!slugify(page.parentSlug) && pageHasChildren(page.slug, pages)) resetPageGroupContent(page);
    });
    return pages || [];
  }

  function resetPageGroupContent(page) {
    if (!page) return;
    page.contentMode = "text";
    page.content = "";
    page.image = "";
    page.imagePath = "";
    page.video = "";
    page.videoPath = "";
    page.showInFooter = false;
  }

  function pageTemplate(page, index, children) {
    var pageId = ensureEntityId(page, "page");
    var mode = page.contentMode || "text";
    var panelId = "page-panel-" + index;
    var accordionKey = "page:" + pageId;
    var title = page.title || "صفحة إضافية";
    var pageSignature;
    var trackingLabel;
    var isOpen = pendingOpenEditor.page === index || openEditorAccordions.has(accordionKey);
    if (isOpen) openEditorAccordions.add(accordionKey);
    ensurePageTimestamps(page);
    pageSignature = pageEditorSignature(page);
    trackingLabel = pageTrackingLabel(page);
    var isChild = hasAdminText(page.parentSlug);
    var childEntries = children || [];
    var childCount = childEntries.length;
    var isNavigationGroup = !isChild && childCount > 0;
    var showInNavigation = isChild ? false : (page.showInFooter && page.visible === false ? false : page.showInNavigation !== false);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-accordion nds-md nds-card nds-stroke" data-nds-local-accordion="ready" data-sortable-item="page" data-editor-accordion-key="' + safeText(accordionKey) + '" data-page-index="' + index + '" data-page-id="' + safeText(pageId) + '" data-page-original-slug="' + safeText(slugify(page.slug || page.title)) + '" data-page-created-at="' + safeText(page.createdAt) + '" data-page-updated-at="' + safeText(page.updatedAt) + '" data-page-signature="' + safeText(pageSignature) + '" data-page-is-child="' + (isChild ? "true" : "false") + '" data-page-is-group="' + (isNavigationGroup ? "true" : "false") + '" data-state="' + (isOpen ? "open" : "closed") + '">',
      '<div class="nds-card-content compact-card-content nds-accordion-item">',
      '<div class="editor-item-head sortable-editor-header nds-accordion-header">',
      dragHandleHtml("اسحب لتغيير ترتيب الصفحات"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle nds-menu-btn" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="page-editor-heading nds-accordion-title">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      trackingLabel ? '<span class="page-editor-timestamp">' + safeText(trackingLabel) + '</span>' : '',
      '<span class="page-editor-meta">',
      '<span class="nds-tag nds-sm" data-status="' + (isChild ? "info" : "neutral") + '"><span class="nds-label">' + (isChild ? "صفحة فرعية" : "صفحة رئيسية") + '</span></span>',
      childCount ? '<span class="nds-tag nds-sm"><span class="nds-label">' + childCount + ' عناصر فرعية</span></span>' : '',
      '</span>',
      '</span>',
      '</button>',
      '<div class="editor-item-actions page-editor-actions">',
      adminDeleteButton("data-delete-page", index, "حذف الصفحة"),
      '</div>',
      '</div>',
      '<div class="editor-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="editor-accordion-content nds-accordion-content">',
      '<div class="compact-editor-body editor-accordion-body nds-accordion-body">',
      '<div class="form-grid">',
      inputHtml("pageTitle", "عنوان الصفحة", page.title),
      inputHtml("pageSlug", "الرابط المختصر", page.slug),
      selectHtml("pageParentSlug", "الموقع في الهيدر", page.parentSlug || "", pageParentOptions(page.slug)),
      optionDropmenuHtml("pageContentMode", "نوع المحتوى", mode, window.PAGE_CONTENT_MODES || []),
      '</div>',
      '<div class="form-grid">',
      uploadableInputHtml("pageImage", "صورة الصفحة", page.image, "page-image", "مثال: uploads/images/page.jpg"),
      uploadableInputHtml("pageVideo", "فيديو الصفحة", page.video, "page-video", "مثال: uploads/video/page.webm"),
      '</div>',
      '<div class="admin-check-stack">',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-page-visible ' + (page.visible ? "checked" : "") + '> <span>نشر الصفحة</span></label>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-page-navigation-link ' + (showInNavigation ? "checked" : "") + '> <span>إظهار في الهيدر</span></label>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-page-footer-link ' + (page.showInFooter ? "checked" : "") + '> <span>رابط تذييل</span></label>',
      '</div>',
      pageContentEditorHtml(page),
      isChild ? '' : pageChildrenSectionHtml(page, pageId, childEntries),
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function pageChildrenSectionHtml(page, pageId, children) {
    var pageTitle = pageDisplayTitle(page);
    var childrenKey = "page-children:" + pageId;
    var panelId = "page-children-panel-" + pageId;
    var isOpen = openEditorAccordions.has(childrenKey);
    return [
      '<section class="page-children-section nds-accordion nds-md nds-card nds-stroke" data-nds-local-accordion="ready" data-page-children-section data-editor-accordion-key="' + safeText(childrenKey) + '" data-state="' + (isOpen ? "open" : "closed") + '" aria-label="الصفحات الفرعية">',
      '<div class="nds-accordion-item">',
      '<h3 class="page-children-head nds-accordion-header">',
      '<button class="nds-btn nds-subtle nds-menu-btn nds-accordion-btn page-children-toggle" type="button" data-page-children-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + safeText(panelId) + '">',
      '<span class="page-children-title-row">',
      '<span class="section-minor-title">الصفحات الفرعية</span>',
      '<span class="nds-tag nds-sm"><span class="nds-label">' + children.length + ' صفحة</span></span>',
      '</span>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-sm page-add-subpage-btn" type="button" data-add-subpage="' + safeText(pageId) + '" aria-label="إضافة صفحة فرعية تحت ' + safeText(pageTitle) + '" title="إضافة صفحة فرعية">',
      '<i class="nds-icon nds-hgi-plus-sign" aria-hidden="true"></i>',
      '<span class="nds-label">إضافة صفحة فرعية</span>',
      '</button>',
      '</h3>',
      '<div class="page-children-collapse nds-accordion-collapse" id="' + safeText(panelId) + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="page-children-collapse-content nds-accordion-content">',
      '<div class="page-children-body nds-accordion-body">',
      '<div class="editor-list compact-editor-list page-children-list" data-sortable-list="pages">',
      children.length ? children.map(function (entry) { return pageTemplate(entry.page, entry.index, []); }).join("") : '<div class="page-children-empty">لا توجد صفحات فرعية لهذه الصفحة.</div>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</section>'
    ].join("");
  }

  function renderPagesEditor() {
    var root = qs("[data-pages-editor]");
    var entries;
    var bySlug = {};
    var childrenByParent = {};
    var roots = [];
    if (!root) return;
    data.pages = data.pages || [];
    data.pages = normalizePageParentLinks(data.pages);
    entries = data.pages.map(function (page, index) {
      var slug = slugify(page && page.slug);
      var entry = { page: page, index: index, slug: slug };
      if (slug) bySlug[slug] = entry;
      return entry;
    });
    entries.forEach(function (entry) {
      var parentSlug = slugify(entry.page && entry.page.parentSlug);
      var parent = parentSlug && bySlug[parentSlug];
      if (parent && parent !== entry) {
        childrenByParent[parentSlug] = childrenByParent[parentSlug] || [];
        childrenByParent[parentSlug].push(entry);
      } else {
        roots.push(entry);
      }
    });
    root.dataset.sortableList = "pages";
    root.innerHTML = roots.map(function (entry) {
      return pageTemplate(entry.page, entry.index, childrenByParent[entry.slug] || []);
    }).join("");
    syncPageContentEditorModes(root);
    pendingOpenEditor.page = null;
    if (!data.pages.length) {
      root.append(window.SiteApp.emptyState("لا توجد صفحات إضافية", "استخدم زر إضافة صفحة لإنشاء صفحة جديدة."));
    }
    renderFooterCookiePagesList();
  }

  function syncPageContentEditorMode(item) {
    var input = item ? qs('[data-field="pageContentMode"]', item) : null;
    var editor = item ? qs('[data-field="pageContent"]', item) : null;
    var mode = input && input.value === "html" ? "html" : "text";
    if (!editor) return;
    editor.classList.add("page-content-editor");
    editor.classList.toggle("page-content-editor-html", mode === "html");
    editor.dataset.contentEditorMode = mode;
    editor.setAttribute("dir", mode === "html" ? "ltr" : "auto");
    editor.setAttribute("spellcheck", mode === "html" ? "false" : "true");
  }

  function syncPageContentEditorModes(root) {
    qsa("[data-page-index]", root || document).forEach(syncPageContentEditorMode);
  }

  function setPageContentMode(pageItem, mode) {
    var normalized = mode === "html" ? "html" : "text";
    var input = pageItem ? qs('[data-field="pageContentMode"]', pageItem) : null;
    var menu = input ? input.closest("[data-option-menu]") : null;
    var selected = getOption(normalized, window.PAGE_CONTENT_MODES || []);
    var label = menu ? qs("[data-option-label]", menu) : null;
    var trigger = menu ? qs("[data-option-trigger]", menu) : null;
    var existingIcon = trigger ? qs(".admin-option-icon", trigger) : null;
    if (input) input.value = normalized;
    if (label) label.textContent = selected.label;
    if (existingIcon) existingIcon.outerHTML = adminOptionIcon(selected.value);
    if (menu) {
      qsa("[data-option-value]", menu).forEach(function (item) {
        item.dataset.state = item.dataset.optionValue === normalized ? "selected" : "";
      });
    }
    if (input) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    syncPageContentEditorMode(pageItem);
  }

  function replacePageEditorSelection(editor, before, after) {
    var start = typeof editor.selectionStart === "number" ? editor.selectionStart : editor.value.length;
    var end = typeof editor.selectionEnd === "number" ? editor.selectionEnd : start;
    var selected = editor.value.slice(start, end);
    editor.value = editor.value.slice(0, start) + before + selected + after + editor.value.slice(end);
    editor.focus();
    if (selected) {
      editor.setSelectionRange(start, start + before.length + selected.length + after.length);
    } else {
      editor.setSelectionRange(start + before.length, start + before.length);
    }
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function applyPageTextFormat(button) {
    var pageItem = button ? button.closest("[data-page-index]") : null;
    var editor = pageItem ? qs('[data-field="pageContent"]', pageItem) : null;
    var action = button ? button.dataset.pageFormat : "";
    var alignmentMap = {
      right: "right",
      center: "center",
      left: "left",
      justify: "justify"
    };
    if (!editor) return;
    setPageContentMode(pageItem, "html");
    if (action === "bold") {
      replacePageEditorSelection(editor, "<strong>", "</strong>");
      return;
    }
    if (action === "italic") {
      replacePageEditorSelection(editor, "<em>", "</em>");
      return;
    }
    if (action === "underline") {
      replacePageEditorSelection(editor, '<span style="text-decoration: underline;">', "</span>");
      return;
    }
    if (alignmentMap[action]) {
      replacePageEditorSelection(editor, '<div style="text-align: ' + alignmentMap[action] + ';">', "</div>");
    }
  }

  function applyPageEditorFont(select) {
    var pageItem = select ? select.closest("[data-page-index]") : null;
    var editor = pageItem ? qs('[data-field="pageContent"]', pageItem) : null;
    var selected = PAGE_EDITOR_FONTS.find(function (font) {
      return font.value === (select ? select.value : "");
    });
    if (!editor || !selected || !selected.family) return;
    setPageContentMode(pageItem, "html");
    replacePageEditorSelection(editor, '<span style="font-family: ' + selected.family + ';">', "</span>");
    select.value = "";
  }

  function applyPageEditorFontSize(select) {
    var pageItem = select ? select.closest("[data-page-index]") : null;
    var editor = pageItem ? qs('[data-field="pageContent"]', pageItem) : null;
    var selected = PAGE_EDITOR_FONT_SIZES.find(function (size) {
      return size.value === (select ? select.value : "");
    });
    if (!editor || !selected || !selected.value) return;
    setPageContentMode(pageItem, "html");
    replacePageEditorSelection(editor, '<span style="font-size: ' + selected.value + ';">', "</span>");
    select.value = "";
  }

  function iconTypeDropmenuHtml(key, label, value) {
    var selected = getIconOption(value);
    var options = (window.CONTACT_ICON_OPTIONS || []).map(function (option) {
      return [
        '<button class="nds-btn nds-subtle nds-dropmenu-item icon-type-option" type="button" data-icon-type-option="' + safeText(option.value) + '" data-state="' + (option.value === selected.value ? "selected" : "") + '">',
        adminContactIcon(option.value),
        '<span class="nds-label">' + safeText(option.label) + '</span>',
        '</button>'
      ].join("");
    }).join("");
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-dropmenu icon-type-menu" data-icon-type-menu data-dropmenu-no-click>',
      '<button class="nds-btn nds-secondary-outline nds-dropmenu-trigger icon-type-trigger" type="button" data-icon-type-trigger aria-expanded="false">',
      adminContactIcon(selected.value),
      '<span class="nds-label" data-icon-type-label>' + safeText(selected.label) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 icon-type-arrow" aria-hidden="true"></i>',
      '</button>',
      '<input type="hidden" data-field="' + safeText(key) + '" value="' + safeText(selected.value) + '">',
      '<div class="nds-dropmenu-menu icon-type-options" hidden aria-hidden="true">',
      '<div class="nds-dropmenu-scroll">',
      options,
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function getIconOption(value) {
    var options = window.CONTACT_ICON_OPTIONS || [];
    return options.find(function (option) { return option.value === value; }) || options.find(function (option) { return option.value === "website"; }) || { value: "website", label: "Website" };
  }

  function getOption(value, options) {
    options = options || [];
    return options.find(function (option) { return option.value === value; }) || options[0] || { value: "", label: "" };
  }

  function pageFooterUrl(value) {
    if (value === "__home") return "index.html";
    if (value === "__projects") return "projects.html";
    var page = (data.pages || []).find(function (candidate) {
      return candidate && candidate.slug === value;
    });
    return page && page.slug ? "index.html#/page/" + encodeURIComponent(page.slug) : "";
  }

  function footerPageSlugFromUrl(url) {
    var text = String(url || "");
    if (text === "index.html" || text === "./" || text === "/") return "__home";
    if (text === "projects.html") return "__projects";
    var prefix = "index.html#/page/";
    if (text.indexOf(prefix) !== 0) return "";
    try {
      return decodeURIComponent(text.slice(prefix.length));
    } catch (error) {
      return text.slice(prefix.length);
    }
  }

  function footerPageOptions() {
    var pages = (data && data.pages || []).filter(function (page) {
      return page && (page.title || page.slug);
    });
    var navigation = data && data.navigation || {};
    return [
      { value: "", label: "رابط مخصص" },
      { value: "__home", label: navigation.homeLabel || "الرئيسية" },
      { value: "__projects", label: navigation.projectsLabel || "مشاريعنا" }
    ].concat(pages.map(function (page) {
      return {
        value: page.slug || "",
        label: page.title || page.slug || "صفحة"
      };
    }));
  }

  function syncFooterLinkFromPage(menu) {
    var input = menu ? qs('[data-field="footerLinkPage"]', menu) : null;
    if (!input && menu) input = qs('[data-field$="Page"]', menu);
    var item = menu ? (menu.closest("[data-footer-link-index]") || menu.closest("[data-footer-logo-index]") || menu.closest(".footer-nested-item")) : null;
    var slug = input ? input.value : "";
    if (!item || !slug) return;
    var fieldPrefix = (input.dataset.field || "footerLinkPage").replace(/Page$/, "");
    var option = getOption(slug, footerPageOptions());
    var urlInput = qs('[data-field="' + fieldPrefix + 'Url"]', item);
    var labelInput = qs('[data-field="' + fieldPrefix + 'Label"]', item);
    if (urlInput) urlInput.value = pageFooterUrl(slug);
    if (labelInput && !labelInput.value.trim()) labelInput.value = option && option.label || "";
  }

  function adminOptionIcon(value) {
    var label = value === "html" ? "HTML" : "TXT";
    return '<span class="admin-option-icon" aria-hidden="true">' + safeText(label) + '</span>';
  }

  function adminAppIconSvg(type) {
    var attrs;
    var paths;
    if (type === "appstore") {
      attrs = 'width="22" height="26" viewBox="0 0 22 26"';
      paths = [
        "M18.3067 13.8343C18.3177 12.8377 18.5918 11.8628 19.1072 10.9962C19.6116 10.1296 20.3464 9.4038 21.2236 8.8838C20.6644 8.1147 19.9296 7.4756 19.0743 7.0315C18.2189 6.5874 17.2649 6.3382 16.289 6.3057C14.2054 6.0999 12.1986 7.5081 11.1349 7.5081C10.0713 7.5081 8.42631 6.3274 6.67181 6.3599C5.53131 6.3924 4.42381 6.7174 3.45881 7.2806C2.48281 7.8548 1.68231 8.6564 1.13401 9.6096C-1.25659 13.6068 0.530909 19.478 2.82281 22.7169C3.97421 24.2985 5.31201 26.0642 7.06661 25.9992C8.78821 25.9342 9.42431 24.9484 11.4968 24.9484C13.5694 24.9484 14.1506 25.9992 15.938 25.9667C17.7803 25.9342 18.9427 24.3743 20.0503 22.7819C20.8727 21.6553 21.5087 20.4096 21.9254 19.088C20.8508 18.6547 19.9406 17.9181 19.3046 16.9865C18.6576 16.0549 18.3177 14.9609 18.3177 13.8343H18.3067Z",
        "M14.9292 4.1705C15.9381 3.0114 16.4315 1.5165 16.3109 0C14.7757 0.1517 13.3611 0.8666 12.3412 1.9823C11.8478 2.524 11.464 3.1631 11.2227 3.8564C10.9815 4.5496 10.8828 5.2754 10.9266 6.0012C11.6942 6.0012 12.4509 5.8495 13.1418 5.5354C13.8326 5.2213 14.4467 4.7555 14.9292 4.1813V4.1705Z"
      ];
    } else if (type === "huawei") {
      attrs = 'width="26" height="26" viewBox="0 0 26 26"';
      paths = [
        "M18.27 0H7.15C1.9 0 0 1.97 0 7.31V18.67C0 24.03 1.93 25.98 7.15 25.98H18.27C23.52 25.98 25.42 24.01 25.42 18.67V7.31C25.45 1.97 23.52 0 18.27 0ZM5.03 13.01H5.7V16.4H5.03V15.03H3.5V16.4H2.83V13.01H3.5V14.38H5.03V13.01ZM8.84 14.94C8.84 15.48 8.57 15.79 8.09 15.79C7.61 15.79 7.34 15.49 7.34 14.92V13H6.67V14.95C6.67 15.9 7.18 16.46 8.09 16.46C9 16.46 9.54 15.92 9.54 14.92V13H8.87V14.95H8.84V14.94ZM16.63 15.33L15.88 13H15.32L14.57 15.33L13.85 13H13.13L14.28 16.39H14.84L15.59 14.15L16.34 16.39H16.9L18.05 13H17.35L16.63 15.33ZM19.29 14.94H20.52V14.31H19.29V13.62H21.09V12.99H18.65V16.38H21.17V15.75H19.32V14.93H19.29V14.94ZM21.94 16.4H22.61V13.01H21.94V16.4ZM10.85 15.68L10.56 16.39H9.86L11.31 13H11.9L13.35 16.39H12.65L12.36 15.68H10.85ZM11.09 15.09H12.11L11.6 13.89L11.09 15.09ZM12.72 8.68C10.39 8.68 8.49 6.73 8.49 4.35H9.08C9.08 6.4 10.71 8.07 12.72 8.07C14.73 8.07 16.36 6.4 16.36 4.35H16.95C16.95 6.73 15.05 8.68 12.72 8.68Z"
      ];
    } else if (type === "android" || type === "googleplay") {
      attrs = 'width="23" height="26" viewBox="0 0 23 26"';
      paths = [
        "M1.2079 0L13.4575 12.1642L16.8128 8.809L1.9643 0.2318C1.7203 0.0854001 1.4519 0.0122 1.2079 0ZM0.183 0.5612C0.0731996 0.7565 0 0.9883 0 1.2445V24.8775C0 25.0727 0.0366003 25.2435 0.1098 25.39L12.6401 12.9451L0.183 0.5612ZM17.8376 9.3825L14.2506 12.9573L17.8376 16.5077L22.2177 13.9944C22.84 13.6283 22.9254 13.1769 22.9254 12.9329C22.9254 12.5303 22.6692 12.152 22.2299 11.9202C21.8517 11.725 19.0821 10.1023 17.8254 9.3702L17.8376 9.3825ZM13.4575 13.7504L1.1103 26C1.3177 26 1.5373 25.939 1.7447 25.8292C2.2328 25.5486 12.0178 19.8874 12.0178 19.8874L16.8494 17.1178L13.4697 13.7626L13.4575 13.7504Z"
      ];
    }
    if (!paths) return "";
    return '<svg class="contact-icon contact-icon-' + safeText(type) + ' admin-app-icon" ' + attrs + ' fill="none" aria-hidden="true" focusable="false">' + paths.map(function (path) {
      return '<path d="' + path + '" fill="currentColor"></path>';
    }).join("") + '</svg>';
  }

  function adminContactIcon(type) {
    var appIcon = adminAppIconSvg(type);
    if (appIcon) return appIcon;
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
    if (iconClass.indexOf("hgi ") !== 0) iconClass = "nds-icon " + iconClass;
    return '<i class="contact-icon contact-icon-' + safeText(type || "website") + ' ' + safeText(iconClass) + '" aria-hidden="true"></i>';
  }

  function contactDeleteButton(index) {
    return [
      '<button class="contact-delete-btn nds-btn nds-subtle nds-destructive nds-icon-only" type="button" data-delete-contact="' + index + '" aria-label="حذف وسيلة التواصل" title="حذف">',
      '<i class="contact-delete-icon hgi hgi-stroke hgi-delete-02" aria-hidden="true"></i>',
      '<span class="nds-label sr-only">حذف</span>',
      '</button>'
    ].join("");
  }

  function adminDeleteButton(attributeName, index, label) {
    return [
      '<button class="contact-delete-btn admin-template-delete nds-btn nds-subtle nds-destructive nds-icon-only" type="button" ' + attributeName + '="' + index + '" aria-label="' + safeText(label || "حذف") + '" title="' + safeText(label || "حذف") + '">',
      '<i class="contact-delete-icon hgi hgi-stroke hgi-delete-02" aria-hidden="true"></i>',
      '<span class="nds-label sr-only">' + safeText(label || "حذف") + '</span>',
      '</button>'
    ].join("");
  }

  function collectProjects(options) {
    var keepDrafts = options && options.keepDrafts;
    data.projects = qsa("[data-project-index]").map(function (item) {
      var title = qs('[data-field="projectTitle"]', item).value.trim();
      var slugInput = qs('[data-field="projectSlug"]', item);
      return {
        id: item.dataset.projectId || newEntityId("project"),
        title: title,
        slug: slugify((slugInput ? slugInput.value : "") || title || generatedProjectSlug(Number(item.dataset.projectIndex))),
        status: qs('[data-field="projectStatus"]', item).value.trim(),
        date: qs('[data-field="projectDate"]', item).value.trim(),
        category: qs('[data-field="projectCategory"]', item).value.trim(),
        image: qs('[data-field="projectImage"]', item).value.trim(),
        url: qs('[data-field="projectUrl"]', item).value.trim(),
        description: qs('[data-field="projectDescription"]', item).value.trim(),
        visible: qs("[data-project-visible]", item).checked
      };
    }).filter(function (project) {
      return keepDrafts || projectHasDraftContent(project);
    });
    ensureUniqueProjectSlugs(data.projects);
  }

  function syncProjectSlugFromTitle(input) {
    var item = input ? input.closest("[data-project-index]") : null;
    var slugInput = item ? qs('[data-field="projectSlug"]', item) : null;
    if (!slugInput) return;

    var nextTitleSlug = slugify(input.value);
    var previousTitleSlug = slugify(item.dataset.projectTitleSlug || "");
    var currentSlug = slugify(slugInput.value);
    if (!currentSlug || currentSlug === previousTitleSlug || isGeneratedProjectSlug(currentSlug)) {
      slugInput.value = nextTitleSlug || currentSlug || generatedProjectSlug(Number(item.dataset.projectIndex));
      item.dataset.projectTitleSlug = nextTitleSlug;
    }
  }

  function normalizeProjectSlugInput(input) {
    var item;
    if (!input) return;
    item = input.closest("[data-project-index]");
    input.value = slugify(input.value) || generatedProjectSlug(Number(item && item.dataset.projectIndex));
  }

  function collectContacts() {
    return qsa("[data-contact-index]").map(function (item) {
      var index = Number(item.dataset.contactIndex);
      var existing = data.home.contacts && data.home.contacts[index] || {};
      return {
        id: item.dataset.contactId || existing.id || "contact-" + Date.now() + "-" + item.dataset.contactIndex,
        label: qs('[data-field="contactLabel"]', item).value.trim(),
        url: qs('[data-field="contactUrl"]', item).value.trim(),
        iconType: qs('[data-field="contactIconType"]', item).value,
        iconPath: qs('[data-field="contactIconPath"]', item).value.trim(),
        visible: qs("[data-contact-visible]", item).checked
      };
    }).filter(function (contact) {
      return contact.label || contact.url || contact.iconPath;
    });
  }

  function ensureFooterData() {
    data.footer = data.footer || {};
    data.footer.columns = Array.isArray(data.footer.columns) ? data.footer.columns : [];
    data.footer.iconGroups = Array.isArray(data.footer.iconGroups) ? data.footer.iconGroups : [];
    data.footer.bottomLinks = Array.isArray(data.footer.bottomLinks) ? data.footer.bottomLinks : [];
    data.footer.logos = Array.isArray(data.footer.logos) ? data.footer.logos : [];
    data.footer.cookies = Object.assign(defaultFooterCookies(), data.footer.cookies || {});
    data.footer.cookies.enabled = data.footer.cookies.enabled !== false;
  }

  function defaultFooterCookies() {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.footer && window.DEFAULT_SITE_DATA.footer.cookies;
    return cloneData(defaults || {
      enabled: true,
      title: "ملفات تعريف الارتباط",
      content: "يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربة التصفح وتسهيل الاستخدام. بالمتابعة في استخدام الموقع، فإنك توافق على استخدام ملفات الارتباط.",
      acceptLabel: "قبول",
      declineLabel: "رفض",
      linkPageSlugs: []
    });
  }

  function ensureFooterCookies() {
    ensureFooterData();
    data.footer.cookies.linkPageSlugs = Array.isArray(data.footer.cookies.linkPageSlugs) ? data.footer.cookies.linkPageSlugs : [];
    return data.footer.cookies;
  }

  function fillFooterCookieFields() {
    var cookies = ensureFooterCookies();
    setChecked("footerCookieEnabled", cookies.enabled !== false);
    setValue("footerCookieTitle", cookies.title);
    setValue("footerCookieContent", cookies.content);
    setValue("footerCookieAcceptLabel", cookies.acceptLabel);
    setValue("footerCookieDeclineLabel", cookies.declineLabel);
  }

  function collectFooterCookies() {
    var defaults = defaultFooterCookies();
    return {
      enabled: field("footerCookieEnabled") ? field("footerCookieEnabled").checked : defaults.enabled !== false,
      title: value("footerCookieTitle") || defaults.title,
      content: value("footerCookieContent") || defaults.content,
      acceptLabel: value("footerCookieAcceptLabel") || defaults.acceptLabel,
      declineLabel: value("footerCookieDeclineLabel") || defaults.declineLabel,
      linkPageSlugs: qsa("[data-cookie-popup-page-slug]:checked").map(function (input) {
        return input.value;
      }).filter(Boolean)
    };
  }

  function renderFooterCookiePagesList() {
    var root = qs("[data-cookie-footer-pages-list]");
    var pages;
    var selectedSlugs;
    if (!root) return;
    selectedSlugs = ensureFooterCookies().linkPageSlugs || [];
    pages = (data.pages || []).filter(function (page) {
      return page && page.showInFooter === true && hasAdminText(page.title || page.slug);
    });
    root.innerHTML = "";
    if (!pages.length) {
      root.append(window.SiteApp.emptyState("لا توجد صفحات مفعلة للتذييل", "افتح الصفحات، ثم فعّل خيار إظهار رابط تذييل للصفحات التي تريد ظهورها داخل نافذة ملفات الارتباط."));
      return;
    }
    root.innerHTML = pages.map(function (page) {
      return [
        '<article class="footer-cookie-page-row nds-card nds-stroke">',
        '<div class="nds-card-content compact-card-content">',
        '<div class="editor-item-head">',
        '<span class="nds-card-title">' + safeText(page.title || page.slug) + '</span>',
        '<span class="admin-inline-badge">إظهار رابط تذييل</span>',
        '</div>',
        '<p class="nds-card-description">' + safeText(page.slug || "") + '</p>',
        '<label class="check-line"><input class="nds-check" type="checkbox" data-cookie-popup-page-slug value="' + safeText(page.slug || "") + '" ' + (selectedSlugs.indexOf(page.slug || "") !== -1 ? "checked" : "") + '> <span>إظهار هذه الصفحة داخل نافذة ملفات الارتباط</span></label>',
        '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function footerManagedLinkTemplate(link, prefix, columnIndex, linkIndex) {
    var selectedPage = footerPageSlugFromUrl(link.url || link.href);
    var indexAttr = prefix === "footerColumnLink" ? ' data-footer-column-link-index="' + linkIndex + '"' : prefix === "footerIconLink" ? ' data-footer-icon-link-index="' + linkIndex + '"' : ' data-footer-bottom-link-index="' + linkIndex + '"';
    var sortableAttr = prefix === "footerBottomLink" ? ' data-sortable-item="footerBottomLinks"' : "";
    var dragHandle = prefix === "footerBottomLink" ? dragHandleHtml() : "";
    var deleteAttr = prefix === "footerColumnLink" ? "data-delete-footer-column-link" : prefix === "footerIconLink" ? "data-delete-footer-icon-link" : "data-delete-footer-bottom-link";
    var deleteValue = prefix === "footerBottomLink" ? linkIndex : columnIndex + ":" + linkIndex;
    var labelText = prefix === "footerColumnLink" ? "النص أو عنوان الرابط" : "عنوان الرابط";
    var urlPlaceholder = prefix === "footerColumnLink" ? "اتركه فارغا لعرض النص فقط أو اكتب رابطا مثل privacy.html أو https://google.com" : "privacy.html أو https://google.com";
    return [
      '<article class="editor-item compact-editor-item admin-template-item footer-nested-item nds-card nds-stroke"' + sortableAttr + indexAttr + '>',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandle,
      '<span class="nds-card-title">' + safeText(link.label || "رابط") + '</span>',
      adminDeleteButton(deleteAttr, deleteValue, "حذف الرابط"),
      '</div>',
      '<div class="form-grid">',
      inputHtml(prefix + "Label", labelText, link.label),
      selectHtml(prefix + "Page", "اختر صفحة داخلية", selectedPage, footerPageOptions()),
      inputHtml(prefix + "Url", "الرابط اليدوي أو الناتج", link.url || link.href, urlPlaceholder),
      prefix === "footerIconLink" ? iconTypeDropmenuHtml(prefix + "IconType", "نوع الأيقونة", link.iconType || "website") : "",
      prefix === "footerIconLink" ? uploadableInputHtml(prefix + "IconPath", "مسار شعار مخصص اختياري", link.iconPath, "contact-icon") : "",
      '</div>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-footer-managed-link-visible ' + (link.visible === false ? "" : "checked") + '> <span>إظهار الرابط</span></label>',
      '</div>',
      '</article>'
    ].join("");
  }

  function footerColumnTemplate(column, index) {
    var columnId = ensureEntityId(column, "footer-column");
    var links = Array.isArray(column.links) ? column.links : [];
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="footerColumns" data-footer-column-index="' + index + '" data-footer-column-id="' + safeText(columnId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب عمود التذييل"),
      '<span class="nds-card-title">' + safeText(column.title || "عمود تذييل") + '</span>',
      adminDeleteButton("data-delete-footer-column", index, "حذف عمود التذييل"),
      '</div>',
      '<div class="form-grid">',
      inputHtml("footerColumnTitle", "عنوان العمود", column.title),
      '</div>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-footer-column-visible ' + (column.visible === false ? "" : "checked") + '> <span>إظهار العمود</span></label>',
      '<div class="nested-editor-heading">',
      '<span class="nds-label">روابط وسطور العمود</span>',
      '<button class="nds-btn nds-secondary-outline nds-sm" type="button" data-add-footer-column-link="' + index + '"><span class="nds-label">إضافة رابط أو سطر</span></button>',
      '</div>',
      '<div class="editor-list compact-editor-list footer-nested-list" data-footer-column-links="' + index + '">',
      links.map(function (link, linkIndex) { return footerManagedLinkTemplate(link, "footerColumnLink", index, linkIndex); }).join(""),
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderFooterColumnsEditor() {
    var root = qs("[data-footer-columns-editor]");
    if (!root) return;
    ensureFooterData();
    data.footer.columns = data.footer.columns.slice(0, MAX_FOOTER_COLUMNS);
    root.dataset.sortableList = "footerColumns";
    root.innerHTML = data.footer.columns.map(footerColumnTemplate).join("");
    applySimpleEditorAccordions(root, "footer-columns");
    if (!data.footer.columns.length) {
      root.append(window.SiteApp.emptyState("لا توجد أعمدة تذييل", "استخدم زر إضافة عمود لإنشاء بنية مثل عن الموقع أو دعم فني."));
    }
    var addButton = qs("[data-add-footer-column]");
    if (addButton) {
      var atMax = data.footer.columns.length >= MAX_FOOTER_COLUMNS;
      addButton.disabled = atMax;
      addButton.title = atMax ? "الحد الأقصى 3 أعمدة" : "";
      addButton.dataset.state = atMax ? "disabled" : "";
    }
    prepareUploadControls(root);
  }

  function collectFooterManagedLinks(scope, prefix, keepDrafts) {
    return qsa("[data-footer-managed-link-visible]", scope).map(function (visibleInput) {
      var item = visibleInput.closest(".footer-nested-item");
      return {
        label: qs('[data-field="' + prefix + 'Label"]', item).value.trim(),
        url: qs('[data-field="' + prefix + 'Url"]', item).value.trim(),
        iconType: qs('[data-field="' + prefix + 'IconType"]', item) ? qs('[data-field="' + prefix + 'IconType"]', item).value : "",
        iconPath: qs('[data-field="' + prefix + 'IconPath"]', item) ? qs('[data-field="' + prefix + 'IconPath"]', item).value.trim() : "",
        visible: visibleInput.checked
      };
    }).filter(function (link) {
      return keepDrafts || link.label || link.url || link.iconPath || (prefix === "footerIconLink" && link.iconType);
    });
  }

  function collectFooterColumns(options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa("[data-footer-column-index]").slice(0, MAX_FOOTER_COLUMNS).map(function (item) {
      return {
        id: item.dataset.footerColumnId || newEntityId("footer-column"),
        title: qs('[data-field="footerColumnTitle"]', item).value.trim(),
        visible: qs("[data-footer-column-visible]", item).checked,
        links: collectFooterManagedLinks(item, "footerColumnLink", keepDrafts)
      };
    }).filter(function (column) {
      return keepDrafts || column.title || column.links.length;
    });
  }

  function footerIconGroupTemplate(group, index) {
    var groupId = ensureEntityId(group, "footer-icon-group");
    var links = Array.isArray(group.links) ? group.links : [];
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="footerIconGroups" data-footer-icon-group-index="' + index + '" data-footer-icon-group-id="' + safeText(groupId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب مجموعة الأيقونات"),
      '<span class="nds-card-title">' + safeText(group.title || "مجموعة أيقونات") + '</span>',
      adminDeleteButton("data-delete-footer-icon-group", index, "حذف مجموعة الأيقونات"),
      '</div>',
      '<div class="form-grid">',
      inputHtml("footerIconGroupTitle", "عنوان المجموعة", group.title),
      '</div>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-footer-icon-group-visible ' + (group.visible === false ? "" : "checked") + '> <span>إظهار المجموعة</span></label>',
      '<div class="nested-editor-heading">',
      '<span class="nds-label">روابط الأيقونات</span>',
      '<button class="nds-btn nds-secondary-outline nds-sm" type="button" data-add-footer-icon-link="' + index + '"><span class="nds-label">إضافة أيقونة</span></button>',
      '</div>',
      '<div class="editor-list compact-editor-list footer-nested-list" data-footer-icon-links="' + index + '">',
      links.map(function (link, linkIndex) { return footerManagedLinkTemplate(link, "footerIconLink", index, linkIndex); }).join(""),
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderFooterIconGroupsEditor() {
    var root = qs("[data-footer-icon-groups-editor]");
    if (!root) return;
    ensureFooterData();
    data.footer.iconGroups = data.footer.iconGroups.slice(0, MAX_FOOTER_ICON_GROUPS);
    root.dataset.sortableList = "footerIconGroups";
    root.innerHTML = data.footer.iconGroups.map(footerIconGroupTemplate).join("");
    applySimpleEditorAccordions(root, "footer-icon-groups");
    if (!data.footer.iconGroups.length) {
      root.append(window.SiteApp.emptyState("لا توجد مجموعات أيقونات", "استخدم زر إضافة مجموعة لإنشاء تابعنا أو تطبيق الجوال."));
    }
    var addButton = qs("[data-add-footer-icon-group]");
    if (addButton) {
      var atMax = data.footer.iconGroups.length >= MAX_FOOTER_ICON_GROUPS;
      addButton.disabled = atMax;
      addButton.title = atMax ? "الحد الأقصى مجموعتان" : "";
      addButton.dataset.state = atMax ? "disabled" : "";
    }
    prepareUploadControls(root);
  }

  function collectFooterIconGroups(options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa("[data-footer-icon-group-index]").slice(0, MAX_FOOTER_ICON_GROUPS).map(function (item) {
      return {
        id: item.dataset.footerIconGroupId || newEntityId("footer-icon-group"),
        title: qs('[data-field="footerIconGroupTitle"]', item).value.trim(),
        visible: qs("[data-footer-icon-group-visible]", item).checked,
        links: collectFooterManagedLinks(item, "footerIconLink", keepDrafts)
      };
    }).filter(function (group) {
      return keepDrafts || group.title || group.links.length;
    });
  }

  function isFooterMobileAppGroup(group) {
    var title = String(group && group.title || "");
    return /\bmobile\b|\bapps?\b|app\s*store|google\s*play/i.test(title)
      || title.indexOf("\u062a\u0637\u0628\u064a\u0642") !== -1
      || title.indexOf("\u0627\u0644\u062c\u0648\u0627\u0644") !== -1;
  }

  function nextFooterAppIconType(group) {
    var appTypes = ["appstore", "googleplay", "huawei"];
    var used = (group.links || []).map(function (link) {
      return String(link && link.iconType || "").toLowerCase();
    });
    return appTypes.find(function (type) {
      return used.indexOf(type) === -1;
    }) || "googleplay";
  }

  function footerBottomLinkTemplate(link, index) {
    return footerManagedLinkTemplate(link, "footerBottomLink", 0, index);
  }

  function renderFooterBottomLinksEditor() {
    var root = qs("[data-footer-bottom-links-editor]");
    if (!root) return;
    ensureFooterData();
    root.dataset.sortableList = "footerBottomLinks";
    root.innerHTML = data.footer.bottomLinks.map(footerBottomLinkTemplate).join("");
    applySimpleEditorAccordions(root, "footer-bottom-links");
    if (!data.footer.bottomLinks.length) {
      root.append(window.SiteApp.emptyState("لا توجد روابط سفلية", "أضف الشروط والأحكام أو إشعار الخصوصية هنا."));
    }
  }

  function collectFooterBottomLinks(options) {
    return collectFooterManagedLinks(qs("[data-footer-bottom-links-editor]") || document, "footerBottomLink", options && options.keepDrafts);
  }

  function footerLogoTemplate(logo, index) {
    var logoId = ensureEntityId(logo, "footer-logo");
    var selectedPage = footerPageSlugFromUrl(logo.url);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="footerLogos" data-footer-logo-index="' + index + '" data-footer-logo-id="' + safeText(logoId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب الشعار"),
      '<span class="nds-card-title">' + safeText(logo.label || logo.alt || "شعار") + '</span>',
      adminDeleteButton("data-delete-footer-logo", index, "حذف الشعار"),
      '</div>',
      '<div class="form-grid">',
      inputHtml("footerLogoLabel", "اسم الشعار", logo.label),
      inputHtml("footerLogoAlt", "النص البديل", logo.alt),
      selectHtml("footerLogoPage", "اختر صفحة داخلية", selectedPage, footerPageOptions()),
      inputHtml("footerLogoUrl", "رابط الشعار الداخلي أو الخارجي", logo.url, "index.html أو https://google.com"),
      uploadableInputHtml("footerLogoSrc", "مسار الصورة", logo.src || logo.image || logo.logo, "footer-logo"),
      '</div>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-footer-logo-visible ' + (logo.visible === false ? "" : "checked") + '> <span>إظهار الشعار</span></label>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderFooterLogosEditor() {
    var root = qs("[data-footer-logos-editor]");
    if (!root) return;
    ensureFooterData();
    root.dataset.sortableList = "footerLogos";
    root.innerHTML = data.footer.logos.map(footerLogoTemplate).join("");
    applySimpleEditorAccordions(root, "footer-logos");
    if (!data.footer.logos.length) {
      root.append(window.SiteApp.emptyState("لا توجد شعارات", "إذا لم تضف شعارات سيستخدم الموقع شعار الهوية الأساسي."));
    }
    prepareUploadControls(root);
  }

  function collectFooterLogos(options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa("[data-footer-logo-index]").map(function (item) {
      return {
        id: item.dataset.footerLogoId || newEntityId("footer-logo"),
        label: qs('[data-field="footerLogoLabel"]', item).value.trim(),
        alt: qs('[data-field="footerLogoAlt"]', item).value.trim(),
        url: qs('[data-field="footerLogoUrl"]', item).value.trim(),
        src: qs('[data-field="footerLogoSrc"]', item).value.trim(),
        visible: qs("[data-footer-logo-visible]", item).checked
      };
    }).filter(function (logo) {
      return keepDrafts || logo.label || logo.alt || logo.url || logo.src;
    });
  }

  function renderFooterEditors() {
    renderFooterLinksEditor();
    renderContactsEditor();
    renderFooterColumnsEditor();
    renderFooterIconGroupsEditor();
    renderFooterBottomLinksEditor();
    renderFooterLogosEditor();
  }

  function footerLinkTemplate(link, index) {
    var label = link.label || "رابط تذييل";
    var selectedPage = footerPageSlugFromUrl(link.url);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="footerLinks" data-footer-link-index="' + index + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب رابط التذييل"),
      '<span class="nds-card-title">' + safeText(label) + '</span>',
      adminDeleteButton("data-delete-footer-link", index, "حذف رابط التذييل"),
      '</div>',
      '<div class="form-grid">',
      inputHtml("footerLinkLabel", "عنوان الرابط", link.label),
      selectHtml("footerLinkPage", "اختر صفحة داخلية", selectedPage, footerPageOptions()),
      inputHtml("footerLinkUrl", "الرابط اليدوي أو الناتج", link.url, "اختر صفحة داخلية أو اكتب رابطا مثل privacy.html أو https://example.com/privacy"),
      '</div>',
      '<label class="check-line"><input class="nds-check" type="checkbox" data-footer-link-visible ' + (link.visible === false ? "" : "checked") + '> <span>إظهار الرابط في التذييل</span></label>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderFooterLinksEditor() {
    var root = qs("[data-footer-links-editor]");
    if (!root) return;
    data.home.footerLinks = data.home.footerLinks || [];
    root.dataset.sortableList = "footerLinks";
    root.innerHTML = data.home.footerLinks.map(footerLinkTemplate).join("");
    applySimpleEditorAccordions(root, "footer-links");
    if (!data.home.footerLinks.length) {
      root.append(window.SiteApp.emptyState("لا توجد روابط تذييل", "استخدم زر إضافة رابط لإضافة سياسة الخصوصية أو أي رابط مهم."));
    }
  }

  function collectFooterLinks(options) {
    var keepDrafts = options && options.keepDrafts;
    return qsa("[data-footer-link-index]").map(function (item) {
      return {
        label: qs('[data-field="footerLinkLabel"]', item).value.trim(),
        url: qs('[data-field="footerLinkUrl"]', item).value.trim(),
        visible: qs("[data-footer-link-visible]", item).checked
      };
    }).filter(function (link) {
      return keepDrafts || link.label || link.url;
    });
  }

  function collectPages() {
    var maps;
    data.pages = qsa("[data-page-index]").map(function (item) {
      var title = qs('[data-field="pageTitle"]', item).value.trim();
      var slug = qs('[data-field="pageSlug"]', item).value.trim() || slugify(title);
      var parentSlug = slugify((qs('[data-field="pageParentSlug"]', item) || {}).value || "");
      var navigationInput = qs("[data-page-navigation-link]", item);
      var createdAt = normalizePageTimestampValue(item.dataset.pageCreatedAt);
      var updatedAt = normalizePageTimestampValue(item.dataset.pageUpdatedAt, createdAt);
      var page = {
        id: item.dataset.pageId || newEntityId("page"),
        originalSlug: item.dataset.pageOriginalSlug || "",
        title: title,
        slug: slugify(slug),
        parentSlug: parentSlug,
        visible: qs("[data-page-visible]", item).checked,
        showInNavigation: parentSlug ? false : (navigationInput ? navigationInput.checked : true),
        showInFooter: qs("[data-page-footer-link]", item).checked,
        contentMode: qs('[data-field="pageContentMode"]', item).value || "text",
        image: (qs('[data-field="pageImage"]', item) || {}).value || "",
        video: (qs('[data-field="pageVideo"]', item) || {}).value || "",
        content: qs('[data-field="pageContent"]', item).value.trim(),
        createdAt: createdAt,
        updatedAt: updatedAt
      };
      if (pageEditorSignature(page) !== (item.dataset.pageSignature || "")) {
        page.updatedAt = currentPageTimestamp();
      }
      return page;
    }).filter(function (page) {
      return page.title || page.slug || page.content || page.image || page.video;
    });
    ensureUniquePageSlugs(data.pages);
    maps = pageSlugMaps(data.pages);
    data.pages.forEach(function (page) {
      var parent = maps.bySlug[page.parentSlug] || maps.byOriginalSlug[page.parentSlug];
      if (parent && parent !== page) page.parentSlug = parent.slug;
      delete page.originalSlug;
    });
    data.pages = normalizePageParentLinks(data.pages);
    data.pages.forEach(ensurePageTimestamps);
  }

  function addSubpageForParent(parentPageId) {
    var parentIndex;
    var parent;
    var parentSlug;
    var child;
    var insertAt;
    if (!ensurePermission("pages")) return;
    captureOpenEditorAccordions(qs("[data-pages-editor]"));
    collectPages();
    parentIndex = (data.pages || []).findIndex(function (page) {
      return ensureEntityId(page, "page") === parentPageId;
    });
    if (parentIndex < 0) {
      toast("تعذر تحديد الصفحة الأم", "error");
      renderPagesEditor();
      return;
    }
    parent = data.pages[parentIndex];
    if (slugify(parent.parentSlug)) {
      toast("الصفحة الفرعية لا يمكن أن تحتوي على صفحة فرعية أخرى", "error");
      renderPagesEditor();
      return;
    }
    parentSlug = slugify(parent.slug || parent.title);
    if (!parentSlug) {
      toast("اكتب عنوان الصفحة الأم أو الرابط المختصر أولا", "error");
      renderPagesEditor();
      return;
    }
    parent.parentSlug = "";
    parent.showInNavigation = parent.showInNavigation !== false;
    parent.updatedAt = currentPageTimestamp();
    child = {
      id: newEntityId("page"),
      title: "صفحة فرعية جديدة",
      slug: parentSlug + "-subpage",
      parentSlug: parentSlug,
      content: "",
      contentMode: "text",
      image: "",
      video: "",
      visible: true,
      showInNavigation: false,
      showInFooter: false,
      createdAt: parent.updatedAt,
      updatedAt: parent.updatedAt
    };
    data.pages.push(child);
    data.pages = normalizePageParentLinks(data.pages);
    parentIndex = data.pages.findIndex(function (page) {
      return ensureEntityId(page, "page") === parentPageId;
    });
    child = data.pages.find(function (page) {
      return ensureEntityId(page, "page") === child.id;
    });
    if (!child || parentIndex < 0) {
      toast("تعذر إنشاء الصفحة الفرعية", "error");
      renderPagesEditor();
      return;
    }
    parent = data.pages[parentIndex];
    parentSlug = slugify(parent && parent.slug);
    insertAt = parentIndex + 1;
    while (insertAt < data.pages.length && slugify(data.pages[insertAt].parentSlug) === parentSlug) {
      insertAt += 1;
    }
    data.pages = data.pages.filter(function (page) {
      return ensureEntityId(page, "page") !== child.id;
    });
    data.pages.splice(insertAt, 0, child);
    pendingOpenEditor.page = insertAt;
    openEditorAccordions.add("page:" + parentPageId);
    openEditorAccordions.add("page-children:" + parentPageId);
    openEditorAccordions.add("page:" + child.id);
    saveData();
    renderPagesEditor();
    refreshPublicShell();
    toast("تمت إضافة صفحة فرعية");
  }

  function deletePageById(pageId) {
    var index;
    var page;
    var pageSlug;
    var deletedParentSlug;
    var childCount;
    if (!pageId) return;
    captureOpenEditorAccordions(qs("[data-pages-editor]"));
    collectPages();
    index = (data.pages || []).findIndex(function (candidate) {
      return ensureEntityId(candidate, "page") === pageId;
    });
    if (index < 0) return;
    page = data.pages[index];
    pageSlug = slugify(page.slug || page.title);
    deletedParentSlug = slugify(page.parentSlug);
    childCount = (data.pages || []).filter(function (candidate) {
      return slugify(candidate.parentSlug) === pageSlug;
    }).length;
    confirmAdminDeleteThen(childCount ? "هل تريد حذف هذه الصفحة؟ سيتم نقل صفحاتها الفرعية إلى المستوى الرئيسي." : "هل تريد حذف هذه الصفحة؟", function () {
      data.pages.splice(index, 1);
      if (pageSlug) {
        data.pages.forEach(function (candidate) {
          if (slugify(candidate.parentSlug) === pageSlug) {
            candidate.parentSlug = "";
            candidate.updatedAt = currentPageTimestamp();
          }
        });
      }
      if (deletedParentSlug) {
        data.pages.forEach(function (candidate) {
          if (slugify(candidate.slug) === deletedParentSlug) candidate.updatedAt = currentPageTimestamp();
        });
      }
      openEditorAccordions.delete("page:" + pageId);
      openEditorAccordions.delete("page-children:" + pageId);
      saveData();
      renderPagesEditor();
      refreshPublicShell();
      toast("تم حذف الصفحة");
    });
  }

  function integrationLabel(integration) {
    if (integration && integration.type === "analytics") return integration.name || integration.provider || "Google Analytics";
    return integration.name || integration.provider || "تكامل";
  }

  function integrationHiddenInputHtml(key, value) {
    return '<input type="hidden" data-field="' + safeText(key) + '" value="' + safeText(value || "") + '">';
  }

  function normalizeGaMeasurementId(value) {
    var id = String(value || "").trim().toUpperCase();
    if (/^(G|GT|AW)-[A-Z0-9-]+$/.test(id) || /^UA-\d+-\d+$/.test(id)) return id;
    return "";
  }

  function gaMeasurementInputHtml(value) {
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">Measurement ID</span></label></div>',
      '<div class="nds-form-control"><input class="nds-input integration-measurement-input" data-field="integrationPublicKey" data-ga-measurement-input type="text" dir="ltr" value="' + safeText(value) + '" placeholder="G-XXXXXXXXXX"></div>',
      '</div>'
    ].join("");
  }

  function gaMeasurementStatusHtml(integration) {
    var id = normalizeGaMeasurementId(integration.publicKey);
    var hasValue = hasAdminText(integration.publicKey);
    var status = id ? "success" : (hasValue ? "error" : "info");
    var message = id
      ? "جاهز. سيتم تحميل Google Analytics بعد قبول ملفات الارتباط فقط."
      : (hasValue ? "تحقق من Measurement ID. الصيغة المتوقعة مثل G-XXXXXXXXXX." : "أدخل Measurement ID من Google Analytics 4.");
    return [
      '<div class="integration-status-card" data-ga-measurement-status data-status="' + status + '">',
      '<span class="integration-status-dot" aria-hidden="true"></span>',
      '<span class="nds-label">' + safeText(message) + '</span>',
      '</div>'
    ].join("");
  }

  function syncGaMeasurementStatus(input) {
    var item = input ? input.closest("[data-integration-index]") : null;
    var status = item ? qs("[data-ga-measurement-status]", item) : null;
    var label = status ? qs(".nds-label", status) : null;
    var id = normalizeGaMeasurementId(input && input.value);
    var hasValue = hasAdminText(input && input.value);
    if (!status || !label) return;
    status.dataset.status = id ? "success" : (hasValue ? "error" : "info");
    label.textContent = id
      ? "جاهز. سيتم تحميل Google Analytics بعد قبول ملفات الارتباط فقط."
      : (hasValue ? "تحقق من Measurement ID. الصيغة المتوقعة مثل G-XXXXXXXXXX." : "أدخل Measurement ID من Google Analytics 4.");
  }

  function analyticsIntegrationFieldsHtml(integration) {
    return [
      '<div class="integration-preset-note">',
      '<strong>Google Analytics</strong>',
      '<span>هذا التكامل مرتبط بموافقة ملفات الارتباط. إذا رفض الزائر، لن يتم تشغيل التحليلات.</span>',
      '</div>',
      '<div class="form-grid">',
      selectHtml("integrationType", "نوع التكامل", integration.type || "analytics", window.INTEGRATION_TYPES || []),
      inputHtml("integrationName", "اسم التكامل", integration.name || "Google Analytics"),
      inputHtml("integrationProvider", "مزود التحليلات", integration.provider || "Google Analytics"),
      selectHtml("integrationEnvironment", "البيئة", integration.environment || "live", window.INTEGRATION_ENVIRONMENTS || []),
      gaMeasurementInputHtml(integration.publicKey || ""),
      '</div>',
      gaMeasurementStatusHtml(integration),
      integrationHiddenInputHtml("integrationEndpointUrl", integration.endpointUrl),
      integrationHiddenInputHtml("integrationWebhookUrl", integration.webhookUrl),
      integrationHiddenInputHtml("integrationSecretEnvKey", integration.secretEnvKey),
      textareaHtml("integrationConfigJson", "إعدادات اختيارية JSON", integration.configJson, 3, "اتركها فارغة عادة. استخدمها فقط لإعدادات عامة إضافية.")
    ].join("");
  }

  function genericIntegrationFieldsHtml(integration) {
    return [
      '<div class="form-grid">',
      selectHtml("integrationType", "نوع التكامل", integration.type || "payment", window.INTEGRATION_TYPES || []),
      inputHtml("integrationName", "اسم التكامل", integration.name),
      inputHtml("integrationProvider", "مزود الخدمة", integration.provider, "مثال: Moyasar أو HyperPay أو Stripe"),
      selectHtml("integrationEnvironment", "البيئة", integration.environment || "test", window.INTEGRATION_ENVIRONMENTS || []),
      inputHtml("integrationEndpointUrl", "رابط الخدمة أو صفحة الدفع", integration.endpointUrl),
      inputHtml("integrationWebhookUrl", "رابط Webhook", integration.webhookUrl),
      inputHtml("integrationPublicKey", "المفتاح العام أو Client ID", integration.publicKey),
      inputHtml("integrationSecretEnvKey", "اسم متغير المفتاح السري في الخادم", integration.secretEnvKey, "مثال: PAYMENT_SECRET_KEY"),
      '</div>',
      textareaHtml("integrationConfigJson", "إعدادات عامة JSON", integration.configJson, 4, "استخدمها للإعدادات العامة فقط")
    ].join("");
  }

  function integrationFieldsHtml(integration) {
    return integration.type === "analytics" ? analyticsIntegrationFieldsHtml(integration) : genericIntegrationFieldsHtml(integration);
  }

  function integrationTemplate(integration, index) {
    var integrationId = ensureEntityId(integration, "integration");
    var panelId = "integration-panel-" + index;
    var accordionKey = "integrations:" + integrationId;
    var isOpen = openEditorAccordions.has(accordionKey);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-accordion nds-md nds-card nds-stroke" data-nds-local-accordion="ready" data-sortable-item="integrations" data-editor-accordion-key="' + safeText(accordionKey) + '" data-integration-index="' + index + '" data-integration-id="' + safeText(integrationId) + '" data-state="' + (isOpen ? "open" : "closed") + '">',
      '<div class="nds-card-content compact-card-content nds-accordion-item">',
      '<div class="editor-item-head sortable-editor-header nds-accordion-header">',
      dragHandleHtml("تغيير ترتيب التكامل"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle nds-menu-btn" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-accordion-title nds-card-title">' + safeText(integrationLabel(integration)) + '</span>',
      '</button>',
      adminDeleteButton("data-delete-integration", index, "حذف التكامل"),
      '</div>',
      '<div class="editor-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="editor-accordion-content nds-accordion-content">',
      '<div class="compact-editor-body editor-accordion-body nds-accordion-body">',
      integrationFieldsHtml(integration),
      '<label class="check-line"><input class="nds-check" type="checkbox" data-integration-enabled ' + (integration.enabled === false ? "" : "checked") + '> <span>تفعيل التكامل</span></label>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderIntegrationsEditor() {
    var root = qs("[data-integrations-editor]");
    if (!root) return;
    data.integrations = data.integrations || [];
    root.dataset.sortableList = "integrations";
    root.innerHTML = data.integrations.map(integrationTemplate).join("");
    if (!data.integrations.length) {
      root.append(window.SiteApp.emptyState("لا توجد تكاملات", "استخدم زر إضافة تكامل لتجهيز إعدادات خدمة دفع أو تحليلات أو API."));
    }
  }

  function collectIntegrations(options) {
    var keepDrafts = options && options.keepDrafts;
    function itemValue(item, key) {
      var input = qs('[data-field="' + key + '"]', item);
      return input ? input.value.trim() : "";
    }
    data.integrations = qsa("[data-integration-index]").map(function (item) {
      return {
        id: item.dataset.integrationId || newEntityId("integration"),
        type: itemValue(item, "integrationType") || "custom",
        name: itemValue(item, "integrationName"),
        provider: itemValue(item, "integrationProvider"),
        environment: itemValue(item, "integrationEnvironment") || "test",
        endpointUrl: itemValue(item, "integrationEndpointUrl"),
        webhookUrl: itemValue(item, "integrationWebhookUrl"),
        publicKey: itemValue(item, "integrationPublicKey"),
        secretEnvKey: itemValue(item, "integrationSecretEnvKey"),
        configJson: itemValue(item, "integrationConfigJson"),
        enabled: qs("[data-integration-enabled]", item).checked
      };
    }).filter(function (integration) {
      return keepDrafts || integration.name || integration.provider || integration.endpointUrl || integration.webhookUrl || integration.publicKey || integration.secretEnvKey || integration.configJson;
    });
  }

  function roleLabel(role) {
    var match = ADMIN_ROLES.find(function (item) { return item.value === role; });
    return match ? match.label : "موظف";
  }

  function userTitle(user) {
    return user.displayName || user.email || "موظف جديد";
  }

  function userPermissionsHtml(user, index) {
    var userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    var isOwner = user.role === "owner";
    var permissions = adminPermissions.length ? adminPermissions : Object.keys(ADMIN_PERMISSION_LABELS);
    var userKey = safeText(user.id || "new-" + index);
    return [
      '<fieldset class="permission-fieldset nds-check-container nds-md">',
      '<legend class="nds-label">الصلاحيات</legend>',
      '<div class="permission-grid" role="group" aria-label="الصلاحيات">'
    ].concat(permissions.map(function (permission) {
      var checked = isOwner || userPermissions.indexOf(permission) !== -1;
      var inputId = "admin-user-permission-" + userKey + "-" + safeText(permission);
      return [
        '<label class="permission-check admin-check-control" for="' + inputId + '">',
        '<span class="nds-form-control admin-check-box">',
        '<input id="' + inputId + '" class="nds-check" type="checkbox" data-user-permission="' + safeText(permission) + '" ' + (checked ? "checked" : "") + (isOwner ? " disabled" : "") + '>',
        '</span>',
        '<span class="nds-label">' + safeText(ADMIN_PERMISSION_LABELS[permission] || permission) + '</span>',
        '</label>'
      ].join("");
    })).concat([
      '</div>',
      '</fieldset>'
    ]).join("");
  }

  function userTemplate(user, index) {
    var panelId = "admin-user-panel-" + index;
    var currentUser = currentAdminUser() || {};
    var isSelf = Number(user.id || 0) === Number(currentUser.id || 0);
    var activeInputId = "admin-user-active-" + safeText(user.id || "new-" + index);
    return [
      '<article class="editor-item admin-user-item nds-accordion nds-md nds-card nds-stroke admin-user-accordion" data-admin-user-index="' + index + '" data-admin-user-id="' + safeText(user.id || "") + '">',
      '<div class="nds-accordion-item">',
      '<h3 class="nds-accordion-header admin-user-accordion-header">',
      '<button class="nds-accordion-btn nds-btn nds-subtle nds-menu-btn" type="button" aria-expanded="false" aria-controls="' + panelId + '">',
      '<span class="nds-accordion-title">' + safeText(userTitle(user)) + '</span>',
      '<span class="nds-tag nds-xs" data-status="' + (user.active === false ? "warning" : "success") + '"><span class="nds-label">' + safeText(roleLabel(user.role || "employee")) + '</span></span>',
      '</button>',
      isSelf ? '' : '<button class="contact-delete-btn admin-user-delete-btn nds-btn nds-subtle nds-destructive nds-icon-only" type="button" data-delete-admin-user="' + safeText(user.id || "") + '" aria-label="حذف الموظف" title="حذف الموظف"><i class="contact-delete-icon hgi hgi-stroke hgi-delete-02" aria-hidden="true"></i><span class="nds-label sr-only">حذف الموظف</span></button>',
      '</h3>',
      '<div class="nds-accordion-collapse" id="' + panelId + '">',
      '<div class="nds-accordion-content">',
      '<div class="nds-accordion-body admin-user-accordion-body">',
      '<div class="form-grid">',
      inputHtml("adminUserDisplayName", "الاسم", user.displayName || user.display_name || ""),
      inputHtml("adminUserEmail", "البريد الإلكتروني", user.email || ""),
      inputHtml("adminUserPhone", "رقم الجوال", user.phone || ""),
      selectHtml("adminUserRole", "الدور", user.role || "employee", ADMIN_ROLES),
      passwordHtml("adminUserPassword", user.id ? "كلمة مرور جديدة" : "كلمة المرور", user.id ? "اتركه فارغا إذا لا تريد تغييره" : "8 أحرف على الأقل"),
      '</div>',
      '<label class="nds-form-container nds-check-container nds-md admin-check-control admin-active-check" for="' + activeInputId + '">',
      '<span class="nds-form-control admin-check-box">',
      '<input id="' + activeInputId + '" class="nds-check" type="checkbox" data-user-active ' + (user.active === false ? "" : "checked") + (isSelf ? " disabled" : "") + '>',
      '</span>',
      '<span class="nds-label">الحساب نشط</span>',
      '</label>',
      userPermissionsHtml(user, index),
      '<div class="nds-section-action admin-user-actions">',
      '<button class="nds-btn nds-primary nds-md" type="button" data-save-admin-user><span class="nds-label">حفظ الموظف</span></button>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderAdminUsersEditor() {
    var root = qs("[data-admin-users-editor]");
    if (!root) return;
    root.innerHTML = adminUsers.map(userTemplate).join("");
    if (!adminUsers.length) {
      root.append(window.SiteApp.emptyState("لا يوجد موظفون بعد", "أضف موظفا وحدد الأقسام التي يمكنه إدارتها."));
    }
  }

  function loadAdminUsers(force) {
    if (!hasPermission("users") || !window.SiteStore || !window.SiteStore.listUsers) return Promise.resolve([]);
    if (adminUsersLoaded && !force) {
      renderAdminUsersEditor();
      return Promise.resolve(adminUsers);
    }
    return window.SiteStore.listUsers().then(function (payload) {
      adminUsers = payload.users || [];
      adminPermissions = payload.permissions || Object.keys(ADMIN_PERMISSION_LABELS);
      adminUsersLoaded = true;
      renderAdminUsersEditor();
      return adminUsers;
    }).catch(function (error) {
      toast(error.message || "تعذر تحميل الموظفين", "error");
      return [];
    });
  }

  function collectAdminUser(item) {
    var id = Number(item.dataset.adminUserId || 0);
    var role = qs('[data-field="adminUserRole"]', item).value;
    var permissions = qsa("[data-user-permission]", item).filter(function (input) {
      return input.checked && !input.disabled;
    }).map(function (input) {
      return input.dataset.userPermission;
    });
    return {
      id: id || undefined,
      displayName: qs('[data-field="adminUserDisplayName"]', item).value.trim(),
      email: qs('[data-field="adminUserEmail"]', item).value.trim(),
      phone: qs('[data-field="adminUserPhone"]', item).value.trim(),
      role: role,
      password: qs('[data-field="adminUserPassword"]', item).value,
      active: qs("[data-user-active]", item).checked,
      permissions: role === "owner" ? ["*"] : permissions
    };
  }

  function addAdminUserDraft() {
    if (!ensurePermission("users")) return;
    adminUsers.unshift({
      id: "",
      displayName: "",
      email: "",
      phone: "",
      role: "employee",
      permissions: ["home", "footer", "projects", "pages", "uploads"],
      active: true
    });
    renderAdminUsersEditor();
  }

  function saveAdminUser(button) {
    if (!ensurePermission("users")) return;
    var item = button.closest("[data-admin-user-index]");
    if (!item) return;
    window.SiteStore.saveUser(collectAdminUser(item)).then(function (users) {
      adminUsers = users || [];
      adminUsersLoaded = true;
      renderAdminUsersEditor();
      toast("تم حفظ صلاحيات الموظف");
    }).catch(function (error) {
      toast(error.message || "تعذر حفظ الموظف", "error");
    });
  }

  function deleteAdminUser(button) {
    if (!ensurePermission("users")) return;
    var id = Number(button.dataset.deleteAdminUser || 0);
    if (!id) {
      confirmAdminDeleteThen("هل تريد حذف هذا الموظف؟", function () {
        var draftItem = button.closest("[data-admin-user-index]");
        adminUsers.splice(Number(draftItem ? draftItem.dataset.adminUserIndex : 0), 1);
        renderAdminUsersEditor();
      });
      return;
    }
    confirmAdminDeleteThen("هل تريد حذف هذا الموظف؟", function () {
      window.SiteStore.deleteUser(id).then(function (users) {
        adminUsers = users || [];
        adminUsersLoaded = true;
        renderAdminUsersEditor();
        toast("تم حذف الموظف");
      }).catch(function (error) {
        toast(error.message || "تعذر حذف الموظف", "error");
      });
    });
  }

  function saveProjects() {
    if (!ensurePermission("projects")) return;
    var previousData = cloneData(lastSavedSnapshot || data);
    collectProjects();
    var changedProjects = (data.projects || []).filter(function (project) {
      var previousProject = findPreviousItem(previousData.projects, project);
      return isPublicProject(project) && (!isPublicProject(previousProject) || publicTextChanged(previousProject, project, projectPublicSignature));
    });
    var savePromise = saveDataIfChanged();
    if (!savePromise) return;
    savePromise.then(function () {
      return Promise.all(changedProjects.map(function (project) {
        return notifyProjectChange(project, findPreviousItem(previousData.projects, project));
      }));
    }).then(function () {
      addAdminActivity("حفظ المشاريع", "تم تحديث قائمة المشاريع.", "success");
      toast("تم حفظ المشاريع");
    });
    renderProjectsEditor();
  }

  function savePages() {
    if (!ensurePermission("pages")) return;
    var previousData = cloneData(lastSavedSnapshot || data);
    collectPages();
    var changedPages = (data.pages || []).filter(function (page) {
      var previousPage = findPreviousItem(previousData.pages, page);
      return isPublicPage(page) && (!isPublicPage(previousPage) || publicTextChanged(previousPage, page, pagePublicSignature));
    });
    var savePromise = saveDataIfChanged();
    if (!savePromise) return;
    savePromise.then(function () {
      return Promise.all(changedPages.map(function (page) {
        return notifyPageChange(page, findPreviousItem(previousData.pages, page));
      }));
    }).then(function () {
      toast("تم حفظ الصفحات");
      refreshPublicShell();
      addAdminActivity("حفظ الصفحات", "تم تحديث الصفحات العامة والفرعية.", "success");
    });
    renderPagesEditor();
  }

  function saveIntegrations() {
    if (!ensurePermission("integrations")) return;
    collectIntegrations();
    var savePromise = saveDataIfChanged();
    if (!savePromise) return;
    savePromise.then(function () {
      toast("تم حفظ التكاملات");
      refreshPublicShell();
      addAdminActivity("حفظ التكاملات", "تم تحديث إعدادات التكاملات والتحليلات.", "success");
    });
    renderIntegrationsEditor();
  }

  function previewDataSnapshot(target) {
    var snapshot = window.SiteStore && window.SiteStore.clone ? window.SiteStore.clone(data) : JSON.parse(JSON.stringify(data));
    data = snapshot;
    if (target === "home") {
      collectHomeDraft();
    } else if (target === "projects") {
      collectProjects();
    } else if (target === "pages") {
      collectPages();
    }
    return window.SiteStore && window.SiteStore.previewData ? window.SiteStore.previewData(data) : data;
  }

  function previewUrl(target, previewId) {
    var suffix = "?preview=" + encodeURIComponent(previewId);
    if (target === "projects") return "projects.html" + suffix;
    if (target === "pages") return "pages.html" + suffix;
    return "index.html" + suffix;
  }

  function openPreview(target) {
    var originalData = data;
    var previewId = "preview-" + Date.now();
    try {
      var snapshot = previewDataSnapshot(target);
      localStorage.setItem((window.SiteStore && window.SiteStore.previewKey) || "websiteDemo:previewData", JSON.stringify({
        id: previewId,
        expiresAt: Date.now() + (60 * 60 * 1000),
        data: snapshot
      }));
      data = originalData;
      var opened = window.open(previewUrl(target, previewId), "_blank", "noopener");
      if (!opened) toast("اسمح بفتح النوافذ المنبثقة لمعاينة الصفحة.", "error");
    } catch (error) {
      data = originalData;
      toast(error.message || "تعذرت معاينة الصفحة", "error");
    }
  }

  function getSortableItemIndex(item) {
    if (!item) return -1;
    return qsa("[data-sortable-item], [data-hero-slide-index], [data-page-index], [data-project-index], [data-contact-index]", item.parentElement).indexOf(item);
  }

  function getDragAfterElement(container, y) {
    return directChildren(container, "[data-sortable-item]:not(.is-dragging)").reduce(function (closest, child) {
      var box = child.getBoundingClientRect();
      var offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  function persistSortableOrder(root) {
    if (!root) return;
    if (root.dataset.sortableList === "hero") {
      data.home.heroSlides = collectHeroSlides({ keepDrafts: true });
      saveData();
      renderHeroSlidesEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب سلايدر القسم الرئيسي");
    } else if (root.dataset.sortableList === "pages") {
      collectPages();
      saveData();
      renderPagesEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب الصفحات");
    }

    if (root.dataset.sortableList === "projects") {
      collectProjects({ keepDrafts: true });
      if (data.projects.some(projectHasDraftContent)) saveData();
      renderProjectsEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب المشاريع");
    }
    if (root.dataset.sortableList === "contacts") {
      data.home.contacts = collectContacts();
      saveData();
      renderContactsEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب وسائل التواصل");
    }
    if (root.dataset.sortableList === "footerLinks") {
      data.home.footerLinks = collectFooterLinks();
      saveData();
      renderFooterLinksEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب روابط التذييل");
    }
    if (root.dataset.sortableList === "footerColumns") {
      ensureFooterData();
      data.footer.columns = collectFooterColumns();
      saveData();
      renderFooterColumnsEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب أعمدة التذييل");
    }
    if (root.dataset.sortableList === "footerIconGroups") {
      ensureFooterData();
      data.footer.iconGroups = collectFooterIconGroups();
      saveData();
      renderFooterIconGroupsEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب مجموعات الأيقونات");
    }
    if (root.dataset.sortableList === "footerBottomLinks") {
      ensureFooterData();
      data.footer.bottomLinks = collectFooterBottomLinks();
      saveData();
      renderFooterBottomLinksEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب الروابط السفلية");
    }
    if (root.dataset.sortableList === "footerLogos") {
      ensureFooterData();
      data.footer.logos = collectFooterLogos();
      saveData();
      renderFooterLogosEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب الشعارات");
    }
    if (root.dataset.sortableList === "experience") {
      data.home.experience = collectContentRows("experience");
      saveData();
      renderContentRowsEditor("experience");
      refreshPublicShell();
      toast("تم تحديث ترتيب الخبرات");
    }
    if (root.dataset.sortableList === "achievements") {
      data.home.achievements = collectContentRows("achievements");
      saveData();
      renderContentRowsEditor("achievements");
      refreshPublicShell();
      toast("تم تحديث ترتيب الإنجازات");
    }
    if (root.dataset.sortableList === "skills") {
      data.home.skills = collectSkills();
      saveData();
      renderSkillsEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب المهارات");
    }
    if (root.dataset.sortableList === "integrations") {
      collectIntegrations();
      saveData();
      renderIntegrationsEditor();
      toast("تم تحديث ترتيب التكاملات");
    }
  }

  function finishDragSort(shouldSave) {
    var root = activeSortableRoot;
    if (activeDragItem) activeDragItem.classList.remove("is-dragging");
    if (activeSortableRoot) activeSortableRoot.classList.remove("is-sorting");
    activeDragItem = null;
    activeSortableRoot = null;
    if (shouldSave) persistSortableOrder(root);
  }

  function setupDragSort() {
    document.addEventListener("dragstart", function (event) {
      var handle = event.target.closest("[data-drag-handle]");
      if (!handle) return;
      var item = handle.closest("[data-sortable-item]");
      var root = item ? item.closest("[data-sortable-list]") : null;
      if (!item || !root) return;
      activeDragItem = item;
      activeSortableRoot = root;
      item.classList.add("is-dragging");
      root.classList.add("is-sorting");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.dataset.sortableItem || "item");
      }
    });

    document.addEventListener("dragover", function (event) {
      if (!activeDragItem || !activeSortableRoot) return;
      var root = event.target.closest("[data-sortable-list]");
      if (root !== activeSortableRoot) return;
      event.preventDefault();
      var afterElement = getDragAfterElement(root, event.clientY);
      if (afterElement) {
        root.insertBefore(activeDragItem, afterElement);
      } else {
        root.appendChild(activeDragItem);
      }
    });

    document.addEventListener("drop", function (event) {
      if (!activeDragItem) return;
      event.preventDefault();
      finishDragSort(true);
    });

    document.addEventListener("dragend", function () {
      if (!activeDragItem) return;
      finishDragSort(false);
    });
  }

  function setupTabs() {
    qsa("[data-admin-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        activateAdminTab(button.dataset.adminTab, true, button);
      });
    });
  }

  function resolveUploadTarget(input) {
    var selector = input.dataset.uploadTargetSelector;
    if (selector) return qs(selector);
    var name = input.dataset.uploadTargetName;
    if (name) return field(name) || qs("#" + name);
    var fieldName = input.dataset.uploadTargetField;
    if (fieldName) {
      var scope = input.closest(".editor-item, .nds-card-content, form") || document;
      return qs('[data-field="' + fieldName + '"]', scope);
    }
    return null;
  }

  function createUploadProgress() {
    var progress = document.createElement("div");
    progress.className = "nds-progress-bar nds-lg admin-upload-progress";
    progress.dataset.value = "0";
    progress.dataset.uploadProgress = "";
    progress.hidden = true;
    progress.innerHTML = [
      '<span class="nds-progress-label" data-upload-progress-label></span>',
      '<div class="nds-progress-track">',
      '<div class="nds-progress-fill"></div>',
      '</div>',
      '<span class="nds-feedback nds-sm" data-status="info">',
      '<span class="nds-feedback-icon"><i class="nds-icon" aria-hidden="true"></i></span>',
      '<span class="nds-feedback-message" data-upload-progress-message></span>',
      '</span>'
    ].join("");
    return progress;
  }

  function ensureUploadContainer(input) {
    var control = uploadControl(input);
    var uploadContainer = input ? input.closest(".nds-file-upload") : null;
    if (!uploadContainer && control && control.parentNode) {
      uploadContainer = document.createElement("div");
      uploadContainer.className = "nds-form-container nds-file-upload upload-file-container";
      control.parentNode.insertBefore(uploadContainer, control);
      uploadContainer.appendChild(control);
    }
    if (uploadContainer) {
      uploadContainer.setAttribute("data-state", "single");
      if (!qs(":scope > .nds-file-list", uploadContainer)) {
        uploadContainer.insertAdjacentHTML("beforeend", uploadComponentExtrasHtml());
      }
    }
    return uploadContainer;
  }

  function uploadInstanceForInput(input) {
    var uploadContainer = ensureUploadContainer(input);
    var instance = null;
    if (!uploadContainer || !window.NDS || !window.NDS.Upload) return null;
    instance = window.NDS.Upload.getInstance(uploadContainer) || window.NDS.Upload.create(uploadContainer);
    if (instance && instance._fileInput && instance._onFileChange && !instance._adminFileChangeDetached) {
      instance._fileInput.removeEventListener("change", instance._onFileChange);
      instance._adminFileChangeDetached = true;
    }
    return instance;
  }

  function createNdsUploadProgress(input) {
    var file = input.files && input.files[0];
    var instance = uploadInstanceForInput(input);
    var fileId;
    if (!instance || !file) return null;
    instance.clearAllFiles();
    fileId = instance.addFile(file, { status: "uploading", progress: 0, error: null });
    if (!fileId) return null;
    instance.setFileProgress(fileId, 0);
    return { ndsUpload: instance, fileId: fileId };
  }

  function clearUploadFileList(fileList) {
    if (!fileList) return;
    while (fileList.firstChild) fileList.removeChild(fileList.firstChild);
  }

  function ensureUploadFileItemProgress(input) {
    var uploadContainer = ensureUploadContainer(input);
    var fileList = uploadContainer ? qs(":scope > .nds-file-list", uploadContainer) : null;
    var template = uploadContainer ? qs(":scope > .nds-file-item-template .nds-file-item", uploadContainer) : null;
    var file = input.files && input.files[0];
    var item;
    if (!fileList || !template) return null;
    clearUploadFileList(fileList);
    item = template.cloneNode(true);
    item.hidden = false;
    item.dataset.uploadProgress = "";
    item.dataset.state = "uploading";
    item.removeAttribute("data-status");
    if (file) item.dataset.fileName = file.name;
    var fileName = qs(".nds-file-name", item);
    var fileError = qs(".nds-error-message", item);
    var removeButton = qs(".nds-remove-file", item);
    var circle = qs(".nds-progress-circle", item);
    var feedback = qs(".nds-feedback", item);
    if (fileName) fileName.textContent = file ? file.name : defaultUploadLabel(input);
    if (fileError) fileError.textContent = "";
    if (removeButton) removeButton.hidden = true;
    if (feedback) feedback.removeAttribute("data-status");
    if (circle) {
      circle.dataset.value = "0";
      circle.style.setProperty("--progress-value", "0");
      circle.removeAttribute("data-status");
    }
    fileList.appendChild(item);
    return item;
  }

  function ensureUploadProgress(input) {
    var ndsUploadProgress = createNdsUploadProgress(input);
    if (ndsUploadProgress) return ndsUploadProgress;
    var fileItemProgress = ensureUploadFileItemProgress(input);
    if (fileItemProgress) return fileItemProgress;
    var root = input.closest(".uploadable-field") || input.closest(".nds-file-upload") || input.closest(".nds-form-container, .editor-item, form") || input.parentElement;
    var progress = root ? qs("[data-upload-progress]", root) : null;
    if (!progress) {
      progress = createUploadProgress();
      if (root) root.appendChild(progress);
    }
    return progress;
  }

  function setUploadProgress(progress, value, status, label, message) {
    if (!progress) return;
    var nextValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    if (progress.ndsUpload && progress.fileId) {
      if (status === "success") {
        progress.ndsUpload.setFileProgress(progress.fileId, 100);
        progress.ndsUpload.setFileStatus(progress.fileId, "complete", { progress: 100 });
      } else if (status === "error") {
        progress.ndsUpload.setFileStatus(progress.fileId, "error", { progress: nextValue, error: message || label || "" });
      } else {
        progress.ndsUpload.setFileProgress(progress.fileId, nextValue);
      }
      return;
    }
    if (progress.classList.contains("nds-file-item")) {
      var circle = qs(".nds-progress-circle", progress);
      var feedbackNode = qs(".nds-feedback", progress);
      var fileError = qs(".nds-error-message", progress);
      progress.hidden = false;
      if (circle) {
        circle.dataset.value = String(nextValue);
        circle.style.setProperty("--progress-value", String(nextValue));
        if (window.NDS && window.NDS.Progress && window.NDS.Progress.setValue) {
          window.NDS.Progress.setValue(circle, nextValue);
        }
      }
      if (fileError) fileError.textContent = status === "error" ? (message || "") : "";
      if (status === "success") {
        progress.removeAttribute("data-state");
        progress.dataset.status = "success";
        if (feedbackNode) feedbackNode.dataset.status = "success";
      } else if (status === "error") {
        progress.removeAttribute("data-state");
        progress.dataset.status = "error";
        if (feedbackNode) feedbackNode.dataset.status = "error";
      } else {
        progress.removeAttribute("data-status");
        if (feedbackNode) feedbackNode.removeAttribute("data-status");
        progress.dataset.state = nextValue >= 100 ? "processing" : "uploading";
      }
      return;
    }
    var feedback = qs(".nds-feedback", progress);
    progress.hidden = false;
    progress.dataset.value = String(nextValue);
    progress.style.setProperty("--progress-value", String(nextValue));
    if (status) {
      progress.dataset.status = status;
      if (feedback) feedback.dataset.status = status;
    } else {
      progress.removeAttribute("data-status");
      if (feedback) feedback.dataset.status = "info";
    }
    var labelNode = qs("[data-upload-progress-label]", progress);
    var messageNode = qs("[data-upload-progress-message]", progress);
    if (labelNode) labelNode.textContent = label || "";
    if (messageNode) messageNode.textContent = message || "";
    if (window.NDS && window.NDS.Progress && window.NDS.Progress.setValue) {
      window.NDS.Progress.setValue(progress, nextValue);
    }
  }

  function hideUploadProgress(progress) {
    if (!progress) return;
    window.setTimeout(function () {
      if (progress.ndsUpload) {
        progress.ndsUpload.clearAllFiles();
        return;
      }
      if (progress.classList.contains("nds-file-item")) {
        var list = progress.parentElement;
        progress.remove();
        if (list && !list.children.length) list.removeAttribute("data-status");
        return;
      }
      progress.hidden = true;
      progress.dataset.value = "0";
      progress.style.setProperty("--progress-value", "0");
      progress.removeAttribute("data-status");
    }, 1400);
  }

  function uploadControl(input) {
    if (!input) return null;
    return input.closest(".nds-form-control");
  }

  function defaultUploadLabel(input) {
    if (!input) return "رفع ملف";
    var control = uploadControl(input);
    if (control && control.dataset.defaultUploadLabel) return control.dataset.defaultUploadLabel;
    if (control && control.dataset.uploadLabel) return control.dataset.uploadLabel;
    if (input.hasAttribute("data-json-file")) return "اختيار ملف JSON";
    return uploadButtonLabel(input.dataset.mediaUpload || "");
  }

  function ensureUploadBrowseButton(input) {
    var control = uploadControl(input);
    if (!control || qs("[data-upload-browse]", control)) return;
    var label = control.dataset.uploadLabel || defaultUploadLabel(input);
    if (input.classList) {
      input.classList.add("nds-file-input");
      input.classList.remove("nds-input");
    }
    if (!qs(".nds-upload-zone", control)) {
      input.insertAdjacentHTML("afterend", uploadZoneHtml());
    }
    (qs(".nds-upload-zone", control) || input).insertAdjacentHTML("afterend", uploadBrowseButtonHtml(label));
  }

  function setUploadControlState(input, status, label) {
    var control = uploadControl(input);
    if (!control) return;
    if (!control.dataset.defaultUploadLabel) {
      control.dataset.defaultUploadLabel = control.dataset.uploadLabel || defaultUploadLabel(input);
    }
    control.dataset.uploadLabel = control.dataset.defaultUploadLabel;
    control.dataset.uploadStatusLabel = label || control.dataset.defaultUploadLabel;
    if (status) {
      control.dataset.uploadStatus = status;
    } else {
      control.removeAttribute("data-upload-status");
      control.removeAttribute("data-upload-status-label");
    }
    if (!input.getAttribute("aria-label")) input.setAttribute("aria-label", control.dataset.defaultUploadLabel);
    var buttonLabel = qs("[data-upload-button-label]", control);
    if (buttonLabel) buttonLabel.textContent = control.dataset.defaultUploadLabel;
    var browseButton = qs("[data-upload-browse]", control);
    if (browseButton) {
      browseButton.disabled = input.disabled;
      browseButton.setAttribute("aria-disabled", input.disabled ? "true" : "false");
    }
  }

  function resetUploadControlState(input, delay) {
    window.setTimeout(function () {
      setUploadControlState(input, "", defaultUploadLabel(input));
    }, delay || 0);
  }

  function prepareUploadControls(root) {
    qsa(".nds-form-control > .file-input", root || document).forEach(function (input) {
      ensureUploadContainer(input);
      ensureUploadBrowseButton(input);
      uploadInstanceForInput(input);
      setUploadControlState(input, "", defaultUploadLabel(input));
    });
  }

  function setupUploadEvents() {
    document.addEventListener("click", function (event) {
      var browseButton = event.target.closest("[data-upload-browse]");
      if (!browseButton) return;
      var control = browseButton.closest(".nds-form-control");
      var input = control ? qs(".file-input", control) : null;
      if (!input || input.disabled || browseButton.disabled) return;
      event.preventDefault();
      input.click();
    });

    document.addEventListener("change", function (event) {
      var pickedInput = event.target.closest(".file-input");
      if (pickedInput) {
        var pickedFile = pickedInput.files && pickedInput.files[0];
        if (pickedFile) setUploadControlState(pickedInput, "selected", pickedFile.name);
      }

      var input = event.target.closest("[data-media-upload]");
      if (!input) return;
      var file = input.files && input.files[0];
      if (!file) return;
      var target = resolveUploadTarget(input);
      if (!target) {
        toast("تعذر تحديد حقل مسار الملف", "error");
        return;
      }
      var progress = ensureUploadProgress(input);
      var uploadLabel = "جاري رفع " + file.name;
      var uploadSucceeded = false;
      input.disabled = true;
      setUploadControlState(input, "uploading", file.name);
      setUploadProgress(progress, 0, "info", uploadLabel, "جاري تجهيز الملف...");
      window.SiteStore.uploadMedia(file, input.dataset.mediaUpload, function (percent) {
        setUploadProgress(progress, percent, "info", uploadLabel, percent >= 100 ? "جاري معالجة الملف..." : "جاري رفع الملف...");
      }).then(function (result) {
        uploadSucceeded = true;
        setUploadControlState(input, "success", "تم رفع " + file.name);
        setUploadProgress(progress, 100, "success", "تم رفع " + file.name, "تم تحديث مسار الملف.");
        target.value = result.path || "";
        target.dispatchEvent(new Event("input", { bubbles: true }));
        hideUploadProgress(progress);
        toast("تم رفع الملف");
      }).catch(function (error) {
        setUploadControlState(input, "error", "تعذر رفع " + file.name);
        setUploadProgress(progress, 100, "error", "تعذر رفع " + file.name, error.message || "تعذر رفع الملف");
        toast(error.message || "تعذر رفع الملف", "error");
      }).finally(function () {
        input.disabled = false;
        input.value = "";
        setUploadControlState(input, uploadSucceeded ? "success" : "error", uploadControl(input) && uploadControl(input).dataset.uploadLabel);
        resetUploadControlState(input, uploadSucceeded ? 1600 : 2600);
      });
    });
  }

  function setupEvents() {
    if (qs("[data-settings-form]")) qs("[data-settings-form]").addEventListener("submit", saveSettings);
    qs("[data-navigation-form]").addEventListener("submit", saveNavigation);
    qs("[data-home-form]").addEventListener("submit", saveHome);
    if (qs("[data-footer-form]")) qs("[data-footer-form]").addEventListener("submit", saveFooter);
    if (qs("[data-cookie-preview]")) qs("[data-cookie-preview]").addEventListener("click", function () {
      collectFooterDraft();
      if (!data.footer.cookies || data.footer.cookies.enabled === false) {
        toast("فعّل إشعار ملفات الارتباط أولاً.", "info");
        return;
      }
      if (window.SiteApp && window.SiteApp.renderCookieConsent) {
        window.SiteApp.renderCookieConsent(data, { preview: true });
      } else if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.show) {
        window.NDS.Cookies.show();
      }
    });
    qs("[data-save-projects]").addEventListener("click", saveProjects);
    qs("[data-save-pages]").addEventListener("click", savePages);
    if (qs("[data-save-integrations]")) qs("[data-save-integrations]").addEventListener("click", saveIntegrations);
    qsa("[data-preview-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        openPreview(button.dataset.previewTarget || "home");
      });
    });
    setupUploadEvents();

    document.addEventListener("input", function (event) {
      if (event.target.matches('[data-field="projectTitle"]')) {
        syncProjectSlugFromTitle(event.target);
      }
      if (event.target.matches("[data-ga-measurement-input]")) {
        syncGaMeasurementStatus(event.target);
      }
    });

    document.addEventListener("focusout", function (event) {
      if (event.target.matches('[data-field="projectSlug"]')) {
        normalizeProjectSlugInput(event.target);
      }
    });

    qs("[data-add-hero-slide]").addEventListener("click", function () {
      data.home.heroSlides = collectHeroSlides({ keepDrafts: true });
      data.home.heroSlides.unshift({ title: "", subtitle: "", intro: "", image: "", mobileImage: "", video: "", mobileVideo: "", alt: "", visible: true });
      pendingOpenEditor.hero = 0;
      renderHeroSlidesEditor();
    });

    qs("[data-add-project]").addEventListener("click", function () {
      collectProjects({ keepDrafts: true });
      data.projects.push({ id: newEntityId("project"), title: "", slug: generatedProjectSlug(data.projects.length), description: "", status: "", date: "", category: "", image: "", url: "", visible: true });
      renderProjectsEditor();
    });

    if (qs("[data-add-contact]")) qs("[data-add-contact]").addEventListener("click", function () {
      data.home.contacts = collectContacts();
      data.home.contacts.push({ id: "", label: "", url: "", iconType: "website", iconPath: "", visible: true });
      renderContactsEditor();
    });

    if (qs("[data-add-footer-link]")) qs("[data-add-footer-link]").addEventListener("click", function () {
      data.home.footerLinks = collectFooterLinks({ keepDrafts: true });
      data.home.footerLinks.push({ label: "", url: "", visible: true });
      renderFooterLinksEditor();
    });

    if (qs("[data-add-footer-column]")) qs("[data-add-footer-column]").addEventListener("click", function () {
      ensureFooterData();
      data.footer.columns = collectFooterColumns({ keepDrafts: true });
      if (data.footer.columns.length >= MAX_FOOTER_COLUMNS) {
        toast("الحد الأقصى 3 أعمدة");
        renderFooterColumnsEditor();
        return;
      }
      data.footer.columns.push({ id: newEntityId("footer-column"), title: "", visible: true, links: [] });
      renderFooterColumnsEditor();
    });

    if (qs("[data-add-footer-icon-group]")) qs("[data-add-footer-icon-group]").addEventListener("click", function () {
      ensureFooterData();
      data.footer.iconGroups = collectFooterIconGroups({ keepDrafts: true });
      if (data.footer.iconGroups.length >= MAX_FOOTER_ICON_GROUPS) {
        toast("الحد الأقصى مجموعتان");
        renderFooterIconGroupsEditor();
        return;
      }
      data.footer.iconGroups.push({ id: newEntityId("footer-icon-group"), title: "", visible: true, links: [] });
      renderFooterIconGroupsEditor();
    });

    if (qs("[data-add-footer-bottom-link]")) qs("[data-add-footer-bottom-link]").addEventListener("click", function () {
      ensureFooterData();
      data.footer.bottomLinks = collectFooterBottomLinks({ keepDrafts: true });
      data.footer.bottomLinks.push({ label: "", url: "", visible: true });
      renderFooterBottomLinksEditor();
    });

    if (qs("[data-add-footer-logo]")) qs("[data-add-footer-logo]").addEventListener("click", function () {
      ensureFooterData();
      data.footer.logos = collectFooterLogos({ keepDrafts: true });
      data.footer.logos.push({ id: newEntityId("footer-logo"), label: "", alt: "", url: "", src: "", visible: true });
      renderFooterLogosEditor();
    });

    if (qs("[data-add-experience]")) qs("[data-add-experience]").addEventListener("click", function () {
      data.home.experience = collectContentRows("experience", { keepDrafts: true });
      data.home.experience.push({ id: newEntityId("experience"), title: "", meta: "", description: "", visible: true });
      renderContentRowsEditor("experience");
    });

    if (qs("[data-add-achievement]")) qs("[data-add-achievement]").addEventListener("click", function () {
      data.home.achievements = collectContentRows("achievements", { keepDrafts: true });
      data.home.achievements.push({ id: newEntityId("achievement"), title: "", meta: "", description: "", visible: true });
      renderContentRowsEditor("achievements");
    });

    if (qs("[data-add-skill]")) qs("[data-add-skill]").addEventListener("click", function () {
      data.home.skills = collectSkills({ keepDrafts: true });
      data.home.skills.push({ id: newEntityId("skill"), name: "", visible: true });
      renderSkillsEditor();
    });

    qs("[data-add-page]").addEventListener("click", function () {
      var page;
      var now;
      collectPages();
      now = currentPageTimestamp();
      page = { id: newEntityId("page"), title: "صفحة جديدة", slug: "page-" + Date.now(), parentSlug: "", content: "", contentMode: "text", image: "", video: "", visible: true, showInNavigation: true, showInFooter: false, createdAt: now, updatedAt: now };
      data.pages.unshift(page);
      pendingOpenEditor.page = 0;
      renderPagesEditor();
      saveData();
    });

    if (qs("[data-add-ga-integration]")) qs("[data-add-ga-integration]").addEventListener("click", function () {
      var integrationId;
      if (!ensurePermission("integrations")) return;
      collectIntegrations({ keepDrafts: true });
      integrationId = newEntityId("integration");
      data.integrations.unshift({
        id: integrationId,
        type: "analytics",
        name: "Google Analytics",
        provider: "Google Analytics",
        environment: "live",
        endpointUrl: "",
        webhookUrl: "",
        publicKey: "",
        secretEnvKey: "",
        configJson: "",
        enabled: true
      });
      openEditorAccordions.add("integrations:" + integrationId);
      renderIntegrationsEditor();
    });

    if (qs("[data-add-integration]")) qs("[data-add-integration]").addEventListener("click", function () {
      var integrationId;
      if (!ensurePermission("integrations")) return;
      collectIntegrations({ keepDrafts: true });
      integrationId = newEntityId("integration");
      data.integrations.unshift({
        id: integrationId,
        type: "payment",
        name: "",
        provider: "",
        environment: "test",
        endpointUrl: "",
        webhookUrl: "",
        publicKey: "",
        secretEnvKey: "",
        configJson: "",
        enabled: true
      });
      openEditorAccordions.add("integrations:" + integrationId);
      renderIntegrationsEditor();
    });

    if (qs("[data-add-admin-user]")) qs("[data-add-admin-user]").addEventListener("click", addAdminUserDraft);
    qsa("[data-admin-tab-link]").forEach(function (button) {
      button.addEventListener("click", function () {
        activateAdminTab(button.dataset.adminTabLink || "pages", true);
      });
    });

    document.addEventListener("click", function (event) {
      var deleteHeroSlide = event.target.closest("[data-delete-hero-slide]");
      var deleteProject = event.target.closest("[data-delete-project]");
      var deletePage = event.target.closest("[data-delete-page]");
      var deleteContact = event.target.closest("[data-delete-contact]");
      var deleteFooterLink = event.target.closest("[data-delete-footer-link]");
      var deleteFooterColumn = event.target.closest("[data-delete-footer-column]");
      var deleteFooterColumnLink = event.target.closest("[data-delete-footer-column-link]");
      var deleteFooterIconGroup = event.target.closest("[data-delete-footer-icon-group]");
      var deleteFooterIconLink = event.target.closest("[data-delete-footer-icon-link]");
      var deleteFooterBottomLink = event.target.closest("[data-delete-footer-bottom-link]");
      var deleteFooterLogo = event.target.closest("[data-delete-footer-logo]");
      var addFooterColumnLink = event.target.closest("[data-add-footer-column-link]");
      var addFooterIconLink = event.target.closest("[data-add-footer-icon-link]");
      var deleteIntegration = event.target.closest("[data-delete-integration]");
      var saveAdminUserButton = event.target.closest("[data-save-admin-user]");
      var deleteAdminUserButton = event.target.closest("[data-delete-admin-user]");
      var deleteContentRow = event.target.closest("[data-delete-content-row]");
      var deleteSkill = event.target.closest("[data-delete-skill]");
      var addSubpage = event.target.closest("[data-add-subpage]");
      var pageChildrenToggle = event.target.closest("[data-page-children-toggle]");
      var pageFormatButton = event.target.closest("[data-page-format]");
      var contactToggle = event.target.closest("[data-contact-toggle]");
      var editorToggle = event.target.closest("[data-editor-toggle]");
      var iconTypeTrigger = event.target.closest("[data-icon-type-trigger]");
      var iconTypeOption = event.target.closest("[data-icon-type-option]");
      var optionTrigger = event.target.closest("[data-option-trigger]");
      var optionValue = event.target.closest("[data-option-value]");
      var selectTrigger = event.target.closest("[data-select-trigger]");
      var selectValue = event.target.closest("[data-select-value]");

      if (iconTypeTrigger) { toggleIconTypeMenu(iconTypeTrigger); return; }
      if (iconTypeOption) { selectIconType(iconTypeOption); return; }
      if (optionTrigger) { toggleOptionMenu(optionTrigger); return; }
      if (optionValue) { selectOptionValue(optionValue); return; }
      if (selectTrigger) { toggleSelectMenu(selectTrigger); return; }
      if (selectValue) { selectDropmenuValue(selectValue); return; }
      if (saveAdminUserButton) { saveAdminUser(saveAdminUserButton); return; }
      if (deleteAdminUserButton) { deleteAdminUser(deleteAdminUserButton); return; }
      if (addSubpage) { addSubpageForParent(addSubpage.dataset.addSubpage || ""); return; }
      if (pageChildrenToggle) { togglePageChildrenSection(pageChildrenToggle); return; }
      if (pageFormatButton) { applyPageTextFormat(pageFormatButton); return; }
      if (!event.target.closest("[data-icon-type-menu], [data-option-menu], [data-select-menu]")) closeAdminInlineDropmenus();
      if (contactToggle) { toggleContactPanel(contactToggle); return; }
      if (editorToggle) { toggleEditorPanel(editorToggle); return; }

      if (deleteHeroSlide) {
        confirmAdminDeleteThen("هل تريد حذف وسائط القسم الرئيسي؟", function () {
          var heroSlideIndex = getSortableItemIndex(deleteHeroSlide.closest("[data-hero-slide-index]"));
          data.home.heroSlides = collectHeroSlides({ keepDrafts: true });
          if (heroSlideIndex > -1) data.home.heroSlides.splice(heroSlideIndex, 1);
          saveData();
          renderHeroSlidesEditor();
          toast("تم حذف وسائط القسم الرئيسي");
        });
        return;
      }
      if (deleteContact) {
        confirmAdminDeleteThen("هل تريد حذف وسيلة التواصل؟", function () {
          data.home.contacts = collectContacts();
          data.home.contacts.splice(Number(deleteContact.dataset.deleteContact), 1);
          saveData();
          renderContactsEditor();
          toast("تم حذف وسيلة التواصل");
        });
        return;
      }
      if (deleteFooterLink) {
        confirmAdminDeleteThen("هل تريد حذف رابط التذييل؟", function () {
          data.home.footerLinks = collectFooterLinks({ keepDrafts: true });
          data.home.footerLinks.splice(Number(deleteFooterLink.dataset.deleteFooterLink), 1);
          saveData();
          renderFooterLinksEditor();
          refreshPublicShell();
          toast("تم حذف رابط التذييل");
        });
        return;
      }
      if (addFooterColumnLink) {
        var columnIndex = Number(addFooterColumnLink.dataset.addFooterColumnLink);
        data.footer.columns = collectFooterColumns({ keepDrafts: true });
        if (data.footer.columns[columnIndex]) {
          data.footer.columns[columnIndex].links = data.footer.columns[columnIndex].links || [];
          data.footer.columns[columnIndex].links.push({ label: "", url: "", visible: true });
        }
        renderFooterColumnsEditor();
      }
      if (addFooterIconLink) {
        var groupIndex = Number(addFooterIconLink.dataset.addFooterIconLink);
        data.footer.iconGroups = collectFooterIconGroups({ keepDrafts: true });
        if (data.footer.iconGroups[groupIndex]) {
          data.footer.iconGroups[groupIndex].links = data.footer.iconGroups[groupIndex].links || [];
          data.footer.iconGroups[groupIndex].links.push({
            label: "",
            url: "",
            iconType: isFooterMobileAppGroup(data.footer.iconGroups[groupIndex]) ? nextFooterAppIconType(data.footer.iconGroups[groupIndex]) : "website",
            iconPath: "",
            visible: true
          });
        }
        renderFooterIconGroupsEditor();
      }
      if (deleteFooterColumn) {
        confirmAdminDeleteThen("هل تريد حذف عمود التذييل؟", function () {
          data.footer.columns = collectFooterColumns({ keepDrafts: true });
          data.footer.columns.splice(Number(deleteFooterColumn.dataset.deleteFooterColumn), 1);
          saveData();
          renderFooterColumnsEditor();
          refreshPublicShell();
          toast("تم حذف عمود التذييل");
        });
        return;
      }
      if (deleteFooterColumnLink) {
        confirmAdminDeleteThen("هل تريد حذف رابط العمود؟", function () {
          var columnParts = String(deleteFooterColumnLink.dataset.deleteFooterColumnLink || "").split(":");
          data.footer.columns = collectFooterColumns({ keepDrafts: true });
          if (data.footer.columns[Number(columnParts[0])]) data.footer.columns[Number(columnParts[0])].links.splice(Number(columnParts[1]), 1);
          saveData();
          renderFooterColumnsEditor();
          refreshPublicShell();
          toast("تم حذف رابط العمود");
        });
        return;
      }
      if (deleteFooterIconGroup) {
        confirmAdminDeleteThen("هل تريد حذف مجموعة الأيقونات؟", function () {
          data.footer.iconGroups = collectFooterIconGroups({ keepDrafts: true });
          data.footer.iconGroups.splice(Number(deleteFooterIconGroup.dataset.deleteFooterIconGroup), 1);
          saveData();
          renderFooterIconGroupsEditor();
          refreshPublicShell();
          toast("تم حذف مجموعة الأيقونات");
        });
        return;
      }
      if (deleteFooterIconLink) {
        confirmAdminDeleteThen("هل تريد حذف رابط الأيقونة؟", function () {
          var iconParts = String(deleteFooterIconLink.dataset.deleteFooterIconLink || "").split(":");
          data.footer.iconGroups = collectFooterIconGroups({ keepDrafts: true });
          if (data.footer.iconGroups[Number(iconParts[0])]) data.footer.iconGroups[Number(iconParts[0])].links.splice(Number(iconParts[1]), 1);
          saveData();
          renderFooterIconGroupsEditor();
          refreshPublicShell();
          toast("تم حذف رابط الأيقونة");
        });
        return;
      }
      if (deleteFooterBottomLink) {
        confirmAdminDeleteThen("هل تريد حذف الرابط السفلي؟", function () {
          data.footer.bottomLinks = collectFooterBottomLinks({ keepDrafts: true });
          data.footer.bottomLinks.splice(Number(deleteFooterBottomLink.dataset.deleteFooterBottomLink), 1);
          saveData();
          renderFooterBottomLinksEditor();
          refreshPublicShell();
          toast("تم حذف الرابط السفلي");
        });
        return;
      }
      if (deleteFooterLogo) {
        confirmAdminDeleteThen("هل تريد حذف شعار التذييل؟", function () {
          data.footer.logos = collectFooterLogos({ keepDrafts: true });
          data.footer.logos.splice(Number(deleteFooterLogo.dataset.deleteFooterLogo), 1);
          saveData();
          renderFooterLogosEditor();
          refreshPublicShell();
          toast("تم حذف شعار التذييل");
        });
        return;
      }
      if (deleteProject) {
        confirmAdminDeleteThen("هل تريد حذف المشروع؟", function () {
          var projectItem = deleteProject.closest("[data-project-index]");
          var projectIndex = getSortableItemIndex(projectItem);
          var removedProject;
          collectProjects({ keepDrafts: true });
          if (projectIndex > -1) removedProject = data.projects.splice(projectIndex, 1)[0];
          if (projectHasDraftContent(removedProject)) saveData();
          renderProjectsEditor();
          toast("تم حذف المشروع");
        });
        return;
      }
      if (deletePage) {
        var deletePageItem = deletePage.closest("[data-page-index]");
        deletePageById(deletePageItem ? deletePageItem.dataset.pageId : "");
        return;
      }
      if (deleteIntegration) {
        confirmAdminDeleteThen("هل تريد حذف التكامل؟", function () {
          collectIntegrations({ keepDrafts: true });
          data.integrations.splice(getSortableItemIndex(deleteIntegration.closest("[data-integration-index]")), 1);
          saveData();
          renderIntegrationsEditor();
          toast("تم حذف التكامل");
        });
        return;
      }
      if (deleteContentRow) {
        confirmAdminDeleteThen("هل تريد حذف هذا العنصر؟", function () {
          var rowItem = deleteContentRow.closest("[data-content-row-type]");
          var rowType = rowItem ? rowItem.dataset.contentRowType : "experience";
          data.home[rowType] = collectContentRows(rowType);
          data.home[rowType].splice(getSortableItemIndex(rowItem), 1);
          saveData();
          renderContentRowsEditor(rowType);
          toast("تم حذف العنصر");
        });
        return;
      }
      if (deleteSkill) {
        confirmAdminDeleteThen("هل تريد حذف المهارة؟", function () {
          data.home.skills = collectSkills();
          data.home.skills.splice(getSortableItemIndex(deleteSkill.closest("[data-skill-index]")), 1);
          saveData();
          renderSkillsEditor();
          toast("تم حذف المهارة");
        });
        return;
      }
    });

    document.addEventListener("change", function (event) {
      if (event.target.matches("[data-page-format-font]")) {
        applyPageEditorFont(event.target);
        return;
      }
      if (event.target.matches("[data-page-format-size]")) {
        applyPageEditorFontSize(event.target);
        return;
      }
      if (!event.target.matches("[data-page-visible], [data-page-navigation-link], [data-page-footer-link]")) return;
      var pageItem = event.target.closest("[data-page-index]");
      if (pageItem && event.target.matches("[data-page-navigation-link], [data-page-footer-link]") && event.target.checked) {
        qs("[data-page-visible]", pageItem).checked = true;
      }
      if (pageItem && event.target.matches("[data-page-footer-link]") && event.target.checked) {
        var navInput = qs("[data-page-navigation-link]", pageItem);
        if (navInput) navInput.checked = false;
      }
      collectPages();
      saveData();
      refreshPublicShell();
      if (event.target.matches("[data-page-footer-link]")) {
        toast(event.target.checked ? "تمت إضافة الصفحة إلى روابط التذييل" : "تمت إزالة الصفحة من روابط التذييل");
      } else if (event.target.matches("[data-page-navigation-link]")) {
        toast(event.target.checked ? "تم إظهار الصفحة في الهيدر" : "تم إخفاء الصفحة من الهيدر");
      } else {
        toast(event.target.checked ? "تم نشر الصفحة" : "تم إخفاء الصفحة من الواجهة");
      }
    });

    if (qs("[data-refresh-system-status]")) qs("[data-refresh-system-status]").addEventListener("click", function () {
      collectCurrentAdminDrafts();
      renderSystemConsole();
      toast("تم تحديث حالة النظام");
    });

    if (qs("[data-export-json]")) qs("[data-export-json]").addEventListener("click", function () {
      downloadSystemBackup("site-content.json");
    });

    if (qs("[data-download-backup]")) qs("[data-download-backup]").addEventListener("click", function () {
      downloadSystemBackup();
    });

    if (qs("[data-copy-json]")) qs("[data-copy-json]").addEventListener("click", copyJsonSnapshot);

    if (qs("[data-check-broken-links]")) qs("[data-check-broken-links]").addEventListener("click", runSystemLinkCheck);
    if (qs("[data-clear-preview-cache]")) qs("[data-clear-preview-cache]").addEventListener("click", clearPreviewCache);
    if (qs("[data-reset-cookie-consent]")) qs("[data-reset-cookie-consent]").addEventListener("click", resetCookieConsent);
    if (qs("[data-clear-activity-log]")) qs("[data-clear-activity-log]").addEventListener("click", function () {
      clearAdminActivityLog();
      toast("تم مسح سجل النشاط");
    });

    if (qs("[data-import-json]")) qs("[data-import-json]").addEventListener("click", function () {
      var json = value("jsonBox");
      if (!json) { toast("ضع محتوى JSON أولا"); return; }
      try {
        window.SiteStore.importJson(json).then(function (importedData) {
          data = importedData;
          return fillForms();
        }).then(function () {
          addAdminActivity("استيراد JSON", "تم استيراد نسخة محتوى من مربع JSON.", "success");
          toast("تم استيراد البيانات");
        }).catch(function (error) {
          toast(error.message || "تعذر الاستيراد", "error");
        });
      } catch (error) {
        toast("ملف JSON غير صالح");
      }
    });

    if (qs("[data-import-local-cache]")) qs("[data-import-local-cache]").addEventListener("click", function () {
      window.SiteStore.importLocalCache().then(function (importedData) {
        data = importedData;
        return fillForms();
      }).then(function () {
        addAdminActivity("نقل localStorage", "تم نقل البيانات المحلية القديمة إلى قاعدة البيانات.", "success");
        toast("تم نقل بيانات localStorage إلى قاعدة البيانات");
      }).catch(function (error) {
        toast(error.message || "لا توجد بيانات محلية للنقل", "error");
      });
    });

    if (qs("[data-reset-content]")) qs("[data-reset-content]").addEventListener("click", function () {
      confirmAdminDeleteThen("هل تريد إعادة تعيين كل المحتوى؟ سيتم حذف التعديلات الحالية.", function () {
        window.SiteStore.reset().then(function (resetData) {
          data = resetData;
          setValue("jsonBox", "");
          return fillForms();
        }).then(function () {
          addAdminActivity("إعادة تعيين المحتوى", "تمت إعادة الموقع إلى البيانات الافتراضية.", "success");
          toast("تمت إعادة التعيين");
        }).catch(function (error) {
          toast(error.message || "تعذر إعادة التعيين", "error");
        });
      });
    });

    if (qs("[data-json-file]")) qs("[data-json-file]").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        setValue("jsonBox", String(reader.result || ""));
        addAdminActivity("تحميل ملف JSON", "تم تجهيز الملف " + file.name + " داخل مربع الاستيراد.", "info");
      };
      reader.readAsText(file);
    });
  }

  function toggleContactPanel(button) {
    var isOpen = button.getAttribute("aria-expanded") === "true";
    setContactAccordionState(button, !isOpen);
  }

  function toggleEditorPanel(button) {
    var isOpen = button.getAttribute("aria-expanded") === "true";
    setEditorAccordionState(button, !isOpen);
  }

  function clearInlineDropmenuTimer(menuPanel) {
    var timer = menuPanel ? adminInlineDropmenuTimers.get(menuPanel) : null;
    if (!timer) return;
    window.clearTimeout(timer);
    adminInlineDropmenuTimers.delete(menuPanel);
  }

  function inlineDropmenuTransitionMs(menuPanel) {
    var styles;
    var values;
    if (!menuPanel || !window.getComputedStyle) return 220;
    styles = window.getComputedStyle(menuPanel);
    values = (styles.transitionDuration || "").split(",").map(function (value) {
      value = value.trim();
      if (value.endsWith("ms")) return parseFloat(value) || 0;
      if (value.endsWith("s")) return (parseFloat(value) || 0) * 1000;
      return 0;
    });
    return Math.max.apply(Math, values.concat([180])) + 40;
  }

  function openInlineDropmenu(menu, trigger, menuPanel) {
    function promoteOpenState() {
      if (!menuPanel.isConnected || menuPanel.hidden || menuPanel.dataset.state !== "opening") return;
      menuPanel.dataset.state = "open";
      menu.dataset.state = "open";
    }
    clearInlineDropmenuTimer(menuPanel);
    menuPanel.hidden = false;
    menuPanel.setAttribute("aria-hidden", "false");
    menuPanel.dataset.state = "opening";
    menu.dataset.state = "opening";
    trigger.setAttribute("aria-expanded", "true");
    menuPanel.offsetHeight;
    window.requestAnimationFrame(function () {
      promoteOpenState();
    });
    window.setTimeout(promoteOpenState, 40);
    scrollAdminInlineMenuIntoView(menuPanel);
  }

  function closeInlineDropmenu(menu, trigger, menuPanel, immediate) {
    var timer;
    if (!menuPanel) return;
    clearInlineDropmenuTimer(menuPanel);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (immediate || menuPanel.hidden) {
      menuPanel.hidden = true;
      menuPanel.setAttribute("aria-hidden", "true");
      menuPanel.dataset.state = "";
      if (menu) menu.dataset.state = "";
      return;
    }
    menuPanel.setAttribute("aria-hidden", "true");
    menuPanel.dataset.state = "closing";
    if (menu) menu.dataset.state = "closing";
    timer = window.setTimeout(function () {
      if (!menuPanel.isConnected || menuPanel.dataset.state !== "closing") return;
      menuPanel.hidden = true;
      menuPanel.dataset.state = "";
      if (menu) menu.dataset.state = "";
      adminInlineDropmenuTimers.delete(menuPanel);
    }, inlineDropmenuTransitionMs(menuPanel));
    adminInlineDropmenuTimers.set(menuPanel, timer);
  }

  function toggleInlineDropmenu(trigger, menuSelector) {
    var menu = trigger.closest(menuSelector);
    var menuPanel = menu ? qs(".nds-dropmenu-menu", menu) : null;
    var state = menuPanel ? menuPanel.dataset.state || "" : "";
    var willOpen = menuPanel && (menuPanel.hidden || !/\bopen\b/.test(state));
    if (!menuPanel) return;
    if (willOpen) {
      closeAdminInlineDropmenus(menu);
      openInlineDropmenu(menu, trigger, menuPanel);
    } else {
      closeInlineDropmenu(menu, trigger, menuPanel);
    }
  }

  function closeIconTypeMenus(exceptMenu) {
    qsa("[data-icon-type-menu]").forEach(function (menu) {
      if (menu === exceptMenu) return;
      var trigger = qs("[data-icon-type-trigger]", menu);
      var menuPanel = qs(".nds-dropmenu-menu", menu);
      closeInlineDropmenu(menu, trigger, menuPanel);
    });
  }

  function scrollAdminInlineMenuIntoView(menuPanel) {
    var scrollParent = menuPanel ? menuPanel.closest("[data-pages-editor], [data-projects-editor]") : null;
    if (!scrollParent) return;
    requestAnimationFrame(function () {
      var menuRect = menuPanel.getBoundingClientRect();
      var parentRect = scrollParent.getBoundingClientRect();
      var offset = 12;
      if (menuRect.bottom > parentRect.bottom - offset) {
        scrollParent.scrollTop += menuRect.bottom - parentRect.bottom + offset;
      } else if (menuRect.top < parentRect.top + offset) {
        scrollParent.scrollTop -= parentRect.top - menuRect.top + offset;
      }
    });
  }

  function toggleIconTypeMenu(trigger) {
    toggleInlineDropmenu(trigger, "[data-icon-type-menu]");
  }

  function selectIconType(optionButton) {
    var menu = optionButton.closest("[data-icon-type-menu]");
    if (!menu) return;
    var selected = getIconOption(optionButton.dataset.iconTypeOption);
    var input = qs('[data-field$="IconType"]', menu);
    var label = qs("[data-icon-type-label]", menu);
    var trigger = qs("[data-icon-type-trigger]", menu);
    var existingIcon = trigger ? qs(".contact-icon", trigger) : null;
    if (input) input.value = selected.value;
    if (label) label.textContent = selected.label;
    if (existingIcon) existingIcon.outerHTML = adminContactIcon(selected.value);
    qsa("[data-icon-type-option]", menu).forEach(function (item) {
      item.dataset.state = item === optionButton ? "selected" : "";
    });
    if (input) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closeIconTypeMenus();
  }

  function closeOptionMenus(exceptMenu) {
    qsa("[data-option-menu]").forEach(function (menu) {
      if (menu === exceptMenu) return;
      var trigger = qs("[data-option-trigger]", menu);
      var menuPanel = qs(".nds-dropmenu-menu", menu);
      closeInlineDropmenu(menu, trigger, menuPanel);
    });
  }

  function toggleOptionMenu(trigger) {
    toggleInlineDropmenu(trigger, "[data-option-menu]");
  }

  function selectOptionValue(optionButton) {
    var menu = optionButton.closest("[data-option-menu]");
    if (!menu) return;
    var options = window.PAGE_CONTENT_MODES || [];
    var selected = getOption(optionButton.dataset.optionValue, options);
    var input = qs('[data-field="pageContentMode"]', menu);
    var label = qs("[data-option-label]", menu);
    var trigger = qs("[data-option-trigger]", menu);
    var existingIcon = trigger ? qs(".admin-option-icon", trigger) : null;
    if (input) input.value = selected.value;
    if (label) label.textContent = selected.label;
    if (existingIcon) existingIcon.outerHTML = adminOptionIcon(selected.value);
    qsa("[data-option-value]", menu).forEach(function (item) {
      item.dataset.state = item === optionButton ? "selected" : "";
    });
    if (input) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    syncPageContentEditorMode(optionButton.closest("[data-page-index]"));
    closeOptionMenus();
  }

  function closeSelectMenus(exceptMenu) {
    qsa("[data-select-menu]").forEach(function (menu) {
      if (menu === exceptMenu) return;
      var trigger = qs("[data-select-trigger]", menu);
      var menuPanel = qs(".nds-dropmenu-menu", menu);
      closeInlineDropmenu(menu, trigger, menuPanel);
    });
  }

  function closeAdminInlineDropmenus(exceptMenu) {
    closeIconTypeMenus(exceptMenu);
    closeOptionMenus(exceptMenu);
    closeSelectMenus(exceptMenu);
  }

  function toggleSelectMenu(trigger) {
    toggleInlineDropmenu(trigger, "[data-select-menu]");
  }

  function selectDropmenuValue(optionButton) {
    var menu = optionButton.closest("[data-select-menu]");
    if (!menu) return;
    var input = qs("[data-field]", menu);
    var label = qs("[data-select-label]", menu);
    var trigger = qs("[data-select-trigger]", menu);
    if (input) input.value = optionButton.dataset.selectValue || "";
    if (label) label.textContent = (optionButton.textContent || "").trim();
    qsa("[data-select-value]", menu).forEach(function (item) {
      item.dataset.state = item === optionButton ? "selected" : "";
    });
    if (input) input.dispatchEvent(new Event("change", { bubbles: true }));
    if (input && /^(footerLink|footerColumnLink|footerIconLink|footerBottomLink|footerLogo)Page$/.test(input.dataset.field || "")) syncFooterLinkFromPage(menu);
    if (trigger) trigger.dispatchEvent(new Event("change", { bubbles: true }));
    closeSelectMenus();
    if (input && input.dataset.field === "integrationType" && menu.closest("[data-integration-index]")) {
      captureOpenEditorAccordions(qs("[data-integrations-editor]"));
      collectIntegrations({ keepDrafts: true });
      renderIntegrationsEditor();
    }
  }

  function isLoggedIn() {
    return Boolean(window.SiteStore && window.SiteStore.currentUser && window.SiteStore.currentUser());
  }

  function showDashboard(show) {
    var dashboard = qs("[data-admin-dashboard]");
    if (dashboard) dashboard.hidden = !show;
  }

  function headToDashboard() {
    var title = qs("[data-admin-dashboard-title]");
    if (!title) return;
    title.setAttribute("tabindex", "-1");
    title.focus({ preventScroll: true });
    title.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initDashboard() {
    if (dashboardReady) return;
    dashboardReady = true;
    setupAdminSidemenuPeekDelay();
    setupTabs();
    setupEvents();
    setupDragSort();
    applyPermissionVisibility();
    refreshAdminSidemenuComponents();
    fillForms();
    if (hasPermission("users")) loadAdminUsers();
  }

  function setupAuth() {
    window.SiteStore.me().then(function () {
      if (isLoggedIn()) {
        showDashboard(true);
        initDashboard();
        return;
      }

      showDashboard(false);
      if (window.SiteApp && window.SiteApp.openLoginModal) {
        window.SiteApp.openLoginModal({ redirectToAdmin: false });
      }
    });
    window.addEventListener("site:admin-login-success", function () {
      showDashboard(true);
      initDashboard();
      headToDashboard();
    });
    window.addEventListener("site:admin-logout", function () {
      showDashboard(false);
      window.location.href = "index.html";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupAuth();
  });
})();
