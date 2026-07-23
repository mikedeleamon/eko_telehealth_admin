"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ProviderApplication } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

/** "482 KB" / "1.2 MB" from a byte count. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Check({
  ok,
  label,
  onToggle,
  disabled,
}: {
  ok: boolean;
  label: string;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1 text-xs font-medium disabled:opacity-60 ${ok ? "text-green" : "text-red"}`}
    >
      {ok ? "✓" : "✗"} {label}
    </button>
  );
}

export default function ProvidersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["provider-applications"], queryFn: api.providerApplications });
  // Per-row pending/error state — `decide`/`toggleInHome` are each one
  // shared mutation across every row in the list (same class of bug fixed
  // earlier on the reviews/currencies/content admin pages). This used to be
  // covered by a local-state overlay that echoed back whatever the admin
  // clicked regardless of what the backend actually did — which is exactly
  // how a non-Doctor approval could show "approved" while silently creating
  // nothing. Real state now always comes from a refetch.
  const [pendingDecisionId, setPendingDecisionId] = useState<string | null>(null);
  const [errorDecisionId, setErrorDecisionId] = useState<string | null>(null);
  const [pendingInHomeId, setPendingInHomeId] = useState<string | null>(null);
  const [errorInHomeId, setErrorInHomeId] = useState<string | null>(null);
  const [pendingPharmacyId, setPendingPharmacyId] = useState<string | null>(null);
  const [errorPharmacyId, setErrorPharmacyId] = useState<string | null>(null);
  const [pendingChecksId, setPendingChecksId] = useState<string | null>(null);
  const [errorChecksId, setErrorChecksId] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      api.decideProvider(id, decision),
    onMutate: ({ id }) => {
      setPendingDecisionId(id);
      setErrorDecisionId(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-applications"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (_e, { id }) => setErrorDecisionId(id),
    onSettled: () => setPendingDecisionId(null),
  });

  const toggleInHome = useMutation({
    mutationFn: ({ doctorId, canProvideInHome }: { doctorId: string; canProvideInHome: boolean }) =>
      api.updateDoctorInHome(doctorId, canProvideInHome),
    onMutate: ({ doctorId }) => {
      setPendingInHomeId(doctorId);
      setErrorInHomeId(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-applications"] }),
    onError: (_e, { doctorId }) => setErrorInHomeId(doctorId),
    onSettled: () => setPendingInHomeId(null),
  });

  const togglePharmacyActive = useMutation({
    mutationFn: ({ pharmacyId, active }: { pharmacyId: string; active: boolean }) =>
      api.updatePharmacyActive(pharmacyId, active),
    onMutate: ({ pharmacyId }) => {
      setPendingPharmacyId(pharmacyId);
      setErrorPharmacyId(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-applications"] }),
    onError: (_e, { pharmacyId }) => setErrorPharmacyId(pharmacyId),
    onSettled: () => setPendingPharmacyId(null),
  });

  const updateChecks = useMutation({
    mutationFn: ({ id, checks }: { id: string; checks: Partial<{ govId: boolean; email: boolean; phone: boolean }> }) =>
      api.updateProviderChecks(id, checks),
    onMutate: ({ id }) => {
      setPendingChecksId(id);
      setErrorChecksId(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-applications"] }),
    onError: (_e, { id }) => setErrorChecksId(id),
    onSettled: () => setPendingChecksId(null),
  });

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
          {data.map((app: ProviderApplication) => (
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
                    <Check
                      ok={app.checks.govId}
                      label="Gov ID"
                      disabled={pendingChecksId === app.id}
                      onToggle={() => updateChecks.mutate({ id: app.id, checks: { govId: !app.checks.govId } })}
                    />
                    <Check
                      ok={app.checks.email}
                      label="Email"
                      disabled={pendingChecksId === app.id}
                      onToggle={() => updateChecks.mutate({ id: app.id, checks: { email: !app.checks.email } })}
                    />
                    <Check
                      ok={app.checks.phone}
                      label="Phone"
                      disabled={pendingChecksId === app.id}
                      onToggle={() => updateChecks.mutate({ id: app.id, checks: { phone: !app.checks.phone } })}
                    />
                  </div>
                  {errorChecksId === app.id && <p className="text-xs text-red mt-1">Could not save — try again.</p>}
                </div>
                <div className="text-xs text-foreground/45">Submitted {app.submittedAt}</div>
                {app.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide.mutate({ id: app.id, decision: "approved" })}
                      disabled={pendingDecisionId === app.id}
                      className="rounded-full bg-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {pendingDecisionId === app.id ? "Saving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => decide.mutate({ id: app.id, decision: "rejected" })}
                      disabled={pendingDecisionId === app.id}
                      className="rounded-full bg-red/10 px-5 py-2 text-sm font-semibold text-red hover:bg-red/20 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <Badge variant={app.status === "approved" ? "green" : "red"}>{app.status}</Badge>
                )}
              </div>

              {errorDecisionId === app.id && <p className="text-sm text-red mt-2">Could not save — try again.</p>}

              {app.documents.length > 0 && (
                <div className="w-full mt-3 pt-3 border-t border-black/5">
                  <p className="text-xs font-medium text-foreground/60 mb-2">
                    Verification documents ({app.documents.length})
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {app.documents.map((doc) => (
                      <a
                        key={doc.key}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-accent hover:underline w-fit"
                      >
                        <span>{doc.fileName}</span>
                        <span className="text-foreground/40">· {formatSize(doc.sizeBytes)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {app.status === "approved" && app.doctorId && (
                <div className="w-full flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                  <span className="text-sm text-foreground/60">In-home care privilege</span>
                  <button
                    onClick={() =>
                      toggleInHome.mutate({ doctorId: app.doctorId!, canProvideInHome: !app.canProvideInHome })
                    }
                    disabled={pendingInHomeId === app.doctorId}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                      app.canProvideInHome ? "bg-green/10 text-green hover:bg-green/20" : "bg-black/5 text-foreground/50 hover:bg-black/10"
                    }`}
                  >
                    {app.canProvideInHome ? "Granted — click to revoke" : "Not granted — click to allow"}
                  </button>
                </div>
              )}
              {errorInHomeId === app.doctorId && <p className="text-sm text-red mt-1">Could not save — try again.</p>}

              {app.status === "approved" && app.pharmacyId && (
                <div className="w-full flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                  <span className="text-sm text-foreground/60">Listed in patient-facing directory</span>
                  <button
                    onClick={() =>
                      togglePharmacyActive.mutate({ pharmacyId: app.pharmacyId!, active: !app.pharmacyActive })
                    }
                    disabled={pendingPharmacyId === app.pharmacyId}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                      app.pharmacyActive ? "bg-green/10 text-green hover:bg-green/20" : "bg-black/5 text-foreground/50 hover:bg-black/10"
                    }`}
                  >
                    {app.pharmacyActive ? "Active — click to hide" : "Hidden — click to show"}
                  </button>
                </div>
              )}
              {errorPharmacyId === app.pharmacyId && <p className="text-sm text-red mt-1">Could not save — try again.</p>}

              {app.status === "approved" && !app.doctorId && !app.pharmacyId && (
                <div className="w-full mt-3 pt-3 border-t border-black/5">
                  <p className="text-xs text-foreground/45">
                    {`Approved — ${app.type} onboarding isn't built yet, so this applicant doesn't have a live profile.`}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
