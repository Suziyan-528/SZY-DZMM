// ==UserScript==
// @name         电子猫猫工具箱
// @namespace    http://tampermonkey.net/
// @version      5.7.2
// @description  屏蔽特定元素的油猴脚本
// @author       苏子言
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/axios@1.3.5/dist/axios.min.js
// ==/UserScript==

import { CONFIG } from './config.js';
import Panel from './Panel.js';
import TagShield from './TagShield.js';
import MobileTrigger from './MobileTrigger.js';
import { checkForNewVersion } from './version.js';
import { getValue, setValue } from './storage.js';

// 初始化管理器
function initManager() {
    const managers = {};
    Object.entries(CONFIG.CATEGORIES).forEach(([key, cfg]) => {
        managers[key] = {
            ...cfg,
            data: new Set(JSON.parse(getValue(cfg.storageKey, '[]')))
        };
    });
    return managers;
}

const manager = initManager();
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const tagShield = new TagShield();

// 执行屏蔽逻辑
function executeShielding(force = false) {
    document.querySelectorAll(CONFIG.PARENT_SELECTOR).forEach(parent => {
        parent.style.removeProperty('display');
    });
    const processed = new WeakSet();
    Object.entries(manager).forEach(([key, cfg]) => {
        document.querySelectorAll(cfg.selector).forEach(el => {
            if (processed.has(el) && !force) return;
            const content = el.textContent.trim();
            const shouldBlock = [...cfg.data].some(word => {
                switch (cfg.matchType) {
                    case 'exact': return content === word;
                    case 'fuzzy': return content.toLowerCase().includes(word.toLowerCase());
                    case 'regex': return new RegExp(word, 'i').test(content);
                }
            });
            if (shouldBlock) {
                const parent = el.closest(CONFIG.PARENT_SELECTOR);
                parent?.style.setProperty('display', 'none', 'important');
                processed.add(el);
            }
        });
    });
    tagShield.execute();
}

// 检查更新
async function performUpdateCheck() {
    const currentVersion = '5.7.2';
    const hasNewVersion = await checkForNewVersion(currentVersion);
    if (hasNewVersion) {
        console.log('有新版本可用！');
        // 这里可以添加显示更新提示的逻辑
    } else {
        console.log('已是最新版本。');
    }
}

// 创建面板实例
const panel = new Panel(CONFIG, manager, isMobile, tagShield, executeShielding, performUpdateCheck, 24 * 60 * 60 * 1000);

// 创建移动端触发按钮
if (isMobile) {
    const mobileTrigger = new MobileTrigger(() => panel.togglePanel());
}

// 页面加载完成后执行屏蔽逻辑
window.addEventListener('load', () => {
    executeShielding();
    performUpdateCheck();
});
    
