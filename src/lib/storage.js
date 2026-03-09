import { get, set, del } from 'idb-keyval';

// Storage helper with localStorage fallback
export const storage = {
    get: async (key) => {
        try {
            // Try idb-keyval first
            const idbResult = await get(key);
            if (idbResult !== undefined) return idbResult;

            if (window.storage?.get) {
                const result = await window.storage.get(key);
                if (result) return result;
            }
        } catch (e) {
            console.warn(`Storage get error for ${key}:`, e);
        }
        const v = localStorage.getItem(key);
        return v ? { value: v } : null;
    },
    set: async (key, val) => {
        try {
            if (window.storage?.set) {
                await window.storage.set(key, val);
                return;
            }
        } catch (e) {
            console.warn(`Storage set error for ${key}:`, e);
        }
        localStorage.setItem(key, val);
    },
    saveSnapshot: async (data) => {
        try {
            const hStr = localStorage.getItem('analysis_history') || '[]';
            const history = JSON.parse(hStr);
            const snapshot = {
                at: new Date().toISOString(),
                stats: {
                    total: data.length,
                    bullish: data.filter(s => s.rec === "BUY").length,
                    bearish: data.filter(s => s.rec === "SELL").length,
                    mvn: data.filter(s => s.minervini?.pass).length,
                    top: data.sort((a, b) => b.score - a.score).slice(0, 3).map(s => s.symbol)
                }
            };
            history.push(snapshot);
            if (history.length > 50) history.shift();
            localStorage.setItem('analysis_history', JSON.stringify(history));
            return snapshot;
        } catch (e) { console.error("Snapshot error:", e); return null; }
    },
    getReport: async () => {
        try {
            const hStr = localStorage.getItem('analysis_history') || '[]';
            const history = JSON.parse(hStr);
            if (!history.length) return "No data recorded yet.";
            const latest = history[history.length - 1];
            const prev = history[history.length - 2];
            let report = `AI ANALYSIS REPORT - ${new Date(latest.at).toLocaleString()}\n\n`;
            report += `OVERVIEW:\n- Active Assets: ${latest.stats.total}\n- Bullish Signal Count: ${latest.stats.bullish}\n- Minervini Qualified: ${latest.stats.mvn}\n\n`;
            report += `TOP PICKS: ${latest.stats.top.join(", ")}\n\n`;
            if (prev) {
                const diff = latest.stats.bullish - prev.stats.bullish;
                report += `MARKET DYNAMICS:\n- Sentiment Shift: ${diff > 0 ? "+" : ""}${diff} Bullish signals vs previous run.\n`;
            }
            report += `\nINSTRUCTION: Refine algorithms for ${latest.stats.top[0]}.`;
            return report;
        } catch (e) { return "Error generating report."; }
    },
    saveFullData: async (data, isDemo = false) => {
        try {
            const entry = { at: Date.now(), data, isDemo };
            await set('nasdaq_full_data', entry);

            const hist = await get('nasdaq_full_data_history') || [];
            hist.push(entry);
            const MAX_HISTORY_ENTRIES = 500;
            if (hist.length > MAX_HISTORY_ENTRIES) hist.splice(0, hist.length - MAX_HISTORY_ENTRIES);
            await set('nasdaq_full_data_history', hist);
        } catch (e) { console.error("Error saving full data:", e); }
    },
    getFullData: async () => {
        try {
            return await get('nasdaq_full_data');
        } catch (e) { console.error("Error getting full data:", e); return null; }
    },
    getFullDataHistory: async () => {
        try {
            return await get('nasdaq_full_data_history') || [];
        } catch (e) { return []; }
    },
    setHistory: async (hist) => {
        try {
            await set('nasdaq_full_data_history', hist);
        } catch (e) { }
    }
};
