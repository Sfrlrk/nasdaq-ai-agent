import { useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { Chip } from "./atoms";

export function SimResultsTab({ stocks }) {
    const [log, setLog] = useState([]);

    useEffect(() => {
        storage.get("sig_log_v4").then(r => {
            if (r?.value) setLog(JSON.parse(r.value));
        }).catch(() => { });
    }, []);

    const evaluateAll = async () => {
        const updated = log.map(entry => {
            if (entry.outcome !== null) return entry;
            const live = stocks.find(s => s.symbol === entry.symbol);
            if (!live) return entry;
            const ret = ((live.price - entry.price) / entry.price * 100).toFixed(2);
            const correct = (["STRONG BUY", "BUY"].includes(entry.rec) && live.price > entry.price)
                || (["SELL", "STRONG SELL"].includes(entry.rec) && live.price < entry.price)
                || (entry.rec === "NEUTRAL" && Math.abs(live.price - entry.price) / entry.price < 0.03);
            return { ...entry, outcome: { correct, ret: parseFloat(ret), at: new Date().toISOString() } };
        });

        setLog(updated);
        await storage.set("sig_log_v4", JSON.stringify(updated));
    };

    const stats = useMemo(() => {
        const evaluated = log.filter(entry => entry.outcome !== null);
        const wins = evaluated.filter(entry => entry.outcome.correct).length;
        const total = evaluated.length;
        const buySignals = evaluated.filter(entry => ["BUY", "STRONG BUY"].includes(entry.rec)).length;
        const sellSignals = evaluated.filter(entry => ["SELL", "STRONG SELL"].includes(entry.rec)).length;
        const avgRet = total ? (evaluated.reduce((sum, e) => sum + e.outcome.ret, 0) / total).toFixed(2) : "0.00";
        const winRate = total ? ((wins / total) * 100).toFixed(1) : "0.0";
        return { total, wins, buySignals, sellSignals, avgRet, winRate };
    }, [log]);

    const sorted = [...log].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-display font-black text-white tracking-tight">Al/Sat Simülasyon Sonuçları</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tüm yakalanan sinyaller ve doğruluk değerlendirmesi.</p>
                </div>
                <button onClick={evaluateAll} className="px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all">
                    Sonuçları Güncelle
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    ["Değerlendirilen", stats.total],
                    ["Başarılı", stats.wins],
                    ["Başarı", `%${stats.winRate}`],
                    ["BUY Sinyal", stats.buySignals],
                    ["SELL Sinyal", stats.sellSignals],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{label}</div>
                        <div className="text-xl font-display font-black text-white mt-1">{value}</div>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
                <div className="max-h-[65vh] overflow-auto">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead className="sticky top-0 bg-zinc-900/90 border-b border-zinc-800/80">
                            <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-widest">
                                <th className="px-4 py-3">Zaman</th>
                                <th className="px-4 py-3">Sembol</th>
                                <th className="px-4 py-3">Karar</th>
                                <th className="px-4 py-3">Giriş</th>
                                <th className="px-4 py-3">Durum</th>
                                <th className="px-4 py-3">Getiri</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((entry, idx) => (
                                <tr key={`${entry.symbol}-${entry.timestamp}-${idx}`} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                                    <td className="px-4 py-3 text-zinc-400">{new Date(entry.timestamp).toLocaleString("tr-TR")}</td>
                                    <td className="px-4 py-3 font-black text-white">{entry.symbol}</td>
                                    <td className="px-4 py-3"><Chip t={entry.rec} sm /></td>
                                    <td className="px-4 py-3 text-zinc-300 font-mono">${entry.price?.toFixed?.(4) || entry.price}</td>
                                    <td className="px-4 py-3">
                                        {entry.outcome === null ? (
                                            <span className="text-zinc-500">Bekleniyor</span>
                                        ) : entry.outcome.correct ? (
                                            <span className="text-emerald-400 font-bold">Başarılı</span>
                                        ) : (
                                            <span className="text-red-400 font-bold">Hatalı</span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 font-bold ${entry.outcome?.ret >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {entry.outcome ? `%${entry.outcome.ret}` : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {sorted.length === 0 && <div className="text-center text-zinc-500 py-16">Henüz simülasyon verisi yok.</div>}
        </div>
    );
}
