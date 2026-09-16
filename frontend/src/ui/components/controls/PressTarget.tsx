import type React from "react";

import { activateOnKey } from "@/lib/keys";

type PressTargetProps = {
  label: string;
  onActivate: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
};

export function PressTarget({
  label,
  onActivate,
  disabled,
  className,
  style,
  onContextMenu,
  children,
}: PressTargetProps) {
  return (
    <div
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich content (art/rows/titles) is invalid inside a native <button>; role="button" + keyboard activation is the accessible equivalent.
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={activateOnKey(onActivate)}
      onContextMenu={onContextMenu}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
