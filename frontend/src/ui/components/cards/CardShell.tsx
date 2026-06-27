// ============================================================
// CardShell — the interactive grid-card wrapper shared by every cover card.
// Composition over a god component: it owns ONLY the cross-cutting interaction
// (hover-lift via LiftCard, role=button + Enter/Space activation, optional
// right-click menu); content (art, title, fab) is passed as children, and what
// "activate" does (morph-open vs. play) is the caller's `onActivate`.
// ============================================================
import React from "react";
import { LiftCard } from "@/components/lift";
import { activateOnKey } from "@/lib/keys";

type CardShellProps = React.ComponentPropsWithoutRef<typeof LiftCard> & {
  label?: string;
  onActivate: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export function CardShell({ label, onActivate, onContextMenu, children, ...lift }: CardShellProps) {
  return (
    <LiftCard
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- interactive card container holds non-button content
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={activateOnKey(onActivate)}
      onContextMenu={onContextMenu}
      {...lift}
    >
      {children}
    </LiftCard>
  );
}
