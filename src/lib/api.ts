/**
 * Admin API client — same pattern as the mobile app: every function
 * documents its real backend route and serves mock data until
 * NEXT_PUBLIC_API_URL is configured.
 */
import {
  MOCK_ADMIN_APPOINTMENTS,
  MOCK_PROVIDER_APPLICATIONS,
  MOCK_REVIEWS,
  MOCK_STATS,
  MOCK_USERS,
} from "./mock";
import type {
  AdminAppointment,
  AdminUser,
  DashboardStats,
  ProviderApplication,
  Review,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || !API_URL;

const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Live calls go through the same-origin proxy (app/api/backend), which reads
  // the httpOnly session cookie and attaches the admin bearer token server-side.
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export const api = {
  /** GET /admin/stats */
  async stats(): Promise<DashboardStats> {
    if (USE_MOCK) return delay().then(() => MOCK_STATS);
    return request("/admin/stats");
  },

  /** GET /admin/providers/applications */
  async providerApplications(): Promise<ProviderApplication[]> {
    if (USE_MOCK) return delay().then(() => MOCK_PROVIDER_APPLICATIONS);
    return request("/admin/providers/applications");
  },

  /** POST /admin/providers/applications/:id/decision */
  async decideProvider(id: string, decision: "approved" | "rejected"): Promise<void> {
    if (USE_MOCK) return delay(200);
    return request(`/admin/providers/applications/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  },

  /** GET /admin/reviews?status=pending */
  async reviews(): Promise<Review[]> {
    if (USE_MOCK) return delay().then(() => MOCK_REVIEWS);
    return request("/admin/reviews?status=pending");
  },

  /** POST /admin/reviews/:id/decision */
  async decideReview(id: string, decision: "published" | "removed"): Promise<void> {
    if (USE_MOCK) return delay(200);
    return request(`/admin/reviews/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  },

  /** GET /admin/users */
  async users(): Promise<AdminUser[]> {
    if (USE_MOCK) return delay().then(() => MOCK_USERS);
    return request("/admin/users");
  },

  /** GET /admin/appointments */
  async appointments(): Promise<AdminAppointment[]> {
    if (USE_MOCK) return delay().then(() => MOCK_ADMIN_APPOINTMENTS);
    return request("/admin/appointments");
  },
};
