import { useState, useEffect } from 'react';
import { Chip } from './atoms';
import { storage } from '../lib/storage';

export function SigAnalysis({ stocks }) {
    const [log, setLog] = useState([]);
    const [res, setRes] = useState(null);
    const [aiT, setAiT] = useState("");
    const [ld, setLd] = useState(false);

    useEffect(() => { storage.get("sig_log_v4").then(r => { if (r?.value) setLog(JSON.parse(r.value)); }).catch(() => { }); }, []);

    const capture = () => {
        const snap = stocks.map(s => ({ symbol: s.symbol, price: s.price, score: s.score, rec: s.rec, rsi: s.rsi, sector: s.sector, rsRating: s.rsRating, minervini: s.minervini?.pass, isVCP: s.isVCP, timestamp: new Date().toISOString(), outcome: null }));
        const nl = [...log, ...snap].slice(-600);
        setLog(nl);
        storage.set("sig_log_v4", JSON.stringify(nl)).catch(() => { });
        alert(`${snap.length} signals captured for analysis.`);
    };

    const compute = entries => {
        const ev = entries.filter(e => e.outcome !== null);
        if (!ev.length) { setRes({ empty: true }); return; }
        const total = ev.length, wins = ev.filter(e => e.outcome.correct).length, winRate = (wins / total * 100).toFixed(1), avgRet = (ev.reduce((s, e) => s + e.outcome.ret, 0) / total).toFixed(2);
        const byRec = {};
        ev.forEach(e => { if (!byRec[e.rec]) byRec[e.rec] = { n: 0, w: 0, r: 0 }; byRec[e.rec].n++; if (e.outcome.correct) byRec[e.rec].w++; byRec[e.rec].r += e.outcome.ret; });
        Object.values(byRec).forEach(v => { v.wr = (v.w / v.n * 100).toFixed(1); v.ar = (v.r / v.n).toFixed(2); });
        const mvnSigs = ev.filter(e => e.minervini), mvnWr = mvnSigs.length ? mvnSigs.filter(e => e.outcome.correct).length / mvnSigs.length * 100 : 0;
        const vcpSigs = ev.filter(e => e.isVCP), vcpWr = vcpSigs.length ? vcpSigs.filter(e => e.outcome.correct).length / vcpSigs.length * 100 : 0;
        const mistakes = ev.filter(e => !e.outcome.correct).sort((a, b) => Math.abs(b.outcome.ret) - Math.abs(a.outcome.ret)).slice(0, 8);
        setRes({ total, wins, winRate, avgRet, byRec, mistakes, mvnWr: mvnWr.toFixed(1), mvnN: mvnSigs.length, vcpWr: vcpWr.toFixed(1), vcpN: vcpSigs.length });
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
        storage.set("sig_log_v4", JSON.stringify(upd)).catch(() => { });
        compute(upd);
    };

    const askClaude = async () => {
        if (!res || res.empty) return; setLd(true); setAiT("");
        try {
            const url = "https://api.anthropic.com/v1/messages";
            const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
            const r = await fetch(proxyUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022", max_tokens: 800,
                    messages: [{ role: "user", content: `You are a Nasdaq signal analyst. English, max 200 words.\nTotal: ${res.total} signals, ${res.winRate}% success, avg ${res.avgRet}%\nMinervini Winrate: ${res.mvnWr}% (${res.mvnN} signals)\nVCP Winrate: ${res.vcpWr}% (${res.vcpN} signals)\nAccuracy by Verdict: ${Object.entries(res.byRec).map(([k, v]) => `${k}:${v.wr}%(${v.n})`).join(", ")}\nTop Losses: ${res.mistakes?.slice(0, 5).map(m => `${m.symbol}:${m.rec}→${m.outcome.ret}%`).join(", ")}\nQuestion: 1) Is Minervini/VCP working? 2) Where are the weaknesses? 3) Propose 2 specific improvements.` }]
                })
            });
            const d = await r.json();
            setAiT(d.content?.map(b => b.text || "").join("") || "No response received.");
        } catch { setAiT("⚠️ AI Relay Error via Proxy."); } setLd(false);
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

                    {/* Minervini & VCP cards - using static class names for Tailwind */}
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
                                        <div className="text-right"><div className="text-[9px] text-zinc-600 font-bold uppercase">Volume</div><div className="text-sm font-display font-bold text-white">{v.n}</div></div>
                                        <div className="text-right"><div className="text-[9px] text-zinc-600 font-bold uppercase">Win %</div><div className={`text-sm font-display font-bold ${parseFloat(v.wr) >= 55 ? "text-emerald-400" : "text-red-400"}`}>{v.wr}%</div></div>
                                        <div className="text-right"><div className="text-[9px] text-zinc-600 font-bold uppercase">Alpha</div><div className={`text-sm font-display font-bold ${parseFloat(v.ar) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{v.ar}%</div></div>
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
                            <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 rounded-3xl p-6 border border-zinc-800/60 whitespace-pre-wrap font-medium">{aiT}</div>
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
