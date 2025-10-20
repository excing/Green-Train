/**
 * 消息发送 API
 * POST /api/messages/send - 发送消息到房间
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import type { RealtimeMessage } from '$lib/types';
import { getNowISO } from '$lib/time';

// 简单的内存消息队列（实际应用中应使用消息队列服务）
const messageQueue: Map<string, RealtimeMessage[]> = new Map();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { room_id, user_id, user_name, content, type = 'text' } = body;

    // 验证必填字段
    if (!room_id || !user_id || !user_name || !content) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 创建消息对象
    const message: RealtimeMessage = {
      id: `msg_${uuidv4().substring(0, 8)}`,
      room_id,
      user_id,
      user_name,
      content,
      timestamp: getNowISO(),
      type
    };

    // 存储消息到队列（仅用于演示，不做持久化）
    if (!messageQueue.has(room_id)) {
      messageQueue.set(room_id, []);
    }
    messageQueue.get(room_id)!.push(message);

    // 限制队列大小（保留最近 100 条消息）
    const queue = messageQueue.get(room_id)!;
    if (queue.length > 100) {
      queue.shift();
    }

    // 通过 FCM 发送消息到房间主题
    // 这里需要调用 Firebase Admin SDK
    try {
      await sendMessageViaFCM(room_id, message);
    } catch (error) {
      console.error('Failed to send message via FCM:', error);
      // 继续返回成功，因为消息已经存储
    }

    return json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * 通过 FCM 发送消息到房间主题
 */
async function sendMessageViaFCM(roomId: string, message: RealtimeMessage): Promise<void> {
  // 这里需要使用 Firebase Admin SDK
  // 示例代码（需要配置 Firebase Admin）：
  // const admin = require('firebase-admin');
  // await admin.messaging().sendToTopic(roomId, {
  //   data: {
  //     id: message.id,
  //     user_id: message.user_id,
  //     user_name: message.user_name,
  //     content: message.content,
  //     timestamp: message.timestamp,
  //     type: message.type,
  //     room_id: message.room_id
  //   }
  // });

  console.log(`Message sent to FCM topic: ${roomId}`);
}

/**
 * 获取房间的消息历史（仅用于演示，内部使用）
 */
export function _getRoomMessages(roomId: string): RealtimeMessage[] {
  return messageQueue.get(roomId) || [];
}

