/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - PASSWORD RESET REQUEST
   ============================================================ */

(function initForgotPasswordPage() {
  var supabaseClient = window.hilltopSupabase;
  var form = document.getElementById('forgotPasswordForm');
  var emailInput = document.getElementById('forgotEmail');
  var submitBtn = document.getElementById('forgotSubmit');
  var messageBox = document.getElementById('forgotError');

  function showMessage(message, isSuccess) {
    messageBox.textContent = message;
    messageBox.classList.toggle('success', Boolean(isSuccess));
    messageBox.classList.add('show');
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('loading', isLoading);
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    messageBox.classList.remove('show', 'success');

    if (!supabaseClient) {
      showMessage('Supabase is not ready yet. Please refresh and try again.');
      return;
    }

    var email = emailInput.value.trim();
    if (!email || !emailInput.validity.valid) {
      showMessage('Enter a valid admin email address.');
      return;
    }

    setLoading(true);
    try {
      var response = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      });

      if (response.error) {
        showMessage(response.error.message || 'Unable to send a reset link. Please try again.');
        return;
      }

      showMessage('If an account exists for that email, a password reset link has been sent.', true);
    } catch (error) {
      showMessage('Unable to reach Supabase. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });
})();
