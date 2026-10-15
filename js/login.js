/**
 * EcoCycle: Login & Registration Controller
 * Manages Supabase Auth, role selection, passcode validation, and page routing.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const supabase = window.ecocycle?.supabase;
  if (!supabase) {
    showAlert('Supabase client could not be initialized. Please check network connection.', 'error');
    return;
  }

  // If already logged in, check role and auto-redirect
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    } else {
      window.location.href = 'my-pickups.html';
      return;
    }
  }

  // UI Element References
  const form = document.getElementById('auth-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const submitBtn = document.getElementById('auth-submit-btn');
  const alertBox = document.getElementById('auth-alert');

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const switchModeBtn = document.getElementById('switch-mode-btn');
  const switchPrompt = document.getElementById('switch-prompt');

  const headerIcon = document.getElementById('auth-header-icon');
  const titleEl = document.getElementById('auth-title');
  const subtitleEl = document.getElementById('auth-subtitle');

  const registerRoleSection = document.getElementById('register-role-section');
  const roleUserBtn = document.getElementById('role-user-btn');
  const roleAdminBtn = document.getElementById('role-admin-btn');
  const adminPasscodeField = document.getElementById('admin-passcode-field');
  const adminPasscodeInput = document.getElementById('admin-passcode');

  // State
  let isSignUp = false;
  let selectedRole = 'user';
  const DEMO_ADMIN_KEY = 'ECOADMIN2025';

  // Toggle Mode
  function setMode(signUp) {
    isSignUp = signUp;
    hideAlert();

    if (isSignUp) {
      tabRegister.style.background = 'white';
      tabRegister.style.color = 'var(--slate-800)';
      tabRegister.style.boxShadow = 'var(--shadow-sm)';

      tabLogin.style.background = 'transparent';
      tabLogin.style.color = 'var(--slate-600)';
      tabLogin.style.boxShadow = 'none';

      headerIcon.textContent = '🌱';
      titleEl.textContent = 'Create EcoCycle Account';
      subtitleEl.textContent = 'Join our green community to schedule pickups and track your impact.';
      submitBtn.textContent = 'Create My Account';
      switchPrompt.textContent = 'Already have an account?';
      switchModeBtn.textContent = 'Sign In';

      registerRoleSection.style.display = 'block';
    } else {
      tabLogin.style.background = 'white';
      tabLogin.style.color = 'var(--slate-800)';
      tabLogin.style.boxShadow = 'var(--shadow-sm)';

      tabRegister.style.background = 'transparent';
      tabRegister.style.color = 'var(--slate-600)';
      tabRegister.style.boxShadow = 'none';

      headerIcon.textContent = '🔐';
      titleEl.textContent = 'Welcome Back';
      subtitleEl.textContent = 'Log in to manage your e-waste requests and locate centers.';
      submitBtn.textContent = 'Sign In to EcoCycle';
      switchPrompt.textContent = "Don't have an account yet?";
      switchModeBtn.textContent = 'Create Account';

      registerRoleSection.style.display = 'none';
    }
  }

  // Toggle Role (during Sign Up)
  function setRole(role) {
    selectedRole = role;
    if (selectedRole === 'admin') {
      roleAdminBtn.style.background = 'var(--accent)';
      roleAdminBtn.style.color = 'white';
      roleAdminBtn.classList.remove('btn-outline');

      roleUserBtn.style.background = 'white';
      roleUserBtn.style.color = 'var(--slate-700)';
      roleUserBtn.classList.add('btn-outline');

      adminPasscodeField.style.display = 'block';
    } else {
      roleUserBtn.style.background = 'var(--primary)';
      roleUserBtn.style.color = 'white';
      roleUserBtn.classList.remove('btn-outline');

      roleAdminBtn.style.background = 'white';
      roleAdminBtn.style.color = 'var(--slate-700)';
      roleAdminBtn.classList.add('btn-outline');

      adminPasscodeField.style.display = 'none';
    }
  }

  // Event Listeners for switching
  tabLogin?.addEventListener('click', () => setMode(false));
  tabRegister?.addEventListener('click', () => setMode(true));
  switchModeBtn?.addEventListener('click', () => setMode(!isSignUp));

  roleUserBtn?.addEventListener('click', () => setRole('user'));
  roleAdminBtn?.addEventListener('click', () => setRole('admin'));

  // Alert Helpers
  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
    alertBox.style.display = 'flex';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  // Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert('Please enter both email and password.', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long.', 'error');
      return;
    }

    // Admin passcode verification during registration
    if (isSignUp && selectedRole === 'admin') {
      const passcode = adminPasscodeInput.value.trim();
      if (passcode !== DEMO_ADMIN_KEY) {
        showAlert(`Invalid Admin Passcode! Use demo passcode: "${DEMO_ADMIN_KEY}" or register as a Regular User.`, 'error');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      if (isSignUp) {
        // Register user via Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: selectedRole }
          }
        });

        if (error) throw error;

        // Ensure row in public.profiles table
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            role: selectedRole
          });
        }

        showAlert('Account registered successfully! Redirecting...', 'success');

        setTimeout(() => {
          if (selectedRole === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'my-pickups.html';
          }
        }, 1200);

      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Check user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'user';
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        if (role === 'admin') {
          window.location.href = 'admin.html';
        } else if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = 'my-pickups.html';
        }
      }
    } catch (err) {
      console.error('Auth Error:', err);
      showAlert(err.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Create My Account' : 'Sign In to EcoCycle';
    }
  });
});
