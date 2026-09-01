"use client";

import { useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { cn } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<"assets" | "asset-types">("assets");

  const toggleTab = () => {
    setActiveTab((prev) => (prev === "assets" ? "asset-types" : "assets"));
  };

  const titleRender = (
    <div className="flex items-center gap-1 select-none">
      <button
        onClick={() => setActiveTab("assets")}
        className={cn(
          "px-4 py-1.5 rounded-lg transition-colors duration-300 ease-in-out font-semibold text-center min-w-[130px]",
          activeTab === "assets"
            ? "btn btn-primary !py-1.5 !px-4 border-none shadow-sm cursor-default"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer bg-transparent"
        )}
      >
        Asset Master
      </button>

      <button
        onClick={toggleTab}
        className="flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 group focus:outline-none"
        title="Toggle View"
      >
        <ArrowRightLeft
          className={cn(
            "w-4 h-4 transition-transform duration-500 ease-in-out",
            activeTab === "assets" ? "rotate-0" : "-rotate-180"
          )}
        />
      </button>

      <button
        onClick={() => setActiveTab("asset-types")}
        className={cn(
          "px-4 py-1.5 rounded-lg transition-colors duration-300 ease-in-out font-semibold text-center min-w-[130px]",
          activeTab === "asset-types"
            ? "btn btn-primary !py-1.5 !px-4 border-none shadow-sm cursor-default"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer bg-transparent"
        )}
      >
        Asset Types
      </button>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      {activeTab === "assets" ? (
        <MasterDataPage moduleId="assets" titleRender={titleRender} />
      ) : (
        <MasterDataPage moduleId="asset-types" titleRender={titleRender} />
      )}
    </div>
  );
}