# How to select the core and air gap for a flyback transformer

A flyback transformer is a multi-winding coupled inductor that first stores energy in the air gap of its core and then delivers it to the output winding. Its core and air gap therefore cannot be read from a power rating alone: primary inductance, maximum peak current and permitted flux density give the number of turns and the required AL value. The air gap follows from that AL value and is corrected by measuring a prototype.

## Why is a flyback transformer not selected like an ordinary transformer?

Texas Instruments places the [flyback transformer](https://www.ferritnuve.com/en/sozluk#flyback-transformer) in the same power inductor family as filter and boost inductors: it takes energy from the circuit, stores it in a magnetic field and returns it. In a true transformer, energy storage is undesirable. Virtually all of the stored energy sits in the [air gap](https://www.ferritnuve.com/en/sozluk#air-gap); the high-permeability core material provides an easy flux path that links this energy to the winding. [1]

For flyback converters TDK asks for low losses at high temperature, very high saturation with low temperature dependence, and gapped cores; for E and U cores it recommends its own materials such as N27, N87, N92 and N97. The same note describes the application area as up to 200 W and a maximum operating frequency of approximately 100 kHz. [2] This is general guidance and does not say how many watts a particular core will handle.

## How do continuous and discontinuous mode change the core choice?

According to Texas Instruments, ripple is small in continuous current mode and a ferrite core is often limited by saturation. In discontinuous mode the total ampere-turns dwell at zero for part of each switching period; because the flux swing is large, core loss often becomes the limit and the permitted flux density drops. In both modes the winding currents are discontinuous, so AC winding loss has to be calculated as well. [1] For wire selection see the [skin effect and litz wire guide](https://www.ferritnuve.com/en/blog/skin-effect-and-litz-wire).

## How are the turns and the required AL value calculated?

For a saturation-limited design the Texas Instruments relation reads N = L × Ipeak / (Bmax × Ae), where L is the primary inductance, Ipeak the primary peak current at the current limit and Ae the effective cross-section. TI gives about 0.3 T as a conservative limit for power ferrite. [1]

A hypothetical example shows the order of the calculation: continuous mode, L = 500 µH, Ipeak = 3 A, Bmax = 0.25 T and the TDK ETD 39/20/13 core (Ae = 125 mm²). [3]

- **Turns:** N = 500 µH × 3 A / (0.25 T × 125 mm²) = 48.
- **Required AL:** AL = L / N² = 500,000 nH / 2304 ≈ 217 nH.

Rounding the turns down raises the flux density above the planned value. [1] The temperature margin needs checking too: for N87, TDK gives a flux density at 10 kHz and 1200 A/m of 490 mT at 25 °C and 390 mT at 100 °C. [5] Core loss and window fit are separate checks.

## How many millimetres of air gap does the AL value give?

For the ETD 39/20/13 in N27 and N87 material, TDK gives an [AL value](https://www.ferritnuve.com/en/blog/turns-and-inductance-from-al-value) of approximately 326 nH with a 0.50 mm gap and 196 nH with a 1.00 mm gap. The table applies to a set made of one gapped and one ungapped half. [3] For values in between, TDK's relation gives s = (AL / K1)^(1/K2), with s in millimetres and AL in nanohenries. For this core at 25 °C, K1 = 196 and K2 = −0.734, valid from 0.10 to 3.00 mm. [3] [4] The 217 nH of the example gives about **0.87 mm**.

The simple relation that ignores core reluctance and fringing flux (gap ≈ µ0 × N² × Ae / L, in SI units) gives about 0.72 mm for the same example. According to Texas Instruments, fringing flux makes the effective gap area larger than the core cross-section, so the gap must also be larger to reach the same inductance. If the prototype measures too high, do not remove turns; increase the gap. If it measures too low, the preferred fix is a shorter gap. [1] TDK asks for production variations to be taken into account additionally. [4] K1 and K2 belong only to the named TDK cores and materials.

## Where should the air gap be placed?

- **Centre leg:** the winding should sit directly over the gap. [1]
- **Spacer:** separating the halves moves part of the gap to the outer legs; the stray flux radiates EMI and makes the inductance harder to predict. [1]
- **Fringing flux:** turns next to the gap can suffer large eddy-current losses, especially in discontinuous mode. TI suggests keeping turns out of that zone or dividing the gap into several smaller gaps. [1]

## Which core shape and winding arrangement are suitable?

Texas Instruments rates the window configuration as extremely important for a flyback transformer. A wide winding breadth reduces the number of layers, the AC resistance and the [leakage inductance](https://www.ferritnuve.com/en/sozluk#leakage-inductance); the creepage distance needed for mains isolation also takes a smaller share of the window. TI therefore considers EC, ETD and LP shapes good choices, and the windows of pot and PQ cores poorly suited. Interleaving the primary and secondary lowers leakage inductance but raises the capacitance between windings. [1] Bobbin and isolation details are in the [SMPS transformer core and bobbin guide](https://www.ferritnuve.com/en/blog/smps-transformer-core-and-bobbin-selection).

## What to send Artek when asking for a flyback transformer core

- Primary inductance, peak current, operating frequency, and continuous or discontinuous mode.
- Input voltage range, output voltages and currents.
- Core type, exact size, material marking and maximum core temperature.
- Target AL value or the gap in millimetres, and whether it sits in the centre leg.
- Bobbin pin layout, isolation standard and quantity.

The Artek catalog includes EE cores (for example EE 25 / 13 / 7 - CF139 and EE 42 / 21 / 15 - CF139) and ETD cores (for example ETD 29 / 16 / 10 - CF139 and ETD 39 / 20 / 13- CF139). The catalog does not state an air gap or AL value, so write them into your request and add the details listed in the [custom transformer enquiry guide](https://www.ferritnuve.com/en/blog/custom-transformer-rfq-guide). Browse the [ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek your requirement](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### How large should the air gap of a flyback transformer be?

There is no single value. The gap is calculated from the required inductance, the number of turns and the core data, then corrected by measuring a prototype. [1]

### Is a spacer between the core halves good enough?

This method splits the gap between the centre and outer legs. The stray flux radiates EMI and the inductance differs from the expected value. [1]

### Can a flyback transformer be wound on a gapped ferrite toroid?

Texas Instruments calls this a very bad choice: a winding spread around the toroid does not conform to discrete gaps, which causes large stray fields and EMI. [1]

## Technical sources

- [1] [Texas Instruments: Inductor and flyback transformer design (SLUP127)](https://www.ti.com/lit/ml/slup127/slup127.pdf).
- [2] [TDK: Ferrites and accessories, application notes](https://www.tdk-electronics.tdk.com/download/531536/badc7640e8213233c951b4540e3745e2/pdf-applicationnotes.pdf).
- [3] [TDK: ETD 39/20/13 core and accessory data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf).
- [4] [TDK: E cores, general information](https://www.tdk-electronics.tdk.com/download/187248/f119bbe0ab3d6dd73ae31c6fa9dcf6b9/pdf-ecores.pdf).
- [5] [TDK: SIFERRIT N87 material data](https://www.tdk-electronics.tdk.com/download/528882/990c299b916e9f3eaf7c5d2bd6e3d0ea/pdf-n87.pdf).
