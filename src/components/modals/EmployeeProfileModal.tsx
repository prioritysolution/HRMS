"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, UserRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SoftStatus } from "@/components/ui/DataTable";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { resolvePublicFileUrl } from "@/lib/env";

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
  const { t, language } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);
  const avatarSrc = employee?.avatar
    ? resolvePublicFileUrl(employee.avatar, "storage/employees/photos")
    : "";

  useEffect(() => {
    setImgFailed(false);
  }, [avatarSrc]);

  if (!employee) return null;

  const initials = (employee.name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translateHrmsLookup(language, "titles", "Employee Profile")}
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {translateHrmsLookup(language, "actions", "Edit Profile")}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            {t("common.close")}
          </button>
        </>
      }
    >
      <div className="profile-modal-grid">
        <div>
          <div className="mb-4 flex items-center gap-3">
            {avatarSrc && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={employee.name}
                width={72}
                height={72}
                className="w-[72px] h-[72px] rounded-full object-cover ring-2 ring-[var(--border)] flex-shrink-0"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-soft-primary text-primary flex items-center justify-center font-bold text-2xl ring-2 ring-[var(--border)] flex-shrink-0">
                {initials}
              </div>
            )}
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="m-0 text-lg font-bold">{employee.name}</h3>
                <SoftStatus value={employee.status} />
              </div>
              <span className="badge bg-soft-primary">
                {translateHrmsLookup(language, "labels", employee.role)}
              </span>
            </div>
          </div>
          <hr className="br-dashed" />
          <h4 className="mb-3 mt-4 text-base font-bold">
            {translateHrmsLookup(language, "labels", "Personal Information")}
          </h4>
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
                <span>{translateHrmsLookup(language, "labels", item.label)}</span>
              </div>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="mb-3 text-base font-bold">
            {translateHrmsLookup(language, "labels", "Work Information")}
          </h4>
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
              <div className="text-xs text-muted">
                {translateHrmsLookup(language, "headers", label)}
              </div>
              <div className="mt-1 font-semibold">
                {translateHrmsLookup(language, "labels", value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

