import type {
  AdminAppointment,
  AdminUser,
  DashboardStats,
  PlatformSettings,
  PromoCode,
  ProviderApplication,
  Review,
} from "./types";

export const MOCK_STATS: DashboardStats = {
  totalPatients: 1284,
  activeProviders: 96,
  appointmentsThisWeek: 214,
  revenueThisMonth: "₦4,820,000",
  vatCollected: "₦612,000",
  pendingVerifications: 4,
  pendingReviews: 3,
};

export const MOCK_PLATFORM_SETTINGS: PlatformSettings = {
  serviceChargePct: 0,
  commissionPct: 0.175,
  vatPct: 0.075,
};

export const MOCK_PROMO_CODES: PromoCode[] = [
  { id: "promo-1", code: "SAVE20", kind: "percent", value: 0.2, minSpend: 0, maxRedemptions: null, perUserLimit: 1, expiresAt: null, active: true, redemptions: 37 },
  { id: "promo-2", code: "WELCOME2000", kind: "flat", value: 2000, minSpend: 10000, maxRedemptions: 50, perUserLimit: 1, expiresAt: null, active: true, redemptions: 12 },
  { id: "promo-3", code: "LAUNCH2025", kind: "percent", value: 0.3, minSpend: 0, maxRedemptions: 100, perUserLimit: 1, expiresAt: "2025-12-31T23:59:59.000Z", active: false, redemptions: 100 },
];

export const MOCK_PROVIDER_APPLICATIONS: ProviderApplication[] = [
  {
    id: "v1",
    name: "Dr. Kelechi Umeh",
    type: "Doctor",
    specialty: "Pediatrics",
    location: "Lekki, Lagos",
    submittedAt: "Jul 3, 2026",
    checks: { govId: true, email: true, phone: true },
    status: "pending",
  },
  {
    id: "v2",
    name: "GreenCross Pharmacy",
    type: "Pharmacy",
    specialty: "Retail pharmacy · delivery",
    location: "Surulere, Lagos",
    submittedAt: "Jul 2, 2026",
    checks: { govId: true, email: true, phone: false },
    status: "pending",
  },
  {
    id: "v3",
    name: "Nurse Adaeze Okoro",
    type: "Nurse",
    specialty: "Home care",
    location: "Enugu",
    submittedAt: "Jul 1, 2026",
    checks: { govId: false, email: true, phone: true },
    status: "pending",
  },
  {
    id: "v4",
    name: "Dr. Priya Nair",
    type: "Doctor",
    specialty: "Endocrinology (international)",
    location: "Dubai, UAE · Remote",
    submittedAt: "Jun 30, 2026",
    checks: { govId: true, email: true, phone: true },
    status: "pending",
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Martin D.",
    subject: "Dr. Amara Okafor",
    direction: "patient→provider",
    rating: 5,
    text: "Very attentive and explained everything clearly. The video visit saved me a full day of travel.",
    submittedAt: "Jul 4, 2026",
    status: "pending",
  },
  {
    id: "r2",
    author: "Dr. Chinedu Eze",
    subject: "Yusuf I.",
    direction: "provider→patient",
    rating: 4,
    text: "Punctual and provided complete history ahead of the consultation.",
    submittedAt: "Jul 3, 2026",
    status: "pending",
  },
  {
    id: "r3",
    author: "Ngozi N.",
    subject: "Dr. James Whitfield",
    direction: "patient→provider",
    rating: 2,
    text: "Call started 25 minutes late and was cut short. Contact me at 0803-XXX-XXXX to discuss.",
    submittedAt: "Jul 2, 2026",
    status: "pending",
  },
];

export const MOCK_USERS: AdminUser[] = [
  { id: "u1", name: "Martin Doe", email: "martin@ekotelehealth.com", accountType: "Patient", joined: "Feb 12, 2026", status: "active" },
  { id: "u2", name: "Dr. Amara Okafor", email: "a.okafor@ekotelehealth.com", accountType: "Doctor", joined: "Jan 8, 2026", status: "active" },
  { id: "u3", name: "Ngozi Nwosu", email: "ngozi.n@gmail.com", accountType: "Patient", joined: "Mar 3, 2026", status: "active" },
  { id: "u4", name: "Dr. Chinedu Eze", email: "c.eze@ekotelehealth.com", accountType: "Doctor", joined: "Jan 22, 2026", status: "active" },
  { id: "u5", name: "Tunde Bakare", email: "tunde.b@yahoo.com", accountType: "Patient", joined: "Apr 17, 2026", status: "suspended" },
  { id: "u6", name: "Emeka Obi", email: "emeka.obi@gmail.com", accountType: "Patient", joined: "May 2, 2026", status: "active" },
];

export const MOCK_ADMIN_APPOINTMENTS: AdminAppointment[] = [
  { id: "a1", patient: "Martin Doe", provider: "Dr. Amara Okafor", type: "Video Visit", date: "Jul 6, 2026 · 10:00 AM", fee: "₦15,000", status: "upcoming" },
  { id: "a2", patient: "Emeka Obi", provider: "Dr. Chinedu Eze", type: "Clinic Visit", date: "Jul 6, 2026 · 2:30 PM", fee: "₦22,000", status: "upcoming" },
  { id: "a3", patient: "Ngozi Nwosu", provider: "Dr. Funmilayo Adeyemi", type: "Video Visit", date: "Jul 5, 2026 · 11:00 AM", fee: "₦28,000", status: "completed" },
  { id: "a4", patient: "Yusuf Ibrahim", provider: "Nurse Adaeze Okoro", type: "Home Visit", date: "Jul 4, 2026 · 9:00 AM", fee: "₦18,000", status: "completed" },
  { id: "a5", patient: "Tunde Bakare", provider: "Dr. Aisha Bello", type: "Video Visit", date: "Jul 3, 2026 · 3:00 PM", fee: "₦20,000", status: "cancelled" },
];
