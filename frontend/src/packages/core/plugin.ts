import {IContext, IPlugin} from "./types";
import {warn} from "../shared-utils/debug";

export abstract class Plugin implements IPlugin {
    private installed: boolean = false;
    private _context: IContext | undefined;

    abstract get id(): string

    /**
     * 获取context
     * 只有插件被install了之后才能获取到
     */
    get context(): IContext {
        if (!this.installed || !this._context) {
            throw new Error('Plugin not installed');
        }
        return this._context
    }

    beforeInstall(): void {
    }

    install(ctx: IContext): void {
        if (this.installed) {
            warn(`the plugin ${this.id} should be install only once`)
            return
        }
        this._context = ctx
        this.installed = true;
    }

    afterInstall(): void {
    }

    abstract dispose(): void

    beforeUninstall(): void {
        this.dispose()
    }

    uninstall(): void {
        if (!this.installed) {
            warn(`the plugin ${this.id} is not installed`);
            return;
        }
        this._context = undefined
        this.installed = false
    }

    afterUninstall(): void {
    }
}

export default Plugin;
