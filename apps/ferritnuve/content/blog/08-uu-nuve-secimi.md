# UU ferrit nüve nasıl seçilir? Hat filtresi ve güç trafosu için kontrol listesi

UU nüve, iki U biçimli ferrit yarımın karşılıklı birleşmesiyle kapalı bir manyetik yol oluşturan nüve tipidir. Küçük UU nüveler şebeke hattı filtre bobinlerinde, büyük U nüveler kilovat düzeyindeki güç trafolarında kullanılır. Doğru parçayı seçmek için “UU25” gibi bir ad yetmez; tam ölçü, UU veya UI kombinasyonu, malzeme ve AL değerinin hangi takıma ait olduğu birlikte kontrol edilmelidir.

## UU nüve nerelerde kullanılır?

Küçük UU nüveler, AC şebeke hattındaki ortak mod paraziti bastıran bobinlerde yaygındır. KEMET, SU serisi ortak mod bobinlerinin ferrit UU nüvelerle tasarlandığını ve ses-görüntü cihazları, ofis ekipmanları, dijital cihazlar ile güç kaynaklarında kullanıldığını belirtir. [1] TDK da güç hattı bobinleri arasında akım kompanzasyonlu U nüveli bobinleri ayrı bir grup olarak listeler. [2]

Büyük U nüveler ise yüksek güçlü trafolarda tercih edilir. TDK, U 93/76/30 nüvesini 20 kHz'de 1 kW üzerindeki güç trafoları için tanımlar. [3] İki bacaklı yapı, sargıların bacaklara ayrı ayrı yerleştirilmesine de imkân verir.

Artek kataloğunda UU 9.8 ve UU 10.5 gibi küçük nüvelerden UU 126 / 45 / 20'ye kadar UU kayıtları ile bacakları yuvarlak kesitli UUR 55 ve UUR 64 / 40 nüveler bulunur.

## 1. Kısa adı tam ölçüyle tamamlayın

Aynı kısa ad farklı geometrilere karşılık gelebilir. Artek kataloğundaki UU 25 / 19 / 7.5 kaydı ile TDK ve Ferroxcube'un U 25/20/13 nüveleri, ikisi de “25” ile başlasa da aynı ölçüde değildir. [4][5] Bu nedenle talepte yalnızca “UU25” yazmak yerine üç ölçüyü birlikte verin.

Mevcut parçayı değiştiriyorsanız şu bilgileri çizim veya ölçümle kaydedin:

- Toplam uzunluk, yükseklik ve kalınlık.
- Sarım penceresinin genişliği ve yüksekliği.
- Bacak kesiti: dikdörtgen mi, yuvarlak mı (UU veya UUR).
- Karkas, klips veya sabitleme parçası kullanılıp kullanılmadığı.

## 2. UU mu, UI mı? Kombinasyon AL değerini değiştirir

Bir U yarım, ikinci bir U ile (UU) veya düz bir I parça ile (UI) kapatılabilir. Bu seçim manyetik yolun uzunluğunu ve dolayısıyla AL değerini değiştirir. TDK'nın U 93/76/30 belgesinde etkin kesit iki kombinasyonda da 840 mm² iken etkin yol uzunluğu UU için 354 mm, UI için 258 mm'dir. N87 malzemede AL değeri UU takımda 5700 nH, UI takımda 7900 nH olarak verilir. [3]

Aynı belgede AL değerinin iki adet aralıksız nüveden oluşan takım için geçerli olduğu ve nüvelerin tek parça olarak teslim edildiği belirtilir. [3] Siparişte istenen kombinasyonu, adet birimini (tek yarım, çift veya I parçalı takım) ve varsa hava aralığını açıkça yazın.

## 3. Aynı ad, farklı üretici verisi

Aynı ölçüdeki nüveler için üreticiler farklı malzeme, tolerans ve ölçüm koşulları verir. U 93/76/30 için TDK, N87 malzemede AL = 5700 nH (+30/−20%) ve kaybı 100 mT, 25 kHz, 100 °C'de verir. [3] Ferroxcube ise 3C90 malzemede AL = 6400 nH (±%25) ve kaybı 200 mT, 25 kHz, 100 °C'de verir. [6] Koşullar farklı olduğundan bu kayıp değerleri doğrudan karşılaştırılamaz.

Artek kataloğunda da UU 93 / 76 / 30 için CF139 ve EPCOS işaretli ayrı kayıtlar vardır. Muadil ararken mevcut parçanın üretici ve malzeme işaretini paylaşın; benzer ada sahip bir parçaya başka üreticinin verisini atamayın.

## 4. Hat filtresi bobini için malzeme ve frekans

Filtre bobininde amaç, belirli bir frekans bandındaki paraziti bastırmaktır. KEMET, malzemenin hedef frekans bandına göre seçilmesi gerektiğini belirtir: yüksek geçirgenlikli malzemeler daha düşük frekanslarda, düşük geçirgenlikli malzemeler daha yüksek frekanslarda etkilidir. MnZn malzemeler çoğunlukla iletilen gürültüye, NiZn malzemeler ise ışıma gürültüsüne karşı kullanılır. [1]

Aynı kaynak, etkin frekans aralığının nüve biçimine, boyutuna ve sarım sayısına bağlı olduğunu ve etkinin gerçek cihaz üzerinde test edilmesi gerektiğini vurgular. [1] Talebinizde anma akımını, hedef endüktansı, hat gerilimini, sorunlu frekans bandını ve dikey veya yatay montaj ihtiyacını paylaşın.

## 5. Büyük güç trafosunda mekanik ve ısıl kontrol

Büyük U nüveler ağırdır: TDK, U 93/76/30 UU takımının kütlesini 1500 g olarak verir. [3] Ferrit seramik bir malzemedir; darbeye, hızlı sıcaklık değişimine ve çekme yüküne karşı hassastır. Nüvedeki mekanik gerilim başlangıç geçirgenliğini düşürür ve AL değerini etkiler. Bu nedenle sabitleme ve gömme malzemesi mümkün olduğunca esnek seçilmelidir. [3]

Yüksek akı yoğunluğu ve frekansta ferrit nüveler ısınabilir. [3] Uygulamada sıcaklık artışı, kayıplar ve doyum ayrı ayrı doğrulanmalıdır.

## Artek’e UU nüve talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları tahmin etmek yerine “bilinmiyor” olarak belirtin:

- Tam ölçü veya çizim, mevcut parçanın fotoğrafı.
- UU, UI veya UUR kombinasyonu ve adet birimi.
- Okunabilen üretici ve malzeme işareti.
- Biliniyorsa hedef AL, tolerans ve hava aralığı.
- Uygulama (hat filtresi bobini veya güç trafosu), frekans ve akım.
- İstenen adet.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya çizim ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### UU nüve ile UI nüve arasındaki fark nedir?

UU takım iki U yarımdan, UI takım bir U yarım ve düz bir I parçadan oluşur. UI kombinasyonunda manyetik yol kısalır ve aynı U parça için AL değeri yükselir. [3]

### UU nüve kaç watt taşır?

Nüve boyutu tek başına sabit bir güç değeri vermez. Malzeme, frekans, sargı düzeni ve izin verilen sıcaklık artışı birlikte değerlendirilir. Üretici belgelerindeki güç ifadeleri yalnızca belirtilen koşullar için yol gösterir. [3]

### UU nüveli hat filtresi bobini hangi akımlarda kullanılır?

Bu, bobinin tasarımına bağlıdır. Örnek olarak TDK, U nüveli akım kompanzasyonlu bobin serisini 0,4–2,6 A ve 300 V AC aralığında listeler. [2]

## Teknik kaynaklar

- [1] [KEMET: SU9V/9H ortak mod bobinleri veri sayfası](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [2] [TDK: Güç hattı bobinleri ürün kataloğu](https://www.tdk-electronics.tdk.com/en/530144/products/product-catalog/emc-components/power-line-chokes).
- [3] [TDK: U 93/76/30 ve I 93/28/30 nüve verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
- [4] [TDK: U 25/20/13 nüve verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_25_20_13.pdf).
- [5] [Ferroxcube: U25/20/13 nüve verileri](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/U25_20_13.pdf).
- [6] [Ferroxcube: U93/76/30 nüve verileri](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/U93_76_30.pdf).
