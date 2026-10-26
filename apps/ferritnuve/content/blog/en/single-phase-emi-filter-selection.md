# How to choose a single-phase EMI filter: current, leakage and installation

Choosing an EMI filter requires more than asking whether it should be rated at 3 A or 6 A. Alongside supply voltage and current, check temperature, interference frequency, leakage-current requirements and mounting construction. A suitable candidate must be verified under the equipment's actual operating conditions.

## Are EMI and EMC filters the same thing?

EMI means electromagnetic interference; EMC concerns equipment operating compatibly in its electromagnetic environment. You may encounter the names EMI filter and EMC filter for the same type of mains filter. Similar names, however, do not establish identical electrical and mechanical characteristics. [1]

This guide focuses on assessing filter candidates for a single-phase mains input. Selecting a filter does not mean the device meets every EMC requirement: the complete equipment must be assessed. [1][2]

## 1. Identify the supply and actual input current

The manufacturer's conditions for rated voltage, supply type and frequency must match the application. Instead of calculating a current directly from the power supply's output power alone, use the actual input conditions and manufacturer input-current data. [2]

A 6 A marking does not automatically make a filter suitable for every 6 A application. Check temperature and manufacturer operating limits too. A higher current rating alone does not mean better interference suppression.

Include the following in a quotation request:

- AC or DC supply type, voltage range and frequency.
- Maximum continuous equipment input current and known transient conditions.
- Ambient temperature and ventilation around the filter.
- Exact existing filter model or the equipment's input-rating label.

## 2. Identify the problematic frequency range

Filter datasheets may include attenuation or insertion-loss curves. These apply to the stated measurement conditions. A result from a standard test setup does not guarantee the same attenuation in equipment with different source and load impedances. [3]

Do not look only at the highest dB figure on a curve. Compare the frequencies where the problem was measured and the conditions used for the curve. When comparing several candidates, test them in the same equipment arrangement. [2][3]

## 3. Distinguish common mode and differential mode

Manufacturer curves may show separate common-mode and differential-mode results. The interference path and filter connections matter when evaluating a solution. One curve should not be read as the filter's performance under every condition. [3]

If you have a measurement report, include the relevant page with your enquiry. Without a report, describe the equipment, load and circumstances under which the problem occurs. Concrete operating conditions are more useful than simply saying there is interference.

## 4. Do not overlook leakage-current requirements

Check the leakage-current data and the conditions under which it was measured. Low-leakage options may exist within the same family, but their attenuation characteristics also require assessment. Suitability cannot be established from the words “low leakage” alone without knowing the system requirements. [2][3]

Assess this together with the application's safety and system-design requirements. If the leakage-current limit is unknown, state that clearly in the technical enquiry. This guide does not provide live-circuit wiring or measurement instructions. Mains-side work must be carried out by qualified technical personnel following manufacturer instructions.

## 5. Choose the mechanical construction and installation together

IEC inlet filters, chassis-mounted filters and power-entry modules offer different mechanical solutions. Check the panel cut-out, enclosure dimensions, terminals and additional functions such as a fuse or switch separately. [4]

The cable arrangement around the filter can also influence EMC behaviour. When replacing a part, examine connection orientation, cable routing and the manufacturer's enclosure and grounding instructions as well as case dimensions. [1][2]

## How can you assess whether a filter is effective?

Record a baseline with the existing filter or without the candidate filter. Keep the load, cable arrangement and test conditions consistent when evaluating alternatives. Check temperature and other application limits alongside changes at the interference frequency. Verify the final decision using the tests required for the system. [1][2]

An approval mark on a component does not give the complete equipment the same approvals. Treat current documentation for the exact component model and the equipment assessment as separate matters.

## What to include in a filter enquiry to Artek

Share the supply type and voltage, maximum input current, ambient temperature, known leakage-current limit and problematic frequencies. Include a photograph of the existing label, connection type, dimensions and quantity. [Browse power and EMI filters](https://www.ferritnuve.com/en/products?categories=PEM) or [send your application details to Artek](https://www.ferritnuve.com/en/contact).

## Frequently asked questions

### Is an external filter needed if the power supply already has one?

The requirement depends on the complete equipment, whose conditions may differ from the power supply's standalone test. Cable arrangement and load can create a need for additional filtering. Support the decision with measurements. [2]

### Can two filters with the same current rating replace each other?

Current is only one criterion. Compare voltage, temperature, leakage current, attenuation conditions, terminal construction and mounting compatibility too. [2][3][4]

## Technical sources

- [1] [SCHURTER: Industrial mains filters and EMC information](https://www.schurter.com/en/knowledge/industrial-mains-filters).
- [2] [TDK-Lambda: Selecting an external EMI filter for a power supply](https://blog.uk.tdk-lambda.com/uk/2015/07/09/how-do-i-select-an-external-emi-filter-for-use-with-a-power-supply/).
- [3] [TE Connectivity / Corcom: Technical notes on insertion loss and leakage current](https://www.te.com/content/dam/te-com/documents/industrial-intelligent-buildings/global/7_Tech%20Notes_Catalog.pdf).
- [4] [Delta Electronics: EMI filter types](https://www.deltaww.com/en-US/products/EMI-Filters).
