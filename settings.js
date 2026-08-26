/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - MODULE 6: SETTINGS
   Phase 7A: read-only Supabase settings loading with demo fallback.
   Never expose service_role keys in frontend code.
   ============================================================ */

var settingsData = {
  company: {
    companyName: 'iProperties Zimbabwe',
    tradingName: 'iProperties',
    registrationNumber: 'Zimbabwe registration placeholder',
    mainPhone: '+263 242 000 000',
    mainWhatsapp: '+263 77 100 0000',
    mainEmail: 'enquiries@iproperties.co.zw',
    websiteUrl: 'https://iproperties.co.zw',
    businessAddress: 'Borrowdale, Harare, Zimbabwe',
    aboutCompany: 'iProperties Zimbabwe helps clients buy, rent, sell, and manage quality real estate across Harare and Bulawayo.',
    currency: 'USD',
    country: 'Zimbabwe'
  },
  branches: [
    {
      id: 'harare',
      name: 'Harare Branch',
      address: 'Borrowdale, Harare, Zimbabwe',
      phone: '+263 77 100 0001',
      whatsapp: '+263 77 100 0001',
      email: 'harare@iproperties.co.zw',
      manager: 'Demo Branch Manager',
      hours: 'Mon-Fri, 08:00-17:00',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Borrowdale%2C%20Harare%2C%20Zimbabwe',
      status: 'Active',
      showOnWebsite: true
    },
    {
      id: 'bulawayo',
      name: 'Bulawayo Branch',
      address: 'Hillside, Bulawayo, Zimbabwe',
      phone: '+263 77 100 0002',
      whatsapp: '+263 77 100 0002',
      email: 'bulawayo@iproperties.co.zw',
      manager: 'Demo Branch Manager',
      hours: 'Mon-Fri, 08:00-17:00',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Hillside%2C%20Bulawayo%2C%20Zimbabwe',
      status: 'Active',
      showOnWebsite: true
    }
  ],
  website: {
    primaryColor: '#0d1b2a',
    secondaryColor: '#4a5e3a',
    accentColor: '#c9a227',
    showFeatured: true,
    showTestimonials: true,
    showTeam: true,
    showPublicBranchFilter: true,
    partners: [],
    defaultPublicBranch: 'All',
    propertyCardStyle: 'Detailed',
    showPrices: true,
    showClosedProperties: false,
    enquiryButtonLabel: 'Enquire Now',
    whatsappButtonLabel: 'WhatsApp Agent'
  },
  notifications: {
    leads: ['New website enquiry', 'WhatsApp enquiry', 'Viewing scheduled', 'Follow-up due', 'Lead assigned to agent'],
    properties: ['New property added', 'Property approved', 'Property marked sold/rented', 'Property expiring soon'],
    channels: ['Email', 'WhatsApp placeholder', 'Admin dashboard alert'],
    recipients: {
      notifyLusaka: 'PROBRYMALYANGO@GMAIL.COM',
      notifyLivingstone: 'PROBRYMALYANGO@GMAIL.COM',
      notifyHeadOffice: 'PROBRYMALYANGO@GMAIL.COM'
    }
  },
  seo: {
    seoSiteTitle: 'Hilltop Properties Zambia',
    seoMetaDescription: 'Find houses, apartments, land, and commercial property for sale and rent in Zimbabwe.',
    seoKeywords: 'Zimbabwe property, Harare real estate, Bulawayo properties, houses for sale Zimbabwe',
    seoHomepageTitle: 'iProperties Zimbabwe | Real Estate in Harare and Bulawayo',
    seoHomepageDescription: 'Browse properties, rentals, land, and commercial real estate across Zimbabwe.',
    seoPropertyTitle: '{property_title} | Hilltop Properties Zambia',
    seoPropertyDescription: '{property_title} in {area}. View price, branch, features, and enquiry details.',
    seoSocialImage: 'Website social sharing image placeholder',
    seoSearchConsole: 'Google Search Console placeholder',
    seoAnalytics: 'Google Analytics placeholder',
    schemaEnabled: true
  },
  propertyDefaults: {
    defaultPurpose: 'For Sale',
    defaultPropertyType: 'House',
    defaultCurrency: 'ZMW',
    defaultPropertyStatus: 'Draft',
    requireReference: true,
    requireImages: true,
    requireLegalStatus: true,
    requireBranch: true,
    defaultImageText: 'Image coming soon',
    types: ['House', 'Apartment', 'Plot/Land', 'Commercial', 'Farm', 'Lodge/Guesthouse']
  },
  workflow: {
    statuses: ['New', 'Contacted', 'Follow-up', 'Viewing Scheduled', 'Offer Made', 'Closed Won', 'Closed Lost'],
    sources: ['Website', 'WhatsApp', 'Phone Call', 'Facebook', 'Referral', 'Walk-in'],
    defaultLeadStatus: 'New',
    defaultLeadSource: 'Website',
    defaultFollowUpDays: 2,
    overdueWarningDays: 1,
    autoAssignLeads: false,
    requireAssignedAgent: true,
    requireClosingLog: true
  },
  securityAccess: {
    requireActiveStaffProfile: true,
    allowAgentsToUpdateLeadStatus: true,
    allowBranchManagersToManageOwnBranch: true
  }
};

var recommendedPropertyDefaults = JSON.parse(JSON.stringify(settingsData.propertyDefaults));
var currentBranch = 'all';
var activeSection = 'company';
var toastTimer;
var settingsCurrentUser = null;
var settingsUsingSupabase = false;
var settingsTableAvailable = false;
var settingsBranchRows = [];
var companyTradingNameEdited = false;

var sidebar = document.getElementById('sidebar');
var hamburgerBtn = document.getElementById('hamburger');
var sidebarOverlay = document.getElementById('sidebarOverlay');
var modalOverlay = document.getElementById('settingsModalOverlay');
var settingsModal = document.getElementById('settingsModal');
var settingsModalClose = document.getElementById('settingsModalClose');
var toastEl = document.getElementById('toast');

function byId(id) {
  return document.getElementById(id);
}

function setValue(id, value) {
  var el = byId(id);
  if (el) el.value = value;
}

function setChecked(id, value) {
  var el = byId(id);
  if (el) el.checked = Boolean(value);
}

function showToast(message, type) {
  type = type || 'success';
  toastEl.textContent = message;
  toastEl.className = 'toast ' + type;
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toastEl.classList.add('show');
    });
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toastEl.classList.remove('show');
  }, 3000);
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

function isMissingSettingsTableError(error) {
  if (!error) return false;
  var msg = String(error.message || error.details || error.hint || '').toLowerCase();
  return error.code === '42P01' ||
    (msg.indexOf('app_settings') !== -1 && (
      msg.indexOf('does not exist') !== -1 ||
      msg.indexOf('not found') !== -1 ||
      msg.indexOf('schema cache') !== -1
    ));
}

function showSettingsNotice(message, type) {
  var body = document.querySelector('.page-body');
  if (!body) return;

  var notice = byId('settingsDataNotice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'settingsDataNotice';
    body.insertBefore(notice, body.firstChild);
  }

  notice.className = 'settings-data-notice ' + (type || 'info');
  notice.textContent = message;
}

function clearSettingsNotice() {
  var notice = byId('settingsDataNotice');
  if (notice) notice.remove();
}

function showSettingsMissingWarning() {
  showSettingsNotice('Settings table is not available yet. Run supabase/settings-foundation.sql.', 'warning');
}

function getCurrentSettingsRole() {
  return String((settingsCurrentUser || window.hilltopCurrentUser || {}).role || '').toLowerCase().replace(/\s+/g, '_');
}

function canManageSettings() {
  return getCurrentSettingsRole() === 'super_admin';
}

function requireSettingsManagePermission() {
  if (canManageSettings()) return true;
  showToast('You do not have permission to manage system settings.', 'error');
  return false;
}

function applySettingsPermissions() {
  if (canManageSettings()) return;
  document.querySelectorAll('[data-save], [data-branch-save], [data-branch-edit], #btnResetPropertyDefaults, #btnAddStatus, #btnAddSource').forEach(function(button) {
    button.style.display = 'none';
  });
}

function getSettingValue(settingsByKey, key) {
  return settingsByKey[key] || {};
}

function firstDefined() {
  for (var i = 0; i < arguments.length; i += 1) {
    if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== '') {
      return arguments[i];
    }
  }
  return '';
}

function branchSlug(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function mapBranchRowsToSettings(branchRows) {
  settingsBranchRows = branchRows || [];
  if (!branchRows || !branchRows.length) return;

  settingsData.branches = branchRows.map(function(branch) {
    var slug = branchSlug(branch.name);
    return {
      id: slug || String(branch.id),
      branchId: branch.id,
      name: branch.name + ' Branch',
      address: branch.address || '',
      phone: branch.contact_number || '',
      whatsapp: branch.contact_number || '',
      email: slug ? slug + '@hilltopproperties.co.zm' : '',
      manager: 'Managed in Staff & Branches',
      hours: 'Mon-Fri, 08:00-17:00',
      mapLink: 'Google Maps placeholder - ' + branch.name,
      status: 'Active',
      showOnWebsite: true
    };
  });
}

function mapSettingsToForm(settingsRows) {
  var settingsByKey = {};
  (settingsRows || []).forEach(function(row) {
    settingsByKey[row.setting_key] = row.setting_value || {};
  });

  var company = getSettingValue(settingsByKey, 'company_profile');
  settingsData.company.companyName = firstDefined(company.companyName, settingsData.company.companyName);
  settingsData.company.tradingName = firstDefined(company.tradingName, company.companyName, settingsData.company.tradingName);
  settingsData.company.mainPhone = firstDefined(company.phone, settingsData.company.mainPhone);
  settingsData.company.mainWhatsapp = firstDefined(company.whatsapp, company.phone, settingsData.company.mainWhatsapp);
  settingsData.company.mainEmail = firstDefined(company.email, settingsData.company.mainEmail);
  settingsData.company.businessAddress = firstDefined(company.address, settingsData.company.businessAddress);
  settingsData.company.websiteUrl = firstDefined(company.websiteUrl, settingsData.company.websiteUrl);
  settingsData.company.aboutCompany = firstDefined(company.aboutCompany, company.description, settingsData.company.aboutCompany);

  var website = getSettingValue(settingsByKey, 'website_preferences');
  settingsData.website.primaryColor = firstDefined(website.primaryColor, settingsData.website.primaryColor);
  settingsData.website.secondaryColor = firstDefined(website.secondaryColor, settingsData.website.secondaryColor);
  settingsData.website.accentColor = firstDefined(website.accentColor, settingsData.website.accentColor);
  settingsData.website.showFeatured = website.showFeaturedProperties !== undefined ? Boolean(website.showFeaturedProperties) : settingsData.website.showFeatured;
  settingsData.website.showTestimonials = website.showTestimonials !== undefined ? Boolean(website.showTestimonials) : settingsData.website.showTestimonials;
  settingsData.website.showTeam = website.showTeamProfiles !== undefined ? Boolean(website.showTeamProfiles) : settingsData.website.showTeam;
  settingsData.website.partners = Array.isArray(website.partners) ? website.partners : settingsData.website.partners;
  settingsData.website.enquiryButtonLabel = firstDefined(website.enquiryButtonLabel, settingsData.website.enquiryButtonLabel);
  settingsData.website.whatsappButtonLabel = firstDefined(website.whatsappButtonLabel, settingsData.website.whatsappButtonLabel);

  var notifications = getSettingValue(settingsByKey, 'notification_settings');
  if (notifications.emailNotifications === false) settingsData.notifications.channels = ['Admin dashboard alert'];
  if (notifications.leadNotifications === false) settingsData.notifications.leads = [];
  if (notifications.propertyNotifications === false) settingsData.notifications.properties = [];

  var seo = getSettingValue(settingsByKey, 'seo_metadata');
  settingsData.seo.seoSiteTitle = firstDefined(seo.siteTitle, settingsData.seo.seoSiteTitle);
  settingsData.seo.seoMetaDescription = firstDefined(seo.metaDescription, settingsData.seo.seoMetaDescription);
  settingsData.seo.seoKeywords = firstDefined(seo.keywords, settingsData.seo.seoKeywords);
  settingsData.seo.seoHomepageTitle = firstDefined(seo.homepageTitle, seo.siteTitle, settingsData.seo.seoHomepageTitle);
  settingsData.seo.seoHomepageDescription = firstDefined(seo.homepageDescription, seo.metaDescription, settingsData.seo.seoHomepageDescription);

  var propertyDefaults = getSettingValue(settingsByKey, 'property_defaults');
  settingsData.propertyDefaults.defaultPropertyStatus = firstDefined(propertyDefaults.defaultStatus, settingsData.propertyDefaults.defaultPropertyStatus);
  settingsData.propertyDefaults.defaultPurpose = firstDefined(propertyDefaults.defaultPurpose, settingsData.propertyDefaults.defaultPurpose);
  settingsData.propertyDefaults.defaultPropertyType = firstDefined(propertyDefaults.defaultPropertyType, settingsData.propertyDefaults.defaultPropertyType);
  settingsData.propertyDefaults.defaultBranchId = firstDefined(propertyDefaults.defaultBranchId, settingsData.propertyDefaults.defaultBranchId);
  settingsData.propertyDefaults.defaultCurrency = firstDefined(propertyDefaults.defaultCurrency, settingsData.propertyDefaults.defaultCurrency);

  var workflow = getSettingValue(settingsByKey, 'lead_workflow');
  settingsData.workflow.defaultFollowUpDays = Number(firstDefined(workflow.followUpReminderDays, settingsData.workflow.defaultFollowUpDays));
  settingsData.workflow.defaultLeadStatus = firstDefined(workflow.defaultLeadStatus, settingsData.workflow.defaultLeadStatus);
  settingsData.workflow.defaultLeadSource = firstDefined(workflow.defaultLeadSource, settingsData.workflow.defaultLeadSource);

  var security = getSettingValue(settingsByKey, 'security_access');
  settingsData.securityAccess = {
    requireActiveStaffProfile: security.requireActiveStaffProfile !== undefined ? Boolean(security.requireActiveStaffProfile) : true,
    allowAgentsToUpdateLeadStatus: security.allowAgentsToUpdateLeadStatus !== undefined ? Boolean(security.allowAgentsToUpdateLeadStatus) : true,
    allowBranchManagersToManageOwnBranch: security.allowBranchManagersToManageOwnBranch !== undefined ? Boolean(security.allowBranchManagersToManageOwnBranch) : true
  };
}

async function logSettingsActivity(actionType, description) {
  var supabase = getSupabaseClient();
  var staffId = (settingsCurrentUser || window.hilltopCurrentUser || {}).id || null;
  if (!supabase || !staffId) return;

  var result = await supabase.from('activity_logs').insert({
    action_type: actionType,
    description: description,
    staff_user_id: staffId
  });

  if (result.error) {
    console.warn('Settings activity log insert failed.', result.error);
  }
}

async function saveAppSetting(settingKey, settingCategory, settingValue, successMessage, activityType, activityDescription) {
  if (!requireSettingsManagePermission()) return;

  var supabase = getSupabaseClient();
  var staffId = (settingsCurrentUser || window.hilltopCurrentUser || {}).id || null;
  if (!supabase) {
    showToast('Supabase is not available. Please check your connection and configuration.', 'error');
    return;
  }
  if (!staffId) {
    showToast('Your staff profile is not loaded yet. Please refresh and try again.', 'error');
    return;
  }

  try {
    var existing = await supabase
      .from('app_settings')
      .select('id')
      .eq('setting_key', settingKey)
      .maybeSingle();

    if (existing.error) throw existing.error;

    var payload = {
      setting_key: settingKey,
      setting_category: settingCategory,
      setting_value: settingValue,
      updated_by: staffId,
      updated_at: new Date().toISOString()
    };

    var result;
    if (existing.data && existing.data.id) {
      result = await supabase
        .from('app_settings')
        .update(payload)
        .eq('id', existing.data.id);
    } else {
      result = await supabase
        .from('app_settings')
        .insert(payload);
    }

    if (result.error) throw result.error;

    await logSettingsActivity(activityType, activityDescription);
    await loadSettingsData();
    showToast(successMessage, 'success');
  } catch (error) {
    console.warn('Settings save failed for ' + settingKey + '.', error);
    if (isMissingSettingsTableError(error)) {
      showSettingsMissingWarning();
      showToast('Settings table is not available yet. Run supabase/settings-foundation.sql.', 'error');
    } else {
      showToast('Could not save settings. Please try again.', 'error');
    }
  }
}

async function loadAppSettings(supabase) {
  var result = await supabase
    .from('app_settings')
    .select('id, setting_key, setting_category, setting_value, updated_by, created_at, updated_at')
    .order('setting_category', { ascending: true })
    .order('setting_key', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadSettingsBranches(supabase) {
  var result = await supabase
    .from('branches')
    .select('id, name, address, contact_number, created_at')
    .order('name', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadSettingsData() {
  var supabase = getSupabaseClient();
  if (!supabase) {
    showSettingsNotice('Supabase is not available. Showing default settings.', 'warning');
    return;
  }

  showSettingsNotice('Loading system settings...', 'info');

  try {
    settingsCurrentUser = await waitForCurrentStaffProfile();
    var branchRows = await loadSettingsBranches(supabase);
    mapBranchRowsToSettings(branchRows);
    initialRender();

    var settingsRows = await loadAppSettings(supabase);
    mapSettingsToForm(settingsRows);

    settingsUsingSupabase = true;
    settingsTableAvailable = true;
    clearSettingsNotice();
    initialRender();
    applySettingsPermissions();

    if (!settingsRows.length) {
      showSettingsNotice('No saved settings rows found yet. Showing default settings.', 'info');
    }
  } catch (error) {
    settingsUsingSupabase = false;
    if (isMissingSettingsTableError(error)) {
      settingsTableAvailable = false;
      console.warn('Settings table is not available yet. Run supabase/settings-foundation.sql.', error);
      initialRender();
      applySettingsPermissions();
      showSettingsMissingWarning();
    } else {
      console.warn('Settings data load failed.', error);
      showSettingsNotice('Could not load settings from Supabase. Showing default settings.', 'warning');
      showToast('Could not load settings from Supabase. Showing defaults.', 'error');
    }
  }
}

function updateStats() {
  var visibleBranches = settingsData.branches.filter(function(branch) {
    return branch.status === 'Active' && branch.showOnWebsite;
  }).length;
  var enabledNotifications = settingsData.notifications.leads.length + settingsData.notifications.properties.length;
  byId('statBranches').textContent = visibleBranches;
  byId('statNotifications').textContent = enabledNotifications > 0 ? 'On' : 'Off';
  byId('statSeo').textContent = settingsData.seo.schemaEnabled ? 'Live' : 'Draft';
}

function populateCompanyForm() {
  Object.keys(settingsData.company).forEach(function(key) {
    setValue(key, settingsData.company[key]);
  });
  companyTradingNameEdited = false;
}

function readCompanyForm() {
  Object.keys(settingsData.company).forEach(function(key) {
    var el = byId(key);
    if (el && !el.readOnly) settingsData.company[key] = el.value.trim();
  });
}

function renderBranchCards() {
  var wrap = byId('branchSettingsGrid');
  var branches = settingsData.branches.filter(function(branch) {
    return currentBranch === 'all' || branch.id === currentBranch;
  });
  wrap.innerHTML = branches.map(function(branch) {
    return [
      '<div class="branch-settings-card" data-branch="' + branch.id + '">',
        '<div class="branch-settings-top">',
          '<div><h3>' + branch.name + '</h3><p>' + branch.manager + '</p></div>',
          '<span>' + branch.status + '</span>',
        '</div>',
        '<div class="branch-settings-body">',
          '<div class="form-grid single">',
            fieldHtml(branch.id + '-name', 'Branch name', branch.name),
            fieldHtml(branch.id + '-address', 'Branch address', branch.address, true),
            fieldHtml(branch.id + '-phone', 'Branch phone', branch.phone),
            fieldHtml(branch.id + '-whatsapp', 'Branch WhatsApp', branch.whatsapp),
            fieldHtml(branch.id + '-email', 'Branch email', branch.email),
            fieldHtml(branch.id + '-manager', 'Branch manager', branch.manager),
            fieldHtml(branch.id + '-hours', 'Opening hours', branch.hours),
            fieldHtml(branch.id + '-mapLink', 'Google Maps placeholder link', branch.mapLink),
            '<label>Active/Inactive status<select id="' + branch.id + '-status"><option' + selected(branch.status, 'Active') + '>Active</option><option' + selected(branch.status, 'Inactive') + '>Inactive</option></select></label>',
            '<label>Show on website<select id="' + branch.id + '-showOnWebsite"><option value="yes"' + (branch.showOnWebsite ? ' selected' : '') + '>Yes</option><option value="no"' + (!branch.showOnWebsite ? ' selected' : '') + '>No</option></select></label>',
          '</div>',
          '<div class="settings-actions">',
            '<button type="button" class="action-btn outline" data-branch-edit="' + branch.id + '">Edit</button>',
            '<button type="button" class="action-btn primary" data-branch-save="' + branch.id + '">Save</button>',
            '<button type="button" class="action-btn secondary" data-branch-preview="' + branch.id + '">Preview contact block</button>',
          '</div>',
          '<div class="branch-preview" id="' + branch.id + '-preview">' + contactPreview(branch) + '</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');
}

function fieldHtml(id, label, value, textarea) {
  if (textarea) return '<label>' + label + '<textarea id="' + id + '" rows="2">' + escapeHtml(value) + '</textarea></label>';
  return '<label>' + label + '<input id="' + id + '" type="text" value="' + escapeHtml(value) + '" /></label>';
}

function selected(actual, expected) {
  return actual === expected ? ' selected' : '';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function contactPreview(branch) {
  return '<strong>' + branch.name + '</strong><br>' + branch.address + '<br>' + branch.phone + ' | ' + branch.whatsapp + '<br>' + branch.email + '<br>' + branch.hours;
}

function saveBranch(branchId) {
  showToast('Branch contact editing is managed from Staff & Branch Management.', 'error');
}

function populateWebsiteForm() {
  Object.keys(settingsData.website).forEach(function(key) {
    if (typeof settingsData.website[key] === 'boolean') setChecked(key, settingsData.website[key]);
    else setValue(key, settingsData.website[key]);
  });
}

function readWebsiteForm() {
  Object.keys(settingsData.website).forEach(function(key) {
    var el = byId(key);
    if (!el) return;
    settingsData.website[key] = el.type === 'checkbox' ? el.checked : el.value;
  });
}

function renderNotificationLists() {
  renderCheckList('leadNotificationList', settingsData.notifications.leads);
  renderCheckList('propertyNotificationList', settingsData.notifications.properties);
  renderCheckList('notificationChannels', settingsData.notifications.channels);
  Object.keys(settingsData.notifications.recipients).forEach(function(key) {
    setValue(key, settingsData.notifications.recipients[key]);
  });
}

function renderCheckList(containerId, items) {
  var wrap = byId(containerId);
  wrap.innerHTML = items.map(function(item, index) {
    return '<label class="check-row"><span>' + item + '</span><input type="checkbox" checked data-check-index="' + index + '" /></label>';
  }).join('');
}

function readNotificationRecipients() {
  Object.keys(settingsData.notifications.recipients).forEach(function(key) {
    settingsData.notifications.recipients[key] = byId(key).value.trim();
  });
}

function hasCheckedItems(containerId) {
  var inputs = document.querySelectorAll('#' + containerId + ' input[type="checkbox"]');
  if (!inputs.length) return false;
  return Array.prototype.some.call(inputs, function(input) { return input.checked; });
}

function hasCheckedLabel(containerId, labelText) {
  var labels = document.querySelectorAll('#' + containerId + ' .check-row');
  return Array.prototype.some.call(labels, function(label) {
    var text = (label.querySelector('span') || {}).textContent || '';
    var input = label.querySelector('input[type="checkbox"]');
    return text.toLowerCase().indexOf(labelText.toLowerCase()) !== -1 && input && input.checked;
  });
}

function populateSeoForm() {
  Object.keys(settingsData.seo).forEach(function(key) {
    if (typeof settingsData.seo[key] === 'boolean') setChecked(key, settingsData.seo[key]);
    else setValue(key, settingsData.seo[key]);
  });
  renderSeoPreview();
}

function readSeoForm() {
  Object.keys(settingsData.seo).forEach(function(key) {
    var el = byId(key);
    if (!el) return;
    settingsData.seo[key] = el.type === 'checkbox' ? el.checked : el.value.trim();
  });
}

function renderSeoPreview() {
  readSeoForm();
  byId('seoPreview').innerHTML = [
    '<div class="seo-title">' + escapeHtml(settingsData.seo.seoHomepageTitle) + '</div>',
    '<div class="seo-url">' + escapeHtml(settingsData.company.websiteUrl) + '</div>',
    '<div class="seo-description">' + escapeHtml(settingsData.seo.seoHomepageDescription) + '</div>'
  ].join('');
}

function populatePropertyDefaults() {
  Object.keys(settingsData.propertyDefaults).forEach(function(key) {
    var value = settingsData.propertyDefaults[key];
    if (Array.isArray(value)) return;
    if (typeof value === 'boolean') setChecked(key, value);
    else setValue(key, value);
  });
  renderPropertyTypes();
}

function readPropertyDefaults() {
  Object.keys(settingsData.propertyDefaults).forEach(function(key) {
    var el = byId(key);
    if (!el || Array.isArray(settingsData.propertyDefaults[key])) return;
    settingsData.propertyDefaults[key] = el.type === 'checkbox' ? el.checked : el.value;
  });
}

function renderPropertyTypes() {
  byId('allowedPropertyTypes').innerHTML = settingsData.propertyDefaults.types.map(function(type) {
    return '<label class="check-row"><span>' + type + '</span><input type="checkbox" checked /></label>';
  }).join('');
}

function populateWorkflow() {
  setValue('defaultLeadStatus', settingsData.workflow.defaultLeadStatus || 'New');
  setValue('defaultLeadSource', settingsData.workflow.defaultLeadSource || 'Website');
  setValue('defaultFollowUpDays', settingsData.workflow.defaultFollowUpDays);
  setValue('overdueWarningDays', settingsData.workflow.overdueWarningDays);
  setChecked('autoAssignLeads', settingsData.workflow.autoAssignLeads);
  setChecked('requireAssignedAgent', settingsData.workflow.requireAssignedAgent);
  setChecked('requireClosingLog', settingsData.workflow.requireClosingLog);
  renderPills('leadStatuses', settingsData.workflow.statuses);
  renderPills('leadSources', settingsData.workflow.sources);
}

function readWorkflow() {
  settingsData.workflow.defaultLeadStatus = byId('defaultLeadStatus').value;
  settingsData.workflow.defaultLeadSource = byId('defaultLeadSource').value;
  settingsData.workflow.defaultFollowUpDays = Number(byId('defaultFollowUpDays').value || 2);
  settingsData.workflow.overdueWarningDays = Number(byId('overdueWarningDays').value || 1);
  settingsData.workflow.autoAssignLeads = byId('autoAssignLeads').checked;
  settingsData.workflow.requireAssignedAgent = byId('requireAssignedAgent').checked;
  settingsData.workflow.requireClosingLog = byId('requireClosingLog').checked;
}

function populateSecurityAccess() {
  var security = settingsData.securityAccess || {};
  setChecked('requireActiveStaffProfile', security.requireActiveStaffProfile !== false);
  setChecked('allowAgentsToUpdateLeadStatus', security.allowAgentsToUpdateLeadStatus !== false);
  setChecked('allowBranchManagersToManageOwnBranch', security.allowBranchManagersToManageOwnBranch !== false);
}

function readSecurityAccess() {
  settingsData.securityAccess = {
    requireActiveStaffProfile: byId('requireActiveStaffProfile').checked,
    allowAgentsToUpdateLeadStatus: byId('allowAgentsToUpdateLeadStatus').checked,
    allowBranchManagersToManageOwnBranch: byId('allowBranchManagersToManageOwnBranch').checked
  };
}

function buildCompanyProfileSetting() {
  readCompanyForm();
  if (!settingsData.company.companyName) {
    showToast('Company name is required.', 'error');
    byId('companyName').focus();
    return null;
  }

  if (!settingsData.company.tradingName) {
    settingsData.company.tradingName = settingsData.company.companyName;
    setValue('tradingName', settingsData.company.tradingName);
  }

  return {
    companyName: settingsData.company.companyName,
    phone: settingsData.company.mainPhone,
    email: settingsData.company.mainEmail,
    address: settingsData.company.businessAddress,
    logoUrl: settingsData.company.logoUrl || '',
    tradingName: settingsData.company.tradingName,
    whatsapp: settingsData.company.mainWhatsapp,
    websiteUrl: settingsData.company.websiteUrl,
    aboutCompany: settingsData.company.aboutCompany
  };
}

function buildWebsitePreferencesSetting() {
  readWebsiteForm();
  return {
    primaryColor: settingsData.website.primaryColor || '#0d1b2a',
    secondaryColor: settingsData.website.secondaryColor || '#4a5e3a',
    accentColor: settingsData.website.accentColor || '#c9a227',
    showFeaturedProperties: settingsData.website.showFeatured,
    showTestimonials: settingsData.website.showTestimonials,
    showTeamProfiles: settingsData.website.showTeam,
    partners: Array.isArray(settingsData.website.partners) ? settingsData.website.partners : [],
    showPublicBranchFilter: settingsData.website.showPublicBranchFilter,
    showPrices: settingsData.website.showPrices,
    showClosedProperties: settingsData.website.showClosedProperties,
    defaultPublicBranch: settingsData.website.defaultPublicBranch,
    propertyCardStyle: settingsData.website.propertyCardStyle,
    enquiryButtonLabel: settingsData.website.enquiryButtonLabel,
    whatsappButtonLabel: settingsData.website.whatsappButtonLabel
  };
}

function buildNotificationSettingsSetting() {
  readNotificationRecipients();
  return {
    emailNotifications: hasCheckedLabel('notificationChannels', 'Email'),
    leadNotifications: hasCheckedItems('leadNotificationList'),
    propertyNotifications: hasCheckedItems('propertyNotificationList'),
    cmsNotifications: false,
    recipients: settingsData.notifications.recipients
  };
}

function buildSeoMetadataSetting() {
  readSeoForm();
  return {
    siteTitle: settingsData.seo.seoSiteTitle,
    metaDescription: settingsData.seo.seoMetaDescription,
    keywords: settingsData.seo.seoKeywords,
    homepageTitle: settingsData.seo.seoHomepageTitle,
    homepageDescription: settingsData.seo.seoHomepageDescription,
    propertyTitleTemplate: settingsData.seo.seoPropertyTitle,
    propertyDescriptionTemplate: settingsData.seo.seoPropertyDescription,
    schemaEnabled: settingsData.seo.schemaEnabled
  };
}

function buildPropertyDefaultsSetting() {
  readPropertyDefaults();
  var supportedStatuses = ['Draft', 'Active', 'Under Offer', 'Sold', 'Let / Rented', 'Withdrawn', 'Archived'];
  var supportedPurposes = ['For Sale', 'For Rent'];
  var supportedTypes = ['House', 'Apartment', 'Commercial', 'Land'];

  if (supportedStatuses.indexOf(settingsData.propertyDefaults.defaultPropertyStatus) === -1) {
    showToast('Default property status is not supported.', 'error');
    return null;
  }
  if (supportedPurposes.indexOf(settingsData.propertyDefaults.defaultPurpose) === -1) {
    showToast('Default property purpose must be For Sale or For Rent.', 'error');
    return null;
  }
  if (supportedTypes.indexOf(settingsData.propertyDefaults.defaultPropertyType) === -1) {
    showToast('Default property type must be House, Apartment, Commercial, or Land.', 'error');
    return null;
  }

  return {
    defaultStatus: settingsData.propertyDefaults.defaultPropertyStatus,
    defaultPurpose: settingsData.propertyDefaults.defaultPurpose,
    defaultPropertyType: settingsData.propertyDefaults.defaultPropertyType,
    defaultBranchId: settingsData.propertyDefaults.defaultBranchId || '',
    defaultCurrency: settingsData.propertyDefaults.defaultCurrency,
    requireReference: settingsData.propertyDefaults.requireReference,
    requireImages: settingsData.propertyDefaults.requireImages,
    requireLegalStatus: settingsData.propertyDefaults.requireLegalStatus,
    requireBranch: settingsData.propertyDefaults.requireBranch
  };
}

function buildLeadWorkflowSetting() {
  readWorkflow();
  var supportedStatuses = ['New', 'Contacted', 'Follow-up', 'Closed'];
  var supportedSources = ['Website', 'WhatsApp', 'Phone Call', 'Facebook', 'Referral', 'Walk-in'];
  var followUpDays = Number(settingsData.workflow.defaultFollowUpDays);

  if (supportedStatuses.indexOf(settingsData.workflow.defaultLeadStatus) === -1) {
    showToast('Default lead status is not supported.', 'error');
    return null;
  }
  if (supportedSources.indexOf(settingsData.workflow.defaultLeadSource) === -1) {
    showToast('Default lead source is not supported.', 'error');
    return null;
  }
  if (!Number.isFinite(followUpDays) || followUpDays < 0) {
    showToast('Follow-up reminder days must be a non-negative number.', 'error');
    return null;
  }

  return {
    defaultLeadStatus: settingsData.workflow.defaultLeadStatus,
    defaultLeadSource: settingsData.workflow.defaultLeadSource,
    followUpReminderDays: followUpDays,
    overdueWarningDays: Number(settingsData.workflow.overdueWarningDays || 0),
    autoAssignLeads: settingsData.workflow.autoAssignLeads,
    requireAssignedAgent: settingsData.workflow.requireAssignedAgent,
    requireClosingLog: settingsData.workflow.requireClosingLog
  };
}

function buildSecurityAccessSetting() {
  readSecurityAccess();
  return {
    requireActiveStaffProfile: settingsData.securityAccess.requireActiveStaffProfile,
    allowAgentsToUpdateLeadStatus: settingsData.securityAccess.allowAgentsToUpdateLeadStatus,
    allowBranchManagersToManageOwnBranch: settingsData.securityAccess.allowBranchManagersToManageOwnBranch
  };
}

function renderPills(containerId, items) {
  byId(containerId).innerHTML = items.map(function(item) {
    return '<span class="settings-pill">' + item + '</span>';
  }).join('');
}

function renderSecurityChecklist() {
  var items = [
    'Do not expose service_role key',
    'Do not store secret keys in frontend',
    'Use publishable key only',
    'RLS policies enabled in Supabase',
    'Staff accounts created by system administrator',
    'Later: stricter branch-level access rules'
  ];
  byId('securityChecklist').innerHTML = items.map(function(item) {
    return '<label class="check-row"><span>' + item + '</span><input type="checkbox" checked disabled /></label>';
  }).join('');
}

function switchSection(section) {
  activeSection = section;
  document.querySelectorAll('.settings-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.dataset.section === section);
  });
  document.querySelectorAll('.settings-panel').forEach(function(panel) {
    panel.classList.toggle('active', panel.id === 'panel-' + section);
  });
}

function openSettingsModal(title, html) {
  byId('settingsModalTitle').textContent = title;
  byId('settingsModalBody').innerHTML = html;
  settingsModal.style.display = 'block';
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(function() {
    settingsModal.classList.add('open');
  });
}

function closeSettingsModal() {
  settingsModal.classList.remove('open');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(function() {
    settingsModal.style.display = 'none';
  }, 280);
}

function initializeEvents() {
  byId('companyName').addEventListener('input', function() {
    if (!companyTradingNameEdited) {
      byId('tradingName').value = byId('companyName').value;
    }
  });

  byId('tradingName').addEventListener('input', function() {
    companyTradingNameEdited = true;
  });

  document.querySelectorAll('.settings-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchSection(tab.dataset.section);
    });
  });

  document.querySelectorAll('.branch-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.branch-btn').forEach(function(item) { item.classList.remove('active'); });
      btn.classList.add('active');
      currentBranch = btn.dataset.branch;
      renderBranchCards();
      applySettingsPermissions();
      showToast('Branch filter set to ' + btn.textContent.trim());
    });
  });

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (target.matches('[data-branch-save]')) saveBranch(target.dataset.branchSave);
    if (target.matches('[data-branch-edit]')) showToast('Branch editing is managed in Staff & Branches for now.', 'error');
    if (target.matches('[data-branch-preview]')) showToast('Contact preview refreshed');
    if (target.matches('[data-save]')) handleSave(target.dataset.save);
    if (target.matches('[data-preview]')) handlePreview(target.dataset.preview);
    if (target.matches('[data-modal="auth"]')) openSettingsModal('Authentication Notes', '<p>Supabase Authentication is used for staff login. Public sign-up remains disabled, and staff accounts are created manually by the system administrator.</p>');
    if (target.matches('[data-modal="rls"]')) openSettingsModal('RLS Notes', '<p>Starter RLS policies are enabled in Supabase. Later, stricter branch-level and role-based rules can be added before connecting live data writes.</p>');
  });

  byId('btnResetPropertyDefaults').addEventListener('click', function() {
    settingsData.propertyDefaults = JSON.parse(JSON.stringify(recommendedPropertyDefaults));
    populatePropertyDefaults();
    showToast('Property defaults reset to recommended values');
  });

  byId('btnAddStatus').addEventListener('click', function() {
    var value = prompt('Enter a custom lead status');
    if (value) {
      settingsData.workflow.statuses.push(value.trim());
      renderPills('leadStatuses', settingsData.workflow.statuses);
      showToast('Custom status added');
    }
  });

  byId('btnAddSource').addEventListener('click', function() {
    var value = prompt('Enter a custom lead source');
    if (value) {
      settingsData.workflow.sources.push(value.trim());
      renderPills('leadSources', settingsData.workflow.sources);
      showToast('Custom source added');
    }
  });

  byId('btnSafetyCheck').addEventListener('click', function() {
    showToast('Frontend safety check passed: no service_role key belongs in browser code');
  });

  ['seoHomepageTitle', 'seoHomepageDescription'].forEach(function(id) {
    byId(id).addEventListener('input', renderSeoPreview);
  });

  settingsModalClose.addEventListener('click', closeSettingsModal);
  modalOverlay.addEventListener('click', closeSettingsModal);

  if (hamburgerBtn && sidebar && sidebarOverlay) {
    hamburgerBtn.addEventListener('click', function() {
      var opening = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', opening);
      sidebarOverlay.classList.toggle('active', opening);
      document.body.style.overflow = opening ? 'hidden' : '';
    });
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
}

function handleSave(type) {
  if (type === 'company' || type === 'company-draft') {
    var companyProfile = buildCompanyProfileSetting();
    if (!companyProfile) return;
    saveAppSetting(
      'company_profile',
      'company',
      companyProfile,
      'Company profile settings saved.',
      'SETTINGS_COMPANY_PROFILE_UPDATED',
      'Company profile settings were updated.'
    );
    return;
  }

  if (type === 'website') {
    saveAppSetting(
      'website_preferences',
      'website',
      buildWebsitePreferencesSetting(),
      'Website preferences saved.',
      'SETTINGS_WEBSITE_PREFERENCES_UPDATED',
      'Website preference settings were updated.'
    );
    return;
  }

  if (type === 'notifications') {
    saveAppSetting(
      'notification_settings',
      'notifications',
      buildNotificationSettingsSetting(),
      'Notification settings saved.',
      'SETTINGS_NOTIFICATIONS_UPDATED',
      'Notification settings were updated.'
    );
    return;
  }

  if (type === 'seo') {
    saveAppSetting(
      'seo_metadata',
      'seo',
      buildSeoMetadataSetting(),
      'SEO metadata saved.',
      'SETTINGS_SEO_UPDATED',
      'SEO metadata settings were updated.'
    );
    return;
  }

  if (type === 'property') {
    var propertyDefaults = buildPropertyDefaultsSetting();
    if (!propertyDefaults) return;
    saveAppSetting(
      'property_defaults',
      'property',
      propertyDefaults,
      'Property defaults saved.',
      'SETTINGS_PROPERTY_DEFAULTS_UPDATED',
      'Property default settings were updated.'
    );
    return;
  }

  if (type === 'workflow') {
    var workflow = buildLeadWorkflowSetting();
    if (!workflow) return;
    saveAppSetting(
      'lead_workflow',
      'workflow',
      workflow,
      'Lead workflow settings saved.',
      'SETTINGS_LEAD_WORKFLOW_UPDATED',
      'Lead workflow settings were updated.'
    );
    return;
  }

  if (type === 'security') {
    saveAppSetting(
      'security_access',
      'security',
      buildSecurityAccessSetting(),
      'Security settings saved.',
      'SETTINGS_SECURITY_ACCESS_UPDATED',
      'Security access settings were updated.'
    );
  }
}

function handlePreview(type) {
  if (type === 'seo') renderSeoPreview();
  if (type === 'company') {
    var companyProfile = buildCompanyProfileSetting();
    if (!companyProfile) return;
    openSettingsModal('Company Name Preview', [
      '<div class="company-name-preview">',
      '<span class="company-name-preview__label">Website header</span>',
      '<strong>' + escapeHtml(companyProfile.tradingName || companyProfile.companyName) + '</strong>',
      '<span class="company-name-preview__label">Website footer and page titles</span>',
      '<p>' + escapeHtml(companyProfile.companyName) + '</p>',
      '</div>'
    ].join(''));
  }
  showToast('Preview refreshed for ' + type + ' settings');
}

function initialRender() {
  populateCompanyForm();
  renderBranchCards();
  populateWebsiteForm();
  renderNotificationLists();
  populateSeoForm();
  populatePropertyDefaults();
  populateWorkflow();
  renderSecurityChecklist();
  populateSecurityAccess();
  updateStats();
}

initialRender();
initializeEvents();
loadSettingsData();
