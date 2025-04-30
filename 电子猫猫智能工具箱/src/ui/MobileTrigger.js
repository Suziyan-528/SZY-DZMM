// MobileTrigger.js
import { CONFIG } from './config.js';

class MobileTrigger {
    constructor(togglePanel) {
        this.togglePanel = togglePanel;
        this.createMobileTrigger();
    }

    createMobileTrigger() {
        const trigger = document.createElement('div');
        trigger.id = 'shield-mobile-trigger';
        trigger.textContent = '🛡️';
        trigger.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0);
            color: white;
            border-radius: 50%;
            font-size: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: ${CONFIG.Z_INDEX - 1};
            user-select: none;
        `;
        trigger.addEventListener('click', () => this.togglePanel());
        document.body.appendChild(trigger);
    }
}

export default MobileTrigger;    
