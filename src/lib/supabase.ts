/**
 * Supabase Client — Trusted Advisor OS
 *
 * Singleton client for all Supabase operations.
 * Owner edit-key is stored in localStorage and injected as a
 * custom header via a fetch wrapper (supabase-js global.headers
 * is static Record<string, string>, so we wrap fetch instead).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbsmtcrdgwokzkssixpc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TDSuXq91u6lqWGJoQCU_Zw_f6QSMfuh';

const OWNER_KEY_STORAGE = 'trusted-advisor-os-owner-key';

export function getOwnerKey(): string {
  return localStorage.getItem(OWNER_KEY_STORAGE) || '';
}

export function setOwnerKey(key: string): void {
  localStorage.setItem(OWNER_KEY_STORAGE, key);
}

export function clearOwnerKey(): void {
  localStorage.removeItem(OWNER_KEY_STORAGE);
}

const ownerKeyFetch: typeof globalThis.fetch = (input, init) => {
  const ownerKey = getOwnerKey();
  if (ownerKey) {
    const headers = new Headers(init?.headers);
    headers.set('x-owner-key', ownerKey);
    return globalThis.fetch(input, { ...init, headers });
  }
  return globalThis.fetch(input, init);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: ownerKeyFetch,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
