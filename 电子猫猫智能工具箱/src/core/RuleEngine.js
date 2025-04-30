import { GITHUB_REPO, UPDATE_CHECK_INTERVAL, CURRENT_VERSION } from './config.js';

// 比较版本号，判断新版本是否比当前版本新
function isNewerVersion(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) {
            return true;
        } else if (latestPart < currentPart) {
            return false;
        }
    }
    return false;
}

// 显示更新通知
function showUpdateNotification(latestVersion) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #007bff;
        color: white;
        padding: 12px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 9999;
    `;
    notification.innerHTML = `
        发现新版本 v${latestVersion}！
        <a href="https://github.com/${GITHUB_REPO}/releases" target="_blank" style="color: white; text-decoration: underline; margin-left: 8px;">查看详情</a>
    `;
    document.body.appendChild(notification);

    // 一段时间后自动关闭通知
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

// 检查更新
async function checkForUpdates() {
    try {
        const lastCheck = GM_getValue('lastUpdateCheck', 0);
        const now = Date.now();
        if (now - lastCheck < UPDATE_CHECK_INTERVAL) {
            return;
        }

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const latestVersion = data.tag_name.replace('v', '');

        if (isNewerVersion(CURRENT_VERSION, latestVersion)) {
            showUpdateNotification(latestVersion);
        }

        GM_setValue('lastUpdateCheck', now);
    } catch (error) {
        console.error('检查更新时出错:', error);
    }
}

export { checkForUpdates, isNewerVersion, showUpdateNotification };    
