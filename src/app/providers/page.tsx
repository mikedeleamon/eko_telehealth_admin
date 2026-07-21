"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ProviderApplication, VerificationStatus } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-green" : "text-red"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export default function ProvidersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["provider-applications"], queryFn: api.providerApplications });
  // Local decisions overlay the fetched list so the mock flow feels real.
  const [decisions, setDecisions] = useState<Record<string, VerificationStatus>>({});
  // Keyed by doctorId (not application id) — that's what the toggle actually edits.
  const [inHomeOverrides, setInHomeOverrides] = useState<Record<string, boolean>>({});

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      api.decideProvider(id, decision),
    onSuccess: (_d, { id, decision }) => {
      setDecisions((prev) => ({ ...prev, [id]: decision }));
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const toggleInHome = useMutation({
    mutationFn: ({ doctorId, canProvideInHome }: { doctorId: string; canProvideInHome: boolean }) =>
      api.updateDoctorInHome(doctorId, canProvideInHome),
    onSuccess: (_d, { doctorId, canProvideInHome }) => {
      setInHomeOverrides((prev) => ({ ...prev, [doctorId]: canProvideInHome }));
    },
  });

  const statusOf = (app: ProviderApplication) => decisions[app.id] ?? app.status;
  const inHomeOf = (app: ProviderApplication) =>
    app.doctorId ? inHomeOverrides[app.doctorId] ?? app.canProvideInHome ?? false : false;

  return (
    <div>
      <PageHeader
        title="Provider Verification"
        subtitle="Approve or reject provider applications. Once a doctor is approved, grant or revoke their in-home care privilege here too."
      />

      {!data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-4">
          {data.map((app) => {
            const status = statusOf(app);
            return (
              <Card key={app.id}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-card-purple flex items-center justify-center text-accent font-bold">
                    {app.name.charAt(app.name.startsWith("Dr.") ? 4 : 0)}
                  </div>
                  <div className="flex-1 min-w-52">
                    <p className="font-semibold">{app.name}</p>
                    <p className="text-sm text-foreground/55">
                      {app.type} · {app.specialty} · {app.location}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <Check ok={app.checks.govId} label="Gov ID" />
                      <Check ok={app.checks.email} label="Email" />
                      <Check ok={app.checks.phone} label="Phone" />
                    </div>
                  </div>
                  <div className="text-xs text-foreground/45">Submitted {app.submittedAt}</div>
                  {status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide.mutate({ id: app.id, decision: "approved" })}
                        className="rounded-full bg-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide.mutate({ id: app.id, decision: "rejected" })}
                        className="rounded-full bg-red/10 px-5 py-2 text-sm font-semibold text-red hover:bg-red/20"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <Badge variant={status === "approved" ? "green" : "red"}>{status}</Badge>
                  )}
                </div>

                {status === "approved" && app.type === "Doctor" && app.doctorId && (
                  <div className="w-full flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                    <span className="text-sm text-foreground/60">In-home care privilege</span>
                    <button
                      onClick={() => toggleInHome.mutate({ doctorId: app.doctorId!, canProvideInHome: !inHomeOf(app) })}
                      disabled={toggleInHome.isPending}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                        inHomeOf(app) ? "bg-green/10 text-green hover:bg-green/20" : "bg-black/5 text-foreground/50 hover:bg-black/10"
                      }`}
                    >
                      {inHomeOf(app) ? "Granted — click to revoke" : "Not granted — click to allow"}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
