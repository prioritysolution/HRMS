import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Calendar"
      section="Apps"
      actionLabel="Add Event"
      columns={["Type", "Organizer", "When"]}
      stats={[
        {
          title: "Today",
          value: "5",
          change: "2 left",
          hint: "today",
          description: "Meetings remaining today",
          tone: "primary",
          icon: "calendar",
        },
        {
          title: "This Week",
          value: "18",
          change: "+3",
          hint: "week",
          description: "Scheduled events this week",
          tone: "info",
          icon: "clock",
        },
        {
          title: "Conflicts",
          value: "1",
          change: "resolve",
          hint: "alert",
          description: "Overlapping calendar events",
          tone: "warning",
          icon: "briefcase",
          positive: false,
        },
      ]}
      rows={[
        {
          primary: "Sprint planning",
          secondary: "Engineering",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Meeting",
          c2: "Priya Sharma",
          c3: "27 Aug, 11:00",
          status: "Upcoming",
        },
        {
          primary: "Client demo — Vestige",
          secondary: "Sales",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Demo",
          c2: "Daniel Ortiz",
          c3: "27 Aug, 14:30",
          status: "Confirmed",
        },
        {
          primary: "Design critique",
          secondary: "Product",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "Workshop",
          c2: "Ava Collins",
          c3: "28 Aug, 10:00",
          status: "Scheduled",
        },
      ]}
    />
  );
}
