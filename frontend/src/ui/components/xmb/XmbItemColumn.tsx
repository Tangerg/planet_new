import { activateOnKey } from "@/lib/keys";
import type { XmbItemModel } from "@/model/navigation";

import { XMB_ANCHOR, XMB_BAR_Y, XMB_EASE, subItemTransform } from "./geometry";
import { XmbItem } from "./XmbItem";

/**
 * The active category's vertical sub-item list: a single column anchored at the
 * bar, with passed items floating above and upcoming below. Clicking / Enter on
 * the active row opens it; on any other row it becomes the selection.
 */
export function XmbItemColumn({
  items,
  it,
  onOpenItem,
  onSelectItem,
}: {
  items: XmbItemModel[];
  it: number;
  onOpenItem: (m: XmbItemModel, target: Element) => void;
  onSelectItem: (index: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `calc(${XMB_ANCHOR} - 30px)`,
        top: XMB_BAR_Y,
        zIndex: 6,
      }}
    >
      {items.map((m, i) => {
        const o = i - it;
        const { x, y } = subItemTransform(o);
        return (
          <div
            key={m.key}
            onClick={(e) => (o === 0 ? onOpenItem(m, e.currentTarget) : onSelectItem(i))}
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- div is a visual layout container in XMB column
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKey((e) => {
              if (o === 0) onOpenItem(m, e.currentTarget);
              else onSelectItem(i);
            })}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              cursor: "pointer",
              transform: `translate(${x}px, ${y}px)`,
              transition: `transform .38s ${XMB_EASE}`,
            }}
          >
            <XmbItem item={m} active={o === 0} o={o} />
          </div>
        );
      })}
    </div>
  );
}
