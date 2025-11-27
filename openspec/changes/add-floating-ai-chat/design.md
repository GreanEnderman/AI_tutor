# 悬浮AI对话球功能 - 设计文档

## 架构设计

### 组件结构
```
base.html
├── 浮悬球组件 (FloatingChatButton)
│   ├── 悬浮球图标
│   ├── 未读消息指示器
│   └── 快捷操作菜单
├── AI对话小窗 (FloatingChatWindow)
│   ├── 小窗头部 (标题、最小化、关闭)
│   ├── 消息列表区域
│   ├── 推荐提问区域
│   ├── 输入框区域
│   └── 调整大小控制器
└── 上下文感知模块 (ContextAwareness)
    ├── 页面内容分析器
    ├── 推荐问题生成器
    └── 视图状态检测器
```

### 数据流设计
```
页面内容读取 → 内容分析 → 上下文提取 → 推荐问题生成 → UI渲染
     ↓              ↓            ↓             ↓
   笔记内容      关键词提取     视图类型      智能推荐
   编辑内容      主题识别      用户状态      场景化问题
   选中文本      意图分析      历史对话      个性化建议
```

## UI/UX设计

### 悬浮球设计
- **位置**: 固定在右下角，距离边缘24px
- **大小**: 直径56px的圆形按钮
- **样式**:
  - 主色调：与品牌色一致（蓝紫渐变）
  - 默认状态：半透明背景
  - 悬停状态：完全显示，带阴影效果
  - 点击反馈：缩放动画
- **图标**: AI对话相关的SVG图标
- **特殊状态**:
  - 新消息提示：红点或数字徽章
  - AI思考状态：脉动动画

### 对话小窗设计
- **尺寸**:
  - 默认：400×600px
  - 最小：320×400px
  - 最大：600×800px
- **位置**:
  - 默认出现在右下角，向上展开
  - 可拖拽移动
  - 智能位置调整（避免超出屏幕边界）
- **布局**:
  ```
  ┌─────────────────────────┐
  │ AI对话      □ - □ ×    │ ← 头部（标题栏+控制按钮）
  ├─────────────────────────┤
  │ 消息列表区域              │ ← 主要对话内容
  │                         │
  ├─────────────────────────┤
  │ 推荐提问区域              │ ← 智能推荐问题
  │ 📝 总结笔记内容          │
  │ 🔍 优化笔记排版          │
  │ 📊 提炼关键概念          │
  ├─────────────────────────┤
  │ 📎 输入框          [发送] │ ← 输入区域
  └─────────────────────────┘
  ```

### 交互设计
- **打开/关闭**: 点击悬浮球打开，点击关闭按钮或外部区域关闭
- **拖拽**: 支持整个小窗拖拽移动
- **调整大小**: 支持右下角拖拽调整窗口大小
- **最小化**: 可最小化为小图标，点击恢复
- **快捷操作**: 右键悬浮球显示快捷菜单

## 技术实现设计

### 前端组件
```javascript
class FloatingChatButton {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.chatWindow = null;
    this.contextAnalyzer = new ContextAnalyzer();
    this.isExpanded = false;
    this.unreadCount = 0;
  }

  // 创建悬浮球UI
  createButton() {
    const button = document.createElement('div');
    button.className = 'floating-chat-button';
    button.innerHTML = this.getButtonHTML();
    this.bindEvents(button);
    return button;
  }

  // 创建对话小窗
  createChatWindow() {
    const window = document.createElement('div');
    window.className = 'floating-chat-window';
    window.innerHTML = this.getChatWindowHTML();
    this.bindChatEvents(window);
    return window;
  }

  // 获取页面上下文
  getPageContext() {
    return this.contextAnalyzer.analyzeCurrentPage();
  }
}

class ContextAnalyzer {
  analyzeCurrentPage() {
    const context = {
      viewType: this.detectViewType(),
      content: this.extractContent(),
      selectedText: this.getSelectedText(),
      userIntent: this.predictUserIntent()
    };
    return context;
  }

  detectViewType() {
    // 检测当前视图类型：笔记阅读、笔记编辑、概念浏览等
    if (document.querySelector('#noteReaderModal')) return 'note-reading';
    if (document.querySelector('#noteEditorModal')) return 'note-editing';
    return 'general';
  }

  extractContent() {
    // 提取当前页面主要内容
    const contentSelectors = {
      'note-reading': '#noteReaderContent',
      'note-editing': '#noteContentInput',
      'general': '.section-content.active'
    };

    const selector = contentSelectors[this.detectViewType()];
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  generateRecommendedQuestions(context) {
    const questionTemplates = {
      'note-reading': [
        '总结一下这篇笔记的主要内容',
        '帮我提炼这篇笔记的关键概念',
        '这篇笔记中有什么重要的知识点？',
        '基于这篇笔记给我一些学习建议'
      ],
      'note-editing': [
        '优化一下这段文字的排版和表达',
        '帮我把这段内容整理成会议纪要',
        '检查这段文字的语法和逻辑',
        '为这段内容添加一些有用的补充'
      ],
      'general': [
        '今天我们可以学习什么新知识？',
        '帮我制定一个学习计划',
        '解答一些学习上的疑问'
      ]
    };

    return questionTemplates[context.viewType] || questionTemplates['general'];
  }
}
```

### 样式设计
```css
/* 悬浮球样式 */
.floating-chat-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4285F4 0%, #9B72CB 100%);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0,0,0,0.4);
}

.floating-chat-button:active {
  transform: scale(0.95);
}

/* 对话小窗样式 */
.floating-chat-window {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 400px;
  height: 600px;
  background: var(--surface-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  z-index: 999;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  border: 1px solid var(--border-color);
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.floating-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: move;
}

.floating-chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.floating-chat-suggestions {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-chip {
  padding: 8px 12px;
  background: var(--secondary-color);
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-chip:hover {
  background: var(--primary-color-light);
}
```

## 性能优化策略

### 渲染优化
- 使用虚拟滚动处理大量消息
- 懒加载历史消息
- 防抖处理用户输入

### 内存管理
- 及时清理未使用的事件监听器
- 合理管理DOM元素的生命周期
- 避免内存泄漏的定时器和闭包

### 网络优化
- 复用现有的API连接池
- 实现请求去重和合并
- 智能缓存常见问题的回答

## 安全性考虑

### 内容安全
- 过滤敏感内容的提取
- 限制上传文件大小和类型
- XSS攻击防护

### API安全
- 复用现有的API密钥管理
- 请求频率限制
- 错误信息脱敏

### 隐私保护
- 明确告知用户内容将被用于AI分析
- 提供关闭上下文感知功能的选项
- 用户数据加密存储

## 兼容性设计

### 浏览器兼容性
- 支持现代浏览器（Chrome 80+, Firefox 75+, Safari 13+）
- 优雅降级处理不支持的功能

### 功能兼容性
- 不影响现有的AI对话功能
- 保持与现有导航和菜单系统的兼容性
- 支持移动端适配

### 性能兼容性
- 在低性能设备上提供简化模式
- 可选的动画和特效开关