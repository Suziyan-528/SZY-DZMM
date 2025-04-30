// dom.js

/**
 * 根据选择器查找元素
 * @param {string} selector - CSS 选择器
 * @param {Element} [parent=document] - 父元素，默认为 document
 * @returns {Element|null} - 找到的元素或 null
 */
export function findElement(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * 根据选择器查找所有元素
 * @param {string} selector - CSS 选择器
 * @param {Element} [parent=document] - 父元素，默认为 document
 * @returns {NodeList} - 找到的元素列表
 */
export function findElements(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * 为元素添加类名
 * @param {Element} element - 要添加类名的元素
 * @param {string} className - 要添加的类名
 */
export function addClass(element, className) {
    if (element.classList) {
        element.classList.add(className);
    } else {
        element.className += ' ' + className;
    }
}

/**
 * 为元素移除类名
 * @param {Element} element - 要移除类名的元素
 * @param {string} className - 要移除的类名
 */
export function removeClass(element, className) {
    if (element.classList) {
        element.classList.remove(className);
    } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}

/**
 * 检查元素是否包含某个类名
 * @param {Element} element - 要检查的元素
 * @param {string} className - 要检查的类名
 * @returns {boolean} - 是否包含该类名
 */
export function hasClass(element, className) {
    if (element.classList) {
        return element.classList.contains(className);
    }
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
}

/**
 * 为元素添加事件监听器
 * @param {Element} element - 要添加事件监听器的元素
 * @param {string} eventType - 事件类型
 * @param {Function} callback - 事件回调函数
 * @param {boolean|Object} [options=false] - 事件监听器选项
 */
export function addEventListener(element, eventType, callback, options = false) {
    element.addEventListener(eventType, callback, options);
}

/**
 * 从元素移除事件监听器
 * @param {Element} element - 要移除事件监听器的元素
 * @param {string} eventType - 事件类型
 * @param {Function} callback - 事件回调函数
 * @param {boolean|Object} [options=false] - 事件监听器选项
 */
export function removeEventListener(element, eventType, callback, options = false) {
    element.removeEventListener(eventType, callback, options);
}

/**
 * 创建元素
 * @param {string} tagName - 元素标签名
 * @param {Object} [attributes={}] - 元素属性
 * @param {string} [textContent=''] - 元素文本内容
 * @returns {Element} - 创建的元素
 */
export function createElement(tagName, attributes = {}, textContent = '') {
    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}
    
