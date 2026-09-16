"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { ClassifyResult } from "@/lib/types";
import { CATEGORY_COLORS, formatConfidence } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  message: string;
  onClassified?: (result: ClassifyResult) => void;
}

export default function ClassifyNote({ message, onClassified }: Props) {
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!message.trim() || message.trim().length < 5) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ClassifyResult>("/classify", { message });
      setResult(data);
      onClassified?.(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Classification service unavailable");
    } finally {
      setLoading(false);
    }
  };

  const colorClass = result
    ? CATEGORY_COLORS[result.category] || "text-slate-400 bg-slate-400/10 border-slate-400/30"
    : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          AI Note Classification
        </p>
        <button
          type="button"
          onClick={handleClassify}
          disabled={loading || !message || message.trim().length < 5}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {loading ? "Classifying..." : "Classify Note"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {result && !error && (
        <div className={cn("px-3 py-3 rounded-xl border space-y-2", colorClass)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.needs_review ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">{result.category}</span>
            </div>
            <span className="text-xs font-bold opacity-80">
              {formatConfidence(result.confidence)}
            </span>
          </div>

          {result.needs_review && (
            <p className="text-xs opacity-75">
              Low confidence — this note has been flagged for manual review.
            </p>
          )}

          {/* Mini probability bars */}
          {result.all_probabilities && (
            <div className="space-y-1 pt-1 border-t border-current/20">
              {Object.entries(result.all_probabilities)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([cat, prob]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-[10px] opacity-60 w-28 truncate">{cat}</span>
                    <div className="flex-1 h-1 rounded-full bg-current/10">
                      <div
                        className="h-full rounded-full bg-current/60 transition-all duration-500"
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] opacity-60 w-8 text-right">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
