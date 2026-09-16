"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/utils";
import { Brain } from "lucide-react";

interface Props {
  category: string | null | undefined;
  confidence: number | null | undefined;
  size?: "sm" | "md";
}

/**
 * AICategoryBadge
 * ───────────────
 * Coloured pill showing the ML-predicted category label and confidence %.
 * Colour palette matches CATEGORY_COLORS in utils.ts.
 */
export default function AICategoryBadge({ category, confidence, size = "sm" }: Props) {
  if (!category) return null;

  const colorClass =
    CATEGORY_COLORS[category] ?? "text-slate-400 bg-slate-400/10 border-slate-400/30";

  const confidencePct =
    confidence !== null && confidence !== undefined
      ? `${(confidence * 100).toFixed(0)}%`
      : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
      title={confidencePct ? `AI confidence: ${confidencePct}` : undefined}
    >
      <Brain className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {category}
      {confidencePct && (
        <span className="opacity-60 font-normal ml-0.5">{confidencePct}</span>
      )}
    </span>
  );
}
