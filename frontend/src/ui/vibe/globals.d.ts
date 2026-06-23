/**
 * Cross-screen bridge globals, installed on `window` at runtime by the resident
 * Shell. Cards/rows inside screens call these to trigger the shared-element
 * morph, the ambient glow, context menus, and enqueue. Follows the example
 * vibe player's `window.__*` convention.
 */
export {};

type MorphRun = () => void;

declare global {
  interface Window {
    /**
     * Shared-element morph: grow from a start rect into the target Hero.
     * `rect`=start rect, `seed`/`grad`=cover colors, `run`=mounts the target
     * screen, `image`=real cover (so the flying tile shows the real art and
     * avoids a gradient→image color jump).
     */
    __MORPH?: (
      rect: DOMRect,
      seed?: number,
      grad?: string[],
      run?: MorphRun,
      image?: string,
    ) => void;
    /** Ambient glow: page background follows the focused card. */
    __AMBIENT?: (seed?: number, grad?: string[]) => void;
    /** Context menu for a track. */
    __TRACKMENU?: (e: React.MouseEvent | MouseEvent, track: any) => void;
    /** Context menu for a collection (playlist/album). */
    __COLLMENU?: (e: React.MouseEvent | MouseEvent, item: any) => void;
    /** Drag-to-enqueue. */
    __ENQUEUE?: (trackId: string, next?: boolean) => void;
  }
}
