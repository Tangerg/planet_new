import { IContext, IPlugin } from "./types";
import { warn } from "@shared/debug";

/**
 * Abstract plugin base. Subclasses implement only:
 *   - id: unique identifier
 *   - onInit() (optional): subscribe to events / attach audio listeners once context is injected
 *   - onDispose() (optional): release whatever onInit acquired
 *
 * Planet drives a symmetric lifecycle; the base owns the context bookkeeping so
 * a teardown can never leave a half-mounted plugin behind:
 *   mount:   init(ctx)  -> set context -> onInit()
 *   unmount: dispose()  -> onDispose() -> clear context
 * Subclasses never touch the installed/context fields and never override init/dispose.
 */
export abstract class Plugin implements IPlugin {
  private installed = false;
  private ctx: IContext | undefined;

  abstract get id(): string;

  /** The injected context; available only between init() and dispose(). */
  get context(): IContext {
    if (!this.installed || !this.ctx) {
      throw new Error(`Plugin ${this.id} not installed`);
    }
    return this.ctx;
  }

  /**
   * Called by Planet at mount to inject context and run onInit.
   * Subclasses put init logic in onInit, not here.
   */
  init(ctx: IContext): void {
    if (this.installed) {
      warn(`plugin ${this.id} should be installed only once`);
      return;
    }
    this.ctx = ctx;
    this.installed = true;
    try {
      this.onInit();
    } catch (e) {
      // Roll back the injected context on a failed onInit so a half-built plugin never lingers.
      this.installed = false;
      this.ctx = undefined;
      throw e;
    }
  }

  /**
   * Called by Planet at unmount: run onDispose (context still valid), then
   * release it — always, even if onDispose throws. Subclasses put cleanup in
   * onDispose, not here.
   */
  dispose(): void {
    if (!this.installed) {
      warn(`plugin ${this.id} is not installed`);
      return;
    }
    try {
      this.onDispose();
    } finally {
      this.ctx = undefined;
      this.installed = false;
    }
  }

  /** Subclass hook: context is available; subscribe to events / attach audio listeners. */
  protected onInit(): void {}

  /** Subclass hook: symmetric teardown; release whatever onInit acquired (context still valid). */
  protected onDispose(): void {}
}
