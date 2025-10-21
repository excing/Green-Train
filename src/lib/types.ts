// 项目核心类型定义，描述列车、站点与票务结构
export type TrainStatus = 'active' | 'paused' | 'hidden' | 'deprecated';

export interface CalendarRule {
  freq: 'DAILY';
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface CalendarIncludeRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  weekdays: number[]; // 1-7 (Mon-Sun)
}

export interface TrainCalendar {
  rules?: CalendarRule[];
  includes?: string[]; // YYYY-MM-DD
  include_ranges?: CalendarIncludeRange[];
  excludes?: string[]; // YYYY-MM-DD
}

export interface Station {
  name: string;
  description?: string;
  arrival_time?: string; // HH:mm+dd
  departure_time?: string; // HH:mm+dd
  points?: number; // 积分占位
}

export interface Train {
  id: string;
  name: string;
  theme?: string;
  description?: string;
  timezone: string; // IANA TZ
  status: TrainStatus;
  status_note?: string;
  carriages: number;
  rows_per_carriage: number;
  departure_time: string; // HH:mm+dd (首站发车)
  service_days?: number[]; // 1-7 (Mon-Sun)
  calendar?: TrainCalendar;
  sales_open_rel: string; // HH:mm+dd （相对服务日）
  sales_close_before_departure_minutes: number;
  stations: Station[];
}

export interface StationTiming {
  station: Station;
  arrivalAt?: Date; // 绝对时间（UTC 实例）
  departureAt?: Date; // 绝对时间（UTC 实例）
}

export interface TicketRequestDTO {
  trainId: string;
  date: string; // YYYY-MM-DD (服务日)
  fromIndex: number;
  toIndex: number;
  seats: number;
}

export type TimeMode = 'local' | 'train_tz';
