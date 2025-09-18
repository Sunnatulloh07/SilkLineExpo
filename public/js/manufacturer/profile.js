/**
 * Manufacturer Profile Page JavaScript
 * Professional B2B Profile Management System
 */

// Translation helper function
function getTranslation(key, fallback = '') {
  try {
    if (window.profileTranslations && window.profileTranslations[key]) {
      return window.profileTranslations[key];
    }
    return fallback || key;
  } catch (error) {
    console.error('Translation error:', error);
    return fallback || key;
  }
}

// ====================================
// 🎯 PROFILE PAGE CONTROLLER
// ====================================

class ManufacturerProfile {
  constructor() {
    this.currentPeriod = '30';
    this.performanceChart = null;
    this.profileData = {};
    
    this.init();
  }

  init() {
    this.loadProfileData();
    this.initializeCharts();
    this.initializeEventListeners();
    this.loadRecentData();
    
  }

  // ====================================
  // 📊 DATA LOADING
  // ====================================

  async loadProfileData() {
    try {
      // Show single page loading overlay
      this.showPageLoading();
      
      const response = await this.makeApiRequest('/manufacturer/profile/api/data', 'GET');
      
      if (response.success && response.data) {
        this.profileData = response.data;
        
        // Update all sections with real data from backend
        this.updateProfileStats(response.data.stats || {});
        this.updatePerformanceMetrics(response.data.metrics || {});
        
        if (response.data.companyInfo) {
          this.updateCompanyInfo(response.data.companyInfo);
        }
        
        if (response.data.businessInfo) {
          this.updateBusinessInfo(response.data.businessInfo);
        }
        
        if (response.data.contactInfo) {
          this.updateContactInfo(response.data.contactInfo);
        }
        
        if (response.data.productionCapabilities) {
          this.updateProductionCapabilities(response.data.productionCapabilities);
        }
        
        // Load additional data
        await this.loadRecentData();
        
        // Load chart data
        await this.loadChartData();
        
        // Hide page loading
        this.hidePageLoading();
        
      } else {
        throw new Error(response.message || getTranslation('manufacturer.profile.messages.error', 'Ma\'lumotlarni yuklashda xatolik'));
      }
    } catch (error) {
      console.error('❌ Load profile data error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        url: '/manufacturer/profile/api/data'
      });
      this.hidePageLoading();
      this.showToast(getTranslation('manufacturer.profile.messages.error', 'Profil ma\'lumotlarini yuklashda xatolik') + ': ' + error.message, 'error');
      
      // Show fallback data
      this.showFallbackData();
    }
  }

  async loadRecentData() {
    try {
      // Load recent products
      this.loadRecentProducts();
      
      // Load recent orders  
      this.loadRecentOrders();
      
    } catch (error) {
      // console.error('Load recent data error:', error);
    }
  }

  async loadRecentProducts() {
    try {
      const response = await this.makeApiRequest('/manufacturer/profile/api/recent-products', 'GET');
      
      if (response.success && response.data) {
        this.renderRecentProducts(response.data);
      } else {
        this.showProductsError();
      }
    } catch (error) {
      console.error('Load recent products error:', error);
      this.showProductsError();
    }
  }

  async loadRecentOrders() {
    try {
      const response = await this.makeApiRequest('/manufacturer/profile/api/recent-orders', 'GET');
      
      if (response.success && response.data) {
        this.renderRecentOrders(response.data);
      } else {
        this.showOrdersError();
      }
    } catch (error) {
      console.error('Load recent orders error:', error);
      this.showOrdersError();
    }
  }

  async loadChartData() {
    try {
      // Load 6 months (180 days) of data by default
      const response = await this.makeApiRequest('/manufacturer/profile/api/chart-data?period=180', 'GET');
      
      if (response.success && response.data) {
        this.updatePerformanceChart(response.data);
      }
    } catch (error) {
      console.error('❌ Load chart data error:', error);
      // Chart will remain with empty data
    }
  }

  // ====================================
  // 📈 CHART INITIALIZATION
  // ====================================

  initializeCharts() {
    const chartCanvas = document.getElementById('performanceChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    
    // Empty chart data - will be populated with real 6-month data
    const chartData = {
      labels: ['', '', '', '', '', ''], // 6 months
      datasets: [
        {
          label: 'Sotuv ($)',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: '#FF6A00',
          backgroundColor: 'rgba(255, 106, 0, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Buyurtmalar',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#FF6A00',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          border: {
            display: false
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          border: {
            display: false
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          border: {
            display: false
          }
        }
      },
      elements: {
        point: {
          radius: 6,
          hoverRadius: 8,
          borderWidth: 2,
          backgroundColor: '#ffffff'
        }
      }
    };

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions
    });
  }



  updatePerformanceChart(chartData) {
    if (!this.performanceChart || !chartData) return;
    
    // Update chart with real data
    this.performanceChart.data.labels = chartData.labels || [];
    this.performanceChart.data.datasets[0].data = chartData.sales || [];
    this.performanceChart.data.datasets[1].data = chartData.orders || [];
    
    this.performanceChart.update();
  }

  // ====================================
  // 🎨 UI UPDATES
  // ====================================

  getStatusText(status) {
    const statusMap = {
      'active': 'Faol',
      'draft': 'Qoralama',
      'inactive': 'Nofaol',
      'pending': 'Kutilmoqda'
    };
    return statusMap[status] || status;
  }

  getOrderStatusText(status) {
    const statusMap = {
      'pending': 'Kutilmoqda',
      'processing': 'Jarayonda',
      'confirmed': 'Tasdiqlangan',
      'shipped': 'Yuborilgan',
      'delivered': 'Yetkazib berilgan',
      'completed': 'Tugallangan',
      'cancelled': 'Bekor qilingan'
    };
    return statusMap[status] || status;
  }


  updateProfileStats(stats) {
    // Update quick stats in hero section with proper formatting
    this.updateElement('totalProducts', stats.totalProducts || 0);
    this.updateElement('totalOrders', stats.totalOrders || 0);
    
    // Update revenue with proper formatting
    const revenue = stats.totalRevenue || 0;
    if (revenue > 0) {
      this.updateElement('totalRevenue', `$${this.formatNumber(revenue)}`);
    } else {
      this.updateElement('totalRevenue', '$0');
    }
    
    // Format rating with stars if rating exists, otherwise show 0 with no stars
    const rating = stats.averageRating || 0;
    const ratingElement = document.getElementById('customerRating');
    if (ratingElement) {
      if (rating > 0) {
        ratingElement.innerHTML = `
          <span class="rating-value">${rating.toFixed(1)}</span>
          <div class="rating-stars">
            ${this.generateStarRating(rating)}
          </div>
        `;
      } else {
        ratingElement.innerHTML = `
          <span class="rating-value">0.0</span>
          <div class="rating-stars">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
          </div>
        `;
      }
    }
    
    // Update completion rate if available
    if (stats.completionRate !== undefined) {
      this.updateElement('completionRate', `${stats.completionRate.toFixed(1)}%`);
    }
  }

  updatePerformanceMetrics(metrics) {
    // Update performance metrics with proper formatting
    this.updateElement('totalSales', this.formatCurrency(metrics.totalSales || 0));
    this.updateElement('completedOrders', metrics.completedOrders || 0);
    
    // Update rating with fallback to stats rating if not in metrics
    const rating = metrics.averageRating || this.profileData?.stats?.averageRating || 0;
    this.updateElement('averageRating', rating > 0 ? rating.toFixed(1) : '0.0');
    
    this.updateElement('responseTime', this.formatTime(metrics.responseTime || 0));
    this.updateElement('totalReviews', metrics.totalReviews || 0);
    
    // Update change indicators with better formatting
    this.updateChangeIndicator('salesChange', metrics.salesChange || 0);
    this.updateChangeIndicator('ordersChange', metrics.ordersChange || 0);
    this.updateChangeIndicator('responseChange', metrics.responseChange || 0);
    
    // Update monthly metrics if available
    if (metrics.monthlyRevenue !== undefined) {
      this.updateElement('monthlyRevenue', this.formatCurrency(metrics.monthlyRevenue));
    }
    if (metrics.monthlyOrders !== undefined) {
      this.updateElement('monthlyOrders', metrics.monthlyOrders);
    }
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  updateChangeIndicator(id, change) {
    const element = document.getElementById(id);
    if (!element || typeof change !== 'number') return;

    const isPositive = change >= 0;
    const icon = element.querySelector('i');
    
    // Update icon
    if (icon) {
      icon.className = isPositive ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    }
    
    // Update percentage
    element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
    
    // Update color class
    element.className = element.className.replace(/positive|negative/g, '');
    element.classList.add(isPositive ? 'positive' : 'negative');
  }

  generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  }

  updateBusinessInfo(businessInfo) {
    try {
      
      // Update business license
      this.updateElement('businessLicense', businessInfo.businessLicense || getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan'));
      
      // Update tax number
      this.updateElement('taxNumber', businessInfo.taxNumber || getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan'));
      
      // Update employee count
      const employeeCountElement = document.getElementById('employeeCount');
      if (employeeCountElement && businessInfo.employeeCount) {
        employeeCountElement.innerHTML = `
          <i class="fas fa-users"></i>
          ${businessInfo.employeeCount}
        `;
      }
      
      // Update activity type (if element exists)
      this.updateElement('activityType', businessInfo.activityType || getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan'));
      
      // Update annual revenue (if element exists)
      this.updateElement('annualRevenue', businessInfo.annualRevenue || getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan'));
      
    } catch (error) {
      // console.error('❌ Error updating business info:', error);
    }
  }

  updateContactInfo(contactInfo) {
    try {
      
      // Update email
      const emailElement = document.getElementById('contactEmail');
      if (emailElement && contactInfo.email) {
        emailElement.href = `mailto:${contactInfo.email}`;
        emailElement.textContent = contactInfo.email;
      } else if (emailElement) {
        emailElement.textContent = getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan');
        emailElement.href = '#';
      }
      
      // Update phone
      const phoneElement = document.getElementById('contactPhone');
      if (phoneElement && contactInfo.phone) {
        phoneElement.href = `tel:${contactInfo.phone}`;
        phoneElement.textContent = contactInfo.phone;
      } else if (phoneElement) {
        phoneElement.textContent = getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan');
        phoneElement.href = '#';
      }
      
      // Update website
      const websiteElement = document.getElementById('contactWebsite');
      if (websiteElement && contactInfo.website) {
        websiteElement.href = contactInfo.website;
        websiteElement.textContent = contactInfo.website;
      } else if (websiteElement) {
        websiteElement.textContent = getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan');
        websiteElement.href = '#';
      }
      
      // Update address
      const addressElement = document.getElementById('contactAddress');
      if (addressElement) {
        addressElement.textContent = contactInfo.fullAddress || contactInfo.address || getTranslation('manufacturer.profile.messages.notSpecified', 'Belgilanmagan');
      }
      
    } catch (error) {
      // console.error('❌ Error updating contact info:', error);
    }
  }

  updateProductionCapabilities(capabilities) {
    try {
      
      const capabilitiesContainer = document.querySelector('.capabilities-grid');
      if (!capabilitiesContainer) {
        console.warn('Capabilities container not found');
        return;
      }
      
      // Clear existing capabilities
      capabilitiesContainer.innerHTML = '';
      
      // Add real capabilities
      if (capabilities && capabilities.length > 0) {
        capabilities.forEach(capability => {
          const capabilityElement = this.createCapabilityElement(capability);
          capabilitiesContainer.appendChild(capabilityElement);
        });
      } else {
        // Show no capabilities message
        capabilitiesContainer.innerHTML = `
          <div class="no-capabilities">
            <i class="fas fa-info-circle"></i>
            <p>${getTranslation('manufacturer.profile.messages.noCapabilities', 'Ishlab chiqarish imkoniyatlari haqida ma\'lumot mavjud emas')}</p>
          </div>
        `;
      }
      
    } catch (error) {
      // console.error('❌ Error updating production capabilities:', error);
    }
  }

  createCapabilityElement(capability) {
    const capabilityDiv = document.createElement('div');
    capabilityDiv.className = 'capability-item';
    
    const statusClass = capability.status === 'active' ? 'text-success' : 'text-warning';
    const statusIcon = capability.status === 'active' ? 'fa-check-circle' : 'fa-clock';
    
    capabilityDiv.innerHTML = `
      <div class="capability-icon">
        <i class="fas ${capability.icon || 'fa-cog'}"></i>
      </div>
      <div class="capability-info">
        <h5>${capability.title}</h5>
        <p>${capability.description}</p>
      </div>
      <div class="capability-status">
        <i class="fas ${statusIcon} ${statusClass}"></i>
      </div>
    `;
    
    return capabilityDiv;
  }

  renderRecentProducts(products) {
    const container = document.getElementById('recent-products');
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <p>${getTranslation('manufacturer.profile.messages.noProducts', 'Hozircha mahsulotlar yo\'q')}</p>
          <a href="/manufacturer/products/add" class="orders-btn orders-btn-primary orders-btn-sm">
            <i class="fas fa-plus"></i>
            ${getTranslation('manufacturer.profile.messages.addProduct', 'Mahsulot Qo\'shish')}
          </a>
        </div>
      `;
      return;
    }

    const productsHtml = products.map(product => `
      <div class="recent-item">
        <div class="recent-item-image">
          <img src="${product.images?.[0]?.url || '/assets/images/default-product.png'}" 
               alt="${product.title}" class="item-image">
        </div>
        <div class="recent-item-content">
          <div class="recent-item-header">
            <h4 class="item-title">${product.title}</h4>
            <span class="item-status status-${product.status}">${this.getStatusText(product.status)}</span>
          </div>
          <div class="recent-item-details">
            <div class="detail-row">
              <span class="detail-label">Narx:</span>
              <span class="detail-value">${this.formatCurrency(product.price)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Zaxira:</span>
              <span class="detail-value">${product.stock || 0} dona</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Yaratilgan:</span>
              <span class="detail-value">${this.formatDate(product.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = productsHtml;
  }

  renderRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    if (!container) return;

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-receipt"></i>
          <p>${getTranslation('manufacturer.profile.messages.noOrders', 'Hozircha buyurtmalar yo\'q')}</p>
        </div>
      `;
      return;
    }

    const ordersHtml = orders.map(order => `
      <div class="recent-item">
        <div class="recent-item-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="recent-item-content">
          <div class="recent-item-header">
            <h4 class="item-title">Buyurtma #${order.orderNumber}</h4>
            <span class="item-status status-${order.status}">${this.getOrderStatusText(order.status)}</span>
          </div>
          <div class="recent-item-details">
            <div class="detail-row">
              <span class="detail-label">Mijoz:</span>
              <span class="detail-value">${order.buyer?.name || order.buyer?.companyName || 'Noma\'lum'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Summa:</span>
              <span class="detail-value">${this.formatCurrency(order.totalAmount)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sana:</span>
              <span class="detail-value">${this.formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = ordersHtml;
  }

  showProductsError() {
    const container = document.getElementById('recentProductsList');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${getTranslation('manufacturer.profile.messages.productsError', 'Mahsulotlarni yuklashda xatolik')}</p>
          <button class="orders-btn orders-btn-outline orders-btn-sm" onclick="window.manufacturerProfile.loadRecentProducts()">
            <i class="fas fa-retry"></i>
            ${getTranslation('manufacturer.profile.messages.retry', 'Qayta Urinish')}
          </button>
        </div>
      `;
    }
  }

  showOrdersError() {
    const container = document.getElementById('recentOrdersList');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${getTranslation('manufacturer.profile.messages.ordersError', 'Buyurtmalarni yuklashda xatolik')}</p>
          <button class="orders-btn orders-btn-outline orders-btn-sm" onclick="window.manufacturerProfile.loadRecentOrders()">
            <i class="fas fa-retry"></i>
            ${getTranslation('manufacturer.profile.messages.retry', 'Qayta Urinish')}
          </button>
        </div>
      `;
    }
  }

  // ====================================
  // 🎬 EVENT LISTENERS
  // ====================================

  initializeEventListeners() {
    // Period selector for performance chart
    const periodSelector = document.querySelector('.period-selector');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => {
        this.updateChart(e.target.value);
      });
    }

    // Edit profile button
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.location.href = '/manufacturer/settings';
      });
    }

    // Share profile button
    const shareBtn = document.getElementById('shareProfileBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.showShareModal());
    }

    // Print profile button
    const printBtn = document.getElementById('printProfileBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printProfile());
    }

    // Add certification button
    const addCertBtn = document.getElementById('addCertificationBtn');
    if (addCertBtn) {
      addCertBtn.addEventListener('click', () => this.showAddCertificationModal());
    }

    // Upload certificate button
    const uploadCertBtn = document.getElementById('uploadCertificateBtn');
    if (uploadCertBtn) {
      uploadCertBtn.addEventListener('click', () => this.uploadCertificate());
    }

    // Copy URL button in share modal
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    if (copyUrlBtn) {
      copyUrlBtn.addEventListener('click', () => this.copyProfileUrl());
    }

    // Download QR code button
    const downloadQrBtn = document.getElementById('downloadQrBtn');
    if (downloadQrBtn) {
      downloadQrBtn.addEventListener('click', () => this.downloadQrCode());
    }
  }

  // ====================================
  // 📤 SHARE FUNCTIONALITY
  // ====================================

  showShareModal() {
    const modal = document.getElementById('shareProfileModal');
    if (modal) {
      modal.classList.add('show');
      this.generateQRCode();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  }

  generateQRCode() {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas || !window.QRCode) return;

    const profileUrl = document.getElementById('profileUrl').value;
    
    try {
      QRCode.toCanvas(canvas, profileUrl, {
        width: 200,
        height: 200,
        colorDark: '#1e293b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (error) {
      // console.error('QR Code generation error:', error);
    }
  }

  copyProfileUrl() {
    const urlInput = document.getElementById('profileUrl');
    if (!urlInput) return;

    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // For mobile devices

    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(urlInput.value).then(() => {
          this.showToast(getTranslation('manufacturer.profile.messages.copySuccess', 'Profil havolasi nusxalandi'), 'success');
        });
      } else {
        document.execCommand('copy');
        this.showToast(getTranslation('manufacturer.profile.messages.copySuccess', 'Profil havolasi nusxalandi'), 'success');
      }
    } catch (error) {
      // console.error('Copy URL error:', error);
      this.showToast(getTranslation('manufacturer.profile.messages.copyError', 'Nusxalashda xatolik'), 'error');
    }
  }

  downloadQrCode() {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = 'company-profile-qr.png';
      link.href = canvas.toDataURL();
      link.click();
      
      this.showToast(getTranslation('manufacturer.profile.messages.downloadSuccess', 'QR kod yuklab olindi'), 'success');
    } catch (error) {
      // console.error('Download QR error:', error);
      this.showToast(getTranslation('manufacturer.profile.messages.downloadError', 'QR kod yuklab olishda xatolik'), 'error');
    }
  }

  printProfile() {
    // Hide unnecessary elements for printing
    const hideElements = document.querySelectorAll('.orders-header-actions, .profile-card-actions, .modal-overlay');
    hideElements.forEach(el => el.style.display = 'none');

    // Print the page
    window.print();

    // Restore hidden elements
    hideElements.forEach(el => el.style.display = '');
  }

  // ====================================
  // 🏆 CERTIFICATION MANAGEMENT
  // ====================================

  showAddCertificationModal() {
    // Create and show certification modal
    const modal = this.createCertificationModal();
    document.body.appendChild(modal);
  }

  createCertificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-certificate"></i>
            ${getTranslation('manufacturer.profile.certifications.add', 'Sertifikat Qo\'shish')}
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="addCertificationForm">
            <div class="settings-form-grid">
              <div class="settings-form-group">
                <label class="settings-label">${getTranslation('manufacturer.profile.certifications.form.name', 'Sertifikat Nomi')} *</label>
                <input type="text" name="name" class="settings-input" required 
                       placeholder="${getTranslation('manufacturer.profile.certifications.form.placeholder.name', 'Masalan: ISO 9001:2015')}">
              </div>
              
              <div class="settings-form-group">
                <label class="settings-label">${getTranslation('manufacturer.profile.certifications.form.type', 'Sertifikat Turi')} *</label>
                <select name="type" class="settings-select" required>
                  <option value="">${getTranslation('manufacturer.profile.certifications.form.placeholder.select', 'Tanlang...')}</option>
                  <option value="quality">${getTranslation('manufacturer.profile.certifications.form.types.quality', 'Sifat Menejmenti')}</option>
                  <option value="environmental">${getTranslation('manufacturer.profile.certifications.form.types.environmental', 'Atrof Muhit')}</option>
                  <option value="safety">${getTranslation('manufacturer.profile.certifications.form.types.safety', 'Xavfsizlik')}</option>
                  <option value="industry">${getTranslation('manufacturer.profile.certifications.form.types.industry', 'Sanoat Standartlari')}</option>
                  <option value="other">${getTranslation('manufacturer.profile.certifications.form.types.other', 'Boshqa')}</option>
                </select>
              </div>
              
              <div class="settings-form-group full-width">
                <label class="settings-label">${getTranslation('manufacturer.profile.certifications.form.description', 'Tavsif')}</label>
                <textarea name="description" class="settings-textarea" rows="3"
                          placeholder="${getTranslation('manufacturer.profile.certifications.form.placeholder.description', 'Sertifikat haqida qisqacha ma\'lumot...')}"></textarea>
              </div>
              
              <div class="settings-form-group">
                <label class="settings-label">${getTranslation('manufacturer.profile.certifications.form.issuedDate', 'Berilgan Sana')}</label>
                <input type="date" name="issuedDate" class="settings-input">
              </div>
              
              <div class="settings-form-group">
                <label class="settings-label">${getTranslation('manufacturer.profile.certifications.form.expiryDate', 'Amal Qilish Muddati')}</label>
                <input type="date" name="expiryDate" class="settings-input">
              </div>
              
              <div class="settings-form-group full-width">
                <label class="settings-label">${getTranslation('manufacturer.profile.certifications.form.certificate', 'Sertifikat Fayli')}</label>
                <input type="file" name="certificate" class="settings-input" 
                       accept=".pdf,.jpg,.jpeg,.png">
                <small class="settings-help">${getTranslation('manufacturer.profile.certifications.form.help', 'PDF, JPG, PNG formatlarida (maksimal 5MB)')}</small>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button class="orders-btn orders-btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            ${getTranslation('manufacturer.profile.messages.cancel', 'Bekor Qilish')}
          </button>
          <button class="orders-btn orders-btn-primary" onclick="window.manufacturerProfile.saveCertification()">
            <i class="fas fa-save"></i>
            ${getTranslation('manufacturer.profile.messages.save', 'Saqlash')}
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  async saveCertification() {
    const form = document.getElementById('addCertificationForm');
    if (!form) return;

    const formData = new FormData(form);
    
    try {
      const response = await fetch('/manufacturer/profile/add-certification', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(getTranslation('manufacturer.profile.messages.certificateSuccess', 'Sertifikat muvaffaqiyatli qo\'shildi'), 'success');
        
        // Close modal
        const modal = form.closest('.modal-overlay');
        if (modal) {
          modal.remove();
        }
        
        // Reload profile data
        this.loadProfileData();
      } else {
        throw new Error(data.message || getTranslation('manufacturer.profile.messages.certificateError', 'Sertifikat qo\'shishda xatolik'));
      }
    } catch (error) {
      // console.error('Save certification error:', error);
      this.showToast(getTranslation('manufacturer.profile.messages.certificateError', 'Sertifikat qo\'shishda xatolik') + ': ' + error.message, 'error');
    }
  }

  uploadCertificate() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      this.handleCertificateUpload(files);
    };
    
    input.click();
  }

  async handleCertificateUpload(files) {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('certificates', file);
    });

    try {
      const response = await fetch('/manufacturer/profile/upload-certificates', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(`${files.length} ${getTranslation('manufacturer.profile.messages.uploadSuccess', 'ta sertifikat muvaffaqiyatli yuklandi')}`, 'success');
        this.loadProfileData();
      } else {
        throw new Error(data.message || getTranslation('manufacturer.profile.messages.uploadError', 'Sertifikat yuklashda xatolik'));
      }
    } catch (error) {
      // console.error('Upload certificate error:', error);
      this.showToast(getTranslation('manufacturer.profile.messages.uploadError', 'Sertifikat yuklashda xatolik') + ': ' + error.message, 'error');
    }
  }

  // ====================================
  // 🔧 UTILITY METHODS
  // ====================================

  formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0';
    return '$' + amount.toLocaleString();
  }

  formatTime(hours) {
    if (typeof hours !== 'number') return '0h';
    
    if (hours < 1) {
      return Math.round(hours * 60) + 'm';
    } else if (hours < 24) {
      return Math.round(hours) + 'h';
    } else {
      return Math.round(hours / 24) + 'd';
    }
  }

  formatDate(dateString) {
    if (!dateString) return getTranslation('manufacturer.profile.labels.notSpecified', 'Sana ko\'rsatilmagan');
    
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }

  async makeApiRequest(url, method, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.getCSRFToken()
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
  }



  showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    } else if (window.showToastMessage) {
      window.showToastMessage(message, type);
    } else {
      alert(message);
    }
  }

  // ====================================
  // 🔄 PAGE LOADING STATES
  // ====================================

  showPageLoading() {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');
    }
  }

  hidePageLoading() {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  }

  showFallbackData() {
    // Show fallback data when real data fails to load
    this.updateElement('companyName', getTranslation('manufacturer.profile.messages.notAvailable', 'Mavjud emas'));
    this.updateElement('totalProducts', '0');
    this.updateElement('totalOrders', '0');
    this.updateElement('totalRevenue', '$0');
    this.updateElement('averageRating', '0.0');
    
    // Show fallback message
    const fallbackMessage = document.createElement('div');
    fallbackMessage.className = 'fallback-message alert alert-warning';
    fallbackMessage.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      ${getTranslation('manufacturer.profile.messages.error', 'Ma\'lumotlarni yuklashda xatolik yuz berdi. Sahifani yangilab ko\'ring.')}
    `;
    
    const mainContent = document.querySelector('.admin-content');
    if (mainContent) {
      mainContent.insertBefore(fallbackMessage, mainContent.firstChild);
    }
  }

  // ====================================
  // 🔄 SECTION LOADING STATES
  // ====================================

}

// ====================================
// 🚀 INITIALIZE PROFILE PAGE
// ====================================

document.addEventListener('DOMContentLoaded', function() {
  window.manufacturerProfile = new ManufacturerProfile();
});

// ====================================
// 🌐 GLOBAL FUNCTIONS
// ====================================

// Close modal function (called from HTML)
function closeModal(modalId) {
  if (window.manufacturerProfile) {
    window.manufacturerProfile.closeModal(modalId);
  }
}

// Export profile data
function exportProfile() {
  if (!window.manufacturerProfile || !window.manufacturerProfile.profileData) {
    alert(getTranslation('manufacturer.profile.messages.noData', 'Profil ma\'lumotlari yuklanmagan'));
    return;
  }

  const data = {
    ...window.manufacturerProfile.profileData,
    exportDate: new Date().toISOString(),
    exportType: 'manufacturer_profile'
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `manufacturer-profile-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  if (window.manufacturerProfile) {
    window.manufacturerProfile.showToast(getTranslation('manufacturer.profile.messages.downloadSuccess', 'Profil ma\'lumotlari yuklab olindi'), 'success');
  }
}

// Share on social media
function shareOnSocial(platform) {
  const profileUrl = encodeURIComponent(window.location.href);
  const companyName = encodeURIComponent(document.querySelector('.company-name')?.textContent || getTranslation('manufacturer.profile.company.type', 'Kompaniya'));
  const text = encodeURIComponent(`${companyName} - Professional B2B Manufacturer`);

  let shareUrl = '';

  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${profileUrl}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${profileUrl}&text=${text}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${profileUrl}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${profileUrl}&text=${text}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

// CSS for additional styles
const profileStyle = document.createElement('style');
profileStyle.textContent = `
  .empty-state, .error-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary, #64748b);
  }

  .empty-state i, .error-state i {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--text-muted, #94a3b8);
  }

  .empty-state p, .error-state p {
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }


`;
document.head.appendChild(profileStyle);

// ====================================
// 🏢 COMPANY INFO UPDATES
// ====================================

ManufacturerProfile.prototype.updateCompanyInfo = function(companyInfo) {
  try {
    
    // Update company logo
    if (companyInfo.logo || companyInfo.url) {
      const logoElement = document.getElementById('companyLogo');
      if (logoElement) {
        const logoUrl = companyInfo.logo || companyInfo.url;
        // Add timestamp to prevent caching
        logoElement.src = logoUrl + '?t=' + Date.now();
      }
    }
    
    // Update company name if element exists
    if (companyInfo.name) {
      this.updateElement('companyName', companyInfo.name);
    }
    
    // Update company location
    if (companyInfo.location) {
      this.updateElement('companyLocation', companyInfo.location);
    }
    
    // Update established year
    if (companyInfo.establishedYear) {
      this.updateElement('establishedYear', companyInfo.establishedYear);
      const companyEstablished = document.getElementById('companyEstablished');
      if (companyEstablished) {
        companyEstablished.style.display = 'inline-flex';
      }
    }
    
    // Update company verification status
    this.updateCompanyVerificationStatus(companyInfo.status, companyInfo.isVerified);
    
    // Update contact info
    if (companyInfo.email) {
      const heroEmail = document.getElementById('heroEmail');
      if (heroEmail) {
        heroEmail.href = `mailto:${companyInfo.email}`;
        heroEmail.textContent = companyInfo.email;
      }
    }
    
    if (companyInfo.phone) {
      const heroPhone = document.getElementById('heroPhone');
      if (heroPhone) {
        heroPhone.href = `tel:${companyInfo.phone}`;
        heroPhone.textContent = companyInfo.phone;
      }
    }
    
    if (companyInfo.website) {
      const heroWebsite = document.getElementById('heroWebsite');
      if (heroWebsite) {
        heroWebsite.href = companyInfo.website;
        heroWebsite.style.display = 'inline-flex';
      }
    }
    
    
  } catch (error) {
    // console.error('❌ Error updating company info:', error);
  }
};

// ====================================
// 🏢 COMPANY VERIFICATION STATUS
// ====================================

ManufacturerProfile.prototype.updateCompanyVerificationStatus = function(status, isVerified) {
  try {
    // Find the verification badge container
    const verificationContainer = document.querySelector('.company-verification');
    if (!verificationContainer) return;
    
    // Clear existing content
    verificationContainer.innerHTML = '';
    
    // Create appropriate badge based on status
    let badgeClass = 'verification-badge';
    let iconClass = 'fas fa-clock';
    let statusText = getTranslation('manufacturer.profile.verification.pending', 'Kutilmoqda');
    
    if (isVerified || status === 'active') {
      badgeClass += ' verified';
      iconClass = 'fas fa-check-circle';
      statusText = getTranslation('manufacturer.profile.verification.verified', 'Tasdiqlangan');
    } else if (status === 'pending') {
      badgeClass += ' pending';
      iconClass = 'fas fa-clock';
      statusText = getTranslation('manufacturer.profile.verification.pending', 'Kutilmoqda');
    } else if (status === 'inactive' || status === 'rejected') {
      badgeClass += ' rejected';
      iconClass = 'fas fa-times-circle';
      statusText = getTranslation('manufacturer.profile.verification.rejected', 'Rad etilgan');
    }
    
    // Create and insert the badge
    const badgeElement = document.createElement('span');
    badgeElement.className = badgeClass;
    badgeElement.innerHTML = `
      <i class="${iconClass}"></i>
      ${statusText}
    `;
    
    verificationContainer.appendChild(badgeElement);
    
  } catch (error) {
    console.error('❌ Error updating verification status:', error);
  }
};
