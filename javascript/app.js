(function () {
  "use strict";


  var DESCRIPTIONS = {
    en: "core/app_description_en.md",
    my: "core/app_description_my.md"
  };
  var STORAGE_KEY = "esppos_desc_lang";
  var DEFAULT_LANG = "en";
  var cache = {};


  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }


  function renderDescription(text) {
    var lines = text
      .replace(/\r/g, "")
      .split("\n")
      .map(function (l) { return l.replace(/\u200b/g, "").replace(/\s+$/, ""); });

    function nextNonEmptyIsBullet(i) {
      for (var j = i + 1; j < lines.length; j++) {
        var t = lines[j].trim();
        if (t === "") continue;
        return t.indexOf("\u2022") === 0; 
      }
      return false;
    }

    var html = "";
    var listOpen = false;
    var introDone = false;

    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (t === "") continue;

      if (t.indexOf("\u2022") === 0) {
        if (!listOpen) { html += "<ul>"; listOpen = true; }
        html += "<li>" + escapeHtml(t.replace(/^\u2022\s*/, "")) + "</li>";
        continue;
      }

      if (listOpen) { html += "</ul>"; listOpen = false; }

      if (/^note\s*:/i.test(t)) {
        html += '<p class="about__note">' + escapeHtml(t) + "</p>";
        continue;
      }

      var hasUpper = /[A-Z]/.test(t);
      var hasLower = /[a-z]/.test(t);
      var isAllCaps = hasUpper && !hasLower && /^[A-Z0-9 ,.&/()'-]+$/.test(t);

      if (isAllCaps || nextNonEmptyIsBullet(i)) {
        html += "<h3>" + escapeHtml(t) + "</h3>";
        continue;
      }

      if (!introDone) {
        html += '<p class="about__intro">' + escapeHtml(t) + "</p>";
        introDone = true;
      } else {
        html += "<p>" + escapeHtml(t) + "</p>";
      }
    }

    if (listOpen) html += "</ul>";
    return html;
  }

  function setActiveButton(lang) {
    $all(".lang-toggle__btn").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function loadDescription(lang) {
    var container = $("#aboutContent");
    if (!container) return;

    setActiveButton(lang);
    container.setAttribute("lang", lang === "my" ? "my" : "en");

    if (cache[lang]) {
      container.innerHTML = cache[lang];
      return;
    }

    container.innerHTML = '<p class="about__loading">Loading description...</p>';

    fetch(DESCRIPTIONS[lang], { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        var rendered = renderDescription(text);
        cache[lang] = rendered;
        if ($("#aboutContent").getAttribute("lang") === (lang === "my" ? "my" : "en")) {
          container.innerHTML = rendered;
        }
      })
      .catch(function () {
        container.innerHTML =
          '<p class="about__loading">Description could not be loaded. ' +
          'If you are opening this file directly, please run it through a local web server ' +
          "(e.g. <code>python -m http.server</code>) or view it on the published site.</p>";
      });
  }

  function initLanguage() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var lang = saved === "my" || saved === "en" ? saved : DEFAULT_LANG;

    $all(".lang-toggle__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-lang");
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        loadDescription(next);
      });
    });

    loadDescription(lang);
  }


  function initNav() {
    var btn = $("#menuBtn");
    var links = $(".nav__links");
    if (!btn || !links) return;

    btn.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initLightbox() {
    var lightbox = $("#lightbox");
    var lightboxImg = $("#lightboxImg");
    var closeBtn = $("#lightboxClose");
    var gallery = $("#gallery");
    if (!lightbox || !lightboxImg || !gallery) return;

    function open(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || "Enlarged screenshot";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImg.src = "";
      document.body.style.overflow = "";
    }

    gallery.addEventListener("click", function (e) {
      var item = e.target.closest(".gallery__item");
      if (!item) return;
      var img = item.querySelector("img");
      open(item.getAttribute("data-src"), img ? img.alt : "");
    });

    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) close();
    });
  }

  function initYear() {
    var el = $("#year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLanguage();
    initNav();
    initLightbox();
    initYear();
  });
})();
