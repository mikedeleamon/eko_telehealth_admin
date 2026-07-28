"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, LoadingRows, PageHeader } from "@/components/ui";
import type { RevenueGranularity } from "@/lib/types";

/**
 * The rendered width of an element, kept in sync via ResizeObserver.
 *
 * Used only by the line chart: the bar chart fills its card with plain flex
 * layout, but an SVG's path data is drawn in absolute coordinates, so turning
 * "always fill the card" into real numbers needs the card's actual pixel
 * width, not a fixed per-point size that only fills wide ranges by accident.
 */
function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** yyyy-mm-dd — what both the date inputs and the backend speak. */
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

type PresetKey = "month" | "quarter" | "year" | "custom";

/**
 * The window and bucket size behind each preset. Granularity is pinned rather
 * than left to the server's default, so switching presets is a deliberate
 * change of resolution instead of the chart silently reshaping itself as a
 * month grows past the daily/weekly threshold.
 */
function presetRange(key: Exclude<PresetKey, "custom">): { from: string; to: string; granularity: RevenueGranularity } {
  const now = new Date();
  const to = isoDay(now);
  if (key === "month") return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to, granularity: "day" };
  if (key === "quarter") return { from: isoDay(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to, granularity: "week" };
  return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to, granularity: "month" };
}

/**
 * Platform revenue analysis (SOW/BRD 1.18).
 *
 * The dashboard shows one number for the current month. That satisfies the
 * letter of "view analysis of their revenues" and clearly not the intent —
 * this page is the analysis: a trend over a range the admin chooses, a
 * comparison against the preceding period of the same length, and breakdowns
 * by visit type, payment rail and provider.
 *
 * VAT is reported on its own and never inside revenue: it's collected from
 * patients on the platform's behalf and owed onward to tax authorities, so
 * folding it into the revenue line would overstate income by exactly the
 * amount that has to be handed over.
 */
type ChartVariant = "bar" | "line";

export default function RevenuePage() {
  const [preset, setPreset] = useState<PresetKey>("month");
  const [chartVariant, setChartVariant] = useState<ChartVariant>("bar");
  const [custom, setCustom] = useState(() => {
    const { from, to } = presetRange("month");
    return { from, to, granularity: "day" as RevenueGranularity };
  });

  const range = useMemo(
    () => (preset === "custom" ? custom : presetRange(preset)),
    [preset, custom],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["revenue", range.from, range.to, range.granularity],
    queryFn: () => api.revenue(range),
  });

  const peak = Math.max(...(data?.series ?? []).map((s) => s.platformRevenue), 0);
  const change = data?.previous.platformRevenueChangePct;
  const bucketCount = data?.series.length ?? 0;
  const labelEvery = bucketCount <= 12 ? 1 : bucketCount <= 24 ? 2 : Math.ceil(bucketCount / 12);

  return (
    <div>
      <PageHeader
        title="Revenue analysis"
        subtitle="Platform revenue over time, and where it comes from. Revenue is service charge + provider commission − discounts; VAT is shown separately because it is owed onward, not earned."
      />

      {/* Range controls */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {(["month", "quarter", "year"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                preset === key ? "bg-accent text-white" : "bg-black/5 text-foreground/60 hover:text-foreground"
              }`}
            >
              {key === "month" ? "This month" : key === "quarter" ? "Last 3 months" : "This year"}
            </button>
          ))}
          <button
            onClick={() => setPreset("custom")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              preset === "custom" ? "bg-accent text-white" : "bg-black/5 text-foreground/60 hover:text-foreground"
            }`}
          >
            Custom range
          </button>

          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-2 ml-2">
              <input
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm"
                aria-label="From date"
              />
              <span className="text-foreground/40 text-sm">to</span>
              <input
                type="date"
                value={custom.to}
                min={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm"
                aria-label="To date"
              />
              <select
                value={custom.granularity}
                onChange={(e) => setCustom((c) => ({ ...c, granularity: e.target.value as RevenueGranularity }))}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm"
                aria-label="Bucket size"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {isLoading || !data ? (
        <Card><LoadingRows /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <Card tint="pink">
              <p className="text-3xl font-bold">{naira(data.totals.platformRevenue)}</p>
              <p className="text-sm text-foreground/55 mt-1">Platform revenue</p>
              {change != null && (
                <p className={`text-xs mt-2 font-medium ${change >= 0 ? "text-green" : "text-red"}`}>
                  {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs {naira(data.previous.platformRevenue)} in the period before
                </p>
              )}
            </Card>
            <Card tint="purple">
              <p className="text-3xl font-bold">{naira(data.totals.gross)}</p>
              <p className="text-sm text-foreground/55 mt-1">Gross patient payments</p>
            </Card>
            <Card tint="blue">
              <p className="text-3xl font-bold">{data.totals.visits}</p>
              <p className="text-sm text-foreground/55 mt-1">Paid visits</p>
            </Card>
            <Card tint="yellow">
              <p className="text-3xl font-bold">{naira(data.totals.vat)}</p>
              <p className="text-sm text-foreground/55 mt-1">VAT collected (owed, not revenue)</p>
            </Card>
          </div>

          {/* Trend. Hand-drawn rather than a charting dependency — this
              console has no chart library and one series doesn't justify one.
              Empty buckets are kept: hiding a zero day turns a patchy month
              into a tidy climb, in either chart variant. */}
          <Card className="mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-semibold">Revenue over time</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground/45">
                  {data.series.length} {data.range.granularity === "day" ? "days" : data.range.granularity === "week" ? "weeks" : "months"}
                </span>
                <div className="flex items-center gap-0.5 rounded-lg bg-black/5 p-0.5">
                  {(["bar", "line"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setChartVariant(key)}
                      aria-label={key === "bar" ? "Bar chart" : "Line chart"}
                      aria-pressed={chartVariant === key}
                      className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                        chartVariant === key ? "bg-white shadow-sm text-foreground" : "text-foreground/45 hover:text-foreground/70"
                      }`}
                    >
                      {key === "bar" ? "▊▊▊" : "⟋⟍"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {chartVariant === "bar" ? (
              // Equal-share flex columns, not a fixed per-bar width: the chart
              // fills the card at 5 points or at 90, rather than filling it
              // only by coincidence at whichever range happens to be wide
              // enough, and scrolling sideways at every other range.
              <div className="flex items-end gap-1">
                {data.series.map((point, i) => {
                  const ratio = peak > 0 ? point.platformRevenue / peak : 0;
                  // Thin the ticks out as the range grows — 90 daily labels
                  // side by side are an unreadable smear, and rotating them
                  // just makes an unreadable diagonal one.
                  const showLabel = i % labelEvery === 0 || i === data.series.length - 1;
                  return (
                    <div key={point.bucket} className="flex flex-1 min-w-0 flex-col items-center gap-2">
                      <div className="relative flex items-end h-[150px] w-full">
                        <div
                          className={`w-full rounded-t ${point.platformRevenue > 0 ? "bg-accent" : "bg-black/10"}`}
                          style={{ height: `${Math.max(2, ratio * 150)}px` }}
                          title={`${point.label}: ${naira(point.platformRevenue)} from ${point.visits} visit${point.visits === 1 ? "" : "s"}`}
                        />
                      </div>
                      <span className="text-[9px] text-foreground/45 text-center leading-tight whitespace-nowrap h-3 overflow-hidden w-full">
                        {showLabel ? point.label.replace("Wk of ", "") : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <RevenueLineChart series={data.series} peak={peak} labelEvery={labelEvery} />
            )}
          </Card>

          <div className="grid xl:grid-cols-2 gap-5 mb-6">
            <Card>
              <h2 className="font-semibold mb-4">Where the money comes from</h2>
              <BreakdownTable
                rows={data.byVisitType.map((r) => ({ label: r.type, revenue: r.platformRevenue, gross: r.gross, visits: r.visits }))}
                total={data.totals.platformRevenue}
              />
            </Card>
            <Card>
              <h2 className="font-semibold mb-4">By payment rail</h2>
              <BreakdownTable
                rows={data.byGateway.map((r) => ({
                  label: r.gateway === "flutterwave" ? "Flutterwave" : r.gateway === "paypal" ? "PayPal" : r.gateway,
                  revenue: r.platformRevenue,
                  gross: r.gross,
                  visits: r.visits,
                }))}
                total={data.totals.platformRevenue}
              />
            </Card>
          </div>

          <div className="grid xl:grid-cols-2 gap-5">
            <Card>
              <h2 className="font-semibold mb-4">Top providers by volume</h2>
              {data.topProviders.length === 0 ? (
                <p className="text-sm text-foreground/45">No paid visits in this range.</p>
              ) : (
                <BreakdownTable
                  rows={data.topProviders.map((r) => ({ label: r.name, revenue: r.platformRevenue, gross: r.gross, visits: r.visits }))}
                  total={data.totals.platformRevenue}
                />
              )}
            </Card>

            <Card>
              <h2 className="font-semibold mb-4">How the gross splits</h2>
              <dl className="text-sm space-y-3">
                <SplitRow label="Consultation fees (providers' work)" value={naira(data.totals.consultationFees)} />
                <SplitRow label="Service charge (patient-side platform fee)" value={naira(data.totals.serviceCharge)} />
                <SplitRow label="Provider commission (withheld from payout)" value={naira(data.totals.commission)} />
                <SplitRow label="Promo discounts (absorbed by the platform)" value={`− ${naira(data.totals.discount)}`} />
                <SplitRow label="VAT (collected for the tax authority)" value={naira(data.totals.vat)} muted />
                <SplitRow label="Owed to providers" value={naira(data.totals.providerPayout)} muted />
                <div className="pt-3 border-t border-black/5 flex justify-between font-semibold">
                  <dt>Platform revenue</dt>
                  <dd>{naira(data.totals.platformRevenue)}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The line-chart variant of the trend, drawn as inline SVG rather than a
 * charting dependency — same reasoning as the bar variant above, and inline
 * SVG has no CSP or bundle cost either way. Baseline is zero and every
 * bucket, including empty ones, gets a point: the bar chart's honesty rules
 * apply here too, a smooth line drawn only through the buckets with data
 * would hide exactly the gaps a trend view exists to show.
 */
function RevenueLineChart({
  series,
  peak,
  labelEvery,
}: {
  series: { bucket: string; label: string; platformRevenue: number; visits: number }[];
  peak: number;
  labelEvery: number;
}) {
  // Measured, not assumed: the SVG's path data is absolute coordinates, so
  // filling the card at any point count means knowing the card's actual
  // pixel width rather than deriving one from how many buckets there are.
  const [containerRef, measuredWidth] = useContainerWidth<HTMLDivElement>();
  const width = measuredWidth || 340; // pre-layout fallback, replaced on the first measurement
  const height = 150;
  const stepX = series.length > 1 ? width / (series.length - 1) : width;

  const points = series.map((s, i) => {
    const ratio = peak > 0 ? s.platformRevenue / peak : 0;
    return { x: series.length > 1 ? i * stepX : width / 2, y: height - ratio * height };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;

  return (
    <div ref={containerRef} className="w-full">
      <svg width={width} height={height + 20} style={{ display: "block" }}>
        <path d={areaPath} fill="var(--color-accent)" opacity={0.08} />
        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => {
          const s = series[i];
          const showLabel = i % labelEvery === 0 || i === series.length - 1;
          return (
            <g key={s.bucket}>
              <circle cx={p.x} cy={p.y} r={3} fill={s.platformRevenue > 0 ? "var(--color-accent)" : "rgba(0,0,0,0.2)"} stroke="white" strokeWidth={1.5}>
                <title>{`${s.label}: ${naira(s.platformRevenue)} from ${s.visits} visit${s.visits === 1 ? "" : "s"}`}</title>
              </circle>
              {showLabel && (
                <text x={p.x} y={height + 14} fontSize={9} textAnchor="middle" fill="currentColor" className="text-foreground/45">
                  {s.label.replace("Wk of ", "")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SplitRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "text-foreground/50" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums whitespace-nowrap">{value}</dd>
    </div>
  );
}

function BreakdownTable({
  rows,
  total,
}: {
  rows: { label: string; revenue: number; gross: number; visits: number }[];
  total: number;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const share = total > 0 ? row.revenue / total : 0;
        return (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{row.label}</span>
              <span className="tabular-nums">
                {naira(row.revenue)}
                <span className="text-foreground/45"> · {row.visits} visit{row.visits === 1 ? "" : "s"}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(share * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
