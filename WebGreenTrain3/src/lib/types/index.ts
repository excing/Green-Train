/**
 * WebGreenTrain3 核心数据类型定义
 * 遵循 spec.zh-CN.md 和 business-flow.zh-CN.md 规范
 */

// ============ 基础类型 ============

/** 相对时刻格式：HH:mm+dd */
export type RelativeTime = string & { readonly __brand: 'RelativeTime' };

/** 服务日期：YYYY-MM-DD */
export type ServiceDate = string & { readonly __brand: 'ServiceDate' };

/** ISO 8601 时间字符串 */
export type ISODateTime = string & { readonly __brand: 'ISODateTime' };

/** IANA 时区名 */
export type TimezoneName = string & { readonly __brand: 'TimezoneName' };

// ============ 车次模板 ============

export interface Station {
  name: string;
  description?: string;
  /** 到达时刻（始发站不得提供） */
  arrival_time?: RelativeTime;
  /** 发车时刻（终到站不得提供） */
  departure_time?: RelativeTime;
}

export interface CalendarRule {
  freq: 'DAILY' | 'WEEKLY';
  weekdays?: number[]; // 1..7，1=周一
  start: ServiceDate;
  end: ServiceDate;
}

export interface DateRange {
  start: ServiceDate;
  end: ServiceDate;
  weekdays?: number[];
}

export interface Calendar {
  includes?: ServiceDate[];
  excludes?: ServiceDate[];
  include_ranges?: DateRange[];
  exclude_ranges?: DateRange[];
  rules?: CalendarRule[];
}

export type TrainStatus = 'draft' | 'hidden' | 'paused' | 'active' | 'deprecated' | 'archived';

export interface Train {
  id: string;
  name: string;
  theme: string;
  description?: string;
  timezone?: TimezoneName; // 默认 Asia/Shanghai
  status: TrainStatus;
  status_note?: string;
  
  // 车厢与座位
  carriages: number;
  rows_per_carriage: number;
  
  // 时刻
  departure_time: RelativeTime;
  
  // 运行日
  service_days?: number[];
  calendar?: Calendar;
  
  // 售票
  sales_open_rel?: RelativeTime;
  sales_close_before_departure_minutes: number;
  
  // 站点
  stations: Station[];
}

// ============ 票据与支付 ============

export interface PaymentInfo {
  amount_fen: number; // 金额（分）
  currency: 'CNY';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paid_at?: ISODateTime;
  provider?: string;
  transaction_id?: string;
}

export interface RoomIds {
  global: string;
  carriage: string;
  row: string;
  seat: string;
}

export type TicketStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded' | 'completed';
export type RoomStatus = 'pending' | 'open' | 'closed';

export interface JoinTokens {
  global?: string;
  carriage?: string;
  row?: string;
  seat?: string;
}

export interface Ticket {
  ticket_id: string;
  user_id: string;
  order_id?: string;
  train_id: string;
  service_date: ServiceDate;
  timezone: TimezoneName;
  
  // 站点信息
  from_station_index: number;
  to_station_index: number;
  from_station_name: string;
  to_station_name: string;
  
  // 座位信息
  carriage_number: number;
  row: number;
  seat_letter: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // 时间信息
  depart_abs_local: ISODateTime;
  arrival_abs_local: ISODateTime;
  depart_abs_utc: ISODateTime;
  arrival_abs_utc: ISODateTime;
  
  // 房间与状态
  room_ids: RoomIds;
  room_status: RoomStatus;
  status: TicketStatus;
  
  // 时间戳
  created_at: ISODateTime;
  updated_at: ISODateTime;
  
  // 支付信息
  payment: PaymentInfo;
  
  // 列车快照
  train_snapshot: Partial<Train>;
  
  // 取票与进入
  pnr_code: string;
  qrcode_payload: string;
  join_tokens: JoinTokens;
}

// ============ 聊天消息 ============

export interface MessageSender {
  user_id: string;
  nickname?: string;
  avatar_url?: string;
}

export interface MessageContent {
  text: string;
}

export interface ChatMessage {
  room_id: string;
  msg_id: string;
  client_msg_id: string;
  seq: number; // 递增序号
  sent_at: ISODateTime;
  sender: MessageSender;
  content: MessageContent;
}

// ============ 购票请求 ============

export type SeatStrategy = 'sequential' | 'smart_random';

export interface CreateTicketRequest {
  train_id: string;
  service_date: ServiceDate;
  from_station_index: number;
  to_station_index: number;
  seat_strategy: SeatStrategy;
  user_id: string;
}

// ============ 错误码 ============

export type ErrorCode =
  | 'USER_ALREADY_ON_TRIP'
  | 'SEAT_CONFLICT_RETRY'
  | 'NOT_ON_SALE'
  | 'SALE_NOT_OPEN'
  | 'SALE_CLOSED'
  | 'ROOM_CLOSED'
  | 'MESSAGE_TOO_LARGE'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

