export type TrainStatus = 'draft' | 'hidden' | 'paused' | 'active' | 'deprecated' | 'archived';

export interface TrainStation {
  name: string;
  description?: string;
  arrival_time?: string; // HH:mm+dd
  departure_time?: string; // HH:mm+dd
  points?: number; // cost from previous station
}

export interface TrainCalendarRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  weekdays?: number[]; // 1..7
}

export interface TrainCalendarRule {
  freq: 'DAILY' | 'WEEKLY';
  weekdays?: number[];
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface TrainCalendar {
  includes?: string[];
  excludes?: string[];
  include_ranges?: TrainCalendarRange[];
  exclude_ranges?: TrainCalendarRange[];
  rules?: TrainCalendarRule[];
}

export interface Train {
  id: string;
  name: string;
  theme: string;
  description?: string;
  timezone?: string; // IANA
  status: TrainStatus;
  status_note?: string;
  carriages: number;
  rows_per_carriage: number;
  departure_time: string; // HH:mm+dd
  service_days?: number[]; // 1..7
  calendar?: TrainCalendar;
  sales_open_rel?: string; // HH:mm+dd
  sales_close_before_departure_minutes: number;
  stations: TrainStation[];
}
