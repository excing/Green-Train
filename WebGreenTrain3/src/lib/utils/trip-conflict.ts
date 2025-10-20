/**
 * 单车限制检查模块
 * 遵循 business-flow.zh-CN.md 9) 节的单用户单车限制
 */

import type { Ticket, ISODateTime } from '$lib/types';

/**
 * 检查两个时间段是否重叠
 */
function timeRangesOverlap(
  start1: ISODateTime,
  end1: ISODateTime,
  start2: ISODateTime,
  end2: ISODateTime
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  return s1 < e2 && s2 < e1;
}

/**
 * 检查用户是否已有重叠行程
 * @param userTickets 用户的所有有效票据
 * @param newDepartTime 新购票的发车时间
 * @param newArrivalTime 新购票的到达时间
 * @returns 是否存在冲突
 */
export function hasConflictingTrip(
  userTickets: Ticket[],
  newDepartTime: ISODateTime,
  newArrivalTime: ISODateTime
): boolean {
  // 只检查有效的票据（已支付、已检票、已上车、已完成）
  const validStatuses = ['paid', 'checked_in', 'boarded', 'completed'];
  
  for (const ticket of userTickets) {
    if (!validStatuses.includes(ticket.status)) {
      continue;
    }
    
    // 检查时间是否重叠
    if (timeRangesOverlap(
      ticket.depart_abs_utc,
      ticket.arrival_abs_utc,
      newDepartTime,
      newArrivalTime
    )) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取用户的冲突票据
 */
export function getConflictingTickets(
  userTickets: Ticket[],
  newDepartTime: ISODateTime,
  newArrivalTime: ISODateTime
): Ticket[] {
  const validStatuses = ['paid', 'checked_in', 'boarded', 'completed'];
  
  return userTickets.filter(ticket => {
    if (!validStatuses.includes(ticket.status)) {
      return false;
    }
    
    return timeRangesOverlap(
      ticket.depart_abs_utc,
      ticket.arrival_abs_utc,
      newDepartTime,
      newArrivalTime
    );
  });
}

/**
 * 检查用户是否已在指定列车上
 */
export function isUserAlreadyOnTrain(
  userTickets: Ticket[],
  trainId: string,
  serviceDate: string
): boolean {
  const validStatuses = ['paid', 'checked_in', 'boarded', 'completed'];
  
  return userTickets.some(ticket => {
    return (
      ticket.train_id === trainId &&
      ticket.service_date === serviceDate &&
      validStatuses.includes(ticket.status)
    );
  });
}

/**
 * 获取用户在指定时间段内的所有有效票据
 */
export function getUserTicketsInTimeRange(
  userTickets: Ticket[],
  startTime: ISODateTime,
  endTime: ISODateTime
): Ticket[] {
  const validStatuses = ['paid', 'checked_in', 'boarded', 'completed'];
  
  return userTickets.filter(ticket => {
    if (!validStatuses.includes(ticket.status)) {
      return false;
    }
    
    return timeRangesOverlap(
      ticket.depart_abs_utc,
      ticket.arrival_abs_utc,
      startTime,
      endTime
    );
  });
}

/**
 * 获取用户的活跃行程（未完成的）
 */
export function getUserActiveTrips(userTickets: Ticket[]): Ticket[] {
  const activeStatuses = ['paid', 'checked_in', 'boarded'];
  
  return userTickets.filter(ticket => activeStatuses.includes(ticket.status));
}

/**
 * 检查用户是否在列车上（已上车但未完成）
 */
export function isUserOnTrain(userTickets: Ticket[]): boolean {
  return userTickets.some(ticket => ticket.status === 'boarded');
}

/**
 * 获取用户当前所在的列车
 */
export function getUserCurrentTrain(userTickets: Ticket[]): Ticket | null {
  const boardedTickets = userTickets.filter(ticket => ticket.status === 'boarded');
  
  if (boardedTickets.length === 0) {
    return null;
  }
  
  // 返回最早出发的（应该只有一个）
  return boardedTickets.sort((a, b) => {
    return new Date(a.depart_abs_utc).getTime() - new Date(b.depart_abs_utc).getTime();
  })[0];
}

/**
 * 生成冲突错误消息
 */
export function generateConflictMessage(conflictingTickets: Ticket[]): string {
  if (conflictingTickets.length === 0) {
    return '你已在另一趟车上/时间重叠，无法购票';
  }
  
  const ticket = conflictingTickets[0];
  const departTime = new Date(ticket.depart_abs_local).toLocaleString('zh-CN');
  const trainName = ticket.train_snapshot?.name || ticket.train_id;
  
  return `你已在 ${trainName}（${departTime}）上，时间重叠，无法购票`;
}

