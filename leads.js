/* ============================================================
   HILLTOP PROPERTIES ZAMBIA — MODULE 3: CRM & LEAD MANAGEMENT
   leads.js
   ============================================================
   Phase 4A reads leads from Supabase after auth validation.
   Write actions remain local/frontend-only until Phase 4B/4C.
   ============================================================ */


/* ══════════════════════════════════════════════════════════════
   1. SAMPLE LEAD DATA
   Fallback demo data used only if Supabase is unavailable.
══════════════════════════════════════════════════════════════ */

var leads = [
  {
    id: 1,
    name: 'Mr. Chanda Mutale',
    phone: '+260 977 234 567',
    email: 'chanda.mutale@gmail.com',
    property: 'HT-LSK-001 — 4-Bedroom Executive House in Kabulonga',
    source: 'Website',
    branch: 'Lusaka',
    agent: 'John Phiri',
    status: 'New',
    dateEnquiry: '2024-06-01',
    followupDate: '2024-06-05',
    followupNote: 'Call to discuss budget and viewing availability.',
    notes: 'Client is relocating from Ndola. Looking to purchase within 3 months.',
    log: [
      { text: 'Lead created from website enquiry form.', time: '2024-06-01 09:14' }
    ]
  },
  {
    id: 2,
    name: 'Mrs. Grace Tembo',
    phone: '+260 966 345 678',
    email: 'grace.tembo@yahoo.com',
    property: 'HT-LSK-002 — 2-Bedroom Apartment in Levy Junction',
    source: 'WhatsApp',
    branch: 'Lusaka',
    agent: 'Mary Banda',
    status: 'Contacted',
    dateEnquiry: '2024-05-28',
    followupDate: '2024-06-06',
    followupNote: 'Send rental agreement draft.',
    notes: 'Interested in a 12-month rental. Works at Barclays on Cairo Road.',
    log: [
      { text: 'Lead received via WhatsApp message.', time: '2024-05-28 11:02' },
      { text: 'Called client. Confirmed interest and budget of ZMW 9,000/month.', time: '2024-05-30 14:30' },
      { text: 'Sent property brochure via WhatsApp.', time: '2024-05-30 15:00' }
    ]
  },
  {
    id: 3,
    name: 'Mr. Isaac Banda',
    phone: '+260 955 456 789',
    email: '',
    property: 'HT-LSK-003 — Commercial Office Space Cairo Road',
    source: 'Phone Call',
    branch: 'Lusaka',
    agent: 'David Mwale',
    status: 'Follow-up',
    dateEnquiry: '2024-05-25',
    followupDate: '2024-06-04',
    followupNote: 'Confirm if they want to proceed with offer.',
    notes: 'Looking for office space for a law firm. Budget up to ZMW 25,000/month. Wants parking for 6 cars.',
    log: [
      { text: 'Client called the office directly.', time: '2024-05-25 10:00' },
      { text: 'Emailed floor plan and pricing sheet.', time: '2024-05-26 09:30' },
      { text: 'Viewing conducted. Client asked for final pricing with discounts.', time: '2024-05-29 11:00' }
    ]
  },
  {
    id: 4,
    name: 'Dr. Mwansa Chipimo',
    phone: '+260 977 567 890',
    email: 'mwansa.chipimo@clinic.zm',
    property: 'HT-LSK-001 — 4-Bedroom Executive House in Kabulonga',
    source: 'Referral',
    branch: 'Lusaka',
    agent: 'John Phiri',
    status: 'Viewing Scheduled',
    dateEnquiry: '2024-05-30',
    followupDate: '2024-06-07',
    followupNote: 'Viewing confirmed for Saturday at 10:00.',
    notes: 'Referred by Mr. Chanda Mutale. Wants a family home with at least 4 beds and a pool.',
    log: [
      { text: 'Referral received from existing client Chanda Mutale.', time: '2024-05-30 13:00' },
      { text: 'Called Dr. Chipimo. Very interested. Viewing arranged for 7 June at 10:00.', time: '2024-06-01 10:20' }
    ]
  },
  {
    id: 5,
    name: 'Ms. Thandiwe Nkosi',
    phone: '+260 976 678 901',
    email: 'thandiwe@startup.co.zm',
    property: 'HT-LSK-005 — 1-Acre Residential Plot in Chalala',
    source: 'Facebook',
    branch: 'Lusaka',
    agent: 'Grace Mbewe',
    status: 'New',
    dateEnquiry: '2024-06-02',
    followupDate: '',
    followupNote: '',
    notes: 'Commented on our Facebook property post. Looking to buy land for future development.',
    log: [
      { text: 'Lead captured from Facebook ad comment.', time: '2024-06-02 08:45' }
    ]
  },
  {
    id: 6,
    name: 'Mr. Patrick Lunda',
    phone: '+260 955 789 012',
    email: 'patrick.lunda@mail.zm',
    property: 'HT-LSK-006 — 3-Bedroom House in Woodlands',
    source: 'Walk-in',
    branch: 'Lusaka',
    agent: 'Mary Banda',
    status: 'Offer Made',
    dateEnquiry: '2024-05-20',
    followupDate: '2024-06-08',
    followupNote: 'Await signed offer letter from client.',
    notes: 'Walked into the Lusaka branch office. Very serious buyer. Offer of ZMW 1,300,000 submitted.',
    log: [
      { text: 'Client walked into Lusaka branch.', time: '2024-05-20 14:00' },
      { text: 'Showed HT-LSK-006. Client very interested.', time: '2024-05-21 11:00' },
      { text: 'Viewing completed. Client happy with property condition.', time: '2024-05-23 10:30' },
      { text: 'Offer of ZMW 1,300,000 submitted by client.', time: '2024-05-29 16:00' }
    ]
  },
  {
    id: 7,
    name: 'Mr. Emmanuel Phiri',
    phone: '+260 976 890 123',
    email: '',
    property: 'HT-LVN-002 — Riverside Lodge Plot',
    source: 'Website',
    branch: 'Livingstone',
    agent: 'Grace Mbewe',
    status: 'New',
    dateEnquiry: '2024-06-03',
    followupDate: '2024-06-10',
    followupNote: 'Initial call to introduce property and schedule viewing.',
    notes: 'Foreign investor. Very interested in the riverside plot for a boutique lodge project.',
    log: [
      { text: 'Enquiry submitted via website contact form.', time: '2024-06-03 07:30' }
    ]
  },
  {
    id: 8,
    name: 'Ms. Charity Mbewe',
    phone: '+260 966 901 234',
    email: 'charity.mbewe@zesco.co.zm',
    property: 'HT-LVN-001 — 3-Bedroom Cottage Livingstone Central',
    source: 'Referral',
    branch: 'Livingstone',
    agent: 'David Mwale',
    status: 'Contacted',
    dateEnquiry: '2024-05-27',
    followupDate: '2024-06-05',
    followupNote: 'Follow up on lease agreement drafts.',
    notes: 'Referred by a Zesco colleague. Looking for a 6-month rental near the town centre.',
    log: [
      { text: 'Referred by colleague at Zesco Livingstone office.', time: '2024-05-27 09:00' },
      { text: 'Spoke on the phone. Confirmed budget and move-in date of 1 July.', time: '2024-05-29 15:00' }
    ]
  },
  {
    id: 9,
    name: 'Mr. Brian Muzuma',
    phone: '+260 977 012 345',
    email: 'bmuzuma@hotmail.com',
    property: 'HT-LVN-004 — Commercial Guesthouse Maramba',
    source: 'Phone Call',
    branch: 'Livingstone',
    agent: 'John Phiri',
    status: 'Closed Won',
    dateEnquiry: '2024-04-15',
    followupDate: '',
    followupNote: '',
    notes: 'Sale completed. ZMW 4,800,000 offer accepted. Title deed transferred.',
    log: [
      { text: 'Client phoned after seeing our signboard at the property.', time: '2024-04-15 11:00' },
      { text: 'Viewing arranged and completed.', time: '2024-04-18 10:00' },
      { text: 'Offer of ZMW 4,800,000 submitted. Under offer.', time: '2024-04-25 14:00' },
      { text: 'Offer accepted. Legal process initiated.', time: '2024-05-01 09:00' },
      { text: 'Title deed transfer completed. Deal closed.', time: '2024-05-30 16:00' }
    ]
  },
  {
    id: 10,
    name: 'Mrs. Natasha Siame',
    phone: '+260 955 123 456',
    email: 'natasha.siame@gmail.com',
    property: 'HT-LVN-003 — 2-Bedroom Apartment Livingstone Central',
    source: 'Facebook',
    branch: 'Livingstone',
    agent: 'Grace Mbewe',
    status: 'Closed Lost',
    dateEnquiry: '2024-05-10',
    followupDate: '',
    followupNote: '',
    notes: 'Client found a cheaper alternative in the same area. Lead closed as lost.',
    log: [
      { text: 'Enquiry received via Facebook Messenger.', time: '2024-05-10 12:00' },
      { text: 'Called client. Arranged viewing.', time: '2024-05-12 10:30' },
      { text: 'Viewing done. Client liked property but concerned about price.', time: '2024-05-14 11:00' },
      { text: 'Client found cheaper alternative. Lead closed as lost.', time: '2024-05-20 09:00' }
    ]
  }
];

// Running ID counter for new leads
var nextLeadId = 11;


/* ══════════════════════════════════════════════════════════════
   2. DOM REFERENCES
══════════════════════════════════════════════════════════════ */

var hamburgerBtn    = document.getElementById('hamburger');
var sidebar         = document.getElementById('sidebar');
var sidebarOverlay  = document.getElementById('sidebarOverlay');
var modalOverlay    = document.getElementById('modalOverlay');

var searchInput     = document.getElementById('searchInput');
var statusFilter    = document.getElementById('statusFilter');
var sourceFilter    = document.getElementById('sourceFilter');

var statNew         = document.getElementById('statNew');
var statContacted   = document.getElementById('statContacted');
var statFollowup    = document.getElementById('statFollowup');
var statClosed      = document.getElementById('statClosed');

var colNew          = document.getElementById('colNew');
var colContacted    = document.getElementById('colContacted');
var colFollowup     = document.getElementById('colFollowup');
var colClosed       = document.getElementById('colClosed');

var colCountNew       = document.getElementById('colCountNew');
var colCountContacted = document.getElementById('colCountContacted');
var colCountFollowup  = document.getElementById('colCountFollowup');
var colCountClosed    = document.getElementById('colCountClosed');

var kanbanBoard     = document.getElementById('kanbanBoard');
var leadListSection = document.getElementById('leadListSection');
var leadTableBody   = document.getElementById('leadTableBody');
var emptyState      = document.getElementById('emptyState');

var detailsPanel    = document.getElementById('detailsPanel');
var detailsPanelTitle = document.getElementById('detailsPanelTitle');
var detailsBody     = document.getElementById('detailsBody');
var detailsClose    = document.getElementById('detailsClose');
var btnEditFromPanel = document.getElementById('btnEditFromPanel');

var leadModal       = document.getElementById('leadModal');
var leadModalTitle  = document.getElementById('leadModalTitle');
var leadForm        = document.getElementById('leadForm');
var editLeadIdField = document.getElementById('editLeadId');
var modalClose      = document.getElementById('modalClose');
var modalCancelBtn  = document.getElementById('modalCancelBtn');

var btnAddLead      = document.getElementById('btnAddLead');
var emptyAddBtn     = document.getElementById('emptyAddBtn');
var viewToggle      = document.getElementById('viewToggle');
var toastEl         = document.getElementById('toast');


/* ══════════════════════════════════════════════════════════════
   3. FILTER STATE
══════════════════════════════════════════════════════════════ */

var currentBranch   = 'all';
var currentSearch   = '';
var currentStatus   = 'all';
var currentSource   = 'all';
var currentView     = 'kanban'; // 'kanban' | 'list'
var activePanelId   = null;     // ID of the currently open details panel
var isUsingSupabaseLeads = false;
var leadBranches = [];
var leadStaffUsers = [];
var leadProperties = [];
var branchLookupById = {};
var staffLookupById = {};
var propertyLookupById = {};
var currentStaffProfile = null;
var leadCommunicationLogsAvailable = false;

var DB_ALLOWED_STATUSES = ['New', 'Contacted', 'Follow-up', 'Closed'];
var UI_STATUSES = ['New', 'Contacted', 'Follow-up', 'Viewing Scheduled', 'Offer Made', 'Closed', 'Closed Won', 'Closed Lost'];
var STATUS_NOTE_PREFIX = 'Frontend status selected: ';


/* ══════════════════════════════════════════════════════════════
   4. HELPERS
══════════════════════════════════════════════════════════════ */

/**
 * Maps a lead status to a badge CSS class.
 */
function getStatusBadgeClass(status) {
  var map = {
    'New':              'badge-new',
    'Contacted':        'badge-contacted',
    'Follow-up':        'badge-followup',
    'Viewing Scheduled':'badge-viewing',
    'Offer Made':       'badge-offer',
    'Closed':           'badge-won',
    'Closed Won':       'badge-won',
    'Closed Lost':      'badge-lost'
  };
  return map[status] || 'badge-new';
}

/**
 * Maps a lead source to a source badge CSS class.
 */
function getSourceClass(source) {
  var map = {
    'Website':    'src-website',
    'WhatsApp':   'src-whatsapp',
    'Phone Call': 'src-phone',
    'Facebook':   'src-facebook',
    'Referral':   'src-referral',
    'Walk-in':    'src-walkin'
  };
  return map[source] || 'src-website';
}

/**
 * Maps a lead status to the Kanban column it belongs to.
 * Several statuses map to the "Closed" Kanban column.
 */
function getKanbanColumn(status) {
  if (status === 'New') return 'New';
  if (status === 'Contacted') return 'Contacted';
  if (status === 'Follow-up' || status === 'Viewing Scheduled' || status === 'Offer Made') return 'Follow-up';
  if (status === 'Closed' || status === 'Closed Won' || status === 'Closed Lost') return 'Closed';
  return 'New';
}

/**
 * Returns the first initial(s) of a name for the avatar.
 */
function getInitials(name) {
  var parts = name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, '').split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

/**
 * Returns a chip label and CSS class for follow-up dates.
 */
function getFollowupChip(dateStr) {
  if (!dateStr) return null;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  var diff = Math.round((date - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: 'Overdue',  cls: 'overdue' };
  if (diff <= 2) return { label: 'Due soon', cls: 'due-soon' };
  return { label: 'Follow-up ' + formatDate(dateStr), cls: 'upcoming' };
}

/**
 * Formats a date string (YYYY-MM-DD) to a readable label.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Current timestamp string for log entries.
 */
function nowTimestamp() {
  var d = new Date();
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function getSupabaseClient() {
  return window.hilltopSupabase || null;
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

function sameId(a, b) {
  return String(a) === String(b);
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

function cleanBranchName(name) {
  return name || 'Unassigned';
}

function buildLookup(rows) {
  var lookup = {};
  (rows || []).forEach(function(row) {
    lookup[String(row.id)] = row;
  });
  return lookup;
}

function formatPropertyLabel(property) {
  if (!property) return 'No property specified';
  if (property.reference_number && property.title) {
    return property.reference_number + ' — ' + property.title;
  }
  return property.title || property.reference_number || 'No property specified';
}

function shouldDisplayLeadForCurrentUser(lead, profile) {
  if (!profile) return false;

  var role = getCurrentUserRole(profile);
  if (role === 'super_admin') return true;
  if (role === 'branch_manager') return sameId(lead.branchId, profile.branch_id);
  if (role === 'agent') return lead.agentId ? sameId(lead.agentId, profile.id) : false;

  return false;
}

function getCurrentUserRole(profile) {
  profile = profile || currentStaffProfile || window.hilltopCurrentUser || {};
  return String(profile.role || '').toLowerCase().replace(/\s+/g, '_');
}

function canCreateLeadForBranch(branchId) {
  var role = getCurrentUserRole();
  if (role === 'super_admin') return true;
  if (role === 'branch_manager') return sameId(branchId, currentStaffProfile && currentStaffProfile.branch_id);
  return false;
}

function canManageLead(lead) {
  var role = getCurrentUserRole();
  if (role === 'super_admin') return true;
  if (role === 'branch_manager') return lead && sameId(lead.branchId, currentStaffProfile && currentStaffProfile.branch_id);
  return false;
}

function canChangeLeadStatus(lead) {
  var role = getCurrentUserRole();
  if (role === 'super_admin') return true;
  if (role === 'branch_manager') return lead && sameId(lead.branchId, currentStaffProfile && currentStaffProfile.branch_id);
  if (role === 'agent') return lead && lead.agentId && sameId(lead.agentId, currentStaffProfile && currentStaffProfile.id);
  return false;
}

function canAddCommunicationLog(lead) {
  return canChangeLeadStatus(lead);
}

function mapStatusForDatabase(status) {
  if (DB_ALLOWED_STATUSES.indexOf(status) !== -1) return status;
  if (status === 'Viewing Scheduled' || status === 'Offer Made') return 'Follow-up';
  if (status === 'Closed Won' || status === 'Closed Lost') return 'Closed';
  return 'New';
}

function stripStatusNote(notes) {
  return String(notes || '')
    .split('\n')
    .filter(function(line) {
      return line.indexOf(STATUS_NOTE_PREFIX) !== 0;
    })
    .join('\n')
    .trim();
}

function composeNotesForStatus(notes, status) {
  var cleaned = stripStatusNote(notes);
  var dbStatus = mapStatusForDatabase(status);
  if (status && status !== dbStatus) {
    return (cleaned ? cleaned + '\n' : '') + STATUS_NOTE_PREFIX + status;
  }
  return cleaned || null;
}

function getDisplayStatusFromRow(row) {
  var notes = String(row.notes || '');
  var line = notes.split('\n').find(function(item) {
    return item.indexOf(STATUS_NOTE_PREFIX) === 0;
  });
  if (!line) return row.status || 'New';

  var displayStatus = line.replace(STATUS_NOTE_PREFIX, '').trim();
  if (UI_STATUSES.indexOf(displayStatus) === -1) return row.status || 'New';
  if (mapStatusForDatabase(displayStatus) !== row.status) return row.status || 'New';
  return displayStatus;
}

function normalizeTextOrNull(value) {
  var text = String(value || '').trim();
  return text ? text : null;
}

function getOptionLabel(selectEl, value) {
  if (!selectEl) return '';
  var option = Array.prototype.find.call(selectEl.options, function(item) {
    return item.value === value;
  });
  return option ? option.textContent : '';
}

function getPropertyLabel(property) {
  return formatPropertyLabel(property);
}

function resolvePropertyId(value) {
  var text = String(value || '').trim();
  if (!text) return null;

  var found = leadProperties.find(function(property) {
    var label = getPropertyLabel(property);
    return sameId(property.id, text) ||
      String(property.reference_number || '').toLowerCase() === text.toLowerCase() ||
      String(property.title || '').toLowerCase() === text.toLowerCase() ||
      label.toLowerCase() === text.toLowerCase();
  });

  return found ? found.id : null;
}

function resolveBranchId(value) {
  var text = String(value || '').trim();
  if (!text) return null;
  if (branchLookupById[String(text)]) return text;

  var found = leadBranches.find(function(branch) {
    return String(branch.name || '').toLowerCase() === text.toLowerCase();
  });
  return found ? found.id : null;
}

function resolveAgentId(value) {
  var text = String(value || '').trim();
  if (!text) return null;
  if (staffLookupById[String(text)]) return text;

  var found = leadStaffUsers.find(function(staff) {
    return String(staff.full_name || '').toLowerCase() === text.toLowerCase();
  });
  return found ? found.id : null;
}

function populateSelectOptions(selectEl, items, selectedValue, placeholder, getValue, getLabel) {
  if (!selectEl) return;
  selectEl.innerHTML = '';

  var empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder || 'Select...';
  selectEl.appendChild(empty);

  items.forEach(function(item) {
    var option = document.createElement('option');
    option.value = getValue(item);
    option.textContent = getLabel(item);
    selectEl.appendChild(option);
  });

  if (selectedValue) selectEl.value = selectedValue;
}

function getAssignableStaff(branchId) {
  var role = getCurrentUserRole();
  return leadStaffUsers.filter(function(staff) {
    var staffRole = getCurrentUserRole(staff);
    var assignableRole = staffRole === 'agent' || staffRole === 'branch_manager';
    if (!staff.is_active || !assignableRole) return false;
    if (role === 'branch_manager' && !sameId(staff.branch_id, currentStaffProfile && currentStaffProfile.branch_id)) return false;
    if (branchId && !sameId(staff.branch_id, branchId)) return false;
    return true;
  });
}

function getVisibleBranchesForForm() {
  var role = getCurrentUserRole();
  if (role === 'super_admin') return leadBranches;
  if (role === 'branch_manager') {
    return leadBranches.filter(function(branch) {
      return sameId(branch.id, currentStaffProfile && currentStaffProfile.branch_id);
    });
  }
  if (currentStaffProfile && currentStaffProfile.branch_id) {
    return leadBranches.filter(function(branch) {
      return sameId(branch.id, currentStaffProfile.branch_id);
    });
  }
  return [];
}

function getVisiblePropertiesForForm(branchId) {
  return leadProperties.filter(function(property) {
    if (getCurrentUserRole() === 'branch_manager' && !sameId(property.branch_id, currentStaffProfile && currentStaffProfile.branch_id)) return false;
    if (branchId && property.branch_id && !sameId(property.branch_id, branchId)) return false;
    return true;
  });
}

function populatePropertyDatalist(branchId) {
  var input = document.getElementById('fProperty');
  if (!input) return;

  var datalist = document.getElementById('leadPropertyOptions');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'leadPropertyOptions';
    document.body.appendChild(datalist);
    input.setAttribute('list', 'leadPropertyOptions');
  }

  datalist.innerHTML = '';
  getVisiblePropertiesForForm(branchId).forEach(function(property) {
    var option = document.createElement('option');
    option.value = getPropertyLabel(property);
    datalist.appendChild(option);
  });
}

function populateLeadFormLookups(selectedBranchId, selectedAgentId) {
  var branchSelect = document.getElementById('fBranch');
  var agentSelect = document.getElementById('fAgent');

  populateSelectOptions(
    branchSelect,
    getVisibleBranchesForForm(),
    selectedBranchId || '',
    'Select...',
    function(branch) { return branch.id; },
    function(branch) { return branch.name; }
  );

  var branchId = selectedBranchId || (branchSelect ? branchSelect.value : '');
  populateSelectOptions(
    agentSelect,
    getAssignableStaff(branchId),
    selectedAgentId || '',
    'Unassigned',
    function(staff) { return staff.id; },
    function(staff) { return staff.full_name; }
  );

  populatePropertyDatalist(branchId);
}

function refreshLeadLookupControls() {
  populateLeadFormLookups('', '');
}

function buildLeadPayloadFromForm(status) {
  var branchId = resolveBranchId(document.getElementById('fBranch').value);
  var agentId = resolveAgentId(document.getElementById('fAgent').value);
  var propertyId = resolvePropertyId(document.getElementById('fProperty').value);

  return {
    client_name: document.getElementById('fName').value.trim(),
    phone: document.getElementById('fPhone').value.trim(),
    email: normalizeTextOrNull(document.getElementById('fEmail').value),
    property_id: propertyId,
    branch_id: branchId,
    assigned_agent_id: agentId,
    source: document.getElementById('fSource').value,
    status: mapStatusForDatabase(status),
    notes: composeNotesForStatus(document.getElementById('fNotes').value, status),
    next_follow_up_date: normalizeTextOrNull(document.getElementById('fFollowupDate').value)
  };
}

async function reloadLeadsAfterWrite(openPanelId) {
  await loadLeadModuleData();
  if (openPanelId) openDetailsPanel(openPanelId);
}

function isMissingCommunicationLogTableError(error) {
  if (!error) return false;
  var message = String(error.message || error.details || error.hint || '').toLowerCase();
  return error.code === '42P01' ||
    message.indexOf('lead_communication_logs') !== -1 && (
      message.indexOf('does not exist') !== -1 ||
      message.indexOf('not found') !== -1 ||
      message.indexOf('schema cache') !== -1
    );
}

function mapCommunicationLog(row, staffLookup) {
  var staff = row.staff_user_id ? staffLookup[String(row.staff_user_id)] : null;
  return {
    id: row.id,
    text: row.message || '',
    time: row.created_at || '',
    type: row.communication_type || 'Note',
    staffName: staff ? staff.full_name : 'Unknown staff',
    followupDate: row.follow_up_date || ''
  };
}

async function loadCommunicationLogsForLeads(supabase, leadIds, staffLookup) {
  if (!leadIds.length) {
    leadCommunicationLogsAvailable = true;
    return {};
  }

  var logsResult = await supabase
    .from('lead_communication_logs')
    .select('id, lead_id, staff_user_id, communication_type, message, follow_up_date, created_at')
    .in('lead_id', leadIds)
    .order('created_at', { ascending: true });

  if (logsResult.error) {
    if (isMissingCommunicationLogTableError(logsResult.error)) {
      leadCommunicationLogsAvailable = false;
      console.warn('Lead communication logs table not available yet. Run supabase/lead-communication-logs.sql.');
      return {};
    }
    throw logsResult.error;
  }

  leadCommunicationLogsAvailable = true;
  var logsByLead = {};
  (logsResult.data || []).forEach(function(row) {
    var key = String(row.lead_id);
    if (!logsByLead[key]) logsByLead[key] = [];
    logsByLead[key].push(mapCommunicationLog(row, staffLookup));
  });

  return logsByLead;
}

function renderCommunicationLogEntries(logs) {
  if (!logs || logs.length === 0) {
    return '<p style="font-size:13px;color:var(--text-light);">No log entries yet.</p>';
  }

  return logs.map(function(entry) {
    var meta = [
      entry.type || 'Note',
      entry.staffName || '',
      entry.followupDate ? 'Follow-up ' + formatDate(entry.followupDate) : ''
    ].filter(Boolean).join(' • ');

    return [
      '<div class="comm-entry">',
        '<div class="comm-dot"></div>',
        '<div class="comm-content">',
          '<div class="comm-text">' + entry.text + '</div>',
          '<div class="comm-time">' + formatLogTime(entry.time) + (meta ? ' • ' + meta : '') + '</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');
}

function formatLogTime(value) {
  if (!value) return '';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function createCommunicationLog(lead, communicationType, message, followUpDate, options) {
  options = options || {};

  if (!leadCommunicationLogsAvailable) {
    console.warn('Lead communication logs table not available yet. Run supabase/lead-communication-logs.sql.');
    if (!options.silent) showToast('Run lead-communication-logs.sql before saving communication logs.', 'error');
    return false;
  }

  if (!lead || !lead.id || !message || !communicationType) {
    if (!options.silent) showToast('Please enter a communication message.', 'error');
    return false;
  }

  if (!canAddCommunicationLog(lead)) {
    if (!options.silent) showToast('You do not have permission to update this lead.', 'error');
    return false;
  }

  var supabase = getSupabaseClient();
  if (!supabase) {
    if (!options.silent) showToast('Supabase is not available. Please refresh and try again.', 'error');
    return false;
  }

  try {
    var logPayload = {
      lead_id: lead.id,
      staff_user_id: currentStaffProfile ? currentStaffProfile.id : null,
      communication_type: communicationType,
      message: message,
      follow_up_date: normalizeTextOrNull(followUpDate)
    };

    var logResult = await supabase
      .from('lead_communication_logs')
      .insert(logPayload);

    if (logResult.error) {
      if (isMissingCommunicationLogTableError(logResult.error)) {
        leadCommunicationLogsAvailable = false;
        console.warn('Lead communication logs table not available yet. Run supabase/lead-communication-logs.sql.');
        if (!options.silent) showToast('Run lead-communication-logs.sql before saving communication logs.', 'error');
        return false;
      }
      throw logResult.error;
    }

    if (followUpDate) {
      var followupResult = await supabase
        .from('leads')
        .update({ next_follow_up_date: followUpDate })
        .eq('id', lead.id);

      if (followupResult.error) throw followupResult.error;
    }

    if (!options.silent) {
      await logActivity({
        actionType: followUpDate ? 'LEAD_FOLLOW_UP_UPDATED' : 'LEAD_COMMUNICATION_LOGGED',
        description: followUpDate
          ? 'Updated follow-up date for ' + lead.name + '.'
          : 'Added communication log for ' + lead.name + '.',
        branchId: lead.branchId || null,
        leadId: lead.id
      });
    }

    return true;
  } catch (err) {
    console.error('Communication log save failed:', err);
    if (!options.silent) showToast('Could not save communication log. Please try again.', 'error');
    return false;
  }
}

function mapSupabaseLead(row, branchLookup, staffLookup, propertyLookup) {
  var branch = row.branch_id ? branchLookup[String(row.branch_id)] : null;
  var agent = row.assigned_agent_id ? staffLookup[String(row.assigned_agent_id)] : null;
  var property = row.property_id ? propertyLookup[String(row.property_id)] : null;

  return {
    id: row.id,
    name: row.client_name || 'Unnamed Lead',
    phone: row.phone || '',
    email: row.email || '',
    property: formatPropertyLabel(property),
    propertyId: row.property_id || null,
    source: row.source || 'Website',
    branch: cleanBranchName(branch ? branch.name : ''),
    branchId: row.branch_id || null,
    agent: agent ? agent.full_name : 'Unassigned',
    agentId: row.assigned_agent_id || null,
    status: getDisplayStatusFromRow(row),
    dateEnquiry: row.created_at || '',
    followupDate: row.next_follow_up_date || '',
    followupNote: '',
    notes: stripStatusNote(row.notes),
    log: []
  };
}

function ensureStatusOption(selectEl, value) {
  if (!selectEl || !value) return;
  var exists = Array.prototype.some.call(selectEl.options, function(option) {
    return option.value === value;
  });
  if (!exists) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  }
}

function ensureSupabaseStatusOptions() {
  ensureStatusOption(statusFilter, 'Closed');
  ensureStatusOption(document.getElementById('fStatus'), 'Closed');
}

function showLeadsLoadingState() {
  updateStats([]);
  if (colNew) colNew.innerHTML = '<div class="kanban-empty">Loading leads from Supabase...</div>';
  if (colContacted) colContacted.innerHTML = '<div class="kanban-empty">Loading leads from Supabase...</div>';
  if (colFollowup) colFollowup.innerHTML = '<div class="kanban-empty">Loading leads from Supabase...</div>';
  if (colClosed) colClosed.innerHTML = '<div class="kanban-empty">Loading leads from Supabase...</div>';
}

async function loadLeadModuleData() {
  ensureSupabaseStatusOptions();

  var supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase client is unavailable. Leads module is using demo data.');
    isUsingSupabaseLeads = false;
    renderAll();
    return;
  }

  showLeadsLoadingState();

  try {
    var profile = await waitForCurrentStaffProfile();

    var branchesResult = await supabase
      .from('branches')
      .select('id, name')
      .order('name', { ascending: true });
    if (branchesResult.error) throw branchesResult.error;

    var staffResult = await supabase
      .from('staff_users')
      .select('id, full_name, role, branch_id, is_active')
      .order('full_name', { ascending: true });
    if (staffResult.error) throw staffResult.error;

    var propertiesResult = await supabase
      .from('properties')
      .select('id, reference_number, title, branch_id')
      .order('reference_number', { ascending: true });
    if (propertiesResult.error) throw propertiesResult.error;

    var leadsResult = await supabase
      .from('leads')
      .select('id, client_name, phone, email, property_id, branch_id, assigned_agent_id, source, status, notes, next_follow_up_date, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (leadsResult.error) throw leadsResult.error;

    var branchLookup = buildLookup(branchesResult.data);
    var staffLookup = buildLookup(staffResult.data);
    var propertyLookup = buildLookup(propertiesResult.data);

    leadBranches = branchesResult.data || [];
    leadStaffUsers = staffResult.data || [];
    leadProperties = propertiesResult.data || [];
    branchLookupById = branchLookup;
    staffLookupById = staffLookup;
    propertyLookupById = propertyLookup;
    currentStaffProfile = profile;
    refreshLeadLookupControls();

    var mappedLeads = (leadsResult.data || []).map(function(row) {
      return mapSupabaseLead(row, branchLookup, staffLookup, propertyLookup);
    });

    var logsByLead = await loadCommunicationLogsForLeads(
      supabase,
      mappedLeads.map(function(lead) { return lead.id; }),
      staffLookup
    );

    mappedLeads.forEach(function(lead) {
      lead.log = logsByLead[String(lead.id)] || [];
    });

    var visibleLeads = mappedLeads.filter(function(lead) {
      return shouldDisplayLeadForCurrentUser(lead, profile);
    });

    leads = visibleLeads;
    isUsingSupabaseLeads = true;
    console.info('Loaded read-only leads from Supabase:', visibleLeads.length);
    renderAll();
  } catch (err) {
    console.warn('Could not load leads from Supabase. Falling back to demo data.', err);
    isUsingSupabaseLeads = false;
    showToast('Could not load Supabase leads. Showing demo leads.', 'error');
    renderAll();
  }
}


/* ══════════════════════════════════════════════════════════════
   5. FILTER LEADS
   // Later: replace with Supabase query filters.
══════════════════════════════════════════════════════════════ */

function getFilteredLeads() {
  return leads.filter(function(l) {
    if (currentBranch !== 'all' && String(l.branch || '').toLowerCase() !== currentBranch) return false;
    if (currentStatus !== 'all' && l.status !== currentStatus) return false;
    if (currentSource !== 'all' && l.source !== currentSource) return false;
    if (currentSearch) {
      var q = currentSearch.toLowerCase();
      var match = String(l.name || '').toLowerCase().includes(q)
               || String(l.phone || '').toLowerCase().includes(q)
               || String(l.property || '').toLowerCase().includes(q)
               || String(l.agent || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}


/* ══════════════════════════════════════════════════════════════
   6. UPDATE STATS
   // Later: these counts can come from Supabase aggregate queries.
══════════════════════════════════════════════════════════════ */

function updateStats(filtered) {
  statNew.textContent       = filtered.filter(function(l){ return l.status === 'New'; }).length;
  statContacted.textContent = filtered.filter(function(l){ return l.status === 'Contacted'; }).length;
  statFollowup.textContent  = filtered.filter(function(l){
    return l.status === 'Follow-up' || l.status === 'Viewing Scheduled' || l.status === 'Offer Made';
  }).length;
  statClosed.textContent    = filtered.filter(function(l){
    return l.status === 'Closed' || l.status === 'Closed Won' || l.status === 'Closed Lost';
  }).length;
}


/* ══════════════════════════════════════════════════════════════
   7. BUILD A KANBAN LEAD CARD (HTML string)
══════════════════════════════════════════════════════════════ */

function buildLeadCard(lead) {
  var badgeClass  = getStatusBadgeClass(lead.status);
  var srcClass    = getSourceClass(lead.source);
  var initials    = getInitials(lead.name);
  var chip        = getFollowupChip(lead.followupDate);

  var chipHtml = '';
  if (chip) {
    chipHtml = '<span class="followup-chip ' + chip.cls + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
      chip.label +
      '</span>';
  }

  // Status move menu options (all statuses except current)
  var allStatuses = ['New', 'Contacted', 'Follow-up', 'Viewing Scheduled', 'Offer Made', 'Closed', 'Closed Won', 'Closed Lost'];
  var menuOptions = allStatuses
    .filter(function(s){ return s !== lead.status; })
    .map(function(s){
      return '<button class="card-move-option" data-leadid="' + lead.id + '" data-newstatus="' + s + '">' + s + '</button>';
    }).join('');

  return [
    '<div class="lead-card" data-id="' + lead.id + '">',
      '<div class="lead-card-top">',
        '<div>',
          '<div class="lead-card-name">' + lead.name + '</div>',
          '<div class="lead-card-phone">' + lead.phone + '</div>',
        '</div>',
        '<div class="lead-card-actions">',
          '<button class="card-action-btn btn-view" data-id="' + lead.id + '" title="View details">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
          '</button>',
          '<button class="card-action-btn delete btn-delete" data-id="' + lead.id + '" title="Delete lead">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
          '</button>',
        '</div>',
      '</div>',
      '<div class="lead-card-body">',
        '<div class="lead-card-row">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
          '<span>' + (lead.property || 'No property specified') + '</span>',
        '</div>',
        '<div class="lead-card-row">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
          '<span>' + lead.branch + '</span>',
          '<span class="source-badge ' + srcClass + '">' + lead.source + '</span>',
        '</div>',
      '</div>',
      '<div class="lead-card-footer">',
        '<div class="lead-card-agent">',
          '<div class="agent-avatar-sm">' + initials + '</div>',
          lead.agent,
        '</div>',
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">',
          chipHtml,
          '<div class="card-status-move">',
            '<button class="card-move-btn" data-leadid="' + lead.id + '" title="Move to stage">',
              'Move',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
            '</button>',
            '<div class="card-move-menu" id="moveMenu-' + lead.id + '">',
              menuOptions,
            '</div>',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}


/* ══════════════════════════════════════════════════════════════
   8. RENDER KANBAN BOARD
══════════════════════════════════════════════════════════════ */

function renderKanban(filtered) {
  var cols = {
    'New':       { el: colNew,       countEl: colCountNew },
    'Contacted': { el: colContacted, countEl: colCountContacted },
    'Follow-up': { el: colFollowup,  countEl: colCountFollowup },
    'Closed':    { el: colClosed,    countEl: colCountClosed }
  };

  // Clear
  Object.keys(cols).forEach(function(key) { cols[key].el.innerHTML = ''; });

  // Distribute
  filtered.forEach(function(lead) {
    var colKey = getKanbanColumn(lead.status);
    var col    = cols[colKey];
    if (!col) return;
    col.el.innerHTML += buildLeadCard(lead);
  });

  // Counts + empty states
  Object.keys(cols).forEach(function(key) {
    var col     = cols[key];
    var count   = col.el.children.length;
    col.countEl.textContent = count;
    if (count === 0) {
      col.el.innerHTML = '<div class="kanban-empty">No leads in this stage.</div>';
    }
  });
}


/* ══════════════════════════════════════════════════════════════
   9. RENDER LIST VIEW
══════════════════════════════════════════════════════════════ */

function renderList(filtered) {
  leadTableBody.innerHTML = '';

  if (filtered.length === 0) {
    document.querySelector('.lead-table-wrap').style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  document.querySelector('.lead-table-wrap').style.display = 'block';
  emptyState.style.display = 'none';

  filtered.forEach(function(lead) {
    var badgeClass = getStatusBadgeClass(lead.status);
    var srcClass   = getSourceClass(lead.source);
    var chip       = getFollowupChip(lead.followupDate);

    var chipHtml = chip
      ? '<span class="followup-chip ' + chip.cls + '" style="font-size:10px;">' + chip.label + '</span>'
      : '<span style="color:var(--text-light);font-size:12px;">—</span>';

    var row = document.createElement('tr');
    row.dataset.id = lead.id;
    row.innerHTML = [
      '<td>',
        '<div class="table-client-name">' + lead.name + '</div>',
        '<div class="table-client-phone">' + lead.phone + '</div>',
      '</td>',
      '<td>' + (lead.email ? lead.email : '<span style="color:var(--text-light);">—</span>') + '</td>',
      '<td><span class="source-badge ' + srcClass + '">' + lead.source + '</span></td>',
      '<td style="font-size:12px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + lead.property + '">' + (lead.property || '—') + '</td>',
      '<td>' + lead.branch + '</td>',
      '<td>' + lead.agent + '</td>',
      '<td>' + chipHtml + '</td>',
      '<td><span class="badge ' + badgeClass + '">' + lead.status + '</span></td>',
      '<td>',
        '<div class="table-actions">',
          '<button class="btn-view" data-id="' + lead.id + '" title="View">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
          '</button>',
          '<button class="btn-edit" data-id="' + lead.id + '" title="Edit">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
          '</button>',
          '<button class="btn-delete" data-id="' + lead.id + '" title="Delete">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
          '</button>',
        '</div>',
      '</td>'
    ].join('');

    leadTableBody.appendChild(row);
  });
}


/* ══════════════════════════════════════════════════════════════
   10. MASTER RENDER FUNCTION
══════════════════════════════════════════════════════════════ */

function renderAll() {
  var filtered = getFilteredLeads();
  updateStats(filtered);

  if (currentView === 'kanban') {
    kanbanBoard.style.display     = 'grid';
    leadListSection.style.display = 'none';
    renderKanban(filtered);
  } else {
    kanbanBoard.style.display     = 'none';
    leadListSection.style.display = 'block';
    renderList(filtered);
  }
}


/* ══════════════════════════════════════════════════════════════
   11. BRANCH FILTER
══════════════════════════════════════════════════════════════ */

document.querySelectorAll('.branch-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.branch-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    currentBranch = btn.dataset.branch;
    renderAll();
  });
});


/* ══════════════════════════════════════════════════════════════
   12. SEARCH & FILTER LISTENERS
══════════════════════════════════════════════════════════════ */

searchInput.addEventListener('input', function() {
  currentSearch = searchInput.value.trim();
  renderAll();
});

statusFilter.addEventListener('change', function() {
  currentStatus = statusFilter.value;
  renderAll();
});

sourceFilter.addEventListener('change', function() {
  currentSource = sourceFilter.value;
  renderAll();
});


/* ══════════════════════════════════════════════════════════════
   13. VIEW TOGGLE (Kanban / List)
══════════════════════════════════════════════════════════════ */

document.querySelectorAll('.view-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.view-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    currentView = btn.dataset.view;
    renderAll();
  });
});


/* ══════════════════════════════════════════════════════════════
   14. EVENT DELEGATION — KANBAN & LIST ACTIONS
══════════════════════════════════════════════════════════════ */

// Kanban board
kanbanBoard.addEventListener('click', function(e) {
  handleLeadAction(e);
});

// List table
leadTableBody.addEventListener('click', function(e) {
  handleLeadAction(e);
});

function handleLeadAction(e) {
  var target = e.target;

  // View button
  if (target.closest('.btn-view')) {
    var id = target.closest('.btn-view').dataset.id;
    openDetailsPanel(id);
    return;
  }

  // Edit button
  if (target.closest('.btn-edit')) {
    var id = target.closest('.btn-edit').dataset.id;
    openLeadModal('edit', id);
    return;
  }

  // Delete button
  if (target.closest('.btn-delete')) {
    var id = target.closest('.btn-delete').dataset.id;
    deleteLead(id);
    return;
  }

  // "Move" status dropdown button toggle
  if (target.closest('.card-move-btn')) {
    e.stopPropagation();
    var btn = target.closest('.card-move-btn');
    var leadId = btn.dataset.leadid;
    var menu = document.getElementById('moveMenu-' + leadId);
    // Close all other open menus first
    document.querySelectorAll('.card-move-menu.open').forEach(function(m) {
      if (m !== menu) m.classList.remove('open');
    });
    if (menu) menu.classList.toggle('open');
    return;
  }

  // Status move option
  if (target.classList.contains('card-move-option')) {
    var leadId    = target.dataset.leadid;
    var newStatus = target.dataset.newstatus;
    changeLeadStatus(leadId, newStatus);
    // Close the menu
    document.querySelectorAll('.card-move-menu.open').forEach(function(m){ m.classList.remove('open'); });
    return;
  }

  // Click on card body (not action buttons) → open details
  if (target.closest('.lead-card') &&
      !target.closest('.card-action-btn') &&
      !target.closest('.card-move-btn') &&
      !target.closest('.card-move-menu')) {
    var card = target.closest('.lead-card');
    if (card && card.dataset.id) {
      openDetailsPanel(card.dataset.id);
    }
  }
}

// Close move menus when clicking elsewhere
document.addEventListener('click', function(e) {
  if (!e.target.closest('.card-status-move')) {
    document.querySelectorAll('.card-move-menu.open').forEach(function(m){ m.classList.remove('open'); });
  }
});


/* ══════════════════════════════════════════════════════════════
   15. DELETE LEAD
   Phase 4B will add backend archive/delete behavior.
══════════════════════════════════════════════════════════════ */

async function deleteLead(id) {
  var lead = leads.find(function(l){ return sameId(l.id, id); });
  if (!lead) return;

  if (isUsingSupabaseLeads) {
    if (!canManageLead(lead)) {
      showToast('You do not have permission to manage this lead.', 'error');
      return;
    }

    if (!confirm('Archive lead for "' + lead.name + '"? The row will be kept for audit safety.')) return;

    var supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Supabase is not available. Please refresh and try again.', 'error');
      return;
    }

    try {
      var archivedNotes = composeNotesForStatus(lead.notes, 'Closed Lost');
      var archiveResult = await supabase
        .from('leads')
        .update({ status: 'Closed', notes: archivedNotes })
        .eq('id', id);

      if (archiveResult.error) throw archiveResult.error;

      await logActivity({
        actionType: 'LEAD_ARCHIVED',
        description: 'Archived lead for ' + lead.name + '.',
        branchId: lead.branchId || null,
        leadId: id
      });

      if (sameId(activePanelId, id)) closeDetailsPanel();
      await reloadLeadsAfterWrite();
      showToast('Lead archived for audit safety.', 'success');
    } catch (err) {
      console.error('Lead archive failed:', err);
      showToast('Could not archive lead. Please try again.', 'error');
    }
    return;
  }

  if (!confirm('Archive lead for "' + lead.name + '"?')) return;

  lead.status = 'Closed Lost';
  lead.notes = stripStatusNote(lead.notes);
  lead.log.push({ text: 'Lead archived for audit safety.', time: nowTimestamp() });
  if (sameId(activePanelId, id)) openDetailsPanel(id);
  renderAll();
  showToast('Lead archived for audit safety.', 'success');
}


/* ══════════════════════════════════════════════════════════════
   16. CHANGE LEAD STATUS
   Phase 4B will persist backend status changes.
══════════════════════════════════════════════════════════════ */

async function changeLeadStatus(id, newStatus) {
  var lead = leads.find(function(l){ return sameId(l.id, id); });
  if (!lead) return;

  if (isUsingSupabaseLeads) {
    if (!canChangeLeadStatus(lead)) {
      showToast('You do not have permission to manage this lead.', 'error');
      return;
    }

    var supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Supabase is not available. Please refresh and try again.', 'error');
      return;
    }

    try {
      var statusPayload = {
        status: mapStatusForDatabase(newStatus),
        notes: composeNotesForStatus(lead.notes, newStatus)
      };

      var statusResult = await supabase
        .from('leads')
        .update(statusPayload)
        .eq('id', id);

      if (statusResult.error) throw statusResult.error;

      if (leadCommunicationLogsAvailable) {
        await createCommunicationLog(
          lead,
          'Status Change',
          'Status changed from "' + lead.status + '" to "' + newStatus + '".',
          '',
          { silent: true }
        );
      }

      await logActivity({
        actionType: 'LEAD_STATUS_UPDATED',
        description: 'Changed lead status to ' + newStatus + '.',
        branchId: lead.branchId || null,
        leadId: id
      });

      var shouldReopenPanel = sameId(activePanelId, id);
      await reloadLeadsAfterWrite(shouldReopenPanel ? id : null);
      showToast('Lead status updated.', 'success');
    } catch (err) {
      console.error('Lead status update failed:', err);
      showToast('Could not update lead status. Please try again.', 'error');
    }
    return;
  }

  var oldStatus = lead.status;
  lead.status = newStatus;

  // Auto-log the status change
  lead.log.push({
    text: 'Status changed from "' + oldStatus + '" to "' + newStatus + '".',
    time: nowTimestamp()
  });

  // If details panel is open for this lead, refresh it
  if (sameId(activePanelId, id)) openDetailsPanel(id);

  renderAll();
  showToast(isUsingSupabaseLeads ? 'Status changed locally. Supabase updates come in Phase 4B.' : 'Moved to ' + newStatus, 'success');
}


/* ══════════════════════════════════════════════════════════════
   17. LEAD DETAILS PANEL
══════════════════════════════════════════════════════════════ */

function openDetailsPanel(id) {
  var lead = leads.find(function(l){ return sameId(l.id, id); });
  if (!lead) return;

  activePanelId = id;

  detailsPanelTitle.textContent = lead.name;
  btnEditFromPanel.onclick = function() { openLeadModal('edit', id); };

  var badgeClass = getStatusBadgeClass(lead.status);
  var srcClass   = getSourceClass(lead.source);
  var chip       = getFollowupChip(lead.followupDate);

  var chipHtml = chip
    ? '<span class="followup-chip ' + chip.cls + '">' + chip.label + '</span>'
    : '';

  // Build log HTML
  var logHtml = renderCommunicationLogEntries(lead.log);

  detailsBody.innerHTML = [
    // Status + source row
    '<div>',
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">',
        '<span class="badge ' + badgeClass + '">' + lead.status + '</span>',
        '<span class="source-badge ' + srcClass + '">' + lead.source + '</span>',
        chipHtml,
      '</div>',
    '</div>',

    // Info grid
    '<div>',
      '<div class="details-section-title">Client &amp; Enquiry</div>',
      '<div class="details-info-grid">',
        '<div class="details-info-item"><div class="details-info-label">Phone</div><div class="details-info-value">' + lead.phone + '</div></div>',
        '<div class="details-info-item"><div class="details-info-label">Email</div><div class="details-info-value">' + (lead.email || '—') + '</div></div>',
        '<div class="details-info-item"><div class="details-info-label">Branch</div><div class="details-info-value">' + lead.branch + '</div></div>',
        '<div class="details-info-item"><div class="details-info-label">Assigned Agent</div><div class="details-info-value">' + lead.agent + '</div></div>',
        '<div class="details-info-item"><div class="details-info-label">Date of Enquiry</div><div class="details-info-value">' + formatDate(lead.dateEnquiry) + '</div></div>',
        '<div class="details-info-item"><div class="details-info-label">Next Follow-up</div><div class="details-info-value">' + (lead.followupDate ? formatDate(lead.followupDate) : '—') + '</div></div>',
        '<div class="details-info-item" style="grid-column:1/-1;"><div class="details-info-label">Property Enquired</div><div class="details-info-value">' + (lead.property || '—') + '</div></div>',
      '</div>',
    '</div>',

    // Follow-up note
    (lead.followupNote ? [
      '<div>',
        '<div class="details-section-title">Follow-up Note</div>',
        '<div class="details-notes">' + lead.followupNote + '</div>',
      '</div>'
    ].join('') : ''),

    // General notes
    '<div>',
      '<div class="details-section-title">Notes</div>',
      '<div class="details-notes">' + (lead.notes || 'No notes added.') + '</div>',
    '</div>',

    // Communication log
    '<div>',
      '<div class="details-section-title">Communication Log</div>',
      '<div class="comm-log" id="commLog">' + logHtml + '</div>',
      '<div class="add-log-wrap" style="margin-top:14px;">',
        '<select class="log-input" id="logType" aria-label="Communication type">',
          '<option value="Note">Note</option>',
          '<option value="Call">Call</option>',
          '<option value="WhatsApp">WhatsApp</option>',
          '<option value="Email">Email</option>',
          '<option value="Meeting">Meeting</option>',
          '<option value="Follow-up">Follow-up</option>',
        '</select>',
        '<input type="text" class="log-input" id="logInput" placeholder="Add a log entry… e.g. Called client at 14:00" />',
        '<input type="date" class="log-input" id="logFollowupDate" aria-label="Follow-up date" />',
        '<button class="action-btn primary small" id="btnAddLog" data-leadid="' + lead.id + '">Add</button>',
      '</div>',
    '</div>',

    // Quick status change from panel
    '<div>',
      '<div class="details-section-title">Quick Status Update</div>',
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">',
        buildQuickStatusButtons(lead),
      '</div>',
    '</div>',

  ].join('');

  // Bind log add button
  document.getElementById('btnAddLog').addEventListener('click', function() {
    addLogEntry(lead.id);
  });
  document.getElementById('logInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') addLogEntry(lead.id);
  });

  // Show panel
  detailsPanel.style.display = 'flex';
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      detailsPanel.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function buildQuickStatusButtons(lead) {
  var statuses = ['New', 'Contacted', 'Follow-up', 'Viewing Scheduled', 'Offer Made', 'Closed', 'Closed Won', 'Closed Lost'];
  return statuses.map(function(s) {
    var active = s === lead.status;
    return '<button class="action-btn ' + (active ? 'primary' : 'outline') + ' small" style="font-size:11px;padding:5px 11px;" ' +
           (active ? 'disabled' : 'data-quickstatus="' + s + '" data-leadid="' + lead.id + '"') +
           '>' + s + '</button>';
  }).join('');
}

detailsBody.addEventListener('click', function(e) {
  if (e.target.dataset.quickstatus) {
    changeLeadStatus(e.target.dataset.leadid, e.target.dataset.quickstatus);
  }
});

function closeDetailsPanel() {
  detailsPanel.classList.remove('open');
  activePanelId = null;
  // Only remove overlay if modal is also closed
  if (!leadModal.classList.contains('open')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  setTimeout(function() { detailsPanel.style.display = 'none'; }, 300);
}

detailsClose.addEventListener('click', closeDetailsPanel);


/* ══════════════════════════════════════════════════════════════
   18. COMMUNICATION LOG — ADD ENTRY
   Phase 4C will persist communication logs.
══════════════════════════════════════════════════════════════ */

async function addLogEntry(leadId) {
  var input  = document.getElementById('logInput');
  var typeEl = document.getElementById('logType');
  var followupEl = document.getElementById('logFollowupDate');
  var text   = input ? input.value.trim() : '';
  if (!text) { showToast('Please enter a log message', 'error'); return; }

  var lead = leads.find(function(l){ return sameId(l.id, leadId); });
  if (!lead) return;

  var communicationType = typeEl ? typeEl.value : 'Note';
  var followUpDate = followupEl ? followupEl.value : '';

  if (isUsingSupabaseLeads) {
    var saved = await createCommunicationLog(lead, communicationType, text, followUpDate);
    if (!saved) return;

    input.value = '';
    if (followupEl) followupEl.value = '';
    await reloadLeadsAfterWrite(lead.id);
    showToast(followUpDate ? 'Follow-up saved.' : 'Communication log saved.', 'success');
    return;
  }

  lead.log.push({
    text: text,
    time: nowTimestamp(),
    type: communicationType,
    staffName: currentStaffProfile ? currentStaffProfile.full_name : 'Demo user',
    followupDate: followUpDate
  });
  if (followUpDate) lead.followupDate = followUpDate;
  input.value = '';
  if (followupEl) followupEl.value = '';

  // Refresh log section in panel without full re-open
  var commLog = document.getElementById('commLog');
  if (commLog) {
    commLog.innerHTML = renderCommunicationLogEntries(lead.log);
    commLog.lastElementChild.scrollIntoView({ behavior: 'smooth' });
  }

  showToast(followUpDate ? 'Follow-up saved.' : 'Communication log saved.', 'success');
}


/* ══════════════════════════════════════════════════════════════
   19. ADD / EDIT LEAD MODAL
══════════════════════════════════════════════════════════════ */

function openLeadModal(mode, id) {
  mode = mode || 'add';

  // Switch to first tab
  switchModalTab('client');

  if (mode === 'edit' && id) {
    var lead = leads.find(function(l){ return sameId(l.id, id); });
    if (!lead) return;

    if (isUsingSupabaseLeads && !canManageLead(lead)) {
      showToast('You do not have permission to manage this lead.', 'error');
      return;
    }

    leadModalTitle.textContent = 'Edit Lead';
    editLeadIdField.value = lead.id;
    populateLeadFormLookups(lead.branchId || '', lead.agentId || '');

    document.getElementById('fName').value         = lead.name;
    document.getElementById('fPhone').value        = lead.phone;
    document.getElementById('fEmail').value        = lead.email;
    document.getElementById('fProperty').value     = lead.property;
    document.getElementById('fSource').value       = lead.source;
    document.getElementById('fBranch').value       = lead.branchId || lead.branch;
    document.getElementById('fAgent').value        = lead.agentId || '';
    document.getElementById('fStatus').value       = lead.status;
    document.getElementById('fFollowupDate').value = lead.followupDate;
    document.getElementById('fFollowupNote').value = lead.followupNote;
    document.getElementById('fNotes').value        = lead.notes;

  } else {
    var defaultBranchId = '';
    if (isUsingSupabaseLeads) {
      var visibleBranches = getVisibleBranchesForForm();
      defaultBranchId = visibleBranches.length === 1 ? visibleBranches[0].id : '';

      if (!canCreateLeadForBranch(defaultBranchId || (currentStaffProfile && currentStaffProfile.branch_id))) {
        showToast('You do not have permission to manage this lead.', 'error');
        return;
      }
    }

    leadModalTitle.textContent = 'Add New Lead';
    editLeadIdField.value = '';
    populateLeadFormLookups(defaultBranchId, '');
    leadForm.reset();
    if (defaultBranchId) document.getElementById('fBranch').value = defaultBranchId;
    // Set default date to today
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('fFollowupDate').value = today;
  }

  // Show modal
  leadModal.style.display = 'flex';
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      leadModal.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLeadModal() {
  leadModal.classList.remove('open');
  if (!detailsPanel.classList.contains('open')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  setTimeout(function() { leadModal.style.display = 'none'; }, 300);
}

btnAddLead.addEventListener('click', function() { openLeadModal('add'); });
if (emptyAddBtn) {
  emptyAddBtn.addEventListener('click', function() { openLeadModal('add'); });
}
modalClose.addEventListener('click', closeLeadModal);
modalCancelBtn.addEventListener('click', closeLeadModal);

// Overlay click — closes whichever is topmost
modalOverlay.addEventListener('click', function() {
  if (leadModal.classList.contains('open')) {
    closeLeadModal();
  } else if (detailsPanel.classList.contains('open')) {
    closeDetailsPanel();
  } else {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Modal tabs
document.querySelectorAll('.modal-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    switchModalTab(tab.dataset.tab);
  });
});

function switchModalTab(tabName) {
  document.querySelectorAll('.modal-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('#leadModal .tab-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'tab-' + tabName);
  });
}

var branchField = document.getElementById('fBranch');
if (branchField) {
  branchField.addEventListener('change', function() {
    populateLeadFormLookups(branchField.value, '');
  });
}


/* ══════════════════════════════════════════════════════════════
   20. FORM SAVE (ADD OR EDIT)
   Phase 4B will persist lead create/update actions.
══════════════════════════════════════════════════════════════ */

leadForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validate required fields
  var requiredFields = ['fName', 'fPhone', 'fSource', 'fBranch', 'fStatus'];
  var valid = true;
  requiredFields.forEach(function(fieldId) {
    var el = document.getElementById(fieldId);
    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });

  if (!valid) {
    switchModalTab('client');
    showToast('Please fill in all required fields', 'error');
    return;
  }

  var formData = {
    name:         document.getElementById('fName').value.trim(),
    phone:        document.getElementById('fPhone').value.trim(),
    email:        document.getElementById('fEmail').value.trim(),
    property:     document.getElementById('fProperty').value.trim(),
    source:       document.getElementById('fSource').value,
    branch:       document.getElementById('fBranch').value,
    agent:        document.getElementById('fAgent').value,
    status:       document.getElementById('fStatus').value,
    followupDate: document.getElementById('fFollowupDate').value,
    followupNote: document.getElementById('fFollowupNote').value.trim(),
    notes:        document.getElementById('fNotes').value.trim(),
    dateEnquiry:  new Date().toISOString().slice(0, 10)
  };

  var editId = editLeadIdField.value;

  if (isUsingSupabaseLeads) {
    var payload = buildLeadPayloadFromForm(formData.status);

    if (!payload.client_name || !payload.phone || !payload.source || !payload.branch_id || !payload.status) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (document.getElementById('fProperty').value.trim() && !payload.property_id) {
      showToast('Select an existing property or leave the property field blank.', 'error');
      return;
    }

    if (payload.assigned_agent_id) {
      var selectedAgent = staffLookupById[String(payload.assigned_agent_id)];
      if (selectedAgent && payload.branch_id && !sameId(selectedAgent.branch_id, payload.branch_id)) {
        showToast('Assigned staff must belong to the selected branch.', 'error');
        return;
      }
    }

    var supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Supabase is not available. Please refresh and try again.', 'error');
      return;
    }

    try {
      if (editId) {
        var existingLead = leads.find(function(l){ return sameId(l.id, editId); });
        if (!existingLead) return;
        if (!canManageLead(existingLead)) {
          showToast('You do not have permission to manage this lead.', 'error');
          return;
        }

        var updateResult = await supabase
          .from('leads')
          .update(payload)
          .eq('id', editId);

        if (updateResult.error) throw updateResult.error;

        var assignedAgentChanged = !sameId(existingLead.agentId || '', payload.assigned_agent_id || '');
        var statusChanged = mapStatusForDatabase(existingLead.status) !== payload.status;
        var updatedAgent = payload.assigned_agent_id ? staffLookupById[String(payload.assigned_agent_id)] : null;
        var activityType = statusChanged
          ? 'LEAD_STATUS_UPDATED'
          : (assignedAgentChanged ? 'LEAD_ASSIGNED' : 'LEAD_UPDATED');
        var activityDescription = statusChanged
          ? 'Changed lead status to ' + formData.status + '.'
          : (assignedAgentChanged
              ? 'Assigned lead to ' + (updatedAgent ? updatedAgent.full_name : 'Unassigned') + '.'
              : 'Updated lead for ' + payload.client_name + '.');
        await logActivity({
          actionType: activityType,
          description: activityDescription,
          branchId: payload.branch_id || existingLead.branchId || null,
          leadId: editId
        });

        closeLeadModal();
        await reloadLeadsAfterWrite(sameId(activePanelId, editId) ? editId : null);
        showToast('Lead updated successfully.', 'success');
      } else {
        if (!canCreateLeadForBranch(payload.branch_id)) {
          showToast('You do not have permission to manage this lead.', 'error');
          return;
        }

        var insertResult = await supabase
          .from('leads')
          .insert(payload)
          .select('id')
          .single();

        if (insertResult.error) throw insertResult.error;

        await logActivity({
          actionType: 'LEAD_CREATED',
          description: 'Created lead for ' + payload.client_name + '.',
          branchId: payload.branch_id || null,
          leadId: insertResult.data ? insertResult.data.id : null
        });

        closeLeadModal();
        await reloadLeadsAfterWrite();
        showToast('Lead created successfully.', 'success');
      }
    } catch (err) {
      console.error('Lead save failed:', err);
      showToast('Could not save lead. Please check the fields and try again.', 'error');
    }
    return;
  }

  if (editId) {
    // EDIT existing lead
    var idx = leads.findIndex(function(l){ return sameId(l.id, editId); });
    if (idx > -1) {
      var existingLog = leads[idx].log || [];
      formData.id  = editId;
      formData.propertyId = leads[idx].propertyId || null;
      formData.branchId = leads[idx].branchId || null;
      formData.agentId = leads[idx].agentId || null;
      formData.dateEnquiry = leads[idx].dateEnquiry;
      formData.log = existingLog;
      // Log the edit
      formData.log.push({ text: 'Lead details updated.', time: nowTimestamp() });
      leads[idx] = formData;
      showToast(isUsingSupabaseLeads ? 'Lead updated locally. Supabase save comes in Phase 4B.' : 'Lead updated successfully', 'success');
    }
  } else {
    // ADD new lead
    formData.id  = nextLeadId++;
    formData.log = [{ text: 'Lead created.', time: nowTimestamp() }];
    leads.push(formData);
    showToast(isUsingSupabaseLeads ? 'Lead added locally. Supabase create comes in Phase 4B.' : 'Lead added successfully', 'success');
  }

  closeLeadModal();
  // If panel was open for the edited lead, refresh it
  if (editId && sameId(activePanelId, editId)) {
    openDetailsPanel(editId);
  }
  renderAll();
});


/* ══════════════════════════════════════════════════════════════
   21. MOBILE SIDEBAR TOGGLE
══════════════════════════════════════════════════════════════ */

if (hamburgerBtn && sidebar && sidebarOverlay) {
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    if (!leadModal.classList.contains('open') && !detailsPanel.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
  hamburgerBtn.addEventListener('click', function() {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay.addEventListener('click', function() {
    if (sidebar.classList.contains('open')) closeSidebar();
  });
}


/* ══════════════════════════════════════════════════════════════
   22. TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════════ */

var toastTimer;
function showToast(message, type) {
  type = type || 'success';
  toastEl.textContent = message;
  toastEl.className   = 'toast ' + type;
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      toastEl.classList.add('show');
    });
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toastEl.classList.remove('show');
  }, 3000);
}


/* ══════════════════════════════════════════════════════════════
   23. INITIAL RENDER
══════════════════════════════════════════════════════════════ */

loadLeadModuleData();
