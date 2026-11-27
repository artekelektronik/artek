# What is skin effect? When is litz wire needed?

Skin effect is the tendency of alternating current to flow near the surface of a conductor instead of using its whole cross-section; it raises the resistance of the conductor, and the current is pushed further towards the surface as frequency increases. Litz wire is a conductor made of many thin, separately insulated strands woven together so that each strand takes every position in the cross-section; the current is shared equally between the strands, which gives lower AC losses than a solid wire of comparable size. The price is a lower copper fill factor.

## Why does skin effect occur?

According to Vishay, the magnetic field associated with the current in a conductor causes eddy currents near the centre of the conductor, and these oppose the main current there. The current is forced towards the surface, and the effect grows as the frequency rises. [1] The result is a smaller effective cross-section and a higher resistance. [1]

Eddy currents in a winding cause two types of loss: skin effect and proximity effect, the latter coming from the fields of neighbouring turns. [1] This guide concentrates on [skin effect](https://www.ferritnuve.com/en/sozluk#skin-effect); proximity effect is the second factor, and it becomes worse as the number of winding layers grows.

## How is the penetration depth calculated?

In Texas Instruments' SMPS transformer example, the penetration depth in copper is 7.6/√f cm, with f in hertz. [2] At 200 kHz that is about 0.17 mm. [2] The same relation gives about 0.24 mm at 100 kHz and about 0.076 mm at 1 MHz, so the thickness of copper the current actually uses becomes thinner as frequency rises.

The deciding quantity is the wire thickness relative to this depth. In the same example at 200 kHz, a single-layer primary of 15 turns of 0.72 mm copper wire has an AC/DC resistance ratio of 3.1 from Dowell's curves, which TI judges to be an unacceptable AC loss. [2]

## How does litz wire solve this?

According to Vishay, [litz wire](https://www.ferritnuve.com/en/sozluk#litz-wire) consists of separately insulated strands woven or bunched so that each strand takes every possible position in the cross-section; the current divides equally between them, and AC losses are lower than in a comparable solid conductor. The benefit grows with frequency. [1]

In TI's example, a litz wire of 100 strands of 0.064 mm (0.81 mm overall diameter) brings the AC/DC resistance ratio of the same primary from 3.1 down to about 1.2. The reason given is that 100 strands behave roughly like a 10 × 10 array, so the effective layer thickness is about one tenth. [2]

## What does litz wire cost?

- **Copper fill:** According to TI, in a winding of insulated round wires only 70–75% of the winding area is likely to be copper. For litz wire, an additional factor of about 0.75 applies for each level of twisting; with 7 strands of 7 strands the copper area falls to about 42%. [2]
- **DC resistance:** Finer strands add insulation and voids, which raise the DC resistance. [2]
- **Window area:** With less copper per unit area, less copper fits in the same window, which has to be allowed for when choosing the core and the [bobbin](https://www.ferritnuve.com/en/sozluk#bobbin-coil-former).

Litz wire therefore makes sense where the penetration depth is small compared with the wire thickness, not in every winding.

## What alternatives exist to litz wire?

TI also describes copper foil or strap windings: in a winding of foil or strap the copper area can reach 80–90%. [2] In the same example, a single-turn secondary is made from copper strip much thicker than the penetration depth; since current flows only on the outer side of the strip, AC resistance stays the same as thickness grows while DC resistance falls. [2]

TI's current-density rules for power inductors assume that the rise in winding loss due to high-frequency skin effect is kept below one third of the total winding loss. [3] In ferrite cores, eddy-current losses become significant above roughly 200–300 kHz, and winding losses also rise with frequency. [2] As frequency goes up, core material and wire are therefore chosen together; see [SMPS transformer core and bobbin selection](https://www.ferritnuve.com/en/blog/smps-transformer-core-and-bobbin-selection) and [core saturation and the air gap](https://www.ferritnuve.com/en/blog/core-saturation-and-air-gap).

## When asking Artek about a core for winding

For a wound part, include in your request:

- Operating frequency and waveform (sine or rectangular).
- RMS current and number of turns for each winding.
- Core type, exact size and material mark; the window size if a bobbin is needed.
- Any constraint on wire type (litz, foil, solid) and the insulation requirement.
- Quantity.

The Artek catalog includes EE cores (for example EE 42 / 21 / 15 - CF139) and ferrite toroids (for example T 25 / 15 / 10 - CF199). The catalog does not state wire choice or winding loss; these must be written in the request. You can [browse the ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrite) or [send Artek a request](https://www.ferritnuve.com/en/contact) with your requirements. For a wound part, see also the [custom transformer RFQ guide](https://www.ferritnuve.com/en/blog/custom-transformer-rfq-guide).

## Frequently asked questions

### At what frequency does skin effect matter?

There is no fixed threshold; the criterion is the penetration depth relative to the wire thickness. In TI's calculation the penetration depth in copper is about 0.17 mm at 200 kHz, so a wire thicker than that cannot use its full cross-section at this frequency. [2]

### Is litz wire always better than solid wire?

No. Litz wire lowers AC loss, but it reduces the copper fill and raises DC resistance. At low frequency, or where the wire is already thinner than the penetration depth, that cost can outweigh the gain. [2]

### Does litz wire remove skin effect completely?

No. Litz wire reduces the losses; in TI's example the AC/DC resistance ratio is still 1.2. [1][2]

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Texas Instruments: Power transformer design](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [3] [Texas Instruments: Inductor and flyback transformer design](https://www.ti.com/lit/ml/slup127/slup127.pdf).
