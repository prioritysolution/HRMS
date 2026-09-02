"use client";

import dynamic from "next/dynamic";
import { attendancePercentageCategories, attendancePercentageData } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function AttendancePercentageChart() {
  return (
    <div className="card h-full">
      <div className="card-body">
        <h5 className="card-title mb-4">Attendance Percentage</h5>
        <Chart
          type="area"
          height={320}
          width="100%"
          options={{
            chart: {
              type: "area",
              toolbar: { show: false },
              fontFamily: "Nunito, sans-serif",
            },
            stroke: {
              curve: "smooth",
              width: 3,
            },
            fill: {
              type: "gradient",
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 90, 100],
              },
            },
            dataLabels: {
              enabled: false,
            },
            grid: {
              borderColor: "#f1f3fa",
              strokeDashArray: 4,
            },
            xaxis: {
              categories: attendancePercentageCategories,
              axisBorder: { show: false },
              axisTicks: { show: false },
            },
            yaxis: {
              min: 0,
              max: 100,
              labels: {
                formatter: (val: number) => `${val}%`,
                style: { colors: "#65688a", fontWeight: 600 },
              },
            },
            tooltip: {
              y: { formatter: (val: number) => `${val}%` },
            },
            colors: ["#20c997"],
          }}
          series={[{ name: "Attendance", data: attendancePercentageData }]}
        />
      </div>
    </div>
  );
}
