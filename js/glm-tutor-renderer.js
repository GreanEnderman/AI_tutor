// GLM4.5 AI家教应用 - 渲染引擎模块

/**
 * 渲染引擎类
 */
class GLMRenderer {
    constructor() {
        this.initMarked();
        // 数学公式渲染缓存
        this.mathCache = new Map();
        this.maxCacheSize = 1000; // 最大缓存数量
        this.renderCount = 0; // 渲染计数器

        // 语法高亮相关属性
        this.codeHighlightCache = new Map(); // 语法高亮缓存
        this.prismAvailable = this.checkPrismAvailability(); // 检查Prism.js可用性
        this.simpleHighlighterAvailable = this.checkSimpleHighlighterAvailability(); // 检查简单高亮器
        this.initCodeHighlighting();
    }

    /**
     * 初始化Marked配置
     */
    initMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions(window.GLMUtils.MARKED_OPTIONS);
        }
    }

    /**
     * 主要渲染函数
     * @param {string} content 要渲染的内容
     * @param {boolean} isStreaming 是否为流式渲染
     * @returns {string} 渲染后的HTML
     */
    renderContent(content, isStreaming = false) {
        try {
            // 减少日志输出，提高性能
            // console.log('开始渲染内容，流式模式:', isStreaming);
            
            let processedContent = content;
            
            if (isStreaming) {
                // 流式模式：检查是否有不完整的数学公式
                const blockMathStarts = (content.match(/\$\$/g) || []).length;
                const hasIncompleteBlockMath = blockMathStarts % 2 !== 0;
                const inlineMathMatches = content.match(/\$/g) || [];
                const hasIncompleteInlineMath = inlineMathMatches.length % 2 !== 0;
                
                if (hasIncompleteBlockMath || hasIncompleteInlineMath) {
                    // console.log('发现不完整的数学公式，跳过渲染');
                    return this.fallbackRender(content);
                }
            }
            
            // console.log('预处理完成，开始Markdown解析');
            
            // 直接渲染 Markdown
            let formattedContent = marked.parse(processedContent);
            
            // console.log('Markdown解析完成，开始渲染数学公式');
            
            // 使用缓存的数学公式渲染
            formattedContent = this.renderAllMathFormulasWithCache(formattedContent);

            // 应用语法高亮
            if (this.prismAvailable) {
                formattedContent = this.applySyntaxHighlighting(formattedContent, isStreaming);
            }

            // console.log('渲染完成');
            return formattedContent;
            
        } catch (error) {
            console.error('渲染引擎错误:', error);
            return this.fallbackRender(content);
        }
    }

    /**
     * 降级渲染函数
     * @param {string} content 要渲染的内容
     * @returns {string} 降级渲染的HTML
     */
    fallbackRender(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
                const escapedFormula = window.GLMUtils.escapeHtml(formula);
                return `<div class="math-code-block">${escapedFormula}</div>`;
            })
            .replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
                const escapedFormula = window.GLMUtils.escapeHtml(formula);
                return `<span class="math-formula">${escapedFormula}</span>`;
            });
    }

    /**
     * 智能Markdown预处理
     * @param {string} content 要预处理的内容
     * @returns {string} 预处理后的内容
     */
    /**
     * 简化的Markdown预处理
     * @param {string} content 要预处理的内容
     * @returns {string} 预处理后的内容
     */
    smartPreprocessMarkdown(content) {
        try {
            console.log('开始智能Markdown预处理');
            
            // 只处理基本的格式问题
            let processedContent = this.fixBasicFormatting(content);
            
            console.log('智能Markdown预处理完成');
            return processedContent;
            
        } catch (error) {
            console.error('智能Markdown预处理失败:', error);
            return content; // 返回原内容
        }
    }

    /**
     * 修复基本格式问题
     * @param {string} content 要修复的内容
     * @returns {string} 修复后的内容
     */
    fixBasicFormatting(content) {
        let processedContent = content;
        
        // 修复常见的格式问题
        // 1. 确保标题前后有空行
        processedContent = processedContent.replace(/([^\n])\n(#{1,6}\s+)/g, '$1\n\n$2');
        processedContent = processedContent.replace(/(#{1,6}\s+[^\n]*?)\n([^\n#])/g, '$1\n\n$2');
        
        // 2. 修复列表格式
        processedContent = processedContent.replace(/([^\n])\n(\s*[-*+]\s+)/g, '$1\n\n$2');
        processedContent = processedContent.replace(/([^\n])\n(\s*\d+\.\s+)/g, '$1\n\n$2');
        
        // 4. 修复数学公式格式
        processedContent = processedContent.replace(/([^\n])\n(\$\$)/g, '$1\n\n$2');
        processedContent = processedContent.replace(/(\$\$)\n([^\n])/g, '$1\n\n$2');
        
        // 5. 移除过多的空行
        processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
        
        return processedContent;
    }




    /**
     * 渲染所有数学公式格式
     * @param {string} content 要渲染的内容
     * @returns {string} 渲染后的内容
     */
    // 带缓存的数学公式渲染
    renderAllMathFormulasWithCache(content) {
        if (typeof katex === 'undefined') {
            console.error('KaTeX 未加载，无法渲染数学公式');
            return content;
        }
        
        // 1. 首先处理 ```math...``` 代码块
        content = content.replace(/```math\s*\n([\s\S]*?)\n```/g, (match, formula) => {
            const trimmedFormula = formula.trim();
            const cacheKey = `math_block_${trimmedFormula}`;
            
            if (this.mathCache.has(cacheKey)) {
                return this.mathCache.get(cacheKey);
            }
            
            try {
                const decodedFormula = window.GLMUtils.decodeHtmlEntities(trimmedFormula);
                const html = katex.renderToString(decodedFormula, {
                    ...window.GLMUtils.KATEX_OPTIONS,
                    displayMode: true
                });
                const result = `<div class="math-code-block">${html}</div>`;
                
                // 缓存结果
                this.addToMathCache(cacheKey, result);
                return result;
            } catch (error) {
                console.error('数学代码块渲染失败:', error);
                const result = `<div class="math-code-block">${window.GLMUtils.escapeHtml(trimmedFormula)}</div>`;
                this.addToMathCache(cacheKey, result);
                return result;
            }
        });
        
        // 2. 处理块级数学公式 $$...$$
        content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
            const trimmedFormula = formula.trim();
            const cacheKey = `block_${trimmedFormula}`;
            
            if (this.mathCache.has(cacheKey)) {
                return this.mathCache.get(cacheKey);
            }
            
            try {
                const decodedFormula = window.GLMUtils.decodeHtmlEntities(trimmedFormula);
                const html = katex.renderToString(decodedFormula, {
                    ...window.GLMUtils.KATEX_OPTIONS,
                    displayMode: true
                });
                
                // 缓存结果
                this.addToMathCache(cacheKey, html);
                return html;
            } catch (error) {
                console.error('块级数学公式渲染失败:', error);
                const result = `<span class="math-formula">${window.GLMUtils.escapeHtml(trimmedFormula)}</span>`;
                this.addToMathCache(cacheKey, result);
                return result;
            }
        });
        
        // 3. 处理行内数学公式 $...$
        content = content.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match, formula) => {
            const trimmedFormula = formula.trim();
            const cacheKey = `inline_${trimmedFormula}`;
            
            if (this.mathCache.has(cacheKey)) {
                return this.mathCache.get(cacheKey);
            }
            
            try {
                const decodedFormula = window.GLMUtils.decodeHtmlEntities(trimmedFormula);
                const html = katex.renderToString(decodedFormula, {
                    ...window.GLMUtils.KATEX_OPTIONS,
                    displayMode: false
                });
                
                // 缓存结果
                this.addToMathCache(cacheKey, html);
                return html;
            } catch (error) {
                console.error('行内数学公式渲染失败:', error);
                const result = `<span class="math-formula">${window.GLMUtils.escapeHtml(trimmedFormula)}</span>`;
                this.addToMathCache(cacheKey, result);
                return result;
            }
        });
        
        return content;
    }
    
    // 添加到数学公式缓存
    addToMathCache(key, value) {
        // 如果缓存过大，清理最旧的条目
        if (this.mathCache.size >= this.maxCacheSize) {
            const firstKey = this.mathCache.keys().next().value;
            this.mathCache.delete(firstKey);
        }
        
        this.mathCache.set(key, value);
        this.renderCount++;
        
        // 每100次渲染后清理一次缓存
        if (this.renderCount % 100 === 0) {
            this.cleanupMathCache();
        }
    }
    
    // 清理数学公式缓存
    cleanupMathCache() {
        // 如果缓存过大，删除最旧的一半
        if (this.mathCache.size > this.maxCacheSize / 2) {
            const keys = Array.from(this.mathCache.keys());
            const toDelete = keys.slice(0, Math.floor(this.maxCacheSize / 2));
            toDelete.forEach(key => this.mathCache.delete(key));
        }
    }
    
    // 清空所有缓存
    clearCache() {
        this.mathCache.clear();
        this.renderCount = 0;
    }

    /**
     * 优化的数学公式渲染
     * @param {string} content 要渲染的内容
     * @returns {string} 渲染后的内容
     */
    renderMathFormulas(content) {
        console.log('开始渲染数学公式，KaTeX可用性:', typeof katex !== 'undefined');
        
        if (typeof katex === 'undefined') {
            console.error('KaTeX 未加载，无法渲染数学公式');
            return content;
        }
        
        // 处理流式渲染中待处理的数学公式（不渲染，保持原样）
        content = content.replace(/<!--MATH_BLOCK_PENDING_([a-zA-Z0-9+/=]+)-->/g, (match, encoded) => {
            const formula = atob(encoded);
            console.log('发现待处理的数学公式（保持原样）:', formula);
            // 在流式渲染过程中，保持数学公式原样，不进行渲染
            return `<span class="math-pending">${formula}</span>`;
        });
        
        console.log('数学公式渲染完成');
        return content;
    }


    /**
     * 后处理DOM元素，处理数学公式
     * @param {HTMLElement} element 要后处理的元素
     */
    postProcessContent(element) {
        try {
            // 处理数学公式
            if (typeof katex !== 'undefined') {
                const mathElements = element.querySelectorAll('.katex-error');
                mathElements.forEach(mathElement => {
                    try {
                        const formula = mathElement.textContent;
                        if (formula && formula.includes('数学公式错误:')) {
                            const actualFormula = formula.replace('数学公式错误: ', '');
                            const html = katex.renderToString(actualFormula, {
                                displayMode: mathElement.parentElement.classList.contains('katex-display'),
                                throwOnError: false,
                                errorColor: '#dc2626'
                            });
                            mathElement.parentElement.innerHTML = html;
                        }
                    } catch (e) {
                        console.warn('数学公式重新渲染失败:', e);
                        // 静默处理，不显示错误信息
                    }
                });
            }
            
        } catch (error) {
            console.error('后处理内容错误:', error);
        }
    }

    // ==================== 语法高亮功能 ====================

    /**
     * 检查Prism.js可用性
     * @returns {boolean} Prism.js是否可用
     */
    checkPrismAvailability() {
        try {
            return typeof Prism !== 'undefined' && typeof Prism.highlightElement === 'function';
        } catch (error) {
            console.warn('Prism.js not available:', error);
            return false;
        }
    }

    /**
     * 检查简单高亮器可用性
     * @returns {boolean} SimpleHighlighter是否可用
     */
    checkSimpleHighlighterAvailability() {
        try {
            return typeof SimpleHighlighter !== 'undefined' && typeof SimpleHighlighter.highlight === 'function';
        } catch (error) {
            console.warn('SimpleHighlighter not available:', error);
            return false;
        }
    }

    /**
     * 初始化语法高亮
     */
    initCodeHighlighting() {
        if (!this.prismAvailable) {
            console.warn('Prism.js not available, syntax highlighting disabled');
            return;
        }

        // 配置Prism.js选项
        if (typeof Prism !== 'undefined') {
            Prism.manual = true; // 手动控制高亮
        }

        console.log('Syntax highlighting initialized');
    }

    /**
     * 应用语法高亮
     * @param {string} html HTML内容
     * @param {boolean} isStreaming 是否为流式渲染
     * @returns {string} 应用高亮后的HTML
     */
    applySyntaxHighlighting(html, isStreaming = false) {
        try {
            // 创建临时DOM元素来解析HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // 查找所有代码块
            const codeBlocks = tempDiv.querySelectorAll('pre code, code[class*="language-"]');

            codeBlocks.forEach(codeElement => {
                const preElement = codeElement.parentElement;
                if (preElement && preElement.tagName === 'PRE') {
                    this.highlightCodeBlock(preElement, codeElement, isStreaming);
                }
            });

            return tempDiv.innerHTML;
        } catch (error) {
            console.error('Syntax highlighting error:', error);
            return html; // 返回原始HTML
        }
    }

    /**
     * 高亮代码块
     * @param {HTMLElement} preElement PRE元素
     * @param {HTMLElement} codeElement CODE元素
     * @param {boolean} isStreaming 是否为流式渲染
     */
    highlightCodeBlock(preElement, codeElement, isStreaming = false) {
        try {
            // 检查是否已经高亮过
            if (codeElement.classList.contains('highlighted')) {
                return;
            }

            // 获取代码内容
            const code = codeElement.textContent || codeElement.innerText;
            if (!code.trim()) {
                return;
            }

            // 创建缓存键
            const cacheKey = `${code}_${this.getLanguage(codeElement)}_${isStreaming}`;

            // 检查缓存
            if (this.codeHighlightCache.has(cacheKey)) {
                const cachedResult = this.codeHighlightCache.get(cacheKey);
                this.applyCachedHighlighting(preElement, codeElement, cachedResult);
                return;
            }

            // 流式渲染时，等待代码完整再高亮
            if (isStreaming && this.isIncompleteCode(code)) {
                // 标记为待高亮
                codeElement.classList.add('pending-highlight');
                return;
            }

            // 检测语言
            const language = this.detectLanguage(codeElement);

            // 设置语言类 - 即使是none也要设置，以便应用基础样式
            const languageClass = language === 'none' ? 'language-none' : 'language-' + language;
            codeElement.classList.add(languageClass);
            preElement.classList.add(languageClass);

            // 应用高亮
            let highlightedCode = code;
            let resultLanguage = language === 'none' ? 'plain' : language;

            try {
                if (this.prismAvailable && typeof Prism !== 'undefined') {
                    // 优先使用Prism.js
                    const prismLanguage = Prism.languages[language] || Prism.languages.plaintext;
                    highlightedCode = Prism.highlight(code, prismLanguage, language);
                    console.log(`Used Prism.js for language: ${language}`);
                } else if (this.simpleHighlighterAvailable && typeof SimpleHighlighter !== 'undefined') {
                    // 降级到简单高亮器
                    const simpleLanguage = language === 'none' ? SimpleHighlighter.detectLanguage(code) : language;
                    highlightedCode = SimpleHighlighter.highlight(code, simpleLanguage);
                    resultLanguage = simpleLanguage;
                    console.log(`Used SimpleHighlighter for language: ${simpleLanguage}`);
                }
            } catch (error) {
                console.warn('Syntax highlighting failed, using plain text:', error);
                highlightedCode = this.escapeHtml(code);
            }

            // 创建结果对象
            const result = {
                language: resultLanguage,
                highlightedCode: highlightedCode,
                hasLanguageLabel: language && language !== 'none',
                languageClass: languageClass
            };

            // 缓存结果
            this.cacheHighlighting(cacheKey, result);

            // 应用高亮结果
            this.applyHighlighting(preElement, codeElement, result);

        } catch (error) {
            console.error('Code block highlighting error:', error);
        }
    }

    /**
     * 获取代码语言
     * @param {HTMLElement} codeElement 代码元素
     * @returns {string} 语言名称
     */
    getLanguage(codeElement) {
        // 从class属性中提取语言
        const classList = codeElement.className;
        const match = classList.match(/language-(\w+)/);
        if (match) {
            return match[1];
        }

        // 检查父元素PRE的class
        const preElement = codeElement.parentElement;
        if (preElement && preElement.tagName === 'PRE') {
            const preMatch = preElement.className.match(/language-(\w+)/);
            if (preMatch) {
                return preMatch[1];
            }
        }

        return 'none';
    }

    /**
     * 检测代码语言
     * @param {HTMLElement} codeElement 代码元素
     * @returns {string} 检测到的语言
     */
    detectLanguage(codeElement) {
        // 首先尝试从class中获取
        const language = this.getLanguage(codeElement);
        if (language !== 'none') {
            return language;
        }

        // 简单的语言检测逻辑
        const code = codeElement.textContent || codeElement.innerText;

        // JavaScript检测
        if (/function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|=>\s*{|import\s+.*from|export\s+/i.test(code)) {
            return 'javascript';
        }

        // Python检测
        if (/def\s+\w+\(|class\s+\w+|import\s+\w+|from\s+\w+\s+import|print\s*\(|if\s+__name__\s*==/i.test(code)) {
            return 'python';
        }

        // Java检测
        if (/public\s+class\s+\w+|private\s+\w+|public\s+static\s+void\s+main|System\.out\.println/i.test(code)) {
            return 'java';
        }

        // HTML检测
        if (/<!DOCTYPE|<html|<head|<body|<div|<p>|<span|<script/i.test(code)) {
            return 'markup';
        }

        // CSS检测
        if (/[a-zA-Z-]+\s*:\s*[^;]+;|\.[a-zA-Z-]+\s*\{|#[a-zA-Z-]+\s*\{/i.test(code)) {
            return 'css';
        }

        return 'none';
    }

    /**
     * 检查代码是否不完整（用于流式渲染）
     * @param {string} code 代码内容
     * @returns {boolean} 是否不完整
     */
    isIncompleteCode(code) {
        // 简单的完整性检查
        const lines = code.split('\n');
        const lastLine = lines[lines.length - 1].trim();

        // 检查未闭合的括号、引号等
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        const openBrackets = (code.match(/\[/g) || []).length;
        const closeBrackets = (code.match(/\]/g) || []).length;

        return openBraces !== closeBraces ||
               openParens !== closeParens ||
               openBrackets !== closeBrackets ||
               lastLine.endsWith('.') ||
               lastLine.endsWith(',') ||
               lastLine.endsWith(';') && code.length > 100;
    }

    /**
     * 缓存高亮结果
     * @param {string} cacheKey 缓存键
     * @param {Object} result 高亮结果
     */
    cacheHighlighting(cacheKey, result) {
        // 限制缓存大小
        if (this.codeHighlightCache.size >= this.maxCacheSize) {
            // 删除最旧的缓存项
            const firstKey = this.codeHighlightCache.keys().next().value;
            this.codeHighlightCache.delete(firstKey);
        }

        this.codeHighlightCache.set(cacheKey, result);
    }

    /**
     * 应用高亮
     * @param {HTMLElement} preElement PRE元素
     * @param {HTMLElement} codeElement CODE元素
     * @param {Object} result 高亮结果
     */
    applyHighlighting(preElement, codeElement, result) {
        try {
            // 设置高亮后的代码
            codeElement.innerHTML = result.highlightedCode;
            codeElement.classList.add('highlighted');

            // 包装在容器中以支持UI功能
            const container = document.createElement('div');
            container.className = 'code-block-container';

            // 将PRE元素移动到容器中
            preElement.parentNode.insertBefore(container, preElement);
            container.appendChild(preElement);

            // 添加语言标签
            if (result.hasLanguageLabel) {
                this.addLanguageLabel(container, result.language);
            }

            // 添加复制按钮
            this.addCopyButton(container, codeElement);

        } catch (error) {
            console.error('Apply highlighting error:', error);
        }
    }

    /**
     * 应用缓存的高亮结果
     * @param {HTMLElement} preElement PRE元素
     * @param {HTMLElement} codeElement CODE元素
     * @param {Object} result 缓存的结果
     */
    applyCachedHighlighting(preElement, codeElement, result) {
        codeElement.innerHTML = result.highlightedCode;
        codeElement.classList.add('highlighted');

        // 重新应用UI增强功能
        const container = preElement.parentElement;
        if (container && container.classList.contains('code-block-container')) {
            this.addLanguageLabel(container, result.language);
            this.addCopyButton(container, codeElement);
        }
    }

    /**
     * 添加语言标签
     * @param {HTMLElement} container 代码块容器
     * @param {string} language 语言名称
     */
    addLanguageLabel(container, language) {
        try {
            // 检查是否已有语言标签
            const existingLabel = container.querySelector('.code-language-label');
            if (existingLabel) {
                return;
            }

            const label = document.createElement('div');
            label.className = 'code-language-label';
            label.textContent = language.toUpperCase();
            container.appendChild(label);
        } catch (error) {
            console.error('Add language label error:', error);
        }
    }

    /**
     * 添加复制按钮
     * @param {HTMLElement} container 代码块容器
     * @param {HTMLElement} codeElement 代码元素
     */
    addCopyButton(container, codeElement) {
        try {
            // 检查是否已有复制按钮
            const existingButton = container.querySelector('.code-copy-button');
            if (existingButton) {
                return;
            }

            const button = document.createElement('button');
            button.className = 'code-copy-button';
            button.textContent = '复制';
            button.title = '复制代码';

            // 添加复制功能
            button.addEventListener('click', () => {
                this.copyCodeToClipboard(codeElement, button);
            });

            container.appendChild(button);
        } catch (error) {
            console.error('Add copy button error:', error);
        }
    }

    /**
     * 复制代码到剪贴板
     * @param {HTMLElement} codeElement 代码元素
     * @param {HTMLElement} button 复制按钮
     */
    async copyCodeToClipboard(codeElement, button) {
        try {
            const code = codeElement.textContent || codeElement.innerText;

            // 使用现代的Clipboard API
            await navigator.clipboard.writeText(code);

            // 显示复制成功提示
            this.showCopyTooltip(button, '已复制!');

        } catch (error) {
            console.error('Copy to clipboard error:', error);

            // 降级方法
            try {
                const textArea = document.createElement('textarea');
                textArea.value = codeElement.textContent || codeElement.innerText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                this.showCopyTooltip(button, '已复制!');
            } catch (fallbackError) {
                console.error('Fallback copy error:', fallbackError);
                this.showCopyTooltip(button, '复制失败');
            }
        }
    }

    /**
     * 显示复制提示
     * @param {HTMLElement} button 复制按钮
     * @param {string} message 提示消息
     */
    showCopyTooltip(button, message) {
        try {
            // 检查是否已有提示
            const existingTooltip = button.parentElement.querySelector('.code-copy-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'code-copy-tooltip';
            tooltip.textContent = message;

            button.parentElement.appendChild(tooltip);

            // 显示提示
            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);

            // 3秒后隐藏提示
            setTimeout(() => {
                tooltip.classList.remove('show');
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 300);
            }, 2000);

        } catch (error) {
            console.error('Show tooltip error:', error);
        }
    }

    /**
     * 后处理内容，处理待高亮的代码块
     * @param {HTMLElement} element DOM元素
     */
    postProcessContent(element) {
        if (!this.prismAvailable) {
            return;
        }

        try {
            // 查找待高亮的代码块
            const pendingBlocks = element.querySelectorAll('code.pending-highlight');

            pendingBlocks.forEach(codeElement => {
                const preElement = codeElement.parentElement;
                if (preElement && preElement.tagName === 'PRE') {
                    // 移除待高亮标记
                    codeElement.classList.remove('pending-highlight');

                    // 应用高亮
                    this.highlightCodeBlock(preElement, codeElement, false);
                }
            });

        } catch (error) {
            console.error('Post-process content error:', error);
        }
    }

    /**
     * 清理语法高亮缓存
     */
    cleanupHighlightCache() {
        this.codeHighlightCache.clear();
        console.log('Syntax highlighting cache cleared');
    }

    /**
     * HTML转义工具函数
     * @param {string} text 要转义的文本
     * @returns {string} 转义后的HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        return {
            mathCacheSize: this.mathCache.size,
            highlightCacheSize: this.codeHighlightCache.size,
            maxCacheSize: this.maxCacheSize
        };
    }
}

// 导出渲染引擎
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = GLMRenderer;
} else {
    // 浏览器环境 - 挂载到全局对象
    window.GLMRenderer = GLMRenderer;
}