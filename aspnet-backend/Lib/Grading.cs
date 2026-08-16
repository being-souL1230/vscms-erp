using System.Globalization;

namespace VscmsErp.Api.Lib;

/// <summary>
/// Shared grading logic for the internal examination module,
/// ported 1:1 from src/lib/grading.ts.
/// </summary>
public static class Grading
{
    /// <summary>[minimum %, grade, grade point]</summary>
    public static readonly (double Min, string Grade, int Point)[] GradeBands =
    [
        (90, "A+", 10),
        (80, "A", 9),
        (70, "B+", 8),
        (60, "B", 7),
        (50, "C+", 6),
        (40, "C", 5),
        (0, "F", 0),
    ];

    // Mirrors JS Number(): null → NaN (fallback), ""/whitespace → 0,
    // otherwise parse; non-negative finite values are kept.
    public static double ToNum(string? v, double fallback = 0)
    {
        if (v is null) return fallback;
        if (string.IsNullOrWhiteSpace(v)) return 0;
        if (double.TryParse(v.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var n))
            return n >= 0 ? n : fallback;
        return fallback;
    }

    public sealed record InternalResult(
        double Theory, double Practical, double MaxTheory, double MaxPractical,
        double Total, double MaxTotal, double Pct, double PassMarks,
        string Result, string GradeLetter, double GradePoint);

    public static InternalResult ComputeInternal(
        string? theory, string? practical,
        string? maxTheory = null, string? maxPractical = null, string? passingPercent = null)
    {
        var t = ToNum(theory);
        var p = ToNum(practical);
        var mt = Math.Max(1, ToNum(maxTheory, 30));
        var mp = Math.Max(1, ToNum(maxPractical, 20));
        var total = t + p;
        var maxTotal = mt + mp;
        var pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
        var passMarks = Math.Ceiling((maxTotal * ToNum(passingPercent, 40)) / 100);
        var result = total >= passMarks ? "pass" : "fail";
        var band = GradeBands[^1];
        foreach (var b in GradeBands)
        {
            if (pct >= b.Min) { band = b; break; }
        }
        return new InternalResult(t, p, mt, mp, total, maxTotal, pct, passMarks, result, band.Grade, band.Point);
    }

    /// <summary>JS String(number): no trailing ".0" for whole numbers.</summary>
    public static string Num(double v) =>
        v == Math.Floor(v) && !double.IsInfinity(v)
            ? ((long)v).ToString(CultureInfo.InvariantCulture)
            : v.ToString(CultureInfo.InvariantCulture);
}
