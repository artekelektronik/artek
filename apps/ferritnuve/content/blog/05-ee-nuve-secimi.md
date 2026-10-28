# EE ferrit nüve nasıl seçilir? EE25 ve EE42 için muadil kontrolü

EE nüveye muadil ararken dış ölçüyle birlikte malzeme, hava aralığı, AL değeri ve montaj uyumu kontrol edilmelidir. EE25 veya EE42 adı adayları daraltır; mevcut sarımla aynı elektriksel ve ısıl davranışı sağlayacağını tek başına göstermez.

## Önce değiştirilecek parçayı tanımlayın

Yeni bir trafo tasarlamak ile mevcut trafonun nüvesini değiştirmek farklı başlangıç noktalarıdır. Muadil arayışında ilk amaç, eski parçanın hangi özelliklerinin korunması gerektiğini belirlemektir. Üzerindeki işaretleri, iki yarımın fotoğrafını ve varsa üretici parça numarasını kaydedin. Fotoğrafı bir cetvelle destekleyin; yalnızca görüntüden kesin ölçü çıkarmayın.

Talepte nüvenin tek başına mı, karkasla birlikte mi değişeceğini belirtin. Mevcut sargı ve PCB korunacaksa mekanik uyum özellikle önem kazanır. Yeni tasarımda ise nüve seçimine geçmeden giriş/çıkış koşullarını, topolojiyi ve frekansı tanımlayın.

## 1. EE25 ve EE42 adlarını tam ölçüyle tamamlayın

Kısa aile adı yerine tam ürün tanımını kullanın. Artek kataloğundaki EE 42 / 21 / 15 ile EE 42 / 21 / 20 ayrı kayıtlardır. İkisini yalnızca “EE42” olarak istemek, hangi geometrinin gerektiğini belirsiz bırakır.

Üretici çiziminde dış boyutları, orta bacak kesitini ve sarım penceresini karşılaştırın. TDK'nın E25/13/7 ve E42/21/15 belgeleri geometrinin yanında etkin manyetik parametreleri de ayrı verir. Bu belgeler kontrol yöntemini örnekler; benzer isimli Artek ürününün aynı üreticiye veya özelliklere sahip olduğunu kanıtlamaz. [1][2]

## 2. Malzeme adını üreticisiyle birlikte okuyun

Geometriyi eşleştirdikten sonra malzeme sınıfını doğrulayın. TDK'nın E25 belgesinde aynı biçim için farklı malzeme seçenekleri bulunur. Kayıp değerleri de belirtilmiş frekans, akı yoğunluğu ve sıcaklık koşullarına bağlıdır. [1]

Bu nedenle “CF139 yerine N87 olur mu?” sorusunu yalnızca bir isim karşılaştırmasıyla cevaplamayın. Gerçek parçaların veri sayfalarını ve çalışma koşullarını birlikte değerlendirin. Belirsiz bir malzemeye başka markanın kayıp eğrisini atamayın.

## 3. AL ve hava aralığını takım düzeyinde karşılaştırın

AL değerinin hangi nüve takımına ve hangi test koşullarına ait olduğunu kontrol edin. Bir yarımın aralıklı, diğerinin aralıksız olduğu düzen ile iki aralıklı yarım aynı takım tanımı değildir. TDK'nın E42 belgesinde AL değerlerinin uygulanacağı yarım kombinasyonu açıkça belirtilir. [2]

Siparişte biliniyorsa hedef AL, tolerans ve hava aralığı düzenini birlikte paylaşın. Yalnızca “hava aralıklı EE42” demek yeterli bir parça tanımı oluşturmaz. Mevcut sarım korunacaksa yeni takımın endüktansı ve uygulamadaki davranışı ayrıca kontrol edilmelidir.

## 4. Karkas, pinler ve sabitlemeyi kontrol edin

Nüvenin karkasa girmesi, bütün montajın uygun olduğunu göstermez. Aşağıdaki noktaları çizim veya numune üzerinden karşılaştırın:

- Karkasın iç açıklığı, sarım alanı ve toplam montaj yüksekliği.
- Yatay veya dikey yerleşim, pin aralığı ve PCB delik düzeni.
- Klips, bant veya diğer sabitleme elemanları için gereken boşluk.
- Sargı ve izolasyon yapısının mevcut hacme uyumu.
- İstenen satış biriminin tek yarım, çift veya aksesuar içeren takım olması.

Karkas ve aksesuarlar gerekiyorsa bunları ayrıca belirtin; nüve adı üzerinden pakete dahil olduklarını varsaymayın.

## 5. Muadili uygulamada doğrulayın

İlk ölçümde benzer endüktans görmek yararlı olsa da tek kabul ölçütü değildir. Çalışma akımı, kayıplar ve sıcaklık artışı da değerlendirilmelidir. Manyetik tasarımda doyum ve ısıl sınırlar ayrı kontrollerdir. [3]

Örneğin eski trafoda sarımlar korunacaksa, aday takım önce çizim ve malzeme belgeleriyle incelenir. Ardından tanımlanmış çalışma koşullarında elektriksel ve ısıl doğrulama yapılır. Sonuç alınmadan parçaya “doğrudan muadil” denmemelidir.

## Artek’e EE nüve talebi gönderirken

Tam ölçü, mevcut üretici/model, okunabilen malzeme işareti, AL ve hava aralığı bilgisi, karkas ihtiyacı ve adedi tek mesajda toplayın. Bilmediğiniz alanları tahmin etmek yerine bilinmiyor olarak belirtin. [EE nüveleri katalogda inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit&productTypes=EE) ve fotoğraf veya çiziminizle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### EE25 kaç watt için uygundur?

Boyut tek başına sabit güç değeri vermez. Topoloji, frekans, malzeme, sargı düzeni ve izin verilen sıcaklık artışı birlikte değerlendirilir. [3]

### Aynı ölçü ve aynı AL, tam muadil demek mi?

Hayır. Malzeme kayıpları, toleranslar, hava aralığı düzeni ve mekanik uyum da kontrol edilmelidir. İki verinin eşleşmesi incelemenin yalnızca bir bölümünü tamamlar.

## Teknik kaynaklar

- [1] [TDK: E25/13/7 nüve ve aksesuarları](https://www.tdk-electronics.tdk.com/inf/80/db/fer/e_25_13_7.pdf).
- [2] [TDK: E42/21/15 nüve verileri ve takım tanımı](https://www.tdk-electronics.tdk.com/inf/80/db/fer/e_42_21_15.pdf).
- [3] [Texas Instruments: Bobin ve flyback transformatörü tasarımı](https://www.ti.com/lit/ml/slup127/slup127.pdf).
