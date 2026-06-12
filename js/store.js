(function () {
  "use strict";

  var DATA_KEY = "websiteDemo:siteData";
  var PREVIEW_KEY = "websiteDemo:previewData";
  var AUTH_USER_KEY = "websiteDemo:currentUser";
  var API = {
    getSite: "api/content/get-site.php",
    saveSite: "api/content/save-site.php",
    captcha: "api/auth/captcha.php",
    login: "api/auth/login.php",
    logout: "api/auth/logout.php",
    me: "api/auth/me.php",
    changePassword: "api/auth/change-password.php",
    changeEmail: "api/auth/change-email.php",
    changePhone: "api/auth/change-phone.php",
    uploadMedia: "api/upload/upload-media.php",
    listMedia: "api/upload/list-media.php",
    deleteMedia: "api/upload/delete-media.php",
    listUsers: "api/auth/list-users.php",
    saveUser: "api/auth/save-user.php",
    deleteUser: "api/auth/delete-user.php",
    saveFeedback: "api/feedback/save.php",
    listFeedback: "api/feedback/list.php",
    exportFeedback: "api/feedback/export.php",
    importFeedback: "api/feedback/import.php"
  };

  var currentData = null;
  var currentUser = readCachedUser();
  var activeLoad = null;
  var legacyLocalData = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeObject(base, saved) {
    var output = clone(base);
    if (!saved || typeof saved !== "object") return output;

    Object.keys(saved).forEach(function (key) {
      if (Array.isArray(saved[key])) {
        output[key] = saved[key];
        return;
      }
      if (saved[key] && typeof saved[key] === "object") {
        output[key] = mergeObject(output[key] || {}, saved[key]);
        return;
      }
      output[key] = saved[key];
    });

    return output;
  }

  function readLocal() {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Unable to read cached site data.", error);
      return null;
    }
  }

  function writeLocal(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Unable to cache site data.", error);
    }
  }

  function readCachedUser() {
    try {
      var raw = sessionStorage.getItem(AUTH_USER_KEY);
      var user = raw ? JSON.parse(raw) : null;
      return user && typeof user === "object" ? user : null;
    } catch (error) {
      return null;
    }
  }

  function writeCachedUser(user) {
    try {
      if (user) {
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (error) {}
  }

  function notify(data) {
    window.dispatchEvent(new CustomEvent("site:datachange", { detail: clone(data) }));
  }

  function normalize(data) {
    var cleanData = mergeObject(window.DEFAULT_SITE_DATA || {}, data || {});
    cleanData.settings = cleanData.settings || {};
    cleanData.settings.pageFeedback = normalizePageFeedback(cleanData.settings.pageFeedback);
    cleanData.settings.notificationSettings = normalizeNotificationSettings(cleanData.settings.notificationSettings);
    cleanData.settings.comingSoon = normalizeComingSoon(cleanData.settings.comingSoon);
    cleanData.navigation = cleanData.navigation || {};
    cleanData.home = cleanData.home || {};
    cleanData.home.heroSlides = normalizeArray(cleanData.home.heroSlides);
    cleanData.home.numbers = cleanData.home.numbers && typeof cleanData.home.numbers === "object" ? cleanData.home.numbers : {};
    cleanData.home.numbers.title = cleanData.home.numbers.title || "في أرقام";
    cleanData.home.numbers.subtitle = cleanData.home.numbers.subtitle || "";
    cleanData.home.numbers.cards = normalizeArray(cleanData.home.numbers.cards);
    cleanData.home.regionMap = normalizeSaudiRegionMap(cleanData.home.regionMap);
    cleanData.home.experience = normalizeArray(cleanData.home.experience);
    cleanData.home.achievements = normalizeArray(cleanData.home.achievements);
    cleanData.home.skills = normalizeArray(cleanData.home.skills);
    cleanData.home.contacts = normalizeArray(cleanData.home.contacts);
    cleanData.home.footerLinks = normalizeArray(cleanData.home.footerLinks);
    cleanData.footer = normalizeFooter(cleanData.footer);
    cleanData.projects = normalizeArray(cleanData.projects);
    cleanData.cardCollections = normalizeArray(cleanData.cardCollections).map(function (collection) {
      collection = collection && typeof collection === "object" ? collection : {};
      collection.cards = normalizeArray(collection.cards);
      return collection;
    });
    cleanData.pages = normalizeArray(cleanData.pages);
    cleanData.integrations = normalizeArray(cleanData.integrations);
    cleanData.notifications = normalizeArray(cleanData.notifications);
    return cleanData;
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function saudiMapRegions() {
    return normalizeArray(window.SAUDI_MAP_REGIONS);
  }

  function cleanMapNumber(value) {
    var text = String(value == null ? "" : value).replace(/[^\d.]/g, "");
    if (!text) return "";
    var firstDot = text.indexOf(".");
    if (firstDot !== -1) {
      text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, "");
    }
    return text || "";
  }

  function normalizeHgiIcon(value) {
    var text = String(value || "").trim();
    var match = text.match(/\bhgi-[a-z0-9-]+\b/i);
    return match ? match[0] : "hgi-chart-up";
  }

  function normalizeSaudiRegionMap(input) {
    var map = input && typeof input === "object" ? input : {};
    var regions = saudiMapRegions();
    var sourceItems = normalizeArray(map.regions);
    var regionDefs = regions.length ? regions : sourceItems.map(function (item) {
      return {
        id: Number(item && (item.regionId || item.id)),
        population: item && item.value
      };
    }).filter(function (item) {
      return item.id;
    });
    var values = {};
    sourceItems.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var id = Number(item.regionId || item.id);
      if (!id) return;
      values[id] = cleanMapNumber(item.value);
    });
    return {
      visible: map.visible === true,
      title: String(map.title || ""),
      subtitle: String(map.subtitle || ""),
      metricLabel: String(map.metricLabel || map.valueLabel || ""),
      metricIcon: normalizeHgiIcon(map.metricIcon || map.valueIcon || map.icon || ""),
      regions: regionDefs.map(function (region) {
        var id = Number(region.id);
        return {
          regionId: id,
          value: values[id] != null ? values[id] : ""
        };
      })
    };
  }

  function normalizePageFeedback(value) {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.settings && window.DEFAULT_SITE_DATA.settings.pageFeedback || {};
    var output = mergeObject(defaults, value && typeof value === "object" ? value : {});
    [
      "question",
      "yesLabel",
      "noLabel",
      "yesReasonsLabel",
      "noReasonsLabel",
      "yesOptions",
      "noOptions",
      "commentLabel",
      "commentPlaceholder",
      "agreementText",
      "submitLabel",
      "closeLabel",
      "successMessage",
      "errorMessage",
      "statisticsText"
    ].forEach(function (key) {
      output[key] = String(output[key] || "");
    });
    output.enabled = output.enabled !== false;
    return output;
  }

  function normalizeNotificationSettings(value) {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.settings && window.DEFAULT_SITE_DATA.settings.notificationSettings || {};
    var output = mergeObject(defaults, value && typeof value === "object" ? value : {});
    output.roles = mergeObject(defaults.roles || {}, output.roles && typeof output.roles === "object" ? output.roles : {});
    output.events = mergeObject(defaults.events || {}, output.events && typeof output.events === "object" ? output.events : {});
    output.pages = mergeObject(defaults.pages || {}, output.pages && typeof output.pages === "object" ? output.pages : {});
    output.popup = mergeObject(defaults.popup || {}, output.popup && typeof output.popup === "object" ? output.popup : {});
    output.enabled = output.enabled !== false;
    output.includeActor = output.includeActor !== false;
    output.maxItems = Math.max(5, Math.min(20, Number(output.maxItems) || 20));
    output.pages.mode = output.pages.mode === "selected" ? "selected" : "all";
    output.pages.slugs = normalizeArray(output.pages.slugs).map(function (slug) {
      return String(slug || "").trim();
    }).filter(Boolean);
    output.popup.enabled = output.popup.enabled === true;
    output.popup.audience = ["public", "employees", "all"].indexOf(output.popup.audience) !== -1 ? output.popup.audience : "public";
    ["title", "subject", "linkLabel", "linkUrl", "dismissLabel"].forEach(function (key) {
      output.popup[key] = String(output.popup[key] || "");
    });
    return output;
  }

  function normalizeComingSoon(value) {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.settings && window.DEFAULT_SITE_DATA.settings.comingSoon || {};
    var output = mergeObject(defaults, value && typeof value === "object" ? value : {});
    output.enabled = output.enabled === true;
    ["entityName", "title", "message", "heroImage", "logo"].forEach(function (key) {
      output[key] = String(output[key] || "");
    });
    output.title = output.title || "قريباً";
    output.message = output.message || "نعمل على تجهيز الموقع ليظهر بصورة تليق بكم.";
    output.heroImage = output.heroImage || "assets/images/hero1.jpg";
    output.logo = output.logo || "assets/images/saudi-tech.svg";
    return output;
  }

  function normalizeFooter(footer) {
    footer = footer && typeof footer === "object" ? footer : {};
    footer.columns = normalizeArray(footer.columns).map(function (column) {
      column = column && typeof column === "object" ? column : {};
      column.links = normalizeArray(column.links);
      return column;
    });
    footer.iconGroups = normalizeArray(footer.iconGroups).map(function (group) {
      group = group && typeof group === "object" ? group : {};
      group.links = normalizeArray(group.links);
      return group;
    });
    footer.bottomLinks = normalizeArray(footer.bottomLinks);
    footer.logos = normalizeArray(footer.logos);
    footer.cookies = mergeObject(
      window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.footer && window.DEFAULT_SITE_DATA.footer.cookies || {},
      footer.cookies || {}
    );
    footer.cookies.enabled = footer.cookies.enabled !== false;
    footer.cookies.linkPageSlugs = normalizeArray(footer.cookies.linkPageSlugs).map(function (slug) {
      return String(slug || "").trim();
    }).filter(Boolean);
    return footer;
  }

  function fallbackData() {
    return normalize(readLocal() || window.DEFAULT_SITE_DATA || {});
  }

  function requestJson(url, options) {
    options = options || {};
    options.credentials = "same-origin";
    options.headers = Object.assign({ "Accept": "application/json" }, options.headers || {});
    if (options.body && !(options.body instanceof FormData)) {
      options.headers["Content-Type"] = "application/json";
    }

    return fetch(url, options).then(function (response) {
      return response.json().catch(function () {
        return { success: false, message: "Invalid JSON response." };
      }).then(function (payload) {
        if (!response.ok || !payload.success) {
          var error = new Error(payload.message || "Request failed.");
          error.status = response.status;
          error.payload = payload;
          throw error;
        }
        return payload;
      });
    });
  }

  function uploadJson(url, formData, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.withCredentials = true;
      if (xhr.upload && typeof onProgress === "function") {
        xhr.upload.addEventListener("progress", function (event) {
          if (!event.lengthComputable) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        });
      }
      xhr.onload = function () {
        var payload;
        try {
          payload = JSON.parse(xhr.responseText || "{}");
        } catch (error) {
          payload = { success: false, message: "Invalid JSON response." };
        }
        if (xhr.status < 200 || xhr.status >= 300 || !payload.success) {
          var requestError = new Error(payload.message || "Request failed.");
          requestError.status = xhr.status;
          requestError.payload = payload;
          reject(requestError);
          return;
        }
        resolve(payload);
      };
      xhr.onerror = function () {
        reject(new Error("Request failed."));
      };
      xhr.send(formData);
    });
  }

  function setCurrent(data, shouldNotify) {
    currentData = normalize(data);
    writeLocal(currentData);
    if (shouldNotify) notify(currentData);
    return clone(currentData);
  }

  function load(force) {
    var previewData = readPreview();
    if (previewData) {
      currentData = normalize(previewData);
      return Promise.resolve(clone(currentData));
    }
    if (activeLoad && !force) return activeLoad.then(clone);
    activeLoad = requestJson(API.getSite)
      .then(function (payload) {
        return setCurrent(payload.data || {}, false);
      })
      .catch(function (error) {
        console.warn("Using cached/default site data because the API did not load.", error);
        currentData = fallbackData();
        return clone(currentData);
      })
      .finally(function () {
        activeLoad = null;
      });
    return activeLoad.then(clone);
  }

  function save(data) {
    var cleanData = normalize(data);
    return requestJson(API.saveSite, {
      method: "POST",
      body: JSON.stringify({ data: cleanData })
    }).then(function (payload) {
      return setCurrent(payload.data || cleanData, true);
    });
  }

  window.SiteStore = {
    load: load,

    current: function () {
      if (!currentData) currentData = fallbackData();
      return clone(currentData);
    },

    previewKey: PREVIEW_KEY,

    previewData: function (previewData) {
      return normalize(previewData || {});
    },

    save: save,

    reset: function () {
      localStorage.removeItem(DATA_KEY);
      return save(window.DEFAULT_SITE_DATA || {});
    },

    exportJson: function () {
      return load(true).then(function (data) {
        return JSON.stringify(data, null, 2);
      });
    },

    importJson: function (jsonText) {
      var parsed = JSON.parse(jsonText);
      var siteData = parsed && parsed.schema === "biography.site-backup" ? parsed.data : parsed;
      var feedbackRecords = parsed && parsed.schema === "biography.site-backup" && parsed.pageFeedback
        ? parsed.pageFeedback.records
        : null;
      return save(siteData).then(function (savedData) {
        if (!feedbackRecords || !window.SiteStore.importPageFeedback) return savedData;
        return window.SiteStore.importPageFeedback(feedbackRecords).then(function () {
          return savedData;
        });
      });
    },

    importLocalCache: function () {
      var cached = legacyLocalData || readLocal();
      if (!cached) return Promise.reject(new Error("No local cache was found."));
      return save(cached);
    },

    savePageFeedback: function (payload) {
      return requestJson(API.saveFeedback, {
        method: "POST",
        body: JSON.stringify(payload || {})
      });
    },

    listPageFeedback: function () {
      return requestJson(API.listFeedback).then(function (payload) {
        return payload.data || {};
      });
    },

    exportPageFeedback: function () {
      return requestJson(API.exportFeedback).then(function (payload) {
        return payload.data || { records: [] };
      });
    },

    importPageFeedback: function (records) {
      return requestJson(API.importFeedback, {
        method: "POST",
        body: JSON.stringify({ records: records || [] })
      }).then(function (payload) {
        return payload.data || {};
      });
    },

    me: function () {
      return requestJson(API.me)
        .then(function (payload) {
          currentUser = payload.authenticated ? (payload.user || null) : null;
          writeCachedUser(currentUser);
          return currentUser ? clone(currentUser) : null;
        })
        .catch(function () {
          currentUser = null;
          writeCachedUser(null);
          return null;
        });
    },

    currentUser: function () {
      return currentUser ? clone(currentUser) : null;
    },

    captcha: function () {
      return requestJson(API.captcha).then(function (payload) {
        return payload.captcha || null;
      });
    },

    login: function (email, password, captchaAnswer) {
      return requestJson(API.login, {
        method: "POST",
        body: JSON.stringify({ email: email, password: password, captchaAnswer: captchaAnswer })
      }).then(function (payload) {
        currentUser = payload.user || null;
        writeCachedUser(currentUser);
        window.dispatchEvent(new CustomEvent("site:authchange", { detail: { user: currentUser } }));
        return currentUser ? clone(currentUser) : null;
      });
    },

    logout: function () {
      return requestJson(API.logout, { method: "POST" }).catch(function () {
        return { success: true };
      }).then(function () {
        currentUser = null;
        writeCachedUser(null);
        window.dispatchEvent(new CustomEvent("site:authchange", { detail: { user: null } }));
        return true;
      });
    },

    changePassword: function (currentPassword, newPassword, confirmPassword) {
      return requestJson(API.changePassword, {
        method: "POST",
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword
        })
      });
    },

    changeEmail: function (newEmail, currentPassword) {
      return requestJson(API.changeEmail, {
        method: "POST",
        body: JSON.stringify({ newEmail: newEmail, currentPassword: currentPassword })
      }).then(function (payload) {
        currentUser = payload.user || currentUser;
        writeCachedUser(currentUser);
        window.dispatchEvent(new CustomEvent("site:authchange", { detail: { user: currentUser } }));
        return payload;
      });
    },

    changePhone: function (phone, currentPassword) {
      return requestJson(API.changePhone, {
        method: "POST",
        body: JSON.stringify({ phone: phone, currentPassword: currentPassword })
      }).then(function (payload) {
        currentUser = payload.user || currentUser;
        writeCachedUser(currentUser);
        window.dispatchEvent(new CustomEvent("site:authchange", { detail: { user: currentUser } }));
        return payload;
      });
    },

    uploadMedia: function (file, type, onProgress) {
      var formData = new FormData();
      formData.append("file", file);
      formData.append("type", type || "image");
      return uploadJson(API.uploadMedia, formData, onProgress);
    },

    listMedia: function (limit) {
      var suffix = limit ? ("?limit=" + encodeURIComponent(limit)) : "";
      return requestJson(API.listMedia + suffix).then(function (payload) {
        return payload.items || [];
      });
    },

    deleteMedia: function (id) {
      return requestJson(API.deleteMedia, {
        method: "POST",
        body: JSON.stringify({ id: id })
      });
    },

    listUsers: function () {
      return requestJson(API.listUsers).then(function (payload) {
        return {
          users: payload.users || [],
          permissions: payload.permissions || []
        };
      });
    },

    saveUser: function (user) {
      return requestJson(API.saveUser, {
        method: "POST",
        body: JSON.stringify(user || {})
      }).then(function (payload) {
        if (payload.user) {
          currentUser = payload.user;
          writeCachedUser(currentUser);
          window.dispatchEvent(new CustomEvent("site:authchange", { detail: { user: currentUser } }));
        }
        return payload.users || [];
      });
    },

    deleteUser: function (id) {
      return requestJson(API.deleteUser, {
        method: "POST",
        body: JSON.stringify({ id: id })
      }).then(function (payload) {
        return payload.users || [];
      });
    },

    clone: clone
  };

  function readPreview() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var previewId = params.get("preview");
      if (!previewId) return null;
      var raw = localStorage.getItem(PREVIEW_KEY);
      if (!raw) return null;
      var payload = JSON.parse(raw);
      if (!payload || payload.id !== previewId || !payload.data) return null;
      if (payload.expiresAt && Date.now() > Number(payload.expiresAt)) {
        localStorage.removeItem(PREVIEW_KEY);
        return null;
      }
      return payload.data;
    } catch (error) {
      console.warn("Unable to read preview data.", error);
      return null;
    }
  }

  legacyLocalData = readLocal();
})();
