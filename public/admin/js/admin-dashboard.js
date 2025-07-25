
/**
 * SLEX Admin Dashboard JavaScript
 * Senior Software Engineer Implementation
 * Modern, Clean, Performance-Optimized
 */

class SLEXDashboard {
    constructor() {
      this.mobileBreakpoint = 1024;
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.setupTheme();
      this.updateTime();
      this.animateNumbers();
      this.setupMobile();
  
      console.log("🚀 SLEX Dashboard initialized");
      
      // Initialize system metrics progress bars
      this.initSystemMetrics();
      
      // Initialize activity animations
      this.initActivityAnimations();
    }
  
    initSystemMetrics() {
      // Initialize progress bars with data attributes
      const memoryBar = document.querySelector('.memory-usage');
      const cpuBar = document.querySelector('.cpu-usage');
      
      if (memoryBar) {
        const usage = memoryBar.getAttribute('data-usage');
        memoryBar.style.width = usage;
      }
      
      if (cpuBar) {
        const usage = cpuBar.getAttribute('data-usage');
        cpuBar.style.width = usage;
      }
    }
  
    initActivityAnimations() {
      // Set animation delays from data attributes
      const activityItems = document.querySelectorAll('.enhanced-activity-item[data-delay]');
      activityItems.forEach(item => {
        const delay = item.getAttribute('data-delay');
        if (delay) {
          item.style.animationDelay = delay + 'ms';
        }
      });
    }
  
    setupEventListeners() {
      // Mobile menu toggle
      const mobileMenuBtn = document.getElementById("mobileMenuBtn");
      const mobileBackdrop = document.getElementById("mobileBackdrop");
      const sidebar = document.getElementById("adminSidebar");
  
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () =>
          this.toggleMobileMenu()
        );
      }
  
      if (mobileBackdrop) {
        mobileBackdrop.addEventListener("click", () =>
          this.closeMobileMenu()
        );
      }
  
      // Close mobile menu when clicking nav links
      const navLinks = document.querySelectorAll(".nav-link");
      navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth <= this.mobileBreakpoint) {
            this.closeMobileMenu();
          }
        });
      });
  
      // Window resize handler
      window.addEventListener("resize", () => this.handleResize());
  
      // Search functionality
      const searchInput = document.querySelector(".search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) =>
          this.handleSearch(e.target.value)
        );
      }
    }
  
    setupTheme() {
      // SLEX uses inverted theme logic: data-theme="light" = dark mode
      const savedTheme = localStorage.getItem("theme") || "light";
      document.documentElement.setAttribute("data-theme", savedTheme);
      this.updateThemeIcon(savedTheme);
  
      // Global header functions with proper scope binding
      const self = this;
  
      window.toggleTheme = function () {
        const currentTheme =
          document.documentElement.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "light" ? "dark" : "light";
  
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        self.updateThemeIcon(newTheme);
  
        // Show appropriate message based on SLEX inverted logic
        const displayMode = newTheme === "light" ? "tungi" : "kunduzgi";
        self.showToast(`${displayMode} rejimga o'tkazildi`, "success");
      };
  
      // Language Menu
      window.toggleLanguageMenu = function () {
        // Close other dropdowns first
        self.closeAllDropdowns("languageDropdown");
  
        const dropdown = document.getElementById("languageDropdown");
        if (dropdown) {
          dropdown.classList.toggle("show");
        }
      };
  
      // User Menu
      window.toggleUserMenu = function () {
        // Close other dropdowns first
        self.closeAllDropdowns("userDropdown");
  
        const dropdown = document.getElementById("userDropdown");
        const userMenu = document.querySelector(".user-menu");
        if (dropdown && userMenu) {
          dropdown.classList.toggle("show");
          userMenu.classList.toggle("active");
        }
      };
  
      // User dropdown actions
      window.viewProfile = () => {
        window.location.href = "/admin/profile";
      };
  
      window.accountSettings = () => {
        window.location.href = "/admin/settings";
      };
  
      window.securitySettings = () => {
        window.location.href = "/admin/security";
      };
  
      window.signOut = () => {
        if (confirm("Are you sure you want to sign out?")) {
          window.location.href = "/admin/logout";
        }
      };
  
      // Close dropdowns when clicking outside
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".language-selector")) {
          const langDropdown = document.getElementById("languageDropdown");
          if (langDropdown) langDropdown.classList.remove("show");
        }
  
        if (!e.target.closest(".user-menu")) {
          const userDropdown = document.getElementById("userDropdown");
          const userMenu = document.querySelector(".user-menu");
          if (userDropdown) userDropdown.classList.remove("show");
          if (userMenu) userMenu.classList.remove("active");
        }
      });
  
      // Language selection
      const languageOptions = document.querySelectorAll(".language-option");
      languageOptions.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
  
          const lang = option.getAttribute("data-lang");
          const langText = option.querySelector("span").textContent;
          const currentLangDisplay =
            document.querySelector(".current-lang");
  
          // Update active state
          languageOptions.forEach((opt) => opt.classList.remove("active"));
          option.classList.add("active");
  
          // Update display
          if (currentLangDisplay) {
            currentLangDisplay.textContent = lang.toUpperCase();
          }
  
          // Close dropdown
          const dropdown = document.getElementById("languageDropdown");
          if (dropdown) dropdown.classList.remove("show");
  
          // Store preference and show toast
          localStorage.setItem("admin-language", lang);
          this.showToast(`Language changed to ${langText}`, "success");
  
          // In a real implementation, you'd reload or update the page content
          console.log(`Language changed to: ${lang}`);
  
          // Update interface language
          this.updateLanguage(lang);
        });
      });
  
      // Notification and Message dropdowns
      window.toggleNotifications = () => {
        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown) {
          dropdown.classList.toggle("show");
          if (
            dropdown.classList.contains("show") &&
            !dropdown.hasAttribute("data-loaded")
          ) {
            this.loadNotifications();
            dropdown.setAttribute("data-loaded", "true");
          }
        }
      };
  
      window.toggleMessages = () => {
        const dropdown = document.getElementById("messagesDropdown");
        if (dropdown) {
          dropdown.classList.toggle("show");
          if (
            dropdown.classList.contains("show") &&
            !dropdown.hasAttribute("data-loaded")
          ) {
            this.loadMessages();
            dropdown.setAttribute("data-loaded", "true");
          }
        }
      };
  
      window.markAllRead = () => {
        const notificationItems = document.querySelectorAll(
          ".notification-item.unread"
        );
        notificationItems.forEach((item) => {
          item.classList.remove("unread");
        });
        this.showToast(
          "Barcha bildirishnomalar o'qilgan deb belgilandi",
          "success"
        );
      };
  
      window.composeMessage = () => {
        this.showToast("Xabar yozish oynasi ochilmoqda...", "info");
      };
  
      // Load real data from backend
      this.loadDashboardData();
      this.loadNotifications();
      this.loadMessages();
      this.loadApprovals();
    }
  
    updateLanguage(lang) {
      const elements = document.querySelectorAll("[data-translate]");
      elements.forEach((el) => {
        const key = el.getAttribute("data-translate");
        el.textContent = t(key, lang);
      });
  
      // Update current language display
      const currentLangDisplay = document.querySelector(".current-lang");
      if (currentLangDisplay) {
        currentLangDisplay.textContent = lang.toUpperCase();
      }
    }
  
    // Mock data generators
    getMockNotifications() {
      return [
        {
          id: 1,
          title: "Yangi kompaniya ro'yxatdan o'tdi",
          message:
            "TechCorp MCHJ platformaga qo'shildi va tasdiqlanishini kutmoqda",
          time: "5 daqiqa oldin",
          icon: "las la-building",
          unread: true,
        },
        {
          id: 2,
          title: "Mahsulot ro'yxati yangilandi",
          message: "Samsung Galaxy telefon seriyasi katalogga qo'shildi",
          time: "15 daqiqa oldin",
          icon: "las la-box",
          unread: true,
        },
        {
          id: 3,
          title: "Tizim yangilanishi",
          message: "SLEX v2.1.0 muvaffaqiyatli o'rnatildi",
          time: "1 soat oldin",
          icon: "las la-sync-alt",
          unread: false,
        },
        {
          id: 4,
          title: "Yangi buyurtma",
          message:
            "Uzbekistan Motors tomonidan 500 dona mahsulot buyurtma qilindi",
          time: "2 soat oldin",
          icon: "las la-shopping-cart",
          unread: false,
        },
        {
          id: 5,
          title: "Foydalanuvchi faollashtirildi",
          message: "Alisher Karimov hisobi muvaffaqiyatli tasdiqlandi",
          time: "3 soat oldin",
          icon: "las la-user-check",
          unread: false,
        },
      ];
    }
  
    getMockMessages() {
      return [
        {
          id: 1,
          sender: "Dilshod Tursunov",
          avatar: "DT",
          message:
            "Assalomu alaykum, mahsulot katalogi haqida savorim bor...",
          time: "10 daqiqa oldin",
          unread: true,
        },
        {
          id: 2,
          sender: "Nodira Sharipova",
          avatar: "NS",
          message: "Buyurtma holati haqida ma'lumot bering",
          time: "25 daqiqa oldin",
          unread: true,
        },
        {
          id: 3,
          sender: "System Admin",
          avatar: "SA",
          message: "Haftalik hisobot tayyor. Ko'rib chiqing.",
          time: "1 soat oldin",
          unread: false,
        },
      ];
    }
  
    getMockApprovals() {
      return [
        {
          id: 1,
          type: "company",
          title: "TechCorp MCHJ",
          subtitle: "Kompaniya ro'yxatdan o'tishi",
          status: "new",
          time: "5 daqiqa oldin",
          icon: "las la-building",
        },
        {
          id: 2,
          type: "user",
          title: "Alisher Karimov",
          subtitle: "Foydalanuvchi tekshiruvi",
          status: "pending",
          time: "15 daqiqa oldin",
          icon: "las la-user",
        },
        {
          id: 3,
          type: "product",
          title: "Samsung Galaxy S24",
          subtitle: "Mahsulot ro'yxati",
          status: "new",
          time: "30 daqiqa oldin",
          icon: "las la-box",
        },
        {
          id: 4,
          type: "document",
          title: "Litsenziya hujjatlari",
          subtitle: "Hujjat ko'rib chiqish",
          status: "pending",
          time: "1 soat oldin",
          icon: "las la-file-alt",
        },
        {
          id: 5,
          type: "company",
          title: "UzbekTech Solutions",
          subtitle: "Kompaniya ro'yxatdan o'tishi",
          status: "new",
          time: "2 soat oldin",
          icon: "las la-building",
        },
      ];
    }
  
    async loadNotifications() {
      try {
        const response = await fetch("/admin/api/notifications");
        if (response.ok) {
          const data = await response.json();
          this.renderNotifications(data.notifications || []);
        } else {
          // Fallback to mock data
          this.renderNotificationsFallback();
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        this.renderNotificationsFallback();
      }
    }
  
    renderNotifications(notifications) {
      const container = document.getElementById("notificationsList");
      if (!container) return;
  
      if (notifications.length === 0) {
        container.innerHTML = `
                    <div class="dropdown-empty">
                        <i class="las la-bell-slash"></i>
                        <p>Yangi bildirishnomalar yo'q</p>
                    </div>
                `;
        return;
      }
  
      container.innerHTML = notifications
        .slice(0, 5)
        .map(
          (notification) => `
                <div class="notification-item ${
                  notification.read ? "" : "unread"
                }" onclick="viewNotification('${notification.id}')">
                    <div class="notification-icon ${notification.type}">
                        <i class="${this.getNotificationIcon(
                          notification.type
                        )}"></i>
                    </div>
                    <div class="notification-details">
                        <div class="notification-title">${
                          notification.title
                        }</div>
                        <div class="notification-message">${
                          notification.message
                        }</div>
                        <div class="notification-time">${this.formatDate(
                          notification.createdAt
                        )}</div>
                    </div>
                </div>
            `
        )
        .join("");
    }
  
    getNotificationIcon(type) {
      const icons = {
        user: "las la-user-plus",
        company: "las la-building",
        product: "las la-box",
        order: "las la-shopping-cart",
        system: "las la-cog",
      };
      return icons[type] || "las la-bell";
    }
  
    renderNotificationsFallback() {
      const container = document.getElementById("notificationsList");
      const notifications = this.getMockNotifications();
  
      if (notifications.length === 0) {
        container.innerHTML = `
                    <div class="dropdown-empty">
                        <i class="las la-bell"></i>
                        <p>Yangi bildirishnomalar yo'q</p>
                    </div>
                `;
        return;
      }
  
      container.innerHTML = notifications
        .map(
          (notification) => `
                <div class="notification-item ${
                  notification.unread ? "unread" : ""
                }" onclick="viewNotification(${notification.id})">
                    <div class="notification-icon">
                        <i class="${notification.icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${
                          notification.title
                        }</div>
                        <div class="notification-message">${
                          notification.message
                        }</div>
                        <div class="notification-time">
                            <i class="las la-clock"></i>
                            ${notification.time}
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    }
  
    loadMessages() {
      const container = document.getElementById("messagesList");
      const messages = this.getMockMessages();
  
      if (messages.length === 0) {
        container.innerHTML = `
                    <div class="dropdown-empty">
                        <i class="las la-envelope"></i>
                        <p>Yangi xabarlar yo'q</p>
                    </div>
                `;
        return;
      }
  
      container.innerHTML = messages
        .map(
          (message) => `
                <div class="message-item ${
                  message.unread ? "unread" : ""
                }" onclick="viewMessage(${message.id})">
                    <div class="message-avatar">${message.avatar}</div>
                    <div class="message-content">
                        <div class="message-sender">${message.sender}</div>
                        <div class="message-preview">${
                          message.message
                        }</div>
                        <div class="message-time">
                            <i class="las la-clock"></i>
                            ${message.time}
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    }
  
    // Load real dashboard data from backend
    async loadDashboardData() {
      try {
        const [
          statsResponse,
          approvalsResponse,
          chartsResponse,
          systemResponse,
        ] = await Promise.all([
          fetch("/admin/api/dashboard-data?type=stats"),
          fetch("/admin/api/dashboard-data?type=approvals"),
          fetch("/admin/api/dashboard-data?type=charts"),
          fetch("/admin/api/dashboard-data?type=system"),
        ]);
  
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          // Update metrics cards
          this.updateMetrics(statsData.data);
        }
  
        if (approvalsResponse.ok) {
          const approvalsData = await approvalsResponse.json();
          // Update approvals data
          this.updateApprovals(approvalsData.data);
        }
  
        if (chartsResponse.ok) {
          const chartsData = await chartsResponse.json();
          // Update charts
          this.updateCharts(chartsData.data);
        }
  
        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          // Update system metrics
          this.updateSystemMetrics(systemData.data);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Fallback to existing mock data
        this.loadFallbackData();
      }
    }
  
    updateCharts(chartData) {
      console.log("Chart data received:", chartData);
  
      // Initialize growth chart if canvas exists
      const growthCanvas = document.getElementById('growthChart');
      if (growthCanvas && chartData) {
        this.renderGrowthChart(growthCanvas, chartData);
      }
    }
  
    renderGrowthChart(canvas, data) {
      const ctx = canvas.getContext('2d');
      
      // Simple chart implementation (replace with Chart.js or ApexCharts)
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Sample data for growth chart
      const userData = data.userGrowth || [65, 70, 75, 85, 92, 98, 105];
      const companyData = data.companyGrowth || [20, 25, 30, 35, 40, 45, 50];
      
      // Draw simple line chart
      this.drawLineChart(ctx, userData, '#3B82F6', width, height);
      this.drawLineChart(ctx, companyData, '#10B981', width, height, 20);
      
      // Add legend
      this.drawChartLegend(ctx, width, height);
    }
  
    drawLineChart(ctx, data, color, width, height, offsetY = 0) {
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2 - offsetY;
      
      const maxValue = Math.max(...data);
      const minValue = Math.min(...data);
      const valueRange = maxValue - minValue || 1;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + offsetY + ((maxValue - value) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw points
      ctx.fillStyle = color;
      data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + offsetY + ((maxValue - value) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  
    drawChartLegend(ctx, width, height) {
      const legendY = height - 20;
      
      // Users legend
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(width - 150, legendY - 5, 10, 2);
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.fillText('Users', width - 135, legendY);
      
      // Companies legend
      ctx.fillStyle = '#10B981';
      ctx.fillRect(width - 80, legendY - 5, 10, 2);
      ctx.fillText('Companies', width - 65, legendY);
    }
  
    updateSystemMetrics(systemData) {
      // Server metrics ni yangilayman
      if (systemData.serverStats) {
        const serverStatsContainer =
          document.querySelector(".server-metrics");
        if (serverStatsContainer) {
          serverStatsContainer.innerHTML = `
                        <div class="server-stat">
                            <span class="stat-label">CPU Usage:</span>
                            <span class="stat-value">${
                              systemData.serverStats.cpu || "15%"
                            }</span>
                        </div>
                        <div class="server-stat">
                            <span class="stat-label">Memory:</span>
                            <span class="stat-value">${
                              systemData.serverStats.memory || "62%"
                            }</span>
                        </div>
                        <div class="server-stat">
                            <span class="stat-label">Disk:</span>
                            <span class="stat-value">${
                              systemData.serverStats.disk || "45%"
                            }</span>
                        </div>
                    `;
        }
      }
  
      // Database connection status
      if (systemData.database) {
        const dbStatus = document.querySelector(".db-status");
        if (dbStatus) {
          dbStatus.className = `db-status ${
            systemData.database.connected ? "connected" : "disconnected"
          }`;
          dbStatus.textContent = systemData.database.connected
            ? "Connected"
            : "Disconnected";
        }
      }
    }
  
    loadFallbackData() {
      // Fallback mock data agar API ishlamasa
      const mockStats = {
        totalUsers: 1247,
        totalCompanies: 89,
        pendingApprovals: 17,
        monthlyRevenue: 47521,
        userGrowth: 12.5,
        companyGrowth: 8.2,
        systemStatus: "online",
      };
      this.updateMetrics(mockStats);
    }
  
    updateMetrics(stats) {
      // Update total users
      const totalUsersElement = document.getElementById("totalUsers");
      if (totalUsersElement && stats.totalUsers !== undefined) {
        this.animateNumber(totalUsersElement, stats.totalUsers);
      }
  
      // Update total companies
      const totalCompaniesElement =
        document.getElementById("totalCompanies");
      if (totalCompaniesElement && stats.totalCompanies !== undefined) {
        this.animateNumber(totalCompaniesElement, stats.totalCompanies);
      }
  
      // Update pending approvals
      const pendingApprovalsElement =
        document.getElementById("pendingApprovals");
      if (pendingApprovalsElement && stats.pendingApprovals !== undefined) {
        this.animateNumber(pendingApprovalsElement, stats.pendingApprovals);
      }
  
      // Update monthly revenue
      const monthlyRevenueElement =
        document.getElementById("monthlyRevenue");
      if (monthlyRevenueElement && stats.monthlyRevenue !== undefined) {
        monthlyRevenueElement.textContent = `$${stats.monthlyRevenue.toLocaleString()}`;
      }
  
      // Update growth percentages
      this.updateGrowthTrends(stats);
  
      // Update system status
      this.updateSystemStatus(stats);
  
      // Update banner stats
      this.updateBannerStats(stats);
    }
  
    updateGrowthTrends(stats) {
      // Update user growth trend
      const userTrendElement = document
        .querySelector("#totalUsers")
        .parentElement.parentElement.querySelector(".metric-trend span");
      if (userTrendElement && stats.userGrowth !== undefined) {
        const growth = parseFloat(stats.userGrowth);
        const trendClass = growth >= 0 ? "positive" : "negative";
        const trendIcon =
          growth >= 0 ? "las la-arrow-up" : "las la-arrow-down";
        userTrendElement.parentElement.className = `metric-trend ${trendClass}`;
        userTrendElement.innerHTML = `${
          growth >= 0 ? "+" : ""
        }${growth}% <span data-translate="fromLastMonth">o'tgan oydan</span>`;
        userTrendElement.previousElementSibling.className = trendIcon;
      }
  
      // Update company growth trend
      const companyTrendElement = document
        .querySelector("#totalCompanies")
        .parentElement.parentElement.querySelector(".metric-trend span");
      if (companyTrendElement && stats.companyGrowth !== undefined) {
        const growth = parseFloat(stats.companyGrowth);
        const trendClass = growth >= 0 ? "positive" : "negative";
        const trendIcon =
          growth >= 0 ? "las la-arrow-up" : "las la-arrow-down";
        companyTrendElement.parentElement.className = `metric-trend ${trendClass}`;
        companyTrendElement.innerHTML = `${
          growth >= 0 ? "+" : ""
        }${growth}% <span data-translate="fromLastMonth">o'tgan oydan</span>`;
        companyTrendElement.previousElementSibling.className = trendIcon;
      }
  
      // Update revenue growth trend
      const revenueTrendElement = document
        .querySelector("#monthlyRevenue")
        .parentElement.parentElement.querySelector(".metric-trend span");
      if (revenueTrendElement && stats.revenueGrowth !== undefined) {
        const growth = parseFloat(stats.revenueGrowth || 24.1);
        const trendClass = growth >= 0 ? "positive" : "negative";
        const trendIcon =
          growth >= 0 ? "las la-arrow-up" : "las la-arrow-down";
        revenueTrendElement.parentElement.className = `metric-trend ${trendClass}`;
        revenueTrendElement.innerHTML = `${
          growth >= 0 ? "+" : ""
        }${growth}% <span data-translate="fromLastMonth">o'tgan oydan</span>`;
        revenueTrendElement.previousElementSibling.className = trendIcon;
      }
    }
  
    updateSystemStatus(stats) {
      // Update system status banner
      const statusText = document.querySelector(
        '[data-translate="slexPlatformOnline"]'
      );
      const statusSubtext = document.querySelector(
        '[data-translate="allServicesRunning"]'
      );
      const statusDot = document.querySelector(".status-dot");
  
      if (statusText && statusSubtext && statusDot) {
        const isOnline = stats.systemStatus !== "offline";
        if (isOnline) {
          statusText.textContent = "SLEX platforma ishlaydi";
          statusSubtext.textContent = "Barcha xizmatlar muammosiz ishlaydi";
          statusDot.style.background = "#10b981";
        } else {
          statusText.textContent = "Tizimda nosozlik";
          statusSubtext.textContent = "Ba'zi xizmatlar ishlamayapti";
          statusDot.style.background = "#ef4444";
        }
      }
    }
  
    updateBannerStats(stats) {
      // Update banner uptime
      const uptimeElement = document.querySelector(
        ".banner-stats .banner-stat:nth-child(1) .stat-value"
      );
      if (uptimeElement) {
        uptimeElement.textContent = stats.uptime || "99.9%";
      }
  
      // Update banner response time
      const responseElement = document.querySelector(
        ".banner-stats .banner-stat:nth-child(2) .stat-value"
      );
      if (responseElement) {
        responseElement.textContent = stats.responseTime || "245ms";
      }
  
      // Update last updated time
      this.updateTime();
    }
  
    updateApprovals(approvalsData) {
      const container = document.getElementById("approvalsTableBody");
      if (!container || !approvalsData) return;
  
      // Combine companies and users approvals
      const allApprovals = [
        ...(approvalsData.companies || []).map((company) => ({
          id: company.id,
          title: company.name,
          subtitle: company.email,
          type: "company",
          time: this.formatDate(company.submittedAt),
          status: "pending",
        })),
        ...(approvalsData.users || []).map((user) => ({
          id: user.id,
          title: user.company
            ? user.company.companyName
            : "Individual User",
          subtitle: user.name,
          type: "user",
          time: this.formatDate(user.submittedAt),
          status: "pending",
        })),
      ].slice(0, 5); // Show only latest 5
  
      container.innerHTML = allApprovals
        .map(
          (approval) => `
                <tr>
                    <td class="approval-company">${approval.title}</td>
                    <td class="approval-user">${approval.subtitle}</td>
                    <td><span class="approval-status ${approval.status}">Kutilmoqda</span></td>
                    <td class="approval-date">${approval.time}</td>
                    <td>
                        <a href="javascript:void(0)" class="approval-action" onclick="viewApproval('${approval.id}', '${approval.type}')">
                            <i class="las la-eye"></i>
                            Ko'rish
                        </a>
                    </td>
                </tr>
            `
        )
        .join("");
    }
  
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  
    loadApprovals() {
      // This will be handled by loadDashboardData
      return;
    }
  
    // Keep the old function as fallback
    loadApprovalsFallback() {
      const container = document.getElementById("approvalsTableBody");
      const approvals = this.getMockApprovals();
  
      container.innerHTML = approvals
        .map(
          (approval) => `
                <tr>
                    <td class="approval-company">${approval.title}</td>
                    <td class="approval-user">${approval.subtitle}</td>
                    <td><span class="approval-status ${approval.status}">${
            approval.status === "new" ? "Yangi" : "Kutilmoqda"
          }</span></td>
                    <td class="approval-date">${approval.time}</td>
                    <td>
                        <a href="javascript:void(0)" class="approval-action" onclick="viewApproval(${
                          approval.id
                        })">
                            <i class="las la-eye"></i>
                            Ko'rish
                        </a>
                    </td>
                </tr>
            `
        )
        .join("");
    }
  
    // Close all dropdowns except the specified one
    closeAllDropdowns(except = null) {
      const dropdowns = [
        "languageDropdown",
        "userDropdown",
        "notificationDropdown",
        "messagesDropdown",
      ];
      dropdowns.forEach((dropdownId) => {
        if (dropdownId !== except) {
          const dropdown = document.getElementById(dropdownId);
          if (dropdown) {
            dropdown.classList.remove("show");
          }
        }
      });
  
      // Also remove active class from user menu
      if (except !== "userDropdown") {
        const userMenu = document.querySelector(".user-menu");
        if (userMenu) {
          userMenu.classList.remove("active");
        }
      }
    }
  
    updateThemeIcon(theme) {
      const themeIcons = document.querySelectorAll(".theme-toggle-icon");
      themeIcons.forEach((icon) => {
        // SLEX inverted logic: theme="light" shows dark interface
        if (theme === "light") {
          icon.className = "las la-sun theme-toggle-icon";
        } else {
          icon.className = "las la-moon theme-toggle-icon";
        }
      });
    }
  
    updateTime() {
      const updateTimeElement = () => {
        const timeElement = document.getElementById("lastUpdateTime");
        if (timeElement) {
          timeElement.textContent = new Date().toLocaleTimeString();
        }
      };
  
      updateTimeElement();
      setInterval(updateTimeElement, 1000);
    }
  
    animateNumbers() {
      const animateCounter = (element, target, duration = 1500) => {
        const start = 0;
        const startTime = performance.now();
  
        const updateCounter = (currentTime) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
  
          const current = Math.floor(
            start + (target - start) * this.easeOutQuart(progress)
          );
          element.textContent = current.toLocaleString();
  
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            element.textContent = target.toLocaleString();
          }
        };
  
        requestAnimationFrame(updateCounter);
      };
  
      // Real data will be loaded via updateMetrics() method from AJAX calls
      // No hardcoded values here - we'll use actual backend data
  
      // Animate fade-in elements
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
  
      document.querySelectorAll(".fade-in").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition =
          "opacity 0.6s ease-out, transform 0.6s ease-out";
        observer.observe(el);
      });
    }
  
    easeOutQuart(t) {
      return 1 - --t * t * t * t;
    }
  
    setupMobile() {
      this.handleResize();
    }
  
    handleResize() {
      const sidebar = document.getElementById("adminSidebar");
      if (window.innerWidth > this.mobileBreakpoint) {
        this.closeMobileMenu();
      }
    }
  
    toggleMobileMenu() {
      const sidebar = document.getElementById("adminSidebar");
      const backdrop = document.getElementById("mobileBackdrop");
  
      sidebar.classList.toggle("mobile-open");
      backdrop.classList.toggle("show");
      document.body.style.overflow = sidebar.classList.contains(
        "mobile-open"
      )
        ? "hidden"
        : "";
    }
  
    closeMobileMenu() {
      const sidebar = document.getElementById("adminSidebar");
      const backdrop = document.getElementById("mobileBackdrop");
  
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("show");
      document.body.style.overflow = "";
    }
  
    handleSearch(query) {
      if (query.length >= 2) {
        console.log("Searching for:", query);
        // Implement search functionality
      }
    }
  
    showToast(message, type = "info") {
      // Create toast container if it doesn't exist
      let toastContainer = document.querySelector(".toast-container");
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        toastContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                `;
        document.body.appendChild(toastContainer);
      }
  
      // Create toast
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.style.cssText = `
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                margin-bottom: var(--space-2);
                box-shadow: var(--shadow-lg);
                min-width: 300px;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid var(--${
                  type === "success"
                    ? "success"
                    : type === "error"
                    ? "danger"
                    : "primary"
                });
            `;
  
      toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <i class="las la-${
                      type === "success"
                        ? "check-circle"
                        : type === "error"
                        ? "exclamation-circle"
                        : "info-circle"
                    }" style="color: var(--${
        type === "success"
          ? "success"
          : type === "error"
          ? "danger"
          : "primary"
      });"></i>
                    <span style="flex: 1;">${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">
                        <i class="las la-times"></i>
                    </button>
                </div>
            `;
  
      toastContainer.appendChild(toast);
  
      // Auto remove
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.animation = "slideOutRight 0.3s ease";
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
    }
  }
  
  // Initialize language selection functionality
  function initLanguageSelection() {
    document.querySelectorAll(".language-option").forEach((option) => {
      option.addEventListener("click", function () {
        const lang = this.dataset.lang;
        const currentLangElement = document.querySelector(".current-lang");
        const langText = this.querySelector("span").textContent;
  
        // Update UI
        document
          .querySelectorAll(".language-option")
          .forEach((opt) => opt.classList.remove("active"));
        this.classList.add("active");
        currentLangElement.textContent = lang.toUpperCase();
  
        // Close dropdown
        document
          .getElementById("languageDropdown")
          .classList.remove("show");
  
        // Show loading toast
        if (window.dashboard) {
          window.dashboard.showToast("Til o'zgartirilmoqda...", "info");
        }
  
        // Change language
        setTimeout(() => {
          window.location.href = `?lang=${lang}`;
        }, 500);
      });
    });
  }
  
  // Initialize when DOM is ready
  initLanguageSelection();
  
  window.openHelp = function () {
    window.open("/admin/help", "_blank");
  };
  
  // Add slide animations
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
  document.head.appendChild(style);
  
  // Translation helper function
  function t(key, lang = "uz") {
    return translations[lang] && translations[lang][key]
      ? translations[lang][key]
      : key;
  }
  
  // Global click handlers and navigation functions
  window.viewNotification = (id) => {
    console.log("View notification:", id);
    // Add notification read logic here
    const notificationItem = document.querySelector(
      `.notification-item[onclick*="${id}"]`
    );
    if (notificationItem) {
      notificationItem.classList.remove("unread");
    }
    window.dashboard.showToast("Bildirishnoma ochildi", "info");
  };
  
  window.viewMessage = (id) => {
    console.log("View message:", id);
    // Add message read logic here
    const messageItem = document.querySelector(
      `.message-item[onclick*="${id}"]`
    );
    if (messageItem) {
      messageItem.classList.remove("unread");
    }
    window.dashboard.showToast("Xabar ochildi", "info");
  };
  
  window.viewApproval = (id, type = "company") => {
    console.log("View approval:", id, type);
  
    // Show loading state
    window.dashboard.showToast("Tasdiq sahifasiga o'tilmoqda...", "info");
  
    // Navigate to appropriate approval page based on type
    setTimeout(() => {
      if (type === "company") {
        window.location.href = `/admin/companies/${id}`;
      } else if (type === "user") {
        window.location.href = `/admin/users/${id}`;
      } else {
        window.location.href = `/admin/approvals/${id}`;
      }
    }, 1000);
  };
  
  // Initialize dashboard when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    window.dashboard = new SLEXDashboard();
  
    // Initialize header functions with dashboard instance
    if (window.initializeHeaderFunctions) {
      window.initializeHeaderFunctions(window.dashboard);
    }
  
    // Global functions for approval actions
    window.viewApproval = (id, type) => {
      window.location.href = `/admin/${type === 'company' ? 'companies' : 'users'}/${id}`;
    };
  
    window.quickApprove = async (id, type) => {
      if (!confirm('Bu elementni tasdiqlamoqchimisiz?')) return;
      
      try {
        const response = await fetch(`/admin/api/${type === 'company' ? 'companies' : 'users'}/${id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            reason: 'Quick approval from dashboard'
          })
        });
  
        const result = await response.json();
        
        if (result.success) {
          // Show success message
          const toast = document.createElement('div');
          toast.className = 'toast success';
          toast.innerHTML = '<i class="las la-check-circle"></i> Muvaffaqiyatli tasdiqlandi!';
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease;
          `;
          document.body.appendChild(toast);
          
          // Remove toast after 3 seconds
          setTimeout(() => {
            if (document.body.contains(toast)) {
              document.body.removeChild(toast);
            }
          }, 3000);
          
          // Reload dashboard data
          if (window.dashboard) {
            window.dashboard.loadDashboardData();
          }
        } else {
          alert('Xatolik: ' + result.message);
        }
      } catch (error) {
        console.error('Approval error:', error);
        alert('Tarmoq xatoligi yuz berdi');
      }
    };
  
    // Activity filter functions
    window.toggleActivityFilters = () => {
      const filters = document.getElementById('activityFilters');
      if (filters) {
        filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
      }
    };
  
    window.viewActivityDetails = (activityId) => {
      // Implement activity details view
      console.log('Viewing activity details:', activityId);
      // You can redirect to detailed activity page or show modal
    };
  
    window.refreshActivity = () => {
      if (window.dashboard) {
        window.dashboard.loadDashboardData();
      }
    };
  
    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-wrapper")) {
        const notificationDropdown = document.getElementById(
          "notificationDropdown"
        );
        if (notificationDropdown)
          notificationDropdown.classList.remove("show");
      }
  
      if (!e.target.closest(".messages-wrapper")) {
        const messagesDropdown =
          document.getElementById("messagesDropdown");
        if (messagesDropdown) messagesDropdown.classList.remove("show");
      }
  
      if (!e.target.closest(".language-selector")) {
        const langDropdown = document.getElementById("languageDropdown");
        if (langDropdown) langDropdown.classList.remove("show");
      }
  
      if (!e.target.closest(".user-menu")) {
        const userDropdown = document.getElementById("userDropdown");
        const userMenu = document.querySelector(".user-menu");
        if (userDropdown) userDropdown.classList.remove("show");
        if (userMenu) userMenu.classList.remove("active");
      }
    });
  });
  
  // Performance monitoring
  window.addEventListener("load", () => {
    if ("performance" in window) {
      const loadTime =
        performance.timing.loadEventEnd -
        performance.timing.navigationStart;
      console.log(`📊 Dashboard loaded in ${loadTime}ms`);
    }
  });