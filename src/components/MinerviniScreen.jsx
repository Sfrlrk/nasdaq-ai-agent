import { Ring, Chip, MvnBadge, RsBadge, StageBadge, Tooltip } from './atoms';
import { formatPrice } from '../lib/format';

export function MinerviniScreen({ stocks, onSelect, priceDecimals }) {
    const passed = [...stocks].filter(s => s.minervini?.pass || s.isVCP || (s.rsRating && s.rsRating >= 80)).sort((a, b) => b.score - a.score);
    const stats = [
        ["📐 Minervini", stocks.filter(s => s.minervini?.pass).length, "text-amber-400", "Aşama 2 yükseliş trendleri için Mark Minervini'nin Trend Şablonu gereksinimleri."],
        ["🔥 VCP", stocks.filter(s => s.isVCP).length, "text-orange-400", "Volatilite Daralma Patenti (VCP) - Patlayıcı kırılmaların habercisi."],
        ["⭐ RS≥80", stocks.filter(s => s.rsRating >= 80).length, "text-emerald-400", "Üstün Göreceli Güç - Piyasanın %80'inden daha iyi performans."],
    ];
    const headers = [
        { l: "Varlık", d: "Menkul kıymetin sembolü ve sektörü." },
        { l: "Güncel Fiyat", d: "USD cinsinden mevcut piyasa fiyatı." },
        { l: "YZ Puanı", d: "0-100 arası birleşik teknik güç puanı." },
        { l: "Minervini Kriteri", d: "Mark Minervini'nin Trend Şablonuna göre 8 üzerinden geçilen kriter sayısı." },
        { l: "Teknik Aşama", d: "Stan Weinstein'ın aşama analizi (Aşama 2 satın alma için idealdir)." },
        { l: "RS Puanı", d: "Piyasanın geri kalanıyla karşılaştırıldığında Göreceli Güç puanı." },
        { l: "VCP Durumu", d: "Hissenin bir Volatilite Daralma Patenti oluşturup oluşturmadığını belirler." },
        { l: "Karar", d: "Tüm birleşik metriklere dayalı yapay zekanın nihai tavsiyesi." }
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-[2.5rem] p-8 mb-4 relative overflow-hidden group">
                <div className="relative z-10">
                    <h2 className="text-2xl font-display font-black text-amber-500 mb-3 tracking-tight uppercase">MARK MINERVINI PROTOKOLÜ</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl font-medium">
                        bu ekran varlıkları <span className="text-zinc-200 font-bold underline decoration-amber-500/50">Mark Minervini Trend Şablonuna</span> göre filtreler.
                        Yüksek göreceli güce ve daralan volatiliteye sahip <span className="text-zinc-200 font-bold">Aşama 2 yükseliş trendindeki</span> hisseleri belirler.
                        Amaç, teyit edilmiş ivme ve düşük riskli giriş noktalarıyla yüksek hızlı büyüme hareketlerini yakalamaktır.
                    </p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-[120px] opacity-5 select-none pointer-events-none grayscale">📐</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                {stats.map(([l, v, c, d]) => (
                    <Tooltip key={l} text={d}>
                        <div className="w-full rounded-[2rem] border border-zinc-800/80 bg-zinc-900/60 p-6 text-center hover:border-zinc-700 transition-all shadow-xl">
                            <div className="text-[10px] text-zinc-500 mb-2 font-black uppercase tracking-widest">{l}</div>
                            <div className={`text-4xl font-display font-black tracking-tight ${c}`}>{v}</div>
                        </div>
                    </Tooltip>
                ))}
            </div>

            <div className="space-y-6">
                {/* Mobile */}
                <div className="md:hidden space-y-4">
                    {passed.map(s => (
                        <div key={s.symbol} onClick={() => onSelect(s)} className="rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/40 p-6 shadow-xl active:scale-95 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-1">{s.symbol}</div>
                                    <div className="flex gap-2"><MvnBadge mvn={s.minervini} /><RsBadge rs={s.rsRating} /></div>
                                </div>
                                <Ring score={s.score} size={48} stroke={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-zinc-800/40 rounded-2xl p-3 border border-zinc-800/30">
                                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Fiyat</div>
                                    <div className="font-display font-bold text-white text-lg">${formatPrice(s.price, priceDecimals)}</div>
                                </div>
                                <div className="bg-zinc-800/40 rounded-2xl p-3 border border-zinc-800/30">
                                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Hacim Oranı</div>
                                    <div className="font-display font-bold text-white text-lg">{s.volRatio}x</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-zinc-800/40">
                                <Chip t={s.rec} />
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700/50">
                                    <span className="text-[10px] font-bold text-zinc-400">AŞAMA</span>
                                    <span className="text-[10px] font-bold text-white">{s.stage?.label.split(" — ")[1] || s.stage?.label}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!passed.length && <div className="text-center text-zinc-600 py-16 font-medium">Şu anda Trend Şablonu gereksinimlerini karşılayan bir varlık yok.</div>}
                </div>

                {/* Desktop */}
                <div className="hidden md:block rounded-[2.5rem] border border-zinc-800/60 bg-zinc-900/60 overflow-hidden shadow-2xl backdrop-blur-xl">
                    <table className="w-full">
                        <thead className="bg-zinc-800/60 border-b border-zinc-700/50">
                            <tr>
                                {headers.map(h => (
                                    <th key={h.l} className="px-6 py-6 text-left">
                                        <Tooltip text={h.d}>
                                            <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest cursor-help border-b border-zinc-700/50 pb-0.5">{h.l}</span>
                                        </Tooltip>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {passed.map(s => (
                                <tr key={s.symbol} onClick={() => onSelect(s)} className="hover:bg-amber-500/[0.03] cursor-pointer transition-all group">
                                    <td className="px-6 py-6">
                                        <div className="text-lg font-display font-black text-white group-hover:text-amber-400 transition-colors uppercase tracking-tighter">{s.symbol}</div>
                                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{s.sector.split(" ")[1]}</div>
                                    </td>
                                    <td className="px-6 py-6 font-display font-black text-zinc-100 text-lg">${formatPrice(s.price, priceDecimals)}</td>
                                    <td className="px-6 py-6"><Ring score={s.score} size={42} stroke={3} /></td>
                                    <td className="px-6 py-6"><MvnBadge mvn={s.minervini} /></td>
                                    <td className="px-6 py-6"><StageBadge stage={s.stage} /></td>
                                    <td className="px-6 py-6"><RsBadge rs={s.rsRating} /></td>
                                    <td className="px-6 py-6">
                                        <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-2 transition-all ${s.isVCP ? "bg-orange-600/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_-5px_rgba(249,115,22,0.4)]" : "bg-zinc-800/40 border-zinc-800 text-zinc-600 font-bold"}`}>
                                            {s.isVCP ? "TESPİT EDİLDİ 🔥" : "YOK"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-bold"><Chip t={s.rec} sm /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!passed.length && <div className="text-center text-zinc-600 py-24 font-bold uppercase tracking-widest text-sm opacity-50">Şu anda Mark Minervini Trend Şablonu gereksinimlerini karşılayan varlık bulunamadı.</div>}
                </div>
            </div>
        </div>
    );
}
