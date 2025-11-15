# PMER 前端 - 密码管理器

基于 Svelte + TypeScript + Tailwind CSS 的密码管理器前端应用。

## 功能特性

- ✅ 用户认证（登录/注册）
- ✅ 密码管理（增删改查）
- ✅ 命令管理（增删改查）
- ✅ 分类筛选
- ✅ 分页显示
- ✅ 密码生成器
- ✅ 剪贴板复制
- ✅ Toast 通知

## 技术栈

- **前端框架**: Svelte 5
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **路由**: svelte-routing
- **构建工具**: Vite
- **状态管理**: Svelte Stores

## 项目结构

```
web/
├── src/
│   ├── lib/
│   │   ├── api/              # API 客户端
│   │   │   ├── auth.ts       # 认证 API
│   │   │   ├── passwords.ts  # 密码 API
│   │   │   ├── commands.ts   # 命令 API
│   │   │   └── client.ts     # HTTP 客户端
│   │   ├── components/
│   │   │   ├── ui/           # UI 组件
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Label.svelte
│   │   │   │   ├── Textarea.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   └── Toast.svelte
│   │   │   └── pages/        # 页面组件
│   │   │       ├── Auth.svelte       # 登录/注册页面
│   │   │       ├── Passwords.svelte  # 密码管理页面
│   │   │       └── Commands.svelte   # 命令管理页面
│   │   ├── stores/           # 状态管理
│   │   │   └── auth.ts       # 认证状态
│   │   ├── types/            # TypeScript 类型定义
│   │   │   └── index.ts
│   │   └── utils/            # 工具函数
│   │       ├── config.ts     # 配置
│   │       └── toast.ts      # Toast 通知
│   ├── App.svelte            # 主应用组件
│   ├── main.ts               # 入口文件
│   └── app.css               # 全局样式
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── tailwind.config.js        # Tailwind 配置
├── vite.config.ts            # Vite 配置
└── package.json              # 项目依赖
```

## 开发指南

### 安装依赖

```bash
cd web
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置 API 地址：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_API_URL=http://localhost:5000
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录

### 预览生产版本

```bash
pnpm preview
```

## API 接口

前端应用依赖后端 API，请确保后端服务正在运行。

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 密码管理接口

- `GET /api/passwords/` - 获取所有密码
- `GET /api/passwords/:id` - 获取特定密码
- `POST /api/passwords/` - 创建密码
- `PUT /api/passwords/:id` - 更新密码
- `DELETE /api/passwords/:id` - 删除密码

### 命令管理接口

- `GET /api/commands/` - 获取所有命令
- `GET /api/commands/:id` - 获取特定命令
- `POST /api/commands/` - 创建命令
- `PUT /api/commands/:id` - 更新命令
- `DELETE /api/commands/:id` - 删除命令

## 设计风格

UI 组件采用类似 shadcn/ui 的设计风格：

- 深色主题（gray-900 背景）
- 蓝色主色调
- 圆角卡片设计
- 平滑的过渡动画
- 清晰的视觉层级

## 注意事项

1. **认证**: 应用使用 JWT 进行认证，token 存储在 localStorage 中
2. **安全**: master_key 包含在 JWT 中，用于加密/解密密码数据
3. **路由守卫**: 未认证用户会自动重定向到登录页面
4. **Toast 通知**: 所有操作都会有相应的成功/失败提示

## License

MIT
