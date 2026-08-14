"use client";

import { GensetData } from "@/lib/genset/types";

export function SystemBanner({ data }: { data: GensetData | null }) {
  const faultLatched = !!data?.fault_latched;
  return (
    <section className={`panel border-l-4 ${faultLatched ? "border-l-red-500" : "border-l-emerald-500"}`}>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="eyebrow">System condition</p>
          <h2 className="font-mono font-bold text-sm mt-1">
            {(data?.message as string) || "Connect to the Genset controller."}
          </h2>
        </div>
        {faultLatched && (
          <span className="badge bad">{(data?.trip_cause as string) || "FAULT ACTIVE"}</span>
        )}
      </div>
    </section>
  );
}
