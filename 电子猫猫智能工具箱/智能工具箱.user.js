// ==UserScript==
// @name         电子猫猫智能工具箱-专业稳定版
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      5.6.1
// @description  支持多维屏蔽、可视化UI管理的智能工具，便捷操作，支持电脑端、安卓端、苹果端
// @author       苏子言
// @match        *://*.meimoai10.com/*
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai*.com/*
// @match        *://m.sexyai.top/*
// @match        *://m.meimoai*.com/*
// @match        *://mobile.sexyai.top/*
// @match        *://mobile.meimoai*.com/*
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
// ==/UserScript==

// 立即执行函数，创建一个独立的作用域，避免全局变量污染
(function() {
    'use strict';
    // 判断是否为移动端设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 定义域名匹配模式，用于匹配目标域名
    const domainPattern = /(meimoai\d+|sexyai)\.(com|top)/i;
    // 检查当前页面的域名是否符合目标域名模式
    if (!domainPattern.test(location.hostname)) {
        console.log('[屏蔽系统] 非目标域名，退出执行');
        return;
    }

    /* ========================== 自动更新模块 ========================== */
    // 获取当前脚本版本（从元数据解析，需与@version一致）
    const CURRENT_VERSION = '5.6.1';
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


    /* ====================== 新功能：标签屏蔽系统 ====================== */
    class TagShield {
        constructor() {
            // 配置存储键名
            this.STORAGE_KEYS = {
                authorTag: 'HIDE_AUTHOR_TAG',
                usageTag: 'HIDE_USAGE_TAG'
            };

            // 初始化开关状态
            this.state = {
                hideAuthorTag: GM_getValue(this.STORAGE_KEYS.authorTag, false),
                hideUsageTag: GM_getValue(this.STORAGE_KEYS.usageTag, false)
            };

            // 如果已有面板则注入UI
            if (document.getElementById('smart-shield-panel')) {
                this.injectUI();
            }
        }

        // 执行标签屏蔽
        execute() {
            this.toggleTag('.item-author', this.state.hideAuthorTag);
            this.toggleTag('.item-usage', this.state.hideUsageTag);
        }

        // 通用标签显示/隐藏控制
        toggleTag(selector, shouldHide) {
            document.querySelectorAll(selector).forEach(el => {
                if (shouldHide) {
                    // 记录原始尺寸
                    el.dataset.originalWidth = el.style.width || 'auto';
                    el.dataset.originalHeight = el.style.height || 'auto';

                    // 保持布局占位
                    el.style.cssText += `
                    visibility: hidden !important;
                    opacity: 0 !important;
                    width: ${el.offsetWidth}px !important;
                    height: ${el.offsetHeight}px !important;
                    flex: 0 0 auto !important;  // 防止flex压缩空间
                    margin: 0 !important;         // 消除边距影响
                `;
                } else {
                    // 恢复原始样式
                    el.style.cssText = `
                    visibility: visible;
                    opacity: 1;
                    width: ${el.dataset.originalWidth};
                    height: ${el.dataset.originalHeight};
                `;
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

        execute() {
            this.toggleTag('.item-author', this.state.hideAuthorTag);
            this.toggleTag('.item-usage', this.state.hideUsageTag);
            this.injectStyle(); // 注入样式
        }



        // 在原有面板中注入新UI
        injectUI() {
            const panel = document.getElementById('smart-shield-panel');

            // 创建标签屏蔽区域
            const container = document.createElement('div');
            container.style.padding = '16px';
            container.innerHTML = `
                <div style="margin-bottom: 12px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                    🏷️ 标签屏蔽
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" ${this.state.hideAuthorTag ? 'checked' : ''} id="toggle-author-tag">
                        <span>隐藏所有作者名称</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" ${this.state.hideUsageTag ? 'checked' : ''} id="toggle-usage-tag">
                        <span>隐藏所有项目热度</span>
                    </label>
                </div>
            `;

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

            // 插入到版本信息下方
            panel.insertBefore(container, panel.querySelector('.shield-tab'));
        }
    }


    /* ========================== 用户配置区域 ========================== */
    const CONFIG = {
        // 分类配置 (可自由增减)
        CATEGORIES: {
            author: {
                selector: '.item-author',
                // 用于选择作者元素的 CSS 选择器
                storageKey: 'GLOBAL_AUTHOR_KEYS',
                // 存储作者屏蔽关键词的键名
                label: '👤 作者屏蔽',
                // 显示在 UI 上的标签
                matchType: 'exact'
                // 匹配类型为精确匹配
            },
            title: {
                selector:  '.item-title-scope',
                // 用于选择标题元素的 CSS 选择器
                storageKey: 'GLOBAL_TITLE_KEYS',
                // 存储标题屏蔽关键词的键名
                label: '📌 标题屏蔽',
                // 显示在 UI 上的标签
                matchType: 'fuzzy'
                // 匹配类型为模糊匹配
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
        PARENT_SELECTOR: 'uni-view.item',
        // 父元素的 CSS 选择器，用于隐藏匹配元素的父元素
        HOTKEY: 'Ctrl+Shift+a',
        // 打开屏蔽面板的快捷键
        Z_INDEX: 2147483647,
        // 屏蔽面板的 z-index 值，确保面板显示在最上层
        DEBOUNCE: 300
        // 防抖时间，暂未使用
    };

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
            // 修改执行屏蔽逻辑
            this.originalExecuteShielding = this.executeShielding.bind(this);
            this.executeShielding = (force = false) => {
                this.originalExecuteShielding(force);
                this.tagShield.execute(); // 执行新屏蔽逻辑
            }
            // 首次执行
            this.tagShield.execute();
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
            GM_setValue(
                CONFIG.CATEGORIES[key].storageKey,
                // 将 Set 集合转换为数组并转换为 JSON 字符串保存
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
                    width: 360px !important;
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
                    padding: 16px;
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
                    color: rbag(255,255,255,0.5);
                `;
    versionInfo.textContent = `电子猫猫工具箱${CURRENT_VERSION} | tg@苏子言`;

            // 关闭按钮
            const closeBtn = document.createElement('button');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => this.togglePanel();

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

            // 导入导出工具
            const tools = this.buildImportExport();

            // 组装面板
            this.panel.append(versionInfo, closeBtn, tabBar, contentArea, tools);
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
            // 重置所有可能被隐藏的元素
            document.querySelectorAll(CONFIG.PARENT_SELECTOR).forEach(parent => {
                parent.style.removeProperty('display');
            });
            this.processed = new WeakSet(); // 清空处理记录

            // 重新执行屏蔽
            Object.entries(this.manager).forEach(([key, cfg]) => {
                document.querySelectorAll(cfg.selector).forEach(el => {
                    if (this.processed.has(el) && !force) return;

                    const content = el.textContent.trim();
                    const shouldBlock = [...cfg.data].some(word => {
                        switch(cfg.matchType) {
                            case 'exact': return content === word;
                            case 'fuzzy': return content.toLowerCase().includes(word.toLowerCase());
                            case 'regex': return new RegExp(word, 'i').test(content);
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

        // 处理添加关键词
        handleAddKey(key, input) {
            const word = input.value.trim();
            if (!word) return;

            this.manager[key].data.add(word);
            this.saveData(key);
            this.refreshList(key, input.parentElement.nextElementSibling);
            input.value = '';
            this.executeShielding(true);
        }

        // 处理移除关键词
        handleRemove(key, word) {
            this.manager[key].data.delete(word);
            this.saveData(key);
            const list = this.panel.querySelector(`[data-key="${key}"] .shield-list`); // 精准定位列表
            this.refreshList(key, list);
            this.executeShielding(true);
            this.isPanelOpen = true; // 强制保持面板开启状态
            this.panel.style.display = 'block'; // 显式维持显示
        }

        // 构建导入导出工具
        buildImportExport() {
            const tools = document.createElement('div');
            tools.style.padding = '16px';
            const exportButton = document.createElement('button');
            exportButton.textContent = '导出配置';
            exportButton.addEventListener('click', this.exportConfig.bind(this));
            const importInput = document.createElement('input');
            importInput.type = 'file';
            importInput.accept = '.json';
            importInput.addEventListener('change', this.importConfig.bind(this));
            tools.appendChild(exportButton);
            tools.appendChild(importInput);
            return tools;
        }

        // 导出配置文件
        exportConfig() {
            const data = Object.entries(this.manager).reduce((acc, [key, cfg]) => {
                acc[key] = [...cfg.data];
                return acc;
            }, {});

            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `shield-config_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
        }

        // 导入配置文件
        importConfig(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    Object.entries(data).forEach(([key, values]) => {
                        if (this.manager[key]) {
                            this.manager[key].data = new Set(values);
                            this.saveData(key);
                        }
                    });
                    this.executeShielding(true);
                } catch(err) {
                    alert('配置文件格式错误');
                }
            };
            reader.readAsText(file);
        }
    }

    /* ==================== 初始化系统 ==================== */
    let initialized = false;
    let updateTimer = null;
function init() {
    if (initialized || document.readyState !== 'complete') return;

    checkForUpdates();
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
