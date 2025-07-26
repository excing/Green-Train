好的，收到您最终确认的技术方案。这是一个非常现代、高效且成本可控的选择，SvelteKit 的一体化开发体验（前端 + API）与 Vercel 的部署模型结合得天衣无缝。

现在，我将根据这份技术方案，为您编写一份专业、完整且可直接用于指导开发的产品开发文档（PDD）。

-----

## **“同频列车” 产品开发文档 (PDD)**

  * **文档版本:** 2.0 (技术开发版)
  * **状态:** **最终草案**
  * **创建日期:** 2025年7月27日
  * **更新日期:** 2025年7月27日

### **1.0 项目概述**

“同频列车”(内部代号: Project Terminus) 是一款以“短暂相遇，不留负担”为核心理念的沉浸式、低压力社交应用。本项目旨在通过模拟一次有始有终的列车旅行，为用户提供一个在特定主题下与陌生人进行高质量、限时交流的空间。V1.0 版本将聚焦于核心体验的实现，并采用极致的低成本、无状态后端架构进行部署和运营。

### **2.0 V1.0 开发目标与范围**

#### **2.1 开发目标**

  * 实现一个功能完整的最小可行产品 (MVP)，验证核心玩法和用户体验。
  * 构建一套基于 SvelteKit 和 Vercel 的，可自动部署、易于维护的技术架构。
  * 确保运营成本在 Vercel 和 Firebase 的免费额度内，实现零成本启动。

#### **2.2 范围**

  * **包含功能:** 时刻表系统、票务系统（每日补给+邀请）、1v1邻座私聊、车厢群聊、车窗风景展示、匿名/Google登录。
  * **不包含功能:** 复杂的成就/奖励系统、付费功能（月票）、用户自定义列车线路、个人主页的深度定制。

### **3.0 系统架构**

系统采用基于 Vercel 的 Serverless 架构，前后端代码统一由 SvelteKit v5 管理。

*(这是一个概念图，描述了组件间的交互)*

  * **客户端 (Client):** 用户浏览器。运行由 SvelteKit 构建的单页应用 (SPA) 或渐进式 Web 应用 (PWA)。负责UI渲染、状态管理和与API的交互。
  * **Web 服务器 / API 网关 (Vercel):** 托管 SvelteKit 应用。处理静态资源请求，并将所有 API 请求 (`/api/*`) 路由到后端的 Serverless Functions。
  * **后端服务 (SvelteKit API):** 在 SvelteKit 项目中以 API Routes 形式存在的一系列 Serverless Functions。负责处理所有业务逻辑，作为连接 Firebase 服务的桥梁，自身无状态。
  * **外部服务 (BaaS):**
      * **Firebase Authentication:** 处理用户身份验证。
      * **Firestore:** 存储除消息外的所有持久化数据。
      * **FCM:** 负责所有实时消息的下发。
      * **第三方图片服务:** 存储和分发“车窗风景”的图片资源。

### **4.0 模块化实现方案**

#### **4.1 用户认证模块 (Authentication)**

  * **技术:** `firebase` 客户端 SDK, Firebase Authentication。
  * **实现:**
    1.  在 SvelteKit 的根 `+layout.svelte` 或共享 `store.ts` 中初始化 Firebase App。
    2.  提供“匿名登录”和“使用 Google 登录”两个选项。
    3.  通过 `onAuthStateChanged` 监听器维护全局的用户登录状态。
    4.  用户登录成功后，将其 `uid`, `displayName`, `photoURL` 等信息在 Firestore 的 `users` 集合中创建或更新对应的文档。
    5.  所有需要认证的 SvelteKit API 请求，都应在请求头中附带用户的 Firebase ID Token，后端函数通过 Firebase Admin SDK 对其进行验证。

#### **4.2 时刻表与票务模块 (Schedule & Ticketing)**

  * **技术:** SvelteKit API, Firestore。
  * **实现:**
    1.  **时刻表读取:** 客户端通过调用 `GET /api/trains` 来获取列车时刻表数据。该API函数从 Firestore 的 `train_schedules` 集合中读取信息。
    2.  **购票:** 用户选择好行程后，调用 `POST /api/tickets/buy`。该API函数会：
          * 验证用户的 ID Token。
          * 在 Firestore 中检查用户的车票余额 (`users` 集合)。
          * 执行票务扣减和创建 `tickets` 文档的事务操作。
          * 返回购票成功的确认信息和该列车的 FCM Topic ID。

#### **4.3 自动调度与匹配模块 (Dispatcher)**

  * **技术:** Vercel Cron Jobs, SvelteKit API。
  * **实现:**
    1.  **触发:** Vercel Cron Job 每分钟触发 `GET /api/cron/dispatcher`。
    2.  **核心调度逻辑:** 该API函数将执行一个分层的、更复杂的调度算法：
          * **a. 获取乘客:** 查询 `train_schedules` 找到当前分钟发车的列车，并从 `tickets` 集合中获取所有乘客列表。
          * **b. 创建列车频道:** 为整个列车生成一个全局的 FCM Topic ID (e.g., `train_G2077_global`)，作为 **“列车频道”**。
          * **c. 分配车厢:**
              * 定义一个常量 `CARRIAGE_SIZE` (例如: 10人)。
              * 将乘客列表随机打乱，然后按 `CARRIAGE_SIZE` 切分成若干个“车厢”。
              * 为每个车厢生成一个独立的 FCM Topic ID (e.g., `train_G2077_carriage_1`)，作为 **“车厢频道”**。
          * **d. 分配邻座:** 在每个车厢内部，对乘客进行最终的 1v1 随机配对，形成 **“邻座频道”**。如果车厢人数为奇数，最后一名乘客将没有邻座（或可放入观察者模式）。
          * **e. 持久化匹配结果:** 将包含三层频道信息的完整匹配结果，写入 Firestore 的 `active_journeys` 集合中的一个文档里（以 `trainId` 作为文档ID）。(详见 6.0 数据模型)。
          * **f. 发送通知:** （可选，作为辅助手段）向所有乘客发送一个简单的 FCM 推送通知，提示他们“列车已发车，请打开App查看您的旅伴信息”。

#### **4.4 实时交流模块 (Communication)**

  * **技术:** FCM, SvelteKit API, 客户端 Service Worker。
  * **4.4.1 频道信息获取:**
      * **主动拉取机制:** 为保证100%送达，客户端获取频道信息不依赖被动推送。当用户打开应用，发现其购买的某趟车次状态为“已出发”时，客户端将**立即自动调用** `GET /api/journey/details?trainId=[trainId]`。
      * **API 详情:** `/api/journey/details` 函数会：
          * 验证用户身份。
          * 根据 `trainId` 从 `active_journeys` 集合中读取已生成的匹配结果。
          * 在结果中定位到请求用户，并抽取出只与该用户相关的三层频道信息（列车频道ID、TA所在的车厢频道ID、TA的邻座伙伴信息）。
          * 将这三份频道信息返回给客户端。
      * **客户端处理:** 客户端收到数据后，动态渲染出“列车”、“车厢”、“邻座”三个聊天标签页。
  * **4.4.2 消息收发架构:**
      * **原则:** 保持不变。所有消息均由 FCM 传输，后端仅作无状态转发，不在数据库存储聊天记录。
      * **群聊:** “车厢消息”和“列车消息”分别发送至其对应的 FCM Topic ID。
      * **私聊:** 消息发送至邻座 FCM Topic ID。

#### **4.5 图片资源模块 (Image Assets)**

  * **技术:** 第三方图片服务。
  * **推荐方案:**
      * **Cloudinary:** 提供强大的图片处理能力和可观的免费额度，是理想选择。
      * **GitHub Repository:** 作为最简单的零成本方案，可将图片作为静态资源存放在一个公开的 GitHub 仓库中，通过 jsDelivr 等 CDN 服务进行加速访问。

### **5.0 Firestore 数据模型**

  * **`users`**
      * `uid` (Document ID)
      * `displayName` (string)
      * `photoURL` (string)
      * `ticketCount` (number)
      * `fcmToken` (string)
  * **`train_schedules`**
      * `trainId` (Document ID)
      * `theme` (string)
      * `status` (string: "WAITING", "BOARDING", "DEPARTED")
      * `departureTime` (timestamp)
      * `stations` (array of objects: `[{name: string, duration: number}]`)
  * **`tickets`**
      * `ticketId` (Document ID)
      * `userId` (string)
      * `trainId` (string)
      * `startStationIndex` (number)
      * `endStationIndex` (number)

  * **`active_journeys` - [新/重构]** (替代原 `active_carriages`)
      * **文档 ID:** `trainId` (e.g., "G2077")
      * **字段:**
          * `trainChannelId`: (string) // 全局列车频道的FCM Topic ID
          * `createdAt`: (timestamp) // 用于设置TTL自动清理
          * `carriages`: (array of maps) // 车厢列表
              * `carriageId`: (number) // e.g., 1, 2, 3...
              * `carriageChannelId`: (string) // 该车厢的FCM Topic ID
              * `members`: (array of strings) // 该车厢所有成员的 uid 列表
              * `seatmates`: (array of maps) // 邻座配对列表
                  * `pair`: (array of strings) // `[uid1, uid2]`
                  * `seatmateChannelId`: string // 邻座 FCM Topic ID

**数据结构示例 (`active_journeys/G2077`):**

```json
{
  "trainChannelId": "train_G2077_global",
  "createdAt": "2025-07-27T01:30:00Z",
  "carriages": [
    {
      "carriageId": 1,
      "carriageChannelId": "train_G2077_carriage_1",
      "members": ["user_abc", "user_def", "user_ghi", "user_jkl"],
      "seatmates": [
        { "seatmateChannelId": "train_G2077_carriage_abc_def", "pair": ["user_abc", "user_def"] },
        { "seatmateChannelId": "train_G2077_carriage_ghi_jkl", "pair": ["user_ghi", "user_jkl"] }
      ]
    },
    {
      "carriageId": 2,
      "carriageChannelId": "train_G2077_carriage_2",
      "members": ["user_mno", "user_pqr", "user_stu"],
      "seatmates": [
        { "seatmateChannelId": "train_G2077_carriage_mno_pqr", "pair": ["user_mno", "user_pqr"] }
        // user_stu is the odd one out in this carriage
      ]
    }
  ]
}
```

### **6.0 开发与部署流程 (DevOps)**

1.  **代码管理:** 使用 Git 进行版本控制，托管于 GitHub。采用 `main` (生产) 和 `develop` (开发) 的双分支模型。
2.  **环境:**
      * **本地开发:** 运行 `svelte-kit dev`，连接到 Firebase 的开发项目。
      * **预览/Staging:** Vercel 会为每个推送到 `develop` 分支或 PR 的提交自动生成一个预览环境。
      * **生产:** 将 `develop` 分支合并到 `main` 分支后，Vercel 会自动触发生产环境的部署。
3.  **环境变量:** 所有敏感密钥（如 Firebase Admin SDK 配置）都将通过 Vercel 的环境变量进行管理，而非硬编码在代码中。

### **7.0 风险与预案**

  * **技术风险:** FCM 作为聊天通道，其送达率和延迟虽高但非100%保证。需在产品层面接受此技术特性的限制。
  * **成本风险:** 当用户量激增，Firestore 读写次数可能超出免费额度。需密切监控用量，并在接近上限时准备升级到付费“Blaze”计划。
  * **运营风险:** 初期用户少导致匹配困难。需通过“邀请奖励”机制和社群运营，集中引导用户在特定时间段“乘车”，以提高匹配率。