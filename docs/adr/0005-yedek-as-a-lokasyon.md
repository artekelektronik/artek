# Stock kept back is its own Lokasyon, Yedek

The owner needs to see, per product, how much is usable for transformer production, how much is for sale, and how much is kept back as spare. ADR 0003 keeps one pile per product per Lokasyon and rejects stock purposes, and it stays: production and sale are told apart by Lokasyon (Çekmeköy İmalathane, Karaköy Mağaza), and we add a third Lokasyon, Yedek, for what is kept back. Yedek stock can't be sold or used by accident; it comes back into use through a Transfer, so every release is on record.

## Consequences

Yedek reuses counts, transfers, permissions and the overview with no new stock logic. It does stretch "physical place" when spare stock shares a room with other stock. Kritik seviye compares the company total, which includes Yedek.
