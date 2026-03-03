"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "./Sidebar";
import type { Role } from "@/lib/mock-data";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
  userId?: string | null;
  loading?: boolean;
  title?: string;
}

export function DashboardLayout({ children, role, loading = false, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Overlay when sidebar is open on mobile */}
      <button
        type="button"
        aria-label="Close menu"
        className={clsx(
          "fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex rounded-md p-2 text-muted hover:bg-border/50 hover:text-gray-200 md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          {title && (
            <h1 className="text-lg font-semibold text-white sm:text-xl">{title}</h1>
          )}
        </header>
        <main className="flex-1 overflow-auto">
          {loading && (
            <div className="sticky top-0 z-10 h-0.5 w-full animate-pulse bg-accent/60" aria-hidden />
          )}
          <div className="mx-auto max-w-6xl p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
