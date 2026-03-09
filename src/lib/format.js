export function formatPrice(value, decimals = 5) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(decimals);
}

export function normalizePriceDecimals(value) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return 5;
    return Math.min(8, Math.max(0, n));
}
