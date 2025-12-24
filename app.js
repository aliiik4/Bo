// app.js - منطق اصلی برنامه

// ============================================================================
// ۱. متغیرهای سراسری
// ============================================================================
let currentMarket = 'all';
let currentSort = 'volume';
let currentFilter = 'all';
let currentChart = null;
let favoriteSymbols = new Set();

// ============================================================================
// ۲. تابع اصلی شروع برنامه
// ============================================================================
async function initApp() {
    console.log('آماده‌سازی تحلیلگر بازار...');
    
    // مقداردهی اولیه آیکون‌ها
    lucide.createIcons();
    
    // بارگذاری اولیه داده‌ها
    await loadInitialData();
    
    // تنظیم تاریخ امروز
    document.getElementById('currentDate').textContent = 
        new Date().toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    
    // رویدادهای صفحه
    setupEventListeners();
    
    // شروع به‌روزرسانی خودکار
    startAutoRefresh();
    
    console.log('✅ برنامه آماده است');
}

// ============================================================================
// ۳. توابع مدیریت داده
// ============================================================================

/**
 * بارگذاری اولیه داده‌ها
 */
async function loadInitialData() {
    const loadingEl = document.getElementById('loading');
    const appEl = document.getElementById('app');
    
    try {
        // نمایش صفحه لودینگ
        loadingEl.style.display = 'flex';
        appEl.classList.add('hidden');
        
        // دریافت داده‌ها
        const success = await dataService.updateAllMarketData();
        
        if (success) {
            // نمایش برنامه اصلی
            setTimeout(() => {
                loadingEl.style.display = 'none';
                appEl.classList.remove('hidden');
                updateMarketDisplay();
                showNotification('داده‌های بازار با موفقیت بارگذاری شد', 'success');
            }, 500);
        } else {
            throw new Error('خطا در دریافت داده‌ها');
        }
        
    } catch (error) {
        console.error('خطا در بارگذاری اولیه:', error);
        showNotification('خطا در دریافت داده‌ها. از داده‌های نمونه استفاده می‌شود', 'warning');
        
        // نمایش برنامه با داده‌های نمونه
        loadingEl.style.display = 'none';
        appEl.classList.remove('hidden');
        updateMarketDisplay();
    }
}

/**
 * به‌روزرسانی نمایش بازار
 */
function updateMarketDisplay() {
    console.log('به‌روزرسانی نمایش بازار...');
    
    // تعیین داده‌های فعلی
    let data = [];
    if (currentMarket === 'crypto') {
        data = [...dataService.marketData.crypto];
    } else {
        data = [...dataService.marketData.bourse];
    }
    
    // اعمال فیلترها و مرتب‌سازی
    const filteredData = dataService.filterMarketData(data, {
        market: currentMarket === 'all' ? undefined : currentMarket,
        searchQuery: document.getElementById('searchInput').value,
        changeFilter: currentFilter === 'all' ? undefined : currentFilter,
        sortBy: currentSort,
        favoritesOnly: currentFilter === 'favorite'
    });
    
    // رندر کردن کارت‌ها
    renderSymbolCards(filteredData.slice(0, 50)); // حداکثر ۵۰ نماد
    
    // به‌روزرسانی وضعیت بازار
    updateMarketStatus();
}

/**
 * رندر کردن کارت‌های نماد
 */
function renderSymbolCards(symbols) {
    const container = document.getElementById('symbolsContainer');
    container.innerHTML = '';
    
    if (symbols.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="search-x" width="48" height="48"></i>
                <p>نمادی یافت نشد</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    symbols.forEach(symbol => {
        const card = createSymbolCard(symbol);
        container.appendChild(card);
    });
    
    // به‌روزرسانی آیکون‌ها
    lucide.createIcons();
}

/**
 * ایجاد یک کارت نماد
 */
function createSymbolCard(symbol) {
    const card = document.createElement('div');
    card.className = 'symbol-card';
    card.dataset.id = symbol.id;
    
    const isFavorite = favoriteSymbols.has(symbol.id);
    const changeClass = symbol.changePercent >= 0 ? 'change-positive' : 'change-negative';
    const changeIcon = symbol.changePercent >= 0 ? 'trending-up' : 'trending-down';
    const marketIcon = symbol.market === 'crypto' ? 'bitcoin' : 
                      symbol.market === 'tehran' ? 'building' : 'home';
    
    card.innerHTML = `
        <div class="symbol-header">
            <div class="symbol-name">
                <h3>${symbol.symbol}</h3>
                <p>${symbol.name}</p>
            </div>
            <div class="symbol-price">
                <div class="price">${analysisEngine.formatNumber(symbol.lastPrice)}</div>
                <div class="change ${changeClass}">
                    <i data-lucide="${changeIcon}" width="16" height="16"></i>
                    ${symbol.changePercent >= 0 ? '+' : ''}${symbol.changePercent.toFixed(2)}%
                </div>
            </div>
        </div>
        
        <div class="symbol-details">
            <div class="detail-item">
                <span class="detail-label">حجم:</span>
                <span>${analysisEngine.formatNumber(symbol.volume)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">ارزش:</span>
                <span>${analysisEngine.formatNumber(symbol.value / 1000000000, 2)}B</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">بازار:</span>
                <span>
                    <i data-lucide="${marketIcon}" width="14" height="14"></i>
                    ${symbol.market === 'tehran' ? 'بورس' : symbol.market === 'farabourse' ? 'فرابورس' : 'رمزارز'}
                </span>
            </div>
            <div class="detail-item">
                <span class="detail-label">P/E:</span>
                <span>${symbol.pe ? symbol.pe.toFixed(1) : '--'}</span>
            </div>
        </div>
        
        <div class="card-actions">
            <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite('${symbol.id}')">
                <i data-lucide="${isFavorite ? 'star' : 'star-off'}" width="18" height="18"></i>
            </button>
            <button class="btn-analysis" onclick="event.stopPropagation(); showSymbolAnalysis('${symbol.id}')">
                تحلیل پیشرفته
            </button>
        </div>
    `;
    
    // رویداد کلیک برای نمایش جزئیات
    card.addEventListener('click', () => showSymbolDetails(symbol));
    
    return card;
}

// ============================================================================
// ۴. توابع رابط کاربری
// ============================================================================

/**
 * نمایش جزئیات یک نماد
 */
function showSymbolDetails(symbol) {
    // به‌روزرسانی اطلاعات اصلی
    document.getElementById('detailSymbol').textContent = `${symbol.symbol} - ${symbol.name}`;
    document.getElementById('detailLastPrice').textContent = 
        analysisEngine.formatNumber(symbol.lastPrice);
    
    const changeElement = document.getElementById('detailChange');
    changeElement.textContent = `${symbol.changePercent >= 0 ? '+' : ''}${symbol.changePercent.toFixed(2)}%`;
    changeElement.className = symbol.changePercent >= 0 ? 'change-positive' : 'change-negative';
    
    // تحلیل تکنیکال
    const analysis = analysisEngine.performCompleteAnalysis(symbol);
    
    document.getElementById('indicatorTrend').textContent = analysis.technical.trend;
    document.getElementById('indicatorMA20').textContent = 
        analysis.technical.ma20 ? analysisEngine.formatNumber(analysis.technical.ma20) : '--';
    document.getElementById('indicatorSupport').textContent = 
        analysisEngine.formatNumber(analysis.technical.support);
    document.getElementById('indicatorResistance').textContent = 
        analysisEngine.formatNumber(analysis.technical.resistance);
    
    // آمار معاملات حقیقی/حقوقی
    const netIndividual = symbol.buyIndividualVolume - symbol.sellIndividualVolume;
    document.getElementById('statBuyIndividual').textContent = 
        analysisEngine.formatNumber(symbol.buyIndividualVolume);
    document.getElementById('statSellIndividual').textContent = 
        analysisEngine.formatNumber(symbol.sellIndividualVolume);
    document.getElementById('statNetIndividual').textContent = 
        analysisEngine.formatNumber(netIndividual);
    
    // ایجاد نمودار
    createPriceChart(symbol, analysis);
    
    // نمایش مودال
    document.getElementById('detailModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * ایجاد نمودار قیمت
 */
function createPriceChart(symbol, analysis) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // اگر نمودار قبلی وجود دارد، آن را پاک کن
    if (currentChart) {
        currentChart.destroy();
    }
    
    // تولید داده‌های نمونه برای نمودار
    const chartData = analysisEngine.generateSampleChartData(symbol, 30);
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.date),
            datasets: [{
                label: 'قیمت (تومان)',
                data: chartData.map(d => d.price),
                borderColor: analysisEngine.getChangeColor(symbol.changePercent),
                backgroundColor: analysisEngine.getChangeColor(symbol.changePercent) + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn'
                        }
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        family: 'Vazirmatn'
                    },
                    bodyFont: {
                        family: 'Vazirmatn'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: 'Vazirmatn'
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            family: 'Vazirmatn'
                        },
                        callback: function(value) {
                            return analysisEngine.formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * بستن مودال جزئیات
 */
function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

/**
 * افزودن/حذف از علاقه‌مندی‌ها
 */
function toggleFavorite(symbolId) {
    if (favoriteSymbols.has(symbolId)) {
        favoriteSymbols.delete(symbolId);
        showNotification('از علاقه‌مندی‌ها حذف شد', 'info');
    } else {
        favoriteSymbols.add(symbolId);
        showNotification('به علاقه‌مندی‌ها اضافه شد', 'success');
    }
    
    // به‌روزرسانی نمایش اگر فیلتر علاقه‌مندی‌ها فعال است
    if (currentFilter === 'favorite') {
        updateMarketDisplay();
    }
    
    // به‌روزرسانی آیکون‌ها
    lucide.createIcons();
}

/**
 * به‌روزرسانی وضعیت بازار
 */
function updateMarketStatus() {
    const timeElement = document.getElementById('marketTime');
    const statusElement = document.getElementById('marketStatus');
    
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString('fa-IR');
    
    // وضعیت بازار بر اساس ساعت
    const hour = now.getHours();
    if (hour >= 9 && hour < 12.5) {
        statusElement.textContent = 'بازار باز است';
        statusElement.style.backgroundColor = '#10b981';
    } else if (hour >= 12.5 && hour < 13) {
        statusElement.textContent = 'پایان معاملات';
        statusElement.style.backgroundColor = '#f59e0b';
    } else {
        statusElement.textContent = 'بازار بسته است';
        statusElement.style.backgroundColor = '#ef4444';
    }
}

// ============================================================================
// ۵. توابع ابزاری
// ============================================================================

/**
 * تنظیم رویدادهای صفحه
 */
function setupEventListeners() {
    // جستجو
    document.getElementById('searchInput').addEventListener('input', debounce(updateMarketDisplay, 300));
    
    // فیلتر بازار
    document.getElementById('marketFilter').addEventListener('change', (e) => {
        currentMarket = e.target.value;
        updateMarketDisplay();
    });
    
    // مرتب‌سازی
    document.getElementById('sortFilter').addEventListener('change', (e) => {
        currentSort = e.target.value;
        updateMarketDisplay();
    });
    
    // دکمه بروزرسانی
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        showNotification('در حال بروزرسانی داده‌ها...', 'info');
        await dataService.updateAllMarketData();
        updateMarketDisplay();
        showNotification('داده‌ها بروزرسانی شدند', 'success');
    });
    
    // فیلترهای سریع
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            // حذف کلاس active از همه
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            // اضافه کردن به المان کلیک شده
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            updateMarketDisplay();
        });
    });
    
    // بستن مودال
    document.getElementById('closeModal').addEventListener('click', closeDetailModal);
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('detailModal')) {
            closeDetailModal();
        }
    });
    
    // دکمه‌های داخل مودال
    document.getElementById('addToFavorite').addEventListener('click', () => {
        const symbolId = document.querySelector('.symbol-card:hover')?.dataset.id;
        if (symbolId) toggleFavorite(symbolId);
    });
    
    // کلید Escape برای بستن مودال
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailModal();
        }
    });
}

/**
 * شروع به‌روزرسانی خودکار
 */
function startAutoRefresh() {
    // به‌روزرسانی زمان هر ثانیه
    setInterval(updateMarketStatus, 1000);
    
    // به‌روزرسانی داده‌ها هر 2 دقیقه
    setInterval(async () => {
        if (!document.getElementById('detailModal').classList.contains('hidden')) {
            return; // اگر مودال باز است، به‌روزرسانی نکن
        }
        
        await dataService.updateAllMarketData();
        updateMarketDisplay();
        console.log('به‌روزرسانی خودکار انجام شد');
    }, 120000); // 120 ثانیه
}

/**
 * نمایش نوتیفیکیشن
 */
function showNotification(message, type = 'info') {
    // ایجاد المان نوتیفیکیشن
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-circle' : 'info'}"></i>
        <span>${message}</span>
    `;
    
    // اضافه کردن به صفحه
    document.body.appendChild(notification);
    lucide.createIcons();
    
    // حذف خودکار بعد از 3 ثانیه
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * تابع debounce برای بهینه‌سازی جستجو
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// ۶. شروع برنامه
// ============================================================================

// وقتی صفحه کامل بارگذاری شد
document.addEventListener('DOMContentLoaded', initApp);

// برای استفاده در رویدادهای onclick
window.showSymbolDetails = showSymbolDetails;
window.toggleFavorite = toggleFavorite;
window.closeDetailModal = closeDetailModal;
window.showSymbolAnalysis = function(symbolId) {
    // این تابع می‌تواند برای نمایش تحلیل پیشرفته توسعه یابد
    showNotification('تحلیل پیشرفته در نسخه‌های بعدی اضافه خواهد شد', 'info');
};
