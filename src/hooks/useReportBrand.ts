"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_REPORT_BRAND,
  resolveReportBrand,
  type ReportBrand,
} from "@/lib/report-export";

/** Shared org brand (logo + company name) for Excel/PDF report templates. */
export function useReportBrand() {
  const [brand, setBrand] = useState<ReportBrand>(DEFAULT_REPORT_BRAND);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const next = await resolveReportBrand();
      if (!cancelled) {
        setBrand(next);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { brand, loading };
}
