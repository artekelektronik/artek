# SMPS nedir? SMPS trafosu şebeke trafosundan nasıl ayrılır?

SMPS (anahtarlamalı güç kaynağı), bir yarı iletken anahtarı saniyede on binlerce, hatta yüz binlerce kez açıp kapatarak giriş gerilimini istenen çıkış gerilimine dönüştüren güç kaynağıdır. SMPS trafosu, 50/60 Hz şebeke trafosunun yaptığı gerilim dönüştürme ve yalıtım işini çok daha yüksek bir frekansta yapar; bu yüzden aynı güç için çok daha küçüktür ve nüvesi sac yerine ferritten yapılır.

## SMPS nasıl çalışır? Anahtarlama ne işe yarar?

onsemi'ye göre doğrusal (lineer) regülatörde giriş ile çıkış arasındaki gerilim farkı geçiş transistöründe ısıya dönüşür; verim yalnızca yüzde 35–65 olur. [1]

[SMPS](https://www.ferritnuve.com/sozluk#smps-anahtarlamali-guc-kaynagi) ise güç anahtarını iki verimli durum arasında hızla değiştirir: kesimde anahtarın üzerinde gerilim vardır ama akım akmaz, iletimde akım yüksektir ama gerilim düşümü çok küçüktür. Anahtar böylece DC giriş geriliminden bir AC gerilim üretir; bu gerilim trafo ile yükseltilip düşürülebilir ve çıkışta yeniden DC'ye süzülür. Verim yüzde 65–95 aralığındadır; bedeli, daha karmaşık bir devre ve anahtarlama gürültüsüdür. [1]

## Yüksek frekans manyetik elemanı neden küçültür?

Texas Instruments'ın özetlediği Faraday yasasına göre bir sargıdan geçen akı, sarım başına uygulanan volt-saniyenin integraline eşittir. [2] Buradan şu sonuç çıkar: frekans yükseldikçe her periyotta uygulanan volt-saniye azalır ve aynı gerilim daha küçük bir nüve kesiti veya daha az sarımla taşınabilir. Üreticiler bunu doğrudan da ifade eder:

- TI'nin nüve boyutu için verdiği kaba tahmin formülünde trafo frekansı paydadadır; aynı güç ve akı salınımı için gereken nüve frekans arttıkça küçülür. [2]
- onsemi, çalışma frekansını artırmanın daha küçük bobin ve kondansatör kullanmaya izin verdiğini belirtir. [1]

Küçülmenin sınırı kayıplardır: TI'ye göre ferritte 50 kHz'in üzerinde akı salınımını genellikle nüve kayıpları sınırlar. [2]

## Şebeke trafosunun sac nüvesi yerine neden ferrit kullanılır?

TI'ye göre metal alaşımlı nüvelerin özdirenci yalnızca 50–150 mikro-ohm·cm'dir; nüve tek parça metal olsaydı kısa devre edilmiş bir sarım gibi davranırdı. Bu yüzden nüve, birbirinden yalıtılmış ince sac katmanlarına bölünür. [3]

Bu ince şeritten sarılmış metal alaşımlı nüveler esas olarak 50, 60 ve 400 Hz şebeke frekanslarında kullanılır. TI, 100 kHz ve üzerindeki SMPS frekanslarında 12,5 µm kalınlığında şeritle bile girdap akımı kayıplarının fazla büyük olduğunu belirtir. [3]

Güç ferritlerinin özdirenci ise 200–2000 ohm·cm aralığındadır; 100 kHz'de girdap akımı kayıpları histerezis kayıplarının yanında zor fark edilir. TI, ferriti SMPS uygulamalarında en yaygın nüve malzemesi olarak tanımlar. [3] Malzemenin kendisi için [ferrit nüve nedir yazısına](https://www.ferritnuve.com/blog/ferrit-nuve-nedir) bakın.

## Dönüştürücü aileleri: hangisi trafo, hangisi bobin kullanır?

- **Buck (düşürücü):** Çıkışında L-C filtresi bulunan, yalıtımsız ve yalnızca gerilim düşüren devredir; manyetik elemanı bir bobindir. [1]
- **Boost (yükseltici):** Yalıtımsız yükseltici devredir; enerji anahtar iletimdeyken bobinde depolanır, kesimdeyken çıkışa aktarılır. [1]
- **Flyback:** Boost devresindeki bobinin yerine trafo konulmasıyla elde edilir; trafo ayrıca giriş ile çıkış arasında yalıtım sağlar. [1] Devrede tek bir endüktif eleman bulunur. [4]
- **Forward:** TDK'ya göre iki endüktif eleman gerektirir: trafo ve büyük bir çıkış bobini. [4]
- **Push-pull, yarım köprü ve tam köprü:** TI, forward ile birlikte bu devreleri buck türevi topolojiler olarak sınıflandırır; hepsi güç trafosu kullanır. [2]

onsemi'ye göre 42,5 V DC üzerindeki giriş gerilimleri tehlikeli sayılır; şebekeye bağlanan kaynaklarda bu yüzden yalnızca trafo yalıtımlı topolojiler kullanılır. [1]

## Flyback trafosu enerji depolar, forward trafosu depolamaz

TI'ye göre ideal bir trafo enerji depolamaz; bütün enerji girişten çıkışa anında aktarılır. [2] Forward türü topolojilerde trafo yalnızca AC gerilimi yükseltip düşürür; enerji çıkış filtresinde depolanır. [1]

[Flyback trafosu](https://www.ferritnuve.com/sozluk#flyback-trafosu) farklıdır: TI onu gerçek bir trafo değil, çok sargılı bir kuplajlı bobin olarak tanımlar. Enerjiyi devreden alır, manyetik alanda depolar ve sonra geri verir. [5]

Depolama için [hava aralığı](https://www.ferritnuve.com/sozluk#hava-araligi) gerekir. TI'ye göre enerjiyi verimli ve küçük bir hacimde depolamak için yüksek geçirgenlikli nüveyle seri küçük bir manyetik olmayan aralık gerekir; manyetik enerjinin neredeyse tamamı bu aralıkta depolanır. [5] TDK da aynı ayrımı yapar: flyback için hava aralıklı nüveler, forward ve push-pull için genellikle hava aralıksız nüveler. [4]

## EE, ETD ve toroid nüve: devre türü biçimi nasıl etkiler?

TI'ye göre ETD nüveler de E-E biçimlidir ve nüve boyutuna göre geniş pencereleri vardır. [2] Ayrık hava aralığı olan nüvede sargı aralığın tam üzerinde, yani orta bacakta olmalıdır. [5] TDK flyback için E ve U, forward ve push-pull için E/ETD ve RM/PM nüveleri önerir. [4]

Toroid nüvede kaçak endüktans ve kaçak akı çok düşüktür; ancak TI, sarım güçlüğü nedeniyle toroidlerin SMPS trafolarında nadiren kullanıldığını belirtir. [2] Hava aralıklı ferrit toroid ise flyback için çok kötü bir seçimdir: toroide yayılmış sargı ayrık aralığa uymaz. [5] TDK'ya göre R 13,3 – R 26 arası halka nüveler anahtarlamalı güç kaynaklarının güç hatlarında şok bobini olarak kullanılır. [4]

Artek kataloğunda EE ferrit nüveler (örneğin EE 25 / 13 / 7 - CF139), ETD ferrit nüveler (örneğin ETD 39 / 20 / 13- CF139) ve ferrit toroidler (örneğin T 25 / 15 / 10 - CF199) bulunur. Biçim seçimi için [EE nüve](https://www.ferritnuve.com/blog/ee-nuve-secimi) ve [ETD nüve](https://www.ferritnuve.com/blog/etd-nuve-secimi) rehberlerine bakın.

## Artek’e SMPS trafosu nüvesi sorarken

- Devre türü: flyback, forward, push-pull, yarım veya tam köprü.
- Anahtarlama frekansı, giriş ve çıkış gerilimleri, çıkış gücü.
- Nüve biçimi ve ölçüsü; hava aralığı gerekip gerekmediği, biliniyorsa AL değeri.
- Karkas ihtiyacı, mevcut parçanın fotoğrafı ve adet.

Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya bu bilgilerle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### SMPS trafosu nedir?

Anahtarlamalı güç kaynağında, anahtarın ürettiği yüksek frekanslı AC gerilimi yükselten veya düşüren ve giriş ile çıkışı birbirinden yalıtan ferrit nüveli trafodur. Farklı sarım sayılı sekonder sargılarla birden fazla çıkış gerilimi de sağlar. [1] [2]

### Her SMPS'te trafo bulunur mu?

Hayır. Buck ve boost gibi yalıtımsız devrelerde manyetik eleman yalnızca bir bobindir; flyback, forward, push-pull ve köprü devrelerinde trafo bulunur. [1] [2]

### Flyback trafosunda neden hava aralığı bulunur?

Çünkü flyback trafosu aslında enerji depolayan kuplajlı bir bobindir ve manyetik enerjinin neredeyse tamamı nüveyle seri duran manyetik olmayan aralıkta depolanır. Forward trafosunda enerji depolamak istenmediği için nüve genellikle aralıksız kullanılır. [4] [5]

## Teknik kaynaklar

- [1] [onsemi: Switch-Mode Power Supply Reference Manual (SMPSRM/D)](https://www.onsemi.com/pub/collateral/smpsrm-d.pdf).
- [2] [Texas Instruments: Güç trafosu tasarımı (Magnetics Design, bölüm 4)](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [3] [Texas Instruments: Manyetik nüve özellikleri (Magnetics Design, bölüm 2)](https://www.ti.com/lit/ml/slup124/slup124.pdf).
- [4] [TDK: Ferritler ve aksesuarlar, uygulama notları](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [5] [Texas Instruments: Bobin ve flyback transformatörü tasarımı (Magnetics Design, bölüm 5)](https://www.ti.com/lit/ml/slup127/slup127.pdf).
