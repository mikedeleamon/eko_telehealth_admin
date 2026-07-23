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

export const MOCK_STATS: DashboardStats = {
  totalPatients: 1284,
  activeProviders: 96,
  appointmentsThisWeek: 214,
  revenueThisMonth: "₦4,820,000",
  vatCollected: "₦612,000",
  pendingVerifications: 4,
  pendingReviews: 3,
  pendingComplaints: 2,
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

export const MOCK_CURRENCIES: Currency[] = [
  { id: "cur-1", code: "NGN", symbol: "₦", ngnRate: 1, active: true },
  { id: "cur-2", code: "USD", symbol: "$", ngnRate: 1600, active: true },
  { id: "cur-3", code: "GBP", symbol: "£", ngnRate: 2000, active: true },
  { id: "cur-4", code: "EUR", symbol: "€", ngnRate: 1750, active: true },
];

export const MOCK_CONTENT_BLOCKS: ContentBlock[] = [
  {
    key: "about_mission",
    title: "Our Mission",
    body: "Eko Telehealth connects patients with licensed, verified doctors for video, clinic, and home visits — bringing quality healthcare within reach, wherever you are.",
    updatedAt: "2026-01-08T09:00:00.000Z",
  },
  {
    key: "about_contact",
    title: "Contact Us",
    body: "Have a question or need help? Reach our support team at support@ekotelehealth.com, or use \"Report a Problem\" in Settings to file a trackable request.",
    updatedAt: "2026-01-08T09:00:00.000Z",
  },
  {
    key: "terms_of_service",
    title: "Terms of Service",
    body: "By using Eko Telehealth, you agree to receive care from licensed providers subject to their own professional obligations, to provide accurate information during registration and consultations, and to use the platform only for its intended purpose of arranging and conducting telehealth visits. Eko Telehealth is a marketplace connecting patients and providers; it does not itself practice medicine. Full terms are available on request from support@ekotelehealth.com.",
    updatedAt: "2026-01-08T09:00:00.000Z",
  },
  {
    key: "privacy_policy",
    title: "Privacy Policy",
    body: "Eko Telehealth collects the information needed to provide care: your account details, appointment history, and any medical information you or your provider add to your record. This information is shared only with providers you consult and is never sold. You can request a copy or deletion of your data at any time via support@ekotelehealth.com.",
    updatedAt: "2026-01-08T09:00:00.000Z",
  },
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
    documents: [
      {
        key: "mock/kelechi-license.pdf",
        fileName: "MDCN License 2026.pdf",
        mimeType: "application/pdf",
        sizeBytes: 482_000,
        uploadedAt: "2026-07-03T09:12:00.000Z",
        url: "https://example.com/mock/kelechi-license.pdf",
      },
      {
        key: "mock/kelechi-id.jpg",
        fileName: "National ID.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1_240_000,
        uploadedAt: "2026-07-03T09:13:00.000Z",
        url: "https://example.com/mock/kelechi-id.jpg",
      },
    ],
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
    documents: [],
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
    documents: [],
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
    documents: [],
  },
  // Already-approved, with a linked bookable doctor — so the in-home care
  // toggle (task 2.3) has something to demo. Mirrors the mobile app's
  // MOCK_DOCTORS id '1' (Amara Okafor), which is seeded canProvideInHome: true.
  {
    id: "v5",
    name: "Dr. Amara Okafor MD",
    type: "Doctor",
    specialty: "Primary Care",
    location: "Victoria Island, Lagos",
    submittedAt: "Jan 8, 2026",
    checks: { govId: true, email: true, phone: true },
    status: "approved",
    doctorId: "1",
    canProvideInHome: true,
    documents: [],
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

export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: "c1",
    authorName: "Martin Doe",
    accountType: "Patient",
    category: "billing",
    subject: "Charged twice for the same visit",
    description: "I was charged twice on my card for my July 18 video visit with Dr. Okafor. Please refund the duplicate charge.",
    status: "pending",
    submittedAt: "Jul 19, 2026",
  },
  {
    id: "c2",
    authorName: "Emeka Obi",
    accountType: "Patient",
    category: "provider",
    subject: "Doctor was 25 minutes late",
    description: "My appointment was scheduled for 2:00 PM but the doctor didn't join the call until 2:25 PM with no notice.",
    status: "pending",
    submittedAt: "Jul 15, 2026",
  },
  {
    id: "c3",
    authorName: "Dr. Chinedu Eze",
    accountType: "Doctor",
    category: "technical",
    subject: "Video call kept freezing",
    description: "The video kept freezing every couple of minutes during a consultation and we had to finish over audio only.",
    status: "resolved",
    resolutionNote: "Traced to a CDN region issue on our video provider's side, resolved as of Jul 12.",
    submittedAt: "Jul 10, 2026",
  },
];

export const MOCK_USERS: AdminUser[] = [
  { id: "u1", name: "Martin Doe", email: "martin@ekotelehealth.com", accountType: "Patient", joined: "Feb 12, 2026", status: "active", govId: { status: "none" } },
  { id: "u2", name: "Dr. Amara Okafor", email: "a.okafor@ekotelehealth.com", accountType: "Doctor", joined: "Jan 8, 2026", status: "active", govId: { status: "verified", fileName: "MDCN-license.jpg" } },
  { id: "u3", name: "Ngozi Nwosu", email: "ngozi.n@gmail.com", accountType: "Patient", joined: "Mar 3, 2026", status: "active", govId: { status: "pending", fileName: "national-id.jpg", url: "https://example.com/mock/ngozi-id.jpg" } },
  { id: "u4", name: "Dr. Chinedu Eze", email: "c.eze@ekotelehealth.com", accountType: "Doctor", joined: "Jan 22, 2026", status: "active", govId: { status: "none" } },
  { id: "u5", name: "Tunde Bakare", email: "tunde.b@yahoo.com", accountType: "Patient", joined: "Apr 17, 2026", status: "suspended", govId: { status: "none" } },
  { id: "u6", name: "Emeka Obi", email: "emeka.obi@gmail.com", accountType: "Patient", joined: "May 2, 2026", status: "active", govId: { status: "none" } },
  { id: "u7", name: "Adaeze Okoro", email: "adaeze.okoro@ekotelehealth.com", accountType: "Provider", joined: "Jul 1, 2026", status: "active", govId: { status: "none" } },
];

export const MOCK_ADMIN_APPOINTMENTS: AdminAppointment[] = [
  { id: "a1", patient: "Martin Doe", provider: "Dr. Amara Okafor", type: "Video Visit", date: "Jul 6, 2026 · 10:00 AM", fee: "₦15,000", status: "upcoming" },
  { id: "a2", patient: "Emeka Obi", provider: "Dr. Chinedu Eze", type: "Clinic Visit", date: "Jul 6, 2026 · 2:30 PM", fee: "₦22,000", status: "upcoming" },
  { id: "a3", patient: "Ngozi Nwosu", provider: "Dr. Funmilayo Adeyemi", type: "Video Visit", date: "Jul 5, 2026 · 11:00 AM", fee: "₦28,000", status: "completed" },
  { id: "a4", patient: "Yusuf Ibrahim", provider: "Nurse Adaeze Okoro", type: "Home Visit", date: "Jul 4, 2026 · 9:00 AM", fee: "₦18,000", status: "completed" },
  { id: "a5", patient: "Tunde Bakare", provider: "Dr. Aisha Bello", type: "Video Visit", date: "Jul 3, 2026 · 3:00 PM", fee: "₦20,000", status: "cancelled" },
];
