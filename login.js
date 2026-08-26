/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - LOGIN
   ============================================================ */

(function initLoginPage() {
  var supabaseClient = window.hilltopSupabase;
  var form = document.getElementById('loginForm');
  var emailInput = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');
  var submitBtn = document.getElementById('loginSubmit');
  var errorBox = document.getElementById('loginError');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('show');
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.remove('show');
  }

  function showRedirectReasonMessage() {
    var params = new URLSearchParams(window.location.search);
    var reason = params.get('reason');

    if (reason === 'staff_missing') {
      showError('Your login exists, but no active Hilltop staff profile is linked to this account. Please contact the system administrator.');
      return;
    }

    if (reason === 'inactive') {
      showError('Your staff account is inactive. Please contact the system administrator.');
      return;
    }

    if (reason === 'session_expired') {
      showError('Your session has expired. Please sign in again.');
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('loading', isLoading);
  }

  function isOpenedDirectlyFromFile() {
    return window.location.protocol === 'file:';
  }

  async function redirectIfAlreadyLoggedIn() {
    if (!supabaseClient) return;

    try {
      var result = await supabaseClient.auth.getSession();
      if (result.data && result.data.session) {
        window.location.href = 'admin-dashboard.html';
      }
    } catch (error) {
      console.info('Unable to check existing session.', error);
    }
  }

  if (!supabaseClient) {
    console.info('Supabase client is not ready yet. The login form will show an error only if sign-in is attempted.');
  }

  showRedirectReasonMessage();
  redirectIfAlreadyLoggedIn();

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    clearError();

    if (isOpenedDirectlyFromFile()) {
      showError('Please open login.html using VS Code Live Server, for example http://127.0.0.1:5500/login.html. Supabase login will not work correctly from file://.');
      return;
    }

    if (!supabaseClient) {
      showError('Supabase is not ready yet. Check that the CDN script loads before supabase-config.js and that your URL/key placeholders have been replaced.');
      return;
    }

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      var response = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (response.error) {
        showError(response.error.message || 'Login failed. Please check your details and try again.');
        return;
      }

      window.location.href = 'admin-dashboard.html';
    } catch (error) {
      showError('Unable to reach Supabase. Check your internet connection, Supabase project URL, and make sure you are using Live Server.');
    } finally {
      setLoading(false);
    }
  });
})();
