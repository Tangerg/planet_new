import React from "react";
import { cn } from "@/lib/cn";

export function Empty({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-10 font-light text-tx-3", className)}>{children}</div>;
}
