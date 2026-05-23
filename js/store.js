(function () {
  "use strict";

  var DATA_KEY = "websiteDemo:siteData";

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
      console.error("تعذر قراءة البيانات المحلية.", error);
      return null;
    }
  }

  function writeLocal(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  function notify(data) {
    window.dispatchEvent(new CustomEvent("site:datachange", { detail: clone(data) }));
  }

  window.SiteStore = {
    load: function () {
      return mergeObject(window.DEFAULT_SITE_DATA, readLocal());
    },

    save: function (data) {
      var cleanData = mergeObject(window.DEFAULT_SITE_DATA, data);
      writeLocal(cleanData);
      notify(cleanData);
      return cleanData;
    },

    reset: function () {
      localStorage.removeItem(DATA_KEY);
      var data = this.load();
      notify(data);
      return data;
    },

    exportJson: function () {
      return JSON.stringify(this.load(), null, 2);
    },

    importJson: function (jsonText) {
      var parsed = JSON.parse(jsonText);
      var data = this.save(parsed);
      return data;
    },

    clone: clone
  };

  /*
   * Future Supabase integration:
   * Keep the public API above stable: load, save, reset, exportJson, importJson.
   * Later, replace readLocal/writeLocal with Supabase select/upsert calls, or add
   * async equivalents behind the same methods. All page rendering and admin code
   * already depends on this isolated store instead of touching localStorage directly.
   */
})();
