# Ferrit nüve nedir, ne işe yarar? Yumuşak ferrit, MnZn ve NiZn açıklaması

Ferrit nüve, demir oksidin mangan, çinko veya nikel gibi metal oksitleriyle karıştırılıp pişirilmesiyle elde edilen seramik bir manyetik parçadır. Bobinlerde, yüksek frekanslı trafolarda ve parazit bastırma elemanlarında manyetik akıyı taşır. Elektriksel direnci yüksek olduğu için yüksek frekansta girdap akımı kayıpları düşük kalır; anahtarlamalı güç kaynaklarında (SMPS) ve EMI filtrelerinde bu yüzden kullanılır.

## Ferrit nedir? Bileşimi ve yapısı

Vishay, ferriti demir ile başka elementlerin karışık oksidinden oluşan, kristal yapılı bir manyetik malzeme olarak tanımlar; bu yapı malzemenin çok yüksek sıcaklıkta belirli bir süre pişirilmesiyle oluşur. Genel bileşim xxFe2O4 biçimindedir ve en yaygın metal bileşimleri mangan-çinko (MnZn) ile nikel-çinkodur (NiZn). [1]

Magnetics de ferrit nüveleri, demir oksidin (Fe2O3) mangan, çinko, nikel veya magnezyum gibi metallerin oksit ya da karbonatlarıyla karıştırılmasıyla yapılan yoğun ve homojen seramik yapılar olarak tanımlar; parçalar preslenir, fırında 1300 °C'ye kadar pişirilir ve gerektiğinde işlenir. [2]

Seramik olmak mekanik bir sonuç da doğurur: TDK, ferrit nüvelerin her seramik malzeme gibi kırılgan olduğunu, darbeye, hızlı sıcaklık değişimine ve çekme yüküne karşı hassas olduğunu belirtir. [3]

## Yumuşak ferrit ve sert ferrit farkı

“Ferrit” kelimesi iki ayrı malzeme grubu için kullanılır. TDK'nın açıklamasına göre sert ferrit kalıcı mıknatıs yapımında kullanılır; yumuşak ferrit ise kalıcı mıknatıs değildir, yalnızca manyetik alan uygulandığında mıknatıslanır ve trafo ile bobin nüvelerinde kullanılır. [4]

Magnetics de kendi nüvelerinin düşük koersiviteye sahip olduğunu ve bu nedenle yumuşak manyetik ferrit olarak adlandırıldığını belirtir. [5] Bu yazıda ve Artek kataloğunda “ferrit nüve” denildiğinde kastedilen yumuşak ferrittir.

## MnZn ve NiZn ferrit: iki ana malzeme ailesi

Magnetics'e göre MnZn malzemelerin geçirgenliği yüksek, NiZn ferritlerin geçirgenliği düşüktür. MnZn ferritler çalışma frekansının 5 MHz'in altında olduğu uygulamalarda kullanılır; NiZn ferritlerin özdirenci daha yüksektir ve 2 MHz'den birkaç yüz MHz'e kadar kullanılırlar. [2]

İki üretici verisi bu farkı somutlaştırır. TDK'nın güç trafoları için önerdiği N87 malzemesi MnZn tabanlıdır; başlangıç geçirgenliği 2200, özdirenci 10 Ωm ve en uygun frekans aralığı 25–500 kHz'dir. [6] Fair-Rite'ın 61 malzemesi ise NiZn'dir; başlangıç geçirgenliği 125, özdirenci 1×10⁸ Ω·cm'dir ve 25 MHz'e kadar endüktif uygulamalar ile 200 MHz üzerindeki parazit frekanslarının bastırılması için tanımlanır. [7]

Parazit bastırmada da benzer bir ayrım vardır: KEMET, yüksek geçirgenlikli malzemelerin düşük frekans bölgesinde, düşük geçirgenlikli malzemelerin yüksek frekans bölgesinde etkili olduğunu; MnZn ürünlerin esas olarak iletilen gürültüye, NiZn ürünlerin ışıma gürültüsüne karşı kullanıldığını belirtir. [8]

Bu değerler yalnızca adı geçen üretici malzemelerine aittir. Artek kataloğundaki CF139 veya CF199 gibi işaretler için [CF ferrit malzeme kodları rehberine](https://www.ferritnuve.com/blog/cf-ferrit-malzeme-kodlari) bakın.

## Ferrit neden yüksek frekansta kullanılır?

Magnetics, ferritlerin diğer manyetik malzemelere üstünlüğünü yüksek elektriksel özdirenç ve geniş bir frekans aralığında düşük girdap akımı kayıpları olarak açıklar; bu özellikler yüksek geçirgenlikle birlikte ferriti 10 kHz ile 50 MHz arasındaki yüksek frekanslı trafolar ve bobinler için uygun kılar. [2] TDK da ferritin seramik olduğu için girdap akımı kayıplarını bastırdığını ve bunun onu yüksek frekans uygulamaları için uygun yaptığını belirtir. [4]

Texas Instruments'ın güç kaynağı tasarım notu aynı sonucu uygulama tarafından verir: büyük akı salınımının nüve kaybını belirlediği durumlarda, 50 kHz üzerindeki frekanslarda ferrit genellikle en iyi seçimdir. [9]

## Ferrit nüvenin sınırları: doyma ve sıcaklık

Ferritin zayıf yanı doyma akı yoğunluğudur. Texas Instruments, güç ferriti için temkinli bir doyma sınırı olarak yaklaşık 0,3 T alır ve küçük dalgalanma akımlı bobinlerde ferrit nüvenin çoğu zaman doymayla sınırlandığını, bu durumda demir tozu gibi doyma akı yoğunluğu daha yüksek malzemelerin kullanılabileceğini belirtir. [9]

Doyma sıcaklıkla da değişir: TDK, N87 için akı yoğunluğunu 25 °C'de 490 mT, 100 °C'de 390 mT olarak verir. [6] Ferrit nüve, Curie sıcaklığının üzerinde manyetik özelliklerini kaybeder. [1] N87 için bu sıcaklık 210 °C'nin üzerindedir. [6] Ferrit ile demir tozu arasındaki seçim için [ferrit ve demir tozu toroid rehberine](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) bakın.

## Ferrit nüve nerelerde kullanılır?

- **SMPS ve RF trafoları ile bobinleri:** Magnetics, ferritlerin yüksek frekanstaki düşük kayıpları nedeniyle bu alanlarda yaygın kullanıldığını belirtir. [5]
- **EMI/RFI filtreleri ve ortak mod şok bobinleri:** yüksek geçirgenlikli malzemelerle. [5]
- **Kablo üzerinde parazit bastırma:** Würth Elektronik, ferrit halka ve geçmeli ferritlerin paraziti doğrudan etkilenen kablo üzerinde bastırmak için tasarlandığını belirtir. [10]

Artek kataloğunda EE, ETD, UU, toroid, çubuk ve makara biçimli ferrit nüveler ile ferrit halka olarak da bilinen kablo ferritleri bulunur. Hangi biçimin hangi iş için uygun olduğunu [ferrit nüve çeşitleri rehberi](https://www.ferritnuve.com/blog/ferrit-nuve-cesitleri) anlatır. Belirli bir biçim için [EE](https://www.ferritnuve.com/blog/ee-nuve-secimi), [ETD](https://www.ferritnuve.com/blog/etd-nuve-secimi), [UU](https://www.ferritnuve.com/blog/uu-nuve-secimi), [toroid](https://www.ferritnuve.com/blog/ferrit-toroid-nuve-secimi) ve [kablo ferriti](https://www.ferritnuve.com/blog/kablo-ferriti-secimi) seçim rehberlerine geçebilirsiniz.

## Artek’e ferrit nüve sorarken

Hangi nüveye ihtiyacınız olduğundan emin değilseniz şu bilgileri tek mesajda paylaşın:

- Uygulama: SMPS trafosu, bobin, şok bobini, hat filtresi veya kablo üzerinde parazit bastırma.
- Çalışma frekansı, akım ve varsa DC bileşen.
- Mevcut parçanın ölçüleri, fotoğrafı ve okunabilen işaretleri.
- İstenen adet.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya sorunuzla birlikte [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Ferrit nüve ne işe yarar?

Bobin ve trafolarda manyetik akıyı taşır ve sargının endüktansını artırır; parazit bastırma elemanlarında ise yüksek frekanslı gürültüye karşı empedans oluşturur. Yüksek özdirenci sayesinde yüksek frekansta girdap akımı kayıpları düşük kalır. [2]

### Ferrit nüveli transformatör nedir?

Nüvesi ferritten yapılmış, yüksek frekansta çalışan transformatördür. Ferritler yüksek frekanstaki düşük kayıpları nedeniyle anahtarlamalı güç kaynağı trafolarında yaygın olarak kullanılır. [5] Örnek olarak TDK, U 93/76/30 ferrit nüvesini 20 kHz'de 1 kW üzerindeki güç trafoları için tanımlar. [3]

### Ferrit mıknatıs ile ferrit nüve aynı şey mi?

Hayır. Sert ferrit kalıcı mıknatıs yapımında kullanılır; trafo ve bobin nüvelerinde kullanılan yumuşak ferrit ise yalnızca manyetik alan uygulandığında mıknatıslanır. [4]

## Teknik kaynaklar

- [1] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Magnetics: Ferrit nüveler hakkında sık sorulan teknik sorular](https://www.mag-inc.com/Products/Ferrite-Cores/Learn-More-about-Ferrite-Cores).
- [3] [TDK: U 93/76/30 nüve verileri, ferritler için uyarılar bölümü](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
- [4] [TDK: Ferrite World, 1. bölüm — ferrit dünyasına giriş](https://www.tdk.com/en/tech-mag/ferrite02/001).
- [5] [Magnetics: Ferrit nüveler ürün sayfası](https://www.mag-inc.com/Products/Ferrite-Cores).
- [6] [TDK: SIFERRIT N87 malzeme verileri](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [7] [Fair-Rite: 61 malzeme veri sayfası](https://fair-rite.com/61-material-data-sheet/).
- [8] [KEMET: SU9V/9H ortak mod bobinleri veri sayfası](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [9] [Texas Instruments: Bobin ve flyback transformatörü tasarımı](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [10] [Würth Elektronik: Kablo ferritleri ve kablo çözümleri](https://www.we-online.com/en/components/productnavigator/cable-solutions).
