// TokenManager Fix - Make it more tolerant on admin pages
(function() {
    // Override the existing TokenManager behavior for admin pages
    const isAdminPage = window.location.pathname.includes('/admin');
    
    if (isAdminPage && window.tokenManager) {
        
        // Store original methods
        const originalCheckAndRefreshToken = window.tokenManager.checkAndRefreshToken;
        const originalEnsureValidToken = window.tokenManager.ensureValidToken;
        
        // Override checkAndRefreshToken to be less aggressive
        window.tokenManager.checkAndRefreshToken = function() {
            const tokenInfo = this.getTokenInfo();
            
            if (!tokenInfo.hasTokens) {
                return; // Don't error out on admin pages
            }
            
            // Call original method only if we have tokens
            return originalCheckAndRefreshToken.call(this);
        };
        
        // Override ensureValidToken to allow session auth fallback
        window.tokenManager.ensureValidToken = async function() {
            const tokenInfo = this.getTokenInfo();
            
            if (!tokenInfo.hasTokens) {
                return; // Allow request to proceed with session auth
            }
            
            // Call original method only if we have tokens
            return originalEnsureValidToken.call(this);
        };
        
    }
})(); 
