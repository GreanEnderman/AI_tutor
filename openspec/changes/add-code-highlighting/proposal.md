# Change: Add Syntax Highlighting for Code Blocks in AI Output

## Why
当前AI家教系统中的代码块显示只有基础样式，缺乏语法高亮功能。这使得代码难以阅读和理解，特别是对于复杂的代码示例。添加语法高亮将显著提升用户体验和代码可读性。

## What Changes
- 集成语法高亮库（Prism.js或highlight.js）
- 实现自动语言检测和语法高亮
- 添加代码块语言标识支持
- 增强代码块UI样式（复制按钮、行号、语言标签）
- 优化性能，支持流式渲染中的语法高亮
- 保持与现有数学公式渲染的兼容性

## Impact
- 受影响的规格：`code-highlighting`（新功能）
- 受影响的代码：`js/glm-tutor-renderer.js`（渲染引擎）、`css/glm-tutor.css`（样式）、`index.html`（新增库引用）
- 新增依赖：语法高亮库
- 性能影响：轻微的渲染延迟，通过缓存和异步加载优化
- 用户界面：增强代码块显示效果，添加交互功能