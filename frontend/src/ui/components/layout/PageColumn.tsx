import React from "react";
import { cn } from "@/lib/cn";

export function PageColumn({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto box-border w-full max-w-[1320px] px-12", className)} style={style}>
      {children}
    </div>
  );
}
