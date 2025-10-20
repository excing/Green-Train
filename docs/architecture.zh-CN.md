# WebGreenTrain2 技术设计（Auth/Claims、Firestore、FCM、客户端）

本文档描述 WebGreenTrain2 的技术架构与关键设计决策，聚焦登录（匿名/Google）与积分镜像、Firestore 持久化边界、FCM Topic/TTL/Payload、客户端去重排序与本地存储。

目录
- 1 架构概览
- 2 鉴权：Firebase Auth 与自定义声明（custom claims）
- 3 数据持久化：Firestore（仅 tickets/seat_locks/users_points）
- 4 实时消息：FCM Topic、TTL、Payload 与客户端去重
- 5 客户端：IndexedDB、本地/车次时区处理
- 6 运行与刷新策略


1) 架构概览

- 前端：SvelteKit + Vite，静态 trains.json（静态目录 /data/trains.json 提供车次模板与规则）。
- 后端：Serverless（Vercel/Edge Functions）。
- 登录：Firebase Auth（匿名 / Google）。
- 持久化：Firestore 仅保存票据与相关最小集合，不保存消息体与聊天室生命周期/seq。
- 消息：FCM 作为“中转但不持久化”的分发通道。
- 客户端：IndexedDB 本地存储消息与收藏；双时区展示与切换。


2) 鉴权：Firebase Auth 与自定义声明（custom claims）

- 登录方式
  - 匿名登录：用于零阻力体验；可后续 link 到 Google。
  - Google 登录：首选强身份；支持从匿名账户迁移/合并数据。
- custom claims 镜像字段
  - points_remaining：当前用户可用积分余额；
  - last_claim_date：最近一次“每日签到”的日期（按用户本地时区的自然日进行去重）；
  - 说明：claims 为“镜像”，真实来源以 Firestore 的 users_points 文档为准。
- 刷新策略
  - 任何会更改积分余额或签到日期的操作（/points/claim、/tickets 购票/退款）完成后：
    1) 更新 Firestore 中 users_points；
    2) 通过 Admin SDK 更新 Auth custom claims；
    3) 客户端调用 getIdToken(true) 刷新 ID Token，以获得最新 claims；
  - 前端在关键页面（App Bar、购票确认、我的票）进入/返回时主动触发 claims 刷新，避免延迟显示。
- Provider 切换（link/unlink）
  - 支持匿名 → Google 的账户绑定；link 后沿用同一用户的积分账户文档；
  - unlink Google 后回退匿名身份，但不丢失积分余额（仍绑定同一用户记录）。


3) 数据持久化：Firestore（仅 tickets/seat_locks/users_points）

- 集合与示例字段
  - tickets
    - 票据主键、用户、车次/日期、上下车站、席位、journey_* 时间字段、points_cost、status、room_ids、pnr_code、join_tokens（如需短期缓存）。
  - seat_locks
    - 下单/支付过程的席位锁与过期控制，避免并发冲突。
  - users_points
    - points_remaining、last_claim_date_local、last_claim_date_train、最近更新时间。
- 不持久化的内容
  - 聊天消息体：不在服务器端保存；
  - 聊天室生命周期/seq：不保存“房间是否 open/closed 的历史状态”和持久化序列号。房间状态按规则实时计算。


4) 实时消息：FCM Topic、TTL、Payload 与客户端去重

- Topic 命名
  - 建议复用 roomId 作为 Topic 名：
    - 全车：train-${trainId}-${serviceDate}-global_${arrivalISO}
    - 车厢：train-${trainId}-${serviceDate}-carriage-${carriageNumber}_${arrivalISO}
    - 同排：train-${trainId}-${serviceDate}-seat-row-${rowPadded}_${arrivalISO}
    - 席位：train-${trainId}-${serviceDate}-seat-${rowPadded}${seatLetter}_${arrivalISO}
  - 如需 URL‑safe，可将 ":"、"+" 等字符替换或编码。
- TTL（生存期）
  - 取不超过“到达绝对时间（本地）+ 30 分钟”的窗口；过期消息不再投递。
- Payload（data 消息）
  - 建议字段：{ room_id, msg_id, client_msg_id, sent_at, sender{ user_id, nickname?, avatar_url? }, content{ text } }
  - 仅使用 data payload，避免系统通知抢占 UI。
- 客户端去重排序
  - 去重键：client_msg_id；
  - 排序：先按 sent_at 升序，再按 client_msg_id 升序保证稳定性；
  - 本地持久化：IndexedDB 按 roomId 分桶保存消息与光标。


5) 客户端：IndexedDB、本地/车次时区处理

- IndexedDB
  - 保存每个房间的消息、未读数、草稿与收藏；
  - 清空：房间 closed 或用户达到/下车后，清空普通消息，仅保留收藏。
- 双时区
  - DTO 同时提供 journey_depart_local/train 与 journey_arrival_local/train 四个绝对时间；
  - UI 可在 App Bar 切换主/辅显示；
  - 倒计时基于所选主时区渲染，辅时区以小号标注。


6) 运行与刷新策略

- 未来 N 天窗口：仅对“今天（train.timezone）起的 N 天”生成可运行日与售卖计算。
- 开售/停售：按 sales_open_rel（HH:mm+dd）与 sales_close_before_departure_minutes 计算；
- 房间状态：open 若 now ∈ [open_at(service_date), arrival_abs_local + 30min]，否则 closed；不落库；
- 令牌与安全
  - join_tokens 为 JWT，payload 建议包含 { sub: user_id, ticket_id, room_scope, exp, iat }；
  - 发送/加入时以 Bearer 头携带；过期即失效；
  - 重要操作（购票/退票/签到）均要求最新 ID Token（含 claims）。
