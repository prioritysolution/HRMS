"use client";

import { useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n, translateHrmsLookup } from "@/i18n";

export default function AssetsPage() {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<"assets" | "asset-types">("assets");

  const topContent = (
    <div className="ess-tabs mb-3">
      <button
        type="button"
        className={`ess-tab${activeTab === "assets" ? " ess-tab--active" : ""}`}
        onClick={() => setActiveTab("assets")}
      >
        {translateHrmsLookup(language, "titles", "Asset Master")}
      </button>
      <button
        type="button"
        className={`ess-tab${activeTab === "asset-types" ? " ess-tab--active" : ""}`}
        onClick={() => setActiveTab("asset-types")}
      >
        {translateHrmsLookup(language, "titles", "Asset Type Master")}
      </button>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      {activeTab === "assets" ? (
        <MasterDataPage moduleId="assets" topContent={topContent} />
      ) : (
        <MasterDataPage moduleId="asset-types" topContent={topContent} />
      )}
    </div>
  );
}
