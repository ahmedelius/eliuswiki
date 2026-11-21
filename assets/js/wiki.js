/* ==========================================================================
   EliusWiki — small, dependency-free interactions
   ========================================================================== */

(function () {
  "use strict";

  var index = Array.isArray(window.ELIUSWIKI_INDEX) ? window.ELIUSWIKI_INDEX : [];
  var base = document.documentElement.getAttribute("data-base") || "";
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
  var shortcutLabel = isMac ? "\u2318 K" : "Ctrl K";

  /* Theme ---------------------------------------------------------------- */

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem("eliuswiki-theme", theme);
      } catch (error) {
        /* Storage can be unavailable in private modes. */
      }
    }

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      var next = theme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", "Switch to " + next + " theme");
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function initTheme() {
    applyTheme(currentTheme(), false);

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
    });
  }

  /* Search --------------------------------------------------------------- */

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreItem(item, query) {
    var title = normalize(item.title);
    var description = normalize(item.description);
    var keywords = normalize(item.keywords);
    var category = normalize(item.category);
    var tokens = query.split(" ").filter(Boolean);
    var score = 0;

    if (title === query) score += 120;
    if (title.indexOf(query) === 0) score += 80;
    if (title.indexOf(query) !== -1) score += 55;
    if (keywords.indexOf(query) !== -1) score += 35;
    if (description.indexOf(query) !== -1) score += 18;
    if (category.indexOf(query) !== -1) score += 12;

    tokens.forEach(function (token) {
      if (title.indexOf(token) !== -1) score += 14;
      else if (keywords.indexOf(token) !== -1) score += 8;
      else if (description.indexOf(token) !== -1) score += 4;
      else if (category.indexOf(token) !== -1) score += 3;
      else score -= 2;
    });

    return score;
  }

  function search(query) {
    var q = normalize(query);
    if (!q) return [];

    return index
      .map(function (item) {
        return { item: item, score: scoreItem(item, q) };
      })
      .filter(function (entry) {
        return entry.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score || a.item.title.localeCompare(b.item.title);
      })
      .slice(0, 7)
      .map(function (entry) {
        return entry.item;
      });
  }

  function initSearch(root) {
    var form = root.querySelector("[data-search-form]");
    var input = root.querySelector("[data-search-input]");
    var results = root.querySelector("[data-search-results]");

    if (!form || !input || !results) return;

    var active = -1;
    var current = [];
    var listboxId = results.id || "search-results";
    results.setAttribute("role", "listbox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listboxId);
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-keyshortcuts", "Control+K Meta+K /");

    var kbd = root.querySelector(".search-kbd");
    if (kbd) kbd.textContent = shortcutLabel;

    function close() {
      active = -1;
      current = [];
      results.hidden = true;
      results.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function setActive(next) {
      if (!current.length) return;
      active = (next + current.length) % current.length;
      var links = results.querySelectorAll("[data-search-result]");
      links.forEach(function (link, i) {
        var selected = i === active;
        link.classList.toggle("is-active", selected);
        link.setAttribute("aria-selected", selected ? "true" : "false");
        if (selected) {
          input.setAttribute("aria-activedescendant", link.id);
          link.scrollIntoView({ block: "nearest" });
        }
      });
    }

    function render(query) {
      current = search(query);
      active = -1;
      results.innerHTML = "";

      if (!query.trim()) {
        close();
        return;
      }

      if (!current.length) {
        var empty = document.createElement("div");
        empty.className = "search-empty";
        empty.textContent = "No matches. Try \u201cElius\u201d, \u201cprojects\u201d, or \u201ccontact\u201d.";
        results.appendChild(empty);
      } else {
        current.forEach(function (item, i) {
          var link = document.createElement("a");
          link.className = "search-result";
          link.id = listboxId + "-option-" + i;
          link.href = base + item.url;
          link.setAttribute("role", "option");
          link.setAttribute("data-search-result", "");
          link.setAttribute("aria-selected", "false");

          var title = document.createElement("span");
          title.className = "search-result-title";
          title.textContent = item.title;

          var kind = document.createElement("span");
          kind.className = "search-result-kind";
          kind.textContent = item.category || "Article";
          title.appendChild(kind);

          var desc = document.createElement("span");
          desc.className = "search-result-desc";
          desc.textContent = item.description || "";

          link.appendChild(title);
          link.appendChild(desc);
          results.appendChild(link);
        });
      }

      results.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", function () {
      render(input.value);
    });

    input.addEventListener("focus", function () {
      if (input.value.trim()) render(input.value);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (results.hidden) render(input.value);
        setActive(active + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (results.hidden) render(input.value);
        setActive(active - 1);
      } else if (event.key === "Enter") {
        if (active >= 0 && current[active]) {
          event.preventDefault();
          window.location.href = base + current[active].url;
        }
      } else if (event.key === "Escape") {
        close();
        input.blur();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (current[active]) {
        window.location.href = base + current[active].url;
      } else if (current[0]) {
        window.location.href = base + current[0].url;
      } else {
        render(input.value);
      }
    });

    results.addEventListener("click", function (event) {
      if (event.target.closest("[data-search-result]")) close();
    });

    document.addEventListener("click", function (event) {
      if (!root.contains(event.target)) close();
    });
  }

  function initSearchShortcut() {
    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        var input = document.querySelector("[data-search-input]");
        if (!input) return;
        event.preventDefault();
        input.focus();
        input.select();
      }

      if (event.key === "Escape") {
        var menu = document.querySelector("[data-menu-toggle]");
        if (document.body.classList.contains("nav-open")) {
          document.body.classList.remove("nav-open");
          setPageInert(false);
          if (menu) {
            menu.setAttribute("aria-expanded", "false");
            menu.setAttribute("aria-label", "Open navigation");
            menu.focus();
          }
        }
      }
    });
  }

  /* Mobile navigation ---------------------------------------------------- */

  function setPageInert(inert) {
    ["#main", ".site-footer"].forEach(function (selector) {
      var node = document.querySelector(selector);
      if (!node) return;
      if (inert) node.setAttribute("inert", "");
      else node.removeAttribute("inert");
    });
  }

  function trackHeaderHeight() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    function update() {
      document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    }

    update();

    if ("ResizeObserver" in window) {
      new ResizeObserver(update).observe(header);
    } else {
      window.addEventListener("resize", update);
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    if (!button) return;

    button.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      setPageInert(open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });

    document.querySelectorAll(".sidebar a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        setPageInert(false);
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open navigation");
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 940) {
        document.body.classList.remove("nav-open");
        setPageInert(false);
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Copy page link ------------------------------------------------------- */

  function initCopyLinks() {
    var buttons = document.querySelectorAll("[data-copy-link]");
    if (!buttons.length) return;

    var live = document.createElement("div");
    live.className = "sr-only";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        var url = window.location.href;

        function done() {
          var original = button.textContent;
          button.textContent = "Copied";
          live.textContent = "Link copied to clipboard.";
          window.setTimeout(function () {
            button.textContent = original;
            live.textContent = "";
          }, 1600);
        }

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(done).catch(function () {
            window.prompt("Copy this link:", url);
          });
        } else {
          window.prompt("Copy this link:", url);
        }
      });
    });
  }

  /* Random article ------------------------------------------------------- */

  function initRandom() {
    document.querySelectorAll("[data-random]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var articles = index.filter(function (item) {
          return item.url.indexOf("wiki/") === 0;
        });
        if (!articles.length) {
          window.location.href = base + "wiki/all.html";
          return;
        }

        var currentFile = window.location.pathname.split("/").pop();
        var pool = articles.filter(function (item) {
          return item.url.split("/").pop() !== currentFile;
        });
        var choice = (pool.length ? pool : articles)[Math.floor(Math.random() * (pool.length ? pool.length : articles.length))];
        window.location.href = base + choice.url;
      });
    });
  }

  /* Table of contents ---------------------------------------------------- */

  function initToc() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = new Map();
    links.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute("href").slice(1));
      var heading = document.getElementById(id);
      if (heading) map.set(heading, link);
    });

    if (!map.size) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.remove("active");
          });
          var link = map.get(entry.target);
          if (link) link.classList.add("active");
        });
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 }
    );

    map.forEach(function (link, heading) {
      observer.observe(heading);
    });
  }

  /* Small details -------------------------------------------------------- */

  function initMisc() {
    document.querySelectorAll("[data-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      var update = function () {
        themeColor.setAttribute("content", currentTheme() === "dark" ? "#121211" : "#f5f1e8");
      };
      update();
      document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
        button.addEventListener("click", update);
      });
    }
  }

  /* Boot ----------------------------------------------------------------- */

  function boot() {
    initTheme();
    document.querySelectorAll("[data-search]").forEach(initSearch);
    initSearchShortcut();
    trackHeaderHeight();
    initMenu();
    initCopyLinks();
    initRandom();
    initToc();
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
