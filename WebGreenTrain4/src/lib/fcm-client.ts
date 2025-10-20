/**
 * 客户端 FCM 管理器
 * 处理消息订阅、接收等
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken, type Messaging } from 'firebase/messaging';
import type { RealtimeMessage, ISOString } from './types';

// Firebase 配置 (需要从环境变量或配置文件读取)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let messaging: Messaging | null = null;
let fcmToken: string | null = null;

/**
 * 初始化 FCM
 */
export async function initFCM(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('FCM can only be initialized in browser environment');
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('FCM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize FCM:', error);
    throw error;
  }
}

/**
 * 获取 FCM 令牌
 */
export async function getFCMToken(): Promise<string> {
  if (!messaging) {
    throw new Error('FCM not initialized');
  }

  if (fcmToken) {
    return fcmToken;
  }

  try {
    // 请求通知权限
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
    });

    console.log('FCM token obtained:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    throw error;
  }
}

/**
 * 订阅房间主题
 */
export async function subscribeToRoom(roomId: string): Promise<void> {
  try {
    const token = await getFCMToken();
    const response = await fetch('/api/fcm/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic: roomId })
    });

    if (!response.ok) {
      throw new Error(`Failed to subscribe: ${response.statusText}`);
    }

    console.log(`Subscribed to room: ${roomId}`);
  } catch (error) {
    console.error('Failed to subscribe to room:', error);
    throw error;
  }
}

/**
 * 取消订阅房间主题
 */
export async function unsubscribeFromRoom(roomId: string): Promise<void> {
  try {
    const token = await getFCMToken();
    const response = await fetch('/api/fcm/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic: roomId })
    });

    if (!response.ok) {
      throw new Error(`Failed to unsubscribe: ${response.statusText}`);
    }

    console.log(`Unsubscribed from room: ${roomId}`);
  } catch (error) {
    console.error('Failed to unsubscribe from room:', error);
    throw error;
  }
}

/**
 * 监听消息
 */
export function listenToMessages(
  callback: (message: RealtimeMessage) => void
): () => void {
  if (!messaging) {
    console.warn('FCM not initialized');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Message received:', payload);

    // 解析消息
    const message: RealtimeMessage = {
      id: payload.messageId || '',
      room_id: payload.data?.room_id || '',
      user_id: payload.data?.user_id || '',
      user_name: payload.data?.user_name || '',
      content: payload.data?.content || payload.notification?.body || '',
      timestamp: (payload.data?.timestamp || new Date().toISOString()) as ISOString,
      type: (payload.data?.type as any) || 'text'
    };

    callback(message);
  });

  return unsubscribe;
}

/**
 * 发送消息到房间
 */
export async function sendMessageToRoom(
  roomId: string,
  userId: string,
  userName: string,
  content: string
): Promise<void> {
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        content,
        type: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    console.log('Message sent successfully');
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

/**
 * 清除 FCM 令牌
 */
export function clearFCMToken(): void {
  fcmToken = null;
}

