/**
 * EcoCycle Vanilla JS Configuration
 * Initializes Supabase Cloud Client and EmailJS notification service
 * Unified with the React production deployment keys
 */

const SUPABASE_URL = 'https://anusmzkuuudrtgzgccby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudXNtemt1dXVkcnRnemdjY2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDkzNzQsImV4cCI6MjEwNzUyNTM3NH0.t2xEjuYNpWBwbvWtTm-4gwMBLehzC-2rH2SPIaqhJMI';

// Initialize Supabase client avoiding identifier collision with window.supabase
const supabaseClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// EmailJS Unified Configuration (matching the production React project)
const EMAILJS_CONFIG = {
  publicKey: 'c7znG95LlpIxLgUEm',
  serviceId: 'service_np1cnlg',
  templateId: 'template_to9738m',
};

// Initialize EmailJS immediately when script loads
if (typeof window !== 'undefined' && window.emailjs) {
  try {
    window.emailjs.init(EMAILJS_CONFIG.publicKey);
  } catch (e) {
    console.warn('EmailJS initialization warning:', e);
  }
}

/**
 * Universal Email Dispatch Helper for Vanilla JS
 * Directly sends emails using unified EmailJS credentials
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
  const recipientName = toEmail.split('@')[0] || 'Valued Contributor';

  const templateParams = {
    to_name: recipientName,
    to_email: toEmail,
    recipient_email: toEmail,
    pickup_id: pickupId ? String(pickupId).slice(0, 8) : 'N/A',
    item_type: itemType || 'Electronic Waste',
    quantity: quantity || 1,
    status: status.toUpperCase(),
    status_note: note,
    pickup_date: pickupDate || 'Scheduled date',
    pickup_address: address || 'Your address',
    dashboard_url: 'https://ecocycle-vanilla.vercel.app/my-pickups.html',
  };

  try {
    if (window.emailjs && EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId) {
      window.emailjs.init(EMAILJS_CONFIG.publicKey);
      const res = await window.emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );
      console.log('📬 [EcoCycle Mailer] Email delivered successfully via EmailJS:', res.status, res.text);
      return { success: true, simulated: false };
    }
  } catch (err) {
    console.error('⚠️ [EcoCycle Mailer] EmailJS delivery failed:', err);
    return { success: false, error: err };
  }

  console.info(`🔔 [EcoCycle Mailer] Sent to: ${toEmail} | Status: ${status.toUpperCase()}`);
  return { success: true, simulated: true };
}

window.ecocycle = {
  supabase: supabaseClient,
  EMAILJS_CONFIG,
  sendEmail: sendNotificationEmail,
};
