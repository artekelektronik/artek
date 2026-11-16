# What information is needed for a custom inductor or choke quote?

An inductance value alone does not describe a custom inductor or choke. The enquiry becomes assessable when you also give the function of the part, the measurement conditions for inductance, continuous and peak current, the definition used for saturation current, DC resistance and mechanical limits. This guide is a five-step inductor specification checklist for your enquiry.

## Where are inductors and chokes used?

In switching converters the inductor stores energy. Vishay describes a boost regulator as storing energy in an input inductor and a buck regulator as applying switched pulses to an inductor and capacitor circuit. [1] The same source describes input line filters as low-pass filters commonly made of inductor and capacitor combinations. [1] Common-mode chokes target noise that appears on a line pair with the same amplitude and phase relative to ground. [2]

In this guide “inductor” and “choke” mean the wound component. The plastic former that carries the winding is a bobbin (coil former), which is a separate product.

The Artek catalog lists cores used in such parts: ferrite toroids (for example T 25 / 15 / 10 - CF199), iron-powder toroids (for example T 106 - 26 and T 106 - 52), ferrite rods (for example ROD 18 x 28), drum cores (MAKARA 9X12) and EE/ETD ferrite cores (for example EE 25 / 13 / 7 - CF139).

## 1. State the function of the part

In the first line of your enquiry, say which of these applies:

- Energy-storage power inductor: buck, boost or PFC stage.
- Common-mode choke: two or more windings, for a line filter.
- Differential-mode (filter) choke: single winding, a series filter element on the line.

In a common-mode choke the magnetic fields of differential-mode currents cancel, while those of common-mode currents add and create a high inductance. [2] In an energy-storage inductor the core carries DC current. Vishay states that the distributed air gap of a powdered iron core allows a higher DC current before saturation than ferrite. [1] This is why the function decides the core type.

## 2. Give electrical values with their measurement conditions

Write the inductance with its tolerance and measurement frequency. Vishay lists 1 kHz as a widely used test frequency for power inductors; standard tolerance letters include J (±5%), K (±10%) and M (±20%). [1]

One current figure is not enough. State separately:

- Continuous DC or RMS current.
- Peak current and the inductance drop accepted at that current.
- Ripple current and switching frequency.
- Maximum DC resistance.

DC resistance is the winding resistance measured with no alternating current and is usually specified as a maximum. [1]

## 3. Separate saturation current from rated current

These are two different limits. Vishay defines saturation current as the DC bias current that makes the inductance drop by a specified amount from its zero-bias value, with 10% and 20% as common percentages. [1] Rated current is the continuous DC current that can be passed, based on a maximum temperature rise at the maximum rated ambient temperature, and is not related to the magnetic properties of the inductor. [1]

Würth Elektronik states that rated current values from different manufacturers are not directly comparable. It bases its own measurement on IEC 62024-2:2020, uses natural convection only, and its comparison example refers to 40 K above a 25 °C ambient. [3]

Instead of writing “10 A”, define both limits, for example “10 A continuous, 14 A peak, inductance drop at peak no more than 20%”.

## 4. Add core and winding details

If known, state the core shape and material: toroid, drum, gapped EE or rod. Toroids and E-cores are considered closed magnetic paths, while rod cores and unshielded bobbin (drum) cores have open flux paths. [1] For the material choice, see the guide on [ferrite versus iron-powder toroids](https://www.ferritnuve.com/en/blog/ferrite-vs-iron-powder-toroids).

Give the wire type and the number of turns if known. In a common-mode choke the winding style changes the result. Bifilar winding gives close coupling and largely cancels differential-mode inductance. In sectional winding the windings sit in separate sections of the core, interwinding capacitance is lower and some differential-mode inductance remains. [2] State the line voltage and the insulation test voltage you expect between windings.

## 5. Complete the mechanical, environmental and quantity details

Give the footprint and maximum height. State the mounting style: through-hole pins, a base, or flying leads.

Include ambient temperature and cooling conditions. Operating temperature accounts for the self temperature rise caused by winding loss, and both copper and core losses contribute to temperature rise. [1]

List the standards the end product must meet, and give sample quantity and expected production quantity separately.

## How to request an inductor enquiry review from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- Function: power inductor, common-mode choke or differential-mode choke.
- Inductance, tolerance, measurement frequency and level.
- Continuous current, peak current and accepted inductance drop.
- Ripple current, switching frequency and maximum DC resistance.
- Core, wire and turns if known; line voltage and insulation for common-mode chokes.
- Dimensions, mounting style, ambient temperature and standards.
- Sample and production quantities; photographs of an existing part if available.

[Browse ferrite and iron-powder cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit,IRON-POWDER) or [send these details to Artek as an enquiry](https://www.ferritnuve.com/en/contact). For transformers, see the [custom transformer RFQ guide](https://www.ferritnuve.com/en/blog/custom-transformer-rfq-guide).

## Frequently asked questions

### What is the difference between saturation current and rated current?

Saturation current is the current at which inductance drops by a specified percentage. Rated current is the continuous current allowed by temperature rise. Specify both separately. [1]

### Should a toroidal inductor use ferrite or iron powder?

That depends on the function of the part. Vishay states that a powdered iron core, because of its distributed air gap, carries a higher DC current before saturating than ferrite, and that its inductance drop is more gradual. [1]

### Can I send an enquiry with only a sample choke?

Yes. Share photographs, dimensions, readable markings and the circuit it is used in. The measurements needed to fill in missing electrical values can then be identified.

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Würth Elektronik: ANP146, WE-CMDC common mode chokes application note](https://www.we-online.com/components/media/o868432v410%20ANP146a_WE-CMDC_EN.pdf).
- [3] [Würth Elektronik: ANP096, What do rated current values mean?](https://www.we-online.com/components/media/o393343v410%20ANP096%20EN.pdf).
