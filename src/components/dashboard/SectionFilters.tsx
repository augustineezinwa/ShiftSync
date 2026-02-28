"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useEffect, useState } from "react";
import { MapPin, Calendar, ChevronDown } from "lucide-react";
import { LOCATIONS, getStaff } from "@/lib/mock-data";
import type { Role } from "@/lib/mock-data";

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

interface SectionFiltersProps {
  role?: Role;
  userId?: string | null;
}

export function SectionFilters({ role, userId }: SectionFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locationsParam = searchParams.get("locations") ?? "";
  const selectedLocationIds = locationsParam ? locationsParam.split(",").filter(Boolean) : [];
  const dateFrom = searchParams.get("dateFrom") ?? getDefaultDateRange().dateFrom;
  const dateTo = searchParams.get("dateTo") ?? getDefaultDateRange().dateTo;

  const availableLocations =
    role === "manager" || role === "staff"
      ? (() => {
        const staff = userId ? getStaff(userId) : null;
        return staff?.locationIds?.length
          ? LOCATIONS.filter((l) => staff.locationIds.includes(l.id))
          : LOCATIONS;
      })()
      : LOCATIONS;

  const buildUrl = useCallback(
    (updates: { locations?: string[]; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.locations !== undefined) {
        if (updates.locations.length) params.set("locations", updates.locations.join(","));
        else params.delete("locations");
      }
      if (updates.dateFrom !== undefined) {
        if (updates.dateFrom) params.set("dateFrom", updates.dateFrom);
        else params.delete("dateFrom");
      }
      if (updates.dateTo !== undefined) {
        if (updates.dateTo) params.set("dateTo", updates.dateTo);
        else params.delete("dateTo");
      }
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const toggleLocation = (locationId: string) => {
    const next = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter((id) => id !== locationId)
      : [...selectedLocationIds, locationId];
    router.push(buildUrl({ locations: next }));
  };

  const clearLocations = () => {
    router.push(buildUrl({ locations: [] }));
    setDropdownOpen(false);
  };

  const setDateFrom = (v: string) => router.push(buildUrl({ dateFrom: v }));
  const setDateTo = (v: string) => router.push(buildUrl({ dateTo: v }));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const locationLabel =
    selectedLocationIds.length === 0
      ? "All locations"
      : selectedLocationIds.length === availableLocations.length
        ? "All locations"
        : selectedLocationIds
          .map((id) => availableLocations.find((l) => l.id === id)?.name ?? id)
          .join(", ");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surfaceElevated px-4 py-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" aria-hidden />
        <span className="text-sm font-medium text-gray-300">Location</span>
      </div>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex min-w-[180px] items-center justify-between gap-2 rounded border border-border bg-surface px-3 py-2 text-left text-sm text-gray-200 hover:border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <span className="truncate">{locationLabel}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-64 overflow-auto rounded border border-border bg-surfaceElevated py-1 shadow-lg">
            {availableLocations.map((loc) => {
              const checked = selectedLocationIds.includes(loc.id);
              return (
                <label
                  key={loc.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-border/50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLocation(loc.id)}
                    className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-gray-200">{loc.name}</span>
                </label>
              );
            })}
            {selectedLocationIds.length > 0 && (
              <button
                type="button"
                onClick={clearLocations}
                className="w-full px-3 py-2 text-left text-xs text-muted hover:bg-border/50 hover:text-gray-300"
              >
                Clear selection
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-300" aria-hidden />
        <span className="text-sm font-medium text-gray-300">Date range</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative inline-block">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="date-input-with-icon w-full min-w-[10rem] rounded border border-border bg-surface py-1.5 pl-2.5 pr-10 text-sm text-gray-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Calendar
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
            aria-hidden
          />
        </div>
        <span className="text-muted">–</span>
        <div className="relative inline-block">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="date-input-with-icon w-full min-w-[10rem] rounded border border-border bg-surface py-1.5 pl-2.5 pr-10 text-sm text-gray-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Calendar
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
            aria-hidden
          />
        </div>
      </div>
      <p className="w-full text-xs text-muted sm:w-auto">
        Date range mainly affects Fairness and Overtime tables.
      </p>
    </div>
  );
}
