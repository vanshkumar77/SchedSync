// ============================================================
// SchedSync — Theme Toggle (Light / Dark Mode)
// ============================================================
// Toggles between light and dark themes by switching the
// data-theme attribute on <html>. Persists preference in
// localStorage.
// ============================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'schedsync-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  const html = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  /**
   * Returns the user's saved theme, or defaults based on system preference.
   */
  function getSavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === DARK || saved === LIGHT) return saved;

    // Default to system preference, fallback to dark
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return LIGHT;
    }
    return DARK;
  }

  /**
   * Applies the given theme and updates the toggle icon.
   * @param {'light'|'dark'} theme
   */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update icon
    if (themeIcon) {
      themeIcon.textContent = theme === DARK ? '🌙' : '☀️';
      themeIcon.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  /**
   * Toggles between light and dark mode.
   */
  function toggleTheme() {
    const current = html.getAttribute('data-theme') || DARK;
    const next = current === DARK ? LIGHT : DARK;
    applyTheme(next);
  }

  // ---- Initialize ----
  applyTheme(getSavedTheme());

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a manual preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? DARK : LIGHT);
      }
    });
  }
})();
