# Uploaded invoices are drafts until a person confirms them; confirming takes their stock

ADR 0004 read each uploaded Fatura straight into Finans and the Müşteri list, kept only the PDF's text, and left stock alone. The owner now wants a sale to take its goods out of stock, and wants to see the invoice as a form next to the original before anything is booked. An upload is now a draft (taslak): its Müşteri is set only if the VKN / TCKN is already one, and each line gets a suggested Ürün. A person checks the Müşteri (or adds it as new), matches every line to an Ürün or marks it as not in the catalogue, picks the Lokasyon, and confirms. Confirming, in one transaction, links the Müşteri, posts a Stok hareketi for the lines taken from stock (satış teslimatı; an İade puts them back as satış iadesi) and adds the invoice to Finans, the Müşteri paneli and the morning assistant. The original PDF is kept in the database next to the invoice.

## Consequences

- This replaces ADR 0004's "only the PDF's text is kept" and "an upload counts at once"; the rest of ADR 0004 stands.
- Every invoice uploaded before this went back to taslak, as the owner chose. Until they are confirmed again, Finans totals, Öncelik and the assistant's picks see none of them. Their PDFs were not kept; uploading the same file again attaches it.
- An invoice issued before a Lokasyon's Açılış sayımı was already counted out by it, so the form starts those lines as not taken from stock and says why.
- Stock is checked as for any stock-out: not enough available stock refuses the whole confirmation.
- A confirmed invoice that moved stock can't be archived; its movements are reversed in Hareketler first. Undoing a confirmation is a later step.
