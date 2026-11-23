# Toroid nüve renkleri ne anlama gelir? Renk kodu malzemeyi gösterir mi?

Toroid nüve renkleri, demir tozu nüvelerde üreticinin malzeme karışımını göstermek için kullandığı boya kodudur; ferrit toroidlerde ise renk yalnızca yalıtım kaplamasının rengidir ve malzemeyi göstermez. Örneğin Micrometals kendi -26 karışımını sarı/beyaz, -52 karışımını yeşil/mavi boyar. Bu kod üreticinin kendi düzenidir; rengi bilinen bir nüvenin malzemesi ancak veri sayfası ve ölçümle doğrulanır.

## Demir tozu toroidlerde renk kodu nasıl çalışır?

Micrometals, standart toroid nüvelerini koruyucu bir kaplamayla verdiğini, büyük nüvelerin iki renkli epoksi ile kaplandığını ve renklerin malzemeyi tanımlamak için kullanıldığını belirtir. Dış çapı 5,1 mm ve altındaki toroidler ise genellikle vakum altında Parylene C ile kaplanır. [1]

Renk, parçanın veri sayfasında da yazar: Micrometals T106-26 veri sayfasında kaplama “sarı/beyaz epoksi boya”, T106-52 veri sayfasında “yeşil/mavi epoksi boya” olarak geçer. [2][3] Kaplama yalıtım da sağlar; Micrometals tüm kaplamaları için 60 Hz'de en az 500 Vrms dielektrik dayanım verir. [1]

## Micrometals renk kodu tablosu: hangi karışım hangi renk?

Micrometals'in güç dönüşümü için listelediği [demir tozu](https://www.ferritnuve.com/sozluk#demir-tozu-nuve) karışımlarının toroid renk kodları şunlardır: [4]

- -2 kırmızı/şeffaf, -8 sarı/kırmızı, -14 siyah/kırmızı.
- -18 yeşil/kırmızı, -19 kırmızı/yeşil.
- **-26 sarı/beyaz**, **-52 yeşil/mavi**.
- -30 yeşil/gri, -34 gri/mavi, -35 sarı/gri.
- -38 gri/siyah, -40 yeşil/sarı, -45 siyah/siyah.

RF için listelenen karbonil demir karışımlarında ikinci renk çoğunlukla “şeffaf”tır: [5]

- -1 mavi/şeffaf, -2 kırmızı/şeffaf, -3 gri/şeffaf, -5 yeşil/şeffaf.
- -6 sarı/şeffaf, -7 beyaz/şeffaf, -10 siyah/şeffaf.
- -8 sarı/kırmızı, -15 kırmızı/beyaz, -17 mavi/sarı.

Bu liste yalnızca Micrometals'in kendi parçaları için geçerlidir.

## Renk kodu neden tek başına kanıt sayılmaz?

Renk bir boyadır ve her üretici kendi düzenini kullanır. Magnetics, toz nüve toroidlerini malzeme ailesine göre tek renkle kaplar: MPP gri, Kool Mµ siyah, High Flux haki, XFLUX kahverengi, AmoFlux mavi. [6] TDK ise ferrit toroidlerinin epoksi kaplamasını mavi olarak verir. [7] Yani mavi bir toroid, üreticisine göre bir toz nüve de bir ferrit de olabilir.

Bu nedenle üreticisi bilinmeyen sarı/beyaz bir toroidin Micrometals -26 ile aynı özellikleri taşıdığı renkten çıkarılamaz. Artek kataloğunda adı -26 veya -52 ile biten demir tozu toroidler (örneğin T 106 - 26 ve T 106 - 52) bulunur. Katalog bu parçaların üreticisini belirtmez; addaki ek yaygın kullanılan bir düzeni izler, malzeme ise talep sırasında parçanın kendi veri sayfasından doğrulanmalıdır.

## Ferrit toroidlerde renk ne anlama gelir?

Ferrit toroidde renk bir malzeme kodu değildir. TDK'ya göre kaplama kenarları korur ve yalıtım sağlar; orta ve büyük boylarda epoksi (mavi), küçük boylarda parylene (şeffaf) kullanılır ve epoksi için en düşük delinme gerilimi boya göre 1,0 kV ile 2,0 kV'un üzerindedir. [7]

Aynı kaplama çok farklı malzemelerin üzerinde bulunur. TDK'nın epoksi kaplı R 25,3 × 14,8 × 10,0 toroidi yedi ayrı malzemede listelenir: N87'de AL 2360 nH, T38'de 10700 nH'dir. [8] Magnetics de ferrit toroid sipariş kodunda kaplamayı (0 kaplamasız, Y parylene, Z epoksi) ve ferrit malzemesini ayrı karakterlerle belirtir. [9]

Artek kataloğundaki T 25 / 15 / 10 - CF199 ferrit toroid fotoğrafta yeşil kaplamayla görünür; malzemeyi gösteren renk değil, CF199 kodudur. Kodlar için [CF ferrit malzeme kodları rehberine](https://www.ferritnuve.com/blog/cf-ferrit-malzeme-kodlari) bakın.

## Bilinmeyen bir toroid nüve nasıl tanınır?

- **Ölçün:** dış çap, iç çap ve yükseklik. Kaplama ölçüyü büyütür; Micrometals T106-26 için kaplamasız nominal dış çapı 26,92 mm, kaplamalı en büyük dış çapı 27,43 mm verir. [2]
- **Sarın ve ölçün:** bilinen sayıda tur sarıp endüktansı ölçün. [AL değeri](https://www.ferritnuve.com/sozluk#al-degeri) AL = L / N² ile bulunur. [10] Örneğin 20 turda 37 µH ölçülürse AL yaklaşık 92,5 nH olur.
- **Karşılaştırın:** aynı ölçüdeki nüvelerin veri sayfalarındaki AL değerlerine bakın.

Yöntemin sınırları vardır:

- **Tolerans:** Micrometals T106-26 için AL toleransı ±%10'dur ve değer 100 turla 10 kHz'de ölçülür. [2] TDK'nın ferrit toroidinde tolerans ±%25 veya ±%30'dur. [8]
- **Ölçüm koşulu:** TDK başlangıç geçirgenliğini 0,25 mT'nin altındaki akı yoğunluğunda ve 25 °C'de tanımlar. [10] Farklı koşulda ölçülen değer veri sayfasıyla birebir örtüşmeyebilir.
- **Kaplama ve yaşlanma:** TDK, kaplamanın geçirgenliği nüve boyuna bağlı olarak düşürdüğünü belirtir. [7] Micrometals, demir tozu nüvelerin yüksek sıcaklıkta endüktansının kalıcı olarak azaldığını bildirir. [1]
- **AL değeri kaybı göstermez:** Micrometals T106-26 için 93 nH/N², T106-52 için 95 nH/N² verir. [2][3] Bu iki karışım endüktans ölçümüyle ayırt edilemez.

## Malzeme farkı devrede neyi değiştirir?

Micrometals'in tablosunda -2 karışımının referans geçirgenliği 10, -26 ve -52 karışımlarının 75'tir. 50 Oe DC alanda -2 başlangıç geçirgenliğinin %99'unu, -52 %62'sini, -26 %55'ini korur. [4]

[Nüve kaybı](https://www.ferritnuve.com/sozluk#nuve-kaybi) da değişir: 100 kHz ve 140 G (14 mT) koşulunda T106-26 için nominal kayıp 83 mW/cm³, T106-52 için 58 mW/cm³'tür. [2][3] Micrometals -52'yi, -26 ile aynı geçirgenlikte ve yüksek frekansta daha düşük kayıplı olarak tanımlar. [4] Ayrıntı için [-26 ve -52 toroid karşılaştırmasına](https://www.ferritnuve.com/blog/26-52-toroid-karsilastirmasi), ferrit ile demir tozu arasındaki seçim için [ferrit ve demir tozu toroid rehberine](https://www.ferritnuve.com/blog/ferrit-demir-tozu-toroid) ve [ferrit toroid nüve seçimi rehberine](https://www.ferritnuve.com/blog/ferrit-toroid-nuve-secimi) bakın.

## Artek’e renkli bir toroid nüve sorarken

- Nüvenin fotoğrafı, renkleri ve okunabilen işaretleri.
- Dış çap, iç çap ve yükseklik.
- Ölçtüyseniz tur sayısı, endüktans ve ölçüm frekansı.
- Uygulama, çalışma frekansı, akım ve varsa DC bileşen.
- İstenen adet.

Katalogdaki [ferrit ve demir tozu nüveleri inceleyebilir](https://www.ferritnuve.com/products?categories=Ferrit,IRON-POWDER) veya bu bilgilerle [Artek’e talep gönderebilirsiniz](https://www.ferritnuve.com/contact).

## Sık sorulan sorular

### Sarı beyaz toroid nüve hangi malzemedir?

Micrometals kendi -26 demir tozu karışımını sarı/beyaz renk koduyla boyar. [4] Üreticisi bilinmeyen sarı/beyaz bir nüvenin aynı malzeme olduğu renkten anlaşılamaz; parçanın kendi veri sayfası ve ölçüm gerekir.

### Yeşil ferrit toroid ile mavi ferrit toroid arasında fark var mı?

Renk bunu söylemez. Ferrit toroidde renk kaplamanın rengidir; TDK epoksi kaplamasını mavi, parylene kaplamasını şeffaf olarak verir ve aynı kaplamalı toroidi geçirgenliği çok farklı malzemelerde sunar. [7][8]

### Toroid nüvenin AL değeri nasıl ölçülür?

Nüveye bilinen sayıda tur sarılır, endüktans ölçülür ve AL = L / N² ile hesaplanır. [10] Sonuç veri sayfasındaki toleransla birlikte değerlendirilmelidir; Micrometals T106-26 için bu tolerans ±%10'dur. [2]

## Teknik kaynaklar

- [1] [Micrometals: Kaplama rehberi (Coating Guide)](https://www.micrometals.com/products/coating-guide/).
- [2] [Micrometals: T106-26 veri sayfası](https://datasheets.micrometals.com/T106-26-DataSheet.pdf).
- [3] [Micrometals: T106-52 veri sayfası](https://datasheets.micrometals.com/T106-52-DataSheet.pdf).
- [4] [Micrometals: Güç dönüşümü (PC) demir tozu malzemeleri](https://www.micrometals.com/products/materials/pc/).
- [5] [Micrometals: RF demir tozu malzemeleri](https://www.micrometals.com/products/materials/rf/).
- [6] [Magnetics: Manyetik nüvelerle yüksek sıcaklıkta tasarım (CG-06)](https://www.mag-inc.com/Media/Magnetics/File-Library/Product%20Literature/General%20Information/CG-06.pdf?ext=.pdf).
- [7] [TDK: Toroidler (halka nüveler), genel bilgiler](https://www.tdk-electronics.tdk.com/download/531586/73928c3d18a19eefb58bf397e6c83a42/pdf-toroids-general-information.pdf).
- [8] [TDK: R 25.3 × 14.8 × 10.0 toroid verileri](https://www.tdk-electronics.tdk.com/inf/80/db/fer/r_25_3_14_8_10_0.pdf).
- [9] [Magnetics: Ferrit nüveler kataloğu 2022](https://www.mag-inc.com/Media/Magnetics/File-Library/Product%20Literature/Ferrite%20Literature/Magnetics-2022-Ferrite-Catalog.pdf).
- [10] [TDK: Ferritler, genel tanımlar](https://www.tdk-electronics.tdk.com/download/187036/dbcde584d155cc270f5d5dbf1efec233/pdf-generaldefinitions.pdf).
