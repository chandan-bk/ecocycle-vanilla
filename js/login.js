/**
 * EcoCycle: Login & Registration Controller
 * Manages Supabase Auth, role selection, passcode validation, and page routing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
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

  // Alert Helpers (declared early so they are available immediately)
  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
    alertBox.style.display = 'flex';
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  // Toggle Mode (Sign In vs Create Account)
  function setMode(signUp) {
    isSignUp = signUp;
    hideAlert();

    if (isSignUp) {
      if (tabRegister) {
        tabRegister.style.background = 'white';
        tabRegister.style.color = 'var(--slate-800)';
        tabRegister.style.boxShadow = 'var(--shadow-sm)';
      }
      if (tabLogin) {
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--slate-600)';
        tabLogin.style.boxShadow = 'none';
      }

      if (headerIcon) headerIcon.innerHTML = '<i data-lucide="sprout"></i>';
      if (titleEl) titleEl.textContent = 'Create EcoCycle Account';
      if (subtitleEl) subtitleEl.textContent = 'Join our green community to schedule pickups and track your impact.';
      if (submitBtn) submitBtn.innerHTML = '<i data-lucide="user-plus"></i> Create My Account';
      if (switchPrompt) switchPrompt.textContent = 'Already have an account?';
      if (switchModeBtn) switchModeBtn.textContent = 'Sign In';

      if (registerRoleSection) registerRoleSection.style.display = 'block';
    } else {
      if (tabLogin) {
        tabLogin.style.background = 'white';
        tabLogin.style.color = 'var(--slate-800)';
        tabLogin.style.boxShadow = 'var(--shadow-sm)';
      }
      if (tabRegister) {
        tabRegister.style.background = 'transparent';
        tabRegister.style.color = 'var(--slate-600)';
        tabRegister.style.boxShadow = 'none';
      }

      if (headerIcon) headerIcon.innerHTML = '<i data-lucide="lock"></i>';
      if (titleEl) titleEl.textContent = 'Welcome Back';
      if (subtitleEl) subtitleEl.textContent = 'Log in to manage your e-waste requests and locate centers.';
      if (submitBtn) submitBtn.innerHTML = '<i data-lucide="log-in"></i> Sign In to EcoCycle';
      if (switchPrompt) switchPrompt.textContent = "Don't have an account yet?";
      if (switchModeBtn) switchModeBtn.textContent = 'Create Account';

      if (registerRoleSection) registerRoleSection.style.display = 'none';
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Toggle Role (during Sign Up)
  function setRole(role) {
    selectedRole = role;
    if (selectedRole === 'admin') {
      if (roleAdminBtn) {
        roleAdminBtn.style.background = 'var(--accent)';
        roleAdminBtn.style.color = 'white';
        roleAdminBtn.classList.remove('btn-outline');
      }
      if (roleUserBtn) {
        roleUserBtn.style.background = 'white';
        roleUserBtn.style.color = 'var(--slate-700)';
        roleUserBtn.classList.add('btn-outline');
      }
      if (adminPasscodeField) adminPasscodeField.style.display = 'block';
    } else {
      if (roleUserBtn) {
        roleUserBtn.style.background = 'var(--primary)';
        roleUserBtn.style.color = 'white';
        roleUserBtn.classList.remove('btn-outline');
      }
      if (roleAdminBtn) {
        roleAdminBtn.style.background = 'white';
        roleAdminBtn.style.color = 'var(--slate-700)';
        roleAdminBtn.classList.add('btn-outline');
      }
      if (adminPasscodeField) adminPasscodeField.style.display = 'none';
    }
  }

  // Attach immediate click listeners
  tabLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    setMode(false);
  });

  tabRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    setMode(true);
  });

  switchModeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setMode(!isSignUp);
  });

  roleUserBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setRole('user');
  });

  roleAdminBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setRole('admin');
  });

  // Check if active session already exists in background
  (async function checkExistingSession() {
    try {
      const client = window.ecocycle?.supabase;
      if (!client) return;

      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role || 'user';
        const destination = role === 'admin' ? 'admin.html' : 'my-pickups.html';

        showAlert(`You are already signed in as ${session.user.email}. Redirecting...`, 'success');
        setTimeout(() => {
          window.location.href = destination;
        }, 800);
      }
    } catch (e) {
      console.warn('Session check warning:', e);
    }
  })();

  // Handle Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const client = window.ecocycle?.supabase;
    if (!client) {
      showAlert('Database service is connecting. Please wait 2 seconds and retry.', 'error');
      return;
    }

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

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
      const passcode = adminPasscodeInput ? adminPasscodeInput.value.trim() : '';
      if (passcode !== DEMO_ADMIN_KEY) {
        showAlert(`Invalid Admin Passcode! Use demo passcode: "${DEMO_ADMIN_KEY}" or register as a Regular User.`, 'error');
        return;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    try {
      if (isSignUp) {
        // Register user via Supabase
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { role: selectedRole }
          }
        });

        if (error) throw error;

        // Ensure row in public.profiles table
        if (data?.user) {
          await client.from('profiles').upsert({
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
        }, 1000);

      } else {
        // Sign In
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Check user role
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'user';
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');

        showAlert('Signed in successfully! Redirecting...', 'success');

        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = 'admin.html';
          } else if (redirectParam) {
            window.location.href = redirectParam;
          } else {
            window.location.href = 'my-pickups.html';
          }
        }, 800);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      showAlert(err.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = isSignUp
          ? '<i data-lucide="user-plus"></i> Create My Account'
          : '<i data-lucide="log-in"></i> Sign In to EcoCycle';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  });
});
