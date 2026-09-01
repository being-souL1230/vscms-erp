"use client";

import { useState, useEffect } from "react";
import { Star, X, MessageSquare, CheckCircle2, Clock, ThumbsUp, Sparkles } from "lucide-react";
import type { User } from "@/types/erp";

export interface FeedbackRating {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface FeedbackSummary {
  averageRating: number;
  totalRatings: number;
  ratings: FeedbackRating[];
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onSummaryUpdate?: (summary: FeedbackSummary) => void;
}

const RATING_CONFIG: Record<number, { label: string; tag: string; bg: string }> = {
  5: { label: "5.0 - Outstanding ERP Experience!", tag: "EXCELLENT", bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500" },
  4: { label: "4.0 - Very Good & Feature Rich", tag: "VERY GOOD", bg: "bg-blue-500/10 text-blue-700 border-blue-500" },
  3: { label: "3.0 - Good & Functional", tag: "GOOD", bg: "bg-amber-500/10 text-amber-700 border-amber-500" },
  2: { label: "2.0 - Fair / Needs Refinement", tag: "FAIR", bg: "bg-orange-500/10 text-orange-700 border-orange-500" },
  1: { label: "1.0 - Needs Significant Work", tag: "POOR", bg: "bg-rose-500/10 text-rose-700 border-rose-500" },
};

const STORAGE_KEY = "vscms_last_feedback_time";
const COOLDOWN_DURATION_SEC = 60;

export function FeedbackModal({
  isOpen,
  onClose,
  currentUser,
  onSummaryUpdate,
}: FeedbackModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [summary, setSummary] = useState<FeedbackSummary>({
    averageRating: 0.0,
    totalRatings: 0,
    ratings: [],
  });

  const [cooldownSec, setCooldownSec] = useState<number>(0);

  // Fetch rating summary
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data: FeedbackSummary = await res.json();
        setSummary(data);
        onSummaryUpdate?.(data);
      }
    } catch {
      // Keep fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
      checkCooldown();
    }
  }, [isOpen]);

  // Check 1-minute cooldown from localStorage
  const checkCooldown = () => {
    const lastTimeStr = localStorage.getItem(STORAGE_KEY);
    if (lastTimeStr) {
      const lastTime = parseInt(lastTimeStr, 10);
      const elapsedSec = Math.floor((Date.now() - lastTime) / 1000);
      const remainingSec = COOLDOWN_DURATION_SEC - elapsedSec;
      if (remainingSec > 0) {
        setCooldownSec(remainingSec);
      } else {
        setCooldownSec(0);
      }
    }
  };

  // Cooldown countdown interval
  useEffect(() => {
    if (cooldownSec <= 0) return;

    const timer = setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSec]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSec > 0) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      // Store timestamp for 1-minute cooldown
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, now.toString());
      setCooldownSec(COOLDOWN_DURATION_SEC);

      setSummary({
        averageRating: data.averageRating,
        totalRatings: data.totalRatings,
        ratings: data.ratings || [],
      });
      onSummaryUpdate?.({
        averageRating: data.averageRating,
        totalRatings: data.totalRatings,
        ratings: data.ratings || [],
      });

      setComment("");
      setSuccessMsg("Thank you for your rating & feedback! ⭐");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting feedback");
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayRating = hoverRating || selectedRating;
  const ratingMeta = RATING_CONFIG[currentDisplayRating] || RATING_CONFIG[5];

  // Format MM:SS for countdown display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Star breakdown calculation
  const getRatingCount = (star: number) =>
    summary.ratings.filter((r) => r.rating === star).length;

  return (
    <div className="fixed inset-0 z-[70] bg-ink/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ink bg-ink text-paper shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 border border-ink text-ink hard-sm">
              <Sparkles className="w-5 h-5 fill-ink" />
            </div>
            <div>
              <h3 className="font-display uppercase text-xl text-paper leading-none">
                Ratings & Presentation Feedback
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-paper p-1.5 hover:bg-blood hover:border-blood press text-paper transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-6 overflow-y-auto">

          {/* Premium Hero Score Card */}
          <div className="bg-gradient-to-br from-amber-400/15 via-paper to-amber-500/10 border-2 border-ink p-3.5 sm:p-5 hard-sm flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5 relative overflow-hidden">
            
            {/* Left: Overall Score Badge */}
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="bg-amber-400 border-2 border-ink p-3 sm:p-4 text-ink flex flex-col items-center justify-center hard-sm shadow-md min-w-[85px] sm:min-w-[90px] shrink-0">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-ink text-ink" />
                </div>
                <span className="font-display text-3xl sm:text-4xl font-black text-ink leading-none mt-1">
                  {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "0.0"}
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold text-ink/80 mt-1">
                  OUT OF 5.0
                </span>
              </div>

              <div>
                <h4 className="font-display text-base sm:text-lg text-ink font-bold uppercase tracking-tight">
                  {summary.totalRatings > 0
                    ? `${summary.averageRating.toFixed(1)} Overall Rating`
                    : "No Ratings Yet"}
                </h4>
                <p className="font-serif text-[11px] sm:text-xs text-muted mt-0.5 sm:mt-1 leading-relaxed">
                  {summary.totalRatings > 0
                    ? `Based on ${summary.totalRatings} user review${summary.totalRatings === 1 ? "" : "s"} from live presentation guests.`
                    : "Be the first presentation guest to submit a rating & review!"}
                </p>
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-ink bg-ink text-paper">
                    {summary.totalRatings} Vote{summary.totalRatings === 1 ? "" : "s"} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Premium Rating Breakdown Deck */}
            <div className="w-full sm:w-44 flex flex-col gap-1.5 border-t sm:border-t-0 sm:border-l-2 border-ink/20 pt-3 sm:pt-0 sm:pl-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-0.5">
                Rating Breakdown
              </span>
              {[5, 4, 3, 2, 1].map((star) => {
                const cnt = getRatingCount(star);
                const pct = summary.totalRatings > 0 ? Math.round((cnt / summary.totalRatings) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs font-mono">
                    {/* Star Label Badge */}
                    <div className="flex items-center gap-1 w-10 shrink-0 font-bold text-ink">
                      <span>{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </div>
                    {/* Multi-stop Gradient Progress Bar */}
                    <div className="flex-1 h-2.5 bg-paper border border-ink overflow-hidden rounded-none relative">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Count badge */}
                    <span className="w-8 text-right font-bold text-muted text-[10px]">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cooldown Timer Alert Banner */}
          {cooldownSec > 0 ? (
            <div className="bg-blood/10 border-2 border-blood p-4 flex items-center justify-between gap-3 hard-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blood text-paper border border-ink hard-sm">
                  <Clock className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <p className="font-mono text-xs font-bold text-blood uppercase tracking-wider">
                    Rating Cooldown Enforced (1 Min)
                  </p>
                  <p className="font-serif text-xs text-ink/80 mt-0.5">
                    Thank you! Next submission re-opens automatically when the timer reaches 0.
                  </p>
                </div>
              </div>
              <div className="bg-blood text-paper font-mono font-bold text-base px-3.5 py-1.5 border-2 border-ink hard-sm shadow-md shrink-0">
                {formatTime(cooldownSec)}
              </div>
            </div>
          ) : (
            /* Premium Interactive Rating Input Deck */
            <form onSubmit={handleSubmit} className="space-y-4 border-2 border-ink p-5 bg-paper-2 hard-sm relative">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blood" />
                  <span className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                    Rate Your Experience
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted uppercase font-bold">
                  Presentation Mode
                </span>
              </div>

              {/* Star Selector Deck */}
              <div className="flex flex-col items-center gap-3 py-2 bg-paper border border-ink/30 p-4 hard-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= currentDisplayRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className={`p-1.5 press transition-all duration-200 focus:outline-none ${
                          isFilled ? "scale-110" : "scale-100 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Star
                          className={`w-9 h-9 sm:w-10 sm:h-10 ${
                            isFilled
                              ? "fill-amber-400 text-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)] stroke-[1.5]"
                              : "fill-paper text-ink/40 stroke-[1.5]"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Badge Tag */}
                <div className={`px-3 py-1 border font-mono text-xs font-bold transition-all ${ratingMeta.bg} hard-sm`}>
                  {ratingMeta.label}
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                    Optional Feedback / Suggestion
                  </label>
                  <span className="font-mono text-[10px] text-muted">
                    {comment.length} / 250
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts, UI feedback, or feature comments for VSCMS ERP..."
                  className="w-full p-3 text-xs font-serif border-2 border-ink bg-paper focus:outline-none focus:ring-2 focus:ring-blood"
                />
              </div>

              {error && (
                <p className="font-mono text-xs text-blood font-bold">{error}</p>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border-2 border-emerald-600 text-emerald-800 p-3 text-xs font-mono font-bold flex items-center gap-2 hard-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cooldownSec > 0}
                className="w-full py-3 px-4 border-2 border-ink bg-blood text-paper font-mono text-xs uppercase tracking-wider font-bold hard-sm press hover:bg-blood/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  "Submitting Rating..."
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    Submit Rating (Enforces 1-Min Cooldown)
                  </>
                )}
              </button>
            </form>
          )}

          {/* Community Reviews Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
                Community Reviews ({summary.ratings.length})
              </h4>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {summary.ratings.length === 0 ? (
                <div className="p-5 border-2 border-dashed border-ink/20 bg-paper text-center space-y-1">
                  <Star className="w-6 h-6 text-amber-400 mx-auto opacity-50" />
                  <p className="font-serif italic text-xs text-muted">
                    No presentation ratings submitted yet.
                  </p>
                  <p className="font-mono text-[10px] text-ink font-bold uppercase">
                    Be the first guest to rate VSCMS ERP above!
                  </p>
                </div>
              ) : (
                summary.ratings.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 border-2 border-ink bg-paper hard-sm flex flex-col gap-1.5 text-xs hover:bg-paper-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink">{r.userName}</span>
                        <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-ink text-paper font-bold border border-ink">
                          {r.userRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-amber-700 bg-amber-400/20 px-2 py-0.5 border border-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{r.rating}.0</span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="font-serif text-ink/90 italic text-[11px] bg-paper-2 p-2 border border-ink/10">
                        "{r.comment}"
                      </p>
                    )}
                    <span className="font-mono text-[9px] text-muted self-end">
                      {r.createdAt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
