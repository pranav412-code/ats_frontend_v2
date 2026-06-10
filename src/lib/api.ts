import { supabase } from './supabase';

const API_BASE = 'http://localhost:8001/api/v1';

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
