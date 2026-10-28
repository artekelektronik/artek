# Artek Operasyon

Artek's internal system for stock, custom transformer manufacturing, sales and customer follow-up. It is the single record of what Artek owns and where; public websites only read from it.

## Places and channels

**Lokasyon** (Location):
A physical place where stock sits. Today: Çekmeköy İmalathane and Karaköy Mağaza.
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
_Avoid_: Stok düzeltme (as a way to edit balances directly)

**Transfer**:
Moving stock between two Lokasyon in two steps, sent and received; while on the way it belongs to neither.

**Sayım** (Stock count):
A physical count of products at a Lokasyon; each counted line is compared with the balance at the moment it was counted, and approved differences become Stok hareketi.

**Açılış sayımı** (Opening count):
The first Sayım that establishes starting balances when the system goes live.

## Sales and manufacturing

**Sipariş** (Order):
What a customer orders from Artek, from either business: Ticari mal from stock or an Özel trafo to be built.
_Avoid_: Satış (for the order itself)

**Üretim emri** (Production order):
The shop-floor job that builds an Özel trafo. Each Özel trafo line on a Sipariş creates one Üretim emri.
_Avoid_: İş, proje, PRJ

## Invoices and customers

**Fatura** (Sales invoice):
A sales invoice Artek issued in QNB Dijital Köprü, uploaded here as a PDF and identified by its ETTN. This app reads invoices; it never issues or changes them. An İade fatura is stored but not counted as a sale.
_Avoid_: Using Fatura for a supplier's invoice on a Mal kabul

**Müşteri** (Customer):
A buyer on Artek's sales invoices, identified by the VKN (company) or TCKN (şahıs firması) printed on them.
_Avoid_: Cari (accounting term), firma (when it's a customer specifically)

**Öncelik** (Follow-up priority):
Which group a Müşteri falls in for follow-up, worked out from its invoices: Geri kazan, Tekrar getir, Büyüt, Takipte tut or Sonra. It is computed, never typed in.

**Takip** (Follow-up):
The next date someone should contact a Müşteri. On that day the Müşteri appears in the admins' daily email.

**Panel** (Private panel):
One of the owner's private screens, granted per user by name: the Müşteri paneli (customers and follow-up) and the Finans paneli (sales and invoices). Only admins can hold one, and holding the admin role does not open either.
