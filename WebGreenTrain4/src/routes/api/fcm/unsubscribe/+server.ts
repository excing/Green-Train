/**
 * FCM 取消订阅 API
 * POST /api/fcm/unsubscribe - 取消订阅房间主题
 */

import { json, type RequestHandler } from '@sveltejs/kit';

// 简单的订阅管理（实际应用中应使用 Firebase Admin SDK）
const subscriptions: Map<string, Set<string>> = new Map();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, topic } = body;

    // 验证必填字段
    if (!token || !topic) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 移除订阅
    if (subscriptions.has(topic)) {
      subscriptions.get(topic)!.delete(token);
    }

    console.log(`Token ${token} unsubscribed from topic ${topic}`);

    return json({ success: true, message: 'Unsubscribed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

