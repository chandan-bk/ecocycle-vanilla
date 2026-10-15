/**
 * EcoCycle Vanilla JS Configuration
 * Initializes Supabase Cloud Client and EmailJS notification service
 */

const SUPABASE_URL = 'https://anusmzkuuudrtgzgccby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudXNtemt1dXVkcnRnemdjY2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDkzNzQsImV4cCI6MjEwNzUyNTM3NH0.t2xEjuYNpWBwbvWtTm-4gwMBLehzC-2rH2SPIaqhJMI';

// Initialize Supabase client avoiding identifier collision with window.supabase
const supabaseClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// EmailJS Configuration
// NOTE: Set serviceId and templateId to send real emails to your inbox.
// If left empty, notifications run in Simulation Mode (logged to console & confirmed in UI).
const EMAILJS_CONFIG = {
  publicKey: 'c7znG95L1pIxLgUEm',
  serviceId: '',   // e.g. 'service_xxxxxx' from emailjs.com
  templateId: '',  // e.g. 'template_xxxxxx' from emailjs.com
};

/**
 * Universal Email Dispatch Helper for Vanilla JS
 * Compatible with EmailJS and graceful fallback simulation
 */
async function sendNotificationEmail({
  toEmail,
  pickupId,
  itemType,
  quantity,
  status = 'pending',
  pickupDate,
  address,
}) {
  if (!toEmail) {
    console.warn('[EcoCycle Mailer] No recipient email specified.');
    return { success: false, reason: 'missing_email' };
  }

  const statusNotes = {
    pending: 'Your doorstep e-waste collection request has been logged and is under review.',
    scheduled: 'Your pickup has been SCHEDULED! A verified logistics driver will arrive on your selected date.',
    collected: 'Great news! Your electronics have been COLLECTED and safely dispatched for certified material recovery.',
    cancelled: 'Your pickup request has been CANCELLED. Please submit a new request if this was done in error.',
  };

  const statusText = status.toLowerCase();
  const note = statusNotes[statusText] || `Your request status has been updated to ${status}.`;

  const templateParams = {
    to_email: toEmail,
    recipient_email: toEmail,
    pickup_id: pickupId ? String(pickupId).slice(0, 8) : 'N/A',
    item_type: itemType || 'Electronic Waste',
    quantity: quantity || 1,
    status: status.toUpperCase(),
    status_note: note,
    pickup_date: pickupDate || 'Scheduled date',
    pickup_address: address || 'Your address',
    dashboard_url: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/my-pickups.html'),
  };

  // If EmailJS keys are provided, attempt real email delivery
  if (window.emailjs && EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId) {
    try {
      window.emailjs.init(EMAILJS_CONFIG.publicKey);
      const res = await window.emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );
      console.log('📬 [EcoCycle Mailer] Real email delivered via EmailJS:', res.status);
      return { success: true, simulated: false };
    } catch (err) {
      console.error('⚠️ [EcoCycle Mailer] EmailJS delivery failed:', err);
      return { success: false, error: err };
    }
  }

  // Graceful simulation mode (logs to console and allows UI to confirm dispatch)
  console.info(
    `🔔 [EcoCycle Email Simulation] To: ${toEmail} | Status: ${status.toUpperCase()} | Item: ${quantity}x ${itemType}`
  );
  return { success: true, simulated: true };
}

window.ecocycle = {
  supabase: supabaseClient,
  EMAILJS_CONFIG,
  sendEmail: sendNotificationEmail,
};
