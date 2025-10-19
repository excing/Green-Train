绿皮车是一款基于兴趣匹配的临时性陌生人聊天应用。它通过模拟火车行程的方式,为用户提供随机、短暂但高度契合的会话体验。

列表数据结构:

有 ID, 名称, 主题, 描述, 站点列表, 发车时间, 状态, 车厢数量, 每节车厢有多少排座位.
站点结构: 站名,描述,到站时间,出发时间

每排座位固定为 5 个并按 A,B,C,D,F 命名

比如乘坐的是 K7701, 购买的的是 3车厢, 7排, 第4个座位, 那么车票上会显示: 3车厢 07D.

```json
// static/data/trains.json
[
  {
    "id": "K7701",
    "name": "K7701",
    "theme": "聊聊诺兰的新电影",
    "description": "《星际穿越》、《盗梦空间》、《 Dunkirk 》……你最喜欢诺兰的哪部作品？",
    "stations": [
        {
            "name": "起始站",
            "description": "整体初印象",
            "arrival_time": "08:30+00", // 格式: HH:mm+dd, dd 为两位跨日偏移（00=同日，01=次日，02=第三天……）, 起始站无到站时间
            "departure_time": "08:35+00" // 格式: HH:mm+dd, 终点站无出发时间
        }
    ],
    "carriages": 10,
    "rows_per_carriage": 20,
    "timezone": "Asia/Shanghai",
    "service_days": [1, 3, 5], // 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六, 7=周日, 具体见: 列车可选运行日
    "calendar": {
        "includes": ["2025-08-15"],
        "excludes": ["2025-08-16"]
    }
  },
  ...
]
```

1) 主界面模仿火车大厅的大屏列表班次滚动效果, 数据来源静态配置文件 `static/data/trains.json`, 可通过 `/data/trains.json` http 请求获取.
2) 车次详情, 每列车次的站点信息, 通过 `static/data/trains.json` http 请求获取, 然后筛选出对应车次的站点信息.
3) 用户购票后, 会收到一个包含车次、站点、座位等信息的虚拟纪念票.
4) 用户购票界面可以选择上车站和下车站, 以确定自己的旅程.
5) 购票成功后, 用户会进入候车室, 等待列车发车.
6) 列车发车后, 用户会按照购票时分配的车厢和座位, 进入聊天室.
7) 交流结束时, 用户可以选择收藏一段对话, 以纪念这段旅程.

其他:

1) 界面默认中文，时间显示始终两个, 一个是用户本地的时间, 一个是列车所在时区的时间.
2) 查询, 可按出发时间, 站点名和车次主题搜索
3) 列车出发后, 开启聊天室, 按车次/车厢和同排分成三个聊天室, 聊天室频道名 (roomId) 为: 
  - 车次频道: `train-${trainId}-global_${arrival_time}`
  - 车厢频道: `train-${trainId}-carriage-${carriageNumber}_${arrival_time}`
  - 邻座频道: `train-${trainId}-seat-${seatNumber}_${arrival_time}`
4) 先做 UI + 假数据流（本地单机体验/本地群聊模拟）+ 预留接口
5) 配色方案模拟绿皮火车的色系

### 列车可选运行日
这是“混合模式（service_days + calendar 增量/排除）”的完整规则说明与示例（不使用 active_from/active_to）：

一、字段定义

service_days: number[]（可选）
取值 1..7，含义：1=周一 … 7=周日
为空或缺省表示“基础周模式不限制”
calendar: 对象（可选）
includes?: string[]（YYYY-MM-DD），白名单：单日加开
excludes?: string[]（YYYY-MM-DD），黑名单：单日取消
include_ranges?: { start: string; end: string; weekdays?: number[] }[]
将区间内的全部日期（若提供 weekdays 则仅匹配这些周几）加入白名单
exclude_ranges?: { start: string; end: string; weekdays?: number[] }[]
将区间内的匹配日期加入黑名单
rules?: { freq: 'DAILY'|'WEEKLY'|'MONTHLY'; weekdays?: number[]; start: string; end: string }[]
规则驱动生成白名单日期
DAILY/WEEKLY 支持；MONTHLY 可选（若实现）
其他相关约定
timezone: string（如 "Asia/Shanghai"），用于计算“日期与周几”
模板时刻使用 “HH:mm+dd”，仅影响出发/到达绝对时间，不改变 service_date 的定义
service_date 始终指开行日（按 timezone 判定的日期）
二、计算范畴与窗口

所有计算在查询窗口 [from, to] 内进行（包含边界，格式 YYYY-MM-DD，按 train.timezone 的本地日历）
getServiceDates(train, from, to, timezone) -> Set<YYYY-MM-DD>
isServiceDay(train, date, timezone) -> boolean
computeNextDeparture(train, now, timezone) 依赖 getServiceDates(now_date..now_date+N)
三、合并算法（优先级与顺序）
给定窗口内所有本地日历日期集合 W：

基础集合 S = { d ∈ W | weekday(d, tz) ∈ service_days }；若 service_days 缺省，则 S = ∅
S = S ∪ datesFrom(include_ranges, tz) ∩ W
S = S ∪ datesFrom(rules, tz) ∩ W
S = S ∪ includes ∩ W
S = S − datesFrom(exclude_ranges, tz)
S = S − excludes
优先级冲突处理：
排除优先：若某日同时被包含与排除，最终不运行
范围外日期忽略
结果去重并按日期排序用于展示或进一步计算
说明：

若仅使用 calendar（不设 service_days），算法仍有效（S 从日历规则构建）
include_ranges/rules/ includes 只是“加法”，excludes/exclude_ranges 是“减法”
weekday 以 train.timezone 的本地周几判定
四、校验规范

日期字符串：YYYY-MM-DD（校验闰年与合法月份/日）
weekdays 值域：1..7
ranges 的 start ≤ end
rules：
start ≤ end
DAILY: 忽略 weekdays（可允许存在但不生效）
WEEKLY: 需要 weekdays，值域 1..7
MONTHLY（若实现）：可以不需要 weekdays（表示每月的“start..end”每日），或增加 byMonthDay 扩展
HH:mm+dd 校验：^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$
五、边界与语义

service_date 与周几计算基于 train.timezone，不受用户本地时区影响
跨午夜/多日行程：由 “HH:mm+dd” 负责，不改变 service_date 的选取
窗口必须有限（例如未来 60–90 天）；UI 可分页或滚动扩展窗口
冲突示例：某日被 include_ranges 添加、同时被 excludes 移除 → 最终不运行（排除优先）
六、完整示例

示例 1：基础周模式（每周一三五）
{
"id": "K8001",
"timezone": "Asia/Shanghai",
"departure_time": "21:00+00",
"service_days": [1, 3, 5]
}

示例 2：基础周模式 + 单日加开/取消
语义：每周一三五运行；8/15 取消，8/16 临时加开
{
"id": "K8002",
"timezone": "Asia/Shanghai",
"departure_time": "20:30+00",
"service_days": [1, 3, 5],
"calendar": {
"excludes": ["2025-08-15"],
"includes": ["2025-08-16"]
}
}

示例 3：基础周模式 + 区间周末加开 + 单日取消
语义：平时一三五；暑期周末（7/1–8/31 的周六周日）加开；7/20 停运
{
"id": "K8003",
"timezone": "Asia/Shanghai",
"departure_time": "10:00+00",
"service_days": [1, 3, 5],
"calendar": {
"include_ranges": [
{ "start": "2025-07-01", "end": "2025-08-31", "weekdays": [6, 7] }
],
"excludes": ["2025-07-20"]
}
}

示例 4：纯日历（仅这几个明确日期）
{
"id": "K8004",
"timezone": "Asia/Shanghai",
"departure_time": "08:00+00",
"calendar": {
"includes": ["2025-10-01", "2025-10-02", "2025-10-03"]
}
}

示例 5：规则驱动（周二四 + 春节周每日加开 + 情人节取消）
语义：全年周二四，春节周（2/10–2/16）每日加开；2/14 停运
{
"id": "K8005",
"timezone": "Asia/Shanghai",
"departure_time": "18:45+00",
"service_days": [2, 4],
"calendar": {
"rules": [
{ "freq": "WEEKLY", "weekdays": [2, 4], "start": "2025-01-01", "end": "2025-12-31" },
{ "freq": "DAILY", "start": "2025-02-10", "end": "2025-02-16" }
],
"excludes": ["2025-02-14"]
}
}

示例 6：工作日 + 寒假停运（黑名单区间）
{
"id": "K8006",
"timezone": "Asia/Shanghai",
"departure_time": "07:20+00",
"service_days": [1, 2, 3, 4, 5],
"calendar": {
"exclude_ranges": [
{ "start": "2025-01-20", "end": "2025-02-20" }
]
}
}

七、实现与性能要点

周几计算必须基于 train.timezone 的本地日期
合并时先构建“候选集合”，最后统一去重与排除
推荐缓存未来 N 天（如 60–90 天）的服务日期结果；列表页用缓存 + 增量更新
单测覆盖：周模式、包含/排除优先级、区间边界、rules 生成、闰年 2/29、跨年周几、非法输入
需要我把这套规则落进代码（类型、解析、合并算法、单测与 UI 日期选择）吗？我可以直接在 Green-Train 中实现并对接到“下一班”计算与详情页日期选择。