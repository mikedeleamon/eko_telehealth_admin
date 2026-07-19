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

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      api.decideProvider(id, decision),
    onSuccess: (_d, { id, decision }) => {
      setDecisions((prev) => ({ ...prev, [id]: decision }));
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const statusOf = (app: ProviderApplication) => decisions[app.id] ?? app.status;

  return (
    <div>
      <PageHeader
        title="Provider Verification"
        subtitle="Approve or reject provider applications. Verification covers government ID, email and phone."
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
