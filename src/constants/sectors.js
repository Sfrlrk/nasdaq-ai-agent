// ═══════════════════════════════════════════════════════════════
// SECTOR DEFINITIONS & WEIGHTS
// ═══════════════════════════════════════════════════════════════

export const SECTORS = {
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

export const PENNY_SYMS = ["MULN", "FCEL", "NKLA", "WKHS", "GOEV", "AEVA", "CLOV", "MMAT", "SNDL", "TELL", "IMPP", "NLSP", "ATER", "ABEV", "ACB", "TLRY", "CGC", "CRKN", "CLEU", "VERB", "ATXG", "CNET", "MEGL", "BFRI", "SPRC", "NCTY", "USEA", "LIXT", "HPNN", "QNRX"];

export const SYM_SECTOR = {};
Object.entries(SECTORS).forEach(([s, { syms }]) => syms.forEach(sym => { SYM_SECTOR[sym] = s; }));

export const SECTOR_WEIGHTS = {
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

export const getW = s => SECTOR_WEIGHTS[s] || SECTOR_WEIGHTS["default"];
