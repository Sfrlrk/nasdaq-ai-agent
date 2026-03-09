import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SECTORS } from '../constants/sectors';
import { REC_CLS } from '../constants/tabs';

// ═══════════════════════════════════════════════════════════════
// UI ATOM COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function Tooltip({ text, children }) {
    const triggerRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    };

    useEffect(() => {
        if (!open) return;
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    return (
        <div
            ref={triggerRef}
            className="relative flex items-center justify-center"
            onMouseEnter={() => {
                updatePosition();
                setOpen(true);
            }}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => {
                updatePosition();
                setOpen(true);
            }}
            onBlur={() => setOpen(false)}
        >
            {children}
            {open && createPortal(
                <div
                    className="pointer-events-none fixed z-[9999] w-48 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-[10px] text-zinc-300 shadow-2xl animate-in fade-in slide-in-from-bottom-1"
                    style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
                    role="tooltip"
                >
                    {text}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                </div>,
                document.body,
            )}
        </div>
    );
}

export function Chip({ t, sm }) {
    const text = t === "AL" || t === "GÜÇLÜ AL" ? "Boğa sinyallerine dayanarak giriş için önerilir." :
        t === "SAT" || t === "GÜÇLÜ SAT" ? "Ayı sinyallerine dayanarak çıkış veya açığa satış için önerilir." :
            "Nötr duruş, daha fazla fiyat hareketi bekleniyor.";
    return (
        <Tooltip text={text}>
            <span className={`font-bold border tracking-widest uppercase transition-all duration-300 ${sm ? "text-[8px] px-1.5 py-0.5 rounded" : "text-[10px] px-2.5 py-1 rounded-xl"} ${REC_CLS[t] || "bg-zinc-800 text-zinc-400 border-zinc-700"} shadow-sm`}>
                {t}
            </span>
        </Tooltip>
    );
}

export function Ring({ score, size = 44, stroke = 2.5 }) {
    const r = size / 2 - stroke * 1.5, circ = 2 * Math.PI * r;
    const col = score >= 75 ? "#10b981" : score >= 60 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
    const text = `Yapay Zeka Birleşik Puanı: ${score}/100. ${score >= 75 ? "Güçlü teknik uyum." : score >= 45 ? "Orta dereceli risk/getiri profili." : "Yüksek teknik risk."}`;
    return (
        <Tooltip text={text}>
            <div style={{ width: size, height: size }} className="relative flex items-center justify-center flex-shrink-0 group">
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-md" style={{ color: col }} />
                <svg className="-rotate-90 drop-shadow-sm" width={size} height={size}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} strokeOpacity="0.4" />
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                </svg>
                <span className="absolute font-display font-bold text-white tracking-tighter" style={{ fontSize: size * 0.28 }}>{score}</span>
            </div>
        </Tooltip>
    );
}

export function Spark({ data, w = 80, h = 26 }) {
    if (!data?.length) return null;
    const mn = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1) * w).toFixed(1)},${(h - ((v - mn) / range * h)).toFixed(1)}`).join(" ");
    return (<svg width={w} height={h} className="drop-shadow-sm"><polyline points={pts} fill="none" stroke={data[data.length - 1] >= data[0] ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinejoin="round" /></svg>);
}

export function SigBar({ sigs }) {
    if (!sigs?.length) return null;
    const bull = sigs.filter(s => s.bull).length;
    const desc = sigs.map(s => `${s.name}: ${s.bull ? "▲" : "▼"}`).join(", ");
    return (
        <Tooltip text={`Birleşik Sinyaller: ${desc}`}>
            <div className="flex gap-px items-center">
                {sigs.map((s, i) => <div key={i} style={{ opacity: Math.min(1, 0.4 + s.w * 0.1) }} className={`h-1.5 rounded-sm flex-1 ${s.bull ? "bg-emerald-500" : "bg-red-500"}`} />)}
                <span className="text-[10px] text-zinc-400 ml-1 font-mono w-8 text-right font-bold">{bull}/{sigs.length}</span>
            </div>
        </Tooltip>
    );
}

export function SecDot({ sector }) {
    const col = Object.entries(SECTORS).find(([k]) => k === sector)?.[1]?.color || "#6b7280";
    return (
        <Tooltip text={sector}>
            <span style={{ background: col }} className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm border border-white/10" />
        </Tooltip>
    );
}

export function RsBadge({ rs }) {
    if (!rs) return null;
    const isHigh = rs >= 80;
    const text = `Göreceli Güç Endeksi: ${rs}/100. Hisse performansını piyasa endeksiyle karşılaştırır. 80+ üstündür.`;
    return (
        <Tooltip text={text}>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${isHigh ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold shadow-[0_0_10px_-4px_rgba(6,182,212,0.4)]" : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 font-bold"}`}>
                <span className="text-[8px] uppercase tracking-widest opacity-80">RS</span>
                <span className="text-[10px] font-display font-bold leading-none">{rs}</span>
            </div>
        </Tooltip>
    );
}

export function MvnBadge({ mvn }) {
    if (!mvn) return null;
    const text = mvn.pass ? "Trend Şablonu Geçildi: Hisse, Mark Minervini'ye göre doğrulanmış bir Aşama 2 yükseliş trendindedir." : `${mvn.passCount}/8 Kriter Karşılandı. Yüksek büyümeli hisseler için Mark Minervini planını takip eder.`;
    return (
        <Tooltip text={text}>
            {mvn.pass
                ? <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-[0_0_12px_-5px_rgba(245,158,11,0.3)] border-amber-400">
                    <span className="text-[9px]">📐</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">MVN</span>
                </div>
                : <div className="bg-zinc-800/40 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    {mvn.passCount}/8
                </div>}
        </Tooltip>
    );
}

export function StageBadge({ stage }) {
    if (!stage || stage.stage === 0) return null;
    const text = `Stan Weinstein Aşaması ${stage.stage}: ${stage.label}. Kazançların çoğu Aşama 2'de elde edilir. Aşama 4'ten kaçının.`;
    return (
        <Tooltip text={text}>
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg border shadow-sm" style={{ color: stage.color, borderColor: `${stage.color}40`, backgroundColor: `${stage.color}15` }}>
                <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: stage.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{stage.label.split(" — ")[1] || stage.label}</span>
            </div>
        </Tooltip>
    );
}

export function CandleBadge({ patterns }) {
    if (!patterns?.length) return null;
    const top = patterns.sort((a, b) => b.strength - a.strength)[0];
    const text = `Mum Grafiği Formasyonu: ${top.name}. Sinyal Gücü: ${top.strength}/3. ${top.bull ? "Boğa" : "Ayı"} eğilimini gösterir.`;
    return (
        <Tooltip text={text}>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-bold uppercase tracking-widest ${top.bull ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                <span className="text-[9px]">🕯️</span>
                <span className="text-[10px] whitespace-nowrap">{top.name}</span>
            </div>
        </Tooltip>
    );
}

export function fmtMcap(n) {
    if (!n) return "—"; if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`; if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`; return `$${(n / 1e6).toFixed(0)}M`;
}
