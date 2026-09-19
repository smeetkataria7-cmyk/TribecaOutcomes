/* ==========================================================================
   Site behaviour. All progressive enhancement — the page is fully usable
   and fully legible with this file absent.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  // Marks that scripting is live, which is what arms the reveal transitions.
  // Set first so elements are hidden before first paint, not after.
  root.classList.add("js");

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    initMobileNav();
    initStickyHeader();
    initReveal();
    initThemeToggle();
    initProgress();
    initSplit();
    initParallax();
    initTilt();
    markCurrentNavLink();
  });

  /* --- Mobile navigation ------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-mobile-nav]");
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.setAttribute("data-open", String(open));
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close on Escape, and whenever a link inside is followed.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    // Reset state if the viewport grows past the desktop breakpoint.
    var desktop = window.matchMedia("(min-width: 56rem)");
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* --- Sticky header shadow --------------------------------------------- */
  function initStickyHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    // A zero-height sentinel above the fold is cheaper than a scroll listener.
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;height:1px;width:1px;";
    document.body.prepend(sentinel);

    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* --- Scroll reveal ----------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal], [data-split]");
    if (!items.length) return;

    // Index the children of each group so CSS can stagger them.
    document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty("--i", i);
      });
    });

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target); // reveal once, never re-hide
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* --- Split headings into words so they can assemble ---------------------- */
  function initSplit() {
    var els = document.querySelectorAll("[data-split]");
    if (!els.length || reduced()) return;

    els.forEach(function (el) {
      // Capture the text exactly, then rebuild it. Whitespace runs are kept as
      // their own text nodes, so the rendered string is byte-identical to the
      // copy the client supplied — this must never paraphrase.
      var parts = el.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      var i = 0;
      parts.forEach(function (part) {
        if (part === "") return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        var w = document.createElement("span");
        w.className = "w";
        w.style.setProperty("--w", i++);
        w.textContent = part;
        frag.appendChild(w);
      });
      el.textContent = "";
      el.appendChild(frag);
      el.classList.add("split");
    });
  }

  /* --- Hero parallax ------------------------------------------------------- */
  function initParallax() {
    var hero = document.querySelector(".hero--image");
    if (!hero || reduced()) return;
    var media = hero.querySelector(".hero__media");
    var body = hero.querySelector(".hero__body");
    if (!media) return;

    var ticking = false;
    function update() {
      ticking = false;
      var h = hero.offsetHeight || 1;
      var y = Math.min(window.scrollY, h);          // clamped: never runs away
      media.style.setProperty("--par", (y * 0.26).toFixed(1) + "px");
      if (body) {
        var f = 1 - y / (h * 0.8);
        body.style.setProperty("--heroFade", Math.max(0, Math.min(1, f)).toFixed(3));
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* --- Portraits tilt toward the pointer ----------------------------------- */
  function initTilt() {
    if (reduced()) return;
    // Pointer tilt is meaningless on touch, and fine motor control is assumed.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.querySelectorAll(".team-card").forEach(function (card) {
      var avatar = card.querySelector(".team-card__avatar");
      if (!avatar) return;
      card.addEventListener("pointermove", function (e) {
        var r = avatar.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        avatar.style.setProperty("--ty", (px * 16).toFixed(2) + "deg");
        avatar.style.setProperty("--tx", (-py * 16).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        avatar.style.setProperty("--ty", "0deg");
        avatar.style.setProperty("--tx", "0deg");
      });
    });
  }

  /* --- Scroll progress bar ------------------------------------------------ */
  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bar.remove();
      return;
    }

    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    }
    // rAF-throttled: scroll fires far more often than the screen repaints.
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* --- Theme control: System / Light / Dark ------------------------------ */
  function initThemeToggle() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    var MODES = ["system", "light", "dark"];
    var LABEL = { system: "System", light: "Light", dark: "Dark" };
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var status = btn.querySelector("[data-theme-status]");

    // "system" is stored as the absence of a key, so a visitor who never
    // touches the control keeps following their OS forever.
    function stored() {
      try {
        var v = localStorage.getItem("theme");
        return v === "light" || v === "dark" ? v : "system";
      } catch (e) { return "system"; }
    }

    function effective(mode) {
      return mode === "system" ? (mq.matches ? "dark" : "light") : mode;
    }

    function render(mode) {
      // Absence of the attribute is what hands control back to the media query.
      if (mode === "system") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", mode);

      btn.setAttribute("data-mode", mode);
      if (!reduced()) {
        btn.classList.remove("is-changing");
        void btn.offsetWidth;            // restart the animation
        btn.classList.add("is-changing");
      }
      var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      var shown = LABEL[mode] + (mode === "system" ? " (" + LABEL[effective(mode)] + ")" : "");
      btn.setAttribute("aria-label", "Theme: " + shown + ". Switch to " + LABEL[next] + ".");
      btn.setAttribute("title", "Theme: " + shown);
      if (status) status.textContent = "Theme: " + shown;
    }

    function set(mode) {
      try {
        if (mode === "system") localStorage.removeItem("theme");
        else localStorage.setItem("theme", mode);
      } catch (e) { /* private mode: the choice just will not persist */ }
      render(mode);
    }

    btn.addEventListener("click", function () {
      var m = stored();
      set(MODES[(MODES.indexOf(m) + 1) % MODES.length]);
    });

    // While on System, the OS can flip underneath us. The CSS follows on its
    // own; this only keeps the button's label truthful.
    var onScheme = function () { if (stored() === "system") render("system"); };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
    else if (mq.addListener) mq.addListener(onScheme);

    // Render only — deliberately NOT set(), which would write a preference and
    // pin the theme on a visitor's very first page load.
    render(stored());
  }

  /* --- Current page in the nav ------------------------------------------- */
  function markCurrentNavLink() {
    var here = window.location.pathname.replace(/index\.html$/, "").replace(/\/$/, "");
    document.querySelectorAll(".nav__link, .mobile-nav__link").forEach(function (link) {
      var path = link.getAttribute("href") || "";
      if (path.charAt(0) === "#" || /^https?:/.test(path)) return;
      var norm = path.replace(/index\.html$/, "").replace(/\/$/, "").replace(/^\./, "");
      if (norm === here) link.setAttribute("aria-current", "page");
    });
  }
})();
