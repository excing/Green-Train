/**
 * 房间 ID 生成与管理
 */

import type { Train, DateString, ISOString, RoomIds } from './types';
import { toLocalAbsoluteTime } from './time';

/**
 * 生成房间 ID 集合
 * @param trainId 列车 ID
 * @param serviceDate 服务日期 (YYYY-MM-DD)
 * @param arrivalISO 到达时间 (ISO 8601)
 * @param carriageNumber 车厢号 (可选)
 * @param rowPadded 行号 (可选，两位零填充)
 * @param seatLetter 座位字母 (可选)
 */
export function generateRoomIds(
  trainId: string,
  serviceDate: DateString,
  arrivalISO: ISOString,
  carriageNumber?: number,
  rowPadded?: string,
  seatLetter?: string
): RoomIds {
  const global = `train-${trainId}-${serviceDate}-global_${arrivalISO}`;
  const carriage = carriageNumber
    ? `train-${trainId}-${serviceDate}-carriage-${carriageNumber}_${arrivalISO}`
    : '';
  const row = rowPadded
    ? `train-${trainId}-${serviceDate}-seat-row-${rowPadded}_${arrivalISO}`
    : '';
  const seat = rowPadded && seatLetter
    ? `train-${trainId}-${serviceDate}-seat-${rowPadded}${seatLetter}_${arrivalISO}`
    : '';

  return { global, carriage, row, seat };
}

/**
 * 从房间 ID 提取信息
 */
export function parseRoomId(roomId: string): {
  trainId: string;
  serviceDate: DateString;
  type: 'global' | 'carriage' | 'row' | 'seat';
  carriageNumber?: number;
  rowPadded?: string;
  seatLetter?: string;
  arrivalISO: ISOString;
} {
  // 格式: train-${trainId}-${serviceDate}-${type}_${arrivalISO}
  const match = roomId.match(/^train-([^-]+)-(\d{4}-\d{2}-\d{2})-(.+)_(.+)$/);
  if (!match) {
    throw new Error(`Invalid room ID: ${roomId}`);
  }

  const [, trainId, serviceDate, typeAndDetails, arrivalISO] = match;
  let type: 'global' | 'carriage' | 'row' | 'seat' = 'global';
  let carriageNumber: number | undefined;
  let rowPadded: string | undefined;
  let seatLetter: string | undefined;

  if (typeAndDetails === 'global') {
    type = 'global';
  } else if (typeAndDetails.startsWith('carriage-')) {
    type = 'carriage';
    carriageNumber = parseInt(typeAndDetails.replace('carriage-', ''), 10);
  } else if (typeAndDetails.startsWith('seat-row-')) {
    type = 'row';
    rowPadded = typeAndDetails.replace('seat-row-', '');
  } else if (typeAndDetails.startsWith('seat-')) {
    type = 'seat';
    const seatStr = typeAndDetails.replace('seat-', '');
    rowPadded = seatStr.slice(0, 2);
    seatLetter = seatStr.slice(2) as 'A' | 'B' | 'C' | 'D' | 'F';
  }

  return {
    trainId,
    serviceDate: serviceDate as DateString,
    type,
    carriageNumber,
    rowPadded,
    seatLetter,
    arrivalISO: arrivalISO as ISOString
  };
}

/**
 * 生成 PNR 码（取票码）
 */
export function generatePNRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 生成进入令牌
 */
export function generateJoinToken(): string {
  return 'jtk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 生成二维码载荷
 */
export function generateQRCodePayload(ticketId: string, baseUrl: string = 'https://webgreentrain.example'): string {
  return `${baseUrl}/join?ticket=${ticketId}`;
}

/**
 * 验证座位字母
 */
export function isValidSeatLetter(letter: string): letter is 'A' | 'B' | 'C' | 'D' | 'F' {
  return ['A', 'B', 'C', 'D', 'F'].includes(letter);
}

/**
 * 获取座位字母列表
 */
export function getSeatLetters(): ('A' | 'B' | 'C' | 'D' | 'F')[] {
  return ['A', 'B', 'C', 'D', 'F'];
}

/**
 * 格式化行号（两位零填充）
 */
export function formatRowNumber(row: number): string {
  return String(row).padStart(2, '0');
}

/**
 * 解析行号
 */
export function parseRowNumber(rowPadded: string): number {
  return parseInt(rowPadded, 10);
}

