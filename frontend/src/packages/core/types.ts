import { IEventEmitter } from "../event";
import { IManageable } from "../manager";
import { Disposable } from "../types";
import { PlanetEventMap } from "./event";

/** 注入到所有 Plugin 的运行时上下文：共享音频对象与事件总线。 */
export interface IContext {
  get audioElement(): HTMLAudioElement;

  get audioContext(): AudioContext;

  get hooks(): IEventEmitter<PlanetEventMap>;
}

/**
 * 插件接口。生命周期收敛为 init / dispose 两个钩子：
 *   - init(ctx) 由 Planet 在挂载时调一次，注入 context；子类通过 onInit 订阅事件、监听 audio。
 *   - dispose() 由 Planet 在卸载时调一次；子类清理订阅。
 *
 * 可选的 dependsOn 声明运行时依赖（按 plugin id 引用），Planet 会按拓扑序挂载，
 * 卸载时反序进行；缺失依赖或循环依赖会在 Planet 构造时抛错。
 */
export interface IPlugin extends IManageable, Disposable {
  readonly dependsOn?: readonly string[];

  init(ctx: IContext): void;

  dispose(): void;
}

/** Planet 是 Plugin 容器；对 UI 暴露事件总线和按 id 取插件的能力。 */
export interface IPlanet extends Disposable {
  get hooks(): IEventEmitter<PlanetEventMap>;

  getPlugin<T extends IPlugin = IPlugin>(id: string): T | null;

  /** 反序卸载所有插件、清空事件总线。可用于切换 provider 等场景。 */
  dispose(): void;
}
