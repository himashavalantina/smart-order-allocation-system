import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
  description?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-indigo-400",
  trend,
  trendUp,
  description,
}: Props) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors",
            iconColor.replace("text-", "text-")
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      {trend && (
        <div className={cn("text-xs font-medium flex items-center gap-1", trendUp ? "text-emerald-400" : "text-red-400")}>
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
