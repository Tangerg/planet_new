import { IContext, IPlugin } from "./types";
import { warn } from "@shared/debug";

/**
 * Abstract plugin base. Subclasses implement only:
 *   - id: unique identifier
 *   - dispose(): clean up subscriptions / remove audio listeners
 *   - onInit() (optional): initialization once context is injected (subscribe to events, set audio listeners)
 *
 * Planet scheduling:
 *   mount:   planet.constructor -> forEach plugin.init(ctx) (-> onInit)
 *   unmount: planet.dispose() -> plugin.dispose() in reverse + clear _context
 */
export abstract class Plugin implements IPlugin {
  private _installed: boolean = false;
  private _context: IContext | undefined;

  abstract get id(): string;

  /**
   * The injected context; available only after the plugin is initialized.
   */
  get context(): IContext {
    if (!this._installed || !this._context) {
      throw new Error(`Plugin ${this.id} not installed`);
    }
    return this._context;
  }

  /**
   * Called by Planet to inject context and trigger onInit.
   * Subclasses should not override this; put init logic in onInit.
   */
  init(ctx: IContext): void {
    if (this._installed) {
      warn(`plugin ${this.id} should be installed only once`);
      return;
    }
    this._context = ctx;
    this._installed = true;
    try {
      this.onInit();
    } catch (e) {
      // On init failure, roll back the injected context to avoid a half-built state
      this._installed = false;
      this._context = undefined;
      throw e;
    }
  }

  /**
   * Subclass hook: context is available; subscribe to events / listen to audio.
   */
  protected onInit(): void {}

  abstract dispose(): void;

  /**
   * Called by Planet: dispose first, then clear context, so side effects are always released.
   * Subclasses should not override this; put cleanup in dispose.
   */
  uninstall(): void {
    if (!this._installed) {
      warn(`plugin ${this.id} is not installed`);
      return;
    }
    try {
      this.dispose();
    } finally {
      this._context = undefined;
      this._installed = false;
    }
  }
}
