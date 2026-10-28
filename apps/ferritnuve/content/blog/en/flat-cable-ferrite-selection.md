# How to choose a flat cable ferrite: width, material and mounting for ribbon cables

A flat cable ferrite is a passive part fitted over a multi-conductor ribbon (flat) cable to reduce high-frequency interference carried by the cable. The cable width alone is not enough to choose one; the number of conductors, the ferrite material, the core length and the mounting style all need to be considered together.

## What does a flat cable ferrite do?

Flat cable ferrites are used on multi-conductor flat cables to suppress common-mode conducted EMI. [1] Manufacturers recommend them for common-mode filtering of data lines on ribbon cables in systems such as telecom equipment, machine control and control cabinets. [3] All conductors pass through the same opening; the target is common-mode noise flowing in the same direction on the conductors. [1]

If the cable is round, see the [cable ferrite selection guide](https://www.ferritnuve.com/en/blog/cable-ferrite-selection) instead. A ferrite is not a fix for every connection or data fault either. Record which cable and which conditions are involved before you start selecting a part.

## 1. Measure the cable width and count the conductors

Manufacturers usually list flat cable ferrites by the number of conductors (poles) and the width of the inner opening. [3][4] Parts for the same number of conductors may come in different lengths and outer dimensions. Start by collecting:

- The width and thickness of the cable, ideally with a photograph.
- The number of conductors and the connector type.
- Whether the connector can be removed.
- The usable length, width and height where the ferrite will sit.

A size in the product name does not on its own guarantee the inner opening. Compare the inner opening width and height with the manufacturer's drawing before selecting a part.

## 2. Solid or openable?

With a solid flat ferrite the cable has to be threaded through the opening, which often means fitting it before the connector is attached. Würth offers solid ribbon cable ferrites in different cross-section shapes and lists adhesive tape as a fixing option. [3]

Flat ferrites in a plastic housing that snaps shut can be fitted without removing the cable. [1][4] On some models the lock is opened with a key; the manufacturer describes this as protection against unauthorised removal and notes that the part can be reused for trials in an EMC laboratory. [4] The space inside the device, the bending room for the cable and whether the part will stay in place under vibration are also part of this decision.

## 3. Match the material to the interference frequency

Two flat ferrites of the same size can be made of different materials and work in different frequency ranges. For example, in the same flat cable format Fair-Rite describes its MnZn 31 material for EMI suppression from 1 MHz up to 500 MHz, and recommends its NiZn 43 material for conducted EMI from 20 to 250 MHz. [1][2]

So do not choose a part just because it fits the cable. Compare the impedance-versus-frequency data in the datasheet with the problem band you have measured. If the frequency is unknown, say so instead of entering a guess.

## 4. Core length affects impedance

Among parts for the same number of conductors, a longer core usually gives higher impedance. For Würth's 21-conductor ribbon cable ferrites, the 8 mm long part is listed at 48 Ω at 100 MHz, the 12 mm part at 60 Ω and the 20 mm part at 85 Ω. [3] In the same manufacturer's 50-conductor locking series, the 19.6 mm long part is listed at 126 Ω and the 33.1 mm part at 179 Ω. [4]

These values belong to that manufacturer's own parts and must not be carried over to another product with a similar name or size. The example only shows the order of selection: if the installation space allows, a longer core can be considered, but the result must be tested on the actual device.

## 5. Read the datasheet impedance correctly

The impedance of flat cable ferrites is usually measured with a single, centred pass of the conductor using an impedance analyser. [1] The values in the tables are mostly typical values. Fair-Rite states that minimum impedance is specified only at the marked frequencies and is typically about 20% below the listed value. [1]

When comparing two parts, read the impedance at the same frequency and under the same test condition. The real cable, device and mounting position differ from the test set-up. Compare the ferrite's effect on the device itself while keeping the other conditions the same.

## What to send Artek for a flat cable ferrite enquiry

Put the following in a single message, and mark anything you do not know as "unknown" instead of guessing:

- Cable width, thickness and number of conductors.
- Connector type and whether the cable can be removed.
- Preference for a solid part or an openable, locking one.
- Dimensions of the installation space and any need for adhesive fixing.
- If known, the interference frequency and the manufacturer and part number of the current ferrite.
- Required quantity.

You can [browse the flat cable ferrites in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=YASSI) or [send Artek an enquiry](https://www.ferritnuve.com/en/contact) with a photograph of the cable and your application details.

## Frequently asked questions

### What is the difference between a flat cable ferrite and a round cable ferrite?

Both are used to reduce interference carried by a cable, but their openings are shaped for different cable cross-sections. A flat cable ferrite has an opening that lets all conductors of a ribbon cable pass side by side. A round cable needs a cable ferrite with a round opening.

### What frequencies does a flat cable ferrite work at?

That depends on the ferrite material and the part. For example, Fair-Rite describes its MnZn 31 material for 1–500 MHz and its NiZn 43 material for 20–250 MHz in its flat cable parts. After selection, the effect should be tested on the actual device.

### What is a key-locked flat ferrite for?

The lock prevents the ferrite from being removed from the cable without authorisation. Because it can be opened with the key, the same part can be reused in an EMC laboratory for trials on different cables or positions.

## Technical sources

- [1] [Fair-Rite: 43 material Flat Cable Snap-It core (0443164051)](https://fair-rite.com/product/flat-cable-snap-its-443164051).
- [2] [Fair-Rite: 31 material Flat Cable Snap-It core (0431164051)](https://fair-rite.com/product/flat-cable-snap-its-431164051/).
- [3] [Würth Elektronik: WE-FLAT ribbon cable suppressors](https://www.we-online.com/catalog/en/WE-FLAT).
- [4] [Würth Elektronik: WE-STAR-FLAT locking ribbon cable suppressor](https://www.we-online.com/catalog/en/article/74272475).
