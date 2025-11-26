document.addEventListener('DOMContentLoaded', () => {
    // 获取 DOM 元素
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messageList = document.getElementById('messageList');
    const chatArea = document.getElementById('chatArea');
    const newChatBtn = document.getElementById('newChatBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const historyList = document.querySelector('.history-list');
    const menuBurger = document.getElementById('sidebarMenuBurger');
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const overlayMenuBurger = document.getElementById('overlayMenuBurger');
    const overlayNewChatBtn = document.getElementById('overlayNewChatBtn');
    const overlayHistoryList = document.getElementById('overlayHistoryList');
    const blankSidebar = document.getElementById('blankSidebar');
    const blankSidebarBackdrop = document.getElementById('blankSidebarBackdrop');
    const blankSidebarClose = document.getElementById('blankSidebarClose');
    const knowledgeBaseBtn = document.getElementById('knowledgeBaseBtn');
    const toolboxBtn = document.getElementById('toolboxBtn');
    const aiChatBtn = document.getElementById('aiChatBtn');
    
    // 侧边栏状态管理
    let isSidebarOpen = true;
    
    // 新侧边栏状态管理
    let isBlankSidebarOpen = false;
    
    // 历史记录管理
    let currentChatId = null;
    let currentMessages = [];
    
    // 历史记录功能
    const HistoryManager = {
        // 生成唯一ID
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        // 保存对话历史
        saveChat(title, messages) {
            const chatId = this.generateId();
            const chat = {
                id: chatId,
                title: title || '新对话',
                messages: messages,
                timestamp: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            let history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            history.unshift(chat); // 添加到开头
            
            // 限制历史记录数量（最多保存50条）
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('chatHistory', JSON.stringify(history));
            return chatId;
        },
        
        // 获取历史记录
        getHistory() {
            return JSON.parse(localStorage.getItem('chatHistory') || '[]');
        },
        
        // 删除历史记录
        deleteChat(chatId) {
            let history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            history = history.filter(chat => chat.id !== chatId);
            localStorage.setItem('chatHistory', JSON.stringify(history));
        },
        
        // 获取单个对话
        getChat(chatId) {
            const history = this.getHistory();
            return history.find(chat => chat.id === chatId);
        },
        
        // 生成对话标题（基于第一条用户消息）
        generateTitle(messages) {
            const userMessage = messages.find(msg => msg.sender === 'user');
            if (!userMessage) return '新对话';
            
            // 提取前30个字符作为临时标题
            let title = userMessage.content.replace(/\n/g, ' ').trim();
            if (title.length > 30) {
                title = title.substring(0, 30) + '...';
            }
            return title || '新对话';
        },
        
        // AI生成对话标题
        async generateAITitle(messages) {
            if (!messages || messages.length === 0) return '新对话';
            
            try {
                // 构建完整的对话内容用于总结
                let conversationText = '';
                messages.forEach(msg => {
                    const sender = msg.sender === 'user' ? '用户' : 'AI';
                    conversationText += `${sender}: ${msg.content}\n`;
                });
                
                // 如果对话内容太长，只取前500字符
                const content = conversationText.length > 500
                    ? conversationText.substring(0, 500) + '...'
                    : conversationText;
                
                console.log('开始生成AI标题，完整对话内容:', content);
                
                const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 3b9469fa776644e0aff8d2cc0807ee19.DONNWpkITAi5Jg71'
                    },
                    body: JSON.stringify({
                        model: 'glm-4.5',
                        messages: [
                            {
                                role: 'system',
                                content: '请根据以下完整的对话内容，生成一个简短精练的总结性标题，不超过15个字。要求：1. 基于整个对话的主题进行总结 2. 不要只是简单提取第一句话 3. 直接返回标题，不要任何解释或标点符号。'
                            },
                            {
                                role: 'user',
                                content: content
                            }
                        ],
                        max_tokens: 20,
                        temperature: 0.3
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API调用失败: ${response.status}`);
                }
                
                const data = await response.json();
                const aiTitle = data.choices?.[0]?.message?.content?.trim();
                
                console.log('AI生成的总结标题:', aiTitle);
                
                if (aiTitle && aiTitle.length > 0) {
                    return aiTitle;
                }
            } catch (error) {
                console.warn('AI生成标题失败，使用默认标题:', error);
            }
            
            // 如果AI生成失败，使用原来的方法
            return this.generateTitle(messages);
        },
        
        // 格式化时间戳
        formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            // 小于1分钟
            if (diff < 60000) {
                return '刚刚';
            }
            
            // 小于1小时
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return `${minutes}分钟前`;
            }
            
            // 小于24小时
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return `${hours}小时前`;
            }
            
            // 小于7天
            if (diff < 604800000) {
                const days = Math.floor(diff / 86400000);
                return `${days}天前`;
            }
            
            // 超过7天显示具体日期
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    // 1. 文本框自适应高度逻辑
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto'; // 先重置高度
        this.style.height = (this.scrollHeight) + 'px'; // 根据内容设置高度
        
        // 简单判断是否有内容，控制发送按钮状态（CSS 中通过 :not(:placeholder-shown) 也有控制，双重保障）
        if(this.value.trim().length > 0) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // 2. 文件上传处理
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            const fileName = e.target.files[0].name;
            // 演示效果：在输入框显示文件名提示
            chatInput.value += `[附件: ${fileName}] `;
            chatInput.focus();
            chatInput.dispatchEvent(new Event('input')); // 触发高度调整
        }
    });

    // 3. 发送消息核心逻辑
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 如果是第一条消息，隐藏欢迎页，显示消息列表
        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
            messageList.style.display = 'flex';
        }

        // 添加用户消息
        addMessage(text, 'user');
        
        // 清空输入框
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        // 显示 "正在思考" 状态
        showTypingIndicator();

        // 调用 GLM API
        callGLMAPI(text);
    }

    sendBtn.addEventListener('click', sendMessage);
    
    // 监听回车键发送 (Shift+Enter 换行)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 辅助函数：向 UI 添加消息
    function addMessage(content, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        
        // 根据发送者设置不同的图标
        const iconHtml = sender === 'ai'
            // AI 星星图标
            ? '<svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M12 2L9.19 8.63 2.56 11.44 9.19 14.25 12 20.88 14.81 14.25 21.44 11.44 14.81 8.63z" /></svg>'
            // 用户文字头像
            : 'U';
        avatarDiv.innerHTML = iconHtml;

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        // 简单的换行处理 (生产环境应使用 Markdown 解析器如 marked.js)
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(contentDiv);
        
        messageList.appendChild(msgDiv);
        
        // 保存消息到当前对话
        currentMessages.push({
            content: content,
            sender: sender,
            timestamp: Date.now()
        });
        
        // 自动滚动到底部
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // 显示历史记录列表
    function renderHistoryList() {
        const history = HistoryManager.getHistory();
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty" style="padding: 10px 16px; color: var(--text-secondary); font-size: 14px;">暂无历史记录</div>';
            // 同步到覆盖层
            if (typeof syncHistoryToOverlay === 'function') {
                syncHistoryToOverlay();
            }
            return;
        }
        
        history.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item-wrapper';
            historyItem.innerHTML = `
                <a href="#" class="history-item" data-chat-id="${chat.id}">
                    <span class="history-title text-truncate">${chat.title}</span>
                    <span class="history-time">${HistoryManager.formatTimestamp(chat.timestamp)}</span>
                </a>
                <button class="history-delete-btn" data-chat-id="${chat.id}" title="删除对话">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            `;
            
            // 添加点击事件
            const historyLink = historyItem.querySelector('.history-item');
            historyLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await loadChat(chat.id);
            });
            
            // 添加删除事件
            const deleteBtn = historyItem.querySelector('.history-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteChat(chat.id);
            });
            
            historyList.appendChild(historyItem);
        });
        
        // 同步到覆盖层
        if (typeof syncHistoryToOverlay === 'function') {
            syncHistoryToOverlay();
        }
    }
    
    // 加载历史对话
    async function loadChat(chatId) {
        const chat = HistoryManager.getChat(chatId);
        if (!chat) return;
        
        // 如果有当前对话且有消息，先保存
        if (currentMessages.length > 0 && !currentChatId) {
            await saveCurrentChat();
        }
        
        currentChatId = chatId;
        currentMessages = chat.messages;
        
        // 清空现有消息
        messageList.innerHTML = '';
        messageList.style.display = 'flex';
        welcomeScreen.style.display = 'none';
        
        // 重新显示历史消息
        chat.messages.forEach(msg => {
            addMessageToUI(msg.content, msg.sender);
        });
        
        // 更新历史列表显示状态
        updateHistoryActiveState();
    }
    
    // 删除历史对话
    function deleteChat(chatId) {
        if (confirm('确定要删除这个对话吗？')) {
            HistoryManager.deleteChat(chatId);
            
            // 如果删除的是当前对话，清空界面
            if (currentChatId === chatId) {
                currentChatId = null;
                currentMessages = [];
                messageList.innerHTML = '';
                messageList.style.display = 'none';
                welcomeScreen.style.display = 'flex';
                chatInput.value = '';
                chatInput.style.height = 'auto';
            }
            
            renderHistoryList();
        }
    }
    
    // 更新历史记录的激活状态
    function updateHistoryActiveState() {
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === currentChatId) {
                item.classList.add('active');
            }
        });
    }
    
    // 保存当前对话
    async function saveCurrentChat() {
        if (currentMessages.length === 0) return;
        
        // 先用临时标题保存
        let title = HistoryManager.generateTitle(currentMessages);
        if (currentChatId) {
            // 更新现有对话
            HistoryManager.deleteChat(currentChatId);
        }
        currentChatId = HistoryManager.saveChat(title, currentMessages);
        renderHistoryList();
        updateHistoryActiveState();
    }
    
    // 使用AI更新对话标题
    async function updateChatTitleWithAI() {
        if (!currentChatId || currentMessages.length === 0) return;
        
        console.log('开始更新AI标题，当前对话ID:', currentChatId);
        
        try {
            const aiTitle = await HistoryManager.generateAITitle(currentMessages);
            
            console.log('AI生成的标题:', aiTitle);
            
            if (aiTitle) {
                // 获取当前对话
                const currentChat = HistoryManager.getChat(currentChatId);
                if (currentChat && currentChat.title !== aiTitle) {
                    console.log('更新标题从', currentChat.title, '到', aiTitle);
                    // 删除旧记录
                    HistoryManager.deleteChat(currentChatId);
                    // 用AI生成的标题重新保存
                    currentChatId = HistoryManager.saveChat(aiTitle, currentMessages);
                    renderHistoryList();
                    updateHistoryActiveState();
                }
            }
        } catch (error) {
            console.warn('AI标题生成失败，保持临时标题:', error);
        }
    }
    
    // 只添加到UI不保存到消息数组的函数
    function addMessageToUI(content, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        
        // 根据发送者设置不同的图标
        const iconHtml = sender === 'ai'
            // AI 星星图标
            ? '<svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M12 2L9.19 8.63 2.56 11.44 9.19 14.25 12 20.88 14.81 14.25 21.44 11.44 14.81 8.63z" /></svg>'
            // 用户文字头像
            : 'U';
        avatarDiv.innerHTML = iconHtml;

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        // 简单的换行处理 (生产环境应使用 Markdown 解析器如 marked.js)
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(contentDiv);
        
        messageList.appendChild(msgDiv);
        
        // 自动滚动到底部
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // 4. 新建对话按钮
    newChatBtn.addEventListener('click', async () => {
        // 如果有当前对话且有消息，先保存
        if (currentMessages.length > 0) {
            await saveCurrentChat();
        }
        
        // 清空现有消息
        currentChatId = null;
        currentMessages = [];
        messageList.innerHTML = '';
        messageList.style.display = 'none';
        // 显示欢迎页
        welcomeScreen.style.display = 'flex';
        // 清空输入
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        updateHistoryActiveState();
    });

    // 5. 导出 PDF 功能模拟
    exportPdfBtn.addEventListener('click', () => {
        const btnText = exportPdfBtn.querySelector('span');
        const originalText = btnText.innerText;
        
        // 简单的 loading 状态
        btnText.innerText = "生成中...";
        exportPdfBtn.style.opacity = "0.7";
        
        setTimeout(() => {
            alert("模拟成功：PDF 学习资料已生成并下载！");
            btnText.innerText = originalText;
            exportPdfBtn.style.opacity = "1";
        }, 1000);
    });

    // 暴露全局函数给 HTML 中的 onclick 使用 (建议卡片)
    window.setInput = function(text) {
        chatInput.value = text;
        chatInput.focus();
        chatInput.dispatchEvent(new Event('input')); // 触发高度和按钮状态更新
    };

    // --- 模拟数据与辅助功能 ---

    let typingIndicatorDiv = null;

    function showTypingIndicator() {
        typingIndicatorDiv = document.createElement('div');
        typingIndicatorDiv.classList.add('message', 'ai');
        // 使用淡色文字和星星图标
        typingIndicatorDiv.innerHTML = `
            <div class="message-avatar" style="background: linear-gradient(135deg, #4285F4, #9B72CB); color: white;">
               <svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M12 2L9.19 8.63 2.56 11.44 9.19 14.25 12 20.88 14.81 14.25 21.44 11.44 14.81 8.63z" /></svg>
            </div>
            <div class="message-content" style="color: #747775; font-style: italic;">
                正在分析问题...
            </div>
        `;
        messageList.appendChild(typingIndicatorDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function removeTypingIndicator() {
        if (typingIndicatorDiv) {
            typingIndicatorDiv.remove();
            typingIndicatorDiv = null;
        }
    }

    // 简单的关键词回复逻辑 (Mock AI)
    function generateMockResponse(input) {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes("泰勒")) {
            return `**泰勒展开 (Taylor Series)** 是数学中一个非常强有力的工具。\n\n简单来说，它的核心思想是：**利用一个函数在某一点的信息（函数值、一阶导数、二阶导数...），去模拟这个函数在这一点附近的图像。**\n\n想象一下，你想画一条复杂的曲线，但你只知道它在起点的切线方向（一阶导），弯曲程度（二阶导）等等。你知道的信息越多，画出来的线就越接近真实的曲线。\n\n公式通常写作：\n f(x) = f(a) + f'(a)(x-a) + f''(a)/2! * (x-a)^2 + ...`;
        }
        
        if (lowerInput.includes("c++") || lowerInput.includes("code")) {
            return `当然，这是标准的 **C++ Hello World** 程序：\n\n\`\`\`cpp\n#include <iostream>\n\nint main() {\n    // 输出 Hello World 到控制台\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n\`\`\`\n\n**代码解释：**\n1. \`#include <iostream>\`: 引入输入输出流库，让我们能使用 \`cout\`。\n2. \`int main()\`: 程序的入口点。\n3. \`std::cout\`: 标准输出对象，类似于“屏幕”。`;
        }
        
        if (lowerInput.includes("雅思") || lowerInput.includes("计划")) {
            return `好的，这是为你定制的 **7天雅思口语突击计划**：\n\n**Day 1-2: Part 1 高频话题**\n- 重点：流利度与自然反应。\n- 练习：Hometown, Work/Study, Hobbies。\n\n**Day 3-5: Part 2 故事构建**\n- 重点：利用 'STAR' 原则讲故事（Situation, Task, Action, Result）。\n- 准备 4 个核心素材：一次旅行、一个敬佩的人、一件难忘的事、一件物品。\n\n**Day 6-7: Part 3 深度讨论**\n- 重点：逻辑连接词 (However, Furthermore) 和观点支撑。`;
        }
        
        if (lowerInput.includes("薛定谔")) {
            return `**薛定谔方程**是量子力学的基石，就像牛顿第二定律 ($F=ma$) 之于经典力学一样重要。\n\n它描述了微观粒子（如电子）的状态如何随时间演化。简单来说，它告诉我们，粒子不再被看作是一个确定的点，而是一个**波函数 ($\psi$)**。这个波函数的模的平方，代表了在某处找到该粒子的**概率**。`;
        }
        
        return "这是一个非常有深度的问题。作为你的 AI 家教，我可以帮你从概念定义、实际应用或解题思路三个方面来分析。\n\n你想先了解哪个方面呢？";
    }

    // GLM API 调用函数
    async function callGLMAPI(message) {
        try {
            // API 配置
            const apiKey = '3b9469fa776644e0aff8d2cc0807ee19.DONNWpkITAi5Jg71';
            const baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
            const model = 'glm-4.5';
            
            // 构建请求消息
            const messages = [
                {
                    role: 'system',
                    content: `请使用KaTeX语法来表示所有数学公式。具体要求：
1. 行内公式使用 $...$ 格式
2. 块级公式使用 $$...$$ 格式
3. 复杂公式可以使用 \`\`\`math...\`\`\` 代码块格式
4. 确保所有数学符号、公式、方程式都使用正确的KaTeX语法

例如：
- 行内公式：爱因斯坦的质能方程 $E = mc^2$
- 块级公式：
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
- 数学代码块：
\`\`\`math
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\`\`\``
                },
                { role: 'user', content: message }
            ];
            
            // 发送流式请求
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: 1500,
                    temperature: 0.7,
                    stream: true
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 移除思考指示器
            removeTypingIndicator();
            
            // 创建 AI 消息容器
            const aiMessageElement = createStreamingMessage();
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            
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
                                accumulatedContent += content;
                                updateStreamingMessage(aiMessageElement, accumulatedContent);
                            }
                        } catch (e) {
                            console.warn('解析流式数据失败:', e);
                        }
                    }
                }
            }
            
            // 流式响应完成后，保存完整的AI消息到当前对话
            if (accumulatedContent.trim()) {
                currentMessages.push({
                    content: accumulatedContent,
                    sender: 'ai',
                    timestamp: Date.now()
                });
                
                // AI回复完成后，自动生成AI标题并更新
                updateChatTitleWithAI();
            }
            
        } catch (error) {
            console.error('GLM API 调用失败:', error);
            removeTypingIndicator();
            addMessage('抱歉，AI 服务暂时不可用，请稍后再试。', 'ai');
        }
    }
    
    // 创建流式消息元素
    function createStreamingMessage() {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'ai');
        
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        avatarDiv.innerHTML = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;"><path d="M12 2L9.19 8.63 2.56 11.44 9.19 14.25 12 20.88 14.81 14.25 21.44 11.44 14.81 8.63z" /></svg>';
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.innerHTML = '<div class="streaming-content"></div>';
        
        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(contentDiv);
        
        messageList.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
        
        return contentDiv.querySelector('.streaming-content');
    }
    
    // 更新流式消息内容
    function updateStreamingMessage(element, content) {
        if (!element) return;
        
        try {
            // 使用 GLMRenderer 渲染内容（如果可用）
            if (typeof window.GLMRenderer !== 'undefined') {
                const renderer = new window.GLMRenderer();
                const renderedContent = renderer.renderContent(content, true);
                element.innerHTML = renderedContent;
            } else {
                // 降级到简单的文本渲染
                element.innerHTML = content.replace(/\n/g, '<br>');
            }
            
            // 自动滚动到底部
            chatArea.scrollTop = chatArea.scrollHeight;
        } catch (error) {
            console.error('更新流式消息失败:', error);
            element.textContent = content;
        }
    }
    
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
    if (menuBurger) {
        menuBurger.addEventListener('click', (e) => {
            openBlankSidebar();
        });
    }
    
    // 打开覆盖层菜单
    function openMenuOverlay() {
        menuOverlay.classList.add('open');
        menuBackdrop.classList.add('open');
        // 同步历史记录到覆盖层
        syncHistoryToOverlay();
    }
    
    // 关闭覆盖层菜单
    function closeMenuOverlay() {
        menuOverlay.classList.remove('open');
        menuBackdrop.classList.remove('open');
    }
    
    // 遮罩层点击关闭菜单
    menuBackdrop.addEventListener('click', closeMenuOverlay);
    
    // 覆盖层菜单按钮关闭菜单
    overlayMenuBurger.addEventListener('click', closeMenuOverlay);
    
    // 新侧边栏关闭按钮事件
    blankSidebarClose.addEventListener('click', closeBlankSidebar);
    
    // 新侧边栏遮罩层点击关闭
    blankSidebarBackdrop.addEventListener('click', closeBlankSidebar);
    
    // 知识库按钮点击事件
    if (knowledgeBaseBtn) {
        knowledgeBaseBtn.addEventListener('click', () => {
            console.log('知识库按钮被点击');
            // 跳转到知识库页面（当前标签页）
            window.location.href = 'pages/base/base.html';
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
    
    // AI对话按钮点击事件
    if (aiChatBtn) {
        aiChatBtn.addEventListener('click', () => {
            console.log('AI对话按钮被点击');
            // 关闭空白侧边栏并返回主聊天界面
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
    
    // 同步历史记录到覆盖层
    function syncHistoryToOverlay() {
        overlayHistoryList.innerHTML = historyList.innerHTML;
        
        // 为覆盖层中的历史记录添加事件监听器
        overlayHistoryList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const chatId = item.dataset.chatId;
                await loadChat(chatId);
                closeMenuOverlay();
            });
        });
        
        // 为覆盖层中的删除按钮添加事件监听器
        overlayHistoryList.querySelectorAll('.history-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const chatId = btn.dataset.chatId;
                deleteChat(chatId);
                syncHistoryToOverlay(); // 重新同步
            });
        });
    }
    
    
    // 初始化历史记录列表
    renderHistoryList();
    
    // 初始化时同步历史记录到覆盖层
    syncHistoryToOverlay();
    
    // 覆盖层新建对话按钮
    overlayNewChatBtn.addEventListener('click', async () => {
        // 如果有当前对话且有消息，先保存
        if (currentMessages.length > 0) {
            await saveCurrentChat();
        }
        
        // 清空现有消息
        currentChatId = null;
        currentMessages = [];
        messageList.innerHTML = '';
        messageList.style.display = 'none';
        // 显示欢迎页
        welcomeScreen.style.display = 'flex';
        // 清空输入
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        updateHistoryActiveState();
        closeMenuOverlay();
    });
    
    // 页面关闭前自动保存当前对话
    window.addEventListener('beforeunload', async () => {
        if (currentMessages.length > 0) {
            // 使用同步方式保存，避免页面关闭时异步请求失败
            const title = HistoryManager.generateTitle(currentMessages);
            if (currentChatId) {
                HistoryManager.deleteChat(currentChatId);
            }
            HistoryManager.saveChat(title, currentMessages);
        }
    });
});