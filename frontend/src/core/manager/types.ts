import { Clearable, Identifiable } from "../types";

/** Minimal contract for Manager entries: a stable id is required. */
export interface IManageable extends Identifiable {}

/**
 * Generic registry: bulk replace, add/remove/get, and clear. Plugin / Provider
 * and others use it internally to enforce id uniqueness.
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
