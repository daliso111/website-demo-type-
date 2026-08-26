/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - ADMIN DASHBOARD
   Phase 5A: read-only Supabase stats and recent activity.
   ============================================================ */


/* -- 1. DEMO FALLBACK DATA ------------------------------------ */

const demoStatsData = {
  all: { activeProperties: 48, newLeads: 17, sold: 9, rented: 14 },
  harare: { activeProperties: 30, newLeads: 11, sold: 6, rented: 8 },
  bulawayo: { activeProperties: 18, newLeads: 6, sold: 3, rented: 6 }
};

const demoActivityData = {
  all: [
    { type: 'enquiry', text: 'New enquiry received for a 3-bed house in Harare', time: '10 minutes ago', branch: 'Harare' },
    { type: 'status', text: 'An agent updated a Westgate property to Sold - IP-HRE-011', time: '42 minutes ago', branch: 'Harare' },
    { type: 'property', text: 'Bulawayo Branch added a new rental apartment - IP-BYO-007', time: '1 hour ago', branch: 'Bulawayo' },
    { type: 'followup', text: 'Follow-up scheduled for a property client', time: '2 hours ago', branch: 'Harare' }
  ],
  harare: [
    { type: 'enquiry', text: 'New enquiry received for a 3-bed house in Harare', time: '10 minutes ago', branch: 'Harare' },
    { type: 'status', text: 'An agent updated a Westgate property to Sold - IP-HRE-011', time: '42 minutes ago', branch: 'Harare' }
  ],
  bulawayo: [
    { type: 'property', text: 'Bulawayo Branch added a new rental apartment - IP-BYO-007', time: '1 hour ago', branch: 'Bulawayo' }
  ]
};

const branchLabels = {
  all: 'All Branches',
  harare: 'Harare Branch',
  bulawayo: 'Bulawayo Branch'
};

const tagLabels = {
  enquiry: 'Enquiry',
  property: 'Property',
  followup: 'Follow-up',
  status: 'Status Update'
};

const activityIcons = {
  enquiry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  property: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  followup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>'
};


/* -- 2. DOM REFERENCES ---------------------------------------- */

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const hamburgerBtn = document.getElementById('hamburger');
const branchButtons = document.querySelectorAll('.branch-btn');
const activityFeed = document.getElementById('activityFeed');
const activityBadge = document.getElementById('activityBranch');
const statActiveProps = document.getElementById('statActiveProperties');
const statNewLeads = document.getElementById('statNewLeads');
const statSold = document.getElementById('statSold');
const statRented = document.getElementById('statRented');
const btnAddProperty = document.getElementById('btnAddProperty');
const btnAddLead = document.getElementById('btnAddLead');
const dashboardCompanySubtitle = document.getElementById('dashboardCompanySubtitle');
const dashboardCompanyNameForm = document.getElementById('dashboardCompanyNameForm');
const dashboardCompanyNameInput = document.getElementById('dashboardCompanyName');
const dashboardCompanyNameSave = document.getElementById('dashboardCompanyNameSave');
const dashboardCompanyNameStatus = document.getElementById('dashboardCompanyNameStatus');
const dashboardThemeForm = document.getElementById('dashboardThemeForm');
const dashboardThemeSave = document.getElementById('dashboardThemeSave');
const dashboardThemeReset = document.getElementById('dashboardThemeReset');
const dashboardThemeStatus = document.getElementById('dashboardThemeStatus');
const dashboardPrimaryColor = document.getElementById('dashboardPrimaryColor');
const dashboardSecondaryColor = document.getElementById('dashboardSecondaryColor');
const dashboardAccentColor = document.getElementById('dashboardAccentColor');
const dashboardPrimaryColorValue = document.getElementById('dashboardPrimaryColorValue');
const dashboardSecondaryColorValue = document.getElementById('dashboardSecondaryColorValue');
const dashboardAccentColorValue = document.getElementById('dashboardAccentColorValue');
const dashboardPartnerForm = document.getElementById('dashboardPartnerForm');
const dashboardPartnerId = document.getElementById('dashboardPartnerId');
const dashboardPartnerName = document.getElementById('dashboardPartnerName');
const dashboardPartnerWebsite = document.getElementById('dashboardPartnerWebsite');
const dashboardPartnerOrder = document.getElementById('dashboardPartnerOrder');
const dashboardPartnerLogo = document.getElementById('dashboardPartnerLogo');
const dashboardPartnerActive = document.getElementById('dashboardPartnerActive');
const dashboardPartnerSave = document.getElementById('dashboardPartnerSave');
const dashboardPartnerCancel = document.getElementById('dashboardPartnerCancel');
const dashboardPartnerStatus = document.getElementById('dashboardPartnerStatus');
const dashboardPartnersList = document.getElementById('dashboardPartnersList');
const dashboardPartnerLogoPreview = document.getElementById('dashboardPartnerLogoPreview');
const dashboardPartnerLogoPreviewImage = document.getElementById('dashboardPartnerLogoPreviewImage');


/* -- 3. DASHBOARD STATE --------------------------------------- */

let dashboardBranches = [];
let dashboardProperties = [];
let dashboardLeads = [];
let dashboardStaff = [];
let dashboardActivityLogs = [];
let dashboardCommunicationLogs = [];
let dashboardCurrentUser = null;
let dashboardUsingSupabase = false;
let currentBranch = 'all';
let dashboardCompanyProfile = {
  companyName: 'Hilltop Properties Zambia',
  tradingName: 'Hilltop Properties'
};
let dashboardWebsitePreferences = {
  primaryColor: '#0d1b2a',
  secondaryColor: '#4a5e3a',
  accentColor: '#c9a227'
};
let dashboardPartners = [];
let dashboardPartnerPreviewObjectUrl = '';


/* -- 4. HELPERS ----------------------------------------------- */

function getSupabaseClient() {
  return window.hilltopSupabase || null;
}

function waitForCurrentStaffProfile() {
  return new Promise(function(resolve, reject) {
    let attempts = 0;
    const maxAttempts = 100;

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

function buildLookup(rows) {
  const lookup = {};
  (rows || []).forEach(function(row) {
    lookup[String(row.id)] = row;
  });
  return lookup;
}

function sameId(a, b) {
  return String(a || '') === String(b || '');
}

function getCurrentRole() {
  return String((dashboardCurrentUser && dashboardCurrentUser.role) || '').toLowerCase().replace(/\s+/g, '_');
}

function setDashboardCompanyStatus(message, type) {
  if (!dashboardCompanyNameStatus) return;
  dashboardCompanyNameStatus.textContent = message || '';
  dashboardCompanyNameStatus.classList.remove('success', 'error');
  if (type) dashboardCompanyNameStatus.classList.add(type);
}

function applyDashboardCompanyProfile() {
  var companyName = String(dashboardCompanyProfile.companyName || '').trim() || 'Hilltop Properties Zambia';
  if (dashboardCompanyNameInput) dashboardCompanyNameInput.value = companyName;
  if (dashboardCompanySubtitle) dashboardCompanySubtitle.textContent = companyName;

  var canEdit = getCurrentRole() === 'super_admin';
  if (dashboardCompanyNameInput) dashboardCompanyNameInput.disabled = dashboardUsingSupabase && !canEdit;
  if (dashboardCompanyNameSave) dashboardCompanyNameSave.disabled = dashboardUsingSupabase && !canEdit;
  if (dashboardUsingSupabase && !canEdit) {
    setDashboardCompanyStatus('Only a Super Admin can change the website company name.', 'error');
  }
}

function normalizeDashboardThemeColor(value, fallback) {
  var color = String(value || '').trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function setDashboardThemeStatus(message, type) {
  if (!dashboardThemeStatus) return;
  dashboardThemeStatus.textContent = message || '';
  dashboardThemeStatus.classList.remove('success', 'error');
  if (type) dashboardThemeStatus.classList.add(type);
}

function readDashboardThemeFields() {
  return {
    primaryColor: normalizeDashboardThemeColor(dashboardPrimaryColorValue && dashboardPrimaryColorValue.value, dashboardPrimaryColor && dashboardPrimaryColor.value || '#0d1b2a'),
    secondaryColor: normalizeDashboardThemeColor(dashboardSecondaryColorValue && dashboardSecondaryColorValue.value, dashboardSecondaryColor && dashboardSecondaryColor.value || '#4a5e3a'),
    accentColor: normalizeDashboardThemeColor(dashboardAccentColorValue && dashboardAccentColorValue.value, dashboardAccentColor && dashboardAccentColor.value || '#c9a227')
  };
}

function previewDashboardTheme(theme) {
  var palette = theme || readDashboardThemeFields();
  if (dashboardPrimaryColorValue) dashboardPrimaryColorValue.value = palette.primaryColor;
  if (dashboardSecondaryColorValue) dashboardSecondaryColorValue.value = palette.secondaryColor;
  if (dashboardAccentColorValue) dashboardAccentColorValue.value = palette.accentColor;

  var primaryPreview = document.querySelector('[data-theme-preview="primary"]');
  var secondaryPreview = document.querySelector('[data-theme-preview="secondary"]');
  var accentPreview = document.querySelector('[data-theme-preview="accent"]');
  if (primaryPreview) primaryPreview.style.backgroundColor = palette.primaryColor;
  if (secondaryPreview) secondaryPreview.style.backgroundColor = palette.secondaryColor;
  if (accentPreview) accentPreview.style.backgroundColor = palette.accentColor;
}

function applyDashboardWebsiteTheme() {
  var theme = {
    primaryColor: normalizeDashboardThemeColor(dashboardWebsitePreferences.primaryColor, '#0d1b2a'),
    secondaryColor: normalizeDashboardThemeColor(dashboardWebsitePreferences.secondaryColor, '#4a5e3a'),
    accentColor: normalizeDashboardThemeColor(dashboardWebsitePreferences.accentColor, '#c9a227')
  };
  if (dashboardPrimaryColor) dashboardPrimaryColor.value = theme.primaryColor;
  if (dashboardSecondaryColor) dashboardSecondaryColor.value = theme.secondaryColor;
  if (dashboardAccentColor) dashboardAccentColor.value = theme.accentColor;
  previewDashboardTheme(theme);

  var canEdit = getCurrentRole() === 'super_admin';
  [
    dashboardPrimaryColor,
    dashboardSecondaryColor,
    dashboardAccentColor,
    dashboardPrimaryColorValue,
    dashboardSecondaryColorValue,
    dashboardAccentColorValue,
    dashboardThemeReset
  ].forEach(function(control) {
    if (control) control.disabled = dashboardUsingSupabase && !canEdit;
  });
  if (dashboardThemeSave) dashboardThemeSave.disabled = dashboardUsingSupabase && !canEdit;
  if (dashboardUsingSupabase && !canEdit) {
    setDashboardThemeStatus('Only a Super Admin can change the public website colors.', 'error');
  }
}

function setDashboardPartnerStatus(message, type) {
  if (!dashboardPartnerStatus) return;
  dashboardPartnerStatus.textContent = message || '';
  dashboardPartnerStatus.classList.remove('success', 'error');
  if (type) dashboardPartnerStatus.classList.add(type);
}

function escapeDashboardHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeDashboardPartnerUrl(value) {
  var raw = String(value || '').trim();
  if (!raw) return '';
  try {
    var parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch (error) {
    return '';
  }
}

function normalizeDashboardPartners(value) {
  if (!Array.isArray(value)) return [];
  return value.map(function(partner, index) {
    var logoUrl = normalizeDashboardPartnerUrl(partner && partner.logoUrl);
    if (!partner || !String(partner.name || '').trim() || !logoUrl) return null;
    return {
      id: String(partner.id || ('partner-' + index)),
      name: String(partner.name || '').trim().slice(0, 120),
      logoUrl: logoUrl,
      logoPath: String(partner.logoPath || '').trim(),
      websiteUrl: normalizeDashboardPartnerUrl(partner.websiteUrl),
      displayOrder: Math.max(0, Math.min(9999, Number(partner.displayOrder) || 0)),
      isActive: partner.isActive !== false
    };
  }).filter(Boolean).sort(function(a, b) {
    return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
  });
}

function setDashboardPartnerPreview(url, alt) {
  if (!dashboardPartnerLogoPreview || !dashboardPartnerLogoPreviewImage) return;
  var rawUrl = String(url || '').trim();
  var safeUrl = rawUrl.indexOf('blob:') === 0 ? rawUrl : normalizeDashboardPartnerUrl(rawUrl);
  dashboardPartnerLogoPreview.hidden = !safeUrl;
  dashboardPartnerLogoPreviewImage.src = safeUrl || '';
  dashboardPartnerLogoPreviewImage.alt = safeUrl ? ((alt || 'Partner') + ' logo preview') : '';
}

function clearDashboardPartnerPreviewObjectUrl() {
  if (!dashboardPartnerPreviewObjectUrl) return;
  URL.revokeObjectURL(dashboardPartnerPreviewObjectUrl);
  dashboardPartnerPreviewObjectUrl = '';
}

function resetDashboardPartnerForm() {
  clearDashboardPartnerPreviewObjectUrl();
  if (dashboardPartnerForm) dashboardPartnerForm.reset();
  if (dashboardPartnerId) dashboardPartnerId.value = '';
  if (dashboardPartnerOrder) dashboardPartnerOrder.value = '0';
  if (dashboardPartnerActive) dashboardPartnerActive.checked = true;
  if (dashboardPartnerSave) dashboardPartnerSave.textContent = 'Add partner';
  if (dashboardPartnerCancel) dashboardPartnerCancel.hidden = true;
  setDashboardPartnerPreview('', '');
}

function renderDashboardPartners() {
  dashboardPartners = normalizeDashboardPartners(dashboardWebsitePreferences.partners);
  if (!dashboardPartnersList) return;

  if (!dashboardPartners.length) {
    dashboardPartnersList.innerHTML = '<div class="dashboard-partner-empty">No dashboard-managed partner logos yet. The current local logos remain visible until you add the first partner here.</div>';
  } else {
    dashboardPartnersList.innerHTML = dashboardPartners.map(function(partner) {
      return [
        '<article class="dashboard-partner-item" data-partner-id="' + escapeDashboardHtml(partner.id) + '">',
          '<div class="dashboard-partner-logo"><img src="' + escapeDashboardHtml(partner.logoUrl) + '" alt="' + escapeDashboardHtml(partner.name) + ' logo"></div>',
          '<div class="dashboard-partner-details">',
            '<strong>' + escapeDashboardHtml(partner.name) + '</strong>',
            '<span>Order ' + partner.displayOrder + ' · ' + (partner.isActive ? 'Visible' : 'Hidden') + '</span>',
          '</div>',
          '<div class="dashboard-partner-actions">',
            '<button type="button" data-partner-action="edit">Edit</button>',
            '<button type="button" data-partner-action="delete">Remove</button>',
          '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  var canEdit = getCurrentRole() === 'super_admin';
  [
    dashboardPartnerName,
    dashboardPartnerWebsite,
    dashboardPartnerOrder,
    dashboardPartnerLogo,
    dashboardPartnerActive,
    dashboardPartnerCancel
  ].forEach(function(control) {
    if (control) control.disabled = dashboardUsingSupabase && !canEdit;
  });
  if (dashboardPartnerSave) dashboardPartnerSave.disabled = dashboardUsingSupabase && !canEdit;
  dashboardPartnersList.querySelectorAll('button').forEach(function(button) {
    button.disabled = dashboardUsingSupabase && !canEdit;
  });
  if (dashboardUsingSupabase && !canEdit) {
    setDashboardPartnerStatus('Only a Super Admin can manage public partner logos.', 'error');
  }
}

function branchKeyFromName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getBranchById(branchId) {
  return dashboardBranches.find(function(branch) {
    return sameId(branch.id, branchId);
  }) || null;
}

function getBranchKey(branchId) {
  const branch = getBranchById(branchId);
  return branch ? branchKeyFromName(branch.name) : '';
}

function getBranchName(branchId) {
  const branch = getBranchById(branchId);
  return branch ? branch.name : 'Unassigned';
}

function isInSelectedBranch(row) {
  if (currentBranch === 'all') return true;
  return getBranchKey(row.branch_id) === currentBranch;
}

function isVisibleByRole(row, type) {
  const role = getCurrentRole();
  if (!dashboardCurrentUser || role === 'super_admin') return true;

  if (role === 'branch_manager') {
    return sameId(row.branch_id, dashboardCurrentUser.branch_id);
  }

  if (role === 'agent') {
    if (sameId(row.branch_id, dashboardCurrentUser.branch_id)) return true;
    if (type === 'property' && sameId(row.assigned_agent_id, dashboardCurrentUser.id)) return true;
    if (type === 'lead' && sameId(row.assigned_agent_id, dashboardCurrentUser.id)) return true;
  }

  return false;
}

function visibleProperties() {
  return dashboardProperties.filter(function(property) {
    return isVisibleByRole(property, 'property') && isInSelectedBranch(property);
  });
}

function visibleLeads() {
  return dashboardLeads.filter(function(lead) {
    return isVisibleByRole(lead, 'lead') && isInSelectedBranch(lead);
  });
}

function visibleActivityRows(rows) {
  return rows.filter(function(row) {
    if (!row.branch_id) return currentBranch === 'all';
    return isVisibleByRole(row, 'activity') && isInSelectedBranch(row);
  });
}

function isDateWithinLastSevenDays(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return date >= sevenDaysAgo && date <= now;
}

function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + ' minutes ago';

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + ' hours ago';

  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showDashboardMessage(message) {
  let toast = document.getElementById('dashboardToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dashboardToast';
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.zIndex = '9999';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '8px';
    toast.style.background = '#0f2133';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 12px 30px rgba(0,0,0,.18)';
    toast.style.fontSize = '14px';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(showDashboardMessage.timer);
  showDashboardMessage.timer = setTimeout(function() {
    toast.style.display = 'none';
  }, 3600);
}


/* -- 5. STATS -------------------------------------------------- */

function animateStat(el, newValue) {
  if (!el) return;
  el.classList.remove('updating');
  void el.offsetWidth;
  el.textContent = newValue;
  el.classList.add('updating');
}

function calculateDashboardStats() {
  const properties = visibleProperties();
  const leads = visibleLeads();

  return {
    activeProperties: properties.filter(function(property) { return property.status === 'Active'; }).length,
    newLeads: leads.filter(function(lead) { return isDateWithinLastSevenDays(lead.created_at); }).length,
    sold: properties.filter(function(property) { return property.status === 'Sold'; }).length,
    rented: properties.filter(function(property) { return property.status === 'Let / Rented'; }).length
  };
}

function updateDashboardStats() {
  const stats = dashboardUsingSupabase ? calculateDashboardStats() : demoStatsData[currentBranch];
  animateStat(statActiveProps, stats.activeProperties || 0);
  animateStat(statNewLeads, stats.newLeads || 0);
  animateStat(statSold, stats.sold || 0);
  animateStat(statRented, stats.rented || 0);
}


/* -- 6. ACTIVITY ---------------------------------------------- */

function mapActionType(actionType) {
  const key = String(actionType || '').toLowerCase();
  if (key.indexOf('lead') !== -1 || key.indexOf('enquiry') !== -1) return 'enquiry';
  if (key.indexOf('follow') !== -1) return 'followup';
  if (key.indexOf('status') !== -1 || key.indexOf('archive') !== -1) return 'status';
  if (key.indexOf('property') !== -1) return 'property';
  return 'status';
}

function buildActivityFromLogs() {
  const propertyLookup = buildLookup(dashboardProperties);
  const leadLookup = buildLookup(dashboardLeads);
  const staffLookup = buildLookup(dashboardStaff);

  return visibleActivityRows(dashboardActivityLogs)
    .map(function(row) {
      const property = row.property_id ? propertyLookup[String(row.property_id)] : null;
      const lead = row.lead_id ? leadLookup[String(row.lead_id)] : null;
      const staff = row.staff_user_id ? staffLookup[String(row.staff_user_id)] : null;
      const extra = [
        property ? property.reference_number || property.title : '',
        lead ? lead.client_name : '',
        staff ? staff.full_name : ''
      ].filter(Boolean).join(' • ');

      return {
        type: mapActionType(row.action_type),
        text: row.description + (extra ? ' - ' + extra : ''),
        time: formatRelativeTime(row.created_at),
        branch: getBranchName(row.branch_id),
        sortTime: row.created_at
      };
    });
}

function buildFallbackActivity() {
  const propertyItems = visibleProperties().map(function(property) {
    return {
      type: 'property',
      text: 'Property listed - ' + (property.reference_number || property.title || 'Untitled property'),
      time: formatRelativeTime(property.created_at),
      branch: getBranchName(property.branch_id),
      sortTime: property.created_at
    };
  });

  const leadItems = visibleLeads().map(function(lead) {
    return {
      type: 'enquiry',
      text: 'Lead enquiry received - ' + (lead.client_name || 'Unnamed client'),
      time: formatRelativeTime(lead.created_at),
      branch: getBranchName(lead.branch_id),
      sortTime: lead.created_at
    };
  });

  const leadLookup = buildLookup(dashboardLeads);
  const communicationItems = dashboardCommunicationLogs
    .map(function(log) {
      const lead = log.lead_id ? leadLookup[String(log.lead_id)] : null;
      const branchId = lead ? lead.branch_id : null;
      return {
        type: 'followup',
        text: (log.communication_type || 'Note') + ' - ' + (lead ? lead.client_name : 'Lead communication'),
        time: formatRelativeTime(log.created_at),
        branch: getBranchName(branchId),
        sortTime: log.created_at,
        branch_id: branchId,
        lead_id: log.lead_id || ''
      };
    })
    .filter(function(item) {
      const lead = item.lead_id ? leadLookup[String(item.lead_id)] : null;
      if (lead && !isVisibleByRole(lead, 'lead')) return false;
      if (!item.branch_id) return currentBranch === 'all';
      return isInSelectedBranch(item);
    });

  return propertyItems.concat(leadItems, communicationItems);
}

function getDashboardActivityItems() {
  const sourceItems = dashboardActivityLogs.length ? buildActivityFromLogs() : buildFallbackActivity();
  return sourceItems
    .sort(function(a, b) {
      return new Date(b.sortTime || 0) - new Date(a.sortTime || 0);
    })
    .slice(0, 8);
}

function renderActivityItems(items) {
  if (!activityFeed) return;
  activityFeed.innerHTML = '';
  activityBadge.textContent = branchLabels[currentBranch] || 'Selected Branch';

  if (!items.length) {
    activityFeed.innerHTML = '<div class="activity-item"><div class="activity-content"><p class="activity-text">No recent activity found for this branch yet.</p><div class="activity-meta"><span class="activity-time">Real data will appear here as work is added.</span></div></div></div>';
    return;
  }

  items.forEach(function(item) {
    const type = activityIcons[item.type] ? item.type : 'status';
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = [
      '<div class="activity-dot dot-' + type + '">' + activityIcons[type] + '</div>',
      '<div class="activity-content">',
        '<p class="activity-text">' + item.text + '</p>',
        '<div class="activity-meta">',
          '<span class="activity-time">' + item.time + '</span>',
          '<span class="activity-branch">' + item.branch + '</span>',
        '</div>',
      '</div>',
      '<div class="activity-tag-col">',
        '<span class="activity-tag tag-' + type + '">' + tagLabels[type] + '</span>',
      '</div>'
    ].join('');
    activityFeed.appendChild(div);
  });
}

function renderDashboard() {
  updateDashboardStats();
  renderActivityItems(dashboardUsingSupabase ? getDashboardActivityItems() : demoActivityData[currentBranch]);
  applyDashboardCompanyProfile();
  applyDashboardWebsiteTheme();
  renderDashboardPartners();
}

function showLoadingDashboard() {
  animateStat(statActiveProps, 0);
  animateStat(statNewLeads, 0);
  animateStat(statSold, 0);
  animateStat(statRented, 0);
  if (activityBadge) activityBadge.textContent = 'Loading';
  if (activityFeed) {
    activityFeed.innerHTML = '<div class="activity-item"><div class="activity-content"><p class="activity-text">Loading dashboard data...</p></div></div>';
  }
}


/* -- 7. SUPABASE READS ---------------------------------------- */

async function loadDashboardBranches(supabase) {
  const result = await supabase.from('branches').select('id, name').order('name', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardProperties(supabase) {
  const result = await supabase
    .from('properties')
    .select('id, reference_number, title, status, branch_id, assigned_agent_id, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardLeads(supabase) {
  const result = await supabase
    .from('leads')
    .select('id, client_name, status, branch_id, assigned_agent_id, property_id, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardStaff(supabase) {
  const result = await supabase
    .from('staff_users')
    .select('id, full_name, role, branch_id, is_active')
    .order('full_name', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardActivity(supabase) {
  const result = await supabase
    .from('activity_logs')
    .select('id, action_type, description, branch_id, property_id, lead_id, staff_user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(25);
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardCommunicationLogs(supabase) {
  const result = await supabase
    .from('lead_communication_logs')
    .select('id, lead_id, communication_type, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (result.error) {
    const message = String(result.error.message || '').toLowerCase();
    if (result.error.code === '42P01' || message.indexOf('lead_communication_logs') !== -1) {
      console.warn('Lead communication logs table not available for dashboard fallback activity yet.');
      return [];
    }
    throw result.error;
  }

  return result.data || [];
}

async function loadDashboardCompanyProfile(supabase) {
  const result = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'company_profile')
    .maybeSingle();
  if (result.error) throw result.error;
  return (result.data && result.data.setting_value) || dashboardCompanyProfile;
}

async function loadDashboardWebsitePreferences(supabase) {
  const result = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'website_preferences')
    .maybeSingle();
  if (result.error) throw result.error;
  return (result.data && result.data.setting_value) || dashboardWebsitePreferences;
}

async function loadDashboardData() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    dashboardUsingSupabase = false;
    renderDashboard();
    showDashboardMessage('Supabase is not available. Showing demo dashboard data.');
    return;
  }

  showLoadingDashboard();

  try {
    dashboardCurrentUser = await waitForCurrentStaffProfile();
    const results = await Promise.all([
      loadDashboardBranches(supabase),
      loadDashboardProperties(supabase),
      loadDashboardLeads(supabase),
      loadDashboardStaff(supabase),
      loadDashboardActivity(supabase),
      loadDashboardCommunicationLogs(supabase),
      loadDashboardCompanyProfile(supabase),
      loadDashboardWebsitePreferences(supabase)
    ]);

    dashboardBranches = results[0];
    dashboardProperties = results[1];
    dashboardLeads = results[2];
    dashboardStaff = results[3];
    dashboardActivityLogs = results[4];
    dashboardCommunicationLogs = results[5];
    dashboardCompanyProfile = Object.assign({}, dashboardCompanyProfile, results[6] || {});
    dashboardWebsitePreferences = Object.assign({}, dashboardWebsitePreferences, results[7] || {});
    dashboardUsingSupabase = true;
    renderDashboard();
  } catch (err) {
    console.error('Dashboard Supabase load failed:', err);
    dashboardUsingSupabase = false;
    renderDashboard();
    showDashboardMessage('Could not load Supabase dashboard data. Showing demo data.');
  }
}


/* -- 8. INTERACTIONS ------------------------------------------ */

branchButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    branchButtons.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentBranch = btn.dataset.branch;
    renderDashboard();
  });
});

if (btnAddProperty) {
  btnAddProperty.addEventListener('click', function() {
    window.location.href = 'properties.html';
  });
}

if (btnAddLead) {
  btnAddLead.addEventListener('click', function() {
    window.location.href = 'leads.html';
  });
}

async function saveDashboardCompanyName(event) {
  event.preventDefault();

  const supabase = getSupabaseClient();
  const companyName = String((dashboardCompanyNameInput && dashboardCompanyNameInput.value) || '').trim();
  if (!companyName) {
    setDashboardCompanyStatus('Enter a company name before saving.', 'error');
    if (dashboardCompanyNameInput) dashboardCompanyNameInput.focus();
    return;
  }
  if (!supabase || !dashboardCurrentUser) {
    setDashboardCompanyStatus('The dashboard is not connected to Supabase. Refresh and try again.', 'error');
    return;
  }
  if (getCurrentRole() !== 'super_admin') {
    setDashboardCompanyStatus('Only a Super Admin can change the website company name.', 'error');
    return;
  }

  const previousCompanyName = String(dashboardCompanyProfile.companyName || '').trim();
  const previousTradingName = String(dashboardCompanyProfile.tradingName || '').trim();
  const nextProfile = Object.assign({}, dashboardCompanyProfile, { companyName: companyName });
  if (!previousTradingName || previousTradingName === 'Hilltop Properties' || previousTradingName === previousCompanyName) {
    nextProfile.tradingName = companyName;
  }

  if (dashboardCompanyNameSave) dashboardCompanyNameSave.disabled = true;
  setDashboardCompanyStatus('Saving company name…');

  try {
    const result = await supabase
      .from('app_settings')
      .upsert({
        setting_key: 'company_profile',
        setting_category: 'company',
        setting_value: nextProfile,
        updated_by: dashboardCurrentUser.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
    if (result.error) throw result.error;

    dashboardCompanyProfile = nextProfile;
    applyDashboardCompanyProfile();
    setDashboardCompanyStatus('Saved. The public website now uses “' + companyName + '” without changing its font.', 'success');
  } catch (err) {
    console.error('Company name save failed:', err);
    setDashboardCompanyStatus('Could not save the company name. Please try again.', 'error');
  } finally {
    if (dashboardCompanyNameSave) dashboardCompanyNameSave.disabled = getCurrentRole() !== 'super_admin';
  }
}

if (dashboardCompanyNameForm) {
  dashboardCompanyNameForm.addEventListener('submit', saveDashboardCompanyName);
}

async function saveDashboardWebsiteTheme(event) {
  event.preventDefault();

  const supabase = getSupabaseClient();
  if (!supabase || !dashboardCurrentUser) {
    setDashboardThemeStatus('The dashboard is not connected to Supabase. Refresh and try again.', 'error');
    return;
  }
  if (getCurrentRole() !== 'super_admin') {
    setDashboardThemeStatus('Only a Super Admin can change the public website colors.', 'error');
    return;
  }

  var invalidHexInput = [dashboardPrimaryColorValue, dashboardSecondaryColorValue, dashboardAccentColorValue].find(function(input) {
    return input && !/^#[0-9a-f]{6}$/i.test(String(input.value || '').trim());
  });
  if (invalidHexInput) {
    setDashboardThemeStatus('Enter each color as a 6-digit hex value, for example #FC8413.', 'error');
    invalidHexInput.focus();
    return;
  }

  const selectedTheme = readDashboardThemeFields();
  const nextPreferences = Object.assign({}, dashboardWebsitePreferences, selectedTheme);
  if (dashboardThemeSave) dashboardThemeSave.disabled = true;
  setDashboardThemeStatus('Saving website colors…');

  try {
    const result = await supabase
      .from('app_settings')
      .upsert({
        setting_key: 'website_preferences',
        setting_category: 'website',
        setting_value: nextPreferences,
        updated_by: dashboardCurrentUser.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
    if (result.error) throw result.error;

    dashboardWebsitePreferences = nextPreferences;
    previewDashboardTheme(selectedTheme);
    setDashboardThemeStatus('Theme saved. Refresh the public website to see the new colors.', 'success');
  } catch (err) {
    console.error('Website theme save failed:', err);
    setDashboardThemeStatus('Could not save the website colors. Please try again.', 'error');
  } finally {
    if (dashboardThemeSave) dashboardThemeSave.disabled = getCurrentRole() !== 'super_admin';
  }
}

if (dashboardThemeForm) {
  dashboardThemeForm.addEventListener('submit', saveDashboardWebsiteTheme);
}

function bindDashboardThemeColor(colorInput, hexInput, fallback) {
  if (!colorInput || !hexInput) return;

  colorInput.addEventListener('input', function() {
    hexInput.value = normalizeDashboardThemeColor(colorInput.value, fallback).toUpperCase();
    previewDashboardTheme(readDashboardThemeFields());
  });

  hexInput.addEventListener('input', function() {
    var typedValue = String(hexInput.value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(typedValue)) {
      colorInput.value = typedValue.toLowerCase();
      previewDashboardTheme(readDashboardThemeFields());
      setDashboardThemeStatus('Color preview updated. Click “Save theme colors” to apply it.');
    }
  });

  hexInput.addEventListener('blur', function() {
    var typedValue = String(hexInput.value || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(typedValue)) {
      hexInput.value = colorInput.value.toUpperCase();
      setDashboardThemeStatus('A valid color needs # followed by six letters or numbers, for example #FC8413.', 'error');
      return;
    }
    hexInput.value = typedValue.toUpperCase();
  });
}

bindDashboardThemeColor(dashboardPrimaryColor, dashboardPrimaryColorValue, '#0d1b2a');
bindDashboardThemeColor(dashboardSecondaryColor, dashboardSecondaryColorValue, '#4a5e3a');
bindDashboardThemeColor(dashboardAccentColor, dashboardAccentColorValue, '#c9a227');

if (dashboardThemeReset) {
  dashboardThemeReset.addEventListener('click', function() {
    var originalTheme = {
      primaryColor: '#0d1b2a',
      secondaryColor: '#4a5e3a',
      accentColor: '#c9a227'
    };
    if (dashboardPrimaryColor) dashboardPrimaryColor.value = originalTheme.primaryColor;
    if (dashboardSecondaryColor) dashboardSecondaryColor.value = originalTheme.secondaryColor;
    if (dashboardAccentColor) dashboardAccentColor.value = originalTheme.accentColor;
    previewDashboardTheme(originalTheme);
    setDashboardThemeStatus('Original colors selected. Click “Save theme colors” to apply them.');
  });
}

function createDashboardPartnerId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return 'partner-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function safeDashboardPartnerFileName(name) {
  var parts = String(name || 'partner-logo').split('.');
  var extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
  var base = parts.join('.').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'partner-logo';
  return extension ? base + '.' + extension : base;
}

function validateDashboardPartnerLogo(file) {
  if (!file) return '';
  var allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (allowedTypes.indexOf(file.type) === -1) return 'Choose a PNG, JPG, or WebP logo image.';
  if (file.size > 5 * 1024 * 1024) return 'The partner logo must be 5MB or smaller.';
  return '';
}

async function uploadDashboardPartnerLogo(file, partnerId) {
  var supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not connected.');

  var path = 'partners/' + partnerId + '/' + Date.now() + '-' + safeDashboardPartnerFileName(file.name);
  var uploadResult = await supabase.storage
    .from('cms-media')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadResult.error) throw uploadResult.error;

  var publicResult = supabase.storage.from('cms-media').getPublicUrl(path);
  var publicUrl = publicResult && publicResult.data && publicResult.data.publicUrl;
  if (!publicUrl) throw new Error('The uploaded logo did not return a public URL.');
  return { logoUrl: publicUrl, logoPath: path };
}

async function persistDashboardPartners(nextPartners, successMessage) {
  var supabase = getSupabaseClient();
  if (!supabase || !dashboardCurrentUser) throw new Error('The dashboard is not connected to Supabase.');

  var normalizedPartners = normalizeDashboardPartners(nextPartners);
  var nextPreferences = Object.assign({}, dashboardWebsitePreferences, { partners: normalizedPartners });
  var result = await supabase
    .from('app_settings')
    .upsert({
      setting_key: 'website_preferences',
      setting_category: 'website',
      setting_value: nextPreferences,
      updated_by: dashboardCurrentUser.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });
  if (result.error) throw result.error;

  dashboardWebsitePreferences = nextPreferences;
  dashboardPartners = normalizedPartners;
  renderDashboardPartners();
  setDashboardPartnerStatus(successMessage, 'success');
}

function editDashboardPartner(partner) {
  if (!partner) return;
  clearDashboardPartnerPreviewObjectUrl();
  if (dashboardPartnerId) dashboardPartnerId.value = partner.id;
  if (dashboardPartnerName) dashboardPartnerName.value = partner.name;
  if (dashboardPartnerWebsite) dashboardPartnerWebsite.value = partner.websiteUrl || '';
  if (dashboardPartnerOrder) dashboardPartnerOrder.value = String(partner.displayOrder || 0);
  if (dashboardPartnerLogo) dashboardPartnerLogo.value = '';
  if (dashboardPartnerActive) dashboardPartnerActive.checked = partner.isActive !== false;
  if (dashboardPartnerSave) dashboardPartnerSave.textContent = 'Save partner';
  if (dashboardPartnerCancel) dashboardPartnerCancel.hidden = false;
  setDashboardPartnerPreview(partner.logoUrl, partner.name);
  setDashboardPartnerStatus('Editing “' + partner.name + '”. Choose a new file only if you want to replace its logo.');
  if (dashboardPartnerName) dashboardPartnerName.focus();
}

async function saveDashboardPartner(event) {
  event.preventDefault();
  if (!getSupabaseClient() || !dashboardCurrentUser) {
    setDashboardPartnerStatus('The dashboard is not connected to Supabase. Refresh and try again.', 'error');
    return;
  }
  if (getCurrentRole() !== 'super_admin') {
    setDashboardPartnerStatus('Only a Super Admin can manage public partner logos.', 'error');
    return;
  }

  var editingId = String((dashboardPartnerId && dashboardPartnerId.value) || '').trim();
  var existing = dashboardPartners.find(function(partner) { return partner.id === editingId; }) || null;
  var name = String((dashboardPartnerName && dashboardPartnerName.value) || '').trim();
  var websiteRaw = String((dashboardPartnerWebsite && dashboardPartnerWebsite.value) || '').trim();
  var websiteUrl = normalizeDashboardPartnerUrl(websiteRaw);
  var file = dashboardPartnerLogo && dashboardPartnerLogo.files && dashboardPartnerLogo.files[0];

  if (!name) {
    setDashboardPartnerStatus('Enter the partner name.', 'error');
    if (dashboardPartnerName) dashboardPartnerName.focus();
    return;
  }
  if (websiteRaw && !websiteUrl) {
    setDashboardPartnerStatus('Enter a complete website link beginning with http:// or https://.', 'error');
    if (dashboardPartnerWebsite) dashboardPartnerWebsite.focus();
    return;
  }
  var fileError = validateDashboardPartnerLogo(file);
  if (fileError) {
    setDashboardPartnerStatus(fileError, 'error');
    return;
  }
  if (!existing && !file) {
    setDashboardPartnerStatus('Choose a logo image for the new partner.', 'error');
    return;
  }

  var partnerId = existing ? existing.id : createDashboardPartnerId();
  var nextPartner = {
    id: partnerId,
    name: name.slice(0, 120),
    logoUrl: existing ? existing.logoUrl : '',
    logoPath: existing ? existing.logoPath : '',
    websiteUrl: websiteUrl,
    displayOrder: Math.max(0, Math.min(9999, Number((dashboardPartnerOrder && dashboardPartnerOrder.value) || 0) || 0)),
    isActive: dashboardPartnerActive ? dashboardPartnerActive.checked : true
  };

  if (dashboardPartnerSave) dashboardPartnerSave.disabled = true;
  setDashboardPartnerStatus(file ? 'Uploading partner logo…' : 'Saving partner…');

  try {
    if (file) {
      var uploaded = await uploadDashboardPartnerLogo(file, partnerId);
      nextPartner.logoUrl = uploaded.logoUrl;
      nextPartner.logoPath = uploaded.logoPath;
    }

    var nextPartners = dashboardPartners.filter(function(partner) { return partner.id !== partnerId; });
    nextPartners.push(nextPartner);
    await persistDashboardPartners(nextPartners, existing ? 'Partner updated on the public website.' : 'Partner added to the public website.');
    resetDashboardPartnerForm();
  } catch (error) {
    console.error('Partner save failed:', error);
    setDashboardPartnerStatus('Could not save the partner. Check the image and storage connection, then try again.', 'error');
  } finally {
    if (dashboardPartnerSave) dashboardPartnerSave.disabled = getCurrentRole() !== 'super_admin';
  }
}

if (dashboardPartnerForm) dashboardPartnerForm.addEventListener('submit', saveDashboardPartner);

if (dashboardPartnerCancel) {
  dashboardPartnerCancel.addEventListener('click', function() {
    resetDashboardPartnerForm();
    setDashboardPartnerStatus('Edit cancelled.');
  });
}

if (dashboardPartnerLogo) {
  dashboardPartnerLogo.addEventListener('change', function() {
    clearDashboardPartnerPreviewObjectUrl();
    var file = dashboardPartnerLogo.files && dashboardPartnerLogo.files[0];
    var fileError = validateDashboardPartnerLogo(file);
    if (fileError) {
      dashboardPartnerLogo.value = '';
      setDashboardPartnerStatus(fileError, 'error');
      return;
    }
    if (!file) return;
    dashboardPartnerPreviewObjectUrl = URL.createObjectURL(file);
    setDashboardPartnerPreview(dashboardPartnerPreviewObjectUrl, dashboardPartnerName && dashboardPartnerName.value);
    setDashboardPartnerStatus('Logo selected. Save the partner to upload it.');
  });
}

if (dashboardPartnersList) {
  dashboardPartnersList.addEventListener('click', async function(event) {
    var button = event.target.closest('[data-partner-action]');
    if (!button || getCurrentRole() !== 'super_admin') return;
    var item = button.closest('[data-partner-id]');
    var partnerId = item && item.getAttribute('data-partner-id');
    var partner = dashboardPartners.find(function(entry) { return entry.id === partnerId; });
    if (!partner) return;

    if (button.getAttribute('data-partner-action') === 'edit') {
      editDashboardPartner(partner);
      return;
    }

    if (!window.confirm('Remove “' + partner.name + '” from the public partners section?')) return;
    button.disabled = true;
    setDashboardPartnerStatus('Removing partner…');
    try {
      await persistDashboardPartners(
        dashboardPartners.filter(function(entry) { return entry.id !== partner.id; }),
        'Partner removed from the public website.'
      );
      if (dashboardPartnerId && dashboardPartnerId.value === partner.id) resetDashboardPartnerForm();
    } catch (error) {
      console.error('Partner removal failed:', error);
      setDashboardPartnerStatus('Could not remove the partner. Please try again.', 'error');
      button.disabled = false;
    }
  });
}


/* -- 9. SIDEBAR TOGGLE ---------------------------------------- */

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (hamburgerBtn && sidebar && sidebarOverlay) {
  hamburgerBtn.addEventListener('click', function() {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay.addEventListener('click', closeSidebar);
}

document.querySelectorAll('.nav-item').forEach(function(item) {
  item.addEventListener('click', function() {
    if (window.innerWidth <= 768) closeSidebar();
  });
});


/* -- 10. INITIAL LOAD ----------------------------------------- */

loadDashboardData();
