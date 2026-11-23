# AL değeriyle sarım sayısı ve endüktans nasıl hesaplanır?

AL değeri, bir nüvenin tek sarımla verdiği endüktanstır ve ferrit nüve veri sayfalarında çoğunlukla nH olarak yazılır. Endüktans sarım sayısının karesiyle büyür: L = AL × N². İstenen endüktans için sarım sayısı N = √(L / AL) ile bulunur; ancak bu bir başlangıç değeridir, çünkü AL toleranslıdır ve nüvenin doyup doymayacağını söylemez.

## Bobin endüktans formülü: L = AL × N²

TDK, [AL değerini](https://www.ferritnuve.com/sozluk#al-degeri) sarım sayısı 1'e indirgenmiş endüktans olarak tanımlar ve N sarım için L = AL × N² bağıntısını verir. [1] Aynı üreticinin uygulama notu hesabı ters yönde de gösterir: AL değeri 100 nH olan bir nüvede 640 µH için N = √(L / AL) bağıntısı 80 sarım verir. [2]

AL yalnızca malzemeye ait bir sabit değildir; malzeme ile geometrinin ortak sonucudur. TDK'nın tanımına göre AL = µ0 × µe / (l/A) olur; burada µe [etkin geçirgenlik](https://www.ferritnuve.com/sozluk#etkin-gecirgenlik), l/A ise etkin manyetik yol uzunluğunun etkin kesite oranıdır (le / Ae). [1] Yani kesit büyüdükçe, manyetik yol kısaldıkça ve geçirgenlik arttıkça AL yükselir.

## Birim tuzağı: nH/N² ve 100 sarım için µH

Hesaptaki en yaygın hata birimdir. Ferrit veri sayfaları AL değerini nH olarak, yani sarım kare başına nH (nH/N²) verir. Demir tozu nüvelerde ise 100 sarım için µH yazımı da görülür. Micrometals, kataloğunda AL değerlerini nH/N² olarak verir ve dönüşümü şöyle örnekler: 100 sarım için 350 µH = 35,0 nH/N² = 1000 sarım için 35,0 mH. [3] Kural: 100 sarım için µH olarak verilen sayıyı 10'a bölerseniz nH/N² elde edersiniz; 1000 sarım için mH değeri ise nH/N² ile aynı sayıdır. Dönüşüm unutulursa AL 10 kat büyük alınır ve sarım sayısı yaklaşık 3,2 kat (√10) küçük çıkar. Ferrit ile demir tozu arasındaki fark için [ferrit ve demir tozu toroid rehberine](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) bakın.

## Toroid bobin hesabı: adım adım örnek

Örnek, TDK'nın R 25,3 × 14,8 × 10,0 mm ferrit toroididir. Veri sayfası N87 malzeme için AL = 2360 nH ±%25, le = 60,07 mm ve Ae = 51,26 mm² verir. [4] Hedef endüktans 1 mH olsun:

- Birimleri eşitleyin: L = 1 mH = 1 000 000 nH.
- Oranı bulun: L / AL = 1 000 000 / 2360 = 423,7.
- Karekök alın: N = √423,7 = 20,6. Sarım sayısı tam sayı olmalıdır; 21 sarım seçilir.
- Geri kontrol edin: L = 2360 × 21² = 2360 × 441 = 1 040 760 nH, yani yaklaşık 1,04 mH.

20 sarım seçilseydi sonuç 2360 × 400 = 944 000 nH, yani 0,94 mH olurdu. Bu sayılar yalnızca adı geçen TDK parçasına aittir; benzer ölçüdeki başka bir üreticinin toroidine uygulanamaz.

## AL toleransı ve hava aralığı sonucu nasıl değiştirir?

Endüktans AL ile doğru orantılı olduğundan tolerans doğrudan sonuca yansır. Örnekteki ±%25 tolerans, AL değerinin 1770 nH ile 2950 nH arasında olabileceği anlamına gelir; 21 sarımlı bobin 0,78 mH ile 1,30 mH arasında ölçülebilir.

[Hava aralığı](https://www.ferritnuve.com/sozluk#hava-araligi) etkin geçirgenliği ve dolayısıyla AL değerini düşürür. [1] TDK'nın ETD 39/20/13 nüvesi bunu sayıyla gösterir: N87 malzemede aralıksız takım 2700 nH (+%30/−%20), 1,00 mm aralıklı takım ise yaklaşık 196 nH verir. [5] Aynı 1 mH için aralıksız takımda 20, aralıklı takımda 72 sarım gerekir. Karşılığında TDK, hava aralığının dar AL toleranslarına ulaşmayı sağladığını belirtir. [2]

Demir tozu nüvelerde tolerans daha dardır: Micrometals, tipik AL toleransını karışıma göre ±%5 veya ±%10 olarak verir. [6]

## AL değerinin söylemediği: doyma, çubuk ve makara nüveler

AL küçük sinyal değeridir. Micrometals, AL değerlerinin 10 kHz'de 1 mT tepe akı yoğunluğuna göre verildiğini, başka koşullardaki ölçümlerin farklı sonuç vereceğini belirtir. [6] Bu yüzden akım altındaki akı yoğunluğu ayrıca hesaplanmalıdır. Texas Instruments'ın Faraday yasasından çıkardığı bağıntı N = L × ΔI / (ΔB × Ae) biçimindedir; tepe değerler için B = L × I / (N × Ae) olarak yazılabilir. Aynı kaynak güç ferriti için temkinli doyma sınırı olarak yaklaşık 0,3 T alır. [7]

Örnekteki bobinde (1,04 mH, 21 sarım, Ae = 51,26 mm²) 0,2 A tepe akım 0,19 T verir; 0,3 T sınırına yaklaşık 0,31 A'da ulaşılır. Bu, veri sayfası değerlerinden yapılmış bir hesaptır ve AL formülünün tek başına yetmediğini gösterir.

Çubuk ve makara nüvelerin manyetik yolu açıktır. [8] TDK, silindirik nüvelerde yüksek kaçak endüktans nedeniyle µi ile µe arasında kesin bir ilişki kurulamadığını, sargının tasarımının ve konumunun sonucu belirgin biçimde etkilediğini belirtir. [1] Bu nedenle tek bir AL bu nüvelerde aynı biçimde geçerli değildir; Fair-Rite çubuk için boy/çap oranına bağlı bir çubuk geçirgenliği ve sargı boyunun çubuk boyuna oranına bağlı bir düzeltme katsayısı kullanır. [9] Ayrıntı için [ferrit çubuk nüve rehberine](https://www.ferritnuve.com/blog/ferrit-cubuk-nuve-secimi) bakın.

Son adım her zaman ölçümdür. Micrometals, az sayıda ve eşit dağıtılmamış sarımla ölçülen toroidlerin beklenenden yüksek endüktans verdiğini belirtir. [6] Hesaplanan sarımla bir numune sarın, çalışma frekansında ve akımında ölçün, sonra sarım sayısını düzeltin. Biçim ve malzeme seçimi için [ferrit toroid nüve rehberine](https://www.ferritnuve.com/blog/ferrit-toroid-nuve-secimi) bakın.

## Artek’e AL değeri sorarken

Artek kataloğunda ferrit toroidler (örneğin T 25 / 15 / 10 - CF199), EE nüveler (örneğin EE 25 / 13 / 7 - CF139), ETD nüveler (örneğin ETD 39 / 20 / 13- CF139) ve demir tozu toroidler (örneğin T 106 - 26) bulunur. Katalog bu parçalar için AL değeri yayımlamaz; AL değeri talep sırasında sorulmalıdır. Benzer ölçüdeki başka bir üreticinin AL değerini bu parçalar için kullanmayın. Talebinizde şunları paylaşın:

- Katalogdaki tam ürün adı ve istenen adet.
- Hedef endüktans ve kabul edilebilir tolerans.
- Tepe akım, varsa DC bileşen ve çalışma frekansı.
- Hava aralığı gerekip gerekmediği.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya bu bilgilerle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### AL değeri nedir?

AL değeri, bir nüvenin tek sarım için verdiği endüktanstır; N sarımlı bobinin endüktansı L = AL × N² ile bulunur. Değer hem malzemenin geçirgenliğine hem de nüvenin etkin kesitine ve manyetik yol uzunluğuna bağlıdır. [1]

### Sarım sayısı hesaplama formülü nedir?

İstenen endüktans AL değerine bölünür ve karekökü alınır: N = √(L / AL). L ile AL aynı birimde olmalıdır; örneğin AL nH ise endüktans da nH'ye çevrilir. TDK'nın örneğinde 100 nH'lik AL ile 640 µH için 80 sarım bulunur. [2]

### AL değeri bobinin doyma akımını verir mi?

Hayır. AL düşük akı yoğunluğunda ölçülen bir küçük sinyal değeridir. [6] Doyma için tepe akı yoğunluğu B = L × I / (N × Ae) ile ayrıca hesaplanmalı ve malzemenin sınırıyla karşılaştırılmalıdır. [7]

## Teknik kaynaklar

- [1] [TDK: Ferritler ve aksesuarlar — genel tanımlar](https://www.tdk-electronics.tdk.com/download/187036/dbcde584d155cc270f5d5dbf1efec233/pdf-generaldefinitions.pdf).
- [2] [TDK: Ferritler ve aksesuarlar — uygulama notları](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [3] [Micrometals: Güç dönüşümü ve hat filtresi uygulamaları kataloğu, Issue L (2007), MIT ders arşivindeki kopya](https://ee6131b.mit.edu/document/micrometals.pdf).
- [4] [TDK: R 25.3 × 14.8 × 10.0 toroid veri sayfası](https://www.tdk-electronics.tdk.com/inf/80/db/fer/r_25_3_14_8_10_0.pdf).
- [5] [TDK: ETD 39/20/13 nüve veri sayfası](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [6] [Micrometals: 2023 ürün kataloğu, toleranslar bölümü](https://s3.amazonaws.com/micrometals-production/filer_public/f4/da/f4da63c8-44fc-4d87-a290-bf3f5c8ae2de/micrometals_2023_catalog-final_122123.pdf).
- [7] [Texas Instruments: Bobin ve flyback transformatörü tasarımı](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [8] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [9] [Fair-Rite: Çubuk nüve 4078377511 ürün sayfası](https://fair-rite.com/product/rods-4078377511).
