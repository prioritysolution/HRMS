import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
  }
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["onboarding", "records", "rows", "data", "list"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
    }
  }
  return [];
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function firstText(record: Record<string, unknown>, keys: string[]): string {
  const value = firstValue(record, keys);
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  return text;
}

function asId(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) {
    return value.map(asId).filter(Boolean).join(",");
  }
  return String(value).trim();
}

function firstId(record: Record<string, unknown>, keys: string[]): string {
  return asId(firstValue(record, keys));
}

function appendFormValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === "") return;

  if (value instanceof File) {
    formData.append(key, value, value.name);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item instanceof File) {
        formData.append(`${key}[${index}]`, item, item.name);
        return;
      }
      if (item !== undefined && item !== null && item !== "") {
        formData.append(`${key}[${index}]`, String(item));
      }
    });
    return;
  }

  if (typeof value === "boolean") {
    formData.append(key, value ? "1" : "0");
    return;
  }

  formData.append(key, String(value));
}

/** Empty password must still be sent so the API receives null / no password. */
function appendPasswordValue(formData: FormData, value: unknown): void {
  const password =
    value === undefined || value === null || value instanceof File
      ? ""
      : String(value).trim();

  formData.append("password", password);
}

function resolvePasswordValue(value: unknown): string | null {
  if (value === undefined || value === null || value instanceof File) return null;
  const password = String(value).trim();
  return password || null;
}

function flagValue(value: unknown): "1" | "0" | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === 1 || value === "1" || value === "Y" || value === "yes") {
    return "1";
  }
  return "0";
}

function firstFlag(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null || value === "") continue;
    if (value === true || value === "true" || value === 1 || value === "1" || value === "Y" || value === "yes") {
      return true;
    }
    if (value === false || value === "false" || value === 0 || value === "0" || value === "N" || value === "no") {
      return false;
    }
  }
  return undefined;
}

function appendAliases(formData: FormData, value: string, keys: string[]): void {
  keys.forEach((key) => formData.append(key, value));
}

function looksLikeId(value: string): boolean {
  return /^\d+(?:,\d+)*$/.test(value);
}

function pickIdOrEmpty(record: Record<string, unknown>, idKeys: string[], nameKeys: string[] = []): string {
  const id = firstId(record, idKeys);
  if (id && looksLikeId(id)) return id;
  const named = firstText(record, nameKeys);
  if (named && looksLikeId(named)) return named;
  if (id) return id;
  return named;
}

function pickDisplayName(record: Record<string, unknown>, nameKeys: string[], rawKeys: string[]): string {
  const named = firstText(record, nameKeys);
  if (named && !looksLikeId(named)) return named;
  const raw = firstText(record, rawKeys);
  if (raw && !looksLikeId(raw)) return raw;
  return named;
}

function splitShiftIds(value: unknown): string[] {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function appendFileIfPresent(formData: FormData, key: string, value: unknown): void {
  if (value instanceof File) {
    formData.append(key, value, value.name);
  }
}

function appendIdentificationRows(formData: FormData, values: HrmsRow): void {
  const remarks = String(values.Verification_remarks ?? "").trim();
  const rows = [
    {
      idType: "2",
      number: values.Aadhaar_no,
      verified: flagValue(values.Doc_aadhaar_verified),
    },
    {
      idType: "1",
      number: values.PAN,
      verified: flagValue(values.Doc_pan_verified),
    },
  ];

  rows.forEach((row, index) => {
    const number = row.number == null || row.number === "" ? "" : String(row.number).trim();
    formData.append(`identifications[${index}][id_type]`, row.idType);
    formData.append(`identifications[${index}][Id_type]`, row.idType);
    if (number) {
      formData.append(`identifications[${index}][id_number]`, number);
      formData.append(`identifications[${index}][Id_number]`, number);
    }
    if (row.verified !== undefined) {
      formData.append(`identifications[${index}][verified]`, row.verified);
      formData.append(`identifications[${index}][Verified]`, row.verified);
    }
    if (remarks) {
      formData.append(`identifications[${index}][verify_remarks]`, remarks);
      formData.append(`identifications[${index}][Verify_Remarks]`, remarks);
    }
  });
}

function flattenNestedAliases(row: Record<string, unknown>): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  const identifications = row.identifications ?? row.Identifications;
  if (Array.isArray(identifications)) {
    identifications.forEach((item) => {
      const record = asRecord(item);
      if (!record) return;
      const typeRaw = firstValue(record, ["Id_type", "id_type", "Type", "type"]);
      const type = String(typeRaw ?? "").toLowerCase();
      const number = firstValue(record, ["Id_number", "id_number", "Number", "number"]);
      const path = firstValue(record, [
        "Doc_path",
        "doc_path",
        "Document_path",
        "document_path",
        "DocPath",
      ]);
      const verified = firstValue(record, ["Verified", "verified"]);
      const remarks = firstValue(record, ["Verify_Remarks", "verify_remarks", "Remarks", "remarks"]);

      const isAadhaar = type.includes("aadhaar") || type.includes("aadhar") || type === "2";
      const isPan = type.includes("pan") || type === "1";
      const isEducation = type.includes("edu") || type === "5";
      const isExperience = type.includes("exp") || type === "6";

      if (isAadhaar) {
        if (number && extra.Aadhaar_no == null) extra.Aadhaar_no = number;
        if (path && extra.Aadhaar_doc == null) extra.Aadhaar_doc = path;
        if (verified != null && extra.Doc_aadhaar_verified == null) extra.Doc_aadhaar_verified = verified;
      }
      if (isPan) {
        if (number && extra.PAN == null) extra.PAN = number;
        if (path && extra.PAN_doc == null) extra.PAN_doc = path;
        if (verified != null && extra.Doc_pan_verified == null) extra.Doc_pan_verified = verified;
      }
      if (isEducation) {
        if (path && extra.Educational_certificates == null) {
          extra.Educational_certificates = path;
        }
        if (verified != null && extra.Doc_education_verified == null) {
          extra.Doc_education_verified = verified;
        }
      }
      if (isExperience) {
        if (path && extra.Experience_certificates == null) {
          extra.Experience_certificates = path;
        }
        if (verified != null && extra.Doc_experience_verified == null) {
          extra.Doc_experience_verified = verified;
        }
      }
      if (remarks && extra.Verification_remarks == null) extra.Verification_remarks = remarks;
    });
  }

  const statutory = asRecord(row.statutory ?? row.Statutory);
  if (statutory) {
    extra.PF_number = extra.PF_number ?? firstValue(statutory, ["PF_number", "pf_number", "Pf_number", "Pf_no"]);
    extra.UAN = extra.UAN ?? firstValue(statutory, ["UAN", "uan", "Uan_no"]);
    extra.ESI_number = extra.ESI_number ?? firstValue(statutory, ["ESI_number", "esi_number", "Esi_no"]);
    extra.Professional_tax = extra.Professional_tax ?? firstValue(statutory, ["Professional_tax", "professional_tax", "Ptax_no"]);
    extra.TDS = extra.TDS ?? firstValue(statutory, ["TDS", "tds", "Tds_applicable"]);
    extra.Other_statutory = extra.Other_statutory ?? firstValue(statutory, ["Other_statutory", "Statutory_Notes", "statutory_notes"]);
  }

  return extra;
}

/**
 * Build multipart body using the OnboardingModal field names the API normalizer accepts.
 */
export function toOnboardingFormData(values: HrmsRow): FormData {
  const formData = new FormData();

  appendFormValue(formData, "employee_id", values.Employee_id);
  appendFormValue(formData, "date_of_joining", values.Date_of_joining);
  appendFormValue(formData, "device_user_id", values.Device_user_id);
  appendFormValue(formData, "department", values.Department);
  appendFormValue(formData, "designation", values.Designation);
  appendFormValue(formData, "employment_type", values.Employment_type);
  appendFormValue(formData, "branch", values.Branch);
  appendFormValue(formData, "grade", values.Grade);
  appendFormValue(formData, "employment_status", values.Employment_status);

  const shifts = splitShiftIds(values.Shift);
  shifts.forEach((id, index) => formData.append(`shift[${index}]`, id));

  appendFormValue(formData, "aadhaar_number", values.Aadhaar_no);
  appendFormValue(formData, "pan_number", values.PAN);
  appendFileIfPresent(formData, "aadhaar_doc", values.Aadhaar_doc);
  appendFileIfPresent(formData, "pan_doc", values.PAN_doc);
  appendFileIfPresent(formData, "educational_certificates", values.Educational_certificates);
  appendFileIfPresent(formData, "experience_certificates", values.Experience_certificates);

  const aadhaarVerified = flagValue(values.Doc_aadhaar_verified);
  const panVerified = flagValue(values.Doc_pan_verified);
  const educationVerified = flagValue(values.Doc_education_verified);
  const experienceVerified = flagValue(values.Doc_experience_verified);
  if (aadhaarVerified !== undefined) {
    appendAliases(formData, aadhaarVerified, [
      "doc_aadhaar_verified",
      "Doc_aadhaar_verified",
      "aadhaar_verified",
    ]);
  }
  if (panVerified !== undefined) {
    appendAliases(formData, panVerified, ["doc_pan_verified", "Doc_pan_verified", "pan_verified"]);
  }
  if (educationVerified !== undefined) {
    appendAliases(formData, educationVerified, [
      "doc_education_verified",
      "Doc_education_verified",
      "education_verified",
    ]);
  }
  if (experienceVerified !== undefined) {
    appendAliases(formData, experienceVerified, [
      "doc_experience_verified",
      "Doc_experience_verified",
      "experience_verified",
    ]);
  }

  const remarks = String(values.Verification_remarks ?? "").trim();
  if (remarks) {
    appendAliases(formData, remarks, [
      "verification_remarks",
      "Verification_remarks",
      "verify_remarks",
      "Verify_Remarks",
    ]);
    formData.append("verification[verification_remarks]", remarks);
    formData.append("verification[Verify_Remarks]", remarks);
  }
  if (aadhaarVerified !== undefined) {
    formData.append("verification[doc_aadhaar_verified]", aadhaarVerified);
  }
  if (panVerified !== undefined) {
    formData.append("verification[doc_pan_verified]", panVerified);
  }
  if (educationVerified !== undefined) {
    formData.append("verification[doc_education_verified]", educationVerified);
  }
  if (experienceVerified !== undefined) {
    formData.append("verification[doc_experience_verified]", experienceVerified);
  }
  appendIdentificationRows(formData, values);

  appendFormValue(formData, "pf_number", values.PF_number);
  appendFormValue(formData, "uan", values.UAN);
  appendFormValue(formData, "esi_number", values.ESI_number);
  appendFormValue(formData, "professional_tax", values.Professional_tax);
  appendFormValue(formData, "tds", values.TDS);
  appendFormValue(formData, "other_statutory", values.Other_statutory);

  appendFileIfPresent(formData, "employment_agreement", values.Employment_agreement);
  const agreementSigned = flagValue(values.Agreement_signed);
  if (agreementSigned !== undefined) formData.append("agreement_signed", agreementSigned);

  if (values.Photo instanceof File) {
    formData.append("photo", values.Photo, values.Photo.name);
  } else if (
    typeof values.Photo_path === "string" &&
    values.Photo_path &&
    !/^(https?:|blob:|data:)/i.test(values.Photo_path)
  ) {
    appendFormValue(formData, "photo_path", values.Photo_path);
  }
  appendFormValue(formData, "id_card_number", values.Id_card_number);
  const idCardGenerated = flagValue(values.Id_card_generated);
  if (idCardGenerated !== undefined) formData.append("id_card_generated", idCardGenerated);

  appendFormValue(formData, "work_email", values.Work_email);
  appendFormValue(formData, "username", values.Username);
  appendPasswordValue(formData, values.Password);
  const userAlreadyCreated = flagValue(values.User_already_created);
  if (userAlreadyCreated !== undefined) {
    formData.append("user_already_created", userAlreadyCreated);
  }
  const createUser = flagValue(values.Create_user_account);
  if (createUser !== undefined) formData.append("create_user_account", createUser);
  const sendWelcome = flagValue(values.Send_welcome_email);
  if (sendWelcome !== undefined) formData.append("send_welcome_email", sendWelcome);

  const stepFlags: Array<[string[], unknown]> = [
    [["step_registration_done", "Step_registration_done", "Step1_Complete"], values.Step_registration_done],
    [["step_documents_done", "Step_documents_done", "Step2_Complete"], values.Step_documents_done],
    [["step_verification_done", "Step_verification_done", "Step3_Complete"], values.Step_verification_done],
    [["step_statutory_done", "Step_statutory_done", "Step4_Complete"], values.Step_statutory_done],
    [["step_agreement_done", "Step_agreement_done", "Step5_Complete"], values.Step_agreement_done],
    [["step_idcard_done", "Step_idcard_done", "Step6_Complete"], values.Step_idcard_done],
  ];
  stepFlags.forEach(([keys, value]) => {
    const flag = flagValue(value);
    if (flag !== undefined) appendAliases(formData, flag, keys);
  });

  const stepVerification = flagValue(values.Step_verification_done);
  if (stepVerification !== undefined) {
    formData.append("verification[step_verification_done]", stepVerification);
    formData.append("verification[Step3_Complete]", stepVerification);
  }

  formData.append("payload_json", JSON.stringify(toOnboardingJsonPayload(values)));

  return formData;
}

function normalizeListRow(row: Record<string, unknown>): HrmsRow {
  const nested = flattenNestedAliases(row);
  const source = { ...row, ...nested };

  const displayName =
    firstText(source, ["Display_name", "Employee_name"]) ||
    `${source.First_name ?? ""} ${source.Last_name ?? ""}`.trim();

  return {
    ...source,
    id: source.Onboard_id ?? source.id,
    Onboard_id: source.Onboard_id ?? source.id,
    Display_name: displayName,
    Employee_id: firstId(source, ["Employee_id", "employee_id"]),
    Device_user_id: firstId(source, ["Device_user_id", "device_user_id"]),
    Department: pickIdOrEmpty(source, ["Dept_Id", "dept_id"], ["department", "Department"]),
    Designation: pickIdOrEmpty(source, ["Desig_Id", "desig_id"], ["designation", "Designation"]),
    Employment_type: pickIdOrEmpty(source, ["Emp_type_id", "emp_type_id"], ["employment_type", "Employment_type"]),
    Branch: pickIdOrEmpty(source, ["Branch_Id", "branch_id"], ["branch", "Branch"]),
    Grade: pickIdOrEmpty(source, ["Grade_Id", "grade_id"], ["grade", "Grade"]),
    Shift: pickIdOrEmpty(source, ["Shift_ids", "Shift_id", "Shift_Id", "shift_id"], ["shift", "Shift"]),
    Employment_status: pickIdOrEmpty(
      source,
      ["Emp_status_id", "Employment_status_id", "employment_status", "Employment_status"],
    ),
    Dept_Name: pickDisplayName(
      source,
      ["Dept_Name", "Department_name", "dept_name"],
      ["Department", "department"],
    ),
    Employment_status_name: pickDisplayName(
      source,
      ["Employment_status_name", "Status_name"],
      ["Employment_status"],
    ),
    Aadhaar_no: firstText(source, ["Aadhaar_no", "aadhaar_number", "Aadhaar_number"]),
    PAN: firstText(source, ["PAN", "pan_number", "PAN_number"]),
    Aadhaar_doc: firstText(source, ["Aadhaar_doc", "aadhaar_doc", "Aadhaar_DocPath"]),
    PAN_doc: firstText(source, ["PAN_doc", "pan_doc", "PAN_DocPath"]),
    Educational_certificates: firstText(source, [
      "Educational_certificates",
      "educational_certificates",
      "Education_DocPath",
    ]),
    Experience_certificates: firstText(source, [
      "Experience_certificates",
      "experience_certificates",
      "Experience_DocPath",
    ]),
    Employment_agreement: firstText(source, [
      "Employment_agreement",
      "employment_agreement",
      "Agreement_DocPath",
    ]),
    Work_email: firstText(source, ["Work_email", "Work_Email", "work_email"]),
    Username: firstText(source, ["Username", "User_Name", "username"]),
    Photo_path: firstText(source, ["Photo_path", "Photo_Url", "photo_path", "Photo"]),
    PF_number: firstText(source, ["PF_number", "pf_number"]),
    UAN: firstText(source, ["UAN", "uan"]),
    ESI_number: firstText(source, ["ESI_number", "esi_number"]),
    Professional_tax: firstText(source, ["Professional_tax", "professional_tax"]),
    TDS: firstText(source, ["TDS", "tds"]),
    Other_statutory: firstText(source, ["Other_statutory", "Statutory_Notes", "statutory_notes"]),
    Id_card_number: firstText(source, ["Id_card_number", "id_card_number", "IdCard_No"]),
    Verification_remarks: firstText(source, [
      "Verification_remarks",
      "verification_remarks",
      "Verify_Remarks",
      "verify_remarks",
    ]),
    Doc_aadhaar_verified:
      firstFlag(source, [
        "Doc_aadhaar_verified",
        "doc_aadhaar_verified",
        "aadhaar_verified",
        "Aadhaar_Verified",
      ]) ?? source.Doc_aadhaar_verified,
    Doc_pan_verified:
      firstFlag(source, ["Doc_pan_verified", "doc_pan_verified", "pan_verified", "PAN_Verified"]) ??
      source.Doc_pan_verified,
    Doc_education_verified:
      firstFlag(source, [
        "Doc_education_verified",
        "doc_education_verified",
        "education_verified",
        "Education_Verified",
      ]) ?? source.Doc_education_verified,
    Doc_experience_verified:
      firstFlag(source, [
        "Doc_experience_verified",
        "doc_experience_verified",
        "experience_verified",
        "Experience_Verified",
      ]) ?? source.Doc_experience_verified,
    Agreement_signed: firstFlag(source, ["Agreement_signed", "agreement_signed", "Agreement_Signed"]),
    Id_card_generated: firstFlag(source, ["Id_card_generated", "id_card_generated", "IdCard_Generated"]),
    Step_registration_done: firstFlag(source, [
      "Step_registration_done",
      "step_registration_done",
      "Step1_Complete",
    ]),
    Step_documents_done: firstFlag(source, ["Step_documents_done", "step_documents_done", "Step2_Complete"]),
    Step_verification_done: firstFlag(source, [
      "Step_verification_done",
      "step_verification_done",
      "Step3_Complete",
    ]),
    Step_statutory_done: firstFlag(source, ["Step_statutory_done", "step_statutory_done", "Step4_Complete"]),
    Step_agreement_done: firstFlag(source, ["Step_agreement_done", "step_agreement_done", "Step5_Complete"]),
    Step_idcard_done: firstFlag(source, ["Step_idcard_done", "step_idcard_done", "Step6_Complete"]),
    Create_user_account: firstFlag(source, [
      "Create_user_account",
      "create_user_account",
      "Step7_Complete",
    ]),
    User_already_created: firstFlag(source, [
      "User_already_created",
      "user_already_created",
    ]),
    Send_welcome_email: firstFlag(source, ["Send_welcome_email", "send_welcome_email"]),
    // Never hydrate password into the edit form.
    Password: "",
    Onboarding_stage: firstText(source, ["Onboarding_stage"]) || "Documents",
  } as HrmsRow;
}

function unwrapDetail(payload: unknown): HrmsRow {
  const record = asRecord(payload);
  if (!record) return {} as HrmsRow;

  const nestedData = asRecord(record.data);
  const nestedOnboarding =
    asRecord(record.onboarding) ??
    asRecord(nestedData?.onboarding) ??
    asRecord(record.Onboarding) ??
    asRecord(nestedData?.Onboarding);
  const nestedEmployee =
    asRecord(record.employee) ??
    asRecord(nestedData?.employee) ??
    asRecord(record.Employee) ??
    asRecord(nestedData?.Employee) ??
    asRecord(nestedOnboarding?.employee);

  // Prefer the richest onboarding object; fall back to data / root.
  const base = nestedOnboarding ?? nestedData ?? record;

  const identifications =
    record.identifications ??
    record.Identifications ??
    base.identifications ??
    base.Identifications ??
    nestedData?.identifications ??
    nestedData?.Identifications ??
    nestedOnboarding?.identifications ??
    nestedOnboarding?.Identifications;

  const statutory =
    record.statutory ??
    record.Statutory ??
    base.statutory ??
    base.Statutory ??
    nestedData?.statutory ??
    nestedData?.Statutory ??
    nestedOnboarding?.statutory ??
    nestedOnboarding?.Statutory;

  const documents =
    asRecord(record.documents) ??
    asRecord(base.documents) ??
    asRecord(nestedData?.documents) ??
    asRecord(nestedOnboarding?.documents);

  return normalizeListRow({
    ...(nestedEmployee ?? {}),
    ...base,
    ...(documents ?? {}),
    identifications,
    statutory,
  });
}

function toOnboardingJsonPayload(values: HrmsRow): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const setIf = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    payload[key] = value;
  };

  setIf("employee_id", values.Employee_id);
  setIf("date_of_joining", values.Date_of_joining);
  setIf("device_user_id", values.Device_user_id);
  setIf("department", values.Department);
  setIf("designation", values.Designation);
  setIf("employment_type", values.Employment_type);
  setIf("branch", values.Branch);
  setIf("grade", values.Grade);
  setIf("employment_status", values.Employment_status);

  const shifts = splitShiftIds(values.Shift);
  if (shifts.length > 0) payload.shift = shifts;

  setIf("aadhaar_number", values.Aadhaar_no);
  setIf("pan_number", values.PAN);

  const aadhaarVerified = flagValue(values.Doc_aadhaar_verified);
  const panVerified = flagValue(values.Doc_pan_verified);
  const educationVerified = flagValue(values.Doc_education_verified);
  const experienceVerified = flagValue(values.Doc_experience_verified);
  const remarks = String(values.Verification_remarks ?? "").trim();

  if (aadhaarVerified !== undefined) {
    payload.doc_aadhaar_verified = Number(aadhaarVerified);
    payload.Doc_aadhaar_verified = Number(aadhaarVerified);
  }
  if (panVerified !== undefined) {
    payload.doc_pan_verified = Number(panVerified);
    payload.Doc_pan_verified = Number(panVerified);
  }
  if (educationVerified !== undefined) {
    payload.doc_education_verified = Number(educationVerified);
    payload.Doc_education_verified = Number(educationVerified);
  }
  if (experienceVerified !== undefined) {
    payload.doc_experience_verified = Number(experienceVerified);
    payload.Doc_experience_verified = Number(experienceVerified);
  }
  if (remarks) {
    payload.verification_remarks = remarks;
    payload.Verification_remarks = remarks;
    payload.verify_remarks = remarks;
    payload.Verify_Remarks = remarks;
  }

  payload.identifications = [
    {
      id_type: 2,
      ...(values.Aadhaar_no ? { id_number: String(values.Aadhaar_no) } : {}),
      ...(aadhaarVerified !== undefined ? { verified: Number(aadhaarVerified) } : {}),
      ...(remarks ? { verify_remarks: remarks, Verify_Remarks: remarks } : {}),
    },
    {
      id_type: 1,
      ...(values.PAN ? { id_number: String(values.PAN) } : {}),
      ...(panVerified !== undefined ? { verified: Number(panVerified) } : {}),
      ...(remarks ? { verify_remarks: remarks, Verify_Remarks: remarks } : {}),
    },
  ];

  setIf("pf_number", values.PF_number);
  setIf("uan", values.UAN);
  setIf("esi_number", values.ESI_number);
  setIf("professional_tax", values.Professional_tax);
  setIf("tds", values.TDS);
  setIf("other_statutory", values.Other_statutory);
  setIf("id_card_number", values.Id_card_number);
  setIf("work_email", values.Work_email);
  setIf("username", values.Username);
  payload.password = resolvePasswordValue(values.Password);

  const assignFlag = (keys: string[], value: unknown) => {
    const flag = flagValue(value);
    if (flag === undefined) return;
    keys.forEach((key) => {
      payload[key] = Number(flag);
    });
  };

  assignFlag(["user_already_created", "User_already_created"], values.User_already_created);
  assignFlag(["agreement_signed", "Agreement_signed"], values.Agreement_signed);
  assignFlag(["id_card_generated", "Id_card_generated"], values.Id_card_generated);
  assignFlag(["create_user_account", "Create_user_account"], values.Create_user_account);
  assignFlag(["send_welcome_email", "Send_welcome_email"], values.Send_welcome_email);
  assignFlag(["step_registration_done", "Step_registration_done", "Step1_Complete"], values.Step_registration_done);
  assignFlag(["step_documents_done", "Step_documents_done", "Step2_Complete"], values.Step_documents_done);
  assignFlag(["step_verification_done", "Step_verification_done", "Step3_Complete"], values.Step_verification_done);
  assignFlag(["step_statutory_done", "Step_statutory_done", "Step4_Complete"], values.Step_statutory_done);
  assignFlag(["step_agreement_done", "Step_agreement_done", "Step5_Complete"], values.Step_agreement_done);
  assignFlag(["step_idcard_done", "Step_idcard_done", "Step6_Complete"], values.Step_idcard_done);

  return payload;
}

export const employeeOnboardingService = {
  list: async (): Promise<HrmsRow[]> => {
    const response = await apiClient.get<unknown>(API_ENDPOINTS.employeeOnboarding.list);
    return asArray(response).map((row) => normalizeListRow(row));
  },

  get: async (id: string | number): Promise<HrmsRow> => {
    const response = await apiClient.get<unknown>(API_ENDPOINTS.employeeOnboarding.get(id));
    return unwrapDetail(response);
  },

  create: async (values: HrmsRow): Promise<HrmsRow> => {
    const body = toOnboardingFormData(values);
    const response = await apiClient.post<unknown>(API_ENDPOINTS.employeeOnboarding.create, body);
    return unwrapDetail(response);
  },

  update: async (id: string | number, values: HrmsRow): Promise<HrmsRow> => {
    const formData = toOnboardingFormData(values);
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.employeeOnboarding.update(id),
      formData,
    );
    return unwrapDetail(response);
  },

  remove: async (id: string | number): Promise<unknown> => {
    return apiClient.delete(API_ENDPOINTS.employeeOnboarding.remove(id));
  },
};
