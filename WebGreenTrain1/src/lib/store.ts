import { writable } from 'svelte/store';
import type { Ticket, UserProfile, ChatMessage, SavedConversation } from './types';
import { generateUserId } from './utils';

// User profile store
export const userProfile = writable<UserProfile>({
  id: generateUserId(),
  name: `旅客${Math.floor(Math.random() * 10000)}`,
  interests: ['电影', '旅行', '美食', '音乐'],
  avatar: undefined
});

// Current ticket store
export const currentTicket = writable<Ticket | null>(null);

// Chat messages store
export const chatMessages = writable<ChatMessage[]>([]);

// Saved conversations store
export const savedConversations = writable<SavedConversation[]>([]);

// Current chat room ID
export const currentRoomId = writable<string>('');

// UI state
export const showChatRoom = writable<boolean>(false);
export const showWaitingRoom = writable<boolean>(false);

// Initialize user profile from localStorage if available
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('userProfile');
  if (stored) {
    try {
      userProfile.set(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load user profile from localStorage', e);
    }
  }
  
  // Subscribe to changes and save to localStorage
  userProfile.subscribe(profile => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  });
  
  // Load saved conversations
  const savedConvs = localStorage.getItem('savedConversations');
  if (savedConvs) {
    try {
      savedConversations.set(JSON.parse(savedConvs));
    } catch (e) {
      console.error('Failed to load saved conversations from localStorage', e);
    }
  }
  
  savedConversations.subscribe(convs => {
    localStorage.setItem('savedConversations', JSON.stringify(convs));
  });
}

