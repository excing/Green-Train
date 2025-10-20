/**
 * 房间ID生成模块
 * 遵循 spec.zh-CN.md 5) 节的房间ID规范
 */

import type { Train, ServiceDate, ISODateTime, RoomIds, TimezoneName } from '$lib/types';
import { toLocalAbsoluteTime } from './time';

/**
 * 格式化行号为两位零填充
 */
function padRow(row: number): string {
  return String(row).padStart(2, '0');
}

/**
 * 生成房间ID
 * 格式：train-${trainId}-${serviceDate}-${type}_${arrivalISO}
 */
export function generateRoomIds(
  train: Train,
  serviceDate: ServiceDate,
  toStationIndex: number,
  carriageNumber: number,
  row: number,
  seatLetter: 'A' | 'B' | 'C' | 'D' | 'F'
): RoomIds {
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  
  // 获取到达站的到达时刻
  const toStation = train.stations[toStationIndex];
  if (!toStation || !toStation.arrival_time) {
    throw new Error(`Invalid to_station_index: ${toStationIndex}`);
  }
  
  // 计算到达的本地绝对时间（ISO 格式）
  const arrivalAbsLocal = toLocalAbsoluteTime(serviceDate, toStation.arrival_time, timezone);
  
  // 提取 ISO 字符串中的日期和时间部分（包含时区偏移）
  // 例如：2025-08-16T09:45:00+08:00
  const arrivalISO = arrivalAbsLocal;
  
  const baseId = `train-${train.id}-${serviceDate}`;
  
  return {
    global: `${baseId}-global_${arrivalISO}`,
    carriage: `${baseId}-carriage-${carriageNumber}_${arrivalISO}`,
    row: `${baseId}-seat-row-${padRow(row)}_${arrivalISO}`,
    seat: `${baseId}-seat-${padRow(row)}${seatLetter}_${arrivalISO}`
  };
}

/**
 * 生成全车房间ID
 */
export function generateGlobalRoomId(
  train: Train,
  serviceDate: ServiceDate,
  toStationIndex: number
): string {
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  const toStation = train.stations[toStationIndex];
  
  if (!toStation || !toStation.arrival_time) {
    throw new Error(`Invalid to_station_index: ${toStationIndex}`);
  }
  
  const arrivalAbsLocal = toLocalAbsoluteTime(serviceDate, toStation.arrival_time, timezone);
  return `train-${train.id}-${serviceDate}-global_${arrivalAbsLocal}`;
}

/**
 * 生成车厢房间ID
 */
export function generateCarriageRoomId(
  train: Train,
  serviceDate: ServiceDate,
  toStationIndex: number,
  carriageNumber: number
): string {
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  const toStation = train.stations[toStationIndex];
  
  if (!toStation || !toStation.arrival_time) {
    throw new Error(`Invalid to_station_index: ${toStationIndex}`);
  }
  
  const arrivalAbsLocal = toLocalAbsoluteTime(serviceDate, toStation.arrival_time, timezone);
  return `train-${train.id}-${serviceDate}-carriage-${carriageNumber}_${arrivalAbsLocal}`;
}

/**
 * 生成同排房间ID
 */
export function generateRowRoomId(
  train: Train,
  serviceDate: ServiceDate,
  toStationIndex: number,
  row: number
): string {
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  const toStation = train.stations[toStationIndex];
  
  if (!toStation || !toStation.arrival_time) {
    throw new Error(`Invalid to_station_index: ${toStationIndex}`);
  }
  
  const arrivalAbsLocal = toLocalAbsoluteTime(serviceDate, toStation.arrival_time, timezone);
  return `train-${train.id}-${serviceDate}-seat-row-${padRow(row)}_${arrivalAbsLocal}`;
}

/**
 * 生成席位房间ID
 */
export function generateSeatRoomId(
  train: Train,
  serviceDate: ServiceDate,
  toStationIndex: number,
  row: number,
  seatLetter: 'A' | 'B' | 'C' | 'D' | 'F'
): string {
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  const toStation = train.stations[toStationIndex];
  
  if (!toStation || !toStation.arrival_time) {
    throw new Error(`Invalid to_station_index: ${toStationIndex}`);
  }
  
  const arrivalAbsLocal = toLocalAbsoluteTime(serviceDate, toStation.arrival_time, timezone);
  return `train-${train.id}-${serviceDate}-seat-${padRow(row)}${seatLetter}_${arrivalAbsLocal}`;
}

/**
 * 验证房间ID格式
 */
export function isValidRoomId(roomId: string): boolean {
  // 基本格式检查
  const pattern = /^train-[A-Za-z0-9_-]+-\d{4}-\d{2}-\d{2}-(global|carriage-\d+|seat-row-\d{2}|seat-\d{2}[A-DF])_\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
  return pattern.test(roomId);
}

/**
 * 从房间ID提取信息
 */
export function parseRoomId(roomId: string): {
  trainId: string;
  serviceDate: ServiceDate;
  type: 'global' | 'carriage' | 'row' | 'seat';
  carriageNumber?: number;
  row?: number;
  seatLetter?: string;
  arrivalISO: ISODateTime;
} | null {
  // 全车
  const globalMatch = roomId.match(/^train-([A-Za-z0-9_-]+)-(\d{4}-\d{2}-\d{2})-global_(.+)$/);
  if (globalMatch) {
    return {
      trainId: globalMatch[1],
      serviceDate: globalMatch[2] as ServiceDate,
      type: 'global',
      arrivalISO: globalMatch[3] as ISODateTime
    };
  }
  
  // 车厢
  const carriageMatch = roomId.match(/^train-([A-Za-z0-9_-]+)-(\d{4}-\d{2}-\d{2})-carriage-(\d+)_(.+)$/);
  if (carriageMatch) {
    return {
      trainId: carriageMatch[1],
      serviceDate: carriageMatch[2] as ServiceDate,
      type: 'carriage',
      carriageNumber: parseInt(carriageMatch[3], 10),
      arrivalISO: carriageMatch[4] as ISODateTime
    };
  }
  
  // 同排
  const rowMatch = roomId.match(/^train-([A-Za-z0-9_-]+)-(\d{4}-\d{2}-\d{2})-seat-row-(\d{2})_(.+)$/);
  if (rowMatch) {
    return {
      trainId: rowMatch[1],
      serviceDate: rowMatch[2] as ServiceDate,
      type: 'row',
      row: parseInt(rowMatch[3], 10),
      arrivalISO: rowMatch[4] as ISODateTime
    };
  }
  
  // 席位
  const seatMatch = roomId.match(/^train-([A-Za-z0-9_-]+)-(\d{4}-\d{2}-\d{2})-seat-(\d{2})([A-DF])_(.+)$/);
  if (seatMatch) {
    return {
      trainId: seatMatch[1],
      serviceDate: seatMatch[2] as ServiceDate,
      type: 'seat',
      row: parseInt(seatMatch[3], 10),
      seatLetter: seatMatch[4],
      arrivalISO: seatMatch[5] as ISODateTime
    };
  }
  
  return null;
}

