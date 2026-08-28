"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type AddEmployeeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddEmployeeModal({ open, onClose }: AddEmployeeModalProps) {
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [joinDate, setJoinDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setDepartment("");
    setEmploymentType("");
    setJoinDate("");
  }, [open]);

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
        <div>
          <label className="form-field-label" htmlFor="shift">
            Shift Time
          </label>
          <input id="shift" type="time" className="form-control" />
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
