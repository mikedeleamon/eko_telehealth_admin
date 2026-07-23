/**
 * Admin domain models. These mirror the shared backend contracts used by the
 * mobile app (eko_telehealth/src/api/types.ts) plus admin-only resources.
 */

export type ProviderType = "Doctor" | "Nurse" | "Pharmacy" | "Lab" | "Therapist" | "Clinic";

export type VerificationStatus = "pending" | "approved" | "rejected";

/** A verification document an applicant uploaded ahead of submitting. */
export interface ProviderApplicationDocument {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  /** Resolved, fetchable link — R2 public URL (live) or the storage key as a fallback. */
  url: string;
}

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
  /** The bookable doctors row id, once approval has created one. Undefined until then. */
  doctorId?: string;
  /**
   * Admin-granted in-home care privilege (task 2.3) — only meaningful once
   * doctorId is set. Undefined (not false) when there's no linked doctor row
   * yet, so the UI can distinguish "not applicable" from "off".
   */
  canProvideInHome?: boolean;
  /** The directory pharmacies row id, once a Pharmacy approval has created one (Batch 3 Phase 3). Undefined until then. */
  pharmacyId?: string;
  /** Whether the directory pharmacy is currently active (visible to patients). Only meaningful once pharmacyId is set. */
  pharmacyActive?: boolean;
  /** Credentials the applicant uploaded for review — not required to submit. */
  documents: ProviderApplicationDocument[];
}

export type ReviewStatus = "pending" | "published" | "removed";

export interface Review {
  id: string;
  author: string;
  subject: string;
  /** 'patient→provider' or 'provider→patient' — reviews are two-way. */
  direction: "patient→provider" | "provider→patient";
  /** Overall score — the rounded average of the three dimensions below. */
  rating: number;
  /** Per-dimension scores. Absent on reviews submitted before this shipped. */
  communicationRating?: number | null;
  experienceRating?: number | null;
  speedyResponseRating?: number | null;
  text: string;
  submittedAt: string;
  status: ReviewStatus;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /** 'Provider' covers Nurse/Therapist (and any future non-Doctor type) — 'Doctor' is kept as a legacy alias. */
  accountType: "Patient" | "Doctor" | "Provider";
  joined: string;
  status: "active" | "suspended";
  /** Government-ID verification (not a booking gate — a trust signal). */
  govId: {
    status: "none" | "pending" | "verified" | "rejected";
    fileName?: string;
    url?: string;
  };
}

export interface AdminAppointment {
  id: string;
  patient: string;
  provider: string;
  type: "Video Visit" | "Clinic Visit" | "Home Visit";
  date: string;
  fee: string;
  status: "upcoming" | "checked_in" | "completed" | "no_show" | "cancelled";
}

/** Shared by the appointments page and the dashboard's recent-appointments widget. */
export const APPOINTMENT_STATUS_BADGE_VARIANT: Record<AdminAppointment["status"], "green" | "red" | "orange" | "accent" | "gray"> = {
  upcoming: "accent",
  checked_in: "green",
  completed: "green",
  no_show: "orange",
  cancelled: "red",
};

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
  pendingComplaints: number;
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

export type ComplaintCategory = "billing" | "appointment" | "provider" | "technical" | "other";
export type ComplaintStatus = "pending" | "resolved" | "dismissed";

/**
 * A report a patient or doctor filed via the app's Settings → Report a
 * Problem (task 2.1). A trackable alternative to a static "contact us" —
 * this has a real lifecycle the admin manages and the filer sees resolved.
 */
export interface Complaint {
  id: string;
  authorName: string;
  accountType: "Patient" | "Doctor" | "Provider";
  category: ComplaintCategory;
  subject: string;
  description: string;
  appointmentId?: string;
  status: ComplaintStatus;
  resolutionNote?: string;
  submittedAt: string;
}

/**
 * A display currency (task 2.4) — used only to convert a canonical-NGN fee
 * for browsing/checkout preview in the mobile app. The platform's actual
 * pricing and settlement currency is always NGN; editing a rate here never
 * changes what's charged, only what a patient sees it as.
 */
export interface Currency {
  id: string;
  /** ISO 4217, e.g. 'USD'. */
  code: string;
  symbol: string;
  /** NGN per 1 unit of this currency, e.g. USD → 1600. NGN's own row is 1. */
  ngnRate: number;
  active: boolean;
}

/**
 * Admin-editable prose (task 2.2) — AboutUsScreen, TermsOfServiceScreen,
 * PrivacyPolicyScreen in the mobile app. `key` is fixed (see backend
 * migrations/0009_content_blocks.sql) — this editor updates text, not
 * structure; it can't create new blocks the app has nowhere to render.
 */
export interface ContentBlock {
  key: string;
  title: string;
  body: string;
  updatedAt: string;
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
