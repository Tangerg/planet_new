import {IContext, IPlugin} from "./types";
import {warn} from "../shared-utils/debug";

/**
 * 插件抽象基类。子类只需实现：
 *   - id: 唯一标识
 *   - dispose(): 清理订阅 / 移除 audio listener
 *   - onInit()（可选）：context 已注入时执行的初始化（订阅事件、设置 audio listener）
 *
 * Planet 调度顺序：
 *   挂载：planet.constructor → forEach plugin.init(ctx)（→ onInit）
 *   卸载：planet.dispose() → 反序 plugin.dispose() + 清理 _context
 */
export abstract class Plugin implements IPlugin {
    private _installed: boolean = false;
    private _context: IContext | undefined;

    abstract get id(): string

    /**
     * 获取 context；只有插件被 init 之后才能拿到。
     */
    get context(): IContext {
        if (!this._installed || !this._context) {
            throw new Error(`Plugin ${this.id} not installed`)
        }
        return this._context
    }

    /**
     * 由 Planet 调用，注入 context 并触发 onInit。
     * 不建议子类 override 这个方法；如需初始化逻辑，覆写 onInit。
     */
    init(ctx: IContext): void {
        if (this._installed) {
            warn(`plugin ${this.id} should be installed only once`)
            return
        }
        this._context = ctx
        this._installed = true
        try {
            this.onInit()
        } catch (e) {
            // 初始化失败时回滚已注入的 context，避免半成品状态
            this._installed = false
            this._context = undefined
            throw e
        }
    }

    /**
     * 子类钩子：context 已可用，订阅事件 / 监听 audio。
     */
    protected onInit(): void {
    }

    abstract dispose(): void

    /**
     * 由 Planet 调用，先 dispose 再清 context，保证副作用一定被释放。
     * 不建议子类 override；如需清理逻辑，覆写 dispose。
     */
    uninstall(): void {
        if (!this._installed) {
            warn(`plugin ${this.id} is not installed`)
            return
        }
        try {
            this.dispose()
        } finally {
            this._context = undefined
            this._installed = false
        }
    }
}

export default Plugin
