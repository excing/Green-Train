// 项目核心类型定义，描述列车、站点与票务结构

/**
 * 列车状态枚举
 * - active: 正常运营中
 * - paused: 临时暂停
 * - hidden: 隐藏不显示（内部使用）
 * - deprecated: 已废弃
 */
export type TrainStatus = 'active' | 'paused' | 'hidden' | 'deprecated';

/**
 * 日历规则：定义重复运行的日期范围
 */
export interface CalendarRule {
  freq: 'DAILY'; // 频率类型，目前仅支持每日
  start: string; // 开始日期 YYYY-MM-DD
  end: string; // 结束日期 YYYY-MM-DD
}

/**
 * 日历包含范围：定义特定时间段内的运行星期
 */
export interface CalendarIncludeRange {
  start: string; // 范围开始日期 YYYY-MM-DD
  end: string; // 范围结束日期 YYYY-MM-DD
  weekdays: number[]; // 运行的星期几，1-7 (周一至周日)
}

/**
 * 列车日历配置：组合多种规则确定列车运行日
 */
export interface TrainCalendar {
  rules?: CalendarRule[]; // 基础规则列表（如每日运行）
  includes?: string[]; // 额外包含的特定日期列表 YYYY-MM-DD
  include_ranges?: CalendarIncludeRange[]; // 包含的日期范围与星期组合
  excludes?: string[]; // 排除的特定日期列表 YYYY-MM-DD（优先级最高）
}

/**
 * 车站信息：列车途经站点的基础数据
 */
export interface Station {
  name: string; // 站点名称
  description?: string; // 站点描述（如地标、特色等）
  arrival_time?: string; // 到达时间，格式 HH:mm+dd，+dd 表示相对服务日的天数偏移
  departure_time?: string; // 发车时间，格式 HH:mm+dd
  points?: number; // 该站点的累计积分值，用于计算区间积分
}

/**
 * 列车主数据：包含车次基本信息、时刻表、运行规则等
 */
export interface Train {
  id: string; // 车次标识（如 G1234）
  name: string; // 车次名称
  theme?: string; // 主题标签（如"风景线"、"夜行车"等）
  description?: string; // 车次描述
  timezone: string; // 车次运行时区（IANA 时区标识，如 Asia/Shanghai）
  status: TrainStatus; // 当前状态
  status_note?: string; // 状态说明（如暂停原因）
  carriages: number; // 车厢总数
  rows_per_carriage: number; // 每节车厢的排数
  departure_time: string; // 首站发车时间 HH:mm+dd
  service_days?: number[]; // 运行的星期几（1-7，周一至周日），不指定则默认每天
  calendar?: TrainCalendar; // 详细日历配置
  sales_open_rel: string; // 售票开始时间（相对服务日的时间偏移 HH:mm+dd）
  sales_close_before_departure_minutes: number; // 发车前多少分钟停止售票
  stations: Station[]; // 途经站点列表（按顺序）
}

/**
 * 站点时刻：将相对时间转换为绝对时间后的站点信息
 */
export interface StationTiming {
  station: Station; // 关联的站点
  arrivalAt?: Date; // 到达的绝对时间（UTC Date 实例）
  departureAt?: Date; // 发车的绝对时间（UTC Date 实例）
}

/**
 * 购票请求数据传输对象
 */
export interface TicketRequestDTO {
  trainId: string; // 车次 ID
  date: string; // 服务日期 YYYY-MM-DD
  fromIndex: number; // 上车站索引
  toIndex: number; // 下车站索引
  seats: number; // 座位数量
}

/**
 * 时间显示模式
 * - local: 显示用户本地时间
 * - train_tz: 显示列车运行时区时间
 */
export type TimeMode = 'local' | 'train_tz';
