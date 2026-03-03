import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// NASDAQ AI AGENT v4.0
// Rakip analizi sonrası eklenen özellikler:
// ✅ 15 Mum Formasyonu (hackingthemarkets)
// ✅ Minervini Trend Template 8 koşul (growth-stock-screener)
// ✅ Weinstein Stage Analizi (Stage 1-4)
// ✅ RS Rating (SPY'a göre güç sıralaması)
// ✅ VCP (Volatility Contraction Pattern)
// ✅ Haber & Sentiment (Yahoo Finance News API ücretsiz)
// ✅ Temel Veriler — P/E, EPS, piyasa değeri, Beta
// ✅ 20 sinyal (13 teknik + 15 mum = ağırlıklı bileşik)
// ═══════════════════════════════════════════════════════════════

const SECTORS = {
  "🤖 Yapay Zeka": { color: "#00d4ff", syms: ["NVDA", "PLTR", "AI", "IONQ", "BBAI", "SOUN", "PATH", "RBRK", "GFAI", "ARQQ"] },
  "💻 Büyük Teknoloji": { color: "#a78bfa", syms: ["AAPL", "MSFT", "META", "GOOGL", "AMZN", "ORCL", "CRM", "ADBE", "IBM", "TOST"] },
  "⚡ Yarı İletken": { color: "#fbbf24", syms: ["AMD", "INTC", "QCOM", "AVGO", "MRVL", "KLAC", "LRCX", "AMAT", "TXN", "MU", "SMCI", "ON"] },
  "☁️ Bulut & SaaS": { color: "#34d399", syms: ["SNOW", "DDOG", "ZS", "CRWD", "NET", "MDB", "CFLT", "OKTA", "HUBS", "BILL", "DOCN"] },
  "💰 Fintech": { color: "#f472b6", syms: ["SOFI", "UPST", "AFRM", "COIN", "HOOD", "NU", "PYPL", "SQ", "DAVE", "LMND"] },
  "🚗 EV & Yeşil": { color: "#86efac", syms: ["RIVN", "LCID", "NIO", "XPEV", "LI", "CHPT", "PLUG", "FSLR", "ENPH", "SEDG", "TSLA"] },
  "🧬 Biyoteknoloji": { color: "#fca5a5", syms: ["MRNA", "BNTX", "REGN", "VRTX", "GILD", "BIIB", "AMGN", "ILMN", "NTLA", "BEAM"] },
  "🚀 Uzay & Savunma": { color: "#c4b5fd", syms: ["RKLB", "ASTS", "SPCE", "LUNR", "KTOS", "BWXT", "HII", "RDW"] },
  "📱 Tüketici Tech": { color: "#fb923c", syms: ["NFLX", "SPOT", "UBER", "LYFT", "ABNB", "DASH", "DUOL", "RBLX", "PINS", "SNAP"] },
  "🖥️ Donanım": { color: "#94a3b8", syms: ["DELL", "HPQ", "STX", "WDC", "PSTG", "NTAP", "ANET", "FFIV"] },
};
const PENNY_SYMS = ["MULN", "FCEL", "NKLA", "WKHS", "GOEV", "AEVA", "CLOV", "MMAT", "SNDL", "TELL", "IMPP", "NLSP", "ATER", "ABEV", "ACB", "TLRY", "CGC", "CRKN", "CLEU", "VERB", "ATXG", "CNET", "MEGL", "BFRI", "SPRC", "NCTY", "USEA", "LIXT", "HPNN", "QNRX"];
const SYM_SECTOR = {};
Object.entries(SECTORS).forEach(([s, { syms }]) => syms.forEach(sym => { SYM_SECTOR[sym] = s; }));

const SECTOR_WEIGHTS = {
  "🤖 Yapay Zeka": { rsi: 1.2, macd: 2.0, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 1.5, bb: 1.2, vol: 1.5, obv: 1.5, roc: 1.8, cross: 2.5, candle: 1.5 },
  "💻 Büyük Teknoloji": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 2.0, bb: 1.0, vol: 1.0, obv: 1.5, roc: 1.2, cross: 2.5, candle: 1.0 },
  "⚡ Yarı İletken": { rsi: 1.5, macd: 2.0, stoch: 1.2, willr: 1.2, cci: 1.2, sma: 1.5, bb: 1.5, vol: 2.0, obv: 1.5, roc: 1.5, cross: 3.0, candle: 1.5 },
  "☁️ Bulut & SaaS": { rsi: 1.0, macd: 1.8, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 1.8, bb: 1.0, vol: 1.2, obv: 2.0, roc: 1.5, cross: 2.5, candle: 1.0 },
  "💰 Fintech": { rsi: 1.5, macd: 2.0, stoch: 1.5, willr: 1.5, cci: 1.5, sma: 1.5, bb: 1.5, vol: 2.0, obv: 2.5, roc: 1.5, cross: 2.0, candle: 1.5 },
  "🚗 EV & Yeşil": { rsi: 2.0, macd: 1.5, stoch: 1.5, willr: 1.5, cci: 1.5, sma: 1.0, bb: 2.0, vol: 2.5, obv: 2.0, roc: 2.0, cross: 2.0, candle: 2.0 },
  "🧬 Biyoteknoloji": { rsi: 2.5, macd: 1.5, stoch: 2.0, willr: 2.0, cci: 2.0, sma: 1.0, bb: 2.0, vol: 3.0, obv: 2.0, roc: 2.5, cross: 1.5, candle: 2.0 },
  "🚀 Uzay & Savunma": { rsi: 1.5, macd: 2.0, stoch: 1.5, willr: 1.5, cci: 1.5, sma: 1.5, bb: 1.5, vol: 2.0, obv: 1.5, roc: 2.0, cross: 2.5, candle: 1.5 },
  "📱 Tüketici Tech": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 2.0, bb: 1.5, vol: 1.5, obv: 1.5, roc: 1.5, cross: 2.0, candle: 1.0 },
  "🖥️ Donanım": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 2.0, bb: 1.0, vol: 1.5, obv: 2.0, roc: 1.0, cross: 2.5, candle: 1.0 },
  "💎 Penny": { rsi: 2.0, macd: 1.5, stoch: 2.0, willr: 2.0, cci: 1.5, sma: 0.8, bb: 2.0, vol: 3.5, obv: 3.0, roc: 2.5, cross: 1.0, candle: 2.5 },
  "default": { rsi: 1.0, macd: 1.5, stoch: 1.0, willr: 1.0, cci: 1.0, sma: 1.5, bb: 1.0, vol: 1.5, obv: 1.5, roc: 1.0, cross: 2.0, candle: 1.2 },
};
const getW = s => SECTOR_WEIGHTS[s] || SECTOR_WEIGHTS["default"];

// ═══════════════════════════════════════════════════════════════
// TEKNİK İNDİKATÖRLER
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
// 15 MUM FORMASYONU TESPİTİ (hackingthemarkets'ten ilham)
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
  // 1. Hammer (Çekiç) — düşük gölge gövdenin 2x+, üst gölge küçük
  if (lowerShadow(o2, l2, c2) > body(o2, c2) * 2 && upperShadow(o2, h2, c2) < body(o2, c2) * 0.5)
    patterns.push({ name: "🔨 Hammer", bull: true, strength: 2 });

  // 2. Inverted Hammer (Ters Çekiç)
  if (upperShadow(o2, h2, c2) > body(o2, c2) * 2 && lowerShadow(o2, l2, c2) < body(o2, c2) * 0.5 && isBull(o2, c2))
    patterns.push({ name: "🔨 Ters Çekiç", bull: true, strength: 1.5 });

  // 3. Bullish Engulfing (Boğa Yutması)
  if (isBear(o1, c1) && isBull(o2, c2) && o2 < c1 && c2 > o1 && body(o2, c2) > body(o1, c1) * 1.1)
    patterns.push({ name: "🟢 Boğa Yutması", bull: true, strength: 3 });

  // 4. Piercing Line (Delici Çizgi)
  if (isBear(o1, c1) && isBull(o2, c2) && o2 < l1 && c2 > (o1 + c1) / 2 && c2 < o1)
    patterns.push({ name: "📈 Delici Çizgi", bull: true, strength: 2.5 });

  // 5. Morning Star (Sabah Yıldızı)
  if (isBear(o0, c0) && body(o1, c1) < avgBody * 0.4 && isBull(o2, c2) && c2 > (o0 + c0) / 2 && body(o0, c0) > avgBody * 0.8)
    patterns.push({ name: "⭐ Sabah Yıldızı", bull: true, strength: 3 });

  // 6. Three White Soldiers (Üç Beyaz Asker)
  if (isBull(o0, c0) && isBull(o1, c1) && isBull(o2, c2) &&
    o1 > o0 && o1 < c0 && o2 > o1 && o2 < c1 &&
    body(o0, c0) > avgBody * 0.7 && body(o1, c1) > avgBody * 0.7 && body(o2, c2) > avgBody * 0.7)
    patterns.push({ name: "⚔️ 3 Beyaz Asker", bull: true, strength: 3 });

  // 7. Bullish Harami (Boğa Haramisi)
  if (isBear(o1, c1) && body(o1, c1) > avgBody && Math.abs(c2 - o2) < body(o1, c1) * 0.5 && c2 > c1 && o2 > c1)
    patterns.push({ name: "🤱 Boğa Haramisi", bull: true, strength: 2 });

  // 8. Tweezer Bottom (Cımbız Dip)
  if (Math.abs(l1 - l2) < (range(h2, l2) * 0.02) && isBear(o1, c1) && isBull(o2, c2))
    patterns.push({ name: "🔧 Cımbız Dip", bull: true, strength: 2 });

  // 9. Doji Star Bullish — doji ardından boğa mumu
  if (body(o1, c1) < range(h1, l1) * 0.1 && isBull(o2, c2) && c2 > h1)
    patterns.push({ name: "✨ Doji Boğa", bull: true, strength: 1.5 });

  // ── AYI FORMASYONLARI ──────────────────────────────────────
  // 10. Shooting Star (Kayan Yıldız)
  if (upperShadow(o2, h2, c2) > body(o2, c2) * 2 && lowerShadow(o2, l2, c2) < body(o2, c2) * 0.5 && isBear(o2, c2))
    patterns.push({ name: "💫 Kayan Yıldız", bull: false, strength: 2 });

  // 11. Bearish Engulfing (Ayı Yutması)
  if (isBull(o1, c1) && isBear(o2, c2) && o2 > c1 && c2 < o1 && body(o2, c2) > body(o1, c1) * 1.1)
    patterns.push({ name: "🔴 Ayı Yutması", bull: false, strength: 3 });

  // 12. Dark Cloud Cover (Karanlık Bulut)
  if (isBull(o1, c1) && isBear(o2, c2) && o2 > h1 && c2 < (o1 + c1) / 2 && c2 > c1)
    patterns.push({ name: "☁️ Karanlık Bulut", bull: false, strength: 2.5 });

  // 13. Evening Star (Akşam Yıldızı)
  if (isBull(o0, c0) && body(o1, c1) < avgBody * 0.4 && isBear(o2, c2) && c2 < (o0 + c0) / 2 && body(o0, c0) > avgBody * 0.8)
    patterns.push({ name: "🌆 Akşam Yıldızı", bull: false, strength: 3 });

  // 14. Three Black Crows (Üç Kara Karga)
  if (isBear(o0, c0) && isBear(o1, c1) && isBear(o2, c2) &&
    o1 < o0 && o1 > c0 && o2 < o1 && o2 > c1 &&
    body(o0, c0) > avgBody * 0.7 && body(o1, c1) > avgBody * 0.7 && body(o2, c2) > avgBody * 0.7)
    patterns.push({ name: "🦅 3 Kara Karga", bull: false, strength: 3 });

  // 15. Bearish Harami (Ayı Haramisi)
  if (isBull(o1, c1) && body(o1, c1) > avgBody && Math.abs(c2 - o2) < body(o1, c1) * 0.5 && c2 < c1 && o2 < c1)
    patterns.push({ name: "🤱 Ayı Haramisi", bull: false, strength: 2 });

  const bullScore = patterns.filter(p => p.bull).reduce((a, p) => a + p.strength, 0);
  const bearScore = patterns.filter(p => !p.bull).reduce((a, p) => a + p.strength, 0);

  return { patterns, bullScore, bearScore };
}

// ═══════════════════════════════════════════════════════════════
// MİNERVİNİ TREND TEMPLATE (8 KOŞUL)
// growth-stock-screener'dan ilham
// ═══════════════════════════════════════════════════════════════

function minerviniTemplate(closes, highs, price, sma50, sma150, sma200, high52w, low52w) {
  if (!sma50 || !sma150 || !sma200 || !price) return { score: 0, conditions: [], pass: false };

  // SMA200 trendi (son 20 gün)
  const sma200Old = I.sma(closes.slice(0, -20), Math.min(200, closes.length - 20));
  const sma200Rising = sma200Old ? sma200 > sma200Old : false;

  const conditions = [
    { label: "Fiyat > SMA150", pass: price > sma150, weight: 1 },
    { label: "Fiyat > SMA200", pass: price > sma200, weight: 1 },
    { label: "SMA150 > SMA200", pass: sma150 > sma200, weight: 1 },
    { label: "SMA200 Yükseliyor", pass: sma200Rising, weight: 1.5 },
    { label: "SMA50 > SMA150", pass: sma50 > sma150, weight: 1 },
    { label: "SMA50 > SMA200", pass: sma50 > sma200, weight: 1 },
    { label: "Dip'ten %30+ Uzak", pass: high52w ? price > low52w * 1.3 : false, weight: 1.5 },
    { label: "Zirveye %25 Yakın", pass: high52w ? price >= high52w * 0.75 : false, weight: 1 },
  ];

  const passCount = conditions.filter(c => c.pass).length;
  const score = Math.round(passCount / conditions.length * 100);
  const pass = passCount >= 7; // 8'den 7+ geçince "Minervini Geçer"

  return { score, conditions, pass, passCount, total: conditions.length };
}

// ═══════════════════════════════════════════════════════════════
// WEİNSTEİN STAGE ANALİZİ (Stage 1-4)
// ═══════════════════════════════════════════════════════════════

function weinsteinStage(price, sma30, sma30Trend, sma200) {
  if (!price || !sma30) return { stage: 0, label: "Yetersiz Veri", color: "#6b7280" };
  // Stage 1: Taban (SMA30 düz, fiyat etrafında)
  // Stage 2: Yükseliş (fiyat > SMA30, SMA30 yükseliyor)
  // Stage 3: Zirve (fiyat > SMA30 ama SMA30 düzleşiyor)
  // Stage 4: Düşüş (fiyat < SMA30, SMA30 düşüyor)
  if (price > sma30 && sma30Trend > 0 && (!sma200 || price > sma200))
    return { stage: 2, label: "Stage 2 — Yükseliş 🚀", color: "#10b981" };
  if (price < sma30 && sma30Trend < 0)
    return { stage: 4, label: "Stage 4 — Düşüş 🔻", color: "#ef4444" };
  if (price > sma30 && Math.abs(sma30Trend) < 0.5)
    return { stage: 3, label: "Stage 3 — Dağılım ⚠️", color: "#f59e0b" };
  return { stage: 1, label: "Stage 1 — Taban 📦", color: "#94a3b8" };
}

// ═══════════════════════════════════════════════════════════════
// RS RATING (SPY'a göre göreli güç, 0-99)
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
// Daralan bollinger bantları + azalan hacim = fırsat
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
// BİLEŞİK SKOR — 13 Teknik + Mum Formasyonu
// ═══════════════════════════════════════════════════════════════

function compositeScore(d, sector) {
  const w = getW(sector);
  const sigs = [];
  const push = (name, bull, base, mul = 1) => sigs.push({ name, bull, w: +(base * mul).toFixed(2) });

  if (d.rsi != null) { const b = d.rsi < 30 || d.rsi > 70 ? 2 : 1; push("RSI", d.rsi < 30 ? true : d.rsi > 70 ? false : d.rsi < 45, b, w.rsi); }
  if (d.macd != null && d.sig != null) { push("MACD", d.macd > d.sig, 2, w.macd); push("MACD Sıfır", d.macd > 0, 1, w.macd * 0.5); }
  if (d.stochK != null) push("Stoch", d.stochK < 20 ? true : d.stochK > 80 ? false : d.stochK < 50, d.stochK < 20 || d.stochK > 80 ? 2 : 1, w.stoch);
  if (d.willr != null) push("W%R", d.willr < -80 ? true : d.willr > -20 ? false : d.willr < -50, d.willr < -80 || d.willr > -20 ? 2 : 1, w.willr);
  if (d.cci != null) push("CCI", d.cci < -100 ? true : d.cci > 100 ? false : d.cci < 0, d.cci < -100 || d.cci > 100 ? 2 : 1, w.cci);
  if (d.price && d.sma20) push("SMA20", d.price > d.sma20, 1.5, w.sma);
  if (d.price && d.sma50) push("SMA50", d.price > d.sma50, 2, w.sma);
  if (d.sma20 && d.sma50) push("SMA Trend", d.sma20 > d.sma50, 1.5, w.sma * 0.7);
  if (d.price && d.bb) push("BB", d.price < d.bb.lower ? true : d.price > d.bb.upper ? false : d.price < d.bb.mid, d.price < d.bb.lower || d.price > d.bb.upper ? 2 : 1, w.bb);
  if (d.volRatio) push("Hacim", d.volRatio > 1.5, d.volRatio > 2.5 ? 3 : 1.5, w.vol);
  if (d.roc != null) push("ROC", d.roc > 0, 1, w.roc);
  if (d.obvTrend) push("OBV", d.obvTrend === "UP", 1.5, w.obv);
  if (d.cross === "GOLDEN") push("✨Golden", true, 3, w.cross);
  else if (d.cross === "DEATH") push("💀Death", false, 3, w.cross);
  // 15 mum formasyonu bileşik sinyali
  if (d.candleBull > 0) push("🕯️ Mum Boğa", true, Math.min(d.candleBull, 3), w.candle);
  if (d.candleBear > 0) push("🕯️ Mum Ayı", false, Math.min(d.candleBear, 3), w.candle);
  // Minervini bonus
  if (d.minerviniPass) push("📐 Minervini", true, 3, 1.5);
  // VCP bonus
  if (d.vcpDetected) push("🔥 VCP", true, 2, 1.2);

  const bullW = sigs.filter(s => s.bull).reduce((a, s) => a + s.w, 0);
  const totW = sigs.reduce((a, s) => a + s.w, 0);
  return { score: Math.max(0, Math.min(100, totW > 0 ? Math.round(26 + (bullW / totW) * 74) : 50)), signals: sigs };
}

const scoreRec = s => s >= 75 ? "GÜÇLÜ AL" : s >= 62 ? "AL" : s >= 45 ? "BEKLE" : s >= 32 ? "SAT" : "GÜÇLÜ SAT";

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
  const sentiment = score > 1 ? "POZİTİF 📈" : score < -1 ? "NEGATİF 📉" : "NÖTR";
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
      rsiSignal: rsi < 30 ? "AŞIRI SATIM" : rsi > 70 ? "AŞIRI ALIM" : "NÖTR",
      macdSignal: macdR.macd > macdR.sig ? "BOĞA" : "AYI",
      trend: price > sma20 && sma20 > sma50 ? "YUKARI" : price < sma20 && sma20 < sma50 ? "AŞAĞI" : "YATAY",
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
    rsiSignal: rsi < 30 ? "AŞIRI SATIM" : rsi > 70 ? "AŞIRI ALIM" : "NÖTR",
    macdSignal: macdR.macd > macdR.sig ? "BOĞA" : "AYI",
    trend: price > sma20 && sma20 > sma50 ? "YUKARI" : price < sma20 && sma20 < sma50 ? "AŞAĞI" : "YATAY",
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
  const date = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  let m = `🌅 <b>NASDAQ AI AGENT v4.0 — Günlük Rapor</b>\n📅 ${date}\n\n<b>🏆 Top 5 Fırsat:</b>\n`;
  top5.forEach((s, i) => {
    const tags = [s.minervini?.pass ? "📐MVN" : "", s.isVCP ? "🔥VCP" : "", s.rsRating >= 80 ? "⭐RS" : s.rsRating >= 60 ? "RS" + "" + s.rsRating : ""].filter(Boolean).join(" ");
    m += `\n${i + 1}. <b>${s.symbol}</b> $${s.price} (${s.change >= 0 ? "+" : ""}${s.change}%)\n`;
    m += `Skor:${s.score} | ${s.stage?.label || ""} | ${tags}\n`;
    m += `RS:${s.rsRating} | RSI:${s.rsi} | ${s.candlePatterns?.[0]?.name || ""}\n`;
  });
  m += `\n📊 ${stocks.length} hisse · ${new Date().toLocaleTimeString("tr-TR")}`;
  return m;
}
const alarmMsg = (a, s) => `⚡ <b>ALARM: ${s.symbol}</b>\n$${s.price} (${s.change >= 0 ? "+" : ""}${s.change}%)\n${a.type} ${a.value}\nSkor:${s.score} | ${s.stage?.label || ""}\nRS Rating: ${s.rsRating}\n📅 ${new Date().toLocaleString("tr-TR")}`;
const slTpMsg = (h, t, cur) => `${t === "SL" ? "🛑" : "🎯"} <b>${t}: ${h.symbol}</b>\nFiyat:$${cur} | ${t === "SL" ? "SL" : "TP"}:$${t === "SL" ? h.sl : h.tp}\nAlış:$${h.cost} | K/Z:${((cur - h.cost) / h.cost * 100).toFixed(2)}%\n📅 ${new Date().toLocaleString("tr-TR")}`;

// ═══════════════════════════════════════════════════════════════
// UI ATOM BİLEŞENLERİ
// ═══════════════════════════════════════════════════════════════

const REC_CLS = {
  "GÜÇLÜ AL": "bg-emerald-500/20 text-emerald-100 border-emerald-500",
  "AL": "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  "BEKLE": "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  "SAT": "bg-red-900/50 text-red-300 border-red-700",
  "GÜÇLÜ SAT": "bg-red-500/20 text-red-100 border-red-500",
};

function Chip({ t, sm }) {
  return (<span className={`font-bold border tracking-wider ${sm ? "text-[9px] px-1.5 py-0.5 rounded" : "text-[11px] px-2 py-1 rounded-lg"} ${REC_CLS[t] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>{t}</span>);
}

function Ring({ score, size = 44 }) {
  const r = size / 2 - 4, circ = 2 * Math.PI * r, col = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (<div style={{ width: size, height: size }} className="relative flex items-center justify-center flex-shrink-0">
    <svg className="-rotate-90" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
    <span className="absolute font-bold" style={{ fontSize: size * 0.22, color: col }}>{score}</span>
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
  const col = rs >= 90 ? "text-emerald-300 bg-emerald-950/50 border-emerald-700" : rs >= 70 ? "text-yellow-300 bg-yellow-950/50 border-yellow-700" : rs >= 50 ? "text-zinc-400 bg-zinc-800 border-zinc-700" : "text-red-400 bg-red-950/30 border-red-800";
  return <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded font-mono ${col}`}>RS {rs}</span>;
}

// Minervini Badge
function MvnBadge({ mvn }) {
  if (!mvn) return null;
  return mvn.pass
    ? <span className="text-[9px] font-bold border border-amber-600 bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded">📐 MVN</span>
    : <span className="text-[9px] text-zinc-700 border border-zinc-800 px-1.5 py-0.5 rounded">{mvn.passCount}/8</span>;
}

// Stage badge
function StageBadge({ stage }) {
  if (!stage || stage.stage === 0) return null;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: stage.color, border: `1px solid ${stage.color}40`, background: `${stage.color}15` }}>{stage.label}</span>;
}

// Mum formasyon badge (en güçlü formasyon)
function CandleBadge({ patterns }) {
  if (!patterns?.length) return null;
  const top = patterns.sort((a, b) => b.strength - a.strength)[0];
  return <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${top.bull ? "border-emerald-800 bg-emerald-950/30 text-emerald-400" : "border-red-800 bg-red-950/30 text-red-400"}`}>{top.name}</span>;
}

// Piyasa değeri formatı
function fmtMcap(n) {
  if (!n) return "—"; if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`; if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`; return `$${(n / 1e6).toFixed(0)}M`;
}

// ─ Hisse Kartı (Mobile) ───────────────────────────────────────
function StockCard({ s, onSelect, onAlarm, onPort }) {
  const up = s.change >= 0;
  return (
    <div onClick={() => onSelect(s)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base font-bold font-mono text-white">{s.symbol}</span>
            {s.isPenny && <span className="text-[8px] text-violet-400 border border-violet-700 px-1 py-0.5 rounded">PENNY</span>}
            {s.minervini?.pass && <span className="text-[9px] text-amber-400">📐</span>}
            {s.isVCP && <span className="text-[9px] text-orange-400">🔥</span>}
            {s.cross === "GOLDEN" && <span className="text-[9px] text-yellow-400">✨</span>}
            {s.cross === "DEATH" && <span className="text-[9px] text-red-400">💀</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <SecDot sector={s.sector} />
            <span className="text-[10px] text-zinc-600 truncate">{s.sector}</span>
            <RsBadge rs={s.rsRating} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-base font-mono font-bold text-white">${s.price}</div>
            <div className={`text-xs font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{s.change}%</div>
          </div>
          <Ring score={s.score} size={40} />
        </div>
      </div>
      <Spark data={s.sparkline} w={200} h={28} />
      <div className="mt-2 mb-2"><SigBar sigs={s.signals} /></div>
      {/* Mum formasyonu varsa göster */}
      {s.candlePatterns?.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {s.candlePatterns.slice(0, 3).map((p, i) => (
            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${p.bull ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-400" : "border-red-800/60 bg-red-950/30 text-red-400"}`}>{p.name}</span>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 flex-wrap items-center">
          <Chip t={s.rec} sm />
          <StageBadge stage={s.stage} />
          {s.rsRating >= 80 && <span className="text-[9px] text-emerald-400 font-mono">⭐RS{s.rsRating}</span>}
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${s.volRatio > 1.5 ? "text-yellow-400 bg-yellow-900/30" : "text-zinc-600"}`}>{s.volRatio}x</span>
        </div>
        <div className="flex gap-2">
          <button onClick={e => { e.stopPropagation(); onAlarm(s); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-yellow-900/30 border border-yellow-800/40 text-yellow-400">🔔</button>
          <button onClick={e => { e.stopPropagation(); onPort(s); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-900/30 border border-emerald-800/40 text-emerald-400">+</button>
        </div>
      </div>
      {/* Hedef */}
      <div className="mt-2.5 grid grid-cols-3 gap-1 text-center">
        {[["Kısa", "text-emerald-400", s.targets?.short], ["Orta", "text-yellow-400", s.targets?.mid], ["Uzun", "text-cyan-400", s.targets?.long]].map(([l, c, v]) => (
          <div key={l} className="bg-zinc-800/60 rounded-lg py-1"><div className="text-[9px] text-zinc-600">{l}</div><div className={`text-[10px] font-mono ${c}`}>${v}</div></div>
        ))}
      </div>
    </div>
  );
}

// ─ Desktop Tablo Satırı ───────────────────────────────────────
function StockRow({ s, selected, onSelect, onAlarm, onPort }) {
  const up = s.change >= 0;
  return (
    <tr onClick={() => onSelect(s)} className={`border-b border-zinc-800/40 cursor-pointer text-xs transition-colors ${selected ? "bg-cyan-950/25" : "hover:bg-zinc-800/30"}`}>
      <td className="px-3 py-2.5"><div className="flex items-center gap-2"><Ring score={s.score} size={30} /><div><div className="font-bold font-mono text-white">{s.symbol}</div><div className="flex items-center gap-1"><SecDot sector={s.sector} /><span className="text-[9px] text-zinc-600">{s.sector.split(" ").slice(0, 2).join(" ")}</span></div></div></div></td>
      <td className="px-2 py-2.5 text-right"><div className="font-mono font-bold text-white">${s.price}</div><div className={`text-[10px] font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{s.change}%</div></td>
      <td className="px-2 py-2.5"><Spark data={s.sparkline} w={60} h={20} /></td>
      <td className="px-2 py-2.5"><div className="w-24"><SigBar sigs={s.signals} /></div></td>
      <td className={`px-2 py-2.5 text-center font-mono ${s.rsi < 30 ? "text-blue-400" : s.rsi > 70 ? "text-orange-400" : "text-zinc-300"}`}>{s.rsi?.toFixed(0)}</td>
      <td className="px-2 py-2.5 text-center"><RsBadge rs={s.rsRating} /></td>
      <td className="px-2 py-2.5 text-center text-[10px]">
        {s.candlePatterns?.[0] && <span className={s.candlePatterns[0].bull ? "text-emerald-400" : "text-red-400"}>{s.candlePatterns[0].name.split(" ").slice(0, 2).join(" ")}</span>}
      </td>
      <td className="px-2 py-2.5 text-center">
        <div className="flex flex-col gap-0.5 items-center">
          {s.minervini?.pass && <span className="text-[8px] text-amber-400">📐</span>}
          {s.isVCP && <span className="text-[8px] text-orange-400">🔥</span>}
          {!s.minervini?.pass && !s.isVCP && <span className="text-zinc-700">—</span>}
        </div>
      </td>
      <td className="px-2 py-2.5 text-center text-[9px]">{s.cross === "GOLDEN" && <span className="text-yellow-400">✨G</span>}{s.cross === "DEATH" && <span className="text-red-400">💀D</span>}{(s.cross === "NONE" || s.cross === "ABOVE" || s.cross === "BELOW") && <span className="text-zinc-700">—</span>}</td>
      <td className={`px-2 py-2.5 text-center font-mono ${s.volRatio > 1.5 ? "text-yellow-400" : "text-zinc-500"}`}>{s.volRatio}x</td>
      <td className="px-2 py-2.5"><Chip t={s.rec} sm /></td>
      <td className="px-2 py-2.5"><div className="flex gap-1"><button onClick={e => { e.stopPropagation(); onAlarm(s); }} className="h-7 px-2 bg-yellow-900/30 hover:bg-yellow-900/60 text-yellow-400 rounded border border-yellow-800/40">🔔</button><button onClick={e => { e.stopPropagation(); onPort(s); }} className="h-7 px-2 bg-emerald-900/30 hover:bg-emerald-900/60 text-emerald-400 rounded border border-emerald-800/40">+</button></div></td>
    </tr>
  );
}

// ─ Hisse Detay Modal ─────────────────────────────────────────
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
    const bs = stock.signals?.filter(s => s.bull).map(s => s.name).join(", ") || "yok";
    const as_ = stock.signals?.filter(s => !s.bull).map(s => s.name).join(", ") || "yok";
    const candleStr = stock.candlePatterns?.map(p => `${p.name}(${p.bull ? "boğa" : "ayı"}×${p.strength})`).join(", ") || "yok";
    const mvnStr = stock.minervini ? `${stock.minervini.passCount}/8 koşul (${stock.minervini.pass ? "GEÇİYOR" : "GEÇMİYOR"})` : "—";
    const p = `Sen bir Wall Street analisti ve teknik analistsin. Türkçe, max 230 kelime, net ve somut kararlar.

HİSSE: ${stock.symbol} | $${stock.price} (${stock.change >= 0 ? "+" : ""}${stock.change}%) | ${stock.sector}
SKOR: ${stock.score}/100 (${stock.rec}) | Stage: ${stock.stage?.label || "?"} | RS Rating: ${stock.rsRating || "?"}

TEKNİK SİNYALLER:
Boğa: ${bs}
Ayı: ${as_}

MUM FORMASYONLARI: ${candleStr}
MİNERVİNİ TEMPLATE: ${mvnStr}
VCP PATTERN: ${stock.isVCP ? "DETECTED 🔥" : "Yok"}

GÖSTERGELER:
RSI:${stock.rsi} | Stoch:${stock.stochK?.toFixed(0)} | CCI:${stock.cci?.toFixed(0)} | MACD:${stock.macdSignal} | ROC:${stock.roc}%
Cross:${stock.cross} | OBV:${stock.obvTrend} | Hacim:${stock.volRatio}x | Trend:${stock.trend}

TEMEL:
P/E:${stock.pe || "—"} | EPS:${stock.eps || "—"} | Beta:${stock.beta || "—"} | Mkt Cap:${fmtMcap(stock.mktCap)}
52H-Yüksek:$${stock.high52w?.toFixed(2) || "—"} | 52H-Düşük:$${stock.low52w?.toFixed(2) || "—"}

SEVİYELER:
S1=$${stock.s1} S2=$${stock.s2} | R1=$${stock.r1} R2=$${stock.r2}
Hedef: $${stock.targets?.short} / $${stock.targets?.mid} / $${stock.targets?.long} | SL:$${stock.targets?.sl}

ANALIZ EDİLECEKLER:
1) Teknik tablo özeti (güçlü/zayıf noktalar)
2) Mum formasyonu ne söylüyor?
3) Minervini/Stage durumu ne anlama geliyor?
4) Kısa, orta, uzun vade strateji
5) Giriş noktası + kesin karar`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: p }] }) });
      const d = await r.json();
      setAiText(d.content?.map(b => b.text || "").join("") || "Yanıt alınamadı.");
    } catch { setAiText("⚠️ API hatası."); }
    setLoading(false);
  };

  if (!stock) return null;
  const up = stock.change >= 0;

  const content = (
    <div className={`${isModal ? "h-full" : "h-full"} overflow-y-auto custom-scroll`}>
      {/* Header */}
      <div className={`flex justify-between items-start ${isModal ? "p-4 pt-5" : "pb-3"} border-b border-zinc-800 mb-3`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold font-mono text-white">{stock.symbol}</span>
            {stock.isPenny && <span className="text-[9px] text-violet-400 border border-violet-700 px-1.5 rounded-full">PENNY</span>}
            <Chip t={stock.rec} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <SecDot sector={stock.sector} />
            <span className="text-[10px] text-zinc-500">{stock.sector}</span>
            <RsBadge rs={stock.rsRating} />
            {stock.isVCP && <span className="text-[9px] text-orange-400 border border-orange-800 px-1.5 py-0.5 rounded">🔥 VCP</span>}
          </div>
          <div className={`text-base font-mono mt-1 ${up ? "text-emerald-400" : "text-red-400"}`}>${stock.price} <span className="text-sm">{up ? "+" : ""}{stock.change}%</span></div>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          <Ring score={stock.score} size={52} />
          {isModal && <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xl">×</button>}
        </div>
      </div>

      <div className={isModal ? "px-4" : "px-0"}>
        {/* Stage + Minervini */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <StageBadge stage={stock.stage} />
          <MvnBadge mvn={stock.minervini} />
          {stock.candlePatterns?.length > 0 && <CandleBadge patterns={[...stock.candlePatterns]} />}
        </div>

        {/* Sparkline */}
        <div className="mb-3"><Spark data={stock.sparkline} w={320} h={48} /></div>

        {/* Temel Veriler */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[["P/E", stock.pe || "—", "text-white"], ["EPS", stock.eps != null ? `$${stock.eps}` : "—", "text-white"], ["Beta", stock.beta || "—", stock.beta > 1.5 ? "text-orange-400" : "text-white"], ["Mkt Cap", fmtMcap(stock.mktCap), "text-cyan-400"]].map(([l, v, c]) => (
            <div key={l} className="bg-zinc-800/50 rounded-xl p-2 text-center">
              <div className="text-[9px] text-zinc-600 mb-0.5">{l}</div>
              <div className={`text-[11px] font-mono font-bold ${c}`}>{v}</div>
            </div>
          ))}
        </div>

        {/* 52 hafta */}
        <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
          <div className="text-[9px] text-zinc-600 mb-1.5">52 Hafta Bandı</div>
          <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            {stock.high52w && stock.low52w && (
              <div className="absolute h-full bg-gradient-to-r from-red-600 to-emerald-500 rounded-full" style={{ left: 0, right: 0 }} />
            )}
            {stock.high52w && stock.low52w && (
              <div className="absolute top-0 w-3 h-3 -mt-0.5 rounded-full bg-white border border-zinc-700" style={{ left: `${Math.min(95, Math.max(2, (stock.price - stock.low52w) / (stock.high52w - stock.low52w) * 100))}%` }} />
            )}
          </div>
          <div className="flex justify-between mt-1 text-[9px] font-mono">
            <span className="text-red-400">${stock.low52w?.toFixed(2)}</span>
            <span className="text-zinc-500">Şimdi: ${stock.price}</span>
            <span className="text-emerald-400">${stock.high52w?.toFixed(2)}</span>
          </div>
        </div>

        {/* Mum Formasyonları */}
        {stock.candlePatterns?.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">🕯️ Tespit Edilen Mum Formasyonları</div>
            <div className="grid grid-cols-2 gap-1.5">
              {stock.candlePatterns.map((p, i) => (
                <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-xl text-[11px] ${p.bull ? "bg-emerald-950/30 border border-emerald-900/50" : "bg-red-950/30 border border-red-900/50"}`}>
                  <span className={p.bull ? "text-emerald-300" : "text-red-300"}>{p.name}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] ${p.bull ? "text-emerald-500" : "text-red-500"}`}>{p.bull ? "BOĞA" : "AYI"}</span>
                    <span className="text-zinc-700">×{p.strength}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minervini Template */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">📐 Minervini Template</div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${stock.minervini?.pass ? "bg-amber-900/30 text-amber-300 border border-amber-700" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
              {stock.minervini?.passCount || 0}/8 {stock.minervini?.pass ? "✅ GEÇİYOR" : "❌ GEÇMİYOR"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {stock.minervini?.conditions?.map((c, i) => (
              <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] ${c.pass ? "bg-emerald-950/20 border border-emerald-900/30" : "bg-zinc-800/50 border border-zinc-700/30"}`}>
                <span>{c.pass ? "✅" : "❌"}</span>
                <span className={c.pass ? "text-emerald-300" : "text-zinc-600"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 13+ Sinyal */}
        <div className="mb-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">
            {stock.signals?.length || 0} Sinyal — {stock.signals?.filter(s => s.bull).length} boğa / {stock.signals?.filter(s => !s.bull).length} ayı
          </div>
          <div className="grid grid-cols-2 gap-1">
            {stock.signals?.map((s, i) => (
              <div key={i} className={`flex justify-between px-2.5 py-1.5 rounded-lg text-[10px] ${s.bull ? "bg-emerald-950/30 border border-emerald-900/40" : "bg-red-950/30 border border-red-900/40"}`}>
                <span className={s.bull ? "text-emerald-300" : "text-red-300"}>{s.bull ? "▲" : "▼"} {s.name}</span>
                <span className="text-zinc-700">×{s.w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teknik tablo */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden mb-3">
          {[
            ["RSI", stock.rsi?.toFixed(1), stock.rsiSignal, stock.rsi < 30 ? "text-blue-400" : stock.rsi > 70 ? "text-orange-400" : "text-zinc-300"],
            ["Stoch %K", stock.stochK?.toFixed(1), stock.stochK < 20 ? "Aşırı Satım" : stock.stochK > 80 ? "Aşırı Alım" : "Nötr", stock.stochK < 20 ? "text-blue-400" : stock.stochK > 80 ? "text-orange-400" : "text-zinc-300"],
            ["Williams %R", stock.willr?.toFixed(1), stock.willr < -80 ? "Aşırı Satım" : stock.willr > -20 ? "Aşırı Alım" : "Nötr", stock.willr < -80 ? "text-blue-400" : "text-zinc-300"],
            ["CCI", stock.cci?.toFixed(0), stock.cci < -100 ? "Aşırı Satım" : stock.cci > 100 ? "Aşırı Alım" : "Nötr", stock.cci < -100 ? "text-blue-400" : stock.cci > 100 ? "text-orange-400" : "text-zinc-300"],
            ["MACD", `${stock.macd?.toFixed(3)}`, stock.macdSignal, stock.macdSignal === "BOĞA" ? "text-emerald-400" : "text-red-400"],
            ["Cross", stock.cross, stock.cross === "GOLDEN" ? "✨Altın" : stock.cross === "DEATH" ? "💀Ölüm" : "—", stock.cross === "GOLDEN" ? "text-yellow-400" : stock.cross === "DEATH" ? "text-red-400" : "text-zinc-600"],
            ["OBV", stock.obvTrend, stock.obvTrend === "UP" ? "Yükseliyor" : "Düşüyor", stock.obvTrend === "UP" ? "text-emerald-400" : "text-red-400"],
            ["ROC", `${stock.roc}%`, stock.roc > 0 ? "Pozitif" : "Negatif", stock.roc > 0 ? "text-emerald-400" : "text-red-400"],
            ["Hacim", `${stock.volRatio}x`, stock.volRatio > 1.5 ? "Yüksek 🔥" : "Normal", stock.volRatio > 1.5 ? "text-yellow-400" : "text-zinc-400"],
          ].map(([l, v, s, c], i) => (
            <div key={i} className={`flex justify-between items-center px-3 py-2 ${i ? "border-t border-zinc-800/60" : ""}`}>
              <span className="text-xs text-zinc-500">{l}</span>
              <div className="flex items-center gap-2"><span className="text-xs font-mono text-white">{v}</span><span className={`text-[10px] ${c}`}>{s}</span></div>
            </div>
          ))}
        </div>

        {/* Destek / Direnç */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/10 p-3">
            <div className="text-[9px] text-emerald-500 font-bold mb-1.5">DESTEK</div>
            <div className="text-xs font-mono text-emerald-300">S1: ${stock.s1}</div>
            <div className="text-xs font-mono text-emerald-400/60">S2: ${stock.s2}</div>
          </div>
          <div className="rounded-xl border border-red-800/40 bg-red-950/10 p-3">
            <div className="text-[9px] text-red-500 font-bold mb-1.5">DİRENÇ</div>
            <div className="text-xs font-mono text-red-300">R1: ${stock.r1}</div>
            <div className="text-xs font-mono text-red-400/60">R2: ${stock.r2}</div>
          </div>
        </div>

        {/* Hedef fiyatlar */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[["Kısa", "text-emerald-300", stock.targets?.short], ["Orta", "text-yellow-300", stock.targets?.mid], ["Uzun", "text-cyan-300", stock.targets?.long], ["SL", "text-red-400", stock.targets?.sl]].map(([l, c, v]) => {
            const pct = v ? ((v - stock.price) / stock.price * 100).toFixed(1) : "—";
            return (<div key={l} className="border border-zinc-800 rounded-xl p-2 text-center bg-zinc-900/60">
              <div className="text-[9px] text-zinc-600">{l}</div>
              <div className={`text-[10px] font-mono font-bold ${c}`}>${v}</div>
              <div className={`text-[9px] ${parseFloat(pct) > 0 ? "text-emerald-400" : "text-red-400"}`}>{pct}%</div>
            </div>);
          })}
        </div>

        {/* Haberler */}
        <div className="mb-4">
          {!news ? (
            <button onClick={loadNews} disabled={newsLoading} className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${newsLoading ? "bg-zinc-800 text-zinc-400 border-zinc-700 animate-pulse" : "bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
              {newsLoading ? "📰 Haberler yükleniyor..." : "📰 Son Haberleri Yükle (Sentiment)"}
            </button>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">📰 Son Haberler</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${news.sentimentScore > 1 ? "border-emerald-700 bg-emerald-950/30 text-emerald-300" : news.sentimentScore < -1 ? "border-red-700 bg-red-950/30 text-red-300" : "border-zinc-700 bg-zinc-800 text-zinc-400"}`}>
                  {news.sentiment}
                </span>
              </div>
              {news.news.length === 0 ? <div className="text-[10px] text-zinc-700 text-center py-3">Haber bulunamadı</div> :
                <div className="space-y-1.5">
                  {news.news.map((n, i) => (
                    <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 hover:border-zinc-600 transition-colors">
                      <div className="text-[11px] text-zinc-300 leading-tight mb-1">{n.title}</div>
                      <div className="text-[9px] text-zinc-600">{n.publisher} · {n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString("tr-TR") : ""}</div>
                    </a>
                  ))}
                </div>}
            </div>
          )}
        </div>

        {/* Claude Analiz */}
        <button onClick={analyze} disabled={loading} className={`w-full py-3 rounded-xl text-sm font-bold border transition-all mb-3 ${loading ? "bg-cyan-900/40 text-cyan-400 border-cyan-800 animate-pulse" : "bg-cyan-600/20 active:bg-cyan-600/40 text-cyan-300 border-cyan-700/40"}`}>
          {loading ? "⚡ Analiz ediliyor..." : "🤖 Claude Derin Analiz (Mum + Minervini + RS)"}
        </button>
        {aiText && <div className="rounded-xl border border-cyan-800/30 bg-cyan-950/10 p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap mb-6">{aiText}</div>}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.85)" }}>
        <div onClick={onClose} className="flex-1" />
        <div className="bg-zinc-950 rounded-t-3xl border-t border-zinc-800 flex flex-col" style={{ maxHeight: "93vh" }}>
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-zinc-700 rounded-full" />
          </div>
          <div className="flex-1 overflow-hidden">{content}</div>
        </div>
      </div>
    );
  }
  return content;
}

// ─ Top 10 Picks ───────────────────────────────────────────────
function TopPicks({ stocks, onSelect }) {
  const top = [...stocks].sort((a, b) => b.score - a.score).slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold text-amber-400 tracking-widest uppercase mb-3">🏆 Top 10 — Mum + Minervini + RS + 13 Teknik Sinyal</p>
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scroll-x">
        {top.map((s, i) => {
          const up = s.change >= 0;
          const upside = (((s.targets?.short - s.price) / s.price) * 100).toFixed(1);
          return (
            <div key={s.symbol} onClick={() => onSelect(s)}
              className={`flex-shrink-0 w-44 rounded-2xl border p-3 cursor-pointer active:scale-95 transition-all ${i < 3 ? "border-amber-700/50 bg-amber-950/20" : "border-zinc-700/50 bg-zinc-900/50"}`}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="min-w-0 flex-1">
                  <span className="mr-1">{medals[i] || `#${i + 1}`}</span>
                  <span className="text-sm font-bold font-mono text-white">{s.symbol}</span>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <SecDot sector={s.sector} />
                    <span className="text-[9px] text-zinc-600">{s.sector.split(" ")[1]}</span>
                    {s.minervini?.pass && <span className="text-[8px] text-amber-400">📐</span>}
                    {s.isVCP && <span className="text-[8px] text-orange-400">🔥</span>}
                  </div>
                </div>
                <Ring score={s.score} size={32} />
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm font-mono font-bold text-white">${s.price}</span>
                <span className={`text-[10px] font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{s.change}%</span>
              </div>
              <Spark data={s.sparkline} w={128} h={22} />
              <SigBar sigs={s.signals} />
              <div className="flex justify-between items-center mt-1.5">
                <Chip t={s.rec} sm />
                <div className="flex items-center gap-1">
                  <RsBadge rs={s.rsRating} />
                  <span className="text-[9px] text-emerald-400">+{upside}%</span>
                </div>
              </div>
              {s.candlePatterns?.[0] && <div className="mt-1"><CandleBadge patterns={[...s.candlePatterns]} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ Sektör Görünümü ────────────────────────────────────────────
function SectorView({ stocks, onSelect }) {
  const [open, setOpen] = useState(null);
  const map = {};
  stocks.forEach(s => { (map[s.sector] || (map[s.sector] = [])).push(s); });
  return (
    <div className="space-y-2">
      {Object.entries(map).sort(([, a], [, b]) => (b.reduce((s, x) => s + x.score, 0) / b.length) - (a.reduce((s, x) => s + x.score, 0) / a.length)).map(([sec, ss]) => {
        const avg = Math.round(ss.reduce((a, s) => a + s.score, 0) / ss.length);
        const col = Object.values(SECTORS).find((_, i) => Object.keys(SECTORS)[i] === sec)?.color || "#6b7280";
        const isO = open === sec;
        const mvnCount = ss.filter(s => s.minervini?.pass).length;
        const vcpCount = ss.filter(s => s.isVCP).length;
        return (
          <div key={sec} className="rounded-2xl border border-zinc-800 overflow-hidden">
            <div onClick={() => setOpen(isO ? null : sec)} className="flex justify-between items-center px-4 py-3.5 cursor-pointer bg-zinc-900/60 active:bg-zinc-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{sec}</span>
                {mvnCount > 0 && <span className="text-[9px] text-amber-400 border border-amber-800/40 px-1 rounded">📐{mvnCount}</span>}
                {vcpCount > 0 && <span className="text-[9px] text-orange-400 border border-orange-800/40 px-1 rounded">🔥{vcpCount}</span>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] text-zinc-600">{ss.length}</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${avg}%`, background: col }} />
                  </div>
                  <span className="text-xs font-mono font-bold w-6" style={{ color: col }}>{avg}</span>
                </div>
                <span className="text-zinc-600">{isO ? "▲" : "▼"}</span>
              </div>
            </div>
            {isO && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-zinc-950/60">
                {[...ss].sort((a, b) => b.score - a.score).map(s => (
                  <div key={s.symbol} onClick={() => onSelect(s)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 cursor-pointer active:scale-95">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="text-sm font-bold font-mono text-white">{s.symbol}</span>
                        <div className="flex gap-1 mt-0.5">
                          {s.minervini?.pass && <span className="text-[8px] text-amber-400">📐</span>}
                          {s.isVCP && <span className="text-[8px] text-orange-400">🔥</span>}
                          <RsBadge rs={s.rsRating} />
                        </div>
                      </div>
                      <Ring score={s.score} size={28} />
                    </div>
                    <div className={`text-[10px] font-mono ${s.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>${s.price} {s.change >= 0 ? "+" : ""}{s.change}%</div>
                    <Spark data={s.sparkline} w={100} h={18} />
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Chip t={s.rec} sm />
                      {s.candlePatterns?.[0] && <CandleBadge patterns={[...s.candlePatterns]} />}
                    </div>
                  </div>
                ))}
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
      {passed.length === 0 && <div className="text-center text-zinc-600 py-16">Minervini/VCP/RS≥80 kriterleri karşılayan hisse yok.</div>}
      <div className="md:hidden space-y-3">
        {passed.map(s => <StockCard key={s.symbol} s={s} onSelect={onSelect} onAlarm={() => { }} onPort={() => { }} />)}
      </div>
      <div className="hidden md:block rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-zinc-800/60"><tr>
            {["Hisse", "Fiyat", "Skor", "Minervini", "Stage", "RS", "VCP", "Mum Formasyon", "Karar"].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-zinc-400 font-semibold text-[10px]">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {passed.map(s => (
              <tr key={s.symbol} onClick={() => onSelect(s)} className="border-t border-zinc-800/60 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                <td className="px-3 py-3"><div className="flex items-center gap-2"><SecDot sector={s.sector} /><span className="font-mono font-bold text-white">{s.symbol}</span></div></td>
                <td className="px-3 py-3 font-mono text-white">${s.price} <span className={s.change >= 0 ? "text-emerald-400" : "text-red-400"}>{s.change >= 0 ? "+" : ""}{s.change}%</span></td>
                <td className="px-3 py-3"><Ring score={s.score} size={30} /></td>
                <td className="px-3 py-3"><MvnBadge mvn={s.minervini} /></td>
                <td className="px-3 py-3"><StageBadge stage={s.stage} /></td>
                <td className="px-3 py-3"><RsBadge rs={s.rsRating} /></td>
                <td className="px-3 py-3">{s.isVCP ? <span className="text-orange-400 font-bold">🔥 {s.vcpContractions}x</span> : <span className="text-zinc-700">—</span>}</td>
                <td className="px-3 py-3">{s.candlePatterns?.[0] ? <CandleBadge patterns={[...s.candlePatterns]} /> : <span className="text-zinc-700">—</span>}</td>
                <td className="px-3 py-3"><Chip t={s.rec} sm /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─ Portföy ───────────────────────────────────────────────────
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
      if (h.sl && l.price <= parseFloat(h.sl) && !fired.current.has(slK)) { fired.current.add(slK); const msg = slTpMsg(h, "SL", l.price); onNotify({ title: `🛑 SL: ${h.symbol}`, msg }); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); }
      if (h.tp && l.price >= parseFloat(h.tp) && !fired.current.has(tpK)) { fired.current.add(tpK); const msg = slTpMsg(h, "TP", l.price); onNotify({ title: `🎯 TP: ${h.symbol}`, msg }); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); }
    });
  }, [stocks, holdings]);
  const add = () => { if (!form.symbol || !form.qty || !form.cost) return; const sym = form.symbol.toUpperCase(); const nh = { symbol: sym, qty: parseFloat(form.qty), cost: parseFloat(form.cost), sl: form.sl || null, tp: form.tp || null }; const ex = holdings.find(h => h.symbol === sym); if (ex) save(holdings.map(h => h.symbol === sym ? { ...h, qty: h.qty + nh.qty, cost: +((h.cost * h.qty + nh.cost * nh.qty) / (h.qty + nh.qty)).toFixed(4), sl: nh.sl || h.sl, tp: nh.tp || h.tp } : h)); else save([...holdings, nh]); setForm({ symbol: "", qty: "", cost: "", sl: "", tp: "" }); setShowForm(false); };
  const totVal = holdings.reduce((s, h) => { const l = stocks.find(x => x.symbol === h.symbol); return s + (l?.price || h.cost) * h.qty; }, 0);
  const totCost = holdings.reduce((s, h) => s + h.cost * h.qty, 0);
  const pnl = totVal - totCost;
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["Değer", `$${totVal.toFixed(0)}`, ""], [`Maliyet`, `$${totCost.toFixed(0)}`, ""], [pnl >= 0 ? "Kâr" : "Zarar", `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(0)}`, pnl >= 0 ? "text-emerald-400" : "text-red-400"]].map(([l, v, c]) => (
          <div key={l} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-center"><div className="text-[10px] text-zinc-600 mb-0.5">{l}</div><div className={`text-base font-mono font-bold text-white ${c}`}>{v}</div></div>
        ))}
      </div>
      <button onClick={() => setShowForm(p => !p)} className="w-full py-3 rounded-xl bg-emerald-600/20 border border-emerald-700/40 text-emerald-300 text-sm font-bold mb-4">
        {showForm ? "— Kapat" : "+ Pozisyon Ekle"}
      </button>
      {showForm && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="text" placeholder="Sembol" value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-600 col-span-2" />
            <input type="number" placeholder="Adet" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-600" />
            <input type="number" placeholder="Alış $" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-600" />
            <input type="number" placeholder="Stop-Loss $" value={form.sl} onChange={e => setForm(p => ({ ...p, sl: e.target.value }))} className="bg-zinc-800 border border-red-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-red-500" />
            <input type="number" placeholder="Take-Profit $" value={form.tp} onChange={e => setForm(p => ({ ...p, tp: e.target.value }))} className="bg-zinc-800 border border-emerald-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
          </div>
          <button onClick={add} className="w-full py-3 bg-emerald-600/40 text-emerald-200 rounded-xl text-sm font-bold border border-emerald-600/40">Ekle →</button>
        </div>
      )}
      <div className="space-y-2">
        {!holdings.length && <div className="text-center text-zinc-600 py-10">Portföy boş.</div>}
        {holdings.map(h => {
          const l = stocks.find(s => s.symbol === h.symbol), cur = l?.price || h.cost, pnlH = (cur - h.cost) * h.qty, pct = ((cur - h.cost) / h.cost * 100).toFixed(1);
          const slHit = h.sl && cur <= parseFloat(h.sl), tpHit = h.tp && cur >= parseFloat(h.tp);
          return (
            <div key={h.symbol} className={`rounded-2xl border p-4 ${slHit ? "border-red-700/50 bg-red-950/10" : tpHit ? "border-emerald-700/50 bg-emerald-950/10" : "border-zinc-800 bg-zinc-900/50"}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-base font-mono font-bold text-white">{h.symbol}</span>
                  <span className="text-[10px] text-zinc-600 ml-2">{l?.sector || "—"}</span>
                  {slHit && <span className="ml-2 text-[9px] text-red-300 border border-red-700 px-1.5 py-0.5 rounded-full animate-pulse">🛑 SL</span>}
                  {tpHit && <span className="ml-2 text-[9px] text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded-full animate-pulse">🎯 TP</span>}
                  {l && <div className="mt-1 flex gap-1 flex-wrap"><StageBadge stage={l.stage} /><RsBadge rs={l.rsRating} />{l.minervini?.pass && <span className="text-[8px] text-amber-400">📐MVN</span>}</div>}
                </div>
                <button onClick={() => save(holdings.filter(x => x.symbol !== h.symbol))} className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center">×</button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-zinc-800/60 rounded-xl p-2"><div className="text-zinc-600 text-[9px]">Güncel</div><div className="font-mono text-white font-bold">${cur}</div></div>
                <div className="bg-zinc-800/60 rounded-xl p-2"><div className="text-zinc-600 text-[9px]">K/Z</div><div className={`font-mono font-bold ${pnlH >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnlH >= 0 ? "+" : ""}${pnlH.toFixed(0)}</div></div>
                <div className="bg-zinc-800/60 rounded-xl p-2"><div className="text-zinc-600 text-[9px]">%</div><div className={`font-mono font-bold ${pnlH >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnlH >= 0 ? "+" : ""}{pct}%</div></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
                <span>Alış: ${h.cost} × {h.qty}</span>
                <span>{h.sl ? `SL:$${h.sl}` : ""} {h.tp ? `TP:$${h.tp}` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ Alarmlar ──────────────────────────────────────────────────
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
      if (a.type === "macd_bull" && s.macdSignal === "BOĞA") hit = true; if (a.type === "stoch_os" && s.stochK <= 20) hit = true;
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
    { v: "price_above", l: "Fiyat ≥ $" }, { v: "price_below", l: "Fiyat ≤ $" },
    { v: "rsi_below", l: "RSI ≤" }, { v: "rsi_above", l: "RSI ≥" }, { v: "score", l: "Skor ≥" },
    { v: "rs_above", l: "RS Rating ≥" }, { v: "macd_bull", l: "MACD Boğa" },
    { v: "stoch_os", l: "Stoch Aşırı Satım" }, { v: "cci_os", l: "CCI Aşırı Satım" },
    { v: "golden", l: "Golden Cross" }, { v: "minervini", l: "Minervini Geçti" },
    { v: "vcp", l: "VCP Tespit Edildi" },
  ];
  const add = () => { if (!form.symbol || (!form.value && !["minervini", "vcp", "macd_bull", "stoch_os", "cci_os", "golden"].includes(form.type))) return; save([...alarms, { id: Date.now(), symbol: form.symbol.toUpperCase(), type: form.type, value: form.value, triggered: false }]); setForm(p => ({ ...p, symbol: "", value: "" })); };
  return (
    <div>
      {Notification.permission !== "granted" && <div className="mb-3 rounded-2xl border border-yellow-800/40 bg-yellow-950/20 p-3 flex justify-between items-center"><span className="text-xs text-yellow-300">🔔 Bildirim izni gerekli</span><button onClick={() => Notification.requestPermission()} className="text-xs bg-yellow-600/30 text-yellow-300 px-3 py-1.5 rounded-xl border border-yellow-700/40">İzin Ver</button></div>}
      {tg.enabled && tg.botToken && <div className="mb-3 rounded-xl border border-green-800/40 bg-green-950/15 p-2.5 text-[10px] text-green-400">✅ Telegram aktif</div>}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 mb-4 space-y-2">
        <input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} placeholder="Sembol" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-600" />
        <div className="grid grid-cols-2 gap-2">
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none">
            {ATYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="Değer" type="number" className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-600" />
        </div>
        <button onClick={add} className="w-full py-3 bg-yellow-600/20 text-yellow-300 rounded-xl text-sm font-bold border border-yellow-700/30">🔔 Alarm Ekle</button>
      </div>
      <div className="space-y-2">
        {!alarms.length && <div className="text-center text-zinc-600 py-10">Alarm yok.</div>}
        {alarms.map(a => (
          <div key={a.id} className={`flex justify-between items-center p-4 rounded-2xl border ${a.triggered ? "border-emerald-700/50 bg-emerald-950/15" : "border-zinc-800 bg-zinc-900/50"}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{a.triggered ? "✅" : "⏳"}</span>
              <div><div className="text-sm font-bold font-mono text-white">{a.symbol}</div><div className="text-xs text-zinc-500">{ATYPES.find(t => t.v === a.type)?.l} {a.value}</div>{a.at && <div className="text-[9px] text-zinc-700">{new Date(a.at).toLocaleString("tr-TR")}</div>}</div>
            </div>
            <div className="flex gap-2">
              {a.triggered && <button onClick={() => save(alarms.map(x => x.id === a.id ? { ...x, triggered: false } : x))} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl border border-zinc-700">↺</button>}
              <button onClick={() => save(alarms.filter(x => x.id !== a.id))} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─ Sinyal Analizi ────────────────────────────────────────────
function SigAnalysis({ stocks }) {
  const [log, setLog] = useState([]); const [res, setRes] = useState(null); const [aiT, setAiT] = useState(""); const [ld, setLd] = useState(false);
  useEffect(() => { window.storage?.get("sig_log_v4").then(r => { if (r?.value) setLog(JSON.parse(r.value)); }).catch(() => { }); }, []);
  const capture = () => { const snap = stocks.map(s => ({ symbol: s.symbol, price: s.price, score: s.score, rec: s.rec, rsi: s.rsi, sector: s.sector, rsRating: s.rsRating, minervini: s.minervini?.pass, isVCP: s.isVCP, timestamp: new Date().toISOString(), outcome: null })); const nl = [...log, ...snap].slice(-600); setLog(nl); window.storage?.set("sig_log_v4", JSON.stringify(nl)).catch(() => { }); alert(`${snap.length} sinyal kaydedildi.`); };
  const evaluate = () => { const upd = log.map(e => { if (e.outcome !== null) return e; const l = stocks.find(s => s.symbol === e.symbol); if (!l) return e; const ret = ((l.price - e.price) / e.price * 100).toFixed(2); const correct = (["GÜÇLÜ AL", "AL"].includes(e.rec) && l.price > e.price) || (["SAT", "GÜÇLÜ SAT"].includes(e.rec) && l.price < e.price) || (e.rec === "BEKLE" && Math.abs(l.price - e.price) / e.price < 0.03); return { ...e, outcome: { correct, ret: parseFloat(ret), at: new Date().toISOString() } }; }); setLog(upd); window.storage?.set("sig_log_v4", JSON.stringify(upd)).catch(() => { }); compute(upd); };
  const compute = entries => { const ev = entries.filter(e => e.outcome !== null); if (!ev.length) { setRes({ empty: true }); return; } const total = ev.length, wins = ev.filter(e => e.outcome.correct).length, winRate = (wins / total * 100).toFixed(1), avgRet = (ev.reduce((s, e) => s + e.outcome.ret, 0) / total).toFixed(2); const byRec = {}; ev.forEach(e => { if (!byRec[e.rec]) byRec[e.rec] = { n: 0, w: 0, r: 0 }; byRec[e.rec].n++; if (e.outcome.correct) byRec[e.rec].w++; byRec[e.rec].r += e.outcome.ret; }); Object.values(byRec).forEach(v => { v.wr = (v.w / v.n * 100).toFixed(1); v.ar = (v.r / v.n).toFixed(2); }); const mvnSigs = ev.filter(e => e.minervini), mvnWr = mvnSigs.length ? mvnSigs.filter(e => e.outcome.correct).length / mvnSigs.length * 100 : 0; const vcpSigs = ev.filter(e => e.isVCP), vcpWr = vcpSigs.length ? vcpSigs.filter(e => e.outcome.correct).length / vcpSigs.length * 100 : 0; const mistakes = ev.filter(e => !e.outcome.correct).sort((a, b) => Math.abs(b.outcome.ret) - Math.abs(a.outcome.ret)).slice(0, 8); setRes({ total, wins, winRate, avgRet, byRec, mistakes, mvnWr: mvnWr.toFixed(1), mvnN: mvnSigs.length, vcpWr: vcpWr.toFixed(1), vcpN: vcpSigs.length }); };
  const askClaude = async () => { if (!res || res.empty) return; setLd(true); setAiT(""); try { const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: `Nasdaq sinyal analistiydin. Türkçe, max 200 kelime.\nGenel: ${res.total} sinyal, %${res.winRate} başarı, avg ${res.avgRet}%\nMinervini Başarısı: %${res.mvnWr} (${res.mvnN} sinyal)\nVCP Başarısı: %${res.vcpWr} (${res.vcpN} sinyal)\nKarar: ${Object.entries(res.byRec).map(([k, v]) => `${k}:%${v.wr}(${v.n})`).join(", ")}\nHatalar: ${res.mistakes?.slice(0, 5).map(m => `${m.symbol}:${m.rec}→${m.outcome.ret}%`).join(", ")}\nSoru: 1)Minervini/VCP stratejisi işe yarıyor mu? 2)Nerede hata yapıyorum? 3)Spesifik iyileştirme öner.` }] }) }); const d = await r.json(); setAiT(d.content?.map(b => b.text || "").join("") || "Yanıt alınamadı."); } catch { setAiT("⚠️ API hatası."); } setLd(false); };
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={capture} className="flex-1 py-3 text-sm font-bold rounded-xl bg-cyan-600/20 border border-cyan-700/40 text-cyan-300">📸 Kaydet</button>
        <button onClick={evaluate} className="flex-1 py-3 text-sm font-bold rounded-xl bg-emerald-600/20 border border-emerald-700/40 text-emerald-300">📊 Değerlendir</button>
      </div>
      {res && !res.empty && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[["Toplam", res.total, "text-white"], ["Başarı", `${res.winRate}%`, parseFloat(res.winRate) >= 55 ? "text-emerald-400" : "text-orange-400"], ["Ort.", `${res.avgRet}%`, parseFloat(res.avgRet) >= 0 ? "text-emerald-400" : "text-red-400"]].map(([l, v, c]) => (
              <div key={l} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-center"><div className="text-[10px] text-zinc-600 mb-1">{l}</div><div className={`text-xl font-mono font-bold ${c}`}>{v}</div></div>
            ))}
          </div>
          {/* Minervini / VCP karşılaştırması */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-3 text-center"><div className="text-[10px] text-amber-500 mb-1">📐 Minervini</div><div className={`text-xl font-mono font-bold ${parseFloat(res.mvnWr) >= 55 ? "text-emerald-400" : "text-yellow-400"}`}>{res.mvnWr}%</div><div className="text-[9px] text-zinc-600">{res.mvnN} sinyal</div></div>
            <div className="rounded-2xl border border-orange-800/30 bg-orange-950/10 p-3 text-center"><div className="text-[10px] text-orange-500 mb-1">🔥 VCP</div><div className={`text-xl font-mono font-bold ${parseFloat(res.vcpWr) >= 55 ? "text-emerald-400" : "text-yellow-400"}`}>{res.vcpWr}%</div><div className="text-[9px] text-zinc-600">{res.vcpN} sinyal</div></div>
          </div>
          <div className="rounded-2xl border border-zinc-800 overflow-hidden mb-4">
            {Object.entries(res.byRec).map(([rec, v], i) => (
              <div key={rec} className={`flex justify-between items-center px-4 py-3 ${i ? "border-t border-zinc-800/60" : ""}`}>
                <Chip t={rec} /><div className="flex gap-4 text-xs font-mono"><span className="text-zinc-500">{v.n}</span><span className={parseFloat(v.wr) >= 55 ? "text-emerald-400" : parseFloat(v.wr) >= 40 ? "text-yellow-400" : "text-red-400"}>%{v.wr}</span><span className={parseFloat(v.ar) >= 0 ? "text-emerald-400" : "text-red-400"}>{v.ar}%</span></div>
              </div>
            ))}
          </div>
          <button onClick={askClaude} disabled={ld} className={`w-full py-3 rounded-xl text-sm font-bold border mb-3 ${ld ? "bg-cyan-900/40 text-cyan-400 border-cyan-800 animate-pulse" : "bg-cyan-600/20 text-cyan-300 border-cyan-700/40"}`}>{ld ? "⚡ Analiz ediliyor..." : "🤖 Claude: Minervini/VCP İşe Yarıyor mu?"}</button>
          {aiT && <div className="rounded-2xl border border-cyan-800/30 bg-cyan-950/10 p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{aiT}</div>}
        </>
      )}
      {res?.empty && <div className="text-zinc-600 text-sm text-center py-10">Min 3 gün sonra değerlendirin.</div>}
    </div>
  );
}

// ─ Ayarlar ────────────────────────────────────────────────────
function Settings({ tg, onChange, stocks, lastReport, setLastReport }) {
  const [testR, setTestR] = useState(null);
  const test = async () => { const ok = await tgSend(tg.botToken, tg.chatId, "✅ NASDAQ AI Agent v4.0 bağlandı!\nMum Formasyonu + Minervini + RS Rating + VCP aktif."); setTestR(ok ? "✅ Gönderildi!" : "❌ Hata."); };
  const sendNow = async () => { if (!stocks.length) return; const ok = await tgSend(tg.botToken, tg.chatId, buildDailyMsg(stocks)); setTestR(ok ? "✅ Rapor gönderildi!" : "❌ Gönderilemedi."); if (ok) { const t = new Date().toDateString(); setLastReport(t); window.storage?.set("last_report_v4", t).catch(() => { }); } };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-4">📲 Telegram</div>
        <div className="space-y-2 mb-4">
          <input type="password" value={tg.botToken} onChange={e => onChange({ ...tg, botToken: e.target.value })} placeholder="Bot Token" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-green-600" />
          <input value={tg.chatId} onChange={e => onChange({ ...tg, chatId: e.target.value })} placeholder="Chat ID" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-green-600" />
        </div>
        <div className="space-y-3 mb-4">
          {[["enabled", "✅ Telegram Aktif"], ["dailyReport", "🌅 Günlük Rapor (09:00)"], ["alarmNotif", "🔔 Alarmlar"], ["slTpNotif", "🎯 SL/TP"]].map(([k, l]) => (
            <div key={k} onClick={() => onChange({ ...tg, [k]: !tg[k] })} className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-zinc-800/50">
              <span className="text-sm text-zinc-300">{l}</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${tg[k] ? "bg-emerald-600" : "bg-zinc-700"}`}><div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${tg[k] ? "translate-x-5" : "translate-x-0.5"}`} /></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={test} disabled={!tg.botToken || !tg.chatId} className="py-3 rounded-xl bg-zinc-700/60 text-zinc-300 text-sm font-bold disabled:opacity-40">Test</button>
          <button onClick={sendNow} disabled={!tg.enabled || !stocks.length} className="py-3 rounded-xl bg-emerald-600/20 border border-emerald-700/40 text-emerald-300 text-sm font-bold disabled:opacity-40">Rapor Gönder</button>
        </div>
        {testR && <div className="mt-2 text-xs text-zinc-400 text-center">{testR}</div>}
        {lastReport && <div className="mt-1 text-[10px] text-zinc-700 text-center">Son rapor: {lastReport}</div>}
        <div className="mt-3 rounded-xl bg-zinc-800/40 p-3 text-[10px] text-zinc-600 space-y-1">
          <div>🤖 @BotFather → /newbot → token kopyala</div>
          <div>🆔 @userinfobot → Chat ID al</div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-3">📱 PWA Kurulum</div>
        <div className="text-[10px] text-zinc-600 space-y-1.5">
          <div>📱 iOS Safari: Paylaş → Ana Ekrana Ekle</div>
          <div>🤖 Android Chrome: ⋮ → Uygulamayı Yükle</div>
          <div>💻 Desktop Chrome: URL çubuğu → ⊕</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANA UYGULAMA
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: "scanner", icon: "📊", l: "Tarayıcı" },
  { id: "sectors", icon: "🗂️", l: "Sektörler" },
  { id: "minervini", icon: "📐", l: "Minervini" },
  { id: "penny", icon: "💎", l: "Penny" },
  { id: "portfolio", icon: "💼", l: "Portföy" },
  { id: "alarms", icon: "🔔", l: "Alarmlar" },
  { id: "analysis", icon: "🔬", l: "Analiz" },
  { id: "settings", icon: "⚙️", l: "Ayarlar" },
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
    bg: isDark ? "bg-zinc-950" : "bg-zinc-50",
    text: isDark ? "text-white" : "text-zinc-900",
    muted: isDark ? "text-zinc-500" : "text-zinc-500",
    border: isDark ? "border-zinc-800" : "border-zinc-200",
    header: isDark ? "bg-zinc-950/95" : "bg-white/95",
    card: isDark ? "bg-zinc-900" : "bg-white",
    cardBorder: isDark ? "border-zinc-800" : "border-zinc-200",
    input: isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
    rowHover: isDark ? "hover:bg-zinc-800/30" : "hover:bg-zinc-100",
    tabActive: isDark ? "bg-cyan-500/20 border-cyan-600 text-cyan-300" : "bg-cyan-50 border-cyan-500 text-cyan-700",
    tabInactive: isDark ? "border-zinc-700 text-zinc-500" : "border-zinc-200 text-zinc-500",
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
    setProg({ done: 0, total: syms.length, phase: "Başlatılıyor..." });

    if (demo) {
      setStocks(syms.map(s => mockStock(s)));
      setProg({ done: syms.length, total: syms.length, phase: "Demo yüklendi" });
      setLastUpdated(new Date()); setScanning(false); return;
    }

    // SPY verisi — RS Rating için (bir kez al)
    setProg(p => ({ ...p, phase: "SPY karşılaştırma verisi alınıyor..." }));
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
      setProg({ done: i + 1, total: syms.length, phase: `Veri çekiliyor: ${syms[i]}...` });
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
          : filter === "UPTREND" ? s.trend === "YUKARI"
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
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300`} style={{ fontFamily: "'Courier New',monospace" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[100] rounded-2xl border border-cyan-700/50 bg-zinc-900/98 backdrop-blur p-4 shadow-2xl">
          <div className="text-sm font-bold text-cyan-300">{toast.title}</div>
          <div className="text-xs text-zinc-400 mt-0.5">{toast.msg?.slice(0, 100)}</div>
        </div>
      )}

      {/* Detay Modal */}
      {showDetail && selected && <StockDetail stock={selected} onClose={() => setShowDetail(false)} isModal={true} />}

      {/* ── HEADER ── */}
      <header className={`border-b ${theme.border} ${theme.header} backdrop-blur sticky top-0 z-40 transition-colors duration-300`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-lg">⚡</span>
            <div>
              <div className={`text-sm font-bold tracking-widest ${theme.text}`}>NASDAQ AI</div>
              <div className="text-[9px] text-zinc-500">v4.0 · Mum+MVN+RS+VCP</div>
            </div>
            {tg.enabled && <span className="text-[9px] text-green-500 border border-green-900/60 px-1.5 py-0.5 rounded-full">TG</span>}
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className={`w-8 h-8 flex items-center justify-center rounded-xl border ${theme.border} ${isDark ? "bg-zinc-900 text-yellow-500" : "bg-zinc-100 text-indigo-600"} transition-all`}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <label className="flex items-center gap-1.5 cursor-pointer ml-1">
              <span className="text-[9px] text-zinc-500">Penny</span>
              <div onClick={() => setPennyOn(p => !p)} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${pennyOn ? "bg-violet-600" : "bg-zinc-400"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${pennyOn ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </label>
            <div className="flex gap-1 ml-1">
              <button onClick={() => { setIsDemo(true); scan(true, pennyOn); }} className={`text-[9px] px-2 py-1.5 rounded-lg border transition-colors ${isDemo ? "bg-yellow-600/30 border-yellow-600 text-yellow-400" : "border-zinc-300 text-zinc-400 dark:border-zinc-700"}`}>Demo</button>
              <button onClick={() => { setIsDemo(false); scan(false, pennyOn); }} className={`text-[9px] px-2 py-1.5 rounded-lg border transition-colors ${!isDemo ? "bg-cyan-600/30 border-cyan-600 text-cyan-500" : "border-zinc-300 text-zinc-400 dark:border-zinc-700"}`}>Canlı</button>
            </div>
            {lastUpdated && <span className="text-[9px] text-zinc-500">{lastUpdated.toLocaleTimeString("tr-TR")}</span>}
          </div>
        </div>
        {scanning && (
          <div className="px-4 pb-2">
            <div className="flex justify-between text-[9px] text-zinc-500 mb-1"><span>{prog.phase}</span><span>{prog.done}/{prog.total}</span></div>
            <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${prog.total ? Math.round(prog.done / prog.total * 100) : 0}%` }} /></div>
          </div>
        )}
        {/* Desktop tab bar */}
        <div className="hidden md:flex px-4 pb-2 gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all ${tab === t.id ? theme.tabActive : theme.tabInactive}`}>
              {t.icon} {t.l}
            </button>
          ))}
        </div>
      </header>

      {/* ── İÇERİK ── */}
      <div className="px-3 pt-4 pb-24 md:pb-6 max-w-screen-2xl mx-auto">
        {/* Scanner + Penny */}
        {(tab === "scanner" || tab === "penny") && (
          <div>
            {tab === "penny" && <div className="mb-3 rounded-2xl border border-violet-800/30 bg-violet-950/10 p-3 text-xs text-violet-400">⚠️ Penny hisseler yüksek risk. Araştırma amaçlıdır.</div>}
            {stocks.length > 0 && <TopPicks stocks={tab === "penny" ? pennyStocks : visible.length > 0 ? visible : stocks} onSelect={selectStock} />}

            {/* Filtreler */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scroll-x">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..." className="flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-600 w-24" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none">
                <option value="score">Skor</option><option value="change">Değişim</option>
                <option value="rsi">RSI↑</option><option value="rs">RS↓</option><option value="vol">Hacim</option>
              </select>
              {[["ALL", "Tümü"], ["BUY", "⚡ Al"], ["MVN", "📐 MVN"], ["VCP", "🔥 VCP"], ["RS80", "⭐ RS≥80"], ["CANDLE", "🕯️ Mum"], ["OVERSOLD", "📉 Satım"], ["UPTREND", "📈 Trend"], ["HIGH_VOL", "🔥 Hacim"], ["GOLDEN", "✨ Golden"]].map(([f, l]) => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 text-xs px-3 py-2 rounded-xl border transition-colors ${filter === f ? "bg-cyan-600/30 border-cyan-600 text-cyan-300" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>{l}</button>
              ))}
            </div>

            {/* Mobile: kart */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {visible.length === 0 && !scanning && <div className="text-center text-zinc-600 py-16">{stocks.length === 0 ? "Tarama başlıyor..." : "Eşleşen hisse yok."}</div>}
              {visible.map(s => <StockCard key={s.symbol} s={s} onSelect={selectStock} onAlarm={s => { setSelected(s); setTab("alarms"); }} onPort={s => { setSelected(s); setTab("portfolio"); }} />)}
            </div>

            {/* Desktop: tablo + panel */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="max-h-[60vh] overflow-auto custom-scroll">
                    <table className="w-full text-xs min-w-[900px]">
                      <thead className="sticky top-0 bg-zinc-900/98 z-10 border-b border-zinc-800">
                        <tr>{["Hisse", "Fiyat", "Graf", "Sinyaller", "RSI", "RS", "Mum Formasyon", "Özel", "Cross", "Hacim", "Karar", ""].map(h => (
                          <th key={h} className="px-2 py-2.5 text-left text-zinc-500 font-semibold text-[10px]">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {!visible.length && !scanning && <tr><td colSpan={12} className="text-center py-12 text-zinc-600">{!stocks.length ? "Başlıyor..." : "Filtre eşleşmedi."}</td></tr>}
                        {visible.map(s => <StockRow key={s.symbol} s={s} selected={selected?.symbol === s.symbol} onSelect={selectStock} onAlarm={s => { setSelected(s); setTab("alarms"); }} onPort={s => { setSelected(s); setTab("portfolio"); }} />)}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-zinc-700 text-right">{visible.length}/{stocks.length}</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 h-[calc(100vh-200px)] overflow-hidden">
                {selected
                  ? <StockDetail stock={selected} onClose={() => { }} isModal={false} />
                  : <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3"><span className="text-5xl">🎯</span><span className="text-sm">Hisse seçin</span></div>
                }
              </div>
            </div>
          </div>
        )}

        {tab === "sectors" && (
          <div className="md:grid md:grid-cols-3 md:gap-4">
            <div className="md:col-span-2"><SectorView stocks={stocks} onSelect={selectStock} /></div>
            <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 h-[calc(100vh-200px)] overflow-hidden">
              {selected ? <StockDetail stock={selected} onClose={() => { }} isModal={false} /> : <div className="flex flex-col items-center justify-center h-full text-zinc-700"><span className="text-5xl">🗂️</span></div>}
            </div>
          </div>
        )}

        {tab === "minervini" && (
          <div className="md:grid md:grid-cols-3 md:gap-4">
            <div className="md:col-span-2"><MinerviniScreen stocks={stocks} onSelect={selectStock} /></div>
            <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 h-[calc(100vh-200px)] overflow-hidden">
              {selected ? <StockDetail stock={selected} onClose={() => { }} isModal={false} /> : <div className="flex flex-col items-center justify-center h-full text-zinc-700"><span className="text-5xl">📐</span><span className="text-sm mt-2">Minervini/VCP/RS≥80</span></div>}
            </div>
          </div>
        )}

        {tab === "portfolio" && <Portfolio stocks={stocks} tg={tg} onNotify={showToast} />}
        {tab === "alarms" && <Alarms stocks={stocks} tg={tg} />}
        {tab === "analysis" && <SigAnalysis stocks={stocks} />}
        {tab === "settings" && <Settings tg={tg} onChange={saveTg} stocks={stocks} lastReport={lastReport} setLastReport={setLastReport} />}
      </div>

      {/* Mobil alt navigasyon */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)", background: isDark ? "rgba(9,9,11,0.97)" : "rgba(255,255,255,0.97)", borderTop: `1px solid ${isDark ? "rgba(63,63,70,0.5)" : "rgba(200,200,200,0.5)"}` }}>
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 min-w-[11vw] transition-colors ${tab === t.id ? "text-cyan-500" : isDark ? "text-zinc-600" : "text-zinc-400"}`}>
              <span className="text-base leading-none">{t.icon}</span>
              <span className="text-[8px] font-bold tracking-wide truncate w-full text-center">{t.l}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar{width:3px;height:3px}
        .custom-scroll::-webkit-scrollbar-thumb{background:#3f3f46;border-radius:4px}
        .custom-scroll-x::-webkit-scrollbar{height:0}
        *{-webkit-tap-highlight-color:transparent}
        body{overscroll-behavior:none}

        /* ── LIGHT MODE OVERRIDES ── */
        .light-mode { background-color: #f8fafc; color: #0f172a; }
        .light-mode .bg-zinc-950 { background-color: #f8fafc; }
        .light-mode .bg-zinc-900 { background-color: #ffffff; }
        .light-mode .bg-zinc-800 { background-color: #f1f5f9; }
        .light-mode .bg-zinc-900\/50 { background-color: rgba(255,255,255,0.7); }
        .light-mode .bg-zinc-800\/60 { background-color: rgba(241,245,249,0.8); }
        .light-mode .bg-zinc-950\/95 { background-color: rgba(248,250,252,0.95); }
        .light-mode .bg-zinc-900\/40 { background-color: rgba(255,255,255,0.5); }
        .light-mode .bg-zinc-800\/30 { background-color: rgba(241,245,249,0.5); }
        .light-mode .bg-zinc-900\/30 { background-color: rgba(255,255,255,0.4); }
        
        .light-mode .border-zinc-800 { border-color: #e2e8f0; }
        .light-mode .border-zinc-800\/80 { border-color: #e2e8f0; }
        .light-mode .border-zinc-800\/40 { border-color: #cbd5e1; }
        .light-mode .border-zinc-700 { border-color: #e2e8f0; }
        .light-mode .border-zinc-700\/50 { border-color: #cbd5e1; }
        
        .light-mode .text-white { color: #0f172a; }
        .light-mode .text-zinc-300 { color: #1e293b; }
        .light-mode .text-zinc-400 { color: #475569; }
        .light-mode .text-zinc-500 { color: #64748b; }
        .light-mode .text-zinc-600 { color: #94a3b8; }
        .light-mode .text-zinc-700 { color: #cbd5e1; }

        .light-mode input, .light-mode select { background-color: #ffffff !important; color: #0f172a !important; border-color: #e2e8f0 !important; }
        .light-mode .hover\\:bg-zinc-800\\/30:hover { background-color: #f1f5f9; }
        .light-mode .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; }
        
        .light-mode .bg-emerald-950\/30 { background-color: rgba(16,185,129,0.1); }
        .light-mode .bg-red-950\/30 { background-color: rgba(239,68,68,0.1); }
        .light-mode .bg-amber-950\/20 { background-color: rgba(245,158,11,0.05); }
        .light-mode .bg-violet-950\/10 { background-color: rgba(139,92,246,0.05); }
        .light-mode .bg-cyan-950\/25 { background-color: rgba(6,182,212,0.1); }
      `}</style>
    </div>
  );
}
