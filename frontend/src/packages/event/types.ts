import { Clearable } from "../types";

/** 事件名 → payload 类型的映射；emitter 的类型参数。 */
export interface IEventMap {
  readonly [key: string]: unknown;
}

/** 单个事件监听器：接收对应事件的 payload。 */
export interface IEventListener<E extends IEventMap, K extends keyof E>
  extends Function {
  (arg: E[K]): void;
}

/** 标准发布/订阅 emitter；clear() 用于一次性清空所有监听。 */
export interface IEventEmitter<E extends IEventMap> extends Clearable {
  on<K extends keyof E>(
    name: K,
    fn: IEventListener<E, K>,
    ctx?: Object,
  ): IEventEmitter<E>;

  once<K extends keyof E>(
    name: K,
    fn: IEventListener<E, K>,
    ctx?: Object,
  ): IEventEmitter<E>;

  off<K extends keyof E>(name: K, fn?: IEventListener<E, K>): IEventEmitter<E>;

  emit<K extends keyof E>(name: K, arg?: E[K]): void;
}

export default IEventEmitter;
