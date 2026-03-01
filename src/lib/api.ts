'use client';

import type { AppRoutes } from '@/app/api/[[...route]]/route';
import { parseValidationError, ValidationError } from '@/lib/api-error';
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

export async function assignLocationToUser(userId: number, locationId: number) {
    const res = await api.location["assign-user"].$put({
        json: { userId, locationId },
    });
    if (!res.ok) throw new Error("Failed to assign location");
    return res.json();
}

export async function unassignLocationFromUser(userId: number, locationId: number) {
    const res = await api.location["unassign-user"].$put({
        json: { userId, locationId },
    });
    if (!res.ok) throw new Error("Failed to unassign location");
    return res.json();
}

// --- Users (admin staff page) ---

export async function getUsers() {
    const res = await api.users.$get();
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function assignSkillToUser(userId: number, skillId: number) {
    const res = await api.user["assign-skill"].$put({ json: { userId, skillId } });
    if (!res.ok) throw new Error("Failed to assign skill");
    return res.json();
}

export async function unassignSkillFromUser(userId: number, skillId: number) {
    const res = await api.user["unassign-skill"].$put({ json: { userId, skillId } });
    if (!res.ok) throw new Error("Failed to unassign skill");
    return res.json();
}

// --- Config (admin settings) ---

export async function getConfigs() {
    const res = await api.config.$get();
    if (!res.ok) throw new Error("Failed to fetch config");
    return res.json();
}

export async function createConfig(key: string, value: number) {
    const res = await api.config.$post({ json: { key, value } });
    if (!res.ok) throw new Error("Failed to create config");
    return res.json();
}

export async function updateConfig(key: string, value: number) {
    const res = await api.config.$put({ json: { key, value } });
    if (!res.ok) throw new Error("Failed to update config");
    return res.json();
}

// --- Shifts (manager) ---

export async function getShifts() {
    const res = await api.shifts.$get();
    if (!res.ok) throw new Error("Failed to fetch shifts");
    return res.json();
}

/** Single shift type from GET /shifts response (array element) */
export type ApiShift = Awaited<ReturnType<typeof getShifts>>[number];

export async function getShift(id: number) {
    const res = await api.shifts[":id"].$get({ param: { id: String(id) } });
    if (!res.ok) throw new Error("Failed to fetch shift");
    return res.json();
}

/** Extract error message from API error response (validator schema or server). */
function getApiErrorMessage(data: unknown): string {
    const fallback = "Failed to create shift";
    if (!data || typeof data !== "object") return fallback;
    if ("error" in data && typeof (data as { error: unknown }).error === "string")
        return (data as { error: string }).error;
    if ("message" in data && typeof (data as { message: unknown }).message === "string")
        return (data as { message: string }).message;
    if ("issues" in data && Array.isArray((data as { issues: unknown }).issues)) {
        const { message } = parseValidationError(data);
        return message;
    }
    return fallback;
}

/** Throw ValidationError when body has issues[] (e.g. 422 or 400 validation response). */
function throwIfValidationError(res: { ok: boolean }, data: unknown): void {
    if (res.ok) return;
    if (!data || typeof data !== "object") return;
    const obj = data as Record<string, unknown>;
    const issues = obj.issues ?? obj.details ?? obj.errors;
    if (!Array.isArray(issues) || issues.length === 0) return;
    const { message, byPath } = parseValidationError(data);
    throw new ValidationError(message, byPath);
}

export async function createShift(payload: {
    locationId: number;
    skillId: number;
    startTime: string;
    endTime: string;
    headcount: number;
}) {
    console.log('I am here >>>>>')
    const res = await api.shifts.$post({ json: payload as Parameters<typeof api.shifts.$post>[0]["json"] });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throwIfValidationError(res, data);
        throw new Error(getApiErrorMessage(data));
    }
    return res.json();
}

export { ValidationError, isValidationError } from "@/lib/api-error";

export async function updateShift(
    id: number,
    payload: {
        locationId: number;
        skillId: number;
        startTime: string;
        endTime: string;
        headcount: number;
    }
) {
    const res = await api.shifts[":id"].$put({
        param: { id: String(id) },
        json: payload as Parameters<typeof api.shifts[":id"]["$put"]>[0]["json"],
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throwIfValidationError(res, data);
        throw new Error(getApiErrorMessage(data));
    }
    return res.json();
}

export async function publishShifts(ids: number[]) {
    const res = await api.shifts.publish.$put({ json: { ids } });
    if (!res.ok) throw new Error("Failed to publish shifts");
    return res.json();
}