import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or user localStorage overrides
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let cachedUrl = envUrl || (typeof window !== 'undefined' ? localStorage.getItem('supabase_custom_url') || '' : '');
let cachedKey = envKey || (typeof window !== 'undefined' ? localStorage.getItem('supabase_custom_anon_key') || '' : '');

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(cachedUrl && cachedKey && cachedUrl.startsWith('http'));
}

export function getSupabaseCredentials(): { url: string; anonKey: string; isEnv: boolean } {
  return {
    url: cachedUrl,
    anonKey: cachedKey,
    isEnv: Boolean(envUrl && envKey),
  };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  cachedUrl = url.trim();
  cachedKey = anonKey.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_custom_url', cachedUrl);
    localStorage.setItem('supabase_custom_anon_key', cachedKey);
  }
  supabaseInstance = null; // reset client to reinitialize
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(cachedUrl, cachedKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
