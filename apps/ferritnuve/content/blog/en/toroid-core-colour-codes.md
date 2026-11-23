# What do toroid core colours mean? Does the colour code identify the material?

Toroid core colours are a paint code that an iron-powder core manufacturer uses to mark its material mix; on a ferrite toroid the colour is only the colour of the insulating coating and says nothing about the material. Micrometals, for example, paints its own -26 mix yellow/white and its -52 mix green/blue. The code is the manufacturer's own convention; the material can only be confirmed from the datasheet and by measurement.

## How does the colour code on iron-powder toroids work?

Micrometals states that its standard toroidal cores have a protective coating: the larger cores get a two-colour epoxy finish, with the colours used to identify the material. Toroids with an outside diameter of 5.1 mm or less are typically coated under vacuum with Parylene C instead. [1]

The colour is also written in the part's datasheet: the Micrometals T106-26 datasheet gives the coating as yellow/white epoxy paint and the T106-52 datasheet as green/blue epoxy paint. [2][3] The coating also insulates: all finishes have a minimum dielectric strength of 500 Vrms at 60 Hz. [1]

## The Micrometals colour code table: which mix has which colour?

Micrometals lists these toroid colour codes for its power conversion [iron-powder](https://www.ferritnuve.com/en/sozluk#iron-powder-core) mixes: [4]

- -2 red/clear, -8 yellow/red, -14 black/red.
- -18 green/red, -19 red/green.
- **-26 yellow/white**, **-52 green/blue**.
- -30 green/gray, -34 gray/blue, -35 yellow/gray.
- -38 gray/black, -40 green/yellow, -45 black/black.

For its RF carbonyl iron mixes the second colour is mostly clear: [5]

- -1 blue/clear, -2 red/clear, -3 gray/clear, -5 green/clear.
- -6 yellow/clear, -7 white/clear, -10 black/clear.
- -8 yellow/red, -15 red/white, -17 blue/yellow.

This list applies only to Micrometals' own parts.

## Why is the colour code not proof on its own?

The colour is paint, and each manufacturer uses its own scheme. Magnetics coats its powder core toroids in a single colour per material family: MPP gray, Kool Mµ black, High Flux khaki, XFLUX brown and AmoFlux blue. [6] TDK gives the epoxy coating of its ferrite toroids as blue. [7] A blue toroid can therefore be a powder core or a ferrite, depending on its maker.

So a yellow/white toroid from an unknown manufacturer cannot be assumed to have the properties of Micrometals -26. The Artek catalog lists iron-powder toroids whose names end in -26 or -52, for example T 106 - 26 and T 106 - 52. The catalog does not state who made these parts; the suffix in the name follows a widely used convention, and the material must be confirmed from the part's own datasheet in the enquiry.

## What does the colour of a ferrite toroid mean?

On a ferrite toroid the colour is not a material code. According to TDK, the coating protects the edges and insulates; epoxy (blue) is used on medium and large sizes, parylene (transparent) on small ones, and the minimum breakdown voltage of the epoxy version runs from above 1.0 kV to above 2.0 kV depending on size. [7]

The same coating sits on very different materials. TDK's epoxy-coated R 25.3 × 14.8 × 10.0 toroid is listed in seven materials: the AL value is 2360 nH in N87 and 10700 nH in T38. [8] Magnetics likewise gives the coating (0 bare, Y parylene, Z epoxy) and the ferrite material as separate characters of its toroid ordering code. [9]

The T 25 / 15 / 10 - CF199 ferrite toroid in the Artek catalog is shown with a green coating; the CF199 code, not the colour, indicates the material. See the [CF ferrite material codes guide](https://www.ferritnuve.com/en/blog/cf-ferrite-material-codes).

## How can an unknown toroid core be identified?

- **Measure it:** outside diameter, inside diameter and height. The coating adds to the size: Micrometals gives T106-26 a nominal bare outside diameter of 26.92 mm and a maximum of 27.43 mm after coating. [2]
- **Wind and measure:** wind a known number of turns and measure the inductance. The [AL value](https://www.ferritnuve.com/en/sozluk#al-value) follows from AL = L / N². [10] For example, 37 µH measured on 20 turns gives an AL of about 92.5 nH.
- **Compare:** check the result against datasheet AL values for cores of the same size.

The method has limits:

- **Tolerance:** for T106-26 Micrometals gives an AL tolerance of ±10%, measured with 100 turns at 10 kHz. [2] For the TDK ferrite toroid the tolerance is ±25% or ±30%. [8]
- **Measuring conditions:** TDK defines initial permeability at a flux density below 0.25 mT and at 25 °C. [10] A value measured under other conditions may not match the datasheet.
- **Coating and ageing:** TDK states that a coating causes the permeability to drop, depending on core size. [7] Micrometals reports a permanent decrease in the inductance of iron-powder cores exposed to elevated temperatures. [1]
- **AL does not show loss:** Micrometals gives 93 nH/N² for T106-26 and 95 nH/N² for T106-52. [2][3] An inductance measurement cannot tell these two mixes apart.

## What does the material difference change in the circuit?

In the Micrometals table the reference permeability of the -2 mix is 10, while that of the -26 and -52 mixes is 75. At a DC magnetizing force of 50 Oe, -2 keeps 99% of its initial permeability, -52 keeps 62% and -26 keeps 55%. [4]

[Core loss](https://www.ferritnuve.com/en/sozluk#core-loss) changes as well: at 100 kHz and 140 G (14 mT), the nominal loss is 83 mW/cm³ for T106-26 and 58 mW/cm³ for T106-52. [2][3] Micrometals describes -52 as having the same permeability as -26 with lower core losses at high frequency. [4] See the [-26 vs -52 toroid comparison](https://www.ferritnuve.com/en/blog/26-vs-52-iron-powder-toroids), the [ferrite vs iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids) and the [ferrite toroid core selection guide](https://www.ferritnuve.com/en/blog/ferrite-toroid-core-selection).

## Asking Artek about a coloured toroid core

- A photograph of the core, its colours and any readable markings.
- Outside diameter, inside diameter and height.
- If you measured it: number of turns, inductance and measuring frequency.
- Application, operating frequency, current and any DC component.
- Required quantity.

[Browse ferrite and iron-powder cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit,IRON-POWDER) or [send Artek your enquiry with these details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What material is a yellow and white toroid core?

Micrometals paints its own -26 iron-powder mix with the yellow/white colour code. [4] The colour of a yellow/white core from an unknown manufacturer does not show that it is the same material; its own datasheet and a measurement are needed.

### Is there a difference between a green and a blue ferrite toroid?

The colour does not tell you. On a ferrite toroid the colour belongs to the coating; TDK gives its epoxy coating as blue and its parylene coating as transparent, and offers the same coated toroid in materials with very different permeability. [7][8]

### How is the AL value of a toroid core measured?

A known number of turns is wound on the core, the inductance is measured and AL is calculated as AL = L / N². [10] The result has to be read together with the datasheet tolerance; for the Micrometals T106-26 this tolerance is ±10%. [2]

## Technical sources

- [1] [Micrometals: Coating guide](https://www.micrometals.com/products/coating-guide/).
- [2] [Micrometals: T106-26 data sheet](https://datasheets.micrometals.com/T106-26-DataSheet.pdf).
- [3] [Micrometals: T106-52 data sheet](https://datasheets.micrometals.com/T106-52-DataSheet.pdf).
- [4] [Micrometals: Power conversion (PC) iron powders](https://www.micrometals.com/products/materials/pc/).
- [5] [Micrometals: Radio frequency (RF) iron powders](https://www.micrometals.com/products/materials/rf/).
- [6] [Magnetics: Designing with magnetic cores at high temperatures (CG-06)](https://www.mag-inc.com/Media/Magnetics/File-Library/Product%20Literature/General%20Information/CG-06.pdf?ext=.pdf).
- [7] [TDK: Toroids (ring cores), general information](https://www.tdk-electronics.tdk.com/download/531586/73928c3d18a19eefb58bf397e6c83a42/pdf-toroids-general-information.pdf).
- [8] [TDK: Toroid R 25.3 × 14.8 × 10.0 core data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/r_25_3_14_8_10_0.pdf).
- [9] [Magnetics: Ferrite cores catalog 2022](https://www.mag-inc.com/Media/Magnetics/File-Library/Product%20Literature/Ferrite%20Literature/Magnetics-2022-Ferrite-Catalog.pdf).
- [10] [TDK: Ferrites and accessories, general definitions](https://www.tdk-electronics.tdk.com/download/187036/dbcde584d155cc270f5d5dbf1efec233/pdf-generaldefinitions.pdf).
