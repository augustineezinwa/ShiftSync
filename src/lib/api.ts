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
    return await res.json();
}

export async function logout() {
    await api.auth.logout.$post();
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
}

// --- Current user (for AuthProvider) ---

export async function getMe() {
    const res = await api.auth.me.$get();
    console.log(res);
    if (!res.ok) return null;
    const data = await res.json();
    console.log(data);
    return data;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getMe>>>;

// --- Me availability (staff profile) ---

export async function getMeAvailability() {
  const res = await api.me.availability.$get();
  if (!res.ok) return [];
  return res.json();
}

export async function updateMeAvailability(payload: {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
}) {
  const res = await api.me.availability.$put({ json: payload });
  if (!res.ok) throw new Error("Failed to update availability");
  return res.json();
}

// --- Me weekly hours (staff profile) ---

export async function getMeWeeklyHours(): Promise<{ hoursPerWeek: number } | null> {
  const res = await api.me["weekly-hours"].$get();
  if (!res.ok) return null;
  const data = await res.json();
  if (data && typeof data === "object" && "hoursPerWeek" in data) {
    return { hoursPerWeek: Number((data as { hoursPerWeek: number }).hoursPerWeek) };
  }
  return null;
}

export async function updateMeWeeklyHours(hoursPerWeek: number) {
  const res = await api.me["weekly-hours"].$put({ json: { hoursPerWeek } });
  if (!res.ok) throw new Error("Failed to update weekly hours");
  return res.json();
}

// --- Me skills (staff profile) ---

export async function assignMeSkill(skillId: number) {
  const res = await api.me.skills.assign.$put({ json: { skillId } });
  if (!res.ok) throw new Error("Failed to assign skill");
  return res.json();
}

export async function unassignMeSkill(skillId: number) {
  const res = await api.me.skills.unassign.$put({ json: { skillId } });
  if (!res.ok) throw new Error("Failed to unassign skill");
  return res.json();
}

// --- Skills (admin settings) ---

export async function getSkills() {
  const res = await api.skills.$get();
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json();
}

export async function createSkill(name: string, isVerified = false) {
  const res = await api.skills.$post({ json: { name, isVerified } });
  if (!res.ok) throw new Error("Failed to create skill");
  return res.json();
}

export async function updateSkill(id: number, payload: { name: string; isVerified: boolean }) {
  const res = await api.skills[":id"].$put({ param: { id: String(id) }, json: payload });
  if (!res.ok) throw new Error("Failed to update skill");
  return res.json();
}

// --- Locations (admin settings) ---

export async function getLocations() {
  const res = await api.locations.$get();
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export async function createLocation(payload: {
  name: string;
  timezone: string;
  offset: number;
  isVerified?: boolean;
}) {
  const res = await api.locations.$post({
    json: { ...payload, isVerified: payload.isVerified ?? false },
  });
  if (!res.ok) throw new Error("Failed to create location");
  return res.json();
}

export async function updateLocation(
  id: number,
  payload: { name: string; timezone: string; offset: number; isVerified: boolean }
) {
  const res = await api.locations[":id"].$put({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) throw new Error("Failed to update location");
  return res.json();
}