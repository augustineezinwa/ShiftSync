'use client';

import type { AppRoutes } from '@/app/api/[[...route]]/route';
import { hc } from 'hono/client';

/** Redirect to login on 401 only when not already on the login page. */
function createAuthFetch(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, init).then((res) => {
      if (
        res.status === 401 &&
        typeof window !== 'undefined' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/';
      }
      return res;
    });
  };
}

const honoClient = hc<AppRoutes>('/', {
  fetch: createAuthFetch(),
  init: { credentials: 'include' },
});

export const api = honoClient.api;

// --- Auth (reusable, typed) ---

export async function login(email: string, password: string) {
  const res = await api.auth.login.$post({ json: { email, password } });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(
      (data as { error?: string }).error ?? 'Login failed'
    );
  }
  return res.json();
}

export async function logout() {
  await api.auth.logout.$post();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}