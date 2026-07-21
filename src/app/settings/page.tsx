"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlatformSettings } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui";

/** Fraction (0.175) <-> percent string ("17.5") for the form. 2dp, no float noise. */
function toPercentStr(fraction: number): string {
  return String(Math.round(fraction * 100 * 100) / 100);
}
function fromPercentStr(str: string): number {
  const n = Number(str);
  return Number.isFinite(n) ? n / 100 : 0;
}

function RateField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground/70">{label}</span>
      <div className="mt-1 relative">
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 pr-9 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">%</span>
      </div>
      <p className="text-xs text-foreground/45 mt-1">{hint}</p>
    </label>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["platform-settings"], queryFn: api.settings });

  const [serviceCharge, setServiceCharge] = useState("");
  const [commission, setCommission] = useState("");
  const [vat, setVat] = useState("");
  const [saved, setSaved] = useState(false);

  // Populate the form once the current rates load — a plain useState default
  // can't do this since the query resolves after first render.
  useEffect(() => {
    if (!data) return;
    setServiceCharge(toPercentStr(data.serviceChargePct));
    setCommission(toPercentStr(data.commissionPct));
    setVat(toPercentStr(data.vatPct));
  }, [data]);

  const save = useMutation({
    mutationFn: (rates: PlatformSettings) => api.updateSettings(rates),
    onSuccess: (updated) => {
      qc.setQueryData(["platform-settings"], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({
      serviceChargePct: fromPercentStr(serviceCharge),
      commissionPct: fromPercentStr(commission),
      vatPct: fromPercentStr(vat),
    });
  };

  // Live preview on a representative ₦15,000 consultation, so an admin can
  // see what a rate change means in Naira before saving it.
  const example = (() => {
    const fee = 15000;
    const sc = Math.round(fee * fromPercentStr(serviceCharge));
    const comm = Math.round(fee * fromPercentStr(commission));
    const v = Math.round(fee * fromPercentStr(vat));
    return {
      videoPatientPays: fee + sc + v,
      inPersonPatientPays: fee + sc,
      providerPayout: fee - comm,
      platformNet: sc + comm,
    };
  })();

  return (
    <div>
      <PageHeader
        title="Fee Settings"
        subtitle="The platform's rate schedule. Changes apply to visits booked from now on — already-checked-out payments keep the rates they were charged at."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <form onSubmit={submit} className="space-y-5">
            <RateField
              label="Service charge"
              hint="Patient-side platform fee, added on top of the consultation fee."
              value={serviceCharge}
              onChange={setServiceCharge}
            />
            <RateField
              label="Provider commission"
              hint="Withheld from the provider's payout."
              value={commission}
              onChange={setCommission}
            />
            <RateField
              label="VAT"
              hint="Patient-borne, added on top — Video Visit only. Clinic and Home visits are VAT-exempt."
              value={vat}
              onChange={setVat}
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={save.isPending || !data}
                className="rounded-full bg-accent text-white font-semibold px-6 py-2.5 text-sm shadow-lg shadow-accent/30 transition-opacity disabled:opacity-60"
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </button>
              {saved && <span className="text-sm text-green font-medium">Saved</span>}
              {save.isError && <span className="text-sm text-red font-medium">Could not save — try again.</span>}
            </div>
          </form>
        </Card>

        <Card tint="purple">
          <h2 className="font-semibold mb-1">On a ₦15,000 consultation</h2>
          <p className="text-xs text-foreground/50 mb-4">Live preview as you edit the rates.</p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">Patient pays (Video Visit)</dt>
              <dd className="font-semibold">₦{example.videoPatientPays.toLocaleString("en-NG")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Patient pays (Clinic / Home Visit)</dt>
              <dd className="font-semibold">₦{example.inPersonPatientPays.toLocaleString("en-NG")}</dd>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-3">
              <dt className="text-foreground/60">Provider takes home</dt>
              <dd className="font-semibold">₦{example.providerPayout.toLocaleString("en-NG")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Platform keeps</dt>
              <dd className="font-semibold">₦{example.platformNet.toLocaleString("en-NG")}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
