# Artek operasyon demosu

Bağımsız, tarayıcı içinde çalışan Türkçe demo. Mevcut satış sitesi kodunu, gerçek stokları veya dış sistemleri değiştirmez. Ürün miktarları, fiyatlar, müşteri adları, teknik reçeteler ve 19 Ekim 2026 referans takvimi örnektir. Kullanıcının verdiği referans: Çekmeköy'de üç kişiyle 1.000 çit trafosu, üretim boşken test dahil yaklaşık dört gün. Demoda bu süre dört iş günü varsayılmıştır; gerçek çalışma takvimi ayrıca netleştirilmeli.

## Açma

Depoda kurulu Next.js sunucusu üzerinden `/yonetim-demo/index.html` adresi kullanılabilir. Ayrı önizleme için depo kökünde:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public/yonetim-demo
```

Sonra `http://127.0.0.1:4173/` adresini açın. ES modülleri nedeniyle HTML dosyasını doğrudan `file://` ile açmayın.

## Denenebilir akışlar

- Genel bakış ve depo filtreleri; ekran içi ürün/müşteri araması.
- Hazır ürün satışı, örnek web satışı, tahsilat, fiyat değişikliği. Geçmiş satışın fiyatı korunur.
- Konum bazında stok, onaylı sayım farkı, mal kabulü, CSV indirme.
- Transfer oluşturma → gönderme → karşı depoda teslim alma. Yoldaki miktar iki depoda birden görünmez.
- Özel üretim siparişi → teknik reçete ve rezervasyon → sıra → üretim/tüketim → test/düzeltme → bitmiş ürün → teslimat/satış.
- Üretim sırasında ek malzeme tüketimi.
- Üç kişilik tek ekip için sıralı iş planı ve ek bekleme simülasyonu; teknik hazırlığı bitmeyen işlerde koşullu öneri.
- İşlem geçmişi, tarayıcıya kayıt ve onaylı demo sıfırlama.

## Sınırlar

Sunucu/veritabanı, gerçek kullanıcı yetkilendirmesi, çok kullanıcılı eşzamanlılık, gerçek site entegrasyonu, muhasebe, vergi ve e-belge bağlantısı yoktur. İşlerin tamamı tek parti olarak ilerler; kısmi üretim/teslimat uygulanmamıştır. Üretim planı otomatik müşteri taahhüdü değildir. Yerel kayıt `artek-operations-demo-v1` anahtarında tutulur; cihazlar ve farklı origin'ler arasında paylaşılmaz. Fiyatlar TRY cinsindedir; maliyet ve kârlılık motoru bu sürümde yoktur. Demo rollerin ekran ihtiyacını gösterir, erişim kontrolü sağlamaz. Gerçek şirket verisi girilmemelidir.

Ürün/miktar mutasyonları kopyalanmış state üzerinde doğrulanır; başarısız işlem kısmi stok değişikliği oluşturmaz. Rezervasyondan fazla satış, ayrılmış miktarın altına sayım, mükerrer transfer teslimi, mükerrer iş teslimi ve aynı ekibin eşzamanlı iki üretime başlaması engellenir.

## Kontrol

```sh
node --test scripts/test-operations-demo.mjs
node --check public/yonetim-demo/app.mjs
```
