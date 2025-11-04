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

type ResultCounts = {
  total: number;
  plastic: number;
  paper: number;
  metal: number;
};

const MOCK_RESULT: ResultCounts = {
  total: 9,
  plastic: 4,
  paper: 3,
  metal: 2,
};

const SEGMENT_OVERLAYS = [
  {
    label: "Plastic",
    color: "from-emerald-400/70 via-emerald-400/25 to-emerald-300/25",
    style: { top: "10%", left: "6%", width: "52%", height: "38%" },
  },
  {
    label: "Paper",
    color: "from-sky-400/70 via-sky-400/25 to-cyan-300/25",
    style: { top: "48%", left: "32%", width: "46%", height: "36%" },
  },
  {
    label: "Metal",
    color: "from-amber-400/70 via-amber-400/25 to-amber-300/25",
    style: { top: "24%", left: "58%", width: "28%", height: "24%" },
  },
];

// Layout: header followed by a three-column grid (capture/workflow | preview | summary).
export default function Home() {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [segmentedSrc, setSegmentedSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResultCounts | null>(null);
  const [activeView, setActiveView] = useState<"original" | "segmented">("segmented");
  const [assetName, setAssetName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const resetTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const bootstrapProcessing = useCallback(
    (source?: string | null) => {
      setProcessing(true);
      setResult(null);
      setProgress(12);
      resetTimers();

      const timeline = [
        setTimeout(() => setProgress(36), 300),
        setTimeout(() => setProgress(58), 700),
        setTimeout(() => setProgress(83), 1100),
      ];

      timersRef.current = timeline;

      const completion = setTimeout(() => {
        setProcessing(false);
        setProgress(100);
        setResult(MOCK_RESULT);
        setSegmentedSrc((value) => value ?? source ?? previewSrc ?? null);
      }, 1500);

      timersRef.current.push(completion);
    },
    [previewSrc, resetTimers],
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
      bootstrapProcessing(dataUrl);
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
    if (!previewSrc) return;
    bootstrapProcessing(previewSrc);
  }, [bootstrapProcessing, previewSrc]);

  const handleReset = useCallback(() => {
    resetTimers();
    setPreviewSrc(null);
    setSegmentedSrc(null);
    setProcessing(false);
    setProgress(0);
    setResult(null);
    setAssetName("");
  }, [resetTimers]);

  const steps = useMemo<WorkflowStep[]>(() => {
    const hasPhoto = Boolean(previewSrc);
    const hasResult = Boolean(result);

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
  }, [previewSrc, processing, result]);

  const totals = useMemo(
    () => ({
      total: result?.total ?? 0,
      plastic: result?.plastic ?? 0,
      paper: result?.paper ?? 0,
      metal: result?.metal ?? 0,
    }),
    [result],
  );

  const materialBreakdown = useMemo(
    () => [
      { label: "Plastic", value: totals.plastic, chip: "bg-emerald-400" },
      { label: "Paper", value: totals.paper, chip: "bg-sky-400" },
      { label: "Metal", value: totals.metal, chip: "bg-amber-400" },
    ],
    [totals.metal, totals.paper, totals.plastic],
  );

  const summaryStatus = result ? "updated" : previewSrc ? "processing" : "waiting";

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
              hasResult={Boolean(result)}
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
            />
            <WorkflowPanel steps={steps} className="lg:sticky lg:top-8" />
          </div>

          <PreviewStage
            activeView={activeView}
            onViewChange={setActiveView}
            overlays={SEGMENT_OVERLAYS}
            previewSrc={previewSrc}
            resultReady={Boolean(result)}
            segmentedSrc={segmentedSrc}
            className="order-1 lg:order-2"
          />

          <MaterialSummary
            breakdown={materialBreakdown}
            status={summaryStatus}
            total={totals.total}
            className="order-3 xl:sticky xl:top-8"
          />
        </main>
      </div>
    </div>
  );
}
