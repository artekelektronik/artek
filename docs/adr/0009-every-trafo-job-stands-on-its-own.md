# Every trafo job stands on its own, and can be corrected afterwards

ADR 0007 kept one Reçete per Ürün, overwritten by each confirmed Fatura, and a confirmed Fatura could not be changed. In use this was too rigid: customers ask for something different each time, the same trafo code is built with different materials and sizes, and what was really used (copper, hours) is often known only after the invoice is confirmed.

- The record is the job, not the model. A Fatura line built from Malzeme keeps its own materials and its own hours; a Fiyat çalışması keeps its own materials, minutes and price. The Ürün's Reçete and usual minutes are only where the next job starts from.
- İşçilik is time × Saat ücreti, one company-wide number. A line's typed hours win; otherwise the Ürün's usual minutes per unit. A flat TL per unit saved before this still counts until minutes replace it.
- A confirmed sale's built lines can be corrected (Malzemeleri düzelt). Only the difference moves Stok: movements that still match a listed material are kept, the others are reversed, and what is missing is posted in a new document remembered on the invoice (`correction_document_ids`).

## Consequences

- A corrected material's movement carries the time of the correction, not of the sale. Movements that did not change keep their date, which is why the whole document is not reversed and reposted.
- Costs use today's Alış fiyatı and Saat ücreti, so changing either changes the kâr shown for past sales too.
- Deleting a Fatura reverses its correction documents as well.
