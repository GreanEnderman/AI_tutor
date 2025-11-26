// 知识库 JavaScript 功能

document.addEventListener('DOMContentLoaded', function() {
    // 检查URL参数，如果有action=viewRecentNotes，则直接显示最近笔记
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    // 初始化功能
    initializeKnowledgeCenter();
    
    // 如果URL参数要求显示最近笔记，则延迟执行以确保页面完全加载
    if (action === 'viewRecentNotes') {
        setTimeout(() => {
            // 确保笔记模块被激活
            const notesNavItem = document.querySelector('[data-section="notes"]');
            if (notesNavItem && !notesNavItem.classList.contains('active')) {
                notesNavItem.click();
            }
            
            // 延迟一下再显示最近笔记，确保模块切换完成
            setTimeout(() => {
                viewRecentNotes();
            }, 100);
        }, 100);
    }
});

function initializeKnowledgeCenter() {
    // 初始化侧边栏导航
    initializeNavigation();
    
    // 初始化移动端菜单
    initializeMobileMenu();
    
    // 初始化内容区域
    initializeContentArea();
    
    // 初始化用户交互
    initializeUserInteractions();
}

// 导航功能
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sectionContents = document.querySelectorAll('.section-content');
    const sectionTitle = document.querySelector('#sectionTitle h2');
    
    // 设置初始标题
    const titles = {
        'notes': '我的笔记',
        'concepts': '概念库',
        'materials': '学习资料',
        'questions': '题库'
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            sectionContents.forEach(section => section.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
            const targetSection = this.getAttribute('data-section');
            const targetContent = document.getElementById(`${targetSection}-section`);
            
            if (targetContent) {
                targetContent.classList.add('active');
                sectionTitle.textContent = titles[targetSection];
            }
            
            // 移动端关闭侧边栏
            if (window.innerWidth <= 1024) {
                closeMobileSidebar();
            }
        });
    });
}

// 移动端菜单功能
function initializeMobileMenu() {
    const sidebarMenuBurger = document.getElementById('sidebarMenuBurger');
    const overlayMenuBurger = document.getElementById('overlayMenuBurger');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const menuOverlay = document.getElementById('menuOverlay');
    const sidebar = document.querySelector('.learning-sidebar');
    
    // 打开移动端菜单
    function openMobileSidebar() {
        sidebar.classList.add('open');
        menuBackdrop.classList.add('open');
    }
    
    // 关闭移动端菜单
    function closeMobileSidebar() {
        sidebar.classList.remove('open');
        menuBackdrop.classList.remove('open');
        menuOverlay.classList.remove('open');
    }
    
    // 绑定事件
    if (sidebarMenuBurger) {
        sidebarMenuBurger.addEventListener('click', openMobileSidebar);
    }
    
    if (overlayMenuBurger) {
        overlayMenuBurger.addEventListener('click', closeMobileSidebar);
    }
    
    if (menuBackdrop) {
        menuBackdrop.addEventListener('click', closeMobileSidebar);
    }
    
    // 响应式处理
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            closeMobileSidebar();
        }
    });
}

// 内容区域初始化
function initializeContentArea() {
    // 初始化各个功能区域的内容
    loadNotesContent();
    loadConceptsContent();
    loadMaterialsContent();
    loadQuestionsContent();
    
    // 默认显示最近笔记列表
    setTimeout(() => {
        viewRecentNotes();
    }, 100);
}

// 用户交互初始化
function initializeUserInteractions() {
    // 批量管理按钮功能
    const batchManageBtn = document.getElementById('batchManageBtn');
    const cancelBatchBtn = document.getElementById('cancelBatchBtn');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    
    if (batchManageBtn) {
        batchManageBtn.addEventListener('click', function() {
            enterBatchMode();
        });
    }
    
    if (cancelBatchBtn) {
        cancelBatchBtn.addEventListener('click', function() {
            exitBatchMode();
        });
    }
    
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', function() {
            batchDeleteSelectedNotes();
        });
    }
    
    // 新建按钮功能
    const addNewBtn = document.getElementById('addNewBtn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', function() {
            const activeSection = document.querySelector('.section-content.active').id.replace('-section', '');
            handleNewAction(activeSection);
        });
    }
    
    // 上传按钮功能
    const uploadNoteBtn = document.getElementById('uploadNoteBtn');
    const markdownFileInput = document.getElementById('markdownFileInput');
    if (uploadNoteBtn && markdownFileInput) {
        uploadNoteBtn.addEventListener('click', function() {
            markdownFileInput.click();
        });
        
        markdownFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleMarkdownUpload(file);
            }
            // 清空文件输入，允许重复上传同一文件
            e.target.value = '';
        });
    }
    
    // 返回主页面按钮功能
    const backToMainBtn = document.getElementById('backToMainBtn');
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', function() {
            window.location.href = '../../index.html';
        });
    }
    
    // 左上角菜单按钮功能
    const fixedMenuBurger = document.getElementById('fixedMenuBurger');
    const blankSidebar = document.getElementById('blankSidebar');
    const blankSidebarBackdrop = document.getElementById('blankSidebarBackdrop');
    const blankSidebarClose = document.getElementById('blankSidebarClose');
    const knowledgeBaseBtn = document.getElementById('knowledgeBaseBtn');
    const toolboxBtn = document.getElementById('toolboxBtn');
    const aiChatBtn = document.getElementById('aiChatBtn');
    
    // 新侧边栏状态管理
    let isBlankSidebarOpen = false;
    
    // 新侧边栏功能函数
    function openBlankSidebar() {
        isBlankSidebarOpen = true;
        blankSidebar.classList.add('open');
        blankSidebarBackdrop.classList.add('open');
    }
    
    function closeBlankSidebar() {
        isBlankSidebarOpen = false;
        blankSidebar.classList.remove('open');
        blankSidebarBackdrop.classList.remove('open');
    }
    
    // 菜单按钮点击功能：直接打开新侧边栏
    if (fixedMenuBurger) {
        fixedMenuBurger.addEventListener('click', (e) => {
            openBlankSidebar();
        });
    }
    
    // 新侧边栏关闭按钮事件
    if (blankSidebarClose) {
        blankSidebarClose.addEventListener('click', closeBlankSidebar);
    }
    
    // 新侧边栏遮罩层点击关闭
    if (blankSidebarBackdrop) {
        blankSidebarBackdrop.addEventListener('click', closeBlankSidebar);
    }
    
    // AI对话按钮点击事件
    if (aiChatBtn) {
        aiChatBtn.addEventListener('click', () => {
            console.log('AI对话按钮被点击');
            // 跳转回主页面
            window.location.href = '../../index.html';
        });
    }
    
    // 工具箱按钮点击事件
    if (toolboxBtn) {
        toolboxBtn.addEventListener('click', () => {
            console.log('工具箱按钮被点击');
            // 这里可以添加工具箱相关的功能
            alert('工具箱功能正在开发中...');
        });
    }
    
    // 知识库按钮点击事件（空白侧边栏中）
    if (knowledgeBaseBtn) {
        knowledgeBaseBtn.addEventListener('click', () => {
            console.log('空白侧边栏知识库按钮被点击');
            // 已经在知识库页面，只需要确保显示最近笔记
            const notesNavItem = document.querySelector('[data-section="notes"]');
            if (notesNavItem && !notesNavItem.classList.contains('active')) {
                notesNavItem.click();
            }
            
            // 延迟一下再显示最近笔记，确保模块切换完成
            setTimeout(() => {
                viewRecentNotes();
            }, 100);
            
            closeBlankSidebar();
        });
    }
    
    // 为空白侧边栏的按钮添加激活状态切换
    const blankSidebarButtons = document.querySelectorAll('.blank-sidebar-btn');
    blankSidebarButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的激活状态
            blankSidebarButtons.forEach(btn => btn.classList.remove('active'));
            // 为当前按钮添加激活状态
            this.classList.add('active');
        });
    });
}

// 笔记功能
function loadNotesContent() {
    // 这里可以从本地存储或服务器加载笔记数据
    console.log('加载笔记内容');
}

// 占位符函数已被下面的实际实现替换

// 这个函数被下面的实际实现替换了，保留占位符以避免错误
function viewRecentNotes_placeholder() {
    console.log('viewRecentNotes 占位符被调用');
}

function createNotesListView() {
    const listView = document.createElement('div');
    listView.className = 'list-view';
    listView.innerHTML = `
        <div class="list-header">
            <h3>最近笔记</h3>
            <div class="search-box">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                <input type="text" placeholder="搜索笔记...">
            </div>
        </div>
        <div class="list-container">
            <div class="list-item">
                <div class="list-item-main">
                    <div class="list-item-title">数学微积分基础概念</div>
                    <div class="list-item-meta">2024年1月15日 · 数学 · 2.3k 字</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn-small" title="编辑">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                    </button>
                    <button class="icon-btn-small" title="删除">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>
                </div>
            </div>
            <div class="list-item">
                <div class="list-item-main">
                    <div class="list-item-title">物理学牛顿运动定律总结</div>
                    <div class="list-item-meta">2024年1月14日 · 物理 · 1.8k 字</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn-small" title="编辑">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                    </button>
                    <button class="icon-btn-small" title="删除">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return listView;
}

function searchNotes() {
    showNotification('搜索功能开发中...', 'info');
}

// 概念功能
function loadConceptsContent() {
    console.log('加载概念内容');
}

function browseConcepts() {
    showNotification('正在加载概念库...', 'info');
}

function conceptMap() {
    showNotification('概念图谱功能开发中...', 'info');
}

function practiceConcepts() {
    showNotification('概念练习功能开发中...', 'info');
}

// 资料功能
function loadMaterialsContent() {
    console.log('加载资料内容');
}

function uploadMaterial() {
    showNotification('正在打开上传界面...', 'info');
}

function browseMaterials() {
    showNotification('正在加载资料库...', 'info');
}

function organizeMaterials() {
    showNotification('资料整理功能开发中...', 'info');
}

// 题库功能
function loadQuestionsContent() {
    console.log('加载题库内容');
}

function startPractice() {
    showNotification('正在准备练习题目...', 'info');
}

function viewProgress() {
    showNotification('正在加载学习进度...', 'info');
}

function customQuiz() {
    showNotification('自定义测试功能开发中...', 'info');
}

// 处理新建操作
function handleNewAction(section) {
    const actions = {
        'notes': createNewNote,
        'concepts': () => showNotification('概念添加功能开发中...', 'info'),
        'materials': uploadMaterial,
        'questions': () => showNotification('题目创建功能开发中...', 'info')
    };
    
    if (actions[section]) {
        actions[section]();
    }
}

// 处理Markdown文件上传
function handleMarkdownUpload(file) {
    // 验证文件类型
    const validExtensions = ['.md', '.markdown'];
    const fileName = file.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
        showNotification('请选择.md或.markdown格式的文件', 'error');
        return;
    }
    
    // 验证文件大小（限制为5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showNotification('文件大小不能超过5MB', 'error');
        return;
    }
    
    // 显示上传进度
    showNotification('正在读取文件...', 'info');
    
    // 使用FileReader读取文件
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const title = extractTitleFromFile(file.name, content);
            
            // 创建新笔记
            const storage = new NotesStorage();
            const note = storage.createNote(title, content, ['导入']);
            
            showNotification(`成功导入笔记: ${title}`, 'success');
            
            // 刷新笔记列表
            viewRecentNotes();
            
        } catch (error) {
            console.error('文件处理失败:', error);
            showNotification('文件处理失败: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('文件读取失败', 'error');
    };
    
    // 开始读取文件
    reader.readAsText(file, 'UTF-8');
}

// 从文件名和内容中提取标题
function extractTitleFromFile(fileName, content) {
    // 首先尝试从内容中提取标题
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        // 查找第一个一级标题
        if (trimmedLine.startsWith('# ')) {
            return trimmedLine.substring(2).trim();
        }
    }
    
    // 如果没有找到一级标题，尝试使用文件名（去除扩展名）
    const nameWithoutExt = fileName.replace(/\.(md|markdown)$/i, '');
    return nameWithoutExt || '导入的笔记';
}

// 通知功能
function showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const titles = {
        'success': '成功',
        'error': '错误',
        'info': '提示'
    };
    
    notification.innerHTML = `
        <div class="notification-title">${titles[type]}</div>
        <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 工具函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return '今天';
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays < 7) {
        return `${diffDays} 天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// ===== Markdown 渲染器 =====

class MarkdownRenderer {
    constructor() {
        this.initializeMarked();
        this.initializeKaTeX();
        this.initializePrism();
    }

    // 初始化 marked.js 配置
    initializeMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: (code, lang) => {
                    if (Prism && lang && Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                },
                breaks: true,
                gfm: true,
                tables: true,
                sanitize: false,
                smartLists: true,
                smartypants: true
            });

            // 自定义渲染器以处理数学公式
            const renderer = new marked.Renderer();

            // 保留数学公式不被转义
            renderer.text = function(text) {
                return text;
            };

            marked.use({ renderer });
        }
    }

    // 初始化 KaTeX
    initializeKaTeX() {
        if (typeof katex !== 'undefined') {
            // KaTeX 已加载，无需额外配置
        }
    }

    // 初始化 Prism.js
    initializePrism() {
        if (typeof Prism !== 'undefined') {
            // Prism 已加载，无需额外配置
        }
    }

    // 渲染 Markdown 内容
    render(markdown) {
        if (!markdown) return '';

        try {
            // 先处理数学公式
            const processedContent = this.processMathFormulas(markdown);

            // 渲染 Markdown
            let html = '';
            if (typeof marked !== 'undefined') {
                html = marked.parse(processedContent);
            } else {
                // 简单的 fallback 渲染
                html = this.simpleMarkdownRender(processedContent);
            }

            // 后处理数学公式
            html = this.postProcessMathFormulas(html);

            return html;
        } catch (error) {
            console.error('Markdown 渲染错误:', error);
            return `<div class="error">渲染错误: ${error.message}</div>`;
        }
    }

    // 处理数学公式 - 保护公式不被 Markdown 处理
    processMathFormulas(text) {
        // 保护块级公式 $$...$$
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
            return `<!--MATH-BLOCK-${this.hashFormula(formula)}-->${formula}<!--END-MATH-BLOCK-->`;
        });

        // 保护行内公式 $...$
        text = text.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
            return `<!--MATH-INLINE-${this.hashFormula(formula)}-->${formula}<!--END-MATH-INLINE-->`;
        });

        return text;
    }

    // 后处理数学公式 - 渲染为 HTML
    postProcessMathFormulas(html) {
        // 渲染块级公式
        html = html.replace(/<!--MATH-BLOCK-([^->]*)-->([\s\S]*?)<!--END-MATH-BLOCK-->/g,
            (match, hash, formula) => {
                return this.renderMathFormula(formula.trim(), true);
            }
        );

        // 渲染行内公式
        html = html.replace(/<!--MATH-INLINE-([^->]*)-->([\s\S]*?)<!--END-MATH-INLINE-->/g,
            (match, hash, formula) => {
                return this.renderMathFormula(formula.trim(), false);
            }
        );

        return html;
    }

    // 渲染数学公式
    renderMathFormula(formula, displayMode = false) {
        if (typeof katex !== 'undefined') {
            try {
                return katex.renderToString(formula, {
                    displayMode,
                    throwOnError: false,
                    errorColor: '#EA4335',
                    strict: false
                });
            } catch (error) {
                console.error('KaTeX 渲染错误:', error);
                return `<span class="math-error" title="${error.message}">${formula}</span>`;
            }
        } else {
            // KaTeX 未加载时的 fallback
            const className = displayMode ? 'math-formula block' : 'math-formula inline';
            return `<span class="${className}">${formula}</span>`;
        }
    }

    // 简单的公式哈希（用于临时标识）
    hashFormula(formula) {
        return btoa(formula).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    }

    // 简单的 Markdown 渲染 fallback
    simpleMarkdownRender(text) {
        if (!text) return '';

        return text
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
            // 斜体
            .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // 代码块
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 换行
            .replace(/\n/g, '<br>');
    }

    // 更新预览内容
    updatePreview(content, previewElement) {
        if (!previewElement) return;

        const html = this.render(content);
        previewElement.innerHTML = html;

        // 重新高亮代码块
        if (typeof Prism !== 'undefined') {
            try {
                // 使用兼容的 API 调用
                if (typeof Prism.highlightAllUnder === 'function') {
                    Prism.highlightAllUnder(previewElement);
                } else if (typeof Prism.highlightAll === 'function') {
                    Prism.highlightAll();
                } else if (typeof Prism.highlightElement === 'function') {
                    // 手动高亮代码块
                    previewElement.querySelectorAll('pre code').forEach((block) => {
                        const classes = block.className.split(' ');
                        const langClass = classes.find(cls => cls.startsWith('language-'));
                        if (langClass) {
                            const lang = langClass.replace('language-', '');
                            if (lang && Prism.languages[lang]) {
                                Prism.highlightElement(block);
                            }
                        }
                    });
                }
            } catch (error) {
                console.warn('代码高亮失败:', error);
            }
        }
    }
}

// ===== 笔记编辑器管理器 =====

class NoteEditor {
    constructor() {
        this.storage = new NotesStorage();
        this.renderer = new MarkdownRenderer();
        this.currentNote = null;
        this.autoSaveTimer = null;
        this.isPreviewMode = false;
        this.editMode = 'split'; // 'split', 'edit', 'preview'

        this.initializeElements();
        this.bindEvents();
    }

    // 初始化 DOM 元素
    initializeElements() {
        this.elements = {
            modal: document.getElementById('noteEditorModal'),
            titleInput: document.getElementById('noteTitleInput'),
            contentInput: document.getElementById('noteContentInput'),
            previewContent: document.getElementById('notePreviewContent'),
            saveStatus: document.getElementById('saveStatus'),
            saveBtn: document.getElementById('saveNoteBtn'),
            wordCount: document.getElementById('wordCount'),
            charCount: document.getElementById('charCount'),
            storageInfo: document.getElementById('storageInfo'),
            backBtn: document.getElementById('backToListBtn'),
            deleteBtn: document.getElementById('deleteNoteBtn'),
            previewToggle: document.getElementById('previewToggle'),
            toolbarBtns: document.querySelectorAll('.toolbar-btn')
        };
        
        // 调试信息：检查关键元素是否存在
        const missingElements = [];
        Object.entries(this.elements).forEach(([key, element]) => {
            if (key !== 'toolbarBtns' && !element) {
                missingElements.push(key);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn('以下编辑器元素未找到:', missingElements);
        } else {
            console.log('所有编辑器元素初始化成功');
        }
    }

    // 绑定事件
    bindEvents() {
        if (!this.elements.modal) {
            console.error('无法绑定事件：模态框元素不存在');
            return;
        }

        console.log('开始绑定编辑器事件...');

        // 内容输入事件
        if (this.elements.contentInput) {
            this.elements.contentInput.addEventListener('input',
                this.debounce(() => this.handleContentChange(), 300)
            );

            this.elements.contentInput.addEventListener('keydown',
                this.handleKeyDown.bind(this)
            );
            console.log('内容输入事件绑定成功');
        } else {
            console.warn('内容输入框未找到');
        }

        // 标题输入事件
        if (this.elements.titleInput) {
            this.elements.titleInput.addEventListener('input',
                this.debounce(() => this.handleTitleChange(), 300)
            );
            console.log('标题输入事件绑定成功');
        } else {
            console.warn('标题输入框未找到');
        }

        // 返回按钮
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.closeEditor());
            console.log('返回按钮事件绑定成功');
        } else {
            console.warn('返回按钮未找到');
        }

        // 保存按钮
        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', () => this.saveNote());
            console.log('保存按钮事件绑定成功');
        } else {
            console.warn('保存按钮未找到');
        }

        // 删除按钮
        if (this.elements.deleteBtn) {
            this.elements.deleteBtn.addEventListener('click', () => this.deleteNote());
            console.log('删除按钮事件绑定成功');
        } else {
            console.warn('删除按钮未找到');
        }

        // 预览切换按钮
        if (this.elements.previewToggle) {
            this.elements.previewToggle.addEventListener('click', () => this.togglePreview());
            console.log('预览切换按钮事件绑定成功');
        } else {
            console.warn('预览切换按钮未找到');
        }

        // 工具栏按钮
        if (this.elements.toolbarBtns && this.elements.toolbarBtns.length > 0) {
            this.elements.toolbarBtns.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleToolbarAction(e));
            });
            console.log(`工具栏按钮事件绑定成功 (${this.elements.toolbarBtns.length} 个按钮)`);
        } else {
            console.warn('工具栏按钮未找到');
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        console.log('键盘快捷键事件绑定成功');

        // 模态框背景点击关闭
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeEditor();
            }
        });
        console.log('模态框背景点击事件绑定成功');
        
        console.log('所有编辑器事件绑定完成');
    }

    // 打开编辑器
    openEditor(noteId = null) {
        if (noteId) {
            // 编辑现有笔记
            this.currentNote = this.storage.getNote(noteId);
            if (!this.currentNote) {
                showNotification('笔记不存在', 'error');
                return;
            }
        } else {
            // 创建新笔记
            this.currentNote = this.storage.createNote('', '', []);
        }

        this.loadNoteToEditor();
        this.showModal();
        this.updateStorageInfo();
    }

    // 加载笔记到编辑器
    loadNoteToEditor() {
        if (!this.currentNote) return;

        this.elements.titleInput.value = this.currentNote.title || '';
        this.elements.contentInput.value = this.currentNote.content || '';

        this.updatePreview();
        this.updateWordCount();
        this.setSaveStatus('saved');
    }

    // 显示模态框
    showModal() {
        if (!this.elements.modal) {
            console.error('模态框元素不存在');
            return;
        }
        
        // 首先设置为 flex 显示
        this.elements.modal.style.display = 'flex';
        
        // 强制重排以确保 display 生效
        this.elements.modal.offsetHeight;
        
        // 然后添加 show 类来触发淡入动画
        this.elements.modal.classList.add('show');

        // 聚焦到内容输入框
        setTimeout(() => {
            if (this.elements.contentInput && (!this.currentNote.content || this.currentNote.content.trim() === '')) {
                this.elements.contentInput.focus();
            }
        }, 300);
    }

    // 关闭编辑器
    closeEditor() {
        // 检查是否有未保存的更改
        if (this.currentNote && this.elements.saveStatus.classList.contains('unsaved')) {
            if (confirm('有未保存的更改，确定要关闭吗？')) {
                this.doCloseEditor();
            }
        } else {
            this.doCloseEditor();
        }
    }
    
    // 执行关闭编辑器的操作
    doCloseEditor() {
        this.elements.modal.classList.remove('show');
        setTimeout(() => {
            this.elements.modal.style.display = 'none';
        }, 300);

        this.currentNote = null;
        this.clearAutoSaveTimer();

        // 返回到笔记列表
        this.showNotesList();
    }

    // 处理内容变化
    handleContentChange() {
        if (!this.currentNote) return;

        const content = this.elements.contentInput.value;

        // 实时预览
        this.updatePreview();

        // 更新字数统计
        this.updateWordCount();

        // 改为手动保存模式，不再自动保存
        this.setSaveStatus('unsaved');
    }

    // 处理标题变化
    handleTitleChange() {
        if (!this.currentNote) return;

        const title = this.elements.titleInput.value;
        
        // 改为手动保存模式，不再自动保存
        this.setSaveStatus('unsaved');
    }

    // 手动保存
    saveNote() {
        if (!this.currentNote) return;

        try {
            const content = this.elements.contentInput.value;
            const title = this.elements.titleInput.value;

            this.currentNote = this.storage.updateNote(this.currentNote.id, {
                content,
                title
            });

            this.setSaveStatus('saved');
            this.updateStorageInfo();
            
            // 显示保存成功通知
            showNotification('笔记已保存', 'success');
            
            // 确保保存后的笔记在最近笔记中可见
            console.log('笔记保存成功，ID:', this.currentNote.id);
        } catch (error) {
            console.error('保存失败:', error);
            this.setSaveStatus('error', '保存失败');
            showNotification('保存失败: ' + error.message, 'error');
        }
    }

    // 删除笔记
    deleteNote() {
        if (!this.currentNote) return;

        if (confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
            try {
                this.storage.deleteNote(this.currentNote.id);
                this.closeEditor();
                showNotification('笔记已删除', 'success');
            } catch (error) {
                console.error('删除失败:', error);
                showNotification('删除失败: ' + error.message, 'error');
            }
        }
    }

    // 更新预览
    updatePreview() {
        if (!this.elements.previewContent) return;

        const content = this.elements.contentInput.value;
        this.renderer.updatePreview(content, this.elements.previewContent);
    }

    // 更新字数统计
    updateWordCount() {
        if (!this.currentNote) return;

        const content = this.elements.contentInput.value;
        
        // 直接计算字数，避免方法调用问题
        const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        const wordCount = chineseChars + englishWords;
        
        const charCount = content.length;

        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = `${wordCount} 字`;
        }
        if (this.elements.charCount) {
            this.elements.charCount.textContent = `${charCount} 字符`;
        }
    }

    // 更新存储信息
    updateStorageInfo() {
        if (!this.elements.storageInfo) return;

        const storageInfo = this.storage.getStorageInfo();
        const usedMB = (storageInfo.used / 1024 / 1024).toFixed(1);
        this.elements.storageInfo.textContent = `存储: ${usedMB} MB (${storageInfo.usage}%)`;
    }

    // 设置保存状态
    setSaveStatus(status, message = '') {
        if (!this.elements.saveStatus) return;

        this.elements.saveStatus.className = `save-status ${status}`;

        const statusTexts = {
            'saved': '已保存',
            'saving': '保存中...',
            'unsaved': '未保存',
            'error': message || '保存失败'
        };

        this.elements.saveStatus.textContent = statusTexts[status] || '';
    }

    // 切换预览模式
    togglePreview() {
        const modes = ['split', 'preview', 'edit'];
        const currentIndex = modes.indexOf(this.editMode);
        this.editMode = modes[(currentIndex + 1) % modes.length];

        this.elements.modal.className = `note-editor-modal show`;
        if (this.editMode === 'preview') {
            this.elements.modal.classList.add('preview-only');
        } else if (this.editMode === 'edit') {
            this.elements.modal.classList.add('edit-only');
        }

        // 更新按钮状态
        if (this.elements.previewToggle) {
            this.elements.previewToggle.classList.toggle('active', this.editMode === 'preview');
        }
    }

    // 处理工具栏操作
    handleToolbarAction(event) {
        const action = event.target.closest('.toolbar-btn').dataset.action;
        if (!action) return;

        const textarea = this.elements.contentInput;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let replacement = '';
        let cursorOffset = 0;

        switch (action) {
            case 'bold':
                replacement = `**${selectedText || '粗体文本'}**`;
                cursorOffset = selectedText ? 0 : -4;
                break;
            case 'italic':
                replacement = `*${selectedText || '斜体文本'}*`;
                cursorOffset = selectedText ? 0 : -3;
                break;
            case 'heading':
                replacement = `## ${selectedText || '标题'}`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'ul':
                replacement = `- ${selectedText || '列表项'}`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'ol':
                replacement = `1. ${selectedText || '有序项'}`;
                cursorOffset = selectedText ? 0 : -3;
                break;
            case 'quote':
                replacement = `> ${selectedText || '引用文本'}`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'code':
                if (selectedText.includes('\n')) {
                    replacement = `\`\`\`\n${selectedText}\n\`\`\``;
                    cursorOffset = -4;
                } else {
                    replacement = `\`${selectedText || '代码'}\``;
                    cursorOffset = selectedText ? 0 : -1;
                }
                break;
            case 'link':
                replacement = `[${selectedText || '链接文本'}](url)`;
                cursorOffset = selectedText ? -5 : -9;
                break;
            case 'math':
                replacement = `$${selectedText || 'E = mc^2'}$`;
                cursorOffset = selectedText ? -1 : -1;
                break;
        }

        if (replacement) {
            const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
            textarea.value = newValue;

            // 设置光标位置
            const newCursorPos = start + replacement.length + cursorOffset;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();

            // 触发内容变化
            this.handleContentChange();
        }
    }

    // 处理键盘快捷键
    handleKeyboardShortcuts(event) {
        if (!this.elements.modal.classList.contains('show')) return;

        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;

        // Ctrl+S 保存
        if (ctrl && key === 's') {
            event.preventDefault();
            this.saveNote();
        }

        // Ctrl+B 粗体
        if (ctrl && key === 'b') {
            event.preventDefault();
            this.handleToolbarAction({ target: document.querySelector('[data-action="bold"]') });
        }

        // Ctrl+I 斜体
        if (ctrl && key === 'i') {
            event.preventDefault();
            this.handleToolbarAction({ target: document.querySelector('[data-action="italic"]') });
        }

        // Escape 关闭编辑器
        if (key === 'escape') {
            event.preventDefault();
            this.closeEditor();
        }
    }

    // 处理键盘事件（Tab 键等）
    handleKeyDown(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            // 插入制表符
            const newValue = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            textarea.value = newValue;
            textarea.setSelectionRange(start + 4, start + 4);
        }
    }

    // 显示笔记列表
    showNotesList() {
        // 这里会调用现有的显示笔记列表函数
        // 延迟一下确保数据已保存
        setTimeout(() => {
            viewRecentNotes();
        }, 100);
    }

    // 清除自动保存定时器
    clearAutoSaveTimer() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ===== 笔记阅读器管理器 =====

class NoteReader {
    constructor() {
        this.storage = new NotesStorage();
        this.renderer = new MarkdownRenderer();
        this.currentNote = null;

        this.initializeElements();
        this.bindEvents();
    }

    // 初始化 DOM 元素
    initializeElements() {
        this.elements = {
            modal: document.getElementById('noteReaderModal'),
            title: document.getElementById('noteReaderTitle'),
            content: document.getElementById('noteReaderContent'),
            wordCount: document.getElementById('readerWordCount'),
            creationDate: document.getElementById('readerCreationDate'),
            readingTime: document.getElementById('readerReadingTime'),
            backBtn: document.getElementById('backToListFromReaderBtn'),
            editBtn: document.getElementById('editFromReaderBtn'),
            closeBtn: document.getElementById('closeReaderBtn'),
            settingsBtn: document.getElementById('readerSettingsBtn')
        };
        
        // 检查关键元素是否存在
        const missingElements = [];
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                missingElements.push(key);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn('以下阅读器元素未找到:', missingElements);
        } else {
            console.log('所有阅读器元素初始化成功');
        }
    }

    // 绑定事件
    bindEvents() {
        if (!this.elements.modal) {
            console.error('无法绑定阅读器事件：模态框元素不存在');
            return;
        }

        console.log('开始绑定阅读器事件...');

        // 返回按钮
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.closeReader());
            console.log('阅读器返回按钮事件绑定成功');
        }

        // 编辑按钮
        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.editCurrentNote());
            console.log('阅读器编辑按钮事件绑定成功');
        } else {
            console.error('阅读器编辑按钮未找到，检查HTML中的ID是否为editFromReaderBtn');
        }

        // 关闭按钮
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.closeReader());
            console.log('阅读器关闭按钮事件绑定成功');
        }

        // 设置按钮
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
            console.log('阅读器设置按钮事件绑定成功');
        }

        // 模态框背景点击关闭
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeReader();
            }
        });
        console.log('阅读器模态框背景点击事件绑定成功');
        
        console.log('所有阅读器事件绑定完成');
    }

    // 打开阅读器
    openReader(noteId) {
        this.currentNote = this.storage.getNote(noteId);
        if (!this.currentNote) {
            showNotification('笔记不存在', 'error');
            return;
        }

        this.loadNoteToReader();
        this.showModal();
    }

    // 加载笔记到阅读器
    loadNoteToReader() {
        if (!this.currentNote) return;

        // 设置标题
        this.elements.title.textContent = this.currentNote.title || '无标题笔记';

        // 渲染内容
        this.updateContent();

        // 更新统计信息
        this.updateStats();
    }

    // 更新内容
    updateContent() {
        if (!this.currentNote || !this.elements.content) return;

        const content = this.currentNote.content || '';
        if (!content.trim()) {
            this.elements.content.innerHTML = `
                <div class="empty-content">
                    <p style="text-align: center; color: var(--text-placeholder); padding: 40px;">
                        这篇笔记还没有内容
                    </p>
                </div>
            `;
            return;
        }

        // 使用Markdown渲染器渲染内容
        this.renderer.updatePreview(content, this.elements.content);
    }

    // 更新统计信息
    updateStats() {
        if (!this.currentNote) return;

        // 字数统计
        const wordCount = this.currentNote.wordCount || 0;
        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = `${wordCount} 字`;
        }

        // 创建日期
        const createdDate = new Date(this.currentNote.createdAt);
        if (this.elements.creationDate) {
            this.elements.creationDate.textContent = `创建于 ${createdDate.toLocaleDateString('zh-CN')}`;
        }

        // 预计阅读时间（按每分钟200字计算）
        const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
        if (this.elements.readingTime) {
            this.elements.readingTime.textContent = `预计阅读时间 ${readingMinutes} 分钟`;
        }
    }

    // 显示模态框
    showModal() {
        if (!this.elements.modal) {
            console.error('阅读器模态框元素不存在');
            return;
        }
        
        // 首先设置为 flex 显示
        this.elements.modal.style.display = 'flex';
        
        // 强制重排以确保 display 生效
        this.elements.modal.offsetHeight;
        
        // 然后添加 show 类来触发淡入动画
        this.elements.modal.classList.add('show');
    }

    // 关闭阅读器
    closeReader() {
        this.elements.modal.classList.remove('show');
        setTimeout(() => {
            this.elements.modal.style.display = 'none';
        }, 300);

        // 不要立即清除 currentNote，可能在关闭后还需要使用
        // this.currentNote = null;
    }

    // 编辑当前笔记
    editCurrentNote() {
        if (!this.currentNote) {
            console.error('当前没有笔记可以编辑');
            showNotification('没有可编辑的笔记', 'error');
            return;
        }

        const noteId = this.currentNote.id;
        console.log('从阅读器打开编辑器，笔记ID:', noteId);

        // 保存笔记ID引用，防止在异步操作中丢失
        const savedNoteId = noteId;

        // 关闭阅读器
        this.closeReader();

        // 打开编辑器
        setTimeout(() => {
            try {
                // 确保全局变量存在
                if (typeof window.noteEditorInstance === 'undefined' || !window.noteEditorInstance) {
                    console.log('创建新的笔记编辑器实例');
                    window.noteEditorInstance = new NoteEditor();
                }
                
                console.log('打开编辑器编辑笔记:', savedNoteId);
                window.noteEditorInstance.openEditor(savedNoteId);
            } catch (error) {
                console.error('打开编辑器失败:', error);
                showNotification('打开编辑器失败: ' + error.message, 'error');
            }
        }, 300);
    }

    // 显示设置
    showSettings() {
        showNotification('阅读设置功能开发中...', 'info');
    }

    // 显示笔记列表
    showNotesList() {
        // 这里会调用现有的显示笔记列表函数
        setTimeout(() => {
            viewRecentNotes();
        }, 100);
    }
}

// ===== 笔记数据模型和存储 =====

// 笔记数据结构
class Note {
    constructor(title = '', content = '', tags = []) {
        this.id = this.generateId();
        this.title = title;
        this.content = content;
        this.tags = tags;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.wordCount = this.calculateWordCount(content);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    calculateWordCount(content) {
        // 简单的中英文字数统计
        const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        return chineseChars + englishWords;
    }

    update(content) {
        this.content = content;
        this.updatedAt = new Date().toISOString();
        this.wordCount = this.calculateWordCount(content);

        // 自动提取标题（如果内容不为空且标题为空）
        if (!this.title && content.trim()) {
            const firstLine = content.split('\n')[0].trim();
            // 移除 markdown 标记
            this.title = firstLine.replace(/^#{1,6}\s*/, '').substring(0, 50);
        }
    }

    updateTitle(title) {
        this.title = title;
        this.updatedAt = new Date().toISOString();
    }

    updateTags(tags) {
        this.tags = tags;
        this.updatedAt = new Date().toISOString();
    }
}

// 笔记存储管理器
class NotesStorage {
    constructor() {
        this.storageKey = 'ai_tutor_notes';
        this.maxStorage = 5 * 1024 * 1024; // 5MB 限制
    }

    // 保存所有笔记
    saveNotes(notes) {
        try {
            const dataStr = JSON.stringify(notes);

            // 检查存储空间
            if (dataStr.length > this.maxStorage) {
                throw new Error('存储空间不足，请删除一些笔记');
            }

            localStorage.setItem(this.storageKey, dataStr);
            return true;
        } catch (e) {
            console.error('保存笔记失败:', e);
            throw e;
        }
    }

    // 加载所有笔记
    loadNotes() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('加载笔记失败:', e);
            return [];
        }
    }

    // 创建新笔记
    createNote(title = '', content = '', tags = []) {
        const notes = this.loadNotes();
        const note = new Note(title, content, tags);
        notes.unshift(note); // 新笔记放在最前面
        this.saveNotes(notes);
        return note;
    }

    // 获取单个笔记
    getNote(id) {
        const notes = this.loadNotes();
        return notes.find(note => note.id === id);
    }

    // 更新笔记
    updateNote(id, updates) {
        const notes = this.loadNotes();
        const noteIndex = notes.findIndex(note => note.id === id);

        if (noteIndex === -1) {
            throw new Error('笔记不存在');
        }

        const note = notes[noteIndex];

        if (updates.content !== undefined) {
            note.content = updates.content;
            note.updatedAt = new Date().toISOString();
            
            // 计算字数（直接在这里实现，避免方法调用问题）
            const chineseChars = (updates.content.match(/[\u4e00-\u9fa5]/g) || []).length;
            const englishWords = (updates.content.match(/[a-zA-Z]+/g) || []).length;
            note.wordCount = chineseChars + englishWords;
            
            // 自动提取标题（如果内容不为空且标题为空）
            if (!note.title && updates.content.trim()) {
                const firstLine = updates.content.split('\n')[0].trim();
                // 移除 markdown 标记
                note.title = firstLine.replace(/^#{1,6}\s*/, '').substring(0, 50);
            }
        }

        if (updates.title !== undefined) {
            note.title = updates.title;
            note.updatedAt = new Date().toISOString();
        }

        if (updates.tags !== undefined) {
            note.tags = updates.tags;
            note.updatedAt = new Date().toISOString();
        }

        notes[noteIndex] = note;
        this.saveNotes(notes);
        return note;
    }

    // 删除笔记
    deleteNote(id) {
        const notes = this.loadNotes();
        const filteredNotes = notes.filter(note => note.id !== id);

        if (filteredNotes.length === notes.length) {
            throw new Error('笔记不存在');
        }

        this.saveNotes(filteredNotes);
        return true;
    }

    // 搜索笔记
    searchNotes(query) {
        const notes = this.loadNotes();
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            return notes;
        }

        return notes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm);
            const contentMatch = note.content.toLowerCase().includes(searchTerm);
            const tagsMatch = note.tags.some(tag =>
                tag.toLowerCase().includes(searchTerm)
            );

            return titleMatch || contentMatch || tagsMatch;
        });
    }

    // 按标签筛选笔记
    getNotesByTag(tag) {
        const notes = this.loadNotes();
        return notes.filter(note =>
            note.tags.includes(tag)
        );
    }

    // 获取所有标签
    getAllTags() {
        const notes = this.loadNotes();
        const tagSet = new Set();

        notes.forEach(note => {
            note.tags.forEach(tag => tagSet.add(tag));
        });

        return Array.from(tagSet).sort();
    }

    // 获取存储使用情况
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const used = data ? data.length : 0;
            const available = this.maxStorage - used;
            const usage = (used / this.maxStorage * 100).toFixed(1);

            return {
                used,
                available,
                usage: parseFloat(usage),
                noteCount: this.loadNotes().length
            };
        } catch (e) {
            return {
                used: 0,
                available: this.maxStorage,
                usage: 0,
                noteCount: 0
            };
        }
    }
}

// 数据持久化（向后兼容）
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('保存数据失败:', e);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('加载数据失败:', e);
        return defaultValue;
    }
}

// ===== 全局笔记编辑器和阅读器实例 =====
// 使用 window 对象确保全局可访问
window.noteEditorInstance = null;
window.noteReaderInstance = null;

// 为了向后兼容，保留局部变量引用
let noteEditorInstance = window.noteEditorInstance;
let noteReaderInstance = window.noteReaderInstance;

// 替换占位符函数

// 笔记功能
function loadNotesContent() {
    console.log('加载笔记内容');
}

function createNewNote() {
    console.log('创建新笔记函数被调用');
    
    try {
        if (!window.noteEditorInstance) {
            console.log('创建新的笔记编辑器实例');
            window.noteEditorInstance = new NoteEditor();
        }
        
        console.log('打开编辑器创建新笔记');
        window.noteEditorInstance.openEditor(null); // null 表示创建新笔记
    } catch (error) {
        console.error('创建新笔记失败:', error);
        showNotification('创建笔记失败: ' + error.message, 'error');
    }
}

// 批量管理状态
let batchMode = false;
let selectedNotes = new Set();

function viewRecentNotes() {
    console.log('viewRecentNotes: 开始加载笔记列表');
    
    const storage = new NotesStorage();
    const notes = storage.loadNotes();

    console.log('viewRecentNotes: 加载到', notes.length, '篇笔记');

    if (notes.length === 0) {
        showNotification('暂无笔记，快创建第一篇笔记吧！', 'info');
        return;
    }

    // 获取笔记区域容器
    const notesSection = document.getElementById('notes-section');
    if (!notesSection) {
        console.error('viewRecentNotes: 找不到 notes-section 元素');
        return;
    }

    // 尝试找到或创建列表容器
    let listContainer = document.getElementById('notesListContainer');
    if (!listContainer) {
        console.log('viewRecentNotes: 创建新的列表容器');
        listContainer = document.createElement('div');
        listContainer.id = 'notesListContainer';
        listContainer.className = 'notes-list-container';
        
        // 隐藏欢迎屏幕
        const welcomeScreen = notesSection.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
        
        notesSection.appendChild(listContainer);
    }

    // 移除已存在的列表视图
    const existingListView = listContainer.querySelector('.list-view');
    if (existingListView) {
        existingListView.remove();
    }

    // 创建列表视图
    const listView = createNotesListView(notes);
    listContainer.appendChild(listView);
    
    // 更新批量管理按钮显示状态
    updateBatchButtonsVisibility();
    
    console.log('viewRecentNotes: 笔记列表加载完成');
}

// 进入批量管理模式
function enterBatchMode() {
    batchMode = true;
    selectedNotes.clear();
    
    // 显示批量管理按钮
    document.getElementById('batchManageBtn').style.display = 'none';
    document.getElementById('cancelBatchBtn').style.display = 'flex';
    document.getElementById('batchDeleteBtn').style.display = 'flex';
    document.getElementById('addNewBtn').style.display = 'none';
    
    // 为所有笔记项添加选择框
    const listItems = document.querySelectorAll('.list-item');
    listItems.forEach(item => {
        const noteId = item.getAttribute('data-note-id');
        const checkbox = document.createElement('div');
        checkbox.className = 'batch-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="batch-${noteId}" data-note-id="${noteId}">
            <label for="batch-${noteId}"></label>
        `;
        
        // 在列表项开头插入选择框
        item.insertBefore(checkbox, item.firstChild);
        item.classList.add('batch-mode');
        
        // 绑定选择事件
        const checkboxInput = checkbox.querySelector('input');
        checkboxInput.addEventListener('change', function() {
            if (this.checked) {
                selectedNotes.add(noteId);
            } else {
                selectedNotes.delete(noteId);
            }
            updateBatchDeleteButton();
        });
    });
    
    showNotification('已进入批量管理模式，选择要操作的笔记', 'info');
}

// 退出批量管理模式
function exitBatchMode() {
    batchMode = false;
    selectedNotes.clear();
    
    // 恢复按钮显示
    document.getElementById('batchManageBtn').style.display = 'flex';
    document.getElementById('cancelBatchBtn').style.display = 'none';
    document.getElementById('batchDeleteBtn').style.display = 'none';
    document.getElementById('addNewBtn').style.display = 'flex';
    
    // 移除所有选择框
    const checkboxes = document.querySelectorAll('.batch-checkbox');
    checkboxes.forEach(checkbox => checkbox.remove());
    
    // 移除批量模式样式
    const listItems = document.querySelectorAll('.list-item');
    listItems.forEach(item => item.classList.remove('batch-mode'));
    
    showNotification('已退出批量管理模式', 'info');
}

// 更新批量删除按钮状态
function updateBatchDeleteButton() {
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    if (selectedNotes.size > 0) {
        batchDeleteBtn.classList.add('active');
        batchDeleteBtn.querySelector('span').textContent = `删除选中 (${selectedNotes.size})`;
    } else {
        batchDeleteBtn.classList.remove('active');
        batchDeleteBtn.querySelector('span').textContent = '删除选中';
    }
}

// 批量删除选中的笔记
function batchDeleteSelectedNotes() {
    if (selectedNotes.size === 0) {
        showNotification('请先选择要删除的笔记', 'warning');
        return;
    }
    
    const count = selectedNotes.size;
    if (confirm(`确定要删除选中的 ${count} 篇笔记吗？此操作无法撤销。`)) {
        try {
            const storage = new NotesStorage();
            
            // 逐个删除选中的笔记
            selectedNotes.forEach(noteId => {
                storage.deleteNote(noteId);
            });
            
            // 退出批量模式并刷新列表
            exitBatchMode();
            viewRecentNotes();
            
            showNotification(`成功删除 ${count} 篇笔记`, 'success');
        } catch (error) {
            console.error('批量删除失败:', error);
            showNotification('批量删除失败: ' + error.message, 'error');
        }
    }
}

// 更新批量管理按钮可见性
function updateBatchButtonsVisibility() {
    const notesCount = new NotesStorage().loadNotes().length;
    const batchManageBtn = document.getElementById('batchManageBtn');
    
    if (notesCount > 0 && !batchMode) {
        batchManageBtn.style.display = 'flex';
    } else if (!batchMode) {
        batchManageBtn.style.display = 'none';
    }
}

function createNotesListView(notes) {
    const listView = document.createElement('div');
    listView.className = 'list-view';

    let listHTML = `
        <div class="list-header">
            <h3>最近笔记 (${notes.length})</h3>
            <div class="search-box">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                <input type="text" placeholder="搜索笔记..." id="notesSearchInput">
            </div>
        </div>
        <div class="list-items">
    `;

    notes.forEach(note => {
        const truncatedContent = note.content.length > 100
            ? note.content.substring(0, 100) + '...'
            : note.content;

        listHTML += `
            <div class="list-item" data-note-id="${note.id}">
                <div class="list-item-main" onclick="handleNoteClick('${note.id}')">
                    <div class="list-item-title">${note.title || '无标题笔记'}</div>
                    <div class="list-item-meta">${formatDate(note.createdAt)} · ${note.wordCount} 字</div>
                    <div class="list-item-preview">${truncatedContent.replace(/\n/g, ' ')}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn-small" onclick="handleNoteEdit('${note.id}')" title="编辑">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                    </button>
                    <button class="icon-btn-small danger" onclick="handleNoteDelete('${note.id}')" title="删除">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>
                </div>
            </div>
        `;
    });

    listHTML += `</div>`;
    listView.innerHTML = listHTML;

    // 绑定搜索功能
    const searchInput = listView.querySelector('#notesSearchInput');
    if (searchInput) {
        const storage = new NotesStorage(); // 创建本地存储实例
        searchInput.addEventListener('input', debounce(function() {
            const query = this.value.trim();
            if (query) {
                const filteredNotes = storage.searchNotes(query);
                updateNotesList(filteredNotes);
            } else {
                updateNotesList(notes);
            }
        }, 300));
    }

    return listView;
}

// 处理笔记点击事件（根据批量模式决定行为）
function handleNoteClick(noteId) {
    if (batchMode) {
        // 在批量模式下，切换选择状态
        const checkbox = document.querySelector(`#batch-${noteId}`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    } else {
        // 在普通模式下，打开阅读视图
        openNoteReader(noteId);
    }
}

// 处理笔记编辑事件（防止批量模式下的误操作）
function handleNoteEdit(noteId) {
    if (!batchMode) {
        editNote(noteId);
    }
}

// 处理笔记删除事件（防止批量模式下的误操作）
function handleNoteDelete(noteId) {
    if (!batchMode) {
        deleteNoteFromList(noteId);
    }
}

function updateNotesList(notes) {
    const container = document.getElementById('notesListContainer');
    if (!container) return;

    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">没有找到匹配的笔记</div>
                <div class="empty-state-description">尝试调整搜索关键词</div>
            </div>
        `;
        return;
    }

    let listHTML = '';
    notes.forEach(note => {
        const truncatedContent = note.content.length > 100
            ? note.content.substring(0, 100) + '...'
            : note.content;

        listHTML += `
            <div class="list-item" data-note-id="${note.id}">
                <div class="list-item-main" onclick="handleNoteClick('${note.id}')">
                    <div class="list-item-title">${note.title || '无标题笔记'}</div>
                    <div class="list-item-meta">${formatDate(note.createdAt)} · ${note.wordCount} 字</div>
                    <div class="list-item-preview">${truncatedContent.replace(/\n/g, ' ')}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn-small" onclick="handleNoteEdit('${note.id}')" title="编辑">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                    </button>
                    <button class="icon-btn-small danger" onclick="handleNoteDelete('${note.id}')" title="删除">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = listHTML;
    
    // 如果在批量模式下，需要重新添加选择框
    if (batchMode) {
        setTimeout(() => {
            const listItems = container.querySelectorAll('.list-item');
            listItems.forEach(item => {
                const noteId = item.getAttribute('data-note-id');
                const checkbox = document.createElement('div');
                checkbox.className = 'batch-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" id="batch-${noteId}" data-note-id="${noteId}">
                    <label for="batch-${noteId}"></label>
                `;
                
                // 在列表项开头插入选择框
                item.insertBefore(checkbox, item.firstChild);
                item.classList.add('batch-mode');
                
                // 绑定选择事件
                const checkboxInput = checkbox.querySelector('input');
                checkboxInput.addEventListener('change', function() {
                    if (this.checked) {
                        selectedNotes.add(noteId);
                    } else {
                        selectedNotes.delete(noteId);
                    }
                    updateBatchDeleteButton();
                });
            });
        }, 100);
    }
}

function editNote(noteId) {
    console.log('编辑笔记函数被调用，笔记ID:', noteId);
    
    try {
        if (!window.noteEditorInstance) {
            console.log('创建新的笔记编辑器实例');
            window.noteEditorInstance = new NoteEditor();
        }
        
        console.log('打开编辑器编辑笔记:', noteId);
        window.noteEditorInstance.openEditor(noteId);
    } catch (error) {
        console.error('编辑笔记失败:', error);
        showNotification('编辑笔记失败: ' + error.message, 'error');
    }
}

// 打开笔记阅读器
function openNoteReader(noteId) {
    console.log('打开笔记阅读器，笔记ID:', noteId);
    
    try {
        if (!window.noteReaderInstance) {
            console.log('创建新的笔记阅读器实例');
            window.noteReaderInstance = new NoteReader();
        }
        
        console.log('打开阅读器查看笔记:', noteId);
        window.noteReaderInstance.openReader(noteId);
    } catch (error) {
        console.error('打开阅读器失败:', error);
        showNotification('打开阅读器失败: ' + error.message, 'error');
    }
}

function deleteNoteFromList(noteId) {
    if (confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
        try {
            const storage = new NotesStorage();
            storage.deleteNote(noteId);

            // 重新加载列表
            viewRecentNotes();
            showNotification('笔记已删除', 'success');
        } catch (error) {
            console.error('删除失败:', error);
            showNotification('删除失败: ' + error.message, 'error');
        }
    }
}

function searchNotes() {
    viewRecentNotes();
    // 聚焦到搜索框
    setTimeout(() => {
        const searchInput = document.querySelector('#notesSearchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 初始化示例数据
function initializeSampleData() {
    const storage = new NotesStorage();
    const existingNotes = storage.loadNotes();

    // 如果没有数据，保存示例数据
    if (existingNotes.length === 0) {
        const sampleNotes = [
            new Note(
                '欢迎使用 Markdown 笔记',
                `# 欢迎使用 AI Tutor 笔记功能

这是一篇示例笔记，展示了 **Markdown** 编辑器的强大功能。

## 主要特性

### 📝 实时预览
- 左侧编辑，右侧实时预览
- 支持 *Markdown* 语法高亮

### 🔧 丰富的格式支持
- **粗体文本**
- *斜体文本*
- \`行内代码\`
- [链接](https://example.com)

### 🧮 数学公式
行内公式：$E = mc^2$

块级公式：
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

### 💻 代码高亮
\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\`

### 📋 列表
- 无序列表项
- 另一个列表项
  - 嵌套列表项

1. 有序列表项
2. 另一个有序项
3. 第三个有序项

> 这是一个引用块，可以用来强调重要内容或引用他人观点。

开始创建你的第一篇笔记吧！`,
                ['教程', 'Markdown']
            ),
            new Note(
                '学习笔记：JavaScript 异步编程',
                `# JavaScript 异步编程学习笔记

## 概述
异步编程是 JavaScript 中的重要概念，用于处理耗时操作而不阻塞主线程。

## 主要方式

### 1. 回调函数
\`\`\`javascript
function fetchData(callback) {
    setTimeout(() => {
        callback('数据加载完成');
    }, 1000);
}
\`\`\`

### 2. Promise
\`\`\`javascript
const promise = new Promise((resolve, reject) => {
    // 异步操作
    resolve('成功结果');
});
\`\`\`

### 3. Async/Await
\`\`\`javascript
async function getData() {
    try {
        const result = await fetch('/api/data');
        return result.json();
    } catch (error) {
        console.error('错误:', error);
    }
}
\`\`\`

## 最佳实践
- 优先使用 async/await
- 妥善处理错误
- 避免回调地狱`,
                ['JavaScript', '编程', '异步']
            )
        ];

        sampleNotes.forEach(note => {
            storage.createNote(note.title, note.content, note.tags);
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();

    // 初始化笔记编辑器和阅读器（但不显示）
    window.noteEditorInstance = new NoteEditor();
    window.noteReaderInstance = new NoteReader();
    
    console.log('页面初始化完成，笔记编辑器和阅读器实例已创建');
});