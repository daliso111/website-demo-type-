/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - PUBLIC WEBSITE
   Phase 8A: read-only Supabase public data loading.
   ============================================================ */

var publicState = {
  properties: [],
  exclusiveProperties: [],
  images: [],
  branches: [],
  provinces: [],
  cities: [],
  province: 'all',
  city: 'all',
  area: 'all',
  currency: 'all',
  minPrice: '',
  maxPrice: '',
  minBedrooms: '',
  listingsLoaded: false,
  homepage: null,
  banners: [],
  testimonials: [],
  propertyServices: null,
  appSettings: {},
  search: '',
  locationText: '',
  routeLocationPath: '',
  selectedLocation: null,
  invalidLocationPath: false,
  purpose: 'all',
  type: 'all',
  branch: 'all',
  publicStatus: 'all',
  category: 'all',
  sort: 'newest'
};

// The homepage search is a draft form. It must never drive publicState because
// publicState is also the source used to render the homepage inventory sections.
var discoverySearchState = {
  purpose: 'For Sale',
  province: 'all',
  city: 'all',
  location: '',
  locationQuery: '',
  selectedLocation: null,
  area: 'all',
  type: 'all',
  currency: 'all',
  minPrice: '',
  maxPrice: '',
  minBedrooms: '',
  minBathrooms: '',
  minSize: '',
  reference: '',
  features: [],
  search: ''
};

// The listings form is draft state too. Applied location state remains in
// publicState and changes only when the URL is read or the form is submitted.
var listingLocationDraft = {
  locationQuery: '',
  selectedLocation: null
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
  var purpose = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  if (purpose === 'for rent' || purpose === 'rent') return 'For Rent';
  if (purpose === 'for sale' || purpose === 'sale') return 'For Sale';
  return 'all';
}

var LISTING_COLLECTION_ROUTES = {
  'properties-for-sale': 'For Sale',
  'properties-for-rent': 'For Rent',
  'property-for-sale': 'For Sale',
  'property-for-rent': 'For Rent'
};

function listingBasePathForPurpose(value) {
  var purpose = normalizeListingPurpose(value);
  if (purpose === 'For Sale') return '/properties-for-sale';
  if (purpose === 'For Rent') return '/properties-for-rent';
  return '/listings';
}

function parseListingRoute(pathname) {
  var path = String(pathname || '').replace(/\/+$/, '') || '/';
  var segments = path.split('/').filter(Boolean);
  var routePurpose = LISTING_COLLECTION_ROUTES[String(segments[0] || '').toLowerCase()] || 'all';
  if (routePurpose === 'all') {
    return {isListingRoute: false, purpose: 'all', locationPath: '', invalid: false};
  }

  var rawLocationPath = segments.slice(1).join('/');
  var locationPath = '';
  try {
    locationPath = decodeURIComponent(rawLocationPath).trim().toLowerCase();
  } catch (error) {
    return {isListingRoute: true, purpose: routePurpose, locationPath: '', invalid: true};
  }
  var invalid = segments.length > 3 || (locationPath && !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(locationPath));
  return {
    isListingRoute: true,
    purpose: routePurpose,
    locationPath: locationPath,
    invalid: invalid,
    legacy: String(segments[0] || '').indexOf('properties-') !== 0
  };
}

function listingPurposeFromPathname(pathname) {
  return parseListingRoute(pathname).purpose;
}

function canonicalCollectionHref(value) {
  var original = String(value || '').trim();
  if (!original) return original;

  var target;
  try {
    target = new URL(original, window.location.href);
  } catch (error) {
    return original;
  }
  if (target.origin !== window.location.origin) return original;

  var pathname;
  try {
    pathname = decodeURIComponent(target.pathname).replace(/\/+$/, '').toLowerCase();
  } catch (error) {
    pathname = target.pathname.replace(/\/+$/, '').toLowerCase();
  }
  var purpose = 'all';
  if (pathname.endsWith('/property replica/sales/listings.html')) purpose = 'For Sale';
  if (pathname.endsWith('/property replica/rent/listings.html')) purpose = 'For Rent';
  var collectionRoute = parseListingRoute(pathname);
  if (collectionRoute.isListingRoute) purpose = collectionRoute.purpose;
  if (pathname === '/listings' || pathname === '/listings.html') {
    purpose = normalizeListingPurpose(target.searchParams.get('listingType') || target.searchParams.get('purpose'));
  }
  if (purpose === 'all') return original;

  target.pathname = listingBasePathForPurpose(purpose) +
    (collectionRoute.locationPath ? '/' + collectionRoute.locationPath : '');
  target.searchParams.delete('listingType');
  target.searchParams.delete('purpose');
  return target.pathname + target.search + target.hash;
}

function navigateToDedicatedListings(value, searchParams, locationPath) {
  var purpose = normalizeListingPurpose(value);
  var path = purpose === 'all' ? '' : listingBasePathForPurpose(purpose);
  if (!path) return false;
  var normalizedPath = String(locationPath || '').trim().toLowerCase();
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(normalizedPath)) {
    path += '/' + normalizedPath;
  }

  var target = new URL(path, window.location.href);
  target.search = searchParams instanceof URLSearchParams
    ? searchParams.toString()
    : window.location.search;
  target.searchParams.delete('listingType');
  target.searchParams.delete('purpose');
  if (target.href === window.location.href) return false;
  window.location.assign(target.href);
  return true;
}

function discoverySearchParams(routeLocationPath) {
  var params = new URLSearchParams();
  var values = {
    province: routeLocationPath ? '' : discoverySearchState.province,
    city: routeLocationPath ? '' : discoverySearchState.city,
    location: routeLocationPath ? '' : discoverySearchState.location,
    area: routeLocationPath ? '' : discoverySearchState.area,
    type: discoverySearchState.type === 'all' ? '' : discoverySearchState.type.toLowerCase(),
    currency: discoverySearchState.currency,
    minPrice: discoverySearchState.minPrice,
    maxPrice: discoverySearchState.maxPrice,
    minBedrooms: discoverySearchState.minBedrooms,
    q: discoverySearchState.search
  };
  Object.keys(values).forEach(function (name) {
    var value = String(values[name] == null ? '' : values[name]).trim();
    if (value && value.toLowerCase() !== 'all') params.set(name, value);
  });
  return params;
}

function canonicalLocationPath(location) {
  if (!location) return '';
  if (location.type === 'province' && location.provinceSlug) return location.provinceSlug + '-province';
  if (location.type === 'city' && location.citySlug) return location.citySlug;
  if (location.type === 'suburb' && location.citySlug && location.suburbSlug) {
    return location.citySlug + '/' + location.suburbSlug;
  }
  return '';
}

var categoryConfig = getCategoryConfigFromUrl();
publicState.category = categoryConfig.key;
var initialListingRoute = parseListingRoute(window.location.pathname);
publicState.purpose = initialListingRoute.purpose;
publicState.routeLocationPath = initialListingRoute.locationPath;
if (publicState.purpose === 'all') publicState.purpose = normalizeListingPurpose(selectedPurpose);

var fallbackContact = {
  phone: '+260 979 972019',
  office: '+260 213 322 035',
  email: 'probbymalyango@gmail.com',
  address: 'Kabulonga, Lusaka, Zambia'
};


var fallbackTestimonialSlides = [
  {
    client_name: 'Davies Mubambe',
    client_role: 'Buyer',
    message: 'The customer service is on point.',
    background_type: 'image',
    background_image_url: 'assets/images/hero-poster.png',
    background_color: '#071827'
  },
  {
    client_name: 'Client Testimonial',
    client_role: 'Tenant',
    message: 'Hilltop made the viewing and enquiry process clear from start to finish.',
    background_type: 'image',
    background_image_url: 'assets/images/hero-poster.png',
    background_color: '#071827'
  },
  {
    client_name: 'Client Testimonial',
    client_role: 'Investor',
    message: 'I appreciated the clear communication and the verified property details.',
    background_type: 'solid',
    background_color: '#071827'
  },
  {
    client_name: 'Client Testimonial',
    client_role: 'Landlord',
    message: 'The team helped me understand the available options before making a decision.',
    background_type: 'solid',
    background_color: '#132c46'
  },
  {
    client_name: 'Client Testimonial',
    client_role: 'Property Client',
    message: 'The branch support made it easier to connect with the right person.',
    background_type: 'solid',
    background_color: '#0b1f2f'
  }
];

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

var PUBLIC_PROPERTY_FIELDS = 'id, reference_number, title, description, price, currency_code, purpose, property_type, area, full_address, bedrooms, bathrooms, garages, square_metres, status, featured, branch_id, created_at, amenities';
var LEGACY_PUBLIC_PROPERTY_FIELDS = 'id, reference_number, title, description, price, purpose, property_type, area, full_address, bedrooms, bathrooms, garages, square_metres, status, featured, branch_id, created_at, amenities';

function isMissingCurrencyColumnError(error) {
  var message = String(error && error.message || '').toLowerCase();
  return Boolean(error) && (error.code === '42703' || message.indexOf('currency_code') !== -1);
}

function buildPublicPropertyQuery(supabase, fields, filters) {
  var query = supabase
    .from('properties')
    .select(fields)
    .in('status', ['Active', 'Under Offer']);
  if (filters && filters.purpose && filters.purpose !== 'all') {
    query = query.eq('purpose', filters.purpose);
  }
  if (filters && filters.cityId) {
    query = query.eq('city_id', filters.cityId);
  }
  if (filters && filters.provinceId) {
    query = query.eq('province_id', filters.provinceId);
  }
  if (filters && filters.suburbId) {
    query = query.eq('suburb_id', filters.suburbId);
  }
  return query.order('created_at', { ascending: false });
}

async function resolveListingLocationPath(supabase, locationPath) {
  if (!locationPath) return null;
  var response = await supabase.rpc('resolve_location_path', {
    location_path: locationPath
  });
  if (response.error) throw response.error;
  var rows = normalizeLocationSearchResults(response.data);
  if (rows.length !== 1 || canonicalLocationPath(rows[0]) !== locationPath) return null;
  return rows[0];
}

function propertyLocationQueryFilters(location) {
  if (!location) return {};
  if (location.type === 'province') return {provinceId: location.provinceId};
  if (location.type === 'city') return {cityId: location.cityId};
  if (location.type === 'suburb') return {suburbId: location.suburbId};
  return {};
}

async function selectPublicPropertyRows(supabase) {
  var geography = byId('discoveryForm') ? ', province_id, city_id, area_slug' : '';
  var response = await buildPublicPropertyQuery(supabase, PUBLIC_PROPERTY_FIELDS + geography);

  if (isMissingCurrencyColumnError(response.error)) {
    console.warn('[Hilltop] The property currency migration is not applied. Public properties are loading with the legacy ZMW fallback.');
    response = await buildPublicPropertyQuery(supabase, LEGACY_PUBLIC_PROPERTY_FIELDS + geography);
  }

  return response;
}

async function loadPublicData() {
  var supabase = getSupabaseClient();
  if (!supabase) {
    showStatus('Supabase is not configured. Showing fallback website content.', 'error');
    renderWebsite();
    return;
  }

  showStatus('Loading website content...');

  var propertiesLoaded = false;
  var results = await Promise.all([
    safeSelect('properties', function () {
      return selectPublicPropertyRows(supabase).then(function (response) {
        propertiesLoaded = !response.error;
        return response;
      });
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
    }),
    safeSelect('provinces', function () {
      return supabase.from('provinces').select('id, name, slug, map_key, sort_order').order('sort_order');
    }),
    safeSelect('cities', function () {
      return supabase.from('cities').select('id, province_id, name, slug').order('name');
    })
  ]);

  publicState.listingsLoaded = propertiesLoaded;
  publicState.properties = results[0];
  publicState.images = results[1];
  publicState.branches = results[2];
  publicState.homepage = results[3] && results[3].length ? results[3][0] : null;
  publicState.banners = results[4];
  publicState.testimonials = results[5];
  publicState.appSettings = {};
  (results[6] || []).forEach(function (row) {
    publicState.appSettings[row.setting_key] = row.setting_value || {};
  });
  publicState.propertyServices = results[7];
  publicState.exclusiveProperties = results[8] || [];
  publicState.provinces = results[9] || [];
  publicState.cities = results[10] || [];

  renderWebsite();
  hideStatus();

  if (!publicState.properties.length) {
    showStatus('No active public properties are available yet. Please check back soon or contact Hilltop Properties for current listings.', 'error');
  }
}

async function loadSharedPublicData() {
  var supabase = getSupabaseClient();
  if (!supabase) {
    renderContact();
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
}

async function loadListingsData() {
  var supabase = getSupabaseClient();
  publicState.listingsLoaded = false;
  setListingsViewState('loading');

  if (!supabase) {
    renderListingsTypeFilter();
    setListingsViewState('error', 'Supabase is not configured. Listings cannot be loaded right now.');
    return;
  }

  try {
    var metadata = await Promise.all([
      supabase
        .from('branches')
        .select('id, name, address, contact_number')
        .order('name', { ascending: true }),
      supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', PUBLIC_SETTING_KEYS),
      supabase.from('provinces').select('id, name, slug, map_key, sort_order').order('sort_order'),
      supabase.from('cities').select('id, province_id, name, slug').order('name')
    ]);

    metadata.forEach(function (result) {
      if (result.error) throw result.error;
    });

    publicState.branches = metadata[0].data || [];
    publicState.provinces = metadata[2].data || [];
    publicState.cities = metadata[3].data || [];

    publicState.appSettings = {};
    (metadata[1].data || []).forEach(function (row) {
      publicState.appSettings[row.setting_key] = row.setting_value || {};
    });

    var route = parseListingRoute(window.location.pathname);
    var routeLocation = route.invalid ? null : await resolveListingLocationPath(supabase, route.locationPath);
    publicState.invalidLocationPath = Boolean(route.invalid || (route.locationPath && !routeLocation));
    publicState.selectedLocation = routeLocation;
    publicState.routeLocationPath = route.locationPath;
    var locationFilters = propertyLocationQueryFilters(routeLocation);
    locationFilters.purpose = route.purpose;
    var inventory = await Promise.all([
      publicState.invalidLocationPath
        ? Promise.resolve({data: [], error: null})
        : buildPublicPropertyQuery(
          supabase,
          PUBLIC_PROPERTY_FIELDS + ', province_id, city_id, suburb_id, area_slug',
          locationFilters
        ),
      supabase
        .from('property_images')
        .select('property_id, image_url, display_order, is_cover')
        .order('display_order', { ascending: true })
    ]);
    inventory.forEach(function (result) {
      if (result.error) throw result.error;
    });
    publicState.properties = inventory[0].data || [];
    publicState.images = inventory[1].data || [];

    publicState.listingsLoaded = true;
    readListingUrl();
    renderListingsPage();
  } catch (error) {
    console.warn('Public listings could not be loaded.', error);
    publicState.properties = [];
    publicState.images = [];
    publicState.listingsLoaded = false;
    renderListingsTypeFilter();
    setListingsViewState('error', 'We could not load listings right now. Please try again shortly or contact Hilltop Properties.');
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
  var title = homepage.hero_title || (banner && banner.title) || 'Find Verified Properties Across Zambia';
  var subtitle = homepage.hero_subtitle || (banner && banner.subtitle) || 'Buy, rent, and enquire about trusted properties through Hilltop Properties Zambia.';
  var buttonText = homepage.hero_button_text || (banner && banner.button_text) || 'View Listings';
  var buttonLink = canonicalCollectionHref(homepage.hero_button_link || (banner && banner.button_link) || 'listings.html');

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
  var websitePreferences =
    publicState.appSettings.website_preferences || {};

  var configuredHeroFallback =
    safeCssUrl(
      websitePreferences.heroFallbackImageUrl || ''
    );

  configureHeroVideo(
    settingUrl('homepage_hero_video_url'),
    settingUrl('homepage_hero_poster_url'),
    imageUrl || configuredHeroFallback
  );
}

function propertyStatusClass(status) {
  var value = String(status || '').toLowerCase();
  if (value === 'active') return 'status-active';
  if (value === 'under offer') return 'status-offer';
  if (value === 'sold' || value === 'let / rented') return 'status-closed';
  return 'status-default';
}

function propertyTitleForDisplay(value) {
  var title = String(value || '').replace(/\s+/g, ' ').trim();
  var letters = title.match(/[A-Za-z]/g);

  // Preserve titles that already contain intentional mixed-case formatting.
  if (!letters || title !== title.toUpperCase()) return title;

  var minorWords = {
    a: true,
    an: true,
    and: true,
    as: true,
    at: true,
    by: true,
    for: true,
    from: true,
    in: true,
    of: true,
    on: true,
    or: true,
    the: true,
    to: true,
    via: true,
    with: true
  };
  var acronyms = {
    cbd: 'CBD',
    mls: 'MLS',
    unza: 'UNZA',
    usd: 'USD',
    usa: 'USA',
    uae: 'UAE',
    uk: 'UK',
    zmw: 'ZMW'
  };
  var wordIndex = 0;

  return title.toLowerCase().replace(/[a-z]+(?:['’][a-z]+)*/g, function (word) {
    var replacement = acronyms[word];
    var isFirstWord = wordIndex === 0;
    wordIndex += 1;

    if (replacement) return replacement;
    if (!isFirstWord && minorWords[word]) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

function propertyCard(property, variant) {
  var isHomepageCard = variant === 'homepage';
  var image = getCoverImage(property.id);
  var detailsUrl = 'property-details.html?id=' + encodeURIComponent(property.id);
  var detailsLabel = 'View details for ' + (property.title || property.reference_number || 'Hilltop property');
  var displayTitle = propertyTitleForDisplay(property.title || property.reference_number || 'Hilltop property');
  var statusClass = propertyStatusClass(property.status);
  var location = property.area || getBranchName(property.branch_id) || 'Location available on request';
  var imageMarkup = image ? '<img class="property-card-img" src="' + escapeHtml(image) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" />' : '';
  var statusBadgeMarkup = isHomepageCard
    ? ''
    : '<span class="badge status-badge ' + statusClass + '">' + escapeHtml(property.status) + '</span>';

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
    '<a class="property-card' + (isHomepageCard ? ' property-card--homepage' : '') + '" href="' + detailsUrl + '" aria-label="' + escapeHtml(detailsLabel) + '">',
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
    statusBadgeMarkup,
    '</div>',
    isHomepageCard
      ? '<span class="property-card-verified">HILLTOP.Verified</span>'
      : '<div class="property-card-overlay-label"><span class="property-card-ref">' +
        escapeHtml(property.reference_number) + '</span><h4 class="property-card-overlay-title">' +
        escapeHtml(property.title) + '</h4></div>',
    '</div>',
    '<div class="property-card-body">',
    '<div class="property-card-price">' + formatPrice(property.price, property.purpose, property.currency_code, property.billing_period) + '</div>',
    isHomepageCard ? '<h4 class="property-card-title">' + escapeHtml(displayTitle) + '</h4>' : '',
    '<p class="property-card-location">' + escapeHtml(location) + ' &middot; ' + escapeHtml(property.property_type) + '</p>',
    specsHtml,
    '</div>',
    '</a>'
  ].join('');
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

var listingControlFields = {
  listingSearchInput: 'search',
  listingLocationInput: 'locationText',
  listingProvinceFilter: 'province',
  listingCityFilter: 'city',
  listingAreaFilter: 'area',
  listingBranchFilter: 'branch',
  listingPurposeFilter: 'purpose',
  listingTypeFilter: 'type',
  listingCurrencyFilter: 'currency',
  listingMinPriceFilter: 'minPrice',
  listingMaxPriceFilter: 'maxPrice',
  listingBedroomsFilter: 'minBedrooms',
  listingBathroomsFilter: 'minBathrooms',
  listingMinSizeFilter: 'minSize',
  listingReferenceFilter: 'reference',
  listingStatusFilter: 'publicStatus',
  listingSortSelect: 'sort'
};

function listingLocationDisplayName(location) {
  if (!location) return '';
  if (location.type === 'province' && !/\bprovince$/i.test(location.name)) {
    return location.name + ' Province';
  }
  return location.name;
}

function applyRouteLocationState() {
  var location = publicState.selectedLocation;
  if (!location) return;
  publicState.locationText = listingLocationDisplayName(location);
  publicState.province = location.provinceSlug || 'all';
  publicState.city = location.type === 'province' ? 'all' : location.citySlug || 'all';
  publicState.area = location.type === 'suburb' ? location.suburbSlug || 'all' : 'all';
}

function readListingUrl() {
  var query = new URLSearchParams(window.location.search);
  var route = parseListingRoute(window.location.pathname);
  var routePurpose = route.purpose;
  publicState.routeLocationPath = route.locationPath;
  if (!route.locationPath) {
    publicState.selectedLocation = null;
    publicState.invalidLocationPath = false;
  }
  publicState.category = normalizeListingCategory(query.get('category'));
  publicState.purpose = routePurpose === 'all'
    ? normalizeListingPurpose(query.get('listingType') || query.get('purpose'))
    : routePurpose;
  publicState.search = query.get('q') || query.get('keyword') || '';
  publicState.reference = query.get('reference') || '';
  publicState.locationText = query.get('location') || '';
  ['province', 'city', 'area'].forEach(function (field) {
    publicState[field] = (query.get(field) || 'all').trim().toLowerCase();
  });
  publicState.branch = query.get('branch') || 'all';
  var types = {house: 'House', apartment: 'Apartment', commercial: 'Commercial', land: 'Land', farm: 'Farm'};
  publicState.type = types[(query.get('type') || '').toLowerCase()] || 'all';
  publicState.currency = ['ZMW', 'USD'].indexOf((query.get('currency') || '').toUpperCase()) !== -1
    ? query.get('currency').toUpperCase() : 'all';
  publicState.minPrice = query.get('minPrice') || '';
  publicState.maxPrice = query.get('maxPrice') || '';
  publicState.minBedrooms = query.get('minBedrooms') || query.get('bedrooms') || '';
  publicState.minBathrooms = query.get('minBathrooms') || query.get('bathrooms') || '';
  publicState.minSize = query.get('minSize') || '';
  publicState.features = query.getAll('feature').map(function (value) {
    return String(value || '').trim();
  }).filter(Boolean);
  publicState.publicStatus = {active: 'Active', 'under-offer': 'Under Offer'}[query.get('status')] || 'all';
  publicState.sort = ['newest', 'price-low', 'price-high', 'featured'].indexOf(query.get('sort')) !== -1
    ? query.get('sort') : 'newest';
  applyRouteLocationState();
  listingLocationDraft.locationQuery = publicState.locationText;
  listingLocationDraft.selectedLocation = publicState.selectedLocation;
}

function applyListingStateToUrl(url) {
  var route = parseListingRoute(url.pathname);
  var routePurpose = route.purpose;
  if (routePurpose !== 'all') publicState.purpose = routePurpose;
  if (route.isListingRoute) {
    url.pathname = listingBasePathForPurpose(publicState.purpose) +
      (publicState.routeLocationPath ? '/' + publicState.routeLocationPath : '');
  }
  var routeLocation = publicState.selectedLocation;
  var locationText = String(publicState.locationText || '').trim();
  var values = {
    category: publicState.category,
    purpose: routePurpose === 'all'
      ? publicState.purpose === 'For Sale' ? 'sale' : publicState.purpose === 'For Rent' ? 'rent' : 'all'
      : 'all',
    location: routeLocation ? '' : locationText,
    q: publicState.search,
    province: routeLocation ? 'all' : publicState.province,
    city: routeLocation ? 'all' : publicState.city,
    area: routeLocation ? 'all' : publicState.area,
    branch: publicState.branch,
    type: publicState.type.toLowerCase(),
    currency: publicState.currency,
    minPrice: publicState.minPrice,
    maxPrice: publicState.maxPrice,
    minBedrooms: publicState.minBedrooms,
    minBathrooms: publicState.minBathrooms,
    minSize: publicState.minSize,
    reference: publicState.reference,
    status: publicState.publicStatus.toLowerCase().replace(' ', '-'),
    sort: publicState.sort === 'newest' ? '' : publicState.sort
  };
  url.searchParams.delete('listingType');
  Object.keys(values).forEach(function (key) {
    if (values[key] === '' || values[key] === 'all') url.searchParams.delete(key);
    else url.searchParams.set(key, values[key]);
  });
  url.searchParams.delete('feature');
  publicState.features.forEach(function (feature) {
    url.searchParams.append('feature', feature);
  });
  return url;
}

function writeListingUrl(historyMethod) {
  var url = applyListingStateToUrl(new URL(window.location.href));
  if (url.href !== window.location.href) {
    if (url.pathname !== window.location.pathname) {
      window.location.assign(url.href);
      return true;
    }
    window.history[historyMethod === 'replace' ? 'replaceState' : 'pushState'](null, '', url.href);
  }
  return false;
}

function matchesListingLocation(property) {
  var selected = publicState.selectedLocation;
  if (selected) {
    if (selected.type === 'province') return String(property.province_id) === String(selected.provinceId);
    if (selected.type === 'city') return String(property.city_id) === String(selected.cityId);
    if (selected.type === 'suburb') return String(property.suburb_id) === String(selected.suburbId);
    return false;
  }
  var province = publicState.provinces.find(function (row) { return row.id === property.province_id; });
  var city = publicState.cities.find(function (row) {
    return row.id === property.city_id && row.province_id === property.province_id;
  });
  var locationNeedle = String(publicState.locationText || '').trim().toLowerCase().replace(/[-_]+/g, ' ');
  var matchesText = !locationNeedle || [
    property.area,
    property.full_address,
    province && province.name,
    city && city.name
  ].some(function (value) {
    return String(value || '').toLowerCase().replace(/[-_]+/g, ' ').indexOf(locationNeedle) !== -1;
  });
  return matchesText &&
    (publicState.province === 'all' || Boolean(province && province.slug === publicState.province)) &&
    (publicState.city === 'all' || Boolean(city && city.slug === publicState.city));
}

function listingAreaSources() {
  return publicState.properties.filter(function (property) {
    return property.area_slug && matchesListingLocation(property);
  });
}

function matchesListingArea(property) {
  if (publicState.selectedLocation) return true;
  if (publicState.area === 'all') return true;
  if (property.area_slug) return property.area_slug === publicState.area;
  return listingAreaSources().some(function (source) {
    return source.area_slug === publicState.area && property.area === source.area &&
      property.province_id && property.city_id &&
      property.province_id === source.province_id && property.city_id === source.city_id;
  });
}

function listingFilterError() {
  var integerFields = ['minBedrooms', 'minBathrooms'];
  var invalid = ['minPrice', 'maxPrice', 'minBedrooms', 'minBathrooms', 'minSize'].some(function (field) {
    var value = publicState[field];
    return value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 ||
      (integerFields.indexOf(field) !== -1 && !Number.isInteger(Number(value))));
  });
  if (invalid) return 'Use non-negative numbers for price and size, and whole numbers for bedrooms and bathrooms.';
  if ((publicState.minPrice !== '' || publicState.maxPrice !== '') && publicState.currency === 'all') {
    return 'Choose ZMW or USD to apply your price limits.';
  }
  if (publicState.minPrice !== '' && publicState.maxPrice !== '' && Number(publicState.minPrice) > Number(publicState.maxPrice)) {
    return 'Minimum price must not exceed maximum price.';
  }
  return '';
}

function renderListingOptions(id, options, label, selected) {
  var control = byId(id);
  if (!control) return;
  if (selected !== 'all' && !options.some(function (option) { return option.value === selected; })) {
    options.push({value: selected, label: selected + ' (unavailable in this location)'});
  }
  control.innerHTML = '<option value="all">' + escapeHtml(label) + '</option>' + options.map(function (option) {
    return '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + '</option>';
  }).join('');
  control.value = selected;
  syncListingDropdownSelect(control);
}

function syncListingLocationAutocomplete() {
  var input = byId('listingLocationInput');
  if (!input) return;
  input.value = listingLocationDraft.locationQuery;
  var mobileInput = byId('mobileLocationInput');
  if (mobileInput) mobileInput.value = listingLocationDraft.locationQuery;
}

function syncListingControls() {
  renderListingOptions('listingProvinceFilter', publicState.provinces.map(function (province) {
    return {value: province.slug, label: province.name};
  }), 'All Zambia', publicState.province);
  var selectedProvince = publicState.provinces.find(function (province) {
    return province.slug === publicState.province;
  });
  renderListingOptions('listingCityFilter', publicState.cities.filter(function (city) {
    return publicState.province === 'all' || (selectedProvince && city.province_id === selectedProvince.id);
  }).map(function (city) {
    return {value: city.slug, label: city.name};
  }), 'All cities', publicState.city);
  var areas = [];
  listingAreaSources().forEach(function (property) {
    if (!areas.some(function (area) { return area.value === property.area_slug; })) {
      areas.push({value: property.area_slug, label: property.area});
    }
  });
  areas.sort(function (first, second) { return first.label.localeCompare(second.label); });
  renderListingOptions('listingAreaFilter', areas, 'All areas', publicState.area);
  renderListingOptions('listingBranchFilter', publicState.branches.map(function (branch) {
    return {value: String(branch.id), label: branch.name};
  }), 'All branches', publicState.branch);
  Object.keys(listingControlFields).forEach(function (id) {
    var control = byId(id);
    if (control) control.value = publicState[listingControlFields[id]];
  });
  syncCanonicalListingDropdowns();
  syncListingLocationAutocomplete();
  syncListingMap();
  syncListingSearchUI();
}

function currentListingPurpose() {
  var routePurpose = listingPurposeFromPathname(window.location.pathname);
  return routePurpose === 'all' ? publicState.purpose : routePurpose;
}

function updateQuickFilterNavigation() {
  var track = byId('listingQuickFilters');
  var previous = byId('quickFilterPrevious');
  var next = byId('quickFilterNext');
  if (!track || !previous || !next) return;
  var maximum = Math.max(0, track.scrollWidth - track.clientWidth);
  var overflow = maximum > 2;
  previous.hidden = !overflow;
  next.hidden = !overflow;
  previous.disabled = !overflow || track.scrollLeft <= 2;
  next.disabled = !overflow || track.scrollLeft >= maximum - 2;
}

function syncListingSearchUI() {
  var purpose = currentListingPurpose();
  document.querySelectorAll('[data-listing-purpose]').forEach(function (button) {
    var selected = button.dataset.listingPurpose === purpose;
    button.setAttribute('aria-pressed', String(selected));
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  var purposeSelect = byId('listingPurposeFilter');
  if (purposeSelect && purpose !== 'all') purposeSelect.value = purpose;
  var mobileLocation = byId('mobileLocationInput');
  if (mobileLocation) mobileLocation.value = publicState.locationText;

  var priceValue = byId('priceValue') || byId('listingPriceSummary');
  if (priceValue) {
    var hasLimits = publicState.minPrice !== '' || publicState.maxPrice !== '';
    priceValue.textContent = hasLimits
      ? (publicState.currency === 'all' ? '' : publicState.currency + ' · ') +
        (publicState.maxPrice === '' ? 'No maximum' : Number(publicState.maxPrice).toLocaleString()) +
        (publicState.minPrice === '' ? '' : ' (min. ' + Number(publicState.minPrice).toLocaleString() + ')')
      : publicState.currency === 'all' ? 'No maximum' : publicState.currency + ' · No maximum';
  }

  document.querySelectorAll('input[name="feature"]').forEach(function (input) {
    input.checked = publicState.features.some(function (feature) {
      return feature.toLowerCase() === input.value.toLowerCase();
    });
  });

  var quickFilters = byId('listingQuickFilters');
  var typeFilter = byId('listingTypeFilter');
  if (quickFilters && typeFilter) {
    var labels = {House: 'Houses', Apartment: 'Apartments', Land: 'Land', Commercial: 'Commercial', Farm: 'Farms'};
    var available = publicState.properties.filter(function (property) {
      return purpose === 'all' || property.purpose === purpose;
    });
    var types = Array.from(typeFilter.options).filter(function (option) {
      return labels[option.value] && available.some(function (property) {
        return property.property_type === option.value;
      });
    });
    var signature = types.map(function (option) { return option.value; }).join('|');
    if (quickFilters.dataset.types !== signature) {
      quickFilters.dataset.types = signature;
      quickFilters.innerHTML = types.map(function (option) {
        return '<button class="quick-filter" type="button" data-listing-type="' + escapeHtml(option.value) + '">' + labels[option.value] + '</button>';
      }).join('');
    }
    quickFilters.hidden = !types.length;
    quickFilters.querySelectorAll('button').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.listingType === publicState.type));
    });
    window.requestAnimationFrame(updateQuickFilterNavigation);
  }

  var chips = byId('listingActiveFilters');
  if (!chips) return;
  var active = Object.keys(listingControlFields).filter(function (id) {
    var field = listingControlFields[id];
    if (publicState.routeLocationPath && (field === 'province' || field === 'city' || field === 'area')) return false;
    return Boolean(byId(id)) && field !== 'sort' && field !== 'purpose' && publicState[field] !== '' && publicState[field] !== 'all';
  });
  chips.hidden = !active.length && !publicState.features.length && publicState.category === 'all';
  chips.innerHTML = active.map(function (id) {
    var control = byId(id);
    var field = listingControlFields[id];
    var label = control.tagName === 'SELECT' && control.selectedIndex >= 0
      ? control.options[control.selectedIndex].text
      : control.value;
    if (field === 'minPrice') label = 'Min: ' + label;
    if (field === 'maxPrice') label = 'Max: ' + label;
    if (field === 'minBedrooms') label += ' bedrooms';
    if (field === 'minBathrooms') label += ' bathrooms';
    if (field === 'minSize') label += ' m² minimum';
    if (field === 'reference') label = 'Reference: ' + label;
    if (field === 'search') label = 'Search: ' + label;
    return '<button type="button" data-clear-control="' + id + '" aria-label="Remove ' + escapeHtml(label) + '">' +
      escapeHtml(label) + ' <span aria-hidden="true">×</span></button>';
  }).join('') + publicState.features.map(function (feature) {
    return '<button type="button" data-clear-feature="' + escapeHtml(feature) + '">' + escapeHtml(feature) + ' <span aria-hidden="true">×</span></button>';
  }).join('') + (publicState.category !== 'all'
    ? '<button type="button" data-clear-category>Category: ' + escapeHtml(publicState.category) + ' <span aria-hidden="true">×</span></button>'
    : '') + '<button type="button" class="listing-clear-all" data-clear-all>Clear all</button>';
}

function setListingPanel(id, open, returnFocus) {
  var panel = byId(id);
  var trigger = document.querySelector('[aria-controls="' + id + '"]');
  if (!panel || !trigger) return;
  panel.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
  if (returnFocus) trigger.focus();
}

function bindListingSearchUI() {
  if (!byId('listingMoreToggle')) return;
  ['listingPricePanel', 'listingMorePanel', 'listingMapPanel'].forEach(function (id) {
    var trigger = document.querySelector('[aria-controls="' + id + '"]');
    trigger.addEventListener('click', function () {
      var open = byId(id).hidden;
      ['listingPricePanel', 'listingMorePanel', 'listingMapPanel'].forEach(function (other) {
        setListingPanel(other, other === id && open, false);
      });
      if (open) {
        var firstControl = byId(id).querySelector('input, select, button');
        if (firstControl) firstControl.focus({preventScroll: true});
      }
    });
    byId(id).addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setListingPanel(id, false, true);
      }
    });
  });
  document.querySelectorAll('[data-close-panel]').forEach(function (button) {
    button.addEventListener('click', function () {
      setListingPanel(button.dataset.closePanel, false, true);
    });
  });
  function changeControl(id, value) {
    var control = byId(id);
    control.value = value;
    control.dispatchEvent(new Event(control.type === 'search' ? 'input' : 'change', {bubbles: true}));
  }
  document.querySelectorAll('[data-listing-purpose]').forEach(function (button) {
    button.addEventListener('click', function () {
      var purpose = normalizeListingPurpose(button.dataset.listingPurpose);
      if (purpose !== 'all') {
        navigateToDedicatedListings(purpose);
        return;
      }
      if (listingPurposeFromPathname(window.location.pathname) !== 'all') {
        var target = new URL('/listings', window.location.href);
        target.search = window.location.search;
        target.searchParams.delete('listingType');
        target.searchParams.delete('purpose');
        window.location.assign(target.href);
        return;
      }
      changeControl('listingPurposeFilter', 'all');
    });
  });
  byId('listingQuickFilters').addEventListener('click', function (event) {
    var button = event.target.closest('[data-listing-type]');
    if (button) {
      changeControl('listingTypeFilter', publicState.type === button.dataset.listingType ? 'all' : button.dataset.listingType);
    }
  });
  byId('listingActiveFilters').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-clear-all')) {
      Object.keys(listingControlFields).forEach(function (id) {
        var field = listingControlFields[id];
        if (field !== 'sort') {
          publicState[field] = ['search', 'minPrice', 'maxPrice', 'minBedrooms'].indexOf(field) !== -1 ? '' : 'all';
        }
      });
      publicState.category = 'all';
    } else if (button.hasAttribute('data-clear-category')) {
      publicState.category = 'all';
    } else {
      var field = listingControlFields[button.dataset.clearControl];
      publicState[field] = ['search', 'minPrice', 'maxPrice', 'minBedrooms'].indexOf(field) !== -1 ? '' : 'all';
    }
    writeListingUrl();
    renderListingsPage();
    var next = byId('listingActiveFilters').querySelector('button');
    if (!byId('listingActiveFilters').hidden && next) next.focus();
    else byId('listingProvinceFilter').focus();
  });
  function showProperties() {
    ['listingPricePanel', 'listingMorePanel', 'listingMapPanel'].forEach(function (id) {
      setListingPanel(id, false, false);
    });
    if (navigateToDedicatedListings(publicState.purpose)) return;
    byId('listingResultsHeading').focus({preventScroll: true});
    byId('listingResultsHeading').scrollIntoView({
      block: 'start',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }
  byId('listingShowProperties').addEventListener('click', showProperties);
  byId('listingMapView').addEventListener('click', showProperties);
}

function readCanonicalListingControls() {
  Object.keys(listingControlFields).forEach(function (id) {
    var control = byId(id);
    if (!control) return;
    publicState[listingControlFields[id]] = String(control.value || '').trim();
  });
  publicState.features = Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(function (input) {
    return input.value;
  });
  publicState.locationText = listingLocationDraft.locationQuery;
  publicState.selectedLocation = listingLocationDraft.selectedLocation;
  publicState.routeLocationPath = canonicalLocationPath(publicState.selectedLocation);
  if (publicState.selectedLocation) {
    applyRouteLocationState();
  } else {
    publicState.city = 'all';
    publicState.province = 'all';
    publicState.area = 'all';
  }
}

function setCanonicalListingDialog(open, returnFocus) {
  var dialog = byId('listingFiltersDialog');
  if (!dialog) return;
  var locationField = document.querySelector('.listing-location-field');
  var mobilePrimaryFilters = byId('mobilePrimaryFilters');
  var typeSlot = byId('typeSlot');
  if (locationField) {
    if (open && window.innerWidth <= 900 && mobilePrimaryFilters) {
      mobilePrimaryFilters.appendChild(locationField);
    } else if ((!open || window.innerWidth > 900) && typeSlot && typeSlot.parentNode) {
      typeSlot.parentNode.insertBefore(locationField, typeSlot);
    }
  }
  if (open && !dialog.open) {
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  } else if (!open && dialog.open) {
    dialog.close();
    document.body.style.overflow = '';
    if (returnFocus) {
      var trigger = window.innerWidth <= 900 ? byId('mobileFiltersButton') : byId('moreFiltersButton');
      if (trigger) trigger.focus();
    }
  }
  [byId('mobileFiltersButton'), byId('moreFiltersButton')].forEach(function (trigger) {
    if (trigger) trigger.setAttribute('aria-expanded', String(open));
  });
}

function showListingsPreviewToast(message) {
  var toast = byId('previewToast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showListingsPreviewToast.timer);
  showListingsPreviewToast.timer = window.setTimeout(function () {
    toast.hidden = true;
  }, 3500);
}

var canonicalListingDropdowns = [];

function listingDropdownChevronMarkup() {
  return '<span class="listing-dropdown__chevron" aria-hidden="true"><svg class="ui-arrow ui-arrow--down" aria-hidden="true" focusable="false"><use href="#icon-chevron"></use></svg></span>';
}

function listingDropdownPropertyIconMarkup() {
  return '<span class="listing-dropdown__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z"></path><path d="M9 21V12h6v9"></path></svg></span>';
}

function syncListingDropdownSelect(select) {
  if (select && typeof select._listingDropdownSync === 'function') select._listingDropdownSync();
}

function syncCanonicalListingDropdowns() {
  document.querySelectorAll('select[data-listing-dropdown]').forEach(syncListingDropdownSelect);
}

function bindListingSelectDropdowns() {
  document.querySelectorAll('select[data-listing-dropdown]').forEach(function (select) {
    if (select.dataset.listingDropdownBound === 'true') return;
    select.dataset.listingDropdownBound = 'true';

    var wrapper = document.createElement('div');
    wrapper.className = 'listing-dropdown ' + (select.dataset.dropdownClass || '');
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.hidden = true;

    var trigger = document.createElement('button');
    var menu = document.createElement('div');
    var value = document.createElement('span');
    var triggerId = select.id + 'Trigger';
    var menuId = select.id + 'Menu';
    var label = select.dataset.dropdownLabel || select.getAttribute('aria-label') || 'Choose an option';

    trigger.className = 'listing-dropdown__trigger';
    trigger.id = triggerId;
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');
    if (select.dataset.dropdownIcon === 'property') trigger.insertAdjacentHTML('beforeend', listingDropdownPropertyIconMarkup());
    value.className = 'listing-dropdown__label';
    trigger.appendChild(value);
    trigger.insertAdjacentHTML('beforeend', listingDropdownChevronMarkup());

    menu.className = 'listing-dropdown__menu';
    menu.id = menuId;
    menu.hidden = true;
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', label);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    var closeTimer = null;
    var openFrame = null;

    function selectedOption() {
      return select.options[select.selectedIndex] || select.options[0] || null;
    }

    function sync() {
      var option = selectedOption();
      var text = option ? option.textContent : label;
      value.textContent = text;
      trigger.setAttribute('aria-label', label + ': ' + text);
      menu.querySelectorAll('[role="option"]').forEach(function (button, index) {
        button.setAttribute('aria-selected', String(index === select.selectedIndex));
      });
    }

    function renderOptions() {
      menu.innerHTML = Array.from(select.options).map(function (option, index) {
        return '<button class="listing-dropdown__option" id="' + menuId + '-option-' + index + '" type="button" role="option" aria-selected="' + (index === select.selectedIndex) + '" data-listing-dropdown-index="' + index + '"' + (option.disabled ? ' disabled' : '') + '><span>' + escapeHtml(option.textContent) + '</span></button>';
      }).join('');
    }

    function positionMenu() {
      menu.classList.remove('opens-upward');
      var triggerRect = trigger.getBoundingClientRect();
      var menuRect = menu.getBoundingClientRect();
      var roomBelow = window.innerHeight - triggerRect.bottom - 12;
      var roomAbove = triggerRect.top - 12;
      if (menuRect.height > roomBelow && roomAbove > roomBelow) menu.classList.add('opens-upward');
    }

    function finishClose() {
      menu.hidden = true;
      menu.classList.remove('is-open', 'is-closing', 'opens-upward');
      wrapper.classList.remove('is-open');
      closeTimer = null;
    }

    function closeMenu(returnFocus) {
      if (trigger.getAttribute('aria-expanded') !== 'true' && menu.hidden) return;
      window.clearTimeout(closeTimer);
      if (openFrame) window.cancelAnimationFrame(openFrame);
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open');
      menu.classList.remove('is-open');
      menu.classList.add('is-closing');
      if (returnFocus) trigger.focus();
      if (prefersReducedMotion()) finishClose();
      else closeTimer = window.setTimeout(finishClose, 140);
    }

    function openMenu(focusPosition) {
      document.dispatchEvent(new CustomEvent('listing-dropdown-opening', {detail: menu.id}));
      window.clearTimeout(closeTimer);
      if (openFrame) window.cancelAnimationFrame(openFrame);
      renderOptions();
      menu.hidden = false;
      menu.classList.remove('is-open', 'is-closing');
      wrapper.classList.add('is-open');
      positionMenu();
      trigger.setAttribute('aria-expanded', 'true');
      openFrame = window.requestAnimationFrame(function () {
        menu.classList.add('is-open');
        openFrame = null;
      });
      if (focusPosition) {
        var buttons = menu.querySelectorAll('[role="option"]:not(:disabled)');
        if (!buttons.length) return;
        var selected = menu.querySelector('[aria-selected="true"]:not(:disabled)');
        if (focusPosition === 'last') buttons[buttons.length - 1].focus();
        else (selected || buttons[0]).focus();
      }
    }

    function choose(index) {
      var option = select.options[index];
      if (!option || option.disabled) return;
      select.value = option.value;
      sync();
      select.dispatchEvent(new Event('change', {bubbles: true}));
      closeMenu(true);
    }

    trigger.addEventListener('click', function () {
      if (trigger.getAttribute('aria-expanded') === 'true') closeMenu();
      else openMenu();
    });
    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openMenu(event.key === 'ArrowUp' ? 'last' : 'selected');
      }
    });
    menu.addEventListener('click', function (event) {
      var option = event.target.closest('[data-listing-dropdown-index]');
      if (option) choose(Number(option.dataset.listingDropdownIndex));
    });
    menu.addEventListener('keydown', function (event) {
      var current = event.target.closest('[data-listing-dropdown-index]');
      if (!current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key === 'Tab') {
        closeMenu();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        choose(Number(current.dataset.listingDropdownIndex));
        return;
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(event.key) === -1) return;
      event.preventDefault();
      var buttons = Array.from(menu.querySelectorAll('[role="option"]:not(:disabled)'));
      var currentIndex = buttons.indexOf(current);
      var nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        event.key === 'ArrowDown' ? (currentIndex + 1) % buttons.length :
          (currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1);
      buttons[nextIndex].focus();
    });
    document.addEventListener('listing-dropdown-opening', function (event) {
      if (event.detail !== menu.id) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (trigger.getAttribute('aria-expanded') === 'true') positionMenu();
    }, {passive: true});

    select._listingDropdownSync = sync;
    select.addEventListener('change', sync);
    canonicalListingDropdowns.push({id: menu.id, wrapper: wrapper, close: closeMenu});
    sync();
  });

  if (document.body.dataset.listingDropdownEventsBound !== 'true') {
    document.body.dataset.listingDropdownEventsBound = 'true';
    document.addEventListener('pointerdown', function (event) {
      if (event.target.closest('.listing-dropdown')) return;
      canonicalListingDropdowns.forEach(function (dropdown) { dropdown.close(); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      canonicalListingDropdowns.forEach(function (dropdown) { dropdown.close(true); });
    });
  }
}

function bindListingLocationAutocomplete() {
  var input = byId('listingLocationInput');
  var menu = byId('listingLocationResults');
  var status = byId('listingLocationStatus');
  var mobileInput = byId('mobileLocationInput');
  if (!input || !menu || input.dataset.bound === 'true') return;

  input.dataset.bound = 'true';
  var field = input.closest('.listing-location-field');
  var control = input.closest('.listing-location-control');
  var closeTimer = null;
  var openFrame = null;
  var debounceTimer = null;
  var requestSequence = 0;
  var results = [];
  var resultsTerm = '';
  var activeIndex = -1;
  var loading = false;
  var resultMessage = '';

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function renderOptions() {
    var items = results.map(function (location, index) {
      return '<button class="listing-location-option" id="listing-location-option-' + index + '" type="button" role="option" tabindex="-1" aria-selected="' + (index === activeIndex) + '" data-listing-location-index="' + index + '" data-location-type="' + escapeHtml(location.type) + '">' +
        '<span class="listing-location-option__text"><span class="listing-location-option__label">' + escapeHtml(listingLocationDisplayName(location)) + '</span>' +
        '<span class="listing-location-option__context">' + escapeHtml(discoveryLocationContext(location)) + '</span></span></button>';
    });
    if (loading) items.push('<div class="listing-location-message">Searching locations…</div>');
    else if (resultMessage) items.push('<div class="listing-location-message">' + escapeHtml(resultMessage) + '</div>');
    menu.innerHTML = items.join('');
    if (activeIndex >= 0 && results[activeIndex]) {
      input.setAttribute('aria-activedescendant', 'listing-location-option-' + activeIndex);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function positionMenu() {
    menu.classList.remove('opens-upward');
    var triggerRect = control.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var roomBelow = window.innerHeight - triggerRect.bottom - 8;
    var roomAbove = triggerRect.top - 8;
    if (menuRect.height > roomBelow && roomAbove > roomBelow) menu.classList.add('opens-upward');
  }

  function finishClose() {
    menu.hidden = true;
    menu.classList.remove('is-open', 'is-closing', 'opens-upward');
    if (field) field.classList.remove('is-menu-open');
    closeTimer = null;
  }

  function closeMenu(returnFocus) {
    if (input.getAttribute('aria-expanded') !== 'true' && menu.hidden) return;
    window.clearTimeout(closeTimer);
    if (openFrame) window.cancelAnimationFrame(openFrame);
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    if (field) field.classList.remove('is-menu-open');
    menu.classList.remove('is-open');
    menu.classList.add('is-closing');
    if (returnFocus) input.focus();
    if (prefersReducedMotion()) finishClose();
    else closeTimer = window.setTimeout(finishClose, 150);
  }

  function openMenu() {
    if (!loading && !results.length && !resultMessage) return;
    document.dispatchEvent(new CustomEvent('listing-dropdown-opening', {detail: menu.id}));
    window.clearTimeout(closeTimer);
    if (openFrame) window.cancelAnimationFrame(openFrame);
    renderOptions();
    menu.hidden = false;
    menu.classList.remove('is-open', 'is-closing');
    if (field) field.classList.add('is-menu-open');
    positionMenu();
    input.setAttribute('aria-expanded', 'true');
    openFrame = window.requestAnimationFrame(function () {
      menu.classList.add('is-open');
      openFrame = null;
    });
  }

  function choose(index) {
    var location = results[index];
    if (!location) return;
    window.clearTimeout(debounceTimer);
    requestSequence += 1;
    listingLocationDraft.selectedLocation = location;
    listingLocationDraft.locationQuery = listingLocationDisplayName(location);
    input.value = listingLocationDraft.locationQuery;
    if (mobileInput) mobileInput.value = listingLocationDraft.locationQuery;
    input.removeAttribute('aria-invalid');
    setStatus(listingLocationDraft.locationQuery + ' selected.');
    closeMenu(true);
  }

  function invalidatePendingSearch() {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
    requestSequence += 1;
  }

  async function requestLocations(term, sequence) {
    if (sequence !== requestSequence) return;
    var supabase = getSupabaseClient();
    if (!supabase || typeof supabase.rpc !== 'function') {
      resultMessage = 'Location suggestions are unavailable.';
      setStatus(resultMessage);
      openMenu();
      return;
    }
    loading = true;
    resultMessage = '';
    renderOptions();
    openMenu();
    try {
      var response = await supabase.rpc('search_locations', {search_term: term, result_limit: 8});
      if (sequence !== requestSequence || input.value.trim() !== term) return;
      if (response.error) throw response.error;
      results = normalizeLocationSearchResults(response.data);
      resultsTerm = term;
      activeIndex = -1;
      loading = false;
      resultMessage = results.length ? '' : 'No locations found.';
      setStatus(results.length + ' location suggestion' + (results.length === 1 ? '' : 's') + ' available.');
      renderOptions();
      openMenu();
    } catch (error) {
      if (sequence !== requestSequence) return;
      results = [];
      resultsTerm = term;
      activeIndex = -1;
      loading = false;
      resultMessage = 'Location suggestions are unavailable.';
      setStatus(resultMessage);
      renderOptions();
      openMenu();
    }
  }

  function scheduleSearch() {
    var term = input.value.trim();
    invalidatePendingSearch();
    results = [];
    resultsTerm = '';
    activeIndex = -1;
    loading = false;
    resultMessage = '';
    if (term.length < 2) {
      closeMenu();
      setStatus(term.length ? 'Type at least 2 characters for location suggestions.' : '');
      return;
    }
    var sequence = requestSequence;
    debounceTimer = window.setTimeout(function () {
      debounceTimer = null;
      requestLocations(term, sequence);
    }, 250);
  }

  function moveActive(direction) {
    if (!results.length) return;
    if (menu.hidden || input.getAttribute('aria-expanded') !== 'true') openMenu();
    if (activeIndex < 0) activeIndex = direction > 0 ? 0 : results.length - 1;
    else activeIndex = (activeIndex + direction + results.length) % results.length;
    renderOptions();
  }

  input.addEventListener('focus', function () {
    if (listingLocationDraft.selectedLocation) return;
    if (results.length && resultsTerm === input.value.trim()) openMenu();
    else if (input.value.trim().length >= 2) scheduleSearch();
  });
  input.addEventListener('input', function () {
    listingLocationDraft.locationQuery = input.value;
    if (listingLocationDraft.selectedLocation && input.value !== listingLocationDisplayName(listingLocationDraft.selectedLocation)) {
      listingLocationDraft.selectedLocation = null;
    }
    if (mobileInput) mobileInput.value = input.value;
    input.removeAttribute('aria-invalid');
    scheduleSearch();
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      invalidatePendingSearch();
      closeMenu();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return;
      event.preventDefault();
      moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0 && input.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      choose(activeIndex);
    }
  });
  menu.addEventListener('click', function (event) {
    var option = event.target.closest('[data-listing-location-index]');
    if (option) choose(Number(option.dataset.listingLocationIndex));
  });
  document.addEventListener('pointerdown', function (event) {
    if (!event.target.closest('.listing-location-field')) {
      invalidatePendingSearch();
      closeMenu();
    }
  });
  document.addEventListener('listing-dropdown-opening', function (event) {
    if (event.detail !== menu.id) {
      invalidatePendingSearch();
      closeMenu();
    }
  });
  window.addEventListener('resize', function () {
    if (input.getAttribute('aria-expanded') === 'true') positionMenu();
  }, {passive: true});
}

function bindCanonicalListingsPresentation() {
  if (!document.body.classList.contains('listings-page-v2') || !byId('listingSearchForm')) return;
  bindCanonicalListingGalleries();
  var form = byId('listingSearchForm');
  var dialog = byId('listingFiltersDialog');
  var requestDialog = byId('requestDialog');
  var requestOpener = null;
  bindListingSelectDropdowns();
  bindListingLocationAutocomplete();

  function applyDraft(options) {
    var locationInput = byId('listingLocationInput');
    if (listingLocationDraft.locationQuery.trim() && !listingLocationDraft.selectedLocation) {
      locationInput.setAttribute('aria-invalid', 'true');
      byId('listingLocationStatus').textContent = 'Select a location from the suggestions.';
      var message = byId('listingFilterMessage');
      if (message) message.textContent = 'Select a location from the suggestions.';
      locationInput.focus();
      return;
    }
    readCanonicalListingControls();
    var target = applyListingStateToUrl(new URL(
      listingBasePathForPurpose(publicState.purpose) + (publicState.routeLocationPath ? '/' + publicState.routeLocationPath : ''),
      window.location.href
    ));
    if (target.pathname !== window.location.pathname) {
      window.location.assign(target.href);
      return;
    }
    if (target.href !== window.location.href) window.history.pushState(null, '', target.href);
    renderListingsPage();
    if (options && options.closeFilters) setCanonicalListingDialog(false, true);
    if (options && options.scroll) {
      var heading = byId('listingPageTitle');
      if (heading) heading.scrollIntoView({block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
    }
  }

  function updateDraftPriceLabel() {
    var minimum = byId('listingMinPriceFilter').value;
    var maximum = byId('listingMaxPriceFilter').value;
    var currency = byId('listingCurrencyFilter').value;
    var priceValue = byId('priceValue');
    if (!priceValue) return;
    var prefix = currency === 'ZMW' ? 'K' : currency === 'USD' ? '$' : '';
    var formatAmount = function (value) {
      return prefix + Number(value).toLocaleString('en-ZM');
    };
    if (minimum && maximum) priceValue.textContent = formatAmount(minimum) + ' – ' + formatAmount(maximum);
    else if (maximum) priceValue.textContent = 'Up to ' + formatAmount(maximum);
    else if (minimum) priceValue.textContent = 'From ' + formatAmount(minimum);
    else priceValue.textContent = currency === 'all' ? 'No maximum' : currency + ' · No maximum';
  }

  function ensureDraftPriceCurrency() {
    var currency = byId('listingCurrencyFilter');
    var hasPrice = byId('listingMinPriceFilter').value || byId('listingMaxPriceFilter').value;
    if (!hasPrice || currency.value !== 'all') return;
    currency.value = 'ZMW';
    syncListingDropdownSelect(currency);
  }

  document.querySelectorAll('.discovery-transactions [data-listing-purpose]').forEach(function (button) {
    button.addEventListener('click', function () {
      var purpose = normalizeListingPurpose(button.dataset.listingPurpose);
      if (purpose === 'all') return;
      byId('listingPurposeFilter').value = purpose;
      document.querySelectorAll('.discovery-transactions [data-listing-purpose]').forEach(function (choice) {
        choice.setAttribute('aria-pressed', String(choice === button));
      });
    });
  });
  document.querySelectorAll('.site-nav [data-listing-purpose]').forEach(function (button) {
    button.addEventListener('click', function () {
      var purpose = normalizeListingPurpose(button.dataset.listingPurpose);
      if (purpose !== 'all') window.location.assign(listingBasePathForPurpose(purpose));
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    applyDraft({scroll: true});
  });
  byId('applyFilters').addEventListener('click', function () {
    applyDraft({closeFilters: true, scroll: true});
  });
  byId('listingSortSelect').addEventListener('change', function () {
    publicState.sort = byId('listingSortSelect').value;
    writeListingUrl();
    renderListingsPage();
  });
  byId('listingQuickFilters').addEventListener('click', function (event) {
    var button = event.target.closest('[data-listing-type]');
    if (!button) return;
    publicState.type = publicState.type === button.dataset.listingType ? 'all' : button.dataset.listingType;
    byId('listingTypeFilter').value = publicState.type;
    syncListingDropdownSelect(byId('listingTypeFilter'));
    writeListingUrl();
    renderListingsPage();
  });

  byId('listingActiveFilters').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-clear-all')) {
      form.reset();
      listingLocationDraft.locationQuery = '';
      listingLocationDraft.selectedLocation = null;
      publicState.category = 'all';
      document.querySelectorAll('input[name="feature"]').forEach(function (input) { input.checked = false; });
    } else if (button.hasAttribute('data-clear-category')) {
      publicState.category = 'all';
    } else if (button.hasAttribute('data-clear-feature')) {
      document.querySelectorAll('input[name="feature"]').forEach(function (input) {
        if (input.value === button.dataset.clearFeature) input.checked = false;
      });
    } else {
      var control = byId(button.dataset.clearControl);
      if (control) control.value = control.tagName === 'SELECT' ? (control.querySelector('option[value="all"]') ? 'all' : '') : '';
      if (button.dataset.clearControl === 'listingLocationInput') {
        listingLocationDraft.locationQuery = '';
        listingLocationDraft.selectedLocation = null;
      }
    }
    applyDraft();
  });

  byId('resetFilters').addEventListener('click', function () {
    form.reset();
    listingLocationDraft.locationQuery = '';
    listingLocationDraft.selectedLocation = null;
    publicState.category = 'all';
    document.querySelectorAll('input[name="feature"]').forEach(function (input) { input.checked = false; });
    applyDraft({closeFilters: true});
  });
  [byId('moreFiltersButton'), byId('mobileFiltersButton')].forEach(function (button) {
    if (button) button.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('listing-dropdown-opening', {detail: 'listingFiltersDialog'}));
      byId('priceField').open = false;
      setCanonicalListingDialog(true);
    });
  });
  byId('closeFilters').addEventListener('click', function () { setCanonicalListingDialog(false, true); });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = '';
    [byId('mobileFiltersButton'), byId('moreFiltersButton')].forEach(function (trigger) {
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  });
  dialog.addEventListener('click', function (event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
      setCanonicalListingDialog(false, true);
    }
  });

  byId('mobileLocationInput').addEventListener('input', function (event) {
    byId('listingLocationInput').value = event.target.value;
    listingLocationDraft.locationQuery = event.target.value;
    if (listingLocationDraft.selectedLocation && event.target.value !== listingLocationDisplayName(listingLocationDraft.selectedLocation)) {
      listingLocationDraft.selectedLocation = null;
    }
  });
  byId('listingCityFilter').addEventListener('change', function (event) {
    var option = event.target.options[event.target.selectedIndex];
    var value = event.target.value === 'all' ? '' : option.text;
    byId('listingLocationInput').value = value;
    byId('mobileLocationInput').value = value;
    listingLocationDraft.locationQuery = value;
    var city = publicState.cities.find(function (row) { return row.slug === event.target.value; });
    var province = city && publicState.provinces.find(function (row) { return String(row.id) === String(city.province_id); });
    listingLocationDraft.selectedLocation = city ? normalizeLocationSearchResult({
      id: city.id,
      type: 'city',
      name: city.name,
      slug: city.slug,
      province_id: province && province.id,
      province_name: province && province.name,
      province_slug: province && province.slug,
      city_id: city.id,
      city_name: city.name,
      city_slug: city.slug,
      canonical_path: city.slug
    }) : null;
  });
  ['listingMinPriceFilter', 'listingMaxPriceFilter'].forEach(function (id) {
    byId(id).addEventListener('input', function () {
      ensureDraftPriceCurrency();
      updateDraftPriceLabel();
    });
  });
  byId('listingCurrencyFilter').addEventListener('change', updateDraftPriceLabel);
  byId('priceField').addEventListener('toggle', function () {
    var open = byId('priceField').open;
    byId('priceSummary').setAttribute('aria-expanded', String(open));
    if (open) document.dispatchEvent(new CustomEvent('listing-dropdown-opening', {detail: 'priceField'}));
  });
  byId('priceField').addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      byId('priceField').open = false;
      byId('priceSummary').focus();
    } else if (event.key === 'Enter' && event.target.matches('input')) {
      event.preventDefault();
      byId('priceField').open = false;
      byId('priceSummary').focus();
    }
  });
  document.addEventListener('listing-dropdown-opening', function (event) {
    var openingMenu = byId(event.detail);
    if (event.detail !== 'priceField' && (!openingMenu || !byId('priceField').contains(openingMenu))) {
      byId('priceField').open = false;
    }
  });
  document.addEventListener('pointerdown', function (event) {
    if (!event.target.closest('#priceField')) byId('priceField').open = false;
  });

  document.addEventListener('click', function (event) {
    var requestTrigger = event.target.closest('.request-trigger');
    if (requestTrigger && requestDialog) {
      requestOpener = requestTrigger;
      requestDialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    var preview = event.target.closest('[data-preview]');
    if (preview) showListingsPreviewToast(preview.dataset.preview + ' is not connected yet.');
    var save = event.target.closest('.save-property');
    if (save) {
      event.preventDefault();
      event.stopPropagation();
      save.setAttribute('aria-pressed', String(save.getAttribute('aria-pressed') !== 'true'));
    }
  });
  if (requestDialog) {
    requestDialog.querySelector('.dialog-close').addEventListener('click', function () { requestDialog.close(); });
    requestDialog.addEventListener('close', function () {
      document.body.style.overflow = '';
      if (requestOpener) requestOpener.focus();
    });
    byId('requestForm').addEventListener('submit', function (event) {
      event.preventDefault();
      requestDialog.close();
      showListingsPreviewToast('Preview only — no request has been sent.');
    });
  }

  var nav = byId('siteNav');
  var navToggle = byId('navToggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (dialog.open) setCanonicalListingDialog(false, true);
    if (requestDialog && requestDialog.open) requestDialog.close();
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });

  var sortControl = byId('listingSortSelect').closest('.sort-control');
  var resultsTools = document.querySelector('.results-header-tools');
  var headerInner = document.querySelector('.header-inner');
  function positionSortControl() {
    (window.innerWidth <= 900 ? resultsTools : headerInner).appendChild(sortControl);
  }
  positionSortControl();
  window.addEventListener('resize', positionSortControl, {passive: true});

  [
    [byId('quickFilterPrevious'), -1],
    [byId('quickFilterNext'), 1]
  ].forEach(function (entry) {
    entry[0].addEventListener('click', function () {
      byId('listingQuickFilters').scrollBy({left: entry[1] * 180, behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
      window.requestAnimationFrame(updateQuickFilterNavigation);
    });
  });
  byId('listingQuickFilters').addEventListener('scroll', updateQuickFilterNavigation, {passive: true});
  window.addEventListener('resize', updateQuickFilterNavigation, {passive: true});
}

function syncListingMap() {
  var holder = byId('listingMapHolder');
  if (!holder) return;
  var selectedProvince = byId('discoveryForm') ? discoverySearchState.province : publicState.province;
  holder.querySelectorAll('[data-province]').forEach(function (path) {
    path.setAttribute('aria-pressed', String(path.dataset.province === selectedProvince));
  });
  var province = publicState.provinces.find(function (item) {
    return item.slug === selectedProvince;
  });
  var selection = byId('listingMapSelection');
  if (selection) {
    selection.textContent = selectedProvince === 'all'
      ? 'All Zambia'
      : province ? province.name : selectedProvince;
  }
}

function selectListingProvince(slug) {
  if (byId('discoveryForm')) {
    discoverySearchState.province = slug;
    discoverySearchState.city = 'all';
    discoverySearchState.area = 'all';
    discoverySearchState.location = '';
    syncDiscoveryControls();
    return;
  }
  if (document.body.classList.contains('listings-page-v2')) {
    var province = publicState.provinces.find(function (row) { return row.slug === slug; });
    listingLocationDraft.selectedLocation = province ? normalizeLocationSearchResult({
      id: province.id,
      type: 'province',
      name: province.name,
      slug: province.slug,
      province_id: province.id,
      province_name: province.name,
      province_slug: province.slug,
      canonical_path: province.slug + '-province'
    }) : null;
    listingLocationDraft.locationQuery = listingLocationDisplayName(listingLocationDraft.selectedLocation);
    syncListingLocationAutocomplete();
    byId('listingProvinceFilter').value = slug;
    byId('listingCityFilter').value = 'all';
    byId('listingAreaFilter').value = 'all';
    return;
  }
  publicState.province = slug;
  publicState.city = 'all';
  publicState.area = 'all';
  publicState.locationText = '';
  writeListingUrl();
  syncListingControls();
  renderListings();
}

async function loadListingMap() {
  var holder = byId('listingMapHolder');
  if (!holder) return;
  try {
    var response = await fetch('assets/zambia-provinces.json');
    if (!response.ok) throw new Error('Map unavailable');
    var regions = await response.json();
    if (!Array.isArray(regions) || regions.length !== 10) throw new Error('Invalid map');
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '290 110 860 750');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Choose a Zambia province');
    regions.forEach(function (region) {
      var path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', region.d);
      path.setAttribute('id', 'province-' + region.map_key);
      path.setAttribute('class', 'listing-province-path');
      path.dataset.province = region.slug;
      path.setAttribute('role', 'button');
      path.setAttribute('tabindex', '0');
      path.setAttribute('aria-label', 'View properties in ' + region.name + ' Province');
      path.addEventListener('click', function () {
        selectListingProvince(region.slug);
      });
      path.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectListingProvince(region.slug);
        }
      });
      svg.appendChild(path);
    });
    regions.forEach(function (region) {
      var label = document.createElementNS(namespace, 'text');
      label.setAttribute('x', region.label[0]);
      label.setAttribute('y', region.label[1]);
      label.setAttribute('class', 'listing-map-label');
      label.setAttribute('aria-hidden', 'true');
      label.textContent = region.name;
      svg.appendChild(label);
    });
    holder.replaceChildren(svg);
    syncListingMap();
  } catch (error) {
    holder.textContent = 'The map could not load. Please use the province selector.';
  } finally {
    holder.setAttribute('aria-busy', 'false');
  }
}

function bindListingControls() {
  if (!byId('listingsGrid')) return;
  readListingUrl();
  if (document.body.classList.contains('listings-page-v2')) {
    bindCanonicalListingsPresentation();
    applyCategoryPageContent(listingCategoryContent[publicState.category]);
    var loading = byId('listingsLoading');
    var purpose = currentListingPurpose();
    if (loading) loading.textContent = 'Loading properties ' + (purpose === 'For Rent' ? 'for rent' : purpose === 'For Sale' ? 'for sale' : '') + '…';
  } else {
    bindListingSearchUI();
    var allZambia = byId('listingAllZambia');
    if (allZambia) allZambia.addEventListener('click', function () {
      selectListingProvince('all');
    });
    if (byId('listingMapHolder')) loadListingMap();
    Object.keys(listingControlFields).forEach(function (id) {
      var control = byId(id);
      if (!control) return;
      control.addEventListener(control.type === 'search' ? 'input' : 'change', function () {
        publicState[listingControlFields[id]] = control.type === 'search' ? control.value : control.value.trim();
        writeListingUrl();
        syncListingControls();
        renderListings();
      });
    });
  }
  window.addEventListener('popstate', function () {
    var nextRoute = parseListingRoute(window.location.pathname);
    if (nextRoute.locationPath !== publicState.routeLocationPath) {
      window.location.reload();
      return;
    }
    readListingUrl();
    renderListingsPage();
  });
}

function filteredListings(options) {
  if (listingFilterError() || publicState.invalidLocationPath) return [];
  var ignorePurpose = Boolean(options && options.ignorePurpose);
  var routePurpose = listingPurposeFromPathname(window.location.pathname);
  var effectivePurpose = routePurpose === 'all' ? publicState.purpose : routePurpose;
  var categoryRows = filterPropertiesByCategory(publicState.properties, publicState.category);
  var rows = categoryRows.filter(function (property) {
    var search = publicState.search.trim().toLowerCase();
    var matchesSearch = !search || listingSearchBlob(property).indexOf(search) !== -1;
    var matchesReference = !publicState.reference || String(property.reference_number || '').toLowerCase().indexOf(publicState.reference.toLowerCase()) !== -1;
    var matchesPurpose = ignorePurpose || effectivePurpose === 'all' || property.purpose === effectivePurpose;
    var matchesType = publicState.type === 'all' || property.property_type === publicState.type;
    var matchesStatus = publicState.publicStatus === 'all' || property.status === publicState.publicStatus;
    var isPublic = property.status === 'Active' || property.status === 'Under Offer';
    var matchesBranch = publicState.branch === 'all' || String(property.branch_id) === publicState.branch;
    var matchesCurrency = publicState.currency === 'all' || property.currency_code === publicState.currency;
    var price = Number(property.price);
    var matchesPrice =
      (publicState.minPrice === '' || (property.price != null && Number.isFinite(price) && price >= Number(publicState.minPrice))) &&
      (publicState.maxPrice === '' || (property.price != null && Number.isFinite(price) && price <= Number(publicState.maxPrice)));
    var matchesBedrooms = publicState.minBedrooms === '' ||
      (property.bedrooms != null && Number(property.bedrooms) >= Number(publicState.minBedrooms));
    var matchesBathrooms = publicState.minBathrooms === '' ||
      (property.bathrooms != null && Number(property.bathrooms) >= Number(publicState.minBathrooms));
    var matchesSize = publicState.minSize === '' ||
      (property.square_metres != null && Number(property.square_metres) >= Number(publicState.minSize));
    var amenities = Array.isArray(property.amenities) ? property.amenities.map(function (item) {
      return String(item).toLowerCase();
    }) : [];
    var matchesFeatures = publicState.features.every(function (feature) {
      return amenities.indexOf(String(feature).toLowerCase()) !== -1;
    });
    return isPublic && matchesSearch && matchesReference && matchesPurpose && matchesType && matchesStatus && matchesBranch &&
      matchesListingLocation(property) && matchesListingArea(property) && matchesCurrency && matchesPrice &&
      matchesBedrooms && matchesBathrooms && matchesSize && matchesFeatures;
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

  var currentValue = publicState.type;
  var types = [];
  filterPropertiesByCategory(publicState.properties, publicState.category).forEach(function (property) {
    if (property.property_type && types.indexOf(property.property_type) === -1) {
      types.push(property.property_type);
    }
  });
  types.sort();

  renderListingOptions('listingTypeFilter', types.map(function (type) {
    return {value: type, label: type};
  }), 'All property types', currentValue);
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
  grid.classList.toggle('is-active', state === 'ready' || state === 'empty');
  grid.dataset.state = state;

  loading.hidden = state !== 'loading';
  error.hidden = state !== 'error';
  empty.hidden = state !== 'empty';
  grid.hidden = state !== 'ready';

  if (state === 'error') error.innerHTML = '<h2>Properties could not be loaded</h2><p>' +
    escapeHtml(message || 'Property listings could not be loaded.') + '</p>';
  if (count) count.hidden = state === 'loading' || state === 'error';
  if (results) results.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
}

var propertySectionDefinitions = [
  {key: 'sale', title: 'Property for Sale', purpose: 'For Sale', href: '/properties-for-sale'},
  {key: 'rent', title: 'Property for Rent', purpose: 'For Rent', href: '/properties-for-rent'},
  {key: 'developments', title: 'New Developments', purpose: null, href: null}
];

function renderPropertySection(section, properties) {
  var id = 'property-section-' + section.key;
  var useHomepageCardLayout = section.key === 'sale' || section.key === 'rent';
  var viewAll = section.href
    ? '<a class="property-section__view-all" href="' + section.href + '" aria-label="View all ' +
      escapeHtml(section.title.toLowerCase()) + '">View All</a>'
    : '<span class="property-section__view-all" role="link" aria-disabled="true" title="Development listings are not yet available">View All</span>';
  return [
    '<section class="property-section" aria-labelledby="' + id + '-title">',
    '<div class="property-section__header"><h2 id="' + id + '-title">' + escapeHtml(section.title) + '</h2>',
    '<div class="property-section__controls">' + viewAll,
    '<button type="button" class="property-section__arrow" data-direction="-1" aria-controls="' + id +
      '-viewport" aria-label="Previous properties for ' + escapeHtml(section.key) +
      '" aria-disabled="true" disabled><svg class="property-section__arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>',
    '<button type="button" class="property-section__arrow" data-direction="1" aria-controls="' + id +
      '-viewport" aria-label="Next properties for ' + escapeHtml(section.key) +
      '" aria-disabled="true" disabled><svg class="property-section__arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>',
    '</div></div>',
    '<div class="property-section__viewport" id="' + id + '-viewport" role="region" aria-labelledby="' + id +
      '-title"' + (properties.length ? ' tabindex="0"' : '') + '><div class="property-section__track" id="' + id + '-track">',
    properties.length
      ? properties.map(function (property) {
        return propertyCard(property, useHomepageCardLayout ? 'homepage' : null);
      }).join('')
      : '<p class="property-section__empty">' +
        (section.key === 'developments'
          ? 'New development listings are not yet available.'
          : 'No properties match your current filters in this section.') +
        '</p>',
    '</div></div></section>'
  ].join('');
}

function setPropertyCarouselButtonState(button, disabled) {
  button.disabled = disabled;
  button.setAttribute('aria-disabled', String(disabled));
}

function updatePropertySectionControls(section) {
  if (!section) {
    document.querySelectorAll('.property-section').forEach(updatePropertySectionControls);
    return;
  }
  var viewport = section.querySelector('.property-section__viewport');
  var maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  setPropertyCarouselButtonState(section.querySelector('[data-direction="-1"]'), viewport.scrollLeft <= 2);
  setPropertyCarouselButtonState(section.querySelector('[data-direction="1"]'), viewport.scrollLeft >= maximum - 2);
}

function initializePropertyCarousel(section) {
  var viewport = section.querySelector('.property-section__viewport');
  var track = section.querySelector('.property-section__track');
  section.querySelectorAll('.property-section__arrow').forEach(function (button) {
    button.addEventListener('click', function () {
      var card = track.querySelector('.property-card');
      if (!card) return;
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      viewport.scrollBy({
        left: Number(button.dataset.direction) * (card.getBoundingClientRect().width + gap),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    });
  });
  viewport.addEventListener('scroll', function () {
    updatePropertySectionControls(section);
  }, {passive: true});
  updatePropertySectionControls(section);
}

function renderPropertySections(container, rows) {
  if (!container) return;
  container.innerHTML = propertySectionDefinitions.map(function (section) {
    return renderPropertySection(section, section.purpose ? rows.filter(function (property) {
      return property.purpose === section.purpose;
    }) : []);
  }).join('');

  var unclassified = rows.filter(function (property) {
    return property.purpose !== 'For Sale' && property.purpose !== 'For Rent';
  });
  if (unclassified.length) {
    container.insertAdjacentHTML('beforeend', renderPropertySection({
      key: 'other',
      title: 'Other Properties',
      href: 'listings.html'
    }, unclassified));
    console.warn('[Hilltop] Properties without a recognised purpose:', unclassified.map(function (property) {
      return property.reference_number || property.id;
    }));
  }

  container.querySelectorAll('.property-section').forEach(initializePropertyCarousel);
  if (!container.dataset.resizeBound) {
    window.addEventListener('resize', function () {
      updatePropertySectionControls();
    }, {passive: true});
    container.dataset.resizeBound = 'true';
  }
  window.requestAnimationFrame(function () {
    updatePropertySectionControls();
  });
}

function renderCanonicalListingAverages() {
  if (!document.body.classList.contains('listings-page-v2')) return;
  var purpose = currentListingPurpose();
  var inventory = publicState.properties.filter(function (property) {
    return (purpose === 'all' || property.purpose === purpose) &&
      (property.status === 'Active' || property.status === 'Under Offer');
  });
  var types = [null, 'House', 'Land', 'Commercial', 'Apartment'];
  document.querySelectorAll('.listings-lower-prices tbody tr').forEach(function (row, index) {
    var prices = ['ZMW', 'USD'].map(function (currency) {
      var matches = inventory.filter(function (property) {
        return (!types[index] || property.property_type === types[index]) &&
          property.currency_code === currency && property.price != null;
      });
      if (!matches.length) return '';
      var average = matches.reduce(function (sum, property) { return sum + Number(property.price); }, 0) / matches.length;
      return currency + ' ' + window.HilltopCurrency.formatPropertyPrice(Math.round(average * 100) / 100, currency, purpose);
    }).filter(Boolean);
    row.querySelector('td').textContent = prices.join(' / ') || 'Not available';
  });
  var note = byId('averagePriceNote');
  if (note) {
    note.textContent = inventory.length
      ? 'Average asking prices across current ' + (purpose === 'For Rent' ? 'Rent' : purpose === 'For Sale' ? 'Sale' : 'public') + ' listings, shown separately by currency. Search filters do not change these averages.'
      : 'Average prices are not available yet.';
  }
}

function renderListings() {
  if (!publicState.listingsLoaded) return;
  var grid = byId('listingsGrid');
  var empty = byId('listingsEmpty');
  var count = byId('listingsCount');
  if (!grid || !empty) return;

  var rows = filteredListings();
  var filterMessage = byId('listingFilterMessage');
  if (filterMessage) filterMessage.textContent = listingFilterError();
  var categoryRows = filterPropertiesByCategory(publicState.properties, publicState.category);
  var categoryContent = listingCategoryContent[publicState.category];
  grid.innerHTML = rows.map(function (property, index) {
    return document.body.classList.contains('listings-page-v2')
      ? canonicalListingCard(property, index)
      : propertyCard(property);
  }).join('');
  if (!rows.length) {
    var purpose = currentListingPurpose();
    var hasPurposeInventory = publicState.properties.some(function (property) {
      return (purpose === 'all' || property.purpose === purpose) &&
        (property.status === 'Active' || property.status === 'Under Offer');
    });
    empty.innerHTML = publicState.invalidLocationPath
      ? '<h2>Location not found</h2><p>This listing URL does not match a known province, city or suburb.</p>'
      : '<h2>' + (hasPurposeInventory ? 'No properties found' : 'No properties ' +
        (purpose === 'For Rent' ? 'for rent' : purpose === 'For Sale' ? 'for sale' : 'available') + ' yet') + '</h2><p>' +
        (hasPurposeInventory ? 'Try clearing one or more filters.' : 'Please check back soon for new listings.') + '</p>';
  }
  if (count) {
    var province = publicState.provinces.find(function (item) {
      return item.slug === publicState.province;
    });
    count.textContent = rows.length ? '1 - ' + rows.length + ' of ' + rows.length + ' propert' +
      (rows.length === 1 ? 'y' : 'ies') + (province ? ' in ' + province.name : '') : '0 properties';
  }
  var purposeInventory = publicState.properties.filter(function (property) {
    return (currentListingPurpose() === 'all' || property.purpose === currentListingPurpose()) &&
      (property.status === 'Active' || property.status === 'Under Offer');
  });
  if (byId('filterPropertyCount')) {
    byId('filterPropertyCount').textContent = purposeInventory.length + ' propert' + (purposeInventory.length === 1 ? 'y' : 'ies');
  }
  if (byId('filterMatchingCount')) {
    byId('filterMatchingCount').textContent = listingFilterError() || rows.length + ' matching propert' + (rows.length === 1 ? 'y' : 'ies');
  }
  if (byId('listingBottomCount')) byId('listingBottomCount').textContent = count ? count.textContent : '';
  if (byId('listingPagination')) byId('listingPagination').hidden = !rows.length;
  if (byId('listingMapCount')) {
    byId('listingMapCount').textContent = listingFilterError() ||
      rows.length + ' matching propert' + (rows.length === 1 ? 'y' : 'ies');
    byId('listingMapView').textContent = 'View ' + rows.length + ' propert' + (rows.length === 1 ? 'y' : 'ies');
  }
  setListingsViewState(rows.length ? 'ready' : 'empty');
  renderCanonicalListingAverages();
}

function applyCategoryPageContent(config) {
  var page = document.body;
  var eyebrow = byId('listingPageEyebrow');
  var title = byId('listingPageTitle');
  var descriptionText = byId('listingPageDescription');
  var empty = byId('listingsEmpty');

  if (!page || !page.classList.contains('listings-page')) return;

  var purpose = currentListingPurpose();
  var purposeSuffix = purpose === 'For Sale' ? 'for Sale' : purpose === 'For Rent' ? 'for Rent' : '';
  var displayTitle = config.key === 'all' && purposeSuffix
    ? 'Properties ' + purposeSuffix
    : config.title + (purposeSuffix ? ' ' + purposeSuffix : '');
  var displayDescription = purpose === 'For Rent'
    ? 'Browse current properties for rent in Zambia with Hilltop Properties.'
    : purpose === 'For Sale'
      ? 'Browse current properties for sale in Zambia with Hilltop Properties.'
      : config.description;
  if (eyebrow) eyebrow.textContent = config.eyebrow;
  if (title) title.textContent = displayTitle;
  if (descriptionText) descriptionText.textContent = displayDescription;
  if (empty) empty.innerHTML = categoryEmptyStateMarkup(config);

  document.title = displayTitle + ' | Hilltop Properties Zambia';
  var description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', displayDescription);

  var breadcrumb = byId('listingBreadcrumbLink');
  if (breadcrumb) {
    breadcrumb.href = purpose === 'For Rent' ? '/properties-for-rent' : purpose === 'For Sale' ? '/properties-for-sale' : '/listings';
    breadcrumb.textContent = purpose === 'For Rent' ? 'Property for Rent' : purpose === 'For Sale' ? 'Property for Sale' : 'Property Listings';
  }
  if (byId('listingBreadcrumbCurrent')) byId('listingBreadcrumbCurrent').textContent = config.key === 'all' ? 'All Property' : config.title;
  document.querySelectorAll('[data-lower-purpose]').forEach(function (label) {
    label.textContent = purpose === 'For Rent' ? 'for rent' : purpose === 'For Sale' ? 'for sale' : 'available';
  });
  document.querySelectorAll('[data-lower-article-purpose]').forEach(function (label) {
    label.textContent = purpose === 'For Rent' ? 'for Rent' : purpose === 'For Sale' ? 'for Sale' : 'Listings';
  });
  if (byId('listingFooterNote')) {
    byId('listingFooterNote').textContent = 'Current properties ' + (purpose === 'For Rent' ? 'for rent' : purpose === 'For Sale' ? 'for sale' : '') + ' · Article previews and request tools are not yet connected';
  }

  page.classList.remove('category-pending');
  page.classList.add('category-ready');
}

applyCategoryPageContent(categoryConfig);

function renderListingsPage() {
  applyCategoryPageContent(listingCategoryContent[publicState.category]);
  renderListingsTypeFilter();
  syncListingControls();
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
  byId('aboutContent').textContent = homepage.about_content || 'Hilltop Properties Zambia helps clients buy, rent, sell, and manage quality real estate across Lusaka and Livingstone.';
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

  var rows = publicState.testimonials && publicState.testimonials.length
    ? publicState.testimonials
    : fallbackTestimonialSlides;

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
      '<blockquote>“' + escapeHtml(item.message || 'Hilltop helped us move forward with confidence.') + '”</blockquote>',
      '<p class="testimonial-name">' + escapeHtml(item.client_name || 'Client Testimonial') + '</p>',
      '<p class="testimonial-role">' + escapeHtml(item.client_role || 'Property Client') + '</p>',
      '</div>',
      '</article>'
    ].join('');
  }).join('');
}


function resolveContact() {
  return {
    phone: fallbackContact.phone,
    office: fallbackContact.office,
    email: fallbackContact.email,
    address: fallbackContact.address
  };
}

function renderContact() {
  if (!byId('contactGrid')) return;
  var contact = resolveContact();
  var cards = [
    { title: 'General Enquiries', lines: [contact.email, contact.phone, contact.office] },
    { title: 'Lusaka Branch', lines: ['Kabulonga, Lusaka, Zambia', '+260 979 972019'] },
    { title: 'Livingstone Branch', lines: ['Mosi-oa-Tunya Road, Livingstone, Zambia', '+260 979 328 997'] }
  ];

  byId('contactGrid').innerHTML = cards.map(function (card) {
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
    ? 'Hello Hilltop Properties Zambia, I would like to enquire about property ' + referenceNumber + '.'
    : 'Hello Hilltop Properties Zambia, I would like to make a property enquiry.';

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
    setEnquiryMessage('Thank you. Your enquiry has been sent. Hilltop Properties will contact you shortly.', 'success');
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

    setEnquiryMessage('Thank you. Your enquiry has been sent. Hilltop Properties will contact you shortly.', 'success');
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

  bindListingControls();

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
  if (card.slug === 'buy-property') {
    return { href: '/properties-for-sale', enquiryType: '' };
  }
  if (card.slug === 'rent-property' || card.action_type === 'rental_listings') {
    return { href: '/properties-for-rent', enquiryType: '' };
  }
  if (card.action_type === 'list_property_enquiry') {
    return { href: '#contact', enquiryType: 'List a Property' };
  }
  if (card.action_type === 'internal_page' && isSafePropertyServicesInternalPath(card.action_value)) {
    return { href: canonicalCollectionHref(card.action_value), enquiryType: '' };
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
  if (!content || !sectionElement) return;
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

function normalizeLocationSearchResult(row) {
  if (!row || row.id == null || !row.type || !row.name) return null;
  var type = String(row.type).trim().toLowerCase();
  if (['province', 'city', 'suburb'].indexOf(type) === -1) return null;
  function optional(value) {
    return value == null || String(value).trim() === '' ? null : String(value);
  }
  return {
    id: String(row.id),
    type: type,
    name: String(row.name),
    slug: optional(row.slug),
    canonicalPath: optional(row.canonical_path != null ? row.canonical_path : row.canonicalPath),
    provinceId: optional(row.province_id != null ? row.province_id : row.provinceId),
    provinceName: optional(row.province_name != null ? row.province_name : row.provinceName),
    provinceSlug: optional(row.province_slug != null ? row.province_slug : row.provinceSlug),
    cityId: optional(row.city_id != null ? row.city_id : row.cityId),
    cityName: optional(row.city_name != null ? row.city_name : row.cityName),
    citySlug: optional(row.city_slug != null ? row.city_slug : row.citySlug),
    suburbId: optional(row.suburb_id != null ? row.suburb_id : row.suburbId),
    suburbName: optional(row.suburb_name != null ? row.suburb_name : row.suburbName),
    suburbSlug: optional(row.suburb_slug != null ? row.suburb_slug : row.suburbSlug)
  };
}

function locationIdentity(location) {
  return location ? location.type + ':' + location.id : '';
}

function normalizeLocationSearchResults(rows) {
  var identities = new Set();
  return (Array.isArray(rows) ? rows : []).map(normalizeLocationSearchResult).filter(function (location) {
    if (!location) return false;
    var identity = locationIdentity(location);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
}

function discoveryLocationContext(location) {
  if (location.type === 'province') return 'Province';
  if (location.type === 'city') {
    return location.provinceName && location.provinceName.toLowerCase() === location.name.toLowerCase()
      ? 'City · ' + location.provinceName + ' Province'
      : location.provinceName || 'City';
  }
  return [location.cityName, location.provinceName].filter(Boolean).join(', ') || 'Suburb';
}

function syncDiscoveryLocationMenu() {
  var hiddenInput = byId('discoveryLocation');
  var textInput = byId('discoveryLocationTrigger');
  if (!hiddenInput || !textInput) return;
  var selected = discoverySearchState.selectedLocation;
  hiddenInput.value = locationIdentity(selected);
  if (selected) {
    hiddenInput.dataset.locationType = selected.type;
    hiddenInput.dataset.locationId = selected.id;
    textInput.value = selected.name;
  } else {
    delete hiddenInput.dataset.locationType;
    delete hiddenInput.dataset.locationId;
    textInput.value = discoverySearchState.locationQuery;
  }
}

function clearDiscoverySelectedLocation() {
  discoverySearchState.selectedLocation = null;
  discoverySearchState.province = 'all';
  discoverySearchState.city = 'all';
  discoverySearchState.area = 'all';
  discoverySearchState.location = '';
  var input = byId('discoveryLocationTrigger');
  if (input) input.removeAttribute('aria-invalid');
  syncDiscoveryLocationMenu();
}

function setDiscoverySelectedLocation(location) {
  var normalized = normalizeLocationSearchResult(location);
  if (!normalized) return false;
  discoverySearchState.selectedLocation = normalized;
  discoverySearchState.locationQuery = normalized.name;
  discoverySearchState.province = normalized.provinceSlug || 'all';
  discoverySearchState.city = normalized.type === 'province' ? 'all' : normalized.citySlug || 'all';
  discoverySearchState.area = normalized.type === 'suburb' ? normalized.suburbSlug || 'all' : 'all';
  discoverySearchState.location = normalized.name;
  var input = byId('discoveryLocationTrigger');
  if (input) input.removeAttribute('aria-invalid');
  syncDiscoveryLocationMenu();
  syncListingMap();
  return true;
}

function syncDiscoverySelectMenu(selectId) {
  var select = byId(selectId);
  var value = byId(selectId + 'Value');
  if (!select || !value) return;
  var selected = select.options[select.selectedIndex];
  value.textContent = selected ? selected.textContent : '';
}

function syncDiscoveryControls() {
  syncDiscoveryLocationMenu();
  var types = Array.from(new Set(publicState.properties.map(function (property) {
    return property.property_type;
  }).filter(Boolean))).sort();
  renderListingOptions('discoveryType', types.map(function (type) {
    return {value: type, label: type};
  }), 'All property types', discoverySearchState.type);

  var price = byId('discoveryPrice');
  var limits = [];
  ['ZMW', 'USD'].forEach(function (currency) {
    var amounts = Array.from(new Set(publicState.properties.filter(function (property) {
      return property.purpose === discoverySearchState.purpose &&
        window.HilltopCurrency.normalizeCurrencyCode(property.currency_code) === currency &&
        property.price != null &&
        Number.isFinite(Number(property.price));
    }).map(function (property) {
      return Number(property.price);
    }))).sort(function (first, second) {
      return first - second;
    });
    amounts = amounts.filter(function (_, index) {
      return amounts.length <= 8 ||
        index === amounts.length - 1 ||
        index % Math.ceil(amounts.length / 8) === 0;
    });
    amounts.forEach(function (amount) {
      limits.push({
        value: currency + ':' + amount,
        label: currency + ' ' + amount.toLocaleString()
      });
    });
  });
  var current = discoverySearchState.maxPrice === ''
    ? ''
    : discoverySearchState.currency + ':' + discoverySearchState.maxPrice;
  if (current && !limits.some(function (limit) { return limit.value === current; })) {
    limits.push({
      value: current,
      label: discoverySearchState.currency + ' ' + Number(discoverySearchState.maxPrice).toLocaleString()
    });
  }
  price.innerHTML = '<option value="">No maximum</option>' + limits.map(function (limit) {
    return '<option value="' + escapeHtml(limit.value) + '">' + escapeHtml(limit.label) + '</option>';
  }).join('');
  price.value = current;
  syncDiscoverySelectMenu('discoveryType');
  syncDiscoverySelectMenu('discoveryPrice');
  document.querySelectorAll('[data-discovery-purpose]').forEach(function (button) {
    button.setAttribute('aria-pressed', String(button.dataset.discoveryPurpose === discoverySearchState.purpose));
  });
  syncListingMap();
}

function canonicalListingImages(propertyId) {
  return publicState.images.filter(function (image) {
    return String(image.property_id) === String(propertyId) && typeof image.image_url === 'string' && image.image_url.trim();
  }).sort(function (first, second) {
    return Number(Boolean(second.is_cover)) - Number(Boolean(first.is_cover)) ||
      Number(first.display_order || 0) - Number(second.display_order || 0);
  }).map(function (image) {
    return image.image_url.trim();
  }).filter(function (url, index, urls) {
    return urls.indexOf(url) === index;
  });
}

function canonicalListingCard(property, index) {
  var images = canonicalListingImages(property.id);
  var rawTitle = propertyTitleForDisplay(property.title || property.reference_number || 'Hilltop property');
  var title = escapeHtml(rawTitle);
  var url = '/property-details?id=' + encodeURIComponent(property.id);
  var main = images.length
    ? '<img src="' + escapeHtml(images[0]) + '" alt="' + title + ' — photo 1" decoding="async" ' +
      (index > 1 ? 'loading="lazy"' : 'fetchpriority="high"') + '>'
    : '<div class="gallery-placeholder"><svg aria-hidden="true"><use href="#icon-home"/></svg><span>Photo unavailable</span></div>';
  var controls = images.length > 1
    ? '<button type="button" class="gallery-arrow gallery-previous" data-direction="-1" aria-label="Previous image of ' + title + '"><svg class="ui-arrow ui-arrow--left" aria-hidden="true"><use href="#icon-chevron"/></svg></button>' +
      '<button type="button" class="gallery-arrow gallery-next" data-direction="1" aria-label="Next image of ' + title + '"><svg class="ui-arrow ui-arrow--right" aria-hidden="true"><use href="#icon-chevron"/></svg></button>' +
      '<span class="gallery-counter">1 / ' + images.length + '</span>'
    : '';
  var specifications = [];
  function positive(value) { return Number.isFinite(Number(value)) && Number(value) > 0; }
  if (String(property.property_type || '').toLowerCase() !== 'land') {
    if (positive(property.bedrooms)) specifications.push('<span>' + Number(property.bedrooms) + ' beds</span>');
    if (positive(property.bathrooms)) specifications.push('<span>' + Number(property.bathrooms) + ' baths</span>');
  }
  if (positive(property.square_metres)) {
    specifications.push('<span><svg aria-hidden="true"><use href="#icon-area"/></svg>' + Number(property.square_metres).toLocaleString('en-ZM') + ' m²</span>');
  }
  return '<article class="property-card" aria-labelledby="property-title-' + index + '">' +
    '<div class="property-gallery" data-images="' + escapeHtml(JSON.stringify(images)) + '" data-index="0" data-title="' + title + '">' +
    '<a href="' + url + '" class="gallery-main">' + main + '</a>' +
    '<span class="purpose-badge">' + escapeHtml(property.purpose) + '</span>' +
    '<button type="button" class="save-property" data-property-id="' + escapeHtml(property.id) + '" aria-label="Save ' + title + '" aria-pressed="false"><svg aria-hidden="true"><use href="#icon-favourite-star"/></svg></button>' +
    '<span class="property-card-verified">HILLTOP.Verified</span>' + controls + '</div>' +
    '<div class="property-info"><p class="property-price">' + formatPrice(property.price, property.purpose, property.currency_code, property.billing_period) + '</p>' +
    '<h2 class="property-title" id="property-title-' + index + '"><a href="' + url + '">' + title + '</a></h2>' +
    '<p class="property-location">' + [property.area, property.property_type].filter(Boolean).map(escapeHtml).join(' · ') + '</p>' +
    (specifications.length ? '<div class="property-specs">' + specifications.join('') + '</div>' : '') + '</div></article>';
}

function bindCanonicalListingGalleries() {
  var grid = byId('listingsGrid');
  if (!grid || grid.dataset.galleryBound === 'true') return;
  grid.dataset.galleryBound = 'true';
  var gesture = null;
  var suppressClickUntil = 0;

  function stepGallery(gallery, direction) {
    var images = JSON.parse(gallery.dataset.images || '[]');
    if (images.length < 2) return;
    var index = (Number(gallery.dataset.index) + direction + images.length) % images.length;
    gallery.dataset.index = String(index);
    var image = gallery.querySelector('img');
    if (!image) {
      image = document.createElement('img');
      gallery.querySelector('.gallery-main').replaceChildren(image);
    }
    image.src = images[index];
    image.alt = gallery.dataset.title + ' — photo ' + (index + 1);
    gallery.querySelector('.gallery-counter').textContent = (index + 1) + ' / ' + images.length;
  }

  grid.addEventListener('error', function (event) {
    if (event.target.tagName !== 'IMG') return;
    var main = event.target.closest('.gallery-main');
    if (main) main.innerHTML = '<div class="gallery-placeholder"><svg aria-hidden="true"><use href="#icon-home"/></svg><span>Photo unavailable</span></div>';
  }, true);
  grid.addEventListener('click', function (event) {
    var arrow = event.target.closest('.gallery-arrow');
    if (arrow) {
      event.preventDefault();
      event.stopPropagation();
      stepGallery(arrow.closest('.property-gallery'), Number(arrow.dataset.direction));
      return;
    }
    if (Date.now() < suppressClickUntil && event.target.closest('.property-gallery') && !event.target.closest('button')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  grid.addEventListener('touchstart', function (event) {
    var gallery = event.target.closest('.property-gallery');
    gesture = gallery && !event.target.closest('button') && event.touches.length === 1
      ? {gallery: gallery, x: event.touches[0].clientX, y: event.touches[0].clientY}
      : null;
  }, {passive: true});
  grid.addEventListener('touchend', function (event) {
    if (!gesture) return;
    var dx = event.changedTouches[0].clientX - gesture.x;
    var dy = event.changedTouches[0].clientY - gesture.y;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      stepGallery(gesture.gallery, dx < 0 ? 1 : -1);
      suppressClickUntil = Date.now() + 700;
    }
    gesture = null;
  }, {passive: true});
  grid.addEventListener('touchcancel', function () { gesture = null; }, {passive: true});
}

function renderHomepageInventory() {
  syncDiscoveryControls();
  // Homepage inventory is deliberately independent from discoverySearchState.
  var rows = publicState.properties.slice();
  byId('discoveryStatus').textContent = publicState.listingsLoaded
    ? rows.length
      ? rows.length + ' available propert' + (rows.length === 1 ? 'y' : 'ies')
      : 'No properties are currently available.'
    : 'Properties could not be loaded. Please refresh to try again.';
  var count = byId('discoveryCount');
  if (count) {
    count.textContent = publicState.listingsLoaded
      ? rows.length + ' propert' + (rows.length === 1 ? 'y' : 'ies')
      : '';
  }
  renderPropertySections(byId('homePropertySections'), rows);
  byId('listingMapHolder').querySelectorAll('[data-province]').forEach(function (path) {
    var province = publicState.provinces.find(function (item) {
      return item.slug === path.dataset.province;
    });
    var provinceCount = rows.filter(function (property) {
      return province && property.province_id === province.id;
    }).length;
    path.setAttribute(
      'aria-label',
      'View properties in ' + (province ? province.name : path.dataset.province) +
        ' Province, ' + provinceCount + ' matching properties'
    );
  });
}

function bindDiscoveryControls() {
  if (!byId('discoveryForm')) return;
  loadListingMap();
  bindDiscoveryLocationMenu();
  bindDiscoverySelectMenu('discoveryType');
  bindDiscoverySelectMenu('discoveryPrice');
  document.querySelectorAll('[data-discovery-purpose]').forEach(function (button) {
    button.addEventListener('click', function () {
      discoverySearchState.purpose = button.dataset.discoveryPurpose;
      syncDiscoveryControls();
    });
  });
  byId('discoveryType').addEventListener('change', function (event) {
    discoverySearchState.type = event.target.value;
  });
  byId('discoveryPrice').addEventListener('change', function (event) {
    var parts = event.target.value.split(':');
    discoverySearchState.currency = parts[0] || 'all';
    discoverySearchState.maxPrice = parts[1] || '';
  });
  byId('discoveryForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var locationInput = byId('discoveryLocationTrigger');
    if (discoverySearchState.locationQuery.trim() && !discoverySearchState.selectedLocation) {
      locationInput.setAttribute('aria-invalid', 'true');
      byId('discoveryLocationStatus').textContent = 'Select a location from the suggestions.';
      byId('discoveryStatus').textContent = 'Select a location from the suggestions.';
      locationInput.focus();
      return;
    }
    var locationPath = canonicalLocationPath(discoverySearchState.selectedLocation);
    navigateToDedicatedListings(
      discoverySearchState.purpose,
      discoverySearchParams(locationPath),
      locationPath
    );
  });
}

function bindDiscoverySelectMenu(selectId) {
  var select = byId(selectId);
  var trigger = byId(selectId + 'Trigger');
  var menu = byId(selectId + 'Menu');
  if (!select || !trigger || !menu || trigger.dataset.bound === 'true') return;
  var field = trigger.closest('.discovery-popup-field');
  trigger.dataset.bound = 'true';
  var closeTimer = null;
  var openFrame = null;

  function renderOptions() {
    menu.innerHTML = Array.from(select.options).map(function (option, index) {
      return '<button class="discovery-popup-option" id="' + selectId + '-option-' + index + '" type="button" role="option" aria-selected="' + (option.value === select.value) + '" data-discovery-select-index="' + index + '">' +
        '<span class="discovery-popup-option__label">' + escapeHtml(option.textContent) + '</span>' +
        '<svg class="discovery-popup-option__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    }).join('');
  }

  function positionMenu() {
    menu.classList.remove('opens-upward');
    var triggerRect = trigger.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var roomBelow = window.innerHeight - triggerRect.bottom - 8;
    var roomAbove = triggerRect.top - 8;
    if (menuRect.height > roomBelow && roomAbove > roomBelow) menu.classList.add('opens-upward');
  }

  function finishClose() {
    menu.hidden = true;
    menu.classList.remove('is-open', 'is-closing', 'opens-upward');
    if (field) field.classList.remove('is-menu-open');
    closeTimer = null;
  }

  function closeMenu(returnFocus) {
    if (trigger.getAttribute('aria-expanded') !== 'true' && menu.hidden) return;
    window.clearTimeout(closeTimer);
    if (openFrame) window.cancelAnimationFrame(openFrame);
    trigger.setAttribute('aria-expanded', 'false');
    if (field) field.classList.remove('is-menu-open');
    menu.classList.remove('is-open');
    menu.classList.add('is-closing');
    if (returnFocus) trigger.focus();
    if (prefersReducedMotion()) finishClose();
    else closeTimer = window.setTimeout(finishClose, 150);
  }

  function openMenu(focusPosition) {
    document.dispatchEvent(new CustomEvent('discovery-menu-opening', {detail: menu.id}));
    window.clearTimeout(closeTimer);
    if (openFrame) window.cancelAnimationFrame(openFrame);
    renderOptions();
    menu.hidden = false;
    menu.classList.remove('is-open', 'is-closing');
    if (field) field.classList.add('is-menu-open');
    positionMenu();
    trigger.setAttribute('aria-expanded', 'true');
    openFrame = window.requestAnimationFrame(function () {
      menu.classList.add('is-open');
      openFrame = null;
    });
    if (focusPosition) {
      var buttons = menu.querySelectorAll('[role="option"]');
      if (!buttons.length) return;
      var selected = menu.querySelector('[aria-selected="true"]');
      if (focusPosition === 'last') buttons[buttons.length - 1].focus();
      else (selected || buttons[0]).focus();
    }
  }

  function choose(index) {
    var option = select.options[index];
    if (!option) return;
    select.value = option.value;
    syncDiscoverySelectMenu(selectId);
    select.dispatchEvent(new Event('change', {bubbles: true}));
    closeMenu(true);
  }

  trigger.addEventListener('click', function () {
    if (trigger.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });
  trigger.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openMenu(event.key === 'ArrowUp' ? 'last' : 'selected');
  });
  menu.addEventListener('click', function (event) {
    var option = event.target.closest('[data-discovery-select-index]');
    if (option) choose(Number(option.dataset.discoverySelectIndex));
  });
  menu.addEventListener('keydown', function (event) {
    var current = event.target.closest('[data-discovery-select-index]');
    if (!current) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key === 'Tab') {
      closeMenu();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(Number(current.dataset.discoverySelectIndex));
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(event.key) === -1) return;
    event.preventDefault();
    var buttons = Array.from(menu.querySelectorAll('[role="option"]'));
    var currentIndex = buttons.indexOf(current);
    var nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
      event.key === 'ArrowDown' ? (currentIndex + 1) % buttons.length :
        (currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1);
    buttons[nextIndex].focus();
  });
  document.addEventListener('pointerdown', function (event) {
    if (!event.target.closest('.discovery-popup-field')) closeMenu();
  });
  document.addEventListener('discovery-menu-opening', function (event) {
    if (event.detail !== menu.id) closeMenu();
  });
  window.addEventListener('resize', function () {
    if (trigger.getAttribute('aria-expanded') === 'true') positionMenu();
  }, {passive: true});
  syncDiscoverySelectMenu(selectId);
}

function bindDiscoveryLocationMenu() {
  var hiddenInput = byId('discoveryLocation');
  var input = byId('discoveryLocationTrigger');
  var menu = byId('discoveryLocationMenu');
  var status = byId('discoveryLocationStatus');
  if (!hiddenInput || !input || !menu || input.dataset.bound === 'true') return;
  var field = input.closest('.discovery-location-field');
  var control = input.closest('.discovery-location-trigger');
  input.dataset.bound = 'true';
  var closeTimer = null;
  var openFrame = null;
  var debounceTimer = null;
  var requestSequence = 0;
  var results = [];
  var resultsTerm = '';
  var activeIndex = -1;
  var loading = false;
  var resultMessage = '';

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function renderOptions() {
    var items = results.map(function (location, index) {
      return '<button class="discovery-location-option" id="discovery-location-option-' + index + '" type="button" role="option" tabindex="-1" aria-selected="' + (index === activeIndex) + '" data-discovery-location-index="' + index + '" data-location-type="' + escapeHtml(location.type) + '">' +
        '<span class="discovery-location-option__text"><span class="discovery-location-option__label">' + escapeHtml(location.name) + '</span>' +
        '<span class="discovery-location-option__context">' + escapeHtml(discoveryLocationContext(location)) + '</span></span>' +
        '<svg class="discovery-location-option__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    });
    if (loading) {
      items.push('<div class="discovery-location-message" role="presentation">Searching locations…</div>');
    } else if (resultMessage) {
      items.push('<div class="discovery-location-message" role="presentation">' + escapeHtml(resultMessage) + '</div>');
    }
    menu.innerHTML = items.join('');
    if (activeIndex >= 0 && results[activeIndex]) {
      input.setAttribute('aria-activedescendant', 'discovery-location-option-' + activeIndex);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function positionMenu() {
    menu.classList.remove('opens-upward');
    var triggerRect = control.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var roomBelow = window.innerHeight - triggerRect.bottom - 8;
    var roomAbove = triggerRect.top - 8;
    if (menuRect.height > roomBelow && roomAbove > roomBelow) menu.classList.add('opens-upward');
  }

  function finishClose() {
    menu.hidden = true;
    menu.classList.remove('is-open', 'is-closing', 'opens-upward');
    if (field) field.classList.remove('is-menu-open');
    closeTimer = null;
  }

  function closeMenu(returnFocus) {
    if (input.getAttribute('aria-expanded') !== 'true' && menu.hidden) return;
    window.clearTimeout(closeTimer);
    if (openFrame) window.cancelAnimationFrame(openFrame);
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    if (field) field.classList.remove('is-menu-open');
    menu.classList.remove('is-open');
    menu.classList.add('is-closing');
    if (returnFocus) input.focus();
    if (prefersReducedMotion()) finishClose();
    else closeTimer = window.setTimeout(finishClose, 150);
  }

  function openMenu() {
    if (!loading && !results.length && !resultMessage) return;
    document.dispatchEvent(new CustomEvent('discovery-menu-opening', {detail: menu.id}));
    window.clearTimeout(closeTimer);
    if (openFrame) window.cancelAnimationFrame(openFrame);
    renderOptions();
    menu.hidden = false;
    menu.classList.remove('is-open', 'is-closing');
    if (field) field.classList.add('is-menu-open');
    positionMenu();
    input.setAttribute('aria-expanded', 'true');
    openFrame = window.requestAnimationFrame(function () {
      menu.classList.add('is-open');
      openFrame = null;
    });
  }

  function choose(index) {
    var location = results[index];
    if (!location) return;
    window.clearTimeout(debounceTimer);
    requestSequence += 1;
    setDiscoverySelectedLocation(location);
    setStatus(location.name + ' selected.');
    closeMenu(true);
  }

  function invalidatePendingSearch() {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
    requestSequence += 1;
  }

  async function requestLocations(term, sequence) {
    if (sequence !== requestSequence) return;
    var supabase = getSupabaseClient();
    if (!supabase || typeof supabase.rpc !== 'function') {
      resultMessage = 'Location suggestions are unavailable.';
      setStatus(resultMessage);
      openMenu();
      console.warn('[Hilltop] Location suggestions are unavailable because Supabase is not configured.');
      return;
    }
    loading = true;
    resultMessage = '';
    renderOptions();
    openMenu();
    try {
      var response = await supabase.rpc('search_locations', {
        search_term: term,
        result_limit: 8
      });
      if (sequence !== requestSequence || input.value.trim() !== term) return;
      if (response.error) throw response.error;
      results = normalizeLocationSearchResults(response.data);
      resultsTerm = term;
      activeIndex = -1;
      loading = false;
      resultMessage = results.length ? '' : 'No locations found.';
      setStatus(results.length + ' location suggestion' + (results.length === 1 ? '' : 's') + ' available.');
      renderOptions();
      openMenu();
    } catch (error) {
      if (sequence !== requestSequence) return;
      results = [];
      resultsTerm = term;
      activeIndex = -1;
      loading = false;
      resultMessage = 'Location suggestions are unavailable.';
      setStatus(resultMessage);
      renderOptions();
      openMenu();
      console.warn('[Hilltop] Location suggestion request failed.', error);
    }
  }

  function scheduleSearch() {
    var term = input.value.trim();
    invalidatePendingSearch();
    results = [];
    resultsTerm = '';
    activeIndex = -1;
    loading = false;
    resultMessage = '';
    if (term.length < 2) {
      closeMenu();
      setStatus(term.length ? 'Type at least 2 characters for location suggestions.' : '');
      return;
    }
    var sequence = requestSequence;
    debounceTimer = window.setTimeout(function () {
      debounceTimer = null;
      requestLocations(term, sequence);
    }, 250);
  }

  function moveActive(direction) {
    if (!results.length) return;
    if (menu.hidden || input.getAttribute('aria-expanded') !== 'true') openMenu();
    if (activeIndex < 0) activeIndex = direction > 0 ? 0 : results.length - 1;
    else activeIndex = (activeIndex + direction + results.length) % results.length;
    renderOptions();
  }

  input.addEventListener('focus', function () {
    if (discoverySearchState.selectedLocation) return;
    if (results.length && resultsTerm === input.value.trim()) openMenu();
    else if (input.value.trim().length >= 2) scheduleSearch();
  });
  input.addEventListener('input', function () {
    discoverySearchState.locationQuery = input.value;
    input.removeAttribute('aria-invalid');
    if (discoverySearchState.selectedLocation && input.value !== discoverySearchState.selectedLocation.name) {
      clearDiscoverySelectedLocation();
      discoverySearchState.locationQuery = input.value;
    }
    scheduleSearch();
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      invalidatePendingSearch();
      closeMenu();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return;
      event.preventDefault();
      moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0 && input.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      choose(activeIndex);
    }
  });
  menu.addEventListener('click', function (event) {
    var option = event.target.closest('[data-discovery-location-index]');
    if (option) choose(Number(option.dataset.discoveryLocationIndex));
  });
  document.addEventListener('pointerdown', function (event) {
    if (!event.target.closest('.discovery-location-field')) {
      invalidatePendingSearch();
      closeMenu();
    }
  });
  document.addEventListener('discovery-menu-opening', function (event) {
    if (event.detail !== menu.id) {
      invalidatePendingSearch();
      closeMenu();
    }
  });
  window.addEventListener('resize', function () {
    if (input.getAttribute('aria-expanded') === 'true') positionMenu();
  }, {passive: true});
  syncDiscoveryLocationMenu();
}

function renderWebsite() {
  applySeoSettings();
  renderHero();
  configureWhyHeroVideo();
  renderFilters();
  if (byId('discoveryForm')) renderHomepageInventory();
  else if (byId('homePropertySections')) renderPropertySections(byId('homePropertySections'), publicState.properties);
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
  } else if (byId('homePropertySections')) {
    bindDiscoveryControls();
    renderMorePropertiesLoading();
    loadPublicData();
  } else {
    loadSharedPublicData();
  }
});

/* ============================================================
   TEAM HOLD TRIGGER FUNCTIONALITY
   ============================================================ */

// Temporary hardcoded default team members as last-resort fallback
var tempTeamMembers = [
  {
    id: 1,
    name: "Mwansa Kaunda",
    role: "Managing Director & Principal Broker",
    branch: "Lusaka",
    bio: "Over 12 years of real estate experience in Zambia. Specialist in commercial valuations and high-end residential acquisitions.",
    phone: "+260 97 789 0123",
    whatsapp: "https://wa.me/260977890123",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80"
  },
  {
    id: 2,
    name: "Daliso Mumba",
    role: "Senior Leasing Agent",
    branch: "Lusaka",
    bio: "Focused on residential renting and landlord coordination in Kabulonga, Woodlands, and Roma areas.",
    phone: "+260 96 456 7890",
    whatsapp: "https://wa.me/260964567890",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80"
  },
  {
    id: 3,
    name: "Sibongile Phiri",
    role: "Livingstone Branch Manager",
    branch: "Livingstone",
    bio: "Managing tourist-capital properties, lodges, land listings, and guiding international clients.",
    phone: "+260 95 321 6549",
    whatsapp: "https://wa.me/260953216549",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80"
  }
];

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

    var listToRender = [];

    // 1. Primary: Use pre-loaded active members from Supabase
    if (activeTeamMembers && activeTeamMembers.length > 0) {
      listToRender = activeTeamMembers;
    } else {
      // 2. Secondary fallback: Local storage cache
      var localTeam = null;
      try {
        localTeam = localStorage.getItem('hilltop_team_members');
      } catch (e) {}

      if (localTeam) {
        try {
          var parsed = JSON.parse(localTeam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            listToRender = parsed.filter(function (m) {
              return m.isActive === true || m.isActive === 'true';
            });
            listToRender.sort(function (a, b) {
              return (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
            });
          }
        } catch (e) {}
      }
    }

    // 3. Last-resort fallback: hardcoded defaults
    if (listToRender.length === 0) {
      listToRender = tempTeamMembers;
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
            '<img src="' + escapeHtml(imgPath) + '" alt="' + escapeHtml(displayName) + '" loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80\'" />' +
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
    var textMessage = 'Hello Hilltop Properties, my name is ' + nameVal + '.\n' +
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


