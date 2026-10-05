/* Shared public-site WhatsApp CTA. Keep the official number configured here. */
(function () {
  'use strict';

  var HILLTOP_WHATSAPP_NUMBER = '260979972019';
  var WHATSAPP_ASSET_PATH = '/assets/images/hilltop-whatsapp-quick-action.png';
  var INTRO_SESSION_KEY = 'hilltopWhatsAppIntroSeen';
  var GENERIC_MESSAGE = 'Hello Hilltop Properties, I would like some assistance regarding your properties.';
  var INTRO_DELAY_MS = 500;
  var INTRO_DURATION_MS = 2200;
  var RETURN_TO_IDLE_MS = 3000;
  var RETURN_VISIT_VISIBLE_MS = 900;

  var cta = null;
  var idleTimer = null;
  var introTimer = null;
  var introFallbackTimer = null;
  var pointerInside = false;
  var propertyContext = null;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setState(state) {
    if (cta) cta.setAttribute('data-state', state);
  }

  function clearTimer(timer) {
    if (timer) window.clearTimeout(timer);
    return null;
  }

  function cleanPageUrl(value) {
    try {
      var url = new URL(value || window.location.href);
      url.hash = '';
      return url.toString();
    } catch (error) {
      return window.location.href.split('#')[0];
    }
  }

  function buildMessage() {
    if (!propertyContext || !propertyContext.title) return GENERIC_MESSAGE;
    return "Hello Hilltop Properties, I'm interested in " + propertyContext.title +
      '. Could I get more information?\n\n' + cleanPageUrl(propertyContext.url);
  }

  function buildWhatsappUrl() {
    return 'https://wa.me/' + HILLTOP_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage());
  }

  function updateHref() {
    if (cta) cta.href = buildWhatsappUrl();
  }

  function storeIntroSeen() {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch (error) {
      // The CTA still works when storage is unavailable.
    }
  }

  function hasSeenIntro() {
    try {
      return window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function isKeyboardFocused() {
    return document.activeElement === cta && cta.matches(':focus-visible');
  }

  function enterIdle() {
    idleTimer = clearTimer(idleTimer);
    if (!pointerInside && !isKeyboardFocused()) setState('idle');
  }

  function scheduleIdle(delay) {
    idleTimer = clearTimer(idleTimer);
    idleTimer = window.setTimeout(enterIdle, typeof delay === 'number' ? delay : RETURN_TO_IDLE_MS);
  }

  function enterInteraction() {
    introTimer = clearTimer(introTimer);
    introFallbackTimer = clearTimer(introFallbackTimer);
    idleTimer = clearTimer(idleTimer);
    storeIntroSeen();
    setState('interaction');
  }

  function finishIntro() {
    introFallbackTimer = clearTimer(introFallbackTimer);
    enterIdle();
  }

  function startLifecycle() {
    setState('active');

    if (reducedMotion) {
      storeIntroSeen();
      window.requestAnimationFrame(function () { setState('idle'); });
      return;
    }

    if (hasSeenIntro()) {
      scheduleIdle(RETURN_VISIT_VISIBLE_MS);
      return;
    }

    storeIntroSeen();
    introTimer = window.setTimeout(function () {
      introTimer = null;
      setState('intro');
      introFallbackTimer = window.setTimeout(finishIntro, INTRO_DURATION_MS + 80);
    }, INTRO_DELAY_MS);
  }

  function bindInteractionEvents() {
    cta.addEventListener('animationend', function (event) {
      if (event.animationName === 'hilltop-whatsapp-edge-peek') finishIntro();
    });

    cta.addEventListener('pointerenter', function () {
      pointerInside = true;
      enterInteraction();
    });

    cta.addEventListener('pointerleave', function () {
      pointerInside = false;
      if (!isKeyboardFocused()) scheduleIdle();
    });

    cta.addEventListener('pointerdown', enterInteraction);
    cta.addEventListener('pointerup', function (event) {
      if (event.pointerType === 'touch') {
        pointerInside = false;
        cta.blur();
      }
      if (!pointerInside && !isKeyboardFocused()) scheduleIdle();
    });
    cta.addEventListener('pointercancel', function (event) {
      pointerInside = event.pointerType === 'mouse' && cta.matches(':hover');
      if (!pointerInside && !isKeyboardFocused()) scheduleIdle();
    });

    cta.addEventListener('click', function () {
      enterInteraction();
      if (!pointerInside && !isKeyboardFocused()) scheduleIdle();
    });

    cta.addEventListener('focus', enterInteraction);
    cta.addEventListener('blur', function () {
      if (!pointerInside) scheduleIdle();
    });

    cta.addEventListener('touchstart', enterInteraction, { passive: true });
    cta.addEventListener('touchend', function () {
      pointerInside = false;
      cta.blur();
      scheduleIdle();
    }, { passive: true });
  }

  function initialize() {
    if (cta || document.querySelector('.hilltop-whatsapp-cta')) return;

    cta = document.createElement('a');
    cta.className = 'hilltop-whatsapp-cta';
    cta.setAttribute('data-state', 'active');
    cta.setAttribute('data-testid', 'hilltop-whatsapp-cta');
    cta.setAttribute('aria-label', 'Chat with Hilltop Properties on WhatsApp');
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';

    var icon = document.createElement('img');
    icon.src = WHATSAPP_ASSET_PATH;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    icon.width = 900;
    icon.height = 900;
    cta.appendChild(icon);

    updateHref();
    bindInteractionEvents();
    document.body.appendChild(cta);
    startLifecycle();
  }

  window.HilltopWhatsAppCTA = {
    setProperty: function (property) {
      propertyContext = property && property.title ? {
        title: String(property.title).trim(),
        url: property.url || window.location.href
      } : null;
      updateHref();
    },
    clearProperty: function () {
      propertyContext = null;
      updateHref();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}());
