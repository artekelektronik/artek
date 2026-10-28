import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { InvoiceParseError, parseInvoiceText, productGroup, productName } from "./invoice-parse";

// A made-up invoice in the layout QNB Dijital Köprü prints; no real customer.
const invoice = `Mal Hizmet Toplam Tutarı: 39.000,00 TL
Vergi Hariç Tutar: 39.000,00 TL
Hesaplanan KDV (%20) : 7.800,00 TL
Vergiler Dahil Toplam Tutar: 46.800,00 TL
Ödenecek Tutar: 46.800,00 TL
ARTEK ELEKTRONİK SAN VE TİC.LTD.ŞTİ.
Vergi Dairesi: BEYOĞLU
VKN: 0000000000
SAYIN
ÖRNEK ELEKTRONİK SANAYİ VE TİCARET LİMİTED ŞİRKETİ DENEME ÇARŞISI
DENEME MAH. ÖRNEK SOK.
NO:1 ÜMRANİYE/ İSTANBUL
Vergi Dairesi: ÜMRANİYE
VKN: 1234567890
ETTN: AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE
e-Fatura
Tarih: 07-04-2025
Fatura No: AAA2025000000123
Senaryo: TEMELFATURA
Fatura Tipi: SATIS
Sıra
No Mal Hizmet Miktar Birim
Fiyat
Mal Hizmet
Tutarı
KDV
Oranı KDV Tutarı
1 BAKIR SARGILI TRAFO(EE25) 25
Adet 800 TL 20.000,00 TL %20,00 4.000,00
TL
2 FERİT NÜVE(6 MM) 6 40,0 Adet 29,6875 TL 19.000,00 TL %20,00 3.800,00
TL
QNB FİNANSBANK KARAKÖY ŞUBE İBAN :TR 00 0000 TL
* İRSALİYE YERİNE GEÇERLİDİR.`;

describe("parseInvoiceText", () => {
  test("reads the header, the buyer and every line", () => {
    const r = parseInvoiceText(invoice);
    assert.equal(r.ettn, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(r.number, "AAA2025000000123");
    assert.equal(r.issuedOn, "2025-04-07");
    assert.equal(r.scenario, "TEMELFATURA");
    assert.equal(r.type, "SATIS");
    assert.equal(r.netAmount, 39000);
    assert.equal(r.totalAmount, 46800);
    assert.deepEqual(r.buyer, {
      name: "ÖRNEK ELEKTRONİK SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
      taxId: "1234567890",
      taxIdType: "VKN",
      city: "İSTANBUL",
      district: "ÜMRANİYE",
      email: null,
    });
    assert.equal(r.lines.length, 2);
    assert.deepEqual(r.lines[0], { description: "BAKIR SARGILI TRAFO(EE25)", quantity: 25, unit: "Adet", unitPrice: 800, amount: 20000 });
    assert.ok(r.linesMatchTotal);
  });

  test("a size that runs into the quantity is split off by amount ÷ price", () => {
    const line = parseInvoiceText(invoice).lines[1];
    assert.equal(line.description, "FERİT NÜVE(6 MM)");
    assert.equal(line.quantity, 640);
  });

  test("a scanned PDF with no text is refused with a reason", () => {
    assert.throws(() => parseInvoiceText("  \n "), InvoiceParseError);
  });

  test("an invoice without an ETTN is refused", () => {
    assert.throws(() => parseInvoiceText(invoice.replace(/ETTN: \S+/, "")), /ETTN/);
  });
});

describe("product names and groups", () => {
  test("spellings of the same core collapse to one name", () => {
    assert.equal(productName("FERİT NÜVE( E25)"), productName("FERRİTNUVE(E25)"));
    assert.equal(productName("BAKIR SARGIL I FİL TRE(3MH)"), "BAKIR SARGILI FİLTRE(3MH)");
  });

  test("lines fall into the product groups the dashboard shows", () => {
    assert.equal(productGroup("BAKIR SARGILI TRAFO(EE25)"), "Özel trafo");
    assert.equal(productGroup("BAKIR SARGILI BOBİN(100UH)"), "Bobin ve filtre");
    assert.equal(productGroup("FERRİTNUVE(ETD59)"), "Ferrit nüve ve toroid");
    assert.equal(productGroup("KARKAS(EE25)"), "Karkas");
    assert.equal(productGroup("BAKIR LİTZ TELİ(1200X0,16M)"), "Tel ve bant");
    assert.equal(productGroup("RELAY 5A 24VDC"), "Diğer komponentler");
  });
});
