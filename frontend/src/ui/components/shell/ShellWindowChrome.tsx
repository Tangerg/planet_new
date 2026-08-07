import type React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/controls/Button";
import { Equalizer } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { minimiseWindow, quitApp, toggleMaximiseWindow } from "@/infra/wails";

type Props = {
  showTools: boolean;
  showBack: boolean;
  playing: boolean;
  canOpenNowPlaying: boolean;
  onBack: () => void;
  onNowPlaying: () => void;
  onMenu: React.MouseEventHandler<HTMLButtonElement>;
};

const dragStyle = { "--wails-draggable": "drag" } as React.CSSProperties;
const noDragStyle = { "--wails-draggable": "no-drag" } as React.CSSProperties;

export function ShellWindowChrome({
  showTools,
  showBack,
  playing,
  canOpenNowPlaying,
  onBack,
  onNowPlaying,
  onMenu,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      {/* Frameless-window drag handle for the top edge. Its z-index must sit
          ABOVE the screens' background / scroll layers (z ≤ 3) so a drag over
          their empty top band moves the window — but BELOW any control that lives
          up here (NowPlaying's close, Detail's sticky header at z-30): a strip
          stacked over a control silently turns the control's clicks into window
          drags. The faux traffic lights / tools float above everything at z-60. */}
      <div aria-hidden className="absolute inset-x-0 top-0 z-[10] h-[30px]" style={dragStyle} />

      <div className="traffic" style={noDragStyle}>
        {(
          [
            ["r", t("common.close"), quitApp],
            ["y", "Minimise", minimiseWindow],
            ["g", "Maximise", toggleMaximiseWindow],
          ] as const
        ).map(([cls, label, action]) => (
          <Button key={cls} aria-label={label} className={cls} onClick={action} title={label} />
        ))}
      </div>

      {showTools && (
        <div className="win-tools" style={noDragStyle}>
          {showBack && (
            <Button onClick={onBack} aria-label={t("common.back")}>
              <Icon.back size={20} />
            </Button>
          )}
          <Button
            onClick={onNowPlaying}
            aria-label={t("common.nowPlaying")}
            disabled={!canOpenNowPlaying}
          >
            <Equalizer playing={playing} color="currentColor" size={18} />
          </Button>
          <Button onClick={onMenu} aria-label={t("common.moreActions")}>
            <Icon.kebab size={20} />
          </Button>
        </div>
      )}
    </>
  );
}
