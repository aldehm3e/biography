(function () {
  "use strict";

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function activateTab(container, tab) {
    var tabs = qsa('[role="tab"]', container).filter(function (item) {
      return !item.classList.contains("nds-show-more");
    });
    var panels = qsa('[role="tabpanel"]', container);

    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      item.dataset.state = selected ? "selected" : "";
    });

    panels.forEach(function (panel) {
      var selected = panel.id === tab.getAttribute("aria-controls");
      panel.hidden = !selected;
      panel.setAttribute("aria-hidden", String(!selected));
      panel.tabIndex = selected ? 0 : -1;
    });
  }

  function textDirection(value) {
    var text = String(value || "").trim();
    for (var index = 0; index < text.length; index++) {
      var code = text.charCodeAt(index);
      if ((code >= 0x0600 && code <= 0x06ff) || (code >= 0x0750 && code <= 0x077f) || (code >= 0x08a0 && code <= 0x08ff)) return "rtl";
      if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) return "ltr";
    }
    return document.documentElement.dir || "rtl";
  }

  function applyComponentDirection(component) {
    if (!component || component.hasAttribute("dir")) return;
    var source = component.querySelector('[role="tab"], .nds-card-title, .nds-block-title, .nds-label, p, li, dd, dt') || component;
    component.setAttribute("dir", textDirection(source.textContent));
  }

  function scrollTabs(container, direction) {
    var list = container.querySelector(".nds-tab-list");
    if (!list) return;
    var amount = Math.max(180, Math.floor(list.clientWidth * 0.75));
    var isRTL = (container.getAttribute("dir") || document.documentElement.dir) === "rtl";
    var delta = direction === "next" ? amount : -amount;
    list.scrollBy({ left: isRTL ? -delta : delta, behavior: "smooth" });
  }

  function setupTabs() {
    qsa(".nds-tabs").forEach(function (container) {
      if (container.dataset.ndsLocalTabs === "ready") return;
      container.dataset.ndsLocalTabs = "ready";
      applyComponentDirection(container);
      container.hidden = false;
      var tabs = qsa('[role="tab"]', container).filter(function (item) {
        return !item.classList.contains("nds-show-more");
      });
      var active = tabs.find(function (tab) {
        return tab.getAttribute("aria-selected") === "true";
      }) || tabs[0];
      if (active) activateTab(container, active);

      container.addEventListener("click", function (event) {
        if (event.target.closest(".nds-show-more")) {
          scrollTabs(container, "next");
          return;
        }
        var tab = event.target.closest('[role="tab"]');
        if (!tab || tab.classList.contains("nds-show-more")) return;
        activateTab(container, tab);
      });

      container.addEventListener("keydown", function (event) {
        var tab = event.target.closest('[role="tab"]');
        if (!tab) return;
        var tabs = qsa('[role="tab"]', container).filter(function (item) {
          return !item.classList.contains("nds-show-more");
        });
        var current = tabs.indexOf(tab);
        var next = current;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = current <= 0 ? tabs.length - 1 : current - 1;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = current >= tabs.length - 1 ? 0 : current + 1;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next !== current) {
          event.preventDefault();
          tabs[next].focus();
          activateTab(container, tabs[next]);
        }
      });
    });
  }

  function setupAccordions() {
    qsa(".nds-accordion").forEach(function (accordion) {
      if (accordion.dataset.ndsLocalAccordion === "ready") return;
      accordion.dataset.ndsLocalAccordion = "ready";
      qsa(".nds-accordion-btn", accordion).forEach(function (button) {
        var panel = document.getElementById(button.getAttribute("aria-controls"));
        var expanded = button.getAttribute("aria-expanded") === "true";
        if (panel) panel.dataset.state = expanded ? "open" : "";
        button.addEventListener("click", function () {
          var isOpen = button.getAttribute("aria-expanded") === "true";
          if (!accordion.dataset.state || accordion.dataset.state.indexOf("always-open") === -1) {
            qsa(".nds-accordion-btn", accordion).forEach(function (other) {
              if (other === button) return;
              other.setAttribute("aria-expanded", "false");
              var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
              if (otherPanel) otherPanel.dataset.state = "";
            });
          }
          button.setAttribute("aria-expanded", String(!isOpen));
          if (panel) panel.dataset.state = isOpen ? "" : "open";
        });
      });
    });
  }

  function getSwiperSlidesPerView(swiper) {
    var min = parseInt(swiper.getAttribute("slides-min") || "1", 10);
    var mid = parseInt(swiper.getAttribute("slides-mid") || String(min), 10);
    var max = parseInt(swiper.getAttribute("slides-max") || String(mid), 10);
    if (window.matchMedia("(min-width: 1024px)").matches) return Math.max(1, max);
    if (window.matchMedia("(min-width: 768px)").matches) return Math.max(1, mid);
    return Math.max(1, min);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setupSwiper(swiper) {
    if (swiper.dataset.ndsLocalSwiper === "ready") return;
    swiper.dataset.ndsLocalSwiper = "ready";
    swiper.hidden = false;

    var wrapper = swiper.querySelector(".nds-swiper-wrapper");
    var slides = qsa(".nds-swiper-slide", swiper);
    var prevButton = swiper.querySelector(".nds-prev");
    var nextButton = swiper.querySelector(".nds-next");
    var pagination = swiper.querySelector(".nds-swiper-pagination");
    var currentIndex = 0;
    var scrollTimer = null;
    var wheelTimer = null;

    if (!wrapper || !slides.length) return;

    function maxIndex() {
      return Math.max(0, slides.length - getSwiperSlidesPerView(swiper));
    }

    function applyLayout() {
      var slidesPerView = Math.min(getSwiperSlidesPerView(swiper), slides.length);
      var peek = parseInt(swiper.getAttribute("peek") || "0", 10);
      swiper.style.setProperty("--swiper-slides", String(slidesPerView));
      swiper.style.setProperty("--swiper-total", String(slides.length));
      swiper.style.setProperty("--swiper-peek-size", Math.max(0, peek) + "px");
      if (peek > 0) {
        swiper.dataset.swiperPeek = "true";
      } else {
        delete swiper.dataset.swiperPeek;
      }
      currentIndex = clamp(currentIndex, 0, maxIndex());
      renderPagination();
      scrollToIndex(currentIndex, "auto");
      updateState();
    }

    function renderPagination() {
      if (!pagination) return;
      pagination.innerHTML = "";
      for (var index = 0; index <= maxIndex(); index++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "nds-swiper-dot";
        dot.setAttribute("aria-label", "Slide " + (index + 1));
        dot.dataset.swiperIndex = String(index);
        dot.addEventListener("click", function (event) {
          scrollToIndex(parseInt(event.currentTarget.dataset.swiperIndex || "0", 10), "smooth");
        });
        pagination.appendChild(dot);
      }
    }

    function updateState() {
      swiper.dataset.swiperIndex = String(currentIndex);
      if (prevButton) prevButton.disabled = currentIndex <= 0;
      if (nextButton) nextButton.disabled = currentIndex >= maxIndex();
      if (pagination) {
        qsa(".nds-swiper-dot", pagination).forEach(function (dot, index) {
          var active = index === currentIndex;
          dot.dataset.state = active ? "active" : "";
          dot.setAttribute("aria-current", active ? "true" : "false");
        });
      }
    }

    function nearestIndex() {
      var wrapperLeft = wrapper.getBoundingClientRect().left;
      var nearest = 0;
      var nearestDistance = Infinity;
      slides.forEach(function (slide, index) {
        var distance = Math.abs(slide.getBoundingClientRect().left - wrapperLeft);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      return clamp(nearest, 0, maxIndex());
    }

    function scrollToIndex(index, behavior) {
      currentIndex = clamp(index, 0, maxIndex());
      var target = slides[currentIndex];
      if (!target) return;
      target.scrollIntoView({ behavior: behavior || "smooth", block: "nearest", inline: "start" });
      updateState();
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        scrollToIndex(currentIndex - 1, "smooth");
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        scrollToIndex(currentIndex + 1, "smooth");
      });
    }

    wrapper.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        currentIndex = nearestIndex();
        updateState();
      }, 80);
    }, { passive: true });

    swiper.addEventListener("wheel", function (event) {
      if (event.ctrlKey) return;
      var delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      if (wheelTimer) return;
      scrollToIndex(currentIndex + (delta > 0 ? 1 : -1), "smooth");
      wheelTimer = setTimeout(function () {
        wheelTimer = null;
      }, 220);
    }, { passive: false });

    window.addEventListener("resize", applyLayout);
    applyLayout();
  }

  function setupSwipers() {
    qsa(".nds-swiper").forEach(function (swiper) {
      applyComponentDirection(swiper);
      setupSwiper(swiper);
    });
  }

  function closeDropmenus(except) {
    qsa(".nds-dropmenu").forEach(function (menu) {
      if (menu === except) return;
      var trigger = menu.querySelector(".nds-dropmenu-trigger");
      var panel = menu.querySelector(".nds-dropmenu-menu");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (panel) panel.hidden = true;
      menu.dataset.state = "";
    });
  }

  function setupDropmenus() {
    qsa(".rich-html-content .nds-dropmenu").forEach(function (menu) {
      if (menu.dataset.ndsLocalDropmenu === "ready") return;
      menu.dataset.ndsLocalDropmenu = "ready";
      applyComponentDirection(menu);
      var trigger = menu.querySelector(".nds-dropmenu-trigger");
      var panel = menu.querySelector(".nds-dropmenu-menu");
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      qsa(".nds-dropmenu-item", panel).forEach(function (item) {
        item.setAttribute("role", "menuitem");
      });
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        var willOpen = panel.hidden;
        closeDropmenus(menu);
        panel.hidden = !willOpen;
        trigger.setAttribute("aria-expanded", String(willOpen));
        menu.dataset.state = willOpen ? "open" : "";
      });
    });
  }

  function setupAutoDirection(root) {
    qsa(
      ".rich-html-content p, .rich-html-content li, .rich-html-content dd, .rich-html-content dt, " +
      ".rich-html-content blockquote, .rich-html-content figcaption, " +
      ".rich-html-content h1, .rich-html-content h2, .rich-html-content h3, .rich-html-content h4, .rich-html-content h5, .rich-html-content h6, " +
      ".rich-html-content .nds-card-title, .rich-html-content .nds-card-description, " +
      ".rich-html-content .nds-block-title, .rich-html-content .nds-label, " +
      ".rich-html-content .nds-tab-panel, .rich-html-content .nds-accordion-body, " +
      ".nds-tabs .nds-tab, .nds-tabs .nds-label, .nds-tabs .nds-block-title, " +
      ".nds-swiper .nds-card-title, .nds-swiper .nds-card-description, .nds-swiper .nds-label",
      root || document
    ).forEach(function (node) {
      if (!node.hasAttribute("dir")) node.setAttribute("dir", "auto");
    });
  }

  function observeDynamicContent() {
    if (!("MutationObserver" in window) || document.documentElement.dataset.ndsLocalObserver === "ready") return;
    document.documentElement.dataset.ndsLocalObserver = "ready";
    var timer = null;
    var observer = new MutationObserver(function (mutations) {
      var shouldRefresh = mutations.some(function (mutation) {
        return Array.prototype.slice.call(mutation.addedNodes || []).some(function (node) {
          return node.nodeType === 1 && (
            node.matches(".rich-html-content, .nds-tabs, .nds-accordion, .nds-swiper") ||
            node.matches(".nds-dropmenu") ||
            node.querySelector(".rich-html-content, .nds-tabs, .nds-accordion, .nds-swiper, .nds-dropmenu")
          );
        });
      });
      if (!shouldRefresh) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        setupTabs();
        setupAccordions();
        setupSwipers();
        setupDropmenus();
        setupAutoDirection();
      }, 0);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupTabs();
    setupAccordions();
    setupSwipers();
    setupDropmenus();
    setupAutoDirection();
    observeDynamicContent();
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".nds-dropmenu")) closeDropmenus();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeDropmenus();
  });

  window.NDSLocalComponents = {
    refresh: function () {
      setupTabs();
      setupAccordions();
      setupSwipers();
      setupDropmenus();
      setupAutoDirection();
    }
  };
})();
