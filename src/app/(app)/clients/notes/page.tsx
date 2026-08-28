import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Notes & Tasks"
      section="Clients"
      actionLabel="Add Note"
      columns={["Related", "Owner", "Due"]}
      stats={[
        {
          title: "Open Notes",
          value: "31",
          change: "+4",
          hint: "week",
          description: "Client notes awaiting action",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Tasks Due",
          value: "12",
          change: "5 today",
          hint: "today",
          description: "Follow-ups scheduled today",
          tone: "warning",
          icon: "calendar",
        },
        {
          title: "Completed",
          value: "87",
          change: "+18%",
          hint: "month",
          description: "Notes and tasks closed",
          tone: "success",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Prepare renewal brief",
          secondary: "Vestige Co",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Vestige Co",
          c2: "Priya Sharma",
          c3: "28 Aug 2026",
          status: "Pending",
        },
        {
          primary: "Share onboarding checklist",
          secondary: "Quinscape",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Quinscape",
          c2: "Daniel Ortiz",
          c3: "29 Aug 2026",
          status: "Active",
        },
        {
          primary: "Log pricing feedback",
          secondary: "Atom Soft",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "Atom Soft",
          c2: "Sofia Reyes",
          c3: "30 Aug 2026",
          status: "Completed",
        },
      ]}
    />
  );
}
