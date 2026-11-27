# Flyback trafosu için nüve ve hava aralığı nasıl seçilir?

Flyback trafosu, enerjiyi önce nüvedeki hava aralığında depolayıp sonra çıkış sargısına aktaran, çok sargılı bir kuplajlı bobindir. Bu yüzden nüve ve hava aralığı yalnızca güç değerinden okunmaz: primer endüktansı, en yüksek tepe akım ve izin verilen akı yoğunluğu sarım sayısını ve gereken AL değerini verir. Hava aralığı bu AL değerine göre belirlenir ve prototipte ölçülerek düzeltilir.

## Flyback trafosu neden sıradan bir trafo gibi seçilmez?

Texas Instruments, [flyback trafosunu](https://www.ferritnuve.com/sozluk#flyback-trafosu) filtre ve boost bobinleriyle aynı güç bobini ailesinde sayar: devreden enerji alır, manyetik alanda depolar ve geri verir. Gerçek trafoda ise enerji depolanması istenmez. Depolanan enerjinin neredeyse tamamı [hava aralığındadır](https://www.ferritnuve.com/sozluk#hava-araligi); yüksek geçirgenlikli nüve malzemesi akıya bu enerjiyi sargıya bağlayan kolay bir yol sunar. [1]

TDK, flyback çevirici için yüksek sıcaklıkta düşük kayıp, sıcaklığa az bağlı yüksek doyma ve hava aralıklı nüve arar; E ve U nüvelerde N27, N87, N92 ve N97 gibi kendi malzemelerini önerir. Aynı not uygulama alanını en çok 200 W ve yaklaşık 100 kHz’e kadar olarak çizer. [2] Bu genel bir yönlendirmedir; belirli bir nüvenin kaç watt taşıyacağını söylemez.

## Sürekli ve kesintili mod nüve seçimini nasıl değiştirir?

Texas Instruments’a göre sürekli akım modunda dalgalanma küçüktür ve ferrit nüvenin sınırı çoğunlukla doymadır. Kesintili modda toplam amper-sarım her periyodun bir bölümünde sıfırda kalır; büyük akı salınımı nedeniyle sınır çoğunlukla nüve kaybıdır ve izin verilen akı yoğunluğu düşer. Her iki modda da sargıların akımı kesintilidir, bu yüzden sargının AC kaybı ayrıca hesaplanır. [1] Tel seçimi için [deri etkisi ve litz teli rehberine](https://www.ferritnuve.com/blog/deri-etkisi-litz-teli) bakın.

## Sarım sayısı ve gereken AL değeri nasıl hesaplanır?

Doyma sınırlı bir tasarımda Texas Instruments’ın bağıntısı N = L × Itepe / (Bmax × Ae) biçimindedir; L primer endüktansı, Itepe akım sınırındaki primer tepe akımı, Ae etkin kesittir. TI, güç ferriti için temkinli sınır olarak yaklaşık 0,3 T verir. [1]

Hesabın sırasını göstermek için varsayımsal bir örnek: sürekli modda L = 500 µH, Itepe = 3 A, Bmax = 0,25 T ve TDK ETD 39/20/13 nüvesi (Ae = 125 mm²). [3]

- **Sarım sayısı:** N = 500 µH × 3 A / (0,25 T × 125 mm²) = 48.
- **Gereken AL:** AL = L / N² = 500.000 nH / 2304 ≈ 217 nH.

Sarım sayısı aşağı yuvarlanırsa akı yoğunluğu planlanandan yüksek olur. [1] Sıcaklık payı da kontrol edilir: TDK, N87 için 10 kHz ve 1200 A/m koşulunda akı yoğunluğunu 25 °C’de 490 mT, 100 °C’de 390 mT verir. [5] Nüve kaybı ve sargının pencereye sığması ayrı kontrollerdir.

## AL değerinden hava aralığı kaç mm çıkar?

TDK, ETD 39/20/13 için N27 ve N87 malzemede 0,50 mm aralığa yaklaşık 326 nH, 1,00 mm aralığa 196 nH [AL değeri](https://www.ferritnuve.com/blog/al-degeri-sarim-sayisi-hesabi) verir. Tablo, bir aralıklı ve bir aralıksız yarımdan oluşan takım içindir. [3] Ara değer için TDK’nın bağıntısı s = (AL / K1)^(1/K2) olur; s milimetre, AL nanohenry cinsindendir. Bu nüvede 25 °C için K1 = 196, K2 = −0,734 alınır ve geçerlilik aralığı 0,10–3,00 mm’dir. [3] [4] Örnekteki 217 nH yaklaşık **0,87 mm** verir.

Nüvenin manyetik direncini ve saçak akıyı yok sayan basit bağıntı (aralık ≈ µ0 × N² × Ae / L, SI birimleriyle) aynı örnekte yaklaşık 0,72 mm bulur. Texas Instruments’a göre saçak akı etkin aralık kesitini nüve kesitinden büyük yapar; aynı endüktans için aralığın da büyümesi gerekir. Prototipte endüktans yüksek ölçülürse sarım azaltılmaz, aralık büyütülür; düşük ölçülürse en iyi yol aralığı küçültmektir. [1] TDK, üretim sapmalarının ayrıca hesaba katılmasını ister. [4] K1 ve K2 yalnızca adı geçen TDK nüve ve malzemelerine aittir.

## Hava aralığı nereye konur?

- **Orta bacak:** Sargı, aralığın tam üzerinde olmalıdır. [1]
- **Ara parça:** Yarımları ayırmak aralığın bir bölümünü dış bacaklara taşır; dışarı yayılan akı EMI üretir ve endüktansın öngörülmesini zorlaştırır. [1]
- **Saçak akı:** Aralığın dibindeki sarımlarda, özellikle kesintili modda, büyük girdap akımı kayıpları oluşabilir. TI, sarımları bu bölgeden uzak tutmayı veya aralığı birkaç küçük aralığa bölmeyi önerir. [1]

## Hangi nüve biçimi ve sargı düzeni uygundur?

Texas Instruments, flyback trafosunda pencere biçimini çok önemli sayar. Geniş sargı genişliği kat sayısını, AC direnci ve [kaçak endüktansı](https://www.ferritnuve.com/sozluk#kacak-enduktans) azaltır; şebeke yalıtımı için bırakılan yüzeysel kaçak mesafesi de pencereyi daha az daraltır. TI, EC, ETD ve LP biçimlerini bu yüzden uygun bulur; pot ve PQ nüvelerin penceresini bu iş için elverişsiz sayar. Primer ve sekonderi iç içe bölümlemek kaçak endüktansı düşürür, buna karşılık sargılar arası kapasiteyi artırır. [1] Karkas ve yalıtım ayrıntıları [SMPS trafosu için nüve ve karkas rehberindedir](https://www.ferritnuve.com/blog/smps-trafosu-nuve-karkas-secimi).

## Artek’e flyback trafosu nüvesi sorarken

- Primer endüktansı, tepe akım, çalışma frekansı ve sürekli ya da kesintili mod.
- Giriş gerilimi aralığı, çıkış gerilimleri ve akımları.
- Nüve tipi, tam ölçüsü, malzeme işareti ve en yüksek nüve sıcaklığı.
- Hedef AL değeri veya milimetre cinsinden aralık; orta bacakta olup olmadığı.
- Karkas pin düzeni, yalıtım standardı ve adet.

Artek kataloğunda EE nüveler (örneğin EE 25 / 13 / 7 - CF139 ve EE 42 / 21 / 15 - CF139) ile ETD nüveler (örneğin ETD 29 / 16 / 10 - CF139 ve ETD 39 / 20 / 13- CF139) bulunur. Katalog, hava aralığı veya AL değeri belirtmez; bunları talebinize yazın ve [özel trafo teklif rehberindeki](https://www.ferritnuve.com/blog/ozel-trafo-teklif-rehberi) bilgileri ekleyin. Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya ihtiyacınızla birlikte [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Flyback trafosunda hava aralığı kaç mm olmalı?

Tek bir değer yoktur. Aralık; istenen endüktans, sarım sayısı ve nüve verisinden hesaplanır, sonra prototipte ölçülerek düzeltilir. [1]

### Nüve yarımlarının arasına ara parça koymak yeterli mi?

Bu yöntem aralığı orta ve dış bacaklara böler. Dışarı yayılan akı EMI üretir ve endüktans beklenenden farklı çıkar. [1]

### Flyback trafosu hava aralıklı ferrit toroide sarılabilir mi?

Texas Instruments bunu çok kötü bir seçim sayar; toroide yayılan sargı ayrık aralığa uymaz, büyük saçak alan ve EMI oluşur. [1]

## Teknik kaynaklar

- [1] [Texas Instruments: Bobin ve flyback transformatörü tasarımı (SLUP127)](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [2] [TDK: Ferritler ve aksesuarlar, uygulama notları](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [3] [TDK: ETD 39/20/13 nüve ve aksesuar verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [4] [TDK: E nüveler, genel bilgiler](https://www.tdk-electronics.tdk.com/download/187248/f119bbe0ab3d6dd73ae31c6fa9dcf6b9/pdf-ecores.pdf).
- [5] [TDK: SIFERRIT N87 malzeme verileri](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
