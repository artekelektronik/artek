# Why does a core saturate, and what does an air gap do?

Core saturation is the point at which a magnetic core reaches the limit of the flux density it can carry: beyond it, more current produces no more flux, the permeability collapses and the inductance drops. An air gap is a small non-magnetic break left deliberately in the magnetic path; it lowers the effective permeability and the AL value, so the core carries more current before it saturates. The price is more turns for the same inductance and flux fringing around the gap.

## What is core saturation? Why does the B-H curve flatten?

According to TDK, saturation is reached when all elementary magnets in the material are in the direction of the field. TDK defines the [saturation flux density](https://www.ferritnuve.com/en/sozluk#saturation-flux-density) (BS) as the maximum flux density attainable in a material at a given temperature: above it, increasing the field strength (H) does not increase B further. [1] That is the flattening of the B-H curve.

Vishay describes what the circuit sees: beyond the maximum flux density point the permeability of the core is reduced and the inductance drops. [2] Texas Instruments adds that a saturated core material becomes non-magnetic and therefore high reluctance. [3] Inductance is the property that opposes any change in current [2]; in a coil whose inductance has dropped, the same voltage drives the current up much faster.

## How does saturation flux density change with temperature?

According to TDK, BS drops monotonically with temperature and has fallen to zero at the Curie temperature. [1] For its N87 material TDK gives the flux density, at H = 1200 A/m and f = 10 kHz, as 490 mT at 25 °C and 390 mT at 100 °C. [4] Hot, the same material saturates about one fifth lower.

Saturation is therefore checked at the operating temperature. Texas Instruments suggests about 0.3 T as a conservative saturation limit for power ferrite. [3] The N87 values belong only to that TDK material.

## How is peak flux density estimated?

For inductors the calculation starts from the current. Texas Instruments finds the number of turns from N = L × ΔI / (ΔB × Ae). [3] For peak values the same relation reads B = L × I / (N × Ae) in SI units, where I is the peak current and Ae the effective cross-section.

For transformers the calculation starts from the voltage. Faraday's law states that the flux through a winding equals the integral of the volt-seconds per turn; for a rectangular voltage this means ΔB = V × t / (N × Ae). During transients the volt-seconds can be several times larger than normal and saturate the core. [5]

## What does an air gap do?

For cores with an [air gap](https://www.ferritnuve.com/en/sozluk#air-gap) TDK defines an effective permeability (μe) and gives this approximation for small gaps: μe = μi / (1 + s × μi / le), where s is the gap width and le the effective magnetic path length. [1] According to Texas Instruments, virtually all of the magnetic energy is stored in the gap; the core material is the low-reluctance path linking that energy to the winding, and a discrete gap linearises the B-H characteristic. [3]

TDK's own ETD 39/20/13 core puts numbers on this: in N87 material the ungapped set has an [AL value](https://www.ferritnuve.com/en/sozluk#al-value) of 2700 nH (+30/−20%) and a μe of 1600, while a 1.00 mm gap brings AL down to approximately 196 nH and μe to 115. [6] Because L = AL × N² [3], the same inductance then needs about 3.7 times the turns; by the relation above, flux density at the same current falls by the same factor.

The second gain is stability: TDK states that the gap reduces the temperature coefficient by the ratio μe/μi and makes close AL tolerances achievable. [7]

The gap also has a cost:

- **More turns:** because AL is lower, the same inductance takes more turns.
- **Fringing flux and copper loss:** large eddy-current losses can occur in the turns close to the gap; the problem is most severe in flyback transformers. [3]
- **EMI:** stray flux outside the gap couples noise to the circuit and to the outside world. [3]

## Where is an air gap needed, and where is it avoided?

- **Flyback transformers:** TDK lists gapped cores among the core requirements for the flyback converter. [7]
- **PFC (boost) inductors and DC chokes:** Texas Instruments states that storing and returning energy requires a gap in series with the high-permeability core; a boost inductor can be limited by saturation at peak current. [3]
- **Forward and push-pull transformers:** TDK generally recommends ungapped cores for these converters. [7]
- **Common-mode chokes:** TDK finds a closed core suitable; saturation by the useful current is avoided because the fluxes of two equal windings compensate each other. [7]

The alternative to a discrete gap is an iron-powder core. According to Vishay, powdered iron has an inherent distributed air gap; it saturates at a higher DC current than ferrite, and its inductance drops much more gradually. [2] Magnetics adds that distributed-gap materials lack the traditional saturation point of a ferrite core. [8] Texas Instruments calls a gapped ferrite toroid a very bad choice, because windings distributed around a toroid do not conform to a discrete gap. [3] See the [ferrite vs iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids).

## How are gapped cores ordered?

According to Magnetics, a gap is specified either by its AL value or by its mechanical dimension, and a gap specified by AL gives a tighter tolerance. [9] The AL values in TDK's ETD 39/20/13 table apply to a set made of one ungapped and one gapped core half. [6]

Spacing the halves apart instead of grinding the centre leg places half of the gap in the outer legs; Texas Instruments states that this propagates stray flux outside the part and makes the inductance difficult to predict. [3] For core size, see the [ETD core selection guide](https://www.ferritnuve.com/en/blog/etd-core-selection); for a wound part, the [custom transformer RFQ guide](https://www.ferritnuve.com/en/blog/custom-transformer-rfq-guide).

## Asking Artek about a gapped core

Share the following in a single message:

- Application: flyback transformer, PFC inductor or DC choke.
- Core type, full dimensions and any material marking.
- Required AL value or gap in millimetres; in the centre leg or with a spacer.
- Peak current, operating frequency and maximum core temperature.
- Required quantity (single halves or sets).

The Artek catalog lists EE cores (for example EE 42 / 21 / 15 - CF139), ETD cores (for example ETD 39 / 20 / 13- CF139), ferrite toroids (for example T 25 / 15 / 10 - CF199) and iron-powder toroids (for example T 106 - 26). The catalog does not state air gaps or saturation values; a required gap or AL value must be written in the enquiry. [Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your requirement](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What happens when a core saturates?

The permeability of the core is reduced and the inductance of the winding drops. [2] The saturated material behaves like a non-magnetic, high-reluctance material. [3]

### Why does a flyback transformer need an air gap?

A flyback transformer stores energy and returns it, and virtually all of that energy is stored in the gap; the high-permeability core only provides an easy path for the flux. [3]

### Why does inductance fall as the air gap gets larger?

A larger gap lowers the effective permeability and, with it, the AL value, so the same number of turns gives less inductance. [1]

## Technical sources

- [1] [TDK: Ferrites and accessories — general definitions](https://www.tdk-electronics.tdk.com/download/187036/dbcde584d155cc270f5d5dbf1efec233/pdf-generaldefinitions.pdf).
- [2] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [3] [Texas Instruments: Inductor and flyback transformer design](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [4] [TDK: SIFERRIT N87 material data](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [5] [Texas Instruments: Power transformer design](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [6] [TDK: ETD 39/20/13 core and accessories data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [7] [TDK: Ferrites and accessories — application notes](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [8] [Magnetics: Learn more about powder cores (technical FAQ)](https://www.mag-inc.com/Products/Powder-Cores/Learn-More-about-Powder-Cores).
- [9] [Magnetics: Learn more about ferrite cores (technical FAQ)](https://www.mag-inc.com/Products/Ferrite-Cores/Learn-More-about-Ferrite-Cores).
