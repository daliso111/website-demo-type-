/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - ADMIN DASHBOARD
   Phase 5A: read-only Supabase stats and recent activity.
   ============================================================ */


/* -- 1. DEMO FALLBACK DATA ------------------------------------ */

const demoStatsData = {
  all: { activeProperties: 48, newLeads: 17, sold: 9, rented: 14 },
  lusaka: { activeProperties: 30, newLeads: 11, sold: 6, rented: 8 },
  livingstone: { activeProperties: 18, newLeads: 6, sold: 3, rented: 6 }
};

const demoActivityData = {
  all: [
    { type: 'enquiry', text: 'New enquiry received for 3-bed house in Lusaka', time: '10 minutes ago', branch: 'Lusaka' },
    { type: 'status', text: 'Agent John updated property status to Sold - HT-LSK-011', time: '42 minutes ago', branch: 'Lusaka' },
    { type: 'property', text: 'Livingstone Branch added a new rental apartment - HT-LVN-007', time: '1 hour ago', branch: 'Livingstone' },
    { type: 'followup', text: 'Follow-up scheduled for client Mary Banda', time: '2 hours ago', branch: 'Lusaka' }
  ],
  lusaka: [
    { type: 'enquiry', text: 'New enquiry received for 3-bed house in Lusaka', time: '10 minutes ago', branch: 'Lusaka' },
    { type: 'status', text: 'Agent John updated property status to Sold - HT-LSK-011', time: '42 minutes ago', branch: 'Lusaka' }
  ],
  livingstone: [
    { type: 'property', text: 'Livingstone Branch added a new rental apartment - HT-LVN-007', time: '1 hour ago', branch: 'Livingstone' }
  ]
};

const branchLabels = {
  all: 'All Branches',
  lusaka: 'Lusaka Branch',
  livingstone: 'Livingstone Branch'
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
  const result = await window.HilltopWorkspace.scope(
    supabase.from('branches').select('id, name')
  ).order('name', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardProperties(supabase) {
  const result = await window.HilltopWorkspace.scope(supabase
    .from('properties')
    .select('id, reference_number, title, status, branch_id, assigned_agent_id, created_at, updated_at'))
    .order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardLeads(supabase) {
  const result = await window.HilltopWorkspace.scope(supabase
    .from('leads')
    .select('id, client_name, status, branch_id, assigned_agent_id, property_id, created_at, updated_at'))
    .order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardStaff(supabase) {
  const result = await window.HilltopWorkspace.scope(supabase
    .from('staff_users')
    .select('id, full_name, role, branch_id, is_active'))
    .order('full_name', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardActivity(supabase) {
  const result = await window.HilltopWorkspace.scope(supabase
    .from('activity_logs')
    .select('id, action_type, description, branch_id, property_id, lead_id, staff_user_id, created_at'))
    .order('created_at', { ascending: false })
    .limit(25);
  if (result.error) throw result.error;
  return result.data || [];
}

async function loadDashboardCommunicationLogs(supabase) {
  const result = await window.HilltopWorkspace.scope(supabase
    .from('lead_communication_logs')
    .select('id, lead_id, communication_type, created_at'))
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
    await window.HilltopWorkspace.ready();
    const loadingWorkspaceId = window.HilltopWorkspace.getActive().id;
    dashboardCurrentUser = await waitForCurrentStaffProfile();
    const results = await Promise.all([
      loadDashboardBranches(supabase),
      loadDashboardProperties(supabase),
      loadDashboardLeads(supabase),
      loadDashboardStaff(supabase),
      loadDashboardActivity(supabase),
      loadDashboardCommunicationLogs(supabase)
    ]);

    if (!window.HilltopWorkspace.getActive() || window.HilltopWorkspace.getActive().id !== loadingWorkspaceId) return;

    dashboardBranches = results[0];
    dashboardProperties = results[1];
    dashboardLeads = results[2];
    dashboardStaff = results[3];
    dashboardActivityLogs = results[4];
    dashboardCommunicationLogs = results[5];
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

window.addEventListener('hilltop:workspace-changing', function() {
  dashboardBranches = [];
  dashboardProperties = [];
  dashboardLeads = [];
  dashboardStaff = [];
  dashboardActivityLogs = [];
  dashboardCommunicationLogs = [];
  showLoadingDashboard();
});

window.addEventListener('hilltop:workspace-changed', function() {
  currentBranch = 'All Branches';
  loadDashboardData();
});

loadDashboardData();
