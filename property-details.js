/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - PUBLIC PROPERTY DETAILS
   Phase 8C: read one public property and submit enquiries.
   ============================================================ */

var detailsState = {
  property: null,
  images: [],
  branches: [],
  appSettings: {},
  similar: [],
  selectedImageIndex: 0,
  galleryExpanded: false
};

var enquirySubmitting = false;
var propertyLocationMap = null;
var propertyLocationLoadTimer = null;
var propertyLocationInteractionCleanup = null;

var fallbackContact = {
  phone: '+260 979 972019',
  email: 'probbymalyango@gmail.com',
  address: 'Kabulonga, Lusaka, Zambia'
};

var PROPERTY_DETAILS_FIELDS = 'id, reference_number, title, description, price, currency_code, purpose, property_type, area, full_address, latitude, longitude, location_label, map_address, bedrooms, bathrooms, garages, square_metres, status, amenities, virtual_tour_link, youtube_link, branch_id, created_at';
var LEGACY_PROPERTY_DETAILS_FIELDS = 'id, reference_number, title, description, price, currency_code, purpose, property_type, area, full_address, bedrooms, bathrooms, garages, square_metres, status, amenities, virtual_tour_link, youtube_link, branch_id, created_at';

function byId(id) {
  return document.getElementById(id);
}

function getSupabaseClient() {
  return window.hilltopSupabase || null;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function (ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function formatPrice(price, purpose, currencyCode, billingPeriod) {
  return window.HilltopCurrency.formatPropertyPrice(
    price,
    currencyCode,
    purpose,
    billingPeriod
  );
}

function showStatus(message, type) {
  var status = byId('detailsStatus');
  if (!status) return;
  status.textContent = message;
  status.className = 'site-status' + (type ? ' ' + type : '');
}

function hideStatus() {
  var status = byId('detailsStatus');
  if (status) status.className = 'site-status hidden';
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function resolveContact() {
  var company = detailsState.appSettings.company_profile || {};
  return {
    phone: company.phone || fallbackContact.phone,
    email: company.email || fallbackContact.email,
    address: company.address || fallbackContact.address
  };
}

function getBranch() {
  var property = detailsState.property || {};
  return detailsState.branches.find(function (branch) {
    return String(branch.id) === String(property.branch_id);
  }) || null;
}

function sortImages(images) {
  return (images || []).slice().sort(function (a, b) {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return Number(a.display_order || 0) - Number(b.display_order || 0);
  });
}

function getBranchName(branchId) {
  var branch = detailsState.branches.find(function (item) {
    return String(item.id) === String(branchId);
  });
  return branch ? branch.name : 'Hilltop Branch';
}

function getSimilarCoverImage(propertyId) {
  var rows = (detailsState.similarImages || [])
    .filter(function (image) { return String(image.property_id) === String(propertyId); })
    .sort(function (a, b) {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return Number(a.display_order || 0) - Number(b.display_order || 0);
    });
  return rows.length ? rows[0].image_url : '';
}

function propertyStatusClass(status) {
  var value = String(status || '').toLowerCase();
  if (value === 'active') return 'status-active';
  if (value === 'under offer') return 'status-offer';
  if (value === 'sold' || value === 'let / rented') return 'status-closed';
  return 'status-default';
}

async function safeSelect(label, queryBuilder, fallback) {
  try {
    var result = await queryBuilder();
    if (result.error) throw result.error;
    return result.data || fallback || [];
  } catch (error) {
    console.warn('Property details could not load ' + label + '.', error);
    return fallback || [];
  }
}

function isMissingPropertyLocationColumnError(error) {
  var message = String(error && error.message || '').toLowerCase();
  return Boolean(error) && (
    error.code === '42703'
    || error.code === 'PGRST204'
  ) && [
    'latitude',
    'longitude',
    'location_label',
    'map_address'
  ].some(function (column) {
    return message.indexOf(column) !== -1;
  });
}

function buildPropertyDetailsQuery(supabase, fields, id, ref) {
  var query = supabase
    .from('properties')
    .select(fields)
    .in('status', ['Active', 'Under Offer'])
    .limit(1);

  return id ? query.eq('id', id) : query.eq('reference_number', ref);
}

async function selectPropertyDetails(supabase, id, ref) {
  var response = await buildPropertyDetailsQuery(supabase, PROPERTY_DETAILS_FIELDS, id, ref);

  if (isMissingPropertyLocationColumnError(response.error)) {
    console.warn('Property location columns are not available yet. Loading the legacy property fields.');
    response = await buildPropertyDetailsQuery(supabase, LEGACY_PROPERTY_DETAILS_FIELDS, id, ref);
  }

  return response;
}

async function loadPropertyDetails() {
  var supabase = getSupabaseClient();
  var id = getQueryParam('id');
  var ref = getQueryParam('ref');

  if (!supabase) {
    showStatus('Supabase is not configured. Property details cannot be loaded.', 'error');
    return;
  }

  if (!id && !ref) {
    showStatus('This property is no longer available.', 'error');
    return;
  }

  showStatus('Loading property details...');

  var propertyResult = await safeSelect('property', function () {
    return selectPropertyDetails(supabase, id, ref);
  }, []);

  if (!propertyResult.length) {
    // Mock data fallback for visual testing
    if (typeof getMockProperties === 'function') {
      console.warn('Using mock property data for visual testing.');
      var mockProps = getMockProperties();
      var match = id ? mockProps.find(function (p) { return p.id === id; }) : null;
      propertyResult = match ? [match] : [mockProps[0]];
    } else {
      showStatus('This property is no longer available.', 'error');
      return;
    }
  }

  detailsState.property = propertyResult[0];

  var results = await Promise.all([
    safeSelect('property images', function () {
      return supabase
        .from('property_images')
        .select('property_id, image_url, display_order, is_cover')
        .eq('property_id', detailsState.property.id)
        .order('display_order', { ascending: true });
    }),
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
        .in('setting_key', ['company_profile']);
    }),
    safeSelect('similar property candidates', function () {
      return supabase
        .from('properties')
        .select('id, reference_number, title, price, currency_code, purpose, property_type, area, status, branch_id, created_at')
        .in('status', ['Active', 'Under Offer'])
        .neq('id', detailsState.property.id)
        .order('created_at', { ascending: false })
        .limit(12);
    })
  ]);

  detailsState.images = sortImages(results[0]);
  detailsState.branches = results[1];

  // Mock fallback for branches and images on details page
  if (!detailsState.branches.length && typeof getMockBranches === 'function') {
    detailsState.branches = getMockBranches();
  }
  if (!detailsState.images.length && typeof getMockPropertyImages === 'function') {
    var pid = detailsState.property.id;
    detailsState.images = sortImages(getMockPropertyImages().filter(function (img) {
      return String(img.property_id) === String(pid);
    }));
  }

  detailsState.appSettings = {};
  (results[2] || []).forEach(function (row) {
    detailsState.appSettings[row.setting_key] = row.setting_value || {};
  });

  var similarCandidates = results[3] || [];
  if (!similarCandidates.length && typeof getMockProperties === 'function') {
    similarCandidates = getMockProperties().filter(function (p) {
      return p.id !== detailsState.property.id && (p.status === 'Active' || p.status === 'Under Offer');
    });
  }
  detailsState.similar = similarCandidates.filter(function (property) {
    return property.purpose === detailsState.property.purpose
      || property.property_type === detailsState.property.property_type;
  }).slice(0, 3);

  // Fetch similar property images
  var similarIds = detailsState.similar.map(function (p) { return p.id; });
  if (similarIds.length) {
    var similarImages = await safeSelect('similar images', function () {
      return supabase
        .from('property_images')
        .select('property_id, image_url, display_order, is_cover')
        .in('property_id', similarIds)
        .order('display_order', { ascending: true });
    }, []);
    // Mock fallback for similar images
    if (!(similarImages && similarImages.length) && typeof getMockPropertyImages === 'function') {
      similarImages = getMockPropertyImages().filter(function (img) {
        return similarIds.indexOf(img.property_id) !== -1;
      });
    }
    detailsState.similarImages = similarImages || [];
  } else {
    detailsState.similarImages = [];
  }

  renderDetails();
  hideStatus();

  if (window.HilltopMarketInsights && typeof window.HilltopMarketInsights.loadForProperty === 'function') {
    window.HilltopMarketInsights.loadForProperty(detailsState.property, supabase);
  }
}

function updateSeo(property) {
  document.title = property.title + ' | Hilltop Properties Zambia';
  var description = document.querySelector('meta[name="description"]');
  if (description && property.description) {
    description.setAttribute('content', String(property.description).slice(0, 155));
  }
}

function renderGallery() {
  var mainImageMedia = byId('mainImageMedia');
  var thumbnailRow = byId('thumbnailRow');
  var previousButton = byId('galleryPreviousButton');
  var nextButton = byId('galleryNextButton');
  var dots = byId('galleryDots');
  var count = byId('galleryCount');
  var collapseRow = byId('galleryCollapseRow');
  var images = detailsState.images;

  if (detailsState.selectedImageIndex >= images.length) {
    detailsState.selectedImageIndex = 0;
  }
  var selected = images[detailsState.selectedImageIndex];

  if (!images.length) {
    mainImageMedia.innerHTML = [
      '<div class="property-details-placeholder">',
      '<svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
      '<polyline points="9 22 9 12 15 12 15 22"></polyline>',
      '</svg>',
      '<span class="placeholder-text">Hilltop Property</span>',
      '</div>'
    ].join('');
    thumbnailRow.innerHTML = '';
    dots.innerHTML = '';
    count.textContent = '';
    previousButton.classList.add('hidden');
    nextButton.classList.add('hidden');
    dots.classList.add('hidden');
    count.classList.add('hidden');
    collapseRow.classList.add('hidden');
    return;
  }

  var hasMultipleImages = images.length > 1;
  var propertyTitle = escapeHtml(detailsState.property.title);
  var slidePlaceholder = [
    '<div class="property-details-placeholder" style="display: none;">',
    '<svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    '<polyline points="9 22 9 12 15 12 15 22"></polyline>',
    '</svg>',
    '<span class="placeholder-text">Hilltop Property</span>',
    '</div>'
  ].join('');

  mainImageMedia.innerHTML = [
    '<div class="gallery-hero-track">',
    '<div class="gallery-hero-slide gallery-hero-current">',
    '<img src="' + escapeHtml(selected.image_url) + '" alt="' + propertyTitle + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';" />',
    slidePlaceholder,
    '</div>',
    '</div>'
  ].join('');

  previousButton.classList.toggle('hidden', !hasMultipleImages);
  nextButton.classList.toggle('hidden', !hasMultipleImages);
  dots.classList.toggle('hidden', !hasMultipleImages);
  count.classList.remove('hidden');
  count.textContent = (detailsState.selectedImageIndex + 1) + ' / ' + images.length;

  dots.innerHTML = hasMultipleImages ? images.map(function (_, index) {
    return '<button class="gallery-hero-dot' + (index === detailsState.selectedImageIndex ? ' active' : '') + '" type="button" data-gallery-dot="' + index + '" aria-label="View photo ' + (index + 1) + '"' + (index === detailsState.selectedImageIndex ? ' aria-current="true"' : '') + '></button>';
  }).join('') : '';

  var remainingCount = Math.max(images.length - 4, 0);
  var galleryImages = detailsState.galleryExpanded ? images : images.slice(0, 4);

  thumbnailRow.innerHTML = galleryImages.map(function (image, index) {
    var isTrigger = !detailsState.galleryExpanded && index === 3 && remainingCount > 0;
    var overlay = isTrigger ? [
      '<span class="gallery-trigger-overlay" aria-hidden="true">',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
      '<rect x="7" y="4" width="13" height="13" rx="2"></rect>',
      '<path d="m11 8 3 3-3 3M11 8H9M11 14H9"></path>',
      '<path d="M4 8v9a2 2 0 0 0 2 2h9" opacity=".72"></path>',
      '</svg>',
      '<span class="gallery-trigger-count">+' + remainingCount + ' ' + (remainingCount === 1 ? 'Photo' : 'Photos') + '</span>',
      '</span>'
    ].join('') : '';

    return [
      '<button class="thumb-button' + (index === detailsState.selectedImageIndex && !isTrigger ? ' active' : '') + (isTrigger ? ' gallery-trigger' : '') + '" type="button" data-image-index="' + index + '"' + (isTrigger ? ' data-gallery-expand="true" aria-expanded="false" aria-label="Show ' + remainingCount + ' more property photos"' : ' aria-label="View property photo ' + (index + 1) + '"') + '>',
      '<img src="' + escapeHtml(image.image_url) + '" alt="' + escapeHtml(detailsState.property.title) + ' thumbnail" />',
      overlay,
      '</button>'
    ].join('');
  }).join('');

  collapseRow.classList.toggle('hidden', !detailsState.galleryExpanded || remainingCount === 0);
}

function renderFacts(property) {
  var facts = [
    ['Bedrooms', Number(property.bedrooms || 0)],
    ['Bathrooms', Number(property.bathrooms || 0)],
    ['Garages', Number(property.garages || 0)],
    ['Square Metres', Number(property.square_metres || 0).toLocaleString('en-ZM')],
    ['Purpose', property.purpose],
    ['Property Type', property.property_type],
    ['Area', property.area],
    ['Address', property.full_address || 'Available on request']
  ];

  byId('factsGrid').innerHTML = facts.map(function (item) {
    return [
      '<div class="fact">',
      '<span class="fact-label">' + escapeHtml(item[0]) + '</span>',
      '<strong class="fact-value">' + escapeHtml(item[1]) + '</strong>',
      '</div>'
    ].join('');
  }).join('');
}

function renderPropertyHighlights(property) {
  var highlights = [];
  var bedrooms = Number(property.bedrooms || 0);
  var bathrooms = Number(property.bathrooms || 0);
  var garages = Number(property.garages || 0);
  var squareMetres = Number(property.square_metres || 0);

  if (bedrooms > 0) highlights.push(bedrooms + ' ' + (bedrooms === 1 ? 'Bed' : 'Beds'));
  if (bathrooms > 0) highlights.push(bathrooms + ' ' + (bathrooms === 1 ? 'Bathroom' : 'Bathrooms'));
  if (garages > 0) highlights.push(garages + ' ' + (garages === 1 ? 'Garage' : 'Garages'));
  if (squareMetres > 0) highlights.push(squareMetres.toLocaleString('en-ZM') + ' m²');

  if (!highlights.length) {
    highlights = [property.purpose, property.property_type, property.area].filter(Boolean);
  }

  byId('propertyHighlights').innerHTML = highlights.map(function (highlight) {
    return '<span>' + escapeHtml(highlight) + '</span>';
  }).join('');
}

function cleanAmenityName(value) {
  var name = String(value || '').trim();
  var withoutLeadingSymbols = name.replace(/^[^A-Za-z0-9]+/, '').trim();
  return withoutLeadingSymbols || name || 'Amenity';
}

function getAmenityIcon(name) {
  var normalized = String(name || '').toLowerCase();
  var paths;

  if (/(pool|swim)/.test(normalized)) {
    paths = '<path d="M4 8h16M7 8V5.5a2 2 0 0 1 4 0V8M4 13c1.4 1 2.7 1 4.1 0s2.7-1 4.1 0 2.7 1 4.1 0 2.7-1 3.7 0M4 17c1.4 1 2.7 1 4.1 0s2.7-1 4.1 0 2.7 1 4.1 0 2.7-1 3.7 0"></path>';
  } else if (/(garden|courtyard|river|landscap)/.test(normalized)) {
    paths = '<path d="M19.5 4.5C12 4.6 7.2 8.4 7.2 14.2c0 2.6 1.8 4.3 4.1 4.3 5.7 0 8.1-6.6 8.2-14Z"></path><path d="M5 20c2.2-4.9 5.8-8.3 10.8-10.4"></path>';
  } else if (/(security|wall|gate|guard)/.test(normalized)) {
    paths = '<path d="m12 3 7 3.2v5.3c0 4.4-2.8 7.7-7 9.5-4.2-1.8-7-5.1-7-9.5V6.2L12 3Z"></path><path d="m9 12 2 2 4-4"></path>';
  } else if (/(parking|carport|garage)/.test(normalized)) {
    paths = '<path d="m5 16 1.2-5.2A2.4 2.4 0 0 1 8.5 9h7a2.4 2.4 0 0 1 2.3 1.8L19 16"></path><path d="M4 16h16v3H4zM7 19v2M17 19v2M7.5 13h9"></path>';
  } else if (/(gym|fitness)/.test(normalized)) {
    paths = '<path d="M6 9v6M3.5 10.5v3M18 9v6M20.5 10.5v3M6 12h12"></path>';
  } else if (/(borehole|water)/.test(normalized)) {
    paths = '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"></path><path d="M9 15.2c.5 1.2 1.5 1.8 3 1.8"></path>';
  } else if (/(solar|power|electric)/.test(normalized)) {
    paths = '<circle cx="12" cy="12" r="3.5"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"></path>';
  } else if (/(reception|office|conference|server|restaurant|staff)/.test(normalized)) {
    paths = '<path d="M5 21V5h10v16M15 10h4v11M8 8h4M8 12h4M8 16h4M3 21h18"></path>';
  } else if (/(title|serviced|deed)/.test(normalized)) {
    paths = '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.6 2.6L16.5 9"></path>';
  } else {
    paths = '<path d="m3 11 9-7 9 7"></path><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6"></path>';
  }

  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
}

function renderAmenities(property) {
  var amenities = Array.isArray(property.amenities) ? property.amenities.filter(Boolean) : [];
  byId('amenitiesList').innerHTML = amenities.length
    ? amenities.map(function (item) {
      var name = cleanAmenityName(item);
      return [
        '<li class="amenity">',
        '<span class="amenity-icon" aria-hidden="true">' + getAmenityIcon(name) + '</span>',
        '<span class="amenity-name">' + escapeHtml(name) + '</span>',
        '</li>'
      ].join('');
    }).join('')
    : [
      '<li class="amenity">',
      '<span class="amenity-icon" aria-hidden="true">' + getAmenityIcon('property') + '</span>',
      '<span class="amenity-name">Details available on request</span>',
      '</li>'
    ].join('');
}

function renderMediaLinks(property) {
  var links = [];
  if (property.virtual_tour_link) {
    links.push('<a href="' + escapeHtml(property.virtual_tour_link) + '" target="_blank" rel="noopener">Virtual Tour</a>');
  }
  if (property.youtube_link) {
    links.push('<a href="' + escapeHtml(property.youtube_link) + '" target="_blank" rel="noopener">YouTube Video</a>');
  }
  byId('mediaLinks').innerHTML = links.join('');
}

function setDescriptionExpanded(expanded) {
  var wrapper = byId('propertyDescriptionWrap');
  var button = byId('descriptionToggle');
  if (!wrapper || !button) return;

  wrapper.classList.toggle('is-collapsed', !expanded);
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  button.textContent = expanded ? 'Show less' : 'Read more';
}

function updateDescriptionToggle() {
  var wrapper = byId('propertyDescriptionWrap');
  var description = byId('propertyDescription');
  var button = byId('descriptionToggle');
  if (!wrapper || !description || !button) return;

  setDescriptionExpanded(false);
  button.hidden = false;

  var needsToggle = description.scrollHeight > description.clientHeight + 1;
  button.hidden = !needsToggle;
  if (!needsToggle) wrapper.classList.remove('is-collapsed');
}

function parseCoordinate(value) {
  if (value === null || typeof value === 'undefined') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;

  var parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getValidPropertyCoordinates(property) {
  if (!property) return null;

  var latitude = parseCoordinate(property.latitude);
  var longitude = parseCoordinate(property.longitude);

  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return {
    latitude: latitude,
    longitude: longitude
  };
}

function cleanLocationText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function destroyPropertyLocationMap() {
  if (propertyLocationLoadTimer) {
    window.clearTimeout(propertyLocationLoadTimer);
    propertyLocationLoadTimer = null;
  }

  if (propertyLocationInteractionCleanup) {
    propertyLocationInteractionCleanup();
    propertyLocationInteractionCleanup = null;
  }

  if (propertyLocationMap) {
    try {
      propertyLocationMap.remove();
    } catch (error) {
      console.warn('The property location map could not be cleaned up.', error);
    }
    propertyLocationMap = null;
  }
}

function setupCooperativeMapInteraction(map, mapElement, useCooperativeTouch) {
  var instruction = byId('propertyMapInstruction');
  var instructionTimer = null;
  var instructionClearTimer = null;
  var zoomTimer = null;
  var accumulatedWheelDelta = 0;
  var zoomPoint = null;
  var lastInstructionShownAt = 0;
  var isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  var wheelMessage = isMac
    ? 'Use \u2318 + scroll to zoom the map'
    : 'Use Ctrl + scroll to zoom the map';

  function clearInstructionTimers() {
    if (instructionTimer) window.clearTimeout(instructionTimer);
    if (instructionClearTimer) window.clearTimeout(instructionClearTimer);
    instructionTimer = null;
    instructionClearTimer = null;
  }

  function showInstruction(message) {
    var now = Date.now();
    if (!instruction || instruction.classList.contains('is-visible') || now - lastInstructionShownAt < 2500) return;

    clearInstructionTimers();
    lastInstructionShownAt = now;
    instruction.textContent = message;
    instruction.classList.add('is-visible');

    instructionTimer = window.setTimeout(function () {
      instructionTimer = null;
      instruction.classList.remove('is-visible');
      instructionClearTimer = window.setTimeout(function () {
        instructionClearTimer = null;
        if (!instruction.classList.contains('is-visible')) instruction.textContent = '';
      }, 220);
    }, 1500);
  }

  function getWheelDeltaInPixels(event) {
    if (event.deltaMode === 1) return event.deltaY * 20;
    if (event.deltaMode === 2) return event.deltaY * Math.max(mapElement.clientHeight, 1);
    return event.deltaY;
  }

  function performWheelZoom() {
    zoomTimer = null;
    if (!accumulatedWheelDelta || !zoomPoint) return;

    var zoomDirection = accumulatedWheelDelta < 0 ? 1 : -1;
    var zoomSteps = Math.max(1, Math.min(4, Math.ceil(Math.abs(accumulatedWheelDelta) / 240)));
    var targetZoom = Math.max(
      map.getMinZoom(),
      Math.min(map.getMaxZoom(), map.getZoom() + (zoomDirection * zoomSteps))
    );

    accumulatedWheelDelta = 0;
    if (targetZoom !== map.getZoom()) map.setZoomAround(zoomPoint, targetZoom);
  }

  function handleWheel(event) {
    if (!event.ctrlKey && !event.metaKey) {
      showInstruction(wheelMessage);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    accumulatedWheelDelta += getWheelDeltaInPixels(event);
    zoomPoint = map.mouseEventToContainerPoint(event);

    if (zoomTimer) window.clearTimeout(zoomTimer);
    zoomTimer = window.setTimeout(performWheelZoom, 40);
  }

  function handleTouchStart(event) {
    if (useCooperativeTouch && event.touches && event.touches.length === 1) {
      showInstruction('Use two fingers to move the map');
    }
  }

  mapElement.addEventListener('wheel', handleWheel, { passive: false });
  mapElement.addEventListener('touchstart', handleTouchStart, { passive: true });

  return function () {
    mapElement.removeEventListener('wheel', handleWheel, { passive: false });
    mapElement.removeEventListener('touchstart', handleTouchStart, { passive: true });
    clearInstructionTimers();
    if (zoomTimer) window.clearTimeout(zoomTimer);
    zoomTimer = null;
    accumulatedWheelDelta = 0;
    if (instruction) {
      instruction.classList.remove('is-visible');
      instruction.textContent = '';
    }
  };
}

function hidePropertyLocation(preserveSummary) {
  destroyPropertyLocationMap();

  var section = byId('propertyLocationSection');
  var mapElement = byId('propertyMap');
  var textBlock = byId('propertyLocationText');
  var addressElement = byId('propertyLocationAddress');
  var link = byId('propertyLocationLink');

  if (section) section.classList.add('hidden');
  if (mapElement) {
    mapElement.innerHTML = '';
    mapElement.classList.remove(
      'leaflet-container',
      'leaflet-touch',
      'leaflet-retina',
      'leaflet-fade-anim',
      'leaflet-grab',
      'leaflet-touch-drag',
      'leaflet-touch-zoom'
    );
  }
  if (!preserveSummary) {
    if (textBlock) textBlock.classList.add('hidden');
    if (addressElement) addressElement.classList.add('hidden');
    if (byId('propertyLocationName')) byId('propertyLocationName').textContent = '';
    if (addressElement) addressElement.textContent = '';
    if (link) link.removeAttribute('href');
  }
}

function renderPropertyLocation(property) {
  hidePropertyLocation();

  var section = byId('propertyLocationSection');
  var mapElement = byId('propertyMap');
  var locationLabel = cleanLocationText(property.location_label);
  var mapAddress = cleanLocationText(property.map_address);
  var fullAddress = cleanLocationText(property.full_address);
  var area = cleanLocationText(property.area);
  var primaryLocation = locationLabel || area || mapAddress || fullAddress;
  var secondaryLocation = '';

  if (locationLabel && mapAddress && mapAddress !== locationLabel) {
    secondaryLocation = mapAddress;
  } else if (fullAddress && fullAddress !== primaryLocation) {
    secondaryLocation = fullAddress;
  }

  var textBlock = byId('propertyLocationText');
  var nameElement = byId('propertyLocationName');
  var addressElement = byId('propertyLocationAddress');
  var link = byId('propertyLocationLink');

  if (primaryLocation && textBlock && nameElement) {
    nameElement.textContent = primaryLocation;
    textBlock.classList.remove('hidden');
  }

  if (secondaryLocation && addressElement) {
    addressElement.textContent = secondaryLocation;
    addressElement.classList.remove('hidden');
  }

  var coordinates = getValidPropertyCoordinates(property);
  if (!coordinates || !section || !mapElement || !window.L) return;

  if (link) {
    link.href = 'https://www.openstreetmap.org/?mlat=' + encodeURIComponent(coordinates.latitude)
      + '&mlon=' + encodeURIComponent(coordinates.longitude)
      + '#map=17/' + encodeURIComponent(coordinates.latitude)
      + '/' + encodeURIComponent(coordinates.longitude);
  }

  section.classList.remove('hidden');

  try {
    var useCooperativeTouch = window.matchMedia
      && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 767);
    var map = window.L.map(mapElement, {
      scrollWheelZoom: false,
      dragging: !useCooperativeTouch,
      zoomControl: true,
      attributionControl: true,
      touchZoom: true
    }).setView([coordinates.latitude, coordinates.longitude], 16);

    propertyLocationMap = map;
    mapElement.classList.toggle('property-map-cooperative-mobile', Boolean(useCooperativeTouch));
    propertyLocationInteractionCleanup = setupCooperativeMapInteraction(map, mapElement, useCooperativeTouch);

    var tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles by <a href="https://www.hotosm.org/">HOT</a>'
    });

    tileLayer.once('tileload', function () {
      if (propertyLocationLoadTimer) {
        window.clearTimeout(propertyLocationLoadTimer);
        propertyLocationLoadTimer = null;
      }
    });

    tileLayer.once('tileerror', function () {
      window.setTimeout(function () {
        if (propertyLocationMap === map) hidePropertyLocation(true);
      }, 0);
    });

    tileLayer.addTo(map);
    window.L.marker([coordinates.latitude, coordinates.longitude]).addTo(map);

    propertyLocationLoadTimer = window.setTimeout(function () {
      propertyLocationLoadTimer = null;
      if (propertyLocationMap === map && !mapElement.querySelector('.leaflet-tile-loaded')) {
        hidePropertyLocation(true);
      }
    }, 8000);

    var refreshSize = function () {
      if (propertyLocationMap === map) map.invalidateSize({ animate: false });
    };

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(refreshSize);
    } else {
      window.setTimeout(refreshSize, 0);
    }
  } catch (error) {
    console.warn('The property location map could not be displayed.', error);
    hidePropertyLocation(true);
  }
}

function buildPropertyContactMessage(property) {
  var listing = property.title || 'this property';
  if (property.reference_number) listing += ' (' + property.reference_number + ')';
  return "Hello, I'm interested in " + listing + '. Please share more details.';
}

function renderPropertyContact(property) {
  var section = byId('propertyContactSection');
  if (!section) return;

  var branch = getBranch();
  var companyContact = resolveContact();
  var branchName = branch && branch.name ? branch.name : 'Hilltop Properties Zambia';
  var branchAddress = branch && branch.address ? branch.address : companyContact.address;
  var branchPhone = branch && branch.contact_number ? branch.contact_number : companyContact.phone;
  var contactMessage = buildPropertyContactMessage(property);
  var whatsappLink = byId('propertyWhatsappLink');
  var callLink = byId('propertyCallLink');

  byId('propertyContactBranchName').textContent = branchName;
  byId('propertyContactBranchAddress').textContent = branchAddress || '';
  byId('propertyContactBranchPhone').textContent = branchPhone || '';
  byId('propertyContactPropertyId').value = property.id;
  byId('propertyContactBranchId').value = property.branch_id || '';
  byId('propertyContactNotes').value = contactMessage;

  if (branchPhone) {
    var whatsappPhone = String(branchPhone).replace(/[^0-9]/g, '');
    var callPhone = String(branchPhone).replace(/[^0-9+]/g, '');
    whatsappLink.href = 'https://wa.me/' + whatsappPhone + '?text=' + encodeURIComponent(contactMessage);
    callLink.href = 'tel:' + callPhone;
    whatsappLink.classList.remove('hidden');
    callLink.classList.remove('hidden');
  } else {
    whatsappLink.classList.add('hidden');
    callLink.classList.add('hidden');
  }

  section.classList.remove('hidden');
}

function renderSimilar() {
  var section = byId('similarSection');
  var grid = byId('similarGrid');

  if (!detailsState.similar.length) {
    section.classList.add('hidden');
    return;
  }

  grid.innerHTML = detailsState.similar.map(function (property) {
    var image = getSimilarCoverImage(property.id);
    var detailsUrl = 'property-details.html?id=' + encodeURIComponent(property.id);
    var location = property.area || getBranchName(property.branch_id) || 'Location available on request';
    var imageMarkup = image ? '<img class="similar-property-image" src="' + escapeHtml(image) + '" alt="' + escapeHtml(property.title) + '" loading="lazy" onerror="this.style.display=\'none\'" />' : '';

    return [
      '<a class="similar-property-card" href="' + detailsUrl + '" aria-label="View ' + escapeHtml(property.title) + '">',
      '<div class="similar-property-media">',
      '<div class="similar-property-placeholder" aria-hidden="true">',
      '<svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
      '<polyline points="9 22 9 12 15 12 15 22"></polyline>',
      '</svg>',
      '<span class="placeholder-text">Hilltop Property</span>',
      '</div>',
      imageMarkup,
      '<span class="similar-property-verified">HILLTOP.Verified</span>',
      '</div>',
      '<div class="similar-property-body">',
      '<h3 class="similar-property-title">' + escapeHtml(property.title) + '</h3>',
      '<p class="similar-property-location">',
      '<svg class="similar-property-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path>',
      '<circle cx="12" cy="10" r="2.5"></circle>',
      '</svg>',
      '<span>' + escapeHtml(location) + '</span>',
      '</p>',
      '</div>',
      '</a>'
    ].join('');
  }).join('');
  section.classList.remove('hidden');
}

function renderDetails() {
  var property = detailsState.property;

  if (window.HilltopWhatsAppCTA) {
    window.HilltopWhatsAppCTA.setProperty({
      title: property.title,
      url: window.location.href
    });
  }

  updateSeo(property);
  renderGallery();
  renderFacts(property);
  renderAmenities(property);
  renderPropertyHighlights(property);
  renderMediaLinks(property);
  renderPropertyLocation(property);
  renderPropertyContact(property);
  renderSimilar();

  byId('propertyTitle').textContent = property.title;
  byId('propertyBreadcrumbArea').textContent = property.area || 'Zambia';
  byId('propertyBreadcrumbTitle').textContent = property.title;
  byId('propertyPrice').textContent = formatPrice(property.price, property.purpose, property.currency_code, property.billing_period);
  byId('propertyDescription').textContent = property.description || 'Details available on request.';

  byId('detailsContent').classList.remove('hidden');
  byId('detailsBody').classList.remove('hidden');
  byId('propertyEnquirySection').classList.remove('hidden');

  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(updateDescriptionToggle);
  } else {
    window.setTimeout(updateDescriptionToggle, 0);
  }
}

function setEnquiryMessage(message, type, messageBox) {
  messageBox = messageBox || byId('enquiryMessage');
  if (!messageBox) return;
  messageBox.textContent = message || '';
  messageBox.className = 'enquiry-message' + (type ? ' ' + type : '');
}

function setWhatsappFallback() {
  var property = detailsState.property || {};
  var contact = resolveContact();
  var fallback = byId('enquiryWhatsappFallback');
  if (!fallback) return;

  if (!contact.phone) {
    fallback.classList.add('hidden');
    return;
  }

  var phone = String(contact.phone).replace(/[^0-9]/g, '');
  var message = 'Hello Hilltop Properties Zambia, I would like to enquire about property ' + property.reference_number + '.';
  fallback.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  fallback.classList.remove('hidden');
}

function openEnquiryModal() {
  var property = detailsState.property;
  if (!property) return;

  byId('enquiryForm').reset();
  byId('enquiryPropertyId').value = property.id;
  byId('enquiryBranchId').value = property.branch_id || '';
  byId('enquiryPropertyDisplay').textContent = property.reference_number + ' - ' + property.title;
  byId('enquiryNotes').value = 'Website enquiry for property ' + property.reference_number;
  setEnquiryMessage('', '');
  setWhatsappFallback();

  var modal = byId('enquiryModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  byId('enquiryName').focus();
}

function closeEnquiryModal() {
  var modal = byId('enquiryModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  enquirySubmitting = false;
  byId('enquirySubmit').disabled = false;
}

function validateEnquiryPayload(name, phone, email, branchId, notes, property) {
  if (!name) return 'Full name is required.';
  if (!phone) return 'Phone number is required.';
  if (!branchId) return 'No branch is available to receive this enquiry.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (notes.length > 1000) return 'Message must be 1000 characters or less.';
  if (!property || ['Active', 'Under Offer'].indexOf(property.status) === -1) {
    return 'This property is not available for public enquiry.';
  }
  return '';
}

function clearInlineContactValidation() {
  ['propertyContactName', 'propertyContactEmail', 'propertyContactPhone'].forEach(function (id) {
    var field = byId(id);
    if (!field) return;
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  });
}

function markInlineContactFieldInvalid(field) {
  if (!field) return;
  field.classList.add('is-invalid');
  field.setAttribute('aria-invalid', 'true');
}

async function submitEnquiry(event) {
  event.preventDefault();
  if (enquirySubmitting) return;

  var form = event.currentTarget;
  var isInlineContact = form && form.id === 'propertyContactForm';
  var messageBox = isInlineContact ? byId('propertyContactMessage') : byId('enquiryMessage');
  var submitButton = isInlineContact ? byId('propertyContactSubmit') : byId('enquirySubmit');
  var supabase = getSupabaseClient();
  var property = detailsState.property;
  var nameField = byId(isInlineContact ? 'propertyContactName' : 'enquiryName');
  var phoneField = byId(isInlineContact ? 'propertyContactPhone' : 'enquiryPhone');
  var emailField = byId(isInlineContact ? 'propertyContactEmail' : 'enquiryEmail');
  var name = nameField.value.trim();
  var phone = phoneField.value.trim();
  var email = emailField.value.trim();
  var notes = byId(isInlineContact ? 'propertyContactNotes' : 'enquiryNotes').value.trim();
  var branchId = byId(isInlineContact ? 'propertyContactBranchId' : 'enquiryBranchId').value;
  var honeypot = byId(isInlineContact ? 'propertyContactWebsiteUrl' : 'enquiryWebsiteUrl').value.trim();

  if (isInlineContact) {
    clearInlineContactValidation();

    var invalidFields = [];
    if (!name) invalidFields.push(nameField);
    if (!phone) invalidFields.push(phoneField);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalidFields.push(emailField);

    if (invalidFields.length) {
      invalidFields.forEach(markInlineContactFieldInvalid);
      setEnquiryMessage('', '', messageBox);
      invalidFields[0].focus();
      return;
    }

    var countryCode = byId('propertyContactCountryCode').value.trim();
    phone = [countryCode, phone].filter(Boolean).join(' ');
  }

  if (honeypot) {
    setEnquiryMessage('Thank you. Your enquiry has been sent. Hilltop Properties will contact you shortly.', 'success', messageBox);
    if (!isInlineContact) setTimeout(closeEnquiryModal, 1100);
    return;
  }

  var validationError = validateEnquiryPayload(name, phone, email, branchId, notes, property);
  if (validationError) {
    setEnquiryMessage(validationError, 'error', messageBox);
    return;
  }

  if (!supabase) {
    setEnquiryMessage('We could not send the enquiry right now. Please use the WhatsApp contact option or try again shortly.', 'error', messageBox);
    if (!isInlineContact) setWhatsappFallback();
    return;
  }

  enquirySubmitting = true;
  submitButton.disabled = true;
  setEnquiryMessage('Sending enquiry...', '', messageBox);

  try {
    var result = await supabase.from('leads').insert({
      client_name: name,
      phone: phone,
      email: email || null,
      property_id: property.id,
      branch_id: branchId,
      source: 'Website',
      status: 'New',
      notes: notes || null
    });

    if (result.error) throw result.error;

    setEnquiryMessage('Thank you. Your enquiry has been sent. Hilltop Properties will contact you shortly.', 'success', messageBox);
    form.reset();
    if (isInlineContact) {
      byId('propertyContactPropertyId').value = property.id;
      byId('propertyContactBranchId').value = property.branch_id || '';
      byId('propertyContactNotes').value = buildPropertyContactMessage(property);
    } else {
      setTimeout(closeEnquiryModal, 1400);
    }
  } catch (error) {
    console.warn('Property enquiry could not be submitted.', error);
    setEnquiryMessage('We could not send the enquiry right now. Please use the WhatsApp contact option or try again shortly.', 'error', messageBox);
    if (!isInlineContact) setWhatsappFallback();
  } finally {
    enquirySubmitting = false;
    submitButton.disabled = false;
  }
}

function bindEvents() {
  byId('navToggle').addEventListener('click', function () {
    byId('siteNav').classList.toggle('open');
  });

  var headerEnq = byId('headerEnquiryButton');
  if (headerEnq) headerEnq.addEventListener('click', openEnquiryModal);
  byId('detailsEnquiryButton').addEventListener('click', openEnquiryModal);
  byId('descriptionToggle').addEventListener('click', function () {
    var isExpanded = byId('descriptionToggle').getAttribute('aria-expanded') === 'true';
    setDescriptionExpanded(!isExpanded);
  });
  byId('enquiryForm').addEventListener('submit', submitEnquiry);
  byId('propertyContactForm').addEventListener('submit', submitEnquiry);
  ['propertyContactName', 'propertyContactEmail', 'propertyContactPhone'].forEach(function (id) {
    var field = byId(id);
    if (!field) return;
    field.addEventListener('input', function () {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    });
  });
  byId('enquiryModalClose').addEventListener('click', closeEnquiryModal);
  byId('enquiryModal').addEventListener('click', function (event) {
    if (event.target === byId('enquiryModal')) closeEnquiryModal();
  });

  byId('thumbnailRow').addEventListener('click', function (event) {
    var button = event.target.closest('.thumb-button');
    if (!button) return;

    if (button.dataset.galleryExpand === 'true') {
      detailsState.galleryExpanded = true;
      renderGallery();
      return;
    }

    detailsState.selectedImageIndex = Number(button.dataset.imageIndex || 0);
    renderGallery();
  });

  byId('galleryPreviousButton').addEventListener('click', function () {
    var imageCount = detailsState.images.length;
    if (imageCount < 2) return;
    detailsState.selectedImageIndex = (detailsState.selectedImageIndex - 1 + imageCount) % imageCount;
    renderGallery();
  });

  byId('galleryNextButton').addEventListener('click', function () {
    var imageCount = detailsState.images.length;
    if (imageCount < 2) return;
    detailsState.selectedImageIndex = (detailsState.selectedImageIndex + 1) % imageCount;
    renderGallery();
  });

  byId('galleryDots').addEventListener('click', function (event) {
    var dot = event.target.closest('[data-gallery-dot]');
    if (!dot) return;
    detailsState.selectedImageIndex = Number(dot.dataset.galleryDot || 0);
    renderGallery();
  });

  byId('galleryCollapseButton').addEventListener('click', function () {
    detailsState.galleryExpanded = false;
    renderGallery();
  });

  document.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target.tagName === 'IMG') {
      if (target.closest('.property-card-image-wrapper')) {
        target.classList.add('is-broken');
        target.setAttribute('aria-hidden', 'true');
      } else if (target.closest('#mainImage')) {
        target.style.display = 'none';
        var placeholder = target.nextElementSibling;
        if (placeholder && placeholder.classList.contains('property-details-placeholder')) {
          placeholder.style.display = 'flex';
        }
      }
    }
  }, true);
}

document.addEventListener('DOMContentLoaded', function () {
  byId('year').textContent = new Date().getFullYear();
  bindEvents();
  loadPropertyDetails();
});
