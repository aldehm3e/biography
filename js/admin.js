(function () {
  "use strict";

  var data;
  var dashboardReady = false;
  var pendingOpenEditor = { hero: null, page: null };
  var activeDragItem = null;
  var activeSortableRoot = null;

  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function field(name) { return qs('[name="' + name + '"]'); }
  function value(name) { var input = field(name); return input ? input.value.trim() : ""; }
  function setValue(name, text) { var input = field(name); if (input) input.value = text || ""; }
  function toast(message) { if (window.SiteApp) window.SiteApp.toast(message); }

  function refreshPublicShell() {
    window.dispatchEvent(new CustomEvent("site:datachange"));
  }

  function addAdminNotification(options) {
    if (window.SiteApp && window.SiteApp.addNotification) {
      window.SiteApp.addNotification(options);
    }
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
    data = window.SiteStore.load();

    setValue("siteName", data.settings.siteName);
    setValue("homeLabel", data.navigation.homeLabel);
    setValue("projectsLabel", data.navigation.projectsLabel);
    setValue("adminLabel", data.navigation.adminLabel);

    setValue("ownerName", data.home.ownerName);
    setValue("title", data.home.title);
    setValue("intro", data.home.intro);
    setValue("avatar", data.home.avatar);
    setValue("biography", data.home.biography);
    setValue("skills", (data.home.skills || []).join("\n"));
    setValue("experience", formatItems(data.home.experience || []));
    setValue("achievements", formatItems(data.home.achievements || []));

    renderHeroSlidesEditor();
    renderContactsEditor();
    renderProjectsEditor();
    renderPagesEditor();
  }

  function saveNavigation(event) {
    event.preventDefault();
    data.settings.siteName = value("siteName");
    data.navigation.homeLabel = value("homeLabel") || "الرئيسية";
    data.navigation.projectsLabel = value("projectsLabel") || "المشاريع";
    data.navigation.adminLabel = value("adminLabel") || "الإدارة";
    data = window.SiteStore.save(data);
    toast("تم حفظ إعدادات التنقل");
  }

  function saveHome(event) {
    event.preventDefault();
    data.home.ownerName = value("ownerName");
    data.home.title = value("title");
    data.home.intro = value("intro");
    data.home.avatar = value("avatar");
    data.home.biography = value("biography");
    data.home.heroSlides = collectHeroSlides();
    data.home.skills = value("skills").split(/\n+/).map(function (item) { return item.trim(); }).filter(Boolean);
    data.home.experience = parseLines(value("experience"), function (parts) {
      return parts.length ? { title: parts[0] || "", meta: parts[1] || "", description: parts.slice(2).join(" | ") || "" } : null;
    });
    data.home.achievements = parseLines(value("achievements"), function (parts) {
      return parts.length ? { title: parts[0] || "", meta: parts[1] || "", description: parts.slice(2).join(" | ") || "" } : null;
    });
    data.home.contacts = collectContacts();
    data = window.SiteStore.save(data);
    addAdminNotification({
      status: "success",
      tag: "تحديث",
      title: "تم تحديث الصفحة الرئيسية",
      description: "تم حفظ محتوى السيرة أو الهيرو أو التواصل أو الملف الشخصي من لوحة الإدارة.",
      href: "index.html"
    });
    toast("تم حفظ محتوى الصفحة الرئيسية");
  }

  function inputHtml(key, label, value, info) {
    return [
      '<div class="nds-form-container">',
      '<div class="nds-form-header"><label><span class="nds-label">' + safeText(label) + '</span>' + (info ? '<span class="nds-info">' + safeText(info) + '</span>' : '') + '</label></div>',
      '<div class="nds-form-control"><input class="nds-input" data-field="' + safeText(key) + '" type="text" value="' + safeText(value) + '"></div>',
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
    var title = slide.video || slide.image || slide.alt || "وسائط هيرو";
    var isOpen = pendingOpenEditor.hero === index;
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="hero" data-state="' + (isOpen ? "open" : "closed") + '" data-hero-slide-index="' + index + '">',
      '<div class="admin-template-header sortable-editor-header">',
      dragHandleHtml("اسحب لتغيير ترتيب وسائط الهيرو"),
      '<button class="editor-accordion-btn nds-btn nds-subtle" type="button" data-editor-toggle aria-expanded="' + (isOpen ? "true" : "false") + '" aria-controls="' + panelId + '">',
      '<span class="nds-card-title">' + safeText(title) + '</span>',
      '<i class="nds-icon nds-hgi-arrow-down-01 editor-accordion-arrow" aria-hidden="true"></i>',
      '</button>',
      adminDeleteButton("data-delete-hero-slide", index, "حذف وسائط الهيرو"),
      '</div>',
      '<div class="admin-template-body" id="' + panelId + '">',
      '<div class="form-grid">',
      inputHtml("heroImage", "مسار الصورة أو صورة غلاف الفيديو", slide.image, "مثال: assets/images/hero.jpg"),
      inputHtml("heroMobileImage", "مسار صورة الجوال أو غلاف الجوال اختياري", slide.mobileImage, "اتركه فارغا لاستخدام نفس الصورة"),
      inputHtml("heroVideo", "مسار الفيديو اختياري", slide.video, "مثال: assets/video/hero.webm"),
      inputHtml("heroMobileVideo", "مسار فيديو الجوال اختياري", slide.mobileVideo, "اتركه فارغا لاستخدام نفس الفيديو"),
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
      root.append(window.SiteApp.emptyState("لا توجد صور هيرو", "استخدم زر إضافة صورة هيرو لإنشاء السلايدر."));
    }
  }

  function collectHeroSlides() {
    return qsa("[data-hero-slide-index]").map(function (item) {
      return {
        image: qs('[data-field="heroImage"]', item).value.trim(),
        mobileImage: qs('[data-field="heroMobileImage"]', item).value.trim(),
        video: qs('[data-field="heroVideo"]', item).value.trim(),
        mobileVideo: qs('[data-field="heroMobileVideo"]', item).value.trim(),
        alt: qs('[data-field="heroAlt"]', item).value.trim(),
        visible: qs("[data-hero-slide-visible]", item).checked
      };
    }).filter(function (slide) {
      return slide.image || slide.mobileImage || slide.video || slide.mobileVideo || slide.alt;
    });
  }

  function contactTemplate(contact, index) {
    var label = contact.label || "وسيلة تواصل";
    var panelId = "contact-panel-" + index;
    return [
      '<article class="editor-item contact-editor-item nds-card nds-stroke" data-contact-index="' + index + '">',
      '<div class="contact-accordion-header">',
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
      inputHtml("contactIconPath", "مسار شعار مخصص اختياري", contact.iconPath),
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
    root.innerHTML = data.home.contacts.map(contactTemplate).join("");
    if (!data.home.contacts.length) {
      root.append(window.SiteApp.emptyState("لا توجد وسائل تواصل", "استخدم زر إضافة وسيلة لإنشاء رابط تواصل."));
    }
  }

  function projectTemplate(project, index) {
    var panelId = "project-panel-" + index;
    var title = project.title || "مشروع";
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-project-index="' + index + '">',
      '<div class="nds-card-content compact-card-content">',
      '<div class="editor-item-head">',
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
      inputHtml("projectStatus", "الحالة", project.status),
      inputHtml("projectDate", "التاريخ", project.date),
      inputHtml("projectCategory", "التصنيف", project.category),
      '</div>',
      inputHtml("projectImage", "مسار الصورة أو الأيقونة", project.image),
      inputHtml("projectUrl", "رابط تصفح المشروع", project.url, "مثال: https://example.com"),
      textareaHtml("projectDescription", "الوصف", project.description, 4),
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
    root.innerHTML = data.projects.map(projectTemplate).join("");
    if (!data.projects.length) {
      root.append(window.SiteApp.emptyState("لا توجد مشاريع", "استخدم زر إضافة مشروع لإنشاء بطاقة جديدة."));
    }
  }

  function pageTemplate(page, index) {
    var mode = page.contentMode || "text";
    var panelId = "page-panel-" + index;
    var title = page.title || "صفحة إضافية";
    var isOpen = pendingOpenEditor.page === index;
    return [
      '<article class="editor-item compact-editor-item admin-template-item nds-card nds-stroke" data-sortable-item="page" data-page-index="' + index + '">',
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
      linkedin: '<path d="M6.9 8.8H3.7v10.5h3.2V8.8ZM5.3 4.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Zm13 9.3c0-3.1-1.7-4.8-4.1-4.8-1.8 0-2.7 1-3.1 1.7V8.8H8v10.5h3.2v-5.7c0-1.5.8-2.4 2-2.4s2 .9 2 2.5v5.6h3.2v-5.9Z"/>',
      github: '<path d="M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.9-4.7 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A9.3 9.3 0 0 0 12 2.8Z"/>',
      x: '<path d="M15 10.8 21 4h-1.4l-5.2 5.9L10.2 4H5.4l6.3 8.9L5.4 20h1.4l5.5-6.2 4.4 6.2h4.8L15 10.8Zm-1.9 2.1-.6-.9-5.1-6.9h2.1l4.1 5.5.6.9 5.3 7.3h-2.1l-4.3-5.9Z"/>',
      email: '<path d="M4.8 6h14.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H4.8c-1 0-1.8-.8-1.8-1.8V7.8C3 6.8 3.8 6 4.8 6Zm7.2 6.4 7-4.7H5l7 4.7Zm-7.2 3.8h14.4V9.5l-7.2 4.8-7.2-4.8v6.7Z"/>',
      website: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm6.6 8h-3.1a14 14 0 0 0-1.2-5 7.1 7.1 0 0 1 4.3 5ZM12 5.1c.8 1.1 1.4 3.1 1.6 5.9h-3.2c.2-2.8.8-4.8 1.6-5.9ZM5.1 13h3.3c.1 2 .5 3.8 1.2 5.1A7.1 7.1 0 0 1 5.1 13Zm3.3-2H5.1a7.1 7.1 0 0 1 4.5-5c-.7 1.3-1.1 3-1.2 5Zm3.6 7.9c-.8-1.1-1.4-3.1-1.6-5.9h3.2c-.2 2.8-.8 4.8-1.6 5.9Zm2.3-.8c.7-1.3 1.1-3.1 1.2-5.1h3.4a7.1 7.1 0 0 1-4.6 5.1Zm1.2-7.1c-.1-2-.5-3.7-1.2-5a7.1 7.1 0 0 1 4.5 5h-3.3Z"/>',
      phone: '<path d="M7.2 4h3l1.4 4.2-2 1.2c.9 1.8 2.3 3.2 4.1 4.1l1.2-2 4.2 1.4v3c0 1.2-1 2.1-2.2 2.1A12.9 12.9 0 0 1 5 6.2C5 5 6 4 7.2 4Z"/>'
    };
    return '<span class="contact-icon contact-icon-' + safeText(type || "website") + '" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' + (icons[type] || icons.website) + '</svg></span>';
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

  function collectProjects() {
    data.projects = qsa("[data-project-index]").map(function (item) {
      return {
        title: qs('[data-field="projectTitle"]', item).value.trim(),
        status: qs('[data-field="projectStatus"]', item).value.trim(),
        date: qs('[data-field="projectDate"]', item).value.trim(),
        category: qs('[data-field="projectCategory"]', item).value.trim(),
        image: qs('[data-field="projectImage"]', item).value.trim(),
        url: qs('[data-field="projectUrl"]', item).value.trim(),
        description: qs('[data-field="projectDescription"]', item).value.trim()
      };
    }).filter(function (project) {
      return project.title || project.description || project.category || project.status || project.date || project.image || project.url;
    });
  }

  function collectContacts() {
    return qsa("[data-contact-index]").map(function (item) {
      return {
        id: "contact-" + Date.now() + "-" + item.dataset.contactIndex,
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
    var previousCount = (data.projects || []).length;
    collectProjects();
    data = window.SiteStore.save(data);
    renderProjectsEditor();
    addAdminNotification({
      status: "success",
      tag: data.projects.length > previousCount ? "جديد" : "تحديث",
      title: data.projects.length > previousCount ? "تمت إضافة مشروع جديد" : "تم تحديث المشاريع",
      description: data.projects.length > previousCount ? "تمت إضافة مشروع جديد من لوحة الإدارة." : "تم تحديث محتوى المشاريع من لوحة الإدارة.",
      href: "projects.html"
    });
    toast("تم حفظ المشاريع");
  }

  function savePages() {
    var previousCount = (data.pages || []).length;
    collectPages();
    data = window.SiteStore.save(data);
    renderPagesEditor();
    refreshPublicShell();
    addAdminNotification({
      status: "info",
      tag: data.pages.length > previousCount ? "جديد" : "تحديث",
      title: data.pages.length > previousCount ? "تمت إضافة صفحة جديدة" : "تم تحديث الصفحات",
      description: data.pages.length > previousCount ? "تمت إضافة صفحة جديدة من لوحة الإدارة." : "تم تحديث محتوى الصفحات أو ظهورها في التنقل من لوحة الإدارة.",
      href: "pages.html"
    });
    toast("تم حفظ الصفحات");
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
      data = window.SiteStore.save(data);
      renderHeroSlidesEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب سلايدر الهيرو");
    } else if (root.dataset.sortableList === "pages") {
      collectPages();
      data = window.SiteStore.save(data);
      renderPagesEditor();
      refreshPublicShell();
      toast("تم تحديث ترتيب الصفحات");
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

  function setupEvents() {
    qs("[data-navigation-form]").addEventListener("submit", saveNavigation);
    qs("[data-home-form]").addEventListener("submit", saveHome);
    qs("[data-save-projects]").addEventListener("click", saveProjects);
    qs("[data-save-pages]").addEventListener("click", savePages);

    qs("[data-add-hero-slide]").addEventListener("click", function () {
      data.home.heroSlides = collectHeroSlides();
      data.home.heroSlides.unshift({ image: "", mobileImage: "", video: "", mobileVideo: "", alt: "", visible: true });
      pendingOpenEditor.hero = 0;
      renderHeroSlidesEditor();
    });

    qs("[data-add-project]").addEventListener("click", function () {
      collectProjects();
      data.projects.push({ title: "", description: "", status: "", date: "", category: "", image: "", url: "" });
      renderProjectsEditor();
    });

    qs("[data-add-contact]").addEventListener("click", function () {
      data.home.contacts = collectContacts();
      data.home.contacts.push({ id: "", label: "", url: "", iconType: "website", iconPath: "", visible: true });
      renderContactsEditor();
    });

    qs("[data-add-page]").addEventListener("click", function () {
      collectPages();
      data.pages.unshift({ title: "", slug: "", content: "", contentMode: "text", visible: true });
      pendingOpenEditor.page = 0;
      renderPagesEditor();
    });

    document.addEventListener("click", function (event) {
      var deleteHeroSlide = event.target.closest("[data-delete-hero-slide]");
      var deleteProject = event.target.closest("[data-delete-project]");
      var deletePage = event.target.closest("[data-delete-page]");
      var deleteContact = event.target.closest("[data-delete-contact]");
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
        data = window.SiteStore.save(data);
        renderHeroSlidesEditor();
        toast("تم حذف صورة الهيرو");
      }
      if (deleteContact) {
        data.home.contacts = collectContacts();
        data.home.contacts.splice(Number(deleteContact.dataset.deleteContact), 1);
        data = window.SiteStore.save(data);
        renderContactsEditor();
        toast("تم حذف وسيلة التواصل");
      }
      if (deleteProject) {
        collectProjects();
        data.projects.splice(Number(deleteProject.dataset.deleteProject), 1);
        data = window.SiteStore.save(data);
        renderProjectsEditor();
        toast("تم حذف المشروع");
      }
      if (deletePage) {
        collectPages();
        data.pages.splice(getSortableItemIndex(deletePage.closest("[data-page-index]")), 1);
        data = window.SiteStore.save(data);
        renderPagesEditor();
        refreshPublicShell();
        toast("تم حذف الصفحة");
      }
    });

    document.addEventListener("change", function (event) {
      if (!event.target.matches("[data-page-visible]")) return;
      collectPages();
      data = window.SiteStore.save(data);
      refreshPublicShell();
      toast(event.target.checked ? "تم إظهار الصفحة في التنقل" : "تم إخفاء الصفحة من التنقل");
    });

    qs("[data-export-json]").addEventListener("click", function () {
      var json = window.SiteStore.exportJson();
      setValue("jsonBox", json);
      var blob = new Blob([json], { type: "application/json" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "site-content.json";
      link.click();
      URL.revokeObjectURL(link.href);
      toast("تم تجهيز ملف التصدير");
    });

    qs("[data-import-json]").addEventListener("click", function () {
      var json = value("jsonBox");
      if (!json) { toast("ضع محتوى JSON أولا"); return; }
      try {
        data = window.SiteStore.importJson(json);
        fillForms();
        toast("تم استيراد البيانات");
      } catch (error) {
        toast("ملف JSON غير صالح");
      }
    });

    qs("[data-reset-content]").addEventListener("click", function () {
      if (!confirm("هل تريد إعادة تعيين كل المحتوى المحلي؟")) return;
      data = window.SiteStore.reset();
      fillForms();
      setValue("jsonBox", "");
      toast("تمت إعادة التعيين");
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
    return sessionStorage.getItem(window.ADMIN_AUTH_CONFIG.sessionKey) === "true";
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
    var logout = qs("[data-logout]");
    if (logout) {
      logout.addEventListener("click", function () {
        sessionStorage.removeItem(window.ADMIN_AUTH_CONFIG.sessionKey);
        showDashboard(false);
        toast("تم تسجيل الخروج");
        window.location.href = "index.html";
      });
    }

    if (isLoggedIn()) {
      showDashboard(true);
      initDashboard();
      return;
    }

    showDashboard(false);
    if (window.SiteApp && window.SiteApp.openLoginModal) {
      window.SiteApp.openLoginModal({ redirectToAdmin: false });
    }
    window.addEventListener("site:admin-login-success", function () {
      showDashboard(true);
      initDashboard();
      headToDashboard();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupAuth();
  });
})();
