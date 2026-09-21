"use client";

import { useI18n, translateHrmsLookup } from "@/i18n";
import { CheckCircle2, Circle } from "lucide-react";
import { isOnboardingFlagDone, ONBOARDING_CHECKLIST_STEPS } from "@/lib/onboarding-checklist";
import { cn } from "@/lib/utils";
import type { HrmsRow } from "@/types/hrms";

type OnboardingChecklistProps = {
  values: HrmsRow;
  activeStepId?: string | null;
  onStepSelect?: (stepId: string) => void;
  compact?: boolean;
};

function isStepComplete(values: HrmsRow, step: (typeof ONBOARDING_CHECKLIST_STEPS)[number]): boolean {
  const fields = step.doneAnyOf?.length ? step.doneAnyOf : [step.doneField];
  return fields.some((field) => isOnboardingFlagDone(values[field]));
}

export function OnboardingChecklist({
  values,
  activeStepId,
  onStepSelect,
  compact = false,
}: OnboardingChecklistProps) {
  const { t, language } = useI18n();
  const completedCount = ONBOARDING_CHECKLIST_STEPS.filter((step) =>
    isStepComplete(values, step),
  ).length;
  const total = ONBOARDING_CHECKLIST_STEPS.length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div className={cn("onboarding-checklist", compact && "onboarding-checklist-compact")}>
      <div className="onboarding-checklist-header">
        <div>
          <p className="onboarding-checklist-title">{t("employees.onboarding.checklistTitle")}</p>
          <p className="onboarding-checklist-subtitle">
            {t("employees.onboarding.stepsCompleted", { completed: completedCount, total })}
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
          const done = isStepComplete(values, step);
          const active = activeStepId === step.id;
          const translatedLabel = translateHrmsLookup(language, "labels", step.title);

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
                <span className="onboarding-checklist-step-label">{translatedLabel}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
