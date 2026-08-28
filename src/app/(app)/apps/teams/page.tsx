import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Teams"
      section="Apps"
      actionLabel="Create Team"
      columns={["Members", "Lead", "Updated"]}
      stats={[
        {
          title: "Teams",
          value: "12",
          change: "+1",
          hint: "month",
          description: "Active cross-functional teams",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Members",
          value: "186",
          change: "+4%",
          hint: "month",
          description: "People assigned to teams",
          tone: "success",
          icon: "users",
        },
        {
          title: "Open Seats",
          value: "9",
          change: "hire",
          hint: "roles",
          description: "Unfilled team positions",
          tone: "orange",
          icon: "userPlus",
        },
      ]}
      rows={[
        {
          primary: "Platform Engineering",
          secondary: "Core product delivery",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "24 members",
          c2: "Priya Sharma",
          c3: "26 Aug 2026",
          status: "Active",
        },
        {
          primary: "Revenue Ops",
          secondary: "Sales & success",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "16 members",
          c2: "Daniel Ortiz",
          c3: "25 Aug 2026",
          status: "Active",
        },
        {
          primary: "Experience Design",
          secondary: "Product design",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "11 members",
          c2: "Ava Collins",
          c3: "24 Aug 2026",
          status: "Hiring",
        },
      ]}
    />
  );
}
