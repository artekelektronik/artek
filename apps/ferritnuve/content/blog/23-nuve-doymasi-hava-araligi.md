# Nüve neden doyar? Hava aralığı ne işe yarar?

Nüve doyması, manyetik nüvenin taşıyabildiği akı yoğunluğunun sınırına ulaşmasıdır: bu noktadan sonra akım artsa da akı artmaz, geçirgenlik çöker ve bobinin endüktansı düşer. Hava aralığı, nüvenin manyetik yoluna bilerek bırakılan, manyetik olmayan küçük bir boşluktur; etkin geçirgenliği ve AL değerini düşürür, böylece nüve doymadan önce daha yüksek akım taşır. Bedeli, aynı endüktans için daha fazla sarım ve aralığın çevresine saçılan akıdır.

## Nüve doyması nedir? B-H eğrisi neden düzleşir?

TDK'ya göre doyma, malzemedeki bütün temel mıknatısların alan yönüne dizildiği durumdur. TDK [doyma akı yoğunluğunu](https://www.ferritnuve.com/sozluk#doyma-aki-yogunlugu) (BS), belirli bir sıcaklıkta malzemede ulaşılabilen en yüksek akı yoğunluğu olarak tanımlar: bu değerin üzerinde alan şiddeti (H) artırılsa da B artmaz. [1] B-H eğrisinin düzleşmesi budur.

Devre tarafındaki sonucu Vishay anlatır: en yüksek akı yoğunluğu noktasının ötesinde nüvenin geçirgenliği azalır ve endüktans düşer. [2] Texas Instruments da doymuş nüve malzemesinin manyetik olmayan, yüksek relüktanslı bir malzeme gibi davrandığını belirtir. [3] Endüktans, akımdaki değişime karşı koyan özelliktir [2]; endüktansı düşen bobinde aynı gerilim akımı çok daha hızlı yükseltir.

## Doyma akı yoğunluğu sıcaklıkla nasıl değişir?

TDK'ya göre BS sıcaklık arttıkça sürekli düşer ve Curie sıcaklığında sıfıra iner. [1] TDK, N87 malzemesi için akı yoğunluğunu H = 1200 A/m ve f = 10 kHz koşulunda 25 °C'de 490 mT, 100 °C'de 390 mT olarak verir. [4] Yani aynı malzeme sıcakken yaklaşık beşte bir daha düşük akı yoğunluğunda doyar.

Bu yüzden doyma kontrolü çalışma sıcaklığına göre yapılır. Texas Instruments, güç ferriti için temkinli bir doyma sınırı olarak yaklaşık 0,3 T alınabileceğini belirtir. [3] N87 değerleri yalnızca TDK'nın bu malzemesine aittir.

## Tepe akı yoğunluğu nasıl tahmin edilir?

Bobinlerde hesap akımdan yapılır. Texas Instruments sarım sayısını N = L × ΔI / (ΔB × Ae) bağıntısıyla bulur. [3] Aynı bağıntı tepe değerler için B = L × I / (N × Ae) biçiminde yazılabilir (SI birimleriyle); I tepe akım, Ae etkin kesittir.

Trafolarda hesap gerilimden yapılır. Faraday yasasına göre bir sargıdan geçen akı, sarım başına volt-saniyenin integraline eşittir; dikdörtgen gerilimde bu, ΔB = V × t / (N × Ae) demektir. Geçici durumlarda volt-saniye normalin birkaç katına çıkıp nüveyi doyurabilir. [5]

## Hava aralığı ne işe yarar?

TDK, [hava aralıklı](https://www.ferritnuve.com/sozluk#hava-araligi) nüveler için etkin geçirgenliği (μe) tanımlar ve küçük aralıklar için şu yaklaşımı verir: μe = μi / (1 + s × μi / le); s aralık genişliği, le etkin manyetik yol uzunluğudur. [1] Texas Instruments'a göre manyetik enerjinin neredeyse tamamı aralıkta depolanır; nüve malzemesi bu enerjiyi sargıya bağlayan düşük relüktanslı yoldur ve ayrık aralık B-H eğrisini doğrusallaştırır. [3]

TDK'nın kendi ETD 39/20/13 nüvesi bunu rakamla gösterir: N87 malzemede aralıksız takımın [AL değeri](https://www.ferritnuve.com/sozluk#al-degeri) 2700 nH (+30/−20%) ve μe 1600 iken, 1,00 mm aralıkla AL yaklaşık 196 nH'ye, μe 115'e iner. [6] L = AL × N² olduğundan [3] aynı endüktans için yaklaşık 3,7 kat sarım gerekir; yukarıdaki bağıntı gereği aynı akımda akı yoğunluğu da aynı oranda düşer.

İkinci kazanç kararlılıktır: TDK, aralığın sıcaklık katsayısını μe/μi oranında küçülttüğünü ve dar AL toleranslarına imkân verdiğini belirtir. [7]

Aralığın bedeli de vardır:

- **Daha fazla sarım:** AL düştüğü için aynı endüktans daha çok sarım ister.
- **Saçak akı ve bakır kaybı:** Aralığa yakın sarımlarda büyük girdap akımı kayıpları oluşabilir; sorun flyback trafolarında en şiddetlidir. [3]
- **EMI:** Aralığın dışına taşan kaçak akı, gürültüyü devreye ve çevreye bağlar. [3]

## Hava aralığı nerede gerekir, nerede kaçınılır?

- **Flyback trafosu:** TDK, flyback çevirici için nüve gereksinimleri arasında aralıklı nüveyi sayar. [7]
- **PFC (boost) ve DC şok bobinleri:** Texas Instruments'a göre enerjiyi depolayıp geri vermek için yüksek geçirgenlikli nüveye seri bir aralık gerekir; boost endüktöründe sınırlardan biri tepe akımdaki doymadır. [3]
- **Forward ve push-pull trafoları:** TDK bu çeviriciler için genellikle aralıksız nüve önerir. [7]
- **Ortak mod şok bobinleri:** TDK kapalı nüve yapısını uygun bulur; faydalı akımın yol açacağı doyma, eşit sarımlı iki sargının akılarının birbirini götürmesiyle çözülür. [7]

Ayrık aralığın alternatifi demir tozu nüvedir. Vishay'e göre demir tozu, kendiliğinden dağıtılmış hava aralığına sahiptir; ferrite göre daha yüksek DC akımda doyar ve endüktansı çok daha yavaş düşer. [2] Magnetics de dağıtılmış aralıklı malzemelerde ferritteki gibi belirgin bir doyma noktası olmadığını belirtir. [8] Texas Instruments, aralıklı ferrit toroidi çok kötü bir seçim sayar; çünkü toroide dağıtılan sargı ayrık aralığa uymaz. [3] Karşılaştırma için [ferrit ve demir tozu toroid rehberine](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) bakın.

## Hava aralıklı nüve nasıl sipariş edilir?

Magnetics'e göre aralık AL değerine veya mekanik ölçüye göre belirtilir; AL ile belirtilen aralık daha dar tolerans verir. [9] TDK'nın ETD 39/20/13 tablosundaki AL değerleri, bir aralıksız ve bir aralıklı yarımdan oluşan takım için geçerlidir. [6]

Orta bacağı taşlatmak yerine yarımların arasına ara parça koymak, aralığın yarısını dış bacaklara taşır; Texas Instruments bu durumda dışarıya kaçak akı yayıldığını ve endüktansın öngörülmesinin zorlaştığını belirtir. [3] Nüve boyutu için [ETD nüve seçim rehberine](https://www.ferritnuve.com/blog/etd-nuve-secimi), sarılı parça için [özel trafo teklif rehberine](https://www.ferritnuve.com/blog/ozel-trafo-teklif-rehberi) bakın.

## Artek’e hava aralıklı nüve sorarken

Talebinizde şunları tek mesajda paylaşın:

- Uygulama: flyback trafosu, PFC bobini veya DC şok bobini.
- Nüve tipi, tam ölçüsü ve varsa malzeme işareti.
- İstenen AL değeri veya milimetre cinsinden aralık; orta bacakta mı, ara parçayla mı.
- Tepe akım, çalışma frekansı ve en yüksek nüve sıcaklığı.
- İstenen adet (tek yarım veya takım).

Artek kataloğunda EE nüveler (örneğin EE 42 / 21 / 15 - CF139), ETD nüveler (örneğin ETD 39 / 20 / 13- CF139), ferrit toroidler (örneğin T 25 / 15 / 10 - CF199) ve demir tozu toroidler (örneğin T 106 - 26) bulunur. Katalog hava aralığı veya doyma değeri belirtmez; gereken aralık ya da AL değeri talepte yazılmalıdır. Katalogdaki [ferrit nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya ihtiyacınızla birlikte [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Nüve doyarsa ne olur?

Nüvenin geçirgenliği azalır ve bobinin endüktansı düşer. [2] Doymuş malzeme manyetik olmayan, yüksek relüktanslı bir malzeme gibi davranır. [3]

### Flyback trafosunda hava aralığı neden gerekir?

Flyback trafosu enerjiyi depolayıp geri verir ve bu enerjinin neredeyse tamamı aralıkta depolanır; yüksek geçirgenlikli nüve yalnızca akıya kolay bir yol sağlar. [3]

### Hava aralığı büyüdükçe endüktans neden düşer?

Aralık büyüdükçe etkin geçirgenlik ve onunla birlikte AL değeri düşer; aynı sarım sayısı daha az endüktans verir. [1]

## Teknik kaynaklar

- [1] [TDK: Ferritler ve aksesuarlar — genel tanımlar](https://www.tdk-electronics.tdk.com/download/187036/dbcde584d155cc270f5d5dbf1efec233/pdf-generaldefinitions.pdf).
- [2] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [3] [Texas Instruments: Bobin ve flyback transformatörü tasarımı](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [4] [TDK: SIFERRIT N87 malzeme verileri](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [5] [Texas Instruments: Güç transformatörü tasarımı](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [6] [TDK: ETD 39/20/13 nüve ve aksesuar verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [7] [TDK: Ferritler ve aksesuarlar — uygulama notları](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [8] [Magnetics: Toz nüveler hakkında sık sorulan teknik sorular](https://www.mag-inc.com/Products/Powder-Cores/Learn-More-about-Powder-Cores).
- [9] [Magnetics: Ferrit nüveler hakkında sık sorulan teknik sorular](https://www.mag-inc.com/Products/Ferrite-Cores/Learn-More-about-Ferrite-Cores).
