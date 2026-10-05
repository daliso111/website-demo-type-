/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - PASSWORD RECOVERY
   ============================================================ */

(function initResetPasswordPage() {
  var supabaseClient = window.hilltopSupabase;
  var form = document.getElementById('resetPasswordForm');
  var newPasswordInput = document.getElementById('newPassword');
  var confirmPasswordInput = document.getElementById('confirmPassword');
  var submitBtn = document.getElementById('resetSubmit');
  var messageBox = document.getElementById('resetMessage');
  var resetIntro = document.getElementById('resetIntro');
  var recoveryReady = false;

  function showMessage(message, isSuccess) {
    messageBox.textContent = message;
    messageBox.classList.toggle('success', Boolean(isSuccess));
    messageBox.classList.add('show');
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('loading', isLoading);
  }

  function hasRecoveryTypeInUrl() {
    var hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var query = new URLSearchParams(window.location.search);
    return hash.get('type') === 'recovery' || query.get('type') === 'recovery';
  }

  function isAuthErrorInUrl() {
    var hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var query = new URLSearchParams(window.location.search);
    return Boolean(hash.get('error') || query.get('error') || hash.get('error_description') || query.get('error_description'));
  }

  function showExpiredState() {
    form.hidden = true;
    resetIntro.textContent = 'This password reset link is missing, invalid, or has expired.';
    showMessage('Request a new reset link to continue.', false);
  }

  function showForm() {
    form.hidden = false;
    messageBox.classList.remove('show', 'success');
  }

  function wirePasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        var input = document.getElementById(toggle.dataset.target);
        var shouldShow = input.type === 'password';
        input.type = shouldShow ? 'text' : 'password';
        toggle.textContent = shouldShow ? 'Hide' : 'Show';
        toggle.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
      });
    });
  }

  async function validateRecoverySession() {
    if (!supabaseClient || isAuthErrorInUrl() || !hasRecoveryTypeInUrl()) {
      showExpiredState();
      return;
    }

    var sessionResult = await supabaseClient.auth.getSession();
    if (!sessionResult.data || !sessionResult.data.session) {
      showExpiredState();
      return;
    }

    recoveryReady = true;
    showForm();
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(function(event, session) {
      if (event === 'PASSWORD_RECOVERY' && session) {
        recoveryReady = true;
        showForm();
      }
    });
  }

  wirePasswordToggles();
  validateRecoverySession().catch(function() {
    showExpiredState();
  });

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    messageBox.classList.remove('show', 'success');

    if (!recoveryReady) {
      showExpiredState();
      return;
    }

    var newPassword = newPasswordInput.value;
    var confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 8) {
      showMessage('Your new password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      var response = await supabaseClient.auth.updateUser({ password: newPassword });
      if (response.error) {
        showMessage(response.error.message || 'Unable to update your password. Please request a new reset link.');
        return;
      }

      form.hidden = true;
      showMessage('Your password has been changed successfully. Redirecting to sign in...', true);
      try {
        await supabaseClient.auth.signOut();
      } catch (signOutError) {
        // The password is already changed; continue to the sign-in page even if cleanup fails.
        console.info('Recovery session cleanup could not be confirmed.', signOutError);
      }
      window.setTimeout(function() {
        window.location.replace('login.html?reason=password_reset');
      }, 1200);
    } catch (error) {
      showMessage('Unable to update your password. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  });
})();
