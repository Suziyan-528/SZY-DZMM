// ==UserScript==
// @name         电子猫猫本地黑名单
// @namespace    https://github.com/Suziyan-528/SZY-DZMM
// @version      2.2
// @description  精准屏蔽你想要屏蔽的内容，适配电子猫猫所有域名，本脚本在github免费开源，有问题可以tg找我
// @author       苏子言
// @match        *://*.sexyai.top/*
// @match        *://*.meimoai*.com/*
// ==/UserScript==

(function() {
    'use strict';
    const CONFIG = {

// ================== 用户配置，您需要改的内容就这些里面的东西，其他内容请勿修改 =================================================================================================================

// 一、【关键词类目】：1.作者："item-author"   2.标题："item-title-scope"   3.简介："item-des"  可以根据自己的需要修改，修改下面中括号里的内容

        TARGET_CLASS: ["item-author","item-title-scope","item-des"],

// 二、【屏蔽关键词】：例如作者名、标题、简介内容，每个关键词都需要打上""（英文双引号），然后再用英文,（逗号）隔开，问号填的内容就是您想要屏蔽的内容，例如："苏子言"

        KEYWORDS: ["？",],

// ===============================================================================================================================================================================================

// =================== 以下内容为脚本核心，请勿修改 ==============================================================================================================================================
PARENT_SELECTOR: "uni-view.item" };
const processed = new WeakSet();
function validateParent(element) {
const parent = element.closest(CONFIG.PARENT_SELECTOR);
if (!parent) return null;
const hasValidStructure =
parent。querySelector(".item-img-box") &&
parent。querySelector(".item-img-inf");
return hasValidStructure ? parent : null;}
function hideContent() {
document.querySelectorAll(`.${CONFIG.TARGET_CLASS}`).forEach(element => {
if (processed.has(element)) return;
if (CONFIG.KEYWORDS.some(word =>
element.textContent.trim() === word
))
{const parent = validateParent(element);
if (parent && !processed.has(parent)) {
parent.remove();
processed.add(parent);
console.log('已移除条目：', parent);}}});}
const observer = new MutationObserver(mutations => {
mutations.forEach(mutation => {
if (mutation.type === 'childList') {
mutation.addedNodes.forEach(node => {
if (node.nodeType === 1 && node.matches?.(CONFIG.PARENT_SELECTOR)) {
hideContent();}});}});});
hideContent();
observer.observe(document.body, {
childList: true,
subtree: true
});})();
