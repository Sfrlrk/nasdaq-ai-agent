import { I } from './indicators';
import { candlePatterns, minerviniTemplate, weinsteinStage, calcRsRating, detectVCP } from './analysis';
import { compositeScore, scoreRec, calcTargets } from './scoring';
import { SYM_SECTOR, PENNY_SYMS } from '../constants/sectors';

// ═══════════════════════════════════════════════════════════════
// YAHOO FINANCE API
// ═══════════════════════════════════════════════════════════════

const YF_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://corsproxy.io/?url="
];

export async function yfFetch(url) {
    try {
        const r = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(3000) });
        if (r.ok) return r.json();
    } catch { }

    try {
        const promises = YF_PROXIES.map(async (proxy) => {
            const r = await fetch(proxy + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) });
            if (r.ok) return r.json();
            throw new Error(`Proxy failed: ${proxy}`);
        });
        return await Promise.any(promises);
    } catch (e) {
        console.warn("All proxies failed for", url);
        return null;
    }
}

export async function fetchHistory(sym) {
    const d = await yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=6mo`);
    if (!d?.chart?.result?.[0]) return null;
    const r = d.chart.result[0], { close, open, high, low, volume } = r.indicators.quote[0];
    return r.timestamp.map((_, i) => ({ c: close[i], o: open[i], h: high[i], l: low[i], v: volume[i] })).filter(x => x.c != null && x.h != null && x.o != null);
}

export async function fetchBatchQuotes(syms) {
    const fields = "regularMarketPrice,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,regularMarketPreviousClose,trailingPE,epsTrailingTwelveMonths,marketCap,beta,fiftyTwoWeekHigh,fiftyTwoWeekLow,displayName,shortName";
    const d = await yfFetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${syms.join(",")}&fields=${fields}`);
    return d?.quoteResponse?.result || [];
}

export async function fetchNews(sym) {
    const d = await yfFetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${sym}&newsCount=5&enableFuzzyQuery=false`);
    const news = d?.news?.slice(0, 5) || [];
    if (!news.length) return { news: [], sentiment: "NEUTRAL", sentimentScore: 0 };

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

export async function buildStock(symbol, qd, spyCloses = []) {
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

        const pe = qd?.trailingPE ? +qd.trailingPE.toFixed(1) : null;
        const eps = qd?.epsTrailingTwelveMonths ? +qd.epsTrailingTwelveMonths.toFixed(2) : null;
        const mktCap = qd?.marketCap || null;
        const beta = qd?.beta ? +qd.beta.toFixed(2) : null;
        const high52w = qd?.fiftyTwoWeekHigh || Math.max(...c);
        const low52w = qd?.fiftyTwoWeekLow || Math.min(...c);

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

        const { patterns, bullScore: candleBull, bearScore: candleBear } = candlePatterns(o, h, l, c);
        const mvn = minerviniTemplate(c, h, price, sma50, sma150, sma200, high52w, low52w);
        const sma30Trend = sma30 && sma30Old ? ((sma30 - sma30Old) / sma30Old * 100) : 0;
        const stage = weinsteinStage(price, sma30, sma30Trend, sma200);
        const rsRating = calcRsRating(c, spyCloses);
        const { isVCP, contractions } = detectVCP(c, v);

        const sector = SYM_SECTOR[symbol] || (price < 2 ? "💎 Penny" : "❓ Other");
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

export function mockStock(symbol) {
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
