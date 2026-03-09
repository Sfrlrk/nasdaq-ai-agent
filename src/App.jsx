import { useState, useEffect, useCallback, useRef } from "react";

// Constants
import { SECTORS, PENNY_SYMS } from "./constants/sectors";
import { TABS } from "./constants/tabs";

// API / Data
import { fetchHistory, fetchBatchQuotes, buildStock, mockStock } from "./lib/api";
import { tgSend, buildDailyMsg } from "./lib/telegram";
import { storage } from "./lib/storage";
import { formatPrice, normalizePriceDecimals } from "./lib/format";

// Components
import { Ring, Chip, Spark, MvnBadge, RsBadge, StageBadge } from "./components/atoms";
import { StockCard } from "./components/StockCard";
import { StockDetail } from "./components/StockDetail";
import { TopPicks } from "./components/TopPicks";
import { SectorView } from "./components/SectorView";
import { MinerviniScreen } from "./components/MinerviniScreen";
import { Portfolio } from "./components/Portfolio";
import { Alarms } from "./components/Alarms";
import { SigAnalysis } from "./components/SigAnalysis";
import { Settings } from "./components/Settings";
import { HistoryTab } from "./components/HistoryTab";

// ═══════════════════════════════════════════════════════════════
// CORE APPLICATION
// ═══════════════════════════════════════════════════════════════

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
    const [isDemo, setIsDemo] = useState(false);
    const [pennyOn, setPennyOn] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [toast, setToast] = useState(null);
    const [lastReport, setLastReport] = useState("");
    const [tg, setTg] = useState({ botToken: "", chatId: "", enabled: false, dailyReport: true, alarmNotif: true, slTpNotif: true });
    const [display, setDisplay] = useState({ priceDecimals: 5 });
    const [scanSettings, setScanSettings] = useState({ newStockMinutes: 5, refreshMinutes: 60 });
    const [isDark, setIsDark] = useState(true);
    const spyClosesRef = useRef([]);
    const scanAbortRef = useRef(null);
    const lastScanArgsRef = useRef({ demo: false, penny: false, forceClear: false });

    useEffect(() => { const saved = localStorage.getItem("nasdaq_theme"); if (saved) setIsDark(saved === "dark"); }, []);

    const toggleTheme = () => { const next = !isDark; setIsDark(next); localStorage.setItem("nasdaq_theme", next ? "dark" : "light"); };

    const theme = {
        bg: isDark ? "bg-[#09090b]" : "bg-[#f8fafc]",
        text: isDark ? "text-zinc-100" : "text-zinc-900",
        border: isDark ? "border-zinc-800/60" : "border-zinc-200",
        header: isDark ? "bg-[#09090b]/80" : "bg-white/80",
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
        storage.get("tg_cfg_v4").then(r => { if (r?.value) setTg(JSON.parse(r.value)); }).catch(() => { });
        storage.get("last_report_v4").then(r => { if (r?.value) setLastReport(r.value); }).catch(() => { });
        storage.get("display_cfg_v1").then(r => {
            if (r?.value) {
                const parsed = JSON.parse(r.value);
                setDisplay({ priceDecimals: normalizePriceDecimals(parsed?.priceDecimals) });
            }
        }).catch(() => { });
        storage.get("scan_cfg_v1").then(r => {
            if (r?.value) {
                const parsed = JSON.parse(r.value);
                setScanSettings({
                    newStockMinutes: Math.max(1, Number(parsed?.newStockMinutes) || 5),
                    refreshMinutes: Math.max(5, Number(parsed?.refreshMinutes) || 60)
                });
            }
        }).catch(() => { });
    }, []);

    const saveTg = cfg => { setTg(cfg); storage.set("tg_cfg_v4", JSON.stringify(cfg)).catch(() => { }); };
    const saveDisplay = cfg => {
        const next = { priceDecimals: normalizePriceDecimals(cfg?.priceDecimals) };
        setDisplay(next);
        storage.set("display_cfg_v1", JSON.stringify(next)).catch(() => { });
    };
    const saveScanSettings = cfg => {
        const next = {
            newStockMinutes: Math.max(1, Number(cfg?.newStockMinutes) || 5),
            refreshMinutes: Math.max(5, Number(cfg?.refreshMinutes) || 60)
        };
        setScanSettings(next);
        storage.set("scan_cfg_v1", JSON.stringify(next)).catch(() => { });
    };
    const showToast = n => { setToast(n); setTimeout(() => setToast(null), 5000); };

    // Daily report
    useEffect(() => {
        const check = () => {
            const now = new Date(), today = now.toDateString();
            if (tg.enabled && tg.dailyReport && tg.botToken && tg.chatId && lastReport !== today && stocks.length > 0) {
                if (now.getHours() === 9 && now.getMinutes() < 5) {
                    tgSend(tg.botToken, tg.chatId, buildDailyMsg(stocks)).then(ok => {
                        if (ok) { setLastReport(today); storage.set("last_report_v4", today).catch(() => { }); }
                    });
                }
            }
        };
        check(); const id = setInterval(check, 5 * 60 * 1000); return () => clearInterval(id);
    }, [tg, stocks, lastReport]);

    const scanningRef = useRef(false);
    const isInitRef = useRef(false);

    const scan = useCallback(async (demo = false, penny = false, forceClear = false) => {
        if (scanningRef.current) return;
        lastScanArgsRef.current = { demo, penny, forceClear };
        const abortCtrl = new AbortController();
        scanAbortRef.current = abortCtrl;
        scanningRef.current = true;
        setScanning(true);
        if (forceClear || demo) {
            setStocks([]);
        }

        try {
            const syms = [...new Set([...Object.values(SECTORS).flatMap(s => s.syms), ...(penny ? PENNY_SYMS : [])])];
            setProg({ done: 0, total: syms.length, phase: "Sistem Başlatılıyor..." });

            if (demo) {
                setStocks(syms.map(s => mockStock(s)));
                setProg({ done: syms.length, total: syms.length, phase: "Demo veritabanı yüklendi" });
                setLastUpdated(new Date());
                setScanning(false);
                scanningRef.current = false;
                return;
            }

            setProg(p => ({ ...p, phase: "SPY Endeksi Hesaplanıyor..." }));
            const spyHist = await fetchHistory("SPY", { signal: abortCtrl.signal });
            if (spyHist) spyClosesRef.current = spyHist.map(d => d.c);

            const qm = {};
            for (let i = 0; i < syms.length; i += 20) {
                if (abortCtrl.signal.aborted || !scanningRef.current) break;
                try { const qs = await fetchBatchQuotes(syms.slice(i, i + 20), { signal: abortCtrl.signal }); qs.forEach(q => { qm[q.symbol] = q; }); } catch { }
                await new Promise(r => setTimeout(r, 1000));
            }

            const results = [];
            const CONCURRENCY = 4;
            let currentIndex = 0;

            const next = async () => {
                if (currentIndex >= syms.length || !scanningRef.current) return;
                const idx = currentIndex++;
                const sym = syms[idx];

                setProg({ done: Math.min(idx + 1, syms.length), total: syms.length, phase: `Sorgulanıyor: ${sym}...` });

                try {
                    const s = await buildStock(sym, qm[sym], spyClosesRef.current, { signal: abortCtrl.signal });
                    if (s && scanningRef.current) {
                        results.push(s);
                        setStocks(prev => {
                            const dict = {};
                            prev.forEach(p => dict[p.symbol] = p);
                            dict[s.symbol] = s;
                            return Object.values(dict);
                        });
                    }
                } catch (e) { }

                // Soft delay jitter
                await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
                return next();
            };

            const workers = Array.from({ length: Math.min(CONCURRENCY, syms.length) }, () => next());
            await Promise.all(workers);

            if (!scanningRef.current) return;

            await storage.saveSnapshot(results);
            await storage.saveFullData(results, demo);
            setStocks(results);
            setLastUpdated(new Date());
        } catch (e) {
            if (e?.name !== "AbortError") {
                console.error("Tarama Hatası:", e);
            }
        } finally {
            setScanning(false);
            scanningRef.current = false;
            if (scanAbortRef.current === abortCtrl) {
                scanAbortRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        if (isInitRef.current) return;
        isInitRef.current = true;

        const init = async () => {
            const cached = await storage.getFullData();
            const now = Date.now();
            let shouldScan = true;
            if (cached && cached.data?.length > 0) {
                setStocks(cached.data);
                setIsDemo(!!cached.isDemo);
                setLastUpdated(new Date(cached.at));
                if (!cached.isDemo && (now - cached.at) < 60 * 60 * 1000) {
                    shouldScan = false;
                }
            }
            if (shouldScan) {
                scan(false, pennyOn, false);
            }
        };
        init();
    }, [scan, pennyOn]);

    useEffect(() => {
        if (isDemo) return;

        const newStockMs = scanSettings.newStockMinutes * 60 * 1000;
        const refreshMs = scanSettings.refreshMinutes * 60 * 1000;

        const quickId = setInterval(() => {
            if (scanningRef.current) return;
            scan(false, pennyOn, false);
        }, newStockMs);

        const refreshId = setInterval(() => {
            if (scanningRef.current) return;
            scan(false, pennyOn, true);
        }, refreshMs);

        return () => {
            clearInterval(quickId);
            clearInterval(refreshId);
        };
    }, [scan, isDemo, pennyOn, scanSettings.newStockMinutes, scanSettings.refreshMinutes]);
    // Remove the extra scanning loop attached to pennyOn that was overriding the init.
    // Instead we will rely on a dedicated toggle function.

    const cancelScan = useCallback(() => {
        if (!scanningRef.current) return;
        scanningRef.current = false;
        scanAbortRef.current?.abort();
        setProg(p => ({ ...p, phase: "Tarama iptal edildi" }));
    }, []);

    const retryLastScan = useCallback(() => {
        const { demo, penny, forceClear } = lastScanArgsRef.current;
        scan(demo, penny, true);
    }, [scan]);

    const togglePenny = () => {
        const next = !pennyOn;
        setPennyOn(next);
        scan(isDemo, next, false);
    };

    const selectStock = s => { setSelected(s); setShowDetail(true); };

    // Filtering
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

    const FILTERS = [["ALL", "Tüm Piyasa"], ["BUY", "High Conviction"], ["MVN", "Trend Template"], ["VCP", "Contraction"], ["RS80", "Relative Str."], ["CANDLE", "Price Action"], ["OVERSOLD", "Mean Reversion"], ["UPTREND", "Trend Rail"]];

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden`}>
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 left-4 right-4 z-[100] rounded-3xl border border-cyan-500/30 bg-zinc-900/90 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="text-sm font-display font-bold text-cyan-400 uppercase tracking-widest">{toast.title}</div>
                    <div className="text-xs text-zinc-400 mt-1 font-medium">{toast.msg?.slice(0, 120)}</div>
                </div>
            )}

            {showDetail && selected && <StockDetail stock={selected} onClose={() => setShowDetail(false)} isModal={true} priceDecimals={display.priceDecimals} />}

            {/* Header */}
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
                            <button onClick={() => { setIsDemo(true); scan(true, pennyOn, true); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDemo ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-zinc-500 hover:text-zinc-300"}`}>Simülasyon</button>
                            <button onClick={() => { setIsDemo(false); scan(false, pennyOn, true); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDemo ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "text-zinc-500 hover:text-zinc-300"}`}>Canlı Veri</button>
                        </div>
                        <button onClick={retryLastScan} disabled={scanning} className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${scanning ? "border-zinc-700 text-zinc-600 cursor-not-allowed" : "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"}`}>Yeniden Dene</button>
                        <button onClick={toggleTheme} className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${theme.border} ${isDark ? "bg-zinc-900 text-amber-400" : "bg-white text-indigo-600"} hover:scale-105 transition-all shadow-lg`}>
                            {isDark ? "🔆" : "🌙"}
                        </button>
                        {lastUpdated && <div className="hidden sm:flex flex-col items-end mr-1 text-right">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Son Güncelleme</span>
                            <span className="text-[11px] font-display font-bold text-zinc-300">{lastUpdated.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>}
                    </div>
                </div>

                {/* Progress */}
                {scanning && (
                    <div className="px-6 pb-3 max-w-screen-2xl mx-auto">
                        <div className="flex justify-between items-end text-[9px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] mb-1.5">
                            <span>{prog.phase}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">{prog.done} / {prog.total} PAKET</span>
                                <button onClick={cancelScan} className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all">İptal</button>
                            </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-zinc-900">
                            <div className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-500 relative" style={{ width: `${prog.total ? Math.round(prog.done / prog.total * 100) : 0}%` }}>
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-shimmer"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Nav */}
                <div className="hidden md:flex px-6 pb-4 gap-2 overflow-x-auto max-w-screen-2xl mx-auto no-scrollbar">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-5 py-2.5 rounded-[1.25rem] border text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${tab === t.id ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-500/5" : "bg-transparent border-zinc-800/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                            <span className="text-sm grayscale opacity-70 group-hover:grayscale-0">{t.icon}</span> {t.l}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="px-5 pt-8 pb-32 md:pb-12 max-w-screen-2xl mx-auto min-h-[calc(100vh-160px)]">
                {(tab === "scanner" || tab === "penny") && (
                    <div className="space-y-10 animate-in fade-in duration-700">
                        {tab === "penny" && (
                            <div className="rounded-[2rem] border border-violet-500/30 bg-violet-600/10 p-6 flex items-center gap-5 shadow-2xl backdrop-blur-md">
                                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-3xl">🧩</div>
                                <div>
                                    <h4 className="text-base font-display font-bold text-violet-400 uppercase tracking-widest">Düşük Hacimli Yüksek Volatilite Bölgesi</h4>
                                    <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1">Mikro değerli hisseler için hedge fonu düzeyinde takip. Bu enstrümanlar aşırı delta riski taşır.</p>
                                </div>
                            </div>
                        )}

                        {stocks.length > 0 && <TopPicks stocks={tab === "penny" ? pennyStocks : visible.length > 0 ? visible : stocks} onSelect={selectStock} priceDecimals={display.priceDecimals} />}

                        {/* Filters */}
                        <div className="flex flex-col xl:flex-row gap-6">
                            <div className="flex-1 flex gap-3">
                                <div className="relative flex-1 group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-cyan-500 transition-colors">🔍</span>
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Bloomberg/Yahoo Verisi Sorgula..." className="w-full bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/60 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm text-white outline-none focus:border-cyan-500/40 transition-all font-display font-bold placeholder:font-sans placeholder:font-medium placeholder:text-zinc-600 shadow-lg shadow-black/20" />
                                </div>
                                <div className="relative">
                                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="appearance-none bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/60 rounded-[1.5rem] px-8 pr-12 py-4 text-xs text-zinc-300 outline-none focus:border-cyan-500/40 transition-all font-black uppercase tracking-[0.15em] shadow-lg shadow-black/20 cursor-pointer">
                                        <option value="score">Sırala: AI IQ</option>
                                        <option value="change">Sırala: Velocity</option>
                                        <option value="rsi">Sırala: RSI Divergence</option>
                                        <option value="rs">Sırala: RS Strength</option>
                                        <option value="vol">Sırala: Liquidity</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 text-[10px]">▼</div>
                                </div>
                            </div>
                            <div className="relative xl:min-w-[280px]">
                                <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full appearance-none bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/60 rounded-[1.5rem] px-8 pr-12 py-4 text-xs text-zinc-300 outline-none focus:border-cyan-500/40 transition-all font-black uppercase tracking-[0.15em] shadow-lg shadow-black/20 cursor-pointer">
                                    {FILTERS.map(([f, l]) => (
                                        <option key={f} value={f}>{l}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 text-[10px]">▼</div>
                            </div>
                        </div>

                        {/* Stock Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-12 xl:col-span-9 space-y-4">
                                {/* Mobile Cards */}
                                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {visible.length === 0 && !scanning && (
                                        <div className="col-span-full py-24 text-center">
                                            <div className="text-4xl mb-4">🔍</div>
                                            <h3 className="text-xl font-display font-bold text-zinc-300 mb-1">Sonuç Bulunamadı</h3>
                                            <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Filtreleri ayarlayın veya yeni veri döngüsünü bekleyin</p>
                                        </div>
                                    )}
                                    {visible.map(s => <StockCard key={s.symbol} s={s} onSelect={selectStock} onAlarm={s => { setSelected(s); setTab("alarms"); }} onPort={s => { setSelected(s); setTab("portfolio"); }} priceDecimals={display.priceDecimals} />)}
                                </div>
                                {/* Desktop Table */}
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
                                                            <div><span className="text-zinc-600 text-[10px] block mb-0.5">PRICE</span> ${formatPrice(s.price, display.priceDecimals)}</div>
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
                                        {visible.length === 0 && !scanning && <div className="py-32 text-center text-zinc-600 font-bold uppercase tracking-widest italic opacity-40 text-sm">Gelen piyasa veri paketleri bekleniyor...</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Side Panel */}
                            <div className="hidden xl:block xl:col-span-3 space-y-8">
                                <div className="rounded-[2.5rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-600/10 to-transparent p-8 shadow-2xl shadow-cyan-500/10">
                                    <h4 className="text-sm font-display font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <span className="text-cyan-400">⚡</span> SİSTEM DURUMU
                                    </h4>
                                    <div className="space-y-6">
                                        {[["Veri Durumu", "ÇALIŞIYOR", "text-emerald-500"], ["Gecikme", "42ms", "text-cyan-400"], ["YZ Çekirdeği", "SONNET-4.2", "text-indigo-400"]].map(([l, v, c]) => (
                                            <div key={l} className="flex justify-between items-center text-xs">
                                                <span className="text-zinc-500 font-bold uppercase tracking-widest">{l}</span>
                                                <span className={`${c} font-mono font-bold`}>{v}</span>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t border-zinc-800/60 mt-4">
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 italic">Terminal Bilgisi</div>
                                            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">NASDAQ yüksek teknoloji ve sanayi endekslerindeki {stocks.length} enstrüman için gerçek zamanlı analiz aktif.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Router */}
                {tab === "sectors" && <SectorView stocks={stocks} onSelect={selectStock} priceDecimals={display.priceDecimals} />}
                {tab === "minervini" && <MinerviniScreen stocks={stocks} onSelect={selectStock} priceDecimals={display.priceDecimals} />}
                {tab === "portfolio" && <Portfolio stocks={stocks} tg={tg} onNotify={showToast} />}
                {tab === "alarms" && <Alarms stocks={stocks} tg={tg} />}
                {tab === "analysis" && <SigAnalysis stocks={stocks} />}
                {tab === "history" && <HistoryTab onLoad={(data, at) => {
                    setStocks(data);
                    setLastUpdated(new Date(at));
                    setTab("scanner");
                    showToast("Geçmiş Yüklendi", new Date(at).toLocaleString() + " tarihli kayıt ekrana yansıtıldı.");
                }} />}
                {tab === "settings" && <Settings tg={tg} onChange={saveTg} stocks={stocks} lastReport={lastReport} setLastReport={setLastReport} display={display} onDisplayChange={saveDisplay} scanSettings={scanSettings} onScanChange={saveScanSettings} />}
            </main>

            {/* Mobile Dock */}
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

            {/* CSS */}
            <style>{`
        @keyframes shimmer { 100% { background-position: 48px 0; } }
        .animate-shimmer { animation: shimmer 1.5s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .font-black { font-weight: 900; }
        .backdrop-blur-xl { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
        .grid-cols-1 > * { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
        </div>
    );
}
