"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export type UserWithLocationsAndSkills = {
  id: number;
  name: string;
  locations?: { id: number; name: string }[];
  skills?: { id: number; name: string }[];
};

type Option = { id: number; name: string };

interface UserLocationsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserWithLocationsAndSkills | null;
  allLocations: Option[];
  allSkills: Option[];
  onAssignLocation: (userId: number, locationId: number) => Promise<void>;
  onUnassignLocation: (userId: number, locationId: number) => Promise<void>;
  onAssignSkill: (userId: number, skillId: number) => Promise<void>;
  onUnassignSkill: (userId: number, skillId: number) => Promise<void>;
}

export function UserLocationsModal({
  open,
  onClose,
  user,
  allLocations,
  allSkills,
  onAssignLocation,
  onUnassignLocation,
  onAssignSkill,
  onUnassignSkill,
}: UserLocationsModalProps) {
  const [assigningLocationId, setAssigningLocationId] = useState<number | null>(null);
  const [unassigningLocationId, setUnassigningLocationId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [assigningSkillId, setAssigningSkillId] = useState<number | null>(null);
  const [unassigningSkillId, setUnassigningSkillId] = useState<number | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const assignedLocations = user?.locations ?? [];
  const assignedLocationIds = new Set(assignedLocations.map((l) => l.id));
  const availableLocations = allLocations.filter((l) => !assignedLocationIds.has(l.id));

  const assignedSkills = user?.skills ?? [];
  const assignedSkillIds = new Set(assignedSkills.map((s) => s.id));
  const availableSkills = allSkills.filter((s) => !assignedSkillIds.has(s.id));

  const handleAssignLocation = async () => {
    if (!user || !selectedLocationId) return;
    const locationId = Number(selectedLocationId);
    if (Number.isNaN(locationId)) return;
    setError(null);
    setAssigningLocationId(locationId);
    try {
      await onAssignLocation(user.id, locationId);
      setSelectedLocationId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign location");
    } finally {
      setAssigningLocationId(null);
    }
  };

  const handleUnassignLocation = async (locationId: number) => {
    if (!user) return;
    setError(null);
    setUnassigningLocationId(locationId);
    try {
      await onUnassignLocation(user.id, locationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unassign location");
    } finally {
      setUnassigningLocationId(null);
    }
  };

  const handleAssignSkill = async () => {
    if (!user || !selectedSkillId) return;
    const skillId = Number(selectedSkillId);
    if (Number.isNaN(skillId)) return;
    setError(null);
    setAssigningSkillId(skillId);
    try {
      await onAssignSkill(user.id, skillId);
      setSelectedSkillId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign skill");
    } finally {
      setAssigningSkillId(null);
    }
  };

  const handleUnassignSkill = async (skillId: number) => {
    if (!user) return;
    setError(null);
    setUnassigningSkillId(skillId);
    try {
      await onUnassignSkill(user.id, skillId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unassign skill");
    } finally {
      setUnassigningSkillId(null);
    }
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Edit user — ${user.name}`}>
      <div className="space-y-6">
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div>
          <p className="mb-2 text-xs font-medium text-muted">Locations</p>
          <div className="flex flex-wrap gap-2">
            {assignedLocations.length === 0 ? (
              <span className="text-sm text-muted">None assigned.</span>
            ) : (
              assignedLocations.map((loc) => (
                <span
                  key={loc.id}
                  className="inline-flex items-center gap-1 rounded-full bg-border/50 px-2.5 py-1 text-sm text-gray-200"
                >
                  {loc.name}
                  <button
                    type="button"
                    onClick={() => handleUnassignLocation(loc.id)}
                    disabled={unassigningLocationId !== null}
                    className="rounded p-0.5 hover:bg-white/20 disabled:opacity-50"
                    aria-label={`Unassign ${loc.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          {availableLocations.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                disabled={assigningLocationId !== null}
                className="rounded border border-border bg-surface py-2 pl-3 pr-8 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              >
                <option value="">Add location…</option>
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssignLocation}
                disabled={!selectedLocationId || assigningLocationId !== null}
              >
                {assigningLocationId !== null ? "Assigning…" : "Assign"}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted">Skills</p>
          <div className="flex flex-wrap gap-2">
            {assignedSkills.length === 0 ? (
              <span className="text-sm text-muted">None assigned.</span>
            ) : (
              assignedSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 rounded-full bg-border/50 px-2.5 py-1 text-sm text-gray-200"
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => handleUnassignSkill(skill.id)}
                    disabled={unassigningSkillId !== null}
                    className="rounded p-0.5 hover:bg-white/20 disabled:opacity-50"
                    aria-label={`Unassign ${skill.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          {availableSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                disabled={assigningSkillId !== null}
                className="rounded border border-border bg-surface py-2 pl-3 pr-8 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              >
                <option value="">Add skill…</option>
                {availableSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssignSkill}
                disabled={!selectedSkillId || assigningSkillId !== null}
              >
                {assigningSkillId !== null ? "Assigning…" : "Assign"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
