// ==UserScript==
// @name         电子猫猫智能工具箱-专业稳定版
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      5.8.1
// @description  支持多维屏蔽、可视化UI管理的智能工具，便捷操作，支持电脑端、安卓端、苹果端
// @author       苏子言
// @match        *://*.meimoai10.com/*
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai*.com/*
// @match        *://*.meimodao.*/*
// @match        *://*.meimodao.com/*
// @connect      github.com
// @connect      api.github.com
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      sexyai.top
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
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
        // 检查路径（可选）
        // 例如，如果需要特定路径才能运行脚本
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
    // 获取当前脚本版本（从元数据解析，需与@version一致）
    const CURRENT_VERSION = '5.8.1';
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
    /* ========== 通用通知函数 ========== */
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
    // 导出配置
    function exportConfig() {
        const exportData = {
            categories: CONFIG.CATEGORIES,
            tagShieldState: new TagShield().state
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
    // 更新分类配置后，重新执行屏蔽逻辑
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
    // 修复标签屏蔽面板注入问题
    class TagShield {
        constructor() {
            // 配置存储键名
            this.STORAGE_KEYS = {
                authorTag: 'HIDE_AUTHOR_TAG',
                usageTag: 'HIDE_USAGE_TAG',
                originTag: 'HIDE_ORIGIN_TAG'
            };
            // 初始化开关状态
            this.state = {
                hideAuthorTag: GM_getValue(this.STORAGE_KEYS.authorTag, false),
                hideUsageTag: GM_getValue(this.STORAGE_KEYS.usageTag, false),
                hideOriginTag: GM_getValue(this.STORAGE_KEYS.originTag, false)
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
            this.toggleOriginTag(this.state.hideOriginTag); // 新增屏蔽逻辑
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
                    // 恢复原始样式
                    el.style.setProperty('visibility', el.dataset.originalVisibility);
                    el.style.setProperty('opacity', el.dataset.originalOpacity);
                    el.style.setProperty('width', el.dataset.originalWidth);
                    el.style.setProperty('height', el.dataset.originalHeight);
                    el.style.setProperty('flex', el.dataset.originalFlex);
                    el.style.setProperty('margin', el.dataset.originalMargin);
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

        // 新增样式注入
        injectStyle() {
            GM_addStyle(`
            /* 为被隐藏元素添加占位保护 */
            .item-usage[style*="hidden"],
            .item-author[style*="hidden"] {
                pointer-events: none !important;
                user-select: none !important;
                position: relative !important;
            }
            /* 添加伪元素占位提示 */
            .item-usage[style*="hidden"]::after,
            .item-author[style*="hidden"]::after {
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

            // 插入到版本信息下方
            const versionInfo = panel.querySelector('div:first-child');
            if (versionInfo) {
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


    /* ========================== 核心系统 =========================== */
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
    class ShieldSystem {
        constructor() {
            // 用于记录已经处理过的元素，避免重复处理
            this.processed = new WeakSet();
            // 初始化管理器，加载存储的屏蔽关键词
            this.manager = this.initManager();
            // 标记屏蔽面板是否打开
            this.isPanelOpen = false;
            // 初始化屏蔽面板
            this.initPanel();
            // 绑定全局事件，如快捷键监听、点击关闭等
            this.bindGlobalEvents();
            // 如果是移动端，创建移动端触发按钮
            if (isMobile) {
                this.createMobileTrigger();
            }
            setTimeout(() => checkForUpdates(), 1000);
            // 新增：初始化标签屏蔽系统
            this.tagShield = new TagShield();
            // 新增快速屏蔽功能
            this.quickShield = new QuickShield(this);
            new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes.length) {
                        this.executeShielding(true);
                    }
                });
            }).observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true, // 监听属性变化（如 class 变更）
                attributeFilter: ['class']
            });
            // 修改执行屏蔽逻辑
            this.originalExecuteShielding = this.executeShielding.bind(this);
            this.executeShielding = (force = false) => {
                this.originalExecuteShielding(force);
                this.tagShield.execute(); // 执行新屏蔽逻辑
            }
            if (isMobile) {
                // 移动端使用节流的MutationObserver
                this.initMobileObserver();
            } else {
                // 桌面端使用完整的MutationObserver
                new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes.length) {
                            this.executeShielding(true);
                        }
                    });
                }).observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                });
            }
            // 首次执行
            this.tagShield.execute();
        }
        initMobileObserver() {
            let timer = null;
            const throttleTime = 500; // 节流时间，毫秒

            this.observer = new MutationObserver((mutations) => {
                // 清除之前的定时器
                clearTimeout(timer);

                // 设置新的定时器，延迟执行屏蔽逻辑
                timer = setTimeout(() => {
                    this.executeShielding(true);
                }, throttleTime);
            });

            this.observer.observe(document.body, {
                childList: true,
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
                    max-height: 60vh;
                    overflow-y: auto;
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
        /* ========== 移动端适配 ========== */
        // 切换屏蔽面板的显示状态
        togglePanel() {
            this.isPanelOpen = !this.isPanelOpen;
            this.panel.style.display = this.isPanelOpen ? 'block' : 'none';
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

            //===== 新增：折叠容器 =====
            // 外层容器
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

            // ===== 组装折叠容器 =====
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

            // 导入导出工具
            const tools = this.buildImportExport();
            // 组装面板
            this.panel.append(versionInfo, closeBtn, collapsibleContainer, tools);
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
            Object.entries(this.manager).forEach(([key, cfg]) => {
                document.querySelectorAll(cfg.selector).forEach(el => {
                    if (this.processed.has(el) && !force) return;

                    // 获取原始文本并清洗
                    let rawText = el.textContent.trim();
                    let processedText = cfg.processText ? cfg.processText(rawText) : rawText;

                    // 匹配逻辑
                    const shouldBlock = [...cfg.data].some(word => {
                        switch(cfg.matchType) {
                            case 'exact':
                                return processedText === word;
                            case 'fuzzy':
                                return processedText.toLowerCase().includes(word.toLowerCase());
                            case 'regex':
                                return new RegExp(word, 'i').test(processedText);
                        }
                    });

                    if (shouldBlock) {
                        const parent = el.closest(CONFIG.PARENT_SELECTOR);
                        parent?.style.setProperty('display', 'none', 'important');
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
        renderKeywordsList(category) {
            const list = this.panel.querySelector(`[data-key="${category}"] .shield-list`);
            if (list) {
                this.refreshList(category, list);
            }
        }
        // 处理添加关键词
        handleAddKey(key, input) {
            const word = input.value.trim();
            if (!word) return;
            this.manager[key].data.add(word);
            this.saveData(key);
            this.refreshList(key, input.parentElement.nextElementSibling);
            input.value = '';
            this.executeShielding(true);
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
                tagShieldState: new TagShield().state
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
                    const tagShield = new TagShield();
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
                    tagShield.execute();
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

    /* ====================== 新功能：快速屏蔽菜单 ====================== */
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
    }


    /* ==================== 初始化系统 ==================== */
    let initialized = false;
    let updateTimer = null;
    function init() {
        if (initialized || document.readyState !== 'complete') return;

        if (updateTimer) clearInterval(updateTimer); // 清理旧定时器
        updateTimer = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
        new ShieldSystem().executeShielding();
        initialized = true;
    }
    // 监听页面加载完成事件
    window.addEventListener('load', init);
    // 监听 DOM 内容加载完成事件
    document.addEventListener('DOMContentLoaded', init);
    // 延迟 2 秒后尝试初始化
    setTimeout(init, 2000);
})();
