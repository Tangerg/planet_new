import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { Icon } from "./primitives";

// ============================================================
// ContextMenu — right-click menu using Radix DropdownMenu primitives.
// Edge-aware positioning, keyboard navigation, and ARIA accessibility
// are handled by Radix; styling reuses the existing vibe.css classes.
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
          style={{ position: "fixed", left: x, top: y, width: 0, height: 0, pointerEvents: "none" }}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ctxmenu" sideOffset={0} collisionPadding={10} asChild>
          <motion.div
            style={{
              zIndex: 9000,
              minWidth: 212,
              transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)",
            }}
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
