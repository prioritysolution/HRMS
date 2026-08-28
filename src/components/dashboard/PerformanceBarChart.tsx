"use client";

import dynamic from "next/dynamic";
import {
  performanceBarCategories,
  performanceBarData,
} from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function PerformanceBarChart() {
  return (
    <Chart
      type="bar"
      height={320}
      width="100%"
      options={{
        chart: {
          type: "bar",
          toolbar: { show: false },
          fontFamily: "Nunito, sans-serif",
        },
        plotOptions: {
          bar: {
            columnWidth: "40%",
            borderRadius: 8,
            borderRadiusApplication: "end",
            dataLabels: { position: "top" },
          },
        },
        grid: { show: false, padding: { left: 0, right: 0, top: 0, bottom: -15 } },
        tooltip: { y: { formatter: (val: number) => `${val}%` } },
        stroke: { show: false },
        fill: {
          type: "gradient",
          gradient: {
            type: "vertical",
            shadeIntensity: 1,
            opacityFrom: 1,
            opacityTo: 1,
            colorStops: [
              { offset: 0, color: "#4666e1", opacity: 1 },
              { offset: 50, color: "#6f5fe0", opacity: 1 },
              { offset: 100, color: "#c64ad5", opacity: 1 },
            ],
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -30,
          style: { fontSize: "12px", fontWeight: 600, colors: ["#65688a"] },
          formatter: (val: number) => `${val}%`,
        },
        xaxis: { categories: performanceBarCategories },
        yaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
      }}
      series={[{ name: "Performance", data: performanceBarData }]}
    />
  );
}
