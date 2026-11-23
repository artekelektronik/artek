# How to calculate turns and inductance from the AL value

The AL value is the inductance a core gives with a single turn, usually stated in nH in ferrite core data sheets. Inductance grows with the square of the number of turns: L = AL × N². The turns needed for a target inductance are therefore N = √(L / AL), but this is only a starting value, because AL carries a tolerance and says nothing about whether the core will saturate.

## The inductance formula: L = AL × N²

TDK defines the [AL value](https://www.ferritnuve.com/en/sozluk#al-value) as the inductance referred to a number of turns of 1, and gives L = AL × N² for a winding of N turns. [1] The same manufacturer's application notes show the calculation in the other direction: for an AL value of 100 nH and an inductance of 640 µH, N = √(L / AL) yields 80 turns. [2]

AL is not a constant of the material alone; it is the combined result of material and geometry. In TDK's definition, AL = µ0 × µe / (l/A), where µe is the [effective permeability](https://www.ferritnuve.com/en/sozluk#effective-permeability) and l/A is the ratio of the effective magnetic path length to the effective cross-section (le / Ae). [1] A larger cross-section, a shorter magnetic path and a higher permeability all raise AL.

## The unit trap: nH/N² and µH for 100 turns

The most common mistake in this calculation is the unit. Ferrite data sheets state AL in nH, meaning nH per turn squared (nH/N²). For iron-powder cores, a figure in µH for 100 turns is also in use. Micrometals expresses AL values in nH/N² in its catalog and gives the conversion as an example: 350 µH for 100 turns = 35.0 nH/N² = 35.0 mH for 1000 turns. [3] The rule: divide a value in µH for 100 turns by 10 to get nH/N²; a value in mH for 1000 turns is the same number as nH/N². If the conversion is forgotten, AL is taken 10 times too large and the number of turns comes out about 3.2 times (√10) too small. For the difference between the two material families, see the [ferrite vs iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids).

## Toroid turns calculation: a worked example

The example uses TDK's R 25.3 × 14.8 × 10.0 mm ferrite toroid. Its data sheet gives AL = 2360 nH ±25%, le = 60.07 mm and Ae = 51.26 mm² in N87 material. [4] Take a target inductance of 1 mH:

- Match the units: L = 1 mH = 1,000,000 nH.
- Form the ratio: L / AL = 1,000,000 / 2360 = 423.7.
- Take the square root: N = √423.7 = 20.6. The number of turns must be a whole number, so choose 21 turns.
- Check backwards: L = 2360 × 21² = 2360 × 441 = 1,040,760 nH, or about 1.04 mH.

Choosing 20 turns instead would give 2360 × 400 = 944,000 nH, or 0.94 mH. These figures belong only to the named TDK part; they cannot be applied to a similarly sized toroid from another manufacturer.

## How do AL tolerance and an air gap change the result?

Inductance is directly proportional to AL, so the tolerance passes straight into the result. The ±25% tolerance in the example means AL may lie anywhere between 1770 nH and 2950 nH, and the 21-turn coil may measure between 0.78 mH and 1.30 mH.

An [air gap](https://www.ferritnuve.com/en/sozluk#air-gap) lowers the effective permeability and with it the AL value. [1] TDK's ETD 39/20/13 core puts numbers on it: in N87 material the ungapped set gives 2700 nH (+30/−20%), while the set with a 1.00 mm gap gives approximately 196 nH. [5] For the same 1 mH, the ungapped set needs 20 turns and the gapped set 72 turns. In return, TDK states that the air gap makes close AL value tolerances achievable. [2]

Iron-powder cores have a tighter tolerance: Micrometals gives a typical AL tolerance of ±5% or ±10% depending on the mix. [6]

## What AL does not tell you: saturation, rods and drum cores

AL is a small-signal value. Micrometals states that its AL values are based on a peak AC flux density of 1 mT at 10 kHz and that measurements under other conditions will give different results. [6] The flux density under current must therefore be calculated separately. Texas Instruments derives N = L × ΔI / (ΔB × Ae) from Faraday's law; for peak values the same relation can be written as B = L × I / (N × Ae). The same source uses about 0.3 T as a conservative saturation limit for power ferrite. [7]

In the example coil (1.04 mH, 21 turns, Ae = 51.26 mm²), a peak current of 0.2 A gives 0.19 T, and the 0.3 T limit is reached at about 0.31 A. This is a calculation from the data sheet values, and it shows why the AL formula is not enough on its own.

Rods and drum cores have an open magnetic path. [8] TDK states that for cylindrical cores no unambiguous relationship between µi and µe is possible because of the high leakage inductance, and that the design and position of the winding have a considerable influence on the result. [1] A single AL therefore does not apply to these cores in the same way; for a wound rod, Fair-Rite uses a rod permeability that depends on the length-to-diameter ratio and a modifier that depends on the ratio of winding length to rod length. [9] See the [ferrite rod core guide](https://www.ferritnuve.com/en/blog/ferrite-rod-core-selection) for detail.

The last step is always a measurement. Micrometals notes that toroids tested with a small number of unevenly distributed turns give higher inductance readings than expected. [6] Wind a sample with the calculated turns, measure it at the operating frequency and current, then correct the number of turns. For shape and material, see the [ferrite toroid core guide](https://www.ferritnuve.com/en/blog/ferrite-toroid-core-selection).

## Asking Artek about an AL value

The Artek catalog lists ferrite toroids (for example T 25 / 15 / 10 - CF199), EE cores (for example EE 25 / 13 / 7 - CF139), ETD cores (for example ETD 39 / 20 / 13- CF139) and iron-powder toroids (for example T 106 - 26). The catalog does not publish AL values for these parts; the AL value must be requested with the enquiry. Do not use another manufacturer's AL value for a similarly sized part. Include the following in your request:

- The exact product name from the catalog and the required quantity.
- Target inductance and acceptable tolerance.
- Peak current, any DC component and the operating frequency.
- Whether an air gap is required.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your request with these details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What does the AL value of a core tell you?

The AL value is the inductance a core gives for a single turn; the inductance of a coil with N turns is L = AL × N². It depends on the permeability of the material as well as on the effective cross-section and magnetic path length of the core. [1]

### What is the formula for the number of turns?

Divide the target inductance by the AL value and take the square root: N = √(L / AL). L and AL must be in the same unit, so if AL is in nH the inductance is converted to nH as well. In TDK's example, an AL of 100 nH and 640 µH give 80 turns. [2]

### Does the AL value give the saturation current of a coil?

No. AL is a small-signal value measured at a low flux density. [6] For saturation, the peak flux density must be calculated separately with B = L × I / (N × Ae) and compared with the limit of the material. [7]

## Technical sources

- [1] [TDK: Ferrites and accessories — general definitions](https://www.tdk-electronics.tdk.com/download/187036/dbcde584d155cc270f5d5dbf1efec233/pdf-generaldefinitions.pdf).
- [2] [TDK: Ferrites and accessories — application notes](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [3] [Micrometals: Power conversion and line filter applications catalog, Issue L (2007), copy in an MIT course archive](https://ee6131b.mit.edu/document/micrometals.pdf).
- [4] [TDK: R 25.3 × 14.8 × 10.0 toroid data sheet](https://www.tdk-electronics.tdk.com/inf/80/db/fer/r_25_3_14_8_10_0.pdf).
- [5] [TDK: ETD 39/20/13 core data sheet](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [6] [Micrometals: 2023 product catalog, tolerances section](https://s3.amazonaws.com/micrometals-production/filer_public/f4/da/f4da63c8-44fc-4d87-a290-bf3f5c8ae2de/micrometals_2023_catalog-final_122123.pdf).
- [7] [Texas Instruments: Inductor and flyback transformer design](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [8] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [9] [Fair-Rite: Rod 4078377511 product page](https://fair-rite.com/product/rods-4078377511).
