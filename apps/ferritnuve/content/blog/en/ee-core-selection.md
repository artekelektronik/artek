# How to choose an EE ferrite core: EE25 and EE42 replacement checks

An EE core replacement needs checks for material, air gap, AL value and assembly fit as well as external dimensions. Names such as EE25 and EE42 narrow the search, but do not establish that a candidate will preserve the electrical and thermal behaviour of an existing winding.

## Identify the part being replaced

Designing a new transformer and replacing its core have different starting points. For a replacement, establish which features must be preserved. Record markings, photographs of both halves and the manufacturer's part number if available. Include a ruler in photographs, but use a drawing or direct measurements for dimensions.

State whether you need the core alone or a complete assembly with a bobbin. If the winding and PCB must remain, mechanical compatibility becomes especially important. For a new design, describe the input/output conditions, topology and operating frequency first.

## 1. Complete EE25 and EE42 names with full dimensions

Use the full designation rather than a short family name. Artek's catalog contains separate EE 42 / 21 / 15 and EE 42 / 21 / 20 entries. Asking for either simply as “EE42” leaves the required geometry unclear.

Compare the outer dimensions, centre leg and winding window against the manufacturer's drawing. TDK's E25/13/7 and E42/21/15 documents also specify effective magnetic parameters. These illustrate the checking method; they do not establish the manufacturer or specifications of a similarly named Artek catalog item. [1][2]

## 2. Read the material grade with its manufacturer

After checking geometry, verify the material. TDK's E25 document lists several materials for the same shape, with losses stated under defined frequency, flux density and temperature conditions. [1]

A question such as “Can N87 replace CF139?” therefore needs the actual parts' documentation and operating conditions. A grade name or online cross-reference alone does not settle it. Do not assign another manufacturer's loss curve to an unidentified material.

## 3. Compare AL and air gap for the assembled set

Check which core set and test conditions an AL value describes. One gapped half combined with one ungapped half is a different set definition from two gapped halves. TDK's E42 document explicitly identifies the combination to which its gap-related AL values apply. [2]

Include the target AL, tolerance and gap arrangement where known. “Gapped EE42” is an incomplete specification. If the winding stays in place, verify the candidate set's inductance and behaviour in the application.

## 4. Check the bobbin, pins and fixing method

A core fitting inside a bobbin does not establish complete assembly compatibility. Compare these points using drawings or samples:

- Bobbin opening, winding space and total assembly height.
- Horizontal or vertical mounting, pin spacing and PCB hole pattern.
- Clearance for clips, tape or other fixing parts.
- Space for the winding and insulation arrangement.
- Whether the requested unit is one half, a pair or a set with accessories.

Specify required bobbins and accessories separately rather than assuming they are included with the core.

## 5. Validate the replacement in its application

A similar initial inductance is useful evidence, but it is not the only acceptance criterion. Operating current, losses and temperature rise also need assessment. Saturation and thermal limits are separate magnetic design checks. [3]

For example, when preserving an existing winding, review the candidate set's drawing and material documentation first. Follow with electrical and thermal verification under defined operating conditions. Establish the result before describing the part as a direct replacement.

## Sending an EE core enquiry to Artek

Provide full dimensions, existing manufacturer/model, readable material markings, AL and gap information, bobbin requirements and quantity. Mark unknown fields as unknown. [Browse EE cores in the catalog](https://www.ferritnuve.com/en/products?categories=Ferrit&productTypes=EE) and [send Artek your enquiry](https://www.ferritnuve.com/en/contact) with photographs or drawings.

## Frequently asked questions

### How many watts is an EE25 suitable for?

Size alone does not establish a fixed power rating. Topology, frequency, material, winding arrangement and permitted temperature rise must be assessed together. [3]

### Do matching dimensions and AL prove equivalence?

No. Material losses, tolerances, gap arrangement and mechanical fit still need checking. Matching two parameters completes only part of the assessment.

## Technical sources

- [1] [TDK: E25/13/7 core and accessories](https://www.tdk-electronics.tdk.com/inf/80/db/fer/e_25_13_7.pdf).
- [2] [TDK: E42/21/15 core data and set definition](https://www.tdk-electronics.tdk.com/inf/80/db/fer/e_42_21_15.pdf).
- [3] [Texas Instruments: Inductor and flyback transformer design](https://www.ti.com/lit/ml/slup127/slup127.pdf).
