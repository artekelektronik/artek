# CF139, CF297 ve CF199 ne demek? Ferrit malzeme kodları nasıl okunur, N87 muadili nasıl kontrol edilir?

CF139, CF297 ve CF199, Cosmo Ferrites’in malzeme belgesi yayımladığı ferrit malzeme kodlarıdır. [1][2][3] Kod, hangi veri sayfasının açılacağını söyler; parçayı tek başına tanımlamaz. Bir kodu okumak için önce malzemenin güç malzemesi mi yoksa yüksek geçirgenlikli malzeme mi olduğuna bakın, ardından TDK N87 veya Ferroxcube 3C90 gibi başka bir üreticinin malzemesiyle yalnızca aynı koşulda ölçülmüş değerler üzerinden karşılaştırın.

## Ferrit malzeme kodu nerede karşınıza çıkar?

Malzeme kodları çizimlerde, nüve veri sayfalarında ve katalog adlarında yer alır. Cosmo Ferrites, CF139’u 200 kHz’e kadar düşük frekanslı ve genel amaçlı güç trafoları için Mn-Zn ferrit malzeme, CF297’yi ise 300 kHz’e kadar düşük kayıplı güç uygulamaları için Mn-Zn malzeme olarak tanımlar. [1][2] CF199’u geniş bantlı trafolar ve EMI-EMC filtreleri için yüksek geçirgenlikli Mn-Zn malzeme olarak tanımlar. [3]

Artek kataloğundaki birçok ad böyle bir işaretle biter; örneğin EE 25 / 13 / 7 - CF139, ETD 39 / 20 / 13 - CF139, ETD 59 31 / 21.5 - CF297, T 25 / 15 / 10 - CF199, T 63 / 38 / 25 - CF195, T 42 / 26 / 18 - CF197 ve UU 101 / 76 / 30 - N87. Nüve biçimini seçmek için [EE nüve seçimi](https://www.ferritnuve.com/blog/ee-nuve-secimi) ve [ETD nüve seçimi](https://www.ferritnuve.com/blog/etd-nuve-secimi) rehberlerine bakabilirsiniz.

## 1. Kod, bir üreticinin veri sayfasına aittir

Her üretici kendi malzemelerini kendisi tanımlar. Cosmo Ferrites CF139 için, TDK SIFERRIT malzemesi olarak N87 için, Ferroxcube ise 3C90 için malzeme belgesi yayımlar. [1][6][7]

Katalog adındaki aynı harfler bir etikettir; parçayı kimin ürettiğini kanıtlamaz. Artek kataloğunda UU 93 / 76 / 30 - CF139 ve UU 93 / 76 / 30 EPCOS adlı ayrı kayıtlar bulunur. Artek kataloğundaki bir parçanın malzemesini, talep sırasında parçanın kendi işareti ve veri sayfasıyla doğrulayın; yalnızca addan yola çıkarak veri sayfası değeri varsaymayın.

## 2. Güç malzemesi mi, yüksek geçirgenlikli malzeme mi?

İki grup farklı işler için yapılır ve bu, veri sayfalarından anlaşılır. Cosmo Ferrites, güç malzemeleri CF139 ve CF297 için 100 kHz’de güç kaybını ve 210 °C’nin üzerinde Curie sıcaklığını verir. [1][2] Cosmo, CF195 ve CF197’yi orta geçirgenlikli, CF199’u yüksek geçirgenlikli olarak adlandırır; bu üç malzeme için güç kaybı yerine 0,25 mT’de bağıl kayıp faktörünü verir; uygulama olarak geniş bantlı trafoları ve EMI bastırma filtrelerini belirtir. [3][4][5]

Cosmo’nun kendi değerleri, başlangıç geçirgenliği 25 °C, 10 kHz ve en fazla 0,25 mT koşulunda olmak üzere şöyledir:

- CF139: başlangıç geçirgenliği 2100 ±%20; doyma akı yoğunluğu 25 °C’de 490 mT, 100 °C’de 390 mT (10 kHz, 1200 A/m). [1]
- CF297: başlangıç geçirgenliği 2300 ±%20; 25 °C’de 520 mT, 100 °C’de 410 mT. [2]
- CF195: başlangıç geçirgenliği 5000 ±%20; 25 °C’de 400 mT, 100 °C’de 260 mT; Curie sıcaklığı 120 °C’nin üzerinde. [4]
- CF197: başlangıç geçirgenliği 7000 ±%20; 400 mT ve 260 mT; Curie sıcaklığı 115 °C’nin üzerinde. [5]
- CF199: başlangıç geçirgenliği 9000 ±%20; 400 mT ve 260 mT; Curie sıcaklığı 115 °C’nin üzerinde. [3]

## 3. Muadil ararken hangi değerler karşılaştırılır?

Bir güç malzemesine muadil ararken iki veri sayfasının şu satırlarını karşılaştırın:

- Başlangıç geçirgenliği ve toleransı.
- 100 °C’deki doyma akı yoğunluğu ve kullanılan alan şiddeti.
- Belirtilen frekans, akı yoğunluğu ve sıcaklıktaki nüve kaybı.
- Curie sıcaklığı.
- Kaybın en düşük olduğu sıcaklığı gösteren kayıp-sıcaklık eğrisi.

Cosmo Ferrites, TDK ve Ferroxcube kayıp-sıcaklık eğrisi verir. [1][6][7]

## 4. Yalnızca aynı ölçüm koşulunda karşılaştırın

Dört belgede ortak olan bir koşul vardır: 100 kHz, 200 mT, 100 °C. Cosmo Ferrites bu koşulda CF139 için en fazla 380 kW/m³, CF297 için en fazla 350 kW/m³ verir. [1][2] TDK, N87 için tipik değer olarak 375 kW/m³ verir. [6] Ferroxcube, 3C90 için yaklaşık 450 kW/m³ verir. [7]

Bu sayılar birbirine yakındır, ancak üst sınır ile tipik değer farklı ifadelerdir. Bazı satırlar ise hiç eşleşmez. Cosmo, CF139 kaybını 100 kHz, 100 mT, 100 °C’de (en fazla 60 kW/m³), Ferroxcube da 3C90 kaybını aynı noktada (en fazla 80 kW/m³) verir; TDK’nın N87 tablosunda ise bunun yerine 25 kHz, 300 kHz ve 500 kHz noktaları yer alır. [1][7][6]

Doyma akı yoğunluğunu karşılaştırmak daha kolaydır, çünkü üç üretici de 10 kHz’de 1200 A/m kullanır: 100 °C’de CF139 ve N87 için 390 mT, 3C90 için yaklaşık 380 mT. [1][6][7]

## 5. Muadili uygulamada doğrulayın

Malzeme verileri küçük toroidlerde ölçülür: Cosmo 25 mm × 15 mm × 12 mm toroidlerde, TDK ise R34 toroidlerde ölçer. [1][6] TDK, bir ürünün belirli bir uygulamaya uygun olup olmadığını kontrol etmenin müşteriye ait olduğunu belirtir. [6]

Bir muadili kabul etmeden önce endüktansı, sıcaklık artışını ve doyma payını gerçek nüve, sargı ve hava aralığı üzerinde ölçün.

## Artek’e malzeme koduyla nüve talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları tahmin etmek yerine “bilinmiyor” olarak belirtin:

- Nüve biçimi ve tam ölçü veya çizim.
- Mevcut parçadaki veya çizimdeki malzeme kodu ve biliniyorsa üreticisi.
- Muadil kabul edilip edilmediği.
- Uygulama, çalışma frekansı ve çalışma sıcaklığı.
- Biliniyorsa hedef AL değeri ve hava aralığı.
- İstenen adet.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya malzeme kodu ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### CF139, N87 muadili midir?

İki veri sayfası başlangıç geçirgenliği, 100 °C’deki doyma akı yoğunluğu ve 100 kHz, 200 mT, 100 °C’deki kayıp için yakın değerler verir. [1][6] Belgelerin hiçbiri bir muadillik belirtmez; bu nedenle değişim uygulamada doğrulanmalıdır.

### CF199 güç trafosunda kullanılır mı?

Cosmo Ferrites, CF199’u geniş bantlı trafolar ve EMI-EMC filtreleri için tanımlar ve bu malzeme için güç kaybı değeri vermez. [3]

### Katalog adındaki CF139 nüvenin üreticisini kanıtlar mı?

Hayır. Addaki işaret bir etikettir. Üretici ve malzeme, parçanın üzerindeki işaretle ve kendi veri sayfasıyla doğrulanır.

## Teknik kaynaklar

- [1] [Cosmo Ferrites: CF139 malzeme özellikleri](https://www.cosmoferrites.com/uploads/power/CF139.pdf).
- [2] [Cosmo Ferrites: CF297 malzeme özellikleri](https://www.cosmoferrites.com/uploads/power/CF297.pdf).
- [3] [Cosmo Ferrites: CF199 malzeme özellikleri](https://www.cosmoferrites.com/uploads/broadband/CF199.pdf).
- [4] [Cosmo Ferrites: CF195 malzeme özellikleri](https://www.cosmoferrites.com/uploads/broadband/CF195.pdf).
- [5] [Cosmo Ferrites: CF197 malzeme özellikleri](https://www.cosmoferrites.com/uploads/broadband/CF197.pdf).
- [6] [TDK: SIFERRIT N87 malzeme verileri](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [7] [Ferroxcube: 3C90 malzeme özellikleri](https://www.ferroxcube.com/upload/media/product/file/MDS/3c90.pdf).
