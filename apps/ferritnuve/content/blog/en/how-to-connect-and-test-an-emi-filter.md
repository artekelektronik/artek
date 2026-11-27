# How to connect and test an EMI filter

An EMI filter is a circuit, usually low-pass, that is connected between the mains and a device: the line side goes to the supply and the load side goes to the equipment. Protective earth is connected first, the metal case is bonded to reference ground over a large area, and the cables on the two sides of the filter are routed apart. The result is verified by measuring the interference voltage on the finished equipment.

## Which safety rules apply before connecting?

Work on a mains filter carries a risk of electric shock. TDK's data sheet for the B84773 series of IEC inlet filters requires that only qualified electricity specialists plan, assemble, install, operate, repair and maintain it. The same document states that the filter contains charge-storing components and that dangerous voltages can remain at its terminals for longer than five minutes after the power is switched off. [2]

For installation and removal, TDK lists these steps: disconnect, prevent reconnection, verify that no voltage is present, earth and short-circuit where required, and cover or separate adjacent live parts. [1] This article is general information; it does not replace the data sheet of your part or the standard that applies to your equipment.

## What is inside an EMI filter circuit?

TDK describes an EMC filter as a circuit of inductors, capacitors and resistors that is virtually always low-pass. The key elements of what is commonly called an [EMI filter](https://www.ferritnuve.com/en/sozluk#emi-filter) are typically X capacitors between the lines, differential-mode chokes, Y capacitors between line and ground, current-compensated chokes and discharge resistors. [1] Two-line filters are used in DC or single-phase applications. [1] TDK notes that reducing [common-mode](https://www.ferritnuve.com/en/sozluk#common-mode) interference with current-compensated chokes and Y capacitors requires a well-designed grounding and wiring system. [1] For the underlying terms, see [EMI, EMC and RFI explained](https://www.ferritnuve.com/en/blog/emi-emc-rfi-explained).

## Which terminals go to the mains and which to the device?

The data sheet names the terminals. In the TDK B84773 series, for example, the line side is an IEC C14 inlet and the load side is 6.3 × 0.8 mm tab connectors. [2] Another part may be arranged differently, so follow the markings on its case and its circuit diagram.

The protective earth connection is the first to be made at installation and the last to be disconnected. The filter must also be protected by overcurrent circuitry against exceeding its rated current. [2]

## How should the case and earth be connected?

TDK separates two jobs: the protective earth (PE) conductor connection is a safety measure against hazardous body currents, while large-area grounding of the case is needed for the filter to suppress interference. [1] One does not replace the other.

- Seat the filter case over a large area on a bright metal mounting plate, and connect the plate to the cabinet at low inductance. [1]
- If a ground strap is needed, keep it short. TDK prefers flat copper ribbon over a round conductor; its rule of thumb is a length-to-width ratio below three. [1]

[Leakage current](https://www.ferritnuve.com/en/sozluk#leakage-current-of-a-mains-filter) needs its own check. For leakage currents above 3.5 mA, the B84773 data sheet requires a stationary PE conductor of the required cross-section, mounted before operation and secured against disconnection. [2] TDK's general guidance is that where a residual current device is used, the leakage current of the whole system must not exceed half of its rated tripping current. [1]

## How should the cables be routed?

Interference can couple between cables that run side by side, so cable layout is part of the filter's job. [1] TDK recommends the following:

- Separate the clean lines between mains and filter from the contaminated lines between filter and interference source, and avoid running them in parallel. [1]
- Run signal and power cables apart, with a recommended minimum distance of 20 cm. Where they cross, use a right angle if possible. [1]
- Place the filter as directly as possible at the cabinet or case inlet, and keep the lines from the interference source short. [1]
- Connect cable shields to reference potential at both ends over a large area, and avoid twisted shield pigtails. [1]

The mounting position must not impair natural convection; TDK generally excludes overhead mounting. [1]

## How is an EMI filter tested?

Conducted interference is measured with a line impedance stabilisation network (LISN), temporarily connected in series with the power input, and a spectrum analyser. The LISN provides a consistent source and measurement impedance, which makes results repeatable. [1][3] According to TDK, conducted emission limits are usually specified from 150 kHz to 30 MHz. [1]

The Texas Instruments procedure for DC-DC converters is to measure first without the added filter under the worst case, the highest input current, and then determine the attenuation required. Both lines are scanned and the higher result is used. TI also warns that tightly coiled power cords may falsely lower the reading, and that the bench arrangement required by the standard must be followed for certified tests. [3]

The insertion loss curve in a data sheet is normally taken in a 50 Ω setup and serves for comparison. Impedances in a real application differ, so a precise assessment requires measuring the equipment with the filter fitted. [1] To compare candidates, see [single-phase EMI filter selection](https://www.ferritnuve.com/en/blog/single-phase-emi-filter-selection).

## What to send Artek about a filter connection

Include the following in your request:

- Supply type, voltage, frequency and the highest continuous current.
- The leakage current limit and the problem frequency range, if known.
- The model code of the existing filter, a photo of its label, terminal type and mounting dimensions.
- Quantity.

The Artek catalog lists “6 A EMI Filter” (6ET1-F7003) and power filter entries with the codes 03GENG3U-R and IH-0342-H. For connection direction and limit values, rely on the manufacturer's data sheet for the specific part. You can [browse power and EMI filters](https://www.ferritnuve.com/en/products?categories=PEM) or [send Artek a request](https://www.ferritnuve.com/en/contact) with these details.

## Frequently asked questions

### Can the line and load sides of an EMI filter be swapped?

The manufacturer defines the terminals as line side and load side, and the connection should follow that definition and the circuit diagram of the part. Do not assume that data sheet values still apply to a reversed connection. [2]

### Can an EMI filter be used without earthing?

On a filter with a metal case and a PE terminal, protective earth must be connected before the equipment is operated. Interference suppression also needs a large-area connection from the case to reference ground. [1][2]

### Is it safe to touch the filter terminals right after switching off?

No. According to TDK's B84773 data sheet, dangerous voltage can remain for longer than five minutes, and qualified personnel should verify that no voltage is present. [2]

## Technical sources

- [1] [TDK Electronics: EMC filters, technical information and mounting instructions](https://www.tdk-electronics.tdk.com/download/528632/7f30b0110a521bb506ace36f0c56af5c/pdf-technical-information.pdf).
- [2] [TDK Electronics: B84773 series IEC inlet EMC filter data sheet](https://www.tdk-electronics.tdk.com/inf/30/ds/b84773.pdf).
- [3] [Texas Instruments: AN-2162, conducted EMI from DC-DC converters (SNVA489C)](https://www.ti.com/lit/an/snva489c/snva489c.pdf).
