# Invoice lines can be built from materials; invoices can be typed by hand and deleted

Using the review flow from ADR 0006 on real invoices showed three gaps. An Özel trafo line ("BAKIR SARGILI TRAFO") isn't sold out of stock: its Malzeme are used up. Goods sometimes leave before the e-invoice is issued. And a wrongly uploaded invoice needs to go away completely.

- A line can be taken from stock, built from materials, or leave stock alone. A line built from materials posts üretim tüketimi from a materials Lokasyon (default Çekmeköy İmalathane) in the same stock document as the sales. Confirming saves the materials per unit as the Ürün's Reçete, and the next invoice for that Ürün starts with them.
- A line whose description carries our own code, e.g. `(ART-0092)`, is matched to that Ürün outright.
- Quantity and unit price can be edited on a draft. Edited lines are recomputed, and the invoice's KDV-hariç total becomes their sum; the KDV-included total keeps its ratio.
- A Fatura can be typed by hand. It is a draft that can't be confirmed. Uploading the PDF with the same number fills it from the PDF and keeps the Ürün picked for each line.
- A Fatura can be deleted, not only archived. Any stock it moved is reversed as a ters kayıt in the same transaction; the İşlem geçmişi keeps a "silindi" entry.

## Consequences

- Deleting is final: the lines and PDF go too. Archiving stays for invoices that should be kept but not counted.
- A manual invoice's number is reserved: uploading a different PDF with that number joins it, so typing the number carefully matters.
- The Reçete is overwritten by each confirmation. There is no separate screen to edit it yet.
