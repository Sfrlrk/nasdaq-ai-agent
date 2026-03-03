import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// NASDAQ AI AGENT v4.0
// Features added after competitive analysis:
// ✅ 15 Candlestick Patterns (hackingthemarkets)
// ✅ Minervini Trend Template 8 Conditions (growth-stock-screener)
// ✅ Weinstein Stage Analysis (Stage 1-4)
// ✅ RS Rating (Relative Strength vs SPY)
// ✅ VCP (Volatility Contraction Pattern)
// ✅ News & Sentiment (Yahoo Finance News API)
// ✅ Fundamental Data — P/E, EPS, Market Cap, Beta
// ✅ 20+ Signals (13 Technical + 15 Patterns = Weighted Composite)
// ═══════════════════════════════════════════════════════════════

const SECTORS = {
  "🤖 Artificial Intel": { color: "#00d4ff", syms: ["NVDA", "PLTR", "AI", "IONQ", "BBAI", "SOUN", "PATH", "RBRK", "GFAI", "ARQQ"] },
  "💻 Big Tech / Cloud": { color: "#a78bfa", syms: ["AAPL", "MSFT", "META", "GOOGL", "AMZN", "ORCL", "CRM", "ADBE", "IBM", "TOST"] },
  "⚡ Semiconductors": { color: "#fbbf24", syms: ["AMD", "INTC", "QCOM", "AVGO", "MRVL", "KLAC", "LRCX", "AMAT", "TXN", "MU", "SMCI", "ON"] },
  "☁️ Cloud & SaaS": { color: "#34d399", syms: ["SNOW", "DDOG", "ZS", "CRWD", "NET", "MDB", "CFLT", "OKTA", "HUBS", "BILL", "DOCN"] },
  "💰 Fintech / Neo": { color: "#f472b6", syms: ["SOFI", "UPST", "AFRM", "COIN", "HOOD", "NU", "PYPL", "SQ", "DAVE", "LMND"] },
  "🚗 EV & Energy": { color: "#86efac", syms: ["RIVN", "LCID", "NIO", "XPEV", "LI", "CHPT", "PLUG", "FSLR", "ENPH", "SEDG", "TSLA"] },
  "🧬 Biotechnology": { color: "#fca5a5", syms: ["MRNA", "BNTX", "REGN", "VRTX", "GILD", "BIIB", "AMGN", "ILMN", "NTLA", "BEAM"] },
  "🚀 Space & Defense": { color: "#c4b5fd", syms: ["RKLB", "ASTS", "SPCE", "LUNR", "KTOS", "BWXT", "HII", "RDW"] },
  "📱 Consumer Tech": { color: "#fb923c", syms: ["NFLX", "SPOT", "UBER", "LYFT", "ABNB", "DASH", "DUOL", "RBLX", "PINS", "SNAP"] },
  "🖥️ Applied Hardware": { color: "#94a3b8", syms: ["DELL", "HPQ", "STX", "WDC", "PSTG", "NTAP", "ANET", "FFIV"] },
};
const PENNY_SYMS = ["MULN", "FCEL", "NKLA", "WKHS", "GOEV", "AEVA", "CLOV", "MMAT", "SNDL", "TELL", "IMPP", "NLSP", "ATER", "ABEV", "ACB", "TLRY", "CGC", "CRKN", "CLEU", "VERB", "ATXG", "CNET", "MEGL", "BFRI", "SPRC", "NCTY", "USEA", "LIXT", "HPNN", "QNRX"];
const SYM_SECTOR = {};
Object.entries(SECTORS).forEach(([s, { syms }]) => syms.forEach(sym => { SYM_SECTOR[sym] = s; }));

const SECTOR_WEIGHTS = {
  "🤖 Artificial Intel": { rsi: 1.2, macd: 2.0, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 1.5, bb: 1.2, vol: 1.5, obv: 1.5, roc: 1.8, cross: 2.5, candle: 1.5 },
  "💻 Big Tech / Cloud": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 2.0, bb: 1.0, vol: 1.0, obv: 1.5, roc: 1.2, cross: 2.5, candle: 1.0 },
  "⚡ Semiconductors": { rsi: 1.5, macd: 2.0, stoch: 1.2, willr: 1.2, cci: 1.2, sma: 1.5, bb: 1.5, vol: 2.0, obv: 1.5, roc: 1.5, cross: 3.0, candle: 1.5 },
  "☁️ Cloud & SaaS": { rsi: 1.0, macd: 1.8, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 1.8, bb: 1.0, vol: 1.2, obv: 2.0, roc: 1.5, cross: 2.5, candle: 1.0 },
  "💰 Fintech / Neo": { rsi: 1.5, macd: 2.0, stoch: 1.5, willr: 1.5, cci: 1.5, sma: 1.5, bb: 1.5, vol: 2.0, obv: 2.5, roc: 1.5, cross: 2.0, candle: 1.5 },
  "🚗 EV & Energy": { rsi: 2.0, macd: 1.5, stoch: 1.5, willr: 1.5, cci: 1.5, sma: 1.0, bb: 2.0, vol: 2.5, obv: 2.0, roc: 2.0, cross: 2.0, candle: 2.0 },
  "🧬 Biotechnology": { rsi: 2.5, macd: 1.5, stoch: 2.0, willr: 2.0, cci: 2.0, sma: 1.0, bb: 2.0, vol: 3.0, obv: 2.0, roc: 2.5, cross: 1.5, candle: 2.0 },
  "🚀 Space & Defense": { rsi: 1.5, macd: 2.0, stoch: 1.5, willr: 1.5, cci: 1.5, sma: 1.5, bb: 1.5, vol: 2.0, obv: 1.5, roc: 2.0, cross: 2.5, candle: 1.5 },
  "📱 Consumer Tech": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 2.0, bb: 1.5, vol: 1.5, obv: 1.5, roc: 1.5, cross: 2.0, candle: 1.0 },
  "🖥️ Applied Hardware": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 2.0, bb: 1.0, vol: 1.5, obv: 2.0, roc: 1.0, cross: 2.5, candle: 1.0 },
  "💎 Penny": { rsi: 2.0, macd: 1.5, stoch: 2.0, willr: 2.0, cci: 1.5, sma: 0.8, bb: 2.0, vol: 3.5, obv: 3.0, roc: 2.5, cross: 1.0, candle: 2.5 },
  "default": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 1.5, bb: 1.0, vol: 1.5, obv: 1.5, roc: 1.0, cross: 2.0, candle: 1.2 },
};
const getW = s => SECTOR_WEIGHTS[s] || SECTOR_WEIGHTS["default"];

// ═══════════════════════════════════════════════════════════════
// TECHNICAL INDICATORS
// ═══════════════════════════════════════════════════════════════
const I = {
  sma: (p, n) => p.length < n ? null : +(p.slice(-n).reduce((a, b) => a + b, 0) / n).toFixed(4),
  ema: (p, n) => { if (p.length < n) return null; const k = 2 / (n + 1); let e = p.slice(0, n).reduce((a, b) => a + b, 0) / n; for (let i = n; i < p.length; i++)e = p[i] * k + e * (1 - k); return +e.toFixed(4); },
  rsi: (p, n = 14) => { if (p.length < n + 1) return null; let g = 0, l = 0; for (let i = 1; i <= n; i++) { const d = p[i] - p[i - 1]; d > 0 ? g += d : l -= d; } let ag = g / n, al = l / n; for (let i = n + 1; i < p.length; i++) { const d = p[i] - p[i - 1]; ag = (ag * (n - 1) + Math.max(d, 0)) / n; al = (al * (n - 1) + Math.max(-d, 0)) / n; } return al === 0 ? 100 : +(100 - 100 / (1 + ag / al)).toFixed(2); },
  macd: (p) => { if (p.length < 26) return { macd: null, sig: null, hist: null }; const e12 = I.ema(p, 12), e26 = I.ema(p, 26); if (!e12 || !e26) return { macd: null, sig: null, hist: null }; const m = +(e12 - e26).toFixed(4), sig = +(m * 0.85 + m * 0.15).toFixed(4); return { macd: m, sig, hist: +(m - sig).toFixed(4) }; },
  bb: (p, n = 20) => { if (p.length < n) return null; const sl = p.slice(-n), avg = sl.reduce((a, b) => a + b, 0) / n, std = Math.sqrt(sl.reduce((a, b) => a + (b - avg) ** 2, 0) / n); return { upper: +(avg + 2 * std).toFixed(4), mid: +avg.toFixed(4), lower: +(avg - 2 * std).toFixed(4) }; },
  stoch: (h, l, c, k = 14) => { if (c.length < k) return { k: null }; const hh = Math.max(...h.slice(-k)), ll = Math.min(...l.slice(-k)); return { k: hh === ll ? 50 : +((c[c.length - 1] - ll) / (hh - ll) * 100).toFixed(2) }; },
  willr: (h, l, c, n = 14) => { if (c.length < n) return null; const hh = Math.max(...h.slice(-n)), ll = Math.min(...l.slice(-n)); return hh === ll ? -50 : +((hh - c[c.length - 1]) / (hh - ll) * -100).toFixed(2); },
  atr: (h, l, c, n = 14) => { if (c.length < n + 1) return null; const trs = []; for (let i = 1; i < c.length; i++)trs.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); return +(trs.slice(-n).reduce((a, b) => a + b, 0) / n).toFixed(4); },
  obv: (c, v) => { if (c.length < 2) return { val: null, trend: null }; let o = 0, p5 = 0; for (let i = 1; i < c.length; i++) { c[i] > c[i - 1] ? o += v[i] : c[i] < c[i - 1] ? o -= v[i] : 0; if (i === c.length - 6) p5 = o; } return { val: o, trend: o > p5 ? "UP" : "DOWN" }; },
  cci: (h, l, c, n = 20) => { if (c.length < n) return null; const tp = c.map((_, i) => (h[i] + l[i] + c[i]) / 3), sl = tp.slice(-n), avg = sl.reduce((a, b) => a + b, 0) / n, md = sl.reduce((a, b) => a + Math.abs(b - avg), 0) / n; return md === 0 ? 0 : +((tp[tp.length - 1] - avg) / (0.015 * md)).toFixed(2); },
  roc: (p, n = 10) => { if (p.length < n + 1) return null; return +((p[p.length - 1] - p[p.length - 1 - n]) / p[p.length - 1 - n] * 100).toFixed(2); },
  cross: (p) => { if (p.length < 52) return "NONE"; const s50n = I.sma(p, 50), s50p = I.sma(p.slice(0, -1), Math.min(50, p.length - 1)), s200n = I.sma(p, Math.min(200, p.length)); if (!s50n) return "NONE"; if (s200n && s50n > s200n && s50p && s50p <= s200n) return "GOLDEN"; if (s200n && s50n < s200n && s50p && s50p >= s200n) return "DEATH"; if (s200n && s50n > s200n) return "ABOVE"; return "NONE"; },
  pivots: (h, l, c) => { if (!h?.length) return { s1: null, s2: null, r1: null, r2: null }; const hh = Math.max(...h.slice(-14)), ll = Math.min(...l.slice(-14)), pivot = (hh + ll + c[c.length - 1]) / 3; return { s1: +(2 * pivot - hh).toFixed(3), s2: +(pivot - (hh - ll)).toFixed(3), r1: +(2 * pivot - ll).toFixed(3), r2: +(pivot + (hh - ll)).toFixed(3) }; },
};

// ═══════════════════════════════════════════════════════════════
// 15 CANDLESTICK PATTERN DETECTION (Inspired by hackingthemarkets)
// ═══════════════════════════════════════════════════════════════

function candlePatterns(opens, highs, lows, closes) {
  const n = closes.length;
  if (n < 3) return { patterns: [], bullScore: 0, bearScore: 0 };

  const patterns = [];
  // Son 3 mumu al (0=2 öncesi, 1=önceki, 2=son)
  const [o0, o1, o2] = [opens[n - 3], opens[n - 2], opens[n - 1]];
  const [h0, h1, h2] = [highs[n - 3], highs[n - 2], highs[n - 1]];
  const [l0, l1, l2] = [lows[n - 3], lows[n - 2], lows[n - 1]];
  const [c0, c1, c2] = [closes[n - 3], closes[n - 2], closes[n - 1]];

  // Gövde ve gölge hesaplama
  const body = (o, c) => Math.abs(c - o);
  const range = (h, l) => h - l;
  const upperShadow = (o, h, c) => h - Math.max(o, c);
  const lowerShadow = (o, l, c) => Math.min(o, c) - l;
  const isBull = (o, c) => c > o;
  const isBear = (o, c) => c < o;

  // Ortalama gövde (normalize için)
  const avgBody = (body(o0, c0) + body(o1, c1) + body(o2, c2)) / 3 || 1;

  // ── BOĞA FORMASYONLARI ─────────────────────────────────────
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
// Inspired by growth-stock-screener
// ═══════════════════════════════════════════════════════════════

function minerviniTemplate(closes, highs, price, sma50, sma150, sma200, high52w, low52w) {
  if (!sma50 || !sma150 || !sma200 || !price) return { score: 0, conditions: [], pass: false };

  // SMA200 trendi (son 20 gün)
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
  const pass = passCount >= 7; // 8'den 7+ geçince "Minervini Geçer"

  return { score, conditions, pass, passCount, total: conditions.length };
}

// ═══════════════════════════════════════════════════════════════
// WEINSTEIN STAGE ANALYSIS (Stage 1-4)
// ═══════════════════════════════════════════════════════════════

function weinsteinStage(price, sma30, sma30Trend, sma200) {
  if (!price || !sma30) return { stage: 0, label: "Insufficient Data", color: "#6b7280" };
  // Stage 1: Taban (SMA30 düz, fiyat etrafında)
  // Stage 2: Yükseliş (fiyat > SMA30, SMA30 yükseliyor)
  // Stage 3: Zirve (fiyat > SMA30 ama SMA30 düzleşiyor)
  // Stage 4: Düşüş (fiyat < SMA30, SMA30 düşüyor)
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

function calcRsRating(closes, spyCloses) {
  if (!closes || !spyCloses || closes.length < 20 || spyCloses.length < 20) return null;
  const perf = arr => (arr[arr.length - 1] - arr[0]) / arr[0] * 100;
  const stockPerf = perf(closes.slice(-60));
  const spyPerf = perf(spyCloses.slice(-60));
  // SPY'ı 50 olarak normalize et, göreceli güce göre 0-99 arasında dağıt
  const diff = stockPerf - spyPerf;
  const rs = Math.max(1, Math.min(99, Math.round(50 + diff)));
  return rs;
}

// ═══════════════════════════════════════════════════════════════
// VCP — VOLATILITY CONTRACTION PATTERN (Minervini)
// Tightening bands + decreasing volume = accumulation breakout
// ═══════════════════════════════════════════════════════════════

function detectVCP(closes, volumes) {
  if (closes.length < 30) return { isVCP: false, contractions: 0 };
  // Bollinger bant genişliği son 3 periyot karşılaştırması
  const bw = (p, n) => { const bb = I.bb(p, n); return bb ? (bb.upper - bb.lower) / bb.mid : null; };
  const bw1 = bw(closes, 20);
  const bw2 = bw(closes.slice(0, -5), 20);
  const bw3 = bw(closes.slice(0, -10), 20);
  const volAvg3 = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const volAvg20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volContracting = volAvg3 < volAvg20 * 0.8;
  // Bant daralıyor mu?
  let contractions = 0;
  if (bw1 && bw2 && bw1 < bw2) contractions++;
  if (bw2 && bw3 && bw2 < bw3) contractions++;
  const isVCP = contractions >= 1 && volContracting;
  return { isVCP, contractions, volContracting };
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITE SCORE ENGINE — 13 Tech + Candlesticks
// ═══════════════════════════════════════════════════════════════

function compositeScore(d, sector) {
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
  // 15 mum formasyonu bileşik sinyali
  if (d.candleBull > 0) push("🕯️ Candle Bull", true, Math.min(d.candleBull, 3), w.candle);
  if (d.candleBear > 0) push("🕯️ Candle Bear", false, Math.min(d.candleBear, 3), w.candle);
  // Minervini bonus
  if (d.minerviniPass) push("📐 Minervini", true, 3, 1.5);
  // VCP bonus
  if (d.vcpDetected) push("🔥 VCP", true, 2, 1.2);

  const bullW = sigs.filter(s => s.bull).reduce((a, s) => a + s.w, 0);
  const totW = sigs.reduce((a, s) => a + s.w, 0);
  return { score: Math.max(0, Math.min(100, totW > 0 ? Math.round(26 + (bullW / totW) * 74) : 50)), signals: sigs };
}

const scoreRec = s => s >= 75 ? "STRONG BUY" : s >= 62 ? "BUY" : s >= 45 ? "NEUTRAL" : s >= 32 ? "SELL" : "STRONG SELL";

function calcTargets(price, score, atr) {
  const bias = 1 + (score - 50) / 600, a = atr || price * 0.02;
  return { short: +(price + a * 3 * bias).toFixed(2), mid: +(price + a * 7 * bias).toFixed(2), long: +(price + a * 18 * bias).toFixed(2), sl: +(price - a * 2).toFixed(2) };
}

// ═══════════════════════════════════════════════════════════════
// YAHOO FINANCE API
// ═══════════════════════════════════════════════════════════════

const YF_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://corsproxy.io/?url="
];

async function yfFetch(url) {
  // Direct fetch (might fail in browser due to CORS)
  try {
    const r = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(5000) });
    if (r.ok) return r.json();
  } catch { }

  // Try each proxy
  for (const proxy of YF_PROXIES) {
    try {
      const r = await fetch(proxy + encodeURIComponent(url), { signal: AbortSignal.timeout(10000) });
      if (r.ok) return r.json();
    } catch (e) {
      console.warn(`Proxy failed: ${proxy}`, e.message);
    }
  }
  return null;
}

async function fetchHistory(sym) {
  const d = await yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=6mo`);
  if (!d?.chart?.result?.[0]) return null;
  const r = d.chart.result[0], { close, open, high, low, volume } = r.indicators.quote[0];
  return r.timestamp.map((_, i) => ({ c: close[i], o: open[i], h: high[i], l: low[i], v: volume[i] })).filter(x => x.c != null && x.h != null && x.o != null);
}

async function fetchBatchQuotes(syms) {
  const fields = "regularMarketPrice,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,regularMarketPreviousClose,trailingPE,epsTrailingTwelveMonths,marketCap,beta,fiftyTwoWeekHigh,fiftyTwoWeekLow,displayName,shortName";
  const d = await yfFetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${syms.join(",")}&fields=${fields}`);
  return d?.quoteResponse?.result || [];
}

// Haber + basit sentiment (Yahoo Finance search news — ücretsiz)
async function fetchNews(sym) {
  const d = await yfFetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${sym}&newsCount=5&enableFuzzyQuery=false`);
  const news = d?.news?.slice(0, 5) || [];
  if (!news.length) return { news: [], sentiment: "NÖTR", sentimentScore: 0 };

  // Pozitif/Negatif kelime listesi
  const POS = ["surge", "soar", "rally", "beat", "record", "upgrade", "buy", "bullish", "jump", "gain", "boost", "positive", "exceed", "strong", "growth", "profit", "breakthrough"];
  const NEG = ["drop", "fall", "miss", "downgrade", "sell", "bearish", "decline", "loss", "warn", "risk", "concern", "cut", "reduce", "layoff", "lawsuit", "crash", "weak"];

  let pos = 0, neg = 0;
  news.forEach(n => {
    const text = (n.title || "").toLowerCase();
    POS.forEach(w => text.includes(w) && pos++);
    NEG.forEach(w => text.includes(w) && neg++);
  });

  const score = pos - neg;
  const sentiment = score > 1 ? "POSITIVE 📈" : score < -1 ? "NEGATIVE 📉" : "NEUTRAL";
  return { news, sentiment, sentimentScore: score };
}

async function buildStock(symbol, qd, spyCloses = []) {
  try {
    const hist = await fetchHistory(symbol);
    if (!hist || hist.length < 3) return null;

    const c = hist.map(d => d.c), o = hist.map(d => d.o), h = hist.map(d => d.h);
    const l = hist.map(d => d.l), v = hist.map(d => d.v);

    const price = qd?.regularMarketPrice || c[c.length - 1];
    const prev = qd?.regularMarketPreviousClose || c[c.length - 2] || price;
    const change = +((price - prev) / prev * 100).toFixed(2);
    const vol = qd?.regularMarketVolume || v[v.length - 1] || 0;
    const avgVol = qd?.averageDailyVolume3Month || (v.reduce((a, b) => a + b, 0) / v.length) || 1;
    const volRatio = +(vol / avgVol).toFixed(2);

    // Temel veriler
    const pe = qd?.trailingPE ? +qd.trailingPE.toFixed(1) : null;
    const eps = qd?.epsTrailingTwelveMonths ? +qd.epsTrailingTwelveMonths.toFixed(2) : null;
    const mktCap = qd?.marketCap || null;
    const beta = qd?.beta ? +qd.beta.toFixed(2) : null;
    const high52w = qd?.fiftyTwoWeekHigh || Math.max(...c);
    const low52w = qd?.fiftyTwoWeekLow || Math.min(...c);

    // 13 teknik indikatör
    const rsi = I.rsi(c);
    const macdR = I.macd(c);
    const bb = I.bb(c, Math.min(20, c.length));
    const sma20 = I.sma(c, Math.min(20, c.length));
    const sma50 = I.sma(c, Math.min(50, c.length));
    const sma150 = I.sma(c, Math.min(150, c.length));
    const sma200 = I.sma(c, Math.min(200, c.length));
    const sma30 = I.sma(c, Math.min(30, c.length));
    const sma30Old = I.sma(c.slice(0, -5), Math.min(30, c.length - 5));
    const stR = I.stoch(h, l, c, Math.min(14, c.length));
    const willr = I.willr(h, l, c, Math.min(14, c.length));
    const atr = I.atr(h, l, c, Math.min(14, c.length));
    const obvR = I.obv(c, v);
    const cci = I.cci(h, l, c, Math.min(20, c.length));
    const cross = I.cross(c);
    const roc = I.roc(c, Math.min(10, c.length - 1));
    const pivots = I.pivots(h, l, c);

    // YENİ: Mum formasyonu
    const { patterns, bullScore: candleBull, bearScore: candleBear } = candlePatterns(o, h, l, c);

    // YENİ: Minervini Template
    const mvn = minerviniTemplate(c, h, price, sma50, sma150, sma200, high52w, low52w);

    // YENİ: Weinstein Stage
    const sma30Trend = sma30 && sma30Old ? ((sma30 - sma30Old) / sma30Old * 100) : 0;
    const stage = weinsteinStage(price, sma30, sma30Trend, sma200);

    // YENİ: RS Rating
    const rsRating = calcRsRating(c, spyCloses);

    // YENİ: VCP
    const { isVCP, contractions } = detectVCP(c, v);

    const sector = SYM_SECTOR[symbol] || (price < 2 ? "💎 Penny" : "❓ Diğer");
    const indData = {
      price, rsi, macd: macdR.macd, sig: macdR.sig, stochK: stR.k, willr, cci, roc, cross,
      bb, sma20, sma50, sma200, volRatio, obvTrend: obvR.trend,
      candleBull, candleBear, minerviniPass: mvn.pass, vcpDetected: isVCP,
    };

    const { score, signals } = compositeScore(indData, sector);
    const targets = calcTargets(price, score, atr);

    return {
      symbol, price, change, volRatio, isPenny: price < 2, sector,
      rsi, macd: macdR.macd, macdSig: macdR.sig, stochK: stR.k, willr, atr, cci, cross, roc,
      obvTrend: obvR.trend, bb, sma20, sma50, sma150, sma200, ...pivots,
      score, signals, targets,
      rec: scoreRec(score),
      rsiSignal: rsi < 30 ? "OVERSOLD" : rsi > 70 ? "OVERBOUGHT" : "NEUTRAL",
      macdSignal: macdR.macd > macdR.sig ? "BULL" : "BEAR",
      trend: price > sma20 && sma20 > sma50 ? "UP" : price < sma20 && sma20 < sma50 ? "DOWN" : "SIDE",
      sparkline: c.slice(-30),
      dataPoints: c.length,
      // Yeni alanlar
      candlePatterns: patterns,
      candleBull, candleBear,
      minervini: mvn,
      stage,
      rsRating,
      isVCP, vcpContractions: contractions,
      pe, eps, mktCap, beta, high52w, low52w,
    };
  } catch (e) {
    console.warn(symbol, e.message);
    return null;
  }
}

// ── Mock Veri ─────────────────────────────────────────────────
function mockStock(symbol) {
  const isPenny = PENNY_SYMS.includes(symbol);
  const seed = symbol.split("").reduce((a, c_) => a + c_.charCodeAt(0), 0);
  const rng = (mn, mx, o = 0) => +(mn + ((seed + o) * 9301 + 49297) % 233280 / 233280 * (mx - mn)).toFixed(4);
  const n = 90, base = isPenny ? rng(0.05, 1.95, 1) : rng(8, 850, 1);
  const c = Array.from({ length: n }, (_, i) => Math.max(0.01, +(base * (0.82 + i / n * 0.36 + rng(-0.05, 0.05, i + 100))).toFixed(4)));
  const o = c.map((x, i) => Math.max(0.01, +(x * (1 + rng(-0.02, 0.02, i + 200))).toFixed(4)));
  const h = c.map((x, i) => +(x * rng(1.005, 1.03, i + 300)).toFixed(4));
  const l = c.map((x, i) => +(x * rng(0.97, 0.995, i + 400)).toFixed(4));
  const v = c.map((_, i) => Math.floor(rng(5e5, 5e7, i + 500)));

  const price = c[n - 1], change = +rng(-8, 12, 3).toFixed(2), volRatio = +rng(0.4, 3.2, 4).toFixed(2);
  const sector = SYM_SECTOR[symbol] || (isPenny ? "💎 Penny" : "❓ Diğer");

  const rsi = I.rsi(c), macdR = I.macd(c), bb = I.bb(c, 20), sma20 = I.sma(c, 20), sma50 = I.sma(c, 50);
  const sma150 = I.sma(c, Math.min(150, n)), sma200 = I.sma(c, Math.min(200, n)), sma30 = I.sma(c, 30);
  const stR = I.stoch(h, l, c, 14), willr = I.willr(h, l, c, 14), atr = I.atr(h, l, c, 14);
  const obvR = I.obv(c, v), cci = I.cci(h, l, c, 20), cross = I.cross(c), roc = I.roc(c, 10), pivots = I.pivots(h, l, c);
  const { patterns, bullScore: candleBull, bearScore: candleBear } = candlePatterns(o, h, l, c);
  const mvn = minerviniTemplate(c, h, price, sma50, sma150, sma200, Math.max(...c), Math.min(...c));
  const stage = weinsteinStage(price, sma30, rng(-2, 3, 6), sma200);
  const rsRating = Math.floor(rng(20, 99, 7));
  const { isVCP, contractions } = detectVCP(c, v);
  const pe = isPenny ? null : +rng(8, 60, 8).toFixed(1);
  const eps = isPenny ? null : +rng(-2, 15, 9).toFixed(2);
  const mktCap = isPenny ? Math.floor(rng(5e6, 5e8, 10)) : Math.floor(rng(5e9, 3e12, 10));
  const beta = +rng(0.5, 2.8, 11).toFixed(2);

  const ind = { price, rsi, macd: macdR.macd, sig: macdR.sig, stochK: stR.k, willr, cci, roc, cross, bb, sma20, sma50, sma200, volRatio, obvTrend: obvR.trend, candleBull, candleBear, minerviniPass: mvn.pass, vcpDetected: isVCP };
  const { score, signals } = compositeScore(ind, sector);
  const targets = calcTargets(price, score, atr);

  return {
    symbol, price, change, volRatio, isPenny, sector,
    rsi, macd: macdR.macd, macdSig: macdR.sig, stochK: stR.k, willr, atr, cci, cross, roc,
    obvTrend: obvR.trend, bb, sma20, sma50, sma150, sma200, ...pivots,
    score, signals, targets, rec: scoreRec(score),
    rsiSignal: rsi < 30 ? "OVERSOLD" : rsi > 70 ? "OVERBOUGHT" : "NEUTRAL",
    macdSignal: macdR.macd > macdR.sig ? "BULL" : "BEAR",
    trend: price > sma20 && sma20 > sma50 ? "UP" : price < sma20 && sma20 < sma50 ? "DOWN" : "SIDE",
    sparkline: c.slice(-30), dataPoints: n,
    candlePatterns: patterns, candleBull, candleBear,
    minervini: mvn, stage, rsRating, isVCP, vcpContractions: contractions,
    pe, eps, mktCap, beta, high52w: Math.max(...c), low52w: Math.min(...c),
  };
}

// ═══════════════════════════════════════════════════════════════
// TELEGRAM
// ═══════════════════════════════════════════════════════════════

async function tgSend(token, chatId, text) {
  if (!token || !chatId) return false;
  try { const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }) }); return r.ok; } catch { return false; }
}
function buildDailyMsg(stocks) {
  const top5 = [...stocks].sort((a, b) => b.score - a.score).slice(0, 5);
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  let m = `🌅 <b>NASDAQ AI AGENT v4.0 — Daily Intel</b>\n📅 ${date}\n\n<b>🏆 Top 5 Opportunities:</b>\n`;
  top5.forEach((s, i) => {
    const tags = [s.minervini?.pass ? "📐MVN" : "", s.isVCP ? "🔥VCP" : "", s.rsRating >= 80 ? "⭐RS" : s.rsRating >= 60 ? "RS" + "" + s.rsRating : ""].filter(Boolean).join(" ");
    m += `\n${i + 1}. <b>${s.symbol}</b> $${s.price} (${s.change >= 0 ? "+" : ""}${s.change}%)\n`;
    m += `Score:${s.score} | ${s.stage?.label || ""} | ${tags}\n`;
    m += `RS:${s.rsRating} | RSI:${s.rsi} | ${s.candlePatterns?.[0]?.name || ""}\n`;
  });
  m += `\n📊 ${stocks.length} assets · ${new Date().toLocaleTimeString("en-US")}`;
  return m;
}
const alarmMsg = (a, s) => `⚡ <b>ALERT: ${s.symbol}</b>\n$${s.price} (${s.change >= 0 ? "+" : ""}${s.change}%)\n${a.type} ${a.value}\nScore:${s.score} | ${s.stage?.label || ""}\nRS Rating: ${s.rsRating}\n📅 ${new Date().toLocaleString("en-US")}`;
const slTpMsg = (h, t, cur) => `${t === "SL" ? "🛑" : "🎯"} <b>${t}: ${h.symbol}</b>\nPrice:$${cur} | ${t === "SL" ? "SL" : "TP"}:$${t === "SL" ? h.sl : h.tp}\nCost:$${h.cost} | P/L:${((cur - h.cost) / h.cost * 100).toFixed(2)}%\n📅 ${new Date().toLocaleString("en-US")}`;

// ═══════════════════════════════════════════════════════════════
// UI ATOM BİLEŞENLERİ
// ═══════════════════════════════════════════════════════════════

const REC_CLS = {
  "GÜÇLÜ AL": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]",
  "AL": "bg-emerald-500/5 text-emerald-500 border-emerald-500/20",
  "BEKLE": "bg-amber-500/5 text-amber-500 border-amber-500/20",
  "SAT": "bg-red-500/5 text-red-500 border-red-500/20",
  "GÜÇLÜ SAT": "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]",
};

function Chip({ t, sm }) {
  return (<span className={`font-bold border tracking-widest uppercase transition-all duration-300 ${sm ? "text-[8px] px-1.5 py-0.5 rounded" : "text-[10px] px-2.5 py-1 rounded-xl"} ${REC_CLS[t] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>{t}</span>);
}

function Ring({ score, size = 44, stroke = 2.5 }) {
  const r = size / 2 - stroke * 1.5, circ = 2 * Math.PI * r;
  const col = score >= 75 ? "#10b981" : score >= 60 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (<div style={{ width: size, height: size }} className="relative flex items-center justify-center flex-shrink-0 group">
    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-500 blur-md" style={{ color: col }} />
    <svg className="-rotate-90 drop-shadow-sm" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} strokeOpacity="0.3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </svg>
    <span className="absolute font-display font-bold text-white tracking-tighter" style={{ fontSize: size * 0.28 }}>{score}</span>
  </div>);
}

function Spark({ data, w = 80, h = 26 }) {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1) * w).toFixed(1)},${(h - ((v - mn) / range * h)).toFixed(1)}`).join(" ");
  return (<svg width={w} height={h}><polyline points={pts} fill="none" stroke={data[data.length - 1] >= data[0] ? "#10b981" : "#ef4444"} strokeWidth="1.5" /></svg>);
}

function SigBar({ sigs }) {
  if (!sigs?.length) return null;
  const bull = sigs.filter(s => s.bull).length;
  return (<div className="flex gap-px items-center">
    {sigs.map((s, i) => <div key={i} title={`${s.name}: ${s.bull ? "▲" : "▼"} ×${s.w}`} style={{ opacity: Math.min(1, 0.4 + s.w * 0.1) }} className={`h-1.5 rounded-sm flex-1 ${s.bull ? "bg-emerald-500" : "bg-red-500"}`} />)}
    <span className="text-[9px] text-zinc-600 ml-1 font-mono w-8 text-right">{bull}/{sigs.length}</span>
  </div>);
}

function SecDot({ sector }) {
  const col = Object.entries(SECTORS).find(([k]) => k === sector)?.[1]?.color || "#6b7280";
  return (<span style={{ background: col }} className="inline-block w-2 h-2 rounded-full flex-shrink-0" />);
}

// RS Rating badge
function RsBadge({ rs }) {
  if (!rs) return null;
  const isHigh = rs >= 80;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${isHigh ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold shadow-[0_0_10px_-4px_rgba(6,182,212,0.4)]" : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500"}`}>
      <span className="text-[8px] uppercase tracking-widest opacity-70">RS</span>
      <span className="text-[10px] font-display font-bold leading-none">{rs}</span>
    </div>
  );
}

// Minervini Badge
function MvnBadge({ mvn }) {
  if (!mvn) return null;
  return mvn.pass
    ? <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-[0_0_12px_-5px_rgba(245,158,11,0.3)]">
      <span className="text-[9px]">📐</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">MVN</span>
    </div>
    : <div className="bg-zinc-800/40 border border-zinc-800 text-zinc-600 px-2 py-0.5 rounded-lg text-[9px] font-bold">
      {mvn.passCount}/8
    </div>;
}

// Stage badge
function StageBadge({ stage }) {
  if (!stage || stage.stage === 0) return null;
  return (
    <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg border shadow-sm" style={{ color: stage.color, borderColor: `${stage.color}30`, backgroundColor: `${stage.color}10` }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{stage.label.split(" — ")[1] || stage.label}</span>
    </div>
  );
}

// Mum formasyon badge (en güçlü formasyon)
function CandleBadge({ patterns, mono }) {
  if (!patterns?.length) return null;
  const top = patterns.sort((a, b) => b.strength - a.strength)[0];
  const col = top.bull ? "emerald" : "red";
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-bold uppercase tracking-widest ${top.bull ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
      <span className="text-[9px]">{top.bull ? "🕯️" : "🕯️"}</span>
      <span className="text-[9px] whitespace-nowrap">{top.name}</span>
    </div>
  );
}

// Piyasa değeri formatı
function fmtMcap(n) {
  if (!n) return "—"; if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`; if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`; return `$${(n / 1e6).toFixed(0)}M`;
}

// ─ Hisse Kartı (Mobile) ───────────────────────────────────────
function StockCard({ s, onSelect, onAlarm, onPort }) {
  const up = s.change >= 0;
  return (
    <div onClick={() => onSelect(s)} className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:border-zinc-700/50 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-lg font-display font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{s.symbol}</span>
            {s.isPenny && <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">PENNY</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SecDot sector={s.sector} />
            <span className="text-xs text-zinc-500 font-medium">{s.sector.split(" ").slice(1).join(" ")}</span>
            <RsBadge rs={s.rsRating} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-display font-bold text-white tracking-tight">${s.price}</div>
            <div className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{s.change}%</div>
          </div>
          <Ring score={s.score} size={44} />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {s.minervini?.pass && <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg border border-amber-500/20 font-bold">📐 MVN</span>}
        {s.isVCP && <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg border border-orange-500/20 font-bold">🔥 VCP</span>}
        {s.cross === "GOLDEN" && <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg border border-yellow-500/20 font-bold">✨ GOLDEN</span>}
      </div>

      <div className="h-10 w-full mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
        <Spark data={s.sparkline} w={300} h={40} />
      </div>

      <div className="mt-2 mb-3"><SigBar sigs={s.signals} /></div>

      <div className="flex justify-between items-center pt-3 border-t border-zinc-800/40">
        <div className="flex gap-2 items-center">
          <Chip t={s.rec} sm />
          <StageBadge stage={s.stage} />
        </div>
        <div className="flex gap-2">
          <button onClick={e => { e.stopPropagation(); onAlarm(s); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-yellow-400 hover:border-yellow-400/50 transition-all">🔔</button>
          <button onClick={e => { e.stopPropagation(); onPort(s); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-emerald-400 hover:border-emerald-400/50 transition-all">
            <span className="text-xl leading-none">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─ Desktop Tablo Satırı ───────────────────────────────────────
function StockRow({ s, selected, onSelect, onAlarm, onPort }) {
  const up = s.change >= 0;
  return (
    <tr onClick={() => onSelect(s)} className={`border-b border-zinc-800/30 cursor-pointer text-sm transition-all ${selected ? "bg-cyan-500/5" : "hover:bg-white/5"}`}>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Ring score={s.score} size={36} />
          <div>
            <div className={`font-display font-bold text-base tracking-tight ${selected ? "text-cyan-400" : "text-white"}`}>{s.symbol}</div>
            <div className="flex items-center gap-1.5 opacity-60">
              <SecDot sector={s.sector} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{s.sector.split(" ").slice(1).join(" ")}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-right">
        <div className="font-display font-bold text-base text-white tracking-tight">${s.price}</div>
        <div className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{s.change}%</div>
      </td>
      <td className="px-3 py-4 min-w-[100px]"><Spark data={s.sparkline} w={80} h={24} /></td>
      <td className="px-3 py-4"><div className="w-28"><SigBar sigs={s.signals} /></div></td>
      <td className={`px-3 py-4 text-center font-semibold ${s.rsi < 35 ? "text-blue-400" : s.rsi > 65 ? "text-orange-400" : "text-zinc-400"}`}>{s.rsi?.toFixed(0)}</td>
      <td className="px-3 py-4 text-center"><RsBadge rs={s.rsRating} /></td>
      <td className="px-3 py-4 text-center">
        <div className="flex flex-col gap-1 items-center">
          {s.minervini?.pass && <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">MVN</span>}
          {s.isVCP && <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-500/20">VCP</span>}
          {!s.minervini?.pass && !s.isVCP && <span className="text-zinc-700">—</span>}
        </div>
      </td>
      <td className="px-3 py-4 text-center"><Chip t={s.rec} sm /></td>
      <td className="px-4 py-4">
        <div className="flex gap-2 justify-end">
          <button onClick={e => { e.stopPropagation(); onAlarm(s); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 transition-colors">🔔</button>
          <button onClick={e => { e.stopPropagation(); onPort(s); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 transition-colors">+</button>
        </div>
      </td>
    </tr>
  );
}

// ─ Hisse Detay Modal ─────────────────────────────────────────
// ─ Asset Intel Detail View ─────────────────────────────────────────
function StockDetail({ stock, onClose, isModal }) {
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  useEffect(() => { setAiText(""); setNews(null); }, [stock?.symbol]);

  const loadNews = async () => {
    if (!stock || newsLoading) return;
    setNewsLoading(true);
    const data = await fetchNews(stock.symbol);
    setNews(data);
    setNewsLoading(false);
  };

  const analyze = async () => {
    if (!stock || loading) return;
    setAiText(""); setLoading(true);
    const bs = stock.signals?.filter(s => s.bull).map(s => s.name).join(", ") || "none";
    const as_ = stock.signals?.filter(s => !s.bull).map(s => s.name).join(", ") || "none";
    const candleStr = stock.candlePatterns?.map(p => `${p.name}(${p.bull ? "Bull" : "Bear"}×${p.strength})`).join(", ") || "none";
    const mvnStr = stock.minervini ? `${stock.minervini.passCount}/8 conditions (${stock.minervini.pass ? "PASS" : "FAIL"})` : "—";
    const p = `Act as a senior Wall Street quantitative analyst. Provide a professional technical analysis for ${stock.symbol} in English. Max 250 words. Be precise and actionable.

ASSET: ${stock.symbol} | $${stock.price} (${stock.change >= 0 ? "+" : ""}${stock.change}%) | ${stock.sector}
AI SCORE: ${stock.score}/100 (${stock.rec}) | Stage: ${stock.stage?.label || "?"} | RS Rating: ${stock.rsRating || "?"}

TECHNICAL SIGNALS:
Bullish: ${bs}
Bearish: ${as_}

CANDLESTICK PATTERNS: ${candleStr}
MINERVINI TEMPLATE: ${mvnStr}
VCP PATTERN: ${stock.isVCP ? "DETECTED 🔥" : "None"}

INDICATORS:
RSI:${stock.rsi} | Stoch:${stock.stochK?.toFixed(0)} | CCI:${stock.cci?.toFixed(0)} | MACD:${stock.macdSignal === "BOĞA" ? "Bullish" : "Bearish"} | ROC:${stock.roc}%
Cross:${stock.cross} | OBV:${stock.obvTrend} | Vol Ratio:${stock.volRatio}x | Trend:${stock.trend}

FUNDAMENTALS:
P/E:${stock.pe || "—"} | EPS:${stock.eps || "—"} | Beta:${stock.beta || "—"} | Mkt Cap:${fmtMcap(stock.mktCap)}
52W High:$${stock.high52w?.toFixed(2) || "—"} | 52W Low:$${stock.low52w?.toFixed(2) || "—"}

KEY LEVELS:
S1=$${stock.s1} S2=$${stock.s2} | R1=$${stock.r1} R2=$${stock.r2}
Targets: Short: $${stock.targets?.short} / Mid: $${stock.targets?.mid} / Long: $${stock.targets?.long} | Stop Loss:$${stock.targets?.sl}

REQUIREMENTS:
1) Technical outlook summary
2) Candlestick pattern interpretation
3) Minervini/Stage status implications
4) Short, medium, long-term trade strategy
5) Precise entry/exit points and final verdict`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": "REPLACE_WITH_REAL_KEY", "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1000, messages: [{ role: "user", content: p }] }) });
      const d = await r.json();
      setAiText(d.content?.[0]?.text || "No response generated. Verification required.");
    } catch { setAiText("⚠️ Analysis engine offline. Check API connectivity."); }
    setLoading(false);
  };

  if (!stock) return null;
  const up = stock.change >= 0;

  const content = (
    <div className={`${isModal ? "h-full" : "h-full"} overflow-y-auto no-scrollbar pb-12`}>
      {/* Header Profile */}
      <div className={`relative px-8 pt-10 pb-8 border-b border-zinc-800/60 bg-gradient-to-b from-zinc-800/20 to-transparent ${isModal ? "rounded-t-[2.5rem]" : ""}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <span className="text-4xl font-display font-black text-white tracking-tighter uppercase">{stock.symbol}</span>
              {stock.isPenny && <span className="text-[10px] font-black text-violet-400 bg-violet-400/10 px-3 py-1 rounded-xl border border-violet-400/20 tracking-widest">SPECULATIVE</span>}
              <Chip t={stock.rec} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <SecDot sector={stock.sector} />
                <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">{stock.sector}</span>
              </div>
              <RsBadge rs={stock.rsRating} />
              {stock.isVCP && <span className="text-[10px] font-black text-orange-400 bg-orange-400/10 px-3 py-1 rounded-xl border border-orange-400/20 tracking-widest animate-pulse">VCP ACTIVE</span>}
            </div>
          </div>
          <div className="flex items-start gap-5">
            <div className="text-center group cursor-help">
              <Ring score={stock.score} size={72} stroke={5} />
              <div className="text-[9px] font-black text-zinc-500 mt-2 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">AI Rating</div>
            </div>
            {isModal && <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 text-3xl transition-all shadow-xl">×</button>}
          </div>
        </div>

        <div className="flex items-end gap-5">
          <div className={`text-4xl font-display font-black ${up ? "text-emerald-400" : "text-red-400"} tracking-tighter`}>${stock.price}</div>
          <div className={`text-xl font-bold mb-1.5 ${up ? "text-emerald-500/60" : "text-red-500/60"}`}>
            {up ? "▲" : "▼"} {Math.abs(stock.change)}%
          </div>
        </div>
      </div>

      <div className="px-8 space-y-8 mt-8">
        {/* Rapid Status Bar */}
        <div className="flex gap-2 flex-wrap">
          <StageBadge stage={stock.stage} />
          <MvnBadge mvn={stock.minervini} />
          {stock.candlePatterns?.length > 0 && <CandleBadge patterns={[...stock.candlePatterns]} />}
        </div>

        {/* Visual Price Velocity */}
        <div className="rounded-[2rem] border border-zinc-800/60 bg-zinc-900/40 p-6 overflow-hidden relative">
          <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-4 opacity-50">Price Momentum (30D)</div>
          <div className="h-24 w-full flex items-end">
            <Spark data={stock.sparkline} w={400} h={80} />
          </div>
        </div>

        {/* Quant Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["P/E Ratio", stock.pe || "N/A", "text-zinc-200"],
            ["EPS (TTM)", stock.eps != null ? `$${stock.eps}` : "N/A", "text-zinc-200"],
            ["Beta Coeff", stock.beta || "N/A", stock.beta > 1.5 ? "text-amber-400" : "text-zinc-200"],
            ["Market Cap", fmtMcap(stock.mktCap), "text-cyan-400"]
          ].map(([l, v, c]) => (
            <div key={l} className="bg-zinc-900/40 border border-zinc-800/40 rounded-[1.5rem] p-5 shadow-inner">
              <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1.5">{l}</div>
              <div className={`text-sm font-display font-black ${c}`}>{v}</div>
            </div>
          ))}
        </div>

        {/* 52-Week Trajectory */}
        <div className="rounded-[2rem] border border-zinc-800/60 bg-zinc-900/40 p-6">
          <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-5">52-Week Performance Corridor</div>
          <div className="relative h-2 bg-zinc-800 rounded-full mb-4 shadow-inner">
            {stock.high52w && stock.low52w && (
              <div className="absolute h-full bg-gradient-to-r from-red-500 via-zinc-400 to-emerald-500 rounded-full opacity-60" style={{ left: 0, right: 0 }} />
            )}
            {stock.high52w && stock.low52w && (
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-xl border-4 border-zinc-900 z-10" style={{ left: `${Math.min(95, Math.max(2, (stock.price - stock.low52w) / (stock.high52w - stock.low52w) * 100))}%` }} />
            )}
          </div>
          <div className="flex justify-between text-xs font-black">
            <div className="flex flex-col">
              <span className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">Low</span>
              <span className="text-zinc-400 font-mono">${stock.low52w?.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">Current</span>
              <span className="text-cyan-400 font-mono">${stock.price}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-zinc-600 text-[8px] uppercase tracking-widest mb-1">High</span>
              <span className="text-zinc-400 font-mono">${stock.high52w?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pattern & Signals Cluster */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Candlestick Logic */}
          {stock.candlePatterns?.length > 0 && (
            <div className="space-y-4">
              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Price Action Patterns</div>
              <div className="grid grid-cols-1 gap-2">
                {stock.candlePatterns.map((p, i) => (
                  <div key={i} className={`flex justify-between items-center px-5 py-3 rounded-2xl border ${p.bull ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20 shadow-sm"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{p.bull ? "🕯️" : "🕯️"}</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${p.bull ? "text-emerald-300" : "text-red-300"}`}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black ${p.bull ? "text-emerald-500" : "text-red-500"}`}>{p.bull ? "BULL" : "BEAR"}</span>
                      <span className="text-zinc-700 font-black text-[9px]">×{p.strength}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Meta Signals */}
          <div className="space-y-4">
            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Quantum Signal Matrix</div>
            <div className="grid grid-cols-2 gap-2">
              {stock.signals?.map((s, i) => (
                <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] ${s.bull ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"}`}>
                  <span className={`text-[10px] font-black uppercase tracking-tight ${s.bull ? "text-emerald-400" : "text-red-400"}`}>{s.bull ? "▲" : "▼"} {s.name}</span>
                  <span className="text-[9px] text-zinc-700 font-black">W:{s.w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Health Table */}
        <div className="rounded-[2rem] border border-zinc-800/60 bg-zinc-900/40 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-zinc-800/40 bg-zinc-800/20">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Engine Diagnostic Feed</span>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {[
              ["RSI (14 Daily)", stock.rsi?.toFixed(1), stock.rsiSignal, stock.rsi < 35 ? "text-blue-400" : stock.rsi > 65 ? "text-orange-400" : "text-zinc-300"],
              ["Stochastics %K", stock.stochK?.toFixed(1), stock.stochK < 20 ? "OVERSOLD" : stock.stochK > 80 ? "OVERBOUGHT" : "NEUTRAL", stock.stochK < 20 ? "text-blue-400" : stock.stochK > 80 ? "text-orange-400" : "text-zinc-300"],
              ["Williams %R", stock.willr?.toFixed(1), stock.willr < -80 ? "OVERSOLD" : stock.willr > -20 ? "OVERBOUGHT" : "NEUTRAL", stock.willr < -80 ? "text-blue-400" : "text-zinc-300"],
              ["CCI (Commodity)", stock.cci?.toFixed(0), stock.cci < -100 ? "OVERSOLD" : stock.cci > 100 ? "OVERBOUGHT" : "NEUTRAL", stock.cci < -100 ? "text-blue-400" : stock.cci > 100 ? "text-orange-400" : "text-zinc-300"],
              ["Momentum (ROC)", `${stock.roc}%`, stock.roc > 0 ? "BULLISH" : "BEARISH", stock.roc > 0 ? "text-emerald-400" : "text-red-400"],
              ["Volume Profile", `${stock.volRatio}x`, stock.volRatio > 1.8 ? "SURGE" : "STABLE", stock.volRatio > 1.8 ? "text-amber-500 font-black" : "text-zinc-500"],
            ].map(([l, v, s, c], i) => (
              <div key={i} className="flex justify-between items-center px-6 py-4 group hover:bg-white/5 transition-all">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-tight">{l}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-display font-black text-white">{v}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 min-w-[80px] text-center ${c}`}>{s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Support/Resistance Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="text-[10px] text-emerald-500 font-black tracking-[0.2em] mb-3 uppercase">Primary Support</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-zinc-600">S1-FLOOR</span> <span className="text-sm font-mono font-black text-emerald-400">${stock.s1}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-zinc-600">S2-BASE</span> <span className="text-sm font-mono font-bold text-emerald-500/40">${stock.s2}</span></div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/5 p-5">
            <div className="text-[10px] text-red-500 font-black tracking-[0.2em] mb-3 uppercase">Primary Resistance</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-zinc-600">R1-CEILING</span> <span className="text-sm font-mono font-black text-red-400">${stock.r1}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-zinc-600">R2-PEAK</span> <span className="text-sm font-mono font-bold text-red-500/40">${stock.r2}</span></div>
            </div>
          </div>
        </div>

        {/* Target Allocation Model */}
        <div className="space-y-4">
          <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Tactical Price Targets</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["SHORT", "text-emerald-400", stock.targets?.short], ["MEDIUM", "text-amber-400", stock.targets?.mid], ["LONG", "text-cyan-400", stock.targets?.long], ["ST. LOSS", "text-red-500", stock.targets?.sl]].map(([l, c, v]) => {
              const pct = v ? ((v - stock.price) / stock.price * 100).toFixed(1) : "—";
              return (<div key={l} className="border border-zinc-800 rounded-2xl p-4 text-center bg-zinc-900/60 shadow-lg">
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">{l}</div>
                <div className={`text-sm font-mono font-black mb-1 ${c}`}>${v}</div>
                <div className={`text-[10px] font-bold ${parseFloat(pct) > 0 ? "text-emerald-500" : "text-red-500"}`}>{pct}%</div>
              </div>);
            })}
          </div>
        </div>

        {/* Intelligence Feed Section */}
        <div className="space-y-4">
          <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Market Sentiment Feed</div>
          {!news ? (
            <button onClick={loadNews} disabled={newsLoading} className={`w-full py-5 rounded-[2rem] text-sm font-black border transition-all ${newsLoading ? "bg-zinc-900 text-zinc-500 border-zinc-800 animate-pulse" : "bg-zinc-800/40 text-zinc-400 border-zinc-800 hover:border-zinc-600 shadow-xl"}`}>
              {newsLoading ? "COMMUNICATING WITH FEED..." : "INITIALIZE BLOOMBERG NEWSSTREAM"}
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="text-[10px] font-black text-zinc-600 uppercase">Latest Dispatches</div>
                <span className={`text-[9px] font-black px-3 py-1 rounded-xl border ${news.sentimentScore > 1 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : news.sentimentScore < -1 ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-zinc-700 bg-zinc-800 text-zinc-500"}`}>
                  SENTIMENT: {news.sentiment?.toUpperCase()}
                </span>
              </div>
              {news.news.length === 0 ? <div className="text-center py-12 text-zinc-700 font-bold uppercase tracking-widest text-xs">No active news cycles detected</div> :
                <div className="space-y-3">
                  {news.news.map((n, i) => (
                    <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block rounded-[1.5rem] border border-zinc-800/60 bg-zinc-900/40 p-4 hover:border-cyan-500/40 transition-all group">
                      <div className="text-xs font-bold text-zinc-200 group-hover:text-white leading-relaxed mb-2 line-clamp-2">{n.title}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-600 font-black uppercase tracking-wider">{n.publisher}</span>
                        <span className="text-[9px] text-zinc-700 font-mono">{n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }) : ""}</span>
                      </div>
                    </a>
                  ))}
                </div>}
            </div>
          )}
        </div>

        {/* AI Deep Analysis Module */}
        <div className="pt-4">
          <button onClick={analyze} disabled={loading} className={`w-full py-6 rounded-[2.5rem] text-sm font-black border transition-all mb-4 ${loading ? "bg-indigo-950/40 text-indigo-400 border-indigo-900 animate-pulse" : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-2xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99]"}`}>
            {loading ? "QUANTUM ANALYTICS SCANNING..." : "RUN CLAUDE-4 NEURAL FORECAST"}
          </button>

          {aiText && (
            <div className="rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 p-8 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-4 border-b border-indigo-500/10 pb-4">Neuro-Technical Verdict</div>
              {aiText}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-end md:justify-center p-0 md:p-6" style={{ background: "rgba(0,0,0,0.92)" }}>
        <div onClick={onClose} className="absolute inset-0 -z-10" />
        <div className="bg-[#09090b] w-full max-w-2xl rounded-t-[3rem] md:rounded-[3rem] border-t md:border border-white/10 flex flex-col shadow-2xl overflow-hidden" style={{ maxHeight: "95vh" }}>
          <div className="md:hidden flex justify-center pt-4 pb-1 border-b border-white/5">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
          </div>
          <div className="flex-1 overflow-hidden">{content}</div>
        </div>
      </div>
    );
  }
  return content;
}

// ─ Global Discovery Grid (Top Alpha) ──────────────────────────────────
function TopPicks({ stocks, onSelect }) {
  const top = [...stocks].sort((a, b) => b.score - a.score).slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-display font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
          <span className="w-8 h-px bg-cyan-500/50"></span>
          INSTITUTIONAL ALPHA PICKS
        </h2>
        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-zinc-800/20 px-4 py-1.5 rounded-full border border-zinc-800/40">Real-Time Core Feed</div>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-8 no-scrollbar touch-pan-x -mx-5 px-5 group">
        {top.map((s, i) => {
          const up = s.change >= 0;
          return (
            <div key={s.symbol} onClick={() => onSelect(s)}
              className={`flex-shrink-0 w-64 rounded-[2.5rem] border p-7 cursor-pointer transition-all duration-500 relative overflow-hidden group/card hover:scale-[1.02] shadow-2xl ${i < 3 ? "border-cyan-500/40 bg-zinc-900/60 shadow-cyan-500/5" : "border-zinc-800/60 bg-zinc-900/40"}`}>
              {i < 3 && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent -mr-16 -mt-16 group-hover/card:from-cyan-500/20 transition-all duration-700"></div>}

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-display font-black text-white group-hover/card:text-cyan-400 transition-colors uppercase tracking-tight">{s.symbol}</span>
                    <span className="text-xs grayscale opacity-60 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all">{medals[i] || `#${i + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SecDot sector={s.sector} />
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{s.sector.split(" ")[1]}</span>
                  </div>
                </div>
                <Ring score={s.score} size={48} stroke={4} />
              </div>

              <div className="flex items-baseline gap-2 mb-4 relative z-10">
                <span className="text-3xl font-display font-black text-zinc-100 tracking-tight">${s.price}</span>
                <span className={`text-xs font-black font-mono ${up ? "text-emerald-500" : "text-red-500"}`}>
                  {up ? "▲" : "▼"}{Math.abs(s.change)}%
                </span>
              </div>

              <div className="h-12 w-full mb-6 opacity-40 group-hover/card:opacity-100 transition-opacity duration-500">
                <Spark data={s.sparkline} w={200} h={40} />
              </div>

              <div className="flex justify-between items-center relative z-10 pt-5 border-t border-zinc-800/60">
                <Chip t={s.rec} sm />
                <RsBadge rs={s.rsRating} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ Sector intelligence Matrix ───────────────────────────────────────
function SectorView({ stocks, onSelect }) {
  const [open, setOpen] = useState(null);
  const data = Object.entries(SECTORS).map(([sec, info]) => {
    const ss = stocks.filter(s => s.sector === sec);
    const avg = ss.length ? Math.round(ss.reduce((a, b) => a + b.score, 0) / ss.length) : 0;
    const mvnCount = ss.filter(s => s.minervini?.pass).length;
    return { sec, info, ss, avg, mvnCount };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {data.map(({ sec, info, ss, avg, mvnCount }) => {
        const isO = open === sec;
        const col = info.color;
        if (!ss.length) return null;
        return (
          <div key={sec} className={`rounded-[2.5rem] border transition-all duration-500 ${isO ? "border-cyan-500/40 bg-zinc-900/60 ring-1 ring-cyan-500/10" : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 shadow-2xl overflow-hidden"}`}>
            <div onClick={() => setOpen(isO ? null : sec)} className="p-8 cursor-pointer group">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl bg-zinc-800/40 border border-zinc-700/30 group-hover:scale-110 transition-all shadow-xl">
                  {info.icon}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">Index Health</div>
                  <div className="text-4xl font-display font-black" style={{ color: col }}>{avg}</div>
                </div>
              </div>

              <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-2">{sec.split(" ")[1]} Vertical</h3>
              <div className="flex items-center justify-between mb-8">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{ss.length} Active Feeds</span>
                {mvnCount > 0 && <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">📐 {mvnCount}</span>}
              </div>

              <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner border border-zinc-900/20">
                <div className="h-full rounded-full bg-gradient-to-r from-transparent to-current transition-all duration-1000 relative" style={{ width: `${avg}%`, color: col }}>
                  <div className="absolute inset-0 bg-white/10 blur-[2px]"></div>
                </div>
              </div>
            </div>

            {isO && (
              <div className="px-8 pb-8 bg-black/20 animate-in slide-in-from-top-4 duration-500 border-t border-white/5 pt-8">
                <div className="grid grid-cols-1 gap-3">
                  {ss.sort((a, b) => b.score - a.score).map(s => (
                    <div key={s.symbol} onClick={(e) => { e.stopPropagation(); onSelect(s); }} className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-cyan-500/30 transition-all flex justify-between items-center group/item">
                      <div>
                        <div className="text-sm font-display font-black text-white group-hover/item:text-cyan-400 transition-colors uppercase">{s.symbol}</div>
                        <div className="text-[10px] font-mono text-zinc-600 mt-1">${s.price}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-xs font-black font-mono ${s.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {s.change >= 0 ? "▲" : "▼"}{Math.abs(s.change)}%
                        </div>
                        <Ring score={s.score} size={32} stroke={3} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─ Minervini Tarama ──────────────────────────────────────────
function MinerviniScreen({ stocks, onSelect }) {
  const passed = [...stocks].filter(s => s.minervini?.pass || s.isVCP || (s.rsRating && s.rsRating >= 80)).sort((a, b) => b.score - a.score);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["📐 Minervini", stocks.filter(s => s.minervini?.pass).length, "text-amber-400"], ["🔥 VCP", stocks.filter(s => s.isVCP).length, "text-orange-400"], ["⭐ RS≥80", stocks.filter(s => s.rsRating >= 80).length, "text-emerald-400"]].map(([l, v, c]) => (
          <div key={l} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
            <div className="text-[10px] text-zinc-600 mb-1">{l}</div>
            <div className={`text-2xl font-mono font-bold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <div className="md:hidden space-y-4">
          {passed.map(s => (
            <div key={s.symbol} onClick={() => onSelect(s)} className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 p-6 shadow-xl active:scale-95 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-1">{s.symbol}</div>
                  <div className="flex gap-2">
                    <MvnBadge mvn={s.minervini} />
                    <RsBadge rs={s.rsRating} />
                  </div>
                </div>
                <Ring score={s.score} size={48} stroke={3} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-800/40 rounded-2xl p-3 border border-zinc-800/30">
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Price</div>
                  <div className="font-display font-bold text-white text-lg">${s.price}</div>
                </div>
                <div className="bg-zinc-800/40 rounded-2xl p-3 border border-zinc-800/30">
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Volume Ratio</div>
                  <div className="font-display font-bold text-white text-lg">{s.volRatio}x</div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-800/40">
                <Chip t={s.rec} />
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700/50">
                  <span className="text-[10px] font-bold text-zinc-400">STAGE</span>
                  <span className="text-[10px] font-bold text-white">{s.stage?.label.split(" — ")[1] || s.stage?.label}</span>
                </div>
              </div>
            </div>
          ))}
          {!passed.length && <div className="text-center text-zinc-600 py-16 font-medium">No assets currently meet the Trend Template requirements.</div>}
        </div>

        <div className="hidden md:block rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead className="bg-zinc-800/40 border-b border-zinc-700/50"><tr>
              {["Asset", "Current Price", "AI Score", "Minervini Criteria", "Technical Stage", "RS Rating", "VCP Status", "Verdict"].map(h => (
                <th key={h} className="px-6 py-5 text-left text-zinc-500 font-bold text-[10px] uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-zinc-800/40">
              {passed.map(s => (
                <tr key={s.symbol} onClick={() => onSelect(s)} className="hover:bg-cyan-500/5 cursor-pointer transition-all group">
                  <td className="px-6 py-5">
                    <div className="text-base font-display font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{s.symbol}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{s.sector.split(" ")[1]}</div>
                  </td>
                  <td className="px-6 py-5 font-display font-bold text-white text-base">${s.price}</td>
                  <td className="px-6 py-5"><Ring score={s.score} size={40} stroke={2.5} /></td>
                  <td className="px-6 py-5"><MvnBadge mvn={s.minervini} /></td>
                  <td className="px-6 py-5"><StageBadge stage={s.stage} /></td>
                  <td className="px-6 py-5"><RsBadge rs={s.rsRating} /></td>
                  <td className="px-6 py-5">
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${s.isVCP ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-zinc-800/40 border-zinc-800/60 text-zinc-600"}`}>
                      {s.isVCP ? "DETECTED 🔥" : "NONE"}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold"><Chip t={s.rec} sm /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!passed.length && <div className="text-center text-zinc-600 py-20 font-medium">No assets currently meet the Mark Minervini Trend Template requirements.</div>}
        </div>
      </div>
    </div>
  );
}

// ─ Portföy ───────────────────────────────────────────────────
// ─ Asset Portfolio Management ──────────────────────────────────────
function Portfolio({ stocks, tg, onNotify }) {
  const [holdings, setHoldings] = useState([]);
  const [form, setForm] = useState({ symbol: "", qty: "", cost: "", sl: "", tp: "" });
  const [showForm, setShowForm] = useState(false);
  const fired = useRef(new Set());
  useEffect(() => { window.storage?.get("pf_v4").then(r => { if (r?.value) setHoldings(JSON.parse(r.value)); }).catch(() => { }); }, []);
  const save = d => { setHoldings(d); window.storage?.set("pf_v4", JSON.stringify(d)).catch(() => { }); };
  useEffect(() => {
    holdings.forEach(h => {
      const l = stocks.find(s => s.symbol === h.symbol); if (!l) return;
      const slK = `sl_${h.symbol}`, tpK = `tp_${h.symbol}`;
      if (h.sl && l.price <= parseFloat(h.sl) && !fired.current.has(slK)) { fired.current.add(slK); const msg = slTpMsg(h, "SL", l.price); onNotify({ title: `🛑 STOP LOSS: ${h.symbol}`, msg }); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); }
      if (h.tp && l.price >= parseFloat(h.tp) && !fired.current.has(tpK)) { fired.current.add(tpK); const msg = slTpMsg(h, "TP", l.price); onNotify({ title: `🎯 TARGET HIT: ${h.symbol}`, msg }); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); }
    });
  }, [stocks, holdings]);
  const add = () => { if (!form.symbol || !form.qty || !form.cost) return; const sym = form.symbol.toUpperCase(); const nh = { symbol: sym, qty: parseFloat(form.qty), cost: parseFloat(form.cost), sl: form.sl || null, tp: form.tp || null }; const ex = holdings.find(h => h.symbol === sym); if (ex) save(holdings.map(h => h.symbol === sym ? { ...h, qty: h.qty + nh.qty, cost: +((h.cost * h.qty + nh.cost * nh.qty) / (h.qty + nh.qty)).toFixed(4), sl: nh.sl || h.sl, tp: nh.tp || h.tp } : h)); else save([...holdings, nh]); setForm({ symbol: "", qty: "", cost: "", sl: "", tp: "" }); setShowForm(false); };
  const totVal = holdings.reduce((s, h) => { const l = stocks.find(x => x.symbol === h.symbol); return s + (l?.price || h.cost) * h.qty; }, 0);
  const totCost = holdings.reduce((s, h) => s + h.cost * h.qty, 0);
  const pnl = totVal - totCost;
  const pnlPct = totCost > 0 ? (pnl / totCost * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          ["Aggregated Value", `$${totVal.toLocaleString()}`, "text-white", "bg-zinc-900/40 border-zinc-800/60"],
          ["Net Cost Basis", `$${totCost.toLocaleString()}`, "text-zinc-500", "bg-zinc-900/40 border-zinc-800/60"],
          [pnl >= 0 ? "Realized Alpha" : "Capital Variance", `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toLocaleString()} (${pnlPct}%)`, pnl >= 0 ? "text-emerald-400" : "text-red-400", pnl >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-400/5 border-red-400/20"]
        ].map(([l, v, c, b]) => (
          <div key={l} className={`rounded-[2rem] border ${b} p-8 shadow-2xl`}>
            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-2">{l}</div>
            <div className={`text-2xl font-display font-black tracking-tight ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowForm(p => !p)} className="w-full py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.99] border border-white/10">
        {showForm ? "✕ ABORT POSITION ENTRY" : "⊕ AUGMENT PORTFOLIO"}
      </button>

      {showForm && (
        <div className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 p-10 shadow-3xl animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Asset Identifier (Symbol)</label>
              <input type="text" placeholder="NVDA" value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} className="w-full bg-zinc-800/40 border border-zinc-700/50 rounded-2xl px-6 py-4 text-sm text-white font-black outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantity</label>
              <input type="number" placeholder="100" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} className="w-full bg-zinc-800/40 border border-zinc-700/50 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Avg Execution Price</label>
              <input type="number" placeholder="145.50" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="w-full bg-zinc-800/40 border border-zinc-700/50 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500/60 uppercase tracking-widest ml-1">Stop Loss Trigger</label>
              <input type="number" placeholder="Optional" value={form.sl} onChange={e => setForm(p => ({ ...p, sl: e.target.value }))} className="w-full bg-zinc-800/40 border border-red-500/20 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-red-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest ml-1">Take Profit Target</label>
              <input type="number" placeholder="Optional" value={form.tp} onChange={e => setForm(p => ({ ...p, tp: e.target.value }))} className="w-full bg-zinc-800/40 border border-emerald-500/20 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-emerald-500/50 transition-all" />
            </div>
          </div>
          <button onClick={add} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-[1.5rem] text-sm font-black shadow-3xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all">COMMIT POSITION</button>
        </div>
      )}

      <div className="space-y-4">
        {!holdings.length && (
          <div className="text-center py-32 bg-zinc-900/20 rounded-[3rem] border border-zinc-900 border-dashed">
            <div className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">Portfolio Empty / No Active Positions</div>
          </div>
        )}
        {holdings.map(h => {
          const l = stocks.find(s => s.symbol === h.symbol), cur = l?.price || h.cost, pnlH = (cur - h.cost) * h.qty, pct = ((cur - h.cost) / h.cost * 100).toFixed(1);
          const slHit = h.sl && cur <= parseFloat(h.sl), tpHit = h.tp && cur >= parseFloat(h.tp);
          const upH = pnlH >= 0;

          return (
            <div key={h.symbol} className={`rounded-[3rem] border p-10 transition-all duration-500 hover:shadow-3xl ${slHit ? "border-red-500/40 bg-red-500/10" : tpHit ? "border-emerald-500/40 bg-emerald-500/10" : "border-zinc-800/60 bg-zinc-900/40 shadow-2xl"}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-4xl font-display font-black text-white uppercase tracking-tighter">{h.symbol}</span>
                    <div className="flex gap-2">
                      {slHit && <span className="text-[10px] font-black text-white bg-red-500 px-3 py-1 rounded-xl shadow-lg animate-pulse tracking-widest">STOP-LOSS TRIGGERED</span>}
                      {tpHit && <span className="text-[10px] font-black text-white bg-emerald-500 px-3 py-1 rounded-xl shadow-lg animate-pulse tracking-widest">TARGET LIQUIDATED</span>}
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{l?.sector.split(" ")[1] || "MARKET"} ASSET</span>
                    {l && <><StageBadge stage={l.stage} /><RsBadge rs={l.rsRating} /></>}
                  </div>
                </div>
                <button onClick={() => save(holdings.filter(x => x.symbol !== h.symbol))} className="w-14 h-14 rounded-2xl bg-zinc-800/40 hover:bg-red-500/20 hover:text-red-400 text-zinc-600 flex items-center justify-center transition-all border border-zinc-700/30 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-800/30 rounded-[2rem] p-6 border border-zinc-800/40 relative overflow-hidden group">
                  <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2">Real-Time Quote</div>
                  <div className="font-display font-black text-zinc-100 text-3xl tracking-tight">${cur}</div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">📈</div>
                </div>
                <div className={`rounded-[2rem] p-6 border relative overflow-hidden group transition-all ${upH ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${upH ? "text-emerald-500/60" : "text-red-500/60"}`}>Net Gain/Loss</div>
                  <div className={`font-display font-black text-3xl tracking-tight ${upH ? "text-emerald-400" : "text-red-400"}`}>
                    {upH ? "+" : ""}${Math.abs(pnlH).toFixed(0)}
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">{upH ? "💸" : "📉"}</div>
                </div>
                <div className={`rounded-[2rem] p-6 border relative overflow-hidden group transition-all ${upH ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${upH ? "text-emerald-500/60" : "text-red-500/60"}`}>Performance ROI</div>
                  <div className={`font-display font-black text-3xl tracking-tight ${upH ? "text-emerald-400" : "text-red-400"}`}>
                    {upH ? "+" : ""}{pct}%
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">⚡</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-zinc-800/40">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Execution Cost</span>
                    <span className="text-zinc-300 font-mono font-black py-1 px-3 bg-zinc-800/60 rounded-lg border border-zinc-700/50">${h.cost}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Position Size</span>
                    <span className="text-zinc-300 font-mono font-black py-1 px-3 bg-zinc-800/60 rounded-lg border border-zinc-700/50">{h.qty}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  {h.sl && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest mb-1">Floor Limit</span>
                      <span className="bg-red-500/10 text-red-400 font-black font-mono py-1 px-4 rounded-xl border border-red-500/20 shadow-lg shadow-red-500/5">SL: ${h.sl}</span>
                    </div>
                  )}
                  {h.tp && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Ceiling Target</span>
                      <span className="bg-emerald-500/10 text-emerald-400 font-black font-mono py-1 px-4 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">TP: ${h.tp}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ Alerts (Formerly Alarms) ──────────────────────────────────
function Alarms({ stocks, tg }) {
  const [alarms, setAlarms] = useState([]);
  const [form, setForm] = useState({ symbol: "", type: "price_above", value: "" });
  const fired = useRef(new Set());
  useEffect(() => { window.storage?.get("alarms_v4").then(r => { if (r?.value) setAlarms(JSON.parse(r.value)); }).catch(() => { }); }, []);
  const save = d => { setAlarms(d); window.storage?.set("alarms_v4", JSON.stringify(d)).catch(() => { }); };
  useEffect(() => {
    if (!alarms.length || !stocks.length) return; let ch = false;
    const upd = alarms.map(a => {
      if (a.triggered || fired.current.has(a.id)) return a;
      const s = stocks.find(x => x.symbol === a.symbol); if (!s) return a;
      const v = parseFloat(a.value);
      let hit = false;
      if (a.type === "price_above" && s.price >= v) hit = true; if (a.type === "price_below" && s.price <= v) hit = true;
      if (a.type === "rsi_below" && s.rsi <= v) hit = true; if (a.type === "rsi_above" && s.rsi >= v) hit = true;
      if (a.type === "macd_bull" && s.macdSignal === "BULL") hit = true; if (a.type === "stoch_os" && s.stochK <= 20) hit = true;
      if (a.type === "cci_os" && s.cci <= -100) hit = true; if (a.type === "golden" && s.cross === "GOLDEN") hit = true;
      if (a.type === "score" && s.score >= v) hit = true;
      if (a.type === "minervini" && s.minervini?.pass) hit = true;
      if (a.type === "vcp" && s.isVCP) hit = true;
      if (a.type === "rs_above" && s.rsRating >= v) hit = true;
      if (hit) { fired.current.add(a.id); ch = true; const msg = alarmMsg(a, s); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); if (Notification.permission === "granted") new Notification(`⚡ ${a.symbol}`); return { ...a, triggered: true, at: new Date().toISOString() }; }
      return a;
    });
    if (ch) save(upd);
  }, [stocks, alarms]);
  const ATYPES = [
    { v: "price_above", l: "Price ≥ $" }, { v: "price_below", l: "Price ≤ $" },
    { v: "rsi_below", l: "RSI Index ≤" }, { v: "rsi_above", l: "RSI Index ≥" }, { v: "score", l: "AI Score ≥" },
    { v: "rs_above", l: "RS Rating ≥" }, { v: "macd_bull", l: "MACD Momentum" },
    { v: "stoch_os", l: "Stoch Oversold" }, { v: "cci_os", l: "CCI Oversold" },
    { v: "golden", l: "Golden Cross Node" }, { v: "minervini", l: "Minervini Protocol" },
    { v: "vcp", l: "VCP Node Detected" },
  ];
  const add = () => { if (!form.symbol || (!form.value && !["minervini", "vcp", "macd_bull", "stoch_os", "cci_os", "golden"].includes(form.type))) return; save([...alarms, { id: Date.now(), symbol: form.symbol.toUpperCase(), type: form.type, value: form.value, triggered: false }]); setForm(p => ({ ...p, symbol: "", value: "" })); };
  return (
    <div>
      {Notification.permission !== "granted" && (
        <div className="mb-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <span className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Notifications Disabled</span>
          </div>
          <button onClick={() => Notification.requestPermission()} className="text-xs font-bold bg-yellow-500 text-black px-4 py-2 rounded-xl hover:bg-yellow-400 transition-all">Enable Now</button>
        </div>
      )}
      {tg.enabled && tg.botToken && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          TELEGRAM NOTIFICATIONS ACTIVE
        </div>
      )}
      <div className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 p-8 mb-8 shadow-2xl">
        <h3 className="text-lg font-display font-bold text-white mb-6 uppercase tracking-widest">Create Price Alert</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Asset Symbol</label>
            <input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} placeholder="e.g. AAPL" className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-yellow-500/50 transition-all font-bold placeholder:font-normal placeholder:text-zinc-600 uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Condition</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-4 py-4 text-xs text-zinc-300 outline-none focus:border-yellow-500/50 transition-all font-bold uppercase tracking-wider">
                {ATYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Target Value</label>
              <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0.00" type="number" className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-yellow-500/50 transition-all font-bold" />
            </div>
          </div>
          <button onClick={add} className="w-full py-5 bg-yellow-500 text-black rounded-[2rem] text-sm font-bold shadow-xl shadow-yellow-500/10 hover:bg-yellow-400 transition-all active:scale-[0.98] mt-2">Set Alert Pipeline</button>
        </div>
      </div>
      <div className="space-y-4">
        {!alarms.length && <div className="text-center text-zinc-600 py-16 font-medium">No active alerts at the moment.</div>}
        {alarms.map(a => (
          <div key={a.id} className={`flex justify-between items-center p-6 rounded-[2rem] border transition-all ${a.triggered ? "border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/5" : "border-zinc-800/60 bg-zinc-900/40 shadow-xl"}`}>
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${a.triggered ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                {a.triggered ? "✓" : "⏳"}
              </div>
              <div>
                <div className="text-xl font-display font-bold text-white uppercase tracking-tight">{a.symbol}</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{ATYPES.find(t => t.v === a.type)?.l} <span className="text-zinc-300 font-mono">{a.value}</span></div>
                {a.at && <div className="text-[10px] text-zinc-600 mt-2 font-medium">{new Date(a.at).toLocaleString("en-US")}</div>}
              </div>
            </div>
            <div className="flex gap-3">
              {a.triggered && <button onClick={() => save(alarms.map(x => x.id === a.id ? { ...x, triggered: false } : x))} className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-4 py-2 rounded-xl border border-zinc-700/50 hover:bg-zinc-700 transition-all uppercase tracking-widest">Reset</button>}
              <button onClick={() => save(alarms.filter(x => x.id !== a.id))} className="w-10 h-10 rounded-2xl bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-400 text-zinc-600 flex items-center justify-center transition-all border border-zinc-700/50 font-bold">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─ Quantitative Audit (Signal Analysis) ──────────────────────
function SigAnalysis({ stocks }) {
  const [log, setLog] = useState([]);
  const [res, setRes] = useState(null);
  const [aiT, setAiT] = useState("");
  const [ld, setLd] = useState(false);

  useEffect(() => { window.storage?.get("sig_log_v4").then(r => { if (r?.value) setLog(JSON.parse(r.value)); }).catch(() => { }); }, []);

  const capture = () => {
    const snap = stocks.map(s => ({ symbol: s.symbol, price: s.price, score: s.score, rec: s.rec, rsi: s.rsi, sector: s.sector, rsRating: s.rsRating, minervini: s.minervini?.pass, isVCP: s.isVCP, timestamp: new Date().toISOString(), outcome: null }));
    const nl = [...log, ...snap].slice(-600);
    setLog(nl);
    window.storage?.set("sig_log_v4", JSON.stringify(nl)).catch(() => { });
    alert(`${snap.length} signals captured for analysis.`);
  };

  const evaluate = () => {
    const upd = log.map(e => {
      if (e.outcome !== null) return e;
      const l = stocks.find(s => s.symbol === e.symbol);
      if (!l) return e;
      const ret = ((l.price - e.price) / e.price * 100).toFixed(2);
      const correct = (["STRONG BUY", "BUY"].includes(e.rec) && l.price > e.price) || (["SELL", "STRONG SELL"].includes(e.rec) && l.price < e.price) || (e.rec === "NEUTRAL" && Math.abs(l.price - e.price) / e.price < 0.03);
      return { ...e, outcome: { correct, ret: parseFloat(ret), at: new Date().toISOString() } };
    });
    setLog(upd);
    window.storage?.set("sig_log_v4", JSON.stringify(upd)).catch(() => { });
    compute(upd);
  };

  const compute = entries => {
    const ev = entries.filter(e => e.outcome !== null);
    if (!ev.length) { setRes({ empty: true }); return; }
    const total = ev.length, wins = ev.filter(e => e.outcome.correct).length, winRate = (wins / total * 100).toFixed(1), avgRet = (ev.reduce((s, e) => s + e.outcome.ret, 0) / total).toFixed(2);
    const byRec = {};
    ev.forEach(e => {
      if (!byRec[e.rec]) byRec[e.rec] = { n: 0, w: 0, r: 0 };
      byRec[e.rec].n++;
      if (e.outcome.correct) byRec[e.rec].w++;
      byRec[e.rec].r += e.outcome.ret;
    });
    Object.values(byRec).forEach(v => { v.wr = (v.w / v.n * 100).toFixed(1); v.ar = (v.r / v.n).toFixed(2); });
    const mvnSigs = ev.filter(e => e.minervini), mvnWr = mvnSigs.length ? mvnSigs.filter(e => e.outcome.correct).length / mvnSigs.length * 100 : 0;
    const vcpSigs = ev.filter(e => e.isVCP), vcpWr = vcpSigs.length ? vcpSigs.filter(e => e.outcome.correct).length / vcpSigs.length * 100 : 0;
    const mistakes = ev.filter(e => !e.outcome.correct).sort((a, b) => Math.abs(b.outcome.ret) - Math.abs(a.outcome.ret)).slice(0, 8);
    setRes({ total, wins, winRate, avgRet, byRec, mistakes, mvnWr: mvnWr.toFixed(1), mvnN: mvnSigs.length, vcpWr: vcpWr.toFixed(1), vcpN: vcpSigs.length });
  };

  const askClaude = async () => {
    if (!res || res.empty) return; setLd(true); setAiT("");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          messages: [{ role: "user", content: `You are a Nasdaq signal analyst. English, max 200 words.\nTotal: ${res.total} signals, ${res.winRate}% success, avg ${res.avgRet}%\nMinervini Winrate: ${res.mvnWr}% (${res.mvnN} signals)\nVCP Winrate: ${res.vcpWr}% (${res.vcpN} signals)\nAccuracy by Verdict: ${Object.entries(res.byRec).map(([k, v]) => `${k}:${v.wr}%(${v.n})`).join(", ")}\nTop Losses: ${res.mistakes?.slice(0, 5).map(m => `${m.symbol}:${m.rec}→${m.outcome.ret}%`).join(", ")}\nQuestion: 1) Is Minervini/VCP working? 2) Where are the weaknesses? 3) Propose 2 specific improvements.` }]
        })
      });
      const d = await r.json();
      setAiT(d.content?.map(b => b.text || "").join("") || "No response received.");
    } catch { setAiT("⚠️ API Error."); } setLd(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={capture} className="py-5 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2">📸 Snapshot Port</button>
        <button onClick={evaluate} className="py-5 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">📊 Deep Audit</button>
      </div>

      {res && !res.empty && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[["Analysis Pool", res.total, "text-white"], ["Win Rate", `${res.winRate}%`, parseFloat(res.winRate) >= 55 ? "text-emerald-400" : "text-amber-400"], ["Avg Alpha", `${res.avgRet}%`, parseFloat(res.avgRet) >= 0 ? "text-emerald-400" : "text-red-400"]].map(([l, v, c]) => (
              <div key={l} className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-4 text-center shadow-lg">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{l}</div>
                <div className={`text-xl font-display font-bold ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2">📐 Minervini Accuracy</div>
              <div className={`text-2xl font-display font-bold ${parseFloat(res.mvnWr) >= 55 ? "text-emerald-400" : "text-amber-400"}`}>{res.mvnWr}%</div>
              <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">{res.mvnN} Samples</div>
            </div>
            <div className="rounded-[2rem] border border-orange-500/20 bg-orange-500/5 p-6 text-center">
              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-2">🔥 VCP Performance</div>
              <div className={`text-2xl font-display font-bold ${parseFloat(res.vcpWr) >= 55 ? "text-emerald-400" : "text-orange-400"}`}>{res.vcpWr}%</div>
              <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">{res.vcpN} Samples</div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 overflow-hidden shadow-2xl">
            <div className="bg-zinc-800/40 px-6 py-4 border-b border-zinc-800/60">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Signal Verdict Analysis</h4>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {Object.entries(res.byRec).map(([rec, v]) => (
                <div key={rec} className="flex justify-between items-center px-6 py-4 hover:bg-zinc-800/20 transition-all">
                  <Chip t={rec} sm />
                  <div className="flex gap-6 items-center">
                    <div className="text-right">
                      <div className="text-[9px] text-zinc-600 font-bold uppercase">Volume</div>
                      <div className="text-sm font-display font-bold text-white">{v.n}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-zinc-600 font-bold uppercase">Win %</div>
                      <div className={`text-sm font-display font-bold ${parseFloat(v.wr) >= 55 ? "text-emerald-400" : "text-red-400"}`}>{v.wr}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-zinc-600 font-bold uppercase">Alpha</div>
                      <div className={`text-sm font-display font-bold ${parseFloat(v.ar) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{v.ar}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-cyan-500/20 bg-cyan-500/5 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-xl">🤖</div>
              <div>
                <h4 className="text-base font-display font-bold text-white">AI Quantitative Insight</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Powered by Claude Analytic Engine</p>
              </div>
            </div>

            {aiT ? (
              <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 rounded-3xl p-6 border border-zinc-800/60 whitespace-pre-wrap font-medium">
                {aiT}
              </div>
            ) : (
              <button onClick={askClaude} disabled={ld} className={`w-full py-5 rounded-[2rem] text-sm font-bold border transition-all ${ld ? "bg-cyan-900/40 text-cyan-400 border-cyan-800 animate-pulse" : "bg-cyan-500 text-black border-cyan-500 hover:bg-cyan-400 shadow-xl shadow-cyan-500/10"}`}>
                {ld ? "Quantum Computing in Progress..." : "Run Performance Forecast"}
              </button>
            )}
          </div>
        </div>
      )}
      {res?.empty && <div className="text-center text-zinc-600 py-24 font-medium italic opacity-60">Collect at least 48 hours of signal data for quantitative analysis.</div>}
    </div>
  );
}

// ─ Settings ──────────────────────────────────────────────────
function Settings({ tg, onChange, stocks, lastReport, setLastReport }) {
  const [testR, setTestR] = useState(null);
  const test = async () => { const ok = await tgSend(tg.botToken, tg.chatId, "✅ NASDAQ AI Agent v4.0 Connected!\nCandlestick Patterns + Minervini + RS Rating + VCP Active."); setTestR(ok ? "✅ Dispatched!" : "❌ Error."); };
  const sendNow = async () => { if (!stocks.length) return; const ok = await tgSend(tg.botToken, tg.chatId, buildDailyMsg(stocks)); setTestR(ok ? "✅ Report Sent!" : "❌ Dispatch Failed."); if (ok) { const t = new Date().toDateString(); setLastReport(t); window.storage?.set("last_report_v4", t).catch(() => { }); } };
  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-xl text-emerald-500 shadow-lg shadow-emerald-500/5">📲</div>
          <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest">Telegram Integration</h3>
        </div>
        <div className="space-y-4 mb-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Bot Token</label>
            <input type="password" value={tg.botToken} onChange={e => onChange({ ...tg, botToken: e.target.value })} placeholder="Enter Bot API Token" className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Chat ID</label>
            <input value={tg.chatId} onChange={e => onChange({ ...tg, chatId: e.target.value })} placeholder="Enter Target Chat ID" className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[["enabled", "Telegram Alerts"], ["dailyReport", "Morning Report (09:00)"], ["alarmNotif", "Asset Alarms"], ["slTpNotif", "SL/TP Monitoring"]].map(([k, l]) => (
            <div key={k} onClick={() => onChange({ ...tg, [k]: !tg[k] })} className={`flex items-center justify-between cursor-pointer p-4 rounded-2xl border transition-all ${tg[k] ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-800/30 border-zinc-800/50 hover:border-zinc-700"}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${tg[k] ? "text-emerald-400" : "text-zinc-500"}`}>{l}</span>
              <div className={`w-12 h-6 rounded-full relative transition-colors p-1 ${tg[k] ? "bg-emerald-500" : "bg-zinc-700"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${tg[k] ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={test} disabled={!tg.botToken || !tg.chatId} className="py-4 rounded-2xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-sm font-bold disabled:opacity-30 transition-all uppercase tracking-widest">Send Test</button>
          <button onClick={sendNow} disabled={!tg.enabled || !stocks.length} className="py-4 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 text-sm font-bold disabled:opacity-30 transition-all uppercase tracking-widest">Force Report</button>
        </div>
        {testR && <div className="mt-4 text-xs font-bold text-center uppercase tracking-widest animate-pulse text-cyan-400">{testR}</div>}
      </div>
      <div className="rounded-[2.5rem] border border-zinc-800/60 bg-gradient-to-br from-zinc-900/40 to-transparent p-8 shadow-2xl">
        <h3 className="text-lg font-display font-bold text-white mb-6 uppercase tracking-widest">Installation Control</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-zinc-300 font-bold text-xs uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">iOS Safari</div>
            <div className="text-xs text-zinc-500 leading-relaxed font-medium">Share Icon → Add to Home Screen</div>
          </div>
          <div className="space-y-2">
            <div className="text-zinc-300 font-bold text-xs uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">Android Chrome</div>
            <div className="text-xs text-zinc-500 leading-relaxed font-medium">Menu ⋮ → Install App</div>
          </div>
          <div className="space-y-2">
            <div className="text-zinc-300 font-bold text-xs uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">Desktop Chrome</div>
            <div className="text-xs text-zinc-500 leading-relaxed font-medium">URL Bar → Install Icon ⊕</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CORE APPLICATION
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: "scanner", icon: "📊", l: "Scanner" },
  { id: "sectors", icon: "🗂️", l: "Sectors" },
  { id: "minervini", icon: "📐", l: "Minervini" },
  { id: "penny", icon: "💎", l: "Penny" },
  { id: "portfolio", icon: "💼", l: "Portfolio" },
  { id: "alarms", icon: "🔔", l: "Alarms" },
  { id: "analysis", icon: "🔬", l: "Audit" },
  { id: "settings", icon: "⚙️", l: "Settings" },
];

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [prog, setProg] = useState({ done: 0, total: 0, phase: "" });
  const [tab, setTab] = useState("scanner");
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [sortBy, setSortBy] = useState("score");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isDemo, setIsDemo] = useState(true);
  const [pennyOn, setPennyOn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastReport, setLastReport] = useState("");
  const [tg, setTg] = useState({ botToken: "", chatId: "", enabled: false, dailyReport: true, alarmNotif: true, slTpNotif: true });
  const [isDark, setIsDark] = useState(true);
  const spyClosesRef = useRef([]);

  useEffect(() => {
    const saved = localStorage.getItem("nasdaq_theme");
    if (saved) setIsDark(saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("nasdaq_theme", next ? "dark" : "light");
  };

  const theme = {
    bg: isDark ? "bg-[#09090b]" : "bg-[#f8fafc]",
    text: isDark ? "text-zinc-100" : "text-zinc-900",
    muted: isDark ? "text-zinc-500" : "text-zinc-500",
    border: isDark ? "border-zinc-800/60" : "border-zinc-200",
    header: isDark ? "bg-[#09090b]/80" : "bg-white/80",
    card: isDark ? "bg-zinc-900/40" : "bg-white",
    cardBorder: isDark ? "border-zinc-800/50" : "border-zinc-200",
    input: isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200",
    rowHover: isDark ? "hover:bg-zinc-800/40" : "hover:bg-zinc-50",
    tabActive: isDark ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-cyan-50 border-cyan-500 text-cyan-700",
    tabInactive: isDark ? "border-zinc-800 text-zinc-500 hover:border-zinc-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-300",
  };

  // PWA meta
  useEffect(() => {
    [["mobile-web-app-capable", "yes"], ["apple-mobile-web-app-capable", "yes"], ["apple-mobile-web-app-status-bar-style", "black-translucent"], ["apple-mobile-web-app-title", "NASDAQ AI"], ["theme-color", "#09090b"], ["viewport", "width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"]].forEach(([n, c]) => { let e = document.querySelector(`meta[name="${n}"]`); if (!e) { e = document.createElement("meta"); e.name = n; document.head.appendChild(e); } e.content = c; });
    const manifest = { name: "NASDAQ AI Agent v4", short_name: "NASDAQ AI", start_url: "/", display: "standalone", background_color: "#09090b", theme_color: "#09090b" };
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    let link = document.querySelector("link[rel='manifest']");
    if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
    link.href = url;
    return () => URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    window.storage?.get("tg_cfg_v4").then(r => { if (r?.value) setTg(JSON.parse(r.value)); }).catch(() => { });
    window.storage?.get("last_report_v4").then(r => { if (r?.value) setLastReport(r.value); }).catch(() => { });
  }, []);

  const saveTg = cfg => { setTg(cfg); window.storage?.set("tg_cfg_v4", JSON.stringify(cfg)).catch(() => { }); };
  const showToast = n => { setToast(n); setTimeout(() => setToast(null), 5000); };

  // Günlük rapor
  useEffect(() => {
    const check = () => {
      const now = new Date(), today = now.toDateString();
      if (tg.enabled && tg.dailyReport && tg.botToken && tg.chatId && lastReport !== today && stocks.length > 0) {
        if (now.getHours() === 9 && now.getMinutes() < 5) {
          tgSend(tg.botToken, tg.chatId, buildDailyMsg(stocks)).then(ok => {
            if (ok) { setLastReport(today); window.storage?.set("last_report_v4", today).catch(() => { }); }
          });
        }
      }
    };
    check(); const id = setInterval(check, 5 * 60 * 1000); return () => clearInterval(id);
  }, [tg, stocks, lastReport]);

  const scan = useCallback(async (demo = false, penny = false) => {
    setScanning(true); setStocks([]);
    const syms = [...new Set([...Object.values(SECTORS).flatMap(s => s.syms), ...(penny ? PENNY_SYMS : [])])];
    setProg({ done: 0, total: syms.length, phase: "Initializing system..." });

    if (demo) {
      setStocks(syms.map(s => mockStock(s)));
      setProg({ done: syms.length, total: syms.length, phase: "Demo environment loaded" });
      setLastUpdated(new Date()); setScanning(false); return;
    }

    // SPY verisi — RS Rating için (bir kez al)
    setProg(p => ({ ...p, phase: "Calculating SPY benchmark..." }));
    const spyHist = await fetchHistory("SPY");
    if (spyHist) spyClosesRef.current = spyHist.map(d => d.c);

    // Batch quotes
    const qm = {};
    for (let i = 0; i < syms.length; i += 20) {
      try { const qs = await fetchBatchQuotes(syms.slice(i, i + 20)); qs.forEach(q => { qm[q.symbol] = q; }); } catch { }
      await new Promise(r => setTimeout(r, 1000));
    }

    const results = [];
    // Sequential processing to avoid YF rate limits, but slightly faster
    for (let i = 0; i < syms.length; i++) {
      setProg({ done: i + 1, total: syms.length, phase: `Feeding: ${syms[i]}...` });
      const s = await buildStock(syms[i], qm[syms[i]], spyClosesRef.current);
      if (s) { results.push(s); setStocks([...results]); }
      if (i < syms.length - 1) await new Promise(r => setTimeout(r, 800)); // Reduced from 1100ms
    }
    setLastUpdated(new Date()); setScanning(false);
  }, []);

  useEffect(() => { scan(true, false); }, []);
  useEffect(() => { if (!scanning) scan(isDemo, pennyOn); }, [pennyOn]);

  const selectStock = s => { setSelected(s); setShowDetail(true); };

  // Filtreleme
  const pennyStocks = stocks.filter(s => s.isPenny || s.price < 2);
  const baseList = tab === "penny" ? pennyStocks : stocks;
  const visible = baseList.filter(s => {
    const ms = s.symbol.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "ALL" ? true
      : filter === "BUY" ? s.score >= 65
        : filter === "OVERSOLD" ? (s.rsi < 35 || s.stochK < 25 || s.cci < -100)
          : filter === "UPTREND" ? s.trend === "UP"
            : filter === "HIGH_VOL" ? s.volRatio > 2
              : filter === "GOLDEN" ? s.cross === "GOLDEN"
                : filter === "MVN" ? s.minervini?.pass
                  : filter === "VCP" ? s.isVCP
                    : filter === "RS80" ? (s.rsRating && s.rsRating >= 80)
                      : filter === "CANDLE" ? s.candlePatterns?.length > 0
                        : true;
    return ms && mf;
  }).sort((a, b) =>
    sortBy === "score" ? b.score - a.score
      : sortBy === "change" ? b.change - a.change
        : sortBy === "rsi" ? (a.rsi || 99) - (b.rsi || 99)
          : sortBy === "rs" ? (b.rsRating || 0) - (a.rsRating || 0)
            : sortBy === "vol" ? b.volRatio - a.volRatio
              : 0
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-4 right-4 z-[100] rounded-3xl border border-cyan-500/30 bg-zinc-900/90 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="text-sm font-display font-bold text-cyan-400 uppercase tracking-widest">{toast.title}</div>
          <div className="text-xs text-zinc-400 mt-1 font-medium">{toast.msg?.slice(0, 120)}</div>
        </div>
      )}

      {/* Detail Modal Overlay */}
      {showDetail && selected && <StockDetail stock={selected} onClose={() => setShowDetail(false)} isModal={true} />}

      {/* ── PREMIUM HEADER ── */}
      <header className={`border-b ${theme.border} ${theme.header} backdrop-blur-xl sticky top-0 z-40 transition-all duration-300`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-cyan-500/20 group cursor-pointer hover:scale-110 transition-transform">
              <span className="text-white text-2xl group-hover:rotate-12 transition-transform">⚡</span>
            </div>
            <div>
              <h1 className={`text-xl font-display font-black tracking-tight ${theme.text} flex items-center gap-2`}>
                NASDAQ AI <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">PRO</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80 italic">v4.0.1 ENTERPRISE</span>
                {tg.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Secure Link Established"></span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 mr-4 bg-zinc-800/20 rounded-2xl p-1 border border-zinc-800/40">
              <button onClick={() => { setIsDemo(true); scan(true, pennyOn); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDemo ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-zinc-500 hover:text-zinc-300"}`}>Simulation</button>
              <button onClick={() => { setIsDemo(false); scan(false, pennyOn); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDemo ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "text-zinc-500 hover:text-zinc-300"}`}>Live Edge</button>
            </div>

            <button onClick={toggleTheme} className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${theme.border} ${isDark ? "bg-zinc-900 text-amber-400" : "bg-white text-indigo-600"} hover:scale-105 transition-all shadow-lg`}>
              {isDark ? "🔆" : "🌙"}
            </button>

            {lastUpdated && <div className="hidden sm:flex flex-col items-end mr-1 text-right">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Last Feed</span>
              <span className="text-[11px] font-display font-bold text-zinc-300">{lastUpdated.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>}
          </div>
        </div>

        {/* Dynamic Progress Indicator */}
        {scanning && (
          <div className="px-6 pb-3 max-w-screen-2xl mx-auto">
            <div className="flex justify-between items-end text-[9px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] mb-1.5">
              <span>{prog.phase}</span>
              <span className="text-zinc-500">{prog.done} / {prog.total} PACKETS</span>
            </div>
            <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-zinc-900">
              <div className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-500 relative" style={{ width: `${prog.total ? Math.round(prog.done / prog.total * 100) : 0}%` }}>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex px-6 pb-4 gap-2 overflow-x-auto max-w-screen-2xl mx-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-[1.25rem] border text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${tab === t.id ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-500/5" : "bg-transparent border-zinc-800/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
              <span className="text-sm grayscale opacity-70 group-hover:grayscale-0">{t.icon}</span> {t.l}
            </button>
          ))}
        </div>
      </header>

      {/* ── CORE ENGINE CONTENT ── */}
      <main className="px-5 pt-8 pb-32 md:pb-12 max-w-screen-2xl mx-auto min-h-[calc(100vh-160px)]">
        {/* Scanner & Penny Flow */}
        {(tab === "scanner" || tab === "penny") && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {tab === "penny" && (
              <div className="rounded-[2rem] border border-violet-500/30 bg-violet-600/10 p-6 flex items-center gap-5 shadow-2xl backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-3xl">🧩</div>
                <div>
                  <h4 className="text-base font-display font-bold text-violet-400 uppercase tracking-widest">Micro-Cap High Volatility Zone</h4>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1">Hedge fund grade tracking for micro-caps. These instruments carry extreme delta risk. Trading execution requires precision.</p>
                </div>
              </div>
            )}

            {stocks.length > 0 && <TopPicks stocks={tab === "penny" ? pennyStocks : visible.length > 0 ? visible : stocks} onSelect={selectStock} />}

            {/* Advanced Multi-Layer Filters */}
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex-1 flex gap-3">
                <div className="relative flex-1 group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-cyan-500 transition-colors">🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Query Bloomberg/Yahoo Feed..." className="w-full bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/60 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm text-white outline-none focus:border-cyan-500/40 transition-all font-display font-bold placeholder:font-sans placeholder:font-medium placeholder:text-zinc-600 shadow-lg shadow-black/20" />
                </div>
                <div className="relative">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="appearance-none bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/60 rounded-[1.5rem] px-8 pr-12 py-4 text-xs text-zinc-300 outline-none focus:border-cyan-500/40 transition-all font-black uppercase tracking-[0.15em] shadow-lg shadow-black/20 cursor-pointer">
                    <option value="score">Rank: AI IQ</option>
                    <option value="change">Rank: Velocity</option>
                    <option value="rsi">Rank: RSI Divergence</option>
                    <option value="rs">Rank: RS Strength</option>
                    <option value="vol">Rank: Liquidity</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 text-[10px]">▼</div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {[["ALL", "Market Wide"], ["BUY", "High Conviction"], ["MVN", "Trend Template"], ["VCP", "Contraction"], ["RS80", "Relative Str."], ["CANDLE", "Price Action"], ["OVERSOLD", "Mean Reversion"], ["UPTREND", "Trend Rail"]].map(([f, l]) => (
                  <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 text-[10px] font-black uppercase tracking-[0.12em] px-6 py-4 rounded-[1.5rem] border transition-all duration-300 ${filter === f ? "bg-cyan-500 text-black border-cyan-500 shadow-xl shadow-cyan-500/20" : "bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800/40 hover:text-zinc-300"}`}>{l}</button>
                ))}
              </div>
            </div>

            {/* Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-12 xl:col-span-9 space-y-4">
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visible.length === 0 && !scanning && (
                    <div className="col-span-full py-24 text-center">
                      <div className="text-4xl mb-4">🔍</div>
                      <h3 className="text-xl font-display font-bold text-zinc-300 mb-1">Null Pointer Returned</h3>
                      <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Adjust filters or await next data cycle</p>
                    </div>
                  )}
                  {visible.map(s => <StockCard key={s.symbol} s={s} onSelect={selectStock} onAlarm={s => { setSelected(s); setTab("alarms"); }} onPort={s => { setSelected(s); setTab("portfolio"); }} />)}
                </div>

                <div className="hidden md:block rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 shadow-2xl overflow-hidden backdrop-blur-md">
                  <div className="max-h-[70vh] overflow-y-auto no-scrollbar relative">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10 border-b border-zinc-800/80">
                        <tr>
                          {["Terminal", "Metrics", "AI IQ", "Strategy", "Relative Strength", "Stage", "Verdict"].map(h => (
                            <th key={h} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {visible.map(s => (
                          <tr key={s.symbol} onClick={() => selectStock(s)} className="group cursor-pointer hover:bg-cyan-500/5 transition-all">
                            <td className="px-8 py-6">
                              <div className="text-lg font-display font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{s.symbol}</div>
                              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{s.sector.split(" ")[1] || "MARKET"}</div>
                            </td>
                            <td className="px-8 py-6 font-display font-bold text-white text-base">
                              <div><span className="text-zinc-600 text-[10px] block mb-0.5">PRICE</span> ${s.price}</div>
                              <div className={`text-[10px] flex items-center gap-1 font-mono mt-1 ${s.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change)}%
                              </div>
                            </td>
                            <td className="px-8 py-6"><Ring score={s.score} size={48} stroke={3} /></td>
                            <td className="px-8 py-6"><MvnBadge mvn={s.minervini} /></td>
                            <td className="px-8 py-6"><RsBadge rs={s.rsRating} /></td>
                            <td className="px-8 py-6"><StageBadge stage={s.stage} /></td>
                            <td className="px-8 py-6"><Chip t={s.rec} sm /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visible.length === 0 && !scanning && <div className="py-32 text-center text-zinc-600 font-bold uppercase tracking-widest italic opacity-40 text-sm">Waiting for incoming market data packets...</div>}
                  </div>
                </div>
              </div>

              {/* Side Panel Widgets (Desktop Only) */}
              <div className="hidden xl:block xl:col-span-3 space-y-8">
                <div className="rounded-[2.5rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-600/10 to-transparent p-8 shadow-2xl shadow-cyan-500/10">
                  <h4 className="text-sm font-display font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="text-cyan-400">⚡</span> SYSTEM STATUS
                  </h4>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">Feed Status</span>
                      <span className="text-emerald-500 font-mono font-bold">OPERATIONAL</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">Latency</span>
                      <span className="text-cyan-400 font-mono font-bold">42ms</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">AI Core</span>
                      <span className="text-indigo-400 font-mono font-bold">SONNET-4.2</span>
                    </div>
                    <div className="pt-4 border-t border-zinc-800/60 mt-4">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 italic">Terminal Information</div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Real-time analysis active for {stocks.length} instruments across the NASDAQ high-tech and industrial indices.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Context Router */}
        {tab === "sectors" && <SectorView stocks={stocks} onSelect={selectStock} />}
        {tab === "minervini" && <MinerviniScreen stocks={stocks} onSelect={selectStock} />}
        {tab === "portfolio" && <Portfolio stocks={stocks} tg={tg} onNotify={showToast} />}
        {tab === "alarms" && <Alarms stocks={stocks} tg={tg} />}
        {tab === "analysis" && <SigAnalysis stocks={stocks} />}
        {tab === "settings" && <Settings tg={tg} onChange={saveTg} stocks={stocks} lastReport={lastReport} setLastReport={setLastReport} />}
      </main>

      {/* ── PREMIUM MOBILE DOCK ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[env(safe-area-inset-bottom,12px)] pointer-events-none">
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] py-2 px-4 shadow-2xl flex justify-between items-center pointer-events-auto max-w-[500px] mx-auto mb-3">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center justify-center p-2.5 transition-all duration-300 relative ${tab === t.id ? "text-cyan-400" : "text-zinc-600 hover:text-zinc-400"}`}>
              {tab === t.id && <div className="absolute top-0 w-8 h-1 bg-cyan-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse"></div>}
              <span className={`text-xl mb-1 ${tab === t.id ? "scale-125" : "grayscale opacity-60"} transition-all duration-300`}>{t.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-wider transition-all ${tab === t.id ? "opacity-100" : "opacity-40"}`}>{t.l}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── QUANTUM DESIGN SYSTEM OVERRIDES ── */}
      <style>{`
        @keyframes shimmer { 100% { background-position: 48px 0; } }
        .animate-shimmer { animation: shimmer 1.5s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .font-black { font-weight: 900; }
        .tracking-[0.2em] { letter-spacing: 0.2em; }
        .backdrop-blur-xl { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
        .selection\\:bg-cyan-500\\/30 ::selection { background-color: rgba(6, 182, 212, 0.3); }

        /* Smooth tab switching for mobile cards */
        .grid-cols-1 > * { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
}
