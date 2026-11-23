# How to choose the core and bobbin for an SMPS transformer: what to settle before winding

Choosing the core and bobbin for an SMPS transformer means settling five decisions before winding: topology, frequency and material, core size, core shape and bobbin. A flyback transformer stores energy in an air gap in the core; forward, half-bridge and full-bridge transformers transfer energy directly and normally use ungapped cores. Core size follows from the loss and temperature-rise limit, not from a watt table, and the bobbin must match the core exactly.

## Topology first: will the core store energy or transfer it?

Texas Instruments describes the [flyback transformer](https://www.ferritnuve.com/en/sozluk#flyback-transformer) as a multi-winding coupled inductor: it takes energy from the circuit, stores it in a magnetic field and then returns it. Virtually all of that energy is stored in a gap, which in a ferrite core is a discrete air gap. [1] TDK likewise lists gapped cores for the flyback converter. [2]

In forward, half-bridge and full-bridge topologies the opposite holds: ideally a transformer stores no energy and transfers it instantaneously from input to output. [3] For forward and push-pull converters TDK lists generally ungapped cores. [2]

## How to read operating frequency and material loss data

The core material is selected for the frequency at which the transformer operates. [3] Power ferrite data sheets state the frequency range and the loss with its measuring conditions:

- **TDK N87:** optimum frequency range 25–500 kHz; typical loss 375 kW/m³ at 100 kHz, 200 mT and 100 °C. [4]
- **Ferroxcube 3C90:** for power transformers up to 0.2 MHz; about 450 kW/m³ at 100 kHz, 200 mT and 100 °C. [5]
- **Ferroxcube 3C95:** for power transformers up to 0.5 MHz; about 290 kW/m³ under the same conditions. [6]

These values belong only to the named materials; TI notes that manufacturer loss data is measured with sinusoidal drive and is not always dependable. [3] For markings such as CF139 in the Artek catalog, see the [CF ferrite material codes guide](https://www.ferritnuve.com/en/blog/cf-ferrite-material-codes).

## Why can core size not be read from a watt table?

According to TI, the appropriate core is the smallest one that handles the required power with acceptable losses and temperature rise. A first estimate uses the area product: the magnetic cross-section of the core multiplied by the winding window area. TI calls this a crude indication and asks for the design to be checked by measuring temperature on a prototype. [3]

Manufacturer power tables rest on assumptions. In SMPS transformer design, TDK calculates its power capacity tables with a copper fill factor of 0.4, DC copper resistance and a thermal resistance measured in free convection, and states that the absolute values will not be met in practice. [2] The quick selection table in onsemi's AN-4140 applies to a universal input range, 67 kHz and a single 12 V output. [7] A figure such as "ETD39 = X W" is therefore valid only with its conditions; see the [ETD core selection guide](https://www.ferritnuve.com/en/blog/etd-core-selection) for an ETD core transformer.

## Which core shape: EE, ETD, EFD, PQ, RM or toroid?

- **EE:** according to Magnetics, less expensive than pot cores, with simple bobbin winding and easy assembly; no self-shielding. [8]
- **ETD:** a round centerpost for minimum winding resistance. [8]
- **EFD:** a flat design for very flat, compact transformers. [8]
- **PQ and pot cores:** according to TI, the window is small and almost square, but these shapes shield better than E-E cores. [3]
- **RM:** TDK recommends RM cores alongside E/ETD cores for forward converters. [2]
- **Toroid:** the lowest leakage inductance, but difficult to wind; according to TI, seldom used in SMPS transformers. [3]

The common principle is a wide window: it lowers the number of layers, the AC resistance and the leakage inductance. [3] For replacement checks, see the [EE core selection guide](https://www.ferritnuve.com/en/blog/ee-core-selection).

## Why does the bobbin matter as much as the core?

The [bobbin](https://www.ferritnuve.com/en/sozluk#bobbin-coil-former) carries the winding and connects it to the circuit board through its pins. For ETD 39/20/13, TDK lists a single-section, 16-pin coil former with a winding cross-section of 178 mm² and an average turn length of 69 mm, and warns that its accessories may not be compatible with cores from other manufacturers. [9] The winding cross-section decides how much copper fits and the mean turn length sets the winding resistance; both enter the winding calculation.

The bobbin also takes window area: according to TI, in a small transformer with a bobbin and high-voltage isolation only 25–30% of the window may be copper. [10] For safety isolation, clearance is measured through air and creepage along the surface of the material; both depend on the working voltage, the pollution degree and the insulation grade. Würth Elektronik shows margin (shelf) tape, an extended-rail bobbin and triple-insulated wire on the secondary as ways of achieving it. [11] The required distances follow from the applicable standard.

## Why are leakage inductance and winding order written down first?

[Leakage inductance](https://www.ferritnuve.com/en/sozluk#leakage-inductance) represents energy stored between the windings; it causes voltage spikes during switching and ends up as loss in a snubber. [3] The separation left for isolation increases it. [10]

According to onsemi, winding order has a large effect on leakage inductance: the primary is typically placed innermost, the highest-power secondary closest to the primary, and the most common and effective method is a sandwich winding. [7] The winding order is therefore written down before any turns are calculated.

## Asking Artek about a core and bobbin for an SMPS transformer

Before winding or asking for a quote, write down:

- Topology; whether the core is gapped or ungapped and, if gapped, the target AL value or air gap.
- Transformer operating frequency, input voltage range, output voltages and currents.
- Core shape, full dimensions and material marking.
- Bobbin: pin count, pin pitch, horizontal or vertical mounting, number of sections.
- Isolation requirement, the applicable standard and the winding order.
- Permitted temperature rise and quantity.

The Artek catalog lists EE ferrite cores from EE 13 to EE 110 (for example EE 25 / 13 / 7 - CF139 and EE 42 / 21 / 15 - CF139) and ETD cores ETD 29, 39, 44, 49, 54 and 59 (for example ETD 39 / 20 / 13- CF139). Bobbins are not listed in the catalog with data, so ask for a matching bobbin in your enquiry. [Browse EE and ETD cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=EE,ETD) or [send Artek this list](https://www.ferritnuve.com/en/contact). For a transformer quote, see the [custom transformer RFQ guide](https://www.ferritnuve.com/en/blog/custom-transformer-rfq-guide).

## Frequently asked questions

### How many watts can a core handle in an SMPS transformer?

There is no fixed figure. The power depends on topology, frequency, material, winding and temperature rise; manufacturer tables only help to select among cores under the conditions they state. [2]

### Where does a flyback transformer store its energy?

A flyback transformer stores energy and then delivers it to the output; virtually all of it is stored in the gap, because the core material alone can store very little. [1]

### Does a bobbin from another manufacturer fit a core with the same name?

That cannot be assumed. TDK states that its accessories were designed and evaluated only with its own cores and that combining them with other manufacturers' parts requires prior testing. [9]

## Technical sources

- [1] [Texas Instruments: Inductor and flyback transformer design (SLUP127)](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [2] [TDK: Ferrites and accessories, application notes](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [3] [Texas Instruments: Power transformer design (SLUP126)](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [4] [TDK: SIFERRIT N87 material data](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
- [5] [Ferroxcube: 3C90 material specification](https://www.ferroxcube.com/upload/media/product/file/MDS/3c90.pdf).
- [6] [Ferroxcube: 3C95 material specification](https://www.ferroxcube.com/upload/media/product/file/MDS/3c95.pdf).
- [7] [onsemi: AN-4140, transformer design consideration for offline flyback converters](https://www.onsemi.com/pub/collateral/an-4140.pdf).
- [8] [Magnetics: Learn more about ferrite shapes](https://www.mag-inc.com/Products/Ferrite-Cores/Ferrite-Shapes/Learn-More-about-Ferrite-Shapes).
- [9] [TDK: ETD 39/20/13 core and accessories data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [10] [Texas Instruments: SLUP125, Section 3 — windings and magnetic field behaviour](https://www.ti.com/lit/ml/slup125/slup125.pdf).
- [11] [Würth Elektronik: Transformer safety, updates on IEC 61558 standard](https://www.we-online.com/files/pdf1/transformer-safety-updates-on-iec-61558-standard.pdf).
