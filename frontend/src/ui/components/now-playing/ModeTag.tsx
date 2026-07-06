import type { ReactNode } from "react";

import { Button } from "@/components/controls/Button";

type Props = {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function ModeTag({ active, onClick, children }: Props) {
  return (
    <Button
      aria-pressed={!!active}
      className="mlabel cursor-pointer px-[12px] py-[7px] text-[10px]"
      onClick={onClick}
      style={{
        background: active
          ? "color-mix(in srgb, var(--accent) 18%, transparent)"
          : "rgba(6,6,9,.76)",
        color: active ? "var(--accent)" : "rgba(255,255,255,.78)",
        borderBottom: active ? "1px solid var(--accent)" : "1px solid transparent",
        boxShadow: active ? `0 8px 26px -18px var(--accent)` : "none",
      }}
    >
      {children}
    </Button>
  );
}
