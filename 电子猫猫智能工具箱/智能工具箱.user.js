// ==UserScript==
// @name         猫猫岛智能工具箱-正式完整版
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      6.0.0
// @description  移除未试装的功能，新增无图模式、隐藏评分功能
// @author       苏子言
// @match        *://*.meimoai10.com/*
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai*.com/*
// @match        *://*.meimodao.*/*
// @match        *://*.meimodao.com/*
// @match        *://*.meimoai8.com/*
// @match        *://*.meimoai7.com/*
// @connect      github.com
// @connect      api.github.com
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      sexyai.top
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        unsafeWindow
// @run-at       document-end
// @license      MIT
// @icon         https://postimage.me/images/2025/02/08/63b806f8056dc1522b2ff18bdf4f9a9e.th.jpg
// ==/UserScript==

// 立即执行函数，创建一个独立的作用域，避免全局变量污染
(function() {
    'use strict';
    // 判断是否为移动端设备
    const isMobile = (() => {
        // 使用缓存避免重复检测
        if (typeof window._isMobile !== 'undefined') {
            return window._isMobile;
        }
        const MOBILE_REGEX = /\b(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)\b/i;
        const isMobile = MOBILE_REGEX.test(navigator.userAgent);
        // 缓存检测结果
        window._isMobile = isMobile;
        return isMobile;
    })();
    // 定义域名匹配模式，用于匹配目标域名 (添加可能的域名后缀)
    const domainPattern = /(meimoai\d+|sexyai|meimodao)\.(com|top|net)/i;
    // 检查域名和路径
    function checkDomainAndPath() {
        // 检查域名
        if (!domainPattern.test(location.hostname)) {
            console.log('[屏蔽系统] 非目标域名，退出执行');
            return false;
        }
        // 检查路径
        if (location.pathname === '' && location.hash === '#/') {
            console.log('[屏蔽系统] 匹配特定路径: #/');
        }
        return true;
    }
    // 检查当前页面是否符合执行条件
    if (!checkDomainAndPath()) {
        return;
    }
    /* ========================== 自动更新模块 ========================== */
    // 获取当前脚本版本（从元数据自动读取）
    const CURRENT_VERSION = GM_info.script.version;
    const GITHUB_REPO = 'Suziyan-528/SZY-DZMM';
    const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时检查一次
    // 检查更新逻辑
    function checkForUpdates() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/vnd.github.v3+json'
            },
            onload: (response) => {
                try {
                    const latest = JSON.parse(response.responseText);
                    const latestVersion = latest.tag_name;

                    // 检查 latestVersion 是否存在
                    if (!latestVersion) {
                        console.error('[更新检查] 无法获取最新版本号，响应数据可能不包含 tag_name 属性');
                        return;
                    }
                    // 版本号比较（支持x.y.z格式）
                    if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
                        showUpdateNotification(latest);
                    } else {
                        console.log('[更新检查] 已是最新版本');
                    }
                } catch (error) {
                    console.error('[更新检查] 失败', error);
                }
            },
            onerror: (response) => {
                console.error('[更新检查] 网络请求失败，状态码:', response.status);
            }
        });
    }
    // 版本号比较函数
    function isNewerVersion(latest, current) {
        // 移除 "V" 前缀并分割
        const l = latest.replace(/^V/i, '').split('.').map(Number);
        const c = current.replace(/^V/i, '').split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (l[i] > c[i]) return true;
            if (l[i] < c[i]) return false;
        }
        return false;
    }
    // 显示更新通知UI
    function showUpdateNotification(latest) {
        // 清理旧更新条
        const existingBar = document.getElementById('update-notification-bar');
        if (existingBar) {
            existingBar.remove();
        }
        const updateBar = document.createElement('div');
        updateBar.id = 'update-notification-bar'; // 唯一标识
        updateBar.style.cssText = `
            padding: 12px;
            background: #ffeb3b;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
        `;
        updateBar.innerHTML = `
            <strong>发现新版本 ${latest.tag_name}！</strong><br>
            ${latest.body.split('\n').map(line => `<span>${line}</span>`).join('<br>')}<br>
            <a href="${latest.html_url}" target="_blank" style="color: #007bff; text-decoration: underline;">立即更新</a>
        `;
        const panel = document.getElementById('smart-shield-panel');
        if (panel) {
            panel.insertBefore(updateBar, panel.firstChild);
        }
    }
    /* ========================== 基础配置系统 ========================== */
    //基础配置对象
    const CONFIG = {
        // 分类配置 (可自由增减)
        CATEGORIES: {
            author: {
                selector: `.item .item-author, .item-list .item-author`, // 精确匹配两种布局
                storageKey: 'GLOBAL_AUTHOR_KEYS',
                label: '👤 作者屏蔽',
                matchType: 'exact',
                processText: (text) => {
                    return text
                        .replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
                        .replace(/^(作者：|Author:\s*)/i, '')
                        .trim();
                }
            },
            title: {
                selector: '.item-title-scope',
                storageKey: 'GLOBAL_TITLE_KEYS',
                label: '📌 标题屏蔽',
                matchType: 'fuzzy',
                processText: (text) => {
                    return text
                        .replace(/【.*?】/g, '') // 去除特殊符号
                        .trim();
                }
            },
            description: {
                selector: '.item-des',
                // 用于选择简介元素的 CSS 选择器
                storageKey: 'GLOBAL_DESC_KEYS',
                // 存储简介屏蔽关键词的键名
                label: '📝 简介屏蔽',
                // 显示在 UI 上的标签
                matchType: 'regex'
                // 匹配类型为正则表达式匹配
            }
        },
        // 高级配置
        PARENT_SELECTOR: 'uni-view.item, uni-view.item-list, .item, .item-list',
        // 父元素的 CSS 选择器，用于隐藏匹配元素的父元素
        HOTKEY: 'Ctrl+Shift+a',
        // 打开屏蔽面板的快捷键
        Z_INDEX: 2147483647,
        // 屏蔽面板的 z-index 值，确保面板显示在最上层
        DEBOUNCE: 300
        // 防抖时间，暂未使用
    };
    //通用通知函数
    function showNotification(message, duration = 1500) {
        if (!document.body) return;
        const notification = document.createElement('div');
        notification.className = 'quick-shield-notification';
        notification.textContent = message;
        notification.style.cssText = `            
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 16px;
            border-radius: 4px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;          
        `;
        document.body.appendChild(notification);
        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        // 隐藏并移除通知
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration); // 默认持续时间 1500ms
    }
    //导出配置
    function exportConfig() {
        const exportData = {
            categories: CONFIG.CATEGORIES,
            tagShieldState: new TagShield(false).state
        };
        const jsonData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'smart_toolbox_config.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    //更新分类配置后，重新执行屏蔽逻辑
    function applyCategoryConfig() {
        Object.values(CONFIG.CATEGORIES).forEach(category => {
            const keywords = GM_getValue(category.storageKey, []);
            const elements = document.querySelectorAll(category.selector);
            elements.forEach(element => {
                const text = element.textContent;
                if (category.matchType === 'exact') {
                    if (keywords.includes(text)) {
                        element.style.display = 'none';
                    }
                } else if (category.matchType === 'fuzzy') {
                    if (keywords.some(keyword => text.includes(keyword))) {
                        element.style.display = 'none';
                    }
                } else if (category.matchType === 'regex') {
                    if (keywords.some(keyword => new RegExp(keyword).test(text))) {
                        element.style.display = 'none';
                    }
                }
            });
        });
    }
    /* ========================== 标签屏蔽系统 ========================== */
    class TagShield {
        constructor(autoExecute = false) {
            // 配置存储键名
            this.STORAGE_KEYS = {
                authorTag: 'HIDE_AUTHOR_TAG',
                usageTag: 'HIDE_USAGE_TAG',
                originTag: 'HIDE_ORIGIN_TAG',
                scoreTag: 'HIDE_SCORE_TAG',
                imageTag: 'HIDE_IMAGE_TAG'
            };
            // 初始化开关状态
            this.state = {
                hideAuthorTag: GM_getValue(this.STORAGE_KEYS.authorTag, false),
                hideUsageTag: GM_getValue(this.STORAGE_KEYS.usageTag, false),
                hideOriginTag: GM_getValue(this.STORAGE_KEYS.originTag, false),
                hideScoreTag: GM_getValue(this.STORAGE_KEYS.scoreTag, false),
                hideImageTag: false // 强制设置为false，确保初始状态不会屏蔽图片
            };
            // 初始化注入标记
            this.injected = false;
            // 面板ID，用于唯一标识
            this.panelId = 'tag-shield-panel';
            // 折叠容器ID
            this.collapsibleId = 'tag-shield-collapsible';
            // 如果已有面板则注入UI
            this.tryInjectUI();
            // 使用单次检查的MutationObserver
            this.observer = new MutationObserver(() => {
                this.tryInjectUI();
            });
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
            
            // 只有在明确指定时才自动执行屏蔽
            if (autoExecute) {
                this.execute();
            }
        }
        // 尝试注入UI，增加了更严格的检查
        tryInjectUI() {
            // 如果已经注入或面板不存在则返回
            if (this.injected || !document.getElementById('smart-shield-panel')) return;
            // 检查是否存在标签屏蔽面板
            const existingPanel = document.getElementById(this.panelId);
            if (existingPanel) {
                this.injected = true;
                return;
            }
            // 执行注入
            this.injectUI();
        }
        // 执行标签屏蔽
        execute() {
            this.toggleTag('.item-author', this.state.hideAuthorTag);
            this.toggleTag('.item-usage', this.state.hideUsageTag);
            this.toggleTag('.item-score', this.state.hideScoreTag);
            this.toggleOriginTag(this.state.hideOriginTag); // 新增屏蔽逻辑
            this.toggleImageTags(this.state.hideImageTag); // 屏蔽图片标签
            this.injectStyle(); // 注入样式
        }
        // 通用标签显示/隐藏控制
        toggleTag(selector, shouldHide) {
            document.querySelectorAll(selector).forEach(el => {
                if (shouldHide) {
                    // 记录原始尺寸和样式
                    el.dataset.originalWidth = el.style.width || 'auto';
                    el.dataset.originalHeight = el.style.height || 'auto';
                    el.dataset.originalVisibility = el.style.visibility || 'visible';
                    el.dataset.originalOpacity = el.style.opacity || '1';
                    el.dataset.originalFlex = el.style.flex || '';
                    el.dataset.originalMargin = el.style.margin || '';
                    // 保持布局占位
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('width', `${el.offsetWidth}px`, 'important');
                    el.style.setProperty('height', `${el.offsetHeight}px`, 'important');
                    el.style.setProperty('flex', '0 0 auto', 'important');  // 防止flex压缩空间
                    el.style.setProperty('margin', '0', 'important');         // 消除边距影响
                } else {
                    // 增强的恢复逻辑，确保样式完全清除
                    // 移除所有内联样式
                    el.style.visibility = '';
                    el.style.opacity = '';
                    el.style.width = '';
                    el.style.height = '';
                    el.style.flex = '';
                    el.style.margin = '';
                    
                    // 对于图片元素，额外确保重要样式被移除
                    if (['.item-img', '.header-role-img'].includes(selector)) {
                        // 强制清除important标记的样式
                        el.removeAttribute('style');
                        // 重新应用原始内联样式（如果有）
                        if (el.dataset.originalWidth !== 'auto' || 
                            el.dataset.originalHeight !== 'auto' ||
                            el.dataset.originalVisibility !== 'visible' ||
                            el.dataset.originalOpacity !== '1' ||
                            el.dataset.originalFlex ||
                            el.dataset.originalMargin) {
                            el.style.visibility = el.dataset.originalVisibility;
                            el.style.opacity = el.dataset.originalOpacity;
                            el.style.width = el.dataset.originalWidth;
                            el.style.height = el.dataset.originalHeight;
                            el.style.flex = el.dataset.originalFlex;
                            el.style.margin = el.dataset.originalMargin;
                        }
                    } else {
                        // 非图片元素使用setProperty恢复
                        el.style.setProperty('visibility', el.dataset.originalVisibility, '');
                        el.style.setProperty('opacity', el.dataset.originalOpacity, '');
                        el.style.setProperty('width', el.dataset.originalWidth, '');
                        el.style.setProperty('height', el.dataset.originalHeight, '');
                        el.style.setProperty('flex', el.dataset.originalFlex, '');
                        el.style.setProperty('margin', el.dataset.originalMargin, '');
                    }
                    
                    // 清除保存的数据，以便下次能重新捕获最新状态
                    delete el.dataset.originalWidth;
                    delete el.dataset.originalHeight;
                    delete el.dataset.originalVisibility;
                    delete el.dataset.originalOpacity;
                    delete el.dataset.originalFlex;
                    delete el.dataset.originalMargin;
                }
            });
        }
        toggleOriginTag(shouldHide) {
            document.querySelectorAll('.item-origin-type').forEach(originEl => {
                if (originEl.textContent.includes('转载')) {
                    if (shouldHide) {
                        const parentEl = originEl.closest('[id^="item"]');
                        if (parentEl) {
                            const itemId = parentEl.id;
                            const itemEl = document.getElementById(itemId);
                            if (itemEl) {
                                itemEl.dataset.originalDisplay = itemEl.style.display || 'block';
                                itemEl.style.display = 'none';
                            }
                        }
                    } else {
                        const parentEl = originEl.closest('[id^="item"]');
                        if (parentEl) {
                            const itemId = parentEl.id;
                            const itemEl = document.getElementById(itemId);
                            if (itemEl) {
                                itemEl.style.display = itemEl.dataset.originalDisplay;
                            }
                        }
                    }
                }
            });
        }
        // 屏蔽图片标签
        toggleImageTags(shouldHide) {
            // 屏蔽 item-img, header-role-img 标签
            const imageSelectors = ['.item-img', '.header-role-img'];
            imageSelectors.forEach(selector => {
                this.toggleTag(selector, shouldHide);
            });
            
            // 屏蔽 page-background-img 中的背景图片
            document.querySelectorAll('.page-background-img').forEach(box => {
                if (shouldHide) {
                    // 保存原始背景样式
                    if (!box.dataset.originalBackground) {
                        // 只有在未保存过的情况下才保存，避免覆盖之前保存的值
                        box.dataset.originalBackground = box.style.background || '';
                        box.dataset.originalBackgroundImage = getComputedStyle(box).backgroundImage;
                    }
                    // 移除背景图片
                    box.style.setProperty('background-image', 'none', 'important');
                } else {
                    // 增强的背景图片恢复逻辑
                    // 先清除所有可能的重要样式
                    box.style.removeProperty('background-image');
                    
                    // 如果没有保存的样式数据，直接清除内联样式，让浏览器使用默认样式
                    if (!box.dataset.originalBackground && !box.dataset.originalBackgroundImage) {
                        box.removeAttribute('style');
                    } else {
                        // 恢复原始背景样式
                        if (box.dataset.originalBackground) {
                            box.style.background = box.dataset.originalBackground;
                        }
                        if (box.dataset.originalBackgroundImage && box.dataset.originalBackgroundImage !== 'none') {
                            // 强制设置背景图片，不使用important标记
                            box.style.backgroundImage = box.dataset.originalBackgroundImage;
                        }
                        
                        // 对于一些特殊情况，直接重置为默认状态
                        if (box.dataset.originalBackgroundImage === 'none') {
                            box.style.backgroundImage = 'none';
                        }
                        
                        // 清除保存的数据，以便下次能重新捕获最新状态
                        delete box.dataset.originalBackground;
                        delete box.dataset.originalBackgroundImage;
                    }
                }
            });
            
            // 屏蔽 chat-scope-box 中的背景图片
            document.querySelectorAll('.chat-scope-box').forEach(box => {
                if (shouldHide) {
                    // 保存原始背景样式（包括backgroundImage）
                    if (!box.dataset.originalBackground) {
                        // 只有在未保存过的情况下才保存，避免覆盖之前保存的值
                        box.dataset.originalBackground = box.style.background || '';
                        box.dataset.originalBackgroundImage = getComputedStyle(box).backgroundImage;
                    }
                    // 移除背景图片
                    box.style.setProperty('background-image', 'none', 'important');
                } else {
                    // 增强的背景图片恢复逻辑
                    // 先清除所有可能的重要样式
                    box.style.removeProperty('background-image');
                    
                    // 如果没有保存的样式数据，直接清除内联样式，让浏览器使用默认样式
                    if (!box.dataset.originalBackground && !box.dataset.originalBackgroundImage) {
                        box.removeAttribute('style');
                    } else {
                        // 恢复原始背景样式
                        if (box.dataset.originalBackground) {
                            box.style.background = box.dataset.originalBackground;
                        }
                        if (box.dataset.originalBackgroundImage && box.dataset.originalBackgroundImage !== 'none') {
                            // 强制设置背景图片，不使用important标记
                            box.style.backgroundImage = box.dataset.originalBackgroundImage;
                        }
                        
                        // 对于一些特殊情况，直接重置为默认状态
                        if (box.dataset.originalBackgroundImage === 'none') {
                            box.style.backgroundImage = 'none';
                        }
                        
                        // 清除保存的数据，以便下次能重新捕获最新状态
                        delete box.dataset.originalBackground;
                        delete box.dataset.originalBackgroundImage;
                    }
                }
            });
        }
        
        // 新增样式注入
        injectStyle() {
            GM_addStyle(`
            /* 为被隐藏元素添加占位保护 */
            .item-usage[style*="hidden"],
            .item-author[style*="hidden"],
            .item-score[style*="hidden"],
            .item-img[style*="hidden"],
            .header-role-img[style*="hidden"] {
                pointer-events: none !important;
                user-select: none !important;
                position: relative !important;
            }
            /* 添加伪元素占位提示 */
            .item-usage[style*="hidden"]::after,
            .item-author[style*="hidden"]::after,
            .item-score[style*="hidden"]::after,
            .item-img[style*="hidden"]::after,
            .header-role-img[style*="hidden"]::after {
                content: "[已隐藏]";
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%,-50%);
                font-size: 12px;
                color: #999;
                opacity: 0.6;
            }
        `);
        }
        // 在原有面板中注入新UI
        injectUI() {
            if (this.injected) return;
            const panel = document.getElementById('smart-shield-panel');
            if (!panel) return;
            // 检查容器是否存在
            if (panel.querySelector(`#${this.collapsibleId}`)) {
                this.injected = true;
                return;
            }
            // 创建标签屏蔽面板容器
            const container = document.createElement('div');
            container.id = this.collapsibleId;
            container.className = 'collapsible-container';
            container.innerHTML = `
            <div class="collapsible-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer;">
                <span>🏷️ 标签屏蔽</span>
                <span class="arrow">▶</span>
            </div>
            <div class="collapsible-content" style="display:none">
             <div style="display: flex; flex-direction: column; gap:10px;padding:10px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${this.state.hideAuthorTag ? 'checked' : ''} id="toggle-author-tag" style="display: none;">
                    <span class="toggle-switch">
                        <span class="toggle-slider"></span>
                    </span>
                    <span>隐藏所有作者名称</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${this.state.hideUsageTag ? 'checked' : ''} id="toggle-usage-tag" style="display: none;">
                    <span class="toggle-switch">
                        <span class="toggle-slider"></span>
                    </span>
                    <span>隐藏所有项目热度</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${this.state.hideOriginTag ? 'checked' : ''} id="toggle-origin-tag" style="display: none;">
                    <span class="toggle-switch">
                        <span class="toggle-slider"></span>
                    </span>
                    <span>隐藏所有转载项目</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${this.state.hideScoreTag ? 'checked' : ''} id="toggle-score-tag" style="display: none;">
                    <span class="toggle-switch">
                        <span class="toggle-slider"></span>
                    </span>
                    <span>隐藏所有项目评分</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" ${this.state.hideImageTag ? 'checked' : ''} id="toggle-image-tag" style="display: none;">
                    <span class="toggle-switch">
                        <span class="toggle-slider"></span>
                    </span>
                    <div>
                    <span>隐藏所有图片</span><br>
                    <p style="color: gray; font-style: italic; font-size: 0.65em;">tips:无图模式防社死，也许还会加快网页的加载速度？</p></div>
                </label>
            </div></div>            
            `;
            // 为折叠/展开添加事件监听
            const header = container.querySelector('.collapsible-header');
            const content = container.querySelector('.collapsible-content');
            const arrow = container.querySelector('.arrow');
            header.addEventListener('click', () => {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                arrow.textContent = isHidden ? '▼' : '▶';
            });
            // 事件绑定
            container.querySelector('#toggle-author-tag').addEventListener('change', (e) => {
                this.state.hideAuthorTag = e.target.checked;
                GM_setValue(this.STORAGE_KEYS.authorTag, e.target.checked);
                this.execute();
            });
            container.querySelector('#toggle-usage-tag').addEventListener('change', (e) => {
                this.state.hideUsageTag = e.target.checked;
                GM_setValue(this.STORAGE_KEYS.usageTag, e.target.checked);
                this.execute();
            });
            container.querySelector('#toggle-origin-tag').addEventListener('change', (e) => {
                this.state.hideOriginTag = e.target.checked;
                GM_setValue(this.STORAGE_KEYS.originTag, e.target.checked);
                this.execute();
            });
            container.querySelector('#toggle-score-tag').addEventListener('change', (e) => {
                this.state.hideScoreTag = e.target.checked;
                GM_setValue(this.STORAGE_KEYS.scoreTag, e.target.checked);
                this.execute();
            });
            container.querySelector('#toggle-image-tag').addEventListener('change', (e) => {
                this.state.hideImageTag = e.target.checked;
                GM_setValue(this.STORAGE_KEYS.imageTag, e.target.checked);
                this.execute();
            });
            // 插入到标题下方，基础屏蔽容器的上方
            // 先查找版本信息和滚动容器
            const versionInfo = panel.querySelector('div:first-child');
            const scrollContainer = panel.querySelector('.panel-scroll-container');
            // 然后在滚动容器的第一个子元素前插入
            if (scrollContainer && scrollContainer.firstChild) {
                scrollContainer.insertBefore(container, scrollContainer.firstChild);
            } else if (versionInfo) {
                // 备用方案：插入到版本信息下方
                versionInfo.after(container);
            } else {
                // 备用方案
                panel.insertBefore(container, panel.firstChild);
            }
            this.injectToggleStyle();
            this.injected = true;
        }
        // 注入开关样式
        injectToggleStyle() {
            GM_addStyle(`
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 40px;
                height: 18px;
                background-color: #ccc;
                border-radius: 9px;
                transition: background-color 0.3s;
            }

            .toggle-slider {
                position: absolute;
                top: 1.1px;
                left: 1.1px;
                width: 16px;
                height: 16px;
                background-color: white;
                border-radius: 50%;
                transition: transform 0.3s;
            }

            input:checked + .toggle-switch {
                background-color: rgb(23, 170, 253);
            }

            input:checked + .toggle-switch .toggle-slider {
                transform: translateX(21px);
            }
        `);
        }
    }

    /* ========================== 拓展功能系统 =========================== */
    class ChatMultiFunction {
            constructor(shieldSystem) {
                this.shieldSystem = shieldSystem;
                this.injected = false;
                this.collapsibleId = 'chat-multi-function-panel';
                this.state = {
                    injectQuickShield: false // 控制是否注入快捷屏蔽菜单
                };
                this.STORAGE_KEYS = {
                    injectQuickShield: 'CHAT_INJECT_QUICK_SHIELD'
                };
                this.loadState(); // 加载存储的状态
            }

            loadState() {
                this.state.injectQuickShield = GM_getValue(this.STORAGE_KEYS.injectQuickShield, false);
            }



            initCollapsibleContainerUI() {
                if (this.injected) return;
                const panel = document.getElementById('smart-shield-panel');
                if (!panel) return;

                if (panel.querySelector(`#${this.collapsibleId}`)) {
                    this.injected = true;
                    return;
                }

                const container = document.createElement('div');
                container.id = this.collapsibleId;
                container.className = 'collapsible-container';

                container.innerHTML = `
                    <div class="collapsible-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer;">
                        <span>🛠️ 拓展功能</span>
                        <span class="arrow">▶</span>
                    </div>
                    <div class="collapsible-content" style="display:none">
                        <div style="display: flex; flex-direction: column; gap:10px;padding:10px;">
                            <p style="font-size: 12px; color: #888;">提示：以下功能可能影响页面结构，请谨慎使用。</p>
        
                            <!-- 注入快捷屏蔽菜单 -->
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="toggle-inject-quick-shield" ${this.state.injectQuickShield ? 'checked' : ''} style="display: none;">
                                <span class="toggle-switch">
                                    <span class="toggle-slider"></span>
                                </span>
                                <span>注入快捷屏蔽菜单</span>
                            </label>

                            <!-- 启动CSS属性分析器 -->
                            <button id="start-css-analyzer" style="
                                padding: 8px 16px;
                                background-color: #28a745;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                transition: background-color 0.3s;
                            ">
                                🎨 启动CSS属性分析器
                            </button>
                        </div>
                    </div>
                `;

                // 添加到面板中
                    // 获取所有折叠容器
    const collapsibleContainers = panel.querySelectorAll('.collapsible-container');
    // 定位到第二个折叠容器（标签屏蔽容器）
    const tagShieldContainer = collapsibleContainers[1];
    // 找到导入导出工具
    const importExportTools = panel.querySelector('.shield-import-export-tools');
                 // 插入逻辑：
    if (tagShieldContainer) {
        // 在标签屏蔽容器后插入拓展功能容器
        tagShieldContainer.after(container);
        // 如果存在导入导出工具，确保其在拓展功能容器之后
        if (importExportTools) {
            container.after(importExportTools);
        }
    } else {
        // 备用方案：插入到面板末尾（应尽量避免）
        panel.appendChild(container);
    }

                // 折叠展开逻辑
                const header = container.querySelector('.collapsible-header');
                const content = container.querySelector('.collapsible-content');
                const arrow = container.querySelector('.arrow');
                header.addEventListener('click', () => {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    arrow.textContent = isHidden ? '▼' : '▶';
                });

                // 切换事件绑定
                const quickToggle = container.querySelector('#toggle-inject-quick-shield');
                // 切换事件绑定部分修改如下
                quickToggle.addEventListener('change', e => {
                    const isChecked = e.target.checked;
                    GM_setValue(this.STORAGE_KEYS.injectQuickShield, isChecked);
                    this.state.injectQuickShield = isChecked;

                    if (isChecked) {
                        // 延迟初始化 QuickShield 实例
                        this.enableQuickShield();
                    } else {
                        // 如果已存在实例，则销毁它
                        this.disableQuickShield();
                    }
                });

                this.injected = true;

                // 如果之前已启用，则初始化功能
                if (this.state.injectQuickShield) {
                    this.enableQuickShield();
                }

                // 添加CSS属性分析器按钮点击事件
                const cssAnalyzerButton = container.querySelector('#start-css-analyzer');
                if (cssAnalyzerButton) {
                    cssAnalyzerButton.addEventListener('click', () => {
                        this.startCssAnalyzer();
                    });
                    
                    // 添加鼠标悬停效果
                    cssAnalyzerButton.addEventListener('mouseover', () => {
                        cssAnalyzerButton.style.backgroundColor = '#218838';
                    });
                    
                    cssAnalyzerButton.addEventListener('mouseout', () => {
                        cssAnalyzerButton.style.backgroundColor = '#28a745';
                    });
                }

                this.injectStyles();
            }

            // 启动CSS属性分析器
            startCssAnalyzer() {
                // 检查是否已加载CSS属性分析器
                if (window.cssPropertyAnalyzer && window.cssPropertyAnalyzer.initialize) {
                    // 如果已加载，直接调用初始化函数
                    window.cssPropertyAnalyzer.initialize();
                } else {
                    // 如果未加载，动态加载并执行CSS属性分析器脚本
                    const scriptUrl = 'd:\\Desktop\\电子猫猫工具箱\\CSS属性分析器.user.js';
                    
                    // 创建一个通知告知用户正在启动CSS属性分析器
                    this.showNotification('正在启动CSS属性分析器...');
                    
                    // 在实际环境中，由于浏览器安全限制，直接加载本地文件可能会失败
                    // 这里提供两种方案：
                    // 1. 方案一：尝试直接打开CSS属性分析器脚本（适合本地开发环境）
                    try {
                        // 由于安全限制，直接加载本地脚本可能无法实现
                        // 这里提供一个提示，告知用户如何手动启动CSS属性分析器
                        this.showNotification('请使用油猴菜单或快捷键Ctrl+Alt+C启动CSS属性分析器');
                    } catch (error) {
                        console.error('启动CSS属性分析器失败:', error);
                        this.showNotification('启动CSS属性分析器失败，请使用油猴菜单启动');
                    }
                }
            }
            
            // 显示通知
            showNotification(message, duration = 2000) {
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
                    animation: fadeInOut ${duration/1000}s ease-in-out;
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

                document.body.appendChild(notification);

                // 定时后移除通知
                setTimeout(() => {
                    notification.remove();
                    style.remove();
                }, duration);
            }

            enableQuickShield() {
                if (!this.quickShieldInstance) {
                    this.quickShieldInstance = new QuickShield(this.shieldSystem);
                }
            }

            disableQuickShield() {
                if (this.quickShieldInstance && this.quickShieldInstance.observer) {
                    this.quickShieldInstance.observer.disconnect();
                    this.quickShieldInstance = null;
                }

                // 移除所有 .shield-quick-menu 元素
                document.querySelectorAll('.shield-quick-menu').forEach(el => el.remove());
            }




            injectStyles() {
                GM_addStyle(`
                    .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 40px;
                        height: 18px;
                        background-color: #ccc;
                        border-radius: 9px;
                        transition: background-color 0.3s;
                    }
                    .toggle-slider {
                        position: absolute;
                        top: 1.1px;
                        left: 1.1px;
                        width: 16px;
                        height: 16px;
                        background-color: white;
                        border-radius: 50%;
                        transition: transform 0.3s;
                    }
                    input:checked + .toggle-switch {
                        background-color: rgb(23, 170, 253);
                    }
                    input:checked + .toggle-switch .toggle-slider {
                        transform: translateX(21px);
                    }
                `);
            }
        }


    /* ========================== 快速屏蔽系统 ========================== */
    class QuickShield {
        constructor(shieldSystem) {
            this.shieldSystem = shieldSystem;
            this.init();
        }
        init() {
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes.length) {
                        this.addQuickShieldMenus();
                        setTimeout(() => this.shieldSystem.executeShielding(true), 100);
                    }
                });
            });
            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            this.addQuickShieldMenus();
        }
        addQuickShieldMenus() {
            // 选择所有需要添加快速屏蔽菜单的项目
            const items = document.querySelectorAll(CONFIG.PARENT_SELECTOR);
            items.forEach(item => {
                // 避免重复添加
                if (this.isExcludedContainer(item)) return;
                if (item.querySelector('.shield-quick-menu')) return;
                // 查找项目中的作者、标题和描述元素
                const authorEl = item.querySelector(CONFIG.CATEGORIES.author.selector);
                const titleEl = item.querySelector(CONFIG.CATEGORIES.title.selector);
                const descEl = item.querySelector(CONFIG.CATEGORIES.description.selector);
                // 创建快速屏蔽菜单
                const menu = document.createElement('div');
                menu.className = 'shield-quick-menu';
                menu.innerHTML = `
                <button class="shield-dropdown-btn">⚙️</button>
                <div class="shield-dropdown-content">
                    ${authorEl ? `<div class="shield-dropdown-item" data-type="author">屏蔽作者</div>` : ''}
                    ${titleEl ? `<div class="shield-dropdown-item" data-type="title">屏蔽本卡</div>` : ''}
                </div>
            `;
                item.appendChild(menu);
                // 添加事件监听
                const dropdownBtn = menu.querySelector('.shield-dropdown-btn');
                const dropdownContent = menu.querySelector('.shield-dropdown-content');
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.classList.toggle('show');
                });
                // 为菜单项添加点击事件
                menu.querySelectorAll('.shield-dropdown-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.classList.remove('show');
                        const type = item.dataset.type;
                        let text;
                        if (type === 'author' && authorEl) {
                            text = CONFIG.CATEGORIES.author.processText(authorEl.textContent);
                        } else if (type === 'title' && titleEl) {
                            text = CONFIG.CATEGORIES.title.processText(titleEl.textContent);
                        }

                        if (text) {
                            this.addToShieldList(type, text);
                        }
                    });
                });
                // 点击其他地方关闭菜单
                document.addEventListener('click', () => {
                    dropdownContent.classList.remove('show');
                });
            });
        }
        // 添加关键词到屏蔽列表并立即应用
        addToShieldList(type, keyword) {
            if (!this.shieldSystem.manager[type]) return;
            // 添加关键词到管理器
            this.shieldSystem.manager[type].data.add(keyword);
            // 保存到本地存储
            this.shieldSystem.saveData(type);
            // 刷新关键词列表显示
            this.shieldSystem.renderKeywordsList(type);
            // 立即执行屏蔽逻辑
            this.shieldSystem.executeShielding(true);
            // 显示成功提示
            window.showNotification(`已屏蔽: ${keyword}`, 1500);
            window.showNotification(`已添加屏蔽关键词: ${keyword}`, 1500);
        }
        //禁止以下容器创建屏蔽菜单
        isExcludedContainer(element) {
            // 排除容器选择器
            const excludedSelectors = [
                '.chat-scope-box',
                '.chat-bottom',
                '.shortcut-button'
            ];
            return excludedSelectors.some(selector => element.closest(selector));
        }
    }
    /* ============================ 核心系统 ============================ */
    // 防抖函数，用于避免用户频繁操作触发保存数据
    function debounce(func, delay) {
        let timer;
        return function() {
            const context = this;
            const args = arguments;
            // 清除之前的定时器
            clearTimeout(timer);
            // 设置新的定时器，在指定延迟后执行函数
            timer = setTimeout(() => func.apply(context, args), delay);
        };
    }
    // 屏蔽系统类，用于管理屏蔽关键词和执行屏蔽逻辑
    class ShieldSystem {
        //屏蔽系统类的构造函数，用于初始化屏蔽系统的各项功能和状态。
        constructor() {
            // 用于记录已经处理过的元素，避免重复处理。WeakSet 会自动回收不再使用的元素引用
            this.processed = new WeakSet();
            // 初始化管理器，从存储中加载各个分类的屏蔽关键词
            this.manager = this.initManager();
            // 标记屏蔽面板是否处于打开状态，初始状态为关闭
            this.isPanelOpen = false;
            // 初始化屏蔽面板，创建面板元素、应用样式并构建用户界面
            this.initPanel();
            // 绑定全局事件，包括快捷键监听、点击面板外部关闭面板、油猴菜单命令等
            this.bindGlobalEvents();
            // 如果当前设备是移动端，创建移动端触发按钮，用于显示和隐藏屏蔽面板
            if (isMobile) {
                this.createMobileTrigger();
            }
            // 延迟 1 秒后检查脚本是否有更新
            setTimeout(() => checkForUpdates(), 1000);
            // 新增：初始化标签屏蔽系统，用于处理标签相关的屏蔽逻辑
            this.tagShield = new TagShield(false);
            // 不再立即初始化 QuickShield
            this.quickShield = null;
            // 新增聊天页拓展功能模块
            this.chatMultiFunction = new ChatMultiFunction(this);
            this.chatMultiFunction.initCollapsibleContainerUI();
            // 创建一个 MutationObserver 实例，监听 DOM 变化
            new MutationObserver((mutations) => {
                // 遍历所有发生的 DOM 变化
                mutations.forEach(mutation => {
                    // 如果有新节点添加到 DOM 中
                    if (mutation.addedNodes.length) {
                        // 强制重新执行屏蔽逻辑，确保新节点也被检查
                        this.executeShielding(true);
                    }
                });
            }).observe(document.body, {
                // 监听子节点的添加或移除
                childList: true,
                // 监听所有后代节点的变化
                subtree: true,
                // 监听属性变化（如 class 变更）
                attributes: true,
                // 只监听 class 属性的变化
                attributeFilter: ['class']
            });
            // 保存原始的 executeShielding 方法引用
            this.originalExecuteShielding = this.executeShielding.bind(this);
            // 重写 executeShielding 方法，只执行原始屏蔽逻辑，不再自动执行标签屏蔽逻辑
            this.executeShielding = (force = false) => {
                // 执行原始的屏蔽逻辑
                this.originalExecuteShielding(force);
                // 不再自动执行标签屏蔽逻辑
                // this.tagShield.execute();
            }
            // 根据设备类型选择不同的 DOM 监听方式
            if (isMobile) {
                // 移动端使用节流的 MutationObserver，减少性能开销
                this.initMobileObserver();
            } else {
                // 桌面端使用完整的 MutationObserver，实时监听 DOM 变化
                new MutationObserver((mutations) => {
                    // 遍历所有发生的 DOM 变化
                    mutations.forEach(mutation => {
                        // 如果有新节点添加到 DOM 中
                        if (mutation.addedNodes.length) {
                            // 强制重新执行屏蔽逻辑
                            this.executeShielding(true);
                        }
                    });
                }).observe(document.body, {
                    // 监听子节点的添加或移除
                    childList: true,
                    // 监听所有后代节点的变化
                    subtree: true,
                    // 监听属性变化
                    attributes: true,
                    // 只监听 class 属性的变化
                    attributeFilter: ['class']
                });
            }
            // 不再首次自动执行标签屏蔽逻辑
            // this.tagShield.execute();
        }
        // 如果需要手动触发启用 quickShield
        enableQuickShield() {
            if (!this.quickShield) {
                this.quickShield = new QuickShield(this);
            }
        }
        disableQuickShield() {
            if (this.quickShield && this.quickShield.observer) {
                this.quickShield.observer.disconnect();
                this.quickShield = null;
            }
        }
        //初始化移动端的MutationObserver并设置节流，用于监听DOM变化并执行屏蔽逻辑
        initMobileObserver() {
            // 用于存储定时器 ID，方便后续清除定时器
            let timer = null;
            // 节流时间，单位为毫秒，即两次执行屏蔽逻辑的最小间隔时间
            const throttleTime = 500;
            // 创建一个 MutationObserver 实例，用于监听 DOM 变化
            this.observer = new MutationObserver((mutations) => {
                // 清除之前设置的定时器，避免在节流时间内重复执行屏蔽逻辑
                clearTimeout(timer);
                // 设置一个新的定时器，在节流时间后执行屏蔽逻辑
                timer = setTimeout(() => {
                    // 强制重新执行屏蔽逻辑
                    this.executeShielding(true);
                }, throttleTime);
            });
            // 开始观察 document.body 元素及其子元素的变化
            this.observer.observe(document.body, {
                // 监听子节点的添加或移除
                childList: true,
                // 监听所有后代节点的变化
                subtree: true
            });
        }
        // 创建移动端触发按钮（极简版）
        createMobileTrigger() {
            const trigger = document.createElement('div');
            trigger.id = 'shield-mobile-trigger';
            trigger.textContent = '🛡️';
            // 盾牌图标
            // 设置按钮的样式
            trigger.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: rgba(255,255,255,0);
                color: white;
                border-radius: 50%;
                font-size: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                cursor: pointer;
                z-index: ${CONFIG.Z_INDEX - 1};
                user-select: none;
            `;
            // 点击按钮时切换屏蔽面板的显示状态
            trigger.addEventListener('click', () => this.togglePanel());
            document.body.appendChild(trigger);
        }
        // 初始化管理器，加载存储的屏蔽关键词
        initManager() {
            const managers = {};
            // 遍历分类配置
            Object.entries(CONFIG.CATEGORIES).forEach(([key, cfg]) => {
                managers[key] = {
                    ...cfg,
                    // 从存储中获取屏蔽关键词，并转换为 Set 集合
                    data: new Set(JSON.parse(GM_getValue(cfg.storageKey, '[]')))
                };
            });
            return managers;
        }
        // 保存屏蔽关键词到存储中
        saveData(key) {
            console.log(`Saving data for ${key}:`, [...this.manager[key].data]);
            GM_setValue(
                CONFIG.CATEGORIES[key].storageKey,
                JSON.stringify([...this.manager[key].data])
            );
        }
        /* ========== 面板系统 ========== */
        // 初始化屏蔽面板
        initPanel() {
            // 创建一个 div 元素作为屏蔽面板
            this.panel = document.createElement('div');
            // 为面板设置唯一的 id
            this.panel.id = 'smart-shield-panel';
            // 调用 applyPanelStyle 方法为面板应用样式
            this.applyPanelStyle();
            // 调用 buildPanelUI 方法构建面板的用户界面
            this.buildPanelUI();
            // 将面板添加到文档的根元素中
            document.documentElement.appendChild(this.panel);
            // 获取面板中的输入框和添加按钮
            const input = this.panel.querySelector('.shield-input input');
            const addButton = this.panel.querySelector('.shield-input button');
            // 创建防抖后的保存数据函数，使用 CONFIG.DEBOUNCE 作为防抖时间
            const saveDataDebounced = debounce(this.saveData.bind(this), CONFIG.DEBOUNCE);
            // 为添加按钮添加点击事件监听器
            addButton.addEventListener('click', () => {
                // 获取输入框中的关键词，并去除首尾空格
                const keyword = input.value.trim();
                if (keyword) {
                    // 获取当前激活的标签页对应的分类
                    const activeTab = this.panel.querySelector('.shield-tab button.active');
                    const category = activeTab.dataset.category;
                    // 将关键词添加到对应分类的屏蔽关键词集合中
                    this.manager[category].data.add(keyword);
                    // 清空输入框
                    input.value = '';
                    // 调用防抖后的保存数据函数保存关键词
                    saveDataDebounced(category);
                    // 重新渲染该分类的屏蔽关键词列表
                    this.renderKeywordsList(category);
                }
            });
        }
        // 应用面板样式
        applyPanelStyle() {
            GM_addStyle(`
                #smart-shield-panel {
                    position: fixed !important;
                    top: 80px !important;
                    right: 20px !important;
                    width: 380px !important;
                    background: #fff !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
                    z-index: ${CONFIG.Z_INDEX} !important;
                    font-family: system-ui, sans-serif !important;
                    display: none;
                    border: none !important;
                    max-height: calc(100vh - 100px) !important;
                    height: auto !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                }
                .shield-tab {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    gap: 8px;
                    width:100%;
                }
                .shield-tab button {
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: none;
                    background: #f5f5f5;
                    cursor: pointer;
                    transition: all 0.2s;
                    
                }
                .shield-tab button.active {
                    background: #007bff;
                    color: white;
                    
                }
                .shield-content {
                    padding: 14px;
                }
                .shield-input {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                .shield-input input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .shield-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .shield-list li {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    background: #f8f9fa;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }
                .shield-list button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: #dc3545;
                    cursor: pointer;
                }
                .panel-close {
                    position: absolute;
                    right: 12px;
                    top: 12px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px;
                }
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 18px;
                    background-color: #ccc;
                    border-radius: 9px;
                    transition: background-color 0.3s;
                }
                .toggle-slider {
                    position: absolute;
                    top: 1.1px;
                    left: 1.1px;
                    width: 16px;
                    height: 16px;
                    background-color: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                }
                input:checked + .toggle-switch {
                    background-color: rgb(23, 170, 253);
                }
                input:checked + .toggle-switch .toggle-slider {
                    transform: translateX(21px);
                }
                .shield-quick-menu {
                    position: absolute !important;
                    bottom: 8px !important;
                    right: 8px !important;
                    z-index: 1 !important;
                }
                .shield-dropdown-btn {
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                    width: 24px !important;
                    height: 24px !important;
                    font-size: 16px !important;
                    filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));
                }
                .shield-dropdown-content {
                    display: none;
                    position: absolute !important;
                    bottom: 100% !important;
                    right: 0;
                    background: #fff !important;
                    border-radius: 4px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
                    min-width: 120px !important;
                }
                .shield-dropdown-content.show {
                    display: block !important;
                }
                .shield-dropdown-item {
                    padding: 8px 12px !important;
                    font-size: 12px !important;
                    color: #333 !important;
                    cursor: pointer !important;
                    white-space: nowrap !important;
                }
                .shield-dropdown-item:hover {
                    background: #f5f5f5 !important;
                }

                /* 修改滚动容器为定位上下文 */
                .scroll-container { /* 根据实际滚动区域类名调整 */
                    position: relative !important;
                    overflow-y: auto !important;
                }

                .shield-quick-menu {
                    position: absolute !important;
                    bottom: 8px !important;
                    right: 8px !important;
                    z-index: 1 !important;
                    pointer-events: auto !important;
                    -webkit-transform: translateZ(0); /* 添加 Safari 前缀 */
                    transform: translateZ(0);
                    box-sizing: border-box !important; /* 确保尺寸计算正确 */
                }
                /* 项目容器必须为定位上下文 */
                .item-list, .item {
                    position: relative !important;
                    overflow: visible !important;
                }

                /* 限制滚动容器 */
               .card-list { /* 替换为实际的滚动区域类名 */
                    overflow-y: auto !important;
                    position: relative !important;
               }
               @media (max-width: 767px) {
                    .shield-dropdown-btn {
                        width: 36px !important; /* 移动端宽度 */
                    }
                }
                /* 折叠容器样式 */
               .collapsible-container {
                    margin: 12px;
                    border: 1px solid #eee;
                    border-radius: 8px;
               }
               
               /* 滚动容器样式 */
               .panel-scroll-container {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    position: relative !important;
                    height: 100% !important;
                    max-height: calc(100% - 100px) !important;
                    min-height: 200px !important;
                }
                
                /* Chrome、Safari 和 Opera 的滚动条美化 */
                .panel-scroll-container::-webkit-scrollbar {
                    width: 6px !important;
                }
                
                .panel-scroll-container::-webkit-scrollbar-track {
                    background: #f1f1f1 !important;
                    border-radius: 3px !important;
                }
                
                .panel-scroll-container::-webkit-scrollbar-thumb {
                    background: #888 !important;
                    border-radius: 3px !important;
                }
                
                .panel-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #555 !important;
                }
                
                /* 确保标题和导入导出工具不随内容滚动 */
                .shield-import-export-tools {
                    position: relative !important;
                    z-index: 1 !important;
                }
                
                /* 移除面板外边框 */
                #smart-shield-panel {
                    border: none !important;
                }
                
                /* 为折叠容器添加边框 */
                .collapsible-container {
                    border: 1px solid #eee !important;
                }
               .collapsible-content {
                    transition: all 0.3s ease;
                    overflow: hidden;
               }
               .collapsible-header .arrow {
                    font-size: 10px;
            
               }
               .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 40px;
                        height: 18px;
                        background-color: #ccc;
                        border-radius: 9px;
                        transition: background-color 0.3s;
                    }
                    .toggle-slider {
                        position: absolute;
                        top: 1.1px;
                        left: 1.1px;
                        width: 16px;
                        height: 16px;
                        background-color: white;
                        border-radius: 50%;
                        transition: transform 0.3s;
                    }
                    input:checked + .toggle-switch {
                        background-color: rgb(23, 170, 253);
                    }
            
                    input:checked + .toggle-switch .toggle-slider {
                        transform: translateX(21px);
                    }
                    @media (max-width: 768px) {
                            .quick-shield-notification {
                                right: 10px;
                                left: 10px;
                                width: calc(100% - 20px);
                                text-align: center;
                            }
                        }
            `);
        }
        // 绑定全局事件
        bindGlobalEvents() {
            // 快捷键监听
            const [modifier1, modifier2, key] = CONFIG.HOTKEY.split('+');
            document.addEventListener('keydown', e => {
                const isModifier1 = modifier1 === 'Ctrl' ? e.ctrlKey : modifier1 === 'Shift' ? e.shiftKey : false;
                const isModifier2 = modifier2 === 'Ctrl' ? e.ctrlKey : modifier2 === 'Shift' ? e.shiftKey : false;
                if (isModifier1 && isModifier2 && e.key.toLowerCase() === key.toLowerCase()) {
                    // 按下快捷键时切换屏蔽面板的显示状态
                    this.togglePanel();
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            // 通用点击关闭
            document.addEventListener('click', e => {
                if (!this.isPanelOpen) return;
                const panel = this.panel;
                const clickInside = panel.contains(e.target) ||
                    e.target.closest('#shield-mobile-trigger');
                if (!clickInside) {
                    // 点击面板外部时关闭屏蔽面板
                    this.togglePanel();
                }
            });
            // 油猴菜单命令
            GM_registerMenuCommand(isMobile ? '显示屏蔽面板' : '打开屏蔽面板', () => {
                // 点击油猴菜单命令时切换屏蔽面板的显示状态
                this.togglePanel();
            });
            GM_registerMenuCommand('导出配置', exportConfig);
            GM_registerMenuCommand('导入配置', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => this.importConfig(e);
                input.click();
            });
            // 动态内容监听
            new MutationObserver(() => this.executeShielding())
                .observe(document.body, { childList: true, subtree: true });
        }
        /* ========== 基础屏蔽 ========== */
        // 切换屏蔽面板的显示状态
        togglePanel() {
            this.isPanelOpen = !this.isPanelOpen;
            this.panel.style.display = this.isPanelOpen ? 'flex' : 'none';
        }
        // 构建面板 UI
        buildPanelUI() {
            const versionInfo = document.createElement('div');
            versionInfo.style.cssText = `
                    padding: 12px;
                    text-align: center;
                    font-size: 1.1em;
                    color: rgba(128,128,128,0.5);
                `;
            versionInfo.textContent = `电子猫猫工具箱${CURRENT_VERSION} | tg@苏子言`;
            // 关闭按钮
            const closeBtn = document.createElement('button');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => this.togglePanel();
            
            // 创建滚动容器来包裹所有内容面板
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'panel-scroll-container';
            
            //折叠容器-外层容器
            const collapsibleContainer = document.createElement('div');
            collapsibleContainer.className = 'collapsible-container';
            // 标题栏
            const collapsibleHeader = document.createElement('div');
            collapsibleHeader.className = 'collapsible-header';
            collapsibleHeader.innerHTML = `
                <span> 📚 基础屏蔽</span>
                <span class="arrow">▶</span>
            `;
            collapsibleHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
            `;
            // 内容容器（包裹原有的选项卡）
            const collapsibleContent = document.createElement('div');
            collapsibleContent.className = 'collapsible-content';
            collapsibleContent.style.display = 'none'; // 默认隐藏
            // 选项卡容器
            const tabBar = document.createElement('div');
            tabBar.className = 'shield-tab';
            // 内容容器
            const contentArea = document.createElement('div');
            contentArea.className = 'shield-content';
            // 构建分类面板
            Object.entries(this.manager).forEach(([key, cfg], index) => {
                // 选项卡按钮
                const tabBtn = this.createTabButton(cfg.label, index === 0);
                // 内容面板
                const panel = this.createContentPanel(key, cfg, index === 0);
                // 选项卡切换逻辑
                tabBtn.onclick = () => this.switchTab(tabBtn, panel);
                tabBar.appendChild(tabBtn);
                contentArea.appendChild(panel);
            });
            //组装折叠容器
            collapsibleContent.appendChild(tabBar);
            collapsibleContent.appendChild(contentArea);
            collapsibleContainer.appendChild(collapsibleHeader);
            collapsibleContainer.appendChild(collapsibleContent);
            // 点击标题切换折叠状态
            collapsibleHeader.addEventListener('click', () => {
                const isHidden = collapsibleContent.style.display === 'none';
                collapsibleContent.style.display = isHidden ? 'block' : 'none';
                collapsibleHeader.querySelector('.arrow').textContent = isHidden ? '▼' : '▶';
            });
            
            // 将所有内容面板添加到滚动容器中
            scrollContainer.appendChild(collapsibleContainer);
            
            // 导入导出工具
            const tools = this.buildImportExport();
            // 组装面板
            this.panel.append(versionInfo, closeBtn, scrollContainer, tools);
            
            // 确保所有折叠容器都在滚动区域内
            // 延迟执行，确保TagShield和ChatMultiFunction的UI已经注入
            setTimeout(() => {
                const panel = document.getElementById('smart-shield-panel');
                const scrollContainer = panel.querySelector('.panel-scroll-container');
                
                // 找到所有折叠容器
                const collapsibleContainers = panel.querySelectorAll('.collapsible-container');
                
                // 检查并移动不在滚动容器中的折叠容器
                collapsibleContainers.forEach(container => {
                    if (container.parentNode !== scrollContainer) {
                        // 将容器移动到滚动容器内，但保持原有的顺序
                        scrollContainer.appendChild(container);
                    }
                });
            }, 100);
        }
        // 创建选项卡按钮
        createTabButton(label, isActive) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.className = isActive ? 'active' : '';
            return btn;
        }
        // 创建内容面板
        createContentPanel(key, cfg, isVisible) {
            const panel = document.createElement('div');
            panel.dataset.key = key;
            panel.style.display = isVisible ? 'block' : 'none';
            panel.className = 'content-panel';
            // 输入组
            const inputGroup = document.createElement('div');
            inputGroup.className = 'shield-input';
            const input = document.createElement('input');
            input.placeholder = `添加${cfg.label}关键词`;
            const addBtn = document.createElement('button');
            addBtn.textContent = '添加';
            addBtn.onclick = () => this.handleAddKey(key, input);
            // 关键词列表
            const list = document.createElement('ul');
            list.className = 'shield-list';
            this.refreshList(key, list);
            inputGroup.append(input, addBtn);
            panel.append(inputGroup, list);
            return panel;
        }
        // 切换选项卡
        switchTab(activeBtn, activePanel) {
            // 隐藏所有面板
            this.panel.querySelectorAll('.content-panel').forEach(p => {
                p.style.display = 'none';
            });
            // 移除所有激活状态
            this.panel.querySelectorAll('.shield-tab button').forEach(b => {
                b.classList.remove('active');
            });
            // 显示目标面板
            activePanel.style.display = 'block';
            activeBtn.classList.add('active');
        }
        /* ========== 核心功能 ========== */
        // 执行屏蔽操作
        executeShielding(force = false) {
            console.log('Executing shielding logic...');
            // 重置所有可能被隐藏的元素
            document.querySelectorAll(CONFIG.PARENT_SELECTOR).forEach(parent => {
                parent.style.removeProperty('display');
            });
            // 重新执行屏蔽
            this.processed = new WeakSet();
            // 遍历管理器中的所有分类配置
            Object.entries(this.manager).forEach(([key, cfg]) => {
                // 查找当前分类配置选择器对应的所有元素
                document.querySelectorAll(cfg.selector).forEach(el => {
                    // 如果该元素已经处理过且没有强制重新处理的需求，则跳过
                    if (this.processed.has(el) && !force) return;
                    // 获取元素的文本内容并去除首尾空格
                    let rawText = el.textContent.trim();
                    // 如果配置中有文本处理函数，则使用该函数处理原始文本，否则直接使用原始文本
                    let processedText = cfg.processText ? cfg.processText(rawText) : rawText;
                    // 匹配逻辑：检查是否有符合条件的关键词需要屏蔽当前元素
                    const shouldBlock = [...cfg.data].some(word => {
                        // 根据不同的匹配类型执行不同的匹配逻辑
                        switch(cfg.matchType) {
                            case 'exact':
                                // 精确匹配：处理后的文本与关键词完全相等
                                return processedText === word;
                            case 'fuzzy':
                                // 模糊匹配：处理后的文本包含关键词（忽略大小写）
                                return processedText.toLowerCase().includes(word.toLowerCase());
                            case 'regex':
                                // 正则匹配：使用关键词作为正则表达式进行匹配（忽略大小写）
                                return new RegExp(word, 'i').test(processedText);
                        }
                    });
                    // 如果满足屏蔽条件
                    if (shouldBlock) {
                        // 找到元素最近的符合父选择器的父元素
                        const parent = el.closest(CONFIG.PARENT_SELECTOR);
                        // 如果找到父元素，则将其隐藏
                        parent?.style.setProperty('display', 'none', 'important');
                        // 将该元素标记为已处理
                        this.processed.add(el);
                    }
                });
            });
        }
        /* ========== 数据管理 ========== */
        // 刷新关键词列表
        refreshList(key, list) {
            list.innerHTML = '';
            this.manager[key].data.forEach(word => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                span.textContent = word;
                const button = document.createElement('button');
                button.textContent = '×';
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    this.handleRemove(key, word);
                });
                li.appendChild(span);
                li.appendChild(button);
                list.appendChild(li);
            });
        }
        //渲染指定分类的屏蔽关键词列表
        renderKeywordsList(category) {
            // 根据分类名称查找对应的关键词列表元素
            const list = this.panel.querySelector(`[data-key="${category}"] .shield-list`);
            // 若找到对应的列表元素，则调用 refreshList 方法刷新列表内容
            if (list) {
                this.refreshList(category, list);
            }
        }
        //处理添加屏蔽关键词的逻辑
        handleAddKey(key, input) {
            // 获取输入框中的值，并去除首尾空格
            const word = input.value.trim();
            // 如果输入为空，则直接返回，不执行后续操作
            if (!word) return;
            // 将处理后的关键词添加到对应分类的管理器数据集中
            this.manager[key].data.add(word);
            // 调用 saveData 方法将更新后的关键词数据保存到存储中
            this.saveData(key);
            // 刷新对应分类的关键词列表显示，input.parentElement.nextElementSibling 为关键词列表元素
            this.refreshList(key, input.parentElement.nextElementSibling);
            // 清空输入框，以便用户继续输入新的关键词
            input.value = '';
            // 强制重新执行屏蔽逻辑，确保新添加的关键词立即生效
            this.executeShielding(true);
            // 调用通知函数，显示添加成功的提示信息，持续时间为 1500 毫秒
            showNotification(`已添加屏蔽关键词: ${word}`, 1500);
        }
        // 处理移除关键词
        handleRemove(key, word) {
            this.manager[key].data.delete(word);
            this.saveData(key);
            const list = this.panel.querySelector(`[data-key="${key}"] .shield-list`);
            this.refreshList(key, list);
            // 强制刷新所有相关元素
            this.executeShielding(true);
            // 显式恢复所有布局的项目
            document.querySelectorAll('.item-list, .item').forEach(el => {
                const target = el.querySelector(CONFIG.CATEGORIES[key].selector)?.textContent.trim();
                if (target === word) {
                    el.style.display = '';
                }
            });
        }
        // 构建导入导出工具
        buildImportExport() {
            
            const tools = document.createElement('div');
           tools.className = 'shield-import-export-tools'; // 添加唯一类名
            tools.style.padding = '16px';
            // 导出按钮
            const exportButton = document.createElement('button');
            // 移除按钮默认样式
            exportButton.style.border = 'none';
            exportButton.style.background = 'transparent';
            exportButton.innerHTML = `
            <span style="display: inline-block;
                padding: 6px 12px;
                background: #ADD8E6;
                color: white;
                border-radius: 4px;
                cursor: pointer;">
                导出配置
            <input type="file"
               accept=".json"
               style="display: none;">
            </span>
            `;
            // 获取导出按钮内的 input 元素
            const exportFileInput = exportButton.querySelector('input');
            // 点击导出按钮触发导出配置方法
            exportButton.addEventListener('click', () => this.exportConfig());
            // 导入按钮
            const importLabel = document.createElement('button'); // 这里使用 button 替代 label
            // 移除按钮默认样式
            importLabel.style.border = 'none';
            importLabel.style.background = 'transparent';
            importLabel.innerHTML = `
            <span style="display: inline-block;
                padding: 6px 12px;
                background: #ADD8E6;
                color: white;
                border-radius: 4px;
                cursor: pointer;">
                导入配置
            <input type="file"
               accept=".json"
               style="display: none;">
            </span>
            `;
            // 获取导入按钮内的 input 元素
            const importFileInput = importLabel.querySelector('input');
            // 点击导入按钮触发文件选择框
            importLabel.addEventListener('click', () => importFileInput.click());
            // 文件选择变化时触发导入配置方法
            importFileInput.addEventListener('change', (e) => this.importConfig(e));
            tools.append(exportButton, importLabel);
            return tools;
        }
        // 导出配置文件
        exportConfig() {
            const data = {
                categories: Object.entries(this.manager).reduce((acc, [key, cfg]) => {
                    acc[key] = [...cfg.data];
                    return acc;
                }, {}),
                tagShieldState: new TagShield(false).state
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shield-config_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        // 在导入配置成功后，调用 applyCategoryConfig 函数
        importConfig(inputEvent) {
            const file = inputEvent.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    // 处理分类配置
                    Object.entries(importedData.categories).forEach(([key, values]) => {
                        if (this.manager[key]) {
                            this.manager[key].data = new Set(values);
                            this.saveData(key);
                            this.refreshList(key, this.panel.querySelector(`[data-key="${key}"] .shield-list`));
                        }
                    });
                    // 处理标签屏蔽状态
                    const tagShield = new TagShield(false);
                    Object.entries(tagShield.STORAGE_KEYS).forEach(([stateKey, storageKey]) => {
                        const value = importedData.tagShieldState[`hide${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}`];
                        GM_setValue(storageKey, value);
                        tagShield.state[`hide${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}`] = value;
                    });
                    // 强制更新UI
                    document.querySelectorAll('#toggle-author-tag, #toggle-usage-tag, #toggle-origin-tag').forEach(checkbox => {
                        const key = checkbox.id.replace('toggle-', '').replace('-tag', '');
                        checkbox.checked = tagShield.state[`hide${key.charAt(0).toUpperCase() + key.slice(1)}`];
                    });
                    // 不再自动执行屏蔽操作
                    // tagShield.execute();
                    // 刷新屏蔽逻辑
                    this.executeShielding(true);
                    console.log('[配置导入] 成功');
                } catch (error) {
                    alert('配置文件格式错误: ' + error.message);
                    console.error('[配置导入] 失败', error);
                }
            };
            reader.readAsText(file);
        }
    }
    // 导入后更新复选框状态
    document.querySelectorAll('#toggle-author-tag, #toggle-usage-tag, #toggle-origin-tag').forEach(checkbox => {
        const key = checkbox.id.replace('toggle-', '').replace('-tag', '');
        checkbox.checked = tagShield.state[`hide${key.charAt(0).toUpperCase() + key.slice(1)}`];
    });
    /* =========================== 初始化系统 =========================== */
    let initialized = false;
    let updateTimer = null;
    function init() {
        if (initialized || document.readyState !== 'complete') return;

        if (updateTimer) clearInterval(updateTimer); // 清理旧定时器
        updateTimer = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
        new ShieldSystem().executeShielding();
        
        // 创建TagShield实例并注入UI，但不自动执行屏蔽
        const tagShield = new TagShield(false);
        tagShield.tryInjectUI();
        
        initialized = true;
    }
    // 监听页面加载完成事件
    window.addEventListener('load', init);
    // 监听 DOM 内容加载完成事件
    document.addEventListener('DOMContentLoaded', init);
    // 延迟 2 秒后尝试初始化
    setTimeout(init, 2000);
})();
