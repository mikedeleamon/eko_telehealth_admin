"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

const CATEGORY_LABEL: Record<Complaint["category"], string> = {
  billing: "Billing",
  appointment: "Appointment",
  provider: "Provider",
  technical: "Technical",
  other: "Other",
};

export default function ComplaintsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["complaints"], queryFn: api.complaints });
  // Local decisions overlay the fetched list so the mock flow feels real.
  const [decisions, setDecisions] = useState<Record<string, ComplaintStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = useMutation({
    mutationFn: ({ id, decision, resolutionNote }: { id: string; decision: "resolved" | "dismissed"; resolutionNote?: string }) =>
      api.decideComplaint(id, decision, resolutionNote),
    onSuccess: (_d, { id, decision }) => {
      setDecisions((prev) => ({ ...prev, [id]: decision }));
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const statusOf = (c: Complaint) => decisions[c.id] ?? c.status;

  return (
    <div>
      <PageHeader
        title="Reports & Complaints"
        subtitle="Issues filed by patients and doctors via the app. Every decision — resolved or dismissed — notifies whoever filed the report."
      />

      {!data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-4">
          {data.map((complaint) => {
            const status = statusOf(complaint);
            return (
              <Card key={complaint.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-64">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold">{complaint.subject}</p>
                      <Badge variant="accent">{CATEGORY_LABEL[complaint.category]}</Badge>
                      <Badge variant={complaint.accountType === "Doctor" ? "orange" : "gray"}>{complaint.accountType}</Badge>
                    </div>
                    <p className="text-sm text-foreground/55 mt-1">{complaint.authorName} · Submitted {complaint.submittedAt}</p>
                    <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{complaint.description}</p>
                  </div>
                  {status !== "pending" && (
                    <Badge variant={status === "resolved" ? "green" : "red"}>{status}</Badge>
                  )}
                </div>

                {status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground/70">Resolution note (optional, shown to the filer)</span>
                      <textarea
                        value={notes[complaint.id] ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [complaint.id]: e.target.value }))}
                        rows={2}
                        placeholder="Explain what you found or did about this…"
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => decide.mutate({ id: complaint.id, decision: "resolved", resolutionNote: notes[complaint.id] })}
                        disabled={decide.isPending}
                        className="rounded-full bg-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => decide.mutate({ id: complaint.id, decision: "dismissed", resolutionNote: notes[complaint.id] })}
                        disabled={decide.isPending}
                        className="rounded-full bg-red/10 px-5 py-2 text-sm font-semibold text-red hover:bg-red/20 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {data.length === 0 && <p className="text-sm text-foreground/50">No pending reports.</p>}
        </div>
      )}
    </div>
  );
}
