import type { Train, Seat, Ticket } from './types';

const SEAT_NAMES = ['A', 'B', 'C', 'D', 'F'];

export function formatTime(isoString: string, locale: string = 'zh-CN'): string {
  const date = new Date(isoString);
  return date.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(isoString: string, locale: string = 'zh-CN'): string {
  const date = new Date(isoString);
  return date.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatTimeOnly(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function generateSeatDisplay(carriage: number, row: number, seatIndex: number): string {
  const seatName = SEAT_NAMES[seatIndex];
  const rowDisplay = String(row).padStart(2, '0');
  return `${carriage}车厢 ${rowDisplay}${seatName}`;
}

export function generateTicketId(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateUserId(): string {
  return `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateChatRoomId(trainId: string, type: 'train' | 'carriage' | 'seat', carriageNumber?: number, seatNumber?: string): string {
  const arrivalTime = new Date().toISOString().split('T')[0];
  
  if (type === 'train') {
    return `train-${trainId}-global_${arrivalTime}`;
  } else if (type === 'carriage' && carriageNumber !== undefined) {
    return `train-${trainId}-carriage-${carriageNumber}_${arrivalTime}`;
  } else if (type === 'seat' && seatNumber !== undefined) {
    return `train-${trainId}-seat-${seatNumber}_${arrivalTime}`;
  }
  
  return '';
}

export function getRandomSeat(train: Train): Seat {
  const carriage = Math.floor(Math.random() * train.carriages) + 1;
  const row = Math.floor(Math.random() * train.rows_per_carriage) + 1;
  const seatIndex = Math.floor(Math.random() * SEAT_NAMES.length);
  
  return {
    carriage,
    row,
    seat: SEAT_NAMES[seatIndex]
  };
}

export function createTicket(
  trainId: string,
  trainName: string,
  theme: string,
  boardingStation: string,
  alightingStation: string,
  boardingTime: string,
  alightingTime: string,
  seat: Seat
): Ticket {
  const seatDisplay = generateSeatDisplay(seat.carriage, seat.row, SEAT_NAMES.indexOf(seat.seat));
  
  return {
    id: generateTicketId(),
    trainId,
    trainName,
    theme,
    boardingStation,
    alightingStation,
    boardingTime,
    alightingTime,
    seat,
    seatDisplay,
    bookingTime: new Date().toISOString()
  };
}

export function searchTrains(trains: Train[], query: string): Train[] {
  if (!query.trim()) return trains;
  
  const lowerQuery = query.toLowerCase();
  
  return trains.filter(train => {
    return (
      train.name.toLowerCase().includes(lowerQuery) ||
      train.theme.toLowerCase().includes(lowerQuery) ||
      train.description.toLowerCase().includes(lowerQuery) ||
      train.stations.some(station => station.name.toLowerCase().includes(lowerQuery))
    );
  });
}

export function sortTrainsByDeparture(trains: Train[]): Train[] {
  return [...trains].sort((a, b) => {
    return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
  });
}

export function isTrainDeparted(train: Train): boolean {
  return new Date(train.departure_time) < new Date();
}

export function getTrainDurationMinutes(train: Train): number {
  const firstStation = train.stations[0];
  const lastStation = train.stations[train.stations.length - 1];
  
  if (!firstStation.departure_time || !lastStation.arrival_time) return 0;
  
  const start = new Date(firstStation.departure_time).getTime();
  const end = new Date(lastStation.arrival_time).getTime();
  
  return Math.round((end - start) / (1000 * 60));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  
  return `${hours}小时${mins}分钟`;
}

