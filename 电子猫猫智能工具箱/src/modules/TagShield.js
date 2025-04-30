// TagShield.js
// 假设 GM_getValue 和 GM_setValue 以及 GM_addStyle 是全局可用的，若不是，需要引入对应的库或者处理方式

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

        // 如果已有面板则注入UI
        if (document.getElementById('smart-shield-panel')) {
            this.injectUI();
        }
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

        // 检查是否已存在标签屏蔽容器
        if (panel.querySelector('.tag-shield-container')) {
            this.injected = true;
            return;
        }
        // 创建标签屏蔽区域
        const container = document.createElement('div');
        container.classList.add('tag-shield-container');
        container.style.padding = '16px';
        container.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                🏷️ 标签屏蔽
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
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
        container.querySelector('#toggle-origin-tag').addEventListener('change', (e) => {
            this.state.hideOriginTag = e.target.checked;
            GM_setValue(this.STORAGE_KEYS.originTag, e.target.checked);
            this.execute();
        });
        // 插入到版本信息下方
        panel.insertBefore(container, panel.querySelector('.shield-tab'));
        this.injected = true;
    }
}

export default TagShield;
