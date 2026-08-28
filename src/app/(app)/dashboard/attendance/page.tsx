import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Attendance Overview"
      section="Dashboards"
      actionLabel="Export"
      columns={["Department", "Check In", "Hours"]}
      stats={[
        {
          title: "Present",
          value: "214",
          change: "91%",
          hint: "today",
          description: "Employees checked in today",
          tone: "success",
          icon: "users",
        },
        {
          title: "Late Arrivals",
          value: "12",
          change: "+3",
          hint: "today",
          description: "Arrived after shift start",
          tone: "warning",
          icon: "clock",
          positive: false,
        },
        {
          title: "Remote",
          value: "38",
          change: "+5%",
          hint: "week",
          description: "Working remotely today",
          tone: "info",
          icon: "calendar",
        },
      ]}
      rows={[
        {
          primary: "Priya Sharma",
          secondary: "Engineering",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Engineering",
          c2: "09:02 AM",
          c3: "7.8h",
          status: "Present",
        },
        {
          primary: "Daniel Ortiz",
          secondary: "Sales",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Sales",
          c2: "09:41 AM",
          c3: "7.1h",
          status: "Late",
        },
        {
          primary: "Maya Chen",
          secondary: "Design",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "Design",
          c2: "Remote",
          c3: "8.0h",
          status: "Remote",
        },
      ]}
    />
  );
}
