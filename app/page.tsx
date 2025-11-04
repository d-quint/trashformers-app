"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CapturePanel } from "@/components/capture-panel";
import { MaterialSummary } from "@/components/material-summary";
import { PageHeader } from "@/components/page-header";
import { PreviewStage } from "@/components/preview-stage";
import { WorkflowPanel } from "@/components/workflow-panel";
import type { WorkflowStep } from "@/types/workflow";

type SegmentOverlay = {
  id: number;
  label: string;
  confidence: number;
  polygon: Array<[number, number]>;
  boundingBox?: number[] | null;
  fillColor: string;
  strokeColor: string;
};

type ImageSize = { width: number; height: number } | null;

const MATERIAL_META: Record<string, { chip: string; pieColor: string; overlay: string; stroke: string }> = {
  Plastic: {
    chip: "bg-emerald-400",
    pieColor: "hsl(158 64% 52%)",
    overlay: "hsla(158, 64%, 52%, 0.32)",
    stroke: "hsla(158, 64%, 52%, 0.75)",
  },
  Paper: {
    chip: "bg-sky-400",
    pieColor: "hsl(199 89% 48%)",
    overlay: "hsla(199, 89%, 48%, 0.32)",
    stroke: "hsla(199, 89%, 48%, 0.75)",
  },
  Metal: {
    chip: "bg-amber-400",
    pieColor: "hsl(38 92% 50%)",
    overlay: "hsla(38, 92%, 50%, 0.32)",
    stroke: "hsla(38, 92%, 50%, 0.75)",
  },
  Glass: {
    chip: "bg-cyan-400",
    pieColor: "hsl(189 79% 56%)",
    overlay: "hsla(189, 79%, 56%, 0.32)",
    stroke: "hsla(189, 79%, 56%, 0.75)",
  },
  Organic: {
    chip: "bg-lime-400",
    pieColor: "hsl(90 70% 50%)",
    overlay: "hsla(90, 70%, 50%, 0.32)",
    stroke: "hsla(90, 70%, 50%, 0.75)",
  },
};

const DEFAULT_META = {
  chip: "bg-fuchsia-400",
  pieColor: "hsl(286 65% 60%)",
  overlay: "hsla(286, 65%, 60%, 0.32)",
  stroke: "hsla(286, 65%, 60%, 0.75)",
};

const KNOWN_LABELS = ["Plastic", "Paper", "Metal"] as const;
type KnownLabel = (typeof KNOWN_LABELS)[number];

const createEmptyCounts = (): Record<KnownLabel, number> => ({
  Plastic: 0,
  Paper: 0,
  Metal: 0,
});

const normalizeLabel = (label: string): KnownLabel | null => {
  const value = label.trim().toLowerCase();
  switch (value) {
    case "plastic":
      return "Plastic";
    case "paper":
      return "Paper";
    case "metal":
      return "Metal";
    default:
      return null;
  }
};

// Layout: header followed by a three-column grid (capture/workflow | preview | summary).
export default function Home() {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [segmentedSrc, setSegmentedSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState<Record<KnownLabel, number>>(() => createEmptyCounts());
  const [resultReady, setResultReady] = useState(false);
  const [activeView, setActiveView] = useState<"original" | "segmented">("segmented");
  const [assetName, setAssetName] = useState<string>("");
  const [segments, setSegments] = useState<SegmentOverlay[]>([]);
  const [imageSize, setImageSize] = useState<ImageSize>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const fileBlobRef = useRef<File | null>(null);

  const resetTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const fetchSegmentation = useCallback(async (file: File) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (!apiBase) {
      throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${apiBase}/segment`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as {
      filename: string;
      image_size?: { width: number; height: number } | null;
      segments?: Array<{
        id: number;
        label: string;
        confidence: number;
        polygon: Array<[number, number]>;
        bounding_box?: number[] | null;
      }>;
      counts?: Record<string, number>;
    };
  }, []);

  const bootstrapProcessing = useCallback(
    async (file: File, source?: string | null) => {
      setProcessing(true);
      setProgress(12);
      setResultReady(false);
      setCounts(createEmptyCounts());
      setSegments([]);
      setImageSize(null);
      setError(null);
      resetTimers();

      const timeline = [
        setTimeout(() => setProgress(36), 250),
        setTimeout(() => setProgress(58), 650),
        setTimeout(() => setProgress(83), 1100),
      ];

      timersRef.current = timeline;

      try {
        const data = await fetchSegmentation(file);
        const normalizedCounts = createEmptyCounts();
        const providedCounts = data.counts ?? {};

        if (Object.keys(providedCounts).length > 0) {
          for (const [rawLabel, value] of Object.entries(providedCounts)) {
            const normalized = normalizeLabel(rawLabel);
            if (normalized) {
              const numericValue = Number(value);
              const safeValue = Number.isFinite(numericValue) ? Math.max(0, Math.round(numericValue)) : 0;
              normalizedCounts[normalized] += safeValue;
            }
          }
        } else if (Array.isArray(data.segments)) {
          for (const segment of data.segments) {
            const normalized = normalizeLabel(segment.label);
            if (normalized) {
              normalizedCounts[normalized] += 1;
            }
          }
        }

        setCounts(normalizedCounts);
        setResultReady(true);
        setProgress(100);

        if (data.image_size) {
          setImageSize(data.image_size);
        }

        if (Array.isArray(data.segments)) {
          setSegments(
            data.segments.map((segment) => {
              const normalized = normalizeLabel(segment.label);
              const labelForDisplay = normalized ?? segment.label;
              const materialMeta = MATERIAL_META[labelForDisplay] ?? DEFAULT_META;

              return {
                id: segment.id,
                label: labelForDisplay,
                confidence: segment.confidence,
                polygon: segment.polygon ?? [],
                boundingBox: segment.bounding_box ?? null,
                fillColor: materialMeta.overlay,
                strokeColor: materialMeta.stroke,
              };
            }),
          );
        }

        setSegmentedSrc((value) => value ?? source ?? previewSrc ?? null);
      } catch (exc: unknown) {
        const message = exc instanceof Error ? exc.message : "Segmentation failed.";
        setError(message);
        setCounts(createEmptyCounts());
        setResultReady(false);
        setProgress(0);
      } finally {
        resetTimers();
        setProcessing(false);
      }
    },
    [fetchSegmentation, previewSrc, resetTimers],
  );

  const handleFileLoad = useCallback(
    async (file: File) => {
      const reader = new FileReader();

      const filePromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      reader.readAsDataURL(file);

      const dataUrl = await filePromise;

      setPreviewSrc(dataUrl);
      setSegmentedSrc(null);
      setAssetName(file.name);
      setActiveView("segmented");
      if (typeof window !== "undefined") {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = dataUrl;
      }
      fileBlobRef.current = file;
      void bootstrapProcessing(file, dataUrl);
    },
    [bootstrapProcessing],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      void handleFileLoad(file);
      event.target.value = "";
    },
    [handleFileLoad],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      void handleFileLoad(file);
    },
    [handleFileLoad],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleProcess = useCallback(() => {
    if (!fileBlobRef.current) return;
    void bootstrapProcessing(fileBlobRef.current, previewSrc);
  }, [bootstrapProcessing, previewSrc]);

  const handleReset = useCallback(() => {
    resetTimers();
    setPreviewSrc(null);
    setSegmentedSrc(null);
    setProcessing(false);
    setProgress(0);
    setCounts(createEmptyCounts());
    setResultReady(false);
    setSegments([]);
    setImageSize(null);
    setError(null);
    fileBlobRef.current = null;
    setAssetName("");
  }, [resetTimers]);

  const steps = useMemo<WorkflowStep[]>(() => {
    const hasPhoto = Boolean(previewSrc);
    const hasResult = resultReady;

    return [
      {
        label: "Add photo",
        helper: hasPhoto ? "Photo ready" : "Snap a quick shot or upload",
        status: hasPhoto ? "done" : "current",
      },
      {
        label: "Segment",
        helper: processing
          ? "Finding materials..."
          : hasResult
            ? "Segmentation complete"
            : hasPhoto
              ? "Starts automatically"
              : "Waiting for a photo",
        status: processing ? "current" : hasResult ? "done" : hasPhoto ? "current" : "idle",
      },
      {
        label: "Review",
        helper: hasResult ? "See colors & counts" : "Results appear instantly",
        status: hasResult ? "current" : "idle",
      },
    ];
  }, [previewSrc, processing, resultReady]);

  const totals = useMemo(() => Object.values(counts).reduce((acc, value) => acc + value, 0), [counts]);

  const materialBreakdown = useMemo(() => {
    return KNOWN_LABELS.map((label) => {
      const meta = MATERIAL_META[label] ?? DEFAULT_META;
      return {
        label,
        value: counts[label] ?? 0,
        chip: meta.chip,
        color: meta.pieColor,
      };
    });
  }, [counts]);

  const summaryStatus = resultReady ? "updated" : processing ? "processing" : previewSrc ? "waiting" : "waiting";

  useEffect(() => () => resetTimers(), [resetTimers]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-6 right-0 h-64 w-64 rounded-full bg-sky-500/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-5 pb-16 pt-10 sm:px-6 lg:px-10">
        <PageHeader />

  <main className="mt-8 grid gap-5 lg:grid-cols-[22rem_1fr] lg:gap-6 xl:grid-cols-[22rem_1fr_20rem]">
          <div className="order-2 space-y-5 lg:order-1">
            <CapturePanel
              assetName={assetName}
              captureInputRef={captureInputRef}
              fileInputRef={fileInputRef}
              hasResult={resultReady}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              onProcess={handleProcess}
              onReset={handleReset}
              onStartCapture={() => captureInputRef.current?.click()}
              onStartUpload={() => fileInputRef.current?.click()}
              previewSrc={previewSrc}
              processing={processing}
              progress={progress}
              error={error}
            />
            <WorkflowPanel steps={steps} className="lg:sticky lg:top-8" />
          </div>

          <PreviewStage
            activeView={activeView}
            onViewChange={setActiveView}
            segments={segments}
            previewSrc={previewSrc}
            resultReady={resultReady}
            segmentedSrc={segmentedSrc}
            imageSize={imageSize}
            className="order-1 lg:order-2"
          />

          <MaterialSummary
            breakdown={materialBreakdown}
            status={summaryStatus}
            total={totals}
            className="order-3 xl:sticky xl:top-8"
          />
        </main>
      </div>
    </div>
  );
}
