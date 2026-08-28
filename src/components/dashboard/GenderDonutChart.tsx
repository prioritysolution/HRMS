"use client";

import dynamic from "next/dynamic";
import { genderRatio } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function GenderDonutChart() {
  return (
    <Chart
      type="donut"
      height={350}
      options={{
        chart: { fontFamily: "Nunito, sans-serif" },
        series: genderRatio.series,
        labels: genderRatio.labels,
        colors: ["#4666e1", "#e17846"],
        legend: {
          position: "top",
          horizontalAlign: "right",
          labels: { colors: "#65688a" },
        },
        stroke: { show: false, width: 0 },
        dataLabels: {
          enabled: true,
          style: { fontSize: "14px", fontWeight: 500, colors: ["#65688a"] },
        },
        plotOptions: {
          pie: {
            donut: {
              size: "65%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Total Employees",
                  fontWeight: 650,
                  color: "#65688a",
                  formatter: (w: { globals: { seriesTotals: number[] } }) =>
                    `${w.globals.seriesTotals.reduce((a, b) => a + b, 0)}%`,
                },
              },
            },
          },
        },
      }}
      series={genderRatio.series}
    />
  );
}
