"use client";

import { MoreHorizontal } from "lucide-react";
import { employmentTypes } from "@/data/dashboard";

export function EmploymentTypeCard() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="card-title mb-0">Employeement Type</h5>
          <button type="button" className="card-drop-icon" aria-label="Menu">
            <MoreHorizontal size={20} />
          </button>
        </div>
        {employmentTypes.map((item) => (
          <div key={item.label} className="mb-4 last:mb-0">
            <div className="mb-2 flex items-center justify-between">
              <h6 className="m-0 font-semibold">{item.label}</h6>
              <h6 className="m-0 font-semibold text-[var(--title)]">{item.value}%</h6>
            </div>
            <div className="progress rounded-pill">
              <div
                className={`progress-bar bg-${item.tone}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
