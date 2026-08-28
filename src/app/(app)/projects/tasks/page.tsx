import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Tasks List"
      section="Projects"
      actionLabel="Add Task"
      columns={["Project", "Assignee", "Due"]}
      stats={[
        {
          title: "Open Tasks",
          value: "74",
          change: "+8%",
          hint: "week",
          description: "Active tasks across projects",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Completed",
          value: "128",
          change: "+15%",
          hint: "month",
          description: "Tasks finished this month",
          tone: "success",
          icon: "users",
        },
        {
          title: "Overdue",
          value: "9",
          change: "-2",
          hint: "week",
          description: "Tasks past due date",
          tone: "danger",
          icon: "clock",
          positive: false,
        },
      ]}
      rows={[
        {
          primary: "Wireframe payroll module",
          secondary: "Staffu Core",
          avatar: "/images/avatars/avatar4.jpg",
          c1: "Staffu Core",
          c2: "Ava Collins",
          c3: "29 Aug 2026",
          status: "Active",
        },
        {
          primary: "API auth hardening",
          secondary: "Platform",
          avatar: "/images/avatars/avatar5.jpg",
          c1: "Platform",
          c2: "Noah Blake",
          c3: "28 Aug 2026",
          status: "Pending",
        },
        {
          primary: "Client portal QA",
          secondary: "CRM Revamp",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "CRM Revamp",
          c2: "Maya Chen",
          c3: "01 Sep 2026",
          status: "Overdue",
        },
      ]}
    />
  );
}
