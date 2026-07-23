/**
 * Admin API client — same pattern as the mobile app: every function
 * documents its real backend route and serves mock data until
 * NEXT_PUBLIC_API_URL is configured.
 */
import {
  MOCK_ADMIN_APPOINTMENTS,
  MOCK_COMPLAINTS,
  MOCK_CONTENT_BLOCKS,
  MOCK_CURRENCIES,
  MOCK_PLATFORM_SETTINGS,
  MOCK_PROMO_CODES,
  MOCK_PROVIDER_APPLICATIONS,
  MOCK_REVIEWS,
  MOCK_STATS,
  MOCK_USERS,
} from "./mock";
import type {
  AdminAppointment,
  AdminUser,
  Complaint,
  ContentBlock,
  Currency,
  DashboardStats,
  PlatformSettings,
  PromoCode,
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

  /**
   * POST /admin/providers/applications/:id/decision — mirrors the real
   * backend: Doctor/Nurse/Therapist approvals create a live doctors entity
   * (Batch 3 Phase 2), a Pharmacy approval creates a directory pharmacies
   * entity (Phase 3), Lab/Clinic still don't have one yet. Previously this
   * mock branch didn't mutate anything, so the UI's own optimistic overlay
   * was silently covering for it — now that overlay is gone, the mock has
   * to actually update state itself.
   */
  async decideProvider(id: string, decision: "approved" | "rejected"): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const app = MOCK_PROVIDER_APPLICATIONS.find((a) => a.id === id);
        if (!app) return;
        app.status = decision;
        const isAppointmentType = app.type === "Doctor" || app.type === "Nurse" || app.type === "Therapist";
        if (decision === "approved" && isAppointmentType && !app.doctorId) {
          app.doctorId = `mock-doctor-${app.id}`;
          // Nurse's primary modality is Home Visit — grant the privilege on
          // approval, same as the real backend's createEntityForApproval.
          app.canProvideInHome = app.type === "Nurse";
        }
        if (decision === "approved" && app.type === "Pharmacy" && !app.pharmacyId) {
          app.pharmacyId = `mock-pharmacy-${app.id}`;
          app.pharmacyActive = true;
        }
      });
    }
    return request(`/admin/providers/applications/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  },

  /** PATCH /admin/pharmacies/:id — toggle a directory pharmacy active/inactive. */
  async updatePharmacyActive(pharmacyId: string, active: boolean): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const app = MOCK_PROVIDER_APPLICATIONS.find((a) => a.pharmacyId === pharmacyId);
        if (app) app.pharmacyActive = active;
      });
    }
    await request(`/admin/pharmacies/${pharmacyId}`, { method: "PATCH", body: JSON.stringify({ active }) });
  },

  /**
   * PATCH /admin/providers/applications/:id/checks — set the 3 verification
   * booleans. Partial patch — pass only the ones being changed.
   */
  async updateProviderChecks(
    id: string,
    checks: Partial<{ govId: boolean; email: boolean; phone: boolean }>,
  ): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const app = MOCK_PROVIDER_APPLICATIONS.find((a) => a.id === id);
        if (app) app.checks = { ...app.checks, ...checks };
      });
    }
    await request(`/admin/providers/applications/${id}/checks`, { method: "PATCH", body: JSON.stringify(checks) });
  },

  /** PATCH /admin/doctors/:id — toggle a bookable provider's in-home care privilege. */
  async updateDoctorInHome(doctorId: string, canProvideInHome: boolean): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const app = MOCK_PROVIDER_APPLICATIONS.find((a) => a.doctorId === doctorId);
        if (app) app.canProvideInHome = canProvideInHome;
      });
    }
    await request(`/admin/doctors/${doctorId}`, { method: "PATCH", body: JSON.stringify({ canProvideInHome }) });
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

  /** PATCH /admin/users/:id/gov-id — approve or reject a submitted gov-ID document. */
  async updateUserGovId(id: string, status: "verified" | "rejected"): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const user = MOCK_USERS.find((u) => u.id === id);
        if (user) user.govId = { ...user.govId, status };
      });
    }
    await request(`/admin/users/${id}/gov-id`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  /** PATCH /admin/users/:id — suspend or reactivate a patient/provider account. */
  async updateUserStatus(id: string, status: "active" | "suspended"): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const user = MOCK_USERS.find((u) => u.id === id);
        if (user) user.status = status;
      });
    }
    await request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  /** GET /admin/appointments */
  async appointments(): Promise<AdminAppointment[]> {
    if (USE_MOCK) return delay().then(() => MOCK_ADMIN_APPOINTMENTS);
    return request("/admin/appointments");
  },

  /** GET /admin/settings — the platform's fee-schedule rates. */
  async settings(): Promise<PlatformSettings> {
    if (USE_MOCK) return delay().then(() => MOCK_PLATFORM_SETTINGS);
    return request("/admin/settings");
  },

  /** PATCH /admin/settings */
  async updateSettings(rates: PlatformSettings): Promise<PlatformSettings> {
    if (USE_MOCK) return delay(200).then(() => rates);
    return request("/admin/settings", { method: "PATCH", body: JSON.stringify(rates) });
  },

  /** GET /admin/promos */
  async promos(): Promise<PromoCode[]> {
    if (USE_MOCK) return delay().then(() => [...MOCK_PROMO_CODES]);
    return request("/admin/promos");
  },

  /** POST /admin/promos */
  async createPromo(input: Omit<PromoCode, "id" | "redemptions">): Promise<PromoCode> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const created: PromoCode = { ...input, id: `promo-${Date.now()}`, redemptions: 0 };
        MOCK_PROMO_CODES.push(created);
        return created;
      });
    }
    return request("/admin/promos", { method: "POST", body: JSON.stringify(input) });
  },

  /** PATCH /admin/promos/:id — the usual edit is toggling `active`. */
  async updatePromo(id: string, input: Partial<Omit<PromoCode, "id" | "redemptions">>): Promise<PromoCode> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const idx = MOCK_PROMO_CODES.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Promo not found");
        MOCK_PROMO_CODES[idx] = { ...MOCK_PROMO_CODES[idx], ...input };
        return MOCK_PROMO_CODES[idx];
      });
    }
    return request(`/admin/promos/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  /** GET /admin/complaints?status=pending */
  async complaints(): Promise<Complaint[]> {
    if (USE_MOCK) return delay().then(() => MOCK_COMPLAINTS.filter((c) => c.status === "pending"));
    return request("/admin/complaints?status=pending");
  },

  /** POST /admin/complaints/:id/decision */
  async decideComplaint(id: string, decision: "resolved" | "dismissed", resolutionNote?: string): Promise<void> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const complaint = MOCK_COMPLAINTS.find((c) => c.id === id);
        if (complaint) {
          complaint.status = decision;
          complaint.resolutionNote = resolutionNote;
        }
      });
    }
    return request(`/admin/complaints/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, resolutionNote }),
    });
  },

  /** GET /admin/currencies — every display currency, including inactive ones. */
  async currencies(): Promise<Currency[]> {
    if (USE_MOCK) return delay().then(() => [...MOCK_CURRENCIES]);
    return request("/admin/currencies");
  },

  /** POST /admin/currencies */
  async createCurrency(input: Omit<Currency, "id">): Promise<Currency> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const created: Currency = { ...input, id: `cur-${Date.now()}` };
        MOCK_CURRENCIES.push(created);
        return created;
      });
    }
    return request("/admin/currencies", { method: "POST", body: JSON.stringify(input) });
  },

  /** PATCH /admin/currencies/:id — the usual edit is a rate refresh or toggling `active`. */
  async updateCurrency(id: string, input: Partial<Omit<Currency, "id">>): Promise<Currency> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const idx = MOCK_CURRENCIES.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error("Currency not found");
        MOCK_CURRENCIES[idx] = { ...MOCK_CURRENCIES[idx], ...input };
        return MOCK_CURRENCIES[idx];
      });
    }
    return request(`/admin/currencies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  /** GET /admin/content — every content block, for the editor list. */
  async content(): Promise<ContentBlock[]> {
    if (USE_MOCK) return delay().then(() => [...MOCK_CONTENT_BLOCKS]);
    return request("/admin/content");
  },

  /** PATCH /admin/content/:key — edit a block's title/body. */
  async updateContent(key: string, input: { title?: string; body?: string }): Promise<ContentBlock> {
    if (USE_MOCK) {
      return delay(200).then(() => {
        const idx = MOCK_CONTENT_BLOCKS.findIndex((c) => c.key === key);
        if (idx === -1) throw new Error("Content block not found");
        MOCK_CONTENT_BLOCKS[idx] = { ...MOCK_CONTENT_BLOCKS[idx], ...input, updatedAt: new Date().toISOString() };
        return MOCK_CONTENT_BLOCKS[idx];
      });
    }
    return request(`/admin/content/${key}`, { method: "PATCH", body: JSON.stringify(input) });
  },
};
