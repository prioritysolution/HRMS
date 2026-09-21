"use client";

import { Inbox, type LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n";

type TableEmptyStateProps = {
  icon?: LucideIcon;
  title?: string;
  message?: string;
};

export function TableEmptyState({
  icon: Icon = Inbox,
  title,
  message,
}: TableEmptyStateProps) {
  const { t } = useI18n();

  return (
    <div className="table-empty-state">
      <div className="table-empty-icon">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <p className="table-empty-title">{title ?? t("common.table.noRecords")}</p>
      <p className="table-empty-text">{message ?? t("common.table.emptyDefault")}</p>
    </div>
  );
}
