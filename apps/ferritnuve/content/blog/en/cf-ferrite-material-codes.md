# What do CF139, CF297 and CF199 mean? How to read ferrite core material codes and check an N87 equivalent

CF139, CF297 and CF199 are ferrite material grade codes for which Cosmo Ferrites publishes material specifications. [1][2][3] A code tells you which datasheet to open; it does not describe the part by itself. To read a code, first find out whether the grade is a power material or a high-permeability material, then compare it with another maker's grade, such as TDK N87 or Ferroxcube 3C90, only on values measured under the same conditions.

## Where do ferrite material codes appear?

Material codes appear on drawings, on core datasheets and in catalog names. Cosmo Ferrites describes CF139 as a Mn-Zn ferrite material for low frequency and general-purpose power transformers at frequencies up to 200 kHz, and CF297 as a Mn-Zn material for low loss power applications up to 300 kHz. [1][2] It describes CF199 as a high-permeability Mn-Zn material for broadband transformers and EMI-EMC filters. [3]

Many Artek catalog names end with such a marking, for example EE 25 / 13 / 7 - CF139, ETD 39 / 20 / 13 - CF139, ETD 59 31 / 21.5 - CF297, T 25 / 15 / 10 - CF199, T 63 / 38 / 25 - CF195, T 42 / 26 / 18 - CF197 and UU 101 / 76 / 30 - N87. For choosing the core shape, see the [EE core selection guide](https://www.ferritnuve.com/en/blog/ee-core-selection) and the [ETD core selection guide](https://www.ferritnuve.com/en/blog/etd-core-selection).

## 1. A code belongs to one manufacturer's datasheet

Each maker defines its own grades. Cosmo Ferrites publishes specifications for CF139, TDK publishes N87 as a SIFERRIT material and Ferroxcube publishes 3C90. [1][6][7]

The same letters in a catalog name are a label, not proof of who made the part. The Artek catalog has separate entries named UU 93 / 76 / 30 - CF139 and UU 93 / 76 / 30 EPCOS. Confirm the material of an Artek part in the enquiry from the part's own marking and datasheet, and do not assume a datasheet value from the name alone.

## 2. Power material or high-permeability material?

The two groups are made for different jobs, and the datasheets show it. For the power grades CF139 and CF297, Cosmo Ferrites specifies power loss at 100 kHz and a Curie temperature above 210 °C. [1][2] Cosmo calls CF195 and CF197 medium permeability and CF199 high permeability; for these three it specifies a relative loss factor at 0.25 mT instead of a power loss, and lists broadband transformers and EMI suppression filters as applications. [3][4][5]

Cosmo's own values, with initial permeability at 25 °C, 10 kHz and at most 0.25 mT, are:

- CF139: initial permeability 2100 ±20%; saturation flux density 490 mT at 25 °C and 390 mT at 100 °C (10 kHz, 1200 A/m). [1]
- CF297: initial permeability 2300 ±20%; 520 mT at 25 °C and 410 mT at 100 °C. [2]
- CF195: initial permeability 5000 ±20%; 400 mT at 25 °C and 260 mT at 100 °C; Curie temperature above 120 °C. [4]
- CF197: initial permeability 7000 ±20%; 400 mT and 260 mT; Curie temperature above 115 °C. [5]
- CF199: initial permeability 9000 ±20%; 400 mT and 260 mT; Curie temperature above 115 °C. [3]

## 3. Which values to compare for an equivalent

When you look for an equivalent of a power material, compare these lines of the two datasheets:

- Initial permeability and its tolerance.
- Saturation flux density at 100 °C, with the field strength used.
- Core loss at a stated frequency, flux density and temperature.
- Curie temperature.
- The curve of loss against temperature, which shows where the loss is lowest.

Cosmo Ferrites, TDK and Ferroxcube each give a loss-versus-temperature curve. [1][6][7]

## 4. Compare only under the same test conditions

One condition is common to four documents: 100 kHz, 200 mT, 100 °C. Cosmo Ferrites gives at most 380 kW/m³ for CF139 and at most 350 kW/m³ for CF297. [1][2] TDK gives 375 kW/m³ for N87 as a typical value. [6] Ferroxcube gives about 450 kW/m³ for 3C90. [7]

These numbers are close, but a limit and a typical value are different statements. Other lines do not match at all. Cosmo gives CF139 loss at 100 kHz, 100 mT, 100 °C (at most 60 kW/m³) and Ferroxcube gives 3C90 at the same point (at most 80 kW/m³), while TDK's N87 table lists 25 kHz, 300 kHz and 500 kHz points instead. [1][7][6]

Saturation flux density is easier to compare, because all three makers use 1200 A/m at 10 kHz: 390 mT at 100 °C for both CF139 and N87, and about 380 mT for 3C90. [1][6][7]

## 5. Verify the equivalent in the application

Material data is measured on small toroids: Cosmo on 25 mm × 15 mm × 12 mm toroids and TDK on R34 toroids. [1][6] TDK states that it is the customer who must check whether a product is suitable for a particular application. [6]

Before accepting an equivalent, measure inductance, temperature rise and saturation margin on the actual core, winding and air gap.

## How to request a core by material code from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- Core shape and full dimensions, or a drawing.
- The material code on the existing part or drawing, and its manufacturer if known.
- Whether an equivalent is acceptable.
- Application, operating frequency and operating temperature.
- Target AL value and air gap, if known.
- Required quantity.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek the material code and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Is CF139 an N87 equivalent?

The two datasheets give close values for initial permeability, saturation flux density at 100 °C and loss at 100 kHz, 200 mT, 100 °C. [1][6] Neither document states an equivalence, so the replacement must be verified in the application.

### Can CF199 be used in a power transformer?

Cosmo Ferrites describes CF199 for broadband transformers and EMI-EMC filters and gives no power loss value for it. [3]

### Does CF139 in a catalog name prove who made the core?

No. The marking in a name is a label. The manufacturer and material are confirmed by the marking on the part and by its own datasheet.

## Technical sources

- [1] [Cosmo Ferrites: CF139 material specifications](https://www.cosmoferrites.com/uploads/power/CF139.pdf).
- [2] [Cosmo Ferrites: CF297 material specifications](https://www.cosmoferrites.com/uploads/power/CF297.pdf).
- [3] [Cosmo Ferrites: CF199 material specifications](https://www.cosmoferrites.com/uploads/broadband/CF199.pdf).
- [4] [Cosmo Ferrites: CF195 material specifications](https://www.cosmoferrites.com/uploads/broadband/CF195.pdf).
- [5] [Cosmo Ferrites: CF197 material specifications](https://www.cosmoferrites.com/uploads/broadband/CF197.pdf).
- [6] [TDK: SIFERRIT material N87 data](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [7] [Ferroxcube: 3C90 material specification](https://www.ferroxcube.com/upload/media/product/file/MDS/3c90.pdf).
