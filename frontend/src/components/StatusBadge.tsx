import { OrderStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  status: OrderStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const colorClass = STATUS_COLORS[status] || "text-slate-400 bg-slate-400/10 border-slate-400/30";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("rounded-full bg-current", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {label}
    </span>
  );
}
