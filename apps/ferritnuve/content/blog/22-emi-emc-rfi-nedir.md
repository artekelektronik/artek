# EMI, EMC ve RFI nedir? EMC testinde ferrit ve filtrenin yeri

EMI (elektromanyetik girişim), bir cihazın çalışmasını bozan istenmeyen elektriksel enerjidir; EMC (elektromanyetik uyumluluk) ise bir cihazın çevresindeki cihazları rahatsız etmeden ve onlardan etkilenmeden çalışabilmesidir. RFI (radyo frekansı girişimi), EMI ile aynı anlamda kullanılan daha eski ve daha dar bir terimdir. EMI filtreleri ve ferritler bu girişimi azaltır; uyumluluk ise bitmiş ürün üzerinde yapılan ölçümlerle gösterilir.

## EMI, EMC ve RFI ne anlama gelir?

Vishay, [EMI](https://www.ferritnuve.com/sozluk#emi) terimini elektromanyetik girişimin kısaltması ve her biçimdeki istenmeyen elektriksel enerji olarak tanımlar; terim çoğu zaman “gürültü” ile aynı anlamda kullanılır. RFI ise radyo frekansı girişiminin kısaltmasıdır ve EMI ile birbirinin yerine kullanılan, daha eski ve daha kısıtlı bir terimdir. [1]

[EMC](https://www.ferritnuve.com/sozluk#emc) bir bozucu değil, bir özelliktir. TDK'ya göre elektromanyetik uyumluluk, bir cihazın istenmeyen yayınımlarla çevresindeki cihazları etkilememesi ve diğer cihazların yayınımlarından etkilenmemesi demektir. TDK'nın aktardığı 2014/30/AB sayılı Avrupa EMC direktifi tanımı da aynı yöndedir: ekipmanın, elektromanyetik ortamında, diğer ekipmanlara kabul edilemez bozulma vermeden yeterli biçimde çalışabilme yeteneği. [2]

Bu tanımın iki yönü vardır. Murata, gürültü üreten cihazın gürültü yaymasını önlemeye yayınım (emisyon) önlemi, alıcı cihazın gürültü alsa bile hatasız çalışmasını sağlamaya bağışıklık önlemi der; ikisi birlikte EMC önlemleridir. [3]

## İletilen ve ışıyan parazit hangi frekanslarda ölçülür?

Girişim iletkenler üzerinden (iletilen) veya alan olarak (ışıyan) yayılır. TDK'ya göre düşük frekanslarda girişimin yalnızca iletken yapılar boyunca, MHz bölgesinde ise giderek alanlar ve elektromanyetik ışımayla yayıldığı kabul edilebilir. [2]

Ölçüm sınırları bu ayrımı izler. TDK'ya göre iletilen yayınım için sınır değerler çoğunlukla 150 kHz–30 MHz aralığında verilir; bazı ürünlerde 9 kHz–150 kHz aralığı da kapsanır. Işıyan girişim ise en sık 10 m veya 3 m ölçüm mesafesinde, 30 MHz'den 1 GHz'e veya daha yukarısına kadar ölçülür. [2] Geçerli aralık ve sınır değer ürünün tabi olduğu standarda bağlıdır.

## Ortak mod ve diferansiyel mod gürültü neden farklı eleman ister?

İletilen girişim iki bileşene ayrılır. Diferansiyel mod girişim akımı, hat akımı gibi bir iletkenden gidip diğerinden döner. [Ortak mod](https://www.ferritnuve.com/sozluk#ortak-mod) girişim akımı ise parazitik kapasitanslar nedeniyle her iki iletkenden aynı yönde akar ve toprak üzerinden kaynağa döner. [2]

TDK'ya göre birkaç yüz kHz'e kadar olan iletilen girişim ağırlıklı olarak diferansiyel moddur; birkaç MHz'in üzerinde ortak mod baskın hale gelir. [2] Akım yolları farklı olduğu için elemanları da farklıdır:

- **Diferansiyel mod için:** faz ile nötr arasına veya iki faz arasına bağlanan X kondansatörleri ve seri bobinler (diferansiyel mod şok bobinleri). [2]
- **Ortak mod için:** faz veya nötr ile toprak arasına bağlanan Y kondansatörleri ve akım kompanzasyonlu (ortak mod) şok bobinleri. [2]

Ortak mod şok bobini iki modu sargı yönüyle ayırır. Murata'ya göre ortak mod akımlarının akıları aynı yöndedir ve birbirini güçlendirir; diferansiyel mod akımlarının akıları birbirini götürür. Bu nedenle bobin yalnızca ortak moda karşı endüktans gösterir ve büyük hat akımında nüve doymaz. [4]

## Şebeke EMI filtresinin içinde ne bulunur?

TDK, EMC filtresini bobin, kondansatör ve dirençlerden oluşan ve şebekedeki girişimi sınırlayan bir devre olarak tanımlar. Filtre neredeyse her zaman alçak geçiren tiptedir: kullanılan frekansı (tipik olarak DC ile 60 Hz arası) geçirir, girişim frekanslarını zayıflatır. Ana elemanlar X kondansatörleri, diferansiyel mod şok bobinleri, Y kondansatörleri, akım kompanzasyonlu şok bobinleri ve deşarj dirençleridir. [2]

TDK'ya göre EMC filtreleri ağırlıklı olarak iletilen girişim bölgesinde etki eder. [2] Seçim adımları için [tek fazlı EMI filtre seçimi rehberine](https://www.ferritnuve.com/blog/tek-fazli-emi-filtre-secimi) bakın.

## Kablo ferriti nerede işe yarar, nerede yaramaz?

Murata'ya göre devreye dışarıdan bir kablo bağlıysa ortak mod akımı kablodan da akar ve radyo dalgası olarak yayılır; kablo anten gibi davranır. [4] Kablo ferriti bu akıma karşı kullanılır. Würth Elektronik, kablo ferritlerini dirençsel ve endüktif bir seri empedans oluşturan halka veya kovanlar olarak tanımlar; kovan kabloya geçirildiğinde kablodan ışıyan yüksek frekanslı enerji azaltılabilir. [5]

Aynı belge sınırları da gösterir:

- Empedans frekansa ve malzemeye bağlıdır; girişim frekans aralığı ile malzeme özellikleri uyuşmalıdır. [5]
- Würth'ün iki telli hat ölçümünde, iki tel birlikte ferritten geçirildiğinde diferansiyel mod girişimde 100 kHz–50 MHz aralığında zayıflatma görülmemiştir. [5]
- Kablodan yüksek doğru akım geçiyorsa yüksek geçirgenlik kovanı hızla doyuma götürür; gidiş ve dönüş iletkenlerinin birlikte geçirilmesi bu etkiyi büyük ölçüde giderir. [5]

Parça seçimi için [kablo ferriti seçimi](https://www.ferritnuve.com/blog/kablo-ferriti-secimi) ve [yassı kablo ferriti seçimi](https://www.ferritnuve.com/blog/yassi-kablo-ferriti-secimi) rehberlerine bakın.

## EMC testinde ne ölçülür? Tek bir eleman ürünü uyumlu yapar mı?

TDK, EMC ölçümlerinde yayınım ve bağışıklık testlerinin ayrıldığını belirtir. İletilen yayınım, şebeke girişinde bir hat empedansı dengeleme devresi (LISN) üzerinden ölçüm alıcısıyla, ışıyan yayınım ise tam veya yarı yansımasız odada ölçülür. Bağışıklık testlerine örnek olarak elektrostatik boşalma (ESD), burst ve surge sayılır. [2]

Aynı belgeye göre üretici, cihazı piyasaya sunarken geçerli EMC direktiflerinin gereklerini karşıladığını bir uygunluk beyanıyla doğrular ve bunun için genellikle EMC ölçümleri gerekir. [2] Dolayısıyla uyumluluk, bitmiş ürünün ölçümüyle gösterilir. Bir filtre veya ferrit bu sonuca katkı sağlayan bir önlemdir; tek başına ürünü uyumlu yapmaz.

## Artek’e EMI filtresi veya kablo ferriti sorarken

Talebinizde şu bilgileri paylaşın:

- Sorunun türü (iletilen veya ışıyan) ve biliniyorsa frekans aralığı.
- Filtre için: şebeke gerilimi, hat akımı ve faz sayısı.
- Kablo ferriti için: kablo dış çapı veya yassı kablo genişliği.
- İstenen adet.

Artek kataloğunda güç/EMI filtreleri (aralarında “6 A EMI Filter” kaydı), 6mm ile 14.5mm arasındaki “Yuvarlak Plastik Kablo Çekirdekleri” ve “Yassı Parazit Önleyici Flex Kablo Filtresi” bulunur. Katalogdaki [güç ve EMI filtrelerini inceleyebilir](https://www.ferritnuve.com/products?categories=PEM) veya [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### EMI ile EMC arasındaki fark nedir?

EMI, istenmeyen elektriksel enerjinin, yani girişimin kendisidir. EMC ise bir cihazın çevresini istenmeyen yayınımlarla etkilememesi ve başka cihazların yayınımlarından etkilenmemesi özelliğidir. [1][2]

### EMC testi nasıl yapılır?

Yayınım ve bağışıklık ayrı ayrı test edilir. TDK'ya göre iletilen yayınım çoğunlukla 150 kHz–30 MHz aralığında bir hat empedansı dengeleme devresi üzerinden, ışıyan yayınım ise 30 MHz'den başlayarak yansımasız odada ölçülür. [2]

### Kablo ferriti takmak EMC testini geçirir mi?

Tek başına bunu garanti etmez. Kablo ferriti girişim akımına karşı seri empedans oluşturur, ancak bu empedans frekansa ve malzemeye bağlıdır; sonuç bitmiş ürünün ölçümüyle doğrulanır. [5]

## Teknik kaynaklar

- [1] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [TDK Electronics: EMC filtreleri, genel teknik bilgiler](https://www.tdk-electronics.tdk.com/download/528632/7f30b0110a521bb506ace36f0c56af5c/pdf-technical-information.pdf).
- [3] [Murata: Gürültü önlemlerinin temelleri, 1. ders — EMI filtresi nedir?](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-1).
- [4] [Murata: Gürültü önlemlerinin temelleri, 6. ders — ortak mod şok bobinleri](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-6).
- [5] [Würth Elektronik: ANP115 — otomotiv uygulamaları için kablo ferritleri ve nanokristal kovanlar](https://www.we-online.com/components/media/o785206v410%20ANP115_EN.pdf).
