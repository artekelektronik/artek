# EMI filtre nasıl bağlanır ve kullanılır?

EMI filtre, şebeke ile cihaz arasına bağlanan, genellikle alçak geçiren bir devredir: şebeke tarafı (line) beslemeye, yük tarafı (load) cihaza gider. Koruyucu toprak önce bağlanır, metal gövde referans toprağa geniş yüzeyle temas ettirilir ve filtrenin iki tarafındaki kablolar birbirinden ayrı çekilir. Sonuç, bitmiş cihazda parazit gerilimi ölçülerek doğrulanır.

## Bağlantıdan önce hangi güvenlik kuralları geçerlidir?

Şebeke filtresindeki iş, elektrik çarpması riski taşır. TDK'nın B84773 serisi IEC girişli filtre veri sayfası; planlama, montaj, kurulum, işletme, onarım ve bakım işlerinin yalnızca elektrik uzmanlarınca yapılmasını ister. Aynı belge, filtrede yük depolayan elemanlar bulunduğunu ve enerji kesildikten sonra uçlarda beş dakikadan uzun süre tehlikeli gerilim kalabileceğini yazar. [2]

TDK, montaj ve söküm için enerjinin kesilmesini, yeniden verilmesinin engellenmesini, gerilim olmadığının doğrulanmasını, gerektiğinde topraklama ve kısa devre yapılmasını ve komşu gerilimli bölümlerin örtülmesini sıralar. [1] Bu yazı genel bilgilendirmedir; parçanın veri sayfasının ve uygulamanın standardının yerini tutmaz.

## EMI filtre devresinde ne vardır?

TDK, EMC filtresini bobin, kondansatör ve dirençlerden oluşan, neredeyse her zaman alçak geçiren bir devre olarak tanımlar. Günlük kullanımdaki adıyla [EMI filtresinin](https://www.ferritnuve.com/sozluk#emi-filtresi) tipik elemanları hatlar arasına bağlanan X kondansatörleri, diferansiyel mod şok bobinleri, hat ile toprak arasına bağlanan Y kondansatörleri, akım kompanzasyonlu şok bobinleri ve deşarj dirençleridir. [1] İki hatlı filtreler DC veya tek fazlı uygulamalarda kullanılır. [1] TDK, [ortak mod](https://www.ferritnuve.com/sozluk#ortak-mod) paraziti akım kompanzasyonlu bobinler ve Y kondansatörleriyle azaltmanın iyi tasarlanmış bir topraklama ve kablolama düzeni gerektirdiğini belirtir. [1] Kavramlar için [EMI, EMC ve RFI rehberine](https://www.ferritnuve.com/blog/emi-emc-rfi-nedir) bakın.

## Hangi uç şebekeye, hangi uç cihaza bağlanır?

Veri sayfası uçları adlandırır. Örneğin TDK B84773 serisinde line tarafı IEC C14 giriş soketi, load tarafı ise 6,3 × 0,8 mm faston uçlardır. [2] Başka bir parçada yerleşim farklı olabilir; gövde üzerindeki işaretleri ve devre şemasını esas alın.

Koruyucu toprak bağlantısı montajda ilk yapılan, sökümde son ayrılan bağlantıdır. Filtre, anma akımının aşılmasına karşı aşırı akım korumasıyla kullanılmalıdır. [2]

## Gövde ve toprak nasıl bağlanır?

TDK iki işi ayırır: koruyucu iletken (PE) bağlantısı tehlikeli vücut akımlarına karşı güvenlik önlemidir; gövdenin geniş yüzeyli topraklanması ise filtrenin parazit bastırma işlevi için gereklidir. [1] Biri diğerinin yerine geçmez.

- Filtre gövdesini parlak metal bir montaj plakasına geniş yüzeyle oturtun ve plakayı pano ile düşük endüktanslı birleştirin. [1]
- Toprak şeridi gerekiyorsa kısa tutun. TDK, yuvarlak iletken yerine yassı bakır şeridi tercih eder; pratik kural, uzunluğun genişliğe oranının üçten küçük olmasıdır. [1]

[Kaçak akım](https://www.ferritnuve.com/sozluk#kacak-akim) ayrıca hesaba katılır. B84773 veri sayfası, 3,5 mA'nın üzerinde PE iletkeninin devreye almadan önce sabit biçimde, gerekli kesitte bağlanmasını ve ayrılmaya karşı emniyete alınmasını ister. [2] TDK'nın genel notlarına göre kaçak akım koruma rölesi kullanılıyorsa sistemin toplam kaçak akımı rölenin anma açma akımının yarısını geçmemelidir. [1]

## Kablolar nasıl yerleştirilir?

Parazit, yan yana giden kablolar arasında bağlaşabilir; bu yüzden kablo yerleşimi filtrenin işinin bir parçasıdır. [1] TDK'nın önerileri şunlardır:

- Şebeke ile filtre arasındaki temiz hatları, filtre ile parazit kaynağı arasındaki hatlardan ayırın ve paralel götürmeyin. [1]
- Sinyal ve güç kablolarını ayrı çekin; önerilen en küçük aralık 20 cm'dir. Kesişmeleri mümkünse dik açıyla yapın. [1]
- Filtreyi pano veya kasa girişine olabildiğince yakın yerleştirin; kaynak ile filtre arasını kısa tutun. [1]
- Ekranlı kabloda ekranı iki uçta geniş yüzeyle referans toprağa bağlayın; burulmuş ekran kuyruğundan kaçının. [1]

Montaj yeri doğal hava dolaşımını engellememelidir; TDK baş üstü (tavana asılı) montajı genel olarak uygun görmez. [1]

## EMI filtre nasıl test edilir?

İletilen parazit, besleme hattına geçici olarak seri bağlanan bir hat empedansı dengeleme devresi (LISN) ve spektrum analizörüyle ölçülür; LISN tutarlı kaynak ve ölçüm empedansı sağlayarak sonuçların tekrarlanabilmesine yardım eder. [1][3] TDK'ya göre sınır değerler çoğunlukla 150 kHz–30 MHz aralığında verilir. [1]

Texas Instruments'ın DC-DC dönüştürücüler için anlattığı akış, önce filtresiz durumu en ağır koşulda, yani en yüksek giriş akımında ölçmek, sonra gereken zayıflatmayı belirlemektir. Her iki hat ayrı taranır ve yüksek olan sonuç alınır. TI, sıkıca sarılmış besleme kablosunun okumayı yanıltıcı biçimde düşürebileceğini, sertifika testlerinde ise standardın istediği yerleşime uyulması gerektiğini belirtir. [3]

Veri sayfasındaki ekleme kaybı eğrisi çoğunlukla 50 Ω'luk düzende alınır ve karşılaştırma içindir. Gerçek uygulamadaki empedanslar farklı olduğundan kesin değerlendirme, filtre takılı cihazda ölçümle yapılır. [1] Aday karşılaştırmak için [tek fazlı EMI filtre seçimi](https://www.ferritnuve.com/blog/tek-fazli-emi-filtre-secimi) rehberine bakın.

## Artek’e bağlantı ve ölçü bilgisiyle nasıl talep gönderilir?

Talebinizde şunları paylaşın:

- Besleme türü, gerilim, frekans ve en yüksek sürekli akım.
- Biliniyorsa kaçak akım sınırı ve sorunlu frekans aralığı.
- Mevcut filtrenin model kodu, etiket fotoğrafı, uç tipi ve montaj ölçüleri.
- İstenen adet.

Artek kataloğunda “6 A EMI Filter” (6ET1-F7003) ile 03GENG3U-R ve IH-0342-H kodlu güç filtresi kayıtları bulunur; bağlantı yönü ve sınır değerler için ilgili parçanın üretici veri sayfası esas alınır. [Güç ve EMI filtrelerini inceleyebilir](https://www.ferritnuve.com/products?categories=PEM) veya bu bilgilerle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### EMI filtrenin line ve load uçları yer değiştirebilir mi?

Üretici uçları şebeke ve yük tarafı olarak tanımlar; bağlantı bu tanıma ve parçanın devre şemasına göre yapılmalıdır. Ters bağlantıda veri sayfasındaki değerlerin korunacağı varsayılmamalıdır. [2]

### EMI filtre topraklanmadan kullanılabilir mi?

Metal gövdeli ve PE uçlu bir filtrede koruyucu toprak, cihaz çalıştırılmadan önce bağlanmalıdır. Parazit bastırma işlevi için gövdenin referans toprağa geniş yüzeyli bağlantısı da gerekir. [1]

### Enerji kesilince EMI filtre uçlarına hemen dokunulabilir mi?

Hayır. TDK'nın B84773 veri sayfasına göre tehlikeli gerilim beş dakikadan uzun süre kalabilir; gerilim olmadığı yetkin personel tarafından doğrulanmalıdır. [2]

## Teknik kaynaklar

- [1] [TDK Electronics: EMC filtreleri, genel teknik bilgiler ve montaj talimatları](https://www.tdk-electronics.tdk.com/download/528632/7f30b0110a521bb506ace36f0c56af5c/pdf-technical-information.pdf).
- [2] [TDK Electronics: B84773 serisi IEC girişli EMC filtre veri sayfası](https://www.tdk-electronics.tdk.com/inf/30/ds/b84773.pdf).
- [3] [Texas Instruments: AN-2162, DC-DC dönüştürücülerde iletilen EMI (SNVA489C)](https://www.ti.com/lit/an/snva489c/snva489c.pdf).
