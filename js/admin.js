/**
 * EcoCycle: Admin Operations Controller
 * Handles customer pickups status updating, collection centers CRUD, and email alerts.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is authenticated as admin
  await requireAuth('admin');

  const supabase = window.ecocycle?.supabase;
  if (!supabase) return;

  // Initialize EmailJS if configured
  if (window.emailjs && window.ecocycle?.EMAILJS_CONFIG?.publicKey) {
    try {
      window.emailjs.init(window.ecocycle.EMAILJS_CONFIG.publicKey);
    } catch (e) {
      console.warn('EmailJS init warning:', e);
    }
  }

  // DOM Elements
  const tabPickupsBtn = document.getElementById('tab-pickups-btn');
  const tabCentersBtn = document.getElementById('tab-centers-btn');
  const sectionPickups = document.getElementById('section-pickups');
  const sectionCenters = document.getElementById('section-centers');

  const pickupsCountEl = document.getElementById('pickups-count');
  const centersCountEl = document.getElementById('centers-count');
  const pickupsGrid = document.getElementById('admin-pickups-grid');
  const centersTableBody = document.getElementById('centers-table-body');

  const addCenterBtn = document.getElementById('add-center-btn');
  const refreshDataBtn = document.getElementById('refresh-data-btn');
  const alertBox = document.getElementById('admin-alert');

  const searchInput = document.getElementById('pickup-search-input');
  const filterBtns = document.querySelectorAll('.pickup-filter-btn');

  // Modal Elements
  const centerModal = document.getElementById('center-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const centerForm = document.getElementById('center-form');
  const modalTitle = document.getElementById('modal-title');

  const centerIdInput = document.getElementById('center-id');
  const centerNameInput = document.getElementById('center-name');
  const centerCityInput = document.getElementById('center-city');
  const centerAddressInput = document.getElementById('center-address');
  const centerLatInput = document.getElementById('center-lat');
  const centerLngInput = document.getElementById('center-lng');
  const centerAcceptsInput = document.getElementById('center-accepts');

  // Local State
  let pickups = [];
  let centers = [];
  let activeTab = 'pickups';
  let currentStatusFilter = 'all';
  let currentSearchQuery = '';

  // Tab Switch Handler
  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'pickups') {
      tabPickupsBtn.classList.add('active');
      tabCentersBtn.classList.remove('active');
      sectionPickups.style.display = 'block';
      sectionCenters.style.display = 'none';
      addCenterBtn.style.display = 'none';
    } else {
      tabCentersBtn.classList.add('active');
      tabPickupsBtn.classList.remove('active');
      sectionPickups.style.display = 'none';
      sectionCenters.style.display = 'block';
      addCenterBtn.style.display = 'inline-flex';
    }
  }

  tabPickupsBtn?.addEventListener('click', () => switchTab('pickups'));
  tabCentersBtn?.addEventListener('click', () => switchTab('centers'));

  // Notification Helpers
  function showAlert(msg, type = 'success') {
    alertBox.textContent = msg;
    alertBox.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
    alertBox.style.display = 'flex';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 4500);
  }

  // 1. Fetch Pickups (with separate profiles query to avoid join restrictions)
  async function fetchPickups() {
    pickupsGrid.innerHTML = '<p style="color:var(--slate-400);">Refreshing pickups data...</p>';
    try {
      const { data: pickupsData, error: pickupError } = await supabase
        .from('pickups')
        .select('*')
        .order('pickup_date', { ascending: false });

      if (pickupError) throw pickupError;

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email');

      const profileMap = {};
      (profilesData || []).forEach(p => {
        if (p.id) profileMap[p.id] = p.email;
      });

      pickups = (pickupsData || []).map(p => ({
        ...p,
        userEmail: profileMap[p.user_id] || 'Registered Customer'
      }));

      pickupsCountEl.textContent = pickups.length;
      renderPickups();
    } catch (err) {
      console.error('Error fetching pickups:', err);
      pickupsGrid.innerHTML = `<p style="color:var(--danger);">Error loading pickups: ${err.message}</p>`;
    }
  }

  // 2. Render Pickups Grid
  function renderPickups() {
    const filtered = pickups.filter(p => {
      const matchesStatus = currentStatusFilter === 'all' || p.status?.toLowerCase() === currentStatusFilter;
      const q = currentSearchQuery.toLowerCase();
      const matchesSearch = !q ||
        p.item_type?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.userEmail?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
      pickupsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: var(--radius-xl); border: 1px dashed var(--slate-300);">
          <p style="font-weight: 600; color: var(--slate-600);">No pickups match your current filter.</p>
        </div>
      `;
      return;
    }

    pickupsGrid.innerHTML = filtered.map(p => {
      const formattedDate = new Date(p.pickup_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Get status badge display with Lucide icon
      let statusIcon = '<i data-lucide="clock"></i>';
      let statusClass = 'badge-pending';
      if (p.status === 'collected') {
        statusIcon = '<i data-lucide="check-circle-2"></i>';
        statusClass = 'badge-collected';
      } else if (p.status === 'scheduled') {
        statusIcon = '<i data-lucide="truck"></i>';
        statusClass = 'badge-scheduled';
      } else if (p.status === 'cancelled') {
        statusIcon = '<i data-lucide="x-circle"></i>';
        statusClass = 'badge-cancelled';
      }

      return `
        <div class="pickup-card">
          <div>
            <div class="pickup-card-header" style="margin-bottom: 14px;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div class="pickup-icon-box"><i data-lucide="package"></i></div>
                <div>
                  <h3 style="font-size: 1.05rem; margin-bottom: 2px; color: var(--slate-900); font-weight: 700; line-height: 1.25;">${p.item_type}</h3>
                  <span style="font-size: 0.75rem; color: var(--slate-500);">Quantity: <strong style="color: var(--slate-700);">${p.quantity} unit(s)</strong></span>
                </div>
              </div>
              <span class="badge ${statusClass}">
                ${statusIcon}
                <span style="text-transform: capitalize;">${p.status}</span>
              </span>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--slate-600); margin-bottom: 8px;">
              <i data-lucide="user" style="width: 14px; height: 14px; color: var(--slate-500); flex-shrink: 0;"></i>
              <span><strong>Customer:</strong> <span style="color: var(--slate-800);">${p.userEmail}</span></span>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--slate-600); margin-bottom: 8px;">
              <i data-lucide="calendar" style="width: 14px; height: 14px; color: var(--slate-500); flex-shrink: 0;"></i>
              <span><strong>Scheduled:</strong> ${formattedDate}</span>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 6px; font-size: 0.82rem; color: var(--slate-600); margin-bottom: 12px;">
              <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--slate-500); flex-shrink: 0; margin-top: 2px;"></i>
              <span><strong>Address:</strong> ${p.address}</span>
            </div>

            ${p.notes ? `
              <div style="background: var(--slate-50); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--slate-600); margin-bottom: 14px; font-style: italic;">
                "${p.notes}"
              </div>
            ` : ''}
          </div>

          <div style="padding-top: 14px; border-top: 1px solid var(--slate-200);">
            <label class="form-label" style="font-size: 0.7rem; margin-bottom: 4px;">Update Status:</label>
            <select class="form-select status-select" data-id="${p.id}" style="font-size: 0.82rem; padding: 6px 10px;">
              <option value="pending" ${p.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="scheduled" ${p.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="collected" ${p.status === 'collected' ? 'selected' : ''}>Collected</option>
              <option value="cancelled" ${p.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to status selectors
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const pickupId = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        await updatePickupStatus(pickupId, newStatus);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // 3. Update Pickup Status & Send Email Alert
  async function updatePickupStatus(pickupId, newStatus) {
    const target = pickups.find(p => p.id === pickupId);
    try {
      const { error } = await supabase
        .from('pickups')
        .update({ status: newStatus })
        .eq('id', pickupId);

      if (error) throw error;

      // Update in memory
      if (target) target.status = newStatus;
      renderPickups();

      // Trigger email alert via centralized helper
      if (window.ecocycle?.sendEmail && target?.userEmail) {
        window.ecocycle.sendEmail({
          toEmail: target.userEmail,
          pickupId: target.id,
          itemType: target.item_type,
          quantity: target.quantity,
          status: newStatus,
          pickupDate: target.pickup_date,
          address: target.address,
        });
      }

      showAlert(
        target?.userEmail
          ? `Status updated to "${newStatus}" & email alert dispatched to ${target.userEmail}!`
          : `Status updated to "${newStatus}"!`
      );
    } catch (err) {
      console.error('Error updating status:', err);
      showAlert(`Failed to update status: ${err.message}`, 'error');
    }
  }

  // 4. Fetch Collection Centers
  async function fetchCenters() {
    centersTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--slate-400); padding: 30px;">Loading collection centers...</td>
      </tr>
    `;
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      centers = data || [];
      centersCountEl.textContent = centers.length;
      renderCenters();
    } catch (err) {
      console.error('Error fetching centers:', err);
      centersTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 30px;">Error loading centers: ${err.message}</td>
        </tr>
      `;
    }
  }

  // 5. Render Centers Table
  function renderCenters() {
    if (centers.length === 0) {
      centersTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--slate-400); padding: 30px;">No collection centers registered yet.</td>
        </tr>
      `;
      return;
    }

    centersTableBody.innerHTML = centers.map(c => {
      const items = Array.isArray(c.accepts) ? c.accepts : (typeof c.accepts === 'string' ? c.accepts.split(',') : []);
      const pillsHtml = items.map(it => `<span class="tag-pill">${it.trim()}</span>`).join('');

      return `
        <tr>
          <td style="font-weight: 700; color: var(--slate-900);">${c.name}</td>
          <td>
            <div style="font-weight: 600; color: var(--slate-800);">${c.city || 'Mandya'}</div>
            <div style="font-size: 0.78rem; color: var(--slate-500);">${c.address}</div>
          </td>
          <td style="font-family: monospace; font-size: 0.78rem; color: var(--slate-600);">
            ${c.lat}, ${c.lng}
          </td>
          <td style="max-width: 250px;">
            ${pillsHtml}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-outline btn-sm edit-center-btn" data-id="${c.id}" style="padding: 6px 10px; margin-right: 4px;" title="Edit Center">
              <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn btn-danger btn-sm delete-center-btn" data-id="${c.id}" style="padding: 6px 10px;" title="Delete Center">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Edit & Delete buttons
    document.querySelectorAll('.edit-center-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const center = centers.find(c => c.id === id);
        if (center) openEditCenterModal(center);
      });
    });

    document.querySelectorAll('.delete-center-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteCenter(id);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // 6. Modal Open / Close Handlers
  function openAddCenterModal() {
    modalTitle.textContent = 'Add New Collection Center';
    centerIdInput.value = '';
    centerNameInput.value = '';
    centerCityInput.value = 'Mandya';
    centerAddressInput.value = '';
    centerLatInput.value = '12.5244';
    centerLngInput.value = '76.8958';
    centerAcceptsInput.value = 'Smartphones, Laptops, Batteries, Cables';
    centerModal.classList.add('open');
  }

  function openEditCenterModal(c) {
    modalTitle.textContent = 'Edit Collection Center';
    centerIdInput.value = c.id;
    centerNameInput.value = c.name || '';
    centerCityInput.value = c.city || 'Mandya';
    centerAddressInput.value = c.address || '';
    centerLatInput.value = c.lat || '';
    centerLngInput.value = c.lng || '';
    centerAcceptsInput.value = Array.isArray(c.accepts) ? c.accepts.join(', ') : (c.accepts || '');
    centerModal.classList.add('open');
  }

  function closeModal() {
    centerModal.classList.remove('open');
  }

  addCenterBtn?.addEventListener('click', openAddCenterModal);
  closeModalBtn?.addEventListener('click', closeModal);
  cancelModalBtn?.addEventListener('click', closeModal);

  // Close modal when clicking outside box
  centerModal?.addEventListener('click', (e) => {
    if (e.target === centerModal) closeModal();
  });

  // 7. Save Center Form (Create or Update)
  centerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = centerIdInput.value;
    const name = centerNameInput.value.trim();
    const city = centerCityInput.value.trim();
    const address = centerAddressInput.value.trim();
    const lat = parseFloat(centerLatInput.value);
    const lng = parseFloat(centerLngInput.value);
    const accepts = centerAcceptsInput.value.split(',').map(s => s.trim()).filter(Boolean);

    if (!name || !address || isNaN(lat) || isNaN(lng)) {
      showAlert('Please enter valid coordinates and address details.', 'error');
      return;
    }

    const payload = { name, city, address, lat, lng, accepts };

    try {
      if (id) {
        // Update existing center
        const { error } = await supabase
          .from('centers')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        showAlert(`Center "${name}" updated successfully!`);
      } else {
        // Create new center
        const { error } = await supabase
          .from('centers')
          .insert([payload]);

        if (error) throw error;
        showAlert(`New center "${name}" added!`);
      }

      closeModal();
      await fetchCenters();
    } catch (err) {
      console.error('Save center error:', err);
      showAlert(`Could not save center: ${err.message}`, 'error');
    }
  });

  // 8. Delete Center
  async function deleteCenter(id) {
    if (!window.confirm('Are you sure you want to delete this collection center?')) return;

    try {
      const { error } = await supabase
        .from('centers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showAlert('Collection center deleted.');
      centers = centers.filter(c => c.id !== id);
      centersCountEl.textContent = centers.length;
      renderCenters();
    } catch (err) {
      console.error('Delete center error:', err);
      showAlert(`Failed to delete center: ${err.message}`, 'error');
    }
  }

  // 9. Filter & Search Handlers
  searchInput?.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    renderPickups();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'white';
        b.style.color = 'var(--slate-700)';
      });

      btn.classList.add('active');
      btn.style.background = 'var(--slate-800)';
      btn.style.color = 'white';

      currentStatusFilter = btn.getAttribute('data-filter');
      renderPickups();
    });
  });

  // Refresh Button
  refreshDataBtn?.addEventListener('click', async () => {
    await fetchPickups();
    await fetchCenters();
    showAlert('Data successfully refreshed!');
  });

  // Initial Load
  await fetchPickups();
  await fetchCenters();
});
