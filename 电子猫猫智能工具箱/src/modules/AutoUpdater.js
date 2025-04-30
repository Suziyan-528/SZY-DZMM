// AutoUpdater.js

class AutoUpdater {
    constructor(currentVersion, githubRepo, updateCheckInterval) {
        this.CURRENT_VERSION = currentVersion;
        this.GITHUB_REPO = githubRepo;
        this.UPDATE_CHECK_INTERVAL = updateCheckInterval;
    }

    // 检查更新逻辑
    checkForUpdates() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.github.com/repos/${this.GITHUB_REPO}/releases/latest`,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/vnd.github.v3+json'
            },
            onload: (response) => {
                try {
                    const latest = JSON.parse(response.responseText);
                    const latestVersion = latest.tag_name;

                    // 版本号比较（支持x.y.z格式）
                    if (this.isNewerVersion(latestVersion, this.CURRENT_VERSION)) {
                        this.showUpdateNotification(latest);
                    } else {
                        console.log('[更新检查] 已是最新版本');
                    }
                } catch (error) {
                    console.error('[更新检查] 失败', error);
                }
            },
            onerror: (response) => {
                console.error('[更新检查] 网络请求失败，状态码:', response.status);
            }
        });
    }

    // 版本号比较函数
    isNewerVersion(latest, current) {
        // 移除 "V" 前缀并分割
        const l = latest.replace(/^V/i, '').split('.').map(Number);
        const c = current.replace(/^V/i, '').split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (l[i] > c[i]) return true;
            if (l[i] < c[i]) return false;
        }
        return false;
    }

    // 显示更新通知UI
    showUpdateNotification(latest) {
        // 清理旧更新条
        const existingBar = document.getElementById('update-notification-bar');
        if (existingBar) {
            existingBar.remove();
        }
        const updateBar = document.createElement('div');
        updateBar.id = 'update-notification-bar'; // 唯一标识
        updateBar.style.cssText = `
            padding: 12px;
            background: #ffeb3b;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
        `;
        updateBar.innerHTML = `
            <strong>发现新版本 ${latest.tag_name}！</strong><br>
            ${latest.body.split('\n').map(line => `<span>${line}</span>`).join('<br>')}<br>
            <a href="${latest.html_url}" target="_blank" style="color: #007bff; text-decoration: underline;">立即更新</a>
        `;
        const panel = document.getElementById('smart-shield-panel');
        if (panel) {
            panel.insertBefore(updateBar, panel.firstChild);
        }
    }

    // 启动更新检查定时器
    startUpdateCheck() {
        this.checkForUpdates();
        setInterval(() => this.checkForUpdates(), this.UPDATE_CHECK_INTERVAL);
    }
}

export default AutoUpdater;
