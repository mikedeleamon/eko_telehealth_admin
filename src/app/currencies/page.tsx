"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Currency } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

const fieldClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

const EMPTY_FORM = { code: "", symbol: "", ngnRate: "" };

export default function CurrenciesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["currencies"], queryFn: api.currencies });
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  // Editable rate per row, seeded from the fetched value on first render of
  // each row and overwritten as the admin types — see RateInput below.
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  // One mutation instance serves every row (rate saves and active toggles
  // alike), so pending/error state has to be tracked per-id explicitly —
  // otherwise every row's buttons show "in flight" together and a failure
  // on one row has nowhere row-scoped to surface.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (input: Omit<Currency, "id">) => api.createCurrency(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currencies"] });
      setForm(EMPTY_FORM);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Currency, "id">> }) => api.updateCurrency(id, input),
    onMutate: ({ id }) => {
      setPendingId(id);
      setErrorId(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currencies"] }),
    onError: (_e, { id }) => setErrorId(id),
    onSettled: () => setPendingId(null),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = form.code.trim().toUpperCase();
    const symbol = form.symbol.trim();
    const rate = Number(form.ngnRate);
    if (code.length < 2) return setError("Enter a currency code, e.g. USD.");
    if (!symbol) return setError("Enter a symbol, e.g. $.");
    if (!Number.isFinite(rate) || rate <= 0) return setError("Enter how many NGN equal 1 unit of this currency.");

    create.mutate({ code, symbol, ngnRate: rate, active: true });
  };

  return (
    <div>
      <PageHeader
        title="Display Currencies"
        subtitle="Rates used only to convert NGN fees for browsing and checkout preview in the app. The platform's actual pricing and settlement currency is always NGN — editing a rate here never changes what a patient is charged."
      />

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">New currency</h2>
        <form onSubmit={submit} className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Code</span>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="USD"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Symbol</span>
            <input
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              placeholder="$"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground/70">NGN per 1 unit</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.ngnRate}
              onChange={(e) => setForm((f) => ({ ...f, ngnRate: e.target.value }))}
              placeholder="1600"
              className={fieldClass}
            />
          </label>

          {error && <p className="sm:col-span-3 text-sm text-red">{error}</p>}
          {create.isError && <p className="sm:col-span-3 text-sm text-red">Could not add the currency — try again.</p>}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-full bg-accent text-white font-semibold px-6 py-2.5 text-sm shadow-lg shadow-accent/30 transition-opacity disabled:opacity-60"
            >
              {create.isPending ? "Adding…" : "Add currency"}
            </button>
          </div>
        </form>
      </Card>

      {!data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-3">
          {data.map((c) => {
            const draft = rateDrafts[c.id] ?? String(c.ngnRate);
            const dirty = Number(draft) !== c.ngnRate && draft.trim() !== "";
            return (
              <Card key={c.id}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-12 text-center font-mono font-semibold text-lg">{c.symbol}</div>
                  <div className="min-w-20">
                    <p className="font-semibold">{c.code}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground/60">
                    ₦
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={draft}
                      onChange={(e) => setRateDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-28 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    per 1 {c.code}
                  </label>
                  {dirty && (
                    <button
                      onClick={() => update.mutate({ id: c.id, input: { ngnRate: Number(draft) } })}
                      disabled={pendingId === c.id}
                      className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {pendingId === c.id ? "Saving…" : "Save rate"}
                    </button>
                  )}
                  <div className="flex-1" />
                  <Badge variant={c.active ? "green" : "gray"}>{c.active ? "active" : "inactive"}</Badge>
                  <button
                    onClick={() => update.mutate({ id: c.id, input: { active: !c.active } })}
                    disabled={pendingId === c.id}
                    className="rounded-full bg-black/5 px-5 py-2 text-sm font-semibold text-foreground/70 hover:bg-black/10 disabled:opacity-60"
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
                {errorId === c.id && <p className="text-sm text-red mt-2">Could not save — try again.</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
