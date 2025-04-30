// src/core/RuleEngine.js

import { CATEGORIES } from '../config.js';

/**
 * 规则匹配引擎
 * @class
 */
export class RuleEngine {
  constructor() {
    this.cachedRegex = new Map(); // 缓存正则表达式提升性能
  }

  /* ====================== 基础规则匹配 ====================== */

  /**
   * 单条规则匹配检测
   * @param {string} content - 待匹配内容
   * @param {Object} rule - 规则对象
   * @param {string} rule.pattern - 匹配模式
   * @param {string} rule.type - 规则类型（exact/fuzzy/regex）
   * @returns {boolean} 是否匹配成功
   */
  matchSingleRule(content, { pattern, type }) {
    try {
      switch (type) {
        case 'exact':
          return content === pattern;

        case 'fuzzy':
          return content.toLowerCase().includes(pattern.toLowerCase());

        case 'regex': {
          // 缓存正则表达式避免重复编译
          if (!this.cachedRegex.has(pattern)) {
            this.cachedRegex.set(pattern, new RegExp(pattern, 'i'));
          }
          return this.cachedRegex.get(pattern).test(content);
        }

        default:
          console.error(`未知规则类型: ${type}`);
          return false;
      }
    } catch (error) {
      console.error(`规则匹配失败 (${type}:${pattern})`, error);
      return false;
    }
  }

  /* ====================== 复合规则逻辑 ====================== */

  /**
   * 逻辑运算符组合匹配
   * @param {string} content - 待匹配内容
   * @param {Object[]} rules - 规则集合
   * @param {string} [logic='OR'] - 逻辑运算符（AND/OR）
   * @returns {boolean} 是否匹配成功
   */
  matchWithLogic(content, rules, logic = 'OR') {
    if (!Array.isArray(rules) || rules.length === 0) return false;

    return rules.reduce((result, rule) => {
      const currentMatch = this.matchSingleRule(content, rule);
      return logic === 'OR' ? (result || currentMatch) : (result && currentMatch);
    }, logic === 'AND');
  }

  /* ====================== 动态规则处理 ====================== */

  /**
   * 转换用户配置为规则对象
   * @param {Object} categoryConfig - 分类配置
   * @returns {Object[]} 标准化规则集合
   */
  normalizeRules(categoryConfig) {
    return [...categoryConfig.data].map(pattern => ({
      pattern,
      type: categoryConfig.matchType
    }));
  }

  /**
   * 批量验证规则有效性
   * @param {Object[]} rules - 规则集合
   * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
   */
  validateRules(rules) {
    const errors = [];
    
    rules.forEach((rule, index) => {
      if (!rule.pattern || typeof rule.pattern !== 'string') {
        errors.push(`规则 #${index + 1}: 缺少有效匹配模式`);
      }

      if (rule.type === 'regex') {
        try {
          new RegExp(rule.pattern, 'i');
        } catch (error) {
          errors.push(`规则 #${index + 1}: 无效正则表达式 - ${error.message}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /* ====================== 时间范围规则 ====================== */

  /**
   * 时间范围匹配（示例扩展）
   * @param {Date} contentDate - 内容发布时间
   * @param {Object} options - 时间配置
   * @param {number} [options.daysAgo=3] - 屏蔽 N 天前的内容
   * @returns {boolean} 是否在屏蔽时间范围内
   */
  isInTimeRange(contentDate, { daysAgo = 3 }) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    return contentDate < cutoffDate;
  }
}
