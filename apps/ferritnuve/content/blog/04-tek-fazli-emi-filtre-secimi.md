# Tek fazlı EMI filtre nasıl seçilir? Akım, kaçak akım ve montaj rehberi

Bir EMI filtreyi yalnızca “3 A mı, 6 A mı?” sorusuyla seçmek yeterli değildir. Besleme gerilimi ve akımın yanında sıcaklık, parazitin frekansı, kaçak akım gereksinimi ve montaj yapısı da kontrol edilmelidir. Uygun aday, cihazın gerçek çalışma koşullarında doğrulanmalıdır.

## EMI ve EMC filtresi aynı şey mi?

EMI, elektromanyetik girişimi; EMC ise bir cihazın elektromanyetik ortamında uyumlu çalışabilmesini ifade eder. Satışta kullanılan “EMI filtre” ve “EMC filtre” adları aynı tür şebeke filtreleri için karşınıza çıkabilir. Ancak isim benzerliği, iki parçanın aynı elektriksel ve mekanik özelliklere sahip olduğunu göstermez. [1]

Bu yazı, tek fazlı şebeke girişinde kullanılacak filtre adaylarını değerlendirmeye odaklanır. Bir filtre seçilmiş olması, cihazın bütün EMC gereksinimlerini karşıladığı anlamına gelmez; uygunluk tamamlanmış cihaz üzerinde değerlendirilir. [1][2]

## 1. Önce beslemeyi ve gerçek giriş akımını belirleyin

Filtrenin anma gerilimi, besleme türü ve frekansına ilişkin üretici koşulları uygulamayla uyumlu olmalıdır. Akım seçiminde güç kaynağının çıkış gücünden doğrudan bir değer çıkarmak yerine gerçek giriş koşulları ve üretici giriş akımı verileri esas alınır. [2]

Örneğin ürünün üzerinde 6 A yazması, onu her 6 A uygulama için otomatik olarak uygun yapmaz. Sıcaklık ve üreticinin çalışma sınırları da incelenmelidir. Daha yüksek anma akımı seçmek ise tek başına daha iyi parazit bastırma anlamına gelmez.

Teklif talebine şu bilgileri birlikte eklemek yararlıdır:

- AC veya DC besleme türü, gerilim aralığı ve frekans.
- Cihazın en yüksek sürekli giriş akımı ve biliniyorsa geçici akım koşulları.
- Ortam sıcaklığı ve filtre çevresindeki havalandırma durumu.
- Mevcut filtrenin tam modeli veya cihazın giriş etiketi.

## 2. Sorunlu frekans bölgesini belirleyin

Filtre veri sayfalarında zayıflatma veya ekleme kaybı eğrileri bulunabilir. Bunlar belirtilen ölçüm koşullarına aittir. Standart bir ölçüm düzenindeki sonuç, kaynak ve yük empedanslarının farklı olduğu gerçek cihazda aynı miktarda zayıflatma elde edileceğini garanti etmez. [3]

Bu nedenle yalnızca eğrideki en yüksek dB değerine bakmayın. Ölçülen sorunun hangi frekanslarda görüldüğünü ve eğrinin hangi koşullara ait olduğunu karşılaştırın. Birden fazla aday varsa bunları aynı cihaz düzeninde değerlendirmek daha anlamlıdır. [2][3]

## 3. Ortak mod ve diferansiyel mod ayrımını okuyun

Üretici eğrilerinde ortak mod ve diferansiyel mod için ayrı sonuçlar verilebilir. Parazitin hangi yoldan taşındığı ve filtre bağlantısı, uygun çözümün değerlendirilmesinde önemlidir. Tek bir eğriyi filtrenin tüm koşullardaki performansı gibi okumamak gerekir. [3]

Ölçüm raporu varsa ilgili sayfayı taleple birlikte paylaşın. Rapor yoksa hangi cihazın, hangi yükte ve ne zaman sorun çıkardığını anlatın. “Parazit var” ifadesini somut koşullarla desteklemek, değerlendirmeyi hızlandırır.

## 4. Kaçak akım gereksinimini atlamayın

Filtre seçiminde kaçak akım verisi ve bu verinin ölçüm koşulları kontrol edilmelidir. Aynı ailede düşük kaçak akımlı seçenekler bulunabilir; bunların zayıflatma özellikleri de ayrıca değerlendirilir. Ürünün kullanılacağı sistemin gereksinimleri bilinmeden yalnızca “düşük kaçak akımlı” ifadesiyle uygunluk kararı verilmemelidir. [2][3]

Bu konu özellikle uygulamanın güvenlik ve sistem tasarımı koşullarıyla birlikte incelenir. Kaçak akım sınırı bilinmiyorsa teknik talepte açıkça belirtilmelidir. Bu rehber enerjili devrede bağlantı veya ölçüm talimatı değildir; şebeke tarafındaki uygulama, üretici talimatlarına göre yetkin teknik personel tarafından yapılmalıdır.

## 5. Mekanik yapı ve montajı ürünle birlikte seçin

IEC giriş filtresi, şasi tipi filtre ve güç giriş modülü farklı mekanik çözümler sunar. Seçim sırasında panel açıklığı, gövde ölçüsü, bağlantı uçları ve varsa sigorta/anahtar gibi ek işlevler ayrı kontrol edilmelidir. [4]

EMC davranışı, filtreyi çevreleyen kablo düzeninden de etkilenebilir. Bu nedenle ürün değişiminde sadece kasa ölçüsünü değil, bağlantı yönünü, kablo güzergâhını ve üreticinin gövde/topraklama talimatlarını da incelemek gerekir. [1][2]

## Bir filtre gerçekten işe yarıyor mu, nasıl değerlendirilir?

Önce filtresiz veya mevcut filtreyle elde edilmiş başlangıç sonucunu kaydedin. Adaylar değerlendirilirken yükü, kablo yerleşimini ve test koşullarını tutarlı tutun. Parazit frekansındaki değişimle birlikte sıcaklık ve uygulamaya ait diğer sınırlar da kontrol edilmelidir. Son karar, sistemin gerektirdiği testlerle doğrulanmalıdır. [1][2]

Bir bileşenin üzerinde onay işareti bulunması, tamamlanmış cihazın aynı onaylara sahip olduğu anlamına gelmez. Seçilen ürünün tam modeline ait güncel belgeler ile cihazın değerlendirme süreci ayrı ele alınır.

## Artek’e filtre talebi gönderirken

Besleme türü ve gerilimini, en yüksek giriş akımını, ortam sıcaklığını, biliniyorsa kaçak akım sınırını ve sorunlu frekansları paylaşın. Mevcut parçanın etiket fotoğrafını, bağlantı tipini, ölçülerini ve istenen adedi ekleyin. [Güç / EMI filtrelerini inceleyebilir](https://www.ferritnuve.com/products?categories=PEM) veya bilgilerinizle [Artek’e talep iletebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Güç kaynağında filtre varsa harici filtre gerekir mi?

Gereksinim, güç kaynağının tek başına testinden farklı olabilen tamamlanmış cihaz koşullarına bağlıdır. Kablo düzeni ve yük gibi etkenler nedeniyle ek filtreleme ihtiyacı oluşabilir; karar ölçümle desteklenmelidir. [2]

### Aynı akım değerindeki iki filtre birbirinin yerine geçer mi?

Akım yalnızca bir ölçüttür. Gerilim, sıcaklık, kaçak akım, zayıflatma koşulları, terminal yapısı ve montaj uyumu da karşılaştırılmalıdır. [2][3][4]

## Teknik kaynaklar

- [1] [SCHURTER: Endüstriyel şebeke filtreleri ve EMC bilgileri](https://www.schurter.com/en/knowledge/industrial-mains-filters).
- [2] [TDK-Lambda: Güç kaynağı için harici EMI filtre seçimi](https://blog.uk.tdk-lambda.com/uk/2015/07/09/how-do-i-select-an-external-emi-filter-for-use-with-a-power-supply/).
- [3] [TE Connectivity / Corcom: Ekleme kaybı ve kaçak akım dahil teknik notlar](https://www.te.com/content/dam/te-com/documents/industrial-intelligent-buildings/global/7_Tech%20Notes_Catalog.pdf).
- [4] [Delta Electronics: EMI filtre türleri](https://www.deltaww.com/en-US/products/EMI-Filters).
