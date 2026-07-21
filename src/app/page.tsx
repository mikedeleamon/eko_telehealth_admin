"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge, Card, LoadingRows, PageHeader, StatusDot } from "@/components/ui";

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const { data: appointments } = useQuery({ queryKey: ["appointments"], queryFn: api.appointments });

  return (
    <div>
      <PageHeader
        title="Welcome back 👋"
        subtitle="Here's what's happening across the Eko Telehealth marketplace."
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <Card tint="purple">
          <p className="text-3xl font-bold">{stats?.totalPatients ?? "—"}</p>
          <p className="text-sm text-foreground/55 mt-1">Total patients</p>
        </Card>
        <Card tint="blue">
          <p className="text-3xl font-bold">{stats?.activeProviders ?? "—"}</p>
          <p className="text-sm text-foreground/55 mt-1">Active providers</p>
        </Card>
        <Card tint="yellow">
          <p className="text-3xl font-bold">{stats?.appointmentsThisWeek ?? "—"}</p>
          <p className="text-sm text-foreground/55 mt-1">Appointments this week</p>
        </Card>
        <Card tint="pink">
          <p className="text-3xl font-bold">{stats?.revenueThisMonth ?? "—"}</p>
          <p className="text-sm text-foreground/55 mt-1">Revenue this month</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold">{stats?.vatCollected ?? "—"}</p>
          <p className="text-sm text-foreground/55 mt-1">VAT collected (owed, not revenue)</p>
        </Card>
      </div>

      <div className="grid xl:grid-cols-4 gap-5 mb-8">
        <Link href="/providers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Provider verifications</p>
                <p className="text-sm text-foreground/55">Waiting on ID review</p>
              </div>
              <span className="text-2xl font-bold text-accent">{stats?.pendingVerifications ?? "—"}</span>
            </div>
          </Card>
        </Link>
        <Link href="/reviews">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Reviews to moderate</p>
                <p className="text-sm text-foreground/55">Two-way, admin-moderated</p>
              </div>
              <span className="text-2xl font-bold text-orange">{stats?.pendingReviews ?? "—"}</span>
            </div>
          </Card>
        </Link>
        <Link href="/complaints">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Reports & complaints</p>
                <p className="text-sm text-foreground/55">Filed by patients & doctors</p>
              </div>
              <span className="text-2xl font-bold text-red">{stats?.pendingComplaints ?? "—"}</span>
            </div>
          </Card>
        </Link>
        <Link href="/appointments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">All appointments</p>
                <p className="text-sm text-foreground/55">Video, clinic & home visits</p>
              </div>
              <span className="text-2xl font-bold text-green">→</span>
            </div>
          </Card>
        </Link>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Recent appointments</h2>
        {!appointments ? (
          <LoadingRows />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/45">
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">When</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 5).map((a) => (
                <tr key={a.id} className="border-t border-black/5">
                  <td className="py-3 font-medium">{a.patient}</td>
                  <td className="py-3">{a.provider}</td>
                  <td className="py-3">
                    <StatusDot color={a.type === "Video Visit" ? "#6c5ce7" : a.type === "Home Visit" ? "#3fbe6e" : "#f5a623"} />
                    {a.type}
                  </td>
                  <td className="py-3 text-foreground/60">{a.date}</td>
                  <td className="py-3">
                    <Badge variant={a.status === "upcoming" ? "accent" : a.status === "completed" ? "green" : "red"}>
                      {a.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
