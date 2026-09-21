"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useI18n, translateHrmsLookup } from "@/i18n";

type AddEmployeeModalProps = {
  open: boolean;
  onClose: () => void;
};

const SHIFT_OPTIONS = [
  { value: "morning", label: "Morning Shift" },
  { value: "afternoon", label: "Afternoon Shift" },
  { value: "evening", label: "Evening Shift" },
  { value: "night", label: "Night Shift" },
  { value: "general", label: "General Shift" },
];

const DEPARTMENT_OPTIONS = [
  { value: "it", label: "IT Department" },
  { value: "business", label: "Core Business" },
  { value: "finance", label: "Finance & Legal" },
  { value: "creative", label: "Creative & Growth" },
  { value: "operations", label: "Operations" },
  { value: "customer", label: "Customer Support" },
  { value: "hr", label: "Human Resources" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "fulltime", label: "Full Time" },
  { value: "parttime", label: "Part Time" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

export function AddEmployeeModal({ open, onClose }: AddEmployeeModalProps) {
  const { t, language } = useI18n();
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [joinDate, setJoinDate] = useState("");

  // Shift state
  const [currentShift, setCurrentShift] = useState("");
  const [selectedShifts, setSelectedShifts] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setDepartment("");
    setEmploymentType("");
    setJoinDate("");
    setCurrentShift("");
    setSelectedShifts([]);
  }, [open]);

  const translatedShiftOptions = SHIFT_OPTIONS.map((opt) => ({
    ...opt,
    label: translateHrmsLookup(language, "labels", opt.label),
  }));

  const translatedDepartmentOptions = DEPARTMENT_OPTIONS.map((opt) => ({
    ...opt,
    label: translateHrmsLookup(language, "labels", opt.label),
  }));

  const translatedEmploymentTypeOptions = EMPLOYMENT_TYPE_OPTIONS.map((opt) => ({
    ...opt,
    label: translateHrmsLookup(language, "labels", opt.label),
  }));

  const handleAddShift = () => {
    if (!currentShift) return;

    const option = translatedShiftOptions.find((o) => o.value === currentShift);
    if (!option) return;

    if (selectedShifts.some((s) => s.value === currentShift)) {
      setCurrentShift("");
      return;
    }

    setSelectedShifts((prev) => [...prev, option]);
    setCurrentShift("");
  };

  const handleRemoveShift = (val: string) => {
    setSelectedShifts((prev) => prev.filter((s) => s.value !== val));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translateHrmsLookup(language, "titles", "Add New Employee Details")}
      subtitle={translateHrmsLookup(language, "labels", "Add employee details to create their profile.")}
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {translateHrmsLookup(language, "actions", "Save & Continue")}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            {t("common.close")}
          </button>
        </>
      }
    >
      <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
        <div className="form-span-full">
          <label className="form-field-label" htmlFor="empFile">
            {translateHrmsLookup(language, "labels", "Upload Employee Image / Documents")}
          </label>
          <input id="empFile" type="file" className="form-control" multiple />
        </div>

        <div>
          <label className="form-field-label" htmlFor="empId">
            {translateHrmsLookup(language, "labels", "Employee ID")}
          </label>
          <input id="empId" className="form-control" defaultValue="EMP-" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="firstName">
            {translateHrmsLookup(language, "labels", "First Name")}
          </label>
          <input
            id="firstName"
            className="form-control"
            placeholder={translateHrmsLookup(language, "labels", "First name")}
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="lastName">
            {translateHrmsLookup(language, "labels", "Last Name")}
          </label>
          <input
            id="lastName"
            className="form-control"
            placeholder={translateHrmsLookup(language, "labels", "Last name")}
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="email">
            {translateHrmsLookup(language, "labels", "Email ID")}
          </label>
          <input id="email" type="email" className="form-control" placeholder="name@company.com" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="phone">
            {translateHrmsLookup(language, "labels", "Phone No")}
          </label>
          <input id="phone" className="form-control" placeholder="+1 000 000 0000" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="emergency">
            {translateHrmsLookup(language, "labels", "Emergency No")}
          </label>
          <input id="emergency" className="form-control" />
        </div>

        <div className="form-span-full">
          <p className="form-field-label">
            {translateHrmsLookup(language, "labels", "Employee Gender")}
          </p>
          <div className="radio-row">
            {["Female", "Male", "Other"].map((g) => (
              <label key={g} className="check-label">
                <input type="radio" name="gender" /> {translateHrmsLookup(language, "labels", g)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-span-2">
          <label className="form-field-label" htmlFor="address">
            {translateHrmsLookup(language, "labels", "Address")}
          </label>
          <textarea id="address" className="form-control" rows={2} />
        </div>
        <div>
          <label className="form-field-label" htmlFor="joinDate">
            {translateHrmsLookup(language, "headers", "Joining Date")}
          </label>
          <DatePicker
            id="joinDate"
            name="joinDate"
            value={joinDate}
            onChange={setJoinDate}
            placeholder="dd-mm-yyyy"
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="jobTitle">
            {translateHrmsLookup(language, "headers", "Job Title")}
          </label>
          <input id="jobTitle" className="form-control" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="department">
            {translateHrmsLookup(language, "headers", "Department")}
          </label>
          <SearchableSelect
            id="department"
            name="department"
            value={department}
            onChange={setDepartment}
            placeholder={translateHrmsLookup(language, "labels", "Select Department")}
            searchPlaceholder={translateHrmsLookup(language, "labels", "Search department...")}
            options={translatedDepartmentOptions}
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="empType">
            {translateHrmsLookup(language, "headers", "Employment Type")}
          </label>
          <SearchableSelect
            id="empType"
            name="empType"
            value={employmentType}
            onChange={setEmploymentType}
            placeholder={translateHrmsLookup(language, "labels", "Select Employment Type")}
            searchPlaceholder={translateHrmsLookup(language, "labels", "Search employment type...")}
            options={translatedEmploymentTypeOptions}
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="manager">
            {translateHrmsLookup(language, "labels", "Reporting Manager")}
          </label>
          <input id="manager" className="form-control" />
        </div>

        {/* SHIFT SELECTION SECTION */}
        <div>
          <label className="form-field-label" htmlFor="shift">
            {translateHrmsLookup(language, "labels", "Shift Time")}
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                id="shift"
                name="shift"
                value={currentShift}
                onChange={setCurrentShift}
                placeholder={translateHrmsLookup(language, "labels", "Select Shift")}
                searchPlaceholder={translateHrmsLookup(language, "labels", "Search shift...")}
                options={translatedShiftOptions}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleAddShift}
              disabled={!currentShift}
            >
              {translateHrmsLookup(language, "actions", "Add")}
            </button>
          </div>
          {selectedShifts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedShifts.map((shift) => (
                <span
                  key={shift.value}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--hrms-primary-50)] text-[var(--hrms-primary-700)] rounded-full text-sm font-medium border border-[var(--hrms-primary-200)]"
                >
                  {shift.label}
                  <button
                    type="button"
                    onClick={() => handleRemoveShift(shift.value)}
                    className="hover:bg-[var(--hrms-primary-100)] rounded-full p-0.5 transition-colors text-[var(--hrms-primary-600)]"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="form-field-label">
            {translateHrmsLookup(language, "labels", "Work Model")}
          </p>
          <div className="radio-row">
            {["On-site", "Hybrid", "Remote"].map((m) => (
              <label key={m} className="check-label">
                <input type="radio" name="workModel" /> {translateHrmsLookup(language, "labels", m)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="form-field-label">
            {translateHrmsLookup(language, "labels", "Asset Allocation")}
          </p>
          <div className="radio-row">
            {["Laptop", "Mouse", "Headset", "Other"].map((a) => (
              <label key={a} className="check-label">
                <input type="checkbox" /> {translateHrmsLookup(language, "labels", a)}
              </label>
            ))}
          </div>
        </div>
        <div className="form-span-full">
          <label className="form-field-label" htmlFor="skills">
            {translateHrmsLookup(language, "labels", "Skills")}
          </label>
          <textarea id="skills" className="form-control" rows={2} />
        </div>
      </form>
    </Modal>
  );
}

