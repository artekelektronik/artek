# Deri etkisi nedir? Litz teli ne zaman gerekir?

Deri etkisi, alternatif akımın iletkenin bütün kesitini kullanmak yerine yüzeye yakın bölgeden akma eğilimidir; iletkenin direncini artırır ve frekans yükseldikçe akım yüzeye daha da itilir. Litz teli, ayrı ayrı yalıtılmış çok sayıda ince damarın örülmesiyle yapılan bir iletkendir; her damar kesitteki bütün konumlardan geçtiği için akım damarlar arasında eşit paylaşılır ve aynı kesitteki tek damarlı tele göre AC kayıpları düşer. Bedeli, bakır doluluğunun azalmasıdır.

## Deri etkisi neden olur?

Vishay'e göre iletkendeki akımın manyetik alanı, iletkenin merkezine yakın bölgede girdap akımları oluşturur ve bu akımlar merkezdeki ana akıma karşı koyar. Akım yüzeye doğru itilir ve frekans arttıkça bu itilme güçlenir. [1] Sonuç, iletkenin etkin kesitinin küçülmesi ve direncinin artmasıdır. [1]

Sargılarda iki ayrı girdap akımı kaybı vardır: deri etkisi ve komşu sarımların alanından doğan yakınlık etkisi. [1] Bu rehber ağırlıkla [deri etkisini](https://www.ferritnuve.com/sozluk#deri-etkisi) anlatır; yakınlık etkisi, sarım katmanı sayısı arttıkça sorunu büyüten ikinci etkendir.

## Sızma derinliği nasıl hesaplanır?

Texas Instruments'ın SMPS trafosu örneğinde bakır iletkenin sızma derinliği 7,6/√f cm ile bulunur; f hertz cinsindendir. [2] 200 kHz'de bu, yaklaşık 0,17 mm eder. [2] Aynı bağıntıdan, 100 kHz'de yaklaşık 0,24 mm, 1 MHz'de yaklaşık 0,076 mm çıkar. Yani frekans yükseldikçe akımın kullandığı kalınlık incelir.

Karar ölçütü tel kalınlığının bu derinliğe oranıdır. Aynı örnekte 200 kHz'de, tek katta 15 sarımlı, 0,72 mm bakır telli bir primer için Dowell eğrilerinden AC/DC direnç oranı 3,1 bulunur ve TI bunu kabul edilemez AC kaybı olarak değerlendirir. [2]

## Litz teli bu sorunu nasıl çözer?

Vishay'e göre [litz teli](https://www.ferritnuve.com/sozluk#litz-teli), her damarın kesitteki bütün konumları alacağı biçimde örülmüş yalıtımlı damarlardan oluşur; akım damarlar arasında eşit bölünür ve AC kayıpları benzer tek damarlı iletkenden düşüktür. Frekans yükseldikçe bu fark önem kazanır. [1]

TI'nin örneğinde 0,064 mm'lik 100 damarlı bir litz teli (toplam çapı 0,81 mm) aynı primerde AC/DC direnç oranını 3,1'den yaklaşık 1,2'ye indirir. Nedeni, 100 damarın kabaca 10 × 10'luk bir dizi gibi davranması ve etkin katman kalınlığının yaklaşık onda bire düşmesidir. [2]

## Litz telinin bedeli nedir?

- **Bakır doluluğu:** TI'ye göre yuvarlak, yalıtımlı tellerden sarılan bir sargıda alanın yalnızca yüzde 70-75'i bakırdır. Litz telinde her bükme düzeyi için yaklaşık 0,75 çarpanı daha uygulanır; 7 × 7 damarlı bir litz telinde bakır oranı yaklaşık yüzde 42'ye düşer. [2]
- **DC direnç:** Daha ince damarlar daha çok yalıtım ve boşluk getirir, bu da DC direnci yükseltir. [2]
- **Pencere alanı:** Bakır alanı küçüldüğü için aynı pencereye daha az bakır sığar; nüve ve [karkas](https://www.ferritnuve.com/sozluk#karkas) seçiminde bu hesaba katılmalıdır.

Bu yüzden litz teli her sargıda değil, sızma derinliğinin tel kalınlığına göre küçük kaldığı sargılarda anlamlıdır.

## Litz teli dışında hangi yollar var?

TI, sargıda bakır folyo veya şerit kullanımını da anlatır: folyo veya şeritle sarılan bir sargıda bakır alanı yüzde 80-90'a ulaşabilir. [2] Aynı örnekte tek sarımlı ikincil, sızma derinliğinden çok daha kalın bakır şeritle yapılır; akım yalnızca şeridin dış yüzünden aktığı için kalınlık arttıkça AC direnç sabit kalır ve DC direnç düşer. [2]

TI'nin güç bobinleri için verdiği akım yoğunluğu kuralları, yüksek frekanslı deri etkisinden doğan sargı kaybı artışının toplam sargı kaybının üçte birinin altında tutulması varsayımına dayanır. [3] Ferrit nüvelerde ise girdap akımı kayıpları yaklaşık 200-300 kHz'in üzerinde belirginleşir; sargı kayıpları da frekansla artar. [2] Dolayısıyla frekans yükseldikçe hem nüve malzemesi hem tel seçimi birlikte düşünülür; ayrıntı için [SMPS trafosunda nüve ve karkas seçimine](https://www.ferritnuve.com/blog/smps-trafosu-nuve-karkas-secimi) ve [nüve doymasına](https://www.ferritnuve.com/blog/nuve-doymasi-hava-araligi) bakın.

## Artek’e sarım için nüve sorarken

Sarılı bir parça için talebinizde şunları belirtin:

- Çalışma frekansı ve dalga biçimi (sinüs veya dikdörtgen).
- Her sargının etkin (RMS) akımı ve sarım sayısı.
- Nüve tipi, tam ölçüsü ve malzeme işareti; karkas gerekiyorsa pencere ölçüsü.
- Tel türü konusunda bir kısıt varsa (litz, folyo, tek damar) ve izolasyon gereksinimi.
- İstenen adet.

Artek kataloğunda EE nüveler (örneğin EE 42 / 21 / 15 - CF139) ve ferrit toroidler (örneğin T 25 / 15 / 10 - CF199) bulunur. Katalog tel seçimini veya sargı kaybını belirtmez; bu bilgiler talepte yazılmalıdır. Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya ihtiyacınızla birlikte [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact). Sarılı parça için ayrıca [özel trafo teklif rehberine](https://www.ferritnuve.com/blog/ozel-trafo-teklif-rehberi) bakabilirsiniz.

## Sık sorulan sorular

### Deri etkisi hangi frekansta önemli olur?

Belirli bir eşik yoktur; ölçüt, sızma derinliğinin tel kalınlığına oranıdır. TI'nin hesabında bakır için sızma derinliği 200 kHz'de yaklaşık 0,17 mm'dir ve bundan kalın bir tel bu frekansta etkin kesitini tam kullanamaz. [2]

### Litz teli tek damarlı telden her zaman daha mı iyidir?

Hayır. Litz teli AC kaybını düşürür, ancak bakır doluluğunu azaltır ve DC direnci yükseltir. Frekans düşükse veya tel zaten sızma derinliğinden ince ise bu bedel kazancı aşabilir. [2]

### Litz teli deri etkisini tamamen yok eder mi?

Hayır. Litz teli kayıpları düşürür; TI'nin örneğinde AC/DC direnç oranı 1,2 olarak kalır. [1][2]

## Teknik kaynaklar

- [1] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Texas Instruments: Güç transformatörü tasarımı](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [3] [Texas Instruments: Bobin ve flyback transformatörü tasarımı](https://www.ti.com/lit/ml/slup127/slup127.pdf).
