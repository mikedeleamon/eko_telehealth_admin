"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/providers", label: "Provider Verification", icon: "✓" },
  { href: "/reviews", label: "Review Moderation", icon: "★" },
  { href: "/users", label: "Users", icon: "👤" },
  { href: "/appointments", label: "Appointments", icon: "📅" },
  { href: "/promos", label: "Promo Codes", icon: "🏷" },
  { href: "/settings", label: "Fee Settings", icon: "⚙" },
];

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || !process.env.NEXT_PUBLIC_API_URL;

export function Sidebar() {
  const pathname = usePathname();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-black/5 flex flex-col">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
            E
          </div>
          <div>
            <p className="font-bold leading-tight">Eko Telehealth</p>
            <p className="text-xs tracking-[0.2em] text-accent font-medium">ADMIN</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-white shadow-lg shadow-accent/30"
                  : "text-foreground/60 hover:bg-card-purple hover:text-foreground"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {USE_MOCK ? (
        <div className="p-4 m-3 mb-4 rounded-2xl bg-card-blue text-xs text-foreground/70">
          Running on <span className="font-semibold">mock data</span>. Set{" "}
          <code className="font-mono">NEXT_PUBLIC_API_URL</code> to go live.
        </div>
      ) : (
        <button
          onClick={logout}
          className="m-3 mb-4 flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-card-purple hover:text-foreground"
        >
          <span className="w-5 text-center">⎋</span>
          Sign out
        </button>
      )}
    </aside>
  );
}
