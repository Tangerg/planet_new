/**
 * Placement of a floating popup relative to its trigger — shared by the Base
 * UI-backed popup wrappers (Tooltip / HoverCard / TextReveal) so the positioning
 * vocabulary is defined once. Mirrors Base UI's Positioner `side`/`align`, but
 * kept as our own type so callers stay decoupled from the library.
 */
export type PopupSide = "top" | "bottom" | "left" | "right";
export type PopupAlign = "start" | "center" | "end";
