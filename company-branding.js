/* Shared public-site company branding driven by app_settings.company_profile. */
(function (window, document) {
  'use strict';

  var DEFAULT_COMPANY_NAME = '';
  var DEFAULT_TRADING_NAME = '';

  function clean(value) {
    return String(value || '').trim();
  }

  function profileFrom(settings) {
    if (!settings) return {};
    return settings.company_profile || settings;
  }

  function companyName(settings) {
    return clean(profileFrom(settings).companyName) || DEFAULT_COMPANY_NAME;
  }

  function tradingName(settings) {
    var profile = profileFrom(settings);
    var fullName = companyName(profile);
    var shortName = clean(profile.tradingName);

    if (!shortName || (shortName === DEFAULT_TRADING_NAME && fullName !== DEFAULT_COMPANY_NAME)) {
      return fullName;
    }

    return shortName;
  }

  function brandWord(settings) {
    var shortName = tradingName(settings);
    return clean(shortName.split(/\s+/)[0]);
  }

  function isConfigured(settings) {
    return Boolean(companyName(settings));
  }

  function replaceTokens(value, settings) {
    var replacements = {
      'Hilltop Properties Zambia': companyName(settings),
      'Hilltop Properties': tradingName(settings),
      'Hilltop': brandWord(settings),
      'HILLTOP': brandWord(settings).toUpperCase()
    };

    return String(value || '').replace(
      /Hilltop Properties Zambia|Hilltop Properties|HILLTOP|Hilltop/g,
      function (match) { return replacements[match]; }
    );
  }

  function shouldSkipTextNode(node) {
    var parent = node && node.parentElement;
    if (!parent) return true;
    return /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/.test(parent.tagName) ||
      Boolean(parent.closest('[data-company-brand-locked]'));
  }

  function isBrandLocked(element) {
    return Boolean(element && element.closest('[data-company-brand-locked]'));
  }

  function apply(settings) {
    var fullName = companyName(settings);

    document.querySelectorAll('[data-company-name]').forEach(function (element) {
      element.textContent = fullName;
    });

    document.querySelectorAll('.brand, .footer-wordmark, [data-company-wordmark]').forEach(function (element) {
      var originalWordmark = clean(element.textContent);
      var wordmark = brandWord(settings);
      element.textContent = originalWordmark && originalWordmark === originalWordmark.toUpperCase()
        ? wordmark.toUpperCase()
        : wordmark;
    });

    var walker = document.createTreeWalker(document.body, window.NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var current;
    while ((current = walker.nextNode())) {
      if (!shouldSkipTextNode(current)) textNodes.push(current);
    }

    textNodes.forEach(function (node) {
      var updated = replaceTokens(node.nodeValue, settings);
      if (updated !== node.nodeValue) node.nodeValue = updated;
    });

    ['aria-label', 'title', 'placeholder', 'alt'].forEach(function (attribute) {
      document.querySelectorAll('[' + attribute + ']').forEach(function (element) {
        if (isBrandLocked(element)) return;
        var currentValue = element.getAttribute(attribute);
        var updatedValue = replaceTokens(currentValue, settings);
        if (updatedValue !== currentValue) element.setAttribute(attribute, updatedValue);
      });
    });

    document.querySelectorAll('meta[content]').forEach(function (meta) {
      var currentContent = meta.getAttribute('content');
      var updatedContent = replaceTokens(currentContent, settings);
      if (updatedContent !== currentContent) meta.setAttribute('content', updatedContent);
    });

    var path = String(window.location.pathname || '').split('/').pop().toLowerCase();
    if (!path || path === 'index.html' || path === 'website.html') {
      document.title = fullName;
    } else if (path === 'about.html' || path === 'about') {
      document.title = 'About ' + fullName;
    } else if (path === 'services.html' || path === 'services') {
      document.title = 'Services | ' + fullName;
    } else if (path === 'listings.html' || path === 'listings') {
      document.title = 'Property Listings | ' + fullName;
    } else if (document.title.indexOf('Loading website') !== -1) {
      document.title = fullName;
    } else {
      document.title = replaceTokens(document.title, settings);
    }
    document.documentElement.setAttribute('data-current-company-name', fullName);
  }

  function ensureLoadingSkeleton() {
    document.documentElement.classList.add('public-site-loading');
    if (!document.body || document.getElementById('publicSiteSkeleton')) return;

    var skeleton = document.createElement('div');
    skeleton.id = 'publicSiteSkeleton';
    skeleton.className = 'public-site-skeleton';
    skeleton.setAttribute('role', 'status');
    skeleton.setAttribute('aria-live', 'polite');
    skeleton.setAttribute('aria-label', 'Loading website details');
    skeleton.innerHTML = [
      '<div class="public-site-skeleton__shell">',
      '<div class="public-site-skeleton__header"><span></span><span></span><span></span></div>',
      '<div class="public-site-skeleton__hero">',
      '<span class="public-site-skeleton__eyebrow"></span>',
      '<span class="public-site-skeleton__title"></span>',
      '<span class="public-site-skeleton__line"></span>',
      '<span class="public-site-skeleton__line public-site-skeleton__line--short"></span>',
      '<span class="public-site-skeleton__button"></span>',
      '</div>',
      '<div class="public-site-skeleton__cards"><span></span><span></span><span></span></div>',
      '<p>Loading website details…</p>',
      '</div>'
    ].join('');
    document.body.appendChild(skeleton);
  }

  function completeLoading() {
    var skeleton = document.getElementById('publicSiteSkeleton');
    document.documentElement.classList.remove('public-site-loading');
    document.documentElement.classList.add('public-site-ready');
    if (skeleton) skeleton.remove();
  }

  function failLoading(message) {
    ensureLoadingSkeleton();
    var skeleton = document.getElementById('publicSiteSkeleton');
    if (!skeleton) return;
    skeleton.classList.add('public-site-skeleton--error');
    skeleton.innerHTML = [
      '<div class="public-site-skeleton__message">',
      '<span class="public-site-skeleton__message-icon" aria-hidden="true">!</span>',
      '<h1>Website details unavailable</h1>',
      '<p>' + clean(message || 'This website has not been configured yet. Please try again shortly.') + '</p>',
      '</div>'
    ].join('');
  }

  window.websiteBranding = {
    apply: apply,
    companyName: companyName,
    tradingName: tradingName,
    replaceTokens: replaceTokens,
    isConfigured: isConfigured
  };

  window.websiteLoading = {
    show: ensureLoadingSkeleton,
    complete: completeLoading,
    fail: failLoading
  };

  ensureLoadingSkeleton();
})(window, document);
