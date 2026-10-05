/* ============================================================
   ITHACA DEMO WORKSPACES - SHARED ADMIN CONTEXT
   The database current-membership and RLS policies are authoritative.
   localStorage only restores the administrator's preferred workspace.
   ============================================================ */

(function initDemoWorkspaces(root) {
  'use strict';

  var STORAGE_PREFIX = 'ithaca.activeWorkspace.';
  var CREATE_VALUE = '__create_workspace__';
  var state = {
    userId: null,
    workspaces: [],
    active: null,
    role: null,
    loading: true,
    switching: false
  };
  var readyPromise = initialize();

  function getClient() {
    return root.hilltopSupabase || null;
  }

  function storageKey() {
    return STORAGE_PREFIX + (state.userId || 'anonymous');
  }

  function readPersistedWorkspaceId() {
    try {
      return root.localStorage.getItem(storageKey());
    } catch (error) {
      console.info('Workspace preference could not be read.', error);
      return null;
    }
  }

  function persistWorkspaceId(workspaceId) {
    try {
      root.localStorage.setItem(storageKey(), workspaceId);
    } catch (error) {
      console.info('Workspace preference could not be saved.', error);
    }
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 80);
  }

  function validateName(value) {
    var name = String(value || '').trim();
    if (name.length < 2 || name.length > 120) {
      return 'Workspace name must contain 2 to 120 characters.';
    }
    return '';
  }

  function validateSlug(value) {
    var slug = String(value || '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
      return 'Use lowercase letters, numbers, and single hyphens only.';
    }
    return '';
  }

  function emit(name, detail) {
    if (typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent(name, { detail: detail || {} }));
    }
  }

  function normalizeMembership(row) {
    var workspace = row.demo_workspaces || row.workspace || null;
    if (Array.isArray(workspace)) workspace = workspace[0] || null;
    if (!workspace) return null;
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      status: workspace.status,
      role: row.role,
      isCurrent: row.is_current === true
    };
  }

  async function fetchMemberships() {
    var response = await getClient()
      .from('demo_workspace_memberships')
      .select('workspace_id, role, status, is_current, demo_workspaces!inner(id, name, slug, status)')
      .eq('auth_user_id', state.userId)
      .eq('status', 'active');

    if (response.error) throw response.error;

    return (response.data || [])
      .map(normalizeMembership)
      .filter(function(workspace) { return workspace && workspace.status === 'active'; })
      .sort(function(a, b) { return a.name.localeCompare(b.name); });
  }

  async function initialize() {
    var client = getClient();
    if (!client) {
      state.loading = false;
      return null;
    }

    try {
      if (root.hilltopAuthReady && typeof root.hilltopAuthReady.then === 'function') {
        await root.hilltopAuthReady;
      }
      var sessionResult = await client.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (sessionResult.error) throw sessionResult.error;
      if (!session) {
        state.loading = false;
        return null;
      }

      state.userId = session.user.id;
      state.workspaces = await fetchMemberships();
      if (!state.workspaces.length) {
        throw new Error('No active demo workspace is assigned to this account.');
      }

      var persistedId = readPersistedWorkspaceId();
      var current = state.workspaces.find(function(item) { return item.isCurrent; }) || null;
      var preferred = state.workspaces.find(function(item) { return item.id === persistedId; }) || current || state.workspaces[0];

      if (!current || current.id !== preferred.id) {
        var switchResult = await client.rpc('switch_demo_workspace', { p_workspace_id: preferred.id });
        if (switchResult.error) throw switchResult.error;

        // The auth guard resolves the database-current staff profile before
        // this module restores the locally preferred workspace. Refresh it
        // immediately after the RPC so audit/updated_by foreign keys never
        // retain a staff id from the previous workspace.
        if (root.hilltopCurrentUser) {
          root.hilltopCurrentUser.role = preferred.role;
          root.hilltopCurrentUser.workspace_id = preferred.id;
          root.hilltopCurrentUser.id = null;
          root.hilltopCurrentUser.branch_id = null;
        }
        if (typeof root.hilltopRefreshStaffProfile === 'function') {
          await root.hilltopRefreshStaffProfile();
        }
      }

      state.workspaces.forEach(function(item) { item.isCurrent = item.id === preferred.id; });
      state.active = preferred;
      state.role = preferred.role;
      state.loading = false;
      persistWorkspaceId(preferred.id);
      renderSelector();
      emit('hilltop:workspace-ready', { workspace: preferred });
      return preferred;
    } catch (error) {
      state.loading = false;
      renderSelector(error);
      console.error('Workspace initialization failed.', error);
      emit('hilltop:workspace-error', { error: error });
      throw error;
    }
  }

  function getActiveWorkspace() {
    return state.active;
  }

  function requireActiveWorkspace() {
    if (!state.active || !state.active.id) {
      throw new Error('An active workspace is required.');
    }
    return state.active;
  }

  function withWorkspace(payload) {
    var workspace = requireActiveWorkspace();
    return Object.assign({}, payload || {}, { workspace_id: workspace.id });
  }

  function scope(query, column) {
    var workspace = requireActiveWorkspace();
    return query.eq(column || 'workspace_id', workspace.id);
  }

  function storagePath(path) {
    var workspace = requireActiveWorkspace();
    return workspace.id + '/' + String(path || '').replace(/^\/+/, '');
  }

  async function switchWorkspace(workspaceId) {
    if (state.switching || !workspaceId || workspaceId === CREATE_VALUE) return state.active;
    var target = state.workspaces.find(function(item) { return item.id === workspaceId; });
    if (!target || target.status !== 'active') throw new Error('That workspace is unavailable.');
    if (state.active && target.id === state.active.id) return state.active;

    state.switching = true;
    emit('hilltop:workspace-changing', { previous: state.active, next: target });
    setSelectorDisabled(true);

    try {
      var response = await getClient().rpc('switch_demo_workspace', { p_workspace_id: target.id });
      if (response.error) throw response.error;

      state.workspaces.forEach(function(item) { item.isCurrent = item.id === target.id; });
      state.active = target;
      state.role = target.role;
      persistWorkspaceId(target.id);
      if (root.hilltopCurrentUser) {
        root.hilltopCurrentUser.role = target.role;
        root.hilltopCurrentUser.workspace_id = target.id;
        root.hilltopCurrentUser.id = null;
        root.hilltopCurrentUser.branch_id = null;
      }
      if (typeof root.hilltopRefreshStaffProfile === 'function') {
        await root.hilltopRefreshStaffProfile();
      }
      renderSelector();
      emit('hilltop:workspace-changed', { workspace: target });
      return target;
    } catch (error) {
      renderSelector(error);
      emit('hilltop:workspace-switch-failed', { error: error, workspace: target });
      throw error;
    } finally {
      state.switching = false;
      setSelectorDisabled(false);
    }
  }

  async function createWorkspace(input) {
    var name = String(input && input.name || '').trim();
    var slug = String(input && input.slug || '').trim().toLowerCase();
    var nameError = validateName(name);
    var slugError = validateSlug(slug);
    if (nameError || slugError) throw new Error(nameError || slugError);
    if (state.workspaces.some(function(item) { return item.slug === slug; })) {
      throw new Error('A workspace with this slug already exists.');
    }

    var response = await getClient().rpc('create_demo_workspace', {
      p_name: name,
      p_slug: slug
    });
    if (response.error) {
      if (response.error.code === '23505' || /already exists|duplicate/i.test(response.error.message || '')) {
        throw new Error('A workspace with this slug already exists.');
      }
      throw response.error;
    }

    emit('hilltop:workspace-changing', { previous: state.active, creating: true });
    state.workspaces = await fetchMemberships();
    var created = state.workspaces.find(function(item) {
      return response.data && item.id === response.data.id;
    }) || state.workspaces.find(function(item) { return item.slug === slug; });

    if (!created) throw new Error('Workspace created, but it is not active in the selector.');
    state.workspaces.forEach(function(item) { item.isCurrent = item.id === created.id; });
    state.active = created;
    state.role = created.role;
    persistWorkspaceId(created.id);
    if (typeof root.hilltopRefreshStaffProfile === 'function') {
      await root.hilltopRefreshStaffProfile();
    }
    renderSelector();
    closeCreateDialog();
    emit('hilltop:workspace-changed', { workspace: created, created: true });
    return created;
  }

  async function archiveWorkspace(workspaceId) {
    var target = state.workspaces.find(function(item) { return item.id === workspaceId; });
    if (!target) throw new Error('That workspace is unavailable.');

    var response = await getClient().rpc('archive_demo_workspace', {
      p_workspace_id: target.id
    });
    if (response.error) throw response.error;

    emit('hilltop:workspace-changing', { previous: state.active, archiving: target });
    state.workspaces = await fetchMemberships();
    var current = state.workspaces.find(function(item) { return item.isCurrent; }) || state.workspaces[0] || null;
    if (!current) throw new Error('No active demo workspace remains available.');

    state.active = current;
    state.role = current.role;
    persistWorkspaceId(current.id);
    if (typeof root.hilltopRefreshStaffProfile === 'function') {
      await root.hilltopRefreshStaffProfile();
    }
    renderSelector();
    emit('hilltop:workspace-changed', { workspace: current, archived: target });
    return response.data;
  }

  function ensureUi() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar || document.getElementById('workspaceSwitcher')) return;

    var brand = sidebar.querySelector('.sidebar-brand');
    var container = document.createElement('section');
    container.id = 'workspaceSwitcher';
    container.className = 'workspace-switcher';
    container.setAttribute('aria-label', 'Current workspace');
    container.innerHTML = [
      '<label class="workspace-switcher__label" for="workspaceSelect">Current Workspace</label>',
      '<div class="workspace-switcher__control">',
        '<span class="workspace-switcher__dot" aria-hidden="true"></span>',
        '<select id="workspaceSelect" class="workspace-switcher__select" aria-label="Select workspace"></select>',
      '</div>',
      '<p class="workspace-switcher__status" id="workspaceStatus" aria-live="polite"></p>'
    ].join('');

    if (brand) sidebar.insertBefore(container, brand.nextSibling);
    else sidebar.insertBefore(container, sidebar.firstChild);

    container.querySelector('#workspaceSelect').addEventListener('change', function(event) {
      if (event.target.value === CREATE_VALUE) {
        event.target.value = state.active ? state.active.id : '';
        openCreateDialog();
        return;
      }
      switchWorkspace(event.target.value).catch(function(error) {
        setWorkspaceStatus(error.message || 'Workspace could not be changed.', true);
      });
    });

    ensureCreateDialog();
  }

  function renderSelector(error) {
    ensureUi();
    var select = document.getElementById('workspaceSelect');
    if (!select) return;
    select.innerHTML = '';

    state.workspaces.forEach(function(workspace) {
      var option = document.createElement('option');
      option.value = workspace.id;
      option.textContent = workspace.name;
      option.selected = Boolean(state.active && state.active.id === workspace.id);
      select.appendChild(option);
    });

    if (state.role === 'super_admin') {
      var divider = document.createElement('option');
      divider.disabled = true;
      divider.textContent = '──────────';
      select.appendChild(divider);
      var createOption = document.createElement('option');
      createOption.value = CREATE_VALUE;
      createOption.textContent = '+ Create Workspace';
      select.appendChild(createOption);
    }

    select.disabled = state.loading || state.switching || !state.workspaces.length;
    setWorkspaceStatus(error ? (error.message || 'Workspace unavailable.') : '', Boolean(error));
  }

  function setSelectorDisabled(disabled) {
    var select = document.getElementById('workspaceSelect');
    if (select) select.disabled = disabled;
  }

  function setWorkspaceStatus(message, isError) {
    var status = document.getElementById('workspaceStatus');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function ensureCreateDialog() {
    if (document.getElementById('workspaceCreateDialog')) return;
    var dialog = document.createElement('div');
    dialog.id = 'workspaceCreateDialog';
    dialog.className = 'workspace-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'workspaceCreateTitle');
    dialog.innerHTML = [
      '<div class="workspace-dialog__card">',
        '<div class="workspace-dialog__header">',
          '<div><p class="workspace-dialog__eyebrow">Demo Workspaces</p><h2 id="workspaceCreateTitle">Create Workspace</h2>',
          '<p>Start a clean, isolated company environment.</p></div>',
          '<button type="button" class="workspace-dialog__close" data-workspace-close aria-label="Close">&times;</button>',
        '</div>',
        '<form id="workspaceCreateForm" novalidate>',
          '<label>Workspace Name<input id="workspaceName" name="name" maxlength="120" autocomplete="off" required></label>',
          '<label>Workspace Slug<input id="workspaceSlug" name="slug" maxlength="80" autocomplete="off" required><small>Lowercase letters, numbers, and hyphens.</small></label>',
          '<p class="workspace-dialog__error" id="workspaceCreateError" role="alert"></p>',
          '<div class="workspace-dialog__actions"><button type="button" class="workspace-button workspace-button--secondary" data-workspace-close>Cancel</button>',
          '<button type="submit" class="workspace-button workspace-button--primary" id="workspaceCreateSubmit">Create Workspace</button></div>',
        '</form>',
      '</div>'
    ].join('');
    document.body.appendChild(dialog);

    var nameInput = dialog.querySelector('#workspaceName');
    var slugInput = dialog.querySelector('#workspaceSlug');
    slugInput.dataset.workspaceEdited = 'false';
    slugInput.addEventListener('input', function() { slugInput.dataset.workspaceEdited = 'true'; });
    nameInput.addEventListener('input', function() {
      if (slugInput.dataset.workspaceEdited !== 'true' || !slugInput.value) {
        slugInput.value = slugify(nameInput.value);
      }
    });
    dialog.querySelectorAll('[data-workspace-close]').forEach(function(button) {
      button.addEventListener('click', closeCreateDialog);
    });
    dialog.addEventListener('click', function(event) {
      if (event.target === dialog) closeCreateDialog();
    });
    dialog.querySelector('#workspaceCreateForm').addEventListener('submit', async function(event) {
      event.preventDefault();
      var errorNode = dialog.querySelector('#workspaceCreateError');
      var submit = dialog.querySelector('#workspaceCreateSubmit');
      errorNode.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Creating...';
      try {
        await createWorkspace({
          name: nameInput.value,
          slug: slugInput.value
        });
      } catch (error) {
        errorNode.textContent = error.message || 'Workspace could not be created.';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Create Workspace';
      }
    });
  }

  function openCreateDialog() {
    ensureCreateDialog();
    var dialog = document.getElementById('workspaceCreateDialog');
    var form = document.getElementById('workspaceCreateForm');
    if (form) form.reset();
    var slugInput = document.getElementById('workspaceSlug');
    if (slugInput) slugInput.dataset.workspaceEdited = 'false';
    document.getElementById('workspaceCreateError').textContent = '';
    dialog.classList.add('is-open');
    document.body.classList.add('workspace-dialog-open');
    root.setTimeout(function() { document.getElementById('workspaceName').focus(); }, 20);
  }

  function closeCreateDialog() {
    var dialog = document.getElementById('workspaceCreateDialog');
    if (dialog) dialog.classList.remove('is-open');
    document.body.classList.remove('workspace-dialog-open');
  }

  root.HilltopWorkspace = Object.freeze({
    ready: function() { return readyPromise; },
    getActive: getActiveWorkspace,
    getWorkspaces: function() { return state.workspaces.slice(); },
    getRole: function() { return state.role; },
    switchTo: switchWorkspace,
    create: createWorkspace,
    archive: archiveWorkspace,
    scope: scope,
    withWorkspace: withWorkspace,
    storagePath: storagePath,
    slugify: slugify,
    validateName: validateName,
    validateSlug: validateSlug
  });
})(window);
