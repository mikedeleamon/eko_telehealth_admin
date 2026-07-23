"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { APPOINTMENT_STATUS_BADGE_VARIANT } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader, StatusDot } from "@/components/ui";

const FILTERS = ["all", "upcoming", "checked_in", "completed", "no_show", "cancelled"] as const;

export default function AppointmentsPage() {
  const { data } = useQuery({ queryKey: ["appointments"], queryFn: api.appointments });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = (data ?? []).filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Every visit booked across the marketplace." />

      <div className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-accent text-white" : "bg-white text-foreground/60 hover:bg-card-purple"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {!data ? (
        <LoadingRows />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/45">
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">When</th>
                <th className="pb-3 font-medium">Fee</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-black/5">
                  <td className="py-3 font-medium">{a.patient}</td>
                  <td className="py-3">{a.provider}</td>
                  <td className="py-3">
                    <StatusDot color={a.type === "Video Visit" ? "#6c5ce7" : a.type === "Home Visit" ? "#3fbe6e" : "#f5a623"} />
                    {a.type}
                  </td>
                  <td className="py-3 text-foreground/60">{a.date}</td>
                  <td className="py-3 font-semibold">{a.fee}</td>
                  <td className="py-3">
                    <Badge variant={APPOINTMENT_STATUS_BADGE_VARIANT[a.status] ?? "gray"}>
                      {a.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
