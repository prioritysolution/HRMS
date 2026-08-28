import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Invoices"
      section="Payroll"
      actionLabel="Create Invoice"
      columns={["Client", "Amount", "Due"]}
      stats={[
        {
          title: "Outstanding",
          value: "$86k",
          change: "+7%",
          hint: "month",
          description: "Unpaid invoice balance",
          tone: "warning",
          icon: "briefcase",
        },
        {
          title: "Collected",
          value: "$214k",
          change: "+12%",
          hint: "month",
          description: "Payments received",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Overdue",
          value: "5",
          change: "-1",
          hint: "week",
          description: "Invoices past due date",
          tone: "danger",
          icon: "calendar",
          positive: false,
        },
      ]}
      rows={[
        {
          primary: "INV-2048",
          secondary: "Annual license",
          avatar: "/images/lead_com_logos/vestige.png",
          c1: "Vestige Co",
          c2: "$12,800",
          c3: "05 Sep 2026",
          status: "Sent",
        },
        {
          primary: "INV-2051",
          secondary: "Seat expansion",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: "Stellar Media",
          c2: "$4,200",
          c3: "01 Sep 2026",
          status: "Paid",
        },
        {
          primary: "INV-2054",
          secondary: "Professional services",
          avatar: "/images/lead_com_logos/atom.png",
          c1: "Atom Soft",
          c2: "$9,450",
          c3: "22 Aug 2026",
          status: "Overdue",
        },
      ]}
    />
  );
}
