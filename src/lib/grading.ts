/**
 * Shared grading logic for the internal examination module.
 * Pure functions safe to import on the server (seed / API) and client (UI).
 */

export interface InternalResult {
  theory: number;
  practical: number;
  maxTheory: number;
  maxPractical: number;
  total: number;
  maxTotal: number;
  pct: number;
  passMarks: number;
  result: "pass" | "fail";
  gradeLetter: string;
  gradePoint: number;
}

/** [minimum %, grade, grade point] */
export const GRADE_BANDS: Array<[number, string, number]> = [
  [90, "A+", 10],
  [80, "A", 9],
  [70, "B+", 8],
  [60, "B", 7],
  [50, "C+", 6],
  [40, "C", 5],
  [0, "F", 0],
];

const toNum = (v: number | string | null | undefined, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function computeInternal(
  theory: number | string,
  practical: number | string,
  maxTheory: number | string = 30,
  maxPractical: number | string = 20,
  passingPercent: number | string = 40,
): InternalResult {
  const t = toNum(theory);
  const p = toNum(practical);
  const mt = Math.max(1, toNum(maxTheory, 30));
  const mp = Math.max(1, toNum(maxPractical, 20));
  const total = t + p;
  const maxTotal = mt + mp;
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const passMarks = Math.ceil((maxTotal * toNum(passingPercent, 40)) / 100);
  const result: "pass" | "fail" = total >= passMarks ? "pass" : "fail";
  const band = GRADE_BANDS.find(([min]) => pct >= min) || GRADE_BANDS[GRADE_BANDS.length - 1];
  return {
    theory: t,
    practical: p,
    maxTheory: mt,
    maxPractical: mp,
    total,
    maxTotal,
    pct,
    passMarks,
    result,
    gradeLetter: band[1],
    gradePoint: band[2],
  };
}

/**
 * Weighted GPA across a set of marks (weighted by maxTotal of each subject).
 * Returns 0 when there are no marks.
 */
export function computeGpa(rows: { gradePoint: number; maxTotal: number }[]): number {
  const totalWeight = rows.reduce((a, r) => a + r.maxTotal, 0);
  if (totalWeight <= 0) return 0;
  return rows.reduce((a, r) => a + r.gradePoint * r.maxTotal, 0) / totalWeight;
}

/** Percentage across a set of marks (total obtained / total max). */
export function computeOverallPct(rows: { total: number; maxTotal: number }[]): number {
  const max = rows.reduce((a, r) => a + r.maxTotal, 0);
  if (max <= 0) return 0;
  return (rows.reduce((a, r) => a + r.total, 0) / max) * 100;
}
