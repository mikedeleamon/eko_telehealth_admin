import type {
  AdminAppointment,
  AdminPayout,
  AdminPrescription,
  AdminUser,
  Complaint,
  ContentBlock,
  Currency,
  DashboardStats,
  PlatformSettings,
  PromoCode,
  ProviderApplication,
  RedactedMessage,
  RevenueAnalysis,
  RevenueGranularity,
  Review,
  SupportMessage,
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

/**
 * Demo data for the revenue analysis page (SOW 1.18). Generated rather than
 * hand-written so the series always covers the range being asked for and the
 * chart has real shape to it — a hardcoded month of figures would go stale and
 * fall outside every preset the moment the calendar moved on.
 */
export function mockRevenue(
  from: Date,
  to: Date,
  granularity: RevenueGranularity,
): RevenueAnalysis {
  const buckets: { bucket: string; label: string }[] = [];
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const cursor = new Date(from);
  if (granularity === "month") cursor.setDate(1);
  if (granularity === "week") cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));

  while (cursor.getTime() < to.getTime()) {
    const k = key(cursor);
    const label =
      granularity === "month"
        ? cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : granularity === "week"
          ? `Wk of ${cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets.push({ bucket: k, label });
    if (granularity === "month") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + (granularity === "week" ? 7 : 1));
  }

  // Deterministic per-bucket variation: a seeded wobble, not Math.random, so
  // the page doesn't redraw a different "history" on every refetch.
  const seeded = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const scale = granularity === "day" ? 1 : granularity === "week" ? 6 : 26;

  const series = buckets.map((b, i) => {
    const visits = Math.round((2 + seeded(i) * 5) * scale);
    const gross = visits * 15_000;
    return { ...b, visits, gross, platformRevenue: Math.round(gross * 0.175) };
  });

  const totals = series.reduce(
    (acc, s) => ({
      ...acc,
      gross: acc.gross + s.gross,
      consultationFees: acc.consultationFees + Math.round(s.gross * 0.93),
      commission: acc.commission + s.platformRevenue,
      vat: acc.vat + Math.round(s.gross * 0.07),
      platformRevenue: acc.platformRevenue + s.platformRevenue,
      providerPayout: acc.providerPayout + (s.gross - s.platformRevenue),
      visits: acc.visits + s.visits,
    }),
    { gross: 0, consultationFees: 0, serviceCharge: 0, commission: 0, discount: 0, vat: 0, platformRevenue: 0, providerPayout: 0, visits: 0 },
  );

  const split = (share: number) => ({
    gross: Math.round(totals.gross * share),
    platformRevenue: Math.round(totals.platformRevenue * share),
    visits: Math.round(totals.visits * share),
  });

  return {
    range: { from: from.toISOString(), to: to.toISOString(), granularity },
    totals,
    previous: {
      platformRevenue: Math.round(totals.platformRevenue * 0.86),
      gross: Math.round(totals.gross * 0.86),
      visits: Math.round(totals.visits * 0.86),
      platformRevenueChangePct: 16.3,
      grossChangePct: 16.3,
    },
    series,
    byVisitType: [
      { type: "Video Visit", ...split(0.62) },
      { type: "Clinic Visit", ...split(0.23) },
      { type: "Home Visit", ...split(0.15) },
    ],
    byGateway: [
      { gateway: "flutterwave", ...split(0.78) },
      { gateway: "paypal", ...split(0.22) },
    ],
    topProviders: [
      { doctorId: "doc-1", name: "Dr. Amara Okafor", ...split(0.28) },
      { doctorId: "doc-2", name: "Dr. Sarah Johnson", ...split(0.21) },
      { doctorId: "doc-3", name: "Dr. Emeka Nwachukwu", ...split(0.16) },
      { doctorId: "doc-4", name: "Nurse Blessing Ade", ...split(0.11) },
    ],
  };
}

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

export const MOCK_REDACTED_MESSAGES: RedactedMessage[] = [
  {
    id: "rm1",
    conversationId: "conv-1",
    senderName: "Dr. James Whitfield",
    senderAccountType: "Doctor",
    counterpartyName: "Dr. James Whitfield",
    maskedText: "Happy to keep seeing you — just reach me directly on [contact details removed], it's faster.",
    originalText: "Happy to keep seeing you — just reach me directly on 0803 456 7890, it's faster.",
    sentAt: "2026-07-24T09:14:00.000Z",
  },
  {
    id: "rm2",
    conversationId: "conv-2",
    senderName: "Ngozi Nwosu",
    senderAccountType: "Patient",
    counterpartyName: "Dr. Amara Okafor",
    maskedText: "Can you send the referral to [contact details removed] instead?",
    originalText: "Can you send the referral to ngozi.nwosu@gmail.com instead?",
    sentAt: "2026-07-23T16:02:00.000Z",
  },
];

/**
 * Support threads keyed by complaint (task #05) — the reply channel that turns
 * the complaint queue into a conversation with the filer.
 */
export const MOCK_SUPPORT_MESSAGES: SupportMessage[] = [
  {
    id: "sm-1",
    complaintId: "c1",
    authorRole: "admin",
    authorName: "Eko Admin",
    body: "Thanks for flagging this \u2014 I can see two authorisations against your card for Jul 18. Checking with our payment provider now.",
    createdAt: "2026-07-19T14:10:00.000Z",
  },
  {
    id: "sm-2",
    complaintId: "c1",
    authorRole: "user",
    authorName: "Martin Doe",
    body: "Thank you. Only one visit actually happened, so the second one should not be there.",
    createdAt: "2026-07-19T15:02:00.000Z",
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

export const MOCK_PAYOUTS: AdminPayout[] = [
  { id: "po1", provider: "Dr. Amara Okafor", amount: "₦124,000", rail: "flutterwave_bank", status: "paid", destination: "GTBank ••••4321", reference: "eko-payout-a1", providerReference: "FLW-88213", requestedAt: "Jul 22, 2026" },
  { id: "po2", provider: "Dr. Chinedu Eze", amount: "₦58,500", rail: "flutterwave_bank", status: "processing", destination: "Zenith Bank ••••7788", reference: "eko-payout-b2", providerReference: "FLW-88240", requestedAt: "Jul 23, 2026" },
  { id: "po3", provider: "Dr. Priya Nair", amount: "₦96,000", rail: "paypal", status: "failed", destination: "p.nair@example.com", reference: "eko-payout-c3", failureReason: "RECEIVER_UNREGISTERED — the recipient has no PayPal account for that email.", sent: "USD 60.00", requestedAt: "Jul 23, 2026" },
];

export const MOCK_ADMIN_PRESCRIPTIONS: AdminPrescription[] = [
  { id: "rx1", drug: "Amlodipine 10 mg", form: "Tablet", quantity: "30", instructions: "Take one tablet daily in the morning.", prescribedBy: "Dr. Amara Okafor", datePrescribed: "Jul 23, 2026", pharmacy: "GreenCross Pharmacy", fulfillmentStatus: "sent" },
  { id: "rx2", drug: "Metformin 500 mg", form: "Tablet", quantity: "60", prescribedBy: "Dr. Chinedu Eze", datePrescribed: "Jul 22, 2026", pharmacy: "MedPlus Pharmacy", fulfillmentStatus: "accepted" },
  { id: "rx3", drug: "Salbutamol Inhaler", form: "Inhaler", quantity: "1", prescribedBy: "Dr. Amara Okafor", datePrescribed: "Jul 21, 2026", pharmacy: "GreenCross Pharmacy", fulfillmentStatus: "ready" },
  { id: "rx4", drug: "Amoxicillin 500 mg", form: "Capsule", quantity: "21", prescribedBy: "Dr. Priya Nair", datePrescribed: "Jul 20, 2026", pharmacy: "MedPlus Pharmacy", fulfillmentStatus: "rejected", fulfillmentNote: "Out of stock — expecting resupply Thursday." },
];
