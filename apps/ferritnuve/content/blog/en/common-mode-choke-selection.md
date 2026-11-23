# How a common-mode choke works and how to choose one

A common-mode choke is an interference suppression inductor with two or more windings of equal turns on one closed core. The magnetic fluxes that the operating current produces in the windings cancel, so the load current does not saturate the core, while common-mode noise sees the full inductance of the choke. Choosing one means weighing rated current, voltage, impedance in the noise band and winding style together.

## How does a common-mode choke work?

According to TDK, the windings are connected so that the flux induced by the operating current in one winding opposes the flux from the other, and the two compensate one another. This allows highly permeable ring cores to be used and gives a high inductance per winding. [1] This is why the part is also called a current-compensated choke.

Würth Elektronik describes the same principle through the two kinds of current: [differential-mode](https://www.ferritnuve.com/en/sozluk#differential-mode) current flows through the windings in opposite directions and the inductance for it approaches zero; common-mode currents flow in the same direction, the fields add up and a high inductance is created. [2]

Because leakage current limits restrict the capacitance of the Y capacitors, a high inductance is needed against common-mode noise. [1]

## Why does the impedance curve rise and then fall?

TDK explains that the parasitic capacitance of the winding and the inductance form a parallel resonant circuit: at self-resonance the component acts like a high resistance and above it works capacitively, so it should be operated well below the resonant frequency. [3] According to Würth, this capacitance arises from the proximity of adjacent turns. [2]

The second reason is the material: the real permeability of the ferrite drops as frequency rises. [2] The winding technique also shapes the curve: according to TDK, single-layer winding gives the lowest capacitance and the highest resonant frequency, and multilayer winding the highest capacitance and the lowest resonant frequency. [3]

## Core material: MnZn, NiZn and nanocrystalline

According to KEMET, the material is selected for the target frequency band: higher-permeability materials are effective in the lower frequency range and lower-permeability materials in the higher range, so MnZn products are mainly used against conducted noise and NiZn products against radiated noise. [4]

Würth writes that in common-mode chokes MnZn cores work between 200 kHz and 30 MHz, while NiZn cores suit frequencies above 10 MHz up to several hundred megahertz. [2] Conducted interference voltage is typically measured from 150 kHz to 30 MHz. [5]

Ferrite is not the only option: Würth's WE-CMBNC series uses a very high permeability nanocrystalline core, and the manufacturer gives a frequency range of 1 kHz to 300 MHz for that series. [6]

## Bifilar and sectional winding: what does leakage inductance do?

In a bifilar winding the two wires are wound side by side. According to Würth the coupling is excellent, but the inductance for differential-mode currents is cancelled and the proximity of the wires increases the interwinding capacitance. In a sectional winding the windings sit in separate areas of the core with spacing between them; interwinding capacitance is lower, the weaker coupling provides some differential-mode inductance, and the part is often larger. [2]

That remaining inductance is the [leakage inductance](https://www.ferritnuve.com/en/sozluk#leakage-inductance); TDK notes that it affects symmetrical interference. [3] Würth gives typical coupling factors between 0.80 and 0.95; together with an X capacitor, the leakage inductance can serve as a differential-mode filter. [2]

The contribution is limited: TDK states that in its ring core chokes the stray inductance is in the order of 1% of the rated value, so in many cases a combination with X capacitors or powder core chokes is required. [1]

## When does a common-mode choke saturate?

The cancellation depends on the currents adding up to zero. According to TDK, if even a small percentage of the rated current takes another path, such as the ground connection, the choke is no longer compensated, the core is at least partially [saturated](https://www.ferritnuve.com/en/sozluk#saturation) and the inductance drops. [1]

This is why the result must be verified in the real circuit. TDK notes that in drive systems parasitic currents through ground can saturate the chokes in the filter, and that interference voltage should be measured on the installed system. [5] KEMET likewise asks for testing on the actual device. [4]

## Which values matter when choosing a common-mode choke?

- **Rated current:** the continuous current flowing through all lines at the same time; it is reduced above the rated temperature. [3]
- **Voltage:** the rated voltage and the test voltage applied in production are separate values. [3] KEMET, for example, gives 250 V AC rated and 2,400 V AC withstanding voltage between lines for its SU9 series. [4]
- **Inductance and impedance:** the rated inductance is given at a stated measuring frequency. [3] KEMET measures inductance at 1 kHz and publishes an impedance-versus-frequency curve for each type. [4]
- **DC resistance:** measured per line at 20 °C. [3]
- **Number of lines:** double chokes for AC equipment, triple and quadruple chokes for three-phase equipment. [1]
- **Core shape and mounting:** these TDK chokes use ring (toroid) cores. [1] KEMET's SU series uses ferrite UU cores with a bobbin and comes in vertical and horizontal types. [4]

For the core itself, see the [ferrite toroid core selection](https://www.ferritnuve.com/en/blog/ferrite-toroid-core-selection) and [UU core selection](https://www.ferritnuve.com/en/blog/uu-core-selection) guides; for a ready-made filter module, see the [single-phase EMI filter selection](https://www.ferritnuve.com/en/blog/single-phase-emi-filter-selection) guide.

## Asking Artek about a common-mode choke core

The Artek catalog lists ferrite toroids used as cores for such chokes (for example T 25 / 15 / 10 - CF199, T 36 / 23 / 15 - CF199 and T 63 / 38 / 25 - CF199) and small UU ferrite cores (for example UU 10.5 and UU 16); it does not list finished, wound common-mode chokes. Share the following in your request:

- Core shape and dimensions, plus a photograph and any markings of the existing part.
- Line current, line voltage and number of lines.
- The problem frequency band and the target inductance or impedance.
- Required quantity.

[Browse ferrite toroid cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=TOROID) or [send Artek your request and application details](https://www.ferritnuve.com/en/contact). For a wound part, see the [custom inductor RFQ guide](https://www.ferritnuve.com/en/blog/custom-inductor-rfq-guide).

## Frequently asked questions

### Which filter components act against common-mode and differential-mode interference?

In a common-mode choke the windings share one core and the fluxes of the operating current cancel. [1] In TDK's filter description, X capacitors and differential-mode chokes act against differential-mode interference, while current-compensated chokes and Y capacitors act against common-mode interference. [5]

### How do you calculate a common-mode choke?

A single formula is not enough. Würth notes that in practice the complex permeability of the ferrite changes with frequency and the parasitic capacitances of the windings must be considered. [2] The choice is made from the impedance-versus-frequency curve in the datasheet and verified on the actual device. [4]

### Can a toroid common-mode choke saturate?

Yes. If a small part of the current returns by another path such as ground, the compensation is lost, the core partially saturates and the inductance drops. [1]

## Technical sources

- [1] [TDK (EPCOS): Current-compensated ring core chokes, general](https://www.tdk-electronics.tdk.com/download/531436/64c998b4b1ca11d100791d28bd36e89b/pdf-currentcompensatedchokes.pdf).
- [2] [Würth Elektronik: ANP146, Theoretical insights and practical applications of the WE-CMDC series common mode chokes](https://www.we-online.com/components/media/o868432v410%20ANP146a_WE-CMDC_EN.pdf).
- [3] [TDK: Inductors, general technical information](https://www.tdk-electronics.tdk.com/download/531382/d47b78852463cb1702f19b14bec9a65a/pdf-generaltechnicalinformation.pdf).
- [4] [KEMET: SU9V/9H common-mode choke datasheet](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [5] [TDK: EMC filters, technical information](https://www.tdk-electronics.tdk.com/download/528632/7f30b0110a521bb506ace36f0c56af5c/pdf-technical-information.pdf).
- [6] [Würth Elektronik: WE-CMBNC nanocrystalline common mode power line choke product page](https://www.we-online.com/en/components/products/WE-CMBNC).
