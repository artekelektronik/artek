# What is an SMPS, and how does its transformer differ from a mains transformer?

An SMPS (switched-mode power supply) converts its input voltage to the required output voltage by turning a semiconductor switch on and off tens or even hundreds of thousands of times per second. An SMPS transformer does the same voltage conversion and isolation job as a 50/60 Hz mains transformer, but at a far higher frequency; that is why it is much smaller for the same power and has a ferrite core instead of laminated metal.

## How does an SMPS work? What does switching achieve?

According to onsemi, a linear regulator turns the voltage difference between its input and output into heat in the pass transistor, so it is only 35 to 65 percent efficient. [1]

An [SMPS](https://www.ferritnuve.com/en/sozluk#smps-switched-mode-power-supply) instead switches the power device rapidly between two efficient states: cutoff, with voltage across the switch but no current, and conduction, with high current but a very small voltage drop. The switch thereby creates an AC voltage from the DC input, which a transformer can step up or down before it is filtered back to DC. Efficiency ranges from 65 to 95 percent; the price is a more complex circuit and switching noise. [1]

## Why does a high frequency make the magnetic component smaller?

Faraday's law, as Texas Instruments summarises it, says that the flux through a winding equals the integral of the volt-seconds per turn. [2] It follows that at a higher frequency fewer volt-seconds are applied in each period, so the same voltage needs a smaller core cross-section or fewer turns. Manufacturers also state this directly:

- In TI's rough core-size formula the transformer frequency is in the denominator: for the same power and flux swing, the required core shrinks as frequency rises. [2]
- onsemi states that a higher operating frequency allows smaller inductors and capacitors. [1]

Losses set the limit: according to TI, above 50 kHz the flux swing in ferrite is usually limited by core losses. [2]

## Why ferrite instead of the laminated core of a mains transformer?

According to TI, the resistivity of metal alloy cores is only 50 to 150 micro-ohm·cm; a solid metal core would behave like a shorted turn. The core is therefore divided into thin, electrically insulated laminations. [3]

These tape-wound metal alloy cores are used primarily at the 50, 60 and 400 Hz line frequencies. TI states that at SMPS frequencies of 100 kHz and up, eddy-current losses are too great even with tape only 12.5 µm thick. [3]

Power ferrites, by contrast, have a resistivity of 200 to 2000 ohm·cm; at 100 kHz their eddy-current losses are barely noticeable next to hysteresis losses. TI describes ferrites as the most popular core materials in SMPS applications. [3] For the material itself, see [what is a ferrite core](https://www.ferritnuve.com/en/blog/what-is-a-ferrite-core).

## Converter families: which use a transformer and which an inductor?

- **Buck (step-down):** a non-isolated, step-down-only circuit with an L-C filter at its output; its magnetic component is an inductor. [1]
- **Boost (step-up):** a non-isolated circuit; energy is stored in the inductor while the switch is on and passed to the output while it is off. [1]
- **Flyback:** a boost circuit whose inductor is replaced by a transformer, which also isolates input from output. [1] It has only one inductive component. [4]
- **Forward:** according to TDK it needs two inductive components: a transformer and a large output choke. [4]
- **Push-pull, half-bridge and full-bridge:** TI classes these, together with the forward converter, as buck-derived topologies; all of them use a power transformer. [2]

According to onsemi, input voltages above 42.5 V DC are considered hazardous, so supplies plugged into the mains use only transformer-isolated topologies. [1]

## A flyback transformer stores energy; a forward transformer does not

According to TI, an ideal transformer stores no energy: all energy is transferred instantaneously from input to output. [2] In forward-mode topologies the transformer only steps the AC voltage up or down; the energy is stored in the output filter. [1]

A [flyback transformer](https://www.ferritnuve.com/en/sozluk#flyback-transformer) is different: TI describes it not as a true transformer but as a multi-winding coupled inductor. It takes energy from the circuit, stores it in a magnetic field and returns it. [5]

Storage requires an [air gap](https://www.ferritnuve.com/en/sozluk#air-gap). According to TI, storing energy efficiently in a small volume needs a small non-magnetic gap in series with the high-permeability core; virtually all of the magnetic energy is stored in that gap. [5] TDK draws the same line: gapped cores for flyback converters, generally ungapped cores for forward and push-pull converters. [4]

## EE, ETD and toroid cores: how the circuit type affects the shape

According to TI, ETD cores are E-E shapes too, with a large window area in relation to core size. [2] On a core with a discrete gap the winding should sit directly over the gap, that is, on the centre leg. [5] TDK recommends E and U cores for flyback converters, and E/ETD and RM/PM cores for forward and push-pull converters. [4]

A toroid has very low leakage inductance and stray flux, but TI states that winding difficulty means toroids are seldom used in SMPS transformers. [2] A gapped ferrite toroid is a very bad choice for a flyback: windings distributed around the toroid do not conform to a discrete gap. [5] According to TDK, ring cores from R 13.3 to R 26 are used as chokes in the power lines of switch-mode power supplies. [4]

The Artek catalog lists EE ferrite cores (for example EE 25 / 13 / 7 - CF139), ETD ferrite cores (for example ETD 39 / 20 / 13- CF139) and ferrite toroids (for example T 25 / 15 / 10 - CF199). For choosing a shape, see the [EE core](https://www.ferritnuve.com/en/blog/ee-core-selection) and [ETD core](https://www.ferritnuve.com/en/blog/etd-core-selection) guides.

## Asking Artek about a core for an SMPS transformer

- Circuit type: flyback, forward, push-pull, half-bridge or full-bridge.
- Switching frequency, input and output voltages, output power.
- Core shape and size; whether an air gap is needed and, if known, the AL value.
- Whether a bobbin is needed, a photograph of the existing part and the quantity.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your request with these details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What is an SMPS transformer?

It is the ferrite-core transformer that steps the high-frequency AC voltage created by the switch up or down and isolates the input from the output. With secondaries of different turn counts it also provides several output voltages. [1] [2]

### Does every SMPS contain a transformer?

No. In non-isolated circuits such as the buck and boost converters the magnetic component is only an inductor; flyback, forward, push-pull and bridge converters contain a transformer. [1] [2]

### Why does a flyback transformer have an air gap?

Because a flyback transformer is really a coupled inductor that stores energy, and virtually all of the magnetic energy is stored in the non-magnetic gap in series with the core. A forward transformer is not meant to store energy, so its core is generally used ungapped. [4] [5]

## Technical sources

- [1] [onsemi: Switch-Mode Power Supply Reference Manual (SMPSRM/D)](https://www.onsemi.com/pub/collateral/smpsrm-d.pdf).
- [2] [Texas Instruments: Power transformer design (Magnetics Design, section 4)](https://www.ti.com/lit/ml/slup126/slup126.pdf).
- [3] [Texas Instruments: Magnetic core characteristics (Magnetics Design, section 2)](https://www.ti.com/lit/ml/slup124/slup124.pdf).
- [4] [TDK: Ferrites and accessories, application notes](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [5] [Texas Instruments: Inductor and flyback transformer design (Magnetics Design, section 5)](https://www.ti.com/lit/ml/slup127/slup127.pdf).
