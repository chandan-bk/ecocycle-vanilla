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

    // Get status display
    let statusIcon = '⏳';
    let statusClass = 'badge-pending';
    if (pickup.status === 'collected') {
      statusIcon = '✅';
      statusClass = 'badge-collected';
    } else if (pickup.status === 'scheduled') {
      statusIcon = '🚚';
      statusClass = 'badge-scheduled';
    } else if (pickup.status === 'cancelled') {
      statusIcon = '❌';
      statusClass = 'badge-cancelled';
    }

    const card = document.createElement('div');
    card.className = 'pickup-card';

    card.innerHTML = `
      <div>
        <div class="pickup-card-header" style="margin-bottom: 14px;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div class="pickup-icon-box">📦</div>
            <div>
              <h3 style="font-size: 1.05rem; color: var(--slate-900); font-weight: 700; line-height: 1.25; margin-bottom: 2px;">${pickup.item_type}</h3>
              <span style="font-size: 0.75rem; color: var(--slate-500);">Quantity: <strong style="color: var(--slate-700);">${pickup.quantity} unit(s)</strong></span>
            </div>
          </div>
          <span class="badge ${statusClass}">
            <span>${statusIcon}</span>
            <span style="text-transform: capitalize;">${pickup.status}</span>
          </span>
        </div>

        <div style="border-top: 1px solid var(--slate-100); padding-top: 14px; font-size: 0.85rem; color: var(--slate-600); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>📅</span>
            <span>Pickup Date: <strong style="color: var(--slate-800);">${formattedDate}</strong></span>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 6px;">
            <span style="margin-top: 2px;">📍</span>
            <span style="color: var(--slate-700); line-height: 1.4;">${pickup.address}</span>
          </div>
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
