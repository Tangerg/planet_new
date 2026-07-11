export type XmbItemVisualState = Readonly<{
  opacity: number;
  gap: number;
  iconSize: number;
  iconRadius: number;
  iconShadow: "active" | "idle";
  nearBlur: boolean;
  titleFontSize: number;
  titleLetterSpacing: string;
  titleColor: string;
  titleMaxWidth: number;
}>;

/** Pure visual projection for one XMB row at a signed cursor offset. */
export function xmbItemVisualState(active: boolean, offset: number): XmbItemVisualState {
  const distance = Math.abs(offset);
  const previous = offset < 0;
  return {
    opacity: active ? 1 : Math.max(0.14, (previous ? 0.4 : 0.54) - 0.13 * distance),
    gap: active ? 22 : 18,
    iconSize: active ? 52 : 30,
    iconRadius: active ? 12 : 8,
    iconShadow: active ? "active" : "idle",
    nearBlur: !active && distance === 1,
    titleFontSize: active ? 27 : 18,
    titleLetterSpacing: active ? ".02em" : ".005em",
    titleColor: active ? "#fff" : "rgba(255,255,255,.8)",
    titleMaxWidth: active ? 600 : 340,
  };
}
