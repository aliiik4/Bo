// analysisEngine.js - موتور تحلیل تکنیکال و بنیادی

// ============================================================================
// ۱. توابع تحلیل تکنیکال
// ============================================================================

/**
 * محاسبه میانگین متحرک ساده (SMA)
 */
function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
}

/**
 * تشخیص روند بر اساس موقعیت قیمت نسبت به میانگین‌های متحرک
 */
function analyzeTrend(currentPrice, ma20, ma50) {
    if (!ma20 || !ma50) return 'خنثی';
    
    if (currentPrice > ma20 && ma20 > ma50) {
        return 'صعودی قوی';
    } else if (currentPrice > ma20) {
        return 'صعودی';
    } else if (currentPrice < ma20 && ma20 < ma50) {
        return 'نزولی قوی';
    } else if (currentPrice < ma20) {
        return 'نزولی';
    } else {
        return 'خنثی';
    }
}

/**
 * محاسبه نقاط حمایت و مقاومت ساده
 */
function calculateSupportResistance(highPrices, lowPrices, currentPrice) {
    if (highPrices.length < 5 || lowPrices.length < 5) {
        return { support: currentPrice * 0.95, resistance: currentPrice * 1.05 };
    }
    
    const avgHigh = highPrices.reduce((a, b) => a + b, 0) / highPrices.length;
    const avgLow = lowPrices.reduce((a, b) => a + b, 0) / lowPrices.length;
    
    return {
        support: Math.min(avgLow, currentPrice * 0.97),
        resistance: Math.max(avgHigh, currentPrice * 1.03)
    };
}

/**
 * تحلیل حجم معاملات
 */
function analyzeVolume(currentVolume, avgVolume) {
    if (!avgVolume) return 'معمولی';
    
    const ratio = currentVolume / avgVolume;
    
    if (ratio > 2.5) return 'بسیار بالا';
    if (ratio > 1.8) return 'بالا';
    if (ratio < 0.5) return 'بسیار پایین';
    if (ratio < 0.8) return 'پایین';
    
    return 'معمولی';
}

/**
 * تحلیل جریان پول حقیقی
 */
function analyzeMoneyFlow(buyIndividual, sellIndividual, volume) {
    if (volume === 0) return 'تعریف نشده';
    
    const netFlow = buyIndividual - sellIndividual;
    const flowRatio = netFlow / volume;
    
    if (flowRatio > 0.3) return 'ورود قوی پول';
    if (flowRatio > 0.1) return 'ورود پول';
    if (flowRatio < -0.3) return 'خروج قوی پول';
    if (flowRatio < -0.1) return 'خروج پول';
    
    return 'متوازن';
}

// ============================================================================
// ۲. توابع تحلیل بنیادی
// ============================================================================

/**
 * ارزیابی نسبت P/E
 */
function evaluatePE(peRatio, industryAvg = 8) {
    if (!peRatio || peRatio <= 0) return 'تعریف نشده';
    
    const deviation = (peRatio - industryAvg) / industryAvg * 100;
    
    if (peRatio < industryAvg * 0.7) return 'بسیار ارزان';
    if (peRatio < industryAvg * 0.9) return 'ارزان';
    if (peRatio > industryAvg * 1.3) return 'گران';
    if (peRatio > industryAvg * 1.1) return 'نسبتا گران';
    
    return 'منصفانه';
}

/**
 * تحلیل قدرت بنیادی بر اساس چند فاکتور
 */
function analyzeFundamentalStrength(eps, pe, marketCap) {
    let score = 0;
    let factors = [];
    
    // ارزیابی EPS
    if (eps > 1000) {
        score += 2;
        factors.push('EPS عالی');
    } else if (eps > 500) {
        score += 1;
        factors.push('EPS خوب');
    } else if (eps < 100) {
        score -= 1;
        factors.push('EPS ضعیف');
    }
    
    // ارزیابی P/E
    if (pe > 0 && pe < 6) {
        score += 2;
        factors.push('P/E جذاب');
    } else if (pe > 0 && pe < 10) {
        score += 1;
        factors.push('P/E مناسب');
    } else if (pe > 15) {
        score -= 1;
        factors.push('P/E بالا');
    }
    
    // ارزیابی ارزش بازار
    if (marketCap > 1000000000000) { // بیش از 1000 میلیارد تومان
        score += 1;
        factors.push('شرکت بزرگ');
    }
    
    // نتیجه‌گیری نهایی
    if (score >= 3) return { strength: 'قوی', score, factors };
    if (score >= 1) return { strength: 'متوسط', score, factors };
    if (score >= -1) return { strength: 'ضعیف', score, factors };
    return { strength: 'بسیار ضعیف', score, factors };
}

// ============================================================================
// ۳. توابع سیگنال‌دهی
// ============================================================================

/**
 * تولید سیگنال ترکیبی بر اساس تحلیل‌های تکنیکال و بنیادی
 */
function generateSignal(symbolData, technicalAnalysis, fundamentalAnalysis) {
    let signal = 'HOLD'; // پیش‌فرض: نگهداری
    let confidence = 50; // درصد اطمینان
    let reasons = [];
    
    // بررسی فاکتورهای تکنیکال
    if (technicalAnalysis.trend === 'صعودی قوی') {
        confidence += 20;
        reasons.push('روند صعودی قوی');
    } else if (technicalAnalysis.trend === 'نزولی قوی') {
        confidence -= 20;
        reasons.push('روند نزولی قوی');
    }
    
    if (technicalAnalysis.volume === 'بسیار بالا') {
        confidence += 10;
        reasons.push('حجم معاملات بسیار بالا');
    }
    
    // بررسی فاکتورهای بنیادی
    if (fundamentalAnalysis.strength === 'قوی') {
        confidence += 15;
        reasons.push('بنیاد قوی');
    } else if (fundamentalAnalysis.strength === 'ضعیف') {
        confidence -= 10;
        reasons.push('بنیاد ضعیف');
    }
    
    // بررسی جریان پول
    if (technicalAnalysis.moneyFlow === 'ورود قوی پول') {
        confidence += 15;
        reasons.push('ورود قوی پول حقیقی');
    } else if (technicalAnalysis.moneyFlow === 'خروج قوی پول') {
        confidence -= 15;
        reasons.push('خروج قوی پول حقیقی');
    }
    
    // محدود کردن دامنه اطمینان
    confidence = Math.max(10, Math.min(95, confidence));
    
    // تصمیم‌گیری نهایی
    if (confidence >= 70) {
        signal = symbolData.changePercent > 0 ? 'STRONG_BUY' : 'STRONG_SELL';
    } else if (confidence >= 60) {
        signal = symbolData.changePercent > 0 ? 'BUY' : 'SELL';
    } else if (confidence <= 30) {
        signal = 'AVOID';
    }
    
    return {
        signal,
        confidence,
        reasons: reasons.slice(0, 3), // فقط ۳ دلیل اصلی
        timestamp: new Date()
    };
}

/**
 * تحلیل جامع یک نماد
 */
function performCompleteAnalysis(symbolData, historicalData = []) {
    // استخراج داده‌های تاریخی برای تحلیل
    const prices = historicalData.map(h => h.price) || [symbolData.lastPrice];
    const volumes = historicalData.map(h => h.volume) || [symbolData.volume];
    const highs = historicalData.map(h => h.high) || [symbolData.high];
    const lows = historicalData.map(h => h.low) || [symbolData.low];
    
    // تحلیل تکنیکال
    const ma20 = calculateSMA(prices, 20);
    const ma50 = calculateSMA(prices, 50);
    const trend = analyzeTrend(symbolData.lastPrice, ma20, ma50);
    const volumeAnalysis = analyzeVolume(symbolData.volume, calculateSMA(volumes, 20));
    const { support, resistance } = calculateSupportResistance(highs, lows, symbolData.lastPrice);
    const moneyFlow = analyzeMoneyFlow(
        symbolData.buyIndividualVolume, 
        symbolData.sellIndividualVolume, 
        symbolData.volume
    );
    
    const technical = {
        trend,
        ma20: ma20 ? Math.round(ma20) : null,
        ma50: ma50 ? Math.round(ma50) : null,
        volumeStatus: volumeAnalysis,
        support: Math.round(support),
        resistance: Math.round(resistance),
        moneyFlow
    };
    
    // تحلیل بنیادی
    const peEvaluation = evaluatePE(symbolData.pe);
    const fundamental = analyzeFundamentalStrength(symbolData.eps, symbolData.pe, symbolData.marketCap);
    
    // تولید سیگنال
    const signal = generateSignal(symbolData, technical, fundamental);
    
    return {
        technical,
        fundamental: {
            ...fundamental,
            peEvaluation
        },
        signal,
        summary: `روند ${trend} | ${moneyFlow} | بنیاد ${fundamental.strength}`
    };
}

// ============================================================================
// ۴. توابع ابزاری
// ============================================================================

/**
 * تولید داده‌های تاریخی نمونه برای نمودار
 */
function generateSampleChartData(symbolData, days = 30) {
    const data = [];
    let price = symbolData.previousClose || symbolData.lastPrice * 0.95;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // ایجاد نوسان طبیعی
        const change = (Math.random() - 0.5) * 0.04; // ۴٪ نوسان روزانه
        price = price * (1 + change);
        
        // ایجاد high و low
        const high = price * (1 + Math.random() * 0.02);
        const low = price * (1 - Math.random() * 0.02);
        
        data.push({
            date: date.toISOString().split('T')[0],
            price: parseFloat(price.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            volume: Math.round(symbolData.volume * (0.5 + Math.random() * 1))
        });
    }
    
    // آخرین نقطه برابر با قیمت فعلی
    if (data.length > 0) {
        data[data.length - 1].price = symbolData.lastPrice;
    }
    
    return data;
}

/**
 * فرمت‌کردن اعداد برای نمایش
 */
function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '--';
    
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * دریافت رنگ بر اساس تغییرات
 */
function getChangeColor(changePercent) {
    if (changePercent > 0) return '#10b981'; // سبز
    if (changePercent < 0) return '#ef4444'; // قرمز
    return '#94a3b8'; // خاکستری
}

// ============================================================================
// ۵. صادر کردن توابع
// ============================================================================
window.analysisEngine = {
    performCompleteAnalysis,
    generateSampleChartData,
    formatNumber,
    getChangeColor,
    calculateSMA,
    analyzeTrend
};
