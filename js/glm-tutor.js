// GLM4.5 AI家教应用
class GLMTutor {
    constructor() {
        try {
            // 检查依赖是否已加载
            if (typeof window.GLMUtils === 'undefined') {
                throw new Error('GLMUtils 未加载，请检查 glm-tutor-utils.js');
            }
            if (typeof window.GLMRenderer === 'undefined') {
                throw new Error('GLMRenderer 未加载，请检查 glm-tutor-renderer.js');
            }
            
            this.apiKey = '3b9469fa776644e0aff8d2cc0807ee19.DONNWpkITAi5Jg71';
            this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
            this.model = 'glm-4.5';
            this.messages = [];
            this.isTyping = false;
            this.chatHistory = this.loadChatHistory();
            this.currentChatId = this.generateChatId();
            this.renderTimeout = null; // 用于管理渲染的延迟执行
            
            // 初始化渲染引擎 - 添加错误处理
            try {
                this.renderer = new window.GLMRenderer();
            } catch (error) {
                console.error('渲染引擎初始化失败:', error);
                this.renderer = null;
            }
            
            this.initElements();
            this.initEventListeners();
            this.initToolbar();
            this.renderHistory();
            
            // 初始化性能优化相关的属性
            this.scrollThrottled = false;
            this.eventListeners = new Map(); // 用于存储事件监听器引用
            this.timeouts = new Set(); // 用于存储setTimeout引用
            this.isUserScrolling = false; // 跟踪用户是否正在滚动
            this.lastScrollTime = 0; // 最后一次滚动时间
            
            // 请求去重和重试机制
            this.pendingRequests = new Map(); // 存储待处理的请求
            this.requestRetryCount = new Map(); // 存储请求重试次数
            this.maxRetries = 3; // 最大重试次数
            this.requestTimeout = 30000; // 请求超时时间（30秒）
            
            // 流式输出缓冲机制 - 优化版本
            this.streamBuffer = '';
            this.streamBufferLock = false;
            this.OUTPUT_INTERVAL = 100; // 增加到100ms，减少DOM更新频率
            this.streamBufferTimeout = null;
            this.accumulatedContent = ''; // 跟踪累积的完整内容
            this.lastRenderedContent = ''; // 记录上次渲染的内容，避免重复渲染
            this.renderQueue = []; // 渲染队列，用于批量处理
            this.isProcessingQueue = false; // 队列处理状态
            
            // 内存存储备用方案（用于localStorage不可用的情况）
            this.useMemoryStorage = false;
            this.memoryHistory = [];
            
            console.log('GLMTutor 初始化完成');
        } catch (error) {
            console.error('GLMTutor 初始化失败:', error);
            this.showError('应用初始化失败: ' + error.message);
        }
    }
    
    // 获取系统提示 - 使用工具函数
    getSystemPrompt() {
        try {
            if (typeof window.GLMUtils === 'undefined' || typeof window.GLMUtils.getSystemPrompt !== 'function') {
                console.warn('GLMUtils 未正确加载，使用默认系统提示');
                return '你是一个AI助手，请帮助用户解答问题。';
            }
            return window.GLMUtils.getSystemPrompt();
        } catch (error) {
            console.error('获取系统提示失败:', error);
            return '你是一个AI助手，请帮助用户解答问题。';
        }
    }
    
    // 通用DOM操作工具方法
    createMessageElement(role, content, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const contentClass = isStreaming ? 'streaming-content' : 'markdown-content';
        contentDiv.innerHTML = `
            <div class="${contentClass}"></div>
            <div class="message-time">${new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</div>
        `;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        return { messageDiv, contentDiv, streamingContent: contentDiv.querySelector(`.${contentClass}`) };
    }
    
    // 创建操作按钮
    createActionButtons(role, content) {
        try {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            
            // 确保 GLMUtils 存在
            let escapedContent;
            if (typeof window.GLMUtils !== 'undefined' && typeof window.GLMUtils.escapeHtml === 'function') {
                escapedContent = window.GLMUtils.escapeHtml(content);
            } else {
                // 降级的HTML转义
                const div = document.createElement('div');
                div.textContent = content;
                escapedContent = div.innerHTML;
            }
            
            if (role === 'user') {
                actionsDiv.innerHTML = `
                    <button class="message-action-btn" onclick="tutor.copyMessage('${escapedContent}')" title="复制">
                        📋
                    </button>
                    <button class="message-action-btn" onclick="tutor.retryMessage('${escapedContent}')" title="重新发送">
                        🔄
                    </button>
                `;
            } else {
                actionsDiv.innerHTML = `
                    <button class="message-action-btn" onclick="tutor.copyMessage('${escapedContent}')" title="复制">
                        📋
                    </button>
                `;
            }
            
            return actionsDiv;
        } catch (error) {
            console.error('创建操作按钮失败:', error);
            // 返回简单的操作按钮
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = `<button class="message-action-btn" onclick="tutor.copyMessage('${content}')" title="复制">📋</button>`;
            return actionsDiv;
        }
    }
    
    // 优化的滚动方法
    scrollToBottom(throttled = false, force = false, smooth = false) {
        // 在流式输出期间，强制滚动，不检查用户位置
        if (!force) {
            // 如果用户正在滚动，不自动滚动
            if (this.isUserScrolling) {
                return;
            }
            
            const isScrolledToBottom = this.isUserAtBottom();
            if (!isScrolledToBottom) {
                return; // 用户不在底部，不自动滚动
            }
        }
        
        // 使用 requestAnimationFrame 确保在DOM更新后滚动
        requestAnimationFrame(() => {
            if (smooth) {
                this.chatContainer.scrollTo({
                    top: this.chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }
        });
    }
    
    // 检查用户是否在聊天容器底部
    isUserAtBottom() {
        const threshold = 150; // 增加阈值到150px，更容易触发自动滚动
        const scrollTop = this.chatContainer.scrollTop;
        const scrollHeight = this.chatContainer.scrollHeight;
        const clientHeight = this.chatContainer.clientHeight;
        
        // 检查用户是否在底部附近
        return scrollHeight - scrollTop - clientHeight <= threshold;
    }
    
    // 平滑滚动到底部，用于流式输出
    smoothScrollToBottom() {
        // 如果用户正在滚动，不自动滚动
        if (this.isUserScrolling) {
            return;
        }
        
        // 使用 requestAnimationFrame 确保平滑滚动
        requestAnimationFrame(() => {
            // 在流式输出期间，使用即时滚动而不是平滑滚动，以更好地跟随内容
            if (this.isTyping) {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            } else {
                this.chatContainer.scrollTo({
                    top: this.chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // 流式输出专用滚动方法，更积极地跟随内容
    streamingScrollToBottom() {
        // 在流式输出期间，即使用户正在滚动也要跟随新内容
        // 但要给用户一些控制权，检查用户是否主动向上滚动
        if (this.isUserScrolling) {
            const scrollTop = this.chatContainer.scrollTop;
            const scrollHeight = this.chatContainer.scrollHeight;
            const clientHeight = this.chatContainer.clientHeight;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            
            // 如果用户距离底部很近（300px内），仍然跟随流式输出
            if (distanceFromBottom > 300) {
                return; // 用户主动向上滚动了很多，不强制跟随
            }
        }
        
        // 立即滚动到底部，不使用动画，确保紧跟流式内容
        requestAnimationFrame(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        });
    }
    
    // 智能平滑滚动到底部
    smartScrollToBottom(force = false) {
        // 在流式输出期间，强制滚动到底部以跟随内容
        if (force) {
            // 强制滚动，不检查用户位置
            this.chatContainer.scrollTo({
                top: this.chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        } else if (this.isUserAtBottom()) {
            // 只有当用户在底部时才自动滚动
            this.chatContainer.scrollTo({
                top: this.chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    initElements() {
        try {
            this.chatContainer = document.getElementById('chatContainer');
            this.messageInput = document.getElementById('messageInput');
            this.sendButton = document.getElementById('sendButton');
            this.statusElement = document.getElementById('status');
            this.historyContent = document.getElementById('historyContent');
            
            // 验证关键元素是否存在
            const requiredElements = [
                { name: 'chatContainer', element: this.chatContainer },
                { name: 'messageInput', element: this.messageInput },
                { name: 'sendButton', element: this.sendButton },
                { name: 'historyContent', element: this.historyContent }
            ];
            
            const missingElements = requiredElements.filter(({ element }) => !element);
            if (missingElements.length > 0) {
                console.warn('以下DOM元素未找到:', missingElements.map(e => e.name));
                // 不抛出错误，允许部分功能正常工作
            }
            
            console.log('DOM元素初始化完成');
        } catch (error) {
            console.error('DOM元素初始化失败:', error);
            this.showError('页面元素初始化失败，请刷新页面重试');
        }
    }
    
    initToolbar() {
        try {
            // 新建对话按钮
            const newChatBtn = document.getElementById('newChatBtn');
            if (newChatBtn) {
                newChatBtn.addEventListener('click', () => {
                    console.log('点击新建对话按钮');
                    this.newChat();
                });
            } else {
                console.warn('新建对话按钮未找到');
            }
            
            // 清空对话按钮
            const clearChatBtn = document.getElementById('clearChatBtn');
            if (clearChatBtn) {
                clearChatBtn.addEventListener('click', () => this.clearChat());
            } else {
                console.warn('清空对话按钮未找到');
            }
            
            // 导出对话按钮
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportChat());
            } else {
                console.warn('导出对话按钮未找到');
            }
            
            // 清空历史记录按钮
            const clearHistoryBtn = document.getElementById('clearHistoryBtn');
            if (clearHistoryBtn) {
                clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
            } else {
                console.warn('清空历史记录按钮未找到');
            }
            
            console.log('工具栏初始化完成');
        } catch (error) {
            console.error('工具栏初始化失败:', error);
        }
    }

    
    
    generateChatId() {
        try {
            if (typeof window.GLMUtils !== 'undefined' && typeof window.GLMUtils.generateId === 'function') {
                return window.GLMUtils.generateId('chat');
            } else {
                // 降级的ID生成
                return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
        } catch (error) {
            console.error('生成聊天ID失败:', error);
            // 最简单的降级
            return `chat_${Date.now()}`;
        }
    }
    
    loadChatHistory() {
        try {
            // 检查localStorage是否可用
            if (typeof Storage === 'undefined') {
                console.warn('localStorage不可用，使用内存存储');
                this.useMemoryStorage = true;
                return this.memoryHistory || [];
            }
            
            const saved = localStorage.getItem('glmChatHistory');
            if (typeof window.GLMUtils !== 'undefined' && typeof window.GLMUtils.safeJsonParse === 'function') {
                return window.GLMUtils.safeJsonParse(saved, []);
            } else {
                // 降级的JSON解析
                try {
                    return saved ? JSON.parse(saved) : [];
                } catch (e) {
                    console.warn('聊天历史解析失败:', e);
                    return [];
                }
            }
        } catch (error) {
            console.error('加载聊天历史失败:', error);
            console.warn('可能是localStorage访问被限制，使用内存存储');
            this.useMemoryStorage = true;
            return this.memoryHistory || [];
        }
    }
    
    saveChatHistory() {
        try {
            // 检查localStorage是否可用
            if (typeof Storage === 'undefined' || this.useMemoryStorage) {
                console.warn('localStorage不可用，使用内存存储');
                this.memoryHistory = [...(this.chatHistory || [])];
                return;
            }
            
            if (typeof window.GLMUtils !== 'undefined' && typeof window.GLMUtils.safeJsonStringify === 'function') {
                localStorage.setItem('glmChatHistory', window.GLMUtils.safeJsonStringify(this.chatHistory));
            } else {
                // 降级的JSON字符串化
                localStorage.setItem('glmChatHistory', JSON.stringify(this.chatHistory || []));
            }
        } catch (error) {
            console.error('保存聊天历史失败:', error);
            console.warn('可能是localStorage访问被限制，切换到内存存储');
            this.useMemoryStorage = true;
            this.memoryHistory = [...(this.chatHistory || [])];
        }
    }
    
    saveCurrentChat() {
        try {
            // 确保 messages 数组存在且不为空
            if (!this.messages || this.messages.length === 0) {
                console.log('没有消息需要保存');
                return;
            }
            
            const lastMessage = this.messages[this.messages.length - 1];
            const lastMessageContent = lastMessage && lastMessage.content ? lastMessage.content.substring(0, 100) : '';
            
            const chatData = {
                id: this.currentChatId || this.generateChatId(),
                title: this.generateChatTitle(),
                messages: [...this.messages],
                timestamp: new Date().toISOString(),
                lastMessage: lastMessageContent
            };
            
            // 确保 chatHistory 数组存在
            if (!this.chatHistory) {
                this.chatHistory = [];
            }
            
            const existingIndex = this.chatHistory.findIndex(chat => chat && chat.id === this.currentChatId);
            if (existingIndex >= 0) {
                this.chatHistory[existingIndex] = chatData;
            } else {
                this.chatHistory.unshift(chatData);
            }
            
            // 最多保存50个对话
            if (this.chatHistory.length > 50) {
                this.chatHistory = this.chatHistory.slice(0, 50);
            }
            
            this.saveChatHistory();
        } catch (error) {
            console.error('保存当前对话失败:', error);
        }
    }
    
    generateChatTitle() {
        try {
            // 确保 messages 数组存在
            if (!this.messages || this.messages.length === 0) {
                return '新对话';
            }
            
            const firstUserMessage = this.messages.find(msg => msg && msg.role === 'user');
            if (firstUserMessage && firstUserMessage.content) {
                const content = firstUserMessage.content;
                return content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
            
            return '对话 ' + new Date().toLocaleString('zh-CN');
        } catch (error) {
            console.error('生成对话标题失败:', error);
            return '对话 ' + new Date().toLocaleString('zh-CN');
        }
    }
    
    initEventListeners() {
        // 使用防抖优化输入框事件
        this.inputDebounced = this.debounce(() => {
            this.autoResize();
            this.sendButton.disabled = !this.messageInput.value.trim();
        }, 100);
        
        this.messageInput.addEventListener('input', this.inputDebounced);
        
        // 键盘事件
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 发送按钮事件
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // 添加滚动监听器，跟踪用户滚动行为
        this.chatContainer.addEventListener('scroll', this.throttle(() => {
            this.lastScrollTime = Date.now();
            this.isUserScrolling = true;
            
            // 延迟重置用户滚动状态
            setTimeout(() => {
                if (Date.now() - this.lastScrollTime > 1000) {
                    this.isUserScrolling = false;
                }
            }, 1000);
        }, 100));
    }
    
    // 防抖工具函数 - 使用工具函数
    debounce(func, wait) {
        try {
            if (typeof window.GLMUtils !== 'undefined' && typeof window.GLMUtils.debounce === 'function') {
                return window.GLMUtils.debounce(func, wait);
            } else {
                // 降级的防抖实现
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
        } catch (error) {
            console.error('防抖函数创建失败:', error);
            return func; // 返回原函数
        }
    }
    
    // 节流工具函数 - 使用工具函数
    throttle(func, limit) {
        try {
            if (typeof window.GLMUtils !== 'undefined' && typeof window.GLMUtils.throttle === 'function') {
                return window.GLMUtils.throttle(func, limit);
            } else {
                // 降级的节流实现
                let inThrottle;
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            }
        } catch (error) {
            console.error('节流函数创建失败:', error);
            return func; // 返回原函数
        }
    }
    
    // 清理资源方法 - 增强版本
    cleanup() {
        try {
            // 确保对象存在再操作
            if (this.timeouts) {
                this.timeouts.forEach(timeoutId => {
                    if (timeoutId) clearTimeout(timeoutId);
                });
                this.timeouts.clear();
            }
            
            // 清理渲染超时
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
                this.renderTimeout = null;
            }
            
            // 清理流式缓冲超时
            if (this.streamBufferTimeout) {
                clearTimeout(this.streamBufferTimeout);
                this.streamBufferTimeout = null;
            }
            
            // 清理流式输出相关状态
            this.streamBuffer = '';
            this.accumulatedContent = '';
            this.lastRenderedContent = '';
            this.renderQueue = [];
            this.isProcessingQueue = false;
            this.streamBufferLock = false;
            
            // 清理渲染引擎缓存
            if (this.renderer && typeof this.renderer.clearCache === 'function') {
                this.renderer.clearCache();
            }
            
            // 清理DOM引用
            this.currentStreamingContent = null;
            this.currentThinkingIndicator = null;
            this.currentThinkingContentDiv = null;
            
            // 重置状态标志
            this.isTyping = false;
            this.isThinkingActive = false;
            
            console.log('资源清理完成');
        } catch (error) {
            console.error('资源清理过程中出错:', error);
        }
    }
    
    // 内存优化方法 - 定期清理
    optimizeMemory() {
        try {
            // 清理过期的对话历史（保留最近20个）
            if (this.chatHistory && this.chatHistory.length > 20) {
                this.chatHistory = this.chatHistory.slice(0, 20);
                this.saveChatHistory();
            }
            
            // 清理渲染引擎缓存
            if (this.renderer && typeof this.renderer.cleanupMathCache === 'function') {
                this.renderer.cleanupMathCache();
            }
            
            // 强制垃圾回收（如果浏览器支持）
            if (window.gc) {
                window.gc();
            }
            
            console.log('内存优化完成');
        } catch (error) {
            console.error('内存优化失败:', error);
        }
    }
    
    // 流式输出缓冲机制 - 优化版本
    addToStreamBuffer(chunk) {
        try {
            // 确保对象存在
            if (!this.streamBuffer) this.streamBuffer = '';
            if (!this.accumulatedContent) this.accumulatedContent = '';
            
            this.streamBuffer += chunk;
            this.accumulatedContent += chunk; // 同时更新累积内容
            
            if (!this.streamBufferLock) {
                this.streamBufferLock = true;
                this.streamBufferTimeout = setTimeout(() => {
                    this.flushStreamBuffer();
                }, this.OUTPUT_INTERVAL);
            }
        } catch (error) {
            console.error('添加到流式缓冲区失败:', error);
        }
    }
    
    // 刷新流式缓冲区 - 批量更新DOM，避免重复渲染
    flushStreamBuffer() {
        if (this.streamBuffer.length > 0) {
            // 清空缓冲区
            this.streamBuffer = '';
            
            // 智能渲染：只有内容发生变化时才更新DOM
            if (this.currentStreamingContent && this.accumulatedContent.trim()) {
                // 检查内容是否真的发生了变化
                if (this.accumulatedContent !== this.lastRenderedContent) {
                    this.updateStreamingContent(this.currentStreamingContent, this.accumulatedContent);
                    this.lastRenderedContent = this.accumulatedContent;
                }
            }
        }
        
        this.streamBufferLock = false;
        this.streamBufferTimeout = null;
        
        // 在流式输出期间使用专用的流式滚动
        this.streamingScrollToBottom();
    }
    
    // 强制刷新缓冲区（用于流式结束时）
    forceFlushStreamBuffer() {
        if (this.streamBufferTimeout) {
            clearTimeout(this.streamBufferTimeout);
            this.streamBufferTimeout = null;
        }
        this.flushStreamBuffer();
        // 重置累积内容，为下次流式输出做准备
        this.accumulatedContent = '';
    }
    
    newChat() {
        try {
            console.log('开始新建对话...');
            
            // 保存当前对话
            this.saveCurrentChat();
            
            // 重置对话状态
            this.messages = [];
            this.currentChatId = this.generateChatId();
            
            // 清空聊天容器
            if (this.chatContainer) {
                this.chatContainer.innerHTML = '';
            }
            
            // 重新渲染历史记录
            this.renderHistory();
            
            // 显示成功消息
            this.showSuccess('已创建新对话');
            
            console.log('新对话创建完成，ID:', this.currentChatId);
        } catch (error) {
            console.error('新建对话失败:', error);
            this.showError('新建对话失败: ' + error.message);
        }
    }
    
    clearChat() {
        try {
            // 确保 messages 数组存在
            if (!this.messages || this.messages.length === 0) {
                this.showError('当前对话已经是空的');
                return;
            }
            
            if (confirm('确定要清空当前对话吗？此操作不可撤销。')) {
                this.messages = [];
                if (this.chatContainer) {
                    this.chatContainer.innerHTML = '';
                }
                this.showSuccess('对话已清空');
            }
        } catch (error) {
            console.error('清空对话失败:', error);
            this.showError('清空对话失败: ' + error.message);
        }
    }
    
    exportChat() {
        try {
            // 确保 messages 数组存在
            if (!this.messages || this.messages.length === 0) {
                this.showError('没有可导出的对话内容');
                return;
            }
            
            const chatData = {
                title: this.generateChatTitle(),
                timestamp: new Date().toISOString(),
                messages: this.messages
            };
            
            const content = this.formatChatForExport(chatData);
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat_${new Date().getTime()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('对话已导出');
        } catch (error) {
            console.error('导出对话失败:', error);
            this.showError('导出对话失败: ' + error.message);
        }
    }
    
    formatChatForExport(chatData) {
        try {
            let content = `# ${chatData.title || '未命名对话'}\n\n`;
            content += `**导出时间：** ${new Date(chatData.timestamp || Date.now()).toLocaleString('zh-CN')}\n\n`;
            content += `---\n\n`;
            
            // 确保 messages 数组存在
            const messages = chatData.messages || [];
            messages.forEach(msg => {
                if (msg && msg.content) {
                    const role = msg.role === 'user' ? '👤 用户' : '🤖 AI助手';
                    content += `## ${role}\n\n`;
                    content += `${msg.content}\n\n`;
                    content += `---\n\n`;
                }
            });
            
            return content;
        } catch (error) {
            console.error('格式化导出内容失败:', error);
            return '# 导出失败\n\n无法格式化对话内容。';
        }
    }
    
    renderHistory() {
        try {
            // 确保历史内容容器存在
            if (!this.historyContent) {
                console.warn('历史内容容器不存在');
                return;
            }
            
            // 获取当前历史记录
            const history = this.chatHistory || [];
            
            if (history.length === 0) {
                this.historyContent.innerHTML = '<div class="history-empty">暂无对话历史</div>';
                return;
            }
            
            // 清空现有内容
            this.historyContent.innerHTML = '';
            
            // 渲染每个历史记录
            history.forEach(chat => {
                try {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    
                    // 安全地转义HTML内容
                    const safeTitle = this.escapeHtml(chat.title || '未命名对话');
                    const safeTime = this.escapeHtml(new Date(chat.timestamp || Date.now()).toLocaleString('zh-CN'));
                    const safePreview = this.escapeHtml(chat.lastMessage || '无预览');
                    
                    historyItem.innerHTML = `
                        <div class="history-item-content">
                            <div class="history-item-title">${safeTitle}</div>
                            <div class="history-item-time">${safeTime}</div>
                            <div class="history-item-preview">${safePreview}</div>
                        </div>
                        <button class="history-item-delete" onclick="tutor.deleteChat('${chat.id}', event)" title="删除对话">🗑️</button>
                    `;
                    
                    // 点击内容区域加载对话
                    const contentArea = historyItem.querySelector('.history-item-content');
                    if (contentArea) {
                        contentArea.addEventListener('click', () => {
                            console.log('点击加载对话:', chat.id);
                            this.loadChat(chat.id);
                        });
                    }
                    
                    this.historyContent.appendChild(historyItem);
                } catch (itemError) {
                    console.error('渲染历史记录项失败:', itemError, chat);
                }
            });
            
            console.log('历史记录渲染完成，共', history.length, '条记录');
        } catch (error) {
            console.error('渲染历史记录失败:', error);
            if (this.historyContent) {
                this.historyContent.innerHTML = '<div class="history-empty">历史记录加载失败</div>';
            }
        }
    }
    
    loadChat(chatId) {
        try {
            console.log('加载对话:', chatId);
            
            const chat = (this.chatHistory || []).find(c => c.id === chatId);
            if (!chat) {
                this.showError('对话不存在');
                return;
            }
            
            // 保存当前对话
            this.saveCurrentChat();
            
            // 设置新对话
            this.currentChatId = chatId;
            this.messages = [...(chat.messages || [])];
            
            // 渲染所有消息
            this.renderAllMessages();
            
            // 显示成功消息
            this.showSuccess('已加载对话：' + (chat.title || '未命名对话'));
            
            console.log('对话加载完成:', chat.title);
        } catch (error) {
            console.error('加载对话失败:', error);
            this.showError('加载对话失败: ' + error.message);
        }
    }
    
    // 删除单个对话
    deleteChat(chatId, event) {
        // 阻止事件冒泡，避免触发加载对话
        event.stopPropagation();
        
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) {
            this.showError('对话不存在');
            return;
        }
        
        if (confirm(`确定要删除对话"${chat.title}"吗？此操作不可撤销。`)) {
            // 从历史记录中移除
            this.chatHistory = this.chatHistory.filter(c => c.id !== chatId);
            
            // 保存更新后的历史记录
            this.saveChatHistory();
            
            // 如果删除的是当前对话，清空当前对话
            if (this.currentChatId === chatId) {
                this.messages = [];
                this.currentChatId = this.generateChatId();
                this.chatContainer.innerHTML = '';
            }
            
            // 重新渲染历史记录
            this.renderHistory();
            
            this.showSuccess('对话已删除');
        }
    }
    
    // 清空所有历史记录
    clearAllHistory() {
        try {
            // 确保 chatHistory 数组存在
            if (!this.chatHistory || this.chatHistory.length === 0) {
                this.showError('暂无对话历史可清空');
                return;
            }
            
            if (confirm('确定要清空所有对话历史吗？此操作不可撤销，将删除所有保存的对话记录。')) {
                // 清空历史记录
                this.chatHistory = [];
                
                // 保存空的历史记录
                this.saveChatHistory();
                
                // 清空当前对话
                this.messages = [];
                this.currentChatId = this.generateChatId();
                if (this.chatContainer) {
                    this.chatContainer.innerHTML = '';
                }
                
                // 重新渲染历史记录
                this.renderHistory();
                
                this.showSuccess('所有对话历史已清空');
            }
        } catch (error) {
            console.error('清空所有历史记录失败:', error);
            this.showError('清空历史记录失败: ' + error.message);
        }
    }
    
    renderAllMessages() {
        try {
            if (this.chatContainer) {
                this.chatContainer.innerHTML = '';
            }
            
            // 确保 messages 数组存在
            const messages = this.messages || [];
            messages.forEach(msg => {
                if (msg && msg.role && msg.content) {
                    this.addMessage(msg.role, msg.content, false);
                }
            });
        } catch (error) {
            console.error('渲染所有消息失败:', error);
            if (this.chatContainer) {
                this.chatContainer.innerHTML = '<div class="error-message">消息渲染失败</div>';
            }
        }
    }
    
    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            this.showSuccess('消息已复制到剪贴板');
        }).catch(() => {
            this.showError('复制失败，请手动选择复制');
        });
    }
    
    
    retryMessage(originalMessage) {
        try {
            // 确保 messages 数组存在
            if (!this.messages || this.messages.length === 0) {
                console.warn('没有消息可重试');
                return;
            }
            
            // 移除最后一条AI回复
            const lastMessage = this.messages[this.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                this.messages.pop();
                if (this.chatContainer) {
                    const lastMessageDiv = this.chatContainer.lastElementChild;
                    if (lastMessageDiv && lastMessageDiv.classList.contains('assistant')) {
                        lastMessageDiv.remove();
                    }
                }
            }
            
            // 重新发送消息
            this.sendMessageWithContent(originalMessage);
        } catch (error) {
            console.error('重试消息失败:', error);
            this.showError('重试消息失败: ' + error.message);
        }
    }
    
    sendMessageWithContent(message) {
        this.messageInput.value = message;
        this.sendMessage();
    }
    
    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        console.log('发送消息:', message);
        
        // 添加用户消息到messages数组
        this.messages.push({ role: 'user', content: message });
        
        
        // 显示用户消息
        this.addMessage('user', message, false);
        
        // 清空输入框
        this.messageInput.value = '';
        this.autoResize();
        this.sendButton.disabled = true;
        this.isTyping = true;
        
        try {
            // 调用GLM4.5 API 并实现流式输出
            await this.callGLMAPIStream(message);
            
        } catch (error) {
            console.error('GLM API调用失败:', error);
            console.error('错误堆栈:', error.stack);
            console.error('当前状态:', {
                timeouts: this.timeouts,
                pendingRequests: this.pendingRequests,
                renderer: this.renderer,
                messages: this.messages
            });
            
            // 更详细的错误信息
            let errorMessage = 'API调用失败';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            if (error.name === 'TypeError' && error.message.includes('add')) {
                errorMessage += ' (对象初始化错误)';
            }
            
            this.showError(errorMessage);
            
            // 如果API调用失败，移除刚添加的用户消息
            try {
                if (this.messages && this.messages.length > 0) {
                    const lastMessage = this.messages[this.messages.length - 1];
                    if (lastMessage && lastMessage.role === 'user') {
                        this.messages.pop();
                    }
                }
            } catch (messageError) {
                console.error('移除用户消息失败:', messageError);
            }
        } finally {
            this.hideTypingIndicator();
            this.isTyping = false;
            this.sendButton.disabled = false;
        }
    }
    
    async callGLMAPIStream(message) {
        // 优化消息历史，只保留最近的对话上下文
        const optimizedMessages = this.optimizeMessageHistory();
        
        const messages = [
            { role: 'system', content: this.getSystemPrompt() },
            ...optimizedMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];
        
        // 使用同一个气泡显示思考动画和内容
        const thinkingIndicator = this.showTypingIndicator();
        let accumulatedContent = '';
        
        // 确保在AI开始回复时滚动到底部
        this.scrollToBottom(false, true, false);
        
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: 1500, // 减少max_tokens，节约资源
                    temperature: 0.7,
                    stream: true  // 启用流式输出
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let hasReceivedContent = false;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                hasReceivedContent = true;
                                
                                // 第一次收到内容时，停止思考动画并转换为内容显示
                                if (accumulatedContent === '') {
                                    this.transitionThinkingToContent();
                                    // 重置累积内容，开始新的流式输出
                                    this.accumulatedContent = '';
                                    // 确保在AI开始输出内容时滚动到底部
                                    this.scrollToBottom(false, true, false);
                                }
                                
                                accumulatedContent += content;
                                // 使用缓冲机制而不是直接更新DOM
                                this.addToStreamBuffer(content);
                            }
                        } catch (e) {
                            console.warn('解析流式数据失败:', e);
                        }
                    }
                }
            }
            
            // 检查是否收到了任何内容
            if (!hasReceivedContent) {
                console.warn('流式响应未收到任何内容');
                this.showError('未收到AI回复，请重试');
                return;
            }
            
            // 保存完整消息（确保内容不为空）
            if (accumulatedContent && accumulatedContent.trim()) {
                this.messages.push({ role: 'assistant', content: accumulatedContent });
                
            } else {
                console.warn('AI回复内容为空，跳过保存');
                this.showError('AI回复为空，请重试');
                return;
            }
            
            // 流式输出完成，强制刷新缓冲区
            this.forceFlushStreamBuffer();
            
            // 移除流式光标并添加操作按钮
            const streamingContentElement = this.currentStreamingContent;
            if (streamingContentElement) {
                streamingContentElement.classList.remove('streaming-content');
                
                // 移除增强的光标和进度指示器
                const cursor = streamingContentElement.querySelector('.streaming-cursor-enhanced');
                if (cursor) cursor.remove();
                const progress = streamingContentElement.querySelector('.streaming-progress');
                if (progress) progress.remove();
                
                // 清除延迟渲染任务
                if (this.renderTimeout) {
                    clearTimeout(this.renderTimeout);
                    this.renderTimeout = null;
                }
                
                // 流式渲染完成后，使用新的渲染引擎进行最终处理
                requestAnimationFrame(() => {
                    this.finalizeStreamingContent(streamingContentElement, accumulatedContent);
                });
                
                // 添加操作按钮
                const actionsDiv = this.createActionButtons('assistant', accumulatedContent);
                this.currentThinkingContentDiv.appendChild(actionsDiv);
                
                // 确保在AI回复完全完成后滚动到底部
                this.scrollToBottom(false, true, false);
            }
            
            // 保存当前对话到历史
            this.saveCurrentChat();
            // 更新左侧栏的历史显示
            this.renderHistory();
            
        } catch (error) {
            // 如果流式失败，回退到非流式
            console.warn('流式API调用失败，回退到普通API:', error);
            await this.fallbackToNonStream(message);
        } finally {
            // 无论成功失败，都进行内存清理
            this.optimizeMemory();
        }
        
        // 确保在流式输出完成后强制滚动到底部
        this.scrollToBottom(false, true, false);
    }
    
    // 优化消息历史，减少token消耗
    optimizeMessageHistory() {
        // 如果消息数量较少，直接返回
        if (this.messages.length <= 6) {
            return this.messages;
        }
        
        // 保留系统消息和最近的5轮对话
        const recentMessages = [];
        let conversationTurns = 0;
        
        // 从后往前遍历，计算对话轮次
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            recentMessages.unshift(msg);
            
            if (msg.role === 'user') {
                conversationTurns++;
                if (conversationTurns >= 5) {
                    break;
                }
            }
        }
        
        return recentMessages;
    }
    
    async fallbackToNonStream(message, messageDiv, streamingContent) {
        try {
            // 确保消息数组存在
            const messages = this.messages || [];
            
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: this.getSystemPrompt() },
                        ...messages.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }))
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // 一次性显示完整内容
            if (content && content.trim()) {
                // 在显示内容前隐藏思考提示
                this.hideTypingIndicator();
                this.updateStreamingContent(streamingContent, content);
                this.messages.push({ role: 'assistant', content });
                
                
                // 确保在非流式输出后强制滚动到底部
                this.scrollToBottom(false, true, false);
            } else {
                console.warn('非流式API返回内容为空');
                this.hideTypingIndicator();
                this.showError('AI回复为空，请重试');
                return;
            }
            
            // 移除流式光标并添加操作按钮
            const streamingContentElement = messageDiv.querySelector('.streaming-content');
            if (streamingContentElement) {
                streamingContentElement.classList.remove('streaming-content');
                
                // 移除增强的光标和进度指示器
                const cursor = streamingContentElement.querySelector('.streaming-cursor-enhanced');
                if (cursor) cursor.remove();
                const progress = streamingContentElement.querySelector('.streaming-progress');
                if (progress) progress.remove();
                
                // 清除延迟渲染任务
                if (this.renderTimeout) {
                    clearTimeout(this.renderTimeout);
                    this.renderTimeout = null;
                }
                
                // 非流式渲染完成后，使用新的渲染引擎进行最终处理
                requestAnimationFrame(() => {
                    this.finalizeStreamingContent(streamingContentElement, content);
                });
                
                // 使用通用方法添加操作按钮
                const actionsDiv = this.createActionButtons('assistant', content);
                contentDiv.appendChild(actionsDiv);
            }
            
            // 保存当前对话到历史
            this.saveCurrentChat();
            
        } catch (error) {
            throw error; // 重新抛出错误让外层处理
        }
    }
    
    updateStreamingContent(element, content) {
        try {
            // 清除之前的延迟任务
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
                this.renderTimeout = null;
            }
            
            // 检查内容是否为空
            if (!content || !content.trim()) {
                console.warn('流式内容为空，跳过更新');
                return;
            }
            
            // 智能渲染：避免重复渲染相同内容
            if (content === this.lastRenderedContent) {
                return; // 内容未变化，跳过渲染
            }
            
            // 确保渲染器存在
            if (!this.renderer) {
                console.warn('渲染器未初始化，使用降级渲染');
                element.innerHTML = content.replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>';
                return;
            }
            
            // 使用GLMRenderer进行流式渲染，启用优化模式
            const renderedContent = this.renderer.renderContent(content, true);
            
            // 创建临时div来存储渲染结果
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = renderedContent;
            
            // 添加流式光标
            const cursor = document.createElement('span');
            cursor.className = 'streaming-cursor-enhanced';
            cursor.textContent = '';
            tmpDiv.appendChild(cursor);
            
            // 添加进度指示器
            const progressIndicator = document.createElement('span');
            progressIndicator.className = 'streaming-progress';
            tmpDiv.appendChild(progressIndicator);
            
            // 批量更新DOM，减少重排
            requestAnimationFrame(() => {
                if (element) {
                    element.innerHTML = tmpDiv.innerHTML;
                    // 在流式输出期间使用专用的流式滚动
                    this.streamingScrollToBottom();
                }
            });
            
        } catch (error) {
            console.error('流式内容渲染失败:', error);
            // 降级到原始渲染方法
            try {
                if (this.renderer) {
                    const renderedContent = this.renderer.renderContent(content, true);
                    requestAnimationFrame(() => {
                        if (element) {
                            element.innerHTML = renderedContent + '<span class="streaming-cursor"></span>';
                            // 即使出错也要使用流式滚动
                            this.streamingScrollToBottom();
                        }
                    });
                } else {
                    // 最终降级：纯文本渲染
                    requestAnimationFrame(() => {
                        if (element) {
                            element.innerHTML = content.replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>';
                            this.streamingScrollToBottom();
                        }
                    });
                }
            } catch (fallbackError) {
                console.error('降级渲染也失败:', fallbackError);
                // 最简单的降级
                if (element) {
                    element.textContent = content + '...';
                }
            }
        }
    }
    
    addMessage(role, content, saveToHistory = true) {
        try {
            // 使用通用方法创建消息元素
            const { messageDiv, contentDiv } = this.createMessageElement(role, content, false);
            
            // 确保渲染器存在
            if (this.renderer) {
                try {
                    // 使用GLMRenderer处理内容
                    const formattedContent = this.renderer.renderContent(content, false);
                    const markdownContent = contentDiv.querySelector('.markdown-content');
                    if (markdownContent) {
                        markdownContent.innerHTML = formattedContent;
                    }
                    
                    // 使用requestAnimationFrame进行后处理，提高性能
                    requestAnimationFrame(() => {
                        if (this.renderer && typeof this.renderer.postProcessContent === 'function') {
                            this.renderer.postProcessContent(contentDiv);
                        }
                    });
                } catch (renderError) {
                    console.error('消息渲染失败，使用降级渲染:', renderError);
                    // 降级到简单的文本渲染
                    const markdownContent = contentDiv.querySelector('.markdown-content');
                    if (markdownContent) {
                        markdownContent.innerHTML = content.replace(/\n/g, '<br>');
                    }
                }
            } else {
                console.warn('渲染器未初始化，使用简单渲染');
                // 简单的文本渲染
                const markdownContent = contentDiv.querySelector('.markdown-content');
                if (markdownContent) {
                    markdownContent.innerHTML = content.replace(/\n/g, '<br>');
                }
            }
            
            // 使用通用方法添加操作按钮
            const actionsDiv = this.createActionButtons(role, content);
            contentDiv.appendChild(actionsDiv);
            
            if (this.chatContainer) {
                this.chatContainer.appendChild(messageDiv);
                // 用户发送消息时强制滚动到底部，不检查用户位置
                this.scrollToBottom(false, true, false);
            }
            
            // 保存消息
            if (saveToHistory) {
                if (!this.messages) this.messages = [];
                this.messages.push({ role, content });
            }
        } catch (error) {
            console.error('添加消息失败:', error);
            // 最简单的降级处理
            if (this.chatContainer) {
                const simpleDiv = document.createElement('div');
                simpleDiv.className = `message ${role}`;
                simpleDiv.innerHTML = `
                    <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
                    <div class="message-content">${content.replace(/\n/g, '<br>')}</div>
                `;
                this.chatContainer.appendChild(simpleDiv);
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showTypingIndicator() {
        // 创建一个同时支持思考动画和内容显示的消息元素
        const { messageDiv, contentDiv, streamingContent } = this.createMessageElement('assistant', '', true);
        messageDiv.className = 'message assistant thinking-indicator detailed';
        
        // 替换内容为思考动画
        contentDiv.innerHTML = `
            <div class="thinking-content">
                <div class="thinking-icon"></div>
                <div class="thinking-text"></div>
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div class="thinking-progress">
                <div class="thinking-progress-bar"></div>
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        
        // 保存引用，后续用于转换为内容显示
        this.currentThinkingIndicator = messageDiv;
        this.currentThinkingContentDiv = contentDiv;
        this.currentStreamingContent = streamingContent;
        this.isThinkingActive = true;
        
        // 开始思考阶段动画
        this.startThinkingStages(messageDiv);
        
        // 思考指示器显示时强制滚动到底部
        this.scrollToBottom(false, true, false);
        
        return messageDiv;
    }
    
    hideTypingIndicator() {
        const indicator = this.currentThinkingIndicator;
        if (indicator) {
            // 停止思考阶段动画
            if (indicator.stopThinkingStages) {
                indicator.stopThinkingStages();
            }
            
            // 移除思考相关的类和内容
            indicator.classList.remove('thinking-indicator', 'detailed');
            
            // 清理思考状态
            this.currentThinkingIndicator = null;
            this.currentThinkingContentDiv = null;
            this.currentStreamingContent = null;
            this.isThinkingActive = false;
        }
    }
    
    // 开始思考阶段动画
    startThinkingStages(indicator) {
        const stages = [
            'thinking-stage-analyzing',
            'thinking-stage-searching',
            'thinking-stage-organizing',
            'thinking-generating'
        ];
        
        let currentStage = 0;
        let isThinking = true;
        
        // 保存指示器引用，用于后续停止
        this.currentThinkingIndicator = indicator;
        this.isThinkingActive = true;
        
        const updateStage = () => {
            // 如果思考已经停止（收到了文字输出），则停止阶段切换
            if (!isThinking || !this.isThinkingActive) {
                return;
            }
            
            // 移除所有阶段类
            stages.forEach(stage => indicator.classList.remove(stage));
            
            // 添加当前阶段类
            if (currentStage < stages.length) {
                indicator.classList.add(stages[currentStage]);
                currentStage++;
                
                // 如果还有下一阶段，继续切换
                if (currentStage < stages.length && this.isThinkingActive) {
                    const stageTimeout = setTimeout(updateStage, 800 + Math.random() * 400);
                    // 确保 timeouts 对象存在
                    if (this.timeouts) {
                        this.timeouts.add(stageTimeout);
                    } else {
                        console.warn('timeouts 对象未初始化，跳过添加超时引用');
                    }
                }
                // 如果是最后阶段，保持在最后阶段直到收到文字输出，不再重复循环
            }
        };
        
        // 停止思考阶段动画的方法
        indicator.stopThinkingStages = () => {
            isThinking = false;
            this.isThinkingActive = false;
        };
        
        // 开始第一阶段
        updateStage();
    }
    
    // 将思考动画转换为内容显示
    transitionThinkingToContent() {
        const indicator = this.currentThinkingIndicator;
        const contentDiv = this.currentThinkingContentDiv;
        
        if (indicator && contentDiv) {
            // 停止思考动画
            if (indicator.stopThinkingStages) {
                indicator.stopThinkingStages();
            }
            
            // 移除思考相关的类
            indicator.classList.remove('thinking-indicator', 'detailed');
            
            // 将内容区域转换为流式内容显示
            contentDiv.innerHTML = `
                <div class="streaming-content"></div>
                <div class="message-time">${new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</div>
            `;
            
            // 更新流式内容引用
            this.currentStreamingContent = contentDiv.querySelector('.streaming-content');
        }
    }
    
    // 显示简化的思考提示（用于快速响应）
    showMinimalThinkingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant thinking-indicator minimal';
        indicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="thinking-content">
                    <div class="thinking-icon"></div>
                    <div class="thinking-text"></div>
                    <div class="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(indicator);
        // 简化思考指示器显示时强制滚动到底部
        this.scrollToBottom(false, true, false);
        
        return indicator;
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = '❌ ' + message;
        this.chatContainer.appendChild(errorDiv);
        // 错误消息显示时强制滚动到底部
        this.scrollToBottom(false, true, false);
        
        // 3秒后自动移除错误消息
        const timeoutId = setTimeout(() => {
            try {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.remove();
                }
                // 确保 timeouts 对象存在
                if (this.timeouts) {
                    this.timeouts.delete(timeoutId);
                }
            } catch (error) {
                console.error('移除错误消息失败:', error);
            }
        }, 5000);
        
        // 确保 timeouts 对象存在
        if (this.timeouts) {
            this.timeouts.add(timeoutId);
        } else {
            console.warn('timeouts 对象未初始化，无法添加超时引用');
        }
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = '✅ ' + message;
        this.chatContainer.appendChild(successDiv);
        // 成功消息显示时强制滚动到底部
        this.scrollToBottom(false, true, false);
        
        // 3秒后自动移除成功消息
        const timeoutId = setTimeout(() => {
            try {
                if (successDiv && successDiv.parentNode) {
                    successDiv.remove();
                }
                // 确保 timeouts 对象存在
                if (this.timeouts) {
                    this.timeouts.delete(timeoutId);
                }
            } catch (error) {
                console.error('移除成功消息失败:', error);
            }
        }, 3000);
        
        // 确保 timeouts 对象存在
        if (this.timeouts) {
            this.timeouts.add(timeoutId);
        } else {
            console.warn('timeouts 对象未初始化，无法添加超时引用');
        }
    }
    
    async checkAPIAvailability() {
        this.updateStatus('检查API可用性...');
        
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (response.ok) {
                this.updateStatus('API可用');
                this.showSuccess('GLM4.5 API连接成功，可以正常使用');
            } else {
                const errorData = await response.json().catch(() => ({}));
                this.updateStatus('API不可用');
                if (response.status === 401) {
                    this.showError('API密钥无效，请检查密钥是否正确');
                } else if (response.status === 429) {
                    this.showError('API请求频率过高，请稍后再试');
                } else if (response.status === 403) {
                    this.showError('API访问被拒绝，请检查权限设置');
                } else {
                    this.showError(`API不可用: ${errorData.error?.message || response.statusText}`);
                }
            }
        } catch (error) {
            this.updateStatus('连接失败');
            this.showError('网络连接失败，请检查网络连接');
        }
    }
    
    updateStatus(status) {
        if (this.statusElement) {
            this.statusElement.textContent = status;
            this.statusElement.style.color = status.includes('可用') ? '#16a34a' :
                                            status.includes('不可用') ? '#dc2626' :
                                            status.includes('失败') ? '#f59e0b' : '#1e40af';
        }
    }
    
    
    
    // 完成流式渲染的最终处理
    finalizeStreamingContent(element, content) {
        try {
            // 清除之前的延迟任务
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
                this.renderTimeout = null;
            }
            
            // 检查内容是否为空
            if (!content || !content.trim()) {
                console.warn('最终处理时内容为空');
                if (element) {
                    element.innerHTML = '<span style="color: #999;">AI回复为空</span>';
                }
                return;
            }
            
            // 确保渲染器存在
            if (this.renderer) {
                try {
                    // 使用GLMRenderer进行最终渲染
                    const finalContent = this.renderer.renderContent(content, false);
                    if (element) {
                        element.innerHTML = finalContent;
                    }
                    
                    // 进行后处理
                    if (typeof this.renderer.postProcessContent === 'function') {
                        this.renderer.postProcessContent(element);
                    }
                } catch (renderError) {
                    console.error('最终渲染失败，使用降级渲染:', renderError);
                    // 降级处理
                    if (element) {
                        const fallbackContent = content.replace(/\n/g, '<br>');
                        element.innerHTML = fallbackContent;
                    }
                }
            } else {
                console.warn('渲染器未初始化，使用简单渲染');
                if (element) {
                    element.innerHTML = content.replace(/\n/g, '<br>');
                }
            }
            
            // 确保在最终处理完成后强制滚动到底部
            this.scrollToBottom(false, true, false);
            
            console.log('流式渲染完成，最终处理完成');
            
        } catch (error) {
            console.error('流式渲染最终处理失败:', error);
            // 最简单的降级处理
            if (element) {
                element.innerHTML = content ? content.replace(/\n/g, '<br>') : '<span style="color: #999;">渲染失败</span>';
            }
            // 即使出错也要确保滚动
            this.scrollToBottom(false, true, false);
        }
    }

    
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 检查 KaTeX 是否正确加载
    if (typeof katex === 'undefined') {
        console.error('KaTeX 未正确加载');
        alert('KaTeX 库加载失败，数学公式可能无法正常显示');
    } else {
        console.log('KaTeX 已正确加载，版本:', katex.version);
    }
    
    // 检查 marked 是否正确加载
    if (typeof marked === 'undefined') {
        console.error('marked 未正确加载');
    } else {
        console.log('marked 已正确加载');
    }
    
    
    window.tutor = new GLMTutor();
    console.log('GLM4.5 AI智能家教已启动');
    
    // 渲染页面中已存在的数学公式（使用GLMRenderer）
    if (typeof window.tutor.renderer !== 'undefined') {
        window.tutor.renderer.postProcessContent(document.body);
    }
    
    // 检查API可用性
    window.tutor.checkAPIAvailability();
});