"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

/**
 * Chrome around the pages. The login page renders standalone (no sidebar);
 * every other route gets the sidebar + main content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 lg:p-10 max-w-7xl">{children}</main>
    </div>
  );
}
