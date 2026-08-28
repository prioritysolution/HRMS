import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Performance"
      section="Dashboards"
      actionLabel="Add Review"
      columns={["Score", "Manager", "Cycle"]}
      stats={[
        {
          title: "Avg. Score",
          value: "4.2",
          change: "+0.3",
          hint: "cycle",
          description: "Company-wide performance rating",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Reviews Due",
          value: "16",
          change: "4 urgent",
          hint: "week",
          description: "Pending manager reviews",
          tone: "warning",
          icon: "calendar",
        },
        {
          title: "Top Performers",
          value: "28",
          change: "+9%",
          hint: "quarter",
          description: "Rated 4.5 or higher",
          tone: "primary",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Ava Collins",
          secondary: "Product Design",
          avatar: "/images/avatars/avatar4.jpg",
          c1: "4.8 / 5",
          c2: "Priya Sharma",
          c3: "Q3 2026",
          status: "Excellent",
        },
        {
          primary: "Leo Martins",
          secondary: "Account Executive",
          avatar: "/images/avatars/avatar5.jpg",
          c1: "4.1 / 5",
          c2: "Daniel Ortiz",
          c3: "Q3 2026",
          status: "Good",
        },
        {
          primary: "Noah Blake",
          secondary: "Backend Engineer",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "3.6 / 5",
          c2: "HR Ops",
          c3: "Q3 2026",
          status: "Pending",
        },
      ]}
    />
  );
}
