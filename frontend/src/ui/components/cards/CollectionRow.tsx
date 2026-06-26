// ============================================================
// CollectionRow — compact list row for a collection (cover + name/sub + meta),
// the high-density alternative to the card grid. Opening flies the morph from
// the small cover (`.clrt`).
// ============================================================
import React, { useState } from "react";
import type { CardItem } from "@/model/adapt";
import { Icon, Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";

type CollectionRowProps = {
  item: CardItem;
  sub?: string;
  meta?: string;
  round?: boolean;
  onOpen: () => void;
  onPlay?: () => void;
};

export function CollectionRow({ item, sub, meta, round, onOpen, onPlay }: CollectionRowProps) {
  const [hover, setHover] = useState(false);
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const activate = (e: React.MouseEvent | React.KeyboardEvent) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round,
      artSelector: ".clrt",
      run: onOpen,
    });
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={activate}
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- div serves as interactive row container
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(e);
        }
      }}
      onContextMenu={(e) => collMenu(e, item)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "9px 14px",
        cursor: "pointer",
        background: hover ? "rgba(255,255,255,.06)" : "transparent",
        transition: "background .15s",
        borderRadius: 8,
      }}
    >
      <div style={{ position: "relative", flex: "0 0 auto" }}>
        <Art
          className="clrt"
          seed={item.coverSeed}
          grad={item.gradient}
          image={item.image}
          images={item.images}
          style={{ width: 48, height: 48, borderRadius: round ? "50%" : 4 }}
        />
        {onPlay && hover && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label="Play"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,.42)",
              border: 0,
              color: "#fff",
              cursor: "pointer",
              borderRadius: round ? "50%" : 4,
            }}
          >
            <Icon.play size={18} />
          </Button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 300,
            color: "rgba(255,255,255,.5)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sub}
        </div>
      </div>
      {meta && (
        <span
          className="mlabel"
          style={{ color: "rgba(255,255,255,.4)", fontSize: 11, flex: "0 0 auto" }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}
