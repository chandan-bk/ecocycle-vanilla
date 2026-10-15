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

      // Show success modal
      formCard.style.display = 'none';
      successModal.style.display = 'block';
      successSummary.innerHTML = `
        Your e-waste collection request for <strong>${quantity}x ${itemType}</strong> 
        on <strong>${pickupDate}</strong> has been logged with status <span class="badge badge-pending">Pending</span>.
      `;

    } catch (err) {
      console.error('Error submitting pickup:', err);
      showAlert(err.message || 'Failed to schedule pickup. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm & Schedule Pickup';
    }
  });

  document.getElementById('book-another-btn')?.addEventListener('click', () => {
    form.reset();
    setupDateValidation();
    successModal.style.display = 'none';
    formCard.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm & Schedule Pickup';
  });
}

function showAlert(message, type) {
  const alertBanner = document.getElementById('alert-banner');
  alertBanner.className = `alert alert-${type}`;
  alertBanner.textContent = message;
  alertBanner.style.display = 'block';
}
