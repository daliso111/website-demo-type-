/* ============================================================
   HILLTOP PROPERTIES ZAMBIA — MODULE 4: STAFF & BRANCH MANAGEMENT
   staff.js
   ============================================================
   Phase 2A: read-only Supabase loading.
   Phase 2B: staff and branch create/update/deactivate actions.
   ============================================================ */


/* ══════════════════════════════════════════════════════════════
   1. SAMPLE BRANCH DATA
   Development fallback. Supabase branches are loaded at runtime.
══════════════════════════════════════════════════════════════ */

var branches = [
  {
    id: 1,
    name: 'Lusaka Branch',
    address: '14 Cairo Road, Lusaka Central, Zambia',
    phone: '+260 211 234 567',
    email: 'lusaka@hilltopzm.com',
    manager: 'John Phiri',
    staffCount: 3,
    activeProperties: 12,
    openLeads: 6
  },
  {
    id: 2,
    name: 'Livingstone Branch',
    address: '7 Mosi-oa-Tunya Road, Livingstone, Zambia',
    phone: '+260 213 456 789',
    email: 'livingstone@hilltopzm.com',
    manager: 'David Mwale',
    staffCount: 2,
    activeProperties: 7,
    openLeads: 4
  }
];


/* ══════════════════════════════════════════════════════════════
   2. SAMPLE STAFF DATA
   Development fallback. Supabase staff profiles are loaded at runtime.
   auth_user_id is never written by this module.
══════════════════════════════════════════════════════════════ */

var staffList = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@hilltopzm.com',
    phone: '+260 977 000 001',
    role: 'Super Admin',
    branch: 'Both',
    jobTitle: 'System Administrator',
    status: 'Active',
    assignedProperties: 0,
    assignedLeads: 0,
    lastActivity: '2024-06-04',
    notes: 'Primary system administrator. Full access to all modules and settings.'
  },
  {
    id: 2,
    name: 'John Phiri',
    email: 'john.phiri@hilltopzm.com',
    phone: '+260 977 111 222',
    role: 'Branch Manager',
    branch: 'Lusaka',
    jobTitle: 'Lusaka Branch Manager',
    status: 'Active',
    assignedProperties: 8,
    assignedLeads: 4,
    lastActivity: '2024-06-04',
    notes: 'Managing Lusaka branch since January 2023. Strong sales record.'
  },
  {
    id: 3,
    name: 'Mary Banda',
    email: 'mary.banda@hilltopzm.com',
    phone: '+260 966 333 444',
    role: 'Agent',
    branch: 'Lusaka',
    jobTitle: 'Senior Property Agent',
    status: 'Active',
    assignedProperties: 4,
    assignedLeads: 3,
    lastActivity: '2024-06-03',
    notes: 'Specialises in residential lettings across Lusaka North.'
  },
  {
    id: 4,
    name: 'David Mwale',
    email: 'david.mwale@hilltopzm.com',
    phone: '+260 213 555 666',
    role: 'Branch Manager',
    branch: 'Livingstone',
    jobTitle: 'Livingstone Branch Manager',
    status: 'Active',
    assignedProperties: 5,
    assignedLeads: 3,
    lastActivity: '2024-06-02',
    notes: 'Experienced in tourism property and lodge sales.'
  },
  {
    id: 5,
    name: 'Grace Mbewe',
    email: 'grace.mbewe@hilltopzm.com',
    phone: '+260 976 777 888',
    role: 'Agent',
    branch: 'Livingstone',
    jobTitle: 'Property Agent',
    status: 'Active',
    assignedProperties: 2,
    assignedLeads: 4,
    lastActivity: '2024-06-03',
    notes: 'Focuses on tourist lodge and commercial property enquiries in Livingstone.'
  }
];

// Running ID counter for frontend-only new staff
var nextStaffId = 6;
var isUsingSupabaseData = false;

// Sample leads for the assignment panel (mirrors leads.js data)
var sampleLeads = [
  { id: 1, name: 'Mr. Chanda Mutale', branch: 'Lusaka' },
  { id: 2, name: 'Mrs. Grace Tembo', branch: 'Lusaka' },
  { id: 3, name: 'Mr. Isaac Banda', branch: 'Lusaka' },
  { id: 5, name: 'Ms. Thandiwe Nkosi', branch: 'Lusaka' },
  { id: 7, name: 'Mr. Emmanuel Phiri', branch: 'Livingstone' },
  { id: 8, name: 'Ms. Charity Mbewe', branch: 'Livingstone' }
];


/* ══════════════════════════════════════════════════════════════
   3. DOM REFERENCES
══════════════════════════════════════════════════════════════ */

var hamburgerBtn        = document.getElementById('hamburger');
var sidebar             = document.getElementById('sidebar');
var sidebarOverlay      = document.getElementById('sidebarOverlay');
var modalOverlay        = document.getElementById('modalOverlay');
var toastEl             = document.getElementById('toast');

// Stats
var statTotalStaff      = document.getElementById('statTotalStaff');
var statActiveAgents    = document.getElementById('statActiveAgents');
var statManagers        = document.getElementById('statManagers');
var statBranches        = document.getElementById('statBranches');

// Branch section
var branchCardsGrid     = document.getElementById('branchCardsGrid');
var btnAddBranch        = document.getElementById('btnAddBranch');

// Staff section
var staffTableBody      = document.getElementById('staffTableBody');
var staffEmptyState     = document.getElementById('staffEmptyState');
var staffSearch         = document.getElementById('staffSearch');
var roleFilter          = document.getElementById('roleFilter');
var staffBranchFilter   = document.getElementById('staffBranchFilter');
var statusFilter        = document.getElementById('statusFilter');
var btnAddStaff         = document.getElementById('btnAddStaff');
var emptyAddStaffBtn    = document.getElementById('emptyAddStaffBtn');

// Staff modal
var staffModal          = document.getElementById('staffModal');
var staffModalTitle     = document.getElementById('staffModalTitle');
var staffForm           = document.getElementById('staffForm');
var editStaffIdField    = document.getElementById('editStaffId');
var staffModalClose     = document.getElementById('staffModalClose');
var staffModalCancelBtn = document.getElementById('staffModalCancelBtn');

// Staff details panel
var staffDetailsPanel      = document.getElementById('staffDetailsPanel');
var staffDetailsPanelTitle = document.getElementById('staffDetailsPanelTitle');
var staffDetailsBody       = document.getElementById('staffDetailsBody');
var staffDetailsClose      = document.getElementById('staffDetailsClose');
var btnEditFromPanel       = document.getElementById('btnEditFromPanel');

// Branch details modal
var branchDetailsModal  = document.getElementById('branchDetailsModal');
var branchModalTitle    = document.getElementById('branchModalTitle');
var branchModalSubtitle = document.getElementById('branchModalSubtitle');
var branchModalBody     = document.getElementById('branchModalBody');
var branchModalClose    = document.getElementById('branchModalClose');

// Branch form modal
var branchFormModal       = document.getElementById('branchFormModal');
var branchFormModalTitle  = document.getElementById('branchFormModalTitle');
var branchForm            = document.getElementById('branchForm');
var editBranchIdField     = document.getElementById('editBranchId');
var branchFormModalClose  = document.getElementById('branchFormModalClose');
var branchFormCancelBtn   = document.getElementById('branchFormCancelBtn');

// Lead assignment panel
var assignLeadSelect  = document.getElementById('assignLead');
var assignAgentSelect = document.getElementById('assignAgent');
var btnAssign         = document.getElementById('btnAssign');


/* ══════════════════════════════════════════════════════════════
   4. FILTER STATE
══════════════════════════════════════════════════════════════ */

var currentBranch       = 'all';   // header branch filter
var currentSearch       = '';
var currentRoleFilter   = 'all';
var currentBranchFilter = 'all';   // staff table branch filter
var currentStatusFilter = 'all';
var activePanelStaffId  = null;


/* ══════════════════════════════════════════════════════════════
   5. HELPERS
══════════════════════════════════════════════════════════════ */

function getInitials(name) {
  var parts = name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, '').split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getRoleBadgeClass(role) {
  if (role === 'Super Admin') return 'role-badge-superadmin';
  if (role === 'Branch Manager') return 'role-badge-manager';
  return 'role-badge-agent';
}

function getAvatarClass(role) {
  if (role === 'Super Admin') return 'superadmin';
  if (role === 'Branch Manager') return 'manager';
  return 'agent';
}

function dbRoleToLabel(role) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'branch_manager') return 'Branch Manager';
  if (role === 'agent') return 'Agent';
  return role || 'Agent';
}

function labelRoleToDb(role) {
  if (role === 'Super Admin' || role === 'super_admin') return 'super_admin';
  if (role === 'Branch Manager' || role === 'branch_manager') return 'branch_manager';
  if (role === 'Agent' || role === 'agent') return 'agent';
  return '';
}

function normalizeRole(role) {
  return dbRoleToLabel(role);
}

function isCurrentUserSuperAdmin() {
  var profile = window.hilltopCurrentUser || {};
  return profile.role === 'super_admin' || profile.role === 'Super Admin';
}

function requireSuperAdmin() {
  if (isCurrentUserSuperAdmin()) return true;
  showToast('Only Super Admin can manage staff and branches.', 'error');
  return false;
}

function defaultJobTitleForRole(role, branchName) {
  if (role === 'Super Admin') return 'System Administrator';
  if (role === 'Branch Manager') return (branchName && branchName !== 'Unassigned' ? branchName + ' ' : '') + 'Branch Manager';
  return 'Property Agent';
}

function cleanBranchName(name) {
  if (!name) return 'Unassigned';
  return name.replace(/\s+Branch$/i, '').trim();
}

function getBranchById(branchId) {
  return branches.find(function(branch) {
    return String(branch.id) === String(branchId);
  });
}

function mapSupabaseStaff(record, branchLookup) {
  var branch = record.branch_id ? branchLookup[String(record.branch_id)] : null;
  var branchName = branch ? cleanBranchName(branch.name) : 'Unassigned';
  var role = normalizeRole(record.role);

  return {
    id: record.id,
    name: record.full_name,
    email: record.email,
    phone: record.phone || 'Not provided',
    role: role,
    branch: branchName,
    branchId: record.branch_id || null,
    authUserId: record.auth_user_id || null,
    jobTitle: defaultJobTitleForRole(role, branchName),
    status: record.is_active ? 'Active' : 'Inactive',
    assignedProperties: 0,
    assignedLeads: 0,
    lastActivity: record.created_at || '',
    notes: ''
  };
}

function deriveBranchManager(branchId, mappedStaff) {
  var manager = mappedStaff.find(function(staff) {
    return staff.role === 'Branch Manager' && String(staff.branchId) === String(branchId);
  });

  return manager ? manager.name : 'Not assigned';
}

function mapSupabaseBranch(record, mappedStaff) {
  var branchStaff = mappedStaff.filter(function(staff) {
    return String(staff.branchId) === String(record.id);
  });

  return {
    id: record.id,
    name: record.name,
    address: record.address || 'Address not provided',
    phone: record.contact_number || 'Phone not provided',
    email: 'Not configured',
    manager: deriveBranchManager(record.id, mappedStaff),
    staffCount: branchStaff.length,
    activeProperties: 0,
    openLeads: 0,
    createdAt: record.created_at || ''
  };
}

function findBranchIdForDisplayValue(value) {
  if (!value || value === 'Both' || value === 'Unassigned') return null;

  var matchById = branches.find(function(branch) {
    return String(branch.id) === String(value);
  });
  if (matchById) return matchById.id;

  var matchByName = branches.find(function(branch) {
    return cleanBranchName(branch.name) === cleanBranchName(value);
  });
  return matchByName ? matchByName.id : null;
}

function populateBranchControls() {
  var selectedStaffBranch = staffBranchFilter.value || currentBranchFilter;
  var selectedFormBranch = document.getElementById('fBranch').value;

  staffBranchFilter.innerHTML = '<option value="all">All Branches</option>';
  branches.forEach(function(branch) {
    var cleanName = cleanBranchName(branch.name);
    var opt = document.createElement('option');
    opt.value = cleanName;
    opt.textContent = cleanName;
    staffBranchFilter.appendChild(opt);
  });
  staffBranchFilter.value = selectedStaffBranch;
  if (staffBranchFilter.value !== selectedStaffBranch) {
    staffBranchFilter.value = 'all';
    currentBranchFilter = 'all';
  }

  var staffBranchSelect = document.getElementById('fBranch');
  staffBranchSelect.innerHTML = [
    '<option value="">No branch / Super Admin</option>',
    '<option value="Both">Both (legacy Super Admin)</option>'
  ].join('');

  branches.forEach(function(branch) {
    var opt = document.createElement('option');
    opt.value = branch.id;
    opt.textContent = cleanBranchName(branch.name);
    staffBranchSelect.appendChild(opt);
  });

  staffBranchSelect.value = selectedFormBranch;
  if (selectedFormBranch && staffBranchSelect.value !== selectedFormBranch) {
    var branchId = findBranchIdForDisplayValue(selectedFormBranch);
    staffBranchSelect.value = branchId || '';
  }
}

function applyManagementPermissions() {
  var canManage = isCurrentUserSuperAdmin();
  var manageButtons = document.querySelectorAll('.staff-manage-action');

  [btnAddStaff, emptyAddStaffBtn, btnAddBranch].forEach(function(button) {
    if (!button) return;
    button.classList.toggle('manage-disabled', !canManage);
    button.setAttribute('aria-disabled', canManage ? 'false' : 'true');
    button.title = canManage ? '' : 'Only Super Admin can manage staff and branches.';
  });

  manageButtons.forEach(function(button) {
    button.classList.toggle('manage-disabled', !canManage);
    button.setAttribute('aria-disabled', canManage ? 'false' : 'true');
    button.title = canManage ? (button.title || '') : 'Only Super Admin can manage staff and branches.';
  });
}

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

function showStaffLoadingState() {
  if (branchCardsGrid) {
    branchCardsGrid.innerHTML = '<p style="color:var(--text-light);font-size:13px;">Loading staff and branches...</p>';
  }

  if (staffTableBody) {
    staffTableBody.innerHTML = '<tr><td colspan="9" style="padding:18px;color:var(--text-light);">Loading staff and branches...</td></tr>';
  }
}

async function loadBranchesFromSupabase() {
  var supabaseClient = getSupabaseClient();
  if (!supabaseClient) return null;

  var response = await supabaseClient
    .from('branches')
    .select('id, name, address, contact_number, created_at')
    .order('name', { ascending: true });

  if (response.error) {
    throw new Error('Unable to load branches from Supabase: ' + response.error.message);
  }

  return response.data || [];
}

async function loadStaffFromSupabase() {
  var supabaseClient = getSupabaseClient();
  if (!supabaseClient) return null;

  var response = await supabaseClient
    .from('staff_users')
    .select('id, full_name, email, phone, role, branch_id, is_active, auth_user_id, created_at')
    .order('full_name', { ascending: true });

  if (response.error) {
    throw new Error('Unable to load staff users from Supabase: ' + response.error.message);
  }

  return response.data || [];
}

async function loadStaffModuleData() {
  var supabaseClient = getSupabaseClient();

  if (!supabaseClient) {
    showToast('Supabase is not available. Showing development sample staff data.', 'error');
    renderAll();
    return;
  }

  showStaffLoadingState();

  try {
    var currentStaffProfile = await waitForCurrentStaffProfile();

    if (!currentStaffProfile) {
      showToast('Staff profile is still being verified. Please refresh after login completes.', 'error');
      renderAll();
      return;
    }

    var branchRows = await loadBranchesFromSupabase();
    var staffRows = await loadStaffFromSupabase();
    var branchLookup = {};

    branchRows.forEach(function(branch) {
      branchLookup[String(branch.id)] = branch;
    });

    var mappedStaff = staffRows.map(function(record) {
      return mapSupabaseStaff(record, branchLookup);
    });

    staffList = mappedStaff;
    branches = branchRows.map(function(record) {
      return mapSupabaseBranch(record, mappedStaff);
    });

    isUsingSupabaseData = true;

    if (branches.length === 0) {
      showToast('No branches found in Supabase.', 'error');
    } else {
      showToast('Staff and branches loaded from Supabase.', 'success');
    }

    renderAll();
  } catch (error) {
    console.warn('Staff module Supabase loading failed.', error);
    showToast(error.message || 'Unable to load staff and branches from Supabase. Showing development sample data.', 'error');
    renderAll();
  }
}

function getStaffPayloadFromForm() {
  var fullName = document.getElementById('fStaffName').value.trim();
  var email = document.getElementById('fStaffEmail').value.trim();
  var phone = document.getElementById('fStaffPhone').value.trim();
  var roleLabel = document.getElementById('fRole').value;
  var role = labelRoleToDb(roleLabel);
  var branchValue = document.getElementById('fBranch').value;
  var status = document.getElementById('fStatus').value;
  var branchId = findBranchIdForDisplayValue(branchValue);

  if (!fullName) throw new Error('Full name is required.');
  if (!email) throw new Error('Email address is required.');
  if (!role) throw new Error('Role is required.');
  if ((role === 'branch_manager' || role === 'agent') && !branchId) {
    throw new Error('Branch is required for Branch Manager and Agent roles.');
  }

  return {
    full_name: fullName,
    email: email,
    phone: phone || null,
    role: role,
    branch_id: role === 'super_admin' ? (branchId || null) : branchId,
    is_active: status === 'Active'
  };
}

function getBranchPayloadFromForm() {
  var name = document.getElementById('fBranchName').value.trim();
  var address = document.getElementById('fBranchAddress').value.trim();
  var contactNumber = document.getElementById('fBranchContact').value.trim();

  if (!name) throw new Error('Branch name is required.');

  return {
    name: name,
    address: address || null,
    contact_number: contactNumber || null
  };
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

async function createStaffProfile(payload) {
  var response = await getSupabaseClient()
    .from('staff_users')
    .insert(payload)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase staff insert failed.', response.error);
    throw new Error(response.error.message || 'Unable to create staff profile.');
  }

  return response.data.id;
}

async function updateStaffProfile(staffId, payload) {
  var response = await getSupabaseClient()
    .from('staff_users')
    .update(payload)
    .eq('id', staffId)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase staff update failed.', response.error);
    throw new Error(response.error.message || 'Unable to update staff profile.');
  }

  return response.data.id;
}

async function updateStaffActiveStatus(staffId, isActive) {
  var response = await getSupabaseClient()
    .from('staff_users')
    .update({ is_active: isActive })
    .eq('id', staffId)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase staff status update failed.', response.error);
    throw new Error(response.error.message || 'Unable to update staff status.');
  }

  return response.data.id;
}

async function createBranch(payload) {
  var response = await getSupabaseClient()
    .from('branches')
    .insert(payload)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase branch insert failed.', response.error);
    throw new Error(response.error.message || 'Unable to create branch.');
  }

  return response.data.id;
}

async function updateBranch(branchId, payload) {
  var response = await getSupabaseClient()
    .from('branches')
    .update(payload)
    .eq('id', branchId)
    .select('id')
    .single();

  if (response.error) {
    console.warn('Supabase branch update failed.', response.error);
    throw new Error(response.error.message || 'Unable to update branch.');
  }

  return response.data.id;
}


/* ══════════════════════════════════════════════════════════════
   6. FILTER STAFF
   Phase 2A: filters run against the mapped read-only Supabase data.
══════════════════════════════════════════════════════════════ */

function getFilteredStaff() {
  return staffList.filter(function(s) {
    // Header branch filter (also checks "Both" which covers all)
    if (currentBranch !== 'all') {
      var b = s.branch.toLowerCase();
      if (b !== currentBranch && b !== 'both') return false;
    }
    // Staff table role filter
    if (currentRoleFilter !== 'all' && s.role !== currentRoleFilter) return false;
    // Staff table branch filter
    if (currentBranchFilter !== 'all' && s.branch !== currentBranchFilter && s.branch !== 'Both') return false;
    // Status filter
    if (currentStatusFilter !== 'all' && s.status !== currentStatusFilter) return false;
    // Search
    if (currentSearch) {
      var q = currentSearch.toLowerCase();
      var match = s.name.toLowerCase().includes(q)
               || s.email.toLowerCase().includes(q)
               || s.phone.toLowerCase().includes(q)
               || s.role.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}


/* ══════════════════════════════════════════════════════════════
   7. UPDATE STATS
   // Later: can come from Supabase aggregate/count queries.
══════════════════════════════════════════════════════════════ */

function updateStats(filtered) {
  statTotalStaff.textContent   = filtered.length;
  statActiveAgents.textContent = filtered.filter(function(s) {
    return s.role === 'Agent' && s.status === 'Active';
  }).length;
  statManagers.textContent     = filtered.filter(function(s) {
    return s.role === 'Branch Manager' && s.status === 'Active';
  }).length;

  // Branches stat: count distinct active branches in filtered staff (exclude "Both")
  var activeBranchSet = {};
  filtered.forEach(function(s) {
    if (s.status === 'Active' && s.branch !== 'Both') {
      activeBranchSet[s.branch] = true;
    }
  });
  // Always show total branches regardless of filter
  statBranches.textContent = branches.length;
}


/* ══════════════════════════════════════════════════════════════
   8. RENDER BRANCH CARDS
   // Later: replace with Supabase branches table.
══════════════════════════════════════════════════════════════ */

function renderBranches() {
  // If a branch filter is active, only show that branch card
  var filtered = branches;
  if (currentBranch !== 'all') {
    filtered = branches.filter(function(b) {
      return b.name.toLowerCase().includes(currentBranch);
    });
  }

  if (filtered.length === 0) {
    var message = branches.length === 0 ? 'No branches found in Supabase.' : 'No branch cards for this filter.';
    branchCardsGrid.innerHTML = '<p style="color:var(--text-light);font-size:13px;">' + message + '</p>';
    return;
  }

  branchCardsGrid.innerHTML = filtered.map(function(branch) {
    var managerInitials = getInitials(branch.manager);
    return [
      '<div class="branch-card">',
        '<div class="branch-card-top">',
          '<div>',
            '<div class="branch-card-name">' + branch.name + '</div>',
            '<div class="branch-card-address">' + branch.address + '</div>',
          '</div>',
          '<div class="branch-icon">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
          '</div>',
        '</div>',
        '<div class="branch-card-body">',
          '<div class="branch-meta-grid">',
            '<div class="branch-meta-item">',
              '<div class="branch-meta-value">' + branch.staffCount + '</div>',
              '<div class="branch-meta-label">Staff</div>',
            '</div>',
            '<div class="branch-meta-item">',
              '<div class="branch-meta-value">' + branch.activeProperties + '</div>',
              '<div class="branch-meta-label">Properties</div>',
            '</div>',
            '<div class="branch-meta-item">',
              '<div class="branch-meta-value">' + branch.openLeads + '</div>',
              '<div class="branch-meta-label">Open Leads</div>',
            '</div>',
          '</div>',
          '<div class="branch-contact">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>',
            branch.phone,
          '</div>',
          '<div class="branch-manager-row">',
            '<div class="branch-manager-avatar">' + managerInitials + '</div>',
            '<div>',
              '<div class="branch-manager-label">Branch Manager</div>',
              '<div class="branch-manager-name">' + branch.manager + '</div>',
            '</div>',
          '</div>',
          '<div class="branch-card-actions">',
            '<button class="action-btn outline small btn-view-branch" data-branchid="' + branch.id + '">',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
              'View',
            '</button>',
            '<button class="action-btn outline small btn-edit-branch staff-manage-action" data-branchid="' + branch.id + '">',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
              'Edit',
            '</button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');
}


/* ══════════════════════════════════════════════════════════════
   9. RENDER STAFF TABLE
   // Later: replace with Supabase staff_users table data.
══════════════════════════════════════════════════════════════ */

function renderStaffTable(filtered) {
  staffTableBody.innerHTML = '';

  if (filtered.length === 0) {
    document.querySelector('.staff-table-wrap table').style.display = 'none';
    staffEmptyState.style.display = 'flex';
    return;
  }

  document.querySelector('.staff-table-wrap table').style.display = 'table';
  staffEmptyState.style.display = 'none';

  filtered.forEach(function(staff) {
    var initials     = getInitials(staff.name);
    var roleClass    = getRoleBadgeClass(staff.role);
    var avatarClass  = getAvatarClass(staff.role);
    var isActive     = staff.status === 'Active';
    var statusClass  = isActive ? 'status-badge-active' : 'status-badge-inactive';
    var dotClass     = isActive ? 'dot-active' : 'dot-inactive';

    var row = document.createElement('tr');
    row.dataset.id = staff.id;
    row.innerHTML = [
      '<td>',
        '<div class="staff-name-cell">',
          '<div class="staff-avatar ' + avatarClass + '">' + initials + '</div>',
          '<div>',
            '<div class="staff-full-name">' + staff.name + '</div>',
            '<div class="staff-job-title">' + (staff.jobTitle || staff.role) + '</div>',
          '</div>',
        '</div>',
      '</td>',
      '<td>',
        '<div class="staff-email">' + staff.email + '</div>',
        '<div class="staff-phone">' + staff.phone + '</div>',
      '</td>',
      '<td><span class="role-badge ' + roleClass + '">' + staff.role + '</span></td>',
      '<td>' + staff.branch + '</td>',
      '<td>',
        '<span class="status-badge ' + statusClass + '">',
          '<span class="status-dot ' + dotClass + '"></span>',
          staff.status,
        '</span>',
      '</td>',
      '<td style="text-align:center;">' + staff.assignedProperties + '</td>',
      '<td style="text-align:center;">' + staff.assignedLeads + '</td>',
      '<td style="font-size:12px;color:var(--text-light);">' + formatDate(staff.lastActivity) + '</td>',
      '<td>',
        '<div class="table-actions">',
          '<button class="btn-view" data-id="' + staff.id + '" title="View details">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
          '</button>',
          '<button class="btn-edit staff-manage-action" data-id="' + staff.id + '" title="Edit">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
          '</button>',
          '<button class="btn-deactivate staff-manage-action" data-id="' + staff.id + '" title="' + (isActive ? 'Deactivate' : 'Activate') + '">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
          '</button>',
          '<button class="btn-delete staff-manage-action" data-id="' + staff.id + '" title="Delete">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
          '</button>',
        '</div>',
      '</td>'
    ].join('');

    staffTableBody.appendChild(row);
  });
}


/* ══════════════════════════════════════════════════════════════
   10. POPULATE LEAD ASSIGNMENT SELECTS
══════════════════════════════════════════════════════════════ */

function populateAssignmentSelects() {
  // Leads
  assignLeadSelect.innerHTML = '<option value="">Choose a lead…</option>';
  sampleLeads.forEach(function(lead) {
    var opt = document.createElement('option');
    opt.value = lead.id;
    opt.textContent = lead.name + ' (' + lead.branch + ')';
    assignLeadSelect.appendChild(opt);
  });

  // Agents (active agents only)
  assignAgentSelect.innerHTML = '<option value="">Choose an agent…</option>';
  staffList.filter(function(s) {
    return (s.role === 'Agent' || s.role === 'Branch Manager') && s.status === 'Active';
  }).forEach(function(agent) {
    var opt = document.createElement('option');
    opt.value = agent.id;
    opt.textContent = agent.name + ' — ' + agent.branch;
    assignAgentSelect.appendChild(opt);
  });
}


/* ══════════════════════════════════════════════════════════════
   11. MASTER RENDER FUNCTION
══════════════════════════════════════════════════════════════ */

function renderAll() {
  populateBranchControls();
  var filtered = getFilteredStaff();
  updateStats(filtered);
  renderBranches();
  renderStaffTable(filtered);
  populateAssignmentSelects();
  applyManagementPermissions();
}


/* ══════════════════════════════════════════════════════════════
   12. HEADER BRANCH FILTER
══════════════════════════════════════════════════════════════ */

document.querySelectorAll('.branch-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.branch-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentBranch = btn.dataset.branch;
    renderAll();
  });
});


/* ══════════════════════════════════════════════════════════════
   13. SEARCH & FILTER LISTENERS
══════════════════════════════════════════════════════════════ */

staffSearch.addEventListener('input', function() {
  currentSearch = staffSearch.value.trim();
  renderAll();
});

roleFilter.addEventListener('change', function() {
  currentRoleFilter = roleFilter.value;
  renderAll();
});

staffBranchFilter.addEventListener('change', function() {
  currentBranchFilter = staffBranchFilter.value;
  renderAll();
});

statusFilter.addEventListener('change', function() {
  currentStatusFilter = statusFilter.value;
  renderAll();
});


/* ══════════════════════════════════════════════════════════════
   14. EVENT DELEGATION — STAFF TABLE ACTIONS
══════════════════════════════════════════════════════════════ */

staffTableBody.addEventListener('click', function(e) {
  var viewBtn        = e.target.closest('.btn-view');
  var editBtn        = e.target.closest('.btn-edit');
  var deactivateBtn  = e.target.closest('.btn-deactivate');
  var deleteBtn      = e.target.closest('.btn-delete');

  if (viewBtn) {
    openStaffDetailsPanel(viewBtn.dataset.id);
    return;
  }
  if (editBtn) {
    if (!requireSuperAdmin()) return;
    openStaffModal('edit', editBtn.dataset.id);
    return;
  }
  if (deactivateBtn) {
    if (!requireSuperAdmin()) return;
    toggleStaffStatus(deactivateBtn.dataset.id);
    return;
  }
  if (deleteBtn) {
    if (!requireSuperAdmin()) return;
    deleteStaff(deleteBtn.dataset.id);
    return;
  }
});

// Branch card actions
branchCardsGrid.addEventListener('click', function(e) {
  var viewBtn = e.target.closest('.btn-view-branch');
  var editBtn = e.target.closest('.btn-edit-branch');

  if (viewBtn) {
    openBranchDetailsModal(viewBtn.dataset.branchid);
    return;
  }
  if (editBtn) {
    if (!requireSuperAdmin()) return;
    openBranchFormModal('edit', editBtn.dataset.branchid);
    return;
  }
});


/* ══════════════════════════════════════════════════════════════
   15. STAFF DETAILS PANEL
══════════════════════════════════════════════════════════════ */

function openStaffDetailsPanel(id) {
  var staff = staffList.find(function(s) { return String(s.id) === String(id); });
  if (!staff) return;

  activePanelStaffId = id;

  staffDetailsPanelTitle.textContent = staff.name;
  btnEditFromPanel.classList.toggle('manage-disabled', !isCurrentUserSuperAdmin());
  btnEditFromPanel.setAttribute('aria-disabled', isCurrentUserSuperAdmin() ? 'false' : 'true');
  btnEditFromPanel.onclick = function() {
    if (!requireSuperAdmin()) return;
    openStaffModal('edit', id);
  };

  var initials     = getInitials(staff.name);
  var roleClass    = getRoleBadgeClass(staff.role);
  var avatarClass  = getAvatarClass(staff.role);
  var isActive     = staff.status === 'Active';
  var statusClass  = isActive ? 'status-badge-active' : 'status-badge-inactive';
  var dotClass     = isActive ? 'dot-active' : 'dot-inactive';

  staffDetailsBody.innerHTML = [
    '<div class="staff-detail-avatar-row">',
      '<div class="staff-detail-avatar ' + avatarClass + '">' + initials + '</div>',
      '<div>',
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">',
          '<span class="role-badge ' + roleClass + '">' + staff.role + '</span>',
          '<span class="status-badge ' + statusClass + '">',
            '<span class="status-dot ' + dotClass + '"></span>',
            staff.status,
          '</span>',
        '</div>',
        '<div class="staff-detail-role-title">' + (staff.jobTitle || staff.role) + '</div>',
      '</div>',
    '</div>',

    '<div>',
      '<div class="details-section-title">Contact Information</div>',
      '<div class="details-info-grid">',
        '<div><div class="details-info-label">Email</div><div class="details-info-value">' + staff.email + '</div></div>',
        '<div><div class="details-info-label">Phone</div><div class="details-info-value">' + staff.phone + '</div></div>',
        '<div><div class="details-info-label">Branch</div><div class="details-info-value">' + staff.branch + '</div></div>',
        '<div><div class="details-info-label">Last Active</div><div class="details-info-value">' + formatDate(staff.lastActivity) + '</div></div>',
      '</div>',
    '</div>',

    '<div>',
      '<div class="details-section-title">Work Summary</div>',
      '<div class="details-info-grid">',
        '<div><div class="details-info-label">Assigned Properties</div><div class="details-info-value">' + staff.assignedProperties + '</div></div>',
        '<div><div class="details-info-label">Assigned Leads</div><div class="details-info-value">' + staff.assignedLeads + '</div></div>',
      '</div>',
    '</div>',

    (staff.notes ? [
      '<div>',
        '<div class="details-section-title">Notes</div>',
        '<div class="details-notes">' + staff.notes + '</div>',
      '</div>'
    ].join('') : ''),

    // Quick status toggle from panel
    '<div>',
      '<div class="details-section-title">Quick Actions</div>',
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">',
        '<button class="action-btn outline small staff-manage-action" id="panelToggleStatus" data-id="' + staff.id + '">',
          isActive ? 'Deactivate Account' : 'Reactivate Account',
        '</button>',
        '<button class="action-btn outline small staff-manage-action" id="panelDeleteStaff" data-id="' + staff.id + '" style="color:#C0392B;border-color:#C0392B;">',
          'Delete Staff Record',
        '</button>',
      '</div>',
    '</div>',
  ].join('');

  // Bind quick action buttons inside panel
  document.getElementById('panelToggleStatus').addEventListener('click', function() {
    if (!requireSuperAdmin()) return;
    toggleStaffStatus(this.dataset.id);
  });
  document.getElementById('panelDeleteStaff').addEventListener('click', function() {
    if (!requireSuperAdmin()) return;
    var confirmId = this.dataset.id;
    deleteStaff(confirmId);
  });

  // Show panel
  staffDetailsPanel.style.display = 'flex';
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      staffDetailsPanel.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStaffDetailsPanel() {
  staffDetailsPanel.classList.remove('open');
  activePanelStaffId = null;
  if (!staffModal.classList.contains('open') && !branchDetailsModal.classList.contains('open') && !branchFormModal.classList.contains('open')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  setTimeout(function() { staffDetailsPanel.style.display = 'none'; }, 300);
}

staffDetailsClose.addEventListener('click', closeStaffDetailsPanel);


/* ══════════════════════════════════════════════════════════════
   16. BRANCH DETAILS MODAL
══════════════════════════════════════════════════════════════ */

function openBranchDetailsModal(branchId) {
  var branch = branches.find(function(b) { return String(b.id) === String(branchId); });
  if (!branch) return;

  branchModalTitle.textContent    = branch.name;
  branchModalSubtitle.textContent = branch.address;

  // Find staff in this branch
  var branchStaff = staffList.filter(function(s) {
    return String(s.branchId) === String(branch.id) || s.branch === cleanBranchName(branch.name) || s.branch === 'Both';
  });

  var staffListHtml = branchStaff.length === 0
    ? '<p style="font-size:13px;color:var(--text-light);">No staff assigned to this branch.</p>'
    : branchStaff.map(function(s) {
        var initials  = getInitials(s.name);
        var roleClass = getRoleBadgeClass(s.role);
        var avClass   = getAvatarClass(s.role);
        return [
          '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);">',
            '<div class="staff-avatar ' + avClass + '" style="width:32px;height:32px;font-size:11px;">' + initials + '</div>',
            '<div style="flex:1;">',
              '<div style="font-weight:600;font-size:13px;">' + s.name + '</div>',
              '<div style="font-size:11px;color:var(--text-light);">' + s.jobTitle + '</div>',
            '</div>',
            '<span class="role-badge ' + roleClass + '">' + s.role + '</span>',
          '</div>'
        ].join('');
      }).join('');

  branchModalBody.innerHTML = [
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">',
      '<div><div class="details-info-label" style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Phone</div><div style="font-size:13px;font-weight:500;">' + branch.phone + '</div></div>',
      '<div><div class="details-info-label" style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Email</div><div style="font-size:13px;font-weight:500;">' + branch.email + '</div></div>',
      '<div><div class="details-info-label" style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Active Properties</div><div style="font-size:20px;font-weight:700;color:var(--navy);">' + branch.activeProperties + '</div></div>',
      '<div><div class="details-info-label" style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Open Leads</div><div style="font-size:20px;font-weight:700;color:var(--navy);">' + branch.openLeads + '</div></div>',
    '</div>',
    '<div style="font-size:12px;font-weight:700;color:var(--text-mid);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid var(--border-light);">Staff Members</div>',
    staffListHtml,
  ].join('');

  branchDetailsModal.style.display = 'flex';
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      branchDetailsModal.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBranchDetailsModal() {
  branchDetailsModal.classList.remove('open');
  if (!staffModal.classList.contains('open') && !staffDetailsPanel.classList.contains('open') && !branchFormModal.classList.contains('open')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  setTimeout(function() { branchDetailsModal.style.display = 'none'; }, 300);
}

branchModalClose.addEventListener('click', closeBranchDetailsModal);

function openBranchFormModal(mode, branchId) {
  if (!requireSuperAdmin()) return;

  mode = mode || 'add';
  branchForm.reset();
  editBranchIdField.value = '';

  if (mode === 'edit' && branchId) {
    var branch = branches.find(function(b) { return String(b.id) === String(branchId); });
    if (!branch) return;

    branchFormModalTitle.textContent = 'Edit Branch';
    editBranchIdField.value = branch.id;
    document.getElementById('fBranchName').value = branch.name;
    document.getElementById('fBranchAddress').value = branch.address === 'Address not provided' ? '' : branch.address;
    document.getElementById('fBranchContact').value = branch.phone === 'Phone not provided' ? '' : branch.phone;
  } else {
    branchFormModalTitle.textContent = 'Add New Branch';
  }

  branchFormModal.style.display = 'flex';
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      branchFormModal.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBranchFormModal() {
  branchFormModal.classList.remove('open');
  if (!staffModal.classList.contains('open') && !staffDetailsPanel.classList.contains('open') && !branchDetailsModal.classList.contains('open')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  setTimeout(function() { branchFormModal.style.display = 'none'; }, 300);
}

branchFormModalClose.addEventListener('click', closeBranchFormModal);
branchFormCancelBtn.addEventListener('click', closeBranchFormModal);


/* ══════════════════════════════════════════════════════════════
   17. ADD / EDIT STAFF MODAL
══════════════════════════════════════════════════════════════ */

function openStaffModal(mode, id) {
  mode = mode || 'add';
  switchStaffModalTab('staffdetails');

  if (mode === 'edit' && id) {
    var staff = staffList.find(function(s) { return String(s.id) === String(id); });
    if (!staff) return;

    staffModalTitle.textContent = 'Edit Staff Member';
    editStaffIdField.value = staff.id;

    document.getElementById('fStaffName').value  = staff.name;
    document.getElementById('fStaffEmail').value = staff.email;
    document.getElementById('fStaffPhone').value = staff.phone;
    document.getElementById('fJobTitle').value   = staff.jobTitle;
    document.getElementById('fRole').value       = staff.role;
    document.getElementById('fBranch').value     = staff.branchId || findBranchIdForDisplayValue(staff.branch) || (staff.branch === 'Both' ? 'Both' : '');
    document.getElementById('fStatus').value     = staff.status;
    document.getElementById('fStaffNotes').value = staff.notes;

  } else {
    staffModalTitle.textContent = 'Add New Staff Member';
    editStaffIdField.value = '';
    staffForm.reset();
    document.getElementById('fStatus').value = 'Active';
  }

  staffModal.style.display = 'flex';
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      staffModal.classList.add('open');
    });
  });
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStaffModal() {
  staffModal.classList.remove('open');
  if (!staffDetailsPanel.classList.contains('open') && !branchDetailsModal.classList.contains('open') && !branchFormModal.classList.contains('open')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  setTimeout(function() { staffModal.style.display = 'none'; }, 300);
}

btnAddStaff.addEventListener('click', function() {
  if (!requireSuperAdmin()) return;
  openStaffModal('add');
});
if (emptyAddStaffBtn) {
  emptyAddStaffBtn.addEventListener('click', function() {
    if (!requireSuperAdmin()) return;
    openStaffModal('add');
  });
}
staffModalClose.addEventListener('click', closeStaffModal);
staffModalCancelBtn.addEventListener('click', closeStaffModal);

// Modal tabs
document.querySelectorAll('#staffModal .modal-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    switchStaffModalTab(tab.dataset.tab);
  });
});

function switchStaffModalTab(tabName) {
  document.querySelectorAll('#staffModal .modal-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('#staffModal .tab-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'tab-' + tabName);
  });
}

// Overlay click — closes topmost open layer
modalOverlay.addEventListener('click', function() {
  if (staffModal.classList.contains('open')) {
    closeStaffModal();
  } else if (branchFormModal.classList.contains('open')) {
    closeBranchFormModal();
  } else if (branchDetailsModal.classList.contains('open')) {
    closeBranchDetailsModal();
  } else if (staffDetailsPanel.classList.contains('open')) {
    closeStaffDetailsPanel();
  } else {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});


/* ══════════════════════════════════════════════════════════════
   18. FORM SAVE (ADD OR EDIT)
   Phase 2A: frontend array only, even when initial data came from Supabase.
   Phase 2B will add create/update/deactivate actions safely.
══════════════════════════════════════════════════════════════ */

staffForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  if (!requireSuperAdmin()) return;

  var required = ['fStaffName', 'fStaffEmail', 'fRole', 'fStatus'];
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
    switchStaffModalTab('staffdetails');
    showToast('Please fill in all required fields', 'error');
    return;
  }

  var editId = editStaffIdField.value;

  try {
    if (!getSupabaseClient()) {
      showToast('Supabase is not available. Staff changes cannot be saved.', 'error');
      return;
    }

    var payload = getStaffPayloadFromForm();

    if (editId) {
      await updateStaffProfile(editId, payload);
      await logActivity({
        actionType: 'STAFF_UPDATED',
        description: 'Updated staff profile for ' + payload.full_name + '.',
        branchId: payload.branch_id || null
      });
      showToast('Staff profile updated.', 'success');
    } else {
      await createStaffProfile(payload);
      await logActivity({
        actionType: 'STAFF_CREATED',
        description: 'Created staff profile for ' + payload.full_name + '.',
        branchId: payload.branch_id || null
      });
      showToast('Staff profile created. Create the login account in Supabase Auth and link auth_user_id when ready.', 'success');
    }

    closeStaffModal();

    if (editId && String(activePanelStaffId) === String(editId)) {
      closeStaffDetailsPanel();
    }

    await loadStaffModuleData();
  } catch (error) {
    console.warn('Staff profile save failed.', error);
    showToast(error.message || 'Unable to save staff profile.', 'error');
  }
});


/* ══════════════════════════════════════════════════════════════
   19. TOGGLE STAFF STATUS (Activate / Deactivate)
   Phase 2A: frontend array only. No Supabase update is sent.
══════════════════════════════════════════════════════════════ */

async function toggleStaffStatus(id) {
  if (!requireSuperAdmin()) return;

  var staff = staffList.find(function(s) { return String(s.id) === String(id); });
  if (!staff) return;

  var newStatus  = staff.status === 'Active' ? 'Inactive' : 'Active';
  var actionWord = newStatus === 'Inactive' ? 'deactivate' : 'reactivate';

  if (String(id) === String((window.hilltopCurrentUser || {}).id) && newStatus === 'Inactive') {
    showToast('You cannot deactivate your own active session.', 'error');
    return;
  }

  if (!confirm('Are you sure you want to ' + actionWord + ' ' + staff.name + '?')) return;

  try {
    await updateStaffActiveStatus(id, newStatus === 'Active');
    await logActivity({
      actionType: newStatus === 'Active' ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
      description: (newStatus === 'Active' ? 'Activated' : 'Deactivated') + ' staff profile for ' + staff.name + '.',
      branchId: staff.branchId || null
    });
    showToast(newStatus === 'Active' ? 'Staff account activated.' : 'Staff account deactivated.', 'success');
    await loadStaffModuleData();
  } catch (error) {
    console.warn('Staff status change failed.', error);
    showToast(error.message || 'Unable to update staff status.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   20. DELETE STAFF
   Phase 2A: frontend array only. No Supabase delete is sent.
══════════════════════════════════════════════════════════════ */

async function deleteStaff(id) {
  if (!requireSuperAdmin()) return;

  var staff = staffList.find(function(s) { return String(s.id) === String(id); });
  if (!staff) return;

  if (String(id) === String((window.hilltopCurrentUser || {}).id)) {
    showToast('You cannot deactivate your own active session.', 'error');
    return;
  }

  if (!confirm('Deactivate "' + staff.name + '" instead of deleting? Staff records are kept for audit safety.')) return;

  try {
    await updateStaffActiveStatus(id, false);
    await logActivity({
      actionType: 'STAFF_DEACTIVATED',
      description: 'Deactivated staff profile for ' + staff.name + '.',
      branchId: staff.branchId || null
    });
    if (String(activePanelStaffId) === String(id)) closeStaffDetailsPanel();
    showToast('Staff profile deactivated instead of deleted for audit safety.', 'success');
    await loadStaffModuleData();
  } catch (error) {
    console.warn('Staff soft-delete failed.', error);
    showToast(error.message || 'Unable to deactivate staff profile.', 'error');
  }
}


/* ══════════════════════════════════════════════════════════════
   21. ADD / EDIT BRANCH
   Branch deletion is intentionally not implemented for audit safety.
══════════════════════════════════════════════════════════════ */

btnAddBranch.addEventListener('click', function() {
  if (!requireSuperAdmin()) return;
  openBranchFormModal('add');
});

branchForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  if (!requireSuperAdmin()) return;

  var editId = editBranchIdField.value;

  try {
    if (!getSupabaseClient()) {
      showToast('Supabase is not available. Branch changes cannot be saved.', 'error');
      return;
    }

    var payload = getBranchPayloadFromForm();

    if (editId) {
      await updateBranch(editId, payload);
      await logActivity({
        actionType: 'BRANCH_UPDATED',
        description: 'Updated branch ' + payload.name + '.',
        branchId: editId
      });
      showToast('Branch updated.', 'success');
    } else {
      var createdBranchId = await createBranch(payload);
      await logActivity({
        actionType: 'BRANCH_CREATED',
        description: 'Created branch ' + payload.name + '.',
        branchId: createdBranchId
      });
      showToast('Branch created.', 'success');
    }

    closeBranchFormModal();
    await loadStaffModuleData();
  } catch (error) {
    console.warn('Branch save failed.', error);
    showToast(error.message || 'Unable to save branch.', 'error');
  }
});


/* ══════════════════════════════════════════════════════════════
   22. LEAD ASSIGNMENT PREVIEW
   Phase 3 or later: keep this frontend-only until Leads backend work.
══════════════════════════════════════════════════════════════ */

btnAssign.addEventListener('click', function() {
  var leadId  = assignLeadSelect.value;
  var agentId = assignAgentSelect.value;

  if (!leadId || !agentId) {
    showToast('Please select both a lead and an agent', 'error');
    return;
  }

  var lead  = sampleLeads.find(function(l) { return String(l.id) === String(leadId); });
  var agent = staffList.find(function(s) { return String(s.id) === String(agentId); });

  if (lead && agent) {
    showToast('Lead assignment updated in demo data.', 'success');
    assignLeadSelect.value  = '';
    assignAgentSelect.value = '';
  }
});


/* ══════════════════════════════════════════════════════════════
   23. MOBILE SIDEBAR TOGGLE
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
    if (!staffModal.classList.contains('open') &&
        !staffDetailsPanel.classList.contains('open') &&
        !branchDetailsModal.classList.contains('open') &&
        !branchFormModal.classList.contains('open')) {
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
   24. TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════════ */

var toastTimer;
function showToast(message, type) {
  type = type || 'success';
  toastEl.textContent = message;
  toastEl.className   = 'toast ' + type;
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toastEl.classList.add('show');
    });
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toastEl.classList.remove('show');
  }, 3200);
}


/* ══════════════════════════════════════════════════════════════
   25. INITIAL RENDER
══════════════════════════════════════════════════════════════ */

loadStaffModuleData();
