import { Chip, Ring, Spark, SecDot, RsBadge } from './atoms';

export function TopPicks({ stocks, onSelect }) {
    const top = [...stocks].sort((a, b) => b.score - a.score).slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-sm font-display font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="w-8 h-px bg-cyan-500/50"></span>
                    INSTITUTIONAL ALPHA PICKS
                </h2>
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-zinc-800/20 px-4 py-1.5 rounded-full border border-zinc-800/40">Real-Time Core Feed</div>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-8 no-scrollbar touch-pan-x -mx-5 px-5 group">
                {top.map((s, i) => {
                    const up = s.change >= 0;
                    return (
                        <div key={s.symbol} onClick={() => onSelect(s)}
                            className={`flex-shrink-0 w-64 rounded-[2.5rem] border p-7 cursor-pointer transition-all duration-500 relative overflow-hidden group/card hover:scale-[1.02] shadow-2xl ${i < 3 ? "border-cyan-500/40 bg-zinc-900/60 shadow-cyan-500/5" : "border-zinc-800/60 bg-zinc-900/40"}`}>
                            {i < 3 && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent -mr-16 -mt-16 group-hover/card:from-cyan-500/20 transition-all duration-700"></div>}

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl font-display font-black text-white group-hover/card:text-cyan-400 transition-colors uppercase tracking-tight">{s.symbol}</span>
                                        <span className="text-xs grayscale opacity-60 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all">{medals[i] || `#${i + 1}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <SecDot sector={s.sector} />
                                        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{s.sector.split(" ")[1]}</span>
                                    </div>
                                </div>
                                <Ring score={s.score} size={48} stroke={4} />
                            </div>

                            <div className="flex items-baseline gap-2 mb-4 relative z-10">
                                <span className="text-3xl font-display font-black text-zinc-100 tracking-tight">${s.price}</span>
                                <span className={`text-xs font-black font-mono ${up ? "text-emerald-500" : "text-red-500"}`}>
                                    {up ? "▲" : "▼"}{Math.abs(s.change)}%
                                </span>
                            </div>

                            <div className="h-12 w-full mb-6 opacity-40 group-hover/card:opacity-100 transition-opacity duration-500">
                                <Spark data={s.sparkline} w={200} h={40} />
                            </div>

                            <div className="flex justify-between items-center relative z-10 pt-5 border-t border-zinc-800/60">
                                <Chip t={s.rec} sm />
                                <RsBadge rs={s.rsRating} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
