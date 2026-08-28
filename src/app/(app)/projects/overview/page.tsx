import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Overview"
      section="Projects"
      actionLabel="New Project"
      columns={["Lead", "Progress", "Updated"]}
      stats={[
        {
          title: "Active Projects",
          value: "18",
          change: "+2",
          hint: "month",
          description: "Projects currently in flight",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "On Track",
          value: "12",
          change: "67%",
          hint: "status",
          description: "Projects meeting timeline",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "At Risk",
          value: "4",
          change: "+1",
          hint: "week",
          description: "Projects needing attention",
          tone: "warning",
          icon: "clock",
          positive: false,
        },
      ]}
      rows={[
        {
          primary: "Staffu Core",
          secondary: "HRMS platform",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Priya Sharma",
          c2: "78%",
          c3: "27 Aug 2026",
          status: "On Track",
        },
        {
          primary: "CRM Revamp",
          secondary: "Client experience",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Daniel Ortiz",
          c2: "54%",
          c3: "26 Aug 2026",
          status: "At Risk",
        },
        {
          primary: "Mobile App",
          secondary: "iOS & Android",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "Maya Chen",
          c2: "32%",
          c3: "25 Aug 2026",
          status: "Active",
        },
      ]}
    />
  );
}
