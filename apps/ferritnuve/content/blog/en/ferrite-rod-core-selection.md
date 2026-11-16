# How to choose a ferrite rod core: checklist for diameter, length, material and winding

A ferrite rod core is a cylindrical piece of ferrite with the coil wound directly on it and, unlike a toroid or a UU core, its magnetic path is not closed. The inductance of the coil therefore depends not only on the material but also on the length-to-diameter ratio of the rod and on the length and position of the winding. “Ferrite rod” is not enough to select the right part: settle the diameter × length, the hole, the material and the operating frequency together.

## Where are ferrite rod cores used?

The best-known use is the ferrite rod antenna. Fair-Rite offers its rod cores for antenna and RFID transponder applications and lists RFID tag antennas, RFID reader antennas and hearing aid antennas as examples. [1]

The second area is inductors and chokes. Fair-Rite states that its pressed rods are used extensively in high-energy storage designs, and can also be used for inductive components that need temperature stability or have to accommodate large DC bias. [2] Würth Elektronik lists high current capability and standard filter applications for its rod core inductor series. [3]

The Artek catalog includes ROD 5 x 20, ROD 14 x 7, ROD 6 x 30 DELİKLİ (with a centre hole), ROD 18 x 28 and ROD 28 x 20. The catalog gives ROD 5 x 20 as about 5 mm in diameter and 20 mm long; for the other entries, confirm in your enquiry which number is the diameter and which is the length.

## 1. Settle the diameter, length and hole

Rod cores are defined by two dimensions: diameter and length. Ferroxcube's ROD core document also lists parts by D (diameter) and L (length), each with its own tolerance. [4] A catalog name gives the nominal size, not the tolerance. If you are replacing an existing part, measure the following or take them from a drawing:

- Diameter and length, preferably measured with a caliper.
- Whether the rod is solid or has a centre hole, and the hole diameter if it has one.
- The inner size of any bobbin, sleeve or holder the rod sits in.

A rod with a hole, such as ROD 6 x 30 DELİKLİ (with a centre hole), is not the same part as a solid rod of the same outer size. The name does not state the hole diameter, so ask for it in your enquiry.

## 2. A rod is an open magnetic path: check the length-to-diameter ratio

Fair-Rite classifies its rods under the heading “open magnetic circuit” and gives the rod permeability (µrod) as a function of the length-to-diameter ratio. [2] The permeability the rod adds to the coil is far lower than the initial permeability of the material.

Fair-Rite's own example shows this clearly: for an antenna rod 3 mm in diameter and 25 mm long the ratio is 8.33, and in 61 material, which has an initial permeability of 125, the rod permeability is given as 29. [2][5] According to the same source, a lower ratio means a lower rod permeability but better temperature stability. [2]

These values belong to Fair-Rite's own parts; any other rod needs a measurement or its manufacturer's data.

## 3. Winding length and position change the inductance

The single AL value familiar from closed cores does not work the same way on a rod. Fair-Rite adds an inductance modifier (K) to the calculation for a wound rod, found from the ratio of winding length to rod length. A fully wound rod has K = 1, and a shorter but centred winding gives a higher K value. [2]

When copying an existing coil, record not only the number of turns but also the length the winding covers on the rod and where it sits.

## 4. Material and frequency: NiZn or MnZn?

“Ferrite rod” is not a single material. Fair-Rite suggests materials for its antenna rods by frequency: 78 material below 200 kHz, 61 material for 0.2–5.0 MHz and 67 material above 5.0 MHz. [5] The manufacturer describes 78 as a MnZn ferrite for power applications up to 200 kHz and low-loss inductive applications up to 500 kHz, and 61 as a high-frequency NiZn ferrite for inductive applications up to 25 MHz. [6][7]

The same size can exist in different materials: Ferroxcube lists the ROD5/20 core in both 3C90 and 4B1 material. [4] The size does not tell you the material. The Artek catalog does not state the material grade of its rods either, so give the operating frequency in your enquiry and ask for the material to be confirmed.

## 5. Allow for brittleness and mounting

Ferrite is a ceramic material. TDK states that ferrite cores are brittle and sensitive to shock, fast temperature changes and tensile load; mechanical stress in the core also lowers the initial permeability, so the embedding medium should be as elastic as possible. [8] Fair-Rite likewise warns that strong magnetic fields or excessive mechanical stress may cause irreversible changes in permeability and losses. [5]

For this reason, do not fix the rod by clamping or with rigid adhesive, and do not bend it during winding.

## How to request a ferrite rod core from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- Diameter x length, solid or with a hole, and the hole diameter if any.
- A photograph of the existing part and any readable manufacturer or material marking.
- Application: antenna, inductor or high-current choke.
- Operating frequency, target inductance and current.
- Number of turns, wire diameter, winding length and position.
- Required quantity.

[Browse ferrite rod cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=CUBUK) or [send Artek your dimensions and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Which material is used for a ferrite rod antenna?

That depends on the operating frequency. As an example, Fair-Rite suggests 78 material below 200 kHz, 61 material for 0.2–5.0 MHz and 67 material above 5.0 MHz for its own antenna rods. [5]

### Does a longer rod give a higher inductance?

Length alone is not a sufficient criterion. Rod permeability depends on the length-to-diameter ratio, and the inductance also depends on how much of the rod the winding covers and where it sits. [2]

### Can a ferrite rod core be used in a high-current inductor?

Yes; manufacturers also offer rods for inductive components that carry a large DC bias and for high-current filter inductors. The current a particular rod can carry depends on its material, size and winding and must be verified by measurement. [2][3]

## Technical sources

- [1] [Fair-Rite: Ferrite rods for RFID and antenna applications](https://www.fair-rite.com/wp-content/uploads/2025/06/FR_RFID_Flyer_R01.pdf).
- [2] [Fair-Rite: Rods 4061287011 product page and rod permeability notes](https://fair-rite.com/product/rods-4061287011/).
- [3] [Würth Elektronik: WE-RCIT rod core inductor](https://www.we-online.com/catalog/en/am/browse/filterchokes/we-rcit).
- [4] [Ferroxcube: ROD core data](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/rod.pdf).
- [5] [Fair-Rite: Antenna/RFID Rods 3061990871 product page](https://fair-rite.com/product/antennarfid-rods-3061990871/).
- [6] [Fair-Rite: 78 material data sheet](https://fair-rite.com/78-material-data-sheet/).
- [7] [Fair-Rite: 61 material data sheet](https://fair-rite.com/61-material-data-sheet/).
- [8] [TDK: U 93/76/30 core data, cautions and warnings for ferrites](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
