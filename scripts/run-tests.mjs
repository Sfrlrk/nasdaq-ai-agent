import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    fail += 1;
    console.error(`✗ ${name}`);
    console.error(error.message);
  }
}

const api = readFileSync('src/lib/api.js', 'utf8');
const detail = readFileSync('src/components/StockDetail.jsx', 'utf8');
const shim = readFileSync('App.jsx', 'utf8');

test('api layer includes retry helper', () => {
  assert.match(api, /fetchWithRetry\(/);
});

test('api layer includes TTL cache map', () => {
  assert.match(api, /CACHE_TTL_MS/);
  assert.match(api, /yfCache = new Map/);
});

test('stock detail renders score explanation panel', () => {
  assert.match(detail, /ScoreExplain/);
  assert.match(detail, /<ScoreExplain signals=\{stock\.signals\} \/>/);
});

test('legacy App.jsx is shimmed to src/App.jsx', () => {
  assert.match(shim, /export \{ default \} from '\.\/src\/App\.jsx';/);
});

if (fail > 0) {
  console.error(`\n${fail} failed, ${pass} passed.`);
  process.exit(1);
}

console.log(`\nAll tests passed (${pass}).`);
