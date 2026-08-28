import { ModulePage } from "@/components/ui/ModulePage";

const placeholderRows = [
  {
    primary: "Sample record",
    secondary: "Preview data",
    avatar: "/images/avatars/avatar1.jpg",
    c1: "—",
    c2: "—",
    c3: "—",
    status: "Active",
  },
];

type HrmsPlaceholderPageProps = {
  title: string;
  section: string;
  actionLabel?: string;
};

export function HrmsPlaceholderPage({
  title,
  section,
  actionLabel,
}: HrmsPlaceholderPageProps) {
  return (
    <ModulePage
      title={title}
      section={section}
      actionLabel={actionLabel ?? `Add ${title}`}
      columns={["Detail", "Owner", "Updated"]}
      rows={placeholderRows}
    />
  );
}
