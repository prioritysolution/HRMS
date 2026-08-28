import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Chat"
      section="Apps"
      actionLabel="New Chat"
      columns={["Channel", "Last Message", "Time"]}
      stats={[
        {
          title: "Unread",
          value: "18",
          change: "+5",
          hint: "today",
          description: "Unread conversations",
          tone: "primary",
          icon: "users",
        },
        {
          title: "Active Chats",
          value: "42",
          change: "+8%",
          hint: "week",
          description: "Ongoing team conversations",
          tone: "info",
          icon: "clock",
        },
        {
          title: "Teams Online",
          value: "6",
          change: "now",
          hint: "live",
          description: "Groups with active members",
          tone: "success",
          icon: "briefcase",
        },
      ]}
      rows={[
        {
          primary: "Priya Sharma",
          secondary: "Engineering",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "#engineering",
          c2: "Sprint board is updated",
          c3: "10:24 AM",
          status: "Online",
        },
        {
          primary: "Sofia Reyes",
          secondary: "Sales",
          avatar: "/images/avatars/avatar8.jpg",
          c1: "#sales",
          c2: "Need deck for Vestige",
          c3: "09:51 AM",
          status: "Unread",
        },
        {
          primary: "Maya Chen",
          secondary: "Design",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "#design",
          c2: "Shared new mockups",
          c3: "Yesterday",
          status: "Away",
        },
      ]}
    />
  );
}
