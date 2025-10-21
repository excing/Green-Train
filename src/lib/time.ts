// 时间与时区计算工具，负责将服务日相对时间转换为绝对时间
import type { Station, StationTiming, Train } from './types';

/**
 * 解析相对时间字符串为时、分、天偏移量
 * @param input 相对时间字符串，格式：HH:mm 或 HH:mm+dd
 * @returns 包含小时、分钟和天数偏移的对象
 * @example parseRelativeTime("14:30+01") => { hour: 14, minute: 30, dayOffset: 1 }
 */
export function parseRelativeTime(input: string): { hour: number; minute: number; dayOffset: number } {
  const m = input.match(/^(\d{2}):(\d{2})(?:\+(\d{2}))?$/);
  if (!m) throw new Error(`Invalid relative time: ${input}`);
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const dayOffset = m[3] ? parseInt(m[3], 10) : 0; // 未指定则为当天
  return { hour, minute, dayOffset };
}

/**
 * 数字补零辅助函数
 */
function pad2(n: number): string { return n.toString().padStart(2, '0'); }

/**
 * 将 Date 对象格式化为本地时间字符串
 * @param d Date 实例
 * @returns 格式化字符串 YYYY-MM-DD HH:mm
 */
export function formatLocal(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

/**
 * 将 Date 对象格式化为指定时区的时间字符串
 * @param d Date 实例
 * @param timeZone IANA 时区标识（如 Asia/Shanghai）
 * @returns 时区本地时间字符串 YYYY-MM-DD HH:mm
 */
export function formatInTimeZone(d: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  // en-CA 格式输出为 YYYY-MM-DD, HH:MM
  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const out = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
  return out;
}

/**
 * 按列车时区格式化时间
 * @param d Date 实例
 * @param train 列车对象
 * @returns 列车时区的时间字符串
 */
export function formatTrainTz(d: Date, train: Train): string {
  return formatInTimeZone(d, train.timezone);
}

/**
 * 解析 YYYY-MM-DD 日期字符串
 */
function parseYMD(ymd: string): { y: number; m: number; d: number } {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid date: ${ymd}`);
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

/**
 * 在指定日期上加减天数
 * @param ymd 基准日期 YYYY-MM-DD
 * @param add 要增加的天数（负数表示减少）
 * @param timeZone 可选时区，用于处理夏令时切换
 * @returns 计算后的日期 YYYY-MM-DD
 */
function ymdAddDays(ymd: string, add: number, timeZone?: string): string {
  const { y, m, d } = parseYMD(ymd);
  // 使用中午时刻以避免夏令时切换带来的日期跳变
  const base = timeZone
    ? zonedDateUTC(y, m, d, 12, 0, timeZone)
    : new Date(Date.UTC(y, m - 1, d, 12, 0));
  const next = new Date(base.getTime() + add * 86400000);
  const yy = timeZone ? getPartsInZone(next, timeZone).year : next.getUTCFullYear();
  const mm = timeZone ? getPartsInZone(next, timeZone).month : next.getUTCMonth() + 1;
  const dd = timeZone ? getPartsInZone(next, timeZone).day : next.getUTCDate();
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}

/**
 * 获取 Date 在指定时区的年月日时分秒
 */
function getPartsInZone(d: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = fmt.formatToParts(d);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second')
  };
}

/**
 * 计算某时刻在指定时区的 UTC 偏移量（分钟）
 * @param at Date 实例
 * @param timeZone 时区标识
 * @returns 偏移分钟数
 */
function tzOffsetMinutes(at: Date, timeZone: string): number {
  // 偏移量 = (本地时间解释为 UTC) - 实际 epoch
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = fmt.formatToParts(at);
  const y = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'month')?.value ?? '0', 10);
  const d = parseInt(parts.find((p) => p.type === 'day')?.value ?? '0', 10);
  const hh = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const mm = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const ss = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10);
  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  return Math.round((asUTC - at.getTime()) / 60000);
}

/**
 * 根据时区本地时间构造 UTC Date 对象
 * 使用两次逼近法处理夏令时边界情况
 * @param year 年
 * @param month 月（1-12）
 * @param day 日
 * @param hour 时
 * @param minute 分
 * @param timeZone IANA 时区标识
 * @returns UTC Date 实例
 */
export function zonedDateUTC(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  // 两轮近似以获取时区本地时间对应的正确 UTC 时刻
  const approx = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset1 = tzOffsetMinutes(approx, timeZone);
  const epoch = Date.UTC(year, month - 1, day, hour, minute) - offset1 * 60000;
  const approx2 = new Date(epoch);
  const offset2 = tzOffsetMinutes(approx2, timeZone); // 修正夏令时可能导致的偏差
  const finalEpoch = Date.UTC(year, month - 1, day, hour, minute) - offset2 * 60000;
  return new Date(finalEpoch);
}

/**
 * 将 Date 转换为时区本地时间的各个组成部分
 * @param d Date 实例
 * @param timeZone 时区标识
 * @returns 包含年月日时分及原 Date 的对象
 */
export function toZonedDateTime(d: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; date: Date } {
  const p = getPartsInZone(d, timeZone);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, date: d };
}

/**
 * 计算列车在某服务日的全部站点绝对时刻
 * @param train 列车对象
 * @param serviceDate 服务日期 YYYY-MM-DD
 * @returns 各站点的到达和发车绝对时间列表
 */
export function computeStationDateTimes(train: Train, serviceDate: string): StationTiming[] {
  return train.stations.map((st: Station) => {
    const res: StationTiming = { station: st };
    // 计算到达时间
    if (st.arrival_time) {
      const { hour, minute, dayOffset } = parseRelativeTime(st.arrival_time);
      const ymd = ymdAddDays(serviceDate, dayOffset, train.timezone);
      const { y, m, d } = parseYMD(ymd);
      res.arrivalAt = zonedDateUTC(y, m, d, hour, minute, train.timezone);
    }
    // 计算发车时间
    if (st.departure_time) {
      const { hour, minute, dayOffset } = parseRelativeTime(st.departure_time);
      const ymd = ymdAddDays(serviceDate, dayOffset, train.timezone);
      const { y, m, d } = parseYMD(ymd);
      res.departureAt = zonedDateUTC(y, m, d, hour, minute, train.timezone);
    }
    return res;
  });
}

/**
 * 获取指定时区的"今天"日期
 * @param timeZone IANA 时区标识
 * @param base 基准时刻，默认为当前时间
 * @returns YYYY-MM-DD 格式的日期字符串
 */
export function todayInZone(timeZone: string, base: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  // en-CA 格式输出 YYYY-MM-DD
  return fmt.format(base);
}

/**
 * 计算列车从指定站点的下一次发车时间
 * @param train 列车对象
 * @param fromIndex 上车站索引
 * @param now 当前时间
 * @param futureDays 向未来搜索的天数
 * @returns 包含服务日期和发车时刻的对象，若无则返回 null
 */
export function computeNextDeparture(train: Train, fromIndex = 0, now: Date = new Date(), futureDays = 60): { date: string; when?: Date } | null {
  const startYmd = todayInZone(train.timezone, now);
  // 逐日搜索未来发车时刻
  for (let i = 0; i < futureDays; i++) {
    const ymd = ymdAddDays(startYmd, i, train.timezone);
    // 日历检查在 calendar.ts 中进行以避免循环依赖；此处仅做最小检查
    const first = train.stations[fromIndex];
    if (!first || !first.departure_time) continue;
    const { hour, minute, dayOffset } = parseRelativeTime(first.departure_time);
    const departYmd = ymdAddDays(ymd, dayOffset, train.timezone);
    const { y, m, d } = parseYMD(departYmd);
    const dt = zonedDateUTC(y, m, d, hour, minute, train.timezone);
    if (dt.getTime() > now.getTime()) return { date: ymd, when: dt };
  }
  return null;
}
