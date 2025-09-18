
window.marketplaceData = {
    user: {
        id: '<%= user._id %>',
        name: '<%= user.name || t("manufacturer.analytics.defaults.user") %>',
        companyName: '<%= user.companyName || t("manufacturer.analytics.defaults.company") %>'
    },
    currentPage: 'analytics'
};

// Translation function for analytics
function getTranslation(key, fallback) {
    if (window.t && typeof window.t === 'function') {
        const translation = window.t(key);
        return translation !== key ? translation : fallback;
    }
    return fallback;
}

// Simple CSV Export Function (Fallback)
function exportCSV(data, filename) {
    try {
        const csvContent = data.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    } catch (error) {
        console.error('❌ CSV export error:', error);
        return false;
    }
}

// Export Report Functionality
function exportReport() {
    try {
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            console.log('⚠️ XLSX library not loaded, using CSV fallback');
            exportReportAsCSV();
            return;
        }
        
        
        // Get current analytics data
        const productData = window.productAnalyticsData;
        const dashboardData = window.dashboardStatsData;
        const businessData = window.businessIntelligenceData;
        const productInfo = window.productInfo;
        
        
        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        // 1. Overview Sheet
        const overviewData = [
            [getTranslation('manufacturer.analytics.export.reportTitle', 'Analytics Report'), ''],
            [getTranslation('manufacturer.analytics.export.generatedDate', 'Generated Date'), new Date().toLocaleDateString()],
            [getTranslation('manufacturer.analytics.export.reportType', 'Report Type'), productInfo ? getTranslation('manufacturer.analytics.export.productAnalytics', 'Product Analytics') : getTranslation('manufacturer.analytics.export.businessAnalytics', 'Business Analytics')],
            ['', ''],
            [getTranslation('manufacturer.analytics.export.keyMetrics', 'Key Metrics'), ''],
            [getTranslation('manufacturer.analytics.export.totalRevenue', 'Total Revenue'), productData?.totalRevenue || dashboardData?.overview?.totalRevenue || businessData?.totalRevenue || 0],
            [getTranslation('manufacturer.analytics.export.totalOrders', 'Total Orders'), productData?.totalOrders || dashboardData?.overview?.totalOrders || businessData?.totalOrders || 0],
            [getTranslation('manufacturer.analytics.export.totalCustomers', 'Total Customers'), productData?.totalCustomers || dashboardData?.overview?.activeCustomers || 0],
            [getTranslation('manufacturer.analytics.export.totalProducts', 'Total Products'), dashboardData?.overview?.totalProducts || 0],
            [getTranslation('manufacturer.analytics.export.conversionRate', 'Conversion Rate'), productData?.conversionRate || 0],
            [getTranslation('manufacturer.analytics.export.revenueGrowth', 'Revenue Growth'), `${dashboardData?.overview?.revenueGrowth || 0}%`],
            ['', ''],
            [getTranslation('manufacturer.analytics.export.performanceMetrics', 'Performance Metrics'), ''],
            [getTranslation('manufacturer.analytics.export.stockStatus', 'Stock Status'), productData?.stockStatus || getTranslation('manufacturer.analytics.export.notAvailable', 'N/A')],
            [getTranslation('manufacturer.analytics.export.performanceScore', 'Performance Score'), productData?.performanceScore || 0],
            [getTranslation('manufacturer.analytics.export.averageRating', 'Average Rating'), productData?.avgRating || 0],
            [getTranslation('manufacturer.analytics.export.totalReviews', 'Total Reviews'), productData?.totalReviews || 0],
            ['', ''],
            [getTranslation('manufacturer.analytics.export.businessIntelligence', 'Business Intelligence'), ''],
            [getTranslation('manufacturer.analytics.export.customerSatisfaction', 'Customer Satisfaction'), `${businessData?.performance?.customer_satisfaction || 0}%`],
            [getTranslation('manufacturer.analytics.export.efficiency', 'Efficiency'), `${businessData?.performance?.efficiency || 0}%`],
            [getTranslation('manufacturer.analytics.export.quality', 'Quality'), `${businessData?.performance?.quality || 0}%`],
            [getTranslation('manufacturer.analytics.export.overallPerformance', 'Overall Performance'), `${businessData?.performance?.overall || 0}%`]
        ];
        
        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
        
        // 2. Chart Data Sheet
        const chartData = [
            [getTranslation('manufacturer.analytics.export.chartData', 'Chart Data'), ''],
            ['', ''],
            [getTranslation('manufacturer.analytics.export.revenueTrend', 'Revenue Trend'), ''],
            [getTranslation('manufacturer.analytics.export.period', 'Period'), getTranslation('manufacturer.analytics.export.revenue', 'Revenue')]
        ];
        
        // Add revenue data
        if (productData?.periodTrend) {
            productData.periodTrend.forEach(item => {
                chartData.push([item.label || item.date || 'N/A', item.revenue || 0]);
            });
        } else {
            // No revenue data available
            chartData.push([getTranslation('manufacturer.analytics.charts.noData', 'No data available'), 0]);
        }
        
        chartData.push(['', '']);
        chartData.push([getTranslation('manufacturer.analytics.export.ordersTrend', 'Orders Trend'), '']);
        chartData.push([getTranslation('manufacturer.analytics.export.period', 'Period'), getTranslation('manufacturer.analytics.export.orders', 'Orders')]);
        
        // Add orders data
        if (productData?.periodTrend) {
            productData.periodTrend.forEach(item => {
                chartData.push([item.label || item.date || 'N/A', item.orders || 0]);
            });
        } else {
            // No orders data available
            chartData.push([getTranslation('manufacturer.analytics.charts.noData', 'No data available'), 0]);
        }
        
        const chartSheet = XLSX.utils.aoa_to_sheet(chartData);
        XLSX.utils.book_append_sheet(workbook, chartSheet, 'Chart Data');
        
        // 3. Business Intelligence Sheet
        if (businessData) {
            const businessDataSheet = [
                [getTranslation('manufacturer.analytics.export.businessIntelligence', 'Business Intelligence Data'), ''],
                [getTranslation('manufacturer.analytics.export.generatedDate', 'Generated Date'), new Date().toLocaleDateString()],
                ['', ''],
                [getTranslation('manufacturer.analytics.export.performanceMetrics', 'Monthly Metrics'), ''],
                [getTranslation('manufacturer.analytics.export.period', 'Period'), 'Value', 'Performance', 'Label']
            ];
            
            if (businessData.monthlyMetrics && businessData.monthlyMetrics.length > 0) {
                businessData.monthlyMetrics.forEach(item => {
                    businessDataSheet.push([
                        item.month || item.date || 'N/A',
                        item.value || 0,
                        item.performance || 0,
                        item.label || 'N/A'
                    ]);
                });
            }
            
            businessDataSheet.push(['', '', '', '']);
            businessDataSheet.push([getTranslation('manufacturer.analytics.export.categoriesPerformance', 'Category Breakdown'), '', '', '']);
            businessDataSheet.push(['Category', getTranslation('manufacturer.analytics.export.revenue', 'Revenue'), getTranslation('manufacturer.analytics.export.orders', 'Orders'), 'Percentage']);
            
            if (businessData.categoryBreakdown && businessData.categoryBreakdown.length > 0) {
                businessData.categoryBreakdown.forEach(item => {
                    businessDataSheet.push([
                        item.name || 'N/A',
                        item.revenue || 0,
                        item.count || 0,
                        `${item.percentage || 0}%`
                    ]);
                });
            }
            
            const businessSheet = XLSX.utils.aoa_to_sheet(businessDataSheet);
            XLSX.utils.book_append_sheet(workbook, businessSheet, 'Business Intelligence');
        }
        
        // 4. Product Analytics Sheet (if available)
        if (productData && productInfo) {
            const productDataSheet = [
                ['Product Analytics Data', ''],
                ['Generated Date', new Date().toLocaleDateString()],
                ['Product Name', productInfo.name || 'N/A'],
                ['Product ID', productInfo._id || 'N/A'],
                ['', ''],
                ['Product Metrics', ''],
                ['Total Revenue', productData.totalRevenue || 0],
                ['Total Orders', productData.totalOrders || 0],
                ['Total Customers', productData.totalCustomers || 0],
                ['Conversion Rate', `${productData.conversionRate || 0}%`],
                ['Revenue Growth', `${productData.revenueGrowth || 0}%`],
                ['Order Growth', `${productData.orderGrowth || 0}%`],
                ['Retention Rate', `${productData.retentionRate || 0}%`],
                ['', ''],
                ['Stock Information', ''],
                ['Current Stock', productData.currentStock || 0],
                ['Stock Turnover', productData.stockTurnover || 0],
                ['Stock Status', productData.stockStatus || 'N/A'],
                ['', ''],
                ['Performance Metrics', ''],
                ['Performance Score', productData.performanceScore || 0],
                ['Average Order Value', productData.avgOrderValue || 0],
                ['Average Quantity', productData.avgQuantityPerOrder || 0],
                ['Average Rating', productData.avgRating || 0],
                ['Total Reviews', productData.totalReviews || 0],
                ['Product Age (Days)', productData.productAge || 0]
            ];
            
            const productSheet = XLSX.utils.aoa_to_sheet(productDataSheet);
            XLSX.utils.book_append_sheet(workbook, productSheet, 'Product Analytics');
        }
        
        // 5. Dashboard Data Sheet
        if (dashboardData) {
            const dashboardDataSheet = [
                ['Dashboard Data', ''],
                ['Generated Date', new Date().toLocaleDateString()],
                ['', ''],
                ['Overview Metrics', ''],
                ['Total Revenue', dashboardData.overview?.totalRevenue || 0],
                ['Total Orders', dashboardData.overview?.totalOrders || 0],
                ['Total Products', dashboardData.overview?.totalProducts || 0],
                ['Active Customers', dashboardData.overview?.activeCustomers || 0],
                ['Revenue Growth', `${dashboardData.overview?.revenueGrowth || 0}%`],
                ['', ''],
                ['Additional Metrics', ''],
                ['Total Sales', dashboardData.totalSales || 0],
                ['Active Orders', dashboardData.activeOrders || 0],
                ['Inquiries', dashboardData.inquiries || 0]
            ];
            
            const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardDataSheet);
            XLSX.utils.book_append_sheet(workbook, dashboardSheet, 'Dashboard Data');
        }
        
        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const reportType = productInfo ? 'Product-Analytics' : 'Business-Analytics';
        const filename = `${reportType}-Report-${timestamp}.xlsx`;
        
        // Download the file
        XLSX.writeFile(workbook, filename);
        
        // Show success message
        if (window.showToast) {
            window.showToast(getTranslation('manufacturer.analytics.export.success', 'Report exported successfully!'), 'success');
        } else {
            alert(getTranslation('manufacturer.analytics.export.success', 'Report exported successfully!'));
        }
        
    } catch (error) {
        const errorMessage = getTranslation('manufacturer.analytics.export.error', 'Failed to export report. Please try again.');
        if (window.showToast) {
            window.showToast(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
    }
}

// CSV Export Fallback Function
function exportReportAsCSV() {
    try {
        // Get current analytics data
        const productData = window.productAnalyticsData;
        const dashboardData = window.dashboardStatsData;
        const businessData = window.businessIntelligenceData;
        const productInfo = window.productInfo;
        
        
        // Create CSV data
        const csvData = [
            [getTranslation('manufacturer.analytics.export.reportTitle', 'Analytics Report'), ''],
            [getTranslation('manufacturer.analytics.export.generatedDate', 'Generated Date'), new Date().toLocaleDateString()],
            [getTranslation('manufacturer.analytics.export.reportType', 'Report Type'), productInfo ? getTranslation('manufacturer.analytics.export.productAnalytics', 'Product Analytics') : getTranslation('manufacturer.analytics.export.businessAnalytics', 'Business Analytics')],
            ['', ''],
            [getTranslation('manufacturer.analytics.export.keyMetrics', 'Key Metrics'), ''],
            [getTranslation('manufacturer.analytics.export.totalRevenue', 'Total Revenue'), productData?.totalRevenue || dashboardData?.overview?.totalRevenue || 0],
            [getTranslation('manufacturer.analytics.export.totalOrders', 'Total Orders'), productData?.totalOrders || dashboardData?.overview?.totalOrders || 0],
            [getTranslation('manufacturer.analytics.export.totalCustomers', 'Total Customers'), productData?.totalCustomers || dashboardData?.overview?.activeCustomers || 0],
            [getTranslation('manufacturer.analytics.export.conversionRate', 'Conversion Rate'), productData?.conversionRate || 0],
            ['', ''],
            [getTranslation('manufacturer.analytics.export.performanceMetrics', 'Performance Metrics'), ''],
            [getTranslation('manufacturer.analytics.export.stockStatus', 'Stock Status'), productData?.stockStatus || getTranslation('manufacturer.analytics.export.notAvailable', 'N/A')],
            [getTranslation('manufacturer.analytics.export.performanceScore', 'Performance Score'), productData?.performanceScore || 0],
            [getTranslation('manufacturer.analytics.export.averageRating', 'Average Rating'), productData?.avgRating || 0],
            [getTranslation('manufacturer.analytics.export.totalReviews', 'Total Reviews'), productData?.totalReviews || 0]
        ];
        
        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const reportType = productInfo ? 'Product-Analytics' : 'Business-Analytics';
        const filename = `${reportType}-Report-${timestamp}.csv`;
        
        // Export CSV
        const success = exportCSV(csvData, filename);
        
        if (success) {
            if (window.showToast) {
                window.showToast(getTranslation('manufacturer.analytics.export.success', 'Report exported successfully as CSV!'), 'success');
            } else {
                alert(getTranslation('manufacturer.analytics.export.success', 'Report exported successfully as CSV!'));
            }
        } else {
            throw new Error('CSV export failed');
        }
        
    } catch (error) {
        console.error('❌ CSV export error:', error);
        if (window.showToast) {
            window.showToast(getTranslation('manufacturer.analytics.export.error', 'Failed to export report. Please try again.'), 'error');
        } else {
            alert(getTranslation('manufacturer.analytics.export.error', 'Failed to export report. Please try again.'));
        }
    }
}

// Professional Analytics Data Initialization
function initializeAnalyticsData() {
    var dataContainer = document.getElementById('analytics-data-container');
    
    if (!dataContainer) {
        return;
    }
    
    // Extract data from HTML attributes
    var hasProduct = dataContainer.getAttribute('data-has-product') === 'true';
    
    // Initialize product analytics data
    if (hasProduct) {
        var analyticsScript = document.getElementById('product-analytics-json');
        var infoScript = document.getElementById('product-info-json');
        
        if (analyticsScript && infoScript) {
            window.productAnalyticsData = JSON.parse(analyticsScript.textContent);
            window.productInfo = JSON.parse(infoScript.textContent);
        } else {
            window.productAnalyticsData = null;
            window.productInfo = null;
        }
    } else {
        window.productAnalyticsData = null;
        window.productInfo = null;
    }
    
    // Initialize business data
    var dashboardScript = document.getElementById('dashboard-stats-json');
    var businessScript = document.getElementById('business-intelligence-json');
    
    if (dashboardScript) {
        window.dashboardStatsData = JSON.parse(dashboardScript.textContent);
    }
    
    if (businessScript) {
        window.businessIntelligenceData = JSON.parse(businessScript.textContent);
    }
    
    // Analytics data initialized
}

// Old ProfessionalAnalyticsManager methods completely removed - using guaranteed chart approach

// Format KPI Numbers Function
function formatKPINumbers() {
    // Find all metric values
    const metricValues = document.querySelectorAll('.metric-value');
    
    metricValues.forEach(function(element, index) {
        const originalText = element.textContent || element.innerText;
        
        // Extract number from text (remove currency symbols, etc.)
        const numberMatch = originalText.match(/[\d\.\,]+/);
        
        if (numberMatch) {
            const numStr = numberMatch[0];
            const num = parseFloat(numStr);
            
            if (!isNaN(num)) {
                let formattedNumber;
                
                // Format based on number size
                if (num >= 1000000) {
                    // Millions: 1,234,567.89 → 1.23M
                    formattedNumber = (num / 1000000).toFixed(2) + 'M';
                } else if (num >= 1000) {
                    // Thousands: 1,234.56 → 1.23K
                    formattedNumber = (num / 1000).toFixed(2) + 'K';
                } else if (num % 1 === 0) {
                    // Whole numbers: 533 → 533
                    formattedNumber = num.toString();
                } else {
                    // Decimals: 533.1406621489405 → 533.14
                    formattedNumber = num.toFixed(2);
                }
                
                // Preserve currency symbols and other prefixes/suffixes
                const prefix = originalText.substring(0, originalText.indexOf(numStr));
                const suffix = originalText.substring(originalText.indexOf(numStr) + numStr.length);
                
                const newText = prefix + formattedNumber + suffix;
                
                // Update element
                element.textContent = newText;
                
                // Add tooltip with original value if it was truncated
                if (originalText !== newText) {
                    element.title = `${getTranslation('manufacturer.analytics.tooltips.exactValue', 'Aniq qiymat')}: ${originalText}`;
                }
            }
        }
    });
    
    // Also format stat-change values
    const statChanges = document.querySelectorAll('.stat-change');
    statChanges.forEach(function(element, index) {
        const originalText = element.textContent || element.innerText;
        
        // Match percentage or number patterns like "+12.3456% o'sish" 
        const percentMatch = originalText.match(/([+\-]?)(\d+\.\d+)(%)/);
        
        if (percentMatch) {
            const sign = percentMatch[1] || '';
            const num = parseFloat(percentMatch[2]);
            const percent = percentMatch[3];
            
            if (!isNaN(num)) {
                const formattedNum = num.toFixed(1); // 12.3456 → 12.3
                const newText = originalText.replace(percentMatch[0], sign + formattedNum + percent);
                
                element.innerHTML = element.innerHTML.replace(percentMatch[0], sign + formattedNum + percent);
            }
        }
    });
}

// Format currency function
function formatCurrency(amount, currency = 'USD') {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    
    const symbol = currency === 'USD' ? '$' : currency === 'UZS' ? 'so\'m' : '';
    
    if (num >= 1000000) {
        return symbol + (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return symbol + (num / 1000).toFixed(2) + 'K';
    } else {
        return symbol + num.toFixed(2);
    }
}

// Initialize Analytics on DOM ready (EXACT DASHBOARD PATTERN)
document.addEventListener('DOMContentLoaded', function() {
    // IMPROVED: Wait for scripts to load with retry mechanism
    function initializeHeaderFunctionality() {

        if (window.ManufacturerHeader) {
            try {
                window.manufacturerHeader = new ManufacturerHeader();
            } catch (error) {
                // console.error('❌ ManufacturerHeader initialization failed:', error);
                initBasicHeaderFunctionality();
            }
        } else {
            initBasicHeaderFunctionality();
        }
    }
    
    // RETRY MECHANISM: Try multiple times in case scripts are still loading
    function attemptHeaderInitialization(retryCount = 0) {
        const maxRetries = 5;
        const retryDelay = 200; // ms
        
        
        if (window.ManufacturerHeader) {
            initializeHeaderFunctionality();
        } else if (retryCount < maxRetries) {
            setTimeout(() => attemptHeaderInitialization(retryCount + 1), retryDelay);
        } else {
            initBasicHeaderFunctionality();
        }
    }
    
    // Language Fix Function (Dashboard-init.js Compatible)
    function applyLanguageFix() {
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        
        if (languageToggle && languageMenu) {
            // Remove any existing event listeners (dashboard-init.js might have failed)
            const newLanguageToggle = languageToggle.cloneNode(true);
            languageToggle.parentNode.replaceChild(newLanguageToggle, languageToggle);
            
            // Apply EXACT dashboard-init.js style event listener
            newLanguageToggle.addEventListener('click', function(e) {
                e.stopPropagation(); // EXACT dashboard-init pattern
                
                // Use classList.toggle like dashboard-init.js
                languageMenu.classList.toggle('hidden');
            });
            
            // Language option handlers (EXACT dashboard-init.js pattern)
            const languageOptions = document.querySelectorAll('.language-option');
            languageOptions.forEach(function(option) {
                option.addEventListener('click', function() {
                    const lang = this.dataset.lang;
                    
                    // Set cookie (EXACT dashboard-init.js pattern)
                    document.cookie = `i18next=${lang};path=/;max-age=31536000`;
                    
                    // Reload page to apply language (EXACT dashboard-init.js pattern)
                    window.location.reload();
                });
            });
        } else {
            // console.error('❌ Language elements still not found after manual fix attempt');
        }
    }
    
    // Basic header functionality (Dashboard-init.js style)
    function initBasicHeaderFunctionality() {
        // Theme toggle (EXACT dashboard-init.js pattern)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('dashboard-theme', newTheme);
                
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
                
                // Dispatch event like dashboard
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
            });
        }
        
        // Initialize dropdowns with ENHANCED outside click handling
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header-dropdown') && 
                !e.target.closest('.header-user-dropdown') &&
                !e.target.closest('.language-selector-wrapper') &&
                !e.target.closest('.language-dropdown') &&
                !e.target.closest('#languageToggle') &&
                !e.target.closest('#languageMenu')) {
                
                // Close all dropdowns including language menu
                document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
                    menu.classList.add('hidden');
                });
                
                // Specifically close language menu
                const languageMenu = document.getElementById('languageMenu');
                if (languageMenu) {
                    languageMenu.classList.add('hidden');
                    languageMenu.style.display = 'none';
                }
            }
        });
        
        // Setup dropdown toggles
        const dropdownButtons = document.querySelectorAll('[id$="Btn"]');
        dropdownButtons.forEach(function(btn) {
            const dropdownId = btn.id.replace('Btn', 'Dropdown');
            const dropdown = document.getElementById(dropdownId);
            
            if (dropdown) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Close all other dropdowns
                    document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
                        if (menu !== dropdown) {
                            menu.classList.add('hidden');
                        }
                    });
                    
                    // Toggle current dropdown
                    dropdown.classList.toggle('hidden');
                });
            }
        });
        
        // Profile dropdown
        const profileToggle = document.getElementById('userProfileToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileToggle && profileDropdown) {
            profileToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
                    if (menu !== profileDropdown) {
                        menu.classList.add('hidden');
                    }
                });
                
                profileDropdown.classList.toggle('hidden');
            });
        }
    }
    
    // Check if dashboard-init.js already initialized language functionality
    setTimeout(function() {
        // Test if language menu is already functional
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        
        if (languageToggle && languageMenu) {
            // Simulate click to test if already working
            const testClick = new Event('click', { bubbles: true });
            languageToggle.dispatchEvent(testClick);
            
            setTimeout(function() {
                if (!languageMenu.classList.contains('hidden')) {
                    // Close the test dropdown
                    languageMenu.classList.add('hidden');
                } else {
                    applyLanguageFix();
                }
            }, 100);
        } else {
            applyLanguageFix();
        }
        
        // Try header initialization after dashboard-init.js check
        initializeHeaderFunctionality();
        
    }, 200); // Give dashboard-init.js time to initialize
    
    // Additional retry for ManufacturerHeader if needed
    setTimeout(function() {
        if (!window.manufacturerHeader) {
            initializeHeaderFunctionality();
        }
    }, 700);

    // Define initializeResponsiveHandlers INSIDE DOMContentLoaded (EXACT Dashboard Pattern)
    function initializeResponsiveHandlers() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        const adminMain = document.querySelector('.admin-main');
        const adminHeader = document.querySelector('.admin-header');
        
        if (!sidebarToggle || !sidebar || !adminMain) {
            return;
        }
        
        // Restore sidebar state from localStorage (EXACT Dashboard approach)
        const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        // Apply EXACT Dashboard-style classes
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            adminMain.classList.add('sidebar-collapsed');
            adminHeader?.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            adminMain.classList.remove('sidebar-collapsed');
            adminHeader?.classList.remove('sidebar-collapsed');
        }
        
        // Remove any existing event listeners by cloning
        const newSidebarToggle = sidebarToggle.cloneNode(true);
        sidebarToggle.parentNode.replaceChild(newSidebarToggle, sidebarToggle);
        
        // Add Dashboard-compatible event listener
        newSidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
            
            if (isCurrentlyCollapsed) {
                // Expand sidebar - EXACT Dashboard approach
                sidebar.classList.remove('collapsed');
                adminMain.classList.remove('sidebar-collapsed');
                adminHeader?.classList.remove('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'false');
            } else {
                // Collapse sidebar - EXACT Dashboard approach
                sidebar.classList.add('collapsed');
                adminMain.classList.add('sidebar-collapsed');
                adminHeader?.classList.add('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');
            }
        });
        
        // Handle window resize for charts
        window.addEventListener('resize', function() {
            if (window.professionalAnalytics && window.professionalAnalytics.charts) {
                window.professionalAnalytics.charts.forEach(function(chart) {
                    chart.resize();
                });
            }
        });
    }

    // Initialize responsive handlers immediately (EXACT Dashboard Pattern)
    initializeResponsiveHandlers();

    // Initialize dashboard options (EXACT Dashboard Pattern)
    const dashboardOptions = {
        userId: '<%= typeof user !== "undefined" && user._id ? user._id : "" %>',
        userName: '<%= typeof user !== "undefined" && user.name ? user.name.replace(/"/g, "&quot;") : t("manufacturer.analytics.defaults.manufacturer") %>',
        companyName: '<%= typeof user !== "undefined" && user.companyName ? user.companyName.replace(/"/g, "&quot;") : t("manufacturer.analytics.defaults.manufacturingCompany") %>',
        currentPage: 'analytics'
    };
    
    // Initialize core manufacturer dashboard functionality (EXACT Dashboard Pattern)
    if (window.ManufacturerDashboard) {
        window.manufacturerDashboard = new ManufacturerDashboard(dashboardOptions);
        
        window.manufacturerDashboard.init().then(function() {
            // Dashboard initialized
        })['catch'](function(error) {
            // console.error('❌ Manufacturer Dashboard initialization failed:', error);
        });
    }
    
    // EXACT DASHBOARD WORKING IMPLEMENTATION - DIRECT COPY
    
    // Initialize header functionality with retry mechanism
    attemptHeaderInitialization();
    
    // OVERRIDE THEME TOGGLE to use dashboard-theme (fix localStorage conflict)
    function initDashboardCompatibleTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {

            
            // Get saved theme or default to light (use dashboard-theme key)
            const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            
            // Update icon based on current theme
            function updateThemeIcon(theme) {
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
            }
            
            updateThemeIcon(savedTheme);
            
            // Remove any existing event listeners by cloning
            const newThemeToggle = themeToggle.cloneNode(true);
            themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);
            
            // Add new dashboard-compatible event listener
            newThemeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                

                
                // FIX: Get current theme from multiple sources
                let currentTheme = document.documentElement.getAttribute('data-theme') || 
                                 document.body.getAttribute('data-theme') ||
                                 localStorage.getItem('dashboard-theme') || 
                                 'light';
                

                
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                

                
                // Apply new theme to ALL elements
                document.documentElement.setAttribute('data-theme', newTheme);
                document.body.setAttribute('data-theme', newTheme);
                localStorage.setItem('dashboard-theme', newTheme);
                
                // Update icon
                updateThemeIcon(newTheme);
                
                // Force CSS re-calculation
                document.documentElement.style.setProperty('--theme-transition', 'all 0.3s ease');
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
                

            });
            

        }
    }
    
    // Initialize dashboard-compatible theme
    initDashboardCompatibleTheme();

    // EXACT COPY OF DASHBOARD initializeResponsiveHandlers()
    function initializeResponsiveHandlers() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        const adminMain = document.querySelector('.admin-main');
        const adminHeader = document.querySelector('.admin-header');
        
        if (!sidebarToggle || !sidebar || !adminMain) {

            return;
        }
        

        
        // Restore sidebar state from localStorage (EXACT Dashboard approach)
        const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        // Apply EXACT Dashboard-style classes
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            adminMain.classList.add('sidebar-collapsed');
            adminHeader?.classList.add('sidebar-collapsed');

        } else {
            sidebar.classList.remove('collapsed');
            adminMain.classList.remove('sidebar-collapsed');
            adminHeader?.classList.remove('sidebar-collapsed');

        }
        
        // Remove any existing event listeners by cloning
        const newSidebarToggle = sidebarToggle.cloneNode(true);
        sidebarToggle.parentNode.replaceChild(newSidebarToggle, sidebarToggle);
        
        // Add Dashboard-compatible event listener
        newSidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            

            
            const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
            
            if (isCurrentlyCollapsed) {
                // Expand sidebar - EXACT Dashboard approach
                sidebar.classList.remove('collapsed');
                adminMain.classList.remove('sidebar-collapsed');
                adminHeader?.classList.remove('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'false');

            } else {
                // Collapse sidebar - EXACT Dashboard approach
                sidebar.classList.add('collapsed');
                adminMain.classList.add('sidebar-collapsed');
                adminHeader?.classList.add('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');

            }
            
            // Debug final computed styles
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(adminMain);

            }, 100);
        });
        
        // Handle mobile responsiveness (Dashboard approach)
        if (window.innerWidth <= 1024) {

        }
        

    }

    // Initialize responsive handlers (enhanced) - EXACT DASHBOARD CALL
    initializeResponsiveHandlers();
    
    // Initialize analytics data
    initializeAnalyticsData();
    
    // Initialize Export Report functionality
    const exportButton = document.getElementById('exportReport');
    if (exportButton) {
        exportButton.addEventListener('click', function(e) {
            e.preventDefault();
            exportReport();
        });
    }
    
    // Initialize Charts with ApexCharts (CSP Safe)
    function initializeChartsWithRetry(retryCount = 0) {
        const maxRetries = 3;
        

        
        if (typeof ApexCharts !== 'undefined' && window.ApexCharts) {
            try {

                initializeApexCharts();
            } catch (error) {

                if (retryCount < maxRetries) {
                    setTimeout(() => initializeChartsWithRetry(retryCount + 1), 300);
                }
            }
        } else if (retryCount < maxRetries) {
            setTimeout(() => initializeChartsWithRetry(retryCount + 1), 300);
        } else {

        }
    }
    
    // Start chart initialization with retry
    initializeChartsWithRetry();
    
    // GUARANTEED APEXCHARTS WITH REAL DATA + FALLBACK  
    function initializeApexCharts() {
        
        // Check ApexCharts availability
        if (typeof ApexCharts === 'undefined') {

            return;
        }
        
        // Get real data from backend
        const productData = window.productAnalyticsData;
        const dashboardData = window.dashboardStatsData;
        const businessData = window.businessIntelligenceData;
        
        // REVENUE CHART - GUARANTEED TO SHOW (ApexCharts)
        const revenueElement = document.getElementById('revenueChart');
        
        if (revenueElement) {
            // Smart labeling based on data period
            const daysTranslation = getTranslation('manufacturer.analytics.charts.labels.days', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
            let revenueLabels = Array.isArray(daysTranslation) ? daysTranslation : daysTranslation.split(','); // 7 days default
            let revenueDataPoints = []; // Real data only
            
            // Use real data from backend (no fallbacks for professional analytics)
            if (productData && productData.periodTrend && productData.periodTrend.length > 0) {
                // Extract labels and data from backend response
                revenueLabels = productData.periodTrend.map(item => item.label || item.date || getTranslation('manufacturer.analytics.charts.notAvailable', 'N/A'));
                revenueDataPoints = productData.periodTrend.map(item => item.revenue || 0);
            } else {
                // No data available - show empty chart with proper labels
                revenueDataPoints = [];
            }
            
            try {
                const revenueOptions = {
                    chart: {
                        type: 'area',
                        height: 300,
                        zoom: { enabled: false },
                        toolbar: { show: false }
                    },
                    series: [{
                        name: getTranslation('manufacturer.analytics.charts.series.revenue', 'Revenue ($)'),
                        data: revenueDataPoints
                    }],
                    xaxis: {
                        categories: revenueLabels,
                        labels: {
                            show: true,
                            style: {
                                colors: '#666',
                                fontSize: '12px'
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.2)'
                        },
                        axisTicks: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        title: {
                            text: 'Daromad ($)',
                            style: {
                                color: '#666',
                                fontSize: '12px'
                            }
                        },
                        labels: {
                            show: true,
                            formatter: function(value) {
                                return '$' + Math.round(value);
                            },
                            style: {
                                colors: '#666',
                                fontSize: '12px'
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.2)'
                        }
                    },
                    colors: ['#4f46e5'],
                    fill: {
                        type: 'gradient',
                        gradient: {
                            shadeIntensity: 1,
                            opacityFrom: 0.7,
                            opacityTo: 0.1,
                            stops: [0, 100]
                        }
                    },
                    stroke: {
                        curve: 'smooth',
                        width: 3,
                        show: true
                    },
                    grid: {
                        show: true,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        strokeDashArray: 1,
                        position: 'back',
                        xaxis: {
                            lines: {
                                show: true
                            }
                        },
                        yaxis: {
                            lines: {
                                show: true
                            }
                        }
                    },
                    markers: {
                        show: true,
                        size: 4,
                        colors: ['#4f46e5'],
                        strokeWidth: 2,
                        strokeColors: '#ffffff'
                    },
                    tooltip: {
                        enabled: true,
                        y: {
                            formatter: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    noData: {
                        text: getTranslation('manufacturer.analytics.charts.noData', 'Data is loading...'),
                        align: 'center',
                        verticalAlign: 'middle',
                        offsetX: 0,
                        offsetY: 0,
                        style: {
                            color: '#666',
                            fontSize: '14px'
                        }
                    }
                };
                
                const revenueChart = new ApexCharts(revenueElement, revenueOptions);
                revenueChart.render();
                // Store chart instance globally for filtering
                window.revenueChartInstance = revenueChart;
            } catch (error) {

            }
        }
        
        // ORDERS CHART - GUARANTEED TO SHOW (ApexCharts)
        const ordersElement = document.getElementById('ordersChart');
        
        if (ordersElement) {
            // Smart labeling based on data period (sync with revenue chart)
            const daysTranslation = getTranslation('manufacturer.analytics.charts.labels.days', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
            let ordersLabels = Array.isArray(daysTranslation) ? daysTranslation : daysTranslation.split(','); // 7 days default
            let ordersDataPoints = []; // Real data only
            
            // Use real data from backend (no fallbacks for professional analytics)
            if (productData && productData.periodTrend && productData.periodTrend.length > 0) {
                // Extract labels and data from backend response
                ordersLabels = productData.periodTrend.map(item => item.label || item.date || getTranslation('manufacturer.analytics.charts.notAvailable', 'N/A'));
                ordersDataPoints = productData.periodTrend.map(item => item.orders || 0);
            } else {
                // No data available - show empty chart with proper labels
                ordersDataPoints = [];
            }
            
            try {
                const ordersOptions = {
                    chart: {
                        type: 'bar',
                        height: 300,
                        zoom: { enabled: false },
                        toolbar: { show: false }
                    },
                    series: [{
                        name: getTranslation('manufacturer.analytics.charts.series.orders', 'Orders'),
                        data: ordersDataPoints
                    }],
                    xaxis: {
                        categories: ordersLabels,
                        labels: {
                            show: true,
                            style: {
                                colors: '#666',
                                fontSize: '12px'
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.2)'
                        },
                        axisTicks: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        title: {
                            text: 'Buyurtmalar soni',
                            style: {
                                color: '#666',
                                fontSize: '12px'
                            }
                        },
                        labels: {
                            show: true,
                            formatter: function(value) {
                                return Math.round(value);
                            },
                            style: {
                                colors: '#666',
                                fontSize: '12px'
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.2)'
                        }
                    },
                    colors: ['#10b981'],
                    plotOptions: {
                        bar: {
                            borderRadius: 4,
                            columnWidth: '60%',
                            dataLabels: {
                                position: 'top'
                            }
                        }
                    },
                    grid: {
                        show: true,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        strokeDashArray: 1,
                        position: 'back',
                        xaxis: {
                            lines: {
                                show: true
                            }
                        },
                        yaxis: {
                            lines: {
                                show: true
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        y: {
                            formatter: function(value) {
                                return value + ' buyurtma';
                            }
                        }
                    },
                    noData: {
                        text: getTranslation('manufacturer.analytics.charts.noData', 'Data is loading...'),
                        align: 'center',
                        verticalAlign: 'middle',
                        offsetX: 0,
                        offsetY: 0,
                        style: {
                            color: '#666',
                            fontSize: '14px'
                        }
                    }
                };
                
                const ordersChart = new ApexCharts(ordersElement, ordersOptions);
                ordersChart.render();
                // Store chart instance globally for filtering
                window.ordersChartInstance = ordersChart;

            } catch (error) {
                // console.error('❌ Orders chart creation failed:', error);
            }
        }
        
        // BUSINESS CHART - GUARANTEED TO SHOW (ApexCharts)
        const businessElement = document.getElementById('businessChart');
        
        if (businessElement) {
            // Smart labeling based on data period (sync with product charts)
            const monthsTranslation = getTranslation('manufacturer.analytics.charts.labels.months', 'Jan,Feb,Mar,Apr,May,Jun');
            let businessLabels = Array.isArray(monthsTranslation) ? monthsTranslation : monthsTranslation.split(','); // Default
            let businessDataPoints = []; // Real data only
            
            // Try to get real data if available
            if (businessData && businessData.monthlyMetrics && businessData.monthlyMetrics.length > 0) {
                businessLabels = businessData.monthlyMetrics.map(item => item.label || item.month || item.date || getTranslation('manufacturer.analytics.charts.notAvailable', 'N/A'));
                businessDataPoints = businessData.monthlyMetrics.map(item => item.performance || item.value || 0);
                
               } else {
           }
            
            try {
                const businessOptions = {
                    chart: {
                        type: 'line',
                        height: 300,
                        zoom: { enabled: false },
                        toolbar: { show: false }
                    },
                    series: [{
                        name: getTranslation('manufacturer.analytics.charts.series.businessMetrics', 'Business Metrics'),
                        data: businessDataPoints
                    }],
                    xaxis: {
                        categories: businessLabels,
                        labels: {
                            show: true,
                            style: {
                                colors: '#666',
                                fontSize: '12px'
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.2)'
                        },
                        axisTicks: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        title: {
                            text: 'Ko\'rsatkichlar',
                            style: {
                                color: '#666',
                                fontSize: '12px'
                            }
                        },
                        labels: {
                            show: true,
                            formatter: function(value) {
                                return Math.round(value) + '%';
                            },
                            style: {
                                colors: '#666',
                                fontSize: '12px'
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: 'rgba(0, 0, 0, 0.2)'
                        }
                    },
                    colors: ['#8b5cf6'],
                    stroke: {
                        curve: 'smooth',
                        width: 3,
                        show: true
                    },
                    markers: {
                        show: true,
                        size: 4,
                        colors: ['#8b5cf6'],
                        strokeWidth: 2,
                        strokeColors: '#ffffff'
                    },
                    grid: {
                        show: true,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        strokeDashArray: 1,
                        position: 'back',
                        xaxis: {
                            lines: {
                                show: true
                            }
                        },
                        yaxis: {
                            lines: {
                                show: true
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        y: {
                            formatter: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    noData: {
                        text: getTranslation('manufacturer.analytics.charts.noData', 'Data is loading...'),
                        align: 'center',
                        verticalAlign: 'middle',
                        offsetX: 0,
                        offsetY: 0,
                        style: {
                            color: '#666',
                            fontSize: '14px'
                        }
                    }
                };
                
                const businessChart = new ApexCharts(businessElement, businessOptions);
                businessChart.render();
                // Store chart instance globally for filtering
                window.businessChartInstance = businessChart;
            } catch (error) {
                // console.error('❌ Business chart creation failed:', error);
            }
        }
        
        // CATEGORIES CHART - GUARANTEED TO SHOW (ApexCharts)
        const categoriesElement = document.getElementById('categoriesChart');
        
        if (categoriesElement) {
            let categoryLabels = ['Mato', 'Paxta', 'Jun', 'Boshqa'];
            let categoryDataPoints = [35, 25, 25, 15]; // Professional fallback - balanced distribution
            const categoryColors = ['#f59e0b', '#ef4444', '#10b981', '#6b7280'];
            
            // Try to get real data if available
            if (businessData && businessData.categoryBreakdown && businessData.categoryBreakdown.length > 0) {
                categoryLabels = businessData.categoryBreakdown.map(item => item.name || item.category || 'Category');
                categoryDataPoints = businessData.categoryBreakdown.map(item => item.percentage || item.count || 0);
            } else {
              // console.log('   ⚠️ No real data found - reason:');
            }
            
            try {
                const categoriesOptions = {
                    chart: {
                        type: 'donut',
                        height: 300
                    },
                    series: categoryDataPoints,
                    labels: categoryLabels,
                    colors: categoryColors.slice(0, categoryLabels.length),
                    plotOptions: {
                        pie: {
                            donut: {
                                size: '60%',
                                labels: {
                                    show: true,
                                    name: {
                                        show: true,
                                        fontSize: '14px',
                                        color: '#666'
                                    },
                                    value: {
                                        show: true,
                                        fontSize: '16px',
                                        color: '#333',
                                        formatter: function(val) {
                                            return Math.round(val) + '%';
                                        }
                                    },
                                    total: {
                                        show: true,
                                        label: 'Jami',
                                        fontSize: '14px',
                                        color: '#666'
                                    }
                                }
                            }
                        }
                    },
                    legend: {
                        show: true,
                        position: 'bottom',
                        fontSize: '12px',
                        markers: {
                            width: 8,
                            height: 8,
                            radius: 2
                        },
                        itemMargin: {
                            horizontal: 10,
                            vertical: 5
                        }
                    },
                    tooltip: {
                        enabled: true,
                        y: {
                            formatter: function(value) {
                                const total = categoryDataPoints.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return value + '% (' + percentage + '%)';
                            }
                        }
                    },
                    dataLabels: {
                        enabled: true,
                        formatter: function(val) {
                            return Math.round(val) + '%';
                        },
                        style: {
                            fontSize: '12px',
                            colors: ['#fff']
                        }
                    },
                    responsive: [{
                        breakpoint: 480,
                        options: {
                            chart: {
                                height: 250
                            },
                            legend: {
                                fontSize: '10px'
                            }
                        }
                    }],
                    noData: {
                        text: getTranslation('manufacturer.analytics.charts.noData', 'Data is loading...'),
                        align: 'center',
                        verticalAlign: 'middle',
                        offsetX: 0,
                        offsetY: 0,
                        style: {
                            color: '#666',
                            fontSize: '14px'
                        }
                    }
                };
                
                const categoriesChart = new ApexCharts(categoriesElement, categoriesOptions);
                categoriesChart.render();
            } catch (error) {
                // console.error('❌ Categories chart creation failed:', error);
            }
        }
        

    }

    // CHART FILTERING FUNCTIONALITY
    function initializeChartFilters() {
        // Revenue Chart Filter
        const revenueFilter = document.getElementById('revenueChartPeriod');
        if (revenueFilter) {
            revenueFilter.addEventListener('change', function(e) {
                const period = parseInt(e.target.value);
                updateRevenueChart(period);
            });
        }

        // Orders Chart Filter  
        const ordersFilter = document.getElementById('ordersChartPeriod');
        if (ordersFilter) {
            ordersFilter.addEventListener('change', function(e) {
                const period = parseInt(e.target.value);
                updateOrdersChart(period);
            });
        }

        // Business Chart Filter
        const businessFilter = document.getElementById('businessChartPeriod');
        if (businessFilter) {
            businessFilter.addEventListener('change', function(e) {
                const period = parseInt(e.target.value);
                updateBusinessChart(period);
            });
        }
    }

    // Update Revenue Chart with filtered data (Enhanced Smart Labeling)
    function updateRevenueChart(period) {
        const productId = new URLSearchParams(window.location.search).get('product');
        if (!productId) return;

        // Show loading state
        const revenueChart = window.revenueChartInstance;
        if (revenueChart) {
            revenueChart.updateOptions({
                series: [{ name: getTranslation('manufacturer.analytics.charts.series.revenue', 'Revenue ($)'), data: [] }],
                xaxis: { categories: [] }
            });
        }

        // Fetch new data with period
        fetch(`/manufacturer/analytics/api/product-data?productId=${productId}&period=${period}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.periodTrend) {
                    if (revenueChart) {
                        // Extract data and labels from period-based response
                        const newData = data.data.periodTrend.map(item => item.revenue || 0);
                        const newLabels = data.data.periodTrend.map(item => item.label || item.date || 'N/A');
                        
                        revenueChart.updateOptions({
                            xaxis: { categories: newLabels },
                            series: [{ name: getTranslation('manufacturer.analytics.charts.series.revenue', 'Revenue ($)'), data: newData }]
                        });
                    }
                } else {
                    console.error('❌ Failed to load revenue chart data:', data);
                }
            })
            .catch(error => {
                console.error('❌ Revenue chart update error:', error);
            });
    }

    // Update Orders Chart with filtered data (Enhanced Smart Labeling)
    function updateOrdersChart(period) {
        const productId = new URLSearchParams(window.location.search).get('product');
        if (!productId) return;

        // Show loading state
        const ordersChart = window.ordersChartInstance;
        if (ordersChart) {
            ordersChart.updateOptions({
                series: [{ name: getTranslation('manufacturer.analytics.charts.series.orders', 'Orders'), data: [] }],
                xaxis: { categories: [] }
            });
        }

        // Fetch new data with period
        fetch(`/manufacturer/analytics/api/product-data?productId=${productId}&period=${period}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.periodTrend) {
                    if (ordersChart) {
                        // Extract data and labels from period-based response
                        const newData = data.data.periodTrend.map(item => item.orders || 0);
                        const newLabels = data.data.periodTrend.map(item => item.label || item.date || 'N/A');
                        
                        ordersChart.updateOptions({
                            xaxis: { categories: newLabels },
                            series: [{ name: getTranslation('manufacturer.analytics.charts.series.orders', 'Orders'), data: newData }]
                        });
                    }
                } else {
                    console.error('❌ Failed to load orders chart data:', data);
                }
            })
            .catch(error => {
                console.error('❌ Orders chart update error:', error);
            });
    }

    // Update Business Chart with filtered data (Enhanced Smart Labeling)
    function updateBusinessChart(period) {
        // Show loading state
        const businessChart = window.businessChartInstance;
        if (businessChart) {
            businessChart.updateOptions({
                series: [{ name: getTranslation('manufacturer.analytics.charts.series.businessMetrics', 'Business Metrics'), data: [] }],
                xaxis: { categories: [] }
            });
        }

        // Fetch new data with period
        fetch(`/manufacturer/analytics/api/business-data?period=${period}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.monthlyMetrics) {
                    if (businessChart) {
                        // Extract data and labels from period-based response
                        const monthlyMetrics = data.data.monthlyMetrics;
                        const newData = monthlyMetrics.map(item => item.performance || item.value || 0);
                        const newLabels = monthlyMetrics.map(item => item.label || item.month || item.date || 'N/A');
                        
                        businessChart.updateOptions({
                            xaxis: { categories: newLabels },
                            series: [{ name: getTranslation('manufacturer.analytics.charts.series.businessMetrics', 'Business Metrics'), data: newData }]
                        });
                    }
                } else {
                    console.error('❌ Failed to load business chart data:', data);
                }
            })
            .catch(error => {
                console.error('❌ Business chart update error:', error);
            });
    }
     
     // Analytics Controls (Real Integration)
     function setupAnalyticsControls() {
         // Refresh Button
         const refreshBtn = document.getElementById('refreshAnalytics');
         if (refreshBtn) {
             refreshBtn.addEventListener('click', function() {
                 window.location.reload();
             });
         }
         
         // Export Button - handled by main exportReport function
     }
     
         // Initialize analytics controls
    setupAnalyticsControls();
    
    // Initialize chart filters functionality
    initializeChartFilters();
   
   // Format KPI numbers (533.1406621489405 → 533.14)
   formatKPINumbers();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.professionalAnalytics) {
        window.professionalAnalytics.destroy();
    }
});
