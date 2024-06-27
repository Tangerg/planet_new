import {IContext, IPlugin} from "./types";
import {warn} from "../shared-utils/debug";

export abstract class Plugin implements IPlugin {
    private installed: boolean = false;
    protected context!: IContext;

    abstract get id(): string

    install(ctx: IContext): void {
        if (this.installed) {
            warn(`the plugin ${this.id} should be install only once`)
        }
        this.context = ctx
        this.installed = true;
    }

    abstract dispose(): void

    uninstall(): void {
        this.dispose()
        this.installed = false
    }
}

export default Plugin;
