# ETD29, ETD39 or ETD44: how to choose a ferrite core for an SMPS

An SMPS transformer core cannot be selected from power rating or outside dimensions alone. Circuit topology, frequency, material, air gap, winding space and temperature limits must be assessed together. Names such as ETD29, ETD39 and ETD44 are geometric starting points for that decision.

## Why does ETD size not define a power rating?

There is no single unconditional answer to the question, “How many watts can an ETD39 handle?” The same geometry can be used with different materials, air gaps and winding arrangements. Temperature rise from core and winding losses also affects the design limits. [1][2]

Do not limit your requirements to a statement such as “I need a 200 W transformer.” Include the input and output conditions, topology and operating temperature. Clarify the requirements first, then assess core and winding options.

## 1. Define the topology and operating conditions

The magnetic component in a flyback circuit is treated as a coupled inductor that stores energy during operation. Topologies that transfer energy differently have different magnetic design objectives. This distinction affects how inductance and the air gap are assessed. [1][2]

Prepare the following information for an initial technical assessment:

- Circuit topology and switching frequency.
- Minimum and maximum input voltage.
- Voltage and current for each output.
- Target power and load operating profile.
- Available volume and ambient temperature.
- Isolation and mechanical mounting requirements.

This list does not replace a completed design; it makes missing information visible early.

## 2. Read geometry, material and air gap separately

A core family name is not a complete part description. TDK's ETD39 documentation, for example, lists different materials and air-gap options for the same geometry. This illustrates a general principle: similar dimensions do not establish electrical equivalence. TDK data cannot automatically be applied to similarly named products from another manufacturer. [3]

Read the material grade, AL value, tolerance and air gap together. When replacing an existing part, its manufacturer and complete part number are useful starting points.

## 3. What does the AL value tell you?

AL is a core or core-set parameter relating turns to inductance under specified conditions. In the small-signal approximation, **L = AL × N²** can be used. If AL is expressed in nH/turn², the result is in nH. This calculation alone does not check saturation, temperature or losses. [1]

As a purely illustrative example, a hypothetical set with an AL of 100 nH/turn² would give approximately 40 µH with 20 turns. This is not a specification or recommended operating value for an Artek product. The actual part's test conditions and behaviour at operating current require separate assessment.

## 4. When does the air gap matter?

In energy-storage designs, the air gap is determined together with the required inductance and current. Adding a gap is not simply a universal way to prevent saturation: it also changes inductance and field distribution. Use the specified gap arrangement and manufacturer's data for the selected set. [1][2]

Rather than requesting only a “gapped core,” provide the target AL, tolerance and set information where possible. If the design calculation has not been completed, request technical evaluation instead of estimating unknown values.

## 5. Check the bobbin and mating parts early

A suitable core does not automatically make the complete assembly suitable. Check the bobbin winding window, pin arrangement, horizontal or vertical mounting and PCB fit separately. Add clips or other fixing parts to the request where required. Manufacturer documentation also identifies cores and accessories separately. [3]

Clarify the sales unit: a half core, a pair of halves and a set including a bobbin and clip are different items. Check whether technical values apply to a half core or the assembled core set.

## Looking for an alternative to an existing ETD core

Collect photographs, readable markings and a drawing of the existing part. Then compare manufacturer/model, material, dimensions, air gap, AL/tolerance and mounting parts. State explicitly if the existing winding must be retained.

Finding a candidate of the same size starts the assessment; it does not complete it. Material names or online cross-reference tables should not be assumed sufficient on their own, especially across brands.

## How to request an ETD core from Artek

For a new design, lead with the electrical requirements. For a replacement, lead with the identity of the existing part. Include the quantity, whether you need halves, pairs or sets, and the bobbin requirement. [Browse ETD products](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=ETD) or [send Artek drawings and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Can I use ETD39 instead of ETD29?

Do not assume a direct replacement: dimensions, winding and mounting conditions may change. Check the new core, bobbin and electrical design together. [2][3]

### Can every product marked CF139 use the same datasheet?

Verify which manufacturer owns the material designation and whether the supplied part actually uses that material. A similar label alone does not justify transferring another manufacturer's data.

## Technical sources

- [1] [Texas Instruments: Inductor and flyback transformer design](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [2] [Coilcraft: Structured design of switching power transformers](https://www.coilcraft.com/en-us/resources/application-notes/structured-design-of-switching-power-transformers/).
- [3] [TDK: ETD39/20/13 cores and accessories](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
