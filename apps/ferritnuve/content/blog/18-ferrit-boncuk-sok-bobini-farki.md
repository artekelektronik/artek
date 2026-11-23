# Ferrit boncuk, şok bobini ve ortak mod şok bobini: fark nedir?

Ferrit boncuk, şok bobini (indüktör) ve ortak mod şok bobini, üçü de hatta seri bağlanan manyetik parçalardır, ancak farklı işler yapar. İndüktör enerjiyi manyetik alanında depolar ve endüktans, doyma akımı ve anma akımıyla tanımlanır; ferrit boncuk yüksek frekanslı gürültüyü ısıya çevirir ve empedans-frekans eğrisiyle tanımlanır. Ortak mod şok bobini ise aynı nüvedeki iki sargısı sayesinde çalışma akımını etkilemeden yalnızca ortak mod gürültüye empedans gösterir.

## İndüktör, bobin ve şok bobini aynı şey mi?

Evet, üçü de aynı bileşenin adıdır. Vishay'in terimler belgesi “coil” (bobin) kelimesini indüktörün yaygın bir başka adı olarak verir. [1]

“Şok bobini” (İngilizce choke) ayrı bir bileşen değil, bir kullanım amacıdır: Vishay, RF şok bobinini sinyalleri süzmek veya bastırmak için kullanılan indüktörün başka bir adı olarak tanımlar. [1] Yani her şok bobini bir indüktördür; ad yalnızca görevini söyler.

## İndüktör nasıl çalışır ve nasıl tanımlanır?

Vishay indüktörü, akımdaki değişime direnen pasif bileşen olarak tanımlar; yararlı özelliklerinin çoğu bu yetenekten ve manyetik alanında enerji depolayabilmesinden gelir. İdeal bir indüktörün sinüs işarete gösterdiği empedans Z = XL = 2πfL ile verilir; endüktans veya frekans arttıkça empedans yükselir. [1]

Endüktansın yanında iki ayrı akım sınırı belirtilir:

- **[Doyma akımı](https://www.ferritnuve.com/sozluk#doyma-akimi):** endüktansı, DC akımsız başlangıç değerine göre belirli bir oranda düşüren DC akımdır; yaygın oranlar %10 ve %20'dir. [1]
- **Anma akımı:** indüktörden sürekli geçirilebilen DC akımdır; en yüksek ortam sıcaklığındaki sıcaklık artışına dayanır ve manyetik özelliklerle ilgili değildir. [1]

## Ferrit boncuk nasıl çalışır?

Murata'nın tanımıyla [ferrit boncuk](https://www.ferritnuve.com/sozluk#ferrit-boncuk), içinden iletken geçirilmiş bir ferrit parçasıdır; akım geçtiğinde indüktör gibi davranır. Fark malzemededir: kullanılan ferritin yüksek frekanstaki kaybı yüksektir. Sıradan indüktörde empedansın ana bileşeni reaktanstır (X); ferrit boncukta yüksek frekans bölgesinde ana bileşen dirençtir (R). Reaktans kayıp yaratmaz, direnç yaratır; boncuk bu yüzden gürültü enerjisini daha iyi soğurur. [2]

Texas Instruments aynı davranışı üç bölgeyle anlatır: ferrit boncuk düşük frekansta endüktif, kendi rezonans frekansına yakın yüksek frekanslarda dirençsel, bu frekansın üzerinde kapasitif davranır. Belirli bir frekans aralığındaki işaretleri çok az etkileyerek geçirir, daha yüksek frekanslıları ısı olarak harcar: indüktör enerjiyi depolar, ferrit boncuk harcar. [3]

Bu nedenle ferrit boncuk endüktansla değil empedansla anılır. Murata, çip ferrit boncukların 100 MHz'deki empedans değerine göre standartlaştırıldığını ve seçimde işaret frekansı ile bastırılacak gürültü frekansının birlikte değerlendirilmesi gerektiğini belirtir. [2]

## DC akım ferrit boncuğu nasıl etkiler?

Ferrit boncuk da ferritli bir indüktör olduğundan manyetik doymadan etkilenir. Murata, çip ferrit boncuklardan yüksek akım geçtiğinde empedansın düştüğünü belirtir; önerisi, anma akımında pay bırakan veya başlangıç empedansı yüksek parçalar seçmektir. Akım azaldığında boncuk eski performansına döner. [4]

Texas Instruments da zayıflatmanın anma akımına ulaşılmadan çok önce değiştiğini ve tepe akımındaki empedansın veri sayfasında her zaman bulunmadığını yazar. [3] Besleme hattında bakılacak değer, akımsız ölçülen empedans değil, çalışma akımındaki empedanstır.

## Ortak mod şok bobini nasıl çalışır?

Vishay'in tanımıyla diferansiyel mod (normal mod) gürültü iki hat arasında görülen, ortak mod gürültü ise toprağa göre iki hatta da ortak olan parazittir. [1]

Murata'ya göre [ortak mod şok bobini](https://www.ferritnuve.com/sozluk#ortak-mod-sok-bobini), tek bir nüveye sarılmış iki iletkenden oluşur. Ortak mod akımların akıları aynı yöndedir, birbirini güçlendirir ve parça indüktör gibi davranır. Diferansiyel mod akımların, yani çalışma akımının akıları zıt yöndedir ve birbirini götürür; parça bu akıma karşı indüktör gibi davranmaz. [5]

Bunun iki sonucu vardır: işaret ile gürültünün frekansı çakışsa bile yalnızca gürültü bastırılır ve büyük diferansiyel akımda nüve doymadığı için performans düşmez. Ferrit boncuk veya normal mod (diferansiyel mod) şok bobini gibi diferansiyel moda etki eden parçalarda ise nüve büyük akımla doyar ve performans belirgin biçimde düşer. [5]

## Hangi parça ne zaman doğru seçim?

- **Enerji depolama ve hat süzme:** DC-DC dönüştürücülerde enerji indüktörde depolanır; giriş hat filtreleri de çoğunlukla indüktör ve kondansatör birleşimidir. [1]
- **İşaret hatları ve düşük akımlı besleme hatları:** gürültü frekansı işaret frekansından yüksekse seri bağlanan ferrit boncuk alçak geçiren filtre gibi çalışır. [2]
- **Yüksek hızlı diferansiyel hatlar:** USB ve HDMI gibi hatlarda işaret de çok yüksek frekanslıdır; boncuk ikisini ayıramaz, ortak mod şok bobini ayırır. [5]
- **Şebeke girişi ve büyük akımlı güç hatları:** Murata, ortak mod şok bobinlerinin büyük akım taşıyan güç hatlarında gürültü bastırmak için kullanıldığını belirtir. [5] Bkz. [ortak mod şok bobini nasıl seçilir](https://www.ferritnuve.com/blog/ortak-mod-sok-bobini-secimi) ve [tek fazlı EMI filtre seçimi](https://www.ferritnuve.com/blog/tek-fazli-emi-filtre-secimi).
- **Kablolar:** Würth Elektronik, ferrit nüvelerin ve geçmeli ferritlerin paraziti doğrudan kablo üzerinde, devre kartını değiştirmeden bastırmak için tasarlandığını belirtir. [6] Bkz. [kablo ferriti seçimi](https://www.ferritnuve.com/blog/kablo-ferriti-secimi).

## Artek’e şok bobini nüvesi veya kablo ferriti sorarken

Tek mesajda şunları paylaşın:

- Parçanın görevi: enerji depolama, hat süzme, şebeke girişi veya kablo üzerinde parazit bastırma.
- Hat akımı, varsa DC bileşen ve bastırılacak gürültünün frekans aralığı.
- Kablo ferriti için kablo dış çapı; nüve için ölçüler ve okunabilen işaretler.
- İstenen adet.

Artek kataloğunda 6mm ile 14.5mm arasındaki ölçülerde “Yuvarlak Plastik Kablo Çekirdekleri”, sargılı şok bobinlerinde nüve olarak kullanılan ferrit toroidler (örneğin T 25 / 15 / 10 - CF199) ve küçük UU ferrit nüveler (örneğin UU 10.5) bulunur; SMD çip ferrit boncuk katalogda yer almaz. Nüve seçimi için [ferrit toroid](https://www.ferritnuve.com/blog/ferrit-toroid-nuve-secimi) ve [UU nüve](https://www.ferritnuve.com/blog/uu-nuve-secimi) rehberlerine bakın. Katalogdaki [ferrit ürünleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit) veya [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Ferrit boncuk nedir?

İçinden iletken geçen, yüksek frekansta kaybı yüksek ferritten yapılmış bir gürültü bastırma parçasıdır. Yüksek frekans bölgesinde empedansının ana bileşeni dirençtir ve gürültü enerjisini soğurur; bu yüzden endüktansla değil, çoğunlukla 100 MHz'deki empedans değeriyle anılır. [2]

### Şok bobini nedir, ne işe yarar?

Şok bobini, sinyalleri süzmek veya bastırmak amacıyla kullanılan indüktördür. Empedansı frekansla arttığı için DC ve düşük frekanslı akımı geçirirken yüksek frekanslı bileşenlere karşı koyar. [1]

### Ortak mod şok bobini ile diferansiyel mod şok bobini arasındaki fark nedir?

Ortak mod şok bobininde iki sargı aynı nüvededir; çalışma akımının akıları birbirini götürür ve parça yalnızca ortak mod gürültüye indüktör gibi davranır. Diferansiyel (normal) mod şok bobini çalışma akımının kendisine etki eder ve nüvesi büyük akımla doyabilir. [5]

## Teknik kaynaklar

- [1] [Vishay: İndüktör ve manyetik ürün terimleri (belge 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Murata: Gürültü önlemlerinin temelleri, 4. ders — çip ferrit boncuklar](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-4).
- [3] [Texas Instruments: Kapı sürücü devrelerinde ferrit boncuk kullanımı (SLUAAI2)](https://www.ti.com/lit/pdf/sluaai2).
- [4] [Murata: Gürültü önlemlerinin temelleri, 10. ders — çip ferrit boncuk kullanırken dikkat edilecekler](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-10).
- [5] [Murata: Gürültü önlemlerinin temelleri, 6. ders — ortak mod şok bobinleri](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-6).
- [6] [Würth Elektronik: Kablo ferritleri ve kablo çözümleri](https://www.we-online.com/en/components/productnavigator/cable-solutions).
