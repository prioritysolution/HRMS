import { Inbox, type LucideIcon } from "lucide-react";

type TableEmptyStateProps = {
  icon?: LucideIcon;
  title?: string;
  message?: string;
};

export function TableEmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  message = "No data available in this list yet.",
}: TableEmptyStateProps) {
  return (
    <div className="table-empty-state">
      <div className="table-empty-icon">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <p className="table-empty-title">{title}</p>
      <p className="table-empty-text">{message}</p>
    </div>
  );
}
