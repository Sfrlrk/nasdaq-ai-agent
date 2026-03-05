import { useState, useEffect } from 'react';
import { fetchNews } from '../lib/api';
import { Chip, Ring, Spark, SecDot, RsBadge, StageBadge, MvnBadge, CandleBadge, fmtMcap } from './atoms';

export function StockDetail({ stock, onClose, isModal }) {
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
        const mvnStr = stock.minervini ? `${stock.minervini.passCount}/8 koşul (${stock.minervini.pass ? "GEÇTİ" : "KALDI"})` : "—";
        const p = `Kıdemli bir Wall Street kantitatif analisti gibi davran. ${stock.symbol} için profesyonel bir teknik analiz sağla. TÜRKÇE cevap ver, maksimum 250 kelime. Kesin ve uygulanabilir ol.

VARLIK: ${stock.symbol} | $${stock.price} (${stock.change >= 0 ? "+" : ""}${stock.change}%) | ${stock.sector}
YZ PUANI: ${stock.score}/100 (${stock.rec}) | Aşama: ${stock.stage?.label || "?"} | RS Puanı: ${stock.rsRating || "?"}

TEKNİK SİNYALLER:
Boğa: ${bs}
Ayı: ${as_}

MUM GRAFİĞİ FORMASYONLARI: ${candleStr}
MINERVINI ŞABLONU: ${mvnStr}
VCP FORMASYONU: ${stock.isVCP ? "TESPİT EDİLDİ 🔥" : "Yok"}

GÖSTERGELER:
RSI:${stock.rsi} | Stoch:${stock.stochK?.toFixed(0)} | CCI:${stock.cci?.toFixed(0)} | MACD:${stock.macdSignal === "BULL" ? "Boğa" : "Ayı"} | ROC:${stock.roc}%
Kesişme:${stock.cross} | OBV:${stock.obvTrend} | Hacim Oranı:${stock.volRatio}x | Trend:${stock.trend}

TEMEL VERİLER:
F/K:${stock.pe || "—"} | Hisse Başı Kazanç:${stock.eps || "—"} | Beta:${stock.beta || "—"} | Piyasa Değeri:${fmtMcap(stock.mktCap)}
52H Yüksek:$${stock.high52w?.toFixed(2) || "—"} | 52H Düşük:$${stock.low52w?.toFixed(2) || "—"}

KRİTİK SEVİYELER:
S1=$${stock.s1} S2=$${stock.s2} | R1=$${stock.r1} R2=$${stock.r2}
Hedefler: Kısa Vade: $${stock.targets?.short} / Orta Vade: $${stock.targets?.mid} / Uzun Vade: $${stock.targets?.long} | Zarar Durdur:$${stock.targets?.sl}

GEREKSİNİMLER:
1) Teknik görünüm özeti
2) Mum grafiği formasyonu yorumu
3) Minervini/Aşama durumu etkileri
4) Kısa, orta, uzun vadeli işlem stratejisi
5) Kesin giriş/çıkış noktaları ve nihai karar`;

        try {
            const url = "https://api.anthropic.com/v1/messages";
            const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
            const r = await fetch(proxyUrl, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": "REPLACE_WITH_REAL_KEY", "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1000, messages: [{ role: "user", content: p }] }) });
            const d = await r.json();
            setAiText(d.content?.[0]?.text || "Yanıt oluşturulamadı. Doğrulama gerekiyor.");
        } catch { setAiText("⚠️ Sinirsel Bağlantı Çevrimdışı (Proxy Hatası). Konsolu kontrol edin."); }
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
                            {stock.isPenny && <span className="text-[10px] font-black text-violet-400 bg-violet-400/10 px-3 py-1 rounded-xl border border-violet-400/20 tracking-widest">SPEKÜLATİF</span>}
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
                            <div className="text-[9px] font-black text-zinc-500 mt-2 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">YZ Puanı</div>
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

                {/* AI Score X-Ray Panel (T-011) */}
                <div className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5 p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-5 relative z-10">
                        <div className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <span>🔍</span> Skor X-Ray (Açıklanabilirlik)
                        </div>
                        <div className="text-[9px] text-zinc-500 font-black font-mono border border-zinc-700/50 bg-zinc-800/40 px-2 py-1 rounded-md">
                            SCORE ≈ 26 + (BOĞA GÜCÜ / TOPLAM GÜÇ) × 74
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-3 border-b border-emerald-500/20 pb-2">Baskın Boğa Faktörleri (Pozitif)</div>
                            <div className="space-y-2">
                                {stock.signals?.filter(s => s.bull).sort((a, b) => b.w - a.w).slice(0, 4).map(s => (
                                    <div key={s.name} className="flex justify-between items-center text-[10px] font-black">
                                        <span className="text-emerald-200">{s.name}</span>
                                        <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+{s.w} Ağırlık</span>
                                    </div>
                                ))}
                                {(!stock.signals || stock.signals.filter(s => s.bull).length === 0) && <div className="text-[10px] text-emerald-700 font-bold italic">Boğa faktörü bulunmuyor</div>}
                            </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-red-500/20 bg-red-500/10 p-4">
                            <div className="text-[9px] text-red-400 font-black uppercase tracking-widest mb-3 border-b border-red-500/20 pb-2">Baskın Ayı Faktörleri (Negatif)</div>
                            <div className="space-y-2">
                                {stock.signals?.filter(s => !s.bull).sort((a, b) => b.w - a.w).slice(0, 4).map(s => (
                                    <div key={s.name} className="flex justify-between items-center text-[10px] font-black">
                                        <span className="text-red-200">{s.name}</span>
                                        <span className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">-{s.w} Ağırlık</span>
                                    </div>
                                ))}
                                {(!stock.signals || stock.signals.filter(s => !s.bull).length === 0) && <div className="text-[10px] text-red-700 font-bold italic">Ayı faktörü bulunmuyor</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Price Velocity */}
                <div className="rounded-[2rem] border border-zinc-800/60 bg-zinc-900/40 p-6 overflow-hidden relative">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-4 opacity-50">Fiyat İvmesi (30 Gün)</div>
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
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-5">52 Haftalık Performans Koridoru</div>
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
                    {stock.candlePatterns?.length > 0 && (
                        <div className="space-y-4">
                            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Fiyat Hareketi Formasyonları</div>
                            <div className="grid grid-cols-1 gap-2">
                                {stock.candlePatterns.map((p, i) => (
                                    <div key={i} className={`flex justify-between items-center px-5 py-3 rounded-2xl border ${p.bull ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20 shadow-sm"}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm">🕯️</span>
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${p.bull ? "text-emerald-300" : "text-red-300"}`}>{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black ${p.bull ? "text-emerald-500" : "text-red-500"}`}>{p.bull ? "BOĞA" : "AYI"}</span>
                                            <span className="text-zinc-700 font-black text-[9px]">×{p.strength}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Kuantum Sinyal Matrisi</div>
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
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Sistem Teşhis Akışı</span>
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

                {/* Support/Resistance Grid */}
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

                {/* Target Allocation */}
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

                {/* News */}
                <div className="space-y-4">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Piyasa Duyarlılık Akışı</div>
                    {!news ? (
                        <button onClick={loadNews} disabled={newsLoading} className={`w-full py-5 rounded-[2rem] text-sm font-black border transition-all ${newsLoading ? "bg-zinc-900 text-zinc-500 border-zinc-800 animate-pulse" : "bg-zinc-800/40 text-zinc-400 border-zinc-800 hover:border-zinc-600 shadow-xl"}`}>
                            {newsLoading ? "AKIŞLA İLETİŞİM KURULUYOR..." : "BLOOMBERG HABER AKIŞINI BAŞLAT"}
                        </button>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <div className="text-[10px] font-black text-zinc-600 uppercase">Son Haberler</div>
                                <span className={`text-[9px] font-black px-3 py-1 rounded-xl border ${news.sentimentScore > 1 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : news.sentimentScore < -1 ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-zinc-700 bg-zinc-800 text-zinc-500"}`}>
                                    DUYARLILIK: {news.sentiment?.toUpperCase()}
                                </span>
                            </div>
                            {news.news.length === 0 ? <div className="text-center py-12 text-zinc-700 font-bold uppercase tracking-widest text-xs">Aktif haber döngüsü bulunamadı</div> :
                                <div className="space-y-3">
                                    {news.news.map((n, i) => (
                                        <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block rounded-[1.5rem] border border-zinc-800/60 bg-zinc-900/40 p-4 hover:border-cyan-500/40 transition-all group">
                                            <div className="text-xs font-bold text-zinc-200 group-hover:text-white leading-relaxed mb-2 line-clamp-2">{n.title}</div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-wider">{n.publisher}</span>
                                                <span className="text-[9px] text-zinc-700 font-mono">{n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString("tr-TR", { month: 'short', day: 'numeric' }) : ""}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>}
                        </div>
                    )}
                </div>

                {/* AI Deep Analysis */}
                <div className="pt-4">
                    <button onClick={analyze} disabled={loading} className={`w-full py-6 rounded-[2.5rem] text-sm font-black border transition-all mb-4 ${loading ? "bg-indigo-950/40 text-indigo-400 border-indigo-900 animate-pulse" : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-2xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99]"}`}>
                        {loading ? "KUANTUM ANALİTİK TARANIYOR..." : "CLAUDE NEURAL TAHMİNİNİ ÇALIŞTIR"}
                    </button>

                    {aiText && (
                        <div className="rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 p-8 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-4 border-b border-indigo-500/10 pb-4">Nöro-Teknik Karar</div>
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
