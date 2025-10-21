// 售票窗口计算：确定开售、停售时间并判断销售状态
import type { Train } from './types';
import { computeStationDateTimes, parseRelativeTime } from './time';

/**
 * 计算列车在某服务日的开售时间
 * @param train 列车对象
 * @param serviceDate 服务日期 YYYY-MM-DD
 * @returns 开售的绝对时间 Date 实例
 */
export function computeSalesOpenAt(train: Train, serviceDate: string): Date {
  const { hour, minute, dayOffset } = parseRelativeTime(train.sales_open_rel);
  const { timezone } = train;
  // 基于服务日计算开售时间
  const timings = computeStationDateTimes(train, serviceDate);
  const base = timings?.[0]?.departureAt ?? new Date();
  // base 是首站发车时间，用于构建开售时间的参考
  const baseLocal = new Date(base.getTime());
  // 使用嵌入的辅助函数构造时区时间以避免循环依赖
  const ymd = serviceDate;
  const open = zonedByParts(ymd, hour, minute, dayOffset, timezone);
  return open;
}

/**
 * 计算列车在某服务日从指定站点的停售时间
 * @param train 列车对象
 * @param serviceDate 服务日期 YYYY-MM-DD
 * @param fromIndex 上车站索引
 * @returns 停售的绝对时间 Date 实例，若无发车时间则返回 null
 */
export function computeSalesCloseAt(train: Train, serviceDate: string, fromIndex = 0): Date | null {
  const timings = computeStationDateTimes(train, serviceDate);
  const st = timings[fromIndex];
  const depart = st?.departureAt;
  if (!depart) return null;
  // 发车前 N 分钟停止售票
  const closeMs = train.sales_close_before_departure_minutes * 60_000;
  return new Date(depart.getTime() - closeMs);
}

/**
 * 判断列车在某服务日从指定站点是否正在售票
 * @param train 列车对象
 * @param serviceDate 服务日期 YYYY-MM-DD
 * @param fromIndex 上车站索引
 * @param now 当前时间
 * @returns 是否在售
 */
export function isOnSale(train: Train, serviceDate: string, fromIndex = 0, now: Date = new Date()): boolean {
  const open = computeSalesOpenAt(train, serviceDate);
  const close = computeSalesCloseAt(train, serviceDate, fromIndex);
  if (!close) return false;
  // 在开售和停售时间窗口内
  return now.getTime() >= open.getTime() && now.getTime() <= close.getTime();
}

/**
 * 本地辅助函数：根据时区本地时间构造 UTC Date
 * （避免导入私有辅助函数以减少依赖）
 */
function zonedByParts(ymd: string, hour: number, minute: number, dayOffset: number, timeZone: string): Date {
  // 解析日期
  const { y, m, d } = ((): { y: number; m: number; d: number } => {
    const mm = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!mm) throw new Error('Invalid date');
    return { y: parseInt(mm[1], 10), m: parseInt(mm[2], 10), d: parseInt(mm[3], 10) };
  })();
  // 计算时区偏移量（分钟）
  const at = (date: Date) => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = fmt.formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return Math.round((asUTC - date.getTime()) / 60000);
  };
  // 日期加减天数（考虑时区）
  const addDays = (y: number, m: number, d: number, add: number) => {
    const approx = new Date(Date.UTC(y, m - 1, d, 12, 0));
    const later = new Date(approx.getTime() + add * 86400000);
    const f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const s = f.format(later);
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
    return { y: parseInt(m2[1], 10), m: parseInt(m2[2], 10), d: parseInt(m2[3], 10) };
  };
  // 应用天数偏移
  const base = addDays(y, m, d, dayOffset);
  // 两轮近似以处理夏令时
  const approx = new Date(Date.UTC(base.y, base.m - 1, base.d, hour, minute));
  const off1 = at(approx);
  const epoch = Date.UTC(base.y, base.m - 1, base.d, hour, minute) - off1 * 60000;
  const approx2 = new Date(epoch);
  const off2 = at(approx2); // 修正夏令时导致的偏差
  const final = Date.UTC(base.y, base.m - 1, base.d, hour, minute) - off2 * 60000;
  return new Date(final);
}
