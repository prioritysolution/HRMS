"use client";

import Image from "next/image";
import Link from "next/link";
import { Circle, Star, ThumbsUp } from "lucide-react";
import type { PerformanceRow } from "@/data/dashboard";

function RatingIcon({ type }: { type: PerformanceRow["ratingIcon"] }) {
  if (type === "star") return <Star size={14} className="text-warning fill-current" />;
  if (type === "thumbs") return <ThumbsUp size={14} className="text-warning fill-current" />;
  if (type === "danger") return <Circle size={10} className="text-danger fill-current" />;
  return <Circle size={10} className="text-warning fill-current" />;
}

export function PerformanceTable({
  title,
  rows,
  viewMoreHref = "/reports/employee-performance",
}: {
  title: string;
  rows: PerformanceRow[];
  viewMoreHref?: string;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h5 className="card-title mb-0">{title}</h5>
          <Link href={viewMoreHref} className="btn btn-sm btn-outline rounded-md">
            View More
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table perform-table">
            <thead className="table-light">
              <tr>
                <th className="si-col">SI NO</th>
                <th>Employee ID</th>
                <th>Epmloyee Name</th>
                <th>Job Title</th>
                <th className="text-center">Employment type</th>
                <th className="text-center">KPI score</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className={index === rows.length - 1 ? "last-row" : undefined}>
                  <td className="si-col">{index + 1}</td>
                  <td>{row.id}</td>
                  <td>
                    <div className="user-cell">
                      <Image src={row.avatar} alt={row.name} width={32} height={32} />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td>{row.jobTitle}</td>
                  <td className="text-center">
                    <span
                      className={
                        row.employmentType === "Freelance" || row.employmentType === "Internship"
                          ? "badge bg-soft-secondary"
                          : "badge bg-soft-primary"
                      }
                    >
                      {row.employmentType}
                    </span>
                  </td>
                  <td className="text-center">{row.kpi}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-warning">
                      <RatingIcon type={row.ratingIcon} />
                      {row.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
