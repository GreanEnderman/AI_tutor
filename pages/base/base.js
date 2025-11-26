// 知识库 JavaScript 功能

document.addEventListener('DOMContentLoaded', function() {
    // 初始化功能
    initializeKnowledgeCenter();
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
}

// 用户交互初始化
function initializeUserInteractions() {
    // 新建按钮功能
    const addNewBtn = document.getElementById('addNewBtn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', function() {
            const activeSection = document.querySelector('.section-content.active').id.replace('-section', '');
            handleNewAction(activeSection);
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

function createNewNote() {
    showNotification('正在创建新笔记...', 'info');
    // 实现创建新笔记的逻辑
    setTimeout(() => {
        showNotification('新笔记创建成功！', 'success');
    }, 1000);
}

function viewRecentNotes() {
    // 切换到列表视图
    const notesSection = document.getElementById('notes-section');
    const welcomeScreen = notesSection.querySelector('.welcome-screen');
    
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    // 创建列表视图
    const listView = createNotesListView();
    notesSection.appendChild(listView);
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

// 数据持久化
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

// 初始化示例数据
function initializeSampleData() {
    const sampleNotes = [
        {
            id: 1,
            title: '数学微积分基础概念',
            content: '微积分是数学的一个分支，研究函数的微分、积分以及有关概念和应用...',
            subject: '数学',
            createdAt: new Date('2024-01-15').toISOString(),
            wordCount: 2300
        },
        {
            id: 2,
            title: '物理学牛顿运动定律总结',
            content: '牛顿运动定律是经典力学的基础，包括三个基本定律...',
            subject: '物理',
            createdAt: new Date('2024-01-14').toISOString(),
            wordCount: 1800
        }
    ];
    
    // 如果没有数据，保存示例数据
    if (!loadFromLocalStorage('notes')) {
        saveToLocalStorage('notes', sampleNotes);
    }
}

// 页面加载完成后初始化示例数据
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
});