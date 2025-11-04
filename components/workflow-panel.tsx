import { cn } from "@/lib/utils";
import type { StepStatus, WorkflowStep } from "@/types/workflow";

const STEP_BADGE_LABEL: Record<StepStatus, string> = {
  done: "Done",
  current: "In progress",
  idle: "Next",
};

const STEP_BADGE_STYLES: Record<StepStatus, string> = {
  done: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  current: "border-white/25 bg-white/10 text-white",
  idle: "border-white/10 bg-transparent text-slate-400",
};

const STEP_CARD_STYLES: Record<StepStatus, string> = {
  done: "border-emerald-400/30 bg-emerald-500/5",
  current: "border-emerald-400/40 bg-emerald-500/10",
  idle: "border-white/8 bg-black/30",
};

const STEP_DOT_STYLES: Record<StepStatus, string> = {
  done: "border-emerald-400 bg-emerald-300",
  current: "border-white/40 bg-white",
  idle: "border-white/15 bg-transparent",
};

// WorkflowPanel explains the three-step journey from photo to results.
export function WorkflowPanel({ steps, className }: { steps: WorkflowStep[]; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 backdrop-blur",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-white">What happens next</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {steps.map((step) => (
          <li
            key={step.label}
            className={cn("flex items-center gap-3 rounded-lg border p-3 transition", STEP_CARD_STYLES[step.status])}
          >
            <span className={cn("flex h-2.5 w-2.5 flex-none rounded-full border", STEP_DOT_STYLES[step.status])} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{step.label}</p>
              <p className="text-xs text-slate-400">{step.helper}</p>
            </div>
            <span
              className={cn(
                "flex-none rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
                STEP_BADGE_STYLES[step.status],
              )}
            >
              {STEP_BADGE_LABEL[step.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
