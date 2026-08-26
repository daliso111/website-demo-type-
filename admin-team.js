/* ============================================================
   HILLTOP PROPERTIES ZAMBIA — TEAM MEMBERS DASHBOARD
   admin-team.js
   ============================================================ */

// Safe helper functions (mirrors common dashboard utilities)
function byId(id) { return document.getElementById(id); }
function show(el) { if (el) el.style.display = 'block'; }
function hide(el) { if (el) el.style.display = 'none'; }

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global local storage key constants
// NOTE: This is temporary. Supabase will replace localStorage later for real admin control across devices.
var LOCAL_STORAGE_KEY = 'hilltop_team_members';

// Default fallback team data to initialize database representation
var defaultTeamData = [
  {
    id: 1,
    fullName: "Mwansa Kaunda",
    role: "Managing Director & Principal Broker",
    branch: "Lusaka",
    phone: "+260 97 789 0123",
    whatsapp: "https://wa.me/260977890123",
    bio: "Over 12 years of real estate experience in Zambia. Specialist in commercial valuations and high-end residential acquisitions.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    fullName: "Daliso Mumba",
    role: "Senior Leasing Agent",
    branch: "Lusaka",
    phone: "+260 96 456 7890",
    whatsapp: "https://wa.me/260964567890",
    bio: "Focused on residential renting and landlord coordination in Kabulonga, Woodlands, and Roma areas.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    fullName: "Sibongile Phiri",
    role: "Livingstone Branch Manager",
    branch: "Livingstone",
    phone: "+260 95 321 6549",
    whatsapp: "https://wa.me/260953216549",
    bio: "Managing tourist-capital properties, lodges, land listings, and guiding international clients.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80",
    displayOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Load team members from local storage or initialize
function getTeamMembers() {
  try {
    var stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse local team data. Resetting...", e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultTeamData));
  return defaultTeamData;
}

function saveTeamMembers(list) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
}

// Global page states
var teamMembers = [];
var isFormModified = false;

// Convert base64 data URL to Blob for Supabase storage upload
function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

// Upload file/blob to Supabase Storage
async function uploadTeamMemberImage(file) {
  var db = window.hilltopSupabase;
  if (!db) throw new Error("Supabase is not initialized.");

  // Generate unique filename
  var ext = 'jpg';
  if (file.type === 'image/png') ext = 'png';
  else if (file.type === 'image/webp') ext = 'webp';
  
  var fileName = 'avatar_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;
  var filePath = fileName;

  var { data, error } = await db.storage
    .from('team-members')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  var { data: publicUrlData } = db.storage
    .from('team-members')
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    path: filePath
  };
}

// Delete old image from Supabase Storage
async function deleteOldTeamMemberImage(filePath) {
  if (!filePath) return;
  var db = window.hilltopSupabase;
  if (!db) return;

  try {
    var { error } = await db.storage
      .from('team-members')
      .remove([filePath]);
    if (error) throw error;
  } catch (e) {
    console.error("Failed to delete old image from storage", e);
  }
}

// Seed mock data if database is empty on first run
async function seedDefaultTeamData() {
  var db = window.hilltopSupabase;
  if (!db) return;

  var toInsert = defaultTeamData.map(function(m) {
    return {
      full_name: m.fullName,
      role: m.role,
      branch: m.branch,
      phone: m.phone,
      whatsapp: m.whatsapp,
      bio: m.bio,
      image_url: m.image,
      display_order: m.displayOrder,
      is_active: m.isActive
    };
  });

  try {
    var { data, error } = await db.from('team_members').insert(toInsert).select();
    if (error) throw error;
    if (data) {
      teamMembers = data.map(function(m) {
        return {
          id: m.id,
          fullName: m.full_name,
          role: m.role,
          branch: m.branch,
          phone: m.phone,
          whatsapp: m.whatsapp,
          bio: m.bio,
          image: m.image_url,
          imagePath: m.image_path,
          displayOrder: m.display_order,
          isActive: m.is_active,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        };
      });
    }
  } catch (e) {
    console.error("Failed to seed default team members into Supabase", e);
    teamMembers = defaultTeamData;
  }
}

// Fetch team members from Supabase
async function loadTeamMembersFromSupabase() {
  var db = window.hilltopSupabase;
  if (!db) {
    console.warn("Supabase not available, using localStorage fallback.");
    teamMembers = getTeamMembers();
    renderDashboard();
    return;
  }

  // Display a loading state in the table while loading
  var tbody = byId('teamTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-light);">Loading team members from Supabase...</td></tr>';
  }

  try {
    var { data, error } = await db
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      teamMembers = data.map(function(m) {
        return {
          id: m.id,
          fullName: m.full_name,
          role: m.role,
          branch: m.branch,
          phone: m.phone,
          whatsapp: m.whatsapp,
          bio: m.bio,
          image: m.image_url,
          imagePath: m.image_path,
          displayOrder: m.display_order,
          isActive: m.is_active,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        };
      });
    } else {
      console.info("Supabase team_members table is empty. Seeding defaults...");
      await seedDefaultTeamData();
    }
  } catch (e) {
    console.error("Failed to fetch team members from Supabase, falling back to localStorage", e);
    showToast("Database error. Using offline fallback.");
    teamMembers = getTeamMembers();
  }
  renderDashboard();
}

// DOM references (guarded for safety)
document.addEventListener('DOMContentLoaded', function () {
  // Ensure we are actually on the admin-team page before binding
  if (!byId('teamTableBody')) return;

  // Sidebar mobile toggle
  var hamburger = byId('hamburger');
  var sidebar = byId('sidebar');
  var sidebarOverlay = byId('sidebarOverlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('active');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function () {
      if (sidebar) sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Load and render
  loadTeamMembersFromSupabase();

  // Add Member buttons
  var btnAdd = byId('btnAddTeamMember');
  var btnEmptyAdd = byId('emptyAddBtn');
  if (btnAdd) btnAdd.addEventListener('click', openAddModal);
  if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', openAddModal);

  // Form close actions
  var btnCancel = byId('btnCancelForm');
  var btnCancelAlt = byId('btnCancelFormAlt');
  if (btnCancel) btnCancel.addEventListener('click', handleCancelClose);
  if (btnCancelAlt) btnCancelAlt.addEventListener('click', handleCancelClose);

  // Form submit handler
  var form = byId('teamMemberForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Character counter for bio description
  var bioField = byId('bio');
  var bioCounter = byId('bioCharCounter');
  if (bioField && bioCounter) {
    bioField.addEventListener('input', function () {
      var len = bioField.value.length;
      bioCounter.textContent = len + ' / 180';
      if (len > 180) {
        bioCounter.classList.add('warning');
        showError('bio', 'Bio exceeds the maximum limit of 180 characters.');
      } else {
        bioCounter.classList.remove('warning');
        clearError('bio');
      }
    });
  }

  // Image URL input preview
  var imgUrlInput = byId('imageUrl');
  var imgPreview = byId('imagePreview');
  if (imgUrlInput && imgPreview) {
    imgUrlInput.addEventListener('input', function () {
      var val = imgUrlInput.value.trim();
      imgPreview.src = val || 'assets/avatar-placeholder.png';
      isFormModified = true;
    });
  }

  // Image Upload File Resizer & Validator
  var filePicker = byId('imageFile');
  if (filePicker) {
    filePicker.addEventListener('change', handleFilePicker);
  }

  // Preview Close
  var btnPrevClose = byId('btnPrevClose');
  if (btnPrevClose) {
    btnPrevClose.addEventListener('click', closePreviewModal);
  }

  // Unsaved changes change monitors
  var inputs = form ? form.querySelectorAll('input, select, textarea') : [];
  inputs.forEach(function (input) {
    input.addEventListener('change', function () {
      isFormModified = true;
    });
    input.addEventListener('input', function () {
      if (input.id !== 'bio') { // already tracked
        isFormModified = true;
      }
    });
  });

  // Keyboard Escape key listeners for modal closing
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var formModal = byId('formModalOverlay');
      var previewModal = byId('previewModalOverlay');
      if (previewModal && previewModal.classList.contains('active')) {
        closePreviewModal();
      } else if (formModal && formModal.classList.contains('active')) {
        handleCancelClose();
      }
    }
  });

  // Modal Backdrop Click close listeners (if safe)
  var formOverlay = byId('formModalOverlay');
  if (formOverlay) {
    formOverlay.addEventListener('click', function (e) {
      if (e.target === formOverlay) {
        handleCancelClose();
      }
    });
  }
  var previewOverlay = byId('previewModalOverlay');
  if (previewOverlay) {
    previewOverlay.addEventListener('click', function (e) {
      if (e.target === previewOverlay) {
        closePreviewModal();
      }
    });
  }
});

// Render everything on screen
function renderDashboard() {
  renderStats();
  renderTable();
}

// Calculate summary indicators
function renderStats() {
  var total = teamMembers.length;
  var active = teamMembers.filter(function (m) { return m.isActive; }).length;
  var harare = teamMembers.filter(function (m) { return m.branch === 'Harare'; }).length;
  var bulawayo = teamMembers.filter(function (m) { return m.branch === 'Bulawayo'; }).length;

  var tEl = byId('statTotalMembers');
  var aEl = byId('statActiveMembers');
  var lEl = byId('statLusakaMembers');
  var lvEl = byId('statLivingstoneMembers');

  if (tEl) tEl.textContent = total;
  if (aEl) aEl.textContent = active;
  if (lEl) lEl.textContent = harare;
  if (lvEl) lvEl.textContent = bulawayo;
}

// Draw HTML table rows
function renderTable() {
  var tbody = byId('teamTableBody');
  var emptyState = byId('teamEmptyState');
  var table = byId('teamTable');

  if (!tbody) return;

  // Sort by displayOrder ascending
  teamMembers.sort(function (a, b) {
    return (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
  });

  if (teamMembers.length === 0) {
    hide(table);
    show(emptyState);
    return;
  }

  show(table);
  hide(emptyState);

  tbody.innerHTML = teamMembers.map(function (member) {
    var branchClass = 'badge-other';
    if (member.branch === 'Harare') branchClass = 'badge-lusaka';
    else if (member.branch === 'Bulawayo') branchClass = 'badge-livingstone';
    else if (member.branch === 'Head Office') branchClass = 'badge-headoffice';

    var statusText = member.isActive ? 'Active' : 'Hidden';
    var statusClass = member.isActive ? 'badge-active' : 'badge-hidden';

    var imgPath = member.image || 'assets/avatar-placeholder.png';

    // Format phone numbers safely
    var cleanPhone = member.phone.replace(/[^+\d]/g, '');
    var cleanWa = (member.whatsapp || member.phone).replace(/[^+\d]/g, '');
    if (cleanWa.startsWith('+')) {
      cleanWa = cleanWa.substring(1);
    }

    return (
      '<tr>' +
        '<td>' +
          '<div class="team-avatar-wrap">' +
            '<img class="team-avatar" src="' + escapeHtml(imgPath) + '" alt="" onerror="this.src=\'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80\'" />' +
          '</div>' +
        '</td>' +
        '<td class="team-name-cell">' + escapeHtml(member.fullName) + '</td>' +
        '<td>' + escapeHtml(member.role) + '</td>' +
        '<td><span class="badge ' + branchClass + '">' + escapeHtml(member.branch) + '</span></td>' +
        '<td>' +
          '<div class="team-contacts-cell">' +
            '<a href="tel:' + encodeURIComponent(cleanPhone) + '">📞 ' + escapeHtml(member.phone) + '</a>' +
            '<a href="https://wa.me/' + encodeURIComponent(cleanWa) + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
        '<td class="display-order-cell">' + (member.displayOrder || 0) + '</td>' +
        '<td>' +
          '<div class="row-actions">' +
            '<button class="btn-row" onclick="openEditModal(\'' + member.id + '\')">Edit</button>' +
            '<button class="btn-row" onclick="openPreviewModal(\'' + member.id + '\')">Preview</button>' +
            '<button class="btn-row" onclick="toggleActiveStatus(\'' + member.id + '\')">' +
              (member.isActive ? 'Hide' : 'Show') +
            '</button>' +
            '<button class="btn-row btn-delete" onclick="deleteTeamMember(\'' + member.id + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

// Modal open/close actions
function openAddModal() {
  clearForm();
  isFormModified = false;
  var overlay = byId('formModalOverlay');
  var title = byId('formTitle');
  if (title) title.textContent = "Add Team Member";
  if (overlay) overlay.classList.add('active');
  var fullNameInput = byId('fullName');
  if (fullNameInput) fullNameInput.focus();
}

function openEditModal(id) {
  var member = teamMembers.find(function (m) { return String(m.id) === String(id); });
  if (!member) return;

  clearForm();
  isFormModified = false;

  // Populate fields
  byId('memberId').value = member.id;
  byId('fullName').value = member.fullName || '';
  byId('role').value = member.role || '';
  byId('branch').value = member.branch || '';
  byId('phone').value = member.phone || '';
  byId('whatsapp').value = member.whatsapp || '';
  byId('displayOrder').value = member.displayOrder || 0;
  byId('bio').value = member.bio || '';
  byId('imageUrl').value = member.image || '';
  byId('isActive').checked = !!member.isActive;

  // Set char counter
  var len = (member.bio || '').length;
  byId('bioCharCounter').textContent = len + ' / 180';
  byId('imagePreview').src = member.image || 'assets/avatar-placeholder.png';

  var overlay = byId('formModalOverlay');
  var title = byId('formTitle');
  if (title) title.textContent = "Edit Team Member";
  if (overlay) overlay.classList.add('active');
  var fullNameInput = byId('fullName');
  if (fullNameInput) fullNameInput.focus();
}

function handleCancelClose() {
  if (isFormModified) {
    if (confirm("You have unsaved changes. Are you sure you want to close?")) {
      closeFormModal();
    }
  } else {
    closeFormModal();
  }
}

function closeFormModal() {
  var overlay = byId('formModalOverlay');
  if (overlay) overlay.classList.remove('active');
  clearForm();
}

// Clear all input validations and fields
function clearForm() {
  var form = byId('teamMemberForm');
  if (!form) return;

  form.reset();
  byId('memberId').value = '';
  byId('bioCharCounter').textContent = '0 / 180';
  byId('bioCharCounter').classList.remove('warning');
  byId('imagePreview').src = 'assets/avatar-placeholder.png';

  // Clear errors and invalid classes
  var fields = ['fullName', 'role', 'branch', 'phone', 'whatsapp', 'displayOrder', 'bio', 'imageFile'];
  fields.forEach(function (f) {
    clearError(f);
  });
}

// Form validations helper
function showError(fieldId, msg) {
  var input = byId(fieldId);
  var errSpan = byId('err_' + fieldId);
  if (input) input.classList.add('invalid');
  if (errSpan) errSpan.textContent = msg;
}

function clearError(fieldId) {
  var input = byId(fieldId);
  var errSpan = byId('err_' + fieldId);
  if (input) input.classList.remove('invalid');
  if (errSpan) errSpan.textContent = '';
}

// Image File Resizer & Validator using canvas
function handleFilePicker(e) {
  var file = e.target.files[0];
  if (!file) return;

  var allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.indexOf(file.type) === -1) {
    showError('imageFile', 'Invalid file type. Please choose a JPG, PNG, or WebP image.');
    byId('imageFile').value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError('imageFile', 'File is too large. Max size allowed is 5MB.');
    byId('imageFile').value = '';
    return;
  }

  clearError('imageFile');

  var reader = new FileReader();
  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      // Draw to Canvas for downscaling compression
      var canvas = document.createElement('canvas');
      var max_size = 300;
      var width = img.width;
      var height = img.height;

      if (width > height) {
        if (width > max_size) {
          height *= max_size / width;
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width *= max_size / height;
          height = max_size;
        }
      }

      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert back to base64 jpeg string (80% quality)
      var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      byId('imageUrl').value = dataUrl;
      byId('imagePreview').src = dataUrl;
      isFormModified = true;
    };
    img.onerror = function () {
      showToast('Error: Failed to process the selected image.');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Form Submission Actions
async function handleFormSubmit(e) {
  e.preventDefault();

  var idVal = byId('memberId').value;
  var fullNameVal = byId('fullName').value.trim();
  var roleVal = byId('role').value.trim();
  var branchVal = byId('branch').value;
  var phoneVal = byId('phone').value.trim();
  var whatsappVal = byId('whatsapp').value.trim();
  var displayOrderVal = byId('displayOrder').value;
  var bioVal = byId('bio').value.trim();
  var imageUrlVal = byId('imageUrl').value.trim();
  var isActiveVal = byId('isActive').checked;

  var isValid = true;

  // Validation checks
  if (!fullNameVal) {
    showError('fullName', 'Full Name is required.');
    isValid = false;
  } else {
    clearError('fullName');
  }

  if (!roleVal) {
    showError('role', 'Role / Title is required.');
    isValid = false;
  } else {
    clearError('role');
  }

  if (!branchVal) {
    showError('branch', 'Branch selection is required.');
    isValid = false;
  } else {
    clearError('branch');
  }

  if (!phoneVal) {
    showError('phone', 'Phone Number is required.');
    isValid = false;
  } else {
    clearError('phone');
  }

  if (!bioVal) {
    showError('bio', 'Bio Description is required.');
    isValid = false;
  } else if (bioVal.length > 180) {
    showError('bio', 'Bio cannot exceed 180 characters.');
    isValid = false;
  } else {
    clearError('bio');
  }

  if (!isValid) return;

  // Fallback WhatsApp to Phone if empty
  var finalWhatsapp = whatsappVal || phoneVal;

  var db = window.hilltopSupabase;
  var finalImageUrl = imageUrlVal;
  var finalImagePath = '';

  // Show status to the user
  showToast("Saving team member details...");

  // Upload image to storage if it's base64 data URL
  if (imageUrlVal.startsWith('data:image')) {
    try {
      var blob = dataURLtoBlob(imageUrlVal);
      var { url, path } = await uploadTeamMemberImage(blob);
      finalImageUrl = url;
      finalImagePath = path;
    } catch (err) {
      console.error("Failed to upload image", err);
      showToast("Error: Failed to upload profile image.");
      return;
    }
  }

  if (idVal) {
    // Edit existing
    var member = teamMembers.find(function (m) { return String(m.id) === String(idVal); });
    if (!member) return;

    // If new image uploaded, delete old one from storage
    if (finalImagePath && member.imagePath) {
      await deleteOldTeamMemberImage(member.imagePath);
    }

    if (db) {
      try {
        var updatePayload = {
          full_name: fullNameVal,
          role: roleVal,
          branch: branchVal,
          phone: phoneVal,
          whatsapp: finalWhatsapp,
          display_order: parseInt(displayOrderVal) || 0,
          bio: bioVal,
          image_url: finalImageUrl,
          is_active: isActiveVal
        };
        if (finalImagePath) {
          updatePayload.image_path = finalImagePath;
        }

        var { error } = await db.from('team_members').update(updatePayload).eq('id', idVal);
        if (error) throw error;
        showToast('Team member updated successfully.');
      } catch (err) {
        console.error("Failed to update in Supabase", err);
        showToast("Error: Failed to save changes to database.");
        return;
      }
    } else {
      showToast('Team member updated successfully (offline).');
    }

    member.fullName = fullNameVal;
    member.role = roleVal;
    member.branch = branchVal;
    member.phone = phoneVal;
    member.whatsapp = finalWhatsapp;
    member.displayOrder = parseInt(displayOrderVal) || 0;
    member.bio = bioVal;
    member.image = finalImageUrl;
    if (finalImagePath) {
      member.imagePath = finalImagePath;
    }
    member.isActive = isActiveVal;
    member.updatedAt = new Date().toISOString();
  } else {
    // Add new
    if (db) {
      try {
        var insertPayload = {
          full_name: fullNameVal,
          role: roleVal,
          branch: branchVal,
          phone: phoneVal,
          whatsapp: finalWhatsapp,
          display_order: parseInt(displayOrderVal) || 0,
          bio: bioVal,
          image_url: finalImageUrl,
          image_path: finalImagePath,
          is_active: isActiveVal
        };

        var { data, error } = await db.from('team_members').insert([insertPayload]).select();
        if (error) throw error;
        if (data && data[0]) {
          var newM = data[0];
          teamMembers.push({
            id: newM.id,
            fullName: newM.full_name,
            role: newM.role,
            branch: newM.branch,
            phone: newM.phone,
            whatsapp: newM.whatsapp,
            bio: newM.bio,
            image: newM.image_url,
            imagePath: newM.image_path,
            displayOrder: newM.display_order,
            isActive: newM.is_active,
            createdAt: newM.created_at,
            updatedAt: newM.updated_at
          });
        }
        showToast('New team member added successfully.');
      } catch (err) {
        console.error("Failed to insert in Supabase", err);
        showToast("Error: Failed to add team member to database.");
        return;
      }
    } else {
      var newId = teamMembers.length > 0 ? Math.max.apply(Math, teamMembers.map(function (m) { return m.id; })) + 1 : 1;
      var newMember = {
        id: newId,
        fullName: fullNameVal,
        role: roleVal,
        branch: branchVal,
        phone: phoneVal,
        whatsapp: finalWhatsapp,
        displayOrder: parseInt(displayOrderVal) || 0,
        bio: bioVal,
        image: finalImageUrl,
        imagePath: finalImagePath,
        isActive: isActiveVal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      teamMembers.push(newMember);
      showToast('New team member added successfully (offline).');
    }
  }

  saveTeamMembers(teamMembers);
  renderDashboard();
  closeFormModal();
}

// Toggle active status badge directly from row
async function toggleActiveStatus(id) {
  var member = teamMembers.find(function (m) { return String(m.id) === String(id); });
  if (!member) return;

  var newActiveState = !member.isActive;
  var db = window.hilltopSupabase;
  if (db) {
    try {
      var { error } = await db.from('team_members').update({ is_active: newActiveState }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to toggle active status in Supabase", e);
      showToast("Error: Failed to update status in database.");
      return;
    }
  }

  member.isActive = newActiveState;
  member.updatedAt = new Date().toISOString();

  saveTeamMembers(teamMembers);
  renderDashboard();
  showToast(member.fullName + ' status updated to ' + (member.isActive ? 'Active' : 'Hidden') + '.');
}

// Delete team member record
async function deleteTeamMember(id) {
  var member = teamMembers.find(function (m) { return String(m.id) === String(id); });
  if (!member) return;

  var confirmMsg = 'Are you sure you want to delete this team member? This action cannot be undone.';
  if (confirm(confirmMsg)) {
    var db = window.hilltopSupabase;
    if (db) {
      try {
        // Delete image first if exists
        if (member.imagePath) {
          await deleteOldTeamMemberImage(member.imagePath);
        }
        var { error } = await db.from('team_members').delete().eq('id', id);
        if (error) throw error;
        showToast(member.fullName + ' removed from directory.');
      } catch (e) {
        console.error("Failed to delete member from Supabase", e);
        showToast("Error: Failed to delete member from database.");
        return;
      }
    } else {
      showToast(member.fullName + ' removed from directory (offline).');
    }

    teamMembers = teamMembers.filter(function (m) { return String(m.id) !== String(id); });
    saveTeamMembers(teamMembers);
    renderDashboard();
  }
}

// Preview Modal Renders
function openPreviewModal(id) {
  var member = teamMembers.find(function (m) { return String(m.id) === String(id); });
  if (!member) return;

  var stage = document.querySelector('.preview-stage');
  if (!stage) return;

  var imgPath = member.image || 'assets/avatar-placeholder.png';
  var cleanPhone = member.phone.replace(/[^+\d]/g, '');
  var cleanWa = (member.whatsapp || member.phone).replace(/[^+\d]/g, '');
  if (cleanWa.startsWith('+')) {
    cleanWa = cleanWa.substring(1);
  }

  stage.innerHTML = (
    '<article class="team-card">' +
      '<div class="team-card-image-wrapper">' +
        '<img src="' + escapeHtml(imgPath) + '" alt="' + escapeHtml(member.fullName) + '" onerror="this.src=\'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80\'" />' +
      '</div>' +
      '<div class="team-card-info">' +
        '<span class="team-card-branch-badge">' + escapeHtml(member.branch) + ' Branch</span>' +
        '<h3 class="team-card-name">' + escapeHtml(member.fullName) + '</h3>' +
        '<p class="team-card-role">' + escapeHtml(member.role) + '</p>' +
        '<p class="team-card-bio">' + escapeHtml(member.bio) + '</p>' +
        '<div class="team-card-actions">' +
          '<a href="tel:' + encodeURIComponent(cleanPhone) + '" class="team-card-btn team-card-btn--call" aria-label="Call ' + escapeHtml(member.fullName) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
              '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />' +
            '</svg>' +
            'Call' +
          '</a>' +
          '<a href="https://wa.me/' + encodeURIComponent(cleanWa) + '" target="_blank" rel="noopener" class="team-card-btn team-card-btn--whatsapp" aria-label="WhatsApp ' + escapeHtml(member.fullName) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
              '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />' +
            '</svg>' +
            'WhatsApp' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</article>'
  );

  var overlay = byId('previewModalOverlay');
  if (overlay) overlay.classList.add('active');
  var prevClose = byId('btnPrevClose');
  if (prevClose) prevClose.focus();
}

function closePreviewModal() {
  var overlay = byId('previewModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

// Toast Messages
function showToast(msg) {
  var toast = byId('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('show');

  setTimeout(function () {
    toast.classList.remove('show');
  }, 3500);
}
