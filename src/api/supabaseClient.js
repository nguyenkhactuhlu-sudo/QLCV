// Supabase client setup
import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../utils/constants.js';

let supabaseClient = null;

/**
 * Get or create the Supabase client instance.
 * Returns null when in demo mode or when credentials are missing.
 */
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (APP_CONFIG.DEMO_MODE) {
    return null;
  }

  if (!APP_CONFIG.SUPABASE_URL || !APP_CONFIG.SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  supabaseClient = createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
  return supabaseClient;
}

/**
 * Check if real Supabase backend is available.
 */
export function isBackendAvailable() {
  return !APP_CONFIG.DEMO_MODE && !!APP_CONFIG.SUPABASE_URL;
}
