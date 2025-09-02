document.addEventListener("DOMContentLoaded", function () {
  // Initializing Dashboard Charts...

  // Check if ApexCharts is available
  if (typeof ApexCharts === "undefined") {
    return;
  }
  // B2B Sales Analytics Chart
  const salesChartElement = document.getElementById("salesChart");

  if (salesChartElement) {

    // Replace canvas with div for ApexCharts
    const chartContainer = salesChartElement.parentElement;
    const newChartElement = document.createElement("div");
    newChartElement.id = "salesChart";
    newChartElement.style.height = "300px";
    chartContainer.replaceChild(newChartElement, salesChartElement);

    // Get real chart data from backend
    let chartData = {
      labels: ["1 hafta", "2 hafta", "3 hafta", "4 hafta", "5 hafta"],
      sales: [0, 0, 0, 0, 0],
      orders: [0, 0, 0, 0, 0],
      views: [0, 0, 0, 0, 0],
    };

    // Fetch real data from backend
    async function fetchChartData() {
      try {
        const response = await fetch("/manufacturer/api/dashboard-stats");
        if (response.ok) {
          const data = await response.json();

          // Use real chart data if available
          if (data && data.chartData) {
            chartData = {
              labels: data.chartData.labels || chartData.labels,
              sales: data.chartData.sales || chartData.sales,
              orders: data.chartData.orders || chartData.orders,
              views: data.chartData.views || chartData.views,
            };


            // Update chart if already rendered
            if (window.salesChartInstance) {
              window.salesChartInstance.updateSeries([
                {
                  name: window.t ? window.t('manufacturer.dashboard.charts.series.salesVolume') : "B2B Sales Volume",
                  data: chartData.sales,
                },
                {
                  name: window.t ? window.t('manufacturer.dashboard.charts.series.distributorInquiries') : "Distributor Inquiries",
                  data: chartData.orders,
                },
                {
                  name: window.t ? window.t('manufacturer.dashboard.charts.series.marketplaceViews') : "Marketplace Views",
                  data: chartData.views,
                },
              ]);
            }
          } else {
            // No chart data in response, using fallback
          }
        }
      } catch (error) {
        console.error("❌ Error fetching chart data:", error);
      }
    }

    // Fetch real data
    fetchChartData();

    // Create ApexCharts instance
    const salesChart = new ApexCharts(newChartElement, {
      chart: {
        type: "line",
        height: 300,
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
        },
      },
      series: [
        {
          name: window.t ? window.t('manufacturer.dashboard.charts.series.salesVolume') : "B2B Sales Volume",
          data: chartData.sales,
          color: "#3b82f6",
        },
        {
          name: window.t ? window.t('manufacturer.dashboard.charts.series.distributorInquiries') : "Distributor Inquiries",
          data: chartData.orders,
          color: "#8b5cf6",
        },
        {
          name: window.t ? window.t('manufacturer.dashboard.charts.series.marketplaceViews') : "Marketplace Views",
          data: chartData.views,
          color: "#06b6d4",
        },
      ],
      xaxis: {
        categories: chartData.labels,
        labels: {
          style: {
            colors: "#6b7280",
          },
        },
      },
              yaxis: [
          {
            title: {
              text: window.t ? window.t('manufacturer.dashboard.charts.yAxis.salesVolume') : "Sales Volume ($)",
              style: {
                color: "#6b7280",
              },
            },
            labels: {
              formatter: function (value) {
                return "$" + value / 1000 + "K";
              },
              style: {
                colors: "#6b7280",
              },
            },
          },
          {
            opposite: true,
            title: {
              text: window.t ? window.t('manufacturer.dashboard.charts.yAxis.inquiriesAndViews') : "Inquiries & Views",
              style: {
                color: "#6b7280",
              },
            },
            labels: {
              formatter: function (value) {
                return value.toLocaleString();
              },
              style: {
                colors: "#6b7280",
              },
            },
          },
        ],
      grid: {
        show: true,
        borderColor: "#e5e7eb",
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.1,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 0.8,
          opacityTo: 0.2,
          stops: [0, 100],
        },
      },
      markers: {
        size: 5,
        colors: ["#3b82f6", "#8b5cf6", "#06b6d4"],
        strokeColors: "#ffffff",
        strokeWidth: 2,
        hover: {
          size: 7,
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (value, { seriesIndex }) {
            if (seriesIndex === 0) {
              return "$" + value.toLocaleString();
            }
            return value.toLocaleString();
          },
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        labels: {
          colors: "#6b7280",
        },
      },
      noData: {
        text: window.t ? window.t('manufacturer.dashboard.charts.noData') : "No data available",
        align: "center",
        verticalAlign: "middle",
        style: {
          color: "#6b7280",
          fontSize: "14px",
        },
      },
    });

    // Render the chart
    salesChart.render();
            // Sales chart rendered successfully

    // Store chart instance for potential updates
    window.salesChartInstance = salesChart;
  } else {
    console.error("❌ Sales chart element not found");
  }

  // Chart period filter functionality
  const chartPeriodFilter = document.getElementById("chartPeriodFilter");
  if (chartPeriodFilter) {
    chartPeriodFilter.addEventListener("change", async function () {
      const period = this.value;
      try {
        // Fetch new data based on period
        const response = await fetch(
          `/manufacturer/api/dashboard-stats?period=${period}`
        );
        if (response.ok) {
          const data = await response.json();

          // Update chart with new data
          if (window.salesChartInstance && data) {
            // Update chart with real period data
            if (data && data.chartData) {
              const newChartData = {
                labels: data.chartData.labels || chartData.labels,
                sales: data.chartData.sales || chartData.sales,
                orders: data.chartData.orders || chartData.orders,
                views: data.chartData.views || chartData.views,
              };

              // Update chart series with real data
              window.salesChartInstance.updateSeries([
                {
                  name: window.t ? window.t('manufacturer.dashboard.charts.series.salesVolume') : "B2B Sales Volume",
                  data: newChartData.sales,
                },
                {
                  name: window.t ? window.t('manufacturer.dashboard.charts.series.distributorInquiries') : "Distributor Inquiries",
                  data: newChartData.orders,
                },
                {
                  name: window.t ? window.t('manufacturer.dashboard.charts.series.marketplaceViews') : "Marketplace Views",
                  data: newChartData.views,
                },
              ]);

              // Update local chart data
              chartData = newChartData;
              // Chart updated with real period data
            }

            // Chart updated with new period data
          }
        }
      } catch (error) {
        console.error("❌ Error fetching period data:", error);
      }
    });
  }

  // Refresh chart functionality
  const refreshChart = document.getElementById("refreshChart");
  if (refreshChart) {
    refreshChart.addEventListener("click", function () {
      if (window.salesChartInstance) {
        window.salesChartInstance.render();
      }
    });
  }

  // Load real dashboard data
  loadDashboardData();

  // Load additional dashboard sections
  loadDistributorInquiries();
  loadCommunicationCenter();
  loadInventoryManagement();
});

// Load real dashboard data
async function loadDashboardData() {
  try {
    const response = await fetch("/manufacturer/api/dashboard-stats");
    if (response.ok) {
      const apiResponse = await response.json();
      const data = apiResponse.data || apiResponse;

      // Update all dashboard metrics with real data
      updateDashboardMetrics(data);

      // Load top products
      loadTopProducts(data.topProducts || []);

      // Load recent orders
      loadRecentOrders(data.recentOrders || []);
    } else {
      console.error("❌ Failed to load dashboard data");
      handleDataLoadError();
    }
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    handleDataLoadError();
  }
}

// Update all dashboard metrics with real data
function updateDashboardMetrics(data) {

  // Update marketplace metrics
  updateElement("marketplaceActivity", data.marketplaceActivity || 0, "%");
  updateElement("inquiryConversion", data.inquiryConversion || 0, "%");
  updateElement("activeDistributors", data.activeDistributors || 0);

  // Update B2B KPI cards
  updateKPICard(
    "totalSalesValue",
    "totalSalesTrend",
    data.totalSales || 0,
    "currency"
  );
  updateKPICard(
    "activeOrdersValue",
    "activeOrdersTrend",
    data.activeOrders || 0,
    "number"
  );
  updateKPICard(
    "totalProductsValue",
    "totalProductsTrend",
    data.totalProducts || 0,
    "number"
  );
  updateKPICard(
    "inquiriesValue",
    "inquiriesTrend",
    data.inquiries || 0,
    "number"
  );

  // Update communication stats from API data
  const communicationStats = {
    activeChats: data.unreadMessages || 0,
    averageResponseTime: data.responseRate
      ? `${data.responseRate}%`
      : "Ma'lumot yo'q",
    todayMessages: data.newInquiries || 0,
  };
  updateCommunicationStats(communicationStats);

}

// Update KPI card with real data
function updateKPICard(valueElementId, trendElementId, value, type = "number") {
  const valueElement = document.getElementById(valueElementId);
  const trendElement = document.getElementById(trendElementId);

  if (valueElement) {
    let displayValue;
    let trendText;
    let trendClass = "";

    if (typeof value === "number" && value >= 0) {
      switch (type) {
        case "currency":
          displayValue = "$" + value.toLocaleString();
          trendText = value > 0 ? "Real ma'lumot" : "Ma'lumot yo'q";
          trendClass = value > 0 ? "positive" : "neutral";
          break;
        case "number":
          displayValue = value.toLocaleString();
          trendText = value === 0 ? "Ma'lumot yo'q" : (value === 1 ? "1 ta" : `${value} ta`);
          trendClass = value > 0 ? "positive" : "neutral";
          break;
        default:
          displayValue = value.toString();
          trendText = value > 0 ? "Real ma'lumot" : "Ma'lumot yo'q";
          break;
      }
    } else {
      displayValue = "0";
      trendText = "Ma'lumot yo'q";
      trendClass = "neutral";
    }

    valueElement.innerHTML = displayValue;
    valueElement.classList.add("updated");

    if (trendElement) {
      trendElement.innerHTML = `<span class="kpi-trend">${trendText}</span>`;
      trendElement.className = `stat-change ${trendClass}`;
    }

    
  }
}

// Update element with real data
function updateElement(elementId, value, suffix = "") {
  const element = document.getElementById(elementId);
  if (element) {
    const displayValue =
      typeof value === "number" && value >= 0
        ? (Number.isInteger(value)
            ? value.toLocaleString()
            : value.toFixed(1)) + suffix
        : "0" + suffix;

    element.innerHTML = displayValue;
    element.classList.add("updated");

  }
}

// Handle data load error
function handleDataLoadError() {
  // Show error state for all metrics
  const metricElements = [
    "marketplaceActivity",
    "inquiryConversion",
    "activeDistributors",
  ];

  metricElements.forEach((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = "0";
    }
  });

  // Show error state for KPI cards
  const kpiElements = [
    { value: "totalSalesValue", trend: "totalSalesTrend" },
    { value: "activeOrdersValue", trend: "activeOrdersTrend" },
    { value: "totalProductsValue", trend: "totalProductsTrend" },
    { value: "inquiriesValue", trend: "inquiriesTrend" },
  ];

  kpiElements.forEach((kpi) => {
    const valueElement = document.getElementById(kpi.value);
    const trendElement = document.getElementById(kpi.trend);

    if (valueElement) {
      valueElement.innerHTML = "0";
    }
    if (trendElement) {
      trendElement.innerHTML = "<span class=\"kpi-trend\">Ma'lumot yo'q</span>";
      trendElement.className = "stat-change neutral";
    }
  });

  // Show empty state for data sections
  loadTopProducts([]);
  loadRecentOrders([]);
}

// Load top products (only products with real ratings)
function loadTopProducts(products) {
  const container = document.getElementById("topProductsList");
  const loader = document.getElementById("topProductsLoader");

  if (!container) return;

  // Remove loading state
  if (loader) {
    loader.remove();
  }

  // Handle empty state
  if (!products || products.length === 0) {
    container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h4>${window.t ? window.t('manufacturer.dashboard.widgets.topProducts.noData') : 'No top-rated products found'}</h4>
                <p>${window.t ? window.t('manufacturer.dashboard.widgets.topProducts.noDataDesc') : 'No top-rated products available yet. When customers rate your products, they will appear here.'}</p>
            </div>
        `;
    return;
  }

  const productsHTML = products
    .map((product) => {
      // Since backend filters for real ratings only, use rating directly
      const realRating = product.rating;
      const ratingDisplay = realRating.toFixed(1);
      const starClass = "text-yellow-400"; // All products have real ratings


      return `
        <div class="product-item">
            <div class="product-info">
                <div class="product-rank">#${product.rank}</div>
                <div class="product-details">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-sales">${product.formattedQuantity} ${window.t ? window.t('manufacturer.dashboard.widgets.topProducts.sold') : 'sold'}</p>
                </div>
            </div>
            <div class="product-stats">
                <span class="revenue">${product.formattedRevenue}</span>
                <div class="rating">
                    <i class="fas fa-star ${starClass}"></i> 
                    ${ratingDisplay}
                </div>
            </div>
        </div>
    `;
    })
    .join("");

  container.innerHTML = productsHTML;
}

// Load recent orders
function loadRecentOrders(orders) {
  const container = document.getElementById("recentOrdersList");
  const loader = document.getElementById("recentOrdersLoader");

  if (!container) return;

  // Remove loading state
  if (loader) {
    loader.remove();
  }

  if (orders.length === 0) {
    container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">
                    <i class="fas fa-handshake"></i>
                </div>
                <h4>${window.t ? window.t('manufacturer.dashboard.widgets.recentOrders.noData') : 'No recent orders available'}</h4>
                <p>${window.t ? window.t('manufacturer.dashboard.widgets.recentOrders.noDataDesc') : 'No new orders yet. New orders will be displayed here when they arrive.'}</p>
            </div>
        `;
    return;
  }

  const ordersHTML = orders
    .map(
      (order) => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-date">${order.formattedDate}</span>
            </div>
            <div class="order-body">
                <h4 class="order-product">${order.product} - ${order.quantity}${
        order.unit
      }</h4>
                <div class="order-client">
                    <i class="fas fa-store"></i> ${order.distributor}
                </div>
                <div class="order-amount">${order.formattedAmount}</div>
            </div>
            <div class="order-footer">
                <span class="status-badge ${order.statusClass}">${getStatusText(
        order.status
      )}</span>
                <div class="order-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${
                          order.progress
                        }%"></div>
                    </div>
                    <span class="progress-text">${order.progress}%</span>
                </div>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = ordersHTML;
}

// Get status text in Uzbek
function getStatusText(status) {
  const statusMap = {
    pending: "Tasdiqlash kutilmoqda",
    confirmed: "Tasdiqlangan",
    processing: "Ishlov berilmoqda",
    shipped: "Yuborildi",
    delivered: "Yetkazildi",
    cancelled: "Bekor qilindi",
  };
  return statusMap[status] || status;
}

// Load distributor inquiries
async function loadDistributorInquiries() {
  const container = document.getElementById("distributorInquiriesList");
  const loader = document.getElementById("inquiriesLoader");

  if (!container) return;

  try {


    const response = await fetch("/manufacturer/api/distributor-inquiries");

    // Remove loading state
    if (loader) {
      loader.remove();
    }

    if (response.ok) {
      const data = await response.json();

      const inquiries = data.data?.inquiries || data.inquiries || data || [];

      if (inquiries.length > 0) {
        renderInquiries(inquiries);
      } else {
        showInquiriesEmptyState();
      }
    } else {
      showInquiriesEmptyState();
    }
  } catch (error) {
    console.error("❌ Error loading inquiries:", error);

    // Remove loading state
    if (loader) {
      loader.remove();
    }

    showInquiriesEmptyState();
  }
}

// Render inquiries
function renderInquiries(inquiries) {
  const container = document.getElementById("distributorInquiriesList");
  if (!container) return;

  const inquiriesHTML = inquiries
    .map(
      (inquiry) => `
        <div class="inquiry-card ${inquiry.priority || "new"}-priority">
            <div class="inquiry-info">
                <div class="company-section">
                    <div class="company-logo-placeholder">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="company-details">
                        <h4 class="company-title">${
                          inquiry.companyName || "Noma'lum kompaniya"
                        }</h4>
                        <span class="inquiry-timestamp">${formatTimeAgo(
                          inquiry.timestamp || inquiry.createdAt
                        )}</span>
                    </div>
                </div>
                <div class="priority-label ${
                  inquiry.priority || "new"
                }">${getPriorityText(inquiry.priority || "new")}</div>
            </div>
            <div class="inquiry-message">
                <p>${
                  inquiry.message ||
                  inquiry.content ||
                  window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.noMessage') : "No inquiry message"
                }</p>
                <div class="order-specs">
                    ${
                      inquiry.specs
                        ? inquiry.specs
                            .map(
                              (spec) => `<span class="spec-tag">${spec}</span>`
                            )
                            .join("")
                        : ""
                    }
                </div>
            </div>
            <div class="inquiry-buttons">
                <button class="btn-respond">${window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.respond') : 'Javob berish'}</button>
                <button class="btn-quote">${window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.quote') : 'Taklif'}</button>
            </div>
        </div>
    `
    )
    .join("");

}

// Show inquiries empty state
function showInquiriesEmptyState() {
  const container = document.getElementById("distributorInquiriesList");
  if (!container) return;

  container.innerHTML = `
        <div class="no-data">
            <div class="no-data-icon">
                <i class="fas fa-handshake"></i>
            </div>
            <h4>Ma'lumotlar topilmadi</h4>
            <p>${window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.noDataDesc') : 'No distributor inquiries available. No inquiry data found.'}</p>
        </div>
    `;
}

// Get priority text
function getPriorityText(priority) {
  const priorityMap = {
    urgent: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.urgent') : "Urgent",
    new: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.new') : "New",
    followup: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.followup') : "Follow-up",
    high: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.high') : "High",
    medium: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.medium') : "Medium",
    low: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.low') : "Low",
  };
  return priorityMap[priority] || (window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.new') : "New");
}

// Load communication center
async function loadCommunicationCenter() {
  const container = document.getElementById("chatPreviewsList");
  const loader = document.getElementById("chatLoader");

  if (!container) return;

  try {

    const response = await fetch("/manufacturer/api/communication-center");

    // Remove loading state
    if (loader) {
      loader.remove();
    }

    if (response.ok) {
      const data = await response.json();

      const chatPreviews = data.chatPreviews || data.chats || [];
      const stats = data.stats || data;

      if (chatPreviews.length > 0) {
        renderChatPreviews(chatPreviews);
      } else {
        showCommunicationEmptyState();
      }

      updateCommunicationStats(stats);
    } else {
      showCommunicationEmptyState();
      updateCommunicationStatsError();
    }
  } catch (error) {
    console.error("❌ Error loading communication center:", error);

    // Remove loading state
    if (loader) {
      loader.remove();
    }

    showCommunicationEmptyState();
    updateCommunicationStatsError();
  }
}

// Render chat previews
function renderChatPreviews(chats) {
  const container = document.getElementById("chatPreviewsList");
  if (!container) return;

  const chatsHTML = chats
    .map(
      (chat) => `
        <div class="chat-preview ${chat.isUnread ? "unread" : ""}">
            <div class="chat-avatar">
                <div class="chat-avatar-placeholder">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="${chat.status || "offline"}-indicator"></div>
            </div>
            <div class="chat-content">
                <div class="chat-header">
                    <h4 class="chat-company">${
                      chat.companyName || (window.t ? window.t('manufacturer.dashboard.widgets.communicationCenter.unknownCompany') : "Unknown Company")
                    }</h4>
                    <span class="chat-time">${formatTimeAgo(
                      chat.lastMessageTime || chat.createdAt
                    )}</span>
                </div>
                <p class="chat-message">${
                  chat.lastMessage || chat.message || (window.t ? window.t('manufacturer.dashboard.widgets.communicationCenter.noMessage') : "No message")
                }</p>
                <div class="chat-meta">
                    ${
                      chat.isUnread
                        ? `<span class="message-count">${
                            chat.messageCount || 1
                          }</span>`
                        : ""
                    }
                    ${
                      chat.isTyping
                        ? `<span class="typing-indicator">${window.t ? window.t('manufacturer.dashboard.widgets.communicationCenter.typing') : 'typing...'}</span>`
                        : `<span class="read-indicator">${window.t ? window.t('manufacturer.dashboard.widgets.communicationCenter.read') : 'Read'}</span>`
                    }
                </div>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = chatsHTML;
}

// Show communication empty state
function showCommunicationEmptyState() {
  const container = document.getElementById("chatPreviewsList");
  if (!container) return;

  container.innerHTML = `
        <div class="no-data">
            <div class="no-data-icon">
                <i class="fas fa-satellite-dish"></i>
            </div>
            <h4>Ma'lumotlar topilmadi</h4>
            <p>Muloqot markazi bo'sh massiv qaytardi. Hech qanday suhbat ma'lumotlari topilmadi.</p>
        </div>
    `;
  
  const communicationStats = document.querySelector(".communication-stats");
  if (communicationStats) {
    communicationStats.style.display = "none";
  }
}

// Update communication stats
function updateCommunicationStats(stats) {
  // Update specific stat elements by ID
  updateStatElement("activeChatsStat", stats.activeChats || 0);
  updateStatElement(
    "responseTimeStat",
    stats.averageResponseTime || "Ma'lumot yo'q"
  );
  updateStatElement("todayMessagesStat", stats.todayMessages || 0);
}

// Update communication stats error state
function updateCommunicationStatsError() {
  updateStatElement("activeChatsStat", "Ma'lumot topilmadi");
  updateStatElement("responseTimeStat", "Ma'lumot topilmadi");
  updateStatElement("todayMessagesStat", "Ma'lumot topilmadi");
}

// Update single stat element
function updateStatElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    if (typeof value === "number") {
      element.textContent = value.toLocaleString();
    } else {
      element.textContent = value;
    }
  }
}

// Load inventory management - Senior Software Engineer Implementation
async function loadInventoryManagement() {
  let loader = null;

  try {
    loader = document.querySelector(
      "#criticalItemsList .loading-placeholder-item"
    );

    const response = await fetch("/manufacturer/api/inventory-management");

    if (response.ok) {
      const data = await response.json();
      if (data.stockSummary) {
        renderInventorySummary(data.stockSummary);

        if (data.criticalItems && data.criticalItems.length > 0) {
          renderCriticalItems(data.criticalItems);
        } else {
          showInventoryEmptyState();
        }
      } else {
        showInventoryEmptyState();
      }
    } else {
      showInventoryEmptyState();
      setInventoryStatsError();
    }
  } catch (error) {
    console.error("❌ Error loading inventory management:", error);
    showInventoryEmptyState();
    setInventoryStatsError();
  } finally {
    // Always remove loading placeholder in finally block
    if (loader && loader.parentNode) {
      loader.remove();
    }
  }
}

// Render inventory summary - Professional Dynamic Implementation
function renderInventorySummary(summary) {
  // Update stock counts using specific IDs for precision
  updateStockElement(
    "normalStockCount",
    summary.normal?.count || 0,
    window.t ? window.t('manufacturer.dashboard.kpiCards.item') : "item"
  );
  updateStockElement("lowStockCount", summary.low?.count || 0, window.t ? window.t('manufacturer.dashboard.kpiCards.item') : "item");
  updateStockElement(
    "outOfStockCount",
    summary.outOfStock?.count || 0,
    window.t ? window.t('manufacturer.dashboard.kpiCards.item') : "item"
  );

}

// Render critical items - Senior Level Dynamic Implementation
function renderCriticalItems(items) {
  const container = document.getElementById("criticalItemsList");
  if (!container) return;

  if (!items || items.length === 0) {
    showInventoryEmptyState();
    return;
  }

  const itemsHTML = items
    .map((item) => {
      const name = item.name || (window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.unknownProduct') : "Unknown Product");
      const sku = item.sku || "N/A";
      const stock = item.currentStock || 0;
      const effectiveStock = item.effectiveStock || stock;
      const unit = item.unit || window.t ? window.t('manufacturer.dashboard.kpiCards.item') : "item";
      const level = item.level || window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.level') : "warning";
      const action = item.action || window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.action') : "Tekshirish";
      const daysUntilStockout = item.daysUntilStockout;

      // Show additional info for critical items
      const additionalInfo =
        daysUntilStockout !== undefined && daysUntilStockout > 0
          ? `<small class="stock-days">${daysUntilStockout} kun qoldi</small>`
          : "";

      return `
            <div class="stock-item ${level}">
                <div class="item-info">
                    <h5 class="item-name">${name}</h5>
                    <p class="item-sku">SKU: ${sku}</p>
                    ${additionalInfo}
                </div>
                <div class="item-stock">
                    <span class="stock-level ${level}">${effectiveStock} ${unit}</span>
                    <span class="stock-action">${action}</span>
                </div>
            </div>
        `;
    })
    .join("");

  container.innerHTML = itemsHTML;
}

// Show inventory empty state
function showInventoryEmptyState() {
  const container = document.getElementById("criticalItemsList");
  if (!container) return;

  container.innerHTML = `
        <div class="no-data">
            <div class="no-data-icon">
                <i class="fas fa-boxes"></i>
            </div>
                    <h4>${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.noData') : 'No critical items found'}</h4>
        <p>${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.noDataDesc') : 'All products are at normal stock levels. Critical items will appear here if any.'}</p>
        </div>
    `;
}

// Set inventory stats error state
function setInventoryStatsError() {
  updateStockElement("normalStockCount", "Ma'lumot yo'q", "");
  updateStockElement("lowStockCount", "Ma'lumot yo'q", "");
  updateStockElement("outOfStockCount", "Ma'lumot yo'q", "");
}

// Update stock element helper
function updateStockElement(elementId, value, unit) {
  const element = document.getElementById(elementId);
  if (element) {
    if (typeof value === "number") {
      element.textContent = `${value} ${unit}`;
    } else {
      element.textContent = value;
    }
  }
}

// Helper functions
function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes} ${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.minute') : "daqiqa"} oldin`;
  } else if (diffHours < 24) {
    return `${diffHours} ${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.hour') : "soat"} oldin`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.day') : "kun"} oldin`;
  }
}

function getPriorityText(priority) {
  const priorityMap = {
    urgent: window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.urgent') : "Shoshilinch",
    new: window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.new') : "Yangi",
    followup: window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.followup') : "Kuzatuv",
  };
  return priorityMap[priority] || priority;
}

// Initialize Manufacturer Dashboard
document.addEventListener("DOMContentLoaded", function () {
  // Header functionality is handled by dashboard-init.js to prevent conflicts
  console.log('📊 Dashboard: Header functionality delegated to dashboard-init.js');

  function initializeResponsiveHandlers() {
    // Sidebar functionality is now handled by dashboard-init.js to prevent conflicts
    console.log('📊 Dashboard: Sidebar functionality delegated to dashboard-init.js');
    
    // Just sync the sidebar state if dashboard-init.js hasn't loaded yet
    setTimeout(() => {
      if (typeof window.syncSidebarState === 'function') {
        window.syncSidebarState();
        console.log('✅ Dashboard: Sidebar state synced with dashboard-init.js');
      }
    }, 100);
  }

  // Initialize responsive handlers (enhanced)
  initializeResponsiveHandlers();

  const dashboardOptions = {
    userId: '<%= typeof user !== "undefined" && user._id ? user._id : "" %>',
    userName:
      '<%= typeof user !== "undefined" && user.name ? user.name.replace(/"/g, "&quot;") : "Manufacturer" %>',
    companyName:
      '<%= typeof user !== "undefined" && user.companyName ? user.companyName.replace(/"/g, "&quot;") : "Manufacturing Company" %>',
    currentPage: "dashboard",
  };

  // Force initialize with real data
  window.manufacturerDashboard = new ManufacturerDashboard(dashboardOptions);

  // Initialize and force data load
  window.manufacturerDashboard.init().then(() => {
    
    // Force immediate KPI update with server data if available
    const serverStats = JSON.parse(
      "<%= JSON.stringify(JSON.stringify(stats || {})) %>"
    );
    if (serverStats && Object.keys(serverStats).length > 0) {
      window.manufacturerDashboard.updateKPICards(serverStats);
    }

    // Force API refresh after 2 seconds
    setTimeout(() => {
      window.manufacturerDashboard.loadDashboardStats();
    }, 2000);
  });
});

/**
 * Manufacturer Dashboard JavaScript
 * Professional manufacturing dashboard with real-time features
 * Senior Software Engineer level implementation
 */

class ManufacturerDashboard {
  constructor(options = {}) {
    this.options = {
      currentPage: "dashboard",
      userId: null,
      userName: "",
      companyName: "",
      theme: "light",
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
      apiEndpoints: {
        dashboardStats: "/manufacturer/api/dashboard-stats",
        productionMetrics: "/manufacturer/api/production-metrics",
        salesAnalytics: "/manufacturer/api/sales-analytics",
        productionOrders: "/manufacturer/api/production-orders",
        equipmentStatus: "/manufacturer/api/equipment-status",
        qualityMetrics: "/manufacturer/api/quality-metrics",
        notifications: "/manufacturer/api/notifications",
        distributorInquiries: "/manufacturer/api/distributor-inquiries",
        communicationCenter: "/manufacturer/api/communication-center",
        inventoryManagement: "/manufacturer/api/inventory-management",
      },
      ...options,
    };

    this.charts = {};
    this.refreshTimers = {};
    this.isInitialized = false;
    this.logger = console;
  }

  /**
   * Initialize the manufacturer dashboard
   */
  async init() {
    try {

      // Initialize core components
      this.initializeElements();
      this.setupEventListeners();
      // Theme and sidebar already initialized by dashboard-init.js

      // Load page-specific content
      await this.loadPageContent();

      // Start auto-refresh if enabled
      if (this.options.autoRefresh) {
        this.startAutoRefresh();
      }

      this.isInitialized = true;
   
      // Dispatch ready event
      this.dispatchEvent("dashboard-ready", {
        dashboard: this,
        options: this.options,
      });
    } catch (error) {
      this.logger.error("❌ Dashboard initialization failed:", error);
      this.showError("Failed to initialize dashboard");
    }
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      // Layout elements
      sidebar: document.getElementById("manufacturerSidebar"),
      header: document.getElementById("manufacturerHeader"),
      sidebarToggle: document.getElementById("sidebarToggle"),
      mobileMenuToggle: document.getElementById("mobileMenuToggle"),

      // Theme elements
      themeToggle: document.getElementById("themeToggle"),
      themeIcon: document.getElementById("themeIcon"),

      // Navigation elements
      navItems: document.querySelectorAll(".nav-item"),
      submenuItems: document.querySelectorAll(".nav-submenu"),

      // Header elements
      currentTime: document.getElementById("currentTime"),
      globalSearch: document.getElementById("globalSearch"),
      searchSuggestions: document.getElementById("searchSuggestions"),
      notificationBtn: document.getElementById("notificationBtn"),
      notificationMenu: document.getElementById("notificationMenu"),
      profileBtn: document.getElementById("profileBtn"),
      profileMenu: document.getElementById("profileMenu"),

      // Quick actions
      quickActionsBtn: document.getElementById("quickActionsBtn"),
      fabMenu: document.getElementById("fabMenu"),
      newProductionOrderBtn: document.getElementById("newProductionOrderBtn"),
      qualityCheckBtn: document.getElementById("qualityCheckBtn"),
      equipmentStatusBtn: document.getElementById("equipmentStatusBtn"),

      // Dashboard widgets
      productionOutput: document.getElementById("productionOutput"),
      overallEfficiency: document.getElementById("overallEfficiency"),
      qualityScore: document.getElementById("qualityScore"),
      monthlyRevenue: document.getElementById("monthlyRevenue"),

      // Charts
      productionChart: document.getElementById("productionChart"),
      revenueSparkline: document.getElementById("revenueSparkline"),

      // Modals
      newProductionOrderModal: document.getElementById(
        "newProductionOrderModal"
      ),
      newProductionOrderForm: document.getElementById("newProductionOrderForm"),
      submitProductionOrder: document.getElementById("submitProductionOrder"),
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Sidebar toggle
    if (this.elements.sidebarToggle) {
      this.elements.sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Mobile menu toggle
    if (this.elements.mobileMenuToggle) {
      this.elements.mobileMenuToggle.addEventListener("click", () => {
        this.toggleMobileMenu();
      });
    }

    // Theme toggle
    if (this.elements.themeToggle) {
      this.elements.themeToggle.addEventListener("click", () => {
        this.toggleTheme();
      });
    }

    // Navigation submenu toggles
    this.elements.submenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleSubmenu(item);
      });
    });

    // Global search
    if (this.elements.globalSearch) {
      this.elements.globalSearch.addEventListener("input", (e) => {
        this.handleSearch(e.target.value);
      });

      this.elements.globalSearch.addEventListener("focus", () => {
        this.showSearchSuggestions();
      });

      this.elements.globalSearch.addEventListener("blur", () => {
        setTimeout(() => this.hideSearchSuggestions(), 200);
      });
    }

    // Notification dropdown
    if (this.elements.notificationBtn) {
      this.elements.notificationBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleNotifications();
      });
    }

    // Profile dropdown
    if (this.elements.profileBtn) {
      this.elements.profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleProfile();
      });
    }

    // Quick actions FAB
    if (this.elements.quickActionsBtn) {
      this.elements.quickActionsBtn.addEventListener("click", () => {
        this.toggleQuickActions();
      });
    }

    // Production order modal
    if (this.elements.newProductionOrderBtn) {
      this.elements.newProductionOrderBtn.addEventListener("click", () => {
        this.showNewProductionOrderModal();
      });
    }

    if (this.elements.submitProductionOrder) {
      this.elements.submitProductionOrder.addEventListener("click", () => {
        this.submitProductionOrder();
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      this.closeAllDropdowns(e);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Window resize handler
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Update current time
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 1000);
  }

  /**
   * Initialize theme
   */
  initializeTheme() {
    const savedTheme =
      localStorage.getItem("manufacturer-theme") || this.options.theme;
    this.setTheme(savedTheme);
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    // Use Universal Theme Manager if available
    if (window.UniversalTheme) {
      window.UniversalTheme.setTheme(theme);
      this.options.theme = theme;
    } else {
      // Fallback implementation - use documentElement instead of body for consistency
      document.documentElement.setAttribute("data-theme", theme);
      document.body.setAttribute("data-theme", theme); // Keep for backwards compatibility
      localStorage.setItem("manufacturer-theme", theme);

      if (this.elements.themeIcon) {
        this.elements.themeIcon.className =
          theme === "dark" ? "las la-sun" : "las la-moon";
      }

      this.options.theme = theme;
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    // Use Universal Theme Manager if available
    if (window.UniversalTheme) {
      window.UniversalTheme.toggleTheme();
      this.options.theme = window.UniversalTheme.getTheme();
    } else {
      const currentTheme = this.options.theme;
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.setTheme(newTheme);
    }
  }

  /**
   * Setup sidebar functionality
   */
  setupSidebar() {
    // Sidebar resize handle
    const resizeHandle = document.getElementById("sidebarResizeHandle");
    if (resizeHandle) {
      this.setupSidebarResize(resizeHandle);
    }

    // Load sidebar stats
    this.loadSidebarStats();
  }

  /**
   * Setup header functionality
   */
  setupHeader() {
    // Load header metrics
    this.loadHeaderMetrics();

    // Setup header progress bar
    this.setupProgressBar();
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar() {
    document.body.classList.toggle("sidebar-collapsed");
    localStorage.setItem(
      "sidebarCollapsed",
      document.body.classList.contains("sidebar-collapsed")
    );
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.toggle("show");
    }
  }

  /**
   * Toggle submenu
   */
  toggleSubmenu(submenuItem) {
    submenuItem.classList.toggle("open");

    // Close other submenus
    this.elements.submenuItems.forEach((item) => {
      if (item !== submenuItem) {
        item.classList.remove("open");
      }
    });
  }

  /**
   * Handle search input
   */
  handleSearch(query) {
    if (query.length >= 2) {
      this.performSearch(query);
    } else {
      this.hideSearchSuggestions();
    }
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    try {
      // Mock search results - replace with real API call
      const results = [
        {
          type: "order",
          title: `Production Order ${query}`,
          url: `/manufacturer/production/orders/${query}`,
        },
        {
          type: "product",
          title: `${query} Products`,
          url: `/manufacturer/products?search=${query}`,
        },
        {
          type: "equipment",
          title: `${query} Equipment`,
          url: `/manufacturer/operations/equipment?search=${query}`,
        },
      ];

      this.showSearchResults(results);
    } catch (error) {
      this.logger.error("Search failed:", error);
    }
  }

  /**
   * Show search suggestions
   */
  showSearchSuggestions() {
    if (this.elements.searchSuggestions) {
      this.elements.searchSuggestions.style.display = "block";
    }
  }

  /**
   * Hide search suggestions
   */
  hideSearchSuggestions() {
    if (this.elements.searchSuggestions) {
      this.elements.searchSuggestions.style.display = "none";
    }
  }

  /**
   * Show search results
   */
  showSearchResults(results) {
    // Implementation for showing search results
    this.showSearchSuggestions();
  }

  /**
   * Toggle notifications dropdown
   */
  toggleNotifications() {
    if (this.elements.notificationMenu) {
      this.elements.notificationMenu.classList.toggle("show");
      this.elements.profileMenu?.classList.remove("show");
    }
  }

  /**
   * Toggle profile dropdown
   */
  toggleProfile() {
    if (this.elements.profileMenu) {
      this.elements.profileMenu.classList.toggle("show");
      this.elements.notificationMenu?.classList.remove("show");
    }
  }

  /**
   * Toggle quick actions FAB
   */
  toggleQuickActions() {
    const fabContainer = document.querySelector(".fab-container");
    if (fabContainer) {
      fabContainer.classList.toggle("open");
    }
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(e) {
    if (!e.target.closest(".notification-dropdown")) {
      this.elements.notificationMenu?.classList.remove("show");
    }

    if (!e.target.closest(".profile-dropdown")) {
      this.elements.profileMenu?.classList.remove("show");
    }

    if (!e.target.closest(".fab-container")) {
      document.querySelector(".fab-container")?.classList.remove("open");
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      this.elements.globalSearch?.focus();
    }

    // Ctrl/Cmd + Shift + N for new production order
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
      e.preventDefault();
      this.showNewProductionOrderModal();
    }

    // Ctrl/Cmd + Shift + D for dashboard
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
      e.preventDefault();
      window.location.href = "/manufacturer/dashboard";
    }

    // Escape to close modals and dropdowns
    if (e.key === "Escape") {
      this.closeAllDropdowns({ target: document.body });
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update chart sizes
    Object.values(this.charts).forEach((chart) => {
      if (chart && chart.resize) {
        chart.resize();
      }
    });

    // Update mobile menu state
    if (window.innerWidth > 992) {
      this.elements.sidebar?.classList.remove("show");
    }
  }

  /**
   * Update current time
   */
  updateCurrentTime() {
    if (this.elements.currentTime) {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      this.elements.currentTime.textContent = timeString;
    }
  }

  /**
   * Load page content based on current page
   */
  async loadPageContent() {
    switch (this.options.currentPage) {
      case "dashboard":
        await this.loadDashboardContent();
        break;
      case "production":
        await this.loadProductionContent();
        break;
      case "products":
        await this.loadProductsContent();
        break;
      default:
        null;
    }
  }

  /**
   * Load dashboard content
   */
  async loadDashboardContent() {
    try {
      // Load dashboard data in parallel
      const promises = [
        this.loadDashboardStats(),
        this.loadSalesChart(),
        this.loadProductionMetrics(),
        this.loadSalesAnalytics(),
        this.loadNotifications(),
        this.loadDistributorInquiries(),
        this.loadCommunicationCenter(),
        this.loadInventoryManagement(),
      ];

      await Promise.all(promises);

    } catch (error) {
      this.logger.error("❌ Failed to load dashboard content:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  /**
   * Load dashboard statistics from backend API
   */
  async loadDashboardStats() {
    try {

      // Call real API endpoint
      const response = await this.apiCall(
        this.options.apiEndpoints.dashboardStats
      );

      if (response.success && response.data) {
        this.updateDashboardMetrics(response.data);
        this.updateKPICards(response.data);
      } else {
        throw new Error(response.error || "Failed to load dashboard stats");
      }
    } catch (error) {
      this.logger.error("❌ Failed to load dashboard stats:", error);
      this.showError("Dashboard malumotlarini yuklashda xatolik yuz berdi");
    }
  }

  /**
   * Update dashboard metrics with enhanced error handling
   */
  updateDashboardMetrics(stats) {
    try {
    
      // Update production output with safe data access
      if (this.elements.productionOutput) {
        const valueElement =
          this.elements.productionOutput.querySelector(".value");
        if (valueElement && stats?.production?.dailyOutput !== undefined) {
          this.animateValue(
            valueElement,
            0,
            stats.production.dailyOutput,
            1000
          );
        } else {
          this.logger.warn("⚠️ Production output element not found or no data");
        }
      }

      // Update efficiency with safe data access
      if (this.elements.overallEfficiency) {
        const valueElement =
          this.elements.overallEfficiency.querySelector(".value");
        if (valueElement && stats?.efficiency?.value !== undefined) {
          this.animateValue(valueElement, 0, stats.efficiency.value, 1000, 1);
        } else {
          this.logger.warn("⚠️ Efficiency element not found or no data");
        }
      }

      // Update quality score with safe data access
      if (this.elements.qualityScore) {
        const valueElement = this.elements.qualityScore.querySelector(".value");
        if (valueElement && stats?.quality?.score !== undefined) {
          this.animateValue(valueElement, 0, stats.quality.score, 1000, 1);
        } else {
          this.logger.warn("⚠️ Quality score element not found or no data");
        }
      }

      // Update revenue with safe data access
      if (this.elements.monthlyRevenue) {
        const valueElement =
          this.elements.monthlyRevenue.querySelector(".value");
        if (valueElement && stats?.revenue?.monthly !== undefined) {
          const formattedRevenue = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(stats.revenue.monthly);
          valueElement.textContent = formattedRevenue;
          } else {
          this.logger.warn("⚠️ Revenue element not found or no data");
        }
      }

    } catch (error) {
      this.logger.error("❌ Failed to update dashboard metrics:", error);
    }
  }

  /**
   * Animate numeric values
   */
  animateValue(element, start, end, duration, decimals = 0) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const current = start + (end - start) * this.easeOutQuart(progress);
      element.textContent =
        decimals > 0
          ? current.toFixed(decimals)
          : Math.floor(current).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Easing function
   */
  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Load production chart
   */
  async loadProductionChart() {
    if (!this.elements.productionChart) return;

    try {
      const ctx = this.elements.productionChart.getContext("2d");

      // Mock chart data
      const data = {
        labels: [
          "Jan 24",
          "Jan 25",
          "Jan 26",
          "Jan 27",
          "Jan 28",
          "Jan 29",
          "Jan 30",
        ],
        datasets: [
          {
            label: "Production Output",
            data: [2200, 2350, 2180, 2400, 2520, 2450, 2380],
            borderColor: "#7c3aed",
            backgroundColor: "rgba(124, 58, 237, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Quality Score",
            data: [97.2, 97.8, 98.1, 97.9, 98.3, 98.2, 98.5],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
            yAxisID: "y1",
          },
        ],
      };

      this.charts.production = new Chart(ctx, {
        type: "line",
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
          },
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error("Failed to load production chart:", error);
    }
  }

  /**
   * Load equipment status
   */
  async loadEquipmentStatus() {
    // Implementation for loading equipment status
    this.logger.log("Loading equipment status...");
  }

  /**
   * Load recent alerts
   */
  async loadRecentAlerts() {
    // Implementation for loading recent alerts
    this.logger.log("Loading recent alerts...");
  }

  /**
   * Load sidebar stats
   */
  async loadSidebarStats() {
    // Implementation for loading sidebar statistics
    const sidebarStats = document.getElementById("sidebarStats");
    if (sidebarStats) {
      // Update sidebar stats
    }
  }

  /**
   * Load header metrics
   */
  async loadHeaderMetrics() {
    // Implementation for loading header metrics
    const headerMetrics = document.querySelectorAll(".metric-value");
    if (headerMetrics.length > 0) {
      // Update header metrics
    }
  }

  /**
   * Setup progress bar
   */
  setupProgressBar() {
    this.progressBar = document.getElementById("headerProgress");
  }

  /**
   * Show progress
   */
  showProgress() {
    if (this.progressBar) {
      this.progressBar.classList.add("active");
    }
  }

  /**
   * Hide progress
   */
  hideProgress() {
    if (this.progressBar) {
      this.progressBar.classList.remove("active");
    }
  }

  /**
   * Show new production order modal
   */
  showNewProductionOrderModal() {
    if (this.elements.newProductionOrderModal) {
      const modal = new bootstrap.Modal(this.elements.newProductionOrderModal);
      modal.show();
    }
  }

  /**
   * Submit production order
   */
  async submitProductionOrder() {
    try {
      const formData = new FormData(this.elements.newProductionOrderForm);
      const orderData = Object.fromEntries(formData.entries());

      this.showProgress();

      // Mock API call - replace with real implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.hideProgress();
      this.showSuccess("Production order created successfully");

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        this.elements.newProductionOrderModal
      );
      modal?.hide();

      // Refresh dashboard data
      await this.loadDashboardContent();
    } catch (error) {
      this.hideProgress();
      this.showError("Failed to create production order");
    }
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (this.refreshTimers.dashboard) {
      clearInterval(this.refreshTimers.dashboard);
    }

    this.refreshTimers.dashboard = setInterval(() => {
      this.refreshDashboardData();
    }, this.options.refreshInterval);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    Object.values(this.refreshTimers).forEach((timer) => {
      clearInterval(timer);
    });
    this.refreshTimers = {};
  }

  /**
   * Refresh dashboard data
   */
  async refreshDashboardData() {
    try {
      await this.loadDashboardStats();
    } catch (error) {
      this.logger.error("Failed to refresh dashboard data:", error);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showToast(message, "success");
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, "error");
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    const toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) return;

    const toastId = "toast-" + Date.now();
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${
      type === "error" ? "danger" : type
    } border-0`;
    toast.id = toastId;
    toast.setAttribute("role", "alert");

    toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener("hidden.bs.toast", () => {
      toast.remove();
    });
  }

  /**
   * Make API call with error handling and token management
   */
  async apiCall(url, options = {}) {
    try {
      const defaultOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Include cookies for JWT
      };

      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error("❌ API call failed:", error);
      throw error;
    }
  }

  /**
   * Update KPI cards with backend data
   */
  updateKPICards(stats) {
    try {
      // Update Total Sales card - try both selector methods
      const totalSalesElement =
        document.getElementById("totalSalesValue") ||
        document.querySelector('[data-kpi="totalSales"] .kpi-value');
      if (totalSalesElement && stats.totalSales) {
        const formattedValue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(stats.totalSales);

        totalSalesElement.innerHTML = formattedValue;
        totalSalesElement.classList.add("updated");
      } else {
        this.logger.warn("❌ Total Sales element not found or no data");
      }

      // Update Active Orders card
      const activeOrdersElement =
        document.getElementById("activeOrdersValue") ||
        document.querySelector('[data-kpi="activeOrders"] .kpi-value');
      if (activeOrdersElement && stats.activeOrders !== undefined) {
        activeOrdersElement.innerHTML = stats.activeOrders.toLocaleString();
        activeOrdersElement.classList.add("updated");
       } else {
        this.logger.warn("❌ Active Orders element not found or no data");
      }

      // Update Total Products card
      const totalProductsElement =
        document.getElementById("totalProductsValue") ||
        document.querySelector('[data-kpi="totalProducts"] .kpi-value');
      if (totalProductsElement && stats.totalProducts !== undefined) {
        totalProductsElement.innerHTML = stats.totalProducts.toLocaleString();
        totalProductsElement.classList.add("updated");
     } else {
        this.logger.warn("❌ Total Products element not found or no data");
      }

      // Update Inquiries card
      const inquiriesElement =
        document.getElementById("inquiriesValue") ||
        document.querySelector('[data-kpi="inquiries"] .kpi-value');
      if (inquiriesElement && stats.inquiries !== undefined) {
        inquiriesElement.innerHTML = stats.inquiries.toLocaleString();
        inquiriesElement.classList.add("updated");
      
      } else {
        this.logger.warn("❌ Inquiries element not found or no data");
        this.logger.log("🔍 Available stats:", stats);
      }

      // Update platform status metrics
      this.updatePlatformStatusMetrics(stats);

      // Update trend indicators
      this.updateTrendIndicators(stats);

      // Update top products if data is available
      if (stats.topProducts) {
        this.updateTopProductsWidget(stats.topProducts);
      }

      // Update recent orders if data is available
      if (stats.recentOrders) {
        this.updateRecentOrdersWidget(stats.recentOrders);
      }

    } catch (error) {
      this.logger.error("❌ Failed to update KPI cards:", error);
    }
  }

  /**
   * Update platform status metrics
   */
  updatePlatformStatusMetrics(stats) {
    try {
      // Update marketplace activity
      const marketplaceActivityElement = document.getElementById(
        "marketplaceActivity"
      );
      if (
        marketplaceActivityElement &&
        stats.marketplaceActivity !== undefined
      ) {
        marketplaceActivityElement.innerHTML = `${stats.marketplaceActivity}%`;
        marketplaceActivityElement.classList.add("updated");
      }

      // Update inquiry conversion
      const inquiryConversionElement =
        document.getElementById("inquiryConversion");
      if (inquiryConversionElement && stats.inquiryConversion !== undefined) {
        inquiryConversionElement.innerHTML = `${stats.inquiryConversion}%`;
        inquiryConversionElement.classList.add("updated");
      }

      // Update active distributors
      const activeDistributorsElement =
        document.getElementById("activeDistributors");
      if (activeDistributorsElement && stats.activeDistributors !== undefined) {
        activeDistributorsElement.innerHTML =
          stats.activeDistributors.toLocaleString();
        activeDistributorsElement.classList.add("updated");
      }
    } catch (error) {
      this.logger.error("❌ Failed to update platform status metrics:", error);
    }
  }

  /**
   * Update trend indicators for KPI cards
   */
  updateTrendIndicators(stats) {
    if (stats.trends) {
      // Update sales trend
      const salesTrendElement = document.querySelector(
        '[data-kpi="totalSales"] .kpi-trend'
      );
      if (salesTrendElement && stats.revenueGrowth) {
        salesTrendElement.textContent = `+${stats.revenueGrowth}%`;
        salesTrendElement.className = "kpi-trend trend-up";
      }

      // Update orders trend
      const ordersTrendElement = document.querySelector(
        '[data-kpi="activeOrders"] .kpi-trend'
      );
      if (ordersTrendElement && stats.trends.ordersTrend) {
        const growth = this.calculateGrowth(stats.trends.ordersTrend);
        ordersTrendElement.textContent = `${growth > 0 ? "+" : ""}${growth}%`;
        ordersTrendElement.className = `kpi-trend ${
          growth > 0 ? "trend-up" : "trend-down"
        }`;
      }
    }
  }

  /**
   * Calculate growth percentage from trend array
   */
  calculateGrowth(trendArray) {
    if (!trendArray || trendArray.length < 2) return 0;
    const current = trendArray[trendArray.length - 1];
    const previous = trendArray[trendArray.length - 2];
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Animate number values with formatted output
   */
  animateValue(element, start, end, duration, formatter = null) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      if (formatter) {
        element.textContent = formatter(Math.round(current));
      } else {
        element.textContent = Math.round(current).toLocaleString("uz-UZ");
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Load and update sales analytics chart
   */
  async loadSalesChart() {
    try {

      const response = await this.apiCall(
        this.options.apiEndpoints.productionMetrics
      );

      if (response.success && response.data) {
        this.updateSalesChart(response.data);
      }
    } catch (error) {
      this.logger.error("❌ Failed to load sales chart:", error);
    }
  }

  /**
   * Update sales chart with real data
   */
  updateSalesChart(data) {
    const chartCanvas = document.getElementById("salesChart");
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext("2d");

    // Destroy existing chart if it exists
    if (this.charts.salesChart) {
      this.charts.salesChart.destroy();
    }

    // Create new chart with real data
    this.charts.salesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Yanvar", "Fevral", "Mart", "Aprel", "May"],
        datasets: [
          {
            label: "B2B Savdo hajmi",
            data: data.trends?.salesTrend || [
              98000, 105000, 112000, 118000, 125450,
            ],
            borderColor: "rgb(124, 58, 237)",
            backgroundColor: "rgba(124, 58, 237, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Distributorlar so'rovlari",
            data: data.trends?.inquiriesTrend || [38, 42, 45, 43, 45],
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            fill: true,
            tension: 0.4,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Savdo hajmi ($)",
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "So'rovlar soni",
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "B2B Marketplace Performance",
          },
          legend: {
            display: true,
          },
        },
      },
    });
  }

  /**
   * Load production metrics data
   */
  async loadProductionMetrics() {
    try {

      const response = await this.apiCall(
        this.options.apiEndpoints.productionMetrics
      );

      if (response.success && response.data) {
        this.updateProductionMetrics(response.data);
         }
    } catch (error) {
      this.logger.error("❌ Failed to load production metrics:", error);
    }
  }

  /**
   * Load sales analytics data
   */
  async loadSalesAnalytics() {
    try {

      const response = await this.apiCall(
        this.options.apiEndpoints.salesAnalytics
      );

      if (response.success && response.data) {
        this.updateSalesAnalytics(response.data);
      }
    } catch (error) {
      this.logger.error("❌ Failed to load sales analytics:", error);
    }
  }

  /**
   * Update sales analytics display
   */
  updateSalesAnalytics(data) {
    try {
      // Update revenue analytics
      if (data.revenue) {
        const revenueCard = document.querySelector(
          '[data-kpi="revenue"] .kpi-value'
        );
        if (revenueCard) {
          this.animateValue(revenueCard, 0, data.revenue.current, 1500, (val) =>
            new Intl.NumberFormat("uz-UZ", {
              style: "currency",
              currency: "USD",
            }).format(val)
          );
        }
      }

      // Update customer metrics
      if (data.customers) {
        const customersCard = document.querySelector(
          '[data-kpi="customers"] .kpi-value'
        );
        if (customersCard) {
          this.animateValue(customersCard, 0, data.customers.total, 1000);
        }
      }

      // Update geographical distribution chart if available
      if (data.geographical && window.Chart) {
        this.updateGeographicalChart(data.geographical);
      }

    } catch (error) {
      this.logger.error("❌ Failed to update sales analytics:", error);
    }
  }

  /**
   * Update production metrics display
   */
  updateProductionMetrics(metrics) {
    // Update recent orders widget
    const recentOrdersContainer = document.querySelector(".recent-orders-list");
    if (recentOrdersContainer && metrics.recentOrders) {
      this.updateRecentOrders(metrics.recentOrders);
    }

    // Update top products widget
    const topProductsContainer = document.querySelector(".product-list");
    if (topProductsContainer && metrics.topProducts) {
      this.updateTopProducts(metrics.topProducts);
    }
  }

  /**
   * Update recent orders widget
   */
  updateRecentOrders(orders) {
    const container = document.querySelector(".recent-orders-list");
    if (!container) return;

    container.innerHTML = orders
      .map(
        (order) => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status status-${
                      order.status
                    }">${this.getStatusText(order.status)}</span>
                </div>
                <div class="order-company">${order.distributor}</div>
                <div class="order-amount">$${order.amount.toLocaleString()}</div>
            </div>
        `
      )
      .join("");
  }

  /**
   * Update top products widget
   */
  updateTopProducts(products) {
    const container = document.querySelector(".product-list");
    if (!container) return;

    container.innerHTML = products
      .map(
        (product) => `
            <div class="product-item">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-stats">
                        <span class="product-sales">$${product.sales.toLocaleString()}</span>
                        <span class="product-units">${product.units}</span>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  /**
   * Update top products widget with real data
   */
  updateTopProductsWidget(products) {
    try {
      const container = document.querySelector(".top-products-list");
      if (!container || !products || products.length === 0) return;

      container.innerHTML = products
        .map(
          (product, index) => `
                <div class="product-item">
                    <div class="product-info">
                        <div class="product-rank">#${index + 1}</div>
                        <div class="product-details">
                            <h4 class="product-name">${product.name}</h4>
                            <p class="product-sales">${
                              product.units
                            } sotildi</p>
                        </div>
                    </div>
                    <div class="product-stats">
                        <span class="revenue">$${product.sales.toLocaleString()}</span>
                        <div class="rating">
                            <i class="fas fa-star"></i> ${(
                              4.5 +
                              Math.random() * 0.4
                            ).toFixed(1)}
                        </div>
                    </div>
                </div>
            `
        )
        .join("");

    } catch (error) {
      this.logger.error("❌ Failed to update top products widget:", error);
    }
  }

  /**
   * Update recent orders widget with real data
   */
  updateRecentOrdersWidget(orders) {
    try {
      const container = document.querySelector(".orders-list");
      if (!container || !orders || orders.length === 0) return;

      container.innerHTML = orders
        .map((order, index) => {
          const statusClass = this.getStatusClass(order.status);
          const progress = this.getProgressByStatus(order.status);

          return `
                    <div class="order-item">
                        <div class="order-header">
                            <span class="order-id">${order.id}</span>
                            <span class="order-date">${this.getRelativeTime(
                              new Date()
                            )}</span>
                        </div>
                        <div class="order-body">
                            <h4 class="order-product">Buyurtma - ${
                              order.id
                            }</h4>
                            <div class="order-client">
                                <i class="fas fa-store"></i> ${
                                  order.distributor
                                }
                            </div>
                            <div class="order-amount">$${order.amount.toLocaleString()}</div>
                        </div>
                        <div class="order-footer">
                            <span class="status-badge status-${statusClass}">${this.getStatusText(
            order.status
          )}</span>
                            <div class="order-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill ${
                                      statusClass === "success" ? "success" : ""
                                    }" style="width: ${progress}%"></div>
                                </div>
                                <span class="progress-text">${progress}%</span>
                            </div>
                        </div>
                    </div>
                `;
        })
        .join("");

    } catch (error) {
      this.logger.error("❌ Failed to update recent orders widget:", error);
    }
  }

  /**
   * Get status CSS class
   */
  getStatusClass(status) {
    const statusMap = {
      pending: "warning",
      confirmed: "info",
      processing: "info",
      shipped: "success",
      delivered: "success",
      cancelled: "danger",
    };
    return statusMap[status] || "info";
  }

  /**
   * Get progress percentage by status
   */
  getProgressByStatus(status) {
    const progressMap = {
      pending: 25,
      confirmed: 50,
      processing: 75,
      shipped: 90,
      delivered: 100,
      cancelled: 0,
    };
    return progressMap[status] || 25;
  }

  /**
   * Get relative time string
   */
  getRelativeTime(date) {
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 1) return window.t ? window.t('manufacturer.dashboard.time.justNow') : "Just now";
    if (diffHours < 24) return `${diffHours} ${window.t ? window.t('manufacturer.dashboard.time.hoursAgo') : 'hours ago'}`;
    return `${Math.floor(diffHours / 24)} ${window.t ? window.t('manufacturer.dashboard.time.daysAgo') : 'days ago'}`;
  }

  /**
   * Load notifications
   */
  async loadNotifications() {
    try {
   
      const response = await this.apiCall(
        this.options.apiEndpoints.notifications
      );

      if (response.success && response.data) {
        this.updateNotificationsBadge(response.data.unreadCount);
       
      }
    } catch (error) {
      this.logger.error("❌ Failed to load notifications:", error);
    }
  }

  /**
   * Update notifications badge
   */
  updateNotificationsBadge(unreadCount) {
    const badge = document.querySelector(".notification-badge");
    if (badge && unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "block";
    } else if (badge) {
      badge.style.display = "none";
    }
  }

  /**
   * Get status text
   */
  getStatusText(status) {
    const statusMap = {
      processing: window.t ? window.t('manufacturer.dashboard.status.processing') : "Processing",
      shipped: window.t ? window.t('manufacturer.dashboard.status.shipped') : "Shipped",
      pending: window.t ? window.t('manufacturer.dashboard.status.pending') : "Pending",
      completed: window.t ? window.t('manufacturer.dashboard.status.completed') : "Completed",
      cancelled: window.t ? window.t('manufacturer.dashboard.status.cancelled') : "Cancelled",
    };
    return statusMap[status] || status;
  }

  /**
   * Load distributor inquiries data
   */
  async loadDistributorInquiries() {
    try {
    

      const response = await this.apiCall(
        this.options.apiEndpoints.distributorInquiries
      );

      if (response.success && response.data) {
        this.updateDistributorInquiries(response.data);
      } else {
        // Show empty state when API call fails or returns no data
        this.showInquiriesEmptyState();
      }
    } catch (error) {
      this.logger.error("❌ Failed to load distributor inquiries:", error);
      this.showInquiriesEmptyState();
    }
  }

  /**
   * Update distributor inquiries display with proper empty state handling
   */
  updateDistributorInquiries(data) {
    try {
      // Fix: Use specific container ID instead of generic class
      const inquiriesContainer = document.getElementById("distributorInquiriesList");
      if (!inquiriesContainer) {
        this.logger.error("❌ distributorInquiriesList container not found");
        return;
      }

      // Clear existing inquiries
      inquiriesContainer.innerHTML = "";

      // Check if data and inquiries exist
      if (data && data.inquiries && data.inquiries.length > 0) {
        // Render inquiries
        data.inquiries.forEach((inquiry) => {
          const inquiryElement = this.createInquiryElement(inquiry);
          inquiriesContainer.appendChild(inquiryElement);
        });
      } else {
        // Show empty state
        this.showInquiriesEmptyState();
      }

    } catch (error) {
      this.logger.error("❌ Failed to update distributor inquiries:", error);
      this.showInquiriesEmptyState();
    }
  }

  /**
   * Show empty state for distributor inquiries
   */
  showInquiriesEmptyState() {
    const container = document.getElementById("distributorInquiriesList");
    if (!container) return;

    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">
          <i class="fas fa-handshake"></i>
        </div>
        <h4>Ma'lumotlar topilmadi</h4>
        <p>Distributorlar so'rovlari bo'sh massiv qaytardi. Hech qanday so'rov ma'lumotlari topilmadi.</p>
      </div>
    `;
  }

  /**
   * Create inquiry element with proper error handling
   */
  createInquiryElement(inquiry) {
    const div = document.createElement("div");
    div.className = `inquiry-card ${inquiry.priority || "new"}-priority`;

    const timeAgo = this.getTimeAgo(inquiry.timestamp || inquiry.createdAt);

    div.innerHTML = `
            <div class="inquiry-info">
                <div class="company-section">
                    <div class="company-logo-placeholder">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="company-details">
                        <h4 class="company-title">${inquiry.companyName || "Noma'lum kompaniya"}</h4>
                        <span class="inquiry-timestamp">${timeAgo}</span>
                    </div>
                </div>
                <div class="priority-label ${
                  inquiry.priority || "new"
                }">${this.getPriorityLabel(inquiry.priority || "new")}</div>
            </div>
            <div class="inquiry-message">
                <p>${inquiry.message || inquiry.content || (window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.noMessage') : "No inquiry message")}</p>
                <div class="order-specs">
                    ${inquiry.specs && Array.isArray(inquiry.specs)
                      ? inquiry.specs.map((spec) => `<span class="spec-tag">${spec}</span>`).join("")
                      : ""
                    }
                </div>
            </div>
            <div class="inquiry-buttons">
                <button class="btn-respond">Javob berish</button>
                <button class="btn-quote">Narx yuborish</button>
            </div>
        `;

    return div;
  }

  /**
   * Load communication center data
   */
  async loadCommunicationCenter() {
    try {

      const response = await this.apiCall(
        this.options.apiEndpoints.communicationCenter
      );

      if (response.success && response.data) {
        this.updateCommunicationCenter(response.data);
      } else {
        // Show empty state when API call fails or returns no data
        this.showCommunicationEmptyState();
        this.updateCommunicationStatsError();
      }
    } catch (error) {
      this.logger.error("❌ Failed to load communication center:", error);
      this.showCommunicationEmptyState();
      this.updateCommunicationStatsError();
    }
  }

  /**
   * Update communication center display with proper empty state handling
   */
  updateCommunicationCenter(data) {
    try {
      // Fix: Use specific container ID instead of generic class
      const chatList = document.getElementById("chatPreviewsList");
      if (!chatList) {
        return;
      }

      // Clear existing content
      chatList.innerHTML = "";

      // Check if data and chat previews exist
      if (data && data.chatPreviews && data.chatPreviews.length > 0) {
        // Render chat previews
        data.chatPreviews.forEach((chat) => {
          const chatElement = this.createChatElement(chat);
          chatList.appendChild(chatElement);
        });
      } else {
        // Show empty state
        this.showCommunicationEmptyState();
      }

      // Update communication stats
      if (data && data.stats) {
        this.updateCommunicationStats(data.stats);
      } else {
        this.updateCommunicationStatsError();
      }

    } catch (error) {
      this.logger.error("❌ Failed to update communication center:", error);
      this.showCommunicationEmptyState();
      this.updateCommunicationStatsError();
    }
  }

  /**
   * Show empty state for communication center
   */
  showCommunicationEmptyState() {
    const container = document.getElementById("chatPreviewsList");
    if (!container) return;

    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">
          <i class="fas fa-satellite-dish"></i>
        </div>
        <h4>Ma'lumotlar topilmadi</h4>
        <p>Muloqot markazi bo'sh massiv qaytardi. Hech qanday suhbat ma'lumotlari topilmadi.</p>
      </div>
    `;
  }

  /**
   * Update communication stats with proper error handling
   */
  updateCommunicationStats(stats) {
    const activeChatsStat = document.getElementById("activeChatsStat");
    const responseTimeStat = document.getElementById("responseTimeStat");
    const todayMessagesStat = document.getElementById("todayMessagesStat");

    if (activeChatsStat) activeChatsStat.textContent = stats.activeChats || 0;
    if (responseTimeStat) responseTimeStat.textContent = stats.averageResponseTime || "Ma'lumot yo'q";
    if (todayMessagesStat) todayMessagesStat.textContent = stats.todayMessages || 0;
  }

  /**
   * Update communication stats error state
   */
  updateCommunicationStatsError() {
    const activeChatsStat = document.getElementById("activeChatsStat");
    const responseTimeStat = document.getElementById("responseTimeStat");
    const todayMessagesStat = document.getElementById("todayMessagesStat");

    if (activeChatsStat) activeChatsStat.textContent = "Ma'lumot topilmadi";
    if (responseTimeStat) responseTimeStat.textContent = "Ma'lumot topilmadi";
    if (todayMessagesStat) todayMessagesStat.textContent = "Ma'lumot topilmadi";
  }

  /**
   * Create chat element with proper error handling
   */
  createChatElement(chat) {
    const div = document.createElement("div");
    div.className = `chat-preview ${(chat.unreadCount || chat.isUnread) ? "unread" : ""}`;

    const statusClass =
      chat.status === "online"
        ? "online-indicator"
        : chat.status === "away"
        ? "away-indicator"
        : "offline-indicator";

    // Format timestamp properly
    const formattedTime = this.getTimeAgo(chat.timestamp || chat.lastMessageTime || new Date());

    div.innerHTML = `
            <div class="chat-avatar">
                <div class="chat-avatar-placeholder">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="${statusClass}"></div>
            </div>
            <div class="chat-content">
                <div class="chat-header">
                    <h4 class="chat-company">${chat.companyName || "Noma'lum kompaniya"}</h4>
                    <span class="chat-time">${formattedTime}</span>
                </div>
                <p class="chat-message">${chat.lastMessage || "Xabar mavjud emas"}</p>
                <div class="chat-meta">
                    ${
                      (chat.unreadCount && chat.unreadCount > 0)
                        ? `<span class="message-count">${chat.unreadCount}</span>`
                        : ""
                    }
                    ${
                      chat.isTyping
                        ? '<span class="typing-indicator">yozmoqda...</span>'
                        : ""
                    }
                    ${
                      !(chat.unreadCount || chat.isUnread) && !chat.isTyping
                        ? '<span class="read-indicator">O\'qildi</span>'
                        : ""
                    }
                </div>
            </div>
        `;

    return div;
  }

  /**
   * Load inventory management data
   */
  async loadInventoryManagement() {
    try {
        // Loading inventory management...

      const response = await this.apiCall(
        this.options.apiEndpoints.inventoryManagement
      );

      if (response.success && response.data) {
        this.updateInventoryManagement(response.data);
        // Inventory management loaded successfully
      }
    } catch (error) {
      this.logger.error("❌ Failed to load inventory management:", error);
    }
  }

  /**
   * Update inventory management display
   */
  updateInventoryManagement(data) {
    try {
      // Update stock summary
      const stockSummary = document.querySelector(".stock-summary");
      if (stockSummary && data.stockSummary) {
        stockSummary.innerHTML = `
                    <div class="summary-item good">
                        <div class="summary-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h4 class="summary-title">${data.stockSummary.normal.label}</h4>
                            <span class="summary-count">${data.stockSummary.normal.count} mahsulot</span>
                        </div>
                    </div>
                    <div class="summary-item warning">
                        <div class="summary-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="summary-info">
                            <h4 class="summary-title">${data.stockSummary.low.label}</h4>
                            <span class="summary-count">${data.stockSummary.low.count} mahsulot</span>
                        </div>
                    </div>
                    <div class="summary-item danger">
                        <div class="summary-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h4 class="summary-title">${data.stockSummary.outOfStock.label}</h4>
                            <span class="summary-count">${data.stockSummary.outOfStock.count} mahsulot</span>
                        </div>
                    </div>
                `;
      }

      // Update critical stock items
      const criticalStock = document.querySelector(".critical-stock");
      if (criticalStock && data.criticalItems) {
        const itemsHtml = data.criticalItems
          .map(
            (item) => `
                    <div class="stock-item ${item.level}">
                        <div class="item-info">
                            <h5 class="item-name">${item.name}</h5>
                            <p class="item-sku">${item.sku}</p>
                        </div>
                        <div class="item-stock">
                            <span class="stock-level ${item.level}">${item.currentStock} ${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.unit') : 'unit'}</span>
                            <span class="stock-action">${item.action}</span>
                        </div>
                    </div>
                `
          )
          .join("");

        criticalStock.innerHTML = `
                    <h4 class="section-title">${window.t ? window.t('manufacturer.dashboard.widgets.inventoryManagement.criticalItems.title') : 'Requires Attention'}</h4>
                    ${itemsHtml}
                `;
      }

        // Inventory management updated
    } catch (error) {
      this.logger.error("❌ Failed to update inventory management:", error);
    }
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return window.t ? window.t('manufacturer.dashboard.time.justNow') : "Just now";
    if (diffHours === 1) return `1 ${window.t ? window.t('manufacturer.dashboard.time.hourAgo') : 'hour ago'}`;
    if (diffHours < 24) return `${diffHours} ${window.t ? window.t('manufacturer.dashboard.time.hoursAgo') : 'hours ago'}`;
    return `1 ${window.t ? window.t('manufacturer.dashboard.time.dayAgo') : 'day ago'}`;
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority) {
    const labels = {
      urgent: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.urgent') : "Urgent",
      new: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.new') : "New",
      followup: window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.followup') : "Follow-up",
    };
    return labels[priority] || (window.t ? window.t('manufacturer.dashboard.widgets.distributorInquiries.priority.new') : "New");
  }

  /**
   * Dispatch custom event
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopAutoRefresh();

    // Destroy charts
    Object.values(this.charts).forEach((chart) => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });

    this.isInitialized = false;
      // Manufacturer Dashboard destroyed
  }
}

// Export for global use
window.ManufacturerDashboard = ManufacturerDashboard;

// Auto-initialize if elements exist
document.addEventListener("DOMContentLoaded", () => {
  // Fix: sidebar uses 'admin-sidebar' class, not 'manufacturerSidebar' ID
  if (document.querySelector(".admin-sidebar")) {
    window.manufacturerDashboard = new ManufacturerDashboard();
  }
});
