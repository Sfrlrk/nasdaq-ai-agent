import { useState } from 'react';
import { SECTORS } from '../constants/sectors';
import { Ring } from './atoms';

export function SectorView({ stocks, onSelect }) {
    const [open, setOpen] = useState(null);
    const data = Object.entries(SECTORS).map(([sec, info]) => {
        const ss = stocks.filter(s => s.sector === sec);
        const avg = ss.length ? Math.round(ss.reduce((a, b) => a + b.score, 0) / ss.length) : 0;
        const mvnCount = ss.filter(s => s.minervini?.pass).length;
        return { sec, info, ss, avg, mvnCount };
    }).sort((a, b) => b.avg - a.avg);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {data.map(({ sec, info, ss, avg, mvnCount }) => {
                const isO = open === sec;
                const col = info.color;
                if (!ss.length) return null;
                return (
                    <div key={sec} className={`rounded-[2.5rem] border transition-all duration-500 ${isO ? "border-cyan-500/40 bg-zinc-900/60 ring-1 ring-cyan-500/10" : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 shadow-2xl overflow-hidden"}`}>
                        <div onClick={() => setOpen(isO ? null : sec)} className="p-8 cursor-pointer group">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl bg-zinc-800/40 border border-zinc-700/30 group-hover:scale-110 transition-all shadow-xl">
                                    {info.icon}
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">Index Health</div>
                                    <div className="text-4xl font-display font-black" style={{ color: col }}>{avg}</div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-2">{sec.split(" ")[1]} Vertical</h3>
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{ss.length} Active Feeds</span>
                                {mvnCount > 0 && <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">📐 {mvnCount}</span>}
                            </div>

                            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner border border-zinc-900/20">
                                <div className="h-full rounded-full bg-gradient-to-r from-transparent to-current transition-all duration-1000 relative" style={{ width: `${avg}%`, color: col }}>
                                    <div className="absolute inset-0 bg-white/10 blur-[2px]"></div>
                                </div>
                            </div>
                        </div>

                        {isO && (
                            <div className="px-8 pb-8 bg-black/20 animate-in slide-in-from-top-4 duration-500 border-t border-white/5 pt-8">
                                <div className="grid grid-cols-1 gap-3">
                                    {ss.sort((a, b) => b.score - a.score).map(s => (
                                        <div key={s.symbol} onClick={(e) => { e.stopPropagation(); onSelect(s); }} className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-cyan-500/30 transition-all flex justify-between items-center group/item">
                                            <div>
                                                <div className="text-sm font-display font-black text-white group-hover/item:text-cyan-400 transition-colors uppercase">{s.symbol}</div>
                                                <div className="text-[10px] font-mono text-zinc-600 mt-1">${s.price}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`text-xs font-black font-mono ${s.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                    {s.change >= 0 ? "▲" : "▼"}{Math.abs(s.change)}%
                                                </div>
                                                <Ring score={s.score} size={32} stroke={3} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
