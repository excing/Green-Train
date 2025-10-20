/**
 * 选座策略模块
 * 遵循 business-flow.zh-CN.md 8) 节的选座规则
 */

import type { Train, SeatStrategy } from '$lib/types';

export interface Seat {
  carriage: number;
  row: number;
  letter: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface OccupiedSeat extends Seat {
  userId: string;
}

/**
 * 座位字母顺序
 */
const SEAT_LETTERS: ('A' | 'B' | 'C' | 'D' | 'F')[] = ['A', 'B', 'C', 'D', 'F'];

/**
 * 生成所有可用座位
 */
export function generateAllSeats(train: Train): Seat[] {
  const seats: Seat[] = [];
  
  for (let carriage = 1; carriage <= train.carriages; carriage++) {
    for (let row = 1; row <= train.rows_per_carriage; row++) {
      for (const letter of SEAT_LETTERS) {
        seats.push({ carriage, row, letter });
      }
    }
  }
  
  return seats;
}

/**
 * 顺序选座策略
 * 遍历顺序：车厢号从小到大 → 行号从小到大 → 座位字母 A, B, C, D, F
 */
export function sequentialSeatSelection(
  train: Train,
  occupiedSeats: Set<string>
): Seat | null {
  for (let carriage = 1; carriage <= train.carriages; carriage++) {
    for (let row = 1; row <= train.rows_per_carriage; row++) {
      for (const letter of SEAT_LETTERS) {
        const seatKey = `${carriage}-${row}-${letter}`;
        if (!occupiedSeats.has(seatKey)) {
          return { carriage, row, letter };
        }
      }
    }
  }
  
  return null;
}

/**
 * 计算两个座位之间的距离
 */
function calculateDistance(seat1: Seat, seat2: Seat): number {
  // 不同车厢距离很远
  if (seat1.carriage !== seat2.carriage) {
    return 1000 + Math.abs(seat1.carriage - seat2.carriage) * 100;
  }
  
  // 同车厢：曼哈顿距离
  const rowDist = Math.abs(seat1.row - seat2.row);
  const letterDist = Math.abs(SEAT_LETTERS.indexOf(seat1.letter) - SEAT_LETTERS.indexOf(seat2.letter));
  
  return rowDist * 10 + letterDist;
}

/**
 * 计算座位的"靠近有人"评分
 * 分数越高表示越靠近已占座
 */
function calculateProximityScore(seat: Seat, occupiedSeats: OccupiedSeat[]): number {
  if (occupiedSeats.length === 0) {
    return 0;
  }
  
  // 找最近的已占座
  let minDistance = Infinity;
  for (const occupied of occupiedSeats) {
    const dist = calculateDistance(seat, occupied);
    minDistance = Math.min(minDistance, dist);
  }
  
  // 距离越近，分数越高（用倒数）
  return 1000 / (minDistance + 1);
}

/**
 * 简单哈希函数用于伪随机打散
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为 32 位整数
  }
  return Math.abs(hash);
}

/**
 * 智能随机选座策略
 * 目标：让上车后更快成局，优先填充已有乘客附近
 */
export function smartRandomSeatSelection(
  train: Train,
  occupiedSeats: OccupiedSeat[],
  userId: string,
  serviceDate: string
): Seat | null {
  const allSeats = generateAllSeats(train);
  const occupiedSet = new Set(occupiedSeats.map(s => `${s.carriage}-${s.row}-${s.letter}`));
  
  // 过滤可用座位
  const availableSeats = allSeats.filter(seat => {
    const seatKey = `${seat.carriage}-${seat.row}-${seat.letter}`;
    return !occupiedSet.has(seatKey);
  });
  
  if (availableSeats.length === 0) {
    return null;
  }
  
  // 如果整车为空，优先顺序：C → D/B → F → A（居中优先）
  if (occupiedSeats.length === 0) {
    const priorityOrder: ('A' | 'B' | 'C' | 'D' | 'F')[] = ['C', 'D', 'B', 'F', 'A'];
    
    for (const letter of priorityOrder) {
      const seat = availableSeats.find(s => s.letter === letter);
      if (seat) return seat;
    }
  }
  
  // 计算每个座位的评分
  const scoredSeats = availableSeats.map(seat => ({
    seat,
    score: calculateProximityScore(seat, occupiedSeats)
  }));
  
  // 找最高分
  const maxScore = Math.max(...scoredSeats.map(s => s.score));
  
  // 获取所有最高分座位
  const topSeats = scoredSeats.filter(s => s.score === maxScore).map(s => s.seat);
  
  // 使用伪随机数做稳定打散
  const seed = simpleHash(`${userId}${serviceDate}`);
  const selectedIndex = seed % topSeats.length;
  
  return topSeats[selectedIndex];
}

/**
 * 选座主函数
 */
export function selectSeat(
  train: Train,
  strategy: SeatStrategy,
  occupiedSeats: OccupiedSeat[],
  userId: string,
  serviceDate: string
): Seat | null {
  if (strategy === 'sequential') {
    const occupiedSet = new Set(occupiedSeats.map(s => `${s.carriage}-${s.row}-${s.letter}`));
    return sequentialSeatSelection(train, occupiedSet);
  } else if (strategy === 'smart_random') {
    return smartRandomSeatSelection(train, occupiedSeats, userId, serviceDate);
  }
  
  return null;
}

/**
 * 座位转换为字符串表示
 */
export function seatToString(seat: Seat): string {
  return `${seat.carriage}车厢 ${String(seat.row).padStart(2, '0')}排${seat.letter}座`;
}

/**
 * 座位转换为简短表示
 */
export function seatToShortString(seat: Seat): string {
  return `${seat.carriage}车${String(seat.row).padStart(2, '0')}${seat.letter}`;
}

