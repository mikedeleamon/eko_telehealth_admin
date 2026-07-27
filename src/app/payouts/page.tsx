"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AdminPayout } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

const STATUS_VARIANT = {
  queued: "gray",
  processing: "orange",
  paid: "green",
  failed: "red",
} as const;

const RAIL_LABEL = {
  flutterwave_bank: "Bank transfer",
  paypal: "PayPal",
} as const;

export default function PayoutsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["payouts"], queryFn: api.payouts });
  // Per-row pending/error state — one shared mutation across every row.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["payouts"] });
  const track = {
    onMutate: (id: string) => {
      setPendingId(id);
      setErrorId(null);
    },
    onError: (id: string) => setErrorId(id),
    onSettled: () => setPendingId(null),
  };

  const retry = useMutation({
    mutationFn: (id: string) => api.retryPayout(id),
    onMutate: track.onMutate,
    onSuccess: invalidate,
    onError: (_e, id) => track.onError(id),
    onSettled: track.onSettled,
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.markPayoutPaid(id),
    onMutate: track.onMutate,
    onSuccess: invalidate,
    onError: (_e, id) => track.onError(id),
    onSettled: track.onSettled,
  });

  const inFlight = (data ?? []).filter((p) => p.status === "queued" || p.status === "processing").length;
  const failed = (data ?? []).filter((p) => p.status === "failed").length;

  return (
    <div>
      <PageHeader
        title="Provider Payouts"
        subtitle="Withdrawals settle automatically — the payment rail's webhook marks each one paid or failed. This is where you watch that happen and deal with the ones that don't."
      />

      {data && (data.length > 0) && (
        <div className="flex gap-3 mb-6 text-sm">
          <span className="rounded-full bg-black/5 px-4 py-1.5">
            <b>{inFlight}</b> in flight
          </span>
          <span className={`rounded-full px-4 py-1.5 ${failed ? "bg-red/10 text-red font-semibold" : "bg-black/5"}`}>
            <b>{failed}</b> failed
          </span>
        </div>
      )}

      {!data ? (
        <LoadingRows />
      ) : data.length === 0 ? (
        <Card>
          <p className="text-sm text-foreground/55">No withdrawals yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((p: AdminPayout) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-52">
                  <p className="font-semibold">{p.provider}</p>
                  <p className="text-sm text-foreground/55">
                    {RAIL_LABEL[p.rail]} · {p.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{p.amount}</p>
                  {p.sent && <p className="text-xs text-foreground/45">sent as {p.sent}</p>}
                </div>
                <div className="text-xs text-foreground/45 whitespace-nowrap">{p.requestedAt}</div>
                <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
              </div>

              {p.failureReason && (
                <div className="w-full mt-3 pt-3 border-t border-black/5">
                  <p className="text-xs text-red">{p.failureReason}</p>
                </div>
              )}

              {p.status === "failed" && (
                <div className="w-full flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-black/5">
                  <button
                    onClick={() => retry.mutate(p.id)}
                    disabled={pendingId === p.id}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {pendingId === p.id ? "Working…" : "Retry payout"}
                  </button>
                  <button
                    onClick={() => markPaid.mutate(p.id)}
                    disabled={pendingId === p.id}
                    className="rounded-full bg-black/5 px-5 py-2 text-sm font-semibold text-foreground/60 hover:bg-black/10 disabled:opacity-60"
                  >
                    Mark as paid
                  </button>
                  <span className="text-xs text-foreground/45 max-w-md">
                    Retry sends again on a fresh reference. Only mark as paid if you have confirmed in the
                    provider&apos;s dashboard that the money already left — doing so otherwise pays twice.
                  </span>
                </div>
              )}

              {errorId === p.id && <p className="text-sm text-red mt-2">Could not save — try again.</p>}

              <div className="w-full mt-3 pt-3 border-t border-black/5 flex gap-4 flex-wrap">
                <span className="text-[11px] text-foreground/35 font-mono">ref {p.reference}</span>
                {p.providerReference && (
                  <span className="text-[11px] text-foreground/35 font-mono">rail {p.providerReference}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
