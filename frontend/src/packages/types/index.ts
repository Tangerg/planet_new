/* -------------------------------------------------------------------------- */
/*  通用结构性接口                                                              */
/* -------------------------------------------------------------------------- */

/** 任意带稳定 id 的对象（Plugin / Manager 条目等都依赖它做去重与查找）。 */
export interface Identifiable {
  get id(): string;
}

/** 拥有一次性释放语义的对象（移除监听、停止定时器等）。 */
export interface Disposable {
  dispose(): void;
}

/** 拥有“清空全部内部状态”语义的对象。 */
export interface Clearable {
  clear(): void;
}
