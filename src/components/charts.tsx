"use client";
import { useEffect, useState } from "react";

/* ============================================================
   PREMIUM COMPACT CHARTS - theme-matched (paper / ink / blue)
   Light surfaces, slate hairlines, blue accent (#2563eb).
   Animated draw-in, smooth hover states, built-in tooltips.
   ============================================================ */

/** Blue-family palette used for the "by area" donut. */
export const CHART_PALETTE = ["#1d4ed8", "#3b82f6", "#60a5fa", "#94a3b8"];

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

const safeValue = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0);
const formatNum = (n: number) => n.toLocaleString("en-IN");
const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/** True once after mount - used to trigger draw-in animations. */
function useMounted(delay = 80) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return mounted;
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-[11px] text-muted font-serif italic">
      {label}
    </div>
  );
}

/* ============================================================
   DONUT CHART - share / composition with center total & legend
   ============================================================ */
export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 150,
  thickness = 16,
}: {
  data: ChartDatum[];
  centerValue?: string;
  centerLabel?: string;
  size?: number;
  thickness?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const mounted = useMounted();

  if (data.length === 0) return <Empty label="No data yet" />;

  const total = data.reduce((a, d) => a + safeValue(d.value), 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;

  const segments = data.map((d, i) => {
    // +0.5 overlap hides antialiasing hairlines between segments and lets a
    // single 100% segment close the ring cleanly.
    const len = Math.max(0, Math.min((safeValue(d.value) / total) * c + 0.5, c));
    const start = data
      .slice(0, i)
      .reduce((a, x) => a + (safeValue(x.value) / total) * c, 0);
    return { ...d, i, len, start };
  });

  const shown = active !== null ? data[active] : null;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          {/* track */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
          <g transform={`rotate(-90 ${cx} ${cx})`}>
            {segments.map((s) => (
              <circle
                key={s.label}
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={s.color ?? CHART_PALETTE[s.i % CHART_PALETTE.length]}
                strokeWidth={active === s.i ? thickness + 2 : thickness}
                strokeLinecap="butt"
                strokeDasharray={`${mounted ? s.len : 0} ${c}`}
                strokeDashoffset={-s.start}
                style={{
                  transition:
                    "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke-width 0.18s ease, opacity 0.18s ease, filter 0.18s ease",
                  opacity: active === null || active === s.i ? 1 : 0.35,
                  filter: active === s.i ? "brightness(1.15)" : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setActive(s.i)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        {/* center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center leading-none">
          <span className="text-[22px] font-semibold text-ink">
            {shown ? formatNum(shown.value) : (centerValue ?? formatNum(total))}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-muted">
            {shown ? shown.label : (centerLabel ?? "total")}
          </span>
        </div>
      </div>

      {/* legend */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {segments.map((s) => (
          <button
            key={s.label}
            type="button"
            onMouseEnter={() => setActive(s.i)}
            onMouseLeave={() => setActive(null)}
            className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md transition-colors ${
              active === s.i ? "bg-paper-2" : "hover:bg-paper-2"
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-[3px] shrink-0"
                style={{ background: s.color ?? CHART_PALETTE[s.i % CHART_PALETTE.length] }}
              />
              <span className="text-[11px] text-ink truncate">{s.label}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-ink">{formatNum(s.value)}</span>
              <span className="text-[10px] text-muted w-8 text-right">{pctOf(s.value, total)}%</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   MINI BAR CHART - vertical rounded bars with hover tooltips
   ============================================================ */
export function MiniBarChart({
  data,
  height = 120,
  emptyLabel = "No data yet",
}: {
  data: ChartDatum[];
  height?: number;
  emptyLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const mounted = useMounted();

  if (data.length === 0) return <Empty label={emptyLabel} />;

  const max = Math.max(1, ...data.map((d) => safeValue(d.value)));

  return (
    <div>
      <div className="relative flex items-end gap-3" style={{ height }}>
        {/* hairlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <div
            key={f}
            className="absolute left-0 right-0 border-t border-dashed border-slate-200"
            style={{ bottom: `${f * 100}%` }}
          />
        ))}
        {data.map((d, i) => {
          const h = Math.max(4, (d.value / max) * 100);
          const isActive = active === i;
          return (
            <div
              key={d.label}
              className="relative flex-1 flex flex-col items-center justify-end min-w-0 h-full group"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {/* tooltip */}
              {isActive && (
                <div className="pop-in absolute -top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="bg-ink text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                    {formatNum(safeValue(d.value))}
                  </div>
                </div>
              )}
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${h}%`,
                  background: `linear-gradient(180deg, ${d.color ?? "#60a5fa"}, ${d.color ?? "#2563eb"})`,
                  transform: mounted ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "bottom",
                  transition:
                    "transform 0.7s cubic-bezier(0.4,0,0.2,1), filter 0.18s ease",
                  filter: isActive ? "brightness(1.15)" : "brightness(1)",
                }}
              />
              <span className="mt-1.5 text-[9px] text-muted truncate w-full text-center">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   STACKED BAR - single horizontal bar showing composition
   ============================================================ */
export function StackedBar({
  data,
  totalLabel = "total",
}: {
  data: ChartDatum[];
  totalLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const mounted = useMounted();

  if (data.length === 0) return <Empty label="No data yet" />;

  const total = data.reduce((a, d) => a + safeValue(d.value), 0) || 1;

  return (
    <div>
      <div className="relative flex h-3 rounded-full overflow-hidden bg-slate-100">
        {data.map((d, i) => {
          const w = (safeValue(d.value) / total) * 100;
          return (
            <div
              key={d.label}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="h-full cursor-pointer transition-opacity duration-150"
              style={{
                width: mounted ? `${w}%` : "0%",
                background: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
                opacity: active === null || active === i ? 1 : 0.35,
                transition:
                  "width 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease",
              }}
            />
          );
        })}
      </div>
      <div
        className="mt-2.5 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0,1fr))` }}
      >
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`text-center rounded-md px-1 py-1 transition-colors ${
              active === i ? "bg-paper-2" : "hover:bg-paper-2"
            }`}
          >
            <span
              className="block mx-auto h-2 w-2 rounded-[3px] mb-1"
              style={{ background: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }}
            />
            <span className="block text-[11px] font-semibold text-ink leading-none">
              {formatNum(d.value)}
            </span>
            <span className="block text-[9px] text-muted mt-0.5 truncate">{d.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        {totalLabel} &middot; {formatNum(total)}
      </p>
    </div>
  );
}