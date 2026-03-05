export function ScoreExplain({ signals = [] }) {
    if (!signals.length) return null;

    const ranked = [...signals].sort((a, b) => b.w - a.w);
    const topBull = ranked.filter(s => s.bull).slice(0, 4);
    const topBear = ranked.filter(s => !s.bull).slice(0, 4);

    return (
        <div className="rounded-[2rem] border border-zinc-800/60 bg-zinc-900/40 p-6">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Skor Açıklaması</h4>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ağırlığa göre</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-3">BUY tarafını güçlendirenler</p>
                    <ul className="space-y-2">
                        {topBull.length > 0 ? topBull.map(sig => (
                            <li key={`bull-${sig.name}`} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-200">{sig.name}</span>
                                <span className="text-emerald-400 font-bold">+{sig.w}</span>
                            </li>
                        )) : <li className="text-xs text-zinc-500">Güçlü boğa sinyali yok.</li>}
                    </ul>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-3">SELL tarafını güçlendirenler</p>
                    <ul className="space-y-2">
                        {topBear.length > 0 ? topBear.map(sig => (
                            <li key={`bear-${sig.name}`} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-200">{sig.name}</span>
                                <span className="text-red-400 font-bold">-{sig.w}</span>
                            </li>
                        )) : <li className="text-xs text-zinc-500">Güçlü ayı sinyali yok.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
}
