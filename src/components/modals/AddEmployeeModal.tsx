"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

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

export function AddEmployeeModal({ open, onClose }: AddEmployeeModalProps) {
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [joinDate, setJoinDate] = useState("");
  
  // Shift state
  const [currentShift, setCurrentShift] = useState("");
  const [selectedShifts, setSelectedShifts] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    if (!open) return;
    setDepartment("");
    setEmploymentType("");
    setJoinDate("");
    setCurrentShift("");
    setSelectedShifts([]);
  }, [open]);

  const handleAddShift = () => {
    if (!currentShift) return;
    
    // Find label
    const option = SHIFT_OPTIONS.find((o) => o.value === currentShift);
    if (!option) return;

    // Check if already added
    if (selectedShifts.some((s) => s.value === currentShift)) {
      setCurrentShift("");
      return; // Already added
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
      title="Add New Employee Details"
      subtitle="Add employee details to create their profile."
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Save & Continue
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
        <div className="form-span-full">
          <label className="form-field-label" htmlFor="empFile">
            Upload Employee Image / Documents
          </label>
          <input id="empFile" type="file" className="form-control" multiple />
        </div>

        <div>
          <label className="form-field-label" htmlFor="empId">
            Employee ID
          </label>
          <input id="empId" className="form-control" defaultValue="EMP-" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="firstName">
            First Name
          </label>
          <input id="firstName" className="form-control" placeholder="First name" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="lastName">
            Last Name
          </label>
          <input id="lastName" className="form-control" placeholder="Last name" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="email">
            Email ID
          </label>
          <input id="email" type="email" className="form-control" placeholder="name@company.com" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="phone">
            Phone No
          </label>
          <input id="phone" className="form-control" placeholder="+1 000 000 0000" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="emergency">
            Emergency No
          </label>
          <input id="emergency" className="form-control" />
        </div>

        <div className="form-span-full">
          <p className="form-field-label">Employee Gender</p>
          <div className="radio-row">
            {["Female", "Male", "Other"].map((g) => (
              <label key={g} className="check-label">
                <input type="radio" name="gender" /> {g}
              </label>
            ))}
          </div>
        </div>

        <div className="form-span-2">
          <label className="form-field-label" htmlFor="address">
            Address
          </label>
          <textarea id="address" className="form-control" rows={2} />
        </div>
        <div>
          <label className="form-field-label" htmlFor="joinDate">
            Joining Date
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
            Job Title
          </label>
          <input id="jobTitle" className="form-control" />
        </div>
        <div>
          <label className="form-field-label" htmlFor="department">
            Department
          </label>
          <SearchableSelect
            id="department"
            name="department"
            value={department}
            onChange={setDepartment}
            placeholder="Select Department"
            searchPlaceholder="Search department..."
            options={[
              { value: "it", label: "IT Department" },
              { value: "business", label: "Core Business" },
              { value: "finance", label: "Finance & Legal" },
              { value: "creative", label: "Creative & Growth" },
              { value: "operations", label: "Operations" },
              { value: "customer", label: "Customer Support" },
              { value: "hr", label: "Human Resources" },
            ]}
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="empType">
            Employment Type
          </label>
          <SearchableSelect
            id="empType"
            name="empType"
            value={employmentType}
            onChange={setEmploymentType}
            placeholder="Select Employment Type"
            searchPlaceholder="Search employment type..."
            options={[
              { value: "fulltime", label: "Full Time" },
              { value: "parttime", label: "Part Time" },
              { value: "internship", label: "Internship" },
              { value: "freelance", label: "Freelance" },
            ]}
          />
        </div>
        <div>
          <label className="form-field-label" htmlFor="manager">
            Reporting Manager
          </label>
          <input id="manager" className="form-control" />
        </div>
        
        {/* SHIFT SELECTION SECTION */}
        <div>
          <label className="form-field-label" htmlFor="shift">
            Shift Time
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                id="shift"
                name="shift"
                value={currentShift}
                onChange={setCurrentShift}
                placeholder="Select Shift"
                searchPlaceholder="Search shift..."
                options={SHIFT_OPTIONS}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleAddShift}
              disabled={!currentShift}
            >
              Add
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
          <p className="form-field-label">Work Model</p>
          <div className="radio-row">
            {["On-site", "Hybrid", "Remote"].map((m) => (
              <label key={m} className="check-label">
                <input type="radio" name="workModel" /> {m}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="form-field-label">Asset Allocation</p>
          <div className="radio-row">
            {["Laptop", "Mouse", "Headset", "Other"].map((a) => (
              <label key={a} className="check-label">
                <input type="checkbox" /> {a}
              </label>
            ))}
          </div>
        </div>
        <div className="form-span-full">
          <label className="form-field-label" htmlFor="skills">
            Skills
          </label>
          <textarea id="skills" className="form-control" rows={2} />
        </div>
      </form>
    </Modal>
  );
}
