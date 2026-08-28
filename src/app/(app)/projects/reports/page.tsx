import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Task Reports"
      section="Projects"
      actionLabel="Export Report"
      columns={["Project", "Completed", "Period"]}
      stats={[
        {
          title: "Throughput",
          value: "214",
          change: "+16%",
          hint: "month",
          description: "Tasks completed this month",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Cycle Time",
          value: "3.4d",
          change: "-0.6d",
          hint: "avg",
          description: "Average task completion time",
          tone: "info",
          icon: "clock",
        },
        {
          title: "Team Load",
          value: "86%",
          change: "+4%",
          hint: "capacity",
          description: "Current team utilization",
          tone: "warning",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Engineering",
          secondary: "Backend & Platform",
          avatar: "/images/avatars/avatar4.jpg",
          c1: "Staffu Core",
          c2: "62 tasks",
          c3: "Aug 2026",
          status: "Healthy",
        },
        {
          primary: "Design",
          secondary: "Product Design",
          avatar: "/images/avatars/avatar5.jpg",
          c1: "CRM Revamp",
          c2: "28 tasks",
          c3: "Aug 2026",
          status: "Busy",
        },
        {
          primary: "QA",
          secondary: "Quality Assurance",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "Mobile App",
          c2: "19 tasks",
          c3: "Aug 2026",
          status: "On Track",
        },
      ]}
    />
  );
}
