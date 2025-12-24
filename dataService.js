// dataService.js - مدیریت داده‌ها و ارتباط با API

// ============================================================================
// ۱. تنظیمات اولیه و کلیدهای API
// ============================================================================
const API_CONFIG = {
    // 🔑 کلید API رایگان بورس ایران (دریافت از https://brsapi.ir)
    // شما باید در این وب‌سایت ثبت‌نام کرده و کلید رایگان دریافت کنید
    BOURSE_API_KEY: 'BsU5AwL7inTyGmTCzyV3C3mEFBlFtLRY', // جایگزین کنید
    BOURSE_BASE_URL: 'https://BrsApi.ir/Api/Tsetmc',

    // آدرس API نمونه برای رمزارزها (در آینده می‌توانید از CoinGecko یا Binance استفاده کنید)
    CRYPTO_SAMPLE_DATA: './sampleCryptoData.json' // فایل نمونه داخلی
};

// ============================================================================
// ۲. ذخیره‌سازی داده‌ها
// ============================================================================
let marketData = {
    bourse: [],      // داده‌های بورس ایران
    crypto: [],      // داده‌های رمزارزها (نمونه)
    favorites: new Set(), // نمادهای مورد علاقه
    lastUpdate: null      // زمان آخرین به‌روزرسانی
};

// ============================================================================
// ۳. توابع اصلی دریافت داده
// ============================================================================

/**
 * دریافت داده‌های لحظه‌ای بورس ایران از API رایگان
 */
async function fetchBourseData() {
    console.log('دریافت داده‌های بورس از API...');
    
    try {
        // اگر کلید API را تنظیم نکرده‌اید، از داده‌های نمونه استفاده می‌کند
        if (API_CONFIG.BOURSE_API_KEY === 'YOUR_FREE_API_KEY_HERE') {
            console.warn('⚠️ لطفا کلید API رایگان خود را از brsapi.ir دریافت و در کد جایگذاری کنید.');
            return generateSampleBourseData();
        }

        const url = `${API_CONFIG.BOURSE_BASE_URL}/AllSymbols.php?key=${API_CONFIG.BOURSE_API_KEY}&type=1`;
        const response = await axios.get(url, {
            timeout: 10000, // 10 ثانیه timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.status === 200 && response.data) {
            console.log(`✅ ${response.data.length} نماد بورسی دریافت شد`);
            return processBourseData(response.data);
        } else {
            throw new Error('پاسخ غیرمنتظره از API');
        }
        
    } catch (error) {
        console.error('❌ خطا در دریافت داده‌های بورس:', error.message);
        // در صورت خطا، داده‌های نمونه برگردانده می‌شود
        return generateSampleBourseData();
    }
}

/**
 * پردازش داده‌های خام بورس و تبدیل به فرمت قابل استفاده
 */
function processBourseData(rawData) {
    return rawData.map(item => ({
        // اطلاعات اصلی
        id: item.id || item.l18,
        symbol: item.l18 || 'نامعلوم',
        name: item.l30 || 'نامعلوم',
        isin: item.isin || '',
        
        // اطلاعات قیمتی
        lastPrice: parseFloat(item.pl) || 0,
        closePrice: parseFloat(item.pc) || 0,
        previousClose: parseFloat(item.py) || 0,
        high: parseFloat(item.pmax) || 0,
        low: parseFloat(item.pmin) || 0,
        firstPrice: parseFloat(item.pf) || 0,
        
        // تغییرات
        change: parseFloat(item.plc) || 0,
        changePercent: parseFloat(item.plp) || 0,
        
        // حجم و ارزش
        volume: parseInt(item.tvol) || 0,
        value: parseInt(item.tval) || 0,
        tradeCount: parseInt(item.tno) || 0,
        
        // حقیقی/حقوقی
        buyIndividualVolume: parseInt(item.Buy_I_Volume) || 0,
        sellIndividualVolume: parseInt(item.Sell_I_Volume) || 0,
        buyLegalVolume: parseInt(item.Buy_N_Volume) || 0,
        sellLegalVolume: parseInt(item.Sell_N_Volume) || 0,
        
        // سفارشات
        buyOrders: [
            { price: parseFloat(item.pd1), volume: parseInt(item.qd1) },
            { price: parseFloat(item.pd2), volume: parseInt(item.qd2) },
            { price: parseFloat(item.pd3), volume: parseInt(item.qd3) },
            { price: parseFloat(item.pd4), volume: parseInt(item.qd4) },
            { price: parseFloat(item.pd5), volume: parseInt(item.qd5) }
        ],
        
        // اطلاعات بنیادی
        eps: parseFloat(item.eps) || 0,
        pe: parseFloat(item.pe) || 0,
        marketCap: parseInt(item.mv) || 0,
        
        // متادیتا
        market: item.cs_id < 60 ? 'tehran' : 'farabourse',
        industry: item.cs || 'نامشخص',
        updateTime: item.time || new Date().toLocaleTimeString('fa-IR')
    }));
}

/**
 * دریافت داده‌های نمونه رمزارز (در این نسخه نمونه)
 */
async function fetchCryptoData() {
    console.log('دریافت داده‌های نمونه رمزارز...');
    
    // در این نسخه از داده‌های نمونه استفاده می‌شود
    // در نسخه‌های بعدی می‌توانید از CoinGecko API استفاده کنید
    return generateSampleCryptoData();
}

/**
 * به‌روزرسانی کلیه داده‌های بازار
 */
async function updateAllMarketData() {
    console.log('شروع به‌روزرسانی داده‌های بازار...');
    
    try {
        const [bourseData, cryptoData] = await Promise.all([
            fetchBourseData(),
            fetchCryptoData()
        ]);
        
        marketData.bourse = bourseData;
        marketData.crypto = cryptoData;
        marketData.lastUpdate = new Date();
        
        console.log(`✅ به‌روزرسانی کامل شد. بورس: ${bourseData.length} نماد، رمزارز: ${cryptoData.length} نماد`);
        return true;
        
    } catch (error) {
        console.error('❌ خطا در به‌روزرسانی داده‌ها:', error);
        return false;
    }
}

/**
 * فیلتر کردن داده‌ها بر اساس معیارهای مختلف
 */
function filterMarketData(data, options = {}) {
    let filtered = [...data];
    
    // فیلتر بر اساس نوع بازار
    if (options.market && options.market !== 'all') {
        filtered = filtered.filter(item => item.market === options.market);
    }
    
    // فیلتر بر اساس جستجو
    if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
            item.symbol.toLowerCase().includes(query) || 
            item.name.toLowerCase().includes(query)
        );
    }
    
    // فیلتر بر اساس تغییرات
    if (options.changeFilter === 'positive') {
        filtered = filtered.filter(item => item.changePercent > 0);
    } else if (options.changeFilter === 'negative') {
        filtered = filtered.filter(item => item.changePercent < 0);
    }
    
    // فیلتر بر اساس علاقه‌مندی‌ها
    if (options.favoritesOnly) {
        filtered = filtered.filter(item => marketData.favorites.has(item.id));
    }
    
    // مرتب‌سازی
    if (options.sortBy === 'volume') {
        filtered.sort((a, b) => b.volume - a.volume);
    } else if (options.sortBy === 'change') {
        filtered.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    } else if (options.sortBy === 'name') {
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol, 'fa'));
    }
    
    return filtered;
}

// ============================================================================
// ۴. توابع کمکی - تولید داده‌های نمونه
// ============================================================================

/**
 * تولید داده‌های نمونه برای بورس (زمانی که API در دسترس نیست)
 */
function generateSampleBourseData() {
    console.log('تولید داده‌های نمونه بورس...');
    
    const symbols = [
        { symbol: 'شتران', name: 'پالایش نفت تهران', market: 'tehran' },
        { symbol: 'فولاد', name: 'فولاد مبارکه اصفهان', market: 'tehran' },
        { symbol: 'خساپا', name: 'ایران خودرو', market: 'tehran' },
        { symbol: 'وبصادر', name: 'بانک صادرات ایران', market: 'tehran' },
        { symbol: 'شپنا', name: 'پالایش نفت اصفهان', market: 'tehran' },
        { symbol: 'فملی', name: 'صنایع مس ایران', market: 'farabourse' },
        { symbol: 'کگل', name: 'گل گهر', market: 'farabourse' },
        { symbol: 'شاراک', name: 'ایران کیش', market: 'farabourse' },
        { symbol: 'وغدیر', name: 'قند گلسران', market: 'farabourse' },
        { symbol: 'شپدیس', name: 'پدیده شریف', market: 'farabourse' }
    ];
    
    return symbols.map((item, index) => {
        const basePrice = 1000 + Math.random() * 50000;
        const changePercent = (Math.random() - 0.5) * 10; // تغییر بین -۵٪ تا +۵٪
        const change = basePrice * (changePercent / 100);
        
        return {
            id: `sample_${index}`,
            symbol: item.symbol,
            name: item.name,
            lastPrice: Math.round(basePrice),
            closePrice: Math.round(basePrice - change * 0.3),
            previousClose: Math.round(basePrice - change),
            high: Math.round(basePrice * (1 + Math.random() * 0.05)),
            low: Math.round(basePrice * (1 - Math.random() * 0.05)),
            change: Math.round(change),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: Math.round(1000000 + Math.random() * 10000000),
            value: Math.round(basePrice * (1000000 + Math.random() * 10000000)),
            buyIndividualVolume: Math.round(Math.random() * 500000),
            sellIndividualVolume: Math.round(Math.random() * 500000),
            market: item.market,
            industry: ['پالایشی', 'فلزات', 'خودرو', 'بانک', 'قند'][index % 5],
            updateTime: new Date().toLocaleTimeString('fa-IR'),
            eps: Math.random() * 1000,
            pe: Math.random() * 20,
            marketCap: Math.round(basePrice * 10000000)
        };
    });
}

/**
 * تولید داده‌های نمونه برای رمزارزها
 */
function generateSampleCryptoData() {
    const cryptos = [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'BNB', name: 'Binance Coin' },
        { symbol: 'XRP', name: 'Ripple' },
        { symbol: 'ADA', name: 'Cardano' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'DOT', name: 'Polkadot' },
        { symbol: 'DOGE', name: 'Dogecoin' },
        { symbol: 'AVAX', name: 'Avalanche' },
        { symbol: 'LINK', name: 'Chainlink' }
    ];
    
    return cryptos.map((crypto, index) => {
        const basePrice = 10 + Math.random() * 100000;
        const changePercent = (Math.random() - 0.5) * 15;
        
        return {
            id: `crypto_${crypto.symbol}`,
            symbol: crypto.symbol,
            name: crypto.name,
            lastPrice: parseFloat(basePrice.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            change: parseFloat((basePrice * changePercent / 100).toFixed(2)),
            volume: parseFloat((basePrice * (10000 + Math.random() * 100000)).toFixed(2)),
            marketCap: parseFloat((basePrice * (1000000 + Math.random() * 10000000)).toFixed(2)),
            market: 'crypto',
            updateTime: new Date().toLocaleTimeString('fa-IR')
        };
    });
}

// ============================================================================
// ۵. صادر کردن توابع برای استفاده در فایل‌های دیگر
// ============================================================================
window.dataService = {
    updateAllMarketData,
    filterMarketData,
    marketData,
    API_CONFIG
};
