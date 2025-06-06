# CF 图像托管 - 现代化的多用户文件管理系统

一个综合性的、现代化的文件托管系统，使用 React、TypeScript 和 Cloudflare Workers 构建，具有玻璃拟物化设计、高级文件管理和企业级安全特性。

## 🚀 特性

### 核心功能
- **多用户系统**: 基于邀请的注册，具有基于角色的权限（管理员、用户、访客）
- **高级文件管理**: 支持图像、视频、文档和存档，具有分层文件夹结构
- **Cloudflare 集成**: 由 Cloudflare R2 提供存储，KV 提供元数据，Workers 提供无服务器后端
- **智能共享**: 可配置的链接共享，具有过期时间、密码保护和访问控制

### 现代 UI/UX
- **玻璃拟物化设计**: 美观的磨砂玻璃效果和现代视觉元素
- **动态主题**: 亮/暗模式，具有系统偏好同步和自定义颜色方案
- **流畅动画**: 由 Framer Motion 驱动的微交互和页面过渡
- **粒子效果**: 交互式背景动画和上传视觉效果
- **响应式设计**: 针对桌面、平板电脑和移动设备进行了优化

### 安全 & 性能
- **JWT 身份验证**: 安全的基于令牌的身份验证，具有刷新功能
- **速率限制**: 内置的防止暴力破解和滥用保护
- **文件验证**: 综合性的文件类型和大小验证
- **分块上传**: 支持大文件上传，具有进度跟踪
- **CDN 加速**: 通过 Cloudflare 的网络进行全球内容分发

## 🛠️ 技术栈

### 前端
- 使用 TypeScript 的 **React 18**
- 用于快速开发和构建的 **Vite**
- 用于样式设计的 **Tailwind CSS**，具有自定义玻璃拟物化实用程序
- 用于动画和过渡的 **Framer Motion**
- 用于状态管理的 **Zustand**
- 用于服务器状态管理的 **React Query**
- 用于表单处理的 **React Hook Form**

### 后端
- 使用 TypeScript 的 **Cloudflare Workers**
- 用于文件存储的 **Cloudflare R2**
- 用于元数据和缓存的 **Cloudflare KV**
- 用于身份验证的 **自定义 JWT** 实现
- **速率限制** 和安全中间件

## 📦 安装

### 前提条件
- Node.js 18+
- npm 或 yarn
- 具有 Workers 和 R2 访问权限的 Cloudflare 帐户
- 全局安装的 Wrangler CLI

### 1. 克隆并安装依赖项

```bash
git clone <repository-url>
cd cf-image
npm install
```

### 2. 环境设置

在根目录中创建一个 `.env` 文件：

```env
VITE_API_URL=http://localhost:8787
```

### 3. Cloudflare 设置

#### 创建 KV 命名空间
```bash
# 创建 KV 命名空间
wrangler kv:namespace create "USERS_KV"
wrangler kv:namespace create "FILES_KV" 
wrangler kv:namespace create "INVITATIONS_KV"
wrangler kv:namespace create "SESSIONS_KV"

# 创建用于开发的预览命名空间
wrangler kv:namespace create "USERS_KV" --preview
wrangler kv:namespace create "FILES_KV" --preview
wrangler kv:namespace create "INVITATIONS_KV" --preview
wrangler kv:namespace create "SESSIONS_KV" --preview
```

#### 创建 R2 Bucket
```bash
wrangler r2 bucket create cf-image-hosting-files
```

#### 更新 wrangler.toml
使用您的实际命名空间 ID 和存储桶名称更新 `wrangler.toml` 文件。

#### 设置密钥
```bash
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_EMAIL
```

### 4. 开发

启动前端开发服务器：
```bash
npm run dev
```

启动 Cloudflare Workers 开发服务器：
```bash
npm run worker:dev
```

前端将在 `http://localhost:3000` 上可用，API 将在 `http://localhost:8787` 上可用。

## 🚀 部署

### 前端部署
构建前端并将其部署到您首选的托管服务：

```bash
npm run build
```

构建的文件将在 `dist` 目录中。

### 后端部署
部署 Cloudflare Worker：

```bash
npm run worker:deploy
```

## 📖 API 文档

### 身份验证端点

#### POST /auth/login
使用电子邮件和密码登录。

**请求：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username",
      "role": "user"
    },
    "token": "jwt-token"
  }
}
```

#### POST /auth/register
使用邀请码注册新用户。

**请求：**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "invitationCode": "ABC12345"
}
```

#### GET /auth/me
获取当前用户信息（需要身份验证）。

### 文件管理端点

#### GET /files
列出文件和文件夹（需要身份验证）。

#### POST /files/upload
上传文件（需要身份验证）。

#### POST /files/folder
创建一个新文件夹（需要身份验证）。

#### DELETE /files
删除文件（需要身份验证）。

#### GET /files/:id/download
下载文件。

#### GET /files/:id/thumbnail
获取文件缩略图。

### 管理员端点

#### GET /admin/users
列出所有用户（需要管理员角色）。

#### POST /admin/invitations
创建邀请码（需要管理员角色）。

#### GET /admin/stats
获取系统统计信息（需要管理员角色）。

## 🎨 自定义

### 主题配置
主题系统支持：
- 亮/暗/系统模式
- 自定义主色和强调色
- 玻璃拟物化效果切换
- 动画偏好
- 粒子效果控制

### 文件类型支持
当前支持的文件类型：
- **图像**: JPG, PNG, GIF, WEBP, SVG
- **视频**: MP4, WEBM, MOV
- **文档**: PDF, DOCX, PPTX, XLSX
- **存档**: ZIP, RAR

## 🔒 安全特性

- **仅限邀请注册**，具有管理员控制的代码
- **基于 JWT 的身份验证**，具有可配置的过期时间
- **速率限制** 在敏感端点上
- **文件类型验证** 和大小限制
- **CORS 保护** 具有可配置的来源
- 使用 SHA-256 进行 **密码哈希**
- 文件的 **防盗链** 保护

## 📱 移动支持

该应用程序是完全响应式的，包括：
- 触摸友好的界面
- 移动优化的文件上传
- 用于导航的滑动操作
- 渐进式 Web 应用程序功能

## 🤝 贡献

1. Fork 仓库
2. 创建一个功能分支
3. 进行更改
4. 如果适用，添加测试
5. 提交 Pull Request

## 📄 许可证

该项目根据 MIT 许可证获得许可 - 有关详细信息，请参阅 LICENSE 文件。

## 🆘 支持

如需支持和问题：
- 在 GitHub 上创建一个 issue
- 查看文档
- 查看 API 端点

## 🔄 路线图

- [ ] 高级文件搜索和过滤
- [ ] 实时协作功能
- [ ] 与外部存储提供商集成
- [ ] 高级分析和报告
- [ ] 移动应用程序
- [ ] API Webhooks 和集成
- [ ] 高级用户管理
- [ ] 文件版本控制系统

