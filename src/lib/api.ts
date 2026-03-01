'use client';

import type { AppRoutes } from '@/app/api/[[...route]]/route';
import { hc } from 'hono/client';

const honoClient = hc<AppRoutes>('/', {
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