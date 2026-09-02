"use client";

import dynamic from "next/dynamic";
import { leaveUtilizationLabels, leaveUtilizationData } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function LeaveUtilizationChart() {
  return (
    <div className="card h-full">
      <div className="card-body">
        <h5 className="card-title mb-4">Leave Utilization</h5>
        <Chart
          type="donut"
          height={320}
          width="100%"
          options={{
            chart: {
              type: "donut",
              fontFamily: "Nunito, sans-serif",
            },
            labels: leaveUtilizationLabels,
            colors: ["#ff9f43", "#ea5455", "#7367f0", "#28c76f"],
            dataLabels: {
              enabled: true,
              formatter: (val: number) => `${val.toFixed(0)}%`,
            },
            plotOptions: {
              pie: {
                donut: {
                  size: "70%",
                  labels: {
                    show: true,
                    name: { fontSize: "14px" },
                    value: {
                      fontSize: "24px",
                      fontWeight: 700,
                      formatter: (val: string) => `${val}`,
                    },
                    total: {
                      show: true,
                      label: "Total Leaves",
                      formatter: (w: any) => {
                        return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                      },
                    },
                  },
                },
              },
            },
            legend: {
              position: "bottom",
              horizontalAlign: "center",
            },
            stroke: { show: false },
          }}
          series={leaveUtilizationData}
        />
      </div>
    </div>
  );
}
