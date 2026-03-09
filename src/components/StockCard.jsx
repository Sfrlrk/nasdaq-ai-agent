import { Chip, Ring, Spark, SigBar, SecDot, RsBadge, StageBadge, Tooltip, MvnBadge } from './atoms';
import { formatPrice } from '../lib/format';

export function StockCard({ s, onSelect, onAlarm, onPort, priceDecimals }) {
    const up = s.change >= 0;
    return (
        <div onClick={() => onSelect(s)} className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-[2rem] p-6 active:scale-[0.98] transition-all cursor-pointer hover:border-cyan-500/30 group shadow-xl hover:shadow-cyan-500/5">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-2xl font-display font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{s.symbol}</span>
                        {s.isPenny && <span className="text-[10px] font-black text-violet-400 bg-violet-400/10 px-3 py-1 rounded-xl border border-violet-400/30 tracking-widest uppercase">Speculative</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <SecDot sector={s.sector} />
                        <span className="text-[11px] text-zinc-400 font-black uppercase tracking-widest opacity-80">{s.sector.split(" ").slice(1).join(" ")}</span>
                        <RsBadge rs={s.rsRating} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xl font-display font-black text-white tracking-tighter">${formatPrice(s.price, priceDecimals)}</div>
                        <div className={`text-xs font-black font-mono flex items-center justify-end gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
                            {up ? "▲" : "▼"} {Math.abs(s.change)}%
                        </div>
                    </div>
                    <Ring score={s.score} size={48} />
                </div>
            </div>

            <div className="flex gap-2.5 mb-5 flex-wrap">
                {s.minervini?.pass && <MvnBadge mvn={s.minervini} />}
                {s.isVCP && (
                    <Tooltip text="Volatility Contraction Pattern Detected">
                        <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-xl border border-orange-500/30 font-black tracking-widest uppercase shadow-[0_0_10px_-4px_rgba(249,115,22,0.4)]">VCP 🔥</span>
                    </Tooltip>
                )}
                {s.cross === "GOLDEN" && (
                    <Tooltip text="Golden Cross: 50 SMA crossed above 200 SMA">
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-xl border border-yellow-500/30 font-black tracking-widest uppercase shadow-[0_0_10px_-4px_rgba(234,179,8,0.4)]">Golden ✨</span>
                    </Tooltip>
                )}
            </div>

            <div className="h-12 w-full mb-5 opacity-90 group-hover:opacity-100 transition-opacity">
                <Spark data={s.sparkline} w={350} h={48} />
            </div>

            <div className="mt-2 mb-4 bg-zinc-800/30 p-2 rounded-xl border border-zinc-800/40"><SigBar sigs={s.signals} /></div>

            <div className="flex justify-between items-center pt-5 border-t border-zinc-800/60">
                <div className="flex gap-3 items-center">
                    <Chip t={s.rec} sm />
                    <StageBadge stage={s.stage} />
                </div>
                <div className="flex gap-2.5">
                    <Tooltip text="Set Alert">
                        <button onClick={e => { e.stopPropagation(); onAlarm(s); }} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 hover:text-yellow-400 hover:border-yellow-400/30 transition-all shadow-md active:scale-90">🔔</button>
                    </Tooltip>
                    <Tooltip text="Add to Portfolio">
                        <button onClick={e => { e.stopPropagation(); onPort(s); }} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 hover:text-emerald-400 hover:border-emerald-400/30 transition-all shadow-md active:scale-90">
                            <span className="text-2xl leading-none font-light">+</span>
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}
