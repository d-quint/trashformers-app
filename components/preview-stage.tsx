import Image from "next/image";
import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

type SegmentOverlay = {
  id: number;
  label: string;
  confidence: number;
  polygon: Array<[number, number]>;
  fillColor: string;
  strokeColor: string;
};

type ImageSize = { width: number; height: number } | null;

// PreviewStage showcases the large photo viewer with toggles and overlays.
export function PreviewStage({
  activeView,
  onViewChange,
  segments,
  previewSrc,
  resultReady,
  segmentedSrc,
  imageSize,
  className,
}: {
  activeView: "original" | "segmented";
  onViewChange: (view: "original" | "segmented") => void;
  segments: SegmentOverlay[];
  previewSrc: string | null;
  resultReady: boolean;
  segmentedSrc: string | null;
  imageSize: ImageSize;
  className?: string;
}) {
  const hasSegments = Boolean(
    activeView === "segmented" &&
      resultReady &&
      imageSize &&
      segments.length > 0,
  );

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

  <div className="mt-5 flex-1 overflow-hidden rounded-xl border border-white/12 bg-black/60 min-h-[18rem] sm:min-h-[22rem]">
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
            {hasSegments ? (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${imageSize?.width ?? 1} ${imageSize?.height ?? 1}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {segments.map((segment) => {
                  if (!segment.polygon.length) return null;
                  const points = segment.polygon.map(([x, y]) => `${x},${y}`).join(" ");
                  const [labelX = 0, labelY = 0] = segment.polygon[0] ?? [0, 0];
                  const maxDimension = imageSize ? Math.max(imageSize.width, imageSize.height) : 1;
                  const strokeWidth = maxDimension * 0.0025;
                  const fontSize = Math.max(maxDimension * 0.022, 14);

                  return (
                    <g key={segment.id}>
                      <polygon
                        points={points}
                        fill={segment.fillColor}
                        stroke={segment.strokeColor}
                        strokeWidth={strokeWidth}
                      >
                        <title>
                          {segment.label} ({Math.round(segment.confidence * 100)}%)
                        </title>
                      </polygon>
                      <g>
                        <rect
                          x={labelX - fontSize}
                          y={labelY - fontSize * 0.9}
                          width={fontSize * 2}
                          height={fontSize * 0.9}
                          rx={fontSize * 0.15}
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke={segment.strokeColor}
                          strokeWidth={strokeWidth}
                        />
                        <text
                          x={labelX}
                          y={labelY - fontSize * 0.3}
                          fill="white"
                          fontSize={fontSize * 0.55}
                          fontWeight={600}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {segment.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            ) : activeView === "segmented" && resultReady ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                  No materials detected
                </span>
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
