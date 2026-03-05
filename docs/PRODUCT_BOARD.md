# NASDAQ AI Agent – İyileştirme Analizi ve Task Board

## 1) Hızlı Durum Analizi (Mevcut Proje)

### Güçlü yönler
- Tek ekranda tarama + teknik indikatör + sinyal + portföy + alarm + telegram akışı bulunuyor.
- `src/lib` altında hesaplama mantığı bileşenlerden ayrılmış (`api`, `analysis`, `indicators`, `scoring`).
- Demo modu ve fallback yaklaşımı kullanıcı deneyimini kesintiye uğratmıyor.

### Geliştirme alanları (öncelik sırasıyla)
1. **Teknik borç / kod dağınıklığı**
   - Kök dizinde çok büyük bir `App.jsx` dosyası var (legacy/duplikasyon riski).
   - Yeni çalışan sürüm `src/App.jsx` içinde olsa da repo içinde iki farklı app gövdesi bakım maliyeti yaratıyor.
2. **Test ve kalite altyapısı eksik**
   - Unit/integration test altyapısı yok.
   - CI pipeline tanımı yok (build/test/lint otomasyonu eksik).
3. **Veri katmanı dayanıklılığı**
   - Tüm veri istemci tarafında ve proxy tabanlı; rate-limit ve veri tutarlılığı riski var.
   - Error state / retry / stale cache stratejileri sınırlı.
4. **Performans ve UX**
   - Tarama işlemi uzun sürüyor, progress var ama arka planda önbellek/yenileme stratejileri geliştirilebilir.
   - Büyük veri listelerinde virtualization yok.
5. **Ürünleşme eksikleri**
   - Watchlist senaryoları, backtest/benchmark, açıklanabilir skor dağılımı, onboarding gibi özellikler sınırlı.

---

## 2) Task Board (Başlatılabilir Backlog)

> Durumlar: `Backlog` | `Ready` | `In Progress` | `Blocked` | `Done`

| ID | Task | Etki | Efor | Durum | Bağımlılık | Çıktı |
|---|---|---|---|---|---|---|
| T-001 | Legacy `App.jsx` temizliği ve tek giriş noktasına düşürme | Yüksek | S | Ready | - | Kod sadeleşir, bakım maliyeti düşer |
| T-002 | ESLint + Prettier + import/order standardı | Orta | S | Backlog | T-001 | Kod kalitesi standardize |
| T-003 | Vitest + React Testing Library kurulumu | Yüksek | M | Ready | T-002 | Temel test altyapısı |
| T-004 | `scoring`, `analysis`, `indicators` için unit test paketi | Çok Yüksek | M | Backlog | T-003 | Finansal hesaplama güvenilirliği |
| T-005 | GitHub Actions: build + test + lint | Yüksek | S | Backlog | T-003 | CI kalite kapısı |
| T-006 | API katmanında retry/backoff + cache TTL (SWR benzeri) | Yüksek | M | Backlog | - | Rate limit dayanıklılığı |
| T-007 | Tarama iptal/yeniden deneme mekanizması (AbortController) | Orta | M | Backlog | T-006 | UX iyileşir |
| T-008 | Sonuç listesinde sanallaştırma (`react-window`) | Orta | M | Backlog | - | Büyük listede performans |
| T-009 | Portföy P/L dashboard (günlük, haftalık, aylık) | Yüksek | M | Backlog | - | Ürün değeri artar |
| T-010 | Alarm motoruna gelişmiş koşullar (cross, RSI zone, volume spike) | Yüksek | M | Backlog | - | Daha güçlü otomasyon |
| T-011 | Skor açıklanabilirliği paneli (neden BUY/SELL?) | Çok Yüksek | M | Ready | - | Güven ve şeffaflık artar |
| T-012 | Sektör bazlı benchmark (SPY + sector ETF kıyas) | Yüksek | L | Backlog | T-006 | Strateji kıyaslama |
| T-013 | Kullanıcı onboarding + preset stratejiler (growth/swing/value) | Orta | M | Backlog | - | Aktivasyon artar |
| T-014 | Çoklu dil (TR/EN) i18n altyapısı | Düşük | M | Backlog | - | Erişilebilirlik |
| T-015 | PWA güçlendirme (offline snapshot + background sync) | Orta | L | Backlog | T-006 | Mobil deneyim |

---

## 3) Sprint Önerisi (İlk 2 Sprint)

### Sprint 1 (Temel sağlamlaştırma)
- T-001, T-002, T-003, T-011
- Hedef: kod tabanını stabilize etmek ve güvenilir geliştirme zemini kurmak.

### Sprint 2 (Güvenilir veri + performans)
- T-004, T-005, T-006, T-008
- Hedef: hesaplama doğruluğu + veri dayanıklılığı + render performansı.

---

## 4) GitHub Benzer Uygulama İnceleme Board'u

Bu ortamda GitHub’a doğrudan erişim denemeleri `403 CONNECT tunnel failed` ile sonuçlandı. Bu yüzden canlı repo doğrulaması yapılamadı; aşağıdaki kartlar **araştırma görevi** olarak açıldı.

| ID | Araştırma Taskı | Amaç | Durum |
|---|---|---|---|
| R-001 | Açık kaynak stock screener React projeleri listesi çıkar | Rakip özellik matrisi | Blocked (network) |
| R-002 | OpenBB/fintech dashboard UI desenlerini analiz et | Widget, layout, bilgi mimarisi | Backlog |
| R-003 | Portfolio tracker reposunda işlem günlüğü + P/L yaklaşımı incele | Portföy modülü güçlendirme | Backlog |
| R-004 | TradingView benzeri alert UX örnekleri topla | Alarm motoru UX standardı | Backlog |
| R-005 | Backtest açık kaynak çözümlerini incele (Python servis + JS UI) | İleri seviye strateji modülü | Backlog |

### Bu projeye eklenebilecek “iyi özellik” taskları (benchmark kaynaklı)
| ID | Feature Task | Neden değerli? | Efor | Durum |
|---|---|---|---|---|
| F-001 | Strateji Builder (if RSI<30 AND vol>1.5x vb.) | Kod yazmadan kural tanımı | L | Backlog |
| F-002 | Backtest mini motoru (paper mode) | Sinyallerin geçmiş performansı | L | Backlog |
| F-003 | Watchlist senkronizasyonu (cloud/local export-import) | Kullanıcı bağlılığı | M | Backlog |
| F-004 | Trade Journal + notlar + etiketleme | Öğrenme döngüsü | M | Backlog |
| F-005 | Risk paneli (position sizing, max drawdown uyarısı) | Sermaye koruması | M | Backlog |
| F-006 | Screener preset marketplace (Top Gainers, Momentum, Minervini) | Hızlı kullanım | M | Ready |

---

## 5) Senin için “Başlatılabilir” İlk Task Seti

Eğer hızlı başlamak istersen bu sırayı öneririm:
1. **T-001** – App dosya temizliği
2. **T-003** – Test altyapısı
3. **T-011** – Skor açıklama paneli
4. **T-006** – API retry/cache

Bu 4 görev tamamlanınca ürün hem daha güvenilir hem daha profesyonel görünür.
