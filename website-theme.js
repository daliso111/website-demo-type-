/* Shared public-site theme driven by app_settings.website_preferences. */
(function (window, document) {
  'use strict';

  var DEFAULT_THEME = {
    primaryColor: '#0d1b2a',
    secondaryColor: '#4a5e3a',
    accentColor: '#c9a227'
  };

  function normalizeHex(value, fallback) {
    var hex = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
    return fallback;
  }

  function preferencesFrom(settings) {
    if (!settings) return {};
    return settings.website_preferences || settings;
  }

  function getTheme(settings) {
    var preferences = preferencesFrom(settings);
    return {
      primaryColor: normalizeHex(preferences.primaryColor, DEFAULT_THEME.primaryColor),
      secondaryColor: normalizeHex(preferences.secondaryColor, DEFAULT_THEME.secondaryColor),
      accentColor: normalizeHex(preferences.accentColor, DEFAULT_THEME.accentColor)
    };
  }

  function toRgb(hex) {
    var value = normalizeHex(hex, '#000000').slice(1);
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function toHex(value) {
    return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  }

  function lighten(hex, amount) {
    var rgb = toRgb(hex);
    return '#' +
      toHex(rgb.r + (255 - rgb.r) * amount) +
      toHex(rgb.g + (255 - rgb.g) * amount) +
      toHex(rgb.b + (255 - rgb.b) * amount);
  }

  function rgbValue(hex) {
    var rgb = toRgb(hex);
    return rgb.r + ', ' + rgb.g + ', ' + rgb.b;
  }

  function apply(settings) {
    var theme = getTheme(settings);
    var root = document.documentElement;

    root.style.setProperty('--navy', theme.primaryColor);
    root.style.setProperty('--navy-soft', lighten(theme.primaryColor, 0.13));
    root.style.setProperty('--navy-rgb', rgbValue(theme.primaryColor));
    root.style.setProperty('--army', theme.secondaryColor);
    root.style.setProperty('--army-light', lighten(theme.secondaryColor, 0.2));
    root.style.setProperty('--army-rgb', rgbValue(theme.secondaryColor));
    root.style.setProperty('--surface', lighten(theme.secondaryColor, 0.94));
    root.style.setProperty('--surface-alt', lighten(theme.secondaryColor, 0.88));
    root.style.setProperty('--border', lighten(theme.secondaryColor, 0.78));
    root.style.setProperty('--gold', theme.accentColor);
    root.setAttribute('data-website-theme', 'customizable');
  }

  window.websiteTheme = {
    apply: apply,
    defaults: Object.assign({}, DEFAULT_THEME),
    getTheme: getTheme,
    normalizeHex: normalizeHex
  };
})(window, document);
