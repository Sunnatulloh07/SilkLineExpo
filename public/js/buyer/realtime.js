/**
 * Real-time Buyer Dashboard Features
 * WebSocket integration for live updates
 */
class BuyerRealtime {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.heartbeatInterval = null;
        this.init();
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/buyer`;
            
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = this.onOpen.bind(this);
            this.ws.onmessage = this.onMessage.bind(this);
            this.ws.onclose = this.onClose.bind(this);
            this.ws.onerror = this.onError.bind(this);
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.reconnect();
        }
    }

    onOpen() {
        console.log('✅ Buyer WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Send authentication
        this.send({
            type: 'auth',
            token: localStorage.getItem('authToken'),
            dashboard: 'buyer'
        });
    }

    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    onClose() {
        console.log('❌ Buyer WebSocket disconnected');
        this.stopHeartbeat();
        this.reconnect();
    }

    onError(error) {
        console.error('WebSocket error:', error);
    }

    handleMessage(data) {
        switch (data.type) {
            case 'order_update':
                this.handleOrderUpdate(data.payload);
                break;
            case 'new_message':
                this.handleNewMessage(data.payload);
                break;
            case 'supplier_response':
                this.handleSupplierResponse(data.payload);
                break;
            case 'price_alert':
                this.handlePriceAlert(data.payload);
                break;
            case 'delivery_update':
                this.handleDeliveryUpdate(data.payload);
                break;
            case 'stats_update':
                this.handleStatsUpdate(data.payload);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleOrderUpdate(payload) {
        // Update order status in real-time
        const orderElement = document.querySelector(`[data-order-id="${payload.orderId}"]`);
        if (orderElement) {
            const statusElement = orderElement.querySelector('.order-status');
            if (statusElement) {
                statusElement.textContent = payload.status;
                statusElement.className = `order-status status-${payload.status.toLowerCase()}`;
            }
        }

        // Show notification
        this.showNotification({
            type: 'info',
            title: 'Order Update',
            message: `Order ${payload.orderId} status changed to ${payload.status}`,
            icon: 'fas fa-shopping-cart'
        });

        // Update dashboard stats if on dashboard page
        if (window.location.pathname.includes('/dashboard')) {
            this.refreshDashboardStats();
        }
    }

    handleNewMessage(payload) {
        // Update message counter
        this.updateMessageCounter(payload.unreadCount);
        
        // Update conversation list if on communication page
        if (window.location.pathname.includes('/communication')) {
            this.refreshConversations();
        }

        // Show notification
        this.showNotification({
            type: 'message',
            title: 'New Message',
            message: `${payload.senderName}: ${payload.preview}`,
            icon: 'fas fa-envelope',
            action: () => {
                window.location.href = `/distributor/communication?conversation=${payload.conversationId}`;
            }
        });
    }

    handleSupplierResponse(payload) {
        // Show notification for RFQ responses
        this.showNotification({
            type: 'success',
            title: 'Supplier Response',
            message: `${payload.supplierName} responded to your RFQ: ${payload.rfqTitle}`,
            icon: 'fas fa-handshake',
            action: () => {
                window.location.href = `/distributor/communication?rfq=${payload.rfqId}`;
            }
        });
    }

    handlePriceAlert(payload) {
        // Show price change alerts
        this.showNotification({
            type: 'warning',
            title: 'Price Alert',
            message: `${payload.productName} price changed by ${payload.changePercent}%`,
            icon: 'fas fa-chart-line'
        });
    }

    handleDeliveryUpdate(payload) {
        this.showNotification({
            type: 'info',
            title: 'Delivery Update',
            message: `Order ${payload.orderId}: ${payload.message}`,
            icon: 'fas fa-truck'
        });
    }

    handleStatsUpdate(payload) {
        // Update KPI values in real-time
        Object.entries(payload).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 500);
            }
        });
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, 30000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    showNotification(options) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${options.type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${options.icon}"></i>
            </div>
            <div class="notification-content">
                <h4 class="notification-title">${options.title}</h4>
                <p class="notification-message">${options.message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add click handler
        if (options.action) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', options.action);
        }

        // Add close handler
        notification.querySelector('.notification-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(notification);
        });

        // Add to container
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    }

    removeNotification(notification) {
        notification.classList.add('notification-exit');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    updateMessageCounter(count) {
        const badge = document.getElementById('messagesBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    refreshDashboardStats() {
        if (window.buyerDashboard) {
            window.buyerDashboard.loadDashboardStats();
        }
    }

    refreshConversations() {
        if (window.buyerCommunication) {
            window.buyerCommunication.loadConversations();
        }
    }

    setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshDashboardStats();
            }
        });

        // Listen for network status changes
        window.addEventListener('online', () => {
            console.log('Network back online');
            this.connect();
        });

        window.addEventListener('offline', () => {
            console.log('Network offline');
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.stopHeartbeat();
    }
}

// Initialize real-time features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.buyerRealtime = new BuyerRealtime();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.buyerRealtime) {
        window.buyerRealtime.disconnect();
    }
});