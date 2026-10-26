# ETD29, ETD39 veya ETD44: SMPS için ferrit nüve nasıl seçilir?

Bir SMPS trafosunda nüve seçimi yalnızca güç değerine veya nüvenin dış boyutuna göre yapılamaz. Devre topolojisi, frekans, malzeme, hava aralığı, sarım alanı ve sıcaklık sınırları birlikte değerlendirilmelidir. ETD29, ETD39 ve ETD44 gibi adlar bu kararın geometrik başlangıç noktalarıdır.

## ETD boyutu neden tek başına güç değeri vermez?

“ETD39 kaç watt taşır?” sorusuna koşulsuz tek bir cevap vermek yanıltıcıdır. Aynı geometri farklı malzemelerle, hava aralıklarıyla ve sarım düzenleriyle kullanılabilir. Nüve kayıpları ve sargı kayıplarının oluşturduğu sıcaklık artışı da tasarımın sınırlarını etkiler. [1][2]

Bu nedenle seçim dosyasını “200 W trafo istiyorum” cümlesiyle sınırlamayın. Hangi giriş/çıkış koşullarında, hangi topolojide ve hangi sıcaklıkta çalışacağını da belirtin. Önce gereksinimler netleşir; ardından nüve ve sarım seçenekleri değerlendirilir.

## 1. Topolojiyi ve çalışma koşullarını tanımlayın

Flyback devresindeki manyetik eleman, çalışma sırasında enerji depolayan kuplajlı bir bobin gibi ele alınır. Enerji aktarımını farklı biçimde yapan topolojilerde ise manyetik tasarımın hedefleri değişir. Bu ayrım, endüktansın ve hava aralığının değerlendirilmesini etkiler. [1][2]

İlk teknik inceleme için aşağıdaki bilgileri hazırlayın:

- Devre topolojisi ve anahtarlama frekansı.
- Giriş geriliminin en düşük ve en yüksek değeri.
- Her çıkışın gerilimi ve akımı.
- Hedef güç ve yükün çalışma biçimi.
- Kullanılabilir hacim ve ortam sıcaklığı.
- İzolasyon ve mekanik montaj gereksinimleri.

Bu liste bir nihai tasarımın yerini tutmaz; eksik bilgilerin baştan görünür olmasını sağlar.

## 2. Geometriyi, malzemeyi ve hava aralığını ayrı okuyun

Nüve adı, tam parça tanımı değildir. Örneğin TDK’nın ETD39 belgelerinde aynı geometri için farklı malzemeler ve hava aralığı seçenekleri yer alır. Bu, genel bir seçim ilkesini gösterir: boyutların benzemesi elektriksel eşdeğerlik anlamına gelmez. TDK verileri, benzer isimli başka üretici ürünlerine otomatik olarak uygulanamaz. [3]

Veri sayfasında malzeme sınıfını, AL değerini, toleransı ve hava aralığını birlikte okuyun. Özellikle mevcut bir parçaya alternatif aranıyorsa eski parçanın üreticisi ve tam numarası yararlı bir başlangıçtır.

## 3. AL değeri ne anlatır?

AL, belirli koşullar altında sarım sayısı ile endüktans arasındaki ilişkiyi ifade eden nüve/takım parametresidir. Küçük işaret yaklaşımında **L = AL × N²** ilişkisi kullanılabilir. AL birimi nH/sarım² ise sonuç nH olur. Ancak bu hesap tek başına doyum, sıcaklık veya kayıp kontrolü değildir. [1]

Yalnızca kavramı göstermek için, AL değerinin 100 nH/sarım² olduğu varsayımsal bir takımda 20 sarım yaklaşık 40 µH verir. Bu sayı bir Artek ürününün özelliği veya önerilen çalışma değeri değildir. Gerçek parçanın test koşulları ve çalışma akımındaki davranışı ayrıca değerlendirilir.

## 4. Hava aralığı ne zaman önem kazanır?

Enerji depolayan tasarımlarda hava aralığı, hedef endüktans ve akım gereksinimiyle birlikte belirlenir. Aralık eklemek yalnızca “doymayı önleyen genel bir işlem” gibi düşünülmemelidir; endüktans ve alan dağılımı da değişir. Kullanılacak takımın boşluk düzeni ve üretici verileri esas alınmalıdır. [1][2]

Siparişte yalnızca “hava aralıklı” demek yerine mümkünse hedef AL, tolerans ve takım bilgisi paylaşılmalıdır. Tasarım hesabı yapılmamışsa bilinmeyen değerleri tahmin etmek yerine teknik değerlendirme talep etmek daha uygundur.

## 5. Karkas ve eş parçaları baştan kontrol edin

Nüvenin uygun olması, bütün montajın uygun olduğu anlamına gelmez. Karkasın sarım penceresi, pin düzeni, yatay/dikey montajı ve PCB ile ilişkisi ayrı kontrol edilmelidir. Klips veya sabitleme elemanı gerekiyorsa bunlar da talebe eklenmelidir. Nüve ve aksesuarların ayrı tanımlanması üretici belgelerinde de görülebilir. [3]

Satış birimini de netleştirin: bir yarım nüve, iki yarımdan oluşan çift ve karkas/klips içeren takım aynı şey değildir. Teknik değerlerin yarım nüveye mi, monte edilmiş nüve takımına mı ait olduğunu kontrol edin.

## Mevcut ETD nüveye muadil ararken

Önce mevcut parçanın fotoğrafını, okunabilen işaretlerini ve çizimini toplayın. Ardından üretici/model, malzeme, ölçü, hava aralığı, AL/tolerans ve montaj parçalarını karşılaştırın. Sarımlar korunacaksa bu durum da özellikle belirtilmelidir.

Aynı boyutta bir aday bulunması incelemeyi başlatır; incelemeyi bitirmez. Özellikle farklı markalar arasında seçim yapılırken malzeme adlarının veya çevrimiçi karşılaştırma tablolarının tek başına yeterli olduğu varsayılmamalıdır.

## Artek’e ETD nüve talebi nasıl iletilir?

Yeni tasarımda elektriksel gereksinimleri; parça değişiminde ise mevcut parçanın kimliğini öne çıkarın. İstenen adedi, yarım/çift/takım ihtiyacını ve karkas gereksinimini ekleyin. [ETD ürünlerini inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=ETD) veya çizim ve uygulama bilgilerinizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### ETD29 yerine ETD39 kullanabilir miyim?

Boyut, sarım ve montaj koşulları değişebileceği için doğrudan değişim kabul edilmemelidir. Yeni nüve, karkas ve elektriksel tasarım birlikte kontrol edilmelidir. [2][3]

### CF139 yazan her ürün aynı veri sayfasıyla değerlendirilebilir mi?

Malzeme adının hangi üreticiye ait olduğu ve tedarik edilen parçanın gerçekten o malzemeyi kullandığı doğrulanmalıdır. Etikette benzer bir ad bulunması, üretici verilerinin otomatik aktarılması için yeterli değildir.

## Teknik kaynaklar

- [1] [Texas Instruments: Bobin ve flyback transformatörü tasarımı](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [2] [Coilcraft: Anahtarlamalı güç transformatörlerinde sistematik tasarım](https://www.coilcraft.com/en-us/resources/application-notes/structured-design-of-switching-power-transformers/).
- [3] [TDK: ETD39/20/13 nüve ve aksesuarları](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
