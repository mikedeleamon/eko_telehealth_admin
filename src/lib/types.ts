/**
 * Admin domain models. These mirror the shared backend contracts used by the
 * mobile app (eko_telehealth/src/api/types.ts) plus admin-only resources.
 */

export type ProviderType = "Doctor" | "Nurse" | "Pharmacy" | "Lab" | "Therapist" | "Clinic";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface ProviderApplication {
  id: string;
  name: string;
  type: ProviderType;
  specialty: string;
  location: string;
  submittedAt: string;
  /** Gov ID, email & phone — the three checks named in the pitch. */
  checks: { govId: boolean; email: boolean; phone: boolean };
  status: VerificationStatus;
}

export type ReviewStatus = "pending" | "published" | "removed";

export interface Review {
  id: string;
  author: string;
  subject: string;
  /** 'patient→provider' or 'provider→patient' — reviews are two-way. */
  direction: "patient→provider" | "provider→patient";
  rating: number;
  text: string;
  submittedAt: string;
  status: ReviewStatus;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  accountType: "Patient" | "Doctor";
  joined: string;
  status: "active" | "suspended";
}

export interface AdminAppointment {
  id: string;
  patient: string;
  provider: string;
  type: "Video Visit" | "Clinic Visit" | "Home Visit";
  date: string;
  fee: string;
  status: "upcoming" | "completed" | "cancelled";
}

export interface DashboardStats {
  totalPatients: number;
  activeProviders: number;
  appointmentsThisWeek: number;
  /** Platform's own take (service charge + provider commission − discounts). Excludes VAT — see vatCollected. */
  revenueThisMonth: string;
  /** VAT collected from patients on Video Visits, owed to tax authorities — not platform revenue. */
  vatCollected: string;
  pendingVerifications: number;
  pendingReviews: number;
}

/**
 * The platform's fee-schedule rates (GET/PATCH /admin/settings). Fractions
 * (0.175 = 17.5%), matching the backend's internal representation — see
 * eko_telehealth_backend/src/lib/pricing.ts.
 */
export interface PlatformSettings {
  /** Patient-side platform fee, as a fraction of the consultation fee. */
  serviceChargePct: number;
  /** Provider-side commission withheld from payout, as a fraction of the consultation fee. */
  commissionPct: number;
  /** Patient-borne VAT, added on top — only applied to Video Visit. */
  vatPct: number;
}

/**
 * A discount code patients can apply at checkout (GET/POST/PATCH
 * /admin/promos). `value` is a fraction (0.20 = 20%) for kind:'percent' or a
 * flat NGN amount for kind:'flat'. `redemptions` is a live, derived count —
 * settled uses only, never abandoned checkouts — so it can't drift.
 */
export interface PromoCode {
  id: string;
  code: string;
  kind: "percent" | "flat";
  value: number;
  minSpend: number;
  /** Total redemptions allowed across all patients. Null = unlimited. */
  maxRedemptions: number | null;
  perUserLimit: number;
  /** ISO 8601, or null if the code never expires. */
  expiresAt: string | null;
  active: boolean;
  redemptions: number;
}
