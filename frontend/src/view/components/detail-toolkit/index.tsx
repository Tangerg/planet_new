import React from "react";

import { formatDurationMillisecond } from "@kernel/shared-utils/time";

import { Tooltip } from "@/ui/tooltip";

/* -------------------------------------------------------------------------- */
/*  ActionIcon —— 详情页 hero 操作行通用图标按钮                                  */
/* -------------------------------------------------------------------------- */

export interface ActionIconProps {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const ActionIcon: React.FC<ActionIconProps> = ({
  label,
  onClick,
  children,
}) => (
  <Tooltip content={label}>
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  </Tooltip>
);

/* -------------------------------------------------------------------------- */
/*  formatHumanDuration —— 把毫秒压成 "1 hr 23 min" / "45 sec" 的人话文案         */
/* -------------------------------------------------------------------------- */

export function formatHumanDuration(durationMs: number): string {
  const [h, m, s] = formatDurationMillisecond(durationMs).split(":").map(Number);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (h === 0) parts.push(`${s} sec`);
  return parts.join(" ");
}
