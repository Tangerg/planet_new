import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { localize } from "@/i18n/text";
import { HeroBackdrop } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { FlowWaves } from "@/components/xmb/FlowWaves";
import { XmbCategoryRail } from "@/components/xmb/XmbCategoryRail";
import { XmbItemColumn } from "@/components/xmb/XmbItemColumn";
import { useXmbKeyboard } from "@/components/xmb/useXmbKeyboard";
import {
  type XmbCat,
  type XmbItemModel,
  type XmbRowMemory,
  xmbMoveCategory,
  xmbSelectedRow,
  xmbSelectRow,
} from "@/model/navigation";

type Props = {
  cats: XmbCat[];
  playing: boolean;
  np?: { image?: string; seed?: number; grad?: string[] };
  showWaves?: boolean;
  onOpen?: (m: XmbItemModel, rect: DOMRect) => void;
  cState?: number;
  setCState?: (n: number) => void;
  rowsState?: XmbRowMemory;
  setRowsState?: React.Dispatch<React.SetStateAction<XmbRowMemory>>;
};

export const XMB = React.memo(function XMB({
  cats,
  playing: _playing,
  np,
  showWaves = true,
  onOpen,
  cState,
  setCState,
  rowsState,
  setRowsState,
}: Props) {
  const { t } = useTranslation();
  const [cI, setCI] = useState(1);
  const [rowsI, setRowsI] = useState<XmbRowMemory>({});
  const c = cState != null ? cState : cI;
  const setC = setCState || setCI;
  const rows = rowsState != null ? rowsState : rowsI;
  const setRows = setRowsState || setRowsI;
  const it = xmbSelectedRow(rows, c);
  const cat = cats[c];
  const item = cat.items[it];

  const setItem = (n: number) => setRows((r) => xmbSelectRow(r, c, n, cat.items.length));
  const move = (dc: number) => {
    setC(xmbMoveCategory(c, dc, cats.length));
  };

  const openItem = (m: XmbItemModel, target: Element) => {
    const node = target.querySelector("[data-art]") || target;
    if (onOpen) onOpen(m, (node as Element).getBoundingClientRect());
    else if (m.run) m.run();
  };

  useXmbKeyboard({ it, item, onOpen, move, setItem });

  return (
    <FadeIn className="absolute inset-0 overflow-hidden bg-[#06060a]">
      {np ? (
        <HeroBackdrop
          image={np.image}
          seed={np.seed}
          grad={np.grad}
          scrim="linear-gradient(180deg, rgba(6,6,10,.5) 0%, rgba(6,6,10,.66) 100%)"
        />
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 36%, #0c0d13 0%, #07070b 58%, #050507 100%)",
          }}
        />
      )}
      {showWaves && <FlowWaves />}

      <XmbItemColumn items={cat.items} it={it} onOpenItem={openItem} onSelectItem={setItem} />

      <XmbCategoryRail cats={cats} c={c} onSelect={setC} />

      <div className="absolute left-[84px] top-[84px] z-[8]">
        <div
          className="whitespace-nowrap text-[54px] font-light leading-none tracking-[0.005em] text-white"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,.45)" }}
        >
          {localize(t, cat.label)}
        </div>
      </div>

      <div className="absolute bottom-[22px] right-11 z-[8] flex justify-end gap-[26px]">
        {[
          ["◀ ▶", t("common.category")],
          ["▲ ▼", t("common.browse")],
          ["↵", t("common.open")],
        ].map(([k, l]) => (
          <span key={l} className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-accent">{k}</span>
            <span className="mlabel text-[10px] text-white/45">{l}</span>
          </span>
        ))}
      </div>
    </FadeIn>
  );
});
