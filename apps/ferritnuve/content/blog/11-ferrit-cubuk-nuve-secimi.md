# Ferrit çubuk nüve nasıl seçilir? Çap, uzunluk, malzeme ve sargı için kontrol listesi

Ferrit çubuk nüve, üzerine doğrudan bobin sarılan silindir biçimli bir ferrit parçadır ve toroid ya da UU nüvenin aksine manyetik yolu kapalı değildir. Bu yüzden bobinin endüktansını yalnızca malzeme değil, çubuğun uzunluk/çap oranı ile sargının uzunluğu ve konumu da belirler. Doğru parçayı seçmek için “ferrit çubuk” demek yetmez; çap × uzunluk, delik, malzeme ve çalışma frekansı birlikte netleştirilmelidir.

## Ferrit çubuk nüve nerelerde kullanılır?

En bilinen kullanım ferrit çubuk antendir. Fair-Rite, çubuk nüvelerini anten ve RFID transponder uygulamaları için sunar; uygulama örnekleri olarak RFID etiket antenlerini, RFID okuyucu antenlerini ve işitme cihazı antenlerini sayar. [1]

İkinci kullanım alanı bobin ve şok bobinleridir. Fair-Rite, preslenmiş çubuklarının yüksek enerji depolayan tasarımlarda yaygın olarak kullanıldığını, ayrıca sıcaklık kararlılığı gereken veya büyük DC ön akım taşıması gereken endüktif bileşenlerde de kullanılabildiğini belirtir. [2] Würth Elektronik de çubuk nüveli endüktör serisi için yüksek akım kapasitesini ve standart filtre uygulamalarını listeler. [3]

Artek kataloğunda ROD 5 x 20, ROD 14 x 7, ROD 6 x 30 DELİKLİ, ROD 18 x 28 ve ROD 28 x 20 kayıtları bulunur. Katalog, ROD 5 x 20 için yaklaşık 5 mm çap ve 20 mm uzunluk verir; diğer kayıtlarda hangi sayının çap, hangisinin uzunluk olduğunu talepte teyit edin.

## 1. Çap, uzunluk ve deliği netleştirin

Çubuk nüveler iki ölçüyle tanımlanır: çap ve uzunluk. Ferroxcube’un ROD nüve belgesi de parçaları D (çap) ve L (uzunluk) ölçüleriyle, her ölçü için ayrı toleransla listeler. [4] Katalog adı anma ölçüsünü verir; toleransı vermez. Mevcut bir parçayı değiştiriyorsanız şunları ölçün veya çizimden alın:

- Çap ve uzunluk, mümkünse kumpas ölçümüyle.
- Çubuk dolu mu, ortasında delik var mı; delikliyse delik çapı.
- Çubuğun oturduğu karkas, makaron veya tutucu varsa iç ölçüsü.

ROD 6 x 30 DELİKLİ gibi delikli bir çubuk, aynı dış ölçüdeki dolu çubukla aynı parça değildir. Ad delik çapını belirtmediği için bu ölçüyü talepte ayrıca sorun.

## 2. Çubuk açık bir manyetik yoldur: uzunluk/çap oranına bakın

Fair-Rite çubuklarını “açık manyetik devre” başlığı altında sınıflandırır ve çubuk geçirgenliğini (µrod) uzunluk/çap oranının bir fonksiyonu olarak verir. [2] Çubuğun bobine kazandırdığı geçirgenlik, malzemenin başlangıç geçirgenliğinden çok daha düşüktür.

Fair-Rite’ın kendi örneği bunu açıkça gösterir: 3 mm çapında ve 25 mm uzunluğundaki bir anten çubuğunda oran 8,33’tür; başlangıç geçirgenliği 125 olan 61 malzemede çubuk geçirgenliği 29 olarak verilir. [2][5] Aynı kaynağa göre oran küçüldükçe çubuk geçirgenliği düşer, buna karşılık sıcaklık kararlılığı iyileşir. [2]

Bu değerler Fair-Rite’ın kendi parçalarına aittir; başka bir çubuk için ölçüm veya üretici verisi gerekir.

## 3. Sargının uzunluğu ve konumu endüktansı değiştirir

Kapalı nüvelerde alışılan tek bir AL değeriyle hesap, çubukta aynı biçimde çalışmaz. Fair-Rite, sarılı çubuğun endüktans hesabına bir düzeltme katsayısı (K) ekler; bu katsayı sargı uzunluğunun çubuk uzunluğuna oranından bulunur. Çubuk tamamen sarılıysa K = 1’dir; daha kısa ama ortalanmış bir sargı daha yüksek K değeri verir. [2]

Mevcut bir bobini kopyalarken yalnızca sarım sayısını değil, sargının çubuk üzerinde kapladığı uzunluğu ve konumunu da kaydedin.

## 4. Malzeme ve frekans: NiZn mi, MnZn mi?

“Ferrit çubuk” tek bir malzeme değildir. Fair-Rite, anten çubukları için frekansa göre malzeme önerir: 200 kHz altı için 78 malzeme, 0,2–5,0 MHz için 61 malzeme, 5,0 MHz üzeri için 67 malzeme. [5] Üretici 78’i 200 kHz’e kadar güç uygulamaları ve 500 kHz’e kadar düşük kayıplı endüktif uygulamalar için bir MnZn ferrit, 61’i ise 25 MHz’e kadar endüktif uygulamalar için yüksek frekanslı bir NiZn ferrit olarak tanımlar. [6][7]

Aynı ölçü farklı malzemelerde bulunabilir: Ferroxcube, ROD5/20 nüvesini hem 3C90 hem 4B1 malzemede listeler. [4] Yani ölçü, malzemeyi söylemez. Artek kataloğu da bu çubukların malzeme sınıfını belirtmez; talebinizde çalışma frekansını yazın ve malzemeyi teyit ettirin.

## 5. Kırılganlığı ve montajı hesaba katın

Ferrit seramik bir malzemedir. TDK, ferrit nüvelerin gevrek olduğunu, darbeye, hızlı sıcaklık değişimine ve çekme yüküne karşı hassas olduğunu belirtir; nüvedeki mekanik gerilim başlangıç geçirgenliğini de düşürür, bu yüzden gömme malzemesi mümkün olduğunca esnek olmalıdır. [8] Fair-Rite da güçlü manyetik alanların veya aşırı mekanik gerilimin geçirgenlik ve kayıplarda kalıcı değişikliğe yol açabileceği uyarısını yapar. [5]

Bu nedenle çubuğu sıkıştırarak veya sert yapıştırıcıyla sabitlemeyin ve sarım sırasında eğme yükü uygulamayın.

## Artek’e ferrit çubuk nüve talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları tahmin etmek yerine “bilinmiyor” olarak belirtin:

- Çap x uzunluk, dolu veya delikli olduğu, varsa delik çapı.
- Mevcut parçanın fotoğrafı ve okunabilen üretici veya malzeme işareti.
- Uygulama: anten, bobin veya yüksek akımlı şok bobini.
- Çalışma frekansı, hedef endüktans ve akım.
- Sarım sayısı, tel çapı, sargının uzunluğu ve konumu.
- İstenen adet.

Katalogdaki [ferrit çubuk nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=CUBUK) veya ölçü ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Ferrit çubuk anten için hangi malzeme seçilir?

Bu, çalışma frekansına bağlıdır. Örnek olarak Fair-Rite kendi anten çubuklarında 200 kHz altı için 78, 0,2–5,0 MHz için 61 ve 5,0 MHz üzeri için 67 malzemeyi önerir. [5]

### Daha uzun çubuk daha yüksek endüktans verir mi?

Tek başına uzunluk yeterli bir ölçüt değildir. Çubuk geçirgenliği uzunluk/çap oranına, endüktans ise ayrıca sargının çubuğun ne kadarını kapladığına ve nerede durduğuna bağlıdır. [2]

### Ferrit çubuk nüve yüksek akımlı bobinde kullanılabilir mi?

Kullanılabilir; üreticiler çubukları büyük DC ön akım taşıyan endüktif bileşenler ve yüksek akımlı filtre endüktörleri için de sunar. Belirli bir çubuğun taşıyacağı akım ise malzemeye, ölçüye ve sargıya bağlıdır ve ölçümle doğrulanmalıdır. [2][3]

## Teknik kaynaklar

- [1] [Fair-Rite: RFID ve anten uygulamaları için ferrit çubuklar](https://www.fair-rite.com/wp-content/uploads/2025/06/FR_RFID_Flyer_R01.pdf).
- [2] [Fair-Rite: Rods 4061287011 ürün sayfası ve çubuk geçirgenliği açıklaması](https://fair-rite.com/product/rods-4061287011/).
- [3] [Würth Elektronik: WE-RCIT çubuk nüveli endüktör](https://www.we-online.com/catalog/en/am/browse/filterchokes/we-rcit).
- [4] [Ferroxcube: ROD nüve verileri](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/rod.pdf).
- [5] [Fair-Rite: Antenna/RFID Rods 3061990871 ürün sayfası](https://fair-rite.com/product/antennarfid-rods-3061990871/).
- [6] [Fair-Rite: 78 malzeme veri sayfası](https://fair-rite.com/78-material-data-sheet/).
- [7] [Fair-Rite: 61 malzeme veri sayfası](https://fair-rite.com/61-material-data-sheet/).
- [8] [TDK: U 93/76/30 nüve verileri, ferritler için uyarılar bölümü](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
