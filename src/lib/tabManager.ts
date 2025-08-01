import sessionExecutionService from '@/features/session-execution/services/sessionExecutionService';

const isAutoCloseTab = new URLSearchParams(window.location.search).get('autoclose') === 'true';
const tabId = sessionStorage.getItem('tabId') || Date.now().toString();
sessionStorage.setItem('tabId', tabId);

if (localStorage.getItem(`tab-moved-${tabId}`) && !isAutoCloseTab) {
    showMovedMessage();
} else {
    const channel = new BroadcastChannel('tab-mover');
    channel.onmessage = () => {
        if (!isAutoCloseTab) {
            localStorage.setItem(`tab-moved-${tabId}`, 'true');
            showMovedMessage();
        }
    };

    if (isAutoCloseTab) {
        localStorage.removeItem(`tab-moved-${tabId}`);
        channel.postMessage('move-other-tabs');
    }
}

function showMovedMessage() {
    sessionExecutionService.cleanup();
    document.title = 'Session Tab Moved';
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; 
                    font-family: system-ui; text-align: center; background: #f5f5f5; color: #666;">
            <div>
                <h2>Session Moved</h2>
                <p>Your session has been moved to another tab.</p>
                <p style="font-size: 14px; margin-top: 20px;">Please close this tab.</p>
            </div>
        </div>`;
}