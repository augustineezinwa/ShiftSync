"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AvailabilityEditor } from "@/components/dashboard/AvailabilityEditor";
import { useAuth } from "@/providers/AuthProvider";
import { getMeWeeklyHours, updateMeWeeklyHours, getSkills, assignMeSkill, unassignMeSkill } from "@/lib/api";
import { DAYS_OF_WEEK, type DayOfWeek, type WeeklyAvailability } from "@/lib/mock-data";
import { X } from "lucide-react";

/** Monday = 0, Tuesday = 1, … Sunday = 6 */
const DAY_INDEX_TO_KEY: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function timeStr(t: string): string {
  if (!t) return "09:00";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function availabilityFromMeApi(
  list: { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }[]
): WeeklyAvailability {
  const out: WeeklyAvailability = {};
  for (const day of DAYS_OF_WEEK) {
    out[day] = null;
  }
  for (const row of list) {
    const key = DAY_INDEX_TO_KEY[row.dayOfWeek];
    if (key !== undefined) {
      out[key] =
        row.isActive !== false
          ? { start: timeStr(row.startTime), end: timeStr(row.endTime) }
          : null;
    }
  }
  return out;
}

export default function ProfilePage() {
  const { user, isLoading, refetch: refetchUser } = useAuth();
  const [weeklyHours, setWeeklyHours] = useState<number>(40);
  const [weeklyHoursLoading, setWeeklyHoursLoading] = useState(false);
  const [weeklyHoursSaving, setWeeklyHoursSaving] = useState(false);
  const [weeklyHoursError, setWeeklyHoursError] = useState<string | null>(null);
  const [allSkills, setAllSkills] = useState<{ id: number; name: string }[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillActionLoading, setSkillActionLoading] = useState<number | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const isStaff = user?.role === "staff";

  const loadWeeklyHours = useCallback(async () => {
    if (!isStaff) return;
    setWeeklyHoursLoading(true);
    setWeeklyHoursError(null);
    try {
      const data = await getMeWeeklyHours();
      if (data?.hoursPerWeek != null) setWeeklyHours(data.hoursPerWeek);
    } catch (e) {
      setWeeklyHoursError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setWeeklyHoursLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    loadWeeklyHours();
  }, [loadWeeklyHours]);

  const loadAllSkills = useCallback(async () => {
    if (!isStaff) return;
    setSkillsLoading(true);
    setSkillsError(null);
    try {
      const list = await getSkills();
      setAllSkills(Array.isArray(list) ? list : []);
    } catch (e) {
      setSkillsError(e instanceof Error ? e.message : "Failed to load skills");
      setAllSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    loadAllSkills();
  }, [loadAllSkills]);

  const handleAssignSkill = async (skillId: number) => {
    setSkillActionLoading(skillId);
    setSkillsError(null);
    try {
      await assignMeSkill(skillId);
      await refetchUser();
    } catch (e) {
      setSkillsError(e instanceof Error ? e.message : "Failed to assign skill");
    } finally {
      setSkillActionLoading(null);
    }
  };

  const handleUnassignSkill = async (skillId: number) => {
    setSkillActionLoading(skillId);
    setSkillsError(null);
    try {
      await unassignMeSkill(skillId);
      await refetchUser();
    } catch (e) {
      setSkillsError(e instanceof Error ? e.message : "Failed to unassign skill");
    } finally {
      setSkillActionLoading(null);
    }
  };

  const handleSaveWeeklyHours = async () => {
    const value = Math.min(168, Math.max(1, Math.round(weeklyHours)));
    setWeeklyHoursSaving(true);
    setWeeklyHoursError(null);
    try {
      await updateMeWeeklyHours(value);
      setWeeklyHours(value);
    } catch (e) {
      setWeeklyHoursError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setWeeklyHoursSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-muted">Sign in to view your profile.</p>
    );
  }

  const locations = user.locations ?? [];
  const skills = user.skills ?? [];
  const desiredHours = user.setting?.hoursPerWeek;
  const initialAvailability = availabilityFromMeApi(user.availabilities ?? []);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Profile</h1>
      <Card>
        <CardHeader>Account</CardHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Name</dt>
            <dd className="font-medium text-white">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="text-gray-200">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Role</dt>
            <dd>
              <Badge>{user.role}</Badge>
            </dd>
          </div>
          {user.role === "staff" && (
            <>
              {locations.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Locations (certified)</dt>
                  <dd className="text-gray-200">
                    {locations.map((l) => l.name).join(", ")}
                  </dd>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Skills</dt>
                  <dd>
                    {skills.map((s) => (
                      <Badge key={s.id} variant="muted" className="mr-1">
                        {s.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              {desiredHours != null && (
                <div>
                  <dt className="text-xs text-muted">Desired hours/week</dt>
                  <dd className="text-gray-200">{desiredHours}</dd>
                </div>
              )}
            </>
          )}
        </dl>
        <p className="mt-4 text-sm text-muted">
          Notification preferences: In-app (MVP).
        </p>
      </Card>

      {user.role === "staff" && (
        <>
          <Card className="mt-6">
            <CardHeader>Weekly hours</CardHeader>
            <p className="mb-4 text-sm text-muted">
              Your desired hours per week (1–168).
            </p>
            {weeklyHoursError && (
              <p className="mb-3 text-sm text-red-500">{weeklyHoursError}</p>
            )}
            {weeklyHoursLoading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value) || 40)}
                  className="w-24 rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-sm text-muted">hours per week</span>
                <Button
                  onClick={handleSaveWeeklyHours}
                  disabled={weeklyHoursSaving}
                >
                  {weeklyHoursSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="mt-6">
            <CardHeader>Skills</CardHeader>
            <p className="mb-4 text-sm text-muted">
              Assign skills to your profile. Click the × on a badge to unassign.
            </p>
            {skillsError && (
              <p className="mb-3 text-sm text-red-500">{skillsError}</p>
            )}
            {skillsLoading ? (
              <p className="text-sm text-muted">Loading skills…</p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {(user.skills ?? []).map((s) => (
                    <Badge key={s.id} variant="muted" className="inline-flex items-center gap-1 pr-1">
                      {s.name}
                      <button
                        type="button"
                        onClick={() => handleUnassignSkill(s.id)}
                        disabled={skillActionLoading !== null}
                        className="rounded p-0.5 hover:bg-white/20 disabled:opacity-50"
                        aria-label={`Unassign ${s.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(user.skills ?? []).length === 0 && (
                    <span className="text-sm text-muted">No skills assigned yet.</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id) handleAssignSkill(id);
                      e.target.value = "";
                    }}
                    disabled={skillActionLoading !== null}
                    className="rounded border border-border bg-surface py-2 pl-3 pr-8 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  >
                    <option value="">Add a skill…</option>
                    {allSkills
                      .filter((s) => !(user.skills ?? []).some((us) => us.id === s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}
          </Card>

          <div className="mt-6">
            <AvailabilityEditor initial={initialAvailability} />
          </div>
        </>
      )}
    </>
  );
}
