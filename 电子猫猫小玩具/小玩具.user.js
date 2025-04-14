// ==UserScript==
// @name         电子猫猫电量修改器
// @namespace    https://github.com/Suziyan-528/SZY-DZMM/
// @version      1.5
// @description  一款用来修改自己电量的小玩具（纯没用，骗人而已）
// @author       苏子言
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai10.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    const CONFIG = {
        targetSelectors: {
            balance: '.balance',
            element1: '.p-value span',
            element2: '#balance',
            element3: '.label-title'
        },
        storageKey: 'customValueStorage',
        notificationDuration: 2500
    };
    class ValueModifier {
        constructor() {
            this.init();
            this.restoreInProgress = false; 
        }
        init() {
            this.setupMutationObserver();
            this.restoreValues();
            this.registerMenuCommands();
        }
        modifyElements(doc, newValue) {
            const balanceEl = doc.querySelector(CONFIG.targetSelectors.balance);
            if (balanceEl) {
                this.cleanTextNodes(balanceEl);
                this.insertBalanceValue(balanceEl, newValue);
            }
            this.modifyStandardElement(doc, CONFIG.targetSelectors.element1, newValue);
            this.modifyStandardElement(doc, CONFIG.targetSelectors.element2, newValue);
            this.modifyStandardElement(doc, CONFIG.targetSelectors.element3, `我的电量 ${newValue}`);
        }
        cleanTextNodes(element) {
            const textNodes = [];
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    textNodes.push(node);
                }
            });
            textNodes.forEach(node => node.remove());
        }
        insertBalanceValue(element, value) {
            const lastElementChild = element.lastElementChild;
            const textNode = document.createTextNode(` ${value}`);

            if (lastElementChild) {
                element.insertBefore(textNode, lastElementChild.nextSibling);
            } else {
                element.appendChild(textNode);
            }
        }
        modifyStandardElement(doc, selector, value) {
            const element = doc.querySelector(selector);
            if (element) element.textContent = value;
        }
        applyToAllDocuments(callback) {
            this.safeDOMOperation(document, callback);
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    this.safeDOMOperation(iframeDoc, callback);
                } catch (error) {
                    console.warn('iframe访问受限:', error.message);
                }
            });
        }
        safeDOMOperation(doc, callback) {
            if (doc.readyState === 'complete') {
                callback(doc);
            } else {
                doc.addEventListener('DOMContentLoaded', () => callback(doc));
            }
        }
        saveValue(value) {
            GM_setValue(CONFIG.storageKey, value);
            this.applyToAllDocuments(doc => this.modifyElements(doc, value));
            this.showNotification('数值已保存');
        }

        restoreValues() {
            if (this.restoreInProgress) return; 
            this.restoreInProgress = true; 
            const savedValue = GM_getValue(CONFIG.storageKey);
            if (savedValue) {
                this.applyToAllDocuments(doc => this.modifyElements(doc, savedValue));
            }
            setTimeout(() => {
                this.restoreInProgress = false; 
            }, 1000); 
        }
        resetValues() {
            GM_setValue(CONFIG.storageKey, '');
            this.applyToAllDocuments(doc => {
                Object.values(CONFIG.targetSelectors).forEach(selector => {
                    doc.querySelectorAll(selector).forEach(el => {
                        if (selector === CONFIG.targetSelectors.balance) {
                            this.cleanTextNodes(el);
                        } else {
                            el.textContent = '';
                        }
                    });
                });
            });
            this.showNotification('数值已重置');
        }
        showEditor() {
            const dialog = document.createElement('div');
            dialog.id = 'valueEditorDialog';
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 2147483647;
                min-width: 300px;
                font-family: system-ui, -apple-system, sans-serif;
            `;
            const title = document.createElement('h3');
            title.textContent = '修改数值';
            title.style.cssText = `
                margin: 0 0 15px 0;
                color: #333;
                font-size: 18px;
            `;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = GM_getValue(CONFIG.storageKey) || '';
            input.placeholder = '输入新数值...';
            input.style.cssText = `
                width: 100%;
                padding: 10px;
                margin-bottom: 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            `;
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            `;
            const createButton = (text, color, action) => {
                const btn = document.createElement('button');
                btn.textContent = text;
                btn.style.cssText = `
                    padding: 8px 16px;
                    background: ${color};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                `;
                btn.onmouseover = () => {
                    const newColor = this.darkenColor(color, 20);
                    btn.style.background = newColor;
                };
                btn.onmouseout = () => {
                    btn.style.background = color;
                };
                btn.onclick = action;
                return btn;
            };

            buttonContainer.append(
                createButton('取消', '#6c757d', () => dialog.remove()),
                createButton('确认', '#28a745', () => {
                    if (input.value.trim()) {
                        this.saveValue(input.value.trim());
                        dialog.remove();
                    }
                })
            );
            dialog.append(title, input, buttonContainer);
            document.body.appendChild(dialog);
            input.focus();
        }

        darkenColor(hex, percent) {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
        }
        showNotification(message) {
            GM_notification({
                text: message,
                title: '数值修改器',
                timeout: CONFIG.notificationDuration
            });
        }
        setupMutationObserver() {
            const observer = new MutationObserver(mutations => {
                if (GM_getValue(CONFIG.storageKey) && mutations.some(mutation => mutation.type === 'childList')) {
                    this.restoreValues();
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        registerMenuCommands() {
            GM_registerMenuCommand('✏️ 修改数值', () => this.showEditor());
            GM_registerMenuCommand('🗑️ 重置数值', () => this.resetValues());
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ValueModifier());
    } else {
        new ValueModifier();
    }
})();
