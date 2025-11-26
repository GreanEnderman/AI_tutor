// GLM4.5 AI家教应用 - 工具函数模块

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
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

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * HTML转义函数
 * @param {string} text 要转义的文本
 * @returns {string} 转义后的HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * HTML实体解码函数
 * @param {string} text 要解码的文本
 * @returns {string} 解码后的文本
 */
function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

/**
 * 生成随机ID
 * @param {string} prefix ID前缀
 * @returns {string} 随机ID
 */
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

/**
 * 格式化时间戳
 * @param {Date|string|number} timestamp 时间戳
 * @returns {string} 格式化后的时间字符串
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 格式化时间为时分
 * @param {Date|string|number} timestamp 时间戳
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 安全的JSON解析
 * @param {string} jsonString JSON字符串
 * @param {any} defaultValue 默认值
 * @returns {any} 解析结果或默认值
 */
function safeJsonParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON解析失败:', error);
        return defaultValue;
    }
}

/**
 * 安全的JSON字符串化
 * @param {any} obj 要字符串化的对象
 * @param {string} defaultValue 默认值
 * @returns {string} JSON字符串或默认值
 */
function safeJsonStringify(obj, defaultValue = '{}') {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.warn('JSON字符串化失败:', error);
        return defaultValue;
    }
}

/**
 * 检查是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 获取系统提示 - 统一管理数学公式渲染要求
 * @returns {string} 系统提示字符串
 */
function getSystemPrompt() {
    const backtick3 = '```';
    return `请使用KaTeX语法来表示所有数学公式。具体要求：
1. 行内公式使用 $...$ 格式
2. 块级公式使用 $$...$$ 格式
3. 复杂公式可以使用 ${backtick3}math...${backtick3} 代码块格式
4. 确保所有数学符号、公式、方程式都使用正确的KaTeX语法

例如：
- 行内公式：爱因斯坦的质能方程 $E = mc^2$
- 块级公式：
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
- 数学代码块：
${backtick3}math
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
${backtick3}`;
}

/**
 * KaTeX渲染选项配置
 */
const KATEX_OPTIONS = {
    displayMode: true,
    throwOnError: false,
    errorColor: '#dc2626',
    strict: false,
    trust: false,
    macros: {
        "\\RR": "\\mathbb{R}",
        "\\NN": "\\mathbb{N}",
        "\\ZZ": "\\mathbb{Z}",
        "\\QQ": "\\mathbb{Q}",
        "\\CC": "\\mathbb{C}"
    }
};

/**
 * Marked配置选项
 */
const MARKED_OPTIONS = {
    breaks: true,
    gfm: true,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    renderer: new marked.Renderer()
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = {
        debounce,
        throttle,
        escapeHtml,
        decodeHtmlEntities,
        generateId,
        deepClone,
        formatTimestamp,
        formatTime,
        safeJsonParse,
        safeJsonStringify,
        isMobileDevice,
        getSystemPrompt,
        KATEX_OPTIONS,
        MARKED_OPTIONS
    };
} else {
    // 浏览器环境 - 挂载到全局对象
    window.GLMUtils = {
        debounce,
        throttle,
        escapeHtml,
        decodeHtmlEntities,
        generateId,
        deepClone,
        formatTimestamp,
        formatTime,
        safeJsonParse,
        safeJsonStringify,
        isMobileDevice,
        getSystemPrompt,
        KATEX_OPTIONS,
        MARKED_OPTIONS
    };
}