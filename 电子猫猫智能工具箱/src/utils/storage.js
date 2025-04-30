// storage.js

/**
 * 从存储中获取值
 * @param {string} key - 存储的键名
 * @param {any} [defaultValue=null] - 默认值，若未找到键对应的值则返回该默认值
 * @returns {any} - 存储的值或默认值
 */
export function getValue(key, defaultValue = null) {
    return GM_getValue(key, defaultValue);
}

/**
 * 将值存储到存储中
 * @param {string} key - 存储的键名
 * @param {any} value - 要存储的值
 */
export function setValue(key, value) {
    GM_setValue(key, value);
}

/**
 * 从存储中删除指定键的值
 * @param {string} key - 要删除的键名
 */
export function deleteValue(key) {
    GM_deleteValue(key);
}

/**
 * 检查存储中是否存在指定键
 * @param {string} key - 要检查的键名
 * @returns {boolean} - 是否存在该键
 */
export function hasValue(key) {
    return GM_getValue(key) !== undefined;
}
    
