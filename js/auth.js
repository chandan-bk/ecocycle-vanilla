/**
 * EcoCycle Auth & Shared UI Helper
 * Manages user sessions, role checks, navbar updates, and mobile menu
 */

document.addEventListener('DOMContentLoaded', async () => {
  setupMobileMenu();
  await updateNavbarState();

  // Listen to live auth changes (matching React Navbar)
  window.ecocycle?.supabase?.auth.onAuthStateChange(async () => {
    await updateNavbarState();
  });
});

function setupMobileMenu() {
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }
}

async function updateNavbarState() {
  const authContainer = document.getElementById('nav-auth-container');
  const adminNavLink = document.getElementById('nav-admin-link');
  const myPickupsNavLink = document.getElementById('nav-mypickups-link');

  if (!window.ecocycle?.supabase) return;

  const { data: { session } } = await window.ecocycle.supabase.auth.getSession();
  const user = session?.user;

  if (user) {
    // Fetch user profile role from public.profiles
    const { data: profile } = await window.ecocycle.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';

    // Show My Pickups link
    if (myPickupsNavLink) myPickupsNavLink.style.display = 'block';

    // Show Admin link if role is admin
    if (adminNavLink) {
      adminNavLink.style.display = role === 'admin' ? 'block' : 'none';
    }

    // Render user email and logout button
    if (authContainer) {
      authContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="text-align:right;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--slate-800); max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${user.email}
            </div>
            <span class="role-badge ${role === 'admin' ? 'admin' : ''}">${role}</span>
          </div>
          <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
        </div>
      `;

      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await window.ecocycle.supabase.auth.signOut();
        window.location.href = 'index.html';
      });
    }
  } else {
    // Guest User
    if (adminNavLink) adminNavLink.style.display = 'none';
    if (myPickupsNavLink) myPickupsNavLink.style.display = 'none';

    if (authContainer) {
      authContainer.innerHTML = `
        <a href="login.html" class="btn btn-primary btn-sm">Login / Register</a>
      `;
    }
  }
}

// Function to guard protected pages
async function requireAuth(requiredRole = null) {
  if (!window.ecocycle?.supabase) return;

  const { data: { session } } = await window.ecocycle.supabase.auth.getSession();
  if (!session?.user) {
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  if (requiredRole === 'admin') {
    const { data: profile } = await window.ecocycle.supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      alert('Access Denied: This area is restricted to administrators.');
      window.location.href = 'index.html';
    }
  }
}
