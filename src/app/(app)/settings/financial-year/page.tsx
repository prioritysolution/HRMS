import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function FinancialYearPage() {
  return (
    <MasterDataPage
      moduleId="financial-year"
      modalSubtitle="Define financial year periods used across leave, payroll, and reports."
      emptyStateMessage="No financial years yet. Add a year to start configuring periods."
    />
  );
}
