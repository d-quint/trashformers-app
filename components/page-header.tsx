import { Sparkles } from "lucide-react";

// PageHeader renders the headline and supporting copy for the dashboard.
export function PageHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 pb-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 sm:h-12 sm:w-12">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="space-y-1">
          <p className="hidden text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-emerald-200 min-[420px]:block">
            Trashformers
          </p>
          <h1 className="text-2xl font-semibold text-white leading-tight sm:text-[2.2rem]">
            See what's recyclable in a snap
          </h1>
        </div>
      </div>
      <p className="max-w-2xl text-sm text-slate-300 sm:text-[0.95rem]">
        Upload or capture your trash and get clear highlights of paper, plastic, and metal in one simple view using this dashboard.
      </p>
    </header>
  );
}
