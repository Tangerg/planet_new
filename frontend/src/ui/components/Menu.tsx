import React from "react";
import { Menu } from "@base-ui/react/menu";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { localize } from "@/i18n/text";
import { Icon } from "@/infra/icons";
import type { MenuItem } from "@/model/menu";
import "./Menu.css";
import { useAccent } from "@/hooks/accent";

// ============================================================
// ContextMenu — right-click menu on Base UI Menu primitives. Edge-aware
// positioning, keyboard navigation, and ARIA accessibility are handled by Base
// UI; styling lives in the co-located Menu.css. The menu is mounted only while
// open (Shell renders it on right-click), so there's an enter animation but no
// exit — closing unmounts it.
// ============================================================
type Props = {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
};

export function ContextMenu({ x, y, items, onClose }: Props) {
  const accent = useAccent();
  const { t } = useTranslation();
  return (
    <Menu.Root open onOpenChange={(open) => !open && onClose()}>
      {/* Virtual trigger at the cursor so Base UI anchors the popup there. */}
      <Menu.Trigger
        nativeButton={false}
        render={
          <span
            aria-hidden
            className="pointer-events-none fixed h-0 w-0"
            style={{ left: x, top: y }}
          />
        }
      />
      <Menu.Portal>
        <Menu.Positioner className="z-[9000]" sideOffset={0} collisionPadding={10}>
          <Menu.Popup
            className="ctxmenu glass-pop min-w-[212px]"
            render={
              <motion.div
                style={{ transformOrigin: "var(--transform-origin)" }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
              />
            }
          >
            {items.map((it, i) =>
              it.sep ? (
                <Menu.Separator key={i} className="ctxsep" />
              ) : (
                <Menu.Item key={i} className="ctxitem" onClick={() => it.onClick?.()}>
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
                    {localize(t, it.label)}
                  </span>
                  {it.hint && <span className="ctxhint">{it.hint}</span>}
                </Menu.Item>
              ),
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
