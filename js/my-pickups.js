/**
 * EcoCycle My Pickups Controller
 * Renders user's personal pickups list with filter tabs
 */

let userPickups = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  fetchUserPickups();
  setupFilterTabs();

  document.getElementById('refresh-btn')?.addEventListener('click', fetchUserPickups);
});

async function fetchUserPickups() {
  const grid = document.getElementById('pickups-grid');
  grid.innerHTML = '<p style="color:var(--slate-400);">Loading your pickups...</p>';

  try {
    const { data: { user } } = await window.ecocycle.supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await window.ecocycle.supabase
      .from('pickups')
      .select('*')
      .eq('user_id', user.id)
      .order('pickup_date', { ascending: false });

    if (error) throw error;
    userPickups = data || [];
    renderPickups();
  } catch (err) {
    console.error('Error loading pickups:', err);
    grid.innerHTML = `<p style="color:var(--danger);">Failed to load pickups. Please refresh.</p>`;
  }
}

function renderPickups() {
  const grid = document.getElementById('pickups-grid');
  
  const filtered = userPickups.filter((item) => {
    if (currentFilter === 'all') return true;
    return item.status?.toLowerCase() === currentFilter;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: white; border: 1px dashed var(--slate-200); border-radius: var(--radius-xl);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">📦</div>
        <h3>No ${currentFilter === 'all' ? '' : currentFilter} pickups found</h3>
        <p style="margin: 8px 0 20px;">Ready to dispose of obsolete electronics responsibly?</p>
        <a href="schedule.html" class="btn btn-primary">Book Your First Pickup</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';

  filtered.forEach((pickup) => {
    const formattedDate = pickup.pickup_date
      ? new Date(pickup.pickup_date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
          <div>
            <h3 style="font-size:1.1rem; color:var(--slate-900);">${pickup.item_type}</h3>
            <span style="font-size:0.8rem; color:var(--slate-500);">Quantity: <strong>${pickup.quantity} unit(s)</strong></span>
          </div>
          <span class="badge badge-${pickup.status}">${pickup.status}</span>
        </div>

        <div style="border-top:1px solid var(--slate-100); padding-top:12px; font-size:0.85rem; color:var(--slate-600); display:flex; flex-direction:column; gap:8px;">
          <div>📅 Date: <strong style="color:var(--slate-800);">${formattedDate}</strong></div>
          <div>📍 <span style="color:var(--slate-700);">${pickup.address}</span></div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-status');
      renderPickups();
    });
  });
}
