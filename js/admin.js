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
  var adminUsers = [];
  var adminPermissions = [];
  var adminUsersLoaded = false;
  var MAX_FOOTER_COLUMNS = 3;
  var MAX_FOOTER_ICON_GROUPS = 2;
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
      return !permissionNode || !permissionNode.hidden;
    });
    return first ? first.dataset.adminTab : "account";
  }
  function clearNdsState(element) {
    if (!element) return;
    if (window.NDS && window.NDS.State && window.NDS.State.clear) {
      window.NDS.State.clear(element);
    } else {
      element.removeAttribute("data-state");
    }
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
  function setupAdminSidemenuToggle() {
    document.addEventListener("click", function (event) {
      var toggle = event.target.closest(".admin-sidemenu .nds-sidemenu-toggle");
      if (!toggle) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var menu = toggle.closest(".admin-sidemenu");
      var isOpen = menu && (menu.dataset.state || "").indexOf("open") !== -1;
      setAdminSidemenuOpen(!isOpen);
    }, true);
  }
  function activateAdminTab(target, scrollToPanel) {
    var button = qs('[data-admin-tab="' + target + '"]');
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
    var sidemenuLabel = qs(".admin-sidemenu .nds-sidemenu-toggle .nds-label");
    if (sidemenuLabel) sidemenuLabel.textContent = (button.textContent || "").trim();
    if (target === "users" && hasPermission("users")) loadAdminUsers();
    if (window.NDS && window.NDS.Sidemenu && window.NDS.Sidemenu.init) window.NDS.Sidemenu.init();
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

    renderHeroSlidesEditor();
    renderContentRowsEditor("experience");
    renderContentRowsEditor("achievements");
    renderSkillsEditor();
    renderFooterEditors();
    renderProjectsEditor();
    renderPagesEditor();
    renderIntegrationsEditor();
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
    saveData();
    toast("تم حفظ إعدادات التنقل");
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
  }

  function saveFooter(event) {
    event.preventDefault();
    if (!ensurePermission("footer")) return;
    collectFooterDraft();
    saveData().then(function () {
      refreshPublicShell();
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

  function uploadControlHtml(targetField, type) {
    var safeType = safeText(type || "image");
    return [
      '<div class="nds-form-container upload-inline-control">',
      '<div class="nds-form-header"><label><span class="nds-label">رفع ملف</span></label></div>',
      '<div class="nds-form-control" data-upload-label="' + safeText(uploadButtonLabel(type)) + '"><input class="nds-input file-input" type="file" data-media-upload="' + safeType + '" data-upload-target-field="' + safeText(targetField) + '"' + uploadAcceptAttribute(type) + '></div>',
      '</div>'
    ].join("");
  }

  function uploadableInputHtml(key, label, value, type, info) {
    var safeType = safeText(type || "image");
    var placeholder = info ? ' placeholder="' + safeText(info) + '"' : "";
    return [
      '<div class="nds-form-container uploadable-field">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="uploadable-control-row">',
      '<div class="nds-form-control upload-path-control"><input class="nds-input" data-field="' + safeText(key) + '" type="text" value="' + safeText(value) + '"' + placeholder + '></div>',
      '<div class="nds-form-control upload-file-control" data-upload-label="' + safeText(uploadButtonLabel(type)) + '"><input class="nds-input file-input" type="file" data-media-upload="' + safeType + '" data-upload-target-field="' + safeText(key) + '"' + uploadAcceptAttribute(type) + '></div>',
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
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="hero" data-editor-accordion-key="' + safeText(accordionKey) + '" data-state="' + (isOpen ? "open" : "closed") + '" data-hero-slide-index="' + index + '">',
      '<div class="admin-template-header sortable-editor-header">',
      dragHandleHtml("اسحب لتغيير ترتيب وسائط القسم الرئيسي"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      '</button>',
      adminDeleteButton("data-delete-hero-slide", index, "حذف وسائط القسم الرئيسي"),
      '</div>',
      '<div class="admin-template-body" id="' + panelId + '">',
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
      '<label class="check-line"><input type="checkbox" data-hero-slide-visible ' + (slide.visible === false ? "" : "checked") + '> <span>إظهار هذه الوسائط في السلايدر</span></label>',
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
      '<label class="check-line"><input type="checkbox" data-row-visible ' + (item.visible === false ? "" : "checked") + '> <span>إظهار العنصر</span></label>',
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
      item.dataset.editorAccordionKey = key;
      item.dataset.state = isOpen ? "open" : "closed";
      body.className = "editor-accordion-collapse nds-accordion-collapse";
      body.id = panelId;
      body.dataset.state = isOpen ? "open" : "";
      body.setAttribute("aria-hidden", String(!isOpen));
      content.className = "editor-accordion-content nds-accordion-content";
      inner.className = "compact-editor-body";
      while (head.nextSibling) inner.appendChild(head.nextSibling);
      content.appendChild(inner);
      body.appendChild(content);
      card.appendChild(body);
      button.className = "editor-accordion-btn nds-accordion-btn nds-btn nds-subtle";
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
      '<label class="check-line"><input type="checkbox" data-skill-visible ' + (visible ? "checked" : "") + '> <span>إظهار المهارة</span></label>',
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
      '<article class="editor-item contact-editor-item nds-card nds-stroke" data-sortable-item="contacts" data-contact-index="' + index + '" data-contact-id="' + safeText(contactId) + '">',
      '<div class="contact-accordion-header sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب وسيلة التواصل"),
      '<button class="contact-accordion-btn nds-accordion-btn nds-btn nds-subtle" type="button" data-contact-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="contact-accordion-title">' + safeText(label) + '</span>',
      '</button>',
      contactDeleteButton(index),
      '</div>',
      '<div class="contact-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="contact-accordion-content nds-accordion-content">',
      '<div class="contact-accordion-body nds-accordion-body">',
      '<div class="contact-form-grid">',
      inputHtml("contactLabel", "التسمية الاختيارية", contact.label),
      inputHtml("contactUrl", "الرابط", contact.url),
      iconTypeDropmenuHtml("contactIconType", "نوع الأيقونة", contact.iconType || "website"),
      uploadableInputHtml("contactIconPath", "مسار شعار مخصص اختياري", contact.iconPath, "contact-icon"),
      '</div>',
      '<label class="check-line"><input type="checkbox" data-contact-visible ' + (contact.visible === false ? "" : "checked") + '> <span>إظهار وسيلة التواصل</span></label>',
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
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="projects" data-editor-accordion-key="' + safeText(accordionKey) + '" data-project-index="' + index + '" data-project-id="' + safeText(projectId) + '" data-state="' + (isOpen ? "open" : "closed") + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب المشروع"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      '</button>',
      adminDeleteButton("data-delete-project", index, "حذف المشروع"),
      '</div>',
      '<div class="editor-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="editor-accordion-content nds-accordion-content">',
      '<div class="form-grid">',
      inputHtml("projectTitle", "عنوان المشروع", project.title),
      inputHtml("projectSlug", "الرابط المختصر", project.slug),
      inputHtml("projectStatus", "الحالة", project.status),
      inputHtml("projectDate", "التاريخ", project.date),
      inputHtml("projectCategory", "التصنيف", project.category),
      '</div>',
      uploadableInputHtml("projectImage", "مسار الصورة أو الأيقونة", project.image, "project-image"),
      inputHtml("projectUrl", "رابط تصفح المشروع", project.url, "مثال: https://example.com"),
      textareaHtml("projectDescription", "الوصف", project.description, 4),
      '<label class="check-line"><input type="checkbox" data-project-visible ' + (project.visible === false ? "" : "checked") + '> <span>إظهار المشروع</span></label>',
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
    var isOpen = pendingOpenEditor.page === index || openEditorAccordions.has(accordionKey);
    if (isOpen) openEditorAccordions.add(accordionKey);
    var isChild = hasAdminText(page.parentSlug);
    var childEntries = children || [];
    var childCount = childEntries.length;
    var isNavigationGroup = !isChild && childCount > 0;
    var showInNavigation = isChild ? false : (page.showInFooter && page.visible === false ? false : page.showInNavigation !== false);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="page" data-editor-accordion-key="' + safeText(accordionKey) + '" data-page-index="' + index + '" data-page-id="' + safeText(pageId) + '" data-page-original-slug="' + safeText(slugify(page.slug || page.title)) + '" data-page-is-child="' + (isChild ? "true" : "false") + '" data-page-is-group="' + (isNavigationGroup ? "true" : "false") + '" data-state="' + (isOpen ? "open" : "closed") + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("اسحب لتغيير ترتيب الصفحات"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="page-editor-heading">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
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
      '<label class="check-line"><input type="checkbox" data-page-visible ' + (page.visible ? "checked" : "") + '> <span>نشر الصفحة</span></label>',
      '<label class="check-line"><input type="checkbox" data-page-navigation-link ' + (showInNavigation ? "checked" : "") + '> <span>إظهار في الهيدر</span></label>',
      '<label class="check-line"><input type="checkbox" data-page-footer-link ' + (page.showInFooter ? "checked" : "") + '> <span>رابط تذييل</span></label>',
      '</div>',
      textareaHtml("pageContent", "محتوى الصفحة", page.content, 10, "اكتب نصا عاديا أو اختر HTML والصق الكود كاملا. سيتم عرضه داخل حاوية منسقة."),
      isChild ? '' : pageChildrenSectionHtml(page, pageId, childEntries),
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
      '<section class="page-children-section" data-page-children-section data-editor-accordion-key="' + safeText(childrenKey) + '" data-state="' + (isOpen ? "open" : "closed") + '" aria-label="الصفحات الفرعية">',
      '<div class="page-children-head">',
      '<button class="nds-btn nds-subtle page-children-toggle" type="button" data-page-children-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + safeText(panelId) + '">',
      '<i class="nds-icon nds-hgi-arrow-down-01" aria-hidden="true"></i>',
      '<span class="page-children-title-row">',
      '<span class="section-minor-title">الصفحات الفرعية</span>',
      '<span class="nds-tag nds-sm"><span class="nds-label">' + children.length + ' صفحة</span></span>',
      '</span>',
      '</button>',
      '<button class="nds-btn nds-secondary-outline nds-sm page-add-subpage-btn" type="button" data-add-subpage="' + safeText(pageId) + '" aria-label="إضافة صفحة فرعية تحت ' + safeText(pageTitle) + '" title="إضافة صفحة فرعية">',
      '<i class="nds-icon nds-hgi-plus-sign" aria-hidden="true"></i>',
      '<span class="nds-label">إضافة صفحة فرعية</span>',
      '</button>',
      '</div>',
      '<div class="page-children-collapse" id="' + safeText(panelId) + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="page-children-collapse-content">',
      '<div class="editor-list compact-editor-list page-children-list" data-sortable-list="pages">',
      children.length ? children.map(function (entry) { return pageTemplate(entry.page, entry.index, []); }).join("") : '<div class="page-children-empty">لا توجد صفحات فرعية لهذه الصفحة.</div>',
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
      '<svg class="contact-delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
      '<path d="M9 4h6l.8 2H20v2H4V6h4.2L9 4Zm-2 6h10l-.6 9.2c-.1 1-1 1.8-2 1.8H9.6c-1 0-1.9-.8-2-1.8L7 10Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/>',
      '</svg>',
      '<span class="nds-label sr-only">حذف</span>',
      '</button>'
    ].join("");
  }

  function adminDeleteButton(attributeName, index, label) {
    return [
      '<button class="contact-delete-btn admin-template-delete nds-btn nds-subtle nds-destructive nds-icon-only" type="button" ' + attributeName + '="' + index + '" aria-label="' + safeText(label || "حذف") + '" title="' + safeText(label || "حذف") + '">',
      '<svg class="contact-delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
      '<path d="M9 4h6l.8 2H20v2H4V6h4.2L9 4Zm-2 6h10l-.6 9.2c-.1 1-1 1.8-2 1.8H9.6c-1 0-1.9-.8-2-1.8L7 10Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/>',
      '</svg>',
      '<span class="nds-label sr-only">' + safeText(label || "حذف") + '</span>',
      '</button>'
    ].join("");
  }

  function collectProjects(options) {
    var keepDrafts = options && options.keepDrafts;
    data.projects = qsa("[data-project-index]").map(function (item) {
      return {
        id: item.dataset.projectId || newEntityId("project"),
        title: qs('[data-field="projectTitle"]', item).value.trim(),
        slug: slugify(qs('[data-field="projectSlug"]', item).value.trim() || qs('[data-field="projectTitle"]', item).value.trim()),
        status: qs('[data-field="projectStatus"]', item).value.trim(),
        date: qs('[data-field="projectDate"]', item).value.trim(),
        category: qs('[data-field="projectCategory"]', item).value.trim(),
        image: qs('[data-field="projectImage"]', item).value.trim(),
        url: qs('[data-field="projectUrl"]', item).value.trim(),
        description: qs('[data-field="projectDescription"]', item).value.trim(),
        visible: qs("[data-project-visible]", item).checked
      };
    }).filter(function (project) {
      return keepDrafts || project.title || project.description || project.category || project.status || project.date || project.image || project.url;
    });
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
      '<label class="check-line"><input type="checkbox" data-footer-managed-link-visible ' + (link.visible === false ? "" : "checked") + '> <span>إظهار الرابط</span></label>',
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
      '<label class="check-line"><input type="checkbox" data-footer-column-visible ' + (column.visible === false ? "" : "checked") + '> <span>إظهار العمود</span></label>',
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
      '<label class="check-line"><input type="checkbox" data-footer-icon-group-visible ' + (group.visible === false ? "" : "checked") + '> <span>إظهار المجموعة</span></label>',
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
      '<label class="check-line"><input type="checkbox" data-footer-logo-visible ' + (logo.visible === false ? "" : "checked") + '> <span>إظهار الشعار</span></label>',
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
      '<label class="check-line"><input type="checkbox" data-footer-link-visible ' + (link.visible === false ? "" : "checked") + '> <span>إظهار الرابط في التذييل</span></label>',
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
      return {
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
        content: qs('[data-field="pageContent"]', item).value.trim()
      };
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
      showInFooter: false
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
    childCount = (data.pages || []).filter(function (candidate) {
      return slugify(candidate.parentSlug) === pageSlug;
    }).length;
    confirmAdminDeleteThen(childCount ? "هل تريد حذف هذه الصفحة؟ سيتم نقل صفحاتها الفرعية إلى المستوى الرئيسي." : "هل تريد حذف هذه الصفحة؟", function () {
      data.pages.splice(index, 1);
      if (pageSlug) {
        data.pages.forEach(function (candidate) {
          if (slugify(candidate.parentSlug) === pageSlug) candidate.parentSlug = "";
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
    return integration.name || integration.provider || "تكامل";
  }

  function integrationTemplate(integration, index) {
    var integrationId = ensureEntityId(integration, "integration");
    var panelId = "integration-panel-" + index;
    var accordionKey = "integrations:" + integrationId;
    var isOpen = openEditorAccordions.has(accordionKey);
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="integrations" data-editor-accordion-key="' + safeText(accordionKey) + '" data-integration-index="' + index + '" data-integration-id="' + safeText(integrationId) + '" data-state="' + (isOpen ? "open" : "closed") + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب التكامل"),
      '<button class="editor-accordion-btn nds-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle data-state="' + (isOpen ? "open" : "") + '" aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(integrationLabel(integration)) + '</span>',
      '</button>',
      adminDeleteButton("data-delete-integration", index, "حذف التكامل"),
      '</div>',
      '<div class="editor-accordion-collapse nds-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open" aria-hidden="false"' : ' aria-hidden="true"') + '>',
      '<div class="editor-accordion-content nds-accordion-content">',
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
      textareaHtml("integrationConfigJson", "إعدادات عامة JSON", integration.configJson, 4, "استخدمها للإعدادات العامة فقط"),
      '<label class="check-line"><input type="checkbox" data-integration-enabled ' + (integration.enabled === false ? "" : "checked") + '> <span>تفعيل التكامل</span></label>',
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
    data.integrations = qsa("[data-integration-index]").map(function (item) {
      return {
        id: item.dataset.integrationId || newEntityId("integration"),
        type: qs('[data-field="integrationType"]', item).value,
        name: qs('[data-field="integrationName"]', item).value.trim(),
        provider: qs('[data-field="integrationProvider"]', item).value.trim(),
        environment: qs('[data-field="integrationEnvironment"]', item).value,
        endpointUrl: qs('[data-field="integrationEndpointUrl"]', item).value.trim(),
        webhookUrl: qs('[data-field="integrationWebhookUrl"]', item).value.trim(),
        publicKey: qs('[data-field="integrationPublicKey"]', item).value.trim(),
        secretEnvKey: qs('[data-field="integrationSecretEnvKey"]', item).value.trim(),
        configJson: qs('[data-field="integrationConfigJson"]', item).value.trim(),
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
        '<input id="' + inputId + '" type="checkbox" data-user-permission="' + safeText(permission) + '" ' + (checked ? "checked" : "") + (isOwner ? " disabled" : "") + '>',
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
      '<article class="editor-item admin-user-item nds-accordion nds-card nds-stroke admin-user-accordion" data-admin-user-index="' + index + '" data-admin-user-id="' + safeText(user.id || "") + '">',
      '<div class="nds-accordion-item">',
      '<h3 class="nds-accordion-header admin-user-accordion-header">',
      '<button class="nds-accordion-btn nds-btn nds-subtle" type="button" aria-expanded="false" aria-controls="' + panelId + '">',
      '<span class="nds-accordion-title">' + safeText(userTitle(user)) + '</span>',
      '<span class="nds-tag nds-xs" data-status="' + (user.active === false ? "warning" : "success") + '"><span class="nds-label">' + safeText(roleLabel(user.role || "employee")) + '</span></span>',
      '</button>',
      isSelf ? '' : '<button class="contact-delete-btn admin-user-delete-btn nds-btn nds-subtle nds-destructive nds-icon-only" type="button" data-delete-admin-user="' + safeText(user.id || "") + '" aria-label="حذف الموظف" title="حذف الموظف"><svg class="contact-delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4h6l.8 2H20v2H4V6h4.2L9 4Zm-2 6h10l-.6 9.2c-.1 1-1 1.8-2 1.8H9.6c-1 0-1.9-.8-2-1.8L7 10Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/></svg><span class="nds-label sr-only">حذف الموظف</span></button>',
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
      '<input id="' + activeInputId + '" type="checkbox" data-user-active ' + (user.active === false ? "" : "checked") + (isSelf ? " disabled" : "") + '>',
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
      collectProjects();
      saveData();
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
        activateAdminTab(button.dataset.adminTab, true);
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

  function ensureUploadProgress(input) {
    var root = input.closest(".uploadable-field, .nds-form-container, .editor-item, form") || input.parentElement;
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

  function setUploadControlState(input, status, label) {
    var control = uploadControl(input);
    if (!control) return;
    if (!control.dataset.defaultUploadLabel) {
      control.dataset.defaultUploadLabel = control.dataset.uploadLabel || defaultUploadLabel(input);
    }
    control.dataset.uploadLabel = label || control.dataset.defaultUploadLabel;
    if (status) {
      control.dataset.uploadStatus = status;
    } else {
      control.removeAttribute("data-upload-status");
    }
    if (!input.getAttribute("aria-label")) input.setAttribute("aria-label", control.dataset.defaultUploadLabel);
  }

  function resetUploadControlState(input, delay) {
    window.setTimeout(function () {
      setUploadControlState(input, "", defaultUploadLabel(input));
    }, delay || 0);
  }

  function prepareUploadControls(root) {
    qsa(".nds-form-control > .file-input", root || document).forEach(function (input) {
      setUploadControlState(input, "", defaultUploadLabel(input));
    });
  }

  function setupUploadEvents() {
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
        resetUploadControlState(input, uploadSucceeded ? 1600 : 2600);
      });
    });
  }

  function setupEvents() {
    if (qs("[data-settings-form]")) qs("[data-settings-form]").addEventListener("submit", saveSettings);
    qs("[data-navigation-form]").addEventListener("submit", saveNavigation);
    qs("[data-home-form]").addEventListener("submit", saveHome);
    if (qs("[data-footer-form]")) qs("[data-footer-form]").addEventListener("submit", saveFooter);
    qs("[data-save-projects]").addEventListener("click", saveProjects);
    qs("[data-save-pages]").addEventListener("click", savePages);
    if (qs("[data-save-integrations]")) qs("[data-save-integrations]").addEventListener("click", saveIntegrations);
    qsa("[data-preview-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        openPreview(button.dataset.previewTarget || "home");
      });
    });
    setupUploadEvents();

    qs("[data-add-hero-slide]").addEventListener("click", function () {
      data.home.heroSlides = collectHeroSlides({ keepDrafts: true });
      data.home.heroSlides.unshift({ title: "", subtitle: "", intro: "", image: "", mobileImage: "", video: "", mobileVideo: "", alt: "", visible: true });
      pendingOpenEditor.hero = 0;
      renderHeroSlidesEditor();
    });

    qs("[data-add-project]").addEventListener("click", function () {
      collectProjects({ keepDrafts: true });
      data.projects.push({ id: newEntityId("project"), title: "", slug: "", description: "", status: "", date: "", category: "", image: "", url: "", visible: true });
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
      collectPages();
      page = { id: newEntityId("page"), title: "صفحة جديدة", slug: "page-" + Date.now(), parentSlug: "", content: "", contentMode: "text", image: "", video: "", visible: true, showInNavigation: true, showInFooter: false };
      data.pages.unshift(page);
      pendingOpenEditor.page = 0;
      renderPagesEditor();
      saveData();
    });

    if (qs("[data-add-integration]")) qs("[data-add-integration]").addEventListener("click", function () {
      if (!ensurePermission("integrations")) return;
      collectIntegrations({ keepDrafts: true });
      data.integrations.unshift({
        id: newEntityId("integration"),
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
          collectProjects();
          data.projects.splice(Number(deleteProject.dataset.deleteProject), 1);
          saveData();
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

    qs("[data-export-json]").addEventListener("click", function () {
      window.SiteStore.exportJson().then(function (json) {
        setValue("jsonBox", json);
        var blob = new Blob([json], { type: "application/json" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "site-content.json";
        link.click();
        URL.revokeObjectURL(link.href);
        toast("تم تجهيز ملف التصدير");
      }).catch(function (error) {
        toast(error.message || "تعذر التصدير", "error");
      });
    });

    qs("[data-import-json]").addEventListener("click", function () {
      var json = value("jsonBox");
      if (!json) { toast("ضع محتوى JSON أولا"); return; }
      try {
        window.SiteStore.importJson(json).then(function (importedData) {
          data = importedData;
          fillForms();
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
        fillForms();
        toast("تم نقل بيانات localStorage إلى قاعدة البيانات");
      }).catch(function (error) {
        toast(error.message || "لا توجد بيانات محلية للنقل", "error");
      });
    });

    qs("[data-reset-content]").addEventListener("click", function () {
      confirmAdminDeleteThen("هل تريد إعادة تعيين كل المحتوى؟ سيتم حذف التعديلات الحالية.", function () {
        window.SiteStore.reset().then(function (resetData) {
          data = resetData;
          fillForms();
          setValue("jsonBox", "");
          toast("تمت إعادة التعيين");
        }).catch(function (error) {
          toast(error.message || "تعذر إعادة التعيين", "error");
        });
      });
    });

    qs("[data-json-file]").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { setValue("jsonBox", String(reader.result || "")); };
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

  function closeIconTypeMenus(exceptMenu) {
    qsa("[data-icon-type-menu]").forEach(function (menu) {
      if (menu === exceptMenu) return;
      var trigger = qs("[data-icon-type-trigger]", menu);
      var menuPanel = qs(".nds-dropmenu-menu", menu);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menuPanel) {
        menuPanel.hidden = true;
        menuPanel.setAttribute("aria-hidden", "true");
        menuPanel.dataset.state = "";
      }
      menu.dataset.state = "";
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
    var menu = trigger.closest("[data-icon-type-menu]");
    var menuPanel = menu ? qs(".nds-dropmenu-menu", menu) : null;
    if (!menuPanel) return;
    var willOpen = menuPanel.hidden;
    closeAdminInlineDropmenus(menu);
    menuPanel.hidden = !willOpen;
    menuPanel.setAttribute("aria-hidden", String(!willOpen));
    menuPanel.dataset.state = willOpen ? "open" : "";
    menu.dataset.state = willOpen ? "open" : "";
    trigger.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) scrollAdminInlineMenuIntoView(menuPanel);
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
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menuPanel) {
        menuPanel.hidden = true;
        menuPanel.setAttribute("aria-hidden", "true");
        menuPanel.dataset.state = "";
      }
      menu.dataset.state = "";
    });
  }

  function toggleOptionMenu(trigger) {
    var menu = trigger.closest("[data-option-menu]");
    var menuPanel = menu ? qs(".nds-dropmenu-menu", menu) : null;
    if (!menuPanel) return;
    var willOpen = menuPanel.hidden;
    closeAdminInlineDropmenus(menu);
    menuPanel.hidden = !willOpen;
    menuPanel.setAttribute("aria-hidden", String(!willOpen));
    menuPanel.dataset.state = willOpen ? "open" : "";
    menu.dataset.state = willOpen ? "open" : "";
    trigger.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) scrollAdminInlineMenuIntoView(menuPanel);
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
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menuPanel) {
        menuPanel.hidden = true;
        menuPanel.setAttribute("aria-hidden", "true");
        menuPanel.dataset.state = "";
      }
      menu.dataset.state = "";
    });
  }

  function closeAdminInlineDropmenus(exceptMenu) {
    closeIconTypeMenus(exceptMenu);
    closeOptionMenus(exceptMenu);
    closeSelectMenus(exceptMenu);
  }

  function toggleSelectMenu(trigger) {
    var menu = trigger.closest("[data-select-menu]");
    var menuPanel = menu ? qs(".nds-dropmenu-menu", menu) : null;
    if (!menuPanel) return;
    var willOpen = menuPanel.hidden;
    closeAdminInlineDropmenus(menu);
    menuPanel.hidden = !willOpen;
    menuPanel.setAttribute("aria-hidden", String(!willOpen));
    menuPanel.dataset.state = willOpen ? "open" : "";
    menu.dataset.state = willOpen ? "open" : "";
    trigger.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) scrollAdminInlineMenuIntoView(menuPanel);
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
    setupAdminSidemenuToggle();
    setupTabs();
    setupEvents();
    setupDragSort();
    applyPermissionVisibility();
    if (window.NDS && window.NDS.Sidemenu && window.NDS.Sidemenu.init) window.NDS.Sidemenu.init();
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
