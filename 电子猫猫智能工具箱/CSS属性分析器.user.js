// ==UserScript==
// @name         CSS属性分析器
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      2.0.0
// @description  分析页面中的CSS属性，转换为中文解释，并提供可视化编辑界面（优化版：默认只分析特定容器）
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
        'border-width': '边框宽度'，
        'border-style': '边框样式',
        'border-color': '边框颜色',
        'border-top': '上边框',
        'border-right': '右边框'，
        'border-bottom': '下边框',
        'border-left': '左边框',
        'border-radius': '边框圆角',
        'border-top-left-radius': '左上圆角',
        'border-top-right-radius': '右上圆角',
        'border-bottom-right-radius': '右下圆角',
        'border-bottom-left-radius': '左下圆角'，
        
        // 边距相关
        'margin': '外边距',
        'margin-top': '上外边距',
        'margin-right': '右外边距'，
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
        'min-width': '最小宽度',
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
                    'background', 'background-color', 'color', 'font-size', 'font-family', 'font-weight',
                    'width', 'height', 'margin', 'padding', 'border', 'border-radius',
                    'position', 'top', 'right', 'bottom', 'left', 'display', 'opacity',
                    'text-align', 'line-height', 'box-shadow', 'text-shadow', 'transform'
                ];
                
                for (let i = 0; i < commonProperties.length; i++) {
                    const propName = commonProperties[i];
                    const propValue = computedStyle.getPropertyValue(propName);
                    if (propValue && propValue.trim() !== '') {
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
                config。advancedMode = !config.advancedMode;
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
            selectElementBtn.addEventListener('click'， () => {
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
        
        searchContainer.appendChild(searchLabel);
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchBtn);
        searchContainer.appendChild(resetBtn);
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
                ruleContainer。style.cssText = `
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
                selectorHeader.textContent = `选择器: ${rule。selector}`;
                selectorHeader.style。cssText = `
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
                
                // 不显示这个容器按钮（在分析界面中隐藏）
                const hideContainerBtn = document.createElement('button');
                hideContainerBtn.textContent = '隐藏';
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
                    ruleContainer.style。display = 'none';
                    showNotification('已在分析界面中隐藏该容器');
                });
                
                actionsContainer.appendChild(toggleBtn);
                actionsContainer。appendChild(locateBtn);
                actionsContainer.appendChild(resetBtn);
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
                                        ruleSelector.textContent = cssRule.selectorText;
                                        ruleSelector.style.cssText = `
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
                                            propLine.style.cssText = `
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
                                console.error('解析style标签内容失败:', error);
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
                    const copyBtn = document.createElement('button');
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
                        rule.properties.forEach(prop => {
                            cssText += `${prop.originalName}: ${prop.value} !important;\n`;
                        });
                        navigator.clipboard.writeText(cssText).then(() => {
                            showNotification('已复制所有CSS属性到剪贴板');
                        }).catch(err => {
                            showNotification('复制失败，请手动选择复制');
                        });
                    });
                    propertiesList.appendChild(copyBtn);
                }
                
                // 显示普通属性的函数
                function displayNormalProperties() {
                    rule.properties.forEach((prop, propIndex) => {
                        const propItem = document.createElement('div');
                        propItem.style.cssText = `
                            margin-bottom: 8px;
                            padding: 8px;
                            background: white;
                            border-radius: 4px;
                            border: 1px solid #e9ecef;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                        `;
    
                        const propName = document.createElement('div');
                        propName.style.cssText = `
                            flex: 1;
                            font-weight: 500;
                            color: #495057;
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
                        propInput.addEventListener('change', function() {
                            applyCSSChange(this.dataset.selector, this.dataset.originalName, this.value);
                        });
    
                        propItem.appendChild(propName);
                        propItem.appendChild(propInput);
                        propertiesList.appendChild(propItem);
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
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    z-index: 10001;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
                    line-height: 1.6;
                `;
                tutorialContent.innerHTML = `
                    <p style="margin-bottom: 10px;"><strong>功能介绍：</strong></p>
                    <ol style="margin-bottom: 15px; padding-left: 20px;">
                        <li style="margin-bottom: 8px;"><strong>刷新按钮：</strong>重新分析页面CSS</li>
                        <li style="margin-bottom: 8px;"><strong>标准/高级模式：</strong>切换分析模式</li>
                        <li style="margin-bottom: 8px;"><strong>手动选择元素：</strong>点击页面上的元素进行分析</li>
                        <li style="margin-bottom: 8px;"><strong>搜索框：</strong>搜索特定选择器</li>
                        <li style="margin-bottom: 8px;"><strong>定位按钮：</strong>高亮显示对应元素</li>
                        <li style="margin-bottom: 8px;"><strong>折叠/展开：</strong>查看/隐藏CSS属性详情</li>
                    </ol>
                    <p style="margin-bottom: 10px;"><strong>使用提示：</strong></p>
                    <ul style="padding-left: 20px;">
                        <li style="margin-bottom: 8px;">点击元素的"定位"按钮可以在页面中高亮显示该元素</li>
                        <li style="margin-bottom: 8px;">可以直接修改CSS属性值并实时应用到页面</li>
                        <li style="margin-bottom: 8px;">标准模式下只会分析特定容器内的元素，提高性能</li>
                        <li style="margin-bottom: 8px;">高级模式下，会显示整个网页的所有的css，对于设备不好的情况下，不建议使用</li>
                        <li style="margin-bottom: 8px;">重点：数据默认是自动保存的，点击选择器重置按钮，才会重置数据，需要注意，点击重置按钮会刷新一次网页！！！</li>
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
        searchBtn.addEventListener('click'， () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                performSearch(keyword);
            }
        });
        
        // 搜索框回车事件
        searchInput。addEventListener('keypress'， (e) => {
            if (e.key === 'Enter') {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    performSearch(keyword);
                }
            }
        });
        
        // 重置按钮事件
        resetBtn。addEventListener('click'， () => {
            searchInput。value = '';
            const ruleItems = document.querySelectorAll('.css-analyzer-rule-item');
            ruleItems。forEach(item => {
                item。style.display = 'block';
            });
            
            const statsElement = document.getElementById('css-analyzer-search-stats');
            if (statsElement) {
                statsElement。remove();
            }
        });
    }

    // 应用CSS更改
    function applyCSSChange(selector, property, value) {
        // 查找已有的样式表或创建新的
        let styleSheet = document.getElementById('css-analyzer-styles');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'css-analyzer-styles';
            document。head.appendChild(styleSheet);
        }

        // 获取现有规则
        const existingRules = styleSheet.sheet.cssRules;
        let found = false;

        // 检查是否已有针对该选择器的规则
        for (let i = 0; i < existingRules.length; i++) {
            const rule = existingRules[i];
            if (rule.type === CSSRule.STYLE_RULE && rule.selectorText === selector) {
                // 更新现有规则
                rule.style.setProperty(property, value);
                found = true;
                break;
            }
        }

        // 如果没有找到规则，创建新的
        if (!found) {
            styleSheet.sheet.insertRule(`${selector} { ${property}: ${value} !important; }`, existingRules.length);
        }

        // 保存到本地存储
        saveCSSChanges(selector, property, value);

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
        style。textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -20px); }
                20% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head。appendChild(style);

        document。body。appendChild(notification);

        // 2秒后移除通知
        setTimeout(() => {
            notification。remove();
            style。remove();
        }， 2000);
    }

    // 注册油猴菜单命令
    GM_registerMenuCommand('启动CSS属性分析器'， () => {
        const analyzedRules = findContentLeftCSS();
        createUI(analyzedRules);
        // 加载保存的CSS更改
        loadCSSChanges();
    });

    // 添加快捷键支持
    document。addEventListener('keydown'， (e) => {
        // Ctrl+Alt+C 启动分析器
        if (e。ctrlKey && e。altKey && e。key === 'c') {
            e。preventDefault();
            const analyzedRules = findContentLeftCSS();
            createUI(analyzedRules);
            // 加载保存的CSS更改
            loadCSSChanges();
        }
    });

    /* ========= 本地测试说明 ========= */
    // 1. 双击运行"启动本地服务器.bat"
    // 2. 浏览器会自动打开本地服务器页面
    // 3. 点击"CSS测试示例.html"文件
    // 4. 启动油猴脚本（通过菜单或快捷键Ctrl+Alt+C）
    // 5. 开始测试和使用CSS属性分析器功能
    // 6. 测试完成后，在命令窗口按Ctrl+C停止服务器
    /* =============================== */
})();
