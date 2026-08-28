import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Expenses"
      section="Payroll"
      actionLabel="Add Expense"
      columns={["Category", "Submitted By", "Amount"]}
      stats={[
        {
          title: "This Month",
          value: "$18.4k",
          change: "+6%",
          hint: "month",
          description: "Total expenses claimed",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Approved",
          value: "$14.2k",
          change: "+4%",
          hint: "month",
          description: "Expenses cleared for payout",
          tone: "success",
          icon: "users",
        },
        {
          title: "Awaiting",
          value: "11",
          change: "3 urgent",
          hint: "review",
          description: "Claims pending approval",
          tone: "warning",
          icon: "clock",
        },
      ]}
      rows={[
        {
          primary: "Client travel — NYC",
          secondary: "EXP-881",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Travel",
          c2: "Daniel Ortiz",
          c3: "$1,240",
          status: "Pending",
        },
        {
          primary: "Design tooling licenses",
          secondary: "EXP-884",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "Software",
          c2: "Ava Collins",
          c3: "$480",
          status: "Approved",
        },
        {
          primary: "Team offsite catering",
          secondary: "EXP-889",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Meals",
          c2: "Priya Sharma",
          c3: "$620",
          status: "Paid",
        },
      ]}
    />
  );
}
