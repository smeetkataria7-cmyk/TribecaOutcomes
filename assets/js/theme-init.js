/* Applies an explicitly chosen theme before first paint, so there is no flash
   of the wrong colour scheme. Load this inline in <head>, ahead of the
   stylesheets.

   Only "light" and "dark" are ever written to the attribute. The third state,
   "system", is represented by the ABSENCE of data-theme, which lets the
   prefers-color-scheme media queries in tokens.css govern — and keep governing
   if the OS flips from light to dark while the page is open. */
(function () {
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    // "system", null, or anything unrecognised: leave the attribute off.
  } catch (e) { /* storage blocked — fall back to the OS preference */ }
})();
