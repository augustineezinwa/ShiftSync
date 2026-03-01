"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { getUsers, getLocations, getSkills, assignLocationToUser, unassignLocationFromUser, assignSkillToUser, unassignSkillFromUser } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { UserLocationsModal, type UserWithLocationsAndSkills } from "@/components/staff/UserLocationsModal";
import { Pencil } from "lucide-react";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  locations?: { id: number; name: string }[];
  skills?: { id: number; name: string }[];
  setting?: { hoursPerWeek: number } | null;
};

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<UserWithLocationsAndSkills | null>(null);
  const isAdmin = currentUser?.role === "admin";

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadLocations = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const list = await getLocations();
      setLocations(Array.isArray(list) ? list : []);
    } catch {
      setLocations([]);
    }
  }, [isAdmin]);

  const loadSkills = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const list = await getSkills();
      setSkills(Array.isArray(list) ? list : []);
    } catch {
      setSkills([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadLocations();
      loadSkills();
    }
  }, [isAdmin, loadUsers, loadLocations, loadSkills]);

  const handleAssignLocation = async (userId: number, locationId: number) => {
    await assignLocationToUser(userId, locationId);
    const list = await getUsers();
    const next = Array.isArray(list) ? list : [];
    setUsers(next);
    setModalUser((prev) => (prev ? (next.find((u) => u.id === prev.id) as UserWithLocationsAndSkills) ?? prev : null));
  };

  const handleUnassignLocation = async (userId: number, locationId: number) => {
    await unassignLocationFromUser(userId, locationId);
    const list = await getUsers();
    const next = Array.isArray(list) ? list : [];
    setUsers(next);
    setModalUser((prev) => (prev ? (next.find((u) => u.id === prev.id) as UserWithLocationsAndSkills) ?? prev : null));
  };

  const handleAssignSkill = async (userId: number, skillId: number) => {
    await assignSkillToUser(userId, skillId);
    const list = await getUsers();
    const next = Array.isArray(list) ? list : [];
    setUsers(next);
    setModalUser((prev) => (prev ? (next.find((u) => u.id === prev.id) as UserWithLocationsAndSkills) ?? prev : null));
  };

  const handleUnassignSkill = async (userId: number, skillId: number) => {
    await unassignSkillFromUser(userId, skillId);
    const list = await getUsers();
    const next = Array.isArray(list) ? list : [];
    setUsers(next);
    setModalUser((prev) => (prev ? (next.find((u) => u.id === prev.id) as UserWithLocationsAndSkills) ?? prev : null));
  };

  const staffList = users.filter((u) => u.role !== "admin");

  if (!currentUser) {
    return (
      <p className="text-muted">Sign in to view staff.</p>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold text-white">Staff</h1>
        <Card>
          <CardHeader>Staff</CardHeader>
          <p className="text-sm text-muted">Staff management is available to admins.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Staff</h1>
      <Card>
        <CardHeader>Staff</CardHeader>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        {loading ? (
          <p className="py-4 text-muted">Loading staff…</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Locations</Th>
                <Th>Skills</Th>
                <Th>Desired hrs/wk</Th>
                <Th>Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffList.map((u) => (
                <TableRow key={u.id}>
                  <Td className="font-medium text-white">{u.name}</Td>
                  <Td className="text-muted">{u.email}</Td>
                  <Td>
                    {(u.locations ?? []).length > 0
                      ? (u.locations ?? []).map((l) => l.name).join(", ")
                      : "—"}
                  </Td>
                  <Td>
                    {(u.skills ?? []).length > 0 ? (
                      (u.skills ?? []).map((s) => (
                        <Badge key={s.id} variant="muted" className="mr-1">
                          {s.name}
                        </Badge>
                      ))
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{u.setting?.hoursPerWeek ?? "—"}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setModalUser({ id: u.id, name: u.name, locations: u.locations ?? [], skills: u.skills ?? [] })}
                      className="rounded p-1.5 text-muted transition-colors hover:bg-border/50 hover:text-gray-200"
                      aria-label={`Edit locations for ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && staffList.length === 0 && (
          <p className="py-4 text-sm text-muted">No staff users found.</p>
        )}
      </Card>

      <UserLocationsModal
        open={modalUser !== null}
        onClose={() => setModalUser(null)}
        user={modalUser}
        allLocations={locations}
        allSkills={skills}
        onAssignLocation={handleAssignLocation}
        onUnassignLocation={handleUnassignLocation}
        onAssignSkill={handleAssignSkill}
        onUnassignSkill={handleUnassignSkill}
      />
    </>
  );
}
