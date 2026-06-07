(function () {
  "use strict";

  var HERO_SLIDE_DURATION = 8500;
  var HOME_NUMBERS_SLIDE_DURATION = 6500;
  var HOME_NUMBERS_AUTOPLAY_RESUME_MS = 9000;
  var TOPBAR_SCROLL_TRIGGER_PX = 1;
  var TOPBAR_SCROLL_DELTA_PX = 6;
  var SITE_DATA_KEY = "websiteDemo:siteData";
  var LEGACY_NOTIFICATIONS_KEY = "websiteDemo:notifications";
  var NOTIFICATION_STATE_KEY = "websiteDemo:notificationState";
  var NOTIFICATIONS_KEEP_OPEN_KEY = "websiteDemo:notificationsKeepOpen";
  var NOTIFICATION_READ_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;
  var AUTH_LOADING_MIN_MS = 1200;
  var CARD_COLLECTION_PAGE_SIZE = 15;
  var HOME_TOP_NAVIGATION_KEY = "websiteDemo:homeTopNavigation";
  var notificationSaveQueue = Promise.resolve();
  var navPageDropdownTimers = new WeakMap();
  var headerMenuExclusivityObserver = null;
  var siteSearchRecognition = null;
  var siteSearchVoiceButton = null;
  var textInputClearObserver = null;
  var textInputClearQueued = false;
  var analyticsKnownIds = [];
  var analyticsConfiguredPageKeys = {};
  var analyticsScriptLoaded = false;
  var homeInitialTopGuardStarted = false;
  var homeTopPinReleaseToken = 0;
  var themeScrollReleaseToken = 0;
  var headerActionScrollReleaseToken = 0;
  var themeTransitionActive = false;
  var cityWeatherInitialized = false;

  var appState = {
    data: null,
    projectFilter: "all",
    heroIndex: 0,
    heroTimer: null,
    homeNumbersTimer: null,
    homeNumbersResumeTimer: null,
    homeNumbersSettleTimer: null,
    clockTimer: null,
    topbarScrollLastY: 0,
    topbarScrollFrame: null,
    topbarCollapsed: false
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setManualScrollRestoration() {
    try {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    } catch (error) {}
  }

  function installProjectBackdropAdapter() {
    if (!window.NDS || !window.NDS.State) return;
    if (window.NDS.Backdrop && window.NDS.Backdrop._siteBackdropAdapter) return;

    var NDS = window.NDS;
    var originalStateSet = NDS.State.set;
    var originalStateClear = NDS.State.clear;
    var backdropElement = null;
    var currentConfig = null;
    var isActive = false;
    var activeOwners = [];
    var scrollLocked = false;
    var mutedElements = [];
    var DEFAULT_OWNER = "__default__";
    var FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var SURFACE_SELECTOR = [
      '.nds-modal:not([hidden])[aria-hidden="false"]',
      '.nds-sidemenu[data-state~="open"], .nds-sidemenu[data-state~="opening"]',
      '.nds-collapse[data-state~="open"], .nds-collapse[data-state~="opening"]',
      '.nds-dropdown[data-state~="open"], .nds-dropdown[data-state~="opening"]',
      '.nav-pages-item[data-state~="open"], .nav-pages-item[data-state~="opening"]',
      '.nds-ipv-popup-overlay.nds-ipv-active',
      '[data-nds-backdrop-surface="true"]'
    ].join(", ");

    function hasOwn(object, key) {
      return Object.prototype.hasOwnProperty.call(object || {}, key);
    }

    function addStateToken(element, token) {
      if (!element) return;
      if (NDS.State && NDS.State.add) {
        NDS.State.add(element, token);
        return;
      }
      var tokens = (element.getAttribute("data-state") || "").split(/\s+/).filter(Boolean);
      if (tokens.indexOf(token) === -1) tokens.push(token);
      element.setAttribute("data-state", tokens.join(" "));
    }

    function removeStateToken(element, token) {
      if (!element) return;
      if (NDS.State && NDS.State.remove) {
        NDS.State.remove(element, token);
        return;
      }
      var tokens = (element.getAttribute("data-state") || "").split(/\s+/).filter(function (state) {
        return state && state !== token;
      });
      if (tokens.length) {
        element.setAttribute("data-state", tokens.join(" "));
      } else {
        element.removeAttribute("data-state");
      }
    }

    function rawScrollTop() {
      return Math.max(
        0,
        window.pageYOffset || window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
      );
    }

    function restoreScrollTop(scrollY) {
      scrollY = Math.max(0, Math.round(Number(scrollY) || 0));
      if (!scrollY) return;
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(function () {
        window.scrollTo(0, scrollY);
        window.requestAnimationFrame(function () {
          window.scrollTo(0, scrollY);
        });
      });
      window.setTimeout(function () { window.scrollTo(0, scrollY); }, 80);
      window.setTimeout(function () { window.scrollTo(0, scrollY); }, 220);
    }

    if (NDS.scrollLock && !NDS.scrollLock._siteStableScrollLock) {
      NDS.scrollLock.lock = function () {
        if (!document.body || document.body.style.top) return;
        var scrollY = rawScrollTop();
        document.body.dataset.ndsScrollLockY = String(scrollY);
        document.body.style.top = "-" + scrollY + "px";
      };
      NDS.scrollLock.unlock = function () {
        var lockedTop;
        var savedScrollY;
        var scrollY;
        if (!document.body) return;
        lockedTop = parseFloat(document.body.style.top || "");
        savedScrollY = parseFloat(document.body.dataset.ndsScrollLockY || "");
        scrollY = Number.isFinite(lockedTop) && lockedTop < 0
          ? Math.abs(lockedTop)
          : (Number.isFinite(savedScrollY) ? savedScrollY : 0);
        document.body.style.top = "";
        delete document.body.dataset.ndsScrollLockY;
        restoreScrollTop(scrollY);
      };
      NDS.scrollLock._siteStableScrollLock = true;
    }

    if (!NDS.State._siteBackdropBodySafe) {
      NDS.State.set = function (element) {
        var states = Array.prototype.slice.call(arguments, 1);
        if (element === document.body && states.length === 1 && states[0] === "backdrop") {
          addStateToken(element, "backdrop");
          return;
        }
        return originalStateSet.apply(NDS.State, arguments);
      };
      NDS.State.clear = function (element) {
        if (element === document.body) {
          removeStateToken(element, "backdrop");
          return;
        }
        return originalStateClear.apply(NDS.State, arguments);
      };
      NDS.State._siteBackdropBodySafe = true;
    }

    function initBackdrop() {
      if (backdropElement && backdropElement.isConnected) return;
      backdropElement = qs("[data-nds-backdrop]") || qs(".nds-backdrop");
      if (!backdropElement) {
        backdropElement = document.createElement("div");
        document.body.append(backdropElement);
      }
      backdropElement.classList.add("nds-backdrop");
      backdropElement.setAttribute("data-nds-backdrop", "true");
      backdropElement.setAttribute("aria-hidden", "true");
    }

    function normalizeElements(value) {
      if (!value) return [];
      if (typeof value === "string") return qsa(value);
      if (value.nodeType === 1) return document.contains(value) ? [value] : [];
      return Array.prototype.slice.call(value).filter(function (element) {
        return element && element.nodeType === 1 && document.contains(element);
      });
    }

    function activeSurfaceElements(config) {
      var explicit = normalizeElements(config && (config.surface || config.surfaces || config.target || config.targets));
      var discovered;
      if (isLightHeaderBackdrop(config)) {
        discovered = explicit.length ? [] : qsa([
          '.nds-collapse[data-state~="open"], .nds-collapse[data-state~="opening"]',
          '.site-header .nds-dropdown[data-state~="open"], .site-header .nds-dropdown[data-state~="opening"]',
          '.site-header .nav-pages-item[data-state~="open"], .site-header .nav-pages-item[data-state~="opening"]'
        ].join(", "), qs(".site-header") || document);
      } else {
        discovered = qsa(SURFACE_SELECTOR);
      }
      var surfaces = [];
      explicit.concat(discovered).forEach(function (element) {
        if (element !== backdropElement && surfaces.indexOf(element) === -1 && document.contains(element)) {
          surfaces.push(element);
        }
      });
      return surfaces;
    }

    function isInsideAny(element, surfaces) {
      return surfaces.some(function (surface) {
        return surface === element || surface.contains(element);
      });
    }

    function restoreMutedElements() {
      mutedElements.forEach(function (element) {
        if (!element || !element.dataset) return;
        if (element.dataset.ndsBackdropPrevInert === "true") {
          element.inert = true;
        } else {
          element.inert = false;
          element.removeAttribute("inert");
        }
        delete element.dataset.ndsBackdropPrevInert;
        delete element.dataset.ndsBackdropMuted;
      });
      mutedElements = [];
      qsa('[data-nds-backdrop-surface="true"]').forEach(function (element) {
        delete element.dataset.ndsBackdropSurface;
      });
    }

    function setBodyState(active, config) {
      if (!document.body) return;
      if (active) {
        addStateToken(document.body, "backdrop");
        document.body.dataset.ndsBackdropActive = "true";
        document.body.dataset.ndsBackdropOwner = activeOwners.map(function (entry) {
          return entry.owner;
        }).join(" ");
        if (config && config.context) {
          document.body.dataset.ndsBackdropContext = config.context;
        } else {
          delete document.body.dataset.ndsBackdropContext;
        }
        return;
      }
      removeStateToken(document.body, "backdrop");
      delete document.body.dataset.ndsBackdropActive;
      delete document.body.dataset.ndsBackdropOwner;
      delete document.body.dataset.ndsBackdropContext;
    }

    function syncScrollLock() {
      var shouldLock = activeOwners.some(function (entry) {
        return entry.config.preventScroll;
      });
      if (shouldLock && !scrollLocked && NDS.scrollLock && NDS.scrollLock.lock) {
        NDS.scrollLock.lock();
        scrollLocked = true;
      } else if (!shouldLock && scrollLocked && NDS.scrollLock && NDS.scrollLock.unlock) {
        NDS.scrollLock.unlock();
        scrollLocked = false;
      }
    }

    function inferOwner(config) {
      if (config && config.context) return config.context;
      if (config && Number(config.zIndex) >= 1800) return "modal";
      if (config && config.clickToClose === false && config.escapeClose === false) return "ipv";
      if (config && Number(config.zIndex) === 999) return "nav";
      if (hasOwn(config, "preventScroll")) return "sidemenu";
      return DEFAULT_OWNER;
    }

    function isLightHeaderBackdrop(config) {
      return Boolean(config && (config.context === "header" || config.owner === "nav" || config.owner === "site-header" || config.owner === "header"));
    }

    function normalizeConfig(config) {
      config = config || {};
      var explicitOwner = Boolean(config.owner || config.id);
      var owner = explicitOwner ? (config.owner || config.id) : inferOwner(config);
      var isSiteHeaderOwner = owner === "site-header" || owner === "header" || config.context === "header";
      var preventScroll = hasOwn(config, "preventScroll") ? config.preventScroll !== false : !isSiteHeaderOwner;
      return {
        owner: owner,
        explicitOwner: explicitOwner,
        context: config.context || null,
        surface: config.surface || config.surfaces || config.target || config.targets || null,
        zIndex: config.zIndex || 1100,
        onClick: config.onClick || null,
        onShow: config.onShow || null,
        onHide: config.onHide || null,
        preventScroll: preventScroll,
        escapeClose: config.escapeClose !== false,
        clickToClose: config.clickToClose !== false
      };
    }

    function applyBlockingState(config) {
      if (!backdropElement) return;
      restoreMutedElements();
      var surfaces = activeSurfaceElements(config);
      surfaces.forEach(function (surface) {
        surface.dataset.ndsBackdropSurface = "true";
      });
      if (isLightHeaderBackdrop(config)) {
        backdropElement.dataset.ndsBackdropBlocking = "true";
        backdropElement.style.zIndex = config.zIndex;
        setBodyState(true, config);
        syncScrollLock();
        return;
      }
      if (config.owner === "modal" && !surfaces.length && !config.modalSurfaceDeferred) {
        config.modalSurfaceDeferred = true;
        backdropElement.dataset.ndsBackdropBlocking = "true";
        backdropElement.style.zIndex = config.zIndex;
        setBodyState(true, config);
        syncScrollLock();
        window.requestAnimationFrame(function () {
          if (currentConfig === config && isActive) applyBlockingState(config);
        });
        return;
      }
      mutedElements = qsa(NDS.focusableSel || FOCUSABLE_SELECTOR).filter(function (element) {
        if (element === backdropElement || backdropElement.contains(element)) return false;
        return !isInsideAny(element, surfaces);
      });
      mutedElements.forEach(function (element) {
        element.dataset.ndsBackdropPrevInert = element.inert ? "true" : "false";
        element.dataset.ndsBackdropMuted = "true";
        element.inert = true;
      });
      backdropElement.dataset.ndsBackdropBlocking = "true";
      backdropElement.style.zIndex = config.zIndex;
      setBodyState(true, config);
      syncScrollLock();
    }

    function attachListeners() {
      if (!backdropElement) return;
      backdropElement.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleEscape);
      if (currentConfig && currentConfig.clickToClose) backdropElement.addEventListener("click", handleClick);
      if (currentConfig) document.addEventListener("click", handleDocumentClick, true);
      if (currentConfig && currentConfig.escapeClose) document.addEventListener("keydown", handleEscape);
    }

    function topEntry() {
      return activeOwners[activeOwners.length - 1] || null;
    }

    function activateTopConfig() {
      var entry = topEntry();
      currentConfig = entry ? entry.config : null;
      if (!currentConfig) return;
      applyBlockingState(currentConfig);
      attachListeners();
    }

    function handleClick(event) {
      if (event.target === backdropElement && currentConfig && currentConfig.onClick) currentConfig.onClick();
    }

    function handleDocumentClick(event) {
      if (!currentConfig || !isActive) return;
      if (isInsideAny(event.target, activeSurfaceElements(currentConfig))) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (currentConfig.clickToClose && currentConfig.onClick) currentConfig.onClick();
    }

    function handleEscape(event) {
      if ((event.key === "Escape" || event.key === "Esc") && currentConfig && currentConfig.onClick) currentConfig.onClick();
    }

    function show(config) {
      initBackdrop();
      var nextConfig = normalizeConfig(config);
      if (nextConfig.explicitOwner) {
        activeOwners = activeOwners.filter(function (entry) {
          return entry.owner !== nextConfig.owner;
        });
      } else {
        var activeTop = topEntry();
        if (isActive && activeTop && activeTop.owner === nextConfig.owner) {
          activeTop.config = nextConfig;
          activeTop.count = (activeTop.count || 1) + 1;
          activateTopConfig();
          return;
        }
      }
      activeOwners.push({ owner: nextConfig.owner, config: nextConfig, count: 1 });
      if (isActive) {
        activateTopConfig();
        return;
      }
      isActive = true;
      backdropElement.style.display = "block";
      activateTopConfig();
      window.requestAnimationFrame(function () {
        if (isActive) addStateToken(backdropElement, "active");
      });
      if (currentConfig && currentConfig.onShow) currentConfig.onShow();
    }

    function hide(owner) {
      if (!isActive || !backdropElement) return;
      if (owner) {
        activeOwners = activeOwners.filter(function (entry) {
          return entry.owner !== owner;
        });
      } else {
        var activeTop = topEntry();
        if (activeTop) {
          activeTop.count = (activeTop.count || 1) - 1;
          if (activeTop.count > 0) {
            activateTopConfig();
            return;
          }
          activeOwners.pop();
        }
      }
      if (activeOwners.length) {
        activateTopConfig();
        return;
      }
      backdropElement.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleEscape);
      isActive = false;
      var closingConfig = currentConfig;
      if (NDS.State && NDS.State.clear) NDS.State.clear(backdropElement);
      else backdropElement.removeAttribute("data-state");
      backdropElement.removeAttribute("data-nds-backdrop-blocking");
      restoreMutedElements();
      setBodyState(false);
      syncScrollLock();
      window.setTimeout(function () {
        if (isActive) return;
        backdropElement.style.display = "";
        if (closingConfig && closingConfig.onHide) closingConfig.onHide();
        currentConfig = null;
      }, NDS.transitionSpeed ? NDS.transitionSpeed() : 200);
    }

    function reset() {
      if (!backdropElement) initBackdrop();
      backdropElement.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("keydown", handleEscape);
      isActive = false;
      activeOwners = [];
      currentConfig = null;
      if (NDS.State && NDS.State.clear) NDS.State.clear(backdropElement);
      else backdropElement.removeAttribute("data-state");
      backdropElement.removeAttribute("data-nds-backdrop-blocking");
      restoreMutedElements();
      setBodyState(false);
      if (scrollLocked && NDS.scrollLock && NDS.scrollLock.unlock) NDS.scrollLock.unlock();
      scrollLocked = false;
      backdropElement.style.display = "";
    }

    function toggle(config) {
      var nextConfig = normalizeConfig(config);
      if (activeOwners.some(function (entry) { return entry.owner === nextConfig.owner; })) {
        hide(nextConfig.owner);
      } else {
        show(config);
      }
    }

    window.NDS.Backdrop = {
      show: show,
      hide: hide,
      reset: reset,
      toggle: toggle,
      isActive: function () { return isActive; },
      getElement: function () { initBackdrop(); return backdropElement; },
      getOwners: function () { return activeOwners.map(function (entry) { return entry.owner; }); },
      _siteBackdropAdapter: true
    };
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, Math.max(0, ms || 0));
    });
  }

  function isProjectClearableTextInput(input) {
    if (!input || input.tagName !== "INPUT") return false;
    if (!input.classList.contains("nds-input")) return false;
    if (input.closest("code, .code-example")) return false;
    if (input.closest(".site-search-box")) return false;
    if (input.classList.contains("file-input") || input.classList.contains("nds-select-input")) return false;
    if (input.hasAttribute("data-no-clear") || input.readOnly || input.disabled) return false;
    var type = (input.getAttribute("type") || "text").toLowerCase();
    return ["text", "search", "email", "url", "tel", "number", "password"].indexOf(type) !== -1;
  }

  function directChildInputForClear(control) {
    if (!control) return null;
    return Array.prototype.slice.call(control.children).find(function (child) {
      return child.tagName === "INPUT" && isProjectClearableTextInput(child);
    }) || null;
  }

  function syncProjectInputClear(control) {
    var input = directChildInputForClear(control);
    var clearButton = control ? qs("[data-site-text-clear]", control) : null;
    if (!input || !clearButton) return;
    clearButton.hidden = !input.value;
  }

  function initializeProjectInputClear(control) {
    if (!control) return;
    if (control.dataset.siteClearEnhanced === "true") {
      syncProjectInputClear(control);
      return;
    }
    var input = directChildInputForClear(control);
    if (!input) return;

    var action = Array.prototype.slice.call(control.children).find(function (child) {
      return child.classList && child.classList.contains("nds-form-action") && !child.classList.contains("nds-prefix");
    });
    if (!action) {
      action = document.createElement("div");
      action.className = "nds-form-action site-text-input-clear-action";
      control.append(action);
    } else {
      action.classList.add("site-text-input-clear-action");
    }

    var clearButton = qs("[data-site-text-clear]", action) || qs(".nds-clear", action);
    if (!clearButton) {
      clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "nds-btn nds-subtle nds-clear site-text-input-clear";
      clearButton.innerHTML = '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>';
      action.insertBefore(clearButton, action.firstChild);
    }
    clearButton.dataset.siteTextClear = "true";
    clearButton.classList.add("site-text-input-clear");
    clearButton.setAttribute("aria-label", "مسح الحقل");
    clearButton.setAttribute("title", "مسح الحقل");
    control.dataset.siteClearEnhanced = "true";
    syncProjectInputClear(control);

    if (window.NDS && window.NDS.Forms && window.NDS.Forms.initializeContainer) {
      try {
        window.NDS.Forms.initializeContainer(control);
      } catch (error) {}
    }
  }

  function enhanceProjectTextInputs(root) {
    qsa(".nds-form-control", root || document).forEach(initializeProjectInputClear);
  }

  function queueProjectTextInputEnhancement(root) {
    if (textInputClearQueued) return;
    textInputClearQueued = true;
    window.requestAnimationFrame(function () {
      textInputClearQueued = false;
      enhanceProjectTextInputs(root || document);
    });
  }

  function setupProjectTextInputClearEnhancement() {
    enhanceProjectTextInputs();
    if (!textInputClearObserver) {
      textInputClearObserver = new MutationObserver(function (mutations) {
        var shouldEnhance = mutations.some(function (mutation) {
          return Array.prototype.slice.call(mutation.addedNodes || []).some(function (node) {
            return node.nodeType === 1 && (
              (node.matches && node.matches(".nds-form-control, .nds-form-container, input.nds-input"))
              || (node.querySelector && node.querySelector(".nds-form-control, input.nds-input"))
            );
          });
        });
        if (shouldEnhance) queueProjectTextInputEnhancement();
      });
      textInputClearObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    document.addEventListener("input", function (event) {
      var input = event.target.closest("input.nds-input");
      if (!isProjectClearableTextInput(input)) return;
      syncProjectInputClear(input.closest(".nds-form-control"));
    });
    document.addEventListener("change", function (event) {
      var input = event.target.closest("input.nds-input");
      if (!isProjectClearableTextInput(input)) return;
      syncProjectInputClear(input.closest(".nds-form-control"));
    });
    document.addEventListener("click", function (event) {
      var clearButton = event.target.closest("[data-site-text-clear]");
      if (!clearButton) return;
      var control = clearButton.closest(".nds-form-control");
      var input = directChildInputForClear(control);
      if (!input) return;
      event.preventDefault();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      syncProjectInputClear(control);
      input.focus();
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

  function ndsTagEl(className, text) {
    var node = el("span", className);
    node.append(el("span", "nds-label", text));
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

  function projectIdentifier(project, index) {
    return String(project && project.slug || index);
  }

  function projectHref(project, index) {
    return "project.html?id=" + encodeURIComponent(projectIdentifier(project, index));
  }

  function projectEntryByIdentifier(data, identifier) {
    var projects = asArray(data && data.projects || []);
    var id = String(identifier || "").trim();
    var slugIndex;
    var numericIndex;
    if (id) {
      slugIndex = projects.findIndex(function (project) {
        return String(project && project.slug || "").trim() === id;
      });
      if (slugIndex > -1) return { project: projects[slugIndex], index: slugIndex };
    }
    numericIndex = Number(id);
    if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < projects.length) {
      return { project: projects[numericIndex], index: numericIndex };
    }
    return { project: null, index: -1 };
  }

  function cardCollectionSlug(collection, index) {
    return String(collection && (collection.slug || collection.title) || ("cards-" + index)).trim();
  }

  function cardCollectionHref(collection, index, pageNumber) {
    var slug = cardCollectionSlug(collection, index);
    var params = new URLSearchParams();
    if (slug) params.set("slug", slug);
    if (pageNumber && pageNumber > 1) params.set("page", String(pageNumber));
    return "cards.html" + (params.toString() ? "?" + params.toString() : "");
  }

  function publicCardCollections(data) {
    return visibleItems((data && data.cardCollections) || []).filter(function (collection) {
      return hasText(collection.title || collection.slug);
    });
  }

  function cardCollectionBySlug(data, slug) {
    var collections = publicCardCollections(data);
    var normalized = String(slug || "").trim();
    return collections.find(function (collection, index) {
      return cardCollectionSlug(collection, index) === normalized;
    }) || collections[0] || null;
  }

  function currentCardCollection(data) {
    var params = new URLSearchParams(location.search);
    return cardCollectionBySlug(data, params.get("slug") || "");
  }

  function visibleCollectionCards(collection) {
    return visibleItems((collection && collection.cards) || []).filter(function (card) {
      return hasText(card.title || card.subtitle);
    });
  }

  function visibleHeroSlides(home) {
    var slides = visibleItems(home.heroSlides || []).filter(function (slide) {
      return hasText(slide.image) || hasText(slide.mobileImage) || hasText(slide.video) || hasText(slide.mobileVideo);
    });
    if (!slides.length && (hasText(home.heroImage) || hasText(home.heroVideo))) {
      slides.push({
        title: "",
        subtitle: "",
        intro: "",
        image: home.heroImage || "",
        video: home.heroVideo || "",
        alt: home.ownerName || ""
      });
    }
    return slides;
  }

  function hasHomeHeroContent(home) {
    return visibleHeroSlides(home).length > 0;
  }

  function visibleHomeNumberCards(home) {
    var numbers = home && home.numbers && typeof home.numbers === "object" ? home.numbers : {};
    return visibleItems(numbers.cards || []).filter(function (item) {
      return hasText(item && (item.title || item.number));
    });
  }

  function hasHomeBodyContent(home) {
    return [home.ownerName, home.title, home.intro, home.avatar, home.biography].some(hasText)
      || visibleHomeNumberCards(home).length
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
    applyTheme(currentThemePreference(data), false);
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
      if (page === "cards") {
        var collection = currentCardCollection(data);
        title = (collection && (collection.title || collection.slug) || "البطاقات") + " | " + baseTitle;
      }
      if (page === "pages") title = navigationLabel(data, "pagesLabel", "الصفحات") + " | " + baseTitle;
      if (page === "admin") title = navigationLabel(data, "adminLabel", "الإدارة") + " | " + baseTitle;
      if (page === "notifications") title = uiText(data, "notificationsLabel", "الإشعارات") + " | " + baseTitle;
    } else if (detailTitle !== baseTitle) {
      title = detailTitle + " | " + baseTitle;
    }
    document.title = title;
  }

  function setImageSource(image, src) {
    if (!image || !src) return;
    var current = image.getAttribute("src") || "";
    if (current === src) return;
    image.src = src;
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
      setImageSource(image, brandLogo);
    });
    qsa("[data-site-mark]").forEach(function (image) {
      setImageSource(image, siteIcon);
    });
    qsa("link[rel~='icon'], [data-site-favicon]").forEach(function (link) {
      if (link.getAttribute("href") === siteIcon && link.type === imageMimeForPath(siteIcon)) return;
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
    enhanceSiteSearchControls(data);
  }

  function renderShared(data) {
    applyDocumentSettings(data);
    applyShellText(data);
    applyInterfaceTexts(data);
    renderAccountMenu(data);
    renderNavigation(data);
    renderNotifications();
    renderAnalyticsIntegrations(data);
    try {
      renderFooter(data);
    } catch (error) {
      console.error("Footer render failed", error);
    }
    updateClock();
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

  function resetAccountDropdownRoot(root) {
    if (!root) return;
    root.removeAttribute("data-state");
    root.removeAttribute("data-site-backdrop-surface");
    root.removeAttribute("data-nds-backdrop-surface");
    qsa("[aria-expanded], [data-state]", root).forEach(function (node) {
      removeDataStateTokens(node, ["active", "open", "opened", "opening", "closing"]);
      if (node.hasAttribute("aria-expanded")) node.setAttribute("aria-expanded", "false");
    });
  }

  function renderDesktopAccountMenu(data) {
    var item = qs(".admin-persona-dropdown");
    if (!item) return;
    var config = currentAuthConfig();
    var isAuthenticated = isAdminAuthenticated();
    var name = accountDisplayName(data);
    var role = data.home.title || "Administrator";
    var portalLabel = uiText(data, "adminPortalLabel", "الإدارة");
    item.className = isAuthenticated
      ? "nds-nav-item nds-dropdown nds-login nds-icon-only nds-auth admin-persona-dropdown account-menu-item"
      : "nds-nav-item nds-icon-only nds-guest admin-persona-dropdown account-menu-item";
    item.dataset.accountMenu = "auth";
    resetAccountDropdownRoot(item);

    if (!isAuthenticated) {
      item.innerHTML = [
        '<button class="nds-nav-link nds-btn nds-subtle nds-indicator account-login-trigger" type="button" data-login-trigger aria-label="' + escapeHtml(uiText(data, "loginLabel", "تسجيل الدخول")) + '" title="' + escapeHtml(uiText(data, "loginLabel", "تسجيل الدخول")) + '">',
        '<i class="nds-icon nds-icon-avatar" aria-hidden="true"></i>',
        '<span class="nds-label">' + escapeHtml(uiText(data, "loginLabel", "تسجيل الدخول")) + '</span>',
        '</button>'
      ].join("");
      return;
    }

    item.innerHTML = [
      '<button class="nds-nav-link nds-btn nds-subtle nds-lg nds-indicator header-admin-link account-persona-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="' + escapeHtml(name) + '" title="' + escapeHtml(name) + '">',
      personaAvatarMarkup(data, name, true),
      '<span class="nds-label">' + escapeHtml(name) + '</span>',
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
    qsa(".site-header [data-mobile-account-section]").forEach(function (section) {
      section.remove();
    });
  }

  function setDigitalStampCollapsed(collapsed, header) {
    var stamp;
    var trigger;
    header = header || qs(".site-header");
    if (!header) return;
    stamp = qs("#nds-digitalStamp", header);
    trigger = qs(".nds-digitalStamp-tab", header);
    if (!stamp) return;
    if (collapsed) {
      removeDataStateTokens(stamp, ["open", "opened", "opening", "closing"]);
      setDigitalStampClosedInline(stamp, true);
      stamp.setAttribute("aria-hidden", "true");
      stamp.inert = true;
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        removeDataStateTokens(trigger, ["expanded"]);
      }
    } else {
      stamp.removeAttribute("aria-hidden");
      stamp.inert = false;
      setDigitalStampClosedInline(stamp, false);
    }
  }

  function setDigitalStampClosedInline(stamp, closed) {
    if (!stamp || !stamp.style) return;
    ["gridTemplateRows", "borderBlockEndColor", "boxShadow", "opacity", "pointerEvents", "transform"].forEach(function (property) {
      stamp.style[property] = "";
    });
    if (!closed) return;
    stamp.style.gridTemplateRows = "0fr";
    stamp.style.borderBlockEndColor = "transparent";
    stamp.style.boxShadow = "none";
    stamp.style.opacity = "0";
    stamp.style.pointerEvents = "none";
    stamp.style.transform = "translateY(-8px)";
  }

  function settleDigitalStampClosedState(trigger) {
    var header = trigger && trigger.closest ? trigger.closest(".site-header") : qs(".site-header");
    var stamp;
    if (!header) return;
    trigger = trigger || qs(".nds-digitalStamp-tab", header);
    stamp = qs("#nds-digitalStamp", header);
    if (!trigger || !stamp) return;
    if (trigger.getAttribute("aria-expanded") === "true") {
      setDigitalStampClosedInline(stamp, false);
      return;
    }
    removeDataStateTokens(stamp, ["open", "opened", "opening", "closing"]);
    removeDataStateTokens(trigger, ["expanded"]);
    setDigitalStampClosedInline(stamp, true);
  }

  function scheduleDigitalStampStateSettle(trigger) {
    var header = trigger && trigger.closest ? trigger.closest(".site-header") : qs(".site-header");
    var stamp = header ? qs("#nds-digitalStamp", header) : null;
    if (trigger && trigger.getAttribute("aria-expanded") !== "true") {
      setDigitalStampClosedInline(stamp, false);
    }
    [360, 760, 1120].forEach(function (delay) {
      window.setTimeout(function () {
        settleDigitalStampClosedState(trigger);
      }, delay);
    });
  }

  function setupDigitalStampStateGuard() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest(".site-header .nds-digitalStamp-tab");
      if (!trigger) return;
      scheduleDigitalStampStateSettle(trigger);
    }, true);
  }

  function setTopbarCollapsedInline(topbar, body, collapsed) {
    if (topbar && topbar.style) {
      ["blockSize", "minHeight", "maxBlockSize", "borderBlockEndWidth", "opacity", "pointerEvents", "transform"].forEach(function (property) {
        topbar.style[property] = "";
      });
      if (collapsed) {
        topbar.style.blockSize = "0px";
        topbar.style.minHeight = "0px";
        topbar.style.maxBlockSize = "0px";
        topbar.style.borderBlockEndWidth = "0px";
        topbar.style.opacity = "0";
        topbar.style.pointerEvents = "none";
        topbar.style.transform = "translateY(-100%)";
      }
    }
    if (body && body.style) {
      body.style.paddingBlockStart = "";
      if (collapsed) body.style.paddingBlockStart = "var(--nds-nav-height)";
    }
  }

  function scheduleTopbarCollapsedSettle(header, body, topbar) {
    [360, 760, 1120].forEach(function (delay) {
      window.setTimeout(function () {
        if (!body || body.dataset.topbarCollapsed !== "true") return;
        if (header && header.dataset.topbarCollapsed !== "true") return;
        setTopbarCollapsedInline(topbar || qs(".nds-topbar", header), body, true);
      }, delay);
    });
  }

  function setTopbarCollapsed(collapsed, header, instant) {
    var body = document.body;
    var topbar;
    var locked = Boolean(collapsed && instant);
    header = header || qs(".site-header");
    if (!header || !body) return;
    if (
      appState.topbarCollapsed === collapsed
      && (header.dataset.topbarCollapsed === "true") === collapsed
      && (header.dataset.topbarLocked === "true") === locked
      && (body.dataset.topbarCollapsed === "true") === collapsed
      && (body.dataset.topbarLocked === "true") === locked
    ) return;
    appState.topbarCollapsed = collapsed;
    topbar = qs(".nds-topbar", header);
    setDigitalStampCollapsed(collapsed, header);
    if (collapsed) {
      header.dataset.topbarCollapsed = "true";
      body.dataset.topbarCollapsed = "true";
      if (locked) {
        header.dataset.topbarLocked = "true";
        body.dataset.topbarLocked = "true";
      } else {
        delete header.dataset.topbarLocked;
        delete body.dataset.topbarLocked;
      }
      if (topbar) {
        topbar.setAttribute("aria-hidden", "true");
        topbar.inert = true;
      }
      if (locked) {
        setTopbarCollapsedInline(topbar, body, true);
      } else {
        setTopbarCollapsedInline(topbar, body, false);
        scheduleTopbarCollapsedSettle(header, body, topbar);
      }
    } else {
      delete header.dataset.topbarCollapsed;
      delete header.dataset.topbarLocked;
      delete body.dataset.topbarCollapsed;
      delete body.dataset.topbarLocked;
      setTopbarCollapsedInline(topbar, body, false);
      if (topbar) {
        topbar.removeAttribute("aria-hidden");
        topbar.inert = false;
      }
    }
  }

  function currentScrollTop() {
    var lockedBodyTop = document.body && document.body.style
      ? parseFloat(document.body.style.top || "")
      : NaN;
    if (Number.isFinite(lockedBodyTop) && lockedBodyTop < 0) {
      return Math.abs(lockedBodyTop);
    }
    return Math.max(
      0,
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    );
  }

  function currentScrollLeft() {
    return Math.max(
      0,
      window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0
    );
  }

  function rawViewportScrollTop() {
    return Math.max(
      0,
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    );
  }

  function restoreViewportScroll(left, top) {
    left = Math.max(0, Math.round(Number(left) || 0));
    top = Math.max(0, Math.round(Number(top) || 0));
    try {
      window.scrollTo({ left: left, top: top, behavior: "auto" });
    } catch (error) {
      window.scrollTo(left, top);
    }
    document.documentElement.scrollLeft = left;
    document.documentElement.scrollTop = top;
    if (document.body) {
      document.body.scrollLeft = left;
      document.body.scrollTop = top;
    }
  }

  function restoreThemeViewportScroll(left, top) {
    top = Math.max(0, Math.round(Number(top) || 0));
    if (top <= 1 && document.body && document.body.style && document.body.style.top && !document.body.dataset.ndsBackdropActive) {
      document.body.style.top = "";
      if (document.body.dataset) delete document.body.dataset.ndsScrollLockY;
    }
    restoreViewportScroll(left, top);
  }

  function preserveThemeScrollPosition(left, top) {
    var releaseToken = ++themeScrollReleaseToken;
    var restore = function () {
      if (releaseToken !== themeScrollReleaseToken) return;
      restoreThemeViewportScroll(left, top);
    };
    var release = function () {
      if (releaseToken !== themeScrollReleaseToken) return;
      restoreThemeViewportScroll(left, top);
      delete document.documentElement.dataset.themeSwitching;
    };

    document.documentElement.dataset.themeSwitching = "true";
    restore();
    window.requestAnimationFrame(function () {
      restore();
      window.requestAnimationFrame(restore);
    });
    window.setTimeout(restore, 80);
    window.setTimeout(restore, 180);
    window.setTimeout(restore, 320);
    window.setTimeout(restore, 520);
    window.setTimeout(restore, 760);
    window.setTimeout(restore, 940);
    window.setTimeout(release, 1100);
  }

  function preserveHeaderActionScrollPosition(left, top) {
    var releaseToken = ++headerActionScrollReleaseToken;
    var restore = function () {
      if (releaseToken !== headerActionScrollReleaseToken) return;
      restoreViewportScroll(left, top);
    };
    var release = function () {
      if (releaseToken !== headerActionScrollReleaseToken) return;
      restoreViewportScroll(left, top);
      delete document.documentElement.dataset.headerActionStabilizing;
    };

    document.documentElement.dataset.headerActionStabilizing = "true";
    restore();
    window.requestAnimationFrame(function () {
      restore();
      window.requestAnimationFrame(restore);
    });
    window.setTimeout(restore, 80);
    window.setTimeout(restore, 180);
    window.setTimeout(restore, 320);
    window.setTimeout(release, 420);
  }

  function updateTopbarScrollState(header, currentY, delta, instant) {
    setTopbarCollapsed(currentY > TOPBAR_SCROLL_TRIGGER_PX, header, instant);
  }

  function setupTopbarScrollMotion() {
    var header = qs(".site-header");
    if (!header) return;
    appState.topbarScrollLastY = currentScrollTop();
    updateTopbarScrollState(header, appState.topbarScrollLastY, 0, true);
    window.addEventListener("scroll", function () {
      if (appState.topbarScrollFrame) return;
      appState.topbarScrollFrame = window.requestAnimationFrame(function () {
        var currentY = currentScrollTop();
        var delta = currentY - appState.topbarScrollLastY;
        appState.topbarScrollFrame = null;
        updateTopbarScrollState(header, currentY, delta);
        appState.topbarScrollLastY = currentY;
      });
    }, { passive: true });
  }

  function updateHeaderActions(data) {
    var minimal = qs(".nds-nav-minimal");
    if (!minimal) {
      updateThemeIcon(document.documentElement.dataset.theme || localStorage.getItem("websiteDemo:theme") || "light");
      return;
    }
    var toggler = qs(".nds-mainNav-toggler", minimal);
    dedupeHeaderActions();
    Array.prototype.slice.call(minimal.children).forEach(function (item) {
      if (item === toggler) return;
      if (item.classList && (item.classList.contains("site-search-dropdown") || item.classList.contains("nds-search"))) return;
      item.remove();
    });
    qsa("[data-mobile-header-date]", minimal).forEach(function (item) { item.remove(); });
    updateHeaderDateTime();
    updateThemeIcon(document.documentElement.dataset.theme || localStorage.getItem("websiteDemo:theme") || "light");
  }

  function dedupeHeaderActions() {
    qsa(".site-header [data-pab-ph]").forEach(function (item) { item.remove(); });
    qsa(".site-header .nds-PAB").forEach(function (item) { item.classList.remove("nds-PAB"); });
    [
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
    var flattened = [];
    pageNavigationTree(data).forEach(function (item) {
      flattened.push(item);
      (item.children || []).forEach(function (child) {
        flattened.push(child);
      });
    });
    return flattened;
  }

  function cardCollectionNavigationItems(data) {
    return publicCardCollections(data).filter(function (collection) {
      return collection.showInNavigation !== false;
    }).map(function (collection, index) {
      var slug = cardCollectionSlug(collection, index);
      return {
        label: collection.title || slug,
        href: cardCollectionHref(collection, index),
        key: "cards:" + slug,
        slug: slug,
        collection: collection
      };
    });
  }

  function isGeneratedSubpageDraft(page) {
    return String(page && page.title || "").trim() === "\u0635\u0641\u062d\u0629 \u0641\u0631\u0639\u064a\u0629 \u062c\u062f\u064a\u062f\u0629";
  }

  function pageNavigationTree(data) {
    var pages = publicPageItems(data).map(function (item) {
      var slug = String(item.slug || "").trim();
      return {
        label: item.title || item.slug,
        href: pageHref(item, data),
        key: "page:" + slug,
        slug: slug,
        parentSlug: String(item.parentSlug || "").trim(),
        page: item,
        children: []
      };
    });
    var bySlug = {};
    var rawChildrenByParent = {};
    var roots = [];

    pages.forEach(function (item) {
      if (item.slug) bySlug[item.slug] = item;
    });
    pages.forEach(function (item) {
      var parent = item.parentSlug && bySlug[item.parentSlug];
      if (parent && !parent.parentSlug && parent.slug !== item.slug && parent.page.showInNavigation !== false) {
        rawChildrenByParent[parent.slug] = rawChildrenByParent[parent.slug] || [];
        rawChildrenByParent[parent.slug].push(item);
      }
    });
    pages.forEach(function (item) {
      if (!item.parentSlug && item.page.showInNavigation !== false && !isGeneratedSubpageDraft(item.page)) roots.push(item);
    });
    roots.forEach(function (item) {
      item.children = (rawChildrenByParent[item.slug] || []).filter(function (child) {
        return !rawChildrenByParent[child.slug];
      });
    });
    return roots;
  }

  function publicPageItems(data) {
    return visibleItems((data && data.pages) || []).filter(function (item) {
      return hasText(item.title || item.slug);
    });
  }

  function routablePageItems(data) {
    return ((data && data.pages) || []).filter(function (item) {
      return item && (item.visible !== false || item.showInFooter === true) && hasText(item.title || item.slug) && !pageIsNavigationGroup(item, data);
    });
  }

  function pagesBySlug(data) {
    var output = {};
    ((data && data.pages) || []).forEach(function (page) {
      var slug = String(page && page.slug || "").trim();
      if (slug) output[slug] = page;
    });
    return output;
  }

  function pageHasChildPages(slug, data) {
    var value = String(slug || "").trim();
    return Boolean(value) && ((data && data.pages) || []).some(function (page) {
      return String(page && page.parentSlug || "").trim() === value;
    });
  }

  function pageIsNavigationGroup(page, data) {
    var slug = String(page && page.slug || "").trim();
    return Boolean(slug) && !String(page && page.parentSlug || "").trim() && pageHasChildPages(slug, data);
  }

  function pagePathSlugs(page, data) {
    var slug = String(page && page.slug || "").trim();
    var parentSlug = String(page && page.parentSlug || "").trim();
    var bySlug = pagesBySlug(data);
    if (pageIsNavigationGroup(page, data)) return [];
    if (slug && parentSlug && parentSlug !== slug && bySlug[parentSlug] && !pageHasChildPages(slug, data)) return [parentSlug, slug];
    return slug ? [slug] : [];
  }

  function pageHref(page, data) {
    var parts = pagePathSlugs(page, data).map(function (part) {
      return encodeURIComponent(part);
    });
    if (!parts.length) return "index.html";
    return "index.html#/page/" + parts.join("/");
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

  function pageTrackingStamp(page) {
    var timestamp = pageTrackingTimestamp(page);
    if (!timestamp) return null;
    return el("p", "page-tracking-stamp", "آخر تحديث: " + formatPageTrackingTimestamp(timestamp));
  }

  function renderExtraPageTrackingStamp(page) {
    var head = qs("[data-extra-page-view] .nds-section-head");
    var previous;
    var stamp;
    if (!head) return;
    previous = qs(".page-tracking-stamp", head);
    if (previous) previous.remove();
    stamp = pageTrackingStamp(page);
    if (stamp) head.append(stamp);
  }

  function pageFeedbackDefaults() {
    return Object.assign({
      enabled: true,
      question: "هل كانت هذه الصفحة مفيدة؟",
      yesLabel: "نعم",
      noLabel: "لا",
      yesReasonsLabel: "ما الذي أعجبك في الصفحة؟",
      noReasonsLabel: "ما الذي يمكن تحسينه؟",
      yesOptions: "المحتوى واضح\nالمعلومات مفيدة\nسهولة الوصول للمعلومة",
      noOptions: "المحتوى غير واضح\nالمعلومات غير مكتملة\nواجهت صعوبة في الاستخدام",
      commentLabel: "ملاحظات إضافية",
      commentPlaceholder: "اكتب ملاحظتك هنا",
      agreementText: "تساعدنا ملاحظتك في تحسين محتوى هذه الصفحة.",
      submitLabel: "إرسال التقييم",
      closeLabel: "إغلاق",
      successMessage: "تم استلام ملاحظتك، شكرا لك.",
      errorMessage: "تعذر إرسال الملاحظة، حاول مرة أخرى.",
      statisticsText: ""
    }, window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.settings && window.DEFAULT_SITE_DATA.settings.pageFeedback || {});
  }

  function pageFeedbackConfig(data) {
    var settings = data && data.settings && data.settings.pageFeedback || {};
    var output = Object.assign(pageFeedbackDefaults(), settings);
    output.enabled = output.enabled !== false;
    return output;
  }

  function feedbackLines(value) {
    var seen = {};
    return String(value || "").split(/\n+/).map(function (line) {
      return line.trim();
    }).filter(function (line) {
      if (!line || seen[line]) return false;
      seen[line] = true;
      return true;
    });
  }

  function feedbackCurrentProjectContext(data, path) {
    var params = new URLSearchParams(location.search);
    var identifier = params.get("id") || params.get("slug") || "";
    var entry = projectEntryByIdentifier(data, identifier);
    var project = entry.project;
    var key = project && (project.slug || String(entry.index)) || identifier || "unknown";
    return {
      pageKey: "project:" + key,
      pageTitle: project && project.title || document.title || key,
      pageType: "project",
      path: path
    };
  }

  function feedbackCurrentPageContext(data) {
    var page = document.body ? document.body.dataset.page : "home";
    var path = window.location.pathname + window.location.search + window.location.hash;
    var slug;
    var pageItem;
    var collection;

    if (page === "admin") return null;
    if (page === "home") {
      slug = getPageSlug();
      if (!slug) return null;
      pageItem = routablePageItems(data).find(function (item) { return item.slug === slug; });
      return {
        pageKey: "page:" + slug,
        pageTitle: pageItem && pageItem.title || document.title || slug,
        pageType: "page",
        path: path
      };
    }
    if (page === "project-detail") return feedbackCurrentProjectContext(data, path);
    if (page === "projects") {
      return {
        pageKey: "projects",
        pageTitle: navigationLabel(data, "projectsLabel", "مشاريعنا"),
        pageType: "projects",
        path: path
      };
    }
    if (page === "pages") {
      return {
        pageKey: "pages",
        pageTitle: navigationLabel(data, "pagesLabel", "الصفحات"),
        pageType: "pages",
        path: path
      };
    }
    if (page === "cards") {
      collection = currentCardCollection(data);
      slug = cardCollectionSlug(collection, 0) || "cards";
      return {
        pageKey: "cards:" + slug,
        pageTitle: collection && collection.title || "البطاقات",
        pageType: "cards",
        path: path
      };
    }
    if (page === "notifications") {
      return {
        pageKey: "notifications",
        pageTitle: uiText(data, "notificationsLabel", "الإشعارات"),
        pageType: "notifications",
        path: path
      };
    }
    return null;
  }

  function shouldRenderPageFeedback(data) {
    return pageFeedbackConfig(data).enabled && Boolean(feedbackCurrentPageContext(data));
  }

  function createFeedbackCheckbox(id, name, label) {
    var container = el("label", "check-line page-feedback-option");
    var input = document.createElement("input");
    input.type = "checkbox";
    input.className = "nds-check";
    input.id = id;
    input.name = name;
    input.value = label;
    container.append(input, el("span", "", label));
    return container;
  }

  function appendFeedbackOptions(root, items, options) {
    var fieldset;
    var legend;
    if (!items.length) return;
    fieldset = el("fieldset", "nds-form-group nds-check-group " + options.className);
    fieldset.setAttribute("data-min-checked", "1");
    fieldset.setAttribute("data-error-message", options.errorMessage || "اختر خيارا واحدا على الأقل");
    legend = el("legend", "nds-form-group-label", options.label);
    fieldset.append(legend);
    items.forEach(function (item, index) {
      fieldset.append(createFeedbackCheckbox(options.idPrefix + "-" + index, options.name, item));
    });
    root.append(fieldset);
  }

  function pageFeedbackCookieName(component) {
    var key = component && component.getAttribute("data-feedback-key") || window.location.pathname + window.location.search;
    return "nds-feedback" + String(key || "").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/\./g, "-");
  }

  function getPageFeedbackCookie(component) {
    var name = pageFeedbackCookieName(component);
    if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.get) {
      return window.NDS.Cookies.get(name);
    }
    return document.cookie.split(";").map(function (item) {
      return item.trim();
    }).filter(function (item) {
      return item.indexOf(name + "=") === 0;
    }).map(function (item) {
      return decodeURIComponent(item.slice(name.length + 1));
    })[0] || null;
  }

  function setPageFeedbackCookie(component, value) {
    var name = pageFeedbackCookieName(component);
    if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.set) {
      window.NDS.Cookies.set(name, value || "submitted", 365);
      return;
    }
    document.cookie = name + "=" + encodeURIComponent(value || "submitted") + "; max-age=31536000; path=/; samesite=lax";
  }

  function setPageFeedbackState(component, state) {
    if (!component) return;
    if (window.NDS && window.NDS.State) {
      if (state) window.NDS.State.set(component, state);
      else window.NDS.State.clear(component);
      return;
    }
    if (state) component.dataset.state = state;
    else component.removeAttribute("data-state");
  }

  function clearPageFeedbackStatus(component) {
    var status = qs(".nds-user-feedback-status", component);
    if (status && window.NDS && window.NDS.Feedback && window.NDS.Feedback.dismissAll) {
      window.NDS.Feedback.dismissAll(status);
    }
    if (status) {
      status.hidden = true;
      status.textContent = "";
    }
  }

  function resetPageFeedbackWidget(component) {
    var status = qs(".nds-user-feedback-status", component);
    var details = qs(".nds-user-feedback-details", component);
    var submit = qs(".nds-user-feedback-submit", component);
    var close = qs(".nds-user-feedback-close", component);
    if (!component) return;
    setPageFeedbackState(component, "");
    component.removeAttribute("data-answer");
    clearPageFeedbackStatus(component);
    if (status) status.hidden = true;
    if (details) details.hidden = true;
    if (submit) submit.hidden = true;
    if (close) close.hidden = true;
    qsa("input[type='checkbox'], input[type='radio']", component).forEach(function (input) {
      input.checked = false;
    });
    if (qs("textarea", component)) qs("textarea", component).value = "";
  }

  function showPageFeedbackStatus(component, statusName) {
    var status = qs(".nds-user-feedback-status", component);
    var details = qs(".nds-user-feedback-details", component);
    var submit = qs(".nds-user-feedback-submit", component);
    var close = qs(".nds-user-feedback-close", component);
    var message = statusName === "error"
      ? component.getAttribute("data-error-message") || "تعذر إرسال الملاحظة، حاول مرة أخرى."
      : component.getAttribute("data-success-message") || "تم استلام ملاحظتك، شكرا لك.";
    setPageFeedbackState(component, "status");
    if (status) {
      status.hidden = false;
      if (window.NDS && window.NDS.Feedback && window.NDS.Feedback.create) {
        window.NDS.Feedback.dismissAll(status);
        window.NDS.Feedback.create({
          message: message,
          status: statusName || "success",
          target: status,
          position: "append",
          size: "md",
          style: "",
          onDismiss: function () {
            resetPageFeedbackWidget(component);
          }
        });
      } else {
        status.textContent = message;
      }
    }
    if (details) details.hidden = true;
    if (submit) submit.hidden = true;
    if (close) close.hidden = true;
    if (statusName !== "error") setPageFeedbackCookie(component, "submitted");
  }

  function showPageFeedbackDetails(component, answer) {
    var details = qs(".nds-user-feedback-details", component);
    var submit = qs(".nds-user-feedback-submit", component);
    var close = qs(".nds-user-feedback-close", component);
    setPageFeedbackState(component, "details");
    component.dataset.answer = answer === "No" ? "no" : "yes";
    if (details) details.hidden = false;
    if (submit) submit.hidden = false;
    if (close) close.hidden = false;
  }

  function initializePageFeedbackWidget(root) {
    var component = qs(".nds-user-feedback", root);
    var submitButton = qs(".nds-user-feedback-submit-btn", root);
    if (!component || component.dataset.pageFeedbackInitialized === "true") return;
    component.dataset.pageFeedbackInitialized = "true";
    component.setAttribute("data-nds-user-feedback-initialized", "true");
    if (getPageFeedbackCookie(component) === "submitted") {
      showPageFeedbackStatus(component, "success");
      return;
    }
    qsa(".nds-user-feedback-answer-btn .nds-btn", component).forEach(function (button) {
      button.addEventListener("click", function () {
        showPageFeedbackDetails(component, button.dataset.answer || "Yes");
      });
    });
    if (qs(".nds-user-feedback-close", component)) {
      qs(".nds-user-feedback-close", component).addEventListener("click", function () {
        resetPageFeedbackWidget(component);
      });
    }
    if (submitButton) {
      submitButton.addEventListener("click", function (event) {
        var form = component.closest(".nds-form") || component.closest("form");
        var payload;
        event.preventDefault();
        if (submitButton.dataset.pageFeedbackSent === "true") return;
        if (form && window.NDS && window.NDS.Forms && window.NDS.Forms.validateForm) {
          try {
            if (!window.NDS.Forms.validateForm(form, { showMessages: true, focusFirst: true }).valid) return;
          } catch (error) {}
        }
        payload = collectPageFeedbackPayload(component);
        if (!payload || !window.SiteStore || !window.SiteStore.savePageFeedback) return;
        submitButton.dataset.pageFeedbackSent = "true";
        window.SiteStore.savePageFeedback(payload).then(function () {
          showPageFeedbackStatus(component, "success");
        }).catch(function (error) {
          console.warn("Unable to record page feedback.", error);
          delete submitButton.dataset.pageFeedbackSent;
          showPageFeedbackStatus(component, "error");
        });
      });
    }
    if (window.NDS && window.NDS.reveal) window.NDS.reveal(component);
  }

  function createPageFeedbackForm(config, context) {
    var form = el("form", "nds-form page-feedback-form");
    var component = el("div", "nds-user-feedback page-feedback-widget");
    var overview = el("div", "nds-user-feedback-overview");
    var answerButtons = el("div", "nds-user-feedback-answer-btn");
    var yesButton = el("button", "nds-btn nds-secondary nds-md");
    var noButton = el("button", "nds-btn nds-secondary nds-md");
    var status = el("div", "nds-user-feedback-status");
    var statistic = el("p", "nds-user-feedback-statistic", config.statisticsText || "");
    var details = el("div", "nds-user-feedback-details");
    var optionsRoot = el("div", "nds-user-feedback-options");
    var commentContainer = el("div", "nds-form-container nds-user-feedback-comment");
    var commentHeader = el("div", "nds-form-header");
    var commentControl = el("div", "nds-form-control textarea-control");
    var textarea = document.createElement("textarea");
    var submitRow = el("div", "nds-user-feedback-submit");
    var agreement = el("span", "nds-user-feedback-agreement", config.agreementText || "");
    var submitButton = el("button", "nds-btn nds-primary nds-md nds-user-feedback-submit-btn");
    var closeButton = el("button", "nds-btn nds-subtle nds-md nds-user-feedback-close");
    var idPrefix = "page-feedback-" + context.pageKey.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();

    form.action = "#";
    form.method = "post";
    form.dataset.pageFeedbackForm = "true";
    component.dataset.pageFeedbackContext = JSON.stringify(context);
    component.setAttribute("data-feedback-key", context.pageKey || context.path || "");
    component.setAttribute("data-success-message", config.successMessage || "");
    component.setAttribute("data-error-message", config.errorMessage || "");

    yesButton.type = "button";
    yesButton.dataset.answer = "Yes";
    yesButton.append(el("span", "nds-label", config.yesLabel || "نعم"));
    noButton.type = "button";
    noButton.dataset.answer = "No";
    noButton.append(el("span", "nds-label", config.noLabel || "لا"));
    answerButtons.append(yesButton, noButton);

    status.hidden = true;
    statistic.hidden = !hasText(config.statisticsText);
    overview.append(el("p", "nds-user-feedback-question", config.question || "هل كانت هذه الصفحة مفيدة؟"), answerButtons, status, statistic);

    appendFeedbackOptions(optionsRoot, feedbackLines(config.yesOptions), {
      className: "nds-why-yes",
      idPrefix: idPrefix + "-yes",
      name: "feedbackYesReasons",
      label: config.yesReasonsLabel || "",
      errorMessage: config.yesReasonsLabel || ""
    });
    appendFeedbackOptions(optionsRoot, feedbackLines(config.noOptions), {
      className: "nds-why-no",
      idPrefix: idPrefix + "-no",
      name: "feedbackNoReasons",
      label: config.noReasonsLabel || "",
      errorMessage: config.noReasonsLabel || ""
    });

    commentHeader.append(el("label", "", config.commentLabel || "ملاحظات إضافية"));
    textarea.className = "nds-input";
    textarea.name = "feedbackComment";
    textarea.rows = 4;
    textarea.maxLength = 2000;
    textarea.placeholder = config.commentPlaceholder || "";
    commentControl.append(textarea);
    commentContainer.append(commentHeader, commentControl);
    details.hidden = true;
    details.append(optionsRoot, commentContainer);

    submitButton.type = "button";
    submitButton.dataset.answer = "submit";
    submitButton.append(el("span", "nds-label", config.submitLabel || "إرسال التقييم"));
    closeButton.type = "button";
    closeButton.hidden = true;
    closeButton.append(el("span", "nds-label", config.closeLabel || "إغلاق"));
    submitRow.hidden = true;
    submitRow.append(agreement, submitButton);

    component.append(overview, details, submitRow, closeButton);
    form.append(component);
    return form;
  }

  function collectPageFeedbackPayload(component) {
    var context;
    var answer = component && component.dataset.answer || "";
    var selector = answer === "yes" ? ".nds-why-yes input:checked" : ".nds-why-no input:checked";
    if (answer !== "yes" && answer !== "no") return null;
    try {
      context = JSON.parse(component.dataset.pageFeedbackContext || "{}");
    } catch (error) {
      context = {};
    }
    return {
      pageKey: context.pageKey || "",
      pageTitle: context.pageTitle || document.title || "",
      pageType: context.pageType || "",
      path: context.path || (window.location.pathname + window.location.search + window.location.hash),
      answer: answer,
      reasons: qsa(selector, component).map(function (input) { return input.value; }),
      comment: (qs("textarea", component) || {}).value || ""
    };
  }

  function renderPageFeedback(data) {
    var previous = qs("[data-page-feedback-root]");
    var main = qs("main");
    var config;
    var context;
    var section;
    var container;
    if (previous) previous.remove();
    if (!main || !shouldRenderPageFeedback(data)) return;
    config = pageFeedbackConfig(data);
    context = feedbackCurrentPageContext(data);
    if (!context) return;
    section = el("section", "nds-user-feedback-section page-feedback-section");
    section.setAttribute("data-page-feedback-root", "");
    section.setAttribute("aria-label", config.question || "تقييم الصفحة");
    container = el("div", "site-container page-feedback-container");
    container.append(createPageFeedbackForm(config, context));
    section.append(container);
    main.append(section);
    initializePageFeedbackWidget(section);
  }

  function footerPageItems(data) {
    return ((data && data.pages) || []).filter(function (item) {
      return item && item.showInFooter === true && hasText(item.title || item.slug) && !pageIsNavigationGroup(item, data);
    }).map(function (item) {
      return {
        label: item.title || item.slug,
        href: pageHref(item, data),
        key: "footer-page:" + item.slug
      };
    });
  }

  function allNavigationItems(data) {
    return baseNavigationItems(data)
      .concat(cardCollectionNavigationItems(data))
      .concat(pageNavigationItems(data));
  }

  function isCurrentNav(item, page, currentSlug) {
    if (page === "cards") {
      var currentCollection = currentCardCollection(appState.data || {});
      var cardSlug = currentCollection ? cardCollectionSlug(currentCollection, 0) : "";
      return item.key === "cards:" + cardSlug;
    }
    if (currentSlug) return item.key === "page:" + currentSlug;
    return (page === "home" && item.key === "home")
      || (page === "projects" && item.key === "projects")
      || (page === "pages" && item.key === "pages")
      || (page === "admin" && item.key === "admin");
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

  function createNavDropdownLink(item, page, currentSlug) {
    var link = el("a", "nds-btn nds-subtle nds-dropdown-item nav-pages-link");
    link.href = item.href;
    link.dataset.navKey = item.key;
    if (isCurrentNav(item, page, currentSlug)) link.dataset.state = "current";
    link.append(el("span", "nds-label", item.label));
    return link;
  }

  function createNavDropdown(item, page, currentSlug) {
    var li = el("li", "nds-nav-item nav-pages-item");
    var trigger = el("button", "nds-nav-link nds-btn nds-subtle nds-menu-btn nds-indicator nav-pages-trigger");
    var menu = el("div", "nds-dropdown-menu nds-fit nav-pages-menu");
    var content = el("div", "nds-dropdown-content");
    var columns = el("div", "nds-dropdown-columns nds-rowView nav-pages-columns");
    var list = el("div", "nds-list nav-pages-list");
    var isCurrent = isCurrentNav(item, page, currentSlug) || (item.children || []).some(function (child) {
      return isCurrentNav(child, page, currentSlug);
    });

    trigger.type = "button";
    trigger.dataset.navKey = item.key;
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    if (isCurrent) trigger.dataset.state = "current";
    trigger.append(el("span", "nds-label", item.label));
    trigger.append(el("span", "nav-caret"));

    (item.children || []).forEach(function (child) {
      list.append(createNavDropdownLink(child, page, currentSlug));
    });
    columns.append(list);
    content.append(columns);
    menu.append(content);
    li.append(trigger);
    li.append(menu);
    return li;
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

    cardCollectionNavigationItems(data).forEach(function (item) {
      var li = el("li", "nds-nav-item");
      li.append(createNavLink(item, page, currentSlug));
      list.append(li);
    });

    pageNavigationTree(data).forEach(function (item) {
      var li;
      if (item.children && item.children.length) {
        list.append(createNavDropdown(item, page, currentSlug));
        return;
      }
      li = el("li", "nds-nav-item");
      li.append(createNavLink(item, page, currentSlug));
      list.append(li);
    });

    renderMobileAccountMenu(data);
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
    renderCookieConsent(data);
  }

  function normalizeGoogleAnalyticsId(value) {
    var id = String(value || "").trim().toUpperCase();
    if (/^(G|GT|AW)-[A-Z0-9-]+$/.test(id) || /^UA-\d+-\d+$/.test(id)) return id;
    return "";
  }

  function activeGoogleAnalyticsIds(data) {
    var seen = {};
    return ((data && data.integrations) || []).filter(function (integration) {
      return integration && integration.enabled !== false && integration.type === "analytics";
    }).map(function (integration) {
      return normalizeGoogleAnalyticsId(integration.publicKey || integration.measurementId || integration.measurement_id);
    }).filter(function (id) {
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function analyticsConsentState() {
    if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.getConsent) {
      return window.NDS.Cookies.getConsent();
    }
    var match = document.cookie.match(/(?:^|;\s*)cookieConsent=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setGoogleAnalyticsDisabled(ids, disabled) {
    (ids || []).forEach(function (id) {
      window["ga-disable-" + id] = Boolean(disabled);
    });
  }

  function ensureGtagBase() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
  }

  function loadGoogleAnalyticsScript(primaryId) {
    var existing = qs("#siteGoogleAnalyticsScript");
    if (existing || analyticsScriptLoaded || !primaryId) return;
    var script = document.createElement("script");
    script.id = "siteGoogleAnalyticsScript";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(primaryId);
    document.head.append(script);
    analyticsScriptLoaded = true;
  }

  function configureGoogleAnalytics(ids) {
    var pageKey = window.location.pathname + window.location.search + window.location.hash;
    var pageLocation = window.location.href;
    ensureGtagBase();
    if (!window.__siteGtagStarted) {
      window.gtag("js", new Date());
      window.__siteGtagStarted = true;
    }
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied"
    });
    ids.forEach(function (id) {
      if (analyticsConfiguredPageKeys[id] === pageKey) return;
      window.gtag("config", id, {
        page_path: pageKey,
        page_location: pageLocation
      });
      analyticsConfiguredPageKeys[id] = pageKey;
    });
  }

  function renderAnalyticsIntegrations(data) {
    var ids = activeGoogleAnalyticsIds(data);
    var allKnownIds = analyticsKnownIds.concat(ids).filter(function (id, index, list) {
      return id && list.indexOf(id) === index;
    });
    var consent = analyticsConsentState();
    analyticsKnownIds = ids.slice();
    window.GA_TRACKING_ID = ids.length === 1 ? ids[0] : ids.slice();
    if (!ids.length) {
      setGoogleAnalyticsDisabled(allKnownIds, true);
      return;
    }
    if (consent !== "accepted") {
      setGoogleAnalyticsDisabled(allKnownIds, true);
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied"
        });
      }
      return;
    }
    setGoogleAnalyticsDisabled(allKnownIds.filter(function (id) {
      return ids.indexOf(id) === -1;
    }), true);
    setGoogleAnalyticsDisabled(ids, false);
    loadGoogleAnalyticsScript(ids[0]);
    configureGoogleAnalytics(ids);
  }

  function defaultCookieConsentConfig() {
    var defaults = window.DEFAULT_SITE_DATA && window.DEFAULT_SITE_DATA.footer && window.DEFAULT_SITE_DATA.footer.cookies;
    return Object.assign({
      enabled: true,
      title: "ملفات تعريف الارتباط",
      content: "يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربة التصفح وتسهيل الاستخدام. بالمتابعة في استخدام الموقع، فإنك توافق على استخدام ملفات الارتباط.",
      acceptLabel: "قبول",
      declineLabel: "رفض",
      linkPageSlugs: []
    }, defaults || {});
  }

  function footerCookieConsentConfig(data) {
    var footer = data && data.footer || {};
    var config = Object.assign(defaultCookieConsentConfig(), footer.cookies || {});
    config.enabled = config.enabled !== false;
    config.linkPageSlugs = Array.isArray(config.linkPageSlugs) ? config.linkPageSlugs : [];
    return config;
  }

  function cookieLinkMarkup(link, id) {
    var external = /^https?:\/\//i.test(link.href);
    if (!hasText(link.href) || !hasText(link.label)) return "";
    return '<a href="' + escapeHtml(link.href) + '" id="' + id + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : "") + '>' + escapeHtml(link.label) + '</a>';
  }

  function cookieLinksMarkup(data, config) {
    var selectedSlugs = config.linkPageSlugs || [];
    var links = footerPageItems(data).filter(function (item) {
      var key = String(item.key || "").replace(/^footer-page:/, "");
      return selectedSlugs.indexOf(key) !== -1;
    }).map(function (item, index) {
      return cookieLinkMarkup({
        label: item.label,
        href: normalizeFooterLinkUrl(item.href)
      }, "ndsCookiesFooterLink" + index);
    }).filter(Boolean);
    if (!links.length) return "";
    return '<div class="nds-cookie-popup-links">' + links.join('<span aria-hidden="true">|</span>') + '</div>';
  }

  function renderCookieConsent(data, options) {
    options = options || {};
    var config = footerCookieConsentConfig(data);
    var popup = qs("#ndsCookiesPopup");
    var wasHidden = !popup || popup.hasAttribute("hidden");
    var isAdminPage = document.body && document.body.dataset.page === "admin";

    if (!config.enabled) {
      if (popup) popup.remove();
      return;
    }

    if (!popup) {
      popup = document.createElement("div");
      popup.id = "ndsCookiesPopup";
      popup.hidden = true;
      document.body.append(popup);
    }

    popup.className = "nds-cookie-popup nds-card";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-labelledby", "ndsCookiesTitle");
    popup.setAttribute("aria-live", "polite");
    popup.innerHTML = [
      '<div class="nds-card-header">',
      '<span class="nds-featured-icon nds-circle">',
      '<i class="nds-icon nds-hgi-cookie" aria-hidden="true"></i>',
      '</span>',
      '<button id="ndsCookiesCloseBtn" class="nds-close nds-btn nds-subtle" type="button" aria-label="إغلاق">',
      '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>',
      '</button>',
      '</div>',
      '<div class="nds-card-content">',
      '<div class="nds-card-text">',
      '<h3 class="nds-card-title" id="ndsCookiesTitle">' + escapeHtml(config.title || "ملفات تعريف الارتباط") + '</h3>',
      '<p class="nds-card-description" id="ndsCookiesContent">' + escapeHtml(config.content || "") + '</p>',
      '</div>',
      cookieLinksMarkup(data, config),
      '</div>',
      '<div class="nds-card-actions">',
      '<button class="nds-btn nds-primary nds-full" type="button" id="ndsCookiesAcceptBtn" data-accept-title="تم القبول" data-accept-message="تم قبول ملفات الارتباط">',
      '<span class="nds-label">' + escapeHtml(config.acceptLabel || "قبول") + '</span>',
      '</button>',
      '<button class="nds-btn nds-secondary nds-full" type="button" id="ndsCookiesDeclineBtn" data-decline-title="تم الرفض" data-decline-message="تم رفض ملفات الارتباط الاختيارية">',
      '<span class="nds-label">' + escapeHtml(config.declineLabel || "رفض") + '</span>',
      '</button>',
      '</div>'
    ].join("");

    if (wasHidden && !options.preview) popup.hidden = true;
    else popup.removeAttribute("hidden");

    if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.init && (!isAdminPage || options.preview)) {
      window.NDS.Cookies.init();
    }
    ["ndsCookiesAcceptBtn", "ndsCookiesDeclineBtn"].forEach(function (buttonId) {
      var button = qs("#" + buttonId, popup);
      if (!button) return;
      button.addEventListener("click", function () {
        window.setTimeout(function () {
          renderAnalyticsIntegrations(appState.data || data);
        }, 0);
      });
    });
    if (options.preview) {
      if (window.NDS && window.NDS.Cookies && window.NDS.Cookies.show) {
        window.NDS.Cookies.show();
      } else {
        popup.removeAttribute("hidden");
      }
    }
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
    var pageLinks = footerPageItems(data).map(function (item) {
      return {
        label: item.label,
        href: item.href
      };
    });
    return customLinks.concat(pageLinks);
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
    delete document.body.dataset.siteOverlay;
    clearSiteBackdropSurfaces();
  }

  function closeAccountOverlays() {
    dismissNdsHeaderOverlays();
    qsa(".admin-persona-dropdown, .account-menu-item, .mobile-account-dropdown").forEach(function (root) {
      root.removeAttribute("data-state");
      qsa(".account-persona-trigger, .mobile-account-trigger, .header-admin-link, .nav-admin-link, .account-login-trigger, [data-login-trigger]", root).forEach(function (trigger) {
        removeDataStateTokens(trigger, ["active", "open", "opened", "opening", "closing"]);
        trigger.setAttribute("aria-expanded", "false");
      });
    });
    forceClearBackdrop();
  }

  function settleLoginSuccessOverlays() {
    closeAccountOverlays();
    window.requestAnimationFrame(closeAccountOverlays);
    window.setTimeout(closeAccountOverlays, 180);
  }

  function logoutButtons(trigger) {
    var buttons = [];
    if (trigger) buttons.push(trigger);
    qsa("[data-account-action='logout'], [data-admin-persona-logout], #logoutBtn, .account-persona-trigger, .mobile-account-trigger, .header-admin-link, .nav-admin-link, .account-login-trigger, .site-header [data-login-trigger]").forEach(function (button) {
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
          settleLoginSuccessOverlays();
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

  function saveNotifications(items, options) {
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
    if (!(options && options.silent)) window.dispatchEvent(new CustomEvent("site:notificationschange"));
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
    refreshNotificationScrollMore(scope);
  }

  function refreshNotificationScrollMore(scope) {
    if (!(window.NDS && window.NDS.ScrollMore && window.NDS.ScrollMore.checkOverflow)) return;
    var refresh = function () {
      qsa(".notification-dropdown .nds-scroll-more", scope || document).forEach(function (scrollMore) {
        window.NDS.ScrollMore.checkOverflow(scrollMore);
      });
    };
    window.requestAnimationFrame(refresh);
    window.setTimeout(refresh, 120);
  }

  function settleNotificationDropdownOpen(root) {
    if (!root) return;
    var state = root.dataset.state || "";
    if (state.indexOf("open") === -1 && state.indexOf("opened") === -1) return;
    root.dataset.state = "open opened";
    root.setAttribute("data-state", "open opened");
    syncNotificationTriggerState(root);
    scheduleHeaderActionDropdownFit(root);
    refreshNotificationComponents(root);
  }

  function stabilizeNotificationDropdown(root) {
    if (!root || !window.matchMedia("(min-width: 961px)").matches) return;
    if (root._notificationStableTimer) window.clearTimeout(root._notificationStableTimer);
    root.dataset.notificationStable = "true";
    root.setAttribute("data-notification-stable", "true");
    root._notificationStableTimer = window.setTimeout(function () {
      delete root.dataset.notificationStable;
      root.removeAttribute("data-notification-stable");
      root._notificationStableTimer = null;
    }, 360);
  }

  function prepareNotificationDropdownMutation(root) {
    if (!root) return;
    root.dataset.state = "open opened";
    root.setAttribute("data-state", "open opened");
    syncNotificationTriggerState(root);
    stabilizeNotificationDropdown(root);
    scheduleHeaderActionDropdownFit(root);
    syncSiteDropdownBackdrop();
  }

  function notificationRootMode(root) {
    return root ? "desktop" : "";
  }

  function notificationRootForMode(mode) {
    return qs("[data-notifications-root]");
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
    scheduleHeaderActionDropdownFit(root);
    syncSiteDropdownBackdrop();
    settleNotificationDropdownOpen(root);
  }

  function keepNotificationDropdownOpen(root, options) {
    var mode = notificationRootMode(root);
    if (options && options.instant) {
      root = notificationRootForMode(mode);
      prepareNotificationDropdownMutation(root);
      refreshNotificationComponents(root);
      return;
    }
    window.requestAnimationFrame(function () {
      setNotificationDropdownOpen(notificationRootForMode(mode));
    });
    window.setTimeout(function () {
      setNotificationDropdownOpen(notificationRootForMode(mode));
    }, 80);
    window.setTimeout(function () {
      settleNotificationDropdownOpen(notificationRootForMode(mode));
    }, 260);
  }

  function animateNotificationRemoval(item, onComplete) {
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      onComplete();
    };
    if (!item || !window.matchMedia("(min-width: 961px)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    item.dataset.notificationRemoving = "true";
    item.style.blockSize = item.getBoundingClientRect().height + "px";
    item.style.overflow = "hidden";
    item.style.transition = "block-size 180ms ease, opacity 140ms ease, transform 180ms ease, border-color 180ms ease";
    item.offsetHeight;
    item.style.opacity = "0";
    item.style.transform = "translateY(-4px)";
    item.style.blockSize = "0px";
    item.style.borderColor = "transparent";
    item.addEventListener("transitionend", function (event) {
      if (event.propertyName === "block-size" || event.propertyName === "height") finish();
    }, { once: true });
    window.setTimeout(finish, 220);
  }

  function forgetNotificationDropdownOpen() {
    try {
      window.sessionStorage.removeItem(NOTIFICATIONS_KEEP_OPEN_KEY);
    } catch (error) {}
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
    if ((existing.dataset.state || "").indexOf("open") !== -1) {
      scheduleHeaderActionDropdownFit(existing);
    }
  }

  function openNotifications() {
    var trigger = qs("[data-notifications-root] [data-notifications-trigger]");
    if (trigger) trigger.click();
  }

  function dismissNdsHeaderOverlays() {
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
      window.NDS.Mainnav.dismissOverlays();
      return true;
    }
    return false;
  }

  function isVisibleBackdropSurface(element) {
    return Boolean(element && (element.offsetParent !== null || element.getClientRects().length > 0));
  }

  function hasVisibleManagedOverlay() {
    if (isVisibleBackdropSurface(qs(".nds-modal:not([hidden])[aria-hidden='false']"))) return true;
    return qsa([
      ".nds-dropdown[data-state~='open'], .nds-dropdown[data-state~='opening']",
      ".nav-pages-item[data-state~='open'], .nav-pages-item[data-state~='opening']",
      "[data-nav-panel][data-state~='open'], [data-nav-panel][data-state~='opening']",
      ".nds-sidemenu[data-state~='open'], .nds-sidemenu[data-state~='opening']",
      ".nds-ipv-popup-overlay.nds-ipv-active"
    ].join(", ")).some(isVisibleBackdropSurface);
  }

  function headerOverlaySelector() {
    return [
      ".site-header .header-actions .nds-dropdown[data-state~='open']",
      ".site-header .header-actions .nds-dropdown[data-state~='opening']",
      ".site-header .header-actions .nds-dropdown[data-state~='opened']",
      ".site-header .nds-nav-minimal .nds-dropdown[data-state~='open']",
      ".site-header .nds-nav-minimal .nds-dropdown[data-state~='opening']",
      ".site-header .nds-nav-minimal .nds-dropdown[data-state~='opened']",
      ".site-header .admin-persona-dropdown[data-state~='open']",
      ".site-header .admin-persona-dropdown[data-state~='opening']",
      ".site-header .admin-persona-dropdown[data-state~='opened']",
      ".site-header .nav-pages-item[data-state~='open']",
      ".site-header .nav-pages-item[data-state~='opening']",
      ".site-header .nav-pages-item[data-state~='opened']"
    ].join(", ");
  }

  function openHeaderOverlayRoots() {
    return qsa(headerOverlaySelector()).filter(function (root) {
      return root.offsetParent !== null || root.getClientRects().length > 0;
    });
  }

  function clearSiteBackdropSurfaces() {
    qsa("[data-site-backdrop-surface]").forEach(function (root) {
      delete root.dataset.siteBackdropSurface;
    });
  }

  function hasOpenCustomHeaderDropdown() {
    return openHeaderOverlayRoots().length > 0;
  }

  function shouldUseSiteHeaderBackdrop() {
    return !window.matchMedia("(max-width: 960px)").matches;
  }

  function hasBlockingBackdropOwner() {
    if (!(window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.getOwners)) return false;
    return window.NDS.Backdrop.getOwners().some(function (owner) {
      return owner === "modal" || owner === "sidemenu" || owner === "ipv";
    });
  }

  function dismissSiteBackdropOverlays() {
    closeNavDropmenus(null, { dismissNative: true });
    closeHeaderActionDropdowns({ localOnly: true });
    closeNotificationDropdown({ localOnly: true });
    closeMobileAccountDropdown({ localOnly: true });
    setSiteDropdownBackdropActive(false);
  }

  function setSiteDropdownBackdropActive(active) {
    var roots = active ? openHeaderOverlayRoots() : [];
    var lockScroll = roots.some(function (root) {
      return root.classList && root.classList.contains("nav-pages-item");
    });
    clearSiteBackdropSurfaces();
    if (active && !shouldUseSiteHeaderBackdrop()) {
      delete document.body.dataset.siteOverlay;
      if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.hide) {
        window.NDS.Backdrop.hide("site-header");
      }
      return;
    }
    if (active && hasBlockingBackdropOwner()) {
      delete document.body.dataset.siteOverlay;
      if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.hide) {
        window.NDS.Backdrop.hide("site-header");
      }
      return;
    }
    if (active && roots.length && window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.show) {
      roots.forEach(function (root) {
        root.dataset.siteBackdropSurface = "true";
      });
      document.body.dataset.siteOverlay = "header";
      window.NDS.Backdrop.show({
        owner: "site-header",
        context: "header",
        surface: roots,
        preventScroll: lockScroll,
        zIndex: 1195,
        onClick: dismissSiteBackdropOverlays
      });
      return;
    }
    delete document.body.dataset.siteOverlay;
    if (window.NDS && window.NDS.Backdrop && window.NDS.Backdrop.hide) {
      window.NDS.Backdrop.hide("site-header");
    }
    resetBackdropWhenIdle();
  }

  function syncSiteDropdownBackdrop() {
    var hasOpen = hasOpenCustomHeaderDropdown();
    setSiteDropdownBackdropActive(hasOpen);
    if (!hasOpen) resetBackdropWhenIdle();
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
        delete document.body.dataset.siteOverlay;
        clearSiteBackdropSurfaces();
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
    qsa("[data-notifications-root]").forEach(syncNotificationTriggerState);
  }

  function queueNotificationTriggerStateSync(root) {
    var sync = root ? function () { syncNotificationTriggerState(root); } : syncAllNotificationTriggerStates;
    window.requestAnimationFrame(function () {
      sync();
    });
    window.setTimeout(function () {
      sync();
      if (root) settleNotificationDropdownOpen(root);
    }, 360);
  }

  function handleNotificationActionClick(event) {
    var action = event.target.closest("[data-notification-view], [data-notification-read], [data-notification-dismiss]");
    var item = action && action.closest("[data-notification-id]");
    var actionRoot = item && item.closest("[data-notifications-root]");
    if (!action || !item || !actionRoot) return false;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    if (action.matches("[data-notification-view]")) {
      var viewHref = action.getAttribute("href") || "notifications.html";
      forgetNotificationDropdownOpen();
      saveNotifications(loadNotifications().filter(function (notification) {
        return notification.id !== item.dataset.notificationId;
      }), { silent: true });
      navigateAfterHeaderAction(action.href || viewHref);
      return true;
    }

    if (action.matches("[data-notification-read]")) {
      prepareNotificationDropdownMutation(actionRoot);
      saveNotifications(loadNotifications().map(function (notification) {
        if (notification.id === item.dataset.notificationId) markNotificationRead(notification);
        return notification;
      }));
      keepNotificationDropdownOpen(actionRoot, { instant: true });
      return true;
    }

    if (action.matches("[data-notification-dismiss]")) {
      var notificationId = item.dataset.notificationId;
      prepareNotificationDropdownMutation(actionRoot);
      animateNotificationRemoval(item, function () {
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== notificationId;
        }));
        keepNotificationDropdownOpen(actionRoot, { instant: true });
      });
      return true;
    }

    return false;
  }

  function setupNotifications() {
    document.addEventListener("click", handleNotificationActionClick, true);

    document.addEventListener("click", function (event) {
      queueNotificationTriggerStateSync();

      if (event.target.closest(".mobile-account-trigger")) {
        closeNotificationDropdown({ localOnly: true });
      }

      if (event.target.closest(".nds-mainNav-toggler")) {
        closeNotificationDropdown({ localOnly: true });
        closeMobileAccountDropdown({ localOnly: true });
      }

      if (event.target.closest("[data-notifications-trigger]")) {
        var notificationTrigger = event.target.closest("[data-notifications-trigger]");
        var notificationRoot = notificationTrigger && notificationTrigger.closest("[data-notifications-root]");
        queueNotificationTriggerStateSync(notificationRoot);
        if (!notificationTrigger.closest("[data-nav-panel]")) closeNavPanel();
      }

      if (event.target.closest(".header-admin-link, .mobile-account-trigger, .nds-mainNav-toggler")) {
        closeNotificationDropdown({ localOnly: true });
      }
    });

    window.addEventListener("site:notificationschange", renderNotifications);
    window.addEventListener("resize", renderNotifications);
  }

  function closeNotificationDropdown(options) {
    if (!(options && options.localOnly)) dismissNdsHeaderOverlays();
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
    syncSiteDropdownBackdrop();
    resetBackdropWhenIdle();
  }

  function closeHeaderOverlaysBeforeNavigation() {
    pinBodyScrollLockToTop();
    closeNotificationDropdown({ localOnly: true });
    closeMobileAccountDropdown({ localOnly: true });
    closeHeaderActionDropdowns({ localOnly: true });
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    clearNavPanelState();
    dismissNdsHeaderOverlays();
    clearNavPanelState();
    forceClearBackdrop();
  }

  function navigateAfterHeaderAction(href) {
    closeHeaderOverlaysBeforeNavigation();
    window.location.assign(href || "notifications.html");
  }

  function closeMobileAccountDropdown(options) {
    if (!(options && options.localOnly)) dismissNdsHeaderOverlays();
    syncSiteDropdownBackdrop();
    resetBackdropWhenIdle();
  }

  function closeHeaderActionDropdowns(options) {
    if (!(options && options.localOnly)) dismissNdsHeaderOverlays();
    qsa(".site-header .header-actions .nds-dropdown, .site-header .nds-nav-minimal .nds-dropdown").forEach(function (root) {
      root.dataset.state = "";
      root.removeAttribute("data-state");
      qsa("[aria-expanded], [data-state]", root).forEach(function (trigger) {
        if (trigger.classList && trigger.classList.contains("nav-pages-trigger")) return;
        removeDataStateTokens(trigger, ["active", "open", "opened", "opening", "closing"]);
        if (trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", "false");
      });
    });
    syncSiteDropdownBackdrop();
    resetBackdropWhenIdle();
  }

  function closeNavPanel(options) {
    var nav = qs("[data-nav-panel]");
    if (!nav || (nav.dataset.state || "").split(/\s+/).indexOf("open") === -1) return;

    if (!(options && options.instant) && window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.toggleNavbar) {
      window.NDS.Mainnav.toggleNavbar();
      return;
    }

    clearNavPanelState();
  }

  function clearNavPanelState() {
    var nav = qs("[data-nav-panel]");
    var toggler = qs(".nds-mainNav-toggler");
    var button = qs("[data-nav-toggle]");
    var closingTokens = ["active", "open", "opened", "opening", "closing"];
    if (nav) {
      removeDataStateTokens(nav, closingTokens);
      nav.style.removeProperty("height");
      nav.style.removeProperty("overflow");
      qsa(".nds-dropdown, .nav-pages-item", nav).forEach(function (root) {
        removeDataStateTokens(root, closingTokens);
        qsa("[aria-expanded], [data-state]", root).forEach(function (node) {
          removeDataStateTokens(node, closingTokens);
          if (node.hasAttribute("aria-expanded")) node.setAttribute("aria-expanded", "false");
        });
      });
    }
    if (toggler) {
      removeDataStateTokens(toggler, closingTokens);
    }
    if (button) {
      removeDataStateTokens(button, closingTokens);
      button.setAttribute("aria-expanded", "false");
    }
  }

  function isMobileNavPanelOpen() {
    var nav = qs("[data-nav-panel]");
    return Boolean(nav)
      && window.matchMedia("(max-width: 960px)").matches
      && (nav.dataset.state || "").split(/\s+/).indexOf("open") !== -1;
  }

  function pinBodyScrollLockToTop() {
    if (!document.body || !document.body.style) return;
    if (document.body.style.top) document.body.style.top = "0px";
    if (document.body.dataset && (document.body.style.top || document.body.dataset.ndsScrollLockY)) {
      document.body.dataset.ndsScrollLockY = "0";
    }
  }

  function settleCurrentPageNavClose() {
    pinBodyScrollLockToTop();
    clearNavPanelState();
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
      window.NDS.Mainnav.dismissOverlays();
    }
    clearNavPanelState();
    closeHeaderActionDropdowns({ localOnly: true });
    closeNotificationDropdown({ localOnly: true });
    closeMobileAccountDropdown({ localOnly: true });
    resetBackdropWhenIdle();
  }

  function closeHeaderDropdownsForThemeToggle() {
    closeHeaderActionDropdowns({ localOnly: true });
    closeNotificationDropdown({ localOnly: true });
    closeMobileAccountDropdown({ localOnly: true });
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    syncSiteDropdownBackdrop();
    resetBackdropWhenIdle();
  }

  function closeCurrentPageNavOverlays() {
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
      window.NDS.Mainnav.dismissOverlays();
    }
    settleCurrentPageNavClose();
    window.requestAnimationFrame(settleCurrentPageNavClose);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(settleCurrentPageNavClose);
    });
    [80, 260, 520, 860].forEach(function (delay) {
      window.setTimeout(settleCurrentPageNavClose, delay);
    });
  }

  function closeMobileNavPanelAfterNavigation() {
    if (!isMobileNavPanelOpen()) return;
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    closeNotificationDropdown({ localOnly: true });
    closeMobileAccountDropdown({ localOnly: true });
    closeNavPanel();
    window.setTimeout(function () {
      closeNavPanel({ instant: true });
      closeNavDropmenus(null, { dismissNative: false, instant: true });
      resetBackdropWhenIdle();
    }, 360);
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
      var navScrollTrigger = event.target.closest("[data-nav-scroll], .nds-show-more");
      var headerActionTrigger = event.target.closest(".site-header .header-actions .nds-dropdown > .nds-nav-link, .site-header .nds-nav-minimal .nds-dropdown > .nds-nav-link");
      var mobileNavLink = event.target.closest("[data-nav-panel] .nds-nav-primary a[href]");
      var hashPageHomeLink = event.target.closest("a[href]");
      var currentPageNavLink = event.target.closest(".site-header a[href]");
      if (isHomeNavigationTarget(hashPageHomeLink)) {
        setHomeTopNavigationPending();
      }
      if (isHashPageHomeNavigation(hashPageHomeLink)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        navigateHashPageToHome(hashPageHomeLink);
        return;
      }
      if (currentPageNavLink && isCurrentPageNavigation(currentPageNavLink)) {
        var currentNavScrollLeft = currentScrollLeft();
        var currentNavScrollTop = currentScrollTop();
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (currentNavScrollTop <= TOPBAR_SCROLL_TRIGGER_PX) {
          preserveHeaderActionScrollPosition(currentNavScrollLeft, currentNavScrollTop);
        }
        closeNavDropmenus(null, { dismissNative: false, instant: true });
        closeCurrentPageNavOverlays();
        updateCurrentPageUrl(currentPageNavLink);
        queueCurrentPageScrollToTop();
        return;
      }
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        closeHeaderActionDropdowns({ localOnly: !shouldUseSiteHeaderBackdrop() });
        toggleNavPageDropdown(trigger, event);
        return;
      }
      if (navScrollTrigger) {
        return;
      }
      if (mobileNavLink) {
        closeMobileNavPanelAfterNavigation();
      }
      if (headerActionTrigger) {
        var header = event.target.closest(".site-header");
        var actionScrollLeft = currentScrollLeft();
        var actionScrollTop = currentScrollTop();
        preserveHeaderActionScrollPosition(actionScrollLeft, actionScrollTop);
        if (header) header.dataset.headerActionOpening = "true";
        prepareHeaderActionDropdown(headerActionTrigger);
        window.setTimeout(function () {
          if (header) delete header.dataset.headerActionOpening;
        }, 360);
      }
      if (event.target.closest(".nav-pages-menu a")) {
        closeNavDropmenus(null, { dismissNative: false });
        scheduleNavPageDropdownSync();
        return;
      }
      if (event.target.closest(".nds-dropdown > .nds-nav-link")) {
        if (!event.target.closest("[data-notifications-trigger]")) {
          closeNotificationDropdown({ localOnly: true });
        }
        if (!headerActionTrigger) {
          closeNavDropmenus(null, { dismissNative: false, instant: true });
          scheduleNavPageDropdownSync();
        }
        return;
      }
      if (!event.target.closest(".nav-pages-item")) {
        closeNavDropmenus(null, { dismissNative: false });
      }
      if (hasNativeMainnavDropdowns()) {
        scheduleNavPageDropdownSync();
        return;
      }
    }, true);

    window.addEventListener("resize", function () {
      fitOpenNavPageDropdowns();
      fitOpenHeaderActionDropdowns();
    }, { passive: true });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      closeNavDropmenus();
      scheduleNavPageDropdownSync();
    });
  }

  function normalizedPagePath(url) {
    var path = (url && url.pathname || "").replace(/\/+$/, "");
    return path.replace(/\/index\.html$/i, "");
  }

  function isCurrentPageNavigation(link) {
    var href = link && link.getAttribute("href");
    var target = link && link.getAttribute("target");
    var url;
    if (!href || href.charAt(0) === "#" || target && target !== "_self") return false;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return false;
    }
    if (url.origin !== window.location.origin || url.hash) return false;
    if (window.location.hash) return false;
    return normalizedPagePath(url) === normalizedPagePath(window.location);
  }

  function isIndexPageUrl(url) {
    var path = (url && url.pathname || "").replace(/\/+$/, "");
    var lastSegment = (path.split("/").pop() || "").toLowerCase();
    return !lastSegment || lastSegment === "index.html" || lastSegment === "biography_copy";
  }

  function isHomeNavigationTarget(link) {
    var href = link && link.getAttribute("href");
    var target = link && link.getAttribute("target");
    var url;
    if (!href || href.charAt(0) === "#" || target && target !== "_self") return false;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return false;
    }
    return url.origin === window.location.origin && !url.hash && isIndexPageUrl(url);
  }

  function isHashPageHomeNavigation(link) {
    var href = link && link.getAttribute("href");
    var target = link && link.getAttribute("target");
    var url;
    if (!href || href.charAt(0) === "#" || target && target !== "_self") return false;
    if (!window.location.hash || !getPageSlug()) return false;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return false;
    }
    if (url.origin !== window.location.origin || url.hash) return false;
    return isIndexPageUrl(url) && normalizedPagePath(url) === normalizedPagePath(window.location);
  }

  function navigateHashPageToHome(link) {
    beginHomeTopPin();
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    closeCurrentPageNavOverlays();
    scrollToPageTopNow();
    pushCurrentPageUrl(link);
    scrollToPageTopNow();
    paintSite(appState.data || window.SiteStore.current());
    finishHomeTopPin();
  }

  function pushCurrentPageUrl(link) {
    var url;
    if (!window.history || !window.history.pushState) {
      updateCurrentPageUrl(link);
      return;
    }
    try {
      url = new URL(link.getAttribute("href"), window.location.href);
    } catch (error) {
      return;
    }
    window.history.pushState(null, "", url.pathname + url.search + url.hash);
  }

  function updateCurrentPageUrl(link) {
    var url;
    if (!window.history || !window.history.replaceState) return;
    try {
      url = new URL(link.getAttribute("href"), window.location.href);
    } catch (error) {
      return;
    }
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function scrollToPageTopNow() {
    pinBodyScrollLockToTop();
    try {
      window.scrollTo({ left: 0, top: 0, behavior: "auto" });
    } catch (error) {
      window.scrollTo(0, 0);
    }
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    appState.topbarScrollLastY = 0;
    setTopbarCollapsed(false);
  }

  function setHomeTopNavigationPending() {
    try {
      window.sessionStorage.setItem(HOME_TOP_NAVIGATION_KEY, String(Date.now()));
    } catch (error) {}
  }

  function clearHomeTopNavigationPending() {
    try {
      window.sessionStorage.removeItem(HOME_TOP_NAVIGATION_KEY);
    } catch (error) {}
  }

  function beginHomeTopPin() {
    document.documentElement.dataset.homeTopPin = "true";
    scrollToPageTopNow();
  }

  function finishHomeTopPin() {
    var releaseToken = ++homeTopPinReleaseToken;
    var startGuard = function () {
      var startedAt = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
      var guard = function () {
        var now = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
        if (releaseToken !== homeTopPinReleaseToken) return;
        scrollToPageTopNow();
        if (now - startedAt < 420) {
          window.requestAnimationFrame(guard);
          return;
        }
        window.setTimeout(function () {
          if (releaseToken !== homeTopPinReleaseToken) return;
          scrollToPageTopNow();
          clearHomeTopNavigationPending();
          delete document.documentElement.dataset.homeTopPin;
        }, 0);
      };
      scrollToPageTopNow();
      window.requestAnimationFrame(guard);
    };

    scrollToPageTopNow();
    if (document.readyState === "complete") {
      startGuard();
    } else {
      window.addEventListener("load", startGuard, { once: true });
    }
  }

  function queueScrollToPageTop() {
    beginHomeTopPin();
    finishHomeTopPin();
  }

  function queueCurrentPageScrollToTop() {
    if (currentScrollTop() <= TOPBAR_SCROLL_TRIGGER_PX) {
      setTopbarCollapsed(false);
      return;
    }
    scrollToPageTopNow();
    window.requestAnimationFrame(scrollToPageTopNow);
    window.setTimeout(scrollToPageTopNow, 80);
    window.setTimeout(scrollToPageTopNow, 220);
  }

  function shouldKeepHomePageAtTopOnLoad() {
    return Boolean(document.body)
      && document.body.dataset.page === "home"
      && !getPageSlug()
      && !window.location.hash;
  }

  function startHomeInitialTopGuard() {
    if (homeInitialTopGuardStarted || !shouldKeepHomePageAtTopOnLoad()) return;
    homeInitialTopGuardStarted = true;
    setManualScrollRestoration();
    queueScrollToPageTop();
    window.addEventListener("beforeunload", function () {
      setHomeTopNavigationPending();
      scrollToPageTopNow();
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

  function cleanSiteSearchTranscript(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function siteSearchCandidates(data) {
    data = data || {};
    data.home = data.home || {};
    data.settings = data.settings || {};
    var candidates = [];
    allNavigationItems(data).filter(function (item) {
      return !(item.children && item.children.length);
    }).forEach(function (item) {
      candidates.push({ href: item.href, text: item.label + " " + item.key });
    });
    visibleItems(data.projects || []).forEach(function (project, index) {
      candidates.push({
        href: projectHref(project, index),
        text: [project.title, project.slug, project.description, project.category, project.status, project.date].join(" ")
      });
    });
    routablePageItems(data).forEach(function (page) {
      candidates.push({
        href: pageHref(page, data),
        text: [page.title, page.slug, page.content].join(" ")
      });
    });
    publicCardCollections(data).forEach(function (collection, collectionIndex) {
      var href = cardCollectionHref(collection, collectionIndex);
      candidates.push({
        href: href,
        text: [collection.title, collection.slug, collection.description].join(" ")
      });
      visibleCollectionCards(collection).forEach(function (card) {
        candidates.push({
          href: href,
          text: [collection.title, card.title, card.subtitle, card.linkLabel].join(" ")
        });
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

  function siteSearchSpeechRecognitionConstructor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function siteSearchSpeechLanguage() {
    var lang = (document.documentElement.getAttribute("lang") || navigator.language || "ar-SA").trim();
    return lang.toLowerCase() === "ar" ? "ar-SA" : lang;
  }

  function updateSiteSearchClearState(form) {
    if (!form) return;
    var input = qs(".site-search-input, .nds-search-input", form);
    var clearButton = qs("[data-site-search-clear]", form);
    if (clearButton) clearButton.hidden = !(input && input.value);
  }

  function setSiteSearchVoiceState(button, isListening) {
    if (!button) return;
    var startLabel = button.dataset.startLabel || "البحث بالصوت";
    var stopLabel = button.dataset.stopLabel || "إيقاف الاستماع";
    if (isListening) {
      button.dataset.state = "listening";
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", stopLabel);
      button.setAttribute("title", stopLabel);
    } else {
      button.removeAttribute("data-state");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", startLabel);
      button.setAttribute("title", startLabel);
    }
  }

  function stopSiteSearchVoice() {
    if (!siteSearchRecognition) return;
    try {
      siteSearchRecognition.stop();
    } catch (error) {
      try {
        siteSearchRecognition.abort();
      } catch (abortError) {}
    }
  }

  function finishSiteSearchVoice(button) {
    setSiteSearchVoiceState(button || siteSearchVoiceButton, false);
    siteSearchRecognition = null;
    siteSearchVoiceButton = null;
  }

  function startSiteSearchVoice(button) {
    var form = button && button.closest("[data-site-search-form]");
    var input = form ? qs(".site-search-input, .nds-search-input", form) : null;
    var Recognition = siteSearchSpeechRecognitionConstructor();
    if (!form || !input) return;
    if (!Recognition) {
      button.hidden = true;
      showToast("البحث الصوتي غير مدعوم في هذا المتصفح", "info");
      return;
    }
    if (siteSearchRecognition && siteSearchVoiceButton === button) {
      stopSiteSearchVoice();
      return;
    }
    if (siteSearchRecognition) stopSiteSearchVoice();

    var recognition = new Recognition();
    var finalTranscript = "";
    var shouldSubmit = false;
    siteSearchRecognition = recognition;
    siteSearchVoiceButton = button;
    recognition.lang = siteSearchSpeechLanguage();
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      setSiteSearchVoiceState(button, true);
      input.focus();
    };
    recognition.onresult = function (event) {
      var interimTranscript = "";
      for (var i = event.resultIndex; i < event.results.length; i += 1) {
        var result = event.results[i];
        var transcript = result && result[0] ? result[0].transcript : "";
        if (result && result.isFinal) finalTranscript += " " + transcript;
        else interimTranscript += " " + transcript;
      }
      var nextValue = cleanSiteSearchTranscript(finalTranscript + " " + interimTranscript);
      if (!nextValue) return;
      input.value = nextValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      shouldSubmit = Boolean(cleanSiteSearchTranscript(finalTranscript));
    };
    recognition.onerror = function (event) {
      shouldSubmit = false;
      var message = "تعذر تشغيل البحث الصوتي";
      if (event && event.error === "not-allowed") message = "اسمح للمتصفح باستخدام الميكروفون لتفعيل البحث الصوتي";
      if (event && event.error === "no-speech") message = "لم يتم التقاط أي صوت";
      showToast(message, event && event.error === "no-speech" ? "info" : "error");
    };
    recognition.onend = function () {
      var submitForm = shouldSubmit && normalizeSiteSearchText(input.value);
      if (siteSearchRecognition !== recognition) {
        setSiteSearchVoiceState(button, false);
        return;
      }
      finishSiteSearchVoice(button);
      if (!submitForm) return;
      window.setTimeout(function () {
        if (!document.body.contains(form) || !normalizeSiteSearchText(input.value)) return;
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }, 120);
    };

    try {
      recognition.start();
    } catch (error) {
      finishSiteSearchVoice(button);
      showToast("تعذر تشغيل البحث الصوتي", "error");
    }
  }

  function enhanceSiteSearchControls(data) {
    var supportsVoice = Boolean(siteSearchSpeechRecognitionConstructor());
    var clearLabel = uiText(data, "searchClearLabel", "مسح البحث");
    var voiceLabel = uiText(data, "searchVoiceLabel", "البحث بالصوت");
    var voiceStopLabel = uiText(data, "searchVoiceStopLabel", "إيقاف الاستماع");
    qsa("[data-site-search-form]").forEach(function (form, index) {
      var control = qs(".nds-form-control", form);
      var input = qs(".site-search-input, .nds-search-input", form);
      if (!control || !input) return;
      control.classList.add("site-search-control");
      if (!input.id) input.id = "site-search-input-" + (index + 1);

      var action = qs("[data-site-search-actions]", control) || qs(".nds-form-action", control);
      if (!action) {
        action = document.createElement("div");
        action.className = "nds-form-action site-search-actions";
        control.append(action);
      }
      action.dataset.siteSearchActions = "true";
      action.classList.add("site-search-actions");

      var clearButton = qs("[data-site-search-clear]", action) || qs(".nds-clear", action);
      if (!clearButton) {
        clearButton = document.createElement("button");
        clearButton.type = "button";
        clearButton.className = "nds-btn nds-subtle nds-clear site-search-clear";
        clearButton.innerHTML = '<i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i>';
        action.append(clearButton);
      }
      clearButton.dataset.siteSearchClear = "true";
      clearButton.setAttribute("aria-label", clearLabel);
      clearButton.setAttribute("title", clearLabel);

      var voiceButton = qs("[data-site-search-voice]", action) || qs(".nds-voice-input", action);
      if (!voiceButton) {
        voiceButton = document.createElement("button");
        voiceButton.type = "button";
        voiceButton.className = "nds-btn nds-subtle site-search-voice";
        voiceButton.innerHTML = '<i class="nds-icon nds-hgi-mic-01" aria-hidden="true"></i>';
        action.append(voiceButton);
      }
      voiceButton.classList.remove("nds-voice-input");
      voiceButton.classList.add("site-search-voice");
      voiceButton.dataset.siteSearchVoice = "true";
      voiceButton.dataset.startLabel = voiceLabel;
      voiceButton.dataset.stopLabel = voiceStopLabel;
      voiceButton.hidden = !supportsVoice;
      if (!voiceButton.hidden && (voiceButton.dataset.state || "").indexOf("listening") === -1) {
        setSiteSearchVoiceState(voiceButton, false);
      }

      updateSiteSearchClearState(form);
    });
  }

  function setupSiteSearch() {
    enhanceSiteSearchControls(appState.data);
    document.addEventListener("click", function (event) {
      var clearButton = event.target.closest("[data-site-search-clear]");
      if (clearButton) {
        event.preventDefault();
        var clearForm = clearButton.closest("[data-site-search-form]");
        var clearInput = clearForm ? qs(".site-search-input, .nds-search-input", clearForm) : null;
        if (clearInput) {
          clearInput.value = "";
          clearInput.dispatchEvent(new Event("input", { bubbles: true }));
          clearInput.focus();
        }
        return;
      }

      var voiceButton = event.target.closest("[data-site-search-voice]");
      if (voiceButton) {
        event.preventDefault();
        startSiteSearchVoice(voiceButton);
        return;
      }

      var trigger = event.target.closest(".site-search-dropdown > .nds-nav-link");
      if (!trigger) return;
      var root = trigger.closest(".site-search-dropdown");
      window.setTimeout(function () {
        var input = root ? qs(".site-search-input", root) : null;
        if (input && root.dataset.state && root.dataset.state.indexOf("open") !== -1) input.focus();
      }, 180);
    });

    document.addEventListener("input", function (event) {
      var input = event.target.closest(".site-search-input, .nds-search-input");
      if (!input) return;
      updateSiteSearchClearState(input.closest("[data-site-search-form]"));
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

  function scheduleMobileNavScrollControlSync() {
    syncMobileNavScrollControls();
    window.requestAnimationFrame(syncMobileNavScrollControls);
    window.setTimeout(syncMobileNavScrollControls, 120);
    window.setTimeout(syncMobileNavScrollControls, 360);
    window.setTimeout(syncMobileNavScrollControls, 720);
  }

  function setupHeaderNavScrollEvents() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-nav-scroll]");
      if (!button) return;
      var panel = button.closest("[data-nav-panel]");
      var list = panel ? qs("[data-nav-list]", panel) : null;
      if (!list) return;
      if (window.matchMedia("(max-width: 960px)").matches) {
        if (!button.closest(".nds-show-more")) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        var verticalAmount = Math.max(180, Math.floor(list.clientHeight * 0.82));
        var atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 8;
        list.scrollTo({ top: atEnd ? 0 : list.scrollTop + verticalAmount, behavior: "smooth" });
        window.setTimeout(function () { updateMobileNavScrollControl(list); }, 260);
        return;
      }
      var amount = Math.max(180, Math.floor(list.clientWidth * 0.72));
      list.scrollBy({ left: button.dataset.navScroll === "next" ? -amount : amount, behavior: "smooth" });
    }, true);

    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-nav-toggle], .nds-mainNav-toggler")) return;
      scheduleMobileNavScrollControlSync();
    });

    document.addEventListener("wheel", function (event) {
      var list = event.target.closest("[data-nav-list]");
      if (event.target.closest(".nav-pages-menu")) {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.preventDefault();
        return;
      }
      if (!list || window.matchMedia("(max-width: 960px)").matches || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      list.scrollLeft += event.deltaY;
    }, { passive: false });

    document.addEventListener("scroll", function (event) {
      var list = event.target && event.target.matches && event.target.matches("[data-nav-list]") ? event.target : null;
      if (list) updateMobileNavScrollControl(list);
    }, true);
  }

  function syncMobileNavScrollControls() {
    if (!window.matchMedia("(max-width: 960px)").matches) return;
    qsa("[data-nav-panel] [data-nav-list]").forEach(updateMobileNavScrollControl);
  }

  function updateMobileNavScrollControl(list) {
    var panel = list && list.closest("[data-nav-panel]");
    var button = panel ? qs(".nds-show-more [data-nav-scroll]", panel) : null;
    var control = button ? button.closest(".nds-show-more") : null;
    if (!button) return;
    var listVisible = list.clientHeight > 0;
    if (!listVisible) return;
    var hasOverflow = listVisible && list.scrollHeight > list.clientHeight + 8;
    var atStart = !hasOverflow || list.scrollTop <= 8;
    var atEnd = hasOverflow && list.scrollTop + list.clientHeight >= list.scrollHeight - 8;
    if (listVisible) {
      list.dataset.state = [
        hasOverflow ? "has-more" : "",
        atStart ? "at-start" : "",
        atEnd ? "at-end" : ""
      ].filter(Boolean).join(" ");
    }
    if (control) {
      control.hidden = !hasOverflow;
      if (!hasOverflow) control.removeAttribute("data-nav-scroll-state");
    }
    button.hidden = !hasOverflow;
    if (!hasOverflow) {
      button.removeAttribute("data-nav-scroll-direction");
      return;
    }
    if (control) control.dataset.navScrollState = atEnd ? "at-end" : "has-more";
    button.dataset.navScrollDirection = atEnd ? "up" : "down";
    button.setAttribute("aria-label", atEnd ? "العودة إلى أعلى التنقل" : "عرض المزيد من روابط التنقل");
    button.title = atEnd ? "أعلى" : "المزيد";
    var icon = qs(".nds-icon", button);
    if (icon) {
      icon.classList.add("nds-hgi-arrow-down-01");
      icon.classList.remove("nds-hgi-arrow-up-01");
    }
  }

  function hasNativeMainnavDropdowns() {
    return Boolean(window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.toggleDropdown);
  }

  function hasOpenStateToken(element) {
    var states = (element && element.dataset && element.dataset.state || "").split(/\s+/);
    return states.indexOf("open") !== -1 || states.indexOf("opening") !== -1 || states.indexOf("opened") !== -1;
  }

  function isHeaderActionDropdown(element) {
    return Boolean(element && element.matches && element.matches(".site-header .header-actions .nds-dropdown, .site-header .nds-nav-minimal .nds-dropdown"));
  }

  function closeNavPagesForHeaderAction() {
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    scheduleNavPageDropdownSync();
  }

  function scheduleNavPagesCloseForHeaderAction() {
    closeNavPagesForHeaderAction();
    window.requestAnimationFrame(closeNavPagesForHeaderAction);
    window.setTimeout(closeNavPagesForHeaderAction, 80);
    window.setTimeout(closeNavPagesForHeaderAction, 260);
  }

  function setupHeaderMenuExclusivity() {
    var header = qs(".site-header");
    if (!header || headerMenuExclusivityObserver) return;
    headerMenuExclusivityObserver = new MutationObserver(function (mutations) {
      var shouldCloseNavPages = mutations.some(function (mutation) {
        return mutation.type === "attributes"
          && mutation.attributeName === "data-state"
          && isHeaderActionDropdown(mutation.target)
          && hasOpenStateToken(mutation.target);
      });
      if (shouldCloseNavPages) closeNavPagesForHeaderAction();
      syncSiteDropdownBackdrop();
    });
    headerMenuExclusivityObserver.observe(header, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"]
    });
    syncSiteDropdownBackdrop();
  }

  function closeNavDropmenus(except, options) {
    var shouldDismissNative = !options || options.dismissNative !== false;
    if (!except && shouldDismissNative && window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.dismissOverlays) {
      window.NDS.Mainnav.dismissOverlays();
      scheduleNavPageDropdownSync();
    }
    qsa(".nav-pages-item").forEach(function (item) {
      if (item === except) return;
      setNavPageDropdownState(item, false, options);
    });
  }

  function headerActionDropdownFromTrigger(trigger) {
    return trigger ? trigger.closest(".site-header .header-actions .nds-dropdown, .site-header .nds-nav-minimal .nds-dropdown") : null;
  }

  function fitHeaderActionDropdown(root, immediate) {
    if (!root) return;
    var menu = qs(".nds-dropdown-menu.nds-fit", root);
    var trigger = qs(":scope > .nds-nav-link, :scope > .nds-btn", root) || qs(".nds-nav-link, .nds-btn", root);
    if (!menu || !trigger) return;
    var applyFit = function () {
      var isMobile = window.matchMedia("(max-width: 960px)").matches;
      var nav = root.closest(".nds-main-nav");
      var navRect = nav ? nav.getBoundingClientRect() : trigger.getBoundingClientRect();
      var triggerRect = trigger.getBoundingClientRect();
      var fixedRoot = menu.closest(".nds-collapse");
      var rootRect = fixedRoot ? fixedRoot.getBoundingClientRect() : { left: 0, top: 0 };
      var viewportWidth = document.documentElement.clientWidth || window.innerWidth || 0;
      var pad = Math.max(16, parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-gutter")) || 16);
      var menuWidth = isMobile
        ? Math.max(240, viewportWidth - (pad * 2))
        : Math.min(menu.getBoundingClientRect().width || menu.offsetWidth || 360, Math.max(240, viewportWidth - (pad * 2)));
      var isRtl = (document.documentElement.dir || "").toLowerCase() === "rtl"
        || getComputedStyle(document.documentElement).direction === "rtl";
      var top = isMobile ? triggerRect.bottom : navRect.bottom;
      var left = isMobile ? pad : (isRtl ? triggerRect.right - menuWidth : triggerRect.left);
      left = Math.max(pad, Math.min(left, viewportWidth - pad - menuWidth));
      menu.style.setProperty("--header-action-menu-top", Math.round(top - rootRect.top) + "px");
      menu.style.setProperty("--header-action-menu-left", Math.round(left - rootRect.left) + "px");
    };
    if (immediate) applyFit();
    else window.requestAnimationFrame(applyFit);
  }

  function fitOpenHeaderActionDropdowns() {
    qsa(".site-header .header-actions .nds-dropdown, .site-header .nds-nav-minimal .nds-dropdown").forEach(function (root) {
      var states = (root.dataset.state || "").split(/\s+/);
      if (states.indexOf("open") !== -1 || states.indexOf("opening") !== -1 || states.indexOf("opened") !== -1) {
        fitHeaderActionDropdown(root);
      }
    });
  }

  function scheduleHeaderActionDropdownFit(root) {
    var startedAt = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
    var followFit = function (now) {
      var elapsed = (typeof now === "number" ? now : Date.now()) - startedAt;
      var states = (root && root.dataset && root.dataset.state || "").split(/\s+/);
      var isOpen = states.indexOf("open") !== -1 || states.indexOf("opening") !== -1 || states.indexOf("opened") !== -1;
      if (!root || !root.isConnected || !isOpen) return;
      fitHeaderActionDropdown(root, true);
      if (elapsed < 360) window.requestAnimationFrame(followFit);
    };
    window.requestAnimationFrame(followFit);
    window.requestAnimationFrame(function () {
      fitHeaderActionDropdown(root);
    });
    window.setTimeout(function () {
      fitHeaderActionDropdown(root);
    }, 80);
    window.setTimeout(function () {
      fitHeaderActionDropdown(root);
    }, 260);
    window.setTimeout(function () {
      fitHeaderActionDropdown(root);
    }, 420);
    window.setTimeout(function () {
      fitHeaderActionDropdown(root);
    }, 680);
  }

  function releaseHeaderActionOpeningState(root) {
    var states = (root && root.dataset && root.dataset.state || "").split(/\s+/);
    if (!root || states.indexOf("open") === -1 || states.indexOf("opening") === -1) return;
    removeDataStateTokens(root, ["opening"]);
    fitHeaderActionDropdown(root);
    syncSiteDropdownBackdrop();
  }

  function settleHeaderActionDropdownState(root) {
    var states = (root && root.dataset && root.dataset.state || "").split(/\s+/);
    if (!root || states.indexOf("open") === -1) return;
    if (states.indexOf("opened") !== -1) removeDataStateTokens(root, ["opening", "closing"]);
    fitHeaderActionDropdown(root);
    syncSiteDropdownBackdrop();
  }

  function scheduleHeaderActionDropdownStateSettle(root) {
    if (!root) return;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        releaseHeaderActionOpeningState(root);
      });
    });
    [60, 140, 240].forEach(function (delay) {
      window.setTimeout(function () {
        releaseHeaderActionOpeningState(root);
      }, delay);
    });
    [320, 520, 820].forEach(function (delay) {
      window.setTimeout(function () {
        settleHeaderActionDropdownState(root);
      }, delay);
    });
  }

  function prepareHeaderActionDropdown(trigger) {
    var root = headerActionDropdownFromTrigger(trigger);
    closeNavDropmenus(null, { dismissNative: false, instant: true });
    scheduleNavPageDropdownSync();
    scheduleNavPagesCloseForHeaderAction();
    scheduleMobileNavScrollControlSync();
    if (root) {
      scheduleHeaderActionDropdownFit(root);
      scheduleHeaderActionDropdownStateSettle(root);
    }
  }

  function updateNavPageListDropdownState(list) {
    if (!list) return;
    var hasOpen = qsa(".nav-pages-item", list).some(function (item) {
      return (item.dataset.state || "").split(/\s+/).indexOf("open") !== -1;
    });
    if (hasOpen) list.dataset.dropdownState = "open";
    else list.removeAttribute("data-dropdown-state");
    syncSiteDropdownBackdrop();
  }

  function resetNavPageDropdownPosition(menu) {
    if (!menu) return;
    menu.style.removeProperty("--nav-pages-left");
    menu.style.removeProperty("--nav-pages-top");
    menu.style.removeProperty("--nav-pages-shift");
  }

  function fitNavPageDropdown(item) {
    var menu = qs(".nav-pages-menu", item);
    var trigger = qs(".nav-pages-trigger", item);
    var applyPosition;
    if (!menu) return;
    resetNavPageDropdownPosition(menu);
    if (window.matchMedia("(max-width: 960px)").matches) return;
    applyPosition = function () {
      if ((item.dataset.state || "").split(/\s+/).indexOf("open") === -1) return;
      if (!trigger) return;
      var triggerRect = trigger.getBoundingClientRect();
      var menuRect = menu.getBoundingClientRect();
      var menuContent = qs(":scope > .nds-dropdown-content", menu) || qs(".nds-dropdown-content", menu);
      var fixedRoot = menu.closest(".nds-collapse");
      var rootRect = fixedRoot ? fixedRoot.getBoundingClientRect() : { left: 0, top: 0 };
      var navShell = trigger.closest(".nds-main-nav");
      var navRect = navShell ? navShell.getBoundingClientRect() : triggerRect;
      var pad = 16;
      var viewportWidth = Math.max(pad * 2, document.documentElement.clientWidth || window.innerWidth || 0);
      var viewportHeight = Math.max(240, document.documentElement.clientHeight || window.innerHeight || 0);
      var menuWidth = Math.min(menuRect.width || menu.offsetWidth || 240, viewportWidth - (pad * 2));
      var menuHeight = Math.ceil(menuContent && menuContent.scrollHeight || menu.scrollHeight || 240);
      var availableHeight = Math.max(120, viewportHeight - navRect.bottom - pad);
      var isRtl = (document.documentElement.dir || "").toLowerCase() === "rtl"
        || getComputedStyle(document.documentElement).direction === "rtl";
      var left = isRtl ? triggerRect.right - menuWidth : triggerRect.left;
      var top = Math.max(triggerRect.bottom, navRect.bottom);
      left = Math.max(pad, Math.min(left, viewportWidth - pad - menuWidth));
      menu.style.setProperty("--nav-pages-left", Math.round(left - rootRect.left) + "px");
      menu.style.setProperty("--nav-pages-top", Math.round(top - rootRect.top) + "px");
      menu.style.setProperty("--nav-pages-open-size", Math.min(menuHeight, availableHeight) + "px");
    };
    applyPosition();
    window.requestAnimationFrame(applyPosition);
  }

  function fitOpenNavPageDropdowns() {
    qsa(".nav-pages-item").forEach(function (item) {
      if ((item.dataset.state || "").split(/\s+/).indexOf("open") !== -1) {
        fitNavPageDropdown(item);
      }
    });
  }

  function syncNavPageDropdownTriggers() {
    qsa(".nav-pages-item").forEach(function (item) {
      var trigger = qs(".nav-pages-trigger", item);
      var isOpen = (item.dataset.state || "").split(/\s+/).indexOf("open") !== -1;
      if (!trigger) return;
      trigger.setAttribute("aria-expanded", String(isOpen));
    });
    qsa("[data-nav-list]").forEach(function (list) {
      updateNavPageListDropdownState(list);
    });
    syncSiteDropdownBackdrop();
  }

  function removeNavPageStateTokens(item, tokens) {
    var states = (item.dataset.state || "").split(/\s+/).filter(Boolean);
    var next = states.filter(function (state) {
      return tokens.indexOf(state) === -1;
    });
    if (next.length) item.dataset.state = next.join(" ");
    else item.removeAttribute("data-state");
  }

  function settleNavPageDropdownStates() {
    qsa(".nav-pages-item").forEach(function (item) {
      var states = (item.dataset.state || "").split(/\s+/);
      if (states.indexOf("open") === -1 || states.indexOf("opened") === -1) return;
      if (window.NDS && window.NDS.State && window.NDS.State.remove) {
        window.NDS.State.remove(item, "opening", "closing");
        return;
      }
      removeNavPageStateTokens(item, ["opening", "closing"]);
    });
    syncNavPageDropdownTriggers();
  }

  function scheduleNavPageDropdownSync() {
    window.setTimeout(syncNavPageDropdownTriggers, 0);
    window.setTimeout(settleNavPageDropdownStates, 280);
  }

  function toggleNavPageDropdown(trigger, event) {
    var item = trigger ? trigger.closest(".nav-pages-item") : null;
    if (!item) return;
    var isOpen = (item.dataset.state || "").split(/\s+/).indexOf("open") !== -1;
    closeNavDropmenus(item);
    setNavPageDropdownState(item, !isOpen);
  }

  function setNavPageDropdownState(item, isOpen, options) {
    var trigger = qs(".nav-pages-trigger", item);
    var menu = qs(".nav-pages-menu", item);
    var list = item.closest("[data-nav-list]");
    var instant = options && options.instant;
    var previousTimer = navPageDropdownTimers.get(item);
    if (previousTimer) {
      window.clearTimeout(previousTimer);
      navPageDropdownTimers.delete(item);
    }
    if (!trigger || !menu) return;
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen && instant) {
      menu.hidden = true;
      item.removeAttribute("data-state");
      resetNavPageDropdownPosition(menu);
      updateNavPageListDropdownState(list);
      return;
    }
    if (isOpen) {
      item.dataset.state = "open opening";
      updateNavPageListDropdownState(list);
      scheduleMobileNavScrollControlSync();
      fitNavPageDropdown(item);
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if ((item.dataset.state || "").indexOf("open") === -1) return;
          item.dataset.state = "open";
          updateNavPageListDropdownState(list);
          scheduleMobileNavScrollControlSync();
          fitNavPageDropdown(item);
        });
      });
      navPageDropdownTimers.set(item, window.setTimeout(function () {
        if ((item.dataset.state || "").split(/\s+/).indexOf("open") !== -1) item.dataset.state = "open opened";
        updateNavPageListDropdownState(list);
        scheduleMobileNavScrollControlSync();
        fitNavPageDropdown(item);
        navPageDropdownTimers.delete(item);
      }, 240));
      return;
    }
    if ((item.dataset.state || "").split(/\s+/).indexOf("open") === -1) {
      item.dataset.state = "";
      item.removeAttribute("data-state");
      resetNavPageDropdownPosition(menu);
      updateNavPageListDropdownState(list);
      return;
    }
    item.dataset.state = "open closing";
    updateNavPageListDropdownState(list);
    scheduleMobileNavScrollControlSync();
    navPageDropdownTimers.set(item, window.setTimeout(function () {
      item.dataset.state = "";
      item.removeAttribute("data-state");
      resetNavPageDropdownPosition(menu);
      updateNavPageListDropdownState(list);
      scheduleMobileNavScrollControlSync();
      navPageDropdownTimers.delete(item);
    }, 240));
  }

  function setupThemeToggle() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-theme-toggle]");
      var scrollLeft;
      var scrollTop;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (themeTransitionActive || document.documentElement.classList.contains("theme-transitioning")) return;
      scrollLeft = currentScrollLeft();
      scrollTop = currentScrollTop();
      preserveThemeScrollPosition(scrollLeft, scrollTop);
      closeHeaderDropdownsForThemeToggle();
      restoreThemeViewportScroll(scrollLeft, scrollTop);
      toggleTheme(button, {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop,
        preserveStarted: true
      });
    }, true);
  }

  function toggleTheme(origin, options) {
    var data = appState.data || window.SiteStore.current();
    var current = currentThemePreference(data);
    var next = current === "dark" ? "light" : "dark";
    data.settings.theme = next;
    appState.data = data;
    applyTheme(next, true, origin, options);
    if (isAdminAuthenticated()) {
      window.SiteStore.save(data).then(function (savedData) {
        appState.data = savedData;
      }).catch(function () {});
    }
  }

  function currentThemePreference(data) {
    var storedTheme = localStorage.getItem("websiteDemo:theme");
    if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
    if (data && data.settings && (data.settings.theme === "dark" || data.settings.theme === "light")) {
      return data.settings.theme;
    }
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, announce, origin, options) {
    var next = theme === "dark" ? "dark" : "light";
    var scrollLeft = options && Number.isFinite(options.scrollLeft) ? options.scrollLeft : currentScrollLeft();
    var scrollTop = options && Number.isFinite(options.scrollTop) ? options.scrollTop : currentScrollTop();
    var shouldPreserveScroll = Boolean(options && (options.preserveStarted || options.preserveScroll));

    if (shouldPreserveScroll && !(options && options.preserveStarted)) preserveThemeScrollPosition(scrollLeft, scrollTop);
    if (announce && origin && !(options && options.skipMotion) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyThemeWithMotion(next, origin, {
        revealPoint: options && options.revealPoint,
        scrollLeft: scrollLeft,
        scrollTop: scrollTop,
        preserveScroll: shouldPreserveScroll
      });
    } else {
      commitTheme(next);
      if (shouldPreserveScroll) restoreThemeViewportScroll(scrollLeft, scrollTop);
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

  function applyThemeWithMotion(next, origin, options) {
    var point = options && options.revealPoint || themeRevealPoint(origin);
    var shouldPreserveScroll = Boolean(options && options.preserveScroll);
    var scrollLeft = options && Number.isFinite(options.scrollLeft) ? options.scrollLeft : currentScrollLeft();
    var scrollTop = options && Number.isFinite(options.scrollTop) ? options.scrollTop : rawViewportScrollTop();
    var transition;
    var cleanupTimer;
    var cleanedUp = false;
    var commit = function () {
      commitTheme(next);
      if (shouldPreserveScroll) restoreThemeViewportScroll(scrollLeft, scrollTop);
    };
    var cleanup = function () {
      if (cleanedUp) return;
      cleanedUp = true;
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      themeTransitionActive = false;
      document.documentElement.classList.remove("theme-transitioning");
      document.documentElement.style.removeProperty("--theme-reveal-x");
      document.documentElement.style.removeProperty("--theme-reveal-y");
      if (shouldPreserveScroll) restoreThemeViewportScroll(scrollLeft, scrollTop);
    };

    if (!document.startViewTransition) {
      fallbackThemeReveal(next, point, {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop,
        preserveScroll: shouldPreserveScroll
      });
      return;
    }

    themeTransitionActive = true;
    document.documentElement.classList.add("theme-transitioning");
    document.documentElement.style.setProperty("--theme-reveal-x", point.x + "px");
    document.documentElement.style.setProperty("--theme-reveal-y", point.y + "px");

    try {
      transition = document.startViewTransition(commit);
    } catch (error) {
      cleanup();
      fallbackThemeReveal(next, point, {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop,
        preserveScroll: shouldPreserveScroll
      });
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
          duration: 560,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    }).catch(function () {});

    cleanupTimer = window.setTimeout(cleanup, 960);
    transition.finished.then(cleanup).catch(cleanup);
  }

  function themeRevealPoint(origin) {
    var rect = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
    var x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    var y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    return {
      x: x,
      y: y,
      radius: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 56
    };
  }

  function fallbackThemeReveal(next, point, options) {
    var shouldPreserveScroll = Boolean(options && options.preserveScroll);
    var scrollLeft = options && Number.isFinite(options.scrollLeft) ? options.scrollLeft : currentScrollLeft();
    var scrollTop = options && Number.isFinite(options.scrollTop) ? options.scrollTop : rawViewportScrollTop();
    var layer = document.createElement("div");
    var reveal;
    var revealTimer;
    var fadeTimer;
    var revealDone = false;
    var layerRemoved = false;
    var removeLayer = function () {
      if (layerRemoved) return;
      layerRemoved = true;
      if (fadeTimer) window.clearTimeout(fadeTimer);
      document.documentElement.classList.remove("theme-transitioning");
      themeTransitionActive = false;
      layer.remove();
      if (shouldPreserveScroll) restoreThemeViewportScroll(scrollLeft, scrollTop);
    };
    var finishReveal = function () {
      var fade;
      if (revealDone) return;
      revealDone = true;
      if (revealTimer) window.clearTimeout(revealTimer);
      commitTheme(next);
      if (shouldPreserveScroll) restoreThemeViewportScroll(scrollLeft, scrollTop);
      fade = layer.animate({ opacity: [1, 0] }, { duration: 180, easing: "ease", fill: "forwards" });
      fade.onfinish = removeLayer;
      fadeTimer = window.setTimeout(removeLayer, 260);
    };

    themeTransitionActive = true;
    document.documentElement.classList.add("theme-transitioning");
    layer.className = "theme-reveal-layer";
    layer.style.setProperty("--theme-reveal-x", point.x + "px");
    layer.style.setProperty("--theme-reveal-y", point.y + "px");
    layer.style.setProperty("--theme-reveal-radius", point.radius + "px");
    layer.style.background = next === "dark" ? "#0b1220" : "#f9fafb";
    document.body.append(layer);

    reveal = layer.animate(
      {
        clipPath: [
          "circle(0px at " + point.x + "px " + point.y + "px)",
          "circle(" + point.radius + "px at " + point.x + "px " + point.y + "px)"
        ]
      },
      {
        duration: 560,
        easing: "ease-in-out",
        fill: "forwards"
      }
    );

    reveal.onfinish = finishReveal;
    revealTimer = window.setTimeout(finishReveal, 900);
  }

  function setupClock() {
    updateClock();
    clearInterval(appState.clockTimer);
    appState.clockTimer = setInterval(updateClock, 30000);
  }

  function setupCityWeather() {
    if (cityWeatherInitialized) return;
    if (!qs("#nds-cityName") || !qs("#nds-weatherInfo")) return;
    if (!window.NDS || !window.NDS.CityWeather || !window.NDS.CityWeather.init) return;
    cityWeatherInitialized = true;
    window.NDS.CityWeather.init();
  }

  function updateClock() {
    updateHeaderDateTime();
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
        '<span class="site-datetime-item"><i class="hgi hgi-stroke hgi-calendar-03 topbar-date-calendar-icon" aria-hidden="true"></i><span>' + displayDate + '</span></span>',
        '<span class="site-datetime-item"><i class="nds-icon nds-hgi-clock-01" aria-hidden="true"></i><span>' + timeLabel + '</span></span>'
      ].join("");
    });
    dateNodes.forEach(function (node) {
      node.title = dateLabel;
      node.innerHTML = '<i class="hgi hgi-stroke hgi-calendar-03 topbar-date-calendar-icon" aria-hidden="true"></i><span class="text">' + dateLabel + '</span>';
    });
    timeNodes.forEach(function (node) {
      node.title = timeLabel;
      node.innerHTML = '<i class="nds-icon nds-hgi-clock-01" aria-hidden="true"></i><span class="text">' + timeLabel + '</span>';
    });
  }

  function getPageSlug() {
    var parts = getPagePathSlugs();
    return parts.length ? parts[parts.length - 1] : "";
  }

  function getPagePathSlugs() {
    var match = location.hash.match(/^#\/page\/(.+)$/);
    if (!match) return [];
    return match[1].split("/").filter(Boolean).map(function (part) {
      try {
        return decodeURIComponent(part);
      } catch (error) {
        return part;
      }
    });
  }

  function renderHome(data) {
    var homeView = qs("[data-home-view]");
    var pageView = qs("[data-extra-page-view]");
    var pageContentView = qs("[data-extra-page-content-view]");
    var slug = getPageSlug();

    if (slug) {
      clearHomeNumbersAutoplay();
      if (homeView) homeView.hidden = true;
      if (pageView) pageView.hidden = false;
      if (pageContentView) pageContentView.hidden = false;
      renderExtraPage(data, slug);
      return;
    }

    if (homeView) homeView.hidden = false;
    if (pageView) pageView.hidden = true;
    if (pageContentView) pageContentView.hidden = true;

    var home = data.home || {};
    var hasContent = hasHomeContent(home);
    var hasHero = hasHomeHeroContent(home);
    var hasBody = hasHomeBodyContent(home);
    var empty = qs("[data-home-empty]");
    var content = qs("[data-home-content]");
    var hero = qs("[data-home-hero]");
    var bioSection = qs(".biography-section");
    var numbersSection = qs("[data-home-numbers-section]");
    var professionalSection = qs(".professional-section");
    var skillsSection = qs("[data-skills-section]");
    var visibleNumbers = visibleHomeNumberCards(home);
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
    if (numbersSection) numbersSection.hidden = !visibleNumbers.length;
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
    renderHomeNumbers(home, visibleNumbers);
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

  function normalizeHomeNumberIcon(value) {
    var text = String(value || "").trim();
    var match = text.match(/\bhgi-[a-z0-9-]+\b/i);
    return match ? match[0] : "hgi-chart-up";
  }

  function hasNumericValue(value) {
    return /[-+]?\d/.test(String(value || ""));
  }

  function createHomeNumberCard(item) {
    var card = el("article", "nds-card nds-shadow nds-statistic home-number-card");
    var header = el("div", "nds-card-header");
    var featured = el("div", "nds-card-featured-icon");
    var iconShell = el("span", "nds-featured-icon nds-circle nds-xl");
    var icon = document.createElement("i");
    var content = el("div", "nds-card-content");
    var text = el("div", "nds-card-text");
    var title = el("h3", "nds-card-description home-number-title", item.title || "");
    var number = el("span", "nds-card-number nds-md home-number-value", item.number || "");

    icon.className = "hgi hgi-stroke " + normalizeHomeNumberIcon(item.icon) + " icon";
    icon.setAttribute("aria-hidden", "true");
    iconShell.append(icon);
    featured.append(iconShell);
    header.append(featured);

    title.dir = "rtl";
    number.dir = "ltr";
    if (hasNumericValue(item.number)) {
      number.className += " nds-counter-value nds-number-format";
      number.dataset.target = item.number;
      number.textContent = "0";
    }

    if (hasText(item.number)) text.append(number);
    text.append(title);
    content.append(text);
    card.append(header, content);
    return card;
  }

  function refreshHomeNumbersComponents(swiper) {
    if (swiper && window.NDS && window.NDS.Swiper && window.NDS.Swiper.create) {
      window.NDS.Swiper.create(swiper);
    }
    if (window.NDS && window.NDS.Numbers && window.NDS.Numbers.reinit) {
      window.NDS.Numbers.reinit();
    }
  }

  function clearHomeNumbersAutoplay() {
    clearInterval(appState.homeNumbersTimer);
    clearTimeout(appState.homeNumbersResumeTimer);
    clearTimeout(appState.homeNumbersSettleTimer);
    appState.homeNumbersTimer = null;
    appState.homeNumbersResumeTimer = null;
    appState.homeNumbersSettleTimer = null;
  }

  function getHomeNumbersSlides(swiper) {
    return qsa(".nds-swiper-slide", swiper);
  }

  function getHomeNumbersSlidesPerView(swiper) {
    var cssValue = parseInt(getComputedStyle(swiper).getPropertyValue("--slides"), 10) ||
      parseInt(getComputedStyle(swiper).getPropertyValue("--swiper-slides"), 10);
    var min;
    var mid;
    var max;
    if (cssValue > 0) return cssValue;
    min = parseInt(swiper.getAttribute("slides-min") || "1", 10);
    mid = parseInt(swiper.getAttribute("slides-mid") || String(min), 10);
    max = parseInt(swiper.getAttribute("slides-max") || String(mid), 10);
    if (window.matchMedia("(min-width: 1024px)").matches) return Math.max(1, max);
    if (window.matchMedia("(min-width: 768px)").matches) return Math.max(1, mid);
    return Math.max(1, min);
  }

  function homeNumbersMaxIndex(slides, slidesPerView) {
    return Math.max(0, slides.length - slidesPerView);
  }

  function homeNumbersIsRtl(swiper) {
    var wrapper = qs(".nds-swiper-wrapper", swiper);
    return getComputedStyle(wrapper || swiper).direction === "rtl";
  }

  function getHomeNumbersCurrentIndex(swiper, slides, slidesPerView) {
    var wrapper = qs(".nds-swiper-wrapper", swiper);
    var step;
    var scrollPosition;
    if (!wrapper || !slides.length) return 0;
    step = slides.length > 1 ? Math.abs(slides[1].offsetLeft - slides[0].offsetLeft) : 0;
    step = step || slides[0].offsetWidth || 1;
    scrollPosition = homeNumbersIsRtl(swiper) ? -wrapper.scrollLeft : wrapper.scrollLeft;
    return Math.min(Math.max(0, Math.round(scrollPosition / step)), homeNumbersMaxIndex(slides, slidesPerView));
  }

  function scrollHomeNumbersToIndex(swiper, slides, index) {
    var wrapper = qs(".nds-swiper-wrapper", swiper);
    var target = slides[index];
    var offset;
    var left;
    if (!wrapper || !target || !slides[0]) return;
    offset = Math.abs(target.offsetLeft - slides[0].offsetLeft);
    left = homeNumbersIsRtl(swiper) ? -offset : offset;
    clearTimeout(appState.homeNumbersSettleTimer);
    wrapper.scrollTo({
      left: left,
      behavior: "smooth"
    });
    appState.homeNumbersSettleTimer = setTimeout(function () {
      if (!wrapper.isConnected || !swiper.isConnected) return;
      if (swiper.dataset.homeNumbersAutoplayIndex !== String(index)) return;
      wrapper.scrollTo({ left: left, behavior: "auto" });
    }, 650);
  }

  function canAutoSlideHomeNumbers(swiper) {
    var slides;
    if (!swiper) return false;
    slides = getHomeNumbersSlides(swiper);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return slides.length > getHomeNumbersSlidesPerView(swiper);
  }

  function setupHomeNumbersAutoplay(swiper) {
    var paused = false;

    clearHomeNumbersAutoplay();
    if (!canAutoSlideHomeNumbers(swiper)) return;

    function pauseAutoplay() {
      paused = true;
    }

    function resumeAutoplay() {
      paused = false;
      clearTimeout(appState.homeNumbersResumeTimer);
      appState.homeNumbersResumeTimer = null;
    }

    function pauseTemporarily() {
      pauseAutoplay();
      clearTimeout(appState.homeNumbersResumeTimer);
      appState.homeNumbersResumeTimer = setTimeout(resumeAutoplay, HOME_NUMBERS_AUTOPLAY_RESUME_MS);
    }

    function advance() {
      var slides;
      var slidesPerView;
      var limit;
      var currentIndex;
      var nextIndex;
      if (!swiper || !swiper.isConnected) {
        clearHomeNumbersAutoplay();
        return;
      }
      if (document.hidden || paused || swiper.closest("[hidden]") || swiper.contains(document.activeElement)) return;
      slides = getHomeNumbersSlides(swiper);
      slidesPerView = getHomeNumbersSlidesPerView(swiper);
      limit = homeNumbersMaxIndex(slides, slidesPerView);
      if (limit <= 0) return;
      currentIndex = getHomeNumbersCurrentIndex(swiper, slides, slidesPerView);
      nextIndex = currentIndex >= limit ? 0 : Math.min(currentIndex + slidesPerView, limit);
      swiper.dataset.homeNumbersAutoplayIndex = String(nextIndex);
      scrollHomeNumbersToIndex(swiper, slides, nextIndex);
    }

    swiper.dataset.homeNumbersAutoplay = "ready";
    swiper.addEventListener("mouseenter", pauseAutoplay);
    swiper.addEventListener("mouseleave", resumeAutoplay);
    swiper.addEventListener("focusin", pauseAutoplay);
    swiper.addEventListener("focusout", function () {
      setTimeout(function () {
        if (!swiper.contains(document.activeElement)) resumeAutoplay();
      }, 0);
    });
    swiper.addEventListener("pointerdown", pauseTemporarily, { passive: true });
    swiper.addEventListener("touchstart", pauseTemporarily, { passive: true });
    swiper.addEventListener("wheel", pauseTemporarily, { passive: true });
    appState.homeNumbersTimer = setInterval(advance, HOME_NUMBERS_SLIDE_DURATION);
  }

  function renderHomeNumbers(home, items) {
    var section = qs("[data-home-numbers-section]");
    var title = qs("[data-home-numbers-title]");
    var subtitle = qs("[data-home-numbers-subtitle]");
    var body = qs("[data-home-numbers-body]");
    var numbers = home && home.numbers && typeof home.numbers === "object" ? home.numbers : {};
    var oldSwiper = body ? qs(".home-numbers-swiper", body) : null;
    if (!section || !body) return;
    items = items || visibleHomeNumberCards(home);
    clearHomeNumbersAutoplay();
    if (oldSwiper && oldSwiper._ndsSwiper && oldSwiper._ndsSwiper.destroy) oldSwiper._ndsSwiper.destroy();
    body.innerHTML = "";
    section.hidden = !items.length;
    if (!items.length) return;

    if (title) title.textContent = numbers.title || "في أرقام";
    if (subtitle) {
      subtitle.textContent = numbers.subtitle || "";
      subtitle.hidden = !hasText(numbers.subtitle);
    }

    var swiper = el("div", "nds-swiper home-numbers-swiper");
    var wrapper = el("div", "nds-swiper-wrapper");
    var navigation = el("div", "nds-swiper-navigation");
    var buttons = el("div", "nds-swiper-buttons");
    var previous = el("button", "nds-btn nds-primary nds-icon-only nds-circle nds-md nds-prev");
    var next = el("button", "nds-btn nds-primary nds-icon-only nds-circle nds-md nds-next");
    var pagination = el("div", "nds-swiper-pagination");

    swiper.dir = document.documentElement.dir || "rtl";
    swiper.setAttribute("slides-max", "5");
    swiper.setAttribute("slides-mid", "3");
    swiper.setAttribute("slides-min", "1");
    swiper.setAttribute("peek", "0");
    swiper.tabIndex = 0;

    items.forEach(function (item) {
      var slide = el("div", "nds-swiper-slide");
      slide.append(createHomeNumberCard(item));
      wrapper.append(slide);
    });

    previous.type = "button";
    previous.setAttribute("aria-label", "السابق");
    previous.innerHTML = '<i class="hgi hgi-stroke hgi-arrow-right-01 home-numbers-control-icon" aria-hidden="true"></i>';
    previous.hidden = true;
    next.type = "button";
    next.setAttribute("aria-label", "التالي");
    next.innerHTML = '<i class="hgi hgi-stroke hgi-arrow-left-01 home-numbers-control-icon" aria-hidden="true"></i>';
    next.hidden = true;
    pagination.hidden = true;
    buttons.append(previous, next);
    navigation.append(buttons, pagination);
    swiper.append(wrapper, navigation);
    body.append(swiper);
    refreshHomeNumbersComponents(swiper);
    setupHomeNumbersAutoplay(swiper);
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

  function createPageMedia(page, options) {
    var hasImage = hasText(page && page.image);
    var hasVideo = hasText(page && page.video);
    var wrapper;
    var video;
    var source;
    var image;
    if (!hasImage && !hasVideo) return null;
    wrapper = el("div", options && options.card ? "page-media page-card-media nds-card-image" : "page-media page-content-media");
    if (hasVideo) {
      video = document.createElement("video");
      video.className = "page-media-video";
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      if (hasImage) video.poster = page.image;
      source = document.createElement("source");
      source.src = page.video;
      source.type = videoMimeType(page.video);
      video.append(source);
      wrapper.append(video);
      return wrapper;
    }
    image = document.createElement("img");
    image.className = "page-media-image";
    image.src = page.image;
    image.alt = page.title || "";
    wrapper.append(image);
    return wrapper;
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
      renderExtraPageTrackingStamp(null);
      renderExtraPageBreadcrumb(data, null);
      updateDocumentTitle(data, "الصفحة غير موجودة");
      body.append(emptyState(uiText(data, "extraPageNotFoundTitle", "لم يتم العثور على الصفحة المطلوبة"), uiText(data, "extraPageNotFoundDescription", "يمكنك العودة إلى الصفحة الرئيسية أو إنشاء الصفحة من لوحة الإدارة.")));
      renderSectionShareAction("[data-extra-page-view] .nds-section-head", "", "");
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = page.title || ""; });
    renderExtraPageTrackingStamp(page);
    renderExtraPageBreadcrumb(data, page);
    updateDocumentTitle(data, page.title || navigationLabel(data, "pagesLabel", "الصفحات"));
    renderSectionShareAction("[data-extra-page-view] .nds-section-head", pageHref(page, data), page.title || page.slug || "");
    var pageMedia = createPageMedia(page);
    if (pageMedia) body.append(pageMedia);
    if (!hasText(page.content) && !pageMedia) {
      body.append(emptyState(uiText(data, "extraPageEmptyTitle", "لم تتم إضافة محتوى لهذه الصفحة بعد"), uiText(data, "extraPageEmptyDescription", "يمكن تعديل هذه الصفحة من لوحة الإدارة.")));
      return;
    }
    if (!hasText(page.content)) return;

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

  function renderExtraPageBreadcrumb(data, page) {
    var list = qs("[data-extra-page-breadcrumb]");
    var bySlug = pagesBySlug(data);
    var parent = page && page.parentSlug ? bySlug[page.parentSlug] : null;
    if (!list) return;
    list.innerHTML = "";
    var homeItem = el("li");
    var homeLink = el("a", "", navigationLabel(data, "homeLabel", "الرئيسية"));
    homeLink.href = "index.html";
    homeLink.setAttribute("data-home-page-label", "");
    homeItem.append(homeLink);
    list.append(homeItem);
    if (page && parent && parent.slug !== page.slug) {
      var parentItem = el("li");
      if (pageIsNavigationGroup(parent, data)) {
        parentItem.append(el("span", "", parent.title || parent.slug || ""));
      } else {
        var parentLink = el("a", "", parent.title || parent.slug || "");
        parentLink.href = pageHref(parent, data);
        parentItem.append(parentLink);
      }
      list.append(parentItem);
    }
    var currentItem = el("li", "nds-truncate", page ? (page.title || page.slug || "") : "الصفحة غير موجودة");
    currentItem.setAttribute("aria-current", "page");
    currentItem.setAttribute("data-extra-page-title", "");
    list.append(currentItem);
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
      root.append(ndsTagEl("nds-tag nds-green nds-sm", item));
    });
  }

  function renderProjectsPage(data) {
    var empty = qs("[data-projects-empty]");
    var content = qs("[data-projects-content]");
    var projects = visibleItems(data.projects || []);
    var hasProjects = projects.length > 0;
    renderSectionShareAction("body[data-page='projects'] .nds-hero-section .nds-section-head", "projects.html", navigationLabel(data, "projectsLabel", "مشاريعنا"));
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
      if (hasText(project.status)) meta.append(ndsTagEl("nds-tag nds-green nds-sm", project.status));
      if (hasText(project.date)) meta.append(ndsTagEl("nds-tag nds-gray nds-sm", project.date));
      if (hasText(project.category)) meta.append(ndsTagEl("nds-tag nds-blue nds-sm", project.category));
      if (meta.children.length) content.append(meta);
      var actions = el("div", "project-actions");
      var details = el("a", "nds-btn nds-primary nds-md");
      var projectUrl = projectHref(project, entry.index);
      details.href = projectUrl;
      details.append(el("span", "nds-label", uiText(appState.data, "projectDetailsButton", "تفاصيل المشروع")));
      actions.append(details);
      content.append(actions);
      card.append(content);
      root.append(card);
    });
  }

  function renderProjectDetailPage(data) {
    var params = new URLSearchParams(location.search);
    var entry = projectEntryByIdentifier(data, params.get("id") || params.get("slug") || "");
    var index = entry.index;
    var project = entry.project;
    if (project && project.visible === false) project = null;
    var titleNodes = qsa("[data-project-detail-title]");
    var body = qs("[data-project-detail-body]");
    if (!body) return;
    body.innerHTML = "";

    if (!project) {
      renderSectionShareAction("body[data-page='project-detail'] .nds-hero-section .nds-section-head", "", "");
      titleNodes.forEach(function (node) { node.textContent = uiText(data, "projectNotFoundTitle", "المشروع غير موجود"); });
      updateDocumentTitle(data, uiText(data, "projectNotFoundTitle", "المشروع غير موجود"));
      body.append(emptyState(uiText(data, "projectNotFoundEmptyTitle", "لم يتم العثور على المشروع المطلوب"), uiText(data, "projectNotFoundEmptyDescription", "يمكنك العودة إلى صفحة مشاريعنا واختيار مشروع آخر.")));
      return;
    }

    titleNodes.forEach(function (node) { node.textContent = project.title || uiText(data, "projectDetailFallbackTitle", "تفاصيل المشروع"); });
    updateDocumentTitle(data, project.title || uiText(data, "projectDetailFallbackTitle", "تفاصيل المشروع"));
    renderSectionShareAction("body[data-page='project-detail'] .nds-hero-section .nds-section-head", projectHref(project, index), project.title || "");
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

  function absoluteShareUrl(href) {
    try {
      return new URL(href || location.href, location.href).href;
    } catch (error) {
      return location.href;
    }
  }

  function shareMenuButton(actionClass, iconClass, label, ariaLabel) {
    var button = el("button", "nds-btn nds-subtle nds-dropmenu-item " + actionClass);
    var icon = document.createElement("i");
    button.type = "button";
    button.setAttribute("aria-label", ariaLabel || label);
    icon.className = "nds-icon " + iconClass;
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.append(el("span", "nds-label", label));
    return button;
  }

  function createShareMenu(href, title) {
    var shareLabel = uiText(appState.data, "sharePageLabel", "مشاركة الصفحة");
    var share = el("div", "nds-share nds-dropmenu");
    var trigger = el("button", "nds-btn nds-secondary-outline nds-dropmenu-trigger");
    var triggerIcon = document.createElement("i");
    var triggerLabel = el("span", "nds-label", shareLabel);
    var menu = el("div", "nds-dropmenu-menu");
    var copyButton;

    share.dataset.shareUrl = absoluteShareUrl(href);
    share.dataset.shareTitle = title || document.title;
    trigger.type = "button";
    trigger.title = shareLabel;
    trigger.setAttribute("aria-label", shareLabel);
    triggerIcon.className = "nds-icon nds-hgi-share-01";
    triggerIcon.setAttribute("aria-hidden", "true");
    trigger.append(triggerIcon, triggerLabel);

    menu.hidden = true;
    menu.append(shareMenuButton("nds-share-x", "nds-hgi-new-twitter", "X", "Share on X"));
    menu.append(shareMenuButton("nds-share-linkedin", "nds-hgi-linkedin-02", "LinkedIn", "Share on LinkedIn"));
    menu.append(shareMenuButton("nds-share-whatsapp", "nds-hgi-whatsapp", "WhatsApp", "Share on WhatsApp"));
    copyButton = shareMenuButton("nds-share-copy", "nds-hgi-link-04", "Copy Link", "Copy Link");
    copyButton.dataset.label = "Link Copied!";
    copyButton.dataset.message = "Page link copied to clipboard";
    copyButton.setAttribute("data-no-auto-close", "");
    menu.append(copyButton);

    share.append(trigger, menu);
    return share;
  }

  function renderSectionShareAction(selector, href, title) {
    var head = qs(selector);
    var action = head ? qs("[data-section-share-action]", head) : null;
    if (!head) return;
    if (!href) {
      if (action) action.remove();
      return;
    }
    if (!action) {
      action = el("div", "nds-section-action nds-minimal");
      action.dataset.sectionShareAction = "true";
      head.insertBefore(action, qs(".nds-section-title", head) || head.firstChild);
    }
    action.innerHTML = "";
    action.append(createShareMenu(href, title || document.title));
  }

  function initializeShareComponents() {
    if (window.NDS && window.NDS.Breadcrumb) {
      if (window.NDS.Breadcrumb.reinit) window.NDS.Breadcrumb.reinit();
      else if (window.NDS.Breadcrumb.init) window.NDS.Breadcrumb.init();
    }
    if (window.NDS && window.NDS.Dropmenu) {
      if (window.NDS.Dropmenu.reinit) window.NDS.Dropmenu.reinit();
      else if (window.NDS.Dropmenu.init) window.NDS.Dropmenu.init();
    }
    if (window.NDS && window.NDS.Copy && window.NDS.Copy.init) window.NDS.Copy.init();
    if (window.NDS && window.NDS.Share && window.NDS.Share.init) window.NDS.Share.init();
  }

  function getShareDropmenuPanel(share) {
    if (window.NDS && window.NDS.Dropmenu && window.NDS.Dropmenu.menuOf) {
      return window.NDS.Dropmenu.menuOf(share);
    }
    return share ? share.querySelector(".nds-dropmenu-menu") : null;
  }

  function getShareDropmenuInstance(share) {
    if (!share || !(window.NDS && window.NDS.Dropmenu)) return null;
    if (share.ndsDropmenu && typeof share.ndsDropmenu.open === "function") return share.ndsDropmenu;
    if (share.hasAttribute("data-nds-dropmenu-initialized")) {
      share.removeAttribute("data-nds-dropmenu-initialized");
    }
    if (window.NDS.Dropmenu.create) {
      share.ndsDropmenu = window.NDS.Dropmenu.create(share);
    } else if (window.NDS.Dropmenu.init) {
      window.NDS.Dropmenu.init();
    }
    return share.ndsDropmenu && typeof share.ndsDropmenu.open === "function" ? share.ndsDropmenu : null;
  }

  function forceOpenShareDropmenu(share) {
    var instance = getShareDropmenuInstance(share);
    var panel = getShareDropmenuPanel(share);
    var trigger = share ? share.querySelector(".nds-dropmenu-trigger") : null;
    if (panel) panel.hidden = false;
    if (instance) {
      if (instance.menu) instance.menu.hidden = false;
      if (instance.isOpen) {
        if (instance.applyPosition) instance.applyPosition();
        if (instance.trigger) instance.trigger.setAttribute("aria-expanded", "true");
        if (instance.menu) instance.menu.setAttribute("aria-hidden", "false");
        return;
      }
      instance.open();
      if (instance.menu) instance.menu.hidden = false;
      return;
    }
    if (!panel || !trigger) return;
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    share.dataset.state = "open";
  }

  function ensureShareDropmenuOpensOnClick() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      var trigger = target && target.closest ? target.closest(".nds-share .nds-dropmenu-trigger") : null;
      var share;
      if (!trigger) return;
      share = trigger.closest(".nds-share.nds-dropmenu");
      if (!share) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      forceOpenShareDropmenu(share);
    }, true);
  }

  function renderPagesPage(data) {
    var empty = qs("[data-pages-empty]");
    var content = qs("[data-pages-content]");
    var pages = publicPageItems(data).filter(function (page) {
      return !pageIsNavigationGroup(page, data);
    });
    var hasPages = pages.length > 0;
    renderSectionShareAction("body[data-page='pages'] .nds-hero-section .nds-section-head", "pages.html", navigationLabel(data, "pagesLabel", "الصفحات"));
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
      var media = createPageMedia(page, { card: true });
      if (media) content.append(media);
      content.append(el("h2", "nds-card-title", page.title || page.slug || uiText(appState.data, "pageCardFallbackTitle", "صفحة")));
      var stamp = pageTrackingStamp(page);
      if (stamp) content.append(stamp);
      if (hasText(page.content)) {
        content.append(el("p", "nds-card-description", textPreview(page.content)));
      }
      var link = el("a", "nds-btn nds-primary nds-md");
      var pageUrl = pageHref(page, appState.data);
      var actions = el("div", "project-actions page-actions");
      link.href = pageUrl;
      link.append(el("span", "nds-label", uiText(appState.data, "pageOpenButton", "فتح الصفحة")));
      actions.append(link);
      content.append(actions);
      card.append(content);
      root.append(card);
    });
  }

  function cardInternalPageHref(slug, data) {
    var normalized = String(slug || "").trim();
    var page = routablePageItems(data).find(function (item) {
      return String(item.slug || "").trim() === normalized;
    });
    if (page) return pageHref(page, data);
    return normalized ? "index.html#/page/" + encodeURIComponent(normalized) : "";
  }

  function cardLinkHref(card, data) {
    var type = String(card && card.linkType || "none").trim();
    var value = String(card && card.linkValue || "").trim();
    if (!value || type === "none") return "";
    if (type === "page") return cardInternalPageHref(value, data);
    return normalizeExternalUrl(value);
  }

  function renderCollectionCards(cards) {
    var root = qs("[data-card-collection-list]");
    if (!root) return;
    root.innerHTML = "";
    cards.forEach(function (card) {
      var href = cardLinkHref(card, appState.data);
      var article = el("article", "collection-card nds-card nds-stroke");
      var content = el("div", "nds-card-content");
      var text = el("div", "collection-card-text");
      var title = el("h2", "nds-card-title", card.title || "");
      text.append(title);
      if (hasText(card.subtitle)) text.append(el("p", "nds-card-description", card.subtitle));
      content.append(text);
      if (href) {
        var actions = el("div", "nds-card-actions nds-end collection-card-actions");
        var link = el("a", "nds-btn nds-secondary nds-md");
        var icon = document.createElement("i");
        link.href = href;
        if (/^https?:\/\//i.test(href)) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        icon.className = "nds-icon nds-hgi-arrow-left-01";
        icon.setAttribute("aria-hidden", "true");
        link.append(el("span", "nds-label", card.linkLabel || "عرض التفاصيل"));
        link.append(icon);
        actions.append(link);
        content.append(actions);
      }
      article.append(content);
      root.append(article);
    });
  }

  function renderCardsPagination(collection, collectionIndex, currentPage, pageCount) {
    var root = qs("[data-card-collection-pagination]");
    if (!root) return;
    root.innerHTML = "";
    root.hidden = pageCount <= 1;
    if (pageCount <= 1) return;

    var previous = el("a", "nds-btn nds-subtle nds-icon-only hero-control cards-pagination-arrow");
    var dots = el("div", "hero-dots cards-pagination-dots");
    var next = el("a", "nds-btn nds-subtle nds-icon-only hero-control cards-pagination-arrow");
    var previousIcon = document.createElement("i");
    var nextIcon = document.createElement("i");

    previous.href = cardCollectionHref(collection, collectionIndex, Math.max(1, currentPage - 1));
    previous.toggleAttribute("aria-disabled", currentPage <= 1);
    previous.setAttribute("aria-label", "الصفحة السابقة");
    previousIcon.className = "nds-icon nds-hgi-arrow-right-01";
    previousIcon.setAttribute("aria-hidden", "true");
    previous.append(previousIcon);
    if (currentPage <= 1) previous.setAttribute("tabindex", "-1");

    Array.from({ length: pageCount }).forEach(function (_, index) {
      var page = index + 1;
      var dot = el("a", "hero-dot cards-pagination-dot");
      dot.href = cardCollectionHref(collection, collectionIndex, page);
      dot.setAttribute("aria-label", "عرض صفحة البطاقات " + page);
      if (page === currentPage) {
        dot.dataset.state = "active";
        dot.setAttribute("aria-current", "page");
      }
      dots.append(dot);
    });

    next.href = cardCollectionHref(collection, collectionIndex, Math.min(pageCount, currentPage + 1));
    next.toggleAttribute("aria-disabled", currentPage >= pageCount);
    next.setAttribute("aria-label", "الصفحة التالية");
    nextIcon.className = "nds-icon nds-hgi-arrow-left-01";
    nextIcon.setAttribute("aria-hidden", "true");
    next.append(nextIcon);
    if (currentPage >= pageCount) next.setAttribute("tabindex", "-1");

    root.append(previous, dots, next);
  }

  function renderCardsPage(data) {
    var empty = qs("[data-card-collection-empty]");
    var content = qs("[data-card-collection-content]");
    var titleNodes = qsa("[data-card-collection-title]");
    var descriptionNode = qs("[data-card-collection-description]");
    var breadcrumbTitle = qs("[data-card-collection-breadcrumb-title]");
    var heroHead = qs("body[data-page='cards'] .nds-hero-section .nds-section-head");
    var previousStamp = heroHead ? qs(".page-tracking-stamp", heroHead) : null;
    var trackingStamp;
    var collections = publicCardCollections(data);
    var collection = currentCardCollection(data);
    var collectionIndex = Math.max(0, collections.indexOf(collection));
    var cards = visibleCollectionCards(collection);
    var hasCollection = Boolean(collection);
    var pageCount = Math.max(1, Math.ceil(cards.length / CARD_COLLECTION_PAGE_SIZE));
    var requestedPage = Number(new URLSearchParams(location.search).get("page") || "1");
    var currentPage = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1));
    var start = (currentPage - 1) * CARD_COLLECTION_PAGE_SIZE;
    var title = hasCollection ? (collection.title || collection.slug || "البطاقات") : "البطاقات";
    var description = hasCollection ? (collection.description || "كل البطاقات المضافة تظهر هنا بشكل منظم.") : "لم يتم العثور على صفحة البطاقات المطلوبة.";

    titleNodes.forEach(function (node) { node.textContent = title; });
    if (breadcrumbTitle) breadcrumbTitle.textContent = title;
    if (descriptionNode) descriptionNode.textContent = description;
    updateDocumentTitle(data, title);
    renderSectionShareAction("body[data-page='cards'] .nds-hero-section .nds-section-head", hasCollection ? cardCollectionHref(collection, collectionIndex, currentPage) : "", title);
    if (previousStamp) previousStamp.remove();
    trackingStamp = pageTrackingStamp(collection);
    if (heroHead && trackingStamp) heroHead.append(trackingStamp);

    if (empty) empty.hidden = hasCollection && cards.length > 0;
    if (content) content.hidden = !hasCollection || cards.length < 1;
    if (!hasCollection || !cards.length) {
      renderCardsPagination(collection, collectionIndex, 1, 1);
      return;
    }

    renderCollectionCards(cards.slice(start, start + CARD_COLLECTION_PAGE_SIZE));
    renderCardsPagination(collection, collectionIndex, currentPage, pageCount);
  }

  function renderNotificationsPage() {
    var root = qs("[data-notifications-list]");
    var empty = qs("[data-notifications-empty]");
    renderSectionShareAction("body[data-page='notifications'] .nds-hero-section .nds-section-head", "notifications.html", uiText(appState.data, "notificationsLabel", "الإشعارات"));
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
        forgetNotificationDropdownOpen();
        saveNotifications(loadNotifications().filter(function (notification) {
          return notification.id !== card.dataset.notificationId;
        }), { silent: true });
        navigateAfterHeaderAction(viewLink && viewLink.href || viewHref);
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

  function paintSite(data) {
    appState.data = data;
    renderShared(appState.data);
    if (document.body.dataset.page === "home") renderHome(appState.data);
    if (document.body.dataset.page === "projects") renderProjectsPage(appState.data);
    if (document.body.dataset.page === "project-detail") renderProjectDetailPage(appState.data);
    if (document.body.dataset.page === "cards") renderCardsPage(appState.data);
    if (document.body.dataset.page === "pages") renderPagesPage(appState.data);
    if (document.body.dataset.page === "notifications") renderNotificationsPage();
    renderPageFeedback(appState.data);
    if (window.NDS && window.NDS.Mainnav && window.NDS.Mainnav.init) window.NDS.Mainnav.init();
    if (window.NDS && window.NDS.Sidemenu && window.NDS.Sidemenu.init) window.NDS.Sidemenu.init();
    initializeShareComponents();
    updateHeaderActions(appState.data);
    revealHeaderShell();
    document.documentElement.dataset.siteRendered = "true";
    startHomeInitialTopGuard();
  }

  function render() {
    document.documentElement.dataset.siteLoading = appState.data ? "refreshing" : "true";
    return window.SiteStore.load().then(function (loadedData) {
      paintSite(loadedData);
      document.documentElement.dataset.siteLoading = "false";
    }).catch(function (error) {
      appState.data = window.SiteStore.current();
      paintSite(appState.data);
      showToast(error.message || "تعذر تحميل بيانات الموقع", "error");
      document.documentElement.dataset.siteLoading = "false";
    });
  }

  var appInitialized = false;

  function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    setManualScrollRestoration();
    startHomeInitialTopGuard();
    installProjectBackdropAdapter();
    var cachedData = readCachedSiteData();
    document.documentElement.dataset.siteLoading = "true";
    if (cachedData) {
      paintSite(cachedData);
      document.documentElement.dataset.siteLoading = "refreshing";
    }
    setupNavToggle();
    setupDropmenus();
    setupHeaderMenuExclusivity();
    setupProjectTextInputClearEnhancement();
    setupSiteSearch();
    setupThemeToggle();
    setupHeaderNavScrollEvents();
    setupDigitalStampStateGuard();
    setupTopbarScrollMotion();
    setupClock();
    setupCityWeather();
    setupHeroEvents();
    setupProjectFilterEvents();
    setupLoginModal();
    setupNotifications();
    setupNotificationsPageEvents();
    setupToastEvents();
    ensureShareDropmenuOpensOnClick();
    window.SiteStore.me().then(render).catch(render);
  }

  if (document.body) {
    initApp();
  } else {
    document.addEventListener("DOMContentLoaded", initApp);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("popstate", render);
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
    renderCookieConsent: renderCookieConsent,
    renderAnalyticsIntegrations: renderAnalyticsIntegrations,
    openNotifications: openNotifications,
    isAdminAuthenticated: isAdminAuthenticated,
    addNotification: addNotification
  };
})();
