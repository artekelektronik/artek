# How to choose a UU ferrite core: checklist for line filters and power transformers

A UU core is formed by joining two U-shaped ferrite halves to make a closed magnetic path. Small UU cores are used in mains line filter chokes, and large U cores in power transformers at kilowatt level. A name such as “UU25” is not enough to select the right part: check the full dimensions, the UU or UI combination, the material and which core set the AL value refers to.

## Where are UU cores used?

Small UU cores are common in chokes that suppress common-mode interference on AC mains lines. KEMET states that its SU series common-mode chokes are designed with ferrite UU cores and lists audio-visual equipment, office equipment, digital appliances and power supplies as applications. [1] TDK also lists current-compensated U-core chokes as a separate group among its power line chokes. [2]

Large U cores are used in high-power transformers. TDK specifies the U 93/76/30 core for power transformers above 1 kW at 20 kHz. [3] The two-leg shape also allows windings to be placed on separate legs.

The Artek catalog includes UU cores from small sizes such as UU 9.8 and UU 10.5 up to UU 126 / 45 / 20, as well as UUR 55 and UUR 64 / 40 cores with round legs.

## 1. Complete the short name with full dimensions

The same short name can refer to different geometries. The Artek catalog entry UU 25 / 19 / 7.5 and the U 25/20/13 cores from TDK and Ferroxcube both start with “25” but are not the same size. [4][5] Give all three dimensions in an enquiry instead of writing only “UU25”.

If you are replacing an existing part, record the following from a drawing or measurement:

- Overall length, height and thickness.
- Winding window width and height.
- Leg cross-section: rectangular or round (UU or UUR).
- Whether a bobbin, clip or other fixing part is used.

## 2. UU or UI? The combination changes the AL value

A U half can be closed with a second U (UU) or with a straight I piece (UI). This choice changes the magnetic path length and therefore the AL value. In TDK's U 93/76/30 document the effective area is 840 mm² for both combinations, while the effective path length is 354 mm for UU and 258 mm for UI. In N87 material the AL value is given as 5700 nH for the UU set and 7900 nH for the UI set. [3]

The same document states that the AL value applies to a set of two ungapped cores and that the cores are delivered as single units. [3] In your order, state the combination, the unit of quantity (single half, pair or set with I piece) and the air gap if required.

## 3. Same name, different manufacturer data

Manufacturers give different materials, tolerances and test conditions for cores of the same size. For U 93/76/30, TDK gives AL = 5700 nH (+30/−20%) in N87 and specifies losses at 100 mT, 25 kHz and 100 °C. [3] Ferroxcube gives AL = 6400 nH (±25%) in 3C90 and specifies losses at 200 mT, 25 kHz and 100 °C. [6] Because the conditions differ, these loss values cannot be compared directly.

The Artek catalog also has separate UU 93 / 76 / 30 entries marked CF139 and EPCOS. When looking for a replacement, share the manufacturer and material marking of the existing part, and do not assign another manufacturer's data to a part with a similar name.

## 4. Material and frequency for a line filter choke

The purpose of a filter choke is to suppress interference in a particular frequency band. KEMET states that the material should be selected for the target frequency band: high-permeability materials are effective at lower frequencies and lower-permeability materials at higher frequencies. MnZn materials are mainly used against conducted noise and NiZn materials against radiated noise. [1]

The same source stresses that the effective frequency range depends on core shape, size and number of turns, and that effectiveness should be tested on the actual device. [1] In your enquiry, share the rated current, target inductance, line voltage, problem frequency band and whether vertical or horizontal mounting is needed.

## 5. Mechanical and thermal checks for large power transformers

Large U cores are heavy: TDK gives a mass of 1500 g for the U 93/76/30 UU set. [3] Ferrite is a ceramic material and is sensitive to shock, fast temperature changes and tensile load. Mechanical stress in the core lowers the initial permeability and affects the AL value, so fixing and potting materials should be as elastic as possible. [3]

Ferrite cores can run hot at high flux densities and frequencies. [3] In the application, verify temperature rise, losses and saturation separately.

## How to request a UU core from Artek

Collect the following in a single message. If you do not know a value, mark it as unknown instead of guessing:

- Full dimensions or a drawing, and a photograph of the existing part.
- UU, UI or UUR combination and the unit of quantity.
- Any readable manufacturer and material marking.
- Target AL, tolerance and air gap, if known.
- Application (line filter choke or power transformer), frequency and current.
- Required quantity.

[Browse ferrite cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit) or [send Artek drawings and application details](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### What is the difference between a UU core and a UI core?

A UU set consists of two U halves; a UI set consists of one U half and a straight I piece. The UI combination has a shorter magnetic path, and for the same U part the AL value is higher. [3]

### How many watts can a UU core handle?

Core size alone does not give a fixed power rating. Material, frequency, winding arrangement and permitted temperature rise must be assessed together. Power statements in manufacturer documents only apply to the stated conditions. [3]

### What currents are UU-core line filter chokes used for?

That depends on the choke design. As an example, TDK lists its current-compensated U-core choke series for 0.4–2.6 A and 300 V AC. [2]

## Technical sources

- [1] [KEMET: SU9V/9H common-mode choke datasheet](https://yageogroup.com/content/datasheet/asset/file/KEM_LF0016_SU9V-9H).
- [2] [TDK: Power line chokes product catalog](https://www.tdk-electronics.tdk.com/en/530144/products/product-catalog/emc-components/power-line-chokes).
- [3] [TDK: U 93/76/30 and I 93/28/30 core data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_93_76_30.pdf).
- [4] [TDK: U 25/20/13 core data](https://www.tdk-electronics.tdk.com/inf/80/db/fer/u_25_20_13.pdf).
- [5] [Ferroxcube: U25/20/13 core data](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/U25_20_13.pdf).
- [6] [Ferroxcube: U93/76/30 core data](https://www.ferroxcube.com/upload/media/product/file/Pr_ds/U93_76_30.pdf).
