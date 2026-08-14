"use client";

import { Chart, ChartData, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import { GensetData } from "@/lib/genset/types";

Chart.register(...registerables);

const MAX_POINTS = 40;

export function LiveChart({ data }: { data: GensetData | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const seriesRef = useRef({
    labels: [] as string[],
    voltage: [] as number[],
    current: [] as number[],
    frequency: [] as number[],
    power: [] as number[],
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const chartData: ChartData<"line"> = {
      labels: [],
      datasets: [
        { label: "Voltage (V)", data: [], yAxisID: "v", pointRadius: 0 },
        { label: "Current (A)", data: [], yAxisID: "c", pointRadius: 0 },
        { label: "Frequency (Hz)", data: [], yAxisID: "c", pointRadius: 0 },
        { label: "Power (W)", data: [], yAxisID: "p", pointRadius: 0 },
      ],
    };
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { ticks: { color: "#64748b" } },
          v: { ticks: { color: "#94a3b8" } },
          c: { position: "right", grid: { drawOnChartArea: false }, ticks: { color: "#94a3b8" } },
          p: { display: false },
        },
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
      },
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const s = seriesRef.current;
    s.labels.push((data.time as string) || new Date().toLocaleTimeString());
    s.voltage.push(Number(data.voltage || 0));
    s.current.push(Number(data.current || 0));
    s.frequency.push(Number(data.frequency || 0));
    s.power.push(Number(data.output_power || 0));
    if (s.labels.length > MAX_POINTS) {
      s.labels.shift();
      s.voltage.shift();
      s.current.shift();
      s.frequency.shift();
      s.power.shift();
    }
    const chart = chartRef.current;
    if (chart) {
      chart.data.labels = s.labels;
      chart.data.datasets[0].data = s.voltage;
      chart.data.datasets[1].data = s.current;
      chart.data.datasets[2].data = s.frequency;
      chart.data.datasets[3].data = s.power;
      chart.update("none");
    }
  }, [data]);

  return <canvas ref={canvasRef} />;
}
