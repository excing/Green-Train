# WebGreenTrain4 快速开始指南

## 项目简介

WebGreenTrain4 是一个创新的实时列车聊天平台，用户可以：
- 🚂 浏览多条列车的时间表和座位信息
- 🎫 购买列车票据
- 💬 在候车室与其他乘客进行实时聊天
- 📱 通过 FCM 接收实时消息通知

## 快速开始

### 1. 安装依赖

```bash
cd WebGreenTrain4
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 http://localhost:5173

### 3. 浏览列车

首页展示所有可用的列车，支持按主题、站点或时刻搜索。

### 4. 查看列车详情

点击列车卡片进入详情页，可以：
- 查看完整的站点时间表
- 选择出发日期
- 查看售票状态

### 5. 购票

点击"购票"按钮进入购票页面：
- 输入用户信息（名字、ID）
- 选择上下车站
- 选择座位（车厢、行号、座位字母）
- 设置票价
- 确认购票

购票成功后会生成：
- 票据号（ticket_id）
- PNR 码（取票码）
- 二维码
- 进入令牌

### 6. 进入候车室

点击"进入候车室"按钮进入实时聊天室：
- 输入用户名
- 发送消息
- 接收其他乘客的消息

## 项目结构

```
WebGreenTrain4/
├── src/
│   ├── lib/              # 核心库函数
│   ├── routes/           # 页面和 API 路由
│   └── app.css           # 全局样式
├── static/
│   └── data/
│       └── trains.json   # 列车数据
├── package.json
└── README.md
```

## 核心功能

### 列车管理
- 支持多条列车
- 每条列车有独立的时间表、座位配置、售票规则
- 支持复杂的运行日规则（周模式、包含/排除日期、规则驱动）

### 实时消息
- 基于 Firebase Cloud Messaging (FCM)
- 支持多个粒度的房间（全车次、车厢、排、座位）
- 消息不做持久化，仅中转

### 售票逻辑
- 支持开售时间和停售时间计算
- 支持多个站点的不同停售时间
- 实时显示售票状态

## 配置

### Firebase 配置

如果要启用真实的 FCM 功能，需要在 `.env` 文件中配置：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### 列车数据

列车数据存储在 `static/data/trains.json`，可以直接编辑添加新列车。

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run check

# 运行测试
npm run test

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 测试

项目包含 23 个单元测试，覆盖：
- 时间处理工具函数
- 运行日计算逻辑
- 房间 ID 生成与解析

运行测试：
```bash
npm test
```

## 绿皮列车配色

项目采用绿皮列车的经典配色：
- 深绿色 (#2d5016) - 主色
- 列车绿 (#4a7c2c) - 辅助色
- 浅绿色 (#6ba547) - 强调色
- 米色 (#f5f1e8) - 背景色

## 常见问题

### Q: 如何添加新列车？
A: 编辑 `static/data/trains.json`，按照规范添加新的列车对象。

### Q: 消息会被保存吗？
A: 不会。服务端仅中转消息，不做任何持久化。

### Q: 如何自定义配色？
A: 编辑 `src/app.css` 中的 CSS 变量。

### Q: 支持离线使用吗？
A: 目前不支持，但可以通过添加 Service Worker 来实现。

## 后续改进

- [ ] 集成真实的 Firebase Admin SDK
- [ ] 添加用户认证系统
- [ ] 集成支付网关
- [ ] 添加用户行为分析
- [ ] 支持多语言
- [ ] 添加离线支持

## 许可证

MIT

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

