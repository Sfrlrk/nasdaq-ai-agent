// ═══════════════════════════════════════════════════════════════
// TELEGRAM
// ═══════════════════════════════════════════════════════════════

export async function tgSend(token, chatId, text) {
    if (!token || !chatId) return false;
    try { const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }) }); return r.ok; } catch { return false; }
}

export function buildDailyMsg(stocks) {
    const top5 = [...stocks].sort((a, b) => b.score - a.score).slice(0, 5);
    const date = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
    let m = `🌅 <b>NASDAQ AI AGENT v4.0 — Daily Intel</b>\n📅 ${date}\n\n<b>🏆 Top 5 Opportunities:</b>\n`;
    top5.forEach((s, i) => {
        const tags = [s.minervini?.pass ? "📐MVN" : "", s.isVCP ? "🔥VCP" : "", s.rsRating >= 80 ? "⭐RS" : s.rsRating >= 60 ? "RS" + "" + s.rsRating : ""].filter(Boolean).join(" ");
        m += `\n${i + 1}. <b>${s.symbol}</b> $${s.price} (${s.change >= 0 ? "+" : ""}${s.change}%)\n`;
        m += `Score:${s.score} | ${s.stage?.label || ""} | ${tags}\n`;
        m += `RS:${s.rsRating} | RSI:${s.rsi} | ${s.candlePatterns?.[0]?.name || ""}\n`;
    });
    m += `\n📊 ${stocks.length} assets · ${new Date().toLocaleTimeString("en-US")}`;
    return m;
}

export const alarmMsg = (a, s) => `⚡ <b>ALERT: ${s.symbol}</b>\n$${s.price} (${s.change >= 0 ? "+" : ""}${s.change}%)\n${a.type} ${a.value}\nScore:${s.score} | ${s.stage?.label || ""}\nRS Rating: ${s.rsRating}\n📅 ${new Date().toLocaleString("en-US")}`;

export const slTpMsg = (h, t, cur) => `${t === "SL" ? "🛑" : "🎯"} <b>${t}: ${h.symbol}</b>\nPrice:$${cur} | ${t === "SL" ? "SL" : "TP"}:$${t === "SL" ? h.sl : h.tp}\nCost:$${h.cost} | P/L:${((cur - h.cost) / h.cost * 100).toFixed(2)}%\n📅 ${new Date().toLocaleString("en-US")}`;
