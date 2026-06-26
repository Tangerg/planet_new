// ============================================================
// StatPill — frosted rounded stat chip used in the Artist header.
// ============================================================
import React from "react";

export function StatPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="tag"
      style={{
        background: "rgba(255,255,255,.14)",
        backdropFilter: "blur(8px)",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}
