# Ortak mod şok bobini nasıl çalışır, nasıl seçilir?

Ortak mod şok bobini, aynı kapalı nüve üzerine eşit sarım sayılı iki veya daha fazla sargının sarıldığı bir parazit bastırma bobinidir. Çalışma akımının sargılarda oluşturduğu manyetik akılar birbirini götürür; bu yüzden nüve yük akımıyla doymaz, ortak mod gürültü ise bobinin tüm endüktansını görür. Seçimde anma akımı, gerilim, gürültü bandındaki empedans ve sarım biçimi birlikte değerlendirilir.

## Ortak mod şok bobini nasıl çalışır?

TDK'nın açıklamasına göre sargılar, çalışma akımının bir sargıda oluşturduğu akı diğer sargıdaki akıya zıt olacak biçimde bağlanır ve iki akı birbirini kompanse eder. Bu sayede yüksek geçirgenlikli halka nüveler kullanılabilir ve sargı başına yüksek endüktans elde edilir. [1] Parça bu yüzden “akım kompanzasyonlu bobin” olarak da anılır.

Würth Elektronik aynı ilkeyi iki akım türüyle anlatır: [diferansiyel mod](https://www.ferritnuve.com/sozluk#diferansiyel-mod) akımı sargılardan zıt yönde geçer ve bu akım için endüktans sıfıra yaklaşır; ortak mod akımları aynı yönde geçer, alanlar toplanır ve yüksek bir endüktans oluşur. [2]

Kaçak akım sınırları Y kondansatörlerinin kapasitesini sınırladığı için ortak mod gürültüye karşı yüksek endüktans gerekir. [1]

## Empedans eğrisi neden yükselip sonra düşer?

TDK, sargının parazitik kapasitesi ile endüktansın paralel bir rezonans devresi oluşturduğunu, öz rezonans frekansında parçanın yüksek bir direnç gibi davrandığını, daha yüksek frekanslarda ise kapasitif çalıştığını belirtir; parça rezonans frekansının oldukça altında kullanılmalıdır. [3] Würth'e göre bu kapasite komşu sarımların yakınlığından doğar. [2]

İkinci neden malzemedir: ferritin gerçek geçirgenliği frekans yükseldikçe düşer. [2] Sarım tekniği de eğriyi değiştirir: TDK'ya göre tek katlı sarım en düşük kapasiteyi ve en yüksek rezonans frekansını, çok katlı sarım en yüksek kapasiteyi ve en düşük rezonans frekansını verir. [3]

## Nüve malzemesi: MnZn, NiZn ve nanokristal

KEMET'e göre malzeme hedef frekans bandına göre seçilir: yüksek geçirgenlikli malzemeler düşük frekans bölgesinde, düşük geçirgenlikli malzemeler yüksek frekans bölgesinde etkilidir; MnZn ürünler esas olarak iletilen gürültüye, NiZn ürünler ışıma gürültüsüne karşı kullanılır. [4]

Würth, ortak mod bobinlerinde MnZn nüvelerin 200 kHz ile 30 MHz arasında çalıştığını, NiZn nüvelerin 10 MHz'in üzerinden birkaç yüz MHz'e kadar uygun olduğunu yazar. [2] İletilen parazit gerilimi tipik olarak 150 kHz – 30 MHz aralığında ölçülür. [5]

Ferrit tek seçenek değildir: Würth'ün WE-CMBNC serisi çok yüksek geçirgenlikli nanokristal nüve kullanır ve üretici bu seri için 1 kHz – 300 MHz aralığı verir. [6]

## Bifilar ve bölmeli sarım: kaçak endüktans ne işe yarar?

Bifilar sarımda iki tel yan yana sarılır. Würth'e göre kuplaj çok iyidir, ancak diferansiyel mod akımları için endüktans ortadan kalkar ve tellerin yakınlığı sargılar arası kapasiteyi artırır. Bölmeli sarımda sargılar nüvenin ayrı bölgelerine, aralarında boşluk bırakılarak yerleştirilir; sargılar arası kapasite düşer, kuplaj azaldığı için bir miktar diferansiyel mod endüktansı oluşur, parça ise çoğunlukla büyür. [2]

Bu artık endüktans [kaçak endüktanstır](https://www.ferritnuve.com/sozluk#kacak-enduktans); TDK, simetrik parazite etki ettiğini belirtir. [3] Würth tipik kuplaj katsayısını 0,80 ile 0,95 arasında verir; kaçak endüktans bir X kondansatörüyle birlikte diferansiyel mod filtresi olarak kullanılabilir. [2]

Bu katkı sınırlıdır: TDK, halka nüveli bobinlerinde kaçak endüktansın anma değerinin yüzde 1'i mertebesinde olduğunu, bu yüzden çoğu durumda X kondansatörleri veya toz nüveli bobinlerle birlikte kullanım gerektiğini belirtir. [1]

## Ortak mod şok bobini ne zaman doyar?

Akıların birbirini götürmesi, akımların toplamının sıfır olmasına bağlıdır. TDK'ya göre anma akımının küçük bir yüzdesi bile başka bir yoldan, örneğin toprak bağlantısından akarsa bobin artık kompanse değildir, nüve en azından kısmen [doyar](https://www.ferritnuve.com/sozluk#doyma) ve endüktans düşer. [1]

Sonuç bu yüzden gerçek devrede doğrulanmalıdır. TDK, sürücü sistemlerinde topraktan akan parazitik akımların filtredeki bobinleri doyurabileceğini ve parazit gerilimi ölçümünün kurulu sistemde yapılması gerektiğini belirtir. [5] KEMET de etkinin gerçek cihaz üzerinde test edilmesini ister. [4]

## Ortak mod şok bobini seçerken hangi değerlere bakılır?

- **Anma akımı:** Tüm hatlardan aynı anda akan sürekli akımdır; anma sıcaklığının üzerinde azaltılır. [3]
- **Gerilim:** Anma gerilimi ile üretimde uygulanan test gerilimi ayrı değerlerdir. [3] Örneğin KEMET, SU9 serisi için 250 V AC anma gerilimi ve hatlar arasında 2400 V AC dayanım gerilimi verir. [4]
- **Endüktans ve empedans:** Anma endüktansı belirli bir ölçüm frekansında verilir. [3] KEMET endüktansı 1 kHz'de ölçer ve her tip için empedans-frekans eğrisi yayımlar. [4]
- **DC direnç:** Hat başına, 20 °C'de ölçülür. [3]
- **Hat sayısı:** AC cihazlar için ikili, üç fazlı cihazlar için üçlü ve dörtlü bobinler vardır. [1]
- **Nüve biçimi ve montaj:** TDK'nın bu bobinleri halka (toroid) nüvelidir. [1] KEMET'in SU serisi karkaslı ferrit UU nüve kullanır; dikey ve yatay tipleri vardır. [4]

Nüve tarafı için [ferrit toroid nüve seçimi](https://www.ferritnuve.com/blog/ferrit-toroid-nuve-secimi) ve [UU nüve seçimi](https://www.ferritnuve.com/blog/uu-nuve-secimi), hazır filtre modülü için [tek fazlı EMI filtre seçimi](https://www.ferritnuve.com/blog/tek-fazli-emi-filtre-secimi) rehberine bakın.

## Artek’e ortak mod şok bobini nüvesi sorarken

Artek kataloğunda bu tür bobinlerde nüve olarak kullanılan ferrit toroidler (örneğin T 25 / 15 / 10 - CF199, T 36 / 23 / 15 - CF199 ve T 63 / 38 / 25 - CF199) ve küçük UU ferrit nüveler (örneğin UU 10.5 ve UU 16) bulunur; sarılmış hazır ortak mod şok bobini listelenmez. Talebinizde şunları paylaşın:

- Nüve biçimi ve ölçüleri, varsa mevcut parçanın fotoğrafı ve işaretleri.
- Hat akımı, hat gerilimi ve hat sayısı.
- Sorunlu frekans bandı ve hedef endüktans veya empedans.
- İstenen adet.

Katalogdaki [ferrit toroid nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=TOROID) veya bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact). Sarımlı parça şartnamesi için [özel indüktör teklif rehberi](https://www.ferritnuve.com/blog/ozel-induktor-teklif-rehberi) yol gösterir.

## Sık sorulan sorular

### Ortak mod ve diferansiyel mod parazite karşı hangi filtre elemanları kullanılır?

Ortak mod şok bobininde sargılar aynı nüvededir ve çalışma akımının akıları birbirini götürür. [1] TDK'nın filtre anlatımında diferansiyel mod parazite karşı X kondansatörleri ve diferansiyel mod bobinleri, ortak mod parazite karşı akım kompanzasyonlu bobinler ve Y kondansatörleri kullanılır. [5]

### Ortak mod şok bobini hesaplaması nasıl yapılır?

Tek bir formül yeterli olmaz. Würth, pratikte ferritin karmaşık geçirgenliğinin frekansla değiştiğini ve sargıların parazitik kapasitelerinin hesaba katılması gerektiğini belirtir. [2] Seçim veri sayfasındaki empedans-frekans eğrisinden yapılır ve gerçek cihazda doğrulanır. [4]

### Toroid ortak mod şok bobini doyar mı?

Evet. Akımın küçük bir bölümü toprak gibi başka bir yoldan dönerse kompanzasyon bozulur, nüve kısmen doyar ve endüktans düşer. [1]

## Teknik kaynaklar

- [1] [TDK (EPCOS): Akım kompanzasyonlu halka nüveli bobinler, genel bilgiler](https://www.tdk-electronics.tdk.com/download/531436/64c998b4b1ca11d100791d28bd36e89b/pdf-currentcompensatedchokes.pdf).
- [2] [Würth Elektronik: ANP146, WE-CMDC ortak mod bobinleri uygulama notu](https://www.we-online.com/components/media/o868432v410%20ANP146a_WE-CMDC_EN.pdf).
- [3] [TDK: İndüktörler, genel teknik bilgiler](https://www.tdk-electronics.tdk.com/download/531382/d47b78852463cb1702f19b14bec9a65a/pdf-generaltechnicalinformation.pdf).
- [4] [KEMET: SU9V/9H ortak mod bobinleri veri sayfası](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [5] [TDK: EMC filtreleri teknik bilgiler](https://www.tdk-electronics.tdk.com/download/528632/7f30b0110a521bb506ace36f0c56af5c/pdf-technical-information.pdf).
- [6] [Würth Elektronik: WE-CMBNC nanokristal ortak mod şok bobini ürün sayfası](https://www.we-online.com/en/components/products/WE-CMBNC).
