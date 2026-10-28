# Yassı kablo ferriti nasıl seçilir? Şerit kablo için genişlik, malzeme ve montaj rehberi

Yassı kablo ferriti, çok damarlı şerit (flat) kabloların üzerine takılan ve kablodan taşınan yüksek frekanslı paraziti azaltmak için kullanılan pasif bir parçadır. Doğru ürünü seçmek için kablonun genişliği yeterli değildir; damar sayısı, ferrit malzemesi, nüvenin uzunluğu ve montaj biçimi birlikte değerlendirilmelidir.

## Yassı kablo ferriti ne işe yarar?

Yassı kablo ferritleri, çok damarlı yassı kablolarda iletilen ortak mod EMI’yi bastırmak için kullanılır. [1] Üreticiler bu parçaları telekom cihazları, makine kontrolü ve kontrol panoları gibi sistemlerdeki şerit kablolarda veri hatlarının ortak mod filtrelemesi için önerir. [3] Bütün damarlar aynı açıklıktan geçer; hedef, damarlarda aynı yönde akan ortak mod parazittir. [1]

Kesit yuvarlaksa bu rehber yerine [kablo ferriti seçim rehberine](https://www.ferritnuve.com/blog/kablo-ferriti-secimi) bakın. Ferrit, her bağlantı veya veri hatasını çözen bir parça da değildir. Sorunun hangi kabloda, hangi koşulda ortaya çıktığını kaydetmeden seçime başlamayın.

## 1. Kablonun genişliğini ve damar sayısını belirleyin

Üreticiler yassı kablo ferritlerini çoğunlukla kablonun damar (kutup) sayısına ve iç açıklık genişliğine göre listeler. [3][4] Aynı damar sayısına uygun parçalar farklı uzunluk ve dış ölçülerle sunulabilir. Bu yüzden önce şu bilgileri toplayın:

- Kablonun genişliği ve kalınlığı, mümkünse bir fotoğrafla.
- Damar sayısı ve kablonun konnektör tipi.
- Konnektörün sökülüp sökülemediği.
- Ferritin yerleşeceği bölgede kullanılabilir uzunluk, genişlik ve yükseklik.

Ürün adındaki ölçü tek başına iç açıklığı garanti etmez. Seçimden önce iç açıklık genişliği ve yüksekliğini üretici çizimiyle karşılaştırın.

## 2. Tek parça mı, açılabilir mi?

Tek parça yassı ferritte kablonun açıklıktan geçirilmesi gerekir; bu da çoğu zaman konnektör takılmadan önce montaj anlamına gelir. Würth, tek parça şerit kablo ferritlerini farklı kesit biçimleriyle sunar ve sabitleme için yapışkan bant seçeneğini belirtir. [3]

Plastik muhafazalı, kapanarak kilitlenen yassı ferritler kabloyu sökmeden takılabilir. [1][4] Bazı modellerde kilit bir anahtarla açılır; üretici bunu yetkisiz sökmeyi önleyen bir özellik olarak tanımlar ve parçanın EMC laboratuvarında deneme amacıyla tekrar kullanılabileceğini belirtir. [4] Cihaz içindeki boşluk, kablonun bükülme alanı ve parçanın titreşimde yerinde kalıp kalmayacağı da bu kararın parçasıdır.

## 3. Malzemeyi parazitin frekansına göre değerlendirin

Aynı ölçüdeki iki yassı ferrit farklı malzemeden olabilir ve farklı frekans aralıklarında etkili olabilir. Örneğin Fair-Rite, aynı yassı kablo formatında MnZn 31 malzemesini 1 MHz’den 500 MHz’e kadar EMI bastırma için tanımlar; NiZn 43 malzemesini ise 20–250 MHz aralığında iletilen EMI için önerir. [1][2]

Bu nedenle “kabloya sığıyor” diye seçim yapmayın. Veri sayfasındaki empedans–frekans değerlerini, ölçümle belirlenen sorun bölgesiyle karşılaştırın. Sorunun frekansı bilinmiyorsa tahmin yazmak yerine bilinmediğini belirtin.

## 4. Nüve uzunluğu empedansı etkiler

Aynı damar sayısına uygun parçalarda nüve uzadıkça empedans genellikle artar. Würth’ün 21 damarlı şerit kablo ferritlerinde 8 mm uzunluktaki parça için 100 MHz’de 48 Ω, 12 mm için 60 Ω, 20 mm için 85 Ω verilir. [3] Aynı üreticinin 50 damarlı kilitli serisinde 19,6 mm uzunluktaki parça 126 Ω, 33,1 mm uzunluktaki parça 179 Ω olarak listelenir. [4]

Bu değerler o üreticinin kendi parçalarına aittir; benzer adlı veya benzer ölçülü başka bir ürüne aktarılmamalıdır. Örnek yalnızca seçim sırasını gösterir: montaj alanı izin veriyorsa daha uzun bir nüve değerlendirilebilir, ancak sonuç gerçek cihazda denenmelidir.

## 5. Veri sayfasındaki empedansı doğru okuyun

Yassı kablo ferritlerinin empedansı genellikle tek geçişte, ortalanmış iletkenle ve empedans analizörüyle ölçülür. [1] Tablolarda verilen değerler çoğunlukla tipik değerlerdir. Fair-Rite, minimum empedansın yalnızca işaretli frekanslar için belirtildiğini ve tipik olarak listelenen değerin yaklaşık %20 altında olduğunu yazar. [1]

İki ürünü karşılaştırırken empedansı aynı frekansta ve aynı ölçüm koşulunda okuyun. Gerçek kablo, cihaz ve montaj konumu ölçüm düzeneğinden farklıdır. Ferritin etkisini, diğer koşulları sabit tutarak cihazın kendisi üzerinde karşılaştırın.

## Artek’e yassı kablo ferriti talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları tahmin etmek yerine “bilinmiyor” olarak belirtin:

- Kablonun genişliği, kalınlığı ve damar sayısı.
- Konnektör tipi ve kablonun sökülüp sökülemediği.
- Tek parça veya açılıp kilitlenebilen yapı tercihi.
- Montaj alanının ölçüleri ve varsa yapışkanlı sabitleme ihtiyacı.
- Biliniyorsa parazitin frekansı, mevcut ferritin üreticisi ve parça numarası.
- İstenen adet.

Katalogdaki [yassı kablo ferritlerini inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=YASSI) veya kablo fotoğrafı ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Yassı kablo ferriti ile yuvarlak kablo ferriti arasındaki fark nedir?

İkisi de kablodan taşınan paraziti azaltmak için kullanılır, ancak açıklıkları farklı kablo kesitlerine göre biçimlenmiştir. Yassı kablo ferritinin açıklığı, şerit kablonun bütün damarlarının yan yana geçebileceği şekildedir. Yuvarlak kablo için yuvarlak açıklıklı bir kablo ferriti seçilmelidir.

### Yassı kablo ferriti hangi frekanslarda etkilidir?

Bu, ferrit malzemesine ve parçaya bağlıdır. Örneğin Fair-Rite, yassı kablo parçalarında MnZn 31 malzemesini 1–500 MHz, NiZn 43 malzemesini ise 20–250 MHz aralığı için tanımlar. Seçimden sonra etki gerçek cihazda denenmelidir.

### Anahtarla açılan kilitli yassı ferrit ne işe yarar?

Kilit, ferritin kablodan yetkisiz olarak sökülmesini önler. Anahtarla açılabildiği için aynı parça EMC laboratuvarında farklı kablolarda veya konumlarda deneme amacıyla tekrar kullanılabilir.

## Teknik kaynaklar

- [1] [Fair-Rite: 43 malzeme yassı kablo Snap-It nüvesi (0443164051)](https://fair-rite.com/product/flat-cable-snap-its-443164051).
- [2] [Fair-Rite: 31 malzeme yassı kablo Snap-It nüvesi (0431164051)](https://fair-rite.com/product/flat-cable-snap-its-431164051/).
- [3] [Würth Elektronik: WE-FLAT şerit kablo ferritleri](https://www.we-online.com/catalog/en/WE-FLAT).
- [4] [Würth Elektronik: WE-STAR-FLAT kilitli şerit kablo ferriti](https://www.we-online.com/catalog/en/article/74272475).
