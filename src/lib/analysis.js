import { I } from './indicators';

// ═══════════════════════════════════════════════════════════════
// 15 CANDLESTICK PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════

export function candlePatterns(opens, highs, lows, closes) {
    const n = closes.length;
    if (n < 3) return { patterns: [], bullScore: 0, bearScore: 0 };

    const patterns = [];
    const [o0, o1, o2] = [opens[n - 3], opens[n - 2], opens[n - 1]];
    const [h0, h1, h2] = [highs[n - 3], highs[n - 2], highs[n - 1]];
    const [l0, l1, l2] = [lows[n - 3], lows[n - 2], lows[n - 1]];
    const [c0, c1, c2] = [closes[n - 3], closes[n - 2], closes[n - 1]];

    const body = (o, c) => Math.abs(c - o);
    const range = (h, l) => h - l;
    const upperShadow = (o, h, c) => h - Math.max(o, c);
    const lowerShadow = (o, l, c) => Math.min(o, c) - l;
    const isBull = (o, c) => c > o;
    const isBear = (o, c) => c < o;

    const avgBody = (body(o0, c0) + body(o1, c1) + body(o2, c2)) / 3 || 1;

    // Bull patterns
    if (isBull(o2, c2) && body(o2, c2) * 2 < lowerShadow(o2, l2, c2) && upperShadow(o2, h2, c2) < body(o2, c2) * 0.5)
        patterns.push({ name: "🔨 Hammer", bull: true, strength: 2 });
    if (upperShadow(o2, h2, c2) > body(o2, c2) * 2 && lowerShadow(o2, l2, c2) < body(o2, c2) * 0.5 && isBull(o2, c2))
        patterns.push({ name: "🔨 Inverted Hammer", bull: true, strength: 1.5 });
    if (isBear(o1, c1) && isBull(o2, c2) && o2 < c1 && c2 > o1 && body(o2, c2) > body(o1, c1) * 1.1)
        patterns.push({ name: "🟢 Bullish Engulfing", bull: true, strength: 3 });
    if (isBear(o1, c1) && isBull(o2, c2) && o2 < l1 && c2 > (o1 + c1) / 2 && c2 < o1)
        patterns.push({ name: "📈 Piercing Line", bull: true, strength: 2.5 });
    if (isBear(o0, c0) && body(o1, c1) < avgBody * 0.4 && isBull(o2, c2) && c2 > (o0 + c0) / 2 && body(o0, c0) > avgBody * 0.8)
        patterns.push({ name: "⭐ Morning Star", bull: true, strength: 3 });
    if (isBull(o0, c0) && isBull(o1, c1) && isBull(o2, c2) && o1 > o0 && o1 < c0 && o2 > o1 && o2 < c1 && body(o0, c0) > avgBody * 0.7 && body(o1, c1) > avgBody * 0.7 && body(o2, c2) > avgBody * 0.7)
        patterns.push({ name: "⚔️ 3 White Soldiers", bull: true, strength: 3 });
    if (isBear(o1, c1) && body(o1, c1) > avgBody && Math.abs(c2 - o2) < body(o1, c1) * 0.5 && c2 > c1 && o2 > c1)
        patterns.push({ name: "🤱 Bullish Harami", bull: true, strength: 2 });
    if (Math.abs(l1 - l2) < (range(h2, l2) * 0.02) && isBear(o1, c1) && isBull(o2, c2))
        patterns.push({ name: "🔧 Tweezer Bottom", bull: true, strength: 2 });
    if (body(o1, c1) < range(h1, l1) * 0.1 && isBull(o2, c2) && c2 > h1)
        patterns.push({ name: "✨ Doji Bullish", bull: true, strength: 1.5 });

    // Bear patterns
    if (upperShadow(o2, h2, c2) > body(o2, c2) * 2 && lowerShadow(o2, l2, c2) < body(o2, c2) * 0.5 && isBear(o2, c2))
        patterns.push({ name: "💫 Shooting Star", bull: false, strength: 2 });
    if (isBull(o1, c1) && isBear(o2, c2) && o2 > c1 && c2 < o1 && body(o2, c2) > body(o1, c1) * 1.1)
        patterns.push({ name: "🔴 Bearish Engulfing", bull: false, strength: 3 });
    if (isBull(o1, c1) && isBear(o2, c2) && o2 > h1 && c2 < (o1 + c1) / 2 && c2 > c1)
        patterns.push({ name: "☁️ Dark Cloud Cover", bull: false, strength: 2.5 });
    if (isBull(o0, c0) && body(o1, c1) < avgBody * 0.4 && isBear(o2, c2) && c2 < (o0 + c0) / 2 && body(o0, c0) > avgBody * 0.8)
        patterns.push({ name: "🌆 Evening Star", bull: false, strength: 3 });
    if (isBear(o0, c0) && isBear(o1, c1) && isBear(o2, c2) && o1 < o0 && o1 > c0 && o2 < o1 && o2 > c1 && body(o0, c0) > avgBody * 0.7 && body(o1, c1) > avgBody * 0.7 && body(o2, c2) > avgBody * 0.7)
        patterns.push({ name: "🦅 3 Black Crows", bull: false, strength: 3 });
    if (isBull(o1, c1) && body(o1, c1) > avgBody && Math.abs(c2 - o2) < body(o1, c1) * 0.5 && c2 < c1 && o2 < c1)
        patterns.push({ name: "🤱 Bearish Harami", bull: false, strength: 2 });

    const bullScore = patterns.filter(p => p.bull).reduce((a, p) => a + p.strength, 0);
    const bearScore = patterns.filter(p => !p.bull).reduce((a, p) => a + p.strength, 0);
    return { patterns, bullScore, bearScore };
}

// ═══════════════════════════════════════════════════════════════
// MINERVINI TREND TEMPLATE (8 CONDITIONS)
// ═══════════════════════════════════════════════════════════════

export function minerviniTemplate(closes, highs, price, sma50, sma150, sma200, high52w, low52w) {
    if (!sma50 || !sma150 || !sma200 || !price) return { score: 0, conditions: [], pass: false };

    const sma200Old = I.sma(closes.slice(0, -20), Math.min(200, closes.length - 20));
    const sma200Rising = sma200Old ? sma200 > sma200Old : false;

    const conditions = [
        { label: "Price > SMA150", pass: price > sma150, weight: 1 },
        { label: "Price > SMA200", pass: price > sma200, weight: 1 },
        { label: "SMA150 > SMA200", pass: sma150 > sma200, weight: 1 },
        { label: "SMA200 Rising", pass: sma200Rising, weight: 1.5 },
        { label: "SMA50 > SMA150", pass: sma50 > sma150, weight: 1 },
        { label: "SMA50 > SMA200", pass: sma50 > sma200, weight: 1 },
        { label: "30%+ From Low", pass: high52w ? price > low52w * 1.3 : false, weight: 1.5 },
        { label: "Within 25% of Peak", pass: high52w ? price >= high52w * 0.75 : false, weight: 1 },
    ];

    const passCount = conditions.filter(c => c.pass).length;
    const score = Math.round(passCount / conditions.length * 100);
    const pass = passCount >= 7;

    return { score, conditions, pass, passCount, total: conditions.length };
}

// ═══════════════════════════════════════════════════════════════
// WEINSTEIN STAGE ANALYSIS (Stage 1-4)
// ═══════════════════════════════════════════════════════════════

export function weinsteinStage(price, sma30, sma30Trend, sma200) {
    if (!price || !sma30) return { stage: 0, label: "Insufficient Data", color: "#6b7280" };
    if (price > sma30 && sma30Trend > 0 && (!sma200 || price > sma200))
        return { stage: 2, label: "Stage 2 — Accumulation 🚀", color: "#10b981" };
    if (price < sma30 && sma30Trend < 0)
        return { stage: 4, label: "Stage 4 — Capitulation 🔻", color: "#ef4444" };
    if (price > sma30 && Math.abs(sma30Trend) < 0.5)
        return { stage: 3, label: "Stage 3 — Distribution ⚠️", color: "#f59e0b" };
    return { stage: 1, label: "Stage 1 — Basing 📦", color: "#94a3b8" };
}

// ═══════════════════════════════════════════════════════════════
// RS RATING (Relative Strength vs SPY, 0-99)
// ═══════════════════════════════════════════════════════════════

export function calcRsRating(closes, spyCloses) {
    if (!closes || !spyCloses || closes.length < 20 || spyCloses.length < 20) return null;
    const perf = arr => (arr[arr.length - 1] - arr[0]) / arr[0] * 100;
    const stockPerf = perf(closes.slice(-60));
    const spyPerf = perf(spyCloses.slice(-60));
    const diff = stockPerf - spyPerf;
    const rs = Math.max(1, Math.min(99, Math.round(50 + diff)));
    return rs;
}

// ═══════════════════════════════════════════════════════════════
// VCP — VOLATILITY CONTRACTION PATTERN
// ═══════════════════════════════════════════════════════════════

export function detectVCP(closes, volumes) {
    if (closes.length < 30) return { isVCP: false, contractions: 0 };
    const bw = (p, n) => { const bb = I.bb(p, n); return bb ? (bb.upper - bb.lower) / bb.mid : null; };
    const bw1 = bw(closes, 20);
    const bw2 = bw(closes.slice(0, -5), 20);
    const bw3 = bw(closes.slice(0, -10), 20);
    const volAvg3 = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const volAvg20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volContracting = volAvg3 < volAvg20 * 0.8;
    let contractions = 0;
    if (bw1 && bw2 && bw1 < bw2) contractions++;
    if (bw2 && bw3 && bw2 < bw3) contractions++;
    const isVCP = contractions >= 1 && volContracting;
    return { isVCP, contractions, volContracting };
}
