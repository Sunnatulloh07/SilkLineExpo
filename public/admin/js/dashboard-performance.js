/**
 * Dashboard Performance Optimization Module
 * Professional-grade performance enhancements for KPI loading
 * Senior Software Engineer Level Implementation
 */

class DashboardPerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.loadingStates = new Map();
    this.disabled = false;
    
    // Check if dashboard performance is disabled
    if (window.DISABLE_DASHBOARD_PERFORMANCE) {
      console.log('🚫 Dashboard performance disabled for this page');
      this.disabled = true;
    }
    
    this.config = {
      cacheTimeout: 60000,    // 1 minute cache
      fastUpdateInterval: 5000,   // 5 seconds for critical data
      slowUpdateInterval: 30000,  // 30 seconds for less critical
      requestTimeout: 10000,      // 10 second timeout
      retryAttempts: 3,
      retryDelay: 2000
    };
  }

  /**
   * Professional Fast Data Loading with Cache
   */
  async loadDashboardDataFast(priority = 'high') {
    if (this.disabled) {
      console.log('🚫 Dashboard performance optimizer is disabled');
      return null;
    }
    
    const cacheKey = `dashboard_stats_${priority}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📈 Using cached data for instant display');
      return cached;
    }

    // Show loading immediately
    this.showLoadingState(priority);
    
    try {
      const data = await this.fetchWithRetry('/admin/api/dashboard-stats', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Priority': priority
        },
        timeout: this.config.requestTimeout
      });

      // Cache successful response
      this.setCachedData(cacheKey, data);
      this.hideLoadingState(priority);
      
      return data;
    } catch (error) {
      console.error('❌ Fast data loading failed:', error);
      this.handleLoadingError(priority, error);
      return this.getFallbackData();
    }
  }

  /**
   * Fetch with automatic retry and timeout
   */
  async fetchWithRetry(url, options = {}, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < this.config.retryAttempts) {
        console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms...`);
        await this.delay(this.config.retryDelay);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Professional Cache Management
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Smart Loading States - No Mock Data!
   */
  showLoadingState(priority) {
    const loadingHtml = `
      <div class="loading-container" data-priority="${priority}">
        <div class="loading-spinner-pro"></div>
        <span class="loading-text-pro">Updating...</span>
      </div>
    `;

    // Update specific KPI cards based on priority
    if (priority === 'high') {
      this.updateCriticalCards(loadingHtml);
    } else {
      this.updateNonCriticalCards(loadingHtml);
    }
  }

  hideLoadingState(priority) {
    document.querySelectorAll(`[data-priority="${priority}"]`).forEach(el => {
      el.remove();
    });
  }

  /**
   * Update Critical KPI Cards (Revenue, Users, Orders)
   */
  updateCriticalCards(loadingHtml) {
    const criticalSelectors = [
      '#totalRevenueValue',
      '#totalUsersValue', 
      '#totalOrdersValue'
    ];

    criticalSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = loadingHtml;
      }
    });
  }

  /**
   * Handle Loading Errors Professionally
   */
  handleLoadingError(priority, error) {
    const errorHtml = `
      <div class="error-container" data-priority="${priority}">
        <i class="fas fa-exclamation-triangle text-warning"></i>
        <span class="error-text">Update failed</span>
        <button class="retry-btn-pro" onclick="dashboardOptimizer.retryLoading('${priority}')">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    `;

    if (priority === 'high') {
      this.updateCriticalCards(errorHtml);
    }

    // Auto-retry after delay
    setTimeout(() => {
      this.retryLoading(priority);
    }, this.config.retryDelay);
  }

  /**
   * Fallback Data - Show Last Known Values (NOT Mock Data)
   */
  getFallbackData() {
    const lastKnown = localStorage.getItem('dashboard_last_known');
    if (lastKnown) {
      console.log('📋 Using last known data during error');
      return JSON.parse(lastKnown);
    }

    return {
      overview: {
        totalUsers: null,
        totalRevenue: null,
        totalOrders: null,
        activeUsers: null
      },
      message: 'Loading data...'
    };
  }

  /**
   * Save Last Known Good Data
   */
  saveLastKnownData(data) {
    localStorage.setItem('dashboard_last_known', JSON.stringify(data));
    localStorage.setItem('dashboard_last_update', Date.now().toString());
  }

  /**
   * Smart Update Strategy
   */
  startSmartUpdates() {
    console.log('🚀 Starting smart dashboard updates...');
    
    // Fast updates for critical data (5 seconds)
    setInterval(() => {
      this.loadDashboardDataFast('high');
    }, this.config.fastUpdateInterval);

    // Slower updates for less critical data (30 seconds)  
    setInterval(() => {
      this.loadDashboardDataFast('low');
    }, this.config.slowUpdateInterval);
  }

  /**
   * Retry Loading
   */
  async retryLoading(priority) {
    console.log(`🔄 Retrying ${priority} priority data...`);
    await this.loadDashboardDataFast(priority);
  }

  /**
   * Utility Functions
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize Performance Optimizer
   */
  init() {
    console.log('⚡ Dashboard Performance Optimizer initialized');
    
    // Load initial data immediately
    this.loadDashboardDataFast('high');
    
    // Start smart update cycles
    this.startSmartUpdates();
    
    // Cleanup old cache every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 300000);
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    console.log('🧹 Cache cleanup completed');
  }
}

// Global instance - only if not disabled
if (!window.DISABLE_DASHBOARD_PERFORMANCE) {
  window.dashboardOptimizer = new DashboardPerformanceOptimizer();
} else {
  console.log('🚫 Dashboard performance optimizer disabled');
  window.dashboardOptimizer = null;
}

// Professional CSS for loading states
const performanceStyles = `
<style>
.loading-container {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.9em;
  padding: 4px 0;
}

.loading-spinner-pro {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin-pro 0.8s linear infinite;
}

.loading-text-pro {
  color: var(--text-muted);
  font-style: italic;
}

.error-container {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
}

.retry-btn-pro {
  background: var(--primary);
  color: white;
  border: none;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn-pro:hover {
  background: var(--primary-dark);
}

@keyframes spin-pro {
  to { transform: rotate(360deg); }
}

/* Fast loading indication */
.kpi-card.loading {
  opacity: 0.7;
  transition: opacity 0.3s;
}

.kpi-card.loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  animation: loading-bar 2s infinite;
}

@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', performanceStyles); 