import type { HrmsRow } from "@/types/hrms";

export type OnboardingChecklistStep = {
  id: string;
  title: string;
  doneField: string;
};

export const ONBOARDING_CHECKLIST_STEPS: OnboardingChecklistStep[] = [
  { id: "registration", title: "Employee Registration", doneField: "Step_registration_done" },
  { id: "documents", title: "Document Submission", doneField: "Step_documents_done" },
  { id: "verification", title: "Document Verification", doneField: "Step_verification_done" },
  { id: "statutory", title: "Statutory Details", doneField: "Step_statutory_done" },
  { id: "agreement", title: "Employment Agreement", doneField: "Step_agreement_done" },
  { id: "policy", title: "Policy Acceptance", doneField: "Step_policy_done" },
  { id: "assets", title: "Asset Allocation", doneField: "Step_assets_done" },
  { id: "idcard", title: "ID Card Generation", doneField: "Step_idcard_done" },
  { id: "account", title: "Email / User Account Creation", doneField: "Step_account_done" },
];

function isStepDone(row: HrmsRow, doneField: string): boolean {
  const value = row[doneField];
  return value === true || value === "true";
}

export function getChecklistProgress(row: HrmsRow): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = ONBOARDING_CHECKLIST_STEPS.length;
  const completed = ONBOARDING_CHECKLIST_STEPS.filter((step) => isStepDone(row, step.doneField)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function resolveOnboardingStage(percent: number): string {
  if (percent >= 100) return "Completed";
  if (percent >= 66) return "Training";
  if (percent >= 33) return "Orientation";
  return "Documents";
}

export function enrichOnboardingRow(values: HrmsRow): HrmsRow {
  const displayName = [values.First_name, values.Last_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const { completed, total, percent } = getChecklistProgress(values);

  return {
    ...values,
    Display_name: displayName || String(values.Display_name ?? ""),
    Checklist_completed: completed,
    Checklist_total: total,
    Checklist_progress: percent,
    Onboarding_stage: resolveOnboardingStage(percent),
    Employment_status: percent >= 100 ? "Active" : String(values.Employment_status ?? "Pending"),
  };
}

export function isOnboardingStepDone(row: HrmsRow, stepId: string): boolean {
  const step = ONBOARDING_CHECKLIST_STEPS.find((item) => item.id === stepId);
  if (!step) return false;
  return isStepDone(row, step.doneField);
}
