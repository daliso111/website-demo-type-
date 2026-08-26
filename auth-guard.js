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

  async function loadStaffProfile(session) {
    var response = await supabaseClient
      .from('staff_users')
      .select('id, full_name, email, phone, role, branch_id, is_active')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    if (response.error) {
      console.warn('Unable to load linked Hilltop staff profile.', response.error);
      return null;
    }

    return response.data || null;
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

  document.querySelectorAll('[data-logout-button]').forEach(function(button) {
    button.addEventListener('click', logout);
  });

  if (currentPageName() !== LOGIN_PAGE) {
    requireLogin();
  }
})();
