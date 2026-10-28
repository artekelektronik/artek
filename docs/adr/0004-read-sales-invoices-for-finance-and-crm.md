# Read sales invoices into the stok app for finance and the CRM

The plan left e-invoicing out of scope, and Artek keeps issuing invoices in QNB Dijital Köprü. Before Phase 3, the owner wanted a finance dashboard and a customer follow-up list built from the invoices Artek has already issued. We read the invoice PDFs Artek downloads from Dijital Köprü into the stok app, identified by their ETTN. We don't build invoicing, and we don't connect to an accounting system. Customers are created from those invoices, keyed by VKN/TCKN, and Phase 3's CRM builds on them instead of starting a separate customer list. Invoices, customers and notes live in two private panels, Müşteri and Finans. Each panel is granted per user, at view or edit level, and only to admins. The admin role alone opens neither panel, and taking the role away closes both.

## Consequences

- Invoices arrive by upload. Automatic intake from Dijital Köprü is a later step, and whatever form it takes, it must use the same ETTN-based import so repeats stay harmless.
- Only the PDF's text is kept, not the PDF itself. A better parser can re-read old invoices, but the original file has to come from Dijital Köprü.
- The public repo holds the code only. Invoice and customer data live in the production database, and parser tests use made-up invoices.
- The morning assistant drafts customer emails, but a person sends each one. Turning on automatic sending is a separate decision, to be made after the drafts have been reviewed for a few weeks.
