/**
 * Professional Logger Utility
 * Senior Software Engineer Level Implementation
 * Enhanced logging with timestamps, colors, and structured data
 */

class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    /**
     * Get current timestamp in ISO format
     * @private
     */
    _getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message with context and timestamp
     * @private
     */
    _formatMessage(level, message, data = null) {
        const timestamp = this._getTimestamp();
        const contextStr = `[${this.context}]`;
        
        let logMessage = `${timestamp} ${level} ${contextStr} ${message}`;
        
        if (data && typeof data === 'object') {
            logMessage += `\n${JSON.stringify(data, null, 2)}`;
        }
        
        return logMessage;
    }

    /**
     * Log info message
     */
    log(message, data = null) {
        const formattedMessage = this._formatMessage('INFO', message, data);
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(
                this.colors.cyan + 
                formattedMessage + 
                this.colors.reset
            );
        } else {
            console.log(formattedMessage);
        }
    }

    /**
     * Log error message
     */
    error(message, error = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null;
        
        const formattedMessage = this._formatMessage('ERROR', message, errorData);
        
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                this.colors.red + 
                formattedMessage + 
                this.colors.reset
            );
        } else {
            console.error(formattedMessage);
        }
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
        const formattedMessage = this._formatMessage('WARN', message, data);
        
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                this.colors.yellow + 
                formattedMessage + 
                this.colors.reset
            );
        } else {
            console.warn(formattedMessage);
        }
    }

    /**
     * Log debug message (only in development)
     */
    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this._formatMessage('DEBUG', message, data);
            console.debug(
                this.colors.dim + 
                formattedMessage + 
                this.colors.reset
            );
        }
    }

    /**
     * Log success message
     */
    success(message, data = null) {
        const formattedMessage = this._formatMessage('SUCCESS', message, data);
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(
                this.colors.green + 
                formattedMessage + 
                this.colors.reset
            );
        } else {
            console.log(formattedMessage);
        }
    }
}

module.exports = Logger;
