# Ferrite core shapes: EE, ETD, UU, toroid, rod and drum — which one for which job

Ferrite core shapes fall into two groups: those with a closed magnetic path (EE, ETD, UU and toroid) and those with an open magnetic path (rod and drum). A closed path suits transformers and high-inductance chokes; an open path suits inductors that need a low but stable inductance, and antennas. This guide explains in a few sentences what each shape is for, whether it uses a bobbin, and which selection guide to read next.

## First distinction: closed and open magnetic paths

Vishay lists toroids, E cores and most pot cores as common shapes considered to have closed magnetic paths, and rod cores and unshielded bobbin cores as shapes with open magnetic flux paths. [1] In a closed path the flux stays largely inside the core. In an open path part of the flux returns through air, so the same material gives a lower inductance and more stray field.

Shape is not only a magnetic decision. Magnetics compares core geometries by core cost, bobbin cost, winding cost, winding flexibility, mounting, heat dissipation and shielding. [2] If you want the background on the material itself, start with [what a ferrite core is](https://www.ferritnuve.com/en/blog/what-is-a-ferrite-core).

## EE cores: bobbin-wound, flexible and widely used

An EE core is used as two E-shaped halves joined through a bobbin that carries the winding. In the Magnetics comparison table the E core is in the lowest class for core, bobbin and winding cost and in the best class for winding flexibility, while it is in the weakest class for shielding. [2] The same source lists E cores among the suitable shapes for power transformers, converter transformers, power inductors and common-mode chokes. [2]

The Artek catalog includes EE cores from EE 13 to EE 110. See the [EE core selection guide](https://www.ferritnuve.com/en/blog/ee-core-selection) for details.

## ETD cores: a shape designed for SMPS transformers

ETD is the member of the E family developed for switch-mode power supply (SMPS) transformers. TDK specifies its ETD 39/20/13 core to IEC 63093-6 and describes it as intended for SMPS transformers with optimum weight/performance ratio at small volume; the same document lists the matching coil former and yoke. [3] In the Magnetics table the EC, ETD and EER group is in the best class for winding flexibility and the medium class for core and bobbin cost. [2]

The Artek catalog includes ETD 29, 39, 44, 49, 54 and 59 cores. For material, AL value, air gap and bobbin fit see the [ETD core selection guide](https://www.ferritnuve.com/en/blog/etd-core-selection); if you are preparing a winding enquiry, see the [custom transformer RFQ guide](https://www.ferritnuve.com/en/blog/custom-transformer-rfq-guide).

## UU cores: line filter chokes and large power transformers

A UU core is formed by two U halves facing each other; the same U half can also be closed with a straight I piece. Small UU cores are used in mains line filters: KEMET states that its SU series common-mode chokes are designed with ferrite UU cores. [4] Large U cores sit on the power side: TDK specifies its U 93/76/30 core for power transformers above 1 kW at 20 kHz and gives separate data for the UU and UI combinations. [5]

The Artek catalog includes UU cores from UU 9.8 to UU 126 / 45 / 20, together with UUR cores and I pieces. See the [UU core selection guide](https://www.ferritnuve.com/en/blog/uu-core-selection) for dimensions, combinations and AL values.

## Toroid cores: a closed ring without a bobbin

A toroid is a one-piece ring. No bobbin is used and the wire is wound directly on the core. In the Magnetics table the toroid is in the lowest class for core cost and the best class for shielding, but in the highest class for winding cost and the lowest for winding flexibility. [2] TDK states that toroids are primarily used as EMC chokes for suppressing RF interference in the MHz region and in signal transformers, and are increasingly used for power applications. [6]

The Artek catalog includes ferrite toroids from T 13 / 7 / 5 - CF139 to T 100 / 55 / 20 - CF199 and iron-powder toroids coded -26 and -52. The [ferrite toroid core selection guide](https://www.ferritnuve.com/en/blog/ferrite-toroid-core-selection) covers size, AL and coating; the [ferrite vs iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids) covers the choice of material.

## Rod and drum cores: open magnetic paths

A rod core is a straight cylinder with an open magnetic path. [1] Ferroxcube lists rod cores in diameters from 1.5 mm to 12 mm and in two different materials. [7] Fair-Rite lists rods and antenna/RFID rods among the forms available in its NiZn 61 material. [8] The Artek catalog includes rod cores from ROD 5 x 20 to ROD 28 x 20; details are in the [ferrite rod core selection guide](https://www.ferritnuve.com/en/blog/ferrite-rod-core-selection).

A drum core is a spool-shaped ferrite part with a flange at each end; Vishay defines this shape as a core available with and without leads and in axial and radial forms. [1] Fair-Rite describes these cores as an economical and well-proven design for applications where relatively low but stable inductance values are required. [9] A drum core should not be confused with the plastic bobbin that carries a winding on other core shapes. The Artek catalog lists MAKARA 8X10, 9X12 and 22X19; details are in the [drum core selection guide](https://www.ferritnuve.com/en/blog/drum-core-selection).

## Cable ferrites: ferrite rings and snap-on suppressors

A ferrite ring or snap-on ferrite fitted on a cable is also a ferrite core, but it carries no winding: the cable itself passes through the core. Würth Elektronik states that ferrite cores and snap-on ferrites are designed to suppress EMI directly on the affected cable. [10] The Artek catalog includes round cable ferrites from 6 mm to 14.5 mm and flat cable ferrites. See the [cable ferrite selection guide](https://www.ferritnuve.com/en/blog/cable-ferrite-selection) and the [flat cable ferrite guide](https://www.ferritnuve.com/en/blog/flat-cable-ferrite-selection).

Material, AL value, saturation and temperature rise must be verified separately in each application; for material markings see the [CF ferrite material codes guide](https://www.ferritnuve.com/en/blog/cf-ferrite-material-codes).

## How to request a ferrite core from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- Core shape (EE, ETD, UU, toroid, rod, drum) and full dimensions or a drawing.
- Any readable manufacturer and material marking, and a photograph of the existing part.
- Whether a bobbin, clip or yoke is needed.
- Application (SMPS transformer, choke, line filter, antenna), frequency and current.
- Target AL value and air gap, if known.
- Required quantity.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your dimensions and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### How many ferrite core shapes are there?

There is no fixed number; manufacturers offer dozens of shapes. In its comparison table alone, Magnetics assesses toroid, E, EC/ETD/EER, ER/planar, PQ, pot, DS/RM and EP groups separately. [2]

### Does every ferrite core shape use a bobbin?

No. With two-piece cores such as EE and ETD the winding goes on a bobbin; TDK lists the coil former and yoke together with the core in its ETD 39/20/13 document. [3] A toroid has no bobbin; the Magnetics table marks bobbin cost as not applicable for toroids. [2]

### Which core shape is used for a common-mode choke?

Magnetics lists toroids and E cores as suitable shapes for common-mode chokes. [2] Line filter chokes such as the KEMET SU series use UU cores. [4]

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Magnetics: Ferrite cores, application and geometry comparison tables](https://www.mag-inc.com/Products/Ferrite-Cores).
- [3] [TDK: ETD 39/20/13 core and accessories](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [4] [KEMET: SU9V/9H common-mode choke datasheet](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [5] [TDK: U 93/76/30 and I 93/28/30 core data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
- [6] [TDK: Toroids (ring cores) general information and overview](https://www.tdk-electronics.tdk.com/download/531586/73928c3d18a19eefb58bf397e6c83a42/pdf-toroids-general-information.pdf).
- [7] [Ferroxcube: ROD core data](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/rod.pdf).
- [8] [Fair-Rite: 61 material data sheet](https://fair-rite.com/61-material-data-sheet/).
- [9] [Fair-Rite: Bobbin core 9677182208 product page](https://fair-rite.com/product/bobbins-9677182208).
- [10] [Würth Elektronik: Cable ferrites and cable solutions](https://www.we-online.com/en/components/productnavigator/cable-solutions).
