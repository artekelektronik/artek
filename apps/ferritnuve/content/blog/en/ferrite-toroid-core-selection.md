# How to choose a ferrite toroid core: sizes, material, AL value and coating

A ferrite toroid core is a ring-shaped core that, in its standard form, gives a closed magnetic path with no air gap; it is used to wind toroidal inductors and common-mode chokes. The outer diameter alone is not enough to select the right part: check the outer diameter, inner diameter and height, the permeability class of the material, the AL value, the coating and the saturation behaviour together.

## Where are ferrite toroid cores used?

TDK states that toroids are primarily used as EMC chokes for suppressing RF interference in the MHz region and in signal transformers, and that they are increasingly used for power applications. The same document lists high-permeability MnZn materials for interference suppression, with sizes R 13.3 to R 26 intended for power line chokes. [1]

Magnetics likewise lists common-mode chokes, EMI filters, broadband transformers, pulse transformers and current transformers as applications for its 5,000, 10,000 and 15,000 permeability materials. [2]

The Artek catalog includes ferrite toroids from T 13 / 7 / 5 - CF139 up to T 100 / 55 / 20 - CF199, and the catalog photo shows a green-coated toroid. For the choice between ferrite and iron powder, see the [ferrite vs iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids).

## 1. Give all three ferrite toroid core sizes

A toroid is defined by three dimensions: outer diameter, inner diameter and height. TDK names its toroids in the same order and offers diameters from 2.5 mm to 202 mm. [1] Artek catalog names follow the same pattern, as in T 25 / 15 / 10 - CF199.

Sizes that look close are not necessarily the same part: TDK's standard core near this size is named R 25.3/14.8/10. The coating also changes the dimensions: for the coated version of this core TDK gives an outer diameter of 26.6 mm maximum, an inner diameter of 13.5 mm minimum and a height of 11.0 mm maximum. [3] A smaller inner diameter leaves less room for the winding.

If you are replacing an existing part, record the following:

- Outer diameter, inner diameter and height, and whether they were measured on a coated part.
- Wire diameter, number of turns and number of windings.

## 2. Match the permeability class to the application

A toroid of one size can be offered in very different materials. TDK lists the R 25.3/14.8/10 core in seven materials, from N87 with an initial permeability of about 2200 to T38 with about 10000. [3] High-permeability MnZn materials are recommended for interference suppression, while for power applications the amplitude permeability and power loss values of the special power materials apply. [1] Magnetics describes toroids in its materials from 750 to 3,000 permeability as suitable for high-frequency transformers. [2]

In the Artek catalog the size 63 / 38 / 25 appears as two separate entries: T 63 / 38 / 25 - CF195 and T 63 / 38 / 25 - CF199. This shows why size alone is not enough. The meaning of a material marking in the catalog name must be confirmed with the part's own datasheet; do not assign another manufacturer's data to these parts.

## 3. Calculate the turns from the AL value

The AL value is the inductance divided by the square of the number of turns: AL = L / N². [1] The same number of turns therefore gives very different inductance when the material changes. For TDK's R 25.3/14.8/10 core the AL value is 2360 nH in N87 and 10700 nH in T38. [3] With ten turns, that is the difference between about 0.24 mH and 1.07 mH.

AL is a nominal value. In the same datasheet the tolerance is 25% or 30% depending on the material. [3] TDK also notes that coating a core causes the initial permeability to drop, depending on core size, and that high winding forces can have a similar effect, especially on high-permeability materials. [1] Confirm the target inductance by measuring a wound sample.

## 4. Check the coating and insulation

On a toroid the wire is wound directly onto the core, so the coating protects the edges and also provides insulation. TDK uses a blue epoxy coating less than 0.4 mm thick on medium and large sizes; the minimum breakdown voltage is above 1.0–1.5 kV for sizes up to R 20 and above 2.0 kV for sizes larger than R 20. [1]

Cosmo Ferrites states that coated cores are usually available in green, blue and grey, and that uncoated cores need taping for insulation before winding. [4] Because the colour varies by manufacturer, it does not identify the material or the insulation strength on its own.

## 5. Allow for saturation and the missing air gap

Magnetics states that ferrite toroids have no air gap and a uniform cross-sectional area, which gives high magnetic efficiency. [2] The same property means saturation must be checked separately in a toroidal inductor that carries DC current. TDK explains that gapped ferrite toroids are mainly used as power inductors for converters, where the gap enables high currents without saturation, and that medium and large toroids are available with a cut gap. [1]

## How to request a ferrite toroid core from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- Outer diameter, inner diameter, height and a photograph of the existing part.
- Any readable manufacturer and material marking, and the coating colour.
- Target AL value, or inductance and number of turns, if known.
- Application (common-mode choke, toroidal inductor or transformer), frequency, current and any DC component.
- Required quantity.

[Browse ferrite toroid cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=TOROID) or [send Artek your dimensions and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Does a ferrite toroid core have an air gap?

A standard ferrite toroid has no air gap. [2] Manufacturers can also supply medium and large toroids with a cut gap, in which case the gap thickness is specified in the order. [1]

### Does the coating affect the AL value of a toroid?

TDK describes the influence of its epoxy coating on the AL value as low, but also notes that coating causes the initial permeability to drop depending on core size. [1]

### Can two toroid cores of the same size replace each other?

Only if the material and AL value also match. In a single TDK size the AL value ranges from 2360 nH to 10700 nH depending on the material. [3]

## Technical sources

- [1] [TDK: Toroids (ring cores) general information and overview](https://www.tdk-electronics.tdk.com/download/531586/73928c3d18a19eefb58bf397e6c83a42/pdf-toroids-general-information.pdf).
- [2] [Magnetics: Ferrite toroids product page](https://www.mag-inc.com/Products/Ferrite-Cores/Ferrite-Toroids).
- [3] [TDK: R 25.3/14.8/10 toroid core data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/r_25_3_14_8_10_0.pdf).
- [4] [Cosmo Ferrites: Coated and uncoated toroidal cores](https://www.cosmoferrites.com/news-events/everything-you-need-to-know-about-coated-uncoated-toroidal-cores).
