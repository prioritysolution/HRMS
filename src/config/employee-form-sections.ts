import type { FormSection } from "@/types/hrms";

type SelectOption = { value: string; label: string };

function toSelectOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export const EMPLOYEE_APPL_OPTION_FALLBACKS = {
  gender: toSelectOptions(["Male", "Female", "Transgender", "Not Specified"]),
  bloodGroup: toSelectOptions(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  maritalStatus: toSelectOptions(["Single", "Married", "Divorced", "Widowed"]),
} as const;
const departmentOptions = ["IT", "HR", "Finance", "Operations", "Design", "Engineering"];
const designationOptions = ["Manager", "Executive", "Analyst", "Senior Developer", "HR Executive"];
const branchOptions = ["Head Office", "Branch 1", "Branch 2"];
const employmentTypeOptions = ["Full Time", "Part Time", "Contract", "Internship"];
const gradeOptions = ["Grade A", "Grade B", "Grade C"];
const shiftOptions = ["General Shift", "Night Shift", "Flexible"];
const employmentStatusOptions = ["Active", "Inactive", "Probation", "On Leave"];

export const EMPLOYEE_FORM_SECTIONS: FormSection[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic identity and contact details for the employee.",
    fields: [
      // {
      //   name: "Org_Id",
      //   label: "Organization",
      //   type: "select",
      //   required: true,
      // },
      { name: "Employee_code", label: "Employee ID", required: true, placeholder: "EMP-1001", hideOnCreate: true, readOnlyOnEdit: true },
      { name: "First_name", label: "First Name", required: true, minLength: 2, maxLength: 50, pattern: /^[A-Za-z\s]+$/, patternMessage: "Only letters and spaces are allowed." },
      { name: "Middle_name", label: "Middle Name", maxLength: 50, pattern: /^[A-Za-z\s]*$/, patternMessage: "Only letters and spaces are allowed." },
      { name: "Last_name", label: "Last Name", required: true, minLength: 1, maxLength: 50, pattern: /^[A-Za-z\s]+$/, patternMessage: "Only letters and spaces are allowed." },
      {
        name: "Photo",
        label: "Photograph",
        type: "file",
        span: "full",
        accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
        maxSizeMb: 2,
        previewKey: "Photo_path",
        fileNameKey: "Photo_path",
        hint: "JPG, PNG, WEBP · max 2 MB",
      },
      { name: "Date_of_birth", label: "Date of Birth", type: "date" },
      { name: "Gender", label: "Gender", type: "select" },
      { name: "Blood_group", label: "Blood Group", type: "select" },
      {
        name: "Marital_status",
        label: "Marital Status",
        type: "select",
      },
      { name: "Father_name", label: "Father's Name" },
      { name: "Mother_name", label: "Mother's Name" },
      { name: "Spouse_name", label: "Spouse's Name" },
      { name: "Mobile", label: "Mobile Number", type: "tel", required: true, pattern: /^\d{10}$/, patternMessage: "Mobile number must be exactly 10 digits." },
      { name: "Email", label: "Email", type: "email", required: true },
      { name: "Address_line1", label: "Address Line 1", span: "full" },
      { name: "Address_line2", label: "Address Line 2", span: "full" },
      { name: "City", label: "City" },
      { name: "State", label: "State" },
      { name: "Pincode", label: "Pincode", pattern: /^\d{6}$/, patternMessage: "Pincode must be exactly 6 digits." },
      { name: "Emergency_contact", label: "Emergency Contact", type: "tel", pattern: /^\d{10}$/, patternMessage: "Emergency contact must be exactly 10 digits." },
    ],
  },
  {
    id: "bank",
    title: "Bank Details",
    description: "Salary account information for payroll processing.",
    fields: [
      { name: "Bank_name", label: "Bank Name" },
      { name: "Account_number", label: "Account Number", pattern: /^\d{9,18}$/, patternMessage: "Account number must be between 9 and 18 digits." },
      { name: "IFSC_code", label: "IFSC", pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, patternMessage: "Invalid IFSC code format." },
      { name: "Bank_branch", label: "Branch" },
      {
        name: "Account_type",
        label: "Account Type",
        type: "select",
        options: ["Savings", "Current", "Salary"]
      }, // <-- Added field
      { name: "Account_holder_name", label: "Account Holder Name", span: "full" },
    ],
  },
];
