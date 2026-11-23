# Ferrite bead vs inductor vs common-mode choke: what is the difference?

A ferrite bead, an inductor (choke) and a common-mode choke are all magnetic parts placed in series with a line, but they do different jobs. An inductor stores energy in its magnetic field and is specified by inductance, saturation current and rated current; a ferrite bead turns high-frequency noise into heat and is specified by its impedance-versus-frequency curve. A common-mode choke has two windings on one core, so it presents impedance only to common-mode noise and leaves the working current alone.

## Are an inductor, a coil and a choke the same thing?

Yes, they are names for the same component. Vishay's terminology document lists "coils" as another common name for inductors. [1]

A choke is not a separate component but a purpose: Vishay defines an RF choke as another name for a radio-frequency inductor intended to filter or choke out signals. [1] Every choke is an inductor; the name states its job.

## How does an inductor work and how is it specified?

Vishay defines an inductor as a passive component designed to resist changes in current; that ability and the ability to store energy in its magnetic field account for most of its useful properties. For an ideal inductor Z = XL = 2πfL, so impedance rises with inductance or frequency. [1]

Besides inductance, two current limits are stated:

- **[Saturation current](https://www.ferritnuve.com/en/sozluk#saturation-current):** the DC bias current at which the inductance drops by a specified amount from its zero-bias value, commonly 10 % or 20 %. [1]
- **Rated current:** the continuous DC current the inductor can carry, based on a maximum temperature rise; it is not related to the magnetic properties. [1]

## How does a ferrite bead work?

Murata describes a [ferrite bead](https://www.ferritnuve.com/en/sozluk#ferrite-bead) as a bead of ferrite with a lead passed through it; when current flows it functions as an inductor. The difference is the material, a ferrite with high loss at high frequencies. In a regular inductor the main part of the impedance is the reactance (X); in a ferrite bead at high frequency it is the resistance (R). Reactance is not accompanied by loss, resistance is, so the bead absorbs noise energy better. [2]

Texas Instruments describes three regions: a ferrite bead is inductive at low frequencies, resistive at higher frequencies near its self-resonant frequency and capacitive above it. It passes signals within a certain frequency range with minimal effect and dissipates higher-frequency signals as heat: an inductor stores energy, a ferrite bead dissipates it. [3]

This is why a ferrite bead is named by impedance, not inductance. Murata notes that chip ferrite beads are customarily standardized by their impedance at 100 MHz, and that selection must consider both the signal frequency and the noise frequency. [2]

## How does DC current affect a ferrite bead?

A ferrite bead is still an inductor that uses ferrite, so it saturates. Murata states that the impedance of chip ferrite beads decreases when high currents flow, and recommends parts with some leeway in rated current or a high initial impedance. Once the current is reduced, the original performance is restored. [4]

Texas Instruments adds that attenuation varies well before the rated current is reached and that the impedance at peak current is not always in the data sheet. [3] On a supply rail, check the impedance at the operating current, not the zero-current value.

## How does a common-mode choke work?

Vishay defines differential-mode (normal-mode) noise as interference present between the two lines, and common-mode noise as common to both lines in relation to earth ground. [1]

According to Murata, a [common-mode choke](https://www.ferritnuve.com/en/sozluk#common-mode-choke) is made up of two conducting wires wound on a single core. Common-mode currents generate flux in the same direction, so the fluxes strengthen each other and the part acts as an inductor. Differential-mode currents, including the working current, generate opposing fluxes that cancel, so the part does not act as an inductor against them. [5]

Two things follow: noise is suppressed even when signal and noise frequencies overlap, and a large differential-mode current does not saturate the core. In parts that act on the differential mode, such as ferrite beads or normal-mode (differential-mode) chokes, large currents saturate the core and performance drops sharply. [5]

## Which part is the right one, and when?

- **Energy storage and line filtering:** DC-DC converters store energy in an inductor, and input line filters are commonly inductor and capacitor combinations. [1]
- **Signal lines and low-current supply rails:** where noise is higher in frequency than the signal, a series ferrite bead works as a low-pass filter. [2]
- **High-speed differential lines:** on USB or HDMI the signal itself is at very high frequency; a bead cannot tell it from noise, a common-mode choke can. [5]
- **Mains input and high-current power lines:** Murata states that common-mode chokes are used to suppress noise in power lines carrying large currents. [5] See [how to choose a common-mode choke](https://www.ferritnuve.com/en/blog/common-mode-choke-selection) and [single-phase EMI filter selection](https://www.ferritnuve.com/en/blog/single-phase-emi-filter-selection).
- **Cables:** Würth Elektronik states that snap-on ferrites are designed to suppress EMI directly on the affected cable, without altering the PCB. [6] See [cable ferrite selection](https://www.ferritnuve.com/en/blog/cable-ferrite-selection).

## Asking Artek about a choke core or a cable ferrite

Send the following in one message:

- The job of the part: energy storage, line filtering, mains input or suppression on a cable.
- Line current, any DC component and the frequency range of the noise to be suppressed.
- For a cable ferrite, the outer diameter of the cable; for a core, dimensions and any readable markings.
- Required quantity.

The Artek catalog lists clip-on round cable ferrites named "Yuvarlak Plastik Kablo Çekirdekleri" in sizes from 6mm to 14.5mm, ferrite toroids used as cores for wound chokes (for example T 25 / 15 / 10 - CF199) and small UU ferrite cores (for example UU 10.5); it does not list SMD chip ferrite beads. See the [ferrite toroid](https://www.ferritnuve.com/en/blog/ferrite-toroid-core-selection) and [UU core](https://www.ferritnuve.com/en/blog/uu-core-selection) guides. [Browse ferrite products in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your question and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What is the difference between a ferrite bead and an inductor?

An inductor stores energy and its impedance is mainly reactance. A ferrite bead uses a ferrite with high loss at high frequencies, so its impedance there is mainly resistance and it dissipates noise energy as heat. [2] [3]

### What is a choke and what does it do?

A choke is an inductor intended to filter or choke out signals. Its impedance rises with frequency, so it passes DC and low-frequency current while opposing high-frequency components. [1]

### What is the difference between a common-mode choke and a differential-mode choke?

A common-mode choke has two windings on one core; the fluxes of the working current cancel, so it acts as an inductor only against common-mode noise. A differential-mode (normal-mode) choke acts on the working current itself and can be saturated by large currents. [5]

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [Murata: Basics of noise countermeasures, lesson 4 — chip ferrite beads](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-4).
- [3] [Texas Instruments: The use and benefits of ferrite beads in gate drive circuits (SLUAAI2)](https://www.ti.com/lit/pdf/sluaai2).
- [4] [Murata: Basics of noise countermeasures, lesson 10 — precautions for using chip ferrite beads](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-10).
- [5] [Murata: Basics of noise countermeasures, lesson 6 — common mode choke coils](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-6).
- [6] [Würth Elektronik: Cable ferrites and cable solutions](https://www.we-online.com/en/components/productnavigator/cable-solutions).
