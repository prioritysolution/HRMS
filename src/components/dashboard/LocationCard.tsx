"use client";

import { MoreHorizontal } from "lucide-react";
import { locationDistribution } from "@/data/dashboard";

export function LocationCard() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="card-title mb-0">Employees by Location</h5>
          <button type="button" className="card-drop-icon" aria-label="Menu">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="map-wrapper mb-4">
          <div className="map-placeholder">
            <div className="map-dot map-dot-1" />
            <div className="map-dot map-dot-2" />
            <div className="map-dot map-dot-3" />
            <div className="map-dot map-dot-4" />
          </div>
        </div>

        <p className="mb-3">City-wise distribution</p>
        <div className="progress-stacked mb-4">
          {locationDistribution.map((item) => (
            <div
              key={item.label}
              className={`progress-segment bg-${item.tone}`}
              style={{ width: `${item.value}%` }}
            >
              {item.value}%
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {locationDistribution.map((item) => (
            <p key={item.label} className="m-0">
              <span className={`legend-dot text-${item.tone}`}>●</span> {item.label}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
