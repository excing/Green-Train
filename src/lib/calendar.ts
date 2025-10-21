// 列车日历工具：判断服务日与生成可运行日期序列
import type { Train } from './types';
import { todayInZone } from './time';

/**
 * 解析 YYYY-MM-DD 日期字符串
 */
function parseYMD(ymd: string) {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid date: ${ymd}`);
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

/**
 * 比较两个日期字符串的大小
 * @returns 0 表示相等，-1 表示 a < b，1 表示 a > b
 */
function cmpYMD(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * 计算指定日期在时区中是星期几
 * @param ymd 日期 YYYY-MM-DD
 * @param timeZone IANA 时区标识
 * @returns 1-7 (周一至周日)
 */
function dayOfWeek(ymd: string, timeZone: string): number {
  // 使用中午 12:00 以避免夏令时边界问题
  const { y, m, d } = parseYMD(ymd);
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0));
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const wk = fmt.format(base); // Mon, Tue...
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[wk] ?? 1;
}

/**
 * 判断列车在某日期是否有服务
 * 综合考虑 service_days、calendar 规则、包含/排除列表
 * @param train 列车对象
 * @param ymd 日期 YYYY-MM-DD
 * @returns 是否为服务日
 */
export function isServiceDay(train: Train, ymd: string): boolean {
  const tz = train.timezone;
  const cal = train.calendar || {};
  const dow = dayOfWeek(ymd, tz);

  let included = false;

  // 检查基础星期规则
  if (train.service_days && train.service_days.length > 0) {
    if (train.service_days.includes(dow)) included = true;
  } else {
    // 未指定则默认包含
    included = true;
  }

  // 检查日历规则（如 DAILY 范围）
  if (cal.rules && cal.rules.length) {
    for (const r of cal.rules) {
      if (r.freq === 'DAILY' && cmpYMD(ymd, r.start) >= 0 && cmpYMD(ymd, r.end) <= 0) {
        included = true;
        break;
      }
    }
  }

  // 检查包含范围（带星期过滤）
  if (cal.include_ranges && cal.include_ranges.length) {
    for (const rng of cal.include_ranges) {
      if (cmpYMD(ymd, rng.start) >= 0 && cmpYMD(ymd, rng.end) <= 0) {
        if (!rng.weekdays || rng.weekdays.includes(dow)) included = true;
      }
    }
  }

  // 检查单独包含的日期
  if (cal.includes && cal.includes.includes(ymd)) included = true;

  // 排除列表优先级最高
  if (cal.excludes && cal.excludes.includes(ymd)) return false;

  return included;
}

/**
 * 获取列车未来的服务日期列表
 * @param train 列车对象
 * @param futureDays 查询未来的天数
 * @param start 起始时间
 * @returns 服务日期字符串数组 YYYY-MM-DD
 */
export function getServiceDates(train: Train, futureDays = 30, start: Date = new Date()): string[] {
  const tz = train.timezone;
  const startYmd = todayInZone(tz, start);
  const out: string[] = [];
  // 逐日检查并筛选服务日
  for (let i = 0; i < futureDays; i++) {
    const base = new Date(start);
    const ymd = (() => {
      // 通过毫秒数偏移计算日期
      const dt = new Date(base.getTime() + i * 86400000);
      return todayInZone(tz, dt);
    })();
    if (isServiceDay(train, ymd)) out.push(ymd);
  }
  return out;
}
