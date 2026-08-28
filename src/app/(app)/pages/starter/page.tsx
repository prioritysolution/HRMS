import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Starter"
      section="Pages"
      actionLabel="Add Item"
      columns={["Type", "Owner", "Updated"]}
      stats={[
        {
          title: "Templates",
          value: "8",
          change: "+2",
          hint: "library",
          description: "Starter page templates ready",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Drafts",
          value: "3",
          change: "1 new",
          hint: "week",
          description: "Pages still in draft",
          tone: "warning",
          icon: "clock",
        },
        {
          title: "Published",
          value: "14",
          change: "+5%",
          hint: "month",
          description: "Live starter pages",
          tone: "success",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Blank workspace",
          secondary: "Default layout",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Template",
          c2: "Staffu Admin",
          c3: "20 Aug 2026",
          status: "Published",
        },
        {
          primary: "Team kickoff",
          secondary: "Onboarding copy",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Draft",
          c2: "HR Ops",
          c3: "24 Aug 2026",
          status: "Draft",
        },
        {
          primary: "Feature announcement",
          secondary: "Marketing shell",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "Template",
          c2: "Product",
          c3: "22 Aug 2026",
          status: "Published",
        },
      ]}
    />
  );
}
