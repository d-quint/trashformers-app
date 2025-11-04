"use client";

import { Pie, PieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type MaterialData = {
  label: string;
  value: number;
  color: string;
};

export function MaterialPieChart({ data }: { data: MaterialData[] }) {
  // Transform data for recharts
  const chartData = data
    .filter((item) => item.value > 0)
    .map((item) => ({
      material: item.label.toLowerCase(),
      items: item.value,
      fill: item.color,
    }));

  const chartConfig = data.reduce(
    (acc, item) => {
      acc[item.label.toLowerCase()] = {
        label: item.label,
        color: item.color,
      };
      return acc;
    },
    { items: { label: "Items" } } as ChartConfig,
  );

  if (chartData.length === 0) {
    return (
      <div className="flex aspect-square max-h-[250px] items-center justify-center rounded-lg border border-white/8 bg-black/20">
        <div className="text-center">
          <div className="mx-auto mb-2 h-16 w-16 rounded-full border-4 border-dashed border-white/10" />
          <p className="text-xs text-slate-500">Upload a photo to see distribution</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie data={chartData} dataKey="items" nameKey="material" label />
      </PieChart>
    </ChartContainer>
  );
}
