# AI智能家教系统

一个支持多种AI模型的智能家教系统，提供现代化的用户体验和丰富的交互功能。

## 功能特点

### 🎨 设计风格
- 参考DeepSeek的现代化设计语言
- 深色侧边栏与浅色主内容区域的对比设计
- 简洁直观的用户界面
- 响应式布局，支持移动端访问

### 💬 聊天功能
- 实时消息发送和接收
- 支持Markdown格式渲染
- 消息历史记录管理
- 多AI提供商支持（DeepSeek、Gemini 2.5）
- 智能模型切换功能

### 🛠 交互功能
- 消息复制、编辑、删除
- 消息评价（点赞/点踩）
- 字符计数和输入限制
- 键盘快捷键支持（Enter发送，Shift+Enter换行）

### 📱 响应式设计
- 移动端适配
- 侧边栏折叠功能
- 触摸友好的交互

## 技术栈

- **HTML5**: 语义化标记
- **CSS3**: 现代样式和动画
- **JavaScript**: 原生ES6+语法
- **Font Awesome**: 图标库
- **GLM API**: AI模型支持
- **DeepSeek API**: AI模型支持

## 项目结构

```
ai-chat-interface/
├── src/                    # 源代码目录
│   ├── config/            # 配置文件
│   │   └── config.js      # 应用配置
│   ├── css/               # 样式文件
│   │   ├── main.css       # 主样式
│   │   └── components.css # 组件样式
│   ├── js/                # JavaScript文件
│   │   ├── utils.js       # 工具函数
│   │   ├── api.js         # API服务
│   │   ├── components.js  # UI组件
│   │   └── app.js         # 主应用逻辑
│   └── index.html         # 主页面
├── assets/                # 静态资源
│   ├── images/            # 图片资源
│   └── icons/             # 图标资源
├── docs/                  # 文档目录
│   ├── api/               # API文档
│   │   └── api-reference.md
│   └── development-guide.md # 开发指南
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 其他可用命令

```bash
# 启动生产服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test

# 使用静态文件服务器
npm run serve
```

或者直接在浏览器中打开 `src/index.html` 文件。

## 使用说明

### 基本操作
1. 在输入框中输入消息
2. 按 Enter 发送消息，或点击发送按钮
3. 使用 Shift + Enter 进行换行

### 消息管理
- 点击消息旁的操作按钮可以复制、编辑或删除消息
- 对AI回复可以进行点赞或点踩评价
- 点击"新对话"按钮开始新的聊天

### 聊天历史
- 左侧边栏显示聊天历史记录
- 点击历史记录可以切换到对应的聊天
- 聊天记录会自动保存到浏览器本地存储

## 自定义配置

### 修改配置
在 `src/config/config.js` 文件中修改应用配置：

```javascript
const CONFIG = {
    API: {
        BASE_URL: 'https://api.deepseek.com/v1',
        MODELS: {
            CHAT: 'deepseek-chat',
            CODER: 'deepseek-coder'
        },
        MAX_TOKENS: 4000,
        TEMPERATURE: 0.7
    },
    UI: {
        THEME: {
            PRIMARY_COLOR: '#10a37f',
            SECONDARY_COLOR: '#6366f1',
            BACKGROUND_COLOR: '#f9fafb',
            SIDEBAR_COLOR: '#171717',
            TEXT_COLOR: '#1f2937',
            BORDER_COLOR: '#e5e7eb'
        }
    }
};
```

### 集成AI API

#### DeepSeek API
1. 获取DeepSeek API密钥
2. 在应用顶部的AI模型选择器中选择"DeepSeek"
3. 在设置面板中配置API密钥

#### GLM 2.5 API
1. 获取GLM API密钥
2. 在应用顶部的AI模型选择器中选择"GLM 2.5"
3. 在设置面板中配置API密钥

#### 测试API
使用提供的测试页面 `test-gemini.html` 来验证API集成：

```bash
# 在浏览器中打开测试页面
open test-gemini.html
```

#### 直接配置
也可以在 `src/js/api.js` 文件中直接修改配置：

```javascript
// DeepSeek配置
const deepseekService = api.initDeepSeekService({
    apiKey: 'your_deepseek_api_key_here'
});

// Gemini配置
const glmAIService = api.initGLMAIService({
    apiKey: 'your_gemini_api_key_here'
});
```

### 修改主题色彩
在 `src/css/main.css` 文件中修改CSS变量：

```css
:root {
    --primary-color: #10a37f;    /* 主色调 */
    --secondary-color: #6366f1;  /* 次要色调 */
    --background-color: #f9fafb;  /* 背景色 */
    --sidebar-color: #171717;    /* 侧边栏颜色 */
    --text-color: #1f2937;        /* 文字颜色 */
}
```

## 架构特点

### 模块化设计
- **配置模块**: 集中管理应用配置
- **工具模块**: 提供通用工具函数
- **API模块**: 处理与AI服务的交互
- **组件模块**: 可复用的UI组件
- **应用模块**: 主应用逻辑和状态管理

### 组件化架构
- **Modal**: 模态框组件
- **SettingsPanel**: 设置面板组件
- **MessageInput**: 消息输入组件
- **ChatHistory**: 聊天历史组件

### 状态管理
- 本地存储持久化
- 组件间通信机制
- 错误处理和恢复

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 性能优化

- 防抖和节流处理
- 懒加载和代码分割
- 内存泄漏防护
- 响应式设计优化

## 安全考虑

- 输入验证和过滤
- XSS防护
- API密钥保护
- 内容安全策略

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。请参考 [开发指南](docs/development-guide.md) 了解详细的开发流程。

## 更新日志

### v1.1.0
- 新增Gemini 2.5 API支持
- 实现多AI提供商切换功能
- 添加AI模型选择器UI
- 创建API测试页面
- 更新配置文件支持多提供商
- 完善API服务架构

### v1.0.0
- 初始版本发布
- 实现基本聊天功能
- 响应式设计
- 消息管理功能
- 模块化架构
- 组件化设计
- API集成支持
- 完整的文档

## 相关文档

- [API参考文档](docs/api/api-reference.md)
- [开发指南](docs/development-guide.md)