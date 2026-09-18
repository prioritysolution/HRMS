"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function RoleManagementPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="roles"
      modalSubtitle={t("security.pages.roles.subtitle")}
      emptyStateMessage={t("security.pages.roles.empty")}
    />
  );
}
