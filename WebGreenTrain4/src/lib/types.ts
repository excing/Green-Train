/**
 * 核心数据类型定义
 */

// 相对时刻格式：HH:mm+dd
export type RelativeTime = string & { readonly __brand: 'RelativeTime' };

// 日期格式：YYYY-MM-DD
export type DateString = string & { readonly __brand: 'DateString' };

// ISO 8601 时间字符串
export type ISOString = string & { readonly __brand: 'ISOString' };

// 车次状态
export type TrainStatus = 'draft' | 'hidden' | 'paused' | 'active' | 'deprecated' | 'archived';

// 房间状态
export type RoomStatus = 'pending' | 'open' | 'closed';

// 票据状态
export type TicketStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded' | 'completed';

// 站点信息
export interface Station {
  name: string;
  description?: string;
  arrival_time?: RelativeTime;
  departure_time?: RelativeTime;
}

// 日历规则
export interface CalendarRule {
  freq: 'DAILY' | 'WEEKLY';
  weekdays?: number[];
  start: DateString;
  end: DateString;
}

// 日期范围
export interface DateRange {
  start: DateString;
  end: DateString;
  weekdays?: number[];
}

// 日历配置
export interface Calendar {
  includes?: DateString[];
  excludes?: DateString[];
  include_ranges?: DateRange[];
  exclude_ranges?: DateRange[];
  rules?: CalendarRule[];
}

// 车次模板
export interface Train {
  id: string;
  name: string;
  theme: string;
  description?: string;
  timezone: string;
  status: TrainStatus;
  status_note?: string;
  carriages: number;
  rows_per_carriage: number;
  departure_time: RelativeTime;
  service_days?: number[];
  calendar?: Calendar;
  sales_open_rel?: RelativeTime;
  sales_close_before_departure_minutes: number;
  stations: Station[];
}

// 房间 ID 集合
export interface RoomIds {
  global: string;
  carriage: string;
  row: string;
  seat: string;
}

// 支付信息
export interface PaymentInfo {
  amount_fen: number;
  currency: 'CNY';
  status: string;
  paid_at?: ISOString;
  provider?: string;
  transaction_id?: string;
}

// 进入令牌
export interface JoinTokens {
  global?: string;
  carriage?: string;
  row?: string;
  seat?: string;
}

// 票据对象
export interface Ticket {
  ticket_id: string;
  user_id: string;
  order_id: string;
  train_id: string;
  service_date: DateString;
  timezone: string;
  from_station_index: number;
  to_station_index: number;
  from_station_name: string;
  to_station_name: string;
  carriage_number: number;
  row: number;
  seat_letter: 'A' | 'B' | 'C' | 'D' | 'F';
  depart_abs_local: ISOString;
  arrival_abs_local: ISOString;
  depart_abs_utc: ISOString;
  arrival_abs_utc: ISOString;
  room_ids: RoomIds;
  room_status: RoomStatus;
  status: TicketStatus;
  created_at: ISOString;
  updated_at: ISOString;
  payment: PaymentInfo;
  train_snapshot: Partial<Train>;
  pnr_code: string;
  qrcode_payload: string;
  join_tokens: JoinTokens;
}

// 实时消息
export interface RealtimeMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  content: string;
  timestamp: ISOString;
  type: 'text' | 'system' | 'notification';
}

// 房间信息
export interface Room {
  room_id: string;
  train_id: string;
  service_date: DateString;
  status: RoomStatus;
  created_at: ISOString;
  updated_at: ISOString;
  participants: string[];
}

