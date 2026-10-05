/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - AUTH GUARD
   Reusable protection for admin pages.
   ============================================================ */

(function initAuthGuard() {
  var LOGIN_PAGE = 'login.html';
  var STAFF_PROFILE_STORAGE_KEY = 'hilltopCurrentUser';
  var supabaseClient = null;

  function currentPageName() {
    var path = window.location.pathname || '';
    return path.split('/').pop() || 'admin-dashboard.html';
  }

  function redirectToLogin(reason) {
    if (currentPageName() !== LOGIN_PAGE) {
      var destination = LOGIN_PAGE;
      if (reason) {
        destination += '?reason=' + encodeURIComponent(reason);
      }

      window.location.href = destination;
    }
  }

  function clearStoredProfile() {
    window.hilltopCurrentUser = null;

    try {
      sessionStorage.removeItem(STAFF_PROFILE_STORAGE_KEY);
    } catch (error) {
      console.info('Unable to clear stored staff profile.', error);
    }
  }

  function storeProfile(profile) {
    window.hilltopCurrentUser = profile;

    try {
      sessionStorage.setItem(STAFF_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.info('Unable to store staff profile in sessionStorage.', error);
    }
  }

  function formatRole(role) {
    if (!role) return 'Staff';

    return role
      .split('_')
      .map(function(part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function getFirstName(fullName) {
    if (!fullName) return 'Admin';
    return fullName.trim().split(/\s+/)[0] || 'Admin';
  }

  function updateStaffLabels(profile) {
    var adminNameElements = document.querySelectorAll('.admin-name');
    var adminRoleElements = document.querySelectorAll('.admin-role');
    var welcomeMessages = document.querySelectorAll('.welcome-msg strong');

    adminNameElements.forEach(function(element) {
      element.textContent = profile.full_name || 'Admin User';
    });

    adminRoleElements.forEach(function(element) {
      element.textContent = formatRole(profile.role);
    });

    welcomeMessages.forEach(function(element) {
      element.textContent = getFirstName(profile.full_name);
    });
  }

  function waitForSupabaseClient() {
    return new Promise(function(resolve) {
      var attempts = 0;
      var maxAttempts = 40;

      function checkClient() {
        if (window.hilltopSupabase) {
          resolve(window.hilltopSupabase);
          return;
        }

        attempts += 1;

        if (attempts >= maxAttempts) {
          resolve(null);
          return;
        }

        window.setTimeout(checkClient, 50);
      }

      checkClient();
    });
  }

  async function signOutAndRedirect(reason) {
    clearStoredProfile();

    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        console.warn('Sign-out failed while blocking access. Returning to login anyway.', error);
      }
    }

    redirectToLogin(reason);
  }

  function membershipWorkspace(membership) {
    var workspace = membership && membership.demo_workspaces;
    if (Array.isArray(workspace)) workspace = workspace[0] || null;
    return workspace;
  }

  async function loadActiveMembership(session) {
    var membershipResponse = await supabaseClient
      .from('demo_workspace_memberships')
      .select('workspace_id, role, status, is_current, demo_workspaces!inner(id, name, slug, status)')
      .eq('auth_user_id', session.user.id)
      .eq('status', 'active')
      .eq('is_current', true)
      .maybeSingle();

    if (membershipResponse.error) {
      console.warn('Unable to load the current demo workspace membership.', membershipResponse.error);
      return null;
    }

    var membership = membershipResponse.data;
    var workspace = membershipWorkspace(membership);
    if (membership && workspace && workspace.status === 'active') return membership;

    // A workspace can be archived by another administrator while this user is
    // away. Recover to their oldest remaining active membership before the
    // workspace module starts, instead of treating that lifecycle event as an
    // authentication failure and signing the user out.
    var fallbackResponse = await supabaseClient
      .from('demo_workspace_memberships')
      .select('workspace_id, role, status, is_current, created_at, demo_workspaces!inner(id, name, slug, status)')
      .eq('auth_user_id', session.user.id)
      .eq('status', 'active')
      .eq('demo_workspaces.status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackResponse.error || !fallbackResponse.data) {
      if (fallbackResponse.error) {
        console.warn('Unable to find an active fallback demo workspace.', fallbackResponse.error);
      }
      return null;
    }

    var switchResponse = await supabaseClient.rpc('switch_demo_workspace', {
      p_workspace_id: fallbackResponse.data.workspace_id
    });
    if (switchResponse.error) {
      console.warn('Unable to recover the active demo workspace.', switchResponse.error);
      return null;
    }

    fallbackResponse.data.is_current = true;
    return fallbackResponse.data;
  }

  async function loadStaffProfile(session) {
    var membership = await loadActiveMembership(session);
    var workspace = membershipWorkspace(membership);
    if (!membership || !workspace || workspace.status !== 'active') return null;

    var response = await supabaseClient
      .from('staff_users')
      .select('id, full_name, email, phone, role, branch_id, is_active')
      .eq('auth_user_id', session.user.id)
      .eq('workspace_id', membership.workspace_id)
      .maybeSingle();

    if (response.error) {
      console.warn('Unable to load linked Hilltop staff profile.', response.error);
      return null;
    }

    var staff = response.data || {};
    return {
      id: staff.id || null,
      full_name: staff.full_name || (session.user.user_metadata || {}).full_name || session.user.email || 'Admin User',
      email: staff.email || session.user.email || '',
      phone: staff.phone || null,
      role: membership.role,
      branch_id: staff.branch_id || null,
      is_active: staff.is_active !== false,
      workspace_id: membership.workspace_id,
      workspace_name: workspace.name,
      workspace_slug: workspace.slug
    };
  }

  async function requireLogin() {
    supabaseClient = await waitForSupabaseClient();

    if (!supabaseClient) {
      console.warn('Supabase client is not available. Redirecting to login.');
      clearStoredProfile();
      redirectToLogin();
      return;
    }

    try {
      var response = await supabaseClient.auth.getSession();

      if (response.error) {
        console.warn('Unable to verify login session. Redirecting to login.', response.error);
        clearStoredProfile();
        redirectToLogin();
        return;
      }

      if (!response.data || !response.data.session) {
        console.info('No active Supabase session found. Redirecting to login.');
        clearStoredProfile();
        redirectToLogin();
        return;
      }

      var profile = await loadStaffProfile(response.data.session);

      if (!profile) {
        console.warn('Signed-in user is not linked to an active Hilltop staff profile.');
        await signOutAndRedirect('staff_missing');
        return;
      }

      if (!profile.is_active) {
        console.warn('Signed-in Hilltop staff profile is inactive.');
        await signOutAndRedirect('inactive');
        return;
      }

      storeProfile(profile);
      updateStaffLabels(profile);
      console.info('Hilltop staff profile loaded for:', profile.email);
    } catch (error) {
      console.warn('Unable to verify login session. Redirecting to login.', error);
      clearStoredProfile();
      redirectToLogin();
    }
  }

  async function refreshCurrentProfile() {
    supabaseClient = supabaseClient || await waitForSupabaseClient();
    if (!supabaseClient) return null;

    var response = await supabaseClient.auth.getSession();
    if (response.error || !response.data || !response.data.session) return null;

    var profile = await loadStaffProfile(response.data.session);
    if (!profile || !profile.is_active) return null;

    storeProfile(profile);
    updateStaffLabels(profile);
    return profile;
  }

  async function logout() {
    supabaseClient = supabaseClient || window.hilltopSupabase;
    clearStoredProfile();

    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        console.warn('Logout failed, returning to login anyway.', error);
      }
    }

    window.location.href = LOGIN_PAGE;
  }

  window.hilltopLogout = logout;
  window.logout = logout;
  window.hilltopRefreshStaffProfile = refreshCurrentProfile;

  document.querySelectorAll('[data-logout-button]').forEach(function(button) {
    button.addEventListener('click', logout);
  });

  if (currentPageName() !== LOGIN_PAGE) {
    window.hilltopAuthReady = requireLogin();
  } else {
    window.hilltopAuthReady = Promise.resolve(null);
  }
})();
