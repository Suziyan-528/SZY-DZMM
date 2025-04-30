// version.js
import { GITHUB_REPO } from './config.js';

/**
 * 比较两个版本号的大小
 * @param {string} version1 - 第一个版本号
 * @param {string} version2 - 第二个版本号
 * @returns {number} - 若 version1 > version2 返回 1，version1 < version2 返回 -1，相等返回 0
 */
export function compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;

        if (v1Part > v2Part) {
            return 1;
        } else if (v1Part < v2Part) {
            return -1;
        }
    }

    return 0;
}

/**
 * 从 GitHub API 获取最新版本号
 * @returns {Promise<string|null>} - 最新版本号或 null（若请求失败）
 */
export async function getLatestVersionFromGitHub() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.tag_name.replace('v', '');
    } catch (error) {
        console.error('获取最新版本号时出错:', error);
        return null;
    }
}

/**
 * 检查是否有新版本
 * @param {string} currentVersion - 当前版本号
 * @returns {Promise<boolean>} - 是否有新版本
 */
export async function checkForNewVersion(currentVersion) {
    const latestVersion = await getLatestVersionFromGitHub();
    if (latestVersion) {
        return compareVersions(latestVersion, currentVersion) > 0;
    }
    return false;
}
    
