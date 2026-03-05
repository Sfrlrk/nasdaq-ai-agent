import { describe, it, expect } from 'vitest';
import { compositeScore, scoreRec } from '../lib/scoring';

describe('Scoring Logic', () => {
    it('Should return STRONG BUY for excellent indicators', () => {
        const dummyIndData = {
            rsi: 40,
            macd: 1, sig: 0.5,
            stochK: 30,
            willr: -40,
            cci: 50,
            price: 150, sma20: 140, sma50: 130, sma200: 100, // uptrend
            bb: { lower: 145, mid: 150, upper: 155 },
            volRatio: 3,
            roc: 5,
            obvTrend: 'UP',
            cross: 'GOLDEN',
            candleBull: 3,
            candleBear: 0,
            minerviniPass: true,
            vcpDetected: true
        };
        const res = compositeScore(dummyIndData, '💻 Big Tech / Cloud');
        expect(res.score).toBeGreaterThanOrEqual(85);
        expect(scoreRec(res.score)).toBe('STRONG BUY');
    });

    it('Should return STRONG SELL for terrible indicators', () => {
        const dummyIndData = {
            rsi: 80, // overbought
            macd: -1, sig: 0.5, // bear macd
            stochK: 90,
            willr: -10,
            cci: 150,
            price: 50, sma20: 60, sma50: 70, sma200: 100, // downtrend
            bb: { lower: 40, mid: 50, upper: 60 },
            volRatio: 0.5,
            roc: -5,
            obvTrend: 'DOWN',
            cross: 'DEATH',
            candleBull: 0,
            candleBear: 3,
            minerviniPass: false,
            vcpDetected: false
        };
        const res = compositeScore(dummyIndData, '💎 Penny');
        expect(res.score).toBeLessThanOrEqual(26);
        expect(scoreRec(res.score)).toBe('SELL');
    });
});
