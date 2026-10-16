/**
 * EcoCycle Locator Map Controller
 * Native Leaflet & OpenStreetMap implementation with dynamic city switching (Mandya & Bangalore)
 */

let map = null;
let markersLayer = null;
let allCenters = [];

// City coordinate presets
const CITY_COORDINATES = {
  'Mandya': { center: [12.5244, 76.8958], zoom: 13 },
  'Bangalore': { center: [12.9716, 77.5946], zoom: 12 },
  'All': { center: [12.75, 77.25], zoom: 9 },
};

// Custom Eco Marker Icon
const ecoIcon = L.divIcon({
  className: 'custom-eco-pin',
  html: `<div class="custom-map-marker"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-recycle"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 5.5 9.5 8.7 3.9"/><path d="m15.5 9.5 3.2 5.6"/><path d="m9 6 3-3-3-3"/></svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchCollectionCenters();
  setupEventListeners();
});

function initMap() {
  // Default to Mandya, Karnataka
  const defaultCity = CITY_COORDINATES['Mandya'];
  map = L.map('map').setView(defaultCity.center, defaultCity.zoom);

  // OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

async function fetchCollectionCenters() {
  const listEl = document.getElementById('centers-list');
  try {
    const { data, error } = await window.ecocycle.supabase
      .from('centers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    allCenters = data || [];
    renderCenters();
  } catch (err) {
    console.error('Error fetching centers from Supabase:', err);
    listEl.innerHTML = `<p style="color:var(--danger); font-size:0.85rem;">Could not load centers. Check network connection.</p>`;
  }
}

function renderCenters() {
  const search = document.getElementById('search-input')?.value.toLowerCase() || '';
  const selectedCity = document.getElementById('city-select')?.value || 'All';
  const selectedItem = document.getElementById('item-select')?.value || 'All';

  // Clear existing map markers
  markersLayer.clearLayers();

  // Filter centers
  const filtered = allCenters.filter((center) => {
    const matchesSearch =
      search === '' ||
      center.name?.toLowerCase().includes(search) ||
      center.address?.toLowerCase().includes(search);

    const matchesCity =
      selectedCity === 'All' ||
      center.city?.toLowerCase() === selectedCity.toLowerCase();

    const matchesItem =
      selectedItem === 'All' ||
      (Array.isArray(center.accepts) &&
        center.accepts.some((acc) => acc.toLowerCase().includes(selectedItem.toLowerCase())));

    return matchesSearch && matchesCity && matchesItem;
  });

  // Update counter
  document.getElementById('center-count').textContent = filtered.length;

  // Render markers and sidebar cards
  const listEl = document.getElementById('centers-list');
  if (filtered.length === 0) {
    listEl.innerHTML = `<p style="color:var(--slate-500); font-size:0.85rem; padding:15px; text-align:center;">No recycling centers found matching your filter.</p>`;
    return;
  }

  listEl.innerHTML = '';

  filtered.forEach((center) => {
    if (!center.lat || !center.lng) return;

    // 1. Create Leaflet Marker
    const marker = L.marker([center.lat, center.lng], { icon: ecoIcon });

    const acceptsBadges = Array.isArray(center.accepts)
      ? center.accepts.map((item) => `<span style="display:inline-block; font-size:10px; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; margin:2px;">${item}</span>`).join('')
      : '';

    marker.bindPopup(`
      <div style="font-family:system-ui; max-width:220px; line-height:1.4;">
        <h4 style="margin:0 0 4px; font-size:13px; color:#0f172a;">${center.name}</h4>
        <p style="margin:0 0 6px; font-size:11px; color:#64748b;">${center.address}, ${center.city}</p>
        <div style="margin-bottom:8px;">${acceptsBadges}</div>
        <div style="border-top:1px solid #e2e8f0; padding-top:6px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10px; color:#94a3b8;">${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</span>
          <a href="https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}" target="_blank" style="font-size:11px; font-weight:bold; color:#16a34a; text-decoration:none;">Directions ↗</a>
        </div>
      </div>
    `);

    markersLayer.addLayer(marker);

    // 2. Create Sidebar Card
    const card = document.createElement('div');
    card.className = 'center-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <strong style="font-size: 0.9rem; color: var(--slate-800);">${center.name}</strong>
        <span style="font-size: 10px; background: var(--slate-100); padding: 2px 6px; border-radius: 99px; flex-shrink: 0; font-weight: 600;">${center.city}</span>
      </div>
      <p style="font-size: 0.75rem; color: var(--slate-500); margin: 2px 0 4px; display: flex; align-items: center; gap: 4px;">
        <i data-lucide="map-pin" style="width:12px;height:12px;color:var(--primary);flex-shrink:0;"></i>
        <span>${center.address}</span>
      </p>
      <div>${acceptsBadges}</div>
    `;

    card.addEventListener('click', () => {
      map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 1.2 });
      marker.openPopup();
    });

    listEl.appendChild(card);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setupEventListeners() {
  document.getElementById('search-input')?.addEventListener('input', renderCenters);
  document.getElementById('item-select')?.addEventListener('change', renderCenters);

  // Dynamic City Switching: Auto-fly map to Mandya or Bangalore
  document.getElementById('city-select')?.addEventListener('change', (e) => {
    const selectedCity = e.target.value;
    const config = CITY_COORDINATES[selectedCity];
    if (config && map) {
      map.flyTo(config.center, config.zoom, { animate: true, duration: 1.2 });
    }
    renderCenters();
  });

  document.getElementById('refresh-btn')?.addEventListener('click', fetchCollectionCenters);
}
