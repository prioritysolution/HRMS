"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock3, MoreHorizontal } from "lucide-react";
import { activeEmployees } from "@/data/dashboard";

export function ActiveEmployeesCard() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="card-title mb-0">Active Employees</h5>
          <button type="button" className="card-drop-icon" aria-label="Menu">
            <MoreHorizontal size={20} />
          </button>
        </div>
        <ul className="active-emp-list">
          {activeEmployees.map((emp) => (
            <li key={emp.name} className="active-emp-item">
              <div className="flex flex-wrap items-center gap-2">
                <Image
                  src={emp.avatar}
                  alt={emp.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <h6 className="m-0 font-semibold text-[var(--title)]">{emp.name}</h6>
                  <small className="text-muted">{emp.role}</small>
                </div>
              </div>
              <div className="mt-2 sm:mt-0">
                <div className="flex items-center gap-2">
                  <p className="m-0 text-sm text-primary">{emp.mode}</p>
                  <button type="button" className="border-0 bg-transparent p-0 text-[var(--title)]">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <small className="inline-flex items-center gap-1 text-muted">
                  <Clock3 size={12} /> {emp.time}
                </small>
              </div>
            </li>
          ))}
          <li className="active-emp-item border-0 pt-2 text-center">
            <Link href="/employees" className="text-primary font-semibold">
              View All <ChevronRight size={14} className="inline" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
