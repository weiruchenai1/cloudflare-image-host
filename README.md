# CloudFlare Image Host

现代化多用户文件托管解决方案，基于 Cloudflare Pages 构建。

## ✨ 功能特性

### 🏢 多用户系统
- **邀请码注册**：管理员生成邀请码，用户通过邀请码注册
- **角色权限**：管理员和普通用户角色分离
- **默认管理员**：首次部署自动创建 `admin/admin123` 账号
- **密码管理**：管理员可重置用户密码

### 📁 文件管理
- **路径隔离**：用户文件按 `/{userId}/{folder}/{filename}` 隔离存储
- **重名检测**：上传时检查文件名冲突，提示重命名
- **自定义命名**：支持原名、自定义、时间戳、随机命名
- **文件夹管理**：支持多级文件夹结构（最多3层）

### 🔐 权限控制
- **用户认证**：基于 Session 的认证机制
- **配额限制**：用户独立存储配额管理
- **文件权限**：用户只能访问自己的文件
- **管理员特权**：管理员可访问所有文件和用户管理

### 📦 存储支持
- **Telegram Bot**：通过 Telegram 频道存储
- **Cloudflare R2**：原生 R2 对象存储
- **S3 兼容**：支持各种 S3 兼容存储
- **外链模式**：支持外部链接存储

## 🚀 快速开始

### 环境要求
- Cloudflare Pages 账号
- Cloudflare KV 数据库（存储用户和文件元数据）
- 可选：R2 存储桶或 Telegram Bot

### 部署步骤

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/cloudflare-image-host.git
   ```

2. **配置 Cloudflare Pages**
   - 在 Cloudflare Dashboard 创建新的 Pages 项目
   - 连接到你的 GitHub 仓库
   - 构建命令：`npm install`
   - 输出目录：`./`

3. **配置 KV 数据库**
   - 创建 KV 命名空间：`img_url`
   - 在 Pages 设置中绑定 KV 变量

4. **可选：配置存储后端**
   - **Telegram**: 设置 `TG_BOT_TOKEN` 和 `TG_CHAT_ID`
   - **R2**: 创建 R2 存储桶并绑定
   - **S3**: 配置 S3 兼容存储凭据

5. **首次登录**
   - 访问部署的网站
   - 使用默认账号：`admin` / `admin123`
   - **必须立即修改密码**

## 📖 使用指南

### 管理员操作

#### 生成邀请码
```javascript
POST /api/admin/invites
{
  quota: 1073741824,  // 1GB (字节)
  expiresIn: 604800   // 7天 (秒)
}
```

#### 用户管理
- 查看用户列表：`GET /api/admin/users`
- 重置密码：`PUT /api/admin/users/{userId}` with `action=resetPassword`
- 修改配额：`PUT /api/admin/users/{userId}` with `action=updateQuota`
- 暂停用户：`PUT /api/admin/users/{userId}` with `action=updateStatus`

### 用户操作

#### 注册登录
```javascript
// 注册
POST /api/auth/register
{
  username: "testuser",
  password: "password123",
  inviteCode: "ABC12345"
}

// 登录
POST /api/auth/login
{
  username: "testuser",
  password: "password123"
}
```

#### 文件上传
```javascript
POST /upload
FormData:
  file: File
  customName: "my-file.jpg"     // 可选
  folder: "photos/2024"         // 可选
  nameType: "custom"            // origin|custom|index|short
```

### API 响应示例

**成功上传**
```json
{
  "success": true,
  "files": [{"src": "/file/user123/photos/my-file.jpg"}]
}
```

**文件重名**
```json
{
  "success": false,
  "error": "FILE_EXISTS",
  "message": "文件名 'my-file.jpg' 已存在",
  "suggestion": "my-file_1704067200000.jpg"
}
```

**配额不足**
```json
{
  "success": false,
  "error": "QUOTA_EXCEEDED", 
  "message": "存储配额不足"
}
```

## 🔧 配置说明

### 环境变量
```
# Telegram Bot 配置
TG_BOT_TOKEN=your_bot_token
TG_CHAT_ID=your_chat_id

# 开发模式
dev_mode=false
```

### KV 数据结构
```javascript
// 用户数据
users:{userId} = {
  username: "string",
  password: "hash",
  role: "admin|user", 
  quota: {used: 0, total: 1073741824},
  status: "active|suspended",
  // ...
}

// 邀请码
invites:{code} = {
  code: "string",
  createdBy: "userId",
  quota: 1073741824,
  expiresAt: timestamp,
  // ...
}

// 文件元数据
{userId}/{folder}/{filename} = {
  FileName: "file.jpg",
  ownerId: "userId",
  FileSize: "2.5",
  Channel: "TelegramNew",
  // ...
}
```

## 🛡️ 安全特性

- **密码哈希**：使用 SHA-256 + 盐值
- **会话管理**：30天过期，支持多设备
- **路径防护**：防止目录遍历攻击
- **文件隔离**：严格的用户文件访问控制
- **配额限制**：防止滥用存储资源

## 🔄 从原版迁移

如果你使用原版 CloudFlare-ImgBed，迁移到多用户版本：

1. 备份现有 KV 数据
2. 部署新版本
3. 管理员登录后可以看到所有历史文件
4. 原文件访问路径保持不变

## 📄 许可证

基于原项目 [CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed) 开发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

- 查看原项目文档：[cfbed.sanyue.de](https://cfbed.sanyue.de)
- 提交问题：GitHub Issues
- 技术讨论：参考原项目社区