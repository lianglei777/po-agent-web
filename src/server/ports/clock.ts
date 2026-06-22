/**
 * 时钟端口，抽象时间访问能力。
 *
 * 应用层通过此端口获取当前时间，便于在测试中替换为可控的时钟实现，
 * 避免直接依赖系统时间导致的不可测性。
 */
export interface Clock {
  /** 返回当前时间的 Unix 毫秒时间戳。 */
  now(): number;
}

/** 基于系统 `Date.now()` 的默认时钟实现。 */
export const systemClock: Clock = {
  now: () => Date.now(),
};
