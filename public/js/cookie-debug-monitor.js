/**
 * Cookie Debug Monitor - Muammolarni kuzatish uchun
 * 🔍 Bu fayl cookie expiration muammolarini debug qilish uchun
 */

class CookieDebugMonitor {
    constructor() {
        this.isDebugMode = true; // Production da false qiling
        this.monitorInterval = null;
        this.previousCookies = {};
        
        if (this.isDebugMode) {
            this.startMonitoring();
        }
    }
    
    startMonitoring() {
        console.log('🍪 Cookie Debug Monitor started');
        
        // Har 10 soniyada cookie holatin check qil
        this.monitorInterval = setInterval(() => {
            this.checkCookieChanges();
        }, 10000);
        
        // Immediate check
        this.checkCookieChanges();
    }
    
    checkCookieChanges() {
        const currentCookies = this.getCurrentAuthCookies();
        
        // Check for disappeared cookies
        Object.keys(this.previousCookies).forEach(cookieName => {
            if (this.previousCookies[cookieName] && !currentCookies[cookieName]) {
                console.warn(`🚨 COOKIE DISAPPEARED: ${cookieName} vanished from browser!`);
                console.warn(`Previous value: ${this.previousCookies[cookieName].substring(0, 20)}...`);
                console.warn(`Timestamp: ${new Date().toISOString()}`);
                
                // Try to identify what might have caused it
                this.analyzeDisappearance(cookieName);
            }
        });
        
        // Check for new cookies
        Object.keys(currentCookies).forEach(cookieName => {
            if (!this.previousCookies[cookieName] && currentCookies[cookieName]) {
                console.log(`✅ NEW COOKIE SET: ${cookieName}`);
                console.log(`Value: ${currentCookies[cookieName].substring(0, 20)}...`);
            }
        });
        
        this.previousCookies = { ...currentCookies };
    }
    
    getCurrentAuthCookies() {
        const cookies = {};
        const authCookieNames = ['accessToken', 'refreshToken', 'sessionId'];
        
        authCookieNames.forEach(name => {
            const value = this.getCookie(name);
            if (value) {
                cookies[name] = value;
            }
        });
        
        return cookies;
    }
    
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
    
    analyzeDisappearance(cookieName) {
        console.group(`🔍 Analyzing ${cookieName} disappearance:`);
        
        // Check current page
        console.log(`Current page: ${window.location.pathname}`);
        
        // Check if any AJAX requests were made recently
        console.log(`Recent network activity: Check DevTools Network tab`);
        
        // Check browser console for errors
        console.log(`Check for JavaScript errors in console`);
        
        // Common causes
        console.log(`Common causes:`);
        console.log(`1. Cookie maxAge expired (shorter than JWT expiry)`);
        console.log(`2. Server sent cookie with maxAge=0 (clear cookie)`);
        console.log(`3. JavaScript called document.cookie with expires in past`);
        console.log(`4. Browser security policy cleared cookies`);
        console.log(`5. User manually cleared cookies`);
        
        console.groupEnd();
    }
    
    logCookieDetails() {
        console.group('🍪 Current Cookie Status:');
        
        const cookies = this.getCurrentAuthCookies();
        Object.keys(cookies).forEach(name => {
            console.log(`${name}: ${cookies[name] ? 'Present (' + cookies[name].length + ' chars)' : 'Missing'}`);
        });
        
        // Also log full document.cookie for debugging
        console.log(`Full document.cookie: ${document.cookie}`);
        
        console.groupEnd();
    }
    
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            console.log('🍪 Cookie Debug Monitor stopped');
        }
    }
}

// Auto-initialize debug monitor
if (typeof window !== 'undefined') {
    window.cookieDebugMonitor = new CookieDebugMonitor();
    
    // Global function to check cookie status
    window.checkCookies = () => {
        window.cookieDebugMonitor.logCookieDetails();
    };
    
    console.log('🍪 Cookie Debug Monitor loaded. Use checkCookies() to inspect current status.');
}
