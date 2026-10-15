/**
 * EcoCycle Vanilla JS Configuration
 * Initializes Supabase Cloud Client using CDN build (window.supabase)
 */

const SUPABASE_URL = 'https://anusmzkuuudrtgzgccby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudXNtemt1dXVkcnRnemdjY2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDkzNzQsImV4cCI6MjEwNzUyNTM3NH0.t2xEjuYNpWBwbvWtTm-4gwMBLehzC-2rH2SPIaqhJMI';

// Initialize Supabase client avoiding identifier collision with window.supabase
const supabaseClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// EmailJS optional configuration
const EMAILJS_CONFIG = {
  publicKey: 'c7znG95L1pIxLgUEm',
  serviceId: '',
  templateId: '',
};

window.ecocycle = {
  supabase: supabaseClient,
  EMAILJS_CONFIG,
};
