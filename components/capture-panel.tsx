import type { ChangeEvent, DragEvent, RefObject } from "react";
import { Camera, Loader2, RefreshCcw, Sparkles, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";

// CapturePanel handles image capture, upload, and segmentation triggers.
export function CapturePanel({
  assetName,
  captureInputRef,
  fileInputRef,
  hasResult,
  onFileChange,
  onProcess,
  onReset,
  onStartCapture,
  onStartUpload,
  onDragOver,
  onDrop,
  previewSrc,
  processing,
  progress,
  className,
}: {
  assetName: string;
  captureInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  hasResult: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  onReset: () => void;
  onStartCapture: () => void;
  onStartUpload: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  previewSrc: string | null;
  processing: boolean;
  progress: number;
  className?: string;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/20 backdrop-blur",
        className,
      )}
    >
      <div className="grid gap-5 text-center md:grid-cols-[auto,1fr] md:items-center md:text-left">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200 md:mx-0">
          <UploadCloud className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Add your photo</h2>
          <p className="text-sm text-slate-300">
            Drop an image into this window or use the buttons below. JPG and PNG files up to 15 MB are supported.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="group flex flex-col items-center gap-2 text-center">
          <button
            onClick={onStartCapture}
            aria-label="Take photo"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-white transition hover:border-white/20 hover:bg-white/12"
          >
            <Camera className="h-5 w-5" />
          </button>
          <span className="text-xs font-medium text-slate-300 group-hover:text-white">Take photo</span>
        </div>
        <div className="group flex flex-col items-center gap-2 text-center">
          <button
            onClick={onStartUpload}
            aria-label="Upload from device"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/15 text-emerald-100 transition hover:border-emerald-400/35 hover:bg-emerald-500/25"
          >
            <UploadCloud className="h-5 w-5" />
          </button>
          <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-100">Upload from device</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">Tip: place the trash on a flat, well-lit surface for best detection.</p>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      {previewSrc ? (
        <div className="mt-5 space-y-3 rounded-lg border border-white/8 bg-black/40 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {processing ? "Segmenting your photo..." : hasResult ? "All set!" : "Ready to segment"}
                </p>
                <p className="text-xs text-slate-400">{assetName || "Captured photo"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onProcess}
                disabled={processing}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
                  processing
                    ? "cursor-not-allowed border border-white/10 bg-white/5 text-slate-400"
                    : "border border-emerald-500/30 bg-emerald-500/15 text-emerald-100 hover:border-emerald-400/40 hover:bg-emerald-500/25",
                )}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {processing ? "Working" : hasResult ? "Run again" : "Segment photo"}
              </button>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
                Start over
              </button>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400">
            {processing ? `${Math.round(progress)}%` : hasResult ? "Finished" : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
