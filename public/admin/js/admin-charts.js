/* SLEX Admin Charts - ApexCharts Integration */

window.SlexCharts = {
  charts: {},
  
  // Initialize all charts
  init() {
    this.initGrowthChart();
    this.initMetricCharts();
    this.setupChartEventListeners();
  },
  
  // Main Growth Chart
  initGrowthChart() {
    const chartElement = document.getElementById('growthChart');
    if (!chartElement) return;
    
    const options = {
      series: [{
        name: 'Users',
        data: this.generateSampleData(30, 100, 500)
      }, {
        name: 'Companies',
        data: this.generateSampleData(30, 20, 100)
      }, {
        name: 'Orders',
        data: this.generateSampleData(30, 50, 200)
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: ['#3B82F6', '#10B981', '#8B5CF6'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: this.generateDateLabels(30),
        labels: {
          style: {
            colors: 'var(--text-secondary)',
            fontSize: '12px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: 'var(--text-secondary)',
            fontSize: '12px'
          },
          formatter: function(value) {
            return Math.round(value);
          }
        }
      },
      grid: {
        borderColor: 'var(--border)',
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: 'var(--text-primary)'
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: document.documentElement.getAttribute('data-theme') || 'light',
        style: {
          fontSize: '12px'
        }
      },
      responsive: [{
        breakpoint: 768,
        options: {
          chart: {
            height: 250
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
    
    this.charts.growth = new ApexCharts(chartElement, options);
    this.charts.growth.render();
  },
  
  // Small metric charts
  initMetricCharts() {
    this.initSparklineChart('usersChart', this.generateSampleData(7, 50, 100), '#3B82F6');
    this.initSparklineChart('companiesChart', this.generateSampleData(7, 10, 30), '#10B981');
    this.initSparklineChart('revenueChart', this.generateSampleData(7, 1000, 5000), '#8B5CF6');
  },
  
  initSparklineChart(elementId, data, color) {
    const chartElement = document.getElementById(elementId);
    if (!chartElement) return;
    
    const options = {
      series: [{
        data: data
      }],
      chart: {
        type: 'line',
        width: 100,
        height: 40,
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      colors: [color],
      tooltip: {
        enabled: false
      }
    };
    
    this.charts[elementId] = new ApexCharts(chartElement, options);
    this.charts[elementId].render();
  },
  
  // Event listeners
  setupChartEventListeners() {
    // Period buttons for growth chart
    const periodButtons = document.querySelectorAll('[data-period]');
    periodButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const period = e.target.getAttribute('data-period');
        this.updateGrowthChart(period);
        
        // Update active button
        periodButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
    
    // Theme change listener
    window.addEventListener('themeChanged', () => {
      this.updateChartsTheme();
    });
  },
  
  // Update growth chart based on period
  updateGrowthChart(period) {
    if (!this.charts.growth) return;
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    const newData = [{
      name: 'Users',
      data: this.generateSampleData(days, 100, 500)
    }, {
      name: 'Companies',
      data: this.generateSampleData(days, 20, 100)
    }, {
      name: 'Orders',
      data: this.generateSampleData(days, 50, 200)
    }];
    
    this.charts.growth.updateOptions({
      series: newData,
      xaxis: {
        categories: this.generateDateLabels(days)
      }
    });
  },
  
  // Update charts theme
  updateChartsTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.updateOptions) {
        chart.updateOptions({
          tooltip: {
            theme: theme
          },
          grid: {
            borderColor: 'var(--border)'
          }
        });
      }
    });
  },
  
  // Utility functions
  generateSampleData(days, min, max) {
    const data = [];
    const baseValue = (min + max) / 2;
    
    for (let i = 0; i < days; i++) {
      const variation = (Math.random() - 0.5) * (max - min) * 0.3;
      const trend = (i / days) * (max - min) * 0.2;
      const value = Math.max(min, Math.min(max, baseValue + variation + trend));
      data.push(Math.round(value));
    }
    
    return data;
  },
  
  generateDateLabels(days) {
    const labels = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (days <= 7) {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else if (days <= 30) {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }
    
    return labels;
  },
  
  // Update chart data from API
  updateChartData(chartName, newData) {
    if (this.charts[chartName]) {
      this.charts[chartName].updateSeries(newData);
    }
  },
  
  // Destroy all charts
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this.charts = {};
  }
};

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/admin/dashboard')) {
    SlexCharts.init();
  }
});

// Handle dashboard refresh
window.addEventListener('dashboardRefresh', (event) => {
  const { chartData } = event.detail;
  if (chartData) {
    // Update charts with new data
    SlexCharts.updateChartData('growth', chartData.growth);
  }
});