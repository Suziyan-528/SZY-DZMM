// Panel.js
// 假设 GM_getValue、GM_setValue、GM_addStyle、GM_registerMenuCommand、GM_xmlhttpRequest 是全局可用的，若不是，需要引入对应的库或者处理方式

class Panel {
    constructor(config, manager, isMobile, tagShield, executeShielding, checkForUpdates, updateCheckInterval) {
        this.CONFIG = config;
        this.manager = manager;
        this.isMobile = isMobile;
        this.tagShield = tagShield;
        this.executeShielding = executeShielding;
        this.checkForUpdates = checkForUpdates;
        this.UPDATE_CHECK_INTERVAL = updateCheckInterval;

        // 用于记录已经处理过的元素，避免重复处理
        this.processed = new WeakSet();
        // 标记屏蔽面板是否打开
        this.isPanelOpen = false;
        // 初始化屏蔽面板
        this.initPanel();
        // 绑定全局事件，如快捷键监听、点击关闭等
        this.bindGlobalEvents();
        // 如果是移动端，创建移动端触发按钮
        if (this.isMobile) {
            this.createMobileTrigger();
        }
        setTimeout(() => this.checkForUpdates(), 1000);
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
            z-index: ${this.CONFIG.Z_INDEX - 1};
            user-select: none;
        `;
        // 点击按钮时切换屏蔽面板的显示状态
        trigger.addEventListener('click', () => this.togglePanel());
        document.body.appendChild(trigger);
    }

    // 保存屏蔽关键词到存储中
    saveData(key) {
        GM_setValue(
            this.CONFIG.CATEGORIES[key].storageKey,
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
        const saveDataDebounced = this.debounce(this.saveData.bind(this), this.CONFIG.DEBOUNCE);
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

    // 防抖函数，用于避免用户频繁操作触发保存数据
    debounce(func, delay) {
        let timer;
        return function () {
            const context = this;
            const args = arguments;
            // 清除之前的定时器
            clearTimeout(timer);
            // 设置新的定时器，在指定延迟后执行函数
            timer = setTimeout(() => func.apply(context, args), delay);
        };
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
                z-index: ${this.CONFIG.Z_INDEX} !important;
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

    // 绑定全局事件
    bindGlobalEvents() {
        // 快捷键监听
        const [modifier1, modifier2, key] = this.CONFIG.HOTKEY.split('+');
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
        GM_registerMenuCommand(this.isMobile ? '显示屏蔽面板' : '打开屏蔽面板', () => {
            // 点击油猴菜单命令时切换屏蔽面板的显示状态
            this.togglePanel();
        });
        GM_registerMenuCommand('导出配置', () => this.exportConfig());
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
        const CURRENT_VERSION = '5.7.2';
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
            tabBtn.dataset.category = key;
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
            tagShieldState: this.tagShield.state
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shield-config_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 导入配置文件
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
                Object.entries(this.tagShield.STORAGE_KEYS).forEach(([stateKey, storageKey]) => {
                    const value = importedData.tagShieldState[`hide${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}`];
                    GM_setValue(storageKey, value);
                    this.tagShield.state[`hide${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}`] = value;
                });
                // 强制更新UI
                document.querySelectorAll('#toggle-author-tag, #toggle-usage-tag, #toggle-origin-tag').forEach(checkbox => {
                    const key = checkbox.id.replace('toggle-', '').replace('-tag', '');
                    checkbox.checked = this.tagShield.state[`hide${key.charAt(0).toUpperCase() + key.slice(1)}`];
                });
                this.tagShield.execute();
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

    // 重新渲染该分类的屏蔽关键词列表
    renderKeywordsList(category) {
        const list = this.panel.querySelector(`[data-key="${category}"] .shield-list`);
        this.refreshList(category, list);
    }
}

export default Panel;
