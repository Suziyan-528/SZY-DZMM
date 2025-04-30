// src/core/ShieldSystem.js

import { CATEGORIES, PARENT_SELECTOR, HOTKEY, Z_INDEX } from '../config.js';
import { debounce, getConfig, setConfig } from '../utils/storage.js';
import { createElement, injectGlobalStyle } from '../utils/dom.js';
import { TagShield } from '../modules/TagShield.js';

/**
 * 核心屏蔽系统控制器
 * @class
 */
export class ShieldSystem {
  constructor() {
    // 初始化属性
    this.processed = new WeakSet(); // 已处理的元素集合
    this.isPanelOpen = false;       // 面板显示状态
    this.manager = this.initManager(); // 规则管理器
    this.tagShield = new TagShield();  // 标签屏蔽模块

    // 绑定上下文
    this.executeShielding = this.executeShielding.bind(this);
    this.togglePanel = this.togglePanel.bind(this);

    // 初始化系统
    this.initPanel();
    this.bindGlobalEvents();
    this.checkMobileEnvironment();
  }

  /* ====================== 初始化方法 ====================== */

  /**
   * 初始化规则管理器
   * @returns {Object} 分类规则管理器
   */
  initManager() {
    return Object.entries(CATEGORIES).reduce((acc, [key, cfg]) => {
      acc[key] = {
        ...cfg,
        data: new Set(JSON.parse(getConfig(cfg.storageKey, '[]')))
      };
      return acc;
    }, {});
  }

  /**
   * 初始化屏蔽面板
   */
  initPanel() {
    this.panel = createElement('div', {
      position: 'fixed',
      top: '80px',
      right: '20px',
      width: '360px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: Z_INDEX,
      display: 'none'
    }, '', { id: 'smart-shield-panel' });

    this.buildPanelUI();
    document.documentElement.appendChild(this.panel);
  }

  /* ====================== 核心功能方法 ====================== */

  /**
   * 执行屏蔽逻辑
   * @param {boolean} [force=false] - 是否强制执行
   */
  executeShielding(force = false) {
    // 重置被隐藏的元素
    document.querySelectorAll(PARENT_SELECTOR).forEach(el => {
      el.style.removeProperty('display');
    });
    this.processed = new WeakSet();

    // 执行分类屏蔽
    Object.entries(this.manager).forEach(([key, cfg]) => {
      document.querySelectorAll(cfg.selector).forEach(el => {
        if (this.processed.has(el) && !force) return;
        const content = el.textContent.trim();
        const shouldBlock = [...cfg.data].some(word => {
          switch (cfg.matchType) {
            case 'exact': return content === word;
            case 'fuzzy': return content.toLowerCase().includes(word.toLowerCase());
            case 'regex': return new RegExp(word, 'i').test(content);
          }
        });
        if (shouldBlock) {
          const parent = el.closest(PARENT_SELECTOR);
          parent?.style.setProperty('display', 'none', 'important');
          this.processed.add(el);
        }
      });
    });

    // 执行标签屏蔽
    this.tagShield.execute();
  }

  /* ====================== UI 相关方法 ====================== */

  /**
   * 构建面板UI
   */
  buildPanelUI() {
    // 版本信息
    const versionInfo = createElement('div', {
      padding: '12px',
      textAlign: 'center',
      fontSize: '0.9em',
      color: '#888'
    }, `电子猫猫工具箱 v${GM_info.script.version} | tg@苏子言`);

    // 关闭按钮
    const closeBtn = createElement('button', {
      position: 'absolute',
      right: '12px',
      top: '12px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer'
    }, '×');
    closeBtn.addEventListener('click', this.togglePanel);

    // 选项卡和内容区
    const tabBar = this.createTabBar();
    const contentArea = this.createContentArea();

    // 组装面板
    this.panel.append(versionInfo, closeBtn, tabBar, contentArea);
    injectGlobalStyle(this.getPanelStyles());
  }

  /**
   * 创建选项卡导航栏
   * @returns {HTMLElement} 选项卡容器
   */
  createTabBar() {
    const tabBar = createElement('div', {
      display: 'flex',
      gap: '8px',
      padding: '12px',
      borderBottom: '1px solid #eee'
    });

    Object.entries(this.manager).forEach(([key, cfg], index) => {
      const tabBtn = createElement('button', {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        background: index === 0 ? '#007bff' : '#f5f5f5',
        color: index === 0 ? 'white' : 'inherit',
        cursor: 'pointer'
      }, cfg.label);
      tabBtn.dataset.category = key;
      tabBtn.addEventListener('click', () => this.switchTab(key));
      tabBar.appendChild(tabBtn);
    });

    return tabBar;
  }

  /* ====================== 工具方法 ====================== */

  /**
   * 切换面板显示状态
   */
  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
    this.panel.style.display = this.isPanelOpen ? 'block' : 'none';
  }

  /**
   * 检查移动端环境并创建触发按钮
   */
  checkMobileEnvironment() {
    if (!/Android|iPhone/i.test(navigator.userAgent)) return;
    const trigger = createElement('div', {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      background: 'rgba(0,123,255,0.9)',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      color: 'white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      cursor: 'pointer',
      zIndex: Z_INDEX - 1
    }, '🛡️');
    trigger.addEventListener('click', this.togglePanel);
    document.body.appendChild(trigger);
  }

  /**
   * 获取面板样式
   * @returns {string} CSS样式字符串
   */
  getPanelStyles() {
    return `
      #smart-shield-panel .shield-input input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      #smart-shield-panel .shield-list li {
        display: flex;
        align-items: center;
        padding: 8px;
        background: #f8f9fa;
        margin-bottom: 8px;
        border-radius: 4px;
      }
    `;
  }
}
