import { useState, useEffect, useRef } from 'react';
import { tgSend, slTpMsg } from '../lib/telegram';
import { StageBadge, RsBadge, Tooltip } from './atoms';
import { storage } from '../lib/storage';

export function Portfolio({ stocks, tg, onNotify }) {
    const [holdings, setHoldings] = useState([]);
    const [form, setForm] = useState({ symbol: "", qty: "", cost: "", sl: "", tp: "" });
    const [showForm, setShowForm] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const [showAiImport, setShowAiImport] = useState(false);
    const fired = useRef(new Set());

    useEffect(() => { storage.get("pf_v4").then(r => { if (r?.value) setHoldings(JSON.parse(r.value)); }).catch(() => { }); }, []);
    const save = d => { setHoldings(d); storage.set("pf_v4", JSON.stringify(d)).catch(() => { }); };

    useEffect(() => {
        holdings.forEach(h => {
            const l = stocks.find(s => s.symbol === h.symbol); if (!l) return;
            const slK = `sl_${h.symbol}`, tpK = `tp_${h.symbol}`;
            if (h.sl && l.price <= parseFloat(h.sl) && !fired.current.has(slK)) { fired.current.add(slK); const msg = slTpMsg(h, "SL", l.price); onNotify({ title: `🛑 STOP LOSS: ${h.symbol}`, msg }); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); }
            if (h.tp && l.price >= parseFloat(h.tp) && !fired.current.has(tpK)) { fired.current.add(tpK); const msg = slTpMsg(h, "TP", l.price); onNotify({ title: `🎯 TARGET HIT: ${h.symbol}`, msg }); if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg); }
        });
    }, [stocks, holdings]);

    const add = () => {
        if (!form.symbol || !form.qty || !form.cost) return;
        const sym = form.symbol.toUpperCase();
        const nh = { symbol: sym, qty: parseFloat(form.qty), cost: parseFloat(form.cost), sl: form.sl || null, tp: form.tp || null };
        const ex = holdings.find(h => h.symbol === sym);
        if (ex) save(holdings.map(h => h.symbol === sym ? { ...h, qty: h.qty + nh.qty, cost: +((h.cost * h.qty + nh.cost * nh.qty) / (h.qty + nh.qty)).toFixed(4), sl: nh.sl || h.sl, tp: nh.tp || h.tp } : h));
        else save([...holdings, nh]);
        setForm({ symbol: "", qty: "", cost: "", sl: "", tp: "" }); setShowForm(false);
    };

    const importAi = () => {
        // AI Simulation: Extracting Tickers from jumbled text
        const symbols = aiInput.match(/\b[A-Z]{1,5}\b/g) || [];
        const unique = [...new Set(symbols)];
        const newHoldings = unique.map(s => {
            const l = stocks.find(x => x.symbol === s);
            return { symbol: s, qty: 1, cost: l?.price || 0, sl: null, tp: null };
        });
        save([...holdings, ...newHoldings.filter(nh => !holdings.find(h => h.symbol === nh.symbol))]);
        setAiInput(""); setShowAiImport(false);
        onNotify({ title: "AI IMPORT SUCCESS", msg: `Processed text and identified ${unique.length} assets: ${unique.join(", ")}` });
    };

    const autoAlarms = () => {
        storage.get("alarms_v4").then(r => {
            let alarms = r?.value ? JSON.parse(r.value) : [];
            let added = 0;
            holdings.forEach(h => {
                const s = stocks.find(x => x.symbol === h.symbol);
                if (s?.pivots) {
                    const { s1, r1 } = s.pivots;
                    if (!alarms.find(a => a.symbol === h.symbol && a.type === "price_below")) {
                        alarms.push({ id: Date.now() + added++, symbol: h.symbol, type: "price_below", value: s1, triggered: false });
                    }
                    if (!alarms.find(a => a.symbol === h.symbol && a.type === "price_above")) {
                        alarms.push({ id: Date.now() + added++, symbol: h.symbol, type: "price_above", value: r1, triggered: false });
                    }
                }
            });
            storage.set("alarms_v4", JSON.stringify(alarms));
            onNotify({ title: "AUTO-ALARMS SET", msg: `Added ${added} Support/Resistance alerts for your portfolio assets.` });
        });
    };

    const totVal = holdings.reduce((s, h) => { const l = stocks.find(x => x.symbol === h.symbol); return s + (l?.price || h.cost) * h.qty; }, 0);
    const totCost = holdings.reduce((s, h) => s + h.cost * h.qty, 0);
    const pnl = totVal - totCost;
    const pnlPct = totCost > 0 ? (pnl / totCost * 100).toFixed(2) : "0.00";

    const summaryCards = [
        ["Aggregated Value", `$${totVal.toLocaleString()}`, "text-white", "bg-zinc-900/60 border-zinc-700/50"],
        ["Net Cost Basis", `$${totCost.toLocaleString()}`, "text-zinc-400", "bg-zinc-900/60 border-zinc-800"],
        [pnl >= 0 ? "Portfolio Alpha" : "Capital Variance", `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toLocaleString()} (${pnlPct}%)`, pnl >= 0 ? "text-emerald-400" : "text-red-400", pnl >= 0 ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]" : "bg-red-400/10 border-red-400/30"]
    ];

    const fields = [
        { span: 2, label: "Asset Identifier (Symbol)", type: "text", placeholder: "NVDA", key: "symbol", cls: "border-zinc-700/50" },
        { label: "Quantity", type: "number", placeholder: "100", key: "qty", cls: "border-zinc-700/50" },
        { label: "Avg Execution Price", type: "number", placeholder: "145.50", key: "cost", cls: "border-zinc-700/50" },
        { label: "Stop Loss Trigger", type: "number", placeholder: "Optional", key: "sl", cls: "border-red-500/20", labelCls: "text-red-500/80" },
        { label: "Take Profit Target", type: "number", placeholder: "Optional", key: "tp", cls: "border-emerald-500/20", labelCls: "text-emerald-500/80" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {summaryCards.map(([l, v, c, b]) => (
                    <div key={l} className={`rounded-[2rem] border ${b} p-8 shadow-2xl backdrop-blur-md`}>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-3">{l}</div>
                        <div className={`text-3xl font-display font-black tracking-tight ${c}`}>{v}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4">
                <button onClick={() => { setShowForm(p => !p); setShowAiImport(false); }} className="flex-1 py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.99] border border-white/10 uppercase tracking-widest">
                    {showForm ? "✕ Close Form" : "⊕ Manual Entry"}
                </button>
                <button onClick={() => { setShowAiImport(p => !p); setShowForm(false); }} className="flex-1 py-5 rounded-[2rem] bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-2xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.99] border border-white/10 uppercase tracking-widest">
                    ✨ AI Import
                </button>
                <Tooltip text="Automatically sets support (S1) and resistance (R1) alerts for all portfolio stocks.">
                    <button onClick={autoAlarms} className="w-16 py-5 rounded-[2rem] bg-zinc-800 hover:bg-zinc-700 text-white text-lg font-black shadow-2xl transition-all flex items-center justify-center active:scale-[0.99] border border-zinc-700">
                        🔔
                    </button>
                </Tooltip>
            </div>

            {showForm && (
                <div className="rounded-[2.5rem] border border-zinc-800/80 bg-zinc-900/60 p-10 shadow-3xl animate-in zoom-in-95 duration-500 backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {fields.map(f => (
                            <div key={f.key} className={`space-y-3 ${f.span ? "col-span-2" : ""}`}>
                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${f.labelCls || "text-zinc-400"}`}>{f.label}</label>
                                <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className={`w-full bg-zinc-800/60 border ${f.cls} rounded-2xl px-6 py-5 text-sm text-white font-${f.type === "text" ? "black" : "mono"} outline-none focus:border-indigo-500 transition-all shadow-inner`} />
                            </div>
                        ))}
                    </div>
                    <button onClick={add} className="w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] text-sm font-black shadow-3xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-[0.2em]">Commit Position</button>
                </div>
            )}

            {showAiImport && (
                <div className="rounded-[2.5rem] border border-zinc-800/80 bg-zinc-900/60 p-10 shadow-3xl animate-in zoom-in-95 duration-500 backdrop-blur-xl">
                    <div className="mb-6">
                        <h3 className="text-xl font-display font-black text-cyan-400 mb-2 uppercase">AI PORTFOLIO PARSER</h3>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Paste your stock list, news snippet, or watchlists below. AI will extract identifiers.</p>
                    </div>
                    <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Example: I'm holding NVDA at 140, some AAPL at 230 and looking at TSLA..." className="w-full h-48 bg-zinc-800/60 border border-zinc-700/50 rounded-[2rem] px-8 py-6 text-sm text-white font-medium outline-none focus:border-cyan-500 transition-all shadow-inner mb-6 resize-none" />
                    <button onClick={importAi} className="w-full py-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-[1.5rem] text-sm font-black shadow-3xl shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-[0.2em]">Initialize AI Extraction</button>
                </div>
            )}

            <div className="space-y-6">
                {!holdings.length && (
                    <div className="text-center py-40 bg-zinc-900/30 rounded-[3rem] border-2 border-zinc-800 border-dashed">
                        <div className="text-zinc-700 font-black uppercase tracking-[0.4em] text-sm opacity-50">Portfolio Vacuum / No Active Exposure</div>
                    </div>
                )}
                {holdings.map(h => {
                    const l = stocks.find(s => s.symbol === h.symbol), cur = l?.price || h.cost, pnlH = (cur - h.cost) * h.qty, pct = ((cur - h.cost) / h.cost * 100).toFixed(1);
                    const slHit = h.sl && cur <= parseFloat(h.sl), tpHit = h.tp && cur >= parseFloat(h.tp);
                    const upH = pnlH >= 0;
                    return (
                        <div key={h.symbol} className={`rounded-[3rem] border-2 p-10 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ${slHit ? "border-red-500/60 bg-red-500/10 shadow-[0_0_40px_-20px_rgba(239,68,68,0.4)]" : tpHit ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_40px_-20px_rgba(16,185,129,0.4)]" : "border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-sm"}`}>
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-5 mb-4">
                                        <span className="text-5xl font-display font-black text-white uppercase tracking-tighter drop-shadow-sm">{h.symbol}</span>
                                        <div className="flex gap-2">
                                            {slHit && <span className="text-[10px] font-black text-white bg-red-600 px-4 py-1.5 rounded-xl shadow-lg animate-pulse tracking-widest border border-red-400">LIQUIDATION REQUIRED</span>}
                                            {tpHit && <span className="text-[10px] font-black text-white bg-emerald-600 px-4 py-1.5 rounded-xl shadow-lg animate-pulse tracking-widest border border-emerald-400">TARGET ACHIEVED</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-700/50 px-3 py-1 rounded-lg">{l?.sector.split(" ")[1] || "INDEX"} SECTOR</span>
                                        {l && <><StageBadge stage={l.stage} /><RsBadge rs={l.rsRating} /></>}
                                    </div>
                                </div>
                                <button onClick={() => save(holdings.filter(x => x.symbol !== h.symbol))} className="w-16 h-16 rounded-[1.5rem] bg-zinc-800/60 hover:bg-red-600/30 hover:text-red-400 text-zinc-600 flex items-center justify-center transition-all border border-zinc-700/30 text-3xl font-light hover:rotate-90">×</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                                {[
                                    ["Current Quote", `$${cur.toLocaleString()}`, "text-zinc-100", "bg-zinc-800/40 border-zinc-700/50", "📈"],
                                    ["Unrealized P/L", `${upH ? "+" : ""}$${Math.abs(pnlH).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, upH ? "text-emerald-400" : "text-red-400", upH ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30", upH ? "🔥" : "📉"],
                                    ["Performance", `${upH ? "+" : ""}${pct}%`, upH ? "text-emerald-400" : "text-red-400", upH ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30", "⚡"],
                                ].map(([label, val, tc, bg, icon]) => (
                                    <div key={label} className={`rounded-[2.5rem] p-8 border-2 relative overflow-hidden group transition-all ${bg}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${tc.replace("text-", "text-").replace("400", "500").replace("100", "400")}`}>{label}</div>
                                        <div className={`font-display font-black text-4xl tracking-tighter ${tc}`}>{val}</div>
                                        <div className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-30 transition-opacity grayscale group-hover:grayscale-0">{icon}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-10 border-t-2 border-zinc-800/60">
                                <div className="flex gap-10">
                                    {[["Cost Basis", `$${h.cost}`], ["Holdings", h.qty]].map(([lb, vl]) => (
                                        <div key={lb} className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">{lb}</span>
                                            <span className="text-zinc-200 font-mono font-black py-2 px-5 bg-zinc-800/80 rounded-xl border border-zinc-700/50 shadow-inner">{vl}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-6">
                                    {h.sl && <div className="flex flex-col items-end"><span className="text-[10px] font-black text-red-500/80 uppercase tracking-widest mb-2 mr-1">Liquid. Floor</span><span className="bg-red-600/10 text-red-500 font-black font-mono py-2 px-6 rounded-2xl border-2 border-red-500/30 shadow-xl shadow-red-500/5">SL: ${h.sl}</span></div>}
                                    {h.tp && <div className="flex flex-col items-end"><span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-2 mr-1">Profit Ceiling</span><span className="bg-emerald-600/10 text-emerald-500 font-black font-mono py-2 px-6 rounded-2xl border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/5">TP: ${h.tp}</span></div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

