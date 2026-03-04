import { getW } from '../constants/sectors';

// ═══════════════════════════════════════════════════════════════
// COMPOSITE SCORE ENGINE — 13 Tech + Candlesticks
// ═══════════════════════════════════════════════════════════════

export function compositeScore(d, sector) {
    const w = getW(sector);
    const sigs = [];
    const push = (name, bull, base, mul = 1) => sigs.push({ name, bull, w: +(base * mul).toFixed(2) });

    if (d.rsi != null) { const b = d.rsi < 30 || d.rsi > 70 ? 2 : 1; push("RSI", d.rsi < 30 ? true : d.rsi > 70 ? false : d.rsi < 45, b, w.rsi); }
    if (d.macd != null && d.sig != null) { push("MACD", d.macd > d.sig, 2, w.macd); push("MACD Zero", d.macd > 0, 1, w.macd * 0.5); }
    if (d.stochK != null) push("Stoch", d.stochK < 20 ? true : d.stochK > 80 ? false : d.stochK < 50, d.stochK < 20 || d.stochK > 80 ? 2 : 1, w.stoch);
    if (d.willr != null) push("W%R", d.willr < -80 ? true : d.willr > -20 ? false : d.willr < -50, d.willr < -80 || d.willr > -20 ? 2 : 1, w.willr);
    if (d.cci != null) push("CCI", d.cci < -100 ? true : d.cci > 100 ? false : d.cci < 0, d.cci < -100 || d.cci > 100 ? 2 : 1, w.cci);
    if (d.price && d.sma20) push("SMA20", d.price > d.sma20, 1.5, w.sma);
    if (d.price && d.sma50) push("SMA50", d.price > d.sma50, 2, w.sma);
    if (d.sma20 && d.sma50) push("SMA Trend", d.sma20 > d.sma50, 1.5, w.sma * 0.7);
    if (d.price && d.bb) push("BB", d.price < d.bb.lower ? true : d.price > d.bb.upper ? false : d.price < d.bb.mid, d.price < d.bb.lower || d.price > d.bb.upper ? 2 : 1, w.bb);
    if (d.volRatio) push("Value Vol.", d.volRatio > 1.5, d.volRatio > 2.5 ? 3 : 1.5, w.vol);
    if (d.roc != null) push("ROC", d.roc > 0, 1, w.roc);
    if (d.obvTrend) push("OBV", d.obvTrend === "UP", 1.5, w.obv);
    if (d.cross === "GOLDEN") push("✨Golden", true, 3, w.cross);
    else if (d.cross === "DEATH") push("💀Death", false, 3, w.cross);
    if (d.candleBull > 0) push("🕯️ Candle Bull", true, Math.min(d.candleBull, 3), w.candle);
    if (d.candleBear > 0) push("🕯️ Candle Bear", false, Math.min(d.candleBear, 3), w.candle);
    if (d.minerviniPass) push("📐 Minervini", true, 3, 1.5);
    if (d.vcpDetected) push("🔥 VCP", true, 2, 1.2);

    const bullW = sigs.filter(s => s.bull).reduce((a, s) => a + s.w, 0);
    const totW = sigs.reduce((a, s) => a + s.w, 0);
    return { score: Math.max(0, Math.min(100, totW > 0 ? Math.round(26 + (bullW / totW) * 74) : 50)), signals: sigs };
}

export const scoreRec = s => s >= 85 ? "STRONG BUY" : s >= 65 ? "BUY" : s >= 40 ? "NEUTRAL" : s >= 20 ? "SELL" : "STRONG SELL";

export function calcTargets(price, score, atr) {
    const bias = 1 + (score - 50) / 600, a = atr || price * 0.02;
    return { short: +(price + a * 3 * bias).toFixed(2), mid: +(price + a * 7 * bias).toFixed(2), long: +(price + a * 18 * bias).toFixed(2), sl: +(price - a * 2).toFixed(2) };
}
