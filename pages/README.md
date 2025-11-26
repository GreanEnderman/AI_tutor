# Pages 文件夹结构说明

## 概述

此文件夹用于存放项目的所有页面文件，采用模块化的组织结构，便于管理和维护。

## 文件夹结构规则

```
pages/
├── README.md                 # 本说明文档
├── base/                    # 基础页面（知识库）
│   ├── base.html            # HTML文件
│   ├── base.css             # CSS样式文件
│   └── base.js             # JavaScript功能文件
└── [其他页面文件夹]/
    ├── [页面名称].html       # HTML文件
    ├── [页面名称].css        # CSS样式文件
    └── [页面名称].js        # JavaScript功能文件
```

## 命名规范

### 页面文件夹
- 使用小写字母和连字符：`page-name`
- 使用描述性名称：`user-profile`, `settings`, `dashboard`

### 文件命名
- HTML文件：`[文件夹名].html`
- CSS文件：`[文件夹名].css`
- JavaScript文件：`[文件夹名].js`

## 示例

### 创建新页面 "用户设置"
```
pages/
└── user-settings/
    ├── user-settings.html
    ├── user-settings.css
    └── user-settings.js
```

### 创建新页面 "数据分析"
```
pages/
└── data-analysis/
    ├── data-analysis.html
    ├── data-analysis.css
    └── data-analysis.js
```

## 文件引用规范

在HTML文件中引用同目录下的CSS和JS文件时，使用相对路径：

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="[页面名称].css">
</head>
<body>
    <!-- 页面内容 -->
    <script src="[页面名称].js"></script>
</body>
</html>
```

## 注意事项

1. **独立性**：每个页面文件夹应包含完整的页面功能
2. **自包含**：CSS和JS文件应只包含该页面特定的样式和功能
3. **共享资源**：通用样式和功能应放在项目根目录的 `style.css` 和相关JS文件中
4. **路径引用**：引用根目录资源时使用相对路径 `../style.css`

## 当前页面

### base（知识库）
- **路径**：`pages/base/`
- **功能**：知识库页面，包含笔记、概念、资料、题库四个模块
- **访问**：`pages/base/base.html`
- **特点**：
  - 左侧侧边栏占25%宽度
  - 右侧内容区占75%宽度
  - 响应式设计支持
  - 与主页面风格一致

## 开发工作流

1. **创建页面**：在 `pages/` 下创建新文件夹
2. **开发文件**：在该文件夹中创建HTML、CSS、JS文件
3. **测试页面**：直接打开HTML文件进行测试
4. **集成项目**：完成后在主项目中添加导航链接

## 最佳实践

- 保持文件结构的一致性
- 使用语义化的HTML结构
- 编写模块化的CSS和JavaScript
- 添加适当的注释和文档
- 定期重构和优化代码