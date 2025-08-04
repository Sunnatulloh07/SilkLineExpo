/**
 * SLEX Token Debug Utilities
 * Development and production debugging tools for token management
 */

class TokenDebugger {
    constructor() {
        this.logHistory = [];
        this.maxLogs = 100;
        
        this.init();
    }

    init() {
        // Add debug panel to page if in debug mode
        if (this.isDebugMode()) {
            this.createDebugPanel();
        }
        
        // Listen for token events
        this.setupEventListeners();
    }

    isDebugMode() {
        return localStorage.getItem('slex_token_debug') === 'true' || 
               window.location.search.includes('token_debug=true');
    }

    createDebugPanel() {
        // Create floating debug panel
        const panel = document.createElement('div');
        panel.id = 'token-debug-panel';
        panel.innerHTML = `
            <div class="debug-panel">
                <div class="debug-header">
                    <span>🔐 Token Debug</span>
                    <button onclick="tokenDebugger.togglePanel()" class="debug-toggle">−</button>
                </div>
                <div class="debug-content">
                    <div class="debug-section">
                        <h4>Token Status</h4>
                        <div id="token-status"></div>
                    </div>
                    <div class="debug-section">
                        <h4>Actions</h4>
                        <button onclick="tokenDebugger.forceRefresh()">Force Refresh</button>
                        <button onclick="tokenDebugger.showTokens()">Show Tokens</button>
                        <button onclick="tokenDebugger.clearLogs()">Clear Logs</button>
                    </div>
                    <div class="debug-section">
                        <h4>Recent Logs</h4>
                        <div id="debug-logs"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        panel.innerHTML += `
            <style>
                #token-debug-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 350px;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    border-radius: 8px;
                    font-family: monospace;
                    font-size: 12px;
                    z-index: 999999;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }
                .debug-panel { padding: 0; }
                .debug-header {
                    background: #1a1a1a;
                    padding: 10px;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .debug-toggle {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    font-size: 16px;
                }
                .debug-content {
                    padding: 15px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .debug-section {
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #333;
                }
                .debug-section h4 {
                    margin: 0 0 8px 0;
                    color: #4CAF50;
                    font-size: 13px;
                }
                .debug-section button {
                    background: #2196F3;
                    border: none;
                    color: white;
                    padding: 4px 8px;
                    margin: 2px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                }
                .debug-section button:hover {
                    background: #1976D2;
                }
                #token-status {
                    background: #2a2a2a;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 11px;
                }
                #debug-logs {
                    background: #2a2a2a;
                    padding: 8px;
                    border-radius: 4px;
                    max-height: 150px;
                    overflow-y: auto;
                    font-size: 10px;
                }
                .log-entry {
                    margin-bottom: 4px;
                    padding: 2px 0;
                    border-bottom: 1px solid #444;
                }
                .log-time {
                    color: #888;
                }
                .log-level-error { color: #f44336; }
                .log-level-warn { color: #ff9800; }
                .log-level-info { color: #2196f3; }
                .log-level-success { color: #4caf50; }
            </style>
        `;
        
        document.body.appendChild(panel);
        
        // Update status periodically
        setInterval(() => this.updateStatus(), 2000);
        this.updateStatus();
    }

    setupEventListeners() {
        // Intercept console logs for token-related messages
        const originalLog = console.log;
        console.log = (...args) => {
            if (args[0] && args[0].includes && args[0].includes('[TokenManager]')) {
                this.addLog('info', args.slice(1).join(' '));
            }
            return originalLog.apply(console, args);
        };

        const originalError = console.error;
        console.error = (...args) => {
            if (args[0] && args[0].includes && args[0].includes('[TokenManager]')) {
                this.addLog('error', args.slice(1).join(' '));
            }
            return originalError.apply(console, args);
        };
    }

    addLog(level, message) {
        const logEntry = {
            timestamp: new Date(),
            level,
            message: String(message)
        };
        
        this.logHistory.unshift(logEntry);
        
        if (this.logHistory.length > this.maxLogs) {
            this.logHistory = this.logHistory.slice(0, this.maxLogs);
        }
        
        this.updateLogs();
    }

    updateStatus() {
        const statusEl = document.getElementById('token-status');
        if (!statusEl || !window.tokenManager) return;
        
        try {
            const status = window.tokenManager.getStatus();
            const tokenInfo = window.tokenManager.getTokenInfo();
            
            const expiresInMinutes = Math.floor(status.expiresIn / 60000);
            const expiresInSeconds = Math.floor((status.expiresIn % 60000) / 1000);
            
            statusEl.innerHTML = `
                <div><strong>Authenticated:</strong> ${status.authenticated ? '✅' : '❌'}</div>
                <div><strong>User:</strong> ${status.userId || 'N/A'} (${status.userType || 'N/A'})</div>
                <div><strong>Expires in:</strong> ${expiresInMinutes}m ${expiresInSeconds}s</div>
                <div><strong>Refreshing:</strong> ${status.isRefreshing ? '🔄' : '💤'}</div>
                <div><strong>Issued:</strong> ${tokenInfo.issuedAt ? new Date(tokenInfo.issuedAt).toLocaleTimeString() : 'N/A'}</div>
            `;
        } catch (error) {
            statusEl.innerHTML = `<div style="color: #f44336;">Error: ${error.message}</div>`;
        }
    }

    updateLogs() {
        const logsEl = document.getElementById('debug-logs');
        if (!logsEl) return;
        
        const logsHtml = this.logHistory.slice(0, 20).map(log => `
            <div class="log-entry">
                <span class="log-time">${log.timestamp.toLocaleTimeString()}</span>
                <span class="log-level-${log.level}"> [${log.level.toUpperCase()}]</span>
                ${log.message}
            </div>
        `).join('');
        
        logsEl.innerHTML = logsHtml;
    }

    togglePanel() {
        const content = document.querySelector('.debug-content');
        const toggle = document.querySelector('.debug-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '−';
        } else {
            content.style.display = 'none';
            toggle.textContent = '+';
        }
    }

    async forceRefresh() {
        if (window.tokenManager) {
            try {
                this.addLog('info', 'Manual refresh triggered');
                await window.tokenManager.forceRefresh();
                this.addLog('success', 'Manual refresh completed');
            } catch (error) {
                this.addLog('error', `Manual refresh failed: ${error.message}`);
            }
        }
    }

    showTokens() {
        if (window.tokenManager) {
            const info = window.tokenManager.getTokenInfo();
            const accessToken = this.getCookie('accessToken');
            const refreshToken = this.getCookie('refreshToken');
            
            console.group('🔐 Token Information');
            console.log('Token Info:', info);
            console.log('Access Token:', accessToken ? accessToken.substring(0, 50) + '...' : 'None');
            console.log('Refresh Token:', refreshToken ? refreshToken.substring(0, 50) + '...' : 'None');
            console.groupEnd();
            
            this.addLog('info', 'Token information logged to console');
        }
    }

    clearLogs() {
        this.logHistory = [];
        this.updateLogs();
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    // Public API for console debugging
    static enableDebug() {
        localStorage.setItem('slex_token_debug', 'true');
        window.location.reload();
    }

    static disableDebug() {
        localStorage.removeItem('slex_token_debug');
        window.location.reload();
    }

    static getTokenStatus() {
        if (window.tokenManager) {
            return window.tokenManager.getStatus();
        }
        return { error: 'TokenManager not available' };
    }

    static analyzeTokens() {
        const accessToken = this.prototype.getCookie('accessToken');
        const refreshToken = this.prototype.getCookie('refreshToken');
        
        if (!accessToken || !refreshToken) {
            return { error: 'No tokens found' };
        }
        
        try {
            const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
            const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
            
            return {
                access: {
                    expiresAt: new Date(accessPayload.exp * 1000),
                    issuedAt: new Date(accessPayload.iat * 1000),
                    timeLeft: accessPayload.exp * 1000 - Date.now(),
                    payload: accessPayload
                },
                refresh: {
                    expiresAt: new Date(refreshPayload.exp * 1000),
                    issuedAt: new Date(refreshPayload.iat * 1000),
                    timeLeft: refreshPayload.exp * 1000 - Date.now(),
                    payload: refreshPayload
                }
            };
        } catch (error) {
            return { error: 'Failed to decode tokens' };
        }
    }
}

// Create global instance
const tokenDebugger = new TokenDebugger();

// Global debug API
window.tokenDebugger = tokenDebugger;
window.TokenDebug = TokenDebugger;

// Console commands for developers
console.log(`
🔐 SLEX Token Debug Commands:
• TokenDebug.enableDebug()  - Enable debug panel
• TokenDebug.disableDebug() - Disable debug panel  
• TokenDebug.getTokenStatus() - Get current status
• TokenDebug.analyzeTokens() - Analyze token details
• tokenDebugger.forceRefresh() - Force token refresh
• tokenDebugger.showTokens() - Log token info
`);

// For non-module scripts compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tokenDebugger;
} 