/**
 * 列车数据加载与搜索
 */

import type { Train, ISOString } from './types';
import { getNextServiceDate } from './calendar';
import { toLocalAbsoluteTime, getNowISO } from './time';

let trainsCache: Train[] | null = null;

/**
 * 加载列车数据
 */
export async function loadTrains(): Promise<Train[]> {
  if (trainsCache) {
    return trainsCache;
  }

  try {
    const response = await fetch('/data/trains.json');
    if (!response.ok) {
      throw new Error(`Failed to load trains: ${response.statusText}`);
    }
    const data = await response.json();
    trainsCache = data as Train[];
    return trainsCache;
  } catch (error) {
    console.error('Error loading trains:', error);
    throw error;
  }
}

/**
 * 获取所有活跃列车（用于列表展示）
 */
export async function getActiveTrains(): Promise<Train[]> {
  const trains = await loadTrains();
  return trains.filter(t => ['active', 'deprecated', 'hidden', 'paused'].includes(t.status));
}

/**
 * 获取公开列车（不包括隐藏）
 */
export async function getPublicTrains(): Promise<Train[]> {
  const trains = await loadTrains();
  return trains.filter(t => ['active', 'deprecated', 'paused'].includes(t.status));
}

/**
 * 按 ID 获取列车
 */
export async function getTrainById(id: string): Promise<Train | null> {
  const trains = await loadTrains();
  return trains.find(t => t.id === id) || null;
}

/**
 * 搜索列车
 */
export async function searchTrains(query: string): Promise<Train[]> {
  const trains = await getPublicTrains();
  const lowerQuery = query.toLowerCase();

  return trains.filter(train => {
    // 主题模糊匹配
    if (train.theme.toLowerCase().includes(lowerQuery)) return true;
    if (train.name.toLowerCase().includes(lowerQuery)) return true;

    // 站点名模糊匹配
    if (train.stations.some(s => s.name.toLowerCase().includes(lowerQuery))) return true;

    // 出发时刻匹配 (仅 HH:mm 部分)
    const queryTime = lowerQuery.match(/\d{2}:\d{2}/)?.[0];
    if (queryTime) {
      const departureTime = train.stations[0]?.departure_time || train.departure_time;
      if (departureTime.startsWith(queryTime)) return true;
    }

    return false;
  });
}

/**
 * 计算列车的下一班发车时间
 */
export async function computeNextDeparture(
  train: Train,
  now: ISOString = getNowISO()
): Promise<{ serviceDate: string; departureISO: ISOString } | null> {
  const today = new Date(now).toISOString().split('T')[0];
  const nextServiceDate = getNextServiceDate(train, today as any, 90);

  if (!nextServiceDate) {
    return null;
  }

  const departureTime = train.stations[0]?.departure_time || train.departure_time;
  const departureISO = toLocalAbsoluteTime(nextServiceDate, departureTime, train.timezone);

  return {
    serviceDate: nextServiceDate,
    departureISO
  };
}

/**
 * 按下一班发车时间排序列车
 */
export async function sortTrainsByNextDeparture(
  trains: Train[],
  now: ISOString = getNowISO()
): Promise<Train[]> {
  const departures = await Promise.all(
    trains.map(async train => ({
      train,
      next: await computeNextDeparture(train, now)
    }))
  );

  return departures
    .filter(d => d.next !== null)
    .sort((a, b) => {
      if (!a.next || !b.next) return 0;
      return a.next.departureISO.localeCompare(b.next.departureISO);
    })
    .map(d => d.train);
}

/**
 * 获取列车的默认时区
 */
export function getTrainTimezone(train: Train): string {
  return train.timezone || 'Asia/Shanghai';
}

/**
 * 验证列车数据
 */
export function validateTrain(train: any): train is Train {
  if (!train.id || typeof train.id !== 'string') return false;
  if (!train.name || typeof train.name !== 'string') return false;
  if (!train.theme || typeof train.theme !== 'string') return false;
  if (!train.status || !['draft', 'hidden', 'paused', 'active', 'deprecated', 'archived'].includes(train.status)) return false;
  if (typeof train.carriages !== 'number' || train.carriages < 1) return false;
  if (typeof train.rows_per_carriage !== 'number' || train.rows_per_carriage < 1) return false;
  if (!train.departure_time || typeof train.departure_time !== 'string') return false;
  if (typeof train.sales_close_before_departure_minutes !== 'number') return false;
  if (!Array.isArray(train.stations) || train.stations.length < 2) return false;

  return true;
}

