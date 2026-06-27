// ============================================================
// Empty — the shared "nothing here yet" placeholder. One muted, light-weight
// look for every empty list/section (queue, history, comments, search…), so
// they stop drifting across three different dim colours. Padding / alignment
// are layout-specific → pass them via className.
// ============================================================
import React from "react";
import { cn } from "@/lib/cn";

export function Empty({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-10 font-light text-tx-3", className)}>{children}</div>;
}
