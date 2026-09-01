type TableSectionHeaderProps = {
  title: React.ReactNode;
  action?: React.ReactNode;
};

export function TableSectionHeader({ title, action }: TableSectionHeaderProps) {
  return (
    <div className="table-section-header">
      <h2 className="table-section-title flex items-center">{title}</h2>
      {action ? <div className="table-section-action">{action}</div> : null}
    </div>
  );
}
