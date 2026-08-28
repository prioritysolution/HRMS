"use client";

import Image from "next/image";
import { Mail, Phone, UserRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SoftStatus } from "@/components/ui/DataTable";

export type EmployeeProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  type: string;
  joinDate: string;
  avatar: string;
};

type EmployeeProfileModalProps = {
  open: boolean;
  onClose: () => void;
  employee: EmployeeProfile | null;
};

export function EmployeeProfileModal({
  open,
  onClose,
  employee,
}: EmployeeProfileModalProps) {
  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee Details"
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Edit Profile
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="profile-modal-grid">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src={employee.avatar}
              alt={employee.name}
              width={72}
              height={72}
              className="rounded-full object-cover"
            />
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="m-0 text-lg font-bold">{employee.name}</h3>
                <SoftStatus value={employee.status} />
              </div>
              <span className="badge bg-soft-primary">{employee.role}</span>
            </div>
          </div>
          <hr className="br-dashed" />
          <h4 className="mb-3 mt-4 text-base font-bold">Personal Information</h4>
          {[
            { label: "Full name", value: employee.name, icon: UserRound },
            { label: "Email", value: employee.email, icon: Mail },
            { label: "Employee ID", value: employee.id, icon: Phone },
          ].map((item) => (
            <div
              key={item.label}
              className="mb-2 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 text-muted">
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="mb-3 text-base font-bold">Work Information</h4>
          {[
            ["Department", employee.department],
            ["Employment Type", employee.type],
            ["Joining Date", employee.joinDate],
            ["Status", employee.status],
          ].map(([label, value]) => (
            <div
              key={label}
              className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--card-soft)] p-3"
            >
              <div className="text-xs text-muted">{label}</div>
              <div className="mt-1 font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
