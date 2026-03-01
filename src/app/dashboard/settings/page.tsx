"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import { getSkills, createSkill, updateSkill, getLocations, createLocation, updateLocation, getConfigs, createConfig, updateConfig } from "@/lib/api";
import { LocationModal, type LocationFormValues } from "@/components/settings/LocationModal";
import { Pencil, Plus } from "lucide-react";

type SkillRow = { id: number; name: string; isVerified: boolean };
type LocationRow = { id: number; name: string; timezone: string; offset: number; isVerified: boolean };
type ConfigRow = { id: number; key: string; value: number };

/** Convert DB key "x-y-z" to display "X Y Z" */
function configKeyToDisplay(key: string): string {
  return key
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

export default function SettingsPage() {
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editVerified, setEditVerified] = useState(false);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationEdit, setLocationEdit] = useState<LocationRow | null>(null);
  const [locationSubmitting, setLocationSubmitting] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [configsError, setConfigsError] = useState<string | null>(null);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState<number>(0);
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null);
  const [editConfigValue, setEditConfigValue] = useState<number>(0);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getSkills();
      setSkills(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load skills");
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const list = await getLocations();
      setLocations(Array.isArray(list) ? list : []);
    } catch (e) {
      setLocationsError(e instanceof Error ? e.message : "Failed to load locations");
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const loadConfigs = useCallback(async () => {
    setConfigsLoading(true);
    setConfigsError(null);
    try {
      const list = await getConfigs();
      setConfigs(Array.isArray(list) ? list : []);
    } catch (e) {
      setConfigsError(e instanceof Error ? e.message : "Failed to load config");
      setConfigs([]);
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = newConfigKey.trim().toLowerCase().replace(/\s+/g, "-");
    if (!key) return;
    setConfigSubmitting(true);
    setConfigsError(null);
    try {
      await createConfig(key, newConfigValue);
      setNewConfigKey("");
      setNewConfigValue(0);
      await loadConfigs();
    } catch (e) {
      setConfigsError(e instanceof Error ? e.message : "Failed to create config");
    } finally {
      setConfigSubmitting(false);
    }
  };

  const startEditConfig = (row: ConfigRow) => {
    setEditingConfigKey(row.key);
    setEditConfigValue(row.value);
  };

  const cancelEditConfig = () => {
    setEditingConfigKey(null);
  };

  const handleSaveConfig = async () => {
    if (editingConfigKey == null) return;
    setConfigSubmitting(true);
    setConfigsError(null);
    try {
      await updateConfig(editingConfigKey, editConfigValue);
      setEditingConfigKey(null);
      await loadConfigs();
    } catch (e) {
      setConfigsError(e instanceof Error ? e.message : "Failed to update config");
    } finally {
      setConfigSubmitting(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSkill(name, false);
      setNewName("");
      await loadSkills();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add skill");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (skill: SkillRow) => {
    setEditingId(skill.id);
    setEditName(skill.name);
    setEditVerified(skill.isVerified);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    const name = editName.trim();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateSkill(editingId, { name, isVerified: editVerified });
      setEditingId(null);
      await loadSkills();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update skill");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddLocation = () => {
    setLocationEdit(null);
    setLocationModalOpen(true);
  };

  const openEditLocation = (loc: LocationRow) => {
    setLocationEdit(loc);
    setLocationModalOpen(true);
  };

  const handleLocationSubmit = async (values: LocationFormValues) => {
    setLocationSubmitting(true);
    setLocationsError(null);
    try {
      if (locationEdit) {
        await updateLocation(locationEdit.id, values);
      } else {
        await createLocation(values);
      }
      setLocationModalOpen(false);
      setLocationEdit(null);
      await loadLocations();
    } catch (e) {
      setLocationsError(e instanceof Error ? e.message : "Failed to save location");
    } finally {
      setLocationSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Settings</h1>

      <Card className="mb-6">
        <CardHeader>Skills</CardHeader>
        <p className="mb-4 text-sm text-muted">
          Add and manage skills. Verified skills show a green badge.
        </p>

        <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="new-skill" className="mb-1 block text-xs text-muted">
              New skill name
            </label>
            <input
              id="new-skill"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bartender"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <Button type="submit" disabled={submitting || !newName.trim()}>
            {submitting ? "Adding…" : "Add skill"}
          </Button>
        </form>

        {error && (
          <p className="mb-4 text-sm text-red-500">{error}</p>
        )}

        {loading ? (
          <p className="text-muted">Loading skills…</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {skills.map((skill) => (
                <TableRow key={skill.id}>
                  <Td>
                    {editingId === skill.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full max-w-[14rem] rounded border border-border bg-surface px-2 py-1.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-white">{skill.name}</span>
                    )}
                  </Td>
                  <Td>
                    {editingId === skill.id ? (
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={editVerified}
                          onChange={(e) => setEditVerified(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                        />
                        Verified
                      </label>
                    ) : (
                      skill.isVerified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )
                    )}
                  </Td>
                  <Td>
                    {editingId === skill.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleSaveEdit}
                          disabled={submitting || !editName.trim()}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(skill)}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-border/50 hover:text-gray-200"
                        aria-label="Edit skill"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && skills.length === 0 && (
          <p className="py-4 text-sm text-muted">No skills yet. Add one above.</p>
        )}
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Locations</h2>
            <p className="mt-1 text-sm text-muted">
              Add and manage locations. Verified locations show a green badge.
            </p>
          </div>
          <Button onClick={openAddLocation} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4 shrink-0" />
            Add
          </Button>
        </div>

        {locationsError && (
          <p className="mb-4 text-sm text-red-500">{locationsError}</p>
        )}

        {locationsLoading ? (
          <p className="py-4 text-muted">Loading locations…</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Name</Th>
                <Th>Timezone</Th>
                <Th>Offset</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <Td className="font-medium text-white">{loc.name}</Td>
                  <Td className="text-gray-200">{loc.timezone}</Td>
                  <Td className="text-gray-200">{loc.offset}</Td>
                  <Td>
                    {loc.isVerified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => openEditLocation(loc)}
                      className="rounded p-1.5 text-muted transition-colors hover:bg-border/50 hover:text-gray-200"
                      aria-label="Edit location"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!locationsLoading && locations.length === 0 && (
          <p className="py-4 text-sm text-muted">No locations yet. Click Add to create one.</p>
        )}
      </Card>

      <LocationModal
        open={locationModalOpen}
        onClose={() => {
          setLocationModalOpen(false);
          setLocationEdit(null);
        }}
        initialValues={
          locationEdit
            ? {
                name: locationEdit.name,
                timezone: locationEdit.timezone,
                offset: locationEdit.offset,
                isVerified: locationEdit.isVerified,
              }
            : null
        }
        onSubmit={handleLocationSubmit}
        isSubmitting={locationSubmitting}
      />

      <Card className="mb-6">
        <CardHeader>Config</CardHeader>
        <p className="mb-4 text-sm text-muted">
          Config keys are stored as <code className="rounded bg-border/50 px-1 py-0.5 text-xs">x-y-z</code> in the database and shown as &quot;X Y Z&quot; here. When adding, enter the key in <code className="rounded bg-border/50 px-1 py-0.5 text-xs">x-y-z</code> format.
        </p>
        {configsError && (
          <p className="mb-4 text-sm text-red-500">{configsError}</p>
        )}

        <form onSubmit={handleAddConfig} className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="config-key" className="mb-1 block text-xs text-muted">
              Key (e.g. x-y-z)
            </label>
            <input
              id="config-key"
              type="text"
              value={newConfigKey}
              onChange={(e) => setNewConfigKey(e.target.value)}
              placeholder="e.g. max-hours-per-week"
              className="w-48 rounded border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="config-value" className="mb-1 block text-xs text-muted">
              Value
            </label>
            <input
              id="config-value"
              type="number"
              value={newConfigValue}
              onChange={(e) => setNewConfigValue(Number(e.target.value) ?? 0)}
              className="w-24 rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <Button type="submit" disabled={configSubmitting || !newConfigKey.trim()}>
            {configSubmitting ? "Adding…" : "Add config"}
          </Button>
        </form>

        {configsLoading ? (
          <p className="text-sm text-muted">Loading config…</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Key</Th>
                <Th>Value</Th>
                <Th>Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((row) => (
                <TableRow key={row.id}>
                  <Td className="font-medium text-white">
                    {configKeyToDisplay(row.key)}
                  </Td>
                  <Td>
                    {editingConfigKey === row.key ? (
                      <input
                        type="number"
                        value={editConfigValue}
                        onChange={(e) => setEditConfigValue(Number(e.target.value) ?? 0)}
                        className="w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-200">{row.value}</span>
                    )}
                  </Td>
                  <Td>
                    {editingConfigKey === row.key ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleSaveConfig}
                          disabled={configSubmitting}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditConfig}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditConfig(row)}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-border/50 hover:text-gray-200"
                        aria-label="Edit config"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!configsLoading && configs.length === 0 && (
          <p className="py-4 text-sm text-muted">No config entries yet. Add one above.</p>
        )}
      </Card>
    </>
  );
}
