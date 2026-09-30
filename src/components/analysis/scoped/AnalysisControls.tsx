"use client";

import { useEffect } from "react";

/** Opens the browser's print dialog (Save as PDF) once the report has rendered. */
export function PrintOnLoad({ hi }: { hi: boolean }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 print:hidden">
      <span>{hi ? "प्रिंट विंडो में “PDF के रूप में सहेजें” चुनें।" : "Choose “Save as PDF” in the print dialog."}</span>
      <button
        type="button"
        onClick={() => window.print()}
        className="cursor-pointer rounded-lg bg-[#1677ff] px-4 py-2 font-semibold text-white hover:bg-[#0f63d8]"
      >
        {hi ? "PDF सहेजें / प्रिंट करें" : "Save PDF / Print"}
      </button>
    </div>
  );
}
