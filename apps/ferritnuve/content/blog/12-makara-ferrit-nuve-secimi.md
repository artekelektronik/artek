# Makara ferrit nüve nasıl seçilir? Makara nüve ile karkas farkı ve kontrol listesi

Makara nüve (İngilizce “drum core” veya “bobbin core”), iki ucunda flanş bulunan, makara biçimli tek parça bir ferrit nüvedir. Tel doğrudan ferritin üzerine sarılır ve çoğunlukla radyal bacaklı bir güç bobini, yani şok bobini elde edilir. Manyetik yolu açık olduğu için ekransızdır. Doğru parçayı seçmek için ölçüler, bacak düzeni, malzeme, hedef endüktans ve akım birlikte belirtilmelidir; plastik karkas ise ayrı bir üründür.

## Makara nüve nerelerde kullanılır?

Vishay, makara nüveyi flanşları olan makara biçimli bir nüve olarak tanımlar ve bacaklı veya bacaksız, eksenel veya radyal biçimde bulunabildiğini belirtir. [1] Radyal bobinlerde bacaklar gövdenin aynı tarafından çıkar ve makara, bu bobinlerde yaygın nüve biçimlerinden biridir. [1]

Bourns, RLB serisi radyal bacaklı bobinlerinin uygulamalarını güç kaynakları, DC/DC dönüştürücüler ve genel kullanım olarak listeler. [2] Fair-Rite da makara nüveleri, görece düşük ama kararlı endüktans değerleri gereken birçok uygulama için ekonomik ve kendini kanıtlamış bir nüve biçimi olarak tanıtır. [3]

Artek kataloğunda MAKARA 8X10, MAKARA 9X12 ve MAKARA 22X19 adlı üç makara nüve kaydı bulunur. Katalog fotoğrafında iki radyal bacaklı bir ferrit makara nüve görülür.

## 1. Makara nüve ile plastik karkası ayırın

İki ürün de günlük dilde “makara” diye anılabildiği için taleplerde sık karışır. Makara nüve manyetik malzemenin kendisidir; bobin bu nüvenin üzerine kurulur. [1] Karkas ise EE veya ETD gibi nüvelerde sargıyı taşıyan plastik parçadır; manyetik malzeme değildir ve nüve ona ayrıca takılır.

İngilizce kaynaklarda Vishay ve Fair-Rite ferrit parçanın kendisine “bobbin” der. [1][3] Fair-Rite ayrıca makara nüvelerin, en az 500 Vrms delinme gerilimine dayanan termoset plastik bir kaplamayla verilebildiğini belirtir. [3] Kaplamalı bir ferrit makara yine nüvedir, karkas değildir. Talepte hangisini aradığınızı açıkça yazın ve fotoğraf ekleyin.

## 2. Açık manyetik yolu ve kaçak alanı hesaba katın

Vishay; toroid, E nüve ve çoğu pot nüveyi kapalı manyetik yollu biçimler arasında, çubuk nüveleri ve ekransız makara nüveleri ise açık manyetik yollu biçimler arasında sayar. [1]

Würth Elektronik, sargısı açıkta kalan ekransız bobinlerin elektromanyetik alanı engelsiz yaydığını ve EMI açısından genellikle en sorunlu tip olduğunu belirtir. [4] Vishay’e göre makara ve çubuk biçimli nüvelerden ekranlı bobin elde etmek için manyetik bir kovan (sleeve) veya benzeri bir yöntem gerekir; ekranlama yine de bir derece meselesidir. [1] Bobinin yakınında hassas bileşenler varsa talepte belirtin.

## 3. Ölçüleri ve bacak düzenini eksiksiz verin

İki rakamlı bir ad, makarayı tanımlamaya yetmez. Fair-Rite tek bir makara nüve için altı ayrı ölçü (A, B, D, F, G, H) verir. [3] Artek kataloğundaki “8X10” gibi adlarda hangi rakamın çap, hangisinin yükseklik olduğu belirtilmez; bu nedenle ölçüleri talepte doğrulayın.

Mevcut parçayı değiştiriyorsanız şunları çizim veya ölçümle kaydedin:

- Flanş çapı ve toplam yükseklik.
- Orta göbek çapı ve iki flanş arasındaki sarım genişliği.
- Flanş kalınlığı.
- Bacaklı mı, bacaksız mı; bacak sayısı, aralığı, çapı ve boyu.
- Kaplama gerekip gerekmediği.

## 4. Malzemeyi ve endüktans hedefini belirleyin

Fair-Rite, yüksek frekanslı tasarımlar için 43 malzemeli küçük makaraları önerir; 43 bir NiZn ferrittir. Güç uygulamaları için ise AL ve DC ön akım sınırları belirtilmiş 77 malzemeli makaraları gösterir. [3] 77 malzeme, 100 kHz’e kadar endüktif tasarımlar için tanımlanan bir MnZn ferrittir. [5]

Bunlar Fair-Rite’ın kendi malzemeleridir. Artek kataloğundaki makara kayıtlarında malzeme belirtilmez; parçanın kendi işareti veya veri sayfasıyla doğrulanmalıdır. AL değeri de test koşuluyla birlikte okunmalıdır: Fair-Rite, 77 malzemeli bir makara için AL değerini 65 nH ±%10 olarak, 1 kHz’de ve 95 sarımlı bir test bobiniyle verir. [5] Talebinizde hedef endüktansı ve ölçüm frekansını yazın.

## 5. Doyma akımını ve DC direnci birlikte değerlendirin

Bitmiş bobinde iki ayrı akım sınırı vardır. Doyma akımı, endüktansı sıfır DC akımdaki değerinden belirli bir oranda düşüren DC akımdır; Vishay, ferrit nüveler için %10 düşüş değerinin kullanılmasını yararlı bulur. [1] Coilcraft bu düşüşü nüve doymasına bağlar. [6] Bourns RLB veri sayfasında da Isat için tipik %10, anma Irms akımı için tipik 40 °C koşulu yazılıdır. [2]

İkinci sınır ısınmadır. Sargı kaybı, DC direnç ile akımın karesinin çarpımına eşittir ve bileşen sıcaklığını ortam sıcaklığının üzerine çıkarır. [1] Vishay, anma akımının DC direnci düşürerek veya bobini büyüterek artırılabileceğini belirtir. [1] Bu nedenle talepte tepe akımını ve sürekli akımı ayrı ayrı verin.

## Artek’e makara nüve talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları tahmin etmek yerine “bilinmiyor” olarak belirtin:

- Katalogdaki ad (örneğin MAKARA 9X12) ve mevcut parçanın fotoğrafı.
- Flanş çapı, yükseklik, göbek çapı ve sarım genişliği.
- Bacaklı veya bacaksız; bacak aralığı ve düzeni.
- Okunabilen üretici ve malzeme işareti.
- Hedef endüktans, doyma akımı, sürekli akım ve kabul edilebilir DC direnç.
- Uygulama, çalışma frekansı ve istenen adet.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya ölçü ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Makara nüve ile karkas aynı şey midir?

Hayır. Makara nüve, ferritten yapılmış flanşlı bir manyetik nüvedir. [1] Karkas ise sargıyı taşıyan plastik parçadır ve manyetik malzeme değildir.

### Makara nüveli bobin çevresindeki devreleri neden etkileyebilir?

Ekransız makara nüve açık manyetik yollu bir biçimdir. [1] Sargısı açıkta olan ekransız bobinler alanı engelsiz yayar; ekranlama için manyetik bir kovan veya benzeri bir yöntem gerekir. [1][4]

### Makara nüve kaç amper taşır?

Nüve tek başına sabit bir akım değeri vermez. Doyma akımı endüktans düşüşüne, anma akımı ise sargının DC direncine ve ısınmaya göre tanımlanır; ikisi de bitmiş bobin için belirtilir. [1]

## Teknik kaynaklar

- [1] [Vishay: Bobin ve manyetik ürün terimleri tanımları](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Bourns: RLB serisi radyal bacaklı bobinler veri sayfası](https://www.bourns.com/docs/Product-Datasheets/RLB.pdf).
- [3] [Fair-Rite: Makara nüve 9643001165 ürün sayfası](https://fair-rite.com/product/bobbins-9643001165/).
- [4] [Würth Elektronik: ANP047 güç bobinlerinin elektromanyetik yayılım davranışı](https://we-online.com/components/media/o109027v410%20ANP047c_The%20Behavior%20of%20Electro-Magnetic%20Radiation%20of%20Power%20Inductors%20in%20Power%20Management.pdf).
- [5] [Fair-Rite: Makara nüve 9677182208 ürün sayfası](https://fair-rite.com/product/bobbins-9677182208).
- [6] [Coilcraft: Akım ve sıcaklık anma değerleri (Doc 361)](https://coilcraft.com/pdfs/Doc361_Current_Temp.pdf).
