# SMPS trafosu için nüve ve karkas nasıl seçilir? Sarımdan önce netleşmesi gerekenler

SMPS trafosu için nüve ve karkas seçimi, sarımdan önce beş kararın netleşmesi demektir: topoloji, frekans ile malzeme, nüve boyutu, nüve biçimi ve karkas. Flyback trafosu enerjiyi nüvedeki hava aralığında depolar; forward, yarım köprü ve tam köprü trafoları enerjiyi doğrudan aktarır ve normalde aralıksız nüve kullanır. Nüve boyutu bir watt tablosundan değil, kayıp ve sıcaklık artışı sınırından bulunur; karkas da nüveye tam uymalıdır.

## Önce topoloji: nüve enerji depolayacak mı, aktaracak mı?

Texas Instruments, [flyback trafosunu](https://www.ferritnuve.com/sozluk#flyback-trafosu) çok sargılı bir kuplajlı bobin olarak tanımlar: devreden enerji alır, manyetik alanda depolar ve sonra geri verir. Bu enerjinin neredeyse tamamı aralıkta depolanır; ferrit nüvede bu, ayrık bir hava aralığıdır. [1] TDK da flyback dönüştürücü için aralıklı nüve belirtir. [2]

Forward, yarım köprü ve tam köprü topolojilerinde durum terstir: ideal trafo enerji depolamaz, enerjiyi girişten çıkışa anında aktarır. [3] TDK, forward ve push-pull dönüştürücüler için genellikle aralıksız nüve belirtir. [2]

## Çalışma frekansı ve malzeme kayıp verisi nasıl okunur?

Nüve malzemesi, trafonun çalıştığı frekansa göre seçilir. [3] Güç ferriti veri sayfaları frekans aralığını ve kaybı ölçüm koşuluyla verir:

- **TDK N87:** en uygun frekans aralığı 25–500 kHz; 100 kHz, 200 mT ve 100 °C'de tipik kayıp 375 kW/m³. [4]
- **Ferroxcube 3C90:** 0,2 MHz'e kadar güç trafoları için; 100 kHz, 200 mT ve 100 °C'de yaklaşık 450 kW/m³. [5]
- **Ferroxcube 3C95:** 0,5 MHz'e kadar güç trafoları için; aynı koşulda yaklaşık 290 kW/m³. [6]

Bu değerler yalnızca adı geçen malzemelere aittir; TI, üretici kayıp verisinin sinüs dalgasıyla ölçüldüğü için her zaman güvenilir olmadığını belirtir. [3] Artek kataloğundaki CF139 gibi işaretler için [CF ferrit malzeme kodları rehberine](https://www.ferritnuve.com/blog/cf-ferrit-malzeme-kodlari) bakın.

## Nüve boyutu neden bir watt tablosundan okunmaz?

TI'ye göre uygun nüve, gereken gücü kabul edilebilir kayıp ve sıcaklık artışıyla taşıyan en küçük nüvedir. İlk tahmin için alan çarpımı kullanılır: nüvenin manyetik kesit alanı ile sargı pencere alanının çarpımı. TI bunu kaba bir gösterge sayar ve tasarımın prototipte sıcaklık ölçülerek doğrulanmasını ister. [3]

Üretici güç tabloları da varsayımlara dayanır. TDK'nın güç kapasitesi tabloları 0,4 bakır doluluk oranı, DC bakır direnci ve serbest hava taşınımındaki ısıl dirençle hesaplanmıştır; TDK bu mutlak değerlere pratikte ulaşılamayacağını belirtir. [2] onsemi'nin hızlı seçim tablosu ise geniş giriş aralığı, 67 kHz ve tek 12 V çıkış içindir. [7] “ETD39 şu kadar watt” ifadesi bu yüzden ancak koşullarıyla anlam taşır; ayrıntı [ETD nüve seçimi rehberindedir](https://www.ferritnuve.com/blog/etd-nuve-secimi).

## Hangi nüve biçimi: EE, ETD, EFD, PQ, RM veya toroid?

- **EE:** Magnetics'e göre pot nüvelerden ucuzdur, karkasa sarımı ve montajı kolaydır; kendinden ekranlı değildir. [8]
- **ETD:** yuvarlak orta bacak sargı direncini en aza indirir. [8]
- **EFD:** çok yassı, kompakt trafolar içindir. [8]
- **PQ ve pot nüveler:** TI'ye göre pencereleri küçük ve neredeyse karedir; buna karşılık EE nüvelerden daha iyi manyetik ekranlama sağlarlar. [3]
- **RM:** TDK, forward dönüştürücüler için E/ETD nüvelerin yanında RM nüveleri de önerir. [2]
- **Toroid:** en düşük kaçak endüktansı verir, ancak sarımı zordur; TI'ye göre SMPS trafolarında nadiren kullanılır. [3]

Ortak ilke geniş penceredir: pencere genişledikçe kat sayısı, AC direnç ve kaçak endüktans azalır. [3] Muadil kontrolünü [EE nüve seçimi rehberi](https://www.ferritnuve.com/blog/ee-nuve-secimi) anlatır.

## Karkas neden nüve kadar önemlidir?

[Karkas](https://www.ferritnuve.com/sozluk#karkas), sargıyı taşıyan ve pinleriyle baskı devreye bağlayan parçadır. TDK, ETD 39/20/13 için tek bölmeli, 16 pinli bir karkası 178 mm² sargı kesiti ve 69 mm ortalama sarım uzunluğuyla verir; aksesuarlarının başka üreticilerin nüveleriyle uyumlu olmayabileceğini de belirtir. [9] Sargı kesiti sığacak bakırı, ortalama sarım uzunluğu sargı direncini belirler; ikisi de sarım hesabına girer.

Karkas pencereyi de küçültür: TI'ye göre karkaslı ve yüksek gerilim izolasyonlu küçük bir trafoda pencere alanının yalnızca %25–30'u bakır olabilir. [10] Emniyet izolasyonunda yalıtma aralığı (clearance) havadan, yüzeysel kaçak mesafesi (creepage) malzeme yüzeyi boyunca ölçülür; ikisi de çalışma gerilimine, kirlilik derecesine ve izolasyon sınıfına bağlıdır. Würth Elektronik bu mesafe için kenar (margin) bandını, uzatılmış raylı karkası ve sekonderde üç kat izoleli teli gösterir. [11] Gerekli mesafeler, cihaza uygulanan standarda göre belirlenir.

## Kaçak endüktans ve sargı sırası neden baştan yazılır?

[Kaçak endüktans](https://www.ferritnuve.com/sozluk#kacak-enduktans), sargılar arasındaki bölgede depolanan enerjiyi temsil eder; anahtarlama anında gerilim sıçramasına yol açar ve söndürücü devrede kayba dönüşür. [3] İzolasyon için bırakılan mesafe onu artırır. [10]

onsemi'ye göre sargı sırasının kaçak endüktansa etkisi büyüktür: primer genellikle en içe sarılır, en yüksek güçlü sekonder primere en yakın yerleştirilir; en yaygın ve etkili yöntem sandviç sarımdır. [7] SMPS trafo sarım hesabına bu yüzden sargı sırası da yazılarak başlanır.

## Artek’e SMPS trafosu için nüve ve karkas sorarken

Sarıma başlamadan veya teklif istemeden önce şunları yazın:

- Topoloji; nüvenin aralıklı mı aralıksız mı olacağı, aralıklıysa hedef AL değeri veya hava aralığı.
- Trafonun çalışma frekansı, giriş gerilimi aralığı, çıkış gerilimleri ve akımları.
- Nüve biçimi, tam ölçüsü ve malzeme işareti.
- Karkas: pin sayısı, pin aralığı, yatay veya dikey montaj, bölme sayısı.
- İzolasyon beklentisi, uygulanan standart ve sargı sırası.
- İzin verilen sıcaklık artışı ve adet.

Artek kataloğunda EE 13'ten EE 110'a kadar EE ferrit nüveler (örneğin EE 25 / 13 / 7 - CF139 ve EE 42 / 21 / 15 - CF139) ile ETD 29, 39, 44, 49, 54 ve 59 nüveler (örneğin ETD 39 / 20 / 13- CF139) bulunur. Karkaslar katalogda verileriyle listelenmez; uygun karkası talebinizde ayrıca sorun. Katalogdaki [EE ve ETD nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=EE,ETD) veya bu listeyle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact). Trafo teklifi için [özel trafo teklif rehberine](https://www.ferritnuve.com/blog/ozel-trafo-teklif-rehberi) bakın.

## Sık sorulan sorular

### SMPS trafosunda bir nüve kaç watt taşır?

Sabit bir değer yoktur. Güç topolojiye, frekansa, malzemeye, sargıya ve sıcaklık artışına bağlıdır; üretici tabloları yalnızca belirtilen koşullarda nüveler arasında seçim yapmaya yarar. [2]

### Flyback trafosunda neden hava aralığı gerekir?

Flyback trafosu enerjiyi önce depolar, sonra çıkışa verir; bu enerjinin neredeyse tamamı hava aralığında depolanır. Nüve malzemesi tek başına çok az enerji depolayabilir. [1]

### Başka üreticinin karkası aynı adlı nüveye uyar mı?

Bu varsayılamaz. TDK, aksesuarlarının yalnızca kendi nüveleriyle tasarlanıp değerlendirildiğini ve başka üreticilerin parçalarıyla birleştirmenin önceden denenmesi gerektiğini belirtir. [9]

## Teknik kaynaklar

- [1] [Texas Instruments: Bobin ve flyback transformatörü tasarımı (SLUP127)](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [2] [TDK: Ferritler ve aksesuarlar, uygulama notları](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [3] [Texas Instruments: Güç transformatörü tasarımı (SLUP126)](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [4] [TDK: SIFERRIT N87 malzeme verileri](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [5] [Ferroxcube: 3C90 malzeme verileri](https://www.ferroxcube.com/upload/media/product/file/MDS/3c90.pdf).
- [6] [Ferroxcube: 3C95 malzeme verileri](https://www.ferroxcube.com/upload/media/product/file/MDS/3c95.pdf).
- [7] [onsemi: AN-4140, off-line flyback dönüştürücüler için trafo tasarımı](https://www.onsemi.com/pub/collateral/an-4140.pdf).
- [8] [Magnetics: Ferrit nüve biçimleri hakkında bilgi](https://www.mag-inc.com/Products/Ferrite-Cores/Ferrite-Shapes/Learn-More-about-Ferrite-Shapes).
- [9] [TDK: ETD 39/20/13 nüve ve aksesuar verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [10] [Texas Instruments: SLUP125, 3. bölüm — sargılar ve manyetik alan davranışı](https://www.ti.com/lit/ml/slup125/slup125.pdf).
- [11] [Würth Elektronik: Trafo emniyeti ve IEC 61558 standardındaki güncellemeler](https://www.we-online.com/files/pdf1/transformer-safety-updates-on-iec-61558-standard.pdf).
