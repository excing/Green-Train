# WebGreenTrain4 部署指南

## 部署前准备

### 1. 环境要求

- Node.js 18+ 
- npm 9+ 或 yarn 3+
- Firebase 项目账户

### 2. Firebase 配置

#### 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 启用 Cloud Messaging
4. 创建 Web 应用

#### 获取配置信息

在 Firebase 项目设置中获取以下信息：

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

#### 获取 VAPID 密钥

1. 在 Firebase Console 中进入 Cloud Messaging 设置
2. 在"Web 推送证书"部分生成密钥对
3. 复制公钥作为 VITE_FIREBASE_VAPID_KEY

### 3. 环境变量配置

创建 `.env.local` 文件：

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# 可选：服务端配置
FIREBASE_ADMIN_SDK_KEY=your_admin_sdk_key
```

## 本地部署

### 1. 安装依赖

```bash
npm install
```

### 2. 开发环境运行

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 类型检查

```bash
npm run check
```

### 4. 运行测试

```bash
npm test
```

## 生产部署

### 1. 构建应用

```bash
npm run build
```

输出目录：`.svelte-kit/output/`

### 2. 预览生产构建

```bash
npm run preview
```

### 3. 部署到 Vercel

#### 方式 1：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

#### 方式 2：使用 Git 集成

1. 将代码推送到 GitHub
2. 在 Vercel 中连接 GitHub 仓库
3. 配置环境变量
4. 自动部署

### 4. 部署到 Netlify

#### 方式 1：使用 Netlify CLI

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod
```

#### 方式 2：使用 Git 集成

1. 将代码推送到 GitHub
2. 在 Netlify 中连接 GitHub 仓库
3. 配置构建命令：`npm run build`
4. 配置发布目录：`.svelte-kit/output/client`
5. 配置环境变量
6. 自动部署

### 5. 部署到自定义服务器

#### 使用 Node.js

```bash
# 构建
npm run build

# 安装生产依赖
npm install --production

# 启动服务器
node build/index.js
```

#### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "build/index.js"]
```

构建和运行：

```bash
docker build -t webgreentrain4 .
docker run -p 3000:3000 -e VITE_FIREBASE_API_KEY=... webgreentrain4
```

## 部署后验证

### 1. 功能测试

- [ ] 列车列表加载正常
- [ ] 搜索功能正常
- [ ] 购票流程正常
- [ ] 消息发送接收正常
- [ ] 页面响应速度快

### 2. 性能检查

```bash
# 使用 Lighthouse
npm install -g lighthouse
lighthouse https://your-domain.com
```

### 3. 监控和日志

配置错误监控（可选）：

```javascript
// 使用 Sentry
import * as Sentry from "@sentry/svelte";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production"
});
```

## 常见问题

### Q: 部署后 FCM 消息不工作？
A: 检查 Firebase 配置和 VAPID 密钥是否正确配置。

### Q: 如何更新列车数据？
A: 编辑 `static/data/trains.json` 并重新部署。

### Q: 如何处理 CORS 错误？
A: 在 Firebase 中配置 CORS 规则，或使用代理。

### Q: 如何扩展应用？
A: 使用 SvelteKit 的 API 路由和数据库集成。

## 性能优化

### 1. 缓存策略

```javascript
// 在 svelte.config.js 中配置
export default {
  kit: {
    adapter: adapter({
      precompress: true
    })
  }
};
```

### 2. 图片优化

使用 WebP 格式和响应式图片。

### 3. 代码分割

SvelteKit 自动进行代码分割。

### 4. CDN 配置

使用 CDN 加速静态资源。

## 安全建议

1. **HTTPS**：始终使用 HTTPS
2. **环境变量**：不要在代码中硬编码敏感信息
3. **CORS**：配置正确的 CORS 策略
4. **速率限制**：添加 API 速率限制
5. **输入验证**：验证所有用户输入
6. **依赖更新**：定期更新依赖

## 监控和维护

### 1. 日志监控

```bash
# 查看应用日志
npm run build && npm run preview
```

### 2. 性能监控

使用 Web Vitals 监控性能指标。

### 3. 错误追踪

使用 Sentry 或类似服务追踪错误。

### 4. 用户分析

使用 Google Analytics 或 Mixpanel 分析用户行为。

## 回滚计划

如果部署出现问题：

1. 立即回滚到上一个版本
2. 检查错误日志
3. 修复问题
4. 重新部署

## 支持和帮助

- 查看 [SvelteKit 文档](https://kit.svelte.dev/)
- 查看 [Firebase 文档](https://firebase.google.com/docs)
- 查看 [Vercel 文档](https://vercel.com/docs)

---

**最后更新**：2025-10-19

