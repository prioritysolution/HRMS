"use client";

import dynamic from "next/dynamic";
import { satisfactionRadial } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function SatisfactionRadialChart() {
  return (
    <Chart
      type="radialBar"
      height={450}
      options={{
        chart: { fontFamily: "Nunito, sans-serif" },
        series: satisfactionRadial.series,
        labels: satisfactionRadial.labels,
        colors: ["#55b0db", "#e1cd3c", "#28adbb", "#4666e1"],
        plotOptions: {
          radialBar: {
            track: { background: "#eaedf1", opacity: 0.35 },
            hollow: { size: "50%" },
            dataLabels: {
              total: {
                show: true,
                label: "TOTAL",
                color: "#0d2042",
                fontSize: "22px",
                fontWeight: 800,
              },
              value: { color: "#0d2042" },
            },
          },
        },
        legend: {
          show: true,
          position: "bottom",
          horizontalAlign: "center",
          fontSize: "14px",
          labels: { colors: "#65688a" },
        },
        stroke: { lineCap: "round" },
      }}
      series={satisfactionRadial.series}
    />
  );
}
