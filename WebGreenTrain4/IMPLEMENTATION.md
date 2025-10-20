# WebGreenTrain4 实现文档

## 项目概述

WebGreenTrain4 是一个基于 SvelteKit + Firebase 的实时列车聊天平台。用户可以购票、进入候车室，与其他乘客进行实时聊天。

### 核心特性

1. **列车管理**：支持多条列车，每条列车有独立的时间表、座位配置和售票规则
2. **实时消息**：使用 Firebase Cloud Messaging (FCM) 实现实时消息推送
3. **房间管理**：基于 FCM topic 的房间系统，支持全车次、车厢、排、座位等多个粒度
4. **无持久化**：服务端仅中转消息，不做任何数据持久化
5. **绿皮列车配色**：采用绿皮列车的经典配色，适应现代年轻人审美

## 项目架构

### 目录结构

```
src/
├── lib/
│   ├── types.ts              # 核心数据类型定义
│   ├── time.ts               # 时间处理工具函数
│   ├── calendar.ts           # 运行日计算逻辑
│   ├── sales.ts              # 售票逻辑
│   ├── room.ts               # 房间 ID 生成与管理
│   ├── trains.ts             # 列车数据加载与搜索
│   ├── fcm-client.ts         # 客户端 FCM 管理器
│   └── __tests__/            # 单元测试
├── routes/
│   ├── +page.svelte          # 列表页
│   ├── trains/
│   │   ├── [id]/
│   │   │   ├── +page.svelte  # 详情页
│   │   │   ├── book/
│   │   │   │   └── +page.svelte  # 购票页
│   │   │   └── room/
│   │   │       └── [roomId]/
│   │   │           └── +page.svelte  # 候车室
│   └── api/
│       ├── tickets/
│       │   └── +server.ts    # 购票 API
│       ├── messages/
│       │   └── send/
│       │       └── +server.ts  # 消息发送 API
│       └── fcm/
│           ├── subscribe/
│           │   └── +server.ts  # FCM 订阅 API
│           └── unsubscribe/
│               └── +server.ts  # FCM 取消订阅 API
└── app.css                   # 全局样式（绿皮列车配色）
```

## 核心模块说明

### 1. 数据类型 (types.ts)

定义了所有核心数据结构：
- `Train`: 列车模板
- `Ticket`: 票据对象
- `RealtimeMessage`: 实时消息
- `Room`: 房间信息
- `RoomIds`: 房间 ID 集合

### 2. 时间处理 (time.ts)

使用 Luxon 库处理时区和日期：
- `toLocalAbsoluteTime()`: 将相对时刻转换为本地绝对时间
- `toUTCISO()`: 转换为 UTC ISO 字符串
- `getWeekday()`: 获取日期的周几
- `compareDates()`: 比较日期
- `getDateRange()`: 获取日期范围

### 3. 运行日计算 (calendar.ts)

实现规范中的运行日合并规则：
- `computeServiceDates()`: 计算列车在指定时间窗口内的运行日
- 支持周模式、包含/排除范围、规则驱动等

### 4. 售票逻辑 (sales.ts)

实现售票开闭计算：
- `getOpenAt()`: 计算开售时间
- `getCloseAt()`: 计算停售时间
- `isOnSale()`: 检查是否在售
- `getSalesStatusText()`: 获取售票状态文案

### 5. 房间管理 (room.ts)

房间 ID 生成与解析：
- `generateRoomIds()`: 生成房间 ID 集合（全车次、车厢、排、座位）
- `parseRoomId()`: 解析房间 ID
- `generatePNRCode()`: 生成取票码
- `generateJoinToken()`: 生成进入令牌

### 6. 列车数据 (trains.ts)

列车数据加载与搜索：
- `loadTrains()`: 从 /data/trains.json 加载列车数据
- `searchTrains()`: 搜索列车（主题、站点、时刻）
- `sortTrainsByNextDeparture()`: 按下一班发车时间排序

### 7. FCM 客户端 (fcm-client.ts)

客户端 FCM 管理：
- `initFCM()`: 初始化 FCM
- `getFCMToken()`: 获取 FCM 令牌
- `subscribeToRoom()`: 订阅房间主题
- `listenToMessages()`: 监听消息
- `sendMessageToRoom()`: 发送消息

## API 端点

### POST /api/tickets
创建票据（购票）

**请求体**：
```json
{
  "user_id": "user_123",
  "train_id": "K7701",
  "service_date": "2025-08-16",
  "from_station_index": 0,
  "to_station_index": 2,
  "carriage_number": 3,
  "row": 7,
  "seat_letter": "D",
  "amount_fen": 990,
  "train_snapshot": { ... }
}
```

**响应**：完整的 Ticket 对象

### POST /api/messages/send
发送消息到房间

**请求体**：
```json
{
  "room_id": "train-K7701-2025-08-16-seat-07D_...",
  "user_id": "user_123",
  "user_name": "张三",
  "content": "你好！",
  "type": "text"
}
```

### POST /api/fcm/subscribe
订阅房间主题

**请求体**：
```json
{
  "token": "FCM_TOKEN",
  "topic": "train-K7701-2025-08-16-global_..."
}
```

### POST /api/fcm/unsubscribe
取消订阅房间主题

## UI 配色方案

采用绿皮列车的经典配色，适应现代年轻人审美：

- **主色**：`#2d5016` (深绿)
- **辅助色**：`#4a7c2c` (列车绿)、`#6ba547` (浅绿)
- **背景**：`#f5f1e8` (米色)
- **强调色**：`#ff6b6b` (红色)

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 运行测试

```bash
npm test
```

### 类型检查

```bash
npm run check
```

### 构建生产版本

```bash
npm run build
```

## 关键设计决策

1. **无持久化**：服务端仅中转消息，所有数据存储在客户端或 FCM
2. **FCM Topic 即 Room ID**：简化房间管理，直接使用 FCM topic 作为房间标识
3. **客户端计算**：运行日、售票逻辑等复杂计算在客户端完成
4. **类型安全**：使用 TypeScript 和 Zod 进行严格的类型检查
5. **模块化**：将功能分解为独立的工具函数，便于测试和复用

## 测试覆盖

- ✅ 时间处理工具函数 (9 个测试)
- ✅ 运行日计算逻辑 (5 个测试)
- ✅ 房间 ID 生成与解析 (9 个测试)

总计：23 个测试，全部通过

## 后续改进方向

1. **Firebase Admin SDK 集成**：实现真正的 FCM 消息推送
2. **用户认证**：添加用户登录和身份验证
3. **支付集成**：集成支付网关处理真实交易
4. **数据分析**：添加用户行为分析和统计
5. **国际化**：支持多语言界面
6. **离线支持**：添加 Service Worker 支持离线功能

