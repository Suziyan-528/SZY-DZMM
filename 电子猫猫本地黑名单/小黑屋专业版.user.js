// ==UserScript==
// @name         电子猫猫智能屏蔽小黑屋-专业稳定版
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      V5.5.4
// @description  支持多维屏蔽、可视化UI管理的智能内容过滤工具，便捷操作，支持电脑端、安卓端、苹果端
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
// @grant        GM_setValue
// @grant        GM_getValue
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
    const CURRENT_VERSION = 'V5.5.4';
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
            onerror: () => console.error('[更新检查] 网络请求失败')
        });
    }

    // 版本号比较函数
    function isNewerVersion(latest, current) {
        const l = latest.split('.').map(Number);
        const c = current.split('.').map(Number);
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
    if (existingBar) existingBar.remove();

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
            this.panel = document.createElement('div');
            this.panel.id = 'smart-shield-panel';
            // 应用面板样式
            this.applyPanelStyle();
            // 构建面板 UI
            this.buildPanelUI();
            document.documentElement.appendChild(this.panel);
        }

        // 应用面板样式
        applyPanelStyle() {
            GM_addStyle(`
                #smart-shield-panel {
                    position: fixed !important;
                    top: 80px !important;
                    right: 20px !important;
                    width: 320px !important;
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
        font-size: 0.9em;
        color: #666;
    `;
    versionInfo.textContent = `当前版本: ${CURRENT_VERSION} | tg@苏子言`;

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
