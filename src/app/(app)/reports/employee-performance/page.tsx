import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Employee Performance"
      section="Reports"
      actionLabel="Export Report"
      columns={["Department", "Score", "Period"]}
      stats={[
        {
          title: "Avg. Rating",
          value: "4.1",
          change: "+0.2",
          hint: "cycle",
          description: "Average employee score",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Reviewed",
          value: "162",
          change: "78%",
          hint: "cycle",
          description: "Employees with completed reviews",
          tone: "primary",
          icon: "users",
        },
        {
          title: "Needs Focus",
          value: "14",
          change: "-3",
          hint: "cycle",
          description: "Below target performance",
          tone: "warning",
          icon: "briefcase",
        },
      ]}
      rows={[
        {
          primary: "Priya Sharma",
          secondary: "Engineering Lead",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Engineering",
          c2: "4.7",
          c3: "Q3 2026",
          status: "Excellent",
        },
        {
          primary: "Sofia Reyes",
          secondary: "Account Executive",
          avatar: "/images/avatars/avatar8.jpg",
          c1: "Sales",
          c2: "4.3",
          c3: "Q3 2026",
          status: "Good",
        },
        {
          primary: "Noah Blake",
          secondary: "Backend Engineer",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "Engineering",
          c2: "3.5",
          c3: "Q3 2026",
          status: "Review",
        },
      ]}
    />
  );
}
