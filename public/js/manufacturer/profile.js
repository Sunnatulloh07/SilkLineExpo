/**
 * Manufacturer Profile Page JavaScript
 * Professional B2B Profile Management System
 */

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
    
    console.log('✅ Manufacturer Profile initialized');
  }

  // ====================================
  // 📊 DATA LOADING
  // ====================================

  async loadProfileData() {
    try {
      const response = await this.makeApiRequest('/manufacturer/profile/api/data', 'GET');
      
      if (response.success) {
        this.profileData = response.data;
        this.updateProfileStats(response.data.stats);
        this.updatePerformanceMetrics(response.data.metrics);
        
        // Update company information including logo
        if (response.data.companyInfo) {
          this.updateCompanyInfo(response.data.companyInfo);
        }
        
        // Update business information
        if (response.data.businessInfo) {
          this.updateBusinessInfo(response.data.businessInfo);
        }
        
        // Update contact information
        if (response.data.contactInfo) {
          this.updateContactInfo(response.data.contactInfo);
        }
        
        // Update production capabilities
        if (response.data.productionCapabilities) {
          this.updateProductionCapabilities(response.data.productionCapabilities);
        }
      } else {
        throw new Error(response.message || 'Ma\'lumotlarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Load profile data error:', error);
      this.showToast('Profil ma\'lumotlarini yuklashda xatolik: ' + error.message, 'error');
    }
  }

  async loadRecentData() {
    try {
      // Load recent products
      this.loadRecentProducts();
      
      // Load recent orders  
      this.loadRecentOrders();
      
    } catch (error) {
      console.error('Load recent data error:', error);
    }
  }

  async loadRecentProducts() {
    try {
      const response = await this.makeApiRequest('/manufacturer/profile/api/recent-products', 'GET');
      
      if (response.success) {
        this.renderRecentProducts(response.data);
      }
    } catch (error) {
      console.error('Load recent products error:', error);
      this.showProductsError();
    }
  }

  async loadRecentOrders() {
    try {
      const response = await this.makeApiRequest('/manufacturer/profile/api/recent-orders', 'GET');
      
      if (response.success) {
        this.renderRecentOrders(response.data);
      }
    } catch (error) {
      console.error('Load recent orders error:', error);
      this.showOrdersError();
    }
  }

  // ====================================
  // 📈 CHART INITIALIZATION
  // ====================================

  initializeCharts() {
    const chartCanvas = document.getElementById('performanceChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    
    // Sample data - will be replaced with real data
    const chartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Sotuv ($)',
          data: [12000, 19000, 15000, 25000, 22000, 30000],
          borderColor: '#FF6A00',
          backgroundColor: 'rgba(255, 106, 0, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Buyurtmalar',
          data: [45, 67, 52, 89, 76, 102],
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

  updateChart(period) {
    if (!this.performanceChart) return;

    this.currentPeriod = period;
    
    // Load new data based on period
    this.loadChartData(period).then(data => {
      this.performanceChart.data.labels = data.labels;
      this.performanceChart.data.datasets[0].data = data.sales;
      this.performanceChart.data.datasets[1].data = data.orders;
      this.performanceChart.update('active');
    });
  }

  async loadChartData(period) {
    try {
      const response = await this.makeApiRequest(`/manufacturer/profile/api/chart-data?period=${period}`, 'GET');
      
      if (response.success) {
        return response.data;
      } else {
        console.warn('Chart API failed, using empty data instead of sample data');
        return this.getEmptyChartData(period);
      }
    } catch (error) {
      console.error('Load chart data error:', error);
      console.warn('Using empty chart data instead of sample data');
      return this.getEmptyChartData(period);
    }
  }

  getEmptyChartData(period) {
    // Return empty data structure when no real data is available
    const emptyData = {
      '7': {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        sales: [0, 0, 0, 0, 0, 0, 0],
        orders: [0, 0, 0, 0, 0, 0, 0]
      },
      '30': {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        sales: [0, 0, 0, 0],
        orders: [0, 0, 0, 0]
      },
      '90': {
        labels: ['Month 1', 'Month 2', 'Month 3'],
        sales: [0, 0, 0],
        orders: [0, 0, 0]
      },
      '365': {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        sales: [0, 0, 0, 0],
        orders: [0, 0, 0, 0]
      }
    };

    return emptyData[period] || emptyData['30'];
  }

  // ====================================
  // 🎨 UI UPDATES
  // ====================================

  updateProfileStats(stats) {
    console.log('📊 Updating profile stats:', stats);
    
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
    
    // Format rating with stars if rating exists
    const rating = stats.averageRating || 0;
    if (rating > 0) {
      const ratingElement = document.getElementById('customerRating');
      if (ratingElement) {
        ratingElement.innerHTML = `
          <span class="rating-value">${rating.toFixed(1)}</span>
          <div class="rating-stars">
            ${this.generateStarRating(rating)}
          </div>
        `;
      }
    } else {
      this.updateElement('customerRating', 'Hali baho berilmagan');
    }
    
    // Update completion rate if available
    if (stats.completionRate !== undefined) {
      this.updateElement('completionRate', `${stats.completionRate.toFixed(1)}%`);
    }
  }

  updatePerformanceMetrics(metrics) {
    console.log('📊 Updating performance metrics:', metrics);
    
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
      console.log('📊 Updating business info:', businessInfo);
      
      // Update business license
      this.updateElement('businessLicense', businessInfo.businessLicense || 'Belgilanmagan');
      
      // Update tax number
      this.updateElement('taxNumber', businessInfo.taxNumber || 'Belgilanmagan');
      
      // Update employee count
      const employeeCountElement = document.getElementById('employeeCount');
      if (employeeCountElement && businessInfo.employeeCount) {
        employeeCountElement.innerHTML = `
          <i class="fas fa-users"></i>
          ${businessInfo.employeeCount}
        `;
      }
      
      // Update activity type (if element exists)
      this.updateElement('activityType', businessInfo.activityType || 'Belgilanmagan');
      
      // Update annual revenue (if element exists)
      this.updateElement('annualRevenue', businessInfo.annualRevenue || 'Belgilanmagan');
      
      console.log('✅ Business info updated successfully');
    } catch (error) {
      console.error('❌ Error updating business info:', error);
    }
  }

  updateContactInfo(contactInfo) {
    try {
      console.log('📊 Updating contact info:', contactInfo);
      
      // Update email
      const emailElement = document.getElementById('contactEmail');
      if (emailElement && contactInfo.email) {
        emailElement.href = `mailto:${contactInfo.email}`;
        emailElement.textContent = contactInfo.email;
      } else if (emailElement) {
        emailElement.textContent = 'Belgilanmagan';
        emailElement.href = '#';
      }
      
      // Update phone
      const phoneElement = document.getElementById('contactPhone');
      if (phoneElement && contactInfo.phone) {
        phoneElement.href = `tel:${contactInfo.phone}`;
        phoneElement.textContent = contactInfo.phone;
      } else if (phoneElement) {
        phoneElement.textContent = 'Belgilanmagan';
        phoneElement.href = '#';
      }
      
      // Update website
      const websiteElement = document.getElementById('contactWebsite');
      if (websiteElement && contactInfo.website) {
        websiteElement.href = contactInfo.website;
        websiteElement.textContent = contactInfo.website;
      } else if (websiteElement) {
        websiteElement.textContent = 'Belgilanmagan';
        websiteElement.href = '#';
      }
      
      // Update address
      const addressElement = document.getElementById('contactAddress');
      if (addressElement) {
        addressElement.textContent = contactInfo.fullAddress || contactInfo.address || 'Belgilanmagan';
      }
      
      console.log('✅ Contact info updated successfully');
    } catch (error) {
      console.error('❌ Error updating contact info:', error);
    }
  }

  updateProductionCapabilities(capabilities) {
    try {
      console.log('📊 Updating production capabilities:', capabilities);
      
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
            <p>Ishlab chiqarish imkoniyatlari haqida ma'lumot mavjud emas</p>
          </div>
        `;
      }
      
      console.log('✅ Production capabilities updated successfully');
    } catch (error) {
      console.error('❌ Error updating production capabilities:', error);
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
    const container = document.getElementById('recentProductsList');
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <p>Hozircha mahsulotlar yo'q</p>
          <a href="/manufacturer/products/add" class="orders-btn orders-btn-primary orders-btn-sm">
            <i class="fas fa-plus"></i>
            Mahsulot Qo'shish
          </a>
        </div>
      `;
      return;
    }

    const productsHtml = products.map(product => `
      <div class="product-item">
        <img src="${product.images?.[0] || '/assets/images/default-product.png'}" 
             alt="${product.title}" class="product-image">
        <div class="product-info">
          <h5>${product.title}</h5>
          <p>${product.category || 'Kategoriya ko\'rsatilmagan'}</p>
        </div>
        <div class="product-price">
          ${this.formatCurrency(product.price)}
        </div>
      </div>
    `).join('');

    container.innerHTML = productsHtml;
  }

  renderRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-receipt"></i>
          <p>Hozircha buyurtmalar yo'q</p>
        </div>
      `;
      return;
    }

    const ordersHtml = orders.map(order => `
      <div class="order-item">
        <div class="order-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="order-info">
          <h5>Buyurtma #${order.orderNumber}</h5>
          <p>${order.customerName || 'Mijoz'} - ${this.formatDate(order.createdAt)}</p>
        </div>
        <div class="order-amount">
          ${this.formatCurrency(order.totalAmount)}
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
          <p>Mahsulotlarni yuklashda xatolik</p>
          <button class="orders-btn orders-btn-outline orders-btn-sm" onclick="window.manufacturerProfile.loadRecentProducts()">
            <i class="fas fa-retry"></i>
            Qayta Urinish
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
          <p>Buyurtmalarni yuklashda xatolik</p>
          <button class="orders-btn orders-btn-outline orders-btn-sm" onclick="window.manufacturerProfile.loadRecentOrders()">
            <i class="fas fa-retry"></i>
            Qayta Urinish
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
      console.error('QR Code generation error:', error);
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
          this.showToast('Profil havolasi nusxalandi', 'success');
        });
      } else {
        document.execCommand('copy');
        this.showToast('Profil havolasi nusxalandi', 'success');
      }
    } catch (error) {
      console.error('Copy URL error:', error);
      this.showToast('Nusxalashda xatolik', 'error');
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
      
      this.showToast('QR kod yuklab olindi', 'success');
    } catch (error) {
      console.error('Download QR error:', error);
      this.showToast('QR kod yuklab olishda xatolik', 'error');
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
            Sertifikat Qo'shish
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="addCertificationForm">
            <div class="settings-form-grid">
              <div class="settings-form-group">
                <label class="settings-label">Sertifikat Nomi *</label>
                <input type="text" name="name" class="settings-input" required 
                       placeholder="Masalan: ISO 9001:2015">
              </div>
              
              <div class="settings-form-group">
                <label class="settings-label">Sertifikat Turi *</label>
                <select name="type" class="settings-select" required>
                  <option value="">Tanlang...</option>
                  <option value="quality">Sifat Menejmenti</option>
                  <option value="environmental">Atrof Muhit</option>
                  <option value="safety">Xavfsizlik</option>
                  <option value="industry">Sanoat Standartlari</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>
              
              <div class="settings-form-group full-width">
                <label class="settings-label">Tavsif</label>
                <textarea name="description" class="settings-textarea" rows="3"
                          placeholder="Sertifikat haqida qisqacha ma'lumot..."></textarea>
              </div>
              
              <div class="settings-form-group">
                <label class="settings-label">Berilgan Sana</label>
                <input type="date" name="issuedDate" class="settings-input">
              </div>
              
              <div class="settings-form-group">
                <label class="settings-label">Amal Qilish Muddati</label>
                <input type="date" name="expiryDate" class="settings-input">
              </div>
              
              <div class="settings-form-group full-width">
                <label class="settings-label">Sertifikat Fayli</label>
                <input type="file" name="certificate" class="settings-input" 
                       accept=".pdf,.jpg,.jpeg,.png">
                <small class="settings-help">PDF, JPG, PNG formatlarida (maksimal 5MB)</small>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button class="orders-btn orders-btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Bekor Qilish
          </button>
          <button class="orders-btn orders-btn-primary" onclick="window.manufacturerProfile.saveCertification()">
            <i class="fas fa-save"></i>
            Saqlash
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
        this.showToast('Sertifikat muvaffaqiyatli qo\'shildi', 'success');
        
        // Close modal
        const modal = form.closest('.modal-overlay');
        if (modal) {
          modal.remove();
        }
        
        // Reload profile data
        this.loadProfileData();
      } else {
        throw new Error(data.message || 'Sertifikat qo\'shishda xatolik');
      }
    } catch (error) {
      console.error('Save certification error:', error);
      this.showToast('Sertifikat qo\'shishda xatolik: ' + error.message, 'error');
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
        this.showToast(`${files.length} ta sertifikat muvaffaqiyatli yuklandi`, 'success');
        this.loadProfileData();
      } else {
        throw new Error(data.message || 'Sertifikat yuklashda xatolik');
      }
    } catch (error) {
      console.error('Upload certificate error:', error);
      this.showToast('Sertifikat yuklashda xatolik: ' + error.message, 'error');
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
    if (!dateString) return 'Sana ko\'rsatilmagan';
    
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
    alert('Profil ma\'lumotlari yuklanmagan');
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
    window.manufacturerProfile.showToast('Profil ma\'lumotlari yuklab olindi', 'success');
  }
}

// Share on social media
function shareOnSocial(platform) {
  const profileUrl = encodeURIComponent(window.location.href);
  const companyName = encodeURIComponent(document.querySelector('.company-name')?.textContent || 'Kompaniya');
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
    console.log('📊 Updating company info:', companyInfo);
    
    // Update company logo
    if (companyInfo.logo || companyInfo.url) {
      const logoElement = document.getElementById('companyLogo');
      if (logoElement) {
        const logoUrl = companyInfo.logo || companyInfo.url;
        // Add timestamp to prevent caching
        logoElement.src = logoUrl + '?t=' + Date.now();
        console.log('✅ Company logo updated:', logoUrl);
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
    
    console.log('✅ Company info updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating company info:', error);
  }
};
