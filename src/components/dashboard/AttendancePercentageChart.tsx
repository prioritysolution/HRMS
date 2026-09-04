"use client";

import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  categories?: string[];
  data?: number[];
};

export function AttendancePercentageChart({
  categories = [],
  data = [],
}: Props) {
  return (
    <div className="card h-full dash-attendance-card">
      <div className="card-body dash-attendance-body">
        <h5 className="card-title mb-3">Attendance Percentage</h5>
        <div className="dash-attendance-chart">
          <Chart
            type="area"
            height="100%"
            width="100%"
            options={{
              chart: {
                type: "area",
                toolbar: { show: false },
                fontFamily: "Nunito, sans-serif",
                parentHeightOffset: 0,
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
                padding: { left: 8, right: 8 },
              },
              xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: {
                min: 0,
                max: 100,
                tickAmount: 5,
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
            series={[{ name: "Attendance", data }]}
          />
        </div>
      </div>
    </div>
  );
}
