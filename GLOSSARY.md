# Artek Operasyon

Artek's internal system for stock, custom transformer manufacturing, sales and customer follow-up. It is the single record of what Artek owns and where; public websites only read from it.

## Places and channels

**Lokasyon** (Location):
A place where stock sits. Today: Çekmeköy İmalathane (usable for production), Karaköy Mağaza (usable for sale) and Yedek (kept back; released by Transfer).
_Avoid_: Depo, ana depo, mağaza (on its own)

**Raf kodu** (Shelf code):
A label telling people where a product sits inside a Lokasyon. It helps finding and counting; stock is never tracked per shelf.

**Satış kanalı** (Sales channel):
How a Sipariş reached Artek: internet, phone or in person. A channel never holds stock of its own.
_Avoid_: Using a channel as a place or a stock pile

**Vitrin** (Storefront):
A public website that shows the products Artek offers, without quantities or stock codes. ferritnuve.com is a Vitrin.
_Avoid_: E-ticaret sitesi (unless it actually takes orders)

## Products

**Ürün** (Product):
Anything Artek tracks in stock, identified by a unique product code and counted in a single unit.

**Ticari mal** (Trade goods):
A product bought and resold as-is, such as ferrite cores, toroids and filters.
_Avoid_: Mağaza ürünü

**Malzeme** (Material):
A product consumed when building an Özel trafo. A product can be both Malzeme and Ticari mal.
_Avoid_: Hammadde stoğu as a separate pile

**Özel trafo** (Custom transformer):
A transformer Artek manufactures to a specific customer's request.

**Reçete** (Bill of materials):
The Malzeme one unit of an Ürün is built from. It is saved from the last confirmed Fatura that built the Ürün, and pre-fills the next one.

**Seri numarası** (Serial number):
The identity of one manufactured transformer unit; every unit gets its own, even within a batch. Ticari mal never has one.

## Stock

**Stok** (Stock):
The quantity of a product at a Lokasyon. There is one pile per product per Lokasyon; what it is for is decided by the product and by Rezervasyon, not by splitting the pile.
_Avoid_: Stok amacı, üretim stoğu, satış stoğu

**Rezervasyon** (Reservation):
A quantity of Stok held for a specific Sipariş or Üretim emri. Reserved stock is still physically present but not available to anyone else.

**Kritik seviye** (Minimum level):
The quantity per product, set by the engineer, below which the system warns. It never blocks anything.
_Avoid_: Güvence stoğu, emniyet stoğu

**Stok hareketi** (Stock movement):
A recorded change in stock with product, quantity, place, user, time and reason. Balances come only from movements.
_Avoid_: Changing a balance without a movement

**Stok düzenleme** (Stock correction):
An admin setting a wrongly entered balance to the right number at once. It posts a Stok hareketi for the difference, so the change stays on record.

**İşlem geçmişi** (Activity history):
Who did what and when across the whole system, for admins: Ürün, Fiyat, Stok hareketi, Fatura, Gider, Müşteri, Aday and Kullanıcı. Fiyat, Fatura and Gider rows need the Finans paneli, Müşteri and Aday rows the Müşteri paneli. Admins get it as a daily email and a Monday summary.

**Transfer**:
Moving stock between two Lokasyon in two steps, sent and received; while on the way it belongs to neither.

**Sayım** (Stock count):
A physical count of products at a Lokasyon; each counted line is compared with the balance at the moment it was counted, and approved differences become Stok hareketi.

**Açılış sayımı** (Opening count):
The first Sayım that establishes starting balances when the system goes live.

**Stok girişi** (Stock entry):
The screen where counted stock is typed per product, side by side for every Lokasyon. Until a Lokasyon is open it fills its Açılış sayımı; after that, approved quantities add to the balance. Goods bought from a supplier go through Mal kabul instead.

**Alış fiyatı / Satış fiyatı** (Purchase / sale price):
The current price per unit of an Ürün, each in TL, USD or EUR. Only the Finans paneli sees them.

**Brüt kâr** (Gross profit):
Confirmed sales minus what the sold Ürünler cost: each line at its Ürün's Alış fiyatı (converted at the TCMB rate of the invoice date), or for an Özel trafo built from Malzeme, at those materials' prices. A line with no Ürün or no Alış fiyatı has no cost; it is shown apart and left out, never counted as free.

**Net** (Monthly result):
A month's Brüt kâr minus its Giderler, KDV hariç: sales by invoice date, expenses by their date. A month with sales of unknown cost is marked as incomplete.

**Stok değeri** (Stock value):
Stok times a price, converted to TL at today's TCMB döviz satış rate. It is worked out when shown, never stored. Products with no price are left out and counted.

## Sales and manufacturing

**Sipariş** (Order):
What a customer orders from Artek, from either business: Ticari mal from stock or an Özel trafo to be built.
_Avoid_: Satış (for the order itself)

**Üretim emri** (Production order):
The shop-floor job that builds an Özel trafo. Each Özel trafo line on a Sipariş creates one Üretim emri.
_Avoid_: İş, proje, PRJ

## Invoices and customers

**Fatura** (Sales invoice):
A sales invoice Artek issued in QNB Dijital Köprü, uploaded here as a PDF and identified by its ETTN. This app reads invoices; it never issues or changes them. An upload is a taslak until a person confirms its Müşteri and Ürün lines; only a confirmed Fatura counts in Finans and takes its lines from Stok. A line of an Özel trafo takes its Malzeme out as üretim tüketimi instead. An İade fatura puts its lines back into Stok and is not counted as a sale. A Fatura can be typed by hand before its PDF exists; it can be confirmed only once the PDF with the same number is uploaded.
_Avoid_: Using Fatura for a supplier's invoice on a Mal kabul

**Gider** (Expense):
Money Artek pays out: kira, maaş, SGK, vergi, a supplier's invoice and the like, with its date, category and amount KDV hariç and dahil, optionally with its receipt. A Gider can repeat every month (kira, maaş, SGK), until an end date or until stopped; each month's entry is its own Gider and can be changed alone. Only the Finans paneli sees Giderler.
_Avoid_: Masraf (for the same thing), Fatura (a Fatura is a sale)

**Müşteri** (Customer):
A buyer on Artek's sales invoices, identified by the VKN (company) or TCKN (şahıs firması) printed on them.
_Avoid_: Cari (accounting term), firma (when it's a customer specifically)

**Öncelik** (Follow-up priority):
Which group a Müşteri falls in for follow-up, worked out from its invoices: Geri kazan, Tekrar getir, Büyüt, Takipte tut or Sonra. It is computed, never typed in.

**Takip** (Follow-up):
The next date someone should contact a Müşteri. On that day the Müşteri appears in the admins' daily email.

**Panel** (Private panel):
One of the owner's private screens, granted per user by name: the Müşteri paneli (customers and follow-up) and the Finans paneli (sales and invoices). Only admins can hold one, and holding the admin role does not open either.
