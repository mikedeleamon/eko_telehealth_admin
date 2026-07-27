"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AdminPrescription, FulfillmentStatus } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

const STATUS_VARIANT: Record<FulfillmentStatus, "green" | "red" | "orange" | "accent" | "gray"> = {
  none: "gray",
  sent: "accent",
  accepted: "orange",
  ready: "green",
  collected: "gray",
  rejected: "red",
};

const STATUS_LABEL: Record<FulfillmentStatus, string> = {
  none: "Not referred",
  sent: "Sent",
  accepted: "Being prepared",
  ready: "Ready to collect",
  collected: "Collected",
  rejected: "Rejected",
};

/**
 * What each state can move to — mirrors the backend's FULFILLMENT_NEXT.
 * The lifecycle only goes forward: walking a collected prescription backwards
 * would misrepresent medication the patient already has.
 */
const NEXT: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  none: [],
  sent: ["accepted", "rejected"],
  accepted: ["ready", "rejected"],
  ready: ["collected"],
  collected: [],
  rejected: [],
};

export default function PrescriptionsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-prescriptions"], queryFn: api.prescriptions });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  // Rejection needs a reason, so it opens an inline note field rather than firing immediately.
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const advance = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: FulfillmentStatus; note?: string }) =>
      api.updateFulfillment(id, status, note),
    onMutate: ({ id }) => {
      setPendingId(id);
      setErrorId(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prescriptions"] });
      setRejectingId(null);
      setNote("");
    },
    onError: (_e, { id }) => setErrorId(id),
    onSettled: () => setPendingId(null),
  });

  const open = (data ?? []).filter((p) => p.fulfillmentStatus !== "collected" && p.fulfillmentStatus !== "rejected");

  return (
    <div>
      <PageHeader
        title="Pharmacy Referrals"
        subtitle="Prescriptions doctors have routed to a pharmacy on the platform. Pharmacies don't have their own login yet, so update these on their behalf — the patient is notified at every step."
      />

      {data && data.length > 0 && (
        <div className="flex gap-3 mb-6 text-sm">
          <span className="rounded-full bg-black/5 px-4 py-1.5">
            <b>{open.length}</b> awaiting action
          </span>
        </div>
      )}

      {!data ? (
        <LoadingRows />
      ) : data.length === 0 ? (
        <Card>
          <p className="text-sm text-foreground/55">No prescriptions have been referred to a pharmacy yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((rx: AdminPrescription) => (
            <Card key={rx.id}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-56">
                  <p className="font-semibold">{rx.drug}</p>
                  <p className="text-sm text-foreground/55">
                    {rx.form} · qty {rx.quantity} · {rx.pharmacy}
                  </p>
                </div>
                <div className="text-xs text-foreground/45 text-right">
                  <p>{rx.prescribedBy}</p>
                  <p>{rx.datePrescribed}</p>
                </div>
                <Badge variant={STATUS_VARIANT[rx.fulfillmentStatus]}>{STATUS_LABEL[rx.fulfillmentStatus]}</Badge>
              </div>

              {rx.instructions && (
                <p className="text-xs text-foreground/50 mt-2 italic">{rx.instructions}</p>
              )}

              {rx.fulfillmentNote && (
                <div className="w-full mt-3 pt-3 border-t border-black/5">
                  <p className="text-xs text-red">{rx.fulfillmentNote}</p>
                </div>
              )}

              {NEXT[rx.fulfillmentStatus].length > 0 && (
                <div className="w-full mt-3 pt-3 border-t border-black/5">
                  {rejectingId === rx.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Why can't this be filled? The patient sees this."
                        className="flex-1 min-w-64 rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => advance.mutate({ id: rx.id, status: "rejected", note })}
                        disabled={pendingId === rx.id || !note.trim()}
                        className="rounded-full bg-red px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Confirm rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setNote("");
                        }}
                        className="rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-foreground/60 hover:bg-black/10"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {NEXT[rx.fulfillmentStatus].map((next) =>
                        next === "rejected" ? (
                          <button
                            key={next}
                            onClick={() => setRejectingId(rx.id)}
                            disabled={pendingId === rx.id}
                            className="rounded-full bg-red/10 px-5 py-2 text-sm font-semibold text-red hover:bg-red/20 disabled:opacity-60"
                          >
                            Can&apos;t fill
                          </button>
                        ) : (
                          <button
                            key={next}
                            onClick={() => advance.mutate({ id: rx.id, status: next })}
                            disabled={pendingId === rx.id}
                            className="rounded-full bg-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {pendingId === rx.id ? "Saving…" : `Mark ${STATUS_LABEL[next].toLowerCase()}`}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                  {errorId === rx.id && <p className="text-sm text-red mt-2">Could not save — try again.</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
