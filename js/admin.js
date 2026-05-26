(function () {
  "use strict";

  var data;
  var dashboardReady = false;
  var pendingOpenEditor = { hero: null, page: null };
  var activeDragItem = null;
  var activeSortableRoot = null;
  var lastSavedSignature = "";
  var pendingSaveSignature = "";
  var lastSavedSnapshot = null;

  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function field(name) { return qs('[name="' + name + '"]'); }
  function value(name) { var input = field(name); return input ? input.value.trim() : ""; }
  function setValue(name, text) { var input = field(name); if (input) input.value = text || ""; }
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
    return Boolean(page && page.visible === true && page.title && page.content);
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
    return [page.title || "", page.slug || "", page.contentMode || "text", page.content || ""].join("\u001f");
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
      description: "تم حفظ محتوى السيرة أو القسم الرئيسي أو التواصل أو الملف الشخصي من لوحة الإدارة.",
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
    setValue("siteName", data.settings.siteName);
    setValue("siteNameNav", data.settings.siteName);
    setValue("brandName", data.settings.brandName);
    setValue("brandSlogan", data.settings.brandSlogan);
    setValue("brandLogo", data.settings.brandLogo);
    setValue("settingsPhone", data.settings.phoneNumber);
    setValue("settingsEmail", data.settings.email);
    setValue("siteLanguage", data.settings.language);
    setValue("siteDirection", data.settings.direction);
    setValue("siteTheme", data.settings.theme);
    setValue("homeLabel", data.navigation.homeLabel);
    setValue("pagesLabel", data.navigation.pagesLabel);
    setValue("projectsLabel", data.navigation.projectsLabel);
    setValue("adminLabel", data.navigation.adminLabel);

    setValue("ownerName", data.home.ownerName);
    setValue("title", data.home.title);
    setValue("intro", data.home.intro);
    setValue("avatar", data.home.avatar);
    setValue("biography", data.home.biography);
    setValue("heroTitle", data.home.heroTitle);
    setValue("heroSubtitle", data.home.heroSubtitle);
    setValue("heroIntro", data.home.heroIntro);
    setValue("heroImage", data.home.heroImage);
    setValue("heroVideo", data.home.heroVideo);
    setValue("skills", (data.home.skills || []).map(function (item) { return typeof item === "string" ? item : item.name; }).join("\n"));
    setValue("experience", formatItems(data.home.experience || []));
    setValue("achievements", formatItems(data.home.achievements || []));

    renderHeroSlidesEditor();
    renderContentRowsEditor("experience");
    renderContentRowsEditor("achievements");
    renderSkillsEditor();
    renderContactsEditor();
    renderProjectsEditor();
    renderPagesEditor();
    prepareUploadControls();
    rememberLoadedEditorState();
  }

  function rememberLoadedEditorState() {
    collectHomeDraft();
    collectProjects();
    collectPages();
    rememberSavedData();
  }

  function saveSettings(event) {
    event.preventDefault();
    data.settings.siteName = value("siteName");
    data.navigation.pagesLabel = value("pagesLabel") || data.navigation.pagesLabel || "الصفحات";
    data.settings.brandName = value("brandName");
    data.settings.brandSlogan = value("brandSlogan");
    data.settings.brandLogo = value("brandLogo");
    data.settings.phoneNumber = value("settingsPhone");
    data.settings.email = value("settingsEmail");
    data.settings.language = value("siteLanguage") || "ar";
    data.settings.direction = value("siteDirection") || "rtl";
    data.settings.theme = value("siteTheme") || data.settings.theme || "light";
    saveData().then(function () {
      toast("تم حفظ إعدادات الموقع");
    });
  }

  function saveNavigation(event) {
    event.preventDefault();
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
    data.home.heroTitle = value("heroTitle");
    data.home.heroSubtitle = value("heroSubtitle");
    data.home.heroIntro = value("heroIntro");
    data.home.heroImage = value("heroImage");
    data.home.heroVideo = value("heroVideo");
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
    data.home.contacts = collectContacts();
  }

  function saveHome(event) {
    event.preventDefault();
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
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span>' + (info ? '<span class="nds-info">' + safeText(info) + '</span>' : '') + '</label></div>',
      '<div class="nds-form-control"><input class="nds-input" data-field="' + safeText(key) + '" type="text" value="' + safeText(value) + '"></div>',
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
    return [
      '<div class="nds-form-container uploadable-field">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span>' + (info ? '<span class="nds-info">' + safeText(info) + '</span>' : '') + '</label></div>',
      '<div class="uploadable-control-row">',
      '<div class="nds-form-control upload-path-control"><input class="nds-input" data-field="' + safeText(key) + '" type="text" value="' + safeText(value) + '"></div>',
      '<div class="nds-form-control upload-file-control" data-upload-label="' + safeText(uploadButtonLabel(type)) + '"><input class="nds-input file-input" type="file" data-media-upload="' + safeType + '" data-upload-target-field="' + safeText(key) + '"' + uploadAcceptAttribute(type) + '></div>',
      '</div>',
      uploadProgressHtml(),
      '</div>'
    ].join("");
  }

  function textareaHtml(key, label, value, rows, info) {
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span>' + (info ? '<span class="nds-info">' + safeText(info) + '</span>' : '') + '</label></div>',
      '<div class="nds-form-control textarea-control"><textarea class="nds-input" data-field="' + safeText(key) + '" rows="' + rows + '">' + safeText(value) + '</textarea></div>',
      '</div>'
    ].join("");
  }

  function selectHtml(key, label, value, options) {
    var items = options.map(function (option) {
      return '<option value="' + safeText(option.value) + '" ' + (option.value === value ? 'selected' : '') + '>' + safeText(option.label) + '</option>';
    }).join("");
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-form-control select-control"><select class="nds-input nds-select" data-field="' + safeText(key) + '">' + items + '</select></div>',
      '</div>'
    ].join("");
  }

  function optionDropmenuHtml(key, label, value, options) {
    var selected = getOption(value, options);
    var items = (options || []).map(function (option) {
      return [
        '<button class="nds-btn nds-subtle nds-dropmenu-item icon-type-option option-type-option" type="button" data-option-value="' + safeText(option.value) + '">',
        adminOptionIcon(option.value),
        '<span class="nds-label">' + safeText(option.label) + '</span>',
        '</button>'
      ].join("");
    }).join("");
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-dropmenu icon-type-menu option-type-menu" data-option-menu>',
      '<button class="nds-btn nds-secondary-outline nds-dropmenu-trigger icon-type-trigger option-type-trigger" type="button" data-option-trigger aria-expanded="false">',
      adminOptionIcon(selected.value),
      '<span class="nds-label" data-option-label>' + safeText(selected.label) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 icon-type-arrow" aria-hidden="true"></i>',
      '</button>',
      '<input type="hidden" data-field="' + safeText(key) + '" value="' + safeText(selected.value) + '">',
      '<div class="nds-dropmenu-menu icon-type-options option-type-options" hidden>',
      '<div class="nds-dropmenu-scroll">',
      items,
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function heroSlideTemplate(slide, index) {
    var panelId = "hero-slide-panel-" + index;
    var title = slide.video || slide.image || slide.alt || "وسائط القسم الرئيسي";
    title = slide.title || title;
    var isOpen = pendingOpenEditor.hero === index;
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="hero" data-state="' + (isOpen ? "open" : "closed") + '" data-hero-slide-index="' + index + '">',
      '<div class="admin-template-header sortable-editor-header">',
      dragHandleHtml("اسحب لتغيير ترتيب وسائط القسم الرئيسي"),
      '<button class="editor-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 editor-accordion-arrow" aria-hidden="true"></i>',
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

  function collectHeroSlides() {
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
      return slide.title || slide.subtitle || slide.intro || slide.image || slide.mobileImage || slide.video || slide.mobileVideo || slide.alt;
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
      var body = document.createElement("div");
      var content = document.createElement("div");
      var inner = document.createElement("div");
      var button = document.createElement("button");
      var icon = document.createElement("i");
      body.className = "editor-accordion-collapse";
      body.id = panelId;
      content.className = "editor-accordion-content";
      inner.className = "compact-editor-body";
      while (head.nextSibling) inner.appendChild(head.nextSibling);
      content.appendChild(inner);
      body.appendChild(content);
      card.appendChild(body);
      button.className = "editor-accordion-btn nds-btn nds-subtle";
      button.type = "button";
      button.dataset.editorToggle = "";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", panelId);
      button.appendChild(title);
      icon.className = "nds-icon nds-hgi-arrow-down-01 editor-accordion-arrow";
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
      var deleteButton = qs("[data-delete-content-row], [data-delete-skill]", head);
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
    return [
      '<article class="editor-item contact-editor-item nds-card nds-stroke" data-sortable-item="contacts" data-contact-index="' + index + '">',
      '<div class="contact-accordion-header sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب وسيلة التواصل"),
      '<button class="contact-accordion-btn nds-btn nds-subtle" type="button" data-contact-toggle aria-expanded="false" aria-controls="' + panelId + '">',
      '<span class="contact-accordion-title">' + safeText(label) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 contact-accordion-arrow" aria-hidden="true"></i>',
      '</button>',
      contactDeleteButton(index),
      '</div>',
      '<div class="contact-accordion-collapse" id="' + panelId + '">',
      '<div class="contact-accordion-content">',
      '<div class="contact-accordion-body">',
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
    var title = project.title || "مشروع";
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="projects" data-project-index="' + index + '" data-project-id="' + safeText(projectId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("تغيير ترتيب المشروع"),
      '<button class="editor-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle aria-expanded="false" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 editor-accordion-arrow" aria-hidden="true"></i>',
      '</button>',
      adminDeleteButton("data-delete-project", index, "حذف المشروع"),
      '</div>',
      '<div class="editor-accordion-collapse" id="' + panelId + '">',
      '<div class="editor-accordion-content">',
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

  function pageTemplate(page, index) {
    var pageId = ensureEntityId(page, "page");
    var mode = page.contentMode || "text";
    var panelId = "page-panel-" + index;
    var title = page.title || "صفحة إضافية";
    var isOpen = pendingOpenEditor.page === index;
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="page" data-page-index="' + index + '" data-page-id="' + safeText(pageId) + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head sortable-editor-header">',
      dragHandleHtml("اسحب لتغيير ترتيب الصفحات"),
      '<button class="editor-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 editor-accordion-arrow" aria-hidden="true"></i>',
      '</button>',
      adminDeleteButton("data-delete-page", index, "حذف الصفحة"),
      '</div>',
      '<div class="editor-accordion-collapse" id="' + panelId + '"' + (isOpen ? ' data-state="open"' : '') + '>',
      '<div class="editor-accordion-content">',
      '<div class="form-grid">',
      inputHtml("pageTitle", "عنوان الصفحة", page.title),
      inputHtml("pageSlug", "الرابط المختصر", page.slug),
      optionDropmenuHtml("pageContentMode", "نوع المحتوى", mode, window.PAGE_CONTENT_MODES || []),
      '</div>',
      '<label class="check-line"><input type="checkbox" data-page-visible ' + (page.visible ? "checked" : "") + '> <span>إظهار الصفحة في التنقل</span></label>',
      textareaHtml("pageContent", "محتوى الصفحة", page.content, 10, "اكتب نصا عاديا أو اختر HTML والصق الكود كاملا. سيتم عرضه داخل حاوية منسقة."),
      '</div>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderPagesEditor() {
    var root = qs("[data-pages-editor]");
    if (!root) return;
    data.pages = data.pages || [];
    root.dataset.sortableList = "pages";
    root.innerHTML = data.pages.map(pageTemplate).join("");
    pendingOpenEditor.page = null;
    if (!data.pages.length) {
      root.append(window.SiteApp.emptyState("لا توجد صفحات إضافية", "استخدم زر إضافة صفحة لإنشاء صفحة جديدة."));
    }
  }

  function iconTypeDropmenuHtml(key, label, value) {
    var selected = getIconOption(value);
    var options = (window.CONTACT_ICON_OPTIONS || []).map(function (option) {
      return [
        '<button class="nds-btn nds-subtle nds-dropmenu-item icon-type-option" type="button" data-icon-type-option="' + safeText(option.value) + '">',
        adminContactIcon(option.value),
        '<span class="nds-label">' + safeText(option.label) + '</span>',
        '</button>'
      ].join("");
    }).join("");
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span></label></div>',
      '<div class="nds-dropmenu icon-type-menu" data-icon-type-menu>',
      '<button class="nds-btn nds-secondary-outline nds-dropmenu-trigger icon-type-trigger" type="button" data-icon-type-trigger aria-expanded="false">',
      adminContactIcon(selected.value),
      '<span class="nds-label" data-icon-type-label>' + safeText(selected.label) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 icon-type-arrow" aria-hidden="true"></i>',
      '</button>',
      '<input type="hidden" data-field="' + safeText(key) + '" value="' + safeText(selected.value) + '">',
      '<div class="nds-dropmenu-menu icon-type-options" hidden>',
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

  function adminOptionIcon(value) {
    var label = value === "html" ? "HTML" : "TXT";
    return '<span class="admin-option-icon" aria-hidden="true">' + safeText(label) + '</span>';
  }

  function adminContactIcon(type) {
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
        id: existing.id || "contact-" + Date.now() + "-" + item.dataset.contactIndex,
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

  function collectPages() {
    data.pages = qsa("[data-page-index]").map(function (item) {
      var title = qs('[data-field="pageTitle"]', item).value.trim();
      var slug = qs('[data-field="pageSlug"]', item).value.trim() || slugify(title);
      return {
        id: item.dataset.pageId || newEntityId("page"),
        title: title,
        slug: slugify(slug),
        visible: qs("[data-page-visible]", item).checked,
        contentMode: qs('[data-field="pageContentMode"]', item).value || "text",
        content: qs('[data-field="pageContent"]', item).value.trim()
      };
    }).filter(function (page) {
      return page.title || page.slug || page.content;
    });
  }

  function saveProjects() {
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
    return qsa("[data-sortable-item]:not(.is-dragging)", container).reduce(function (closest, child) {
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
      data.home.heroSlides = collectHeroSlides();
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
        var target = button.dataset.adminTab;
        var adminSection = qs(".admin-section");
        var navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nds-nav-height"), 10) || 72;
        qsa("[data-admin-tab]").forEach(function (item) { item.dataset.state = ""; });
        qsa("[data-admin-panel]").forEach(function (panel) { panel.hidden = panel.dataset.adminPanel !== target; });
        button.dataset.state = "selected";
        if (adminSection) {
          window.scrollTo({
            top: Math.max(0, adminSection.getBoundingClientRect().top + window.scrollY - navHeight - 16),
            behavior: "smooth"
          });
        }
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
    qs("[data-save-projects]").addEventListener("click", saveProjects);
    qs("[data-save-pages]").addEventListener("click", savePages);
    qsa("[data-preview-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        openPreview(button.dataset.previewTarget || "home");
      });
    });
    setupUploadEvents();

    qs("[data-add-hero-slide]").addEventListener("click", function () {
      data.home.heroSlides = collectHeroSlides();
      data.home.heroSlides.unshift({ title: "", subtitle: "", intro: "", image: "", mobileImage: "", video: "", mobileVideo: "", alt: "", visible: true });
      pendingOpenEditor.hero = 0;
      renderHeroSlidesEditor();
    });

    qs("[data-add-project]").addEventListener("click", function () {
      collectProjects({ keepDrafts: true });
      data.projects.push({ id: newEntityId("project"), title: "", slug: "", description: "", status: "", date: "", category: "", image: "", url: "", visible: true });
      renderProjectsEditor();
    });

    qs("[data-add-contact]").addEventListener("click", function () {
      data.home.contacts = collectContacts();
      data.home.contacts.push({ id: "", label: "", url: "", iconType: "website", iconPath: "", visible: true });
      renderContactsEditor();
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
      page = { id: newEntityId("page"), title: "صفحة جديدة", slug: "page-" + Date.now(), content: "", contentMode: "text", visible: true };
      data.pages.unshift(page);
      pendingOpenEditor.page = 0;
      renderPagesEditor();
      saveData();
    });

    document.addEventListener("click", function (event) {
      var deleteHeroSlide = event.target.closest("[data-delete-hero-slide]");
      var deleteProject = event.target.closest("[data-delete-project]");
      var deletePage = event.target.closest("[data-delete-page]");
      var deleteContact = event.target.closest("[data-delete-contact]");
      var deleteContentRow = event.target.closest("[data-delete-content-row]");
      var deleteSkill = event.target.closest("[data-delete-skill]");
      var contactToggle = event.target.closest("[data-contact-toggle]");
      var editorToggle = event.target.closest("[data-editor-toggle]");
      var iconTypeTrigger = event.target.closest("[data-icon-type-trigger]");
      var iconTypeOption = event.target.closest("[data-icon-type-option]");
      var optionTrigger = event.target.closest("[data-option-trigger]");
      var optionValue = event.target.closest("[data-option-value]");

      if (iconTypeTrigger) { toggleIconTypeMenu(iconTypeTrigger); return; }
      if (iconTypeOption) { selectIconType(iconTypeOption); return; }
      if (optionTrigger) { toggleOptionMenu(optionTrigger); return; }
      if (optionValue) { selectOptionValue(optionValue); return; }
      if (!event.target.closest("[data-icon-type-menu]")) closeIconTypeMenus();
      if (!event.target.closest("[data-option-menu]")) closeOptionMenus();
      if (contactToggle) toggleContactPanel(contactToggle);
      if (editorToggle) { toggleEditorPanel(editorToggle); return; }

      if (deleteHeroSlide) {
        data.home.heroSlides = collectHeroSlides();
        data.home.heroSlides.splice(getSortableItemIndex(deleteHeroSlide.closest("[data-hero-slide-index]")), 1);
        saveData();
        renderHeroSlidesEditor();
        toast("تم حذف وسائط القسم الرئيسي");
      }
      if (deleteContact) {
        data.home.contacts = collectContacts();
        data.home.contacts.splice(Number(deleteContact.dataset.deleteContact), 1);
        saveData();
        renderContactsEditor();
        toast("تم حذف وسيلة التواصل");
      }
      if (deleteProject) {
        collectProjects();
        data.projects.splice(Number(deleteProject.dataset.deleteProject), 1);
        saveData();
        renderProjectsEditor();
        toast("تم حذف المشروع");
      }
      if (deletePage) {
        collectPages();
        data.pages.splice(getSortableItemIndex(deletePage.closest("[data-page-index]")), 1);
        saveData();
        renderPagesEditor();
        refreshPublicShell();
        toast("تم حذف الصفحة");
      }
      if (deleteContentRow) {
        var rowItem = deleteContentRow.closest("[data-content-row-type]");
        var rowType = rowItem ? rowItem.dataset.contentRowType : "experience";
        data.home[rowType] = collectContentRows(rowType);
        data.home[rowType].splice(getSortableItemIndex(rowItem), 1);
        saveData();
        renderContentRowsEditor(rowType);
        toast("تم حذف العنصر");
      }
      if (deleteSkill) {
        data.home.skills = collectSkills();
        data.home.skills.splice(getSortableItemIndex(deleteSkill.closest("[data-skill-index]")), 1);
        saveData();
        renderSkillsEditor();
        toast("تم حذف المهارة");
      }
    });

    document.addEventListener("change", function (event) {
      if (!event.target.matches("[data-page-visible]")) return;
      collectPages();
      saveData();
      refreshPublicShell();
      toast(event.target.checked ? "تم إظهار الصفحة في التنقل" : "تم إخفاء الصفحة من التنقل");
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
      if (!confirm("هل تريد إعادة تعيين كل المحتوى؟")) return;
      window.SiteStore.reset().then(function (resetData) {
        data = resetData;
        fillForms();
        setValue("jsonBox", "");
        toast("تمت إعادة التعيين");
      }).catch(function (error) {
        toast(error.message || "تعذر إعادة التعيين", "error");
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
    var panel = qs("#" + button.getAttribute("aria-controls"));
    if (!panel) return;
    var isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    panel.dataset.state = isOpen ? "" : "open";
    button.dataset.state = isOpen ? "" : "open";
  }

  function toggleEditorPanel(button) {
    var panel = qs("#" + button.getAttribute("aria-controls"));
    var isOpen = button.getAttribute("aria-expanded") === "true";
    var heroItem = button.closest("[data-hero-slide-index]");
    if (heroItem) {
      button.setAttribute("aria-expanded", String(!isOpen));
      heroItem.dataset.state = isOpen ? "closed" : "open";
      button.dataset.state = isOpen ? "" : "open";
      return;
    }
    if (!panel) return;
    button.setAttribute("aria-expanded", String(!isOpen));
    panel.dataset.state = isOpen ? "" : "open";
    button.dataset.state = isOpen ? "" : "open";
  }

  function closeIconTypeMenus(exceptMenu) {
    qsa("[data-icon-type-menu]").forEach(function (menu) {
      if (menu === exceptMenu) return;
      var trigger = qs("[data-icon-type-trigger]", menu);
      var menuPanel = qs(".nds-dropmenu-menu", menu);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menuPanel) menuPanel.hidden = true;
    });
  }

  function toggleIconTypeMenu(trigger) {
    var menu = trigger.closest("[data-icon-type-menu]");
    var menuPanel = menu ? qs(".nds-dropmenu-menu", menu) : null;
    if (!menuPanel) return;
    var willOpen = menuPanel.hidden;
    closeIconTypeMenus(menu);
    menuPanel.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", String(willOpen));
  }

  function selectIconType(optionButton) {
    var menu = optionButton.closest("[data-icon-type-menu]");
    if (!menu) return;
    var selected = getIconOption(optionButton.dataset.iconTypeOption);
    var input = qs('[data-field="contactIconType"]', menu);
    var label = qs("[data-icon-type-label]", menu);
    var trigger = qs("[data-icon-type-trigger]", menu);
    var existingIcon = trigger ? qs(".contact-icon", trigger) : null;
    if (input) input.value = selected.value;
    if (label) label.textContent = selected.label;
    if (existingIcon) existingIcon.outerHTML = adminContactIcon(selected.value);
    closeIconTypeMenus();
  }

  function closeOptionMenus(exceptMenu) {
    qsa("[data-option-menu]").forEach(function (menu) {
      if (menu === exceptMenu) return;
      var trigger = qs("[data-option-trigger]", menu);
      var menuPanel = qs(".nds-dropmenu-menu", menu);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menuPanel) menuPanel.hidden = true;
    });
  }

  function toggleOptionMenu(trigger) {
    var menu = trigger.closest("[data-option-menu]");
    var menuPanel = menu ? qs(".nds-dropmenu-menu", menu) : null;
    if (!menuPanel) return;
    var willOpen = menuPanel.hidden;
    closeOptionMenus(menu);
    menuPanel.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", String(willOpen));
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
    closeOptionMenus();
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
    setupTabs();
    setupEvents();
    setupDragSort();
    fillForms();
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
