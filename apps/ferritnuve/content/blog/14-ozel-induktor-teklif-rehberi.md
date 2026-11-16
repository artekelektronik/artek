# Özel indüktör ve şok bobini teklifi için hangi bilgiler gerekir?

Özel sarımlı bir indüktör veya şok bobini için yalnızca endüktans değerini yazmak yeterli olmaz. Parçanın devredeki görevi, endüktansın ölçüm koşulu, sürekli akım ve tepe akım, doyma akımının hangi tanımla istendiği, DC direnç ve mekanik sınırlar birlikte verildiğinde talep değerlendirilebilir hale gelir. Bu rehber, talebinizi beş adımda hazırlamanız için bir kontrol listesi sunar.

## İndüktör ve şok bobini nerelerde kullanılır?

Anahtarlamalı dönüştürücülerde indüktör enerji depolar. Vishay, boost yapısında enerjinin giriş indüktöründe depolanıp çıkışa aktarıldığını, buck yapısında ise anahtarlanan darbelerin bir indüktör ve kondansatör devresine uygulandığını anlatır. [1] Aynı kaynak, giriş hat filtrelerini çoğunlukla indüktör ve kondansatör birleşimlerinden oluşan alçak geçiren filtreler olarak tanımlar. [1] Ortak mod şok bobinleri ise hat çiftinde toprağa göre aynı genlik ve fazda görünen paraziti hedefler. [2]

Bu yazıda “indüktör”, “şok bobini” ve “sarımlı bobin” tel sarılmış bileşeni anlatır. Telin üzerine sarıldığı plastik parça ise karkastır (bobin karkası); ikisi ayrı ürünlerdir.

Artek kataloğunda bu tür parçalarda kullanılan nüveler bulunur: ferrit toroidler (örneğin T 25 / 15 / 10 - CF199), demir tozu toroidler (örneğin T 106 - 26 ve T 106 - 52), ferrit çubuklar (örneğin ROD 18 x 28), makara nüveler (MAKARA 9X12) ve EE/ETD ferrit nüveler (örneğin EE 25 / 13 / 7 - CF139).

## 1. Parçanın görevini yazın

Talebin ilk satırında şu üç durumdan hangisinin geçerli olduğunu belirtin:

- Enerji depolayan güç indüktörü: buck, boost veya PFC devresi.
- Ortak mod şok bobini: iki veya daha fazla sargılı, hat filtresi için.
- Diferansiyel mod (filtre) şok bobini: tek sargılı, hat üzerindeki seri filtre elemanı.

Ortak mod şok bobininde diferansiyel akımların manyetik alanları birbirini götürür, ortak mod akımların alanları ise toplanır ve yüksek endüktans oluşur. [2] Enerji depolayan indüktörde ise nüve DC akımı taşır. Vishay, demir tozu nüvenin dağıtılmış hava aralığı sayesinde ferrite göre daha yüksek DC akımda doyduğunu belirtir. [1] Görev bu yüzden nüve tipini belirler.

## 2. Elektriksel değerleri ölçüm koşuluyla verin

Endüktansı toleransı ve ölçüm frekansıyla birlikte yazın. Vishay, güç indüktörleri için yaygın test frekansını 1 kHz olarak listeler; standart tolerans harfleri arasında J (±%5), K (±%10) ve M (±%20) bulunur. [1]

Akım için tek bir sayı yetmez. Şunları ayrı ayrı belirtin:

- Sürekli DC veya RMS akım.
- Tepe akım ve bu akımda kabul edilen endüktans düşüşü.
- Dalgalanma (ripple) akımı ve anahtarlama frekansı.
- En yüksek DC direnç.

DC direnç, sargının alternatif akım olmadan ölçülen direncidir ve genellikle en yüksek değer olarak tanımlanır. [1]

## 3. Doyma akımı ile anma akımını ayırın

Bu iki değer farklı sınırları anlatır. Vishay’in tanımına göre doyma akımı, endüktansı sıfır DC akımdaki değerine göre belirli bir oranda düşüren DC akımdır; yaygın oranlar %10 ve %20’dir. [1] Anma akımı ise sürekli geçirilebilen DC akımdır, en yüksek ortam sıcaklığındaki sıcaklık artışına dayanır ve indüktörün manyetik özellikleriyle ilgili değildir. [1]

Würth Elektronik, farklı üreticilerin anma akımı değerlerinin doğrudan karşılaştırılamayacağını belirtir. Kendi ölçümünü IEC 62024-2:2020 standardına dayandırır, yalnızca doğal konveksiyon kullanır ve karşılaştırma örneğinde 25 °C ortamın 40 K üzerini esas alır. [3]

Talebinizde “10 A” yazmak yerine “10 A sürekli, 14 A tepe, tepe akımda endüktans düşüşü en fazla %20” gibi iki sınırı da tanımlayın.

## 4. Nüve ve sargı bilgisini ekleyin

Biliyorsanız nüve biçimini ve malzemesini yazın: toroid, makara, hava aralıklı EE veya çubuk. Toroid ve E nüveler kapalı manyetik yol sayılır; çubuk ve ekransız makara nüveler açık manyetik yola sahiptir. [1] Ferrit ve demir tozu arasındaki fark için [ferrit ve demir tozu toroid rehberine](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) bakabilirsiniz.

Tel tipini ve biliyorsanız sarım sayısını belirtin. Ortak mod şok bobininde sargı düzeni sonucu değiştirir. Bifilar sarımda bağlaşım yüksektir ve diferansiyel mod endüktansı büyük ölçüde sıfırlanır. Bölmeli sarımda sargılar nüve üzerinde ayrı bölgelere yerleşir, sargılar arası kapasite düşer ve bir miktar diferansiyel mod endüktansı kalır. [2] Hat gerilimini ve sargılar arasında beklediğiniz izolasyon test gerilimini açıkça yazın.

## 5. Mekanik, ortam ve adet bilgisini tamamlayın

Taban alanı ve en yüksek yükseklik sınırını verin. Montaj biçimini belirtin: delik içi (through-hole) pinli, tabanlı veya serbest kablo uçlu.

Ortam sıcaklığını ve soğutma koşulunu yazın. Çalışma sıcaklığı, sargı kaybından kaynaklanan kendi ısınmasını da içerir; sıcaklık artışına hem bakır hem nüve kayıpları katkıda bulunur. [1]

Son ürünün uyması gereken standartları, numune adedini ve öngörülen seri adedi ayrı ayrı paylaşın.

## Artek’e indüktör ve şok bobini talebi gönderirken

Aşağıdaki bilgileri tek mesajda toplayın; bilmediğiniz alanları tahmin etmek yerine “bilinmiyor” olarak belirtin:

- Görev: güç indüktörü, ortak mod veya diferansiyel mod şok bobini.
- Endüktans, tolerans, ölçüm frekansı ve seviyesi.
- Sürekli akım, tepe akım, kabul edilen endüktans düşüşü.
- Dalgalanma akımı, anahtarlama frekansı, en yüksek DC direnç.
- Biliniyorsa nüve, tel ve sarım bilgisi; ortak modda hat gerilimi ve izolasyon.
- Ölçüler, montaj biçimi, ortam sıcaklığı ve standartlar.
- Numune ve seri adet; varsa mevcut parçanın fotoğrafı.

Katalogdaki [ferrit ve demir tozu nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit,IRON-POWDER) veya bu listeyle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact). Trafo için [özel trafo teklif rehberine](https://www.ferritnuve.com/blog/ozel-trafo-teklif-rehberi) bakın.

## Sık sorulan sorular

### Doyma akımı ile anma akımı arasındaki fark nedir?

Doyma akımı endüktansın belirli bir oranda düştüğü akımı, anma akımı ise sıcaklık artışına göre sürekli geçirilebilen akımı anlatır. İki değer ayrı ayrı istenmelidir. [1]

### Toroid bobin için ferrit mi demir tozu mu seçilir?

Bu, parçanın görevine bağlıdır. Vishay, demir tozu nüvenin dağıtılmış hava aralığı nedeniyle doymadan önce ferrite göre daha yüksek DC akım taşıdığını ve endüktans düşüşünün daha yumuşak olduğunu belirtir. [1]

### Elimde yalnızca numune şok bobini varsa talep gönderebilir miyim?

Gönderebilirsiniz. Numunenin fotoğrafını, ölçülerini, okunabilen işaretlerini ve kullanıldığı devreyi paylaşın; eksik elektriksel değerler için hangi ölçümün gerektiği ayrıca belirlenir.

## Teknik kaynaklar

- [1] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Würth Elektronik: ANP146, WE-CMDC ortak mod şok bobinleri uygulama notu](https://www.we-online.com/components/media/o868432v410%20ANP146a_WE-CMDC_EN.pdf).
- [3] [Würth Elektronik: ANP096, anma akımı değerleri ne anlama gelir?](https://www.we-online.com/components/media/o393343v410%20ANP096%20EN.pdf).
