import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Deadlines"
      section="Projects"
      actionLabel="Set Deadline"
      columns={["Project", "Owner", "Due Date"]}
      stats={[
        {
          title: "This Week",
          value: "11",
          change: "3 critical",
          hint: "week",
          description: "Deadlines due this week",
          tone: "warning",
          icon: "calendar",
        },
        {
          title: "Completed",
          value: "27",
          change: "+10%",
          hint: "month",
          description: "Deadlines met on time",
          tone: "success",
          icon: "users",
        },
        {
          title: "Missed",
          value: "3",
          change: "-1",
          hint: "month",
          description: "Deadlines slipped",
          tone: "danger",
          icon: "clock",
          positive: false,
        },
      ]}
      rows={[
        {
          primary: "Payroll release cut",
          secondary: "Staffu Core",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "Staffu Core",
          c2: "Priya Sharma",
          c3: "29 Aug 2026",
          status: "Critical",
        },
        {
          primary: "Design handoff",
          secondary: "CRM Revamp",
          avatar: "/images/avatars/avatar8.jpg",
          c1: "CRM Revamp",
          c2: "Ava Collins",
          c3: "30 Aug 2026",
          status: "Pending",
        },
        {
          primary: "Beta launch",
          secondary: "Mobile App",
          avatar: "/images/avatars/avatar9.jpg",
          c1: "Mobile App",
          c2: "Leo Martins",
          c3: "05 Sep 2026",
          status: "Scheduled",
        },
      ]}
    />
  );
}
