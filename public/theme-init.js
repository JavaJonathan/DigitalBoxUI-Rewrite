// Set the colour scheme before first paint so there is no flash. Mirrors MUI's storage key.
// Kept as an external file (not inline in index.html) so the page's Content-Security-Policy
// can use `script-src 'self'` with no inline-script allowance.
(function () {
  try {
    var mode = localStorage.getItem('mui-mode') || 'system';
    var dark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var cls = dark ? 'dark' : 'light';
    document.documentElement.classList.add(cls);
    document.documentElement.style.colorScheme = cls;
  } catch {}
})();
