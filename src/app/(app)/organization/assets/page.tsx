"use client";

import { useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<"assets" | "asset-types">("assets");

  const topContent = (
    <div className="ess-tabs mb-3">
      <button
        type="button"
        className={`ess-tab${activeTab === "assets" ? " ess-tab--active" : ""}`}
        onClick={() => setActiveTab("assets")}
      >
        Asset Master
      </button>
      <button
        type="button"
        className={`ess-tab${activeTab === "asset-types" ? " ess-tab--active" : ""}`}
        onClick={() => setActiveTab("asset-types")}
      >
        Asset Types
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