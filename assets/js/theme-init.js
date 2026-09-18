/* Applies the saved theme before first paint so there is no flash of the
   wrong colour scheme. Load this inline in <head>, ahead of the stylesheets. */
(function () {
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) { /* storage blocked — fall back to the OS preference */ }
})();
