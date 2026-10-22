# Build a custom stock system instead of adopting an ERP

Artek has no stock or accounting software today (stock lives in notebooks and Excel), so there is no system to integrate with or replace. We decided to build our own rather than adopt Odoo, Paraşüt, Logo or Katana: the system has to fit Artek's split between reselling trade goods and building custom transformers, and we may later offer it as SaaS to other Turkish companies. The cost is a long build that a small team owns entirely; this is why the plan ships in narrow, verifiable phases.

## Consequences

The system is built for Artek alone: no company/tenant id on records. Selling it as SaaS later means adding tenancy to every table, query and permission check as a dedicated migration project. We accepted that cost over carrying tenancy we don't use yet. Locations and product types are still stored as data, not hard-coded, so a second company's setup would not need code changes there.
