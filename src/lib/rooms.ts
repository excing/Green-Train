// 会话/房间标识工具，用于统一拼接实时沟通 ID

/**
 * 生成房间/会话唯一标识符
 * @param trainId 车次 ID
 * @param date 服务日期
 * @param from 出发站名称
 * @param to 到达站名称
 * @returns 房间 ID 字符串，格式：gt-{trainId}-{date}-{from}-{to}
 */
export function roomId(trainId: string, date: string, from: string, to: string): string {
  return `gt-${trainId}-${date}-${from}-${to}`.replace(/\s+/g, '_');
}

/**
 * 生成聊天主题标题
 * @param trainName 列车名称
 * @param theme 列车主题（可选）
 * @param date 服务日期
 * @returns 主题字符串，格式：{trainName} · {theme} · {date}
 */
export function topic(trainName: string, theme: string | undefined, date: string): string {
  return `${trainName} · ${theme ?? '主题列车'} · ${date}`;
}
