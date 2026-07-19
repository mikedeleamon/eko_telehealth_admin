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
  revenueThisMonth: string;
  pendingVerifications: number;
  pendingReviews: number;
}
