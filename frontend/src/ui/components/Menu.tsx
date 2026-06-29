import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { Icon } from "@/infra/icons";
import "./Menu.css";

// ============================================================
// ContextMenu — right-click menu using Radix DropdownMenu primitives.
// Edge-aware positioning, keyboard navigation, and ARIA accessibility
// are handled by Radix; styling lives in the co-located Menu.css.
// ============================================================
type MenuItem = {
  label?: string;
  icon?: string;
  accent?: boolean;
  sep?: boolean;
  danger?: boolean;
  hint?: string;
  onClick?: () => void;
};

type Props = {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
  accent: string;
};

export function ContextMenu({ x, y, items, onClose, accent }: Props) {
  return (
    <DropdownMenu.Root open onOpenChange={(open) => !open && onClose()}>
      {/* Virtual trigger at the cursor position so Radix positions the content there. */}
      <DropdownMenu.Trigger asChild>
        <span
          aria-hidden
          className="pointer-events-none fixed h-0 w-0"
          style={{ left: x, top: y }}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="ctxmenu glass-pop"
          sideOffset={0}
          collisionPadding={10}
          asChild
        >
          <motion.div
            className="z-[9000] min-w-[212px]"
            style={{ transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)" }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
          >
            {items.map((it, i) =>
              it.sep ? (
                <DropdownMenu.Separator key={i} className="ctxsep" />
              ) : (
                <DropdownMenu.Item key={i} className="ctxitem" onSelect={() => it.onClick?.()}>
                  {it.icon && (
                    <span
                      className="ctxico"
                      style={{
                        color: it.danger ? "#ff6b6b" : it.accent ? accent : "rgba(255,255,255,.66)",
                      }}
                    >
                      {React.createElement(Icon[it.icon], { size: 16 })}
                    </span>
                  )}
                  <span className="ctxlabel" style={{ color: it.danger ? "#ff6b6b" : "#fff" }}>
                    {it.label}
                  </span>
                  {it.hint && <span className="ctxhint">{it.hint}</span>}
                </DropdownMenu.Item>
              ),
            )}
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
