# Comparing -26 and -52 iron-powder toroids

Start a -26 versus -52 toroid comparison by verifying the actual manufacturer and material, then assess operating current, frequency, losses and temperature together. Matching dimensions or similar initial inductance does not establish that two cores are interchangeable in an application.

## Confirm the material family and manufacturer

Toroid describes a ring shape. This guide concerns iron-powder cores; ferrite and other powder alloys should not be treated as the same material. For the family-level distinction, read the [ferrite versus iron-powder toroid guide](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids).

A -26 or -52 suffix is not proof of manufacturer identity. Match the supplied part's brand and model to its own datasheet. Colour and coating appearance alone do not establish its material.

## 1. What does the manufacturer's comparison say?

Micrometals describes its Mix 26 as a material for power conversion and line filtering. It describes its Mix 52 as having the same nominal permeability as Mix 26, with lower core losses at high frequency. This comparison applies to that manufacturer's own materials. [1][2]

It does not mean that every -52-labelled product is better under all conditions. Artek catalog names such as T106-26 and T106-52 help identify candidates, but do not establish that they are Micrometals parts or share those material curves.

## 2. Compare candidates under matching conditions

Do not compare outside diameter alone. Inside diameter, height, coating and tolerances affect winding space. Collect the following information for electrical assessment:

- Target inductance and the current at which it is required.
- Continuous DC current, peak current and current ripple.
- Switching frequency and known waveform.
- Turn count, conductor size and mechanical limits.
- Ambient temperature, cooling and permitted temperature rise.

Avoid comparing one candidate's room-temperature value directly with another value specified at a different temperature or current. First match the curves' test conditions.

## 3. Check beyond zero-current inductance

Inductance in distributed-gap materials can decrease under DC bias. Reaching the target in a small-signal measurement does not show that the same inductance will remain at load current. [3]

Look for the manufacturer's DC-bias curve or measurements under specified current conditions. A circuit's inductance requirement at load cannot be verified by an unloaded measurement alone. Where documentation is missing, plan sample validation rather than inventing a current capability.

## 4. Separate core loss from total inductor loss

Lower core loss alone does not prove that a completed inductor will run cooler in every case. DC and AC winding losses also contribute. If turn count or conductor changes, the result cannot be attributed solely to the core material. [4]

Record circuit conditions, winding construction, ambient conditions and the measurement method when assessing two samples. Measurements after temperature stabilises provide a more useful comparison than surface readings taken after different operating times. Do not present an unperformed test as demonstrated product performance.

## 5. Can -52 directly replace -26?

Do not assume automatic interchangeability. Check manufacturer and dimensions first, then inductance at operating current, losses and thermal performance. Explicitly state if the original winding must be retained.

The suitable candidate is the one that meets the design requirements. Price or a material suffix cannot replace technical assessment. If documentation is incomplete, list the remaining checks rather than claiming definite equivalence.

## Sending a toroid enquiry to Artek

Provide the existing manufacturer's model, outside diameter, inside diameter and height. Add target inductance, operating current, ripple, frequency, temperature and quantity. [Browse iron-powder cores in the catalog](https://www.ferritnuve.com/en/products?categories=IRON-POWDER) and [send your application details to Artek](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Is -52 always the better choice?

No. The identity of the documented material and the application's electrical, thermal and mechanical conditions determine suitability. A single loss comparison does not settle the whole design.

### Does core colour prove its material?

Colour can help within a documented manufacturer's coding system. It cannot establish the material of a part with an unknown manufacturer.

## Technical sources

- [1] [Micrometals: Mix 26 material information](https://www.micrometals.com/products/materials/26/).
- [2] [Micrometals: Mix 52 material information](https://www.micrometals.com/products/materials/52/).
- [3] [Magnetics: Inductor core material and shape choices](https://www.mag-inc.com/design/design-guides/inductor-core-material-and-shape-choices).
- [4] [Coilcraft: Determining inductor power losses](https://www.coilcraft.com/en-us/resources/application-notes/determining-inductor-power-losses/).
