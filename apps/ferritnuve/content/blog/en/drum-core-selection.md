# How to choose a ferrite drum core: drum core vs plastic bobbin, and a selection checklist

A drum core (also called a bobbin core; “makara nüve” in Turkish) is a one-piece, spool-shaped ferrite core with a flange at each end. The wire is wound directly on the ferrite, usually to make a radial leaded power inductor or choke. Its magnetic path is open, so it is unshielded. To select the right part, specify the dimensions, lead arrangement, material, target inductance and current together; a plastic coil former is a different product.

## Where are drum cores used?

Vishay defines a bobbin core as a core shaped like a bobbin or spool with flanges, available with and without leads and in axial and radial form. [1] In a radial inductor the leads exit from the same side of the body, and bobbins are one of the common core shapes used. [1]

Bourns lists power supplies, DC/DC converters and general use as the applications of its RLB series radial lead inductors. [2] Fair-Rite describes bobbins as an economical and well-proven core design for many applications where relatively low but stable inductance values are required. [3]

The Artek catalog has three drum core entries named MAKARA 8X10, MAKARA 9X12 and MAKARA 22X19. The catalog photograph shows a ferrite drum core with two radial leads.

## 1. Separate the drum core from the plastic bobbin

Both products can be called a “bobbin”, so enquiries often confuse them. A drum core is the magnetic material itself; the inductor is built on this core. [1] A plastic coil former (“karkas” in Turkish) carries the winding on cores such as EE or ETD; it is not a magnetic material, and the core is fitted to it separately.

Vishay and Fair-Rite call the ferrite part itself a “bobbin”. [1][3] Fair-Rite also states that bobbins can be supplied with a thermoset plastic coating that withstands a minimum breakdown of 500 Vrms. [3] A coated ferrite bobbin is still a core, not a coil former. State clearly in your enquiry which one you need, and attach a photograph.

## 2. Allow for the open magnetic path and stray field

Vishay lists toroids, E-cores and most pot cores among shapes with closed magnetic paths, and rod cores and unshielded bobbin cores among shapes with open magnetic flux paths. [1]

Würth Elektronik states that unshielded inductors, whose windings are typically exposed, let electromagnetic fields propagate unhindered and are generally the worst type from an EMI perspective. [4] According to Vishay, bobbin and slug core shapes need a magnetic sleeve or a similar method to make a shielded inductor, and even then shielding is a matter of degree. [1] If sensitive components sit close to the inductor, say so in your enquiry.

## 3. Give complete dimensions and the lead arrangement

A two-number name is not enough to define a drum core. Fair-Rite gives six separate dimensions (A, B, D, F, G, H) for a single bobbin. [3] Artek catalog names such as “8X10” do not state which number is the diameter and which the height, so confirm the dimensions in your enquiry.

If you are replacing an existing part, record the following from a drawing or measurement:

- Flange diameter and overall height.
- Centre core diameter and the winding width between the two flanges.
- Flange thickness.
- With or without leads; number of leads, pitch, diameter and length.
- Whether a coating is required.

## 4. Define the material and the inductance target

Fair-Rite recommends small bobbins in 43 material for higher frequency designs; 43 is a NiZn ferrite. For power applications it points to bobbins in 77 material, which are specified for AL and DC bias limits. [3] 77 material is a MnZn ferrite described for inductive designs at frequencies up to 100 kHz. [5]

These are Fair-Rite's own materials. The drum core entries in the Artek catalog do not state a material; it must be confirmed from the part's own marking or datasheet. Read an AL value together with its test condition: for one bobbin in 77 material, Fair-Rite gives AL = 65 nH ±10%, tested at 1 kHz with a 95-turn test coil. [5] In your enquiry, state the target inductance and the measuring frequency.

## 5. Assess saturation current and DC resistance together

A finished inductor has two separate current limits. Saturation current is the DC current that makes the inductance drop by a specified amount from its value at zero DC bias; Vishay considers the 10% drop value useful for ferrite cores. [1] Coilcraft attributes this drop to core saturation. [6] The Bourns RLB datasheet likewise states 10% typical at Isat and 40 °C typical at rated Irms. [2]

The second limit is heating. The winding loss equals the DC resistance multiplied by the square of the current, and it raises the component temperature above ambient. [1] Vishay states that the rated current can be increased by reducing the DC resistance or by increasing the inductor size. [1] Give the peak current and the continuous current separately in your enquiry.

## How to request a drum core from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- The catalog name (for example MAKARA 9X12) and a photograph of the existing part.
- Flange diameter, height, centre core diameter and winding width.
- With or without leads; lead pitch and arrangement.
- Any readable manufacturer and material marking.
- Target inductance, saturation current, continuous current and acceptable DC resistance.
- Application, operating frequency and required quantity.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your dimensions and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Is a drum core the same as a plastic bobbin?

No. A drum core is a magnetic core made of ferrite, shaped like a spool with flanges. [1] A plastic coil former only carries the winding and is not a magnetic material.

### Why can a drum core inductor affect nearby circuits?

An unshielded bobbin core is a shape with an open magnetic flux path. [1] Unshielded inductors with exposed windings let the field propagate unhindered; shielding needs a magnetic sleeve or a similar method. [1][4]

### How many amps can a drum core carry?

The core alone does not give a fixed current rating. Saturation current is defined by an inductance drop, and rated current by the DC resistance of the winding and its heating; both are specified for the finished inductor. [1]

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology definitions](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Bourns: RLB series radial lead inductors datasheet](https://www.bourns.com/docs/Product-Datasheets/RLB.pdf).
- [3] [Fair-Rite: Bobbins 9643001165 product page](https://fair-rite.com/product/bobbins-9643001165/).
- [4] [Würth Elektronik: ANP047 electromagnetic radiation behaviour of power inductors](https://we-online.com/components/media/o109027v410%20ANP047c_The%20Behavior%20of%20Electro-Magnetic%20Radiation%20of%20Power%20Inductors%20in%20Power%20Management.pdf).
- [5] [Fair-Rite: Bobbins 9677182208 product page](https://fair-rite.com/product/bobbins-9677182208).
- [6] [Coilcraft: Current and temperature ratings (Doc 361)](https://coilcraft.com/pdfs/Doc361_Current_Temp.pdf).
