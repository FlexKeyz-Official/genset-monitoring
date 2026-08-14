"use client";

import { ToastState } from "@/lib/genset/types";

export function Toast({ toast }: { toast: ToastState | null }) {
  const visible = !!toast;
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg text-white text-xs font-bold shadow-2xl transition-all duration-300 ${
        toast?.type === "success" ? "bg-emerald-600" : "bg-red-600"
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
    >
      {toast?.message}
    </div>
  );
}
