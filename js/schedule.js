/**
 * EcoCycle Schedule Pickup Controller
 * Handles user authentication verification, date validation, and Supabase persistence
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is logged in
  await requireAuth();

  setupDateValidation();
  setupFormHandler();
});

function setupDateValidation() {
  const dateInput = document.getElementById('pickup-date');
  if (dateInput) {
    // Minimum date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
}

function setupFormHandler() {
  const form = document.getElementById('pickup-form');
  const alertBanner = document.getElementById('alert-banner');
  const formCard = document.getElementById('form-card');
  const successModal = document.getElementById('success-modal');
  const successSummary = document.getElementById('success-summary');
  const submitBtn = document.getElementById('submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBanner.style.display = 'none';

    const itemType = document.getElementById('item-type').value;
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    const pickupDate = document.getElementById('pickup-date').value;
    const address = document.getElementById('address').value.trim();

    if (!address) {
      showAlert('Please provide a complete pickup address.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Request...';

    try {
      const { data: { user } } = await window.ecocycle.supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to schedule a pickup.');
      }

      // Insert into Supabase pickups table
      const { error } = await window.ecocycle.supabase.from('pickups').insert([
        {
          user_id: user.id,
          item_type: itemType,
          quantity: quantity,
          pickup_date: pickupDate,
          address: address,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      // Dispatch booking confirmation email notification
      if (user.email && window.ecocycle?.sendEmail) {
        window.ecocycle.sendEmail({
          toEmail: user.email,
          itemType: itemType,
          quantity: quantity,
          status: 'pending',
          pickupDate: pickupDate,
          address: address,
        });
      }

      // Show success modal
      formCard.style.display = 'none';
      successModal.style.display = 'block';
      successSummary.innerHTML = `
        Your e-waste collection request for <strong>${quantity}x ${itemType}</strong> 
        on <strong>${pickupDate}</strong> has been logged with status <span class="badge badge-pending">Pending</span>.
        <div style="margin-top:12px; font-size:0.85rem; color:var(--primary-dark); background:var(--primary-light); padding:10px; border-radius:8px; display:flex; align-items:center; gap:8px;">
          <i data-lucide="mail" style="width:16px;height:16px;flex-shrink:0;"></i>
          <span>A confirmation alert has been dispatched to <strong>${user.email}</strong>.</span>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      console.error('Error submitting pickup:', err);
      showAlert(err.message || 'Failed to schedule pickup. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send"></i> Confirm & Schedule Pickup';
      if (window.lucide) window.lucide.createIcons();
    }
  });

  document.getElementById('book-another-btn')?.addEventListener('click', () => {
    form.reset();
    setupDateValidation();
    successModal.style.display = 'none';
    formCard.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="send"></i> Confirm & Schedule Pickup';
    if (window.lucide) window.lucide.createIcons();
  });
}

function showAlert(message, type) {
  const alertBanner = document.getElementById('alert-banner');
  alertBanner.className = `alert alert-${type}`;
  alertBanner.textContent = message;
  alertBanner.style.display = 'block';
}
