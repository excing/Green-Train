# WebGreenTrain2 中文规范（trains.json / 运行日 / 售票 / 票据 / 房间ID）

本文档定义 WebGreenTrain2 的数据规范与业务规则，用于指导前后端实现 time/calendar/sales/rooms 以及接口/DTO 的约定。客户端默认从 /data/trains.json 加载车次模板（SvelteKit 静态目录 static/data/trains.json 会被映射为该路径）。

目录
- 1 概述与约定
- 2 车次模板结构（trains.json 字段说明）
- 3 运行日合并规则（混合模式）
- 4 售票开闭计算
- 5 房间ID规范与示例
- 6 购票持久化与用户返回 DTO
- 7 查询/搜索与 UI 行为
- 8 完整数据示例


1) 概述与约定

- 相对时刻格式 HH:mm+dd
  - 正则：^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$
  - 语义：相对某个 service_date 的“本地时区”零点（00:00）偏移 dd 天，再加 HH:mm，得到该时刻的“本地绝对时间”。
  - 示例：
    - 08:35+00 表示 service_date 当天 08:35
    - 00:40+01 表示 service_date 次日 00:40（跨日）
    - 23:10+02 表示 service_date 第三天 23:10（跨两日）
- service_date 定义
  - service_date 指列车开行日期（YYYY-MM-DD），按 train.timezone 的本地日历计算，与用户本地时区无关。
  - 绝对时间生成：给定 service_date 和 HH:mm+dd，相当于在 train.timezone 下构造一个 ZonedDateTime(service_dateT00:00) + dd 天 + HH:mm，随后可转换为 UTC/ISO 字符串。
- 时区与展示
  - 默认时区：Asia/Shanghai。若 trains.json 未显式设置 timezone，视为 Asia/Shanghai。
  - 客户端展示：同时显示“用户本地时区时间”和“列车所在时区时间”。


2) 车次模板结构（trains.json 字段说明）

- 基本字段
  - id: string（必填）
    - 建议正则 ^[A-Za-z0-9_-]{1,32}$，示例 K7701、D2025。
  - name: string（必填）
    - 车次名称，通常与 id 一致或附加主题前缀。
  - theme: string（必填）
    - 主题文案，用于列表/详情展示与搜索。
  - description: string（可选）
    - 主题描述，支持长文案。
  - timezone: string（可选）
    - IANA 时区名，默认 Asia/Shanghai。用于计算 service_date 与所有相对时刻。
- 状态
  - status: 'draft' | 'hidden' | 'paused' | 'active' | 'deprecated' | 'archived'（必填）
    - draft：草稿，不参与运行日生成与售卖；不在任何列表或详情中出现。
    - hidden：隐藏，参与运行日生成；默认不出现在公共列表，支持直达链接调试；售卖允许（可用于灰度/内测）。
    - paused：暂停，参与运行日生成，但禁售（is_on_sale 恒为 false）。
    - active：上线，正常展示与售卖。
    - deprecated：不推荐，继续展示与售卖，但 UI 标注“即将下线”。
    - archived：归档，不参与运行日生成与售卖；仅保留历史票据关联。
  - status_note: string（可选）
    - 状态说明或公告，UI 可提示给用户。
- 发车基准时刻
  - departure_time: string（必填，HH:mm+dd）
    - 作为默认“始发站发车”的基准相对时刻；用于售票关闭时间计算与“下一班”排序的参考。通常与 stations[0].departure_time 一致。
- 车厢与座位
  - carriages: number（必填，整数 ≥ 1）
  - rows_per_carriage: number（必填，整数 ≥ 1）
  - 坐席布局：每排固定 5 座，座位字母为 A/B/C/D/F（不使用 E）。行号建议 UI 按两位零填充显示（例如 07）。
- 运行日（日历）
  - service_days?: number[]（可选，元素取值 1..7，1=周一 … 7=周日）
  - calendar?: 对象（可选）
    - includes?: string[]（YYYY-MM-DD）白名单：单日加开
    - excludes?: string[]（YYYY-MM-DD）黑名单：单日停运
    - include_ranges?: { start: string; end: string; weekdays?: number[] }[]
      - 将区间内的全部日期（若提供 weekdays 则仅包含这些周几）加入白名单
    - exclude_ranges?: { start: string; end: string; weekdays?: number[] }[]
      - 将区间内匹配的日期加入黑名单
    - rules?: { freq: 'DAILY'|'WEEKLY'; weekdays?: number[]; start: string; end: string }[]
      - 规则驱动的白名单生成器；WEEKLY 需要 weekdays；DAILY 忽略 weekdays。
- 售票
  - sales_open_rel?: string（可选，HH:mm+dd）
    - 开售相对时刻。open_at(service_date) = service_date + sales_open_rel。
    - 缺省表示“随时可买”（仅受状态与关闭时间约束）。
  - sales_close_before_departure_minutes: number（必填，整数 ≥ 0）
    - 停售相对发车的提前分钟数。close_at(service_date, from_station_index) = depart_abs − minutes。
- 站点
  - stations: 数组（必填，长度 ≥ 2）
    - 每项：
      - name: string（必填）
      - description: string（可选）
      - arrival_time?: string（可选，HH:mm+dd；始发站不得提供）
      - departure_time?: string（可选，HH:mm+dd；终到站不得提供）
    - 语义：
      - 站点按顺序组成完整旅程；中间站需同时具备到/发时刻，且 arrival_time ≤ departure_time（就地停靠）。
      - 始发站只能有 departure_time；终到站只能有 arrival_time。
- 校验要点
  - id：^[A-Za-z0-9_-]{1,32}$
  - name/theme：非空，长度 ≤ 120
  - timezone：有效 IANA 时区名
  - HH:mm+dd：^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$
  - service_days：元素 1..7，去重
  - includes/excludes：YYYY-MM-DD，日期合法且不重复
  - ranges：start ≤ end；weekdays 取值 1..7
  - rules：start ≤ end；WEEKLY 需要 weekdays；DAILY 忽略 weekdays
  - carriages/rows_per_carriage：整数 ≥ 1
  - sales_close_before_departure_minutes：整数 ≥ 0
  - stations：长度 ≥ 2；各时刻单调不倒退（按相对绝对时间比较）


3) 运行日合并规则（混合模式）

- 输入窗口 W：from..to（含边界，格式 YYYY-MM-DD），在 train.timezone 的本地日历上取日集合。
- 合并顺序（排除优先）：
  1. 基础周模式：S = { d ∈ W | weekday(d, tz) ∈ service_days }（若缺省 service_days，则 S 初始为空）
  2. include_ranges：S = S ∪ datesFrom(include_ranges)
  3. rules：S = S ∪ datesFrom(rules)
  4. includes：S = S ∪ includes
  5. exclude_ranges：S = S − datesFrom(exclude_ranges)
  6. excludes：S = S − excludes
- 结果：S 去重并排序后作为可运行日
- 状态与可见性：
  - draft/archived：不生成运行日；不参与任何售卖逻辑
  - hidden：生成运行日，但不在公共列表展示
  - paused：生成运行日，但禁售
  - deprecated/active：正常生成


4) 售票开闭计算

- open_at(service_date)
  - 若 sales_open_rel 缺省：开售时间为 −∞（即仅由 close_at 与状态限制）
  - 否则：open_at = service_date + sales_open_rel（按 train.timezone）
- close_at(service_date, from_station_index)
  - depart_abs = 以 from_station_index 对应站点的 departure_time 计算的本地绝对时间，再转换为绝对时间
  - close_at = depart_abs − sales_close_before_departure_minutes（单位：分钟）
- is_on_sale(now, service_date, from_station_index)
  - 若 status ∈ {draft, archived, paused}：false
  - 若 service_date ∉ 合法运行日：false
  - 若 close_at ≤ now：false
  - 若 sales_open_rel 存在且 now < open_at：false
  - 否则 true


5) 房间ID规范与示例

- 统一格式（均为字符串，room 的生命周期状态：pending/open/closed）：
  - 全车次：train-${trainId}-${serviceDate}-global_${arrivalISO}
  - 指定车厢：train-${trainId}-${serviceDate}-carriage-${carriageNumber}_${arrivalISO}
  - 同排（邻座排）：train-${trainId}-${serviceDate}-seat-row-${rowPadded}_${arrivalISO}
  - 精确席位：train-${trainId}-${serviceDate}-seat-${rowPadded}${seatLetter}_${arrivalISO}
- 约定
  - serviceDate：YYYY-MM-DD（train.timezone）
  - rowPadded：行号左侧零填充两位（例如 07）
  - seatLetter：A/B/C/D/F
  - arrivalISO：用户旅程“到达站”的本地绝对时间（train.timezone）转为 ISO8601 字符串（包含偏移，如 2025-08-16T09:20:00+08:00）。
  - 生成规则：购票成功后，根据用户 from/to 站点计算 depart_abs/arrival_abs（本地），进而得到 arrivalISO，并据此生成 1~4 个 roomId（全车次/车厢/同排/席位）。


6) 购票持久化与用户返回 DTO（字段中文解释）

- 系统持久化（示例字段集合，具体表结构可按实现演进）：
  - ticket_id: string（票据主键）
  - user_id: string（购票用户）
  - order_id: string（支付订单 ID）
  - train_id: string（车次 ID）
  - service_date: string（YYYY-MM-DD，train.timezone）
  - timezone: string（IANA）
  - from_station_index: number（上车站索引）
  - to_station_index: number（到达站索引）
  - from_station_name: string（名称快照）
  - to_station_name: string（名称快照）
  - carriage_number: number（车厢号，1..carriages）
  - row: number（行号，1..rows_per_carriage）
  - seat_letter: 'A'|'B'|'C'|'D'|'F'
  - depart_abs_local: string（ISO，本地绝对时间，含偏移）
  - arrival_abs_local: string（ISO，本地绝对时间，含偏移）
  - depart_abs_utc: string（ISO，UTC）
  - arrival_abs_utc: string（ISO，UTC）
  - room_ids: {
      global: string,
      carriage: string,
      row: string,
      seat: string
    }
  - room_status: 'pending'|'open'|'closed'（当前会话室状态）
  - status: 'pending_payment'|'paid'|'cancelled'|'refunded'|'completed'
  - created_at: string（ISO）
  - updated_at: string（ISO）
  - payment: { amount_fen: number; currency: 'CNY'; status: string; paid_at?: string; provider?: string; transaction_id?: string }
  - train_snapshot: object（购票时的列车模板快照：至少包含 id/name/theme/timezone/departure_time/stations 等）
  - pnr_code: string（取票码/短码）
  - qrcode_payload: string（二维码载荷，如 join_url 或校验数据）
  - join_tokens: { global?: string; carriage?: string; row?: string; seat?: string }（进入房间的临时鉴权令牌）
- 用户返回（组合自持久化数据）：
  - 票面信息：车次、主题、日期、席位（如 3车厢 07D）、上下车站名
  - 候车信息：发车/到达本地与列车时区时间、倒计时
  - 进入方式：join_url、二维码（qrcode_payload）
  - 支付信息：金额、状态、失败原因摘要
  - 退改签摘要：可退改、截止时间、手续费（若实现）
  - 重要：保存 from_station_name/to_station_name 快照，避免历史票据受后续改名影响


7) 查询/搜索与 UI 行为

- 数据来源：GET /data/trains.json（静态）
- 搜索能力（前端本地实现即可）：
  - 主题（theme）模糊匹配
  - 站点名（stations[].name）模糊匹配
  - 出发时刻（仅 HH:mm 部分，对 stations[0].departure_time 或全局 departure_time 进行匹配）
- 列表页：
  - 过滤：status ∈ {active, deprecated, hidden, paused}；默认隐藏 hidden，提供“显示隐藏”开关
  - 排序：computeNextDeparture(now) 从最近可售/可运行的一班开始升序
  - 卡片信息：主题、下次发车的本地/列车时区时间、售卖状态（可购/停售/暂停）
- 详情页：
  - 可选择的 service_date 仅来自“运行日合并规则”的结果
  - 站点时间轴按 HH:mm+dd 生成绝对时间，展示本地/列车时区时间
  - 候车室开闭联动：未开售/停售/暂停禁用购票与进入；开售后可进入候车室（room_status=open 前可进入等待，发车后进入对应聊天室）


8) 完整数据示例

- trains.json 片段（两条示例，覆盖跨日、日历规则、状态、售票字段；可直接解析）：

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
      { "name": "中间站", "description": "情节与镜头", "arrival_time": "09:10+00", "departure_time": "09:15+00" },
      { "name": "终点站", "description": "TOP1 与安利", "arrival_time": "09:45+00" }
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
      { "name": "午夜前", "description": "聊至深夜", "arrival_time": "23:55+00", "departure_time": "23:58+00" },
      { "name": "凌晨终点", "description": "次日抵达", "arrival_time": "00:40+01" }
    ]
  }
]
```

- 票据对象示例（系统持久化 + 用户展示必要字段）：

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
  "depart_abs_local": "2025-08-16T08:35:00+08:00",
  "arrival_abs_local": "2025-08-16T09:45:00+08:00",
  "depart_abs_utc": "2025-08-16T00:35:00Z",
  "arrival_abs_utc": "2025-08-16T01:45:00Z",
  "room_ids": {
    "global": "train-K7701-2025-08-16-global_2025-08-16T09:45:00+08:00",
    "carriage": "train-K7701-2025-08-16-carriage-3_2025-08-16T09:45:00+08:00",
    "row": "train-K7701-2025-08-16-seat-row-07_2025-08-16T09:45:00+08:00",
    "seat": "train-K7701-2025-08-16-seat-07D_2025-08-16T09:45:00+08:00"
  },
  "room_status": "pending",
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
      { "name": "中间站", "description": "情节与镜头", "arrival_time": "09:10+00", "departure_time": "09:15+00" },
      { "name": "终点站", "description": "TOP1 与安利", "arrival_time": "09:45+00" }
    ]
  },
  "pnr_code": "PNR8X3Y9Z",
  "qrcode_payload": "https://webgreentrain.example/join?ticket=tkt_9fK2Z7X",
  "join_tokens": {
    "global": "jtk_global_abc",
    "carriage": "jtk_car_3_def",
    "row": "jtk_row_07_ghi",
    "seat": "jtk_seat_07D_jkl"
  }
}
```

实现提示（非规范约束）：
- 绝对时间计算建议统一封装：toLocalZonedDateTime(service_date, rel) / toUTCISO(localZdt)
- computeNextDeparture(train, now)：在 [today, today+N]（train.timezone）窗口内取最近一个 service_date，结合 stations[0].departure_time 生成绝对时间，用于排序
- 缓存未来 N 天（如 60–90 天）的运行日集合，减少重复计算
- 单测覆盖：周模式、包含/排除优先级、区间边界、跨日、闰年、非法输入
