# Ferrit toroid nüve nasıl seçilir? Toroid bobin ve ortak mod şok bobini için kontrol listesi

Ferrit toroid nüve, halka biçimli ve standart hâlinde hava aralığı olmayan kapalı bir manyetik yol sunan nüve tipidir; toroid bobin ve ortak mod toroid şok bobini sarmak için kullanılır. Doğru parçayı seçmek için dış çap tek başına yetmez: dış çap, iç çap ve yükseklik, malzemenin geçirgenlik sınıfı, AL değeri, kaplama ve doyma davranışı birlikte kontrol edilmelidir.

## Ferrit toroid nüve nerelerde kullanılır?

TDK, toroid nüvelerin öncelikle MHz bölgesindeki RF parazitini bastıran EMC bobinlerinde ve sinyal trafolarında kullanıldığını, güç uygulamalarında da giderek daha fazla yer aldığını belirtir. Aynı belge, parazit bastırma için yüksek geçirgenlikli MnZn malzemeleri listeler; R 13.3 ile R 26 arası boyutlar şebeke hattı bobinleri içindir. [1]

Magnetics de 5.000, 10.000 ve 15.000 geçirgenlikli malzemelerinin uygulamalarını ortak mod bobinleri, EMI filtreleri, geniş bant trafoları, darbe trafoları ve akım trafoları olarak sayar. [2]

Artek kataloğunda T 13 / 7 / 5 - CF139 ile T 100 / 55 / 20 - CF199 arasında ferrit toroid nüveler bulunur; katalog görselinde yeşil kaplamalı bir toroid yer alır. Ferrit ile demir tozu arasındaki seçim için [ferrit ve demir tozu toroid rehberine](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) bakabilirsiniz.

## 1. Dış çap, iç çap ve yüksekliği birlikte verin

Toroid nüve üç ölçüyle tanımlanır: dış çap, iç çap ve yükseklik. TDK da toroidlerini bu sırayla adlandırır ve 2,5 mm ile 202 mm arasında çaplar sunar. [1] Artek katalog adları da aynı düzendedir: T 25 / 15 / 10 - CF199 gibi.

Yakın görünen ölçüler aynı parça anlamına gelmez; TDK'nın bu boyuta yakın standart nüvesi R 25.3/14.8/10 adını taşır. Kaplama da ölçüyü değiştirir: TDK bu nüvenin kaplamalı hâli için dış çapı en fazla 26,6 mm, iç çapı en az 13,5 mm, yüksekliği en fazla 11,0 mm olarak verir. [3] İç çapın küçülmesi sarım için kalan alanı azaltır.

Mevcut bir parçayı değiştiriyorsanız şunları kaydedin:

- Dış çap, iç çap ve yükseklik; ölçümün kaplamalı parça üzerinde yapılıp yapılmadığı.
- Tel çapı, sarım sayısı ve sargı sayısı.

## 2. Geçirgenlik sınıfını uygulamaya göre seçin

Aynı ölçüdeki toroid, çok farklı malzemelerle sunulabilir. TDK, R 25.3/14.8/10 nüvesini başlangıç geçirgenliği yaklaşık 2200 olan N87'den yaklaşık 10000 olan T38'e kadar yedi malzemede listeler. [3] Parazit bastırma için yüksek geçirgenlikli MnZn malzemeler önerilir; güç uygulamalarında ise özel güç malzemelerinin genlik geçirgenliği ve güç kaybı değerleri esas alınır. [1] Magnetics, 750 ile 3.000 arasındaki geçirgenlikteki malzemelerle yapılan toroidleri yüksek frekans trafoları için uygun bulur. [2]

Artek kataloğunda 63 / 38 / 25 ölçüsü iki ayrı kayıtla yer alır: T 63 / 38 / 25 - CF195 ve T 63 / 38 / 25 - CF199. Bu, ölçünün tek başına yeterli olmadığını gösterir. Katalog adındaki malzeme işaretinin anlamı parçanın kendi veri sayfasıyla doğrulanmalıdır; başka bir üreticinin verisi bu parçalara atanmamalıdır.

## 3. AL değerinden sarım sayısını hesaplayın

AL değeri, endüktansın sarım sayısının karesine oranıdır: AL = L / N². [1] Bu nedenle malzeme değişince aynı sarım sayısı çok farklı endüktans verir. TDK'nın R 25.3/14.8/10 nüvesinde AL değeri N87 için 2360 nH, T38 için 10700 nH'dir. [3] On sarımda bu, yaklaşık 0,24 mH ile 1,07 mH arasındaki fark demektir.

AL bir nominal değerdir. Aynı veri sayfasında tolerans malzemeye göre %25 veya %30'dur. [3] TDK ayrıca kaplamanın, nüve boyutuna bağlı olarak başlangıç geçirgenliğini düşürdüğünü ve yüksek sarım kuvvetlerinin özellikle yüksek geçirgenlikli malzemelerde benzer bir etki yapabileceğini belirtir. [1] Hedef endüktansı sarılmış numunede ölçerek doğrulayın.

## 4. Kaplama ve yalıtımı kontrol edin

Toroidde tel doğrudan nüveye sarıldığı için kaplama hem kenarları korur hem de yalıtım işlevi görür. TDK, orta ve büyük boyutlarda 0,4 mm'den ince mavi epoksi kaplama kullanır; en düşük delinme gerilimi R 20'ye kadar olan boyutlarda 1,0–1,5 kV'un, R 20 üzerinde 2,0 kV'un üzerindedir. [1]

Cosmo Ferrites, kaplamalı nüvelerin genellikle yeşil, mavi ve gri renklerde sunulduğunu, kaplamasız nüvelerde ise sarımdan önce bantla yalıtım gerektiğini belirtir. [4] Renk üreticiye göre değiştiğinden malzemeyi veya yalıtım dayanımını tek başına göstermez.

## 5. Doyma ve hava aralığını hesaba katın

Magnetics, ferrit toroidlerde hava aralığı olmadığını ve kesit alanının düzgün olduğunu, bunun yüksek manyetik verim sağladığını belirtir. [2] Aynı özellik, DC akım taşıyan bir toroid bobinde doymanın ayrıca kontrol edilmesini gerektirir. TDK, aralıklı ferrit toroidlerin esas olarak dönüştürücülerdeki güç bobinlerinde kullanıldığını, aralığın doyma olmadan yüksek akıma izin verdiğini ve orta ile büyük boy toroidlerin kesilerek aralıklı sunulabildiğini açıklar. [1]

## Artek’e ferrit toroid nüve talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları “bilinmiyor” olarak belirtin:

- Dış çap, iç çap, yükseklik ve mevcut parçanın fotoğrafı.
- Okunabilen üretici ve malzeme işareti, kaplama rengi.
- Biliniyorsa hedef AL değeri veya endüktans ile sarım sayısı.
- Uygulama (ortak mod şok bobini, toroid bobin veya trafo), frekans, akım ve varsa DC bileşen.
- İstenen adet.

Katalogdaki [ferrit toroid nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=TOROID) veya ölçü ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Ferrit toroid nüvede hava aralığı var mı?

Standart ferrit toroidde hava aralığı yoktur. [2] Üreticiler orta ve büyük boy toroidleri kesilerek açılmış aralıkla da sunabilir; bu durumda aralık kalınlığı siparişte ayrıca belirtilir. [1]

### Kaplama toroid nüvenin AL değerini etkiler mi?

TDK, epoksi kaplamanın AL değerine etkisini düşük olarak tanımlar, ancak kaplamanın nüve boyutuna bağlı olarak başlangıç geçirgenliğini düşürdüğünü de belirtir. [1]

### Aynı ölçüdeki iki toroid nüve birbirinin yerine kullanılabilir mi?

Yalnızca malzeme ve AL değeri de uyuyorsa. TDK'nın tek bir boyutunda AL değeri malzemeye göre 2360 nH ile 10700 nH arasında değişir. [3]

## Teknik kaynaklar

- [1] [TDK: Toroidler (halka nüveler) genel bilgi ve boyut listesi](https://www.tdk-electronics.tdk.com/download/531586/73928c3d18a19eefb58bf397e6c83a42/pdf-toroids-general-information.pdf).
- [2] [Magnetics: Ferrit toroidler ürün sayfası](https://www.mag-inc.com/Products/Ferrite-Cores/Ferrite-Toroids).
- [3] [TDK: R 25.3/14.8/10 toroid nüve verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/r_25_3_14_8_10_0.pdf).
- [4] [Cosmo Ferrites: Kaplamalı ve kaplamasız toroid nüveler](https://www.cosmoferrites.com/news-events/everything-you-need-to-know-about-coated-uncoated-toroidal-cores).
