import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Milestones"
      section="Projects"
      actionLabel="Add Milestone"
      columns={["Project", "Owner", "Target"]}
      stats={[
        {
          title: "Upcoming",
          value: "14",
          change: "+3",
          hint: "quarter",
          description: "Milestones scheduled ahead",
          tone: "primary",
          icon: "calendar",
        },
        {
          title: "Achieved",
          value: "39",
          change: "+12%",
          hint: "year",
          description: "Milestones completed YTD",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Blocked",
          value: "2",
          change: "1 urgent",
          hint: "review",
          description: "Milestones waiting on deps",
          tone: "orange",
          icon: "briefcase",
        },
      ]}
      rows={[
        {
          primary: "MVP feature freeze",
          secondary: "Staffu Core",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Staffu Core",
          c2: "Priya Sharma",
          c3: "02 Sep 2026",
          status: "Upcoming",
        },
        {
          primary: "CRM UAT sign-off",
          secondary: "CRM Revamp",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "CRM Revamp",
          c2: "Daniel Ortiz",
          c3: "10 Sep 2026",
          status: "Blocked",
        },
        {
          primary: "App Store submission",
          secondary: "Mobile App",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "Mobile App",
          c2: "Maya Chen",
          c3: "18 Sep 2026",
          status: "Scheduled",
        },
      ]}
    />
  );
}
