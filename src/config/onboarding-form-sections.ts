import type { FormSection } from "@/types/hrms";

const departmentOptions = ["IT", "HR", "Finance", "Operations", "Design", "Engineering"];
const designationOptions = ["Manager", "Executive", "Analyst", "Senior Developer", "HR Executive"];
const employmentTypeOptions = ["Full Time", "Part Time", "Contract", "Internship"];

export const ONBOARDING_FORM_SECTIONS: FormSection[] = [
  {
    id: "registration",
    title: "Employee Registration",
    description: "Register the new employee with basic profile and employment details.",
    fields: [
      { name: "Employee_id", label: "Employee", type: "select", required: true },
      { name: "Device_user_id", label: "Device ID (Biometric)", type: "number", min: 1 },
      { name: "Date_of_joining", label: "Date of Joining", type: "date", required: true },
      { name: "Department", label: "Department", type: "select" },
      { name: "Designation", label: "Designation", type: "select" },
      { name: "Employment_type", label: "Employment Type", type: "select" },
      { name: "Branch", label: "Branch", type: "select" },
      { name: "Grade", label: "Grade", type: "select" },
      { name: "Shift", label: "Shift", type: "multi-select" },
      { name: "Employment_status", label: "Employment Status", type: "select" },
      {
        name: "Step_registration_done",
        label: "Mark Employee Registration as complete",
        type: "checkbox",
        span: "full",
      },
    ],
  },
  {
    id: "documents",
    title: "Document Submission",
    description: "Upload mandatory identity and qualification documents.",
    fields: [
      { name: "Aadhaar_no", label: "Aadhaar Number", placeholder: "XXXX XXXX XXXX", pattern: /^\d{12}$/, patternMessage: "Aadhaar must be exactly 12 digits." },
      {
        name: "Aadhaar_doc",
        label: "Aadhaar ID",
        type: "file",
        accept: "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png",
        hint: "PDF, JPG, PNG",
      },
      { name: "PAN", label: "PAN Number", placeholder: "ABCDE1234F", pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, patternMessage: "PAN must be a valid format (e.g. ABCDE1234F)." },
      {
        name: "PAN_doc",
        label: "PAN Card",
        type: "file",
        accept: "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png",
        hint: "PDF, JPG, PNG",
      },
      {
        name: "Educational_certificates",
        label: "Educational Certificates",
        type: "file",
        accept: "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png",
        span: "full",
        hint: "Degree / diploma certificates",
      },
      {
        name: "Experience_certificates",
        label: "Experience Certificates",
        type: "file",
        accept: "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png",
        span: "full",
        hint: "Previous employment / experience letters",
      },
      {
        name: "Step_documents_done",
        label: "Mark Document Submission as complete",
        type: "checkbox",
        span: "full",
      },
    ],
  },
  {
    id: "verification",
    title: "Document Verification",
    description: "Verify submitted documents before proceeding with onboarding.",
    fields: [
      { name: "Doc_aadhaar_verified", label: "Aadhaar verified", type: "checkbox" },
      { name: "Doc_pan_verified", label: "PAN verified", type: "checkbox" },
      { name: "Doc_education_verified", label: "Educational certificates verified", type: "checkbox" },
      { name: "Doc_experience_verified", label: "Experience certificates verified", type: "checkbox" },
      {
        name: "Verification_remarks",
        label: "Verification Remarks",
        type: "textarea",
        span: "full",
        placeholder: "Notes from HR verification review",
      },
      {
        name: "Step_verification_done",
        label: "Mark Document Verification as complete",
        type: "checkbox",
        span: "full",
      },
    ],
  },
  {
    id: "statutory",
    title: "Statutory Details",
    description: "PF, ESI, tax, and other compliance information.",
    fields: [
      { name: "PF_number", label: "PF Number", pattern: /^[A-Z0-9]+$/, patternMessage: "PF Number must be valid alphanumeric." },
      { name: "UAN", label: "UAN", pattern: /^\d{12}$/, patternMessage: "UAN must be exactly 12 digits." },
      { name: "ESI_number", label: "ESI Number", pattern: /^\d{17}$/, patternMessage: "ESI number must be exactly 17 digits." },
      { name: "Professional_tax", label: "Professional Tax" },
      { name: "TDS", label: "TDS" },
      {
        name: "Other_statutory",
        label: "Other Statutory Information",
        type: "textarea",
        span: "full",
        placeholder: "Any additional statutory or compliance notes",
      },
      {
        name: "Step_statutory_done",
        label: "Mark Statutory Details as complete",
        type: "checkbox",
        span: "full",
      },
    ],
  },
  {
    id: "agreement",
    title: "Employment Agreement",
    description: "Upload and confirm signed employment agreement.",
    fields: [
      {
        name: "Employment_agreement",
        label: "Employment Agreement",
        type: "file",
        accept: "application/pdf,.pdf",
        span: "full",
        hint: "Signed employment agreement (PDF)",
      },
      {
        name: "Agreement_signed",
        label: "Employment agreement signed by employee",
        type: "checkbox",
        span: "full",
      },
      {
        name: "Step_agreement_done",
        label: "Mark Employment Agreement as complete",
        type: "checkbox",
        span: "full",
      },
    ],
  },
  {
    id: "idcard",
    title: "ID Card Generation",
    description: "Generate employee ID card with photograph.",
    fields: [
      {
        name: "Photo",
        label: "Employee Photograph",
        type: "file",
        accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
        maxSizeMb: 2,
        previewKey: "Photo_path",
        fileNameKey: "Photo_path",
        hint: "JPG, PNG, WEBP · max 2 MB",
      },
      { name: "Id_card_number", label: "ID Card Number", placeholder: "IDC-1045" },
      { name: "Id_card_generated", label: "ID card generated", type: "checkbox" },
      {
        name: "Step_idcard_done",
        label: "Mark ID Card Generation as complete",
        type: "checkbox",
        span: "full",
      },
    ],
  },
  {
    id: "account",
    title: "Email / User Account Creation",
    description: "Create work email and system user account for the employee.",
    fields: [
      { name: "Work_email", label: "Work Email", type: "email", placeholder: "firstname@company.com" },
      { name: "Username", label: "System Username", placeholder: "firstname.lastname" },
      { name: "Create_user_account", label: "Create user account", type: "checkbox" },
      { name: "Send_welcome_email", label: "Send welcome email with login credentials", type: "checkbox" },
    ],
  },
];
