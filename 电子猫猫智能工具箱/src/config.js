// config.js
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
            selector: '.item-title-scope',
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

const GITHUB_REPO = 'Suziyan-528/SZY-DZMM';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时检查一次
const CURRENT_VERSION = '5.7.2';

export { CONFIG, GITHUB_REPO, UPDATE_CHECK_INTERVAL, CURRENT_VERSION };
