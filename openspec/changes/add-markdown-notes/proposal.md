# 变更：添加带有预览和在线编辑的 Markdown 笔记创建功能

## 原因
基础知识中心目前有一个笔记部分，只有欢迎屏幕和占位符功能。用户需要能够创建、编辑和管理具有丰富 markdown 格式、实时预览和适当存储功能的笔记。

## 变更内容
- 添加 markdown 笔记创建和编辑界面
- 实现带有实时预览的分屏编辑器
- 添加笔记管理（保存、删除、搜索、组织）
- 集成现有的 markdown 渲染库（marked.js、KaTeX、Prism.js）
- 添加本地存储以实现笔记持久化
- **重大变更**：用实际实现替换占位符笔记功能

## 影响
- 受影响的规范：knowledge-base（新功能）
- 受影响的代码：pages/base/base.html、pages/base/base.js、pages/base/base.css
- 依赖项：marked.js、KaTeX、Prism.js（已包含）