import Image from "next/image";
import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

type Overlay = {
  label: string;
  color: string;
  style: { top: string; left: string; width: string; height: string };
};

// PreviewStage showcases the large photo viewer with toggles and overlays.
export function PreviewStage({
  activeView,
  onViewChange,
  overlays,
  previewSrc,
  resultReady,
  segmentedSrc,
  className,
}: {
  activeView: "original" | "segmented";
  onViewChange: (view: "original" | "segmented") => void;
  overlays: Overlay[];
  previewSrc: string | null;
  resultReady: boolean;
  segmentedSrc: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/25 backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Preview</h2>
          <p className="text-sm text-slate-300">Fullscreen view of your photo and the highlighted materials.</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/6 p-1 text-xs">
          <button
            onClick={() => onViewChange("original")}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium transition",
              activeView === "original" ? "bg-white/20 text-white" : "text-slate-300",
            )}
          >
            Original
          </button>
          <button
            onClick={() => onViewChange("segmented")}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium transition",
              activeView === "segmented" ? "bg-white/20 text-white" : "text-slate-300",
            )}
          >
            Segmented
          </button>
        </div>
      </div>

      <div className="mt-5 flex-1 overflow-hidden rounded-xl border border-white/12 bg-black/60">
        {previewSrc ? (
          <div className="relative h-full w-full">
            <Image
              src={activeView === "original" ? previewSrc : segmentedSrc ?? previewSrc}
              alt="Uploaded preview"
              fill
              sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 70vw, 100vw"
              className="object-contain"
              priority
              unoptimized
            />
            {activeView === "segmented" && resultReady ? (
              <div className="absolute inset-0">
                {overlays.map((segment) => (
                  <div
                    key={segment.label}
                    className={cn("absolute rounded-lg border border-white/10 bg-gradient-to-br", segment.color)}
                    style={segment.style}
                  >
                    <span className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[0.7rem] font-medium text-white">
                      {segment.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full min-h-[24rem] items-center justify-center text-center">
            <div>
              <Camera className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">Your preview will appear here as soon as you add a photo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
