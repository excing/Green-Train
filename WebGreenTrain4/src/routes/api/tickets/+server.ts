/**
 * 购票 API
 * POST /api/tickets - 创建票据
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import type { Ticket } from '$lib/types';
import { toLocalAbsoluteTime, toUTCISO, getNowISO } from '$lib/time';
import { generateRoomIds, generatePNRCode, generateJoinToken, generateQRCodePayload, formatRowNumber } from '$lib/room';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      user_id,
      train_id,
      service_date,
      from_station_index,
      to_station_index,
      carriage_number,
      row,
      seat_letter,
      amount_fen,
      train_snapshot
    } = body;

    // 基本验证
    if (!user_id || !train_id || !service_date || from_station_index === undefined || to_station_index === undefined) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (from_station_index >= to_station_index) {
      return json({ error: 'Invalid station indices' }, { status: 400 });
    }

    // 生成票据 ID 和订单 ID
    const ticket_id = `tkt_${uuidv4().substring(0, 8)}`;
    const order_id = `ord_${Date.now()}`;

    // 计算发车和到达时间
    const fromStation = train_snapshot.stations[from_station_index];
    const toStation = train_snapshot.stations[to_station_index];
    const timezone = train_snapshot.timezone || 'Asia/Shanghai';

    const departureTime = fromStation.departure_time || train_snapshot.departure_time;
    const arrivalTime = toStation.arrival_time || train_snapshot.departure_time;

    const depart_abs_local = toLocalAbsoluteTime(service_date, departureTime, timezone);
    const arrival_abs_local = toLocalAbsoluteTime(service_date, arrivalTime, timezone);
    const depart_abs_utc = toUTCISO(depart_abs_local);
    const arrival_abs_utc = toUTCISO(arrival_abs_local);

    // 生成房间 ID
    const room_ids = generateRoomIds(
      train_id,
      service_date,
      arrival_abs_local,
      carriage_number,
      formatRowNumber(row),
      seat_letter
    );

    // 生成其他信息
    const pnr_code = generatePNRCode();
    const qrcode_payload = generateQRCodePayload(ticket_id);
    const join_tokens = {
      global: generateJoinToken(),
      carriage: generateJoinToken(),
      row: generateJoinToken(),
      seat: generateJoinToken()
    };

    const now = getNowISO();

    // 构建票据对象
    const ticket: Ticket = {
      ticket_id,
      user_id,
      order_id,
      train_id,
      service_date,
      timezone,
      from_station_index,
      to_station_index,
      from_station_name: fromStation.name,
      to_station_name: toStation.name,
      carriage_number,
      row,
      seat_letter,
      depart_abs_local,
      arrival_abs_local,
      depart_abs_utc,
      arrival_abs_utc,
      room_ids,
      room_status: 'pending',
      status: 'pending_payment',
      created_at: now,
      updated_at: now,
      payment: {
        amount_fen,
        currency: 'CNY',
        status: 'pending'
      },
      train_snapshot,
      pnr_code,
      qrcode_payload,
      join_tokens
    };

    // 注意：这里不做持久化，仅返回票据对象
    // 实际应用中可以通过 session 或其他方式临时存储

    return json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

