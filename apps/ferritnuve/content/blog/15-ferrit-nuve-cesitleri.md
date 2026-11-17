# Ferrit nüve çeşitleri: EE, ETD, UU, toroid, çubuk, makara — hangisi ne için?

Ferrit nüve çeşitleri iki gruba ayrılır: manyetik yolu kapalı olanlar (EE, ETD, UU ve toroid) ve manyetik yolu açık olanlar (çubuk ve makara). Kapalı yol trafo ve yüksek endüktanslı bobinler için, açık yol ise düşük ama kararlı endüktans isteyen bobinler ve antenler için tercih edilir. Aşağıda her biçimin ne işe yaradığını, karkas kullanıp kullanmadığını ve hangi seçim rehberine bakmanız gerektiğini kısaca bulabilirsiniz.

## Önce temel ayrım: kapalı ve açık manyetik yol

Vishay, manyetik yolu kapalı sayılan yaygın biçimleri toroidler, E nüveler ve çoğu pot nüve olarak sayar; çubuk nüveler ve ekransız makara nüveler ise açık manyetik yola sahiptir. [1] Kapalı yolda akı büyük ölçüde nüvenin içinde kalır. Açık yolda akının bir bölümü havadan tamamlanır; bu yüzden aynı malzemeyle daha düşük endüktans elde edilir ve çevreye yayılan alan artar.

Biçim seçimi yalnızca manyetik bir karar değildir. Magnetics, nüve biçimlerini nüve maliyeti, karkas maliyeti, sarım maliyeti, sarım esnekliği, montaj, ısı atımı ve ekranlama başlıklarında karşılaştırır. [2] Ferritin kendisini merak ediyorsanız önce [ferrit nüve nedir yazısını](https://www.ferritnuve.com/blog/ferrit-nuve-nedir) okuyabilirsiniz.

## EE nüve: karkaslı, esnek ve yaygın

EE nüve, iki E biçimli yarımın bir karkasın içinden geçirilerek birleştirilmesiyle kullanılır; sargı karkasa sarılır. Magnetics'in karşılaştırma tablosunda E nüve, nüve, karkas ve sarım maliyetinde en düşük, sarım esnekliğinde en iyi sınıftadır; ekranlamada ise en zayıf sınıfta yer alır. [2] Aynı kaynak E nüveleri güç trafoları, dönüştürücü trafoları, güç bobinleri ve ortak mod bobinleri için uygun biçimler arasında sayar. [2]

Artek kataloğunda EE 13'ten EE 110'a kadar EE nüveler bulunur. Ayrıntı için [EE nüve seçim rehberine](https://www.ferritnuve.com/blog/ee-nuve-secimi) bakın.

## ETD nüve: SMPS trafosu için tasarlanmış biçim

ETD, E ailesinin anahtarlamalı güç kaynağı (SMPS) trafoları için geliştirilmiş üyesidir. TDK, ETD 39/20/13 nüvesini IEC 63093-6'ya göre tanımlar ve “küçük hacimde en uygun ağırlık/performans oranına sahip SMPS trafoları için” olduğunu belirtir; aynı belgede bu nüveye ait karkas ve tutucu parçalar da listelenir. [3] Magnetics tablosunda EC, ETD ve EER grubu sarım esnekliğinde en iyi sınıfta, nüve ve karkas maliyetinde orta sınıftadır. [2]

Artek kataloğunda ETD 29, 39, 44, 49, 54 ve 59 nüveler bulunur. Malzeme, AL değeri, hava aralığı ve karkas uyumu için [ETD nüve seçim rehberine](https://www.ferritnuve.com/blog/etd-nuve-secimi), sarım talebi hazırlıyorsanız [özel trafo teklif rehberine](https://www.ferritnuve.com/blog/ozel-trafo-teklif-rehberi) bakın.

## UU nüve: hat filtresi bobini ve büyük güç trafosu

UU nüve, iki U yarımın karşılıklı kapanmasıyla oluşur; aynı U yarım düz bir I parçayla da kapatılabilir. Küçük UU nüveler şebeke hattı filtrelerinde kullanılır: KEMET, SU serisi ortak mod bobinlerinin ferrit UU nüvelerle tasarlandığını belirtir. [4] Büyük U nüveler ise güç tarafındadır: TDK, U 93/76/30 nüvesini 20 kHz'de 1 kW üzerindeki güç trafoları için tanımlar ve UU ile UI kombinasyonlarını ayrı ayrı verir. [5]

Artek kataloğunda UU 9.8'den UU 126 / 45 / 20'ye kadar UU nüveler ile UUR ve I parçalar bulunur. Ölçü, kombinasyon ve AL değeri için [UU nüve seçim rehberine](https://www.ferritnuve.com/blog/uu-nuve-secimi) bakın.

## Toroid nüve: karkassız, kapalı halka

Toroid tek parça bir halkadır; karkas kullanılmaz ve tel doğrudan nüveye sarılır. Magnetics tablosunda toroid, nüve maliyetinde en düşük ve ekranlamada en iyi sınıftadır; buna karşılık sarım maliyeti en yüksek, sarım esnekliği en düşük sınıftadır. [2] TDK, toroidlerin öncelikle MHz bölgesindeki RF parazitini bastıran EMC bobinlerinde ve sinyal trafolarında kullanıldığını, güç uygulamalarında da giderek daha fazla yer aldığını belirtir. [6]

Artek kataloğunda T 13 / 7 / 5 - CF139 ile T 100 / 55 / 20 - CF199 arasında ferrit toroidler ve -26 ile -52 kodlu demir tozu toroidler bulunur. [Ferrit toroid nüve seçim rehberi](https://www.ferritnuve.com/blog/ferrit-toroid-nuve-secimi) ölçü, AL ve kaplamayı; [ferrit ve demir tozu toroid rehberi](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) malzeme seçimini anlatır.

## Çubuk ve makara nüve: açık manyetik yol

Çubuk (rod) nüve düz bir silindirdir ve açık manyetik yola sahiptir. [1] Ferroxcube, çubuk nüveleri 1,5 mm ile 12 mm arası çaplarda ve iki ayrı malzemede listeler. [7] Fair-Rite da NiZn 61 malzemesinin sunulduğu biçimler arasında çubukları ve anten/RFID çubuklarını sayar. [8] Artek kataloğunda ROD 5 x 20 ile ROD 28 x 20 arasında çubuk nüveler bulunur; ayrıntı [ferrit çubuk nüve seçim rehberindedir](https://www.ferritnuve.com/blog/ferrit-cubuk-nuve-secimi).

Makara nüve, iki ucunda flanş bulunan makara biçimli bir ferrit parçadır; Vishay bu biçimi bacaklı veya bacaksız, eksenel ve radyal tiplerde sunulan bir nüve olarak tanımlar. [1] Fair-Rite, makara nüveleri görece düşük ama kararlı endüktans gereken uygulamalar için ekonomik ve denenmiş bir tasarım olarak tanımlar. [9] Makara nüve, sargının üzerine sarıldığı plastik karkasla karıştırılmamalıdır. Artek kataloğunda MAKARA 8X10, 9X12 ve 22X19 kayıtları bulunur; ayrıntı [makara ferrit nüve seçim rehberindedir](https://www.ferritnuve.com/blog/makara-ferrit-nuve-secimi).

## Kablo ferritleri: ferrit halka ve parazit önleyici filtre

Kabloya takılan ferrit halka veya klipsli ferrit filtre de bir ferrit nüvedir, ancak sargı taşımaz; kablonun kendisi nüvenin içinden geçer. Würth Elektronik, ferrit nüvelerin ve geçmeli ferritlerin elektromanyetik paraziti doğrudan etkilenen kablo üzerinde bastırmak için tasarlandığını belirtir. [10] Artek kataloğunda 6 mm ile 14.5 mm arası yuvarlak kablo ferritleri ve yassı parazit önleyici kablo filtreleri bulunur. Seçim için [kablo ferriti rehberine](https://www.ferritnuve.com/blog/kablo-ferriti-secimi) ve [yassı kablo ferriti rehberine](https://www.ferritnuve.com/blog/yassi-kablo-ferriti-secimi) bakın.

Malzeme, AL değeri, doyma ve sıcaklık artışı her uygulamada ayrıca doğrulanmalıdır; malzeme işaretleri için [CF ferrit malzeme kodları rehberine](https://www.ferritnuve.com/blog/cf-ferrit-malzeme-kodlari) bakabilirsiniz.

## Artek’e ferrit nüve talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları “bilinmiyor” olarak belirtin:

- Nüve biçimi (EE, ETD, UU, toroid, çubuk, makara) ve tam ölçüler veya çizim.
- Okunabilen üretici ve malzeme işareti, mevcut parçanın fotoğrafı.
- Karkas, klips veya tutucu gerekip gerekmediği.
- Uygulama (SMPS trafosu, şok bobini, hat filtresi, anten), frekans ve akım.
- Biliniyorsa hedef AL değeri ve hava aralığı.
- İstenen adet.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya ölçü ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Kaç çeşit ferrit nüve vardır?

Sabit bir sayı yoktur; üreticiler onlarca biçim sunar. Magnetics yalnızca karşılaştırma tablosunda toroid, E, EC/ETD/EER, ER/planar, PQ, pot, DS/RM ve EP gruplarını ayrı ayrı değerlendirir. [2]

### Ferrit nüve karkası her nüve biçiminde kullanılır mı?

Hayır. EE ve ETD gibi iki yarımlı nüvelerde sargı karkasa sarılır; TDK, ETD 39/20/13 belgesinde nüveyle birlikte karkası ve tutucuyu da listeler. [3] Toroidde karkas yoktur; Magnetics tablosunda toroid için karkas maliyeti “uygulanmaz” olarak geçer. [2]

### Ortak mod şok bobini için hangi nüve biçimi kullanılır?

Magnetics, ortak mod bobinleri için toroidleri ve E nüveleri uygun biçimler olarak sayar. [2] KEMET'in SU serisi gibi hat filtresi bobinlerinde ise UU nüveler kullanılır. [4]

## Teknik kaynaklar

- [1] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Magnetics: Ferrit nüveler, uygulama ve biçim karşılaştırma tabloları](https://www.mag-inc.com/Products/Ferrite-Cores).
- [3] [TDK: ETD 39/20/13 nüve ve aksesuarları](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [4] [KEMET: SU9V/9H ortak mod bobinleri veri sayfası](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [5] [TDK: U 93/76/30 ve I 93/28/30 nüve verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
- [6] [TDK: Toroidler (halka nüveler) genel bilgi ve boyut listesi](https://www.tdk-electronics.tdk.com/download/531586/73928c3d18a19eefb58bf397e6c83a42/pdf-toroids-general-information.pdf).
- [7] [Ferroxcube: ROD nüve verileri](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/rod.pdf).
- [8] [Fair-Rite: 61 malzeme veri sayfası](https://fair-rite.com/61-material-data-sheet/).
- [9] [Fair-Rite: Makara nüve 9677182208 ürün sayfası](https://fair-rite.com/product/bobbins-9677182208).
- [10] [Würth Elektronik: Kablo ferritleri ve kablo çözümleri](https://www.we-online.com/en/components/productnavigator/cable-solutions).
