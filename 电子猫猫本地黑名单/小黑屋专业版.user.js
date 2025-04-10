// ==UserScript==
// @name         电子猫猫智能拦截小黑屋-专业稳定版
// @namespace    https://github.com/yourname
// @version      5.6
// @description  支持多维分类、可视化管理的智能内容过滤工具
// @author       苏子言
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai*.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    /* ==================== 用户配置区域 ==================== */
    const CONFIG = {
        // 分类配置 (可自由增减)
        CATEGORIES: {
            author: {
                selector: '.item-author',
                storageKey: 'AUTHOR_KEYS',
                label: '👤 作者屏蔽',
                matchType: 'exact'
            },
            title: {
                selector: '.item-title-scope',
                storageKey: 'TITLE_KEYS',
                label: '📌 标题屏蔽',
                matchType: 'fuzzy'
            },
            description: {
                selector: '.item-des',
                storageKey: 'DESC_KEYS',
                label: '📝 简介屏蔽',
                matchType: 'regex'
            }
        },

        // 高级配置
        PARENT_SELECTOR: 'uni-view.item',
        HOTKEY: 'Ctrl+Shift+a',
        Z_INDEX: 2147483647,
        DEBOUNCE: 300
    };

    /* ==================== 核心系统 ==================== */
    class ShieldSystem {
        constructor() {
            this.processed = new WeakSet();
            this.manager = this.initManager();
            this.isPanelOpen = false;
            this.initPanel();
            this.bindGlobalEvents();
            this.initMobileButton(); // 新增移动端按钮
            this.executeShielding();
        }

        initManager() {
            const managers = {};
            Object.entries(CONFIG.CATEGORIES).forEach(([key, cfg]) => {
                try {
                    managers[key] = {
                        ...cfg,
                        data: new Set(JSON.parse(GM_getValue(cfg.storageKey, '[]')))
                    };
                } catch (error) {
                    console.error(`读取 ${cfg.storageKey} 数据时出错:`, error);
                    managers[key] = {
                        ...cfg,
                        data: new Set()
                    };
                }
            });
            return managers;
        }

        saveData(key) {
            try {
                GM_setValue(
                    CONFIG.CATEGORIES[key].storageKey,
                    JSON.stringify([...this.manager[key].data])
                );
            } catch (error) {
                console.error(`保存 ${CONFIG.CATEGORIES[key].storageKey} 数据时出错:`, error);
            }
        }

        /* ========== 面板系统 ========== */
        initPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'smart-shield-panel';
            this.applyPanelStyle();
            this.buildPanelUI();
            document.documentElement.appendChild(this.panel);
        }

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
            GM_addStyle(`
                #smart-shield-panel {
                    ${isMobile ? `
                        width: 90% !important;
                        right: 5% !important;
                        top: 20px !important;
                        max-height: 80vh;
                        font-size: 14px;
                    ` : `
                        width: 320px !important;
                        right: 20px !important;
                        top: 80px !important;
                    `}
                }
                .shield-input input {
                    ${isMobile ? 'padding: 12px;' : ''}
                }
                @media (max-width: 600px) {
                    #smart-shield-panel {
                        width: 95% !important;
                        right: 2.5% !important;
                    }
                }
            `);
        }

        bindGlobalEvents() {
            // 快捷键监听
            const [modifier1, modifier2, key] = CONFIG.HOTKEY.split('+');
            document.addEventListener('keydown', e => {
                const isModifier1 = modifier1 === 'Ctrl' ? e.ctrlKey : modifier1 === 'Shift' ? e.shiftKey : false;
                const isModifier2 = modifier2 === 'Ctrl' ? e.ctrlKey : modifier2 === 'Shift' ? e.shiftKey : false;
                if (isModifier1 && isModifier2 && e.key.toLowerCase() === key.toLowerCase()) {
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
                    this.togglePanel();
                }
            });

            // 油猴菜单命令
            GM_registerMenuCommand(isMobile ? '显示屏蔽面板' : '打开屏蔽面板', () => {
                this.togglePanel();
            });

            // 移动端触摸事件
            if (isMobile) {
                let touchStartTime = 0;
                this.mobileTrigger.addEventListener('touchstart', e => {
                    touchStartTime = Date.now();
                    e.preventDefault();
                });
                this.mobileTrigger.addEventListener('touchend', e => {
                    if (Date.now() - touchStartTime < 500) {
                        this.togglePanel();
                    }
                    e.preventDefault();
                });
            }

            // 动态内容监听
            new MutationObserver(() => this.executeShielding())
               .observe(document.body, { childList: true, subtree: true });
        }

        /* ========== 移动端适配 ========== */
        initMobileButton() {
            if (!isMobile) return;

            // 悬浮触发按钮
            this.mobileTrigger = document.createElement('div');
            this.mobileTrigger.id = 'shield-mobile-trigger';
            this.mobileTrigger.innerHTML = '🛡️';

            Object.assign(this.mobileTrigger.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                background: '#007bff',
                color: 'white',
                borderRadius: '50%',
                fontSize: '24px',
                textAlign: 'center',
                lineHeight: '50px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: CONFIG.Z_INDEX - 1,
                cursor: 'pointer',
                userSelect: 'none'
            });

            try {
                document.body.appendChild(this.mobileTrigger);
            } catch (error) {
                console.error('添加悬浮按钮到 body 时出错:', error);
            }
        }

        togglePanel() {
            this.isPanelOpen = !this.isPanelOpen;
            this.panel.style.display = this.isPanelOpen ? 'block' : 'none';

            // 移动端动画
            if (isMobile && this.isPanelOpen) {
                this.panel.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    this.panel.style.transform = 'translateY(0)';
                    this.panel.style.transition = 'transform 0.3s ease';
                }, 10);
            }
        }

        buildPanelUI() {
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
            this.panel.append(closeBtn, tabBar, contentArea, tools);
        }

        createTabButton(label, isActive) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.className = isActive ? 'active' : '';
            return btn;
        }

        createContentPanel(key, cfg, isVisible) {
            const panel = document.createElement('div');
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
        executeShielding(force = false) {
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
        refreshList(key, list) {
            list.innerHTML = '';
            this.manager[key].data.forEach(word => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                span.textContent = word;
                const button = document.createElement('button');
                button.textContent = '×';
                button.addEventListener('click', () => this.handleRemove(key, word));
                li.appendChild(span);
                li.appendChild(button);
                list.appendChild(li);
            });
        }

        handleAddKey(key, input) {
            const word = input.value.trim();
            if (!word) return;

            this.manager[key].data.add(word);
            this.saveData(key);
            this.refreshList(key, input.parentElement.nextElementSibling);
            input.value = '';
            this.executeShielding(true);
        }

        handleRemove(key, word) {
            this.manager[key].data.delete(word);
            this.saveData(key);
            const list = document.querySelector(`.content-panel[data-key="${key}"] .shield-list`);
            this.refreshList(key, list);
            this.executeShielding(true);
        }

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

    function init() {
        if (initialized || document.readyState !== 'complete') return;
        new ShieldSystem();
        initialized = true;
    }

    window.addEventListener('load', init);
    document.addEventListener('DOMContentLoaded', init);
    setTimeout(init, 2000);

})();    
