# What are EMI, EMC and RFI? Where ferrites and filters fit in EMC testing

EMI (electromagnetic interference) is unwanted electrical energy that disturbs the operation of a device; EMC (electromagnetic compatibility) is the ability of a device to work without disturbing nearby equipment and without being disturbed by it. RFI (radio-frequency interference) is an older, narrower term used interchangeably with EMI. EMI filters and ferrites reduce the interference; compatibility itself is shown by measurements on the finished product.

## What do EMI, EMC and RFI mean?

Vishay defines [EMI](https://www.ferritnuve.com/en/sozluk#emi), electromagnetic interference, as unwanted electrical energy in any form; the term is often used interchangeably with “noise”. RFI, radio-frequency interference, is an older and more restrictive term used interchangeably with EMI. [1]

[EMC](https://www.ferritnuve.com/en/sozluk#emc) is not a disturbance but a property. According to TDK, it means that a device does not influence other devices through undesired emissions and is not influenced by emissions from other devices. TDK also quotes the definition in the European EMC directive 2014/30/EU: the ability of equipment to function satisfactorily in its electromagnetic environment without introducing intolerable electromagnetic disturbances to other equipment. [2]

That definition has two sides. Murata calls stopping a device from producing noise an emission countermeasure, and making the receiving device work without errors even when noise arrives an immunity countermeasure; together they are EMC countermeasures. [3]

## At which frequencies are conducted and radiated emissions measured?

Interference travels along conductors (conducted) or as a field (radiated). According to TDK, at low frequencies interference can be assumed to spread only along conductive structures, and in the MHz range increasingly by fields and electromagnetic radiation. [2]

The measurement ranges follow this split. TDK states that limit requirements for conducted emission are usually given from 150 kHz to 30 MHz, and for some products also from 9 kHz to 150 kHz. Radiated interference is most often measured at a distance of 10 m or 3 m, from 30 MHz to 1 GHz or even higher. [2] The range and limit that apply depend on the standard the product falls under.

## Why do common-mode and differential-mode noise need different components?

Conducted interference has two parts. A differential-mode interference current flows out on one line and back on the other, just as the line current does. A [common-mode](https://www.ferritnuve.com/en/sozluk#common-mode) interference current, produced through parasitic capacitances, flows in the same direction along both lines and returns to the source through ground. [2]

According to TDK, conducted interference up to several hundred kHz is mainly differential mode, while common-mode interference becomes dominant above several MHz. [2] Because the current paths differ, so do the components:

- **For differential mode:** X capacitors, connected between phase and neutral or between two phases, and series inductors (differential-mode chokes). [2]
- **For common mode:** Y capacitors, connected between phase or neutral and ground, and current-compensated (common-mode) chokes. [2]

A common-mode choke separates the two modes by its winding direction. Murata explains that the fluxes of common-mode currents point the same way and reinforce each other, while those of differential-mode currents cancel. The coil therefore acts as an inductor only for common mode, and its core does not saturate under a large line current. [4]

## What is inside a mains EMI filter?

TDK defines an EMC filter as a circuit of inductors, capacitors and resistors that limits interference in power networks. It is virtually always a low-pass filter: it passes the usable frequency (typically DC to 60 Hz) and weakens interference frequencies. The key components are typically X capacitors, differential-mode chokes, Y capacitors, current-compensated chokes and discharge resistors. [2]

EMC filters act predominantly on conducted interference. [2] For the selection steps, see the [single-phase EMI filter selection guide](https://www.ferritnuve.com/en/blog/single-phase-emi-filter-selection).

## Where does a cable ferrite help, and where does it not?

According to Murata, if a cable is connected to a circuit, common-mode current also flows through the cable and is released as radio waves; the cable behaves as an antenna. [4] A cable ferrite is used against this current. Würth Elektronik describes cable ferrites as sleeves or rings that create a resistive and inductive series impedance; placed over a cable, such a sleeve can reduce the radiation of high-frequency energy from it. [5]

The same document shows the limits:

- The impedance depends on frequency and on the material; the interference frequency range and the material properties must match. [5]
- In Würth's two-wire measurement, passing both wires through the ferrite gave no attenuation of differential-mode interference between 100 kHz and 50 MHz. [5]
- If a high direct current flows through the cable, a high permeability quickly saturates the sleeve; routing the return conductor through the sleeve as well almost completely compensates for this. [5]

For choosing a part, see the [cable ferrite selection](https://www.ferritnuve.com/en/blog/cable-ferrite-selection) and [flat cable ferrite selection](https://www.ferritnuve.com/en/blog/flat-cable-ferrite-selection) guides.

## What is measured in an EMC test? Does one component make a product compliant?

TDK notes that EMC measurements distinguish between emission testing and susceptibility testing. Conducted emission is measured with a receiver through a line impedance stabilisation network (LISN) at the supply input; radiated emission in a full or semi-anechoic chamber. Examples of susceptibility tests are electrostatic discharge (ESD), fast transients (burst) and surge voltages. [2]

When placing a device on the market, the manufacturer must use a declaration of conformity to verify that it meets the applicable EMC directives, and EMC measurements are usually needed for this. [2] Compatibility is therefore demonstrated by measuring the finished product. A filter or a ferrite is one measure that contributes to that result; on its own it does not make a product compliant.

## Asking Artek about an EMI filter or a cable ferrite

Share the following in your request:

- The type of problem (conducted or radiated) and the frequency range, if known.
- For a filter: mains voltage, line current and number of phases.
- For a cable ferrite: outer diameter of the cable, or the width of the flat cable.
- Required quantity.

The Artek catalog lists power/EMI filters (including the entry “6 A EMI Filter”), the clip-on round cable ferrites “Yuvarlak Plastik Kablo Çekirdekleri” from 6mm to 14.5mm, and the flat cable ferrite “Yassı Parazit Önleyici Flex Kablo Filtresi”. [Browse power and EMI filters in the catalog](https://www.ferritnuve.com/en/products?categories=PEM) or [send Artek your request](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What is the difference between EMI and EMC?

EMI is the interference itself, that is, unwanted electrical energy. EMC is the property of a device that neither disturbs its surroundings through undesired emissions nor is disturbed by the emissions of other devices. [1][2]

### How is an EMC test carried out?

Emission and susceptibility are tested separately. According to TDK, conducted emission is usually measured from 150 kHz to 30 MHz through a line impedance stabilisation network, and radiated emission from 30 MHz upwards in an anechoic room. [2]

### Will fitting a cable ferrite make a product pass an EMC test?

Not by itself. A cable ferrite adds a series impedance against the interference current, but that impedance depends on frequency and material; the result is confirmed only by measuring the finished product. [5]

## Technical sources

- [1] [Vishay: Inductor and magnetic product terminology (document 34053)](https://www.vishay.com/docs/34053/definit.pdf).
- [2] [TDK Electronics: EMC filters, general technical information](https://www.tdk-electronics.tdk.com/download/528632/7f30b0110a521bb506ace36f0c56af5c/pdf-technical-information.pdf).
- [3] [Murata: Basics of noise countermeasures, Lesson 1 — What is an EMI filter?](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-1).
- [4] [Murata: Basics of noise countermeasures, Lesson 6 — Common mode choke coils](https://article.murata.com/en-us/article/basics-of-noise-countermeasures-lesson-6).
- [5] [Würth Elektronik: ANP115 — Cable ferrites and nanocrystalline sleeves for automotive applications](https://www.we-online.com/components/media/o785206v410%20ANP115_EN.pdf).
