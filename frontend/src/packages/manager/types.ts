import { Clearable, Identifiable } from "../types";

/** Manager 中存放的最小契约：必须有稳定 id。 */
export interface IManageable extends Identifiable {}

/**
 * 通用注册表：支持批量替换、增删查、清空，
 * Plugin / Provider 等内部都使用其实现做 id-唯一性约束。
 */
export interface IManager<T extends IManageable> extends Clearable {
  apply(items: T[]): void;

  add(item: T): void;

  remove(id: string): void;

  all(): ReadonlyArray<Readonly<T>>;

  get(id: string): Readonly<T> | null;

  has(id: string): boolean;

  get size(): number;
}
