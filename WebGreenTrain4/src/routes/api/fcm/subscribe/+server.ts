/**
 * FCM 订阅 API
 * POST /api/fcm/subscribe - 订阅房间主题
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

    // 添加订阅
    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, new Set());
    }
    subscriptions.get(topic)!.add(token);

    console.log(`Token ${token} subscribed to topic ${topic}`);

    return json({ success: true, message: 'Subscribed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * 获取主题的所有订阅者（内部使用）
 */
export function _getTopicSubscribers(topic: string): string[] {
  return Array.from(subscriptions.get(topic) || []);
}

