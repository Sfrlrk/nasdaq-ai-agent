import { useState, useEffect } from "react";
import { storage } from "../lib/storage";

export function HistoryTab({ onLoad }) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await storage.getFullDataHistory();
            setHistory(data.sort((a, b) => b.at - a.at));
            setIsLoading(false);
        };
        load();
    }, []);

    const handleDelete = async (e, at) => {
        e.stopPropagation();
        const updated = history.filter(h => h.at !== at);
        await storage.setHistory(updated);
        setHistory(updated);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-zinc-500 animate-pulse">Geçmiş taramalar yükleniyor...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="p-12 text-center text-zinc-500">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-white mb-2">Geçmiş Kayıt Yok</h3>
                <p className="text-xs uppercase tracking-widest">Sistem henüz tam bir tarama verisi kaydetmedi.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 px-4 pt-4">
                <span className="text-3xl">🕰️</span>
                <div>
                    <h2 className="text-xl font-display font-black text-white tracking-tight">Geçmiş Analizler</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Önceki tarama sonuçlarını yükleyebilir ve farkları inceleyebilirsiniz.</p>
                </div>
            </div>

            <div className="space-y-3">
                {history.map((run, i) => {
                    const date = new Date(run.at);
                    const bullish = run.data?.filter(s => s.rec === "BUY" || s.rec === "STRONG BUY").length || 0;
                    const total = run.data?.length || 0;
                    const isNewest = i === 0;

                    return (
                        <div key={run.at} onClick={() => onLoad(run.data, run.at)} className="bg-zinc-900/60 border border-zinc-800/60 hover:border-cyan-500/30 rounded-3xl p-5 flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.01]">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg ${isNewest ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-zinc-800 text-zinc-500"}`}>
                                    {isNewest ? "NEW" : "#" + (history.length - i)}
                                </div>
                                <div className="space-y-1">
                                    <div className="text-white font-bold tracking-wide flex items-center gap-2">
                                        {date.toLocaleDateString("tr-TR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        {run.isDemo && <span className="text-[9px] bg-amber-500/20 text-amber-500 uppercase tracking-widest px-2 py-0.5 rounded-md border border-amber-500/30">Simülasyon</span>}
                                    </div>
                                    <div className="text-xs font-bold text-zinc-500 flex items-center gap-3">
                                        <span><span className="text-zinc-400">{total}</span> Hisse Taraması</span>
                                        <span>•</span>
                                        <span className="text-emerald-500/80">{bullish} Boğa Sinyali</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Yükle ➔</div>
                                <button onClick={(e) => handleDelete(e, run.at)} className="w-8 h-8 rounded-full bg-zinc-800/50 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors">
                                    ✕
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
