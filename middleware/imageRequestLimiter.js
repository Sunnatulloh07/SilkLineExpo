/**
 * Image Request Rate Limiter Middleware
 * Prevents excessive image requests from single IP
 */

const Logger = require('../utils/Logger');

class ImageRequestLimiter {
    constructor() {
        this.requests = new Map(); // IP -> { count, lastReset }
        this.windowMs = 60000; // 1 minute window
        this.maxRequestsPerWindow = 100; // Max 100 image requests per minute per IP
        this.logger = new Logger('ImageLimiter');
        
        // Clean up old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    
    middleware() {
        return (req, res, next) => {
            // Only apply to image requests
            if (!this.isImageRequest(req)) {
                return next();
            }
            
            const clientIP = this.getClientIP(req);
            const now = Date.now();
            
            // Get or create client record
            let clientRecord = this.requests.get(clientIP);
            if (!clientRecord) {
                clientRecord = { count: 0, lastReset: now };
                this.requests.set(clientIP, clientRecord);
            }
            
            // Reset window if needed
            if (now - clientRecord.lastReset > this.windowMs) {
                clientRecord.count = 0;
                clientRecord.lastReset = now;
            }
            
            // Check limit
            if (clientRecord.count >= this.maxRequestsPerWindow) {
                this.logger.warn(`Rate limit exceeded for IP ${clientIP}: ${clientRecord.count} requests in window`);
                
                return res.status(429).json({
                    error: 'Too many image requests',
                    message: 'Please slow down your image requests',
                    retryAfter: Math.ceil((this.windowMs - (now - clientRecord.lastReset)) / 1000)
                });
            }
            
            // Increment counter
            clientRecord.count++;
            
            // Log suspicious activity
            if (clientRecord.count > 50) {
                this.logger.warn(`High image request count for IP ${clientIP}: ${clientRecord.count} requests`);
            }
            
            // Add headers for debugging
            res.set({
                'X-RateLimit-Limit': this.maxRequestsPerWindow,
                'X-RateLimit-Remaining': Math.max(0, this.maxRequestsPerWindow - clientRecord.count),
                'X-RateLimit-Reset': new Date(clientRecord.lastReset + this.windowMs).toISOString()
            });
            
            next();
        };
    }
    
    isImageRequest(req) {
        const path = req.path.toLowerCase();
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];
        return imageExtensions.some(ext => path.endsWith(ext));
    }
    
    getClientIP(req) {
        return req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               'unknown';
    }
    
    cleanup() {
        const now = Date.now();
        const toDelete = [];
        
        this.requests.forEach((record, ip) => {
            if (now - record.lastReset > this.windowMs * 2) { // Keep for 2 windows
                toDelete.push(ip);
            }
        });
        
        toDelete.forEach(ip => {
            this.requests.delete(ip);
        });
        
        if (toDelete.length > 0) {
            this.logger.log(`Cleaned up ${toDelete.length} old IP records`);
        }
    }
    
    getStats() {
        const stats = {
            activeIPs: this.requests.size,
            totalRequests: 0,
            highVolumeIPs: []
        };
        
        this.requests.forEach((record, ip) => {
            stats.totalRequests += record.count;
            if (record.count > 20) {
                stats.highVolumeIPs.push({ ip, count: record.count });
            }
        });
        
        return stats;
    }
}

module.exports = ImageRequestLimiter;
