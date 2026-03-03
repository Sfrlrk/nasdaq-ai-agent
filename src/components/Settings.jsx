import { useState, useEffect } from 'react';
import { tgSend, buildDailyMsg } from '../lib/telegram';
import { storage } from '../lib/storage';

export function Settings({ tg, onChange, stocks, lastReport, setLastReport }) {
    const [testR, setTestR] = useState(null);
    const [aiReport, setAiReport] = useState("Loading analysis report...");

    useEffect(() => {
        storage.getReport().then(setAiReport);
    }, [stocks]);

    const test = async () => { const ok = await tgSend(tg.botToken, tg.chatId, "✅ NASDAQ AI Agent v4.0 Connected!\nCandlestick Patterns + Minervini + RS Rating + VCP Active."); setTestR(ok ? "✅ Dispatched!" : "❌ Error."); };
    const sendNow = async () => { if (!stocks.length) return; const ok = await tgSend(tg.botToken, tg.chatId, buildDailyMsg(stocks)); setTestR(ok ? "✅ Report Sent!" : "❌ Dispatch Failed."); if (ok) { const t = new Date().toDateString(); setLastReport(t); storage.set("last_report_v4", t).catch(() => { }); } };

    const copyReport = () => {
        navigator.clipboard.writeText(aiReport);
        setTestR("📋 Report Copied to Clipboard!");
        setTimeout(() => setTestR(null), 3000);
    };

    const toggles = [["enabled", "Telegram Alerts"], ["dailyReport", "Morning Report (09:00)"], ["alarmNotif", "Asset Alarms"], ["slTpNotif", "SL/TP Monitoring"]];

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
                    {toggles.map(([k, l]) => (
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

            <div className="rounded-[2.5rem] border border-cyan-500/30 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-xl text-cyan-400 shadow-lg shadow-cyan-500/5">📊</div>
                        <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest">AI Refinement Report</h3>
                    </div>
                    <button onClick={copyReport} className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl transition-all hover:bg-cyan-500/20 active:scale-95 uppercase tracking-widest">Copy For AI Agent</button>
                </div>
                <div className="bg-black/40 rounded-3xl border border-zinc-800 p-6 font-mono text-[11px] text-zinc-400 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap selection:bg-cyan-500/40">
                    {aiReport}
                </div>
                <p className="mt-6 text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    This report contains structured metadata from recent scans. Provide this text to your AI Assistant to improve scanning parameters or identify recurring winners.
                </p>
            </div>

            <div className="rounded-[2.5rem] border border-zinc-800/60 bg-gradient-to-br from-zinc-900/40 to-transparent p-8 shadow-2xl">
                <h3 className="text-lg font-display font-bold text-white mb-6 uppercase tracking-widest">Terminal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[["iOS Safari", "Share Icon → Add to Home Screen"], ["Android Chrome", "Menu ⋮ → Install App"], ["Desktop Chrome", "URL Bar → Install Icon ⊕"]].map(([title, desc]) => (
                        <div key={title} className="space-y-2">
                            <div className="text-zinc-300 font-bold text-xs uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">{title}</div>
                            <div className="text-xs text-zinc-500 leading-relaxed font-medium">{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

