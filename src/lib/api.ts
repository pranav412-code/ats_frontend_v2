import { supabase } from './supabase';

// API origin is env-driven (set VITE_API_URL in .env). Falls back to the
// deployed Render backend so the app works without a local backend running.
export const API_ORIGIN =
  import.meta.env.VITE_API_URL ?? 'https://resume-craft-backend-1r57.onrender.com';
const API_BASE = `${API_ORIGIN}/api/v1`;

async function buildHeaders(options: RequestInit): Promise<Headers> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return headers;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;

  let response = await fetch(url, { ...options, headers: await buildHeaders(options) });

  if (response.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      response = await fetch(url, { ...options, headers: await buildHeaders(options) });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
