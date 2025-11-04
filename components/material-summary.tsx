import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, Trash2, FileText, Coins } from "lucide-react";
import { MaterialPieChart } from "./material-pie-chart";

// Material icon mapping
const MATERIAL_ICONS = {
  Plastic: Trash2,
  Paper: FileText,
  Metal: Coins,
};

// MaterialSummary lists detected material counts alongside the total.
export function MaterialSummary({
  breakdown,
  status,
  total,
  className,
}: {
  breakdown: Array<{ chip: string; label: string; value: number }>;
  status: "updated" | "processing" | "waiting";
  total: number;
  className?: string;
}) {
  const statusConfig = {
    updated: { label: "Updated", icon: Sparkles, color: "text-emerald-400" },
    processing: { label: "Processing", icon: TrendingUp, color: "text-sky-400" },
    waiting: { label: "Waiting", icon: null, color: "text-slate-400" },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  // Prepare data for pie chart with proper color mappings
  const pieChartData = breakdown.map((item) => ({
    label: item.label,
    value: item.value,
    color:
      item.label === "Plastic"
        ? "hsl(158, 64%, 52%)" // emerald-400
        : item.label === "Paper"
          ? "hsl(199, 89%, 48%)" // sky-400
          : "hsl(38, 92%, 50%)", // amber-400
  }));

  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-white/15 hover:bg-white/[0.05]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Material summary</h2>
          <p className="text-sm text-slate-400">Live count of detected items</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs font-semibold transition-colors",
            currentStatus.color,
          )}
        >
          {StatusIcon && <StatusIcon className="h-3 w-3" />}
          {currentStatus.label}
        </span>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-lg border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5">
        <div className="absolute right-3 top-3 h-16 w-16 rounded-full bg-emerald-400/10 blur-2xl" />
        <p className="relative text-xs font-medium uppercase tracking-wider text-emerald-300/80">Total items</p>
        <p className="relative mt-2 text-4xl font-bold text-white transition-all duration-300">{total}</p>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Breakdown</p>
        <ul className="space-y-2">
          {breakdown.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const MaterialIcon = MATERIAL_ICONS[item.label as keyof typeof MATERIAL_ICONS];
            return (
              <li
                key={item.label}
                className="group/item relative overflow-hidden rounded-lg border border-white/8 bg-gradient-to-r from-black/40 to-black/20 transition-all hover:border-white/15 hover:from-black/50 hover:to-black/30"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover/item:scale-110",
                        item.chip,
                      )}
                    >
                      {MaterialIcon && <MaterialIcon className="h-4 w-4 text-slate-950" />}
                    </span>
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">{item.value}</span>
                    {total > 0 && (
                      <span className="text-xs font-medium text-slate-400">{percentage.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 rounded-lg border border-white/8 bg-black/20 p-4">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Distribution</p>
        <MaterialPieChart data={pieChartData} />
      </div>
    </div>
  );
}
