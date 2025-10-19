// Train and booking related types

export interface Station {
  name: string;
  description: string;
  arrival_time?: string; // ISO 8601 format, undefined for first station
  departure_time?: string; // ISO 8601 format, undefined for last station
}

export interface Train {
  id: string;
  name: string;
  theme: string;
  description: string;
  stations: Station[];
  departure_time: string; // ISO 8601 format
  carriages: number;
  rows_per_carriage: number;
}

export interface Seat {
  carriage: number;
  row: number;
  seat: string; // A, B, C, D, F
}

export interface Ticket {
  id: string;
  trainId: string;
  trainName: string;
  theme: string;
  boardingStation: string;
  alightingStation: string;
  boardingTime: string;
  alightingTime: string;
  seat: Seat;
  seatDisplay: string; // e.g., "3车厢 07D"
  bookingTime: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  roomId: string;
}

export interface ChatRoom {
  roomId: string;
  name: string;
  type: 'train' | 'carriage' | 'seat'; // train-global, carriage, or seat neighbors
  trainId: string;
  carriageNumber?: number;
  seatNumber?: string;
  messages: ChatMessage[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  interests: string[];
}

export interface SavedConversation {
  id: string;
  ticketId: string;
  roomId: string;
  messages: ChatMessage[];
  savedAt: string;
  title?: string;
}

