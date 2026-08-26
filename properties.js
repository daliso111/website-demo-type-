/* ============================================================
   HILLTOP PROPERTIES ZAMBIA — MODULE 2: PROPERTY MANAGEMENT
   properties.js
   Phase 3A: read-only Supabase loading.
   Phase 3B will add property create/update/archive safely.
   Phase 3C: property images/documents storage.
   ============================================================ */


/* ══════════════════════════════════════════════════════════════
   1. SAMPLE PROPERTY DATA
   Each property is an object. In a real system this would
   come from a backend database via an API call.
══════════════════════════════════════════════════════════════ */

var properties = [
  {
    id: 1,
    ref:       'HT-LSK-001',
    title:     '4-Bedroom Executive House in Kabulonga',
    purpose:   'For Sale',
    type:      'House',
    branch:    'Lusaka',
    area:      'Kabulonga',
    address:   'Plot 18, Lilayi Road, Kabulonga, Lusaka',
    price:     'ZMW 2,400,000',
    status:    'Active',
    beds:      4, baths: 3, garages: 2, size: 320,
    featured:  'Yes',
    amenities: 'Pool, Garden, Security, Borehole',
    virtualTour: '',
    youtube:   '',
    description: 'Stunning executive residence in the prestigious Kabulonga area. Features high ceilings, modern finishes, and a private garden.',
    coverImage: ''
  },
  {
    id: 2,
    ref:       'HT-LSK-002',
    title:     '2-Bedroom Apartment in Levy Junction',
    purpose:   'For Rent',
    type:      'Apartment',
    branch:    'Lusaka',
    area:      'Levy Junction',
    address:   'Levy Junction Complex, Lusaka',
    price:     'ZMW 8,500 / month',
    status:    'Active',
    beds:      2, baths: 2, garages: 1, size: 95,
    featured:  'No',
    amenities: 'Gym, Security, Parking',
    virtualTour: '',
    youtube:   '',
    description: 'Modern apartment in the Levy Junction complex. Perfect for young professionals.',
    coverImage: ''
  },
  {
    id: 3,
    ref:       'HT-LSK-003',
    title:     'Commercial Office Space — Cairo Road',
    purpose:   'For Rent',
    type:      'Commercial',
    branch:    'Lusaka',
    area:      'Cairo Road',
    address:   'Cairo Road Central, Lusaka',
    price:     'ZMW 22,000 / month',
    status:    'Under Offer',
    beds:      0, baths: 2, garages: 4, size: 450,
    featured:  'No',
    amenities: 'Parking, Reception, Server Room',
    virtualTour: '',
    youtube:   '',
    description: 'Premium Grade-A office space in the heart of Lusaka\'s business district.',
    coverImage: ''
  },
  {
    id: 4,
    ref:       'HT-LSK-004',
    title:     '5-Bedroom Mansion — Roma',
    purpose:   'For Sale',
    type:      'House',
    branch:    'Lusaka',
    area:      'Roma',
    address:   'Roma, Lusaka',
    price:     'ZMW 5,800,000',
    status:    'Sold',
    beds:      5, baths: 4, garages: 3, size: 560,
    featured:  'No',
    amenities: 'Pool, Garden, Staff Quarters, Solar Power',
    virtualTour: '',
    youtube:   '',
    description: 'Grand family mansion in the sought-after Roma neighbourhood.',
    coverImage: ''
  },
  {
    id: 5,
    ref:       'HT-LSK-005',
    title:     '1-Acre Residential Plot — Chalala',
    purpose:   'For Sale',
    type:      'Land',
    branch:    'Lusaka',
    area:      'Chalala',
    address:   'Chalala Residential Area, Lusaka',
    price:     'ZMW 980,000',
    status:    'Active',
    beds:      0, baths: 0, garages: 0, size: 4047,
    featured:  'No',
    amenities: 'Title Deed, Serviced',
    virtualTour: '',
    youtube:   '',
    description: 'Prime residential plot in Chalala. Fully serviced with tarred road access.',
    coverImage: ''
  },
  {
    id: 6,
    ref:       'HT-LSK-006',
    title:     '3-Bedroom House in Woodlands',
    purpose:   'For Sale',
    type:      'House',
    branch:    'Lusaka',
    area:      'Woodlands',
    address:   'Woodlands Extension, Lusaka',
    price:     'ZMW 1,350,000',
    status:    'Draft',
    beds:      3, baths: 2, garages: 1, size: 210,
    featured:  'No',
    amenities: 'Garden, Borehole',
    virtualTour: '',
    youtube:   '',
    description: 'Comfortable family home in a quiet Woodlands street. Recently renovated.',
    coverImage: ''
  },
  {
    id: 7,
    ref:       'HT-LVN-001',
    title:     '3-Bedroom Cottage — Livingstone Central',
    purpose:   'For Rent',
    type:      'House',
    branch:    'Livingstone',
    area:      'Livingstone Central',
    address:   'Mosi-oa-Tunya Road, Livingstone',
    price:     'ZMW 6,200 / month',
    status:    'Let / Rented',
    beds:      3, baths: 2, garages: 1, size: 150,
    featured:  'No',
    amenities: 'Garden, Security',
    virtualTour: '',
    youtube:   '',
    description: 'Charming cottage ideal for tourism or expat use, close to the Zambezi.',
    coverImage: ''
  },
  {
    id: 8,
    ref:       'HT-LVN-002',
    title:     'Riverside Lodge Plot — Victoria Falls',
    purpose:   'For Sale',
    type:      'Land',
    branch:    'Livingstone',
    area:      'Victoria Falls',
    address:   'Riverside Area, Livingstone',
    price:     'ZMW 3,200,000',
    status:    'Active',
    beds:      0, baths: 0, garages: 0, size: 8000,
    featured:  'Yes',
    amenities: 'River Frontage, Title Deed',
    virtualTour: '',
    youtube:   '',
    description: 'Rare riverside plot with uninterrupted views of the Zambezi. Exceptional investment opportunity.',
    coverImage: ''
  },
  {
    id: 9,
    ref:       'HT-LVN-003',
    title:     '2-Bedroom Apartment — Livingstone Central',
    purpose:   'For Rent',
    type:      'Apartment',
    branch:    'Livingstone',
    area:      'Livingstone Central',
    address:   'Independence Avenue, Livingstone',
    price:     'ZMW 5,500 / month',
    status:    'Active',
    beds:      2, baths: 1, garages: 1, size: 88,
    featured:  'No',
    amenities: 'Security, Parking',
    virtualTour: '',
    youtube:   '',
    description: 'Neat, well-maintained apartment near the Livingstone town centre.',
    coverImage: ''
  },
  {
    id: 10,
    ref:       'HT-LVN-004',
    title:     'Commercial Guesthouse — Maramba',
    purpose:   'For Sale',
    type:      'Commercial',
    branch:    'Livingstone',
    area:      'Maramba',
    address:   'Maramba Area, Livingstone',
    price:     'ZMW 4,800,000',
    status:    'Under Offer',
    beds:      8, baths: 8, garages: 4, size: 600,
    featured:  'Yes',
    amenities: 'Pool, Restaurant Space, Conference Room',
    virtualTour: '',
    youtube:   '',
    description: 'Established guesthouse with full hospitality infrastructure near Victoria Falls.',
    coverImage: ''
  }
];

// The demo now loads all property and location data from Supabase. Never expose
// the legacy Zambia sample records while authentication or network calls load.
properties = [];

// Running ID counter so new properties get unique IDs
var nextId = 1;

// Track which images are staged for the current modal session
var stagedImages = [];
var IMAGE_BUCKET = 'property-images';
var DOCUMENT_BUCKET = 'property-documents';
var MAX_IMAGE_SIZE = 5 * 1024 * 1024;
var MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
var ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
var ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];


/* ══════════════════════════════════════════════════════════════
   2. DOM REFERENCES
══════════════════════════════════════════════════════════════ */

var branchFilter      = document.getElementById('branchFilter');
var searchInput       = document.getElementById('searchInput');
var statusFilter      = document.getElementById('statusFilter');
var purposeFilter     = document.getElementById('purposeFilter');
var exclusiveFilter   = document.getElementById('exclusiveFilter');
var currencyFilter    = document.getElementById('currencyFilter');
var propertyCategoryNav = document.getElementById('propertyCategoryNav');
var propertyPageTitle = document.getElementById('propertyPageTitle');
var propertyPageSubtitle = document.getElementById('propertyPageSubtitle');
var propTableBody     = document.getElementById('propTableBody');
var propCards         = document.getElementById('propCards');
var emptyState        = document.getElementById('emptyState');
var emptyStateTitle   = document.getElementById('emptyStateTitle');
var emptyStateText    = document.getElementById('emptyStateText');
var propTable         = document.getElementById('propTable');
var selectAll         = document.getElementById('selectAll');
var headerCheck       = document.getElementById('headerCheck');
var bulkCount         = document.getElementById('bulkCount');
var btnBulkStatus     = document.getElementById('btnBulkStatus');
var btnBulkDelete     = document.getElementById('btnBulkDelete');
var bulkStatusSelect  = document.getElementById('bulkStatusSelect');
var btnAddProperty    = document.getElementById('btnAddProperty');
var propModal         = document.getElementById('propModal');
var modalOverlay      = document.getElementById('modalOverlay');
var modalClose        = document.getElementById('modalClose');
var modalCancelBtn    = document.getElementById('modalCancelBtn');
var propForm          = document.getElementById('propForm');
var modalTitle        = document.getElementById('modalTitle');
var modalSaveBtn      = document.getElementById('modalSaveBtn');
var editIdField       = document.getElementById('editId');
var imageDropZone     = document.getElementById('imageDropZone');
var imageFileInput    = document.getElementById('imageFileInput');
var imagePreviewGrid  = document.getElementById('imagePreviewGrid');
var btnBrowseImages   = document.getElementById('btnBrowseImages');
var toastEl           = document.getElementById('toast');
var propertyPagination = document.getElementById('propertyPagination');
var propertyPaginationSummary = document.getElementById('propertyPaginationSummary');
var propertyPageIndicator = document.getElementById('propertyPageIndicator');
var propertyPagePrevious = document.getElementById('propertyPagePrevious');
var propertyPageNext = document.getElementById('propertyPageNext');

// Stat number elements
var statTotal     = document.getElementById('statTotal');
var statActive    = document.getElementById('statActive');
var statUnderOffer = document.getElementById('statUnderOffer');
var statSoldLet   = document.getElementById('statSoldLet');


/* ══════════════════════════════════════════════════════════════
   3. CURRENT FILTER STATE
   We store the active filters here so any change can
   trigger a fresh render.
══════════════════════════════════════════════════════════════ */

var currentBranch  = 'all';
var currentSearch  = '';
var currentStatus  = 'all';
var currentPurpose = 'all';
var currentExclusive = 'all';
var currentCurrency = 'all';
var currentCategory = 'all';
var currentPage = 1;
var currentPageProperties = [];
var selectedPropertyIds = new Set();
var PROPERTIES_PER_PAGE = 10;
var isUsingSupabaseProperties = false;
var propertyBranches = [];
var propertyStaff = [];
var isPropertySavePending = false;

var PROPERTY_CATEGORY_CONFIG = {
  all: {
    heading: 'All Properties',
    subtitle: 'Manage all property listings for Hilltop Properties Zambia.',
    emptyTitle: 'No properties were found.',
    formType: ''
  },
  house: {
    heading: 'Houses',
    subtitle: 'Manage house listings across all Hilltop branches.',
    emptyTitle: 'No house listings were found.',
    formType: 'House'
  },
  apartment: {
    heading: 'Apartments',
    subtitle: 'Manage apartment listings across all Hilltop branches.',
    emptyTitle: 'No apartment listings were found.',
    formType: 'Apartment'
  },
  land: {
    heading: 'Land',
    subtitle: 'Manage land listings across all Hilltop branches.',
    emptyTitle: 'No land listings were found.',
    formType: 'Land'
  }
};

function normalizePropertyCategory(value) {
  var normalized = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(PROPERTY_CATEGORY_CONFIG, normalized) ? normalized : 'all';
}

function normalizePropertyType(value) {
  var normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'house' || normalized === 'houses') return 'house';
  if (normalized === 'apartment' || normalized === 'apartments' || normalized === 'flat' || normalized === 'flats') return 'apartment';
  if (normalized === 'land' || normalized === 'lands' || normalized === 'plot' || normalized === 'plots') return 'land';
  return normalized;
}

function propertyMatchesCategory(property, category) {
  return category === 'all' || normalizePropertyType(property && property.type) === category;
}

function isExclusiveProperty(property) {
  return Boolean(property && (
    property.exclusive === 'Yes' ||
    property.exclusive === true ||
    property.exclusive_property === true
  ));
}

function getPropertyCurrency(property) {
  var value = property && (property.currencyCode || property.currency_code);
  return window.HilltopCurrency.normalizeCurrencyCode(value);
}

function updatePriceCurrencyPrefix() {
  var currencySelect = document.getElementById('fCurrency');
  var prefix = document.getElementById('fPricePrefix');
  var wrap = document.getElementById('priceInputWrap');
  if (!currencySelect || !prefix || !wrap) return;

  var code = window.HilltopCurrency.normalizeCurrencyCode(currencySelect.value);
  prefix.textContent = code === 'USD' ? '$' : 'K';
  wrap.dataset.currency = code;
}

function getCategoryFromUrl() {
  return normalizePropertyCategory(new URLSearchParams(window.location.search).get('category'));
}

function replaceInvalidCategoryUrl() {
  var url = new URL(window.location.href);
  var rawCategory = url.searchParams.get('category');
  if (rawCategory === null) return;

  var normalizedRawCategory = String(rawCategory).trim().toLowerCase();
  var isSupported = Object.prototype.hasOwnProperty.call(PROPERTY_CATEGORY_CONFIG, normalizedRawCategory);
  if (!isSupported || normalizedRawCategory === 'all') {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', normalizedRawCategory);
  }

  if (url.pathname + url.search + url.hash === window.location.pathname + window.location.search + window.location.hash) return;
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

function updateCategoryUrl(category) {
  var url = new URL(window.location.href);
  if (category === 'all') {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', category);
  }
  window.history.pushState({ propertyCategory: category }, '', url.pathname + url.search + url.hash);
}

function getCategoryCounts() {
  return properties.reduce(function(counts, property) {
    counts.all += 1;
    var category = normalizePropertyType(property.type);
    if (Object.prototype.hasOwnProperty.call(counts, category) && category !== 'all') {
      counts[category] += 1;
    }
    return counts;
  }, { all: 0, house: 0, apartment: 0, land: 0 });
}

function updateCategoryInterface() {
  var config = PROPERTY_CATEGORY_CONFIG[currentCategory];
  var counts = getCategoryCounts();
  var activeTab = null;

  propertyPageTitle.textContent = config.heading;
  propertyPageSubtitle.textContent = config.subtitle;
  document.title = config.heading + ' — Property Management — Hilltop Properties Zambia';

  document.querySelectorAll('.property-category-tab').forEach(function(tab) {
    var isActive = tab.dataset.category === currentCategory;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
    if (isActive) activeTab = tab;
  });

  if (activeTab && propertyCategoryNav.scrollWidth > propertyCategoryNav.clientWidth) {
    var tabLeft = activeTab.offsetLeft;
    var tabRight = tabLeft + activeTab.offsetWidth;
    var visibleLeft = propertyCategoryNav.scrollLeft;
    var visibleRight = visibleLeft + propertyCategoryNav.clientWidth;
    if (tabLeft < visibleLeft) propertyCategoryNav.scrollLeft = tabLeft - 6;
    if (tabRight > visibleRight) propertyCategoryNav.scrollLeft = tabRight - propertyCategoryNav.clientWidth + 6;
  }

  document.getElementById('categoryCountAll').textContent = counts.all;
  document.getElementById('categoryCountHouse').textContent = counts.house;
  document.getElementById('categoryCountApartment').textContent = counts.apartment;
  document.getElementById('categoryCountLand').textContent = counts.land;

  emptyStateTitle.textContent = config.emptyTitle;
  emptyStateText.textContent = 'Try adjusting your search or filters, or add a new property.';
}

function canonicalPropertyTypeForForm(value) {
  var category = normalizePropertyType(value);
  if (category === 'house') return 'House';
  if (category === 'apartment') return 'Apartment';
  if (category === 'land') return 'Land';
  if (category === 'commercial') return 'Commercial';
  return value || '';
}


/* ══════════════════════════════════════════════════════════════
   4. SUPABASE READ-ONLY LOADING
   Phase 3A: read-only Supabase loading.
   Phase 3B will add property create/update/archive safely.
   Phase 3C: property images/documents storage.
══════════════════════════════════════════════════════════════ */

function getSupabaseClient() {
  return window.hilltopSupabase || null;
}

function waitForCurrentStaffProfile() {
  return new Promise(function(resolve) {
    var attempts = 0;
    var maxAttempts = 200;

    function checkProfile() {
      if (window.hilltopCurrentUser && window.hilltopCurrentUser.id) {
        resolve(window.hilltopCurrentUser);
        return;
      }

      attempts += 1;

      if (attempts >= maxAttempts) {
        resolve(null);
        return;
      }

      window.setTimeout(checkProfile, 50);
    }

    checkProfile();
  });
}

function cleanBranchName(name) {
  if (!name) return 'Unassigned';
  return name.replace(/\s+Branch$/i, '').trim();
}

function getCurrentUserRole() {
  return (window.hilltopCurrentUser || {}).role || '';
}

function isCurrentUserSuperAdmin() {
  var role = getCurrentUserRole();
  return role === 'super_admin' || role === 'Super Admin';
}

function isCurrentUserBranchManager() {
  var role = getCurrentUserRole();
  return role === 'branch_manager' || role === 'Branch Manager';
}

function canCreateProperty() {
  return isCurrentUserSuperAdmin() || isCurrentUserBranchManager();
}

function canManageProperty(property) {
  var profile = window.hilltopCurrentUser || {};
  if (isCurrentUserSuperAdmin()) return true;
  if (isCurrentUserBranchManager()) {
    return property && String(property.branchId) === String(profile.branch_id);
  }
  return false;
}

function requirePropertyManagePermission(property) {
  if (property ? canManageProperty(property) : canCreateProperty()) return true;
  showToast('You do not have permission to manage this property.', 'error');
  return false;
}

function requireMediaUploadPermission(property) {
  if (canManageProperty(property)) return true;
  showToast('You do not have permission to upload media for this property.', 'error');
  return false;
}

async function logActivity(entry) {
  var supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    var payload = {
      action_type: entry.actionType,
      description: entry.description,
      branch_id: entry.branchId || null,
      property_id: entry.propertyId || null,
      lead_id: entry.leadId || null,
      staff_user_id: (window.hilltopCurrentUser || {}).id || null
    };

    var response = await supabase
      .from('activity_logs')
      .insert(payload);

    if (response.error) {
      console.warn('Activity log insert failed.', response.error);
    }
  } catch (error) {
    console.warn('Activity log insert failed.', error);
  }
}

function formatPrice(price, purpose, currencyCode, billingPeriod) {
  return window.HilltopCurrency.formatPropertyPrice(
    price,
    currencyCode,
    purpose,
    billingPeriod
  );
}

function parsePrice(value) {
  var result = parsePriceInput(value);
  if (!result.invalid && !result.empty) return result.value;

  // Development sample records predate the numeric form input and contain
  // a display string. This fallback is never used to validate a form save.
  var legacyNumeric = Number(String(value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(legacyNumeric) ? legacyNumeric : 0;
}

function parsePriceInput(value) {
  return window.HilltopCurrency.parsePropertyPriceInput(value);
}

function parseAmenities(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(function(item) { return item.trim(); })
    .filter(Boolean);
}

function findPropertyBranchId(value) {
  if (!value) return null;

  var byId = propertyBranches.find(function(branch) {
    return String(branch.id) === String(value);
  });
  if (byId) return byId.id;

  var byName = propertyBranches.find(function(branch) {
    return cleanBranchName(branch.name).toLowerCase() === cleanBranchName(value).toLowerCase();
  });
  return byName ? byName.id : null;
}

function getCurrentBranchIdForWrite(selectedValue) {
  var profile = window.hilltopCurrentUser || {};
  if (isCurrentUserBranchManager()) return profile.branch_id || null;
  return findPropertyBranchId(selectedValue);
}

function hasPendingMediaOrDocumentFiles() {
  var documentInputs = ['docFloorPlan', 'docTitleDeed', 'docLease', 'docOther'];
  var hasDocs = documentInputs.some(function(id) {
    var input = document.getElementById(id);
    return input && input.files && input.files.length > 0;
  });

  return stagedImages.length > 0 || hasDocs;
}

function sanitizeFileName(fileName) {
  return String(fileName || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}

function makeStoragePath(propertyId, folder, fileName) {
  return 'properties/' + propertyId + '/' + folder + '/' + Date.now() + '-' + sanitizeFileName(fileName);
}

function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(file.name + ' is not a supported image type. Use JPG, PNG, or WebP.');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(file.name + ' is larger than 5MB.');
  }
}

function validateDocumentFile(file) {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error(file.name + ' is not a supported document type. Use PDF, JPG, PNG, or WebP.');
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new Error(file.name + ' is larger than 10MB.');
  }
}

function getSelectedDocumentUploads() {
  var configs = [
    { inputId: 'docFloorPlan', type: 'Floor Plan' },
    { inputId: 'docTitleDeed', type: 'Title Deed' },
    { inputId: 'docLease', type: 'Lease Agreement' },
    { inputId: 'docOther', type: 'Other' }
  ];
  var uploads = [];

  configs.forEach(function(config) {
    var input = document.getElementById(config.inputId);
    if (!input || !input.files || !input.files[0]) return;

    uploads.push({
      file: input.files[0],
      documentType: config.type,
      documentName: input.files[0].name
    });
  });

  return uploads;
}

function groupRowsByPropertyId(rows) {
  return (rows || []).reduce(function(grouped, row) {
    var propertyId = String(row.property_id);
    if (!grouped[propertyId]) grouped[propertyId] = [];
    grouped[propertyId].push(row);
    return grouped;
  }, {});
}

function mapSupabaseProperty(record, branchLookup, staffLookup, imagesByProperty, documentsByProperty) {
  var branch = branchLookup[String(record.branch_id)] || null;
  var agent = record.assigned_agent_id ? staffLookup[String(record.assigned_agent_id)] : null;
  var images = imagesByProperty[String(record.id)] || [];
  var documents = documentsByProperty[String(record.id)] || [];
  var coverImage = images.find(function(image) { return image.is_cover; }) || images[0] || null;

  return {
    id: record.id,
    ref: record.reference_number,
    title: record.title,
    description: record.description || '',
    price: formatPrice(record.price, record.purpose, record.currency_code),
    priceValue: Number(record.price || 0),
    currencyCode: window.HilltopCurrency.normalizeCurrencyCode(record.currency_code),
    purpose: record.purpose,
    type: canonicalPropertyTypeForForm(record.property_type),
    branch: branch ? cleanBranchName(branch.name) : 'Unassigned',
    branchId: record.branch_id || null,
    agent: agent ? agent.full_name : 'Unassigned',
    agentId: record.assigned_agent_id || null,
    area: record.area || '',
    address: record.full_address || '',
    beds: Number(record.bedrooms || 0),
    baths: Number(record.bathrooms || 0),
    garages: Number(record.garages || 0),
    size: Number(record.square_metres || 0),
    status: record.status,
    featured: record.featured ? 'Yes' : 'No',
    exclusive: record.exclusive_property ? 'Yes' : 'No',
    amenities: Array.isArray(record.amenities) ? record.amenities.join(', ') : '',
    virtualTour: record.virtual_tour_link || '',
    youtube: record.youtube_link || '',
    coverImage: coverImage ? coverImage.image_url : '',
    images: images,
    documents: documents,
    createdAt: record.created_at || '',
    updatedAt: record.updated_at || ''
  };
}

function shouldDisplayForCurrentUser(property) {
  var profile = window.hilltopCurrentUser || {};
  var role = profile.role;

  if (!profile.id || role === 'super_admin' || role === 'Super Admin') return true;
  if (!profile.branch_id) return true;

  return String(property.branchId) === String(profile.branch_id);
}

function showPropertiesLoadingState() {
  emptyState.style.display = 'none';
  propTable.style.display = 'table';
  propTableBody.innerHTML = '<tr><td colspan="11" style="padding:18px;color:var(--text-light);">Loading properties from Supabase...</td></tr>';
  propCards.innerHTML = '<div class="prop-card" style="padding:18px;color:var(--text-light);">Loading properties from Supabase...</div>';
}

function populatePropertyBranchSelect() {
  var branchSelect = document.getElementById('fBranch');
  var availabilityNote = document.getElementById('branchAvailabilityNote');
  if (!branchSelect) return;

  var selectedValue = branchSelect.value;
  var profile = window.hilltopCurrentUser || {};
  branchSelect.innerHTML = '';

  if (propertyBranches.length === 0) {
    var emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'No Zimbabwe branches are available';
    branchSelect.appendChild(emptyOption);
    branchSelect.value = '';
    branchSelect.disabled = true;
    if (availabilityNote) availabilityNote.hidden = false;
    return;
  }

  if (availabilityNote) availabilityNote.hidden = true;
  var promptOption = document.createElement('option');
  promptOption.value = '';
  promptOption.textContent = 'Select a Zimbabwe branch...';
  branchSelect.appendChild(promptOption);

  propertyBranches.forEach(function(branch) {
    var cleanName = cleanBranchName(branch.name);
    var opt = document.createElement('option');
    opt.value = branch.id;
    opt.textContent = cleanName;
    branchSelect.appendChild(opt);
  });

  if (isCurrentUserBranchManager() && profile.branch_id) {
    branchSelect.value = profile.branch_id;
    branchSelect.disabled = true;
    return;
  }

  branchSelect.disabled = false;
  branchSelect.value = selectedValue;
  if (selectedValue && branchSelect.value !== selectedValue) {
    branchSelect.value = findPropertyBranchId(selectedValue) || '';
  }
}

function renderPropertyBranchFilter() {
  if (!branchFilter) return;

  var profile = window.hilltopCurrentUser || {};
  var availableBranches = propertyBranches.filter(function(branch) {
    return !isCurrentUserBranchManager() || String(branch.id) === String(profile.branch_id);
  });
  var selectedBranchExists = availableBranches.some(function(branch) {
    return String(branch.id) === String(currentBranch);
  });

  if (currentBranch !== 'all' && !selectedBranchExists) currentBranch = 'all';
  branchFilter.innerHTML = '';

  var allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'branch-btn' + (currentBranch === 'all' ? ' active' : '');
  allButton.dataset.branch = 'all';
  allButton.textContent = isCurrentUserBranchManager() ? 'My Branch' : 'All Branches';
  branchFilter.appendChild(allButton);

  if (isCurrentUserBranchManager()) return;

  availableBranches.forEach(function(branch) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'branch-btn' + (String(currentBranch) === String(branch.id) ? ' active' : '');
    button.dataset.branch = branch.id;
    button.textContent = cleanBranchName(branch.name);
    branchFilter.appendChild(button);
  });
}

function populatePropertyAgentSelect() {
  var agentSelect = document.getElementById('fAgent');
  if (!agentSelect) return;

  var selectedValue = agentSelect.value;
  var profile = window.hilltopCurrentUser || {};
  var selectedBranchId = isCurrentUserBranchManager()
    ? profile.branch_id
    : findPropertyBranchId(document.getElementById('fBranch').value);
  agentSelect.innerHTML = '<option value="">Unassigned</option>';

  propertyStaff
    .filter(function(staff) {
      var role = staff.role;
      var canBeAssigned = role === 'agent' || role === 'branch_manager' || role === 'Agent' || role === 'Branch Manager';
      var isActive = staff.is_active !== false;
      var inManagerBranch = !isCurrentUserBranchManager() || String(staff.branch_id) === String(profile.branch_id);
      var inSelectedBranch = !selectedBranchId || String(staff.branch_id) === String(selectedBranchId);
      return canBeAssigned && isActive && inManagerBranch && inSelectedBranch;
    })
    .forEach(function(staff) {
      var opt = document.createElement('option');
      opt.value = staff.id;
      opt.textContent = staff.full_name;
      agentSelect.appendChild(opt);
    });

  agentSelect.value = selectedValue;
}

async function loadBranchesForProperties() {
  var response = await getSupabaseClient()
    .from('branches')
    .select('id, name')
    .order('name', { ascending: true });

  if (response.error) {
    throw new Error('Unable to load branches for properties: ' + response.error.message);
  }

  return response.data || [];
}

async function loadStaffForProperties() {
  var response = await getSupabaseClient()
    .from('staff_users')
    .select('id, full_name, role, branch_id, is_active')
    .order('full_name', { ascending: true });

  if (response.error) {
    throw new Error('Unable to load staff for properties: ' + response.error.message);
  }

  return response.data || [];
}

async function loadPropertiesFromSupabase() {
  var response = await getSupabaseClient()
    .from('properties')
    .select('id, reference_number, title, description, price, currency_code, purpose, property_type, branch_id, area, full_address, bedrooms, bathrooms, garages, square_metres, status, featured, exclusive_property, amenities, virtual_tour_link, youtube_link, assigned_agent_id, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (response.error) {
    throw new Error('Unable to load properties from Supabase: ' + response.error.message);
  }

  return response.data || [];
}

async function loadPropertyImagesFromSupabase() {
  var response = await getSupabaseClient()
    .from('property_images')
    .select('property_id, image_url, display_order, is_cover')
    .order('display_order', { ascending: true });

  if (response.error) {
    throw new Error('Unable to load property images from Supabase: ' + response.error.message);
  }

  return response.data || [];
}

async function loadPropertyDocumentsFromSupabase() {
  var response = await getSupabaseClient()
    .from('property_documents')
    .select('property_id, document_name, document_type, document_url, created_at')
    .order('created_at', { ascending: false });

  if (response.error) {
    throw new Error('Unable to load property documents from Supabase: ' + response.error.message);
  }

  return response.data || [];
}

async function loadPropertyModuleData() {
  if (!getSupabaseClient()) {
    properties = [];
    propertyBranches = [];
    propertyStaff = [];
    showToast('Supabase is not available. Property data could not be loaded.', 'error');
    renderProperties();
    return;
  }

  showPropertiesLoadingState();

  try {
    var currentStaffProfile = await waitForCurrentStaffProfile();

    if (!currentStaffProfile) {
      showToast('Staff profile is still being verified. Please refresh after login completes.', 'error');
      renderProperties();
      return;
    }

    var branchRows = await loadBranchesForProperties();
    var staffRows = await loadStaffForProperties();
    var propertyRows = await loadPropertiesFromSupabase();
    var imageRows = await loadPropertyImagesFromSupabase();
    var documentRows = await loadPropertyDocumentsFromSupabase();
    var branchLookup = {};
    var staffLookup = {};

    branchRows.forEach(function(branch) {
      branchLookup[String(branch.id)] = branch;
    });
    propertyBranches = branchRows;

    staffRows.forEach(function(staff) {
      staffLookup[String(staff.id)] = staff;
    });
    propertyStaff = staffRows;

    var imagesByProperty = groupRowsByPropertyId(imageRows);
    var documentsByProperty = groupRowsByPropertyId(documentRows);
    var unresolvedBranchCount = propertyRows.filter(function(row) {
      return row.branch_id && !branchLookup[String(row.branch_id)];
    }).length;

    properties = propertyRows
      .map(function(record) {
        return mapSupabaseProperty(record, branchLookup, staffLookup, imagesByProperty, documentsByProperty);
      })
      .filter(shouldDisplayForCurrentUser);

    isUsingSupabaseProperties = true;

    if (unresolvedBranchCount > 0) {
      showToast('Properties loaded, but branch names could not be resolved.', 'error');
    } else {
      showToast('Properties loaded from Supabase.', 'success');
    }

    renderProperties();
  } catch (error) {
    console.warn('Properties Supabase loading failed.', error);
    properties = [];
    propertyBranches = [];
    propertyStaff = [];
    showToast(error.message || 'Unable to load properties from Supabase.', 'error');
    renderProperties();
  }
}

function getPropertyPayloadFromForm() {
  var title = document.getElementById('fTitle').value.trim();
  var referenceNumber = document.getElementById('fRef').value.trim();
  var priceInput = document.getElementById('fPrice');
  var priceResult = parsePriceInput(priceInput.value);
  var currencyInput = document.getElementById('fCurrency');
  var currencyCode = String(currencyInput.value || '').trim().toUpperCase();
  var purpose = document.getElementById('fPurpose').value;
  var propertyType = canonicalPropertyTypeForForm(document.getElementById('fType').value);
  var branchId = getCurrentBranchIdForWrite(document.getElementById('fBranch').value);
  var status = document.getElementById('fStatus').value;
  var assignedAgentId = document.getElementById('fAgent') ? document.getElementById('fAgent').value : '';

  if (!title) throw new Error('Property title is required.');
  if (!referenceNumber) throw new Error('Reference number is required.');
  if (priceResult.empty) {
    priceInput.classList.add('error');
    throw new Error('Price is required.');
  }
  if (priceResult.invalid) {
    priceInput.classList.add('error');
    throw new Error('Enter a positive numeric price without commas, letters, or currency symbols.');
  }
  priceInput.classList.remove('error');
  if (!window.HilltopCurrency.isSupportedCurrency(currencyCode)) {
    currencyInput.classList.add('error');
    throw new Error('Please select ZMW or USD as the listing currency.');
  }
  currencyInput.classList.remove('error');
  if (!purpose) throw new Error('Purpose is required.');
  if (!propertyType) throw new Error('Property type is required.');
  if (['House', 'Apartment', 'Commercial', 'Land'].indexOf(propertyType) === -1) {
    throw new Error('Please select a supported property type.');
  }
  if (propertyBranches.length === 0) {
    throw new Error('Add a Zimbabwe branch under Staff & Branches before saving a property.');
  }
  if (!branchId) throw new Error('Please select a valid Zimbabwe branch.');
  if (!document.getElementById('fArea').value.trim()) throw new Error('Area is required.');
  if (!status) throw new Error('Status is required.');

  return {
    reference_number: referenceNumber,
    title: title,
    description: document.getElementById('fDesc').value.trim() || null,
    price: priceResult.value,
    currency_code: currencyCode,
    purpose: purpose,
    property_type: propertyType,
    branch_id: branchId,
    area: document.getElementById('fArea').value.trim(),
    full_address: document.getElementById('fAddress').value.trim() || null,
    bedrooms: parseInt(document.getElementById('fBeds').value, 10) || 0,
    bathrooms: parseInt(document.getElementById('fBaths').value, 10) || 0,
    garages: parseInt(document.getElementById('fGarages').value, 10) || 0,
    square_metres: parseInt(document.getElementById('fSize').value, 10) || 0,
    status: status,
    featured: document.getElementById('fFeatured').value === 'Yes',
    exclusive_property: document.getElementById('fExclusive').value === 'Yes',
    amenities: parseAmenities(document.getElementById('fAmenities').value),
    virtual_tour_link: document.getElementById('fVirtualTour').value.trim() || null,
    youtube_link: document.getElementById('fYoutube').value.trim() || null,
    assigned_agent_id: assignedAgentId || null
  };
}

async function createProperty(payload) {
  var response = await getSupabaseClient()
    .from('properties')
    .insert(payload)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase property insert failed.', response.error);
    throw new Error(response.error.message || 'Unable to create property.');
  }

  return response.data.id;
}

async function updateProperty(propertyId, payload) {
  var response = await getSupabaseClient()
    .from('properties')
    .update(payload)
    .eq('id', propertyId)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase property update failed.', response.error);
    throw new Error(response.error.message || 'Unable to update property.');
  }

  return response.data.id;
}

async function updatePropertyStatus(propertyId, status) {
  var response = await getSupabaseClient()
    .from('properties')
    .update({ status: status })
    .eq('id', propertyId)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase property status update failed.', response.error);
    throw new Error(response.error.message || 'Unable to update property status.');
  }
}

async function bulkUpdatePropertyStatus(propertyIds, status) {
  var response = await getSupabaseClient()
    .from('properties')
    .update({ status: status })
    .in('id', propertyIds);

  if (response.error) {
    console.warn('Supabase bulk property status update failed.', response.error);
    throw new Error(response.error.message || 'Unable to update selected properties.');
  }
}

async function insertPropertyImageMetadata(payload) {
  var response = await getSupabaseClient()
    .from('property_images')
    .insert(payload);

  if (response.error) {
    console.warn('Property image metadata insert failed.', response.error);
    throw new Error(response.error.message || 'Unable to save property image metadata.');
  }
}

async function insertPropertyDocumentMetadata(payload) {
  var response = await getSupabaseClient()
    .from('property_documents')
    .insert(payload);

  if (response.error) {
    console.warn('Property document metadata insert failed.', response.error);
    throw new Error(response.error.message || 'Unable to save property document metadata.');
  }
}

async function uploadPropertyImages(propertyId, property) {
  if (!stagedImages.length) return;
  if (!propertyId) throw new Error('A property id is required before uploading images.');
  if (!canManageProperty(property)) {
    throw new Error('You do not have permission to upload media for this property.');
  }

  showToast('Uploading property images...', 'success');

  for (var i = 0; i < stagedImages.length; i += 1) {
    var image = stagedImages[i];
    var file = image.file;
    validateImageFile(file);

    var path = makeStoragePath(propertyId, 'images', file.name);
    var uploadResponse = await getSupabaseClient()
      .storage
      .from(IMAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadResponse.error) {
      console.warn('Property image upload failed.', uploadResponse.error);
      throw new Error('Image upload failed for ' + file.name + ': ' + uploadResponse.error.message);
    }

    var publicUrlResult = getSupabaseClient()
      .storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(path);

    if (!publicUrlResult.data || !publicUrlResult.data.publicUrl) {
      throw new Error('Image uploaded, but a public URL could not be created for ' + file.name + '.');
    }

    await insertPropertyImageMetadata({
      property_id: propertyId,
      image_url: publicUrlResult.data.publicUrl,
      display_order: i,
      is_cover: i === 0
    });
  }
}

async function uploadPropertyDocuments(propertyId, property) {
  var uploads = getSelectedDocumentUploads();
  if (!uploads.length) return;
  if (!propertyId) throw new Error('A property id is required before uploading documents.');
  if (!canManageProperty(property)) {
    throw new Error('You do not have permission to upload media for this property.');
  }

  showToast('Uploading property documents...', 'success');

  for (var i = 0; i < uploads.length; i += 1) {
    var upload = uploads[i];
    var file = upload.file;
    validateDocumentFile(file);

    var path = makeStoragePath(propertyId, 'documents', file.name);
    var uploadResponse = await getSupabaseClient()
      .storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadResponse.error) {
      console.warn('Property document upload failed.', uploadResponse.error);
      throw new Error('Document upload failed for ' + file.name + ': ' + uploadResponse.error.message);
    }

    // property-documents is private, so store the storage path for now.
    // Signed document URLs can be generated in a later secure download phase.
    await insertPropertyDocumentMetadata({
      property_id: propertyId,
      document_name: upload.documentName,
      document_type: upload.documentType,
      document_url: path
    });
  }
}

async function uploadPropertyMedia(propertyId, property) {
  if (!hasPendingMediaOrDocumentFiles()) return;

  await uploadPropertyImages(propertyId, property);
  await uploadPropertyDocuments(propertyId, property);
  await logActivity({
    actionType: 'PROPERTY_MEDIA_UPLOADED',
    description: 'Uploaded media for property ' + ((property && (property.ref || property.reference_number)) || propertyId) + '.',
    branchId: property && (property.branchId || property.branch_id),
    propertyId: propertyId
  });
  showToast('Property media uploaded successfully.', 'success');
}


/* ══════════════════════════════════════════════════════════════
   5. FILTER & RENDER PROPERTIES
══════════════════════════════════════════════════════════════ */

/**
 * Returns a filtered array of properties based on the
 * current branch, search query, status, and purpose filters.
 */
function getFilteredProperties() {
  return properties.filter(function(p) {
    // Property category filter
    if (!propertyMatchesCategory(p, currentCategory)) return false;
    // Branch filter
    if (currentBranch !== 'all') {
      if (String(p.branchId || '') !== String(currentBranch)) return false;
    }
    // Status filter
    if (currentStatus !== 'all' && p.status !== currentStatus) return false;
    // Purpose filter
    if (currentPurpose !== 'all' && p.purpose !== currentPurpose) return false;
    // Currency filter
    if (currentCurrency !== 'all' && getPropertyCurrency(p) !== currentCurrency) return false;
    // Exclusive status filter
    if (currentExclusive === 'exclusive' && !isExclusiveProperty(p)) return false;
    if (currentExclusive === 'not-exclusive' && isExclusiveProperty(p)) return false;
    // Search filter — title, area, or ref
    if (currentSearch) {
      var q = currentSearch.toLowerCase();
      var match = (p.title || '').toLowerCase().includes(q)
               || (p.area || '').toLowerCase().includes(q)
               || (p.ref || '').toLowerCase().includes(q)
               || (p.agent || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Maps a status string to the correct CSS badge class.
 */
function getBadgeClass(status) {
  var map = {
    'Draft':       'badge-draft',
    'Active':      'badge-active',
    'Under Offer': 'badge-offer',
    'Sold':        'badge-sold',
    'Let / Rented':'badge-let',
    'Withdrawn':   'badge-withdrawn',
    'Archived':    'badge-withdrawn'
  };
  return map[status] || 'badge-draft';
}

/**
 * Renders the desktop table rows and mobile cards
 * from the currently filtered properties.
 */
function renderProperties() {
  renderPropertyBranchFilter();
  populatePropertyBranchSelect();
  populatePropertyAgentSelect();
  updateCategoryInterface();
  var filtered = getFilteredProperties();

  var filteredIds = new Set(filtered.map(function(property) { return String(property.id); }));
  selectedPropertyIds.forEach(function(id) {
    if (!filteredIds.has(String(id))) selectedPropertyIds.delete(String(id));
  });

  var totalPages = Math.max(1, Math.ceil(filtered.length / PROPERTIES_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  var pageStart = (currentPage - 1) * PROPERTIES_PER_PAGE;
  currentPageProperties = filtered.slice(pageStart, pageStart + PROPERTIES_PER_PAGE);

  // Update stats from full filtered data
  updateStats(filtered);

  // Show or hide empty state
  var isEmpty = filtered.length === 0;
  emptyState.style.display = isEmpty ? 'flex' : 'none';
  propTable.style.display  = isEmpty ? 'none' : 'table';
  propertyPagination.hidden = isEmpty;

  // ── Desktop Table ──
  propTableBody.innerHTML = '';
  currentPageProperties.forEach(function(p) {
    var badgeClass = getBadgeClass(p.status);
    var purposeClass = p.purpose === 'For Sale' ? 'pill-sale' : 'pill-rent';

    var row = document.createElement('tr');
    row.dataset.id = p.id;

    row.innerHTML = [
      '<td class="col-check"><input type="checkbox" class="row-check" data-id="' + p.id + '"' + (selectedPropertyIds.has(String(p.id)) ? ' checked' : '') + ' /></td>',
      '<td>',
        '<div class="prop-cover">',
          p.coverImage
            ? '<img src="' + p.coverImage + '" alt="' + p.title + '" />'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
        '</div>',
      '</td>',
      '<td><span class="prop-ref">' + p.ref + '</span></td>',
      '<td>',
        '<div class="prop-ref">' + p.ref + '</div>',
        '<div class="prop-title-cell" title="' + p.title + '">' + p.title + '</div>',
        isExclusiveProperty(p) ? '<span class="exclusive-badge">Exclusive</span>' : '',
      '</td>',
      '<td><span class="purpose-pill ' + purposeClass + '">' + p.purpose + '</span></td>',
      '<td>' + p.type + '</td>',
      '<td>' + p.branch + '</td>',
      '<td>' + p.area + '</td>',
      '<td style="font-weight:600;white-space:nowrap;">' + p.price + '</td>',
      '<td><span class="badge ' + badgeClass + '">' + p.status + '</span></td>',
      '<td>',
        '<div class="table-actions">',
          '<button class="btn-view" data-id="' + p.id + '" title="View">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
          '</button>',
          '<button class="btn-edit" data-id="' + p.id + '" title="Edit">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
          '</button>',
          '<button class="btn-delete" data-id="' + p.id + '" title="Archive">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
          '</button>',
        '</div>',
      '</td>'
    ].join('');

    propTableBody.appendChild(row);
  });

  // ── Mobile Cards ──
  propCards.innerHTML = '';
  currentPageProperties.forEach(function(p) {
    var badgeClass = getBadgeClass(p.status);
    var purposeClass = p.purpose === 'For Sale' ? 'pill-sale' : 'pill-rent';

    var card = document.createElement('div');
    card.className = 'prop-card';
    card.dataset.id = p.id;

    card.innerHTML = [
      '<div class="prop-card-cover">',
        p.coverImage
          ? '<img src="' + p.coverImage + '" alt="' + p.title + '" />'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        '<span class="badge ' + badgeClass + ' card-badge">' + p.status + '</span>',
      '</div>',
      '<div class="prop-card-body">',
        '<div class="prop-card-ref">' + p.ref + '</div>',
        '<div class="prop-card-title">' + p.title + '</div>',
        isExclusiveProperty(p) ? '<span class="exclusive-badge">Exclusive</span>' : '',
        '<div class="prop-card-meta">',
          '<span><span class="purpose-pill ' + purposeClass + '">' + p.purpose + '</span></span>',
          '<span>' + p.type + '</span>',
          '<span>' + p.area + '</span>',
          '<span>' + p.branch + '</span>',
        '</div>',
        '<div class="prop-card-price">' + p.price + '</div>',
        '<div class="prop-card-actions">',
          '<button class="action-btn outline small btn-edit" data-id="' + p.id + '">Edit</button>',
          '<button class="action-btn danger small btn-delete" data-id="' + p.id + '">Archive</button>',
        '</div>',
      '</div>'
    ].join('');

    propCards.appendChild(card);
  });

  updatePagination(filtered.length, totalPages, pageStart);

  updateBulkCount();
}

function updatePagination(totalRecords, totalPages, pageStart) {
  if (!totalRecords) {
    propertyPaginationSummary.textContent = 'Showing 0 properties';
    propertyPageIndicator.textContent = 'Page 1 of 1';
    propertyPagePrevious.disabled = true;
    propertyPageNext.disabled = true;
    return;
  }

  var firstRecord = pageStart + 1;
  var lastRecord = Math.min(pageStart + currentPageProperties.length, totalRecords);
  propertyPaginationSummary.textContent = 'Showing ' + firstRecord + '–' + lastRecord + ' of ' + totalRecords + ' properties';
  propertyPageIndicator.textContent = 'Page ' + currentPage + ' of ' + totalPages;
  propertyPagePrevious.disabled = currentPage <= 1;
  propertyPageNext.disabled = currentPage >= totalPages;
}


/* ══════════════════════════════════════════════════════════════
   5. UPDATE PROPERTY STATS
══════════════════════════════════════════════════════════════ */

function updateStats(filtered) {
  statTotal.textContent      = filtered.length;
  statActive.textContent     = filtered.filter(function(p){ return p.status === 'Active'; }).length;
  statUnderOffer.textContent = filtered.filter(function(p){ return p.status === 'Under Offer'; }).length;
  statSoldLet.textContent    = filtered.filter(function(p){ return p.status === 'Sold' || p.status === 'Let / Rented'; }).length;
}


/* ══════════════════════════════════════════════════════════════
   6. BRANCH FILTER
══════════════════════════════════════════════════════════════ */

branchFilter.addEventListener('click', function(event) {
  var btn = event.target.closest('.branch-btn');
  if (!btn || !branchFilter.contains(btn)) return;

  currentBranch = btn.dataset.branch;
  currentPage = 1;
  renderProperties();
});

propertyCategoryNav.addEventListener('click', function(event) {
  var tab = event.target.closest('.property-category-tab');
  if (!tab) return;

  var nextCategory = normalizePropertyCategory(tab.dataset.category);
  if (nextCategory === currentCategory) return;

  currentCategory = nextCategory;
  currentPage = 1;
  updateCategoryUrl(currentCategory);
  renderProperties();
});

window.addEventListener('popstate', function() {
  currentCategory = getCategoryFromUrl();
  currentPage = 1;
  replaceInvalidCategoryUrl();
  renderProperties();
});

propertyPagePrevious.addEventListener('click', function() {
  if (currentPage <= 1) return;
  currentPage -= 1;
  renderProperties();
});

propertyPageNext.addEventListener('click', function() {
  var totalPages = Math.max(1, Math.ceil(getFilteredProperties().length / PROPERTIES_PER_PAGE));
  if (currentPage >= totalPages) return;
  currentPage += 1;
  renderProperties();
});


/* ══════════════════════════════════════════════════════════════
   7. SEARCH & FILTER LISTENERS
══════════════════════════════════════════════════════════════ */

searchInput.addEventListener('input', function() {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  renderProperties();
});

statusFilter.addEventListener('change', function() {
  currentStatus = statusFilter.value;
  currentPage = 1;
  renderProperties();
});

purposeFilter.addEventListener('change', function() {
  currentPurpose = purposeFilter.value;
  currentPage = 1;
  renderProperties();
});

exclusiveFilter.addEventListener('change', function() {
  currentExclusive = exclusiveFilter.value;
  currentPage = 1;
  renderProperties();
});

currencyFilter.addEventListener('change', function() {
  currentCurrency = currencyFilter.value;
  currentPage = 1;
  renderProperties();
});


/* ══════════════════════════════════════════════════════════════
   8. TABLE ACTION DELEGATION
   We listen on the parent elements to handle clicks on
   dynamically-created buttons.
══════════════════════════════════════════════════════════════ */

propTableBody.addEventListener('click', function(e) {
  handleTableAction(e);
});

propCards.addEventListener('click', function(e) {
  handleTableAction(e);
});

function handleTableAction(e) {
  var target = e.target;

  // View button
  if (target.closest('.btn-view')) {
    var id = target.closest('.btn-view').dataset.id;
    viewProperty(id);
    return;
  }

  // Edit button
  if (target.closest('.btn-edit')) {
    var id = target.closest('.btn-edit').dataset.id;
    openEditModal(id);
    return;
  }

  // Delete button
  if (target.closest('.btn-delete')) {
    var id = target.closest('.btn-delete').dataset.id;
    deleteProperty(id);
    return;
  }

  // Row checkbox
  if (target.classList.contains('row-check')) {
    var checkboxId = String(target.dataset.id);
    if (target.checked) {
      selectedPropertyIds.add(checkboxId);
    } else {
      selectedPropertyIds.delete(checkboxId);
    }
    updateBulkCount();
  }
}

/**
 * Simple view — shows property details in a browser alert.
 * In a future version, this would open a read-only detail panel.
 */
function viewProperty(id) {
  var p = properties.find(function(x){ return String(x.id) === String(id); });
  if (!p) return;
  alert(
    'PROPERTY DETAILS\n\n' +
    'Ref: ' + p.ref + '\n' +
    'Title: ' + p.title + '\n' +
    'Purpose: ' + p.purpose + '\n' +
    'Type: ' + p.type + '\n' +
    'Branch: ' + p.branch + '\n' +
    'Area: ' + p.area + '\n' +
    'Price: ' + p.price + '\n' +
    'Status: ' + p.status + '\n' +
    'Beds: ' + p.beds + '  Baths: ' + p.baths + '  Garages: ' + p.garages + '\n' +
    'Size: ' + p.size + ' m²\n' +
    'Featured: ' + p.featured + '\n' +
    'Exclusive: ' + (isExclusiveProperty(p) ? 'Yes' : 'No') + '\n' +
    'Agent: ' + (p.agent || 'Unassigned') + '\n' +
    'Images: ' + ((p.images || []).length) + '\n' +
    'Documents: ' + ((p.documents || []).length) + '\n' +
    'Amenities: ' + p.amenities
  );
}

/**
 * Removes a property from the array and re-renders.
 */
async function deleteProperty(id) {
  var p = properties.find(function(x){ return String(x.id) === String(id); });
  if (!p) return;

  if (!requirePropertyManagePermission(p)) return;
  if (!confirm('Archive "' + p.title + '" for audit safety?')) return;

  try {
    if (!getSupabaseClient()) {
      showToast('Supabase is not available. Property archive cannot be saved.', 'error');
      return;
    }

    await updatePropertyStatus(id, 'Archived');
    await logActivity({
      actionType: 'PROPERTY_ARCHIVED',
      description: 'Archived property ' + (p.ref || p.title || id) + '.',
      branchId: p.branchId || null,
      propertyId: id
    });
    showToast('Property archived for audit safety.', 'success');
    await loadPropertyModuleData();
  } catch (error) {
    console.warn('Property archive failed.', error);
    showToast(error.message || 'Unable to archive property.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   9. SELECT ALL & BULK ACTIONS
══════════════════════════════════════════════════════════════ */

selectAll.addEventListener('change', function() {
  setCurrentPageSelection(selectAll.checked);
});

headerCheck.addEventListener('change', function() {
  setCurrentPageSelection(headerCheck.checked);
});

function setCurrentPageSelection(isSelected) {
  currentPageProperties.forEach(function(property) {
    var id = String(property.id);
    if (isSelected) {
      selectedPropertyIds.add(id);
    } else {
      selectedPropertyIds.delete(id);
    }
  });

  document.querySelectorAll('.row-check').forEach(function(checkbox) {
    checkbox.checked = isSelected;
  });
  updateBulkCount();
}

function getCheckedIds() {
  return Array.from(selectedPropertyIds);
}

function updateBulkCount() {
  var count = getCheckedIds().length;
  bulkCount.textContent = count + ' selected';

  var currentIds = currentPageProperties.map(function(property) { return String(property.id); });
  var selectedOnPage = currentIds.filter(function(id) { return selectedPropertyIds.has(id); }).length;
  var allOnPageSelected = currentIds.length > 0 && selectedOnPage === currentIds.length;
  var someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

  selectAll.checked = allOnPageSelected;
  selectAll.indeterminate = someOnPageSelected;
  headerCheck.checked = allOnPageSelected;
  headerCheck.indeterminate = someOnPageSelected;
}

// Bulk status change
btnBulkStatus.addEventListener('click', async function() {
  var ids = getCheckedIds();
  var newStatus = bulkStatusSelect.value;
  if (!ids.length)    { showToast('No properties selected', 'error'); return; }
  if (!newStatus)     { showToast('Please choose a status', 'error'); return; }

  var selectedProperties = properties.filter(function(p) { return ids.includes(String(p.id)); });
  var blocked = selectedProperties.some(function(p) { return !canManageProperty(p); });
  if (blocked) {
    showToast('You do not have permission to manage this property.', 'error');
    return;
  }

  try {
    if (!getSupabaseClient()) {
      showToast('Supabase is not available. Bulk status changes cannot be saved.', 'error');
      return;
    }

    await bulkUpdatePropertyStatus(ids, newStatus);
    await logActivity({
      actionType: 'PROPERTY_STATUS_UPDATED',
      description: 'Changed status for ' + ids.length + ' properties to ' + newStatus + '.'
    });
    bulkStatusSelect.value = '';
    selectedPropertyIds.clear();
    showToast('Status updated for ' + ids.length + ' properties', 'success');
    await loadPropertyModuleData();
  } catch (error) {
    console.warn('Bulk property status update failed.', error);
    showToast(error.message || 'Unable to update selected properties.', 'error');
  }
});

// Bulk delete
btnBulkDelete.addEventListener('click', async function() {
  var ids = getCheckedIds();
  if (!ids.length) { showToast('No properties selected', 'error'); return; }
  if (!confirm('Archive ' + ids.length + ' selected properties for audit safety?')) return;

  var selectedProperties = properties.filter(function(p) { return ids.includes(String(p.id)); });
  var blocked = selectedProperties.some(function(p) { return !canManageProperty(p); });
  if (blocked) {
    showToast('You do not have permission to manage this property.', 'error');
    return;
  }

  try {
    if (!getSupabaseClient()) {
      showToast('Supabase is not available. Bulk archive cannot be saved.', 'error');
      return;
    }

    await bulkUpdatePropertyStatus(ids, 'Archived');
    await logActivity({
      actionType: 'PROPERTY_ARCHIVED',
      description: 'Archived ' + ids.length + ' selected properties.'
    });
    selectedPropertyIds.clear();
    showToast('Property archived for audit safety.', 'success');
    await loadPropertyModuleData();
  } catch (error) {
    console.warn('Bulk property archive failed.', error);
    showToast(error.message || 'Unable to archive selected properties.', 'error');
  }
});


/* ══════════════════════════════════════════════════════════════
   10. MODAL — OPEN / CLOSE
══════════════════════════════════════════════════════════════ */

function openModal(mode, id) {
  mode = mode || 'add';

  var existingProperty = id
    ? properties.find(function(x){ return String(x.id) === String(id); })
    : null;

  if (!requirePropertyManagePermission(existingProperty)) return;

  // Switch to details tab first
  switchTab('details');

  // Clear staged media for this modal session.
  clearPropertyMediaInputs();

  if (mode === 'edit' && id) {
    // Find the property to edit
    var p = existingProperty;
    if (!p) return;

    modalTitle.textContent = 'Edit Property';
    editIdField.value = p.id;

    // Fill in form fields
    document.getElementById('fTitle').value    = p.title;
    document.getElementById('fRef').value      = p.ref;
    document.getElementById('fPrice').value    = p.priceValue || parsePrice(p.price);
    document.getElementById('fCurrency').value = getPropertyCurrency(p);
    document.getElementById('fCurrency').dataset.originalCurrency = getPropertyCurrency(p);
    document.getElementById('fDesc').value     = p.description;
    document.getElementById('fPurpose').value  = p.purpose;
    document.getElementById('fType').value     = canonicalPropertyTypeForForm(p.type);
    document.getElementById('fBranch').value   = p.branchId || findPropertyBranchId(p.branch) || p.branch;
    populatePropertyAgentSelect();
    if (document.getElementById('fAgent')) {
      document.getElementById('fAgent').value = p.agentId || '';
    }
    document.getElementById('fArea').value     = p.area;
    document.getElementById('fAddress').value  = p.address;
    document.getElementById('fBeds').value     = p.beds;
    document.getElementById('fBaths').value    = p.baths;
    document.getElementById('fGarages').value  = p.garages;
    document.getElementById('fSize').value     = p.size;
    document.getElementById('fFeatured').value = p.featured;
    document.getElementById('fExclusive').value = isExclusiveProperty(p) ? 'Yes' : 'No';
    document.getElementById('fAmenities').value = p.amenities;
    document.getElementById('fVirtualTour').value = p.virtualTour;
    document.getElementById('fYoutube').value  = p.youtube;
    document.getElementById('fStatus').value   = p.status;

    highlightWorkflowStep(p.status);

  } else {
    // Add mode — clear the form
    modalTitle.textContent = 'Add New Property';
    editIdField.value = '';
    propForm.reset();
    document.getElementById('fCurrency').value = 'ZMW';
    document.getElementById('fCurrency').dataset.originalCurrency = 'ZMW';
    document.getElementById('fType').value = PROPERTY_CATEGORY_CONFIG[currentCategory].formType;
    document.getElementById('fExclusive').value = 'No';
    if (isCurrentUserBranchManager() && (window.hilltopCurrentUser || {}).branch_id) {
      document.getElementById('fBranch').value = window.hilltopCurrentUser.branch_id;
    }
    populatePropertyAgentSelect();
    highlightWorkflowStep('Draft');
  }

  document.getElementById('currencyChangeWarning').hidden = true;
  updatePriceCurrencyPrefix();

  // Show modal
  propModal.style.display = 'flex';
  // Small delay lets display:flex paint before the CSS transition triggers
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      propModal.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  propModal.classList.remove('open');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  // After transition completes, hide completely
  setTimeout(function() { propModal.style.display = 'none'; }, 320);
}

// Open handlers
btnAddProperty.addEventListener('click', function() { openModal('add'); });
document.querySelectorAll('[data-open-property-modal]').forEach(function(button) {
  button.addEventListener('click', function() { openModal('add'); });
});
modalClose.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Open edit modal
function openEditModal(id) { openModal('edit', id); }


/* ══════════════════════════════════════════════════════════════
   11. MODAL TABS
══════════════════════════════════════════════════════════════ */

document.querySelectorAll('.modal-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    switchTab(tab.dataset.tab);
  });
});

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.modal-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  // Update tab panels
  document.querySelectorAll('.tab-panel').forEach(function(panel) {
    panel.classList.toggle('active', panel.id === 'tab-' + tabName);
  });
}


/* ══════════════════════════════════════════════════════════════
   12. STATUS WORKFLOW HIGHLIGHT
══════════════════════════════════════════════════════════════ */

function highlightWorkflowStep(statusValue) {
  document.querySelectorAll('.workflow-step').forEach(function(step) {
    step.classList.toggle('current', step.dataset.step === statusValue);
  });
}

document.getElementById('fStatus').addEventListener('change', function() {
  highlightWorkflowStep(this.value);
});

document.getElementById('fBranch').addEventListener('change', function() {
  populatePropertyAgentSelect();
});

document.getElementById('fCurrency').addEventListener('change', function() {
  var warning = document.getElementById('currencyChangeWarning');
  var isEditing = Boolean(editIdField.value);
  var originalCurrency = this.dataset.originalCurrency || 'ZMW';
  updatePriceCurrencyPrefix();
  warning.hidden = !isEditing || this.value === originalCurrency;
});

updatePriceCurrencyPrefix();


/* ══════════════════════════════════════════════════════════════
   13. FORM SAVE (ADD OR EDIT)
══════════════════════════════════════════════════════════════ */

propForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (isPropertySavePending) return;

  // Basic validation
  var required = ['fTitle', 'fRef', 'fCurrency', 'fPrice', 'fPurpose', 'fType', 'fBranch', 'fArea', 'fStatus'];
  var valid = true;
  required.forEach(function(fieldId) {
    var el = document.getElementById(fieldId);
    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });

  if (!valid) {
    switchTab('details');
    showToast('Please fill in all required fields', 'error');
    return;
  }

  var editId = editIdField.value;
  var existingProperty = editId
    ? properties.find(function(p){ return String(p.id) === String(editId); })
    : null;

  if (!requirePropertyManagePermission(existingProperty)) return;

  isPropertySavePending = true;
  modalSaveBtn.disabled = true;
  modalSaveBtn.setAttribute('aria-busy', 'true');
  modalSaveBtn.textContent = 'Saving...';

  try {
    if (!getSupabaseClient()) {
      throw new Error('Supabase is not available. Property changes cannot be saved.');
    }

    var payload = getPropertyPayloadFromForm();
    var savedPropertyId;
    var mediaPermissionProperty;
    var successMessage;

    if (editId) {
      savedPropertyId = await updateProperty(editId, payload);
      var propertyStatusChanged = existingProperty && existingProperty.status !== payload.status;
      var propertyTypeChanged = existingProperty && canonicalPropertyTypeForForm(existingProperty.type) !== payload.property_type;
      var exclusiveChanged = existingProperty && isExclusiveProperty(existingProperty) !== payload.exclusive_property;
      var previousCurrency = getPropertyCurrency(existingProperty);
      var currencyChanged = existingProperty && previousCurrency !== payload.currency_code;
      var priceChanged = existingProperty && Number(existingProperty.priceValue || 0) !== Number(payload.price);
      await logActivity({
        actionType: propertyStatusChanged ? 'PROPERTY_STATUS_UPDATED' : 'PROPERTY_UPDATED',
        description: propertyStatusChanged
          ? 'Changed property ' + payload.reference_number + ' status to ' + payload.status + '.'
          : 'Updated property ' + payload.reference_number + '.',
        branchId: payload.branch_id,
        propertyId: savedPropertyId
      });
      if (propertyTypeChanged) {
        await logActivity({
          actionType: 'PROPERTY_TYPE_UPDATED',
          description: 'Changed property ' + payload.reference_number + ' type to ' + payload.property_type + '.',
          branchId: payload.branch_id,
          propertyId: savedPropertyId
        });
      }
      if (currencyChanged) {
        await logActivity({
          actionType: 'PROPERTY_CURRENCY_UPDATED',
          description: 'Changed property ' + payload.reference_number + ' currency from ' + previousCurrency + ' to ' + payload.currency_code + '. The price amount was not converted.',
          branchId: payload.branch_id,
          propertyId: savedPropertyId
        });
      }
      if (priceChanged) {
        await logActivity({
          actionType: 'PROPERTY_PRICE_UPDATED',
          description: 'Changed property ' + payload.reference_number + ' price from ' + formatPrice(existingProperty.priceValue, existingProperty.purpose, previousCurrency) + ' to ' + formatPrice(payload.price, payload.purpose, payload.currency_code) + '.',
          branchId: payload.branch_id,
          propertyId: savedPropertyId
        });
      }
      if (exclusiveChanged) {
        await logActivity({
          actionType: payload.exclusive_property ? 'PROPERTY_EXCLUSIVE_ENABLED' : 'PROPERTY_EXCLUSIVE_DISABLED',
          description: payload.exclusive_property
            ? 'Marked property ' + payload.reference_number + ' as exclusive.'
            : 'Removed property ' + payload.reference_number + ' from the exclusive showcase.',
          branchId: payload.branch_id,
          propertyId: savedPropertyId
        });
      } else if (payload.exclusive_property) {
        await logActivity({
          actionType: 'EXCLUSIVE_PROPERTY_UPDATED',
          description: 'Updated exclusive property ' + payload.reference_number + '.',
          branchId: payload.branch_id,
          propertyId: savedPropertyId
        });
      }
      mediaPermissionProperty = {
        id: savedPropertyId,
        branchId: payload.branch_id,
        ref: payload.reference_number
      };
      successMessage = 'Property updated successfully.';
    } else {
      savedPropertyId = await createProperty(payload);
      await logActivity({
        actionType: 'PROPERTY_CREATED',
        description: 'Created property ' + payload.reference_number + ' with a ' + payload.currency_code + ' price of ' + formatPrice(payload.price, payload.purpose, payload.currency_code) + '.',
        branchId: payload.branch_id,
        propertyId: savedPropertyId
      });
      if (payload.exclusive_property) {
        await logActivity({
          actionType: 'PROPERTY_EXCLUSIVE_ENABLED',
          description: 'Created property ' + payload.reference_number + ' as an exclusive listing.',
          branchId: payload.branch_id,
          propertyId: savedPropertyId
        });
      }
      mediaPermissionProperty = {
        id: savedPropertyId,
        branchId: payload.branch_id,
        ref: payload.reference_number
      };
      successMessage = 'Property created successfully.';
    }

    if (hasPendingMediaOrDocumentFiles()) {
      await uploadPropertyMedia(savedPropertyId, mediaPermissionProperty);
    }

    showToast(successMessage, 'success');
    closeModal();
    await loadPropertyModuleData();
  } catch (error) {
    console.warn('Property save failed.', error);
    showToast(error.message || 'Unable to save property.', 'error');
  } finally {
    isPropertySavePending = false;
    modalSaveBtn.disabled = false;
    modalSaveBtn.removeAttribute('aria-busy');
    modalSaveBtn.textContent = 'Save Property';
  }
});


/* ══════════════════════════════════════════════════════════════
   14. IMAGE UPLOAD PREVIEW
══════════════════════════════════════════════════════════════ */

// Clicking the "Browse Images" button triggers the file input
btnBrowseImages.addEventListener('click', function() {
  imageFileInput.click();
});

// Clicking anywhere on the drop zone also opens file picker
imageDropZone.addEventListener('click', function(e) {
  if (e.target !== btnBrowseImages) {
    imageFileInput.click();
  }
});

// Drag-and-drop events
imageDropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  imageDropZone.classList.add('drag-over');
});
imageDropZone.addEventListener('dragleave', function() {
  imageDropZone.classList.remove('drag-over');
});
imageDropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  imageDropZone.classList.remove('drag-over');
  handleImageFiles(e.dataTransfer.files);
});

// File input change
imageFileInput.addEventListener('change', function() {
  handleImageFiles(imageFileInput.files);
  // Reset so the same file can be re-selected if removed
  imageFileInput.value = '';
});

/**
 * Reads selected image files and creates preview thumbnails.
 * The first image is tagged as the cover.
 */
function handleImageFiles(files) {
  Array.from(files).forEach(function(file) {
    try {
      validateImageFile(file);
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(ev) {
      var dataUrl = ev.target.result;
      stagedImages.push({
        file: file,
        previewUrl: dataUrl
      });
      addImagePreview(dataUrl, stagedImages.length === 1);
    };
    reader.readAsDataURL(file);
  });
}

function addImagePreview(src, isCover) {
  var index = imagePreviewGrid.children.length;
  var thumb = document.createElement('div');
  thumb.className = 'preview-thumb';
  thumb.innerHTML =
    '<img src="' + src + '" alt="Preview" />' +
    (isCover ? '<span class="preview-cover-tag">Cover</span>' : '') +
    '<button type="button" class="preview-remove" data-index="' + index + '">×</button>';

  thumb.querySelector('.preview-remove').addEventListener('click', function() {
    var idx = parseInt(this.dataset.index);
    stagedImages.splice(idx, 1);
    // Re-render all previews
    imagePreviewGrid.innerHTML = '';
    stagedImages.forEach(function(s, i) {
      addImagePreview(s.previewUrl, i === 0);
    });
  });

  imagePreviewGrid.appendChild(thumb);
}


/* ══════════════════════════════════════════════════════════════
   15. DOCUMENT UPLOAD — FILE NAME DISPLAY
   Shows the selected file name and validates documents before upload.
══════════════════════════════════════════════════════════════ */

function setupDocInput(inputId, nameId) {
  var input = document.getElementById(inputId);
  var nameEl = document.getElementById(nameId);
  if (!input || !nameEl) return;
  input.addEventListener('change', function() {
    if (input.files[0]) {
      try {
        validateDocumentFile(input.files[0]);
      } catch (error) {
        input.value = '';
        nameEl.textContent = 'Choose file';
        showToast(error.message, 'error');
        return;
      }
    }

    nameEl.textContent = input.files[0] ? input.files[0].name : 'Choose file';
  });
}

function resetDocumentFileLabels() {
  ['docFloorPlanName', 'docTitleDeedName', 'docLeaseName', 'docOtherName'].forEach(function(id) {
    var label = document.getElementById(id);
    if (label) label.textContent = 'Choose file';
  });
}

function clearPropertyMediaInputs() {
  stagedImages = [];
  imagePreviewGrid.innerHTML = '';
  if (imageFileInput) imageFileInput.value = '';
  ['docFloorPlan', 'docTitleDeed', 'docLease', 'docOther'].forEach(function(id) {
    var input = document.getElementById(id);
    if (input) input.value = '';
  });
  resetDocumentFileLabels();
}
setupDocInput('docFloorPlan',  'docFloorPlanName');
setupDocInput('docTitleDeed',  'docTitleDeedName');
setupDocInput('docLease',      'docLeaseName');
setupDocInput('docOther',      'docOtherName');


/* ══════════════════════════════════════════════════════════════
   16. MOBILE SIDEBAR TOGGLE
   Reuses the same pattern from Module 1 (script.js),
   but only if sidebar / hamburger exist on this page.
══════════════════════════════════════════════════════════════ */

var hamburgerBtn   = document.getElementById('hamburger');
var sidebar        = document.getElementById('sidebar');
var sidebarOverlay = document.getElementById('sidebarOverlay');

if (hamburgerBtn && sidebar && sidebarOverlay) {
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    if (!propModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
  hamburgerBtn.addEventListener('click', function() {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay.addEventListener('click', function() {
    // If the modal is open, overlay click closes the modal, not the sidebar
    if (propModal.classList.contains('open')) {
      closeModal();
    } else {
      closeSidebar();
    }
  });
}


/* ══════════════════════════════════════════════════════════════
   17. TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════════ */

var toastTimer;
function showToast(message, type) {
  type = type || 'success';
  toastEl.textContent = message;
  toastEl.className = 'toast ' + type;
  // Trigger show (small delay ensures transition fires)
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      toastEl.classList.add('show');
    });
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toastEl.classList.remove('show');
  }, 3200);
}


/* ══════════════════════════════════════════════════════════════
   18. INITIAL RENDER ON PAGE LOAD
══════════════════════════════════════════════════════════════ */

currentCategory = getCategoryFromUrl();
replaceInvalidCategoryUrl();
updateCategoryInterface();
loadPropertyModuleData();
