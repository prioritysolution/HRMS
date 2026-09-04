"use client";

import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  categories?: string[];
  data?: number[];
};

const BAR_PALETTE = ["#5b6cff", "#7c6cf0", "#4f8df7", "#6f5fe0", "#3d9cf0", "#8b7cf5"];

export function DepartmentCountChart({
  categories = [],
  data = [],
}: Props) {
  const totalEmployees = data.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...data, 0);
  const xMax = Math.max(Math.ceil(maxValue * 1.25), 1);
  const chartHeight = Math.max(220, Math.min(420, 72 + categories.length * 48));

  return (
    <div className="card h-full">
      <div className="card-body">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h5 className="card-title mb-1">Employee Count by Department</h5>
            <small className="text-muted">Headcount distribution across departments</small>
          </div>
          {categories.length > 0 ? (
            <span className="badge bg-soft-primary px-2.5 py-1 text-[0.75rem] font-semibold">
              {totalEmployees} total
            </span>
          ) : null}
        </div>

        {categories.length === 0 ? (
          <p className="text-muted mb-0">No department data available.</p>
        ) : (
          <Chart
            type="bar"
            height={chartHeight}
            width="100%"
            options={{
              chart: {
                type: "bar",
                toolbar: { show: false },
                fontFamily: "Nunito, sans-serif",
                parentHeightOffset: 0,
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  borderRadius: 6,
                  borderRadiusApplication: "end",
                  barHeight: categories.length <= 3 ? "42%" : "58%",
                  distributed: true,
                  dataLabels: { position: "top" },
                },
              },
              dataLabels: {
                enabled: true,
                offsetX: 10,
                textAnchor: "start",
                formatter: (val: number) => String(val),
                style: {
                  fontSize: "12px",
                  fontWeight: 700,
                  colors: ["#3d4468"],
                },
                background: {
                  enabled: true,
                  foreColor: "#3d4468",
                  borderRadius: 4,
                  padding: 4,
                  opacity: 1,
                  borderWidth: 0,
                  dropShadow: { enabled: false },
                },
              },
              legend: { show: false },
              grid: {
                show: true,
                borderColor: "#eef0f6",
                strokeDashArray: 4,
                xaxis: { lines: { show: true } },
                yaxis: { lines: { show: false } },
                padding: { top: 0, right: 28, bottom: 0, left: 4 },
              },
              xaxis: {
                categories,
                min: 0,
                max: xMax,
                tickAmount: Math.min(5, xMax),
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                  show: true,
                  style: {
                    colors: "#8b90a8",
                    fontSize: "11px",
                    fontWeight: 600,
                  },
                  formatter: (val: string) => String(Math.round(Number(val))),
                },
              },
              yaxis: {
                labels: {
                  maxWidth: 140,
                  style: {
                    colors: "#4a5170",
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                },
              },
              tooltip: {
                theme: "light",
                y: {
                  formatter: (val: number) =>
                    `${val} employee${val === 1 ? "" : "s"}`,
                },
              },
              colors: categories.map((_, index) => BAR_PALETTE[index % BAR_PALETTE.length]),
              states: {
                hover: {
                  filter: { type: "darken" },
                },
              },
            }}
            series={[{ name: "Employees", data }]}
          />
        )}
      </div>
    </div>
  );
}
