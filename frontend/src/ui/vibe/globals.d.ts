/**
 * Cross-screen bridge globals, installed on `window` at runtime by the resident
 * Shell. Cards/rows inside screens call these to trigger context menus and
 * enqueue. Follows the example vibe player's `window.__*` convention.
 *
 * NOTE: the morph trigger moved off `window` to a typed React context
 * (`@/infra/morph` → `useMorph`); these context-menu / enqueue handlers are the
 * same legacy pattern and the next candidates for the same treatment.
 */
export {};

declare global {
  interface Window {
    /** Context menu for a track. */
    __TRACKMENU?: (e: React.MouseEvent | MouseEvent, track: any) => void;
    /** Context menu for a collection (playlist/album). */
    __COLLMENU?: (e: React.MouseEvent | MouseEvent, item: any) => void;
    /** Drag-to-enqueue. */
    __ENQUEUE?: (trackId: string, next?: boolean) => void;
  }
}
