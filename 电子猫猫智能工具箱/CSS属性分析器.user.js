// ==UserScript==
// @name         CSS属性分析器
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      2.1.0
// @description  分析页面中的CSS属性，转换为中文解释，并提供可视化编辑界面
// @author       苏子言
// @match        *://*.meimoai10.com/*
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai*.com/*
// @match        *://*.meimodao.*/*
// @match        *://*.meimodao.com/*
// @match        *://*.meimoai8.com/*
// @match        *://*.meimoai7.com/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 全局配置
    let config = {
        // 是否启用高级模式（分析所有CSS）
        advancedMode: false
    };

    // 页面加载时自动加载保存的CSS属性
    // 这样即使刷新网页，保存的样式也会立即生效，不需要先打开分析器界面
    loadCSSChanges();

    // CSS属性中文对照表
    const cssPropertyMap = {
        // 背景相关
        'background': '背景',
        'background-color': '背景色',
        'background-image': '背景图片',
        'background-repeat': '背景重复',
        'background-position': '背景位置',
        'background-size': '背景大小',
        'background-attachment': '背景固定',
        
        // 边框相关
        'border': '边框',
        'border-width': '边框宽度',
        'border-style': '边框样式',
        'border-color': '边框颜色',
        'border-top': '上边框',
        'border-right': '右边框',
        'border-bottom': '下边框',
        'border-left': '左边框'，
        'border-radius': '边框圆角',
        'border-top-left-radius': '左上圆角',
        'border-top-right-radius': '右上圆角'，
        'border-bottom-right-radius': '右下圆角',
        'border-bottom-left-radius': '左下圆角',
        
        // 边距相关
        'margin': '外边距',
        'margin-top': '上外边距',
        'margin-right': '右外边距',
        'margin-bottom': '下外边距',
        'margin-left': '左外边距',
        'padding': '内边距',
        'padding-top': '上内边距',
        'padding-right': '右内边距',
        'padding-bottom': '下内边距',
        'padding-left': '左内边距',
        
        // 尺寸相关
        'width': '宽度',
        'height': '高度',
        'min-width': '最小宽度'，
        'max-width': '最大宽度',
        'min-height': '最小高度',
        'max-height': '最大高度',
        
        // 定位相关
        'position': '定位方式',
        'top': '上定位',
        'right': '右定位',
        'bottom': '下定位',
        'left': '左定位',
        'z-index': '层级',
        'display': '显示方式',
        'float': '浮动',
        'clear': '清除浮动',
        'visibility': '可见性',
        
        // 文本相关
        'color': '文字颜色',
        'font': '字体',
        'font-family': '字体系列',
        'font-size': '字体大小',
        'font-weight': '字体粗细',
        'font-style': '字体样式',
        'text-align': '文本对齐',
        'text-decoration': '文本装饰',
        'text-transform': '文本转换',
        'text-indent': '文本缩进',
        'line-height': '行高',
        'letter-spacing': '字间距',
        'word-spacing': '词间距',
        
        // 列表相关
        'list-style': '列表样式',
        'list-style-type': '列表项类型',
        'list-style-image': '列表项图片',
        'list-style-position': '列表项位置',
        
        // 其他常用属性
        'cursor': '鼠标指针',
        'opacity': '透明度',
        'overflow': '溢出处理',
        'overflow-x': '水平溢出',
        'overflow-y': '垂直溢出',
        'box-shadow': '盒子阴影',
        'text-shadow': '文字阴影',
        'transform': '变换',
        'transition': '过渡',
        'animation': '动画'
    };

    // 边框样式中文对照表
    const borderStyleMap = {
        'none': '无',
        'hidden': '隐藏',
        'dotted': '点线',
        'dashed': '虚线',
        'solid': '实线',
        'double': '双线',
        'groove': '凹槽',
        'ridge': '凸槽',
        'inset': '内凹',
        'outset': '外凸'
    };

    // 定位方式中文对照表
    const positionMap = {
        'static': '静态',
        'relative': '相对',
        'absolute': '绝对',
        'fixed': '固定',
        'sticky': '粘性'
    };

    // 显示方式中文对照表
    const displayMap = {
        'none': '无',
        'block': '块级',
        'inline': '行内',
        'inline-block': '行内块',
        'flex': '弹性盒',
        'grid': '网格',
        'table': '表格',
        'table-cell': '表格单元格'
    };

    // 解析CSS属性值
    function parseCSSValue(property, value) {
        if (property.includes('border') && !property.includes('radius') && !property.includes('color') && !property.includes('width') && !property.includes('style')) {
            // 解析复合边框属性
            const parts = value.split(/\s+/);
            let result = '';
            
            if (parts.length >= 1) {
                // 可能是宽度
                if (!isNaN(parseFloat(parts[0])) && parts[0].includes('px')) {
                    result += `粗细：${parts[0]}`;
                } else if (borderStyleMap[parts[0]]) {
                    result += `线型：${borderStyleMap[parts[0]]}`;
                } else {
                    result += `值：${parts[0]}`;
                }
            }
            
            if (parts.length >= 2) {
                if (result) result += '，';
                if (borderStyleMap[parts[1]]) {
                    result += `线型：${borderStyleMap[parts[1]]}`;
                } else if (parts[1].startsWith('#') || parts[1].includes('rgb') || parts[1].includes('hsl')) {
                    result += `颜色：${parts[1]}`;
                } else {
                    result += `值：${parts[1]}`;
                }
            }
            
            if (parts.length >= 3) {
                if (result) result += '，';
                if (parts[2].startsWith('#') || parts[2].includes('rgb') || parts[2].includes('hsl')) {
                    result += `颜色：${parts[2]}`;
                } else {
                    result += `值：${parts[2]}`;
                }
            }
            
            return result;
        } else if (property === 'position' && positionMap[value]) {
            return positionMap[value];
        } else if (property === 'display' && displayMap[value]) {
            return displayMap[value];
        } else if (property === 'border-style' && borderStyleMap[value]) {
            return borderStyleMap[value];
        }
        
        return value;
    }

    // 分析CSS规则
    function analyzeCSSRules(rules) {
        const result = [];
        
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            
            // 跳过@media规则
            if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaRules = analyzeCSSRules(rule.cssRules);
                result.push(...mediaRules);
                continue;
            }
            
            // 处理普通样式规则
            if (rule.type === CSSRule.STYLE_RULE) {
                const selector = rule.selectorText;
                const properties = [];
                
                for (let j = 0; j < rule.style.length; j++) {
                    const propName = rule.style[j];
                    const propValue = rule.style.getPropertyValue(propName);
                    const chineseName = cssPropertyMap[propName] || propName;
                    const parsedValue = parseCSSValue(propName, propValue);
                    
                    properties.push({
                        originalName: propName,
                        chineseName: chineseName,
                        value: propValue,
                        parsedValue: parsedValue
                    });
                }
                
                if (properties.length > 0) {
                    result.push({
                        selector: selector,
                        properties: properties
                    });
                }
            }
        }
        
        return result;
    }

    // 分析content left元素的计算样式
    function analyzeContentLeftElements(contentLeftElements) {
        const analyzedRules = [];
        const processedElements = new Set(); // 用于跟踪已处理的元素
        const processedSelectors = new Set(); // 用于跟踪已处理的选择器
        
        if (contentLeftElements.length > 0) {
            // 首先处理class="e"元素和style标签，并去除重复元素
            const priorityElements = [];
            const normalElements = [];
            
            // 去除重复元素
            contentLeftElements.forEach(element => {
                // 使用元素的唯一标识符来判断是否重复
                const elementKey = element.outerHTML?.slice(0, 100) || 
                                  element.tagName + 
                                  (element.id ? '#' + element.id : '') + 
                                  (element.className ? '.' + element.className.replace(/\s+/g, '.') : '');
                
                if (!processedElements.has(elementKey)) {
                    processedElements.add(elementKey);
                    
                    // 优先处理class="e"元素
                    if (element.classList && element.classList.contains('e')) {
                        priorityElements.push(element);
                    } 
                    // 其次处理style标签
                    else if (element.tagName && element.tagName.toLowerCase() === 'style') {
                        priorityElements.push(element);
                    }
                    // 最后处理其他元素
                    else {
                        normalElements.push(element);
                    }
                }
            });
            
            console.log(`CSS属性分析器: 去重后剩余 ${priorityElements.length + normalElements.length} 个元素（原 ${contentLeftElements.length} 个）`);
            
            // 合并元素列表，优先元素在前
            const sortedElements = [...priorityElements, ...normalElements];
            
            // 分析每个元素的样式
            sortedElements.forEach((element, index) => {
                // 特殊处理style标签
                if (element.tagName && element.tagName.toLowerCase() === 'style') {
                    try {
                        // 尝试提取style标签中的CSS规则
                        const styleContent = element.textContent || element.innerHTML;
                        const styleSelector = `<style>标签-${index}`;
                        
                        // 检查是否已处理过相同内容的style标签
                        const styleKey = styleContent.slice(0, 100); // 使用内容前100个字符作为key
                        if (!processedSelectors.has(styleKey)) {
                            processedSelectors.add(styleKey);
                            analyzedRules.push({
                                selector: styleSelector,
                                properties: [{
                                    originalName: 'style-content',
                                    chineseName: 'CSS内容',
                                    value: styleContent,
                                    parsedValue: '样式表内容'
                                }]
                            });
                        }
                    } catch (e) {
                        console.log('无法解析style标签内容:', e);
                    }
                    return; // 跳过style标签的计算样式分析
                }
                
                // 获取元素的计算样式
                const computedStyle = window.getComputedStyle(element);
                const properties = [];
                
                // 获取元素的类名和ID，用于更好的标识
                let elementIdentifier = '';
                if (element.id) {
                    elementIdentifier += `#${element.id}`;
                }
                if (element.className && typeof element.className === 'string') {
                    const classNames = element.className.split(' ').filter(c => c.trim() !== '');
                    if (classNames.length > 0) {
                        elementIdentifier += '.' + classNames.join('.');
                    }
                }
                if (!elementIdentifier) {
                    elementIdentifier = element.tagName ? element.tagName.toLowerCase() : `元素-${index}`;
                }
                
                // 仅获取常用的CSS属性以提高性能
                const commonProperties = [
                    // 背景相关
                    'background', 'background-color', 'background-image', 'background-repeat', 'background-position', 'background-size',
                    // 文本相关
                    'color', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-align', 'text-decoration',
                    'text-transform', 'text-indent', 'line-height', 'letter-spacing', 'word-spacing',
                    // 盒模型相关
                    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
                    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                    // 边框相关
                    'border', 'border-width', 'border-style', 'border-color', 'border-radius',
                    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
                    // 定位相关
                    'position', 'top', 'right', 'bottom', 'left', 'z-index', 'display', 'float', 'clear', 'visibility',
                    // 溢出相关
                    'overflow', 'overflow-x', 'overflow-y',
                    // 视觉效果
                    'opacity', 'box-shadow', 'text-shadow', 'transform', 'transition', 'animation',
                    // 交互相关
                    'cursor'
                ];
                
                // 遍历常用CSS属性，只收集有值的属性
                for (let i = 0; i < commonProperties.length; i++) {
                    const propName = commonProperties[i];
                    const propValue = computedStyle.getPropertyValue(propName);
                    if (propValue && propValue.trim() !== '' && propValue !== 'auto' && propValue !== 'none' && propValue !== 'normal') {
                        const chineseName = cssPropertyMap[propName] || propName;
                        const parsedValue = parseCSSValue(propName, propValue);
                        
                        properties.push({
                            originalName: propName,
                            chineseName: chineseName,
                            value: propValue,
                            parsedValue: parsedValue
                        });
                    }
                }
                
                // 检查是否已处理过相同的选择器
                if (!processedSelectors.has(elementIdentifier) && properties.length > 0) {
                    processedSelectors.add(elementIdentifier);
                    analyzedRules.push({
                        selector: elementIdentifier,
                        properties: properties
                    });
                }
            });
        }
        
        return analyzedRules;
    }

    // 查找特定容器内的CSS（优化版）
    function findContentLeftCSS() {
        console.log('CSS属性分析器: 开始查找CSS，当前模式:', config.advancedMode ? '高级模式' : '标准模式');
        
        // 如果不是高级模式，只查找特定容器内的元素（提高性能）
        if (!config.advancedMode) {
            let targetElements = [];
            
            // 使用精确的路径查找策略，按照用户指定路径
            console.log('CSS属性分析器: 使用精确路径查找策略');
            
            // 策略1: 精确按照用户指定路径查找: id="app" -> class="chat" -> class="chat-scope-box" -> class="item Ai" -> class="touch-scope" -> class="content left"
            try {
                // 先找到id="app"的元素
                const appElement = document.getElementById('app');
                if (appElement) {
                    console.log('CSS属性分析器: 找到id="app"元素');
                    
                    // 查找app下的class="chat"元素
                    // 因为需要过4层，所以使用querySelectorAll递归查找
                    const chatElements = [];
                    let currentLevel = [appElement];
                    
                    // 向下遍历4层
                    for (let i = 0; i < 4 && currentLevel.length > 0; i++) {
                        const nextLevel = [];
                        currentLevel.forEach(el => {
                            nextLevel.push(...Array.from(el.children));
                        });
                        currentLevel = nextLevel;
                    }
                    
                    // 从第4层开始查找class="chat"的元素
                    currentLevel.forEach(el => {
                        if (el.classList && el.classList.contains('chat')) {
                            chatElements.push(el);
                        }
                    });
                    
                    console.log(`CSS属性分析器: 找到 ${chatElements.length} 个class="chat"元素`);
                    
                    // 查找chat下的class="chat-scope-box"元素
                    const chatScopeBoxElements = [];
                    chatElements.forEach(chatEl => {
                        const boxes = chatEl.querySelectorAll('.chat-scope-box');
                        chatScopeBoxElements.push(...Array.from(boxes));
                    });
                    
                    console.log(`CSS属性分析器: 找到 ${chatScopeBoxElements.length} 个class="chat-scope-box"元素`);
                    
                    // 从chat-scope-box向下遍历6层
                    let elementsAfter6Levels = [];
                    chatScopeBoxElements.forEach(boxEl => {
                        let currentBoxLevel = [boxEl];
                        
                        // 向下遍历6层
                        for (let i = 0; i < 6 && currentBoxLevel.length > 0; i++) {
                            const nextBoxLevel = [];
                            currentBoxLevel.forEach(el => {
                                nextBoxLevel.push(...Array.from(el.children));
                            });
                            currentBoxLevel = nextBoxLevel;
                        }
                        
                        elementsAfter6Levels.push(...currentBoxLevel);
                    });
                    
                    console.log(`CSS属性分析器: 遍历6层后找到 ${elementsAfter6Levels.length} 个元素`);
                    
                    // 从这些元素中筛选出class="item Ai"且排除class="item Ai avatar-body"的元素
                    const itemAiElements = elementsAfter6Levels.filter(el => {
                        return el.classList && 
                               el.classList.contains('item') && 
                               el.classList.contains('Ai') && 
                               !el.classList.contains('avatar-body');
                    });
                    
                    console.log(`CSS属性分析器: 找到 ${itemAiElements.length} 个符合条件的class="item Ai"元素`);
                    
                    // 查找class="touch-scope"元素
                    const touchScopeElements = [];
                    itemAiElements.forEach(itemAiEl => {
                        const scopes = itemAiEl.querySelectorAll('.touch-scope');
                        touchScopeElements.push(...Array.from(scopes));
                    });
                    
                    console.log(`CSS属性分析器: 找到 ${touchScopeElements.length} 个class="touch-scope"元素`);
                    
                    // 最后查找class="content left"元素
                    const contentLeftElements = [];
                    touchScopeElements.forEach(scopeEl => {
                        const contents = scopeEl.querySelectorAll('.content.left');
                        contentLeftElements.push(...Array.from(contents));
                    });
                    
                    console.log(`CSS属性分析器: 找到 ${contentLeftElements.length} 个目标class="content left"元素`);
                    
                    // 从content left元素中提取所有元素（不包括content left本身），排除<uni-view>元素
                    contentLeftElements.forEach(contentLeftEl => {
                        // 提取class="e"元素
                        const eElements = contentLeftEl.querySelectorAll('.e');
                        targetElements.push(...Array.from(eElements));
                        
                        // 提取其他元素，排除<uni-view>元素
                        const allOtherElements = contentLeftEl.querySelectorAll('*:not(uni-view)');
                        targetElements.push(...Array.from(allOtherElements));
                    });
                }
            } catch (e) {
                console.error('CSS属性分析器: 精确路径查找策略执行出错:', e);
            }
            
            // 去重
            targetElements = [...new Set(targetElements)];
            console.log(`CSS属性分析器: 总共找到 ${targetElements.length} 个目标class="e"元素`);
            
            if (targetElements.length > 0) {
                return analyzeContentLeftElements(targetElements);
            }
            
            // 策略2: 如果精确路径查找失败，使用备用的简化策略
            console.log('CSS属性分析器: 备用简化策略 - 直接查找.content.left容器内的所有元素，排除<uni-view>');
            const contentLeftContainers = document.querySelectorAll('.content.left');
            if (contentLeftContainers.length > 0) {
                contentLeftContainers.forEach(container => {
                    // 提取class="e"元素
                    const eElements = container.querySelectorAll('.e');
                    targetElements.push(...Array.from(eElements));
                    
                    // 提取其他元素，排除<uni-view>元素
                    const allOtherElements = container.querySelectorAll('*:not(uni-view)');
                    targetElements.push(...Array.from(allOtherElements));
                });
                
                // 去重
                targetElements = [...new Set(targetElements)];
                console.log(`CSS属性分析器: 备用策略找到 ${targetElements.length} 个class="e"元素`);
                
                if (targetElements.length > 0) {
                    return analyzeContentLeftElements(targetElements);
                }
            }
            
            console.log('CSS属性分析器: 所有策略都未找到匹配元素');
            return [];
        } else {
            // 高级模式：查找所有content元素并分析所有样式表
            console.log('CSS属性分析器: 高级模式 - 查找所有内容元素');
            const contentElements = document.querySelectorAll(
                '[class*="content"], [id*="content"], ' +
                'article, section, .message, .chat-message, ' +
                '.markdown-body, .prose, pre, code'
            );
            console.log(`CSS属性分析器: 高级模式找到 ${contentElements.length} 个内容元素`);
            
            const styleSheets = document.styleSheets;
            const analyzedRules = [];
            
            // 分析所有样式表
            for (let i = 0; i < styleSheets.length; i++) {
                try {
                    const rules = styleSheets[i].cssRules || styleSheets[i].rules;
                    if (rules) {
                        const sheetRules = analyzeCSSRules(rules);
                        analyzedRules.push(...sheetRules);
                    }
                } catch (e) {
                    // 忽略跨域样式表的错误
                    console.log('无法访问样式表:', e);
                }
            }
            
            // 分析内容元素的计算样式
            if (contentElements.length > 0) {
                const elementRules = analyzeContentLeftElements(contentElements);
                analyzedRules.push(...elementRules);
            }
            
            return analyzedRules;
    }
    
    // 辅助函数: 在指定容器内查找content left元素
    function findContentLeftElementsInContainer(container) {
        const result = [];
        
        // 使用多种选择器查找content left元素
        const contentLeftSelectors = [
            '[class*="content"][class*="left"]',
            '[class*="content"][class*="left" i]', // 不区分大小写
            '[id*="content"][id*="left"]',
            '[id*="content"][id*="left" i]', // 不区分大小写
            '.content.left',
            '#content.left',
            '.content-left',
            '#content-left',
            '[class*="content_left"]',
            '[id*="content_left"]',
            '.content', // 单独的content类
            '[class*="content"]' // 包含content的任何类
        ];
        
        // 尝试所有选择器
        for (let selector of contentLeftSelectors) {
            const elements = container.querySelectorAll(selector);
            if (elements.length > 0) {
                result.push(...Array.from(elements));
            }
        }
        
        // 去重
        const uniqueResults = [...new Set(result)];
        
        // 如果选择器没找到，遍历子元素使用宽松匹配
        if (uniqueResults.length === 0) {
            const children = container.querySelectorAll('div');
            for (let child of children) {
                const classNameStr = typeof child.className === 'string' ? child.className.toLowerCase() : '';
                const idStr = typeof child.id === 'string' ? child.id.toLowerCase() : '';
                
                if ((classNameStr.includes('content') && classNameStr.includes('left')) ||
                    (idStr.includes('content') && idStr.includes('left')) ||
                    classNameStr.includes('content-left') ||
                    idStr.includes('content-left') ||
                    classNameStr.includes('content_left') ||
                    idStr.includes('content_left') ||
                    classNameStr.includes('content') || // 只检查content
                    idStr.includes('content')) { // 只检查content
                    result.push(child);
                }
            }
        }
        
        // 再次去重
        return [...new Set(result)];
    }
}

    // 元素定位功能
    function highlightElement(selector) {
        // 移除之前的高亮
        const oldHighlights = document.querySelectorAll('.css-analyzer-highlight');
        oldHighlights.forEach(el => {
            el.classList.remove('css-analyzer-highlight');
        });
        
        // 查找并高亮元素
        try {
            const elements = document.querySelectorAll(selector);
            
            if (elements.length === 0) {
                showNotification(`未找到匹配选择器 "${selector}" 的元素`);
                return;
            }
            
            // 添加高亮样式
            const style = document.getElementById('css-analyzer-highlight-style');
            if (!style) {
                const newStyle = document.createElement('style');
                newStyle.id = 'css-analyzer-highlight-style';
                newStyle.textContent = `
                    .css-analyzer-highlight {
                        outline: 3px solid #ffeb3b !important;
                        background-color: rgba(255, 235, 59, 0.2) !important;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.7; }
                        100% { opacity: 1; }
                    }
                `;
                document.head.appendChild(newStyle);
            }
            
            // 为元素添加高亮类
            elements.forEach(element => {
                element.classList.add('css-analyzer-highlight');
                // 滚动到元素可见区域
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            
            showNotification(`已定位到 ${elements.length} 个匹配元素`);
            
            // 5秒后自动移除高亮
            setTimeout(() => {
                elements.forEach(element => {
                    element.classList.remove('css-analyzer-highlight');
                });
            }, 5000);
            
        } catch (error) {
            showNotification(`选择器 "${selector}" 无效: ${error.message}`);
        }
    }

    // 从元数据中动态提取版本号
    function getVersionFromMetadata() {
        try {
            // 方法1: 检查是否在用户脚本环境中运行，并尝试直接获取元数据
            if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
                // Tampermonkey/Greasemonkey等用户脚本管理器提供的API
                return GM_info.script.version || '1.0';
            }
            
            // 方法2: 查找页面中的脚本标签，寻找包含元数据的脚本
            const scripts = document.querySelectorAll('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = scripts[i];
                const content = script.textContent || '';
                
                // 查找包含'@version'的脚本
                if (content.includes('@version')) {
                    const versionMatch = content.match(/@version\s+(\d+\.\d+)/i);
                    if (versionMatch && versionMatch[1]) {
                        return versionMatch[1];
                    }
                }
            }
            
            // 如果所有方法都失败，返回默认版本号
            return '1.0';
        } catch (e) {
            console.error('获取版本号失败:', e);
            return '1.0';
        }
    }

    // 应用主题设置（由工具箱控制）
    function createModeToggle() {
        // 获取面板
        const panel = document.getElementById('css-analyzer-panel');
        if (!panel) return;
        
        // 检查是否存在由工具箱创建的开关
        const existingToggle = document.getElementById('css-analyzer-mode-toggle');
        
        // 应用保存的主题
        applySavedTheme();
    }

    // 切换日夜间模式
    function toggleDarkMode(isDark) {
        // 首先更新开关样式
        const toggleSlider = document.querySelector('.toggle-slider');
        const toggleLabel = document.querySelector('#css-analyzer-mode-toggle label');
        const toggleSun = document.querySelector('#css-analyzer-mode-toggle div:nth-child(2)');
        const toggleMoon = document.querySelector('#css-analyzer-mode-toggle div:nth-child(3)');
        
        if (isDark) {
            if (toggleSlider) toggleSlider.style.left = '33px';
            if (toggleSlider) toggleSlider.style.background = '#6c757d';
            if (toggleLabel) toggleLabel.style.background = 'linear-gradient(145deg, #2d2d2d, #1f1f1f)';
            if (toggleLabel) toggleLabel.style.boxShadow = '3px 3px 6px #1a1a1a, -3px -3px 6px #333333';
            if (toggleSun) toggleSun.style.color = '#6c757d';
            if (toggleMoon) toggleMoon.style.color = '#ffc107';
        } else {
            if (toggleSlider) toggleSlider.style.left = '3px';
            if (toggleSlider) toggleSlider.style.background = 'white';
            if (toggleLabel) toggleLabel.style.background = 'linear-gradient(145deg, #f0f0f0, #d1d1d1)';
            if (toggleLabel) toggleLabel.style.boxShadow = '3px 3px 6px #bebebe, -3px -3px 6px #ffffff';
            if (toggleSun) toggleSun.style.color = '#ffc107';
            if (toggleMoon) toggleMoon.style.color = '#6c757d';
        }

        // 然后更新面板样式
        const panel = document.getElementById('css-analyzer-panel');
        if (!panel) return;

        // 切换面板样式
        if (isDark) {
            panel.classList.add('dark-mode');
            panel.style.background = '#1a1a1a';
            panel.style.color = '#e0e0e0';
            panel.style.borderColor = '#333';
            panel.style.scrollbarColor = '#444 #222';
        } else {
            panel.classList.remove('dark-mode');
            panel.style.background = 'white';
            panel.style.color = '#333';
            panel.style.borderColor = '#ddd';
            panel.style.scrollbarColor = '#007bff #f0f0f0';
        }

        // 更新标题和内容颜色
        const title = panel.querySelector('h2');
        if (title) {
            title.style.color = isDark ? '#007bff' : '#333';
        }

        const versionInfo = panel.querySelector('.version-info');
        if (versionInfo) {
            versionInfo.style.color = isDark ? '#999' : '#666';
        }

        // 更新搜索容器样式
        const searchContainer = panel.querySelector('.button-container + div');
        if (searchContainer) {
            searchContainer.style.background = isDark ? '#2a2a2a' : '#f8f9fa';
        }

        const searchInput = panel.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.style.background = isDark ? '#3a3a3a' : 'white';
            searchInput.style.color = isDark ? '#e0e0e0' : '#333';
            searchInput.style.borderColor = isDark ? '#555' : '#ced4da';
        }

        // 更新规则容器样式
        const ruleContainers = panel.querySelectorAll('.rule-container');
        ruleContainers.forEach(container => {
            container.style.background = isDark ? '#2a2a2a' : '#f8f9fa';
        });

        const selectorHeaders = panel.querySelectorAll('.css-analyzer-rule-header');
        selectorHeaders.forEach(header => {
            header.style.background = isDark ? '#333' : '#e9ecef';
        });

        const selectorTitles = panel.querySelectorAll('.css-analyzer-rule-header h3');
        selectorTitles.forEach(title => {
            title.style.color = isDark ? '#61dafb' : '#007bff';
        });

        // 更新属性分类容器样式
        const categoryContainers = panel.querySelectorAll('.css-property-category');
        categoryContainers.forEach(container => {
            container.style.background = isDark ? '#333' : '#f8f9fa';
            container.style.borderColor = isDark ? '#444' : '#e9ecef';
        });

        const categoryHeaders = panel.querySelectorAll('.css-property-category > div:first-child');
        categoryHeaders.forEach(header => {
            header.style.background = isDark ? '#404040' : '#e9ecef';
            header.style.color = isDark ? '#ccc' : '#495057';
        });

        const propertyItems = panel.querySelectorAll('.css-property-category > div:last-child > div');
        propertyItems.forEach(item => {
            item.style.background = isDark ? '#3a3a3a' : 'white';
            item.style.borderTopColor = isDark ? '#444' : '#e9ecef';
        });

        // 更新属性名颜色
        const propertyNames = panel.querySelectorAll('.css-property-category span[style*="color: #007bff"]');
        propertyNames.forEach(name => {
            name.style.color = isDark ? '#61dafb' : '#007bff';
        });

        // 更新按钮颜色
        const buttons = panel.querySelectorAll('button');
        buttons.forEach(button => {
            const originalBg = button.style.background;
            if (originalBg.includes('#dc3545')) {
                // 关闭按钮
                button.style.background = isDark ? '#c82333' : '#dc3545';
            } else if (originalBg.includes('#28a745')) {
                // 刷新和复制按钮
                button.style.background = isDark ? '#218838' : '#28a745';
            } else if (originalBg.includes('#ffc107')) {
                // 重置按钮
                button.style.background = isDark ? '#e0a800' : '#ffc107';
                button.style.color = isDark ? '#fff' : '#212529';
            } else if (originalBg.includes('#6c757d')) {
                // 高级模式和其他按钮
                button.style.background = isDark ? '#5a6268' : '#6c757d';
            } else if (originalBg.includes('#17a2b8')) {
                // 定位和手动选择按钮
                button.style.background = isDark ? '#138496' : '#17a2b8';
            } else if (originalBg.includes('#007bff')) {
                // 教程按钮
                button.style.background = isDark ? '#0069d9' : '#007bff';
            }
        });

        // 保存主题设置
        localStorage.setItem('css-analyzer-theme', isDark ? 'dark' : 'light');
    }

    // 应用保存的主题
    function applySavedTheme() {
        // 从localStorage获取保存的主题设置，如果没有则默认为light
        const savedTheme = localStorage.getItem('css-analyzer-theme') || 'light';
        const isDark = savedTheme === 'dark';
        
        // 设置开关状态
        const darkModeToggle = document.getElementById('css-analyzer-dark-mode');
        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
        }
        
        // 更新开关样式
        const toggleSlider = document.querySelector('.toggle-slider');
        const toggleLabel = document.querySelector('#css-analyzer-mode-toggle label');
        const toggleSun = document.querySelector('#css-analyzer-mode-toggle div:nth-child(2)');
        const toggleMoon = document.querySelector('#css-analyzer-mode-toggle div:nth-child(3)');
        
        // 确保元素存在后再更新样式
        if (isDark) {
            if (toggleSlider) toggleSlider.style.left = '33px';
            if (toggleSlider) toggleSlider.style.background = '#6c757d';
            if (toggleLabel) toggleLabel.style.background = 'linear-gradient(145deg, #2d2d2d, #1f1f1f)';
            if (toggleLabel) toggleLabel.style.boxShadow = '3px 3px 6px #1a1a1a, -3px -3px 6px #333333';
            if (toggleSun) toggleSun.style.color = '#6c757d';
            if (toggleMoon) toggleMoon.style.color = '#ffc107';
        } else {
            if (toggleSlider) toggleSlider.style.left = '3px';
            if (toggleSlider) toggleSlider.style.background = 'white';
            if (toggleLabel) toggleLabel.style.background = 'linear-gradient(145deg, #f0f0f0, #d1d1d1)';
            if (toggleLabel) toggleLabel.style.boxShadow = '3px 3px 6px #bebebe, -3px -3px 6px #ffffff';
            if (toggleSun) toggleSun.style.color = '#ffc107';
            if (toggleMoon) toggleMoon.style.color = '#6c757d';
        }

        // 如果面板已存在，应用主题
        const panel = document.getElementById('css-analyzer-panel');
        if (panel) {
            toggleDarkMode(isDark);
        }
    }

    // 创建UI界面
    function createUI(analyzedRules) {
        // 检查是否已有UI存在
        let panel = document.getElementById('css-analyzer-panel');
        if (panel) {
            panel.remove();
        }

        // 获取版本号
        const version = getVersionFromMetadata();

        // 创建面板容器
        panel = document.createElement('div');
        panel.id = 'css-analyzer-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 80%;
            max-width: 600px;
            max-height: 80vh;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 20px;
            z-index: 9999;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            /* 美观的滚动条样式 */
            scrollbar-width: thin;
            scrollbar-color: #007bff #f0f0f0;
            transition: all 0.3s ease;
        `;
        
        // 添加Webkit内核浏览器的滚动条样式和响应式布局
        const style = document.createElement('style');
        style.textContent = `
            #css-analyzer-panel::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            #css-analyzer-panel::-webkit-scrollbar-track {
                background: #f0f0f0;
                border-radius: 4px;
            }
            #css-analyzer-panel::-webkit-scrollbar-thumb {
                background: #007bff;
                border-radius: 4px;
                transition: background 0.3s ease;
            }
            #css-analyzer-panel::-webkit-scrollbar-thumb:hover {
                background: #0056b3;
            }
            
            /* 响应式布局 - 小屏幕适配 */
            @media screen and (max-width: 768px) {
                #css-analyzer-panel {
                    width: 95% !important;
                    max-width: none !important;
                    top: 10px !important;
                    right: 10px !important;
                    left: 10px !important;
                    max-height: 90vh !important;
                    padding: 15px !important;
                }
                
                #css-analyzer-panel .rule-container {
                    padding: 8px !important;
                }
                
                #css-analyzer-panel button {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                    margin-right: 5px !important;
                }
            }
            
            /* 超小屏幕适配 */
            @media screen and (max-width: 480px) {
                #css-analyzer-panel {
                    padding: 10px !important;
                }
                
                #css-analyzer-panel .button-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
                
                #css-analyzer-panel .property-container {
                    padding-left: 5px !important;
                }
            }
        `;
        document.head.appendChild(style);

        // 创建标题
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            margin-bottom: 20px;
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'CSS属性分析器';
        title.style.cssText = `
            margin-top: 0;
            margin-bottom: 5px;
            color: #333;
            font-size: 18px;
        `;
        
        const versionInfo = document.createElement('div');
        versionInfo.textContent = `v${version} - 作者：苏子言`;
        versionInfo.style.cssText = `
            color: #666;
            font-size: 10px;
            font-style: italic;
            margin-bottom: 10px;
        `;
        
        // 添加移动端适配样式
        versionInfo.classList.add('version-info');
        
        const titleBorder = document.createElement('div');
        titleBorder.style.cssText = `
            width: 100%;
            height: 2px;
            background-color: #007bff;
            margin-top: 5px;
        `;
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(versionInfo);
        titleContainer.appendChild(titleBorder);
        panel.appendChild(titleContainer);

        // 创建按钮容器，用于更好地组织按钮布局
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        buttonContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
        `;
        panel.appendChild(buttonContainer);
        
        // 添加移动端适配的CSS样式
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* 移动端适配：当屏幕宽度小于768px时调整按钮布局 */
            @media (max-width: 768px) {
                .button-container {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: auto auto;
                    gap: 5px;
                    width: 45%;
                    right: 2.5%;
                    flex-wrap: nowrap !important;
                    justify-content: stretch !important;
                    height: auto !important;
                }
                /* 确保每个按钮占满单元格 */
                .button-container button {
                    order: initial !important;
                    width: 100% !important;
                    box-sizing: border-box;
                }
                /* 调整按钮位置为田字格布局 */
                .button-container button:nth-child(3) { /* 高级CSS设置按钮 - 左上角 */
                    grid-column: 1;
                    grid-row: 1;
                }
                .button-container button:nth-child(1) { /* 关闭按钮 - 右上角 */
                    grid-column: 2;
                    grid-row: 1;
                }
                .button-container button:nth-child(4) { /* 手动选择元素按钮 - 左下角 */
                    grid-column: 1;
                    grid-row: 2;
                }
                .button-container button:nth-child(2) { /* 刷新按钮 - 右下角 */
                    grid-column: 2;
                    grid-row: 2;
                }
                
                /* 版本信息元素移动端样式 */
                .version-info {
                    height: 20px !important;
                }
            }
        `;
        document.head.appendChild(styleElement);
        
        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
            order: 10; /* 确保关闭按钮始终在最右侧 */
        `;
        closeBtn.addEventListener('click', () => {
            panel.remove();
            // 移除所有高亮
            const highlights = document.querySelectorAll('.css-analyzer-highlight');
            highlights.forEach(el => el.classList.remove('css-analyzer-highlight'));
        });
        buttonContainer.appendChild(closeBtn);

        // 创建刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '刷新';
        refreshBtn.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
            order: 1;
        `;
        refreshBtn.addEventListener('click', () => {
            const newRules = findContentLeftCSS();
            createUI(newRules);
        });
        buttonContainer.appendChild(refreshBtn);
        
        // 创建高级CSS设置按钮
            const advancedBtn = document.createElement('button');
            advancedBtn.textContent = config.advancedMode ? '标准模式' : '高级CSS设置';
            advancedBtn.style.cssText = `
                background: ${config.advancedMode ? '#ffc107' : '#6c757d'};
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 12px;
                order: 2;
            `;
            advancedBtn.addEventListener('click', () => {
                // 切换高级模式状态
                config.advancedMode = !config.advancedMode;
                // 更新按钮样式和文本
                advancedBtn.textContent = config.advancedMode ? '标准模式' : '高级CSS设置';
                advancedBtn.style.background = config.advancedMode ? '#ffc107' : '#6c757d';
                // 显示切换模式的提示
                showNotification(`已切换到${config.advancedMode ? '高级' : '标准'}模式`);
                // 重新分析CSS并更新UI
                const newRules = findContentLeftCSS();
                createUI(newRules);
            });
            buttonContainer.appendChild(advancedBtn);
            
            // 添加手动选择元素按钮
            const selectElementBtn = document.createElement('button');
            selectElementBtn.textContent = '手动选择元素';
            selectElementBtn.style.cssText = `
                background: #17a2b8;
                color: white;
                border: none;
                order: 3;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 12px;
            `;
            selectElementBtn.addEventListener('click', () => {
                // 隐藏主界面面板
                panel.style.display = 'none';
                
                showNotification('请点击页面上要分析的元素（按ESC键或者滑动屏幕可取消）');
                
                // 添加临时的点击事件监听器
                function selectElementHandler(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 获取点击的元素
                    const selectedElement = e.target;
                    
                    // 移除点击事件监听器
                    document.removeEventListener('click', selectElementHandler, true);
                    document.removeEventListener('keydown', cancelSelectionHandler);
                    
                    // 分析选中元素的CSS
                    const analyzedRules = analyzeContentLeftElements([selectedElement]);
                    createUI(analyzedRules);
                    
                    showNotification('已分析选中元素的CSS属性');
                    
                    // 重新显示主界面面板
                    panel.style.display = 'block';
                }
                
                // 添加ESC键取消选择
                function cancelSelectionHandler(e) {
                    if (e.key === 'Escape') {
                        document.removeEventListener('click', selectElementHandler, true);
                        document.removeEventListener('keydown', cancelSelectionHandler);
                        showNotification('选择元素模式已取消');
                        
                        // 重新显示主界面面板
                        panel.style.display = 'block';
                    }
                }
                
                // 添加全局点击事件监听器
                document.addEventListener('click', selectElementHandler, true);
                // 添加ESC键事件监听器
                document.addEventListener('keydown', cancelSelectionHandler);
                
                // 5秒后自动取消选择模式
                setTimeout(() => {
                    document.removeEventListener('click', selectElementHandler, true);
                    document.removeEventListener('keydown', cancelSelectionHandler);
                    
                    // 如果面板仍然隐藏（即用户没有选择元素），则显示它
                    if (panel.style.display === 'none') {
                        showNotification('选择元素模式已取消');
                        panel.style.display = 'block';
                    }
                }, 5000);
            });
            buttonContainer.appendChild(selectElementBtn);

        // 创建选择器搜索框
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            margin-top: 40px; /* 为按钮容器留出空间 */
            margin-bottom: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
        `;
        
        const searchLabel = document.createElement('span');
        searchLabel.textContent = '搜索选择器:';
        searchLabel.style.fontWeight = '500';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '输入选择器关键词...';
        searchInput.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
        `;
        
        const searchBtn = document.createElement('button');
        searchBtn.textContent = '搜索';
        searchBtn.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '重置';
        resetBtn.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // 创建恢复蒙版按钮
        const restoreMaskBtn = document.createElement('button');
        restoreMaskBtn.textContent = '恢复蒙版';
        restoreMaskBtn.style.cssText = `
            background: #17a2b8;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            display: none; /* 默认隐藏 */
        `;
        
        // 检查是否存在蒙版信息
        function checkForMasks() {
            const masks = localStorage.getItem('css-analyzer-masks');
            if (masks) {
                try {
                    const masksData = JSON.parse(masks);
                    if (masksData && Object.keys(masksData).length > 0) {
                        restoreMaskBtn.style.display = 'block';
                    } else {
                        restoreMaskBtn.style.display = 'none';
                    }
                } catch (e) {
                    restoreMaskBtn.style.display = 'none';
                }
            } else {
                restoreMaskBtn.style.display = 'none';
            }
        }
        
        // 立即检查一次
        checkForMasks();
        
        // 恢复蒙版按钮点击事件
        restoreMaskBtn.addEventListener('click', () => {
            const confirmRestore = confirm('确定要恢复所有蒙版吗？这将恢复元素的原始class和style属性。');
            if (confirmRestore) {
                try {
                    const masks = JSON.parse(localStorage.getItem('css-analyzer-masks') || '{}');
                    
                    // 获取或创建样式表
                    let styleSheet = document.getElementById('css-analyzer-stylesheet');
                    if (!styleSheet) {
                        styleSheet = document.createElement('style');
                        styleSheet.id = 'css-analyzer-stylesheet';
                        document.head.appendChild(styleSheet);
                    }
                    
                    // 移除所有蒙版样式规则
                    while (styleSheet.sheet && styleSheet.sheet.cssRules.length > 0) {
                        styleSheet.sheet.deleteRule(0);
                    }
                    
                    // 恢复每个元素的原始class和style
                        Object.entries(masks).forEach(([uniqueClass, originalInfo]) => {
                            const elements = document.querySelectorAll('.' + uniqueClass);
                            elements.forEach(element => {
                                // 移除蒙版class但保留其他class
                                element.classList.remove(uniqueClass);
                                
                                // 恢复原始style
                                if (originalInfo.style) {
                                    element.setAttribute('style', originalInfo.style);
                                } else {
                                    element.removeAttribute('style');
                                }
                            });
                        });
                    
                    // 清除存储的蒙版信息
                    localStorage.removeItem('css-analyzer-masks');
                    
                    showNotification('所有蒙版已恢复');
                    
                    // 隐藏恢复按钮
                    restoreMaskBtn.style.display = 'none';
                    
                    // 重新分析CSS以更新界面
                    setTimeout(() => {
                        const newRules = findContentLeftCSS();
                        createUI(newRules);
                    }, 100);
                } catch (e) {
                    console.log('恢复蒙版失败:', e);
                    showNotification('恢复蒙版失败，请查看控制台日志');
                }
            }
        });
        
        searchContainer.appendChild(searchLabel);
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchBtn);
        searchContainer.appendChild(resetBtn);
        searchContainer.appendChild(restoreMaskBtn);
        panel.appendChild(searchContainer);

        // 创建规则容器
        const rulesContainer = document.createElement('div');
        rulesContainer.id = 'css-analyzer-rules-container';
        
        // 如果没有找到规则，显示提示信息
        if (analyzedRules.length === 0) {
            const noRulesMsg = document.createElement('p');
            noRulesMsg.textContent = config.advancedMode ? '未找到相关的CSS规则。' : '未找到item Ai容器内的content left标签相关的CSS规则。';
            noRulesMsg.style.cssText = `
                color: #666;
                text-align: center;
                padding: 20px;
            `;
            rulesContainer.appendChild(noRulesMsg);
        } else {
            // 创建按钮容器，用于并排显示折叠所有和显示被隐藏容器按钮
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.gap = '10px';
            buttonsContainer.style.marginBottom = '15px';
            
            // 创建折叠/展开控制按钮
            const toggleAllBtn = document.createElement('button');
            toggleAllBtn.textContent = '折叠所有';
            toggleAllBtn.style.cssText = `
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 12px;
            `;
            buttonsContainer.appendChild(toggleAllBtn);
            
            // 显示规则
            analyzedRules.forEach((rule, ruleIndex) => {
                const ruleContainer = document.createElement('div');
                ruleContainer.className = 'rule-container css-analyzer-rule-item';
                ruleContainer.dataset.selector = rule.selector;
                ruleContainer.dataset.analyzed = 'false'; // 标记为未分析
                ruleContainer.style.cssText = `
                    margin-bottom: 15px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 4px solid #007bff;
                    overflow: hidden;
                    transition: all 0.3s ease;
                `;

                // 选择器名称和操作按钮
                const selectorHeaderContainer = document.createElement('div');
                selectorHeaderContainer.className = 'css-analyzer-rule-header';
                selectorHeaderContainer.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px;
                    background: #e9ecef;
                    cursor: pointer;
                    flex-wrap: wrap;
                    gap: 5px;
                `;
                
                const selectorHeader = document.createElement('h3');
                selectorHeader.textContent = `选择器: ${rule.selector}`;
                selectorHeader.style.cssText = `
                    margin: 0;
                    color: #007bff;
                    font-size: 14px;
                    font-weight: 600;
                    flex: 1;
                    word-break: break-all;
                    overflow-wrap: break-word;
                    min-width: 150px;
                `;
                
                // 操作按钮容器
                const actionsContainer = document.createElement('div');
                actionsContainer.style.display = 'flex';
                actionsContainer.style.gap = '5px';
                
                // 折叠/展开按钮
                const toggleBtn = document.createElement('button');
                toggleBtn.textContent = '▼';
                toggleBtn.style.cssText = `
                    background: transparent;
                    color: #495057;
                    border: none;
                    cursor: pointer;
                    font-size: 10px;
                    padding: 2px 6px;
                `;
                
                // 定位按钮
                const locateBtn = document.createElement('button');
                locateBtn.textContent = '定位';
                locateBtn.style.cssText = `
                    background: #17a2b8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 10px;
                `;
                locateBtn.addEventListener('click', () => {
                    highlightElement(rule.selector);
                });
                
                // 蒙版按钮
                const maskBtn = document.createElement('button');
                maskBtn.textContent = '蒙版';
                
                // 检测元素是否有内联style属性
                let hasInlineStyle = false;
                try {
                    const elements = document.querySelectorAll(rule.selector);
                    if (elements.length > 0) {
                        for (let i = 0; i < elements.length; i++) {
                            if (elements[i].hasAttribute('style')) {
                                hasInlineStyle = true;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.log('检测内联style属性失败:'， e);
                }
                
                // 根据是否有内联style设置按钮颜色
                maskBtn.style.cssText = `
                    background: ${hasInlineStyle ? '#6610f2' : '#adb5bd'};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: ${hasInlineStyle ? 'pointer' : 'not-allowed'};
                    font-size: 10px;
                `;
                
                // 创建提示弹窗函数
                function createMaskConfirmDialog() {
                    // 检查是否已存在弹窗
                    let existingDialog = document.getElementById('css-analyzer-mask-dialog');
                    if (existingDialog) {
                        existingDialog.remove();
                    }
                    
                    // 创建弹窗容器
                    const dialog = document。createElement('div');
                    dialog。id = 'css-analyzer-mask-dialog';
                    dialog.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        z-index: 9999;
                        width: 90%;
                        max-width: 400px;
                    `;
                    
                    // 标题
                    const title = document。createElement('h3');
                    title.textContent = '创建样式蒙版';
                    title.style.cssText = `
                        margin-top: 0;
                        color: #333;
                        font-size: 16px;
                    `;
                    dialog.appendChild(title);
                    
                    // 内容
                    const content = document.createElement('p');
                    content.textContent = '此操作会将元素的内联style转换为唯一class，并暂时"隔绝"原始样式，以避免全局污染。确定要继续吗？';
                    content.style.cssText = `
                        color: #666;
                        line-height: 1.5;
                    `;
                    dialog.appendChild(content);
                    
                    // 按钮容器
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.style.cssText = `
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 15px;
                    `;
                    dialog.appendChild(buttonsContainer);
                    
                    // 取消按钮
                    const cancelBtn = document.createElement('button');
                    cancelBtn.textContent = '取消';
                    cancelBtn.style.cssText = `
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        font-size: 14px;
                    `;
                    cancelBtn。addEventListener('click', () => {
                        dialog.remove();
                    });
                    buttonsContainer。appendChild(cancelBtn);
                    
                    // 确定按钮
                    const confirmBtn = document.createElement('button');
                    confirmBtn.textContent = '确定';
                    confirmBtn.style.cssText = `
                        background: #6610f2;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        font-size: 14px;
                    `;
                    confirmBtn.addEventListener('click', () => {
                        // 执行蒙版创建操作
                        createStyleMask(rule。selector);
                        dialog。remove();
                    });
                    buttonsContainer.appendChild(confirmBtn);
                    
                    // 添加到文档
                    document.body.appendChild(dialog);
                }
                
                // 创建样式蒙版函数
                function createStyleMask(selector) {
                    try {
                        // 首先找到content left容器
                        const contentLeftContainers = [];
                        
                        // 使用精确路径查找策略找到content left容器
                        try {
                            // 先找到id="app"的元素
                            const appElement = document.getElementById('app');
                            if (appElement) {
                                // 查找app下的class="chat"元素
                                const chatElements = [];
                                let currentLevel = [appElement];
                                
                                // 向下遍历4层
                                for (let i = 0; i < 4 && currentLevel.length > 0; i++) {
                                    const nextLevel = [];
                                    currentLevel.forEach(el => {
                                        if (el.children) {
                                            nextLevel.push(...Array.from(el.children));
                                        }
                                    });
                                    currentLevel = nextLevel;
                                }
                                
                                // 找到class="chat"的元素
                                currentLevel.forEach(el => {
                                    if (el.classList && el.classList.contains('chat')) {
                                        chatElements.push(el);
                                    }
                                });
                                
                                // 从chat元素开始，再过6层找到class="chat-scope-box"元素
                                const chatScopeBoxElements = [];
                                chatElements.forEach(chatEl => {
                                    let chatLevel = [chatEl];
                                    for (let i = 0; i < 6 && chatLevel.length > 0; i++) {
                                        const nextLevel = [];
                                        chatLevel.forEach(el => {
                                            if (el.children) {
                                                nextLevel.push(...Array.from(el.children));
                                            }
                                        });
                                        chatLevel = nextLevel;
                                    }
                                    chatLevel.forEach(el => {
                                        if (el.classList && el.classList.contains('chat-scope-box')) {
                                            chatScopeBoxElements.push(el);
                                        }
                                    });
                                });
                                
                                // 找到class="item Ai"但不包含"avatar-body"的元素
                                const itemAiElements = [];
                                chatScopeBoxElements.forEach(boxEl => {
                                    const items = boxEl.querySelectorAll('.item.Ai:not(.avatar-body)');
                                    itemAiElements.push(...Array.from(items));
                                });
                                
                                // 找到class="touch-scope"的元素
                                const touchScopeElements = [];
                                itemAiElements.forEach(itemEl => {
                                    const scopes = itemEl.querySelectorAll('.touch-scope');
                                    touchScopeElements.push(...Array.from(scopes));
                                });
                                
                                // 最后查找class="content left"元素
                                touchScopeElements.forEach(scopeEl => {
                                    const contents = scopeEl.querySelectorAll('.content.left');
                                    contentLeftContainers.push(...Array.from(contents));
                                });
                            }
                        } catch (e) {
                            console.error('CSS属性分析器: 精确路径查找content left容器出错:', e);
                        }
                        
                        // 如果精确路径查找失败，使用备用策略
                        if (contentLeftContainers.length === 0) {
                            console.log('CSS属性分析器: 使用备用策略查找content left容器');
                            const containers = document.querySelectorAll('.content.left');
                            contentLeftContainers.push(...Array.from(containers));
                        }
                        
                        // 如果还是没找到，就直接在document中查找
                        let elements = [];
                        if (contentLeftContainers.length > 0) {
                            // 只在content left容器内查找匹配选择器的元素
                            contentLeftContainers.forEach(container => {
                                const matchedElements = container.querySelectorAll(selector);
                                elements.push(...Array.from(matchedElements));
                            });
                        } else {
                            // 如果找不到content left容器，才在整个文档中查找
                            elements = Array.from(document.querySelectorAll(selector));
                        }
                        
                        if (elements.length === 0) {
                            showNotification('未找到匹配的元素');
                            return;
                        }
                        
                        elements.forEach((element, index) => {
                            // 检查元素是否有内联style
                            if (element.hasAttribute('style')) {
                                // 创建唯一class
                                const uniqueClass = `css-mask-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;
                                
                                // 保存原始的class和style信息
                                const originalInfo = {
                                    className: element.className,
                                    style: element.getAttribute('style')
                                };
                                
                                // 存储原始信息
                                const masksStorage = JSON.parse(localStorage.getItem('css-analyzer-masks') || '{}');
                                masksStorage[uniqueClass] = originalInfo;
                                localStorage.setItem('css-analyzer-masks', JSON.stringify(masksStorage));
                                
                                // 获取内联style的所有属性和值
                                const inlineStyles = element.getAttribute('style');
                                const styleMap = {};
                                
                                // 使用正则表达式正确解析内联样式，避免URL等特殊值被错误分割
                                const styleRegex = /([a-z-]+):\s*([^;]+)(?:;|$)/gi;
                                let match;
                                while ((match = styleRegex.exec(inlineStyles)) !== null) {
                                    const key = match[1].trim();
                                    const value = match[2].trim();
                                    if (key && value) {
                                        styleMap[key] = value;
                                    }
                                }
                                
                                // 移除内联style但保留原始class
                                element.removeAttribute('style');
                                
                                // 添加唯一class（不清除原始class）
                                element.classList.add(uniqueClass);
                                
                                // 将内联style转换为页面样式表中的规则
                                let styleSheet = document.getElementById('css-analyzer-styles');
                                if (!styleSheet) {
                                    styleSheet = document.createElement('style');
                                    styleSheet.id = 'css-analyzer-styles';
                                    document.head.appendChild(styleSheet);
                                }
                                
                                // 构建CSS规则文本
                                let cssText = `.${uniqueClass} {`;
                                Object.keys(styleMap).forEach(key => {
                                    cssText += ` ${key}: ${styleMap[key]} !important;`;
                                });
                                cssText += ' }';
                                
                                // 插入规则
                                styleSheet.sheet.insertRule(cssText, styleSheet.sheet.cssRules.length);
                            }
                        });
                        
                        showNotification('样式蒙版创建成功！');
                        // 重新分析CSS以更新界面
                        setTimeout(() => {
                            showCSSAnalyzerPanel();
                        }, 100);
                    } catch (e) {
                        console.log('创建样式蒙版失败:', e);
                        showNotification('创建样式蒙版失败，请查看控制台日志');
                    }
                }
                
                // 只有当元素有内联style时才添加点击事件
                if (hasInlineStyle) {
                    maskBtn.addEventListener('click', createMaskConfirmDialog);
                }
                
                // 重置按钮
                const resetBtn = document.createElement('button');
                resetBtn.textContent = '重置';
                resetBtn.style.cssText = `
                    background: #ffc107;
                    color: #212529;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 10px;
                `;
                resetBtn.addEventListener('click', () => {
                    // 清除该选择器的存储数据
                    const savedStyles = JSON.parse(localStorage.getItem('css-analyzer-styles') || '{}');
                    delete savedStyles[rule.selector];
                    localStorage.setItem('css-analyzer-styles', JSON.stringify(savedStyles));
                    
                    // 刷新页面
                    location.reload();
                });
                
                // 恢复蒙版按钮
                const restoreMaskBtn = document。createElement('button');
                restoreMaskBtn.textContent = '恢复蒙版';
                restoreMaskBtn.style.cssText = `
                    background: #17a2b8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 10px;
                    margin-left: 4px;
                    display: none;
                `;
                
                // 检查是否有蒙版需要恢复
                function checkForMasks() {
                    const masksStorage = JSON.parse(localStorage.getItem('css-analyzer-masks') || '{}');
                    const hasMasks = Object.keys(masksStorage)。length > 0;
                    
                    if (hasMasks) {
                        restoreMaskBtn.style.display = 'inline-block';
                    }
                }
                
                // 立即检查一次
                checkForMasks();
                
                // 恢复蒙版功能
                restoreMaskBtn。addEventListener('click', () => {
                    try {
                        const masksStorage = JSON.parse(localStorage.getItem('css-analyzer-masks') || '{}');
                        const maskClasses = Object.keys(masksStorage);
                        
                        if (maskClasses。length === 0) {
                            showNotification('没有可恢复的蒙版');
                            return;
                        }
                        
                        // 确认对话框
                        if (confirm('确定要恢复所有通过蒙版功能修改的元素吗？这将恢复它们的原始class和内联style。')) {
                            // 移除添加的样式规则
                            const styleSheet = document.getElementById('css-analyzer-styles');
                            if (styleSheet && styleSheet.sheet) {
                                const rules = styleSheet.sheet.cssRules;
                                for (let i = rules.length - 1; i >= 0; i--) {
                                    const ruleText = rules[i].cssText;
                                    for (const maskClass of maskClasses) {
                                        if (ruleText.includes('.' + maskClass)) {
                                            styleSheet.sheet.deleteRule(i);
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // 恢复元素的原始class和style
                            maskClasses.forEach(maskClass => {
                                const elements = document.querySelectorAll('.' + maskClass);
                                const originalInfo = masksStorage[maskClass];
                                
                                elements.forEach(element => {
                                    // 移除唯一class
                                    element.classList.remove(maskClass);
                                    
                                    // 恢复原始class和style
                                    if (originalInfo.classes) {
                                        element.className = originalInfo.classes;
                                    }
                                    if (originalInfo.style) {
                                        element.setAttribute('style', originalInfo.style);
                                    }
                                });
                            });
                            
                            // 清除存储的蒙版信息
                            localStorage.removeItem('css-analyzer-masks');
                            
                            showNotification('所有蒙版已恢复');
                            
                            // 隐藏恢复按钮
                            restoreMaskBtn.style.display = 'none';
                            
                            // 重新分析CSS以更新界面
                            setTimeout(() => {
                                showCSSAnalyzerPanel();
                            }, 100);
                        }
                    } catch (e) {
                        console.log('恢复蒙版失败:', e);
                        showNotification('恢复蒙版失败，请查看控制台日志');
                    }
                });
                
                // 不显示这个容器按钮（在分析界面中隐藏）
                const hideContainerBtn = document.createElement('button');
                hideContainerBtn。textContent = '隐藏';
                hideContainerBtn.style.cssText = `
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 10px;
                `;
                hideContainerBtn.addEventListener('click', () => {
                    // 在分析界面中隐藏这个规则容器
                    ruleContainer。style。display = 'none';
                    showNotification('已在分析界面中隐藏该容器');
                });
                
                actionsContainer。appendChild(toggleBtn);
                actionsContainer.appendChild(locateBtn);
                actionsContainer.appendChild(maskBtn);
                actionsContainer。appendChild(resetBtn);
                actionsContainer。appendChild(hideContainerBtn);
                selectorHeaderContainer.appendChild(selectorHeader);
                selectorHeaderContainer.appendChild(actionsContainer);
                ruleContainer.appendChild(selectorHeaderContainer);

                // 属性列表
                const propertiesList = document.createElement('div');
                propertiesList.className = 'css-analyzer-properties-content';
                propertiesList.style.cssText = `
                    padding: 15px;
                `;
                
                // 创建一个函数来分析和显示属性
                function analyzeAndDisplayProperties() {
                    // 如果已经分析过，则不再重复分析
                    if (ruleContainer.dataset.analyzed === 'true') {
                        return;
                    }
                    
                    // 标记为已分析
                    ruleContainer.dataset.analyzed = 'true';
                    
                    // 清空现有内容
                    while (propertiesList.firstChild) {
                        propertiesList.removeChild(propertiesList.firstChild);
                    }
                    
                    // 特殊处理style标签
                    if (rule.selector === 'style' || rule.selector.includes('style')) {
                        // 检查是否有style标签的内容
                        const styleContent = rule.properties.find(prop => prop.originalName === 'textContent' || prop.originalName === 'innerHTML');
                        
                        if (styleContent) {
                            try {
                                // 创建一个临时的style元素来解析CSS
                                const tempStyle = document.createElement('style');
                                tempStyle.textContent = styleContent.value;
                                document.head.appendChild(tempStyle);
                                
                                // 获取解析后的CSS规则
                                const cssRules = tempStyle.sheet.cssRules;
                                document.head.removeChild(tempStyle);
                                
                                // 显示解析后的CSS规则
                                const styleRulesContainer = document.createElement('div');
                                styleRulesContainer.style.cssText = `
                                    margin-bottom: 15px;
                                    padding: 10px;
                                    background: #f0f8ff;
                                    border-radius: 4px;
                                    border: 1px solid #b8daff;
                                    overflow-x: auto;
                                `;
                                
                                const styleTitle = document.createElement('h4');
                                styleTitle.textContent = 'Style标签内容解析';
                                styleTitle.style.cssText = `
                                    margin-top: 0;
                                    margin-bottom: 10px;
                                    color: #0056b3;
                                    font-size: 14px;
                                `;
                                styleRulesContainer.appendChild(styleTitle);
                                
                                // 遍历所有CSS规则
                                for (let i = 0; i < cssRules.length; i++) {
                                    const cssRule = cssRules[i];
                                    if (cssRule.type === CSSRule.STYLE_RULE) {
                                        const ruleItem = document.createElement('div');
                                        ruleItem.style.cssText = `
                                            margin-bottom: 10px;
                                            padding: 8px;
                                            background: white;
                                            border-radius: 4px;
                                            border: 1px solid #e9ecef;
                                        `;
                                        
                                        const ruleSelector = document.createElement('div');
                                        ruleSelector。textContent = cssRule.selectorText;
                                        ruleSelector。style。cssText = `
                                            font-weight: bold;
                                            color: #007bff;
                                            margin-bottom: 5px;
                                        `;
                                        ruleItem.appendChild(ruleSelector);
                                        
                                        const ruleBody = document.createElement('div');
                                        ruleBody.style.cssText = `
                                            padding-left: 10px;
                                            border-left: 2px solid #e9ecef;
                                        `;
                                        
                                        // 获取所有CSS属性
                                        const style = cssRule.style;
                                        for (let j = 0; j < style.length; j++) {
                                            const propName = style[j];
                                            const propValue = style.getPropertyValue(propName);
                                            
                                            const propLine = document.createElement('div');
                                            propLine。style.cssText = `
                                                margin-bottom: 3px;
                                                font-family: monospace;
                                            `;
                                            
                                            // 尝试获取中文属性名
                                            const chineseName = cssPropertyMap[propName] || propName;
                                            
                                            propLine.innerHTML = `<span style="color: #28a745;">${chineseName}</span>: ${propValue};`;
                                            ruleBody.appendChild(propLine);
                                        }
                                        
                                        ruleItem.appendChild(ruleBody);
                                        styleRulesContainer.appendChild(ruleItem);
                                    }
                                }
                                
                                propertiesList.appendChild(styleRulesContainer);
                            } catch (error) {
                                console。error('解析style标签内容失败:'， error);
                                // 如果解析失败，回退到普通显示
                                displayNormalProperties();
                            }
                        } else {
                            // 没有找到style内容，显示普通属性
                            displayNormalProperties();
                        }
                    } else {
                        // 普通元素，显示常规属性
                        displayNormalProperties();
                    }
                    
                    // 添加复制按钮
                    const copyBtn = document。createElement('button');
                    copyBtn.textContent = '复制所有属性';
                    copyBtn.style.cssText = `
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 6px 12px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-top: 10px;
                    `;
                    copyBtn.addEventListener('click', () => {
                        let cssText = '';
                        rule。properties.forEach(prop => {
                            cssText += `${prop.originalName}: ${prop.value} !important;\n`;
                        });
                        navigator。clipboard.writeText(cssText)。键，然后(() => {
                            showNotification('已复制所有CSS属性到剪贴板');
                        })。catch(err => {
                            showNotification('复制失败，请手动选择复制');
                        });
                    });
                    propertiesList。appendChild(copyBtn);
                }
                
                // 创建CSS属性分类映射
                const cssPropertyCategories = {
                    'background': '背景',
                    'border': '边框'，
                    'margin': '外边距',
                    'padding': '内边距',
                    'position': '定位',
                    'display': '显示',
                    'font': '字体'，
                    'text': '文本',
                    'list': '列表',
                    '其他': '其他'
                };

                // 特殊属性归类映射
                const specialPropertyCategories = {
                    'color': '字体'  // 文字颜色归类到字体类
                };

                // 根据属性名获取分类
                function getPropertyCategory(propName) {
                    // 先检查特殊属性归类
                    if (specialPropertyCategories[propName]) {
                        return specialPropertyCategories[propName];
                    }
                    
                    // 再检查普通前缀归类
                    for (const [prefix, category] of Object.entries(cssPropertyCategories)) {
                        if (propName === prefix || propName.startsWith(prefix + '-')) {
                            return category;
                        }
                    }
                    return '其他';
                }

                // 显示分类属性的函数
                function displayNormalProperties() {
                    // 按分类组织属性
                    const propertiesByCategory = {};
                    
                    rule.properties.forEach((prop, propIndex) => {
                        // 跳过大类属性本身，只显示小类
                        if (cssPropertyCategories[prop.originalName]) {
                            return;
                        }
                        
                        const category = getPropertyCategory(prop.originalName);
                        if (!propertiesByCategory[category]) {
                            propertiesByCategory[category] = [];
                        }
                        propertiesByCategory[category].push(prop);
                    });

                    // 遍历每个分类创建折叠菜单
                    Object.keys(propertiesByCategory).forEach(category => {
                        const categoryContainer = document.createElement('div');
                        categoryContainer.className = 'css-property-category';
                        categoryContainer.style.cssText = `
                            margin-bottom: 10px;
                            background: #f8f9fa;
                            border-radius: 4px;
                            border: 1px solid #e9ecef;
                            overflow: hidden;
                        `;

                        // 分类标题（可点击的折叠/展开按钮）
                        const categoryHeader = document.createElement('div');
                        categoryHeader.style.cssText = `
                            padding: 8px 12px;
                            background: #e9ecef;
                            cursor: pointer;
                            font-weight: 600;
                            color: #495057;
                            display: flex;
                            align-items: center;
                        `;

                        const categoryToggle = document.createElement('span');
                        categoryToggle.textContent = '►';
                        categoryToggle.style.cssText = `
                            margin-right: 8px;
                            font-size: 10px;
                            transition: transform 0.2s ease;
                        `;

                        const categoryName = document.createElement('span');
                        categoryName.textContent = `${category}属性`;

                        categoryHeader.appendChild(categoryToggle);
                        categoryHeader.appendChild(categoryName);
                        categoryContainer.appendChild(categoryHeader);

                        // 分类内容容器
                        const categoryContent = document.createElement('div');
                        categoryContent.style.cssText = `
                            padding: 0;
                            display: none;
                        `;

                        // 添加该分类下的所有属性
                        propertiesByCategory[category].forEach(prop => {
                            const propItem = document.createElement('div');
                            propItem.style.cssText = `
                                margin-bottom: 0;
                                padding: 8px 12px;
                                background: white;
                                border-top: 1px solid #e9ecef;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            `;

                            const propName = document.createElement('div');
                            propName.style.cssText = `
                                flex: 1 1 0%;
                                font-weight: 500;
                                color: #495057;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            `;
                            propName.innerHTML = `<span style="color: #007bff;">${prop.chineseName}</span>: ${prop.parsedValue}`;

                            const propInput = document.createElement('input');
                            propInput.type = 'text';
                            propInput.value = prop.value;
                            propInput.dataset.originalName = prop.originalName;
                            propInput.dataset.selector = rule.selector;
                            propInput.style.cssText = `
                                width: 150px;
                                padding: 4px 8px;
                                border: 1px solid #ced4da;
                                border-radius: 4px;
                                font-size: 12px;
                                margin-left: 10px;
                            `;
                            
                            // 为背景图链接添加长按预览功能
                            if ((prop.originalName.includes('background-image') || 
                                 prop.originalName.includes('background')) && 
                                prop.value.includes('url(')) {
                                let pressTimer;
                                
                                propName.addEventListener('mousedown', function() {
                                    pressTimer = setTimeout(function() {
                                        // 提取URL
                                        const urlMatch = prop.value.match(/url\(['"]?(.*?)['"]?\)/);
                                        if (urlMatch && urlMatch[1]) {
                                            const imageUrl = urlMatch[1];
                                            // 创建预览弹窗
                                            const previewModal = document.createElement('div');
                                            previewModal.style.cssText = `
                                                position: fixed;
                                                top: 50%;
                                                left: 50%;
                                                transform: translate(-50%, -50%);
                                                background: white;
                                                padding: 20px;
                                                border-radius: 8px;
                                                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                                                z-index: 9999;
                                                max-width: 90vw;
                                                max-height: 90vh;
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                            `;
                                             
                                            const overlay = document.createElement('div');
                                            overlay.style.cssText = `
                                                position: fixed;
                                                top: 0;
                                                left: 0;
                                                right: 0;
                                                bottom: 0;
                                                background: rgba(0,0,0,0.5);
                                                z-index: 9998;
                                            `;
                                             
                                            const closeBtn = document.createElement('button');
                                            closeBtn.textContent = '关闭';
                                            closeBtn.style.cssText = `
                                                position: absolute;
                                                top: 10px;
                                                right: 10px;
                                                background: #dc3545;
                                                color: white;
                                                border: none;
                                                border-radius: 4px;
                                                padding: 5px 10px;
                                                cursor: pointer;
                                                font-size: 12px;
                                            `;
                                            closeBtn.addEventListener('click', function() {
                                                try {
                                                    document.body.removeChild(previewModal);
                                                    document.body.removeChild(overlay);
                                                } catch (e) {
                                                    console.log('已移除预览元素');
                                                }
                                            });
                                             
                                            const imgContainer = document.createElement('div');
                                            imgContainer.style.cssText = `
                                                max-width: 100%;
                                                max-height: 70vh;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                margin: 10px 0;
                                            `;
                                             
                                            const img = document.createElement('img');
                                            img.src = imageUrl;
                                            img.alt = '背景图预览';
                                            img.style.cssText = `
                                                max-width: 50vw;
                                                max-height: 50vh;
                                                object-fit: contain;
                                                max-width: 50%;
                                                max-height: 50%;
                                            `;
                                             
                                            const urlDisplay = document.createElement('div');
                                            urlDisplay.style.cssText = `
                                                font-size: 12px;
                                                color: #666;
                                                word-break: break-all;
                                                max-width: 100%;
                                                margin-top: 10px;
                                            `;
                                            urlDisplay.textContent = imageUrl;
                                             
                                            overlay.addEventListener('click', function() {
                                                try {
                                                    document.body.removeChild(previewModal);
                                                    document.body.removeChild(overlay);
                                                } catch (e) {
                                                    console.log('已移除预览元素');
                                                }
                                            });
                                             
                                            imgContainer.appendChild(img);
                                            previewModal.appendChild(closeBtn);
                                            previewModal.appendChild(imgContainer);
                                            previewModal.appendChild(urlDisplay);
                                             
                                            document.body.appendChild(overlay);
                                            document.body.appendChild(previewModal);
                                        }
                                    }, 800); // 800毫秒长按触发
                                });
                                
                                propName.addEventListener('mouseup', function() {
                                    clearTimeout(pressTimer);
                                });
                                
                                propName.addEventListener('mouseleave', function() {
                                    clearTimeout(pressTimer);
                                });
                            }
                            
                            propInput.addEventListener('change', function() {
                                applyCSSChange(this.dataset.selector, this.dataset.originalName, this.value);
                            });

                            propItem.appendChild(propName);
                            propItem.appendChild(propInput);
                            categoryContent.appendChild(propItem);
                        });

                        categoryContainer.appendChild(categoryContent);
                        propertiesList.appendChild(categoryContainer);

                        // 添加折叠/展开功能
                        let isCategoryExpanded = false;
                        categoryHeader.addEventListener('click', () => {
                            isCategoryExpanded = !isCategoryExpanded;
                            categoryContent.style.display = isCategoryExpanded ? 'block' : 'none';
                            categoryToggle.textContent = isCategoryExpanded ? '▼' : '►';
                        });
                    });
                }
                
                // 复制按钮已在analyzeAndDisplayProperties函数中添加

                ruleContainer.appendChild(propertiesList);
                rulesContainer.appendChild(ruleContainer);
                
                // 添加自定义事件监听器，用于全部展开时触发分析
                ruleContainer.addEventListener('analyze-content', () => {
                    analyzeAndDisplayProperties();
                });
                
                // 折叠/展开功能
                let isExpanded = false; // 默认折叠状态
                propertiesList.style.display = 'none'; // 默认隐藏内容
                toggleBtn.textContent = '►'; // 默认显示展开图标
                
                function toggleExpansion() {
                    isExpanded = !isExpanded;
                    propertiesList.style.display = isExpanded ? 'block' : 'none';
                    toggleBtn.textContent = isExpanded ? '▼' : '►';
                    
                    // 只有在展开时才分析内容
                    if (isExpanded) {
                        analyzeAndDisplayProperties();
                    }
                }
                
                selectorHeaderContainer.addEventListener('click', (e) => {
                    // 如果点击的是按钮，不触发折叠/展开
                    if (!e.target.closest('button')) {
                        toggleExpansion();
                    }
                });
                
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleExpansion();
                });
            });
            
            // 全部折叠/展开功能
            let allExpanded = false; // 默认全部折叠
            toggleAllBtn.textContent = '展开所有'; // 默认显示展开所有
            
            toggleAllBtn.addEventListener('click', () => {
                allExpanded = !allExpanded;
                const ruleItems = document.querySelectorAll('.css-analyzer-rule-item');
                const contents = document.querySelectorAll('.css-analyzer-properties-content');
                const toggleBtns = document.querySelectorAll('.css-analyzer-rule-header button:first-child');
                
                contents.forEach((content, index) => {
                    content.style.display = allExpanded ? 'block' : 'none';
                    
                    // 如果是展开状态，则分析内容
                    if (allExpanded) {
                        const ruleContainer = ruleItems[index];
                        if (ruleContainer && ruleContainer.dataset.analyzed === 'false') {
                            // 触发自定义事件来分析内容
                            const event = new CustomEvent('analyze-content', { detail: { index } });
                            ruleContainer.dispatchEvent(event);
                        }
                    }
                });
                
                toggleBtns.forEach(btn => {
                    btn.textContent = allExpanded ? '▼' : '►';
                });
                
                toggleAllBtn.textContent = allExpanded ? '折叠所有' : '展开所有';
            });
            
            // 显示被隐藏的容器按钮（在分析界面中）
            const showHiddenBtn = document.createElement('button');
            showHiddenBtn.textContent = '显示被隐藏的容器';
            showHiddenBtn.style.cssText = `
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 12px;
            `;
            showHiddenBtn.addEventListener('click', () => {
                // 显示在分析界面中所有被隐藏的规则容器
                const hiddenContainers = document.querySelectorAll('.css-analyzer-rule-item[style*="display: none"]');
                hiddenContainers.forEach(container => {
                    container.style.display = '';
                });
                showNotification(`已显示 ${hiddenContainers.length} 个被隐藏的容器`);
            });
            buttonsContainer.appendChild(showHiddenBtn);

            // 创建教程按钮，放在显示被隐藏容器按钮右侧
            const tutorialBtn = document.createElement('button');
            tutorialBtn.textContent = '教程';
            tutorialBtn.style.cssText = `
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 12px;
            `;
            tutorialBtn.addEventListener('click', () => {
                // 创建一个自定义的弹窗，不会自动消失
                const tutorialModal = document.createElement('div');
                tutorialModal.id = 'css-analyzer-tutorial-modal';
                tutorialModal.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 85vh;
                    overflow-y: auto;
                    z-index: 10001;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-size: 14px;
                `;

                // 创建标题
                const modalTitle = document.createElement('h3');
                modalTitle.textContent = 'CSS属性分析器使用教程';
                modalTitle.style.cssText = `
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #007bff;
                    font-size: 18px;
                `;

                // 创建教程内容
                const tutorialContent = document.createElement('div');
                tutorialContent.style.cssText = `
                    margin-bottom: 20px;
                    line-height: 1.8;
                `;
                tutorialContent.innerHTML = `
                    <p style="margin-bottom: 10px;"><strong>界面功能详解：</strong></p>
                    <ul style="margin-bottom: 15px; padding-left: 20px;">
                        <li style="margin-bottom: 8px;"><strong>刷新按钮：</strong>重新加载并分析当前页面的CSS规则，更新所有选择器和属性信息</li>
                        <li style="margin-bottom: 8px;"><strong>标准/高级模式：</strong>切换不同的CSS分析和显示模式，高级模式提供更详细的CSS分析但可能影响性能</li>
                        <li style="margin-bottom: 8px;"><strong>手动选择元素：</strong>点击后进入选择模式，可直接在页面上点击选择需要分析的元素</li>
                        <li style="margin-bottom: 8px;"><strong>搜索框：</strong>输入关键词快速查找包含特定选择器的CSS规则</li>
                        <li style="margin-bottom: 8px;"><strong>定位按钮：</strong>点击后在页面上高亮显示对应选择器的所有元素，帮助确认选择器匹配情况</li>
                        <li style="margin-bottom: 8px;"><strong>折叠/展开：</strong>可单独折叠或展开单个选择器的属性列表，也可批量操作全部展开/折叠</li>
                        <li style="margin-bottom: 8px;"><strong>蒙版按钮：</strong>为选择器创建唯一class图层，避免全局污染问题</li>
                        <li style="margin-bottom: 8px;"><strong>重置按钮：</strong>清空搜索框内容，恢复显示所有CSS规则</li>
                        <li style="margin-bottom: 8px;"><strong>恢复蒙版按钮：</strong>恢复已创建的蒙版样式，使其再次生效</li>
                        <li style="margin-bottom: 8px;"><strong>显示被隐藏的容器：</strong>查看被隐藏的CSS规则容器</li>
                    </ul>
                    
                    <p style="margin-bottom: 10px;"><strong>新人操作教程 (5步快速上手)：</strong></p>
                    <ol style="margin-bottom: 15px; padding-left: 20px;">
                        <li style="margin-bottom: 8px;"><strong>选择元素</strong>：点击右上角的「手动选择元素」按钮，然后在页面上点击您想更改的状态栏或其他元素</li>
                        <li style="margin-bottom: 8px;"><strong>定位验证</strong>：点击选择器旁边的「定位」按钮，可以验证该选择器是否正确匹配了您想更改的元素（此步骤可忽略）</li>
                        <li style="margin-bottom: 8px;"><strong>修改属性</strong>：展开选择器下方的属性列表，可以直接修改对应的属性值，修改后会实时生效</li>
                        <li style="margin-bottom: 8px;"><strong>重置处理</strong>：如果修改出现全局污染问题，请先点击对应选择器的「重置」按钮，等待网页刷新后，直接跳到第5步</li>
                        <li style="margin-bottom: 8px;"><strong>创建蒙版与刷新</strong>：点击对应选择器的「蒙版」按钮，它会创建一个唯一class图层避免全局污染，创建成功后点击右上角「刷新」按钮，新图层的选择器就会更新出来，此时再回到第3步继续修改即可</li>
                    </ol>
                    
                    <p style="margin-bottom: 10px;"><strong>使用提示：</strong></p>
                    <ul style="padding-left: 20px;">
                        <li style="margin-bottom: 8px;">定位功能使用黄色高亮显示匹配元素，可帮助确认选择器是否正确</li>
                        <li style="margin-bottom: 8px;">修改属性后会实时显示效果，所有修改会自动保存到本地存储</li>
                        <li style="margin-bottom: 8px;">网页刷新后，所有修改仍然有效，无需重新配置</li>
                        <li style="margin-bottom: 8px;">蒙版功能是防止样式全局污染的重要工具，特别是在修改基础元素（如div）时</li>
                        <li style="margin-bottom: 8px;">背景图片等特殊属性支持完整保留，不会出现链接改变或样式丢失问题</li>
                        <li style="margin-bottom: 8px;">标准模式下只会分析特定容器内的元素，提高性能</li>
                        <li style="margin-bottom: 8px;">高级模式下，会显示整个网页的所有CSS，对于设备不好的情况下，不建议使用</li>
                        <li style="margin-bottom: 8px;"><strong>重点：</strong>数据默认是自动保存的，点击选择器重置按钮，才会重置数据，需要注意，点击重置按钮会刷新一次网页！</li>
                    </ul>
                `;

                // 创建关闭按钮
                const closeModalBtn = document.createElement('button');
                closeModalBtn.textContent = '关闭';
                closeModalBtn.style.cssText = `
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 14px;
                    display: block;
                    margin: 0 auto;
                `;
                closeModalBtn.addEventListener('click', () => {
                    tutorialModal.remove();
                    modalOverlay.remove();
                });

                // 创建遮罩层
                const modalOverlay = document.createElement('div');
                modalOverlay.id = 'css-analyzer-tutorial-overlay';
                modalOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                `;

                // 组装弹窗
                tutorialModal.appendChild(modalTitle);
                tutorialModal.appendChild(tutorialContent);
                tutorialModal.appendChild(closeModalBtn);
                document.body.appendChild(modalOverlay);
                document.body.appendChild(tutorialModal);
            });
            buttonsContainer.appendChild(tutorialBtn);
            
            // 将按钮容器添加到搜索容器下方
            searchContainer.parentNode.insertBefore(buttonsContainer, searchContainer.nextSibling);
        }
        
        panel.appendChild(rulesContainer);

        // 添加到页面
        document.body.appendChild(panel);
        
        // 创建并应用日夜间模式切换开关
        createModeToggle();
        applySavedTheme();
        
        // 实现搜索功能
        function performSearch(keyword) {
            const ruleItems = document.querySelectorAll('.css-analyzer-rule-item');
            let visibleCount = 0;
            
            ruleItems.forEach(item => {
                const selector = item.dataset.selector;
                if (selector.toLowerCase().includes(keyword.toLowerCase())) {
                    item.style.display = 'block';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // 显示搜索结果统计
            const statsElement = document.getElementById('css-analyzer-search-stats');
            if (statsElement) {
                statsElement.remove();
            }
            
            const stats = document.createElement('div');
            stats.id = 'css-analyzer-search-stats';
            stats.textContent = `找到 ${visibleCount} 个匹配的选择器`;
            stats.style.cssText = `
                margin-bottom: 10px;
                color: #666;
                font-size: 12px;
                text-align: right;
            `;
            
            searchContainer.parentNode.insertBefore(stats, searchContainer.nextSibling);
        }
        
        // 搜索按钮事件
        searchBtn.addEventListener('click', () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                performSearch(keyword);
            }
        });
        
        // 搜索框回车事件
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    performSearch(keyword);
                }
            }
        });
        
        // 重置按钮事件
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            const ruleItems = document.querySelectorAll('.css-analyzer-rule-item');
            ruleItems.forEach(item => {
                item.style.display = 'block';
            });
            
            const statsElement = document.getElementById('css-analyzer-search-stats');
            if (statsElement) {
                statsElement.remove();
            }
        });
    }

    // 为带有内联style属性但没有class的元素添加唯一class的映射存储
    let styledElementsMap = JSON.parse(localStorage.getItem('css-analyzer-styled-elements') || '{}');

    // 存储原始标签选择器，避免重复应用
    let originalSelectorsMap = {};

    // 应用CSS更改
    function applyCSSChange(selector, property, value) {
        // 查找已有的样式表或创建新的
        let styleSheet = document.getElementById('css-analyzer-styles');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'css-analyzer-styles';
            document.head.appendChild(styleSheet);
        }

        // 检查是否是简单的标签选择器（如div）并且没有class或id
        let finalSelector = selector;
        let isOriginalTagSelector = false;
        
        // 检查是否是原始标签选择器
        if (/^[a-zA-Z0-9]+$/.test(selector) && !selector.includes('.') && !selector.includes('#')) {
            isOriginalTagSelector = true;
            
            // 检查是否已经为此选择器创建过映射
            const mappedClass = Object.keys(styledElementsMap).find(key => styledElementsMap[key] === selector);
            
            if (mappedClass) {
                // 已经有映射，使用映射的class选择器
                finalSelector = `.${mappedClass}`;
            } else {
                // 创建新的唯一class
                const newMappedClass = `css-analyzer-${selector}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                styledElementsMap[newMappedClass] = selector;
                localStorage.setItem('css-analyzer-styled-elements', JSON.stringify(styledElementsMap));
                
                // 为符合条件的元素添加class
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // 只处理没有class但有内联style的元素
                    if (!element.className && element.hasAttribute('style')) {
                        element.classList.add(newMappedClass);
                    }
                });
                
                finalSelector = `.${newMappedClass}`;
            }
        }

        // 获取现有规则
        const existingRules = styleSheet.sheet.cssRules;
        let found = false;

        // 检查是否已有针对该选择器的规则
        for (let i = 0; i < existingRules.length; i++) {
            const rule = existingRules[i];
            if (rule.type === CSSRule.STYLE_RULE && rule.selectorText === finalSelector) {
                // 更新现有规则
                rule.style.setProperty(property, value);
                found = true;
                break;
            }
        }

        // 如果没有找到规则，创建新的
        if (!found) {
            // 确保使用的是class选择器而不是原始标签选择器
            styleSheet.sheet.insertRule(`${finalSelector} { ${property}: ${value} !important; }`, existingRules.length);
        }

        // 保存到本地存储
        saveCSSChanges(finalSelector, property, value);

        // 显示应用成功的提示
        showNotification('CSS属性已更新并保存');
    }

    // 保存CSS更改到本地存储
    function saveCSSChanges(selector, property, value) {
        // 获取现有的保存数据
        const savedStyles = JSON.parse(localStorage.getItem('css-analyzer-styles') || '{}');
        
        // 如果该选择器没有保存的数据，创建一个新对象
        if (!savedStyles[selector]) {
            savedStyles[selector] = {};
        }
        
        // 保存属性和值
        savedStyles[selector][property] = value;
        
        // 存储回localStorage
        localStorage.setItem('css-analyzer-styles', JSON.stringify(savedStyles));
    }

    // 加载保存的CSS更改
    function loadCSSChanges() {
        const savedStyles = JSON.parse(localStorage.getItem('css-analyzer-styles') || '{}');
        
        // 查找已有的样式表或创建新的
        let styleSheet = document.getElementById('css-analyzer-styles');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'css-analyzer-styles';
            document.head.appendChild(styleSheet);
        }
        
        // 应用所有保存的样式
        Object.keys(savedStyles).forEach(selector => {
            const properties = savedStyles[selector];
            Object.keys(properties).forEach(property => {
                const value = properties[property];
                
                // 创建规则字符串
                const ruleText = `${selector} { ${property}: ${value} !important; }`;
                
                // 检查是否已有该规则
                let ruleExists = false;
                const existingRules = styleSheet.sheet.cssRules;
                
                for (let i = 0; i < existingRules.length; i++) {
                    const rule = existingRules[i];
                    if (rule.type === CSSRule.STYLE_RULE && rule.selectorText === selector && 
                        rule.style.getPropertyValue(property) === value) {
                        ruleExists = true;
                        break;
                    }
                }
                
                // 如果规则不存在，添加它
                if (!ruleExists) {
                    try {
                        styleSheet.sheet.insertRule(ruleText, existingRules.length);
                    } catch (e) {
                        console.error('Failed to load saved CSS rule:', ruleText, e);
                    }
                }
            });
        });
    }

    // 显示通知
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: fadeInOut 2s ease-in-out;
        `;

        // 添加动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -20px); }
                20% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);

        document。body。appendChild(notification);

        // 2秒后移除通知
        setTimeout(() => {
            notification。remove();
            style。remove();
        }， 2000);
    }

    /* ========= 注意：CSS属性分析器已完全绑定到猫猫岛智能工具箱 ========= */
    // 本脚本仅能通过工具箱的"启动CSS属性分析器"按钮启动
    // 已移除独立的启动方式，确保功能集成性
    /* ========================================================== */
    
    // 添加调试信息
    console。log('CSS属性分析器脚本加载成功，已完全绑定到工具箱，准备暴露全局对象');
    
    // 确保在window对象上创建cssPropertyAnalyzer
    try {
        // 暴露全局对象，以便其他脚本可以调用CSS属性分析器的功能
        window。cssPropertyAnalyzer = window。cssPropertyAnalyzer || {
            initialize: function() {
                console。log('CSS属性分析器：initialize方法被调用');
                const analyzedRules = findContentLeftCSS();
                createUI(analyzedRules);
                // 加载保存的CSS更改
                loadCSSChanges();
                return true;
            }，
            findContentLeftCSS: findContentLeftCSS，
            createUI: createUI，
            loadCSSChanges: loadCSSChanges,
            toggleDarkMode: toggleDarkMode，
            applySavedTheme: applySavedTheme
        };
        
        // 额外添加到unsafeWindow，确保在不同的油猴环境中都能访问
        if (typeof unsafeWindow !== 'undefined') {
            unsafeWindow。cssPropertyAnalyzer = window。cssPropertyAnalyzer;
        }
        
        console。log('CSS属性分析器：全局对象暴露成功');
    } catch (error) {
        console。error('CSS属性分析器：全局对象暴露失败:'， error);
    }
})();
