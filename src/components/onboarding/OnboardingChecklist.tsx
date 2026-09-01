"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { ONBOARDING_CHECKLIST_STEPS } from "@/lib/onboarding-checklist";
import { cn } from "@/lib/utils";
import type { HrmsRow } from "@/types/hrms";

type OnboardingChecklistProps = {
  values: HrmsRow;
  activeStepId?: string | null;
  onStepSelect?: (stepId: string) => void;
  compact?: boolean;
};

function isStepComplete(values: HrmsRow, doneField: string): boolean {
  const value = values[doneField];
  return value === true || value === "true";
}

export function OnboardingChecklist({
  values,
  activeStepId,
  onStepSelect,
  compact = false,
}: OnboardingChecklistProps) {
  const completedCount = ONBOARDING_CHECKLIST_STEPS.filter((step) =>
    isStepComplete(values, step.doneField),
  ).length;
  const total = ONBOARDING_CHECKLIST_STEPS.length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div className={cn("onboarding-checklist", compact && "onboarding-checklist-compact")}>
      <div className="onboarding-checklist-header">
        <div>
          <p className="onboarding-checklist-title">Onboarding Checklist</p>
          <p className="onboarding-checklist-subtitle">
            {completedCount} of {total} steps completed
          </p>
        </div>
        <span className="onboarding-checklist-percent">{percent}%</span>
      </div>

      <div className="progress mb-3">
        <div
          className="progress-bar bg-primary"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <ol className="onboarding-checklist-steps">
        {ONBOARDING_CHECKLIST_STEPS.map((step, index) => {
          const done = isStepComplete(values, step.doneField);
          const active = activeStepId === step.id;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={cn(
                  "onboarding-checklist-step",
                  done && "is-done",
                  active && "is-active",
                )}
                onClick={() => onStepSelect?.(step.id)}
                disabled={!onStepSelect}
              >
                <span className="onboarding-checklist-step-index">{index + 1}</span>
                {done ? (
                  <CheckCircle2 size={18} className="onboarding-checklist-step-icon is-done" />
                ) : (
                  <Circle size={18} className="onboarding-checklist-step-icon" />
                )}
                <span className="onboarding-checklist-step-label">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
