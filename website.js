/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - PUBLIC WEBSITE
   Phase 8A: read-only Supabase public data loading.
   ============================================================ */

var publicState = {
  properties: [],
  exclusiveProperties: [],
  images: [],
  branches: [],
  homepage: null,
  banners: [],
  testimonials: [],
  featuredRows: [],
  propertyServices: null,
  appSettings: {},
  search: '',
  purpose: 'all',
  type: 'all',
  branch: 'all',
  publicStatus: 'all',
  category: 'all',
  sort: 'newest'
};

var warnedExclusiveImageRefs = {};

const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category") || "all";
const selectedPurpose = params.get("purpose") || "all";

var listingCategoryContent = {
  houses: {
    key: 'houses',
    eyebrow: 'HOUSE LISTINGS',
    title: 'Houses',
    description: 'Explore available residential houses presented by Hilltop Properties.',
    emptyMessage: 'No houses are currently available.'
  },
  apartments: {
    key: 'apartments',
    eyebrow: 'APARTMENT LISTINGS',
    title: 'Apartments',
    description: 'Browse available apartments for comfortable living and investment.',
    emptyMessage: 'No apartments are currently available.'
  },
  land: {
    key: 'land',
    eyebrow: 'LAND LISTINGS',
    title: 'Land',
    description: 'Discover available residential, commercial and development land.',
    emptyMessage: 'No land listings are currently available.'
  },
  all: {
    key: 'all',
    eyebrow: 'PROPERTY LISTINGS',
    title: 'All Property Listings',
    description: 'Explore all available properties presented by Hilltop Properties.',
    emptyMessage: 'No property listings are currently available.'
  }
};

function normalizeListingCategory(value) {
  var category = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(listingCategoryContent, category) ? category : 'all';
}

function getCategoryConfigFromUrl() {
  return listingCategoryContent[normalizeListingCategory(selectedCategory)];
}

function normalizeListingPurpose(value) {
  var purpose = String(value || '').trim().toLowerCase();
  if (purpose === 'for rent' || purpose === 'rent') return 'For Rent';
  if (purpose === 'for sale' || purpose === 'sale') return 'For Sale';
  return 'all';
}

var categoryConfig = getCategoryConfigFromUrl();
publicState.category = categoryConfig.key;
publicState.purpose = normalizeListingPurpose(selectedPurpose);

var enquirySubmitting = false;
var activeEnquiryProperty = null;
var PUBLIC_SETTING_KEYS = [
  'company_profile',
  'website_preferences',
  'seo_metadata',
  'homepage_hero_video_url',
  'homepage_hero_poster_url',
  'homepage_hero_video_updated_at',
  'homepage_why_hero_video_url',
  'homepage_why_hero_poster_url'
];

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function byId(id) {
  return document.getElementById(id);
}

function getSupabaseClient() {
  return window.hilltopSupabase || null;
}

function currentCompanyName() {
  return window.websiteBranding
    ? window.websiteBranding.companyName(publicState.appSettings)
    : '';
}

function currentTradingName() {
  return window.websiteBranding
    ? window.websiteBranding.tradingName(publicState.appSettings)
    : '';
}

function finishPublicLoading() {
  var configured = window.websiteBranding && window.websiteBranding.isConfigured(publicState.appSettings);
  if (!configured) {
    if (window.websiteLoading) {
      window.websiteLoading.fail('This client has not added their company details yet.');
    }
    return false;
  }
  if (window.websiteLoading) window.websiteLoading.complete();
  return true;
}

function failPublicLoading(message) {
  if (window.websiteLoading) window.websiteLoading.fail(message);
}

function applyCompanyBranding() {
  if (window.websiteTheme) {
    window.websiteTheme.apply(publicState.appSettings);
  }
  if (window.websiteBranding) {
    window.websiteBranding.apply(publicState.appSettings);
  }
  renderPublicPartners();
}

function normalizePublicPartnerUrl(value) {
  var raw = String(value || '').trim();
  if (!raw) return '';
  try {
    var parsed = new URL(raw, window.location.href);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch (error) {
    return '';
  }
}

function renderPublicPartners() {
  var section = byId('partners');
  var grid = byId('partnersGrid');
  var preferences = publicState.appSettings && publicState.appSettings.website_preferences;
  if (!section || !grid) return;

  grid.innerHTML = '';
  if (!preferences || !Array.isArray(preferences.partners)) {
    section.hidden = true;
    return;
  }

  var partners = preferences.partners.map(function(partner, index) {
    if (!partner || partner.isActive === false) return null;
    var name = String(partner.name || '').trim();
    var logoUrl = normalizePublicPartnerUrl(partner.logoUrl);
    if (!name || !logoUrl) return null;
    return {
      name: name,
      logoUrl: logoUrl,
      websiteUrl: normalizePublicPartnerUrl(partner.websiteUrl),
      displayOrder: Math.max(0, Number(partner.displayOrder) || 0),
      originalIndex: index
    };
  }).filter(Boolean).sort(function(a, b) {
    return a.displayOrder - b.displayOrder || a.originalIndex - b.originalIndex;
  });

  section.hidden = partners.length === 0;

  partners.forEach(function(partner) {
    var article = document.createElement('article');
    article.className = 'partner-card partner-card--managed';
    article.setAttribute('aria-label', partner.name);

    var logoWrap = document.createElement(partner.websiteUrl ? 'a' : 'div');
    logoWrap.className = 'partner-card__logo-wrap' + (partner.websiteUrl ? ' partner-card__link' : '');
    if (partner.websiteUrl) {
      logoWrap.href = partner.websiteUrl;
      logoWrap.target = '_blank';
      logoWrap.rel = 'noopener noreferrer';
      logoWrap.setAttribute('aria-label', 'Visit ' + partner.name + ' website');
    }

    var image = document.createElement('img');
    image.className = 'partner-card__logo';
    image.src = partner.logoUrl;
    image.alt = partner.name + ' logo';
    image.loading = 'lazy';
    image.decoding = 'async';
    logoWrap.appendChild(image);
    article.appendChild(logoWrap);
    grid.appendChild(article);
  });
}

function showStatus(message, type) {
  var status = byId('siteStatus');
  if (!status) return;
  status.textContent = message;
  status.className = 'site-status' + (type ? ' ' + type : '');
}

function hideStatus() {
  var status = byId('siteStatus');
  if (status) status.className = 'site-status hidden';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function (ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function safeCssUrl(value) {
  var url = String(value || '').trim();
  if (!url) return '';
  if (!/^(https?:\/\/|assets\/|\/)/i.test(url)) return '';
  return url.replace(/["'\\()\n\r]/g, '');
}

function safeCssColor(value, fallback) {
  var color = String(value || '').trim();
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return color;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(color)) return color;
  return fallback || '#071827';
}

function safeLinkUrl(value) {
  var url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(\/|\.\/|\.\.\/|#|[a-z0-9_-]+\.html)/i.test(url)) return url;
  return '';
}

function formatPrice(price, purpose, currencyCode, billingPeriod) {
  return window.HilltopCurrency.formatPropertyPrice(
    price,
    currencyCode,
    purpose,
    billingPeriod
  );
}

function buildLookup(rows) {
  var lookup = {};
  (rows || []).forEach(function (row) {
    lookup[String(row.id)] = row;
  });
  return lookup;
}

function getBranchName(branchId) {
  var branch = publicState.branches.find(function (item) {
    return String(item.id) === String(branchId);
  });
  return branch ? branch.name : 'Hilltop Branch';
}

function getBranchById(branchId) {
  return publicState.branches.find(function (item) {
    return String(item.id) === String(branchId);
  }) || null;
}

function getPropertyById(propertyId) {
  return publicState.properties.find(function (item) {
    return String(item.id) === String(propertyId);
  }) || null;
}

function getCoverImage(propertyId) {
  var rows = publicState.images
    .filter(function (image) { return String(image.property_id) === String(propertyId); })
    .sort(function (a, b) {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return Number(a.display_order || 0) - Number(b.display_order || 0);
    });
  return rows.length ? rows[0].image_url : '';
}

function stars(rating) {
  var count = Number(rating || 5);
  var output = '';
  for (var i = 1; i <= 5; i += 1) output += i <= count ? '*' : '-';
  return output;
}

async function safeSelect(label, queryBuilder, fallback) {
  try {
    var result = await queryBuilder();
    if (result.error) throw result.error;
    return result.data || fallback || [];
  } catch (error) {
    console.warn('Public website could not load ' + label + '.', error);
    return fallback || [];
  }
}

var PUBLIC_PROPERTY_FIELDS = 'id, reference_number, title, description, price, currency_code, purpose, property_type, area, full_address, bedrooms, bathrooms, garages, square_metres, status, featured, branch_id, created_at';
var LEGACY_PUBLIC_PROPERTY_FIELDS = 'id, reference_number, title, description, price, purpose, property_type, area, full_address, bedrooms, bathrooms, garages, square_metres, status, featured, branch_id, created_at';

function isMissingCurrencyColumnError(error) {
  var message = String(error && error.message || '').toLowerCase();
  return Boolean(error) && (error.code === '42703' || message.indexOf('currency_code') !== -1);
}

function buildPublicPropertyQuery(supabase, fields) {
  return supabase
    .from('properties')
    .select(fields)
    .in('status', ['Active', 'Under Offer'])
    .order('created_at', { ascending: false });
}

async function selectPublicPropertyRows(supabase) {
  var response = await buildPublicPropertyQuery(supabase, PUBLIC_PROPERTY_FIELDS);

  if (isMissingCurrencyColumnError(response.error)) {
    console.warn('[Hilltop] The property currency migration is not applied. Public properties are loading with the legacy ZMW fallback.');
    response = await buildPublicPropertyQuery(supabase, LEGACY_PUBLIC_PROPERTY_FIELDS);
  }

  return response;
}

async function loadPublicData() {
  var supabase = getSupabaseClient();
  if (!supabase) {
    failPublicLoading('Website content could not be loaded. Please try again shortly.');
    return;
  }

  showStatus('Loading website content...');

  var results = await Promise.all([
    safeSelect('properties', function () {
      return selectPublicPropertyRows(supabase);
    }),
    safeSelect('property images', function () {
      return supabase
        .from('property_images')
        .select('property_id, image_url, display_order, is_cover')
        .order('display_order', { ascending: true });
    }),
    safeSelect('branches', function () {
      return supabase
        .from('branches')
        .select('id, name, address, contact_number')
        .order('name', { ascending: true });
    }),
    safeSelect('homepage content', function () {
      return supabase
        .from('cms_homepage_content')
        .select('id, hero_title, hero_subtitle, hero_button_text, hero_button_link, about_title, about_content, contact_phone, contact_email, contact_address, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);
    }),
    safeSelect('CMS banners', function () {
      return supabase
        .from('cms_banners')
        .select('id, title, subtitle, image_url, button_text, button_link, display_order, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    }),
    safeSelect('CMS testimonials', function () {
      return supabase
        .from('cms_testimonials')
        .select('id, client_name, client_role, message, rating, display_order, is_visible, background_type, background_image_url, background_color')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });
    }),
    safeSelect('CMS featured properties', function () {
      return supabase
        .from('cms_featured_properties')
        .select('id, property_id, display_order, is_visible')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });
    }),
    safeSelect('app settings', function () {
      return supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', PUBLIC_SETTING_KEYS);
    }),
    loadPublicPropertyServices(supabase),
    safeSelect('exclusive properties', function () {
      return supabase
        .from('properties')
        .select('id, reference_number, title, property_type, area, status, exclusive_property, branch_id, created_at')
        .eq('exclusive_property', true)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
    })
  ]);

  publicState.properties = results[0];
  publicState.images = results[1];
  publicState.branches = results[2];
  publicState.homepage = results[3] && results[3].length ? results[3][0] : null;
  publicState.banners = results[4];
  publicState.testimonials = results[5];
  publicState.featuredRows = results[6];
  publicState.appSettings = {};
  (results[7] || []).forEach(function (row) {
    publicState.appSettings[row.setting_key] = row.setting_value || {};
  });
  publicState.propertyServices = results[8];
  publicState.exclusiveProperties = results[9] || [];

  renderWebsite();
  hideStatus();
  finishPublicLoading();

  if (!publicState.properties.length) {
    showStatus('No active public properties are available yet. Please check back soon or contact ' + currentTradingName() + ' for current listings.', 'error');
  }
}

async function loadSharedPublicData() {
  var supabase = getSupabaseClient();
  if (!supabase) {
    failPublicLoading('Website content could not be loaded. Please try again shortly.');
    return;
  }

  var results = await Promise.all([
    safeSelect('branches', function () {
      return supabase
        .from('branches')
        .select('id, name, address, contact_number')
        .order('name', { ascending: true });
    }),
    safeSelect('app settings', function () {
      return supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', PUBLIC_SETTING_KEYS);
    })
  ]);

  publicState.branches = results[0];
  publicState.appSettings = {};
  (results[1] || []).forEach(function (row) {
    publicState.appSettings[row.setting_key] = row.setting_value || {};
  });

  renderContact();
  applyCompanyBranding();
  finishPublicLoading();
}

async function loadListingsData() {
  var supabase = getSupabaseClient();
  setListingsViewState('loading');

  if (!supabase) {
    renderListingsTypeFilter();
    setListingsViewState('error', 'Supabase is not configured. Listings cannot be loaded right now.');
    return;
  }

  try {
    var results = await Promise.all([
      selectPublicPropertyRows(supabase),
      supabase
        .from('property_images')
        .select('property_id, image_url, display_order, is_cover')
        .order('display_order', { ascending: true }),
      supabase
        .from('branches')
        .select('id, name, address, contact_number')
        .order('name', { ascending: true }),
      supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', PUBLIC_SETTING_KEYS)
    ]);

    results.forEach(function (result) {
      if (result.error) throw result.error;
    });

    publicState.properties = results[0].data || [];
    publicState.images = results[1].data || [];
    publicState.branches = results[2].data || [];

    publicState.appSettings = {};
    (results[3].data || []).forEach(function (row) {
      publicState.appSettings[row.setting_key] = row.setting_value || {};
    });

    renderListingsPage();
    applyCompanyBranding();
    finishPublicLoading();
  } catch (error) {
    console.warn('Public listings could not be loaded.', error);
    publicState.properties = [];
    publicState.images = [];
    renderListingsTypeFilter();
    setListingsViewState('error', 'We could not load listings right now. Please try again shortly or contact ' + currentTradingName() + '.');
    failPublicLoading('Property listings could not be loaded. Please try again shortly.');
  }
}

function isSafePropertyServicesInternalPath(value) {
  var path = String(value || '').trim();
  if (!path || path.length > 240) return false;
  if (/^(?:javascript|data|vbscript|https?):/i.test(path)) return false;
  if (/^\/\//.test(path) || /\\/.test(path) || /[<>"`]/.test(path)) return false;
  return /^(?:\/(?!\/)|\.\.?\/)?[A-Za-z0-9][A-Za-z0-9._~!$&'()*+,;=@%/?#-]*$/.test(path);
}

function isValidPropertyServicesPayload(section, cards) {
  if (!section || section.section_key !== 'homepage-property-services') return false;
  var sectionRules = [[section.eyebrow, 40], [section.heading, 80], [section.supporting_text, 300]];
  if (sectionRules.some(function (rule) {
    var value = String(rule[0] || '').trim();
    return !value || value.length > rule[1];
  })) return false;
  if (!Array.isArray(cards) || cards.length > 4) return false;

  return cards.every(function (card) {
    var requiredRules = [[card.title, 70], [card.description, 260], [card.button_label, 40], [card.image_alt, 180]];
    if (!/^[a-z0-9-]+$/.test(String(card.slug || ''))) return false;
    if (requiredRules.some(function (rule) {
      var value = String(rule[0] || '').trim();
      return !value || value.length > rule[1];
    })) return false;
    if (['all_listings', 'rental_listings', 'list_property_enquiry', 'internal_page'].indexOf(card.action_type) === -1) return false;
    return card.action_type !== 'internal_page' || isSafePropertyServicesInternalPath(card.action_value);
  });
}

async function loadPublicPropertyServices(supabase) {
  try {
    var sectionResult = await supabase
      .from('cms_services_section')
      .select('id, section_key, eyebrow, heading, supporting_text, is_visible')
      .eq('section_key', 'homepage-property-services')
      .maybeSingle();
    if (sectionResult.error || !sectionResult.data) throw new Error('Property Services settings are unavailable.');

    var cardsResult = await supabase
      .from('cms_service_cards')
      .select('section_id, slug, title, description, button_label, action_type, action_value, default_image_path, custom_image_path, image_alt, sort_order, is_visible')
      .eq('section_id', sectionResult.data.id)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    if (cardsResult.error) throw new Error('Property Services cards are unavailable.');
    if (!isValidPropertyServicesPayload(sectionResult.data, cardsResult.data || [])) {
      throw new Error('Property Services content is incomplete.');
    }
    return { section: sectionResult.data, cards: cardsResult.data || [] };
  } catch (error) {
    console.warn('Property Services CMS content could not be loaded; approved static content remains in use.');
    return null;
  }
}

function applySeoSettings() {
  var seo = publicState.appSettings.seo_metadata || {};
  if (seo.siteTitle) document.title = seo.siteTitle;

  var description = document.querySelector('meta[name="description"]');
  if (description && seo.metaDescription) {
    description.setAttribute('content', seo.metaDescription);
  }

  var keywords = document.querySelector('meta[name="keywords"]');
  if (keywords && seo.keywords) {
    keywords.setAttribute('content', seo.keywords);
  }
}

function settingUrl(key) {
  var value = publicState.appSettings[key];
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || value.value || '';
}

function setHeroPoster(hero, video, posterUrl, fallbackImageUrl) {
  if (posterUrl && video) {
    video.setAttribute('poster', posterUrl);
  } else if (video) {
    video.removeAttribute('poster');
  }

  var backgroundUrl = posterUrl || fallbackImageUrl || '';
  if (backgroundUrl && hero) {
    hero.style.backgroundImage = 'url("' + backgroundUrl + '")';
  } else if (hero) {
    hero.style.backgroundImage = '';
  }
}

function configureHeroVideo(videoUrl, posterUrl, fallbackImageUrl) {
  var hero = byId('home');
  var video = byId('heroVideo');
  if (!hero || !video) return;

  setHeroPoster(hero, video, posterUrl, fallbackImageUrl);

  if (!videoUrl || prefersReducedMotion()) {
    video.removeAttribute('src');
    video.load();
    video.classList.remove('is-visible');
    return;
  }

  if (video.getAttribute('src') !== videoUrl) {
    video.setAttribute('src', videoUrl);
  }

  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.onerror = function () {
    console.warn('Hero video failed to load. Falling back to poster/static background.');
    video.classList.remove('is-visible');
  };
  video.classList.add('is-visible');

  var playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(function (error) {
      console.warn('Hero video autoplay was blocked or failed. Falling back to poster/static background.', error);
      video.classList.remove('is-visible');
    });
  }
}

function configureWhyHeroVideo() {
  var section = document.querySelector('.why-video-hero');
  var video = byId('whyHeroVideo');
  if (!section || !video) return;

  var videoUrl = settingUrl('homepage_why_hero_video_url');
  var posterUrl = settingUrl('homepage_why_hero_poster_url');

  if (posterUrl) {
    video.setAttribute('poster', posterUrl);
    section.style.backgroundImage = 'url("' + posterUrl + '")';
  } else {
    video.removeAttribute('poster');
    section.style.backgroundImage = '';
  }

  if (!videoUrl || prefersReducedMotion()) {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.classList.remove('is-visible');
    return;
  }

  if (video.getAttribute('src') !== videoUrl) {
    video.setAttribute('src', videoUrl);
  }

  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;

  video.onloadeddata = function () {
    video.classList.add('is-visible');
  };

  video.onerror = function () {
    console.warn('Why Hilltop video failed to load. Falling back to poster/static background.');
    video.classList.remove('is-visible');
  };

  var playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(function (error) {
      console.warn('Why Hilltop video autoplay was blocked or failed. Falling back to poster/static background.', error);
      video.classList.remove('is-visible');
    });
  }
}

function renderHero() {
  var homepage = publicState.homepage || {};
  var banner = publicState.banners.length ? publicState.banners[0] : null;
  var title = homepage.hero_title || (banner && banner.title) || 'Find Verified Properties Across Zimbabwe';
  var subtitle = homepage.hero_subtitle || (banner && banner.subtitle) || 'Buy, rent, and enquire about trusted properties through ' + currentCompanyName() + '.';
  var buttonText = homepage.hero_button_text || (banner && banner.button_text) || 'View Listings';
  var buttonLink = homepage.hero_button_link || (banner && banner.button_link) || 'listings.html';

  var titleEl = byId('heroTitle');
  var subtitleEl = byId('heroSubtitle');
  var buttonEl = byId('heroButton');

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (buttonEl) {
    buttonEl.textContent = buttonText;
    buttonEl.setAttribute('href', buttonLink || '#properties');
  }

  var heroMedia = byId('heroMedia');
  var imageUrl = banner && banner.image_url;
  if (heroMedia) {
    heroMedia.className = 'hero-overlay';
    heroMedia.style.backgroundImage = '';
  }
  configureHeroVideo(
    settingUrl('homepage_hero_video_url'),
    settingUrl('homepage_hero_poster_url'),
    imageUrl
  );
}

function resolveFeaturedProperties() {
  var allPublic = (publicState.properties || []).filter(function (p) {
    if (!p) return false;
    var status = String(p.status || '').toLowerCase();
    return status === 'active' || status === 'under offer';
  });

  var propertyLookup = buildLookup(publicState.properties);
  var featuredFromCMS = (publicState.featuredRows || [])
    .map(function (row) { return propertyLookup[String(row.property_id)]; })
    .filter(Boolean)
    .filter(function (p) {
      var status = String(p.status || '').toLowerCase();
      return p.featured === true && (status === 'active' || status === 'under offer');
    });

  var featuredFromData = allPublic.filter(function (p) {
    return p.featured === true;
  });

  var featuredList = [];
  var seenIds = {};

  function addUnique(list) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p && !seenIds[p.id]) {
        seenIds[p.id] = true;
        featuredList.push(p);
      }
    }
  }

  addUnique(featuredFromCMS);
  addUnique(featuredFromData);

  return featuredList.slice(0, 3);
}

function propertyStatusClass(status) {
  var value = String(status || '').toLowerCase();
  if (value === 'active') return 'status-active';
  if (value === 'under offer') return 'status-offer';
  if (value === 'sold' || value === 'let / rented') return 'status-closed';
  return 'status-default';
}

function featuredPropertyCard(property) {
  return propertyCard(property);
}

function propertyCard(property) {
  var image = getCoverImage(property.id);
  var detailsUrl = 'property-details.html?id=' + encodeURIComponent(property.id);
  var detailsLabel = 'View details for ' + (property.title || property.reference_number || 'Hilltop property');
  var statusClass = propertyStatusClass(property.status);
  var location = property.area || getBranchName(property.branch_id) || 'Location available on request';
  var imageMarkup = image ? '<img class="property-card-img" src="' + escapeHtml(image) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" />' : '';

  var specHtmls = [];
  var isLand = String(property.property_type || '').toLowerCase() === 'land';

  if (!isLand) {
    if (Number(property.bedrooms) > 0) {
      specHtmls.push([
        '<span class="property-spec-item" title="Bedrooms">',
        '<svg class="property-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M2 20V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12"></path>',
        '<path d="M2 14h20"></path>',
        '<rect x="6" y="10" width="4" height="4"></rect>',
        '<rect x="14" y="10" width="4" height="4"></rect>',
        '</svg>',
        '<span>' + Number(property.bedrooms).toLocaleString('en-ZM') + '</span>',
        '</span>'
      ].join(''));
    }
    if (Number(property.bathrooms) > 0) {
      specHtmls.push([
        '<span class="property-spec-item" title="Bathrooms">',
        '<svg class="property-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M9 6v6H5v-6h4M2 11h20M2 17a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5H2z"></path>',
        '</svg>',
        '<span>' + Number(property.bathrooms).toLocaleString('en-ZM') + '</span>',
        '</span>'
      ].join(''));
    }
    if (Number(property.garages) > 0) {
      specHtmls.push([
        '<span class="property-spec-item" title="Garages">',
        '<svg class="property-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
        '<rect x="6" y="12" width="12" height="10"></rect>',
        '</svg>',
        '<span>' + Number(property.garages).toLocaleString('en-ZM') + '</span>',
        '</span>'
      ].join(''));
    }
  }
  if (Number(property.square_metres) > 0) {
    specHtmls.push([
      '<span class="property-spec-item" title="Area">',
      '<svg class="property-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
      '<path d="M9 3v18M15 3v18M3 9h18M3 15h18"></path>',
      '</svg>',
      '<span>' + Number(property.square_metres).toLocaleString('en-ZM') + ' m&sup2;</span>',
      '</span>'
    ].join(''));
  }
  var specsHtml = specHtmls.length ? '<div class="property-card-specs">' + specHtmls.join('') + '</div>' : '';

  return [
    '<a class="property-card" href="' + detailsUrl + '" aria-label="' + escapeHtml(detailsLabel) + '">',
    '<div class="property-card-image-wrapper">',
    '<div class="property-card-placeholder" aria-hidden="true">',
    '<svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    '<polyline points="9 22 9 12 15 12 15 22"></polyline>',
    '</svg>',
    '<span class="placeholder-text">Hilltop Property</span>',
    '</div>',
    imageMarkup,
    '<div class="property-card-badges">',
    '<span class="badge purpose-badge">' + escapeHtml(property.purpose) + '</span>',
    '<span class="badge status-badge ' + statusClass + '">' + escapeHtml(property.status) + '</span>',
    '</div>',
    '<div class="property-card-overlay-label">',
    '<span class="property-card-ref">' + escapeHtml(property.reference_number) + '</span>',
    '<h4 class="property-card-overlay-title">' + escapeHtml(property.title) + '</h4>',
    '</div>',
    '</div>',
    '<div class="property-card-body">',
    '<div class="property-card-price">' + formatPrice(property.price, property.purpose, property.currency_code, property.billing_period) + '</div>',
    '<p class="property-card-location">' + escapeHtml(location) + ' &middot; ' + escapeHtml(property.property_type) + '</p>',
    specsHtml,
    '</div>',
    '</a>'
  ].join('');
}

function renderFeatured() {
  if (!byId('featuredGrid') || !byId('featuredEmpty')) return;
  var featured = resolveFeaturedProperties();
  byId('featuredGrid').innerHTML = featured.map(featuredPropertyCard).join('');
  byId('featuredEmpty').style.display = featured.length ? 'none' : 'block';
}

function resolveMoreProperties() {
  var seenIds = {};

  return (publicState.exclusiveProperties || []).filter(function (property) {
    if (!property || property.exclusive_property !== true) return false;
    var status = String(property.status || '').toLowerCase();
    if (status !== 'active') return false;

    var propertyId = String(property.id || '');
    if (!propertyId || seenIds[propertyId]) return false;
    seenIds[propertyId] = true;

    if (!getCoverImage(property.id)) {
      var publicReference = property.reference_number || property.title || 'Unnamed exclusive property';
      if (!warnedExclusiveImageRefs[publicReference]) {
        warnedExclusiveImageRefs[publicReference] = true;
        console.warn('[Hilltop] Exclusive property omitted because it has no usable cover image: ' + publicReference);
      }
      return false;
    }

    return true;
  }).slice(0, 10);
}

function propertyDisplayTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/(^|[\s/(–—-])([a-z])/g, function (_, separator, letter) {
      return separator + letter.toUpperCase();
    })
    .replace(/\bzmw\b/gi, 'ZMW')
    .replace(/\bzambia\b/gi, 'Zambia');
}

function refinedPropertyDisplayTitle(property) {
  var rawTitle = String(property.title || property.reference_number || 'Hilltop property')
    .replace(/\s+/g, ' ')
    .trim();
  var segments = rawTitle.split(/\s+[–—-]\s+/).filter(Boolean);
  var candidate = segments[0] || rawTitle;

  candidate = candidate
    .replace(/\b(?:for sale|for rent|to let|available now)\b/gi, ' ')
    .replace(/^\d+\s*[- ]?\s*bed(?:room)?s?\s+/i, '')
    .replace(/\s+(?:in|at)\s+.+$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,:–—\s-]+|[,:–—\s-]+$/g, '')
    .trim();

  var genericTitle = /^(?:house|home|property|residential property|apartment|flat|land|plot|commercial property)$/i;
  if (!candidate || genericTitle.test(candidate)) {
    var area = String(property.area || '').replace(/\s+(?:area|district)$/i, '').trim();
    var type = String(property.property_type || '').toLowerCase();
    var descriptor = type === 'apartment' || type === 'flat'
      ? 'Apartment'
      : type === 'land' || type === 'plot'
        ? 'Land'
        : type === 'commercial'
          ? 'Commercial Property'
          : 'Residence';
    candidate = area ? area + ' ' + descriptor : descriptor;
  }

  return propertyDisplayTitleCase(candidate);
}

function morePropertyCard(property, index) {
  var image = getCoverImage(property.id);
  var sourceTitle = property.title || property.reference_number || 'Hilltop property';
  var title = refinedPropertyDisplayTitle(property);
  var location = propertyDisplayTitleCase(property.area || getBranchName(property.branch_id) || 'Location available on request');
  var detailsUrl = 'property-details.html?id=' + encodeURIComponent(property.id);
  var imageAlt = title + ' in ' + location;

  var imageMarkup = image
    ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(imageAlt) + '" loading="' + (index === 0 ? 'eager' : 'lazy') + '" decoding="async" onerror="handleExclusivePropertyImageError(this)" />'
    : '';

  return [
    '<a class="more-property-card" href="' + detailsUrl + '" data-property-reference="' + escapeHtml(property.reference_number || title) + '" aria-label="View details for ' + escapeHtml(sourceTitle) + '">',
    '<div class="more-property-card__media">',
    '<div class="more-property-card__placeholder" aria-hidden="true"><span>Hilltop Property</span></div>',
    imageMarkup,
    '<h4 class="more-property-card__title">' + escapeHtml(title) + '</h4>',
    '</div>',
    '</a>'
  ].join('');
}

function handleExclusivePropertyImageError(image) {
  var card = image && image.closest ? image.closest('.more-property-card') : null;
  if (!card) return;

  var publicReference = card.dataset.propertyReference || 'Unnamed exclusive property';
  if (!warnedExclusiveImageRefs[publicReference]) {
    warnedExclusiveImageRefs[publicReference] = true;
    console.warn('[Hilltop] Exclusive property omitted because its cover image could not be loaded: ' + publicReference);
  }

  var track = card.closest('.more-properties-strip__track');
  var section = card.closest('.more-properties-strip');
  card.remove();

  if (track && !track.querySelector('.more-property-card:not(.more-property-card--skeleton)')) {
    if (section) section.hidden = true;
    return;
  }

  window.requestAnimationFrame(updateMorePropertiesControls);
}

function renderMorePropertiesLoading() {
  var section = byId('morePropertiesSection');
  var track = byId('morePropertiesTrack');
  if (!section || !track) return;

  section.hidden = false;
  section.classList.add('is-loading');
  section.setAttribute('aria-busy', 'true');
  track.innerHTML = new Array(5).fill([
    '<div class="more-property-card more-property-card--skeleton" aria-hidden="true">',
    '<div class="more-property-card__media"></div>',
    '</div>'
  ].join('')).join('');
}

function updateMorePropertiesControls() {
  var track = byId('morePropertiesTrack');
  var previous = byId('morePropertiesPrev');
  var next = byId('morePropertiesNext');
  var progress = byId('morePropertiesProgress');
  if (!track || !previous || !next || !progress) return;

  var maximum = Math.max(0, track.scrollWidth - track.clientWidth);
  previous.disabled = track.scrollLeft <= 2;
  next.disabled = maximum === 0 || track.scrollLeft >= maximum - 2;

  var thumbWidth = track.scrollWidth ? Math.max(18, (track.clientWidth / track.scrollWidth) * 100) : 100;
  var thumbLeft = maximum ? (track.scrollLeft / maximum) * (100 - thumbWidth) : 0;
  progress.style.width = thumbWidth + '%';
  progress.style.left = thumbLeft + '%';
  progress.parentElement.hidden = maximum === 0;
}

function initMorePropertiesControls() {
  var track = byId('morePropertiesTrack');
  var previous = byId('morePropertiesPrev');
  var next = byId('morePropertiesNext');
  if (!track || !previous || !next || track.dataset.controlsBound === 'true') return;

  track.dataset.controlsBound = 'true';

  function cardScrollAmount() {
    var card = track.querySelector('.more-property-card:not(.more-property-card--skeleton)');
    var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
  }

  previous.addEventListener('click', function () {
    track.scrollBy({ left: -cardScrollAmount(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
  next.addEventListener('click', function () {
    track.scrollBy({ left: cardScrollAmount(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
  track.addEventListener('scroll', function () {
    window.requestAnimationFrame(updateMorePropertiesControls);
  }, { passive: true });
  window.addEventListener('resize', updateMorePropertiesControls, { passive: true });
}

function renderMoreProperties() {
  var section = byId('morePropertiesSection');
  var track = byId('morePropertiesTrack');
  if (!section || !track) return;

  var properties = resolveMoreProperties();
  section.classList.remove('is-loading');
  section.removeAttribute('aria-busy');

  if (!properties.length) {
    track.innerHTML = '';
    section.hidden = true;
    return;
  }

  track.innerHTML = properties.map(morePropertyCard).join('');
  section.hidden = false;
  initMorePropertiesControls();
  window.requestAnimationFrame(updateMorePropertiesControls);
}

function filteredProperties() {
  return publicState.properties.filter(function (property) {
    var searchBlob = [
      property.title,
      property.area,
      property.reference_number,
      property.description
    ].join(' ').toLowerCase();
    var matchesSearch = !publicState.search || searchBlob.indexOf(publicState.search.toLowerCase()) !== -1;
    var matchesPurpose = publicState.purpose === 'all' || property.purpose === publicState.purpose;
    var matchesType = publicState.type === 'all' || property.property_type === publicState.type;
    var matchesBranch = publicState.branch === 'all' || String(property.branch_id) === String(publicState.branch);
    return matchesSearch && matchesPurpose && matchesType && matchesBranch;
  });
}

function renderProperties() {
  if (!byId('propertiesGrid') || !byId('propertiesEmpty')) return;
  var rows = filteredProperties();
  byId('propertiesGrid').innerHTML = rows.map(propertyCard).join('');
  byId('propertiesEmpty').style.display = rows.length ? 'none' : 'block';
}

function listingSearchBlob(property) {
  return [
    property.title,
    property.reference_number,
    property.area,
    property.full_address,
    property.property_type,
    property.description
  ].join(' ').toLowerCase();
}

function normalizePropertyType(value) {
  return String(value || '').trim().toLowerCase();
}

function filterPropertiesByCategory(properties, category) {
  var normalizedCategory = normalizeListingCategory(category);
  var categoryTypes = {
    houses: ['house', 'houses'],
    apartments: ['apartment', 'apartments'],
    land: ['land', 'plot']
  };

  if (normalizedCategory === 'all') return properties.slice();

  return properties.filter(function (property) {
    var propertyType = normalizePropertyType(property.propertyType || property.property_type);
    return categoryTypes[normalizedCategory].indexOf(propertyType) !== -1;
  });
}

function compareListingPricesWithinCurrency(a, b, direction) {
  var currencyOrder = { ZMW: 0, USD: 1 };
  var aCurrency = window.HilltopCurrency.normalizeCurrencyCode(a.currency_code);
  var bCurrency = window.HilltopCurrency.normalizeCurrencyCode(b.currency_code);
  var currencyDifference = currencyOrder[aCurrency] - currencyOrder[bCurrency];

  if (currencyDifference !== 0) return currencyDifference;
  return direction * (Number(a.price || 0) - Number(b.price || 0));
}

function filteredListings() {
  var categoryRows = filterPropertiesByCategory(publicState.properties, publicState.category);
  var rows = categoryRows.filter(function (property) {
    var search = publicState.search.toLowerCase();
    var matchesSearch = !search || listingSearchBlob(property).indexOf(search) !== -1;
    var matchesPurpose = publicState.purpose === 'all' || property.purpose === publicState.purpose;
    var matchesType = publicState.type === 'all' || property.property_type === publicState.type;
    var matchesStatus = publicState.publicStatus === 'all' || property.status === publicState.publicStatus;
    return matchesSearch && matchesPurpose && matchesType && matchesStatus;
  });

  return rows.sort(function (a, b) {
    if (publicState.sort === 'price-low') return compareListingPricesWithinCurrency(a, b, 1);
    if (publicState.sort === 'price-high') return compareListingPricesWithinCurrency(a, b, -1);
    if (publicState.sort === 'featured') {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

function renderListingsTypeFilter() {
  var typeFilter = byId('listingTypeFilter');
  if (!typeFilter) return;

  var currentValue = typeFilter.value || 'all';
  var types = [];
  filterPropertiesByCategory(publicState.properties, publicState.category).forEach(function (property) {
    if (property.property_type && types.indexOf(property.property_type) === -1) {
      types.push(property.property_type);
    }
  });
  types.sort();

  typeFilter.innerHTML = '<option value="all">All property types</option>' + types.map(function (type) {
    return '<option value="' + escapeHtml(type) + '">' + escapeHtml(type) + '</option>';
  }).join('');

  typeFilter.value = types.indexOf(currentValue) !== -1 ? currentValue : 'all';
  publicState.type = typeFilter.value;
}

function categoryEmptyStateMarkup(config) {
  return '<p>' + escapeHtml(config.emptyMessage) + '</p>' +
    '<a class="btn primary listings-empty-action" href="listings.html?category=all">View All Property Listings</a>';
}

function setListingsViewState(state, message) {
  var results = document.querySelector('.listing-results');
  var loading = byId('listingsLoading');
  var error = byId('listingsError');
  var empty = byId('listingsEmpty');
  var grid = byId('listingsGrid');
  var count = byId('listingsCount');

  if (!loading || !error || !empty || !grid) return;

  loading.classList.toggle('is-active', state === 'loading');
  error.classList.toggle('is-active', state === 'error');
  empty.classList.toggle('is-active', state === 'empty');
  grid.classList.toggle('is-active', state === 'ready');

  if (state === 'error') error.textContent = message || 'Property listings could not be loaded.';
  if (count) count.hidden = state === 'loading' || state === 'error';
  if (results) results.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
}

function renderListings() {
  var grid = byId('listingsGrid');
  var empty = byId('listingsEmpty');
  var count = byId('listingsCount');
  if (!grid || !empty) return;

  var rows = filteredListings();
  var categoryRows = filterPropertiesByCategory(publicState.properties, publicState.category);
  var categoryContent = listingCategoryContent[publicState.category];
  grid.innerHTML = rows.map(propertyCard).join('');
  if (!rows.length) {
    if (!categoryRows.length) {
      empty.innerHTML = categoryEmptyStateMarkup(categoryContent);
    } else {
      empty.textContent = 'No ' + categoryContent.title.toLowerCase() + ' match your current filters.';
    }
  }
  if (count) {
    count.textContent = rows.length + ' public listing' + (rows.length === 1 ? '' : 's') + ' found';
  }
  setListingsViewState(rows.length ? 'ready' : 'empty');
}

function applyCategoryPageContent(config) {
  var page = document.body;
  var eyebrow = byId('listingPageEyebrow');
  var title = byId('listingPageTitle');
  var descriptionText = byId('listingPageDescription');
  var empty = byId('listingsEmpty');

  if (!page || !page.classList.contains('listings-page')) return;

  if (eyebrow) eyebrow.textContent = config.eyebrow;
  if (title) title.textContent = config.title;
  if (descriptionText) descriptionText.textContent = config.description;
  if (empty) empty.innerHTML = categoryEmptyStateMarkup(config);

  document.title = config.title + ' | ' + currentCompanyName();
  var description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', config.description);

  page.classList.remove('category-pending');
  page.classList.add('category-ready');
}

applyCategoryPageContent(categoryConfig);

function renderListingsPage() {
  var purposeFilter = byId('listingPurposeFilter');
  if (purposeFilter) purposeFilter.value = publicState.purpose;
  renderListingsTypeFilter();
  renderListings();
}

function renderFilters() {
  var branchFilter = byId('branchFilter');
  if (!branchFilter) return;
  branchFilter.innerHTML = '<option value="all">All branches</option>' + publicState.branches.map(function (branch) {
    return '<option value="' + escapeHtml(branch.id) + '">' + escapeHtml(branch.name) + '</option>';
  }).join('');
}

function renderAbout() {
  if (!byId('aboutTitle') || !byId('aboutContent')) return;
  var homepage = publicState.homepage || {};
  byId('aboutTitle').textContent = homepage.about_title || 'Trusted Property Guidance';
  byId('aboutContent').textContent = homepage.about_content || currentCompanyName() + ' helps clients buy, rent, sell, and manage quality real estate across Harare and Bulawayo.';
}

function bindZambiaMapWave(mapWrapper, svg) {
  if (!mapWrapper || !svg || !svg.createSVGPoint || prefersReducedMotion()) return;
  var hoverCapable = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hoverCapable) return;

  var circles = Array.prototype.slice.call(svg.querySelectorAll('circle'));
  var dotData = circles.map(function (dot, index) {
    var cx = Number(dot.getAttribute('cx'));
    var cy = Number(dot.getAttribute('cy'));
    dot.classList.add('map-dot');
    return {
      el: dot,
      cx: cx,
      cy: cy,
      currentX: 0,
      currentY: 0,
      currentScale: 1,
      seed: Math.sin(index * 12.9898 + cx * 0.07 + cy * 0.03) * 2.5
    };
  }).filter(function (dot) {
    return !Number.isNaN(dot.cx) && !Number.isNaN(dot.cy);
  });

  if (!dotData.length) return;

  var svgPoint = svg.createSVGPoint();
  var pointer = null;
  var smoothPointer = null;
  var rafId = null;
  var radius = 190;
  var strength = 12;
  var waveFrequency = 0.065;
  var waveSpeed = 0.011;
  var pointerEase = 0.38;
  var dotEase = 0.28;
  var returnEase = 0.16;

  function setDotTransform(dot, value) {
    if (dot.el.__zambiaMapTransform === value) return;
    dot.el.style.transform = value;
    dot.el.__zambiaMapTransform = value;
  }

  function getSvgPoint(event) {
    var matrix = svg.getScreenCTM();
    if (!matrix) return null;
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    return svgPoint.matrixTransform(matrix.inverse());
  }

  function animateDots(time) {
    if (pointer) {
      if (!smoothPointer) smoothPointer = { x: pointer.x, y: pointer.y };
      smoothPointer.x += (pointer.x - smoothPointer.x) * pointerEase;
      smoothPointer.y += (pointer.y - smoothPointer.y) * pointerEase;
    }

    dotData.forEach(function (dot) {
      var targetX = 0;
      var targetY = 0;
      var targetScale = 1;

      if (smoothPointer) {
        var dx = dot.cx - smoothPointer.x;
        var dy = dot.cy - smoothPointer.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < radius) {
          var force = 1 - distance / radius;
          var influence = force * force * (3 - 2 * force);
          var angle = Math.atan2(dy, dx);
          var wave = Math.sin(distance * waveFrequency - time * waveSpeed + dot.seed);
          var radialMove = influence * strength * wave;
          var swirlMove = influence * strength * 0.22 * Math.cos(distance * 0.045 - time * 0.004 + dot.seed);

          targetX = Math.cos(angle) * radialMove + Math.cos(angle + Math.PI / 2) * swirlMove;
          targetY = Math.sin(angle) * radialMove + Math.sin(angle + Math.PI / 2) * swirlMove;
          targetScale = 1 + influence * 0.08;
        }
      }

      var ease = pointer ? dotEase : returnEase;
      dot.currentX += (targetX - dot.currentX) * ease;
      dot.currentY += (targetY - dot.currentY) * ease;
      dot.currentScale += (targetScale - dot.currentScale) * ease;

      setDotTransform(dot, 'translate(' + dot.currentX.toFixed(2) + 'px, ' + dot.currentY.toFixed(2) + 'px) scale(' + dot.currentScale.toFixed(3) + ')');
    });

    var stillMoving = dotData.some(function (dot) {
      return Math.abs(dot.currentX) > 0.02 ||
        Math.abs(dot.currentY) > 0.02 ||
        Math.abs(dot.currentScale - 1) > 0.002;
    });

    if (pointer || stillMoving) {
      rafId = window.requestAnimationFrame(animateDots);
    } else {
      rafId = null;
      smoothPointer = null;
    }
  }

  mapWrapper.addEventListener('pointermove', function (event) {
    var nextPointer = getSvgPoint(event);
    if (!nextPointer) return;
    pointer = nextPointer;
    if (!rafId) rafId = window.requestAnimationFrame(animateDots);
  });

  mapWrapper.addEventListener('pointerleave', function () {
    pointer = null;
    if (!rafId) rafId = window.requestAnimationFrame(animateDots);
  });
}

function initZambiaMapInteraction() {
  var mapWrapper = document.querySelector('.zambia-map-interactive');
  if (!mapWrapper || mapWrapper.dataset.waveBound === 'true') return;
  mapWrapper.dataset.waveBound = 'true';

  var fallbackImage = mapWrapper.querySelector('.about-network-map-fallback');
  var existingSvg = mapWrapper.querySelector('svg');
  if (existingSvg) {
    bindZambiaMapWave(mapWrapper, existingSvg);
    return;
  }

  if (!fallbackImage || !fallbackImage.getAttribute('src')) return;
  if (prefersReducedMotion()) return;
  if (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  fetch(fallbackImage.getAttribute('src'))
    .then(function (response) {
      if (!response.ok) throw new Error('Map SVG could not be loaded.');
      return response.text();
    })
    .then(function (svgText) {
      var documentParser = new DOMParser();
      var svgDocument = documentParser.parseFromString(svgText, 'image/svg+xml');
      var svg = svgDocument.querySelector('svg');
      if (!svg || svgDocument.querySelector('parsererror')) throw new Error('Map SVG could not be parsed.');

      svg.classList.add('about-network-map', 'zambia-map-svg');
      svg.setAttribute('focusable', 'false');
      fallbackImage.replaceWith(svg);
      bindZambiaMapWave(mapWrapper, svg);
    })
    .catch(function (error) {
      console.warn('Interactive Zambia map effect could not start.', error);
    });
}

function initAboutNetworkCountUp() {
  var values = Array.prototype.slice.call(document.querySelectorAll('.about-network-stat-value[data-count-target]'));
  if (!values.length || prefersReducedMotion()) return;

  function formatCount(value, element, isFinal) {
    var target = Number(element.dataset.countTarget || 0);
    if (element.dataset.countFormat === 'compact-k') {
      if (isFinal) return Math.round(target / 1000).toLocaleString('en-ZM') + 'K+';
      if (value < 1000) return String(Math.round(value));
      return Math.round(value / 1000).toLocaleString('en-ZM') + 'K+';
    }
    return Math.round(isFinal ? target : value).toLocaleString('en-ZM') + (element.dataset.countSuffix || '');
  }

  function animateValue(element) {
    if (element.dataset.countAnimated === 'true') return;
    var target = Number(element.dataset.countTarget || 0);
    var duration = Number(element.dataset.countDuration || 1200);
    if (!target || Number.isNaN(target)) return;

    element.dataset.countAnimated = 'true';
    var startTime = null;
    element.textContent = formatCount(0, element, false);

    function tick(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(target * eased, element, progress >= 1);
      if (progress < 1) window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  if (!('IntersectionObserver' in window)) {
    values.forEach(animateValue);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateValue(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  values.forEach(function (value) {
    observer.observe(value);
  });
}

function renderTestimonials() {
  var stage = document.querySelector('.testimonial-stage');
  var carousel = stage ? stage.querySelector('[data-testimonial-carousel]') : null;
  if (!stage || !carousel) return;

  var section = stage.closest('section');
  var rows = publicState.testimonials || [];
  if (!rows.length) {
    carousel.innerHTML = '';
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  carousel.innerHTML = rows.map(function (item, index) {
    var backgroundType = String(item.background_type || (index < 2 ? 'image' : 'solid')).toLowerCase();
    var imageUrl = item.background_image_url || '';
    var color = safeCssColor(item.background_color, index === 3 ? '#132c46' : '#071827');
    var isImage = backgroundType === 'image' && imageUrl;
    var classes = [
      'testimonial-slide',
      isImage ? 'testimonial-slide--image' : (index === 3 ? 'testimonial-slide--blue' : 'testimonial-slide--navy'),
      index === 0 ? 'is-active' : ''
    ].filter(Boolean).join(' ');
    var styleParts = [];

    if (isImage) {
      var cssUrl = safeCssUrl(imageUrl);
      if (cssUrl) styleParts.push('--testimonial-bg-image: url(' + cssUrl + ')');
    } else if (color) {
      styleParts.push('--testimonial-solid-color: ' + color);
    }

    return [
      '<article class="' + classes + '" data-testimonial-slide' + (isImage ? ' data-testimonial-bg="' + escapeHtml(imageUrl) + '"' : '') + ' aria-hidden="' + (index === 0 ? 'false' : 'true') + '"' + (index === 0 ? '' : ' hidden') + (styleParts.length ? ' style="' + escapeHtml(styleParts.join('; ')) + '"' : '') + '>',
      '<div class="testimonial-slide-content">',
      '<p class="testimonial-kicker">CLIENT WORDS</p>',
      '<h2>You’re In Good Company</h2>',
      '<blockquote>“' + escapeHtml(item.message || '') + '”</blockquote>',
      '<p class="testimonial-name">' + escapeHtml(item.client_name || 'Client Testimonial') + '</p>',
      '<p class="testimonial-role">' + escapeHtml(item.client_role || 'Property Client') + '</p>',
      '</div>',
      '</article>'
    ].join('');
  }).join('');
}


function resolveContact() {
  var company = publicState.appSettings.company_profile || {};
  return {
    phone: company.whatsapp || company.phone || '',
    office: company.office || '',
    email: company.email || '',
    address: company.address || ''
  };
}

function renderContact() {
  var contactGrid = byId('contactGrid');
  var directoryList = document.querySelector('.directory-list');
  if (!contactGrid && !directoryList) return;
  var contact = resolveContact();
  var cards = [];
  var generalLines = [contact.email, contact.phone, contact.office, contact.address].filter(Boolean);
  if (generalLines.length) cards.push({ title: 'General Enquiries', lines: generalLines });
  (publicState.branches || []).forEach(function (branch) {
    var lines = [branch.address, branch.contact_number].filter(Boolean);
    if (branch.name && lines.length) cards.push({ title: branch.name, lines: lines });
  });

  if (contactGrid) {
    contactGrid.innerHTML = cards.map(function (card) {
      return [
        '<article class="contact-card">',
        '<h3>' + escapeHtml(card.title) + '</h3>',
        card.lines.filter(Boolean).map(function (line) {
          return '<p>' + escapeHtml(line) + '</p>';
        }).join(''),
        '</article>'
      ].join('');
    }).join('');
  }

  if (directoryList) {
    directoryList.innerHTML = cards.map(function (card) {
      return [
        '<div class="directory-item">',
        '<span class="directory-item-title">' + escapeHtml(card.title.toUpperCase()) + '</span>',
        card.lines.map(function (line) {
          return '<p class="dir-contact">' + escapeHtml(line) + '</p>';
        }).join(''),
        '</div>'
      ].join('');
    }).join('');
    var directoryColumn = directoryList.closest('.contact-directory-column');
    if (directoryColumn) directoryColumn.hidden = cards.length === 0;
  }
}

function setBodyMenuLock(isOpen) {
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function setMobileMenuOpen(isOpen) {
  var nav = byId('siteNav');
  var toggle = byId('navToggle');
  var overlay = byId('navOverlay');
  if (!nav || !toggle || !overlay) return;

  nav.classList.toggle('open', isOpen);
  overlay.classList.toggle('open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  setBodyMenuLock(isOpen);
}

function initMobileNavigation() {
  var toggle = byId('navToggle');
  var overlay = byId('navOverlay');
  var nav = byId('siteNav');
  if (!toggle || !overlay || !nav) return;

  toggle.addEventListener('click', function () {
    setMobileMenuOpen(!nav.classList.contains('open'));
  });

  overlay.addEventListener('click', function () {
    setMobileMenuOpen(false);
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setMobileMenuOpen(false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMobileMenuOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setMobileMenuOpen(false);
  });
}

function initHeaderBehavior() {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var lastScrollY = window.scrollY || window.pageYOffset || 0;
  var ticking = false;

  function updateHeaderShadow() {
    var currentScrollY = window.scrollY || window.pageYOffset || 0;
    header.classList.toggle('scrolled', currentScrollY > 8);
  }

  function updateHeaderVisibility() {
    var currentScrollY = window.scrollY || window.pageYOffset || 0;
    var delta = currentScrollY - lastScrollY;

    var nav = byId('siteNav');
    var isMenuOpen = nav && nav.classList.contains('open');
    var modal = byId('enquiryModal');
    var isModalOpen = modal && modal.classList.contains('open');

    if (isMenuOpen || isModalOpen) {
      header.classList.remove('is-hidden');
    } else {
      if (currentScrollY <= 10) {
        header.classList.remove('is-hidden');
      } else if (delta > 10 && currentScrollY > 120) {
        header.classList.add('is-hidden');
      } else if (delta < -10) {
        header.classList.remove('is-hidden');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  updateHeaderShadow();

  window.addEventListener('scroll', function () {
    updateHeaderShadow();

    if (!ticking) {
      window.requestAnimationFrame(updateHeaderVisibility);
      ticking = true;
    }
  }, { passive: true });

  header.addEventListener('focusin', function () {
    header.classList.remove('is-hidden');
  });
}

function initSmoothScroll() {
  if (prefersReducedMotion()) return;

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function setEnquiryMessage(message, type) {
  var messageBox = byId('enquiryMessage');
  if (!messageBox) return;
  messageBox.textContent = message || '';
  messageBox.className = 'enquiry-message' + (type ? ' ' + type : '');
}

function setWhatsappFallback(referenceNumber) {
  var contact = resolveContact();
  var fallback = byId('enquiryWhatsappFallback');
  if (!fallback) return;

  if (!contact.phone) {
    fallback.classList.add('hidden');
    return;
  }

  var phone = String(contact.phone).replace(/[^0-9]/g, '');
  var message = referenceNumber
    ? 'Hello ' + currentCompanyName() + ', I would like to enquire about property ' + referenceNumber + '.'
    : 'Hello ' + currentCompanyName() + ', I would like to make a property enquiry.';

  fallback.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  fallback.classList.remove('hidden');
}

function populateEnquiryBranches(selectedBranchId, isPropertyEnquiry) {
  var branchSelect = byId('enquiryBranchSelect');
  if (!branchSelect) return;

  branchSelect.innerHTML = '<option value="">Select branch</option>' + publicState.branches.map(function (branch) {
    return '<option value="' + escapeHtml(branch.id) + '">' + escapeHtml(branch.name) + '</option>';
  }).join('');

  if (selectedBranchId) {
    if (!getBranchById(selectedBranchId)) {
      branchSelect.innerHTML += '<option value="' + escapeHtml(selectedBranchId) + '">Property branch</option>';
    }
    branchSelect.value = String(selectedBranchId);
  } else if (publicState.branch !== 'all' && getBranchById(publicState.branch)) {
    branchSelect.value = String(publicState.branch);
  } else if (publicState.branches.length) {
    branchSelect.value = String(publicState.branches[0].id);
  }

  branchSelect.disabled = Boolean(isPropertyEnquiry);
  byId('enquiryBranchId').value = selectedBranchId || branchSelect.value || '';
}

function openEnquiryModal(property) {
  activeEnquiryProperty = property || null;
  var modal = byId('enquiryModal');
  var title = byId('enquiryModalTitle');
  var display = byId('enquiryPropertyDisplay');
  var notes = byId('enquiryNotes');
  var propertyId = byId('enquiryPropertyId');

  byId('enquiryForm').reset();
  setEnquiryMessage('', '');
  byId('enquiryWhatsappFallback').classList.add('hidden');

  if (property) {
    title.textContent = 'Send Property Enquiry';
    display.textContent = property.reference_number + ' - ' + property.title;
    propertyId.value = property.id;
    notes.value = 'Website enquiry for property ' + property.reference_number;
    populateEnquiryBranches(property.branch_id, true);
    setWhatsappFallback(property.reference_number);
  } else {
    title.textContent = 'Send General Enquiry';
    display.textContent = 'Tell us what you are looking for and our team will contact you.';
    propertyId.value = '';
    notes.value = '';
    populateEnquiryBranches('', false);
    setWhatsappFallback('');
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  byId('enquiryName').focus();
}

function closeEnquiryModal() {
  var modal = byId('enquiryModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  activeEnquiryProperty = null;
  enquirySubmitting = false;
  byId('enquirySubmit').disabled = false;
}

function validateEnquiryPayload(name, phone, email, branchId, notes, property) {
  if (!name) return 'Full name is required.';
  if (!phone) return 'Phone number is required.';
  if (!branchId) return 'No branch is available to receive this enquiry.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (notes.length > 1000) return 'Message must be 1000 characters or less.';
  if (property && ['Active', 'Under Offer'].indexOf(property.status) === -1) {
    return 'This property is not available for public enquiry.';
  }
  return '';
}

async function submitEnquiry(event) {
  event.preventDefault();
  if (enquirySubmitting) return;

  var supabase = getSupabaseClient();
  var name = byId('enquiryName').value.trim();
  var phone = byId('enquiryPhone').value.trim();
  var email = byId('enquiryEmail').value.trim();
  var branchId = byId('enquiryBranchSelect').value || byId('enquiryBranchId').value;
  var notes = byId('enquiryNotes').value.trim();
  var honeypot = byId('enquiryWebsiteUrl').value.trim();
  var property = activeEnquiryProperty;

  if (honeypot) {
    setEnquiryMessage('Thank you. Your enquiry has been sent. ' + currentTradingName() + ' will contact you shortly.', 'success');
    setTimeout(closeEnquiryModal, 1100);
    return;
  }

  var validationError = validateEnquiryPayload(name, phone, email, branchId, notes, property);
  if (validationError) {
    setEnquiryMessage(validationError, 'error');
    return;
  }

  if (!supabase) {
    setEnquiryMessage('We could not send the enquiry right now. Please use the WhatsApp contact option or try again shortly.', 'error');
    setWhatsappFallback(property && property.reference_number);
    return;
  }

  enquirySubmitting = true;
  byId('enquirySubmit').disabled = true;
  setEnquiryMessage('Sending enquiry...', '');

  var payload = {
    client_name: name,
    phone: phone,
    email: email || null,
    property_id: property ? property.id : null,
    branch_id: branchId,
    source: 'Website',
    status: 'New',
    notes: notes || null
  };

  try {
    var result = await supabase.from('leads').insert(payload);
    if (result.error) throw result.error;

    setEnquiryMessage('Thank you. Your enquiry has been sent. ' + currentTradingName() + ' will contact you shortly.', 'success');
    byId('enquiryForm').reset();
    setTimeout(closeEnquiryModal, 1400);
  } catch (error) {
    console.warn('Public enquiry could not be submitted.', error);
    setEnquiryMessage('We could not send the enquiry right now. Please use the WhatsApp contact option or try again shortly.', 'error');
    setWhatsappFallback(property && property.reference_number);
  } finally {
    enquirySubmitting = false;
    byId('enquirySubmit').disabled = false;
  }
}

function bindEvents() {
  var searchInput = byId('searchInput');
  if (searchInput) searchInput.addEventListener('input', function (event) {
    publicState.search = event.target.value.trim();
    renderProperties();
  });

  var purposeFilter = byId('purposeFilter');
  if (purposeFilter) purposeFilter.addEventListener('change', function (event) {
    publicState.purpose = event.target.value;
    renderProperties();
  });

  var typeFilter = byId('typeFilter');
  if (typeFilter) typeFilter.addEventListener('change', function (event) {
    publicState.type = event.target.value;
    renderProperties();
  });

  var branchFilter = byId('branchFilter');
  if (branchFilter) branchFilter.addEventListener('change', function (event) {
    publicState.branch = event.target.value;
    renderProperties();
  });

  var listingsSearchInput = byId('listingSearchInput');
  if (listingsSearchInput) listingsSearchInput.addEventListener('input', function (event) {
    publicState.search = event.target.value.trim();
    renderListings();
  });

  var listingPurposeFilter = byId('listingPurposeFilter');
  if (listingPurposeFilter) listingPurposeFilter.addEventListener('change', function (event) {
    publicState.purpose = event.target.value;
    renderListings();
  });

  var listingTypeFilter = byId('listingTypeFilter');
  if (listingTypeFilter) listingTypeFilter.addEventListener('change', function (event) {
    publicState.type = event.target.value;
    renderListings();
  });

  var listingStatusFilter = byId('listingStatusFilter');
  if (listingStatusFilter) listingStatusFilter.addEventListener('change', function (event) {
    publicState.publicStatus = event.target.value;
    renderListings();
  });

  var listingSortSelect = byId('listingSortSelect');
  if (listingSortSelect) listingSortSelect.addEventListener('change', function (event) {
    publicState.sort = event.target.value;
    renderListings();
  });

  var generalEnquiryButton = byId('generalEnquiryButton');
  if (generalEnquiryButton) generalEnquiryButton.addEventListener('click', function () {
    openEnquiryModal(null);
  });

  var headerEnquiryButton = byId('headerEnquiryButton');
  if (headerEnquiryButton) {
    headerEnquiryButton.addEventListener('click', function () {
      openEnquiryModal(null);
    });
  }

  document.querySelectorAll('.public-enquiry-trigger').forEach(function (button) {
    button.addEventListener('click', function () {
      openEnquiryModal(null);
    });
  });

  document.querySelectorAll('[data-enquiry-type]').forEach(function (link) {
    link.addEventListener('click', function () {
      var enquiryType = byId('premiumEnquiryType');
      if (enquiryType) enquiryType.value = link.dataset.enquiryType || 'General Enquiry';
    });
  });

  var enquiryForm = byId('enquiryForm');
  if (enquiryForm) enquiryForm.addEventListener('submit', submitEnquiry);

  var enquiryModalClose = byId('enquiryModalClose');
  if (enquiryModalClose) enquiryModalClose.addEventListener('click', closeEnquiryModal);

  var enquiryModal = byId('enquiryModal');
  if (enquiryModal) enquiryModal.addEventListener('click', function (event) {
    if (event.target === enquiryModal) closeEnquiryModal();
  });

  var enquiryBranchSelect = byId('enquiryBranchSelect');
  if (enquiryBranchSelect) enquiryBranchSelect.addEventListener('change', function (event) {
    var enquiryBranchId = byId('enquiryBranchId');
    if (enquiryBranchId) enquiryBranchId.value = event.target.value;
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('.enquire-btn');
    if (button) {
      var property = getPropertyById(button.dataset.propertyId);
      if (property) openEnquiryModal(property);
    }
  });

  document.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target.tagName === 'IMG' && target.closest('.property-image, .featured-property-image, .property-card-image-wrapper')) {
      target.classList.add('is-broken');
      target.setAttribute('aria-hidden', 'true');
    }
  }, true);
}


function cleanupCtaImageReveal() {
  var state = window.__ctaImageRevealState;
  if (state && typeof state.cleanup === 'function') {
    state.cleanup();
  }
  window.__ctaImageRevealState = null;
}

function initCtaImageReveal() {
  cleanupCtaImageReveal();

  var section = document.getElementById('cta');
  var frame = section ? section.querySelector('.cta-image-frame') : null;
  if (!section || !frame) return;

  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery = window.matchMedia('(max-width: 600px)');
  var currentProgress = null;
  var targetProgress = 0;
  var animationFrameId = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function smootherStep(value) {
    return value * value * value * (value * (value * 6 - 15) + 10);
  }

  function setFrame(sideSpaceVw, blockSpaceVh, radiusPx, labelScale, imageBlurPx, imageOpacity, imageSaturation, imageContrast) {
    section.style.setProperty('--cta-side-space', sideSpaceVw + 'vw');
    section.style.setProperty('--cta-block-space', blockSpaceVh + 'vh');
    section.style.setProperty('--cta-radius', radiusPx + 'px');
    section.style.setProperty('--cta-label-scale', labelScale);
    section.style.setProperty('--cta-image-blur', imageBlurPx + 'px');
    section.style.setProperty('--cta-image-opacity', imageOpacity);
    section.style.setProperty('--cta-image-saturation', imageSaturation);
    section.style.setProperty('--cta-image-contrast', imageContrast);
  }

  function setFinalState() {
    setFrame(3, 5.5, 4, 1.14, 0, 1, 1, 1);
  }

  function resetMobileState() {
    section.style.removeProperty('--cta-side-space');
    section.style.removeProperty('--cta-block-space');
    section.style.removeProperty('--cta-radius');
    section.style.removeProperty('--cta-label-scale');
    section.style.removeProperty('--cta-image-blur');
    section.style.removeProperty('--cta-image-opacity');
    section.style.removeProperty('--cta-image-saturation');
    section.style.removeProperty('--cta-image-contrast');
  }

  function measureProgress() {
    var rect = section.getBoundingClientRect();
    var scrollStart = window.scrollY + rect.top;
    var scrollEnd = scrollStart + section.offsetHeight - window.innerHeight;
    var range = Math.max(scrollEnd - scrollStart, 1);
    return clamp((window.scrollY - scrollStart) / range, 0, 1);
  }

  function applyProgress(progressValue) {
    var progress = smootherStep(progressValue);
    var sideSpace = 35 - (35 - 3) * progress;
    var blockSpace = 12.5 - (12.5 - 5.5) * progress;
    var labelScale = 0.92 + (1.14 - 0.92) * progress;
    var radius = 10 - 6 * progress;
    var imageBlur = 10 - 10 * progress;
    var imageOpacity = 0.82 + (1 - 0.82) * progress;
    var imageSaturation = 0.88 + (1 - 0.88) * progress;
    var imageContrast = 0.94 + (1 - 0.94) * progress;

    setFrame(
      sideSpace.toFixed(3),
      blockSpace.toFixed(3),
      radius.toFixed(2),
      labelScale.toFixed(4),
      imageBlur.toFixed(3),
      imageOpacity.toFixed(4),
      imageSaturation.toFixed(4),
      imageContrast.toFixed(4)
    );
  }

  function stopAnimation() {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function animate() {
    if (mobileQuery.matches) {
      stopAnimation();
      resetMobileState();
      return;
    }

    if (reducedMotionQuery.matches) {
      stopAnimation();
      setFinalState();
      return;
    }

    if (currentProgress === null) {
      currentProgress = targetProgress;
    }

    var delta = targetProgress - currentProgress;
    currentProgress += delta * 0.115;

    if (Math.abs(delta) < 0.0008) {
      currentProgress = targetProgress;
      applyProgress(currentProgress);
      animationFrameId = null;
      return;
    }

    applyProgress(currentProgress);
    animationFrameId = window.requestAnimationFrame(animate);
  }

  function requestUpdate() {
    if (mobileQuery.matches) {
      stopAnimation();
      resetMobileState();
      return;
    }

    if (reducedMotionQuery.matches) {
      stopAnimation();
      setFinalState();
      return;
    }

    targetProgress = measureProgress();
    if (currentProgress === null) currentProgress = targetProgress;

    if (!animationFrameId) {
      animationFrameId = window.requestAnimationFrame(animate);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', requestUpdate);
    mobileQuery.addEventListener('change', requestUpdate);
  }

  window.__ctaImageRevealState = {
    cleanup: function () {
      stopAnimation();
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (typeof reducedMotionQuery.removeEventListener === 'function') {
        reducedMotionQuery.removeEventListener('change', requestUpdate);
        mobileQuery.removeEventListener('change', requestUpdate);
      }
    }
  };

  requestUpdate();
}


function cleanupTestimonialCarousel() {
  var state = window.__testimonialCarouselState;
  if (state && typeof state.cleanup === 'function') {
    state.cleanup();
  }
  window.__testimonialCarouselState = null;
}

function initTestimonialCarousel() {
  cleanupTestimonialCarousel();

  var stage = document.querySelector('.testimonial-stage');
  if (!stage) return;

  var slides = Array.prototype.slice.call(stage.querySelectorAll('[data-testimonial-slide]'));
  var prevButton = stage.querySelector('[data-testimonial-prev]');
  var nextButton = stage.querySelector('[data-testimonial-next]');
  if (!slides.length || !prevButton || !nextButton) return;

  var activeIndex = Math.max(0, slides.findIndex(function (slide) {
    return slide.classList.contains('is-active');
  }));
  var touchStartX = null;
  var touchStartY = null;
  var hideTimers = [];

  slides.forEach(function (slide, index) {
    var isActive = index === activeIndex;
    slide.hidden = !isActive;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');

    var backgroundUrl = slide.getAttribute('data-testimonial-bg');
    if (backgroundUrl) {
      var probe = new Image();
      probe.onerror = function () {
        slide.classList.add('is-bg-broken');
      };
      probe.src = backgroundUrl;
    }
  });

  function setActiveSlide(nextIndex) {
    if (!slides.length) return;
    activeIndex = (nextIndex + slides.length) % slides.length;
    stage.dataset.activeTestimonial = String(activeIndex + 1);

    slides.forEach(function (slide, index) {
      var isActive = index === activeIndex;

      if (hideTimers[index]) {
        window.clearTimeout(hideTimers[index]);
        hideTimers[index] = null;
      }

      if (isActive) {
        slide.hidden = false;
      }

      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');

      if (!isActive) {
        hideTimers[index] = window.setTimeout(function () {
          if (!slide.classList.contains('is-active')) {
            slide.hidden = true;
          }
        }, 720);
      }
    });
  }

  function showPrevious() {
    setActiveSlide(activeIndex - 1);
  }

  function showNext() {
    setActiveSlide(activeIndex + 1);
  }

  function onKeydown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    }
  }

  function onTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function onTouchEnd(event) {
    if (touchStartX === null || touchStartY === null || !event.changedTouches.length) return;

    var touchEndX = event.changedTouches[0].clientX;
    var touchEndY = event.changedTouches[0].clientY;
    var deltaX = touchEndX - touchStartX;
    var deltaY = touchEndY - touchStartY;

    touchStartX = null;
    touchStartY = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }

  prevButton.addEventListener('click', showPrevious);
  nextButton.addEventListener('click', showNext);
  stage.addEventListener('keydown', onKeydown);
  stage.addEventListener('touchstart', onTouchStart, { passive: true });
  stage.addEventListener('touchend', onTouchEnd);

  setActiveSlide(activeIndex);

  window.__testimonialCarouselState = {
    cleanup: function () {
      hideTimers.forEach(function (timer) {
        if (timer) window.clearTimeout(timer);
      });
      prevButton.removeEventListener('click', showPrevious);
      nextButton.removeEventListener('click', showNext);
      stage.removeEventListener('keydown', onKeydown);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchend', onTouchEnd);
    }
  };
}

var PROPERTY_SERVICE_FALLBACK_IMAGES = {
  'buy-property': 'assets/images/service-buy-property.svg',
  'rent-property': 'assets/images/service-rent-property.svg',
  'list-property': 'assets/images/service-list-property.svg'
};

function propertyServiceStorageObjectPath(value) {
  var path = String(value || '').trim();
  if (!path) return '';
  var marker = '/storage/v1/object/public/service-illustrations/';
  var markerIndex = path.indexOf(marker);
  if (markerIndex !== -1) return decodeURIComponent(path.slice(markerIndex + marker.length));
  return path.indexOf('service-cards/') === 0 ? path : '';
}

function propertyServiceImageSources(card) {
  var fallback = PROPERTY_SERVICE_FALLBACK_IMAGES[card.slug] || '';
  var configuredFallback = String(card.default_image_path || '').trim();
  if (/^(?:assets\/|\/)[A-Za-z0-9._~!$&'()*+,;=@%/?#-]+$/.test(configuredFallback)) fallback = configuredFallback;

  var customPath = propertyServiceStorageObjectPath(card.custom_image_path);
  if (!customPath) return { primary: fallback, fallback: fallback };
  var supabase = getSupabaseClient();
  var publicResult = supabase && supabase.storage.from('service-illustrations').getPublicUrl(customPath);
  var publicUrl = publicResult && publicResult.data && publicResult.data.publicUrl;
  return { primary: publicUrl || fallback, fallback: fallback };
}

function propertyServiceAction(card) {
  if (card.action_type === 'rental_listings') {
    return { href: 'listings.html?category=all&purpose=For%20Rent', enquiryType: '' };
  }
  if (card.action_type === 'list_property_enquiry') {
    return { href: '#contact', enquiryType: 'List a Property' };
  }
  if (card.action_type === 'internal_page' && isSafePropertyServicesInternalPath(card.action_value)) {
    return { href: String(card.action_value).trim(), enquiryType: '' };
  }
  return { href: 'listings.html?category=all', enquiryType: '' };
}

function createPublicPropertyServiceCard(card) {
  var article = document.createElement('article');
  article.className = 'service-choice-card';
  article.dataset.serviceCardSlug = card.slug;

  var visual = document.createElement('div');
  visual.className = 'service-choice-card__visual';
  var image = document.createElement('img');
  image.className = 'service-choice-card__image';
  image.alt = String(card.image_alt || '').trim();
  var imageSources = propertyServiceImageSources(card);
  image.src = imageSources.primary;
  image.onerror = function () {
    if (imageSources.fallback && image.getAttribute('src') !== imageSources.fallback) {
      image.src = imageSources.fallback;
      return;
    }
    image.hidden = true;
  };
  visual.appendChild(image);

  var title = document.createElement('h3');
  title.className = 'service-choice-card__title';
  title.textContent = String(card.title).trim();
  var description = document.createElement('p');
  description.className = 'service-choice-card__description';
  description.textContent = String(card.description).trim();
  var link = document.createElement('a');
  link.className = 'service-choice-card__action';
  link.textContent = String(card.button_label).trim();
  var action = propertyServiceAction(card);
  link.href = action.href;
  if (action.enquiryType) {
    link.dataset.enquiryType = action.enquiryType;
    link.addEventListener('click', function () {
      var enquiryType = byId('premiumEnquiryType');
      if (enquiryType) enquiryType.value = action.enquiryType;
    });
  }

  article.appendChild(visual);
  article.appendChild(title);
  article.appendChild(description);
  article.appendChild(link);
  return article;
}

function renderPropertyServices() {
  var content = publicState.propertyServices;
  var sectionElement = document.querySelector('[data-property-services-section]');
  if (!sectionElement) return;
  if (!content) {
    sectionElement.hidden = true;
    return;
  }
  if (!content.section.is_visible) {
    sectionElement.hidden = true;
    return;
  }

  sectionElement.hidden = false;
  var label = sectionElement.querySelector('.services-redesign__label');
  var heading = sectionElement.querySelector('.services-redesign__title');
  var intro = sectionElement.querySelector('.services-redesign__intro');
  var grid = sectionElement.querySelector('.service-choice-grid');
  if (!label || !heading || !intro || !grid) return;

  label.textContent = String(content.section.eyebrow).trim();
  heading.textContent = String(content.section.heading).trim();
  intro.textContent = String(content.section.supporting_text).trim();
  var fragment = document.createDocumentFragment();
  content.cards.forEach(function (card) {
    fragment.appendChild(createPublicPropertyServiceCard(card));
  });
  grid.replaceChildren(fragment);
}

function renderWebsite() {
  applySeoSettings();
  renderHero();
  configureWhyHeroVideo();
  renderFilters();
  renderFeatured();
  renderMoreProperties();
  renderProperties();
  renderAbout();
  renderTestimonials();
  renderPropertyServices();
  renderContact();
  initZambiaMapInteraction();
  initAboutNetworkCountUp();
  initCtaImageReveal();
  initTestimonialCarousel();
  applyCompanyBranding();
}

document.addEventListener('DOMContentLoaded', function () {
  var year = byId('year');
  if (year) year.textContent = new Date().getFullYear();
  initMobileNavigation();
  initHeaderBehavior();
  initSmoothScroll();
  initTeamHoldTrigger();
  initPremiumEnquiryForm();
  bindEvents();
  if (byId('listingsGrid')) {
    loadListingsData();
  } else if (byId('featuredGrid')) {
    renderMorePropertiesLoading();
    loadPublicData();
  } else {
    loadSharedPublicData();
  }
});

/* ============================================================
   TEAM HOLD TRIGGER FUNCTIONALITY
   ============================================================ */

function initTeamHoldTrigger() {
  var triggerSection = byId('teamTriggerSection');
  var holdTrigger = byId('teamHoldTrigger');
  var progressCircle = byId('teamProgressCircle');
  var triggerText = byId('teamTriggerText');
  var teamOverlay = byId('teamOverlay');
  var teamOverlayClose = byId('teamOverlayClose');

  if (!triggerSection || !holdTrigger || !progressCircle || !triggerText) {
    return;
  }

  // Pre-load active team members from Supabase database
  var activeTeamMembers = [];
  var db = window.hilltopSupabase;

  async function fetchTeamFromSupabase() {
    if (!db) {
      console.warn("Supabase client not loaded yet or unavailable.");
      return;
    }
    try {
      var { data, error } = await db
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        activeTeamMembers = data.map(function(m) {
          return {
            id: m.id,
            fullName: m.full_name,
            role: m.role,
            branch: m.branch,
            phone: m.phone,
            whatsapp: m.whatsapp,
            bio: m.bio,
            image: m.image_url
          };
        });
      }
    } catch (e) {
      console.error("Failed to load active team members from Supabase, using fallback", e);
    }
  }

  // Initial fetch trigger
  fetchTeamFromSupabase();

  // 1. Scroll detection using IntersectionObserver
  var observerOptions = {
    root: null,
    rootMargin: '0px 0px 50px 0px',
    threshold: 0.15
  };

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        triggerSection.classList.add('is-visible');
        // Refresh fetch when the section is scrolled into view
        fetchTeamFromSupabase();
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  observer.observe(triggerSection);

  // 2. Hold Logic Constants & Variables
  var HOLD_DURATION = 1500; // 1.5 seconds hold required
  var CIRCUMFERENCE = 213.628; // 2 * Math.PI * 34
  var holdTimer = null;
  var animationFrame = null;
  var startTime = null;
  var isHolding = false;
  var isComplete = false;

  // Set initial stroke states
  progressCircle.style.strokeDasharray = CIRCUMFERENCE;
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

  function updateProgress() {
    if (!isHolding || isComplete) return;

    var elapsed = Date.now() - startTime;
    var progress = Math.min(elapsed / HOLD_DURATION, 1);
    var offset = CIRCUMFERENCE * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;

    if (progress >= 1) {
      completeHold();
    } else {
      animationFrame = requestAnimationFrame(updateProgress);
    }
  }

  function startHold(e) {
    if (isComplete) return;

    // Prevent context menu/selection defaults on touch
    if (e && e.type === 'pointerdown' && e.pointerType === 'touch') {
      e.preventDefault();
    }

    isHolding = true;
    startTime = Date.now();
    holdTrigger.classList.add('is-active');
    triggerText.textContent = "Hold to meet the team";

    // Clear any previous frame loop
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updateProgress);
  }

  function cancelHold() {
    if (isComplete) return;

    isHolding = false;
    holdTrigger.classList.remove('is-active');

    if (animationFrame) cancelAnimationFrame(animationFrame);
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
    triggerText.textContent = "Hold to meet the team";
  }

  function renderTeamOverlayGrid() {
    var grid = byId('teamOverlayGrid');
    if (!grid) return;

    var listToRender = activeTeamMembers || [];
    if (!listToRender.length) {
      grid.innerHTML = '<p class="team-overlay-empty">Team details have not been added yet.</p>';
      return;
    }

    grid.innerHTML = listToRender.map(function (member) {
      var displayName = member.fullName || member.name || '';
      var imgPath = member.image || 'assets/avatar-placeholder.png';
      
      // Clean phone for tel: link
      var cleanPhone = (member.phone || '').replace(/[^+\d]/g, '');
      var phoneLink = 'tel:' + cleanPhone;

      // Clean whatsapp link
      var rawWa = member.whatsapp || member.phone || '';
      var waLink = rawWa;
      if (rawWa && !rawWa.startsWith('http') && !rawWa.startsWith('https')) {
        var cleanWa = rawWa.replace(/[^+\d]/g, '');
        if (cleanWa.startsWith('+')) {
          cleanWa = cleanWa.substring(1);
        }
        waLink = 'https://wa.me/' + cleanWa;
      }

      return (
        '<article class="team-card">' +
          '<div class="team-card-image-wrapper">' +
            '<img src="' + escapeHtml(imgPath) + '" alt="' + escapeHtml(displayName) + '" loading="lazy" onerror="this.style.display=\'none\'" />' +
          '</div>' +
          '<div class="team-card-info">' +
            '<span class="team-card-branch-badge">' + escapeHtml(member.branch) + ' Branch</span>' +
            '<h3 class="team-card-name">' + escapeHtml(displayName) + '</h3>' +
            '<p class="team-card-role">' + escapeHtml(member.role) + '</p>' +
            '<p class="team-card-bio">' + escapeHtml(member.bio) + '</p>' +
            '<div class="team-card-actions">' +
              '<a href="' + escapeHtml(phoneLink) + '" class="team-card-btn team-card-btn--call" aria-label="Call ' + escapeHtml(displayName) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
                  '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />' +
                '</svg>' +
                'Call' +
              '</a>' +
              '<a href="' + escapeHtml(waLink) + '" target="_blank" rel="noopener" class="team-card-btn team-card-btn--whatsapp" aria-label="WhatsApp ' + escapeHtml(displayName) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
                  '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />' +
                '</svg>' +
                'WhatsApp' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function openTeamOverlay() {
    if (!teamOverlay) return;
    renderTeamOverlayGrid();
    teamOverlay.classList.add('open');
    document.body.classList.add('team-open');
    teamOverlay.setAttribute('aria-hidden', 'false');
    if (teamOverlayClose) teamOverlayClose.focus();
  }

  function closeTeamOverlay() {
    if (!teamOverlay) return;
    teamOverlay.classList.remove('open');
    document.body.classList.remove('team-open');
    teamOverlay.setAttribute('aria-hidden', 'true');

    // Reset hold trigger state completely
    isComplete = false;
    holdTrigger.classList.remove('is-complete');
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
    triggerText.textContent = "Hold to meet the team";
  }

  function completeHold() {
    isComplete = true;
    isHolding = false;

    if (animationFrame) cancelAnimationFrame(animationFrame);
    progressCircle.style.strokeDashoffset = 0;
    holdTrigger.classList.remove('is-active');
    holdTrigger.classList.add('is-complete');
    triggerText.textContent = "Opening team...";

    // Log action placeholder
    console.log("Team experience will open here");

    // Smoothly transition open overlay after a short delay
    setTimeout(openTeamOverlay, 600);
  }

  // 3. Pointer Event Listeners (Desktop, Mobile, Tablet)
  holdTrigger.addEventListener('pointerdown', startHold);
  holdTrigger.addEventListener('pointerup', cancelHold);
  holdTrigger.addEventListener('pointerleave', cancelHold);
  holdTrigger.addEventListener('pointercancel', cancelHold);

  // 4. Keyboard Accessibility
  holdTrigger.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); // Prevent spacebar page scrolling
      if (!isHolding) {
        startHold();
      }
    }
  });

  holdTrigger.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      cancelHold();
    }
  });

  holdTrigger.addEventListener('blur', cancelHold);

  // 5. Close trigger click handler
  if (teamOverlayClose) {
    teamOverlayClose.addEventListener('click', closeTeamOverlay);
  }

  // 6. Escape key listener to close overlay
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && teamOverlay && teamOverlay.classList.contains('open')) {
      closeTeamOverlay();
    }
  });
}

/* ============================================================
   PREMIUM CONTACT FORM & DIRECTORY HANDLERS
   ============================================================ */

function initPremiumEnquiryForm() {
  var form = byId('premiumEnquiryForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameField = byId('premiumName');
    var phoneField = byId('premiumPhone');
    var emailField = byId('premiumEmail');
    var enquiryTypeField = byId('premiumEnquiryType');
    var branchField = byId('premiumBranch');
    var messageField = byId('premiumMessage');
    var statusMessage = byId('premiumFormStatus');
    var whatsappContainer = byId('premiumWhatsappContainer');
    var whatsappBtn = byId('premiumWhatsappBtn');

    if (!nameField || !phoneField || !messageField || !statusMessage) return;

    var nameVal = nameField.value.trim();
    var phoneVal = phoneField.value.trim();
    var emailVal = emailField ? emailField.value.trim() : '';
    var enquiryTypeVal = enquiryTypeField ? enquiryTypeField.value : 'General Enquiry';
    var branchVal = branchField && branchField.value ? branchField.value : 'Not selected';
    var messageVal = messageField.value.trim();

    var isValid = true;

    // Reset errors
    resetPremiumFormErrors();

    if (!nameVal) {
      showPremiumFormError('premiumName', 'Full Name is required.');
      isValid = false;
    }
    if (!phoneVal) {
      showPremiumFormError('premiumPhone', 'Phone Number is required.');
      isValid = false;
    }
    if (!messageVal) {
      showPremiumFormError('premiumMessage', 'Message / Questions is required.');
      isValid = false;
    }

    if (!isValid) return;

    // Success state
    statusMessage.className = 'form-status-message success';
    statusMessage.textContent = 'Thank you. Your message has been prepared.';

    // Construct a WhatsApp message URL
    var textMessage = 'Hello ' + currentTradingName() + ', my name is ' + nameVal + '.\n' +
                      'Enquiry Type: ' + enquiryTypeVal + '\n' +
                      'Preferred Branch: ' + branchVal + '\n' +
                      'Phone: ' + phoneVal + '\n' +
                      (emailVal ? 'Email: ' + emailVal + '\n' : '') +
                      'Message: ' + messageVal;

    var waUrl = 'https://wa.me/260979972019?text=' + encodeURIComponent(textMessage);
    if (whatsappBtn && whatsappContainer) {
      whatsappBtn.href = waUrl;
      whatsappContainer.classList.remove('hidden');
    }

    // TODO: Connect this form to Supabase backend or real email API later.
    console.info("Premium enquiry form message prepared:", {
      name: nameVal,
      phone: phoneVal,
      email: emailVal,
      enquiryType: enquiryTypeVal,
      branch: branchVal,
      message: messageVal
    });

    // Reset fields
    form.reset();
  });
}

function showPremiumFormError(fieldId, message) {
  var input = byId(fieldId);
  var errSpan = byId('err_' + fieldId);
  if (input) input.classList.add('invalid');
  if (errSpan) errSpan.textContent = message;
}

function resetPremiumFormErrors() {
  var fields = ['premiumName', 'premiumPhone', 'premiumMessage'];
  fields.forEach(function (f) {
    var input = byId(f);
    var errSpan = byId('err_' + f);
    if (input) input.classList.remove('invalid');
    if (errSpan) errSpan.textContent = '';
  });
  var statusMessage = byId('premiumFormStatus');
  if (statusMessage) {
    statusMessage.className = 'form-status-message';
    statusMessage.textContent = '';
  }
}


