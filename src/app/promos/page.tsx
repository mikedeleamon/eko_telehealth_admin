"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PromoCode } from "@/lib/types";
import { Badge, Card, LoadingRows, PageHeader } from "@/components/ui";

const fieldClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function fmtValue(p: PromoCode): string {
  return p.kind === "percent" ? `${Math.round(p.value * 1000) / 10}%` : `₦${p.value.toLocaleString("en-NG")}`;
}

function fmtLimit(p: PromoCode): string {
  const cap = p.maxRedemptions == null ? "∞" : String(p.maxRedemptions);
  return `${p.redemptions} / ${cap} used`;
}

const EMPTY_FORM = {
  code: "",
  kind: "percent" as "percent" | "flat",
  value: "",
  minSpend: "0",
  maxRedemptions: "",
  perUserLimit: "1",
  expiresAt: "",
};

export default function PromosPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["promos"], queryFn: api.promos });
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (input: Omit<PromoCode, "id" | "redemptions">) => api.createPromo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promos"] });
      setForm(EMPTY_FORM);
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.updatePromo(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promos"] }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = form.code.trim().toUpperCase();
    const rawValue = Number(form.value);
    if (!code) return setError("Enter a code.");
    if (!Number.isFinite(rawValue) || rawValue <= 0) return setError("Enter a valid discount value.");

    // Percent is entered as a whole number (20 = 20%) but stored as a
    // fraction (0.20) to match the backend's representation — same
    // convention as the Fee Settings page.
    create.mutate({
      code,
      kind: form.kind,
      value: form.kind === "percent" ? rawValue / 100 : rawValue,
      minSpend: Number(form.minSpend) || 0,
      maxRedemptions: form.maxRedemptions.trim() ? Number(form.maxRedemptions) : null,
      perUserLimit: Number(form.perUserLimit) || 1,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      active: true,
    });
  };

  return (
    <div>
      <PageHeader
        title="Promo Codes"
        subtitle="Discount codes patients can apply at checkout. A discount only ever reduces the platform's own share — never a provider's payout or VAT owed."
      />

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">New code</h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Code</span>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SAVE20"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Type</span>
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as "percent" | "flat" }))}
              className={fieldClass}
            >
              <option value="percent">Percent off</option>
              <option value="flat">Flat amount off (₦)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">
              {form.kind === "percent" ? "Discount (%)" : "Discount (₦)"}
            </span>
            <input
              type="number"
              min={0}
              step={form.kind === "percent" ? 0.1 : 1}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder={form.kind === "percent" ? "20" : "2000"}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Minimum spend (₦)</span>
            <input
              type="number"
              min={0}
              value={form.minSpend}
              onChange={(e) => setForm((f) => ({ ...f, minSpend: e.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Total redemptions</span>
            <input
              type="number"
              min={1}
              value={form.maxRedemptions}
              onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
              placeholder="Unlimited"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/70">Redemptions per patient</span>
            <input
              type="number"
              min={1}
              value={form.perUserLimit}
              onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground/70">Expires (optional)</span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className={fieldClass}
            />
          </label>

          {error && <p className="sm:col-span-2 text-sm text-red">{error}</p>}
          {create.isError && <p className="sm:col-span-2 text-sm text-red">Could not create the code — try again.</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-full bg-accent text-white font-semibold px-6 py-2.5 text-sm shadow-lg shadow-accent/30 transition-opacity disabled:opacity-60"
            >
              {create.isPending ? "Creating…" : "Create code"}
            </button>
          </div>
        </form>
      </Card>

      {!data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-40">
                  <p className="font-mono font-semibold">{p.code}</p>
                  <p className="text-sm text-foreground/55">
                    {fmtValue(p)} off · min ₦{p.minSpend.toLocaleString("en-NG")} · {fmtLimit(p)}
                    {p.expiresAt ? ` · expires ${new Date(p.expiresAt).toLocaleDateString("en-NG")}` : ""}
                  </p>
                </div>
                <Badge variant={p.active ? "green" : "gray"}>{p.active ? "active" : "inactive"}</Badge>
                <button
                  onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })}
                  disabled={toggleActive.isPending}
                  className="rounded-full bg-black/5 px-5 py-2 text-sm font-semibold text-foreground/70 hover:bg-black/10 disabled:opacity-60"
                >
                  {p.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </Card>
          ))}
          {data.length === 0 && <p className="text-sm text-foreground/50">No promo codes yet.</p>}
        </div>
      )}
    </div>
  );
}
