# A sale can start as a proforma, and payments are recorded per sale

Goods often leave, and are paid for, before the e-invoice exists; some sales never get one. Finance needs to see what is still owed, what is invoiced and paid, and what was paid without an invoice.

- A **Proforma** is a Fatura row with scenario `PROFORMA` and a number of its own (`PRF-2026-0001`). It is typed like a manual invoice and, unlike one, can be confirmed without a PDF: confirming means it was delivered, so it takes its stock then.
- When the real e-Fatura is uploaded, it is attached to its proforma: the proforma takes the PDF's number, ETTN, date, file and totals, and keeps its lines, stock and payments. The uploaded copy is removed, so the sale is counted once and its stock moves once. The KDV-hariç totals must match, because the proforma's lines stay.
- A proforma that is never invoiced stays a sale: confirmed proformas count in Satış, Brüt kâr and Net like any confirmed Fatura, and Finans shows how much of Satış they are.
- A **Tahsilat** (payment) is recorded against one sale: date, amount, method (Nakit, Havale/EFT, Kredi kartı, Çek/Senet) and a note. A sale is paid when its payments reach its KDV-dahil total. There is no customer running account (cari hesap).
- Sales dated before payment tracking began (1 Kasım 2026) count as paid unless payments are recorded on them.

## Consequences

- Each sale is in exactly one of three lists: Beklenen ödemeler (not fully paid), faturalı ve ödenmiş, faturasız ve ödenmiş.
- An e-Fatura whose totals differ from its proforma can't be attached; the proforma is fixed or deleted first.
- Overpaying a sale is refused; a payment entered by mistake is deleted, not reversed.
