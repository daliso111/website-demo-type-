/* ============================================================
   HILLTOP PROPERTIES ZAMBIA — MODULE 5: WEBSITE CMS
   cms.js
   Phase 6A: read-only Supabase CMS loading with demo fallback.
   ============================================================ */


/* ══════════════════════════════════════════════════════════════
   1. SAMPLE CMS DATA
   Used as fallback until supabase/cms-foundation.sql is run.
══════════════════════════════════════════════════════════════ */

// ── Homepage content object ──────────────────────────────────
var homepageContent = {
  heroHeadline:   'Find Your Perfect Property in Zambia',
  heroSubtitle:   'Hilltop Properties Zambia connects buyers, tenants, and investors with premium real estate in Lusaka and Livingstone.',
  ctaText:        'Browse Properties',
  ctaLink:        'https://hilltopzambia.com/properties',
  aboutText:      'Hilltop Properties Zambia has been a trusted name in the Zambian real estate market for over a decade, offering personalised service across both residential and commercial sectors.',
  servicesText:   '+260 979 972019\nPROBRYMALYANGO@GMAIL.COM\nKabulonga, Lusaka, Zambia',
  heroVideoUrl:   '',
  heroPosterUrl:  '',
  heroVideoUpdatedAt: ''
};

var WHY_HILLTOP_DEFAULTS = {
  videoUrl: '',
  posterUrl: '',
  eyebrow: 'WHY HILLTOP',
  title: 'The Hilltop Advantage',
  cards: [
    {
      title: 'Verified Listings',
      short: 'Public listings are presented with clear status, branch, and property details.',
      expanded: 'Hilltop reviews property details, location, ownership information, pricing, and status before presenting listings to clients.',
      cta: 'Talk to Hilltop'
    },
    {
      title: 'Branch Support',
      short: 'Lusaka and Livingstone teams help route enquiries to the right office.',
      expanded: 'Branch teams help coordinate enquiries, viewings, follow-ups, and client support across Hilltop’s operating locations.',
      cta: 'Talk to Hilltop'
    },
    {
      title: 'Trusted Agents',
      short: 'Clients know who they are dealing with.',
      expanded: 'Staff profiles, branch contacts, and guided communication help clients move with more confidence.',
      cta: 'Talk to Hilltop'
    }
  ]
};

function cloneWhyHilltopDefaults() {
  return JSON.parse(JSON.stringify(WHY_HILLTOP_DEFAULTS));
}

var whyHilltopHero = cloneWhyHilltopDefaults();
var selectedWhyHeroVideoFile = null;
var selectedWhyHeroPosterFile = null;
var whyHeroLocalVideoPreviewUrl = '';
var whyHeroLocalPosterPreviewUrl = '';
var testimonialBackgroundLocalPreviewUrl = '';

// ── Banners ──────────────────────────────────────────────────
// Later: supabase.from('banners').select('*')
var banners = [
  {
    id: 1,
    title:      'Premium Properties in Lusaka',
    subtitle:   'Explore executive homes, apartments, and investment opportunities in the heart of Lusaka.',
    branch:     'Lusaka',
    btnText:    'View Lusaka Properties',
    btnLink:    '#',
    status:     'Published',
    imageNote:  'Lusaka City Banner'
  },
  {
    id: 2,
    title:      'Invest in Livingstone Real Estate',
    subtitle:   'Riverside lodges, rental cottages, and prime land near Victoria Falls — a growing market.',
    branch:     'Livingstone',
    btnText:    'Explore Livingstone',
    btnLink:    '#',
    status:     'Published',
    imageNote:  'Livingstone/Victoria Falls Banner'
  },
  {
    id: 3,
    title:      'Hilltop Properties — Trusted Across Zambia',
    subtitle:   'Two branches, one standard of excellence. Find your next property with Hilltop.',
    branch:     'All',
    btnText:    'Contact Us Today',
    btnLink:    '#',
    status:     'Draft',
    imageNote:  'General Brand Banner'
  }
];

// ── Team Profiles ─────────────────────────────────────────────
// Later: supabase.from('team_profiles').select('*')
var teamProfiles = [
  {
    id: 1,
    name:       'Admin User',
    jobTitle:   'Managing Director',
    branch:     'All',
    phone:      '+260 97 123 4567',
    email:      'admin@hilltopzambia.com',
    bio:        'Founder and MD of Hilltop Properties Zambia. Over 15 years of experience in Zambian real estate.',
    status:     'Visible'
  },
  {
    id: 2,
    name:       'John Phiri',
    jobTitle:   'Senior Property Agent',
    branch:     'Lusaka',
    phone:      '+260 96 234 5678',
    email:      'john.phiri@hilltopzambia.com',
    bio:        'John specialises in high-value residential sales in Lusaka\'s premium neighbourhoods including Kabulonga and Roma.',
    status:     'Visible'
  },
  {
    id: 3,
    name:       'Mary Banda',
    jobTitle:   'Lettings Manager',
    branch:     'Lusaka',
    phone:      '+260 95 345 6789',
    email:      'mary.banda@hilltopzambia.com',
    bio:        'Mary manages the Lusaka lettings portfolio and client follow-ups. Known for her warm client communication style.',
    status:     'Visible'
  },
  {
    id: 4,
    name:       'David Mwale',
    jobTitle:   'Branch Manager — Livingstone',
    branch:     'Livingstone',
    phone:      '+260 97 456 7890',
    email:      'david.mwale@hilltopzambia.com',
    bio:        'David leads the Livingstone office and has deep knowledge of the tourism and investment property market near Victoria Falls.',
    status:     'Visible'
  },
  {
    id: 5,
    name:       'Grace Mbewe',
    jobTitle:   'Marketing & CMS Officer',
    branch:     'Lusaka',
    phone:      '+260 96 567 8901',
    email:      'grace.mbewe@hilltopzambia.com',
    bio:        'Grace handles digital marketing, social media, and website content updates for Hilltop Properties Zambia.',
    status:     'Hidden'
  }
];

// ── Testimonials ──────────────────────────────────────────────
// Later: supabase.from('testimonials').select('*')
var testimonials = [
  {
    id: 1,
    clientName:  'Mr. Chanda Mulenga',
    clientType:  'Buyer',
    message:     'Hilltop Properties made buying our family home in Kabulonga completely stress-free. John was professional, honest, and always available. We could not be happier.',
    rating:      5,
    backgroundType: 'image',
    backgroundImageUrl: 'assets/images/hero-poster.png',
    backgroundColor: '#071827',
    branch:      'Lusaka',
    status:      'Published'
  },
  {
    id: 2,
    clientName:  'Ms. Thandiwe Nkosi',
    clientType:  'Tenant',
    message:     'I\'ve been renting through Hilltop for two years now and the process has always been smooth. Mary is incredibly helpful and responds quickly to any issues.',
    rating:      5,
    backgroundType: 'image',
    backgroundImageUrl: 'assets/images/hero-poster.png',
    backgroundColor: '#071827',
    branch:      'Lusaka',
    status:      'Published'
  },
  {
    id: 3,
    clientName:  'Mr. Peter Zimba',
    clientType:  'Landlord',
    message:     'Hilltop manages two of my properties and I\'ve had zero headaches. They find quality tenants and handle everything professionally. Highly recommended.',
    rating:      4,
    backgroundType: 'solid',
    backgroundImageUrl: '',
    backgroundColor: '#0b1f2f',
    branch:      'Lusaka',
    status:      'Published'
  },
  {
    id: 4,
    clientName:  'Ms. Luyando Sikufele',
    clientType:  'Investor',
    message:     'I was looking for riverside investment land near Livingstone and David helped me find an exceptional plot. The whole experience was excellent.',
    rating:      5,
    backgroundType: 'solid',
    backgroundImageUrl: '',
    backgroundColor: '#132c46',
    branch:      'Livingstone',
    status:      'Pending'
  }
];

// ── Featured Properties ───────────────────────────────────────
// Later: supabase.from('featured_properties').select('*')
var featuredProperties = [
  {
    id: 1,
    ref:        'HT-LSK-001',
    title:      '4-Bedroom Executive House in Kabulonga',
    branch:     'Lusaka',
    purpose:    'For Sale',
    price:      'ZMW 2,400,000',
    propStatus: 'Active',
    featured:   true,
    order:      1
  },
  {
    id: 2,
    ref:        'HT-LSK-003',
    title:      'Commercial Office Space — Cairo Road',
    branch:     'Lusaka',
    purpose:    'For Rent',
    price:      'ZMW 22,000 / month',
    propStatus: 'Under Offer',
    featured:   true,
    order:      2
  },
  {
    id: 3,
    ref:        'HT-LVN-002',
    title:      'Riverside Lodge Plot — Victoria Falls',
    branch:     'Livingstone',
    purpose:    'For Sale',
    price:      'ZMW 3,200,000',
    propStatus: 'Active',
    featured:   true,
    order:      3
  },
  {
    id: 4,
    ref:        'HT-LVN-004',
    title:      'Commercial Guesthouse — Maramba',
    branch:     'Livingstone',
    purpose:    'For Sale',
    price:      'ZMW 4,800,000',
    propStatus: 'Under Offer',
    featured:   true,
    order:      4
  }
];

var SERVICE_SHOWCASE_LAYOUT_BLUEPRINT = [
  {
    key: 'sales',
    id: 'sales',
    order: 1,
    title: 'Property Sales',
    badge: 'For Buyers & Sellers',
    description: 'Helping buyers, sellers, and investors find, list, and move forward with verified residential, land, and commercial property opportunities.',
    highlights: [
      'Market valuation and pricing guidance',
      'Verified listings coordinated with property owners',
      'Investment support for yields and growth'
    ],
    iconKey: 'sales',
    visualTheme: 'sales',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Property sales service',
    label: 'Top Left Card'
  },
  {
    key: 'rentals',
    id: 'rentals',
    order: 2,
    title: 'Property Rentals',
    badge: 'For Tenants & Landlords',
    description: 'Supporting tenants and landlords with rental matching, enquiries, viewings, and branch-level coordination.',
    highlights: [
      'Tenant screening and references',
      'Flexible lease coordination',
      'Lusaka and Livingstone branch support'
    ],
    iconKey: 'rentals',
    visualTheme: 'rentals',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Property rentals service',
    label: 'Top Right Card'
  },
  {
    key: 'marketing',
    id: 'marketing',
    order: 3,
    title: 'Property Marketing',
    badge: 'Digital Reach',
    description: 'Presenting properties professionally through photos, descriptions, references, website listings, social media, and enquiry support.',
    highlights: [
      'Clean listings and photography',
      'Dedicated social media reach',
      'Immediate branch lead routing'
    ],
    iconKey: 'marketing',
    visualTheme: 'marketing',
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Property marketing service',
    isCaseStudy: true,
    caseStudyLabel: 'View Case Study',
    caseStudyUrl: 'services.html',
    label: 'Middle Featured Video Card'
  },
  {
    key: 'verification',
    id: 'verification',
    order: 4,
    title: 'Property Verification',
    badge: 'Trust & Compliance',
    description: 'Checking listing details, ownership information, documents, location, pricing, and property status before properties are presented publicly.',
    highlights: [
      'Ownership and boundary confirmation',
      'On-site coordinates and photo verification',
      'Fair pricing against local benchmarks'
    ],
    iconKey: 'verification',
    visualTheme: 'verification',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Property verification service',
    label: 'Bottom Left Card'
  },
  {
    key: 'branch-support',
    id: 'support',
    order: 5,
    title: 'Branch Support',
    badge: 'Branch Network',
    description: 'Lusaka and Livingstone branch teams support enquiries, property viewings, follow-ups, and client guidance.',
    highlights: [
      'Regional specialists in key locations',
      'Coordinated site visits',
      'In-person branch staff support'
    ],
    iconKey: 'branch-support',
    visualTheme: 'support',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Branch support service',
    label: 'Bottom Right Card'
  }
];

var serviceShowcaseItems = buildDefaultServiceShowcaseItems('demo-service-');

// ── News / Articles ───────────────────────────────────────────
// Later: supabase.from('articles').select('*')
var articles = [
  {
    id: 1,
    title:      'Why Invest in Lusaka Real Estate in 2025',
    category:   'Investment',
    author:     'Admin User',
    summary:    'Lusaka\'s expanding middle class, infrastructure investment, and growing demand for quality housing make it one of Africa\'s most compelling real estate markets.',
    body:       '',
    publishDate:'15 January 2025',
    status:     'Published',
    branch:     'Lusaka'
  },
  {
    id: 2,
    title:      'Livingstone Property Market Opportunities',
    category:   'Market Update',
    author:     'David Mwale',
    summary:    'Tourism growth and international interest are driving demand for lodges, guesthouses, and riverside land near Victoria Falls.',
    body:       '',
    publishDate:'22 February 2025',
    status:     'Published',
    branch:     'Livingstone'
  },
  {
    id: 3,
    title:      'Tips for First-Time Property Buyers in Zambia',
    category:   'Buyer Guide',
    author:     'Mary Banda',
    summary:    'Buying property for the first time can be overwhelming. Here are the key steps every first-time buyer in Zambia needs to know before signing anything.',
    body:       '',
    publishDate:'10 March 2025',
    status:     'Draft',
    branch:     'All'
  }
];

// ID counters for new records
var nextBannerId      = 10;
var nextTeamId        = 10;
var nextTestimonialId = 10;
var nextArticleId     = 10;


/* ══════════════════════════════════════════════════════════════
   2. STATE
══════════════════════════════════════════════════════════════ */

var currentBranch    = 'all';
var currentSearch    = '';
var currentStatus    = 'all';
var activeSection    = 'homepage';
// Which type the modal is currently working on: 'banner'|'team'|'testimonial'|'article'
var modalContentType = '';
var modalMode        = 'add'; // 'add' or 'edit'
var modalEditId      = null;
var cmsUsingSupabase = false;
var cmsTablesAvailable = false;
var cmsCurrentUser = null;
var cmsStaffUsers = [];
var cmsProperties = [];
var HERO_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
var HERO_VIDEO_MIN_SECONDS = 30;
var WHY_HILLTOP_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
var SERVICE_CASE_STUDY_VIDEO_MAX_BYTES = 30 * 1024 * 1024;
var SERVICE_SHOWCASE_ICON_KEYS = ['sales', 'rentals', 'verification', 'branch-support', 'marketing'];
var SERVICE_SHOWCASE_THEMES = ['sales', 'rentals', 'verification', 'support', 'marketing'];
var WHY_HILLTOP_SETTING_KEYS = [
  'homepage_why_hero_video_url',
  'homepage_why_hero_poster_url',
  'homepage_why_hero_eyebrow',
  'homepage_why_hero_title',
  'homepage_why_card_1_title',
  'homepage_why_card_1_short',
  'homepage_why_card_1_expanded',
  'homepage_why_card_1_cta',
  'homepage_why_card_2_title',
  'homepage_why_card_2_short',
  'homepage_why_card_2_expanded',
  'homepage_why_card_2_cta',
  'homepage_why_card_3_title',
  'homepage_why_card_3_short',
  'homepage_why_card_3_expanded',
  'homepage_why_card_3_cta'
];


/* ══════════════════════════════════════════════════════════════
   3. DOM REFERENCES
══════════════════════════════════════════════════════════════ */

var cmsModal        = document.getElementById('cmsModal');
var modalOverlay    = document.getElementById('modalOverlay');
var cmsModalTitle   = document.getElementById('cmsModalTitle');
var cmsModalSubtitle= document.getElementById('cmsModalSubtitle');
var cmsModalBody    = document.getElementById('cmsModalBody');
var cmsModalClose   = document.getElementById('cmsModalClose');
var cmsModalCancel  = document.getElementById('cmsModalCancel');
var cmsModalSave    = document.getElementById('cmsModalSave');
var toastEl         = document.getElementById('toast');
var cmsSearch       = document.getElementById('cmsSearch');
var cmsStatusFilter = document.getElementById('cmsStatusFilter');


/* ══════════════════════════════════════════════════════════════
   4. UTILITY HELPERS
══════════════════════════════════════════════════════════════ */

// Show a brief toast notification
var toastTimer;
function showToast(msg, type) {
  type = type || 'success';
  toastEl.textContent = msg;
  toastEl.className = 'toast ' + type;
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){ toastEl.classList.add('show'); });
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 3200);
}

// Get badge class for various status strings
function getBadgeClass(status) {
  var map = {
    'Published': 'badge-active',
    'Active':    'badge-active',
    'Visible':   'badge-active',
    'Draft':     'badge-draft',
    'Hidden':    'badge-withdrawn',
    'Pending':   'badge-offer',
    'Featured':  'badge-let',
    'Not Featured': 'badge-draft',
    'Under Offer':  'badge-offer',
    'Sold':      'badge-sold',
    'Let / Rented': 'badge-let',
    'Withdrawn': 'badge-withdrawn'
  };
  return map[status] || 'badge-draft';
}

// Render N filled stars as ★ and empty as ☆
function renderStars(n) {
  var s = '';
  for (var i = 1; i <= 5; i++) { s += (i <= n) ? '★' : '☆'; }
  return s;
}

// Get first letter(s) for avatars
function initials(name) {
  return name.split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase();
}

// Branch match helper (compares lowercase)
function branchMatch(itemBranch) {
  if (currentBranch === 'all') return true;
  var ib = itemBranch.toLowerCase();
  return ib === currentBranch || ib === 'all';
}

// Search match helper
function searchMatch(str) {
  if (!currentSearch) return true;
  return str.toLowerCase().includes(currentSearch.toLowerCase());
}

// Status match helper
function statusMatch(s) {
  if (currentStatus === 'all') return true;
  return s === currentStatus;
}

function getSupabaseClient() {
  return window.hilltopSupabase || null;
}

function waitForCurrentStaffProfile() {
  return new Promise(function(resolve, reject) {
    var attempts = 0;
    var maxAttempts = 100;

    function check() {
      if (window.hilltopCurrentUser) {
        resolve(window.hilltopCurrentUser);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('Staff profile was not loaded by auth-guard.js.'));
        return;
      }

      setTimeout(check, 100);
    }

    check();
  });
}

function isMissingCmsTableError(error) {
  if (!error) return false;
  var msg = String(error.message || error.details || error.hint || '').toLowerCase();
  return error.code === '42P01' ||
    (msg.indexOf('cms_') !== -1 && (
      msg.indexOf('does not exist') !== -1 ||
      msg.indexOf('not found') !== -1 ||
      msg.indexOf('schema cache') !== -1
    ));
}

function phase6BToast(kind) {
  showToast(kind + ' is planned for a later phase.', 'error');
}

function getCurrentCmsRole() {
  var role = String((cmsCurrentUser || window.hilltopCurrentUser || {}).role || '').toLowerCase().replace(/\s+/g, '_');
  return role;
}

function canManageCms() {
  return getCurrentCmsRole() === 'super_admin';
}

function requireCmsManagePermission() {
  if (canManageCms()) return true;
  showToast('You do not have permission to manage website content.', 'error');
  return false;
}

function requireCmsMediaPermission() {
  if (canManageCms()) return true;
  showToast('You do not have permission to manage website media.', 'error');
  return false;
}

function cmsActionHtml(html) {
  return canManageCms() ? html : '';
}

function applyCmsPermissions() {
  if (canManageCms()) return;
  document.querySelectorAll('#btnHpDraft,#btnHpPublish,#btnHeroVideoSave,#btnWhyHeroSave,#btnAddBanner,#btnAddTeam,#btnAddTestimonial,#btnAddFeatured,#btnAddArticle,#cmsModalSave,#propertyServicesSave').forEach(function(btn) {
    if (btn) btn.style.display = 'none';
  });
}

function escapeAttribute(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeCmsHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function quoteId(id) {
  return '\'' + String(id).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\'';
}

function formatCmsPrice(price, purpose, currencyCode, billingPeriod) {
  return window.HilltopCurrency.formatPropertyPrice(
    price,
    currencyCode,
    purpose,
    billingPeriod
  );
}

function mapHomepageContent(row) {
  return {
    id: row ? row.id : null,
    heroHeadline: row ? (row.hero_title || '') : '',
    heroSubtitle: row ? (row.hero_subtitle || '') : '',
    ctaText: row ? (row.hero_button_text || '') : '',
    ctaLink: row ? (row.hero_button_link || '') : '',
    aboutText: row ? (row.about_content || row.about_title || '') : '',
    servicesText: row ? ([row.contact_phone, row.contact_email, row.contact_address].filter(Boolean).join('\n')) : '',
    heroVideoUrl: homepageContent.heroVideoUrl || '',
    heroPosterUrl: homepageContent.heroPosterUrl || '',
    heroVideoUpdatedAt: homepageContent.heroVideoUpdatedAt || ''
  };
}

function settingValueUrl(row) {
  if (!row || !row.setting_value) return '';
  if (typeof row.setting_value === 'string') return row.setting_value;
  return row.setting_value.url || row.setting_value.value || '';
}

function settingValueText(row) {
  if (!row || !row.setting_value) return '';
  if (typeof row.setting_value === 'string') return row.setting_value;
  return row.setting_value.text || row.setting_value.value || row.setting_value.url || '';
}

function mapHeroSettings(rows) {
  var lookup = {};
  (rows || []).forEach(function(row) {
    lookup[row.setting_key] = row;
  });
  return {
    videoUrl: settingValueUrl(lookup.homepage_hero_video_url),
    posterUrl: settingValueUrl(lookup.homepage_hero_poster_url),
    updatedAt: settingValueUrl(lookup.homepage_hero_video_updated_at)
  };
}

function mapWhyHilltopSettings(rows) {
  var lookup = {};
  (rows || []).forEach(function(row) {
    lookup[row.setting_key] = row;
  });

  var mapped = cloneWhyHilltopDefaults();
  mapped.videoUrl = settingValueUrl(lookup.homepage_why_hero_video_url) || mapped.videoUrl;
  mapped.posterUrl = settingValueUrl(lookup.homepage_why_hero_poster_url) || mapped.posterUrl;
  mapped.eyebrow = settingValueText(lookup.homepage_why_hero_eyebrow) || mapped.eyebrow;
  mapped.title = settingValueText(lookup.homepage_why_hero_title) || mapped.title;

  for (var i = 0; i < mapped.cards.length; i += 1) {
    var cardNumber = i + 1;
    mapped.cards[i].title = settingValueText(lookup['homepage_why_card_' + cardNumber + '_title']) || mapped.cards[i].title;
    mapped.cards[i].short = settingValueText(lookup['homepage_why_card_' + cardNumber + '_short']) || mapped.cards[i].short;
    mapped.cards[i].expanded = settingValueText(lookup['homepage_why_card_' + cardNumber + '_expanded']) || mapped.cards[i].expanded;
    mapped.cards[i].cta = settingValueText(lookup['homepage_why_card_' + cardNumber + '_cta']) || mapped.cards[i].cta;
  }

  return mapped;
}

function mapBanner(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    branch: 'All',
    btnText: row.button_text || '',
    btnLink: row.button_link || '',
    status: row.is_active ? 'Published' : 'Draft',
    imageUrl: row.image_url || '',
    imageNote: row.image_url || 'CMS banner image',
    order: row.display_order || 0
  };
}

function mapTeamProfile(row, staffLookup) {
  var staff = row.staff_user_id ? staffLookup[String(row.staff_user_id)] : null;
  return {
    id: row.id,
    name: row.display_name || (staff ? staff.full_name : 'Unnamed Team Member'),
    jobTitle: row.role_title || (staff ? staff.role : ''),
    branch: 'All',
    phone: staff ? (staff.phone || 'Not provided') : 'Not provided',
    email: staff ? (staff.email || 'Not provided') : 'Not provided',
    bio: row.bio || '',
    status: row.is_visible ? 'Visible' : 'Hidden',
    order: row.display_order || 0,
    staffUserId: row.staff_user_id || '',
    photoUrl: row.photo_url || ''
  };
}

function mapTestimonial(row) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientType: row.client_role || '',
    message: row.message,
    rating: row.rating || 5,
    backgroundType: row.background_type || 'solid',
    backgroundImageUrl: row.background_image_url || '',
    backgroundColor: row.background_color || '#071827',
    branch: 'All',
    status: row.is_visible ? 'Published' : 'Hidden',
    order: row.display_order || 0
  };
}

function mapFeaturedProperty(row, propertyLookup) {
  var property = propertyLookup[String(row.property_id)];
  if (!property) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    ref: property.reference_number || '',
    title: property.title || 'Untitled property',
    branch: 'All',
    purpose: property.purpose || 'For Sale',
    price: formatCmsPrice(property.price, property.purpose, property.currency_code, property.billing_period),
    propStatus: property.status || 'Draft',
    featured: row.is_visible,
    order: row.display_order || 0
  };
}

function mapServiceShowcaseItem(row) {
  return {
    id: row.id,
    order: row.display_order || 0,
    active: Boolean(row.is_active),
    status: row.is_active ? 'Active' : 'Hidden',
    title: row.title || '',
    badge: row.badge || '',
    description: row.description || '',
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    iconKey: row.icon_key || '',
    imageUrl: row.image_url || '',
    imageAlt: row.image_alt || '',
    visualTheme: row.visual_theme || '',
    isCaseStudy: Boolean(row.is_case_study),
    caseStudyLabel: row.case_study_label || 'View Case Study',
    caseStudyUrl: row.case_study_url || '',
    hoverVideoUrl: row.hover_video_url || '',
    hoverVideoPosterUrl: row.hover_video_poster_url || ''
  };
}

function buildDefaultServiceShowcaseItems(idPrefix) {
  return SERVICE_SHOWCASE_LAYOUT_BLUEPRINT.map(function(item) {
    return {
      id: String(idPrefix || '') + item.id,
      order: item.order,
      active: true,
      status: 'Active',
      title: item.title,
      badge: item.badge,
      description: item.description,
      highlights: item.highlights.slice(),
      iconKey: item.iconKey,
      imageUrl: item.imageUrl || '',
      imageAlt: item.imageAlt || item.title,
      visualTheme: item.visualTheme,
      isCaseStudy: Boolean(item.isCaseStudy),
      caseStudyLabel: item.caseStudyLabel || 'View Case Study',
      caseStudyUrl: item.caseStudyUrl || '',
      hoverVideoUrl: '',
      hoverVideoPosterUrl: ''
    };
  });
}

function getServiceShowcaseLayoutByKey(key) {
  return SERVICE_SHOWCASE_LAYOUT_BLUEPRINT.find(function(layout) {
    return layout.key === key;
  }) || null;
}

function serviceShowcaseLayoutKey(item) {
  var iconKey = String(item && item.iconKey || '').toLowerCase();
  var title = String(item && item.title || '').toLowerCase();

  if (iconKey === 'sales') return 'sales';
  if (iconKey === 'rentals') return 'rentals';
  if (iconKey === 'marketing') return 'marketing';
  if (iconKey === 'verification') return 'verification';
  if (iconKey === 'branch-support') return 'branch-support';
  if (iconKey) return '';

  if (title === 'property sales') return 'sales';
  if (title === 'property rentals') return 'rentals';
  if (title === 'property marketing') return 'marketing';
  if (title === 'property verification') return 'verification';
  if (title === 'branch support') return 'branch-support';
  return '';
}

function servicePanelDomKey(key) {
  return String(key || '').replace(/[^a-z0-9]+/g, '_');
}

function servicePanelFieldId(layoutKey, fieldName) {
  return 'svc_' + servicePanelDomKey(layoutKey) + '_' + fieldName;
}

function getServiceShowcaseItemByLayoutKey(layoutKey) {
  return serviceShowcaseItems.find(function(item) {
    return serviceShowcaseLayoutKey(item) === layoutKey;
  }) || null;
}

function getServiceShowcasePanelItem(layout) {
  return getServiceShowcaseItemByLayoutKey(layout.key) || buildDefaultServiceShowcaseItems('new-service-').find(function(item) {
    return serviceShowcaseLayoutKey(item) === layout.key;
  }) || {
    id: 'new-service-' + layout.key,
    order: layout.order,
    active: true,
    status: 'Active',
    title: layout.title,
    badge: layout.badge,
    description: layout.description,
    highlights: layout.highlights.slice(),
    iconKey: layout.iconKey,
    imageUrl: '',
    imageAlt: layout.title,
    visualTheme: layout.visualTheme,
    isCaseStudy: Boolean(layout.isCaseStudy),
    caseStudyLabel: layout.caseStudyLabel || 'View Case Study',
    caseStudyUrl: '',
    hoverVideoUrl: '',
    hoverVideoPosterUrl: ''
  };
}

function getServiceShowcaseLayoutMeta(item) {
  var key = serviceShowcaseLayoutKey(item);
  return SERVICE_SHOWCASE_LAYOUT_BLUEPRINT.find(function(layout) {
    return layout.key === key;
  }) || {
    key: key || 'custom',
    label: 'Custom Card',
    title: item && item.title ? item.title : 'Custom Service'
  };
}

function getServiceShowcasePreviewImage(item) {
  return item.hoverVideoPosterUrl || item.imageUrl || '';
}

function getServiceShowcasePayloadFromBlueprint(item) {
  return {
    display_order: item.order,
    is_active: true,
    title: item.title,
    badge: item.badge,
    description: item.description,
    highlights: item.highlights.slice(0, 3),
    icon_key: item.iconKey,
    image_url: item.imageUrl || null,
    image_alt: item.imageAlt || item.title,
    visual_theme: item.visualTheme,
    is_case_study: Boolean(item.isCaseStudy),
    case_study_label: item.caseStudyLabel || 'View Case Study',
    case_study_url: item.caseStudyUrl || null,
    hover_video_url: null,
    hover_video_poster_url: null,
    updated_at: new Date().toISOString()
  };
}

function getCurrentStaffId() {
  return (cmsCurrentUser || window.hilltopCurrentUser || {}).id || null;
}

function cleanValue(value) {
  var text = String(value || '').trim();
  return text || null;
}

function fieldValue(fieldId) {
  var el = document.getElementById(fieldId);
  return el ? el.value.trim() : '';
}

function selectedRating() {
  var checked = document.querySelector('input[name="mf_rating"]:checked');
  return checked ? Number(checked.value) : null;
}

function selectedFile(fieldId) {
  var input = document.getElementById(fieldId);
  return input && input.files && input.files.length ? input.files[0] : null;
}

function revokeTestimonialBackgroundLocalPreview() {
  if (testimonialBackgroundLocalPreviewUrl) {
    URL.revokeObjectURL(testimonialBackgroundLocalPreviewUrl);
    testimonialBackgroundLocalPreviewUrl = '';
  }
}

function renderTestimonialBackgroundPreview(src, message) {
  var preview = document.getElementById('testimonialBackgroundPreview');
  var status = document.getElementById('testimonialBackgroundUploadStatus');
  if (!preview) return;

  var imageUrl = String(src || '').trim();
  if (imageUrl) {
    preview.innerHTML = [
      '<img src="' + escapeAttribute(imageUrl) + '" alt="Testimonial background image preview" />',
      '<button class="testimonial-bg-preview-remove" type="button" id="testimonialBgRemove">Remove</button>'
    ].join('');
  } else {
    preview.innerHTML = '<div class="testimonial-bg-preview-empty">No testimonial background image selected.</div>';
  }

  if (status) status.textContent = message || '';

  var previewImage = preview.querySelector('img');
  if (previewImage && status) {
    previewImage.addEventListener('error', function () {
      status.textContent = 'Image preview could not load. Check that the URL is public and correct.';
    }, { once: true });
  }

  var removeButton = document.getElementById('testimonialBgRemove');
  if (removeButton) {
    removeButton.addEventListener('click', function () {
      revokeTestimonialBackgroundLocalPreview();
      var urlInput = document.getElementById('mf_backgroundImageUrl');
      var fileInput = document.getElementById('mf_backgroundImageFile');
      var typeInput = document.getElementById('mf_backgroundType');
      if (urlInput) urlInput.value = '';
      if (fileInput) fileInput.value = '';
      if (typeInput) typeInput.value = 'solid';
      renderTestimonialBackgroundPreview('', 'Background image removed. Save the testimonial to keep this change.');
    });
  }
}

async function handleTestimonialBackgroundFileChange(event) {
  var file = event.target && event.target.files && event.target.files[0];
  if (!file) return;

  var validationError = validateCmsImageFile(file);
  if (validationError) {
    showToast(validationError, 'error');
    event.target.value = '';
    return;
  }

  revokeTestimonialBackgroundLocalPreview();
  testimonialBackgroundLocalPreviewUrl = URL.createObjectURL(file);
  renderTestimonialBackgroundPreview(testimonialBackgroundLocalPreviewUrl, modalMode === 'edit'
    ? 'Uploading selected image...'
    : 'Image selected. It will upload when you save the testimonial.');

  var typeInput = document.getElementById('mf_backgroundType');
  if (typeInput) typeInput.value = 'image';

  if (modalMode !== 'edit' || !modalEditId) return;

  var uploadedUrl = await uploadCmsMedia('testimonials', modalEditId, file, {
    uploadingMessage: 'Uploading image...',
    successMessage: 'Image uploaded successfully.',
    errorMessage: 'Failed to upload image. Check storage setup and try again.'
  });

  if (!uploadedUrl) {
    renderTestimonialBackgroundPreview(testimonialBackgroundLocalPreviewUrl, 'Upload failed. You can try again or paste an image URL.');
    return;
  }

  var urlInput = document.getElementById('mf_backgroundImageUrl');
  if (urlInput) urlInput.value = uploadedUrl;
  event.target.value = '';
  revokeTestimonialBackgroundLocalPreview();
  renderTestimonialBackgroundPreview(uploadedUrl, 'Image uploaded successfully. Save the testimonial to publish this background.');
}

function initTestimonialBackgroundControls() {
  revokeTestimonialBackgroundLocalPreview();

  var urlInput = document.getElementById('mf_backgroundImageUrl');
  var fileInput = document.getElementById('mf_backgroundImageFile');
  var typeInput = document.getElementById('mf_backgroundType');

  renderTestimonialBackgroundPreview(urlInput ? urlInput.value : '');

  if (urlInput) {
    urlInput.addEventListener('input', function () {
      revokeTestimonialBackgroundLocalPreview();
      if (typeInput && urlInput.value.trim()) typeInput.value = 'image';
      renderTestimonialBackgroundPreview(urlInput.value, urlInput.value.trim() ? 'Previewing image URL. Save the testimonial to keep this URL.' : '');
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', handleTestimonialBackgroundFileChange);
  }
}

function getNextDisplayOrder(items) {
  if (!items || !items.length) return 1;
  return Math.max.apply(null, items.map(function(item) {
    return Number(item.order || 0);
  })) + 1;
}

function splitContactLines(text) {
  var lines = String(text || '').split('\n').map(function(line) {
    return line.trim();
  }).filter(Boolean);
  return {
    contact_phone: lines[0] || null,
    contact_email: lines[1] || null,
    contact_address: lines.slice(2).join('\n') || null
  };
}

function buildStaffOptions(selectedId) {
  var selected = String(selectedId || '');
  return ['<option value="">No linked staff user</option>'].concat(cmsStaffUsers.map(function(staff) {
    var id = String(staff.id);
    return '<option value="' + id + '"' + (id === selected ? ' selected' : '') + '>' +
      staff.full_name + ' - ' + staff.role +
      '</option>';
  })).join('');
}

function buildPropertyOptions(selectedId) {
  var selected = String(selectedId || '');
  return ['<option value="">Select a property</option>'].concat(cmsProperties.map(function(property) {
    var id = String(property.id);
    return '<option value="' + id + '"' + (id === selected ? ' selected' : '') + '>' +
      (property.reference_number || 'No ref') + ' - ' + (property.title || 'Untitled property') +
      '</option>';
  })).join('');
}

function safeFileName(name) {
  var parts = String(name || 'cms-media').split('.');
  var extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
  var base = parts.join('.').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'cms-media';
  return extension ? base + '.' + extension : base;
}

function validateCmsImageFile(file) {
  if (!file) return null;
  var allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.indexOf(file.type) === -1) {
    return 'Please upload a JPG, PNG, or WebP image.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'CMS media files must be 5MB or smaller.';
  }
  return null;
}

function validateServiceShowcaseVideoFile(file) {
  if (!file) return null;
  var allowedTypes = ['video/mp4', 'video/webm'];
  if (allowedTypes.indexOf(file.type) === -1) {
    return 'Please upload an MP4 or WebM video.';
  }
  if (file.size > SERVICE_CASE_STUDY_VIDEO_MAX_BYTES) {
    return 'Case study hover video must be 30MB or smaller.';
  }
  return null;
}

function setHeroVideoStatus(message, type) {
  var status = document.getElementById('heroVideoStatus');
  if (!status) return;
  status.textContent = message || '';
  status.className = 'hero-video-status' + (type ? ' ' + type : '');
}

function setWhyHeroStatus(message, type) {
  var status = document.getElementById('whyHeroStatus');
  if (!status) return;
  status.textContent = message || '';
  status.className = 'hero-video-status' + (type ? ' ' + type : '');
}

function validateHeroPosterFile(file) {
  return validateCmsImageFile(file);
}

function getVideoDuration(file) {
  return new Promise(function(resolve, reject) {
    var video = document.createElement('video');
    var objectUrl = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.onloadedmetadata = function() {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration || 0);
    };
    video.onerror = function() {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected video metadata could not be read.'));
    };
    video.src = objectUrl;
  });
}

async function validateHeroVideoFile(file) {
  if (!file) return null;
  var allowedTypes = ['video/mp4', 'video/webm'];
  if (allowedTypes.indexOf(file.type) === -1) {
    return 'Please upload an MP4 or WebM video.';
  }
  if (file.size > HERO_VIDEO_MAX_BYTES) {
    return 'Hero video must be 50MB or smaller.';
  }

  try {
    var duration = await getVideoDuration(file);
    if (duration < HERO_VIDEO_MIN_SECONDS) {
      return 'Hero video must be at least 30 seconds long.';
    }
  } catch (error) {
    console.warn('Hero video duration validation failed.', error);
    return 'Could not read the selected video. Please choose another MP4 or WebM file.';
  }

  return null;
}

function validateWhyHilltopVideoFile(file) {
  if (!file) return null;
  var allowedTypes = ['video/mp4', 'video/webm'];
  var fileName = String(file.name || '').toLowerCase();
  var allowedExtension = fileName.endsWith('.mp4') || fileName.endsWith('.webm');
  var videoFamily = String(file.type || '').indexOf('video/') === 0;
  if (allowedTypes.indexOf(file.type) === -1 && !allowedExtension && !videoFamily) {
    return 'Please upload an MP4 or WebM video.';
  }
  if (file.size > WHY_HILLTOP_VIDEO_MAX_BYTES) {
    return 'Video is too large. Maximum allowed size is 50MB.';
  }
  return null;
}

function buildHeroMediaPath(kind, file) {
  var safe = safeFileName(file.name);
  var extension = safe.indexOf('.') !== -1 ? safe.split('.').pop() : (kind === 'video' ? 'mp4' : 'jpg');
  return 'hero/hero-' + kind + '-' + Date.now() + '.' + extension;
}

async function uploadHeroMedia(kind, file) {
  if (!requireCmsMediaPermission()) return null;

  var supabase = getSupabaseClient();
  if (!supabase) {
    setHeroVideoStatus('Supabase is not available. Please check your connection and configuration.', 'error');
    return null;
  }

  var path = buildHeroMediaPath(kind, file);
  var uploadResult = await supabase.storage
    .from('cms-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadResult.error) {
    console.warn('Hero media upload failed.', uploadResult.error);
    throw new Error('Could not upload hero media. Run supabase/cms-media-storage.sql and try again.');
  }

  var publicUrlResult = supabase.storage
    .from('cms-media')
    .getPublicUrl(path);

  var publicUrl = publicUrlResult &&
    publicUrlResult.data &&
    publicUrlResult.data.publicUrl;

  if (!publicUrl) {
    throw new Error('Hero media uploaded, but the public URL could not be created.');
  }

  return publicUrl;
}

function buildWhyHilltopMediaPath(kind, file) {
  var safe = safeFileName(file.name);
  var extension = safe.indexOf('.') !== -1 ? safe.split('.').pop() : (kind === 'video' ? 'mp4' : 'jpg');
  if (kind === 'video') {
    return 'why-hilltop/why-video-' + Date.now() + '.' + extension;
  }
  return 'why-hilltop/why-poster-' + Date.now() + '.' + extension;
}

async function requireSupabaseUploadSession(supabase) {
  if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') {
    throw new Error('You must be logged in to upload CMS media.');
  }

  var sessionResult = await supabase.auth.getSession();
  if (sessionResult.error) {
    throw new Error(sessionResult.error.message || 'You must be logged in to upload CMS media.');
  }
  if (!sessionResult.data || !sessionResult.data.session) {
    throw new Error('You must be logged in to upload CMS media.');
  }
}

async function uploadWhyHilltopMedia(kind, file) {
  if (!requireCmsMediaPermission()) return null;

  var supabase = getSupabaseClient();
  if (!supabase) {
    setWhyHeroStatus('Supabase is not available. Please check your connection and configuration.', 'error');
    return null;
  }

  var path = buildWhyHilltopMediaPath(kind, file);
  try {
    await requireSupabaseUploadSession(supabase);
  } catch (error) {
    var authMessage = error && error.message ? error.message : 'You must be logged in to upload CMS media.';
    updateWhyHeroCmsDiagnostics({
      uploadAttempted: false,
      uploadPath: path,
      uploadError: authMessage
    });
    throw new Error(authMessage);
  }

  updateWhyHeroCmsDiagnostics({
    uploadAttempted: true,
    uploadPath: path,
    uploadError: ''
  });
  var uploadResult = await supabase.storage
    .from('cms-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadResult.error) {
    console.warn('Why Hilltop media upload failed.', uploadResult.error);
    var uploadMessage = uploadResult.error.message || 'Could not upload Why Hilltop media. Run supabase/cms-media-storage.sql and try again.';
    updateWhyHeroCmsDiagnostics({ uploadError: uploadMessage });
    throw new Error(uploadMessage);
  }

  var publicUrlResult = supabase.storage
    .from('cms-media')
    .getPublicUrl(path);

  var publicUrl = publicUrlResult &&
    publicUrlResult.data &&
    publicUrlResult.data.publicUrl;

  if (!publicUrl) {
    var publicUrlMessage = 'Why Hilltop media uploaded, but the public URL could not be created.';
    updateWhyHeroCmsDiagnostics({ uploadError: publicUrlMessage });
    throw new Error(publicUrlMessage);
  }

  updateWhyHeroCmsDiagnostics({ publicUrl: publicUrl });
  return publicUrl;
}

function buildCmsMediaPath(folder, recordId, file) {
  return [
    'cms',
    folder,
    recordId || 'temp',
    Date.now() + '-' + safeFileName(file.name)
  ].join('/');
}

async function uploadCmsMedia(folder, recordId, file, options) {
  options = options || {};
  if (!requireCmsMediaPermission()) return null;
  if (!recordId) {
    showToast('Save the CMS record before uploading media.', 'error');
    return null;
  }

  var validationError = validateCmsImageFile(file);
  if (validationError) {
    showToast(validationError, 'error');
    return null;
  }

  var supabase = getSupabaseClient();
  if (!supabase) {
    showToast('Supabase is not available. Please check your connection and configuration.', 'error');
    return null;
  }

  var path = buildCmsMediaPath(folder, recordId, file);
  showToast(options.uploadingMessage || 'Uploading image...', 'success');

  var uploadResult = await supabase.storage
    .from('cms-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadResult.error) {
    console.warn('CMS media upload failed.', uploadResult.error);
    showToast(options.errorMessage || 'Failed to upload image. Check storage setup and try again.', 'error');
    return null;
  }

  var publicUrlResult = supabase.storage
    .from('cms-media')
    .getPublicUrl(path);

  var publicUrl = publicUrlResult &&
    publicUrlResult.data &&
    publicUrlResult.data.publicUrl;

  if (!publicUrl) {
    console.warn('CMS media upload succeeded but no public URL was returned.', publicUrlResult);
    showToast('Image uploaded, but the public URL could not be created.', 'error');
    return null;
  }

  showToast(options.successMessage || 'Image uploaded successfully.', 'success');
  return publicUrl;
}

function buildServiceShowcaseMediaPath(kind, file, serviceKey) {
  var safe = safeFileName(file.name);
  var extension = safe.indexOf('.') !== -1 ? safe.split('.').pop() : (kind === 'video' ? 'mp4' : 'jpg');
  if (kind === 'video') {
    return 'services-showcase/videos/service-case-study-' + Date.now() + '.' + extension;
  }
  if (kind === 'poster') {
    return 'services-showcase/posters/service-case-study-poster-' + Date.now() + '.' + extension;
  }
  return 'services-showcase/images/service-' + servicePanelDomKey(serviceKey || 'service').replace(/_/g, '-') + '-' + Date.now() + '.' + extension;
}

async function uploadServiceShowcaseMedia(kind, file, serviceKey) {
  if (!requireCmsMediaPermission()) return null;

  var validationError = kind === 'video'
    ? validateServiceShowcaseVideoFile(file)
    : validateCmsImageFile(file);
  if (validationError) {
    showToast(validationError, 'error');
    return null;
  }

  var supabase = getSupabaseClient();
  if (!supabase) {
    showToast('Supabase is not available. Please check your connection and configuration.', 'error');
    return null;
  }

  var path = buildServiceShowcaseMediaPath(kind, file, serviceKey);
  showToast('Uploading Services Showcase media...', 'success');

  var uploadResult = await supabase.storage
    .from('cms-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadResult.error) {
    console.warn('Services Showcase media upload failed.', uploadResult.error);
    showToast('Could not upload Services Showcase media. Run supabase/services-showcase-cms.sql and try again.', 'error');
    return null;
  }

  var publicUrlResult = supabase.storage
    .from('cms-media')
    .getPublicUrl(path);

  var publicUrl = publicUrlResult &&
    publicUrlResult.data &&
    publicUrlResult.data.publicUrl;

  if (!publicUrl) {
    showToast('Services Showcase media uploaded, but the public URL could not be created.', 'error');
    return null;
  }

  showToast('Services Showcase media uploaded successfully.', 'success');
  return publicUrl;
}

async function logCmsActivity(actionType, description, propertyId) {
  var supabase = getSupabaseClient();
  if (!supabase || !getCurrentStaffId()) return;

  var result = await supabase.from('activity_logs').insert({
    action_type: actionType,
    description: description,
    property_id: propertyId || null,
    staff_user_id: getCurrentStaffId()
  });

  if (result.error) {
    console.warn('CMS activity log insert failed.', result.error);
  }
}

async function reloadCmsAfterWrite(successMessage) {
  await loadCMSData();
  showToast(successMessage, 'success');
}

function ensureCmsReadyForWrite() {
  if (!requireCmsManagePermission()) return false;
  if (!getSupabaseClient()) {
    showToast('Supabase is not available. Please check your connection and configuration.', 'error');
    return false;
  }
  if (!cmsTablesAvailable && !cmsUsingSupabase) {
    showToast('CMS tables are not available yet. Run supabase/cms-foundation.sql.', 'error');
    return false;
  }
  return true;
}

function getBannerPayload() {
  return {
    title: fieldValue('mf_title'),
    subtitle: cleanValue(fieldValue('mf_subtitle')),
    image_url: cleanValue(fieldValue('mf_imageUrl')),
    button_text: cleanValue(fieldValue('mf_btnText')),
    button_link: cleanValue(fieldValue('mf_btnLink')),
    display_order: modalMode === 'edit'
      ? Number((banners.find(function(item) { return item.id === modalEditId; }) || {}).order || 0)
      : getNextDisplayOrder(banners),
    is_active: fieldValue('mf_status') === 'Published',
    updated_by: getCurrentStaffId(),
    updated_at: new Date().toISOString()
  };
}

function getTeamPayload() {
  return {
    staff_user_id: cleanValue(fieldValue('mf_staffUser')),
    display_name: fieldValue('mf_name'),
    role_title: cleanValue(fieldValue('mf_jobTitle')),
    bio: cleanValue(fieldValue('mf_bio')),
    photo_url: cleanValue(fieldValue('mf_photoUrl')),
    display_order: modalMode === 'edit'
      ? Number((teamProfiles.find(function(item) { return item.id === modalEditId; }) || {}).order || 0)
      : getNextDisplayOrder(teamProfiles),
    is_visible: fieldValue('mf_status') === 'Visible',
    updated_by: getCurrentStaffId(),
    updated_at: new Date().toISOString()
  };
}

function getTestimonialPayload() {
  var rating = selectedRating();
  return {
    client_name: fieldValue('mf_clientName'),
    client_role: cleanValue(fieldValue('mf_clientType')),
    message: fieldValue('mf_message'),
    rating: rating,
    background_type: cleanValue(fieldValue('mf_backgroundType')) || 'solid',
    background_image_url: cleanValue(fieldValue('mf_backgroundImageUrl')),
    background_color: cleanValue(fieldValue('mf_backgroundColor')) || '#071827',
    display_order: Number(fieldValue('mf_displayOrder') || (
      modalMode === 'edit'
        ? Number((testimonials.find(function(item) { return item.id === modalEditId; }) || {}).order || 0)
        : getNextDisplayOrder(testimonials)
    )),
    is_visible: fieldValue('mf_status') === 'Published',
    updated_by: getCurrentStaffId(),
    updated_at: new Date().toISOString()
  };
}

function getFeaturedPayload() {
  return {
    property_id: fieldValue('mf_propertyId'),
    display_order: Number(fieldValue('mf_displayOrder') || getNextDisplayOrder(featuredProperties)),
    is_visible: fieldValue('mf_status') === 'Featured',
    updated_by: getCurrentStaffId(),
    updated_at: new Date().toISOString()
  };
}

function getServiceShowcasePayload() {
  var highlightLines = fieldValue('mf_highlights')
    .split('\n')
    .map(function(line) { return line.trim(); })
    .filter(Boolean);

  return {
    title: fieldValue('mf_title'),
    badge: cleanValue(fieldValue('mf_badge')),
    description: fieldValue('mf_description'),
    highlights: highlightLines,
    icon_key: cleanValue(fieldValue('mf_iconKey')),
    image_url: cleanValue(fieldValue('mf_imageUrl')),
    image_alt: cleanValue(fieldValue('mf_imageAlt')),
    visual_theme: cleanValue(fieldValue('mf_visualTheme')),
    display_order: Number(fieldValue('mf_displayOrder') || getNextDisplayOrder(serviceShowcaseItems)),
    is_active: fieldValue('mf_status') === 'Active',
    is_case_study: Boolean(document.getElementById('mf_isCaseStudy') && document.getElementById('mf_isCaseStudy').checked),
    case_study_label: cleanValue(fieldValue('mf_caseStudyLabel')) || 'View Case Study',
    case_study_url: cleanValue(fieldValue('mf_caseStudyUrl')),
    hover_video_url: cleanValue(fieldValue('mf_hoverVideoUrl')),
    hover_video_poster_url: cleanValue(fieldValue('mf_hoverVideoPosterUrl')),
    updated_at: new Date().toISOString()
  };
}

function buildLookup(rows) {
  var lookup = {};
  (rows || []).forEach(function(row) {
    lookup[String(row.id)] = row;
  });
  return lookup;
}

function showCmsLoading() {
  ['statBanners', 'statTeam', 'statTestimonials', 'statFeatured'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '0';
  });
  var panel = document.getElementById('panel-homepage');
  if (panel) {
    var note = document.getElementById('cmsLoadingNote');
    if (!note) {
      note = document.createElement('div');
      note.id = 'cmsLoadingNote';
      note.className = 'empty-state';
      note.style.display = 'flex';
      note.innerHTML = '<p>Loading CMS content...</p>';
      panel.insertBefore(note, panel.firstChild);
    }
  }
}

function hideCmsLoading() {
  var note = document.getElementById('cmsLoadingNote');
  if (note) note.remove();
}

async function loadHomepageContent(supabase) {
  var response = await supabase
    .from('cms_homepage_content')
    .select('id, hero_title, hero_subtitle, hero_button_text, hero_button_link, about_title, about_content, contact_phone, contact_email, contact_address, updated_by, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (response.error) throw response.error;
  return response.data && response.data.length ? response.data[0] : null;
}

async function loadHeroVideoSettings(supabase) {
  var response = await supabase
    .from('app_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'homepage_hero_video_url',
      'homepage_hero_poster_url',
      'homepage_hero_video_updated_at'
    ]);
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadWhyHilltopSettings(supabase) {
  var response = await supabase
    .from('app_settings')
    .select('setting_key, setting_value')
    .in('setting_key', WHY_HILLTOP_SETTING_KEYS);
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadBanners(supabase) {
  var response = await supabase
    .from('cms_banners')
    .select('id, title, subtitle, image_url, button_text, button_link, display_order, is_active, updated_by, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadTeamProfiles(supabase) {
  var response = await supabase
    .from('cms_team_profiles')
    .select('id, staff_user_id, display_name, role_title, bio, photo_url, display_order, is_visible, updated_by, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadTestimonials(supabase) {
  var response = await supabase
    .from('cms_testimonials')
    .select('id, client_name, client_role, message, rating, background_type, background_image_url, background_color, is_visible, display_order, updated_by, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadFeaturedProperties(supabase) {
  var response = await supabase
    .from('cms_featured_properties')
    .select('id, property_id, display_order, is_visible, updated_by, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadServiceShowcaseItems(supabase) {
  var response = await supabase
    .from('cms_service_showcase_items')
    .select('id, display_order, is_active, title, badge, description, highlights, icon_key, image_url, image_alt, visual_theme, is_case_study, case_study_label, case_study_url, hover_video_url, hover_video_poster_url, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (response.error) {
    if (isMissingCmsTableError(response.error)) {
      console.warn('Services Showcase CMS table is not available yet. Run supabase/services-showcase-cms.sql.', response.error);
      return [];
    }
    throw response.error;
  }
  return response.data || [];
}

async function loadCmsProperties(supabase) {
  var response = await supabase
    .from('properties')
    .select('id, reference_number, title, price, currency_code, purpose, property_type, status')
    .order('reference_number', { ascending: true });
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadCmsStaffUsers(supabase) {
  var response = await supabase
    .from('staff_users')
    .select('id, full_name, email, phone, role')
    .order('full_name', { ascending: true });
  if (response.error) throw response.error;
  return response.data || [];
}

async function loadCMSData() {
  var supabase = getSupabaseClient();
  if (!supabase) {
    cmsUsingSupabase = false;
    showToast('Supabase is not available. Showing demo CMS data.', 'error');
    renderSection(activeSection);
    return;
  }

  showCmsLoading();

  try {
    cmsCurrentUser = await waitForCurrentStaffProfile();

    var staffResult = await loadCmsStaffUsers(supabase);
    var propertiesResult = await loadCmsProperties(supabase);
    var homepageResult = await loadHomepageContent(supabase);
    var heroSettingsResult = await loadHeroVideoSettings(supabase);
    var whyHilltopSettingsResult = await loadWhyHilltopSettings(supabase);
    var bannerResult = await loadBanners(supabase);
    var teamResult = await loadTeamProfiles(supabase);
    var testimonialResult = await loadTestimonials(supabase);
    var featuredResult = await loadFeaturedProperties(supabase);
    var propertyServicesResult = await loadPropertyServicesCms(supabase);

    cmsStaffUsers = staffResult;
    cmsProperties = propertiesResult;
    var staffLookup = buildLookup(cmsStaffUsers);
    var propertyLookup = buildLookup(cmsProperties);

    var heroSettings = mapHeroSettings(heroSettingsResult);
    homepageContent = mapHomepageContent(homepageResult);
    homepageContent.heroVideoUrl = heroSettings.videoUrl;
    homepageContent.heroPosterUrl = heroSettings.posterUrl;
    homepageContent.heroVideoUpdatedAt = heroSettings.updatedAt;
    whyHilltopHero = mapWhyHilltopSettings(whyHilltopSettingsResult);
    banners = bannerResult.map(mapBanner);
    teamProfiles = teamResult.map(function(row) { return mapTeamProfile(row, staffLookup); });
    testimonials = testimonialResult.map(mapTestimonial);
    featuredProperties = featuredResult
      .map(function(row) { return mapFeaturedProperty(row, propertyLookup); })
      .filter(Boolean);
    propertyServicesSection = propertyServicesResult.section;
    propertyServiceCards = propertyServicesResult.cards;
    propertyServicesTablesAvailable = propertyServicesResult.available;
    takePropertyServicesSnapshot();

    cmsUsingSupabase = true;
    cmsTablesAvailable = true;
    hideCmsLoading();
    applyCmsPermissions();
    renderSection(activeSection);
  } catch (error) {
    hideCmsLoading();
    cmsUsingSupabase = false;
    if (isMissingCmsTableError(error)) {
      cmsTablesAvailable = false;
      console.warn('CMS tables are not available yet. Run supabase/cms-foundation.sql.', error);
      showToast('CMS tables are not available yet. Run supabase/cms-foundation.sql.', 'error');
    } else {
      console.warn('CMS data load failed.', error);
      showToast('Could not load CMS data. Showing demo CMS data.', 'error');
    }
    applyCmsPermissions();
    renderSection(activeSection);
  }
}


/* ══════════════════════════════════════════════════════════════
   5. CMS STATS
══════════════════════════════════════════════════════════════ */

function updateCmsStats() {
  document.getElementById('statBanners').textContent =
    banners.filter(function(b){ return b.status === 'Published' && branchMatch(b.branch); }).length;

  document.getElementById('statTeam').textContent =
    teamProfiles.filter(function(t){ return t.status === 'Visible' && branchMatch(t.branch); }).length;

  document.getElementById('statTestimonials').textContent =
    testimonials.filter(function(t){ return t.status === 'Published' && branchMatch(t.branch); }).length;

  document.getElementById('statFeatured').textContent =
    featuredProperties.filter(function(p){ return p.featured && branchMatch(p.branch); }).length;
}


/* ══════════════════════════════════════════════════════════════
   6. SECTION TABS
══════════════════════════════════════════════════════════════ */

document.querySelectorAll('.cms-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    var section = tab.dataset.section;
    switchSection(section);
  });
});

function switchSection(section) {
  if (activeSection === 'property-services' && section !== activeSection && propertyServicesDirty) {
    if (!window.confirm('You have unsaved Property Services changes. Leave this tab without saving?')) return;
    setPropertyServicesDirty(false);
  }
  activeSection = section;

  // Update tab buttons
  document.querySelectorAll('.cms-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.section === section);
  });

  // Update section panels
  document.querySelectorAll('.cms-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'panel-' + section);
  });

  // Hide filter bar on form sections that have their own controls.
  var filterBar = document.getElementById('cmsFilterBar');
  filterBar.style.display = (section === 'homepage' || section === 'why-hilltop' || section === 'property-services') ? 'none' : 'flex';

  // Render the active section
  renderSection(section);
}

function renderSection(section) {
  if (section === 'homepage')     renderHomepage();
  if (section === 'why-hilltop')  renderWhyHilltopHero();
  if (section === 'banners')      renderBanners();
  if (section === 'team')         renderTeam();
  if (section === 'testimonials') renderTestimonials();
  if (section === 'featured')     renderFeatured();
  if (section === 'property-services') renderPropertyServicesCms();
  if (section === 'news')         renderArticles();
  updateCmsStats();
}


/* ══════════════════════════════════════════════════════════════
   7. HOMEPAGE CONTENT
══════════════════════════════════════════════════════════════ */

function renderHomepage() {
  document.getElementById('hpHeroHeadline').value  = homepageContent.heroHeadline;
  document.getElementById('hpHeroSubtitle').value  = homepageContent.heroSubtitle;
  document.getElementById('hpCtaText').value       = homepageContent.ctaText;
  document.getElementById('hpCtaLink').value       = homepageContent.ctaLink;
  document.getElementById('hpAboutText').value     = homepageContent.aboutText;
  document.getElementById('hpServicesText').value  = homepageContent.servicesText;
  renderHeroVideoPreview();
}

function readHomepageForm() {
  homepageContent.heroHeadline  = document.getElementById('hpHeroHeadline').value.trim();
  homepageContent.heroSubtitle  = document.getElementById('hpHeroSubtitle').value.trim();
  homepageContent.ctaText       = document.getElementById('hpCtaText').value.trim();
  homepageContent.ctaLink       = document.getElementById('hpCtaLink').value.trim();
  homepageContent.aboutText     = document.getElementById('hpAboutText').value.trim();
  homepageContent.servicesText  = document.getElementById('hpServicesText').value.trim();
}

document.getElementById('btnHpDraft').addEventListener('click', function() {
  saveHomepageContent();
});

document.getElementById('btnHpPreview').addEventListener('click', function() {
  readHomepageForm();
  showToast('Preview opened — connect to live website in a later phase', 'success');
});

document.getElementById('btnHpPublish').addEventListener('click', function() {
  saveHomepageContent();
});

function renderHeroVideoPreview() {
  var preview = document.getElementById('heroVideoPreview');
  if (!preview) return;

  if (homepageContent.heroVideoUrl) {
    preview.innerHTML = '<video controls muted preload="metadata"' +
      (homepageContent.heroPosterUrl ? ' poster="' + escapeAttribute(homepageContent.heroPosterUrl) + '"' : '') +
      '><source src="' + escapeAttribute(homepageContent.heroVideoUrl) + '"></video>';
  } else if (homepageContent.heroPosterUrl) {
    preview.innerHTML = '<img src="' + escapeAttribute(homepageContent.heroPosterUrl) + '" alt="Homepage hero poster preview" />';
  } else {
    preview.innerHTML = '<p>No hero video configured yet.</p>';
  }

  var updated = homepageContent.heroVideoUpdatedAt
    ? 'Last updated: ' + new Date(homepageContent.heroVideoUpdatedAt).toLocaleString()
    : '';
  setHeroVideoStatus(updated, updated ? 'success' : '');
}

async function saveHeroVideoSettings() {
  if (!ensureCmsReadyForWrite()) return;

  var videoFile = selectedFile('hpHeroVideoFile');
  var posterFile = selectedFile('hpHeroPosterFile');

  if (!videoFile && !posterFile) {
    setHeroVideoStatus('Choose a hero video or poster image before saving.', 'error');
    return;
  }

  setHeroVideoStatus('Validating selected media...', '');

  if (videoFile) {
    var videoError = await validateHeroVideoFile(videoFile);
    if (videoError) {
      setHeroVideoStatus(videoError, 'error');
      showToast(videoError, 'error');
      return;
    }
  }

  if (posterFile) {
    var posterError = validateHeroPosterFile(posterFile);
    if (posterError) {
      setHeroVideoStatus(posterError, 'error');
      showToast(posterError, 'error');
      return;
    }
  }

  try {
    var supabase = getSupabaseClient();
    var videoUrl = homepageContent.heroVideoUrl;
    var posterUrl = homepageContent.heroPosterUrl;

    setHeroVideoStatus('Uploading...', '');
    if (videoFile) {
      videoUrl = await uploadHeroMedia('video', videoFile);
    }
    if (posterFile) {
      posterUrl = await uploadHeroMedia('poster', posterFile);
    }

    var updatedAt = new Date().toISOString();
    var rows = [
      {
        setting_key: 'homepage_hero_video_url',
        setting_category: 'public_homepage',
        setting_value: { url: videoUrl || '' },
        updated_by: getCurrentStaffId()
      },
      {
        setting_key: 'homepage_hero_poster_url',
        setting_category: 'public_homepage',
        setting_value: { url: posterUrl || '' },
        updated_by: getCurrentStaffId()
      },
      {
        setting_key: 'homepage_hero_video_updated_at',
        setting_category: 'public_homepage',
        setting_value: { value: updatedAt },
        updated_by: getCurrentStaffId()
      }
    ];

    var result = await supabase
      .from('app_settings')
      .upsert(rows, { onConflict: 'setting_key' });

    if (result.error) throw result.error;

    homepageContent.heroVideoUrl = videoUrl || '';
    homepageContent.heroPosterUrl = posterUrl || '';
    homepageContent.heroVideoUpdatedAt = updatedAt;

    var videoInput = document.getElementById('hpHeroVideoFile');
    var posterInput = document.getElementById('hpHeroPosterFile');
    if (videoInput) videoInput.value = '';
    if (posterInput) posterInput.value = '';

    renderHeroVideoPreview();
    await logCmsActivity('CMS_HERO_VIDEO_UPDATED', 'Homepage hero video settings were updated.');
    setHeroVideoStatus('Saved successfully.', 'success');
    showToast('Hero video saved successfully.', 'success');
  } catch (error) {
    console.warn('Hero video save failed.', error);
    var message = error && error.message ? error.message : 'Hero video could not be saved. Please try again.';
    setHeroVideoStatus(message, 'error');
    showToast(message, 'error');
  }
}

document.getElementById('btnHeroVideoSave').addEventListener('click', function() {
  saveHeroVideoSettings();
});

function setFieldValue(fieldId, value) {
  var field = document.getElementById(fieldId);
  if (field) field.value = value || '';
}

function updateWhyHeroCmsDiagnostics(patch) {
  var current = window.__whyHeroCmsDiagnostics || {
    selectedVideoName: '',
    selectedVideoSize: 0,
    selectedVideoType: '',
    hasSelectedVideoFile: false,
    saveClicked: false,
    uploadAttempted: false,
    uploadPath: '',
    uploadError: '',
    publicUrl: '',
    appSettingsSaveAttempted: false,
    appSettingsSaveError: '',
    savedVideoUrl: '',
    saveError: ''
  };
  window.__whyHeroCmsDiagnostics = Object.assign(current, patch || {});
}

function revokeWhyHeroLocalPreview(kind) {
  if ((!kind || kind === 'video') && whyHeroLocalVideoPreviewUrl) {
    URL.revokeObjectURL(whyHeroLocalVideoPreviewUrl);
    whyHeroLocalVideoPreviewUrl = '';
  }
  if ((!kind || kind === 'poster') && whyHeroLocalPosterPreviewUrl) {
    URL.revokeObjectURL(whyHeroLocalPosterPreviewUrl);
    whyHeroLocalPosterPreviewUrl = '';
  }
}

function renderWhyHeroSelectedPreview(message) {
  var preview = document.getElementById('whyHeroPreview');
  if (!preview) return;

  if (whyHeroLocalVideoPreviewUrl) {
    preview.innerHTML = '<video controls muted loop playsinline preload="metadata"' +
      (whyHeroLocalPosterPreviewUrl ? ' poster="' + escapeAttribute(whyHeroLocalPosterPreviewUrl) + '"' : '') +
      '><source src="' + escapeAttribute(whyHeroLocalVideoPreviewUrl) + '"></video>';
    var previewVideo = preview.querySelector('video');
    if (previewVideo) {
      previewVideo.load();
      var playPromise = previewVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function() {
          // Controls remain available if autoplay is blocked in the dashboard preview.
        });
      }
    }
  } else if (whyHeroLocalPosterPreviewUrl) {
    preview.innerHTML = '<img src="' + escapeAttribute(whyHeroLocalPosterPreviewUrl) + '" alt="Selected Why Hilltop poster preview" />';
  } else {
    renderWhyHeroPreview();
    return;
  }

  setWhyHeroStatus(message || 'Media selected. Click Save to upload and publish.', 'success');
}

function renderWhyHeroPreview() {
  var preview = document.getElementById('whyHeroPreview');
  if (!preview) return;

  revokeWhyHeroLocalPreview();

  if (whyHilltopHero.videoUrl) {
    preview.innerHTML = '<video controls muted preload="metadata"' +
      (whyHilltopHero.posterUrl ? ' poster="' + escapeAttribute(whyHilltopHero.posterUrl) + '"' : '') +
      '><source src="' + escapeAttribute(whyHilltopHero.videoUrl) + '"></video>';
  } else if (whyHilltopHero.posterUrl) {
    preview.innerHTML = '<img src="' + escapeAttribute(whyHilltopHero.posterUrl) + '" alt="Why Hilltop poster preview" />';
  } else {
    preview.innerHTML = '<p>No Why Hilltop video configured yet.</p>';
  }

  setWhyHeroStatus(whyHilltopHero.videoUrl ? 'Why Hilltop video configured.' : 'No video saved. The public section will use the poster or default fallback image.', whyHilltopHero.videoUrl ? 'success' : '');
}

function renderWhyHilltopHero() {
  setFieldValue('whyHeroVideoUrl', whyHilltopHero.videoUrl);
  setFieldValue('whyHeroPosterUrl', whyHilltopHero.posterUrl);
  setFieldValue('whyHeroEyebrow', whyHilltopHero.eyebrow);
  setFieldValue('whyHeroTitle', whyHilltopHero.title);

  whyHilltopHero.cards.forEach(function(card, index) {
    var cardNumber = index + 1;
    setFieldValue('whyCard' + cardNumber + 'Title', card.title);
    setFieldValue('whyCard' + cardNumber + 'Short', card.short);
    setFieldValue('whyCard' + cardNumber + 'Expanded', card.expanded);
    setFieldValue('whyCard' + cardNumber + 'Cta', card.cta);
  });

  renderWhyHeroPreview();
}

function readWhyHilltopForm() {
  var next = cloneWhyHilltopDefaults();
  next.videoUrl = cleanValue(fieldValue('whyHeroVideoUrl'));
  next.posterUrl = cleanValue(fieldValue('whyHeroPosterUrl'));
  next.eyebrow = cleanValue(fieldValue('whyHeroEyebrow')) || WHY_HILLTOP_DEFAULTS.eyebrow;
  next.title = cleanValue(fieldValue('whyHeroTitle')) || WHY_HILLTOP_DEFAULTS.title;

  for (var i = 0; i < next.cards.length; i += 1) {
    var cardNumber = i + 1;
    next.cards[i].title = cleanValue(fieldValue('whyCard' + cardNumber + 'Title')) || WHY_HILLTOP_DEFAULTS.cards[i].title;
    next.cards[i].short = cleanValue(fieldValue('whyCard' + cardNumber + 'Short')) || WHY_HILLTOP_DEFAULTS.cards[i].short;
    next.cards[i].expanded = cleanValue(fieldValue('whyCard' + cardNumber + 'Expanded')) || WHY_HILLTOP_DEFAULTS.cards[i].expanded;
    next.cards[i].cta = cleanValue(fieldValue('whyCard' + cardNumber + 'Cta')) || WHY_HILLTOP_DEFAULTS.cards[i].cta;
  }

  whyHilltopHero = next;
}

function handleWhyHeroVideoFileChange(event) {
  var input = event.target;
  var file = input && input.files && input.files.length ? input.files[0] : null;
  selectedWhyHeroVideoFile = file;
  updateWhyHeroCmsDiagnostics({
    selectedVideoName: file ? file.name : '',
    selectedVideoSize: file ? file.size : 0,
    selectedVideoType: file ? file.type : '',
    hasSelectedVideoFile: Boolean(file),
    saveClicked: false,
    uploadAttempted: false,
    uploadPath: '',
    uploadError: '',
    publicUrl: '',
    appSettingsSaveAttempted: false,
    appSettingsSaveError: '',
    saveError: ''
  });

  revokeWhyHeroLocalPreview('video');

  if (!file) {
    renderWhyHeroSelectedPreview();
    return;
  }

  var validationError = validateWhyHilltopVideoFile(file);
  if (validationError) {
    selectedWhyHeroVideoFile = null;
    input.value = '';
    renderWhyHeroSelectedPreview();
    setWhyHeroStatus(validationError, 'error');
    showToast(validationError, 'error');
    return;
  }

  whyHeroLocalVideoPreviewUrl = URL.createObjectURL(file);
  renderWhyHeroSelectedPreview('Video selected. Click Save to upload and publish.');
}

function handleWhyHeroPosterFileChange(event) {
  var input = event.target;
  var file = input && input.files && input.files.length ? input.files[0] : null;
  selectedWhyHeroPosterFile = file;

  revokeWhyHeroLocalPreview('poster');

  if (!file) {
    renderWhyHeroSelectedPreview();
    return;
  }

  var validationError = validateCmsImageFile(file);
  if (validationError) {
    selectedWhyHeroPosterFile = null;
    input.value = '';
    renderWhyHeroSelectedPreview();
    setWhyHeroStatus(validationError, 'error');
    showToast(validationError, 'error');
    return;
  }

  whyHeroLocalPosterPreviewUrl = URL.createObjectURL(file);
  renderWhyHeroSelectedPreview(selectedWhyHeroVideoFile ? 'Media selected. Click Save to upload and publish.' : 'Poster selected. Click Save to upload and publish.');
}

function whyHilltopRows(updatedBy) {
  var rows = [
    {
      setting_key: 'homepage_why_hero_video_url',
      setting_category: 'public_homepage',
      setting_value: { url: whyHilltopHero.videoUrl || '' },
      updated_by: updatedBy
    },
    {
      setting_key: 'homepage_why_hero_poster_url',
      setting_category: 'public_homepage',
      setting_value: { url: whyHilltopHero.posterUrl || '' },
      updated_by: updatedBy
    },
    {
      setting_key: 'homepage_why_hero_eyebrow',
      setting_category: 'public_homepage',
      setting_value: { text: whyHilltopHero.eyebrow || WHY_HILLTOP_DEFAULTS.eyebrow },
      updated_by: updatedBy
    },
    {
      setting_key: 'homepage_why_hero_title',
      setting_category: 'public_homepage',
      setting_value: { text: whyHilltopHero.title || WHY_HILLTOP_DEFAULTS.title },
      updated_by: updatedBy
    }
  ];

  whyHilltopHero.cards.forEach(function(card, index) {
    var cardNumber = index + 1;
    rows.push(
      {
        setting_key: 'homepage_why_card_' + cardNumber + '_title',
        setting_category: 'public_homepage',
        setting_value: { text: card.title || WHY_HILLTOP_DEFAULTS.cards[index].title },
        updated_by: updatedBy
      },
      {
        setting_key: 'homepage_why_card_' + cardNumber + '_short',
        setting_category: 'public_homepage',
        setting_value: { text: card.short || WHY_HILLTOP_DEFAULTS.cards[index].short },
        updated_by: updatedBy
      },
      {
        setting_key: 'homepage_why_card_' + cardNumber + '_expanded',
        setting_category: 'public_homepage',
        setting_value: { text: card.expanded || WHY_HILLTOP_DEFAULTS.cards[index].expanded },
        updated_by: updatedBy
      },
      {
        setting_key: 'homepage_why_card_' + cardNumber + '_cta',
        setting_category: 'public_homepage',
        setting_value: { text: card.cta || WHY_HILLTOP_DEFAULTS.cards[index].cta },
        updated_by: updatedBy
      }
    );
  });

  return rows;
}

async function saveWhyHilltopHeroSettings() {
  updateWhyHeroCmsDiagnostics({
    saveClicked: true,
    saveError: '',
    appSettingsSaveError: ''
  });

  if (!ensureCmsReadyForWrite()) return;

  readWhyHilltopForm();

  var videoFile = selectedWhyHeroVideoFile || selectedFile('whyHeroVideoFile');
  var posterFile = selectedWhyHeroPosterFile || selectedFile('whyHeroPosterFile');
  var videoError = videoFile ? validateWhyHilltopVideoFile(videoFile) : null;
  var posterError = posterFile ? validateCmsImageFile(posterFile) : null;

  if (videoError || posterError) {
    updateWhyHeroCmsDiagnostics({ saveError: videoError || posterError });
    setWhyHeroStatus(videoError || posterError, 'error');
    showToast(videoError || posterError, 'error');
    return;
  }

  try {
    var supabase = getSupabaseClient();
    updateWhyHeroCmsDiagnostics({
      uploadAttempted: false,
      uploadError: '',
      publicUrl: '',
      appSettingsSaveAttempted: false,
      appSettingsSaveError: '',
      saveError: '',
      savedVideoUrl: whyHilltopHero.videoUrl || ''
    });

    if (videoFile || posterFile) {
      setWhyHeroStatus('Uploading Why Hilltop media...', '');
    }

    if (videoFile) {
      whyHilltopHero.videoUrl = await uploadWhyHilltopMedia('video', videoFile) || whyHilltopHero.videoUrl;
      setFieldValue('whyHeroVideoUrl', whyHilltopHero.videoUrl);
    }

    if (posterFile) {
      whyHilltopHero.posterUrl = await uploadWhyHilltopMedia('poster', posterFile) || whyHilltopHero.posterUrl;
      setFieldValue('whyHeroPosterUrl', whyHilltopHero.posterUrl);
    }

    setWhyHeroStatus('Saving Why Hilltop settings...', '');
    updateWhyHeroCmsDiagnostics({
      appSettingsSaveAttempted: true,
      appSettingsSaveError: ''
    });

    var result = await supabase
      .from('app_settings')
      .upsert(whyHilltopRows(getCurrentStaffId()), { onConflict: 'setting_key' });

    if (result.error) {
      var appSettingsMessage = result.error.message || 'Could not save Why Hilltop settings.';
      updateWhyHeroCmsDiagnostics({ appSettingsSaveError: appSettingsMessage });
      throw new Error(appSettingsMessage);
    }

    var videoInput = document.getElementById('whyHeroVideoFile');
    var posterInput = document.getElementById('whyHeroPosterFile');
    if (videoInput) videoInput.value = '';
    if (posterInput) posterInput.value = '';
    selectedWhyHeroVideoFile = null;
    selectedWhyHeroPosterFile = null;
    updateWhyHeroCmsDiagnostics({
      savedVideoUrl: whyHilltopHero.videoUrl || '',
      appSettingsSaveError: '',
      saveError: ''
    });

    renderWhyHilltopHero();
    await logCmsActivity('CMS_WHY_HILLTOP_HERO_UPDATED', 'Why Hilltop hero settings were updated.');
    setWhyHeroStatus('Why Hilltop Hero saved successfully.', 'success');
    showToast('Why Hilltop Hero saved successfully.', 'success');
  } catch (error) {
    console.warn('Why Hilltop Hero save failed.', error);
    var message = error && error.message ? error.message : 'Why Hilltop Hero could not be saved. Please try again.';
    updateWhyHeroCmsDiagnostics({ saveError: message });
    setWhyHeroStatus(message, 'error');
    showToast(message, 'error');
  }
}

var whyHeroVideoFileInput = document.getElementById('whyHeroVideoFile');
if (whyHeroVideoFileInput) {
  whyHeroVideoFileInput.addEventListener('change', handleWhyHeroVideoFileChange);
}

var whyHeroPosterFileInput = document.getElementById('whyHeroPosterFile');
if (whyHeroPosterFileInput) {
  whyHeroPosterFileInput.addEventListener('change', handleWhyHeroPosterFileChange);
}

var btnWhyHeroSave = document.getElementById('btnWhyHeroSave');
if (btnWhyHeroSave) {
  btnWhyHeroSave.addEventListener('click', function() {
    saveWhyHilltopHeroSettings();
  });
}

async function saveHomepageContent() {
  if (!ensureCmsReadyForWrite()) return;

  readHomepageForm();
  var contactFields = splitContactLines(homepageContent.servicesText);
  var payload = {
    hero_title: cleanValue(homepageContent.heroHeadline),
    hero_subtitle: cleanValue(homepageContent.heroSubtitle),
    hero_button_text: cleanValue(homepageContent.ctaText),
    hero_button_link: cleanValue(homepageContent.ctaLink),
    about_title: 'About Hilltop Properties Zambia',
    about_content: cleanValue(homepageContent.aboutText),
    contact_phone: contactFields.contact_phone,
    contact_email: contactFields.contact_email,
    contact_address: contactFields.contact_address,
    updated_by: getCurrentStaffId(),
    updated_at: new Date().toISOString()
  };

  try {
    var supabase = getSupabaseClient();
    var result;
    if (homepageContent.id) {
      result = await supabase
        .from('cms_homepage_content')
        .update(payload)
        .eq('id', homepageContent.id)
        .select('id')
        .single();
    } else {
      result = await supabase
        .from('cms_homepage_content')
        .insert(payload)
        .select('id')
        .single();
    }

    if (result.error) throw result.error;
    await logCmsActivity('CMS_HOMEPAGE_UPDATED', 'Homepage CMS content was updated.');
    await reloadCmsAfterWrite('Homepage content saved.');
  } catch (error) {
    console.warn('Homepage CMS save failed.', error);
    showToast('Could not save homepage content. Please try again.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   8. BANNERS
══════════════════════════════════════════════════════════════ */

function renderBanners() {
  var grid  = document.getElementById('bannerGrid');
  var empty = document.getElementById('bannerEmpty');

  var filtered = banners.filter(function(b) {
    return branchMatch(b.branch)
        && statusMatch(b.status)
        && searchMatch(b.title + ' ' + b.subtitle);
  });

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = '';

  filtered.forEach(function(b) {
    var bc  = getBadgeClass(b.status);
    var card = document.createElement('div');
    card.className = 'banner-card';
    var bannerVisual = b.imageUrl
      ? '<div class="banner-image-placeholder has-image"><img src="' + b.imageUrl + '" alt="' + b.title + '" /></div>'
      : [
          '<div class="banner-image-placeholder">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
            '<p>Image placeholder</p>',
            '<span class="banner-image-note">',
              'Image storage: backend phase',
            '</span>',
          '</div>'
        ].join('');
    card.innerHTML = [
      bannerVisual,
      '<div class="banner-body">',
        '<div class="banner-meta">',
          '<span class="badge ' + bc + '">' + b.status + '</span>',
          '<span class="banner-branch-pill">' + b.branch + '</span>',
        '</div>',
        '<div class="banner-title">' + b.title + '</div>',
        '<div class="banner-subtitle">' + b.subtitle + '</div>',
        (b.btnText ? '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">Button: <strong>' + b.btnText + '</strong></div>' : ''),
      '</div>',
      cmsActionHtml([
        '<div class="banner-actions">',
          '<button class="action-btn outline small" onclick="openCmsModal(\'banner\',\'edit\',' + quoteId(b.id) + ')">Edit</button>',
          '<button class="action-btn small ' + (b.status === 'Published' ? 'danger' : 'secondary') + '" onclick="toggleBannerStatus(' + quoteId(b.id) + ')">',
            (b.status === 'Published' ? 'Unpublish' : 'Publish'),
          '</button>',
          '<button class="action-btn danger small" onclick="deleteCmsRecord(\'banner\',' + quoteId(b.id) + ')">Hide</button>',
        '</div>'
      ].join(''))
    ].join('');
    grid.appendChild(card);
  });
}

document.getElementById('btnAddBanner').addEventListener('click', function() {
  openCmsModal('banner', 'add');
});

function toggleBannerStatus(id) {
  var b = banners.find(function(x){ return x.id === id; });
  if (!b) return;
  updateBannerVisibility(id, b.status !== 'Published');
}

async function updateBannerVisibility(id, isActive) {
  if (!ensureCmsReadyForWrite()) return;

  try {
    var result = await getSupabaseClient()
      .from('cms_banners')
      .update({
        is_active: isActive,
        updated_by: getCurrentStaffId(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (result.error) throw result.error;
    await logCmsActivity(
      isActive ? 'CMS_BANNER_UPDATED' : 'CMS_BANNER_HIDDEN',
      isActive ? 'CMS banner was published.' : 'CMS banner was hidden.'
    );
    await reloadCmsAfterWrite(isActive ? 'Banner published.' : 'Banner hidden.');
  } catch (error) {
    console.warn('CMS banner visibility update failed.', error);
    showToast('Could not update banner visibility. Please try again.', 'error');
  }
}

async function saveBannerFromModal() {
  if (!ensureCmsReadyForWrite()) return;

  var payload = getBannerPayload();
  var bannerFile = selectedFile('mf_imageFile');
  if (!payload.title) {
    showToast('Please enter a banner title', 'error');
    return;
  }
  if (bannerFile) {
    var bannerFileError = validateCmsImageFile(bannerFile);
    if (bannerFileError) {
      showToast(bannerFileError, 'error');
      return;
    }
    delete payload.image_url;
  }

  try {
    var supabase = getSupabaseClient();
    var actionType = modalMode === 'edit' ? 'CMS_BANNER_UPDATED' : 'CMS_BANNER_CREATED';
    var result = modalMode === 'edit'
      ? await supabase.from('cms_banners').update(payload).eq('id', modalEditId).select('id').single()
      : await supabase.from('cms_banners').insert(payload).select('id').single();

    if (result.error) throw result.error;
    var bannerId = result.data && result.data.id ? result.data.id : modalEditId;
    await logCmsActivity(actionType, modalMode === 'edit' ? 'CMS banner was updated.' : 'CMS banner was created.');

    var mediaUploaded = false;
    if (bannerFile) {
      var bannerUrl = await uploadCmsMedia('banners', bannerId, bannerFile);
      if (bannerUrl) {
        var mediaUpdate = await supabase
          .from('cms_banners')
          .update({
            image_url: bannerUrl,
            updated_by: getCurrentStaffId(),
            updated_at: new Date().toISOString()
          })
          .eq('id', bannerId);
        if (mediaUpdate.error) throw mediaUpdate.error;
        mediaUploaded = true;
        await logCmsActivity('CMS_BANNER_MEDIA_UPLOADED', 'CMS banner image was uploaded.');
      }
    }

    closeCmsModal();
    await reloadCmsAfterWrite(
      bannerFile && !mediaUploaded
        ? (modalMode === 'edit' ? 'Banner updated without uploaded image.' : 'Banner created without uploaded image.')
        : (modalMode === 'edit' ? 'Banner updated.' : 'Banner created.')
    );
  } catch (error) {
    console.warn('CMS banner save failed.', error);
    showToast('Could not save banner. Please try again.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   9. TEAM PROFILES
══════════════════════════════════════════════════════════════ */

function renderTeam() {
  var grid  = document.getElementById('teamGrid');
  var empty = document.getElementById('teamEmpty');

  var filtered = teamProfiles.filter(function(t) {
    return branchMatch(t.branch)
        && statusMatch(t.status)
        && searchMatch(t.name + ' ' + t.jobTitle);
  });

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = '';

  filtered.forEach(function(t) {
    var bc   = getBadgeClass(t.status);
    var card = document.createElement('div');
    card.className = 'team-card';
    var avatarHtml = t.photoUrl
      ? '<div class="team-avatar has-photo"><img src="' + t.photoUrl + '" alt="' + t.name + '" /></div>'
      : '<div class="team-avatar">' + initials(t.name) + '</div>';
    card.innerHTML = [
      '<div class="team-card-top">',
        avatarHtml,
        '<div class="team-name">' + t.name + '</div>',
        '<div class="team-title">' + t.jobTitle + '</div>',
      '</div>',
      '<div class="team-card-body">',
        '<div class="team-contact-row">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>',
          t.phone,
        '</div>',
        '<div class="team-contact-row">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
          t.email,
        '</div>',
        '<div class="team-contact-row">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
          t.branch,
        '</div>',
        (t.bio ? '<div class="team-bio">' + t.bio + '</div>' : ''),
      '</div>',
      cmsActionHtml([
        '<div class="team-card-footer">',
          '<span class="badge ' + bc + '" style="margin-right:auto">' + t.status + '</span>',
          '<button class="action-btn outline small" onclick="openCmsModal(\'team\',\'edit\',' + quoteId(t.id) + ')">Edit</button>',
          '<button class="action-btn small ' + (t.status === 'Visible' ? 'danger' : 'secondary') + '" onclick="toggleTeamStatus(' + quoteId(t.id) + ')">',
            (t.status === 'Visible' ? 'Hide' : 'Show'),
          '</button>',
          '<button class="action-btn danger small" onclick="deleteCmsRecord(\'team\',' + quoteId(t.id) + ')">Hide</button>',
        '</div>'
      ].join(''))
    ].join('');
    grid.appendChild(card);
  });
}

document.getElementById('btnAddTeam').addEventListener('click', function() {
  openCmsModal('team', 'add');
});

function toggleTeamStatus(id) {
  var t = teamProfiles.find(function(x){ return x.id === id; });
  if (!t) return;
  updateTeamVisibility(id, t.status !== 'Visible');
}

async function updateTeamVisibility(id, isVisible) {
  if (!ensureCmsReadyForWrite()) return;

  try {
    var result = await getSupabaseClient()
      .from('cms_team_profiles')
      .update({
        is_visible: isVisible,
        updated_by: getCurrentStaffId(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (result.error) throw result.error;
    await logCmsActivity(
      isVisible ? 'CMS_TEAM_PROFILE_UPDATED' : 'CMS_TEAM_PROFILE_HIDDEN',
      isVisible ? 'CMS team profile was shown.' : 'CMS team profile was hidden.'
    );
    await reloadCmsAfterWrite(isVisible ? 'Team profile shown.' : 'Team profile hidden.');
  } catch (error) {
    console.warn('CMS team profile visibility update failed.', error);
    showToast('Could not update team profile visibility. Please try again.', 'error');
  }
}

async function saveTeamFromModal() {
  if (!ensureCmsReadyForWrite()) return;

  var payload = getTeamPayload();
  var teamFile = selectedFile('mf_photoFile');
  if (!payload.display_name) {
    showToast('Please enter a name', 'error');
    return;
  }
  if (teamFile) {
    var teamFileError = validateCmsImageFile(teamFile);
    if (teamFileError) {
      showToast(teamFileError, 'error');
      return;
    }
    delete payload.photo_url;
  }

  try {
    var supabase = getSupabaseClient();
    var actionType = modalMode === 'edit' ? 'CMS_TEAM_PROFILE_UPDATED' : 'CMS_TEAM_PROFILE_CREATED';
    var result = modalMode === 'edit'
      ? await supabase.from('cms_team_profiles').update(payload).eq('id', modalEditId).select('id').single()
      : await supabase.from('cms_team_profiles').insert(payload).select('id').single();

    if (result.error) throw result.error;
    var profileId = result.data && result.data.id ? result.data.id : modalEditId;
    await logCmsActivity(actionType, modalMode === 'edit' ? 'CMS team profile was updated.' : 'CMS team profile was created.');

    var mediaUploaded = false;
    if (teamFile) {
      var photoUrl = await uploadCmsMedia('team', profileId, teamFile);
      if (photoUrl) {
        var mediaUpdate = await supabase
          .from('cms_team_profiles')
          .update({
            photo_url: photoUrl,
            updated_by: getCurrentStaffId(),
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);
        if (mediaUpdate.error) throw mediaUpdate.error;
        mediaUploaded = true;
        await logCmsActivity('CMS_TEAM_PROFILE_MEDIA_UPLOADED', 'CMS team profile photo was uploaded.');
      }
    }

    closeCmsModal();
    await reloadCmsAfterWrite(
      teamFile && !mediaUploaded
        ? (modalMode === 'edit' ? 'Team profile updated without uploaded photo.' : 'Team profile created without uploaded photo.')
        : (modalMode === 'edit' ? 'Team profile updated.' : 'Team profile created.')
    );
  } catch (error) {
    console.warn('CMS team profile save failed.', error);
    showToast('Could not save team profile. Please try again.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   10. TESTIMONIALS
══════════════════════════════════════════════════════════════ */

function renderTestimonials() {
  var list  = document.getElementById('testimonialList');
  var empty = document.getElementById('testimonialEmpty');

  var filtered = testimonials.filter(function(t) {
    return branchMatch(t.branch)
        && statusMatch(t.status)
        && searchMatch(t.clientName + ' ' + t.message);
  });

  if (!filtered.length) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = '';

  filtered.forEach(function(t) {
    var bc   = getBadgeClass(t.status);
    var item = document.createElement('div');
    item.className = 'cms-list-item testimonial-item';
    item.innerHTML = [
      '<div class="testimonial-avatar">' + initials(t.clientName) + '</div>',
      '<div class="testimonial-content">',
        '<div class="testimonial-client">' + t.clientName + '</div>',
        '<div class="testimonial-type">' + t.clientType + '</div>',
        '<div class="testimonial-stars">' + renderStars(t.rating) + '</div>',
        '<div class="testimonial-type">Background: ' + (t.backgroundType === 'image' ? 'Image' : 'Solid') + (t.backgroundType === 'image' && t.backgroundImageUrl ? ' · image set' : '') + '</div>',
        '<div class="testimonial-message">"' + t.message + '"</div>',
        '<div class="testimonial-meta">',
          '<span class="badge ' + bc + '">' + t.status + '</span>',
          '<span class="banner-branch-pill">' + t.branch + '</span>',
        '</div>',
      '</div>',
      cmsActionHtml([
        '<div class="item-actions">',
          (t.status === 'Pending' ?
            '<button class="action-btn secondary small" onclick="approveTestimonial(' + quoteId(t.id) + ')">Approve</button>' : ''),
          '<button class="action-btn outline small" onclick="openCmsModal(\'testimonial\',\'edit\',' + quoteId(t.id) + ')">Edit</button>',
          '<button class="action-btn small ' + (t.status === 'Published' ? 'danger' : 'secondary') + '" onclick="toggleTestimonialStatus(' + quoteId(t.id) + ')">',
            (t.status === 'Published' ? 'Hide' : 'Publish'),
          '</button>',
          '<button class="action-btn danger small" onclick="deleteCmsRecord(\'testimonial\',' + quoteId(t.id) + ')">Hide</button>',
        '</div>'
      ].join(''))
    ].join('');
    list.appendChild(item);
  });
}

document.getElementById('btnAddTestimonial').addEventListener('click', function() {
  openCmsModal('testimonial', 'add');
});

function approveTestimonial(id) {
  var t = testimonials.find(function(x){ return x.id === id; });
  if (!t) return;
  updateTestimonialVisibility(id, true);
}

function toggleTestimonialStatus(id) {
  var t = testimonials.find(function(x){ return x.id === id; });
  if (!t) return;
  updateTestimonialVisibility(id, t.status !== 'Published');
}

async function updateTestimonialVisibility(id, isVisible) {
  if (!ensureCmsReadyForWrite()) return;

  try {
    var result = await getSupabaseClient()
      .from('cms_testimonials')
      .update({
        is_visible: isVisible,
        updated_by: getCurrentStaffId(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (result.error) throw result.error;
    await logCmsActivity(
      isVisible ? 'CMS_TESTIMONIAL_UPDATED' : 'CMS_TESTIMONIAL_HIDDEN',
      isVisible ? 'CMS testimonial was published.' : 'CMS testimonial was hidden.'
    );
    await reloadCmsAfterWrite(isVisible ? 'Testimonial published.' : 'Testimonial hidden.');
  } catch (error) {
    console.warn('CMS testimonial visibility update failed.', error);
    showToast('Could not update testimonial visibility. Please try again.', 'error');
  }
}

async function saveTestimonialFromModal() {
  if (!ensureCmsReadyForWrite()) return;

  var payload = getTestimonialPayload();
  var backgroundFile = selectedFile('mf_backgroundImageFile');
  if (!payload.client_name) {
    showToast('Please enter a client name', 'error');
    return;
  }
  if (!payload.message) {
    showToast('Please enter a testimonial message', 'error');
    return;
  }
  if (payload.rating !== null && (payload.rating < 1 || payload.rating > 5)) {
    showToast('Rating must be between 1 and 5', 'error');
    return;
  }
  if (payload.background_type === 'image' && !payload.background_image_url && !backgroundFile) {
    showToast('Add a background image URL or choose a file for image background testimonials.', 'error');
    return;
  }
  if (backgroundFile) {
    var backgroundFileError = validateCmsImageFile(backgroundFile);
    if (backgroundFileError) {
      showToast(backgroundFileError, 'error');
      return;
    }
    payload.background_type = 'image';
    delete payload.background_image_url;
  }

  try {
    var supabase = getSupabaseClient();
    var actionType = modalMode === 'edit' ? 'CMS_TESTIMONIAL_UPDATED' : 'CMS_TESTIMONIAL_CREATED';
    var result = modalMode === 'edit'
      ? await supabase.from('cms_testimonials').update(payload).eq('id', modalEditId).select('id').single()
      : await supabase.from('cms_testimonials').insert(payload).select('id').single();

    if (result.error) throw result.error;
    var testimonialId = result.data && result.data.id ? result.data.id : modalEditId;
    await logCmsActivity(actionType, modalMode === 'edit' ? 'CMS testimonial was updated.' : 'CMS testimonial was created.');

    var mediaUploaded = false;
    if (backgroundFile) {
      var backgroundUrl = await uploadCmsMedia('testimonials', testimonialId, backgroundFile);
      if (!backgroundUrl) throw new Error('Failed to upload image');

      var mediaUpdate = await supabase
        .from('cms_testimonials')
        .update({
          background_type: 'image',
          background_image_url: backgroundUrl,
          updated_by: getCurrentStaffId(),
          updated_at: new Date().toISOString()
        })
        .eq('id', testimonialId);
      if (mediaUpdate.error) throw mediaUpdate.error;
      mediaUploaded = true;
      await logCmsActivity('CMS_TESTIMONIAL_MEDIA_UPLOADED', 'CMS testimonial background image was uploaded.');
    }

    closeCmsModal();
    await reloadCmsAfterWrite(
      mediaUploaded
        ? 'Testimonial saved and background image uploaded.'
        : (modalMode === 'edit' ? 'Testimonial updated.' : 'Testimonial created.')
    );
  } catch (error) {
    console.warn('CMS testimonial save failed.', error);
    showToast(error && error.message === 'Failed to upload image' ? 'Failed to upload image. Please try again.' : 'Failed to save testimonial. Please try again.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   11. FEATURED PROPERTIES
══════════════════════════════════════════════════════════════ */

function renderFeatured() {
  var tbody = document.getElementById('featuredTableBody');
  tbody.innerHTML = '';

  // Sort by order value
  var sorted = featuredProperties.slice().sort(function(a,b){ return a.order - b.order; });
  var filtered = sorted.filter(function(p) {
    return branchMatch(p.branch) && searchMatch(p.ref + ' ' + p.title);
  });

  filtered.forEach(function(p, idx) {
    var bc  = getBadgeClass(p.propStatus);
    var fp  = p.featured ? 'badge-active' : 'badge-draft';
    var row = document.createElement('tr');
    row.innerHTML = [
      '<td>',
        '<div class="order-controls">',
          cmsActionHtml([
            '<button class="btn-move" onclick="moveFeatured(' + quoteId(p.id) + ',-1)" title="Move up">',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
            '</button>'
          ].join('')),
          '<span style="font-size:12px;font-weight:700;color:var(--text-mid)">' + p.order + '</span>',
          cmsActionHtml([
            '<button class="btn-move" onclick="moveFeatured(' + quoteId(p.id) + ',1)" title="Move down">',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
            '</button>'
          ].join('')),
        '</div>',
      '</td>',
      '<td><span class="prop-ref" style="font-size:12px;font-weight:600;color:var(--text-light)">' + p.ref + '</span></td>',
      '<td style="font-weight:600;max-width:220px">' + p.title + '</td>',
      '<td>' + p.branch + '</td>',
      '<td><span class="purpose-pill ' + (p.purpose === 'For Sale' ? 'pill-sale' : 'pill-rent') + '">' + p.purpose + '</span></td>',
      '<td style="font-weight:600;white-space:nowrap">' + p.price + '</td>',
      '<td><span class="badge ' + bc + '">' + p.propStatus + '</span></td>',
      '<td><span class="badge ' + fp + '">' + (p.featured ? 'Featured' : 'Not Featured') + '</span></td>',
      '<td>',
        cmsActionHtml([
          '<div class="table-actions">',
            '<button class="action-btn outline small" onclick="openCmsModal(\'featured\',\'edit\',' + quoteId(p.id) + ')">Edit</button>',
            '<button class="action-btn small ' + (p.featured ? 'danger' : 'secondary') + '" onclick="toggleFeatured(' + quoteId(p.id) + ')">',
              (p.featured ? 'Unfeature' : 'Feature'),
            '</button>',
            '<button class="action-btn danger small" onclick="deleteCmsRecord(\'featured\',' + quoteId(p.id) + ')">Hide</button>',
          '</div>'
        ].join('')),
      '</td>'
    ].join('');
    tbody.appendChild(row);
  });
}

function toggleFeatured(id) {
  var p = featuredProperties.find(function(x){ return x.id === id; });
  if (!p) return;
  updateFeaturedVisibility(id, !p.featured, p.propertyId);
}

function moveFeatured(id, direction) {
  updateFeaturedOrder(id, direction);
}

var btnAddFeatured = document.getElementById('btnAddFeatured');
if (btnAddFeatured) {
  btnAddFeatured.addEventListener('click', function() {
    openCmsModal('featured', 'add');
  });
}

async function updateFeaturedVisibility(id, isVisible, propertyId) {
  if (!ensureCmsReadyForWrite()) return;

  try {
    var result = await getSupabaseClient()
      .from('cms_featured_properties')
      .update({
        is_visible: isVisible,
        updated_by: getCurrentStaffId(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (result.error) throw result.error;
    await logCmsActivity(
      isVisible ? 'CMS_FEATURED_PROPERTY_UPDATED' : 'CMS_FEATURED_PROPERTY_HIDDEN',
      isVisible ? 'Featured property was shown on the homepage.' : 'Featured property was hidden from the homepage.',
      propertyId
    );
    await reloadCmsAfterWrite(isVisible ? 'Featured property shown.' : 'Featured property hidden.');
  } catch (error) {
    console.warn('CMS featured property visibility update failed.', error);
    showToast('Could not update featured property visibility. Please try again.', 'error');
  }
}

async function updateFeaturedOrder(id, direction) {
  if (!ensureCmsReadyForWrite()) return;

  var sorted = featuredProperties.slice().sort(function(a, b) { return a.order - b.order; });
  var index = sorted.findIndex(function(item) { return item.id === id; });
  var swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;

  var current = sorted[index];
  var target = sorted[swapIndex];

  try {
    var supabase = getSupabaseClient();
    var first = await supabase
      .from('cms_featured_properties')
      .update({
        display_order: target.order,
        updated_by: getCurrentStaffId(),
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id);
    if (first.error) throw first.error;

    var second = await supabase
      .from('cms_featured_properties')
      .update({
        display_order: current.order,
        updated_by: getCurrentStaffId(),
        updated_at: new Date().toISOString()
      })
      .eq('id', target.id);
    if (second.error) throw second.error;

    await logCmsActivity('CMS_FEATURED_PROPERTY_UPDATED', 'Featured property order was updated.', current.propertyId);
    await reloadCmsAfterWrite('Featured property order updated.');
  } catch (error) {
    console.warn('CMS featured property order update failed.', error);
    showToast('Could not update featured property order. Please try again.', 'error');
  }
}

async function saveFeaturedFromModal() {
  if (!ensureCmsReadyForWrite()) return;

  var payload = getFeaturedPayload();
  if (!payload.property_id) {
    showToast('Please select a property', 'error');
    return;
  }

  var duplicateVisible = featuredProperties.some(function(item) {
    return item.propertyId === payload.property_id &&
      item.featured &&
      item.id !== modalEditId &&
      payload.is_visible;
  });
  if (duplicateVisible) {
    showToast('That property is already visible as a featured property.', 'error');
    return;
  }

  try {
    var supabase = getSupabaseClient();
    var actionType = modalMode === 'edit' ? 'CMS_FEATURED_PROPERTY_UPDATED' : 'CMS_FEATURED_PROPERTY_CREATED';
    var result = modalMode === 'edit'
      ? await supabase.from('cms_featured_properties').update(payload).eq('id', modalEditId).select('id').single()
      : await supabase.from('cms_featured_properties').insert(payload).select('id').single();

    if (result.error) throw result.error;
    await logCmsActivity(
      actionType,
      modalMode === 'edit' ? 'Featured property CMS row was updated.' : 'Featured property CMS row was created.',
      payload.property_id
    );
    closeCmsModal();
    await reloadCmsAfterWrite(modalMode === 'edit' ? 'Featured property updated.' : 'Featured property added.');
  } catch (error) {
    console.warn('CMS featured property save failed.', error);
    showToast('Could not save featured property. Please try again.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   12. SERVICES SHOWCASE
══════════════════════════════════════════════════════════════ */

function renderServiceShowcase() {
  var grid = document.getElementById('serviceShowcaseGrid');
  var empty = document.getElementById('serviceShowcaseEmpty');
  if (!grid) return;
  if (empty) empty.style.display = 'none';

  var missingLayouts = SERVICE_SHOWCASE_LAYOUT_BLUEPRINT.filter(function(layout) {
    return !getServiceShowcaseItemByLayoutKey(layout.key);
  });
  var customItems = serviceShowcaseItems.filter(function(item) {
    return !serviceShowcaseLayoutKey(item);
  });
  var defaultButton = document.getElementById('btnAddServiceShowcase');
  if (defaultButton) {
    defaultButton.style.display = missingLayouts.length && canManageCms() ? 'inline-flex' : 'none';
  }

  grid.innerHTML = [
    renderServiceDefaultsNotice(missingLayouts),
    '<div class="service-fixed-panel-grid">',
    SERVICE_SHOWCASE_LAYOUT_BLUEPRINT.map(renderFixedServiceShowcasePanel).join(''),
    '</div>',
    renderServiceShowcaseLegacyRows(customItems)
  ].filter(Boolean).join('');
}

var btnAddServiceShowcase = document.getElementById('btnAddServiceShowcase');
if (btnAddServiceShowcase) {
  btnAddServiceShowcase.addEventListener('click', function() {
    createDefaultServiceShowcaseItems();
  });
}

document.addEventListener('click', function(event) {
  if (event.target.closest('#btnCreateDefaultServices')) {
    createDefaultServiceShowcaseItems();
  }
});

function renderServiceDefaultsNotice(missingLayouts) {
  if (!missingLayouts.length) {
    return [
      '<div class="service-sync-note is-complete">',
      '<strong>All five fixed Services cards are connected.</strong>',
      '<span>Edits below update the exact public homepage card placements.</span>',
      '</div>'
    ].join('');
  }

  return [
    '<div class="service-sync-note">',
    '<div>',
    '<strong>' + missingLayouts.length + ' fixed Services card' + (missingLayouts.length === 1 ? '' : 's') + ' not found in Supabase.</strong>',
    '<span>Missing: ' + escapeCmsHtml(missingLayouts.map(function(layout) { return layout.title; }).join(', ')) + '.</span>',
    '</div>',
    cmsActionHtml('<button type="button" class="action-btn primary small" onclick="createDefaultServiceShowcaseItems()">Create Missing Default Service Cards</button>'),
    '</div>'
  ].join('');
}

function renderFixedServiceShowcasePanel(layout) {
  var item = getServiceShowcasePanelItem(layout);
  var existing = Boolean(getServiceShowcaseItemByLayoutKey(layout.key));
  var isMarketing = layout.key === 'marketing';
  var domKey = servicePanelDomKey(layout.key);
  var disabled = canManageCms() ? '' : ' disabled';
  var previewImage = getServiceShowcasePreviewImage(item);
  var highlights = item.highlights || [];
  var statusText = item.active ? 'Active' : 'Inactive';
  var warning = isMarketing && !item.hoverVideoUrl
    ? '<div class="service-video-warning">No video uploaded. The website will show this as a static image card and the scroll-scrub effect will not activate.</div>'
    : '';
  var preview = previewImage
    ? '<img src="' + escapeAttribute(previewImage) + '" alt="' + escapeAttribute(item.imageAlt || item.title) + '" />'
    : '<span>' + escapeCmsHtml(layout.iconKey) + '</span>';

  return [
    '<article class="service-fixed-panel service-fixed-panel--' + escapeAttribute(domKey) + (isMarketing ? ' is-marketing' : '') + (existing ? '' : ' is-missing-row') + '">',
    '<div class="service-fixed-panel-head">',
    '<div>',
    '<span class="service-layout-label">' + escapeCmsHtml(layout.label) + '</span>',
    '<h3>' + escapeCmsHtml(layout.title) + '</h3>',
    '<p>' + (existing ? 'Connected to cms_service_showcase_items.' : 'Default row not created yet. Save or create defaults to connect it.') + '</p>',
    '</div>',
    '<div class="service-panel-state">',
    '<span class="badge ' + getBadgeClass(statusText === 'Active' ? 'Active' : 'Hidden') + '">' + escapeCmsHtml(statusText) + '</span>',
    cmsActionHtml('<button type="button" class="action-btn outline small" onclick="focusServiceShowcasePanel(\'' + escapeAttribute(layout.key) + '\')">Edit fields</button>'),
    '<span class="service-save-status" id="' + servicePanelFieldId(layout.key, 'saveStatus') + '">' + (existing ? 'Saved row loaded' : 'Default row missing') + '</span>',
    '</div>',
    '</div>',
    '<div class="service-fixed-panel-body">',
    '<div class="service-fixed-preview">',
    '<div class="service-website-preview' + (previewImage ? ' has-image' : '') + '">',
    preview,
    '<div class="service-website-preview-grade"></div>',
    isMarketing ? '<span class="service-preview-pill">' + escapeCmsHtml(item.caseStudyLabel || 'View Case Study') + '</span>' : '',
    '<div class="service-preview-copy">',
    item.badge ? '<span>' + escapeCmsHtml(item.badge) + '</span>' : '',
    '<strong>' + escapeCmsHtml(item.title) + '</strong>',
    '<p>' + escapeCmsHtml(item.description || '') + '</p>',
    '<div class="service-preview-chips">' + highlights.slice(0, 2).map(function(highlight) {
      return '<span class="service-preview-chip">' + escapeCmsHtml(highlight) + '</span>';
    }).join('') + '</div>',
    '</div>',
    '</div>',
    '<div class="service-fixed-meta">',
    '<span>icon_key: ' + escapeCmsHtml(layout.iconKey) + '</span>',
    '<span>visual_theme: ' + escapeCmsHtml(layout.visualTheme) + '</span>',
    '<span>display_order: ' + Number(layout.order) + '</span>',
    isMarketing ? '<span>is_case_study: true</span>' : '',
    '</div>',
    '</div>',
    '<div class="service-fixed-fields">',
    '<div class="service-field-grid">',
    renderServiceTextField(layout.key, 'badge', 'Badge / label', item.badge, 'text', disabled),
    renderServiceTextField(layout.key, 'title', 'Title', item.title, 'text', disabled),
    '</div>',
    renderServiceTextareaField(layout.key, 'description', 'Short description', item.description, disabled),
    '<div class="service-field-grid">',
    renderServiceTextField(layout.key, 'chip1', 'Highlight chip 1', highlights[0] || '', 'text', disabled),
    renderServiceTextField(layout.key, 'chip2', 'Highlight chip 2', highlights[1] || '', 'text', disabled),
    '</div>',
    '<label class="service-active-toggle"><input type="checkbox" id="' + servicePanelFieldId(layout.key, 'active') + '"' + (item.active ? ' checked' : '') + disabled + ' /> Active on website</label>',
    '<div class="service-panel-section-label">Image</div>',
    renderServiceMediaField(layout.key, {
      label: 'Image URL',
      urlField: 'imageUrl',
      fileField: 'imageFile',
      value: item.imageUrl,
      accept: 'image/jpeg,image/png,image/webp',
      uploadText: 'Upload image'
    }),
    renderServiceTextField(layout.key, 'imageAlt', 'Image alt text', item.imageAlt || item.title, 'text', disabled),
    isMarketing ? renderMarketingServiceFields(layout, item) : '',
    warning,
    cmsActionHtml('<button type="button" class="action-btn primary service-save-btn" onclick="saveFixedServiceShowcaseCard(\'' + escapeAttribute(layout.key) + '\')">Save ' + escapeCmsHtml(layout.title) + '</button>'),
    '</div>',
    '</div>',
    '</article>'
  ].join('');
}

function focusServiceShowcasePanel(layoutKey) {
  var firstField = document.getElementById(servicePanelFieldId(layoutKey, 'badge')) ||
    document.getElementById(servicePanelFieldId(layoutKey, 'title'));
  if (firstField) {
    firstField.focus();
    firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setServiceShowcaseSaveStatus(layoutKey, message, type) {
  var status = document.getElementById(servicePanelFieldId(layoutKey, 'saveStatus'));
  if (!status) return;
  status.textContent = message || '';
  status.className = 'service-save-status' + (type ? ' ' + type : '');
}

function renderMarketingServiceFields(layout, item) {
  var disabled = canManageCms() ? '' : ' disabled';
  return [
    '<div class="service-panel-section-label">Case Study</div>',
    '<div class="service-field-grid">',
    renderServiceTextField(layout.key, 'caseStudyLabel', 'Case study label', item.caseStudyLabel || 'View Case Study', 'text', disabled),
    renderServiceTextField(layout.key, 'caseStudyUrl', 'Case study URL', item.caseStudyUrl || '', 'url', disabled),
    '</div>',
    '<div class="service-panel-section-label">Scroll Video</div>',
    renderServiceMediaField(layout.key, {
      label: 'Video URL',
      urlField: 'hoverVideoUrl',
      fileField: 'hoverVideoFile',
      value: item.hoverVideoUrl,
      accept: 'video/mp4,video/webm',
      uploadText: 'Upload video'
    }),
    renderServiceMediaField(layout.key, {
      label: 'Poster / fallback image URL',
      urlField: 'hoverVideoPosterUrl',
      fileField: 'hoverVideoPosterFile',
      value: item.hoverVideoPosterUrl,
      accept: 'image/jpeg,image/png,image/webp',
      uploadText: 'Upload poster image'
    })
  ].join('');
}

function renderServiceTextField(layoutKey, fieldName, label, value, type, disabled) {
  var id = servicePanelFieldId(layoutKey, fieldName);
  return [
    '<div class="service-panel-field">',
    '<label for="' + id + '">' + escapeCmsHtml(label) + '</label>',
    '<input type="' + escapeAttribute(type || 'text') + '" id="' + id + '" value="' + escapeAttribute(value || '') + '"' + (disabled || '') + ' />',
    '</div>'
  ].join('');
}

function renderServiceTextareaField(layoutKey, fieldName, label, value, disabled) {
  var id = servicePanelFieldId(layoutKey, fieldName);
  return [
    '<div class="service-panel-field">',
    '<label for="' + id + '">' + escapeCmsHtml(label) + '</label>',
    '<textarea id="' + id + '" rows="3"' + (disabled || '') + '>' + escapeCmsHtml(value || '') + '</textarea>',
    '</div>'
  ].join('');
}

function renderServiceMediaField(layoutKey, options) {
  var urlId = servicePanelFieldId(layoutKey, options.urlField);
  var fileId = servicePanelFieldId(layoutKey, options.fileField);
  var disabled = canManageCms() ? '' : ' disabled';
  return [
    '<div class="service-panel-field service-panel-media-field">',
    '<label for="' + urlId + '">' + escapeCmsHtml(options.label) + '</label>',
    '<div class="service-url-row">',
    '<input type="url" id="' + urlId + '" value="' + escapeAttribute(options.value || '') + '" placeholder="Paste public media URL"' + disabled + ' />',
    '</div>',
    cmsActionHtml('<label class="service-file-picker" for="' + fileId + '"><input type="file" id="' + fileId + '" accept="' + escapeAttribute(options.accept) + '" /><span>' + escapeCmsHtml(options.uploadText) + '</span></label>'),
    '</div>'
  ].join('');
}

function renderServiceShowcaseLegacyRows(items) {
  if (!items.length) return '';
  return [
    '<section class="service-legacy-panel">',
    '<h3>Legacy / Custom Service Rows</h3>',
    '<p>These rows do not match the fixed public Services layout. They are preserved here so existing data is not hidden.</p>',
    '<div class="service-legacy-list">',
    items.map(function(item) {
      return [
        '<div class="service-legacy-row">',
        '<div><strong>' + escapeCmsHtml(item.title || 'Untitled service') + '</strong><span>' + escapeCmsHtml(item.iconKey || item.visualTheme || 'No fixed identity') + '</span></div>',
        cmsActionHtml('<button type="button" class="action-btn small ' + (item.active ? 'danger' : 'secondary') + '" onclick="toggleServiceShowcaseStatus(' + quoteId(item.id) + ')">' + (item.active ? 'Hide' : 'Show') + '</button>'),
        '</div>'
      ].join('');
    }).join(''),
    '</div>',
    '</section>'
  ].join('');
}

function servicePanelValue(layoutKey, fieldName) {
  return fieldValue(servicePanelFieldId(layoutKey, fieldName));
}

function servicePanelChecked(layoutKey, fieldName) {
  var el = document.getElementById(servicePanelFieldId(layoutKey, fieldName));
  return Boolean(el && el.checked);
}

function servicePanelFile(layoutKey, fieldName) {
  return selectedFile(servicePanelFieldId(layoutKey, fieldName));
}

function getFixedServiceShowcasePayload(layout) {
  var highlights = [
    servicePanelValue(layout.key, 'chip1'),
    servicePanelValue(layout.key, 'chip2')
  ].map(function(value) { return value.trim(); }).filter(Boolean);
  var isMarketing = layout.key === 'marketing';

  return {
    display_order: layout.order,
    is_active: servicePanelChecked(layout.key, 'active'),
    title: servicePanelValue(layout.key, 'title'),
    badge: cleanValue(servicePanelValue(layout.key, 'badge')),
    description: servicePanelValue(layout.key, 'description'),
    highlights: highlights,
    icon_key: layout.iconKey,
    image_url: cleanValue(servicePanelValue(layout.key, 'imageUrl')),
    image_alt: cleanValue(servicePanelValue(layout.key, 'imageAlt')) || layout.title,
    visual_theme: layout.visualTheme,
    is_case_study: Boolean(layout.isCaseStudy),
    case_study_label: isMarketing
      ? (cleanValue(servicePanelValue(layout.key, 'caseStudyLabel')) || 'View Case Study')
      : null,
    case_study_url: isMarketing ? cleanValue(servicePanelValue(layout.key, 'caseStudyUrl')) : null,
    hover_video_url: isMarketing ? cleanValue(servicePanelValue(layout.key, 'hoverVideoUrl')) : null,
    hover_video_poster_url: isMarketing ? cleanValue(servicePanelValue(layout.key, 'hoverVideoPosterUrl')) : null,
    updated_at: new Date().toISOString()
  };
}

async function saveFixedServiceShowcaseCard(layoutKey) {
  if (!ensureCmsReadyForWrite()) return;

  var layout = getServiceShowcaseLayoutByKey(layoutKey);
  if (!layout) {
    showToast('Unknown Services card.', 'error');
    return;
  }

  var payload = getFixedServiceShowcasePayload(layout);
  var imageFile = servicePanelFile(layout.key, 'imageFile');
  var videoFile = layout.key === 'marketing' ? servicePanelFile(layout.key, 'hoverVideoFile') : null;
  var posterFile = layout.key === 'marketing' ? servicePanelFile(layout.key, 'hoverVideoPosterFile') : null;

  if (!payload.title) {
    showToast('Please enter a service title.', 'error');
    return;
  }
  if (!payload.description) {
    showToast('Please enter a short service description.', 'error');
    return;
  }

  var imageError = imageFile ? validateCmsImageFile(imageFile) : null;
  var videoError = videoFile ? validateServiceShowcaseVideoFile(videoFile) : null;
  var posterError = posterFile ? validateCmsImageFile(posterFile) : null;
  if (imageError || videoError || posterError) {
    showToast(imageError || videoError || posterError, 'error');
    return;
  }

  try {
    setServiceShowcaseSaveStatus(layout.key, 'Saving...', '');
    var supabase = getSupabaseClient();
    var existing = getServiceShowcaseItemByLayoutKey(layout.key);
    var result = existing
      ? await supabase.from('cms_service_showcase_items').update(payload).eq('id', existing.id).select('id').single()
      : await supabase.from('cms_service_showcase_items').insert(payload).select('id').single();

    if (result.error) throw result.error;
    var itemId = result.data && result.data.id ? result.data.id : existing.id;
    var mediaUpdates = {};

    if (imageFile) {
      var imageUrl = await uploadServiceShowcaseMedia('image', imageFile, layout.key);
      if (imageUrl) mediaUpdates.image_url = imageUrl;
    }
    if (videoFile) {
      var videoUrl = await uploadServiceShowcaseMedia('video', videoFile, layout.key);
      if (videoUrl) mediaUpdates.hover_video_url = videoUrl;
    }
    if (posterFile) {
      var posterUrl = await uploadServiceShowcaseMedia('poster', posterFile, layout.key);
      if (posterUrl) mediaUpdates.hover_video_poster_url = posterUrl;
    }

    if (Object.keys(mediaUpdates).length) {
      mediaUpdates.updated_at = new Date().toISOString();
      var mediaUpdate = await supabase
        .from('cms_service_showcase_items')
        .update(mediaUpdates)
        .eq('id', itemId);
      if (mediaUpdate.error) throw mediaUpdate.error;
      await logCmsActivity('CMS_SERVICE_SHOWCASE_MEDIA_UPLOADED', layout.title + ' media was uploaded.');
    }

    await logCmsActivity(
      existing ? 'CMS_SERVICE_SHOWCASE_UPDATED' : 'CMS_SERVICE_SHOWCASE_CREATED',
      layout.title + ' Services Showcase card was saved.'
    );
    setServiceShowcaseSaveStatus(layout.key, 'Saved', 'success');
    await reloadCmsAfterWrite(layout.title + ' Services card saved.');
  } catch (error) {
    console.warn('Fixed Services Showcase save failed.', error);
    setServiceShowcaseSaveStatus(layout.key, 'Save failed', 'error');
    showToast('Could not save ' + layout.title + '. Run supabase/services-showcase-cms.sql if needed.', 'error');
  }
}

function renderServiceShowcaseLane(title, subtitle, items, layoutKeys) {
  var laneItems = layoutKeys.map(function(key) {
    return items.find(function(item) {
      return serviceShowcaseLayoutKey(item) === key;
    });
  }).filter(Boolean);

  if (!laneItems.length) return '';

  return [
    '<section class="service-layout-lane service-layout-lane--' + escapeAttribute(layoutKeys.join('-')) + '">',
    '<div class="service-layout-lane-header">',
    '<span>' + escapeCmsHtml(title) + '</span>',
    '<small>' + escapeCmsHtml(subtitle) + '</small>',
    '</div>',
    '<div class="service-layout-lane-grid">',
    laneItems.map(renderServiceShowcaseDashboardCard).join(''),
    '</div>',
    '</section>'
  ].join('');
}

function renderServiceShowcaseCustomLane(items) {
  var customItems = items.filter(function(item) {
    return !serviceShowcaseLayoutKey(item);
  });
  if (!customItems.length) return '';
  return [
    '<section class="service-layout-lane service-layout-lane--custom">',
    '<div class="service-layout-lane-header">',
    '<span>Custom services</span>',
    '<small>Additional website service cards</small>',
    '</div>',
    '<div class="service-layout-lane-grid">',
    customItems.map(renderServiceShowcaseDashboardCard).join(''),
    '</div>',
    '</section>'
  ].join('');
}

function renderServiceShowcaseDashboardCard(item) {
  var bc = getBadgeClass(item.status);
  var layout = getServiceShowcaseLayoutMeta(item);
  var isMarketing = layout.key === 'marketing';
  var previewImage = getServiceShowcasePreviewImage(item);
  var highlights = (item.highlights || []).slice(0, 3).map(function(highlight) {
    return '<span class="service-preview-chip">' + escapeCmsHtml(highlight) + '</span>';
  }).join('');
  var mediaPreview = previewImage
    ? '<img src="' + escapeAttribute(previewImage) + '" alt="' + escapeAttribute(item.imageAlt || item.title) + '" />'
    : '<span>' + escapeCmsHtml(item.iconKey || item.visualTheme || 'service') + '</span>';
  var videoStatus = item.hoverVideoUrl
    ? '<span class="service-video-state is-ready">Scroll video uploaded</span>'
    : '<span class="service-video-state is-missing">No video uploaded. Website will show a static card.</span>';
  var posterStatus = item.hoverVideoPosterUrl ? 'Poster ready' : 'No poster';

  return [
    '<article class="service-dashboard-card' + (isMarketing ? ' is-featured-video' : '') + '">',
    '<div class="service-dashboard-card-top">',
    '<span class="service-layout-label">' + escapeCmsHtml(layout.label) + '</span>',
    '<span class="badge ' + bc + '">' + escapeCmsHtml(item.status) + '</span>',
    '</div>',
    '<div class="service-website-preview' + (previewImage ? ' has-image' : '') + '">',
    mediaPreview,
    '<div class="service-website-preview-grade"></div>',
    item.isCaseStudy ? '<span class="service-preview-pill">' + escapeCmsHtml(item.caseStudyLabel || 'View Case Study') + '</span>' : '',
    '<div class="service-preview-copy">',
    item.badge ? '<span>' + escapeCmsHtml(item.badge) + '</span>' : '',
    '<strong>' + escapeCmsHtml(item.title) + '</strong>',
    '<p>' + escapeCmsHtml(item.description || 'Use one short sentence.') + '</p>',
    highlights ? '<div class="service-preview-chips">' + highlights + '</div>' : '',
    '</div>',
    '</div>',
    '<div class="service-dashboard-card-body">',
    '<h3>' + escapeCmsHtml(item.title) + '</h3>',
    '<div class="service-card-facts">',
    '<span>Order ' + Number(item.order || 0) + '</span>',
    '<span>Icon ' + escapeCmsHtml(item.iconKey || '-') + '</span>',
    '<span>Theme ' + escapeCmsHtml(item.visualTheme || '-') + '</span>',
    '</div>',
    isMarketing ? [
      '<div class="service-featured-note">',
      '<strong>Featured Case Study Video Card</strong>',
      '<p>Controls the large middle website card, View Case Study overlay, poster/fallback image, and optional pinned scroll-scrub video.</p>',
      '</div>',
      '<div class="service-media-status">',
      videoStatus,
      '<span>' + escapeCmsHtml(posterStatus) + '</span>',
      '<span>CTA: ' + escapeCmsHtml(item.caseStudyLabel || 'View Case Study') + '</span>',
      '<span>URL: ' + escapeCmsHtml(item.caseStudyUrl || 'Not set') + '</span>',
      '</div>'
    ].join('') : '',
    '</div>',
    cmsActionHtml([
      '<div class="banner-actions service-dashboard-actions">',
      '<button class="action-btn outline small" onclick="openCmsModal(\'service\',\'edit\',' + quoteId(item.id) + ')">Edit</button>',
      '<button class="action-btn small ' + (item.active ? 'danger' : 'secondary') + '" onclick="toggleServiceShowcaseStatus(' + quoteId(item.id) + ')">',
      (item.active ? 'Hide' : 'Show'),
      '</button>',
      '<button class="action-btn danger small" onclick="deleteCmsRecord(\'service\',' + quoteId(item.id) + ')">Deactivate</button>',
      '</div>'
    ].join('')),
    '</article>'
  ].join('');
}

function toggleServiceShowcaseStatus(id) {
  var item = serviceShowcaseItems.find(function(row) { return row.id === id; });
  if (!item) return;
  updateServiceShowcaseVisibility(id, !item.active);
}

async function createDefaultServiceShowcaseItems() {
  if (!ensureCmsReadyForWrite()) return;

  var missingLayouts = SERVICE_SHOWCASE_LAYOUT_BLUEPRINT.filter(function(layout) {
    return !getServiceShowcaseItemByLayoutKey(layout.key);
  });

  if (!missingLayouts.length) {
    showToast('All five default Services cards already exist.', 'success');
    return;
  }

  try {
    var payload = missingLayouts.map(getServiceShowcasePayloadFromBlueprint);
    var result = await getSupabaseClient()
      .from('cms_service_showcase_items')
      .insert(payload)
      .select('id');
    if (result.error) throw result.error;
    await logCmsActivity('CMS_SERVICE_SHOWCASE_DEFAULTS_CREATED', 'Default Services Showcase rows were created.');
    await reloadCmsAfterWrite('Default Services Showcase cards created.');
  } catch (error) {
    console.warn('Default Services Showcase creation failed.', error);
    showToast('Could not create default Services Showcase. Run supabase/services-showcase-cms.sql if needed.', 'error');
  }
}

async function updateServiceShowcaseVisibility(id, isActive) {
  if (!ensureCmsReadyForWrite()) return;

  try {
    var result = await getSupabaseClient()
      .from('cms_service_showcase_items')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (result.error) throw result.error;
    await logCmsActivity(
      isActive ? 'CMS_SERVICE_SHOWCASE_UPDATED' : 'CMS_SERVICE_SHOWCASE_HIDDEN',
      isActive ? 'Services Showcase item was shown.' : 'Services Showcase item was hidden.'
    );
    await reloadCmsAfterWrite(isActive ? 'Services Showcase item shown.' : 'Services Showcase item hidden.');
  } catch (error) {
    console.warn('Services Showcase visibility update failed.', error);
    showToast('Could not update Services Showcase item. Run supabase/services-showcase-cms.sql if needed.', 'error');
  }
}

async function saveServiceShowcaseFromModal() {
  if (!ensureCmsReadyForWrite()) return;

  var payload = getServiceShowcasePayload();
  var imageFile = selectedFile('mf_imageFile');
  var videoFile = selectedFile('mf_hoverVideoFile');
  var posterFile = selectedFile('mf_hoverVideoPosterFile');

  if (!payload.title) {
    showToast('Please enter a service title.', 'error');
    return;
  }
  if (!payload.description) {
    showToast('Please enter a service description.', 'error');
    return;
  }

  var imageError = imageFile ? validateCmsImageFile(imageFile) : null;
  var videoError = videoFile ? validateServiceShowcaseVideoFile(videoFile) : null;
  var posterError = posterFile ? validateCmsImageFile(posterFile) : null;
  if (imageError || videoError || posterError) {
    showToast(imageError || videoError || posterError, 'error');
    return;
  }

  try {
    var supabase = getSupabaseClient();
    var actionType = modalMode === 'edit' ? 'CMS_SERVICE_SHOWCASE_UPDATED' : 'CMS_SERVICE_SHOWCASE_CREATED';
    var result = modalMode === 'edit'
      ? await supabase.from('cms_service_showcase_items').update(payload).eq('id', modalEditId).select('id').single()
      : await supabase.from('cms_service_showcase_items').insert(payload).select('id').single();

    if (result.error) throw result.error;
    var itemId = result.data && result.data.id ? result.data.id : modalEditId;

    var mediaUpdates = {};
    if (imageFile) {
      var imageUrl = await uploadServiceShowcaseMedia('image', imageFile);
      if (imageUrl) mediaUpdates.image_url = imageUrl;
    }
    if (videoFile) {
      var videoUrl = await uploadServiceShowcaseMedia('video', videoFile);
      if (videoUrl) mediaUpdates.hover_video_url = videoUrl;
    }
    if (posterFile) {
      var posterUrl = await uploadServiceShowcaseMedia('poster', posterFile);
      if (posterUrl) mediaUpdates.hover_video_poster_url = posterUrl;
    }

    if (Object.keys(mediaUpdates).length) {
      mediaUpdates.updated_at = new Date().toISOString();
      var mediaUpdate = await supabase
        .from('cms_service_showcase_items')
        .update(mediaUpdates)
        .eq('id', itemId);
      if (mediaUpdate.error) throw mediaUpdate.error;
      await logCmsActivity('CMS_SERVICE_SHOWCASE_MEDIA_UPLOADED', 'Services Showcase media was uploaded.');
    }

    await logCmsActivity(actionType, modalMode === 'edit' ? 'Services Showcase item was updated.' : 'Services Showcase item was created.');
    closeCmsModal();
    await reloadCmsAfterWrite(modalMode === 'edit' ? 'Services Showcase item updated.' : 'Services Showcase item created.');
  } catch (error) {
    console.warn('Services Showcase save failed.', error);
    showToast('Could not save Services Showcase item. Run supabase/services-showcase-cms.sql if needed.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   13. NEWS / ARTICLES
══════════════════════════════════════════════════════════════ */

function renderArticles() {
  var list  = document.getElementById('articleList');
  var empty = document.getElementById('articleEmpty');

  var filtered = articles.filter(function(a) {
    return branchMatch(a.branch)
        && statusMatch(a.status)
        && searchMatch(a.title + ' ' + a.author + ' ' + a.category);
  });

  if (!filtered.length) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = '';

  filtered.forEach(function(a) {
    var bc   = getBadgeClass(a.status);
    var item = document.createElement('div');
    item.className = 'cms-list-item article-item';
    item.innerHTML = [
      '<div class="article-content">',
        '<div class="article-title">' + a.title + '</div>',
        '<div class="article-meta">',
          '<span>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            a.author,
          '</span>',
          '<span>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
            a.publishDate,
          '</span>',
          '<span>' + a.category + '</span>',
          '<span class="badge ' + bc + '">' + a.status + '</span>',
        '</div>',
        '<div class="article-summary">' + a.summary + '</div>',
      '</div>',
      cmsActionHtml([
        '<div class="item-actions">',
          '<button class="action-btn outline small" onclick="openCmsModal(\'article\',\'edit\',' + a.id + ')">Edit</button>',
          '<button class="action-btn small ' + (a.status === 'Published' ? 'danger' : 'secondary') + '" onclick="toggleArticleStatus(' + a.id + ')">',
            (a.status === 'Published' ? 'Unpublish' : 'Publish'),
          '</button>',
          '<button class="action-btn danger small" onclick="deleteCmsRecord(\'article\',' + a.id + ')">Hide</button>',
        '</div>'
      ].join(''))
    ].join('');
    list.appendChild(item);
  });
}

document.getElementById('btnAddArticle').addEventListener('click', function() {
  openCmsModal('article', 'add');
});

function toggleArticleStatus(id) {
  var a = articles.find(function(x){ return x.id === id; });
  if (!a) return;
  phase6BToast('CMS article');
}


/* ══════════════════════════════════════════════════════════════
   13. GENERIC DELETE
══════════════════════════════════════════════════════════════ */

function deleteCmsRecord(type, id) {
  if (type === 'banner') {
    updateBannerVisibility(id, false);
    return;
  }
  if (type === 'team') {
    updateTeamVisibility(id, false);
    return;
  }
  if (type === 'testimonial') {
    updateTestimonialVisibility(id, false);
    return;
  }
  if (type === 'featured') {
    var p = featuredProperties.find(function(item) { return item.id === id; });
    updateFeaturedVisibility(id, false, p ? p.propertyId : null);
    return;
  }
  if (type === 'service') {
    updateServiceShowcaseVisibility(id, false);
    return;
  }
  phase6BToast('CMS article');
}


/* ══════════════════════════════════════════════════════════════
   14. CMS MODAL — OPEN
══════════════════════════════════════════════════════════════ */

function openCmsModal(type, mode, id) {
  if (!requireCmsManagePermission()) return;

  modalContentType = type;
  modalMode        = mode;
  modalEditId      = id || null;

  var titles = {
    banner:      { add: 'Add New Banner',       edit: 'Edit Banner' },
    team:        { add: 'Add Team Profile',      edit: 'Edit Team Profile' },
    testimonial: { add: 'Add Testimonial',       edit: 'Edit Testimonial' },
    featured:    { add: 'Add Featured Property', edit: 'Edit Featured Property' },
    service:     { add: 'Add Service Showcase Item', edit: 'Edit Service Showcase Item' },
    article:     { add: 'Add Article',           edit: 'Edit Article' }
  };

  cmsModalTitle.textContent    = titles[type][mode];
  cmsModalSubtitle.textContent = (mode === 'add') ? 'Fill in the details below.' : 'Update the details below.';

  // Inject the correct form into the modal body
  cmsModalBody.innerHTML = buildModalForm(type, mode, id);
  if (type === 'testimonial') {
    initTestimonialBackgroundControls();
  }

  // Show modal
  cmsModal.style.display = 'flex';
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){ cmsModal.classList.add('open'); });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}


/* ══════════════════════════════════════════════════════════════
   15. MODAL FORM BUILDER
   Returns HTML string for the form body based on content type.
══════════════════════════════════════════════════════════════ */

function buildModalForm(type, mode, id) {
  var record = null;

  if (mode === 'edit') {
    if (type === 'banner')       record = banners.find(function(x){ return x.id === id; });
    if (type === 'team')         record = teamProfiles.find(function(x){ return x.id === id; });
    if (type === 'testimonial')  record = testimonials.find(function(x){ return x.id === id; });
    if (type === 'featured')     record = featuredProperties.find(function(x){ return x.id === id; });
    if (type === 'service')      record = serviceShowcaseItems.find(function(x){ return x.id === id; });
    if (type === 'article')      record = articles.find(function(x){ return x.id === id; });
  }

  var v = function(field, def) {
    return (record && record[field] !== undefined) ? record[field] : (def || '');
  };

  var branchOptions = [
    '<option value="All"'           + (v('branch') === 'All'           ? ' selected' : '') + '>All Branches</option>',
    '<option value="Harare"'        + (v('branch') === 'Harare'        ? ' selected' : '') + '>Harare</option>',
    '<option value="Bulawayo"'      + (v('branch') === 'Bulawayo'      ? ' selected' : '') + '>Bulawayo</option>'
  ].join('');
  var ev = function(field, def) { return escapeAttribute(v(field, def)); };
  var tv = function(field, def) { return escapeCmsHtml(v(field, def)); };

  // ── BANNER FORM ──────────────────────────────────────────────
  if (type === 'banner') {
    return [
      '<div class="form-section-label">Banner Details</div>',
      '<div class="form-group full"><label>Banner Title</label>',
        '<input type="text" id="mf_title" value="' + v('title') + '" placeholder="e.g. Premium Properties in Harare" /></div>',
      '<div class="form-group full"><label>Subtitle</label>',
        '<textarea id="mf_subtitle" rows="2">' + v('subtitle') + '</textarea></div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Branch</label>',
          '<select id="mf_branch">' + branchOptions + '</select></div>',
        '<div class="form-group half"><label>Status</label>',
          '<select id="mf_status">',
            '<option value="Draft"' + (v('status') === 'Draft' ? ' selected' : '') + '>Draft</option>',
            '<option value="Published"' + (v('status') === 'Published' ? ' selected' : '') + '>Published</option>',
          '</select></div>',
      '</div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>CTA Button Text</label>',
          '<input type="text" id="mf_btnText" value="' + v('btnText') + '" /></div>',
        '<div class="form-group half"><label>CTA Button Link</label>',
          '<input type="url" id="mf_btnLink" value="' + v('btnLink') + '" placeholder="https://…" /></div>',
      '</div>',
      '<div class="form-section-label">Banner Image</div>',
      '<div class="form-group full"><label>Image URL</label>',
        '<input type="url" id="mf_imageUrl" value="' + v('imageUrl') + '" placeholder="https://…" /></div>',
      '<label class="cms-img-upload" for="mf_imageFile">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        '<p>Choose a banner image to upload</p>',
        '<span>JPG, PNG, or WebP. Maximum 5MB.</span>',
        '<input type="file" id="mf_imageFile" accept="image/jpeg,image/png,image/webp" />',
      '</label>',
      '<p class="cms-img-note">Manual URL remains supported. If you choose a file, the uploaded image takes priority.</p>'
    ].join('');
  }

  // ── TEAM FORM ─────────────────────────────────────────────────
  if (type === 'team') {
    return [
      '<div class="form-section-label">Personal Details</div>',
      '<div class="form-group full"><label>Linked Staff User</label>',
        '<select id="mf_staffUser">' + buildStaffOptions(v('staffUserId')) + '</select></div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Full Name</label>',
          '<input type="text" id="mf_name" value="' + v('name') + '" /></div>',
        '<div class="form-group half"><label>Job Title</label>',
          '<input type="text" id="mf_jobTitle" value="' + v('jobTitle') + '" /></div>',
      '</div>',
      '<div class="form-row">',
        '<div class="form-group third"><label>Branch</label>',
          '<select id="mf_branch">' + branchOptions + '</select></div>',
        '<div class="form-group third"><label>Phone</label>',
          '<input type="tel" id="mf_phone" value="' + v('phone') + '" /></div>',
        '<div class="form-group third"><label>Email</label>',
          '<input type="email" id="mf_email" value="' + v('email') + '" /></div>',
      '</div>',
      '<div class="form-group full"><label>Short Bio</label>',
        '<textarea id="mf_bio" rows="3">' + v('bio') + '</textarea></div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Visibility</label>',
          '<select id="mf_status">',
            '<option value="Visible"' + (v('status') === 'Visible' ? ' selected' : '') + '>Visible</option>',
            '<option value="Hidden"'  + (v('status') === 'Hidden'  ? ' selected' : '') + '>Hidden</option>',
          '</select></div>',
      '</div>',
      '<div class="form-section-label">Profile Photo</div>',
      '<div class="form-group full"><label>Photo URL</label>',
        '<input type="url" id="mf_photoUrl" value="' + v('photoUrl') + '" placeholder="https://…" /></div>',
      '<label class="cms-img-upload" for="mf_photoFile">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        '<p>Choose a profile photo to upload</p>',
        '<span>JPG, PNG, or WebP. Maximum 5MB.</span>',
        '<input type="file" id="mf_photoFile" accept="image/jpeg,image/png,image/webp" />',
      '</label>',
      '<p class="cms-img-note">Manual URL remains supported. If you choose a file, the uploaded photo takes priority.</p>'
    ].join('');
  }

  // ── TESTIMONIAL FORM ──────────────────────────────────────────
  if (type === 'testimonial') {
    var stars = '';
    for (var s = 5; s >= 1; s--) {
      stars += '<input type="radio" name="mf_rating" id="star' + s + '" value="' + s + '"' + (v('rating', 5) == s ? ' checked' : '') + ' />';
      stars += '<label for="star' + s + '">★</label>';
    }
    return [
      '<div class="form-row">',
        '<div class="form-group half"><label>Client Name</label>',
          '<input type="text" id="mf_clientName" value="' + v('clientName') + '" /></div>',
        '<div class="form-group half"><label>Client Type</label>',
          '<select id="mf_clientType">',
            '<option value="Buyer"'    + (v('clientType') === 'Buyer'    ? ' selected' : '') + '>Buyer</option>',
            '<option value="Tenant"'   + (v('clientType') === 'Tenant'   ? ' selected' : '') + '>Tenant</option>',
            '<option value="Landlord"' + (v('clientType') === 'Landlord' ? ' selected' : '') + '>Landlord</option>',
            '<option value="Investor"' + (v('clientType') === 'Investor' ? ' selected' : '') + '>Investor</option>',
          '</select></div>',
      '</div>',
      '<div class="form-group full"><label>Testimonial Message</label>',
        '<textarea id="mf_message" rows="4">' + v('message') + '</textarea></div>',
      '<div class="form-group full"><label>Rating</label>',
        '<div class="star-rating-input">' + stars + '</div></div>',
      '<div class="form-section-label">Carousel Background</div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Background Type</label>',
          '<select id="mf_backgroundType">',
            '<option value="image"' + (v('backgroundType', 'solid') === 'image' ? ' selected' : '') + '>Image background</option>',
            '<option value="solid"' + (v('backgroundType', 'solid') === 'solid' ? ' selected' : '') + '>Solid navy / blue background</option>',
          '</select></div>',
        '<div class="form-group half"><label>Solid Background Color</label>',
          '<input type="text" id="mf_backgroundColor" value="' + v('backgroundColor', '#071827') + '" placeholder="#071827" />',
          '<p class="field-helper">Used when the background type is solid or when an image fails to load.</p></div>',
      '</div>',
      '<div class="form-group full"><label>Background Image URL</label>',
        '<input type="url" id="mf_backgroundImageUrl" value="' + v('backgroundImageUrl') + '" placeholder="https://… or assets/images/hero-poster.png" /></div>',
      '<label class="cms-img-upload" for="mf_backgroundImageFile">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        '<p>Choose a testimonial background image</p>',
        '<span>JPG, PNG, or WebP. Maximum 5MB.</span>',
        '<input type="file" id="mf_backgroundImageFile" accept="image/jpeg,image/png,image/webp" />',
      '</label>',
      '<p class="cms-img-note">Uploads save public URLs in the cms-media bucket. Manual image URLs remain supported.</p>',
      '<div class="testimonial-bg-preview" id="testimonialBackgroundPreview"></div>',
      '<div class="testimonial-bg-upload-status" id="testimonialBackgroundUploadStatus"></div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Branch</label>',
          '<select id="mf_branch">' + branchOptions + '</select></div>',
        '<div class="form-group half"><label>Status</label>',
          '<select id="mf_status">',
            '<option value="Pending"'   + (v('status') === 'Pending'   ? ' selected' : '') + '>Pending</option>',
            '<option value="Published"' + (v('status') === 'Published' ? ' selected' : '') + '>Published</option>',
            '<option value="Hidden"'    + (v('status') === 'Hidden'    ? ' selected' : '') + '>Hidden</option>',
          '</select></div>',
      '</div>',
      '<div class="form-group full"><label>Display Order</label>',
        '<input type="number" id="mf_displayOrder" min="0" step="1" value="' + v('order', getNextDisplayOrder(testimonials)) + '" />',
        '<p class="field-helper">Lower numbers appear earlier in the homepage testimonial carousel.</p></div>'
    ].join('');
  }

  // ── FEATURED PROPERTY FORM ────────────────────────────────────
  if (type === 'featured') {
    return [
      '<div class="form-section-label">Featured Property</div>',
      '<div class="form-group full"><label>Property</label>',
        '<select id="mf_propertyId">' + buildPropertyOptions(v('propertyId')) + '</select></div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Display Order</label>',
          '<input type="number" id="mf_displayOrder" min="1" step="1" value="' + v('order', getNextDisplayOrder(featuredProperties)) + '" /></div>',
        '<div class="form-group half"><label>Status</label>',
          '<select id="mf_status">',
            '<option value="Featured"' + (v('featured', true) ? ' selected' : '') + '>Featured</option>',
            '<option value="Hidden"' + (!v('featured', true) ? ' selected' : '') + '>Hidden</option>',
          '</select></div>',
      '</div>'
    ].join('');
  }

  // ── SERVICES SHOWCASE FORM ───────────────────────────────────
  if (type === 'service') {
    var iconOptions = SERVICE_SHOWCASE_ICON_KEYS.map(function(key) {
      return '<option value="' + key + '"' + (v('iconKey') === key ? ' selected' : '') + '>' + key + '</option>';
    }).join('');
    var themeOptions = SERVICE_SHOWCASE_THEMES.map(function(key) {
      return '<option value="' + key + '"' + (v('visualTheme') === key ? ' selected' : '') + '>' + key + '</option>';
    }).join('');
    var highlightsText = Array.isArray(v('highlights')) ? v('highlights').join('\n') : v('highlights');
    var serviceLayout = getServiceShowcaseLayoutMeta(record || {});
    var isMarketingService = serviceLayout.key === 'marketing' || String(v('title') || '').toLowerCase().indexOf('marketing') !== -1;
    var previewImage = v('hoverVideoPosterUrl') || v('imageUrl') || '';
    var previewChips = (Array.isArray(v('highlights')) ? v('highlights') : String(highlightsText || '').split('\n')).filter(Boolean).slice(0, 3).map(function(highlight) {
      return '<span class="service-preview-chip">' + escapeCmsHtml(highlight) + '</span>';
    }).join('');
    return [
      '<div class="service-modal-intro' + (isMarketingService ? ' is-marketing' : '') + '">',
      '<div>',
      '<span>' + escapeCmsHtml(serviceLayout.label || 'Website Service Card') + '</span>',
      '<strong>' + (isMarketingService ? 'Featured Case Study Video Card' : 'Website Services Card') + '</strong>',
      '<p>' + (isMarketingService
        ? 'The Property Marketing video should be short, dark/cinematic, and optimized for scroll scrubbing.'
        : 'Use short website copy that fits the public image-led Services card.') + '</p>',
      '</div>',
      '</div>',
      '<div class="service-modal-preview">',
      '<div class="service-website-preview' + (previewImage ? ' has-image' : '') + '">',
      previewImage ? '<img src="' + escapeAttribute(previewImage) + '" alt="' + ev('imageAlt', v('title') || 'Service preview') + '" />' : '<span>' + escapeCmsHtml(v('iconKey') || v('visualTheme') || 'service') + '</span>',
      '<div class="service-website-preview-grade"></div>',
      v('isCaseStudy') ? '<span class="service-preview-pill">' + ev('caseStudyLabel', 'View Case Study') + '</span>' : '',
      '<div class="service-preview-copy">',
      v('badge') ? '<span>' + ev('badge') + '</span>' : '',
      '<strong>' + ev('title', 'Service title') + '</strong>',
      '<p>' + escapeCmsHtml(v('description') || 'Use one short sentence.') + '</p>',
      previewChips ? '<div class="service-preview-chips">' + previewChips + '</div>' : '',
      '</div>',
      '</div>',
      '</div>',
      '<div class="form-section-label">A. Card Identity</div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Service Title</label>',
          '<input type="text" id="mf_title" value="' + ev('title') + '" placeholder="Property Sales" /></div>',
        '<div class="form-group half"><label>Badge / Label</label>',
          '<input type="text" id="mf_badge" value="' + ev('badge') + '" placeholder="For Buyers & Sellers" /></div>',
      '</div>',
      '<div class="form-row">',
        '<div class="form-group third"><label>Icon Key</label>',
          '<select id="mf_iconKey">' + iconOptions + '</select></div>',
        '<div class="form-group third"><label>Visual Theme</label>',
          '<select id="mf_visualTheme">' + themeOptions + '</select></div>',
        '<div class="form-group third"><label>Display Order</label>',
          '<input type="number" id="mf_displayOrder" min="0" step="1" value="' + ev('order', getNextDisplayOrder(serviceShowcaseItems)) + '" /></div>',
      '</div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Status</label>',
          '<select id="mf_status">',
            '<option value="Active"' + (v('active', true) ? ' selected' : '') + '>Active</option>',
            '<option value="Hidden"' + (!v('active', true) ? ' selected' : '') + '>Hidden</option>',
          '</select></div>',
        '<div class="form-group half checkbox-form-group">',
          '<label class="checkbox-label"><input type="checkbox" id="mf_isCaseStudy"' + (v('isCaseStudy') ? ' checked' : '') + ' /> Show as case study card</label>',
        '</div>',
      '</div>',
      '<div class="form-section-label">B. Website Text</div>',
      '<div class="form-group full"><label>Description</label>',
        '<textarea id="mf_description" rows="2">' + tv('description') + '</textarea>',
        '<p class="field-helper">Use one short sentence.</p></div>',
      '<div class="form-group full"><label>Highlights, one per line</label>',
        '<textarea id="mf_highlights" rows="3" placeholder="Market valuation&#10;Verified listings&#10;Investment support">' + escapeCmsHtml(highlightsText) + '</textarea>',
        '<p class="field-helper">Highlights appear as small chips. Keep them short; two or three is ideal.</p></div>',
      '<div class="form-section-label">C. Main Image</div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Image URL</label>',
          '<input type="url" id="mf_imageUrl" value="' + ev('imageUrl') + '" placeholder="https://..." /></div>',
        '<div class="form-group half"><label>Image Alt Text</label>',
          '<input type="text" id="mf_imageAlt" value="' + ev('imageAlt') + '" /></div>',
      '</div>',
      '<label class="cms-img-upload" for="mf_imageFile">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        '<p>Choose a service image to upload</p>',
        '<span>JPG, PNG, or WebP. Maximum 5MB.</span>',
        '<input type="file" id="mf_imageFile" accept="image/jpeg,image/png,image/webp" />',
      '</label>',
      '<div class="form-section-label">D. Case Study Settings' + (isMarketingService ? ' — Property Marketing' : '') + '</div>',
      isMarketingService && !v('hoverVideoUrl') ? '<div class="service-video-warning">No video uploaded. Website will show a static card.</div>' : '',
      '<div class="form-row">',
        '<div class="form-group half"><label>Case Study Label</label>',
          '<input type="text" id="mf_caseStudyLabel" value="' + ev('caseStudyLabel', 'View Case Study') + '" /></div>',
        '<div class="form-group half"><label>Case Study URL</label>',
          '<input type="url" id="mf_caseStudyUrl" value="' + ev('caseStudyUrl') + '" placeholder="https://..." /></div>',
      '</div>',
      '<div class="form-group full"><label>Hover Video URL</label>',
        '<input type="url" id="mf_hoverVideoUrl" value="' + ev('hoverVideoUrl') + '" placeholder="https://..." />',
        '<p class="field-helper">For Property Marketing, this powers the pinned scroll-scrub video on desktop.</p></div>',
      '<label class="cms-img-upload" for="mf_hoverVideoFile">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
        '<p>Choose a hover video to upload</p>',
        '<span>MP4 or WebM. Maximum 30MB.</span>',
        '<input type="file" id="mf_hoverVideoFile" accept="video/mp4,video/webm" />',
      '</label>',
      '<div class="form-group full"><label>Poster / Fallback Image URL</label>',
        '<input type="url" id="mf_hoverVideoPosterUrl" value="' + ev('hoverVideoPosterUrl') + '" placeholder="https://..." />',
        '<p class="field-helper">Shown as the fallback image and poster before video metadata is ready.</p></div>',
      '<label class="cms-img-upload" for="mf_hoverVideoPosterFile">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        '<p>Choose a poster/fallback image</p>',
        '<span>JPG, PNG, or WebP. Maximum 5MB.</span>',
        '<input type="file" id="mf_hoverVideoPosterFile" accept="image/jpeg,image/png,image/webp" />',
      '</label>',
      '<p class="cms-img-note">Uploads save public URLs in the cms-media bucket. Local file paths are never saved.</p>'
    ].join('');
  }

  // ── ARTICLE FORM ──────────────────────────────────────────────
  if (type === 'article') {
    return [
      '<div class="form-group full"><label>Article Title</label>',
        '<input type="text" id="mf_title" value="' + v('title') + '" /></div>',
      '<div class="form-row">',
        '<div class="form-group third"><label>Category</label>',
          '<select id="mf_category">',
            ['Investment','Market Update','Buyer Guide','Seller Guide','Rental Tips','Company News'].map(function(c){
              return '<option' + (v('category') === c ? ' selected' : '') + '>' + c + '</option>';
            }).join(''),
          '</select></div>',
        '<div class="form-group third"><label>Author</label>',
          '<input type="text" id="mf_author" value="' + v('author') + '" /></div>',
        '<div class="form-group third"><label>Branch</label>',
          '<select id="mf_branch">' + branchOptions + '</select></div>',
      '</div>',
      '<div class="form-group full"><label>Summary</label>',
        '<textarea id="mf_summary" rows="2">' + v('summary') + '</textarea></div>',
      '<div class="form-group full"><label>Body / Content</label>',
        '<textarea id="mf_body" rows="6" placeholder="Full article text…">' + v('body') + '</textarea></div>',
      '<div class="form-row">',
        '<div class="form-group half"><label>Publish Date</label>',
          '<input type="text" id="mf_publishDate" value="' + v('publishDate') + '" placeholder="e.g. 15 January 2025" /></div>',
        '<div class="form-group half"><label>Status</label>',
          '<select id="mf_status">',
            '<option value="Draft"'     + (v('status') === 'Draft'     ? ' selected' : '') + '>Draft</option>',
            '<option value="Published"' + (v('status') === 'Published' ? ' selected' : '') + '>Published</option>',
          '</select></div>',
      '</div>'
    ].join('');
  }

  return '<p style="color:var(--text-light);padding:20px">Unknown content type.</p>';
}


/* ══════════════════════════════════════════════════════════════
   16. MODAL — SAVE
══════════════════════════════════════════════════════════════ */

cmsModalSave.addEventListener('click', function() {
  saveCmsModal();
});

function saveCmsModal() {
  var type = modalContentType;

  if (type === 'banner') {
    saveBannerFromModal();
    return;
  }

  if (type === 'team') {
    saveTeamFromModal();
    return;
  }

  if (type === 'testimonial') {
    saveTestimonialFromModal();
    return;
  }

  if (type === 'featured') {
    saveFeaturedFromModal();
    return;
  }

  if (type === 'service') {
    saveServiceShowcaseFromModal();
    return;
  }

  if (type === 'article') {
    if (!fieldValue('mf_title')) { showToast('Please enter an article title', 'error'); return; }
    phase6BToast('CMS article');
    return;
  }
}


/* ══════════════════════════════════════════════════════════════
   17. MODAL — CLOSE
══════════════════════════════════════════════════════════════ */

function closeCmsModal() {
  revokeTestimonialBackgroundLocalPreview();
  cmsModal.classList.remove('open');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(function(){ cmsModal.style.display = 'none'; }, 320);
}

cmsModalClose.addEventListener('click',  closeCmsModal);
cmsModalCancel.addEventListener('click', closeCmsModal);
modalOverlay.addEventListener('click',   closeCmsModal);


/* ══════════════════════════════════════════════════════════════
   18. BRANCH FILTER
══════════════════════════════════════════════════════════════ */

document.querySelectorAll('.branch-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.branch-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    currentBranch = btn.dataset.branch;
    renderSection(activeSection);
  });
});


/* ══════════════════════════════════════════════════════════════
   19. SEARCH & STATUS FILTER
══════════════════════════════════════════════════════════════ */

cmsSearch.addEventListener('input', function() {
  currentSearch = cmsSearch.value.trim();
  renderSection(activeSection);
});

cmsStatusFilter.addEventListener('change', function() {
  currentStatus = cmsStatusFilter.value;
  renderSection(activeSection);
});


/* ══════════════════════════════════════════════════════════════
   20. MOBILE SIDEBAR TOGGLE
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
    if (!cmsModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
  hamburgerBtn.addEventListener('click', function() {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay.addEventListener('click', function() {
    if (cmsModal.classList.contains('open')) {
      closeCmsModal();
    } else {
      closeSidebar();
    }
  });
}


/* ══════════════════════════════════════════════════════════════
   21. PROPERTY SERVICES CMS
══════════════════════════════════════════════════════════════ */

var PROPERTY_SERVICES_DEFAULTS = {
  section: {
    id: null,
    section_key: 'homepage-property-services',
    eyebrow: 'PROPERTY SERVICES',
    heading: 'How Can We Help?',
    supporting_text: 'Whether you are buying, renting, selling, or listing a property, Hilltop Properties Zambia can guide you through the next step.',
    is_visible: true
  },
  cards: [
    {
      id: null,
      slug: 'buy-property',
      title: 'Buy a Property',
      description: 'Explore verified houses, apartments, land, and commercial properties available across our operating locations.',
      button_label: 'Explore Properties',
      action_type: 'all_listings',
      action_value: null,
      default_image_path: 'assets/images/service-buy-property.svg',
      custom_image_path: null,
      image_alt: 'Illustration representing the search for a property to buy',
      sort_order: 1,
      is_visible: true
    },
    {
      id: null,
      slug: 'rent-property',
      title: 'Rent a Property',
      description: 'Find houses and apartments available for rent in Lusaka, Livingstone, and other listed locations.',
      button_label: 'Explore Rentals',
      action_type: 'rental_listings',
      action_value: null,
      default_image_path: 'assets/images/service-rent-property.svg',
      custom_image_path: null,
      image_alt: 'Illustration representing finding and renting a property',
      sort_order: 2,
      is_visible: true
    },
    {
      id: null,
      slug: 'list-property',
      title: 'Sell or List a Property',
      description: 'List your property with Hilltop and connect with interested buyers or tenants through our branch network.',
      button_label: 'List Your Property',
      action_type: 'list_property_enquiry',
      action_value: null,
      default_image_path: 'assets/images/service-list-property.svg',
      custom_image_path: null,
      image_alt: 'Illustration representing listing a property for sale or rent',
      sort_order: 3,
      is_visible: true
    }
  ]
};

function clonePropertyServicesDefaults() {
  return JSON.parse(JSON.stringify(PROPERTY_SERVICES_DEFAULTS));
}

var initialPropertyServicesState = clonePropertyServicesDefaults();
var propertyServicesSection = initialPropertyServicesState.section;
var propertyServiceCards = initialPropertyServicesState.cards;
var propertyServicesTablesAvailable = false;
var propertyServicesDirty = false;
var propertyServicesSaving = false;
var propertyServicesSnapshot = '';
var propertyServicePendingFiles = {};
var propertyServiceRemoveCustom = {};

async function loadPropertyServicesCms(supabase) {
  var fallback = clonePropertyServicesDefaults();
  var sectionResult = await supabase
    .from('cms_services_section')
    .select('id, section_key, eyebrow, heading, supporting_text, is_visible')
    .eq('section_key', 'homepage-property-services')
    .maybeSingle();

  if (sectionResult.error) {
    if (isMissingCmsTableError(sectionResult.error)) {
      console.warn('Property Services CMS tables are unavailable. Run supabase/property-services-cms.sql.', sectionResult.error);
      return { section: fallback.section, cards: fallback.cards, available: false };
    }
    throw sectionResult.error;
  }

  if (!sectionResult.data) {
    // A new Supabase project has the CMS tables before it has any content rows.
    // Treat that empty state as writable so the first save can create the
    // section and its default service cards.
    return { section: fallback.section, cards: fallback.cards, available: true };
  }

  var cardsResult = await supabase
    .from('cms_service_cards')
    .select('id, section_id, slug, title, description, button_label, action_type, action_value, default_image_path, custom_image_path, image_alt, sort_order, is_visible')
    .eq('section_id', sectionResult.data.id)
    .order('sort_order', { ascending: true });

  if (cardsResult.error) {
    if (isMissingCmsTableError(cardsResult.error)) {
      return { section: fallback.section, cards: fallback.cards, available: false };
    }
    throw cardsResult.error;
  }

  var rowsBySlug = {};
  (cardsResult.data || []).forEach(function(row) { rowsBySlug[row.slug] = row; });
  var mergedCards = fallback.cards.map(function(card) {
    return rowsBySlug[card.slug] || Object.assign({}, card, { section_id: sectionResult.data.id });
  });
  (cardsResult.data || []).forEach(function(row) {
    if (!PROPERTY_SERVICES_DEFAULTS.cards.some(function(card) { return card.slug === row.slug; })) mergedCards.push(row);
  });
  mergedCards.sort(function(a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); });

  return {
    section: sectionResult.data,
    cards: mergedCards,
    available: true
  };
}

function serializablePropertyServicesState() {
  return {
    section: {
      id: propertyServicesSection.id || null,
      section_key: propertyServicesSection.section_key,
      eyebrow: propertyServicesSection.eyebrow,
      heading: propertyServicesSection.heading,
      supporting_text: propertyServicesSection.supporting_text,
      is_visible: Boolean(propertyServicesSection.is_visible)
    },
    cards: propertyServiceCards.map(function(card, index) {
      return {
        id: card.id || null,
        slug: card.slug,
        title: card.title,
        description: card.description,
        button_label: card.button_label,
        action_type: card.action_type,
        action_value: card.action_value || null,
        default_image_path: card.default_image_path || null,
        custom_image_path: card.custom_image_path || null,
        image_alt: card.image_alt,
        sort_order: index + 1,
        is_visible: Boolean(card.is_visible)
      };
    })
  };
}

function takePropertyServicesSnapshot() {
  propertyServicesSnapshot = JSON.stringify(serializablePropertyServicesState());
  setPropertyServicesDirty(false);
}

function setPropertyServicesDirty(isDirty) {
  propertyServicesDirty = Boolean(isDirty);
  var indicator = document.getElementById('propertyServicesUnsaved');
  if (indicator) indicator.hidden = !propertyServicesDirty;
}

function setPropertyServicesStatus(message, type) {
  var status = document.getElementById('propertyServicesStatus');
  if (!status) return;
  status.textContent = message || '';
  status.className = 'property-services-status' + (type ? ' ' + type : '');
}

function propertyServiceCardBySlug(slug) {
  return propertyServiceCards.find(function(card) { return card.slug === slug; }) || null;
}

function propertyServiceDefaultCard(slug) {
  return PROPERTY_SERVICES_DEFAULTS.cards.find(function(card) { return card.slug === slug; }) || null;
}

function storageObjectPath(value) {
  var path = String(value || '').trim();
  if (!path) return '';
  var marker = '/storage/v1/object/public/service-illustrations/';
  var markerIndex = path.indexOf(marker);
  if (markerIndex !== -1) return decodeURIComponent(path.slice(markerIndex + marker.length));
  return path.indexOf('service-cards/') === 0 ? path : '';
}

function propertyServiceImageUrl(card) {
  var pending = propertyServicePendingFiles[card.slug];
  if (pending && pending.previewUrl) return pending.previewUrl;
  var customPath = propertyServiceRemoveCustom[card.slug] ? '' : storageObjectPath(card.custom_image_path);
  if (customPath) {
    var supabase = getSupabaseClient();
    var publicResult = supabase && supabase.storage.from('service-illustrations').getPublicUrl(customPath);
    var publicUrl = publicResult && publicResult.data && publicResult.data.publicUrl;
    if (publicUrl) return publicUrl;
  }
  var fallback = propertyServiceDefaultCard(card.slug);
  return card.default_image_path || (fallback && fallback.default_image_path) || '';
}

function setSafePropertyServiceImage(img, card) {
  var fallback = propertyServiceDefaultCard(card.slug);
  var fallbackPath = card.default_image_path || (fallback && fallback.default_image_path) || '';
  img.alt = card.image_alt || (fallback && fallback.image_alt) || '';
  img.src = propertyServiceImageUrl(card) || fallbackPath;
  img.onerror = function() {
    if (fallbackPath && img.getAttribute('src') !== fallbackPath) {
      img.src = fallbackPath;
      return;
    }
    img.hidden = true;
  };
}

function createPropertyServicesField(labelText, field, control, helperText) {
  var wrapper = document.createElement('div');
  wrapper.className = 'property-services-field';
  var label = document.createElement('label');
  label.htmlFor = control.id;
  label.textContent = labelText;
  if (helperText) {
    var helper = document.createElement('span');
    helper.textContent = helperText;
    label.appendChild(helper);
  }
  wrapper.appendChild(label);
  wrapper.appendChild(control);
  var error = document.createElement('small');
  error.className = 'property-services-field-error';
  error.dataset.errorField = field;
  wrapper.appendChild(error);
  return wrapper;
}

function createPropertyServiceInput(id, value, maxLength) {
  var input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.value = value || '';
  if (maxLength) input.maxLength = maxLength;
  return input;
}

function createPropertyServiceTextarea(id, value, maxLength) {
  var textarea = document.createElement('textarea');
  textarea.id = id;
  textarea.rows = 3;
  textarea.value = value || '';
  if (maxLength) textarea.maxLength = maxLength;
  return textarea;
}

function createPropertyServiceActionSelect(card) {
  var select = document.createElement('select');
  select.id = 'propertyServiceAction-' + card.slug;
  select.dataset.cardField = 'action_type';
  [
    ['all_listings', 'All Property Listings'],
    ['rental_listings', 'Rental Listings'],
    ['list_property_enquiry', 'List a Property Enquiry'],
    ['internal_page', 'Custom Internal Page']
  ].forEach(function(optionData) {
    var option = document.createElement('option');
    option.value = optionData[0];
    option.textContent = optionData[1];
    select.appendChild(option);
  });
  select.value = card.action_type || 'all_listings';
  return select;
}

function renderPropertyServiceEditors() {
  var list = document.getElementById('propertyServicesEditorList');
  if (!list) return;
  list.replaceChildren();
  propertyServiceCards.sort(function(a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); });

  propertyServiceCards.forEach(function(card, index) {
    card.sort_order = index + 1;
    var editor = document.createElement('article');
    editor.className = 'property-service-editor';
    editor.dataset.cardSlug = card.slug;

    var header = document.createElement('div');
    header.className = 'property-service-editor__header';
    var identity = document.createElement('div');
    var order = document.createElement('span');
    order.className = 'property-service-editor__order';
    order.textContent = 'Card ' + (index + 1);
    var heading = document.createElement('h4');
    heading.textContent = card.title || card.slug;
    identity.appendChild(order);
    identity.appendChild(heading);

    var visibleLabel = document.createElement('label');
    visibleLabel.className = 'property-services-toggle compact';
    var visibleInput = document.createElement('input');
    visibleInput.type = 'checkbox';
    visibleInput.checked = Boolean(card.is_visible);
    visibleInput.dataset.cardField = 'is_visible';
    var visibleTrack = document.createElement('span');
    visibleTrack.setAttribute('aria-hidden', 'true');
    visibleLabel.appendChild(visibleInput);
    visibleLabel.appendChild(visibleTrack);
    visibleLabel.appendChild(document.createTextNode('Visible'));
    header.appendChild(identity);
    header.appendChild(visibleLabel);

    var body = document.createElement('div');
    body.className = 'property-service-editor__body';
    var media = document.createElement('div');
    media.className = 'property-service-editor__media';
    var visual = document.createElement('div');
    visual.className = 'property-service-editor__visual';
    var image = document.createElement('img');
    setSafePropertyServiceImage(image, card);
    visual.appendChild(image);
    var mediaActions = document.createElement('div');
    mediaActions.className = 'property-service-editor__media-actions';
    var replaceLabel = document.createElement('label');
    replaceLabel.className = 'action-btn outline small';
    replaceLabel.textContent = 'Replace illustration';
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/webp,image/jpeg';
    fileInput.dataset.serviceImageInput = card.slug;
    replaceLabel.appendChild(fileInput);
    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'action-btn danger small';
    removeButton.dataset.removeServiceImage = card.slug;
    removeButton.textContent = 'Remove custom illustration';
    removeButton.disabled = Boolean(propertyServiceRemoveCustom[card.slug]) || (!card.custom_image_path && !propertyServicePendingFiles[card.slug]);
    mediaActions.appendChild(replaceLabel);
    mediaActions.appendChild(removeButton);
    var mediaNote = document.createElement('p');
    mediaNote.className = 'property-service-editor__media-note';
    var pending = propertyServicePendingFiles[card.slug];
    mediaNote.textContent = pending && pending.warning
      ? pending.warning
      : 'PNG, WebP, or JPEG up to 2MB. Recommended minimum 600 × 450px.';
    media.appendChild(visual);
    media.appendChild(mediaActions);
    media.appendChild(mediaNote);

    var fields = document.createElement('div');
    fields.className = 'property-service-editor__fields';
    var alt = createPropertyServiceInput('propertyServiceAlt-' + card.slug, card.image_alt, 180);
    alt.dataset.cardField = 'image_alt';
    fields.appendChild(createPropertyServicesField('Illustration alternative text', 'image_alt', alt, '180 characters maximum'));
    var title = createPropertyServiceInput('propertyServiceTitle-' + card.slug, card.title, 70);
    title.dataset.cardField = 'title';
    fields.appendChild(createPropertyServicesField('Card title', 'title', title, '70 characters maximum'));
    var description = createPropertyServiceTextarea('propertyServiceDescription-' + card.slug, card.description, 260);
    description.dataset.cardField = 'description';
    fields.appendChild(createPropertyServicesField('Card description', 'description', description, '260 characters maximum'));
    var button = createPropertyServiceInput('propertyServiceButton-' + card.slug, card.button_label, 40);
    button.dataset.cardField = 'button_label';
    fields.appendChild(createPropertyServicesField('Button label', 'button_label', button, '40 characters maximum'));
    var action = createPropertyServiceActionSelect(card);
    fields.appendChild(createPropertyServicesField('Button action', 'action_type', action, 'Controlled action only'));
    var customPath = createPropertyServiceInput('propertyServicePath-' + card.slug, card.action_value || '', 240);
    customPath.dataset.cardField = 'action_value';
    var customPathField = createPropertyServicesField('Custom internal path', 'action_value', customPath, 'Example: services.html');
    customPathField.dataset.internalPathField = card.slug;
    customPathField.hidden = action.value !== 'internal_page';
    fields.appendChild(customPathField);

    body.appendChild(media);
    body.appendChild(fields);

    var footer = document.createElement('div');
    footer.className = 'property-service-editor__footer';
    var slug = document.createElement('code');
    slug.textContent = card.slug;
    var reorder = document.createElement('div');
    reorder.className = 'property-service-editor__reorder';
    var up = document.createElement('button');
    up.type = 'button';
    up.className = 'action-btn outline small';
    up.dataset.moveServiceCard = 'up';
    up.dataset.cardSlug = card.slug;
    up.textContent = 'Move up';
    up.disabled = index === 0;
    var down = document.createElement('button');
    down.type = 'button';
    down.className = 'action-btn outline small';
    down.dataset.moveServiceCard = 'down';
    down.dataset.cardSlug = card.slug;
    down.textContent = 'Move down';
    down.disabled = index === propertyServiceCards.length - 1;
    reorder.appendChild(up);
    reorder.appendChild(down);
    footer.appendChild(slug);
    footer.appendChild(reorder);

    editor.appendChild(header);
    editor.appendChild(body);
    editor.appendChild(footer);
    list.appendChild(editor);
  });

  if (!canManageCms()) {
    list.querySelectorAll('input,textarea,select,button').forEach(function(control) { control.disabled = true; });
  }
}

function renderPropertyServicesPreview() {
  var preview = document.getElementById('propertyServicesPreview');
  if (!preview) return;
  preview.classList.toggle('is-hidden-section', !propertyServicesSection.is_visible);
  preview.querySelector('.property-services-preview-label').textContent = propertyServicesSection.eyebrow || 'PROPERTY SERVICES';
  preview.querySelector('.property-services-preview-title').textContent = propertyServicesSection.heading || 'How Can We Help?';
  preview.querySelector('.property-services-preview-intro').textContent = propertyServicesSection.supporting_text || '';
  var grid = preview.querySelector('.property-services-preview-grid');
  grid.replaceChildren();

  propertyServiceCards.filter(function(card) { return card.is_visible; }).forEach(function(card) {
    var item = document.createElement('article');
    var img = document.createElement('img');
    setSafePropertyServiceImage(img, card);
    var title = document.createElement('h5');
    title.textContent = card.title;
    var description = document.createElement('p');
    description.textContent = card.description;
    var button = document.createElement('span');
    button.textContent = card.button_label;
    item.appendChild(img);
    item.appendChild(title);
    item.appendChild(description);
    item.appendChild(button);
    grid.appendChild(item);
  });
}

function renderPropertyServicesCms() {
  var panel = document.getElementById('panel-property-services');
  if (!panel) return;
  document.getElementById('propertyServicesEyebrow').value = propertyServicesSection.eyebrow || '';
  document.getElementById('propertyServicesHeading').value = propertyServicesSection.heading || '';
  document.getElementById('propertyServicesSupporting').value = propertyServicesSection.supporting_text || '';
  document.getElementById('propertyServicesVisible').checked = Boolean(propertyServicesSection.is_visible);
  renderPropertyServiceEditors();
  renderPropertyServicesPreview();
  if (!propertyServicesTablesAvailable) {
    setPropertyServicesStatus('Run supabase/property-services-cms.sql to enable saving. Approved fallback content is shown.', 'error');
  } else if (!propertyServicesDirty) {
    setPropertyServicesStatus('', '');
  }
  if (!canManageCms()) {
    panel.querySelectorAll('input,textarea,select').forEach(function(control) { control.disabled = true; });
  }
}

function syncPropertyServicesStateFromForm() {
  var eyebrow = document.getElementById('propertyServicesEyebrow');
  if (!eyebrow) return;
  propertyServicesSection.eyebrow = eyebrow.value;
  propertyServicesSection.heading = document.getElementById('propertyServicesHeading').value;
  propertyServicesSection.supporting_text = document.getElementById('propertyServicesSupporting').value;
  propertyServicesSection.is_visible = document.getElementById('propertyServicesVisible').checked;

  propertyServiceCards.forEach(function(card) {
    var editor = document.querySelector('.property-service-editor[data-card-slug="' + card.slug + '"]');
    if (!editor) return;
    card.title = editor.querySelector('[data-card-field="title"]').value;
    card.description = editor.querySelector('[data-card-field="description"]').value;
    card.button_label = editor.querySelector('[data-card-field="button_label"]').value;
    card.image_alt = editor.querySelector('[data-card-field="image_alt"]').value;
    card.action_type = editor.querySelector('[data-card-field="action_type"]').value;
    card.action_value = card.action_type === 'internal_page'
      ? editor.querySelector('[data-card-field="action_value"]').value
      : null;
    card.is_visible = editor.querySelector('[data-card-field="is_visible"]').checked;
  });
}

function clearPropertyServicesErrors() {
  document.querySelectorAll('#panel-property-services .property-services-field-error').forEach(function(error) {
    error.textContent = '';
  });
  document.querySelectorAll('#panel-property-services .has-error').forEach(function(field) {
    field.classList.remove('has-error');
  });
}

function showPropertyServicesFieldError(slug, field, message) {
  var error;
  if (slug) {
    var editor = document.querySelector('.property-service-editor[data-card-slug="' + slug + '"]');
    error = editor && editor.querySelector('[data-error-field="' + field + '"]');
  } else {
    error = document.querySelector('[data-error-for="' + field + '"]');
  }
  if (!error) return;
  error.textContent = message;
  if (error.parentElement) error.parentElement.classList.add('has-error');
}

function isSafeInternalPagePath(value) {
  var path = String(value || '').trim();
  if (!path || path.length > 240) return false;
  if (/^(?:javascript|data|vbscript|https?):/i.test(path)) return false;
  if (/^\/\//.test(path) || /\\/.test(path) || /[<>"`]/.test(path)) return false;
  return /^(?:\/(?!\/)|\.\.?\/)?[A-Za-z0-9][A-Za-z0-9._~!$&'()*+,;=@%/?#-]*$/.test(path);
}

function validatePropertyServicesForm() {
  clearPropertyServicesErrors();
  var valid = true;
  var sectionRules = [
    ['eyebrow', propertyServicesSection.eyebrow, 40, 'Small label'],
    ['heading', propertyServicesSection.heading, 80, 'Main heading'],
    ['supporting_text', propertyServicesSection.supporting_text, 300, 'Supporting paragraph']
  ];
  sectionRules.forEach(function(rule) {
    var value = String(rule[1] || '').trim();
    if (!value) {
      showPropertyServicesFieldError('', rule[0], rule[3] + ' is required.');
      valid = false;
    } else if (value.length > rule[2]) {
      showPropertyServicesFieldError('', rule[0], rule[3] + ' must be ' + rule[2] + ' characters or fewer.');
      valid = false;
    }
  });

  if (propertyServiceCards.filter(function(card) { return card.is_visible; }).length > 4) {
    setPropertyServicesStatus('A maximum of four service cards may be visible.', 'error');
    valid = false;
  }

  propertyServiceCards.forEach(function(card) {
    [
      ['title', card.title, 70, 'Card title'],
      ['description', card.description, 260, 'Description'],
      ['button_label', card.button_label, 40, 'Button label'],
      ['image_alt', card.image_alt, 180, 'Alternative text']
    ].forEach(function(rule) {
      var value = String(rule[1] || '').trim();
      if (!value) {
        showPropertyServicesFieldError(card.slug, rule[0], rule[3] + ' is required.');
        valid = false;
      } else if (value.length > rule[2]) {
        showPropertyServicesFieldError(card.slug, rule[0], rule[3] + ' must be ' + rule[2] + ' characters or fewer.');
        valid = false;
      }
    });
    if (!/^[a-z0-9-]+$/.test(card.slug)) {
      setPropertyServicesStatus('A service card has an invalid slug.', 'error');
      valid = false;
    }
    if (['all_listings', 'rental_listings', 'list_property_enquiry', 'internal_page'].indexOf(card.action_type) === -1) {
      showPropertyServicesFieldError(card.slug, 'action_type', 'Select a supported action.');
      valid = false;
    }
    if (card.action_type === 'internal_page' && !isSafeInternalPagePath(card.action_value)) {
      showPropertyServicesFieldError(card.slug, 'action_value', 'Enter a safe relative website path.');
      valid = false;
    }
  });
  return valid;
}

function loadImageFileDimensions(file) {
  return new Promise(function(resolve, reject) {
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function() {
      var result = { width: image.naturalWidth, height: image.naturalHeight, previewUrl: url };
      if (!result.width || !result.height) {
        URL.revokeObjectURL(url);
        reject(new Error('The selected image is corrupted.'));
        return;
      }
      resolve(result);
    };
    image.onerror = function() {
      URL.revokeObjectURL(url);
      reject(new Error('The selected image is corrupted or unsupported.'));
    };
    image.src = url;
  });
}

async function validatePropertyServiceImageFile(file) {
  var allowedTypes = ['image/png', 'image/webp', 'image/jpeg'];
  var extension = String(file.name || '').split('.').pop().toLowerCase();
  if (allowedTypes.indexOf(file.type) === -1 || ['png', 'webp', 'jpg', 'jpeg'].indexOf(extension) === -1) {
    throw new Error('Choose a PNG, WebP, or JPEG image. SVG uploads are not allowed.');
  }
  if (file.size > 2 * 1024 * 1024) throw new Error('Illustrations must be 2MB or smaller.');
  var dimensions = await loadImageFileDimensions(file);
  dimensions.warning = dimensions.width < 600 || dimensions.height < 450
    ? 'Small image warning: ' + dimensions.width + ' × ' + dimensions.height + 'px. Recommended minimum is 600 × 450px.'
    : 'Ready to upload: ' + dimensions.width + ' × ' + dimensions.height + 'px.';
  return dimensions;
}

function revokePendingPropertyServicePreview(slug) {
  var pending = propertyServicePendingFiles[slug];
  if (pending && pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
}

async function handlePropertyServiceImageSelection(input) {
  var slug = input.dataset.serviceImageInput;
  var file = input.files && input.files[0];
  if (!file) return;
  try {
    var dimensions = await validatePropertyServiceImageFile(file);
    revokePendingPropertyServicePreview(slug);
    propertyServicePendingFiles[slug] = {
      file: file,
      previewUrl: dimensions.previewUrl,
      width: dimensions.width,
      height: dimensions.height,
      warning: dimensions.warning
    };
    propertyServiceRemoveCustom[slug] = false;
    renderPropertyServiceEditors();
    renderPropertyServicesPreview();
    setPropertyServicesDirty(true);
    setPropertyServicesStatus(dimensions.warning, dimensions.width < 600 || dimensions.height < 450 ? 'warning' : '');
  } catch (error) {
    input.value = '';
    setPropertyServicesStatus(error.message || 'The illustration could not be validated.', 'error');
  }
}

function sanitizeServiceIllustrationFilename(name) {
  var safe = String(name || 'illustration').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || 'illustration';
}

async function uploadPropertyServiceIllustration(card, pending) {
  await requireSupabaseUploadSession(getSupabaseClient());
  var recordKey = card.id || card.slug;
  var path = 'service-cards/' + recordKey + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + sanitizeServiceIllustrationFilename(pending.file.name);
  var upload = await getSupabaseClient().storage
    .from('service-illustrations')
    .upload(path, pending.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: pending.file.type
    });
  if (upload.error) throw upload.error;
  return path;
}

async function removePropertyServiceStorageObject(path) {
  var safePath = storageObjectPath(path);
  if (!safePath) return;
  var result = await getSupabaseClient().storage.from('service-illustrations').remove([safePath]);
  if (result.error) throw result.error;
}

async function savePropertyServicesCms() {
  if (propertyServicesSaving || !ensureCmsReadyForWrite()) return;
  syncPropertyServicesStateFromForm();
  if (!validatePropertyServicesForm()) {
    setPropertyServicesStatus('Correct the highlighted fields before saving.', 'error');
    return;
  }
  if (!propertyServicesTablesAvailable) {
    setPropertyServicesStatus('Run supabase/property-services-cms.sql before saving.', 'error');
    return;
  }

  propertyServicesSaving = true;
  var saveButton = document.getElementById('propertyServicesSave');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.lastChild.textContent = ' Saving…';
  }
  setPropertyServicesStatus('Saving section settings and service cards…', 'saving');
  var previousState;
  try {
    previousState = propertyServicesSnapshot ? JSON.parse(propertyServicesSnapshot) : clonePropertyServicesDefaults();
    var supabase = getSupabaseClient();
    var sectionPayload = {
      section_key: 'homepage-property-services',
      eyebrow: propertyServicesSection.eyebrow.trim(),
      heading: propertyServicesSection.heading.trim(),
      supporting_text: propertyServicesSection.supporting_text.trim(),
      is_visible: Boolean(propertyServicesSection.is_visible)
    };
    var sectionSave = await supabase
      .from('cms_services_section')
      .upsert(sectionPayload, { onConflict: 'section_key' })
      .select('id, section_key, eyebrow, heading, supporting_text, is_visible')
      .single();
    if (sectionSave.error) throw sectionSave.error;
    propertyServicesSection = sectionSave.data;

    for (var tempIndex = 0; tempIndex < propertyServiceCards.length; tempIndex += 1) {
      var tempCard = propertyServiceCards[tempIndex];
      if (tempCard.id) {
        var tempOrderResult = await supabase
          .from('cms_service_cards')
          .update({ sort_order: 100 + tempIndex })
          .eq('id', tempCard.id);
        if (tempOrderResult.error) throw tempOrderResult.error;
      }
    }

    for (var index = 0; index < propertyServiceCards.length; index += 1) {
      var card = propertyServiceCards[index];
      var pending = propertyServicePendingFiles[card.slug];
      var removeCustom = Boolean(propertyServiceRemoveCustom[card.slug]);
      var previousCustomPath = card.custom_image_path || null;
      var uploadedPath = null;
      if (pending) uploadedPath = await uploadPropertyServiceIllustration(card, pending);

      var desiredCustomPath = removeCustom ? null : (uploadedPath || previousCustomPath);
      var cardPayload = {
        section_id: propertyServicesSection.id,
        slug: card.slug,
        title: card.title.trim(),
        description: card.description.trim(),
        button_label: card.button_label.trim(),
        action_type: card.action_type,
        action_value: card.action_type === 'internal_page' ? card.action_value.trim() : null,
        default_image_path: card.default_image_path || (propertyServiceDefaultCard(card.slug) || {}).default_image_path || null,
        custom_image_path: desiredCustomPath,
        image_alt: card.image_alt.trim(),
        sort_order: index + 1,
        is_visible: Boolean(card.is_visible)
      };

      var cardSelectColumns = 'id, section_id, slug, title, description, button_label, action_type, action_value, default_image_path, custom_image_path, image_alt, sort_order, is_visible';
      var cardSave = card.id
        ? await supabase.from('cms_service_cards').update(cardPayload).eq('id', card.id).select(cardSelectColumns).single()
        : await supabase.from('cms_service_cards').insert(cardPayload).select(cardSelectColumns).single();
      if (cardSave.error) {
        if (uploadedPath) await removePropertyServiceStorageObject(uploadedPath);
        throw cardSave.error;
      }

      if ((uploadedPath || removeCustom) && previousCustomPath && previousCustomPath !== desiredCustomPath) {
        try {
          await removePropertyServiceStorageObject(previousCustomPath);
        } catch (deleteError) {
          await supabase.from('cms_service_cards').update({ custom_image_path: previousCustomPath }).eq('id', cardSave.data.id);
          if (uploadedPath) await removePropertyServiceStorageObject(uploadedPath);
          throw deleteError;
        }
      }
      propertyServiceCards[index] = cardSave.data;
    }

    var previousCardsBySlug = {};
    (previousState.cards || []).forEach(function(card) { previousCardsBySlug[card.slug] = card; });
    var sectionChanged = JSON.stringify(previousState.section || {}) !== JSON.stringify(serializablePropertyServicesState().section);
    if (sectionChanged) await logCmsActivity('CMS_PROPERTY_SERVICES_SECTION_UPDATED', 'Homepage Property Services section settings were updated.');
    var reordered = false;
    for (var logIndex = 0; logIndex < propertyServiceCards.length; logIndex += 1) {
      var savedCard = propertyServiceCards[logIndex];
      var oldCard = previousCardsBySlug[savedCard.slug] || {};
      if (Number(oldCard.sort_order) !== logIndex + 1) reordered = true;
      if (Boolean(oldCard.is_visible) !== Boolean(savedCard.is_visible)) {
        await logCmsActivity(savedCard.is_visible ? 'CMS_PROPERTY_SERVICE_CARD_RESTORED' : 'CMS_PROPERTY_SERVICE_CARD_HIDDEN', savedCard.slug + ' visibility was updated.');
      }
      await logCmsActivity('CMS_PROPERTY_SERVICE_CARD_UPDATED', savedCard.slug + ' service card was updated.');
      if (propertyServicePendingFiles[savedCard.slug]) {
        await logCmsActivity(oldCard.custom_image_path ? 'CMS_PROPERTY_SERVICE_ILLUSTRATION_REPLACED' : 'CMS_PROPERTY_SERVICE_ILLUSTRATION_UPLOADED', savedCard.slug + ' illustration was uploaded.');
      }
      if (propertyServiceRemoveCustom[savedCard.slug]) {
        await logCmsActivity('CMS_PROPERTY_SERVICE_ILLUSTRATION_REMOVED', savedCard.slug + ' custom illustration was removed.');
      }
    }
    if (reordered) await logCmsActivity('CMS_PROPERTY_SERVICE_CARDS_REORDERED', 'Homepage Property Services cards were reordered.');

    Object.keys(propertyServicePendingFiles).forEach(revokePendingPropertyServicePreview);
    propertyServicePendingFiles = {};
    propertyServiceRemoveCustom = {};
    takePropertyServicesSnapshot();
    renderPropertyServicesCms();
    setPropertyServicesStatus('Property Services changes were saved successfully.', 'success');
    showToast('Property Services changes saved.', 'success');
  } catch (error) {
    console.warn('Property Services CMS save failed.', error);
    setPropertyServicesDirty(true);
    setPropertyServicesStatus('Changes were not fully saved. ' + (error.message || 'Please try again.'), 'error');
    showToast('Could not save Property Services changes.', 'error');
  } finally {
    propertyServicesSaving = false;
    if (saveButton) {
      saveButton.disabled = !canManageCms();
      saveButton.lastChild.textContent = ' Save Changes';
    }
  }
}

var propertyServicesPanel = document.getElementById('panel-property-services');
if (propertyServicesPanel) {
  propertyServicesPanel.addEventListener('input', function(event) {
    if (event.target.matches('input[type="file"]')) return;
    syncPropertyServicesStateFromForm();
    setPropertyServicesDirty(true);
    renderPropertyServicesPreview();
  });
  propertyServicesPanel.addEventListener('change', function(event) {
    if (event.target.matches('[data-service-image-input]')) {
      handlePropertyServiceImageSelection(event.target);
      return;
    }
    syncPropertyServicesStateFromForm();
    if (event.target.dataset.cardField === 'action_type') {
      var editor = event.target.closest('.property-service-editor');
      var pathField = editor && editor.querySelector('[data-internal-path-field]');
      if (pathField) pathField.hidden = event.target.value !== 'internal_page';
    }
    if (event.target.dataset.cardField === 'is_visible' && propertyServiceCards.filter(function(card) { return card.is_visible; }).length > 4) {
      event.target.checked = false;
      syncPropertyServicesStateFromForm();
      setPropertyServicesStatus('A maximum of four service cards may be visible.', 'error');
    }
    setPropertyServicesDirty(true);
    renderPropertyServicesPreview();
  });
  propertyServicesPanel.addEventListener('click', function(event) {
    var moveButton = event.target.closest('[data-move-service-card]');
    if (moveButton) {
      syncPropertyServicesStateFromForm();
      var currentIndex = propertyServiceCards.findIndex(function(card) { return card.slug === moveButton.dataset.cardSlug; });
      var nextIndex = moveButton.dataset.moveServiceCard === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex >= 0 && nextIndex >= 0 && nextIndex < propertyServiceCards.length) {
        var moved = propertyServiceCards.splice(currentIndex, 1)[0];
        propertyServiceCards.splice(nextIndex, 0, moved);
        propertyServiceCards.forEach(function(card, index) { card.sort_order = index + 1; });
        renderPropertyServiceEditors();
        renderPropertyServicesPreview();
        setPropertyServicesDirty(true);
      }
      return;
    }
    var removeButton = event.target.closest('[data-remove-service-image]');
    if (removeButton) {
      var slug = removeButton.dataset.removeServiceImage;
      revokePendingPropertyServicePreview(slug);
      delete propertyServicePendingFiles[slug];
      propertyServiceRemoveCustom[slug] = true;
      renderPropertyServiceEditors();
      renderPropertyServicesPreview();
      setPropertyServicesDirty(true);
      setPropertyServicesStatus('The approved static illustration will be restored after saving.', 'warning');
    }
  });
}

var propertyServicesSaveButton = document.getElementById('propertyServicesSave');
if (propertyServicesSaveButton) propertyServicesSaveButton.addEventListener('click', savePropertyServicesCms);

window.addEventListener('beforeunload', function(event) {
  if (!propertyServicesDirty) return;
  event.preventDefault();
  event.returnValue = '';
});

/* ══════════════════════════════════════════════════════════════
   22. INITIAL PAGE LOAD
══════════════════════════════════════════════════════════════ */

// Load CMS tables if available; otherwise keep the existing demo CMS data.
document.getElementById('cmsFilterBar').style.display = 'none';
loadCMSData();
