import { useState, useEffect, useRef } from 'react';
import { tgSend, alarmMsg } from '../lib/telegram';
import { storage } from '../lib/storage';

const ATYPES = [
    { v: "price_above", l: "Price ≥ $" }, { v: "price_below", l: "Price ≤ $" },
    { v: "rsi_below", l: "RSI Index ≤" }, { v: "rsi_above", l: "RSI Index ≥" }, { v: "score", l: "AI Score ≥" },
    { v: "rs_above", l: "RS Rating ≥" }, { v: "macd_bull", l: "MACD Momentum" },
    { v: "stoch_os", l: "Stoch Oversold" }, { v: "cci_os", l: "CCI Oversold" },
    { v: "golden", l: "Golden Cross Node" }, { v: "minervini", l: "Minervini Protocol" },
    { v: "vcp", l: "VCP Node Detected" },
];

const NO_VAL_TYPES = ["minervini", "vcp", "macd_bull", "stoch_os", "cci_os", "golden"];

export function Alarms({ stocks, tg }) {
    const [alarms, setAlarms] = useState([]);
    const [form, setForm] = useState({ symbol: "", type: "price_above", value: "" });
    const fired = useRef(new Set());

    useEffect(() => { storage.get("alarms_v4").then(r => { if (r?.value) setAlarms(JSON.parse(r.value)); }).catch(() => { }); }, []);
    const save = d => { setAlarms(d); storage.set("alarms_v4", JSON.stringify(d)).catch(() => { }); };

    useEffect(() => {
        if (!alarms.length || !stocks.length) return; let ch = false;
        const upd = alarms.map(a => {
            if (a.triggered || fired.current.has(a.id)) return a;
            const s = stocks.find(x => x.symbol === a.symbol); if (!s) return a;
            const v = parseFloat(a.value);
            let hit = false;
            if (a.type === "price_above" && s.price >= v) hit = true;
            if (a.type === "price_below" && s.price <= v) hit = true;
            if (a.type === "rsi_below" && s.rsi <= v) hit = true;
            if (a.type === "rsi_above" && s.rsi >= v) hit = true;
            if (a.type === "macd_bull" && s.macdSignal === "BULL") hit = true;
            if (a.type === "stoch_os" && s.stochK <= 20) hit = true;
            if (a.type === "cci_os" && s.cci <= -100) hit = true;
            if (a.type === "golden" && s.cross === "GOLDEN") hit = true;
            if (a.type === "score" && s.score >= v) hit = true;
            if (a.type === "minervini" && s.minervini?.pass) hit = true;
            if (a.type === "vcp" && s.isVCP) hit = true;
            if (a.type === "rs_above" && s.rsRating >= v) hit = true;
            if (hit) {
                fired.current.add(a.id); ch = true;
                const msg = alarmMsg(a, s);
                if (tg.enabled && tg.botToken) tgSend(tg.botToken, tg.chatId, msg);
                if (Notification.permission === "granted") new Notification(`⚡ ${a.symbol}`);
                return { ...a, triggered: true, at: new Date().toISOString() };
            }
            return a;
        });
        if (ch) save(upd);
    }, [stocks, alarms]);

    const add = () => {
        if (!form.symbol || (!form.value && !NO_VAL_TYPES.includes(form.type))) return;
        save([...alarms, { id: Date.now(), symbol: form.symbol.toUpperCase(), type: form.type, value: form.value, triggered: false }]);
        setForm(p => ({ ...p, symbol: "", value: "" }));
    };

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
