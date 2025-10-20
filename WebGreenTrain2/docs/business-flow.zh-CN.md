# WebGreenTrain2 业务细节与流程（FCM / Firestore / IndexedDB / 选座 / 单车限制 / 未来 N 天）

本文档为 WebGreenTrain2 的业务流程与实现要点，面向产品/工程对齐落地。数据字段与算法约定请以《数据规范》为准：[spec.zh-CN.md](./spec.zh-CN.md)。

目录
- 1 概述与目标
- 2 技术与部署
- 3 时间与时区
- 4 车次模板与运行日（与 spec 对齐）
- 5 售票开闭规则
- 6 票据与状态机
- 7 聊天室与消息
- 8 选座策略
- 9 单用户单车限制
- 10 未来 N 天窗口
- 11 接口与返回（MVP）
- 12 错误码与提示
- 13 验收标准
- 14 附录


1) 概述与目标

- 产品定位
  - 临时陌生人聊天，围绕“同一趟列车（主题活动）”发生的短时会话。
  - 阅后即焚：消息不在服务端持久化；客户端本地可临时存放，房间关闭或用户下车即清空。
  - 无历史回放：不提供服务器侧历史查询能力，既保护隐私也降低复杂度。
- MVP 范围
  - 前端列车列表与详情、日期选择、售卖与选座、票据生成、候车室与上车聊天室、FCM 实时消息、IndexedDB 本地消息。
  - 服务端：静态 trains.json 提供可运行日与售卖规则；购票/票据查询基础接口；FCM 中转；无消息体持久化。
  - 不含：复杂的支付网关接入、风控、长周期订单售后与券、跨设备消息漫游。


2) 技术与部署

- Serverless（Vercel）
  - 前端框架：SvelteKit（adapter-auto），静态资源与 Edge/Function 路由部署在 Vercel。
  - API 路由：以最小后端实现购票、鉴权、FCM 发送等轻逻辑。
- Firestore（持久化层）
  - 用途：
    - 票据（Ticket）与支付摘要。
    - 座位锁与占用（下单/支付过程的并发控制）。
    - 用户积分账户与签到记录（points_balance、last_claim_date）。
  - 边界：不存消息体，也不持久化房间 seq/生命周期；所有聊天消息仅通过 FCM 下发与浏览器本地保存；房间开闭按规则实时计算。
- FCM（实时消息通道）
  - 作为“服务端中转但不持久化”的消息分发通道。服务端负责：鉴权校验、限流、投递到 FCM topic（不再生成持久化 seq）。
  - 发送/接收均使用 data payload（见第 7 节消息模型），不使用系统通知模板。
  - 可靠性：允许至多一次/乱序，客户端以 sent_at+client_msg_id 去重与排序；房间关闭后停止投递。
- Firebase Auth（鉴权）
  - 使用 Firebase Auth 管理登录。custom claims 仅作为 Firestore 中用户积分的摘要镜像：points_remaining、last_claim_date；真实来源以 Firestore 为准。
  - 更新 custom claims 后客户端需刷新 ID token（getIdToken(true)）才能获取到最新值。
- 浏览器 IndexedDB（本地消息与收藏）
  - 本地临时持久化：每个房间独立存储消息与光标；刷新/重开页面可恢复到最近状态。
  - 清空策略：房间 closed 或用户“到达/下车”后，清空该房间的普通消息，仅保留“收藏”。
  - 收藏仅本地：不与服务端同步，用户可以导出/清空。


3) 时间与时区

- 相对时刻 HH:mm+dd、service_date 与绝对时间的定义与计算，遵循《数据规范》1) 节（见 spec.zh-CN.md）。
- 双时区展示
  - 默认以“用户本地时区”显示，支持切换到“列车所在时区（train.timezone）”。
  - 所有关键时刻（发车、到达、开售、停售、倒计时）需同时可见两套时间字段。


4) 车次模板与运行日（与 spec 对齐，简述并链接）

- 字段与结构参考《数据规范》2) 节：[trains.json 字段说明](./spec.zh-CN.md)。重点：
  - status/status_note：控制展示与售卖能力。
  - departure_time：作为基准发车相对时刻。
  - service_days + calendar：混合合并（排除优先）。
  - sales_open_rel（HH:mm+dd）、sales_close_before_departure_minutes：售卖开闭规则参数。
  - stations：始发/中间/终到站时刻约定与跨日处理；points 字段定义积分段成本。
- 运行日合并规则参考《数据规范》3) 节：先加白再减黑，排除优先。


5) 售票开闭规则

- 以《数据规范》4) 节为准：
  - open_at(service_date) = service_date + sales_open_rel（如未配置，则视为随时可买，仍受关闭与状态约束）。
  - close_at(service_date, from_station_index) = 该上车站 departure 绝对时间 − sales_close_before_departure_minutes。
  - is_on_sale(now) 需同时满足：状态可售、在运行日内、now 介于 open_at 与 close_at 之间。


6) 票据与状态机

- Ticket 持久化字段（中文解释；具体命名以实现为准，含但不限于）：
  - ticket_id：票据主键。
  - user_id：购票用户标识。
  - order_id：支付订单号（如有）。
  - train_id / service_date / timezone：车次 ID、运行日、IANA 时区。
  - from_station_index / to_station_index：上下车站索引；同时保存 from/to 站名快照，避免后续改名影响历史票。
  - carriage_number / row / seat_letter：席位信息（行号 1..N，座位字母 A/B/C/D/F）。
  - journey_* 时间：journey_depart_local/train 与 journey_arrival_local/train 四个绝对时间；兼容 depart_abs_local/arrival_abs_local；可选提供 UTC。
  - points_cost：本次行程所需积分成本，按《数据规范》stations[].points 计算。
  - room_ids：按规范生成的全车/车厢/同排/席位四类房间 ID（详见第 7 节与《数据规范》5)）。
  - status：reserved → paid → checked_in → boarded → completed；并含 cancelled/expired/refunded 分支。
  - created_at / updated_at：时间戳。
  - payment：金额分、币种、状态、支付时间、渠道、交易号等。
  - train_snapshot：购票时的列车模板快照（至少包含 id/name/theme/timezone/departure_time/stations）。
  - pnr_code：取票码/短码；qrcode_payload：二维码载荷（如 join_url）。
  - join_tokens：进入各房间所需的临时鉴权令牌（global/carriage/row/seat，JWT）。

- 字段用途说明
  - pnr_code：用于线下核验或快速取票/分享时的短码；可作为 join_url 的一部分进行扫码入场。
  - join_tokens（JWT）：由 join 接口按房间粒度签发，包含 { sub: user_id, ticket_id, room_scope, exp } 等声明，仅在短期内有效；发送消息或加入房间时作为 Bearer 鉴权使用。
  - room_status：计算字段，不持久化；按“售卖规则 + 到达后缓冲 30 分钟”的策略实时判定 open/closed。

- 状态流转
  - reserved：已锁座待支付（占用座位与时效）。
  - paid：支付完成，票据生效；可进入候车室/聊天室。
  - checked_in：到发车前完成“检票/签到”。
  - boarded：发车后进入车上状态。
  - completed：到达后自动完成，房间进入 closed 倒计时。
  - cancelled：用户主动取消（未上车前）。
  - expired：预留/未支付超时、或过了 close_at 未成行。
  - refunded：支付后发起退款并完成。

- 积分与签到
  - 每日积分按“用户本地时区”的自然日计算，需手动调用签到接口完成领取；可累加；同一自然日幂等。
  - 积分额度：匿名用户 +10；Google 登录用户 +20。
  - 购票约束：仅当 points_remaining ≥ points_cost 才能创建票据；未签到但余额足够仍可购票；不支持“先购票后签到补足”。
  - 退票与退分：允许发车后退票（至到达前），按取消当天将 points_cost 退回，保证幂等。


7) 聊天室与消息

- Room 生命周期
  - 计算属性，不持久化：按规则实时判断 open/closed。建议 open 条件为 now ∈ [open_at(service_date), arrival_abs_local + 30min]，否则 closed；pending 可与 open 等同处理。
- roomId 命名与 FCM Topic 命名
  - 统一以《数据规范》5) 节的 roomId 生成规则为准：
    - 全车：train-${trainId}-${serviceDate}-global_${arrivalISO}
    - 车厢：train-${trainId}-${serviceDate}-carriage-${carriageNumber}_${arrivalISO}
    - 同排：train-${trainId}-${serviceDate}-seat-row-${rowPadded}_${arrivalISO}
    - 席位：train-${trainId}-${serviceDate}-seat-${rowPadded}${seatLetter}_${arrivalISO}
  - FCM Topic 建议直接等于 roomId（必要时做 URL-safe 处理，如替换冒号/加号）。
- TTL 设置
  - FCM 消息 TTL：不超过到达时刻 arrival_abs（本地）+ 30 分钟；超时消息不再投递。
- 消息模型（data payload）
  - 字段：
    - room_id：字符串，目标房间。
    - msg_id：服务器分配的唯一消息 ID。
    - client_msg_id：客户端生成的临时 ID（用于去重与回执匹配）。
    - sent_at：服务器时间 ISO 字符串。
    - sender：{ user_id, nickname?, avatar_url? }。
    - content：{ text }，文本上限建议 2000 字符或 4KB 以内；超限返回 MESSAGE_TOO_LARGE。
  - 排序与去重：客户端按 sent_at 升序重排；当 sent_at 相同时以 client_msg_id 升序作为稳定次序；去重键为 client_msg_id（相同 client_msg_id 的重复投递需幂等）。
- 本地消息（IndexedDB）
  - 客户端持久化房间消息、未读数、草稿等；刷新可恢复。
  - 触发清空：房间 closed 或用户到达（boarded→completed）。收藏消息不清空，仅本地可见。


8) 选座策略

- sequential（顺序）
  - 遍历顺序：车厢号从小到大 → 行号从小到大 → 座位字母 A, B, C, D, F。
  - 选择第一个可用席位；失败则返回 SEAT_CONFLICT_RETRY（提示重试或切换策略）。
- smart_random（“靠近有人”的伪随机）
  - 目标：让上车后更快成局，优先填充已有乘客附近。
  - 步骤：
    1) 计算每个空座的“距离评分”= 距离最近已占座的欧氏/曼哈顿距离（同排/同车厢加权），距离越近分越高（或距离越远分越低，按实现保持一致性）。
    2) 当多个候选分数相同时，用 seed = hash(user_id + service_date) 的伪随机数做稳定打散，确保同一用户在同一日重试时结果稳定。
    3) 当整车为空时，优先顺序：C → D/B → F → A（居中优先，靠走道次之，靠窗靠后）。
  - 返回不可用时同样给出 SEAT_CONFLICT_RETRY 提示。


9) 单用户单车限制

- 定义“进行中时间窗”
  - 对状态 ∈ {paid, checked_in, boarded} 的票据，时间窗为 [depart_abs, arrival_abs]。
- 规则
  - 不允许“同时购买”与“同时乘坐”。同一用户在任意重叠的时间窗内仅允许一张有效车次票据。
  - 购票阶段校验：创建/支付前，对将要购票行程 [from→to] 对应的绝对区间与用户已有进行中票据做重叠分析；若有重叠，拒绝下单，返回 USER_ALREADY_ON_TRIP。
  - join 阶段复核：进入任一房间前再次校验用户当前时间是否处于另一趟列车的进行中区间；不通过则拒绝进入，返回 JOIN_DENIED_ALREADY_ON_TRIP。


10) 未来 N 天窗口

- 配置 service_window_days（如 60~90 天）。
- 列表与日期选择器仅展示“今天（train.timezone）起未来 N 天”的可运行日集合（按《数据规范》3) 合并规则计算）。
- 超出窗口的日期不展示、不参与售卖计算。


11) 接口与返回（MVP）

- GET /data/trains.json
  - 返回 trains 模板数组（静态）。
- GET /api/points/me（积分）
  - 返回当前用户积分余额与最近签到日期：{ points_remaining, last_claim_date_local, last_claim_date_train }。
- POST /api/points/claim（每日手动签到）
  - 按“用户本地时区”的自然日做签到去重；成功则累加积分并返回最新余额与日期。
  - 匿名 +10、Google +20；同一自然日幂等。
  - 响应示例：

    ```json
    { "points_remaining": 42, "last_claim_date_local": "2025-08-10", "last_claim_date_train": "2025-08-10" }
    ```
- POST /api/tickets
  - 创建订单与票据：参数含 train_id、service_date、from/to、seat_strategy 等；返回 Ticket DTO（含 journey_* 的本地/车次时区时间字段）。
  - 积分购票：需 points_remaining ≥ points_cost 才可创建；未签到余额足够仍可购；不支持“先购票后签到补足”。
- GET /api/tickets/[id]
  - 查询票据详情。
- POST /api/tickets/[id]/cancel（可选）
  - 取消未支付/未生效的预留单，释放座位，更新状态为 cancelled。
- POST /api/tickets/[id]/refund（退款）
  - 允许发车后发起退款（至到达前，具体窗口见产品策略）；按“取消当天”将 points_cost 全额退回（方案 B），幂等。
- POST /api/chat/join、/send、/leave（可选）
  - join：颁发 join_token（JWT）、订阅 FCM topic；send：鉴权、限流并下发（不分配持久化 seq）；leave：取消订阅。
- POST /api/reports
  - 返回 501 { "message": "正在开发..." }
- DTO 时间字段
  - 同时提供 local 与 train timezone 两套绝对时间字符串（journey_depart_local/train、journey_arrival_local/train）。
  - DTO 同时返回积分摘要：points_remaining、last_claim_date_local、last_claim_date_train。


12) 错误码与提示

- USER_ALREADY_ON_TRIP：已有重叠行程，提示“你已在另一趟车上/时间重叠，无法购票”。
- JOIN_DENIED_ALREADY_ON_TRIP：进入房间被拒，提示“当前处于另一趟列车行程中”。
- INSUFFICIENT_POINTS：积分余额不足，提示“余额不足，无法购票”。
- ALREADY_CLAIMED_TODAY：今日已签到，无需重复。
- SEAT_CONFLICT_RETRY：并发占座冲突，提示“选座冲突，请重试或更换策略”。
- NOT_ON_SALE / SALE_NOT_OPEN / SALE_CLOSED：不在可售期、未开售、已停售。
- ROOM_CLOSED：房间已关闭，不可加入/发送。
- MESSAGE_TOO_LARGE：消息过长或超出大小限制。


13) 验收标准

- 选座正确：sequential 与 smart_random 均按预期；并发冲突能回退并重试。
- 单车限制生效：重复/重叠时间窗被拦截。
- FCM 收发稳定：消息按 roomId 订阅/投递，客户端基于 sent_at + client_msg_id 可重排与去重。
- IndexedDB 刷新可恢复：页面刷新后仍能恢复房间消息；房间关闭或到达后自动清空非收藏消息。
- 时间切换正确：列表/详情/票面/倒计时均能在本地与车次时区切换且一致。


14) 附录

- trains.json 样例（覆盖状态、运行日与售卖字段、跨日站点）

```json
[
  {
    "id": "K7701",
    "name": "K7701",
    "theme": "聊聊诺兰的新电影",
    "description": "《星际穿越》《盗梦空间》《敦刻尔克》… 你最喜欢哪一部？",
    "timezone": "Asia/Shanghai",
    "status": "active",
    "status_note": "暑期部分周末加开",
    "carriages": 10,
    "rows_per_carriage": 20,
    "departure_time": "08:35+00",
    "service_days": [1, 3, 5],
    "calendar": {
      "includes": ["2025-08-16"],
      "excludes": ["2025-08-15"],
      "include_ranges": [
        { "start": "2025-07-01", "end": "2025-08-31", "weekdays": [6, 7] }
      ]
    },
    "sales_open_rel": "09:00+00",
    "sales_close_before_departure_minutes": 10,
    "stations": [
      { "name": "起始站", "description": "整体初印象", "departure_time": "08:35+00" },
      { "name": "中间站", "description": "情节与镜头", "arrival_time": "09:10+00", "departure_time": "09:15+00", "points": 1 },
      { "name": "终点站", "description": "TOP1 与安利", "arrival_time": "09:45+00", "points": 2 }
    ]
  },
  {
    "id": "D2025",
    "name": "D2025 绿皮夜行",
    "theme": "夜猫子闲聊局",
    "description": "深夜小聚，聊聊今天的灵感和碎片。",
    "timezone": "Asia/Shanghai",
    "status": "paused",
    "status_note": "临时维护，暂停售票",
    "carriages": 8,
    "rows_per_carriage": 18,
    "departure_time": "23:30+00",
    "service_days": [2, 4, 6],
    "calendar": {
      "rules": [
        { "freq": "DAILY", "start": "2025-10-01", "end": "2025-10-07" }
      ],
      "excludes": ["2025-10-04"]
    },
    "sales_open_rel": "10:00+00",
    "sales_close_before_departure_minutes": 30,
    "stations": [
      { "name": "始发站", "description": "集合点", "departure_time": "23:30+00" },
      { "name": "午夜前", "description": "聊至深夜", "arrival_time": "23:55+00", "departure_time": "23:58+00", "points": 1 },
      { "name": "凌晨终点", "description": "次日抵达", "arrival_time": "00:40+01", "points": 2 }
    ]
  }
]
```

- Ticket DTO 样例（含本地/车次时区时间）

```json
{
  "ticket_id": "tkt_9fK2Z7X",
  "user_id": "user_12345",
  "order_id": "ord_202508160001",
  "train_id": "K7701",
  "service_date": "2025-08-16",
  "timezone": "Asia/Shanghai",
  "from_station_index": 0,
  "to_station_index": 2,
  "from_station_name": "起始站",
  "to_station_name": "终点站",
  "carriage_number": 3,
  "row": 7,
  "seat_letter": "D",
  "journey_depart_local": "2025-08-16T08:35:00+08:00",
  "journey_arrival_local": "2025-08-16T09:45:00+08:00",
  "journey_depart_train": "2025-08-16T08:35:00+08:00",
  "journey_arrival_train": "2025-08-16T09:45:00+08:00",
  "depart_abs_local": "2025-08-16T08:35:00+08:00",
  "arrival_abs_local": "2025-08-16T09:45:00+08:00",
  "depart_abs_utc": "2025-08-16T00:35:00Z",
  "arrival_abs_utc": "2025-08-16T01:45:00Z",
  "points_cost": 3,
  "room_ids": {
    "global": "train-K7701-2025-08-16-global_2025-08-16T09:45:00+08:00",
    "carriage": "train-K7701-2025-08-16-carriage-3_2025-08-16T09:45:00+08:00",
    "row": "train-K7701-2025-08-16-seat-row-07_2025-08-16T09:45:00+08:00",
    "seat": "train-K7701-2025-08-16-seat-07D_2025-08-16T09:45:00+08:00"
  },
  "status": "paid",
  "created_at": "2025-08-10T12:00:00Z",
  "updated_at": "2025-08-10T12:00:00Z",
  "payment": {
    "amount_fen": 990,
    "currency": "CNY",
    "status": "paid",
    "paid_at": "2025-08-10T12:00:00Z",
    "provider": "mockpay",
    "transaction_id": "txn_abc123"
  },
  "train_snapshot": {
    "id": "K7701",
    "name": "K7701",
    "theme": "聊聊诺兰的新电影",
    "timezone": "Asia/Shanghai",
    "departure_time": "08:35+00",
    "stations": [
      { "name": "起始站", "description": "整体初印象", "departure_time": "08:35+00" },
      { "name": "中间站", "description": "情节与镜头", "arrival_time": "09:10+00", "departure_time": "09:15+00", "points": 1 },
      { "name": "终点站", "description": "TOP1 与安利", "arrival_time": "09:45+00", "points": 2 }
    ]
  },
  "pnr_code": "PNR8X3Y9Z",
  "qrcode_payload": "https://webgreentrain.example/join?ticket=tkt_9fK2Z7X",
  "join_tokens": {
    "global": "jtk_global_abc",
    "carriage": "jtk_car_3_def",
    "row": "jtk_row_07_ghi",
    "seat": "jtk_seat_07D_jkl"
  },
  "points_remaining": 42,
  "last_claim_date_local": "2025-08-10",
  "last_claim_date_train": "2025-08-10"
}
```
