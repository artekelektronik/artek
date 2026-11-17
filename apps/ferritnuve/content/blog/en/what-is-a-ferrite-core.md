# What is a ferrite core and what does it do? Soft ferrite, MnZn and NiZn explained

A ferrite core is a ceramic magnetic part made by mixing iron oxide with oxides of metals such as manganese, zinc or nickel and firing the mixture. It carries the magnetic flux in inductors, high-frequency transformers and interference suppression components. Because its electrical resistivity is high, eddy-current losses stay low at high frequency, which is why ferrite is used in switch-mode power supplies (SMPS) and EMI filters.

## What is ferrite? Composition and structure

Vishay defines ferrite as a magnetic material consisting of a mixed oxide of iron and other elements with a crystalline structure, created by firing the material at a very high temperature for a specified time. The general composition is xxFe2O4, and the most popular metal combinations are manganese-zinc (MnZn) and nickel-zinc (NiZn). [1]

Magnetics likewise describes ferrite cores as dense, homogeneous ceramic structures made by mixing iron oxide (Fe2O3) with oxides or carbonates of metals such as manganese, zinc, nickel or magnesium; the parts are pressed, fired in a kiln to 1300 °C and machined as needed. [2]

Being a ceramic has a mechanical consequence: TDK states that ferrite cores, like any ceramic material, are brittle and sensitive to shock, fast temperature changes and tensile load. [3]

## Soft ferrite and hard ferrite

The word ferrite covers two different groups of material. According to TDK, hard ferrite forms permanent magnets, while soft ferrite is not a permanent magnet: it is magnetised only when a magnetic field is applied and is used in transformer and inductor cores. [4]

Magnetics also states that its cores have a low coercivity and are therefore known as soft magnetic ferrites. [5] In this article and in the Artek catalog, a ferrite core always means soft ferrite.

## MnZn and NiZn ferrite: the two main material families

According to Magnetics, MnZn materials have a high permeability and NiZn ferrites a low permeability. MnZn ferrites are used where the operating frequency is below 5 MHz; NiZn ferrites have a higher resistivity and are used from 2 MHz to several hundred megahertz. [2]

Two manufacturer data sheets make the difference concrete. TDK's N87, a material for power transformers, is MnZn based, with an initial permeability of 2200, a resistivity of 10 Ωm and an optimum frequency range of 25–500 kHz. [6] Fair-Rite's 61 material is NiZn, with an initial permeability of 125 and a resistivity of 1×10⁸ Ω·cm; it is specified for inductive applications up to 25 MHz and for suppressing noise frequencies above 200 MHz. [7]

A similar split applies to interference suppression: KEMET states that materials with higher permeability are effective in the lower frequency range and those with lower permeability in the higher range, so that MnZn products are mainly used against conducted noise and NiZn products against radiated noise. [8]

These values belong only to the named manufacturer materials. For markings such as CF139 or CF199 in the Artek catalog, see the [CF ferrite material codes guide](https://www.ferritnuve.com/en/blog/cf-ferrite-material-codes).

## Why is ferrite used at high frequency?

Magnetics explains the advantage of ferrites over other magnetic materials as high electrical resistivity and low eddy-current losses over a wide frequency range; together with high permeability, these make ferrite suitable for high-frequency transformers and inductors from 10 kHz to 50 MHz. [2] TDK also notes that, being a ceramic, ferrite suppresses eddy-current losses, which makes it suitable for high-frequency applications. [4]

A Texas Instruments power supply design note reaches the same result from the application side: where a large flux swing makes core loss the limit, ferrite is usually the best choice at frequencies above 50 kHz. [9]

## The limits of a ferrite core: saturation and temperature

The weak point of ferrite is its saturation flux density. Texas Instruments uses about 0.3 T as a conservative saturation limit for power ferrite and states that in inductors with small ripple current a ferrite core is often limited by saturation, in which case materials with a greater saturation flux density, such as powdered iron, may be used. [9]

Saturation also changes with temperature: TDK gives the flux density of N87 as 490 mT at 25 °C and 390 mT at 100 °C. [6] Above its Curie temperature a ferrite core loses its magnetic properties. [1] For N87 this temperature is above 210 °C. [6] For the choice between ferrite and iron powder, see the [ferrite vs iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids).

## Where are ferrite cores used?

- **SMPS and RF transformers and inductors:** Magnetics states that ferrites are used extensively here because of their low losses at high frequencies. [5]
- **EMI/RFI filters and common-mode chokes:** with high-permeability materials. [5]
- **Interference suppression on cables:** Würth Elektronik states that ferrite cores and snap-on ferrites are designed to suppress EMI directly on the affected cable. [10]

The Artek catalog includes ferrite cores in EE, ETD, UU, toroid, rod and drum shapes, as well as cable ferrites. The [ferrite core shapes guide](https://www.ferritnuve.com/en/blog/ferrite-core-shapes) explains which shape suits which job. For a particular shape, continue with the [EE](https://www.ferritnuve.com/en/blog/ee-core-selection), [ETD](https://www.ferritnuve.com/en/blog/etd-core-selection), [UU](https://www.ferritnuve.com/en/blog/uu-core-selection), [toroid](https://www.ferritnuve.com/en/blog/ferrite-toroid-core-selection) and [cable ferrite](https://www.ferritnuve.com/en/blog/cable-ferrite-selection) selection guides.

## Asking Artek about a ferrite core

If you are not sure which core you need, share the following in a single message:

- Application: SMPS transformer, inductor, choke, line filter or interference suppression on a cable.
- Operating frequency, current and any DC component.
- Dimensions, a photograph and any readable markings of the existing part.
- Required quantity.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your question and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What does a ferrite core do?

In inductors and transformers it carries the magnetic flux and raises the inductance of the winding; in suppression components it presents an impedance to high-frequency noise. Its high resistivity keeps eddy-current losses low at high frequency. [2]

### What is a ferrite core transformer?

It is a transformer with a core made of ferrite, operating at high frequency. Ferrites are used extensively in switch-mode power supply transformers because of their low losses at high frequencies. [5] As an example, TDK specifies its U 93/76/30 ferrite core for power transformers above 1 kW at 20 kHz. [3]

### Is a ferrite magnet the same as a ferrite core?

No. Hard ferrite is used to make permanent magnets; the soft ferrite used in transformer and inductor cores is magnetised only while a magnetic field is applied. [4]

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Magnetics: Learn more about ferrite cores (technical FAQ)](https://www.mag-inc.com/Products/Ferrite-Cores/Learn-More-about-Ferrite-Cores).
- [3] [TDK: U 93/76/30 core data, cautions for ferrites](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
- [4] [TDK: Ferrite World, Vol. 1 — Welcome to the ferrite world](https://www.tdk.com/en/tech-mag/ferrite02/001).
- [5] [Magnetics: Ferrite cores product page](https://www.mag-inc.com/Products/Ferrite-Cores).
- [6] [TDK: SIFERRIT N87 material data](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [7] [Fair-Rite: 61 material data sheet](https://fair-rite.com/61-material-data-sheet/).
- [8] [KEMET: SU9V/9H common-mode choke datasheet](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [9] [Texas Instruments: Inductor and flyback transformer design](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [10] [Würth Elektronik: Cable ferrites and cable solutions](https://www.we-online.com/en/components/productnavigator/cable-solutions).
